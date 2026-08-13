/* Xplore Wi-Fi Sticker Generator — offline service worker.
   Bump CACHE_VERSION whenever you change index.html or the libs,
   so techs pick up the new version on their next online visit. */
const CACHE_VERSION = 'v1';
const CACHE_NAME = `wifi-sticker-${CACHE_VERSION}`;

// Everything the app needs to run, relative to wherever the site is hosted
// (works at github.io/repo-name/ subpaths too).
const PRECACHE = [
  './',
  './index.html',
  './lib/qrcode.min.js',
  './lib/html2canvas.min.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  // Remove caches from older versions
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Cache-first for everything: serve from cache, fall back to network,
  // and stash anything new we fetch (this picks up the Google Fonts files
  // on the first online visit so they work offline afterwards).
  event.respondWith(
    caches.match(req, { ignoreSearch: false }).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        // Cache successful same-origin and font/CDN responses
        if (resp && (resp.ok || resp.type === 'opaque')) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return resp;
      }).catch(() => {
        // Offline and not cached: for page navigations, fall back to the app shell
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
