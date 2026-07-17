// ================================================================
// FILE: kc_ytuong.js
// CHỨC NĂNG: Module DÙNG CHUNG xử lý khu vực "Gửi Ý Tưởng" cho CẢ 3 trang
//            Kids Challenge (Học Tập, Khám Phá, Thử Thách). Bản RIÊNG của
//            Kids Challenge - KHÔNG mượn ytuong_NC.js của Cờ Vua nữa (kiến
//            trúc HƯỚNG DẪN mục 2 + 3.5). Đọc cấu trúc HTML một cách TỔNG
//            QUÁT theo data-chuyen-muc (mẫu hình Sổ Tay D5) nên 1 trang có
//            thể đặt nhiều khối cùng lúc (Khám Phá: kham_pha + tro_choi).
// BƯỚC: KC_00
// NGÀY: 17/07/2026
// QUY ƯỚC TÊN: tất cả hàm/biến bắt đầu "kcyt" để không đụng kc_auth.js
//   (dùng tiền tố "kc") khi cả 2 file cùng nạp trên 1 trang.
//
// PHỤ THUỘC: kc_config.js, kc_api.js, kc_auth.js phải nạp TRƯỚC file này.
//   Module này KHÔNG tự đọc sessionStorage - chờ sự kiện "kcSanSang" do
//   kc_auth.js bắn ra (xem hợp đồng ở đầu file kc_auth.js).
//
// CÁCH DÙNG TỪ FILE HTML: giống hệt ytuong_NC.js gốc, mỗi khối:
//   <div class="kcytKhoiYTuong" data-chuyen-muc="hoc_tap">
//     <textarea class="kcytO"></textarea>
//     <span class="kcytSoKyTuConLai"></span>
//     <button class="kcytNutGui" type="button"></button>
//     <div class="kcytThongBaoKhoi"></div>
//     <div class="kcytDanhSachRong"></div>
//     <ul class="kcytDanhSach"></ul>
//   </div>
//
// CÁC RPC SỬ DỤNG (Cờ Vua có sẵn, gọi lại NGUYÊN TRẠNG - Sổ Tay mục A3):
//   lay_cau_hinh (đọc khóa y_tuong_do_dai_toi_da - CHƯA cần viết kc_lay_cau_hinh
//     riêng ở bước này, theo khảo sát Hướng Dẫn 1.11(b): dùng lại được thì
//     không tạo mới; sẽ cân nhắc lại khi KC cần đọc nhiều khóa kc_ thường xuyên).
//   gui_y_tuong(p_ten, p_chuyen_muc, p_noi_dung) - chuyên mục 'thu_thach'
//     dùng được từ bước KC_00 nhờ điểm chạm WHITELIST số 1 (xem SQL
//     supabase_kc00_chuyen_muc_y_tuong.sql).
//   lay_y_tuong_cua_toi(p_ten)
// ================================================================

var KCYT_DO_DAI_MAC_DINH = 500; // khớp mặc định của khóa y_tuong_do_dai_toi_da

var kcytCacKhoi = [];
var kcytDoDaiToiDa = KCYT_DO_DAI_MAC_DINH;
var kcytDangGui = {};

// ================================================================
// PHẦN 1: KHỞI ĐỘNG - chờ kc_auth.js xác nhận trạng thái đăng nhập
// ================================================================

document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("kcSanSang", function (su) {
    if (!su.detail || !su.detail.daDangNhap) return; // chưa đăng nhập: kc_auth.js đã tự ẩn khối này
    kcytKhoiTao();
  });
});

function kcytKhoiTao() {
  kcytCacKhoi = Array.prototype.slice.call(document.querySelectorAll(".kcytKhoiYTuong"));
  if (!kcytCacKhoi.length) return; // trang không có khối ý tưởng nào

  kcytTaiCauHinh();
  kcytCacKhoi.forEach(kcytGanSuKienKhoi);
  kcytTaiDanhSachYTuong();
}

// ================================================================
// PHẦN 2: CẤU HÌNH (giới hạn độ dài ý tưởng)
// ================================================================

function kcytTaiCauHinh() {
  kcGoiRpc("lay_cau_hinh", {}).then(function (kq) {
    if (kq && kq.thanhCong && kq.cauHinhChung) {
      var so = parseInt(kq.cauHinhChung.y_tuong_do_dai_toi_da, 10);
      if (!isNaN(so) && so > 0) kcytDoDaiToiDa = so;
    }
    kcytCacKhoi.forEach(function (khoi) {
      var oTextarea = khoi.querySelector(".kcytO");
      if (oTextarea) oTextarea.setAttribute("maxlength", String(kcytDoDaiToiDa));
      kcytCapNhatDemKyTu(khoi);
    });
  });
}

// ================================================================
// PHẦN 3: GẮN SỰ KIỆN CHO TỪNG KHỐI
// ================================================================

function kcytGanSuKienKhoi(khoi) {
  var oTextarea = khoi.querySelector(".kcytO");
  var oNut = khoi.querySelector(".kcytNutGui");

  if (oTextarea) {
    oTextarea.setAttribute("maxlength", String(kcytDoDaiToiDa));
    oTextarea.addEventListener("input", function () { kcytCapNhatDemKyTu(khoi); });
  }
  if (oNut) {
    oNut.addEventListener("click", function () { kcytGuiYTuong(khoi); });
  }
  kcytCapNhatDemKyTu(khoi);
}

function kcytCapNhatDemKyTu(khoi) {
  var oTextarea = khoi.querySelector(".kcytO");
  var oDem = khoi.querySelector(".kcytSoKyTuConLai");
  if (!oTextarea || !oDem) return;
  var conLai = kcytDoDaiToiDa - oTextarea.value.length;
  oDem.textContent = conLai >= 0 ? conLai : 0;
  oDem.classList.toggle("kcytHetKyTu", conLai <= 0);
}

// ================================================================
// PHẦN 4: GỬI Ý TƯỞNG
// ================================================================

function kcytGuiYTuong(khoi) {
  var chuyenMuc = khoi.getAttribute("data-chuyen-muc");
  if (!chuyenMuc || !kcTaiKhoanHienTai) return;
  if (kcytDangGui[chuyenMuc]) return;

  var oTextarea = khoi.querySelector(".kcytO");
  var noiDung = oTextarea ? oTextarea.value.trim() : "";

  if (!noiDung) {
    kcytHienThongBaoKhoi(khoi, "Con hãy viết ý tưởng trước khi gửi nhé!", "xau");
    return;
  }

  kcytDangGui[chuyenMuc] = true;
  var oNut = khoi.querySelector(".kcytNutGui");
  if (oNut) oNut.disabled = true;
  kcytHienThongBaoKhoi(khoi, "Đang gửi...", "tot");

  kcGoiRpc("gui_y_tuong", {
    p_ten: kcTaiKhoanHienTai.tenDangNhap,
    p_chuyen_muc: chuyenMuc,
    p_noi_dung: noiDung
  }).then(function (kq) {
    kcytDangGui[chuyenMuc] = false;
    if (oNut) oNut.disabled = false;
    kq = kq || {};

    if (!kq.thanhCong) {
      kcytHienThongBaoKhoi(khoi, kcytDichLoi(kq.thongBao), "xau");
      return;
    }

    if (oTextarea) oTextarea.value = "";
    kcytCapNhatDemKyTu(khoi);
    kcytHienThongBaoKhoi(khoi, "🎉 Đã gửi ý tưởng, cảm ơn con!", "tot");
    kcytTaiDanhSachYTuong();
  });
}

/** Đổi thông báo lỗi (không dấu, từ máy chủ) sang câu thân thiện có dấu cho trẻ */
function kcytDichLoi(thongBao) {
  var s = (thongBao || "").toLowerCase();
  if (s.indexOf("vui long nhap noi dung") >= 0) return "Con hãy viết ý tưởng trước khi gửi nhé!";
  if (s.indexOf("dai qua") >= 0) return "Ý tưởng dài quá, con viết ngắn lại giúp cô nhé!";
  if (s.indexOf("chuyen muc phai la") >= 0) return "Có lỗi nhỏ ở trang này, con thử tải lại trang nhé.";
  if (s.indexOf("khong tim thay tai khoan") >= 0) return "Phiên đăng nhập có vấn đề, con đăng nhập lại giúp nhé.";
  return thongBao || "Gửi ý tưởng chưa được, con thử lại nhé.";
}

// ================================================================
// PHẦN 5: DANH SÁCH Ý TƯỞNG ĐÃ GỬI
// ================================================================

function kcytTaiDanhSachYTuong() {
  if (!kcTaiKhoanHienTai) return;
  kcGoiRpc("lay_y_tuong_cua_toi", { p_ten: kcTaiKhoanHienTai.tenDangNhap }).then(function (kq) {
    var toanBo = (kq && kq.thanhCong) ? (kq.danhSachYTuong || []) : [];
    kcytCacKhoi.forEach(function (khoi) {
      var chuyenMuc = khoi.getAttribute("data-chuyen-muc");
      var dsLoc = toanBo.filter(function (mucYTuong) { return mucYTuong.chuyenMuc === chuyenMuc; });
      kcytVeDanhSachTrongKhoi(khoi, dsLoc);
    });
  });
}

function kcytVeDanhSachTrongKhoi(khoi, danhSach) {
  var oRong = khoi.querySelector(".kcytDanhSachRong");
  var oDs = khoi.querySelector(".kcytDanhSach");
  if (!oDs) return;
  oDs.innerHTML = "";

  if (!danhSach.length) {
    if (oRong) oRong.style.display = "block";
    return;
  }
  if (oRong) oRong.style.display = "none";

  danhSach.forEach(function (mucYTuong) {
    var dong = document.createElement("li");
    dong.className = "kcytDong";

    var noiDung = document.createElement("p");
    noiDung.className = "kcytDongNoiDung";
    noiDung.textContent = mucYTuong.noiDung;
    dong.appendChild(noiDung);

    var meta = document.createElement("div");
    meta.className = "kcytDongMeta";

    var thoiGian = document.createElement("span");
    thoiGian.className = "kcytDongThoiGian";
    thoiGian.textContent = kcytDinhDangThoiGian(mucYTuong.ngayGui);
    meta.appendChild(thoiGian);

    var trangThai = document.createElement("span");
    var daXem = (mucYTuong.trangThai === "da_xem");
    trangThai.className = "kcytNhanTrangThai " + (daXem ? "kcytNhanDaXem" : "kcytNhanMoi");
    trangThai.textContent = daXem ? "Cô đã xem ✓" : "Đang chờ cô xem";
    meta.appendChild(trangThai);

    dong.appendChild(meta);
    oDs.appendChild(dong);
  });
}

// ================================================================
// PHẦN 6: TIỆN ÍCH
// ================================================================

function kcytHienThongBaoKhoi(khoi, text, loai) {
  var o = khoi.querySelector(".kcytThongBaoKhoi");
  if (!o) return;
  o.textContent = text;
  o.className = "kcytThongBaoKhoi hien " + (loai === "xau" ? "xau" : "tot");
  if (khoi._kcytHenToast) clearTimeout(khoi._kcytHenToast);
  khoi._kcytHenToast = setTimeout(function () {
    o.className = "kcytThongBaoKhoi";
  }, 4000);
}

/** Định dạng chuỗi thời gian ISO trả về từ Supabase thành dd/mm/yyyy hh:mm */
function kcytDinhDangThoiGian(chuoiThoiGian) {
  if (!chuoiThoiGian) return "---";
  var ngay = new Date(chuoiThoiGian);
  if (isNaN(ngay.getTime())) return chuoiThoiGian;
  var hai = function (so) { return (so < 10 ? "0" : "") + so; };
  return hai(ngay.getDate()) + "/" + hai(ngay.getMonth() + 1) + "/" + ngay.getFullYear()
    + " " + hai(ngay.getHours()) + ":" + hai(ngay.getMinutes());
}
