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
//   Dùng ở 2 chỗ, CHUNG một bộ dữ liệu: Quản trị › 🎵 Kho tiếng (cả cây, #qktGoc) và ⚔️ Đấu Trường › 🎛️ Thông số ›
//   🔊 Âm thanh (chỉ nhánh Đấu Trường, qt_dau_truong.js gọi QKT_CAY.gan(o, { nhanh: "dt" })).
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
    S.dangTai = Promise.all([md, goi("kc_dt_admin_thong_so"), goi("kc_am_thanh_admin_ds"), tvSan, KT.ds({ moi: true })]).then(function (kq) {
      var may = kq[1], kd = kq[2], tv = kq[3] || {};
      S.md = kq[0];
      S.coMayChu = !!(may && may.thanhCong);
      var sua = (S.coMayChu && may.sua && may.sua[TEN_TEP]) || null;
      S.daLuu = window.KC_DT_CAU_HINH ? KC_DT_CAU_HINH.tron(S.md, sua) : chep(S.md);
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
    if (c.loai === "nhac") return "🎵 " + (TEN_NHAC[c.k] || c.k);
    var d = (S.md.tieng || {})[c.k] || {};
    return d.ten || c.k;
  }
  function dong(ch, k) { return Object.assign({}, DONG_MD, ((ch && ch.tieng) || {})[k]); }
  function fileCua(ch, khoa) {
    var c = chia(khoa);
    if (c.loai === "nhac") return ((ch && ch.nhac) || {})[c.k] || "";
    if (c.loai === "tieng") return dong(ch, c.k).file || "";
    return "";
  }
  function datFile(khoa, ma) {
    var c = chia(khoa);
    if (c.loai === "nhac") { S.ht.nhac = S.ht.nhac || {}; S.ht.nhac[c.k] = ma; }
    else { S.ht.tieng = S.ht.tieng || {}; S.ht.tieng[c.k] = Object.assign(dong(S.ht, c.k), S.ht.tieng[c.k] || {}, { file: ma }); }
  }
  function phanND(ch, khoa) { // phần cài đặt thuộc một nội dung (so sánh chưa lưu)
    var c = chia(khoa);
    if (c.loai === "chung") return ch.amLuong;
    if (c.loai === "nhac") return (ch.nhac || {})[c.k] || "";
    return dong(ch, c.k);
  }
  function chuaLuu(khoa) { return !giong(phanND(S.ht, khoa), phanND(S.daLuu, khoa)); }
  function soChuaLuu() { return dsND("all").filter(chuaLuu).length; }
  function dsND(nhanh) {
    if (!S.md) return [];
    var ds = ["dt:chung"];
    Object.keys(S.md.nhac || {}).forEach(function (k) { ds.push("dt:nhac:" + k); });
    Object.keys(S.md.tieng || {}).forEach(function (k) { ds.push("dt:tieng:" + k); });
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
    var so = soChuaLuu();
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
  function hopLe(v, khoa) { return khoa === "mocoi" || dsND(v.nhanh).indexOf(khoa) >= 0; }
  function dauND(khoa) {
    var c = chia(khoa), f = fileCua(S.ht, khoa), d = c.loai === "tieng" ? dong(S.ht, c.k) : null;
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
    var html = nhanh("⚔️ Đấu Trường Tri Thức", dt, true);
    if (v.nhanh === "all") {
      html += '<details class="qktNhanh"><summary>📚 Âm thanh chung</summary><p class="qktSau">Đọc câu hỏi, tiếng đúng / sai / thưởng: làm ở bước KC_09B2.</p></details>';
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
    var khoa = v.chon, c = chia(khoa), h = lui + '<h4 class="qktTieuDe">' + T(tenND(khoa)) + ' <code>' + T(c.k || "amLuong") + "</code></h4>";
    if (c.loai === "chung") {
      var a = S.ht.amLuong || {}, m = S.md.amLuong || {};
      return h + '<div class="qktKhoi"><p class="adminGhiChu">Độ to chung của cả Đấu Trường. Từng tiếng còn có độ to riêng ở nội dung của nó.</p>'
        + soO("amLuong.tieng", "Độ to mọi tiếng hiệu ứng", a.tieng, m.tieng, 0, 1, 0.05)
        + soO("amLuong.nhac", "Độ to nhạc nền", a.nhac, m.nhac, 0, 1, 0.01)
        + soO("amLuong.nhacKhiDoc", "Nhạc còn bấy nhiêu phần khi máy đọc câu hỏi", a.nhacKhiDoc, m.nhacKhiDoc, 0, 1, 0.05)
        + nutLuu(khoa) + "</div>";
    }
    var dang = fileCua(S.ht, khoa), muc = timMuc(dang, c.loai), mdF = fileCua(S.md, khoa);
    var tenTrong = c.loai === "nhac" ? TRONG_NHAC[c.k] || "🔇 Để trống" : "🎛️ Tiếng tự tạo (không file)";
    h += '<div class="qktKhoi qktDang"><span>Đang dùng: <b>' + T(muc ? (muc.kho ? "📁 " : "") + muc.ten : tenTrong) + "</b></span>"
      + '<button type="button" class="adminNut adminNutThanhCong" data-kt="nghe-nd">▶ Nghe như trong trận</button>'
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
      var d = dong(S.ht, c.k), dm = dong(S.md, c.k), p = "tieng." + c.k + ".";
      h += '<div class="qktKhoi"><h5>Cài đặt</h5><div class="qktLuoiO">'
        + '<label class="qktO qktChon"><input type="checkbox" data-kt-o="' + p + 'bat"' + (d.bat !== false ? " checked" : "") + "> <span>Có kêu</span></label>"
        + soO(p + "amLuong", "Độ to cả nội dung (0 - 2)", d.amLuong, dm.amLuong, 0, 2, 0.05)
        + (dang ? soO(p + "amTep", "Độ to riêng của file (0 - 2)", d.amTep, dm.amTep, 0, 2, 0.05)
          + '<label class="qktO"><span>Kiểu</span><select data-kt-o="' + p + 'kieu"><option value="chong"' + (d.kieu !== "thay" ? " selected" : "") + '>Chồng (file + tiếng tự tạo)</option><option value="thay"' + (d.kieu === "thay" ? " selected" : "") + ">Thay (chỉ file)</option></select></label>"
          + soO(p + "tre", "Chờ bao lâu rồi file mới kêu (giây)", d.tre, dm.tre, 0, 5, 0.05) : "")
        + "</div>" + nutLuu(khoa) + "</div>";
    } else h += '<div class="qktKhoi">' + '<p class="adminGhiChu">Độ to nhạc nền chỉnh ở 🔊 Độ to chung; lặp lại / độ to riêng của file tải lên: bấm ✏️ ở file.</p>' + nutLuu(khoa) + "</div>";
    return h;
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
    var ds = (c.loai === "nhac" ? S.tv.nhac : S.tv.tieng).filter(function (m) { return co.indexOf(m.ma) < 0; });
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
    return am || (am = import("./dt/3d/dt3d_am_thanh.js").then(function (m) { return m.taoAmThanh({ cauHinh: chep(S.ht), batLuon: true }); }));
  }
  function ngheNoiDung(khoa) { // ▶ như trong trận: bộ tiếng thật với cài đặt đang sửa (cả ô chưa lưu)
    var c = chia(khoa);
    dungNghe();
    boTieng().then(function (a) {
      a.moKhoa(); a.datCauHinh(chep(S.ht));
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
    var sua = window.KC_DT_CAU_HINH ? KC_DT_CAU_HINH.khac(S.md, S.ht) || {} : null;
    if (!sua) return;
    var cu = {}; // file mặc định cũ của các nội dung đổi file: giữ lại trong danh sách ("để file cũ")
    dsND("all").forEach(function (n) { var a = fileCua(S.daLuu, n), b = fileCua(S.ht, n); if (a && a !== b && a !== fileCua(S.md, n)) cu[n] = a; });
    goi("kc_dt_admin_luu_thong_so", { p_ten: TEN_TEP, p_sua: sua, p_ghi_chu: "🎵 Kho tiếng" }).then(function (kq) {
      if (!kq.thanhCong) { adminBaoTin("❌ " + kq.thongBao, false); return; }
      return Promise.all(Object.keys(cu).map(function (n) {
        if ((S.gan[n] || []).indexOf(cu[n]) >= 0) return null;
        (S.gan[n] = S.gan[n] || []).push(cu[n]);
        return goi("kc_am_thanh_admin_gan_them", { p_noi_dung: n, p_ma: cu[n] });
      })).then(function () {
        S.daLuu = chep(S.ht);
        try { window.dispatchEvent(new CustomEvent("kcAmThanhDaLuu", { detail: { ch: chep(S.daLuu) } })); } catch (e) { /* bỏ qua */ }
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
      else if (viec === "nghe-nd") ngheNoiDung(v.chon);
      else if (viec === "dung") { dungNghe(); veTatCa(); }
      else if (viec === "nghe-f") {
        if (v.chon === "mocoi") { var k = S.kho.find(function (x) { return x.ma === ma; }); ngheFile("mocoi|" + ma, k && KT.urlTep(k.duongDan, client()), k && k.amLuong); return; }
        if (!ma) { ngheTuTao(v.chon); return; }
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
      if (t.hasAttribute("data-kt-o")) nhanO(v, t, true);
    });
    goc.addEventListener("input", function (su) {
      var t = su.target, v = vCua(t);
      if (!v) return;
      if (t.getAttribute("data-kt") === "tim") { v.tim = t.value; var q = v.goc.querySelector(".qktCayRuot"); if (q) q.outerHTML = veCay(v); return; }
      if (t.hasAttribute("data-kt-o") && t.type === "number") nhanO(v, t, false);
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
    if (duong[0] === "tieng") { S.ht.tieng = S.ht.tieng || {}; S.ht.tieng[duong[1]] = Object.assign(dong(S.ht, duong[1]), S.ht.tieng[duong[1]] || {}); }
    for (var i = 0; i < duong.length - 1; i++) { o[duong[i]] = o[duong[i]] || {}; o = o[duong[i]]; }
    o[duong[duong.length - 1]] = gt;
    if (veLai) { var dangO = document.activeElement === t; ve(v); veTatCaKhac(v); if (dangO) { var lai = v.goc.querySelector('[data-kt-o="' + t.getAttribute("data-kt-o") + '"]'); if (lai) lai.focus(); } }
    else capNhatThanh();
  }
  function capNhatThanh() {
    var so = soChuaLuu();
    views.forEach(function (v) {
      var th = v.goc.querySelector(".qktThanh"); if (!th) return;
      th.classList.toggle("hien", so > 0); th.querySelector("b").textContent = so + " nội dung chưa lưu";
      var nl = v.goc.querySelector('.qktPhai [data-kt="luu"]'); if (nl && v.chon) nl.disabled = !chuaLuu(v.chon);
    });
  }
  function ganMacDinh(khoa) {
    var c = chia(khoa);
    if (c.loai === "chung") S.ht.amLuong = chep(S.md.amLuong || {});
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
    gan: function (o, tuyChon) { // gắn (hoặc gắn lại) một khung cây vào phần tử o; nhanh: "dt" | "all"
      var nhanh = (tuyChon && tuyChon.nhanh) || "all";
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
    if (ten === "khotieng" && gocKho) window.QKT_CAY.gan(gocKho, { nhanh: "all" });
  });
  if (gocKho && document.getElementById("manhinh-khotieng") && document.getElementById("manhinh-khotieng").classList.contains("dangHien")) window.QKT_CAY.gan(gocKho, { nhanh: "all" });
})();
// 21/11/2026 - BƯỚC: KC_09B1
