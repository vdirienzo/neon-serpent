/**
 * @fileoverview Single-cell collision check used outside the snake step
 * pipeline (e.g. for ad-hoc queries from UI / input layers).
 */
import { GRID, DEATH } from '../config.js';

/**
 * Check whether the head cell is walkable. Out-of-bounds or non-solid cells
 * count as a void collision (the snake falls off the world).
 *
 * @param {{ gx: number, gz: number }} head - Cell to test.
 * @param {import('../world/HeightMap.js').default} map - Heightmap to test against.
 * @returns {{ collided: boolean, cause?: 'void' }}
 *   `collided: true` with `cause: 'void'` if the cell is not solid; otherwise
 *   `{ collided: false }`.
 *
 * @example
 * if (checkCollisions(snake.head(), map).collided) endGame();
 */
export function checkCollisions(head, map) {
  if (!map.isSolid(head.gx, head.gz)) {
    return { collided: true, cause: DEATH.VOID };
  }
  return { collided: false };
}
