export const U_FIELD = 0;
export const V_FIELD = 1;

import { DensityField } from "./densityField.js";

export class Fluid {
  constructor(density, numX, numY, h, viscosity) {
    this.density = density;
    this.numX = numX + 2;
    this.numY = numY + 2;
    this.numCells = this.numX * this.numY;
    this.h = h;
    this.viscosity = viscosity;
    this.velocityThreshold = 0.001;

    // 速度場相關
    this.u = new Float32Array(this.numCells);
    this.v = new Float32Array(this.numCells);
    this.newU = new Float32Array(this.numCells);
    this.newV = new Float32Array(this.numCells);
    this.p = new Float32Array(this.numCells);
    this.s = new Float32Array(this.numCells);

    // 創建密度場
    this.densityField = new DensityField(numX, numY);
  }

  // 向後兼容的密度場訪問
  get m() {
    return this.densityField.m;
  }

  integrate(dt, gravity) {
    const n = this.numY;
    for (let i = 1; i < this.numX; i++) {
      for (let j = 1; j < this.numY - 1; j++) {
        if (this.s[i * n + j] != 0.0 && this.s[i * n + j - 1] != 0.0) {
          this.v[i * n + j] += gravity * dt;
        }
      }
    }
  }

  solveIncompressibility(
    numIters,
    dt,
    overRelaxation,
    sourceX,
    sourceY,
    sourceRate
  ) {
    const n = this.numY;
    const cp = (this.density * this.h) / dt; // 壓力係數

    for (let iter = 0; iter < numIters; iter++) {
      for (let i = 1; i < this.numX - 1; i++) {
        for (let j = 1; j < this.numY - 1; j++) {
          if (this.s[i * n + j] == 0.0) continue; // 跳過固體格子

          const sx0 = this.s[(i - 1) * n + j];
          const sx1 = this.s[(i + 1) * n + j];
          const sy0 = this.s[i * n + j - 1];
          const sy1 = this.s[i * n + j + 1];
          const sum = sx0 + sx1 + sy0 + sy1;
          if (sum == 0.0) continue; // 沒有可影響的流體格子

          // 計算發散度（Divergence）
          let div =
            this.u[(i + 1) * n + j] -
            this.u[i * n + j] +
            this.v[i * n + j + 1] -
            this.v[i * n + j];

          // 如果當前格點是注入/吸取點，調整 `div`
          if (i === sourceX && j === sourceY) {
            div -= sourceRate; // 正值代表注入，負值代表吸取
          }

          let p = -div / sum; // 計算壓力修正
          p *= overRelaxation;
          this.p[i * n + j] += cp * p; // 更新壓力場

          // 修正速度場
          this.u[i * n + j] -= sx0 * p;
          this.u[(i + 1) * n + j] += sx1 * p;
          this.v[i * n + j] -= sy0 * p;
          this.v[i * n + j + 1] += sy1 * p;
        }
      }
    }
  }

  extrapolate() {
    const n = this.numY;
    // 處理水平邊界
    for (let i = 0; i < this.numX; i++) {
      this.u[i * n + 0] = this.u[i * n + 1];
      this.u[i * n + this.numY - 1] = this.u[i * n + this.numY - 2];
    }
    // 處理垂直邊界
    for (let j = 0; j < this.numY; j++) {
      this.v[0 * n + j] = this.v[1 * n + j];
      this.v[(this.numX - 1) * n + j] = this.v[(this.numX - 2) * n + j];
    }
  }

  // 速度場採樣
  sampleField(x, y, field) {
    const n = this.numY;
    const h = this.h;
    const h1 = 1.0 / h;
    const h2 = 0.5 * h;

    x = Math.max(Math.min(x, this.numX * h), h);
    y = Math.max(Math.min(y, this.numY * h), h);

    let dx = 0.0;
    let dy = 0.0;
    let f;

    // 根據場類型選擇數據和偏移
    switch (field) {
      case U_FIELD:
        f = this.u;
        dy = h2;
        break;
      case V_FIELD:
        f = this.v;
        dx = h2;
        break;
      default:
        return 0.0;
    }

    const x0 = Math.min(Math.floor((x - dx) * h1), this.numX - 1);
    const tx = (x - dx - x0 * h) * h1;
    const x1 = Math.min(x0 + 1, this.numX - 1);

    const y0 = Math.min(Math.floor((y - dy) * h1), this.numY - 1);
    const ty = (y - dy - y0 * h) * h1;
    const y1 = Math.min(y0 + 1, this.numY - 1);

    const sx = 1.0 - tx;
    const sy = 1.0 - ty;

    return (
      sx * sy * f[x0 * n + y0] +
      tx * sy * f[x1 * n + y0] +
      tx * ty * f[x1 * n + y1] +
      sx * ty * f[x0 * n + y1]
    );
  }

  avgU(i, j) {
    const n = this.numY;
    return (
      (this.u[i * n + j - 1] +
        this.u[i * n + j] +
        this.u[(i + 1) * n + j - 1] +
        this.u[(i + 1) * n + j]) *
      0.25
    );
  }

  avgV(i, j) {
    const n = this.numY;
    return (
      (this.v[(i - 1) * n + j] +
        this.v[i * n + j] +
        this.v[(i - 1) * n + j + 1] +
        this.v[i * n + j + 1]) *
      0.25
    );
  }

  advectVel(dt) {
    this.newU.set(this.u);
    this.newV.set(this.v);

    const n = this.numY;
    const h = this.h;
    const h2 = 0.5 * h;

    for (let i = 1; i < this.numX; i++) {
      for (let j = 1; j < this.numY; j++) {
        // u component
        if (
          this.s[i * n + j] != 0.0 &&
          this.s[(i - 1) * n + j] != 0.0 &&
          j < this.numY - 1
        ) {
          let x = i * h;
          let y = j * h + h2;
          let u = this.u[i * n + j];
          let v = this.avgV(i, j);
          x = x - dt * u;
          y = y - dt * v;
          u = this.sampleField(x, y, U_FIELD);
          this.newU[i * n + j] =
            Math.abs(u) < this.velocityThreshold ? 0 : u * this.viscosity;
        }
        // v component
        if (
          this.s[i * n + j] != 0.0 &&
          this.s[i * n + j - 1] != 0.0 &&
          i < this.numX - 1
        ) {
          let x = i * h + h2;
          let y = j * h;
          let u = this.avgU(i, j);
          let v = this.v[i * n + j];
          x = x - dt * u;
          y = y - dt * v;
          v = this.sampleField(x, y, V_FIELD);
          this.newV[i * n + j] =
            Math.abs(v) < this.velocityThreshold ? 0 : v * this.viscosity;
        }
      }
    }

    this.u.set(this.newU);
    this.v.set(this.newV);
  }

  // 密度場平流計算
  advectDensities(dt) {
    const n = this.numY;
    const h = this.h;
    const h2 = 0.5 * h;

    // 創建臨時密度場
    const tempDensities = this.densityField.createTemp();

    // 對每個網格點進行計算
    for (let i = 1; i < this.numX - 1; i++) {
      for (let j = 1; j < this.numY - 1; j++) {
        if (this.s[i * n + j] !== 0.0) {
          // 計算速度
          const u = (this.u[i * n + j] + this.u[(i + 1) * n + j]) * 0.5;
          const v = (this.v[i * n + j] + this.v[i * n + j + 1]) * 0.5;

          // 回溯位置
          const x = i * h + h2 - dt * u;
          const y = j * h + h2 - dt * v;

          // 從回溯位置採樣所有流體的密度
          const sampledDensities = this.sampleDensities(x, y);

          // 將採樣結果存入臨時密度場
          tempDensities[i * n + j] = sampledDensities;
        }
      }
    }

    // 更新密度場
    this.densityField.updateFromTemp(tempDensities);
  }

  // 密度場採樣
  sampleDensities(x, y) {
    const n = this.numY;
    const h = this.h;
    const h1 = 1.0 / h;
    const h2 = 0.5 * h;

    x = Math.max(Math.min(x, this.numX * h), h);
    y = Math.max(Math.min(y, this.numY * h), h);

    const dx = h2;
    const dy = h2;

    const x0 = Math.min(Math.floor((x - dx) * h1), this.numX - 1);
    const tx = (x - dx - x0 * h) * h1;
    const x1 = Math.min(x0 + 1, this.numX - 1);

    const y0 = Math.min(Math.floor((y - dy) * h1), this.numY - 1);
    const ty = (y - dy - y0 * h) * h1;
    const y1 = Math.min(y0 + 1, this.numY - 1);

    const sx = 1.0 - tx;
    const sy = 1.0 - ty;

    // 取得四個角落的密度值
    const d00 = this.densityField.getDensities(x0, y0);
    const d10 = this.densityField.getDensities(x1, y0);
    const d11 = this.densityField.getDensities(x1, y1);
    const d01 = this.densityField.getDensities(x0, y1);

    // 對每種流體進行雙線性插值
    const result = {};
    for (const fluidType in d00) {
      result[fluidType] =
        sx * sy * d00[fluidType] +
        tx * sy * d10[fluidType] +
        tx * ty * d11[fluidType] +
        sx * ty * d01[fluidType];
    }

    return result;
  }

  simulate(
    dt,
    gravity,
    numIters,
    overRelaxation,
    viscosity,
    sourceX,
    sourceY,
    sourceRate
  ) {
    this.viscosity = viscosity;

    this.integrate(dt, gravity);
    this.p.fill(0.0);
    this.solveIncompressibility(
      numIters,
      dt,
      overRelaxation,
      sourceX,
      sourceY,
      sourceRate
    );
    this.extrapolate();
    this.advectVel(dt);
    this.advectDensities(dt);
  }
}
