// config.js
// 移除 import，直接在 config 中定義模式
export const SIMULATION_MODES = {
  STIRRING: "STIRRING",
  POURING: "POURING",
  SUCTION: "SUCTION", // 新增吸取模式
};

export const config = {
  // 流體模擬參數
  fluid: {
    density: 1000.0,
    gravity: 0.0,
    dt: 1.0 / 60.0,
    numIters: 20,
    overRelaxation: 1.9,
    viscosity: 0.95, // 🔹 新增黏滯性參數 (範圍建議 0.9 - 1.0)
  },

  // 顯示設定
  display: {
    resolution: 120,
    showStreamlines: false,
  },

  // 模擬模式設定
  simulation: {
    currentMode: SIMULATION_MODES.POURING, // 預設為注入模式

    // 攪拌模式參數
    stirring: {
      radius: 0.02, // 攪拌棒半徑
      strength: 2.5, // 攪拌力度
    },

    // 注入模式參數
    pouring: {
      radius: 0.1, // 注入點半徑
      strength: 2.5, // 注入力度
    },

    suction: {
      radius: 0.2, // 吸取範圍
      strength: 5.0, // 吸取強度
    },
  },

  // Debug 設定
  debug: {
    paused: false,
    frameNr: 0,
  },
};
