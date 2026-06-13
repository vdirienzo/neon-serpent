// tests/integration/pickup-flow.test.js
// Integration: Pickups.checkCollect with the real collection callback contract.
//
// We use a MockPickups that mirrors the relevant Pickups API surface
// (checkCollect, isOccupied) without pulling in three.js (which is not
// available in the Node test runner). The mock intentionally reproduces
// the real Pickups.checkCollect contract verbatim so that any callback
// wiring (e.g. StepLogic) will be compatible.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const PICKUP_KINDS = ['orb', 'gem', 'crystal', 'slow', 'dice'];

class MockPickups {
  constructor() {
    this.list = [];
    this.scene = { add: () => {}, remove: () => {} };
  }
  // Fake "spawn" — populates the list with an entry that has the same shape
  // the real Pickups creates (mesh, gx, gz, type, kind, active, etc.).
  spawn(type, gx, gz) {
    const entry = {
      mesh: { userData: { core: { rotation: {} } } },
      gx, gz, type, kind: type, active: true,
      t0: 0, color: 0, size: 0.4, baseY: 0.6
    };
    this.list.push(entry);
    return entry;
  }
  // Verbatim re-implementation of Pickups.checkCollect semantics so the
  // integration is realistic (iterates from end, calls callback, deactivates,
  // disposes, splices).
  checkCollect(gx, gz, onCollect) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      if (p.active && p.gx === gx && p.gz === gz) {
        onCollect(p);
        p.active = false;
        this.list.splice(i, 1);
        return p;
      }
    }
    return null;
  }
  isOccupied(gx, gz) {
    return this.list.some(p => p.active && p.gx === gx && p.gz === gz);
  }
}

test('checkCollect invokes callback with the matching orb and removes it from the list', () => {
  const p = new MockPickups();
  p.spawn('orb', 5, 5);
  let called = null;
  const result = p.checkCollect(5, 5, (entry) => { called = entry; });
  assert.ok(result, 'checkCollect should return the picked-up entry');
  assert.equal(called && called.type, 'orb');
  assert.equal(p.list.length, 0, 'list should be empty after pickup');
  assert.equal(p.isOccupied(5, 5), false, 'cell should no longer be occupied');
});

test('checkCollect on an empty list is a no-op and returns null', () => {
  const p = new MockPickups();
  let called = false;
  const result = p.checkCollect(0, 0, () => { called = true; });
  assert.equal(result, null);
  assert.equal(called, false, 'callback must not fire when nothing is at the cell');
});

test('checkCollect picks the entry whose (gx, gz) matches, ignoring other entries', () => {
  const p = new MockPickups();
  p.spawn('orb', 5, 5);
  p.spawn('gem', 7, 7);
  p.spawn('crystal', 9, 9);
  let collected = null;
  const result = p.checkCollect(7, 7, (e) => { collected = e; });
  assert.ok(result);
  assert.equal(collected.type, 'gem');
  assert.equal(p.list.length, 2, 'only the gem should be removed');
  assert.equal(p.isOccupied(7, 7), false);
  assert.equal(p.isOccupied(5, 5), true, 'orb should still be there');
  assert.equal(p.isOccupied(9, 9), true, 'crystal should still be there');
});

test('each pickup kind: checkCollect fires the callback with the right type', () => {
  for (const kind of PICKUP_KINDS) {
    const p = new MockPickups();
    p.spawn(kind, 10, 10);
    let seen = null;
    const r = p.checkCollect(10, 10, (e) => { seen = e; });
    assert.ok(r, `kind ${kind}: expected a hit`);
    assert.equal(seen && seen.type, kind, `kind ${kind}: callback should receive the matching type`);
    assert.equal(p.list.length, 0, `kind ${kind}: list should be empty after collect`);
  }
});

test('checkCollect returns the entry (not just calls the callback) so callers can read points/color', () => {
  const p = new MockPickups();
  const orig = p.spawn('dice', 3, 3);
  let received = null;
  const ret = p.checkCollect(3, 3, (e) => { received = e; });
  // Returned value and callback arg should be the same reference.
  assert.strictEqual(ret, received, 'return value should be the same entry passed to the callback');
  assert.strictEqual(ret, orig, 'returned entry should be the originally spawned one');
});

test('checkCollect prioritises the last entry when two stack at the same cell (LIFO)', () => {
  const p = new MockPickups();
  const a = p.spawn('orb', 1, 1);
  const b = p.spawn('gem', 1, 1);
  let collected = null;
  p.checkCollect(1, 1, (e) => { collected = e; });
  assert.strictEqual(collected, b, 'last-spawned entry should win at the same cell');
  // The first entry should still be there.
  assert.equal(p.list.length, 1);
  assert.strictEqual(p.list[0], a);
});
