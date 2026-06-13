/**
 * @fileoverview Lives display for the HUD. Renders the current life count
 * as a row of heart symbols (♥ for remaining, ♡ for lost).
 */
import { $ } from '../core/DOM.js';
import { on as onEvt } from '../core/EventBus.js';
import { EVT, MAX_LIVES } from '../config.js';

/** @type {HTMLElement | null} The lives display element. */
let livesEl = null;

export function init() {
  livesEl = $('livesVal');
  onEvt(EVT.LIFE_LOST, (payload) => setLives(payload && payload.lives));
}

export function setLives(n) {
  if (!livesEl) return;
  const remaining = Math.max(0, n);
  const lost = Math.max(0, MAX_LIVES - n);
  livesEl.textContent = '\u2665'.repeat(remaining) + '\u2661'.repeat(lost);
  if (remaining <= 1) {
    livesEl.classList.add('critical');
  } else {
    livesEl.classList.remove('critical');
  }
}
