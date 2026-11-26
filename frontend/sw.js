const CACHE = 'pequenas-girafas-static-v4';
const ASSETS = ["/", "/app.css", "/app.mjs", "/manifest.webmanifest", "/privacy.html", "/storage/store.mjs", "/accessibility/speech.mjs", "/ai/adaptive-learning/engine.mjs", "/ai/semantic-expansion/graph.mjs", "/api/v1/catalog", "/api/v1/rules", "/assets/girafa.svg", "/assets/peixe.svg", "/assets/mar.svg", "/assets/agua.svg", "/assets/polvo.svg", "/assets/concha.svg", "/assets/praia.svg", "/assets/caranguejo.svg", "/assets/audio/agua.mp3", "/assets/audio/caranguejo.mp3", "/assets/audio/concha.mp3", "/assets/audio/letra-a.mp3", "/assets/audio/letra-b.mp3", "/assets/audio/letra-c.mp3", "/assets/audio/letra-d.mp3", "/assets/audio/letra-e.mp3", "/assets/audio/letra-f.mp3", "/assets/audio/letra-g.mp3", "/assets/audio/letra-h.mp3", "/assets/audio/letra-i.mp3", "/assets/audio/letra-j.mp3", "/assets/audio/letra-k.mp3", "/assets/audio/letra-l.mp3", "/assets/audio/letra-m.mp3", "/assets/audio/letra-n.mp3", "/assets/audio/letra-o.mp3", "/assets/audio/letra-p.mp3", "/assets/audio/letra-q.mp3", "/assets/audio/letra-r.mp3", "/assets/audio/letra-s.mp3", "/assets/audio/letra-t.mp3", "/assets/audio/letra-u.mp3", "/assets/audio/letra-v.mp3", "/assets/audio/letra-w.mp3", "/assets/audio/letra-x.mp3", "/assets/audio/letra-y.mp3", "/assets/audio/letra-z.mp3", "/assets/audio/mar.mp3", "/assets/audio/peixe.mp3", "/assets/audio/polvo.mp3", "/assets/audio/praia.mp3"];
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
