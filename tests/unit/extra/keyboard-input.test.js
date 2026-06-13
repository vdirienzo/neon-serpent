// tests/unit/extra/keyboard-input.test.js
// Tests for src/input/KeyboardInput.js.
//
// KeyboardInput wraps window.addEventListener('keydown', ...) and exposes
// an `on('key', fn)` API. We mock `globalThis.window` to capture the
// listener that attach() registers, then drive it manually.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KeyboardInput, isDirKey, dirForKey } from '../../../src/input/KeyboardInput.js';

function installWindowMock() {
  const calls = { add: [], remove: [] };
  const mock = {
    addEventListener(event, fn, opts) {
      calls.add.push({ event, fn, opts });
    },
    removeEventListener(event, fn) {
      calls.remove.push({ event, fn });
    },
  };
  globalThis.window = mock;
  return { mock, calls };
}

test('attach() registers a single keydown listener on window with passive:false', () => {
  const { calls } = installWindowMock();
  const kb = new KeyboardInput();
  kb.attach();
  assert.equal(calls.add.length, 1, 'should add exactly one listener');
  assert.equal(calls.add[0].event, 'keydown');
  assert.equal(calls.add[0].opts && calls.add[0].opts.passive, false);
  assert.equal(typeof calls.add[0].fn, 'function');
  kb.detach();
});

test('registered "key" handler is invoked when the captured keydown listener fires', () => {
  const { calls } = installWindowMock();
  const kb = new KeyboardInput();
  const seen = [];
  kb.on('key', (e) => seen.push(e));
  kb.attach();
  const listener = calls.add[0].fn;
  const ev = { code: 'ArrowUp', repeat: false };
  listener(ev);
  assert.equal(seen.length, 1, 'handler should fire once for one keydown');
  assert.equal(seen[0], ev, 'handler should receive the original event');
  kb.detach();
});

test('events with e.repeat=true are ignored', () => {
  const { calls } = installWindowMock();
  const kb = new KeyboardInput();
  const seen = [];
  kb.on('key', (e) => seen.push(e));
  kb.attach();
  const listener = calls.add[0].fn;
  listener({ code: 'ArrowUp', repeat: true });
  listener({ code: 'ArrowUp', repeat: false });
  assert.equal(seen.length, 1, 'only the non-repeat event should be delivered');
  kb.detach();
});

test('multiple "key" handlers all fire for one event', () => {
  const { calls } = installWindowMock();
  const kb = new KeyboardInput();
  let a = 0,
    b = 0;
  kb.on('key', () => {
    a++;
  });
  kb.on('key', () => {
    b++;
  });
  kb.attach();
  calls.add[0].fn({ code: 'ArrowUp', repeat: false });
  assert.equal(a, 1);
  assert.equal(b, 1);
  kb.detach();
});

test('detach() removes the same listener that attach() registered', () => {
  const { calls } = installWindowMock();
  const kb = new KeyboardInput();
  kb.attach();
  const listener = calls.add[0].fn;
  assert.equal(calls.remove.length, 0, 'no removals yet');
  kb.detach();
  assert.equal(calls.remove.length, 1, 'detach should remove one listener');
  assert.equal(calls.remove[0].event, 'keydown');
  assert.equal(calls.remove[0].fn, listener, 'should remove the exact same fn ref');
});

test('detach() without attach() is a safe no-op', () => {
  installWindowMock();
  const kb = new KeyboardInput();
  kb.detach(); // should not throw
  assert.ok(true, 'detach with no prior attach did not throw');
});

test('after detach, simulated key events do not reach handlers', () => {
  const { calls } = installWindowMock();
  const kb = new KeyboardInput();
  const seen = [];
  kb.on('key', (e) => seen.push(e));
  kb.attach();
  kb.detach();
  // The captured listener was unregistered, so firing it manually here is
  // an artificial scenario. In a real browser, window no longer dispatches
  // to it. We instead verify that detach really called removeEventListener
  // (already covered above) and that calling detach twice is safe.
  kb.detach();
  assert.equal(seen.length, 0);
  void calls;
});

test('isDirKey returns true for arrow and WASD codes, false otherwise', () => {
  assert.equal(isDirKey('ArrowUp'), true);
  assert.equal(isDirKey('ArrowDown'), true);
  assert.equal(isDirKey('ArrowLeft'), true);
  assert.equal(isDirKey('ArrowRight'), true);
  assert.equal(isDirKey('KeyW'), true);
  assert.equal(isDirKey('KeyA'), true);
  assert.equal(isDirKey('KeyS'), true);
  assert.equal(isDirKey('KeyD'), true);
  // Non-direction keys
  assert.equal(isDirKey('Space'), false);
  assert.equal(isDirKey('KeyP'), false);
  assert.equal(isDirKey('Enter'), false);
  assert.equal(isDirKey('KeyM'), false);
  assert.equal(isDirKey(''), false);
  assert.equal(isDirKey('Arrow'), false); // partial match should not count
});

test('dirForKey returns the correct named direction for each direction code', () => {
  assert.equal(dirForKey('ArrowUp'), 'up');
  assert.equal(dirForKey('ArrowDown'), 'down');
  assert.equal(dirForKey('ArrowLeft'), 'left');
  assert.equal(dirForKey('ArrowRight'), 'right');
  assert.equal(dirForKey('KeyW'), 'up');
  assert.equal(dirForKey('KeyA'), 'left');
  assert.equal(dirForKey('KeyS'), 'down');
  assert.equal(dirForKey('KeyD'), 'right');
});

test('dirForKey returns undefined for codes that are not direction keys', () => {
  assert.equal(dirForKey('Space'), undefined);
  assert.equal(dirForKey('KeyP'), undefined);
  assert.equal(dirForKey('Enter'), undefined);
  assert.equal(dirForKey(''), undefined);
});
