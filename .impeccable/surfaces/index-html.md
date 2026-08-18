---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["assets/styles.css","src/main.js","src/interaction/controlPanel.js"]
---

## Scope and mode

- Primary surface: `index.html`
- Mode: Operate with an Experience-led completion moment.
- Mobile touch is the primary composition; desktop retains the same workflow with more breathing room.

## Audience, job, and actions

General visitors make attractive latte art without learning simulation controls first. The first screen exposes the cup and Pour, Stir, and Suction. Reset is a quiet header action. Settings opens a bottom drawer. Finishing is a bottom tray that can be tapped or swiped upward, followed by Save Image, Share, or Keep editing.

## Chosen direction

Dark lacquer café service tray with a modern, flat smoked-frosted interface. The work itself leads: a porcelain-rimmed live canvas fills the viewport while restrained glass controls recede. The memorable moment is “serving” the completed cup by raising the Finish tray.

Approved references:

- `.impeccable/mocks/latteart-working-state-v2.png`
- `.impeccable/mocks/latteart-completion-state-v2.png`
- `.impeccable/mocks/latteart-settings-drawer.png`

## Constraints

- Preserve the fluid simulation and the Pour, Stir, Suction, Reset, parameter, save, and share capabilities.
- Support Traditional Chinese and English without losing simulation state.
- No emoji. Use one consistent line-icon family and accessible text alternatives.
- Main touch targets are at least 44px. Honor reduced motion and keyboard focus.
- Keep visual effects bounded; the canvas animation remains the dominant performance cost.

## Comp inventory

| Ingredient | Approved treatment | Implementation medium |
| --- | --- | --- |
| Page ground | Near-black oxblood lacquer, sampled interior near `#010000`, with dense low-contrast tactile grain | Generated seamless raster texture over a solid token |
| Cup | Large live circular canvas with a matte porcelain rim and soft grounded shadow | Existing Canvas plus generated transparent porcelain-rim overlay |
| Tool selector | One flat smoked-frosted segmented control; 1px separators, 14px radius, subtle active wine tint and underline | Semantic buttons, CSS backdrop-filter, inline SVG icons |
| Header | Editorial LatteArt wordmark; compact Reset and Settings controls | Semantic HTML/CSS, inline SVG icons |
| Finish tray | Full-width bottom sheet lip with handle, chevron, label, tap and upward-swipe affordance | Semantic button and CSS transform transition |
| Completion state | Cup lifts and gains one copper halo; bottom sheet offers Save Image, Share, Keep editing | Existing canvas, CSS halo, semantic buttons |
| Settings drawer | One scrollable smoked-frosted sheet with language, active-tool controls, display controls, collapsed simulation section | Semantic form controls and CSS bottom sheet |
| Icons | Thin, consistent, non-emoji symbols; Suction is four arrows converging on a center | Inline SVG derived from one 24px stroke grammar |

## Sampled visual record

- Ground: `#010000` to `#120E0C`
- Smoked glass interior: `#0C0908`
- Active wine field: `#1A0D0C` with accent around `#A45A52`
- Finish tray center: `#381E1A`
- Primary text: warm porcelain `#F5F0EA`
- Copper hairline: `#B86D49`

## Unresolved decisions

None for implementation. Exact icon curves and desktop scaling may be translated for semantic, responsive code without changing their function or hierarchy.
