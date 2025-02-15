// config.js
// 移除 import，直接在 config 中定義模式
export const SIMULATION_MODES = {
  STIRRING: "STIRRING",
  POURING: "POURING",
};

export const config = {
  // 流體模擬參數
  fluid: {
    density: 1000.0,
    gravity: 0.0,
    dt: 1.0 / 60.0,
    numIters: 40,
    overRelaxation: 1.9,
  },

  // 顯示設定
  display: {
    resolution: 160,
    showStreamlines: false,
  },

  // 模擬模式設定
  simulation: {
    currentMode: SIMULATION_MODES.STIRRING, // 預設為攪拌模式

    // 攪拌模式參數
    stirring: {
      radius: 0.01, // 攪拌棒半徑
      strength: 1.0, // 攪拌力度
    },

    // 注入模式參數
    pouring: {
      radius: 0.1, // 注入點半徑
      strength: 2.0, // 注入力度
      density: 1.0, // 牛奶密度
    },
  },

  // Debug 設定
  debug: {
    paused: false,
    frameNr: 0,
  },
};
