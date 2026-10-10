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
    // 剛切入時帶動的範圍較寬，把頂端整片拖出 V 口；之後變細
    const carryR = radius * (1 + (opts.entryWidth - 1) * (1 - ramp));

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

    this.lx = this.x;
    this.ly = this.y;
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
