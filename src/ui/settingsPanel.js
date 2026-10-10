// settingsPanel.js
// 設定抽屜：語言、目前工具參數、顯示、進階模擬。所有控制項直接讀寫 config。

import { config } from "../config.js";
import { t, getLang, setLang, onLangChange } from "../i18n.js";

const $ = (id) => document.getElementById(id);

const FLUID_FIELDS = [
  { id: "damping", key: "damping", digits: 1 },
  { id: "ambient", key: "ambient", digits: 3 },
  { id: "vorticity", key: "vorticity", digits: 1 },
  { id: "numIters", key: "numIters", digits: 0 },
  { id: "overRelaxation", key: "overRelaxation", digits: 2 },
];

function paintSlider(input) {
  const min = Number(input.min);
  const max = Number(input.max);
  const pct = ((Number(input.value) - min) / (max - min)) * 100;
  input.style.setProperty("--fill", `${pct}%`);
}

function bindSlider(id, read, write, format = (v) => String(v)) {
  const input = $(id);
  const output = input.parentElement.querySelector("output");
  const sync = () => {
    input.value = read();
    output.textContent = format(Number(input.value));
    paintSlider(input);
  };
  input.addEventListener("input", () => {
    write(Number(input.value));
    output.textContent = format(Number(input.value));
    paintSlider(input);
  });
  sync();
  return sync;
}

export class SettingsPanel {
  constructor({ onResolution, onReplayDemo }) {
    this.syncers = [];

    // 語言
    const langButtons = [...document.querySelectorAll("#langSwitch [data-lang]")];
    const syncLang = () => {
      for (const b of langButtons) b.setAttribute("aria-checked", String(b.dataset.lang === getLang()));
    };
    for (const b of langButtons) b.addEventListener("click", () => setLang(b.dataset.lang));
    onLangChange(() => {
      syncLang();
      this.syncToolName();
    });
    syncLang();

    // 目前工具
    const toolOpts = () => config.tools[config.tools.current];
    this.syncers.push(
      bindSlider("toolRadius", () => toolOpts().radius, (v) => (toolOpts().radius = v)),
      bindSlider("toolStrength", () => toolOpts().strength, (v) => (toolOpts().strength = v))
    );

    // 顯示
    let resTimer = null;
    this.syncers.push(
      bindSlider(
        "resolution",
        () => config.display.resolution,
        (v) => {
          config.display.resolution = v;
          clearTimeout(resTimer);
          resTimer = setTimeout(onResolution, 250);
        }
      )
    );
    const streamlines = $("streamlines");
    streamlines.checked = config.display.showStreamlines;
    streamlines.addEventListener("change", () => {
      config.display.showStreamlines = streamlines.checked;
    });

    // 進階
    for (const f of FLUID_FIELDS) {
      this.syncers.push(
        bindSlider(
          f.id,
          () => config.fluid[f.key],
          (v) => (config.fluid[f.key] = v),
          (v) => v.toFixed(f.digits)
        )
      );
    }

    $("replayDemoBtn").addEventListener("click", onReplayDemo);
  }

  syncToolName() {
    $("activeToolName").textContent = t(`tool.${config.tools.current}`);
  }

  // 每次打開時同步目前工具的數值
  refresh() {
    this.syncToolName();
    for (const sync of this.syncers) sync();
  }
}
