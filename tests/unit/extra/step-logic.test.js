// tests/unit/extra/step-logic.test.js
// Tests for the per-tick step logic.
// Audio (SFX.js) and Haptics.js are imported by StepLogic. SFX early-returns
// because getCtx() is null in a node test environment; Haptics needs a
// minimal `window`/`navigator` so that isTouchDevice() returns false.
//
// We also need to stub the `three` package (transitively required by
// Color.js) — a custom Node.js loader handles that. The loader is
// registered BEFORE any import of src/game/StepLogic.js.

import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

// Set up minimal DOM globals so isTouchDevice() and vibrate() do not throw.
// In Node 24+ navigator is a getter-only built-in; we use defineProperty
// to override it with a writable, configurable plain object.
Object.defineProperty(globalThis, 'navigator', {
  value: { maxTouchPoints: 0 },
  writable: true,
  configurable: true,
});
if (typeof globalThis.window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    value: { matchMedia: () => ({ matches: false }) },
    writable: true,
    configurable: true,
  });
}

// Register a custom loader that stubs the `three` package (not installed
// in this no-npm project). See _modes-loader.mjs for details.
await register(new URL('./_modes-loader.mjs', import.meta.url).href, import.meta.url);

// Dynamic imports so the loader is active by the time src/game/* is parsed.
const { StepLogic } = await import('../../../src/game/StepLogic.js');
const { HeightMap } = await import('../../../src/world/HeightMap.js');

function newCtx(overrides = {}) {
  const map = new HeightMap();
  const snake = {
    cells: [{ gx: 5, gz: 5 }],
    stepCalls: 0,
    applyMoveCalls: [],
    step(_now) {
      this.stepCalls++;
      return { status: 'ok', grew: false, newHead: { gx: 6, gz: 5 } };
    },
    applyMove(newHead, willGrow, growExtra) {
      this.applyMoveCalls.push({ newHead, willGrow, growExtra });
      this.cells.unshift(newHead);
      if (!willGrow && growExtra === 0) this.cells.pop();
    },
  };
  return {
    snake,
    food: { isAt: () => false, spawn: () => {}, gx: -1, gz: -1, mesh: null },
    bonus: null,
    pickups: { checkCollect: () => null },
    checkpoints: { checkPass: () => null },
    map,
    level: 1,
    score: 0,
    foodEaten: 0,
    stepInterval: 100,
    speedBoostUntil: 0,
    slowMoUntil: 0,
    spawnBonus: () => {},
    pickFreeCell: () => ({ gx: 10, gz: 10 }),
    ...overrides,
  };
}

before(() => {
  Object.defineProperty(globalThis, 'navigator', {
    value: { maxTouchPoints: 0 },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'window', {
    value: { matchMedia: () => ({ matches: false }) },
    writable: true,
    configurable: true,
  });
});

beforeEach(() => {
  Object.defineProperty(globalThis, 'navigator', {
    value: { maxTouchPoints: 0 },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'window', {
    value: { matchMedia: () => ({ matches: false }) },
    writable: true,
    configurable: true,
  });
});

test('snake moves one cell: step() returns no-ate result and calls applyMove', () => {
  const ctx = newCtx();
  const sl = new StepLogic(ctx);
  const r = sl.step();

  assert.equal(ctx.snake.stepCalls, 1);
  assert.equal(ctx.snake.applyMoveCalls.length, 1);
  assert.deepEqual(ctx.snake.applyMoveCalls[0].newHead, { gx: 6, gz: 5 });
  assert.equal(ctx.snake.applyMoveCalls[0].willGrow, false);
  assert.equal(ctx.snake.applyMoveCalls[0].growExtra, 0);
  assert.equal(r.ate, null);
  assert.equal(r.pickup, null);
  assert.equal(r.checkpoint, null);
  assert.equal(r.died, undefined);
  assert.equal(r.won, undefined);
});

test('ate food: score increases by 10 * level, foodEaten++, food.spawn called', () => {
  const spawnCalls = [];
  const ctx = newCtx({
    level: 2,
    score: 50,
    food: {
      isAt: (x, z) => x === 6 && z === 5,
      spawn: (cell) => spawnCalls.push(cell),
      gx: 6,
      gz: 5,
      mesh: {},
    },
  });
  const sl = new StepLogic(ctx);

  const r = sl.step();

  assert.equal(r.ate, 'food');
  assert.equal(ctx.score, 50 + 10 * 2, 'score should be 70');
  assert.equal(ctx.foodEaten, 1);
  assert.equal(spawnCalls.length, 1, 'food.spawn should be called exactly once');
});

test('eating food every BONUS_EVERY (4) calls spawnBonus', () => {
  const spawnBonusCalls = [];
  const ctx = newCtx({
    level: 1,
    score: 0,
    foodEaten: 3, // next bite makes it 4 -> BONUS_EVERY
    spawnBonus: () => spawnBonusCalls.push(1),
  });
  ctx.food = {
    isAt: (x, z) => x === 6 && z === 5,
    spawn: () => {},
    gx: 6,
    gz: 5,
    mesh: {},
  };
  const sl = new StepLogic(ctx);
  sl.step();

  assert.equal(ctx.foodEaten, 4);
  assert.equal(spawnBonusCalls.length, 1, 'spawnBonus should fire on every 4th food');
});

test('ate bonus: score increases by 50 * level, bonus disposed, c.bonus = null', () => {
  let disposed = false;
  const ctx = newCtx({
    level: 3,
    score: 100,
    food: { isAt: () => false, spawn: () => {}, gx: -1, gz: -1, mesh: null },
    bonus: {
      isAt: (x, z) => x === 6 && z === 5,
      dispose: () => {
        disposed = true;
      },
      gx: 6,
      gz: 5,
      mesh: {},
    },
  });
  const sl = new StepLogic(ctx);
  const r = sl.step();

  assert.equal(r.ate, 'bonus');
  assert.equal(ctx.score, 100 + 50 * 3, 'score should be 250');
  assert.equal(disposed, true, 'bonus.dispose should be called');
  assert.equal(ctx.bonus, null, 'ctx.bonus should be nulled out');
});

test('died: returns { died: true, cause } and emits EVT.DYING', async () => {
  const EventBus = await import('../../../src/core/EventBus.js');
  const { EVT } = await import('../../../src/config.js');

  const dyingPayloads = [];
  EventBus.clear();
  EventBus.on(EVT.DYING, (p) => dyingPayloads.push(p));

  const ctx = newCtx();
  ctx.snake.step = () => ({ status: 'died', cause: 'void' });
  const sl = new StepLogic(ctx);
  const r = sl.step();

  assert.equal(r.died, true);
  assert.equal(r.cause, 'void');
  assert.equal(dyingPayloads.length, 1);
  assert.equal(dyingPayloads[0].cause, 'void');
  assert.equal(ctx.snake.applyMoveCalls.length, 0, 'applyMove not called when snake dies');

  EventBus.clear();
});

test('reached goal: returns { won: true } and emits EVT.GOAL_REACHED', async () => {
  const EventBus = await import('../../../src/core/EventBus.js');
  const { EVT } = await import('../../../src/config.js');

  const goalPayloads = [];
  EventBus.clear();
  EventBus.on(EVT.GOAL_REACHED, (p) => goalPayloads.push(p));

  const ctx = newCtx();
  ctx.map.setGoal(6, 5);
  const sl = new StepLogic(ctx);
  const r = sl.step();

  assert.equal(r.won, true);
  assert.equal(goalPayloads.length, 1);
  assert.equal(ctx.snake.applyMoveCalls.length, 1);

  EventBus.clear();
});

test('pickup collection increases score and sets willGrow', async () => {
  const EventBus = await import('../../../src/core/EventBus.js');
  const { EVT } = await import('../../../src/config.js');

  const scorePayloads = [];
  EventBus.clear();
  EventBus.on(EVT.SCORE, (p) => scorePayloads.push(p));

  const ctx = newCtx();
  ctx.pickups = {
    checkCollect(x, z, cb) {
      if (x === 6 && z === 5) {
        cb({ type: 'orb' });
        return { type: 'orb' };
      }
      return null;
    },
  };
  const sl = new StepLogic(ctx);
  const r = sl.step();

  assert.equal(ctx.score, 10, 'orb = 10 points');
  assert.deepEqual(scorePayloads, [10]);
  assert.equal(ctx.snake.applyMoveCalls[0].willGrow, true);
  assert.equal(ctx.snake.applyMoveCalls[0].growExtra, 1);
  assert.equal(r.pickup && r.pickup.type, 'orb');

  EventBus.clear();
});
