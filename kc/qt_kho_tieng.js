// ================================================================
// FILE: kc/qt_kho_tieng.js
// CHỨC NĂNG: KHO TIẾNG dạng CÂY NỘI DUNG (KC_09B1, làm lại theo người dùng 21/11/2026: "giao diện dạng cây thư mục bên
//   trái, khi tôi bấm 1 nội dung cụ thể => hiện âm thanh hiện tại => tôi nghe thử, đạt thì thôi, không đạt tôi tải file
//   khác lên để thay, có thể xóa hay để file cũ, đồng thời chỉnh các cài đặt liên quan đến file âm thanh cụ thể này nếu
//   có, có ô tích file nào là mặc định cho nội dung. kho âm thanh trong đấu trường tri thức cũng nên chỉnh lại theo hình
//   thức này").
//   - Trái: cây nội dung (⚔️ Đấu Trường › 🔊 Độ to chung / 🎵 Nhạc nền / ✨ Chiêu / ⚔️ Đòn / 🌪️ Chiêu vùng / 🏁 Kết;
//     📚 Âm thanh chung để KC_09B2; 🗂️ File chưa thuộc nội dung nào). Ô tìm. Dấu 📁 = đang dùng file tải lên,
//     🔇 = đang tắt, ● = có thay đổi chưa lưu.
//   - Phải: nội dung đang chọn: "Đang dùng" + ▶ Nghe (như trong trận); CÁC FILE CỦA NỘI DUNG (◉ tích = mặc định;
//     ▶ nghe từng file; ✏️ sửa file tải lên; 🗑️ bỏ file, file tải lên không còn ở đâu thì xoá hẳn khỏi máy chủ);
//     ⬆️ Tải file khác lên (tự tích làm mặc định), 📚 Chọn từ thư viện; CÀI ĐẶT của nội dung (có kêu, độ to, độ to file,
//     chồng / thay, trễ); 💾 Lưu, ↺ Mặc định.
//   - Điện thoại: cây là trang đầu, bấm nội dung mở trang chi tiết có ← Quay lại. Máy tính: 2 cột.
//   Dùng ở 2 chỗ, CHUNG một bộ dữ liệu (người dùng 21/11/2026: âm thanh Đấu Trường KHÔNG để ở Quản trị chung):
//   - ⚔️ Đấu Trường › 🎛️ Thông số › 🔊 Âm thanh: nhánh Đấu Trường (qt_dau_truong.js gọi QKT_CAY.gan(o, { nhanh: "dt" }));
//   - Quản trị chung › 🎵 Kho tiếng (#qktGoc, nhanh "chung"): chỉ âm thanh dùng chung toàn app (📚 Âm thanh chung, KC_09B2)
//     + 🗂️ File chưa thuộc nội dung nào. Game khác (Mèo Con, cờ...) sau này thêm nhánh riêng ở mục của game đó.
//   Dữ liệu: mặc định dt/du_lieu/cau_hinh_am_thanh.json + phần sửa (kc_dt_admin_thong_so / kc_dt_admin_luu_thong_so, giữ
//   lịch sử + hoàn tác ở Thông số); file tải lên + danh sách file từng nội dung (kc_am_thanh_admin_ds, _gan_them, _go,
//   _xin_tai, _luu, _xin_xoa, _xoa_xong); thư viện file sẵn dt/am_thanh/thu_vien.json + kho (chung/kho_tieng.js).
//   Mã nội dung: "dt:tieng:<khoá>", "dt:nhac:<bối cảnh>", "dt:chung".
// BƯỚC: KC_09B1 - NGÀY: 21/11/2026 (bản danh sách 13:1x; bản cây 21/11/2026 14:xx)
// PHỤ THUỘC: ../admin_NC.js (adminGoiRpc, adminThoat, adminBaoTin), chung/kho_tieng.js (KC_KHO_TIENG), dt/dt_cau_hinh.js
//   (KC_DT_CAU_HINH, nạp sau file này: chỉ dùng lúc chạy), dt/3d/dt3d_am_thanh.js (▶ nghe như trong trận), qt_kho_tieng.css;
//   SQL repo_rieng supabase_kc09b1_kho_tieng.sql + supabase_kc09b1b_cay_noi_dung.sql.
// ================================================================
(function () {
  "use strict";
  if (typeof adminGoiRpc !== "function" || !window.KC_KHO_TIENG) return;
  var KT = window.KC_KHO_TIENG, T = adminThoat;
  var URL_MD_C = "chung/du_lieu/cau_hinh_am_thanh_chung.json", TEN_TEP_C = "cau_hinh_am_thanh_chung"; // KC_09B2: cài đặt Âm thanh chung (file riêng, không lẫn Đấu Trường)
  // KC_03C5c: âm thanh RIÊNG của ⚡ Tốc độ (nhánh "tdo", file cài đặt riêng, mở ở Quản trị › ⚡ Tốc độ › 🔊 Âm thanh)
  var URL_MD_T = "tt_tri_thuc/du_lieu/cau_hinh_am_thanh_toc_do.json", TEN_TEP_T = "cau_hinh_am_thanh_toc_do";
  var NHOM_T = [{ ma: "vao", ten: "🚦 Vào trận" }, { ma: "choi", ten: "⚡ Trong lúc chơi" }, { ma: "ket", ten: "🏁 Kết thúc lượt" }];
  var URL_MD = "dt/du_lieu/cau_hinh_am_thanh.json", URL_TV = "dt/am_thanh/thu_vien.json", TEN_TEP = "cau_hinh_am_thanh";
  var NHOM = [
    { ma: "chieu", ten: "✨ Chiêu tướng" }, { ma: "don", ten: "⚔️ Đòn đánh, đỡ, né" },
    { ma: "vung", ten: "🌪️ Trong chiêu vùng" }, { ma: "ket", ten: "🏁 Thắng, thua, kèn lệnh" }
  ];
  var TEN_NHAC = { tran: "Trận thường", trum: "Trận trùm", thang: "Đoạn kết khi thắng", thua: "Đoạn kết khi thua" };
  var TRONG_NHAC = { tran: "🔇 Để trống (trận im lặng)", trum: "🔇 Để trống (trận im lặng)", thang: "🎺 Kèn ngắn tự tạo", thua: "🎺 Kèn ngắn tự tạo" };
  var DONG_MD = { bat: true, amLuong: 1, file: "", amTep: 1, kieu: "chong", tre: 0 };

  // ---------------- bộ dữ liệu chung (một lần cho cả 2 chỗ) ----------------
  var S = { daTai: false, dangTai: null, loi: "", md: null, daLuu: null, ht: null, kho: [], gan: {}, tv: { nhac: [], tieng: [] }, coMayChu: false };
  var views = []; // { nhanh, goc, chon, moChiTiet, tim }
  var am = null, nghe = null; // bộ tiếng trận (▶ Nghe); nghe = { khoa, audio }

  function chep(o) { return JSON.parse(JSON.stringify(o)); }
  // KC_09B2: cài đặt Âm thanh chung nằm ở S.md.chung / S.ht.chung / S.daLuu.chung (cùng cây, khác file lưu)
  // KC_03C5c: nhánh "tdo" (⚡ Tốc độ) nằm ở S.*.tdo, cùng kiểu
  function gocCH(ch, khoa) { return /^chung:/.test(khoa) ? (ch.chung || (ch.chung = {})) : /^tdo:/.test(khoa) ? (ch.tdo || (ch.tdo = {})) : ch; }
  function laRieng(nhanh) { return nhanh === "chung" || nhanh === "tdo"; } // nhánh có file cài đặt riêng, tiếng tự tạo nằm ở module của nhánh
  function boChung(o) { var c = chep(o); delete c.chung; delete c.tdo; return c; }
  function giong(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function kb(byte) { return byte >= 1048576 ? (byte / 1048576).toLocaleString("vi-VN", { maximumFractionDigits: 2 }) + " MB" : Math.max(1, Math.round(byte / 1024)) + " KB"; }
  function giay(g) { if (g == null || !isFinite(g)) return ""; g = Number(g); return g >= 60 ? Math.floor(g / 60) + " phút " + Math.round(g % 60) + " giây" : g.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " giây"; }
  function goi(ham, ts) {
    return adminGoiRpc(ham, ts || {}).then(function (kq) {
      if (kq && kq.thanhCong === false && /function|does not exist|schema cache/i.test(kq.thongBao || "")) kq.thongBao = "Máy chủ chưa có hàm " + ham + " (cần chạy SQL KC_09B1)";
      return kq || { thanhCong: false, thongBao: "Máy chủ không trả lời" };
    });
  }
  function client() { return window.supabaseClient || KT.timClient(); }

  function tai() {
    if (S.dangTai) return S.dangTai;
    S.loi = ""; veTatCa();
    var md = fetch(URL_MD, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
    var tvSan = fetch(URL_TV, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
    var mdC = fetch(URL_MD_C, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
    var mdT = fetch(URL_MD_T, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
    S.dangTai = Promise.all([md, goi("kc_dt_admin_thong_so"), goi("kc_am_thanh_admin_ds"), tvSan, KT.ds({ moi: true }), mdC, mdT]).then(function (kq) {
      var may = kq[1], kd = kq[2], tv = kq[3] || {};
      S.md = kq[0];
      S.coMayChu = !!(may && may.thanhCong);
      var sua = (S.coMayChu && may.sua && may.sua[TEN_TEP]) || null;
      S.daLuu = window.KC_DT_CAU_HINH ? KC_DT_CAU_HINH.tron(S.md, sua) : chep(S.md);
      var suaC = (S.coMayChu && may.sua && may.sua[TEN_TEP_C]) || null;
      S.md.chung = kq[5];
      S.daLuu.chung = window.KC_DT_CAU_HINH ? KC_DT_CAU_HINH.tron(kq[5], suaC) : chep(kq[5]);
      var suaT = (S.coMayChu && may.sua && may.sua[TEN_TEP_T]) || null;
      S.md.tdo = kq[6];
      S.daLuu.tdo = window.KC_DT_CAU_HINH ? KC_DT_CAU_HINH.tron(kq[6], suaT) : chep(kq[6]);
      S.ht = chep(S.daLuu);
      S.kho = kd && kd.thanhCong ? kd.ds || [] : [];
      S.gan = {};
      ((kd && kd.gan) || []).forEach(function (g) { (S.gan[g.noiDung] = S.gan[g.noiDung] || []).push(g.ma); });
      S.tv = KT.tron({ nhac: tv.nhac || [], tieng: tv.tieng || [] }, kq[4]);
      if (!S.coMayChu) S.loi = "⚠️ Chưa đọc được máy chủ (" + ((may && may.thongBao) || "lỗi không rõ") + "). Đang hiện mặc định, chưa lưu được.";
      else if (!kd || !kd.thanhCong) S.loi = "⚠️ " + ((kd && kd.thongBao) || "Chưa đọc được kho tiếng");
      S.daTai = true; S.dangTai = null;
      veTatCa();
    }).catch(function (e) { S.dangTai = null; S.loi = "❌ Không tải được cài đặt âm thanh: " + e.message; veTatCa(); });
    return S.dangTai;
  }

  // ---------------- nội dung ----------------
  function chia(khoa) { var p = khoa.split(":"); return { nhanh: p[0], loai: p[1], k: p[2] }; }
  function tenND(khoa) {
    var c = chia(khoa);
    if (c.loai === "chung") return "🔊 Độ to chung";
    if (c.nhanh === "tdo" && c.loai === "nhac") return "🎵 Nhạc nền";
    if (c.nhanh === "tdo" && c.loai === "gio") return "⏱️ Lúc nào kêu (nghĩ lâu, gần hết giờ)";
    if (c.loai === "nhac") return "🎵 " + (TEN_NHAC[c.k] || c.k);
    if (c.nhanh === "chung" && c.loai === "loi") return "💬 Lời khen và động viên";
    if (c.nhanh === "chung" && c.loai === "doc") return "🗣️ Giọng đọc câu nghe";
    var d = (gocCH(S.md, khoa).tieng || {})[c.k] || {};
    return d.ten || c.k;
  }
  function dong(ch, k) { return Object.assign({}, DONG_MD, ((ch && ch.tieng) || {})[k]); }
  function fileCua(ch, khoa) {
    var c = chia(khoa);
    if (c.loai === "nhac") return ((ch && gocCH(ch, khoa).nhac) || {})[c.k] || "";
    if (c.loai === "tieng") return dong(gocCH(ch, khoa), c.k).file || "";
    return "";
  }
  function datFile(khoa, ma) {
    var c = chia(khoa);
    if (c.loai === "nhac") { var hn = gocCH(S.ht, khoa); hn.nhac = hn.nhac || {}; hn.nhac[c.k] = ma; }
    else { var h = gocCH(S.ht, khoa); h.tieng = h.tieng || {}; h.tieng[c.k] = Object.assign(dong(h, c.k), h.tieng[c.k] || {}, { file: ma }); }
  }
  function phanND(ch, khoa) { // phần cài đặt thuộc một nội dung (so sánh chưa lưu)
    var c = chia(khoa);
    if (c.loai === "chung") return gocCH(ch, khoa).amLuong;
    if (c.nhanh === "chung" && c.loai === "loi") return gocCH(ch, khoa).loiKhen;
    if (c.nhanh === "chung" && c.loai === "doc") return gocCH(ch, khoa).docCau;
    if (c.nhanh === "tdo" && c.loai === "gio") return gocCH(ch, khoa).hoiHop;
    if (c.nhanh === "tdo" && c.loai === "nhac") return [(gocCH(ch, khoa).nhac || {})[c.k] || "", gocCH(ch, khoa).nhacNen];
    if (laRieng(c.nhanh)) return dong(gocCH(ch, khoa), c.k);
    if (c.loai === "nhac") return (ch.nhac || {})[c.k] || "";
    return dong(ch, c.k);
  }
  function chuaLuu(khoa) { return !giong(phanND(S.ht, khoa), phanND(S.daLuu, khoa)); }
  function soChuaLuu(nhanh) { return dsND(nhanh || "all").filter(chuaLuu).length; }
  function dsND(nhanh) {
    if (!S.md) return [];
    var ds = [];
    if (nhanh === "dt" || nhanh === "all") {
      ds.push("dt:chung");
      Object.keys(S.md.nhac || {}).forEach(function (k) { ds.push("dt:nhac:" + k); });
      Object.keys(S.md.tieng || {}).forEach(function (k) { ds.push("dt:tieng:" + k); });
    }
    if (nhanh === "tdo" || nhanh === "all") {
      ds.push("tdo:chung", "tdo:nhac:nen", "tdo:gio");
      Object.keys((S.md.tdo || {}).tieng || {}).forEach(function (k) { ds.push("tdo:tieng:" + k); });
    }
    if (nhanh === "chung" || nhanh === "all") {
      Object.keys((S.md.chung || {}).tieng || {}).forEach(function (k) { ds.push("chung:tieng:" + k); });
      ds.push("chung:loi", "chung:doc");
    }
    return ds;
  }
  function timMuc(ma, loai) {
    if (!ma) return null;
    var tvL = loai === "nhac" ? S.tv.nhac : S.tv.tieng;
    var m = tvL.find(function (x) { return x.ma === ma; });
    var k = /^kho_\d+$/.test(ma) ? S.kho.find(function (x) { return x.ma === ma; }) : null;
    if (!m && !k) return { ma: ma, ten: ma, mat: true };
    var tep = m ? (Array.isArray(m.tep) ? m.tep[0] : m.tep) : null;
    var url = k ? KT.urlTep(k.duongDan, client()) : tep ? new URL(tep, new URL(URL_TV, location.href)).href : null;
    return { ma: ma, ten: (k && k.ten) || (m && m.ten) || ma, kho: k, url: url, amLuong: k ? Number(k.amLuong) : m && m.amLuong != null ? m.amLuong : 1 };
  }
  function ungVien(khoa) { // các file của một nội dung: mặc định gốc + đã gắn + đang tích + đã lưu
    var c = chia(khoa), ds = [];
    [fileCua(S.md, khoa)].concat(S.gan[khoa] || [], [fileCua(S.ht, khoa), fileCua(S.daLuu, khoa)]).forEach(function (ma) {
      if (ma && ds.indexOf(ma) < 0) ds.push(ma);
    });
    return ds.map(function (ma) { return timMuc(ma, c.loai); });
  }
  function khoMoCoi() { // file tải lên không thuộc nội dung nào, không đang tích ở đâu
    var dung = {};
    Object.keys(S.gan).forEach(function (n) { S.gan[n].forEach(function (m) { dung[m] = 1; }); });
    dsND("all").forEach(function (n) { dung[fileCua(S.ht, n)] = 1; dung[fileCua(S.daLuu, n)] = 1; });
    return S.kho.filter(function (k) { return !dung[k.ma]; });
  }

  // ---------------- vẽ ----------------
  function veTatCa() { views.forEach(ve); }
  function ve(v) {
    var g = v.goc;
    if (!S.daTai) { g.innerHTML = '<div class="qktCay"><p class="adminDangTai">' + (S.loi ? T(S.loi) : "Đang tải...") + "</p></div>"; return; }
    if (v.chon && !hopLe(v, v.chon)) v.chon = null;
    var so = soChuaLuu(v.nhanh); // thanh lưu: nội dung chưa lưu của đúng nhánh (Đấu Trường / Âm thanh chung)
    g.innerHTML = '<div class="qktCay' + (v.moChiTiet ? " moChiTiet" : "") + '">'
      + (S.loi ? '<p class="qktLoi">' + T(S.loi) + "</p>" : "")
      + '<nav class="qktTrai" aria-label="Cây nội dung âm thanh">'
      + '<div class="qktTimO"><input type="search" data-kt="tim" placeholder="🔍 Tìm nội dung…" value="' + T(v.tim) + '">'
      + '<button type="button" class="adminNut adminNutPhu" data-kt="tailai" title="Tải lại">🔄</button></div>'
      + veCay(v) + "</nav>"
      + '<section class="qktPhai">' + veChiTiet(v) + "</section></div>"
      + '<div class="qktThanh' + (so ? " hien" : "") + '"><b>' + so + " nội dung chưa lưu</b>"
      + '<button type="button" class="adminNut adminNutThanhCong" data-kt="luu">💾 Lưu</button>'
      + '<button type="button" class="adminNut adminNutPhu" data-kt="bo">Bỏ thay đổi</button></div>';
  }
  function hopLe(v, khoa) { return (v.nhanh === "chung" && khoa === "mocoi") || dsND(v.nhanh).indexOf(khoa) >= 0; }
  function dauND(khoa) {
    var c = chia(khoa), f = fileCua(S.ht, khoa), d = c.loai === "tieng" ? dong(gocCH(S.ht, khoa), c.k) : null;
    return (chuaLuu(khoa) ? '<i class="qktCham" title="Chưa lưu">●</i>' : "") + (/^kho_/.test(f) ? '<span title="Đang dùng file tải lên">📁</span>' : "")
      + (d && d.bat === false ? '<span title="Đang tắt">🔇</span>' : "");
  }
  function nutND(v, khoa, ten) {
    return '<button type="button" class="qktNut' + (v.chon === khoa ? " dangChon" : "") + '" data-kt="chon" data-khoa="' + T(khoa) + '" data-tim="' + T((ten + " " + khoa).toLowerCase()) + '">'
      + '<span class="qktNutTen">' + T(ten) + "</span>" + dauND(khoa) + "</button>";
  }
  function veCay(v) {
    var tim = (v.tim || "").toLowerCase(), khop = function (ten, khoa) { return !tim || (ten + " " + khoa).toLowerCase().indexOf(tim) >= 0; };
    var nhanh = function (tieuDe, ruot, mo) { return ruot ? '<details class="qktNhanh"' + (mo || tim ? " open" : "") + "><summary>" + tieuDe + "</summary>" + ruot + "</details>" : ""; };
    var dt = "";
    if (khop("Độ to chung", "dt:chung")) dt += nutND(v, "dt:chung", "🔊 Độ to chung");
    dt += nhanh("🎵 Nhạc nền", Object.keys(S.md.nhac || {}).map(function (k) { var t = TEN_NHAC[k] || k; return khop(t, "dt:nhac:" + k) ? nutND(v, "dt:nhac:" + k, t) : ""; }).join(""), true);
    var tieng = S.md.tieng || {};
    NHOM.forEach(function (n) {
      dt += nhanh(n.ten, Object.keys(tieng).filter(function (k) { return (tieng[k].nhom || "don") === n.ma; }).map(function (k) {
        return khop(tieng[k].ten || k, "dt:tieng:" + k) ? nutND(v, "dt:tieng:" + k, tieng[k].ten || k) : ""; }).join(""), n.ma === "chieu");
    });
    // người dùng 21/11/2026: âm thanh Đấu Trường chỉ nằm ở mục Đấu Trường; Quản trị chung chỉ giữ âm thanh dùng chung
    var html = v.nhanh === "dt" ? nhanh("⚔️ Đấu Trường Tri Thức", dt, true) : "";
    if (v.nhanh === "tdo") {
      var tt = (S.md.tdo || {}).tieng || {}, ndt = "";
      if (khop("Độ to chung", "tdo:chung")) ndt += nutND(v, "tdo:chung", "🔊 Độ to chung");
      if (khop("Nhạc nền", "tdo:nhac:nen")) ndt += nutND(v, "tdo:nhac:nen", "🎵 Nhạc nền");
      if (khop("Lúc nào kêu nghĩ lâu gần hết giờ", "tdo:gio")) ndt += nutND(v, "tdo:gio", "⏱️ Lúc nào kêu (nghĩ lâu, gần hết giờ)");
      NHOM_T.forEach(function (n) {
        ndt += nhanh(n.ten, Object.keys(tt).filter(function (k) { return (tt[k].nhom || "choi") === n.ma; }).map(function (k) {
          return khop(tt[k].ten || k, "tdo:tieng:" + k) ? nutND(v, "tdo:tieng:" + k, tt[k].ten || k) : ""; }).join(""), true);
      });
      html += nhanh("⚡ Âm thanh riêng của Tốc độ", ndt, true)
        + '<p class="qktSau">✅ Đúng, ❌ Sai, 💎 kim cương dùng chung cả app: chỉnh ở Quản trị chung › 🎵 Âm thanh chung.</p>';
    }
    if (v.nhanh === "chung") {
var tc = (S.md.chung || {}).tieng || {}, ndc = Object.keys(tc).filter(function (k) { return khop(tc[k].ten || k, "chung:tieng:" + k); }).map(function (k) { return nutND(v, "chung:tieng:" + k, tc[k].ten || k); }).join("");
      if (khop("Lời khen động viên", "chung:loi")) ndc += nutND(v, "chung:loi", "💬 Lời khen và động viên");
      if (khop("Giọng đọc câu nghe", "chung:doc")) ndc += nutND(v, "chung:doc", "🗣️ Giọng đọc câu nghe");
      html += nhanh("🔔 Âm thanh dùng chung mọi màn hỏi", ndc, true)
        + '<p class="qktSau">Âm thanh riêng của từng game nằm trong mục của game đó, ví dụ ⚔️ Đấu Trường › 🎛️ Thông số › 🔊 Âm thanh.</p>';
      var mc = khoMoCoi();
      if (mc.length) html += '<button type="button" class="qktNut' + (v.chon === "mocoi" ? " dangChon" : "") + '" data-kt="chon" data-khoa="mocoi"><span class="qktNutTen">🗂️ File chưa thuộc nội dung nào</span><b class="qktSo">' + mc.length + "</b></button>";
    }
    return '<div class="qktCayRuot">' + (html || '<p class="adminGhiChu">Không có nội dung khớp.</p>') + "</div>";
  }

  function veChiTiet(v) {
    var lui = '<button type="button" class="adminNut adminNutPhu qktLui" data-kt="lui">← Quay lại</button>';
    if (!v.chon) return '<div class="qktTrong"><p>👈 Bấm một nội dung bên trái để nghe âm thanh hiện tại, thay file hoặc chỉnh cài đặt.</p>'
      + '<p class="adminGhiChu">Chỉ dùng file được phép dùng miễn phí (CC0: opengameart.org, freesound.org mục CC0, kenney.nl). Nhạc nền tối đa <b>2,5 MB</b>, tiếng ngắn tối đa <b>150 KB</b>; nhận .mp3, .ogg, .wav, .m4a.</p></div>';
    if (v.chon === "mocoi") return lui + veMoCoi();
    if (/^chung:(loi|doc)$/.test(v.chon) || v.chon === "tdo:gio") return lui + veCaiDatChung(v.chon);
    var khoa = v.chon, c = chia(khoa), h = lui + '<h4 class="qktTieuDe">' + T(tenND(khoa)) + ' <code>' + T(c.k || "amLuong") + "</code></h4>";
    if (c.loai === "chung") {
      var a = gocCH(S.ht, khoa).amLuong || {}, m = gocCH(S.md, khoa).amLuong || {}, pa = c.nhanh === "tdo" ? "tdo.amLuong." : "amLuong.";
      return h + '<div class="qktKhoi"><p class="adminGhiChu">Độ to chung của cả ' + (c.nhanh === "tdo" ? "⚡ Tốc độ" : "Đấu Trường") + '. Từng tiếng còn có độ to riêng ở nội dung của nó.</p>'
        + soO(pa + "tieng", "Độ to mọi tiếng hiệu ứng", a.tieng, m.tieng, 0, c.nhanh === "tdo" ? 2 : 1, 0.05)
        + soO(pa + "nhac", "Độ to nhạc nền", a.nhac, m.nhac, 0, 1, 0.01)
        + (c.nhanh === "tdo" ? "" : soO("amLuong.nhacKhiDoc", "Nhạc còn bấy nhiêu phần khi máy đọc câu hỏi", a.nhacKhiDoc, m.nhacKhiDoc, 0, 1, 0.05))
        + nutLuu(khoa) + "</div>";
    }
    var dang = fileCua(S.ht, khoa), muc = timMuc(dang, c.loai), mdF = fileCua(S.md, khoa);
    var tenTrong = c.nhanh === "tdo" && c.loai === "nhac" ? ((gocCH(S.ht, khoa).nhacNen || {}).tuTao === false ? "🔇 Để trống (im lặng)" : "🥁 Nhạc trống tự tạo")
      : c.loai === "nhac" ? TRONG_NHAC[c.k] || "🔇 Để trống" : "🎛️ Tiếng tự tạo (không file)";
    h += '<div class="qktKhoi qktDang"><span>Đang dùng: <b>' + T(muc ? (muc.kho ? "📁 " : "") + muc.ten : tenTrong) + "</b></span>"
      + '<button type="button" class="adminNut adminNutThanhCong" data-kt="nghe-nd">' + (c.nhanh === "chung" ? "▶ Nghe thử" : c.nhanh === "tdo" && c.loai === "nhac" ? "▶ Nghe thử (giả lập 24 giây cuối)" : "▶ Nghe như trong trận") + '</button>'
      + (c.loai === "nhac" ? '<button type="button" class="adminNut adminNutPhu" data-kt="dung">⏹ Dừng</button>' : "") + "</div>";
    // các file
    var ds = ungVien(khoa);
    h += '<div class="qktKhoi"><h5>Các file của nội dung này <small>(tích ◉ = file mặc định)</small></h5><div class="qktDsFile" role="radiogroup">'
      + dongFile(khoa, "", tenTrong, dang === "", false, null)
      + ds.map(function (f) { return dongFile(khoa, f.ma, f.ten, dang === f.ma, f.ma === mdF, f); }).join("") + "</div>"
      + '<div class="qktNutHang"><label class="adminNut adminNutThanhCong qktTaiNut">⬆️ Tải file khác lên<input type="file" data-kt="tep" accept=".mp3,.ogg,.wav,.m4a,audio/mpeg,audio/ogg,audio/wav,audio/mp4" hidden></label>'
      + '<button type="button" class="adminNut adminNutPhu" data-kt="moTv">📚 Chọn từ thư viện</button></div>'
      + '<div class="qktTv" data-kt-tv hidden>' + veChonTv(khoa) + "</div>"
      + '<p class="qktTin" data-kt-tin role="status"></p></div>';
    // cài đặt
    if (c.loai === "tieng") {
      var d = dong(gocCH(S.ht, khoa), c.k), dm = dong(gocCH(S.md, khoa), c.k), p = (laRieng(c.nhanh) ? c.nhanh + "." : "") + "tieng." + c.k + ".";
      h += '<div class="qktKhoi"><h5>Cài đặt</h5><div class="qktLuoiO">'
        + '<label class="qktO qktChon"><input type="checkbox" data-kt-o="' + p + 'bat"' + (d.bat !== false ? " checked" : "") + "> <span>Có kêu</span></label>"
        + soO(p + "amLuong", "Độ to cả nội dung (0 - 2)", d.amLuong, dm.amLuong, 0, 2, 0.05)
        + (dang ? soO(p + "amTep", "Độ to riêng của file (0 - 2)", d.amTep, dm.amTep, 0, 2, 0.05)
          + '<label class="qktO"><span>Kiểu</span><select data-kt-o="' + p + 'kieu"><option value="chong"' + (d.kieu !== "thay" ? " selected" : "") + '>Chồng (file + tiếng tự tạo)</option><option value="thay"' + (d.kieu === "thay" ? " selected" : "") + ">Thay (chỉ file)</option></select></label>"
          + soO(p + "tre", "Chờ bao lâu rồi file mới kêu (giây)", d.tre, dm.tre, 0, 5, 0.05) : "")
        + "</div>" + nutLuu(khoa) + "</div>";
    } else if (c.nhanh === "tdo") {
      var nn = gocCH(S.ht, khoa).nhacNen || {};
      h += '<div class="qktKhoi"><h5>Cài đặt</h5><p class="adminGhiChu">Độ to nhạc nền chỉnh ở 🔊 Độ to chung. File tải lên luôn phát lặp lại.</p><div class="qktLuoiO">'
        + '<label class="qktO qktChon"><input type="checkbox" data-kt-o="tdo.nhacNen.nhanhDan"' + (nn.nhanhDan !== false ? " checked" : "") + "> <span>Nhanh dần khi gần hết giờ (3 nấc, mốc ở ⏱️ Lúc nào kêu)</span></label>"
        + '<label class="qktO qktChon"><input type="checkbox" data-kt-o="tdo.nhacNen.tuTao"' + (nn.tuTao !== false ? " checked" : "") + "> <span>Không có file thì phát nhạc trống tự tạo</span></label>"
        + "</div>" + nutLuu(khoa) + "</div>";
    } else h += '<div class="qktKhoi">' + '<p class="adminGhiChu">Độ to nhạc nền chỉnh ở 🔊 Độ to chung; lặp lại / độ to riêng của file tải lên: bấm ✏️ ở file.</p>' + nutLuu(khoa) + "</div>";
    return h;
  }
  function veCaiDatChung(khoa) {
    var c = chia(khoa), h = '<h4 class="qktTieuDe">' + T(tenND(khoa)) + " <code>" + T(c.loai) + "</code></h4>";
    if (c.loai === "gio") {
      var g = gocCH(S.ht, khoa).hoiHop || {}, gm = gocCH(S.md, khoa).hoiHop || {};
      return h + '<div class="qktKhoi"><p class="adminGhiChu">Các mốc giây làm trận thêm hồi hộp. Tiếng của từng lúc (🤔 nghĩ lâu, ⏳ gần hết giờ, 🌪️ nhạc lên nhịp) chỉnh ở nội dung của nó trong cây.</p><div class="qktLuoiO">'
        + soO("tdo.hoiHop.nghiLauGiay", "🤔 Bé chưa chọn sau bấy nhiêu giây thì nhắc (0 = tắt)", g.nghiLauGiay, gm.nghiLauGiay, 0, 60, 1)
        + soO("tdo.hoiHop.nhacLaiGiay", "🤔 Vẫn nghĩ tiếp: nhắc lại sau bấy nhiêu giây (0 = một lần)", g.nhacLaiGiay, gm.nhacLaiGiay, 0, 60, 1)
        + soO("tdo.hoiHop.nhanhDanGiay", "🌪️ Còn bấy nhiêu giây: nhạc lên nhịp lần 1", g.nhanhDanGiay, gm.nhanhDanGiay, 0, 120, 1)
        + soO("tdo.hoiHop.ganHetGioGiay", "⏳ Còn bấy nhiêu giây: tích tắc + nhạc lên nhịp lần 2 (nửa số này: lần 3)", g.ganHetGioGiay, gm.ganHetGioGiay, 0, 60, 1)
        + "</div>" + nutLuu(khoa) + "</div>";
    }
    if (c.loai === "doc") {
      var a = gocCH(S.ht, khoa).docCau || {}, m = gocCH(S.md, khoa).docCau || {};
      return h + '<div class="qktKhoi"><p class="adminGhiChu">Chỉ câu có phần nghe (câu "nghe và chọn") mới được đọc thành tiếng. Giọng là giọng có sẵn của máy / trình duyệt.</p><div class="qktLuoiO">'
        + soO("chung.docCau.tocEn", "Tốc độ đọc tiếng Anh (0,5 - 1,5)", a.tocEn, m.tocEn, 0.5, 1.5, 0.05)
        + soO("chung.docCau.tocVi", "Tốc độ đọc tiếng Việt (0,5 - 1,5)", a.tocVi, m.tocVi, 0.5, 1.5, 0.05)
        + soO("chung.docCau.amLuong", "Độ to giọng đọc (0 - 1)", a.amLuong, m.amLuong, 0, 1, 0.05)
        + '</div><div class="qktNutHang"><button type="button" class="adminNut adminNutThanhCong" data-kt="nghe-nd">▶ Nghe thử một từ</button></div>' + nutLuu(khoa) + "</div>";
    }
    var l = gocCH(S.ht, khoa).loiKhen || {}, lm = gocCH(S.md, khoa).loiKhen || {}, p = "chung.loiKhen.";
    return h + '<div class="qktKhoi"><p class="adminGhiChu">Sau mỗi câu trả lời, bé từ lớp <b>' + T(l.tuLop) + '</b> trở xuống nghe một lời khen (đúng) hoặc động viên (sai). Lớp lớn hơn chỉ nghe tiếng đúng / sai. Mỗi dòng là một câu; máy chọn ngẫu nhiên, không nói lại câu vừa rồi.</p><div class="qktLuoiO">'
      + '<label class="qktO qktChon"><input type="checkbox" data-kt-o="' + p + 'bat"' + (l.bat !== false ? " checked" : "") + "> <span>Có lời khen / động viên</span></label>"
      + soO(p + "tuLop", "Từ lớp này trở xuống (0 - 12)", l.tuLop, lm.tuLop, 0, 12, 1)
      + soO(p + "xacSuat", "Tỉ lệ số câu có lời (0 - 1)", l.xacSuat, lm.xacSuat, 0, 1, 0.05)
      + soO(p + "toc", "Tốc độ đọc (0,5 - 1,5)", l.toc, lm.toc, 0.5, 1.5, 0.05)
      + soO(p + "amLuong", "Độ to (0 - 1)", l.amLuong, lm.amLuong, 0, 1, 0.05)
      + '</div><label class="qktO"><span>💬 Lời khen khi trả lời ĐÚNG (mỗi dòng một câu)</span><textarea rows="8" data-kt-ta="khen">' + T((l.khen || []).join("\n")) + "</textarea></label>"
      + '<label class="qktO"><span>🤗 Lời động viên khi trả lời SAI (mỗi dòng một câu)</span><textarea rows="8" data-kt-ta="dongVien">' + T((l.dongVien || []).join("\n")) + "</textarea></label>"
      + '<div class="qktNutHang"><button type="button" class="adminNut adminNutThanhCong" data-kt="nghe-nd">▶ Nghe thử một câu khen</button><button type="button" class="adminNut adminNutPhu" data-kt="nghe-nd2">▶ Nghe thử một câu động viên</button></div>'
      + nutLuu(khoa) + "</div>";
  }
  function soO(duong, nhan, v, md, min, max, buoc) {
    return '<label class="qktO"><span>' + T(nhan) + ' <small>mặc định ' + T(md) + "</small></span>"
      + '<input type="number" data-kt-o="' + T(duong) + '" min="' + min + '" max="' + max + '" step="' + buoc + '" value="' + T(v) + '"></label>';
  }
  function nutLuu(khoa) {
    var cl = chuaLuu(khoa);
    return '<div class="qktNutHang"><button type="button" class="adminNut adminNutThanhCong" data-kt="luu"' + (cl ? "" : " disabled") + ">💾 Lưu</button>"
      + '<button type="button" class="adminNut adminNutPhu" data-kt="macdinh">↺ Mặc định</button>'
      + (cl ? '<span class="qktChuaLuu">● chưa lưu</span>' : "") + "</div>";
  }
  function dongFile(khoa, ma, ten, tich, laMd, f) {
    var meta = [];
    if (f && f.kho) { meta.push("📁 tải lên", kb(f.kho.co)); if (f.kho.giay) meta.push(giay(f.kho.giay)); if (Number(f.kho.amLuong) !== 1) meta.push("độ to " + f.kho.amLuong); if (chia(khoa).loai === "nhac") meta.push(f.kho.lap ? "lặp" : "một lần"); }
    else if (f && !f.mat) meta.push("📚 thư viện có sẵn");
    if (laMd) meta.push("mặc định gốc");
    var luuDang = fileCua(S.daLuu, khoa) === ma, coXoa = ma && !tich && !laMd && !luuDang;
    return '<div class="qktFile' + (tich ? " tich" : "") + (f && f.mat ? " mat" : "") + '" data-ma="' + T(ma) + '">'
      + '<label class="qktFileChon"><input type="radio" name="qktMd_' + T(khoa) + '" data-kt="tich" value="' + T(ma) + '"' + (tich ? " checked" : "") + ">"
      + '<span><b>' + T(ten) + "</b>" + (f && f.mat ? '<small class="qktDo">⚠️ không còn trong kho</small>' : meta.length ? "<small>" + T(meta.join(" · ")) + "</small>" : "") + "</span></label>"
      + '<button type="button" class="qktTron" data-kt="nghe-f" title="Nghe file này" aria-label="Nghe"' + (f && f.mat ? " disabled" : "") + ">" + (nghe && nghe.khoa === khoa + "|" + ma ? "⏹" : "▶") + "</button>"
      + (f && f.kho ? '<button type="button" class="qktTron phu" data-kt="suaF" title="Sửa tên / độ to file" aria-label="Sửa">✏️</button>' : "")
      + (ma ? '<button type="button" class="qktTron xoa" data-kt="xoaF" title="' + (coXoa ? "Bỏ file khỏi nội dung" : "Đang là mặc định: tích file khác rồi 💾 Lưu trước") + '" aria-label="Xoá"' + (coXoa ? "" : " disabled") + ">🗑️</button>" : "")
      + "</div>";
  }
  function veChonTv(khoa) {
    var c = chia(khoa), co = ungVien(khoa).map(function (f) { return f.ma; });
    var ds = (c.loai === "nhac" ? S.tv.nhac : S.tv.tieng).filter(function (m) { return co.indexOf(m.ma) < 0 && (!laRieng(c.nhanh) || m.kho); });
    if (!ds.length) return '<p class="adminGhiChu">Thư viện không còn file nào khác.</p>';
    return '<div class="qktNutHang"><select data-kt="tvChon">' + ds.map(function (m) {
      return '<option value="' + T(m.ma) + '">' + T((m.kho ? "📁 " : "") + (m.ten || m.ma) + " (" + m.ma + ")") + "</option>"; }).join("") + "</select>"
      + '<button type="button" class="adminNut adminNutThanhCong" data-kt="tvThem">➕ Thêm</button></div>';
  }
  function veMoCoi() {
    var ds = khoMoCoi();
    return '<h4 class="qktTieuDe">🗂️ File chưa thuộc nội dung nào</h4><div class="qktKhoi"><p class="adminGhiChu">File đã tải lên nhưng không gắn vào nội dung nào. Nghe thử rồi xoá cho gọn, hoặc vào một nội dung › 📚 Chọn từ thư viện để dùng lại.</p>'
      + (ds.length ? '<div class="qktDsFile">' + ds.map(function (k) {
        return '<div class="qktFile" data-ma="' + T(k.ma) + '"><span class="qktFileChon"><span><b>' + T(k.ten) + "</b><small>" + T([k.ma, k.loai === "nhac" ? "nhạc nền" : "tiếng ngắn", kb(k.co), giay(k.giay)].filter(Boolean).join(" · ")) + "</small></span></span>"
          + '<button type="button" class="qktTron" data-kt="nghe-f" aria-label="Nghe">' + (nghe && nghe.khoa === "mocoi|" + k.ma ? "⏹" : "▶") + "</button>"
          + '<button type="button" class="qktTron xoa" data-kt="xoaHan" aria-label="Xoá hẳn" title="Xoá hẳn khỏi máy chủ">🗑️</button></div>';
      }).join("") + "</div>" : '<p class="adminGhiChu">Không còn file nào. 👍</p>') + "</div>";
  }

  // ---------------- nghe ----------------
  function dungNghe() {
    if (nghe) { try { nghe.audio.pause(); } catch (e) { /* bỏ qua */ } nghe = null; }
    if (am) am.then(function (a) { a.dungNhac(0.3); }).catch(function () {});
    if (window.KC_TDO_AM) KC_TDO_AM.dungThu();
  }
  function ngheFile(khoaNghe, url, amLuong) {
    var dang = nghe && nghe.khoa === khoaNghe;
    dungNghe();
    if (dang || !url) { veTatCa(); return; }
    var a = new Audio(url);
    a.volume = Math.max(0, Math.min(1, Number(amLuong) || 1));
    a.onended = function () { if (nghe && nghe.audio === a) { nghe = null; veTatCa(); } };
    nghe = { khoa: khoaNghe, audio: a };
    a.play().catch(function (e) { nghe = null; veTatCa(); adminBaoTin("❌ Không phát được file: " + e.message, false); });
    veTatCa();
  }
  function boTieng() {
    return am || (am = import("./dt/3d/dt3d_am_thanh.js").then(function (m) { return m.taoAmThanh({ cauHinh: boChung(S.ht), batLuon: true }); }));
  }
  function ngheChung(khoa, loi2) { // KC_09B2: nghe thử nội dung Âm thanh chung bằng cài đặt đang sửa (cả ô chưa lưu)
    var c = chia(khoa), A = window.KC_AM_THANH, h = gocCH(S.ht, khoa);
    dungNghe();
    if (!A) { adminBaoTin("Trang chưa nạp module âm thanh chung", false); return; }
    A.datBat(true);
    if (c.loai === "loi") { var ds = (loi2 ? h.loiKhen.dongVien : h.loiKhen.khen) || []; var chu = ds[Math.floor(Math.random() * ds.length)]; if (!chu) { adminBaoTin("Danh sách đang trống", true); return; } A.doc(chu, { lang: "vi-VN", toc: Number(h.loiKhen.toc) || 1, amLuong: h.loiKhen.amLuong }); return; }
    if (c.loai === "doc") { A.datCauHinh(chep(h)); A.doc("apple", { lang: "en-US" }); return; }
    var d = Object.assign({}, dong(h, c.k), { bat: true }), muc = d.file && timMuc(d.file, "tieng");
    if (muc && muc.url) {
      var au = new Audio(muc.url); au.volume = Math.max(0, Math.min(1, (Number(d.amLuong) || 0) * (Number(d.amTep) || 0))); au.play().catch(function (e) { adminBaoTin("❌ Không phát được file: " + e.message, false); });
      if (d.kieu !== "chong") return;
    }
    var o = {}; o[c.k] = Object.assign({}, d, { file: "" }); A.datCauHinh({ tieng: o }); A.tieng[c.k](1);
  }
  function ngheTdo(khoa) { // KC_03C5c: nghe thử âm thanh ⚡ Tốc độ bằng cài đặt đang sửa (cả ô chưa lưu)
    var c = chia(khoa), A = window.KC_TDO_AM;
    dungNghe();
    if (!A) { adminBaoTin("Trang chưa nạp âm thanh Tốc độ (tt_tri_thuc/tt_toc_do_am.js)", false); return; }
    if (window.KC_AM_THANH) KC_AM_THANH.datBat(true);
    var h = chep(gocCH(S.ht, khoa));
    if (c.loai === "tieng") { h.tieng = h.tieng || {}; h.tieng[c.k] = Object.assign(dong(h, c.k), { bat: true }); }
    A.datCauHinh(h, function (ma) { var m = timMuc(ma, c.loai === "nhac" ? "nhac" : "tieng"); return m && m.url; });
    if (c.loai === "nhac") { A.thuNhac(); veTatCa(); return; }
    if (c.loai === "tieng") A.thu(c.k);
  }
  function ngheNoiDung(khoa) { // ▶ như trong trận: bộ tiếng thật với cài đặt đang sửa (cả ô chưa lưu)
    var c = chia(khoa);
    dungNghe();
    boTieng().then(function (a) {
      a.moKhoa(); a.datCauHinh(boChung(S.ht));
      if (c.loai === "tieng") { a.thu(c.k); return; }
      var ma = fileCua(S.ht, khoa);
      if (ma) a.phatNhac({ ma: ma, tu: 0 });
      else if (c.k === "thang" || c.k === "thua") a.doanKet(c.k === "thang");
      else adminBaoTin("Nội dung này đang để trống: trận im lặng.", true);
    }).catch(function (e) { adminBaoTin("❌ Không mở được bộ tiếng: " + e.message, false); });
  }

  // ---------------- lưu ----------------
  function luu() {
    if (!S.coMayChu) { adminBaoTin("❌ Chưa nối được máy chủ, chưa lưu được", false); return; }
    var sua = window.KC_DT_CAU_HINH ? KC_DT_CAU_HINH.khac(boChung(S.md), boChung(S.ht)) || {} : null;
    if (!sua) return;
    var suaC = KC_DT_CAU_HINH.khac(S.md.chung || {}, S.ht.chung || {}) || {};
    var cu = {}; // file mặc định cũ của các nội dung đổi file: giữ lại trong danh sách ("để file cũ")
    dsND("all").forEach(function (n) { var a = fileCua(S.daLuu, n), b = fileCua(S.ht, n); if (a && a !== b && a !== fileCua(S.md, n)) cu[n] = a; });
    goi("kc_dt_admin_luu_thong_so", { p_ten: TEN_TEP, p_sua: sua, p_ghi_chu: "🎵 Kho tiếng" }).then(function (kq) {
      if (!kq.thanhCong) { adminBaoTin("❌ " + kq.thongBao, false); return; }
      // chỉ gọi máy chủ cho file chung khi PHẦN CHUNG có đổi (nơi chưa chạy SQL KC_09B2 vẫn lưu được Đấu Trường)
      return giong(S.ht.chung, S.daLuu.chung) ? kq : goi("kc_dt_admin_luu_thong_so", { p_ten: TEN_TEP_C, p_sua: suaC, p_ghi_chu: "🔊 Âm thanh chung" });
    }).then(function (kq) {
      if (!kq || !kq.thanhCong) return kq;
      // KC_03C5c: file âm thanh ⚡ Tốc độ, chỉ gọi khi phần Tốc độ có đổi (cần SQL KC_03C5c)
      var suaT = KC_DT_CAU_HINH.khac(S.md.tdo || {}, S.ht.tdo || {}) || {};
      return giong(S.ht.tdo, S.daLuu.tdo) ? kq : goi("kc_dt_admin_luu_thong_so", { p_ten: TEN_TEP_T, p_sua: suaT, p_ghi_chu: "⚡ Âm thanh Tốc độ" }).then(function (k2) {
        if (k2 && !k2.thanhCong && k2.ma === "ten") k2.thongBao = "Máy chủ chưa nhận cài đặt âm thanh Tốc độ (cần chạy SQL KC_03C5c)";
        return k2;
      });
    }).then(function (kq) {
      if (!kq) return;
      if (!kq.thanhCong) { adminBaoTin("❌ " + kq.thongBao, false); return; }
      return Promise.all(Object.keys(cu).map(function (n) {
        if ((S.gan[n] || []).indexOf(cu[n]) >= 0) return null;
        (S.gan[n] = S.gan[n] || []).push(cu[n]);
        return goi("kc_am_thanh_admin_gan_them", { p_noi_dung: n, p_ma: cu[n] });
      })).then(function () {
        S.daLuu = chep(S.ht);
        try { window.dispatchEvent(new CustomEvent("kcAmThanhDaLuu", { detail: { ch: boChung(S.daLuu) } })); } catch (e) { /* bỏ qua */ }
        if (window.KC_AM_THANH) { KC_AM_THANH.datCauHinh(chep(S.daLuu.chung)); KC_AM_THANH.taiCauHinh(true); }
        if (window.KC_TDO_AM) KC_TDO_AM.taiCauHinh(true);
        adminBaoTin("✅ Đã lưu. Game dùng âm thanh mới từ lần bé mở trang kế tiếp.", true);
        veTatCa();
      });
    });
  }

  // ---------------- tải file lên ----------------
  function bao(v, tin, kieu) { var o = v.goc.querySelector("[data-kt-tin]"); if (o) { o.textContent = tin || ""; o.className = "qktTin" + (kieu ? " " + kieu : ""); } }
  function giaiMa(tep) {
    return tep.arrayBuffer().then(function (buf) {
      var AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!AC) return null;
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
  function taiLen(v, khoa, tep) {
    var loai = chia(khoa).loai, duoi = ((/\.([a-z0-9]+)$/i.exec(tep.name) || [])[1] || "").toLowerCase(), gh = KT.GIOI_HAN[loai];
    if (KT.DUOI.indexOf(duoi) < 0) { bao(v, "❌ Chỉ nhận file .mp3, .ogg, .wav, .m4a", "loi"); return; }
    if (tep.size > gh) { bao(v, "❌ File " + kb(tep.size) + " quá cỡ: " + (loai === "nhac" ? "nhạc nền" : "tiếng ngắn") + " tối đa " + kb(gh) + ". Hãy nén nhỏ file lại.", "loi"); return; }
    var c = client();
    if (!c || !c.storage) { bao(v, "❌ Trang chưa nối được Supabase Storage", "loi"); return; }
    var ten = tep.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 80) || "file";
    var tg = null, duongDan = null;
    bao(v, "⏳ Đang kiểm file…", "");
    giaiMa(tep).catch(function () { throw new Error("File không phải âm thanh hoặc bị hỏng, trình duyệt không mở được"); }).then(function (g) {
      tg = g; return bam(tep);
    }).then(function (ma) {
      return goi("kc_am_thanh_admin_xin_tai", { p_ma_bam: ma, p_duoi: duoi, p_loai: loai, p_co: tep.size });
    }).then(function (kq) {
      if (!kq.thanhCong) throw new Error(kq.thongBao);
      if (kq.trung) return kq;
      duongDan = kq.duongDan;
      var len = kq.canTai ? (bao(v, "⏳ Đang tải lên " + kb(tep.size) + "…", ""), c.storage.from(KT.BUCKET).upload(duongDan, tep, { contentType: KT.MIME[duoi], cacheControl: "31536000", upsert: false }).then(function (up) {
        if (up && up.error && !/exist|duplicate/i.test(up.error.message || "")) throw new Error("Không tải được file lên: " + up.error.message);
      })) : Promise.resolve();
      return len.then(function () {
        return goi("kc_am_thanh_admin_luu", { p_id: null, p_duong_dan: duongDan, p_loai: loai, p_ten: ten, p_giay: tg, p_lap: true, p_am_luong: 1, p_nguon: null, p_giay_phep: "CC0" });
      }).then(function (k) {
        if (k.ma === "co" && k.canXoa) return c.storage.from(KT.BUCKET).remove([k.duongDan]).then(function () { throw new Error(k.thongBao); });
        if (!k.thanhCong) throw new Error(k.thongBao);
        return k;
      });
    }).then(function (kq) {
      var muc = kq.muc;
      return goi("kc_am_thanh_admin_gan_them", { p_noi_dung: khoa, p_ma: muc.ma }).then(function (g) {
        if (!g.thanhCong) throw new Error(g.thongBao);
        return taiLaiKho().then(function () {
          datFile(khoa, muc.ma);
          veTatCa();
          bao(v, (kq.trung ? "ℹ️ File này đã có trong kho (" + muc.ten + "), đã đưa vào nội dung này" : "✅ Đã tải lên " + muc.ten)
            + " và tích làm mặc định. Bấm ▶ nghe, đạt thì 💾 Lưu.", "ok");
        });
      });
    }).catch(function (e) { bao(v, "❌ " + ((e && e.message) || "Có lỗi"), "loi"); });
  }
  function taiLaiKho() {
    return Promise.all([goi("kc_am_thanh_admin_ds"), (KT.baoDoi(), KT.ds({ moi: true })), fetch(URL_TV, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })]).then(function (kq) {
      var kd = kq[0];
      if (kd && kd.thanhCong) {
        S.kho = kd.ds || []; S.gan = {};
        (kd.gan || []).forEach(function (g) { (S.gan[g.noiDung] = S.gan[g.noiDung] || []).push(g.ma); });
      }
      S.tv = KT.tron({ nhac: kq[2].nhac || [], tieng: kq[2].tieng || [] }, kq[1]);
    });
  }
  function xoaHanTep(kq) { // có vé xoá: xoá trên Storage rồi báo máy chủ bỏ dòng
    var c = client();
    var buoc = kq.coTep ? c.storage.from(KT.BUCKET).remove([kq.duongDan]).then(function (r) { if (r && r.error) throw new Error("Không xoá được file: " + r.error.message); }) : Promise.resolve();
    return buoc.then(function () { return goi("kc_am_thanh_admin_xoa_xong", { p_id: kq.id }); }).then(function (k) { if (!k.thanhCong) throw new Error(k.thongBao); });
  }

  // ---------------- sự kiện ----------------
  function vCua(el) { return views.find(function (v) { return v.goc.contains(el); }); }
  function suKien(goc) {
    goc.addEventListener("click", function (su) {
      var nut = su.target.closest("[data-kt]"), v = vCua(su.target);
      if (!nut || !v || nut.disabled) return;
      var viec = nut.getAttribute("data-kt"), dongF = nut.closest(".qktFile"), ma = dongF ? dongF.getAttribute("data-ma") : null;
      if (viec === "chon") { v.chon = nut.getAttribute("data-khoa"); v.moChiTiet = true; dungNghe(); ve(v); var p = v.goc.querySelector(".qktPhai"); if (p && p.scrollIntoView && innerWidth < 900) p.scrollIntoView(); }
      else if (viec === "lui") { v.moChiTiet = false; ve(v); }
      else if (viec === "tailai") { dungNghe(); S.daTai = false; tai(); }
      else if (viec === "luu") luu();
      else if (viec === "bo") { if (confirm("Bỏ mọi thay đổi chưa lưu?")) { S.ht = chep(S.daLuu); veTatCa(); } }
      else if (viec === "macdinh") ganMacDinh(v.chon);
      else if (viec === "nghe-nd") { if (/^chung:/.test(v.chon)) ngheChung(v.chon); else if (/^tdo:/.test(v.chon)) ngheTdo(v.chon); else ngheNoiDung(v.chon); }
      else if (viec === "nghe-nd2") ngheChung(v.chon, true);
      else if (viec === "dung") { dungNghe(); veTatCa(); }
      else if (viec === "nghe-f") {
        if (v.chon === "mocoi") { var k = S.kho.find(function (x) { return x.ma === ma; }); ngheFile("mocoi|" + ma, k && KT.urlTep(k.duongDan, client()), k && k.amLuong); return; }
        if (!ma) { if (/^chung:/.test(v.chon)) { ngheChung(v.chon); return; } if (/^tdo:/.test(v.chon)) { var cu0 = gocCH(S.ht, v.chon), cn = chia(v.chon); if (cn.loai === "nhac") { cu0.nhac = cu0.nhac || {}; var f0 = cu0.nhac[cn.k]; cu0.nhac[cn.k] = ""; ngheTdo(v.chon); cu0.nhac[cn.k] = f0; } else { var t0 = dong(cu0, cn.k); cu0.tieng[cn.k] = Object.assign({}, t0, { file: "" }); ngheTdo(v.chon); cu0.tieng[cn.k] = t0; } return; } ngheTuTao(v.chon); return; }
        var f = timMuc(ma, chia(v.chon).loai); ngheFile(v.chon + "|" + ma, f && f.url, f && f.amLuong);
      }
      else if (viec === "moTv") { var tv = v.goc.querySelector("[data-kt-tv]"); if (tv) tv.hidden = !tv.hidden; }
      else if (viec === "tvThem") themTuTv(v);
      else if (viec === "xoaF") boFile(v, v.chon, ma);
      else if (viec === "xoaHan") xoaMoCoi(ma);
      else if (viec === "suaF") suaFile(ma);
    });
    goc.addEventListener("change", function (su) {
      var t = su.target, v = vCua(t);
      if (!v) return;
      if (t.getAttribute("data-kt") === "tich") { datFile(v.chon, t.value); dungNghe(); ve(v); veTatCaKhac(v); return; }
      if (t.getAttribute("data-kt") === "tep") { if (t.files && t.files[0]) taiLen(v, v.chon, t.files[0]); t.value = ""; return; }
      if (t.hasAttribute("data-kt-o")) {
        // ô số: KHÔNG vẽ lại khung chi tiết (bấm 💾 ngay sau khi gõ: ô mất tiêu điểm -> vẽ lại thay mất nút -> mất cú bấm); chỉ làm mới dấu ● ở cây
        if (t.type === "number") { nhanO(v, t, false); views.forEach(function (x) { var q = x.goc.querySelector(".qktCayRuot"); if (q) q.outerHTML = veCay(x); }); }
        else nhanO(v, t, true);
      }
    });
    goc.addEventListener("input", function (su) {
      var t = su.target, v = vCua(t);
      if (!v) return;
      if (t.getAttribute("data-kt") === "tim") { v.tim = t.value; var q = v.goc.querySelector(".qktCayRuot"); if (q) q.outerHTML = veCay(v); return; }
      if (t.hasAttribute("data-kt-o") && t.type === "number") nhanO(v, t, false);
      if (t.hasAttribute("data-kt-ta")) { var hl = gocCH(S.ht, "chung:loi"); hl.loiKhen = hl.loiKhen || {}; hl.loiKhen[t.getAttribute("data-kt-ta")] = t.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean); capNhatThanh(); }
    });
  }
  function veTatCaKhac(v) { views.forEach(function (x) { if (x !== v) ve(x); }); }
  function nhanO(v, t, veLai) {
    var duong = t.getAttribute("data-kt-o").split("."), gt;
    if (t.type === "checkbox") gt = t.checked;
    else if (t.type === "number") {
      gt = Number(t.value);
      var sai = t.value === "" || !isFinite(gt) || gt < Number(t.min) || gt > Number(t.max);
      t.classList.toggle("loi", sai);
      if (sai) return;
    } else gt = t.value;
    var o = S.ht;
    if (duong[0] === "chung" || duong[0] === "tdo") { o = gocCH(S.ht, duong[0] + ":x"); duong = duong.slice(1); }
    if (duong[0] === "tieng") { o.tieng = o.tieng || {}; o.tieng[duong[1]] = Object.assign(dong(o, duong[1]), o.tieng[duong[1]] || {}); }
    for (var i = 0; i < duong.length - 1; i++) { o[duong[i]] = o[duong[i]] || {}; o = o[duong[i]]; }
    o[duong[duong.length - 1]] = gt;
    if (veLai) { var dangO = document.activeElement === t; ve(v); veTatCaKhac(v); if (dangO) { var lai = v.goc.querySelector('[data-kt-o="' + t.getAttribute("data-kt-o") + '"]'); if (lai) lai.focus(); } }
    else capNhatThanh();
  }
  function capNhatThanh() {
    var so = soChuaLuu();
    views.forEach(function (v) {
      var th = v.goc.querySelector(".qktThanh"); if (!th) return;
      var sv = soChuaLuu(v.nhanh);
      th.classList.toggle("hien", sv > 0); th.querySelector("b").textContent = sv + " nội dung chưa lưu";
      var nl = v.goc.querySelector('.qktPhai [data-kt="luu"]'); if (nl && v.chon) nl.disabled = !chuaLuu(v.chon);
    });
  }
  function ganMacDinh(khoa) {
    var c = chia(khoa);
    if (c.nhanh === "tdo") {
      var ht = gocCH(S.ht, khoa), mt = gocCH(S.md, khoa);
      if (c.loai === "chung") ht.amLuong = chep(mt.amLuong || {});
      else if (c.loai === "gio") ht.hoiHop = chep(mt.hoiHop || {});
      else if (c.loai === "nhac") { ht.nhac = ht.nhac || {}; ht.nhac[c.k] = (mt.nhac || {})[c.k] || ""; ht.nhacNen = chep(mt.nhacNen || {}); }
      else { ht.tieng = ht.tieng || {}; ht.tieng[c.k] = chep((mt.tieng || {})[c.k] || {}); }
    }
    else if (c.nhanh === "chung") {
      var hc = gocCH(S.ht, khoa), mc = gocCH(S.md, khoa);
      if (c.loai === "loi") hc.loiKhen = chep(mc.loiKhen || {}); else if (c.loai === "doc") hc.docCau = chep(mc.docCau || {}); else hc.tieng[c.k] = chep((mc.tieng || {})[c.k] || {});
    }
    else if (c.loai === "chung") S.ht.amLuong = chep(S.md.amLuong || {});
    else if (c.loai === "nhac") S.ht.nhac[c.k] = (S.md.nhac || {})[c.k] || "";
    else S.ht.tieng[c.k] = chep((S.md.tieng || {})[c.k] || {});
    dungNghe(); veTatCa();
  }
  function ngheTuTao(khoa) {
    var c = chia(khoa);
    dungNghe();
    if (c.loai === "nhac") { if (c.k === "thang" || c.k === "thua") boTieng().then(function (a) { a.moKhoa(); var ch = chep(S.ht); ch.nhac[c.k] = ""; a.datCauHinh(ch); a.doanKet(c.k === "thang"); }); return; }
    boTieng().then(function (a) { a.moKhoa(); var ch = chep(S.ht); ch.tieng[c.k] = Object.assign(dong(ch, c.k), { file: "", bat: true }); a.datCauHinh(ch); a.thu(c.k); });
  }
  function themTuTv(v) {
    var o = v.goc.querySelector('[data-kt="tvChon"]'); if (!o || !o.value) return;
    var khoa = v.chon, ma = o.value;
    goi("kc_am_thanh_admin_gan_them", { p_noi_dung: khoa, p_ma: ma }).then(function (kq) {
      if (!kq.thanhCong) { adminBaoTin("❌ " + kq.thongBao, false); return; }
      (S.gan[khoa] = S.gan[khoa] || []).push(ma);
      veTatCa(); bao(v, "✅ Đã thêm vào danh sách. Tích ◉ để dùng làm mặc định.", "ok");
    });
  }
  function boFile(v, khoa, ma) {
    var f = timMuc(ma, chia(khoa).loai);
    if (!confirm("Bỏ file \"" + (f ? f.ten : ma) + "\" khỏi nội dung này?" + (f && f.kho ? "\nFile tải lên không còn dùng ở đâu sẽ bị xoá hẳn khỏi máy chủ." : ""))) return;
    goi("kc_am_thanh_admin_go", { p_noi_dung: khoa, p_ma: ma }).then(function (kq) {
      if (!kq.thanhCong) throw new Error(kq.thongBao);
      if (nghe && nghe.khoa === khoa + "|" + ma) dungNghe();
      return (kq.canXoaTep ? xoaHanTep(kq) : Promise.resolve()).then(function () {
        return taiLaiKho().then(function () { veTatCa(); bao(v, kq.canXoaTep ? "✅ Đã xoá hẳn file khỏi máy chủ." : "✅ Đã bỏ file khỏi nội dung này.", "ok"); });
      });
    }).catch(function (e) { adminBaoTin("❌ " + ((e && e.message) || "Có lỗi"), false); taiLaiKho().then(veTatCa); });
  }
  function xoaMoCoi(ma) {
    var k = S.kho.find(function (x) { return x.ma === ma; });
    if (!k || !confirm("Xoá hẳn file \"" + k.ten + "\" khỏi máy chủ?")) return;
    goi("kc_am_thanh_admin_xin_xoa", { p_id: k.id }).then(function (kq) {
      if (!kq.thanhCong) throw new Error(kq.thongBao + (kq.dangDung && kq.dangDung.length ? ": " + kq.dangDung.join(", ") : ""));
      return xoaHanTep({ id: k.id, duongDan: kq.duongDan, coTep: kq.coTep });
    }).then(function () { dungNghe(); return taiLaiKho(); }).then(function () { veTatCa(); adminBaoTin("✅ Đã xoá " + k.ten, true); })
      .catch(function (e) { adminBaoTin("❌ " + ((e && e.message) || "Có lỗi"), false); });
  }
  function suaFile(ma) {
    var k = S.kho.find(function (x) { return x.ma === ma; });
    if (!k) return;
    var ten = prompt("Tên file:", k.ten); if (ten === null) return;
    var to = prompt("Độ to riêng của file (0 - 2):", k.amLuong); if (to === null) return;
    var lap = k.loai === "nhac" ? confirm("Nhạc lặp lại liền? (OK = lặp, Huỷ = phát một lần)") : true;
    goi("kc_am_thanh_admin_luu", { p_id: k.id, p_duong_dan: null, p_loai: k.loai, p_ten: ten.trim(), p_giay: null, p_lap: lap, p_am_luong: Number(String(to).replace(",", ".")),
      p_nguon: k.nguon || null, p_giay_phep: k.giayPhep || "CC0" }).then(function (kq) {
      if (!kq.thanhCong) { adminBaoTin("❌ " + kq.thongBao, false); return; }
      taiLaiKho().then(function () { veTatCa(); adminBaoTin("✅ Đã sửa " + kq.muc.ten, true); });
    });
  }

  // ---------------- gắn vào trang ----------------
  window.QKT_CAY = {
    gan: function (o, tuyChon) { // gắn (hoặc gắn lại) một khung cây vào phần tử o; nhanh: "dt" (Đấu Trường) | "chung" (Quản trị chung) | "tdo" (⚡ Tốc độ, KC_03C5c)
      var nhanh = (tuyChon && tuyChon.nhanh) || "chung";
      var v = views.find(function (x) { return x.nhanh === nhanh; });
      if (!v) {
        var goc = document.createElement("div"); goc.className = "qktGocCay";
        v = { nhanh: nhanh, goc: goc, chon: null, moChiTiet: false, tim: "" };
        views.push(v); suKien(goc);
      }
      if (v.goc.parentNode !== o) { o.innerHTML = ""; o.appendChild(v.goc); }
      ve(v);
      if (!S.daTai && !S.dangTai) tai();
      return v;
    },
    taiLai: function () { S.daTai = false; return tai(); },
    dungNghe: dungNghe,
    _S: S, _am: function () { return am; } // cho kịch bản thử
  };

  var gocKho = document.getElementById("qktGoc");
  document.addEventListener("adminDaChuyenManHinh", function (su) {
    var ten = su.detail && su.detail.ten;
    dungNghe();
    if (ten === "khotieng" && gocKho) {
      window.QKT_CAY.gan(gocKho, { nhanh: "chung" });
      if (S.daTai) taiLaiKho().then(veTatCa); // mỗi lần mở: đọc lại danh sách file (tải / xoá ở nơi khác)
    }
  });
  if (gocKho && document.getElementById("manhinh-khotieng") && document.getElementById("manhinh-khotieng").classList.contains("dangHien")) window.QKT_CAY.gan(gocKho, { nhanh: "chung" });
})();
// 21/11/2026 - BƯỚC: KC_09B1
// 24/11/2026 - BƯỚC: KC_03C5c (nhánh "tdo": âm thanh riêng ⚡ Tốc độ, file cài đặt cau_hinh_am_thanh_toc_do)
