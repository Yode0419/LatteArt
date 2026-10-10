// pouring.js
// 拉缸模型：拉缸高度 height（1 = 高注、0 = 貼近液面）決定牛奶的去向
//   高注：牛奶沉入 espresso 底下，混出焦糖色、打散 crema，液面推力小
//   低注：奶泡浮在液面上形成白色花紋，並把液面往外推開
// 一開始按住是高注；液位夠了，或按住超過 lowerAfter 秒，拉缸會自動壓低。

import { lerpRange } from "../config.js";

export class Pitcher {
  constructor(fluid, config, cup) {
    this.fluid = fluid;
    this.config = config;
    this.cup = cup;
    this.active = false;
    this.height = 1;
    this.hold = 0;
    this.x = 0.5;
    this.y = 0.5;
    this.px = 0.5;
    this.py = 0.5;
    this.vx = 0;
    this.vy = 0;
    this.flow = 0;
  }

  begin(x, y) {
    this.active = true;
    this.hold = 0;
    this.x = this.px = x;
    this.y = this.py = y;
    this.vx = this.vy = 0;
    // 已經打好底的杯子，重新下注時從中間高度開始，很快就會壓低
    this.height = this.cup.fill >= this.config.cup.lowerFill ? 0.55 : 1;
    this.lowTime = 0;
  }

  move(x, y) {
    this.x = x;
    this.y = y;
  }

  end() {
    this.active = false;
  }

  get isLow() {
    return this.active && this.height < 0.35;
  }

  get isFull() {
    return this.cup.fill >= 0.995;
  }

  step(dt) {
    const opts = this.config.tools.pour;
    if (!this.active) {
      this.height += (1 - this.height) * Math.min(1, dt * opts.heightRate);
      this.flow = 0;
      return;
    }

    this.hold += dt;
    const lower =
      this.cup.fill >= this.config.cup.lowerFill || this.hold >= opts.lowerAfter;
    const target = lower ? 0 : 1;
    this.height += (target - this.height) * Math.min(1, dt * opts.heightRate);
    if (this.height < 0.6) this.lowTime += dt;

    // 平滑拉缸移動速度，搖擺時才會有乾淨的動量
    const rawVx = (this.x - this.px) / dt;
    const rawVy = (this.y - this.py) / dt;
    this.vx += (rawVx - this.vx) * 0.5;
    this.vy += (rawVy - this.vy) * 0.5;
    this.px = this.x;
    this.py = this.y;

    const strength = lerpRange(opts.strength, 0.4, 1.6);
    this.flow = this.isFull ? 0 : strength;
    if (this.flow === 0) return;

    const h = this.height;
    const low = 1 - h;
    const radius = lerpRange(opts.radius, 0.025, 0.08) * (0.6 + 0.7 * low);
    const push = this.flow * (3 + 22 * low * low);
    // 奶泡比推力晚一點浮上來：新的一注會先推開舊花紋、留下一圈 crema 分層線
    const t = Math.min(1, Math.max(0, (this.lowTime - 0.08) / 0.3));
    const foamTarget = Math.min(1, low * low * 1.4) * t * t * (3 - 2 * t);
    // 剛下注時水柱會先衝破舊奶泡
    const breakFoam = this.lowTime < 0.25 ? 9 * dt : 0;
    const mix = this.flow * h * 1.6 * dt;
    const breakCrema = h * 2.2 * dt;
    const drag = 0.06 * low;
    const { fluid } = this;
    const { src, foam, tint, crema } = fluid;
    const vx = this.vx;
    const vy = this.vy;

    fluid.forEachInRadius(this.x, this.y, radius, (c, f) => {
      src[c] += push * f;
      if (breakFoam > 0) foam[c] *= 1 - Math.min(1, breakFoam * f * f);
      if (foamTarget > 0.01) {
        const k = Math.min(1, f * 1.6);
        foam[c] += (foamTarget - foam[c]) * k;
      }
      tint[c] = Math.min(1, tint[c] + mix * f);
      crema[c] *= 1 - breakCrema * f;
      if (drag > 0) fluid.blendVelocity(c, vx, vy, drag * f);
    });

    this.cup.fill = Math.min(
      1,
      this.cup.fill + this.flow * opts.fillRate * dt
    );
  }
}
