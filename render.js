import { U_FIELD, V_FIELD } from "./fluidSimulation.js";

export class FluidRenderer {
  constructor(canvas, simHeight) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });
    this.simHeight = simHeight;
    this.cScale = canvas.height / simHeight;
    this.simWidth = canvas.width / this.cScale;
  }

  // Convert simulation space to canvas space
  cX(x) {
    return x * this.cScale;
  }

  cY(y) {
    return this.canvas.height - y * this.cScale;
  }

  // Color utilities
  getSciColor(val, minVal, maxVal) {
    val = Math.min(Math.max(val, minVal), maxVal - 0.0001);
    const d = maxVal - minVal;
    val = d == 0.0 ? 0.5 : (val - minVal) / d;
    const m = 0.25;
    const num = Math.floor(val / m);
    const s = (val - num * m) / m;
    let r, g, b;

    switch (num) {
      case 0:
        r = 0.0;
        g = s;
        b = 1.0;
        break;
      case 1:
        r = 0.0;
        g = 1.0;
        b = 1.0 - s;
        break;
      case 2:
        r = s;
        g = 1.0;
        b = 0.0;
        break;
      case 3:
        r = 1.0;
        g = 1.0 - s;
        b = 0.0;
        break;
    }

    return [255 * r, 255 * g, 255 * b, 255];
  }

  // Draw the fluid state
  draw(fluid, options = {}) {
    const { showSmoke = true, showStreamlines = false } = options;

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

    // Draw fluid cells
    for (let i = 0; i < fluid.numX; i++) {
      for (let j = 0; j < fluid.numY; j++) {
        let color = [255, 255, 255, 255];

        if (showSmoke) {
          const s = fluid.m[i * n + j];
          color = this.getSciColor(s, 0.0, 1.0);
        } else if (fluid.s[i * n + j] == 0.0) {
          color = [0, 0, 0, 255];
        }

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

    // Draw streamlines if enabled
    if (showStreamlines) {
      this.drawStreamlines(fluid);
    }
  }

  // Draw flow streamlines
  drawStreamlines(fluid) {
    const segLen = fluid.h * 0.2;
    const numSegs = 15;

    this.ctx.strokeStyle = "#ff0000";

    for (let i = 1; i < fluid.numX - 1; i += 5) {
      for (let j = 1; j < fluid.numY - 1; j += 5) {
        let x = (i + 0.5) * fluid.h;
        let y = (j + 0.5) * fluid.h;

        this.ctx.beginPath();
        this.ctx.moveTo(this.cX(x), this.cY(y));

        for (let n = 0; n < numSegs; n++) {
          const u = fluid.sampleField(x, y, U_FIELD);
          const v = fluid.sampleField(x, y, V_FIELD);
          x += u * 0.01;
          y += v * 0.01;
          if (x > fluid.numX * fluid.h) break;

          this.ctx.lineTo(this.cX(x), this.cY(y));
        }
        this.ctx.stroke();
      }
    }
  }
}
