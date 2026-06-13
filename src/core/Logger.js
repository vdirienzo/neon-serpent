/**
 * @fileoverview SOTA 2026 structured logger.
 *
 * Public API
 *   Logger.setLevel(level)        — minimum enabled level ('debug'|'info'|'warn'|'error'|'none')
 *   Logger.getLevel()             — current level
 *   Logger.setReporter(fn)        — hook called for warn/error records (Sentry stub)
 *   Logger.setBaseContext(ctx)    — default fields attached to every record
 *   Logger.debug/info/warn/error(msg, ctx?) — emit a record
 *   Logger.child(ctx)             — derived logger that inherits fields
 *
 * Output format (single line):
 *   [2026-06-12T18:30:00.123Z] [INFO] [module=renderer fps=60] frame rendered
 *
 * The module is dependency-free at load time: it does not touch `window`,
 * `document`, or any global, so it can be imported in Node-based unit tests.
 *
 * Back-compat: the original `log` object is re-exported from `./Log.js` so
 * legacy callers (e.g. `log.warn('...')`) keep working when they switch their
 * import to this module. `setLevel` from Log.js is re-exported as
 * `setLegacyLevel` to avoid name collisions with the structured Logger API.
 */

export { log, setLevel as setLegacyLevel } from './Log.js';

const ORDER = Object.freeze({ debug: 0, info: 1, warn: 2, error: 3, none: 99 });

const state = {
  level: (typeof globalThis !== 'undefined' && globalThis.__logLevel) || 'warn',
  reporter: null,
  baseContext: Object.create(null),
};

function shouldLog(l) {
  const cur = ORDER[state.level];
  const want = ORDER[l];
  return want != null && cur != null && want >= cur;
}

function nowIso() {
  try {
    return new Date().toISOString();
  } catch (e) {
    return String(Date.now());
  }
}

function formatContext(ctx) {
  if (!ctx) return '';
  const keys = Object.keys(ctx);
  if (keys.length === 0) return '';
  const parts = [];
  for (const k of keys) {
    const v = ctx[k];
    if (v == null) continue;
    if (v instanceof Error) {
      parts.push(k + '=' + v.name + ':' + v.message);
    } else if (typeof v === 'string') {
      parts.push(k + '=' + v);
    } else {
      let s;
      try {
        s = JSON.stringify(v);
      } catch (e) {
        s = String(v);
      }
      parts.push(k + '=' + s);
    }
  }
  return parts.length ? '[' + parts.join(' ') + ']' : '';
}

function stringifyArgs(args) {
  if (args.length === 0) return '';
  if (args.length === 1) {
    const a = args[0];
    if (a == null) return String(a);
    if (typeof a === 'string') return a;
    if (a instanceof Error) return a.name + ': ' + a.message;
    try {
      return JSON.stringify(a);
    } catch (e) {
      return String(a);
    }
  }
  return args
    .map((a) => {
      if (a == null) return String(a);
      if (typeof a === 'string') return a;
      if (a instanceof Error) return a.name + ': ' + a.message;
      try {
        return JSON.stringify(a);
      } catch (e) {
        return String(a);
      }
    })
    .join(' ');
}

function emit(lvl, args, ctx) {
  const message = stringifyArgs(args);
  const record = {
    level: lvl.toUpperCase(),
    timestamp: nowIso(),
    message,
    context: ctx,
  };
  const consoleFn =
    (typeof console !== 'undefined' && console[lvl]) ||
    (typeof console !== 'undefined' && console.log);
  if (typeof consoleFn === 'function') {
    const tag = '[' + record.timestamp + '] [' + record.level + ']';
    const ctxStr = formatContext(ctx);
    const line = ctxStr ? tag + ' ' + ctxStr + ' ' + message : tag + ' ' + message;
    consoleFn(line);
  }
  if (state.reporter && (lvl === 'error' || lvl === 'warn')) {
    try {
      state.reporter(record);
    } catch (e) {
      /* reporter must never break logging */
    }
  }
  return record;
}

function mergeCtx(parent, extra) {
  if (!parent || !Object.keys(parent).length) {
    return extra ? { ...extra } : Object.create(null);
  }
  if (!extra) return { ...parent };
  return { ...parent, ...extra };
}

function makeLogger(parentCtx) {
  const emitLevel = (lvl) => (msg, ctx) => {
    if (!shouldLog(lvl)) return null;
    const merged = mergeCtx(state.baseContext, mergeCtx(parentCtx, ctx));
    return emit(lvl, [msg], merged);
  };
  const child = (ctx) => makeLogger(mergeCtx(parentCtx, ctx));
  return {
    debug: emitLevel('debug'),
    info: emitLevel('info'),
    warn: emitLevel('warn'),
    error: emitLevel('error'),
    child,
  };
}

const root = makeLogger({});

function setLevelImpl(l) {
  if (typeof l === 'string' && l in ORDER) {
    state.level = l;
    return true;
  }
  return false;
}

function getLevelImpl() {
  return state.level;
}

function setReporterImpl(fn) {
  state.reporter = typeof fn === 'function' ? fn : null;
}

function setBaseContextImpl(ctx) {
  state.baseContext = ctx && typeof ctx === 'object' ? { ...ctx } : Object.create(null);
}

const Logger = {
  debug: root.debug,
  info: root.info,
  warn: root.warn,
  error: root.error,
  child: root.child,
  setLevel: setLevelImpl,
  getLevel: getLevelImpl,
  setReporter: setReporterImpl,
  setBaseContext: setBaseContextImpl,
};

export default Logger;
export {
  Logger,
  setLevelImpl as setLevel,
  getLevelImpl as getLevel,
  setReporterImpl as setReporter,
  setBaseContextImpl as setBaseContext,
};
