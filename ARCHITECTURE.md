# NEØN SERPENT — Architecture

> Current state of the 2026 SOTA refactor: 10 hand-crafted levels,
> 75+ pure ES modules, 376 tests passing, ≈ 92 % coverage.

This document complements [MODULES.md](./docs/MODULES.md) (per-
directory deep-dive) and [LEVELS.md](./docs/LEVELS.md) (level
design). Read those next.

---

## Table of contents

- [Module dependency graph](#module-dependency-graph)
- [Layer responsibilities](#layer-responsibilities)
- [Patterns](#patterns)
- [Game state machine](#game-state-machine)
- [Event bus catalog](#event-bus-catalog)
- [Storage keys](#storage-keys)
- [Build / run](#build--run)
- [SOTA features added (2026)](#sota-features-added-2026)

---

## Module dependency graph

```
                          ┌────────────┐
                          │  main.js   │ (entry point)
                          └─────┬──────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
    ┌────▼─────┐         ┌──────▼──────┐        ┌───────▼────────┐
    │   core   │         │  web comps  │        │     config     │
    │  (8+)    │◄────────┤    (6)      ├───────►│  (constants)   │
    └────┬─────┘         └─────────────┘        └────────────────┘
         │
    ┌────┴─────────────────────────────┐
    │                                  │
 ┌──▼──────────┐                ┌──────▼─────────┐
 │   render    │                │  world (10)    │
 │  (7 mods)   │                │  noise, map,   │
 │  scene,     │                │  builders,     │
 │  camera,    │                │  visuals       │
 │  lights,    │                └──────┬─────────┘
 │  trail      │                       │
 └──┬──────────┘                ┌──────▼─────────┐
    │                           │  entities (8)  │
 ┌──▼──────────┐                │  snake, food,  │
 │  camera (2) │                │  pickups, ...  │
 │  (modes)    │                └──────┬─────────┘
 └─────────────┘                       │
                                ┌──────▼─────────┐
                                │   game (11)    │
                                │  state, step,  │
                                │  scoring, ...  │
                                └──────┬─────────┘
                                       │
                                ┌──────▼─────────┐
                                │  audio (6)     │
                                │  music, sfx,   │
                                │  haptics       │
                                └────────────────┘

              ┌────────────┐
              │  input (5) │
              │  kb, touch │
              └────────────┘
```

(Refer to [MODULES.md](./docs/MODULES.md) for the up-to-date list
of files in each layer; the counts above include the latest
additions: `WarningHighlight.js` in `game/`, the three stub files
in `tests/`, and the new `core/Errors.js`, `core/Logger.js`,
`core/i18n.js` modules.)

---

## Layer responsibilities

### `core/` — Foundation utilities
- **EventBus.js** — synchronous pub/sub, handler errors caught
- **Store.js** — `localStorage` wrapper with in-memory fallback
- **Math.js** — `clamp`, `lerp`, `damp`, `choice`, `rand`, `randi`,
  `smoothstepN`, `g2w`, `angleDelta`
- **Random.js** — Mulberry32 PRNG + seed-based helpers
- **Log.js** — leveled logger (`debug` / `info` / `warn` / `error`),
  re-exported by `Logger.js` for back-compat
- **Logger.js** — SOTA 2026 structured logger with `setReporter`,
  `setBaseContext`, `child` derivation, and a Sentry-style hook
- **Errors.js** — global `error` + `unhandledrejection` handlers,
  `safeCall` / `safeCallAsync` wrappers
- **i18n.js** — lightweight i18n with dotted keys, ICU-lite
  plurals, dynamic locale loading, persistent preference
- **sw-register.js** — PWA service-worker registration
  (no-op in Node)
- **DOM.js** — `$`, `qs`, `qsa`, `el`, `onReady`, `isTouchDevice`,
  `vibrate`
- **Assert.js** — `assert(cond, msg)` invariant helper
- **Color.js** — `COLORS` palette + `THREE.Color` helpers

### `render/` — Three.js setup
- **Renderer.js** — `WebGLRenderer` with ACES tone mapping
- **Scene.js** — Scene + `FogExp2`
- **Camera.js** — `PerspectiveCamera`
- **Lighting.js** — 4 lights (ambient + key + fill + top)
- **Background.js** — stars + nebulae + dust
- **PostFX.js** — `EffectComposer` + `UnrealBloomPass` + gamma
- **TrailRibbon.js** — 12-quad fading trail class

### `world/` — Procedural terrain
- **noise.js** — `hash2D`, `smoothstepN`, `valueNoise`, `fbm`
- **HeightMap.js** — grid data model + `isSolid`, `setGoal`,
  `computeLethality`, `findNearestSolid`
- **IslandBuilder.js** — `buildTerrainIsland`, `buildBridge`
- **LevelBuilder.js** — **10** hand-crafted levels + daily seed +
  dispatcher
- **TerrainMesh.js** — tile boxes + edges + peak cones + contour
  lines
- **WaterPlane.js** — animated water surface + abyss plate
- **AmbientParticles.js** — valley fog + peak sparkles
- **Goal.js** — beacon (octahedron + ring + point light)
- **StartMarker.js** — pulsing ring
- **ScanRing.js** — radar pulse

### `entities/` — Game objects
- **Snake.js** — pure logic (`reset`, `setDir`, `step`, `applyMove`,
  `invulnerable`)
- **SnakeView.js** — 3D segments with lean / squash / eat-pop /
  head-bob
- **Food.js** — icosahedron core + wireframe + ring
- **Pickups.js** — `orb` / `gem` / `crystal` / `slow` / `dice`
- **Checkpoints.js** — ring + octahedron markers
- **Bonus.js** — gold "data nucleus" with countdown
- **Particles.js** — pooled 600-point burst system
- **Waves.js** — expanding shockwave rings

### `game/` — Orchestration
- **GameState.js** — single-string state machine
- **GameLoop.js** — `rAF` utility class
- **StepLogic.js** — per-step decisions (food / bonus / pickups /
  checkpoints / goal)
- **Collision.js** — bounds + climb check
- **Modes.js** — `story` / `time` / `daily` (with `getTimeRemainingSec`)
- **LevelManager.js** — level loading + palette application
- **Scoring.js** — hi-score, per-sector, top-10 leaderboard
- **Countdown.js** — 3-2-1-GO with cancel token
- **DeathHandler.js** — dying state + `DIE_DUR` countdown
- **WinHandler.js** — mode-aware win
- **WarningHighlight.js** — pulses red edges on adjacent danger
  cells

### `camera/` — Camera modes
- **CameraMath.js** — `cinematicPose`, `topDownPose`, `chasePose`
- **CameraController.js** — mode cycling, damping, shake, snap

### `input/` — Input system
- **InputMapper.js** — camera-relative direction mapping
- **KeyboardInput.js** — `W`/`A`/`S`/`D` + arrows listener
- **TouchInput.js** — pointer / swipe (26 px threshold)
- **InputQueue.js** — combines KB + touch with camera mapping
- **InputBindings.js** — frozen default bindings

### `audio/` — Sound + haptics
- **AudioContext.js** — lazy-init `ctx`, master / sfx / music
  buses, combo counter
- **SFX.js** — internal `envBlip` / `envSweep` / `noiseBurst` +
  named sfx
- **Music.js** — sawtooth bass + sawtooth pad + arp
- **AdaptiveLayers.js** — hi-hat + sub-bass scaled by snake length
  + proximity to goal
- **Volume.js** — master toggle
- **Haptics.js** — 10 named `navigator.vibrate` patterns

### `ui/` — DOM UI
- **HUD.js** — score / hi / level / sector / combo / mode indicator
- **PowerUpChip.js** — speed / slow chip with progress bar
- **Countdown.js** — 3-2-1-GO overlay (Promise-based)
- **Toasts.js** — transient top-center notifications
- **Popups.js** — 3D-anchored floating numbers (pool of 24)
- **Modal.js** — base show / hide / toggle / isOpen
- **TitleScreen.js** — title + touch hint
- **PauseModal.js** — pause
- **GameOverModal.js** — final score + death cause
- **LeaderboardModal.js** — top 10
- **SettingsModal.js** — audio / CB / RM / slow toggles +
  clearAllData
- **LevelSelectModal.js** — 5×2 grid + digit shortcuts
- **CalibrationStore.js** — versioned singleton store
- **CalibrationPanel.js** — right-side slide-in panel
- **Share.js** — clipboard API + textarea fallback

### `components/` — Web Components (Shadow DOM)
- **ns-button.js** — `variant` / `pressed` / `disabled`
- **ns-modal.js** — `open` / `title` / `dismissible` + named slots
- **ns-chip.js** — `tone` / `icon` / `label` / `value`
- **ns-panel.js** — `tone`
- **ns-toast.js** — `text` / `tone` / `duration` + `.show()`
- **ns-progress-bar.js** — `role="progressbar"` + `value` / `tone` /
  `indeterminate`

### `dev/` — Development tools (opt-in)
- **PerfOverlay.js** — bottom-right FPS / frame-time / draw-call /
  heap overlay; toggled with <kbd>`</kbd> (backtick)

### `locales/` — i18n catalogs
- **es.json** — Spanish (default; the only one rendered to the UI
  today)
- **en.json** — English catalog (string extraction tracked)

---

## Patterns

### Event flow
- Modules emit on the `EventBus` for state changes.
- UI subscribes to game events and updates DOM.
- Game logic does not know about DOM.

### Game state
- `GameState.js` holds a single state string from the `STATE` enum
  in `src/config.js`.
- A `Set` of listeners is notified on transition; `setState()`
  also emits `EVT.STATE_CHANGE`.
- `getState()` is the source of truth.

### Persistence
- `core/Store.js` wraps `localStorage` with an in-memory `Map`
  fallback for private mode / sandboxed iframes.
- All keys are namespaced with the `ns_` prefix to avoid
  collisions.
- `clearAll()` purges only `ns_*` keys.

### Build
- No bundler required (native ES modules + `<script
  type="importmap">` for Three.js).
- Dev: `serve.sh` (Python 3 `http.server` on port 8765 by default).
- PWA: `manifest.webmanifest` + `sw.js` (cache-first).

---

## Game state machine

```
                     ┌──────────┐
                     │ LOADING  │   initial; pre-init
                     └────┬─────┘
                          │ init() completes
                          ▼
                     ┌──────────┐
       ┌─────────────│  TITLE   │◄──────────────────┐
       │             └────┬─────┘                   │
       │                  │ startGame / jumpToLevel │
       │                  ▼                         │
       │             ┌──────────┐                   │
       │      ┌──────│COUNTDOWN │ (3-2-1-GO)        │
       │      │      └────┬─────┘                   │
       │      │  cancel   │                         │
       │      │           ▼                         │
       │  death startDying  start                   │
       │      │     ┌─────▼──────┐                  │
       │      │     │  PLAYING   │── pause ──┐      │
       │      │     └─────┬──────┘           ▼      │
       │      │           │  win       ┌──────────┐ │
       │      │           │ goal       │  PAUSED  │ │
       │      │           ▼            └────┬─────┘ │
       │      │      ┌──────────┐           │ resume│
       │      │      │   WIN    │           └───┬───┘ │
       │      │      └────┬─────┘               │     │
       │      │           │ auto-advance        │     │
       │      │           ▼                     │     │
       │      │      (PLAYING) ─────────────────┘     │
       │      │                                         │
       │      ▼                                         │
       │   ┌──────────┐                                 │
       └────│  DYING   │ DIE_DUR timeout                 │
           └────┬─────┘                                 │
                ▼                                       │
           ┌──────────┐                                 │
           │   OVER   │── restart ────► (PLAYING) ──────┘
           └────┬─────┘                       (back to PLAYING)
                │ restart/overTitle
                └──────────────────────────► TITLE
```

Notes:

- `WIN` is transient (1.5 s), used for the "sector cleared" beat
  before auto-loading the next level in Story mode.
- `DYING` is transient (`DIE_DUR` from `config.js`); on timeout
  we transition to `OVER` and show the Game-Over modal.
- `TIME` and `DAILY` modes skip `WIN` and jump straight to `OVER`
  on goal (see `handleWin` in `game/WinHandler.js`).
- `COUNTDOWN` is cancellable: the cancel token (`countdownToken`)
  in `game/Countdown.js` is incremented on every new countdown,
  invalidating in-flight steps.

---

## Event bus catalog

All event names live in the `EVT` object in `src/config.js` and
are emitted by `core/EventBus.emit(event, payload)`.

| Event             | Emitted by                  | Payload          | Subscribed by                                |
| ----------------- | --------------------------- | ---------------- | -------------------------------------------- |
| `app:ready`       | `main.js`                   | (none)           | (reserved)                                   |
| `state:change`    | `GameState.setState()`      | state string     | UI / game flow                                |
| `score:change`    | `StepLogic.step()`          | new score        | `HUD.setScore`                               |
| `level:up`        | `StepLogic.step()`          | new level (1-10) | `HUD.setLevel` + `updateLvlBar`              |
| `food:eaten`      | `StepLogic.step()`          | (none)           | (hook for future)                            |
| `bonus:spawn`     | `StepLogic.step()`          | (none)           | (hook for future)                            |
| `bonus:clear`     | (UI clears state)           | (none)           | clears bonus chip                            |
| `goal:reached`    | `StepLogic.step()`          | (none)           | `winLevelNow`                                |
| `dying`           | `DeathHandler.startDying()` | `{ cause }`      | shake + show game over                       |
| `game:over`       | `Modes.checkTimeUp()`       | `{ mode }`       | time-attack timeout                          |
| `pause`           | (reserved)                  | (none)           |                                              |
| `resume`          | (reserved)                  | (none)           |                                              |
| `camera:change`   | (reserved)                  | mode name        |                                              |
| `audio:toggle`    | (reserved)                  | on / off         |                                              |
| `cb:change`       | (reserved)                  | mode             |                                              |
| `rm:change`       | (reserved)                  | on / off         |                                              |
| `slow:change`     | (reserved)                  | on / off         |                                              |

Handler exceptions are caught by `EventBus.emit` and reported via
`console.error('[EventBus]', event, err)`, so one bad listener
cannot break the rest of the bus.

---

## Storage keys

All `localStorage` keys are namespaced with `ns_` (set by
`core/Store.js`).

| Constant in `config.js` | Storage key      | Type   | Default |
| ----------------------- | ---------------- | ------ | ------- |
| `STORAGE.HI`            | `ns_hi`          | number | `0`     |
| `STORAGE.AUDIO`         | `ns_audio`       | bool   | `true`  |
| `STORAGE.BEST_BY_SECTOR`| `ns_bestBySector`| array  | `[0,0,0,0,0]` |
| `STORAGE.LEADERBOARD`   | `ns_leaderboard` | array  | `[]`    |
| `STORAGE.COLOR_BLIND`   | `ns_colorBlind`  | string | `'off'` |
| `STORAGE.REDUCED_MOTION`| `ns_reducedMotion` | bool | `false` |
| `STORAGE.SLOW_MODE`     | `ns_slowMode`    | bool   | `false` |

Plus a separate versioned key for the calibration store:

| Storage key | Type   | Schema       |
| ----------- | ------ | ------------ |
| `ns:calib`  | object | `v2` (see `core/CalibrationStore.js` for the full shape) |

`Store.clearAll()` removes every `ns_*` and `ns:*` key.

---

## Build / run

There is **no build step**. The browser does all the work.

```bash
# 1. Start the dev server
./serve.sh                    # python3 -m http.server 8765

# 2. Open the game
open http://localhost:8765/

# 3. Run the test suite
node --test tests/
```

The HTML entry (`index.html`) loads `src/main.js` as a native ES
module, which in turn imports every other module. Three.js is
fetched from `unpkg` via an importmap:

```html
<script type="importmap">
  {
    "imports": {
      "three":          "https://unpkg.com/three@0.149.0/build/three.module.js",
      "three/addons/":  "https://unpkg.com/three@0.149.0/examples/jsm/"
    }
  }
</script>
```

The first load needs internet; the service worker (`sw.js`) caches
the result so subsequent loads are offline-friendly.

---

## SOTA features added (2026)

### 3.0.0 — SOTA polish (current)
- JSDoc on every production module
- i18n scaffolding (`src/core/i18n.js` + `src/locales/`)
- Global error handlers (`src/core/Errors.js`)
- Structured logger (`src/core/Logger.js`)
- Performance overlay (`src/dev/PerfOverlay.js`)
- PWA manifest + service worker
- Modern CSS: container queries, `@layer`, `color-mix()`
- 10-level campaign (5 new levels: 3 classic simplification +
  3 3D multi-platform)
- Calibration panel with full RGB controls
- Level-select modal with digit shortcuts
- Game-feel tuning: 30 % faster step, lower `DIE_DUR`, frequent
  bonuses

### 2.0.0 — Original SOTA refactor

#### HTML
- Semantic landmarks: `<main>`, `<header>`, `<nav>`, `<aside>`
- Skip-to-content link
- `<noscript>` fallback
- `lang="es" dir="ltr"` on `<html>`
- `aria-modal`, `aria-labelledby` on every modal
- `aria-hidden="true"` on every decorative overlay
- `aria-live` on every live number
- Screen-reader live region `#sr-status`
- `type="button"` on every button
- `aria-pressed` on every toggle

#### CSS
- Modularized 22 KB into 16 files
- Design tokens (`tokens.css`) with `--color-*`, `--space-*`,
  `--font-*`, `--motion-*`, `--z-*`
- CSS custom properties for all colors (enables theme switching)
- `@layer` organization
- `prefers-reduced-motion` global override
- `:focus-visible` outlines on every interactive element
- `.sr-only` utility class
- 3 color-blind palette layers
- `--color-*-rgb` triplets for `color-mix()` support
- BEM-light naming convention
- Standardized z-index scale

#### JavaScript
- 75+ ES6 modules (no globals, no IIFE)
- Mulberry32 PRNG for deterministic procedural generation
- `findNearestSolid` ring-search helper
- `angleDelta` shortest-path angle helper
- `TrailRibbon` class with ring buffer
- `Goal`, `StartMarker`, `ScanRing` classes
- `Pickups.populate()` for random pickup seeding
- `Checkpoints.placeBetween()` for procedural placement
- `Wave` shockwave system
- `Particles` pooled 600-point system
- `AmbientParticles` valley fog + peak sparkles
- `Snake.step()` returns `{ status, cause, newHead }`
- `GameLoop` rAF utility
- `StepLogic` per-step decisions
- `handleWin` mode-aware win flow
- `shareScore` with clipboard API + textarea fallback
- `buildDailyLevel` for date-seeded procedural levels
- `AdaptiveLayers` for length-scaled music
- `Haptics` with 10 named patterns

#### Web Components (Shadow DOM)
- `<ns-button>`, `<ns-modal>`, `<ns-chip>`, `<ns-panel>`,
  `<ns-toast>`, `<ns-progress-bar>`

#### Bug fixes
- TDZ errors: `const leaderboardMod` / `settingsMod` etc.
  accessed before declaration
- `loadLevel.lastN` undefined toast on sector win
- `goalBeacon.position.y` hardcoded to (15, 15) — now uses
  `lastGoal`
- `lastGoal` default sane value (26, 26 instead of 15, 15)
- `findNearestSolid` no longer returns `null` in valid spawn
  situations
- `musicTimer` triple-declared between `Music.js` and
  `AudioContext.js`
- `SFX.js` import of un-exported helpers (latent crash)
- `AdaptiveLayers` ref propagation to `stopMusic`
- Snake spawn safety with `findNearestSolid` per segment
- `setGoal` snaps to nearest solid
- **`startDying` guard** no longer dead code
- **LevelManager** no longer references un-imported `MODE`
- **CalibrationPanel** RGB rows sync correctly
- **Popups** no longer writes the literal class `"popup undefined"`
