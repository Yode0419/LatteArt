// servePull.js
// 出杯拉環：往上拖超過門檻放開就出杯（點一下也可以）。
// 拖曳時拉環跟著手指上升、文字變成「放開出杯」，讓「拉起來＝端出去」一看就懂。

import { t } from "../i18n.js";

const THRESHOLD = 56;

export class ServePull {
  constructor(el, label, onServe) {
    this.el = el;
    this.label = label;
    this.onServe = onServe;
    this.startY = null;
    this.dy = 0;

    el.addEventListener("pointerdown", (e) => {
      this.startY = e.clientY;
      this.dy = 0;
      el.setPointerCapture(e.pointerId);
      el.classList.add("is-dragging");
    });
    el.addEventListener("pointermove", (e) => {
      if (this.startY === null) return;
      this.dy = Math.min(0, e.clientY - this.startY);
      // 越拉越重的阻尼感
      const pull = -Math.pow(-this.dy, 0.85);
      el.style.setProperty("--pull", `${pull.toFixed(1)}px`);
      const ready = this.dy < -THRESHOLD;
      el.classList.toggle("is-ready", ready);
      this.label.textContent = t(ready ? "action.releaseToServe" : "action.pullToServe");
    });
    const finish = () => {
      if (this.startY === null) return;
      const tapped = Math.abs(this.dy) < 6;
      const pulled = this.dy < -THRESHOLD;
      this.startY = null;
      el.classList.remove("is-dragging", "is-ready");
      el.style.setProperty("--pull", "0px");
      this.label.textContent = t("action.pullToServe");
      // 延後一個 tick：放開後瀏覽器緊接著派發的 click 不會打到剛出現的遮罩而把抽屜關掉
      if (tapped || pulled) setTimeout(this.onServe, 0);
    };
    el.addEventListener("pointerup", finish);
    el.addEventListener("pointercancel", finish);
    // 鍵盤
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.onServe();
      }
    });
  }
}
