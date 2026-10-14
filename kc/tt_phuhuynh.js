// ================================================================
// FILE: tt_phuhuynh.js
// CHỨC NĂNG: Đăng ký tài khoản phụ huynh + liên kết/gỡ liên kết phụ
//            huynh-trẻ, dùng RIÊNG cho trang thuthach_NC.html (bước TT_01).
//            KHÔNG sửa kc_auth.js (file dùng chung) - mọi thứ đặc thù trang
//            này (khối đăng ký, khối "Các con của tôi") nằm ở đây, theo
//            nguyên tắc "gom việc theo file" (không sửa file chung cho việc
//            riêng của 1 trang).
// BƯỚC: TT_01
// NGÀY: 17/07/2026
// CẬP NHẬT: KC_00B - 14/10/2026 21:57: mở trang bằng địa chỉ có đuôi
//   #dang-ky-phu-huynh (link "Đăng ký tài khoản phụ huynh" ở màn hình đăng
//   nhập chung của Cờ Vua) thì hiện thẳng form đăng ký phụ huynh.
// PHỤ THUỘC: kc_config.js, kc_api.js, kc_auth.js phải nạp TRƯỚC file này.
//            Lắng nghe sự kiện "kcSanSang" do kc_auth.js bắn ra (hợp đồng ở
//            đầu file kc_auth.js), đọc biến toàn cục kcTaiKhoanHienTai.
//
// PHẦN TỬ HTML CẦN CÓ (xem thuthach_NC.html):
//   #ttNutMoDangKy, #ttDangKyPhuHuynh (+ #ttDkTen, #ttDkMatKhau,
//   #ttDkMatKhauLai, #ttNutDangKy, #ttThongBaoDangKy, #ttNutQuayLaiDangNhap)
//   #ttKhuPhuHuynh (+ #ttOTenTre, #ttNutLienKet, #ttThongBaoLienKet,
//   #ttDanhSachTreRong, #ttDanhSachTre)
//
// RPC SỬ DỤNG: kc_dang_ky_phu_huynh, kc_lien_ket_tre, kc_lay_danh_sach_tre,
//   kc_go_lien_ket (bước TT_01, xem supabase_tt01_phu_huynh.sql).
//
// GHI CHÚ (Sổ Tay D7 - avatar là URL -> render <img>): hàm ttPhVeAvatar bên
//   dưới áp dụng quy ước này ngay từ đầu. Hiện chỉ trang Thử Thách cần hiển
//   thị avatar của trẻ nên đặt tạm ở đây; nếu sau này Học Tập/Khám Phá cũng
//   cần, nên nâng cấp thành file dùng chung kiểu kc_avatar.js.
// ================================================================

var ttDangGuiDangKy = false;
var ttDangGuiLienKet = false;

// ================================================================
// PHẦN 1: KHỞI ĐỘNG
// ================================================================

function ttPhKhoiTao() {
  var oMo = document.getElementById("ttNutMoDangKy");
  var oQuayLai = document.getElementById("ttNutQuayLaiDangNhap");
  var oNutDangKy = document.getElementById("ttNutDangKy");
  var oNutLienKet = document.getElementById("ttNutLienKet");
  var oOTenTre = document.getElementById("ttOTenTre");

  if (oMo) oMo.addEventListener("click", function (su) { su.preventDefault(); ttPhMoDangKy(); });
  if (oQuayLai) oQuayLai.addEventListener("click", function (su) { su.preventDefault(); ttPhDongDangKy(); });
  if (oNutDangKy) oNutDangKy.addEventListener("click", ttPhXuLyDangKy);
  if (oNutLienKet) oNutLienKet.addEventListener("click", ttPhXuLyLienKet);
  if (oOTenTre) {
    oOTenTre.addEventListener("keydown", function (su) {
      if (su.key === "Enter") ttPhXuLyLienKet();
    });
  }

  document.addEventListener("kcSanSang", ttPhXuLySanSang);
}

function ttPhXuLySanSang(su) {
  var daDangNhap = su.detail && su.detail.daDangNhap;
  var oDangKy = document.getElementById("ttDangKyPhuHuynh");
  var oKhuPhuHuynh = document.getElementById("ttKhuPhuHuynh");

  if (!daDangNhap) {
    if (oDangKy) oDangKy.style.display = "none";
    if (oKhuPhuHuynh) oKhuPhuHuynh.style.display = "none";
    // KC_00B: đến từ link "Đăng ký tài khoản phụ huynh" -> mở thẳng form đăng ký
    if (window.location.hash === "#dang-ky-phu-huynh") ttPhMoDangKy();
    return;
  }

  if (oDangKy) oDangKy.style.display = "none";

  if (kcTaiKhoanHienTai && kcTaiKhoanHienTai.vaiTro === "phu_huynh") {
    if (oKhuPhuHuynh) oKhuPhuHuynh.style.display = "block";
    ttPhTaiDanhSachTre();
  } else if (oKhuPhuHuynh) {
    oKhuPhuHuynh.style.display = "none";
  }
}

// ================================================================
// PHẦN 2: TOGGLE ĐĂNG NHẬP <-> ĐĂNG KÝ
// ================================================================

function ttPhMoDangKy() {
  var oChuaDangNhap = document.getElementById("kcChuaDangNhap");
  var oDangKy = document.getElementById("ttDangKyPhuHuynh");
  if (oChuaDangNhap) oChuaDangNhap.style.display = "none";
  if (oDangKy) oDangKy.style.display = "block";
}

function ttPhDongDangKy() {
  var oChuaDangNhap = document.getElementById("kcChuaDangNhap");
  var oDangKy = document.getElementById("ttDangKyPhuHuynh");
  if (oDangKy) oDangKy.style.display = "none";
  if (oChuaDangNhap) oChuaDangNhap.style.display = "block";
}

// ================================================================
// PHẦN 3: ĐĂNG KÝ PHỤ HUYNH
// ================================================================

function ttPhXuLyDangKy() {
  var oTen = document.getElementById("ttDkTen");
  var oMk = document.getElementById("ttDkMatKhau");
  var oMkLai = document.getElementById("ttDkMatKhauLai");
  var oNut = document.getElementById("ttNutDangKy");

  var ten = oTen ? oTen.value.trim() : "";
  var mk = oMk ? oMk.value : "";
  var mkLai = oMkLai ? oMkLai.value : "";

  if (!ten || !mk || !mkLai) {
    ttPhHienThongBao("ttThongBaoDangKy", "Vui lòng nhập đủ thông tin nhé!", "xau");
    return;
  }
  if (mk !== mkLai) {
    ttPhHienThongBao("ttThongBaoDangKy", "Mật khẩu nhập lại không khớp, thử lại nhé.", "xau");
    return;
  }
  if (ttDangGuiDangKy) return;

  ttDangGuiDangKy = true;
  if (oNut) oNut.disabled = true;
  ttPhHienThongBao("ttThongBaoDangKy", "Đang đăng ký...", "tot");

  kcGoiRpc("kc_dang_ky_phu_huynh", { p_ten: ten, p_mat_khau: mk }).then(function (kq) {
    ttDangGuiDangKy = false;
    if (oNut) oNut.disabled = false;
    kq = kq || {};

    if (!kq.thanhCong) {
      ttPhHienThongBao("ttThongBaoDangKy", kq.thongBao || "Đăng ký chưa được, thử lại nhé.", "xau");
      return;
    }

    ttPhHienThongBao("ttThongBaoDangKy", kq.thongBao || "Đăng ký thành công!", "tot");
    if (oMk) oMk.value = "";
    if (oMkLai) oMkLai.value = "";

    // Quay lại form đăng nhập, điền sẵn tên vừa đăng ký cho tiện
    setTimeout(function () {
      ttPhDongDangKy();
      var oTenDangNhap = document.getElementById("kcOTen");
      if (oTenDangNhap) oTenDangNhap.value = ten;
      var oMatKhauDangNhap = document.getElementById("kcOMatKhau");
      if (oMatKhauDangNhap) oMatKhauDangNhap.focus();
    }, 1200);
  });
}

// ================================================================
// PHẦN 4: DANH SÁCH CÁC CON + LIÊN KẾT / GỠ LIÊN KẾT
// ================================================================

function ttPhTaiDanhSachTre() {
  if (!kcTaiKhoanHienTai) return;
  kcGoiRpc("kc_lay_danh_sach_tre", {
    p_ten_phu_huynh: kcTaiKhoanHienTai.tenDangNhap,
    p_ma_phien: kcTaiKhoanHienTai.maPhien
  }).then(function (kq) {
    var ds = (kq && kq.thanhCong) ? (kq.danhSachTre || []) : [];
    ttPhVeDanhSachTre(ds);
  });
}

function ttPhVeDanhSachTre(danhSach) {
  var oRong = document.getElementById("ttDanhSachTreRong");
  var oDs = document.getElementById("ttDanhSachTre");
  if (!oDs) return;
  oDs.innerHTML = "";

  if (!danhSach.length) {
    if (oRong) oRong.style.display = "block";
    return;
  }
  if (oRong) oRong.style.display = "none";

  danhSach.forEach(function (tre) {
    var dong = document.createElement("li");
    dong.className = "ttDongTre";

    dong.appendChild(ttPhVeAvatar(tre.avatarDaChon));

    var thongTin = document.createElement("div");
    thongTin.className = "ttDongTreThongTin";

    var ten = document.createElement("div");
    ten.className = "ttDongTreTen";
    ten.textContent = tre.tenDangNhap;
    thongTin.appendChild(ten);

    var kimCuong = document.createElement("div");
    kimCuong.className = "ttDongTreKimCuong";
    kimCuong.textContent = "💎 " + (tre.diemSo || 0) + " kim cương";
    thongTin.appendChild(kimCuong);

    dong.appendChild(thongTin);

    var nutGo = document.createElement("button");
    nutGo.className = "ttNutGoLienKet";
    nutGo.type = "button";
    nutGo.textContent = "Gỡ liên kết";
    nutGo.addEventListener("click", function () { ttPhXuLyGoLienKet(tre.tenDangNhap); });
    dong.appendChild(nutGo);

    oDs.appendChild(dong);
  });
}

/** Avatar là emoji HOẶC URL ảnh (Sổ Tay D7): bắt đầu bằng 'http' -> <img> */
function ttPhVeAvatar(giaTri) {
  var o = document.createElement("div");
  o.className = "ttDongTreAvatar";
  if (giaTri && giaTri.indexOf("http") === 0) {
    var img = document.createElement("img");
    img.src = giaTri;
    img.alt = "";
    o.appendChild(img);
  } else {
    o.textContent = giaTri || "🙂";
  }
  return o;
}

function ttPhXuLyLienKet() {
  var oTen = document.getElementById("ttOTenTre");
  var oNut = document.getElementById("ttNutLienKet");
  var ten = oTen ? oTen.value.trim() : "";

  if (!ten) {
    ttPhHienThongBao("ttThongBaoLienKet", "Con nhập tên đăng nhập của con nhé!", "xau");
    return;
  }
  if (ttDangGuiLienKet) return;

  ttDangGuiLienKet = true;
  if (oNut) oNut.disabled = true;
  ttPhHienThongBao("ttThongBaoLienKet", "Đang liên kết...", "tot");

  kcGoiRpc("kc_lien_ket_tre", {
    p_ten_phu_huynh: kcTaiKhoanHienTai.tenDangNhap,
    p_ma_phien: kcTaiKhoanHienTai.maPhien,
    p_ten_tre: ten
  }).then(function (kq) {
    ttDangGuiLienKet = false;
    if (oNut) oNut.disabled = false;
    kq = kq || {};

    if (!kq.thanhCong) {
      ttPhHienThongBao("ttThongBaoLienKet", kq.thongBao || "Liên kết chưa được, thử lại nhé.", "xau");
      return;
    }

    if (oTen) oTen.value = "";
    ttPhHienThongBao("ttThongBaoLienKet", kq.thongBao || "Đã liên kết!", "tot");
    ttPhTaiDanhSachTre();
  });
}

function ttPhXuLyGoLienKet(tenTre) {
  var xacNhan = window.confirm('Gỡ liên kết với "' + tenTre + '"?');
  if (!xacNhan) return;

  kcGoiRpc("kc_go_lien_ket", {
    p_ten_phu_huynh: kcTaiKhoanHienTai.tenDangNhap,
    p_ma_phien: kcTaiKhoanHienTai.maPhien,
    p_ten_tre: tenTre
  }).then(function (kq) {
    if (!kq || !kq.thanhCong) {
      window.alert((kq && kq.thongBao) || "Gỡ liên kết chưa được, thử lại nhé.");
      return;
    }
    ttPhTaiDanhSachTre();
  });
}

// ================================================================
// PHẦN 5: TIỆN ÍCH
// ================================================================

function ttPhHienThongBao(idPhanTu, text, loai) {
  var o = document.getElementById(idPhanTu);
  if (!o) return;
  o.textContent = text;
  o.className = "hien " + (loai === "xau" ? "xau" : "tot");
}

// ================================================================
// KHỞI CHẠY
// ================================================================
document.addEventListener("DOMContentLoaded", ttPhKhoiTao);
