// hints.js
// 依目前狀態挑一句咖啡師提示。回傳 i18n key。

import { TOOLS } from "../config.js";

export function pickHint(session, phase) {
  if (session.isExtracting) return "hint.extracting";
  const tool = session.activeTool;
  const pitcher = session.pitcher;
  const name = Object.keys(session.tools).find((k) => session.tools[k] === tool);

  if (name === TOOLS.ETCH) return "hint.etch";
  if (name === TOOLS.SINK) return "hint.sink";

  if (pitcher.isFull) return "hint.pour.full";
  if (pitcher.active) return pitcher.height < 0.5 ? "hint.pour.low" : "hint.pour.high";
  if (session.cup.fill >= 0.5) return "hint.pour.draw";
  return phase === "play" ? "hint.pour.start" : "";
}

// 提示文字淡出、換字、淡入
export class HintLine {
  constructor(el, translate) {
    this.el = el;
    this.translate = translate;
    this.key = null;
    this.timer = null;
  }

  set(key) {
    if (key === this.key) return;
    this.key = key;
    this.el.classList.add("is-swapping");
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.el.textContent = key ? this.translate(key) : "";
      this.el.classList.remove("is-swapping");
    }, 180);
  }

  refresh() {
    this.el.textContent = this.key ? this.translate(this.key) : "";
  }
}
