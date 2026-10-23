// sheet.js
// 抽屜：開關、共用遮罩、Esc 關閉、拖曳關閉（axis "y" 往下滑，"x" 往右滑）。

const scrim = document.getElementById("scrim");
const openSheets = new Set();

scrim.addEventListener("click", () => {
  for (const sheet of [...openSheets]) if (sheet.dismissible) sheet.close();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  for (const sheet of [...openSheets]) if (sheet.dismissible) sheet.close();
});

function syncScrim() {
  const visible = [...openSheets].some((s) => s.dimmed);
  scrim.classList.toggle("is-visible", openSheets.size > 0);
  scrim.classList.toggle("scrim--clear", !visible);
}

export class Sheet {
  constructor(el, { dismissible = true, dimmed = true, axis = "y", onClose = null } = {}) {
    this.el = el;
    this.axis = axis;
    this.dismissible = dismissible;
    this.dimmed = dimmed;
    this.onClose = onClose;
    this.returnFocus = null;
    this.setupDrag();
  }

  get isOpen() {
    return openSheets.has(this);
  }

  open() {
    if (this.isOpen) return;
    this.returnFocus = document.activeElement;
    openSheets.add(this);
    this.el.classList.add("is-open");
    this.el.setAttribute("aria-hidden", "false");
    syncScrim();
    const focusable = this.el.querySelector("button, input, summary");
    if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 50);
  }

  close({ silent = false } = {}) {
    if (!this.isOpen) return;
    openSheets.delete(this);
    this.el.classList.remove("is-open");
    this.el.setAttribute("aria-hidden", "true");
    this.resetDrag();
    syncScrim();
    if (this.returnFocus && this.returnFocus.focus) this.returnFocus.focus({ preventScroll: true });
    if (!silent && this.onClose) this.onClose();
  }

  setDrag(px) {
    if (this.axis === "x") this.el.style.setProperty("--drag", `${px}px`);
    else this.el.style.transform = `translate(-50%, ${px}px)`;
  }

  resetDrag() {
    this.el.style.removeProperty("--drag");
    this.el.style.transform = "";
  }

  // 從把手或標題列拖超過 80px 就關閉（方向看 axis）
  setupDrag() {
    const handle = this.el.querySelector(".sheet__handle");
    const header = this.el.querySelector(".sheet__header") || handle;
    let start = null;
    let delta = 0;
    const down = (e) => {
      if (!this.dismissible || e.target.closest("button")) return;
      start = this.axis === "x" ? e.clientX : e.clientY;
      delta = 0;
      this.el.classList.add("is-dragging");
      e.currentTarget.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if (start === null) return;
      delta = Math.max(0, (this.axis === "x" ? e.clientX : e.clientY) - start);
      this.setDrag(delta);
    };
    const up = () => {
      if (start === null) return;
      start = null;
      this.el.classList.remove("is-dragging");
      this.resetDrag();
      if (delta > 80) this.close();
    };
    for (const el of new Set([handle, header])) {
      if (!el) continue;
      el.style.touchAction = "none";
      el.addEventListener("pointerdown", down);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    }
  }
}
