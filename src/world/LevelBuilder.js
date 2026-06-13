/**
 * @fileoverview Hand-authored level definitions. 10 story levels (2 easy
 * tutorial → 5 classic simplified → 3 multi-platform 3D finale) plus a
 * procedural "daily" generator.
 *
 * @typedef {Object} LevelStart
 * @property {number} startGX - Start cell X.
 * @property {number} startGZ - Start cell Z.
 * @property {'up'|'down'|'left'|'right'} startDir - Initial snake direction.
 */
import { buildTerrainIsland, buildBridge } from './IslandBuilder.js';

/**
 * @typedef {Object} BuildLevelFn
 * @param {import('./HeightMap.js').default} map - Heightmap to populate.
 * @returns {LevelStart} The spawn position and direction.
 */

/**
 * Level 1 — INICIO. A single flat island with the goal directly in front.
 * @type {BuildLevelFn}
 */
export function buildLevel1(map) {
  map.reset();
  buildTerrainIsland(map, { cx: 16, cz: 16, baseR: 12, peakY: 0.0, seed: 1, falloffPower: 1.3 });
  map.setGoal(20, 16);
  return { startGX: 12, startGZ: 16, startDir: 'right' };
}

/**
 * Level 2 — AVANCE. Two flat islands connected by a wide bridge.
 * @type {BuildLevelFn}
 */
export function buildLevel2(map) {
  map.reset();
  buildTerrainIsland(map, { cx: 9, cz: 16, baseR: 5, peakY: 0.0, seed: 2, falloffPower: 1.3 });
  buildTerrainIsland(map, { cx: 23, cz: 16, baseR: 5, peakY: 0.3, seed: 3, falloffPower: 1.3 });
  buildBridge(map, 13, 16, 19, 16, 0.2, { width: 3, seed: 4, yNoise: 0.15 });
  map.setGoal(23, 16);
  return { startGX: 8, startGZ: 16, startDir: 'right' };
}

/**
 * Level 3 — HUB. Three wide islands joined by two wide bridges.
 * @type {BuildLevelFn}
 */
export function buildLevel3(map) {
  map.reset();
  buildTerrainIsland(map, { cx: 8, cz: 8, baseR: 4.5, peakY: 0.5, seed: 11, falloffPower: 1.3 });
  buildTerrainIsland(map, { cx: 24, cz: 8, baseR: 4.5, peakY: 0.7, seed: 12, falloffPower: 1.3 });
  buildTerrainIsland(map, { cx: 16, cz: 24, baseR: 5, peakY: 0.6, seed: 13, falloffPower: 1.3 });
  buildBridge(map, 12, 8, 20, 8, 0.4, { width: 2, seed: 21, yNoise: 0.2 });
  buildBridge(map, 8, 12, 16, 20, 0.5, { width: 2, seed: 22, yNoise: 0.2 });
  buildBridge(map, 24, 12, 16, 20, 0.5, { width: 2, seed: 23, yNoise: 0.2 });
  map.setGoal(16, 24);
  return { startGX: 7, startGZ: 7, startDir: 'right' };
}

/**
 * Level 4 — ESCALERA. Three wide steps climbing from low to high.
 * @type {BuildLevelFn}
 */
export function buildLevel4(map) {
  map.reset();
  buildTerrainIsland(map, { cx: 6, cz: 8, baseR: 4, peakY: 0.5, seed: 30, falloffPower: 1.3 });
  buildTerrainIsland(map, { cx: 16, cz: 16, baseR: 4, peakY: 1.5, seed: 31, falloffPower: 1.3 });
  buildTerrainIsland(map, { cx: 26, cz: 24, baseR: 4, peakY: 2.5, seed: 32, falloffPower: 1.3 });
  buildBridge(map, 9, 9, 13, 15, 1.0, { width: 2, seed: 40, yNoise: 0.2 });
  buildBridge(map, 19, 17, 23, 23, 2.0, { width: 2, seed: 41, yNoise: 0.2 });
  map.setGoal(26, 24);
  return { startGX: 5, startGZ: 8, startDir: 'right' };
}

/**
 * Level 5 — CRUCES. Five islands in a cross pattern connected by four bridges.
 * @type {BuildLevelFn}
 */
export function buildLevel5(map) {
  map.reset();
  const segs = [
    { cx: 16, cz: 6, seed: 50 },
    { cx: 16, cz: 26, seed: 51 },
    { cx: 6, cz: 16, seed: 52 },
    { cx: 26, cz: 16, seed: 53 },
    { cx: 16, cz: 16, seed: 54 },
  ];
  for (const s of segs) {
    buildTerrainIsland(map, {
      cx: s.cx,
      cz: s.cz,
      baseR: 3,
      peakY: 1.2,
      seed: s.seed,
      falloffPower: 1.3,
    });
  }
  buildBridge(map, 16, 8, 16, 14, 0.7, { width: 2, seed: 60, yNoise: 0.2 });
  buildBridge(map, 16, 18, 16, 24, 0.7, { width: 2, seed: 61, yNoise: 0.2 });
  buildBridge(map, 8, 16, 14, 16, 0.7, { width: 2, seed: 62, yNoise: 0.2 });
  buildBridge(map, 18, 16, 24, 16, 0.7, { width: 2, seed: 63, yNoise: 0.2 });
  map.setGoal(16, 16);
  return { startGX: 16, startGZ: 5, startDir: 'down' };
}

/**
 * Level 6 — ISLAS. Six ring islands with a central peak, joined by narrow bridges.
 * @type {BuildLevelFn}
 */
export function buildLevel6(map) {
  map.reset();
  const ringR = 9;
  const segs = 6;
  for (let i = 0; i < segs; i++) {
    const angle = (i / segs) * Math.PI * 2;
    const cx = 16 + Math.cos(angle) * ringR;
    const cz = 16 + Math.sin(angle) * ringR;
    buildTerrainIsland(map, { cx, cz, baseR: 2.6, peakY: 1.8, seed: 70 + i, falloffPower: 1.4 });
  }
  buildTerrainIsland(map, { cx: 16, cz: 16, baseR: 2.5, peakY: 2.4, seed: 80, falloffPower: 1.3 });
  for (let i = 0; i < segs; i++) {
    const a1 = (i / segs) * Math.PI * 2;
    const a2 = ((i + 1) / segs) * Math.PI * 2;
    const x1 = 16 + Math.cos(a1) * ringR;
    const z1 = 16 + Math.sin(a1) * ringR;
    const x2 = 16 + Math.cos(a2) * ringR;
    const z2 = 16 + Math.sin(a2) * ringR;
    buildBridge(map, x1, z1, x2, z2, 1.0, { width: 1, seed: 90 + i, yNoise: 0.25 });
  }
  buildBridge(map, 16, 13, 16, 19, 0.8, { width: 1, seed: 100, yNoise: 0.2 });
  map.setGoal(16, 16);
  return { startGX: 25, startGZ: 16, startDir: 'left' };
}

/**
 * Level 7 — TORRE. Central pillar + 30-step spiral staircase around it.
 * @type {BuildLevelFn}
 */
export function buildLevel7(map) {
  map.reset();
  buildTerrainIsland(map, { cx: 16, cz: 16, baseR: 5, peakY: 4.0, seed: 110, falloffPower: 1.2 });
  const stepsPerTurn = 10;
  const turns = 3;
  const totalSteps = stepsPerTurn * turns;
  for (let i = 0; i < totalSteps; i++) {
    const t = i / totalSteps;
    const angle = t * turns * Math.PI * 2;
    const r = 7 - t * 2;
    const cx = 16 + Math.cos(angle) * r;
    const cz = 16 + Math.sin(angle) * r;
    const y = -0.5 + t * 4.0;
    buildTerrainIsland(map, { cx, cz, baseR: 1.4, peakY: y, seed: 120 + i });
  }
  map.setGoal(16, 16);
  return { startGX: 4, startGZ: 28, startDir: 'right' };
}

/**
 * Level 8 — PILAR. Two stacked platforms (low and high) joined by a ramp.
 * @type {BuildLevelFn}
 */
export function buildLevel8(map) {
  map.reset();
  buildTerrainIsland(map, { cx: 10, cz: 16, baseR: 6, peakY: 0.3, seed: 200, falloffPower: 1.3 });
  buildTerrainIsland(map, { cx: 22, cz: 16, baseR: 5, peakY: 3.5, seed: 201, falloffPower: 1.3 });
  buildBridge(map, 14, 16, 18, 16, 1.8, { width: 2, seed: 210, yNoise: 0.2 });
  map.setGoal(22, 16);
  return { startGX: 8, startGZ: 16, startDir: 'right' };
}

/**
 * Level 9 — ASCENSO. Three stacked platforms connected by two ramps.
 * @type {BuildLevelFn}
 */
export function buildLevel9(map) {
  map.reset();
  buildTerrainIsland(map, { cx: 8, cz: 16, baseR: 4.5, peakY: 0.3, seed: 300, falloffPower: 1.3 });
  buildTerrainIsland(map, { cx: 16, cz: 16, baseR: 3.5, peakY: 2.5, seed: 301, falloffPower: 1.3 });
  buildTerrainIsland(map, { cx: 24, cz: 16, baseR: 3, peakY: 5.0, seed: 302, falloffPower: 1.3 });
  buildBridge(map, 11, 16, 14, 16, 1.4, { width: 2, seed: 310, yNoise: 0.2 });
  buildBridge(map, 18, 16, 22, 16, 3.7, { width: 2, seed: 311, yNoise: 0.2 });
  map.setGoal(24, 16);
  return { startGX: 7, startGZ: 16, startDir: 'right' };
}

/**
 * Level 10 — CIMA. Three stacked platforms with two paths to the mid-level.
 * @type {BuildLevelFn}
 */
export function buildLevel10(map) {
  map.reset();
  buildTerrainIsland(map, { cx: 8, cz: 10, baseR: 4, peakY: 0.3, seed: 400, falloffPower: 1.3 });
  buildTerrainIsland(map, { cx: 8, cz: 22, baseR: 3.5, peakY: 0.5, seed: 401, falloffPower: 1.3 });
  buildTerrainIsland(map, { cx: 18, cz: 16, baseR: 4, peakY: 2.5, seed: 402, falloffPower: 1.3 });
  buildTerrainIsland(map, { cx: 26, cz: 16, baseR: 3.5, peakY: 4.8, seed: 403, falloffPower: 1.3 });
  buildBridge(map, 10, 11, 16, 15, 1.3, { width: 2, seed: 410, yNoise: 0.2 });
  buildBridge(map, 10, 21, 16, 17, 1.3, { width: 2, seed: 411, yNoise: 0.2 });
  buildBridge(map, 20, 16, 24, 16, 3.5, { width: 2, seed: 412, yNoise: 0.2 });
  buildBridge(map, 8, 12, 8, 20, 0.3, { width: 2, seed: 413, yNoise: 0.15 });
  map.setGoal(26, 16);
  return { startGX: 7, startGZ: 10, startDir: 'right' };
}

/**
 * Build a procedural "daily" level: a ring of `N` islands joined into a
 * loop, with the goal on the last island.
 *
 * @param {import('./HeightMap.js').default} map - Heightmap to populate.
 * @param {number} seed - Daily seed; influences island count and placement.
 * @returns {LevelStart} Spawn on the first island, facing right.
 */
export function buildDailyLevel(map, seed) {
  map.reset();
  const N = 5 + (seed % 3);
  const islands = [];
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2 + (seed % 7) * 0.1;
    const r = 8 + ((i * 3) % 5);
    const cx = 16 + Math.cos(angle) * r;
    const cz = 16 + Math.sin(angle) * r;
    const peakY = 1 + ((i * 0.7 + seed * 0.01) % 3);
    buildTerrainIsland(map, {
      cx,
      cz,
      baseR: 3.5 + (i % 2),
      peakY,
      seed: seed + i * 17,
      falloffPower: 1.3,
    });
    islands.push({ cx, cz });
  }
  for (let i = 0; i < islands.length; i++) {
    const a = islands[i],
      b = islands[(i + 1) % islands.length];
    buildBridge(map, a.cx, a.cz, b.cx, b.cz, 0.5, { width: 1, seed: seed + i * 31, yNoise: 0.3 });
  }
  const goalI = islands.length - 1;
  const gx = Math.max(0, Math.min(31, Math.round(islands[goalI].cx)));
  const gz = Math.max(0, Math.min(31, Math.round(islands[goalI].cz)));
  map.setGoal(gx, gz);
  const sx = Math.max(0, Math.min(31, Math.round(islands[0].cx)));
  const sz = Math.max(0, Math.min(31, Math.round(islands[0].cz)));
  return { startGX: sx, startGZ: sz, startDir: 'right' };
}

/**
 * Dispatch to the builder for level `n`. The index is wrapped mod 10 so
 * values outside `[1, 10]` (including negatives) work.
 *
 * @param {import('./HeightMap.js').default} map
 * @param {number} n - 1-based level number.
 * @returns {LevelStart}
 */
export function buildLevel(map, n) {
  const idx = (((n - 1) % 10) + 10) % 10;
  return BUILDERS[idx](map);
}

/** @type {BuildLevelFn[]} Ordered list of all 10 story level builders. */
const BUILDERS = [
  buildLevel1,
  buildLevel2,
  buildLevel3,
  buildLevel4,
  buildLevel5,
  buildLevel6,
  buildLevel7,
  buildLevel8,
  buildLevel9,
  buildLevel10,
];
