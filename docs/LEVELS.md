# NEØN SERPENT — Level Design

> The 10 hand-crafted levels, the difficulty curve, and how to add
> your own.

Levels live in `src/world/LevelBuilder.js`. Each level is a small
function that builds onto a `HeightMap` and returns the snake's
spawn cell + starting direction. The dispatcher at the bottom of
the file routes `buildLevel(map, n)` to the right builder.

---

## Table of contents

- [Quick reference](#quick-reference)
- [The 10 levels](#the-10-levels)
- [Difficulty curve](#difficulty-curve)
- [Palette mapping](#palette-mapping)
- [Daily Seed](#daily-seed)
- [Adding a new level](#adding-a-new-level)
- [Tuning knobs](#tuning-knobs)

---

## Quick reference

| # | Name       | Theme   | Layout                                | Goal cell (gx, gz) |
| - | ---------- | ------- | ------------------------------------- | ------------------ |
| 1 | INICIO     | Tutorial | Single flat island                   | (20, 16)           |
| 2 | AVANCE     | Easy     | 2 islands + 1 wide bridge            | (23, 16)           |
| 3 | HUB        | Easy     | 3 wide islands, 3 wide bridges       | (16, 24)           |
| 4 | ESCALERA   | Medium   | 3 steps, rising Y                    | (26, 24)           |
| 5 | CRUCES     | Medium   | 5-island cross                       | (16, 16)           |
| 6 | ISLAS      | Hard     | 6 ring islands + center, narrow bridges | (16, 16)         |
| 7 | TORRE      | Hard     | 1 central pillar + 30 spiral steps    | (16, 16)           |
| 8 | PILAR      | 3D       | 2 stacked platforms + ramp           | (22, 16)           |
| 9 | ASCENSO    | 3D       | 3 stacked platforms, 2 ramps         | (24, 16)           |
| 10 | CIMA       | 3D       | 4 platforms, 4 ramps, multiple paths  | (26, 16)           |

The 5th-and-beyond palette (`LEVEL_PALETTES[5..9]`) and the 3D
levels (`8..10`) were added in the 2026 SOTA refactor; the
original monolith only had 5 levels.

---

## The 10 levels

### 1 — INICIO

**Theme:** tutorial, single flat island.
**Shape:** one round island, `baseR = 12`, peak at `y = 0`.
**Why:** the goal sits adjacent to the spawn, so the player learns
the controls without the threat of falling off.

```js
buildTerrainIsland(map, { cx: 16, cz: 16, baseR: 12, peakY: 0.0, seed: 1, falloffPower: 1.3 });
map.setGoal(20, 16);
// spawn: (12, 16), facing right
```

### 2 — AVANCE

**Theme:** two flat islands joined by a wide bridge.
**Shape:** `baseR = 5` islands at `(9, 16)` and `(23, 16)`, bridge
`width = 3` between them.
**Why:** the player crosses a gap for the first time, but the
bridge is wide enough to forgive a mis-tap.

### 3 — HUB

**Theme:** three islands, three wide bridges, low relief.
**Shape:** the player must turn at least twice to reach the goal.
**Why:** introduces multi-segment planning.

### 4 — ESCALERA

**Theme:** three islands at increasing Y (`0.5`, `1.5`, `2.5`).
**Why:** first level where the climb height matters. Bridges
**must** be reached, and falling off the step kills.

### 5 — CRUCES

**Theme:** five islands in a cross pattern, each with `baseR = 3`.
**Why:** the player can go "wrong way" and waste the run; goal is
back at the center.

### 6 — ISLAS

**Theme:** six islands in a ring around a central peak, connected by
single-cell-wide bridges.
**Why:** narrow bridges + ring geometry. A single wrong turn can
trap you on an island with no way to the goal.

### 7 — TORRE

**Theme:** one central high pillar (`peakY = 4.0`) plus a 30-step
spiral staircase climbing from the ground to the top.
**Why:** the goal is the *highest* cell. Pure 3D navigation.

```js
const stepsPerTurn = 10;
const turns = 3;
for (let i = 0; i < stepsPerTurn * turns; i++) {
  const t = i / (stepsPerTurn * turns);
  const angle = t * turns * Math.PI * 2;
  const r = 7 - t * 2;
  // spiral steps at rising Y
  buildTerrainIsland(map, { cx, cz, baseR: 1.4, peakY: -0.5 + t * 4.0, seed: 120 + i });
}
```

### 8 — PILAR (3D)

**Theme:** two stacked platforms connected by a ramp.
**Shape:** base at `y = 0.3` (peak), upper platform at `y = 3.5`,
ramp of `width = 2` between them.
**Why:** introduces the player to "3D level" — falling off a ramp
edge now means falling *down*, not just sideways.

### 9 — ASCENSO (3D)

**Theme:** three stacked platforms, two ramps.
**Shape:** `y = 0.3 → 2.5 → 5.0`. Two ramps: `0→1` (height 1.4) and
`1→2` (height 3.7).
**Why:** the second ramp is the tallest single-step climb in the
campaign.

### 10 — CIMA (3D)

**Theme:** four platforms in a complex layout with multiple
ramp paths.
**Shape:** two base platforms at `y ≈ 0.3`, one mid at `y = 2.5`,
one top at `y = 4.8`. Four bridges in total (two `0→1` paths, one
`1→2`, one base connector).
**Why:** the final challenge. The player can pick a route, but all
routes end at the same top cell.

---

## Difficulty curve

```
EASY ────► MEDIUM ────► HARD ────► 3D
 ├─ 1: 1 island        ├─ 5: cross    ├─ 7: tower   ├─ 8: 2 platforms
 ├─ 2: 2 islands       ├─ 6: ring     │             ├─ 9: 3 platforms
 ├─ 3: 3 islands       │              │             └─ 10: 4 platforms
 └─ 4: 3 steps         │              │
                       │              │
                       void %         void %         void % (perimeter)
       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
1      ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
2      █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
3      ███████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
4      ███████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
5      █████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
6      ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
7      ███████████████████████████████████░░░░░░░░░░░░░░░░░░░░░
8      ██████████████████████████████████████░░░░░░░░░░░░░░░░░░
9      ██████████████████████████████████████████░░░░░░░░░░░░░
10     ████████████████████████████████████████████████████░░░░

Y-EXTREME (peak height)
1-3    ~ 0.0 to 0.7   (flat)
4-6    ~ 1.2 to 2.4
7      ~ 4.0 (central pillar)
8      ~ 3.5
9-10   ~ 4.8 to 5.0

DENSITY (solid cell count, rough)
1      100%   one big island
2-3    60-70% multiple islands + bridges
4-6    40-50% cross / ring patterns
7      30%    pillar + 30 spiral dots
8-10   25-35% sparse platforms, lots of void
```

### What makes a level "harder"?

1. **More void around the goal.** Falling off is the #1 death cause.
2. **Higher peaks.** `STEP_CLIMB = 9.0` in `src/config.js` is the
   max Y delta between two cells the snake can step on. Anything
   steeper is treated as void.
3. **Narrower bridges.** Bridge `width` is half-width in cells:
   `width = 1` is one cell wide, `width = 3` is three.
4. **Longer path.** More turns = more chances to mis-input.

---

## Palette mapping

Each level has a `LEVEL_PALETTES` entry (see `src/config.js`) used
for the terrain tint, the goal beacon, and the HUD sector label.

```js
{ primary: 0x88aaff, secondary: 0xffc857, goal: 0x88aaff, name: 'INICIO'    }
{ primary: 0x00f6ff, secondary: 0x39ff14, goal: 0x39ff14, name: 'AVANCE'    }
{ primary: 0x00f6ff, secondary: 0xff2bd6, goal: 0xffc857, name: 'HUB'       }
{ primary: 0x39ff14, secondary: 0x00f6ff, goal: 0x39ff14, name: 'ESCALERA'  }
{ primary: 0xff2bd6, secondary: 0xffc857, goal: 0xff2bd6, name: 'CRUCES'    }
{ primary: 0xb026ff, secondary: 0x39ff14, goal: 0xb026ff, name: 'ISLAS'     }
{ primary: 0xffc857, secondary: 0x00f6ff, goal: 0xffc857, name: 'TORRE'     }
{ primary: 0xb026ff, secondary: 0xffc857, goal: 0x39ff14, name: 'PILAR'     }
{ primary: 0x39ff14, secondary: 0x00f6ff, goal: 0xffc857, name: 'ASCENSO'   }
{ primary: 0xff2bd6, secondary: 0x88aaff, goal: 0xffc857, name: 'CIMA'      }
```

> The colors are 0xRRGGBB integers consumed by Three.js directly.

The Level Select modal (key `J`, or `1-9, 0` shortcuts) renders the
10 palette swatches in a 5×2 grid, with the "EN JUEGO" tag on the
currently active sector.

---

## Daily Seed

`buildDailyLevel(map, seed)` generates a procedural level from a
date-derived seed (`YYYYMMDD`). It is the only level the player
gets in **DAILY** mode.

```js
const seed = year * 10000 + (month + 1) * 100 + day;
buildDailyLevel(map, seed);
```

The shape is variable (`N = 5 + (seed % 3)` islands in a ring, each
connected by a 1-cell-wide bridge). The goal is always the *last*
island placed.

Because the level is deterministic for a given date, all players
worldwide race the same map on the same day.

---

## Adding a new level

> Levels live in `src/world/LevelBuilder.js`. Adding one means
> editing that file, **and** `src/config.js` (palette entry),
> and **and** the dispatcher at the bottom of `LevelBuilder.js`.

### Step 1 — design the layout

Sketch the level on a 32×32 grid. Decide:

- How many islands? Where? (cx, cz, baseR, peakY)
- Which bridges? (start, end, yBase, width)
- Where is the spawn? Where is the goal?
- What direction does the snake face on spawn? (`up` / `down` /
  `left` / `right`)

### Step 2 — write the builder

```js
// In src/world/LevelBuilder.js
export function buildLevel11(map) {
  map.reset();
  buildTerrainIsland(map, { cx: 16, cz: 8,  baseR: 5, peakY: 1.0, seed: 500, falloffPower: 1.3 });
  buildTerrainIsland(map, { cx: 16, cz: 24, baseR: 5, peakY: 3.5, seed: 501, falloffPower: 1.3 });
  buildBridge(map, 16, 12, 16, 20, 2.0, { width: 2, seed: 510, yNoise: 0.2 });
  map.setGoal(16, 24);
  return { startGX: 16, startGZ: 7, startDir: 'down' };
}
```

### Step 3 — register it

In the dispatcher at the bottom of `LevelBuilder.js`:

```js
const BUILDERS = [
  buildLevel1,  buildLevel2,  buildLevel3,  buildLevel4,  buildLevel5,
  buildLevel6,  buildLevel7,  buildLevel8,  buildLevel9,  buildLevel10,
  buildLevel11  // ← new
];

export function buildLevel(map, n) {
  const idx = ((n - 1) % BUILDERS.length + BUILDERS.length) % BUILDERS.length;
  return BUILDERS[idx](map);
}
```

If you want it to be the **final** level, bump `LVL_CAP` in
`src/config.js` from `10` to `11`.

### Step 4 — add a palette

In `src/config.js`:

```js
export const LEVEL_PALETTES = Object.freeze([
  // … existing 10 …
  { primary: 0xff7a1a, secondary: 0x00f6ff, goal: 0xff7a1a, name: 'ARCOÍRIS' }
]);
```

### Step 5 — test it

```bash
node --test tests/unit/terrain.test.js
```

Add a test to `tests/unit/terrain.test.js` for your new level:

```js
test('buildLevel11 sets goal and spawns in safe cells', () => {
  const map = new HeightMap();
  const cfg = buildLevel11(map);
  const start = map.findNearestSolid(cfg.startGX, cfg.startGZ, 4);
  assert.ok(start, 'spawn cell must be on solid ground');
  let goal = null;
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      if (map.cells[x][z].goal) goal = { x, z };
    }
  }
  assert.ok(goal, 'goal cell must exist');
});
```

### Step 6 — open it in the Level Select modal

The modal in `src/ui/LevelSelectModal.js` reads `LEVEL_PALETTES`
directly, so the new cell appears automatically once the palette
is added. If you bumped `LVL_CAP`, the digit shortcuts also pick
it up.

---

## Tuning knobs

All numbers that control level feel live in `src/config.js`:

| Constant     | Default | Effect                                                          |
| ------------ | ------- | --------------------------------------------------------------- |
| `GRID`       | 32      | Grid is `GRID × GRID` cells. Bigger → more space, more work.    |
| `CELL`       | 1.0     | World units per cell. Used by `g2w()`.                          |
| `Y_TOP`      | 0.0     | Default "high" terrain Y.                                       |
| `Y_MID`      | -2.4    | Mid-Y reference for camera focus.                               |
| `Y_WATER`    | -6.0    | Anything ≤ this Y is non-solid (water / void).                  |
| `Y_OCEAN`    | -9.0    | Y returned for non-solid cells by `HeightMap.heightAt()`.       |
| `STEP_CLIMB` | 9.0     | Max Y delta the snake can step. Above this → death.             |
| `FBM_SEED_BASE` | 7919 | Base seed combined with every per-island seed.                 |

For per-builder tuning, the relevant options are documented inline
in `IslandBuilder.js` (`buildTerrainIsland`, `buildBridge`).
