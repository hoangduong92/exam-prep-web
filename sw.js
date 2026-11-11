// Bản cuối của sw.js ở site cũ: xóa bản app cũ đã tải sẵn (cache "luyende-*"), tự gỡ mình, rồi tải lại các tab đang mở
// để chúng hiện màn "Site đã chuyển nhà". Không đụng bộ nhớ tiến độ (localStorage) và không đụng cache của repo khác.
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (event) {
  event.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.filter(function (k) { return k.indexOf("luyende-") === 0; }).map(function (k) { return caches.delete(k); }));
    await self.registration.unregister();
    var tabs = await self.clients.matchAll({ type: "window" });
    tabs.forEach(function (c) { try { c.navigate(c.url); } catch (e) {} });
  })());
});
