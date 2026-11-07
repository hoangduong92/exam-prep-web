// Tự sinh bởi web/build-site.mjs — đừng sửa tay.
const CACHE = 'luyende-022ac57d00';
const ASSETS = ["index.html","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png","learn.html","aws/index.html","pmp/index.html","ccao.html","ccdv.html","ccarf.html","ccarp.html","tfa.html","aws/aip-c01.html","aws/ans-c01.html","aws/dea.html","aws/dop-c02.html","aws/sap-c02.html","aws/scs-c03.html","pmp/assets/Dashboard-B3pt5v6H.js","pmp/assets/eco2026-pdr6OTVi.js","pmp/assets/Flashcards-D4z7PfLt.js","pmp/assets/Formats-CQ7ksQ1X.js","pmp/assets/index-CSMvjKgo.css","pmp/assets/index-Cw6iygM9.js","pmp/assets/index-RMCt7Z8K.js","pmp/assets/MockPlan-9JnAXFdz.js","pmp/assets/original-bank-ClKuypH0.js","pmp/assets/Practice-DVC1lpfV.js","pmp/assets/react-vendor-CGSBWMWS.js","pmp/assets/reference-bank-001-100-BGW38Zik.js","pmp/assets/reference-bank-101-200-C9-KhFit.js","pmp/assets/Review-3Sf4bsp0.js","pmp/assets/scoring-ONVLN4pl.js","pmp/assets/sentence-analysis-yVBuO3rd.js","pmp/assets/store-Dy1hM2Fs.js","pmp/assets/Task-Bc4RQP0X.js"];
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
