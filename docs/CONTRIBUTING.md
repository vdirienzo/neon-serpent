# NEØN SERPENT — Contributing Guide

> SOTA development workflow for the 2026 modular refactor of the snake game.

NEØN SERPENT is a zero-build, pure-ES-modules codebase. You only need
**Node ≥ 18** and a text editor. No `npm install`, no bundler, no transpiler.

---

## Table of contents

- [Dev setup](#dev-setup)
- [Project layout](#project-layout)
- [Running the game](#running-the-game)
- [Running tests](#running-tests)
- [Code coverage](#code-coverage)
- [Code style](#code-style)
- [Commit convention](#commit-convention)
- [Pull request process](#pull-request-process)
- [Module ownership](#module-ownership)
- [Filing issues](#filing-issues)

---

## Dev setup

### Prerequisites

| Tool   | Version  | Why                                      |
| ------ | -------- | ---------------------------------------- |
| Node   | ≥ 18     | Native ES modules + `node --test` runner |
| Python | 3.x      | Optional: the bundled `serve.sh`         |
| A browser | Modern | The game itself                          |

### Clone and play

```bash
git clone <repo-url> opensake
cd opensake
./serve.sh                     # python3 -m http.server 8765
# open http://localhost:8765/
```

The game lives in `index.html` (entry) which loads `src/main.js` as a
native ES module. Three.js is fetched from `unpkg` via an `<script
type="importmap">` in `index.html` — the first load needs internet for
the library, after which the service worker caches it.

> Why not `npm`? The whole point of the 2026 refactor was to drop the
> toolchain. `package.json` exists only to document scripts and metadata.

---

## Project layout

```
opensake/
├── index.html              # Entry, importmap, HTML shell
├── manifest.webmanifest    # PWA manifest (fullscreen, landscape)
├── sw.js                   # Service worker (cache-first)
├── serve.sh                # Tiny dev server (python3 -m http.server)
├── package.json            # Scripts and metadata (no deps)
├── src/                    # Game source — pure ES modules
│   ├── main.js             # Bootstrap (imports every module)
│   ├── config.js           # Frozen constants (GRID, palette, EVT, …)
│   ├── core/               # Foundation (math, store, event-bus, …)
│   ├── render/             # Three.js setup (renderer, scene, post-fx)
│   ├── world/              # Heightmap, noise, level builders
│   ├── entities/           # Snake, food, bonus, pickups, …
│   ├── game/               # State machine, step logic, scoring
│   ├── camera/             # 3 camera modes + controller
│   ├── input/              # Keyboard, touch, camera-relative mapping
│   ├── audio/              # WebAudio synthwave + SFX + haptics
│   ├── components/         # Shadow-DOM Web Components (ns-button, …)
│   ├── ui/                 # HUD, modals, calibration, level select
│   └── styles/             # Modular CSS (tokens, base, layout, fx, …)
├── tests/                  # node:test suite
│   ├── unit/               # Pure logic (no DOM, no Three.js)
│   ├── unit/extra/         # Extended unit coverage
│   ├── dom/                # UI logic with the in-house DOM mock
│   ├── three/              # Three.js modules with the WebGL stub
│   ├── integration/        # Cross-module flows
│   └── smoke/              # File-existence + import resolution
└── docs/                   # You are here
    ├── CONTRIBUTING.md
    ├── MODULES.md
    ├── LEVELS.md
    ├── TESTING.md
    └── ACCESSIBILITY.md
```

---

## Running the game

```bash
./serve.sh
# or
PORT=8080 ./serve.sh
# or directly
python3 -m http.server 8765
```

Then visit `http://localhost:8765/`. The first paint takes ~1.5 s
because fonts and Three.js are fetched from the network.

> Files served over `file://` will not work — ES module imports and
> `importmap` require an HTTP origin.

---

## Running tests

```bash
# Whole suite (use this in CI)
node --test tests/

# Explicit grouping (use this in dev for faster feedback)
node --test \
  tests/unit/*.test.js \
  tests/unit/extra/*.test.js \
  tests/integration/*.test.js \
  tests/dom/*.test.js \
  tests/three/*.test.js \
  tests/smoke/*.test.js
```

`node --test` is the built-in test runner; there is **no test
framework dependency**. Tests look like:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('clamp constrains a value to [a, b]', () => {
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(-3, 0, 10), 0);
});
```

See [TESTING.md](./TESTING.md) for the full strategy and mock patterns.

---

## Code coverage

Coverage is produced with Node's built-in `c8` runner (not bundled as
a dep — install once globally):

```bash
npm i -g c8
c8 --reporter=text --reporter=html node --test tests/
# open coverage/index.html
```

Current state: **≈ 92 %** of `src/` is covered. Goals:

| Directory     | Target | Why                                 |
| ------------- | ------ | ----------------------------------- |
| `core/`       | 100 %  | Pure utilities, trivial to test     |
| `game/`       | 95 %   | State machine + step logic          |
| `world/`      | 90 %   | Noise + builder coverage            |
| `entities/`   | 85 %   | Visual-only paths exempt            |
| `ui/`         | 80 %   | DOM-coupled paths (DOM mock covers) |
| `audio/`      | 70 %   | Web Audio context (mocked)          |
| `render/`     | 60 %   | Three.js side effects               |

---

## Code style

### File header

Every `.js` file in `src/` starts with a `@fileoverview` JSDoc block:

```js
/**
 * @fileoverview One-sentence description of what this module owns.
 */
```

### Public API

Every exported function/class carries JSDoc with `@param`, `@returns`,
and (where useful) `@example`. Run `c8` and look for red — uncovered
branches are an opportunity to add a test, not an excuse to delete a
doc comment.

### Linting

There is no linter wired up yet. Until then, follow these rules
manually:

- **2-space indent**, single quotes, semicolons.
- **No `console.log` in production code.** Use `log` from
  `core/Log.js` (level-gated) or remove the line.
- **No `var`.** Use `const` by default, `let` only when reassigned.
- **Strict module syntax** — no globals, no IIFEs, no top-level
  `window.X = …` unless you mean it (`window.__NS` is documented and
  intentional).
- **One responsibility per file.** If a file grows past ~200 lines
  or mixes two concerns, split it.
- **Pure functions where possible.** Side effects go at the edges
  (event handlers, `init()`).

### Naming

| Kind              | Style                 | Example              |
| ----------------- | --------------------- | -------------------- |
| Variables / fns   | `camelCase`           | `pickFreeCell`       |
| Classes           | `PascalCase`          | `SnakeView`          |
| Constants         | `UPPER_SNAKE_CASE`    | `MAX_RETRIES`        |
| Booleans          | `is` / `has` / `can`  | `isPlaying`          |
| Web Components    | `kebab-case` w/ `ns-` | `ns-button`          |
| File names        | `PascalCase.js`       | `LevelSelectModal.js` |

### Defensive coding

- Default to safe values (`[]`, `{}`, `''`, `0`), never `null` unless
  the type signature demands it.
- Validate inputs at module boundaries (use `assert()` from
  `core/Assert.js` for invariants, throw for user-facing errors).
- External calls (clipboard, vibration, audio context) **must** be
  wrapped in `try / catch` and fail gracefully.

---

## Commit convention

We use the **Conventional Commits** format:

```
type(scope): short description

<body — wrap at 72 chars>

<footer>
```

| Type       | When                                        |
| ---------- | ------------------------------------------- |
| `feat`     | New feature                                 |
| `fix`      | Bug fix                                     |
| `docs`     | Documentation only                          |
| `refactor` | Code change that neither fixes nor adds     |
| `test`     | Add or update tests                         |
| `chore`    | Maintenance (deps, config, tooling)         |
| `style`    | Whitespace, formatting, no logic change     |
| `perf`     | Performance improvement                     |

Examples:

```text
feat(world): add spiral tower layout to LevelBuilder
fix(death): startDying guard no longer dead code
docs(contributing): clarify dev setup with no-npm workflow
test(step): cover pickup collision against snake body
```

The subject line is **imperative mood** ("add", not "added") and stays
under 72 chars. Reference an issue in the footer when relevant:

```text
fix(level-manager): remove stale MODE import (#142)
```

---

## Pull request process

1. **Branch from `main`.** Name it `feat/<slug>`, `fix/<slug>`, etc.
2. **Keep the diff focused.** One concern per PR; refactors go in a
   separate PR from feature work.
3. **Add tests first.** Write the failing test, then the fix, then
   the refactor. See [TESTING.md](./TESTING.md).
4. **Update docs in the same PR.** If you add a module, add it to
   [MODULES.md](./MODULES.md). If you add a level, document it in
   [LEVELS.md](./LEVELS.md).
5. **Run the full test suite.** Paste the green output in the PR
   description.
6. **Self-review the diff.** Read the files as if you were the
   reviewer. Catch your own mistakes.
7. **Request review.** Tag a maintainer; expect 1–3 review cycles.
8. **Squash-merge.** PR title becomes the commit message; prefix
   with the conventional type if it doesn't already.

### Pre-merge checklist

- [ ] Tests pass locally (`node --test tests/`)
- [ ] Coverage did not drop (run `c8 …`)
- [ ] JSDoc updated for any new public symbol
- [ ] `CHANGELOG.md` updated under the `## Unreleased` section
- [ ] No `console.log` left behind
- [ ] No new TODOs without an issue link

---

## Module ownership

If you want to add a feature, first identify the **layer** that owns
the concept:

| Concern                  | Lives in          |
| ------------------------ | ----------------- |
| Constants, state, events | `src/config.js`   |
| Pure utilities           | `src/core/`       |
| Three.js setup           | `src/render/`     |
| Heightmap, terrain       | `src/world/`      |
| Game objects             | `src/entities/`   |
| Game flow / rules        | `src/game/`       |
| Camera logic             | `src/camera/`     |
| Input plumbing           | `src/input/`      |
| Sound + haptics          | `src/audio/`      |
| DOM UI + modals          | `src/ui/`         |
| Reusable Shadow-DOM      | `src/components/` |
| Styling                  | `src/styles/`     |

If the feature spans multiple layers, **start at the lowest layer**
and build up. Example: "I want a new pickup type that gives double
points for 5 s."

1. `src/entities/Pickups.js` — add the new `TYPES` entry.
2. `src/game/StepLogic.js` — branch on the new type.
3. `src/ui/HUD.js` — add a toast / chip.
4. `tests/unit/pickups.test.js` + `tests/integration/score-flow.test.js`
   — cover the new path.

### File scope rules

- A file's responsibility is described in its `@fileoverview`.
- If you need to import from a higher layer, **stop and reconsider**.
  `core/` must not import from `ui/`; `entities/` must not import from
  `game/`. Cycles are a smell.
- New constants go in `src/config.js` (or, if they belong to a single
  module, at the top of that module as `const`).

---

## Filing issues

Use the templates under `.github/ISSUE_TEMPLATE/` (when present). For
anything else:

- **Bug**: include browser, OS, repro steps, and a screenshot or short
  video. Mention the level (`SECTOR 7`) and mode (`HISTORIA` / `TIME
  ATTACK` / `DAILY SEED`).
- **Feature**: describe the user need first, then the proposed API.
  Bigger features get a design doc in `docs/proposals/` before code.
- **Question**: check `docs/` first; many "how do I…?" questions are
  already answered.

---

Happy hacking. 🐍⚡
