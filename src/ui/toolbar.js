// toolbar.js
// 底部三個工具：注奶／雕花／收尾拉線。

export class Toolbar {
  constructor(root, onSelect) {
    this.buttons = [...root.querySelectorAll(".tool")];
    this.onSelect = onSelect;
    for (const btn of this.buttons) {
      btn.addEventListener("click", () => this.select(btn.dataset.tool, true));
    }
  }

  select(name, fromUser = false) {
    for (const btn of this.buttons) {
      const active = btn.dataset.tool === name;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-checked", String(active));
    }
    document.body.dataset.tool = name;
    if (fromUser) this.onSelect(name);
  }
}
