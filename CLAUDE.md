# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LatteArt is a web-based coffee latte art simulator built with vanilla JavaScript and HTML5 Canvas. The application simulates fluid dynamics to create realistic milk pouring, stirring, and suction effects in a coffee cup visualization.

## Development Commands

This is a client-side only application with no build process. To develop:

1. **Serve the application**: Use any static web server (e.g., `python -m http.server` or VS Code Live Server extension)
2. **Access the app**: Open `index.html` in a web browser
3. **Test sharing**: The share feature requires HTTPS to work properly with the Web Share API

## Architecture

### Core Components

- **main.js**: Entry point that orchestrates the simulation, handles UI events, and manages the animation loop
- **src/fluid/fluidCore.js**: Core fluid dynamics simulation engine with incompressible flow solver
- **src/render.js**: Canvas rendering system that visualizes fluid density and streamlines
- **src/config.js**: Central configuration for simulation parameters and display settings

### Simulation Modules

- **src/fluid/pouring.js**: MilkInjector class for adding milk density to the simulation
- **src/fluid/stir.js**: StirringSimulator for creating rotational flow patterns
- **src/fluid/suction.js**: SuctionSimulator for removing fluid density
- **src/fluid/densityField.js**: Manages multiple density layers for different substances

### Interaction System

- **src/interaction/interaction.js**: FluidInteraction class that handles mouse/touch input
- **src/interaction/controlPanel.js**: Controls class for parameter adjustment UI
- **src/interaction/inputHandler.js**: Input handling utilities

## Key Technical Details

### Simulation Modes
The application supports three interaction modes controlled by `SIMULATION_MODES`:
- `POURING`: Inject milk density into the fluid
- `STIRRING`: Create rotational motion patterns
- `SUCTION`: Remove fluid density for latte art effects

### Fluid Physics
- Uses finite difference method for fluid simulation
- Implements incompressible Navier-Stokes equations
- Supports viscosity adjustment (0.9-1.0 range)
- Circular boundary constraints for coffee cup shape

### Rendering System
- Real-time density field visualization with color blending
- Background coffee color (#C66621) mixed with milk color (#FFFCF5)
- Optional streamline visualization for flow field debugging
- Canvas-based pixel manipulation for performance

### Share Feature
Uses html2canvas library to capture the canvas container (including decorative borders) and either:
- Native Web Share API for mobile devices
- Automatic download for desktop browsers

## Configuration

All simulation parameters are centralized in `src/config.js`:
- Fluid properties (density, viscosity, gravity)
- Display settings (resolution, streamlines)
- Interaction modes and their parameters
- Debug flags

## Development Notes

- No external build tools or package managers
- Uses ES6 modules with `type="module"`
- Canvas operations are performance-optimized with ImageData manipulation
- Touch and mouse events are unified through the interaction system
- Parameter changes trigger real-time simulation updates