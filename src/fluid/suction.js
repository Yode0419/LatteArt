export class SuctionSimulator {
  constructor(fluid, config) {
    this.fluid = fluid;
    this.config = config;
    this.suctionX = 0.0;
    this.suctionY = 0.0;
    this.isActive = false;
  }

  start(x, y) {
    this.suctionX = x;
    this.suctionY = y;
    this.isActive = true;
    this.applySuction(x, y, true);
  }

  update(x, y) {
    if (!this.isActive) return;

    this.applySuction(x, y, false);
    this.suctionX = x;
    this.suctionY = y;
  }

  end() {
    this.isActive = false;
  }

  applySuction(x, y, reset) {
    const { radius, strength } = this.config?.simulation?.suction ?? {
      radius: 0.15,
      strength: 2.0,
    };

    // 計算移動速度
    let vx = 0.0;
    let vy = 0.0;

    if (!reset) {
      vx = (x - this.suctionX) / this.config.fluid.dt;
      vy = (y - this.suctionY) / this.config.fluid.dt;
    }

    const n = this.fluid.numY;

    // 吸取液體的半徑範圍內
    for (let i = 1; i < this.fluid.numX - 2; i++) {
      for (let j = 1; j < this.fluid.numY - 2; j++) {
        // 只處理非固體格子
        if (this.fluid.s[i * n + j] !== 0.0) {
          const dx = (i + 0.5) * this.fluid.h - x;
          const dy = (j + 0.5) * this.fluid.h - y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < radius) {
            const factor = 1.0 - d / radius;

            // 1. 設置水平速度（受到吸取點移動的影響）
            this.fluid.u[i * n + j] += vx * factor * 0.05;
            this.fluid.u[(i + 1) * n + j] += vx * factor * 0.05;
            this.fluid.v[i * n + j] += vy * factor * 0.05;
            this.fluid.v[i * n + j + 1] += vy * factor * 0.05;

            // 2. 設置垂直吸取速度 (關鍵部分)
            // 負值表示從XY平面吸取到Z方向
            const suctionStrength = -strength * factor; // 負號代表吸取
            this.fluid.w[i * n + j] = suctionStrength;

            // 3. 直接減少牛奶密度
            const currentMilk = this.fluid.densityField.getDensity(
              i,
              j,
              "milk"
            );
            // 根據吸取強度減少密度
            // 按吸取強度與距離衰減來降低牛奶密度
            const reductionRate = Math.abs(suctionStrength) * factor * this.config.fluid.dt;
            const newDensity = Math.max(0, currentMilk - reductionRate);
            this.fluid.densityField.setDensity(i, j, "milk", newDensity);
          }
        }
      }
    }
  }
}
