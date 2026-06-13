/**
 * @fileoverview Global error handlers + safeCall wrapper. SOTA 2026 pattern.
 *
 * Public API
 *   install()                     — register 'error' + 'unhandledrejection' on globalThis
 *   uninstall()                   — remove the registered listeners
 *   isInstalled()                 — true if listeners are currently attached
 *   setReporter(fn)               — receive a structured record { level, timestamp, message, stack, source?, line?, col?, kind? }
 *   setToastHandler(fn)           — receive (message, kind) for the in-game toast UI
 *   safeCall(fn, fallback?)       — try/catch wrapper. Returns fn() on success, fallback on error
 *   safeCallAsync(fn, fallback?)  — async variant
 *
 * Side effect: calling `install()` once at module load, but only when
 * `globalThis.addEventListener` is present (i.e. in a browser). In Node tests
 * the import is a no-op so the module can be unit-tested without a window.
 *
 * The handlers are idempotent: calling install() twice is a no-op.
 */

function getGlobal() {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof window !== 'undefined') return window;
  return null;
}

let installed = false;
let toastHandler = null;
let reporterHandler = null;
let registered = []; // [type, fn] pairs

function describeError(err) {
  if (err == null) return { message: 'Unknown error', stack: undefined };
  if (err instanceof Error) {
    return { message: err.message || String(err), stack: err.stack, name: err.name };
  }
  if (typeof err === 'string') return { message: err, stack: undefined };
  try {
    return { message: JSON.stringify(err), stack: undefined };
  } catch (e) {
    return { message: String(err), stack: undefined };
  }
}

function buildRecord(err, info) {
  const d = describeError(err);
  return {
    level: 'error',
    timestamp: new Date().toISOString(),
    message: d.message,
    stack: d.stack,
    name: d.name,
    ...info,
  };
}

function reportError(err, info) {
  if (typeof reporterHandler !== 'function') return;
  try {
    reporterHandler(buildRecord(err, info));
  } catch (e) {
    /* reporter must never throw */
  }
}

function showToast(err) {
  if (typeof toastHandler !== 'function') return;
  const d = describeError(err);
  try {
    toastHandler('Error: ' + (d.message || 'Unknown'), 'mag');
  } catch (e) {
    /* toast must never throw */
  }
}

function onErrorEvent(event) {
  const err =
    (event && (event.error || event.reason)) ||
    (event && event.message ? new Error(event.message) : new Error('Unknown error'));
  const info = {};
  if (event) {
    if (event.filename) info.source = event.filename;
    if (event.lineno != null) info.line = event.lineno;
    if (event.colno != null) info.col = event.colno;
    if (event.kind) info.kind = event.kind;
  }
  reportError(err, info);
  showToast(err);
}

function onUnhandledRejection(event) {
  const reason = event && event.reason;
  reportError(reason, { kind: 'unhandledrejection' });
  showToast(reason);
}

export function install() {
  if (installed) return false;
  const g = getGlobal();
  if (!g || typeof g.addEventListener !== 'function') return false;
  installed = true;
  g.addEventListener('error', onErrorEvent);
  g.addEventListener('unhandledrejection', onUnhandledRejection);
  registered = [
    ['error', onErrorEvent],
    ['unhandledrejection', onUnhandledRejection],
  ];
  return true;
}

export function uninstall() {
  if (!installed) return false;
  const g = getGlobal();
  for (const [type, fn] of registered) {
    if (g && typeof g.removeEventListener === 'function') {
      try {
        g.removeEventListener(type, fn);
      } catch (e) {
        /* ignore */
      }
    }
  }
  registered = [];
  installed = false;
  return true;
}

export function isInstalled() {
  return installed;
}

export function setReporter(fn) {
  reporterHandler = typeof fn === 'function' ? fn : null;
}

export function setToastHandler(fn) {
  toastHandler = typeof fn === 'function' ? fn : null;
}

export function safeCall(fn, fallback) {
  if (typeof fn !== 'function') {
    const e = new TypeError('safeCall: fn is not a function');
    reportError(e, { kind: 'safeCall' });
    showToast(e);
    return typeof fallback === 'function' ? fallback(e) : fallback;
  }
  try {
    return fn();
  } catch (e) {
    reportError(e, { kind: 'safeCall' });
    showToast(e);
    return typeof fallback === 'function' ? fallback(e) : fallback;
  }
}

export async function safeCallAsync(fn, fallback) {
  if (typeof fn !== 'function') {
    const e = new TypeError('safeCallAsync: fn is not a function');
    reportError(e, { kind: 'safeCallAsync' });
    showToast(e);
    return typeof fallback === 'function' ? fallback(e) : fallback;
  }
  try {
    return await fn();
  } catch (e) {
    reportError(e, { kind: 'safeCallAsync' });
    showToast(e);
    return typeof fallback === 'function' ? fallback(e) : fallback;
  }
}

// Auto-install on import. No-op in Node (no addEventListener on globalThis).
install();
