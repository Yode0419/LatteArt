// finishSheet.js
// 「你的拿鐵完成了」抽屜：杯號、分數、花型、評語與四項指標。

import { Sheet } from "./sheet.js";
import { t } from "../i18n.js";

const $ = (id) => document.getElementById(id);

export class FinishSheet {
  constructor({ onSave, onShare, onKeepEditing, onAnother }) {
    this.sheet = new Sheet($("finishSheet"), { onClose: onKeepEditing, dimmed: false });
    this.result = null;
    this.cupNo = "";
    this.date = "";
    $("saveBtn").addEventListener("click", onSave);
    $("shareBtn").addEventListener("click", onShare);
    $("keepEditingBtn").addEventListener("click", () => this.sheet.close());
    $("anotherCupBtn").addEventListener("click", () => {
      this.sheet.close({ silent: true });
      onAnother();
    });
  }

  get el() {
    return this.sheet.el;
  }

  get isOpen() {
    return this.sheet.isOpen;
  }

  open(result, cupNo, date) {
    this.result = result;
    this.cupNo = cupNo;
    this.date = date;
    this.render();
    // 先歸零再填入，讓指標條有長出來的動畫
    for (const el of document.querySelectorAll(".metric")) el.style.setProperty("--value", 0);
    this.sheet.open();
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        for (const el of document.querySelectorAll(".metric")) {
          el.style.setProperty("--value", Math.round(result.metrics[el.dataset.metric] * 100));
        }
      })
    );
    this.countUp(result.score);
  }

  close() {
    this.sheet.close({ silent: true });
  }

  render() {
    if (!this.result) return;
    const r = this.result;
    $("cupNo").textContent = t("finish.cupNo", { no: this.cupNo, date: this.date });
    $("patternName").textContent = t(`pattern.${r.pattern}`, { layers: r.layers });
    $("comment").textContent = t(`comment.${r.comment}`);
  }

  countUp(target) {
    const el = $("scoreNum");
    const start = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - start) / 900);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
