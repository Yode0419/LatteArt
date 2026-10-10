// config.js
// 所有模擬與顯示參數集中在這裡；設定面板直接讀寫這個物件。

export const TOOLS = {
  POUR: "pour",
  ETCH: "etch",
  SINK: "sink",
};

export const config = {
  fluid: {
    dt: 1.0 / 60.0,
    numIters: 24,
    overRelaxation: 1.9,
    damping: 1.6, // 每秒速度衰減率（越大越黏稠）
    vorticity: 0, // 渦度保持，讓漩渦不會很快被抹平
    ambient: 0.006, // 液面自然微流動
  },

  display: {
    resolution: 128,
    showStreamlines: false,
  },

  cup: {
    startFill: 0.3, // 一份 espresso 的液位
    lowerFill: 0.5, // 液位到這裡後，拉缸會自動壓低
  },

  tools: {
    current: TOOLS.POUR,

    // 拉缸：radius / strength 由設定面板以 0–100 調整
    pour: {
      radius: 50,
      strength: 55,
      lowerAfter: 2.2, // 按住超過幾秒自動壓低
      heightRate: 3.5, // 拉缸高度變化速度
      fillRate: 0.1, // 每秒液位上升量（strength = 50 時）
    },

    etch: {
      radius: 35,
      strength: 60,
    },

    sink: {
      radius: 55,
      strength: 50,
    },
  },

  debug: {
    paused: false,
  },
};

// 將面板上的 0–100 轉為實際物理量
export function lerpRange(value, min, max) {
  return min + ((max - min) * value) / 100;
}
