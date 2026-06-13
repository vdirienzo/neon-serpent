// src/ui/LevelSelectModal.js
// Modal con grid 5x2 para saltar a cualquier nivel (1-10).
// Trigger: tecla J, botón en title, o shortcut numérico directo (1-9, 0 = 10).

import { LEVEL_PALETTES, STATE } from '../config.js';
import { getState } from '../game/GameState.js';
import { t } from '../core/i18n.js';

let modalEl = null;
let gridEl = null;
let titleEl = null;
let closeBtn = null;
let currentSector = 1;

function buildGrid() {
  const html = LEVEL_PALETTES.map((pal, i) => {
    const n = i + 1;
    const hex = '#' + pal.primary.toString(16).padStart(6, '0');
    const isCurrent = n === currentSector;
    return `
      <button class="level-cell${isCurrent ? ' current' : ''}"
              type="button"
              data-n="${n}"
              style="--cell-color: ${hex};"
              aria-label="${t('levelSelect.ariaLabel', { n, name: pal.name })}">
        <span class="level-num">${n}</span>
        <span class="level-name">${pal.name}</span>
        ${isCurrent ? `<span class="level-tag" aria-hidden="true">${t('levelSelect.current')}</span>` : ''}
      </button>
    `;
  }).join('');
  gridEl.innerHTML = html;
  for (const btn of gridEl.querySelectorAll('.level-cell')) {
    btn.addEventListener('click', () => {
      const n = parseInt(btn.dataset.n, 10);
      select(n);
    });
  }
}

function open() {
  if (!modalEl) return;
  modalEl.classList.add('show');
  modalEl.setAttribute('aria-hidden', 'false');
}

function close() {
  if (!modalEl) return;
  modalEl.classList.remove('show');
  modalEl.setAttribute('aria-hidden', 'true');
}

function isOpen() {
  return modalEl && modalEl.classList.contains('show');
}

function setCurrentSector(n) {
  currentSector = n;
  if (gridEl) buildGrid();
}

function select(n) {
  if (n < 1 || n > LEVEL_PALETTES.length) return;
  const cb = onSelect;
  close();
  if (cb) cb(n);
}

let onSelect = null;
export function setOnSelect(fn) {
  onSelect = fn;
}

function onKeyDown(e) {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (isOpen()) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
  }
  // J opens modal (allowed from many states so you can switch levels mid-game)
  if (!isOpen() && (e.key === 'j' || e.key === 'J')) {
    if (
      getState() === STATE.PLAYING ||
      getState() === STATE.PAUSED ||
      getState() === STATE.TITLE ||
      getState() === STATE.OVER
    ) {
      e.preventDefault();
      open();
    }
  }
  // Digit shortcut 1-9, 0 -> 10 (handled in main.js; we don't double-fire here)
}

export function init() {
  modalEl = document.getElementById('levelSelectModal');
  if (!modalEl) return;
  titleEl = modalEl.querySelector('.lvl-modal-title');
  gridEl = modalEl.querySelector('.lvl-modal-grid');
  closeBtn = modalEl.querySelector('#lvlModalClose');
  if (closeBtn) closeBtn.addEventListener('click', close);
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) close();
  });
  buildGrid();
  document.addEventListener('keydown', onKeyDown);
}

export function show() {
  open();
}
export function hide() {
  close();
}
export { setCurrentSector };
