// Offline: najpierw sieć (świeże rozpiski i aplikacja), a bez sieci ostatnia wersja z cache.
const C = 'trening-v25';
const SHELL = ['./', 'index.html', 'exercises.js', 'logic.js', 'moves.js', 'manifest.webmanifest', 'icons/icon-192px.png', 'icons/icon-512px.png',
  'fonts/quicksand-latin.woff2', 'fonts/quicksand-latin-ext.woff2'];
// Sieć zawsze z pytaniem do serwera o aktualną wersję. Bez tego przeglądarka przez 10 minut oddaje pliki z własnej pamięci
// i po aktualizacji nowy index.html trafia na stary moves.js (karta ćwiczenia i trening się wtedy nie otwierają).
const FRESH = { cache: 'no-cache' };

self.addEventListener('install', e => e.waitUntil(caches.open(C)
  .then(c => c.addAll(SHELL.map(u => new Request(u, FRESH))))
  .then(() => self.skipWaiting())));

self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k))))
  .then(() => self.clients.claim())));

const put = (req, res) => { if (res.ok) { const copy = res.clone(); caches.open(C).then(c => c.put(req, copy)); } return res; };

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || !r.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(r, FRESH).then(res => put(r, res)).catch(() => caches.match(r, { ignoreSearch: true })));
});
