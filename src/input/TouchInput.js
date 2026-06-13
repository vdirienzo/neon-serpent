/**
 * @fileoverview Touch / pointer swipe detection. Translates a drag distance
 * above a small threshold into a direction name. Pointer capture keeps the
 * drag alive even when the finger leaves the canvas.
 */
import { isTouchDevice } from '../core/DOM.js';

/** Minimum drag distance (px) before a swipe is registered. */
const TOUCH_THRESH = 26;

/**
 * Swipe input source. Listens to `pointerdown` / `pointermove` /
 * `pointerup` on the supplied canvas.
 */
export class TouchInput {
  /**
   * @param {HTMLCanvasElement} canvas - The element to capture pointer events on.
   */
  constructor(canvas) {
    /** @type {HTMLCanvasElement} */
    this.canvas = canvas;
    /** @type {boolean} Whether a swipe gesture is currently active. */
    this.active = false;
    /** @type {{ x: number, y: number } | null} Last pointer position. */
    this.lastTouch = null;
    /** @type {Map<string, Set<Function>>} */
    this.handlers = new Map();
  }

  /**
   * Register a handler for a swipe event.
   *
   * @param {string} event - Currently only `'swipe'`.
   * @param {(dir: 'up' | 'down' | 'left' | 'right') => void} fn
   * @returns {void}
   */
  on(event, fn) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event).add(fn);
  }

  /**
   * Internal: dispatch a registered event to all handlers.
   * @param {string} event
   * @param {*} payload
   * @returns {void}
   */
  _emit(event, payload) {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const fn of set) fn(payload);
  }

  /**
   * Attach pointer listeners. `state()` is called on every event to gate
   * input; `isPlaying` is unused (kept for API compatibility).
   *
   * @param {() => string} state - Returns the current state.
   * @param {() => boolean} isPlaying - Unused.
   * @returns {void}
   */
  attach(state, isPlaying) {
    this._checkState = () => state();
    this._isPlaying = isPlaying;
    this._down = (e) => {
      const s = this._checkState();
      if (s !== 'playing' && s !== 'dying' && s !== 'countdown') return;
      this.active = true;
      this.lastTouch = { x: e.clientX, y: e.clientY };
      this.canvas.setPointerCapture(e.pointerId);
    };
    this._move = (e) => {
      if (!this.active) return;
      const s = this._checkState();
      if (s !== 'playing' && s !== 'dying' && s !== 'countdown') {
        this.active = false;
        return;
      }
      const dx = e.clientX - this.lastTouch.x;
      const dy = e.clientY - this.lastTouch.y;
      if (Math.hypot(dx, dy) >= TOUCH_THRESH) {
        const named =
          Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        this._emit('swipe', named);
        this.lastTouch = { x: e.clientX, y: e.clientY };
      }
    };
    this._up = () => {
      this.active = false;
    };
    this.canvas.addEventListener('pointerdown', this._down);
    this.canvas.addEventListener('pointermove', this._move);
    this.canvas.addEventListener('pointerup', this._up);
    this.canvas.addEventListener('pointercancel', this._up);
  }
}
