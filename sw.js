
const CACHE_NAME = 'cookies-bakery-v2026-offline-v1';

// Assets to cache immediately
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap',
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/lucide-react@^0.555.0'
];

// Domains that host our external libraries
const EXTERNAL_DOMAINS = [
  'cdn.tailwindcss.com',
  'aistudiocdn.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'esm.sh'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching core assets');
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isExternalAsset = EXTERNAL_DOMAINS.some(domain => url.hostname.includes(domain));
  const isLocalAsset = url.origin === self.location.origin;

  if (isExternalAsset || isLocalAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Stale-While-Revalidate Strategy
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const cacheClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, cacheClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
