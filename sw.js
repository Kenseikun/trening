// Offline: najpierw sieć (świeże rozpiski i aplikacja), a bez sieci ostatnia wersja z cache.
const C = 'trening-v91';
const SHELL = ['./', 'index.html', 'strings.js', 'exercises.js', 'logic.js', 'moves.js', 'manifest.webmanifest', 'icons/icon-192px.png', 'icons/icon-512px.png', 'icons/badge-96.png',
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

// Powiadomienia z serwisu (dzień treningowy, raport dnia): treść { t: tytuł, b: treść, u: adres }. Kliknięcie otwiera aplikację.
self.addEventListener('push', e => {
  const m = e.data ? e.data.json() : {};
  e.waitUntil(Promise.all([self.registration.showNotification(m.t || 'trening', { body: m.b || '', icon: 'icons/icon-192px.png', badge: 'icons/badge-96.png', data: m.u || './', ...(m.g && { tag: m.g, renotify: true }) }),
    clients.matchAll({ type: 'window' }).then(l => l.forEach(c => c.postMessage('push')))])); // otwarta aplikacja od razu pobiera nowości
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data, self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => l.length ? l[0].navigate(url).then(w => w?.focus()) : clients.openWindow(url)));
});
