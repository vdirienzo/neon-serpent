// tests/integration/snake-flow.test.js
// Integration: Snake.step() + Snake.applyMove() + HeightMap
// Verifies the eating-food consequences (grow, score, stepInterval, foodEaten)
// by manually orchestrating what StepLogic would do after a successful step.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HeightMap } from '../../src/world/HeightMap.js';
import { Snake } from '../../src/entities/Snake.js';
import { STEP_INIT, STEP_MIN, STEP_DEC } from '../../src/config.js';

function makeContext({ map, snake, food }) {
  return {
    map,
    snake,
    food,
    pickups: null,
    checkpoints: null,
    bonus: null,
    level: 1,
    score: 0,
    foodEaten: 0,
    stepInterval: STEP_INIT,
    speedBoostUntil: 0,
    slowMoUntil: 0,
    pickFreeCell: () => null,
    spawnBonus: () => {}
  };
}

test('snake grows by one cell when applyMove is called with willGrow=true', () => {
  const m = new HeightMap();
  const s = new Snake(m);
  s.reset(15, 15);
  const before = s.length();
  const head = s.head();
  const newHead = { gx: head.gx + 1, gz: head.gz };
  s.applyMove(newHead, true, 0);
  assert.equal(s.length(), before + 1, 'snake should have grown by 1');
  assert.deepEqual(s.head(), newHead, 'new head should be at newHead position');
});

test('snake does not grow when applyMove is called with willGrow=false', () => {
  const m = new HeightMap();
  const s = new Snake(m);
  s.reset(15, 15);
  const before = s.length();
  const head = s.head();
  const newHead = { gx: head.gx + 1, gz: head.gz };
  s.applyMove(newHead, false, 0);
  assert.equal(s.length(), before, 'snake length should not change');
  assert.deepEqual(s.head(), newHead, 'head should be at newHead position');
});

test('full eat-food flow: step returns newHead, context score/interval/foodEaten update, snake grows', () => {
  const m = new HeightMap();
  const s = new Snake(m);
  s.reset(15, 15);
  // Mock food that always reports a match.
  const food = { isAt: (gx, gz) => gx === 16 && gz === 15 };
  const ctx = makeContext({ map: m, snake: s, food });

  // Snake is initially at (15,15) facing right; its head will step to (16,15).
  const result = s.step(0);
  assert.equal(result.status, 'ok', 'step should succeed');
  assert.ok(result.newHead, 'step should return a newHead');
  assert.equal(result.newHead.gx, 16);
  assert.equal(result.newHead.gz, 15);

  // Orchestrate what StepLogic does when food.isAt(newHead) is true.
  if (ctx.food.isAt(result.newHead.gx, result.newHead.gz)) {
    let willGrow = false;
    let growExtra = 0;
    ctx.score += 10 * ctx.level;
    ctx.foodEaten += 1;
    ctx.stepInterval = Math.max(STEP_MIN, ctx.stepInterval - STEP_DEC);
    willGrow = true;
    s.applyMove(result.newHead, willGrow, growExtra);
  }

  // After eating, all the side-effects should have happened.
  assert.equal(ctx.score, 10,         'score should be 10 (10 * level 1)');
  assert.equal(ctx.foodEaten, 1,      'foodEaten should be 1');
  assert.equal(ctx.stepInterval, STEP_INIT - STEP_DEC, 'stepInterval should have decreased by STEP_DEC');
  assert.equal(s.length(), 5,         'snake should have grown from 4 to 5 cells');
  assert.deepEqual(s.head(), result.newHead, 'snake head should match newHead');
});

test('repeated eats keep decreasing stepInterval until STEP_MIN', () => {
  const m = new HeightMap();
  const s = new Snake(m);
  s.reset(15, 15);
  const food = { isAt: () => true }; // always eats
  const ctx = makeContext({ map: m, snake: s, food });

  // Eat until the floor is reached (STEP_INIT=95, STEP_DEC=3, STEP_MIN=48 → 16 decrements to hit floor).
  let steps = 0;
  const MAX = 30;
  while (ctx.stepInterval > STEP_MIN && steps < MAX) {
    // Always place the head somewhere solid and step there.
    const head = s.head();
    // Move the head to the right on each step; the map is all solid.
    const result = s.step(0);
    if (result.status !== 'ok' || !result.newHead) break;
    ctx.score += 10 * ctx.level;
    ctx.foodEaten += 1;
    ctx.stepInterval = Math.max(STEP_MIN, ctx.stepInterval - STEP_DEC);
    s.applyMove(result.newHead, true, 0);
    steps++;
  }

  assert.equal(ctx.foodEaten, steps, 'foodEaten should match number of steps');
  assert.ok(ctx.stepInterval >= STEP_MIN, 'stepInterval should never drop below STEP_MIN');
  assert.equal(ctx.stepInterval, STEP_MIN, 'after many eats, stepInterval should be exactly STEP_MIN');
});

test('snake stepping into a void cell reports status=died cause=void (not real food, but real HeightMap)', () => {
  const m = new HeightMap();
  const s = new Snake(m);
  s.reset(15, 15);
  // Carve a void cell just to the right of the snake's head.
  m.setCell(16, 15, 0, false);
  s.dir = { x: 1, z: 0, name: 'right' };
  const r = s.step(performance.now() + 99999);
  assert.equal(r.status, 'died');
  assert.equal(r.cause, 'void');
});
