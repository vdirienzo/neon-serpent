// src/ui/CalibrationStore.js
// Singleton store for runtime-tunable visual variables.
// Persists to localStorage with versioned schema; subscribers notified on change.

const STORAGE_KEY = 'ns:calib';
const CURRENT_VERSION = 2;

export const DEFAULTS = Object.freeze({
  // Iluminación 3D
  ambient: 0.68,
  keyLight: 3.11,
  fillLight: 1.98,
  topLight: 0.77,
  headLight: 1.54,
  // Tone mapping
  exposure: 0.65,
  // Niebla
  fogDensity: 0.01,
  fogR: 4,
  fogG: 6,
  fogB: 14,
  // Overlays CSS
  crtOpacity: 0.5,
  crtLineAlpha: 0.5,
  crtLineR: 0,
  crtLineG: 30,
  crtLineB: 60,
  vignetteAlpha: 1.0,
  vignetteR: 0,
  vignetteG: 0,
  vignetteB: 5,
  // Render
  pixelRatio: 1.6,
  // Entidades
  snakeEmissive: 4.5,
  waterOpacity: 0.78,
});

let current = { ...DEFAULTS };
const subscribers = new Set();
let saveTimer = null;

function getStorage() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch (e) {
    /* SSR or restricted */
  }
  return null;
}

export function load() {
  const s = getStorage();
  if (s) {
    try {
      const raw = s.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.version === CURRENT_VERSION && saved.values) {
          current = { ...DEFAULTS, ...saved.values };
        } else {
          // Old version or unknown schema -> start from new defaults
          current = { ...DEFAULTS };
        }
      } else {
        current = { ...DEFAULTS };
      }
    } catch (e) {
      current = { ...DEFAULTS };
    }
  } else {
    current = { ...DEFAULTS };
  }
  return getAll();
}

export function save() {
  const s = getStorage();
  if (!s) return;
  try {
    s.setItem(STORAGE_KEY, JSON.stringify({ version: CURRENT_VERSION, values: current }));
  } catch (e) {
    /* quota / disabled */
  }
}

function debouncedSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    save();
    saveTimer = null;
  }, 300);
}

export function flushSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  save();
}

export function get(key) {
  return current[key];
}

export function getAll() {
  return { ...current };
}

export function set(key, value) {
  if (!(key in DEFAULTS)) return;
  if (current[key] === value) return;
  current[key] = value;
  debouncedSave();
  notify();
}

export function reset() {
  current = { ...DEFAULTS };
  debouncedSave();
  notify();
}

export function onChange(cb) {
  subscribers.add(cb);
  try {
    cb(current);
  } catch (e) {
    /* subscriber error on initial call: don't break */
  }
  return () => subscribers.delete(cb);
}

function notify() {
  for (const cb of subscribers) {
    try {
      cb(current);
    } catch (e) {
      /* subscriber error: don't break the chain */
    }
  }
}
