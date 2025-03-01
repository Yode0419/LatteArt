export class MilkInjector {
  constructor(fluid, config) {
    this.fluid = fluid;
    this.config = config;
    this.injectX = 0.0;
    this.injectY = 0.0;
    this.isActive = false;
  }

  start(x, y) {
    this.injectX = x;
    this.injectY = y;
    this.isActive = true;
    this.applyInjection(x, y, true);
  }

  update(x, y) {
    if (!this.isActive) return;
    
    this.applyInjection(x, y, false);
    this.injectX = x;
    this.injectY = y;
  }

  end() {
    this.isActive = false;
  }

  applyInjection(x, y, reset) {
    const { radius, strength } = this.config?.simulation?.pouring ?? {
      radius: 0.3,
      strength: 2.0,
    };
    
    // 計算移動速度
    let vx = 0.0;
    let vy = 0.0;

    if (!reset) {
      vx = (x - this.injectX) / this.config.fluid.dt;
      vy = (y - this.injectY) / this.config.fluid.dt;
    }

    const n = this.fluid.numY;

    // 注入牛奶的半徑範圍內
    for (let i = 1; i < this.fluid.numX - 2; i++) {
      for (let j = 1; j < this.fluid.numY - 2; j++) {
        this.fluid.s[i * n + j] = 1.0;

        const dx = (i + 0.5) * this.fluid.h - x;
        const dy = (j + 0.5) * this.fluid.h - y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < radius) {
          const factor = 1.0 - d / radius;
          
          // 1. 設置水平速度（受到注入點移動的影響）
          this.fluid.u[i * n + j] += vx * factor * 0.5;
          this.fluid.u[(i + 1) * n + j] += vx * factor * 0.5;
          this.fluid.v[i * n + j] += vy * factor * 0.5;
          this.fluid.v[i * n + j + 1] += vy * factor * 0.5;

          // 2. 設置垂直注入速度 (關鍵部分)
          // 正值表示從Z方向注入到XY平面
          const injectionStrength = strength * factor;
          this.fluid.w[i * n + j] = injectionStrength;
          
          // 3. 直接設置牛奶密度
          // 這裡我們直接設置一些初始密度，真正的擴散會通過不可壓縮求解來實現
          this.fluid.densityField.setDensity(i, j, "milk", 1.0);
          // if (reset || d <= radius * 1.0) {
          //   this.fluid.densityField.setDensity(i, j, "milk", factor);
          // }
        }
      }
    }
  }
}