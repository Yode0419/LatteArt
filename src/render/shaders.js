// shaders.js
// 一個全畫面 fragment shader 以光線追蹤畫出整杯咖啡：
//   正交相機從正上方看下來，杯子依傾斜角旋轉；
//   依序求出杯口頂面、杯內壁（圓柱）與液面（會晃動的平面）的交點，
//   液面再取樣流體貼圖畫出 crema、奶泡與注流。杯外是桌面上的柔和陰影。

import {
  RIM_OUTER,
  RIM_INNER,
  EXTENT,
  PIVOT_Z,
  CAMERA_Z,
  BODY_DEPTH,
  BODY_TAPER,
} from "./geometry.js";

export const vertexSource = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const fragmentSource = `
precision highp float;
varying vec2 vUv;

uniform sampler2D uField;   // R = foam, G = tint, B = crema
uniform vec2 uTexSize;
uniform vec2 uRes;
uniform float uTime;
uniform mat3 uRot;          // 本地 ← 世界
uniform vec3 uLiquidN;      // 液面法向量（本地座標）
uniform float uDepth;       // 液面離杯口的深度
uniform float uSimR;        // 模擬座標中的液面半徑
uniform vec4 uPour;         // xy = 注流位置（模擬座標），w = 是否注入
uniform float uGlow;        // 出杯時的杯緣光暈

const float RIM_OUTER = ${RIM_OUTER.toFixed(4)};
const float RIM_INNER = ${RIM_INNER.toFixed(4)};
const float EXTENT = ${EXTENT.toFixed(4)};
const float PIVOT_Z = ${PIVOT_Z.toFixed(4)};
const float CAMERA_Z = ${CAMERA_Z.toFixed(4)};
const float BODY_DEPTH = ${BODY_DEPTH.toFixed(4)};
const float BODY_TAPER = ${BODY_TAPER.toFixed(4)};

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

// B-spline 雙三次取樣（4 次雙線性取樣），讓低解析度網格也有平滑輪廓
vec4 cubicW(float v) {
  vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
  vec4 s = n * n * n;
  float x = s.x;
  float y = s.y - 4.0 * s.x;
  float z = s.z - 4.0 * s.y + 6.0 * s.x;
  float w = 6.0 - x - y - z;
  return vec4(x, y, z, w) * (1.0 / 6.0);
}

vec4 sampleField(vec2 uv) {
  uv = uv * uTexSize - 0.5;
  vec2 fxy = fract(uv);
  uv -= fxy;
  vec4 xc = cubicW(fxy.x);
  vec4 yc = cubicW(fxy.y);
  vec4 c = uv.xxyy + vec2(-0.5, 1.5).xyxy;
  vec4 s = vec4(xc.xz + xc.yw, yc.xz + yc.yw);
  vec4 off = (c + vec4(xc.yw, yc.yw) / s) / uTexSize.xxyy;
  vec4 s0 = texture2D(uField, off.xz);
  vec4 s1 = texture2D(uField, off.yz);
  vec4 s2 = texture2D(uField, off.xw);
  vec4 s3 = texture2D(uField, off.yw);
  float sx = s.x / (s.x + s.y);
  float sy = s.z / (s.z + s.w);
  return mix(mix(s3, s2, sx), mix(s1, s0, sx), sy);
}

void main() {
  float aa = 2.4 * EXTENT / uRes.x; // 一個像素約多少世界單位
  vec2 w = (vUv * 2.0 - 1.0) * EXTENT;
  vec3 pivot = vec3(0.0, 0.0, PIVOT_Z);
  vec3 o = uRot * (vec3(0.0, 0.0, CAMERA_Z) - pivot) + pivot;
  vec3 d = normalize(uRot * vec3(w, -CAMERA_Z));
  vec3 L = normalize(uRot * vec3(-0.45, 0.55, 0.78));
  // 窗光（反光用）：反射點約落在液面左上方，杯子一傾斜就會滑動
  vec3 Ls = normalize(uRot * vec3(-0.05, 0.06, 1.0));
  vec3 V = -d;
  vec3 ceramic = vec3(0.93, 0.91, 0.875);
  vec3 ceramicShade = vec3(0.83, 0.75, 0.66);
  vec3 warmShade = vec3(0.42, 0.17, 0.06);

  // ---------- 杯口頂面 ----------
  float t0 = -o.z / d.z;
  vec3 p0 = o + d * t0;
  float r0 = length(p0.xy);
  float cupAlpha = 1.0 - smoothstep(RIM_OUTER - aa, RIM_OUTER + aa, r0);

  // 桌面陰影（世界座標，不隨杯子傾斜）：視線打到桌面的位置
  vec2 tw2 = w * (CAMERA_Z + BODY_DEPTH + PIVOT_Z * 0.0) / CAMERA_Z;
  vec2 sp = tw2 - vec2(0.09, -0.13);
  float shadow = 0.6 * (1.0 - smoothstep(0.78, 1.32, length(sp * vec2(1.0, 1.04))));
  shadow = max(shadow, 0.35 * (1.0 - smoothstep(0.95, 1.12, length(tw2 - vec2(0.03, -0.05)))));
  vec3 sc = vec3(0.07, 0.035, 0.018);

  if (cupAlpha <= 0.0) {
    // 杯身側面（略收窄的圓錐）：杯子傾斜時從杯緣下方露出來
    // r(z) = 1 + z * k，z ∈ [-BODY_DEPTH, 0]
    float k = BODY_TAPER;
    float A = dot(d.xy, d.xy) - k * k * d.z * d.z;
    float B = 2.0 * (dot(o.xy, d.xy) - k * d.z * (RIM_OUTER + k * o.z));
    float C = dot(o.xy, o.xy) - pow(RIM_OUTER + k * o.z, 2.0);
    float D = B * B - 4.0 * A * C;
    float bodyA = 0.0;
    vec3 body = ceramic;
    if (D > 0.0 && abs(A) > 1e-6) {
      float tb = (-B - sqrt(D)) / (2.0 * A);
      vec3 pb = o + d * tb;
      if (tb > 0.0 && pb.z < 0.0 && pb.z > -BODY_DEPTH) {
        vec3 Nb = normalize(vec3(pb.xy / length(pb.xy), k));
        float lb = 0.5 + 0.5 * dot(Nb, L);
        body = mix(ceramicShade * 0.82, ceramic, smoothstep(0.1, 0.95, lb));
        body = mix(body, ceramicShade * 0.7, smoothstep(0.0, 1.0, -pb.z / BODY_DEPTH) * 0.5);
        // 剪影邊緣抗鋸齒：以離錐面切線的距離估計
        bodyA = clamp(sqrt(D) / (abs(A) * aa * 6.0), 0.0, 1.0);
      }
    }
    float outA = bodyA + (1.0 - bodyA) * shadow;
    gl_FragColor = vec4(body * bodyA + sc * shadow * (1.0 - bodyA), outA);
    return;
  }

  vec2 dir = r0 > 1e-5 ? p0.xy / r0 : vec2(0.0, 1.0);
  float tr = clamp((r0 - RIM_INNER) / (RIM_OUTER - RIM_INNER), 0.0, 1.0);
  float ang = mix(-0.6, 0.95, tr);
  vec3 Nr = normalize(vec3(dir * sin(ang), cos(ang)));
  float lit = 0.5 + 0.5 * dot(Nr, L);
  vec3 rim = mix(ceramicShade, ceramic * 1.03, smoothstep(0.2, 0.9, lit));
  rim += pow(max(dot(reflect(d, Nr), Ls), 0.0), 40.0) * 0.22;
  rim = mix(rim, ceramicShade, smoothstep(0.82, 1.0, tr) * 0.45);
  rim += vec3(0.98, 0.72, 0.38) * uGlow * smoothstep(0.55, 1.0, tr) * 0.3;

  // ---------- 杯內：液面或內壁 ----------
  float a = dot(d.xy, d.xy);
  float b = 2.0 * dot(o.xy, d.xy);
  float c = dot(o.xy, o.xy) - RIM_INNER * RIM_INNER;
  float disc = b * b - 4.0 * a * c;
  float tw = a > 1e-6 && disc > 0.0 ? (-b + sqrt(disc)) / (2.0 * a) : 1e6;
  float tl = dot(uLiquidN, vec3(0.0, 0.0, -uDepth) - o) / dot(uLiquidN, d);
  vec3 pl = o + d * tl;
  vec3 pw = o + d * tw;

  // 液面
  vec2 lp = pl.xy / RIM_INNER;
  float rn = length(lp);
  vec2 suv = 0.5 + lp * uSimR;
  vec4 F = sampleField(suv);
  float foam = F.r;
  float tint = F.g;
  float crema = F.b;
  float grain = noise(suv * uTexSize * 3.0);

  vec3 cremaEdge = vec3(0.50, 0.22, 0.08);
  vec3 cremaMid = vec3(0.66, 0.36, 0.15);
  vec3 cremaCenter = vec3(0.76, 0.48, 0.24);
  vec3 base = mix(cremaCenter, cremaMid, smoothstep(0.0, 0.65, rn));
  base = mix(base, cremaEdge, smoothstep(0.6, 1.0, rn));
  base = mix(base * vec3(1.02, 0.98, 0.95), base, smoothstep(0.2, 0.8, crema));
  vec3 latte = vec3(0.80, 0.58, 0.38);
  base = mix(base, latte, smoothstep(0.0, 1.0, clamp(tint, 0.0, 1.0)) * 0.8);

  float fa = smoothstep(0.30, 0.52, foam);
  float fringe = smoothstep(0.06, 0.34, foam) * (1.0 - fa);
  base = mix(base, vec3(0.84, 0.64, 0.44), fringe * 0.3);

  float d2 = 2.2 / uTexSize.x;
  float ring = 0.25 * (
    sampleField(suv + vec2(d2, 0.0)).r + sampleField(suv - vec2(d2, 0.0)).r +
    sampleField(suv + vec2(0.0, d2)).r + sampleField(suv - vec2(0.0, d2)).r);
  float valley = smoothstep(0.03, 0.12, ring - foam) * smoothstep(0.45, 0.6, ring);

  vec3 foamC = vec3(0.98, 0.955, 0.91);
  foamC = mix(vec3(0.95, 0.89, 0.80), foamC, smoothstep(0.5, 0.85, foam));
  foamC *= 0.995 + 0.008 * (grain - 0.5);
  foamC = mix(foamC, vec3(0.80, 0.60, 0.40), valley * 0.75);
  vec3 liquid = mix(base, foamC, fa);

  // 注流漣漪（模擬座標）
  vec2 pp = suv - uPour.xy;
  float pr = length(pp);
  float wave = sin(pr * 210.0 - uTime * 12.0) * exp(-pr * 30.0) * uPour.w;
  vec2 rip = pr > 1e-5 ? (pp / pr) * wave : vec2(0.0);
  vec3 N = normalize(uLiquidN + vec3(rip * 0.2, 0.0));

  // 液面反光：反射向量對到窗光時亮起，杯子一傾斜反光就會滑動
  vec3 R = reflect(d, N);
  // 極淡的柔光反射：只給液面一點光澤，不搶花紋
  vec2 rel = R.xy / R.z - Ls.xy / Ls.z;
  float win = exp(-dot(rel, rel) / 0.0035);
  liquid = mix(liquid, vec3(1.0, 0.95, 0.88), win * mix(0.07, 0.015, fa));

  // 杯壁擋光：從液面往光源走到杯口高度，若在杯口外就是陰影
  vec3 q = pl + L * (-pl.z / max(L.z, 0.2));
  float wallShade = smoothstep(RIM_INNER - 0.08, RIM_INNER + 0.06, length(q.xy)) * 0.38
                  + smoothstep(0.93, 1.0, rn) * 0.2;
  liquid = mix(liquid, liquid * warmShade * 1.6, wallShade);
  liquid += vec3(1.0, 0.9, 0.8) * exp(-pow((rn - 0.996) / 0.006, 2.0)) * 0.05;

  float streamR = 0.011;
  float st = uPour.w * (1.0 - smoothstep(streamR * 0.55, streamR, pr));
  liquid = mix(liquid, vec3(1.0, 0.975, 0.94), st * 0.95);

  // 杯內壁：越深越暗（暖色），迎光面亮
  vec3 Nw = vec3(-pw.xy / RIM_INNER, 0.0);
  float depthK = clamp(-pw.z / max(uDepth, 0.05), 0.0, 1.0);
  vec3 wall = mix(ceramic, ceramicShade, 0.3 + 0.3 * (1.0 - max(dot(Nw, L), 0.0)));
  wall = mix(wall, vec3(0.66, 0.50, 0.38), depthK * 0.45);

  float liquidMask = smoothstep(-aa * 1.5, aa * 1.5, tw - tl);
  vec3 inside = mix(wall, liquid, liquidMask);

  vec3 col = mix(inside, rim, smoothstep(RIM_INNER - aa, RIM_INNER + aa, r0));
  col += (hash(vUv * uRes + uTime) - 0.5) / 255.0;

  // 杯子與陰影合成（premultiplied alpha）
  float outA = cupAlpha + (1.0 - cupAlpha) * shadow;
  vec3 outC = col * cupAlpha + sc * shadow * (1.0 - cupAlpha);
  gl_FragColor = vec4(outC, outA);
}
`;
