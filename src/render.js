import { U_FIELD, V_FIELD } from "./fluid/fluidCore.js";

export class FluidRenderer {
  constructor(canvas, simHeight) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });
    this.simHeight = simHeight;
    this.cScale = canvas.height / simHeight;
    this.simWidth = canvas.width / this.cScale;

    // 定義咖啡和牛奶的顏色
    this.coffeeColor = { r: 76, g: 47, b: 39 }; // 深咖啡色
    this.milkColor = { r: 255, g: 252, b: 245 }; // 暖白色
  }

  // 座標轉換函數
  cX(x) {
    return x * this.cScale;
  }

  cY(y) {
    return this.canvas.height - y * this.cScale;
  }

  // 新的顏色計算函數
  getFluidColor(density) {
    // 確保密度值在 0-1 之間
    density = Math.min(Math.max(density, 0.0), 1.0);

    // 線性插值計算顏色
    return [
      Math.floor(
        this.coffeeColor.r + (this.milkColor.r - this.coffeeColor.r) * density
      ),
      Math.floor(
        this.coffeeColor.g + (this.milkColor.g - this.coffeeColor.g) * density
      ),
      Math.floor(
        this.coffeeColor.b + (this.milkColor.b - this.coffeeColor.b) * density
      ),
      255,
    ];
  }

  // 主要繪製函數
  draw(fluid, options = {}) {
    const { showStreamlines = false } = options;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const n = fluid.numY;
    const cellScale = 1.1;
    const h = fluid.h;

    const id = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    // 繪製流體
    for (let i = 0; i < fluid.numX; i++) {
      for (let j = 0; j < fluid.numY; j++) {
        // 不論是否為煙霧效果，都使用基於密度的顏色混合
        const density = fluid.m[i * n + j];
        const color = this.getFluidColor(density);

        const x = Math.floor(this.cX(i * h));
        const y = Math.floor(this.cY((j + 1) * h));
        const cx = Math.floor(this.cScale * cellScale * h) + 1;
        const cy = Math.floor(this.cScale * cellScale * h) + 1;

        for (let yi = y; yi < y + cy; yi++) {
          let p = 4 * (yi * this.canvas.width + x);
          for (let xi = 0; xi < cx; xi++) {
            id.data[p++] = color[0];
            id.data[p++] = color[1];
            id.data[p++] = color[2];
            id.data[p++] = color[3];
          }
        }
      }
    }
    this.ctx.putImageData(id, 0, 0);
    if (showStreamlines) {
      this.drawStreamlines(fluid); // 繪製流線
    }
    // console.log("Drawing frame");
  }

  // 繪製流線
  drawStreamlines(fluid) {
    const numSegs = 30; // 增加線段數
    this.ctx.strokeStyle = "rgba(255, 0, 0, 1)";
    this.ctx.lineWidth = 1;

    for (let i = 1; i < fluid.numX - 1; i += 3) {
      // 減少間距以增加流線密度
      for (let j = 1; j < fluid.numY - 1; j += 3) {
        let x = (i + 0.5) * fluid.h;
        let y = (j + 0.5) * fluid.h;

        this.ctx.beginPath();
        this.ctx.moveTo(this.cX(x), this.cY(y));

        for (let n = 0; n < numSegs; n++) {
          const u = fluid.sampleField(x, y, U_FIELD);
          const v = fluid.sampleField(x, y, V_FIELD);
          x += u * 0.015; // 調整流線長度
          y += v * 0.015;
          if (
            x > fluid.numX * fluid.h ||
            x < 0 ||
            y > fluid.numY * fluid.h ||
            y < 0
          )
            break;

          this.ctx.lineTo(this.cX(x), this.cY(y));
        }
        this.ctx.stroke();
      }
    }
    // console.log("Drawing streamlines");
  }
}
