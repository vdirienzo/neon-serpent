/**
 * @fileoverview Pulses the red edge opacity of cells adjacent to the snake
 * head that are marked as "danger" (void, climb, or grid perimeter). The
 * non-adjacent danger cells keep a constant red edge at full opacity.
 */
import { clamp } from '../core/Math.js';

/** Four cardinal offsets. */
const ADJACENT = [
  { x: 1, z: 0 },
  { x: -1, z: 0 },
  { x: 0, z: 1 },
  { x: 0, z: -1 },
];

/** Resting opacity for non-adjacent danger cells. */
const BASE_OPACITY = 0.9;

/** Minimum pulse opacity for adjacent cells. */
const PULSE_MIN = 0.4;

/** Maximum pulse opacity for adjacent cells. */
const PULSE_MAX = 1.0;

/** Pulse angular frequency in radians per second. */
const PULSE_SPEED = 4.0;

/**
 * Build a `"gx,gz"` cell key for `Map` lookups.
 * @param {number} gx
 * @param {number} gz
 * @returns {string}
 */
function cellKey(gx, gz) {
  return `${gx},${gz}`;
}

/**
 * Update the danger-edge opacities for the current frame. Adjacent cells
 * (Manhattan distance 1 from the head) pulse; the rest stay at
 * `BASE_OPACITY`. Iterates the entire `dangerEdges` map; safe to call every
 * frame because the map is small.
 *
 * @param {import('../entities/Snake.js').Snake} snake - The snake; uses
 *   `snake.cells[0]` as the head.
 * @param {import('../world/HeightMap.js').default} map - Heightmap used to
 *   test which neighbors are dangerous.
 * @param {import('../world/TerrainMesh.js').default} terrainMesh - Terrain
 *   renderer that owns the `dangerEdges` map.
 * @param {number} t - Elapsed time in seconds.
 * @returns {void}
 */
export function updateWarning(snake, map, terrainMesh, t) {
  if (!snake || !snake.cells || snake.cells.length === 0) return;
  if (!terrainMesh || !terrainMesh.dangerEdges) return;

  const head = snake.cells[0];
  const adjacentKeys = new Set();
  for (const d of ADJACENT) {
    const ax = head.gx + d.x;
    const az = head.gz + d.z;
    if (map.isDanger(ax, az)) {
      adjacentKeys.add(cellKey(ax, az));
    }
  }

  const k = 0.5 + 0.5 * Math.sin(t * PULSE_SPEED);
  const pulseOpacity = PULSE_MIN + (PULSE_MAX - PULSE_MIN) * k;

  for (const [key, mat] of terrainMesh.dangerEdges) {
    if (adjacentKeys.has(key)) {
      mat.opacity = pulseOpacity;
    } else {
      mat.opacity = BASE_OPACITY;
    }
  }
}
