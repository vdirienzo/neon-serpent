// tests/unit/extra/input-queue.test.js
// Tests for src/input/InputQueue.js.
//
// InputQueue wires keyboard + touch to the snake. Its only side effect
// outside `attach()` is calling `snake.setDir(...)` and emitting internal
// 'turn' / 'syskey' events. We mock snake, camera, keyboard, and touch
// with minimal fakes that capture handlers and recorded calls.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InputQueue } from '../../../src/input/InputQueue.js';

function makeSnake() {
  const calls = [];
  return {
    calls,
    setDir(dir) { calls.push(dir); }
  };
}

function makeCamera(pos, lookTarget) {
  // mapDirCamera only reads .x and .z, and InputQueue reads
  // camera.userData._lookTarget, so a plain object is sufficient.
  return {
    position: pos,
    userData: lookTarget !== undefined ? { _lookTarget: lookTarget } : {}
  };
}

function makeInput() {
  // An input object that records `on(event, fn)` calls and exposes a
  // trigger so tests can fire the registered handler.
  const handlers = new Map();
  return {
    handlers,
    on(event, fn) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event).add(fn);
    },
    trigger(event, payload) {
      const set = handlers.get(event);
      if (!set) return;
      for (const fn of set) fn(payload);
    }
  };
}

function makeQueue(opts = {}) {
  const snake = opts.snake || makeSnake();
  const camera = opts.camera || makeCamera({ x: 0, y: 0, z: 10 }, { x: 0, y: 0, z: 0 });
  const keyboard = makeInput();
  const touch = makeInput();
  const q = new InputQueue(snake, camera, keyboard, touch);
  return { q, snake, camera, keyboard, touch };
}

test('arrow key in "playing" state calls snake.setDir with world direction', () => {
  const { q, snake, keyboard } = makeQueue();
  q.attach(() => 'playing');
  // Camera looking north, so ArrowUp -> 'up'
  keyboard.trigger('key', { code: 'ArrowUp', preventDefault() {} });
  assert.deepEqual(snake.calls, ['up']);
});

test('WASD in "playing" state is translated to the same direction as arrows', () => {
  const { q, snake, keyboard } = makeQueue();
  q.attach(() => 'playing');
  keyboard.trigger('key', { code: 'KeyW', preventDefault() {} });
  keyboard.trigger('key', { code: 'KeyA', preventDefault() {} });
  keyboard.trigger('key', { code: 'KeyS', preventDefault() {} });
  keyboard.trigger('key', { code: 'KeyD', preventDefault() {} });
  assert.deepEqual(snake.calls, ['up', 'left', 'down', 'right']);
});

test('arrow key in "countdown" and "dying" states is forwarded to snake', () => {
  for (const state of ['countdown', 'dying']) {
    const { q, snake, keyboard } = makeQueue();
    q.attach(() => state);
    keyboard.trigger('key', { code: 'ArrowRight', preventDefault() {} });
    assert.equal(snake.calls.length, 1, `state=${state} should accept direction input`);
    assert.equal(snake.calls[0], 'right');
  }
});

test('arrow key in "paused" state emits syskey and does not call setDir', () => {
  const { q, snake, keyboard } = makeQueue();
  let syskeyEvent = null;
  q.on('syskey', (e) => { syskeyEvent = e; });
  q.attach(() => 'paused');
  const ev = { code: 'ArrowUp', preventDefault() {} };
  keyboard.trigger('key', ev);
  assert.deepEqual(snake.calls, [], 'snake.setDir should not be called when paused');
  assert.ok(syskeyEvent, 'syskey handler should fire');
  assert.equal(syskeyEvent, ev, 'syskey should receive the original event');
});

test('arrow key in "over", "title", "loading" states emits syskey', () => {
  for (const state of ['over', 'title', 'loading']) {
    const { q, snake, keyboard } = makeQueue();
    let syskeyCount = 0;
    q.on('syskey', () => { syskeyCount++; });
    q.attach(() => state);
    keyboard.trigger('key', { code: 'ArrowDown', preventDefault() {} });
    assert.equal(snake.calls.length, 0, `state=${state} should not setDir`);
    assert.equal(syskeyCount, 1, `state=${state} should emit exactly one syskey`);
  }
});

test('non-direction key (e.g. Space) in "playing" state emits syskey, not setDir', () => {
  const { q, snake, keyboard } = makeQueue();
  let syskeyEvent = null;
  q.on('syskey', (e) => { syskeyEvent = e; });
  q.attach(() => 'playing');
  const ev = { code: 'Space', preventDefault() {} };
  keyboard.trigger('key', ev);
  assert.deepEqual(snake.calls, [], 'non-direction key should not setDir');
  assert.ok(syskeyEvent, 'non-direction key should emit syskey');
  assert.equal(syskeyEvent, ev);
});

test('arrow key in "playing" state calls preventDefault on the event', () => {
  const { q, keyboard } = makeQueue();
  q.attach(() => 'playing');
  let prevented = false;
  keyboard.trigger('key', {
    code: 'ArrowUp',
    preventDefault() { prevented = true; }
  });
  assert.ok(prevented, 'preventDefault should have been called for direction keys');
});

test('touch swipe in "playing" calls snake.setDir with mapped direction', () => {
  const { q, snake, touch } = makeQueue();
  q.attach(() => 'playing');
  touch.trigger('swipe', 'right');
  // Camera looks north, so 'right' swipe -> world 'right'
  assert.deepEqual(snake.calls, ['right']);
});

test('touch swipe in "dying" and "countdown" is forwarded to snake', () => {
  for (const state of ['dying', 'countdown']) {
    const { q, snake, touch } = makeQueue();
    q.attach(() => state);
    touch.trigger('swipe', 'left');
    assert.equal(snake.calls.length, 1, `state=${state} should accept swipe`);
  }
});

test('touch swipe in non-input states is ignored (no setDir)', () => {
  for (const state of ['paused', 'over', 'title', 'loading', 'win']) {
    const { q, snake, touch } = makeQueue();
    q.attach(() => state);
    touch.trigger('swipe', 'up');
    assert.equal(snake.calls.length, 0, `state=${state} should ignore swipes`);
  }
});

test('turn event is emitted with { from, to } payload', () => {
  const { q, keyboard } = makeQueue();
  const turns = [];
  q.on('turn', (p) => turns.push(p));
  q.attach(() => 'playing');
  keyboard.trigger('key', { code: 'ArrowUp', preventDefault() {} });
  assert.equal(turns.length, 1);
  assert.equal(turns[0].from, 'up');
  assert.equal(turns[0].to, 'up');
});

test('camera.userData._lookTarget is used as the look-at for direction mapping', () => {
  // Camera at +Z looking at (10, 0, 0): forward is (10, -10) normalized -> NE.
  // The 'up' arrow (screen up) -> world 'up' (since the -Z component wins).
  const camera = makeCamera({ x: 0, y: 0, z: 10 }, { x: 10, y: 0, z: 0 });
  const { q, snake, keyboard } = makeQueue({ camera });
  q.attach(() => 'playing');
  keyboard.trigger('key', { code: 'ArrowUp', preventDefault() {} });
  assert.equal(snake.calls[0], 'up');
});

test('falls back to camera.position when userData._lookTarget is missing', () => {
  // No _lookTarget provided, so the code uses camera.position as both
  // pos and target, which means forward = (0, 0). It then defaults to -Z
  // forward (see bestDirName behavior in input-mapper tests).
  const camera = makeCamera({ x: 0, y: 0, z: 10 });
  const { q, snake, keyboard } = makeQueue({ camera });
  q.attach(() => 'playing');
  keyboard.trigger('key', { code: 'ArrowUp', preventDefault() {} });
  // With fallback default (forward = -Z), 'up' maps to 'up'.
  assert.equal(snake.calls[0], 'up');
});

test('getState is re-evaluated on every event (state can change between events)', () => {
  // state() returns 'playing' the first call and 'paused' the second.
  let n = 0;
  const { q, snake, keyboard } = makeQueue();
  q.attach(() => (n++ === 0 ? 'playing' : 'paused'));
  keyboard.trigger('key', { code: 'ArrowUp', preventDefault() {} });
  assert.equal(snake.calls.length, 1, 'first event in playing should setDir');
  // Second event now sees 'paused' and must emit syskey instead
  let syskey = 0;
  q.on('syskey', () => { syskey++; });
  keyboard.trigger('key', { code: 'ArrowUp', preventDefault() {} });
  assert.equal(snake.calls.length, 1, 'no new setDir call after pausing');
  assert.equal(syskey, 1, 'syskey should fire on the second event');
});

test('handlers registered before attach are called', () => {
  const { q, snake, keyboard } = makeQueue();
  const turns = [];
  q.on('turn', (p) => turns.push(p));
  q.attach(() => 'playing');
  keyboard.trigger('key', { code: 'ArrowDown', preventDefault() {} });
  assert.equal(turns.length, 1, 'pre-attach handler should still fire');
  assert.equal(turns[0].to, 'down');
});
