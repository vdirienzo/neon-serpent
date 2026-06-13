// tests/unit/extra/death-handler.test.js
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  getDyingFrom,
  getDyingT,
  startDying,
  updateDying,
  dyingComplete,
  resetDying,
} from '../../../src/game/DeathHandler.js';
import { getState, setState } from '../../../src/game/GameState.js';
import { clear as clearBus, on } from '../../../src/core/EventBus.js';
import { STATE, EVT } from '../../../src/config.js';

beforeEach(() => {
  clearBus();
  resetDying();
  setState(STATE.LOADING);
});

test('startDying sets state to DYING and emits EVT.DYING with cause', () => {
  const seen = [];
  on(EVT.DYING, (p) => seen.push(p));

  startDying('void', null);

  assert.equal(getState(), STATE.DYING);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].cause, 'void');
  assert.equal(getDyingFrom(), 'void');
});

test('startDying is a no-op when already dying (no double emit)', () => {
  const seen = [];
  on(EVT.DYING, (p) => seen.push(p));

  startDying('void', null);
  startDying('self', null); // should be ignored — already dying

  assert.equal(seen.length, 1, 'second startDying should be a no-op');
  assert.equal(seen[0].cause, 'void', 'cause should remain from the first call');
  assert.equal(getDyingFrom(), 'void');
});

test('getDyingT is 0 immediately after startDying', () => {
  startDying('void', null);
  assert.equal(getDyingT(), 0);
});

test('updateDying advances the timer based on performance.now()', () => {
  startDying('void', null);
  const start = performance.now();
  updateDying(start + 500);
  assert.ok(Math.abs(getDyingT() - 0.5) < 0.001, `expected ~0.5s, got ${getDyingT()}`);
  updateDying(start + 1500);
  assert.ok(Math.abs(getDyingT() - 1.5) < 0.001, `expected ~1.5s, got ${getDyingT()}`);
});

test('dyingComplete becomes true after DIE_DUR (1.1s) of updateDying calls', () => {
  startDying('void', null);
  const start = performance.now();
  updateDying(start + 500);
  assert.equal(dyingComplete(), false);
  updateDying(start + 1200);
  assert.equal(dyingComplete(), true);
});

test('updateDying is a no-op after resetDying', () => {
  startDying('void', null);
  resetDying();
  updateDying(performance.now() + 5000);
  assert.equal(getDyingT(), 0);
  assert.equal(dyingComplete(), false);
});

test('resetDying clears cause and timer and re-allows new startDying', () => {
  startDying('void', null);
  resetDying();

  assert.equal(getDyingT(), 0);
  assert.equal(getDyingFrom(), null);

  // After reset, startDying should work again
  const seen = [];
  on(EVT.DYING, (p) => seen.push(p));
  startDying('self', null);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].cause, 'self');
});

test('startDying does not change state when already dying', () => {
  setState(STATE.PLAYING);
  startDying('void', null);
  setState(STATE.TITLE); // simulate another state change
  startDying('self', null); // ignored
  // State should remain at TITLE (not changed to DYING by the second call)
  assert.equal(getState(), STATE.TITLE);
});
