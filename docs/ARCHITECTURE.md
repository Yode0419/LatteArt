# LatteArt 架構

沒有建置流程的純前端專案（ES modules + WebGL）。程式依「模擬 → 渲染 → 互動 → 敘事 → 介面」分層，
下層不知道上層存在：`fluid/` 不碰 DOM，`render/` 不知道 UI，`ui/` 不直接改流體。

```
index.html               App 頁面骨架（所有文字都有 data-i18n）
design-system.html       Design System 展示頁，直接載入 App 的兩份樣式
assets/
  tokens.css             設計 token：Primitive → Semantic → Component
  styles.css             元件樣式，只引用 tokens.css 的變數
src/
  main.js                進入點：組裝各模組、phase 狀態機、主迴圈
  config.js              所有模擬／工具／顯示參數（設定面板直接讀寫）
  session.js             一杯咖啡的模擬狀態：流體、液位、工具、萃取
  i18n.js                繁中／英文字串與切換
  storage.js             localStorage 安全包裝（語言、杯號、是否看過示範）
  fluid/                 物理（純邏輯）
    fluidCore.js           MAC 網格不可壓縮流體 + foam/tint/crema 三層純量場
    pouring.js             拉缸：高度決定牛奶沉下（混色）或浮上（奶泡）
    sink.js                下沉：細水柱穿過奶泡，收成愛心的 V 口與尖端
    etch.js                雕花針：沿軌跡拖曳液面畫細線
    extraction.js          開場萃取：crema 從中心長出
  render/                畫面
    shaders.js             液面＋瓷杯的 fragment shader
    latteRenderer.js       上傳流體貼圖、繪製、座標換算、分享用快照、2D 備援
    streamlines.js         除錯用流線
  interaction/
    pointer.js             滑鼠／觸控 → 模擬座標
  analysis/
    tasting.js             品杯：花型辨識與四項評分
  story/                 敘事
    demo.js                咖啡師示範時間軸（驅動真正的模擬）
    hints.js               依狀態挑選提示文案
  share/
    shareCard.js           分享卡合成、下載、Web Share
  ui/                    介面元件（只處理 DOM）
    sheet.js               底部抽屜（桌機為右側面板）
    settingsPanel.js       設定抽屜
    finishSheet.js         品杯結果抽屜
    toolbar.js / cursor.js / toast.js
```

## 敘事流程（phase）

`body[data-phase]` 是唯一的狀態來源，CSS 依它顯示或隱藏區塊。

```
intro ──(萃取完成／輕點跳過)──┬─(第一次造訪)→ demo → handoff ─┐
                              └─(看過示範)────────────────────┴→ play ⇄ finish
play / finish ──(換一杯：舊杯滑出、新杯滑入)──→ intro-quiet → play
```

## 模擬模型

| 純量場 | 意義 | 主要來源 |
| --- | --- | --- |
| `foam` | 浮在液面的白色奶泡 | 低注（拉缸壓低） |
| `tint` | 沉進 espresso 底下的牛奶，讓底色變焦糖色 | 高注、下沉 |
| `crema` | 咖啡油脂厚度 | 開場萃取，高注會打散 |

- 純量場使用 MacCormack 平流並以鄰格極值限制，讓線條保持銳利。
- 注奶透過體積源（`src`）把液面往外推；下沉為負源，把花紋往內收。
- 雕花與下沉的拖曳直接位移純量場，不推動速度場，避免拖出一對漩渦。
- 每步約 7ms（128 解析度、node 實測）；壓力求解使用預先算好的流體格清單。

## 擴充指引

- **新增工具**：在 `fluid/` 實作 `begin / move / end / step(dt)`，在 `session.js` 註冊、
  `config.tools` 加參數、`index.html` 工具列加按鈕、`i18n.js` 加文案。
- **新增花型示範**：在 `story/demo.js` 加一條時間軸；座標為模擬座標（0–1，y 向上，杯心 0.5）。
- **調整視覺**：顏色先改 `tokens.css`；液面顏色在 `render/shaders.js`（暗部一律用暖色混合，不用灰黑相乘）。
- **新增語言**：在 `i18n.js` 的 `strings` 加一組，並在設定的語言切換加按鈕。
