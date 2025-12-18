
const CACHE_NAME = 'cookies-bakery-v2026-v2';

// الأصول الأساسية التي يتم تخزينها عند التثبيت
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap',
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/lucide-react@^0.555.0'
];

// الدومينات الخارجية التي يتم تخزين استجاباتها تلقائياً
const EXTERNAL_DOMAINS = [
  'cdn.tailwindcss.com',
  'aistudiocdn.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'esm.sh',
  'cdn.jsdelivr.net'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching assets...');
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
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // معالجة طلبات GET فقط
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isExternal = EXTERNAL_DOMAINS.some(domain => url.hostname.includes(domain));
  const isLocal = url.origin === self.location.origin;

  if (isExternal || isLocal) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // استراتيجية: Cache First, falling back to Network and updating Cache
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // إذا فشل الشبكة، نعود للكاش المخزن
          return cachedResponse;
        });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
