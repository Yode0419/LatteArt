// finishSheet.js
// 出杯抽屜：金框杯卡（杯號、日期、花型、一句咖啡師的話）與儲存／分享。

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
    this.sheet.open();
  }

  close() {
    this.sheet.close({ silent: true });
  }

  render() {
    if (!this.result) return;
    const r = this.result;
    $("cupNo").textContent = t("finish.cupNo", { no: this.cupNo });
    $("cupDate").textContent = this.date;
    $("patternName").textContent = t(`pattern.${r.pattern}`);
    $("comment").textContent = t(`note.${r.pattern}`, { layers: r.layers });
  }
}
