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
    damping: 1.2, // 每秒速度衰減率（越大越黏稠）；太低時圓形會被擠成菱形
    vorticity: 0, // 渦度保持，讓漩渦不會很快被抹平
    ambient: 0.006, // 液面自然微流動
    slosh: 6, // 杯子晃動帶動液面的力道
  },

  display: {
    resolution: 128,
    showStreamlines: false,
  },

  cup: {
    startFill: 0.75, // 端上桌時的液位（只影響畫面上液面離杯緣多近）
  },

  tools: {
    current: TOOLS.POUR,

    // 拉缸：radius / strength 由設定面板以 0–100 調整
    pour: {
      radius: 70,
      strength: 55,
      push: 22, // 注流把液面往外推的力道
      layering: true, // 每一注剛落下時推開舊奶泡、留下分層線（鬱金香的層次）
      fillRate: 0.04, // 每秒液位上升量（只是視覺）
    },

    etch: {
      radius: 35,
      strength: 60,
    },

    sink: {
      radius: 55,
      strength: 50,
      pull: 12, // 兩側往水柱收攏的力道（把穿心線縫起來、收成尖端）
      entryWidth: 3, // 剛切入時帶動範圍的倍數（越大愛心頂端的 V 口越寬）
      bodyWidth: 1, // 深入奶泡後帶動範圍的倍數（越大下半部越收成尖、尾巴越明顯）
      pullDelay: 0.09, // 切入多遠之後才開始收攏、變細（越大 V 口越深）
      cut: 8, // 剛切入時水柱壓下奶泡的量（切出愛心頂端的 V 口）
      cutLate: 0.3, // 進入奶泡之後壓下的量（越大穿心線越明顯）
      seal: 0, // 深入奶泡後兩側奶泡流回、補起穿心線的速度（0 = 保留穿心線）
      sealDelay: 0.15, // 切入多遠之後才開始縫合（V 口的深度不受影響）
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
