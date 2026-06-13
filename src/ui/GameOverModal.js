import { $ } from '../core/DOM.js';
import { show, hide } from './Modal.js';
import {
  recordScore,
  recordSector,
  pushLeaderboard,
  getHi,
  getBestBySector,
} from '../game/Scoring.js';
import { getMode } from '../game/Modes.js';
import { setState, onStateChange } from '../game/GameState.js';
import { STATE } from '../config.js';
import { shareScore } from './Share.js';
import { t } from '../core/i18n.js';

const ID = 'overModal';

export function init() {}

export function showGameOver(score, currentSector, dyingFrom) {
  const m = $(ID);
  if (!m) return;
  m.classList.add('show');
  setState(STATE.OVER);
  const final = $('finalScore');
  if (final) final.textContent = String(score);
  const isNewRec = recordScore(score);
  const newRecEl = $('newRec');
  if (newRecEl) newRecEl.style.display = isNewRec ? 'inline-block' : 'none';
  if (isNewRec) {
    const hi = $('hiVal');
    if (hi) hi.textContent = String(getHi());
    const recTitle = $('recTitle');
    if (recTitle) recTitle.textContent = String(getHi());
    const recOver = $('recOver');
    if (recOver) recOver.textContent = String(getHi());
  }
  // Death cause
  const causeEl = $('deathCause');
  if (causeEl) {
    causeEl.className = 'death-cause';
    let text = '',
      cls = '';
    if (dyingFrom === 'wall') {
      text = t('gameOver.deathCauses.wall');
      cls = 'cyan';
    } else if (dyingFrom === 'void') {
      text = t('gameOver.deathCauses.void');
      cls = 'mag';
    } else if (dyingFrom === 'climb') {
      text = t('gameOver.deathCauses.climb');
      cls = 'gold';
    } else if (dyingFrom === 'self') {
      text = t('gameOver.deathCauses.self');
      cls = 'mag';
    } else if (dyingFrom === 'time') {
      text = t('gameOver.deathCauses.time');
      cls = 'cyan';
    }
    causeEl.textContent = text;
    if (cls) causeEl.classList.add(cls);
  }
  // Per-sector best
  const isNewSec = recordSector(currentSector, score);
  pushLeaderboard(score, currentSector);
  const bestEl = $('bestOverVal');
  const bestSec = $('bestOverSector');
  if (bestEl && bestSec) {
    if (currentSector >= 1 && currentSector <= 5) {
      bestSec.textContent = String(currentSector);
      const best = getBestBySector();
      bestEl.textContent = String(best[currentSector - 1] || 0);
      if (isNewSec) {
        bestEl.classList.remove('lb-bump');
        void bestEl.offsetWidth;
        bestEl.classList.add('lb-bump');
      }
    } else {
      bestSec.textContent = '∞';
      bestEl.textContent = '—';
    }
  }
}

export function hideGameOver() {
  hide(ID);
}
