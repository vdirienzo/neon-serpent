/**
 * @fileoverview BFS reachability on the height-map grid. Computes the set
 * of solid cells reachable from a starting cell, respecting STEP_CLIMB
 * (max Y delta the snake can traverse).
 */
import { GRID, STEP_CLIMB } from '../config.js';

/**
 * Compute all solid cells reachable from (sx, sz) via BFS, respecting
 * STEP_CLIMB for vertical transitions.
 *
 * @param {import('./HeightMap.js').default} map - The height-map.
 * @param {number} sx - Start cell X.
 * @param {number} sz - Start cell Z.
 * @returns {Set<string>} Set of "x,z" strings for reachable cells.
 */
export function computeReachable(map, sx, sz) {
  const visited = new Set();
  const queue = [{ gx: sx, gz: sz }];
  visited.add(sx + ',' + sz);

  while (queue.length) {
    const { gx, gz } = queue.shift();
    const hHere = map.heightAt(gx, gz);

    for (const [dx, dz] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      const nx = gx + dx,
        nz = gz + dz;
      if (nx < 0 || nx >= GRID || nz < 0 || nz >= GRID) continue;
      const key = nx + ',' + nz;
      if (visited.has(key)) continue;
      if (!map.isSolid(nx, nz)) continue;
      const hNext = map.heightAt(nx, nz);
      if (Math.abs(hNext - hHere) <= STEP_CLIMB) {
        visited.add(key);
        queue.push({ gx: nx, gz: nz });
      }
    }
  }
  return visited;
}

/**
 * Compute all solid cells from which the goal is reachable via BFS.
 * This is the reverse of `computeReachable` — it finds cells that CAN
 * reach the target, not cells reachable FROM the target.
 *
 * @param {import('./HeightMap.js').default} map - The height-map.
 * @param {number} gx - Goal cell X.
 * @param {number} gz - Goal cell Z.
 * @returns {Set<string>} Set of "x,z" strings from which the goal is reachable.
 */
export function computeGoalReachable(map, gx, gz) {
  const visited = new Set();
  const queue = [{ gx, gz }];
  visited.add(gx + ',' + gz);

  while (queue.length) {
    const { gx: cx, gz: cz } = queue.shift();
    const hHere = map.heightAt(cx, cz);

    for (const [dx, dz] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      const nx = cx + dx,
        nz = cz + dz;
      if (nx < 0 || nx >= GRID || nz < 0 || nz >= GRID) continue;
      const key = nx + ',' + nz;
      if (visited.has(key)) continue;
      if (!map.isSolid(nx, nz)) continue;
      const hNext = map.heightAt(nx, nz);
      if (Math.abs(hHere - hNext) <= STEP_CLIMB) {
        visited.add(key);
        queue.push({ gx: nx, gz: nz });
      }
    }
  }
  return visited;
}
