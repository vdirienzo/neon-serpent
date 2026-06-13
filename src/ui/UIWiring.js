// src/ui/UIWiring.js — Button event listeners and UI initialization

import { LVL_CAP } from '../config.js';
import { t } from '../core/i18n.js';

export function createUIWiring({
  buttons,
  gameActions,
  settingsActions,
  uiModules,
  state,
  elements,
  deps,
}) {
  function wireButtons() {
    const b = buttons;
    const g = gameActions;
    const s = settingsActions;
    const u = uiModules;
    const st = state;

    if (b.bStart) b.bStart.addEventListener('click', g.startGame);
    if (b.bTimeAttack) b.bTimeAttack.addEventListener('click', g.startTimeAttack);
    if (b.bDaily) b.bDaily.addEventListener('click', g.startDaily);
    if (b.bLevelSelect) b.bLevelSelect.addEventListener('click', () => u.showLevelSelect());
    if (b.bRestart) b.bRestart.addEventListener('click', g.startGame);
    if (b.bResume) b.bResume.addEventListener('click', () => g.setPaused(false));
    if (b.bPauseTitle) b.bPauseTitle.addEventListener('click', g.goTitle);
    if (b.bOverTitle) b.bOverTitle.addEventListener('click', g.goTitle);
    if (b.bAudio) b.bAudio.addEventListener('click', s.onToggleAudio);
    if (b.bCam) b.bCam.addEventListener('click', g.cycleCam);
    if (b.bPause)
      b.bPause.addEventListener('click', () => {
        if (st.getState() === st.STATE.PLAYING) g.setPaused(true);
        else if (st.getState() === st.STATE.PAUSED) g.setPaused(false);
        if (b.bPause)
          b.bPause.setAttribute(
            'aria-pressed',
            st.getState() === st.STATE.PAUSED ? 'true' : 'false'
          );
      });
    if (b.bLeaderboard) b.bLeaderboard.addEventListener('click', u.openLeaderboard);
    if (b.bShare)
      b.bShare.addEventListener('click', () =>
        deps.shareScore(st.getScore(), st.getCurrentSector())
      );
    if (b.bCloseLeaderboard) b.bCloseLeaderboard.addEventListener('click', u.closeLeaderboard);
    if (b.leaderboardMod)
      b.leaderboardMod.addEventListener('click', (e) => {
        if (e.target === b.leaderboardMod) u.closeLeaderboard();
      });
    if (b.bSettings)
      b.bSettings.addEventListener('click', () => {
        s.syncSettingsPanelUI();
        u.openSettings();
      });
    if (b.bSettingsSave)
      b.bSettingsSave.addEventListener('click', () => {
        s.syncSettingsPanelUI();
        deps.toast(t('toast.settingsSaved'), 'cyan');
        u.closeSettings();
      });
    if (b.bSettingsClose) b.bSettingsClose.addEventListener('click', u.closeSettings);
    if (b.bSetAudio)
      b.bSetAudio.addEventListener('click', () => {
        s.onToggleAudio();
        s.syncSettingsPanelUI();
      });
    if (b.bSetCB)
      b.bSetCB.addEventListener('click', () => {
        s.toggleColorBlindAction();
        s.syncSettingsPanelUI();
      });
    if (b.bSetRM)
      b.bSetRM.addEventListener('click', () => {
        s.toggleRMActionLocal();
        s.syncSettingsPanelUI();
      });
    if (b.bSetSlow)
      b.bSetSlow.addEventListener('click', () => {
        s.toggleSlowActionLocal();
        s.syncSettingsPanelUI();
      });
    if (b.bClearData) b.bClearData.addEventListener('click', s.clearAllDataLocal);
    if (b.settingsMod)
      b.settingsMod.addEventListener('click', (e) => {
        if (e.target === b.settingsMod) u.closeSettings();
      });
  }

  function wireVisibilityHandlers() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && state.getState() === state.STATE.PLAYING) gameActions.setPaused(true);
    });
    window.addEventListener('blur', () => {
      if (state.getState() === state.STATE.PLAYING) gameActions.setPaused(true);
    });
  }

  function initUI() {
    uiModules.initHUD();
    uiModules.initLivesDisplay();
    uiModules.initCalibPanel();
    uiModules.initLevelSelect();
    uiModules.setOnSelect(gameActions.jumpToLevel);
    uiModules.initToasts();
    uiModules.initPopups();
    uiModules.initPowerUpChip();
    uiModules.initTitleScreen();
    uiModules.initPause();
    uiModules.initGameOver();
    uiModules.initLeaderboard();
    uiModules.initSettings();

    if (elements.lvlBarEl) {
      for (let i = 0; i < LVL_CAP; i++) {
        const el = document.createElement('i');
        elements.lvlBarEl.appendChild(el);
      }
      deps.updateLvlBar();
    }

    if (elements.hiEl) elements.hiEl.textContent = String(deps.getHi());
    if (elements.recTitleEl) elements.recTitleEl.textContent = String(deps.getHi());
    if (elements.recOverEl) elements.recOverEl.textContent = String(deps.getHi());
    deps.setHiUI(deps.getHi());
  }

  return { wireButtons, wireVisibilityHandlers, initUI };
}
