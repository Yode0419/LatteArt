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
    this.applySuction(x, y);
  }

  update(x, y) {
    this.suctionX = x;
    this.suctionY = y;
    this.applySuction(x, y);
  }

  end() {
    this.isActive = false;
  }

  applySuction(x, y) {
    const { radius, strength } = this.config?.simulation?.suction ?? {
      radius: 0.15,
      strength: 2.0,
    };

    const n = this.fluid.numY;
    const centerCellX = Math.floor(x / this.fluid.h);
    const centerCellY = Math.floor(y / this.fluid.h);

    // 設定中心點速度為 0
    if (
      centerCellX > 0 &&
      centerCellX < this.fluid.numX - 1 &&
      centerCellY > 0 &&
      centerCellY < this.fluid.numY - 1
    ) {
      this.fluid.u[centerCellX * n + centerCellY] = 0;
      this.fluid.u[(centerCellX + 1) * n + centerCellY] = 0;
      this.fluid.v[centerCellX * n + centerCellY] = 0;
      this.fluid.v[centerCellX * n + (centerCellY + 1)] = 0;
    }

    // 為周圍設定向心速度場
    for (let i = 1; i < this.fluid.numX - 2; i++) {
      for (let j = 1; j < this.fluid.numY - 2; j++) {
        // 計算當前格點到吸力中心的向量
        const dx = (i + 0.5) * this.fluid.h - x;
        const dy = (j + 0.5) * this.fluid.h - y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < radius && d > this.fluid.h) {
          // 避免太靠近中心點
          const factor = (1.0 - d / radius) * strength;

          // 計算標準化的向心方向
          const nx = -dx / d; // 負號使其指向中心
          const ny = -dy / d;

          // 根據距離和方向設定速度場
          // 使用平滑的過渡來避免突變
          const smoothFactor = this.smoothstep(this.fluid.h * 2, radius, d);
          const velocityScale = factor * smoothFactor;

          // 更新速度場，注意保持區域性
          this.fluid.u[i * n + j] = nx * velocityScale;
          this.fluid.u[(i + 1) * n + j] = nx * velocityScale;
          this.fluid.v[i * n + j] = ny * velocityScale;
          this.fluid.v[i * n + j + 1] = ny * velocityScale;
        }
      }
    }
  }

  // 平滑過渡函數，用於創建更自然的速度場變化
  smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }
}
