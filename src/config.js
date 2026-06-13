/**
 * @fileoverview Global constants shared across modules. Imported by the
 * world, entities, game, render, and audio layers. Values are tuned by
 * hand; do not mutate at runtime.
 */

/** Number of cells per side on the play grid. */
export const GRID = 32;

/** Half-extent of the grid, used to center coordinates on the origin. */
export const HALF = (GRID - 1) / 2;

/** World units per grid cell. */
export const CELL = 1.0;

/** Height of the boundary wall in world units. */
export const WALL_H = 3.0;

// World heights
/** Y of the top platform / goal level. */
export const Y_TOP = 0.0;
/** Y of the mid platform. */
export const Y_MID = -2.4;
/** Y of the low platform. */
export const Y_LOW = -5.0;
/** Y of the water surface. */
export const Y_WATER = -6.0;
/** Y of the deep ocean floor. */
export const Y_OCEAN = -9.0;
/** Y of the highest island peaks. */
export const Y_PEAK = 3.5;

// Gameplay tuning
/** Initial step interval (ms) at level 1. */
export const STEP_INIT = 95;
/** Step interval reduction per level. */
export const STEP_DEC = 3;
/** Hard floor for the step interval (ms). */
export const STEP_MIN = 48;
/** Step interval (ms) used in fast / time-attack modes. */
export const STEP_FAST = 28;
/** Y-delta applied per "climb" event when moving up levels. */
export const STEP_CLIMB = 9.0;
/** Highest level unlockable in story mode. */
export const LVL_CAP = 10;
/** Spawn a bonus pickup every N foods eaten. */
export const BONUS_EVERY = 4;
/** Default bonus pickup lifetime in seconds. */
export const BONUS_DUR = 9.0;
/** Death animation duration in seconds. */
export const DIE_DUR = 0.55;

// Seed base
/** Base seed offset mixed with the level index for the FBM noise generator. */
export const FBM_SEED_BASE = 7919;

// Directions

/**
 * Cardinal direction vectors used by snake movement. Frozen so consumers
 * cannot mutate them.
 * @typedef {{ x: number, z: number, name: 'up' | 'down' | 'left' | 'right' }} Direction
 */

/**
 * @type {Readonly<{ up: Direction, down: Direction, left: Direction, right: Direction }>}
 */
export const DIRS = Object.freeze({
  up: { x: 0, z: -1, name: 'up' },
  down: { x: 0, z: 1, name: 'down' },
  left: { x: -1, z: 0, name: 'left' },
  right: { x: 1, z: 0, name: 'right' },
});

/** Map from a direction name to its opposite. */
export const OPP = Object.freeze({ up: 'down', down: 'up', left: 'right', right: 'left' });

// Level palettes (10 levels: 2 easy at start + 5 classic simplified + 3 3D at end)

/**
 * Color palette applied to a level. `primary` and `secondary` are used for
 * terrain/lighting, `goal` for the goal beacon.
 * @typedef {{ primary: number, secondary: number, goal: number, name: string }} LevelPalette
 */

/** @type {ReadonlyArray<LevelPalette>} */
export const LEVEL_PALETTES = Object.freeze([
  { primary: 0x88aaff, secondary: 0xffc857, goal: 0x88aaff, name: 'INICIO' },
  { primary: 0x00f6ff, secondary: 0x39ff14, goal: 0x39ff14, name: 'AVANCE' },
  { primary: 0x00f6ff, secondary: 0xff2bd6, goal: 0xffc857, name: 'HUB' },
  { primary: 0x39ff14, secondary: 0x00f6ff, goal: 0x39ff14, name: 'ESCALERA' },
  { primary: 0xff2bd6, secondary: 0xffc857, goal: 0xff2bd6, name: 'CRUCES' },
  { primary: 0xb026ff, secondary: 0x39ff14, goal: 0xb026ff, name: 'ISLAS' },
  { primary: 0xffc857, secondary: 0x00f6ff, goal: 0xffc857, name: 'TORRE' },
  { primary: 0xb026ff, secondary: 0xffc857, goal: 0x39ff14, name: 'PILAR' },
  { primary: 0x39ff14, secondary: 0x00f6ff, goal: 0xffc857, name: 'ASCENSO' },
  { primary: 0xff2bd6, secondary: 0x88aaff, goal: 0xffc857, name: 'CIMA' },
]);

// Game states

/**
 * Top-level game state machine identifiers. Frozen enum-like object.
 * @type {Readonly<{
 *   LOADING: 'loading',
 *   TITLE: 'title',
 *   COUNTDOWN: 'countdown',
 *   PLAYING: 'playing',
 *   PAUSED: 'paused',
 *   DYING: 'dying',
 *   OVER: 'over',
 *   WIN: 'win'
 * }>}
 */
export const STATE = Object.freeze({
  LOADING: 'loading',
  TITLE: 'title',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  PAUSED: 'paused',
  DYING: 'dying',
  OVER: 'over',
  WIN: 'win',
});

// Game modes

/**
 * Available game modes.
 * @type {Readonly<{ STORY: 'story', TIME: 'time', DAILY: 'daily' }>}
 */
export const MODE = Object.freeze({
  STORY: 'story',
  TIME: 'time',
  DAILY: 'daily',
});

// Death causes (reduced 5 -> 3: WALL and CLIMB removed for dynamic feel)

/**
 * Reasons the snake can die.
 * @type {Readonly<{ VOID: 'void', SELF: 'self', TIME: 'time' }>}
 */
export const DEATH = Object.freeze({
  VOID: 'void',
  SELF: 'self',
  TIME: 'time',
});

/** Maximum lives per game (classic arcade style). */
export const MAX_LIVES = 3;

// Event names

/**
 * Canonical event names emitted on the `EventBus`. Consumers should always
 * reference these instead of string literals to keep the bus type-safe.
 * @type {Readonly<Record<string, string>>}
 */
export const EVT = Object.freeze({
  APP_READY: 'app:ready',
  STATE_CHANGE: 'state:change',
  SCORE: 'score:change',
  LEVEL_UP: 'level:up',
  FOOD_EATEN: 'food:eaten',
  BONUS_SPAWN: 'bonus:spawn',
  BONUS_CLEAR: 'bonus:clear',
  GOAL_REACHED: 'goal:reached',
  DYING: 'dying',
  GAME_OVER: 'game:over',
  LIFE_LOST: 'life:lost',
  PAUSE: 'pause',
  RESUME: 'resume',
  CAMERA: 'camera:change',
  AUDIO: 'audio:toggle',
  CB: 'cb:change',
  RM: 'rm:change',
  SLOW: 'slow:change',
});

// Storage keys

/**
 * Keys used with the `Store` module. Centralised so renaming is easy and
 * the `get`/`set` calls remain self-documenting.
 * @type {Readonly<Record<string, string>>}
 */
export const STORAGE = Object.freeze({
  HI: 'hi',
  AUDIO: 'audio',
  BEST_BY_SECTOR: 'bestBySector',
  LEADERBOARD: 'leaderboard',
  COLOR_BLIND: 'colorBlind',
  REDUCED_MOTION: 'reducedMotion',
  SLOW_MODE: 'slowMode',
});
