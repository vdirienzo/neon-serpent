/**
 * @fileoverview DOM element lookups and UI state references. Centralises
 * all `$()` calls so main.js doesn't need 57 individual queries.
 */

import { $ } from '../core/DOM.js';

/** All DOM element references used by the game. */
export interface DomRefs {
  // Loaders & overlays
  readonly loader: HTMLElement | null;
  readonly nojs: HTMLElement | null;
  readonly crt: HTMLElement | null;
  readonly vignette: HTMLElement | null;
  readonly fxFlash: HTMLElement | null;
  readonly popups: HTMLElement | null;
  readonly toasts: HTMLElement | null;

  // HUD
  readonly hud: HTMLElement | null;
  readonly hudBr: HTMLElement | null;
  readonly scoreEl: HTMLElement | null;
  readonly hiEl: HTMLElement | null;
  readonly lvlBarEl: HTMLElement | null;
  readonly sectorEl: HTMLElement | null;
  readonly modeIndicator: HTMLElement | null;
  readonly timeAttackEl: HTMLElement | null;
  readonly bonusChip: HTMLElement | null;
  readonly bonusTEl: HTMLElement | null;
  readonly powerupChip: HTMLElement | null;
  readonly touchHint: HTMLElement | null;
  readonly livesEl: HTMLElement | null;

  // Title screen
  readonly titleScreen: HTMLElement | null;
  readonly startBtn: HTMLElement | null;
  readonly timeBtn: HTMLElement | null;
  readonly dailyBtn: HTMLElement | null;
  readonly levelSelectBtn: HTMLElement | null;
  readonly settingsBtn: HTMLElement | null;
  readonly leaderboardBtn: HTMLElement | null;

  // Audio toggle
  readonly audioBtn: HTMLElement | null;

  // Modals
  readonly pauseModal: HTMLElement | null;
  readonly gameOverModal: HTMLElement | null;
  readonly leaderboardModal: HTMLElement | null;
  readonly settingsModal: HTMLElement | null;
  readonly levelSelectModal: HTMLElement | null;
  readonly calibrationPanel: HTMLElement | null;

  // Canvas
  readonly canvas: HTMLCanvasElement | null;
}

/**
 * Look up all DOM elements used by the game. Returns a frozen object so
 * consumers can destructure once and reuse.
 *
 * @returns {DomRefs} All DOM element references
 */
export function lookupDomRefs(): DomRefs {
  return Object.freeze({
    // Loaders & overlays
    loader: $('loader'),
    nojs: $('nojs'),
    crt: $('crt'),
    vignette: $('vignette'),
    fxFlash: $('fx-flash'),
    popups: $('popups'),
    toasts: $('toasts'),

    // HUD
    hud: $('hud'),
    hudBr: $('hud-br'),
    scoreEl: $('scoreVal'),
    hiEl: $('hiVal'),
    lvlBarEl: $('lvlBar'),
    sectorEl: $('sector'),
    modeIndicator: $('modeIndicator'),
    timeAttackEl: $('timeAttack'),
    bonusChip: $('bonuschip'),
    bonusTEl: $('bonusT'),
    powerupChip: $('powerupchip'),
    touchHint: $('touch-hint'),
    livesEl: $('livesVal'),

    // Title screen
    titleScreen: $('title-screen'),
    startBtn: $('startBtn'),
    timeBtn: $('timeBtn'),
    dailyBtn: $('dailyBtn'),
    levelSelectBtn: $('lvlBtn'),
    settingsBtn: $('settingsBtn'),
    leaderboardBtn: $('lbBtn'),
    audioBtn: $('audioBtn'),

    // Modals
    pauseModal: $('pauseModal'),
    gameOverModal: $('gameOverModal'),
    leaderboardModal: $('leaderboardModal'),
    settingsModal: $('settingsModal'),
    levelSelectModal: $('levelSelectModal'),
    calibrationPanel: $('calibPanel'),

    // Canvas
    canvas: $('c') as HTMLCanvasElement | null,
  });
}
