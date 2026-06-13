/**
 * @fileoverview Per-step game logic: applies the snake step, resolves
 * pickups, food, bonus, checkpoints, and the goal. Updates score, level,
 * step interval, and emits the appropriate bus events.
 */
import {
  DIRS,
  STEP_CLIMB,
  GRID,
  DEATH,
  EVT,
  BONUS_EVERY,
  STEP_MIN,
  STEP_DEC,
  LVL_CAP,
  Y_WATER,
} from '../config.js';
import { emit } from '../core/EventBus.js';
import {
  hapticEat,
  hapticGem,
  hapticCrystal,
  hapticSlow,
  hapticDice,
  hapticCheck,
  hapticBonus,
  hapticLevelUp,
} from '../audio/Haptics.js';
import { sfxEat, sfxBonusEat, sfxDie, sfxBonusAppear } from '../audio/SFX.js';
import { COLORS } from '../core/Color.js';

/**
 * Result of a single `StepLogic.step()` call.
 * @typedef {Object} StepResult
 * @property {boolean} [died] - True if the snake died this step.
 * @property {string} [cause] - Death cause (`'void' | 'self'`).
 * @property {boolean} [won] - True if the snake reached the goal.
 * @property {string} [ate] - `'food' | 'bonus' | null` describing what was eaten.
 * @property {Object} [pickup] - The collected pickup entry, if any.
 * @property {Object} [checkpoint] - The passed checkpoint entry, if any.
 */

/**
 * Apply one snake step, with all scoring, growth, and side effects.
 */
export class StepLogic {
  /**
   * @param {import('./StepLogic.js').StepContext} ctx - Shared game context.
   */
  constructor(ctx) {
    /** @type {import('./StepLogic.js').StepContext} */
    this.ctx = ctx;
  }

  /**
   * Perform one tick of snake movement and resolution. Mutates `c.snake`
   * via `applyMove`, updates `c.score` / `c.level` / `c.stepInterval`,
   * dispatches SFX and haptics, and emits bus events.
   *
   * @returns {StepResult}
   */
  step() {
    const c = this.ctx;
    if (!c.snake) return { ate: false };
    const result = c.snake.step(performance.now());
    if (result.status === 'died') {
      emit(EVT.DYING, { cause: result.cause });
      return { died: true, cause: result.cause };
    }
    if (!result.newHead) return { ate: false };
    const { newHead } = result;
    let willGrow = false;
    let growExtra = 0;
    let ateSomething = null;
    let hitPickup = null;
    let hitCheckpoint = null;
    let hitBonus = false;

    if (c.food && c.food.isAt(newHead.gx, newHead.gz)) {
      willGrow = true;
      ateSomething = 'food';
      const pts = 10 * c.level;
      c.score += pts;
      c.foodEaten++;
      c.stepInterval = Math.max(STEP_MIN, c.stepInterval - STEP_DEC);
      if (c.speedBoostUntil > performance.now())
        c.stepInterval = Math.max(35, Math.floor(c.stepInterval * 0.5));
      else if (c.slowMoUntil > performance.now()) c.stepInterval = Math.floor(c.stepInterval * 1.5);
      const newLvl = Math.min(LVL_CAP, 1 + Math.floor(c.foodEaten / BONUS_EVERY));
      if (newLvl !== c.level) {
        c.level = newLvl;
        emit(EVT.LEVEL_UP, newLvl);
        hapticLevelUp();
      }
      if (c.foodEaten > 0 && c.foodEaten % BONUS_EVERY === 0) c.spawnBonus();
      sfxEat();
      hapticEat();
      c.food.spawn(c.pickFreeCell());
      emit(EVT.SCORE, c.score);
      emit(EVT.FOOD_EATEN);
    }

    if (c.bonus && c.bonus.isAt(newHead.gx, newHead.gz)) {
      willGrow = true;
      hitBonus = true;
      const pts = 50 * c.level;
      c.score += pts;
      hapticBonus();
      sfxBonusEat();
      c.bonus.dispose();
      c.bonus = null;
      growExtra = 1;
      c.snake.applyMove(newHead, willGrow, growExtra);
      emit(EVT.SCORE, c.score);
      return { ate: 'bonus' };
    }

    if (c.pickups) {
      hitPickup = c.pickups.checkCollect(newHead.gx, newHead.gz, (p) => {
        const pts =
          p.type === 'orb'
            ? 10
            : p.type === 'gem'
              ? 50
              : p.type === 'crystal'
                ? 25
                : p.type === 'slow'
                  ? 20
                  : 200;
        c.score += pts;
        emit(EVT.SCORE, c.score);
        if (p.type === 'crystal') {
          c.speedBoostUntil = performance.now() + 6000;
        } else if (p.type === 'slow') {
          c.slowMoUntil = performance.now() + 4000;
        }
        willGrow = true;
        growExtra = Math.max(growExtra, 1);
        if (typeof c.onPickupCollect === 'function') c.onPickupCollect(p);
      });
    }

    if (c.checkpoints) {
      hitCheckpoint = c.checkpoints.checkPass(newHead.gx, newHead.gz, (chk) => {
        c.score += 100;
        emit(EVT.SCORE, c.score);
        hapticCheck();
      });
    }

    if (c.map.isGoal(newHead.gx, newHead.gz)) {
      emit(EVT.GOAL_REACHED);
      c.snake.applyMove(newHead, willGrow, growExtra);
      return { won: true };
    }

    c.snake.applyMove(newHead, willGrow, growExtra);
    return { ate: ateSomething, pickup: hitPickup, checkpoint: hitCheckpoint };
  }
}
