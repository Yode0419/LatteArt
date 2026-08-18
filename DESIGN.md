---
name: LatteArt
description: A tactile latte-art studio staged as a refined lacquer serving ritual.
colors:
  ground: "#010000"
  ground-warm: "#120e0c"
  glass: "rgba(18, 14, 12, 0.76)"
  glass-strong: "rgba(13, 9, 8, 0.9)"
  glass-soft: "rgba(54, 31, 27, 0.52)"
  wine: "#a45a52"
  wine-deep: "#381e1a"
  copper: "#b86d49"
  porcelain: "#f5f0ea"
  text: "#f5f0ea"
  text-muted: "#c9bbb4"
  hairline: "rgba(245, 240, 234, 0.16)"
  hairline-strong: "rgba(184, 109, 73, 0.48)"
  focus: "#f2b27f"
typography:
  display:
    fontFamily: '"Latte Display", Didot, "Bodoni 72", serif'
    fontSize: "clamp(2.1rem, 8vw, 3.1rem)"
    fontWeight: 470
    lineHeight: 1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif'
    fontSize: "clamp(1.5rem, 5vw, 2rem)"
    fontWeight: 500
    letterSpacing: "-0.025em"
  title:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif'
    fontSize: "1rem"
    fontWeight: 520
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif'
    fontSize: "1rem"
    fontWeight: 400
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif'
    fontSize: "0.94rem"
    fontWeight: 400
rounded:
  sm: "14px"
  md: "18px"
  sheet: "24px"
  tray: "28px"
  pill: "999px"
spacing:
  compact: "8px"
  snug: "10px"
  sm: "12px"
  control: "14px"
  md: "16px"
  section: "22px"
  generous: "24px"
  spatial: "34px"
components:
  icon-button:
    backgroundColor: "{colors.glass-soft}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    size: "48px"
  tool-selector:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
    height: "116px"
  tool-button-active:
    backgroundColor: "{colors.wine-deep}"
    textColor: "{colors.porcelain}"
    padding: "14px 8px 18px"
  finish-tray:
    backgroundColor: "{colors.glass-strong}"
    textColor: "{colors.porcelain}"
    rounded: "{rounded.tray}"
    padding: "17px 20px"
    height: "76px"
  bottom-sheet:
    backgroundColor: "{colors.glass-strong}"
    textColor: "{colors.text}"
    rounded: "{rounded.sheet}"
    padding: "12px 22px 24px"
  completion-action:
    backgroundColor: "{colors.glass-soft}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "18px 12px"
    height: "112px"
  range-thumb:
    backgroundColor: "{colors.wine}"
    rounded: "{rounded.pill}"
    size: "20px"
  toggle-control:
    backgroundColor: "{colors.wine}"
    textColor: "{colors.porcelain}"
    rounded: "{rounded.pill}"
    size: "50px"
    height: "29px"
  canvas-stage:
    backgroundColor: "{colors.porcelain}"
    rounded: "{rounded.pill}"
    width: "min(87vw, 52svh, 610px)"
---

# Design System: LatteArt

## Overview

**Creative North Star: "The Lacquer Service Tray"**

LatteArt treats the screen as a near-black oxblood lacquer tray, with the matte porcelain cup as the clear center of attention. The atmosphere is modern and intuitive with the comfortable maturity of a retro café: warm, quiet, tactile, and composed rather than nostalgic or ornamental.

Interaction follows a serving ritual. People select one of three tools, work directly on the cup, tune details only when needed, and raise the bottom tray to finish. Flat smoked-frosted controls stay subordinate to the craft; copper hairlines, restrained wine accents, and layered ambient depth provide structure without making the interface feel bubbly or flashy.

**Key Characteristics:**

- The live porcelain-and-coffee stage is the dominant visual and interactive object.
- Near-black lacquer, warm oxblood, copper, and porcelain create a mature café palette.
- Controls are flat, frosted, restrained, and comfortably touchable.
- Mobile, touch, keyboard, and reduced-motion experiences are first-class.
- Completion feels like raising a serving tray, not submitting a dashboard form.

## Colors

The palette is a low-luminance lacquer field punctuated by porcelain contrast, muted wine action color, and sparing copper warmth.

### Primary

- **Muted Oxblood:** The principal active-state color for selected tools, range thumbs, toggles, and controlled moments of emphasis.
- **Deep Wine Lacquer:** A darker companion used inside active tonal gradients and richly grounded surfaces.

### Secondary

- **Warm Copper:** A scarce ceremonial accent for strong hairlines and the completed-cup halo.
- **Apricot Focus:** The dedicated accessibility accent for visible keyboard focus and cursor indication.

### Neutral

- **Black Lacquer:** The page ground; it lets the cup and controls carry the hierarchy.
- **Warm Lacquer Ground:** The undertone for smoked surfaces and background warmth.
- **Smoked Glass:** The standard translucent control surface.
- **Dense Smoked Glass:** The more opaque surface for sheets and transient feedback.
- **Soft Oxblood Glass:** The warm translucent layer used in selected or emphasized containers.
- **Matte Porcelain:** The highest-contrast material color for the cup rim, principal text, and icons.
- **Café Mist:** The quieter text color for labels and secondary controls.
- **Porcelain Hairline:** A low-contrast boundary that separates controls without turning them into outlined boxes.
- **Copper Hairline:** A stronger, warmer boundary reserved for the serving tray and ceremonial emphasis.

### Named Rules

**The Porcelain Priority Rule.** Matte porcelain owns the brightest value; accents must not compete with the cup or primary text.

**The Copper Rarity Rule.** Copper marks ceremony, completion, or a decisive boundary. It is never a general-purpose decoration.

## Typography

**Display Font:** Latte Display, the local Bodoni Moda variable face, with Didot and Bodoni fallbacks  
**Body Font:** System sans-serif with Segoe UI and Noto Sans TC coverage

**Character:** The high-contrast Bodoni wordmark supplies café heritage in one controlled gesture. Everything operational uses a clear system sans so the simulation remains immediate, legible, and native-feeling across languages.

### Hierarchy

- **Display** (470, fluid 2.1–3.1rem, line-height 1): The wordmark only; tightly tracked and never used for controls.
- **Headline** (500, fluid 1.5–2rem): Bottom-sheet titles and completion statements.
- **Title** (520, 1rem): Settings-section and active-tool headings.
- **Body** (400, 1rem): Default interface copy and action text.
- **Label** (400, 0.94rem): Parameter names and secondary controls; compact labels may step down to 0.88–0.9rem.

### Named Rules

**The One Bodoni Gesture Rule.** Use the display face for the LatteArt signature, not as a decorative heading system.

## Layout

The application is a single centered stage capped at 920px and sized to the small viewport height so the working cup remains usable without page scrolling. The top bar is compact, the cup is centered, the three-part tool selector sits immediately below it, and the Finish control is fixed to the bottom safe area as the edge of the serving tray.

The cup scales from the tighter of viewport width and height, reaching roughly 610–620px on larger displays. Horizontal padding ranges from 14px on the narrowest screens to 48px in the header, while the main vertical gap breathes between 20px and 34px. Controls use at least 44px touch targets; the default icon target is 48px.

At 800px and above, tool choices shift from stacked icon-over-label cells to compact horizontal cells. At 390px and below, margins, labels, and range grids tighten while retaining touch target size. Short viewports below 700px reduce cup and toolbar height. Safe-area insets protect both the top bar and bottom tray.

**The Cup-First Rule.** Responsive changes protect the largest practical circular work surface before adding chrome or spacing.

## Elevation & Depth

Depth is layered and ambient, never bubbly. Tonal glass opacity, a softly vignetted lacquer ground, diffuse shadows, backdrop blur, and the physical overlap of cup, selector, tray, and sheets create hierarchy. Surfaces stay visually flat within their own planes; they do not use glossy capsules, inflated highlights, or floating candy-like blobs.

### Shadow Vocabulary

- **Control Float** (`0 8px 22px rgba(0, 0, 0, 0.18)`): A quiet lift beneath compact icon controls.
- **Toolbar Bed** (`0 16px 36px rgba(0, 0, 0, 0.26)`): Grounds the three-part selector against the lacquer.
- **Serving Edge** (`0 -14px 34px rgba(0, 0, 0, 0.34)`): Suggests the Finish tray rising from the bottom edge.
- **Sheet Lift** (`0 -22px 46px rgba(0, 0, 0, 0.46)`): Separates modal bottom sheets from the dimmed workspace.
- **Ceremonial Halo** (`0 10px 28px rgba(184, 109, 73, 0.2)`): Appears around the cup only at completion.

### Named Rules

**The Ambient Layers Rule.** Elevation comes from broad, low-contrast shadows and tonal overlap; never use bubbly specular highlights or exaggerated floating cards.

## Shapes

The system combines softly squared control planes with one dominant circle. Compact controls use gently rounded 14px corners, action containers use 18px, and bottom sheets use 24px top corners. The Finish tray is slightly broader at 28px along its raised edge. Pills and circles are reserved for handles, range tracks, toggles, indicators, and the porcelain cup itself.

Borders are one-pixel hairlines and remain subordinate to tonal fill. Full rounding communicates mechanism or material—not whimsy—so rectangular controls should not drift into bubbly capsules.

**The One Dominant Circle Rule.** The cup is the primary circle; supporting circles must be small and functional.

## Components

### Icon Button

Refined and compact, with a 48px touch target, a 14px corner, smoked translucent fill, porcelain hairline, and 23px line icon. Hover gently warms the surface; expanded state shifts toward wine. A 2px apricot outline with 3px offset is mandatory for keyboard focus.

### Three-Part Tool Selector

One shared smoked-frosted plane contains Pour, Stir, and Suction as equal cells. Hairlines separate the cells without creating three floating cards. The active tool gains porcelain text, a deep-wine tonal wash, and a short muted-wine underline; inactive tools remain café-mist neutral. On wider screens, icon and label sit in a row.

### Finish Serving Tray

The Finish action is the tactile signature. It spans the app width at the bottom safe edge, uses a copper hairline, a quiet grip, an upward cue, and a restrained lacquer gradient. Clicking or swiping upward raises the completion sheet. Its motion uses the system's expressive ease and reads as a physical serving action rather than a generic call-to-action.

### Bottom Sheets / Settings

Settings and completion content rise from the same bottom edge on dense smoked glass with 24px top corners, an ambient upward shadow, and a dim scrim. Settings may occupy up to roughly three quarters of the small viewport height and scroll internally. The background workspace becomes inert while a sheet is open; focus moves into the sheet and returns to its trigger when closed.

### Completion Actions

Save and Share form a balanced two-column pair with large 112px targets and 18px corners. The primary action uses a warm deep-wine fill; the secondary stays on a faint porcelain tint. Icons remain linear and unfilled. “Keep editing” is a quiet text action below the pair, never a competing card.

### Range and Toggle Controls

Range rows align label, track, and tabular value in a stable three-column grid. Tracks are 4px pills with a 20px muted-wine thumb inside a 44px interaction height. Toggles use a 50×29px track with a porcelain 21px thumb and shift to wine when checked. Both controls use the same apricot focus treatment as buttons.

### Canvas / Porcelain Stage

The live canvas is nested within a matte porcelain rim and a broad, blurred cup shadow. It fills 92% of its circular stage and disables browser touch gestures so direct drawing feels immediate. Touch trace and keyboard cursor appear only during relevant interaction. Completion slightly raises and scales the stage, then introduces a thin copper halo.

## Do's and Don'ts

### Do:

- **Do** keep the porcelain cup as the brightest, largest, and most immediate element.
- **Do** use shared frosted planes and hairline dividers to group related controls.
- **Do** preserve 44–48px touch targets, safe-area padding, visible focus, keyboard operation, and reduced-motion behavior.
- **Do** make motion feel like serving: short state transitions around 180–260ms and larger tray or stage transitions around 480–720ms with the expressive ease.
- **Do** use restrained line icons and concise labels; components should feel refined, tactile, and calm.

### Don't:

- **Don't** introduce childish color, emoji, playful stickers, or candy-bright accents.
- **Don't** use bubbly or flashy liquid-glass effects, glossy capsules, or excessive blur and shine.
- **Don't** scatter unrelated floating cards around the cup or turn the experience into a generic simulator dashboard.
- **Don't** overuse copper, Bodoni, or strong wine fills; their rarity preserves hierarchy.
- **Don't** reduce the canvas to make room for secondary settings when a sheet can reveal them on demand.
