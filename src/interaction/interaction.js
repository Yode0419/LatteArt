export class FluidInteraction {
  constructor(canvas, renderer) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.mouseDown = false;
    this.currentHandler = null; // 當前的互動處理器

    this.setupEventListeners();
  }

  // 設置當前的互動處理器
  setInteractionHandler(handler) {
    this.currentHandler = handler;
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
  }

  startDrag(x, y) {
    this.mouseDown = true;

    if (this.currentHandler) {
      const { simX, simY } = this.toSimulationCoordinates(x, y);
      this.currentHandler.start(simX, simY);
    }
  }

  drag(x, y) {
    if (this.mouseDown && this.currentHandler) {
      const { simX, simY } = this.toSimulationCoordinates(x, y);
      this.currentHandler.update(simX, simY);
    }
  }

  toSimulationCoordinates(x, y) {
    const bounds = this.canvas.getBoundingClientRect();
    const normalizedX = (x - bounds.left) / bounds.width;
    const normalizedY = (y - bounds.top) / bounds.height;
    return {
      simX: normalizedX * this.renderer.simWidth,
      simY: (1 - normalizedY) * this.renderer.simHeight,
    };
  }

  endDrag() {
    if (this.currentHandler) {
      this.currentHandler.end();
    }
    this.mouseDown = false;
  }

  applyKeyboardGesture(from, to = from) {
    if (!this.currentHandler) return;
    this.currentHandler.start(from.x, from.y);
    if (from.x !== to.x || from.y !== to.y) {
      this.currentHandler.update(to.x, to.y);
    }
    this.currentHandler.end();
  }
}
