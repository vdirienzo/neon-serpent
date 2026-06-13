# NEØN SERPENT — Testing Strategy

> How tests are organized, how to run them, how to write one, and
> how to mock the world.

NEØN SERPENT ships with a fully native test suite built on
[`node:test`](https://nodejs.org/api/test.html). There is **no test
framework** as a dependency, **no Babel**, **no bundler** — the
production code is the code under test.

---

## Table of contents

- [The pyramid](#the-pyramid)
- [How to run tests](#how-to-run-tests)
- [Layout of the test suite](#layout-of-the-test-suite)
- [Writing a test](#writing-a-test)
- [Mock patterns](#mock-patterns)
- [Coverage](#coverage)
- [Current state by directory](#current-state-by-directory)

---

## The pyramid

```
                  ┌────────┐
                  │  e2e   │  smoke  (5%)    — file existence + import resolution
                  ├────────┤
                  │  int.  │  integration   (20%) — cross-module flows
                  ├────────┤
                  │  dom   │  dom          (15%) — UI logic with DOM mock
                  ├────────┤
                  │ three  │  three        (10%) — three-stubbed render layer
                  ├────────┤
                  │  unit  │  unit + extra (50%) — pure logic, no env
                  └────────┘
```

| Layer          | Folder                                  | Approx. share |
| -------------- | --------------------------------------- | ------------- |
| Unit           | `tests/unit/`, `tests/unit/extra/`      | 50 %          |
| Three.js       | `tests/three/`                          | 10 %          |
| DOM            | `tests/dom/`                            | 15 %          |
| Integration    | `tests/integration/`                    | 20 %          |
| Smoke          | `tests/smoke/`                          | 5 %           |

**Target distribution**: 75 % unit, 20 % integration, 5 % e2e.
The pyramid inverts slightly to fit Three.js + DOM as first-class
citizens, but the principle holds: most logic should be reachable
without booting the browser.

---

## How to run tests

### Whole suite

```bash
node --test tests/
```

This is the **CI command**. It discovers every `*.test.js` file
recursively and reports a TAP stream.

### Explicit grouping (faster feedback)

```bash
node --test \
  tests/unit/*.test.js \
  tests/unit/extra/*.test.js \
  tests/integration/*.test.js \
  tests/dom/*.test.js \
  tests/three/*.test.js \
  tests/smoke/*.test.js
```

This is the exact command run by the docs verification step. It
is **faster** because `node --test` doesn't recurse.

### Single file

```bash
node --test tests/unit/terrain.test.js
```

### Single test by name

```bash
node --test --test-name-pattern="buildLevel1" tests/unit/terrain.test.js
```

The `--test-name-pattern` flag accepts a regex.

### Watch mode (Node 19+)

```bash
node --test --watch tests/unit/
```

Re-runs on file changes. Not always available in CI.

---

## Layout of the test suite

```
tests/
├── unit/                       # Pure logic, no DOM, no Three.js
│   ├── core.test.js            # Math, g2w, angleDelta
│   ├── random.test.js          # Mulberry32 determinism
│   ├── eventbus.test.js        # pub/sub semantics
│   ├── heightmap.test.js       # reset, setGoal, findNearestSolid
│   ├── noise.test.js           # hash, valueNoise, FBM
│   ├── snake.test.js           # step, setDir, invulnerability
│   ├── terrain.test.js         # island, bridge, level builders
│   ├── scoring.test.js         # hi-score, per-sector, leaderboard
│   ├── calibration.test.js     # calibration store
│   ├── level-select.test.js    # level select logic
│   └── extra/                  # extended unit coverage
│       ├── assert.test.js
│       ├── camera-math.test.js
│       ├── collision.test.js
│       ├── color.test.js
│       ├── countdown.test.js
│       ├── death-handler.test.js
│       ├── game-state.test.js
│       ├── input-mapper.test.js
│       ├── input-queue.test.js
│       ├── keyboard-input.test.js
│       ├── level-manager.test.js
│       ├── log.test.js
│       ├── modes.test.js
│       ├── step-logic.test.js
│       ├── store.test.js
│       ├── warning.test.js
│       ├── win-handler.test.js
│       ├── _modes-loader.mjs   # test-only module shim
│       └── _three-loader.mjs   # test-only Three.js shim
├── three/                      # Three.js modules with stub
│   ├── three-hook.mjs          # registers the global stub
│   ├── three-stub.js           # minimal WebGL-free Three API
│   ├── background.test.js
│   ├── lighting.test.js
│   └── scene.test.js
├── dom/                        # UI logic with the in-house DOM mock
│   ├── setup.js                # installs the global DOM before each test
│   ├── calibration-panel.test.js
│   ├── hud.test.js
│   ├── level-select-modal.test.js
│   ├── popups.test.js
│   └── toasts.test.js
├── integration/                # cross-module flows
│   ├── game-flow.test.js
│   ├── level-cycle.test.js
│   ├── level-load.test.js
│   ├── pickup-flow.test.js
│   ├── score-flow.test.js
│   └── snake-flow.test.js
└── smoke/                      # file existence + import resolution
    └── boot.test.js
```

---

## Writing a test

### The minimal template

```js
// tests/unit/example.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { myFunction } from '../../src/somewhere/example.js';

test('myFunction returns the expected value', () => {
  const result = myFunction(2, 3);
  assert.equal(result, 5);
});

test('myFunction throws on invalid input', () => {
  assert.throws(() => myFunction(-1, 0), /positive/);
});
```

### Conventions

- **File name**: `<module>.test.js`, in the matching test directory.
- **One file per source module** when feasible; group tightly related
  modules (`eventbus.test.js`, `store.test.js` are split; `core.test.js`
  groups `Math.js` and friends).
- **Test names are sentences**: read the output and the user sees
  "✔ myFunction returns the expected value", not "✔ test1".
- **Use `node:assert/strict`**: every comparison is `===` by default.
  This is the project's standard.
- **No `beforeEach` for trivial setup.** If you need shared state,
  prefer per-test creation to keep tests independent.
- **No async/await unless needed.** Most tests are sync; only the
  countdowns and store-persistence paths need to await.

### A real example

```js
// tests/unit/heightmap.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HeightMap } from '../../src/world/HeightMap.js';

test('reset() clears goal and danger flags', () => {
  const map = new HeightMap();
  map.cells[5][5].goal = true;
  map.cells[5][5].danger = true;
  map.reset();
  assert.equal(map.cells[5][5].goal, false);
  assert.equal(map.cells[5][5].danger, false);
});

test('findNearestSolid snaps to the closest solid cell', () => {
  const map = new HeightMap();
  // Make (5, 5) non-solid, (7, 5) solid
  map.cells[5][5].solid = false;
  const found = map.findNearestSolid(5, 5, 4);
  assert.deepEqual(found, { gx: 6, gz: 5 });
});

test('isSolid returns false out of bounds', () => {
  const map = new HeightMap();
  assert.equal(map.isSolid(-1, 0), false);
  assert.equal(map.isSolid(0, 32), false);
});
```

### Async tests

```js
test('store survives a reload', async () => {
  Store.set('hi', 42);
  // In a real test, this would reload the module; here we just
  // verify the value is still readable.
  assert.equal(Store.get('hi'), 42);
});
```

### Skipping / TODO

Avoid `.skip` and `.todo` in committed code; remove or implement
before merging.

---

## Mock patterns

### 1. Three.js

The render layer pulls in `three`, which expects a browser.
`tests/three/three-stub.js` provides a minimal subset:

```js
// tests/three/three-stub.js — excerpt
export class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  clone() { return new Vector3(this.x, this.y, this.z); }
  // …
}
```

Each Three.js test imports the stub **before** any module that
needs Three:

```js
import './three-stub.js';
import { createBackground } from '../../src/render/Background.js';
```

### 2. DOM

`tests/dom/setup.js` installs `globalThis.window`, `globalThis.document`,
`globalThis.navigator`, etc. before any UI module is loaded. The
mock supports:

- `document.createElement(tag)` with full attribute / style / event
  support
- `document.getElementById` against a registry the test can prime
- `el.classList.add` / `.remove` / `.toggle` / `.contains`
- `el.style.setProperty` / `.getPropertyValue` (CSS variables)
- `el.addEventListener` with synchronous dispatch
- `setTimeout` / `clearTimeout` from the real `node:timers`

A typical DOM test:

```js
// tests/dom/hud.test.js
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import './setup.js';          // installs window/document

let HUD;
before(async () => {
  // Prime the DOM with the elements the HUD expects
  document.body.innerHTML = `
    <div id="hud" hidden>
      <div id="scoreVal">0</div>
      <div id="hiVal">0</div>
      <div id="lvlNum">1</div>
      <div id="lvlbar"></div>
    </div>
  `;
  HUD = await import('../../src/ui/HUD.js');
});

test('init() resolves the HUD elements', () => {
  HUD.init();
  assert.equal(HUD.getLevel(), 1);
});
```

### 3. localStorage

`src/core/Store.js` already handles the case where `localStorage`
is missing — it falls back to an in-memory `Map`. So unit tests
**don't need a `localStorage` shim**: the store just works in
Node.

```js
import { test } from 'node:test';
import * as Store from '../../src/core/Store.js';

test('Store.get returns the default for missing keys', () => {
  assert.equal(Store.get('__nope__', 42), 42);
});

test('Store.set persists within the same process', () => {
  Store.set('hi', 99);
  assert.equal(Store.get('hi'), 99);
});
```

### 4. Audio context

`src/audio/AudioContext.js` is lazy: it only touches
`window.AudioContext` when `ensureAudio()` is called. Tests that
never call `ensureAudio()` never instantiate the context, and
Node is happy.

For tests that *do* want to exercise audio code, the
`tests/dom/setup.js` mock registers a no-op `AudioContext`:

```js
globalThis.AudioContext = class FakeAudioContext {
  createGain() { return { gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
  createOscillator() { return { type: 'sine', frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
  // …
};
```

### 5. Time

The render loop relies on `performance.now()`. Node 18+ provides
`globalThis.performance` natively, so no shim is needed. For
fake-time tests, use `node:test`'s `mock.timers`:

```js
import { test, mock } from 'node:test';

test('countdown schedules 3 steps', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  // … exercise countdown …
  mock.timers.tick(1000);
  mock.timers.tick(1000);
  // assert it has reached '1'
  mock.timers.reset();
});
```

---

## Coverage

Run with `c8`:

```bash
npm i -g c8
c8 --reporter=text --reporter=html node --test tests/
open coverage/index.html
```

`c8` is a V8-native coverage tool that uses the inspector API
directly. It works with the same `node --test` invocation.

### Per-directory targets

| Directory     | Target | Why                                  |
| ------------- | ------ | ------------------------------------ |
| `core/`       | 100 %  | Pure utilities, no excuses           |
| `game/`       | 95 %   | State machine + step logic           |
| `world/`      | 90 %   | Noise + level builders               |
| `entities/`   | 85 %   | Visual-only paths exempt             |
| `ui/`         | 80 %   | DOM-coupled paths (DOM mock covers)  |
| `audio/`      | 70 %   | Web Audio context (mocked)           |
| `render/`     | 60 %   | Three.js side effects                |
| **Total src** | **~92 %** | Current snapshot                  |

A drop in coverage is a red flag — investigate before merging.

---

## Current state by directory

A rough breakdown of where the tests live, by file count:

| Source module                       | Unit test                       |
| ----------------------------------- | ------------------------------- |
| `core/EventBus.js`                  | `unit/eventbus.test.js`         |
| `core/Store.js`                     | `unit/extra/store.test.js`      |
| `core/Math.js`                      | `unit/core.test.js`             |
| `core/Random.js`                    | `unit/random.test.js`           |
| `core/Log.js`                       | `unit/extra/log.test.js`        |
| `core/DOM.js`                       | (covered transitively)          |
| `core/Assert.js`                    | `unit/extra/assert.test.js`     |
| `core/Color.js`                     | `unit/extra/color.test.js`      |
| `world/HeightMap.js`                | `unit/heightmap.test.js`        |
| `world/noise.js`                    | `unit/noise.test.js`            |
| `world/IslandBuilder.js`            | `unit/terrain.test.js`          |
| `world/LevelBuilder.js`             | `unit/terrain.test.js`          |
| `world/TerrainMesh.js`              | (visual)                        |
| `world/WaterPlane.js`               | (visual)                        |
| `world/Goal.js`                     | (visual)                        |
| `world/StartMarker.js`              | (visual)                        |
| `world/ScanRing.js`                 | (visual)                        |
| `world/AmbientParticles.js`         | (visual)                        |
| `entities/Snake.js`                 | `unit/snake.test.js`            |
| `entities/SnakeView.js`             | (visual)                        |
| `entities/Food.js`                  | (via integration)               |
| `entities/Pickups.js`               | (via integration)               |
| `entities/Bonus.js`                 | (via integration)               |
| `entities/Checkpoints.js`           | (via integration)               |
| `entities/Particles.js`             | (via integration)               |
| `entities/Waves.js`                 | (via integration)               |
| `game/GameState.js`                 | `unit/extra/game-state.test.js` |
| `game/GameLoop.js`                  | (covered transitively)          |
| `game/StepLogic.js`                 | `unit/extra/step-logic.test.js` |
| `game/Collision.js`                 | `unit/extra/collision.test.js`  |
| `game/Modes.js`                     | `unit/extra/modes.test.js`      |
| `game/LevelManager.js`              | `unit/extra/level-manager.test.js` |
| `game/Scoring.js`                   | `unit/scoring.test.js`          |
| `game/Countdown.js`                 | `unit/extra/countdown.test.js`  |
| `game/DeathHandler.js`              | `unit/extra/death-handler.test.js` |
| `game/WinHandler.js`                | `unit/extra/win-handler.test.js` |
| `game/WarningHighlight.js`          | `unit/extra/warning.test.js`    |
| `camera/CameraController.js`        | (via three stub)                |
| `camera/CameraMath.js`              | `unit/extra/camera-math.test.js` |
| `input/KeyboardInput.js`            | `unit/extra/keyboard-input.test.js` |
| `input/InputMapper.js`              | `unit/extra/input-mapper.test.js` |
| `input/InputQueue.js`               | `unit/extra/input-queue.test.js` |
| `input/TouchInput.js`               | (covered transitively)          |
| `input/InputBindings.js`            | (covered transitively)          |
| `audio/AudioContext.js`             | (covered transitively)          |
| `audio/SFX.js`                      | (covered transitively)          |
| `audio/Music.js`                    | (covered transitively)          |
| `audio/AdaptiveLayers.js`           | (covered transitively)          |
| `audio/Volume.js`                   | (covered transitively)          |
| `audio/Haptics.js`                  | (covered transitively)          |
| `ui/HUD.js`                         | `dom/hud.test.js`               |
| `ui/CalibrationPanel.js`            | `dom/calibration-panel.test.js` |
| `ui/CalibrationStore.js`            | `unit/calibration.test.js`      |
| `ui/LevelSelectModal.js`            | `dom/level-select-modal.test.js`, `unit/level-select.test.js` |
| `ui/Modal.js`                       | (covered transitively)          |
| `ui/TitleScreen.js`                 | (covered transitively)          |
| `ui/PauseModal.js`                  | (covered transitively)          |
| `ui/GameOverModal.js`               | (covered transitively)          |
| `ui/LeaderboardModal.js`            | (covered transitively)          |
| `ui/SettingsModal.js`               | (covered transitively)          |
| `ui/Share.js`                       | (covered transitively)          |
| `ui/Toasts.js`                      | `dom/toasts.test.js`            |
| `ui/Popups.js`                      | `dom/popups.test.js`            |
| `ui/Countdown.js`                   | (covered transitively)          |
| `ui/PowerUpChip.js`                 | (covered transitively)          |
| `components/*`                      | (covered by Shadow-DOM spec)    |
| `render/Renderer.js`                | (covered via three stub)        |
| `render/Scene.js`                    | `three/scene.test.js`           |
| `render/Camera.js`                  | (covered via three stub)        |
| `render/Lighting.js`                | `three/lighting.test.js`        |
| `render/Background.js`              | `three/background.test.js`      |
| `render/PostFX.js`                  | (integration)                   |
| `render/TrailRibbon.js`             | (integration)                   |

When adding a new module, add at least one test file for it in the
appropriate layer.
