/**
 * @fileoverview Lightweight assertion helper for invariant checks.
 */

/**
 * Throws an Error if the condition is falsy. Used to enforce pre/post-conditions
 * at module boundaries in place of a full assertion library.
 *
 * @param {*} cond - The condition to test. Anything truthy passes.
 * @param {string} [msg] - Optional message attached to the thrown Error.
 * @returns {void}
 * @throws {Error} When `cond` is falsy.
 *
 * @example
 * assert(player.health > 0, 'player must be alive');
 */
export function assert(cond, msg) {
  if (!cond) throw new Error('Assertion failed: ' + (msg || ''));
}
