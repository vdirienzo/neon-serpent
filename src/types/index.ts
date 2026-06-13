/**
 * @fileoverview Core type definitions for NEØN SERPENT. These types are
 * shared across the engine, game, and UI layers.
 */

/** 2D grid cell coordinates. */
export interface Cell {
  readonly gx: number;
  readonly gz: number;
}

/** Cardinal direction vector. */
export interface Direction {
  readonly x: number;
  readonly z: number;
  readonly name: 'up' | 'down' | 'left' | 'right';
}

/** Level color palette. */
export interface LevelPalette {
  readonly primary: number;
  readonly secondary: number;
  readonly goal: number;
  readonly name: string;
}

/** Top-level game state machine identifiers. */
export type GameState =
  | 'loading'
  | 'title'
  | 'countdown'
  | 'playing'
  | 'paused'
  | 'dying'
  | 'over'
  | 'win';

/** Available game modes. */
export type GameMode = 'story' | 'time' | 'daily';

/** Reasons the snake can die. */
export type DeathCause = 'void' | 'self' | 'time';

/** Pickup archetype identifiers. */
export type PickupType = 'orb' | 'gem' | 'crystal' | 'slow' | 'dice';

/** Result of a single `StepLogic.step()` call. */
export interface StepResult {
  readonly died?: boolean;
  readonly cause?: DeathCause;
  readonly won?: boolean;
  readonly ate?: 'food' | 'bonus' | null;
  readonly pickup?: unknown;
  readonly checkpoint?: unknown;
}

/** Pickup entry data structure. */
export interface PickupEntry {
  readonly mesh: unknown;
  gx: number;
  gz: number;
  type: PickupType;
  kind: string;
  active: boolean;
  t0: number;
  color: number;
  size: number;
  baseY: number;
}

/** Snake segment data. */
export interface SnakeSegment {
  gx: number;
  gz: number;
}

/** Snake step result. */
export interface SnakeStepResult {
  readonly status: 'ok' | 'died';
  readonly cause?: DeathCause;
  readonly newHead?: Cell;
  readonly grew?: boolean;
}

/** Event bus handler function. */
export type EventHandler<T = unknown> = (payload: T) => void;

/** Game context passed to StepLogic. */
export interface GameContext {
  readonly map: GameMap;
  readonly snake: Snake;
  readonly food: FoodEntity;
  readonly bonus: BonusEntity | null;
  readonly pickups: PickupsEntity;
  readonly checkpoints: CheckpointsEntity;
  readonly level: number;
  score: number;
  stepInterval: number;
  foodEaten: number;
  speedBoostUntil: number;
  slowMoUntil: number;
  readonly pickFreeCell: () => Cell | null;
  readonly spawnBonus: () => void;
  readonly onPickupCollect?: (pickup: PickupEntry) => void;
}

/** Minimal interface contracts for entities (structural typing). */
export interface GameMap {
  isSolid(gx: number, gz: number): boolean;
  isGoal(gx: number, gz: number): boolean;
  heightAt(gx: number, gz: number): number;
  bounds(): { minY: number; maxY: number };
  cells: Array<Array<{ goal?: boolean; solid?: boolean; lethal?: boolean; height?: number }>>;
}

export interface Snake {
  cells: SnakeSegment[];
  dir: Direction;
  pendingTurns: string[];
  reset(gx: number, gz: number): void;
  step(now: number): SnakeStepResult;
  applyMove(newHead: Cell, willGrow: boolean, growExtra?: number): void;
  setDir?(dir: string): void;
}

export interface FoodEntity {
  readonly mesh: unknown;
  gx: number;
  gz: number;
  spawn(gx: number, gz: number): void;
  dispose(): void;
  isAt(gx: number, gz: number): boolean;
  update(t: number, heightAt: (gx: number, gz: number) => number): void;
}

export interface BonusEntity {
  readonly mesh: unknown;
  gx: number;
  gz: number;
  spawn(gx: number, gz: number, durationSec: number): void;
  dispose(): void;
  isAt(gx: number, gz: number): boolean;
  update(t: number): void;
}

export interface PickupsEntity {
  readonly list: PickupEntry[];
  spawn(type: PickupType, gx: number, gz: number): PickupEntry | null;
  populate(rng: () => number, freeCellsFn: () => Cell[]): void;
  checkCollect(gx: number, gz: number, onCollect: (entry: PickupEntry) => void): PickupEntry | null;
  isOccupied(gx: number, gz: number): boolean;
  clear(): void;
  update(t: number): void;
}

export interface CheckpointsEntity {
  readonly list: Array<{ gx: number; gz: number; done: boolean }>;
  placeBetween(start: Cell, goal: Cell, map: GameMap): void;
  checkPass(gx: number, gz: number, onPass: (entry: { gx: number; gz: number }) => void): unknown;
  clear(): void;
}
