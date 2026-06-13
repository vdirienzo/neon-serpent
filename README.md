# NEØN SERPENT

> A 3D snake game with synthwave/neon aesthetics, WebGL2 rendering,
> adaptive audio, three game modes, and full keyboard / touch /
> accessibility support.

NEØN SERPENT is a single-page browser game. It is **pure ES modules
with no build step**: open `index.html` over HTTP and play. There
is no `npm install`, no bundler, no transpiler.

The codebase is a 2026 SOTA refactor of an original 3 700-line
monolithic HTML file into **75+ focused modules**, a modular CSS
architecture, a small set of Web Components, and a 376-test suite
with ≈ 92 % coverage of `src/`.

---

## Quick start (30 seconds)

```bash
# 1. Clone (or download) the project
cd opensake

# 2. Start the dev server (Python's built-in http.server is enough)
./serve.sh
# → http://localhost:8765/

# 3. Play. That's it.
```

> The game **must** be served over HTTP. `file://` URLs do not work
> for ES module imports. Any static server works (`python3 -m
> http.server`, `npx serve`, `caddy file-server`, …).

### Run the tests

```bash
node --test tests/
```

That's the whole test command. The runner is built into Node 18+.

---

## Controls

### Movement (camera-relative)

| Key               | Action         |
| ----------------- | -------------- |
| `W` / `ArrowUp`   | Forward        |
| `S` / `ArrowDown` | Backward       |
| `A` / `ArrowLeft` | Strafe left    |
| `D` / `ArrowRight`| Strafe right   |

> Directions are remapped to the **current camera basis**, so
> "forward" always means "into the screen" regardless of camera
> mode.

### Game flow

| Key                          | Action                                       |
| ---------------------------- | -------------------------------------------- |
| `P` / `Enter` / `Space`      | Pause / Start / Restart (state-dependent)    |
| `Esc`                        | Back to title (or close any open modal)      |

### Camera, audio, calibration

| Key  | Action                                            |
| ---- | ------------------------------------------------- |
| `C`  | Cycle camera (CINEMÁTICA → CENITAL → PERSECUCIÓN) |
| `M`  | Toggle audio on / off                            |
| `L`  | Open / close the **Calibration panel** (3D + CSS) |
| `O`  | Open / close the **Settings modal**              |

### Level select

| Key      | Action                                                       |
| -------- | ------------------------------------------------------------ |
| `J`      | Open the **Level Select** modal (5×2 grid)                   |
| `1` – `9` | Jump directly to level N                                     |
| `0`      | Jump directly to level 10                                    |

### Touch

Swipe in any direction (≥ 26 px) to steer. The first time you load
the game on a touch device, a hint is shown for ~3.5 s.

See [docs/ACCESSIBILITY.md](./docs/ACCESSIBILITY.md) for the full
a11y contract: focus management, reduced motion, color-blind
palettes, and screen-reader announcements.

---

## Features

- **10 hand-crafted levels** with three difficulty phases
  (EASY → MEDIUM → HARD → 3D). See
  [docs/LEVELS.md](./docs/LEVELS.md).
- **Procedural terrain** with FBM noise — islands, bridges,
  spiral staircases, and stacked 3D platforms.
- **3 camera modes**: cinematic (orbiting), top-down, and chase
  (shoulder cam). Damped blending between modes, with screen
  shake on death.
- **Adaptive music** — sawtooth bass + pad + arp loop, with
  hi-hat and sub-bass layers that fade in as the snake grows.
- **3 game modes**:
  - **HISTORIA** — play through all 10 sectors with infinite
    continuation after the 10th.
  - **TIME ATTACK** — score as much as you can in 60 s.
  - **DAILY SEED** — one procedurally generated level per day
    (`YYYYMMDD` seed), the same for every player worldwide.
- **3D platforms** with multi-floor climbs (levels 8–10).
- **Pickups**: `orb` (10), `gem` (50), `crystal` (speed 6 s, 25),
  `slow` (slow-mo 4 s, 20), `dice` (200 + skip to next level).
- **Bonus nucleus** — gold multi-collect orb that spawns every 4
  food pickups.
- **Calibration panel** — runtime-tunable lighting, tone mapping,
  fog, CRT overlay, vignette, pixel ratio, snake emissive, water
  opacity. Persisted in `localStorage`.
- **Color-blind modes** (deuteranopia, protanopia, tritanopia)
  via CSS custom-property swap.
- **Reduced motion** — globally disables glitch / pop / shake
  animations; gated from both CSS (`@media`) and JS
  (`Haptics.setReducedMotion`).
- **Slow mode (0.7×)** — global difficulty assist.
- **Haptics** — 10 named vibration patterns on touch devices.
- **Leaderboard** — top 10 scores + per-sector bests.
- **Share** — clipboard API with `document.execCommand('copy')`
  fallback.
- **Web Components** — Shadow-DOM `<ns-button>`, `<ns-modal>`,
  `<ns-chip>`, `<ns-panel>`, `<ns-toast>`, `<ns-progress-bar>`.
- **CSS architecture** — tokens, `@layer`, `color-mix()`,
  container queries, BEM-light.
- **PWA** — `manifest.webmanifest` + `sw.js` service worker for
  offline play.
- **i18n-ready** — Spanish UI today, English locale scaffolded for
  the next drop.

---

## Tech stack

| Concern        | Choice                                                  |
| -------------- | ------------------------------------------------------- |
| Language       | JavaScript (ES2020 modules, no transpiler)              |
| 3D             | Three.js `r149` via importmap (unpkg)                   |
| Post-fx        | `EffectComposer` + `UnrealBloomPass` + `GammaCorrectionShader` |
| Audio          | Native Web Audio (synth + busses)                       |
| Haptics        | `navigator.vibrate`                                     |
| Persistence    | `localStorage` (with in-memory fallback)                |
| CSS            | Native, no preprocessor — `@layer`, custom properties, `color-mix()` |
| Tests          | `node:test` (built into Node 18+) + a tiny in-house DOM mock + a Three.js stub |
| Coverage       | `c8` (V8 inspector, optional install)                  |
| Dev server     | `python3 -m http.server` (the bundled `serve.sh`)       |
| PWA            | `manifest.webmanifest` + `sw.js`                        |

### Why no bundler?

The 2026 refactor **deliberately** dropped the toolchain. ES
modules + importmap cover all the cases that previously required
Webpack / Vite / esbuild, and the codebase is small enough that
the per-module HTTP request is fine. The trade-off is no TS and
no JSX; the win is "open in 5 seconds, no `node_modules`".

---

## Project layout

```
opensake/
├── index.html              # Entry: importmap + module script
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # Service worker (cache-first)
├── serve.sh                # python3 -m http.server wrapper
├── package.json            # Scripts + metadata (no deps)
├── src/
│   ├── main.js             # Bootstrap
│   ├── config.js           # Frozen constants (GRID, palette, EVT, …)
│   ├── core/               # Foundation (math, store, event-bus, …)
│   ├── render/             # Three.js setup
│   ├── world/              # Heightmap, noise, level builders
│   ├── entities/           # Snake, food, bonus, pickups, …
│   ├── game/               # State machine, step logic, scoring
│   ├── camera/             # 3 camera modes + controller
│   ├── input/              # Keyboard, touch, camera-relative mapping
│   ├── audio/              # Web Audio synthwave + SFX + haptics
│   ├── components/         # Shadow-DOM Web Components (ns-button, …)
│   ├── ui/                 # HUD, modals, calibration, level select
│   └── styles/             # Modular CSS (tokens, base, layout, fx, …)
├── tests/                  # node:test suite
│   ├── unit/  unit/extra/  # Pure logic
│   ├── dom/                # UI logic with the DOM mock
│   ├── three/              # Three.js with the WebGL stub
│   ├── integration/        # Cross-module flows
│   └── smoke/              # File existence + import resolution
└── docs/
    ├── CONTRIBUTING.md     # Dev setup, code style, PR process
    ├── MODULES.md          # One-paragraph per directory + exports
    ├── LEVELS.md           # 10 levels, palettes, how to add one
    ├── TESTING.md          # Test pyramid, mock patterns, coverage
    └── ACCESSIBILITY.md    # Keyboard map, ARIA, screen reader
```

---

## Testing

```bash
# Whole suite (CI)
node --test tests/

# Explicit grouping (faster feedback in dev)
node --test \
  tests/unit/*.test.js \
  tests/unit/extra/*.test.js \
  tests/integration/*.test.js \
  tests/dom/*.test.js \
  tests/three/*.test.js \
  tests/smoke/*.test.js

# One file
node --test tests/unit/terrain.test.js

# One test by name
node --test --test-name-pattern="buildLevel1" tests/unit/terrain.test.js
```

Coverage (optional):

```bash
npm i -g c8
c8 --reporter=text --reporter=html node --test tests/
open coverage/index.html
```

Current state: **376 tests passing**, **≈ 92 %** coverage of
`src/`. See [docs/TESTING.md](./docs/TESTING.md) for the full
strategy, mock patterns, and per-directory targets.

---

## Documentation

| File                                       | Topic                                  |
| ------------------------------------------ | -------------------------------------- |
| [README.md](./README.md)                   | This file — quick start + features     |
| [ARCHITECTURE.md](./ARCHITECTURE.md)       | Module map, state machine, event bus   |
| [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Dev setup, code style, PR process  |
| [docs/MODULES.md](./docs/MODULES.md)       | Per-directory deep dive + exports      |
| [docs/LEVELS.md](./docs/LEVELS.md)         | 10 levels, palettes, how to add one    |
| [docs/TESTING.md](./docs/TESTING.md)       | Test pyramid, mock patterns, coverage  |
| [docs/ACCESSIBILITY.md](./docs/ACCESSIBILITY.md) | Keyboard, ARIA, a11y contract  |
| [CHANGELOG.md](./CHANGELOG.md)             | Per-version history (2.0.0, 3.0.0)     |

---

## Contributing

We welcome PRs. The non-negotiables:

1. **Run `node --test tests/`** before pushing. The suite must
   pass.
2. **Add tests for new logic.** See
   [docs/TESTING.md](./docs/TESTING.md) for the pattern.
3. **JSDoc every new public symbol** — `@param`, `@returns`, and
   an `@example` when the call site isn't obvious.
4. **Update the relevant `docs/` file** when you add a module, a
   level, a control, or an accessibility-relevant change.
5. **No `console.log`** in production code. Use `log` from
   `core/Log.js` (level-gated) or remove the line.

Read [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) for the
commit-message format, the module-ownership map, and the PR
checklist.

---

## License

MIT. See `LICENSE` (when present) or rely on the standard MIT
terms. The original monolith (`neon-serpent.html.bak`) is kept for
historical comparison and is not part of the active codebase.
