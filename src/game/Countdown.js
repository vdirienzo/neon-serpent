/**
 * @fileoverview Pre-game countdown sequence. Steps through `3` → `2` → `1` →
 * `GO` and then invokes the completion callback. Cancel-safe via a token.
 */
import { setState, getState } from './GameState.js';
import { on } from '../core/EventBus.js';
import { EVT, STATE } from '../config.js';

/** Bumped on every `startCountdown` to invalidate any pending step. */
let countdownToken = 0;

/** `performance.now()` value captured at the moment the `GO` step shows. */
let goStartedAt = 0;

/**
 * Get the wall-clock time at which the latest `GO` step was shown.
 * @returns {number} `performance.now()` value, or `0` if no `GO` has played.
 */
export function getGoStartedAt() {
  return goStartedAt;
}

/**
 * Start the countdown. Sets the state to `COUNTDOWN`, then shows
 * `3 / 2 / 1 / GO` in the `#countdown` element. On completion (or if the
 * element is missing), invokes `onComplete`.
 *
 * Calling this again while a previous countdown is in flight is safe: the
 * old token makes its pending steps no-op.
 *
 * @param {() => void} [onComplete] - Optional callback after the final step.
 * @returns {void}
 */
export function startCountdown(onComplete) {
  countdownToken++;
  const tok = countdownToken;
  setState(STATE.COUNTDOWN);
  goStartedAt = 0;
  const el = document.getElementById('countdown');
  if (!el) {
    onComplete && onComplete();
    return;
  }
  function showStep(text, dur, after) {
    if (getState() !== STATE.COUNTDOWN || tok !== countdownToken) return;
    el.classList.remove('show', 'go');
    el.textContent = text;
    void el.offsetWidth;
    el.classList.add('show');
    if (text === 'GO') {
      el.classList.add('go');
      goStartedAt = performance.now();
    }
    setTimeout(() => {
      if (getState() !== STATE.COUNTDOWN || tok !== countdownToken) return;
      if (after) {
        after();
        return;
      }
      el.classList.remove('show', 'go');
      el.textContent = '';
      onComplete && onComplete();
    }, dur);
  }
  showStep('3', 1000, () =>
    showStep('2', 1000, () => showStep('1', 1000, () => showStep('GO', 1500)))
  );
}

/**
 * Cancel any in-flight countdown and return the state to `TITLE`.
 * @returns {void}
 */
export function cancelCountdown() {
  countdownToken++;
  setState(STATE.TITLE);
}
