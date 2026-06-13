/**
 * @fileoverview DOM helpers used by the UI modules. All functions are
 * environment-aware — they assume a browser with `document` available.
 */

/**
 * Shorthand for `document.getElementById`.
 *
 * @param {string} id - Element id.
 * @returns {HTMLElement | null} The element, or `null` if missing.
 */
export const $ = (id) => document.getElementById(id);

/**
 * Query a single element by CSS selector.
 *
 * @param {string} sel - CSS selector.
 * @param {ParentNode} [root] - Optional search root (defaults to `document`).
 * @returns {Element | null}
 */
export const qs = (sel, root) => (root || document).querySelector(sel);

/**
 * Query all elements matching a CSS selector, returning a real Array.
 *
 * @param {string} sel - CSS selector.
 * @param {ParentNode} [root] - Optional search root (defaults to `document`).
 * @returns {Element[]}
 */
export const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

/**
 * Create a DOM element with attribute and child support in a single call.
 *
 * The `attrs` object supports these convenience keys:
 *  - `class` → assigns `className`
 *  - `style` → if an object, merged onto `node.style`; otherwise `setAttribute`
 *  - `dataset` → if an object, merged onto `node.dataset`
 *  - `aria-*` / `role` → always set as attributes
 *  - other keys: assigned to the property if it exists on the node, else
 *    set as an attribute.
 *
 * Children may be a mix of strings (text nodes), DOM nodes, or nested arrays.
 * `null` / `undefined` children are skipped.
 *
 * @param {string} tag - Tag name (e.g. `'div'`).
 * @param {Object<string, any>} [attrs] - Attribute / property map.
 * @param {Array<Node|string|null|undefined> | Node | string} [children] - Children.
 * @returns {HTMLElement} The newly created element.
 *
 * @example
 * const btn = el('button', { class: 'cta', 'aria-label': 'Start' }, 'Play');
 * const card = el('section', { class: 'card' }, [
 *   el('h2', {}, 'Title'),
 *   el('p', {}, 'Body')
 * ]);
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') node.className = attrs[k];
    else if (k === 'style' && typeof attrs[k] === 'object') Object.assign(node.style, attrs[k]);
    else if (k === 'dataset' && typeof attrs[k] === 'object') Object.assign(node.dataset, attrs[k]);
    else if (k.startsWith('aria-') || k === 'role') node.setAttribute(k, attrs[k]);
    else if (k in node) node[k] = attrs[k];
    else node.setAttribute(k, attrs[k]);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

/**
 * Run a function once the DOM is interactive or complete. If the DOM is
 * already past `loading`, the function runs synchronously on the next
 * microtask via the `DOMContentLoaded` event, otherwise it listens once.
 *
 * @param {() => void} fn - Callback to invoke.
 * @returns {void}
 */
export function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

/**
 * Best-effort detection of touch-capable hardware. Checks for the legacy
 * `ontouchstart` property, `navigator.maxTouchPoints`, and a `coarse` pointer
 * media query. Any of the three returning truthy classifies the device as
 * touch.
 *
 * @returns {boolean} `true` if a touch interface is likely available.
 */
export function isTouchDevice() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

/**
 * Trigger a vibration pattern on supporting devices. Silently no-ops on
 * platforms without the Vibration API or in environments that throw.
 *
 * @param {number | number[]} pattern - Vibration pattern, see
 *   [MDN](https://developer.mozilla.org/docs/Web/API/Vibration_API).
 * @returns {void}
 */
export function vibrate(pattern) {
  if (!('vibrate' in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch (e) {}
}
