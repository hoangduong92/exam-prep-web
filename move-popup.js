// Màn [B]: cửa sổ nhỏ của site cũ mà site mới mở ra (/learning/move-in.html). Bắt tay rồi gửi tiến độ, gửi xong tự đóng.
// Chỉ gửi cho cửa sổ đã mở nó (window.opener), chỉ khi cửa sổ đó thuộc site mới trong danh sách data-allow,
// và chỉ gửi các khóa của app luyện đề (cùng địa chỉ github.io còn có repo khác).
(function () {
  "use strict";
  var M = window.MoveMerge;
  var ALLOW = (document.documentElement.getAttribute("data-allow") || "").split(" ").filter(Boolean);
  var $ = function (id) { return document.getElementById(id); };
  var opener = window.opener;
  function stop(title, msg) { $("title").textContent = title; $("msg").textContent = msg; }
  if (!opener) { stop("Cửa sổ này chỉ dùng khi site mới gọi", "Bạn có thể đóng nó."); return; }

  var sent = false, tries = 0;
  function ready() {
    if (sent || tries++ > 50) { if (!sent) stop("Không gửi được tiến độ", "Site mới không trả lời. Đóng cửa sổ này rồi bấm lại ở site mới."); return; }
    ALLOW.forEach(function (o) { try { opener.postMessage({ type: "ldcn-ready" }, o); } catch (e) {} });
    setTimeout(ready, 400);
  }
  window.addEventListener("message", function (e) {
    if (sent || ALLOW.indexOf(e.origin) < 0 || e.source !== opener) return;
    var d = e.data || {};
    if (d.type !== "ldcn-request" || typeof d.nonce !== "string" || !d.nonce) return;
    var data = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (M.isMoveKey(k)) data[k] = localStorage.getItem(k);
      }
    } catch (x) {}
    sent = true;
    opener.postMessage({ type: "ldcn-data", nonce: d.nonce, payload: { v: 1, from: "github", at: new Date().toISOString(), data: data } }, e.origin);
    stop("Đã gửi tiến độ", "Cửa sổ này sẽ tự đóng.");
    setTimeout(function () { window.close(); }, 300);
  });
  ready();
})();
