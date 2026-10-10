// tasting.js
// 品杯：分析奶泡分佈，猜花型並從對稱、置中、對比、比例四個面向評分，
// 再依花型的難度（層次、凹口）調整總分，單純一團奶泡不會拿到高分。

const FOAM = 0.42; // 視為白色奶泡的門檻（與 shader 的邊緣一致）
const SOFT = 0.12; // 低於此值視為完全沒有奶泡

const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function taste(fluid) {
  const n = fluid.numY;
  const h = fluid.h;
  const { foam, s } = fluid;

  let count = 0;
  let tintSum = 0;
  let tintCount = 0;
  let sx = 0;
  let sy = 0;
  let minI = Infinity;
  let maxI = -Infinity;
  let minJ = Infinity;
  let maxJ = -Infinity;

  for (let i = 1; i < fluid.numX - 1; i++) {
    for (let j = 1; j < fluid.numY - 1; j++) {
      const c = i * n + j;
      if (s[c] === 0.0) continue;
      const f = foam[c];
      if (f >= FOAM) {
        count++;
        sx += i;
        sy += j;
        if (i < minI) minI = i;
        if (i > maxI) maxI = i;
        if (j < minJ) minJ = j;
        if (j > maxJ) maxJ = j;
      } else if (f < SOFT) {
        tintSum += fluid.tint[c];
        tintCount++;
      }
    }
  }

  const area = count / fluid.fluidCount;
  if (area < 0.008) {
    return {
      pattern: "none",
      layers: 0,
      score: 0,
      area,
      metrics: { symmetry: 0, centering: 0, contrast: 0, balance: 0 },
      comment: "none",
    };
  }

  const ci = sx / count;
  const cj = sy / count;
  const isFoam = (i, j) =>
    i >= 0 && j >= 0 && i < fluid.numX && j < fluid.numY && foam[i * n + j] >= FOAM;

  // 對稱：以重心所在的垂直線為軸鏡射比對
  let overlap = 0;
  let union = 0;
  for (let i = minI; i <= maxI; i++) {
    const mi = Math.round(2 * ci - i);
    for (let j = minJ; j <= maxJ; j++) {
      const a = isFoam(i, j);
      const b = isFoam(mi, j);
      if (a || b) union++;
      if (a && b) overlap++;
    }
  }
  const symmetry = clamp01((overlap / Math.max(1, union) - 0.62) / 0.33);

  // 置中：重心離杯心的距離
  const offset = Math.hypot((ci + 0.5) * h - 0.5, (cj + 0.5) * h - 0.5) / fluid.radius;
  const centering = clamp01(1 - offset / 0.4);

  // 對比：奶泡以外的底色被高注牛奶染得越淡，白色越不明顯
  const baseTint = tintSum / Math.max(1, tintCount);
  const contrast = clamp01(1 - (baseTint - 0.3) / 0.5);

  // 比例：奶泡占液面 12%–38% 最舒服
  const balance =
    area < 0.12 ? clamp01(area / 0.12) ** 0.8 : clamp01(1 - (area - 0.38) / 0.35);

  // 花型：沿垂直線數層數。奶泡中斷，或濃度明顯下凹再回升（分層線）都算新的一層
  const runsAt = (i) => {
    if (i < 1 || i >= fluid.numX - 1) return 0;
    let runs = 0;
    let inside = false;
    let peak = 0;
    let dip = 1;
    let dipped = false;
    for (let j = minJ; j <= maxJ; j++) {
      const f = foam[i * n + j];
      if (f >= FOAM) {
        if (!inside) {
          runs++;
          inside = true;
          peak = f;
          dipped = false;
        } else if (dipped && f > dip + 0.12) {
          runs++;
          peak = f;
          dipped = false;
        }
        if (!dipped) {
          peak = Math.max(peak, f);
          if (f < peak - 0.15) {
            dipped = true;
            dip = f;
          }
        } else {
          dip = Math.min(dip, f);
        }
      } else {
        inside = false;
      }
    }
    return runs;
  };
  const width = maxI - minI;
  const center = Math.round(ci);
  // 中線可能有穿心留下的細線，層數只看兩側
  const sideRuns = Math.max(
    runsAt(Math.round(ci - width * 0.18)),
    runsAt(Math.round(ci + width * 0.18))
  );
  const outerRuns = Math.max(
    runsAt(Math.round(ci - width * 0.3)),
    runsAt(Math.round(ci + width * 0.3))
  );

  // 愛心：頂端中央比兩側低，形成凹口
  const topAt = (i) => {
    for (let j = maxJ; j >= minJ; j--) if (isFoam(i, j)) return j;
    return minJ;
  };
  const sideTop = Math.max(
    topAt(Math.round(ci - width * 0.2)),
    topAt(Math.round(ci + width * 0.2))
  );
  const notch = sideTop - topAt(center);
  const height = maxJ - minJ;

  // 穿心線：中線附近的奶泡比左右兩側明顯低，連續一段
  const foamAt = (i, j) => foam[i * n + j];
  let crease = 0;
  for (let j = minJ; j <= maxJ; j++) {
    const left = foamAt(center - 4, j);
    const right = foamAt(center + 4, j);
    if (left < FOAM || right < FOAM) continue;
    const mid = Math.min(foamAt(center - 1, j), foamAt(center, j), foamAt(center + 1, j));
    if (mid < Math.min(left, right) - 0.08) crease++;
  }
  const hasCrease = crease >= height * 0.35;

  let pattern = "freeform";
  let layers = 1;
  if (outerRuns >= 5 || sideRuns >= 5) {
    pattern = "rosetta";
    layers = Math.max(outerRuns, sideRuns);
  } else if (sideRuns >= 2) {
    pattern = "tulip";
    layers = sideRuns;
  } else if ((hasCrease || notch >= Math.max(2, height * 0.06)) && symmetry > 0.4) {
    pattern = "heart";
  } else if (symmetry > 0.55 && Math.abs(width - height) < Math.max(width, height) * 0.25) {
    pattern = "monk";
  }

  const metrics = { symmetry, centering, contrast, balance };
  const craft = {
    freeform: 0.8,
    monk: 0.82,
    heart: 0.95,
    tulip: Math.min(1, 0.9 + 0.03 * layers),
    rosetta: 1,
  }[pattern];
  const score = Math.round(
    100 * craft * (0.32 * symmetry + 0.22 * centering + 0.22 * contrast + 0.24 * balance)
  );

  let comment;
  const weakest = Object.entries(metrics).sort((a, b) => a[1] - b[1])[0];
  if (weakest[1] >= 0.62 && (pattern === "monk" || pattern === "freeform")) comment = "simple";
  else if (weakest[1] >= 0.8) comment = "great";
  else if (weakest[1] >= 0.62) comment = "good";
  else if (weakest[0] === "symmetry") comment = "asymmetric";
  else if (weakest[0] === "centering") comment = "offCenter";
  else if (weakest[0] === "contrast") comment = "lowContrast";
  else comment = area < 0.12 ? "tooLittle" : "tooMuch";

  return { pattern, layers, score, area, metrics, comment };
}
