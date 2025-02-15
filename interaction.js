export class FluidInteraction {
  constructor(canvas, renderer, fluid, config) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.fluid = fluid;
    this.config = config; // 直接存儲 config 物件
    this.mouseDown = false;
    this.obstacleX = 0.0;
    this.obstacleY = 0.0;

    this.setupEventListeners();
  }

  setFluid(fluid) {
    this.fluid = fluid;
  }

  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener("mousedown", (event) => {
      this.startDrag(event.clientX, event.clientY);
    });

    this.canvas.addEventListener("mouseup", () => {
      this.endDrag();
    });

    this.canvas.addEventListener("mousemove", (event) => {
      this.drag(event.clientX, event.clientY);
    });

    // Touch events
    this.canvas.addEventListener("touchstart", (event) => {
      event.preventDefault();
      this.startDrag(event.touches[0].clientX, event.touches[0].clientY);
    });

    this.canvas.addEventListener("touchend", (event) => {
      event.preventDefault();
      this.endDrag();
    });

    this.canvas.addEventListener(
      "touchmove",
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.drag(event.touches[0].clientX, event.touches[0].clientY);
      },
      { passive: false }
    );

    // Keyboard events
    document.addEventListener("keydown", (event) => {
      if (event.key === "p") {
        this.config.debug.paused = !this.config.debug.paused;
      }
    });
  }

  startDrag(x, y) {
    const bounds = this.canvas.getBoundingClientRect();
    const mx = x - bounds.left - this.canvas.clientLeft;
    const my = y - bounds.top - this.canvas.clientTop;
    this.mouseDown = true;

    const simX = mx / this.renderer.cScale;
    const simY = (this.canvas.height - my) / this.renderer.cScale;
    this.setObstacle(simX, simY, true);
  }

  drag(x, y) {
    if (this.mouseDown) {
      const bounds = this.canvas.getBoundingClientRect();
      const mx = x - bounds.left - this.canvas.clientLeft;
      const my = y - bounds.top - this.canvas.clientTop;
      const simX = mx / this.renderer.cScale;
      const simY = (this.canvas.height - my) / this.renderer.cScale;
      this.setObstacle(simX, simY, false);
    }
  }

  endDrag() {
    this.mouseDown = false;
  }

  setObstacle(x, y, reset) {
    let vx = 0.0;
    let vy = 0.0;

    if (!reset) {
      vx = (x - this.obstacleX) / this.config.fluid.dt;
      vy = (y - this.obstacleY) / this.config.fluid.dt;
    }

    this.obstacleX = x;
    this.obstacleY = y;
    const n = this.fluid.numY;

    for (let i = 1; i < this.fluid.numX - 2; i++) {
      for (let j = 1; j < this.fluid.numY - 2; j++) {
        this.fluid.s[i * n + j] = 1.0;

        const dx = (i + 0.5) * this.fluid.h - x;
        const dy = (j + 0.5) * this.fluid.h - y;

        if (
          dx * dx + dy * dy <
          this.config.obstacle.radius * this.config.obstacle.radius
        ) {
          this.fluid.s[i * n + j] = 0.0;
          this.fluid.m[i * n + j] =
            0.5 + 0.5 * Math.sin(0.1 * this.config.debug.frameNr);
          this.fluid.u[i * n + j] = vx;
          this.fluid.u[(i + 1) * n + j] = vx;
          this.fluid.v[i * n + j] = vy;
          this.fluid.v[i * n + j + 1] = vy;
        }
      }
    }
  }

  resetObstacle() {
    this.obstacleX = 0.0;
    this.obstacleY = 0.0;
  }
}
