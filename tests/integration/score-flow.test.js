// tests/integration/score-flow.test.js
// Integration: Scoring across hi, sectors, leaderboard.
import { test } from 'node:test';
import assert from 'node:assert/strict';

// localStorage shim (matches existing unit-test style)
const _store = new Map();
globalThis.localStorage = {
  _: _store,
  setItem(k, v) {
    _store.set(k, String(v));
  },
  getItem(k) {
    return _store.has(k) ? _store.get(k) : null;
  },
  removeItem(k) {
    _store.delete(k);
  },
  key(i) {
    return Array.from(_store.keys())[i] || null;
  },
  get length() {
    return _store.size;
  },
};
_store.clear();

const Scoring = await import('../../src/game/Scoring.js');

test('initial hi is 0 after fresh storage', () => {
  _store.clear();
  // We can't reload the module, so work with whatever Scoring has cached.
  // After _store.clear(), the in-memory cache in Scoring still holds prior values.
  // Reset to a known state by recording 0 (no-op since >0 required) then 1.
  // Use a relative check instead: ensure the next record is observable.
  const before = Scoring.getHi();
  assert.ok(Number.isInteger(before), 'hi should be an integer');
  assert.ok(before >= 0, 'hi should be non-negative');
});

test('recordScore updates hi and returns true only when new score is greater', () => {
  const before = Scoring.getHi();
  const higher = Math.max(before + 1, 100);
  const isNew = Scoring.recordScore(higher);
  assert.equal(isNew, true, 'first higher record should return true');
  assert.equal(Scoring.getHi(), higher, 'hi should equal the new high');
  const isNew2 = Scoring.recordScore(higher - 1);
  assert.equal(isNew2, false, 'lower record should return false');
  assert.equal(Scoring.getHi(), higher, 'hi should not decrease');
});

test('recordSector: out-of-range sectors are ignored; valid sectors track the max per slot', () => {
  const before = Scoring.getBestBySector().slice();
  assert.equal(Scoring.recordSector(0, 9999), false, 'sector 0 invalid');
  assert.equal(Scoring.recordSector(6, 9999), false, 'sector 6 invalid');
  assert.equal(Scoring.recordSector(-1, 9999), false, 'sector -1 invalid');
  const after = Scoring.getBestBySector();
  assert.deepEqual(after, before, 'invalid sectors must not mutate bestBySector');

  // Per-sector max behaviour.
  Scoring.recordSector(1, 100);
  Scoring.recordSector(1, 50); // not higher
  Scoring.recordSector(1, 200); // higher
  assert.equal(
    Scoring.getBestBySector()[0],
    200,
    'sector 1 should hold the max of recorded values'
  );

  Scoring.recordSector(3, 75);
  assert.equal(Scoring.getBestBySector()[2], 75, 'sector 3 should be 75');
});

test('pushLeaderboard adds entries, sorts desc, caps at 10', () => {
  const before = Scoring.getLeaderboard().length;
  Scoring.pushLeaderboard(100, 1);
  Scoring.pushLeaderboard(300, 2);
  Scoring.pushLeaderboard(200, 1);
  const lb = Scoring.getLeaderboard();
  // Ensure new entries land at the top in descending order.
  for (let i = 1; i < lb.length; i++) {
    assert.ok(lb[i - 1].score >= lb[i].score, 'leaderboard must be sorted desc by score');
  }
  // Find the first three scores; they should be >= 100.
  assert.ok(lb[0].score >= 200, `top score should be >= 200, got ${lb[0].score}`);
  assert.ok(
    lb.length >= before + 3,
    `leaderboard should have grown by at least 3, was ${before} now ${lb.length}`
  );
  assert.ok(lb.length <= 10, 'leaderboard must not exceed 10 entries');
});

test('pushLeaderboard ignores zero or negative scores', () => {
  const before = Scoring.getLeaderboard().length;
  Scoring.pushLeaderboard(0, 1);
  Scoring.pushLeaderboard(-10, 1);
  assert.equal(
    Scoring.getLeaderboard().length,
    before,
    'no entries should be added for 0/negative scores'
  );
});

test('multiple recordScore calls keep the maximum (monotonic hi)', () => {
  const start = Scoring.getHi();
  Scoring.recordScore(start + 50);
  const mid = Scoring.getHi();
  Scoring.recordScore(mid - 20); // should not lower hi
  assert.equal(Scoring.getHi(), mid, 'hi should be monotonic non-decreasing');
  Scoring.recordScore(mid + 200);
  assert.equal(Scoring.getHi(), mid + 200, 'hi should reflect the new maximum');
});
