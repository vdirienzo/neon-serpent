// tests/unit/extra/sw-register.test.js
// Unit tests for src/core/sw-register.js.
//
// The module auto-registers on import. In Node 18+, `navigator` is defined
// globally but `navigator.serviceWorker` is not, so the side-effect is a
// no-op. We test the public API by toggling globalThis.navigator around
// each call and verifying the return value.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { register, unregister } from '../../../src/core/sw-register.js';

function setNavigator(value) {
  const orig = globalThis.navigator;
  Object.defineProperty(globalThis, 'navigator', {
    value,
    configurable: true,
    writable: true
  });
  return () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: orig,
      configurable: true,
      writable: true
    });
  };
}

test('module exports register and unregister as functions', () => {
  assert.equal(typeof register, 'function');
  assert.equal(typeof unregister, 'function');
});

test('unregister() returns a Promise', () => {
  const result = unregister();
  assert.ok(result instanceof Promise);
  return result;
});

test('unregister() resolves to false when navigator is undefined', async () => {
  const restore = setNavigator(undefined);
  try {
    const v = await unregister();
    assert.equal(v, false);
  } finally {
    restore();
  }
});

test('unregister() resolves to false when serviceWorker is undefined', async () => {
  const restore = setNavigator({ userAgent: 'node-test' });
  try {
    const v = await unregister();
    assert.equal(v, false);
  } finally {
    restore();
  }
});

test('register() resolves to null when navigator is undefined', async () => {
  const restore = setNavigator(undefined);
  try {
    const v = await register();
    assert.equal(v, null);
  } finally {
    restore();
  }
});

test('register() resolves to null when serviceWorker is undefined', async () => {
  const restore = setNavigator({ userAgent: 'node-test' });
  try {
    const v = await register();
    assert.equal(v, null);
  } finally {
    restore();
  }
});

test('register() does not throw when navigator is undefined', () => {
  const restore = setNavigator(undefined);
  try {
    assert.doesNotThrow(() => register());
  } finally {
    restore();
  }
});

test('register() does not throw when serviceWorker is undefined', () => {
  const restore = setNavigator({});
  try {
    assert.doesNotThrow(() => register());
  } finally {
    restore();
  }
});
