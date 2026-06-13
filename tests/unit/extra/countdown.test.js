// tests/unit/extra/countdown.test.js
// Countdown.js reads document.getElementById('countdown') and uses setTimeout.
// We mock both: a fake DOM element is returned for #countdown, and we drive
// only the synchronous first-step effects (token + state + textContent).
// The full 3-2-1-GO sequence (real setTimeouts of 1000/1500 ms) is not awaited.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clear as clearBus } from '../../../src/core/EventBus.js';
import { STATE } from '../../../src/config.js';

const _el = {
  _classes: new Set(),
  classList: {
    add: (c) => { _el._classes.add(c); },
    remove: (...cs) => { cs.forEach((c) => _el._classes.delete(c)); },
    contains: (c) => _el._classes.has(c)
  },
  textContent: '',
  offsetWidth: 0
};

globalThis.document = {
  getElementById: (id) => (id === 'countdown' ? _el : null)
};

const { startCountdown, cancelCountdown, getGoStartedAt } =
  await import('../../../src/game/Countdown.js');
const { getState, setState } = await import('../../../src/game/GameState.js');

function reset() {
  _el._classes.clear();
  _el.textContent = '';
  _el.offsetWidth = 0;
  setState(STATE.TITLE);
  clearBus();
}

test('getGoStartedAt is 0 initially and stays 0 after the first synchronous step', () => {
  reset();
  assert.equal(getGoStartedAt(), 0);
  startCountdown();
  // The '3' step writes textContent and adds 'show' synchronously,
  // but the GO step (which sets goStartedAt) only fires after ~3 seconds.
  assert.equal(getGoStartedAt(), 0);
  cancelCountdown();
});

test('startCountdown transitions state to COUNTDOWN', () => {
  reset();
  setState(STATE.TITLE);
  assert.equal(getState(), STATE.TITLE);
  startCountdown();
  assert.equal(getState(), STATE.COUNTDOWN);
  cancelCountdown();
});

test('startCountdown writes "3" to the element and adds the "show" class synchronously', () => {
  reset();
  startCountdown();
  assert.equal(_el.textContent, '3');
  assert.ok(_el.classList.contains('show'), 'should add "show" on step 3');
  assert.ok(!_el.classList.contains('go'), 'should NOT add "go" yet (GO is the last step)');
  cancelCountdown();
});

test('cancelCountdown transitions state back to TITLE', () => {
  reset();
  startCountdown();
  assert.equal(getState(), STATE.COUNTDOWN);
  cancelCountdown();
  assert.equal(getState(), STATE.TITLE);
});

test('a second startCountdown after cancel replaces the first (token bumps)', () => {
  reset();
  startCountdown();
  assert.equal(getState(), STATE.COUNTDOWN);
  cancelCountdown();
  assert.equal(getState(), STATE.TITLE);
  startCountdown();
  // After a fresh start, the element should be reset to '3' again
  // (the second start's first step overwrites the first start's pending step).
  assert.equal(getState(), STATE.COUNTDOWN);
  assert.equal(_el.textContent, '3');
  cancelCountdown();
});

test('startCountdown without #countdown element calls onComplete immediately and still sets COUNTDOWN', () => {
  reset();
  const orig = globalThis.document.getElementById;
  globalThis.document = { getElementById: () => null };
  let called = false;
  startCountdown(() => { called = true; });
  assert.equal(called, true, 'onComplete should be invoked when element is missing');
  assert.equal(getState(), STATE.COUNTDOWN, 'state is set to COUNTDOWN before the element check');
  globalThis.document = { getElementById: orig };
});
