export class StirringSimulator {
  constructor(fluid, config) {
    this.fluid = fluid;
    this.config = config;
    this.stirX = 0.0;
    this.stirY = 0.0;
  }

  start(x, y) {
    this.stirX = x;
    this.stirY = y;
    this.applyStirring(x, y, true);
  }

  update(x, y) {
    this.applyStirring(x, y, false);
    this.stirX = x;
    this.stirY = y;
  }

  end() {
    // 攪拌結束時的清理工作（如果需要的話）
  }

  applyStirring(x, y, reset) {
    const { radius, strength } = this.config?.simulation?.stirring ?? {
      radius: 0.1,
      strength: 1.0,
    };
    let vx = 0.0;
    let vy = 0.0;

    if (!reset) {
      vx = (x - this.stirX) / this.config.fluid.dt;
      vy = (y - this.stirY) / this.config.fluid.dt;
    }

    const n = this.fluid.numY;

    for (let i = 1; i < this.fluid.numX - 2; i++) {
      for (let j = 1; j < this.fluid.numY - 2; j++) {
        // 只處理非固體格子
        if (this.fluid.s[i * n + j] !== 0.0) {
          const dx = (i + 0.5) * this.fluid.h - x;
          const dy = (j + 0.5) * this.fluid.h - y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < radius) {
            const factor = 1.0 - d / radius;

            // 影響速度場，使流體流動
            this.fluid.u[i * n + j] = vx * strength * factor;
            this.fluid.u[(i + 1) * n + j] = vx * strength * factor;
            this.fluid.v[i * n + j] = vy * strength * factor;
            this.fluid.v[i * n + j + 1] = vy * strength * factor;
          }
        }
      }
    }
  }
}
