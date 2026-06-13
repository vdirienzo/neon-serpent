// tests/unit/extra/assert.test.js
// Unit tests for src/core/Assert.js.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assert as assertIt } from '../../../src/core/Assert.js';

test('passes silently for truthy conditions', () => {
  assertIt(true);
  assertIt(1);
  assertIt('hello');
  assertIt({});
  assertIt([]);
  assertIt(0 === 0);
  // If we get here, nothing threw.
  assert.ok(true);
});

test('throws for every falsy condition', () => {
  assert.throws(() => assertIt(false), /Assertion failed/);
  assert.throws(() => assertIt(0),     /Assertion failed/);
  assert.throws(() => assertIt(''),    /Assertion failed/);
  assert.throws(() => assertIt(null),  /Assertion failed/);
  assert.throws(() => assertIt(undefined), /Assertion failed/);
  assert.throws(() => assertIt(NaN),   /Assertion failed/);
});

test('thrown error includes the supplied message', () => {
  try {
    assertIt(false, 'something went wrong');
    assert.fail('assertIt should have thrown');
  } catch (e) {
    assert.ok(e instanceof Error);
    assert.match(e.message, /Assertion failed/);
    assert.match(e.message, /something went wrong/);
  }
});

test('thrown error without a message still has the prefix', () => {
  try {
    assertIt(false);
    assert.fail('assertIt should have thrown');
  } catch (e) {
    assert.ok(e instanceof Error);
    assert.match(e.message, /Assertion failed/);
  }
});

test('objects and arrays (truthy) are accepted as conditions', () => {
  assertIt({ a: 1 });
  assertIt([1, 2, 3]);
  assertIt('non-empty');
});
