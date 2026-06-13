// tests/unit/scoring.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Stub localStorage
globalThis.localStorage = {
  _: {},
  setItem(k, v) {
    this._[k] = v;
  },
  getItem(k) {
    return this._[k] || null;
  },
  removeItem(k) {
    delete this._[k];
  },
  key(i) {
    return Object.keys(this._)[i] || null;
  },
  get length() {
    return Object.keys(this._).length;
  },
};

const Scoring = await import('../../src/game/Scoring.js');

test('recordScore updates hi', () => {
  // Reset by reloading module is hard; assume default 0
  const isNew = Scoring.recordScore(100);
  assert.equal(Scoring.getHi(), 100);
  assert.equal(isNew, true);
});

test('recordSector tracks per-sector', () => {
  Scoring.recordSector(1, 50);
  Scoring.recordSector(2, 80);
  const b = Scoring.getBestBySector();
  assert.equal(b[0], 50);
  assert.equal(b[1], 80);
});

test('recordSector rejects out-of-range', () => {
  const before = Scoring.getBestBySector();
  Scoring.recordSector(0, 9999);
  Scoring.recordSector(6, 9999);
  const after = Scoring.getBestBySector();
  assert.deepEqual(before, after);
});

test('pushLeaderboard maintains top 10', () => {
  for (let i = 0; i < 15; i++) Scoring.pushLeaderboard(i * 10, 1);
  const lb = Scoring.getLeaderboard();
  assert.equal(lb.length, 10);
  // Should be sorted desc
  for (let i = 1; i < lb.length; i++) {
    assert.ok(lb[i - 1].score >= lb[i].score);
  }
});

test('pushLeaderboard rejects zero/negative', () => {
  const before = Scoring.getLeaderboard().length;
  Scoring.pushLeaderboard(0, 1);
  Scoring.pushLeaderboard(-5, 1);
  assert.equal(Scoring.getLeaderboard().length, before);
});
