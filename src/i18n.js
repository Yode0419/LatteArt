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
    "action.finish": "出杯",
    "action.pullToServe": "上滑出杯",
    "action.releaseToServe": "放開出杯",
    "action.newCup": "換一杯",
    "action.close": "關閉",
    "action.save": "儲存圖片",
    "action.share": "分享",
    "action.keepEditing": "繼續修飾",
    "action.another": "再做一杯",

    "intro.line1": "替自己沖一杯，",
    "intro.line2": "拉個花。",

    "demo.watch": "先看我做一杯",
    "demo.pour": "在杯心偏上的地方穩穩地一次注滿，撐出一個乾淨的圓",
    "demo.sink": "切到下沉，從上緣往下一口氣穿過，兩瓣收成一顆心",
    "demo.tail": "不要停，繼續往下帶出細長的尾巴",
    "demo.skip": "跳過",
    "handoff.eyebrow": "示範完成",
    "handoff.title": "換你了",
    "handoff.body": "在杯心偏上穩穩地一次注出一個圓，再切到下沉，從圓的上緣一口氣往下劃過、帶出尾巴，就是一顆心。",
    "handoff.start": "開始",

    "hint.pour.start": "按住杯面開始注奶，拖曳就能作畫。",
    "hint.pour.active": "奶泡浮上來了，左右輕晃或往前推，花紋就成形了。",
    "hint.pour.draw": "再注一次疊出層次，或切到「下沉」劃開花型。",
    "hint.etch": "用針尖輕輕劃過奶泡，勾出細緻的線條。",
    "hint.sink": "從花型上緣往下劃，細水柱會穿過奶泡，把花型收成尖端。",

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
    "settings.replayDemo": "看咖啡師示範一次",

    "finish.title": "你的拿鐵完成了",
    "finish.signature": "親手拉花",
    "finish.cupNo": "No. {no}",

    "pattern.heart": "愛心",
    "pattern.tulip": "鬱金香",
    "pattern.rosetta": "葉子",
    "pattern.monk": "圓月",
    "pattern.freeform": "自由創作",
    "pattern.none": "純粹的 crema",

    "note.heart": "一顆飽滿的心，給今天的自己。",
    "note.tulip": "{layers} 層花瓣，一層一層慢慢推開。",
    "note.rosetta": "細細的葉脈，搖擺的節奏都留在杯面上。",
    "note.monk": "一輪圓月，簡單卻最考驗穩定。",
    "note.freeform": "沒有規則的一杯，只屬於你。",
    "note.none": "什麼都不加，也是一種享受。",

    "share.title": "我的拿鐵拉花",
    "share.text": "我在 LatteArt 拉了一杯{pattern}。",
    "toast.saved": "已儲存圖片",
    "toast.shareFallback": "這個瀏覽器不支援分享，已改為下載",
  },

  en: {
    "cup.label": "Coffee cup — pour latte art here",
    "tool.group": "Tools",
    "tool.pour": "Pour",
    "tool.etch": "Etch",
    "tool.sink": "Sink",
    "action.finish": "Serve",
    "action.pullToServe": "Pull up to serve",
    "action.releaseToServe": "Release to serve",
    "action.newCup": "New cup",
    "action.close": "Close",
    "action.save": "Save Image",
    "action.share": "Share",
    "action.keepEditing": "Keep editing",
    "action.another": "Make another",

    "intro.line1": "Make yourself a cup,",
    "intro.line2": "pour a little art.",

    "demo.watch": "Watch me pour one first",
    "demo.pour": "Pour steadily in one go, just above the center — a clean round disc",
    "demo.sink": "Switch to Sink and cut down from the top edge — the two lobes close into a heart",
    "demo.tail": "Keep going down to draw out a long, thin tail",
    "demo.skip": "Skip",
    "handoff.eyebrow": "Demo complete",
    "handoff.title": "Your turn",
    "handoff.body":
      "Pour one steady disc just above the center, then switch to Sink and cut down from its top edge in one stroke, drawing out a tail.",
    "handoff.start": "Start",

    "hint.pour.start": "Press and hold the cup to pour milk — drag to draw.",
    "hint.pour.active": "The foam is rising. Wiggle side to side or push forward to shape it.",
    "hint.pour.draw": "Pour again to build layers, or switch to Sink to cut the design.",
    "hint.etch": "Drag the needle tip lightly through the foam to draw fine lines.",
    "hint.sink": "Drag down from the top of the design — the thin stream cuts through the foam and pulls it into a point.",

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
    "settings.replayDemo": "Watch the barista",

    "finish.title": "Your latte is ready",
    "finish.signature": "Poured by hand",
    "finish.cupNo": "No. {no}",

    "pattern.heart": "Heart",
    "pattern.tulip": "Tulip",
    "pattern.rosetta": "Rosetta",
    "pattern.monk": "Monk's Head",
    "pattern.freeform": "Freeform",
    "pattern.none": "Pure Crema",

    "note.heart": "A full, round heart — one for yourself today.",
    "note.tulip": "{layers} petals, pushed open one layer at a time.",
    "note.rosetta": "Fine leaf lines — the rhythm of your wrist, left on the surface.",
    "note.monk": "A single full moon. Simple, and the hardest to keep steady.",
    "note.freeform": "No rules, just yours.",
    "note.none": "Nothing added — sometimes that's the treat.",

    "share.title": "My latte art",
    "share.text": "I poured a {pattern} on LatteArt.",
    "toast.saved": "Image saved",
    "toast.shareFallback": "Sharing isn't supported here, so we downloaded it instead",
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
