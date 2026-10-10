// demo.js
// 咖啡師示範：照時間軸驅動真正的模擬，一步步拉出一顆愛心
// （在杯心注入、往前推圓 → 下沉以細水柱穿心）。
// 每個片段：[開始秒, 結束秒, 工具, x0, y0, x1, y1, 字幕 key]

import { TOOLS } from "../config.js";

const HEART = [
  [0.4, 1.4, TOOLS.POUR, 0.5, 0.5, 0.5, 0.53, "demo.pour"],
  [1.4, 2.1, TOOLS.POUR, 0.5, 0.53, 0.5, 0.56, "demo.grow"],
  [2.7, 3.2, TOOLS.SINK, 0.5, 0.74, 0.5, 0.24, "demo.sink"],
];
const END = 4.8;

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
    this.onCaption("demo.watch");
    this.onToolChange(TOOLS.POUR);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.current) this.session.end();
    this.current = null;
    this.cursor.hideGhost();
  }

  update(dt) {
    if (!this.running) return;
    this.t += dt;
    const seg = HEART.find((s) => this.t >= s[0] && this.t < s[1]) || null;

    if (seg !== this.current) {
      // 同一個工具、緊接著的片段視為同一次按壓（不放開拉缸）
      const continued =
        seg && this.current && seg[2] === this.current[2] && seg[0] === this.current[1];
      if (this.current && !continued) this.session.end();
      this.current = seg;
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
      const e = k * k * (3 - 2 * k);
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
