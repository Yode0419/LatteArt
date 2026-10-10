// demo.js
// 咖啡師示範：照時間軸驅動真正的模擬，一步步拉出一顆愛心
// （杯心偏上一次連續注入 → 下沉以細水柱從上往下穿心）。
// 每個片段：[開始秒, 結束秒, 工具, x0, y0, x1, y1, 字幕 key, 工具參數覆寫]
// 工具參數覆寫只在這個片段生效，結束後還原成使用者在設定面板調的值。

import { TOOLS, config } from "../config.js";

// 一次連續注入：在杯心偏上的同一點穩定注流，奶泡撐成一整塊乾淨的圓（關掉分層線，不留同心紋）
const POUR = { layering: false };
// 下沉一口氣從圓的上緣往下穿過，分三段但不放開：
//   上段：剛切入時帶動範圍寬、切得淺 → 寬而淺的 V 口；兩側幾乎不收，兩瓣保持飽滿
//   中段：帶動範圍變寬、兩側用力收攏 → 下半部整片被拖成收尖的心形
//   下段：水柱變細繼續往下 → 拉出細長的尾巴
// 圓心偏上，往下拉出尾巴之後整顆心剛好落在杯子中央
const SINK = { entryWidth: 5, pullDelay: 0.015, cut: 3, cutLate: 0.05 };
export const HEART = [
  [0.4, 2.9, TOOLS.POUR, 0.5, 0.58, 0.5, 0.58, "demo.pour", POUR],
  [3.4, 4.2, TOOLS.SINK, 0.5, 0.86, 0.5, 0.36, "demo.sink", { ...SINK, pull: 4 }],
  [4.2, 5.0, TOOLS.SINK, 0.5, 0.36, 0.5, 0.17, "demo.sink", { ...SINK, bodyWidth: 4.5, pull: 30 }],
  [5.0, 5.6, TOOLS.SINK, 0.5, 0.17, 0.5, 0.04, "demo.tail", { ...SINK, bodyWidth: 1, pull: 8 }],
];
const END = 7.4;

// 兩段是否接續成同一次按壓（同一個工具、時間首尾相接）
function chained(a, b) {
  return Boolean(a && b && a[2] === b[2] && a[0] < b[0] && a[1] === b[0]);
}

// 按壓的頭尾才加減速；接續的片段之間保持速度，水柱才不會在交界停下來壓出一個洞
function ease(k, fromPrev, toNext) {
  if (fromPrev && toNext) return k;
  if (fromPrev) return 1 - (1 - k) * (1 - k);
  if (toNext) return k * k;
  return k * k * (3 - 2 * k);
}

export class DemoPlayer {
  constructor({ session, cursor, onCaption, onToolChange, onDone }) {
    this.session = session;
    this.cursor = cursor;
    this.onCaption = onCaption;
    this.onToolChange = onToolChange;
    this.onDone = onDone;
    this.t = 0;
    this.running = false;
    this.current = null;
  }

  start() {
    this.t = 0;
    this.running = true;
    this.current = null;
    // 端杯時的晃動還留在液面上，先等它靜下來；液面微流動也從同一個相位開始，
    // 每次示範才會是同一顆對稱的心
    this.session.fluid.calm();
    this.session.fluid.time = 0;
    this.onCaption("demo.watch");
    this.onToolChange(TOOLS.POUR);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.current) this.session.end();
    this.current = null;
    this.restoreTuning();
    this.cursor.hideGhost();
  }

  // 示範需要的工具手感（例如注入時不留分層線），暫時蓋過設定面板的值
  applyTuning(tool, overrides) {
    if (!overrides) return;
    const opts = config.tools[tool];
    this.saved = { opts, values: {} };
    for (const key of Object.keys(overrides)) {
      this.saved.values[key] = opts[key];
      opts[key] = overrides[key];
    }
  }

  restoreTuning() {
    if (!this.saved) return;
    Object.assign(this.saved.opts, this.saved.values);
    this.saved = null;
  }

  update(dt) {
    if (!this.running) return;
    this.t += dt;
    const seg = HEART.find((s) => this.t >= s[0] && this.t < s[1]) || null;

    if (seg !== this.current) {
      // 同一個工具、緊接著的片段視為同一次按壓（不放開拉缸）
      const continued = chained(this.current, seg);
      if (this.current && !continued) this.session.end();
      this.restoreTuning();
      this.current = seg;
      if (seg) this.applyTuning(seg[2], seg[8]);
      if (seg && continued) {
        this.onCaption(seg[7]);
      } else if (seg) {
        if (this.session.activeTool !== this.session.tools[seg[2]]) this.onToolChange(seg[2]);
        this.session.begin(seg[3], seg[4]);
        this.onCaption(seg[7]);
      }
    }

    // 下一段開始前，幽靈手指先移到起點
    const next = HEART.find((s) => s[0] > this.t);
    if (seg) {
      const k = (this.t - seg[0]) / (seg[1] - seg[0]);
      const e = ease(k, chained(HEART[HEART.indexOf(seg) - 1], seg), chained(seg, next));
      const x = seg[3] + (seg[5] - seg[3]) * e;
      const y = seg[4] + (seg[6] - seg[4]) * e;
      this.session.move(x, y);
      this.cursor.showGhost(x, y, true);
    } else if (next) {
      const prev = [...HEART].reverse().find((s) => s[1] <= this.t);
      const fromX = prev ? prev[5] : 0.5;
      const fromY = prev ? prev[6] : 0.32;
      const gap = next[0] - (prev ? prev[1] : 0);
      const k = Math.min(1, (this.t - (prev ? prev[1] : 0)) / gap);
      const e = k * k * (3 - 2 * k);
      this.cursor.showGhost(fromX + (next[3] - fromX) * e, fromY + (next[4] - fromY) * e, false);
    } else {
      this.cursor.hideGhost();
    }

    if (this.t >= END) {
      this.stop();
      this.onDone();
    }
  }
}
