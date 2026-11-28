// ================================================================
// FILE: kc_auth.js
// CHỨC NĂNG: Đăng nhập / khôi phục phiên / đăng xuất DÙNG CHUNG cho mọi
//            trang Kids Challenge. Mỗi trang /kc/ là ĐIỂM VÀO ĐỘC LẬP (không
//            đi qua index.html/menu Cờ Vua) nên PHẢI tự có khối đăng nhập -
//            đây là file đảm nhiệm việc đó (HƯỚNG DẪN mục 2).
//            Khi khôi phục phiên từ sessionStorage, LUÔN xác thực lại với
//            máy chủ ngay lập tức bằng lay_thong_tin_ca_nhan - làm ĐÚNG MẪU
//            app.js của Cờ Vua ngay từ đầu, KHÔNG lặp "nợ T3" (Sổ Tay D10).
// BƯỚC: KC_00B (hợp nhất đăng nhập với Cờ Vua) - NGÀY: 14/10/2026 21:57
// CẬP NHẬT: KC_00C-2 (15/10/2026) - giữ kcThongTinCaNhan cho Trang chủ.
// CẬP NHẬT: KC_00D-1 (17/10/2026) - thuộc tính data-chi-admin (nút "Quản trị").
// CẬP NHẬT: KC_03C2 (23/11/2026 23:xx) - túi 💎 + 🪙 xu vàng trên thanh trên (kcVeTui, kcCapNhatTui).
// CẬP NHẬT: KC_05 (25/11/2026 06:xx) - ô 💎 trên túi là link tới Cửa Hàng Quà chung (KC_DUONG_CUA_HANG).
// CẬP NHẬT: KC_12C1 (28/11/2026 08:xx) - nút 📬 Hòm thư trên thanh đầu (kcVeNutHomThu, kcCapNhatHomThu):
//           "Xin chào, [tên]" · 📬 Hòm thư (số) · 🛠️ Quản trị · Đăng xuất (Thiet_Ke_Hom_Thu.md mục 9.0).
// CẬP NHẬT: KC_00D2-B1 (28/11/2026 20:xx) - hỏi máy chủ phiên còn dùng được không (kc_phien_xem: mở trang, quay lại
//           thẻ, mỗi 60 giây); bị đăng nhập máy khác / hết hạn thì đăng xuất + hộp báo (PHẦN 4B).
// CẬP NHẬT: KC_00D2-B2 (28/11/2026) - phần kiểm phiên chuyển sang chung/phien.js (dùng chung cả Cờ Vua);
//           Đăng xuất kết thúc phiên trên máy chủ. Trang nạp file này PHẢI nạp thêm chung/phien.js.
// LỊCH SỬ: KC_00 (17/07/2026) - bản đầu, dùng khóa phiên RIÊNG.
// PHỤ THUỘC: kc_config.js, kc_api.js phải nạp TRƯỚC file này.
//
// KC_00B - MỘT TÀI KHOẢN, MỘT LẦN ĐĂNG NHẬP CHO CẢ 2 APP (nguyên tắc tối cao
//   "trải nghiệm như 1 ứng dụng duy nhất" - HƯỚNG DẪN mục 2):
//   - Dùng CHUNG khóa sessionStorage "coVuaTaiKhoanDangNhap" với app.js Cờ Vua
//     và CÙNG cấu trúc dữ liệu (duLieuTaiKhoan của RPC dang_nhap). Đăng nhập ở
//     Cờ Vua thì sang /kc/ đã đăng nhập sẵn, và ngược lại.
//   - Đăng xuất ở bất kỳ trang nào là đăng xuất khỏi cả 2 app.
//   - Chỉ tự đăng xuất khi máy chủ báo "Khong tim thay" tài khoản (giống
//     app.js). Lỗi mạng thì GIỮ phiên - nếu không, một lần rớt mạng ở trang
//     /kc/ sẽ đá trẻ ra khỏi cả Cờ Vua.
//   - Phiên cũ còn sót ở khóa riêng "kcTaiKhoanDangNhap" (bản KC_00) được
//     chuyển sang khóa chung 1 lần rồi xoá.
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
// KHÓA sessionStorage: "coVuaTaiKhoanDangNhap" - DÙNG CHUNG với Cờ Vua (KC_00B,
//   thay quy ước cũ "khóa riêng" ở Sổ Tay mục A5). PHẢI trùng
//   APP_KHOA_LUU_PHIEN trong app.js.
//
// PHẦN TỬ TÙY CHỌN: phần tử có thuộc tính data-an-voi-phu-huynh (vd: tab
//   "Cờ Vua" trên thanh tab chung) sẽ bị ẩn khi người đăng nhập là phụ huynh.
//   Phần tử có data-chi-admin (vd: nút "🛠️ Quản trị" trên đầu trang - KC_00D-1)
//   CHỈ hiện khi người đăng nhập là admin (đặt sẵn style="display:none" trong HTML).
//   Đây chỉ là ẩn/hiện giao diện; trang quản trị và RPC tự kiểm tra quyền.
// ================================================================

var KC_KHOA_PHIEN = "coVuaTaiKhoanDangNhap";
var KC_KHOA_PHIEN_CU = "kcTaiKhoanDangNhap"; // khóa riêng của bản KC_00, chỉ để chuyển 1 lần

var kcTaiKhoanHienTai = null; // null cho tới khi kcSanSang bắn với daDangNhap=true
// KC_00C-2 (15/10/2026): bản thongTin mới nhất của lay_thong_tin_ca_nhan (có hangThu,
// danhHieu) để Trang chủ dùng lại, khỏi gọi máy chủ 2 lần. null nếu chưa lấy được.
var kcThongTinCaNhan = null;

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
      if (kq && kq.thongBao && kq.thongBao.indexOf("Khong tim thay") !== -1) {
        // Tài khoản không còn tồn tại trên máy chủ -> đăng xuất an toàn
        kcDangXuat();
        kcBaoSanSang(false);
        return;
      }
      // Lỗi mạng: giữ phiên + số liệu tạm đang hiện (đúng mẫu app.js)
      kcBaoSanSang(true);
      return;
    }
    // Đồng bộ lại các số liệu hay đổi nhưng GIỮ maPhien cũ vì
    // lay_thong_tin_ca_nhan không sinh phiên mới (chỉ dang_nhap mới sinh).
    // Cập nhật ĐỦ các trường app.js Cờ Vua dùng, vì 2 app chung 1 phiên.
    var tt = kq.thongTin;
    kcThongTinCaNhan = tt;
    kcTaiKhoanHienTai.level = tt.level;
    kcTaiKhoanHienTai.diemSo = tt.diemSo;
    kcTaiKhoanHienTai.kinhNghiem = tt.kinhNghiem;
    kcTaiKhoanHienTai.avatarDaChon = tt.avatarDaChon;
    kcTaiKhoanHienTai.trangBi = tt.trangBi;
    kcTaiKhoanHienTai.vaiTro = tt.vaiTro;
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
    // Chuyển phiên còn sót ở khóa riêng của bản KC_00 sang khóa chung (1 lần)
    var chuoiCu = sessionStorage.getItem(KC_KHOA_PHIEN_CU);
    if (chuoiCu) {
      if (!sessionStorage.getItem(KC_KHOA_PHIEN)) {
        sessionStorage.setItem(KC_KHOA_PHIEN, chuoiCu);
      }
      sessionStorage.removeItem(KC_KHOA_PHIEN_CU);
    }

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
  // KC_00D2-B2: báo máy chủ kết thúc phiên này (không chờ: trang đứng yên tại chỗ)
  var tk = kcTaiKhoanHienTai || kcDocPhien();
  if (tk && window.KC_PHIEN) window.KC_PHIEN.ketThuc(tk.tenDangNhap, tk.maPhien);
  kcQuenDangNhap();
}

/** Quên đăng nhập trên thẻ này (không gọi máy chủ) */
function kcQuenDangNhap() {
  kcXoaPhien();
  kcTaiKhoanHienTai = null;
  kcThongTinCaNhan = null;
  kcHienChuaDangNhap();
}

// ================================================================
// PHẦN 4B (KC_00D2-B1, chuyển ở KC_00D2-B2): PHIÊN CÒN DÙNG ĐƯỢC KHÔNG
//   Việc hỏi máy chủ + hộp báo nằm ở module chung chung/phien.js (nạp trên cùng trang). Module đó xoá khoá
//   phiên rồi bắn "kcMatPhien"; ở đây chỉ quên tài khoản đang giữ và hiện lại khối đăng nhập.
// ================================================================
document.addEventListener("kcMatPhien", function () { kcQuenDangNhap(); });

// ================================================================
// PHẦN 5: HIỆN/ẨN GIAO DIỆN THEO TRẠNG THÁI
// ================================================================

function kcHienChuaDangNhap() {
  var tui = document.getElementById("kcTui");
  if (tui) tui.remove();
  kcTuiDaLayVang = false;
  var nutHt = document.getElementById("kcNutHomThu");
  if (nutHt) nutHt.remove();
  kcHtLanCuoi = 0;
  var khoiChua = document.getElementById("kcChuaDangNhap");
  var khoiCan = document.getElementById("kcNoiDungCanDangNhap");
  if (khoiChua) khoiChua.style.display = "block";
  if (khoiCan) khoiCan.style.display = "none";

  var oTen = document.getElementById("kcTenNguoiChoi");
  if (oTen) oTen.textContent = "";
  var oNutDangXuat = document.getElementById("kcNutDangXuat");
  if (oNutDangXuat) oNutDangXuat.style.display = "none";
  kcApDungHienThiTheoVaiTro(null);
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

  kcApDungHienThiTheoVaiTro(taiKhoan.vaiTro);
  kcVeTui(taiKhoan);
  kcVeNutHomThu(taiKhoan);
}

// ================================================================
// KC_12C1 (28/11/2026): NÚT 📬 HÒM THƯ TRÊN THANH ĐẦU mọi trang có #trangThaiDangNhap (Thiet_Ke_Hom_Thu.md 9.0)
//   Đặt ngay sau "Xin chào, [tên]". Số đỏ: bé / phụ huynh = thư chưa đọc; admin = thư chờ Cô Cú (kc_thu_dem).
//   Điện thoại chỉ 📬 + số (CSS kc_style.css: .kcHtChu ẩn khi màn hẹp < 600 px hoặc điện thoại nằm ngang);
//   máy tính bảng / máy tính có cả chữ. Trang Hòm thư gọi kcCapNhatHomThu() sau khi bé đọc / xoá thư.
//   Chưa chạy SQL kc12b / mất mạng: nút vẫn hiện, không có số.
// ================================================================
var KC_DUONG_HOM_THU = (function () {
  try {
    var s = document.currentScript && document.currentScript.src;
    if (s) return s.replace(/kc_auth\.js(\?.*)?$/, "homthu_NC.html");
  } catch (e) { /* bỏ qua */ }
  return "homthu_NC.html";
})();
var kcHtLanCuoi = 0;   // lúc hỏi số gần nhất (kcHienDaDangNhap chạy 2 lần liền khi mở trang: chỉ hỏi 1 lần)

function kcVeNutHomThu(taiKhoan) {
  var cha = document.getElementById("trangThaiDangNhap");
  var nut = document.getElementById("kcNutHomThu");
  if (!cha || !taiKhoan) { if (nut) nut.remove(); return; }
  if (!nut) {
    nut = document.createElement("a");
    nut.id = "kcNutHomThu";
    nut.className = "kcNutLienKet kcNutHomThu";
    nut.href = KC_DUONG_HOM_THU;
    nut.setAttribute("aria-label", "Hòm thư");
    nut.innerHTML = '<span class="kcHtHinh" aria-hidden="true">📬</span><span class="kcHtChu">Hòm thư</span><b class="kcHtSo" hidden></b>';
    if (/homthu_NC\.html$/.test(location.pathname)) nut.setAttribute("aria-current", "page");
    var ten = document.getElementById("kcTenNguoiChoi");
    if (ten && ten.parentNode === cha) cha.insertBefore(nut, ten.nextSibling);
    else cha.appendChild(nut);
  }
  if (Date.now() - kcHtLanCuoi > 3000) kcCapNhatHomThu();
}

/** Hỏi máy chủ số trên nút 📬 (hoặc đặt thẳng: kcCapNhatHomThu(so)). */
function kcCapNhatHomThu(so) {
  if (typeof so === "number") { kcVeSoHomThu(so); return; }
  var tk = kcTaiKhoanHienTai;
  if (!tk || !tk.tenDangNhap || !document.getElementById("kcNutHomThu")) return;
  kcHtLanCuoi = Date.now();
  kcGoiRpc("kc_thu_dem", { p_ten: tk.tenDangNhap, p_ma_phien: tk.maPhien || "" }).then(function (kq) {
    if (!kq || !kq.thanhCong) { kcVeSoHomThu(0); return; }
    var n = (tk.vaiTro === "admin" && kq.coCu) ? Number(kq.coCu.cho) || 0 : Number(kq.chuaDoc) || 0;
    kcVeSoHomThu(n, tk.vaiTro === "admin");
    document.dispatchEvent(new CustomEvent("kcHomThuDem", { detail: kq }));
  });
}

function kcVeSoHomThu(n, laAdmin) {
  var nut = document.getElementById("kcNutHomThu");
  if (!nut) return;
  var b = nut.querySelector(".kcHtSo");
  n = Math.max(0, Number(n) || 0);
  var cu = Number(b.textContent) || 0;
  b.textContent = n > 99 ? "99+" : String(n);
  b.hidden = n === 0;
  nut.setAttribute("aria-label", "Hòm thư" + (n ? ", " + n + (laAdmin ? " thư chờ Cô Cú" : " thư mới") : ""));
  nut.title = n ? (laAdmin ? n + " thư đang chờ Cô Cú" : "Con có " + n + " thư mới") : "Hòm thư";
  nut.classList.toggle("coThu", n > 0);
  if (n > cu) { nut.classList.remove("kcHtRung"); void nut.offsetWidth; nut.classList.add("kcHtRung"); }
}
window.kcCapNhatHomThu = kcCapNhatHomThu;

// Quay lại tab / mở lại app: hỏi lại số (có thư mới trong lúc đi chơi trang khác)
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible" && kcTaiKhoanHienTai && Date.now() - kcHtLanCuoi > 30000) kcCapNhatHomThu();
});

// ================================================================
// KC_03C2 (23/11/2026): TÚI 💎 + 🪙 XU VÀNG TRÊN THANH TRÊN mọi trang /kc/
//   💎 = tai_khoan.diem_so (phiên), 🪙 = ví xu vàng chung toàn app (RPC kc_vi_vang_xem).
//   Xu vàng KHÁC vàng mỏ của Đấu Trường. Phụ huynh không có túi.
//   Trang / game vừa nhận thưởng gọi kcCapNhatTui({ diemSo, viVang }) để số trên thanh đổi ngay.
// ================================================================
var kcTuiDaLayVang = false;
// KC_05: đường tới kc/cuahang_NC.html tính từ chỗ đặt chính file này (kc/kc_auth.js),
// đúng cho mọi trang dù nằm ở gốc hay trong kc/.
var KC_DUONG_CUA_HANG = (function () {
  try {
    var s = document.currentScript && document.currentScript.src;
    if (s) return s.replace(/kc_auth\.js(\?.*)?$/, "cuahang_NC.html");
  } catch (e) { /* bỏ qua */ }
  return "cuahang_NC.html";
})();

function kcVeTui(taiKhoan) {
  var cha = document.getElementById("trangThaiDangNhap");
  var tui = document.getElementById("kcTui");
  if (!cha || !taiKhoan || taiKhoan.vaiTro === "phu_huynh") { if (tui) tui.remove(); return; }
  // Trang chủ (index.html) đã có hàng 💎 🪙 🎁 to giữa trang: không vẽ túi thứ hai trên thanh trên
  if (document.getElementById("tcOKimCuong")) {
    if (!kcTuiDaLayVang) { kcTuiDaLayVang = true; kcCapNhatTui({}); }
    return;
  }
  if (!tui) {
    tui = document.createElement("span");
    tui.id = "kcTui";
    tui.className = "kcTui";
    // KC_05 (25/11/2026): bấm 💎 là tới CỬA HÀNG QUÀ CHUNG (nơi duy nhất tiêu 💎 lấy quà thật)
    tui.innerHTML = '<a class="kcTuiO kcTuiLink" href="' + KC_DUONG_CUA_HANG + '" title="Kim cương của con: bấm để đổi quà">💎 <b id="kcTuiKc">0</b> 🛍️</a>' +
      '<span class="kcTuiO" id="kcTuiVangO" title="Xu vàng của con (dùng chung cả app)" hidden>🪙 <b id="kcTuiVang">0</b></span>';
    cha.insertBefore(tui, cha.firstChild);
  }
  document.getElementById("kcTuiKc").textContent = Number(taiKhoan.diemSo) || 0;
  if (!kcTuiDaLayVang) { kcTuiDaLayVang = true; kcCapNhatTui({}); }
}

/** Đổi số trên túi. tham số: { diemSo?, viVang? }; không có viVang thì hỏi máy chủ. */
function kcCapNhatTui(so) {
  so = so || {};
  var tk = kcTaiKhoanHienTai;
  if (typeof so.diemSo === "number" && tk) { tk.diemSo = so.diemSo; kcLuuPhien(tk); }
  var oKc = document.getElementById("kcTuiKc");
  if (oKc && tk) oKc.textContent = Number(tk.diemSo) || 0;
  if (typeof so.viVang === "number") { kcVeVang(so.viVang); return; }
  if (!tk || !tk.tenDangNhap || tk.vaiTro === "phu_huynh") return;
  kcGoiRpc("kc_vi_vang_xem", { p_ten: tk.tenDangNhap, p_ma_phien: tk.maPhien || "" }).then(function (kq) {
    if (kq && kq.thanhCong) kcVeVang(Number(kq.soDu) || 0);
  });
}

function kcVeVang(so) {
  // Trang chủ: ô 🪙 cạnh ô 💎 (index.html, #tcOVang)
  var oTc = document.getElementById("tcOVang"), bTc = document.getElementById("tcSoVang");
  if (oTc && bTc) { bTc.textContent = so; oTc.hidden = false; }
  var o = document.getElementById("kcTuiVangO"), b = document.getElementById("kcTuiVang");
  if (!o || !b) return;
  var cu = Number(b.textContent) || 0, daHien = !o.hidden;
  b.textContent = so;
  o.hidden = false;
  if (daHien && so > cu) { o.classList.remove("kcTuiNay"); void o.offsetWidth; o.classList.add("kcTuiNay"); }
}
window.kcCapNhatTui = kcCapNhatTui;

/** Ẩn data-an-voi-phu-huynh với phụ huynh; chỉ hiện data-chi-admin với admin (KC_00D-1) */
function kcApDungHienThiTheoVaiTro(vaiTro) {
  var ds = document.querySelectorAll("[data-an-voi-phu-huynh]");
  for (var i = 0; i < ds.length; i++) {
    ds[i].style.display = (vaiTro === "phu_huynh") ? "none" : "";
  }
  var dsAdmin = document.querySelectorAll("[data-chi-admin]");
  for (var j = 0; j < dsAdmin.length; j++) {
    dsAdmin[j].style.display = (vaiTro === "admin") ? "inline-block" : "none";
  }
}

function kcHienThongBaoDangNhap(text, loai) {
  var o = document.getElementById("kcThongBaoDangNhap");
  if (!o) return;
  o.textContent = text;
  o.className = "hien " + (loai === "xau" ? "xau" : "tot");
}

// ================================================================
// PHẦN 6: QUAY LẠI TRANG BẰNG NÚT "BACK" CỦA TRÌNH DUYỆT
// ================================================================
// Trình duyệt có thể hiện lại trang cũ từ bộ nhớ đệm (không chạy lại
// DOMContentLoaded). Nếu trong lúc đó người dùng đã đăng nhập/đăng xuất ở
// trang Cờ Vua thì trang này đang hiện trạng thái CŨ -> tải lại cho khớp.
window.addEventListener("pageshow", function (su) {
  if (!su.persisted) return;
  var phien = kcDocPhien();
  var tenTrongPhien = phien && phien.tenDangNhap ? phien.tenDangNhap : null;
  var tenDangHien = kcTaiKhoanHienTai ? kcTaiKhoanHienTai.tenDangNhap : null;
  if (tenTrongPhien !== tenDangHien) window.location.reload();
});

// ================================================================
// KHỞI CHẠY
// ================================================================
document.addEventListener("DOMContentLoaded", kcAuthKhoiTao);
