// src/core/i18n.js
// Lightweight i18n module. SOTA 2026 pattern: zero deps, ESM dynamic JSON
// imports, dotted key lookup, ICU-lite plurals, persistent locale preference.
//
// Public API
//   t(key, params?)          — resolve a dotted key against the current locale
//   setLocale(loc)           — async switch; persists to localStorage.ns_locale
//   getLocale()              — current locale code (e.g. 'es')
//   getAvailableLocales()    — list of supported locales
//   onLocaleChange(fn)       — subscribe to locale changes (returns unsub fn)
//   init()                   — async; ensures default locale is loaded, runs
//                             detection (localStorage → navigator → default)
//
// Storage
//   localStorage.ns_locale   — explicit user override; takes precedence over
//                             browser language detection.
//
// Fallback
//   Missing keys return `[<locale>.<key>]` so missing strings are visible
//   in the UI rather than silently rendering as empty text.
//
// Top-level await is used to pre-load the default locale so that the first
// call to t() from any consumer (UI, tests) resolves synchronously against
// the cached catalog.
//
// Pending extraction (owned by Agent 3 — index.html): the title screen,
// pause/over/leaderboard/settings modal headings, HUD labels, button text
// and the loader copy are still hardcoded in index.html. Suggested key
// paths: title.{main,kicker,sub,rec}, hud.{score,level,sector,record},
// actions.{start,timeAttack,daily,levelSelect}, modals.{pause,over,
// leaderboard,settings}.{title,sub}, buttons.{resume,restart,share,
// save,close,back,leaderboard}, loader.{title,sub,error,errorHint}.

const STORAGE_KEY = 'ns_locale';
const DEFAULT_LOCALE = 'es';
const LOCALE_EVENT = 'ns:locale-change';
const AVAILABLE_LOCALES = Object.freeze(['es', 'en']);

const cache = new Map();
let currentLocale = DEFAULT_LOCALE;
const subscribers = new Set();
let detected = false;

function getStorage() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch (e) {
    /* restricted / SSR */
  }
  return null;
}

function getNavigatorLanguages() {
  try {
    if (typeof navigator !== 'undefined') {
      if (navigator.languages && navigator.languages.length) {
        return Array.from(navigator.languages);
      }
      if (navigator.language) return [navigator.language];
    }
  } catch (e) {
    /* no navigator */
  }
  return [];
}

function readSavedLocale() {
  const s = getStorage();
  if (!s) return null;
  try {
    const v = s.getItem(STORAGE_KEY);
    if (v && AVAILABLE_LOCALES.includes(v)) return v;
  } catch (e) {
    /* corrupt storage */
  }
  return null;
}

function writeSavedLocale(loc) {
  const s = getStorage();
  if (!s) return;
  try {
    s.setItem(STORAGE_KEY, loc);
  } catch (e) {
    /* quota / disabled */
  }
}

function detectInitialLocale() {
  const saved = readSavedLocale();
  if (saved) return saved;
  for (const raw of getNavigatorLanguages()) {
    const lower = String(raw).toLowerCase();
    if (AVAILABLE_LOCALES.includes(lower)) return lower;
    const primary = lower.split('-')[0];
    if (AVAILABLE_LOCALES.includes(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}

async function loadLocale(loc) {
  if (cache.has(loc)) return cache.get(loc);
  try {
    const mod = await import(`../locales/${loc}.json`, { with: { type: 'json' } });
    const data = mod && mod.default ? mod.default : mod;
    cache.set(loc, data || {});
    return data || {};
  } catch (e) {
    cache.set(loc, {});
    return {};
  }
}

function lookup(data, key) {
  if (!data || typeof data !== 'object') return undefined;
  const parts = String(key).split('.');
  let cur = data;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  if (typeof cur === 'string' || typeof cur === 'number') return cur;
  return undefined;
}

// Interpolate `{name}` placeholders and ICU-lite `{count, plural, one {…}
// other {…}}` blocks. The plural branches themselves may contain `#` (which
// is replaced with the count) and `{name}` placeholders.
function interpolate(template, params) {
  if (!params) return template;
  let out = String(template).replace(
    /\{(\w+),\s*plural,\s*one\s*\{([^{}]*)\}\s*other\s*\{([^{}]*)\}\}/g,
    (m, name, oneBranch, otherBranch) => {
      const n = Number(params[name] ?? 0);
      const branch = n === 1 ? oneBranch : otherBranch;
      return interpolate(branch, { ...params, count: n });
    }
  );
  if (params.count != null) {
    out = out.replace(/#/g, String(params.count));
  }
  out = out.replace(/\{(\w+)\}/g, (m, name) => (params[name] != null ? String(params[name]) : m));
  return out;
}

export function t(key, params) {
  const data = cache.get(currentLocale) || cache.get(DEFAULT_LOCALE) || {};
  const value = lookup(data, key);
  if (value === undefined) {
    return `[${currentLocale}.${key}]`;
  }
  return interpolate(value, params);
}

export function getLocale() {
  return currentLocale;
}

export function getAvailableLocales() {
  return AVAILABLE_LOCALES.slice();
}

function emitChange() {
  if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: { locale: currentLocale } }));
    } catch (e) {
      /* old browsers */
    }
  }
  for (const fn of subscribers) {
    try {
      fn(currentLocale);
    } catch (e) {
      /* subscriber error: don't break */
    }
  }
}

export async function setLocale(loc) {
  if (!AVAILABLE_LOCALES.includes(loc)) {
    throw new Error(`i18n: unknown locale "${loc}"`);
  }
  await loadLocale(loc);
  currentLocale = loc;
  writeSavedLocale(loc);
  emitChange();
  return currentLocale;
}

export function onLocaleChange(fn) {
  subscribers.add(fn);
  try {
    fn(currentLocale);
  } catch (e) {
    /* immediate notify: best-effort */
  }
  return () => subscribers.delete(fn);
}

export async function init() {
  await loadLocale(DEFAULT_LOCALE);
  if (!detected) {
    const target = detectInitialLocale();
    if (target !== currentLocale) {
      await loadLocale(target);
      currentLocale = target;
    }
    detected = true;
  }
  return currentLocale;
}

// Pre-load the default locale so consumers (and tests) can call t()
// synchronously after importing this module. The detection round-trip is
// performed by init() in main.js; top-level await here only blocks until
// the default catalog is cached.
await loadLocale(DEFAULT_LOCALE);
