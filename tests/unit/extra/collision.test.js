// tests/unit/extra/collision.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCollisions } from '../../../src/game/Collision.js';
import { DEATH } from '../../../src/config.js';

function makeMap(solidSet) {
  return { isSolid: (x, y) => solidSet.has(`${x},${y}`) };
}

test('in-bounds solid cell: no collision, no cause', () => {
  const map = makeMap(new Set(['0,0', '1,0', '0,1', '1,1']));
  const result = checkCollisions({ gx: 0, gz: 0 }, map);
  assert.equal(result.collided, false);
  assert.equal(result.cause, undefined);
});

test('in-bounds void cell: collision with cause VOID', () => {
  const map = makeMap(new Set());
  const result = checkCollisions({ gx: 5, gz: 5 }, map);
  assert.equal(result.collided, true);
  assert.equal(result.cause, DEATH.VOID);
});

test('out-of-bounds positive coordinates are treated as void (no WALL)', () => {
  const map = makeMap(new Set());
  const result = checkCollisions({ gx: 100, gz: 100 }, map);
  assert.equal(result.collided, true);
  assert.equal(result.cause, DEATH.VOID);
});

test('negative out-of-bounds coordinates are treated as void', () => {
  const map = makeMap(new Set());
  const result = checkCollisions({ gx: -1, gz: -1 }, map);
  assert.equal(result.collided, true);
  assert.equal(result.cause, DEATH.VOID);
});

test('isSolid is called with the exact gx and gz of the head', () => {
  let receivedX = null;
  let receivedY = null;
  const map = {
    isSolid(x, y) {
      receivedX = x;
      receivedY = y;
      return true;
    },
  };
  const result = checkCollisions({ gx: 7, gz: 11 }, map);
  assert.equal(receivedX, 7);
  assert.equal(receivedY, 11);
  assert.equal(result.collided, false);
});

test('result shape: solid returns { collided: false }, void returns { collided: true, cause: DEATH.VOID }', () => {
  const map = makeMap(new Set(['2,2']));
  const solid = checkCollisions({ gx: 2, gz: 2 }, map);
  const empty = checkCollisions({ gx: 3, gz: 3 }, map);

  assert.deepEqual(solid, { collided: false });
  assert.deepEqual(empty, { collided: true, cause: DEATH.VOID });
});

test('isSolid returning truthy/falsy controls outcome (not strict true)', () => {
  const truthyMap = { isSolid: () => 1 };
  const falsyMap = { isSolid: () => 0 };
  assert.equal(checkCollisions({ gx: 0, gz: 0 }, truthyMap).collided, false);
  assert.equal(checkCollisions({ gx: 0, gz: 0 }, falsyMap).collided, true);
});
