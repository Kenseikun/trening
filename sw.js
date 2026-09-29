// Offline: najpierw sieć (świeże rozpiski i aplikacja), a bez sieci ostatnia wersja z cache.
const C = 'trening-v5';
const SHELL = ['./', 'index.html', 'exercises.js', 'logic.js', 'moves.js', 'plans.json', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'fonts/quicksand-latin.woff2', 'fonts/quicksand-latin-ext.woff2'];

self.addEventListener('install', e => e.waitUntil(caches.open(C)
  .then(c => c.addAll(SHELL))
  .then(() => self.skipWaiting())));

self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k))))
  .then(() => self.clients.claim())));

const put = (req, res) => { if (res.ok) { const copy = res.clone(); caches.open(C).then(c => c.put(req, copy)); } return res; };

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || !r.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(r).then(res => put(r, res)).catch(() => caches.match(r, { ignoreSearch: true })));
});
