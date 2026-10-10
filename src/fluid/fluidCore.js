// fluidCore.js
// 2D 不可壓縮流體（MAC 網格）＋三層純量場：
//   foam  — 浮在液面上的白色奶泡
//   tint  — 沉入 espresso 底下、把液面染成焦糖色的牛奶
//   crema — 咖啡油脂層的厚度（決定深棕色斑紋）
// 純量場使用 MacCormack 平流並以鄰格極值限制，讓拉花線條保持銳利。

export const U_FIELD = 0;
export const V_FIELD = 1;

export class Fluid {
  constructor(resolution) {
    this.N = resolution;
    this.numX = resolution + 2;
    this.numY = resolution + 2;
    this.numCells = this.numX * this.numY;
    this.h = 1.0 / this.numX;

    const cells = this.numCells;
    this.u = new Float64Array(cells);
    this.v = new Float64Array(cells);
    this.newU = new Float64Array(cells);
    this.newV = new Float64Array(cells);
    this.s = new Float32Array(cells);
    // 每個格子的體積源（>0 往外推、<0 往內吸），由工具每一步寫入
    this.src = new Float32Array(cells);

    // 格心速度與渦度暫存
    this.uc = new Float32Array(cells);
    this.vc = new Float32Array(cells);
    this.curl = new Float32Array(cells);
    this.fx = new Float32Array(cells);
    this.fy = new Float32Array(cells);

    this.foam = new Float32Array(cells);
    this.tint = new Float32Array(cells);
    this.crema = new Float32Array(cells);
    this.tmpA = new Float32Array(cells);
    this.tmpB = new Float32Array(cells);
    this.tmpC = new Float32Array(cells);

    this.time = 0;
    this.setupCircularBoundary();
  }

  idx(i, j) {
    return i * this.numY + j;
  }

  // 圓形杯壁：杯外為固體，並建立「鬼格」對照表讓平流取樣不會吸到杯外的空值
  setupCircularBoundary() {
    const n = this.numY;
    const h = this.h;
    this.radius = 0.5 - 1.5 * h;
    const r2 = this.radius * this.radius;
    let fluidCount = 0;

    for (let i = 0; i < this.numX; i++) {
      for (let j = 0; j < this.numY; j++) {
        const dx = (i + 0.5) * h - 0.5;
        const dy = (j + 0.5) * h - 0.5;
        const inside = dx * dx + dy * dy < r2;
        this.s[i * n + j] = inside ? 1.0 : 0.0;
        if (inside) fluidCount++;
      }
    }
    this.fluidCount = fluidCount;

    const dst = [];
    const srcIdx = [];
    for (let i = 0; i < this.numX; i++) {
      for (let j = 0; j < this.numY; j++) {
        if (this.s[i * n + j] !== 0.0) continue;
        let best = -1;
        let bestD = Infinity;
        for (let di = -2; di <= 2; di++) {
          for (let dj = -2; dj <= 2; dj++) {
            const ii = i + di;
            const jj = j + dj;
            if (ii < 0 || jj < 0 || ii >= this.numX || jj >= this.numY)
              continue;
            if (this.s[ii * n + jj] === 0.0) continue;
            const d = di * di + dj * dj;
            if (d < bestD) {
              bestD = d;
              best = ii * n + jj;
            }
          }
        }
        if (best >= 0) {
          dst.push(i * n + j);
          srcIdx.push(best);
        }
      }
    }
    this.ghostDst = Int32Array.from(dst);
    this.ghostSrc = Int32Array.from(srcIdx);

    // 壓力求解用：流體格清單、鄰格遮罩（左右下上 = 1,2,4,8）與 1 / 鄰格數
    // 紅黑棋盤順序：先解 (i + j) 為偶數的格子再解奇數，避免固定掃描方向造成的偏斜
    const cells = [];
    const masks = [];
    const inv = [];
    for (let parity = 0; parity < 2; parity++)
      for (let i = 1; i < this.numX - 1; i++) {
        for (let j = 1; j < this.numY - 1; j++) {
          const c = i * n + j;
          if ((i + j) % 2 !== parity) continue;
          if (this.s[c] === 0.0) continue;
          const m =
            (this.s[c - n] ? 1 : 0) |
            (this.s[c + n] ? 2 : 0) |
            (this.s[c - 1] ? 4 : 0) |
            (this.s[c + 1] ? 8 : 0);
          const sum =
            (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1) + ((m >> 3) & 1);
          if (sum === 0) continue;
          cells.push(c);
          masks.push(m);
          inv.push(1 / sum);
        }
      }
    // 碰到固體格子的速度面（清除用）
    const wallU = new Set();
    const wallV = new Set();
    for (let i = 0; i < this.numX; i++) {
      for (let j = 0; j < this.numY; j++) {
        const c = i * n + j;
        if (this.s[c] !== 0.0) continue;
        wallU.add(c);
        wallV.add(c);
        if (i < this.numX - 1) wallU.add(c + n);
        if (j < this.numY - 1) wallV.add(c + 1);
      }
    }
    this.wallU = Int32Array.from(wallU);
    this.wallV = Int32Array.from(wallV);

    this.solveCells = Int32Array.from(cells);
    this.solveMask = Uint8Array.from(masks);
    this.solveInv = Float32Array.from(inv);
  }

  fillGhosts(f) {
    const dst = this.ghostDst;
    const src = this.ghostSrc;
    for (let k = 0; k < dst.length; k++) f[dst[k]] = f[src[k]];
  }

  reset() {
    this.u.fill(0);
    this.v.fill(0);
    this.src.fill(0);
    this.foam.fill(0);
    this.tint.fill(0);
    this.crema.fill(0);
    this.time = 0;
  }

  // 讓液面靜止下來（保留花紋，只清掉流動）
  calm() {
    this.u.fill(0);
    this.v.fill(0);
    this.src.fill(0);
  }

  // 對每個在半徑內的流體格子呼叫 fn(c, falloff, dx, dy)
  forEachInRadius(x, y, radius, fn) {
    const n = this.numY;
    const h = this.h;
    const i0 = Math.max(1, Math.floor((x - radius) / h));
    const i1 = Math.min(this.numX - 2, Math.ceil((x + radius) / h));
    const j0 = Math.max(1, Math.floor((y - radius) / h));
    const j1 = Math.min(this.numY - 2, Math.ceil((y + radius) / h));
    const r2 = radius * radius;
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const c = i * n + j;
        if (this.s[c] === 0.0) continue;
        const dx = (i + 0.5) * h - x;
        const dy = (j + 0.5) * h - y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= r2) continue;
        const t = 1.0 - Math.sqrt(d2) / radius;
        fn(c, t * t * (3 - 2 * t), dx, dy);
      }
    }
  }

  // 將格子 c 周圍的面速度往 (vx, vy) 靠攏
  blendVelocity(c, vx, vy, amount) {
    const n = this.numY;
    this.u[c] += (vx - this.u[c]) * amount;
    this.u[c + n] += (vx - this.u[c + n]) * amount;
    this.v[c] += (vy - this.v[c]) * amount;
    this.v[c + 1] += (vy - this.v[c + 1]) * amount;
  }

  // ---------- 外力 ----------

  applyAmbient(dt, strength) {
    if (strength <= 0) return;
    const n = this.numY;
    const h = this.h;
    const t = this.time;
    const k = strength * dt;
    // 低頻、緩慢變化的擾動，讓液面有「還活著」的微流動（以可分離的三角函數預先計算）
    if (!this.ambX || this.ambX.length !== this.numX) {
      this.ambX = new Float32Array(this.numX * 4);
      this.ambY = new Float32Array(this.numY * 4);
    }
    const ax = this.ambX;
    const ay = this.ambY;
    for (let i = 0; i < this.numX; i++) {
      const x = i * h;
      ax[i * 4] = Math.cos(5.7 * x - t * 0.27);
      ax[i * 4 + 1] = Math.sin(7.1 * x);
      ax[i * 4 + 2] = Math.cos(7.1 * x);
      ax[i * 4 + 3] = 0;
    }
    for (let j = 0; j < this.numY; j++) {
      const y = j * h;
      ay[j * 4] = Math.sin(6.2 * y + t * 0.31);
      ay[j * 4 + 1] = Math.sin(11.3 * y + t * 0.53);
      ay[j * 4 + 2] = Math.cos(11.3 * y + t * 0.53);
      ay[j * 4 + 3] = 0;
    }
    const c2 = Math.cos(t * 0.41);
    const s2 = Math.sin(t * 0.41);
    for (let i = 1; i < this.numX - 1; i++) {
      const sx = ax[i * 4 + 1];
      const cx = ax[i * 4 + 2];
      const cxa = ax[i * 4];
      for (let j = 1; j < this.numY - 1; j++) {
        const c = i * n + j;
        if (this.s[c] === 0.0) continue;
        const sy = ay[j * 4 + 1];
        const cy = ay[j * 4 + 2];
        // sin(a - b) 與 cos(b + c) 展開
        const fx = ay[j * 4] * 0.6 + (sy * cx - cy * sx) * 0.4;
        const fy = cxa * 0.6 + (cx * c2 - sx * s2) * 0.4 * cy;
        this.u[c] += fx * k;
        this.v[c] += fy * k;
      }
    }
  }

  // 液面晃動：一側的液面升高、另一側降低，表層的液體就會橫向流過去
  applySlosh(gx, gy, gain) {
    if (gx === 0 && gy === 0) return;
    const n = this.numY;
    const h = this.h;
    for (let i = 1; i < this.numX - 1; i++) {
      const x = (i + 0.5) * h - 0.5;
      for (let j = 1; j < this.numY - 1; j++) {
        const c = i * n + j;
        if (this.s[c] === 0.0) continue;
        this.src[c] += gain * (gx * x + gy * ((j + 0.5) * h - 0.5));
      }
    }
  }

  computeCenterVelocities() {
    const n = this.numY;
    for (let i = 0; i < this.numX - 1; i++) {
      for (let j = 0; j < this.numY - 1; j++) {
        const c = i * n + j;
        this.uc[c] = 0.5 * (this.u[c] + this.u[c + n]);
        this.vc[c] = 0.5 * (this.v[c] + this.v[c + 1]);
      }
    }
  }

  applyVorticityConfinement(dt, eps) {
    if (eps <= 0) return;
    const n = this.numY;
    const h = this.h;
    const inv2h = 0.5 / h;
    const { uc, vc, curl, fx, fy, s } = this;
    this.computeCenterVelocities();

    for (let i = 1; i < this.numX - 1; i++) {
      for (let j = 1; j < this.numY - 1; j++) {
        const c = i * n + j;
        curl[c] =
          s[c] === 0.0
            ? 0
            : (vc[c + n] - vc[c - n] - (uc[c + 1] - uc[c - 1])) * inv2h;
      }
    }
    fx.fill(0);
    fy.fill(0);
    for (let i = 2; i < this.numX - 2; i++) {
      for (let j = 2; j < this.numY - 2; j++) {
        const c = i * n + j;
        if (s[c] === 0.0) continue;
        const gx = (Math.abs(curl[c + n]) - Math.abs(curl[c - n])) * inv2h;
        const gy = (Math.abs(curl[c + 1]) - Math.abs(curl[c - 1])) * inv2h;
        const len = Math.sqrt(gx * gx + gy * gy) + 1e-5;
        const w = curl[c];
        fx[c] = eps * h * ((gy / len) * w);
        fy[c] = eps * h * (-(gx / len) * w);
      }
    }
    for (let i = 2; i < this.numX - 1; i++) {
      for (let j = 2; j < this.numY - 1; j++) {
        const c = i * n + j;
        if (s[c] === 0.0) continue;
        if (s[c - n] !== 0.0) this.u[c] += dt * 0.5 * (fx[c] + fx[c - n]);
        if (s[c - 1] !== 0.0) this.v[c] += dt * 0.5 * (fy[c] + fy[c - 1]);
      }
    }
  }

  // ---------- 壓力投影 ----------

  solveIncompressibility(numIters, overRelaxation) {
    const n = this.numY;
    const h = this.h;
    const { u, v, src, solveCells, solveMask, solveInv } = this;
    const count = solveCells.length;

    // 杯子是封閉的：注入的體積由整體液面上升吸收，扣掉平均值讓方程式有解
    let total = 0;
    for (let k = 0; k < count; k++) total += src[solveCells[k]];
    const mean = total / count;
    const rhs = this.tmpA;
    for (let k = 0; k < count; k++) {
      const c = solveCells[k];
      rhs[k] = (src[c] - mean) * h;
    }

    for (let iter = 0; iter < numIters; iter++) {
      for (let k = 0; k < count; k++) {
        const c = solveCells[k];
        const div = u[c + n] - u[c] + v[c + 1] - v[c] - rhs[k];
        const p = -div * solveInv[k] * overRelaxation;
        const m = solveMask[k];
        if (m === 15) {
          u[c] -= p;
          u[c + n] += p;
          v[c] -= p;
          v[c + 1] += p;
        } else {
          if (m & 1) u[c] -= p;
          if (m & 2) u[c + n] += p;
          if (m & 4) v[c] -= p;
          if (m & 8) v[c + 1] += p;
        }
      }
    }
  }

  clearBoundaryVelocities() {
    const { u, v, wallU, wallV } = this;
    for (let k = 0; k < wallU.length; k++) u[wallU[k]] = 0;
    for (let k = 0; k < wallV.length; k++) v[wallV[k]] = 0;
  }

  // ---------- 平流 ----------

  sampleField(x, y, field) {
    const h = this.h;
    const h2 = 0.5 * h;
    return field === U_FIELD
      ? this.sampleGrid(this.u, x, y, 0, h2)
      : this.sampleGrid(this.v, x, y, h2, 0);
  }

  sampleGrid(f, x, y, ox, oy) {
    const n = this.numY;
    const h = this.h;
    const h1 = 1.0 / h;
    x = Math.max(Math.min(x, this.numX * h), h);
    y = Math.max(Math.min(y, this.numY * h), h);

    const fx = (x - ox) * h1;
    const fy = (y - oy) * h1;
    const x0 = Math.min(Math.floor(fx), this.numX - 2);
    const y0 = Math.min(Math.floor(fy), this.numY - 2);
    const tx = fx - x0;
    const ty = fy - y0;
    const c = x0 * n + y0;
    return (
      (1 - tx) * (1 - ty) * f[c] +
      tx * (1 - ty) * f[c + n] +
      tx * ty * f[c + n + 1] +
      (1 - tx) * ty * f[c + 1]
    );
  }

  advectVelocity(dt, damping) {
    const n = this.numY;
    const h = this.h;
    const h2 = 0.5 * h;
    const { u, v, s, newU, newV } = this;
    newU.set(u);
    newV.set(v);
    const keep = Math.exp(-damping * dt);

    for (let i = 1; i < this.numX - 1; i++) {
      for (let j = 1; j < this.numY - 1; j++) {
        const c = i * n + j;
        if (s[c] === 0.0) continue;
        if (s[c - n] !== 0.0) {
          const vAvg = 0.25 * (v[c - n] + v[c] + v[c - n + 1] + v[c + 1]);
          const x = i * h - dt * u[c];
          const y = j * h + h2 - dt * vAvg;
          newU[c] = this.sampleGrid(u, x, y, 0, h2) * keep;
        }
        if (s[c - 1] !== 0.0) {
          const uAvg = 0.25 * (u[c - 1] + u[c] + u[c + n - 1] + u[c + n]);
          const x = i * h + h2 - dt * uAvg;
          const y = j * h - dt * v[c];
          newV[c] = this.sampleGrid(v, x, y, h2, 0) * keep;
        }
      }
    }
    u.set(newU);
    v.set(newV);
  }

  // MacCormack：前向一次、反向一次，用誤差修正並以回溯點四鄰極值限制
  advectScalar(phi, dt) {
    const n = this.numY;
    const h = this.h;
    const h1 = 1.0 / h;
    const h2 = 0.5 * h;
    const { uc, vc, s } = this;
    const hat = this.tmpA;
    const bar = this.tmpB;
    const out = this.tmpC;
    const maxI = this.numX - 2;
    const maxJ = this.numY - 2;

    this.fillGhosts(phi);
    hat.set(phi);
    for (let i = 1; i < this.numX - 1; i++) {
      for (let j = 1; j < this.numY - 1; j++) {
        const c = i * n + j;
        if (s[c] === 0.0) continue;
        hat[c] = this.sampleGrid(
          phi,
          (i + 0.5) * h - dt * uc[c],
          (j + 0.5) * h - dt * vc[c],
          h2,
          h2,
        );
      }
    }
    this.fillGhosts(hat);
    bar.set(hat);
    for (let i = 1; i < this.numX - 1; i++) {
      for (let j = 1; j < this.numY - 1; j++) {
        const c = i * n + j;
        if (s[c] === 0.0) continue;
        bar[c] = this.sampleGrid(
          hat,
          (i + 0.5) * h + dt * uc[c],
          (j + 0.5) * h + dt * vc[c],
          h2,
          h2,
        );
      }
    }
    out.set(phi);
    for (let i = 1; i < this.numX - 1; i++) {
      for (let j = 1; j < this.numY - 1; j++) {
        const c = i * n + j;
        if (s[c] === 0.0) continue;
        let val = hat[c] + 0.5 * (phi[c] - bar[c]);

        let fx = ((i + 0.5) * h - dt * uc[c] - h2) * h1;
        let fy = ((j + 0.5) * h - dt * vc[c] - h2) * h1;
        let x0 = Math.floor(fx);
        let y0 = Math.floor(fy);
        x0 = x0 < 0 ? 0 : x0 > maxI ? maxI : x0;
        y0 = y0 < 0 ? 0 : y0 > maxJ ? maxJ : y0;
        const k = x0 * n + y0;
        const a = phi[k];
        const b = phi[k + n];
        const d = phi[k + 1];
        const e = phi[k + n + 1];
        const lo = Math.min(a, b, d, e);
        const hi = Math.max(a, b, d, e);
        if (val < lo) val = lo;
        else if (val > hi) val = hi;
        out[c] = val;
      }
    }
    phi.set(out);
  }

  simulate(dt, params) {
    const { numIters, overRelaxation, damping, vorticity, ambient } = params;
    this.time += dt;

    this.applyAmbient(dt, ambient);
    this.applyVorticityConfinement(dt, vorticity);
    this.clearBoundaryVelocities();
    this.solveIncompressibility(numIters, overRelaxation);
    this.clearBoundaryVelocities();

    this.computeCenterVelocities();
    this.advectScalar(this.foam, dt);
    this.advectScalar(this.tint, dt);
    this.advectScalar(this.crema, dt);

    this.advectVelocity(dt, damping);
    this.clearBoundaryVelocities();
    this.src.fill(0);
  }
}
