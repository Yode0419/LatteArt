// finishSheet.js
// 出杯：主畫面上的金框杯卡（杯號、日期、花型、一句咖啡師的話），
// 以及從下方拉出、只放按鈕的抽屜（儲存、分享、繼續修飾、再做一杯）。

import { Sheet } from "./sheet.js";
import { t } from "../i18n.js";

const $ = (id) => document.getElementById(id);

export class FinishSheet {
  constructor({ onSave, onShare, onKeepEditing, onAnother }) {
    this.card = $("serveCard");
    this.sheet = new Sheet($("finishSheet"), {
      dimmed: false,
      onClose: () => {
        this.hideCard();
        onKeepEditing();
      },
    });
    this.result = null;
    this.cupNo = "";
    this.date = "";
    $("saveBtn").addEventListener("click", onSave);
    $("shareBtn").addEventListener("click", onShare);
    $("keepEditingBtn").addEventListener("click", () => this.sheet.close());
    $("anotherCupBtn").addEventListener("click", () => {
      this.close();
      onAnother();
    });
  }

  get el() {
    return this.sheet.el;
  }

  get isOpen() {
    return this.sheet.isOpen;
  }

  get slot() {
    return $("cardSlot");
  }

  // 先填好內容（量尺寸用），再顯示卡片與抽屜
  prepare(result, cupNo, date) {
    this.result = result;
    this.cupNo = cupNo;
    this.date = date;
    this.render();
  }

  open() {
    this.card.classList.add("is-shown");
    this.card.setAttribute("aria-hidden", "false");
    this.sheet.open();
  }

  hideCard() {
    this.card.classList.remove("is-shown");
    this.card.setAttribute("aria-hidden", "true");
  }

  close() {
    this.hideCard();
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
