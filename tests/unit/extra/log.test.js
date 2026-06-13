// tests/unit/extra/log.test.js
// Unit tests for src/core/Log.js.
//
// Log.js keeps the level in module-scoped state. We stub the four
// console methods per-test to count invocations, and always restore
// them. The level is reset via setLevel() in every test so order
// does not matter.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { log, setLevel } from '../../../src/core/Log.js';

// Install console spies that count calls and remember their args.
// Returns a restore() that puts the originals back.
function spyConsole() {
  const counts = { debug: 0, info: 0, warn: 0, error: 0 };
  const lastArgs = { debug: null, info: null, warn: null, error: null };
  const orig = {
    debug: console.debug,
    info:  console.info,
    warn:  console.warn,
    error: console.error
  };
  for (const k of Object.keys(counts)) {
    console[k] = (...args) => {
      counts[k]++;
      lastArgs[k] = args;
    };
  }
  return {
    counts,
    lastArgs,
    restore() {
      for (const k of Object.keys(orig)) console[k] = orig[k];
    }
  };
}

test('log object exposes debug, info, warn, error as functions', () => {
  assert.equal(typeof log.debug, 'function');
  assert.equal(typeof log.info,  'function');
  assert.equal(typeof log.warn,  'function');
  assert.equal(typeof log.error, 'function');
});

test('setLevel accepts every valid level', () => {
  setLevel('debug');
  setLevel('info');
  setLevel('warn');
  setLevel('error');
  setLevel('none');
  // No throw = success.
  assert.ok(true);
});

test('setLevel ignores unknown levels (level stays unchanged)', () => {
  setLevel('warn');
  const spy = spyConsole();
  // 'bogus' is not a known level — it should be ignored.
  setLevel('bogus');
  // If the level silently fell back to 'debug', log.debug would call
  // console.debug. It must not, so the level is still 'warn'.
  log.debug('should be silent');
  log.info('should be silent');
  spy.restore();
  assert.equal(spy.counts.debug, 0, 'debug must be silent at warn');
  assert.equal(spy.counts.info,  0, 'info must be silent at warn');
});

test('messages are prefixed with the upper-cased level tag', () => {
  setLevel('debug');
  const spy = spyConsole();
  log.debug('a');
  log.info('b');
  log.warn('c');
  log.error('d');
  assert.equal(spy.lastArgs.debug[0], '[DEBUG]');
  assert.equal(spy.lastArgs.info[0],  '[INFO]');
  assert.equal(spy.lastArgs.warn[0],  '[WARN]');
  assert.equal(spy.lastArgs.error[0], '[ERROR]');
  // The rest of the args are forwarded verbatim.
  assert.equal(spy.lastArgs.debug[1], 'a');
  assert.equal(spy.lastArgs.warn[1],  'c');
  spy.restore();
});

test('at level warn, debug and info are suppressed, warn and error fire', () => {
  setLevel('warn');
  const spy = spyConsole();
  log.debug('d');
  log.info('i');
  log.warn('w');
  log.error('e');
  assert.equal(spy.counts.debug, 0);
  assert.equal(spy.counts.info,  0);
  assert.equal(spy.counts.warn,  1);
  assert.equal(spy.counts.error, 1);
  spy.restore();
});

test('at level debug, every method fires once', () => {
  setLevel('debug');
  const spy = spyConsole();
  log.debug('d');
  log.info('i');
  log.warn('w');
  log.error('e');
  assert.equal(spy.counts.debug, 1);
  assert.equal(spy.counts.info,  1);
  assert.equal(spy.counts.warn,  1);
  assert.equal(spy.counts.error, 1);
  spy.restore();
});

test('at level none, nothing fires', () => {
  setLevel('none');
  const spy = spyConsole();
  log.debug('d');
  log.info('i');
  log.warn('w');
  log.error('e');
  assert.equal(spy.counts.debug, 0);
  assert.equal(spy.counts.info,  0);
  assert.equal(spy.counts.warn,  0);
  assert.equal(spy.counts.error, 0);
  spy.restore();
});

test('at level error, only error fires', () => {
  setLevel('error');
  const spy = spyConsole();
  log.debug('d');
  log.info('i');
  log.warn('w');
  log.error('e');
  assert.equal(spy.counts.debug, 0);
  assert.equal(spy.counts.info,  0);
  assert.equal(spy.counts.warn,  0);
  assert.equal(spy.counts.error, 1);
  spy.restore();
});

test('multiple arguments are forwarded in order', () => {
  setLevel('debug');
  const spy = spyConsole();
  log.warn('msg', 42, { x: 1 });
  // Log.js prepends '[WARN]' to whatever you pass, so the spy receives
  // 4 elements: the level tag, then the three user-supplied args.
  assert.equal(spy.lastArgs.warn.length, 4);
  assert.equal(spy.lastArgs.warn[0], '[WARN]');
  assert.equal(spy.lastArgs.warn[1], 'msg');
  assert.equal(spy.lastArgs.warn[2], 42);
  assert.deepEqual(spy.lastArgs.warn[3], { x: 1 });
  spy.restore();
});
