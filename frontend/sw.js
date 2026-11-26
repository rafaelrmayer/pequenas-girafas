const CACHE = 'pequenas-girafas-static-v2';
const ASSETS = ["/", "/app.css", "/app.mjs", "/manifest.webmanifest", "/privacy.html", "/storage/store.mjs", "/accessibility/speech.mjs", "/ai/adaptive-learning/engine.mjs", "/ai/semantic-expansion/graph.mjs", "/api/v1/catalog", "/api/v1/rules", "/assets/girafa.svg", "/assets/peixe.svg", "/assets/mar.svg", "/assets/agua.svg", "/assets/polvo.svg", "/assets/concha.svg", "/assets/praia.svg", "/assets/caranguejo.svg"];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('pequenas-girafas-static-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.search || !ASSETS.includes(url.pathname)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const saved = await cache.match(url.pathname);
    if (saved) return saved;
    return fetch(event.request);
  }));
});
