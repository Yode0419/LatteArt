// sink.js
// 下沉（穿心）：提高拉缸、讓細水柱沉進奶泡。
//   拖曳：水柱沿路壓下奶泡並把花紋往前帶，兩側向中線收攏 → 愛心的 V 口與尖端
//   按住不動：原地下沉，周圍花紋向內收

import { lerpRange } from "../config.js";

export class SinkTool {
  constructor(fluid, config) {
    this.fluid = fluid;
    this.config = config;
    this.active = false;
    this.x = this.y = this.lx = this.ly = 0.5;
  }

  begin(x, y) {
    this.active = true;
    this.travel = 0;
    this.x = this.lx = x;
    this.y = this.ly = y;
  }

  move(x, y) {
    this.x = x;
    this.y = y;
  }

  end() {
    this.active = false;
  }

  step(dt) {
    if (!this.active) return;
    const opts = this.config.tools.sink;
    const radius = lerpRange(opts.radius, 0.015, 0.05);
    const power = lerpRange(opts.strength, 0.5, 1.5);
    const dx = this.x - this.lx;
    const dy = this.y - this.ly;
    const len = Math.hypot(dx, dy);
    this.travel += len;
    // 切入的進度：0 = 剛切入，1 = 已深入奶泡
    const ramp = Math.min(1, Math.max(0, (this.travel - opts.pullDelay) / 0.08));
    // 剛切入時帶動的範圍（entryWidth）決定頂端 V 口的寬窄；
    // 深入之後的範圍（bodyWidth）越寬，下半部越會整片被拖成收尖的心形
    const carryR = radius * (opts.entryWidth * (1 - ramp) + opts.bodyWidth * ramp);

    // 1. 水柱拖著液面走（直接位移純量場，不留下漩渦）
    if (len > 1e-5) {
      const steps = Math.max(1, Math.ceil(len / (radius * 0.4)));
      const sx = dx / steps;
      const sy = dy / steps;
      for (let k = 1; k <= steps; k++) {
        this.carry(this.lx + sx * k, this.ly + sy * k, sx, sy, carryR);
      }
    }

    // 2. 水柱沉入：中心奶泡被壓下，周圍向內收
    const { fluid } = this;
    const { src, foam, tint } = fluid;
    const still = Math.max(0, 1 - len / dt / 0.3); // 移動越慢，沉得越多
    // 切入的前段壓得深（切出 V 口），之後變淺，穿心線才不會把愛心切成兩半
    const cut = opts.cut * (1 - ramp) + opts.cutLate * ramp;
    const core = radius * 0.42;
    // 先切口、後收攏：走過一段後兩側才往中線收，把身後的縫合、收成尖端
    const pull = opts.pull * power * ramp;
    if (pull > 0) {
      fluid.forEachInRadius(this.x, this.y, radius * 1.8, (c, f) => {
        src[c] -= pull * f;
      });
    }
    fluid.forEachInRadius(this.x, this.y, core, (c, f) => {
      const sunk = foam[c] * Math.min(1, dt * f * power * (cut + 10 * still));
      foam[c] -= sunk;
      tint[c] = Math.min(1, tint[c] + sunk * 0.7);
    });

    // 3. 縫合：深入奶泡之後，兩側的奶泡從左右流回水柱身後，把穿心線補起來（愛心不會被切成兩半）
    //    V 口切完之後才開始縫（sealDelay），頂端的 V 口不會被補回去
    const sealRamp = Math.min(1, Math.max(0, (this.travel - opts.pullDelay - opts.sealDelay) / 0.08));
    if (opts.seal > 0 && len > 1e-5) this.seal(dx / len, dy / len, radius, opts.seal * sealRamp * dt);

    this.lx = this.x;
    this.ly = this.y;
  }

  // 水柱身後一段：每格取垂直於行進方向、左右兩側的奶泡，往兩者中較少的那側補齊
  seal(ux, uy, radius, amount) {
    if (amount <= 0) return;
    const fluid = this.fluid;
    const h2 = fluid.h * 0.5;
    const { foam, tint } = fluid;
    const foamCopy = fluid.tmpA;
    const tintCopy = fluid.tmpB;
    foamCopy.set(foam);
    tintCopy.set(tint);
    const reach = radius * 1.3; // 往兩側取樣的距離（要跨過整條縫）
    const px = -uy * reach;
    const py = ux * reach;
    const bx = this.x - ux * radius * 2;
    const by = this.y - uy * radius * 2;
    const k = Math.min(1, amount);
    fluid.forEachInRadius(bx, by, radius * 2, (c, f, cx, cy) => {
      const x = bx + cx;
      const y = by + cy;
      const a = fluid.sampleGrid(foamCopy, x + px, y + py, h2, h2);
      const b = fluid.sampleGrid(foamCopy, x - px, y - py, h2, h2);
      const side = Math.min(a, b);
      if (side <= foam[c]) return;
      const w = k * f;
      foam[c] += (side - foam[c]) * w;
      const sideTint =
        0.5 *
        (fluid.sampleGrid(tintCopy, x + px, y + py, h2, h2) +
          fluid.sampleGrid(tintCopy, x - px, y - py, h2, h2));
      tint[c] += (sideTint - tint[c]) * w;
    });
  }

  carry(x, y, mx, my, radius) {
    const fluid = this.fluid;
    const h2 = fluid.h * 0.5;
    const fields = [fluid.foam, fluid.tint, fluid.crema];
    const copies = [fluid.tmpA, fluid.tmpB, fluid.tmpC];
    for (let f = 0; f < 3; f++) copies[f].set(fields[f]);
    fluid.forEachInRadius(x, y, radius * 2.2, (c, w, cx, cy) => {
      const px = x + cx - mx * w;
      const py = y + cy - my * w;
      for (let f = 0; f < 3; f++) {
        fields[f][c] = fluid.sampleGrid(copies[f], px, py, h2, h2);
      }
    });
  }
}
