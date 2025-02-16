import { Fluid } from "./fluidSimulation.js";
import { FluidRenderer } from "./render.js";
import { FluidInteraction } from "./interaction.js";
import { StirringSimulator } from "./stirringSimulator.js";
import { MilkInjector } from "./milkInjection.js";
import { Controls } from "./controls.js";
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
let milkInjector;

// 顯示與隱藏controls介面
const toggleControlsBtn = document.getElementById("toggleControls");
const controlsPanel = document.querySelector(".controls");

toggleControlsBtn.addEventListener("click", () => {
  controlsPanel.classList.toggle("hidden");
});

// 設置模式切換
function setupModeButtons() {
  const stirringBtn = document.getElementById("stirringMode");
  const pouringBtn = document.getElementById("pouringMode");

  stirringBtn.addEventListener("click", () => {
    config.simulation.currentMode = SIMULATION_MODES.STIRRING;
    stirringBtn.classList.add("active");
    pouringBtn.classList.remove("active");
    interaction.setInteractionHandler(stirringSimulator);
    console.log("stirring mode");
  });

  pouringBtn.addEventListener("click", () => {
    config.simulation.currentMode = SIMULATION_MODES.POURING;
    pouringBtn.classList.add("active");
    stirringBtn.classList.remove("active");
    interaction.setInteractionHandler(milkInjector);
    console.log("pouring mode");
  });
}

// Handle parameter changes
function handleParamChange(section, property) {
  if (section === "display" && property === "resolution") {
    init(); // Resolution change requires reinitialization
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

  fluid = new Fluid(config.fluid.density, numX, numY, h);

  if (!renderer) {
    renderer = new FluidRenderer(canvas, domainHeight);
  }

  if (!interaction) {
    interaction = new FluidInteraction(canvas, renderer);
  }

  // 初始化模擬器
  stirringSimulator = new StirringSimulator(fluid, config);
  milkInjector = new MilkInjector(fluid, config);

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
      config.fluid.overRelaxation
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
