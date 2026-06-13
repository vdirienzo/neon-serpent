import { getHi } from '../game/Scoring.js';
import { LEVEL_PALETTES } from '../config.js';
import { toast } from './Toasts.js';
import { t } from '../core/i18n.js';

export function buildShareText(score, currentSector) {
  const palName =
    currentSector >= 1 && currentSector <= 10 ? LEVEL_PALETTES[currentSector - 1].name : '∞';
  const isNewRec = score > getHi();
  return (
    t('share.title') +
    '\n' +
    t('share.score', { score }) +
    '\n' +
    t('share.sector', { sector: currentSector, name: palName }) +
    '\n' +
    (isNewRec ? t('share.newRecord') + '\n' : '') +
    t('share.footer')
  );
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '0';
  ta.style.left = '0';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (e) {
    ok = false;
  }
  document.body.removeChild(ta);
  if (ok) toast(t('share.copied'), 'cyan');
  else toast(t('share.error'), 'mag');
}

export function shareScore(score, currentSector) {
  const text = buildShareText(score, currentSector);
  const secure =
    window.isSecureContext ||
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1';
  if (secure && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => toast(t('share.copied'), 'cyan'),
      () => fallbackCopy(text)
    );
  } else fallbackCopy(text);
}
