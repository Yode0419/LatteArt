// Simulation configuration parameters
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
    showSmoke: true,
    showStreamlines: false,
  },

  // 障礙物設定
  obstacle: {
    radius: 0.1,
  },

  // Debug 設定
  debug: {
    paused: false,
    frameNr: 0,
  },
};
