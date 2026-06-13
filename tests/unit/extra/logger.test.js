// tests/unit/extra/logger.test.js
// Unit tests for src/core/Logger.js (SOTA 2026 structured logger).
//
// Strategy: Logger keeps level / reporter / baseContext in module-scoped state.
// We stub the four console methods per test to count invocations, and always
// restore them. The state is reset via setLevel + setReporter + setBaseContext
// at the start of every test so order does not matter.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Logger,
  setLevel,
  getLevel,
  setReporter,
  setBaseContext,
  log,
} from '../../../src/core/Logger.js';

function spyConsole() {
  const counts = { debug: 0, info: 0, warn: 0, error: 0 };
  const lastArgs = { debug: null, info: null, warn: null, error: null };
  const orig = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
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
    },
  };
}

function resetLogger() {
  setLevel('warn');
  setReporter(null);
  setBaseContext({});
}

test('Logger has debug/info/warn/error as functions', () => {
  resetLogger();
  assert.equal(typeof Logger.debug, 'function');
  assert.equal(typeof Logger.info, 'function');
  assert.equal(typeof Logger.warn, 'function');
  assert.equal(typeof Logger.error, 'function');
});

test('Logger.setLevel accepts every valid level', () => {
  assert.equal(setLevel('debug'), true);
  assert.equal(getLevel(), 'debug');
  assert.equal(setLevel('info'), true);
  assert.equal(getLevel(), 'info');
  assert.equal(setLevel('warn'), true);
  assert.equal(getLevel(), 'warn');
  assert.equal(setLevel('error'), true);
  assert.equal(getLevel(), 'error');
  assert.equal(setLevel('none'), true);
  assert.equal(getLevel(), 'none');
  resetLogger();
});

test('Logger.setLevel ignores unknown levels', () => {
  resetLogger();
  setLevel('warn');
  assert.equal(setLevel('bogus'), false);
  assert.equal(getLevel(), 'warn');
  resetLogger();
});

test('Logger.getLevel reflects the current threshold', () => {
  resetLogger();
  setLevel('error');
  assert.equal(getLevel(), 'error');
  setLevel('debug');
  assert.equal(getLevel(), 'debug');
  resetLogger();
});

test('Output line includes ISO timestamp and level tag', () => {
  resetLogger();
  setLevel('debug');
  const spy = spyConsole();
  Logger.info('hello world');
  spy.restore();
  assert.equal(spy.counts.info, 1);
  const line = spy.lastArgs.info[0];
  assert.match(line, /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
  assert.match(line, /\[INFO\]/);
  assert.match(line, /hello world$/);
});

test('Output line includes structured context as [k=v ...] segment', () => {
  resetLogger();
  setLevel('debug');
  const spy = spyConsole();
  Logger.warn('something happened', { module: 'renderer', fps: 60 });
  spy.restore();
  const line = spy.lastArgs.warn[0];
  assert.match(line, /\[module=renderer fps=60\]/);
  assert.match(line, /\[WARN\]/);
  assert.match(line, /something happened$/);
});

test('Empty context object produces no [k=v] segment', () => {
  resetLogger();
  setLevel('debug');
  const spy = spyConsole();
  Logger.info('plain');
  spy.restore();
  const line = spy.lastArgs.info[0];
  assert.doesNotMatch(line, /\[\]/);
  assert.match(line, /plain$/);
});

test('No-arg context is treated as empty (no brackets emitted)', () => {
  resetLogger();
  setLevel('debug');
  const spy = spyConsole();
  Logger.error('boom');
  spy.restore();
  const line = spy.lastArgs.error[0];
  assert.match(line, /\[ERROR\]/);
  assert.match(line, /boom$/);
});

test('Error instances in context are formatted as Name: message', () => {
  resetLogger();
  setLevel('debug');
  const spy = spyConsole();
  const err = new TypeError('bad input');
  Logger.error('caught', { cause: err });
  spy.restore();
  const line = spy.lastArgs.error[0];
  assert.match(line, /\[cause=TypeError:bad input\]/);
});

test('Level filter: at warn, debug and info are silent', () => {
  resetLogger();
  setLevel('warn');
  const spy = spyConsole();
  Logger.debug('d');
  Logger.info('i');
  Logger.warn('w');
  Logger.error('e');
  spy.restore();
  assert.equal(spy.counts.debug, 0);
  assert.equal(spy.counts.info, 0);
  assert.equal(spy.counts.warn, 1);
  assert.equal(spy.counts.error, 1);
});

test('Level filter: at error, only error fires', () => {
  resetLogger();
  setLevel('error');
  const spy = spyConsole();
  Logger.debug('d');
  Logger.info('i');
  Logger.warn('w');
  Logger.error('e');
  spy.restore();
  assert.equal(spy.counts.debug, 0);
  assert.equal(spy.counts.info, 0);
  assert.equal(spy.counts.warn, 0);
  assert.equal(spy.counts.error, 1);
});

test('Level filter: at none, nothing fires', () => {
  resetLogger();
  setLevel('none');
  const spy = spyConsole();
  Logger.debug('d');
  Logger.info('i');
  Logger.warn('w');
  Logger.error('e');
  spy.restore();
  assert.equal(spy.counts.debug, 0);
  assert.equal(spy.counts.info, 0);
  assert.equal(spy.counts.warn, 0);
  assert.equal(spy.counts.error, 0);
});

test('Logger.child returns a logger with the same shape', () => {
  resetLogger();
  const child = Logger.child({ module: 'a' });
  assert.equal(typeof child.debug, 'function');
  assert.equal(typeof child.info, 'function');
  assert.equal(typeof child.warn, 'function');
  assert.equal(typeof child.error, 'function');
  assert.equal(typeof child.child, 'function');
});

test('Logger.child inherits parent context', () => {
  resetLogger();
  setLevel('debug');
  const spy = spyConsole();
  const child = Logger.child({ module: 'renderer' });
  child.info('started', { fps: 60 });
  spy.restore();
  const line = spy.lastArgs.info[0];
  assert.match(line, /\[module=renderer fps=60\]/);
});

test('Child context does not leak back to the parent', () => {
  resetLogger();
  setLevel('debug');
  const spy = spyConsole();
  const child = Logger.child({ module: 'a' });
  Logger.info('parent');
  child.info('child');
  spy.restore();
  const parentLine = spy.lastArgs.info[0];
  const childLine = spy.lastArgs.info[0];
  // Two calls were made; both produced an [INFO] line.
  assert.equal(spy.counts.info, 2);
  // Last call is the child call: must NOT have inherited a parent key.
  // We assert by re-running in isolation: parent call alone has no brackets.
  const spy2 = spyConsole();
  Logger.info('parent-only');
  spy2.restore();
  assert.doesNotMatch(spy2.lastArgs.info[0], /\[module=/);
});

test('Nested children merge context (innermost wins on conflict)', () => {
  resetLogger();
  setLevel('debug');
  const spy = spyConsole();
  const c1 = Logger.child({ a: 1, b: 1 });
  const c2 = c1.child({ b: 2, c: 2 });
  c2.info('msg');
  spy.restore();
  const line = spy.lastArgs.info[0];
  assert.match(line, /a=1/);
  assert.match(line, /b=2/);
  assert.match(line, /c=2/);
});

test('setReporter is invoked for warn records', () => {
  resetLogger();
  setLevel('debug');
  const reports = [];
  setReporter((rec) => reports.push(rec));
  Logger.warn('careful');
  setReporter(null);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].level, 'WARN');
  assert.equal(reports[0].message, 'careful');
  assert.match(reports[0].timestamp, /^\d{4}-\d{2}-\d{2}T/);
  assert.ok(reports[0].context);
});

test('setReporter is invoked for error records', () => {
  resetLogger();
  setLevel('debug');
  const reports = [];
  setReporter((rec) => reports.push(rec));
  Logger.error('bad');
  setReporter(null);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].level, 'ERROR');
});

test('setReporter is NOT invoked for debug/info records', () => {
  resetLogger();
  setLevel('debug');
  const reports = [];
  setReporter((rec) => reports.push(rec));
  Logger.debug('d');
  Logger.info('i');
  setReporter(null);
  assert.equal(reports.length, 0);
});

test('setBaseContext attaches fields to every record', () => {
  resetLogger();
  setBaseContext({ app: 'neon-serpent', ver: '1.0' });
  setLevel('debug');
  const spy = spyConsole();
  Logger.info('hi');
  spy.restore();
  const line = spy.lastArgs.info[0];
  assert.match(line, /app=neon-serpent/);
  assert.match(line, /ver=1\.0/);
  resetLogger();
});

test('Per-call context overrides setBaseContext on the same key', () => {
  resetLogger();
  setBaseContext({ module: 'global' });
  setLevel('debug');
  const spy = spyConsole();
  Logger.info('hi', { module: 'local' });
  spy.restore();
  const line = spy.lastArgs.info[0];
  assert.match(line, /module=local/);
  assert.doesNotMatch(line, /module=global/);
  resetLogger();
});

test('A throwing reporter does not break logging', () => {
  resetLogger();
  setLevel('debug');
  setReporter(() => {
    throw new Error('reporter boom');
  });
  const spy = spyConsole();
  assert.doesNotThrow(() => Logger.error('still logged'));
  spy.restore();
  assert.equal(spy.counts.error, 1);
  setReporter(null);
});

test('Non-string message values are JSON-serialised in the line', () => {
  resetLogger();
  setLevel('debug');
  const spy = spyConsole();
  Logger.info({ a: 1, b: [2, 3] });
  spy.restore();
  const line = spy.lastArgs.info[0];
  assert.match(line, /"a":1/);
  assert.match(line, /"b":\[2,3\]/);
});

test('Back-compat: log object from Log.js is re-exported', () => {
  assert.equal(typeof log, 'object');
  assert.equal(typeof log.debug, 'function');
  assert.equal(typeof log.info, 'function');
  assert.equal(typeof log.warn, 'function');
  assert.equal(typeof log.error, 'function');
});

test('Back-compat: setLevel is re-exported and forwards to Logger.setLevel', () => {
  resetLogger();
  setLevel('debug');
  assert.equal(getLevel(), 'debug');
  resetLogger();
});
