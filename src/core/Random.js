/**
 * @fileoverview Mulberry32 — a small, fast, deterministic 32-bit PRNG.
 * Reference: https://stackoverflow.com/a/47593316
 *
 * Use `createRNG(seed)` to obtain a closure that produces reproducible
 * uniform floats in `[0, 1)`, then feed that closure to `randRange`,
 * `randInt`, and `randChoice`.
 */

/**
 * Create a deterministic PRNG seeded from the given 32-bit integer.
 *
 * @param {number} seed - Any 32-bit unsigned integer; coerced via `>>> 0`.
 * @returns {() => number} A function that, on each call, returns the next
 *   uniformly distributed float in `[0, 1)`.
 *
 * @example
 * const rng = createRNG(42);
 * const x = rng();      // deterministic
 * const y = randInt(rng, 0, 10);
 */
export function createRNG(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Uniformly random float in `[a, b)` using the supplied RNG.
 *
 * @param {() => number} rng - PRNG function from `createRNG`.
 * @param {number} a - Inclusive lower bound.
 * @param {number} b - Exclusive upper bound.
 * @returns {number} Sample from the half-open interval.
 */
export function randRange(rng, a, b) {
  return a + rng() * (b - a);
}

/**
 * Uniformly random integer in `[a, b)` using the supplied RNG.
 *
 * @param {() => number} rng - PRNG function from `createRNG`.
 * @param {number} a - Inclusive lower bound.
 * @param {number} b - Exclusive upper bound.
 * @returns {number} Integer sample.
 */
export function randInt(rng, a, b) {
  return Math.floor(a + rng() * (b - a));
}

/**
 * Pick a uniformly random element from an array using the supplied RNG.
 *
 * @template T
 * @param {() => number} rng - PRNG function from `createRNG`.
 * @param {T[]} arr - Non-empty array.
 * @returns {T} A random entry.
 */
export function randChoice(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}
