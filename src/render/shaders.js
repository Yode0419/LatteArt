// shaders.js
// 杯子與液面全部在一個全畫面 fragment shader 裡完成：
// 液面（crema 斑紋、焦糖混色、奶泡、光影、注流漣漪）→ 杯內壁 → 陶瓷杯緣。

export const RIM_IN = 0.445; // 杯緣內側（液面最大半徑），以 canvas uv 計
export const RIM_OUT = 0.492; // 杯緣外側

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
uniform float uLiquidR;     // 目前液面半徑（canvas uv）
uniform float uSimScale;    // canvas uv → 模擬 uv 的縮放
uniform vec4 uPour;         // xy = 注流位置（canvas uv），z = 拉缸高度，w = 是否注入
uniform float uGlow;        // 完成時的杯緣光暈

const float RIM_IN = ${RIM_IN.toFixed(4)};
const float RIM_OUT = ${RIM_OUT.toFixed(4)};

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
  vec2 p = vUv - 0.5;
  float r = length(p);
  vec2 dir = r > 1e-5 ? p / r : vec2(0.0, 1.0);
  float aa = 1.4 / uRes.x;
  vec3 L = normalize(vec3(-0.45, 0.55, 0.75));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  vec3 ceramic = vec3(0.925, 0.905, 0.87);

  // ---------- 液面 ----------
  vec2 suv = 0.5 + p * uSimScale;
  vec4 F = sampleField(suv);
  float foam = F.r;
  float tint = F.g;
  float crema = F.b;

  float grain = noise(vUv * uRes * 0.5);
  float rn = r / uLiquidR;

  // 陰影一律用暖色混合，不用灰黑相乘，避免顏色變混濁
  vec3 warmShade = vec3(0.42, 0.17, 0.06);

  // crema：乾淨的徑向漸層，中心榛果色、往杯緣過渡到紅棕色
  vec3 cremaEdge = vec3(0.50, 0.22, 0.08);
  vec3 cremaMid = vec3(0.66, 0.36, 0.15);
  vec3 cremaCenter = vec3(0.76, 0.48, 0.24);
  vec3 base = mix(cremaCenter, cremaMid, smoothstep(0.0, 0.65, rn));
  base = mix(base, cremaEdge, smoothstep(0.6, 1.0, rn));
  // crema 被注流打散的地方偏淡
  base = mix(base * vec3(1.02, 0.98, 0.95), base, smoothstep(0.2, 0.8, crema));

  // 高注混入的牛奶：溫潤的焦糖拿鐵色
  vec3 latte = vec3(0.80, 0.58, 0.38);
  base = mix(base, latte, smoothstep(0.0, 1.0, clamp(tint, 0.0, 1.0)) * 0.8);

  // 奶泡邊緣：由白過渡到淺焦糖
  float fa = smoothstep(0.30, 0.52, foam);
  float fringe = smoothstep(0.06, 0.34, foam) * (1.0 - fa);
  base = mix(base, vec3(0.84, 0.64, 0.44), fringe * 0.3);

  // 奶泡內的凹谷（新一注推開舊花紋留下的分層線）畫成淺焦糖細線
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

  // 注流漣漪
  vec2 pp = vUv - uPour.xy;
  float pr = length(pp);
  float wave = sin(pr * 230.0 - uTime * 12.0) * exp(-pr * 34.0) * uPour.w;
  vec2 rip = pr > 1e-5 ? (pp / pr) * wave : vec2(0.0);
  vec3 N = normalize(vec3(rip * 0.2, 1.0));

  // 柔和的窗光反射（只在液體，奶泡是霧面）
  vec2 wp = (p - vec2(-0.11, 0.13) + N.xy * 0.03) * vec2(1.0, 1.7);
  float win = smoothstep(0.18, 0.0, length(wp));
  liquid = mix(liquid, vec3(1.0, 0.93, 0.84), win * mix(0.08, 0.02, fa));
  liquid += pow(max(dot(N, H), 0.0), 40.0) * 0.04 * uPour.w;

  // 杯壁的柔和暖色陰影
  float ds = length(p - L.xy * 0.03);
  float wallShade = smoothstep(uLiquidR - 0.06, uLiquidR + 0.01, ds) * 0.35
                  + smoothstep(uLiquidR - 0.015, uLiquidR, r) * 0.2;
  liquid = mix(liquid, liquid * warmShade * 1.6, wallShade);

  // 注流本身：高注細、低注粗，帶一點高光
  float streamR = mix(0.011, 0.0055, uPour.z);
  float st = uPour.w * (1.0 - smoothstep(streamR * 0.55, streamR, pr));
  liquid = mix(liquid, vec3(1.0, 0.975, 0.94), st * 0.95);

  // ---------- 杯內壁（暖米色，不用灰） ----------
  vec3 ceramicShade = vec3(0.83, 0.75, 0.66);
  float t = clamp((r - uLiquidR) / max(RIM_IN - uLiquidR, 1e-4), 0.0, 1.0);
  float facing = dot(-dir, normalize(L.xy));
  vec3 wall = mix(ceramic, ceramicShade, 0.35 + 0.25 * facing);
  wall = mix(wall, vec3(0.70, 0.55, 0.42), (1.0 - smoothstep(0.0, 0.7, t)) * 0.35);

  // ---------- 杯緣（平口瓷杯） ----------
  float tr = clamp((r - RIM_IN) / (RIM_OUT - RIM_IN), 0.0, 1.0);
  float ang = mix(-0.55, 0.85, tr);
  vec3 Nr = normalize(vec3(dir * sin(ang), cos(ang)));
  float lit = 0.5 + 0.5 * dot(Nr, L);
  vec3 rim = mix(ceramicShade, ceramic * 1.03, smoothstep(0.2, 0.9, lit));
  rim = mix(rim, ceramicShade, smoothstep(0.8, 1.0, tr) * 0.5);
  rim += vec3(0.95, 0.55, 0.35) * uGlow * smoothstep(0.6, 1.0, tr) * 0.25;

  // ---------- 合成 ----------
  float liquidMask = 1.0 - smoothstep(uLiquidR - aa, uLiquidR + aa, r);
  float rimMask = smoothstep(RIM_IN - aa, RIM_IN + aa, r);
  float alpha = 1.0 - smoothstep(RIM_OUT - aa, RIM_OUT + aa, r);

  vec3 col = mix(wall, liquid, liquidMask);
  col = mix(col, rim, rimMask);
  col += (hash(vUv * uRes + uTime) - 0.5) / 255.0;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;
