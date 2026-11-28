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
// CẬP NHẬT: KC_12C2 (28/11/2026) - gửi + xem ý tưởng qua HÒM THƯ CHUNG: mỗi ý tưởng là một thư 💡; danh sách ghi
//   ⏳ Cô Cú đang xem / 📬 Có tin mới / ✅ Đã xong, chạm vào mở thư (homthu_NC.html#thu-<id>) đọc lời Cô Cú.
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
// CÁC RPC SỬ DỤNG:
//   lay_cau_hinh (Cờ Vua, chỉ đọc khóa y_tuong_do_dai_toi_da)
//   kc_thu_gui_y_tuong(p_ten, p_ma_phien, p_chuyen_muc, p_noi_dung) (SQL kc12b): kiểm phiên, lọc chữ, giới hạn mỗi ngày,
//     vẫn ghi bảng y_tuong của Cờ Vua qua gui_y_tuong, rồi mở thư 💡
//   kc_thu_ds(p_ten, p_ma_phien, p_loc, p_truoc_luc, p_truoc_id): trang tự lọc lấy thư y_tuong đúng chuyên mục.
//     Ý tưởng bé đã xoá khỏi hòm thư thì không còn trong danh sách.
// ================================================================

var KCYT_DO_DAI_MAC_DINH = 500; // khớp mặc định của khóa y_tuong_do_dai_toi_da
var KCYT_SO_DONG = 5;           // số ý tưởng mới nhất hiện trong mỗi khung (cũ hơn xem ở Hòm thư)
var KCYT_SO_TRANG = 5;          // đọc tối đa 5 trang x 20 thư để tìm ý tưởng

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

  kcGoiRpc("kc_thu_gui_y_tuong", {
    p_ten: kcTaiKhoanHienTai.tenDangNhap,
    p_ma_phien: kcTaiKhoanHienTai.maPhien || "",
    p_chuyen_muc: chuyenMuc,
    p_noi_dung: noiDung
  }).then(function (kq) {
    kcytDangGui[chuyenMuc] = false;
    if (oNut) oNut.disabled = false;
    kq = kq || {};

    if (!kq.thanhCong) {
      kcytHienThongBaoKhoi(khoi, kcytDichLoi(kq), "xau");
      return;
    }

    if (oTextarea) oTextarea.value = "";
    kcytCapNhatDemKyTu(khoi);
    kcytHienThongBaoKhoi(khoi, "🎉 Cô Cú nhận được ý tưởng rồi, cảm ơn con!", "tot");
    kcytTaiDanhSachYTuong();
    if (typeof window.kcCapNhatHomThu === "function") window.kcCapNhatHomThu();
  });
}

/** Đổi lỗi máy chủ (mã `ma` của kc_thu_gui_y_tuong, hoặc thông báo không dấu của Cờ Vua) sang câu cho trẻ */
function kcytDichLoi(kq) {
  if (kq.ma === "loc") return "🦉 Con viết lại bằng lời khác nhé.";
  if (kq.ma === "qua_ngay") return "Hôm nay con gửi đủ " + (kq.toiDa || "") + " lời rồi, mai con gửi tiếp nhé!";
  if (kq.ma === "tat") return "Hòm thư đang tạm nghỉ, con gửi sau nhé.";
  if (kq.ma === "trong") return "Con hãy viết ý tưởng trước khi gửi nhé!";
  if (kq.ma === "dang_nhap") return "Phiên đăng nhập có vấn đề, con đăng nhập lại giúp nhé.";
  var thongBao = kq.thongBao || "";
  var s = thongBao.toLowerCase();
  if (s.indexOf("vui long nhap noi dung") >= 0) return "Con hãy viết ý tưởng trước khi gửi nhé!";
  if (s.indexOf("dai qua") >= 0) return "Ý tưởng dài quá, con viết ngắn lại giúp Cô Cú nhé!";
  if (s.indexOf("chuyen muc phai la") >= 0) return "Có lỗi nhỏ ở trang này, con thử tải lại trang nhé.";
  if (s.indexOf("khong tim thay tai khoan") >= 0) return "Phiên đăng nhập có vấn đề, con đăng nhập lại giúp nhé.";
  return thongBao || "Gửi ý tưởng chưa được, con thử lại nhé.";
}

// ================================================================
// PHẦN 5: DANH SÁCH Ý TƯỞNG ĐÃ GỬI (thư 💡 trong Hòm thư)
// ================================================================

function kcytTaiDanhSachYTuong() {
  if (!kcTaiKhoanHienTai) return;
  var gom = [];
  function trang(so, tiep) {
    var ts = { p_ten: kcTaiKhoanHienTai.tenDangNhap, p_ma_phien: kcTaiKhoanHienTai.maPhien || "", p_loc: "tat_ca" };
    if (tiep) { ts.p_truoc_luc = tiep.luc; ts.p_truoc_id = tiep.id; }
    kcGoiRpc("kc_thu_ds", ts).then(function (kq) {
      if (!kq || !kq.thanhCong) return; // mất mạng: giữ danh sách đang hiện
      gom = gom.concat((kq.ds || []).filter(function (t) { return t.loai === "y_tuong" && t.vai === "gui"; }));
      var du = kcytCacKhoi.every(function (khoi) { return kcytLocKhoi(gom, khoi).length > KCYT_SO_DONG; });
      if (kq.tiep && !du && so < KCYT_SO_TRANG) { trang(so + 1, kq.tiep); return; }
      kcytCacKhoi.forEach(function (khoi) { kcytVeDanhSachTrongKhoi(khoi, kcytLocKhoi(gom, khoi)); });
    });
  }
  trang(1, null);
}

/** Ý tưởng của đúng chuyên mục, mới gửi trước */
function kcytLocKhoi(ds, khoi) {
  var chuyenMuc = khoi.getAttribute("data-chuyen-muc");
  return ds.filter(function (t) { return t.duLieu && t.duLieu.chuyenMuc === chuyenMuc; })
    .sort(function (a, b) { return String(b.tao).localeCompare(String(a.tao)); });
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

  danhSach.slice(0, KCYT_SO_DONG).forEach(function (thu) {
    var dong = document.createElement("li");
    var lienKet = document.createElement("a");
    lienKet.className = "kcytDong kcytDongLienKet";
    lienKet.href = "homthu_NC.html#thu-" + thu.id;

    var noiDung = document.createElement("p");
    noiDung.className = "kcytDongNoiDung";
    // tiêu đề thư = 80 ký tự đầu của ý tưởng; chạm vào đọc đủ
    noiDung.textContent = thu.tieuDe + (String(thu.tieuDe).length >= 80 ? "…" : "");
    lienKet.appendChild(noiDung);

    var meta = document.createElement("div");
    meta.className = "kcytDongMeta";

    var thoiGian = document.createElement("span");
    thoiGian.className = "kcytDongThoiGian";
    thoiGian.textContent = kcytDinhDangThoiGian(thu.tao);
    meta.appendChild(thoiGian);

    var nhan = thu.chuaDoc ? ["kcytNhanMoi", "📬 Có tin mới ›"]
      : thu.trangThai === "mo" ? ["kcytNhanMoi", "⏳ Cô Cú đang xem ›"]
      : ["kcytNhanDaXem", "✅ Đã xong ›"];
    var trangThai = document.createElement("span");
    trangThai.className = "kcytNhanTrangThai " + nhan[0];
    trangThai.textContent = nhan[1];
    meta.appendChild(trangThai);

    lienKet.appendChild(meta);
    dong.appendChild(lienKet);
    oDs.appendChild(dong);
  });

  if (danhSach.length > KCYT_SO_DONG) {
    var them = document.createElement("li");
    var xemThem = document.createElement("a");
    xemThem.className = "kcytXemThem";
    xemThem.href = "homthu_NC.html";
    xemThem.textContent = "Xem thư cũ hơn trong 📬 Hòm thư ›";
    them.appendChild(xemThem);
    oDs.appendChild(them);
  }
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
// 28/11/2026 - BƯỚC: KC_12C2 (gửi + xem ý tưởng qua Hòm thư chung)
