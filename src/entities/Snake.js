/**
 * @fileoverview Snake data model. Pure data + step logic; no rendering.
 * Owns the body cell list, the pending-turn queue, and a small
 * "invulnerable" grace window used by power-ups.
 */
import { DIRS, STEP_CLIMB, GRID, Y_OCEAN } from '../config.js';

/**
 * Result of a snake step.
 * @typedef {Object} SnakeStepResult
 * @property {'ok' | 'died'} status - Whether the move succeeded.
 * @property {'void' | 'self'} [cause] - Death cause, only set when `status === 'died'`.
 * @property {boolean} [grew] - Whether the snake grew this step.
 * @property {{ gx: number, gz: number }} [newHead] - The proposed new head
 *   cell, only set on success. The caller applies it via `applyMove()`.
 */

/**
 * The snake itself: a list of cells (head at index 0), a current direction,
 * and a queue of queued direction changes applied at the next step.
 */
export class Snake {
  /**
   * @param {import('../world/HeightMap.js').default} map - Heightmap used to
   *   test solidity and resolve safe starts.
   */
  constructor(map) {
    /** @type {import('../world/HeightMap.js').default} */
    this.map = map;
    /** @type {Array<{ gx: number, gz: number }>} Body cells, head at index 0. */
    this.cells = [];
    /** @type {Array<{ gx: number, gz: number }>} Snapshot of cells before the last move, used for interpolated rendering. */
    this.prevCells = [];
    /** @type {{ x: number, z: number, name: string }} Current direction vector. */
    this.dir = DIRS.right;
    /** @type {string[]} Queued direction names, applied in FIFO order. */
    this.pendingTurns = [];
    /** @type {number} Wall-clock time (ms) until which the snake is invulnerable. */
    this.invulnerableUntil = 0;
  }

  /**
   * Reset the snake to a 4-cell horizontal segment starting at the nearest
   * solid cell to `(startGX, startGZ)`, facing right.
   *
   * @param {number} startGX - Preferred start cell X.
   * @param {number} startGZ - Preferred start cell Z.
   * @returns {void}
   */
  reset(startGX, startGZ) {
    const start = this.map.findNearestSolid(startGX, startGZ, 6) || { gx: startGX, gz: startGZ };
    this.cells = [];
    for (let i = 0; i < 4; i++) {
      const c = { gx: start.gx, gz: start.gz + i };
      const safe = this.map.isSolid(c.gx, c.gz) ? c : this.map.findNearestSolid(c.gx, c.gz, 3) || c;
      this.cells.push(safe);
    }
    this.prevCells = this.cells.map((s) => ({ ...s }));
    this.dir = DIRS.right;
    this.pendingTurns = [];
  }

  /**
   * Queue a direction change. The new direction is applied at the next
   * `step()`. 180° reversals are dropped. Identical repeats are dropped
   * (the last item in the queue is checked). Queue is capped at 2.
   *
   * @param {string} name - One of `'up' | 'down' | 'left' | 'right'`.
   * @returns {void}
   */
  setDir(name) {
    const d = DIRS[name];
    if (!d) return;
    const last = this.pendingTurns.length
      ? DIRS[this.pendingTurns[this.pendingTurns.length - 1]]
      : this.dir;
    if (d.x === -last.x && d.z === -last.z) return;
    if (this.pendingTurns.length === 0) {
      if (d.x === this.dir.x && d.z === this.dir.z) return;
    } else {
      if (this.pendingTurns[this.pendingTurns.length - 1] === name) return;
    }
    if (this.pendingTurns.length >= 2) this.pendingTurns.shift();
    this.pendingTurns.push(name);
  }

  /**
   * @returns {{ gx: number, gz: number }} The head cell.
   */
  head() {
    return this.cells[0];
  }

  /**
   * @returns {number} Current body length in cells.
   */
  length() {
    return this.cells.length;
  }

  /**
   * Test whether the snake is currently invulnerable (i.e. inside a
   * power-up grace window).
   *
   * @param {number} now - Current wall-clock time in milliseconds.
   * @returns {boolean}
   */
  invulnerable(now) {
    return now < this.invulnerableUntil;
  }

  /**
   * Set the invulnerability window's end time.
   *
   * @param {number} untilMs - Wall-clock time in milliseconds.
   * @returns {void}
   */
  setInvulnerable(untilMs) {
    this.invulnerableUntil = untilMs;
  }

  /**
   * Compute the result of the next step WITHOUT committing it. Pop the
   * pending turn queue, propose a new head cell, and check solidity, climb
   * delta, and self-collision. If a check fails while the snake is
   * invulnerable, the step is still reported as `ok` (it "passes through"
   * the obstacle).
   *
   * @param {number} now - Current wall-clock time (ms), used for invulnerability.
   * @returns {SnakeStepResult}
   */
  step(now) {
    if (this.pendingTurns.length) {
      const next = this.pendingTurns.shift();
      this.dir = DIRS[next];
    }
    const head = this.cells[0];
    const newHead = { gx: head.gx + this.dir.x, gz: head.gz + this.dir.z };

    if (!this.map.isSolid(newHead.gx, newHead.gz)) {
      if (!this.invulnerable(now)) return { status: 'died', cause: 'void' };
      return { status: 'ok', grew: false };
    }
    const fromY = this.map.heightAt(head.gx, head.gz);
    const toY = this.map.heightAt(newHead.gx, newHead.gz);
    if (Math.abs(toY - fromY) > STEP_CLIMB) {
      if (!this.invulnerable(now)) return { status: 'died', cause: 'void' };
      return { status: 'ok', grew: false };
    }

    const willGrow = false;
    for (let i = 0; i < this.cells.length; i++) {
      if (i === this.cells.length - 1 && !willGrow) continue;
      if (this.cells[i].gx === newHead.gx && this.cells[i].gz === newHead.gz) {
        if (!this.invulnerable(now)) return { status: 'died', cause: 'self' };
        return { status: 'ok', grew: false };
      }
    }
    return { status: 'ok', grew: false, newHead };
  }

  /**
   * Commit a previously-proposed move. The previous cell snapshot is saved
   * for the renderer to interpolate between.
   *
   * @param {{ gx: number, gz: number }} newHead - Head cell returned by `step()`.
   * @param {boolean} willGrow - Whether the head is also a growth event
   *   (food consumed). When `true`, the tail is preserved.
   * @param {number} [willGrowExtra=0] - Number of extra cells to append at
   *   the tail (used for bonus multi-grow).
   * @returns {void}
   */
  applyMove(newHead, willGrow, willGrowExtra = 0) {
    this.prevCells = this.cells.map((s) => ({ ...s }));
    this.cells.unshift(newHead);
    if (willGrow || willGrowExtra === 0) {
      // grow or just normal
    }
    if (!willGrow && willGrowExtra === 0) {
      this.cells.pop();
    }
    for (let g = 0; g < willGrowExtra; g++) {
      this.cells.push({ ...this.cells[this.cells.length - 1] });
    }
  }
}
