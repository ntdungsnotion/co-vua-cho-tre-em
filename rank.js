// ================================
// FILE: rank.js
// CHỨC NĂNG: Gọi API lấy bảng xếp hạng, cho trẻ TỰ SẮP theo 7 kiểu NGAY TRÊN
//            TRÌNH DUYỆT (không gọi lại máy chủ), vẽ dữ liệu thành các hàng
//            trong bảng HTML.
// BƯỚC: NC_05 (nâng cấp từ MIG_04) - NGÀY: 10/07/2026
// QUY ƯỚC TÊN HÀM/BIẾN: tất cả bắt đầu bằng "rank" để tránh xung đột
// PHỤ THUỘC:
//   - api.js: apiLayXepHang() -> trả về { thanhCong, thongBao, danhSachXepHang }
//     (RPC lay_xep_hang đã trả đủ 10 trường thô kể từ NC_00: kinhNghiem, thangMay,
//     thangNguoi, tongThang, tongTranMay, tongTranNguoi, tongTran, tyLeThang,
//     tyLeThangMay, tyLeThangNguoi)
//   - app.js: appLayTaiKhoanDangNhap() (để tô sáng hàng của chính người đang đăng nhập)
//
// ĐIỂM MỚI NC_05 (HƯỚNG DẪN 4.4, KẾ HOẠCH mục NC_05):
//   - Cột "Điểm Số" (kim cương) đổi thành "EXP" (kinh_nghiem) - đúng tiêu chí
//     xếp hạng chính thức (KHÔNG còn dùng kim cương để xếp hạng).
//   - Thêm <select id="chonKieuXepHang"> (7 kiểu) + bấm trực tiếp tiêu đề cột
//     số liệu chính (#cotChinhTieuDe) cũng đổi được kiểu - CẢ 2 CÁCH đều KHÔNG
//     gọi lại máy chủ, chỉ sắp lại mảng rankDanhSachGoc đã tải sẵn.
//   - Bảng còn 6 cột: Hạng | Tên Đăng Nhập | Level | [cột chính đổi theo kiểu] |
//     Tổng Trận (cột phụ CỐ ĐỊNH, cho trẻ thấy bối cảnh dù đang sắp theo kiểu nào) |
//     Danh Hiệu.
// ================================

var rankDangTai = false;
var rankDanhSachGoc = [];       // Dữ liệu gốc tải từ máy chủ (chưa sắp lại)
var rankKieuDangChon = "kinhNghiem"; // Mặc định: EXP (đúng tiêu chí xếp hạng chính)

// 7 kiểu sắp xếp cho phép: khoa (đúng tên trường trả về từ lay_xep_hang),
// nhan (tên hiển thị ở tiêu đề cột chính), laPhanTram (thêm dấu % khi hiển thị)
var RANK_DS_KIEU = {
  kinhNghiem:     { nhan: "EXP",                  laPhanTram: false },
  tongThang:      { nhan: "Tổng Số Trận Thắng",    laPhanTram: false },
  thangMay:       { nhan: "Thắng Đấu Máy",         laPhanTram: false },
  thangNguoi:     { nhan: "Thắng Đấu Người",       laPhanTram: false },
  tyLeThang:      { nhan: "Tỷ Lệ Thắng Chung",     laPhanTram: true },
  tyLeThangNguoi: { nhan: "Tỷ Lệ Thắng Đấu Người", laPhanTram: true },
  tyLeThangMay:   { nhan: "Tỷ Lệ Thắng Đấu Máy",   laPhanTram: true }
};

// Thứ tự cố định để nút "bấm tiêu đề cột" xoay vòng qua từng kiểu
var RANK_THU_TU_KIEU = [
  "kinhNghiem", "tongThang", "thangMay", "thangNguoi",
  "tyLeThang", "tyLeThangNguoi", "tyLeThangMay"
];

/**
 * Hàm khởi tạo module xếp hạng, chạy khi trang tải xong.
 * Gán sự kiện cho nút "Làm Mới", nút Tab "Xếp Hạng", ô chọn kiểu sắp xếp, và
 * tiêu đề cột chính (bấm để xoay vòng kiểu sắp xếp).
 */
function rankKhoiTao() {
  var nutLamMoi = document.getElementById("btnLamMoiXepHang");
  if (nutLamMoi) {
    nutLamMoi.addEventListener("click", rankTaiXepHang);
  }

  // Khi người dùng bấm vào Tab "Xếp Hạng" thì tự động tải bảng lần mới nhất
  var nutTabRank = document.getElementById("tabRank");
  if (nutTabRank) {
    nutTabRank.addEventListener("click", rankTaiXepHang);
  }

  var chonKieu = document.getElementById("chonKieuXepHang");
  if (chonKieu) {
    chonKieu.addEventListener("change", function () {
      rankKieuDangChon = chonKieu.value;
      rankVeBang(rankDanhSachGoc);
    });
  }

  // NC_05: bấm trực tiếp vào tiêu đề cột chính cũng đổi được kiểu sắp xếp
  // (đáp ứng "bấm tiêu đề cột HOẶC nút chọn" - HƯỚNG DẪN 4.4)
  var cotChinh = document.getElementById("cotChinhTieuDe");
  if (cotChinh) {
    cotChinh.addEventListener("click", function () {
      var viTri = RANK_THU_TU_KIEU.indexOf(rankKieuDangChon);
      var kieuKeTiep = RANK_THU_TU_KIEU[(viTri + 1) % RANK_THU_TU_KIEU.length];
      rankDoiKieuSapXep(kieuKeTiep);
    });
  }
}

/** Đổi kiểu sắp xếp: cập nhật biến, đồng bộ lại <select>, vẽ lại bảng (không gọi máy chủ) */
function rankDoiKieuSapXep(kieuMoi) {
  rankKieuDangChon = kieuMoi;
  var chonKieu = document.getElementById("chonKieuXepHang");
  if (chonKieu) chonKieu.value = kieuMoi;
  rankVeBang(rankDanhSachGoc);
}

/**
 * Hàm gọi API lấy bảng xếp hạng (1 LẦN) rồi vẽ ra màn hình theo kiểu đang chọn.
 * Trong lúc chờ: hiện dòng "Đang tải...", khóa nút để tránh bấm liên tục.
 */
function rankTaiXepHang() {
  if (rankDangTai) return; // Đang tải rồi thì bỏ qua lần bấm thừa
  rankDangTai = true;

  rankDatTrangThaiNut(true, "Đang tải...");
  rankHienDongThongBao("Đang tải bảng xếp hạng, chờ chút nhé...");

  apiLayXepHang().then(function (ketQua) {
    rankDangTai = false;
    rankDatTrangThaiNut(false, "Làm Mới Xếp Hạng");

    if (ketQua && ketQua.thanhCong && ketQua.danhSachXepHang) {
      rankDanhSachGoc = ketQua.danhSachXepHang;
      rankVeBang(rankDanhSachGoc);
    } else {
      // Máy chủ báo lỗi hoặc không có dữ liệu
      rankDanhSachGoc = [];
      var loi = (ketQua && ketQua.thongBao) ? ketQua.thongBao : "Không tải được bảng xếp hạng";
      rankHienDongThongBao(loi);
    }
  });
}

/**
 * Sắp 1 bản SAO của mảng theo kiểu chỉ định, giảm dần; phá hòa bằng tên đăng
 * nhập tăng dần - ĐÚNG quy tắc "EXP -> tổng thắng -> tỷ lệ thắng -> tên" của
 * HƯỚNG DẪN 4.4 khi kiểu = kinhNghiem (mặc định); các kiểu khác dùng chính kiểu
 * đó làm tiêu chí DUY NHẤT rồi phá hòa bằng tên (đơn giản, dễ hiểu với trẻ).
 */
function rankSapXep(danhSach, kieu) {
  var ds = danhSach.slice(); // Không sửa mảng gốc rankDanhSachGoc
  ds.sort(function (a, b) {
    var giaTriA = a[kieu] || 0;
    var giaTriB = b[kieu] || 0;
    if (giaTriB !== giaTriA) return giaTriB - giaTriA;
    return String(a.tenDangNhap).localeCompare(String(b.tenDangNhap));
  });
  return ds;
}

/**
 * Hàm vẽ toàn bộ danh sách xếp hạng vào tbody #thanBangXepHang, sắp theo
 * rankKieuDangChon. 6 cột: Hạng, Tên Đăng Nhập, Level, [cột chính], Tổng Trận,
 * Danh Hiệu. "Hạng" luôn = vị trí trong danh sách ĐANG XEM (khớp hangThu gốc
 * từ máy chủ khi xem theo kiểu mặc định EXP, vì máy chủ cũng sắp đúng thứ tự đó).
 */
function rankVeBang(danhSachGoc) {
  var than = document.getElementById("thanBangXepHang");
  if (!than) return;

  if (!danhSachGoc || danhSachGoc.length === 0) {
    rankHienDongThongBao("Chưa có người chơi nào trên bảng xếp hạng. Hãy là người đầu tiên!");
    return;
  }

  var thongTinKieu = RANK_DS_KIEU[rankKieuDangChon] || RANK_DS_KIEU.kinhNghiem;
  var oTieuDeChinh = document.getElementById("cotChinhTieuDe");
  if (oTieuDeChinh) oTieuDeChinh.textContent = thongTinKieu.nhan + " ▼";

  var danhSachDaSap = rankSapXep(danhSachGoc, rankKieuDangChon);

  than.innerHTML = "";

  // Lấy tên người đang đăng nhập để tô sáng hàng của chính mình (nếu có)
  var taiKhoan = (typeof appLayTaiKhoanDangNhap === "function") ? appLayTaiKhoanDangNhap() : null;
  var tenMinh = taiKhoan ? taiKhoan.tenDangNhap : null;

  for (var i = 0; i < danhSachDaSap.length; i++) {
    var nguoiChoi = danhSachDaSap[i];
    var hang = document.createElement("tr");
    var hangThu = i + 1;

    // Gán class tô sáng cho 3 hàng đầu (style.css đã định nghĩa sẵn màu)
    if (hangThu === 1) hang.classList.add("hangNhat");
    else if (hangThu === 2) hang.classList.add("hangNhi");
    else if (hangThu === 3) hang.classList.add("hangBa");

    // Tô đậm nhẹ hàng của chính người đang đăng nhập để dễ nhận biết
    if (tenMinh && nguoiChoi.tenDangNhap === tenMinh) {
      hang.style.outline = "2px solid var(--mau-chinh)";
      hang.style.fontWeight = "bold";
    }

    // Cột 1: Hạng (top 3 hiện huy chương, còn lại hiện số thứ tự)
    hang.appendChild(rankTaoO(rankKyHieuHang(hangThu)));

    // Cột 2: Tên đăng nhập (kèm avatar nếu có)
    var chuTen = nguoiChoi.tenDangNhap;
    if (nguoiChoi.avatarDaChon) {
      chuTen = nguoiChoi.avatarDaChon + " " + chuTen;
    }
    hang.appendChild(rankTaoO(chuTen));

    // Cột 3: Level
    hang.appendChild(rankTaoO(nguoiChoi.level));

    // Cột 4: giá trị theo KIỂU ĐANG CHỌN (thêm % nếu là kiểu tỷ lệ)
    var giaTriChinh = nguoiChoi[rankKieuDangChon];
    hang.appendChild(rankTaoO(thongTinKieu.laPhanTram ? (giaTriChinh + "%") : giaTriChinh));

    // Cột 5: Tổng Trận (cố định, cho trẻ thấy bối cảnh dù đang sắp theo kiểu nào)
    hang.appendChild(rankTaoO(nguoiChoi.tongTran));

    // Cột 6: Danh Hiệu
    hang.appendChild(rankTaoO(nguoiChoi.danhHieu));

    than.appendChild(hang);
  }
}

/**
 * Hàm trả về ký hiệu hiển thị cho cột Hạng
 * Top 1/2/3 dùng huy chương vàng/bạc/đồng, các hàng sau dùng số thứ tự
 */
function rankKyHieuHang(hangThu) {
  if (hangThu === 1) return "\uD83E\uDD47"; // Huy chương vàng
  if (hangThu === 2) return "\uD83E\uDD48"; // Huy chương bạc
  if (hangThu === 3) return "\uD83E\uDD49"; // Huy chương đồng
  return String(hangThu);
}

/**
 * Hàm phụ trợ: tạo 1 ô <td> với nội dung văn bản cho sẵn
 * Dùng textContent (không dùng innerHTML) để an toàn với tên người chơi nhập vào
 */
function rankTaoO(noiDung) {
  var o = document.createElement("td");
  o.textContent = (noiDung === undefined || noiDung === null) ? "" : noiDung;
  return o;
}

/**
 * Hàm phụ trợ: hiện 1 dòng thông báo chiếm trọn chiều ngang bảng
 * (dùng cho trạng thái đang tải / lỗi / bảng trống) - bảng có 6 cột (NC_05)
 */
function rankHienDongThongBao(noiDung) {
  var than = document.getElementById("thanBangXepHang");
  if (!than) return;

  than.innerHTML = "";
  var hang = document.createElement("tr");
  var o = document.createElement("td");
  o.setAttribute("colspan", "6"); // Trải dài hết 6 cột của bảng (NC_05)
  o.style.textAlign = "center";
  o.style.padding = "16px";
  o.style.fontStyle = "italic";
  o.textContent = noiDung;
  hang.appendChild(o);
  than.appendChild(hang);
}

/**
 * Hàm phụ trợ: khóa/mở khóa nút "Làm Mới" và đổi chữ trên nút khi đang tải
 */
function rankDatTrangThaiNut(dangKhoa, chuTrenNut) {
  var nut = document.getElementById("btnLamMoiXepHang");
  if (!nut) return;
  nut.disabled = dangKhoa;
  nut.textContent = chuTrenNut;
  nut.style.opacity = dangKhoa ? "0.6" : "1";
}

// Chạy hàm khởi tạo ngay khi toàn bộ HTML đã được dựng xong
document.addEventListener("DOMContentLoaded", rankKhoiTao);
