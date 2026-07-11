// ================================================================
// FILE: cuahang_NC.js
// CHỨC NĂNG: Cửa hàng đổi vật phẩm bằng kim cương cho trẻ (NC_06B)
// NGÀY: 11/07/2026 - BƯỚC: NC_06B
// QUY ƯỚC TÊN HÀM/BIẾN: tất cả bắt đầu bằng "ch" (cua-hang) để tránh xung đột
//
// PHỤ THUỘC:
//   - config.js  (biến supabaseClient)
//   - api.js     (hàm apiGoiRpc)
//   - sessionStorage khóa "coVuaTaiKhoanDangNhap" do app.js ghi khi đăng nhập
//
// CÁC RPC SỬ DỤNG (đã có sẵn từ NC_00, KHÔNG cần chạy thêm SQL):
//   lay_ho_so             (số dư hiện tại + vật phẩm số đã sở hữu + lịch sử đổi)
//   lay_danh_sach_vat_pham(danh mục vật phẩm đang hiển thị)
//   doi_vat_pham          (đổi 1 vật phẩm; máy chủ trừ kim cương + tự trang bị)
//
// LUẬT QUAN TRỌNG (HƯỚNG DẪN 4.2 & 4.6):
//   - Vật phẩm SỐ (mọi loại trừ 'qua'): chặn mua trùng; nhận NGAY và TỰ TRANG BỊ
//     luôn ở máy chủ -> giao diện KHÔNG cần chọn trang bị (việc đó thuộc Trang
//     Tài Khoản - NC_05) và KHÔNG đụng board.js.
//   - Vật phẩm 'qua' (vật lý): ghi "Chờ trao thưởng", quản trị xác nhận ở NC_06A.
//   - Vật phẩm có mốc level: MIỄN PHÍ khi level tài khoản >= mốc. Máy chủ TỰ tính
//     giá (kể cả miễn phí) và tự trừ; giao diện chỉ hiển thị, KHÔNG tự tính tiền.
//   - Kim cương KHÔNG bao giờ âm (máy chủ chặn).
// ================================================================

// ----- Hằng số -----
var CH_KHOA_PHIEN = "coVuaTaiKhoanDangNhap"; // PHẢI trùng APP_KHOA_LUU_PHIEN trong app.js

// Thông tin hiển thị theo loại vật phẩm (tên + biểu tượng dự phòng khi thiếu hình)
var CH_LOAI = {
  avatar:     { ten: "Avatar",      icon: "🙂" },
  bo_quan_co: { ten: "Bộ Quân Cờ",  icon: "♟️" },
  ban_co:     { ten: "Bàn Cờ",      icon: "🏁" },
  hieu_ung:   { ten: "Hiệu Ứng",    icon: "✨" },
  qua:        { ten: "Quà Tặng",    icon: "🎁" }
};

// ----- Biến trạng thái -----
var chTaiKhoan = null;         // Phiên đăng nhập (đọc từ sessionStorage)
var chDanhSachVatPham = [];    // Danh mục vật phẩm (đã chuẩn hóa camelCase từ RPC)
var chIdDaSoHuu = {};          // Map id -> true cho vật phẩm SỐ đã sở hữu
var chLichSuDoiQua = [];       // Lịch sử đổi thưởng của trẻ (gồm quà chờ trao)
var chLoaiDangLoc = "tat_ca";  // Bộ lọc đang chọn
var chDangXuLy = false;        // Chống bấm đổi 2 lần khi đang chờ máy chủ

// ================================================================
// PHẦN 1: KHỞI ĐỘNG
// ================================================================

function chKhoiTao() {
  chTaiKhoan = chDocPhien();

  if (!chTaiKhoan || !chTaiKhoan.tenDangNhap) {
    document.getElementById("chChuaDangNhap").style.display = "block";
    document.getElementById("chDangTai").style.display = "none";
    return;
  }

  var oTen = document.getElementById("chTenNguoiChoi");
  if (oTen) oTen.textContent = "Xin chào, " + chTaiKhoan.tenDangNhap;

  chTaiDuLieu();
}

/** Đọc phiên đăng nhập do app.js lưu (KHÔNG bao giờ chứa mật khẩu) */
function chDocPhien() {
  try {
    var chuoi = sessionStorage.getItem(CH_KHOA_PHIEN);
    if (!chuoi) return null;
    return JSON.parse(chuoi);
  } catch (loi) {
    return null;
  }
}

/** Ghi lại phiên sau khi kim cương thay đổi để Trang Chính hiển thị đúng */
function chLuuPhien() {
  try {
    sessionStorage.setItem(CH_KHOA_PHIEN, JSON.stringify(chTaiKhoan));
  } catch (loi) { /* trình duyệt chặn sessionStorage -> bỏ qua */ }
}

// ================================================================
// PHẦN 2: TẢI DỮ LIỆU
// ================================================================

/**
 * Tải song song: hồ sơ (số dư + vật phẩm số đã sở hữu + lịch sử đổi) và danh mục
 * cửa hàng. Chỉ cần 2 lần gọi máy chủ cho toàn bộ trang.
 */
function chTaiDuLieu() {
  document.getElementById("chDangTai").style.display = "block";

  Promise.all([
    apiGoiRpc("lay_ho_so", { p_ten: chTaiKhoan.tenDangNhap }),
    apiGoiRpc("lay_danh_sach_vat_pham", {})
  ]).then(function (ketQua) {
    var kqHoSo = ketQua[0] || {};
    var kqDanhSach = ketQua[1] || {};

    // --- Hồ sơ: số dư + đã sở hữu + lịch sử ---
    if (kqHoSo.thanhCong && kqHoSo.hoSo) {
      var tt = kqHoSo.hoSo.thongTin || {};
      // Đồng bộ số dư mới nhất từ máy chủ vào phiên
      if (typeof tt.diemSo === "number")    chTaiKhoan.diemSo = tt.diemSo;
      if (typeof tt.kinhNghiem === "number") chTaiKhoan.kinhNghiem = tt.kinhNghiem;
      if (typeof tt.level === "number")     chTaiKhoan.level = tt.level;
      chLuuPhien();

      chIdDaSoHuu = {};
      var dsSoHuu = kqHoSo.hoSo.vatPhamSoHuu || [];
      for (var i = 0; i < dsSoHuu.length; i++) {
        chIdDaSoHuu[dsSoHuu[i].id] = true;
      }

      chLichSuDoiQua = kqHoSo.hoSo.lichSuDoiQua || [];
    }

    chCapNhatThanhSoDu();

    // --- Danh mục cửa hàng ---
    if (kqDanhSach.thanhCong) {
      chDanhSachVatPham = kqDanhSach.danhSachVatPham || [];
    } else {
      chDanhSachVatPham = [];
      chHienThongBao(kqDanhSach.thongBao || "Không tải được cửa hàng, con thử lại nhé.", "xau");
    }

    document.getElementById("chDangTai").style.display = "none";
    chVeThanhLoc();
    chVeDanhSach();
    chVeQuaChoTrao();
  });
}

// ================================================================
// PHẦN 3: THANH SỐ DƯ
// ================================================================

function chCapNhatThanhSoDu() {
  var thanh = document.getElementById("chThanhSoDu");
  if (thanh) thanh.classList.add("hien");

  chDatText("chSoKimCuong", chTaiKhoan.diemSo != null ? chTaiKhoan.diemSo : 0);
  chDatText("chSoLevel", chTaiKhoan.level != null ? chTaiKhoan.level : 1);
  chDatText("chSoExp", chTaiKhoan.kinhNghiem != null ? chTaiKhoan.kinhNghiem : 0);
}

// ================================================================
// PHẦN 4: THANH LỌC THEO LOẠI
// ================================================================

function chVeThanhLoc() {
  var thanh = document.getElementById("chThanhLoc");
  if (!thanh) return;
  thanh.innerHTML = "";

  if (!chDanhSachVatPham.length) {
    thanh.classList.remove("hien");
    return;
  }

  // Lấy các loại thực sự có hàng, giữ đúng thứ tự trong CH_LOAI
  var coLoai = {};
  for (var i = 0; i < chDanhSachVatPham.length; i++) {
    coLoai[chDanhSachVatPham[i].loai] = true;
  }

  var danhSachLoc = [{ ma: "tat_ca", ten: "Tất cả", icon: "🛍️" }];
  var thuTu = ["avatar", "bo_quan_co", "ban_co", "hieu_ung", "qua"];
  for (var k = 0; k < thuTu.length; k++) {
    if (coLoai[thuTu[k]]) {
      danhSachLoc.push({ ma: thuTu[k], ten: CH_LOAI[thuTu[k]].ten, icon: CH_LOAI[thuTu[k]].icon });
      delete coLoai[thuTu[k]];
    }
  }
  // Loại lạ (nếu quản trị thêm loại mới) -> vẫn cho lọc được
  for (var loaiLa in coLoai) {
    if (coLoai.hasOwnProperty(loaiLa)) {
      danhSachLoc.push({ ma: loaiLa, ten: chTenLoai(loaiLa), icon: "📦" });
    }
  }

  danhSachLoc.forEach(function (loc) {
    var nut = document.createElement("button");
    nut.type = "button";
    nut.className = "chNutLoc" + (chLoaiDangLoc === loc.ma ? " dangChon" : "");
    nut.textContent = loc.icon + " " + loc.ten;
    nut.addEventListener("click", function () {
      chLoaiDangLoc = loc.ma;
      chVeThanhLoc();
      chVeDanhSach();
    });
    thanh.appendChild(nut);
  });

  thanh.classList.add("hien");
}

// ================================================================
// PHẦN 5: LƯỚI VẬT PHẨM
// ================================================================

function chVeDanhSach() {
  var luoi = document.getElementById("chLuoiVatPham");
  var rong = document.getElementById("chRong");
  if (!luoi) return;
  luoi.innerHTML = "";

  if (!chDanhSachVatPham.length) {
    if (rong) rong.style.display = "block";
    return;
  }
  if (rong) rong.style.display = "none";

  var danhSach = chDanhSachVatPham.filter(function (vp) {
    return chLoaiDangLoc === "tat_ca" || vp.loai === chLoaiDangLoc;
  });

  danhSach.forEach(function (vp) {
    luoi.appendChild(chTaoThe(vp));
  });
}

/** Dựng 1 thẻ vật phẩm */
function chTaoThe(vp) {
  var tt = chTinhTrangThai(vp);

  var the = document.createElement("div");
  the.className = "chThe" + (tt.daSoHuu ? " chDaSoHuu" : "") + (tt.hetHang ? " chHetHang" : "");

  // Khung hình
  var khungHinh = document.createElement("div");
  khungHinh.className = "chTheHinh";
  khungHinh.innerHTML = chHtmlHinh(vp);
  the.appendChild(khungHinh);

  // Thân thẻ
  var than = document.createElement("div");
  than.className = "chTheThan";

  var oLoai = document.createElement("div");
  oLoai.className = "chTheLoai";
  oLoai.textContent = chTenLoai(vp.loai);
  than.appendChild(oLoai);

  var oTen = document.createElement("p");
  oTen.className = "chTheTen";
  oTen.textContent = vp.ten || "Vật phẩm";
  than.appendChild(oTen);

  if (vp.moTa) {
    var oMoTa = document.createElement("p");
    oMoTa.className = "chTheMoTa";
    oMoTa.textContent = vp.moTa;
    than.appendChild(oMoTa);
  }

  // Giá
  var oGia = document.createElement("div");
  oGia.className = "chTheGia";
  if (tt.giaHienThi === 0) {
    oGia.innerHTML = '<span class="chGiaMienPhi">🎁 Miễn phí</span>';
  } else {
    oGia.innerHTML = '<span class="chGiaKimCuong">💎 ' + tt.giaHienThi + '</span>';
  }
  than.appendChild(oGia);

  // Ghi chú (nếu có)
  if (tt.ghiChu) {
    var oGhiChu = document.createElement("div");
    oGhiChu.className = "chTheGhiChu" + (tt.ghiChuDo ? " chGhiChuDo" : "");
    oGhiChu.textContent = tt.ghiChu;
    than.appendChild(oGhiChu);
  }

  // Nút hành động
  var nut = document.createElement("button");
  nut.type = "button";
  if (tt.daSoHuu) {
    nut.className = "chNutDoi chNutDaCo";
    nut.textContent = "✅ Đã sở hữu";
    nut.disabled = true;
  } else if (tt.hetHang) {
    nut.className = "chNutDoi";
    nut.textContent = "Hết hàng";
    nut.disabled = true;
  } else if (tt.giaHienThi === 0) {
    nut.className = "chNutDoi chNutMienPhi";
    nut.textContent = "🎁 Nhận miễn phí";
    nut.disabled = !tt.choPhepDoi;
    nut.addEventListener("click", function () { chXacNhanDoi(vp, tt); });
  } else {
    nut.className = "chNutDoi";
    nut.textContent = (vp.loai === "qua" ? "🎁 Đổi quà 💎 " : "💎 Đổi ") + tt.giaHienThi;
    nut.disabled = !tt.choPhepDoi;
    nut.addEventListener("click", function () { chXacNhanDoi(vp, tt); });
  }
  than.appendChild(nut);

  the.appendChild(than);
  return the;
}

/**
 * Tính trạng thái hiển thị của 1 vật phẩm.
 * Trả về: { daSoHuu, hetHang, giaHienThi, choPhepDoi, ghiChu, ghiChuDo }
 * LƯU Ý: chỉ để HIỂN THỊ. Máy chủ mới là nơi quyết định giá và trừ kim cương.
 */
function chTinhTrangThai(vp) {
  var laQua = (vp.loai === "qua");
  var level = chTaiKhoan.level != null ? chTaiKhoan.level : 1;
  var diemSo = chTaiKhoan.diemSo != null ? chTaiKhoan.diemSo : 0;

  var daSoHuu = !laQua && chIdDaSoHuu[vp.id] === true;
  var hetHang = (vp.conLai === 0); // conLai null = không giới hạn

  var coMoc = (vp.mocLevel != null);
  var duMoc = coMoc && level >= vp.mocLevel;
  var giaHienThi = duMoc ? 0 : (vp.giaKimCuong || 0);

  var duTien = diemSo >= giaHienThi;
  var choPhepDoi = !daSoHuu && !hetHang && duTien;

  var ghiChu = "";
  var ghiChuDo = false;
  if (!daSoHuu && !hetHang) {
    if (coMoc && !duMoc) {
      ghiChu = "Miễn phí khi đạt Level " + vp.mocLevel;
    }
    if (giaHienThi > 0 && !duTien) {
      ghiChu = "Con chưa đủ kim cương";
      ghiChuDo = true;
    }
  }

  return {
    daSoHuu: daSoHuu,
    hetHang: hetHang,
    giaHienThi: giaHienThi,
    choPhepDoi: choPhepDoi,
    ghiChu: ghiChu,
    ghiChuDo: ghiChuDo
  };
}

// ================================================================
// PHẦN 6: ĐỔI VẬT PHẨM
// ================================================================

function chXacNhanDoi(vp, tt) {
  if (chDangXuLy) return;

  var laQua = (vp.loai === "qua");
  var loiNhac;
  if (laQua) {
    loiNhac = "Con muốn đổi quà \"" + vp.ten + "\"" +
      (tt.giaHienThi > 0 ? " với giá " + tt.giaHienThi + " 💎" : "") +
      "?\nQuà sẽ được thầy cô/bố mẹ trao tận tay sau nhé.";
  } else if (tt.giaHienThi === 0) {
    loiNhac = "Con nhận miễn phí \"" + vp.ten + "\" và dùng được ngay chứ?";
  } else {
    loiNhac = "Con muốn đổi \"" + vp.ten + "\" với giá " + tt.giaHienThi + " 💎 chứ?";
  }

  if (!window.confirm(loiNhac)) return;

  chDangXuLy = true;
  chHienThongBao("Đang đổi vật phẩm...", "tot");

  apiGoiRpc("doi_vat_pham", {
    p_ten: chTaiKhoan.tenDangNhap,
    p_vat_pham_id: vp.id
  }).then(function (kq) {
    chDangXuLy = false;
    kq = kq || {};

    if (!kq.thanhCong) {
      chHienThongBao(chDichLoi(kq.thongBao), "xau");
      // Tải lại để đồng bộ (ví dụ: đã sở hữu ở tab khác, hết hàng...)
      chTaiDuLieu();
      return;
    }

    // Cập nhật số dư từ máy chủ (nguồn sự thật)
    if (typeof kq.diemMoi === "number") {
      chTaiKhoan.diemSo = kq.diemMoi;
      chLuuPhien();
      chCapNhatThanhSoDu();
    }

    if (laQua) {
      chHienThongBao("🎁 Đổi quà thành công! Quà đang chờ được trao, con nhớ hỏi thầy cô hoặc bố mẹ nhé.", "tot");
    } else {
      chHienThongBao("🎉 Đổi thành công! \"" + vp.ten + "\" đã được trang bị ngay cho con.", "tot");
    }

    // Tải lại danh mục + đã sở hữu + quà chờ trao cho khớp trạng thái mới
    chTaiDuLieu();
  });
}

/** Đổi thông báo lỗi (không dấu, từ máy chủ) sang câu thân thiện có dấu cho trẻ */
function chDichLoi(thongBao) {
  var s = (thongBao || "").toLowerCase();
  if (s.indexOf("da so huu") >= 0) return "Con đã sở hữu vật phẩm này rồi.";
  if (s.indexOf("khong du kim cuong") >= 0) return "Con chưa đủ kim cương để đổi vật phẩm này.";
  if (s.indexOf("het hang") >= 0) return "Tiếc quá, vật phẩm đã hết hàng rồi.";
  if (s.indexOf("khong ton tai") >= 0 || s.indexOf("dang an") >= 0) return "Vật phẩm này hiện không còn bán nữa.";
  if (s.indexOf("khong tim thay tai khoan") >= 0) return "Phiên đăng nhập có vấn đề, con đăng nhập lại giúp nhé.";
  return thongBao || "Đổi vật phẩm chưa được, con thử lại nhé.";
}

// ================================================================
// PHẦN 7: QUÀ ĐÃ ĐỔI (CHỜ TRAO)
// ================================================================

function chVeQuaChoTrao() {
  var khoi = document.getElementById("chKhoiChoTrao");
  var ds = document.getElementById("chDanhSachChoTrao");
  if (!khoi || !ds) return;

  // Chỉ hiển thị các dòng là 'qua' trong lịch sử đổi
  var quaList = chLichSuDoiQua.filter(function (ls) { return ls.loai === "qua"; });

  if (!quaList.length) {
    khoi.classList.remove("hien");
    ds.innerHTML = "";
    return;
  }

  ds.innerHTML = "";
  quaList.forEach(function (ls) {
    var dong = document.createElement("div");
    dong.className = "chChoTraoDong";

    var hinh = document.createElement("div");
    hinh.className = "chChoTraoHinh";
    hinh.innerHTML = chLaUrlAnh(ls.urlHinh) ? '<img src="' + ls.urlHinh + '" alt="">' : "🎁";
    dong.appendChild(hinh);

    var ten = document.createElement("div");
    ten.className = "chChoTraoTen";
    ten.textContent = ls.tenVatPham || "Quà";
    dong.appendChild(ten);

    var nhan = document.createElement("span");
    // Quà: 'cho_trao' = đang chờ; 'da_nhan' = quản trị đã trao tận tay (NC_06A)
    var daTrao = (ls.trangThai === "da_nhan");
    nhan.className = "chNhanTrangThai " + (daTrao ? "chNhanXong" : "chNhanCho");
    nhan.textContent = daTrao ? "Đã trao ✓" : "Chờ trao thưởng";
    dong.appendChild(nhan);

    ds.appendChild(dong);
  });

  khoi.classList.add("hien");
}

// ================================================================
// PHẦN 8: TIỆN ÍCH
// ================================================================

/** Trả về HTML cho khung hình của 1 vật phẩm (ảnh URL, emoji, hoặc icon loại) */
function chHtmlHinh(vp) {
  if (chLaUrlAnh(vp.urlHinh)) {
    return '<img src="' + vp.urlHinh + '" alt="' + (vp.ten || "") + '">';
  }
  if (vp.urlHinh) {
    // urlHinh là emoji/ký tự
    return chThoat(vp.urlHinh);
  }
  // Bộ quân cờ: thử lấy quân vua trong du_lieu làm hình xem trước
  if (vp.loai === "bo_quan_co" && vp.duLieu && vp.duLieu.k) {
    return chLaUrlAnh(vp.duLieu.k)
      ? '<img src="' + vp.duLieu.k + '" alt="' + (vp.ten || "") + '">'
      : chThoat(vp.duLieu.k);
  }
  // Dự phòng: biểu tượng theo loại
  return (CH_LOAI[vp.loai] && CH_LOAI[vp.loai].icon) || "📦";
}

/** Một chuỗi có phải URL ảnh không (giống luật board.js: bắt đầu http hoặc chứa "/") */
function chLaUrlAnh(s) {
  if (!s || typeof s !== "string") return false;
  return s.indexOf("http") === 0 || s.indexOf("/") >= 0;
}

/** Tên loại hiển thị */
function chTenLoai(loai) {
  return (CH_LOAI[loai] && CH_LOAI[loai].ten) || loai;
}

/** Thoát ký tự HTML cơ bản (dùng khi nhét chuỗi vào innerHTML) */
function chThoat(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function chDatText(id, giaTri) {
  var o = document.getElementById(id);
  if (o) o.textContent = giaTri;
}

var chHenToast = null;
function chHienThongBao(text, loai) {
  var o = document.getElementById("chThongBao");
  if (!o) return;
  o.textContent = text;
  o.className = "hien " + (loai === "xau" ? "xau" : "tot");
  if (chHenToast) clearTimeout(chHenToast);
  chHenToast = setTimeout(function () { o.className = ""; }, 4000);
}

// ================================================================
// KHỞI CHẠY
// ================================================================
document.addEventListener("DOMContentLoaded", chKhoiTao);
