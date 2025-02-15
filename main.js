import { Fluid, U_FIELD, V_FIELD, S_FIELD } from "./fluidSimulation.js";

// Canvas setup
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 100;
canvas.focus();

// Simulation constants
const simHeight = 1;
const cScale = canvas.height / simHeight;
const simWidth = canvas.width / cScale;

// Simulation parameters
const DENSITY = 1000.0;
const DT = 1.0 / 60.0;
const NUM_ITERS = 40;
let overRelaxation = 1.9; // 可以被 UI 更改的變數
const GRAVITY = 0.0;

// Fluid simulation instance
let fluid;
let frameNr = 0;
let paused = false;
let showSmoke = true;
let showStreamlines = false;

// Obstacle parameters
let obstacleX = 0.0;
let obstacleY = 0.0;
const OBSTACLE_RADIUS = 0.1;

// Utility functions
function cX(x) {
  return x * cScale;
}

function cY(y) {
  return canvas.height - y * cScale;
}

function getSciColor(val, minVal, maxVal) {
  val = Math.min(Math.max(val, minVal), maxVal - 0.0001);
  const d = maxVal - minVal;
  val = d == 0.0 ? 0.5 : (val - minVal) / d;
  const m = 0.25;
  const num = Math.floor(val / m);
  const s = (val - num * m) / m;
  let r, g, b;

  switch (num) {
    case 0:
      r = 0.0;
      g = s;
      b = 1.0;
      break;
    case 1:
      r = 0.0;
      g = 1.0;
      b = 1.0 - s;
      break;
    case 2:
      r = s;
      g = 1.0;
      b = 0.0;
      break;
    case 3:
      r = 1.0;
      g = 1.0 - s;
      b = 0.0;
      break;
  }

  return [255 * r, 255 * g, 255 * b, 255];
}

// Drawing function
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const n = fluid.numY;
  const cellScale = 1.1;
  const h = fluid.h;

  const id = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Draw fluid cells
  for (let i = 0; i < fluid.numX; i++) {
    for (let j = 0; j < fluid.numY; j++) {
      let color = [255, 255, 255, 255];

      if (showSmoke) {
        const s = fluid.m[i * n + j];
        color = getSciColor(s, 0.0, 1.0);
      } else if (fluid.s[i * n + j] == 0.0) {
        color = [0, 0, 0, 255];
      }

      const x = Math.floor(cX(i * h));
      const y = Math.floor(cY((j + 1) * h));
      const cx = Math.floor(cScale * cellScale * h) + 1;
      const cy = Math.floor(cScale * cellScale * h) + 1;

      for (let yi = y; yi < y + cy; yi++) {
        let p = 4 * (yi * canvas.width + x);
        for (let xi = 0; xi < cx; xi++) {
          id.data[p++] = color[0];
          id.data[p++] = color[1];
          id.data[p++] = color[2];
          id.data[p++] = color[3];
        }
      }
    }
  }

  ctx.putImageData(id, 0, 0);

  // Draw streamlines if enabled
  if (showStreamlines) {
    const segLen = fluid.h * 0.2;
    const numSegs = 15;

    ctx.strokeStyle = "#ff0000";

    for (let i = 1; i < fluid.numX - 1; i += 5) {
      for (let j = 1; j < fluid.numY - 1; j += 5) {
        let x = (i + 0.5) * fluid.h;
        let y = (j + 0.5) * fluid.h;

        ctx.beginPath();
        ctx.moveTo(cX(x), cY(y));

        for (let n = 0; n < numSegs; n++) {
          const u = fluid.sampleField(x, y, U_FIELD);
          const v = fluid.sampleField(x, y, V_FIELD);
          x += u * 0.01;
          y += v * 0.01;
          if (x > fluid.numX * fluid.h) break;

          ctx.lineTo(cX(x), cY(y));
        }
        ctx.stroke();
      }
    }
  }
}

// Obstacle handling
function setObstacle(x, y, reset) {
  let vx = 0.0;
  let vy = 0.0;

  if (!reset) {
    vx = (x - obstacleX) / DT;
    vy = (y - obstacleY) / DT;
  }

  obstacleX = x;
  obstacleY = y;
  const n = fluid.numY;

  for (let i = 1; i < fluid.numX - 2; i++) {
    for (let j = 1; j < fluid.numY - 2; j++) {
      fluid.s[i * n + j] = 1.0;

      const dx = (i + 0.5) * fluid.h - x;
      const dy = (j + 0.5) * fluid.h - y;

      if (dx * dx + dy * dy < OBSTACLE_RADIUS * OBSTACLE_RADIUS) {
        fluid.s[i * n + j] = 0.0;
        fluid.m[i * n + j] = 0.5 + 0.5 * Math.sin(0.1 * frameNr);
        fluid.u[i * n + j] = vx;
        fluid.u[(i + 1) * n + j] = vx;
        fluid.v[i * n + j] = vy;
        fluid.v[i * n + j + 1] = vy;
      }
    }
  }
}

// Mouse/Touch interaction
let mouseDown = false;

function startDrag(x, y) {
  const bounds = canvas.getBoundingClientRect();
  const mx = x - bounds.left - canvas.clientLeft;
  const my = y - bounds.top - canvas.clientTop;
  mouseDown = true;

  const simX = mx / cScale;
  const simY = (canvas.height - my) / cScale;
  setObstacle(simX, simY, true);
}

function drag(x, y) {
  if (mouseDown) {
    const bounds = canvas.getBoundingClientRect();
    const mx = x - bounds.left - canvas.clientLeft;
    const my = y - bounds.top - canvas.clientTop;
    const simX = mx / cScale;
    const simY = (canvas.height - my) / cScale;
    setObstacle(simX, simY, false);
  }
}

function endDrag() {
  mouseDown = false;
}

// Event listeners
canvas.addEventListener("mousedown", (event) => startDrag(event.x, event.y));
canvas.addEventListener("mouseup", () => endDrag());
canvas.addEventListener("mousemove", (event) => drag(event.x, event.y));
canvas.addEventListener("touchstart", (event) => {
  event.preventDefault();
  startDrag(event.touches[0].clientX, event.touches[0].clientY);
});
canvas.addEventListener("touchend", (event) => {
  event.preventDefault();
  endDrag();
});
canvas.addEventListener(
  "touchmove",
  (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    drag(event.touches[0].clientX, event.touches[0].clientY);
  },
  { passive: false }
);

document.addEventListener("keydown", (event) => {
  if (event.key === "p") {
    paused = !paused;
  }
});

// UI Controls
document.getElementById("streamButton").addEventListener("change", (e) => {
  showStreamlines = e.target.checked;
});

document.getElementById("smokeButton").addEventListener("change", (e) => {
  showSmoke = e.target.checked;
});

document.getElementById("overrelaxButton").addEventListener("change", (e) => {
  overRelaxation = e.target.checked ? 1.9 : 1.0;
});

document.getElementById("restartButton").addEventListener("click", () => {
  // Reset the simulation
  init();
  frameNr = 0;

  // Reset obstacle position
  obstacleX = 0.0;
  obstacleY = 0.0;
});

// Initialize and start simulation
function init() {
  const res = 160;
  const domainHeight = 1.0;
  const domainWidth = (domainHeight / simHeight) * simWidth;
  const h = domainHeight / res;

  const numX = Math.floor(domainWidth / h);
  const numY = Math.floor(domainHeight / h);

  fluid = new Fluid(DENSITY, numX, numY, h);
}

function update() {
  if (!paused) {
    fluid.simulate(DT, GRAVITY, NUM_ITERS, overRelaxation);
    frameNr++;
  }
  draw();
  requestAnimationFrame(update);
}

// Start the simulation
init();
update();
