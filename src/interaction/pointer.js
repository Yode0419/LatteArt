// pointer.js
// 把畫布上的滑鼠／觸控統一成 begin / move / end，並換算成模擬座標。

export class PointerInput {
  constructor(canvas, renderer, handlers) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.handlers = handlers; // { begin(sim, uv), move(sim, uv), end() }
    this.enabled = false;
    this.pointerId = null;

    canvas.addEventListener("pointerdown", (e) => this.onDown(e));
    canvas.addEventListener("pointermove", (e) => this.onMove(e));
    canvas.addEventListener("pointerup", (e) => this.onUp(e));
    canvas.addEventListener("pointercancel", (e) => this.onUp(e));
    canvas.addEventListener("lostpointercapture", (e) => this.onUp(e));
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  // 回傳 canvas uv（0–1，y 向上）
  toUv(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      u: (e.clientX - rect.left) / rect.width,
      v: 1 - (e.clientY - rect.top) / rect.height,
    };
  }

  toSim(uv) {
    const p = this.renderer.canvasToSim(uv.u, uv.v);
    // 限制在液面內
    const dx = p.x - 0.5;
    const dy = p.y - 0.5;
    const d = Math.hypot(dx, dy);
    const max = this.renderer.simRadius * 0.97;
    if (d > max) {
      p.x = 0.5 + (dx / d) * max;
      p.y = 0.5 + (dy / d) * max;
    }
    return p;
  }

  onDown(e) {
    if (!this.enabled || this.pointerId !== null) return;
    e.preventDefault();
    this.pointerId = e.pointerId;
    this.canvas.setPointerCapture(e.pointerId);
    const uv = this.toUv(e);
    this.handlers.begin(this.toSim(uv), uv);
  }

  onMove(e) {
    if (e.pointerId !== this.pointerId) return;
    const uv = this.toUv(e);
    this.handlers.move(this.toSim(uv), uv);
  }

  onUp(e) {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.handlers.end();
  }

  // 切換階段時強制放開
  cancel() {
    if (this.pointerId !== null) {
      this.pointerId = null;
      this.handlers.end();
    }
  }
}
