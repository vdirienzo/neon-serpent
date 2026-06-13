import { $ } from '../core/DOM.js';
import { isTouchDevice } from '../core/DOM.js';
import { onStateChange, getState } from '../game/GameState.js';
import { STATE } from '../config.js';

let titleEl = null;
let touchHintEl = null;
let touchHint2El = null;

export function init() {
  titleEl = $('title-screen');
  touchHintEl = $('tHint');
  touchHint2El = $('touch-hint');
}

export function show() {
  if (!titleEl) return;
  titleEl.style.display = 'flex';
  requestAnimationFrame(() => titleEl.classList.add('show'));
}

export function hide() {
  if (!titleEl) return;
  titleEl.classList.remove('show');
  titleEl.style.display = 'none';
}

export function showTouchHint() {
  if (isTouchDevice()) {
    if (touchHintEl) touchHintEl.style.display = 'inline';
    if (touchHint2El) {
      touchHint2El.classList.add('show');
      setTimeout(() => touchHint2El.classList.remove('show'), 3500);
    }
  } else {
    if (touchHintEl) touchHintEl.style.display = 'none';
  }
}
