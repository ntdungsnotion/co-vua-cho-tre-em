// ================================
// FILE: app.js
// CHỨC NĂNG: Điều khiển ẩn/hiện 4 Tab (Auth, Dashboard, Play, Rank) và theo dõi trạng thái đăng nhập
// BƯỚC: MIG_04
// QUY ƯỚC TÊN HÀM/BIẾN: tất cả bắt đầu bằng "app" để tránh xung đột
// ================================

// Biến lưu trạng thái tài khoản đang đăng nhập (null nếu chưa đăng nhập)
// Cấu trúc giống duLieuTaiKhoan trả về từ api.js: { tenDangNhap, level, diemSo, avatarDaChon }
var appTaiKhoanDangNhap = null;

/**
 * Hàm khởi tạo ứng dụng, chạy ngay khi trang tải xong
 * Gán sự kiện click cho các nút Tab và nút Đăng Xuất
 * Mặc định hiện Tab Đăng Nhập lúc chưa có ai đăng nhập
 */
function appKhoiTao() {
  // Gán sự kiện cho từng nút Tab trên thanh điều hướng
  var dsNutTab = document.querySelectorAll(".nutTab");
  dsNutTab.forEach(function (nut) {
    nut.addEventListener("click", function () {
      var tenTab = nut.getAttribute("data-tab");
      appChuyenTab(tenTab);
    });
  });

  // Gán sự kiện cho nút Đăng Xuất trên header
  var nutDangXuat = document.getElementById("btnDangXuat");
  if (nutDangXuat) {
    nutDangXuat.addEventListener("click", appXuLyDangXuat);
  }

  // Trạng thái ban đầu: chưa đăng nhập -> hiện Tab Đăng Nhập
  appChuyenTab("auth");
  appCapNhatGiaoDienHeader();
}

/**
 * Hàm chuyển đổi Tab đang hiển thị
 * Nhận vào: tenTab (chuỗi), ví dụ: "auth", "dashboard", "play", "rank"
 * Ẩn hết các noiDungTab, chỉ hiện Tab được chọn
 * Đồng thời cập nhật class "dangChon" cho nút Tab tương ứng
 */
function appChuyenTab(tenTab) {
  // Nếu chưa đăng nhập, chặn không cho vào Dashboard/Play/Rank, bắt buộc quay về Auth
  if (!appTaiKhoanDangNhap && tenTab !== "auth") {
    tenTab = "auth";
  }

  // Ẩn hết tất cả nội dung Tab
  var dsNoiDungTab = document.querySelectorAll(".noiDungTab");
  dsNoiDungTab.forEach(function (khoi) {
    khoi.classList.remove("dangHien");
  });

  // Hiện nội dung Tab được chọn
  var khoiDuocChon = document.getElementById("section-" + tenTab);
  if (khoiDuocChon) {
    khoiDuocChon.classList.add("dangHien");
  }

  // Cập nhật trạng thái "dangChon" cho nút Tab trên thanh điều hướng
  var dsNutTab = document.querySelectorAll(".nutTab");
  dsNutTab.forEach(function (nut) {
    if (nut.getAttribute("data-tab") === tenTab) {
      nut.classList.add("dangChon");
    } else {
      nut.classList.remove("dangChon");
    }
  });
}

/**
 * Hàm được gọi từ auth.js sau khi đăng nhập/đăng ký thành công
 * Nhận vào: duLieuTaiKhoan (object) trả về từ api.js
 * Lưu trạng thái đăng nhập, cập nhật giao diện, chuyển sang Tab Dashboard
 */
function appDangNhapThanhCong(duLieuTaiKhoan) {
  appTaiKhoanDangNhap = duLieuTaiKhoan;
  appCapNhatGiaoDienHeader();
  appCapNhatDashboard(duLieuTaiKhoan);
  appChuyenTab("dashboard");
}

/**
 * Hàm xử lý khi người dùng bấm nút Đăng Xuất
 * Xóa trạng thái đăng nhập, quay về Tab Đăng Nhập
 */
function appXuLyDangXuat() {
  appTaiKhoanDangNhap = null;
  appCapNhatGiaoDienHeader();
  appChuyenTab("auth");
}

/**
 * Hàm cập nhật khu vực header: hiện tên đăng nhập và nút Đăng Xuất
 * nếu đã đăng nhập, ngược lại ẩn đi
 */
function appCapNhatGiaoDienHeader() {
  var oHienTen = document.getElementById("hienThiTenDangNhap");
  var nutDangXuat = document.getElementById("btnDangXuat");

  if (appTaiKhoanDangNhap) {
    if (oHienTen) oHienTen.textContent = "Xin chào, " + appTaiKhoanDangNhap.tenDangNhap;
    if (nutDangXuat) nutDangXuat.style.display = "inline-block";
  } else {
    if (oHienTen) oHienTen.textContent = "";
    if (nutDangXuat) nutDangXuat.style.display = "none";
  }
}

/**
 * Hàm cập nhật toàn bộ thông tin hiển thị trên Tab Dashboard
 * Nhận vào: duLieuTaiKhoan (object) có các trường: tenDangNhap, level, diemSo, avatarDaChon
 * Tự tính danh hiệu và trạng thái mở khóa dựa theo Level (dựa trên quy tắc giống supabase_setup.sql)
 */
function appCapNhatDashboard(duLieuTaiKhoan) {
  var oTen = document.getElementById("dashboardTenDangNhap");
  var oLevel = document.getElementById("dashboardLevel");
  var oDiem = document.getElementById("dashboardDiemSo");
  var oDanhHieu = document.getElementById("dashboardDanhHieu");
  var oAvatar = document.getElementById("dashboardAvatar");

  if (oTen) oTen.textContent = duLieuTaiKhoan.tenDangNhap;
  if (oLevel) oLevel.textContent = duLieuTaiKhoan.level;
  if (oDiem) oDiem.textContent = duLieuTaiKhoan.diemSo;
  if (oDanhHieu) oDanhHieu.textContent = appTinhDanhHieu(duLieuTaiKhoan.level);
  if (oAvatar) oAvatar.textContent = duLieuTaiKhoan.avatarDaChon || "❓";

  appCapNhatTrangThaiMoKhoa(duLieuTaiKhoan.level);
}

/**
 * Hàm tính danh hiệu hiển thị dựa theo Level (bản sao logic từ tinh_danh_hieu() trong SQL)
 */
function appTinhDanhHieu(level) {
  if (level >= 1 && level <= 4) return "Tốt Chăm Chỉ";
  if (level >= 5 && level <= 8) return "Mã Tốc Độ";
  if (level >= 9 && level <= 12) return "Tượng Thông Thái";
  if (level >= 13 && level <= 16) return "Xe Tiên Phong";
  if (level >= 17 && level <= 19) return "Hậu Quyền Lực";
  if (level >= 20) return "Vua Kỳ Thủ";
  return "Chưa Xác Định";
}

/**
 * Hàm cập nhật giao diện danh sách Phần Thưởng Đã Mở Khóa trên Dashboard
 * dựa theo các mốc Level 5/10/15/20, gán/xóa class "daMoKhoa" tương ứng
 */
function appCapNhatTrangThaiMoKhoa(level) {
  appGanTrangThaiMoKhoa("moKhoaMauBanCoMoi", level >= 5, "Màu bàn cờ mới (Level 5)");
  appGanTrangThaiMoKhoa("moKhoaQuanCoDongVat", level >= 10, "Bộ quân cờ động vật (Level 10)");
  appGanTrangThaiMoKhoa("moKhoaHieuUngSamSet", level >= 15, "Hiệu ứng sấm sét (Level 15)");
  appGanTrangThaiMoKhoa("moKhoaRuongKhoBau", level >= 20, "Rương kho báu đặc biệt (Level 20)");
}

/**
 * Hàm phụ trợ: gán class "daMoKhoa" và cập nhật chú thích cho 1 mục phần thưởng
 */
function appGanTrangThaiMoKhoa(idPhanTu, daMoKhoa, nhanGoc) {
  var phanTu = document.getElementById(idPhanTu);
  if (!phanTu) return;

  if (daMoKhoa) {
    phanTu.classList.add("daMoKhoa");
    phanTu.textContent = nhanGoc + ": đã mở khóa";
  } else {
    phanTu.classList.remove("daMoKhoa");
    phanTu.textContent = nhanGoc + ": chưa mở";
  }
}

/**
 * Hàm cho phép các file khác (board.js) lấy thông tin tài khoản đang đăng nhập
 */
function appLayTaiKhoanDangNhap() {
  return appTaiKhoanDangNhap;
}

/**
 * Hàm cho phép board.js cập nhật lại dữ liệu tài khoản sau khi kết thúc 1 ván cờ
 * (gọi lại appCapNhatDashboard để đồng bộ giao diện Dashboard với điểm/level mới nhất)
 */
function appCapNhatTaiKhoanSauVanCo(duLieuTaiKhoanMoi) {
  appTaiKhoanDangNhap.level = duLieuTaiKhoanMoi.levelMoi;
  appTaiKhoanDangNhap.diemSo = duLieuTaiKhoanMoi.diemMoi;
  appCapNhatDashboard(appTaiKhoanDangNhap);
}

// Chạy hàm khởi tạo ngay khi toàn bộ HTML đã được dựng xong
document.addEventListener("DOMContentLoaded", appKhoiTao);