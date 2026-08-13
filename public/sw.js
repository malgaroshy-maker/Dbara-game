// Service Worker for Dbara Trivia Game (دبارة)
// Offline capability, asset caching, and instant startup.
//
// Strategy split:
//   - navigations  -> network-first, cache fallback. Cache-first here meant a
//                     deployed update was always one reload behind.
//   - static assets -> stale-while-revalidate. Hashed build assets never change
//                     under a given URL, so serving from cache is safe and fast.

// Build-stamped so every deploy lands in a fresh cache and `activate` evicts
// the previous one instead of leaving stale chunks behind.
const CACHE_VERSION = self.__DBARA_BUILD__ || 'dev';
const CACHE_NAME = `dbara-cache-${CACHE_VERSION}`;

// Replaced at build time with the hashed JS/CSS the build actually emitted.
// Without it the very first offline visit fails: those assets are requested
// before this worker takes control, so they never make it into the cache.
const BUILD_ASSETS = self.__DBARA_PRECACHE__ || [];

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icons.svg',
  './assets/libya-map.png',
  ...BUILD_ASSETS,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // Individually so one missing file cannot fail the whole install.
      .then((cache) =>
        Promise.all(
          STATIC_ASSETS.map((asset) => cache.add(asset).catch(() => undefined))
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

const putInCache = async (request, response) => {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
};

// `ignoreVary` is essential, not a nicety. Precached entries are fetched by the
// worker without an Origin header, while the page requests its module scripts
// with `crossorigin` (so, with one). Any host that answers `Vary: Origin` —
// Vite's own preview server does — would otherwise miss on every asset and the
// app would fail to boot offline despite everything being cached.
const matchCache = (request) => caches.match(request, { ignoreVary: true });

// Network-first: always try for a fresh document, fall back to the last good
// copy (or the cached shell) when offline.
const handleNavigation = async (request) => {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      putInCache(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return (
      (await matchCache(request)) ||
      (await matchCache('./index.html')) ||
      (await matchCache('./')) ||
      Response.error()
    );
  }
};

// Stale-while-revalidate: serve the cached asset immediately, refresh in the
// background for next time.
const handleAsset = async (request) => {
  const cached = await matchCache(request);

  const networkFetch = fetch(request)
    .then((networkResponse) => {
      // `basic` and `cors` only: opaque cross-origin responses have an unknown
      // status and would poison the cache with possible errors.
      if (
        networkResponse &&
        networkResponse.ok &&
        (networkResponse.type === 'basic' || networkResponse.type === 'cors')
      ) {
        putInCache(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => undefined);

  return cached || (await networkFetch) || Response.error();
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;

  // Never cache the dev server's module graph or HMR endpoints — a stale
  // /@vite/ or /src/ response makes local changes appear not to apply.
  if (url.pathname.startsWith('/@') || url.pathname.startsWith('/node_modules/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  event.respondWith(handleAsset(request));
});
