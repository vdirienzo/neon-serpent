/**
 * @fileoverview Pure 2D noise utilities. No external dependencies.
 *
 * Provides deterministic value noise and fractional Brownian motion (FBM) used
 * to drive terrain shape. Seeds are 32-bit integers combined with
 * `FBM_SEED_BASE` at the caller.
 */
import { lerp } from '../core/Math.js';

/**
 * Stable integer hash for a 2D grid coordinate and seed. Uses a multiply-xor
 * pattern tuned for a uniform distribution in `[0, 1)`.
 *
 * @param {number} x - Integer-ish grid X (coerced with `| 0`).
 * @param {number} z - Integer-ish grid Z.
 * @param {number} seed - Per-level seed integer.
 * @returns {number} Pseudo-random value in `[0, 1)`.
 */
export function hash2D(x, z, seed) {
  let h = (x | 0) * 374761393 + (z | 0) * 668265263 + (seed | 0) * 1442695040;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967295;
}

/**
 * Quintic smoothstep `3t^2 - 2t^3`. Re-exposed from `core/Math.js` to keep
 * `noise.js` self-contained.
 *
 * @param {number} t - Interpolation parameter, expected in `[0, 1]`.
 * @returns {number} Smoothed value.
 */
export function smoothstepN(t) {
  return t * t * (3 - 2 * t);
}

/**
 * Bilinearly interpolated value noise on a 2D grid, smoothed at the
 * cell boundaries with `smoothstepN`.
 *
 * @param {number} x - Sample X coordinate.
 * @param {number} z - Sample Z coordinate.
 * @param {number} seed - Per-level seed integer.
 * @returns {number} Value in `[0, 1)`.
 */
export function valueNoise(x, z, seed) {
  const ix = Math.floor(x),
    iz = Math.floor(z);
  const fx = x - ix,
    fz = z - iz;
  const a = hash2D(ix, iz, seed);
  const b = hash2D(ix + 1, iz, seed);
  const c = hash2D(ix, iz + 1, seed);
  const d = hash2D(ix + 1, iz + 1, seed);
  const ux = smoothstepN(fx),
    uz = smoothstepN(fz);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uz);
}

/**
 * Fractional Brownian motion (sum of octaves of value noise). Each octave
 * doubles the frequency and halves the amplitude.
 *
 * @param {number} x - Sample X coordinate.
 * @param {number} z - Sample Z coordinate.
 * @param {number} seed - Per-level seed integer; offset by `i * 31` per octave.
 * @param {number} [octaves=4] - Number of summed octaves.
 * @returns {number} Normalized value in `[0, 1)` (sum divided by total amplitude).
 */
export function fbm(x, z, seed, octaves = 4) {
  let v = 0,
    amp = 1,
    freq = 1,
    max = 0;
  for (let i = 0; i < octaves; i++) {
    v += valueNoise(x * freq, z * freq, (seed + i * 31) | 0) * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2.0;
  }
  return v / max;
}
