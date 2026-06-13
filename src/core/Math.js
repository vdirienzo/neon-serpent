/**
 * @fileoverview Pure math utilities with no dependencies. Used everywhere
 * (snake movement, camera damping, animation tweens, level generation).
 */
import { HALF } from '../config.js';

/**
 * Clamp a number into a closed interval.
 *
 * @param {number} v - Value to clamp.
 * @param {number} a - Inclusive lower bound.
 * @param {number} b - Inclusive upper bound.
 * @returns {number} `v` constrained to `[a, b]`.
 */
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * Linear interpolation between two scalars.
 *
 * @param {number} a - Start value.
 * @param {number} b - End value.
 * @param {number} t - Interpolation factor (`0` returns `a`, `1` returns `b`).
 * @returns {number} `a + (b - a) * t`.
 */
export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Framerate-independent exponential damping. `lambda` higher = snappier.
 *
 * Equivalent to moving `a` toward `b` by the same proportion of the remaining
 * distance that would occur over `dt` seconds in a continuous exponential decay.
 *
 * @param {number} a - Current value.
 * @param {number} b - Target value.
 * @param {number} lambda - Rate constant in 1/seconds.
 * @param {number} dt - Time step in seconds.
 * @returns {number} The eased value, closer to `b` for larger `lambda * dt`.
 */
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));

/**
 * Pick a uniformly random element from an array.
 *
 * @template T
 * @param {T[]} arr - Non-empty array.
 * @returns {T} A random entry.
 */
export const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Uniformly random float in `[a, b)`.
 *
 * @param {number} a - Inclusive lower bound.
 * @param {number} b - Exclusive upper bound.
 * @returns {number} Sample from the half-open interval.
 */
export const rand = (a, b) => a + Math.random() * (b - a);

/**
 * Uniformly random integer in `[a, b)`.
 *
 * @param {number} a - Inclusive lower lower bound.
 * @param {number} b - Exclusive upper bound.
 * @returns {number} Integer sample.
 */
export const randi = (a, b) => Math.floor(rand(a, b));

/**
 * Quintic-style smoothstep (`3t^2 - 2t^3`) clamped to `[0, 1]`.
 * Useful for easing animation `t` values.
 *
 * @param {number} t - Normalized time in `[0, 1]`.
 * @returns {number} Smoothed `t`.
 */
export const smoothstepN = (t) => t * t * (3 - 2 * t);

/**
 * Convert a grid cell index to a world-space coordinate, centering the grid
 * on the origin (so cell `0` is at `-HALF` and the max cell is at `+HALF`).
 *
 * @param {number} g - Integer grid index in `[0, GRID - 1]`.
 * @returns {number} World coordinate in the same units as `CELL`.
 */
export const g2w = (g) => g - HALF;

/**
 * Shortest signed angular distance from `a` to `b`, wrapped into `[-PI, PI]`.
 *
 * @param {number} a - Source angle in radians.
 * @param {number} b - Target angle in radians.
 * @returns {number} Delta in `[-PI, PI]`.
 */
export function angleDelta(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
