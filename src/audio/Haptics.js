/**
 * @fileoverview Vibration API wrappers for haptic feedback. Each named
 * helper calls `haptic()` with a preset pattern. All helpers respect
 * reduced-motion and the master audio toggle.
 */
import { isTouchDevice, vibrate } from '../core/DOM.js';
import { isAudioOn } from './AudioContext.js';

/** @type {boolean} Whether to suppress haptic output (accessibility). */
let reducedMotion = false;

/**
 * @returns {boolean} `true` if reduced motion is enabled.
 */
export function isReducedMotion() {
  return reducedMotion;
}

/**
 * Toggle reduced-motion mode. When `true`, every haptic is suppressed.
 *
 * @param {boolean} v
 * @returns {void}
 */
export function setReducedMotion(v) {
  reducedMotion = !!v;
}

/**
 * Trigger a vibration pattern. Skips when reduced motion is on, when
 * audio is muted, or on non-touch devices. The pattern format follows
 * the [Vibration API](https://developer.mozilla.org/docs/Web/API/Vibration_API).
 *
 * @param {number | number[]} pattern
 * @returns {void}
 */
export function haptic(pattern) {
  if (reducedMotion) return;
  if (!isAudioOn()) return;
  if (!isTouchDevice()) return;
  vibrate(pattern);
}

/** Short blip when collecting food. */
export const hapticEat = () => haptic(10);
/** Three-buzz pattern for gem pickup. */
export const hapticGem = () => haptic([15, 20, 15]);
/** Two-buzz pattern for crystal pickup. */
export const hapticCrystal = () => haptic([20, 30]);
/** Short blip for slow pickup. */
export const hapticSlow = () => haptic(15);
/** Three-strong-buzz pattern for dice pickup. */
export const hapticDice = () => haptic([30, 20, 30, 20, 30]);
/** Long blip for the death event. */
export const hapticDie = () => haptic(120);
/** Five-buzz win fanfare. */
export const hapticWin = () => haptic([50, 30, 50, 30, 100]);
/** Short blip for level up. */
export const hapticLevelUp = () => haptic(15);
/** Short blip for checkpoint pass. */
export const hapticCheck = () => haptic(20);
/** Bonus pickup pattern. */
export const hapticBonus = () => haptic([10, 10, 10, 10, 10, 30]);
