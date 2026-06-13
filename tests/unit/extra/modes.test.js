// tests/unit/extra/modes.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getMode,
  setMode,
  startStory,
  startTimeAttack,
  startDaily,
  getTimeRemainingSec,
  checkTimeUp,
  getDailySeed,
  setDailySeed,
  getTimeAttackStart,
  setTimeAttackStart,
} from '../../../src/game/Modes.js';
import { MODE, EVT } from '../../../src/config.js';
import { on, clear as clearBus } from '../../../src/core/EventBus.js';

function reset() {
  setMode(MODE.STORY);
  setTimeAttackStart(0);
  setDailySeed(0);
  clearBus();
}

test('default mode is STORY', () => {
  reset();
  assert.equal(getMode(), MODE.STORY);
});

test('startStory sets mode to STORY regardless of current mode', () => {
  reset();
  setMode(MODE.TIME);
  assert.equal(getMode(), MODE.TIME);
  startStory();
  assert.equal(getMode(), MODE.STORY);
});

test('startTimeAttack sets mode to TIME and stamps a start time near performance.now()', () => {
  reset();
  const before = performance.now();
  startTimeAttack();
  const after = performance.now();
  assert.equal(getMode(), MODE.TIME);
  const start = getTimeAttackStart();
  assert.ok(start >= before, `start (${start}) should be >= before (${before})`);
  assert.ok(start <= after, `start (${start}) should be <= after (${after})`);
});

test('startDaily sets mode to DAILY and produces a YYYYMMDD-style numeric seed', () => {
  reset();
  startDaily();
  assert.equal(getMode(), MODE.DAILY);
  const seed = getDailySeed();
  assert.equal(typeof seed, 'number');
  assert.ok(Number.isInteger(seed), `seed should be integer, got ${seed}`);
  assert.ok(seed >= 20000101 && seed <= 99991231, `seed should be YYYYMMDD-shaped, got ${seed}`);
});

test('getTimeRemainingSec returns null when not in TIME mode', () => {
  reset();
  startStory();
  assert.equal(getTimeRemainingSec(), null);
  startDaily();
  assert.equal(getTimeRemainingSec(), null);
  setMode(MODE.STORY);
  assert.equal(getTimeRemainingSec(), null);
});

test('getTimeRemainingSec returns a value in (59, 60] right after startTimeAttack', () => {
  reset();
  startTimeAttack();
  const remaining = getTimeRemainingSec();
  assert.ok(remaining !== null, 'should not be null in TIME mode');
  assert.ok(remaining <= 60, `should be <= 60, got ${remaining}`);
  assert.ok(remaining > 59, `should be > 59 (just started), got ${remaining}`);
});

test('getTimeRemainingSec clamps to 0 even when the start was far in the past', () => {
  reset();
  startTimeAttack();
  // performance.now() is time-since-process-start in ms, so a large
  // negative start simulates "more than 60s ago".
  setTimeAttackStart(-1e9);
  assert.equal(getTimeRemainingSec(), 0);
});

test('checkTimeUp is a no-op in non-TIME mode (no event, no callback)', () => {
  reset();
  startStory();
  let gameOver = 0;
  const off = on(EVT.GAME_OVER, () => {
    gameOver++;
  });
  let onUpCalls = 0;
  checkTimeUp(() => {
    onUpCalls++;
  });
  assert.equal(gameOver, 0);
  assert.equal(onUpCalls, 0);
  off();
});

test('checkTimeUp is a no-op when time has not elapsed', () => {
  reset();
  startTimeAttack();
  let gameOver = 0;
  const off = on(EVT.GAME_OVER, () => {
    gameOver++;
  });
  let onUpCalls = 0;
  checkTimeUp(() => {
    onUpCalls++;
  });
  assert.equal(gameOver, 0);
  assert.equal(onUpCalls, 0);
  off();
});

test('checkTimeUp emits GAME_OVER with mode=TIME and calls onUp when time has elapsed', () => {
  reset();
  startTimeAttack();
  // performance.now() is time-since-process-start; use a large negative
  // start to simulate "more than 60s ago".
  setTimeAttackStart(-1e9);
  let payload = null;
  const off = on(EVT.GAME_OVER, (p) => {
    payload = p;
  });
  let onUpCalls = 0;
  checkTimeUp(() => {
    onUpCalls++;
  });
  assert.equal(onUpCalls, 1);
  assert.ok(payload, 'GAME_OVER event should have fired');
  assert.equal(payload.mode, MODE.TIME);
  off();
});

test('checkTimeUp can be invoked without an onUp callback', () => {
  reset();
  startTimeAttack();
  setTimeAttackStart(-1e9);
  let gameOver = 0;
  const off = on(EVT.GAME_OVER, () => {
    gameOver++;
  });
  assert.doesNotThrow(() => checkTimeUp());
  assert.equal(gameOver, 1);
  off();
});

test('setTimeAttackStart and setDailySeed override the stored values', () => {
  reset();
  setTimeAttackStart(1234.5);
  assert.equal(getTimeAttackStart(), 1234.5);
  setDailySeed(42);
  assert.equal(getDailySeed(), 42);
});
