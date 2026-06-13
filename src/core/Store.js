/**
 * @fileoverview `localStorage` wrapper with a graceful in-memory fallback
 * for environments where storage is disabled (private mode, sandboxed
 * iframes, server-side rendering, etc.).
 *
 * All keys are namespaced with the `ns_` prefix to avoid collisions with
 * other applications on the same origin. Values are JSON-encoded.
 */

/** @type {boolean} Whether `localStorage` is usable at module load time. */
let ok = false;
try {
  localStorage.setItem('__t', '1');
  localStorage.removeItem('__t');
  ok = true;
} catch (e) {
  ok = false;
}

/** @type {Map<string, any>} In-memory fallback store. */
const mem = new Map();

/**
 * `true` when `localStorage` is in use, `false` when values are kept in
 * the in-memory `Map`. Useful for diagnostics and UI hints.
 * @type {boolean}
 */
export const isPersistent = ok;

/**
 * Read a value by key, returning the default when missing or unreadable.
 *
 * @template T
 * @param {string} key - Application key (auto-prefixed with `ns_`).
 * @param {T} defaultValue - Value returned when the key is absent or corrupt.
 * @returns {*} The parsed JSON value, or `defaultValue`.
 */
export function get(key, defaultValue) {
  const k = 'ns_' + key;
  if (ok) {
    try {
      const v = localStorage.getItem(k);
      return v == null ? defaultValue : JSON.parse(v);
    } catch (e) {
      return defaultValue;
    }
  }
  return mem.has(k) ? mem.get(k) : defaultValue;
}

/**
 * Persist a JSON-serializable value.
 *
 * @param {string} key - Application key (auto-prefixed with `ns_`).
 * @param {*} value - Anything `JSON.stringify` can encode.
 * @returns {void}
 */
export function set(key, value) {
  const k = 'ns_' + key;
  if (ok) {
    try {
      localStorage.setItem(k, JSON.stringify(value));
      return;
    } catch (e) {}
  }
  mem.set(k, value);
}

/**
 * Remove a key from the active store.
 *
 * @param {string} key - Application key (auto-prefixed with `ns_`).
 * @returns {void}
 */
export function remove(key) {
  const k = 'ns_' + key;
  if (ok) {
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  }
  mem.delete(k);
}

/**
 * Delete every key owned by this application (those starting with `ns_`).
 *
 * @returns {void}
 */
export function clearAll() {
  if (ok) {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf('ns_') === 0) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  }
  mem.clear();
}
