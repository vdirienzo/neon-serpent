/**
 * @fileoverview Mode selection (story / time-attack / daily) and the
 * associated timing logic. Re-exports `MODE` for convenience.
 */
import { MODE, EVT } from '../config.js';
import { emit } from '../core/EventBus.js';

/** Re-exported so consumers can `import { MODE } from './Modes.js'`. */
export { MODE };

/** @type {string} Active mode (key from `MODE`). */
let currentMode = MODE.STORY;

/** @type {number} `performance.now()` of the last time-attack start. */
let timeAttackStart = 0;

/** @type {number} Seed for the daily level, derived from the calendar date. */
let dailySeed = 0;

/** @type {number} Time-attack duration in seconds. */
const timeLimitSec = 60;

/**
 * @returns {string} The active mode.
 */
export function getMode() {
  return currentMode;
}

/**
 * Set the active mode without resetting any timers.
 *
 * @param {string} m - New mode value (key from `MODE`).
 * @returns {void}
 */
export function setMode(m) {
  currentMode = m;
}

/**
 * @returns {number} `performance.now()` at the last `startTimeAttack()`.
 */
export function getTimeAttackStart() {
  return timeAttackStart;
}

/**
 * Override the stored time-attack start. Used by tests to set a fixed
 * elapsed time.
 *
 * @param {number} t - `performance.now()` value.
 * @returns {void}
 */
export function setTimeAttackStart(t) {
  timeAttackStart = t;
}

/**
 * @returns {number} Current daily seed.
 */
export function getDailySeed() {
  return dailySeed;
}

/**
 * Override the daily seed. Tests use this to make the daily level
 * deterministic.
 *
 * @param {number} s - Seed integer.
 * @returns {void}
 */
export function setDailySeed(s) {
  dailySeed = s;
}

/**
 * Switch to story mode. Resets no timers.
 * @returns {void}
 */
export function startStory() {
  currentMode = MODE.STORY;
}

/**
 * Switch to time-attack mode and capture the start time.
 * @returns {void}
 */
export function startTimeAttack() {
  currentMode = MODE.TIME;
  timeAttackStart = performance.now();
}

/**
 * Switch to daily mode and derive the seed from today's date.
 * @returns {void}
 */
export function startDaily() {
  const d = new Date();
  dailySeed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  currentMode = MODE.DAILY;
}

/**
 * Remaining seconds in the current time-attack run. Returns `null` outside
 * time-attack mode.
 *
 * @returns {number | null} Seconds remaining, clamped to `>= 0`, or `null`.
 */
export function getTimeRemainingSec() {
  if (currentMode !== MODE.TIME) return null;
  return Math.max(0, timeLimitSec - (performance.now() - timeAttackStart) / 1000);
}

/**
 * Check whether the time-attack clock has expired. Emits `EVT.GAME_OVER`
 * and fires the callback if so. No-op outside time-attack mode.
 *
 * @param {() => void} [onUp] - Optional callback fired on expiry.
 * @returns {void}
 */
export function checkTimeUp(onUp) {
  if (currentMode !== MODE.TIME) return;
  if (getTimeRemainingSec() <= 0) {
    emit(EVT.GAME_OVER, { mode: MODE.TIME });
    onUp && onUp();
  }
}
