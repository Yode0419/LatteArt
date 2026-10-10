// storage.js
// localStorage 的安全包裝：私密模式或被封鎖時不會丟出例外，只是不保存。

const PREFIX = "latteart.";

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // 無法保存時靜默略過
  }
}
