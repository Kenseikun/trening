// Offline: zdjęcia z cache (nie zmieniają się), reszta najpierw z sieci (świeże rozpiski), a bez sieci z cache.
// Po dodaniu ćwiczeń podbij wersję, żeby nowe zdjęcia trafiły do cache od razu.
importScripts('exercises.js', 'logic.js');
const C = 'trening-v1';
const SHELL = ['./', 'index.html', 'exercises.js', 'logic.js', 'plans.json', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => e.waitUntil(caches.open(C)
  .then(c => c.addAll([...SHELL, ...new Set(Object.values(EXERCISES).flatMap(frames))]))
  .then(() => self.skipWaiting())));

self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k))))
  .then(() => self.clients.claim())));

const put = (req, res) => { if (res.ok) { const copy = res.clone(); caches.open(C).then(c => c.put(req, copy)); } return res; };

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || !r.url.startsWith(self.location.origin)) return;
  e.respondWith(r.url.includes('/img/')
    ? caches.match(r).then(hit => hit || fetch(r).then(res => put(r, res)))
    : fetch(r).then(res => put(r, res)).catch(() => caches.match(r, { ignoreSearch: true })));
});
