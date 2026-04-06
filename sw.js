const CACHE_NAME = 'chaos-gacha-v3'; // Changed to v2 to force an update
const ASSETS_TO_CACHE = [
  './',             // This is the crucial fix for GitHub Pages
  './index.html',
  './app.js',
  './data.json',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => console.error('Cache addAll failed:', err))
  );
});

self.addEventListener('activate', event => {
  // Delete old caches when we update the version number
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached version if found, otherwise fetch from network
      return response || fetch(event.request);
    }).catch(() => {
      // If BOTH fail (offline and not in cache), fallback to index.html
      return caches.match('./index.html');
    })
  );
});