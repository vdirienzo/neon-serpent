/**
 * @fileoverview Resolves a level win into the correct state transition and
 * bus event. Different paths for time-attack / daily vs story.
 */
import { getState, setState } from './GameState.js';
import { STATE, MODE, EVT } from '../config.js';
import { emit } from '../core/EventBus.js';
import { recordSector } from './Scoring.js';
import { getMode } from './Modes.js';

/**
 * Handle a level win.
 *
 * In `TIME` or `DAILY` mode, the run is over: record the sector best, jump
 * straight to `OVER`, and emit `EVT.GAME_OVER`.
 *
 * In `STORY` mode, compute a sector bonus of `500 * currentSector`, record
 * the sector best, enter `WIN`, and emit `EVT.GOAL_REACHED`. After 1.5 s the
 * state is forced back to `PLAYING` to start the next level.
 *
 * @param {number} score - Final score for the won level.
 * @param {number} currentSector - 1-based sector index for bonus calculation.
 * @returns {void}
 */
export function handleWin(score, currentSector) {
  const mode = getMode();
  if (mode === MODE.TIME || mode === MODE.DAILY) {
    recordSector(currentSector, score);
    setState(STATE.OVER);
    emit(EVT.GAME_OVER, { mode });
    return;
  }
  const bonus = 500 * currentSector;
  recordSector(currentSector, score);
  setState(STATE.WIN);
  emit(EVT.GOAL_REACHED, { bonus });
  setTimeout(() => {
    emit(EVT.STATE_CHANGE, STATE.PLAYING);
  }, 1500);
}
