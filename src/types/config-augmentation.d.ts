/**
 * @fileoverview Type augmentation for the project's JSDoc-typed JS modules.
 * This file overrides the loose `Record<string, string>` types with stricter
 * types so that `noUncheckedIndexedAccess` doesn't cause false positives.
 */

declare module '*/config.js' {
  export const GRID: number;
  export const HALF: number;
  export const CELL: number;
  export const WALL_H: number;
  export const Y_TOP: number;
  export const Y_MID: number;
  export const Y_LOW: number;
  export const Y_WATER: number;
  export const Y_OCEAN: number;
  export const Y_PEAK: number;
  export const STEP_INIT: number;
  export const STEP_DEC: number;
  export const STEP_MIN: number;
  export const STEP_FAST: number;
  export const STEP_CLIMB: number;
  export const LVL_CAP: number;
  export const BONUS_EVERY: number;
  export const BONUS_DUR: number;
  export const DIE_DUR: number;
  export const FBM_SEED_BASE: number;
  export const MAX_LIVES: number;

  export interface Direction {
    readonly x: number;
    readonly z: number;
    readonly name: 'up' | 'down' | 'left' | 'right';
  }

  export const DIRS: Readonly<{
    up: Direction;
    down: Direction;
    left: Direction;
    right: Direction;
  }>;

  export const OPP: Readonly<Record<'up' | 'down' | 'left' | 'right', string>>;

  export interface LevelPalette {
    readonly primary: number;
    readonly secondary: number;
    readonly goal: number;
    readonly name: string;
  }

  export const LEVEL_PALETTES: ReadonlyArray<LevelPalette>;

  export const STATE: Readonly<{
    LOADING: 'loading';
    TITLE: 'title';
    COUNTDOWN: 'countdown';
    PLAYING: 'playing';
    PAUSED: 'paused';
    DYING: 'dying';
    OVER: 'over';
    WIN: 'win';
  }>;

  export const MODE: Readonly<{
    STORY: 'story';
    TIME: 'time';
    DAILY: 'daily';
  }>;

  export const DEATH: Readonly<{
    VOID: 'void';
    SELF: 'self';
    TIME: 'time';
  }>;

  export const EVT: Readonly<{
    APP_READY: 'app:ready';
    STATE_CHANGE: 'state:change';
    SCORE: 'score:change';
    LEVEL_UP: 'level:up';
    FOOD_EATEN: 'food:eaten';
    BONUS_SPAWN: 'bonus:spawn';
    BONUS_CLEAR: 'bonus:clear';
    GOAL_REACHED: 'goal:reached';
    DYING: 'dying';
    GAME_OVER: 'game:over';
    LIFE_LOST: 'life:lost';
    PAUSE: 'pause';
    RESUME: 'resume';
    CAMERA: 'camera:change';
    AUDIO: 'audio:toggle';
    CB: 'cb:change';
    RM: 'rm:change';
    SLOW: 'slow:change';
  }>;

  export const STORAGE: Readonly<{
    HI: 'hi';
    AUDIO: 'audio';
    BEST_BY_SECTOR: 'bestBySector';
    LEADERBOARD: 'leaderboard';
    COLOR_BLIND: 'colorBlind';
    REDUCED_MOTION: 'reducedMotion';
    SLOW_MODE: 'slowMode';
  }>;
}
