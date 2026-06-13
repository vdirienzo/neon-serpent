// tests/unit/extra/camera-math.test.js
// Tests for src/camera/CameraMath.js (cinematicPose, topDownPose, chasePose).
//
// CameraMath.js does `import * as THREE from 'three'`, and the real three
// package is not installed in this repo. We register a tiny module loader
// (see _three-loader.mjs) that rewrites any `from 'three'` to a minimal
// in-memory Vector3 implementation (_three-mock.mjs). After that, the
// real source module loads and runs unmodified.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register('./_three-loader.mjs', import.meta.url);

const { cinematicPose, topDownPose, chasePose } = await import('../../../src/camera/CameraMath.js');

// Import the mock Vector3 directly so we can construct real input objects
// for chasePose (which calls headWorld.clone() etc).
const { Vector3 } = await import('./_three-mock.mjs');

function makeV3(x, y, z) {
  return new Vector3(x, y, z);
}

test('cinematicPose returns { pos, target } with target.y === yFocus', () => {
  const r = cinematicPose(0, 32, -1.5);
  assert.ok(r && typeof r === 'object', 'expected an object');
  assert.ok('pos' in r, 'expected pos key');
  assert.ok('target' in r, 'expected target key');
  assert.equal(r.target.x, 0);
  assert.equal(r.target.y, -1.5);
  assert.equal(r.target.z, 0);
});

test('cinematicPose at t=0 puts camera on +Z orbit at height = gridSize * 0.9', () => {
  // camR = 32 * 1.05 = 33.6, camH = 32 * 0.9 = 28.8
  // ang = 0, so pos = (sin(0)*camR, camH + sin(0)*0.6, cos(0)*camR)
  //       = (0, 28.8, 33.6)
  const r = cinematicPose(0, 32, -1.5);
  assert.equal(r.pos.x, 0);
  assert.equal(r.pos.y, 28.8);
  assert.equal(r.pos.z, 33.6);
});

test('cinematicPose at t=PI/0.08 puts camera on -Z orbit (half period)', () => {
  // ang = (PI / 0.08) * 0.08 = PI, so sin(PI)~0, cos(PI)=-1
  // pos.x = sin(PI)*camR ~ 0, pos.z = cos(PI)*camR = -33.6
  // pos.y = camH + sin(t * 0.5) * 0.6 = 28.8 + sin(PI/0.16) * 0.6 (non-trivial)
  const t = Math.PI / 0.08;
  const r = cinematicPose(t, 32, -1.5);
  assert.ok(Math.abs(r.pos.x) < 1e-9, `pos.x should be ~0, got ${r.pos.x}`);
  assert.equal(r.pos.z, -33.6);
  // y wobble: just sanity-check it's within +/- camH and not NaN
  assert.ok(Number.isFinite(r.pos.y), `pos.y should be finite, got ${r.pos.y}`);
  assert.ok(
    Math.abs(r.pos.y - 28.8) <= 0.6 + 1e-9,
    `pos.y should be within wobble, got ${r.pos.y}`
  );
});

test('cinematicPose scales with gridSize and respects yFocus', () => {
  // gridSize=20 -> camH=18, camR=21; ang=0 -> pos.x=0, pos.z=21
  const r = cinematicPose(0, 20, -2.4);
  assert.equal(r.pos.x, 0);
  assert.equal(r.pos.y, 18);
  assert.equal(r.pos.z, 21);
  assert.equal(r.target.y, -2.4);
});

test('topDownPose returns camera directly overhead at gridSize*1.1', () => {
  // pos = (0.01, 32*1.1, 0.01) = (0.01, 35.2, 0.01)
  // target = (0, yFocus, 0)
  const r = topDownPose(32, -1.5);
  assert.equal(r.pos.x, 0.01);
  assert.equal(r.pos.y, 35.2);
  assert.equal(r.pos.z, 0.01);
  assert.equal(r.target.x, 0);
  assert.equal(r.target.y, -1.5);
  assert.equal(r.target.z, 0);
});

test('topDownPose scales height with gridSize and respects yFocus', () => {
  const r = topDownPose(16, -3.0);
  assert.equal(r.pos.y, 17.6);
  assert.equal(r.target.y, -3.0);
});

test('chasePose puts camera behind head and target ahead of head', () => {
  // head=(0,0,0), dir=(1,0,0): back=(-1,0,0), pos = (0,0,0) + (-6,0,0) = (-6, 0, 0)
  // pos.y = head.y + 3.5 = 3.5
  // fwd=(1,0,0), target = (0,0,0) + (3,0,0) = (3, 0, 0)
  // target.y = yFocus = -1.5
  const head = makeV3(0, 0, 0);
  const dir = makeV3(1, 0, 0);
  const r = chasePose(head, dir, -1.5);
  assert.equal(r.pos.x, -6);
  assert.equal(r.pos.y, 3.5);
  assert.equal(r.pos.z, 0);
  assert.equal(r.target.x, 3);
  assert.equal(r.target.y, -1.5);
  assert.equal(r.target.z, 0);
});

test('chasePose uses yFocus on target even if head.y differs', () => {
  // Head at y=10 (e.g. on a tall column). target.y should still snap to yFocus.
  const head = makeV3(5, 10, 5);
  const dir = makeV3(0, 0, 1);
  const r = chasePose(head, dir, -4.0);
  // back = (0, 0, -1), pos = (5, 10, 5) + (0, 0, -6) = (5, 10, -1)
  // pos.y = head.y + 3.5 = 13.5
  // fwd = (0, 0, 1), target = (5, 10, 5) + (0, 0, 3) = (5, 10, 8)
  // target.y = yFocus = -4.0
  assert.equal(r.pos.x, 5);
  assert.equal(r.pos.y, 13.5);
  assert.equal(r.pos.z, -1);
  assert.equal(r.target.x, 5);
  assert.equal(r.target.y, -4.0);
  assert.equal(r.target.z, 8);
});

test('chasePose with zero direction defaults back to +Z to avoid div-by-zero', () => {
  // head=(0,0,0), dir=(0,0,0): back starts as (0,0,0), lengthSq=0 < 0.01
  // -> back.set(0, 0, 1), then normalize (no-op since unit length)
  // pos = (0,0,0) + (0, 0, 6) = (0, 0, 6), pos.y = 0 + 3.5 = 3.5
  // fwd = (0, 0, 0), target = (0, 0, 0), target.y = yFocus
  const head = makeV3(0, 0, 0);
  const dir = makeV3(0, 0, 0);
  const r = chasePose(head, dir, -2.0);
  assert.equal(r.pos.x, 0);
  assert.equal(r.pos.y, 3.5);
  assert.equal(r.pos.z, 6);
  assert.equal(r.target.x, 0);
  assert.equal(r.target.y, -2.0);
  assert.equal(r.target.z, 0);
});

test('chasePose with near-zero direction still defaults to +Z (lengthSq < 0.01)', () => {
  // lengthSq = 0.005 * 0.005 = 0.000025 < 0.01, so we go to the fallback.
  const head = makeV3(0, 0, 0);
  const dir = makeV3(0.005, 0, 0);
  const r = chasePose(head, dir, -1.0);
  assert.equal(r.pos.x, 0);
  assert.equal(r.pos.z, 6);
});
