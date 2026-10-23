// main.js
// 進入點：組裝模擬、渲染、互動與 UI，並以 phase 狀態機串起整段敘事：
//   intro（一句開場）→ serving（端上一杯）→ play ⇄ finish
//   設定裡可重看示範：serving → demo → handoff（換你了）→ serving → play

import { config, TOOLS } from "./config.js";
import { t, applyI18n, onLangChange } from "./i18n.js";
import { load, save } from "./storage.js";
import { ServeHalo } from "./ui/halo.js";
import { ServePull } from "./ui/servePull.js";
import { LatteSession } from "./session.js";
import { LatteRenderer } from "./render/latteRenderer.js";
import { drawStreamlines } from "./render/streamlines.js";
import { PointerInput } from "./interaction/pointer.js";
import { TiltController } from "./interaction/tilt.js";
import { detectPattern } from "./analysis/pattern.js";
import { composeCard, download, share } from "./share/shareCard.js";
import { pickHint, HintLine } from "./story/hints.js";
import { DemoPlayer } from "./story/demo.js";
import { Sheet } from "./ui/sheet.js";
import { Toolbar } from "./ui/toolbar.js";
import { CupCursor } from "./ui/cursor.js";
import { SettingsPanel } from "./ui/settingsPanel.js";
import { FinishSheet } from "./ui/finishSheet.js";
import { toast } from "./ui/toast.js";

const $ = (id) => document.getElementById(id);
const body = document.body;
const cupEl = $("cup");
const spaceEl = cupEl.querySelector(".cup__space");
const canvas = $("latteCanvas");
const overlay = $("overlayCanvas");
const overlayCtx = overlay.getContext("2d");

const session = new LatteSession();
const renderer = new LatteRenderer(canvas);
const cursor = new CupCursor(cupEl, renderer);
const hint = new HintLine($("hint"), t);
const halo = new ServeHalo($("fxCanvas"), renderer);
const tilt = new TiltController();

let phase = "intro";
let glow = 0;
let cupNumber = null; // 這杯完成時才配發杯號
let demoCaption = "";
let streamlinesDrawn = false;

function setPhase(next) {
  phase = next;
  body.dataset.phase = next;
  pointer.enabled = next === "play";
  if (next !== "play") pointer.cancel();
}

// ---------- 工具與互動 ----------

function selectTool(name) {
  session.setTool(name);
  toolbar.select(name);
  settings.syncToolName();
}

const toolbar = new Toolbar(document.querySelector(".toolbar"), selectTool);

const pointer = new PointerInput(canvas, renderer, {
  begin(p) {
    session.begin(p.x, p.y);
  },
  move(p) {
    session.move(p.x, p.y);
  },
  end() {
    session.end();
  },
});

// ---------- 設定 ----------

const settingsBtn = $("settingsBtn");
const settingsSheet = new Sheet($("settingsSheet"), {
  axis: "x",
  onClose: () => settingsBtn.setAttribute("aria-expanded", "false"),
});
const settings = new SettingsPanel({
  onResolution: () => session.rebuild(),
  onReplayDemo: () => {
    settingsSheet.close();
    newCup(() => startDemo());
  },
});

settingsBtn.addEventListener("click", () => {
  if (settingsSheet.isOpen) {
    settingsSheet.close();
    return;
  }
  settings.refresh();
  settingsSheet.open();
  settingsBtn.setAttribute("aria-expanded", "true");
});
$("closeSettingsBtn").addEventListener("click", () => settingsSheet.close());

// ---------- 完成與分享 ----------

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

let lastResult = null;

function finish() {
  if (phase !== "play") return;
  if (cupNumber === null) {
    cupNumber = load("cupCount", 0) + 1;
    save("cupCount", cupNumber);
  }
  lastResult = detectPattern(session.fluid);
  finishSheet.prepare(lastResult, String(cupNumber).padStart(3, "0"), today());
  setPhase("finish");
  layoutServe();
  finishSheet.open();
  halo.play();
}

// 杯卡跟杯子同一個傾斜：卡片用 CSS 透視轉動（幅度放大一些），光澤反向滑動
const serveCardEl = $("serveCard");
function tiltCard(view) {
  const deg = 180 / Math.PI;
  const k = 1.6;
  serveCardEl.style.setProperty("--card-rx", `${(-view.ax * deg * k).toFixed(2)}deg`);
  serveCardEl.style.setProperty("--card-ry", `${(view.ay * deg * k).toFixed(2)}deg`);
  serveCardEl.style.setProperty("--sheen-x", `${(50 - view.ay * 500).toFixed(1)}%`);
  serveCardEl.style.setProperty("--sheen-y", `${(30 + view.ax * 500).toFixed(1)}%`);
}

// 出杯版面：卡片置於頂部列與按鈕抽屜之間，杯子縮小移進卡片中間的 slot
function layoutServe() {
  const card = $("serveCard");
  const slot = finishSheet.slot;
  const desktop = window.matchMedia("(min-width: 900px)").matches;
  const top = document.querySelector(".topbar").getBoundingClientRect().bottom + 6;
  const bottom = window.innerHeight - finishSheet.el.offsetHeight - (desktop ? 40 : 14);
  const availH = bottom - top;
  const cardW = Math.min(desktop ? 440 : 400, window.innerWidth - 32);

  card.style.setProperty("--card-w", `${cardW}px`);
  card.style.setProperty("--slot-h", "0px");
  const chrome = card.offsetHeight;
  const slotH = Math.max(120, Math.min(cardW - 24, availH - chrome));
  const cardH = chrome + slotH;
  const cardX = (window.innerWidth - cardW) / 2;
  const cardY = top + Math.max(0, (availH - cardH) / 2);
  card.style.setProperty("--slot-h", `${slotH}px`);
  card.style.setProperty("--card-x", `${cardX}px`);
  card.style.setProperty("--card-y", `${cardY}px`);

  // 杯子原本的位置（用 offset 量，不受進行中的 transform 影響）
  const stageRect = cupEl.offsetParent.getBoundingClientRect();
  const rect = {
    left: stageRect.left + cupEl.offsetLeft,
    top: stageRect.top + cupEl.offsetTop,
    width: cupEl.offsetWidth,
    height: cupEl.offsetHeight,
  };
  // slot 留一點邊給出杯光環
  const scale = slotH / 1.22 / rect.width;
  const cx = cardX + cardW / 2;
  const cy = cardY + slot.offsetTop + slotH / 2;
  cupEl.style.setProperty("--cup-shift-x", `${(cx - (rect.left + rect.width / 2)).toFixed(1)}px`);
  cupEl.style.setProperty("--cup-shift", `${(cy - (rect.top + rect.height / 2)).toFixed(1)}px`);
  cupEl.style.setProperty("--cup-scale", scale.toFixed(3));
}

async function makeCard() {
  return composeCard({
    card: serveCardEl,
    cupCanvas: renderer.snapshot(1024, { time: performance.now() / 1000, glow: 0 }),
  });
}

const finishSheet = new FinishSheet({
  async onSave() {
    const blob = await makeCard();
    download(blob, `latte-art-${String(cupNumber).padStart(3, "0")}.png`);
    toast(t("toast.saved"));
  },
  async onShare() {
    const blob = await makeCard();
    const pattern = t(`pattern.${lastResult.pattern}`);
    const outcome = await share(blob, `latte-art-${String(cupNumber).padStart(3, "0")}.png`, {
      title: t("share.title"),
      text: t("share.text", { pattern }),
    });
    if (outcome === "downloaded") toast(t("toast.shareFallback"));
  },
  onKeepEditing: () => {
    halo.reset();
    setPhase("play");
  },
  onAnother: () => newCup(),
});

new ServePull($("finishBtn"), $("servePullLabel"), finish);

// ---------- 端上與收走 ----------

const SERVE_MS = 1000;
const CLEAR_MS = 560;
let changing = false;

// 新的一杯從吧台那側（畫面上方）端上來，輕輕落定
function serveCup(then) {
  setPhase("serving");
  cupEl.classList.remove("is-offstage", "is-leaving");
  void cupEl.offsetWidth;
  cupEl.classList.add("is-serving");
  setTimeout(() => {
    cupEl.classList.remove("is-serving");
    then();
  }, SERVE_MS);
}

// 換一杯：這杯先被收走、移出畫面，再端上新的一杯
function newCup(then = () => setPhase("play")) {
  if (changing) return;
  changing = true;
  demo.stop();
  pointer.cancel();
  finishSheet.close();
  setPhase("serving");
  cupEl.classList.add("is-leaving");
  setTimeout(() => {
    cupEl.classList.remove("is-leaving");
    cupEl.classList.add("is-offstage");
    session.reset();
    cupNumber = null;
    glow = 0;
    halo.reset();
    selectTool(TOOLS.POUR);
    setTimeout(() => {
      serveCup(() => {
        changing = false;
        then();
      });
    }, 220);
  }, CLEAR_MS);
}

$("newCupBtn").addEventListener("click", () => newCup());

// ---------- 開場與示範 ----------

const demo = new DemoPlayer({
  session,
  cursor,
  onCaption: (key) => {
    demoCaption = key;
    $("demoText").textContent = t(key);
  },
  onToolChange: (name) => selectTool(name),
  onDone: () => setPhase("handoff"),
});

function startDemo() {
  setPhase("demo");
  selectTool(TOOLS.POUR);
  demo.start();
}

function skipDemo() {
  newCup();
}

$("skipDemoBtn").addEventListener("click", skipDemo);
$("startBtn").addEventListener("click", () => newCup());

// 開場：一句話，然後端上一杯
let introDone = false;

function endIntro() {
  if (introDone) return;
  introDone = true;
  serveCup(() => setPhase("play"));
}

$("intro").addEventListener("click", endIntro);

// ---------- 版面 ----------

function resize() {
  const size = spaceEl.clientWidth;
  const dpr = window.devicePixelRatio || 1;
  renderer.resize(size, dpr);
  overlay.width = canvas.width;
  overlay.height = canvas.height;
  halo.resize(canvas.width);
  streamlinesDrawn = false;
}

window.addEventListener("resize", () => {
  resize();
  if (phase === "finish") layoutServe();
});

// ---------- 主迴圈 ----------

let last = performance.now();
const STILL = { x: 0, y: 0 };

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // 杯子傾斜：作畫或示範時停住不動，避免手指下的位置一直跑；出杯時幾乎回正
  tilt.frozen = pointer.pointerId !== null || phase === "demo";
  tilt.strength = 1;
  const view = tilt.update(dt);
  // 示範時液面不受晃動影響，每次都拉出同一顆對稱的心
  session.slosh = phase === "demo" ? STILL : tilt.slosh;
  session.advance(dt, (step) => demo.update(step));

  renderer.fill += (session.cup.fill - renderer.fill) * Math.min(1, dt * 4);
  renderer.setTilt(view);
  glow += ((phase === "finish" ? 1 : 0) - glow) * Math.min(1, dt * 3);

  const pitcher = session.pitcher;
  renderer.upload(session.fluid);
  renderer.draw({
    time: now / 1000,
    glow,
    pour:
      session.activeTool === pitcher && pitcher.active && pitcher.flow > 0
        ? { x: pitcher.x, y: pitcher.y, height: pitcher.height, active: true }
        : null,
  });

  if (config.display.showStreamlines) {
    drawStreamlines(overlayCtx, session.fluid, renderer);
    streamlinesDrawn = true;
  } else if (streamlinesDrawn) {
    overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
    streamlinesDrawn = false;
  }

  if (phase === "play") cursor.updateReticle(session.activeTool, pitcher);
  else cursor.reticle.classList.remove("is-active");

  hint.set(phase === "play" ? pickHint(session) : "");
  if (phase === "finish") tiltCard(view);
  halo.update(dt);

  requestAnimationFrame(frame);
}

// ---------- 啟動 ----------

applyI18n();
onLangChange(() => {
  hint.refresh();
  finishSheet.render();
  if (demoCaption) $("demoText").textContent = t(demoCaption);
});

selectTool(config.tools.current);
setPhase("intro");
cupEl.classList.add("is-offstage");
resize();
setTimeout(endIntro, 1900);
requestAnimationFrame(() => {
  body.classList.add("is-lit");
  requestAnimationFrame(frame);
});
