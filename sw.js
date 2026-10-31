// Tự sinh bởi web/build-site.mjs — đừng sửa tay.
const CACHE = 'luyende-a4eaa87ccb';
const ASSETS = ["index.html","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png","learn.html","aws/index.html","pmp/index.html","ccao.html","ccdv.html","ccarf.html","ccarp.html","tfa.html","aws/aip-c01.html","aws/ans-c01.html","aws/dop-c02.html","aws/sap-c02.html","aws/scs-c03.html","pmp/assets/Dashboard-B3uxFytB.js","pmp/assets/eco2026-DXO_3Nj9.js","pmp/assets/Flashcards-BchixH-V.js","pmp/assets/index-CnkZibyj.js","pmp/assets/index-Cw6iygM9.js","pmp/assets/index-DfSutLXk.css","pmp/assets/MockPlan-ByzFMx6k.js","pmp/assets/original-bank-DH1-2X8W.js","pmp/assets/Practice-CWa-Ou5W.js","pmp/assets/react-vendor-CGSBWMWS.js","pmp/assets/reference-bank-001-100-BGW38Zik.js","pmp/assets/reference-bank-101-200-C9-KhFit.js","pmp/assets/Review-C2uB-A5Q.js","pmp/assets/sentence-analysis-CR94O_Pb.js","pmp/assets/store-D04zCsl7.js","pmp/assets/Task-BJvPtfWz.js","pmp/assets/Terms-BMXU1ZGg.js"];
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
