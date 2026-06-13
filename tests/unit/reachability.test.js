import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeReachable } from '../../src/world/Reachability.js';

function makeMap(cells) {
  return {
    isSolid(x, z) { return cells[z]?.[x] === 1; },
    heightAt(x, z) { return cells[z]?.[x] === 1 ? 0 : -99; }
  };
}

describe('computeReachable', () => {
  it('returns only solid cells reachable via flat terrain', () => {
    const map = makeMap([
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ]);
    const reachable = computeReachable(map, 0, 0);
    assert.equal(reachable.size, 9);
  });

  it('excludes cells beyond STEP_CLIMB', () => {
    const map = {
      isSolid(x, z) { return true; },
      heightAt(x, z) { return z === 1 ? 20 : 0; }
    };
    const reachable = computeReachable(map, 0, 0);
    assert.ok(reachable.has('0,0'));
    assert.ok(reachable.has('1,0'));
    assert.ok(reachable.has('2,0'));
    assert.ok(!reachable.has('0,1'));
  });

  it('excludes non-solid cells', () => {
    const map = makeMap([
      [1, 0, 1],
      [0, 1, 0],
      [1, 0, 1]
    ]);
    const reachable = computeReachable(map, 1, 1);
    assert.equal(reachable.size, 1);
    assert.ok(reachable.has('1,1'));
  });

  it('handles disconnected islands', () => {
    const map = makeMap([
      [1, 1, 0, 0, 1],
      [0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1]
    ]);
    const reachable = computeReachable(map, 0, 0);
    assert.equal(reachable.size, 2);
    assert.ok(reachable.has('0,0'));
    assert.ok(reachable.has('1,0'));
    assert.ok(!reachable.has('2,2'));
  });

  it('returns only the start cell if no neighbors are solid', () => {
    const map = makeMap([
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0]
    ]);
    const reachable = computeReachable(map, 1, 1);
    assert.equal(reachable.size, 1);
    assert.ok(reachable.has('1,1'));
  });
});
