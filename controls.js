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
    this.setupRangeControl("overRelaxation", "fluid", 1, 2, 0.1);

    // 顯示設定
    this.setupRangeControl("resolution", "display", 80, 300, 20);
    this.setupCheckboxControl("showSmoke", "display");
    this.setupCheckboxControl("showStreamlines", "display");

    // 模擬模式選擇
    this.setupModeControl("currentMode", "simulation");

    // 牛奶注入參數
    this.setupRangeControl(
      "pourRadius",
      "simulation",
      0.01,
      0.1,
      0.01,
      "pouring",
      "radius"
    );
    this.setupRangeControl(
      "pourStrength",
      "simulation",
      0.5,
      5,
      0.5,
      "pouring",
      "strength"
    );

    // 攪拌參數
    this.setupRangeControl(
      "stirRadius",
      "simulation",
      0.05,
      0.3,
      0.05,
      "stirring",
      "radius"
    );
    this.setupRangeControl(
      "stirStrength",
      "simulation",
      0.5,
      5,
      0.5,
      "stirring",
      "strength"
    );
  }

  setupRangeControl(
    id,
    section,
    min,
    max,
    step,
    subProperty = id,
    nestedProperty = null
  ) {
    const input = document.getElementById(id);
    const value = document.getElementById(`${id}-value`);

    if (!input || !value) return;

    let paramValue = nestedProperty
      ? this.config[section][subProperty][nestedProperty]
      : this.config[section][subProperty];
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = paramValue;
    value.textContent = paramValue.toFixed(2);

    input.addEventListener("input", (e) => {
      if (nestedProperty) {
        this.config[section][subProperty][nestedProperty] = Number(
          e.target.value
        );
      } else {
        this.config[section][subProperty] = Number(e.target.value);
      }
      value.textContent = Number(e.target.value).toFixed(2);
      this.onParamChange(section, subProperty, nestedProperty);
    });
  }

  setupCheckboxControl(id, section, subProperty = id) {
    const input = document.getElementById(id);
    if (!input) return;

    input.checked = this.config[section][subProperty];
    input.addEventListener("change", (e) => {
      this.config[section][subProperty] = e.target.checked;
      this.onParamChange(section, subProperty);
    });
  }

  setupModeControl(id, section) {
    const input = document.getElementById(id);
    if (!input) return;

    input.value = this.config[section][id];
    input.addEventListener("change", (e) => {
      this.config[section][id] = e.target.value;
      this.onParamChange(section, id);
    });
  }
}
