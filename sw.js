const CACHE_REVISION = '2026-08-03-prod-2.2.1';
const CACHE_NAME = `planner-static-${CACHE_REVISION}`;

const APP_SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/defaults.js',
  './js/icons.js',
  './js/habit-model.js',
  './js/app.js',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon-32.png'
];

function isHtmlResponse(response) {
  if (!response || !response.ok) return false;
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('text/html');
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(event.request, { cache: 'no-store' });
        if (!isHtmlResponse(networkResponse)) {
          throw new Error('Navigation response was not HTML');
        }

        const cache = await caches.open(CACHE_NAME);
        await cache.put('./index.html', networkResponse.clone());
        return networkResponse;
      } catch (error) {
        const cachedIndex = await caches.match('./index.html');
        if (cachedIndex && isHtmlResponse(cachedIndex)) return cachedIndex;
        return Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cachedResponse = await caches.match(event.request);

    try {
      const networkResponse = await fetch(event.request);
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      return cachedResponse || Response.error();
    }
  })());
});
