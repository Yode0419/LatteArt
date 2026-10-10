# LatteArt 架構

沒有建置流程的純前端專案（ES modules + WebGL，不依賴 three.js）。程式依「模擬 → 渲染 → 互動 → 敘事 → 介面」分層，
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
  session.js             一杯咖啡的模擬狀態：流體、液位（只影響畫面）、工具、液面晃動
  i18n.js                繁中／英文字串與切換
  storage.js             localStorage 安全包裝（語言、杯號、是否看過示範）
  fluid/                 物理（純邏輯）
    fluidCore.js           MAC 網格不可壓縮流體 + foam/tint/crema 三層純量場
    pouring.js             拉缸：像畫筆一樣按下就出奶泡，並把液面推開
    sink.js                下沉：細水柱穿過奶泡，收成愛心的 V 口與尖端
    etch.js                雕花針：沿軌跡拖曳液面畫細線
    extraction.js          crema 的初始分佈（端上桌時就已長好）
  render/                畫面
    geometry.js            3D 杯子幾何、透視相機、傾斜旋轉；shader 與 JS 共用
    shaders.js             光線追蹤：杯口、杯內壁、杯身側面、液面、桌面陰影
    latteRenderer.js       上傳流體貼圖、繪製、canvas ↔ 模擬座標、分享用快照、2D 備援
    streamlines.js         除錯用流線
  interaction/
    pointer.js             滑鼠／觸控 → 模擬座標（射線打到液面）
    tilt.js                滑鼠位置／陀螺儀 → 杯子傾斜；液面彈簧晃動
  analysis/
    pattern.js             花型辨識（愛心／鬱金香／葉子／圓月／自由創作），不評分
  story/                 敘事
    demo.js                咖啡師示範時間軸（驅動真正的模擬）
    hints.js               依狀態挑選提示文案
  share/
    shareCard.js           存圖：讀取畫面上杯卡的實際排版一比一重畫、下載、Web Share
  ui/                    介面元件（只處理 DOM）
    sheet.js               底部抽屜（桌機為右側面板）
    settingsPanel.js       設定抽屜
    finishSheet.js         出杯：主畫面的金框杯卡＋只放按鈕的抽屜
    servePull.js           「上滑出杯」拉環
    halo.js                出杯時沿 3D 杯緣畫一圈的金色光環與粒子
    toolbar.js / cursor.js / toast.js
```

## 敘事流程（phase）

`body[data-phase]` 是唯一的狀態來源，CSS 依它顯示或隱藏區塊。

```
intro（一句「替自己沖一杯，拉個花。」）→ serving（杯子從上方端上桌）→ play ⇄ finish
換一杯：杯子往側邊收走、移出畫面 → serving（新的一杯端上）→ play
設定「看咖啡師示範」：serving → demo → handoff（換你了）→ serving → play
```

出杯（finish）：上滑拉環 → 主畫面上的金框杯卡從外往內套入，杯子同時縮小移進卡片中間的 slot（`layoutServe()` 依可用空間計算）→ 金色光環沿杯緣畫一圈並灑出粒子 → 卡片文字依序浮出；下方抽屜只放儲存、分享、繼續修飾、再做一杯。

## 3D 渲染

- 杯子是解析式幾何：杯口頂面（z = 0 的環）、杯內壁（圓柱）、杯身（略收窄的圓錐）、液面（平面）。
- 相機在正上方做透視投影；杯子繞杯身中段傾斜，液面法向量維持「世界的上方」再加上彈簧晃動。
- 觸控換算（`geometry.js`）與 shader 用同一套數學：從畫面點射出光線，打到液面平面後換成模擬座標。
- 傾斜幅度約 4°，只做氛圍；作畫或示範時杯子停在當下角度不動。
- 出杯杯卡跟杯子共用同一個傾斜：卡片以 CSS 透視轉動（幅度 ×1.6），光澤反向滑動。
- 傾斜的角加速度推動液面晃動；晃動速度再以體積源的梯度餵給流體，讓奶泡花紋真的被帶著走。
- 液面只保留極淡的柔光反射，不搶花紋。

## 模擬模型

| 純量場 | 意義 | 主要來源 |
| --- | --- | --- |
| `foam` | 浮在液面的白色奶泡 | 注奶 |
| `tint` | 混進咖啡裡的牛奶，讓底色變焦糖色 | 注奶邊緣、下沉 |
| `crema` | 咖啡油脂厚度 | 端上桌時就已長好 |

- 純量場使用 MacCormack 平流並以鄰格極值限制，讓線條保持銳利。
- 注奶透過體積源（`src`）把液面往外推；下沉為負源，把花紋往內收。
- 雕花與下沉的拖曳直接位移純量場，不推動速度場，避免拖出一對漩渦。
- 壓力求解以紅黑棋盤順序在預先算好的流體格清單上迭代，避免固定掃描方向造成的偏斜。
- 黏滯（damping）偏低，注入的動量會持續推動液面一陣子，看起來會流動。
- 每步約 7ms（128 解析度、node 實測）。

## 擴充指引

- **新增工具**：在 `fluid/` 實作 `begin / move / end / step(dt)`，在 `session.js` 註冊、
  `config.tools` 加參數、`index.html` 工具列加按鈕、`i18n.js` 加文案。
- **新增花型示範**：在 `story/demo.js` 加一條時間軸；座標為模擬座標（0–1，y 向上，杯心 0.5）。
- **調整視覺**：顏色先改 `tokens.css`；液面顏色在 `render/shaders.js`（暗部一律用暖色混合，不用灰黑相乘）。
- **調整 3D**：杯子尺寸、相機距離、傾斜支點在 `render/geometry.js`；傾斜幅度與晃動手感在 `interaction/tilt.js`。
- **新增語言**：在 `i18n.js` 的 `strings` 加一組，並在設定的語言切換加按鈕。
