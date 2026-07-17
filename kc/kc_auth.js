// ================================================================
// FILE: kc_auth.js
// CHỨC NĂNG: Đăng nhập / khôi phục phiên / đăng xuất DÙNG CHUNG cho mọi
//            trang Kids Challenge. Mỗi trang /kc/ là ĐIỂM VÀO ĐỘC LẬP (không
//            đi qua index.html/menu Cờ Vua) nên PHẢI tự có khối đăng nhập -
//            đây là file đảm nhiệm việc đó (HƯỚNG DẪN mục 2).
//            Khi khôi phục phiên từ sessionStorage, LUÔN xác thực lại với
//            máy chủ ngay lập tức bằng lay_thong_tin_ca_nhan - làm ĐÚNG MẪU
//            app.js của Cờ Vua ngay từ đầu, KHÔNG lặp "nợ T3" (Sổ Tay D10).
// BƯỚC: KC_00
// NGÀY: 17/07/2026
// PHỤ THUỘC: kc_config.js, kc_api.js phải nạp TRƯỚC file này.
//
// HỢP ĐỒNG VỚI CÁC MODULE KHÁC (vd: kc_ytuong.js, các module tương lai):
//   - File này bắn ra 1 sự kiện DOM tên "kcSanSang" trên `document` khi đã
//     biết chắc chắn trạng thái đăng nhập (đã xác thực lại với máy chủ, hoặc
//     xác định chưa đăng nhập). event.detail = { daDangNhap, taiKhoan }.
//   - Module khác lắng nghe sự kiện này (trong DOMContentLoaded của chính
//     nó) thay vì tự đọc sessionStorage, để KHÔNG có 2 nơi cùng đọc/ghi
//     phiên (tránh trùng lặp code xác thực, tránh 2 nguồn sự thật).
//   - Biến toàn cục kcTaiKhoanHienTai luôn phản ánh trạng thái mới nhất sau
//     khi kcSanSang đã bắn (null nếu chưa đăng nhập).
//   - kcBaoSanSang() CỐ TÌNH bắn sự kiện qua setTimeout(...,0) ngay cả ở
//     nhánh đồng bộ (chưa từng đăng nhập) để đảm bảo MỌI module khác đã kịp
//     đăng ký lắng nghe trong DOMContentLoaded của riêng chúng trước khi sự
//     kiện được bắn - tránh lỡ mất sự kiện do thứ tự chạy DOMContentLoaded.
//
// PHẦN TỬ HTML CẦN CÓ TRÊN TRANG:
//   #kcChuaDangNhap          (khối đăng nhập, ẩn khi đã đăng nhập)
//     input#kcOTen, input#kcOMatKhau, button#kcNutDangNhap,
//     div#kcThongBaoDangNhap
//   #kcNoiDungCanDangNhap    (bọc toàn bộ nội dung cần đăng nhập mới thấy)
//   #kcTenNguoiChoi (tùy chọn), button#kcNutDangXuat (tùy chọn)
//
// KHÓA sessionStorage: "kcTaiKhoanDangNhap" - KHÁC khóa "coVuaTaiKhoanDangNhap"
//   của Cờ Vua để không giẫm phiên khi mở 2 app trong CÙNG 1 thẻ trình duyệt
//   (Sổ Tay mục A5).
// ================================================================

var KC_KHOA_PHIEN = "kcTaiKhoanDangNhap";

var kcTaiKhoanHienTai = null; // null cho tới khi kcSanSang bắn với daDangNhap=true

// ================================================================
// PHẦN 1: KHỞI ĐỘNG
// ================================================================

function kcAuthKhoiTao() {
  kcGanSuKienDangNhap();
  kcGanSuKienDangXuat();

  var phienCu = kcDocPhien();
  if (!phienCu || !phienCu.tenDangNhap) {
    kcHienChuaDangNhap();
    kcBaoSanSang(false);
    return;
  }

  // Hiện tạm dữ liệu cũ trong lúc chờ xác thực lại (đỡ giật giao diện)
  kcTaiKhoanHienTai = phienCu;
  kcHienDaDangNhap(phienCu);

  kcGoiRpc("lay_thong_tin_ca_nhan", { p_ten: phienCu.tenDangNhap }).then(function (kq) {
    if (!kq || !kq.thanhCong || !kq.thongTin) {
      // Tài khoản không còn hợp lệ (đổi mật khẩu ở nơi khác, tài khoản bị xoá...)
      kcDangXuat();
      kcBaoSanSang(false);
      return;
    }
    // Cập nhật vài số liệu hay đổi (kim cương...) nhưng GIỮ maPhien cũ vì
    // lay_thong_tin_ca_nhan không sinh phiên mới (chỉ dang_nhap mới sinh).
    kcTaiKhoanHienTai.diemSo = kq.thongTin.diemSo;
    kcTaiKhoanHienTai.vaiTro = kq.thongTin.vaiTro;
    kcTaiKhoanHienTai.avatarDaChon = kq.thongTin.avatarDaChon;
    kcLuuPhien(kcTaiKhoanHienTai);
    kcHienDaDangNhap(kcTaiKhoanHienTai);
    kcBaoSanSang(true);
  });
}

function kcBaoSanSang(daDangNhap) {
  setTimeout(function () {
    document.dispatchEvent(new CustomEvent("kcSanSang", {
      detail: { daDangNhap: daDangNhap, taiKhoan: kcTaiKhoanHienTai }
    }));
  }, 0);
}

// ================================================================
// PHẦN 2: ĐỌC/GHI/XOÁ PHIÊN (sessionStorage)
// ================================================================

function kcDocPhien() {
  try {
    var chuoi = sessionStorage.getItem(KC_KHOA_PHIEN);
    if (!chuoi) return null;
    return JSON.parse(chuoi);
  } catch (loi) {
    return null;
  }
}

function kcLuuPhien(duLieu) {
  try {
    sessionStorage.setItem(KC_KHOA_PHIEN, JSON.stringify(duLieu));
  } catch (loi) {
    // Chế độ ẩn danh có thể chặn sessionStorage - bỏ qua, không vỡ trang
  }
}

function kcXoaPhien() {
  try {
    sessionStorage.removeItem(KC_KHOA_PHIEN);
  } catch (loi) { /* bỏ qua */ }
}

// ================================================================
// PHẦN 3: ĐĂNG NHẬP
// ================================================================

function kcGanSuKienDangNhap() {
  var oNut = document.getElementById("kcNutDangNhap");
  var oMatKhau = document.getElementById("kcOMatKhau");
  if (oNut) oNut.addEventListener("click", kcXuLyDangNhap);
  if (oMatKhau) {
    oMatKhau.addEventListener("keydown", function (su) {
      if (su.key === "Enter") kcXuLyDangNhap();
    });
  }
}

function kcXuLyDangNhap() {
  var oTen = document.getElementById("kcOTen");
  var oMatKhau = document.getElementById("kcOMatKhau");
  var oNut = document.getElementById("kcNutDangNhap");
  var ten = oTen ? oTen.value.trim() : "";
  var matKhau = oMatKhau ? oMatKhau.value : "";

  if (!ten || !matKhau) {
    kcHienThongBaoDangNhap("Con nhập đủ tên đăng nhập và mật khẩu nhé!", "xau");
    return;
  }

  if (oNut) oNut.disabled = true;
  kcHienThongBaoDangNhap("Đang đăng nhập...", "tot");

  kcGoiRpc("dang_nhap", { p_ten: ten, p_mat_khau: matKhau }).then(function (kq) {
    if (oNut) oNut.disabled = false;
    kq = kq || {};

    if (!kq.thanhCong || !kq.duLieuTaiKhoan) {
      kcHienThongBaoDangNhap(kq.thongBao || "Sai tên hoặc mật khẩu, con thử lại nhé.", "xau");
      return;
    }

    kcTaiKhoanHienTai = kq.duLieuTaiKhoan;
    kcLuuPhien(kcTaiKhoanHienTai);
    kcHienDaDangNhap(kcTaiKhoanHienTai);
    kcBaoSanSang(true);
  });
}

// ================================================================
// PHẦN 4: ĐĂNG XUẤT
// ================================================================

function kcGanSuKienDangXuat() {
  var oNut = document.getElementById("kcNutDangXuat");
  if (oNut) oNut.addEventListener("click", kcDangXuat);
}

function kcDangXuat() {
  kcXoaPhien();
  kcTaiKhoanHienTai = null;
  kcHienChuaDangNhap();
}

// ================================================================
// PHẦN 5: HIỆN/ẨN GIAO DIỆN THEO TRẠNG THÁI
// ================================================================

function kcHienChuaDangNhap() {
  var khoiChua = document.getElementById("kcChuaDangNhap");
  var khoiCan = document.getElementById("kcNoiDungCanDangNhap");
  if (khoiChua) khoiChua.style.display = "block";
  if (khoiCan) khoiCan.style.display = "none";
}

function kcHienDaDangNhap(taiKhoan) {
  var khoiChua = document.getElementById("kcChuaDangNhap");
  var khoiCan = document.getElementById("kcNoiDungCanDangNhap");
  if (khoiChua) khoiChua.style.display = "none";
  if (khoiCan) khoiCan.style.display = "block";

  var oTen = document.getElementById("kcTenNguoiChoi");
  if (oTen) oTen.textContent = "Xin chào, " + taiKhoan.tenDangNhap;

  var oNutDangXuat = document.getElementById("kcNutDangXuat");
  if (oNutDangXuat) oNutDangXuat.style.display = "inline-block";
}

function kcHienThongBaoDangNhap(text, loai) {
  var o = document.getElementById("kcThongBaoDangNhap");
  if (!o) return;
  o.textContent = text;
  o.className = "hien " + (loai === "xau" ? "xau" : "tot");
}

// ================================================================
// KHỞI CHẠY
// ================================================================
document.addEventListener("DOMContentLoaded", kcAuthKhoiTao);
