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
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
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
  const domainWidth = domainHeight * (canvas.width / canvas.height);
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
