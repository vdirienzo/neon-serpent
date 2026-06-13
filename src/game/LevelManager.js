/**
 * @fileoverview Glue layer that loads a level (1–10 or daily) into the
 * context's heightmap + scene objects, and remembers the last start/goal
 * cells for pickup placement and reachability tests.
 */
import { GRID, LEVEL_PALETTES, MODE } from '../config.js';
import { buildLevel, buildDailyLevel } from '../world/LevelBuilder.js';
import { getMode } from './Modes.js';
import { getDailySeed } from './Modes.js';

/**
 * @typedef {Object} LevelContext
 * @property {import('../world/HeightMap.js').default} map - The heightmap.
 * @property {import('../world/TerrainMesh.js').default} terrainMesh - Terrain renderer.
 * @property {import('../world/AmbientParticles.js').default} ambient - Ambient particles.
 * @property {import('../world/Goal.js').default} goal - Goal beacon.
 * @property {import('../world/StartMarker.js').default} startMarker - Start marker.
 * @property {{ primary: number, goal: number, name?: string }} levelPalette - Active palette.
 * @property {{ gx: number, gz: number }} lastStart - Last start cell.
 * @property {{ gx: number, gz: number }} lastGoal - Last goal cell.
 */

/**
 * Coordinates level loading. Call `load(n)` before each level; it builds the
 * heightmap via the appropriate builder, swaps the palette, places the
 * goal + start marker, and resolves the start/goal cells.
 */
export class LevelManager {
  /**
   * @param {LevelContext} ctx - Shared game context.
   */
  constructor(ctx) {
    /** @type {LevelContext} */
    this.ctx = ctx;
  }

  /**
   * Load level `n` into the context. `n > 10` is treated as an infinite run
   * (wraps back to `1`-`10` via mod 10 after subtracting 10).
   *
   * @param {number} n - 1-based level number.
   * @returns {{ startGX: number, startGZ: number, startDir: string }} The
   *   spawn position and initial direction.
   */
  load(n) {
    const c = this.ctx;
    const isInfinite = n > 10;
    const target = isInfinite ? ((n - 11) % 10) + 1 : n;
    let cfg;
    if (getMode() === MODE.DAILY) {
      cfg = buildDailyLevel(c.map, getDailySeed());
      c.levelPalette = LEVEL_PALETTES[0];
    } else {
      cfg = buildLevel(c.map, target);
      c.levelPalette = LEVEL_PALETTES[(((n - 1) % 10) + 10) % 10];
    }
    c.terrainMesh.build(c.map, c.levelPalette.primary, c.levelPalette.goal);
    c.ambient.build(c.map);
    c.goal.set(
      cfg.startGX,
      cfg.startGZ,
      c.map.heightAt(cfg.startGX, cfg.startGZ),
      c.levelPalette.goal
    );
    c.startMarker.set(
      cfg.startGX,
      cfg.startGZ,
      c.map.heightAt(cfg.startGX, cfg.startGZ),
      c.levelPalette.primary
    );
    c.lastStart = { gx: cfg.startGX, gz: cfg.startGZ };
    c.lastGoal = { gx: cfg.startGX, gz: cfg.startGZ };
    for (let x = 0; x < GRID; x++) {
      for (let z = 0; z < GRID; z++) {
        if (c.map.cells[x][z].goal) c.lastGoal = { gx: x, gz: z };
      }
    }
    return cfg;
  }
}
