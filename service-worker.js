/**
 * Service Worker for Brian Eno's "2/1" Web Recreation
 * Provides offline support and caching
 */

const CACHE_NAME = 'eno-2-1-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/main.js',
  '/scripts/audio-engine.js',
  '/scripts/visualization.js',
  '/scripts/ui-controls.js',
  '/scripts/nosleep.min.js'
  // Add any other assets that should be cached
];

// Install event - cache assets and activate immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        // Skip waiting to ensure the new service worker activates immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim any clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - network first, then cache as fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // If we get a valid response from the network, clone it and update the cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return networkResponse;
      })
      .catch(() => {
        // If network fetch fails, try to serve from cache
        return caches.match(event.request);
      })
  );
});