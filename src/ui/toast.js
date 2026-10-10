// toast.js
// 短暫的狀態提示。

const el = document.getElementById("toast");
let timer = null;

export function toast(message, duration = 2200) {
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove("is-visible"), duration);
}
