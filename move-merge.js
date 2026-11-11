// Gộp tiến độ từ site cũ (GitHub Pages) vào bộ nhớ trình duyệt của site mới.
// Thiết kế: docs/product/site-move.md, mục 7 bảng "Cách gộp từng khóa". Không gọi mạng, không ghi máy chủ.
// Dùng ở /learning/move-in.html (trình duyệt) và trong phép thử (node). Chỉ nhận các khóa có trong RULES;
// khóa lạ, khóa đúng tên mà dữ liệu sai dạng, khóa __proto__/constructor/prototype đều bị bỏ qua và đếm vào `skipped`.
(function (root) {
  "use strict";
  var MAX_BYTES = 5 * 1024 * 1024;
  var BAD_KEYS = { "__proto__": 1, "constructor": 1, "prototype": 1 };
  var NOTE_MARK = "Từ site cũ:";

  var has = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  var isObj = function (v) { return v !== null && typeof v === "object" && !Array.isArray(v); };
  var same = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
  var keys = function (o) { return isObj(o) ? Object.keys(o) : []; };

  // Bỏ các khóa nguy hiểm ở mọi tầng (JSON.parse tạo được khóa "__proto__" riêng; gán lại kiểu o[k] sẽ đổi prototype).
  function clean(v) {
    if (Array.isArray(v)) return v.map(clean);
    if (!isObj(v)) return v;
    var out = {};
    for (var k in v) if (has(v, k) && !BAD_KEYS[k]) out[k] = clean(v[k]);
    return out;
  }
  function parse(raw) {
    if (typeof raw !== "string") return undefined;
    try { return clean(JSON.parse(raw)); } catch (e) { return undefined; }
  }
  // Điền chỗ trống: giữ mọi giá trị của site mới, chỉ thêm khóa site mới chưa có (đệ quy với object).
  function fill(n, o) {
    if (!isObj(n) || !isObj(o)) return n === undefined ? o : n;
    var out = {};
    keys(n).forEach(function (k) { out[k] = n[k]; });
    keys(o).forEach(function (k) { out[k] = has(n, k) ? fill(n[k], o[k]) : o[k]; });
    return out;
  }
  function addedKeys(n, o) { return keys(o).filter(function (k) { return !isObj(n) || !has(n, k); }).length; }
  function unionBy(n, o, idOf) {
    var out = (n || []).slice(), seen = {};
    out.forEach(function (x) { seen[idOf(x)] = 1; });
    var added = 0;
    (o || []).forEach(function (x) { var id = idOf(x); if (!seen[id]) { seen[id] = 1; out.push(x); added++; } });
    return { value: out, added: added };
  }
  var stamp = function (v) { return typeof v === "number" ? v : (Date.parse(v) || 0); };
  var liveName = function (l) { return (l && (l.title || l.label)) || "bài đang làm dở"; };

  // Bài đang dở: mỗi app chỉ giữ một. Site mới chưa có thì lấy bài cũ; cả hai có thì giữ bài bắt đầu sau (user chốt 2026-11-10).
  function pickLive(n, o) {
    if (!isObj(o)) return { value: n == null ? null : n };
    if (!isObj(n)) return { value: o, took: liveName(o) };
    if (same(n, o) || (n.id && n.id === o.id)) return { value: n };
    if (stamp(o.startedAt) > stamp(n.startedAt)) return { value: o, took: liveName(o), dropped: liveName(n) };
    return { value: n, dropped: liveName(o) };
  }

  // ── từng loại dữ liệu: (cũ, mới) → { value, counts } hoặc null nếu sai dạng ──
  function aws(o, n) {
    var okShape = function (s) { return isObj(s) && (s.attempts === undefined || Array.isArray(s.attempts)) && (s.srs === undefined || isObj(s.srs)) && (s.notes === undefined || isObj(s.notes)); };
    if (!okShape(o) || (n !== undefined && !okShape(n))) return null;
    n = n || {};
    var out = fill(n, o), c = {};
    var att = unionBy(n.attempts, o.attempts, function (a) { return isObj(a) && a.id ? a.id : JSON.stringify(a); });
    out.attempts = att.value; c.attempts = att.added;
    var srs = {}, srsAdded = 0;
    keys(n.srs).forEach(function (k) { srs[k] = n.srs[k]; });
    keys(o.srs).forEach(function (k) {
      var a = o.srs[k], b = srs[k];
      if (!isObj(b)) { srs[k] = a; srsAdded++; }
      else if (isObj(a) && (a.seen || 0) > (b.seen || 0)) srs[k] = a;
    });
    out.srs = srs; c.questions = srsAdded;
    var notes = {}, notesAdded = 0;
    keys(n.notes).forEach(function (k) { notes[k] = n.notes[k]; });
    keys(o.notes).forEach(function (k) {
      var a = o.notes[k], b = notes[k];
      if (typeof a !== "string" || !a.trim()) return;
      if (typeof b !== "string" || !b.trim()) { notes[k] = a; notesAdded++; }
      else if (b.indexOf(a) < 0) { notes[k] = b + "\n\n" + NOTE_MARK + "\n" + a; notesAdded++; }
    });
    out.notes = notes; c.notes = notesAdded;
    var lv = pickLive(n.live, o.live);
    out.live = lv.value === undefined ? null : lv.value;
    if (lv.took) c.live = lv.took;
    if (lv.dropped && lv.took) c.liveDropped = lv.dropped;
    if (lv.dropped && !lv.took) c.liveKeptNew = lv.dropped;
    return { value: out, counts: c };
  }
  function consoleV2(o, n) {
    var okShape = function (s) { return isObj(s) && (s.hist === undefined || Array.isArray(s.hist)); };
    if (!okShape(o) || (n !== undefined && !okShape(n))) return null;
    n = n || {};
    var out = fill(n, o), c = {};
    var h = unionBy(n.hist, o.hist, function (x) { return isObj(x) ? (x.t + "|" + (x.label || "")) : JSON.stringify(x); });
    out.hist = h.value; c.attempts = h.added;
    var lv = pickLive(n.live, o.live);
    out.live = lv.value === undefined ? null : lv.value;
    if (lv.took) c.live = lv.took;
    if (lv.dropped && lv.took) c.liveDropped = lv.dropped;
    if (lv.dropped && !lv.took) c.liveKeptNew = lv.dropped;
    return { value: out, counts: c };
  }
  function perItem(name, better) {
    return function (o, n) {
      if (!isObj(o) || (n !== undefined && !isObj(n))) return null;
      n = n || {};
      var out = {}, added = 0;
      keys(n).forEach(function (k) { out[k] = n[k]; });
      keys(o).forEach(function (k) {
        if (!has(out, k)) { out[k] = o[k]; added++; }
        else if (better && better(o[k], out[k])) out[k] = o[k];
      });
      var c = {}; c[name] = added;
      return { value: out, counts: c };
    };
  }
  var box = function (v) { return typeof v === "number" ? 3 : (isObj(v) && typeof v.b === "number" ? v.b : -1); };
  var HANDS = ["todo", "running", "done"];
  function deepFill(name) {
    return function (o, n) {
      if (!isObj(o) || (n !== undefined && !isObj(n))) return null;
      var c = {}; c[name] = addedKeys(n, o);
      return { value: n === undefined ? o : fill(n, o), counts: c };
    };
  }
  function list(name, pick) {
    return function (o, n) {
      var lo = pick(o), ln = n === undefined ? [] : pick(n);
      if (!Array.isArray(lo) || !Array.isArray(ln)) return null;
      var u = unionBy(ln, lo, function (x) { return JSON.stringify(x); });
      var c = {}; c[name] = u.added;
      var value = Array.isArray(o) ? u.value : fill(n === undefined ? {} : n, o);
      if (!Array.isArray(o)) value.reports = u.value;
      return { value: value, counts: c };
    };
  }
  function pmp(o, n) {
    var okShape = function (s) { return isObj(s) && isObj(s.state); };
    if (!okShape(o) || (n !== undefined && !okShape(n))) return null;
    var so = o.state, sn = n ? n.state : {};
    var st = fill(sn, so), answers = {}, revealed = {}, added = 0;
    keys(sn.answers).forEach(function (k) { answers[k] = sn.answers[k]; });
    keys(sn.revealed).forEach(function (k) { revealed[k] = sn.revealed[k]; });
    var ids = {};
    keys(so.answers).concat(keys(so.revealed)).forEach(function (k) { ids[k] = 1; });
    Object.keys(ids).forEach(function (k) {
      var newDone = isObj(sn.revealed) && has(sn.revealed, k), oldDone = isObj(so.revealed) && has(so.revealed, k);
      var newHas = newDone || (isObj(sn.answers) && has(sn.answers, k));
      // câu trả lời và "đã chấm" đi cùng nhau từ một bên, để không mở khóa câu đã chấm (pmp/src/store.ts pick)
      if (newDone || (newHas && !oldDone)) return;
      if (isObj(so.answers) && has(so.answers, k)) answers[k] = so.answers[k]; else delete answers[k];
      if (oldDone) revealed[k] = so.revealed[k]; else delete revealed[k];
      if (!newHas) added++;
    });
    st.answers = answers; st.revealed = revealed;
    return { value: { state: st, version: n && n.version !== undefined ? n.version : o.version }, counts: { questions: added } };
  }

  // Khóa → [nhãn app, cách gộp, dạng]. raw: giá trị là chuỗi thường, không phải JSON (vd site-theme = "dark").
  var AWS_KEY = /^[a-z]{2,4}(-c0[0-9])?\.v1$/, CONSOLE_KEY = /^([a-z]{2,6})-console-v2$/, THEME_KEY = /^[a-z]{2,6}-theme$/;
  var FIXED = {
    "learn-answers-v1": ["Trang học", perItem("questions")],
    "learn-cards-v1": ["Trang học", perItem("cards", function (a, b) { return box(a) > box(b); })],
    "learn-prep-v1": ["Trang học", deepFill("items")],
    "learn-archlab-v1": ["Trang học", deepFill("items")],
    "learn-handson-v1": ["Trang học", perItem("labs", function (a, b) { return HANDS.indexOf(a) > HANDS.indexOf(b); })],
    "learn-review-v1": ["Trang học", list("reports", function (v) { return isObj(v) ? (v.reports === undefined ? [] : v.reports) : null; })],
    "learn-pron-v1": ["Trang học", list("items", function (v) { return v; })],
    "learn-console-v1": ["Cài đặt", deepFill("settings")],
    "pmp-console-v1": ["PMP", pmp],
    "site-theme": ["Cài đặt", "raw"],
    "pmp-flashcard-mode": ["Cài đặt", "raw"],
  };
  function ruleFor(key) {
    if (typeof key !== "string" || BAD_KEYS[key]) return null;
    if (has(FIXED, key)) return FIXED[key];
    if (AWS_KEY.test(key)) return [key.replace(/\.v1$/, "").toUpperCase(), aws];
    var m = CONSOLE_KEY.exec(key);
    if (m) return [m[1].toUpperCase(), consoleV2];
    if (THEME_KEY.test(key)) return ["Cài đặt", "raw"];
    return null;
  }
  var isMoveKey = function (k) { return !!ruleFor(k); };

  // oldMap: { khóa: chuỗi } từ site cũ; current: { khóa: chuỗi | null } của site mới.
  // Trả về { writes: { khóa: chuỗi }, apps: { nhãn: { ... } }, skipped, unchanged }.
  function mergeAll(oldMap, current) {
    var res = { writes: {}, apps: {}, skipped: 0, unchanged: 0 };
    if (!isObj(oldMap)) { res.skipped = 1; return res; }
    var total = 0;
    for (var k in oldMap) if (has(oldMap, k)) total += (typeof oldMap[k] === "string" ? oldMap[k].length : 0) + k.length;
    if (total > MAX_BYTES) { res.skipped = Object.keys(oldMap).length; res.tooLarge = true; return res; }
    Object.keys(oldMap).forEach(function (key) {
      var rule = ruleFor(key), raw = oldMap[key];
      if (!rule || typeof raw !== "string") { res.skipped++; return; }
      var cur = current && typeof current[key] === "string" ? current[key] : null;
      var label = rule[0], out;
      if (rule[1] === "raw") {
        if (cur !== null || raw.length > 200) { if (raw.length > 200) res.skipped++; else res.unchanged++; return; }
        res.writes[key] = raw; (res.apps[label] = res.apps[label] || {}).settings = (res.apps[label].settings || 0) + 1;
        return;
      }
      var o = parse(raw), n = cur === null ? undefined : parse(cur);
      if (o === undefined || (cur !== null && n === undefined)) { res.skipped++; return; }
      out = rule[1](o, n);
      if (!out) { res.skipped++; return; }
      var text = JSON.stringify(out.value);
      if (text === cur) { res.unchanged++; return; }
      res.writes[key] = text;
      var a = res.apps[label] = res.apps[label] || {};
      Object.keys(out.counts).forEach(function (c) {
        var v = out.counts[c];
        if (typeof v === "number") a[c] = (a[c] || 0) + v;
        else (a[c] = a[c] || []).push(v);
      });
    });
    return res;
  }

  // ── mã tiến độ (đường dự phòng): "LDCN1." + base64(deflate-raw(JSON)), hoặc "LDCN0." + base64(JSON) khi trình duyệt không nén được ──
  function b64(bytes) { var s = ""; for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(t) { var s = atob(t), out = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; }
  function pipe(bytes, stream) { return new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer().then(function (b) { return new Uint8Array(b); }); }
  function encode(payload) {
    var bytes = new TextEncoder().encode(JSON.stringify(payload));
    if (typeof CompressionStream === "undefined") return Promise.resolve("LDCN0." + b64(bytes));
    return pipe(bytes, new CompressionStream("deflate-raw")).then(function (z) { return "LDCN1." + b64(z); });
  }
  function decode(code) {
    return Promise.resolve().then(function () {
      var t = String(code || "").replace(/\s+/g, "");
      var m = /^LDCN([01])\.([A-Za-z0-9+/=]+)$/.exec(t);
      if (!m) throw new Error("bad_code");
      var bytes = unb64(m[2]);
      if (bytes.length > MAX_BYTES) throw new Error("too_large");
      if (m[1] === "0") return bytes;
      if (typeof DecompressionStream === "undefined") throw new Error("no_decompress");
      return pipe(bytes, new DecompressionStream("deflate-raw"));
    }).then(function (bytes) {
      if (bytes.length > MAX_BYTES) throw new Error("too_large");
      var p = clean(JSON.parse(new TextDecoder().decode(bytes)));
      if (!isObj(p) || p.v !== 1 || !isObj(p.data)) throw new Error("bad_code");
      return p;
    });
  }

  var api = { mergeAll: mergeAll, isMoveKey: isMoveKey, ruleFor: ruleFor, encode: encode, decode: decode, clean: clean, MAX_BYTES: MAX_BYTES, NOTE_MARK: NOTE_MARK };
  root.MoveMerge = api;

})(globalThis);
