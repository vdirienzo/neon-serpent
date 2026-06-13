// tests/dom/setup.js
// Minimal DOM mock for unit tests. Only the surface used by src/ui/* and a
// handful of render/* helpers (Background uses canvas). No linkedom, no jsdom.

const VOID_TAGS = new Set(['br', 'img', 'input', 'hr', 'meta', 'link']);
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

function makeClassList(initial) {
  const set = new Set(String(initial || '').split(/\s+/).filter(Boolean));
  return {
    _set: set,
    add(...names) { for (const n of names) if (n) set.add(n); },
    remove(...names) { for (const n of names) set.delete(n); },
    contains(name) { return set.has(name); },
    toggle(name, force) {
      if (force === true) { set.add(name); return true; }
      if (force === false) { set.delete(name); return false; }
      if (set.has(name)) { set.delete(name); return false; }
      set.add(name); return true;
    },
    toString() { return [...set].join(' '); },
    get length() { return set.size; }
  };
}

function makeStyle() {
  const style = {
    _props: new Map(),
    setProperty(k, v) { this._props.set(String(k), v == null ? '' : String(v)); },
    getPropertyValue(k) { return this._props.get(String(k)) || ''; },
    removeProperty(k) { this._props.delete(String(k)); },
    // Pre-declared CSS props used by the modules under test. Direct field
    // assignment must work (e.g. `style.color = '#abc'`).
    display: '',
    opacity: '',
    left: '',
    top: '',
    transform: '',
    color: '',
    background: '',
    backgroundColor: ''
  };
  return style;
}

function makeCanvas() {
  return {
    width: 0,
    height: 0,
    getContext(kind) {
      if (kind !== '2d') return null;
      return {
        createRadialGradient: () => ({ addColorStop() {} }),
        fillRect() {},
        fillStyle: ''
      };
    }
  };
}

function matchesSelector(el, sel) {
  if (!sel) return false;
  sel = sel.trim();
  if (!sel) return false;
  const re = /([.#]?[A-Za-z][\w-]*)|\[([A-Za-z_:][\w-]*)(?:=(?:"([^"]*)"|'([^']*)'|([^\s\]]+)))?\]/g;
  let m;
  let tagMatch = null;
  const classes = [];
  const ids = [];
  const attrs = [];
  let cursor = 0;
  while ((m = re.exec(sel)) !== null) {
    if (m.index !== cursor) return false;
    cursor = m.index + m[0].length;
    const tok = m[0];
    if (tok.startsWith('.')) classes.push(tok.slice(1));
    else if (tok.startsWith('#')) ids.push(tok.slice(1));
    else if (tok.startsWith('[')) {
      const val = m[3] != null ? m[3] : m[4] != null ? m[4] : m[5] != null ? m[5] : null;
      attrs.push([m[2], val]);
    } else {
      tagMatch = tok;
    }
  }
  if (cursor !== sel.length) return false;
  if (tagMatch && el.tagName !== tagMatch.toUpperCase()) return false;
  for (const c of classes) if (!el.classList || !el.classList.contains(c)) return false;
  for (const id of ids) if (el.id !== id) return false;
  for (const [a, v] of attrs) {
    let actual;
    if (a === 'class') actual = el.className;
    else if (a.startsWith('data-')) actual = el.dataset[a.slice(5)] ?? null;
    else if (a in el && typeof el[a] !== 'object' && typeof el[a] !== 'function') actual = el[a];
    else actual = el.getAttribute(a);
    if (v === null) {
      if (actual == null) return false;
    } else if (String(actual) !== v) {
      return false;
    }
  }
  return true;
}

// Split a selector on combinators. We only support the descendant
// combinator (whitespace) and a single '>' child combinator, which is
// enough for the modules under test.
function splitCompound(sel) {
  // Walk character-by-character so we don't split inside attribute brackets.
  const out = [];
  let buf = '';
  let depth = 0;
  for (let i = 0; i < sel.length; i++) {
    const ch = sel[i];
    if (ch === '[') depth++;
    else if (ch === ']') depth = Math.max(0, depth - 1);
    if (depth === 0 && (ch === ' ' || ch === '\t' || ch === '>')) {
      if (buf) { out.push(buf); buf = ''; }
      continue;
    }
    buf += ch;
  }
  if (buf) out.push(buf);
  return out;
}

function querySelector(root, sel) {
  sel = String(sel).trim();
  if (!sel) return null;
  const parts = splitCompound(sel);
  if (parts.length === 0) return null;
  return findCompound(root, parts, 0);
}

function querySelectorAll(root, sel) {
  sel = String(sel).trim();
  if (!sel) return [];
  const parts = splitCompound(sel);
  if (parts.length === 0) return [];
  return findAllCompound(root, parts, 0);
}

function findCompound(root, parts) {
  // Walk the tree looking for a match of parts[last]. For each candidate,
  // verify each ancestor (parent, grandparent, ...) matches parts[last-1],
  // parts[last-2], ... in order. This is the standard descendant-combinator
  // semantics from right to left.
  const last = parts[parts.length - 1];
  for (const c of walk(root)) {
    if (c.nodeType !== ELEMENT_NODE) continue;
    if (!matchesSelector(c, last)) continue;
    let ok = true;
    let ancestor = c.parentNode;
    for (let i = parts.length - 2; i >= 0; i--) {
      if (!ancestor || ancestor.nodeType !== ELEMENT_NODE || !matchesSelector(ancestor, parts[i])) {
        ok = false;
        break;
      }
      ancestor = ancestor.parentNode;
    }
    if (ok) return c;
  }
  return null;
}

function findAllCompound(root, parts) {
  const last = parts[parts.length - 1];
  const out = [];
  for (const c of walk(root)) {
    if (c.nodeType !== ELEMENT_NODE) continue;
    if (!matchesSelector(c, last)) continue;
    let ok = true;
    let ancestor = c.parentNode;
    for (let i = parts.length - 2; i >= 0; i--) {
      if (!ancestor || ancestor.nodeType !== ELEMENT_NODE || !matchesSelector(ancestor, parts[i])) {
        ok = false;
        break;
      }
      ancestor = ancestor.parentNode;
    }
    if (ok) out.push(c);
  }
  return out;
}

function* walk(node) {
  if (node.nodeType === ELEMENT_NODE) yield node;
  for (const c of node.children) yield* walk(c);
}

function parseHTMLFragment(html, parent) {
  // Tiny recursive-descent HTML parser. Handles the subset produced by the
  // modules under test: tags, attributes (incl. data-* / aria-* / style),
  // text content, and self-closing void tags. Not standards-compliant.
  let pos = 0;
  const root = parent;
  const stack = [root];
  const len = html.length;
  const pushChild = (node) => {
    const top = stack[stack.length - 1];
    if (top.appendChild) top.appendChild(node);
    else if (top._appendChild) top._appendChild(node);
  };
  while (pos < len && stack.length > 0) {
    if (html[pos] === '<') {
      const end = html.indexOf('>', pos);
      if (end === -1) break;
      let body = html.slice(pos + 1, end);
      pos = end + 1;
      if (body.startsWith('!')) continue; // comment / doctype
      const selfClose = body.endsWith('/');
      if (selfClose) body = body.slice(0, -1);
      body = body.trim();
      if (body.startsWith('/')) {
        stack.pop();
        continue;
      }
      const sp = body.search(/\s/);
      const tagName = (sp === -1 ? body : body.slice(0, sp)).toLowerCase();
      const attrText = sp === -1 ? '' : body.slice(sp + 1);
      const el = tagName === 'canvas' ? makeCanvas() : makeElement(tagName);
      parseAttrs(attrText, el);
      pushChild(el);
      if (!selfClose && !VOID_TAGS.has(tagName)) stack.push(el);
    } else {
      const next = html.indexOf('<', pos);
      const slice = html.slice(pos, next === -1 ? len : next);
      pos = next === -1 ? len : next;
      if (slice) pushChild(makeTextNode(slice));
    }
  }
}

function parseAttrs(text, el) {
  if (!text) return;
  const re = /([A-Za-z_:][\w:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+)))?/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const key = m[1];
    const val = m[2] != null ? m[2] : m[3] != null ? m[3] : m[4] != null ? m[4] : '';
    if (key === 'class') {
      el.className = val;
    } else if (key === 'id') {
      el.id = val;
    } else if (key === 'style') {
      String(val).split(';').forEach((decl) => {
        const colon = decl.indexOf(':');
        if (colon < 0) return;
        const k = decl.slice(0, colon).trim();
        const v = decl.slice(colon + 1).trim();
        if (k) el.style.setProperty(k, v);
      });
    } else if (key.startsWith('data-')) {
      el.dataset[key.slice(5)] = val;
    } else if (
      key === 'type' || key === 'value' || key === 'min' || key === 'max' ||
      key === 'step' || key === 'placeholder' || key === 'name' || key === 'href' ||
      key === 'src' || key === 'tabindex' || key === 'role' || key === 'disabled' ||
      key === 'checked' || key === 'selected'
    ) {
      el[key] = (key === 'value' || key === 'min' || key === 'max' || key === 'step') ? val : val;
    } else if (key.startsWith('aria-') || key === 'role' || key === 'hidden') {
      el.setAttribute(key, val);
    } else {
      el.setAttribute(key, val);
    }
  }
}

function makeTextNode(text) {
  return {
    nodeType: TEXT_NODE,
    nodeName: '#text',
    nodeValue: String(text),
    textContent: String(text),
    parentNode: null,
    _listeners: {}
  };
}

function makeElement(tagName) {
  const listeners = {};
  const el = {
    nodeType: ELEMENT_NODE,
    nodeName: tagName.toUpperCase(),
    tagName: tagName.toUpperCase(),
    id: '',
    className: '',
    children: [],
    childNodes: [],
    parentNode: null,
    attributes: {},
    dataset: {},
    _listeners: listeners,
    _frozen: false,
    style: makeStyle(),
    hidden: false,
    offsetWidth: 0,
    offsetHeight: 0,
    value: '',
    type: '',
    title: ''
  };
  Object.defineProperty(el, 'classList', { value: makeClassList(''), enumerable: true });
  Object.defineProperty(el, 'className', {
    get() { return el.classList.toString(); },
    set(v) {
      el.classList._set.clear();
      String(v).split(/\s+/).filter(Boolean).forEach((n) => el.classList._set.add(n));
    }
  });
  Object.defineProperty(el, 'firstChild', {
    get() { return el.childNodes[0] || null; }
  });
  Object.defineProperty(el, 'lastChild', {
    get() { return el.childNodes[el.childNodes.length - 1] || null; }
  });
  Object.defineProperty(el, 'textContent', {
    get() {
      let out = '';
      for (const c of el.childNodes) {
        if (c.nodeType === TEXT_NODE) out += c.nodeValue;
        else if (c.nodeType === ELEMENT_NODE) out += c.textContent || '';
      }
      return out;
    },
    set(v) {
      el.children.length = 0;
      el.childNodes.length = 0;
      if (v != null && v !== '') el.appendChild(makeTextNode(String(v)));
    }
  });
  Object.defineProperty(el, 'innerHTML', {
    get() { return ''; },
    set(html) {
      el.children.length = 0;
      el.childNodes.length = 0;
      parseHTMLFragment(String(html || ''), el);
    }
  });

  el.appendChild = (child) => {
    if (child.parentNode) child.parentNode.removeChild(child);
    child.parentNode = el;
    if (child.nodeType === ELEMENT_NODE) el.children.push(child);
    el.childNodes.push(child);
    return child;
  };
  el.removeChild = (child) => {
    const ci = el.children.indexOf(child);
    if (ci >= 0) el.children.splice(ci, 1);
    const cni = el.childNodes.indexOf(child);
    if (cni >= 0) el.childNodes.splice(cni, 1);
    child.parentNode = null;
    return child;
  };
  el.insertBefore = (newNode, refNode) => {
    if (refNode == null) return el.appendChild(newNode);
    const idx = el.childNodes.indexOf(refNode);
    if (idx < 0) return el.appendChild(newNode);
    if (newNode.parentNode) newNode.parentNode.removeChild(newNode);
    newNode.parentNode = el;
    if (newNode.nodeType === ELEMENT_NODE) el.children.splice(idx, 0, newNode);
    el.childNodes.splice(idx, 0, newNode);
    return newNode;
  };
  el.remove = () => { if (el.parentNode) el.parentNode.removeChild(el); };
  el.setAttribute = (k, v) => { el.attributes[k] = String(v); };
  el.getAttribute = (k) => (k in el.attributes ? el.attributes[k] : null);
  el.removeAttribute = (k) => { delete el.attributes[k]; };
  el.addEventListener = (type, fn /* , opts */) => {
    (listeners[type] = listeners[type] || []).push(fn);
  };
  el.removeEventListener = (type, fn) => {
    if (!listeners[type]) return;
    listeners[type] = listeners[type].filter((f) => f !== fn);
  };
  el.dispatchEvent = (evt) => {
    const t = evt && evt.type;
    if (!t) return;
    const list = (listeners[t] || []).slice();
    for (const fn of list) {
      try { fn(evt); } catch (e) { /* subscriber error: don't break chain */ }
    }
  };
  el.querySelector = (sel) => querySelector(el, sel);
  el.querySelectorAll = (sel) => querySelectorAll(el, sel);
  el.getElementsByTagName = (tag) => {
    const out = [];
    const want = String(tag).toLowerCase();
    const walk = (n) => {
      for (const c of n.children) {
        if (c.tagName && c.tagName.toLowerCase() === want) out.push(c);
        walk(c);
      }
    };
    walk(el);
    return out;
  };
  el.blur = () => {};
  el.focus = () => {};
  el.click = () => el.dispatchEvent({ type: 'click', target: el, currentTarget: el });
  return el;
}

function makeDocument() {
  const elements = new Map();
  const docListeners = {};
  const doc = {
    nodeType: 9,
    nodeName: '#document',
    _elements: elements,
    _activeElement: null,
    _readyState: 'complete',
    body: makeElement('body'),
    head: makeElement('head'),
    addEventListener(type, fn) { (docListeners[type] = docListeners[type] || []).push(fn); },
    removeEventListener(type, fn) {
      if (!docListeners[type]) return;
      docListeners[type] = docListeners[type].filter((f) => f !== fn);
    },
    dispatchEvent(evt) {
      const list = (docListeners[evt && evt.type] || []).slice();
      for (const fn of list) { try { fn(evt); } catch (e) { /* ignore */ } }
    },
    getElementById(id) { return elements.get(id) || null; },
    createElement(tag) {
      const tn = String(tag).toLowerCase();
      if (tn === 'canvas') return makeCanvas();
      return makeElement(tn);
    },
    createTextNode(text) { return makeTextNode(text); },
    createDocumentFragment() {
      const frag = makeElement('fragment');
      frag._isFragment = true;
      return frag;
    },
    querySelector(sel) {
      for (const e of elements.values()) if (matchesSelector(e, sel)) return e;
      return null;
    },
    querySelectorAll(sel) {
      const out = [];
      for (const e of elements.values()) if (matchesSelector(e, sel)) out.push(e);
      return out;
    }
  };
  Object.defineProperty(doc, 'activeElement', {
    get() { return doc._activeElement; },
    set(v) { doc._activeElement = v; }
  });
  Object.defineProperty(doc, 'readyState', {
    get() { return doc._readyState; },
    set(v) { doc._readyState = v; }
  });
  return doc;
}

function makeWindow(doc) {
  const listeners = {};
  const win = {
    document: doc,
    isSecureContext: false,
    innerWidth: 1280,
    innerHeight: 720,
    location: { hostname: 'localhost', protocol: 'http:', href: 'http://localhost/' },
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    removeEventListener(type, fn) {
      if (!listeners[type]) return;
      listeners[type] = listeners[type].filter((f) => f !== fn);
    },
    dispatchEvent(evt) {
      const list = (listeners[evt && evt.type] || []).slice();
      for (const fn of list) { try { fn(evt); } catch (e) { /* ignore */ } }
    }
  };
  return win;
}

function makeLocalStorage() {
  const store = new Map();
  return {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(String(k), String(v)); },
    removeItem(k) { store.delete(String(k)); },
    clear() { store.clear(); },
    key(i) { return [...store.keys()][i] ?? null; },
    get length() { return store.size; }
  };
}

let _installed = false;
let _savedGlobals = null;

export function installDOM() {
  if (_installed) return;
  const g = globalThis;
  _savedGlobals = {
    document: g.document,
    window: g.window,
    HTMLElement: g.HTMLElement,
    localStorage: g.localStorage,
    requestAnimationFrame: g.requestAnimationFrame,
    cancelAnimationFrame: g.cancelAnimationFrame,
    navigator: g.navigator
  };
  const doc = makeDocument();
  const win = makeWindow(doc);
  const storage = makeLocalStorage();
  g.document = doc;
  g.window = win;
  g.HTMLElement = function () {};
  g.localStorage = storage;
  if (typeof g.requestAnimationFrame !== 'function') {
    g.requestAnimationFrame = (fn) => setTimeout(() => fn(performance.now()), 0);
    g.cancelAnimationFrame = (id) => clearTimeout(id);
  }
  _installed = true;
}

export function uninstallDOM() {
  if (!_installed) return;
  const g = globalThis;
  for (const k of Object.keys(_savedGlobals)) {
    if (_savedGlobals[k] === undefined) delete g[k];
    else g[k] = _savedGlobals[k];
  }
  _installed = false;
}

export function getDocument() { return globalThis.document; }
export function getWindow() { return globalThis.window; }
export function getLocalStorage() { return globalThis.localStorage; }

export function registerElement(id, el) {
  if (!_installed) installDOM();
  const doc = globalThis.document;
  doc._elements.set(String(id), el);
  if (el && !el.id) el.id = String(id);
  return el;
}

export function clearDOM() {
  if (!_installed) return;
  globalThis.document._elements.clear();
  globalThis.localStorage.clear();
}

export function mockElement(tag = 'div') { return makeElement(tag); }
export function mockTextNode(text = '') { return makeTextNode(text); }

export const TEST_CONSTANTS = Object.freeze({ ELEMENT_NODE, TEXT_NODE });
