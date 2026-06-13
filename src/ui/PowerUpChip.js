import { $ } from '../core/DOM.js';
import { t } from '../core/i18n.js';

let chip = null;
let raf = 0;
let startT = 0;
let dur = 0;

export function init() {
  chip = $('powerupchip');
}

export function show(type, durationMs) {
  if (!chip) return;
  if (raf) cancelAnimationFrame(raf);
  startT = performance.now();
  dur = durationMs;
  const icon = type === 'speed' ? t('powerUp.speedIcon') : t('powerUp.slowIcon');
  const label = type === 'speed' ? t('powerUp.speedLabel') : t('powerUp.slowLabel');
  const seconds = (durationMs / 1000).toFixed(1);
  chip.className = 'powerup-chip ' + type;
  while (chip.firstChild) chip.removeChild(chip.firstChild);
  const icSpan = document.createElement('span');
  icSpan.className = 'ic';
  icSpan.textContent = icon;
  const lbSpan = document.createElement('span');
  lbSpan.className = 'lb';
  lbSpan.textContent = label;
  const tmSpan = document.createElement('span');
  tmSpan.className = 'tm';
  tmSpan.textContent = t('powerUp.duration', { seconds });
  const barDiv = document.createElement('div');
  barDiv.className = 'bar';
  chip.appendChild(icSpan);
  chip.appendChild(lbSpan);
  chip.appendChild(tmSpan);
  chip.appendChild(barDiv);
  requestAnimationFrame(() => chip.classList.add('show'));
  const tm = chip.querySelector('.tm');
  const bar = chip.querySelector('.bar');
  const tick = () => {
    const remain = Math.max(0, dur - (performance.now() - startT));
    const remainSec = (remain / 1000).toFixed(1);
    if (tm) tm.textContent = t('powerUp.duration', { seconds: remainSec });
    if (bar) bar.style.transform = 'scaleX(' + remain / dur + ')';
    if (remain > 0) raf = requestAnimationFrame(tick);
    else {
      raf = 0;
      hide();
    }
  };
  raf = requestAnimationFrame(tick);
}

export function hide() {
  if (!chip) return;
  if (raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
  chip.classList.remove('show');
  chip.classList.add('hide');
  setTimeout(() => {
    chip.classList.remove('hide');
    while (chip.firstChild) chip.removeChild(chip.firstChild);
  }, 400);
}
