// ================================================================
// FILE: kc/qt_kho_tieng.js
// CHỨC NĂNG: Mục "🎵 Kho tiếng" của trang Quản trị chung (KC_09B1). Người lớn tải file âm thanh lên cho cả app dùng:
//   - ⬆️ Tải lên: chọn file .mp3 / .ogg / .wav / .m4a, chọn loại (🎵 nhạc nền tối đa 2,5 MB, 🔔 tiếng ngắn tối đa 150 KB),
//     đặt tên, ghi nguồn + giấy phép (CC0). Trang kiểm cỡ + thử giải mã (file hỏng / không phải âm thanh bị chặn), băm
//     SHA-256 (cùng một file tải 2 lần chỉ giữ 1 bản), xin vé của máy chủ rồi mới tải lên Supabase Storage (bucket
//     riêng "kc-am-thanh"); máy chủ đọc cỡ thật của file và kiểm lại trước khi ghi vào kho.
//   - Danh sách: ▶ nghe, mã kho_<id>, cỡ, độ dài, nguồn, chỗ đang dùng; ✏️ sửa tên / loại / lặp / độ to / nguồn;
//     🗑️ xoá (file đang gắn ở cài đặt thì không cho, báo chỗ dùng).
//   File tải lên hiện ngay ở ô "File thu thật" / "Bài nhạc" của ⚔️ Đấu Trường › 🎛️ Thông số › 🔊 Âm thanh (chung/kho_tieng.js).
// BƯỚC: KC_09B1 - NGÀY: 21/11/2026
// PHỤ THUỘC: ../admin_NC.js (adminGoiRpc, adminThoat, adminBaoTin, adminDinhDangGio, supabaseClient), chung/kho_tieng.js
//   (KC_KHO_TIENG), quantri_NC.html có nút data-manhinh="khotieng" + section #manhinh-khotieng (#qktGoc), qt_kho_tieng.css;
//   SQL repo_rieng SQL/supabase_kc09b1_kho_tieng.sql.
// ================================================================
(function () {
  "use strict";
  if (typeof adminGoiRpc !== "function" || !window.KC_KHO_TIENG) return;
  var goc = document.getElementById("qktGoc");
  if (!goc) return;
  var KT = window.KC_KHO_TIENG, T = adminThoat;
  var TEN_LOAI = { nhac: "🎵 Nhạc nền", tieng: "🔔 Tiếng ngắn" };
  var ds = [], dangSua = null, dangBan = false, daMo = false, nghe = null; // nghe = { id, audio }

  function el(id) { return document.getElementById(id); }
  function kb(byte) { return byte >= 1048576 ? (byte / 1048576).toLocaleString("vi-VN", { maximumFractionDigits: 2 }) + " MB" : Math.max(1, Math.round(byte / 1024)) + " KB"; }
  function giay(g) { if (g == null || !isFinite(g)) return "?"; g = Number(g); return g >= 60 ? Math.floor(g / 60) + " phút " + Math.round(g % 60) + " giây" : g.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " giây"; }
  function goi(ham, ts) {
    return adminGoiRpc(ham, ts || {}).then(function (kq) {
      if (kq && kq.thanhCong === false && /function|does not exist|schema cache/i.test(kq.thongBao || "")) kq.thongBao = "Máy chủ chưa có hàm " + ham + " (cần chạy SQL KC_09B1)";
      return kq || { thanhCong: false, thongBao: "Máy chủ không trả lời" };
    });
  }
  function client() { return window.supabaseClient || KT.timClient(); }
  function bao(tin, kieu) { var o = el("qktTin"); if (!o) return; o.textContent = tin || ""; o.className = "qktTin" + (kieu ? " " + kieu : ""); }

  goc.innerHTML = '<div class="qktLuoi">'
    + '<section class="qktThe qktTai"><h4>⬆️ Tải file lên</h4>'
    + '<p class="adminGhiChu">Chỉ dùng file được phép dùng miễn phí (CC0, ví dụ opengameart.org, freesound.org mục CC0, kenney.nl). '
    + 'Nhạc nền tối đa <b>2,5 MB</b>, tiếng ngắn tối đa <b>150 KB</b>. Nhận .mp3, .ogg, .wav, .m4a.</p>'
    + '<label class="qktO"><span>File âm thanh</span><input type="file" id="qktTep" accept=".mp3,.ogg,.wav,.m4a,audio/mpeg,audio/ogg,audio/wav,audio/mp4"></label>'
    + '<div class="qktHai"><label class="qktO"><span>Loại</span><select id="qktLoai"><option value="tieng">🔔 Tiếng ngắn (hiệu ứng, chiêu)</option><option value="nhac">🎵 Nhạc nền</option></select></label>'
    + '<label class="qktO qktChon" hidden><input type="checkbox" id="qktLap" checked> <span>Nhạc lặp lại liền</span></label></div>'
    + '<label class="qktO"><span>Tên hiện trong ô chọn</span><input type="text" id="qktTen" maxlength="80" placeholder="ví dụ: Tiếng sét đánh"></label>'
    + '<label class="qktO"><span>Nguồn (trang tải file gốc)</span><input type="url" id="qktNguon" maxlength="300" placeholder="https://..."></label>'
    + '<label class="qktO"><span>Giấy phép</span><input type="text" id="qktPhep" maxlength="40" value="CC0"></label>'
    + '<p class="qktXem" id="qktXem"></p>'
    + '<div class="qktNut"><button type="button" class="adminNut adminNutThanhCong" id="qktNutTai" disabled>⬆️ Tải lên</button></div>'
    + '<p class="qktTin" id="qktTin" role="status"></p></section>'
    + '<section class="qktThe qktDsThe"><div class="qktDau"><h4>📁 File trong kho</h4>'
    + '<button type="button" class="adminNut adminNutPhu" id="qktTaiLai">🔄 Tải lại</button></div><div id="qktDs"><p class="adminDangTai">Đang tải...</p></div></section>'
    + "</div>";

  // ---------------- chọn file: đoán loại, tên, xem trước ----------------
  var tepChon = null, tinTep = null; // tinTep = { duoi, giay } sau khi đã giải mã thử
  el("qktTep").addEventListener("change", function () {
    tepChon = this.files && this.files[0] || null; tinTep = null;
    el("qktNutTai").disabled = true; bao("");
    if (!tepChon) { el("qktXem").textContent = ""; return; }
    var duoi = (/\.([a-z0-9]+)$/i.exec(tepChon.name) || [])[1];
    duoi = duoi ? duoi.toLowerCase() : "";
    if (KT.DUOI.indexOf(duoi) < 0) { el("qktXem").textContent = ""; bao("❌ Chỉ nhận file .mp3, .ogg, .wav, .m4a", "loi"); return; }
    if (!el("qktTen").value.trim()) el("qktTen").value = tepChon.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, 80);
    el("qktLoai").value = tepChon.size > KT.GIOI_HAN.tieng ? "nhac" : "tieng"; // mỗi file đoán lại (file dài > 8 giây cũng là nhạc)
    el("qktXem").textContent = "Đang thử mở file…";
    giaiMa(tepChon).then(function (g) {
      tinTep = { duoi: duoi, giay: g };
      if (el("qktLoai").value === "tieng" && g > 8) el("qktLoai").value = "nhac";
      veXem();
    }).catch(function () {
      el("qktXem").textContent = "";
      bao("❌ File không phải âm thanh hoặc bị hỏng, trình duyệt không mở được", "loi");
    });
  });
  el("qktLoai").addEventListener("change", veXem);
  function veXem() {
    var loai = el("qktLoai").value;
    el("qktLap").closest("label").hidden = loai !== "nhac";
    if (!tepChon || !tinTep) return;
    var gh = KT.GIOI_HAN[loai], qua = tepChon.size > gh;
    el("qktXem").innerHTML = "📄 <b>" + T(tepChon.name) + "</b> · " + kb(tepChon.size) + " · " + giay(tinTep.giay)
      + (qua ? '<br><span class="qktDo">❌ Quá cỡ ' + T(TEN_LOAI[loai]) + " (tối đa " + kb(gh) + ")" + (loai === "tieng" && tepChon.size <= KT.GIOI_HAN.nhac ? ": chọn loại 🎵 Nhạc nền" : ": hãy nén nhỏ file lại") + "</span>" : "");
    el("qktNutTai").disabled = qua || dangBan;
  }
  function giaiMa(tep) {
    return tep.arrayBuffer().then(function (buf) {
      var AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!AC) return null; // trình duyệt quá cũ: để máy chủ kiểm cỡ
      var ac = new AC(1, 1, 44100);
      return new Promise(function (ok, loi) {
        var p = ac.decodeAudioData(buf, function (b) { ok(b.duration); }, loi);
        if (p && typeof p.catch === "function") p.catch(loi); // Chrome còn trả Promise: bắt luôn để không báo lỗi trên console
      });
    });
  }
  function bam(tep) {
    return tep.arrayBuffer().then(function (buf) { return crypto.subtle.digest("SHA-256", buf); }).then(function (h) {
      return Array.prototype.map.call(new Uint8Array(h), function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    });
  }

  // ---------------- ⬆️ tải lên: băm -> xin vé -> Storage -> lưu kho ----------------
  el("qktNutTai").addEventListener("click", function () {
    if (!tepChon || !tinTep || dangBan) return;
    var loai = el("qktLoai").value, ten = el("qktTen").value.trim(), tep = tepChon, tin = tinTep;
    if (!ten) { bao("❌ Hãy đặt tên cho file", "loi"); el("qktTen").focus(); return; }
    if (tep.size > KT.GIOI_HAN[loai]) { veXem(); return; }
    var c = client();
    if (!c || !c.storage) { bao("❌ Trang chưa nối được Supabase Storage", "loi"); return; }
    dangBan = true; el("qktNutTai").disabled = true; bao("⏳ Đang kiểm file…", "");
    var duongDan;
    bam(tep).then(function (ma) {
      return goi("kc_am_thanh_admin_xin_tai", { p_ma_bam: ma, p_duoi: tin.duoi, p_loai: loai, p_co: tep.size });
    }).then(function (kq) {
      if (!kq.thanhCong) throw new Error(kq.thongBao);
      if (kq.trung) return { trung: kq };
      duongDan = kq.duongDan;
      if (!kq.canTai) return null;
      bao("⏳ Đang tải lên " + kb(tep.size) + "…", "");
      return c.storage.from(KT.BUCKET).upload(duongDan, tep, { contentType: KT.MIME[tin.duoi], cacheControl: "31536000", upsert: false }).then(function (up) {
        if (up && up.error && !/exist|duplicate/i.test(up.error.message || "")) throw new Error("Không tải được file lên: " + up.error.message);
        return null;
      });
    }).then(function (truoc) {
      if (truoc && truoc.trung) return truoc;
      return goi("kc_am_thanh_admin_luu", { p_id: null, p_duong_dan: duongDan, p_loai: loai, p_ten: ten, p_giay: tin.giay,
        p_lap: el("qktLap").checked, p_am_luong: 1, p_nguon: el("qktNguon").value.trim() || null, p_giay_phep: el("qktPhep").value.trim() || "CC0" }).then(function (kq) {
        if (kq.ma === "co" && kq.canXoa) { // máy chủ đọc cỡ thật: quá cỡ -> gỡ file vừa lên
          return c.storage.from(KT.BUCKET).remove([kq.duongDan]).then(function () { throw new Error(kq.thongBao); });
        }
        if (!kq.thanhCong) throw new Error(kq.thongBao);
        return kq.trung ? { trung: kq } : kq;
      });
    }).then(function (kq) {
      dangBan = false;
      if (kq.trung) bao("ℹ️ File này đã có trong kho: " + kq.trung.muc.ten + " (" + kq.trung.muc.ma + "). Không tải thêm bản nữa.", "ok");
      else bao("✅ Đã tải lên: " + kq.muc.ten + " (" + kq.muc.ma + "). Gắn vào chiêu / nhạc ở ⚔️ Đấu Trường › 🎛️ Thông số › 🔊 Âm thanh.", "ok");
      el("qktTep").value = ""; el("qktTen").value = ""; el("qktNguon").value = ""; el("qktPhep").value = "CC0";
      tepChon = tinTep = null; el("qktXem").textContent = "";
      KT.baoDoi(); tai();
    }).catch(function (e) {
      dangBan = false; veXem();
      bao("❌ " + ((e && e.message) || "Có lỗi"), "loi");
    });
  });

  // ---------------- danh sách ----------------
  function tai() {
    goi("kc_am_thanh_admin_ds").then(function (kq) {
      if (!kq.thanhCong) { el("qktDs").innerHTML = '<p class="adminGhiChu">❌ ' + T(kq.thongBao) + "</p>"; return; }
      ds = kq.ds || [];
      veDs();
    });
  }
  el("qktTaiLai").addEventListener("click", function () { dangSua = null; tai(); });

  function veDs() {
    if (!ds.length) { el("qktDs").innerHTML = '<p class="adminGhiChu">Kho chưa có file nào. Tải file đầu tiên ở khung ⬆️ Tải file lên.</p>'; return; }
    el("qktDs").innerHTML = ["nhac", "tieng"].map(function (loai) {
      var nhom = ds.filter(function (d) { return d.loai === loai; });
      if (!nhom.length) return "";
      return '<h5 class="qktNhom">' + T(TEN_LOAI[loai]) + " <small>(" + nhom.length + ")</small></h5><div class=\"qktDsMuc\">" + nhom.map(veMuc).join("") + "</div>";
    }).join("");
  }
  function veMuc(d) {
    var dung = d.dangDung || [], dangNghe = nghe && nghe.id === d.id;
    var h = '<article class="qktMuc' + (d.coTep ? "" : " mat") + '" data-id="' + d.id + '">'
      + '<div class="qktMucDau"><button type="button" class="qktNghe" data-viec="nghe" aria-label="Nghe thử" title="Nghe thử"' + (d.coTep ? "" : " disabled") + ">" + (dangNghe ? "⏹" : "▶") + "</button>"
      + '<div class="qktMucTen"><b>' + T(d.ten) + "</b><code>" + T(d.ma) + "</code></div></div>"
      + '<p class="qktMeta">' + kb(d.co) + " · " + giay(d.giay) + (d.loai === "nhac" ? " · " + (d.lap ? "lặp lại" : "phát một lần") : "")
      + (Number(d.amLuong) !== 1 ? " · độ to " + T(d.amLuong) : "") + " · " + T(d.giayPhep || "CC0")
      + (d.nguon ? ' · <a href="' + T(d.nguon) + '" target="_blank" rel="noopener">nguồn</a>' : "") + "</p>"
      + (d.coTep ? "" : '<p class="qktDo">⚠️ Máy chủ không còn file này. Xoá dòng này rồi tải lại.</p>')
      + '<p class="qktDung">' + (dung.length ? "📌 Đang dùng: " + dung.map(T).join(", ") : '<span class="qktMo">Chưa gắn vào đâu</span>') + "</p>";
    if (dangSua === d.id) {
      h += '<div class="qktSua">'
        + '<label class="qktO"><span>Tên</span><input type="text" data-o="ten" maxlength="80" value="' + T(d.ten) + '"></label>'
        + '<div class="qktHai"><label class="qktO"><span>Loại</span><select data-o="loai"><option value="tieng"' + (d.loai === "tieng" ? " selected" : "") + '>🔔 Tiếng ngắn</option><option value="nhac"' + (d.loai === "nhac" ? " selected" : "") + '>🎵 Nhạc nền</option></select></label>'
        + '<label class="qktO"><span>Độ to file (0 - 2)</span><input type="number" data-o="amLuong" min="0" max="2" step="0.05" value="' + T(d.amLuong) + '"></label></div>'
        + '<label class="qktO qktChon"><input type="checkbox" data-o="lap"' + (d.lap ? " checked" : "") + "> <span>Nhạc lặp lại liền</span></label>"
        + '<label class="qktO"><span>Nguồn</span><input type="url" data-o="nguon" maxlength="300" value="' + T(d.nguon || "") + '"></label>'
        + '<label class="qktO"><span>Giấy phép</span><input type="text" data-o="giayPhep" maxlength="40" value="' + T(d.giayPhep || "CC0") + '"></label>'
        + '<div class="qktNut"><button type="button" class="adminNut adminNutThanhCong" data-viec="luu">💾 Lưu</button><button type="button" class="adminNut adminNutPhu" data-viec="huy">Huỷ</button></div></div>';
    } else {
      h += '<div class="qktNut"><button type="button" class="adminNut adminNutPhu" data-viec="sua">✏️ Sửa</button>'
        + '<button type="button" class="adminNut adminNutNguyHiem qktXoa" data-viec="xoa"' + (dung.length ? ' disabled title="Đang dùng: bỏ gắn ở đó trước"' : "") + ">🗑️ Xoá</button></div>";
    }
    return h + "</article>";
  }

  el("qktDs").addEventListener("click", function (su) {
    var nut = su.target.closest("[data-viec]"), the = su.target.closest(".qktMuc");
    if (!nut || !the) return;
    var id = Number(the.getAttribute("data-id")), d = ds.find(function (x) { return x.id === id; });
    if (!d) return;
    var viec = nut.getAttribute("data-viec");
    if (viec === "nghe") ngheThu(d);
    else if (viec === "sua") { dangSua = id; veDs(); }
    else if (viec === "huy") { dangSua = null; veDs(); }
    else if (viec === "luu") luuSua(d, the);
    else if (viec === "xoa") xoa(d);
  });

  function dungNghe() { if (nghe) { try { nghe.audio.pause(); } catch (e) { /* bỏ qua */ } nghe = null; } }
  function ngheThu(d) {
    var dang = nghe && nghe.id === d.id;
    dungNghe();
    if (!dang) {
      var url = KT.urlTep(d.duongDan, client());
      if (!url) { adminBaoTin("❌ Không có đường dẫn file", false); return; }
      var a = new Audio(url);
      a.volume = Math.max(0, Math.min(1, Number(d.amLuong) || 1));
      a.onended = function () { if (nghe && nghe.audio === a) { nghe = null; veDs(); } };
      nghe = { id: d.id, audio: a };
      a.play().catch(function (e) { nghe = null; veDs(); adminBaoTin("❌ Không phát được file: " + e.message, false); });
    }
    veDs();
  }

  function luuSua(d, the) {
    var o = function (k) { return the.querySelector('[data-o="' + k + '"]'); };
    var ten = o("ten").value.trim(), amLuong = Number(o("amLuong").value);
    if (!ten) { adminBaoTin("❌ Tên không được để trống", false); return; }
    if (!isFinite(amLuong) || amLuong < 0 || amLuong > 2) { adminBaoTin("❌ Độ to từ 0 đến 2", false); return; }
    goi("kc_am_thanh_admin_luu", { p_id: d.id, p_duong_dan: null, p_loai: o("loai").value, p_ten: ten, p_giay: null, p_lap: o("lap").checked,
      p_am_luong: amLuong, p_nguon: o("nguon").value.trim() || null, p_giay_phep: o("giayPhep").value.trim() || "CC0" }).then(function (kq) {
      if (!kq.thanhCong) { adminBaoTin("❌ " + kq.thongBao, false); return; }
      adminBaoTin("✅ Đã lưu " + kq.muc.ten, true);
      dangSua = null; KT.baoDoi(); tai();
    });
  }

  function xoa(d) {
    if ((d.dangDung || []).length) { adminBaoTin("❌ File đang dùng ở: " + d.dangDung.join(", ") + ". Bỏ gắn ở đó rồi mới xoá.", false); return; }
    if (!confirm("Xoá hẳn file \"" + d.ten + "\" (" + d.ma + ") khỏi kho?")) return;
    var c = client();
    goi("kc_am_thanh_admin_xin_xoa", { p_id: d.id }).then(function (kq) {
      if (!kq.thanhCong) throw new Error(kq.thongBao + (kq.dangDung && kq.dangDung.length ? ": " + kq.dangDung.join(", ") : ""));
      if (!kq.coTep) return null;
      if (!c || !c.storage) throw new Error("Trang chưa nối được Supabase Storage");
      return c.storage.from(KT.BUCKET).remove([kq.duongDan]).then(function (r) { if (r && r.error) throw new Error("Không xoá được file: " + r.error.message); });
    }).then(function () {
      return goi("kc_am_thanh_admin_xoa_xong", { p_id: d.id });
    }).then(function (kq) {
      if (!kq.thanhCong) throw new Error(kq.thongBao);
      if (nghe && nghe.id === d.id) dungNghe();
      adminBaoTin("✅ Đã xoá " + d.ten, true);
      KT.baoDoi(); tai();
    }).catch(function (e) { adminBaoTin("❌ " + ((e && e.message) || "Có lỗi"), false); tai(); });
  }

  function mo() { if (!daMo) { daMo = true; } tai(); }
  document.addEventListener("adminDaChuyenManHinh", function (su) {
    if (su.detail && su.detail.ten === "khotieng") mo(); else dungNghe();
  });
  if (el("manhinh-khotieng") && el("manhinh-khotieng").classList.contains("dangHien")) mo();
})();
// 21/11/2026 - BƯỚC: KC_09B1
