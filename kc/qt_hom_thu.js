// ================================================================
// FILE: kc/qt_hom_thu.js
// CHỨC NĂNG: NÚT 📬 HÒM THƯ trên thanh đầu trang Quản trị (quantri_NC.html), số đỏ = thư đang chờ Cô Cú (kc_thu_dem.coCu.cho).
//   Bấm vào là sang 📬 Hòm thư → 🦉 Hộp Cô Cú (homthu_co_cu.js). Thiet_Ke_Hom_Thu.md mục 9.0 / 9.2, bước KC_12D1.
//   Trang Quản trị không dùng kc_auth.js nên nút vẽ sẵn trong HTML (cùng lớp .kcNutHomThu của kc_style.css: điện thoại chỉ
//   biểu tượng + số). Hỏi số khi mở trang và khi quay lại tab sau 30 giây. Chưa có SQL kc12b / mất mạng: nút vẫn bấm được, không số.
// RPC: kc_thu_dem(p_ten, p_ma_phien) (SQL kc12b).
// PHỤ THUỘC: ../api.js (apiGoiRpc), ../admin_NC.js (adminTaiKhoan, đặt khi trang mở xong).
// BƯỚC: KC_12D1 · NGÀY: 28/11/2026
// ================================================================
(function () {
  "use strict";
  if (typeof apiGoiRpc !== "function") return;
  var lanCuoi = 0;

  function ve(n) {
    var nut = document.getElementById("kcNutHomThu"); if (!nut) return;
    var b = nut.querySelector(".kcHtSo");
    n = Math.max(0, Number(n) || 0);
    b.textContent = n > 99 ? "99+" : String(n);
    b.hidden = n === 0;
    nut.setAttribute("aria-label", "Hòm thư" + (n ? ", " + n + " thư chờ Cô Cú" : ""));
    nut.title = n ? n + " thư đang chờ Cô Cú" : "Hòm thư";
  }

  function hoi() {
    var tk = window.adminTaiKhoan;
    if (!tk || !tk.tenDangNhap) return;
    lanCuoi = Date.now();
    apiGoiRpc("kc_thu_dem", { p_ten: tk.tenDangNhap, p_ma_phien: tk.maPhien || "" }).then(function (kq) {
      ve(kq && kq.thanhCong && kq.coCu ? kq.coCu.cho : 0);
    }, function () { ve(0); });
  }

  // admin_NC.js đặt adminTaiKhoan trong DOMContentLoaded: đợi tối đa ~5 giây
  document.addEventListener("DOMContentLoaded", function () {
    var lan = 0;
    (function cho() {
      if (window.adminTaiKhoan) { hoi(); return; }
      if (++lan < 25) setTimeout(cho, 200);
    })();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && Date.now() - lanCuoi > 30000) hoi();
  });
  // mục 📮 / 💡 / 🎁 vừa xử lý xong thì số có thể đổi
  document.addEventListener("adminDaChuyenManHinh", function () { if (Date.now() - lanCuoi > 5000) hoi(); });
})();
// 28/11/2026 - BƯỚC: KC_12D1 (tạo mới: nút 📬 Hòm thư ở Quản trị)
