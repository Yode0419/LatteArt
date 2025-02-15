export class MilkInjector {
  constructor(fluid, config) {
    this.fluid = fluid;
    this.config = config;
    this.injectX = 0.0;
    this.injectY = 0.0;
  }

  start(x, y) {
    this.injectX = x;
    this.injectY = y;
    this.applyInjection(x, y, true);
  }

  update(x, y) {
    this.applyInjection(x, y, false);
    this.injectX = x;
    this.injectY = y;
  }

  end() {
    // 牛奶注入結束時的清理工作（如果需要的話）
  }

  applyInjection(x, y, reset) {
    const { radius, strength, density } = this.config?.simulation?.pouring ?? {
      radius: 0.3,
      strength: 2.0,
      density: 1.0,
    };
    let vx = 0.0;
    let vy = 0.0;

    if (!reset) {
      vx = (x - this.injectX) / this.config.fluid.dt;
      vy = (y - this.injectY) / this.config.fluid.dt;
    }

    const n = this.fluid.numY;

    for (let i = 1; i < this.fluid.numX - 2; i++) {
      for (let j = 1; j < this.fluid.numY - 2; j++) {
        this.fluid.s[i * n + j] = 1.0;

        const dx = (i + 0.5) * this.fluid.h - x;
        const dy = (j + 0.5) * this.fluid.h - y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < radius) {
          const factor = 1.0 - d / radius;

          // 影響速度場，使牛奶流動
          this.fluid.u[i * n + j] = vx * strength * factor;
          this.fluid.u[(i + 1) * n + j] = vx * strength * factor;
          this.fluid.v[i * n + j] = vy * strength * factor;
          this.fluid.v[i * n + j + 1] = vy * strength * factor;

          // 影響密度場，讓牛奶顏色變白，考慮密度影響
          this.fluid.m[i * n + j] = Math.min(
            this.fluid.m[i * n + j] + factor * density * 0.5, // 控制白色變化速度
            1.0 // 限制最大值為 1.0，避免過度增亮
          );
        }
      }
    }
  }
}
