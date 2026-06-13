/**
 * @fileoverview Routes raw keyboard / touch input into snake direction
 * changes, with state-aware gating. System keys (pause, restart) bypass the
 * direction pipeline.
 */
import { mapDirCamera } from './InputMapper.js';

/**
 * @typedef {(e: KeyboardEvent) => void} KeyHandler
 * @typedef {(dir: 'up' | 'down' | 'left' | 'right') => void} SwipeHandler
 * @typedef {(payload: { from: string, to: string }) => void} TurnHandler
 */

/**
 * Mediates input. Owns one keyboard and one touch source, and emits
 * `turn` events whenever a direction is applied. System keys (anything
 * that isn't a direction key) are re-emitted as `syskey`.
 */
export class InputQueue {
  /**
   * @param {import('../entities/Snake.js').Snake} snake - Target snake.
   * @param {{ position: THREE.Vector3, userData?: { _lookTarget?: THREE.Vector3 } }} camera - Camera with optional `_lookTarget` user data.
   * @param {import('./KeyboardInput.js').KeyboardInput} keyboard
   * @param {import('./TouchInput.js').TouchInput} touch
   */
  constructor(snake, camera, keyboard, touch) {
    /** @type {import('../entities/Snake.js').Snake} */
    this.snake = snake;
    /** @type {any} */
    this.camera = camera;
    /** @type {import('./KeyboardInput.js').KeyboardInput} */
    this.keyboard = keyboard;
    /** @type {import('./TouchInput.js').TouchInput} */
    this.touch = touch;
    /** @type {Map<string, Set<Function>>} */
    this.handlers = new Map();
  }

  /**
   * Register a handler for an internal event (`'turn' | 'syskey'`).
   *
   * @param {string} event
   * @param {(payload: any) => void} fn
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
    if (set) for (const fn of set) fn(payload);
  }

  /**
   * Hook into the keyboard and touch sources. `state` is queried on every
   * event to decide whether to route it.
   *
   * @param {() => string} state - Function returning the current `STATE` value.
   * @returns {void}
   */
  attach(state) {
    this._getState = () => state();
    this.keyboard.on('key', (e) => {
      const s = this._getState();
      if (s === 'paused' || s === 'over' || s === 'title' || s === 'loading') {
        this._emit('syskey', e);
        return;
      }
      if (s !== 'playing' && s !== 'dying' && s !== 'countdown') return;
      this._handleKey(e);
    });
    this.touch.on('swipe', (named) => {
      const s = this._getState();
      if (s !== 'playing' && s !== 'dying' && s !== 'countdown') return;
      this._handleDir(named);
    });
  }

  /**
   * Split a keyboard event into a direction or a system key.
   * @param {KeyboardEvent} e
   * @returns {void}
   */
  _handleKey(e) {
    if (e.code.startsWith('Arrow') || ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
      const KEY_DIRS = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        KeyW: 'up',
        KeyS: 'down',
        KeyA: 'left',
        KeyD: 'right',
      };
      const named = KEY_DIRS[e.code];
      this._handleDir(named);
      e.preventDefault();
    } else {
      this._emit('syskey', e);
    }
  }

  /**
   * Apply a camera-relative direction: map through `mapDirCamera` and
   * forward to the snake.
   * @param {'up' | 'down' | 'left' | 'right'} named
   * @returns {void}
   */
  _handleDir(named) {
    const mapped = mapDirCamera(
      named,
      this.camera.position,
      this.camera.userData._lookTarget || this.camera.position
    );
    this.snake.setDir(mapped);
    this._emit('turn', { from: named, to: mapped });
  }
}
