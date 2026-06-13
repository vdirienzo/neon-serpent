// tests/unit/extra/store.test.js
// Unit tests for src/core/Store.js.
//
// Store.js probes global localStorage at module load time to decide
// whether to use it (persistent) or an in-memory Map (fallback). The
// mock below must be installed BEFORE the import, and it must expose
// `length` and `key(i)` because Store.clearAll iterates the storage
// looking for the 'ns_' prefix.

import { test } from 'node:test';
import assert from 'node:assert/strict';

// In-memory localStorage shim with the full surface Store.js needs.
const _store = new Map();
global.localStorage = {
  getItem(k) {
    return _store.has(k) ? _store.get(k) : null;
  },
  setItem(k, v) {
    _store.set(k, String(v));
  },
  removeItem(k) {
    _store.delete(k);
  },
  clear() {
    _store.clear();
  },
  get length() {
    return _store.size;
  },
  key(i) {
    let n = 0;
    for (const k of _store.keys()) {
      if (n === i) return k;
      n++;
    }
    return null;
  },
};

const { isPersistent, get, set, remove, clearAll } = await import('../../../src/core/Store.js');

test('isPersistent is true when localStorage is available', () => {
  assert.equal(isPersistent, true);
});

test('get returns the provided default for missing keys', () => {
  _store.clear();
  assert.equal(get('missing', 'fallback'), 'fallback');
  assert.equal(get('missing', null), null);
  assert.equal(get('missing', 0), 0);
  assert.equal(get('missing', false), false);
  assert.deepEqual(get('missing', { a: 1 }), { a: 1 });
});

test('get returns the stored value after set', () => {
  _store.clear();
  set('greeting', 'hello');
  assert.equal(get('greeting'), 'hello');
  set('count', 42);
  assert.equal(get('count'), 42);
  set('flag', true);
  assert.equal(get('flag'), true);
});

test('values are JSON-serialized in localStorage under ns_ prefix', () => {
  _store.clear();
  set('user', { name: 'ada', tags: ['x', 'y'] });
  const raw = _store.get('ns_user');
  assert.ok(raw, 'expected ns_user key in storage');
  const parsed = JSON.parse(raw);
  assert.deepEqual(parsed, { name: 'ada', tags: ['x', 'y'] });
});

test('set supports all JSON-serializable types', () => {
  _store.clear();
  set('s', 'string');
  set('n', 123);
  set('f', 3.14);
  set('b', true);
  set('z', null);
  set('arr', [1, 2, 3]);
  set('obj', { x: 'y' });
  assert.equal(get('s'), 'string');
  assert.equal(get('n'), 123);
  assert.equal(get('f'), 3.14);
  assert.equal(get('b'), true);
  assert.equal(get('z'), null);
  assert.deepEqual(get('arr'), [1, 2, 3]);
  assert.deepEqual(get('obj'), { x: 'y' });
});

test('set overwrites a previous value', () => {
  _store.clear();
  set('k', 'first');
  set('k', 'second');
  assert.equal(get('k'), 'second');
});

test('remove deletes a key', () => {
  _store.clear();
  set('temp', 'value');
  assert.equal(get('temp'), 'value');
  remove('temp');
  assert.equal(get('temp', 'gone'), 'gone');
});

test('remove of a missing key is a no-op (does not throw)', () => {
  _store.clear();
  remove('never-existed');
  // No throw = pass.
  assert.ok(true);
});

test('get returns the default for corrupted JSON', () => {
  _store.clear();
  _store.set('ns_broken', '{not valid json');
  assert.equal(get('broken', 'fallback'), 'fallback');
});

test('keys are stored under the ns_ prefix', () => {
  _store.clear();
  set('foo', 'bar');
  assert.ok(_store.has('ns_foo'), 'ns_foo must exist in storage');
  assert.equal(_store.has('foo'), false, 'unprefixed key must not exist');
});

test('clearAll removes every ns_ prefixed key', () => {
  _store.clear();
  set('a', 1);
  set('b', 2);
  set('c', 3);
  clearAll();
  assert.equal(get('a', undefined), undefined);
  assert.equal(get('b', undefined), undefined);
  assert.equal(get('c', undefined), undefined);
  assert.equal(_store.size, 0, 'storage should be empty');
});

test('clearAll leaves non-prefixed keys alone', () => {
  _store.clear();
  set('mine', 1);
  _store.set('foreign', 'keep me');
  _store.set('also_foreign', 'keep me too');
  clearAll();
  assert.equal(_store.get('foreign'), 'keep me');
  assert.equal(_store.get('also_foreign'), 'keep me too');
  assert.equal(_store.has('ns_mine'), false, 'ns_ key should be removed');
});
