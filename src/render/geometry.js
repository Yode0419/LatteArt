// geometry.js
// 杯子的 3D 幾何與視角數學，shader 和 JS（觸控換算、光環位置）共用同一組定義。
//
// 座標（杯子本地座標）：杯口外緣半徑 = 1，z 軸向上，杯口頂面在 z = 0。
// 相機在正上方 CAMERA_Z 處做透視投影，杯口頂面（z = 0）剛好對到畫布；
// 杯子繞著杯身中段（PIVOT_Z）傾斜，液面維持水平並帶一點晃動。

export const RIM_OUTER = 1.0;
export const RIM_INNER = 0.905; // 杯口內緣 = 液面半徑
export const EXTENT = 1.32; // canvas 半寬（世界單位），留空間給傾斜與桌面陰影
export const PIVOT_Z = -0.45;
export const CAMERA_Z = 7.0;
export const BODY_DEPTH = 1.0; // 杯身高度
export const BODY_TAPER = 0.08; // 杯身往下收窄的比例

// 液位 → 液面離杯口的深度
export function liquidDepth(fill) {
  return 0.07 + (1 - fill) * 0.3;
}

// 依傾斜角（弧度）與液面晃動建立視角狀態
//   R：本地 → 世界（Ry · Rx）；液面法向量在本地座標中 = 世界的「上」+ 晃動
export function makeView({ ax = 0, ay = 0, wx = 0, wy = 0, fill = 1 } = {}) {
  const cx = Math.cos(ax);
  const sx = Math.sin(ax);
  const cy = Math.cos(ay);
  const sy = Math.sin(ay);
  const R = [
    [cy, sy * sx, sy * cx],
    [0, cx, -sx],
    [-sy, cy * sx, cy * cx],
  ];
  let nx = R[2][0] + wx;
  let ny = R[2][1] + wy;
  let nz = R[2][2];
  const len = Math.hypot(nx, ny, nz);
  nx /= len;
  ny /= len;
  nz /= len;
  return { R, normal: [nx, ny, nz], depth: liquidDepth(fill) };
}

// shader 的 mat3（本地 ← 世界 = Rᵀ）以 column-major 傳入，剛好等於 R 逐列攤平
export function rotationUniform(view) {
  return new Float32Array(view.R.flat());
}

function localToWorld(view, p) {
  const { R } = view;
  const q = [p[0], p[1], p[2] - PIVOT_Z];
  return [
    R[0][0] * q[0] + R[0][1] * q[1] + R[0][2] * q[2],
    R[1][0] * q[0] + R[1][1] * q[1] + R[1][2] * q[2],
    R[2][0] * q[0] + R[2][1] * q[1] + R[2][2] * q[2] + PIVOT_Z,
  ];
}

// 世界座標點 → canvas uv（透視投影到 z = 0 的畫面）
function project(w) {
  const k = CAMERA_Z / (CAMERA_Z - w[2]);
  return { u: ((w[0] * k) / EXTENT + 1) / 2, v: ((w[1] * k) / EXTENT + 1) / 2 };
}

function worldToLocal(view, p) {
  const { R } = view;
  const q = [p[0], p[1], p[2] - PIVOT_Z];
  return [
    R[0][0] * q[0] + R[1][0] * q[1] + R[2][0] * q[2],
    R[0][1] * q[0] + R[1][1] * q[1] + R[2][1] * q[2],
    R[0][2] * q[0] + R[1][2] * q[1] + R[2][2] * q[2] + PIVOT_Z,
  ];
}

// canvas uv（0–1，y 向上）→ 液面上的本地 xy
export function canvasToLiquid(view, u, v) {
  const X = (u * 2 - 1) * EXTENT;
  const Y = (v * 2 - 1) * EXTENT;
  const o = worldToLocal(view, [0, 0, CAMERA_Z]);
  const { R } = view;
  const dw = [X, Y, -CAMERA_Z];
  const d = [
    R[0][0] * dw[0] + R[1][0] * dw[1] + R[2][0] * dw[2],
    R[0][1] * dw[0] + R[1][1] * dw[1] + R[2][1] * dw[2],
    R[0][2] * dw[0] + R[1][2] * dw[1] + R[2][2] * dw[2],
  ];
  const n = view.normal;
  const q = [0, 0, -view.depth];
  const t =
    (n[0] * (q[0] - o[0]) + n[1] * (q[1] - o[1]) + n[2] * (q[2] - o[2])) /
    (n[0] * d[0] + n[1] * d[1] + n[2] * d[2]);
  return { x: o[0] + d[0] * t, y: o[1] + d[1] * t };
}

// 液面上的本地 xy → canvas uv
export function liquidToCanvas(view, x, y) {
  const n = view.normal;
  const z = -view.depth - (n[0] * x + n[1] * y) / n[2];
  return project(localToWorld(view, [x, y, z]));
}

// 杯口上半徑 r、角度 θ 的點 → canvas uv（出杯光環用）
export function rimToCanvas(view, theta, r = RIM_OUTER) {
  return project(localToWorld(view, [Math.cos(theta) * r, Math.sin(theta) * r, 0]));
}
