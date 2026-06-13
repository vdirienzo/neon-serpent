/**
 * @fileoverview Procedural island + bridge builders used by every level.
 * Heights are driven by FBM noise (see `./noise.js`).
 */
import { GRID, Y_WATER, FBM_SEED_BASE } from '../config.js';
import { fbm } from './noise.js';

/**
 * @typedef {Object} IslandPeak
 * @property {number} [dx=0] - Offset from island center, in cells.
 * @property {number} [dz=0] - Offset from island center, in cells.
 * @property {number} [mult=1] - Height multiplier for this peak.
 * @property {number} [rMult=0.7] - Radius multiplier for this peak's falloff.
 */

/**
 * @typedef {Object} IslandOpts
 * @property {number} cx - Center X in cells.
 * @property {number} cz - Center Z in cells.
 * @property {number} baseR - Base radius in cells.
 * @property {number} peakY - Peak Y in world units.
 * @property {number} seed - Per-island seed.
 * @property {number} [falloffPower=1.4] - Falloff exponent; higher = sharper cliff.
 * @property {number} [detail=0.25] - FBM detail noise strength.
 * @property {IslandPeak[]} [peaks] - Optional peaks overriding the default single peak.
 */

/**
 * Build a noise-shaped island onto the given heightmap. Existing cells are
 * preserved unless the new height is greater.
 *
 * @param {import('./HeightMap.js').default} map - Target heightmap.
 * @param {IslandOpts} opts - Island configuration.
 * @returns {void}
 */
export function buildTerrainIsland(map, opts) {
  const { cx, cz, baseR, peakY, seed, falloffPower, detail, peaks } = opts;
  const _falloff = falloffPower != null ? falloffPower : 1.4;
  const _detail = detail != null ? detail : 0.25;
  const _peaks = peaks || [{ dx: 0, dz: 0, mult: 1.0, rMult: 0.7 }];
  const s = ((seed | 0) + FBM_SEED_BASE) | 0;
  const xMin = Math.max(0, Math.floor(cx - baseR * 1.4));
  const xMax = Math.min(GRID - 1, Math.ceil(cx + baseR * 1.4));
  const zMin = Math.max(0, Math.floor(cz - baseR * 1.4));
  const zMax = Math.min(GRID - 1, Math.ceil(cz + baseR * 1.4));
  for (let x = xMin; x <= xMax; x++) {
    for (let z = zMin; z <= zMax; z++) {
      const dx = x - cx,
        dz = z - cz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const rNoise = fbm(x * 0.13, z * 0.13, s) * 0.4 + 0.8;
      const localR = baseR * rNoise;
      const t = dist / localR;
      if (t > 1.25) continue;
      const falloff = Math.pow(Math.max(0, 1 - t), _falloff);
      let peakMult = 0;
      for (const p of _peaks) {
        const pdx = x - (cx + (p.dx || 0));
        const pdz = z - (cz + (p.dz || 0));
        const pd = Math.sqrt(pdx * pdx + pdz * pdz);
        const pr = localR * (p.rMult != null ? p.rMult : 0.7);
        const pm = Math.max(0, 1 - pd / pr);
        peakMult = Math.max(peakMult, (p.mult != null ? p.mult : 1) * pm);
      }
      const dN = fbm(x * 0.45, z * 0.45, s + 100) - 0.5;
      const y = peakY * falloff * (0.45 + 0.55 * peakMult) + dN * _detail * peakY * falloff;
      if (y <= Y_WATER) continue;
      const existing = map.cells[x][z];
      if (!existing.solid || y > existing.y) {
        map.cells[x][z] = { y, solid: true, goal: existing.goal || false };
      }
    }
  }
}

/**
 * @typedef {Object} BridgeOpts
 * @property {number} [width=1] - Half-width of the bridge in cells.
 * @property {number} [seed=0] - Per-bridge seed.
 * @property {number} [yNoise=0.4] - Vertical FBM noise amplitude.
 * @property {number} [edgeDip=0.25] - Y dip applied to the bridge ends.
 */

/**
 * Carve a noisy bridge from cell `(x0, z0)` to `(x1, z1)`. Both endpoints
 * must be inside the grid.
 *
 * @param {import('./HeightMap.js').default} map - Target heightmap.
 * @param {number} x0 - Start X in cells.
 * @param {number} z0 - Start Z in cells.
 * @param {number} x1 - End X in cells.
 * @param {number} z1 - End Z in cells.
 * @param {number} yBase - Base Y for the bridge centerline.
 * @param {BridgeOpts} [opts] - Bridge configuration.
 * @returns {void}
 */
export function buildBridge(map, x0, z0, x1, z1, yBase, opts) {
  opts = opts || {};
  const width = opts.width != null ? opts.width : 1;
  const seed = ((opts.seed != null ? opts.seed : 0) + FBM_SEED_BASE) | 0;
  const yNoise = opts.yNoise != null ? opts.yNoise : 0.4;
  const edgeDip = opts.edgeDip != null ? opts.edgeDip : 0.25;
  const dx = x1 - x0,
    dz = z1 - z0;
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 0.5) return;
  const steps = Math.max(2, Math.ceil(len * 2));
  const nx = -dz / len,
    nz = dx / len;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const cx = x0 + dx * t;
    const cz = z0 + dz * t;
    const edgeT = Math.min(t, 1 - t) * 2;
    for (let w = -width; w <= width; w++) {
      const x = Math.round(cx + nx * w);
      const z = Math.round(cz + nz * w);
      if (x < 0 || x >= GRID || z < 0 || z >= GRID) continue;
      const wFalloff = 1 - (Math.abs(w) / (width + 1)) * 0.3;
      const n = fbm(x * 0.35, z * 0.35, seed) - 0.5;
      const y = yBase * wFalloff - (1 - edgeT) * edgeDip + n * yNoise;
      if (y <= Y_WATER) continue;
      const existing = map.cells[x][z];
      if (!existing.solid || y > existing.y) {
        map.cells[x][z] = { y, solid: true, goal: existing.goal || false };
      }
    }
  }
}
