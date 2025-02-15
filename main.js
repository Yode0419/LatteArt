import { Fluid } from "./fluidSimulation.js";
import { FluidRenderer } from "./render.js";
import { FluidInteraction } from "./interaction.js";
import { Controls } from "./controls.js";
import { config } from "./config.js";

// Canvas setup
const canvas = document.getElementById("myCanvas");
canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 100;
canvas.focus();

// Simulation state
let fluid;
let renderer;
let interaction;

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
    interaction = new FluidInteraction(canvas, renderer, fluid, config);
  } else {
    interaction.setFluid(fluid);
  }
}

// Restart button
document.getElementById("restartButton").addEventListener("click", () => {
  init();
  config.debug.frameNr = 0;
  interaction.resetObstacle();
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

// Start the simulation
init();
update();
