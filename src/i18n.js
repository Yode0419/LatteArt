// i18n.js
// 繁中／英文字串。文案以溫和的咖啡師口吻撰寫。

import { load, save } from "./storage.js";

const strings = {
  "zh-Hant": {
    "cup.label": "咖啡杯，可以在上面拉花",
    "tool.group": "工具",
    "tool.pour": "注奶",
    "tool.etch": "雕花",
    "tool.sink": "下沉",
    "action.finish": "完成",
    "action.newCup": "換一杯",
    "action.close": "關閉",
    "action.save": "儲存圖片",
    "action.share": "分享",
    "action.keepEditing": "繼續修飾",
    "action.another": "再做一杯",

    "intro.eyebrow": "Specialty Coffee Bar",
    "intro.pulling": "正在萃取一份 espresso…",
    "intro.ready": "crema 浮上來了。",
    "intro.skip": "輕點跳過",

    "demo.watch": "先看我做一杯",
    "demo.base": "高注打底，讓牛奶沉進 espresso 裡",
    "demo.lower": "拉缸壓低，奶泡浮上來了",
    "demo.sink": "提高拉缸，細水柱從上往下穿過，收成一顆心",
    "demo.skip": "跳過",
    "handoff.eyebrow": "示範完成",
    "handoff.title": "換你了",
    "handoff.body": "按住杯心先高注打底，液位夠了拉缸會自動壓低；最後切到下沉，從上往下穿過收成愛心。",
    "handoff.start": "開始注奶",

    "hint.extracting": "稍等一下，espresso 還在萃取。",
    "hint.pour.start": "按住杯心，高高地注入牛奶打底。",
    "hint.pour.high": "高注中，牛奶正沉進 espresso 底下。",
    "hint.pour.low": "拉缸壓低了，奶泡開始浮上來。",
    "hint.pour.draw": "很好。再壓低注一次，或切到下沉從上往下收尾。",
    "hint.pour.full": "杯子滿了。用下沉收尾、雕花修飾，或按完成。",
    "hint.etch": "用針尖輕輕勾出細線，替花型加點細節。",
    "hint.sink": "從花型上方往下劃過，細水柱會穿過奶泡收成尖端。",

    "settings.title": "設定",
    "settings.language": "語言",
    "settings.activeTool": "目前工具",
    "settings.radius": "範圍",
    "settings.strength": "力道",
    "settings.display": "顯示",
    "settings.resolution": "解析度",
    "settings.streamlines": "流線",
    "settings.advanced": "進階模擬",
    "settings.damping": "黏滯",
    "settings.ambient": "液面微流",
    "settings.vorticity": "漩渦保持",
    "settings.iterations": "求解迭代",
    "settings.overRelaxation": "過度鬆弛",
    "settings.replayDemo": "再看一次咖啡師示範",

    "finish.title": "你的拿鐵完成了",
    "finish.cupNo": "No. {no} · {date}",
    "metric.symmetry": "對稱",
    "metric.centering": "置中",
    "metric.contrast": "對比",
    "metric.balance": "比例",

    "pattern.heart": "愛心",
    "pattern.tulip": "鬱金香 · {layers} 層",
    "pattern.rosetta": "葉子",
    "pattern.monk": "圓月",
    "pattern.freeform": "自由創作",
    "pattern.none": "一杯乾淨的 crema",

    "comment.none": "還沒看到奶泡呢。下次試著把拉缸壓低一點，讓白色浮上來。",
    "comment.tooLittle": "花型小巧了點，壓低後多注一會兒，奶泡會長得更飽滿。",
    "comment.tooMuch": "奶泡幾乎蓋滿杯面，下次早一點收，留些 crema 的對比。",
    "comment.offCenter": "花型偏了一點。注的時候盯著杯心，讓它在中間開出來。",
    "comment.asymmetric": "左右不太平均，搖擺時手腕放鬆，節奏一致會更對稱。",
    "comment.lowContrast": "底色被牛奶染得太淡了，高注打底短一點，白色會更跳。",
    "comment.simple": "乾淨的一杯。試著搖擺拉缸或分段推進，做出更多層次。",
    "comment.great": "對稱、乾淨又置中，這杯可以直接端出去了。",
    "comment.good": "很漂亮的一杯，對比清楚、比例舒服。",

    "share.title": "我的拿鐵拉花",
    "share.text": "我在 LatteArt 拉了一杯 {pattern}，{score} 分。",
    "toast.saved": "已儲存圖片",
    "toast.shareFallback": "這個瀏覽器不支援分享，已改為下載",
    "toast.full": "杯子滿了",
  },

  en: {
    "cup.label": "Coffee cup — pour latte art here",
    "tool.group": "Tools",
    "tool.pour": "Pour",
    "tool.etch": "Etch",
    "tool.sink": "Sink",
    "action.finish": "Finish",
    "action.newCup": "New cup",
    "action.close": "Close",
    "action.save": "Save Image",
    "action.share": "Share",
    "action.keepEditing": "Keep editing",
    "action.another": "Make another",

    "intro.eyebrow": "Specialty Coffee Bar",
    "intro.pulling": "Pulling a shot of espresso…",
    "intro.ready": "The crema is up.",
    "intro.skip": "Tap to skip",

    "demo.watch": "Watch me pour one first",
    "demo.base": "Pour high to set the base — the milk dives under",
    "demo.lower": "Pitcher down — now the foam floats up",
    "demo.sink": "Lift the pitcher and cut a thin stream through the middle",
    "demo.skip": "Skip",
    "handoff.eyebrow": "Demo complete",
    "handoff.title": "Your turn",
    "handoff.body":
      "Hold the center to pour high. Once the cup fills, the pitcher lowers by itself. Then switch to Sink and cut down through the middle.",
    "handoff.start": "Start pouring",

    "hint.extracting": "One moment — the espresso is still pulling.",
    "hint.pour.start": "Press and hold in the center to pour high and set the base.",
    "hint.pour.high": "Pouring high — the milk is diving under the espresso.",
    "hint.pour.low": "Pitcher's down. The foam is rising to the top.",
    "hint.pour.draw": "Nice. Pour low again, or switch to Sink to cut through.",
    "hint.pour.full": "The cup is full. Cut through with Sink, detail with Etch, or tap Finish.",
    "hint.etch": "Use the needle tip to draw fine details.",
    "hint.sink": "Drag down through the design — the thin stream pulls it into a point.",

    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.activeTool": "Active tool",
    "settings.radius": "Radius",
    "settings.strength": "Strength",
    "settings.display": "Display",
    "settings.resolution": "Resolution",
    "settings.streamlines": "Streamlines",
    "settings.advanced": "Advanced simulation",
    "settings.damping": "Damping",
    "settings.ambient": "Surface drift",
    "settings.vorticity": "Swirl",
    "settings.iterations": "Iterations",
    "settings.overRelaxation": "Relaxation",
    "settings.replayDemo": "Watch the barista again",

    "finish.title": "Your latte is ready",
    "finish.cupNo": "No. {no} · {date}",
    "metric.symmetry": "Symmetry",
    "metric.centering": "Centering",
    "metric.contrast": "Contrast",
    "metric.balance": "Balance",

    "pattern.heart": "Heart",
    "pattern.tulip": "Tulip · {layers} layers",
    "pattern.rosetta": "Rosetta",
    "pattern.monk": "Monk's Head",
    "pattern.freeform": "Freeform",
    "pattern.none": "A clean cup of crema",

    "comment.none": "No foam on top yet. Next time, bring the pitcher lower so the white can float up.",
    "comment.tooLittle": "A petite design. Pour a little longer once you're low and it'll fill out.",
    "comment.tooMuch": "The foam covers almost everything — stop a touch earlier to keep some crema contrast.",
    "comment.offCenter": "It drifted off center. Keep your eye on the middle of the cup as you pour.",
    "comment.asymmetric": "A little lopsided. Relax your wrist and keep the rhythm even.",
    "comment.lowContrast": "The base got too milky. Keep the high pour shorter so the white really pops.",
    "comment.simple": "A clean cup. Try wiggling the pitcher or pouring in stages for more layers.",
    "comment.great": "Symmetric, clean and centered — this one's ready for the counter.",
    "comment.good": "A lovely cup with clear contrast and nice proportions.",

    "share.title": "My latte art",
    "share.text": "I poured a {pattern} on LatteArt — {score}/100.",
    "toast.saved": "Image saved",
    "toast.shareFallback": "Sharing isn't supported here, so we downloaded it instead",
    "toast.full": "The cup is full",
  },
};

function detect() {
  const saved = load("lang");
  if (saved && strings[saved]) return saved;
  const nav = (navigator.language || "en").toLowerCase();
  return nav.startsWith("zh") ? "zh-Hant" : "en";
}

let current = detect();
const listeners = new Set();

export function getLang() {
  return current;
}

export function t(key, vars = {}) {
  const table = strings[current] || strings.en;
  let text = table[key] ?? strings.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replaceAll(`{${k}}`, v);
  }
  return text;
}

export function applyI18n(root = document) {
  document.documentElement.lang = current;
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  });
}

export function setLang(lang) {
  if (!strings[lang] || lang === current) return;
  current = lang;
  save("lang", lang);
  applyI18n();
  listeners.forEach((fn) => fn(lang));
}

export function onLangChange(fn) {
  listeners.add(fn);
}
