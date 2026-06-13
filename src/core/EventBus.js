/**
 * @fileoverview Tiny synchronous pub/sub. Used for decoupled module
 * communication (game state, audio, input). Errors thrown by handlers are
 * caught and reported via `console.error` so one bad listener cannot break
 * the rest of the bus.
 *
 * @typedef {(payload?: any) => void} EventHandler
 */

/** @type {Map<string, Set<EventHandler>>} */
const handlers = new Map();

/**
 * Subscribe to an event. Returns an unsubscribe function for convenience.
 *
 * @param {string} event - Event name (typically a value from `EVT`).
 * @param {EventHandler} fn - Handler to invoke when the event is emitted.
 * @returns {() => void} Function that removes the subscription.
 *
 * @example
 * const off = on('score:change', ({ value }) => updateHud(value));
 * // later
 * off();
 */
export function on(event, fn) {
  if (!handlers.has(event)) handlers.set(event, new Set());
  handlers.get(event).add(fn);
  return () => off(event, fn);
}

/**
 * Remove a previously-registered handler. No-op if the handler was never added.
 *
 * @param {string} event - Event name.
 * @param {EventHandler} fn - Handler to remove.
 * @returns {void}
 */
export function off(event, fn) {
  const set = handlers.get(event);
  if (set) set.delete(fn);
}

/**
 * Emit an event, invoking all subscribers in registration order.
 * Exceptions inside handlers are caught and logged so they cannot break
 * downstream listeners.
 *
 * @param {string} event - Event name.
 * @param {*} [payload] - Optional data passed to each handler.
 * @returns {void}
 */
export function emit(event, payload) {
  const set = handlers.get(event);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(payload);
    } catch (e) {
      console.error('[EventBus]', event, e);
    }
  }
}

/**
 * Remove every subscription. Useful in tests and between level transitions.
 *
 * @returns {void}
 */
export function clear() {
  handlers.clear();
}
