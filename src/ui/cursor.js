// cursor.js
// 杯面上的兩個指示：使用者的注流瞄準環，以及示範時的幽靈手指。

export class CupCursor {
  constructor(cupEl, renderer) {
    this.cup = cupEl;
    this.space = cupEl.querySelector(".cup__space");
    this.renderer = renderer;
    this.reticle = cupEl.querySelector("#reticle");
    this.ghost = cupEl.querySelector("#ghost");
  }

  // 模擬座標 → 畫布空間內的 CSS 像素（已考慮 3D 傾斜）
  toPx(x, y) {
    const c = this.renderer.simToCanvas(x, y);
    const size = this.space.clientWidth;
    return { left: c.u * size, top: (1 - c.v) * size };
  }

  place(el, x, y) {
    const { left, top } = this.toPx(x, y);
    el.style.transform = `translate(${left}px, ${top}px)`;
  }

  // tool：目前工具；pitcher 提供拉缸高度
  updateReticle(tool, pitcher) {
    const active = tool.active;
    this.reticle.classList.toggle("is-active", active);
    if (!active) return;
    this.place(this.reticle, tool.x, tool.y);
    this.reticle.style.setProperty("--h", pitcher.height.toFixed(3));
  }

  showGhost(x, y, pressed) {
    this.ghost.classList.add("is-visible");
    this.ghost.classList.toggle("is-pressed", pressed);
    this.place(this.ghost, x, y);
  }

  hideGhost() {
    this.ghost.classList.remove("is-visible", "is-pressed");
  }
}
