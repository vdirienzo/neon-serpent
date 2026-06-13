// tests/unit/extra/errors.test.js
// Unit tests for src/core/Errors.js.
//
// Errors.js auto-installs on import by calling globalThis.addEventListener.
// To make this observable, we install a mock for addEventListener/removeEventListener
// on globalThis BEFORE the dynamic import, so we can capture the registered
// listeners. We also expose a `_triggerError` / `_triggerRejection` helper pair
// so individual tests can dispatch synthetic events to the registered handlers.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const _listeners = new Map(); // type -> [fn, ...]
const _installLog = []; // ['add'|'remove', type, fn]

globalThis.addEventListener = function (type, fn) {
  _installLog.push(['add', type, fn]);
  if (!_listeners.has(type)) _listeners.set(type, []);
  _listeners.get(type).push(fn);
};
globalThis.removeEventListener = function (type, fn) {
  _installLog.push(['remove', type, fn]);
  if (!_listeners.has(type)) return;
  _listeners.set(
    type,
    _listeners.get(type).filter((f) => f !== fn)
  );
};

function dispatch(type, event) {
  const list = _listeners.get(type) || [];
  for (const fn of list.slice()) {
    try {
      fn(event);
    } catch (e) {
      /* swallow */
    }
  }
}

function resetListeners() {
  _listeners.clear();
  _installLog.length = 0;
}

const Errors = await import('../../../src/core/Errors.js');

test('install() on import registers error and unhandledrejection listeners', () => {
  const adds = _installLog.filter((e) => e[0] === 'add');
  const types = adds.map((e) => e[1]);
  assert.ok(types.includes('error'), 'should listen for error');
  assert.ok(types.includes('unhandledrejection'), 'should listen for unhandledrejection');
  assert.equal(Errors.isInstalled(), true);
});

test('install() is idempotent', () => {
  const before = _installLog.filter((e) => e[0] === 'add').length;
  Errors.install();
  Errors.install();
  const after = _installLog.filter((e) => e[0] === 'add').length;
  assert.equal(before, after, 'install() must not re-register');
});

test('uninstall() removes the listeners', () => {
  assert.equal(Errors.uninstall(), true);
  assert.equal(Errors.isInstalled(), false);
  // Re-install for downstream tests.
  Errors.install();
  assert.equal(Errors.isInstalled(), true);
});

test('safeCall returns the function result on success', () => {
  const v = Errors.safeCall(() => 42);
  assert.equal(v, 42);
});

test('safeCall returns the static fallback on error', () => {
  const v = Errors.safeCall(() => {
    throw new Error('boom');
  }, 'fallback');
  assert.equal(v, 'fallback');
});

test('safeCall invokes the function fallback with the caught error', () => {
  const sentinel = new RangeError('x');
  const v = Errors.safeCall(
    () => {
      throw sentinel;
    },
    (e) => 'got:' + e.message
  );
  assert.equal(v, 'got:x');
  assert.ok(v.startsWith('got:'));
});

test('safeCall reports the error to the configured reporter', () => {
  const reports = [];
  Errors.setReporter((rec) => reports.push(rec));
  Errors.safeCall(() => {
    throw new Error('reported');
  });
  Errors.setReporter(null);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].kind, 'safeCall');
  assert.equal(reports[0].message, 'reported');
  assert.ok(reports[0].stack, 'reporter should receive a stack');
});

test('safeCall triggers the toast handler on error', () => {
  const toasts = [];
  Errors.setToastHandler((msg, kind) => toasts.push([msg, kind]));
  Errors.safeCall(() => {
    throw new Error('shown');
  });
  Errors.setToastHandler(null);
  assert.equal(toasts.length, 1);
  assert.match(toasts[0][0], /shown/);
  assert.equal(toasts[0][1], 'mag');
});

test('safeCall tolerates a throwing reporter and a throwing toast handler', () => {
  Errors.setReporter(() => {
    throw new Error('r');
  });
  Errors.setToastHandler(() => {
    throw new Error('t');
  });
  assert.doesNotThrow(() =>
    Errors.safeCall(() => {
      throw new Error('orig');
    }, 'fb')
  );
  assert.equal(
    Errors.safeCall(() => {
      throw new Error('orig');
    }, 'fb'),
    'fb'
  );
  Errors.setReporter(null);
  Errors.setToastHandler(null);
});

test('safeCall reports when fn is not a function', () => {
  const reports = [];
  Errors.setReporter((rec) => reports.push(rec));
  const v = Errors.safeCall(null, 'fb');
  assert.equal(v, 'fb');
  assert.equal(reports.length, 1);
  assert.equal(reports[0].kind, 'safeCall');
  assert.match(reports[0].message, /not a function/);
  Errors.setReporter(null);
});

test('safeCall invokes the function fallback with a TypeError when fn is not a function', () => {
  const v = Errors.safeCall(undefined, (e) => e instanceof TypeError);
  assert.equal(v, true);
});

test('safeCallAsync resolves with the function result on success', async () => {
  const v = await Errors.safeCallAsync(async () => 'ok');
  assert.equal(v, 'ok');
});

test('safeCallAsync catches a rejected promise and returns the fallback', async () => {
  const v = await Errors.safeCallAsync(async () => {
    throw new Error('async-boom');
  }, 'fb');
  assert.equal(v, 'fb');
});

test('safeCallAsync reports the rejection to the reporter', async () => {
  const reports = [];
  Errors.setReporter((rec) => reports.push(rec));
  await Errors.safeCallAsync(async () => {
    throw new Error('a');
  });
  Errors.setReporter(null);
  assert.ok(reports.length >= 1);
  assert.equal(reports[0].kind, 'safeCallAsync');
  assert.equal(reports[0].message, 'a');
});

test('error event handler records source, line, and column from the event', () => {
  resetListeners();
  Errors.uninstall();
  Errors.install();
  const reports = [];
  Errors.setReporter((rec) => reports.push(rec));
  dispatch('error', {
    error: new Error('boot fail'),
    filename: 'https://example.com/app.js',
    lineno: 17,
    colno: 4,
  });
  Errors.setReporter(null);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].message, 'boot fail');
  assert.equal(reports[0].source, 'https://example.com/app.js');
  assert.equal(reports[0].line, 17);
  assert.equal(reports[0].col, 4);
});

test('error event handler shows a toast', () => {
  const toasts = [];
  Errors.setToastHandler((msg, kind) => toasts.push([msg, kind]));
  dispatch('error', { error: new Error('toast-me'), message: 'toast-me' });
  Errors.setToastHandler(null);
  assert.equal(toasts.length, 1);
  assert.match(toasts[0][0], /toast-me/);
});

test('unhandledrejection handler records kind=unhandledrejection', () => {
  const reports = [];
  Errors.setReporter((rec) => reports.push(rec));
  dispatch('unhandledrejection', { reason: new Error('async-fail') });
  Errors.setReporter(null);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].kind, 'unhandledrejection');
  assert.equal(reports[0].message, 'async-fail');
});

test('unhandledrejection handler accepts non-Error reasons', () => {
  const reports = [];
  Errors.setReporter((rec) => reports.push(rec));
  dispatch('unhandledrejection', { reason: 'string reason' });
  Errors.setReporter(null);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].message, 'string reason');
});

test('setReporter accepts only functions (or null)', () => {
  Errors.setReporter('not a function');
  // Should not throw; safeCall should still work and not call a non-function.
  const reports = [];
  Errors.setReporter((rec) => reports.push(rec));
  Errors.safeCall(() => {
    throw new Error('x');
  });
  assert.equal(reports.length, 1);
  Errors.setReporter(null);
});

test('setToastHandler accepts only functions (or null)', () => {
  Errors.setToastHandler(42);
  const toasts = [];
  Errors.setToastHandler((msg, kind) => toasts.push([msg, kind]));
  Errors.safeCall(() => {
    throw new Error('y');
  });
  assert.equal(toasts.length, 1);
  Errors.setToastHandler(null);
});
