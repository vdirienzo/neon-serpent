// tests/integration/game-flow.test.js
// Integration: GameState + EventBus — verify state transitions fire EVT.STATE_CHANGE.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STATE, EVT } from '../../src/config.js';
import { getState, setState, isPlaying } from '../../src/game/GameState.js';
import { on, clear as clearBus } from '../../src/core/EventBus.js';

test('TITLE -> COUNTDOWN -> PLAYING -> DYING -> OVER transition sequence fires STATE_CHANGE for each', () => {
  clearBus();
  const seen = [];
  const off = on(EVT.STATE_CHANGE, (s) => seen.push(s));

  setState(STATE.TITLE);
  setState(STATE.COUNTDOWN);
  setState(STATE.PLAYING);
  setState(STATE.DYING);
  setState(STATE.OVER);

  assert.deepEqual(seen, [
    STATE.TITLE,
    STATE.COUNTDOWN,
    STATE.PLAYING,
    STATE.DYING,
    STATE.OVER
  ], 'STATE_CHANGE should fire once for each unique transition');

  assert.equal(getState(), STATE.OVER, 'final state should be OVER');
  off();
});

test('isPlaying is true only during COUNTDOWN, PLAYING, DYING', () => {
  setState(STATE.TITLE);     assert.equal(isPlaying(), false);
  setState(STATE.COUNTDOWN); assert.equal(isPlaying(), true);
  setState(STATE.PLAYING);   assert.equal(isPlaying(), true);
  setState(STATE.DYING);     assert.equal(isPlaying(), true);
  setState(STATE.OVER);      assert.equal(isPlaying(), false);
  setState(STATE.WIN);       assert.equal(isPlaying(), false);
  setState(STATE.PAUSED);    assert.equal(isPlaying(), false);
});

test('setState with the same value does not re-emit STATE_CHANGE', () => {
  clearBus();
  setState(STATE.PLAYING);
  let count = 0;
  const off = on(EVT.STATE_CHANGE, () => count++);
  setState(STATE.PLAYING); // no-op
  setState(STATE.PLAYING); // no-op
  assert.equal(count, 0, 'no event should fire for identical state');
  off();
});

test('two independent listeners both receive the same STATE_CHANGE payload', () => {
  clearBus();
  setState(STATE.TITLE);
  const a = [];
  const b = [];
  const offA = on(EVT.STATE_CHANGE, (s) => a.push(s));
  const offB = on(EVT.STATE_CHANGE, (s) => b.push(s));
  setState(STATE.PLAYING);
  setState(STATE.OVER);
  assert.deepEqual(a, [STATE.PLAYING, STATE.OVER]);
  assert.deepEqual(b, [STATE.PLAYING, STATE.OVER]);
  offA();
  offB();
});

test('listener error does not stop subsequent STATE_CHANGE listeners', () => {
  clearBus();
  setState(STATE.TITLE);
  let reached = false;
  on(EVT.STATE_CHANGE, () => { throw new Error('boom'); });
  const off = on(EVT.STATE_CHANGE, (s) => { if (s === STATE.PLAYING) reached = true; });
  setState(STATE.PLAYING);
  assert.ok(reached, 'subsequent listeners must still fire after a handler throws');
  off();
});
