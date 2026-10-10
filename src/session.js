// session.js
// 一杯咖啡的模擬狀態：流體、液位、三種工具與液面晃動。
// 純邏輯、不碰 DOM，方便示範腳本與 UI 共用同一套操作介面。

import { Fluid } from "./fluid/fluidCore.js";
import { Pitcher } from "./fluid/pouring.js";
import { EtchNeedle } from "./fluid/etch.js";
import { SinkTool } from "./fluid/sink.js";
import { Extraction } from "./fluid/extraction.js";
import { config, TOOLS } from "./config.js";

export class LatteSession {
  constructor() {
    this.cup = { fill: config.cup.startFill };
    this.accumulator = 0;
    this.slosh = { x: 0, y: 0 }; // 由傾斜控制器每幀寫入
    this.reset();
  }

  // 新的一杯：清空液面，crema 已經長好（端上桌前就準備好了）
  reset({ extract = false } = {}) {
    if (!this.fluid || this.fluid.N !== config.display.resolution) {
      this.fluid = new Fluid(config.display.resolution);
    } else {
      this.fluid.reset();
    }
    this.cup.fill = config.cup.startFill;
    this.tools = {
      [TOOLS.POUR]: new Pitcher(this.fluid, config, this.cup),
      [TOOLS.ETCH]: new EtchNeedle(this.fluid, config),
      [TOOLS.SINK]: new SinkTool(this.fluid, config),
    };
    this.activeTool = this.tools[config.tools.current];
    this.extraction = new Extraction(this.fluid);
    if (!extract) this.extraction.finish();
  }

  // 更換解析度時保留液位，crema 直接長好
  rebuild() {
    const fill = this.cup.fill;
    this.fluid = null;
    this.reset({ extract: false });
    this.cup.fill = fill;
  }

  get pitcher() {
    return this.tools[TOOLS.POUR];
  }

  // 這杯是否已經注過奶
  get hasPoured() {
    return this.cup.fill > config.cup.startFill + 0.005;
  }

  get isExtracting() {
    return !this.extraction.done;
  }

  setTool(name) {
    if (!this.tools[name]) return;
    this.activeTool.end();
    config.tools.current = name;
    this.activeTool = this.tools[name];
  }

  begin(x, y) {
    this.activeTool.begin(x, y);
  }

  move(x, y) {
    this.activeTool.move(x, y);
  }

  end() {
    this.activeTool.end();
  }

  // 以固定步長推進模擬，每幀最多兩步，避免低效能裝置越跑越慢。
  // onStep 在每個模擬步之前呼叫（示範腳本用模擬時間推進，不受幀率影響）
  advance(frameDt, onStep = null) {
    if (config.debug.paused) return;
    const dt = config.fluid.dt;
    this.accumulator = Math.min(this.accumulator + frameDt, dt * 2);
    while (this.accumulator >= dt) {
      if (onStep) onStep(dt);
      if (!this.extraction.done) this.extraction.step(dt);
      this.fluid.applySlosh(this.slosh.x, this.slosh.y, config.fluid.slosh);
      for (const tool of Object.values(this.tools)) tool.step(dt);
      this.fluid.simulate(dt, config.fluid);
      this.accumulator -= dt;
    }
  }
}
