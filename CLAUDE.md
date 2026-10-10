# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LatteArt is an immersive, mobile-first latte art simulator built with vanilla JavaScript, ES modules and WebGL — no build step, no dependencies. The user pulls an espresso, pours milk (high pour mixes, low pour floats foam), cuts through with a thin stream (Sink) or details with a needle (Etch), then gets a "tasting" score and a shareable cup card. UI copy is bilingual (Traditional Chinese / English) in a warm barista voice.

See `docs/ARCHITECTURE.md` for the module map, phase flow and simulation model.

## Development

1. Serve the repo root with any static server (e.g. `python3 -m http.server`).
2. Open `index.html` for the app, `design-system.html` for the design system showcase.
3. Web Share needs HTTPS; elsewhere sharing falls back to a download.
4. Clear `localStorage` keys prefixed `latteart.` to see the first-visit demo again (or use Settings → "Watch the barista again").

## Architecture at a glance

- `src/main.js` — bootstrap, phase state machine (`body[data-phase]`: intro → demo → handoff → play ⇄ finish), main loop.
- `src/session.js` — one cup's simulation state (fluid, fill level, tools, extraction). No DOM.
- `src/fluid/` — physics. `fluidCore.js` is a MAC-grid incompressible solver with three scalar layers: `foam` (white surface foam), `tint` (milk mixed under the crema), `crema`. Tools (`pouring.js`, `sink.js`, `etch.js`) share `begin/move/end/step(dt)`.
- `src/render/` — `shaders.js` draws the liquid and porcelain cup in one fragment shader; `latteRenderer.js` uploads fields as an RGBA8 texture and owns canvas ↔ sim coordinate mapping.
- `src/story/` — first-visit barista demo (drives the real simulation, advanced per sim step) and contextual hints.
- `src/analysis/tasting.js` — pattern detection (heart / tulip / rosetta / monk's head / freeform) and four metrics.
- `src/ui/` — DOM-only components (sheets, toolbar, settings, finish sheet, cursor, toast).
- `src/i18n.js`, `src/storage.js` — strings and safe localStorage.

## Design system

- `assets/tokens.css` is the single source of design values (primitive → semantic → component tokens). `assets/styles.css` must only reference tokens.
- Visual rules: the coffee is the hero; UI stays dark and low-contrast. Shadows and dark areas are always warm brown — never pure black or neutral grey (it reads as dirty). No noisy blotches on the liquid surface.
- Copy: short, warm barista tone; every hint says what is happening or what to do next.

## Notes

- Simulation coordinates are 0–1 with y up and the cup centered at (0.5, 0.5).
- Keep the per-step simulation cost low (≈7 ms at resolution 128); the pressure solve iterates over a precomputed fluid-cell list.
- `PERFORMANCE_OPTIMIZATION.md` describes the previous (pre-rewrite) solver and is kept for reference only.
