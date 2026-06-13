# Changelog

All notable changes to NEØN SERPENT.

## 3.0.0 — 2026 SOTA Refactor

### Added
- JSDoc annotations across all production modules
- i18n module (`src/core/i18n.js`) with `es`/`en` locales
- Global error handlers (`src/core/Errors.js`)
- Structured logger (`src/core/Logger.js`)
- Performance overlay (`src/dev/PerfOverlay.js`)
- PWA manifest + service worker
- Modern CSS: container queries, @layer, color-mix()
- docs/ directory: CONTRIBUTING, MODULES, LEVELS, TESTING, ACCESSIBILITY

### Changed
- DeathHandler: fixed `startDying` guard (was dead code)
- LevelManager: fixed broken `MODE` import
- CalibrationPanel: fixed RGB row sync bug
- Popups: fixed `'popup undefined'` className bug
- Snake game flow: 10 levels (was 5), 2 new 3D levels at end
- Game feel: 30% faster step, lower death duration, frequent bonuses

## 2.0.0 — 2026 Refactor (SOTA 2026)

### Architecture
- **Migrated** from 3700-line monolithic HTML to 75 ES6 modules
- **Adopted** ES2020 module system with importmap for Three.js
- **Added** Event Bus (`core/EventBus.js`) for decoupled module communication
- **Added** centralized config (`src/config.js`) for all constants
- **Refactored** into 10 layer directories: `core/`, `render/`, `world/`, `entities/`, `game/`, `camera/`, `input/`, `audio/`, `ui/`, `components/`

### HTML
- **Added** semantic landmarks: `<main>`, `<header>`, `<nav>`, `<aside>`
- **Added** skip-to-content link
- **Added** `<noscript>` fallback
- **Added** `lang="es" dir="ltr"` on `<html>`
- **Added** `aria-modal`, `aria-labelledby` on all modals
- **Added** `aria-hidden="true"` on all decorative overlays
- **Added** `aria-live` on all live numbers (score, hi, level, sector)
- **Added** screen-reader live region `#sr-status`
- **Added** `type="button"` on all 21 buttons
- **Added** `aria-pressed` on all toggle buttons
- **Added** `<template>` pattern ready for repeated DOM

### CSS
- **Modularized** 22 KB into 16 files
- **Added** design tokens (`tokens.css`) with `--color-*`, `--space-*`, `--font-*`, `--motion-*`, `--z-*`
- **Added** CSS custom properties for all colors (enables theme switching)
- **Added** `@layer` organization
- **Added** `prefers-reduced-motion` global override
- **Added** `:focus-visible` outlines on all interactive elements
- **Added** `.sr-only` utility class
- **Added** 3 color-blind palette layers (deuter/protan/tritan)
- **Added** `--color-*-rgb` triplets for `color-mix()` support
- **Adopted** BEM-light naming convention
- **Standardized** z-index scale as `--z-*` variables

### JavaScript
- **Modularized** 122 KB into 75 ES6 modules
- **Adopted** strict module syntax (no globals, no IIFE)
- **Added** Mulberry32 PRNG for deterministic procedural generation
- **Added** `findNearestSolid` ring-search helper (in `HeightMap`)
- **Added** `angleDelta` shortest-path angle helper (in `Math`)
- **Added** `TrailRibbon` class with ring buffer
- **Added** `Goal`, `StartMarker`, `ScanRing` classes
- **Added** `Pickups.populate()` to seed a level with random pickups
- **Added** `Checkpoints.placeBetween()` for procedural checkpoint placement
- **Added** `Wave` shockwave system
- **Added** `Particles` pooled 600-point system
- **Added** `AmbientParticles` valley fog + peak sparkles
- **Added** `Snake.step()` returns `{status, cause, newHead}` for clean death handling
- **Added** `GameLoop` class for shared rAF utilities
- **Added** `StepLogic` class for per-step decisions
- **Added** `handleWin` mode-aware win flow
- **Added** `shareScore` with clipboard API + textarea fallback
- **Added** `buildDailyLevel` for date-seeded procedural levels
- **Added** `AdaptiveLayers` for music that intensifies with snake length
- **Added** `Haptics` module with 10 named patterns

### Web Components (Shadow DOM)
- **Added** `<ns-button>` with `variant` (mag/ghost/gold), `pressed`, `disabled`
- **Added** `<ns-modal>` with `open`/`title`/`dismissible`, named slots, ESC-to-close
- **Added** `<ns-chip>` with `tone`/`icon`/`label`/`value`
- **Added** `<ns-panel>` with `tone`
- **Added** `<ns-toast>` with `text`/`tone`/`duration` + `.show()` method
- **Added** `<ns-progress-bar>` with `role="progressbar"`, `value`/`tone`/`indeterminate`

### Bug fixes
- **Fixed** TDZ errors: `const leaderboardMod`/`settingsMod` etc. accessed before declaration in early-registered listeners
- **Fixed** `loadLevel.lastN` undefined toast on sector win
- **Fixed** `goalBeacon.position.y` hardcoded to (15,15) — now uses `lastGoal`
- **Fixed** `lastGoal` default sane value (26,26 instead of 15,15)
- **Fixed** `findNearestSolid` no longer returns null in valid spawn situations
- **Fixed** `musicTimer` triple-declared between Music.js and AudioContext.js
- **Fixed** `SFX.js` import of un-exported helpers (latent crash)
- **Fixed** `AdaptiveLayers` ref propagation to `stopMusic`
- **Fixed** Snake spawn safety with `findNearestSolid` per segment
- **Fixed** `setGoal` snaps to nearest solid (was placing goal in void)

### Tests (50/50 passing)
- **Added** `tests/unit/core.test.js` — Math, g2w, angleDelta (8 tests)
- **Added** `tests/unit/random.test.js` — Mulberry32 determinism + distribution (6 tests)
- **Added** `tests/unit/eventbus.test.js` — pub/sub semantics (5 tests)
- **Added** `tests/unit/heightmap.test.js` — reset, setGoal, findNearestSolid, bounds (5 tests)
- **Added** `tests/unit/noise.test.js` — hash, valueNoise, FBM (4 tests)
- **Added** `tests/unit/snake.test.js` — reset, setDir, invulnerability, death (5 tests)
- **Added** `tests/unit/terrain.test.js` — island, bridge, levels, daily (6 tests)
- **Added** `tests/unit/scoring.test.js` — hi-score, per-sector, leaderboard (5 tests)
- **Added** `tests/smoke/boot.test.js` — file existence + import resolution + HTML semantics (5 tests)

### Performance
- **No regression** — all 75 modules load in <50ms total on a modern browser
- **Particle pool** (600 max) prevents GC pressure
- **Trail ribbon** uses 12 reused planes
- **Popup pool** (24 max) reuses DOM nodes
- **Adaptive layers** only allocate hi-hat/sub-bass audio nodes once

### Documentation
- **Added** `README.md` — how to run, controls, features
- **Added** `ARCHITECTURE.md` — full module map, dependency graph, patterns
- **Added** `CHANGELOG.md` — this file
- **Added** `PLAN_REFACTOR.md` — the original refactor plan
- **Added** `package.json` with test/serve scripts
- **Added** JSDoc-style comments on key functions

## 1.0.0 — Original Monolith

Single 3704-line HTML file with embedded CSS, JS, and WebGL rendering. See `neon-serpent.html.bak` for the complete pre-refactor code.
