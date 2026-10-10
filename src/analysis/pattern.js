// pattern.js
// 看奶泡分佈猜花型（愛心、鬱金香、葉子、圓月、自由創作），作為出杯卡片的標題。
// 不評分：只描述這杯是什麼。

const FOAM = 0.42; // 視為白色奶泡的門檻（與 shader 的邊緣一致）

export function detectPattern(fluid) {
  const n = fluid.numY;
  const { foam, s } = fluid;

  let count = 0;
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
      }
    }
  }

  const area = count / fluid.fluidCount;
  if (area < 0.008) {
    return { pattern: "none", layers: 0 };
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
  const symmetry = Math.max(0, (overlap / Math.max(1, union) - 0.62) / 0.33);

  // 花型：沿垂直線數層數
  //   breaks：奶泡真的斷開的段數（葉子的葉片、分開的鬱金香）
  //   layers：再加上濃度下凹再回升的分層線（同一塊奶泡裡的同心紋）
  const scan = (i) => {
    if (i < 1 || i >= fluid.numX - 1) return { breaks: 0, layers: 0 };
    let runs = 0;
    let breaks = 0;
    let inside = false;
    let peak = 0;
    let dip = 1;
    let dipped = false;
    for (let j = minJ; j <= maxJ; j++) {
      const f = foam[i * n + j];
      if (f >= FOAM) {
        if (!inside) {
          runs++;
          breaks++;
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
    return { breaks, layers: runs };
  };
  const width = maxI - minI;
  const center = Math.round(ci);
  // 中線可能有穿心留下的細線，層數只看兩側
  const sides = [0.18, 0.3].flatMap((k) => [
    scan(Math.round(ci - width * k)),
    scan(Math.round(ci + width * k)),
  ]);
  const breaks = Math.max(...sides.map((r) => r.breaks));
  const sideLayers = Math.max(scan(Math.round(ci - width * 0.18)).layers, scan(Math.round(ci + width * 0.18)).layers);

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

  // 明顯的頂端 V 口代表穿心收成的愛心（內部可以有同心紋）
  const deepNotch = notch >= Math.max(3, height * 0.08);

  let pattern = "freeform";
  let layers = 1;
  if (breaks >= 5) {
    pattern = "rosetta";
    layers = breaks;
  } else if (deepNotch && symmetry > 0.4) {
    pattern = "heart";
  } else if (sideLayers >= 2) {
    pattern = "tulip";
    layers = sideLayers;
  } else if (hasCrease && symmetry > 0.4) {
    pattern = "heart";
  } else if (symmetry > 0.55 && Math.abs(width - height) < Math.max(width, height) * 0.25) {
    pattern = "monk";
  }

  return { pattern, layers };
}
