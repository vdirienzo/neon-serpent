/**
 * @fileoverview Top-level state machine: a single global `current` value from
 * `STATE` plus a listener set. Every state change emits `EVT.STATE_CHANGE`
 * on the bus for decoupled consumers.
 */
import { STATE, EVT } from '../config.js';
import { emit, on } from '../core/EventBus.js';

/** @type {string} Current state from `STATE`. */
let current = STATE.LOADING;

/** @type {Set<(s: string) => void>} Local subscribers (separate from the bus). */
const listeners = new Set();

/**
 * @returns {string} The current state value (one of `STATE`).
 */
export function getState() {
  return current;
}

/**
 * Update the current state. No-op if the new value equals the current one.
 * Every change fires local subscribers and emits `EVT.STATE_CHANGE` on the
 * event bus.
 *
 * @param {string} s - New state value (typically a key from `STATE`).
 * @returns {void}
 */
export function setState(s) {
  if (current === s) return;
  current = s;
  for (const fn of listeners) fn(s);
  emit(EVT.STATE_CHANGE, s);
}

/**
 * Subscribe directly to state changes. Returns an unsubscribe function.
 * Prefer the event bus (`on(EVT.STATE_CHANGE, fn)`) for new code.
 *
 * @param {(s: string) => void} fn - Handler invoked with the new state.
 * @returns {() => void} Unsubscribe.
 */
export function onStateChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Test whether the game is "in play" — counts countdown, playing, and
 * dying states as live.
 *
 * @returns {boolean} `true` if the current state is `PLAYING`, `COUNTDOWN`,
 *   or `DYING`.
 */
export function isPlaying() {
  return current === STATE.PLAYING || current === STATE.COUNTDOWN || current === STATE.DYING;
}
