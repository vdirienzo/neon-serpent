# NEØN SERPENT — Module Reference

> One-paragraph orientation for every directory in `src/`, plus the
> key exports and the dependencies between layers.

This document complements [ARCHITECTURE.md](../ARCHITECTURE.md) by
going **one level deeper**: instead of the full module map, it tells
you what each directory is for, what lives there, and what it can
import from.

## Table of contents

- [Layered model](#layered-model)
- [Layer cheat sheet](#layer-cheat-sheet)
- [core/ — Foundation utilities](#core--foundation-utilities)
- [render/ — Three.js setup](#render--threejs-setup)
- [world/ — Procedural terrain](#world--procedural-terrain)
- [entities/ — Game objects](#entities--game-objects)
- [game/ — Orchestration](#game--orchestration)
- [camera/ — Camera modes](#camera--camera-modes)
- [input/ — Input system](#input--input-system)
- [audio/ — Sound + haptics](#audio--sound--haptics)
- [ui/ — DOM UI](#ui--dom-ui)
- [components/ — Web Components](#components--web-components)
- [dev/ — Development tools](#dev--development-tools)
- [locales/ — i18n catalogs](#locales--i18n-catalogs)
- [styles/ — CSS](#styles--css)
- [Cross-layer rules](#cross-layer-rules)

---

## Layered model

NEØN SERPENT uses a strict, low-to-high dependency model. Lower layers
**must not** import from higher layers:

```
                       main.js
                          │
   ┌──────────┬───────────┼───────────┬──────────────┐
   ▼          ▼           ▼           ▼              ▼
 core  →   render  →   world  →   entities  →   game
   │          │           │           │              │
   │          │           │           │              ▼
   │          │           │           │           camera
   │          │           │           │              │
   │          │           │           │              ▼
   └──────────┴───────────┴───────────┴──────────→  input
                          │
                          ▼
                       audio
                          │
                          ▼
                        ui  ←── components
                          │
                          ▼
                      styles
```

`main.js` is the only place where everything wires together. A test
file can pull from any single layer without instantiating the rest.

---

## Layer cheat sheet

| Layer       | Purpose                                      | Typical file count |
| ----------- | -------------------------------------------- | ------------------ |
| `core/`     | Pure utilities (no DOM, no Three.js)         | 11                 |
| `render/`   | WebGL renderer, scene, lights, post-fx       | 7                  |
| `world/`    | Heightmap + noise + level builders           | 9                  |
| `entities/` | Snake, food, bonus, pickups, particles, …    | 8                  |
| `game/`     | State machine, step logic, scoring, modes    | 11                 |
| `camera/`   | 3 camera modes + controller                  | 2                  |
| `input/`    | Keyboard, touch, camera-relative mapping     | 5                  |
| `audio/`    | Web Audio synth + SFX + haptics              | 6                  |
| `ui/`       | HUD, modals, toasts, popups, calibration     | 15                 |
| `components/` | Shadow-DOM Web Components (ns-*)           | 6                  |
| `dev/`      | Opt-in development tools                     | 1                  |
| `locales/`  | i18n JSON catalogs                           | 2                  |
| `styles/`   | Tokens, base, layout, components, fx         | ~16                |

---

## core/ — Foundation utilities

**What it is:** the bedrock of the project. Every other layer is
allowed to depend on `core/`, and `core/` is allowed to depend on
nothing except `config.js`.

**Why it matters:** keeping these modules pure (no DOM, no Three.js)
makes them trivially testable and reusable from Node.

**Key exports:**

| File                | Exports                                                  | Notes                                                  |
| ------------------- | -------------------------------------------------------- | ------------------------------------------------------ |
| `EventBus.js`       | `on`, `off`, `emit`, `clear`                             | Synchronous pub/sub, handler errors are caught         |
| `Store.js`          | `get`, `set`, `remove`, `clearAll`, `isPersistent`       | `localStorage` wrapper with in-memory fallback         |
| `Math.js`           | `clamp`, `lerp`, `damp`, `choice`, `rand`, `randi`, `smoothstepN`, `g2w`, `angleDelta` | Pure numerics                                  |
| `Random.js`         | `createRNG`, `randRange`, `randInt`, `randChoice`        | Mulberry32 PRNG                                        |
| `Log.js`            | `log.debug` / `.info` / `.warn` / `.error`, `setLevel`   | Level-gated logger; re-exported by `Logger.js` for back-compat |
| `Logger.js`         | `Logger.setLevel` / `.getLevel` / `.setReporter` / `.setBaseContext` / `.debug` / `.info` / `.warn` / `.error` / `.child`, `setLegacyLevel` | SOTA 2026 structured logger with reporter hook |
| `Errors.js`         | `install`, `uninstall`, `isInstalled`, `setReporter`, `setToastHandler`, `safeCall`, `safeCallAsync` | Global `error` + `unhandledrejection` handlers |
| `i18n.js`           | `t`, `setLocale`, `getLocale`, `getAvailableLocales`, `onLocaleChange`, `init` | Lightweight i18n with dotted keys + ICU-lite plurals   |
| `sw-register.js`    | `register`, `unregister`, `getRegistration`             | PWA service-worker registration (no-op in Node)       |
| `DOM.js`            | `$`, `qs`, `qsa`, `el`, `onReady`, `isTouchDevice`, `vibrate` | Browser-aware helpers                            |
| `Assert.js`         | `assert(cond, msg)`                                      | Tiny invariant helper                                 |
| `Color.js`          | `COLORS` (frozen palette), `lerpColors`, `cloneColor`    | Neon palette as `THREE.Color` instances                |

---

## render/ — Three.js setup

**What it is:** the WebGL plumbing. One-shot factories that create
the renderer, scene, camera, lights, background, and post-processing
chain.

**Depends on:** `core/`, `config.js`, `three` (npm via importmap).

**Key exports:**

| File                | Exports                                       | Notes                                              |
| ------------------- | --------------------------------------------- | -------------------------------------------------- |
| `Renderer.js`       | `createRenderer(canvas)`, `resizeRenderer`    | ACES tone mapping, sRGB output                     |
| `Scene.js`          | `createScene()`                               | Adds `FogExp2` (cyan-tinted)                       |
| `Camera.js`         | `createCamera()`                              | `PerspectiveCamera` with FOV 60                    |
| `Lighting.js`       | `createLights(scene)`                         | Ambient + key (cyan) + fill (magenta) + top (sky)  |
| `Background.js`     | `createBackground`, `updateBackground`        | Stars, nebulae, dust particles                      |
| `PostFX.js`         | `createComposer(renderer, scene, camera)`     | Bloom + gamma correction (`r149` workaround)       |
| `TrailRibbon.js`    | `class TrailRibbon`                           | 12-quad billboard ring buffer                      |

---

## world/ — Procedural terrain

**What it is:** the heightmap data model, noise functions, and
hand-crafted level layouts. **No Three.js in the model itself** — the
mesh layer (`TerrainMesh`) translates the data into geometry.

**Depends on:** `core/`, `config.js`.

**Key exports:**

| File                  | Exports                                          | Notes                                            |
| --------------------- | ------------------------------------------------ | ------------------------------------------------ |
| `noise.js`            | `hash2D`, `smoothstepN`, `valueNoise`, `fbm`     | Deterministic, self-contained                    |
| `HeightMap.js`        | `class HeightMap`                                | `GRID × GRID` cells, `isSolid`, `setGoal`, `computeLethality`, `findNearestSolid` |
| `IslandBuilder.js`    | `buildTerrainIsland`, `buildBridge`              | Procedural primitives                            |
| `LevelBuilder.js`     | `buildLevel1..10`, `buildDailyLevel`, `buildLevel` | 10 hand-crafted + daily procedural              |
| `TerrainMesh.js`      | `class TerrainMesh`                              | Three.js tiles, edges, contour lines, danger map |
| `WaterPlane.js`       | `class WaterPlane`                               | Animated water surface + abyss plate             |
| `AmbientParticles.js` | `class AmbientParticles`                         | Valley fog + peak sparkles                       |
| `Goal.js`             | `class Goal`                                     | Spinning octahedron + halo + point light         |
| `StartMarker.js`      | `class StartMarker`                              | Pulsing spawn ring                               |
| `ScanRing.js`         | `class ScanRing`                                 | Radar pulse at level center                      |

See [LEVELS.md](./LEVELS.md) for the per-level design and how to add
a new one.

---

## entities/ — Game objects

**What it is:** every "thing" that exists in the world — snake, food,
bonus, pickups, particles, shockwaves. Each entity exposes a small
public API and owns its own Three.js meshes.

**Depends on:** `core/`, `render/` (for `TrailRibbon` only),
`config.js`, `three`.

**Key exports:**

| File             | Exports                  | Notes                                                    |
| ---------------- | ------------------------ | -------------------------------------------------------- |
| `Snake.js`       | `class Snake`            | Pure logic: `reset`, `setDir`, `step`, `applyMove`, `invulnerable` |
| `SnakeView.js`   | `class SnakeView`        | 3D segments with lean / squash / head-bob / eat-pop      |
| `Food.js`        | `class Food`             | Icosahedron core + wireframe + ring                      |
| `Pickups.js`     | `class Pickups`          | `orb` / `gem` / `crystal` / `slow` / `dice`              |
| `Bonus.js`       | `class Bonus`            | Gold "data nucleus" with countdown                       |
| `Checkpoints.js` | `class Checkpoints`      | Ring + octahedron markers, `placeBetween` helper         |
| `Particles.js`   | `class Particles`        | Pooled 600-point burst system                            |
| `Waves.js`       | `class Waves`            | Expanding shockwave rings                                |

---

## game/ — Orchestration

**What it is:** the rules. The state machine, per-step decisions,
scoring, modes, win/lose handling, and the warning-highlight
adjacent-cell pulse.

**Depends on:** `core/`, `world/`, `entities/`, `audio/` (for haptics),
`config.js`.

**Key exports:**

| File                   | Exports                                                     | Notes                                            |
| ---------------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| `GameState.js`         | `getState`, `setState`, `onStateChange`, `isPlaying`        | One-string state, `Set` of listeners             |
| `GameLoop.js`          | `class GameLoop`                                            | rAF utilities (used for time, not the main loop) |
| `StepLogic.js`         | `class StepLogic`                                           | Per-step decisions: food, bonus, pickups, goal   |
| `Collision.js`         | `checkCollisions(head, map)`                                | Returns `{ collided, cause }`                    |
| `Modes.js`             | `getMode`, `setMode`, `startStory`, `startTimeAttack`, `startDaily`, `getTimeRemainingSec` | Story / Time / Daily                    |
| `LevelManager.js`      | `class LevelManager`                                        | Loads a level's geometry + entities              |
| `Scoring.js`           | `getHi`, `getBestBySector`, `getLeaderboard`, `recordScore`, `recordSector`, `pushLeaderboard` | Top 10 leaderboard              |
| `Countdown.js`         | `startCountdown`, `cancelCountdown`, `getGoStartedAt`       | 3 → 2 → 1 → GO with cancel token                 |
| `DeathHandler.js`      | `startDying`, `updateDying`, `dyingComplete`, `resetDying`, `getDyingFrom` | Death state machine                |
| `WinHandler.js`        | `handleWin(score, sector)`                                  | Mode-aware win → next level or game over         |
| `WarningHighlight.js`  | `updateWarning(snake, map, terrainMesh, t)`                 | Pulses red edges on adjacent danger cells        |

---

## camera/ — Camera modes

**What it is:** the three camera poses (cinematic / top-down / chase)
and the controller that blends between them with damping + screen
shake.

**Depends on:** `core/`, `three`.

**Key exports:**

| File                  | Exports                                | Notes                                                |
| --------------------- | -------------------------------------- | ---------------------------------------------------- |
| `CameraMath.js`       | `cinematicPose`, `topDownPose`, `chasePose` | Pure functions returning `{ pos, target }`        |
| `CameraController.js` | `class CameraController`, `CAMERA_MODES` | `cycle`, `setMode`, `update`, `triggerShake`, `snap` |

`CAMERA_MODES` is `['CINEMÁTICA', 'CENITAL', 'PERSECUCIÓN']`.

---

## input/ — Input system

**What it is:** keyboard, touch, and a queue that combines them with
camera-relative direction mapping.

**Depends on:** `core/`, `config.js`, `entities/Snake.js` (only for
mutation), `camera/CameraController.js` (only for the camera vector).

**Key exports:**

| File               | Exports                                | Notes                                                |
| ------------------ | -------------------------------------- | ---------------------------------------------------- |
| `InputBindings.js` | `BINDINGS`, `matchesBinding`           | Frozen `pause / restart / camera / audio / jump1-5`  |
| `KeyboardInput.js` | `isDirKey`, `dirForKey`, `class KeyboardInput` | W/A/S/D + arrows, `attach()` listens globally   |
| `TouchInput.js`    | `class TouchInput`                     | Pointer events + swipe threshold (26 px)            |
| `InputMapper.js`   | `mapDirCamera(named, camPos, camTarget)` | Maps logical → world direction from camera basis   |
| `InputQueue.js`    | `class InputQueue`                     | Combines KB + touch, gates by `state`               |

---

## audio/ — Sound + haptics

**What it is:** lazy-init Web Audio context, synthwave music loop,
adaptive hi-hat + sub-bass, named SFX, and `navigator.vibrate`
wrappers.

**Depends on:** `core/`, `config.js`.

**Key exports:**

| File                | Exports                                                            | Notes                                  |
| ------------------- | ------------------------------------------------------------------ | -------------------------------------- |
| `AudioContext.js`   | `ensureAudio`, `resumeAudio`, `setMasterVolume`, `isAudioOn`, `getCtx`, `getSfxBus`, `getMusicBus`, `isMusicPlaying`, `tickCombo`, `getComboStep`, `resetCombo`, `setOnMusicEnd` | Master/sfx/music buses + combo counter |
| `SFX.js`            | `sfxEat`, `sfxBonusEat`, `sfxBonusAppear`, `sfxDie`, `sfxStart`    | Internal `envBlip` / `envSweep` / `noiseBurst` |
| `Music.js`          | `startMusic`, `stopMusic`                                          | Sawtooth bass + sawtooth pad + arp     |
| `AdaptiveLayers.js` | `updateAdaptive(snake, lastGoal)`                                  | Hi-hat + sub-bass scale with length    |
| `Volume.js`         | `toggleAudio`                                                      | On / off master                        |
| `Haptics.js`        | `isReducedMotion`, `setReducedMotion`, `hapticEat` / `Gem` / `Crystal` / `Slow` / `Dice` / `Check` / `Bonus` / `LevelUp` / `Die` / `Win` | 10 named patterns       |

---

## ui/ — DOM UI

**What it is:** everything that lives in the DOM: HUD, modals, toasts,
popups, share, calibration, level select, the pause / game-over
flows, and the title screen.

**Depends on:** `core/`, `config.js`, `audio/`, plus the relevant
`game/` modules for state.

**Key exports:**

| File                  | Exports                                                     | Notes                                       |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------- |
| `HUD.js`              | `init`, `setHi`, `setScore`, `setLevel`, `setSector`, `bump`, `updateScoreDisplay`, `updateCombo` | Score, hi, level, sector, combo, mode |
| `PowerUpChip.js`      | `init`, `show`, `hide`                                      | Speed / slow-mo chip with progress bar      |
| `Countdown.js`        | `init`, `show`                                              | 3 / 2 / 1 / GO overlay (Promise-based)      |
| `Toasts.js`           | `init`, `toast(text, kind)`                                 | Transient top-center notifications           |
| `Popups.js`           | `init`, `popupAt(world, text, kind)`, `update(camera, dt)`   | Pooled 24-slot 3D-anchored numbers          |
| `Modal.js`            | `show`, `hide`, `toggle`, `isOpen`                          | Base `.show` class toggle                   |
| `TitleScreen.js`      | `init`, `show`, `hide`, `showTouchHint`                     | Title + touch hint                          |
| `PauseModal.js`       | `init`, `showPause`, `hidePause`, `isOpen`                  | Pause                                       |
| `GameOverModal.js`    | `init`, `showGameOver`, `hideGameOver`                      | Final score + cause + new-rec badge         |
| `LeaderboardModal.js` | `init`, `open`, `close`                                     | Top 10                                      |
| `SettingsModal.js`    | `init`, `open`, `close`, `toggleColorBlind`, `toggleReducedMotion`, `toggleSlowMode`, `clearAllData` | Audio / CB / RM / Slow         |
| `LevelSelectModal.js` | `init`, `show`, `hide`, `setOnSelect`, `setCurrentSector`   | 5×2 grid of 10 levels                      |
| `CalibrationStore.js` | `getAll`, `set`, `reset`, `onChange`, `DEFAULTS`            | Singleton store (versioned schema)          |
| `CalibrationPanel.js` | `init`, plus internal `show` / `hide` / `toggle`             | Right-side slide-in panel                   |
| `Share.js`            | `buildShareText`, `shareScore`                              | Clipboard API + textarea fallback           |

---

## components/ — Web Components

**What it is:** Shadow-DOM-encapsulated UI primitives. They are
imported once for side effects (they call `customElements.define`).

**Depends on:** nothing in `src/`. Pure DOM APIs.

| Tag               | Attributes                                  | Notes                       |
| ----------------- | ------------------------------------------- | --------------------------- |
| `<ns-button>`     | `variant`, `label`, `pressed`, `disabled`   | Clip-path neon button       |
| `<ns-modal>`      | `open`, `title`, `dismissible`              | Dialog with named slots     |
| `<ns-chip>`       | `tone`, `icon`, `label`, `value`            | Status chip                 |
| `<ns-panel>`      | `tone`                                      | Generic panel               |
| `<ns-toast>`      | `text`, `tone`, `duration`                  | Transient notification      |
| `<ns-progress-bar>` | `value`, `tone`, `indeterminate`          | Accessible progressbar      |

---

## dev/ — Development tools

**What it is:** opt-in tools that are **not** part of the runtime
game. They are imported by `main.js` only when needed and are safe
to delete in production builds.

**Depends on:** `core/`.

| File             | Exports                                              | Notes                                            |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------ |
| `PerfOverlay.js` | `init`, `show`, `hide`, `toggle`, `isVisible`, `recordDrawCalls`, `destroy` | Bottom-right FPS / frame time / draw-call / heap overlay, toggled with <kbd>`</kbd> (backtick) |

The overlay is hidden by default; press <kbd>`</kbd> to show it.
It uses a 60-frame rolling average for FPS and respects focus /
modifier keys so the backtick is never hijacked while you're
typing in a settings input.

---

## locales/ — i18n catalogs

**What it is:** JSON catalogs consumed by `core/i18n.js` via dynamic
import.

**Depends on:** nothing. Pure data.

| File      | Locale   | Notes                                                  |
| --------- | -------- | ------------------------------------------------------ |
| `es.json` | Spanish  | Default. Today this is the only locale actually rendered to the UI. |
| `en.json` | English  | Catalog ready; UI extraction tracked in `dev/`.        |

Each catalog has a `_meta` block (version + locale code) and nested
sections (e.g. `hud.*`, `calibration.*`, `modals.*`). Missing keys
render as `[<locale>.<key>]` so they are visible in the UI rather
than silent blanks.

> The i18n module is wired up but the strings in `index.html`,
> `src/main.js`, and the modals are still hardcoded. A follow-up
> PR will route them through `t('hud.score')` etc. — see
> `core/i18n.js` header for the extraction backlog.

---

## styles/ — CSS

Modular CSS, **not** part of the ES module graph. The folder
mirrors the layout of `src/`:

```
src/styles/
├── main.css        # Entry; @imports the rest
├── tokens.css      # Custom properties (--color-*, --space-*, --font-*, --motion-*, --z-*)
├── reset.css       # Modern reset
├── base.css        # Body, typography, focus-visible
├── layout/         # #hud, #loader, .modal, .title-screen
├── components/     # .button, .chip, .panel, .toast, .progress-bar, .popup, …
└── fx/             # .crt, .flash, .vignette, .glitch
```

Uses `@layer`, `color-mix()`, container queries, and
`prefers-reduced-motion`.

---

## Cross-layer rules

1. **Acyclic.** If you find yourself adding a cycle, push the shared
   concept down to `core/`.
2. **`core/` has no DOM, no Three.js, no `localStorage` API** — those
   helpers live alongside the storage / DOM modules at the same level.
3. **Events flow up, state flows down.** `game/` emits events; `ui/`
   subscribes; `game/` does **not** know about DOM nodes.
4. **Constants live in `config.js`.** Module-private constants are
   `const`s at the top of the file and prefixed with `_` to mark
   them as intentional.

See [ARCHITECTURE.md](../ARCHITECTURE.md) for the full event/state
diagrams, and [CONTRIBUTING.md](./CONTRIBUTING.md) for the
"where do I add this?" decision tree.
