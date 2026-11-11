// Màn [A] "Site đã chuyển nhà" ở mọi trang site cũ (docs/product/site-move-ui.md).
// Đọc tiến độ trong bộ nhớ trình duyệt của site cũ (chỉ khóa của app luyện đề), đếm theo app,
// dẫn sang đúng trang tương ứng ở site mới (giữ phần #/...), hoặc chép mã tiến độ cho icon iPhone.
(function () {
  "use strict";
  var M = window.MoveMerge;
  var NEW = document.documentElement.getAttribute("data-new-origin") || "https://learning.hoangduong92.workers.dev";
  var BASE = "/exam-prep-web/";
  var $ = function (id) { return document.getElementById(id); };

  // Trang cũ → trang mới cùng tên; trang lạ (404) → trang chủ site mới.
  var KNOWN = /^(index\.html|learn\.html|(ccao|ccdv|ccarf|ccarp|tfa)\.html|aws\/(index|aip-c01|ans-c01|dea|dop-c02|sap-c02|scs-c03)\.html|pmp\/(index\.html)?|aws\/)$/;
  var rest = location.pathname.indexOf(BASE) === 0 ? location.pathname.slice(BASE.length) : "";
  if (rest === "" || rest === "index.html") rest = "";
  else if (!KNOWN.test(rest)) rest = "";
  var hash = /^#\/[A-Za-z0-9_\/.?=&%-]{0,300}$/.test(location.hash) ? location.hash : "";
  var target = "/learning/" + rest + hash;

  var NAMES = { "": "Trang chủ", "learn.html": "Trang học", "pmp/": "PMP", "pmp/index.html": "PMP", "aws/": "Chứng chỉ AWS và Data", "aws/index.html": "Chứng chỉ AWS và Data", "aws/dea.html": "Databricks DEA" };
  function pageName(r) {
    if (NAMES[r] !== undefined) return NAMES[r];
    var m = /^aws\/([a-z]{3}-c0\d)\.html$/.exec(r);
    if (m) return "AWS " + m[1].toUpperCase();
    m = /^([a-z]+)\.html$/.exec(r);
    return m ? m[1].toUpperCase() : "";
  }
  function hashName(h) {
    var m = /^#\/prep\/d(\d+)\/(\d+)/.exec(h);
    if (m) return "bộ đề " + m[1] + ", câu " + m[2];
    m = /^#\/prep\/[a-z0-9-]+\/(\d+)/.exec(h);
    if (m) return "bài đang dở, câu " + m[1];
    return "";
  }
  var name = pageName(rest);
  if (name && (rest || hash)) {
    var hn = hashName(hash);
    $("this-page").textContent = "Trang bạn vừa mở ở site mới: " + name + (hn ? " · " + hn : "");
    $("this-page").hidden = false;
  }

  // ── tiến độ trong trình duyệt này ──
  var data = {};
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (M.isMoveKey(k)) data[k] = localStorage.getItem(k);
    }
  } catch (e) {}
  var counts = M.mergeAll(data, {});
  var UNIT = { questions: "câu", attempts: "lượt làm bài", cards: "thẻ ôn", notes: "ghi chú", labs: "bài thực hành", reports: "báo cáo điểm", items: "mục" };
  var rows = [];
  Object.keys(counts.apps).forEach(function (app) {
    if (app === "Cài đặt") return;
    var c = counts.apps[app], parts = [];
    Object.keys(UNIT).forEach(function (u) { if (c[u] > 0) parts.push(c[u] + " " + UNIT[u]); });
    if (c.live && c.live.length) parts.push(c.live.length + " bài đang dở");
    if (parts.length) rows.push([app, parts.join(" · ")]);
  });

  var plain = NEW + target;
  if (!rows.length) {
    $("open-new").href = plain;
    $("none").hidden = false;
    return;
  }
  rows.forEach(function (r) {
    var li = document.createElement("li"), b = document.createElement("strong"), s = document.createElement("span");
    b.textContent = r[0]; s.textContent = r[1]; li.appendChild(b); li.appendChild(s); $("counts").appendChild(li);
  });
  $("carry").href = NEW + "/learning/move-in.html?back=" + encodeURIComponent(target);
  $("open-plain").href = plain;
  $("has").hidden = false;

  // ── mã tiến độ cho icon iPhone ──
  function show(text, ok) { var m = $("copy-msg"); m.textContent = text; m.className = ok ? "ok" : "err"; m.hidden = false; }
  function fallbackCopy(t) {
    var box = $("code-box"); box.value = t; box.hidden = false; box.focus(); box.select();
    var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
    return ok;
  }
  $("copy").addEventListener("click", function () {
    M.encode({ v: 1, from: "github", at: new Date().toISOString(), data: data }).then(function (code) {
      var kb = Math.max(1, Math.round(code.length / 1024)) + " KB";
      var done = function () { show("Đã chép mã (" + kb + "). Dán vào ô Mã tiến độ ở màn Nhận tiến độ của site mới.", true); };
      var manual = function () {
        if (fallbackCopy(code)) done();
        else show("Trình duyệt không cho chép tự động. Mã đã được chọn sẵn trong ô dưới: giữ ngón tay lên ô rồi chọn Sao chép.", false);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, manual);
      else manual();
    }, function () { show("Chưa tạo được mã. Tải lại trang rồi thử lại.", false); });
  });
})();
