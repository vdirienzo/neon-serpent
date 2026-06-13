import { $ } from '../core/DOM.js';

let layer = null;

export function init() {
  layer = $('toasts');
}

export function toast(text, kind) {
  if (!layer) return;
  const t = document.createElement('div');
  t.className = 'toast' + (kind === 'mag' ? ' mag' : kind === 'gold' ? ' gold' : '');
  t.textContent = text;
  layer.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 1300);
}
