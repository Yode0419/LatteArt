import { Fluid } from "./fluid/fluidCore.js";
import { FluidRenderer } from "./render.js";
import { FluidInteraction } from "./interaction/interaction.js";
import { MilkInjector } from "./fluid/pouring.js";
import { StirringSimulator } from "./fluid/stir.js";
import { SuctionSimulator } from "./fluid/suction.js";
import { Controls } from "./interaction/controlPanel.js";
import { config, SIMULATION_MODES } from "./config.js";

const canvas = document.getElementById("myCanvas");
const appShell = document.getElementById("appShell");
const canvasStage = document.querySelector(".canvas-stage");
const settingsButton = document.getElementById("settingsButton");
const settingsDrawer = document.getElementById("settingsDrawer");
const closeSettingsButton = document.getElementById("closeSettings");
const completionSheet = document.getElementById("completionSheet");
const finishTray = document.getElementById("finishTray");
const keepEditingButton = document.getElementById("keepEditing");
const sheetScrim = document.getElementById("sheetScrim");
const restartButton = document.getElementById("restartButton");
const saveButton = document.getElementById("saveButton");
const shareButton = document.getElementById("shareButton");
const shareLoading = document.getElementById("shareLoading");
const toast = document.getElementById("toast");
const artworkCapture = document.getElementById("artworkCapture");

const modeElements = {
  pour: {
    button: document.getElementById("pouringMode"),
    panel: document.getElementById("pouringControls"),
    mode: SIMULATION_MODES.POURING,
  },
  stir: {
    button: document.getElementById("stirringMode"),
    panel: document.getElementById("stirringControls"),
    mode: SIMULATION_MODES.STIRRING,
  },
  suction: {
    button: document.getElementById("suctionMode"),
    panel: document.getElementById("suctionControls"),
    mode: SIMULATION_MODES.SUCTION,
  },
};

const translations = {
  en: {
    pour: "Pour",
    stir: "Stir",
    suction: "Suction",
    finish: "Finish",
    settings: "Settings",
    language: "Language",
    radius: "Radius",
    strength: "Strength",
    display: "Display",
    resolution: "Resolution",
    streamlines: "Streamlines",
    advanced: "Advanced simulation",
    viscosity: "Viscosity",
    gravity: "Gravity",
    iterations: "Iterations",
    relaxation: "Over-relaxation",
    ready: "Your latte is ready",
    save: "Save Image",
    share: "Share",
    keepEditing: "Keep editing",
    preparing: "Preparing your latte…",
    reset: "Reset latte",
    settingsAria: "Open settings",
    closeSettings: "Close settings",
    canvas: "Interactive latte art canvas",
    canvasInstructions: "Interactive latte art canvas. Use the arrow keys to move and create; press Space or Enter to apply the selected tool.",
    tools: "Creative tools",
    resetDone: "Fresh cup, ready to create.",
    saved: "Latte image saved.",
    shared: "Latte shared.",
    downloaded: "Sharing is unavailable, so the image was downloaded.",
    exportError: "The image could not be prepared. Please try again.",
    activeTool: (tool) => `Active tool · ${tool}`,
  },
  "zh-TW": {
    pour: "倒奶",
    stir: "攪拌",
    suction: "吸取",
    finish: "出杯",
    settings: "設定",
    language: "語言",
    radius: "範圍",
    strength: "力度",
    display: "顯示",
    resolution: "解析度",
    streamlines: "流線",
    advanced: "進階模擬",
    viscosity: "黏度",
    gravity: "重力",
    iterations: "迭代次數",
    relaxation: "過度鬆弛",
    ready: "你的拉花完成了",
    save: "儲存圖片",
    share: "分享",
    keepEditing: "繼續編輯",
    preparing: "正在準備你的拉花…",
    reset: "重新開始",
    settingsAria: "開啟設定",
    closeSettings: "關閉設定",
    canvas: "互動式拉花畫布",
    canvasInstructions: "互動式拉花畫布。使用方向鍵移動並創作，按空白鍵或 Enter 使用目前工具。",
    tools: "創作工具",
    resetDone: "新的一杯已準備好。",
    saved: "拉花圖片已儲存。",
    shared: "拉花已分享。",
    downloaded: "此瀏覽器無法分享，已改為下載圖片。",
    exportError: "目前無法產生圖片，請再試一次。",
    activeTool: (tool) => `目前工具・${tool}`,
  },
};

let currentLanguage = getInitialLanguage();
let currentModeKey = "pour";
let fluid;
let renderer;
let interaction;
let stirringSimulator;
let suctionSimulator;
let milkInjector;
let toastTimer;
let wasPausedBeforeCompletion = false;
let resizeFrame;
const keyboardPosition = { x: 0.5, y: 0.5 };

function getInitialLanguage() {
  const stored = localStorage.getItem("latteart-language");
  if (stored && translations[stored]) return stored;
  return navigator.language?.toLowerCase().startsWith("zh") ? "zh-TW" : "en";
}

function t(key) {
  return translations[currentLanguage][key] ?? translations.en[key] ?? key;
}

function setLanguage(language, persist = true) {
  if (!translations[language]) return;
  currentLanguage = language;
  document.documentElement.lang = language;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = t(key);
  });

  const ariaKeys = {
    reset: "reset",
    settings: "settingsAria",
    closeSettings: "closeSettings",
    canvas: "canvasInstructions",
    tools: "tools",
  };

  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    const key = ariaKeys[element.dataset.i18nAria];
    if (key) element.setAttribute("aria-label", t(key));
  });

  document.querySelectorAll("[data-language]").forEach((button) => {
    const active = button.dataset.language === language;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  updateToolSettingTitles();
  if (persist) localStorage.setItem("latteart-language", language);
}

function updateToolSettingTitles() {
  document.querySelectorAll("[data-tool-title]").forEach((title) => {
    const toolKey = title.dataset.toolTitle;
    title.textContent = t("activeTool")(t(toolKey));
  });
}

function canvasPixelSize() {
  const renderedWidth = canvas.getBoundingClientRect().width;
  return Math.max(260, Math.round(renderedWidth || Math.min(window.innerWidth * 0.86, 560)));
}

function handleParamChange(section, property) {
  if (section === "display" && property === "resolution") initSimulation();
  if (section === "fluid" && property === "viscosity" && fluid) {
    fluid.viscosity = config.fluid.viscosity;
  }
}

new Controls(config, handleParamChange);

function initSimulation() {
  const size = canvasPixelSize();
  if (canvas.width !== size || canvas.height !== size) {
    canvas.width = size;
    canvas.height = size;
  }

  const domainHeight = 1;
  const domainWidth = domainHeight;
  const h = domainHeight / config.display.resolution;
  const numX = Math.floor(domainWidth / h);
  const numY = Math.floor(domainHeight / h);

  fluid = new Fluid(
    config.fluid.density,
    numX,
    numY,
    h,
    config.fluid.viscosity
  );

  setupCircularBoundary(fluid);
  renderer = new FluidRenderer(canvas, domainHeight);

  if (!interaction) interaction = new FluidInteraction(canvas, renderer);
  else interaction.renderer = renderer;

  milkInjector = new MilkInjector(fluid, config);
  stirringSimulator = new StirringSimulator(fluid, config);
  suctionSimulator = new SuctionSimulator(fluid, config);
  applyMode(currentModeKey, false);
}

function syncCanvasSize() {
  const size = canvasPixelSize();
  if (!fluid || (canvas.width === size && canvas.height === size)) return;
  canvas.width = size;
  canvas.height = size;
  renderer = new FluidRenderer(canvas, 1);
  interaction.renderer = renderer;
}

function scheduleCanvasResize() {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(syncCanvasSize);
}

function interactionHandlerFor(key) {
  if (key === "stir") return stirringSimulator;
  if (key === "suction") return suctionSimulator;
  return milkInjector;
}

function applyMode(key, announce = true) {
  if (!modeElements[key]) return;
  currentModeKey = key;
  config.simulation.currentMode = modeElements[key].mode;

  Object.entries(modeElements).forEach(([modeKey, item]) => {
    const active = modeKey === key;
    item.button.classList.toggle("active", active);
    item.button.setAttribute("aria-pressed", String(active));
    item.panel.hidden = !active;
  });

  if (interaction) interaction.setInteractionHandler(interactionHandlerFor(key));
  if (announce) canvas.focus({ preventScroll: true });
}

Object.keys(modeElements).forEach((key) => {
  modeElements[key].button.addEventListener("click", () => applyMode(key));
});

function updateKeyboardCursor() {
  canvasStage.style.setProperty("--keyboard-x", `${4 + keyboardPosition.x * 92}%`);
  canvasStage.style.setProperty("--keyboard-y", `${4 + (1 - keyboardPosition.y) * 92}%`);
}

canvas.addEventListener("keydown", (event) => {
  const movement = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, 1],
    ArrowDown: [0, -1],
  }[event.key];

  if (movement) {
    event.preventDefault();
    const previous = { ...keyboardPosition };
    const step = event.shiftKey ? 0.08 : 0.035;
    keyboardPosition.x = Math.min(0.92, Math.max(0.08, keyboardPosition.x + movement[0] * step));
    keyboardPosition.y = Math.min(0.92, Math.max(0.08, keyboardPosition.y + movement[1] * step));
    updateKeyboardCursor();
    interaction.applyKeyboardGesture(previous, keyboardPosition);
    return;
  }

  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    if (currentModeKey === "stir") {
      const stirStart = { x: Math.max(0.08, keyboardPosition.x - 0.025), y: keyboardPosition.y };
      const stirEnd = { x: Math.min(0.92, keyboardPosition.x + 0.025), y: keyboardPosition.y };
      interaction.applyKeyboardGesture(stirStart, stirEnd);
    } else {
      interaction.applyKeyboardGesture(keyboardPosition);
    }
  }
});

document.querySelectorAll("[data-language]").forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});

function openSettings() {
  closeCompletion();
  appShell.classList.add("is-settings-open");
  settingsDrawer.classList.add("is-open");
  settingsDrawer.setAttribute("aria-hidden", "false");
  settingsButton.setAttribute("aria-expanded", "true");
  sheetScrim.classList.add("is-visible");
  appShell.inert = true;
  requestAnimationFrame(() => closeSettingsButton.focus({ preventScroll: true }));
}

function closeSettings({ restoreFocus = true } = {}) {
  appShell.classList.remove("is-settings-open");
  settingsDrawer.classList.remove("is-open");
  settingsDrawer.setAttribute("aria-hidden", "true");
  settingsButton.setAttribute("aria-expanded", "false");
  sheetScrim.classList.remove("is-visible");
  appShell.inert = false;
  if (restoreFocus) settingsButton.focus({ preventScroll: true });
}

function openCompletion() {
  if (completionSheet.classList.contains("is-open")) return;
  closeSettings({ restoreFocus: false });
  wasPausedBeforeCompletion = config.debug.paused;
  config.debug.paused = true;
  appShell.classList.add("is-complete");
  completionSheet.classList.add("is-open");
  completionSheet.setAttribute("aria-hidden", "false");
  appShell.inert = true;
  requestAnimationFrame(() => saveButton.focus({ preventScroll: true }));
}

function closeCompletion({ restoreFocus = true } = {}) {
  if (!completionSheet.classList.contains("is-open")) return;
  completionSheet.classList.remove("is-open");
  completionSheet.setAttribute("aria-hidden", "true");
  appShell.classList.remove("is-complete");
  appShell.inert = false;
  config.debug.paused = wasPausedBeforeCompletion;
  if (restoreFocus) finishTray.focus({ preventScroll: true });
}

settingsButton.addEventListener("click", () => {
  if (settingsDrawer.classList.contains("is-open")) closeSettings();
  else openSettings();
});
closeSettingsButton.addEventListener("click", () => closeSettings());
sheetScrim.addEventListener("click", () => closeSettings());
keepEditingButton.addEventListener("click", () => closeCompletion());
finishTray.addEventListener("click", openCompletion);

let finishPointerStart = null;
finishTray.addEventListener("pointerdown", (event) => {
  finishPointerStart = event.clientY;
  finishTray.setPointerCapture?.(event.pointerId);
});
finishTray.addEventListener("pointerup", (event) => {
  if (finishPointerStart !== null && finishPointerStart - event.clientY > 28) {
    event.preventDefault();
    openCompletion();
  }
  finishPointerStart = null;
});
finishTray.addEventListener("pointercancel", () => {
  finishPointerStart = null;
});

restartButton.addEventListener("click", () => {
  closeCompletion({ restoreFocus: false });
  closeSettings({ restoreFocus: false });
  initSimulation();
  config.debug.frameNr = 0;
  showToast(t("resetDone"));
});

document.addEventListener("keydown", (event) => {
  const openSheet = settingsDrawer.classList.contains("is-open")
    ? settingsDrawer
    : completionSheet.classList.contains("is-open")
      ? completionSheet
      : null;

  if (event.key === "Escape") {
    if (openSheet === settingsDrawer) closeSettings();
    else if (openSheet === completionSheet) closeCompletion();
    return;
  }

  if (event.key !== "Tab" || !openSheet) return;
  const focusable = [...openSheet.querySelectorAll('button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden && element.getClientRects().length > 0);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function setLoading(loading) {
  shareLoading.classList.toggle("is-visible", loading);
  shareLoading.setAttribute("aria-hidden", String(!loading));
  saveButton.disabled = loading;
  shareButton.disabled = loading;
}

async function createArtworkBlob() {
  if (typeof window.html2canvas === "function") {
    const rendered = await window.html2canvas(artworkCapture, {
      backgroundColor: "#080302",
      scale: Math.min(2, window.devicePixelRatio || 1),
      useCORS: true,
      logging: false,
    });
    return new Promise((resolve, reject) => {
      rendered.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))), "image/png");
    });
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))), "image/png");
  });
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "latte-art.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function withArtwork(action) {
  setLoading(true);
  try {
    const blob = await createArtworkBlob();
    await action(blob);
  } catch (error) {
    console.error(error);
    showToast(t("exportError"));
  } finally {
    setLoading(false);
  }
}

saveButton.addEventListener("click", () =>
  withArtwork(async (blob) => {
    downloadBlob(blob);
    showToast(t("saved"));
  })
);

shareButton.addEventListener("click", () =>
  withArtwork(async (blob) => {
    const file = new File([blob], "latte-art.png", { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "LatteArt" });
        showToast(t("shared"));
      } catch (error) {
        if (error?.name !== "AbortError") throw error;
      }
    } else {
      downloadBlob(blob);
      showToast(t("downloaded"));
    }
  })
);

function setupCircularBoundary(targetFluid) {
  const n = targetFluid.numY;
  const centerX = (targetFluid.numX - 3) / 2;
  const centerY = (targetFluid.numY - 3) / 2;
  const radius = Math.min(centerX, centerY) * 0.99;

  for (let i = 0; i < targetFluid.numX; i++) {
    for (let j = 0; j < targetFluid.numY; j++) {
      const dx = i - centerX;
      const dy = j - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      targetFluid.s[i * n + j] = distance > radius ? 0 : 1;
    }
  }
}

function update() {
  if (!config.debug.paused) {
    fluid.simulate(
      config.fluid.dt,
      config.fluid.gravity,
      config.fluid.numIters,
      config.fluid.overRelaxation,
      config.fluid.viscosity
    );
    config.debug.frameNr++;
  }

  renderer.draw(fluid, {
    showStreamlines: config.display.showStreamlines,
  });
  requestAnimationFrame(update);
}

const interactionStartEvents = ["mousedown", "touchstart"];
const interactionEndEvents = ["mouseup", "mouseleave", "touchend", "touchcancel"];
interactionStartEvents.forEach((eventName) => {
  canvas.addEventListener(eventName, () => canvasStage.classList.add("is-interacting"), { passive: true });
});
interactionEndEvents.forEach((eventName) => {
  canvas.addEventListener(eventName, () => canvasStage.classList.remove("is-interacting"), { passive: true });
});

setLanguage(currentLanguage, false);
initSimulation();
updateKeyboardCursor();
if ("ResizeObserver" in window) {
  new ResizeObserver(scheduleCanvasResize).observe(canvasStage);
} else {
  window.addEventListener("resize", scheduleCanvasResize, { passive: true });
}
window.addEventListener("orientationchange", scheduleCanvasResize, { passive: true });
update();
