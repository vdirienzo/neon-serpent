// src/core/sw-register.js
// Registers the NEØN SERPENT service worker.
// Safe to import in Node — every public function short-circuits when
// `navigator` or `navigator.serviceWorker` is unavailable.

const SW_URL = './sw.js';

let _registration = null;

function canRegister() {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

export function register() {
  if (!canRegister()) return Promise.resolve(null);
  return navigator.serviceWorker
    .register(SW_URL)
    .then((reg) => {
      _registration = reg;
      return reg;
    })
    .catch((err) => {
      console.warn('[sw-register] registration failed:', err);
      _registration = null;
      return null;
    });
}

export function unregister() {
  if (!canRegister()) return Promise.resolve(false);
  if (_registration) {
    return _registration
      .unregister()
      .then((ok) => {
        _registration = null;
        return ok;
      })
      .catch(() => false);
  }
  return navigator.serviceWorker
    .getRegistration()
    .then((reg) => (reg ? reg.unregister() : false))
    .catch(() => false);
}

if (canRegister()) {
  register();
}
