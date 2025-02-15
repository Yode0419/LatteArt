export class Controls {
  constructor(config, onParamChange) {
    this.config = config;
    this.onParamChange = onParamChange;
    this.setupControls();
  }

  setupControls() {
    // 流體模擬參數
    this.setupRangeControl("density", "fluid", 500, 2000, 100);
    this.setupRangeControl("gravity", "fluid", -20, 20, 1);
    this.setupRangeControl("numIters", "fluid", 10, 100, 5);
    this.setupRangeControl("overRelaxation", "fluid", 1, 2, 0.1);

    // 顯示設定
    this.setupRangeControl("resolution", "display", 80, 300, 20);
    this.setupCheckboxControl("showSmoke", "display");
    this.setupCheckboxControl("showStreamlines", "display");

    // 障礙物設定
    this.setupRangeControl(
      "obstacleRadius",
      "obstacle",
      0.05,
      0.3,
      0.05,
      "radius"
    );
  }

  setupRangeControl(id, section, min, max, step, property = id) {
    const input = document.getElementById(id);
    const value = document.getElementById(`${id}-value`);

    if (!input || !value) return;

    input.min = min;
    input.max = max;
    input.step = step;
    input.value = this.config[section][property];
    value.textContent = this.config[section][property];

    input.addEventListener("input", (e) => {
      this.config[section][property] = Number(e.target.value);
      value.textContent = e.target.value;
      this.onParamChange(section, property);
    });
  }

  setupCheckboxControl(id, section, property = id) {
    const input = document.getElementById(id);

    if (!input) return;

    input.checked = this.config[section][property];
    input.addEventListener("change", (e) => {
      this.config[section][property] = e.target.checked;
      this.onParamChange(section, property);
    });
  }
}
