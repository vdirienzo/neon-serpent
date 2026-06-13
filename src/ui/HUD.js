import { $ } from '../core/DOM.js';
import { on as onEvt, emit } from '../core/EventBus.js';
import { STATE, MODE, LVL_CAP, EVT } from '../config.js';
import { getComboStep } from '../audio/AudioContext.js';
import { t } from '../core/i18n.js';

let scoreEl, hiEl, lvlNumEl, lvlBarEl, sectorEl, sectorNameEl, sectorWrapEl, modeEl, timeAttackEl;
let comboEl, comboBadgeEl;
let score = 0;
let scoreDisplay = 0;
let level = 1;
let currentSector = 1;
let levelPalette = null;
let lastCombo = -1;

export function init() {
  scoreEl = $('scoreVal');
  hiEl = $('hiVal');
  lvlNumEl = $('lvlNum');
  lvlBarEl = $('lvlbar');
  sectorEl = $('sectorNum');
  sectorNameEl = $('sectorName');
  sectorWrapEl = $('sectorWrap');
  modeEl = $('modeIndicator');
  timeAttackEl = $('timeAttackRemaining');
  comboEl = $('comboVal');
  comboBadgeEl = $('comboBadge');
  for (let i = 0; i < LVL_CAP; i++) {
    const el = document.createElement('i');
    lvlBarEl.appendChild(el);
  }
  updateLvlBar();
  onEvt(EVT.STATE_CHANGE, onStateChange);
  updateCombo();
}

export function setHi(v) {
  if (hiEl) hiEl.textContent = String(v);
}
export function setScore(v) {
  score = v;
}
export function getScore() {
  return score;
}
export function setLevel(v) {
  level = v;
  updateLvlBar();
}
export function getLevel() {
  return level;
}
export function bump() {
  if (!scoreEl) return;
  scoreEl.classList.remove('bump');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('bump');
}

function updateLvlBar() {
  const cells = lvlBarEl.querySelectorAll('i');
  cells.forEach((c, i) => c.classList.toggle('on', i < level));
}

export function setSector(n, palette, mode) {
  currentSector = n;
  levelPalette = palette;
  if (sectorEl && n <= 10) sectorEl.textContent = t('hud.sectorProgress', { n, max: 10 });
  else if (sectorEl) sectorEl.textContent = t('hud.sectorInfinity');
  if (sectorNameEl) sectorNameEl.textContent = palette ? palette.name : t('hud.sectorFallback');
  if (sectorWrapEl && palette) {
    const hex = '#' + palette.primary.toString(16).padStart(6, '0');
    sectorWrapEl.style.color = hex;
  }
  if (modeEl) {
    let label = t('hud.modeStory');
    if (mode === MODE.TIME) label = t('hud.modeTime');
    else if (mode === MODE.DAILY) label = t('hud.modeDaily');
    const first = modeEl.firstChild;
    if (first && first.nodeType === 3) first.nodeValue = label + ' ';
    else if (timeAttackEl) modeEl.insertBefore(document.createTextNode(label + ' '), timeAttackEl);
  }
  if (timeAttackEl && mode !== MODE.TIME) timeAttackEl.textContent = '';
}

export function setTimeRemaining(text) {
  if (timeAttackEl) timeAttackEl.textContent = text;
}

export function updateCombo() {
  if (!comboEl || !comboBadgeEl) return;
  const c = getComboStep();
  if (c === lastCombo) return;
  lastCombo = c;
  if (c <= 0) {
    comboBadgeEl.hidden = true;
    comboBadgeEl.classList.remove('bump', 'hot');
    return;
  }
  comboEl.textContent = c;
  comboBadgeEl.hidden = false;
  comboBadgeEl.classList.toggle('hot', c >= 5);
  comboBadgeEl.classList.remove('bump');
  void comboBadgeEl.offsetWidth;
  comboBadgeEl.classList.add('bump');
}

function onStateChange({ state }) {
  if (
    state === STATE.DYING ||
    state === STATE.OVER ||
    state === STATE.WIN ||
    state === STATE.TITLE
  ) {
    lastCombo = -1;
    if (comboBadgeEl) comboBadgeEl.hidden = true;
  }
}

export function updateScoreDisplay(dt) {
  if (scoreDisplay !== score) {
    scoreDisplay = scoreDisplay + (score - scoreDisplay) * (1 - Math.exp(-8 * dt));
    if (Math.abs(scoreDisplay - score) < 0.5) scoreDisplay = score;
    if (scoreEl) scoreEl.textContent = String(Math.round(scoreDisplay));
  }
}
