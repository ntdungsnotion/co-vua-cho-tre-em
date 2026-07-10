// ================================================================
// FILE: choi2nguoi_NC.js
// CHỨC NĂNG: Chế độ chơi cờ 2 NGƯỜI ở 2 MÁY (sảnh phòng + ván cờ)
// NGÀY: 10/07/2026 10:00 - BƯỚC: NC_04
// QUY ƯỚC TÊN HÀM/BIẾN: tất cả bắt đầu bằng "c2n" (choi-2-nguoi) để tránh xung đột
//
// PHỤ THUỘC:
//   - chess.js 0.12.0  (biến toàn cục "Chess", nạp trong choi2nguoi_NC.html)
//   - config.js        (biến supabaseClient)
//   - api.js           (hàm apiGoiRpc, apiLayCauHinh)
//   - sessionStorage khóa "coVuaTaiKhoanDangNhap" do app.js ghi khi đăng nhập
//
// CÁC RPC SỬ DỤNG (đã có sẵn từ NC_00, KHÔNG cần chạy thêm SQL):
//   tao_phong, lay_danh_sach_phong, xin_vao_phong, tra_loi_xin_vao,
//   gui_nuoc_di, lay_phong, ket_thuc_phong, huy_phong,
//   lay_thong_tin_ca_nhan (lấy level/avatar đối thủ + làm mới kim cương/EXP)
//
// LUẬT QUAN TRỌNG (HƯỚNG DẪN 4.2):
//   - Chủ phòng cầm quân TRẮNG (đi trước), khách cầm quân ĐEN.
//   - Thắng 2 người KHÔNG lên level.
//   - Kim cương/EXP do MÁY CHỦ tự cộng trong ket_thuc_phong. Giao diện CHỈ
//     hiển thị số máy chủ trả về, TUYỆT ĐỐI không tự tính theo công thức.
//
// ĐỒNG BỘ 2 MÁY:
//   - Chính: Supabase Realtime trên bảng phong_cho (postgres_changes).
//   - Dự phòng: polling lay_phong / lay_danh_sach_phong theo khóa cấu hình
//     chu_ky_polling_giay trong bảng cau_hinh_chung (mặc định 2 giây).
//   - Nguồn sự thật là cột danh_sach_nuoc (mảng nước đi UCI). Mỗi lần nhận
//     cập nhật, nếu số nước khác với ván đang giữ trong máy thì DỰNG LẠI ván
//     từ đầu bằng cách đi lại toàn bộ danh sách -> không bao giờ lệch thế cờ.
// ================================================================

// ----- Hằng số -----
var C2N_KHOA_PHIEN = "coVuaTaiKhoanDangNhap"; // PHẢI trùng APP_KHOA_LUU_PHIEN trong app.js
var C2N_KHOA_PHONG = "coVuaPhongDangChoi";    // Nhớ phòng đang chơi để F5 không mất ván

// Bộ ký tự quân cờ Unicode (giống bộ mặc định của board.js)
var C2N_QUAN = { k: "\u265A", q: "\u265B", r: "\u265C", b: "\u265D", n: "\u265E", p: "\u265F" };

var C2N_COT = ["a", "b", "c", "d", "e", "f", "g", "h"];

// ----- Biến trạng thái -----
var c2nTaiKhoan = null;        // Thông tin tài khoản đang đăng nhập (đọc từ sessionStorage)
var c2nPhong = null;           // Phòng hiện tại (đã chuẩn hóa camelCase)
var c2nVaiTro = "";            // "chu" | "khach"
var c2nManHinh = "sanh";       // "sanh" | "cho" | "choi"

var c2nGame = null;            // Đối tượng Chess() của ván đang chơi
var c2nODangChon = null;       // Ô đang chọn (ví dụ "e2")
var c2nCacNuocHopLe = [];      // Danh sách ô đích hợp lệ của quân đang chọn
var c2nNuocDiCuoi = null;      // { tu: "e2", den: "e4" } để tô sáng nước gần nhất

var c2nDangGuiNuoc = false;    // Đang chờ máy chủ ghi nhận nước đi -> khóa bàn cờ
var c2nDaGoiKetThuc = false;   // Chống gọi ket_thuc_phong 2 lần
var c2nDaHienKetQua = false;   // Chống hiện khung kết quả 2 lần
var c2nHenLuoiAnToan = null;   // Lưới an toàn: bên KHÔNG đi nước cuối sẽ tự kết thúc ván

var c2nKenhSanh = null;        // Kênh Realtime của sảnh
var c2nKenhPhong = null;       // Kênh Realtime của phòng đang chơi
var c2nHenPollingSanh = null;
var c2nHenPollingPhong = null;
var c2nChuKyPollingGiay = 2;

var c2nDoiThu = { ten: "", level: 1, avatar: "🙂" };

// ================================================================
// PHẦN 1: KHỞI ĐỘNG TRANG
// ================================================================

function c2nKhoiTao() {
  c2nTaiKhoan = c2nDocPhienDangNhap();

  if (!c2nTaiKhoan || !c2nTaiKhoan.tenDangNhap) {
    document.getElementById("c2nChuaDangNhap").style.display = "block";
    return;
  }

  var oTen = document.getElementById("c2nTenNguoiChoi");
  if (oTen) oTen.textContent = "Xin chào, " + c2nTaiKhoan.tenDangNhap;

  c2nGanSuKien();

  // Lấy cấu hình (chỉ cần chu_ky_polling_giay), lỗi mạng thì dùng giá trị dự phòng
  c2nTaiCauHinh().then(function () {
    c2nKhoiPhucPhongCu();
  });
}

function c2nGanSuKien() {
  c2nGanClick("c2nBtnTaoPhong", c2nTaoPhong);
  c2nGanClick("c2nBtnLamMoiSanh", c2nTaiDanhSachPhong);
  c2nGanClick("c2nBtnDongY", function () { c2nTraLoiXinVao(true); });
  c2nGanClick("c2nBtnTuChoi", function () { c2nTraLoiXinVao(false); });
  c2nGanClick("c2nBtnHuyPhong", c2nHuyPhong);
  c2nGanClick("c2nBtnXinThua", c2nXinThua);
  c2nGanClick("c2nBtnVeSanh", function () { c2nVeSanh(); });
}

function c2nGanClick(id, ham) {
  var nut = document.getElementById(id);
  if (nut) nut.addEventListener("click", ham);
}

/** Đọc phiên đăng nhập do app.js lưu (KHÔNG bao giờ chứa mật khẩu) */
function c2nDocPhienDangNhap() {
  try {
    var chuoi = sessionStorage.getItem(C2N_KHOA_PHIEN);
    if (!chuoi) return null;
    return JSON.parse(chuoi);
  } catch (loi) {
    return null;
  }
}

/** Ghi lại phiên sau khi kim cương/EXP thay đổi để trang chính hiển thị đúng */
function c2nLuuPhienDangNhap() {
  try {
    sessionStorage.setItem(C2N_KHOA_PHIEN, JSON.stringify(c2nTaiKhoan));
  } catch (loi) { /* trình duyệt chặn sessionStorage -> bỏ qua */ }
}

/** Nhớ / quên phòng đang chơi để làm mới trang (F5) không mất ván */
function c2nNhoPhong() {
  try {
    if (!c2nPhong) return;
    sessionStorage.setItem(C2N_KHOA_PHONG, JSON.stringify({ id: c2nPhong.id, vaiTro: c2nVaiTro }));
  } catch (loi) { /* bỏ qua */ }
}

function c2nQuenPhong() {
  try { sessionStorage.removeItem(C2N_KHOA_PHONG); } catch (loi) { /* bỏ qua */ }
}

function c2nTaiCauHinh() {
  if (typeof apiLayCauHinh !== "function") return Promise.resolve();
  return apiLayCauHinh().then(function (kq) {
    if (kq && kq.thanhCong && kq.cauHinhChung) {
      var giay = parseInt(kq.cauHinhChung.chu_ky_polling_giay, 10);
      if (giay >= 1 && giay <= 30) c2nChuKyPollingGiay = giay;
    }
  }).catch(function () { /* dùng giá trị mặc định */ });
}

/** Sau khi F5: nếu còn phòng đang mở/đang chơi thì quay lại đúng chỗ cũ */
function c2nKhoiPhucPhongCu() {
  var daLuu = null;
  try {
    var chuoi = sessionStorage.getItem(C2N_KHOA_PHONG);
    if (chuoi) daLuu = JSON.parse(chuoi);
  } catch (loi) { daLuu = null; }

  if (!daLuu || !daLuu.id) {
    c2nVeSanh();
    return;
  }

  apiGoiRpc("lay_phong", { p_id: daLuu.id }).then(function (kq) {
    if (!kq || !kq.thanhCong || !kq.phong) { c2nQuenPhong(); c2nVeSanh(); return; }

    var phong = c2nChuanHoaPhong(kq.phong);
    var toiLaChu = (phong.chuPhong === c2nTaiKhoan.tenDangNhap);
    var toiLaKhach = (phong.khach === c2nTaiKhoan.tenDangNhap);

    if (phong.trangThai === "ket_thuc" || (!toiLaChu && !toiLaKhach)) {
      c2nQuenPhong();
      c2nVeSanh();
      return;
    }

    c2nVaoPhong(phong, toiLaChu ? "chu" : "khach");
  });
}

// ================================================================
// PHẦN 2: TIỆN ÍCH CHUNG
// ================================================================

/**
 * Chuẩn hóa 1 dòng phòng về dạng camelCase.
 * Dữ liệu có thể đến từ 2 nguồn:
 *   - RPC (đã camelCase nhờ hàm phong_thanh_json trong SQL)
 *   - Realtime postgres_changes (giữ nguyên tên cột snake_case)
 */
function c2nChuanHoaPhong(o) {
  if (!o) return null;
  var laCamel = (o.chuPhong !== undefined);
  return {
    id:           o.id,
    tenPhong:     laCamel ? o.tenPhong     : o.ten_phong,
    chuPhong:     laCamel ? o.chuPhong     : o.chu_phong,
    khach:        (laCamel ? o.khach       : o.khach) || "",
    trangThai:    laCamel ? o.trangThai    : o.trang_thai,
    fenHienTai:   laCamel ? o.fenHienTai   : o.fen_hien_tai,
    nuocDiCuoi:   (laCamel ? o.nuocDiCuoi  : o.nuoc_di_cuoi) || "",
    danhSachNuoc: (laCamel ? o.danhSachNuoc : o.danh_sach_nuoc) || [],
    luotHienTai:  laCamel ? o.luotHienTai  : o.luot_hien_tai,
    ketQua:       (laCamel ? o.ketQua      : o.ket_qua) || ""
  };
}

/** Lấy ô xuất phát + ô đích của nước đi cuối cùng (để tô sáng), null nếu chưa có nước nào */
function c2nNuocCuoiTuDanhSach(ds) {
  if (!ds || !ds.length) return null;
  var cuoi = String(ds[ds.length - 1]);
  return { tu: cuoi.substring(0, 2), den: cuoi.substring(2, 4) };
}

function c2nHienManHinh(ten) {
  c2nManHinh = ten;
  var ds = document.querySelectorAll(".c2nManHinh");
  for (var i = 0; i < ds.length; i++) ds[i].classList.remove("dangHien");
  var khoi = document.getElementById("c2nManHinh" + ten.charAt(0).toUpperCase() + ten.slice(1));
  if (khoi) khoi.classList.add("dangHien");
}

function c2nBaoTin(chu, laTot) {
  var o = document.getElementById("c2nThongBao");
  if (!o) return;
  o.textContent = chu;
  o.className = "hien " + (laTot ? "tot" : "xau");
  if (o.c2nHenXoa) clearTimeout(o.c2nHenXoa);
  o.c2nHenXoa = setTimeout(function () { o.className = ""; }, 5000);
}

/** Màu quân của mình: chủ phòng = Trắng, khách = Đen */
function c2nMauCuaToi() {
  return c2nVaiTro === "chu" ? "w" : "b";
}

function c2nTenDoiThuTheoPhong(phong) {
  if (!phong) return "";
  return c2nVaiTro === "chu" ? phong.khach : phong.chuPhong;
}

// ================================================================
// PHẦN 3: SẢNH PHÒNG
// ================================================================

function c2nVeSanh() {
  c2nRoiKenhPhong();
  c2nDungPollingPhong();
  c2nQuenPhong();

  c2nPhong = null;
  c2nVaiTro = "";
  c2nGame = null;
  c2nDaGoiKetThuc = false;
  c2nDaHienKetQua = false;
  if (c2nHenLuoiAnToan) { clearTimeout(c2nHenLuoiAnToan); c2nHenLuoiAnToan = null; }

  c2nHienManHinh("Sanh");
  c2nDangKyKenhSanh();
  c2nBatPollingSanh();
  c2nTaiDanhSachPhong();
}

function c2nDangKyKenhSanh() {
  if (c2nKenhSanh) return;
  try {
    c2nKenhSanh = supabaseClient
      .channel("c2n-sanh-phong")
      .on("postgres_changes",
          { event: "*", schema: "public", table: "phong_cho" },
          function () { c2nTaiDanhSachPhong(); })
      .subscribe();
  } catch (loi) {
    c2nKenhSanh = null; // Realtime hỏng -> vẫn còn polling
  }
}

function c2nRoiKenhSanh() {
  if (!c2nKenhSanh) return;
  try { supabaseClient.removeChannel(c2nKenhSanh); } catch (loi) { /* bỏ qua */ }
  c2nKenhSanh = null;
}

function c2nBatPollingSanh() {
  c2nDungPollingSanh();
  c2nHenPollingSanh = setInterval(function () {
    if (c2nManHinh === "Sanh" || c2nManHinh === "sanh") c2nTaiDanhSachPhong();
  }, c2nChuKyPollingGiay * 1000 * 2); // sảnh không cần nhanh như trong ván
}

function c2nDungPollingSanh() {
  if (c2nHenPollingSanh) { clearInterval(c2nHenPollingSanh); c2nHenPollingSanh = null; }
}

function c2nTaiDanhSachPhong() {
  apiGoiRpc("lay_danh_sach_phong", {}).then(function (kq) {
    if (!kq || !kq.thanhCong) {
      c2nVeDanhSachPhong([]);
      return;
    }
    c2nVeDanhSachPhong(kq.danhSachPhong || []);
  });
}

function c2nVeDanhSachPhong(danhSach) {
  var khung = document.getElementById("c2nDanhSachPhong");
  if (!khung) return;
  khung.innerHTML = "";

  if (!danhSach.length) {
    var trong = document.createElement("p");
    trong.textContent = "Chưa có phòng nào đang mở. Con hãy tạo phòng và rủ bạn vào chơi nhé!";
    khung.appendChild(trong);
    return;
  }

  for (var i = 0; i < danhSach.length; i++) {
    var p = c2nChuanHoaPhong(danhSach[i]);
    khung.appendChild(c2nTaoTheP(p));
  }
}

function c2nTaoTheP(phong) {
  var laCuaToi = (phong.chuPhong === c2nTaiKhoan.tenDangNhap);

  var the = document.createElement("div");
  the.className = "c2nTheP" + (laCuaToi ? " c2nThePCuaToi" : "");

  var chiTiet = document.createElement("div");
  chiTiet.className = "c2nThePChiTiet";

  var ten = document.createElement("div");
  ten.className = "c2nThePTen";
  ten.textContent = "♟️ " + phong.tenPhong;
  chiTiet.appendChild(ten);

  var phu = document.createElement("div");
  phu.className = "c2nThePPhu";
  phu.textContent = "Chủ phòng: " + phong.chuPhong + (laCuaToi ? " (chính là con)" : "");
  chiTiet.appendChild(phu);

  var huy = document.createElement("span");
  if (phong.trangThai === "mo") {
    huy.className = "c2nHuyChuong c2nHuyChuongMo";
    huy.textContent = "Đang mở";
  } else {
    huy.className = "c2nHuyChuong c2nHuyChuongCho";
    huy.textContent = "Đang chờ duyệt";
  }
  chiTiet.appendChild(huy);

  the.appendChild(chiTiet);

  var nut = document.createElement("button");
  nut.type = "button";
  nut.className = "c2nNut";

  if (laCuaToi) {
    nut.textContent = "↩ Vào Lại";
    nut.classList.add("c2nNutVang");
    (function (p) {
      nut.addEventListener("click", function () { c2nVaoPhong(p, "chu"); });
    })(phong);
  } else if (phong.trangThai === "mo") {
    nut.textContent = "🙋 Xin Vào";
    nut.classList.add("c2nNutXanh");
    (function (p) {
      nut.addEventListener("click", function () { c2nXinVaoPhong(p.id); });
    })(phong);
  } else {
    nut.textContent = "Đang bận";
    nut.disabled = true;
  }

  the.appendChild(nut);
  return the;
}

function c2nTaoPhong() {
  var oTen = document.getElementById("c2nTenPhongMoi");
  var tenPhong = oTen ? oTen.value.trim() : "";

  var nut = document.getElementById("c2nBtnTaoPhong");
  if (nut) nut.disabled = true;

  apiGoiRpc("tao_phong", { p_ten: c2nTaiKhoan.tenDangNhap, p_ten_phong: tenPhong })
    .then(function (kq) {
      if (nut) nut.disabled = false;
      if (!kq || !kq.thanhCong) {
        c2nBaoTin((kq && kq.thongBao) || "Không tạo được phòng", false);
        return;
      }
      if (oTen) oTen.value = "";
      c2nVaoPhong(c2nChuanHoaPhong(kq.phong), "chu");
    });
}

function c2nXinVaoPhong(idPhong) {
  apiGoiRpc("xin_vao_phong", { p_id: idPhong, p_ten: c2nTaiKhoan.tenDangNhap })
    .then(function (kq) {
      if (!kq || !kq.thanhCong) {
        c2nBaoTin((kq && kq.thongBao) || "Không xin vào được phòng này", false);
        c2nTaiDanhSachPhong();
        return;
      }
      c2nVaoPhong(c2nChuanHoaPhong(kq.phong), "khach");
    });
}

// ================================================================
// PHẦN 4: VÀO PHÒNG - LẮNG NGHE THAY ĐỔI - MÁY TRẠNG THÁI
// ================================================================

function c2nVaoPhong(phong, vaiTro) {
  c2nRoiKenhSanh();
  c2nDungPollingSanh();

  c2nPhong = phong;
  c2nVaiTro = vaiTro;
  c2nDaGoiKetThuc = false;
  c2nDaHienKetQua = false;
  c2nGame = null;
  c2nNhoPhong();

  c2nDangKyKenhPhong(phong.id);
  c2nBatPollingPhong();
  c2nXuLyPhongMoi(phong);
}

function c2nDangKyKenhPhong(idPhong) {
  c2nRoiKenhPhong();
  try {
    c2nKenhPhong = supabaseClient
      .channel("c2n-phong-" + idPhong)
      .on("postgres_changes",
          { event: "UPDATE", schema: "public", table: "phong_cho", filter: "id=eq." + idPhong },
          function (goiTin) { c2nXuLyPhongMoi(c2nChuanHoaPhong(goiTin.new)); })
      .subscribe();
  } catch (loi) {
    c2nKenhPhong = null; // Realtime hỏng -> polling gánh
  }
}

function c2nRoiKenhPhong() {
  if (!c2nKenhPhong) return;
  try { supabaseClient.removeChannel(c2nKenhPhong); } catch (loi) { /* bỏ qua */ }
  c2nKenhPhong = null;
}

function c2nBatPollingPhong() {
  c2nDungPollingPhong();
  c2nHenPollingPhong = setInterval(function () {
    if (!c2nPhong) return;
    if (c2nPhong.trangThai === "ket_thuc") return;
    c2nLayLaiPhong();
  }, c2nChuKyPollingGiay * 1000);
}

function c2nDungPollingPhong() {
  if (c2nHenPollingPhong) { clearInterval(c2nHenPollingPhong); c2nHenPollingPhong = null; }
}

function c2nLayLaiPhong() {
  if (!c2nPhong) return;
  apiGoiRpc("lay_phong", { p_id: c2nPhong.id }).then(function (kq) {
    if (kq && kq.thanhCong && kq.phong) c2nXuLyPhongMoi(c2nChuanHoaPhong(kq.phong));
  });
}

/**
 * Máy trạng thái: nhận 1 bản chụp phòng mới nhất và quyết định hiển thị gì.
 * 'mo' -> 'cho_duyet' -> 'dang_choi' -> 'ket_thuc'
 */
function c2nXuLyPhongMoi(phong) {
  if (!phong) return;
  if (!c2nVaiTro) return;                            // đã rời phòng, bỏ qua gói tin đến muộn
  if (c2nPhong && phong.id !== c2nPhong.id) return;  // gói tin của phòng khác
  c2nPhong = phong;

  if (phong.trangThai === "mo") {
    if (c2nVaiTro === "khach") {
      c2nBaoTin("Chủ phòng đã từ chối yêu cầu của con. Con thử phòng khác nhé!", false);
      c2nVeSanh();
    } else {
      c2nVeManHinhCho();
    }
    return;
  }

  if (phong.trangThai === "cho_duyet") {
    c2nVeManHinhCho();
    return;
  }

  if (phong.trangThai === "dang_choi") {
    c2nVaoVan();
    return;
  }

  if (phong.trangThai === "ket_thuc") {
    if (c2nManHinh === "Choi") {
      c2nHienKetQua(phong.ketQua, null);
    } else {
      c2nBaoTin("Phòng đã đóng.", false);
      c2nVeSanh();
    }
  }
}

function c2nVeManHinhCho() {
  c2nHienManHinh("Cho");

  var oTieuDe = document.getElementById("c2nChoTieuDe");
  var oMoTa = document.getElementById("c2nChoMoTa");
  var khoiDuyet = document.getElementById("c2nKhoiDuyet");
  var oTenKhach = document.getElementById("c2nTenKhachXinVao");
  var nutRoi = document.getElementById("c2nBtnHuyPhong");

  if (oTieuDe) oTieuDe.textContent = "⏳ " + c2nPhong.tenPhong;

  if (c2nVaiTro === "chu") {
    if (nutRoi) nutRoi.textContent = "❌ Hủy Phòng";
    if (c2nPhong.trangThai === "cho_duyet" && c2nPhong.khach) {
      if (oMoTa) oMoTa.textContent = "Có bạn xin vào chơi cùng!";
      if (oTenKhach) oTenKhach.textContent = c2nPhong.khach;
      if (khoiDuyet) khoiDuyet.style.display = "block";
    } else {
      if (oMoTa) oMoTa.textContent = "Đang chờ bạn khác xin vào phòng... Con cầm quân Trắng và đi trước nhé!";
      if (khoiDuyet) khoiDuyet.style.display = "none";
    }
  } else {
    if (nutRoi) nutRoi.textContent = "↩ Rút Yêu Cầu";
    if (khoiDuyet) khoiDuyet.style.display = "none";
    if (oMoTa) oMoTa.textContent = "Đã gửi yêu cầu tới " + c2nPhong.chuPhong + ". Đang chờ đồng ý...";
  }
}

function c2nTraLoiXinVao(dongY) {
  if (!c2nPhong) return;
  apiGoiRpc("tra_loi_xin_vao", {
    p_id: c2nPhong.id,
    p_ten_chu: c2nTaiKhoan.tenDangNhap,
    p_dong_y: dongY
  }).then(function (kq) {
    if (!kq || !kq.thanhCong) {
      c2nBaoTin((kq && kq.thongBao) || "Không trả lời được", false);
      c2nLayLaiPhong();
      return;
    }
    c2nXuLyPhongMoi(c2nChuanHoaPhong(kq.phong));
  });
}

function c2nHuyPhong() {
  if (!c2nPhong) { c2nVeSanh(); return; }
  apiGoiRpc("huy_phong", { p_id: c2nPhong.id, p_ten: c2nTaiKhoan.tenDangNhap })
    .then(function (kq) {
      if (kq && kq.thanhCong) c2nBaoTin(kq.thongBao || "Đã rời phòng", true);
      c2nVeSanh();
    });
}

// ================================================================
// PHẦN 5: VÁN CỜ - ĐỒNG BỘ, VẼ BÀN CỜ, ĐI QUÂN
// ================================================================

function c2nVaoVan() {
  var laLanDau = (c2nManHinh !== "Choi");
  if (laLanDau) {
    c2nHienManHinh("Choi");
    c2nAnKhungKetQua();
    c2nLayThongTinDoiThu();
    c2nCapNhatTheBanThan();
    var nutThua = document.getElementById("c2nBtnXinThua");
    var nutSanh = document.getElementById("c2nBtnVeSanh");
    if (nutThua) nutThua.style.display = "inline-block";
    if (nutSanh) nutSanh.style.display = "none";
  }
  c2nDongBoVan(c2nPhong);
}

/**
 * Dựng lại ván cờ từ danh sách nước đi UCI của máy chủ.
 * Chỉ dựng lại khi SỐ NƯỚC khác nhau -> nước của chính mình vừa đi (đã áp dụng
 * cục bộ) không làm bàn cờ nháy lại.
 */
function c2nDongBoVan(phong) {
  var ds = phong.danhSachNuoc || [];

  if (!c2nGame || c2nGame.history().length !== ds.length) {
    var g = new Chess();
    var thanhCong = true;

    for (var i = 0; i < ds.length; i++) {
      var uci = String(ds[i]);
      var nuoc = g.move({
        from: uci.substring(0, 2),
        to: uci.substring(2, 4),
        promotion: uci.length > 4 ? uci.substring(4, 5) : "q"
      });
      if (!nuoc) { thanhCong = false; break; }
    }

    // Lưới an toàn: nếu vì lý do nào đó không đi lại được, tin vào FEN của máy chủ
    if (!thanhCong) {
      g = new Chess();
      try { g.load(phong.fenHienTai); } catch (loi) { /* giữ thế cờ đầu ván */ }
    }

    c2nGame = g;
    c2nODangChon = null;
    c2nCacNuocHopLe = [];

    c2nNuocDiCuoi = c2nNuocCuoiTuDanhSach(ds);
  }

  c2nVeBanCo();
  c2nCapNhatThongTinVan();

  // Ván đã hết nhưng máy chủ chưa ghi nhận: bên KHÔNG đi nước cuối chờ 3,5 giây
  // rồi tự gọi ket_thuc_phong (phòng trường hợp bên kia mất mạng ngay sau nước cuối).
  if (c2nGame.game_over() && phong.trangThai === "dang_choi" && !c2nDaGoiKetThuc) {
    if (!c2nHenLuoiAnToan) {
      c2nHenLuoiAnToan = setTimeout(function () {
        c2nHenLuoiAnToan = null;
        if (c2nPhong && c2nPhong.trangThai === "dang_choi" && !c2nDaGoiKetThuc) {
          c2nGoiKetThuc(c2nTinhKetQuaVan());
        }
      }, 3500);
    }
  }
}

function c2nVeBanCo() {
  var khung = document.getElementById("c2nBanCo");
  if (!khung || !c2nGame) return;

  var lat = (c2nVaiTro === "khach"); // Khách cầm Đen -> lật bàn cờ cho dễ nhìn
  var choPhepBam = c2nDuocPhepDi();

  khung.innerHTML = "";
  khung.style.display = "grid";
  khung.style.gridTemplateColumns = "repeat(8, 1fr)";
  khung.style.gridTemplateRows = "repeat(8, 1fr)";
  khung.style.overflow = "hidden";
  khung.style.userSelect = "none";

  var luoiQuan = c2nGame.board(); // luoiQuan[0] là hàng 8

  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      var hang = lat ? 7 - i : i;
      var cot = lat ? 7 - j : j;
      var tenO = C2N_COT[cot] + (8 - hang);

      var oVuong = document.createElement("div");
      oVuong.setAttribute("data-o", tenO);

      var laOSang = (hang + cot) % 2 === 0;
      oVuong.style.backgroundColor = laOSang ? "#f0d9b5" : "#b58863";
      oVuong.style.display = "flex";
      oVuong.style.alignItems = "center";
      oVuong.style.justifyContent = "center";
      oVuong.style.cursor = choPhepBam ? "pointer" : "default";
      oVuong.style.position = "relative";
      oVuong.style.fontSize = "clamp(22px, 7vw, 44px)";
      oVuong.style.lineHeight = "1";

      // Tô sáng nước đi gần nhất (cả 2 bên) - HƯỚNG DẪN 4.8
      if (c2nNuocDiCuoi && (tenO === c2nNuocDiCuoi.tu || tenO === c2nNuocDiCuoi.den)) {
        oVuong.style.backgroundColor = laOSang ? "#f7e08a" : "#c9a44a";
      }

      // Tô sáng ô đang chọn
      if (tenO === c2nODangChon) {
        oVuong.style.boxShadow = "inset 0 0 0 4px rgba(255, 183, 3, 0.9)";
      }

      var quan = luoiQuan[hang][cot];
      if (quan) {
        oVuong.appendChild(c2nTaoPhanTuQuan(quan));
        if (quan.type === "k" && c2nGame.in_check() && quan.color === c2nGame.turn()) {
          oVuong.style.boxShadow = "inset 0 0 0 4px rgba(231, 76, 60, 0.9)";
        }
      }

      if (c2nCacNuocHopLe.indexOf(tenO) !== -1) {
        var cham = document.createElement("div");
        cham.style.position = "absolute";
        cham.style.width = quan ? "80%" : "34%";
        cham.style.height = quan ? "80%" : "34%";
        cham.style.borderRadius = "50%";
        cham.style.pointerEvents = "none";
        if (quan) {
          cham.style.border = "4px solid rgba(46, 204, 113, 0.9)";
          cham.style.background = "transparent";
        } else {
          cham.style.background = "rgba(46, 204, 113, 0.65)";
        }
        oVuong.appendChild(cham);
      }

      (function (o) {
        oVuong.addEventListener("click", function () { c2nXuLyBamO(o); });
      })(tenO);

      khung.appendChild(oVuong);
    }
  }
}

function c2nTaoPhanTuQuan(quan) {
  var oQuan = document.createElement("span");
  oQuan.style.pointerEvents = "none";
  oQuan.style.display = "flex";
  oQuan.style.alignItems = "center";
  oQuan.style.justifyContent = "center";
  oQuan.textContent = C2N_QUAN[quan.type];

  if (quan.color === "w") {
    oQuan.style.color = "#ffffff";
    oQuan.style.textShadow = "0 0 2px #000, 1px 1px 2px #000";
  } else {
    oQuan.style.color = "#1a1a1a";
    oQuan.style.textShadow = "0 0 2px rgba(255,255,255,0.5)";
  }
  return oQuan;
}

/** Được phép bấm bàn cờ khi: đang chơi, đúng lượt, không đang gửi nước lên máy chủ */
function c2nDuocPhepDi() {
  if (!c2nGame || !c2nPhong) return false;
  if (c2nPhong.trangThai !== "dang_choi") return false;
  if (c2nGame.game_over()) return false;
  if (c2nDangGuiNuoc) return false;
  return c2nGame.turn() === c2nMauCuaToi();
}

function c2nXuLyBamO(tenO) {
  if (!c2nDuocPhepDi()) return;

  if (c2nODangChon && c2nCacNuocHopLe.indexOf(tenO) !== -1) {
    c2nGuiNuocDi(c2nODangChon, tenO);
    return;
  }

  var quan = c2nGame.get(tenO);
  if (quan && quan.color === c2nMauCuaToi()) {
    c2nODangChon = tenO;
    c2nCacNuocHopLe = c2nGame.moves({ square: tenO, verbose: true }).map(function (n) { return n.to; });
  } else {
    c2nODangChon = null;
    c2nCacNuocHopLe = [];
  }
  c2nVeBanCo();
}

/**
 * Đi 1 nước: áp dụng cục bộ trước cho mượt tay, rồi gửi lên máy chủ.
 * Máy chủ (gui_nuoc_di) kiểm tra lại ĐÚNG LƯỢT, đúng người. Nếu bị từ chối
 * thì hoàn tác nước vừa đi và lấy lại thế cờ chuẩn từ máy chủ.
 * Phong cấp: tự động chọn Hậu ("q") cho đơn giản với trẻ em (giống board.js).
 */
function c2nGuiNuocDi(oTu, oDen) {
  var nuoc = c2nGame.move({ from: oTu, to: oDen, promotion: "q" });
  c2nODangChon = null;
  c2nCacNuocHopLe = [];

  if (!nuoc) { c2nVeBanCo(); return; }

  var uci = nuoc.from + nuoc.to + (nuoc.promotion ? nuoc.promotion : "");
  c2nNuocDiCuoi = { tu: nuoc.from, den: nuoc.to };
  c2nDangGuiNuoc = true;
  c2nVeBanCo();
  c2nCapNhatThongTinVan();

  apiGoiRpc("gui_nuoc_di", {
    p_id: c2nPhong.id,
    p_ten: c2nTaiKhoan.tenDangNhap,
    p_nuoc: uci,
    p_fen_moi: c2nGame.fen(),
    p_luot_moi: c2nGame.turn()
  }).then(function (kq) {
    c2nDangGuiNuoc = false;

    if (!kq || !kq.thanhCong) {
      c2nGame.undo();
      c2nNuocDiCuoi = c2nNuocCuoiTuDanhSach(c2nPhong.danhSachNuoc);
      c2nBaoTin((kq && kq.thongBao) || "Không gửi được nước đi", false);
      c2nVeBanCo();
      c2nLayLaiPhong();
      return;
    }

    c2nPhong = c2nChuanHoaPhong(kq.phong);
    c2nCapNhatThongTinVan();

    // Người vừa đi nước CUỐI CÙNG là người báo kết thúc ván cho máy chủ
    var ketQua = c2nTinhKetQuaVan();
    if (ketQua) c2nGoiKetThuc(ketQua);
  });
}

/** Trả về 'chu_thang' | 'khach_thang' | 'hoa' nếu ván đã xong, ngược lại null */
function c2nTinhKetQuaVan() {
  if (!c2nGame || !c2nGame.game_over()) return null;
  if (c2nGame.in_checkmate()) {
    // Bên ĐANG đến lượt là bên bị chiếu bí -> bên đó THUA
    return c2nGame.turn() === "w" ? "khach_thang" : "chu_thang";
  }
  return "hoa";
}

function c2nCapNhatThongTinVan() {
  var oLuot = document.getElementById("c2nHienThiLuot");
  var oTrangThai = document.getElementById("c2nHienThiTrangThai");
  var theToi = document.getElementById("c2nTheBanThan");
  var theDoi = document.getElementById("c2nTheDoiThu");

  if (!c2nGame) return;

  var denLuotToi = (c2nGame.turn() === c2nMauCuaToi()) && !c2nGame.game_over();

  if (oLuot) {
    if (c2nGame.game_over()) oLuot.textContent = "Ván đã kết thúc";
    else if (c2nDangGuiNuoc) oLuot.textContent = "Đang gửi nước đi...";
    else if (denLuotToi) oLuot.textContent = "Đến lượt con!";
    else oLuot.textContent = "Đang chờ " + (c2nDoiThu.ten || "đối thủ") + " đi...";
  }

  if (oTrangThai) {
    if (c2nGame.game_over()) oTrangThai.textContent = "Kết thúc";
    else if (c2nGame.in_check()) oTrangThai.textContent = "Đang bị chiếu tướng!";
    else oTrangThai.textContent = "Đang chơi";
  }

  if (theToi) theToi.classList.toggle("dangDenLuot", denLuotToi);
  if (theDoi) theDoi.classList.toggle("dangDenLuot", !denLuotToi && !c2nGame.game_over());
}

function c2nCapNhatTheBanThan() {
  var oAvatar = document.getElementById("c2nTheBanThanAvatar");
  var oTen = document.getElementById("c2nTheBanThanTen");
  var oLevel = document.getElementById("c2nTheBanThanLevel");

  var mau = (c2nVaiTro === "chu") ? "Quân Trắng" : "Quân Đen";
  if (oAvatar) oAvatar.textContent = c2nTaiKhoan.avatarDaChon || "❓";
  if (oTen) oTen.textContent = c2nTaiKhoan.tenDangNhap + " (con)";
  if (oLevel) oLevel.textContent = "Level " + (c2nTaiKhoan.level || 1) + " · " + mau;
}

function c2nLayThongTinDoiThu() {
  var ten = c2nTenDoiThuTheoPhong(c2nPhong);
  if (!ten) return;

  c2nDoiThu.ten = ten;
  var mau = (c2nVaiTro === "chu") ? "Quân Đen" : "Quân Trắng";

  var oTen = document.getElementById("c2nTheDoiThuTen");
  var oLevel = document.getElementById("c2nTheDoiThuLevel");
  var oAvatar = document.getElementById("c2nTheDoiThuAvatar");

  if (oTen) oTen.textContent = ten;
  if (oLevel) oLevel.textContent = mau;

  apiGoiRpc("lay_thong_tin_ca_nhan", { p_ten: ten }).then(function (kq) {
    if (!kq || !kq.thanhCong || !kq.thongTin) return;
    c2nDoiThu.level = kq.thongTin.level || 1;
    c2nDoiThu.avatar = kq.thongTin.avatarDaChon || "🙂";
    if (oLevel) oLevel.textContent = "Level " + c2nDoiThu.level + " · " + mau;
    if (oAvatar) oAvatar.textContent = c2nDoiThu.avatar;
  });
}

// ================================================================
// PHẦN 6: KẾT THÚC VÁN
// ================================================================

function c2nXinThua() {
  if (!c2nPhong || c2nPhong.trangThai !== "dang_choi") return;
  if (!window.confirm("Con muốn xin thua ván này phải không?")) return;

  // Mình xin thua -> bên kia thắng
  var ketQua = (c2nVaiTro === "chu") ? "khach_thang" : "chu_thang";
  c2nGoiKetThuc(ketQua);
}

/**
 * Gọi ket_thuc_phong. MÁY CHỦ tự cộng kim cương + EXP cho cả 2 bên theo
 * hệ số he_so_chia_thuong_2n (HƯỚNG DẪN 4.2). Giao diện chỉ hiển thị con số
 * máy chủ trả về trong trường "thuong".
 */
function c2nGoiKetThuc(ketQua) {
  if (!c2nPhong || c2nDaGoiKetThuc || !ketQua) return;
  c2nDaGoiKetThuc = true;

  if (c2nHenLuoiAnToan) { clearTimeout(c2nHenLuoiAnToan); c2nHenLuoiAnToan = null; }

  apiGoiRpc("ket_thuc_phong", {
    p_id: c2nPhong.id,
    p_ten: c2nTaiKhoan.tenDangNhap,
    p_ket_qua: ketQua
  }).then(function (kq) {
    if (!kq || !kq.thanhCong) {
      c2nDaGoiKetThuc = false;
      c2nBaoTin((kq && kq.thongBao) || "Không kết thúc được ván", false);
      return;
    }
    if (kq.phong) c2nPhong = c2nChuanHoaPhong(kq.phong);
    c2nHienKetQua(c2nPhong.ketQua || ketQua, kq.thuong || null);
  });
}

function c2nAnKhungKetQua() {
  var khung = document.getElementById("c2nKetQua");
  if (!khung) return;
  khung.style.display = "none";
  khung.classList.remove("thang", "thua");
}

/**
 * Hiện khung kết quả.
 * thuong (nếu có) là object { chuPhong:{ten,kimCuongCong}, khach:{ten,kimCuongCong} }
 * do ket_thuc_phong trả về. Bên KHÔNG gọi RPC sẽ không có "thuong" -> lúc đó
 * chỉ hiển thị tổng kim cương/EXP mới nhất lấy từ lay_thong_tin_ca_nhan.
 */
function c2nHienKetQua(ketQua, thuong) {
  if (c2nDaHienKetQua) return;
  c2nDaHienKetQua = true;

  c2nDungPollingPhong();
  c2nRoiKenhPhong();
  c2nQuenPhong();
  if (c2nHenLuoiAnToan) { clearTimeout(c2nHenLuoiAnToan); c2nHenLuoiAnToan = null; }

  var toiThang = (c2nVaiTro === "chu" && ketQua === "chu_thang") ||
                 (c2nVaiTro === "khach" && ketQua === "khach_thang");
  var laHoa = (ketQua === "hoa");

  var khung = document.getElementById("c2nKetQua");
  var oTieuDe = document.getElementById("c2nKetQuaTieuDe");
  var oThuong = document.getElementById("c2nKetQuaThuong");
  var oTong = document.getElementById("c2nKetQuaTong");

  if (oTieuDe) {
    if (laHoa) oTieuDe.textContent = "🤝 Hai bạn hòa nhau!";
    else if (toiThang) oTieuDe.textContent = "🎉 Con thắng rồi!";
    else oTieuDe.textContent = "💪 Con thua ván này, lần sau cố lên nhé!";
  }

  if (khung) {
    khung.style.display = "block";
    khung.classList.remove("thang", "thua");
    khung.classList.add(toiThang ? "thang" : "thua");
  }

  if (oThuong) {
    var soThuong = null;
    if (thuong) {
      var phanCuaToi = (c2nVaiTro === "chu") ? thuong.chuPhong : thuong.khach;
      if (phanCuaToi) soThuong = phanCuaToi.kimCuongCong;
    }
    if (soThuong !== null && soThuong !== undefined) {
      oThuong.textContent = "Con được cộng " + soThuong + " 💎 và " + soThuong + " EXP.";
    } else {
      oThuong.textContent = "Máy chủ đã cộng kim cương và EXP cho cả hai bạn.";
    }
  }

  var nutThua = document.getElementById("c2nBtnXinThua");
  var nutSanh = document.getElementById("c2nBtnVeSanh");
  if (nutThua) nutThua.style.display = "none";
  if (nutSanh) nutSanh.style.display = "inline-block";

  c2nVeBanCo();
  c2nCapNhatThongTinVan();

  if (toiThang) c2nHieuUngPhaoHoa();

  // Làm mới kim cương/EXP thật từ máy chủ và đồng bộ lại phiên đăng nhập
  apiGoiRpc("lay_thong_tin_ca_nhan", { p_ten: c2nTaiKhoan.tenDangNhap }).then(function (kq) {
    if (!kq || !kq.thanhCong || !kq.thongTin) return;
    var t = kq.thongTin;
    c2nTaiKhoan.diemSo = t.diemSo;
    c2nTaiKhoan.kinhNghiem = t.kinhNghiem;
    c2nTaiKhoan.level = t.level;
    c2nLuuPhienDangNhap();
    if (oTong) oTong.textContent = "Con đang có " + t.diemSo + " 💎 và " + t.kinhNghiem + " EXP.";
  });
}

// ================================================================
// PHẦN 7: HIỆU ỨNG (CSS Animation + emoji, không thêm thư viện)
// ================================================================

function c2nTiemCssHieuUng() {
  if (document.getElementById("c2nCssHieuUng")) return;
  var the = document.createElement("style");
  the.id = "c2nCssHieuUng";
  the.textContent =
    "@keyframes c2nBayLen { 0% { transform: translateY(0) scale(0.6); opacity: 1; } 100% { transform: translateY(-160px) scale(1.4); opacity: 0; } }" +
    ".c2nLopHieuUng { position: fixed; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; overflow: hidden; }";
  document.head.appendChild(the);
}

function c2nHieuUngPhaoHoa() {
  c2nTiemCssHieuUng();
  var cacEmoji = ["🎆", "🎇", "✨", "🎉", "🎊"];
  var lop = document.createElement("div");
  lop.className = "c2nLopHieuUng";

  for (var i = 0; i < 30; i++) {
    var hat = document.createElement("div");
    hat.textContent = cacEmoji[Math.floor(Math.random() * cacEmoji.length)];
    hat.style.position = "absolute";
    hat.style.left = (Math.random() * 100) + "%";
    hat.style.top = (60 + Math.random() * 30) + "%";
    hat.style.fontSize = (20 + Math.random() * 24) + "px";
    hat.style.animation = "c2nBayLen " + (1.2 + Math.random() * 1.2) + "s ease-out forwards";
    hat.style.animationDelay = (Math.random() * 0.6) + "s";
    lop.appendChild(hat);
  }

  document.body.appendChild(lop);
  setTimeout(function () {
    if (lop.parentNode) lop.parentNode.removeChild(lop);
  }, 3000);
}

// Chạy hàm khởi tạo ngay khi toàn bộ HTML đã được dựng xong
document.addEventListener("DOMContentLoaded", c2nKhoiTao);
