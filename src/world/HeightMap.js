/**
 * @fileoverview Heightmap data model — a `GRID x GRID` array of cells that
 * drives terrain, collision, lethality, and the goal beacon. Pure data
 * structure; no Three.js dependencies.
 */
import { GRID, Y_OCEAN, Y_WATER, STEP_CLIMB } from '../config.js';

/**
 * A single grid cell.
 * @typedef {Object} HeightCell
 * @property {number} y - World Y of the cell top.
 * @property {boolean} solid - Whether the cell is walkable terrain.
 * @property {boolean} goal - Whether the cell hosts the level goal.
 * @property {boolean} danger - Whether the cell is lethal (void, perimeter, or steep).
 */

/**
 * The level heightmap. Owns the `cells[GRID][GRID]` array and exposes
 * query / mutation methods. Always re-`reset()` between levels.
 */
export class HeightMap {
  /** Create a new heightmap, initialized to a flat solid surface at `y = -2.4`. */
  constructor() {
    /** @type {HeightCell[][]} */
    this.cells = [];
    for (let x = 0; x < GRID; x++) {
      this.cells[x] = [];
      for (let z = 0; z < GRID; z++) {
        this.cells[x][z] = { y: -2.4, solid: true, goal: false, danger: false };
      }
    }
  }

  /**
   * Reset every cell to a flat solid surface. Goal / danger flags are cleared.
   * @returns {void}
   */
  reset() {
    for (let x = 0; x < GRID; x++) {
      for (let z = 0; z < GRID; z++) {
        this.cells[x][z] = { y: -2.4, solid: true, goal: false, danger: false };
      }
    }
  }

  /**
   * Overwrite a single cell. Out-of-bounds writes are silently ignored.
   *
   * @param {number} x - Grid X in `[0, GRID)`.
   * @param {number} z - Grid Z in `[0, GRID)`.
   * @param {number} y - World Y.
   * @param {boolean} solid - Whether the cell is walkable.
   * @param {boolean} [goal=false] - Whether this cell is the goal.
   * @param {boolean} [danger=false] - Whether this cell is lethal.
   * @returns {void}
   */
  setCell(x, z, y, solid, goal = false, danger = false) {
    if (x < 0 || x >= GRID || z < 0 || z >= GRID) return;
    this.cells[x][z] = { y, solid, goal, danger };
  }

  /**
   * World Y of the surface at a cell. Returns `Y_OCEAN` for non-solid or
   * out-of-bounds cells.
   *
   * @param {number} x
   * @param {number} z
   * @returns {number}
   */
  heightAt(x, z) {
    if (x < 0 || x >= GRID || z < 0 || z >= GRID) return Y_OCEAN;
    return this.cells[x][z].solid ? this.cells[x][z].y : Y_OCEAN;
  }

  /**
   * Whether the cell is walkable solid terrain. Out-of-bounds returns `false`.
   *
   * @param {number} x
   * @param {number} z
   * @returns {boolean}
   */
  isSolid(x, z) {
    if (x < 0 || x >= GRID || z < 0 || z >= GRID) return false;
    return this.cells[x][z].solid;
  }

  /**
   * Whether the cell hosts the goal. Out-of-bounds returns `false`.
   *
   * @param {number} x
   * @param {number} z
   * @returns {boolean}
   */
  isGoal(x, z) {
    if (x < 0 || x >= GRID || z < 0 || z >= GRID) return false;
    return this.cells[x][z].goal;
  }

  /**
   * Whether the cell is marked dangerous (void, perimeter, or steep).
   * Out-of-bounds returns `false`.
   *
   * @param {number} x
   * @param {number} z
   * @returns {boolean}
   */
  isDanger(x, z) {
    if (x < 0 || x >= GRID || z < 0 || z >= GRID) return false;
    return !!this.cells[x][z].danger;
  }

  /**
   * Mark a cell as dangerous. Out-of-bounds writes are ignored.
   *
   * @param {number} x
   * @param {number} z
   * @returns {void}
   */
  markDanger(x, z) {
    if (x < 0 || x >= GRID || z < 0 || z >= GRID) return;
    this.cells[x][z].danger = true;
  }

  /**
   * Recompute the `danger` flag for every cell based on the current heights.
   * A cell is dangerous if it is not solid, sits on the grid perimeter, or
   * has a neighbor whose Y delta exceeds `STEP_CLIMB`.
   *
   * @returns {void}
   */
  computeLethality() {
    for (let x = 0; x < GRID; x++) {
      for (let z = 0; z < GRID; z++) {
        this.cells[x][z].danger = false;
      }
    }
    for (let x = 0; x < GRID; x++) {
      for (let z = 0; z < GRID; z++) {
        const c = this.cells[x][z];
        if (!c.solid) {
          c.danger = true;
          continue;
        }
        if (x === 0 || x === GRID - 1 || z === 0 || z === GRID - 1) {
          c.danger = true;
          continue;
        }
        const myY = c.y;
        const nbrs = [
          [x - 1, z],
          [x + 1, z],
          [x, z - 1],
          [x, z + 1],
        ];
        for (const [nx, nz] of nbrs) {
          if (nx < 0 || nx >= GRID || nz < 0 || nz >= GRID) continue;
          if (Math.abs(myY - this.cells[nx][nz].y) > STEP_CLIMB) {
            c.danger = true;
            break;
          }
        }
      }
    }
  }

  /**
   * Place the goal at the given cell, snapping to the nearest solid cell
   * within a small radius. The chosen cell is guaranteed to be solid and
   * safe (its `danger` flag is cleared).
   *
   * @param {number} x - Preferred X.
   * @param {number} z - Preferred Z.
   * @returns {void}
   */
  setGoal(x, z) {
    const snap = this.findNearestSolid(x, z, 5) || { gx: x, gz: z };
    this.cells[snap.gx][snap.gz].goal = true;
    this.cells[snap.gx][snap.gz].danger = false;
  }

  /**
   * Find the nearest solid cell within `maxR` cells of `(gx, gz)`.
   * Searches square rings from radius 1 outward.
   *
   * @param {number} gx - Origin X.
   * @param {number} gz - Origin Z.
   * @param {number} [maxR=6] - Maximum search radius.
   * @returns {{ gx: number, gz: number } | null} Found cell, or `null` if none.
   */
  findNearestSolid(gx, gz, maxR = 6) {
    if (this.isSolid(gx, gz)) return { gx, gz };
    for (let r = 1; r <= maxR; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
          const x = gx + dx,
            z = gz + dz;
          if (x >= 0 && x < GRID && z >= 0 && z < GRID && this.isSolid(x, z)) {
            return { gx: x, gz: z };
          }
        }
      }
    }
    return null;
  }

  /**
   * Aggregate statistics over all cells.
   *
   * @returns {{ minY: number, maxY: number, solidCount: number }}
   *   Min/max Y over solid cells, plus the solid-cell count. If no cells are
   *   solid, returns `minY = maxY = -2.4` and `solidCount = 0`.
   */
  bounds() {
    let minY = Infinity,
      maxY = -Infinity,
      solidCount = 0;
    for (let x = 0; x < GRID; x++) {
      for (let z = 0; z < GRID; z++) {
        const c = this.cells[x][z];
        if (c.solid) {
          if (c.y < minY) minY = c.y;
          if (c.y > maxY) maxY = c.y;
          solidCount++;
        }
      }
    }
    if (solidCount === 0) {
      minY = -2.4;
      maxY = -2.4;
    }
    return { minY, maxY, solidCount };
  }
}
