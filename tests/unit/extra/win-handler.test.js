// tests/unit/extra/win-handler.test.js
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = {
  _: {},
  setItem(k, v) {
    this._[k] = v;
  },
  getItem(k) {
    return this._[k] || null;
  },
  removeItem(k) {
    delete this._[k];
  },
  key(i) {
    return Object.keys(this._)[i] || null;
  },
  get length() {
    return Object.keys(this._).length;
  },
};

import { handleWin } from '../../../src/game/WinHandler.js';
import { getState, setState } from '../../../src/game/GameState.js';
import { clear as clearBus, on } from '../../../src/core/EventBus.js';
import { setMode, getMode } from '../../../src/game/Modes.js';
import { STATE, EVT, MODE } from '../../../src/config.js';
import { getBestBySector } from '../../../src/game/Scoring.js';

beforeEach(() => {
  clearBus();
  setState(STATE.PLAYING);
  setMode(MODE.STORY);
});

test('STORY mode: emits EVT.GOAL_REACHED and sets state to WIN', () => {
  setMode(MODE.STORY);
  const seen = [];
  on(EVT.GOAL_REACHED, (p) => seen.push(p));
  on(EVT.GAME_OVER, () => seen.push('over'));

  handleWin(200, 2);

  assert.equal(getState(), STATE.WIN);
  assert.equal(seen.length, 1, 'only GOAL_REACHED should fire');
  assert.equal(seen[0].bonus, 500 * 2, `expected bonus 1000, got ${seen[0].bonus}`);
});

test('TIME mode: emits EVT.GAME_OVER and sets state to OVER', () => {
  setMode(MODE.TIME);
  const seen = [];
  on(EVT.GAME_OVER, (p) => seen.push(p));
  on(EVT.GOAL_REACHED, () => seen.push('goal'));

  handleWin(120, 3);

  assert.equal(getState(), STATE.OVER);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].mode, MODE.TIME);
});

test('DAILY mode: emits EVT.GAME_OVER and sets state to OVER', () => {
  setMode(MODE.DAILY);
  const seen = [];
  on(EVT.GAME_OVER, (p) => seen.push(p));
  on(EVT.GOAL_REACHED, () => seen.push('goal'));

  handleWin(80, 1);

  assert.equal(getState(), STATE.OVER);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].mode, MODE.DAILY);
});

test('TIME/DAILY mode records the sector score', () => {
  setMode(MODE.TIME);
  const before = [...getBestBySector()];
  handleWin(9999, 4);
  const after = getBestBySector();
  assert.equal(after[3], 9999, 'sector 4 (index 3) should be updated');
  // Other sectors untouched
  for (let i = 0; i < 5; i++) {
    if (i === 3) continue;
    assert.equal(after[i], before[i], `sector ${i + 1} should be unchanged`);
  }
});

test('STORY mode bonus scales with currentSector', () => {
  setMode(MODE.STORY);
  const seen = [];
  on(EVT.GOAL_REACHED, (p) => seen.push(p));

  handleWin(0, 5);
  assert.equal(seen[0].bonus, 500 * 5);
});
