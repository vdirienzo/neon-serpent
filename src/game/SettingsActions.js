// src/game/SettingsActions.js — Settings toggle actions
import * as Store from '../core/Store.js';
import { t } from '../core/i18n.js';
import { isReducedMotion, setReducedMotion } from '../audio/Haptics.js';
import { toggleAudio } from '../audio/Volume.js';
import { isAudioOn } from '../audio/AudioContext.js';
import { STORAGE } from '../config.js';
import { toast } from '../ui/Toasts.js';

export function createSettingsActions({ buttons, slowModeRef }) {
  const { bAudio, bSetAudio, bSetCB, bSetRM, bSetSlow } = buttons;

  function refreshAudioButton() {
    if (!bAudio) return;
    bAudio.textContent = isAudioOn() ? t('settings.audioOn') : t('settings.audioOff');
    bAudio.classList.toggle('off', !isAudioOn());
    bAudio.setAttribute('aria-pressed', String(isAudioOn()));
  }

  function syncSettingsPanelUI() {
    if (bSetAudio) {
      bSetAudio.textContent = isAudioOn() ? t('settings.audioOn') : t('settings.audioOff');
      bSetAudio.classList.toggle('off', !isAudioOn());
      bSetAudio.setAttribute('aria-pressed', String(isAudioOn()));
    }
    if (bSetCB) {
      const cb = Store.get(STORAGE.COLOR_BLIND, 'off');
      bSetCB.textContent =
        cb === 'off'
          ? t('settings.colorBlindNo')
          : t('settings.colorBlindOn', { mode: cb.toUpperCase() });
      bSetCB.classList.toggle('off', cb === 'off');
      bSetCB.setAttribute('aria-pressed', cb !== 'off' ? 'true' : 'false');
    }
    if (bSetRM) {
      const rm = isReducedMotion();
      bSetRM.textContent = rm ? t('settings.reducedMotionOn') : t('settings.reducedMotionOff');
      bSetRM.classList.toggle('off', !rm);
      bSetRM.setAttribute('aria-pressed', String(rm));
    }
    if (bSetSlow) {
      const sm = slowModeRef.get();
      bSetSlow.textContent = sm ? t('settings.slowModeOn') : t('settings.slowModeOff');
      bSetSlow.classList.toggle('off', !sm);
      bSetSlow.setAttribute('aria-pressed', String(sm));
    }
  }

  function applyColorBlind() {
    const cb = Store.get(STORAGE.COLOR_BLIND, 'off');
    document.body.classList.remove('cb-deuter', 'cb-protan', 'cb-tritan');
    if (cb !== 'off') document.body.classList.add('cb-' + cb);
  }

  function applyReducedMotion() {
    document.body.classList.toggle('rm', isReducedMotion());
  }

  function toggleColorBlindAction() {
    const opts = ['off', 'deuter', 'protan', 'tritan'];
    const cur = Store.get(STORAGE.COLOR_BLIND, 'off');
    const next = opts[(opts.indexOf(cur) + 1) % opts.length];
    Store.set(STORAGE.COLOR_BLIND, next);
    applyColorBlind();
    toast(t('settings.colorToast', { mode: next.toUpperCase() }), 'cyan');
  }

  function toggleRMActionLocal() {
    setReducedMotion(!isReducedMotion());
    Store.set(STORAGE.REDUCED_MOTION, isReducedMotion());
    applyReducedMotion();
    toast(
      isReducedMotion() ? t('settings.motionReducedToast') : t('settings.motionNormalToast'),
      'cyan'
    );
  }

  function toggleSlowActionLocal() {
    slowModeRef.set(!slowModeRef.get());
    Store.set(STORAGE.SLOW_MODE, slowModeRef.get());
    toast(
      slowModeRef.get() ? t('settings.speedSlowToast') : t('settings.speedNormalToast'),
      'cyan'
    );
  }

  function clearAllDataLocal() {
    if (!confirm(t('settings.clearConfirm'))) return;
    Store.clearAll();
    location.reload();
  }

  function onToggleAudio() {
    toggleAudio();
    refreshAudioButton();
    toast(
      isAudioOn() ? t('settings.audioOn') : t('settings.audioOff'),
      isAudioOn() ? 'cyan' : 'mag'
    );
  }

  // Apply initial state
  applyColorBlind();
  applyReducedMotion();
  refreshAudioButton();

  return {
    refreshAudioButton,
    syncSettingsPanelUI,
    applyColorBlind,
    applyReducedMotion,
    toggleColorBlindAction,
    toggleRMActionLocal,
    toggleSlowActionLocal,
    clearAllDataLocal,
    onToggleAudio,
  };
}
