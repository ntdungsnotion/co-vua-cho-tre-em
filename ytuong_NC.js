// ================================================================
// FILE: ytuong_NC.js
// CHỨC NĂNG: Module DÙNG CHUNG xử lý khu vực "Gửi Ý Tưởng" cho trang Học Tập
//            và Khám Phá (NC_07). Đọc cấu trúc HTML một cách TỔNG QUÁT (không
//            hard-code riêng cho từng trang/chuyên mục) nên trang Khám Phá
//            (bước NC_07-2) TÁI SỬ DỤNG được nguyên file này, KHÔNG cần sửa.
// NGÀY: 11/07/2026 - BƯỚC: NC_07-1
// QUY ƯỚC TÊN HÀM/BIẾN: tất cả bắt đầu bằng "yt" (y-tuong) để tránh xung đột
//
// CÁCH DÙNG TỪ FILE HTML (xem hoctap_NC.html):
//   Mỗi khu vực gửi ý tưởng là 1 khối:
//     <div class="ytKhoiYTuong" data-chuyen-muc="hoc_tap">
//       <textarea class="ytO"></textarea>
//       <span class="ytSoKyTuConLai"></span>          (số ký tự còn được gõ)
//       <button class="ytNutGui" type="button"></button>
//       <div class="ytThongBaoKhoi"></div>             (toast riêng của khối)
//       <div class="ytDanhSachRong"></div>              (hiện khi khối rỗng)
//       <ul class="ytDanhSach"></ul>                    (ytuong_NC.js tự điền)
//     </div>
//   Trang có thể đặt NHIỀU khối cùng lúc với chuyên mục khác nhau (Khám Phá sẽ
//   đặt 2 khối: kham_pha + tro_choi - "trò chơi" là nội dung con của Khám Phá).
//   Ngoài ra trang cần 2 phần tử id cố định:
//     #ytChuaDangNhap          (hiện khi chưa đăng nhập)
//     #ytNoiDungCanDangNhap    (bọc toàn bộ nội dung cần đăng nhập mới thấy)
//     #ytTenNguoiChoi          (tùy chọn - hiện "Xin chào, <tên>" trên header)
//
// PHỤ THUỘC:
//   - config.js (biến supabaseClient)
//   - api.js (hàm apiGoiRpc)
//   - sessionStorage khóa "coVuaTaiKhoanDangNhap" do app.js ghi khi đăng nhập
//   - KHÔNG nạp app.js/board.js (giống cuahang_NC.js - trang tự đọc phiên)
//
// CÁC RPC SỬ DỤNG (đã có sẵn từ NC_00, KHÔNG cần chạy thêm SQL):
//   lay_cau_hinh                       (đọc khóa y_tuong_do_dai_toi_da)
//   gui_y_tuong(p_ten, p_chuyen_muc, p_noi_dung)
//   lay_y_tuong_cua_toi(p_ten)         -> trả TOÀN BỘ ý tưởng của tài khoản
//     (mọi chuyên mục cùng lúc); module CHỈ gọi 1 LẦN dùng chung cho mọi khối
//     trên trang rồi tự LỌC theo data-chuyen-muc của từng khối (đỡ gọi máy
//     chủ nhiều lần khi 1 trang có 2 khối trở lên).
//
// GHI CHÚ: KHÔNG thêm hàm vào api.js (theo nguyên tắc "gom việc theo file" -
//   HƯỚNG DẪN mục 7, xem giải thích tương tự đầu file admin_NC.js). RPC của
//   NC_07 chỉ dùng ở đây nên gọi thẳng qua apiGoiRpc() có sẵn.
// ================================================================

var YT_KHOA_PHIEN = "coVuaTaiKhoanDangNhap"; // PHẢI trùng APP_KHOA_LUU_PHIEN trong app.js
var YT_DO_DAI_MAC_DINH = 500; // khớp mặc định của khóa y_tuong_do_dai_toi_da trong SQL

// ----- Biến trạng thái -----
var ytTaiKhoan = null;      // Phiên đăng nhập (đọc từ sessionStorage)
var ytCacKhoi = [];         // Danh sách các phần tử .ytKhoiYTuong có trên trang
var ytDoDaiToiDa = YT_DO_DAI_MAC_DINH;
var ytDangGui = {};         // map chuyenMuc -> true khi đang chờ máy chủ trả lời

// ================================================================
// PHẦN 1: KHỞI ĐỘNG
// ================================================================

function ytKhoiTao() {
  ytTaiKhoan = ytDocPhien();

  var khoiChua = document.getElementById("ytChuaDangNhap");
  var khoiCanDangNhap = document.getElementById("ytNoiDungCanDangNhap");

  if (!ytTaiKhoan || !ytTaiKhoan.tenDangNhap) {
    if (khoiChua) khoiChua.style.display = "block";
    if (khoiCanDangNhap) khoiCanDangNhap.style.display = "none";
    return;
  }

  var oTen = document.getElementById("ytTenNguoiChoi");
  if (oTen) oTen.textContent = "Xin chào, " + ytTaiKhoan.tenDangNhap;

  ytCacKhoi = Array.prototype.slice.call(document.querySelectorAll(".ytKhoiYTuong"));
  if (!ytCacKhoi.length) return; // phòng lỗi đặt thiếu khối trong HTML

  ytTaiCauHinh();
  ytCacKhoi.forEach(ytGanSuKienKhoi);
  ytTaiDanhSachYTuong();
}

/** Đọc phiên đăng nhập do app.js lưu (KHÔNG bao giờ chứa mật khẩu) */
function ytDocPhien() {
  try {
    var chuoi = sessionStorage.getItem(YT_KHOA_PHIEN);
    if (!chuoi) return null;
    return JSON.parse(chuoi);
  } catch (loi) {
    return null;
  }
}

// ================================================================
// PHẦN 2: CẤU HÌNH (giới hạn độ dài ý tưởng)
// ================================================================

function ytTaiCauHinh() {
  apiGoiRpc("lay_cau_hinh", {}).then(function (kq) {
    if (kq && kq.thanhCong && kq.cauHinhChung) {
      var so = parseInt(kq.cauHinhChung.y_tuong_do_dai_toi_da, 10);
      if (!isNaN(so) && so > 0) ytDoDaiToiDa = so;
    }
    ytCacKhoi.forEach(function (khoi) {
      var oTextarea = khoi.querySelector(".ytO");
      if (oTextarea) oTextarea.setAttribute("maxlength", String(ytDoDaiToiDa));
      ytCapNhatDemKyTu(khoi);
    });
  });
}

// ================================================================
// PHẦN 3: GẮN SỰ KIỆN CHO TỪNG KHỐI
// ================================================================

function ytGanSuKienKhoi(khoi) {
  var oTextarea = khoi.querySelector(".ytO");
  var oNut = khoi.querySelector(".ytNutGui");

  if (oTextarea) {
    oTextarea.setAttribute("maxlength", String(ytDoDaiToiDa));
    oTextarea.addEventListener("input", function () { ytCapNhatDemKyTu(khoi); });
  }
  if (oNut) {
    oNut.addEventListener("click", function () { ytGuiYTuong(khoi); });
  }
  ytCapNhatDemKyTu(khoi);
}

function ytCapNhatDemKyTu(khoi) {
  var oTextarea = khoi.querySelector(".ytO");
  var oDem = khoi.querySelector(".ytSoKyTuConLai");
  if (!oTextarea || !oDem) return;
  var conLai = ytDoDaiToiDa - oTextarea.value.length;
  oDem.textContent = conLai >= 0 ? conLai : 0;
  oDem.classList.toggle("ytHetKyTu", conLai <= 0);
}

// ================================================================
// PHẦN 4: GỬI Ý TƯỞNG
// ================================================================

function ytGuiYTuong(khoi) {
  var chuyenMuc = khoi.getAttribute("data-chuyen-muc");
  if (!chuyenMuc) return;
  if (ytDangGui[chuyenMuc]) return;

  var oTextarea = khoi.querySelector(".ytO");
  var noiDung = oTextarea ? oTextarea.value.trim() : "";

  if (!noiDung) {
    ytHienThongBaoKhoi(khoi, "Con hãy viết ý tưởng trước khi gửi nhé!", "xau");
    return;
  }

  ytDangGui[chuyenMuc] = true;
  var oNut = khoi.querySelector(".ytNutGui");
  if (oNut) oNut.disabled = true;
  ytHienThongBaoKhoi(khoi, "Đang gửi...", "tot");

  apiGoiRpc("gui_y_tuong", {
    p_ten: ytTaiKhoan.tenDangNhap,
    p_chuyen_muc: chuyenMuc,
    p_noi_dung: noiDung
  }).then(function (kq) {
    ytDangGui[chuyenMuc] = false;
    if (oNut) oNut.disabled = false;
    kq = kq || {};

    if (!kq.thanhCong) {
      ytHienThongBaoKhoi(khoi, ytDichLoi(kq.thongBao), "xau");
      return;
    }

    if (oTextarea) oTextarea.value = "";
    ytCapNhatDemKyTu(khoi);
    ytHienThongBaoKhoi(khoi, "🎉 Đã gửi ý tưởng, cảm ơn con!", "tot");
    // Tải lại danh sách cho MỌI khối trên trang (dùng chung 1 lần gọi máy chủ)
    ytTaiDanhSachYTuong();
  });
}

/** Đổi thông báo lỗi (không dấu, từ máy chủ) sang câu thân thiện có dấu cho trẻ */
function ytDichLoi(thongBao) {
  var s = (thongBao || "").toLowerCase();
  if (s.indexOf("vui long nhap noi dung") >= 0) return "Con hãy viết ý tưởng trước khi gửi nhé!";
  if (s.indexOf("dai qua") >= 0) return "Ý tưởng dài quá, con viết ngắn lại giúp cô nhé!";
  if (s.indexOf("chuyen muc phai la") >= 0) return "Có lỗi nhỏ ở trang này, con thử tải lại trang nhé.";
  if (s.indexOf("khong tim thay tai khoan") >= 0) return "Phiên đăng nhập có vấn đề, con đăng nhập lại giúp nhé.";
  return thongBao || "Gửi ý tưởng chưa được, con thử lại nhé.";
}

// ================================================================
// PHẦN 5: DANH SÁCH Ý TƯỞNG ĐÃ GỬI
// ================================================================

function ytTaiDanhSachYTuong() {
  apiGoiRpc("lay_y_tuong_cua_toi", { p_ten: ytTaiKhoan.tenDangNhap }).then(function (kq) {
    var toanBo = (kq && kq.thanhCong) ? (kq.danhSachYTuong || []) : [];
    ytCacKhoi.forEach(function (khoi) {
      var chuyenMuc = khoi.getAttribute("data-chuyen-muc");
      var dsLoc = toanBo.filter(function (mucYTuong) { return mucYTuong.chuyenMuc === chuyenMuc; });
      ytVeDanhSachTrongKhoi(khoi, dsLoc);
    });
  });
}

function ytVeDanhSachTrongKhoi(khoi, danhSach) {
  var oRong = khoi.querySelector(".ytDanhSachRong");
  var oDs = khoi.querySelector(".ytDanhSach");
  if (!oDs) return;
  oDs.innerHTML = "";

  if (!danhSach.length) {
    if (oRong) oRong.style.display = "block";
    return;
  }
  if (oRong) oRong.style.display = "none";

  danhSach.forEach(function (mucYTuong) {
    var dong = document.createElement("li");
    dong.className = "ytDong";

    var noiDung = document.createElement("p");
    noiDung.className = "ytDongNoiDung";
    noiDung.textContent = mucYTuong.noiDung;
    dong.appendChild(noiDung);

    var meta = document.createElement("div");
    meta.className = "ytDongMeta";

    var thoiGian = document.createElement("span");
    thoiGian.className = "ytDongThoiGian";
    thoiGian.textContent = ytDinhDangThoiGian(mucYTuong.ngayGui);
    meta.appendChild(thoiGian);

    var trangThai = document.createElement("span");
    var daXem = (mucYTuong.trangThai === "da_xem");
    trangThai.className = "ytNhanTrangThai " + (daXem ? "ytNhanDaXem" : "ytNhanMoi");
    trangThai.textContent = daXem ? "Cô đã xem ✓" : "Đang chờ cô xem";
    meta.appendChild(trangThai);

    dong.appendChild(meta);
    oDs.appendChild(dong);
  });
}

// ================================================================
// PHẦN 6: TIỆN ÍCH
// ================================================================

/** Thông báo (toast) RIÊNG cho 1 khối - vì 1 trang có thể có nhiều khối cùng lúc */
function ytHienThongBaoKhoi(khoi, text, loai) {
  var o = khoi.querySelector(".ytThongBaoKhoi");
  if (!o) return;
  o.textContent = text;
  o.className = "ytThongBaoKhoi hien " + (loai === "xau" ? "xau" : "tot");
  if (khoi._ytHenToast) clearTimeout(khoi._ytHenToast);
  khoi._ytHenToast = setTimeout(function () {
    o.className = "ytThongBaoKhoi";
  }, 4000);
}

/** Định dạng chuỗi thời gian ISO trả về từ Supabase thành dd/mm/yyyy hh:mm */
function ytDinhDangThoiGian(chuoiThoiGian) {
  if (!chuoiThoiGian) return "---";
  var ngay = new Date(chuoiThoiGian);
  if (isNaN(ngay.getTime())) return chuoiThoiGian;
  var hai = function (so) { return (so < 10 ? "0" : "") + so; };
  return hai(ngay.getDate()) + "/" + hai(ngay.getMonth() + 1) + "/" + ngay.getFullYear()
    + " " + hai(ngay.getHours()) + ":" + hai(ngay.getMinutes());
}

// ================================================================
// KHỞI CHẠY
// ================================================================
document.addEventListener("DOMContentLoaded", ytKhoiTao);
