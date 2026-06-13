// tests/unit/calibration.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for Node test environment
const _store = new Map();
global.localStorage = {
  getItem(k) { return _store.has(k) ? _store.get(k) : null; },
  setItem(k, v) { _store.set(k, String(v)); },
  removeItem(k) { _store.delete(k); },
  clear() { _store.clear(); }
};

const { load, flushSave, get, getAll, set, reset, onChange, DEFAULTS } =
  await import('../../src/ui/CalibrationStore.js');

test('DEFAULTS is frozen and has all 22 calibration keys', () => {
  assert.ok(Object.isFrozen(DEFAULTS));
  const expected = [
    'ambient', 'keyLight', 'fillLight', 'topLight', 'headLight',
    'exposure',
    'fogDensity', 'fogR', 'fogG', 'fogB',
    'crtOpacity', 'crtLineAlpha', 'crtLineR', 'crtLineG', 'crtLineB',
    'vignetteAlpha', 'vignetteR', 'vignetteG', 'vignetteB',
    'pixelRatio', 'snakeEmissive', 'waterOpacity'
  ];
  for (const k of expected) {
    assert.ok(k in DEFAULTS, `missing default for ${k}`);
  }
  assert.equal(Object.keys(DEFAULTS).length, 22);
});

test('load() with empty storage returns defaults', () => {
  _store.clear();
  const state = load();
  assert.equal(state.ambient, DEFAULTS.ambient);
  assert.equal(state.exposure, DEFAULTS.exposure);
  assert.equal(state.fogDensity, DEFAULTS.fogDensity);
});

test('set(key, value) updates current and notifies', () => {
  _store.clear();
  load();
  let calls = 0;
  let lastState = null;
  const off = onChange((s) => { calls++; lastState = s; });
  const callsAfterRegister = calls;
  set('ambient', 0.5);
  assert.equal(calls, callsAfterRegister + 1);
  assert.equal(lastState.ambient, 0.5);
  assert.equal(get('ambient'), 0.5);
  off();
});

test('set() with same value is a no-op (no notify)', () => {
  _store.clear();
  load();
  let calls = 0;
  onChange((s) => { calls = calls + 1 - 0; });
  const baseLine = calls;
  set('ambient', get('ambient'));
  set('exposure', get('exposure'));
  assert.equal(calls, baseLine, 'should not notify on no-op set');
});

test('set() ignores unknown keys', () => {
  _store.clear();
  load();
  const before = getAll();
  set('unknownKey', 999);
  const after = getAll();
  assert.deepEqual(after, before);
});

test('reset() restores defaults and notifies', () => {
  _store.clear();
  load();
  set('ambient', 0.1);
  set('exposure', 0.5);
  let lastState = null;
  const off = onChange((s) => { lastState = s; });
  reset();
  assert.equal(lastState.ambient, DEFAULTS.ambient);
  assert.equal(lastState.exposure, DEFAULTS.exposure);
  off();
});

test('onChange subscriber receives state immediately on register', () => {
  _store.clear();
  load();
  set('ambient', 0.42);
  let received = null;
  const off = onChange((s) => { received = s; });
  assert.ok(received !== null, 'should be called immediately');
  assert.equal(received.ambient, 0.42);
  off();
});

test('onChange unsubscribe stops further notifications', () => {
  _store.clear();
  load();
  let calls = 0;
  const off = onChange(() => { calls++; });
  const before = calls;
  set('ambient', 0.3);
  assert.equal(calls, before + 1);
  off();
  set('ambient', 0.4);
  assert.equal(calls, before + 1, 'should not be called after unsubscribe');
});

test('flushSave() persists immediately to localStorage', () => {
  _store.clear();
  load();
  set('ambient', 0.77);
  flushSave();
  const raw = _store.get('ns:calib');
  assert.ok(raw, 'should have persisted');
  const parsed = JSON.parse(raw);
  assert.equal(parsed.version, 2);
  assert.equal(parsed.values.ambient, 0.77);
});

test('previously saved state can be reloaded from storage', () => {
  _store.clear();
  load();
  set('ambient', 0.33);
  set('exposure', 1.5);
  flushSave();
  const raw = _store.get('ns:calib');
  const saved = JSON.parse(raw);
  assert.equal(saved.values.ambient, 0.33);
  assert.equal(saved.values.exposure, 1.5);
});

test('storage with old version is ignored and defaults are used', () => {
  _store.clear();
  // Simulate old (v1) format
  _store.set('ns:calib', JSON.stringify({ ambient: 999, exposure: 999 }));
  const state = load();
  assert.equal(state.ambient, DEFAULTS.ambient, 'old version should be discarded');
  assert.equal(state.exposure, DEFAULTS.exposure);
});

test('storage with no version field is ignored and defaults are used', () => {
  _store.clear();
  _store.set('ns:calib', JSON.stringify({ ambient: 999 }));
  const state = load();
  assert.equal(state.ambient, DEFAULTS.ambient);
});

test('load() with corrupted JSON falls back to defaults', () => {
  _store.set('ns:calib', '{not valid json');
  const state = load();
  assert.equal(state.ambient, DEFAULTS.ambient);
});

test('multiple subscribers are all called', () => {
  _store.clear();
  load();
  let a = 0, b = 0;
  const offA = onChange(() => { a++; });
  const offB = onChange(() => { b++; });
  const baseA = a, baseB = b;
  set('ambient', 0.2);
  assert.equal(a, baseA + 1);
  assert.equal(b, baseB + 1);
  offA();
  offB();
});

test('subscriber error does not break the chain', () => {
  _store.clear();
  load();
  let reached = false;
  onChange(() => { throw new Error('boom'); });
  const off = onChange(() => { reached = true; });
  set('ambient', 0.11);
  assert.ok(reached, 'subsequent subscribers should still fire');
  off();
});

test('getAll() returns a copy, not the live state', () => {
  _store.clear();
  load();
  const a = getAll();
  a.ambient = 999;
  assert.notEqual(get('ambient'), 999, 'mutating getAll() result must not affect store');
});
