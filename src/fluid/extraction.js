// extraction.js
// 開場萃取：espresso 從杯心落下，crema 由中心向外浮現並帶著細微的虎斑。

function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export class Extraction {
  constructor(fluid, duration = 2.6) {
    this.fluid = fluid;
    this.duration = duration;
    this.t = 0;
    this.done = false;
    this.seed = Math.random() * 100;
    this.target = this.buildTarget();
  }

  // 每格最終的 crema 厚度：中心較厚、杯緣稍淡，加上兩層雜訊斑紋
  buildTarget() {
    const fluid = this.fluid;
    const n = fluid.numY;
    const h = fluid.h;
    const target = new Float32Array(fluid.numCells);
    for (let i = 0; i < fluid.numX; i++) {
      for (let j = 0; j < fluid.numY; j++) {
        const x = (i + 0.5) * h;
        const y = (j + 0.5) * h;
        const r = Math.hypot(x - 0.5, y - 0.5) / fluid.radius;
        const n1 = valueNoise(x * 9 + this.seed, y * 9);
        const n2 = valueNoise(x * 23 - this.seed, y * 23);
        const edge = 1 - 0.3 * Math.pow(Math.min(1, r), 3);
        target[i * n + j] = Math.min(1, (0.9 + 0.04 * n1 + 0.02 * n2) * edge);
      }
    }
    return target;
  }

  get progress() {
    return Math.min(1, this.t / this.duration);
  }

  finish() {
    const { crema } = this.fluid;
    for (let c = 0; c < crema.length; c++) {
      crema[c] = Math.max(crema[c], this.target[c]);
    }
    this.done = true;
  }

  step(dt) {
    if (this.done) return;
    this.t += dt;
    const fluid = this.fluid;
    const n = fluid.numY;
    const h = fluid.h;
    const p = this.progress;

    // crema 從中心往外長出來
    const front = 0.08 + p * 0.75;
    const { crema, s } = fluid;
    for (let i = 1; i < fluid.numX - 1; i++) {
      for (let j = 1; j < fluid.numY - 1; j++) {
        const c = i * n + j;
        if (s[c] === 0.0) continue;
        const r = Math.hypot((i + 0.5) * h - 0.5, (j + 0.5) * h - 0.5) / fluid.radius;
        const k = Math.max(0, Math.min(1, (front - r) * 4));
        crema[c] += (this.target[c] - crema[c]) * k * dt * 2.2;
      }
    }

    // 萃取的水柱輕微晃動，帶出自然的流動
    if (p < 0.85) {
      const wob = this.t * 2.3;
      const x = 0.5 + Math.sin(wob) * 0.018;
      const y = 0.52 + Math.cos(wob * 1.3) * 0.014;
      fluid.forEachInRadius(x, y, 0.05, (c, f) => {
        fluid.src[c] += 7 * f * (1 - p);
      });
    }

    if (this.t >= this.duration) this.finish();
  }
}
