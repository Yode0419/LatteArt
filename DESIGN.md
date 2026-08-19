---
name: LatteArt
version: "2.0-mock-baseline"
source_of_truth:
  - ".impeccable/mocks/latteart-working-state-v2.png"
  - ".impeccable/mocks/latteart-completion-state-v2.png"
  - ".impeccable/mocks/latteart-settings-drawer.png"
tokens: "assets/design-tokens.css"
showcase: "design-system.html"
fonts:
  signature: '"Latte Display", Didot, "Bodoni 72", serif'
  ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif'
---

# LatteArt Design System

## 1. 視覺真實來源

本文件以三張已核准 mock 為唯一視覺基準：創作中、完成、設定抽屜。現有 `index.html`、`assets/styles.css` 與模擬器畫面是待校正的實作，不是反向推導本設計系統的依據。

三張圖共同確認的設計方向是「深色漆器托盤上的拉花儀式」：近黑、帶暖度與細緻紋理的底面承載一只高亮度瓷杯；操作介面保持扁平、煙燻、低彩度，透過酒紅互動色與少量銅色建立狀態。它不是明亮咖啡廳、儀表板、霓虹科技或泡泡玻璃風格。

### 證據優先順序

1. 三張 mock 中實際可見的比例、色階、文字與狀態。
2. 同目錄的三份 prompt，用來確認互動意圖與不可出現的內容。
3. `assets/design-tokens.css`，作為後續實作的 canonical token 檔。
4. 其他現有程式與樣式只能用來了解功能，不能覆蓋 1–3。

## 2. 核心視覺規則

### 杯面優先

- 杯子是畫面最大、最亮、唯一的主視覺圓形。
- 工作狀態保留可操作的杯面與觸控軌跡；完成狀態移除軌跡並加入細銅色環。
- 任何控制元件都不得比瓷白杯緣更亮或更搶眼。

### 漆器背景

- 主底色採 `#060302`，視狀態可在 `#0E0A09` 至 `#1A1714` 間增加暖度。
- 紋理是低對比、非規則的漆器／皮革質感；不可使用網格、條紋、彩色噪點或高光亮片。
- 背景暗角寬而柔，不形成明顯光圈。

### 酒紅表示互動

- 酒紅只用於 selected、active、range progress、thumb、toggle、Reset 以及安靜的文字動作。
- `#824A42` 是控制色；`#A25C56` 用於較清楚的 active 線與 icon；`#C96961` 用於「Keep editing」等文字動作。
- 酒紅不得大面積成為頁面背景，也不得升高成鮮紅、粉紅或霓虹紅。

### 銅色表示完成

- `#CF8F64` 只用於完成杯環、Finish tray 頂緣與極少量儀式性強調。
- 次階銅色 `#A97453` 可用於較暗的邊緣與陰影。
- 一般按鈕、滑桿、選取狀態不可使用銅色。

## 3. 色彩 Tokens

下列 primitive 是從 mock 的代表區域重新取樣後整理出的「畫面合成色」。半透明元件實作應使用 semantic surface token，讓其與底部紋理疊合，而不是直接把所有面塗成同一個實色。

| Primitive | Value | 用途 |
| --- | --- | --- |
| `--la-ink-1000` | `#060302` | 主漆器背景 |
| `--la-ink-950` | `#0E0A09` | 工具列合成後暗面 |
| `--la-brown-900` | `#1A1714` | Settings／Completion sheet 合成後暗面 |
| `--la-brown-800` | `#25201C` | 次要完成動作 |
| `--la-wine-950` | `#311B18` | Save Image 主動作 |
| `--la-wine-800` | `#4E2F2A` | 語言選取面、作用中控制面 |
| `--la-wine-650` | `#824A42` | range、toggle、細部互動 |
| `--la-wine-550` | `#A25C56` | active 底線與 icon |
| `--la-wine-450` | `#C96961` | Keep editing 文字動作 |
| `--la-copper-600` | `#A97453` | 銅色暗部 |
| `--la-copper-400` | `#CF8F64` | 完成杯環與托盤頂緣 |
| `--la-porcelain-50` | `#EFEDED` | 最高層級文字、圖示、瓷器 |
| `--la-mist-300` | `#A6A3A1` | 標籤與次要文字 |
| `--la-mist-500` | `#6A625E` | handle、提示與低層級圖示 |

### Semantic surfaces

| Token | Material | 對應 mock |
| --- | --- | --- |
| `--la-surface-icon` | 低密度煙燻面 | Reset、Settings |
| `--la-surface-toolbar` | 深黑共用底板 | Pour／Stir／Suction |
| `--la-surface-tray` | 較暖、較密實 | 底部 Finish tray |
| `--la-surface-sheet` | 最高密度煙燻面 | Settings、Completion |
| `--la-surface-action` | 中性暖黑 | Share |
| `--la-surface-action-primary` | 深酒紅黑 | Save Image |
| `--la-surface-selected` | 低彩度酒紅 | English selected、active settings |

禁止把上述 surface 合併成單一 `glass` token。三張 mock 的層次差異正是靠透明度、暖度、背景模糊與陰影方向共同建立。

## 4. 字體系統

### Signature

- 字體：本地 `Bodoni Moda Variable`，CSS family 為 `Latte Display`。
- 用途：只用於 `LatteArt` 字標。
- 建議：weight 470、line-height 1、tracking `-0.03em`、44–76px fluid scale。
- 不用於章節標題、按鈕、數字或設定內容。

### UI

- 字體：系統無襯線，優先 `-apple-system`、`BlinkMacSystemFont`、`Segoe UI`、`Noto Sans TC`。
- Sheet title：28–40px、500、tracking `-0.015em`。
- Section title：18px、500。
- Body：16px、400、line-height 1.65。
- Label：15px、400。
- 數值使用 tabular numerals，避免滑桿操作時寬度跳動。

### 文字層級

- 主要文字與圖示：瓷白 `#EFEDED`。
- 次要操作與標籤：Café mist `#A6A3A1`。
- 不可用純白鋪滿整個介面；亮度必須保留給杯緣、字標與當前主要內容。

## 5. 空間與形狀

### Spacing

使用 4px base：`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80`。元件內部緊密，元件群之間大幅留白。手機兩側內容安全距離約 16–24px，主要卡／抽屜內距約 22–24px。

### Radius

- `14px`：Reset、Settings、工具列、語言 segmented control。
- `18px`：Save／Share 動作面。
- `22px`：Settings／Completion bottom sheet 上緣。
- `28px`：Finish tray 上緣。
- `999px`：handle、range track、toggle、thumb，以及真正的圓形機構。

矩形元件不得全部做成膠囊。杯子是唯一主導性大圓形。

### Borders

- 一般分隔：1px `rgba(239, 237, 237, 0.10–0.17)`。
- 作用中酒紅邊界：1px `rgba(162, 92, 86, 0.70)`。
- Finish／完成銅色邊界：1px `rgba(207, 143, 100, 0.68)`。
- 邊界必須保持低對比，不做厚玻璃邊、白色高光框或雙層描邊。

## 6. 深度與材質

- Compact control blur：18px。
- Toolbar blur：20px。
- Bottom sheet blur：28px。
- 控制陰影向下：`0 8px 22px rgba(0,0,0,.22)`。
- 工具列陰影向下且較寬：`0 18px 42px rgba(0,0,0,.34)`。
- Bottom sheet 陰影向上：`0 -24px 54px rgba(0,0,0,.50)`。
- 完成杯環可有 `0 12px 34px rgba(207,143,100,.20)`，但銅線仍需清楚可見。

Blur 的目的，是讓背景紋理透過不同密度的煙燻面形成材質；不可為了「玻璃感」加入亮邊、折射、彩虹、鏡面高光或漂浮泡泡。

## 7. 元件規格

### Header actions

- Reset 與 Settings 都是 48×48px，最小觸控目標不可低於 44px。
- 14px 圓角、低密度煙燻面、1px 低對比 border。
- Reset 使用較安靜的酒紅 icon；Settings 預設瓷白。
- Settings 開啟時才出現酒紅底面與酒紅邊界。
- 完成狀態不顯示 Reset，只保留 Settings。

### Three-part tool selector

- 一個共用底板切成等寬三欄，不是三張獨立卡。
- 高度約 116px，14px 圓角，欄間只用 1px hairline。
- icon 30–32px，label 15–16px，inactive 為 Café mist。
- active 欄使用低彩度酒紅漸層與底部短線；不使用實心亮紅卡。
- 順序與文字固定：`Pour / Stir / Suction`。

### Finish tray

- 固定在畫面底部，是「上托」而非一般 CTA button。
- 高度約 68–76px，加上 safe-area；上緣 28px 圓角。
- 由 drag handle、向上 chevron、`Finish` 三者垂直組成一個 touch/swipe target。
- 僅頂緣使用銅色 hairline，中央可有很淡的酒紅暖度。

### Bottom sheet

- Settings 約佔 viewport 68–72%，內容可垂直捲動。
- Completion 約佔下方 25–32%，依小螢幕可增高以避免內容擁擠。
- 上緣 22px 圓角、頂部置中 drag handle、向上陰影。
- 開啟時加深色 scrim；背景杯面仍可辨識。
- Sheet 內使用 full-width list row 與 separator，不把每一列包成 card。

### Settings controls

- Language segmented control：兩等份，English selected；selected 使用 `--la-surface-selected`。
- Range row：label / track / tabular value 三欄，互動高度 44px，track 4px，thumb 20px。
- Toggle：50×29px，thumb 21px。mock 顯示 Streamlines 為 off，off 仍保留細酒紅邊界。
- Advanced simulation 預設 collapsed，使用向下 chevron。

### Completion actions

- `Save Image` 與 `Share` 是等寬雙欄，最小高度 112px，18px 圓角。
- Save Image 使用深酒紅黑面；Share 使用中性暖黑面。
- `Keep editing` 是酒紅文字按鈕，不可做第三張卡。
- 完成畫面不顯示工具列、Reset 或觸控軌跡。

## 8. 狀態對照

| 狀態 | Header | Cup | Main controls | Bottom component |
| --- | --- | --- | --- | --- |
| Working | Reset + Settings | 可操作、可見 touch trace | 三段工具列 | Collapsed Finish tray |
| Completion | Settings only | 稍放大、銅色 halo、無 trace | 工具列隱藏 | Completion sheet + Save/Share |
| Settings | Reset + active Settings | dimmed、仍可辨識 | 背景 inert | 68–72% Settings sheet |

## 9. Motion

- 小狀態：180–260ms。
- Tool selected：260ms，active underline 由中間展開。
- Tray／sheet：520ms，使用 `cubic-bezier(0.16, 1, 0.3, 1)`。
- 完成杯面：可在 520–620ms 內微幅上移與放大，再顯示銅環。
- 支援 `prefers-reduced-motion`；降低動態時仍需保留清楚的最終狀態。

## 10. Accessibility

- 所有互動目標至少 44×44px。
- 鍵盤焦點使用 2px 暖杏色 `#EFAD82`，offset 3px；不得只靠顏色深淺表示焦點。
- Bottom sheet 開啟時移動焦點、鎖定背景互動，關閉後回到觸發元件。
- Slider、toggle、segmented control 必須有可讀 label 與狀態。
- 文字與背景需符合 WCAG 對比；次要文字不得低於可讀門檻。

## 11. 禁止事項

- 不新增 mock 中沒有的頂部 language control、badge、統計資訊或浮動卡。
- 不使用 emoji、貼紙、彩虹、霓虹、糖果色或 playful illustration。
- 不使用泡泡玻璃、厚鏡片邊、光澤膠囊或散落的 blur blobs。
- 不把設定列拆成 bento grid，也不讓 Finish 變成大型 floating button。
- 不把 Bodoni 擴張成全站 heading 字體。
- 不讓銅色成為一般 active color。
- 不以現有 CSS 的既有數值推翻本文件；若實作不符，應調整實作。

## 12. 實作與驗收

- Canonical tokens：`assets/design-tokens.css`。
- 視覺展示：`design-system.html`。
- 後續調整應逐一對照三個狀態，而非只在單一尺寸看首頁。
- 每次 UI migration 至少驗證：窄手機、一般手機、桌面，以及 Working／Completion／Settings 三個狀態。
- 先修正色階、材質層次與大比例，再修微小間距；不要用更多陰影掩蓋錯誤的 surface color。
