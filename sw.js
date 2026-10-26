const CACHE = 'five-letters-v4';
const FILES = ['./', './index.html', './styles.css', './app.js', './engine.js', './stats.js', './navigation.js', './thread.js', './thread-engine.js', './trails.js', './trails-engine.js', './trails-puzzles.js', './trails-preloaded.js', './trails-generator.js', './trails-worker.js', './midi.js', './midi-engine.js', './midi-puzzles.js', './WORDNET-LICENSE.txt', './trails-dictionary.txt', './dictionary.json', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './DICTIONARY-LICENSE.txt'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(path => new Request(path, { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('five-letters-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    return fetch(event.request);
  }));
});
