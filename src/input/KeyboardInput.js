/**
 * @fileoverview Raw keyboard event source. Listens once on `window` for
 * non-repeat `keydown` events and fans them out to subscribers via the
 * `'key'` channel.
 */

/**
 * Map of `KeyboardEvent.code` → world direction name. WASD and the arrow
 * keys are aliases.
 * @type {Readonly<Record<string, string>>}
 */
const KEY_DIRS = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

/**
 * Test whether a `KeyboardEvent.code` is a direction key.
 *
 * @param {string} code
 * @returns {boolean}
 */
export function isDirKey(code) {
  return code in KEY_DIRS;
}

/**
 * Map a `KeyboardEvent.code` to its direction name.
 *
 * @param {string} code
 * @returns {string | undefined} Direction name, or `undefined` if not a direction key.
 */
export function dirForKey(code) {
  return KEY_DIRS[code];
}

/**
 * Minimal keydown fan-out. Subscribers receive the raw `KeyboardEvent`.
 */
export class KeyboardInput {
  /** Create a KeyboardInput with no listeners attached. */
  constructor() {
    /** @type {Map<string, Set<(e: KeyboardEvent) => void>>} */
    this.handlers = new Map();
  }

  /**
   * Register a handler for the `'key'` event.
   *
   * @param {string} event - Currently only `'key'` is supported.
   * @param {(e: KeyboardEvent) => void} fn
   * @returns {void}
   */
  on(event, fn) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event).add(fn);
  }

  /**
   * Register a non-repeating `keydown` listener on `window`. The listener
   * ignores auto-repeat events (`e.repeat === true`).
   *
   * @returns {void}
   */
  attach() {
    this._listener = (e) => {
      if (e.repeat) return;
      const set = this.handlers.get('key');
      if (!set) return;
      for (const fn of set) fn(e);
    };
    window.addEventListener('keydown', this._listener, { passive: false });
  }

  /**
   * Remove the `keydown` listener. Safe to call when not attached.
   *
   * @returns {void}
   */
  detach() {
    if (this._listener) window.removeEventListener('keydown', this._listener);
  }
}
