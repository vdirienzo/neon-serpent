// tests/unit/extra/input-mapper.test.js
// Tests for src/input/InputMapper.js (mapDirCamera).
//
// mapDirCamera(namedDir, cameraPos, cameraTarget) maps a named direction
// ('up'/'down'/'left'/'right' as the player pressed it relative to the
// camera/screen) into a world direction name from DIRS, using the camera's
// forward vector (cameraTarget - cameraPos).
//
// The function is pure: it only reads .x and .z on the position objects, so
// we can pass plain {x, y, z} literals (no THREE.Vector3 required).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapDirCamera } from '../../../src/input/InputMapper.js';

// Cameras are placed on the world axis and look straight at the origin so
// the forward vector is along a single axis. The DIRS convention is:
//   'up'    = -Z (world north)
//   'down'  = +Z (world south)
//   'left'  = -X (world west)
//   'right' = +X (world east)
function cam(pos, target) {
  return { pos, target };
}

test('camera looking north: keys map 1:1 to world directions', () => {
  // Camera at +Z looking toward -Z. Forward = (0, -1).
  // 'up' on screen -> world -Z -> 'up'
  // 'down' on screen -> world +Z -> 'down'
  // 'right' on screen (relative to forward) -> world +X -> 'right'
  // 'left' on screen -> world -X -> 'left'
  const c = cam({ x: 0, y: 0, z: 10 }, { x: 0, y: 0, z: 0 });
  assert.equal(mapDirCamera('up', c.pos, c.target), 'up');
  assert.equal(mapDirCamera('down', c.pos, c.target), 'down');
  assert.equal(mapDirCamera('left', c.pos, c.target), 'left');
  assert.equal(mapDirCamera('right', c.pos, c.target), 'right');
});

test('camera looking south: keys are inverted on the forward axis', () => {
  // Camera at -Z looking toward +Z. Forward = (0, +1).
  // 'up' on screen -> world +Z -> 'down'
  // 'down' on screen -> world -Z -> 'up'
  // 'right' on screen (rotate 90° CW from forward) -> world -X -> 'left'
  // 'left' on screen -> world +X -> 'right'
  const c = cam({ x: 0, y: 0, z: -10 }, { x: 0, y: 0, z: 0 });
  assert.equal(mapDirCamera('up', c.pos, c.target), 'down');
  assert.equal(mapDirCamera('down', c.pos, c.target), 'up');
  assert.equal(mapDirCamera('left', c.pos, c.target), 'right');
  assert.equal(mapDirCamera('right', c.pos, c.target), 'left');
});

test('camera looking east: forward is +X', () => {
  // Camera at -X looking toward +X. Forward = (1, 0).
  // 'up' on screen -> world +X -> 'right'
  // 'down' on screen -> world -X -> 'left'
  // 'right' on screen (90° CW) -> world +Z -> 'down'
  // 'left' on screen -> world -Z -> 'up'
  const c = cam({ x: -10, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
  assert.equal(mapDirCamera('up', c.pos, c.target), 'right');
  assert.equal(mapDirCamera('down', c.pos, c.target), 'left');
  assert.equal(mapDirCamera('left', c.pos, c.target), 'up');
  assert.equal(mapDirCamera('right', c.pos, c.target), 'down');
});

test('camera looking west: forward is -X', () => {
  // Camera at +X looking toward -X. Forward = (-1, 0).
  // 'up' on screen -> world -X -> 'left'
  // 'down' on screen -> world +X -> 'right'
  // 'right' on screen (90° CW) -> world -Z -> 'up'
  // 'left' on screen -> world +Z -> 'down'
  const c = cam({ x: 10, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
  assert.equal(mapDirCamera('up', c.pos, c.target), 'left');
  assert.equal(mapDirCamera('down', c.pos, c.target), 'right');
  assert.equal(mapDirCamera('left', c.pos, c.target), 'down');
  assert.equal(mapDirCamera('right', c.pos, c.target), 'up');
});

test('camera looking northeast: "up" still tracks the dominant world axis', () => {
  // Forward = (1, -1) (normalized: 0.707, -0.707).
  // fName: bestDirName(0.707, -0.707)
  //   du = 0.707, dd = -0.707, dl = -0.707, dr = 0.707
  //   start 'up' (du=0.707), dd<best, dl<best, dr NOT > best (equal) -> 'up'
  // rName: bestDirName(0.707, 0.707) -> 'down' (dd=0.707 wins over du=-0.707)
  const c = cam({ x: 0, y: 0, z: 10 }, { x: 10, y: 0, z: 0 });
  assert.equal(mapDirCamera('up', c.pos, c.target), 'up');
  assert.equal(mapDirCamera('down', c.pos, c.target), 'down');
  assert.equal(mapDirCamera('right', c.pos, c.target), 'down');
  assert.equal(mapDirCamera('left', c.pos, c.target), 'up');
});

test('camera looking southwest: "up" still tracks the dominant world axis', () => {
  // Forward = (-1, 1) (normalized: -0.707, 0.707).
  // fName: bestDirName(-0.707, 0.707)
  //   du = -0.707, dd = 0.707, dl = 0.707, dr = -0.707
  //   start 'up' (du=-0.707), dd 'down' (0.707), dl NOT > best, dr < best
  //   BUT the code uses 'if (dl > bestVal)' with strict >, so it does not flip.
  //   final: 'down'
  // rName: bestDirName(-0.707, -0.707) -> 'up' (du=0.707 wins)
  const c = cam({ x: 0, y: 0, z: -10 }, { x: -10, y: 0, z: 0 });
  assert.equal(mapDirCamera('up', c.pos, c.target), 'down');
  assert.equal(mapDirCamera('down', c.pos, c.target), 'up');
  assert.equal(mapDirCamera('right', c.pos, c.target), 'up');
  assert.equal(mapDirCamera('left', c.pos, c.target), 'down');
});

test('camera at target (zero forward) falls back to -Z forward', () => {
  // When fLenSq < 0.0001, the code defaults fxn=0, fzn=-1.
  // fName = 'up', rName = 'right'.
  const c = cam({ x: 5, y: 0, z: 5 }, { x: 5, y: 0, z: 5 });
  assert.equal(mapDirCamera('up', c.pos, c.target), 'up');
  assert.equal(mapDirCamera('down', c.pos, c.target), 'down');
  assert.equal(mapDirCamera('right', c.pos, c.target), 'right');
  assert.equal(mapDirCamera('left', c.pos, c.target), 'left');
});

test('non-axis-aligned camera (forward magnitude not unit) is normalized before use', () => {
  // Forward = (5, 0): same as 'camera looking east' but larger magnitude.
  // Should give identical results to the simple +X test.
  const c = cam({ x: -50, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
  assert.equal(mapDirCamera('up', c.pos, c.target), 'right');
  assert.equal(mapDirCamera('down', c.pos, c.target), 'left');
  assert.equal(mapDirCamera('left', c.pos, c.target), 'up');
  assert.equal(mapDirCamera('right', c.pos, c.target), 'down');
});

test('Y component of position/target is ignored (only X/Z matter)', () => {
  // Two cameras that are otherwise identical but at different heights must
  // produce the same result.
  const low = cam({ x: 0, y: -10, z: 10 }, { x: 0, y: 5, z: 0 });
  const high = cam({ x: 0, y: 100, z: 10 }, { x: 0, y: -50, z: 0 });
  assert.equal(mapDirCamera('up', low.pos, low.target), mapDirCamera('up', high.pos, high.target));
  assert.equal(mapDirCamera('down', low.pos, low.target), mapDirCamera('down', high.pos, high.target));
  assert.equal(mapDirCamera('left', low.pos, low.target), mapDirCamera('left', high.pos, high.target));
  assert.equal(mapDirCamera('right', low.pos, low.target), mapDirCamera('right', high.pos, high.target));
});

test('result is always one of the four valid direction names', () => {
  // Sweep many camera positions and verify the return is always valid.
  const VALID = new Set(['up', 'down', 'left', 'right']);
  const cameras = [
    { pos: { x: 0,  y: 0, z: 10 },  target: { x: 0,  y: 0, z: 0 } },
    { pos: { x: 0,  y: 0, z: -10 }, target: { x: 0,  y: 0, z: 0 } },
    { pos: { x: 10, y: 0, z: 0 },   target: { x: -10, y: 0, z: 0 } },
    { pos: { x: -10, y: 0, z: 0 },  target: { x: 10, y: 0, z: 0 } },
    { pos: { x: 0,  y: 0, z: 10 },  target: { x: 10, y: 0, z: -10 } },
    { pos: { x: 7,  y: 0, z: 7 },   target: { x: 0,  y: 0, z: 0 } }
  ];
  for (const c of cameras) {
    for (const dir of ['up', 'down', 'left', 'right']) {
      const r = mapDirCamera(dir, c.pos, c.target);
      assert.ok(VALID.has(r), `expected one of up/down/left/right, got "${r}" for ${dir}`);
    }
  }
});

test('"up" and "down" always map to opposite world directions', () => {
  // By construction OPP[fName] is the opposite of fName.
  const cameras = [
    { pos: { x: 0,  y: 0, z: 10 },  target: { x: 0,  y: 0, z: 0 } },
    { pos: { x: 0,  y: 0, z: -10 }, target: { x: 0,  y: 0, z: 0 } },
    { pos: { x: 10, y: 0, z: 0 },   target: { x: -10, y: 0, z: 0 } },
    { pos: { x: 0,  y: 0, z: 10 },  target: { x: 10, y: 0, z: -10 } }
  ];
  for (const c of cameras) {
    const up = mapDirCamera('up', c.pos, c.target);
    const down = mapDirCamera('down', c.pos, c.target);
    assert.notEqual(up, down, `up and down should differ for cam (${c.pos.x},${c.pos.z})`);
    // And they must be OPPs of each other
    const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
    assert.equal(OPP[up], down, `up="${up}" should be opposite of down="${down}"`);
  }
});

test('"left" and "right" always map to opposite world directions', () => {
  const cameras = [
    { pos: { x: 0,  y: 0, z: 10 },  target: { x: 0,  y: 0, z: 0 } },
    { pos: { x: 0,  y: 0, z: -10 }, target: { x: 0,  y: 0, z: 0 } },
    { pos: { x: 10, y: 0, z: 0 },   target: { x: -10, y: 0, z: 0 } },
    { pos: { x: 0,  y: 0, z: 10 },  target: { x: 10, y: 0, z: -10 } }
  ];
  for (const c of cameras) {
    const left = mapDirCamera('left', c.pos, c.target);
    const right = mapDirCamera('right', c.pos, c.target);
    assert.notEqual(left, right, `left and right should differ for cam (${c.pos.x},${c.pos.z})`);
    const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
    assert.equal(OPP[left], right, `left="${left}" should be opposite of right="${right}"`);
  }
});
