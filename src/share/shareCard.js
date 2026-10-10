// shareCard.js
// 把杯子畫成一張金框的精品咖啡館杯卡：杯號、日期、花型與一句咖啡師的話。

import { t } from "../i18n.js";

const W = 1080;
const H = 1350;

function wrapText(ctx, text, maxWidth) {
  // 中文逐字斷行、英文以空白斷行
  const tokens = /\s/.test(text) ? text.split(/(\s+)/) : [...text];
  const lines = [];
  let line = "";
  for (const token of tokens) {
    const next = line + token;
    if (ctx.measureText(next).width > maxWidth && line.trim()) {
      lines.push(line.trim());
      line = token.trimStart();
    } else {
      line = next;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function goldGradient(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, "#f6e2b0");
  g.addColorStop(0.35, "#d3a259");
  g.addColorStop(0.6, "#f3d796");
  g.addColorStop(1, "#b07f3c");
  return g;
}

// 金色雙線框，四角是內凹的切角與小菱形
function drawFrame(ctx) {
  const gold = goldGradient(ctx, 0, 0, W, H);
  const frame = (inset, cut, width) => {
    ctx.beginPath();
    ctx.moveTo(inset + cut, inset);
    ctx.lineTo(W - inset - cut, inset);
    ctx.quadraticCurveTo(W - inset - cut, inset + cut, W - inset, inset + cut);
    ctx.lineTo(W - inset, H - inset - cut);
    ctx.quadraticCurveTo(W - inset - cut, H - inset - cut, W - inset - cut, H - inset);
    ctx.lineTo(inset + cut, H - inset);
    ctx.quadraticCurveTo(inset + cut, H - inset - cut, inset, H - inset - cut);
    ctx.lineTo(inset, inset + cut);
    ctx.quadraticCurveTo(inset + cut, inset + cut, inset + cut, inset);
    ctx.closePath();
    ctx.lineWidth = width;
    ctx.strokeStyle = gold;
    ctx.stroke();
  };
  frame(40, 34, 2.5);
  frame(56, 26, 1);

  ctx.fillStyle = gold;
  for (const [x, y] of [
    [40, 40],
    [W - 40, 40],
    [40, H - 40],
    [W - 40, H - 40],
  ]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  }
}

export async function composeCard({ cupCanvas, cupNo, date, result }) {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // 背景：暖黑漸層，杯子後方一圈暖光
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#1a1210");
  bg.addColorStop(1, "#0a0605");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 600, 60, W / 2, 600, 620);
  glow.addColorStop(0, "rgba(150, 96, 60, 0.42)");
  glow.addColorStop(1, "rgba(150, 96, 60, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  drawFrame(ctx);

  // 頂部：左字標、右杯號
  const pad = 104;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "#f2e6d0";
  ctx.font = '500 50px "Cormorant Garamond", Georgia, serif';
  ctx.fillText("LatteArt", pad, 160);
  ctx.textAlign = "right";
  ctx.fillStyle = goldGradient(ctx, W - 300, 0, W - pad, 0);
  ctx.font = '500 24px Inter, "Noto Sans TC", sans-serif';
  ctx.letterSpacing = "6px";
  ctx.fillText(t("finish.cupNo", { no: cupNo }).toUpperCase(), W - pad, 156);
  ctx.letterSpacing = "0px";

  // 杯子（快照包含桌面陰影，杯口直徑 = 快照寬 / 1.32）
  const cupDiameter = 720;
  const drawSize = cupDiameter * 1.32;
  ctx.drawImage(cupCanvas, (W - drawSize) / 2, 610 - drawSize / 2, drawSize, drawSize);

  // 底部左：標語、花型、短句
  ctx.textAlign = "left";
  ctx.fillStyle = goldGradient(ctx, pad, 0, pad + 400, 0);
  ctx.font = '600 20px Inter, "Noto Sans TC", sans-serif';
  ctx.letterSpacing = "5px";
  ctx.fillText(t("finish.title").toUpperCase(), pad, 1062);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = "#f6eee2";
  ctx.font = '500 84px "Cormorant Garamond", "Noto Serif TC", Georgia, serif';
  ctx.fillText(t(`pattern.${result.pattern}`), pad - 4, 1148);
  ctx.fillStyle = "#b9ad9f";
  ctx.font = '400 26px Inter, "Noto Sans TC", sans-serif';
  const lines = wrapText(ctx, t(`note.${result.pattern}`, { layers: result.layers }), 560);
  lines.slice(0, 2).forEach((line, i) => ctx.fillText(line, pad, 1204 + i * 38));

  // 底部右：日期與署名
  ctx.textAlign = "right";
  ctx.fillStyle = "#d9cbb6";
  ctx.font = '500 26px Inter, "Noto Sans TC", sans-serif';
  ctx.fillText(date, W - pad, 1204);
  ctx.fillStyle = "#857a75";
  ctx.font = 'italic 500 26px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(t("finish.signature"), W - pad, 1242);

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
