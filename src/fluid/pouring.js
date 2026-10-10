// pouring.js
// 拉缸：像畫筆一樣，按下就從液面浮出白色奶泡，並把液面往外推開。
// 操作不追求擬真限制（不需高注打底、不會注滿），但看起來要像真的拉花：
//   - 奶泡立即出現在注流中心，被推力向外撐開成圓
//   - 每一注剛落下時會先推開周圍的舊奶泡，留下一圈 crema 分層線（鬱金香的層次）
//   - 搖擺拉缸時帶一點動量

import { lerpRange } from "../config.js";

export class Pitcher {
  constructor(fluid, config, cup) {
    this.fluid = fluid;
    this.config = config;
    this.cup = cup;
    this.active = false;
    this.height = 0.15; // 給渲染器與瞄準環用：固定為貼近液面的低注
    this.time = 0;
    this.x = this.y = this.px = this.py = 0.5;
    this.vx = this.vy = 0;
    this.flow = 0;
  }

  begin(x, y) {
    this.active = true;
    this.time = 0;
    this.x = this.px = x;
    this.y = this.py = y;
    this.vx = this.vy = 0;
  }

  move(x, y) {
    this.x = x;
    this.y = y;
  }

  end() {
    this.active = false;
    this.flow = 0;
  }

  step(dt) {
    if (!this.active) return;
    const opts = this.config.tools.pour;
    this.time += dt;

    // 平滑拉缸移動速度，搖擺時才會有乾淨的動量
    this.vx += ((this.x - this.px) / dt - this.vx) * 0.5;
    this.vy += ((this.y - this.py) / dt - this.vy) * 0.5;
    this.px = this.x;
    this.py = this.y;

    this.flow = lerpRange(opts.strength, 0.4, 1.6);
    const radius = lerpRange(opts.radius, 0.03, 0.09);
    const push = this.flow * opts.push;
    // 剛落下的 0.15 秒：注流先撐開周圍的舊奶泡，形成分層線
    const opening = this.time < 0.15;
    const mix = this.flow * 0.35 * dt;
    const { fluid } = this;
    const { src, foam, tint } = fluid;
    const vx = this.vx;
    const vy = this.vy;

    // 推力分佈比奶泡更寬、更平滑，奶泡才會被撐成圓形
    fluid.forEachInRadius(this.x, this.y, radius * 1.6, (c, f) => {
      src[c] += push * f * 0.5;
    });
    fluid.forEachInRadius(this.x, this.y, radius, (c, f) => {
      if (f > 0.55) {
        foam[c] += (1 - foam[c]) * Math.min(1, (f - 0.55) * 4);
      } else if (opening) {
        foam[c] *= 1 - 0.35 * f;
      } else {
        foam[c] += (1 - foam[c]) * f * 0.5;
      }
      tint[c] = Math.min(1, tint[c] + mix * (1 - f));
      fluid.blendVelocity(c, vx, vy, 0.05 * f);
    });

    // 液位只是視覺：越倒越接近杯緣，但不會限制繼續注入
    this.cup.fill = Math.min(1, this.cup.fill + this.flow * opts.fillRate * dt);
  }
}
