import { $ } from '../core/DOM.js';
import { show, hide } from './Modal.js';
import * as Store from '../core/Store.js';
import { STORAGE } from '../config.js';
import { isAudioOn, setMasterVolume, ensureAudio, resumeAudio } from '../audio/AudioContext.js';
import { toggleAudio } from '../audio/Volume.js';
import { setReducedMotion } from '../audio/Haptics.js';
import { toast } from './Toasts.js';
import { t } from '../core/i18n.js';

const ID = 'settingsModal';

let colorBlind = Store.get(STORAGE.COLOR_BLIND, 'off');
let reducedMotion = Store.get(STORAGE.REDUCED_MOTION, false);
let slowMode = Store.get(STORAGE.SLOW_MODE, false);

export function init() {}

export function open() {
  sync();
  show(ID);
}
export function close() {
  hide(ID);
}

export function isOpen() {
  const m = $(ID);
  return m && m.classList.contains('show');
}

function sync() {
  const b = (id) => $(id);
  const audio = b('bSetAudio');
  if (audio) {
    audio.textContent = isAudioOn() ? t('settings.audioOn') : t('settings.audioOff');
    audio.classList.toggle('off', !isAudioOn());
  }
  const cb = b('bSetCB');
  if (cb) {
    cb.textContent =
      colorBlind === 'off'
        ? t('settings.colorBlindNo')
        : t('settings.colorBlindOn', { mode: colorBlind.toUpperCase() });
    cb.classList.toggle('off', colorBlind === 'off');
  }
  const rm = b('bSetRM');
  if (rm) {
    rm.textContent = reducedMotion ? t('settings.reducedMotionOn') : t('settings.reducedMotionOff');
    rm.classList.toggle('off', !reducedMotion);
  }
  const sl = b('bSetSlow');
  if (sl) {
    sl.textContent = slowMode ? t('settings.slowModeOn') : t('settings.slowModeOff');
    sl.classList.toggle('off', !slowMode);
  }
}

export function toggleColorBlind() {
  const opts = ['off', 'deuter', 'protan', 'tritan'];
  colorBlind = opts[(opts.indexOf(colorBlind) + 1) % opts.length];
  Store.set(STORAGE.COLOR_BLIND, colorBlind);
  applyColorBlind();
  toast(t('settings.colorToast', { mode: colorBlind.toUpperCase() }), 'cyan');
}
function applyColorBlind() {
  document.body.classList.remove('cb-deuter', 'cb-protan', 'cb-tritan');
  if (colorBlind !== 'off') document.body.classList.add('cb-' + colorBlind);
}
export function toggleReducedMotion() {
  reducedMotion = !reducedMotion;
  Store.set(STORAGE.REDUCED_MOTION, reducedMotion);
  setReducedMotion(reducedMotion);
  applyReducedMotion();
  toast(reducedMotion ? t('settings.motionReducedToast') : t('settings.motionNormalToast'), 'cyan');
}
function applyReducedMotion() {
  document.body.classList.toggle('rm', reducedMotion);
}
export function toggleSlowMode() {
  slowMode = !slowMode;
  Store.set(STORAGE.SLOW_MODE, slowMode);
  toast(slowMode ? t('settings.speedSlowToast') : t('settings.speedNormalToast'), 'cyan');
}
export function getSlowMode() {
  return slowMode;
}

export function clearAllData() {
  if (!confirm(t('settings.clearConfirm'))) return;
  Store.clearAll();
  location.reload();
}
applyColorBlind();
applyReducedMotion();
