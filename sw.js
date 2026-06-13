// sw.js — NEØN SERPENT service worker.
// Cache-first for precached + same-origin GETs, with network write-through
// and an offline navigation fallback to index.html.

const CACHE_NAME = 'ns-cache-v5';

const PRECACHE_URLS = [
  './',
  'index.html',
  'manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(handleFetch(req));
});

async function handleFetch(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  if (cached) return cached;

  try {
    const res = await fetch(req);
    if (res && res.status === 200 && res.type === 'basic') {
      cache.put(req, res.clone());
    }
    return res;
  } catch (_err) {
    if (req.mode === 'navigate') {
      const fallback = await cache.match('index.html');
      if (fallback) return fallback;
    }
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}
