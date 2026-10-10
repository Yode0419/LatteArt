// streamlines.js
// 除錯用：在 2D 疊加層畫出速度場的流線。

import { U_FIELD, V_FIELD } from "../fluid/fluidCore.js";

export function drawStreamlines(ctx, fluid, renderer) {
  const W = ctx.canvas.width;
  ctx.clearRect(0, 0, W, W);
  ctx.strokeStyle = "rgba(227, 160, 143, 0.55)";
  ctx.lineWidth = Math.max(1, W / 600);
  const stepCells = Math.max(3, Math.round(fluid.N / 32));
  const toPx = (x, y) => {
    const c = renderer.simToCanvas(x, y);
    return [c.u * W, (1 - c.v) * W];
  };

  ctx.beginPath();
  for (let i = 1; i < fluid.numX - 1; i += stepCells) {
    for (let j = 1; j < fluid.numY - 1; j += stepCells) {
      if (fluid.s[i * fluid.numY + j] === 0.0) continue;
      let x = (i + 0.5) * fluid.h;
      let y = (j + 0.5) * fluid.h;
      ctx.moveTo(...toPx(x, y));
      for (let k = 0; k < 16; k++) {
        x += fluid.sampleField(x, y, U_FIELD) * 0.02;
        y += fluid.sampleField(x, y, V_FIELD) * 0.02;
        ctx.lineTo(...toPx(x, y));
      }
    }
  }
  ctx.stroke();
}
