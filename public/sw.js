const CACHE_NAME = 'ios-prep-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/review',
  '/progress',
  '/settings',
  '/leetcode',
  '/month-1',
  '/month-2',
  '/month-3',
];

// Install - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Skip API requests (if any in future)
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response for cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline fallback for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          // Return empty response for assets to avoid broken display
          const url = new URL(event.request.url);
          if (url.pathname.endsWith('.css')) {
            return new Response('', { headers: { 'Content-Type': 'text/css' } });
          }
          if (url.pathname.endsWith('.js')) {
            return new Response('', { headers: { 'Content-Type': 'application/javascript' } });
          }
          return new Response('', { status: 503 });
        });
      })
  );
});
