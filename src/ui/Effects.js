// src/ui/Effects.js — Visual effects (flash, glitch, level pop)
import { vibrate } from '../core/DOM.js';
import { isReducedMotion } from '../audio/Haptics.js';

export function createEffects({ fxFlash, lvlNumEl }) {
  function triggerFlash(kind) {
    if (!fxFlash) return;
    fxFlash.classList.remove('boom');
    void fxFlash.offsetWidth;
    if (kind === 'eat') {
      fxFlash.style.background = 'var(--color-cyan)';
      fxFlash.style.animation = 'none';
      void fxFlash.offsetWidth;
      fxFlash.style.animation = 'boom .35s ease-out both';
    } else if (kind === 'bonus') {
      fxFlash.style.background = 'var(--color-gold)';
      fxFlash.style.animation = 'none';
      void fxFlash.offsetWidth;
      fxFlash.style.animation = 'boom .45s ease-out both';
    } else {
      fxFlash.style.background = '';
      fxFlash.classList.add('boom');
      setTimeout(() => fxFlash.classList.remove('boom'), 600);
    }
  }

  function triggerGlitch(durMs) {
    if (isReducedMotion()) return;
    document.body.classList.add('glitch');
    setTimeout(() => document.body.classList.remove('glitch'), durMs);
  }

  function levelPop() {
    if (!lvlNumEl) return;
    if (isReducedMotion()) return;
    vibrate(15);
    lvlNumEl.classList.remove('lvl-pop');
    void lvlNumEl.offsetWidth;
    lvlNumEl.classList.add('lvl-pop');
    setTimeout(() => lvlNumEl && lvlNumEl.classList.remove('lvl-pop'), 600);
  }

  return { triggerFlash, triggerGlitch, levelPop };
}
