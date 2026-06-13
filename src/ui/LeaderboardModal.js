import { $ } from '../core/DOM.js';
import { show, hide, isOpen } from './Modal.js';
import { getLeaderboard } from '../game/Scoring.js';
import { t } from '../core/i18n.js';

const ID = 'leaderboardModal';

export function init() {}

export function open() {
  render();
  show(ID);
}
export function close() {
  hide(ID);
}

function render() {
  const list = $('leaderboardList');
  if (!list) return;
  list.innerHTML = '';
  const lb = getLeaderboard();
  if (!lb.length) {
    const empty = document.createElement('div');
    empty.className = 'lb-empty';
    empty.textContent = t('leaderboard.empty');
    list.appendChild(empty);
    return;
  }
  lb.forEach((e, i) => {
    const row = document.createElement('div');
    row.className = 'lb-row' + (i < 3 ? ' top' + (i + 1) : '');
    const rank = document.createElement('span');
    rank.className = 'rank';
    rank.textContent = '#' + (i + 1);
    const meta = document.createElement('span');
    meta.className = 'meta';
    const d = new Date(e.date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const sectorTag =
      e.sector >= 1 && e.sector <= 5
        ? t('leaderboard.sectorTag', { sector: e.sector })
        : t('leaderboard.sectorInfinityTag');
    meta.textContent = sectorTag + ' · ' + dd + '/' + mm;
    const scoreEl = document.createElement('span');
    scoreEl.className = 'score-val';
    scoreEl.textContent = String(e.score);
    row.appendChild(rank);
    row.appendChild(meta);
    row.appendChild(scoreEl);
    list.appendChild(row);
  });
}
