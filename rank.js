// ================================
// FILE: rank.js
// CHỨC NĂNG: Gọi API lấy bảng xếp hạng và vẽ dữ liệu thành các hàng trong bảng HTML
// BƯỚC: MIG_04
// QUY ƯỚC TÊN HÀM/BIẾN: tất cả bắt đầu bằng "rank" để tránh xung đột
// PHỤ THUỘC:
//   - api.js: apiLayXepHang() -> trả về { thanhCong, thongBao, danhSachXepHang }
//   - app.js: appLayTaiKhoanDangNhap() (để tô sáng hàng của chính người đang đăng nhập)
// ================================

// Biến chặn gọi API liên tục khi đang tải (tránh bấm nút nhiều lần)
var rankDangTai = false;

/**
 * Hàm khởi tạo module xếp hạng, chạy khi trang tải xong
 * Gán sự kiện cho nút "Làm Mới Xếp Hạng" và cho cả nút Tab "Xếp Hạng"
 * (bấm vào Tab sẽ tự động tải lại bảng cho mới nhất)
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
}

/**
 * Hàm gọi API lấy bảng xếp hạng và vẽ ra màn hình
 * Trong lúc chờ: hiện dòng "Đang tải...", khóa nút để tránh bấm liên tục
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
      rankVeBang(ketQua.danhSachXepHang);
    } else {
      // Máy chủ báo lỗi hoặc không có dữ liệu
      var loi = (ketQua && ketQua.thongBao) ? ketQua.thongBao : "Không tải được bảng xếp hạng";
      rankHienDongThongBao(loi);
    }
  });
}

/**
 * Hàm vẽ toàn bộ danh sách xếp hạng vào tbody #thanBangXepHang
 * Nhận vào: danhSach = mảng các người chơi trả về từ api.js
 * Mỗi hàng gồm 5 cột khớp tiêu đề: Hạng, Tên Đăng Nhập, Level, Điểm Số, Danh Hiệu
 */
function rankVeBang(danhSach) {
  var than = document.getElementById("thanBangXepHang");
  if (!than) return;

  than.innerHTML = "";

  // Trường hợp chưa có người chơi nào
  if (!danhSach || danhSach.length === 0) {
    rankHienDongThongBao("Chưa có người chơi nào trên bảng xếp hạng. Hãy là người đầu tiên!");
    return;
  }

  // Lấy tên người đang đăng nhập để tô sáng hàng của chính mình (nếu có)
  var taiKhoan = (typeof appLayTaiKhoanDangNhap === "function") ? appLayTaiKhoanDangNhap() : null;
  var tenMinh = taiKhoan ? taiKhoan.tenDangNhap : null;

  for (var i = 0; i < danhSach.length; i++) {
    var nguoiChoi = danhSach[i];
    var hang = document.createElement("tr");

    // Gán class tô sáng cho 3 hàng đầu (style.css đã định nghĩa sẵn màu)
    if (nguoiChoi.hangThu === 1) hang.classList.add("hangNhat");
    else if (nguoiChoi.hangThu === 2) hang.classList.add("hangNhi");
    else if (nguoiChoi.hangThu === 3) hang.classList.add("hangBa");

    // Tô đậm nhẹ hàng của chính người đang đăng nhập để dễ nhận biết
    if (tenMinh && nguoiChoi.tenDangNhap === tenMinh) {
      hang.style.outline = "2px solid var(--mau-chinh)";
      hang.style.fontWeight = "bold";
    }

    // Cột 1: Hạng (top 3 hiện huy chương, còn lại hiện số thứ tự)
    hang.appendChild(rankTaoO(rankKyHieuHang(nguoiChoi.hangThu)));

    // Cột 2: Tên đăng nhập (kèm avatar nếu có)
    var chuTen = nguoiChoi.tenDangNhap;
    if (nguoiChoi.avatarDaChon) {
      chuTen = nguoiChoi.avatarDaChon + " " + chuTen;
    }
    hang.appendChild(rankTaoO(chuTen));

    // Cột 3: Level
    hang.appendChild(rankTaoO(nguoiChoi.level));

    // Cột 4: Điểm Số
    hang.appendChild(rankTaoO(nguoiChoi.diemSo));

    // Cột 5: Danh Hiệu
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
 * (dùng cho trạng thái đang tải / lỗi / bảng trống)
 */
function rankHienDongThongBao(noiDung) {
  var than = document.getElementById("thanBangXepHang");
  if (!than) return;

  than.innerHTML = "";
  var hang = document.createElement("tr");
  var o = document.createElement("td");
  o.setAttribute("colspan", "5"); // Trải dài hết 5 cột của bảng
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