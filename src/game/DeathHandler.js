/**
 * @fileoverview Manages the brief `DYING` state after the snake dies, while
 * the death animation plays. Tracks the cause and elapsed time, then
 * signals completion once the animation duration elapses.
 */
import { setState } from './GameState.js';
import { STATE } from '../config.js';
import { emit } from '../core/EventBus.js';
import { EVT } from '../config.js';

/** Death cause, or `null` if no death is in progress. */
let dyingFrom = null;

/** Elapsed time since `startDying` was called, in seconds. */
let dyingT = 0;

/** `performance.now()` value at the moment `startDying` was called. */
let lastDyingStartT = 0;

/** Death animation duration in seconds. */
const DIE_DUR = 1.1;

/**
 * @returns {string | null} The active death cause, or `null` if not dying.
 */
export function getDyingFrom() {
  return dyingFrom;
}

/**
 * Enter the dying state. No-op if already dying. Emits `EVT.DYING` with
 * the cause.
 *
 * @param {string} cause - Death cause (`'void' | 'self' | 'time'`).
 * @returns {void}
 */
export function startDying(cause, snake) {
  if (dyingFrom !== null) return;
  setState(STATE.DYING);
  dyingFrom = cause;
  dyingT = 0;
  lastDyingStartT = performance.now();
  emit(EVT.DYING, { cause });
}

/**
 * @returns {number} Seconds elapsed since the current death began.
 */
export function getDyingT() {
  return dyingT;
}

/**
 * Recompute `dyingT` from the current wall-clock time. Call from the
 * main update loop.
 *
 * @param {number} now - Current `performance.now()` value.
 * @returns {void}
 */
export function updateDying(now) {
  if (dyingFrom !== null) {
    dyingT = (now - lastDyingStartT) / 1000;
  }
}

/**
 * @returns {boolean} `true` once `DIE_DUR` seconds have elapsed since the
 *   death began. Caller should transition to the `OVER` state.
 */
export function dyingComplete() {
  return dyingT >= DIE_DUR;
}

/**
 * Clear all dying state. Call after the death animation has fully resolved.
 * @returns {void}
 */
export function resetDying() {
  dyingT = 0;
  dyingFrom = null;
}
