// ================================
// FILE: taptrung_NC.js
// CHỨC NĂNG: CHẾ ĐỘ TẬP TRUNG khi chơi cờ với máy trên ĐIỆN THOẠI. Bấm "Bắt
//            Đầu Ván Mới" thì tự ẩn mọi thứ không liên quan (tiêu đề, thanh
//            thông tin, thanh menu, khối chọn level) để trẻ chỉ thấy bàn cờ,
//            thẻ trận đấu, nút Gợi Ý và trợ lý 🦉.
//            Cách thoát (để trẻ sang nội dung khác):
//              - nút nổi "🏠 Ra menu" ở góc trên;
//              - nút "Quay lại" (Back) của điện thoại;
//              - tự thoát khi ván kết thúc (khung kết quả hiện ra).
//            Đang thoát mà ván chưa xong thì có nút "🎯 Tập trung chơi tiếp"
//            để quay lại chế độ tập trung.
// BƯỚC: KC_00B (trải nghiệm như 1 ứng dụng) - NGÀY: 14/10/2026 21:57
// QUY ƯỚC TÊN HÀM/BIẾN: tất cả bắt đầu bằng "taptrung"
// PHỤ THUỘC: index.html (các id #btnBatDauVan, #khoiChonDoiThu,
//            #thongBaoKetQuaVan, #banCo); đọc biến toàn cục boardKetThuc của
//            board.js (CHỈ ĐỌC). KHÔNG sửa board.js (file đã chốt sổ) - file
//            này tự lắng nghe nút Bắt Đầu và khung kết quả.
// GHI CHÚ: máy tính/máy tính bảng màn hình rộng KHÔNG bật chế độ này (đủ chỗ
//          hiện cả menu lẫn bàn cờ). Định dạng CSS được tiêm từ file này (giống
//          cách board.js tiêm CSS hiệu ứng) để gói gọn tính năng trong 1 file.
// ================================

// Điện thoại: màn hình hẹp (dọc) hoặc thấp (điện thoại xoay ngang)
var TAPTRUNG_MAN_HINH_DIEN_THOAI = "(max-width: 600px), (max-height: 500px)";

var taptrungDangBat = false;

/** Hàm khởi tạo, chạy khi trang tải xong */
function taptrungKhoiTao() {
  taptrungTiemCss();
  taptrungTaoNut();

  var nutBatDau = document.getElementById("btnBatDauVan");
  if (nutBatDau) {
    nutBatDau.addEventListener("click", function () {
      if (taptrungLaDienThoai()) taptrungBat();
    });
  }

  // board.js hiện khung kết quả khi ván kết thúc -> tự thoát để trẻ thấy kết
  // quả, chọn ván mới hoặc đi sang mục khác
  var khungKetQua = document.getElementById("thongBaoKetQuaVan");
  if (khungKetQua && window.MutationObserver) {
    new MutationObserver(function () {
      if (khungKetQua.style.display === "none") return;
      if (taptrungDangBat) taptrungThoat();
      taptrungCapNhatNutVao();
    }).observe(khungKetQua, { attributes: true, attributeFilter: ["style"] });
  }

  // Nút "Quay lại" (Back) của điện thoại: thoát chế độ tập trung thay vì rời trang
  window.addEventListener("popstate", function () {
    if (taptrungDangBat) taptrungThoat(true);
  });

  // Xoay màn hình/đổi cỡ cửa sổ thành màn hình rộng -> trả lại giao diện đầy đủ
  window.addEventListener("resize", function () {
    if (taptrungDangBat && !taptrungLaDienThoai()) taptrungThoat();
    taptrungCapNhatNutVao();
  });
}

function taptrungLaDienThoai() {
  return window.matchMedia && window.matchMedia(TAPTRUNG_MAN_HINH_DIEN_THOAI).matches;
}

/** Ván đang diễn ra? (boardKetThuc là biến của board.js, chỉ đọc) */
function taptrungDangCoVan() {
  return typeof boardKetThuc !== "undefined" && !boardKetThuc;
}

/** Bật chế độ tập trung */
function taptrungBat() {
  if (taptrungDangBat) return;
  taptrungDangBat = true;
  document.body.classList.add("cheDoTapTrung");

  // Thêm 1 mốc lịch sử để nút Back của điện thoại thoát chế độ này
  try {
    history.pushState({ cheDoTapTrung: true }, "");
  } catch (loi) { /* trình duyệt không hỗ trợ -> vẫn còn nút "Ra menu" */ }

  taptrungCapNhatNutVao();
  window.scrollTo(0, 0);
}

/**
 * Tắt chế độ tập trung.
 * daQuayLaiLichSu = true khi được gọi từ nút Back (mốc lịch sử đã tự gỡ);
 * ngược lại tự gỡ mốc lịch sử đã thêm lúc bật.
 */
function taptrungThoat(daQuayLaiLichSu) {
  if (!taptrungDangBat) return;
  taptrungDangBat = false;
  document.body.classList.remove("cheDoTapTrung");

  if (!daQuayLaiLichSu && history.state && history.state.cheDoTapTrung) {
    history.back();
  }
  taptrungCapNhatNutVao();
}

/** Tạo nút nổi "Ra menu" và nút "Tập trung chơi tiếp" */
function taptrungTaoNut() {
  var nutThoat = document.createElement("button");
  nutThoat.id = "taptrungNutThoat";
  nutThoat.type = "button";
  nutThoat.textContent = "🏠 Ra menu";
  nutThoat.title = "Thoát chế độ tập trung để xem menu";
  nutThoat.addEventListener("click", function () { taptrungThoat(); });
  document.body.appendChild(nutThoat);

  var khoiChon = document.getElementById("khoiChonDoiThu");
  if (khoiChon) {
    var nutVao = document.createElement("button");
    nutVao.id = "taptrungNutVao";
    nutVao.type = "button";
    nutVao.textContent = "🎯 Tập trung chơi tiếp";
    nutVao.addEventListener("click", taptrungBat);
    khoiChon.appendChild(nutVao);
  }
}

/** Nút "Tập trung chơi tiếp" chỉ hiện trên điện thoại, khi ván đang dở */
function taptrungCapNhatNutVao() {
  var nutVao = document.getElementById("taptrungNutVao");
  if (!nutVao) return;
  var hien = !taptrungDangBat && taptrungLaDienThoai() && taptrungDangCoVan();
  nutVao.style.display = hien ? "inline-block" : "none";
}

/** Tiêm CSS của chế độ tập trung */
function taptrungTiemCss() {
  if (document.getElementById("taptrungCss")) return;
  var the = document.createElement("style");
  the.id = "taptrungCss";
  the.textContent =
    "body.cheDoTapTrung #headerChinh, body.cheDoTapTrung #thanhThongTin," +
    " body.cheDoTapTrung #thanhDieuHuong, body.cheDoTapTrung #khoiChonDoiThu," +
    " body.cheDoTapTrung #section-play > h2 { display: none !important; }" +
    // Thanh cài đặt giọng của board.js: chỉ giữ nút bật/tắt trợ lý 🦉
    "body.cheDoTapTrung #boardThanhGiong > :not(#boardNutBatTieng) { display: none !important; }" +
    "body.cheDoTapTrung #boardThanhGiong { margin: 0 0 8px; padding: 0; min-height: 38px;" +
    " background: none; border: none; justify-content: flex-end; }" +
    "body.cheDoTapTrung .noiDungTab { margin: 6px; padding: 8px 8px 12px; }" +
    // Nút "Ra menu" nằm cùng hàng với nút 🦉 ở đầu trang (cuộn theo trang để
    // không che bàn cờ)
    "#taptrungNutThoat { display: none; position: absolute; top: 14px; left: 14px; z-index: 1000;" +
    " padding: 8px 14px; border: none; border-radius: 999px; background: var(--mau-chinh-dam, #2f6cad);" +
    " color: #fff; font-weight: bold; font-size: 0.95rem; box-shadow: 0 2px 8px rgba(0,0,0,0.2); cursor: pointer; }" +
    "body.cheDoTapTrung #taptrungNutThoat { display: inline-block; }" +
    "#taptrungNutVao { display: none; margin-top: 10px; }";
  document.head.appendChild(the);
}

document.addEventListener("DOMContentLoaded", taptrungKhoiTao);
