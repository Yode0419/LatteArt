// shareCard.js
// 存圖：照著畫面上的金框杯卡一比一重畫（讀取每個元素的實際位置、字型與顏色），
// 杯子另外以高解析度渲染，輸出和畫面相同樣式的圖片。

const OUT_WIDTH = 1080;
const MARGIN = 36; // 卡片外留的暖黑背景（CSS px）
const RING_R = 1.075; // 與出杯光環相同的半徑（杯口外徑倍數）
const CUP_EXTENT = 1.32; // 快照畫布半寬（杯口外徑倍數），見 render/geometry.js

function token(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function goldGradient(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, token("--gold-200"));
  g.addColorStop(0.38, token("--gold-400"));
  g.addColorStop(0.55, token("--gold-100"));
  g.addColorStop(1, token("--gold-500"));
  return g;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// 元素相對於卡片的位置（offset 不受進場與傾斜的 transform 影響）
function relRect(el, card) {
  let x = 0;
  let y = 0;
  for (let e = el; e && e !== card; e = e.offsetParent) {
    x += e.offsetLeft;
    y += e.offsetTop;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

function wrapText(ctx, text, maxWidth) {
  // 中文逐字斷行、英文以空白斷行
  const tokens = /\s/.test(text) ? text.split(/(\s+)/) : [...text];
  const lines = [];
  let line = "";
  for (const tok of tokens) {
    const next = line + tok;
    if (ctx.measureText(next).width > maxWidth && line.trim()) {
      lines.push(line.trim());
      line = tok.trimStart();
    } else {
      line = next;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

// 依元素的 computed style 畫出文字
function drawText(ctx, el, card, k, fill) {
  const cs = getComputedStyle(el);
  const r = relRect(el, card);
  const size = parseFloat(cs.fontSize);
  const lh = cs.lineHeight === "normal" ? size * 1.2 : parseFloat(cs.lineHeight);
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${size * k}px ${cs.fontFamily}`;
  ctx.letterSpacing = cs.letterSpacing === "normal" ? "0px" : `${parseFloat(cs.letterSpacing) * k}px`;
  ctx.fillStyle = fill || cs.color;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  let text = el.textContent.trim();
  if (cs.textTransform === "uppercase") text = text.toUpperCase();
  const lines = wrapText(ctx, text, (r.w + 1) * k);
  lines.forEach((line, i) => ctx.fillText(line, r.x * k, (r.y + lh * i + lh / 2) * k));
  ctx.letterSpacing = "0px";
}

export async function composeCard({ card, cupCanvas }) {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;

  const W = card.offsetWidth;
  const H = card.offsetHeight;
  const k = OUT_WIDTH / (W + MARGIN * 2);
  const canvas = document.createElement("canvas");
  canvas.width = OUT_WIDTH;
  canvas.height = Math.round((H + MARGIN * 2) * k);
  const ctx = canvas.getContext("2d");

  // 背景：暖黑漸層與卡片後方的暖光
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, "#1a1210");
  bg.addColorStop(1, "#0a0605");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const glow = ctx.createRadialGradient(
    canvas.width / 2, canvas.height * 0.4, 0,
    canvas.width / 2, canvas.height * 0.4, canvas.width * 0.8
  );
  glow.addColorStop(0, "rgba(120, 72, 50, 0.35)");
  glow.addColorStop(1, "rgba(120, 72, 50, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(MARGIN * k, MARGIN * k);
  const cs = getComputedStyle(card);
  const radius = parseFloat(cs.getPropertyValue("--card-radius")) || 24;
  const inset = parseFloat(cs.getPropertyValue("--card-inset")) || 7;

  // 卡片底色（同 CSS：右上金色暈光 + 160° 暖黑漸層）
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = 40 * k;
  ctx.shadowOffsetY = 16 * k;
  roundRect(ctx, 0, 0, W * k, H * k, radius * k);
  const angle = (160 - 90) * (Math.PI / 180);
  const len = Math.abs(W * Math.cos(angle)) + Math.abs(H * Math.sin(angle));
  const cx = (W * k) / 2;
  const cy = (H * k) / 2;
  const lin = ctx.createLinearGradient(
    cx - (Math.cos(angle) * len * k) / 2, cy - (Math.sin(angle) * len * k) / 2,
    cx + (Math.cos(angle) * len * k) / 2, cy + (Math.sin(angle) * len * k) / 2
  );
  lin.addColorStop(0, "#2a211e");
  lin.addColorStop(1, "#130e0d");
  ctx.fillStyle = lin;
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, 0, 0, W * k, H * k, radius * k);
  ctx.clip();
  const warm = ctx.createRadialGradient(W * k, 0, 0, W * k, 0, W * 1.1 * k);
  warm.addColorStop(0, "rgba(214, 168, 92, 0.12)");
  warm.addColorStop(1, "rgba(214, 168, 92, 0)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, W * k, H * k);
  ctx.restore();

  // 外框：1.5px 金色漸層；內框：同圓心、內縮 inset、圓角少 inset
  const gold = goldGradient(ctx, 0, 0, W * k, H * k);
  roundRect(ctx, 0.75 * k, 0.75 * k, (W - 1.5) * k, (H - 1.5) * k, (radius - 0.75) * k);
  ctx.lineWidth = 1.5 * k;
  ctx.strokeStyle = gold;
  ctx.stroke();
  roundRect(ctx, (inset + 0.5) * k, (inset + 0.5) * k, (W - inset * 2 - 1) * k, (H - inset * 2 - 1) * k, (radius - inset - 0.5) * k);
  ctx.lineWidth = 1 * k;
  ctx.strokeStyle = token("--color-gold-border");
  ctx.stroke();

  // 杯子：放在 slot 中央，大小與畫面相同（slot 高 / 1.22）
  const slot = card.querySelector(".serve-card__slot");
  const sr = relRect(slot, card);
  const D = sr.h / 1.22;
  const scx = (sr.x + sr.w / 2) * k;
  const scy = (sr.y + sr.h / 2) * k;
  const drawSize = D * CUP_EXTENT * k;
  ctx.drawImage(cupCanvas, scx - drawSize / 2, scy - drawSize / 2, drawSize, drawSize);

  // 出杯光環（靜態）：柔光 + 亮線 + 幾顆金色光點
  const ringR = (D / 2) * RING_R * k;
  ctx.save();
  ctx.beginPath();
  ctx.arc(scx, scy, ringR, 0, Math.PI * 2);
  ctx.shadowColor = "rgba(255, 196, 110, 0.9)";
  ctx.shadowBlur = 18 * k;
  ctx.strokeStyle = "rgba(232, 178, 92, 0.55)";
  ctx.lineWidth = 5 * k * (W / 400);
  ctx.stroke();
  ctx.shadowBlur = 6 * k;
  ctx.strokeStyle = "rgba(255, 228, 170, 0.95)";
  ctx.lineWidth = 1.6 * k * (W / 400);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 26; i++) {
    const a = (i * 2.399) % (Math.PI * 2); // 黃金角分佈，每次都一樣
    const d = ringR * (1 + 0.04 * Math.sin(i * 1.7)) + (i % 3) * 4 * k;
    const x = scx + Math.cos(a) * d;
    const y = scy + Math.sin(a) * d;
    const r = (1 + (i % 4) * 0.6) * k;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    g.addColorStop(0, "rgba(255, 236, 190, 0.85)");
    g.addColorStop(1, "rgba(240, 170, 90, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 文字
  const q = (sel) => card.querySelector(sel);
  drawText(ctx, q(".serve-card__brand"), card, k);
  drawText(ctx, q(".serve-card__no"), card, k);
  const eyebrow = q(".serve-card__eyebrow");
  const er = relRect(eyebrow, card);
  drawText(ctx, eyebrow, card, k, goldGradient(ctx, er.x * k, 0, (er.x + er.w) * k, 0));
  drawText(ctx, q(".serve-card__pattern"), card, k);
  drawText(ctx, q(".serve-card__note"), card, k);

  const foot = q(".serve-card__foot");
  const fr = relRect(foot, card);
  ctx.fillStyle = token("--color-divider");
  ctx.fillRect(fr.x * k, fr.y * k, fr.w * k, Math.max(1, k));
  for (const el of foot.children) drawText(ctx, el, card, k);

  ctx.restore();
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 回傳 "shared" | "downloaded" | "cancelled"
export async function share(blob, filename, { title, text }) {
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text });
      return "shared";
    } catch (err) {
      if (err && err.name === "AbortError") return "cancelled";
    }
  }
  download(blob, filename);
  return "downloaded";
}
