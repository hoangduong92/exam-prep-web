// Tự sinh bởi web/build-site.mjs — đừng sửa tay.
const CACHE = 'luyende-202609151250';
const ASSETS = ["index.html","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png","cca.html","ans-c01.html"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(a => new Request(a, {cache:'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Cache-first cho GET cùng origin: mở tức thì, chạy khi mất sóng.
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.match(r, {ignoreSearch:true}).then(hit => hit || fetch(r).then(res => {
    if (res.ok && res.type === 'basic') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
    return res;
  }).catch(() => caches.match('index.html'))));
});
