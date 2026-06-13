// tests/unit/eventbus.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { on, off, emit, clear } from '../../src/core/EventBus.js';

test('emit calls handlers with payload', () => {
  clear();
  const seen = [];
  on('test', (p) => seen.push(p));
  emit('test', { x: 1 });
  emit('test', { x: 2 });
  assert.equal(seen.length, 2);
  assert.deepEqual(seen[0], { x: 1 });
});

test('off removes handler', () => {
  clear();
  const seen = [];
  const fn = (p) => seen.push(p);
  on('test', fn);
  emit('test', 1);
  off('test', fn);
  emit('test', 2);
  assert.equal(seen.length, 1);
  assert.equal(seen[0], 1);
});

test('emit with no handlers is no-op', () => {
  clear();
  emit('nonexistent', 42); // should not throw
  assert.ok(true);
});

test('handler error does not stop other handlers', () => {
  clear();
  const seen = [];
  on('test', () => {
    throw new Error('boom');
  });
  on('test', (p) => seen.push(p));
  emit('test', 'ok');
  assert.equal(seen.length, 1);
});

test('on returns unsubscribe function', () => {
  clear();
  const seen = [];
  const unsub = on('test', (p) => seen.push(p));
  emit('test', 1);
  unsub();
  emit('test', 2);
  assert.equal(seen.length, 1);
});
