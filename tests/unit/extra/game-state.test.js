// tests/unit/extra/game-state.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STATE, EVT } from '../../../src/config.js';
import { getState, setState, onStateChange, isPlaying } from '../../../src/game/GameState.js';
import { on, clear as clearBus } from '../../../src/core/EventBus.js';

test('getState returns the value last set via setState', () => {
  clearBus();
  setState(STATE.TITLE);
  assert.equal(getState(), STATE.TITLE);
  setState(STATE.PLAYING);
  assert.equal(getState(), STATE.PLAYING);
  setState(STATE.OVER);
  assert.equal(getState(), STATE.OVER);
});

test('setState with the same value is a no-op (no event, no listener call)', () => {
  clearBus();
  setState(STATE.TITLE);
  let stateEvents = 0;
  let listenerCalls = 0;
  const offEvt = on(EVT.STATE_CHANGE, () => { stateEvents++; });
  const offListener = onStateChange(() => { listenerCalls++; });

  setState(STATE.TITLE);
  assert.equal(stateEvents, 0, 'no STATE_CHANGE event for identical value');
  assert.equal(listenerCalls, 0, 'no listener call for identical value');

  offEvt();
  offListener();
});

test('setState emits EVT.STATE_CHANGE with the new state payload', () => {
  clearBus();
  setState(STATE.TITLE);
  const seen = [];
  const off = on(EVT.STATE_CHANGE, (s) => seen.push(s));
  setState(STATE.PLAYING);
  setState(STATE.PAUSED);
  setState(STATE.WIN);
  assert.deepEqual(seen, [STATE.PLAYING, STATE.PAUSED, STATE.WIN]);
  off();
});

test('onStateChange listener is called with the new state, and unsubscribe stops further calls', () => {
  setState(STATE.TITLE);
  let lastSeen = null;
  let calls = 0;
  const off = onStateChange((s) => { lastSeen = s; calls++; });

  setState(STATE.PLAYING);
  assert.equal(lastSeen, STATE.PLAYING);
  assert.equal(calls, 1);

  setState(STATE.WIN);
  assert.equal(lastSeen, STATE.WIN);
  assert.equal(calls, 2);

  off();
  setState(STATE.OVER);
  assert.equal(calls, 2, 'should not be called after unsubscribe');
});

test('multiple onStateChange listeners all receive the new state', () => {
  setState(STATE.TITLE);
  let a = 0, b = 0;
  const offA = onStateChange(() => { a++; });
  const offB = onStateChange(() => { b++; });
  const baseA = a, baseB = b;

  setState(STATE.PLAYING);
  assert.equal(a, baseA + 1);
  assert.equal(b, baseB + 1);

  setState(STATE.PAUSED);
  assert.equal(a, baseA + 2);
  assert.equal(b, baseB + 2);

  offA();
  offB();
});

test('isPlaying is true only for PLAYING, COUNTDOWN, and DYING', () => {
  for (const s of [STATE.LOADING, STATE.TITLE, STATE.PAUSED, STATE.OVER, STATE.WIN]) {
    setState(s);
    assert.equal(isPlaying(), false, `isPlaying() should be false for ${s}`);
  }
  for (const s of [STATE.PLAYING, STATE.COUNTDOWN, STATE.DYING]) {
    setState(s);
    assert.equal(isPlaying(), true, `isPlaying() should be true for ${s}`);
  }
});
