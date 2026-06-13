/**
 * @fileoverview Shared neon palette and tiny `THREE.Color` helpers.
 *
 * Exposes a frozen `COLORS` map of the project palette plus three thin
 * wrappers over `THREE.Color` to keep call sites consistent.
 */
import * as THREE from 'three';

/**
 * Frozen palette of named `THREE.Color` instances used throughout the game.
 * @type {Readonly<{
 *   BG: THREE.Color,
 *   CYAN: THREE.Color,
 *   MAG: THREE.Color,
 *   GOLD: THREE.Color,
 *   GREEN: THREE.Color,
 *   VIO: THREE.Color,
 *   WHITE: THREE.Color,
 *   ORANGE: THREE.Color,
 *   RED: THREE.Color
 * }>}
 */
export const COLORS = Object.freeze({
  BG: new THREE.Color(0x04060e),
  CYAN: new THREE.Color(0x00f6ff),
  MAG: new THREE.Color(0xff2bd6),
  GOLD: new THREE.Color(0xffc857),
  GREEN: new THREE.Color(0x39ff14),
  VIO: new THREE.Color(0xb026ff),
  WHITE: new THREE.Color(0xffffff),
  ORANGE: new THREE.Color(0xff7a1a),
  RED: new THREE.Color(0xff2a4a),
});

/**
 * Build a new `THREE.Color` from a hex literal or CSS color string.
 *
 * @param {number|string} hex - Hex (`0xRRGGBB`) or CSS string (e.g. `'#ff00aa'`).
 * @returns {THREE.Color} A fresh, mutable color instance.
 *
 * @example
 * const tint = hexToColor(0xff2bd6);
 */
export function hexToColor(hex) {
  return new THREE.Color(hex);
}

/**
 * Return a deep copy of a `THREE.Color`. Useful when reusing a color from
 * `COLORS` (which callers should not mutate).
 *
 * @param {THREE.Color} c - Source color to copy.
 * @returns {THREE.Color} A new color with identical RGB components.
 */
export function cloneColor(c) {
  return c.clone();
}

/**
 * Linearly interpolate between two colors.
 *
 * @param {THREE.Color} a - Start color.
 * @param {THREE.Color} b - End color.
 * @param {number} t - Interpolation factor, typically `[0, 1]`.
 * @returns {THREE.Color} A new color at `a + t * (b - a)`.
 */
export function lerpColors(a, b, t) {
  return new THREE.Color().lerpColors(a, b, t);
}
