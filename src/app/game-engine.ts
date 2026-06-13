/**
 * @fileoverview GameEngine — core game loop, step accumulator, and state
 * transitions. Extracted from main.js to reduce coupling and improve
 * testability.
 */

import type { GameState, DeathCause } from '../types/index.js';
import { EVT, STATE } from '../config.js';
import { emit } from '../core/EventBus.js';
import { StepLogic } from '../game/StepLogic.js';
import { startDying, resetDying } from '../game/DeathHandler.js';

/** Reactive game state container. */
export interface GameStateRefs {
  stepInterval: number;
  stepAcc: number;
  foodEaten: number;
  score: number;
  scoreDisplay: number;
  level: number;
  speedBoostUntil: number;
  slowMoUntil: number;
  invulnerableUntil: number;
  bonusLeft: number;
  bonusActive: boolean;
  lives: number;
  isInfinite: boolean;
  currentSector: number;
  slowMode: boolean;
  showcaseT: number;
  lastInputDir: string | null;
  reachableCells: Set<string> | null;
}

/** Dependencies required by the engine. */
export interface EngineDeps {
  refs: GameStateRefs;
  getState: () => GameState;
  setState: (s: GameState) => void;
  applySpeedMods: () => number;
  onDeath: (cause: DeathCause) => void;
  onLevelWin: () => void;
  onRespawn: () => void;
}

/** Engine handle returned to callers. */
export interface GameEngine {
  step: (dt: number) => void;
  resetAcc: () => void;
  respawn: () => void;
  loseLife: () => number;
  setStepLogic: (sl: StepLogic) => void;
}

/**
 * Create a bound game engine.
 * @param deps - Engine dependencies
 * @returns {GameEngine} The engine handle
 */
export function createGameEngine(deps: EngineDeps): GameEngine {
  const { refs, getState, applySpeedMods, onDeath, onLevelWin, onRespawn } = deps;
  let stepLogic: StepLogic | null = null;

  function setStepLogic(sl: StepLogic): void {
    stepLogic = sl;
  }

  function loseLife(): number {
    refs.lives = Math.max(0, refs.lives - 1);
    emit(EVT.LIFE_LOST as string, { lives: refs.lives });
    return refs.lives;
  }

  function respawn(): void {
    resetDying();
    onRespawn();
  }

  function step(dt: number): void {
    if (getState() !== STATE.PLAYING || !stepLogic) return;
    refs.stepInterval = applySpeedMods();
    refs.stepAcc += dt * 1000;

    while (refs.stepAcc >= refs.stepInterval) {
      refs.stepAcc -= refs.stepInterval;
      const result = stepLogic.step();

      if (result && result.died && result.cause) {
        loseLife();
        const cause = result.cause as DeathCause;
        startDying(
          cause,
          (window as unknown as { snake: unknown }).snake as Parameters<typeof startDying>[1]
        );
        onDeath(cause);
        break;
      }
      if (result && result.won) {
        onLevelWin();
        break;
      }
    }
  }

  return {
    step,
    resetAcc: () => {
      refs.stepAcc = 0;
    },
    respawn,
    loseLife,
    setStepLogic,
  };
}
