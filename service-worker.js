const CACHE_NAME = 'my-blog-cache-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/post.html',
  '/post2.html',
  '/post3.html',
  '/assets/main.css',
  '/assets/js/main.js'
];

// Install event: cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Activate event: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch event: cache-first strategy with dynamic caching for /assets/
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
      .catch(() => caches.match('/index.html')) // fallback to index.html if offline
  );
});
