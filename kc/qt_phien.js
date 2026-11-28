// ================================================================
// FILE: kc/qt_phien.js
// CHỨC NĂNG: Quản trị › 👥 Tài khoản › khối 🔐 Phiên đăng nhập: 10 khóa cấu hình kc_phien_* (số máy, ngày nghỉ,
//   ngày tối đa của bé / phụ huynh / quản trị, giây trang hỏi lại). Dùng bảng cấu hình chung sẵn có của admin_NC.js
//   (<tbody data-nhom-cau-hinh="taikhoan">, nút 💾 Lưu gọi admin_luu_cau_hinh_chung); file này chỉ xếp các khóa vào
//   nhóm "taikhoan" và tải bảng khi mở màn Tài khoản. Máy chủ tự dùng số mặc định nếu số sai / ngoài khoảng
//   (SQL/supabase_kc00d2_b1_phien.sql, kc_phien_so).
// PHỤ THUỘC: admin_NC.js (ADMIN_KHOA_LINH_VUC, ADMIN_TEN_NHOM, adminTaiCauHinhChung) nạp trước.
// BƯỚC: KC_00D2-B1 · NGÀY: 28/11/2026
// ================================================================
(function () {
  if (typeof ADMIN_KHOA_LINH_VUC === "undefined") return;
  ["so_may", "ngay_nghi", "ngay_toi_da"].forEach(function (loai) {
    ["tre", "phu_huynh", "admin"].forEach(function (vai) { ADMIN_KHOA_LINH_VUC["kc_phien_" + loai + "_" + vai] = "taikhoan"; });
  });
  ADMIN_KHOA_LINH_VUC.kc_phien_giay_hoi = "taikhoan";
  ADMIN_TEN_NHOM.taikhoan = "Tài khoản";

  var daTai = false;
  document.addEventListener("adminDaChuyenManHinh", function (su) {
    if (daTai || !su.detail || su.detail.ten !== "taikhoan") return;
    daTai = true;
    adminTaiCauHinhChung();
  });
})();
