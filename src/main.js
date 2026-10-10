// main.js
// 進入點：組裝模擬、渲染、互動與 UI，並以 phase 狀態機串起整段敘事：
//   intro（萃取）→ demo（第一次造訪的示範）→ handoff（換你了）→ play ⇄ finish

import { config, TOOLS } from "./config.js";
import { t, applyI18n, onLangChange } from "./i18n.js";
import { load, save } from "./storage.js";
import { LatteSession } from "./session.js";
import { LatteRenderer } from "./render/latteRenderer.js";
import { drawStreamlines } from "./render/streamlines.js";
import { PointerInput } from "./interaction/pointer.js";
import { taste } from "./analysis/tasting.js";
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
const canvas = $("latteCanvas");
const overlay = $("overlayCanvas");
const overlayCtx = overlay.getContext("2d");

const session = new LatteSession();
const renderer = new LatteRenderer(canvas);
const cursor = new CupCursor(cupEl, renderer);
const hint = new HintLine($("hint"), t);

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
    // 萃取中直接按下：讓 crema 立刻長好，開始注奶
    if (session.isExtracting) session.extraction.finish();
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
  if (phase !== "play" || session.isExtracting) return;
  if (cupNumber === null) {
    cupNumber = load("cupCount", 0) + 1;
    save("cupCount", cupNumber);
  }
  lastResult = taste(session.fluid);
  setPhase("finish");
  finishSheet.open(lastResult, String(cupNumber).padStart(3, "0"), today());
  fitCupAboveSheet();
}

// 完成時讓杯子避開抽屜：手機縮小移到抽屜上方，桌機往左讓出右側面板
function fitCupAboveSheet() {
  for (const prop of ["--cup-shift", "--cup-shift-x", "--cup-scale"]) cupEl.style.removeProperty(prop);
  const rect = cupEl.getBoundingClientRect();
  const sheetRect = finishSheet.el.getBoundingClientRect();
  const margin = 28;

  if (window.matchMedia("(min-width: 900px)").matches) {
    const right = window.innerWidth - finishSheet.el.offsetWidth - 32;
    const available = right - margin * 2;
    const scale = Math.min(1, available / rect.width);
    const shiftX = (right / 2) - (rect.left + rect.width / 2);
    cupEl.style.setProperty("--cup-shift-x", `${Math.min(0, shiftX).toFixed(1)}px`);
    cupEl.style.setProperty("--cup-scale", scale.toFixed(3));
    return;
  }

  const top = document.querySelector(".topbar").getBoundingClientRect().bottom;
  const bottom = window.innerHeight - Math.max(finishSheet.el.offsetHeight, sheetRect.height);
  const available = bottom - top - margin * 2;
  const scale = Math.min(1, available / rect.height);
  const shift = top + margin + available / 2 - (rect.top + rect.height / 2);
  cupEl.style.setProperty("--cup-shift", `${shift.toFixed(1)}px`);
  cupEl.style.setProperty("--cup-scale", scale.toFixed(3));
}

async function makeCard() {
  return composeCard({
    cupCanvas: renderer.snapshot(1024, { time: performance.now() / 1000, glow: 0 }),
    cupNo: String(cupNumber).padStart(3, "0"),
    date: today(),
    result: lastResult,
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
    const pattern = t(`pattern.${lastResult.pattern}`, { layers: lastResult.layers });
    const outcome = await share(blob, `latte-art-${String(cupNumber).padStart(3, "0")}.png`, {
      title: t("share.title"),
      text: t("share.text", { pattern, score: lastResult.score }),
    });
    if (outcome === "downloaded") toast(t("toast.shareFallback"));
  },
  onKeepEditing: () => setPhase("play"),
  onAnother: () => newCup(),
});

$("finishBtn").addEventListener("click", finish);

// ---------- 換一杯：舊杯滑出、新杯滑入並重新萃取 ----------

let changing = false;

function newCup(then = () => setPhase("play")) {
  if (changing) return;
  changing = true;
  demo.stop();
  pointer.cancel();
  finishSheet.close();
  setPhase("intro-quiet");
  cupEl.classList.add("is-leaving");
  setTimeout(() => {
    session.reset();
    cupNumber = null;
    glow = 0;
    selectTool(TOOLS.POUR);
    cupEl.classList.remove("is-leaving");
    cupEl.classList.add("is-arriving");
    void cupEl.offsetWidth;
    cupEl.classList.remove("is-arriving");
    changing = false;
    then();
  }, 540);
}

$("newCupBtn").addEventListener("click", () => {
  if (phase === "demo") skipDemo();
  else newCup();
});

// ---------- 開場與示範 ----------

const demo = new DemoPlayer({
  session,
  cursor,
  onCaption: (key) => {
    demoCaption = key;
    $("demoText").textContent = t(key);
  },
  onToolChange: (name) => selectTool(name),
  onDone: () => {
    save("demoSeen", true);
    setPhase("handoff");
  },
});

function startDemo() {
  setPhase("demo");
  selectTool(TOOLS.POUR);
  demo.start();
}

function skipDemo() {
  save("demoSeen", true);
  newCup();
}

$("skipDemoBtn").addEventListener("click", skipDemo);
$("startBtn").addEventListener("click", () => newCup());

let introDone = false;

function endIntro() {
  if (introDone) return;
  introDone = true;
  if (load("demoSeen", false)) setPhase("play");
  else startDemo();
}

$("intro").addEventListener("click", () => {
  if (phase !== "intro") return;
  session.extraction.finish();
  endIntro();
});

// ---------- 版面 ----------

function resize() {
  const size = cupEl.clientWidth;
  const dpr = window.devicePixelRatio || 1;
  renderer.resize(size, dpr);
  overlay.width = canvas.width;
  overlay.height = canvas.height;
  streamlinesDrawn = false;
}

window.addEventListener("resize", () => {
  resize();
  if (phase === "finish") fitCupAboveSheet();
});

// ---------- 主迴圈 ----------

let last = performance.now();
let extractedAt = null;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  session.advance(dt, (step) => demo.update(step));

  // 開場：萃取完成後稍作停留再進入下一步
  if (phase === "intro" && !introDone) {
    if (!session.isExtracting) {
      if (extractedAt === null) {
        extractedAt = now;
        $("introStatus").textContent = t("intro.ready");
      } else if (now - extractedAt > 900) {
        endIntro();
      }
    }
  }

  renderer.fill += (session.cup.fill - renderer.fill) * Math.min(1, dt * 4);
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

  $("levelFill").style.width = `${(session.cup.fill * 100).toFixed(1)}%`;
  hint.set(phase === "play" ? pickHint(session, phase) : "");

  requestAnimationFrame(frame);
}

// ---------- 啟動 ----------

applyI18n();
onLangChange(() => {
  hint.refresh();
  finishSheet.render();
  if (demoCaption) $("demoText").textContent = t(demoCaption);
  if (phase === "intro" && !session.isExtracting) $("introStatus").textContent = t("intro.ready");
});

selectTool(config.tools.current);
setPhase("intro");
resize();
requestAnimationFrame(() => {
  body.classList.add("is-lit");
  requestAnimationFrame(frame);
});
