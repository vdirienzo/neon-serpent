// tests/unit/level-select.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Verify the digit-key → level-number mapping
function digitToLevel(code) {
  if (!/^Digit[0-9]$/.test(code)) return null;
  return code === 'Digit0' ? 10 : parseInt(code.replace('Digit', ''), 10);
}

test('Digit1 through Digit9 map to levels 1-9', () => {
  for (let i = 1; i <= 9; i++) {
    assert.equal(digitToLevel('Digit' + i), i);
  }
});

test('Digit0 maps to level 10', () => {
  assert.equal(digitToLevel('Digit0'), 10);
});

test('Non-digit codes return null', () => {
  assert.equal(digitToLevel('KeyA'), null);
  assert.equal(digitToLevel('Enter'), null);
  assert.equal(digitToLevel('Space'), null);
});

test('All 10 levels are covered by digit shortcuts', () => {
  const covered = new Set();
  for (let i = 0; i <= 9; i++) {
    covered.add(digitToLevel('Digit' + i));
  }
  assert.equal(covered.size, 10);
  for (let n = 1; n <= 10; n++) {
    assert.ok(covered.has(n), `level ${n} not reachable by digit`);
  }
});
