// etch.js
// 雕花針：沿著拖曳軌跡直接把液面的奶泡與顏色往前帶。
// 用位移純量場而非推動速度場，避免針尖拖出一對漩渦。

import { lerpRange } from "../config.js";

export class EtchNeedle {
  constructor(fluid, config) {
    this.fluid = fluid;
    this.config = config;
    this.active = false;
    this.x = this.y = this.lx = this.ly = 0.5;
  }

  begin(x, y) {
    this.active = true;
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

  step() {
    if (!this.active) return;
    const dx = this.x - this.lx;
    const dy = this.y - this.ly;
    const len = Math.hypot(dx, dy);
    if (len < 1e-5) return;

    const opts = this.config.tools.etch;
    const radius = lerpRange(opts.radius, 0.014, 0.045);
    const carry = lerpRange(opts.strength, 0.55, 1.0);

    // 每次最多移動半個針寬，快速劃過時拆成多段
    const steps = Math.max(1, Math.ceil(len / (radius * 0.5)));
    const sx = dx / steps;
    const sy = dy / steps;
    for (let k = 1; k <= steps; k++) {
      this.drag(this.lx + sx * k, this.ly + sy * k, sx * carry, sy * carry, radius);
    }
    this.lx = this.x;
    this.ly = this.y;
  }

  // 半徑內的格子改取「上游」位置的值，等於把液面往針的方向拖
  drag(x, y, mx, my, radius) {
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
