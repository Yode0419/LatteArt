# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LatteArt is an immersive, mobile-first latte art simulator built with vanilla JavaScript, ES modules and WebGL — no build step, no dependencies (no three.js). A cup is served onto the table; the user paints with milk like a canvas (foam appears immediately, no fill limit), cuts through with a thin stream (Sink) or details with a needle (Etch), then pulls up to serve: a gold halo draws around the rim and a gold-framed cup card appears (no scoring). The cup is ray-traced in 3D and tilts with the mouse (desktop) or gyroscope (mobile), sloshing the liquid. UI copy is bilingual (Traditional Chinese / English) in a warm barista voice.

See `docs/ARCHITECTURE.md` for the module map, phase flow and simulation model.

## Development

1. Serve the repo root with any static server (e.g. `python3 -m http.server`).
2. Open `index.html` for the app, `design-system.html` for the design system showcase.
3. Web Share needs HTTPS; elsewhere sharing falls back to a download.
4. The barista demo is opt-in: Settings → "Watch the barista".

## Architecture at a glance

- `src/main.js` — bootstrap, phase state machine (`body[data-phase]`: intro → serving → play ⇄ finish; demo/handoff only from Settings), main loop.
- `src/session.js` — one cup's simulation state (fluid, visual fill level, tools, slosh input). No DOM.
- `src/fluid/` — physics. `fluidCore.js` is a MAC-grid incompressible solver (red-black SOR) with three scalar layers: `foam`, `tint`, `crema`. Tools (`pouring.js`, `sink.js`, `etch.js`) share `begin/move/end/step(dt)`.
- `src/render/` — `geometry.js` holds the 3D cup/camera/tilt math shared by JS and GLSL; `shaders.js` ray-traces rim, inner wall, body, liquid and table shadow; `latteRenderer.js` uploads fields and maps canvas ↔ sim through the tilted liquid plane.
- `src/interaction/` — `pointer.js` (input → sim coords), `tilt.js` (mouse/gyro tilt + liquid spring slosh).
- `src/story/` — opt-in barista demo (drives the real simulation per sim step) and contextual hints.
- `src/analysis/pattern.js` — pattern detection for the card title (heart / tulip / rosetta / monk's head / freeform). No scoring.
- `src/ui/` — DOM-only components (sheets, toolbar, settings, finish card, serve pull tab, gold halo, cursor, toast).
- `src/i18n.js`, `src/storage.js` — strings and safe localStorage.

## Design system

- `assets/tokens.css` is the single source of design values (primitive → semantic → component tokens). `assets/styles.css` must only reference tokens.
- Visual rules: the coffee is the hero; UI stays dark and low-contrast. Shadows and dark areas are always warm brown — never pure black or neutral grey (it reads as dirty). No noisy blotches on the liquid surface.
- Gold (`--gold-*`, `--gradient-gold`) is reserved for the serve moment: halo, card frame, primary save action, pull tab.
- Copy: short, warm barista tone; every hint says what is happening or what to do next.

## Notes

- Simulation coordinates are 0–1 with y up and the cup centered at (0.5, 0.5). Canvas ↔ sim mapping must go through `render/geometry.js` (the cup tilts).
- Keep the per-step simulation cost low (≈7 ms at resolution 128); the pressure solve iterates over a precomputed fluid-cell list.
- `PERFORMANCE_OPTIMIZATION.md` describes the previous (pre-rewrite) solver and is kept for reference only.
