import { Fluid } from "./fluid/fluidCore.js";
import { FluidRenderer } from "./render.js";
import { FluidInteraction } from "./interaction/interaction.js";
import { MilkInjector } from "./fluid/pouring.js";
import { StirringSimulator } from "./fluid/stir.js";
import { SuctionSimulator } from "./fluid/suction.js"; // 引入 suction 模擬器
import { Controls } from "./interaction/controlPanel.js";
import { config, SIMULATION_MODES } from "./config.js"; // 修改這行，從 config.js 導入 SIMULATION_MODES

// Canvas setup
const canvas = document.getElementById("myCanvas");
const size = Math.min(
  Math.min(window.innerWidth * 0.8, 560),
  Math.min(window.innerHeight * 0.8, 560)
);
canvas.width = size;
canvas.height = size;
canvas.focus();

// Simulation state
let fluid;
let renderer;
let interaction;
let stirringSimulator;
let suctionSimulator;
let milkInjector;

// 顯示與隱藏controls介面
const toggleControlsBtn = document.getElementById("toggleControls");
const controlsPanel = document.querySelector(".controls");

toggleControlsBtn.addEventListener("click", () => {
  controlsPanel.classList.toggle("hidden");
});

// 設置模式切換
function setupModeButtons() {
  const pouringBtn = document.getElementById("pouringMode");
  const stirringBtn = document.getElementById("stirringMode");
  const suctionBtn = document.getElementById("suctionMode"); // 新增按鈕

  pouringBtn.addEventListener("click", () => {
    config.simulation.currentMode = SIMULATION_MODES.POURING;
    pouringBtn.classList.add("active");
    stirringBtn.classList.remove("active");
    suctionBtn.classList.remove("active");
    interaction.setInteractionHandler(milkInjector);
    console.log("pouring mode");
  });

  stirringBtn.addEventListener("click", () => {
    config.simulation.currentMode = SIMULATION_MODES.STIRRING;
    stirringBtn.classList.add("active");
    pouringBtn.classList.remove("active");
    suctionBtn.classList.remove("active");
    interaction.setInteractionHandler(stirringSimulator);
    console.log("stirring mode");
  });

  suctionBtn.addEventListener("click", () => {
    config.simulation.currentMode = SIMULATION_MODES.SUCTION;
    suctionBtn.classList.add("active");
    pouringBtn.classList.remove("active");
    stirringBtn.classList.remove("active");
    interaction.setInteractionHandler(suctionSimulator);
    console.log("suction mode");
  });
}

// Handle parameter changes
function handleParamChange(section, property) {
  if (section === "display" && property === "resolution") {
    init(); // Resolution change requires reinitialization
  }
  if (section === "fluid" && property === "viscosity") {
    fluid.viscosity = config.fluid.viscosity; // 🔹 更新 fluid 內的 viscosity
  }
}
// Initialize controls
const controls = new Controls(config, handleParamChange);

// Initialize and start simulation
function init() {
  const domainHeight = 1.0;
  const domainWidth = domainHeight; // 確保模擬領域是正方形
  const h = domainHeight / config.display.resolution;

  const numX = Math.floor(domainWidth / h);
  const numY = Math.floor(domainHeight / h);

  fluid = new Fluid(
    config.fluid.density,
    numX,
    numY,
    h,
    config.fluid.viscosity // 確保黏滯性參數被傳入
  );

  // 在初始化流體後立即設置圓形邊界
  setupCircularBoundary(fluid);

  if (!renderer) {
    renderer = new FluidRenderer(canvas, domainHeight);
  }

  if (!interaction) {
    interaction = new FluidInteraction(canvas, renderer);
  }

  // 初始化模擬器
  milkInjector = new MilkInjector(fluid, config);
  stirringSimulator = new StirringSimulator(fluid, config);
  suctionSimulator = new SuctionSimulator(fluid, config);

  // 設置預設模式
  interaction.setInteractionHandler(
    config.simulation.currentMode === SIMULATION_MODES.STIRRING
      ? stirringSimulator
      : milkInjector
  );

  console.log("Simulation started");
}

// Restart button
document.getElementById("restartButton").addEventListener("click", () => {
  init();
  config.debug.frameNr = 0;
});

// Share latte art image
const shareButton = document.getElementById("shareButton");
const shareLoading = document.getElementById("shareLoading");
shareButton.addEventListener("click", async () => {
  const container = document.querySelector(".canvas-container");
  shareLoading.classList.remove("hidden");
  try {
    const capture = await html2canvas(container, {
      backgroundColor: null,
      useCORS: true,
    });

    const scaled = document.createElement("canvas");
    scaled.width = 320;
    scaled.height = 320;
    const ctx = scaled.getContext("2d");
    ctx.drawImage(capture, 0, 0, 320, 320);

    const blob = await new Promise((res) =>
      scaled.toBlob(res, "image/png")
    );

    const file = new File([blob], "latte-art.png", { type: "image/png" });

    if (
      navigator.canShare &&
      navigator.canShare({ files: [file] }) &&
      navigator.share
    ) {
      try {
        await navigator.share({
          files: [file],
          title: "Latte Art",
          text: "Check out my latte art!",
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = "latte-art.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error("Capture failed", err);
  } finally {
    shareLoading.classList.add("hidden");
  }
});

// 這個函數負責設置圓形邊界
function setupCircularBoundary(fluid) {
  const n = fluid.numY;
  const centerX = (fluid.numX - 3) / 2;
  const centerY = (fluid.numY - 3) / 2;
  const radius = Math.min(centerX, centerY) * 0.99; // 稍微小於最大可能半徑

  for (let i = 0; i < fluid.numX; i++) {
    for (let j = 0; j < fluid.numY; j++) {
      const dx = i - centerX;
      const dy = j - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > radius) {
        fluid.s[i * n + j] = 0.0; // 圓外設為固體
      } else {
        fluid.s[i * n + j] = 1.0; // 圓內設為流體
      }
    }
  }
}

function update() {
  if (!config.debug.paused) {
    fluid.simulate(
      config.fluid.dt,
      config.fluid.gravity,
      config.fluid.numIters,
      config.fluid.overRelaxation,
      config.fluid.viscosity //新增傳遞 viscosity
    );
    config.debug.frameNr++;
  }

  renderer.draw(fluid, {
    showSmoke: config.display.showSmoke,
    showStreamlines: config.display.showStreamlines,
  });

  requestAnimationFrame(update);
}

// Initialize everything
setupModeButtons();
init();
update();
