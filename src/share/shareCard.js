// shareCard.js
// 把杯子畫成一張精品咖啡館風格的分享卡：杯號、日期、花型、分數與評語。

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

export async function composeCard({ cupCanvas, cupNo, date, result }) {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // 背景：暖黑漸層與聚光
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#120d0b");
  bg.addColorStop(1, "#070504");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 560, 40, W / 2, 560, 640);
  glow.addColorStop(0, "rgba(120, 72, 50, 0.45)");
  glow.addColorStop(1, "rgba(120, 72, 50, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // 字標與杯號
  ctx.textAlign = "center";
  ctx.fillStyle = "#f2ece6";
  ctx.font = '500 64px "Cormorant Garamond", Georgia, serif';
  ctx.fillText("LatteArt", W / 2, 132);
  ctx.fillStyle = "#857a75";
  ctx.font = '500 24px Inter, "Noto Sans TC", sans-serif';
  ctx.fillText(t("finish.cupNo", { no: cupNo, date }).toUpperCase(), W / 2, 182);

  // 杯子與暖色陰影
  const size = 760;
  const x = (W - size) / 2;
  const y = 220;
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 34;
  ctx.beginPath();
  ctx.arc(W / 2, y + size / 2, size * 0.488, 0, Math.PI * 2);
  ctx.fillStyle = "#2a1a12";
  ctx.fill();
  ctx.restore();
  ctx.drawImage(cupCanvas, x, y, size, size);

  // 花型、分數、評語
  const patternName = t(`pattern.${result.pattern}`, { layers: result.layers });
  ctx.fillStyle = "#f2ece6";
  ctx.font = '500 44px Inter, "Noto Sans TC", sans-serif';
  ctx.fillText(patternName, W / 2, 1080);
  if (result.pattern !== "none") {
    ctx.fillStyle = "#d27a69";
    ctx.font = '600 34px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(`${result.score} / 100`, W / 2, 1130);
  }
  ctx.fillStyle = "#b0a6a0";
  ctx.font = '400 28px Inter, "Noto Sans TC", sans-serif';
  const lines = wrapText(ctx, t(`comment.${result.comment}`), 760);
  lines.slice(0, 3).forEach((line, i) => ctx.fillText(line, W / 2, 1192 + i * 42));

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
