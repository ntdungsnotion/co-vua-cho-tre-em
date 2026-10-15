// ================================
// FILE: app.js
// CHỨC NĂNG: Điều khiển ẩn/hiện các Tab, theo dõi trạng thái đăng nhập, MENU
//            THEO VAI TRÒ và "THANH THÔNG TIN TRÊN CÙNG" (avatar/kim cương/EXP/
//            level/danh hiệu/hạng) - dùng chung cho mọi trang con (board.js,
//            rank.js, taikhoan_NC.js).
// BƯỚC: NC_05 (nâng cấp từ MIG_04) - NGÀY: 10/07/2026
// CẬP NHẬT: KC_00B (hợp nhất đăng nhập với Kids Challenge) - 14/10/2026 21:57
// CẬP NHẬT: KC_00C-1 - 15/10/2026: chưa đăng nhập / đăng xuất -> về Trang chủ
//   chung kc/trangchu_NC.html (APP_TRANG_CHU); đăng nhập/đăng ký nằm ở đó.
// QUY ƯỚC TÊN HÀM/BIẾN: tất cả bắt đầu bằng "app" để tránh xung đột
//
// ĐIỂM MỚI KC_00B (nguyên tắc "trải nghiệm như 1 ứng dụng duy nhất"):
//   - Kids Challenge (/kc/kc_auth.js) nay dùng CHUNG khóa phiên
//     APP_KHOA_LUU_PHIEN và cùng cấu trúc dữ liệu -> đăng nhập 1 lần dùng
//     cho cả 2 app; đăng xuất ở đâu cũng là đăng xuất cả 2.
//   - Vai trò 'phu_huynh' (tài khoản phụ huynh của Kids Challenge): đăng nhập
//     ở trang này thì được đưa thẳng sang khu phụ huynh /kc/thuthach_NC.html
//     (appDuaPhuHuynhSangKhuRieng) - Cờ Vua không có màn hình cho phụ huynh.
//   - Quay lại trang bằng nút Back mà phiên đã đổi ở trang khác -> tự tải lại.
//
// ĐIỂM MỚI NC_05 (KẾ HOẠCH mục NC_05, HƯỚNG DẪN mục 3):
//   - appTaiKhoanDangNhap nay luu THEM vaiTro, kinhNghiem, maPhien, trangBi (da
//     co san tu RPC dang_nhap/dang_ky tu NC_00 nhung truoc day app.js bo qua).
//   - Tab "Bảng Điều Khiển" cũ đổi thành Tab "Tài Khoản" (section-taikhoan); toàn
//     bộ nội dung chi tiết (avatar, trang bị, lịch sử trận, thống kê đối thủ...)
//     do file taikhoan_NC.js đảm nhiệm - app.js chỉ điều khiển CHUYỂN TAB.
//   - MENU THEO VAI TRÒ: mục "Quản Trị" chỉ hiện khi vaiTro === 'admin'
//     (appCapNhatMenuTheoVaiTro). Quản Trị/Cửa Hàng/Học Tập/Khám Phá hiện dạng
//     nút "sắp có" (class nutTabSapCo, disabled) vì trang tương ứng CHƯA làm
//     (NC_06A/NC_06B/NC_07) - chỉ "để chỗ sẵn" như KẾ HOẠCH yêu cầu.
//   - THANH THÔNG TIN TRÊN CÙNG (appLamMoiThanhThongTin/appVeThanhThongTin): gọi
//     RPC lay_thong_tin_ca_nhan (api.js: apiLayThongTinCaNhan) ngay sau đăng nhập
//     và SAU MỖI VÁN/GIAO DỊCH để luôn đúng số liệu, thay vì chỉ tin dữ liệu cũ
//     lưu cục bộ như bản vá tạm thời trước đây.
//   - XÁC THỰC LẠI PHIÊN LÚC KHÔI PHỤC (F5): appKhoiTao gọi appLamMoiThanhThongTin
//     ngay sau khi khôi phục sessionStorage; nếu máy chủ báo "không tìm thấy tài
//     khoản" thì tự đăng xuất an toàn (đúng góp ý để lại từ bản vá NC_02/NC_03).
//   - appCapNhatTrangBiCucBo(): cho taikhoan_NC.js đồng bộ trang_bi/avatar mới
//     vào appTaiKhoanDangNhap NGAY (không cần F5) để board.js (đọc trực tiếp
//     appLayTaiKhoanDangNhap().trangBi) áp dụng đúng ở ván cờ tiếp theo.
// ================================

// Biến lưu trạng thái tài khoản đang đăng nhập (null nếu chưa đăng nhập)
// Cấu trúc: { tenDangNhap, level, diemSo, avatarDaChon, vaiTro, kinhNghiem,
//             maPhien, trangBi }
var appTaiKhoanDangNhap = null;

// Khóa dùng để lưu phiên đăng nhập vào sessionStorage (giữ đăng nhập qua F5)
// KC_00B: DÙNG CHUNG với Kids Challenge (KC_KHOA_PHIEN trong kc/kc_auth.js)
var APP_KHOA_LUU_PHIEN = "coVuaTaiKhoanDangNhap";

// KC_00B: trang riêng của phụ huynh (Kids Challenge - Thử Thách)
var APP_TRANG_PHU_HUYNH = "kc/thuthach_NC.html";

// KC_00C-1: Trang chủ chung (đăng nhập/đăng ký nằm ở đây, giao diện Kids Challenge)
var APP_TRANG_CHU = "kc/trangchu_NC.html";

// NC_05: dữ liệu ĐANG HIỂN THỊ trên Thanh Thông Tin Trên Cùng (cache nhẹ để các
// hàm cập nhật cục bộ như appCapNhatTrangBiCucBo không cần gọi lại máy chủ)
var appThongTinHienThi = null;

/**
 * Hàm lưu toàn bộ thông tin tài khoản đang đăng nhập vào sessionStorage.
 * Gọi sau khi đăng nhập/đăng ký thành công và sau mỗi lần điểm/level/trang bị đổi.
 */
function appLuuPhienDangNhap() {
  if (!appTaiKhoanDangNhap) return;
  try {
    sessionStorage.setItem(APP_KHOA_LUU_PHIEN, JSON.stringify(appTaiKhoanDangNhap));
  } catch (loi) {
    // Một số trình duyệt/chế độ ẩn danh chặn sessionStorage -> bỏ qua, F5 sẽ phải
    // đăng nhập lại như trước, không ảnh hưởng các chức năng khác
  }
}

/** Hàm xóa phiên đăng nhập đã lưu, gọi khi Đăng Xuất */
function appXoaPhienDangNhap() {
  try {
    sessionStorage.removeItem(APP_KHOA_LUU_PHIEN);
  } catch (loi) {
    // Bỏ qua nếu trình duyệt chặn sessionStorage
  }
}

/** Hàm đọc lại phiên đăng nhập đã lưu (trả về null nếu chưa có hoặc lỗi) */
function appKhoiPhucPhienDangNhap() {
  try {
    var chuoi = sessionStorage.getItem(APP_KHOA_LUU_PHIEN);
    if (!chuoi) return null;
    return JSON.parse(chuoi);
  } catch (loi) {
    return null;
  }
}

/**
 * Hàm khởi tạo ứng dụng, chạy ngay khi trang tải xong
 * Gán sự kiện click cho các nút Tab và nút Đăng Xuất
 * Mặc định hiện Tab Đăng Nhập lúc chưa có ai đăng nhập
 */
function appKhoiTao() {
  // Gán sự kiện cho từng nút Tab trên thanh điều hướng (không gồm nút "sắp có")
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

  // Thử khôi phục phiên đăng nhập đã lưu (giữ đăng nhập qua F5)
  var phienDaLuu = appKhoiPhucPhienDangNhap();
  if (phienDaLuu && phienDaLuu.tenDangNhap) {
    if (appDuaPhuHuynhSangKhuRieng(phienDaLuu.vaiTro)) return;
    appTaiKhoanDangNhap = phienDaLuu;
    appCapNhatGiaoDienHeader();
    appCapNhatMenuTheoVaiTro(phienDaLuu.vaiTro);
    // Hiện tạm bằng dữ liệu cũ lưu cục bộ trong lúc chờ máy chủ xác nhận lại
    appHienThanhThongTinSoBo(phienDaLuu);
    appChuyenTab("taikhoan");
    // NC_05: xác thực + làm mới lại với máy chủ (nguồn số liệu chuẩn), đồng thời
    // phát hiện tài khoản không còn tồn tại thì tự đăng xuất an toàn.
    // (Trang Tài Khoản tự tải hồ sơ chi tiết riêng - xem taikhoan_NC.js)
    appLamMoiThanhThongTin();
  } else {
    // KC_00C-1: chưa đăng nhập -> về Trang chủ chung (index.html đã chuyển ngay
    // trong <head>; dòng này dự phòng). Chỉ còn ở lại đây khi sessionStorage bị chặn.
    if (appCoTheLuuPhien()) { window.location.replace(APP_TRANG_CHU); return; }
    // Trạng thái ban đầu: chưa đăng nhập -> hiện Tab Đăng Nhập
    appChuyenTab("auth");
    appCapNhatGiaoDienHeader();
  }
}

/**
 * Hàm chuyển đổi Tab đang hiển thị
 * Nhận vào: tenTab (chuỗi), ví dụ: "auth", "taikhoan", "play", "rank"
 * Ẩn hết các noiDungTab, chỉ hiện Tab được chọn
 * Đồng thời cập nhật class "dangChon" cho nút Tab tương ứng
 */
function appChuyenTab(tenTab) {
  // Nếu chưa đăng nhập, chặn không cho vào các Tab cần đăng nhập, bắt buộc quay về Auth
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
 * Lưu trạng thái đăng nhập, dựng menu theo vai trò, cập nhật giao diện,
 * chuyển sang Tab Tài Khoản
 */
function appDangNhapThanhCong(duLieuTaiKhoan) {
  appTaiKhoanDangNhap = duLieuTaiKhoan;
  appLuuPhienDangNhap();
  if (appDuaPhuHuynhSangKhuRieng(duLieuTaiKhoan.vaiTro)) return;
  appCapNhatGiaoDienHeader();
  appCapNhatMenuTheoVaiTro(duLieuTaiKhoan.vaiTro);
  appHienThanhThongTinSoBo(duLieuTaiKhoan);
  appChuyenTab("taikhoan");
  appLamMoiThanhThongTin();

  // Trang Tài Khoản (taikhoan_NC.js) tự tải hồ sơ chi tiết ngay khi vừa đăng nhập,
  // vì thời điểm này DOMContentLoaded của taikhoan_NC.js đã chạy xong từ trước
  // (lúc đó chưa đăng nhập nên chưa tự tải được) - gọi lại đây cho chắc chắn.
  if (typeof taikhoanTaiHoSo === "function") {
    taikhoanTaiHoSo();
  }
}

/**
 * Hàm xử lý khi người dùng bấm nút Đăng Xuất
 * Xóa trạng thái đăng nhập, ẩn thanh thông tin, ẩn menu Quản Trị, quay về Tab Đăng Nhập
 */
function appXuLyDangXuat() {
  appTaiKhoanDangNhap = null;
  appThongTinHienThi = null;
  appXoaPhienDangNhap();
  appCapNhatGiaoDienHeader();
  appAnThanhThongTin();
  appCapNhatMenuTheoVaiTro(null);
  // KC_00C-1: đăng xuất -> về Trang chủ chung (đăng nhập lại ở đó)
  if (appCoTheLuuPhien()) { window.location.replace(APP_TRANG_CHU); return; }
  appChuyenTab("auth");
}

/** KC_00C-1: trình duyệt có cho dùng sessionStorage không (chế độ riêng tư có thể chặn) */
function appCoTheLuuPhien() {
  try {
    sessionStorage.setItem("__thu", "1");
    sessionStorage.removeItem("__thu");
    return true;
  } catch (loi) {
    return false;
  }
}

/**
 * Hàm cập nhật khu vực header: hiện tên đăng nhập và nút Đăng Xuất
 * nếu đã đăng nhập, ngược lại ẩn đi
 */
function appCapNhatGiaoDienHeader() {
  var oHienTen = document.getElementById("hienThiTenDangNhap");
  var nutDangXuat = document.getElementById("btnDangXuat");
  var tabDangNhap = document.getElementById("tabAuth");

  if (appTaiKhoanDangNhap) {
    if (oHienTen) oHienTen.textContent = "Xin chào, " + appTaiKhoanDangNhap.tenDangNhap;
    if (nutDangXuat) nutDangXuat.style.display = "inline-block";
    // Đã đăng nhập: ẩn tab "Đăng Nhập" trên thanh điều hướng vì đã có nút Đăng Xuất
    // ở header, tránh gây nhầm lẫn/không thân thiện khi thấy cả 2 cùng lúc
    if (tabDangNhap) tabDangNhap.style.display = "none";
  } else {
    if (oHienTen) oHienTen.textContent = "";
    if (nutDangXuat) nutDangXuat.style.display = "none";
    if (tabDangNhap) tabDangNhap.style.display = "inline-block";
  }
}

/**
 * KC_00B: Tài khoản phụ huynh không có màn hình nào bên Cờ Vua -> chuyển sang
 * khu phụ huynh của Kids Challenge (phiên đã lưu chung nên bên đó đăng nhập
 * sẵn). Trả về true nếu đã chuyển trang (nơi gọi dừng xử lý tiếp).
 */
function appDuaPhuHuynhSangKhuRieng(vaiTro) {
  if (vaiTro !== "phu_huynh") return false;
  window.location.replace(APP_TRANG_PHU_HUYNH);
  return true;
}

/**
 * NC_05: Hàm hiện/ẩn mục menu "Quản Trị" theo vai trò tài khoản.
 * "Quản Trị" hiện dạng nút "sắp có" (trang admin_NC làm ở NC_06A) nhưng CHỈ
 * hiện ra (để chỗ sẵn) với tài khoản vai_tro = 'admin' (HƯỚNG DẪN mục 3).
 */
function appCapNhatMenuTheoVaiTro(vaiTro) {
  var tabQuanTri = document.getElementById("tabQuanTri");
  if (!tabQuanTri) return;
  tabQuanTri.style.display = (vaiTro === "admin") ? "inline-block" : "none";
}

/**
 * NC_05: Hàm tính danh hiệu hiển thị dựa theo Level (bản sao logic từ
 * tinh_danh_hieu() trong SQL) - dùng làm giá trị TẠM lúc chưa có phản hồi máy chủ.
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
 * NC_05: Hiện tạm Thanh Thông Tin Trên Cùng bằng dữ liệu cục bộ đang có (từ
 * sessionStorage hoặc vừa đăng nhập), trong lúc chờ appLamMoiThanhThongTin()
 * lấy số liệu CHUẨN (EXP/hạng) từ máy chủ. Tránh thanh thông tin trống trong
 * vài trăm mili giây đầu, đặc biệt khi mạng chậm.
 */
function appHienThanhThongTinSoBo(duLieuTaiKhoan) {
  appVeThanhThongTin({
    avatarDaChon: duLieuTaiKhoan.avatarDaChon,
    diemSo: duLieuTaiKhoan.diemSo,
    kinhNghiem: duLieuTaiKhoan.kinhNghiem || 0,
    level: duLieuTaiKhoan.level,
    hangThu: "—",
    danhHieu: appTinhDanhHieu(duLieuTaiKhoan.level)
  });
}

/**
 * NC_05: Gọi máy chủ (RPC lay_thong_tin_ca_nhan) để lấy số liệu CHUẨN cho Thanh
 * Thông Tin Trên Cùng, đồng thời đồng bộ lại appTaiKhoanDangNhap (level, diemSo,
 * kinhNghiem, avatarDaChon, trangBi, vaiTro) theo máy chủ - nguồn dữ liệu chuẩn.
 * Gọi hàm này: ngay sau đăng nhập, lúc khôi phục phiên (F5), và sau mỗi ván cờ.
 */
function appLamMoiThanhThongTin() {
  if (!appTaiKhoanDangNhap) return;

  apiLayThongTinCaNhan(appTaiKhoanDangNhap.tenDangNhap).then(function (ketQua) {
    if (ketQua && ketQua.thanhCong && ketQua.thongTin) {
      var tt = ketQua.thongTin;

      appTaiKhoanDangNhap.level = tt.level;
      appTaiKhoanDangNhap.diemSo = tt.diemSo;
      appTaiKhoanDangNhap.kinhNghiem = tt.kinhNghiem;
      appTaiKhoanDangNhap.avatarDaChon = tt.avatarDaChon;
      appTaiKhoanDangNhap.trangBi = tt.trangBi;
      appTaiKhoanDangNhap.vaiTro = tt.vaiTro;
      appLuuPhienDangNhap();
      if (appDuaPhuHuynhSangKhuRieng(tt.vaiTro)) return;

      appCapNhatMenuTheoVaiTro(tt.vaiTro);
      appVeThanhThongTin(tt);
    } else if (ketQua && ketQua.thongBao && ketQua.thongBao.indexOf("Khong tim thay") !== -1) {
      // Tài khoản không còn tồn tại trên máy chủ (VD quản trị đã xóa) ->
      // coi như phiên hết hạn, tự đăng xuất an toàn thay vì để trang bị lỗi
      appXuLyDangXuat();
    }
    // Các lỗi mạng khác: giữ nguyên số liệu tạm đang hiện, không làm phiền trẻ
  });
}

/**
 * NC_05: Vẽ dữ liệu vào các phần tử của Thanh Thông Tin Trên Cùng và lưu cache
 * (appThongTinHienThi) để các hàm cập nhật cục bộ khác tái sử dụng.
 * Nhận vào tt: { avatarDaChon, diemSo, kinhNghiem, level, hangThu, danhHieu }
 */
function appVeThanhThongTin(tt) {
  appThongTinHienThi = tt;

  var khoi = document.getElementById("thanhThongTin");
  if (khoi) khoi.style.display = "flex";

  var oAvatar = document.getElementById("thanhThongTinAvatar");
  var oKimCuong = document.getElementById("ttKimCuong");
  var oExp = document.getElementById("ttExp");
  var oLevel = document.getElementById("ttLevel");
  var oHang = document.getElementById("ttHang");
  var oDanhHieu = document.getElementById("thanhThongTinDanhHieu");

  if (oAvatar) appVeAvatarVao(oAvatar, tt.avatarDaChon);
  if (oKimCuong) oKimCuong.textContent = "💎 " + tt.diemSo;
  if (oExp) oExp.textContent = "⭐ EXP " + tt.kinhNghiem;
  if (oLevel) oLevel.textContent = "🎚️ Lv " + tt.level;
  if (oHang) oHang.textContent = "🏅 Hạng " + tt.hangThu;
  if (oDanhHieu) oDanhHieu.textContent = tt.danhHieu;
}

/**
 * Vẽ avatar vào 1 ô tròn: nếu giá trị là ĐƯỜNG DẪN ẢNH (avatar cao cấp) thì vẽ
 * <img> cho vừa khung; nếu là emoji/chữ (avatar miễn phí) thì đặt text bình
 * thường. Tránh lỗi URL dài bị in ra thành chữ tràn màn hình.
 */
function appVeAvatarVao(o, giaTri) {
  var v = (giaTri || "").trim();
  if (v && (v.indexOf("http") === 0 || v.indexOf("/") >= 0)) {
    o.innerHTML = '<img src="' + v.replace(/"/g, "&quot;") + '" alt="avatar" ' +
      'style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
  } else {
    o.textContent = v || "❓";
  }
}

/** NC_05: Hàm ẩn hẳn Thanh Thông Tin Trên Cùng, gọi lúc đăng xuất */
function appAnThanhThongTin() {
  var khoi = document.getElementById("thanhThongTin");
  if (khoi) khoi.style.display = "none";
}

/**
 * Hàm cho phép các file khác (board.js, rank.js, taikhoan_NC.js) lấy thông tin
 * tài khoản đang đăng nhập
 */
function appLayTaiKhoanDangNhap() {
  return appTaiKhoanDangNhap;
}

/**
 * Hàm cho phép board.js cập nhật lại dữ liệu tài khoản sau khi kết thúc 1 ván cờ.
 * QUAN TRỌNG: board.js CHỈ gửi { levelMoi, diemMoi } (đã chốt sổ từ NC_03, KHÔNG
 * sửa board.js) nên hàm này giữ nguyên nhận 2 trường đó, rồi gọi thêm
 * appLamMoiThanhThongTin() để đồng bộ ĐẦY ĐỦ (EXP, hạng, danh hiệu) từ máy chủ -
 * đúng yêu cầu "Thanh Thông Tin Tự Cập Nhật Sau Mỗi Ván" của NC_05.
 */
function appCapNhatTaiKhoanSauVanCo(duLieuTaiKhoanMoi) {
  if (!appTaiKhoanDangNhap || !duLieuTaiKhoanMoi) return;

  if (duLieuTaiKhoanMoi.levelMoi !== undefined) {
    appTaiKhoanDangNhap.level = duLieuTaiKhoanMoi.levelMoi;
  }
  if (duLieuTaiKhoanMoi.diemMoi !== undefined) {
    appTaiKhoanDangNhap.diemSo = duLieuTaiKhoanMoi.diemMoi;
  }
  appLuuPhienDangNhap();
  appLamMoiThanhThongTin();
}

/**
 * NC_05: Cho taikhoan_NC.js đồng bộ NGAY trang_bi/avatar mới vào
 * appTaiKhoanDangNhap sau khi trẻ đổi avatar hoặc trang bị vật phẩm, KHÔNG cần
 * F5 hay gọi lại lay_thong_tin_ca_nhan. Quan trọng vì board.js đọc trực tiếp
 * appLayTaiKhoanDangNhap().trangBi mỗi lần vẽ bàn cờ (áp dụng trang bị - NC_03).
 */
function appCapNhatTrangBiCucBo(trangBiMoi, avatarMoi) {
  if (!appTaiKhoanDangNhap) return;

  appTaiKhoanDangNhap.trangBi = trangBiMoi;
  if (avatarMoi !== undefined) {
    appTaiKhoanDangNhap.avatarDaChon = avatarMoi;
  }
  appLuuPhienDangNhap();

  if (appThongTinHienThi) {
    appThongTinHienThi.avatarDaChon = appTaiKhoanDangNhap.avatarDaChon;
    appVeThanhThongTin(appThongTinHienThi);
  }
}

/**
 * KC_00B: Trình duyệt có thể hiện lại trang cũ từ bộ nhớ đệm khi bấm Back (không
 * chạy lại appKhoiTao). Nếu trong lúc đó đã đăng nhập/đăng xuất ở trang Kids
 * Challenge thì trang này đang hiện trạng thái CŨ -> tải lại cho khớp.
 */
window.addEventListener("pageshow", function (suKien) {
  if (!suKien.persisted) return;
  var phien = appKhoiPhucPhienDangNhap();
  var tenTrongPhien = phien && phien.tenDangNhap ? phien.tenDangNhap : null;
  var tenDangHien = appTaiKhoanDangNhap ? appTaiKhoanDangNhap.tenDangNhap : null;
  if (tenTrongPhien !== tenDangHien) window.location.reload();
});

// Chạy hàm khởi tạo ngay khi toàn bộ HTML đã được dựng xong
document.addEventListener("DOMContentLoaded", appKhoiTao);
