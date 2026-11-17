// ================================================================
// FILE: kc/qt_don_du_lieu.js
// CHỨC NĂNG: Mục "🗄️ Dung lượng dữ liệu" của trang Quản trị chung (KC_07). Máy chủ tự dọn dữ liệu cũ mỗi đêm 3 giờ sáng
//   (pg_cron gọi kc_don_du_lieu); mục này cho admin:
//   - xem dung lượng cơ sở dữ liệu (so với 500 MB gói miễn phí) + 25 bảng lớn nhất (số dòng, MB, bảng nào được tự dọn);
//   - xem "nếu dọn bây giờ sẽ xoá bao nhiêu dòng" từng loại, bấm 🧹 Dọn ngay;
//   - sửa số ngày giữ từng loại (có mức sàn, máy chủ kiểm) - lưu vào kc_cau_hoi_cau_hinh qua kc_cau_hoi_admin_cau_hinh_luu;
//   - xem 10 lần dọn gần nhất (🌙 tự động / 👆 admin bấm).
//   Không bao giờ dọn bảng Cờ Vua (lich_su_tran, lich_su_doi_qua): chỉ xem dung lượng.
// BƯỚC: KC_07 - NGÀY: 17/11/2026
// PHỤ THUỘC: ../admin_NC.js (adminGoiRpc, adminThoat, adminBaoTin, adminDinhDangGio), quantri_NC.html có nút
//   data-manhinh="dungluong" + section #manhinh-dungluong (#qddGoc), qt_don_du_lieu.css; SQL/supabase_kc07_don_du_lieu.sql (repo_rieng).
// ================================================================
(function () {
  "use strict";
  if (typeof adminGoiRpc !== "function") return;
  var goc = document.getElementById("qddGoc");
  if (!goc) return;
  var T = adminThoat;
  var GOI_MIEN_PHI_MB = 500;

  // Số ngày giữ: [khoá cấu hình (nhóm.khoá), khoá trong kq.ngay, nhãn, ghi chú]
  var NGAY = [
    ["don.tin_da_xem_ngay", "tin_da_xem_ngay", "💡 Tin của bé đã xem", ""],
    ["don.tin_chua_xem_ngay", "tin_chua_xem_ngay", "💡 Tin của bé chưa xem", "bé nghỉ chơi lâu thì tin cũ tự bỏ"],
    ["don.cau_loai_ngay", "cau_loai_ngay", "🙈 Câu của bé bị loại", "chỉ câu không gắn công trình nào"],
    ["don.lich_su_cau_ngay", "lich_su_cau_ngay", "📜 Lịch sử sửa / chấm từng câu", "luôn giữ dòng cuối của mỗi câu"],
    ["don.dem_ngay", "dem_ngay", "🔢 Đếm lượt gửi câu mỗi ngày", ""],
    ["nhat_ky.giu_ngay", "giu_ngay", "📓 Nhật ký câu bị chặn", "dòng chưa xem giữ gấp đôi, ít nhất 180 ngày"],
    ["nhat_ky.giu_luot_ngay", "giu_luot_ngay", "📒 Lượt trả lời chi tiết (Sổ Ghi Nhớ)", "tiến độ học của bé không bao giờ bị xoá"],
    ["don.roi_do_ngay", "roi_do_ngay", "🎁 Lịch sử quái rơi đồ", ""],
    ["don.qt_lich_su_ngay", "qt_lich_su_ngay", "🎛️ Lịch sử sửa Thông số Đấu Trường", "luôn giữ 20 lần sửa gần nhất"]
  ];
  // Mục trong kết quả dọn
  var MUC = {
    tin_da_xem: "💡 Tin bé đã xem", tin_chua_xem: "💡 Tin bé chưa xem", cau_be_bi_loai: "🙈 Câu của bé bị loại",
    lich_su_cau: "📜 Lịch sử câu", dem_luot: "🔢 Đếm lượt mỗi ngày", phieu_kiem: "🔍 Phiếu kiểm câu (quá 1 ngày)",
    nhat_ky_chan: "📓 Nhật ký chặn", luot_tra_loi: "📒 Lượt trả lời", roi_do: "🎁 Rơi đồ", thong_so_dt: "🎛️ Thông số Đấu Trường"
  };
  // Tên dễ hiểu của bảng
  var TEN_BANG = {
    kc_be_thong_bao: "Tin 💡 của bé", kc_cau_hoi: "Kho câu hỏi", kc_cau_hoi_lich_su: "Lịch sử từng câu", kc_cau_hoi_dem: "Đếm lượt mỗi ngày",
    kc_cau_hoi_kiem: "Phiếu kiểm câu", kc_cau_hoi_nhat_ky_chan: "Nhật ký chặn", kc_luot_tra_loi: "Lượt trả lời (Sổ Ghi Nhớ)",
    kc_ghi_nho_be: "Tiến độ học của bé", kc_dt_roi_do_lich_su: "Lịch sử rơi đồ", kc_dt_qt_lich_su: "Lịch sử Thông số Đấu Trường",
    kc_don_nhat_ky: "Nhật ký dọn", kc_the_nho: "Thẻ nhớ (Kho tri thức)", kc_dt_cong_trinh: "Công trình Đấu Trường",
    kc_dt_o: "Ô bản đồ Đấu Trường", kc_dt_don_vi: "Nông dân / Thủ lĩnh", kc_dt_quai: "Quái Đấu Trường",
    lich_su_tran: "Lịch sử ván Cờ Vua", lich_su_doi_qua: "Lịch sử đổi quà", tai_khoan: "Tài khoản"
  };
  var CO_VUA = { lich_su_tran: 1, lich_su_doi_qua: 1 };
  var daMo = false, dangTai = false, kqXem = null;

  function el(id) { return document.getElementById(id); }
  function soVN(n) { return Number(n || 0).toLocaleString("vi-VN"); }
  function mbVN(n) { return Number(n || 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 }); }
  function tongDong(kq) { var s = 0; Object.keys(kq || {}).forEach(function (k) { if (MUC[k]) s += Number(kq[k]) || 0; }); return s; }
  function goi(ham, ts) {
    return adminGoiRpc(ham, ts || {}).then(function (kq) {
      return kq || { thanhCong: false, thongBao: "Máy chủ chưa có hàm " + ham + " (cần chạy SQL KC_07)" };
    }, function (e) {
      var tin = (e && e.message) || "";
      return { thanhCong: false, thongBao: /function|does not exist|schema cache/i.test(tin) ? "Máy chủ chưa có hàm " + ham + " (cần chạy SQL KC_07)" : "Không kết nối được máy chủ" + (tin ? ": " + tin : "") };
    });
  }

  goc.innerHTML = '<div class="qddLuoi">'
    + '<div class="qddCot">'
    + '<section class="qddThe" id="qddTong"><p class="adminDangTai">Đang tải...</p></section>'
    + '<section class="qddThe"><h4>🧹 Nếu dọn bây giờ sẽ xoá</h4><div id="qddSeDon"></div></section>'
    + '<section class="qddThe"><h4>⏳ Giữ dữ liệu bao nhiêu ngày</h4><div id="qddNgay"></div></section>'
    + "</div>"
    + '<div class="qddCot">'
    + '<section class="qddThe"><h4>📦 Các bảng lớn nhất</h4><div id="qddBang"></div></section>'
    + '<section class="qddThe"><h4>🗓️ Các lần dọn gần nhất</h4><div id="qddLan"></div></section>'
    + "</div></div>";

  function tai() {
    if (dangTai) return;
    dangTai = true;
    goi("kc_don_qt_xem").then(function (kq) {
      dangTai = false;
      if (!kq.thanhCong) { el("qddTong").innerHTML = '<p class="adminGhiChu">❌ ' + T(kq.thongBao) + "</p>"; return; }
      kqXem = kq;
      veTong(kq); veSeDon(kq.seDon || {}); veNgay(kq); veBang(kq.bang || []); veLan(kq.lanDon || []);
    });
  }

  function veTong(kq) {
    var phan = Math.min(100, (kq.csdlMb / GOI_MIEN_PHI_MB) * 100), lan = (kq.lanDon || [])[0], se = tongDong(kq.seDon);
    el("qddTong").innerHTML = '<div class="qddSoLon"><b>' + mbVN(kq.csdlMb) + " MB</b> <span>/ " + GOI_MIEN_PHI_MB + " MB gói miễn phí Supabase</span></div>"
      + '<div class="qddThanh' + (phan > 80 ? " do" : phan > 60 ? " vang" : "") + '"><i style="width:' + phan.toFixed(1) + '%"></i></div>'
      + '<p class="qddDong">' + (kq.lich ? "🌙 Máy chủ <b>tự dọn mỗi đêm lúc 3 giờ sáng</b>." : '⚠️ <b>Chưa có lịch tự dọn</b> (máy chủ chưa bật pg_cron hoặc chưa chạy SQL KC_07). Vẫn bấm Dọn ngay được.') + "</p>"
      + '<p class="qddDong">Lần dọn gần nhất: ' + (lan ? "<b>" + T(adminDinhDangGio(lan.luc)) + "</b> · " + (lan.nguon === "lich" ? "🌙 tự động" : "👆 " + T(lan.boi || "admin")) + " · " + soVN(tongDong(lan.ketQua)) + " dòng" : "<i>chưa dọn lần nào</i>") + "</p>"
      + '<div class="qddNut"><button type="button" class="adminNut adminNutThanhCong" id="qddDonNgay">🧹 Dọn ngay' + (se ? " (" + soVN(se) + " dòng)" : "") + "</button>"
      + '<button type="button" class="adminNut adminNutPhu" id="qddTaiLai">🔄 Tải lại</button></div>';
    el("qddDonNgay").addEventListener("click", donNgay);
    el("qddTaiLai").addEventListener("click", tai);
  }

  function veSeDon(sd) {
    var ds = Object.keys(MUC).filter(function (k) { return sd[k] !== undefined; });
    var tong = tongDong(sd);
    el("qddSeDon").innerHTML = tong === 0 ? '<p class="adminGhiChu qddRong">Không có gì cũ cần dọn. 👍</p>'
      : '<ul class="qddDs">' + ds.map(function (k) {
        return '<li class="' + (sd[k] ? "" : "mo") + '"><span>' + T(MUC[k]) + "</span><b>" + soVN(sd[k]) + "</b></li>";
      }).join("") + '<li class="tong"><span>Tổng</span><b>' + soVN(tong) + " dòng</b></li></ul>";
  }

  function veNgay(kq) {
    var san = kq.san || {}, ngay = kq.ngay || {};
    el("qddNgay").innerHTML = '<p class="adminGhiChu">Dữ liệu cũ hơn số ngày này sẽ bị xoá. Không đặt được nhỏ hơn mức sàn. 🔍 Phiếu kiểm câu luôn giữ 1 ngày.</p>'
      + '<div class="qddFormNgay">' + NGAY.map(function (n) {
        var khoa = n[0].split(".")[1], s = san[khoa] || 7;
        return '<label class="qddO"><span>' + T(n[2]) + (n[3] ? "<small>" + T(n[3]) + "</small>" : "") + "</span>"
          + '<span class="qddNhap"><input type="number" min="' + s + '" max="3650" step="1" data-khoa="' + n[0] + '" data-cu="' + ngay[n[1]] + '" value="' + T(ngay[n[1]]) + '">'
          + "<em>ngày · sàn " + s + "</em></span></label>";
      }).join("") + "</div>"
      + '<div class="qddNut"><button type="button" class="adminNut adminNutThanhCong" id="qddLuuNgay">💾 Lưu số ngày</button></div>';
    el("qddLuuNgay").addEventListener("click", luuNgay);
  }

  function veBang(ds) {
    el("qddBang").innerHTML = '<div class="qddBang">' + ds.map(function (b) {
      var nhan = b.tuDon ? '<span class="qddNhan xanh">🧹 tự dọn</span>' : CO_VUA[b.ten] ? '<span class="qddNhan xam">♟️ Cờ Vua · không dọn</span>' : "";
      return '<div class="qddHang"><div class="qddTen"><b>' + T(TEN_BANG[b.ten] || b.ten) + "</b>" + (TEN_BANG[b.ten] ? " <code>" + T(b.ten) + "</code>" : "") + " " + nhan + "</div>"
        + '<div class="qddSo"><span>' + soVN(b.dong) + " dòng</span><b>" + mbVN(b.mb) + " MB</b></div></div>";
    }).join("") + "</div><p class=\"adminGhiChu\">Số dòng là số ước tính của máy chủ (cập nhật sau vài phút).</p>";
  }

  function veLan(ds) {
    el("qddLan").innerHTML = !ds.length ? '<p class="adminGhiChu qddRong">Chưa dọn lần nào.</p>'
      : '<ul class="qddDs qddDsLan">' + ds.map(function (l) {
        var kq = l.ketQua || {}, chiTiet = Object.keys(MUC).filter(function (k) { return kq[k]; }).map(function (k) { return T(MUC[k]) + " " + soVN(kq[k]); }).join(" · ");
        return "<li><span><b>" + T(adminDinhDangGio(l.luc)) + "</b> · " + (l.nguon === "lich" ? "🌙 tự động" : "👆 " + T(l.boi || "admin"))
          + (chiTiet ? "<small>" + chiTiet + "</small>" : "") + "</span><b>" + soVN(tongDong(kq)) + " dòng</b></li>";
      }).join("") + "</ul>";
  }

  function donNgay() {
    var se = kqXem ? tongDong(kqXem.seDon) : 0;
    if (!window.confirm(se ? "Xoá " + soVN(se) + " dòng dữ liệu cũ ngay bây giờ?\n(Tiến độ học, công trình, làng của các bé không bị đụng tới.)" : "Hiện không có gì cũ. Vẫn chạy dọn?")) return;
    var nut = el("qddDonNgay"); nut.disabled = true; nut.textContent = "⏳ Đang dọn...";
    goi("kc_don_qt_chay").then(function (kq) {
      if (kq.thanhCong) adminBaoTin("✅ Đã dọn " + soVN(tongDong(kq.ketQua)) + " dòng", true);
      else adminBaoTin("❌ " + (kq.thongBao || "Có lỗi"), false);
      tai();
    });
  }

  function luuNgay() {
    var sua = {}, sai = [];
    goc.querySelectorAll("[data-khoa]").forEach(function (n) {
      n.classList.remove("loi");
      var v = Number(n.value);
      if (n.value === "" || !Number.isInteger(v) || v < Number(n.min) || v > Number(n.max)) { sai.push(n); return; }
      if (v !== Number(n.getAttribute("data-cu"))) sua[n.getAttribute("data-khoa")] = v;
    });
    if (sai.length) { sai.forEach(function (n) { n.classList.add("loi"); }); return adminBaoTin("❌ Có ô nhỏ hơn mức sàn hoặc sai (tô đỏ)", false); }
    if (!Object.keys(sua).length) return adminBaoTin("Không có gì thay đổi", true);
    goi("kc_cau_hoi_admin_cau_hinh_luu", { p_sua: sua }).then(function (kq) {
      if (kq.thanhCong) { adminBaoTin("✅ Đã lưu " + Object.keys(sua).length + " ô số ngày", true); tai(); }
      else adminBaoTin("❌ " + (kq.thongBao || "Có lỗi") + (kq.loi ? " (" + kq.loi.join(", ") + ")" : ""), false);
    });
  }

  function mo() { daMo = true; tai(); }
  document.addEventListener("adminDaChuyenManHinh", function (su) { if (su.detail && su.detail.ten === "dungluong") mo(); });
  if (el("manhinh-dungluong") && el("manhinh-dungluong").classList.contains("dangHien")) mo();
  window.QDD = { mo: mo, tai: tai, daMo: function () { return daMo; } };
})();
// 17/11/2026 - BƯỚC: KC_07
