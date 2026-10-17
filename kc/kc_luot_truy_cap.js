// ================================================================
// FILE: kc/kc_luot_truy_cap.js
// CHỨC NĂNG: SỐ LƯỢT TRUY CẬP ở chân trang, dùng dịch vụ đo lường có sẵn GoatCounter
//            (ntdungs.goatcounter.com - không cookie, không thu thông tin cá nhân).
//            (1) Nạp count.js của GoatCounter -> mỗi lần mở trang được đếm 1 lượt.
//            (2) Đọc tổng lượt của cả app (counter/TOTAL.json) và thêm dòng
//                "Số lượt truy cập: 1.234" ở cuối trang.
//            Mạng lỗi / dịch vụ không trả lời: không hiện gì, trang vẫn chạy bình thường.
//            Lưu ý: GoatCounter làm mới con số tổng tối đa 4 giờ một lần.
//            KHÔNG nạp file này ở trang Quản trị (lượt của admin không tính, không hiện).
// CÁCH DÙNG: thêm 1 dòng trước </body> của mỗi trang:
//            <script src="kc/kc_luot_truy_cap.js"></script>   (trang ở gốc repo)
//            <script src="kc_luot_truy_cap.js"></script>      (trang trong /kc/)
//            Trang không có chân trang (game toàn màn hình) đặt sẵn <div data-luot-truy-cap></div>
//            ở chỗ muốn hiện (vd cuối thẻ menu bắt đầu).
// BƯỚC: KC_00F
// NGÀY: 17/10/2026
// ================================================================
(function () {
  "use strict";
  var MA = "ntdungs";
  var GOC = "https://" + MA + ".goatcounter.com";

  // (1) Đếm lượt: script GoatCounter (đúng mẫu người dùng đưa, nạp một lần)
  if (!document.querySelector("script[data-goatcounter]")) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.setAttribute("data-goatcounter", GOC + "/count");
    document.head.appendChild(s);
  }

  // (2) Hiện tổng lượt của cả app ở chân trang
  function hien(soLuot) {
    if (document.getElementById("kcLuotTruyCap")) return;
    // Trang tự chỉ chỗ (vd game toàn màn hình): <div data-luot-truy-cap></div>
    var cho = document.querySelector("[data-luot-truy-cap]");
    if (cho) { cho.id = "kcLuotTruyCap"; cho.textContent = "Số lượt truy cập: " + soLuot; return; }
    var e = document.createElement("div");
    e.id = "kcLuotTruyCap";
    e.textContent = "Số lượt truy cập: " + soLuot;
    e.style.cssText = "text-align:center;font-size:12px;line-height:1.4;color:#8a84a3;" +
      "padding:14px 12px calc(14px + env(safe-area-inset-bottom, 0px));clear:both;";
    document.body.appendChild(e);
  }
  if (!window.fetch) return;
  fetch(GOC + "/counter/TOTAL.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || d.count === undefined || d.count === null) return;
      // GoatCounter trả "1,234" -> kiểu Việt Nam "1.234"
      var so = String(d.count).replace(/,/g, ".");
      if (document.body) hien(so);
      else document.addEventListener("DOMContentLoaded", function () { hien(so); });
    })
    .catch(function () { /* không hiện gì */ });
})();
