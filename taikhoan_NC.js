// ================================
// FILE: taikhoan_NC.js (MỚI)
// CHỨC NĂNG: Trang "Tài Khoản" của trẻ (thay cho "Bảng Điều Khiển"/"Cài đặt
//            Avatar" cũ) - chọn avatar miễn phí, trang bị vật phẩm số đã sở
//            hữu, xem kim cương/EXP/level/hạng/danh hiệu/thành tích, bảng 50
//            trận gần nhất, thống kê theo đối thủ, lịch sử đổi thưởng (chỉ xem).
// BƯỚC: NC_05 - NGÀY: 10/07/2026
// QUY ƯỚC TÊN HÀM/BIẾN: tất cả bắt đầu bằng "taikhoan" để tránh xung đột
// PHỤ THUỘC:
//   - api.js: apiLayHoSo, apiLayThongKeDoiThu, apiLayLichSuTran,
//             apiCapNhatAvatar, apiCapNhatTrangBi
//   - app.js: appLayTaiKhoanDangNhap(), appCapNhatTrangBiCucBo()
//
// GHI CHÚ (HƯỚNG DẪN 4.6 - QUAN TRỌNG cho các bước sau):
//   - Kho AVATAR MIỄN PHÍ là 1 bộ emoji CỐ ĐỊNH định nghĩa ngay trong file này
//     (TAIKHOAN_AVATAR_MIEN_PHI) - KHÔNG cần bảng vat_pham, chọn thoải mái,
//     không tốn kim cương, không gọi RPC lay_danh_sach_vat_pham.
//   - Vật phẩm CAO CẤP (mua/đổi bằng kim cương ở Cửa Hàng NC_06B, hoặc vật phẩm
//     mốc Level nếu quản trị seed vào vat_pham với moc_level - NC_06A) hiển thị
//     TRONG mục "Vật Phẩm Đã Sở Hữu" bên dưới, lấy từ vatPhamSoHuu của lay_ho_so
//     (suy ra từ lich_su_doi_qua) - mục này sẽ TỰ CÓ DỮ LIỆU khi NC_06A/NC_06B
//     hoàn thành, KHÔNG cần sửa lại file này.
//   - Nút "Trang Bị" dùng CHUNG 1 hàm generic cho mọi loai (kể cả loai='avatar'
//     nếu đó là avatar cao cấp đã mua) - không cần sửa khi có loại vật phẩm mới.
// ================================

// Bộ avatar emoji miễn phí, chọn thoải mái không cần đổi kim cương (HƯỚNG DẪN 4.6)
var TAIKHOAN_AVATAR_MIEN_PHI = [
  "😀", "😎", "🤠", "🥳", "🦁", "🐯", "🐼", "🐰",
  "🦊", "🐸", "🐵", "🦄", "🐲", "🤖", "👑", "🧑‍🚀"
];

// Chặn tải hồ sơ chồng nhau khi bấm liên tục (Tab Tài Khoản + Làm Mới...)
var taikhoanDangTai = false;

/**
 * Hàm khởi tạo module Trang Tài Khoản, chạy khi trang tải xong.
 * Vẽ sẵn lưới avatar miễn phí, gán sự kiện, và NẾU trang vừa tải lại (F5) mà đã
 * có sẵn phiên đăng nhập (app.js khôi phục TRƯỚC khi hàm này chạy - app.js nạp
 * trước taikhoan_NC.js) thì tự tải hồ sơ ngay, không cần đợi bấm Tab.
 */
function taikhoanKhoiTao() {
  var nutTab = document.getElementById("tabTaiKhoan");
  if (nutTab) {
    nutTab.addEventListener("click", taikhoanTaiHoSo);
  }

  var nutLamMoiLichSu = document.getElementById("btnLamMoiLichSuTran");
  if (nutLamMoiLichSu) {
    nutLamMoiLichSu.addEventListener("click", taikhoanLamMoiLichSuTran);
  }

  taikhoanVeLuoiAvatarMienPhi();

  var taiKhoan = (typeof appLayTaiKhoanDangNhap === "function") ? appLayTaiKhoanDangNhap() : null;
  if (taiKhoan) {
    taikhoanTaiHoSo();
  }
}

/** Vẽ lưới các nút avatar miễn phí (chạy 1 lần lúc khởi tạo) */
function taikhoanVeLuoiAvatarMienPhi() {
  var luoi = document.getElementById("luoiAvatarMienPhi");
  if (!luoi) return;

  luoi.innerHTML = "";
  TAIKHOAN_AVATAR_MIEN_PHI.forEach(function (emoji) {
    var nut = document.createElement("button");
    nut.type = "button";
    nut.className = "nutAvatarLuaChon";
    nut.textContent = emoji;
    nut.setAttribute("data-avatar", emoji);
    nut.addEventListener("click", function () {
      taikhoanChonAvatar(emoji);
    });
    luoi.appendChild(nut);
  });
}

/**
 * Hàm tải TOÀN BỘ hồ sơ (gọi song song lay_ho_so + lay_thong_ke_doi_thu).
 * Gán sự kiện cho nút Tab "Tài Khoản" để mỗi lần bấm vào đều tải lại mới nhất.
 */
function taikhoanTaiHoSo() {
  var taiKhoan = (typeof appLayTaiKhoanDangNhap === "function") ? appLayTaiKhoanDangNhap() : null;
  if (!taiKhoan || taikhoanDangTai) return;
  taikhoanDangTai = true;

  Promise.all([
    apiLayHoSo(taiKhoan.tenDangNhap),
    apiLayThongKeDoiThu(taiKhoan.tenDangNhap)
  ]).then(function (ketQuaGop) {
    taikhoanDangTai = false;
    var phanHoiHoSo = ketQuaGop[0];
    var phanHoiThongKe = ketQuaGop[1];

    if (phanHoiHoSo && phanHoiHoSo.thanhCong && phanHoiHoSo.hoSo) {
      taikhoanVeTongQuan(phanHoiHoSo.hoSo.thongTin);
      taikhoanVeVatPhamSoHuu(phanHoiHoSo.hoSo.vatPhamSoHuu);
      taikhoanVeLichSuDoiQua(phanHoiHoSo.hoSo.lichSuDoiQua);
      taikhoanVeBangLichSuTran(phanHoiHoSo.hoSo.lichSuTran);
    }

    if (phanHoiThongKe && phanHoiThongKe.thanhCong) {
      taikhoanVeBangThongKeDoiThu(phanHoiThongKe.thongKeDoiThu);
    }
  }).catch(function () {
    taikhoanDangTai = false;
  });
}

/** Chỉ làm mới riêng bảng 50 trận gần nhất (RPC nhẹ hơn tải lại cả lay_ho_so) */
function taikhoanLamMoiLichSuTran() {
  var taiKhoan = (typeof appLayTaiKhoanDangNhap === "function") ? appLayTaiKhoanDangNhap() : null;
  if (!taiKhoan) return;

  var nut = document.getElementById("btnLamMoiLichSuTran");
  if (nut) {
    nut.disabled = true;
    nut.textContent = "🔄 Đang tải...";
  }

  apiLayLichSuTran(taiKhoan.tenDangNhap).then(function (ketQua) {
    if (nut) {
      nut.disabled = false;
      nut.textContent = "🔄 Làm Mới";
    }
    if (ketQua && ketQua.thanhCong) {
      taikhoanVeBangLichSuTran(ketQua.lichSuTran);
    }
  });
}

/**
 * Vẽ khối thông tin tổng quan: avatar lớn, tên, kim cương, EXP, level, danh
 * hiệu, hạng, và khối Thành Tích (thắng/khác đấu máy, thắng/thua/hòa 2 người).
 */
function taikhoanVeTongQuan(tt) {
  if (!tt) return;

  taikhoanGanChu("taikhoanTen", tt.tenDangNhap);
  taikhoanGanChu("taikhoanKimCuong", tt.diemSo);
  taikhoanGanChu("taikhoanExp", tt.kinhNghiem);
  taikhoanGanChu("taikhoanLevel", tt.level);
  taikhoanGanChu("taikhoanDanhHieu", tt.danhHieu);
  taikhoanGanChu("taikhoanHang", tt.hangThu);

  var oAvatar = document.getElementById("taikhoanAvatarLon");
  if (oAvatar) oAvatar.textContent = tt.avatarDaChon || "❓";
  taikhoanDanhDauAvatarDangChon(tt.avatarDaChon);

  taikhoanGanChu("ttThangMay", tt.tranMayThang);
  taikhoanGanChu("ttKhacMay", tt.tranMayKhac);
  taikhoanGanChu("tt2nThang", tt.tran2nThang);
  taikhoanGanChu("tt2nThua", tt.tran2nThua);
  taikhoanGanChu("tt2nHoa", tt.tran2nHoa);
}

/** Hàm phụ trợ: gán textContent an toàn (bỏ qua nếu phần tử/giá trị chưa có) */
function taikhoanGanChu(idPhanTu, giaTri) {
  var o = document.getElementById(idPhanTu);
  if (!o) return;
  o.textContent = (giaTri === undefined || giaTri === null) ? "0" : giaTri;
}

/** Tô viền nút avatar đang được chọn trong lưới avatar miễn phí */
function taikhoanDanhDauAvatarDangChon(avatarDaChon) {
  var dsNut = document.querySelectorAll(".nutAvatarLuaChon");
  dsNut.forEach(function (nut) {
    if (nut.getAttribute("data-avatar") === avatarDaChon) {
      nut.classList.add("nutAvatarDangChon");
    } else {
      nut.classList.remove("nutAvatarDangChon");
    }
  });
}

/** Xử lý khi trẻ bấm chọn 1 avatar miễn phí trong lưới */
function taikhoanChonAvatar(avatarMoi) {
  var taiKhoan = (typeof appLayTaiKhoanDangNhap === "function") ? appLayTaiKhoanDangNhap() : null;
  if (!taiKhoan) return;

  apiCapNhatAvatar(taiKhoan.tenDangNhap, avatarMoi).then(function (ketQua) {
    if (!ketQua || !ketQua.thanhCong) return;

    var oAvatarLon = document.getElementById("taikhoanAvatarLon");
    if (oAvatarLon) oAvatarLon.textContent = ketQua.avatarDaChon;
    taikhoanDanhDauAvatarDangChon(ketQua.avatarDaChon);

    if (typeof appCapNhatTrangBiCucBo === "function") {
      // Máy chủ cũng tự đồng bộ khóa 'avatar' trong trang_bi (xem cap_nhat_avatar
      // trong SQL) nên ghép lại cục bộ y hệt để board.js đọc đúng ngay lập tức
      var trangBiHienTai = (taiKhoan.trangBi && typeof taiKhoan.trangBi === "object") ? taiKhoan.trangBi : {};
      trangBiHienTai.avatar = ketQua.avatarDaChon;
      appCapNhatTrangBiCucBo(trangBiHienTai, ketQua.avatarDaChon);
    }
  });
}

/**
 * Vẽ danh sách vật phẩm số đã sở hữu, mỗi món 1 thẻ (hình/emoji, tên, nút
 * Trang Bị). Rỗng cho tới khi NC_06A/NC_06B hoàn thành (chưa có gì để đổi/gán).
 */
function taikhoanVeVatPhamSoHuu(danhSach) {
  var khung = document.getElementById("danhSachVatPhamSoHuu");
  if (!khung) return;
  khung.innerHTML = "";

  if (!danhSach || danhSach.length === 0) {
    khung.innerHTML = '<p class="taikhoanRong">Con chưa sở hữu vật phẩm nào. Cửa Hàng sắp ra mắt nhé! 🛍️</p>';
    return;
  }

  var taiKhoan = (typeof appLayTaiKhoanDangNhap === "function") ? appLayTaiKhoanDangNhap() : null;
  var trangBiHienTai = (taiKhoan && taiKhoan.trangBi) || {};

  danhSach.forEach(function (vatPham) {
    var the = document.createElement("div");
    the.className = "theVatPhamSoHuu";

    var oHinh = document.createElement("div");
    oHinh.className = "theVatPhamHinh";
    if (vatPham.urlHinh) {
      var anh = document.createElement("img");
      anh.src = vatPham.urlHinh;
      anh.alt = vatPham.ten || "";
      oHinh.appendChild(anh);
    } else {
      oHinh.textContent = "🎨";
    }

    var oTen = document.createElement("p");
    oTen.className = "theVatPhamTen";
    oTen.textContent = (vatPham.ten || "Vật phẩm") + " (" + taikhoanTenLoai(vatPham.loai) + ")";

    var dangTrangBi = trangBiHienTai[vatPham.loai] === vatPham.maDinhDanh;

    var nut = document.createElement("button");
    nut.type = "button";
    nut.className = dangTrangBi ? "nutDaTrangBi" : "nutTrangBi";
    nut.textContent = dangTrangBi ? "✅ Đang Dùng" : "Trang Bị";
    nut.disabled = dangTrangBi;
    nut.addEventListener("click", function () {
      taikhoanTrangBiVatPham(vatPham.loai, vatPham.maDinhDanh);
    });

    the.appendChild(oHinh);
    the.appendChild(oTen);
    the.appendChild(nut);
    khung.appendChild(the);
  });
}

/** Hàm phụ trợ: đổi mã loai (kỹ thuật) sang tên tiếng Việt dễ hiểu cho trẻ */
function taikhoanTenLoai(loai) {
  if (loai === "bo_quan_co") return "Bộ Quân Cờ";
  if (loai === "ban_co") return "Bàn Cờ";
  if (loai === "hieu_ung") return "Hiệu Ứng";
  if (loai === "avatar") return "Avatar";
  return loai || "";
}

/**
 * Xử lý khi trẻ bấm nút "Trang Bị" 1 vật phẩm số đã sở hữu (dùng CHUNG cho mọi
 * loai, kể cả loai='avatar' cao cấp).
 */
function taikhoanTrangBiVatPham(loai, maDinhDanh) {
  var taiKhoan = (typeof appLayTaiKhoanDangNhap === "function") ? appLayTaiKhoanDangNhap() : null;
  if (!taiKhoan) return;

  apiCapNhatTrangBi(taiKhoan.tenDangNhap, loai, maDinhDanh).then(function (ketQua) {
    if (!ketQua || !ketQua.thanhCong) return;

    if (typeof appCapNhatTrangBiCucBo === "function") {
      var avatarMoi = (loai === "avatar") ? maDinhDanh : undefined;
      appCapNhatTrangBiCucBo(ketQua.trangBi, avatarMoi);
    }
    // Vẽ lại toàn bộ hồ sơ để cập nhật nút "Đang Dùng" trên đúng thẻ vật phẩm
    taikhoanTaiHoSo();
  });
}

/**
 * Vẽ danh sách lịch sử đổi thưởng CỦA CHÍNH TRẺ (chỉ XEM - hành động đổi
 * thuộc Cửa Hàng, sẽ làm ở NC_06B).
 */
function taikhoanVeLichSuDoiQua(danhSach) {
  var khung = document.getElementById("danhSachLichSuDoiQua");
  if (!khung) return;
  khung.innerHTML = "";

  if (!danhSach || danhSach.length === 0) {
    khung.innerHTML = '<p class="taikhoanRong">Chưa có lịch sử đổi thưởng.</p>';
    return;
  }

  danhSach.forEach(function (dong) {
    var muc = document.createElement("div");
    muc.className = "mucLichSuDoiQua";

    var oTen = document.createElement("span");
    oTen.className = "mucLichSuDoiQuaTen";
    oTen.textContent = (dong.tenVatPham || "Vật phẩm") + " (" + dong.giaLucDoi + " 💎)";

    var oTrangThai = document.createElement("span");
    var daTrao = dong.trangThai === "da_trao";
    oTrangThai.className = "mucLichSuDoiQuaTrangThai " + (daTrao ? "daTrao" : "choTrao");
    oTrangThai.textContent = daTrao ? "✅ Đã trao" : "⏳ Chờ trao";

    muc.appendChild(oTen);
    muc.appendChild(oTrangThai);
    khung.appendChild(muc);
  });
}

/** Vẽ bảng 50 trận gần nhất (thời gian, đối thủ, chế độ, kết quả có màu) */
function taikhoanVeBangLichSuTran(danhSach) {
  var than = document.getElementById("thanBangLichSuTran");
  if (!than) return;
  than.innerHTML = "";

  if (!danhSach || danhSach.length === 0) {
    than.innerHTML = '<tr><td colspan="4" class="taikhoanODong">Chưa có trận đấu nào. Vào "Chơi Cờ" để bắt đầu nhé!</td></tr>';
    return;
  }

  danhSach.forEach(function (tran) {
    var hang = document.createElement("tr");
    hang.appendChild(taikhoanTaoO(taikhoanDinhDangThoiGian(tran.thoiGian)));
    hang.appendChild(taikhoanTaoO(tran.doiThu));
    hang.appendChild(taikhoanTaoO(tran.cheDo === "may" ? "🤖 Máy" : "👫 Người"));

    var oKetQua = document.createElement("td");
    oKetQua.textContent = taikhoanTenKetQua(tran.ketQua);
    oKetQua.className = "taikhoanKetQua-" + tran.ketQua;
    hang.appendChild(oKetQua);

    than.appendChild(hang);
  });
}

/** Vẽ bảng thống kê theo đối thủ (đối thủ, chế độ, tổng trận, thắng, thua, hòa) */
function taikhoanVeBangThongKeDoiThu(danhSach) {
  var than = document.getElementById("thanBangThongKeDoiThu");
  if (!than) return;
  than.innerHTML = "";

  if (!danhSach || danhSach.length === 0) {
    than.innerHTML = '<tr><td colspan="6" class="taikhoanODong">Con chưa chơi trận nào.</td></tr>';
    return;
  }

  danhSach.forEach(function (dt) {
    var hang = document.createElement("tr");
    hang.appendChild(taikhoanTaoO(dt.doiThu));
    hang.appendChild(taikhoanTaoO(dt.cheDo === "may" ? "🤖 Máy" : "👫 Người"));
    hang.appendChild(taikhoanTaoO(dt.tongTran));
    hang.appendChild(taikhoanTaoO(dt.thang));
    hang.appendChild(taikhoanTaoO(dt.thua));
    hang.appendChild(taikhoanTaoO(dt.hoa));
    than.appendChild(hang);
  });
}

/** Hàm phụ trợ: đổi mã kết quả sang chữ + biểu tượng màu dễ phân biệt cho trẻ */
function taikhoanTenKetQua(ketQua) {
  if (ketQua === "thang") return "🟢 Thắng";
  if (ketQua === "thua") return "🔴 Thua";
  return "🟡 Hòa";
}

/**
 * Hàm phụ trợ: định dạng chuỗi thời gian ISO trả về từ Supabase thành
 * dd/mm/yyyy hh:mm cho dễ đọc (giữ nguyên chuỗi gốc nếu không đọc được).
 */
function taikhoanDinhDangThoiGian(chuoiThoiGian) {
  if (!chuoiThoiGian) return "---";
  var ngay = new Date(chuoiThoiGian);
  if (isNaN(ngay.getTime())) return chuoiThoiGian;

  var hai = function (so) { return (so < 10 ? "0" : "") + so; };
  return hai(ngay.getDate()) + "/" + hai(ngay.getMonth() + 1) + "/" + ngay.getFullYear()
    + " " + hai(ngay.getHours()) + ":" + hai(ngay.getMinutes());
}

/** Hàm phụ trợ: tạo 1 ô <td> với nội dung văn bản cho sẵn (an toàn, dùng textContent) */
function taikhoanTaoO(noiDung) {
  var o = document.createElement("td");
  o.textContent = (noiDung === undefined || noiDung === null) ? "" : noiDung;
  return o;
}

// Chạy hàm khởi tạo ngay khi toàn bộ HTML đã được dựng xong
document.addEventListener("DOMContentLoaded", taikhoanKhoiTao);
