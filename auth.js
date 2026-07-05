// ================================
// FILE: auth.js
// CHỨC NĂNG: Xử lý nút Đăng Nhập / Đăng Ký, kiểm tra dữ liệu đầu vào
// BƯỚC: MIG_04
// QUY ƯỚC TÊN HÀM/BIẾN: tất cả bắt đầu bằng "auth" để tránh xung đột
// PHỤ THUỘC: api.js (apiDangNhap, apiDangKy) và app.js (appDangNhapThanhCong)
// ================================

/**
 * Hàm khởi tạo module auth, chạy khi trang tải xong
 * Gán sự kiện click cho nút Đăng Nhập và nút Đăng Ký
 */
function authKhoiTao() {
  var nutDangNhap = document.getElementById("btnDangNhap");
  if (nutDangNhap) {
    nutDangNhap.addEventListener("click", authXuLyDangNhap);
  }

  var nutDangKy = document.getElementById("btnDangKy");
  if (nutDangKy) {
    nutDangKy.addEventListener("click", authXuLyDangKy);
  }

  // Cho phép bấm phím Enter trong ô mật khẩu để đăng nhập nhanh
  var oMatKhauLogin = document.getElementById("inputMatKhauLogin");
  if (oMatKhauLogin) {
    oMatKhauLogin.addEventListener("keydown", function (suKien) {
      if (suKien.key === "Enter") {
        authXuLyDangNhap();
      }
    });
  }

  // Cho phép bấm phím Enter trong ô xác nhận mật khẩu để đăng ký nhanh
  var oXacNhanMatKhau = document.getElementById("inputXacNhanMatKhau");
  if (oXacNhanMatKhau) {
    oXacNhanMatKhau.addEventListener("keydown", function (suKien) {
      if (suKien.key === "Enter") {
        authXuLyDangKy();
      }
    });
  }
}

/**
 * Hàm xử lý khi bấm nút Đăng Nhập
 * Đọc dữ liệu từ 2 ô input, kiểm tra hợp lệ rồi gọi apiDangNhap (api.js)
 * Nếu thành công: gọi appDangNhapThanhCong (app.js) để chuyển sang Dashboard
 */
function authXuLyDangNhap() {
  var tenDangNhap = authLayGiaTriInput("inputTenDangNhapLogin");
  var matKhau = authLayGiaTriInput("inputMatKhauLogin");

  // Kiểm tra dữ liệu đầu vào trước khi gọi lên máy chủ
  var loiKiemTra = authKiemTraDauVao(tenDangNhap, matKhau);
  if (loiKiemTra) {
    authHienThongBao(loiKiemTra, false);
    return;
  }

  // Khóa nút và báo đang xử lý để tránh bấm nhiều lần
  authDatTrangThaiNut("btnDangNhap", true, "Đang xử lý...");
  authHienThongBao("Đang kiểm tra tài khoản, chờ chút nhé...", true);

  apiDangNhap(tenDangNhap, matKhau).then(function (ketQua) {
    authDatTrangThaiNut("btnDangNhap", false, "Đăng Nhập");

    if (ketQua.thanhCong) {
      authHienThongBao(ketQua.thongBao, true);
      authXoaTrangCacInput();
      // Báo cho app.js biết đã đăng nhập thành công để chuyển Tab
      appDangNhapThanhCong(ketQua.duLieuTaiKhoan);
    } else {
      authHienThongBao(ketQua.thongBao, false);
    }
  });
}

/**
 * Hàm xử lý khi bấm nút Đăng Ký
 * Kiểm tra thêm: mật khẩu nhập lại phải khớp
 * Nếu đăng ký thành công: tự động đăng nhập luôn (gọi appDangNhapThanhCong)
 */
function authXuLyDangKy() {
  var tenDangNhap = authLayGiaTriInput("inputTenDangNhapDangKy");
  var matKhau = authLayGiaTriInput("inputMatKhauDangKy");
  var xacNhanMatKhau = authLayGiaTriInput("inputXacNhanMatKhau");

  // Kiểm tra dữ liệu đầu vào cơ bản
  var loiKiemTra = authKiemTraDauVao(tenDangNhap, matKhau);
  if (loiKiemTra) {
    authHienThongBao(loiKiemTra, false);
    return;
  }

  // Kiểm tra riêng cho đăng ký: 2 lần nhập mật khẩu phải giống nhau
  if (matKhau !== xacNhanMatKhau) {
    authHienThongBao("Mật khẩu nhập lại không khớp, vui lòng kiểm tra lại", false);
    return;
  }

  authDatTrangThaiNut("btnDangKy", true, "Đang xử lý...");
  authHienThongBao("Đang tạo tài khoản mới, chờ chút nhé...", true);

  apiDangKy(tenDangNhap, matKhau).then(function (ketQua) {
    authDatTrangThaiNut("btnDangKy", false, "Đăng Ký");

    if (ketQua.thanhCong) {
      authHienThongBao(ketQua.thongBao + " - Chào mừng bạn đến với Cờ Vua Cho Trẻ Em!", true);
      authXoaTrangCacInput();
      // Đăng ký xong tự động đăng nhập luôn cho tiện
      appDangNhapThanhCong(ketQua.duLieuTaiKhoan);
    } else {
      authHienThongBao(ketQua.thongBao, false);
    }
  });
}

/**
 * Hàm kiểm tra dữ liệu đầu vào dùng chung cho cả Đăng Nhập và Đăng Ký
 * Trả về: chuỗi thông báo lỗi nếu có lỗi, null nếu hợp lệ
 */
function authKiemTraDauVao(tenDangNhap, matKhau) {
  if (!tenDangNhap || !matKhau) {
    return "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu";
  }

  if (tenDangNhap.length < 3) {
    return "Tên đăng nhập phải có ít nhất 3 ký tự";
  }

  if (tenDangNhap.length > 20) {
    return "Tên đăng nhập không được dài quá 20 ký tự";
  }

  // Chỉ cho phép chữ cái không dấu, số và dấu gạch dưới để tránh lỗi dữ liệu
  var mauHopLe = /^[a-zA-Z0-9_]+$/;
  if (!mauHopLe.test(tenDangNhap)) {
    return "Tên đăng nhập chỉ được dùng chữ cái không dấu, số và dấu gạch dưới";
  }

  if (matKhau.length < 4) {
    return "Mật khẩu phải có ít nhất 4 ký tự";
  }

  return null;
}

/**
 * Hàm phụ trợ: lấy giá trị 1 ô input theo id, tự động cắt khoảng trắng thừa
 */
function authLayGiaTriInput(idInput) {
  var oInput = document.getElementById(idInput);
  if (!oInput) return "";
  return oInput.value.trim();
}

/**
 * Hàm phụ trợ: hiện thông báo vào khung #thongBaoAuth
 * Gán class "thanhCong" hoặc "thatBai" để style.css tô màu tương ứng
 */
function authHienThongBao(noiDung, laThanhCong) {
  var khungThongBao = document.getElementById("thongBaoAuth");
  if (!khungThongBao) return;

  khungThongBao.textContent = noiDung;
  khungThongBao.classList.remove("thanhCong", "thatBai");

  if (laThanhCong) {
    khungThongBao.classList.add("thanhCong");
  } else {
    khungThongBao.classList.add("thatBai");
  }
}

/**
 * Hàm phụ trợ: khóa/mở khóa 1 nút và đổi chữ trên nút
 * Dùng khi đang chờ máy chủ trả lời để tránh người dùng bấm liên tục
 */
function authDatTrangThaiNut(idNut, dangKhoa, chuTrenNut) {
  var nut = document.getElementById(idNut);
  if (!nut) return;

  nut.disabled = dangKhoa;
  nut.textContent = chuTrenNut;
  nut.style.opacity = dangKhoa ? "0.6" : "1";
}

/**
 * Hàm phụ trợ: xóa trắng toàn bộ các ô input sau khi đăng nhập/đăng ký thành công
 */
function authXoaTrangCacInput() {
  var dsIdInput = [
    "inputTenDangNhapLogin",
    "inputMatKhauLogin",
    "inputTenDangNhapDangKy",
    "inputMatKhauDangKy",
    "inputXacNhanMatKhau"
  ];

  dsIdInput.forEach(function (idInput) {
    var oInput = document.getElementById(idInput);
    if (oInput) oInput.value = "";
  });
}

// Chạy hàm khởi tạo ngay khi toàn bộ HTML đã được dựng xong
document.addEventListener("DOMContentLoaded", authKhoiTao);