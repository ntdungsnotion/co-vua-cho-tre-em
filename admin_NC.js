// ================================
// FILE: admin_NC.js
// CHUC NANG: Toan bo logic cua Trang Quan Tri (admin_NC.html)
//   7 man hinh: Vat Pham | Doi Thuong | Y Tuong | Cau Hinh Chung |
//               Cap Do May | Loi Dong Vien | Giong Doc
// BUOC: NC_06A - NGAY: 10/07/2026 14:00
//
// PHU THUOC (nap theo thu tu nay trong admin_NC.html):
//   config.js  -> bien toan cuc supabaseClient
//   api.js     -> ham apiGoiRpc(tenHam, thamSo) dung chung
//   admin_NC.js (file nay)
//
// TAI SAO KHONG THEM HAM VAO api.js:
//   Cac RPC quan tri CHI dung o trang nay. Theo nguyen tac "gom viec theo file"
//   (HUONG DAN muc 7), giu chung trong admin_NC.js de khong phai mo lai api.js.
//   Van dung lai apiGoiRpc() nen cach bao loi mang/loi may chu giong het cac trang khac.
//
// XAC THUC:
//   Doc sessionStorage "coVuaTaiKhoanDangNhap" (do app.js ghi luc dang nhap).
//   Phai co vaiTro === 'admin' va maPhien. Admin KHONG dang nhap lan 2.
//   Moi RPC van tu kiem tra quyen o phia may chu (kiem_tra_admin) - kiem tra
//   phia trinh duyet chi de hien giao dien cho dep, KHONG phai lop bao mat.
//
// LUU Y KY THUAT:
//   - Bang du lieu ve bang innerHTML roi gan su kien bang addEventListener theo
//     thuoc tinh data-id (KHONG dung onclick trong chuoi HTML - de vo khi ten
//     vat pham co dau nhay).
//   - Moi gia tri hien thi deu qua adminThoat() de chong loi hien thi / chen HTML.
// ================================

// ---------------- HANG SO & BIEN TOAN CUC ----------------

var ADMIN_KHOA_PHIEN = "coVuaTaiKhoanDangNhap";   // PHAI trung APP_KHOA_LUU_PHIEN trong app.js
var ADMIN_BUCKET_HINH = "hinh-vat-pham";          // Bucket Supabase Storage (cong khai)

var adminTaiKhoan = null;      // { tenDangNhap, maPhien, vaiTro, ... }
var adminDsVatPham = [];       // Cache danh sach vat pham
var adminDsLoiDongVien = [];   // Cache danh sach cau noi
var adminDsCapDo = [];         // Cache 20 dong cap do
var adminCapDoDaSua = {};      // { capDo: true } - danh dau dong da sua de "Luu tat ca"
var adminDanhSachGiong = [];   // speechSynthesis.getVoices()

// 6 quan co (dung cho tro ly nhap bo quan co bang anh)
var ADMIN_QUAN_CO = [
  { ma: "k", ten: "Vua",   emojiMau: "♚" },
  { ma: "q", ten: "Hậu",   emojiMau: "♛" },
  { ma: "r", ten: "Xe",    emojiMau: "♜" },
  { ma: "b", ten: "Tượng", emojiMau: "♝" },
  { ma: "n", ten: "Mã",    emojiMau: "♞" },
  { ma: "p", ten: "Tốt",   emojiMau: "♟" }
];

// 12 ma tinh huong (HUONG DAN 4.8) + 2 ma cu con dung trong chuoi du phong.
// PHAI khop danh sach trang trong ham SQL admin_luu_loi_dong_vien.
var ADMIN_TINH_HUONG = [
  { ma: "chao_hoi",    ten: "chao_hoi — Chào hỏi / bấm Nghe thử" },
  { ma: "bat_dau_van", ten: "bat_dau_van — Bắt đầu ván mới" },
  { ma: "nuoc_thuong", ten: "nuoc_thuong — Trẻ đi nước bình thường" },
  { ma: "an_quan",     ten: "an_quan — Trẻ ĂN quân của máy" },
  { ma: "chieu_tuong", ten: "chieu_tuong — Trẻ chiếu tướng máy" },
  { ma: "nhap_thanh",  ten: "nhap_thanh — Trẻ nhập thành" },
  { ma: "phong_cap",   ten: "phong_cap — Trẻ phong cấp" },
  { ma: "bi_an_quan",  ten: "bi_an_quan — Trẻ BỊ ăn quân (động viên)" },
  { ma: "bi_chieu",    ten: "bi_chieu — Trẻ BỊ chiếu (cảnh báo nhẹ)" },
  { ma: "hoi_goi_y",   ten: "hoi_goi_y — Hỏi khi trẻ lâu không đi" },
  { ma: "thang_van",   ten: "thang_van — Trẻ thắng ván" },
  { ma: "thua_van",    ten: "thua_van — Trẻ thua ván" },
  { ma: "hoa_van",     ten: "hoa_van — Ván hòa" },
  { ma: "len_cap",     ten: "len_cap — Trẻ lên cấp" },
  { ma: "moi_nuoc",    ten: "moi_nuoc — (mã cũ) mọi nước đi" },
  { ma: "nuoc_tot",    ten: "nuoc_tot — (mã cũ) nước đi tốt" }
];


// ================================================================
// PHAN 1: TIEN ICH DUNG CHUNG
// ================================================================

/** Lay 1 the theo id (viet tat cho gon) */
function adminEl(id) {
  return document.getElementById(id);
}

/** Chong loi hien thi khi du lieu co ky tu dac biet (<, >, &, ") */
function adminThoat(giaTri) {
  if (giaTri === null || giaTri === undefined) return "";
  return String(giaTri)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Hien thong bao mau xanh (thanh cong) hoac mau do (that bai), tu an sau 5 giay */
var adminHenGioAnThongBao = null;
function adminBaoTin(noiDung, laThanhCong) {
  var o = adminEl("adminThongBao");
  o.textContent = noiDung;
  o.className = "adminThongBao hien " + (laThanhCong ? "thanhCong" : "thatBai");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (adminHenGioAnThongBao) clearTimeout(adminHenGioAnThongBao);
  adminHenGioAnThongBao = setTimeout(function () {
    o.className = "adminThongBao";
  }, 5000);
}

/** Doi chuoi thoi gian ISO cua Postgres thanh dd/mm/yyyy hh:mm */
function adminDinhDangGio(chuoiIso) {
  if (!chuoiIso) return "—";
  var d = new Date(chuoiIso);
  if (isNaN(d.getTime())) return "—";
  function hai(n) { return (n < 10 ? "0" : "") + n; }
  return hai(d.getDate()) + "/" + hai(d.getMonth() + 1) + "/" + d.getFullYear() +
         " " + hai(d.getHours()) + ":" + hai(d.getMinutes());
}

/** Doc so tu o input; tra ve null neu o trong (dung cho cot cho phep null) */
function adminSoHoacNull(chuoi) {
  if (chuoi === null || chuoi === undefined) return null;
  var s = String(chuoi).trim();
  if (s.length === 0) return null;
  var n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

/**
 * Goi 1 RPC quan tri: tu chen p_ten_admin + p_ma_phien_admin.
 * Tra ve Promise chua ket qua JSON (giong het cac api* trong api.js).
 */
function adminGoiRpc(tenHam, thamSo) {
  var day = thamSo || {};
  day.p_ten_admin = adminTaiKhoan.tenDangNhap;
  day.p_ma_phien_admin = adminTaiKhoan.maPhien;
  return apiGoiRpc(tenHam, day);
}

/**
 * Xu ly chung khi RPC quan tri tra ve that bai.
 * Neu la loi phien het han -> nhac dang nhap lai (ma_phien doi moi lan dang nhap).
 */
function adminXuLyLoi(phanHoi) {
  var tin = (phanHoi && phanHoi.thongBao) ? phanHoi.thongBao : "Có lỗi không rõ nguyên nhân";
  adminBaoTin("❌ " + tin, false);
}

/**
 * Tai 1 file len bucket 'hinh-vat-pham' cua Supabase Storage.
 * thuMuc: 'vat-pham' | 'quan-co' | 'am-thanh'
 * Tra ve Promise chua URL cong khai cua file.
 * GHI CHU: bucket dat cong khai + cho phep khoa anon ghi (danh doi da chot o
 * NC_00 voi quy mo ~3 nguoi choi). Ten file gan them dau thoi gian de khong de len nhau.
 */
function adminTaiFileLen(file, thuMuc) {
  var tenSach = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  var duongDan = thuMuc + "/" + Date.now() + "_" + tenSach;

  return supabaseClient.storage
    .from(ADMIN_BUCKET_HINH)
    .upload(duongDan, file, { upsert: true, cacheControl: "3600" })
    .then(function (ketQua) {
      if (ketQua.error) throw new Error(ketQua.error.message);
      var cong = supabaseClient.storage.from(ADMIN_BUCKET_HINH).getPublicUrl(duongDan);
      return cong.data.publicUrl;
    });
}

/** Kiem tra 1 chuoi co phai duong dan anh khong (giong het quy tac cua board.js) */
function adminLaDuongDanAnh(giaTri) {
  if (!giaTri) return false;
  var s = String(giaTri);
  return s.indexOf("http") === 0 || s.indexOf("/") >= 0;
}


// ================================================================
// PHAN 2: KHOI TAO + XAC THUC
// ================================================================

document.addEventListener("DOMContentLoaded", function () {
  adminKhoiTao();
});

function adminKhoiTao() {
  // --- Doc phien dang nhap ---
  var phien = null;
  try {
    var chuoi = sessionStorage.getItem(ADMIN_KHOA_PHIEN);
    if (chuoi) phien = JSON.parse(chuoi);
  } catch (loi) {
    phien = null;
  }

  if (!phien || !phien.tenDangNhap) {
    adminChan("Bạn chưa đăng nhập. Hãy về trang chính, đăng nhập bằng tài khoản quản trị rồi quay lại đây.");
    return;
  }
  if (phien.vaiTro !== "admin") {
    adminChan("Tài khoản \"" + phien.tenDangNhap + "\" không phải tài khoản quản trị.");
    return;
  }
  if (!phien.maPhien) {
    adminChan("Phiên đăng nhập không hợp lệ. Hãy về trang chính, đăng xuất rồi đăng nhập lại.");
    return;
  }

  adminTaiKhoan = phien;
  adminEl("adminTenHienThi").textContent = "👋 " + phien.tenDangNhap;
  adminEl("adminNoiDung").style.display = "block";

  // --- Gan su kien chuyen man hinh ---
  var cacNut = document.querySelectorAll(".adminNutManHinh");
  for (var i = 0; i < cacNut.length; i++) {
    cacNut[i].addEventListener("click", function () {
      adminChuyenManHinh(this.getAttribute("data-manhinh"), this);
    });
  }

  // --- Dung cac man hinh ---
  adminDungManHinhVatPham();
  adminDungManHinhDoiThuong();
  adminDungManHinhYTuong();
  adminDungManHinhCauHinhChung();
  adminDungManHinhCapDo();
  adminDungManHinhLoiDongVien();
  adminDungManHinhGiongDoc();

  // --- Tai du lieu cho man hinh dau tien; cac man hinh khac tai khi bam vao ---
  adminTaiVatPham();
}

/** Hien khoi chan quyen, an toan bo noi dung quan tri */
function adminChan(lyDo) {
  adminEl("adminChanQuyen").style.display = "block";
  adminEl("adminLyDoChan").textContent = lyDo;
  adminEl("adminNoiDung").style.display = "none";
}

/** Chuyen man hinh + tai du lieu lan dau (lazy load cho nhe) */
var adminDaTai = {};
function adminChuyenManHinh(ten, nutBam) {
  var cacNut = document.querySelectorAll(".adminNutManHinh");
  for (var i = 0; i < cacNut.length; i++) cacNut[i].classList.remove("dangChon");
  nutBam.classList.add("dangChon");

  var cacManHinh = document.querySelectorAll(".adminManHinh");
  for (var j = 0; j < cacManHinh.length; j++) cacManHinh[j].classList.remove("dangHien");
  adminEl("manhinh-" + ten).classList.add("dangHien");

  if (adminDaTai[ten]) return;
  adminDaTai[ten] = true;

  if (ten === "doithuong")    adminTaiDoiThuong();
  if (ten === "ytuong")       adminTaiYTuong();
  if (ten === "cauhinhchung") adminTaiCauHinhChung();
  if (ten === "capdo")        adminTaiCapDo();
  if (ten === "loidongvien")  adminTaiLoiDongVien();
  if (ten === "giongdoc")     adminTaiGiongDoc();
}


// ================================================================
// PHAN 3: MAN HINH "VAT PHAM"
// ================================================================

function adminDungManHinhVatPham() {
  // Ve 6 o nhap quan co
  var luoi = adminEl("vpLuoiQuan");
  var html = "";
  for (var i = 0; i < ADMIN_QUAN_CO.length; i++) {
    var q = ADMIN_QUAN_CO[i];
    html +=
      '<div class="adminOAnhQuan">' +
        '<span class="adminNhanQuan">' + q.emojiMau + " " + adminThoat(q.ten) + "</span>" +
        '<div class="adminXemTruocQuan" id="vpXemTruocQuan_' + q.ma + '">—</div>' +
        '<input type="text" id="vpQuan_' + q.ma + '" placeholder="emoji hoặc link">' +
        '<input type="file" id="vpFileQuan_' + q.ma + '" accept="image/*" style="font-size:0.75rem;">' +
      "</div>";
  }
  luoi.innerHTML = html;

  // Gan su kien cho 6 o
  ADMIN_QUAN_CO.forEach(function (q) {
    adminEl("vpQuan_" + q.ma).addEventListener("input", function () {
      adminVeXemTruocQuan(q.ma);
    });
    adminEl("vpFileQuan_" + q.ma).addEventListener("change", function () {
      var file = this.files[0];
      if (!file) return;
      adminBaoTin("⏳ Đang tải ảnh quân " + q.ten + " lên...", true);
      adminTaiFileLen(file, "quan-co")
        .then(function (url) {
          adminEl("vpQuan_" + q.ma).value = url;
          adminVeXemTruocQuan(q.ma);
          adminBaoTin("✅ Đã tải ảnh quân " + q.ten + " lên. Nhớ bấm \"Ghi vào ô Dữ liệu\".", true);
        })
        .catch(function (loi) {
          adminBaoTin("❌ Không tải được ảnh: " + loi.message, false);
        });
    });
  });

  adminEl("vpLoai").addEventListener("change", adminCapNhatTroLyTheoLoai);
  adminEl("btnVpGhiJsonQuan").addEventListener("click", adminGhiJsonBoQuan);
  adminEl("btnVpDocJsonQuan").addEventListener("click", adminDocJsonBoQuan);
  adminEl("btnVpGhiJsonBanCo").addEventListener("click", adminGhiJsonBanCo);
  adminEl("btnVpLuu").addEventListener("click", adminLuuVatPham);
  adminEl("btnVpLamMoiForm").addEventListener("click", adminXoaFormVatPham);

  adminEl("vpUrlHinh").addEventListener("input", adminVeXemTruocHinhChinh);
  adminEl("vpFileHinh").addEventListener("change", function () {
    var file = this.files[0];
    if (!file) return;
    adminBaoTin("⏳ Đang tải ảnh minh họa lên...", true);
    adminTaiFileLen(file, "vat-pham")
      .then(function (url) {
        adminEl("vpUrlHinh").value = url;
        adminVeXemTruocHinhChinh();
        adminBaoTin("✅ Đã tải ảnh minh họa lên.", true);
      })
      .catch(function (loi) {
        adminBaoTin("❌ Không tải được ảnh: " + loi.message, false);
      });
  });

  adminCapNhatTroLyTheoLoai();
}

/** Hien tro ly nhap phu hop voi loai vat pham dang chon */
function adminCapNhatTroLyTheoLoai() {
  var loai = adminEl("vpLoai").value;
  adminEl("vpTroLyBoQuan").style.display = (loai === "bo_quan_co") ? "block" : "none";
  adminEl("vpTroLyBanCo").style.display  = (loai === "ban_co")     ? "block" : "none";
}

function adminVeXemTruocHinhChinh() {
  var url = adminEl("vpUrlHinh").value.trim();
  var anh = adminEl("vpXemTruocHinh");
  if (url) {
    anh.src = url;
    anh.style.display = "inline-block";
  } else {
    anh.style.display = "none";
  }
}

/** Ve o xem truoc cua 1 quan: la link thi ve anh, la emoji thi ve chu */
function adminVeXemTruocQuan(maQuan) {
  var giaTri = adminEl("vpQuan_" + maQuan).value.trim();
  var o = adminEl("vpXemTruocQuan_" + maQuan);
  if (!giaTri) {
    o.textContent = "—";
  } else if (adminLaDuongDanAnh(giaTri)) {
    o.innerHTML = '<img class="adminAnhXemTruoc" style="max-width:36px;max-height:36px;" src="' + adminThoat(giaTri) + '" alt="">';
  } else {
    o.textContent = giaTri;
  }
}

/** Gom 6 o quan thanh JSON, ghi vao o Du lieu */
function adminGhiJsonBoQuan() {
  var obj = {};
  var thieu = [];
  ADMIN_QUAN_CO.forEach(function (q) {
    var v = adminEl("vpQuan_" + q.ma).value.trim();
    if (v) obj[q.ma] = v; else thieu.push(q.ten);
  });

  adminEl("vpDuLieu").value = JSON.stringify(obj);

  if (thieu.length > 0) {
    adminBaoTin("⚠️ Đã ghi, nhưng còn thiếu quân: " + thieu.join(", ") +
                ". Quân thiếu sẽ dùng hình mặc định.", false);
  } else {
    adminBaoTin("✅ Đã ghi đủ 6 quân vào ô Dữ liệu.", true);
  }
}

/** Doc nguoc JSON trong o Du lieu ra 6 o quan (dung khi sua vat pham cu) */
function adminDocJsonBoQuan() {
  var obj;
  try {
    obj = JSON.parse(adminEl("vpDuLieu").value || "{}");
  } catch (loi) {
    adminBaoTin("❌ Ô Dữ liệu không phải JSON hợp lệ.", false);
    return;
  }
  ADMIN_QUAN_CO.forEach(function (q) {
    adminEl("vpQuan_" + q.ma).value = obj[q.ma] || "";
    adminVeXemTruocQuan(q.ma);
  });
  adminBaoTin("✅ Đã đọc dữ liệu ra 6 ô quân.", true);
}

/** Ghi 2 mau ban co thanh JSON */
function adminGhiJsonBanCo() {
  var obj = {
    mauSang: adminEl("vpMauSang").value,
    mauToi: adminEl("vpMauToi").value
  };
  adminEl("vpDuLieu").value = JSON.stringify(obj);
  adminBaoTin("✅ Đã ghi màu bàn cờ vào ô Dữ liệu.", true);
}

function adminTaiVatPham() {
  adminEl("bangVatPham").innerHTML = '<tr><td colspan="12" class="adminDangTai">Đang tải...</td></tr>';
  adminGoiRpc("admin_lay_vat_pham", {}).then(function (ph) {
    if (!ph.thanhCong) {
      adminXuLyLoi(ph);
      adminEl("bangVatPham").innerHTML = '<tr><td colspan="12" class="adminRong">Không tải được danh sách.</td></tr>';
      return;
    }
    adminDsVatPham = ph.danhSachVatPham || [];
    adminVeBangVatPham();
  });
}

function adminVeBangVatPham() {
  var than = adminEl("bangVatPham");
  if (adminDsVatPham.length === 0) {
    than.innerHTML = '<tr><td colspan="12" class="adminRong">Chưa có vật phẩm nào. Hãy thêm ở khối bên trên.</td></tr>';
    return;
  }

  var html = "";
  adminDsVatPham.forEach(function (vp) {
    var hinh = vp.urlHinh
      ? '<img class="adminAnhXemTruoc" src="' + adminThoat(vp.urlHinh) + '" alt="">'
      : "—";
    var soLuong = (vp.soLuong === null || vp.soLuong === undefined) ? "∞" : vp.soLuong;
    var mocLevel = (vp.mocLevel === null || vp.mocLevel === undefined) ? "—" : ("Lv " + vp.mocLevel);
    var hienThi = vp.hienThi
      ? '<span class="adminHuyHieu adminHuyHieuXong">Hiện</span>'
      : '<span class="adminHuyHieu adminHuyHieuAn">Ẩn</span>';

    html +=
      "<tr>" +
        "<td>" + vp.id + "</td>" +
        "<td>" + hinh + "</td>" +
        "<td>" + adminThoat(vp.loai) + "</td>" +
        "<td>" + adminThoat(vp.ten) + "</td>" +
        "<td>" + adminThoat(vp.maDinhDanh) + "</td>" +
        "<td>" + vp.giaKimCuong + "</td>" +
        "<td>" + mocLevel + "</td>" +
        "<td>" + soLuong + "</td>" +
        "<td>" + vp.daDoi + "</td>" +
        "<td>" + hienThi + "</td>" +
        "<td>" + vp.thuTuHienThi + "</td>" +
        '<td><button class="adminNut" data-suavp="' + vp.id + '" type="button">✏️ Sửa</button></td>' +
      "</tr>";
  });
  than.innerHTML = html;

  var nut = than.querySelectorAll("[data-suavp]");
  for (var i = 0; i < nut.length; i++) {
    nut[i].addEventListener("click", function () {
      adminDoVatPhamVaoForm(parseInt(this.getAttribute("data-suavp"), 10));
    });
  }
}

/** Do 1 vat pham vao form de sua */
function adminDoVatPhamVaoForm(id) {
  var vp = null;
  for (var i = 0; i < adminDsVatPham.length; i++) {
    if (adminDsVatPham[i].id === id) { vp = adminDsVatPham[i]; break; }
  }
  if (!vp) return;

  adminEl("vpId").value = vp.id;
  adminEl("vpLoai").value = vp.loai;
  adminEl("vpTen").value = vp.ten || "";
  adminEl("vpMoTa").value = vp.moTa || "";
  adminEl("vpGia").value = vp.giaKimCuong || 0;
  adminEl("vpMaDinhDanh").value = vp.maDinhDanh || "";
  adminEl("vpUrlHinh").value = vp.urlHinh || "";
  adminEl("vpSoLuong").value = (vp.soLuong === null || vp.soLuong === undefined) ? "" : vp.soLuong;
  adminEl("vpMocLevel").value = (vp.mocLevel === null || vp.mocLevel === undefined) ? "" : vp.mocLevel;
  adminEl("vpThuTu").value = vp.thuTuHienThi || 0;
  adminEl("vpHienThi").checked = !!vp.hienThi;
  adminEl("vpDuLieu").value = JSON.stringify(vp.duLieu || {});

  adminEl("tieuDeFormVatPham").textContent = "✏️ Sửa Vật Phẩm #" + vp.id;
  adminCapNhatTroLyTheoLoai();
  adminVeXemTruocHinhChinh();

  // Do san 6 o quan / 2 o mau cho tien sua
  if (vp.loai === "bo_quan_co") adminDocJsonBoQuan();
  if (vp.loai === "ban_co") {
    var d = vp.duLieu || {};
    if (d.mauSang) adminEl("vpMauSang").value = d.mauSang;
    if (d.mauToi)  adminEl("vpMauToi").value = d.mauToi;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function adminXoaFormVatPham() {
  adminEl("vpId").value = "";
  adminEl("vpTen").value = "";
  adminEl("vpMoTa").value = "";
  adminEl("vpGia").value = "0";
  adminEl("vpMaDinhDanh").value = "";
  adminEl("vpUrlHinh").value = "";
  adminEl("vpSoLuong").value = "";
  adminEl("vpMocLevel").value = "";
  adminEl("vpThuTu").value = "0";
  adminEl("vpHienThi").checked = true;
  adminEl("vpDuLieu").value = "{}";
  adminEl("vpFileHinh").value = "";
  ADMIN_QUAN_CO.forEach(function (q) {
    adminEl("vpQuan_" + q.ma).value = "";
    adminEl("vpFileQuan_" + q.ma).value = "";
    adminVeXemTruocQuan(q.ma);
  });
  adminEl("tieuDeFormVatPham").textContent = "➕ Thêm Vật Phẩm Mới";
  adminVeXemTruocHinhChinh();
}

function adminLuuVatPham() {
  var ten = adminEl("vpTen").value.trim();
  if (!ten) {
    adminBaoTin("❌ Vui lòng nhập tên vật phẩm.", false);
    return;
  }

  var duLieu;
  try {
    duLieu = JSON.parse(adminEl("vpDuLieu").value.trim() || "{}");
  } catch (loi) {
    adminBaoTin("❌ Ô Dữ liệu không phải JSON hợp lệ. Ví dụ đúng: {\"k\":\"🦖\",\"q\":\"🦕\"}", false);
    return;
  }

  var idCu = adminEl("vpId").value;

  // AN TOÀN: nếu form đang mang id (tức đang SỬA một vật phẩm cũ), hỏi lại cho
  // chắc để tránh vô tình ghi đè lên vật phẩm khác. Muốn tạo cái mới hoàn toàn,
  // hãy bấm "➕ Thêm Vật Phẩm Mới (làm trống form)" trước rồi mới nhập.
  if (idCu) {
    var tenCu = "";
    for (var iv = 0; iv < adminDsVatPham.length; iv++) {
      if (adminDsVatPham[iv].id === parseInt(idCu, 10)) { tenCu = adminDsVatPham[iv].ten; break; }
    }
    var loiNhac = "Bạn đang SỬA và GHI ĐÈ lên vật phẩm #" + idCu +
      (tenCu ? " (\"" + tenCu + "\")" : "") + ".\n\n" +
      "Nếu muốn TẠO MỘT VẬT PHẨM MỚI thay vì sửa cái cũ, hãy bấm Hủy, rồi bấm " +
      "\"➕ Thêm Vật Phẩm Mới (làm trống form)\".\n\nVẫn ghi đè?";
    if (!window.confirm(loiNhac)) return;
  }

  var nut = adminEl("btnVpLuu");
  nut.disabled = true;

  adminGoiRpc("admin_luu_vat_pham", {
    p_id:           idCu ? parseInt(idCu, 10) : null,
    p_loai:         adminEl("vpLoai").value,
    p_ten:          ten,
    p_mo_ta:        adminEl("vpMoTa").value.trim(),
    p_gia:          parseInt(adminEl("vpGia").value, 10) || 0,
    p_url_hinh:     adminEl("vpUrlHinh").value.trim(),
    p_ma_dinh_danh: adminEl("vpMaDinhDanh").value.trim(),
    p_du_lieu:      duLieu,
    p_so_luong:     adminSoHoacNull(adminEl("vpSoLuong").value),
    p_hien_thi:     adminEl("vpHienThi").checked,
    p_thu_tu:       parseInt(adminEl("vpThuTu").value, 10) || 0,
    p_moc_level:    adminSoHoacNull(adminEl("vpMocLevel").value)
  }).then(function (ph) {
    nut.disabled = false;
    if (!ph.thanhCong) { adminXuLyLoi(ph); return; }
    adminBaoTin("✅ Đã lưu vật phẩm (ID " + ph.id + ").", true);
    adminXoaFormVatPham();
    adminTaiVatPham();
  });
}


// ================================================================
// PHAN 4: MAN HINH "DOI THUONG"
// ================================================================

function adminDungManHinhDoiThuong() {
  adminEl("btnLamMoiDoiThuong").addEventListener("click", adminTaiDoiThuong);
}

function adminTaiDoiThuong() {
  adminEl("bangDoiThuong").innerHTML = '<tr><td colspan="9" class="adminDangTai">Đang tải...</td></tr>';
  adminGoiRpc("admin_lay_lich_su", {}).then(function (ph) {
    if (!ph.thanhCong) {
      adminXuLyLoi(ph);
      adminEl("bangDoiThuong").innerHTML = '<tr><td colspan="9" class="adminRong">Không tải được lịch sử.</td></tr>';
      return;
    }

    var ds = ph.lichSu || [];
    if (ds.length === 0) {
      adminEl("bangDoiThuong").innerHTML = '<tr><td colspan="9" class="adminRong">Chưa có ai đổi thưởng.</td></tr>';
      return;
    }

    var html = "";
    ds.forEach(function (ls) {
      var choTrao = (ls.trangThai === "cho_trao");
      var huyHieu = choTrao
        ? '<span class="adminHuyHieu adminHuyHieuCho">Chờ trao</span>'
        : '<span class="adminHuyHieu adminHuyHieuXong">Đã nhận</span>';
      var nut = choTrao
        ? '<button class="adminNut adminNutThanhCong" data-xacnhan="' + ls.id + '" type="button">✅ Xác Nhận Trao</button>'
        : "—";

      html +=
        "<tr>" +
          "<td>" + ls.id + "</td>" +
          "<td>" + adminThoat(ls.tenDangNhap) + "</td>" +
          "<td>" + adminThoat(ls.tenVatPham) + "</td>" +
          "<td>" + adminThoat(ls.loai) + "</td>" +
          "<td>" + ls.giaLucDoi + " 💎</td>" +
          "<td>" + huyHieu + "</td>" +
          "<td>" + adminDinhDangGio(ls.thoiGianDoi) + "</td>" +
          "<td>" + adminDinhDangGio(ls.thoiGianXacNhan) + "</td>" +
          "<td>" + nut + "</td>" +
        "</tr>";
    });
    adminEl("bangDoiThuong").innerHTML = html;

    var nutXn = adminEl("bangDoiThuong").querySelectorAll("[data-xacnhan]");
    for (var i = 0; i < nutXn.length; i++) {
      nutXn[i].addEventListener("click", function () {
        adminXacNhanTrao(parseInt(this.getAttribute("data-xacnhan"), 10), this);
      });
    }
  });
}

function adminXacNhanTrao(id, nut) {
  if (!confirm("Xác nhận đã trao quà này tận tay cho trẻ?")) return;
  nut.disabled = true;
  adminGoiRpc("admin_xac_nhan_trao", { p_lich_su_id: id }).then(function (ph) {
    if (!ph.thanhCong) { nut.disabled = false; adminXuLyLoi(ph); return; }
    adminBaoTin("✅ Đã xác nhận trao thưởng.", true);
    adminTaiDoiThuong();
  });
}


// ================================================================
// PHAN 5: MAN HINH "Y TUONG"
// ================================================================

function adminDungManHinhYTuong() {
  adminEl("btnLamMoiYTuong").addEventListener("click", adminTaiYTuong);
}

function adminTaiYTuong() {
  adminEl("bangYTuong").innerHTML = '<tr><td colspan="7" class="adminDangTai">Đang tải...</td></tr>';
  adminGoiRpc("admin_lay_y_tuong", {}).then(function (ph) {
    if (!ph.thanhCong) {
      adminXuLyLoi(ph);
      adminEl("bangYTuong").innerHTML = '<tr><td colspan="7" class="adminRong">Không tải được ý tưởng.</td></tr>';
      return;
    }

    var ds = ph.danhSachYTuong || [];
    if (ds.length === 0) {
      adminEl("bangYTuong").innerHTML = '<tr><td colspan="7" class="adminRong">Chưa có ý tưởng nào (trang Học Tập / Khám Phá làm ở NC_07).</td></tr>';
      return;
    }

    var html = "";
    ds.forEach(function (yt) {
      var laMoi = (yt.trangThai === "moi");
      var huyHieu = laMoi
        ? '<span class="adminHuyHieu adminHuyHieuMoi">Mới</span>'
        : '<span class="adminHuyHieu adminHuyHieuXong">Đã xem</span>';
      var nhan = laMoi ? "👁️ Đánh dấu đã xem" : "↩️ Đánh dấu lại là mới";
      var trangThaiMoi = laMoi ? "da_xem" : "moi";

      html +=
        "<tr>" +
          "<td>" + yt.id + "</td>" +
          "<td>" + adminThoat(yt.tenDangNhap) + "</td>" +
          "<td>" + adminThoat(yt.chuyenMuc) + "</td>" +
          "<td>" + adminThoat(yt.noiDung) + "</td>" +
          "<td>" + huyHieu + "</td>" +
          "<td>" + adminDinhDangGio(yt.ngayGui) + "</td>" +
          '<td><button class="adminNut adminNutPhu" data-ytid="' + yt.id + '" data-yttt="' + trangThaiMoi + '" type="button">' + nhan + "</button></td>" +
        "</tr>";
    });
    adminEl("bangYTuong").innerHTML = html;

    var nut = adminEl("bangYTuong").querySelectorAll("[data-ytid]");
    for (var i = 0; i < nut.length; i++) {
      nut[i].addEventListener("click", function () {
        adminXuLyYTuong(parseInt(this.getAttribute("data-ytid"), 10), this.getAttribute("data-yttt"), this);
      });
    }
  });
}

function adminXuLyYTuong(id, trangThai, nut) {
  nut.disabled = true;
  adminGoiRpc("admin_xu_ly_y_tuong", { p_id: id, p_trang_thai: trangThai }).then(function (ph) {
    if (!ph.thanhCong) { nut.disabled = false; adminXuLyLoi(ph); return; }
    adminBaoTin("✅ Đã cập nhật trạng thái ý tưởng.", true);
    adminTaiYTuong();
  });
}


// ================================================================
// PHAN 6: MAN HINH "CAU HINH CHUNG"
// ================================================================

function adminDungManHinhCauHinhChung() {
  adminEl("btnLamMoiCauHinhChung").addEventListener("click", adminTaiCauHinhChung);
  adminEl("btnThemKhoaMoi").addEventListener("click", adminThemKhoaMoi);
}

function adminTaiCauHinhChung() {
  adminEl("bangCauHinhChung").innerHTML = '<tr><td colspan="4" class="adminDangTai">Đang tải...</td></tr>';
  adminGoiRpc("admin_lay_cau_hinh_chung", {}).then(function (ph) {
    if (!ph.thanhCong) {
      adminXuLyLoi(ph);
      adminEl("bangCauHinhChung").innerHTML = '<tr><td colspan="4" class="adminRong">Không tải được cấu hình.</td></tr>';
      return;
    }

    var ds = ph.cauHinhChung || [];
    var html = "";
    ds.forEach(function (ch) {
      html +=
        "<tr>" +
          "<td><code>" + adminThoat(ch.khoa) + "</code></td>" +
          '<td><input type="text" id="ch_' + adminThoat(ch.khoa) + '" value="' + adminThoat(ch.giaTri) + '"></td>' +
          "<td>" + adminThoat(ch.moTa) + "</td>" +
          '<td><button class="adminNut" data-luuch="' + adminThoat(ch.khoa) + '" type="button">💾 Lưu</button></td>' +
        "</tr>";
    });
    adminEl("bangCauHinhChung").innerHTML = html;

    var nut = adminEl("bangCauHinhChung").querySelectorAll("[data-luuch]");
    for (var i = 0; i < nut.length; i++) {
      nut[i].addEventListener("click", function () {
        var khoa = this.getAttribute("data-luuch");
        adminLuuKhoaCauHinh(khoa, adminEl("ch_" + khoa).value, null, this);
      });
    }
  });
}

function adminLuuKhoaCauHinh(khoa, giaTri, moTa, nut) {
  if (nut) nut.disabled = true;
  return adminGoiRpc("admin_luu_cau_hinh_chung", {
    p_khoa: khoa,
    p_gia_tri: String(giaTri),
    p_mo_ta: moTa
  }).then(function (ph) {
    if (nut) nut.disabled = false;
    if (!ph.thanhCong) { adminXuLyLoi(ph); return false; }
    adminBaoTin("✅ Đã lưu khóa " + khoa + ". Trẻ cần tải lại trang để áp dụng.", true);
    return true;
  });
}

function adminThemKhoaMoi() {
  var khoa = adminEl("chKhoaMoi").value.trim();
  var giaTri = adminEl("chGiaTriMoi").value.trim();
  var moTa = adminEl("chMoTaMoi").value.trim();

  if (!khoa || !giaTri) {
    adminBaoTin("❌ Vui lòng nhập cả khóa và giá trị.", false);
    return;
  }

  adminLuuKhoaCauHinh(khoa, giaTri, moTa, adminEl("btnThemKhoaMoi")).then(function (ok) {
    if (!ok) return;
    adminEl("chKhoaMoi").value = "";
    adminEl("chGiaTriMoi").value = "";
    adminEl("chMoTaMoi").value = "";
    adminTaiCauHinhChung();
  });
}


// ================================================================
// PHAN 7: MAN HINH "CAP DO MAY"
// ================================================================

function adminDungManHinhCapDo() {
  adminEl("btnLamMoiCapDo").addEventListener("click", adminTaiCapDo);
  adminEl("btnLuuTatCaCapDo").addEventListener("click", adminLuuTatCaCapDo);
}

function adminTaiCapDo() {
  adminEl("bangCapDo").innerHTML = '<tr><td colspan="7" class="adminDangTai">Đang tải...</td></tr>';
  adminCapDoDaSua = {};

  // Dung lay_cau_hinh() cong khai: da tra du 20 dong cau_hinh_cap_do,
  // khong can them RPC quan tri rieng chi de DOC.
  apiLayCauHinh().then(function (ph) {
    if (!ph.thanhCong) {
      adminXuLyLoi(ph);
      adminEl("bangCapDo").innerHTML = '<tr><td colspan="7" class="adminRong">Không tải được cấu hình cấp độ.</td></tr>';
      return;
    }

    adminDsCapDo = ph.cauHinhCapDo || [];
    var html = "";
    adminDsCapDo.forEach(function (cd) {
      var gioiHan = (cd.goiYGioiHan === null || cd.goiYGioiHan === undefined) ? "" : cd.goiYGioiHan;
      html +=
        "<tr>" +
          "<td><strong>" + cd.capDo + "</strong></td>" +
          '<td><input type="number" min="0" max="100" id="cd_tyle_' + cd.capDo + '" value="' + cd.tyLeNgauNhien + '"></td>' +
          '<td><input type="number" min="0" max="20"  id="cd_skill_' + cd.capDo + '" value="' + cd.skillLevel + '"></td>' +
          '<td><input type="number" min="1" max="25"  id="cd_dosau_' + cd.capDo + '" value="' + cd.doSau + '"></td>' +
          '<td><input type="number" min="0" id="cd_gioihan_' + cd.capDo + '" value="' + gioiHan + '" placeholder="Không giới hạn"></td>' +
          '<td><input type="number" min="0" id="cd_chiphi_' + cd.capDo + '" value="' + cd.goiYChiPhi + '"></td>' +
          '<td><button class="adminNut" data-luucd="' + cd.capDo + '" type="button">💾 Lưu</button></td>' +
        "</tr>";
    });
    adminEl("bangCapDo").innerHTML = html;

    // Danh dau dong da sua (de nut "Luu tat ca" chi gui dong can gui)
    adminDsCapDo.forEach(function (cd) {
      ["tyle", "skill", "dosau", "gioihan", "chiphi"].forEach(function (o) {
        adminEl("cd_" + o + "_" + cd.capDo).addEventListener("input", function () {
          adminCapDoDaSua[cd.capDo] = true;
        });
      });
    });

    var nut = adminEl("bangCapDo").querySelectorAll("[data-luucd]");
    for (var i = 0; i < nut.length; i++) {
      nut[i].addEventListener("click", function () {
        adminLuuMotCapDo(parseInt(this.getAttribute("data-luucd"), 10), this);
      });
    }
  });
}

/** Gui 1 dong cap do len may chu. Tra ve Promise<boolean> */
function adminLuuMotCapDo(capDo, nut) {
  if (nut) nut.disabled = true;

  return adminGoiRpc("admin_luu_cau_hinh_cap_do", {
    p_cap_do:   capDo,
    p_ty_le:    parseInt(adminEl("cd_tyle_" + capDo).value, 10),
    p_skill:    parseInt(adminEl("cd_skill_" + capDo).value, 10),
    p_do_sau:   parseInt(adminEl("cd_dosau_" + capDo).value, 10),
    p_gioi_han: adminSoHoacNull(adminEl("cd_gioihan_" + capDo).value),
    p_chi_phi:  parseInt(adminEl("cd_chiphi_" + capDo).value, 10)
  }).then(function (ph) {
    if (nut) nut.disabled = false;
    if (!ph.thanhCong) { adminXuLyLoi(ph); return false; }
    delete adminCapDoDaSua[capDo];
    if (nut) adminBaoTin("✅ Đã lưu cấp " + capDo + ".", true);
    return true;
  });
}

function adminLuuTatCaCapDo() {
  var cacCap = Object.keys(adminCapDoDaSua);
  if (cacCap.length === 0) {
    adminBaoTin("ℹ️ Chưa có dòng nào được sửa.", true);
    return;
  }

  var nut = adminEl("btnLuuTatCaCapDo");
  nut.disabled = true;

  // Gui lan luot (khong song song) de neu co dong loi thi biet dung dong nao
  var soXong = 0, soLoi = 0;
  var chuoi = Promise.resolve();

  cacCap.forEach(function (cap) {
    chuoi = chuoi.then(function () {
      return adminLuuMotCapDo(parseInt(cap, 10), null).then(function (ok) {
        if (ok) soXong++; else soLoi++;
      });
    });
  });

  chuoi.then(function () {
    nut.disabled = false;
    if (soLoi === 0) {
      adminBaoTin("✅ Đã lưu " + soXong + " dòng. Trẻ cần tải lại trang để áp dụng.", true);
    } else {
      adminBaoTin("⚠️ Lưu được " + soXong + " dòng, lỗi " + soLoi + " dòng. Xem lại giá trị nhập.", false);
    }
  });
}


// ================================================================
// PHAN 8: MAN HINH "LOI DONG VIEN"
// ================================================================

function adminDungManHinhLoiDongVien() {
  // Do 2 o select tinh huong
  var htmlThem = "";
  var htmlLoc = '<option value="">— Tất cả tình huống —</option>';
  ADMIN_TINH_HUONG.forEach(function (th) {
    htmlThem += '<option value="' + th.ma + '">' + adminThoat(th.ten) + "</option>";
    htmlLoc  += '<option value="' + th.ma + '">' + adminThoat(th.ten) + "</option>";
  });
  adminEl("ldvLoaiMoi").innerHTML = htmlThem;
  adminEl("ldvLocLoai").innerHTML = htmlLoc;

  adminEl("btnLamMoiLdv").addEventListener("click", adminTaiLoiDongVien);
  adminEl("btnLdvThem").addEventListener("click", adminThemLoiDongVien);
  adminEl("ldvLocLoai").addEventListener("change", adminVeBangLoiDongVien);

  adminEl("ldvFileMoi").addEventListener("change", function () {
    var file = this.files[0];
    if (!file) return;
    adminBaoTin("⏳ Đang tải file âm thanh lên...", true);
    adminTaiFileLen(file, "am-thanh")
      .then(function (url) {
        adminEl("ldvLinkMoi").value = url;
        adminBaoTin("✅ Đã tải file âm thanh lên.", true);
      })
      .catch(function (loi) {
        adminBaoTin("❌ Không tải được file: " + loi.message, false);
      });
  });
}

function adminTaiLoiDongVien() {
  adminEl("bangLoiDongVien").innerHTML = '<tr><td colspan="6" class="adminDangTai">Đang tải...</td></tr>';
  adminGoiRpc("admin_lay_loi_dong_vien", {}).then(function (ph) {
    if (!ph.thanhCong) {
      adminXuLyLoi(ph);
      adminEl("bangLoiDongVien").innerHTML = '<tr><td colspan="6" class="adminRong">Không tải được danh sách.</td></tr>';
      return;
    }
    adminDsLoiDongVien = ph.loiDongVien || [];
    adminVeBangLoiDongVien();
  });
}

function adminVeBangLoiDongVien() {
  var loc = adminEl("ldvLocLoai").value;
  var than = adminEl("bangLoiDongVien");

  var ds = adminDsLoiDongVien.filter(function (c) {
    return !loc || c.loai === loc;
  });

  if (ds.length === 0) {
    than.innerHTML = '<tr><td colspan="6" class="adminRong">Chưa có câu nói nào cho tình huống này.</td></tr>';
    return;
  }

  var html = "";
  ds.forEach(function (c) {
    html +=
      "<tr>" +
        "<td>" + c.id + "</td>" +
        "<td><code>" + adminThoat(c.loai) + "</code></td>" +
        '<td><input type="text" maxlength="300" id="ldv_nd_' + c.id + '" value="' + adminThoat(c.noiDung) + '"></td>' +
        '<td><input type="text" id="ldv_link_' + c.id + '" value="' + adminThoat(c.duongDanAmThanh) + '" placeholder="(không có)"></td>' +
        '<td style="text-align:center;"><input type="checkbox" id="ldv_hien_' + c.id + '"' + (c.hienThi ? " checked" : "") + "></td>" +
        "<td>" +
          '<button class="adminNut" data-ldvluu="' + c.id + '" type="button">💾</button> ' +
          '<button class="adminNut adminNutPhu" data-ldvnghe="' + c.id + '" type="button">▶️ Nghe</button> ' +
          '<button class="adminNut adminNutNguyHiem" data-ldvxoa="' + c.id + '" type="button">🗑️</button>' +
        "</td>" +
      "</tr>";
  });
  than.innerHTML = html;

  var nutLuu = than.querySelectorAll("[data-ldvluu]");
  for (var i = 0; i < nutLuu.length; i++) {
    nutLuu[i].addEventListener("click", function () {
      adminLuuLoiDongVien(parseInt(this.getAttribute("data-ldvluu"), 10), this);
    });
  }
  var nutNghe = than.querySelectorAll("[data-ldvnghe]");
  for (var j = 0; j < nutNghe.length; j++) {
    nutNghe[j].addEventListener("click", function () {
      var id = parseInt(this.getAttribute("data-ldvnghe"), 10);
      adminNgheThu(adminEl("ldv_nd_" + id).value, adminEl("ldv_link_" + id).value);
    });
  }
  var nutXoa = than.querySelectorAll("[data-ldvxoa]");
  for (var k = 0; k < nutXoa.length; k++) {
    nutXoa[k].addEventListener("click", function () {
      adminXoaLoiDongVien(parseInt(this.getAttribute("data-ldvxoa"), 10), this);
    });
  }
}

function adminThemLoiDongVien() {
  var noiDung = adminEl("ldvNoiDungMoi").value.trim();
  if (!noiDung) {
    adminBaoTin("❌ Vui lòng nhập nội dung câu nói.", false);
    return;
  }

  var nut = adminEl("btnLdvThem");
  nut.disabled = true;

  adminGoiRpc("admin_luu_loi_dong_vien", {
    p_id: null,
    p_loai: adminEl("ldvLoaiMoi").value,
    p_noi_dung: noiDung,
    p_duong_dan: adminEl("ldvLinkMoi").value.trim(),
    p_hien_thi: true
  }).then(function (ph) {
    nut.disabled = false;
    if (!ph.thanhCong) { adminXuLyLoi(ph); return; }
    adminBaoTin("✅ Đã thêm câu nói (ID " + ph.id + ").", true);
    adminEl("ldvNoiDungMoi").value = "";
    adminEl("ldvLinkMoi").value = "";
    adminEl("ldvFileMoi").value = "";
    adminTaiLoiDongVien();
  });
}

function adminLuuLoiDongVien(id, nut) {
  var cu = null;
  for (var i = 0; i < adminDsLoiDongVien.length; i++) {
    if (adminDsLoiDongVien[i].id === id) { cu = adminDsLoiDongVien[i]; break; }
  }
  if (!cu) return;

  nut.disabled = true;
  adminGoiRpc("admin_luu_loi_dong_vien", {
    p_id: id,
    p_loai: cu.loai,
    p_noi_dung: adminEl("ldv_nd_" + id).value.trim(),
    p_duong_dan: adminEl("ldv_link_" + id).value.trim(),
    p_hien_thi: adminEl("ldv_hien_" + id).checked
  }).then(function (ph) {
    nut.disabled = false;
    if (!ph.thanhCong) { adminXuLyLoi(ph); return; }
    adminBaoTin("✅ Đã lưu câu nói ID " + id + ".", true);
    adminTaiLoiDongVien();
  });
}

function adminXoaLoiDongVien(id, nut) {
  if (!confirm("Xóa hẳn câu nói này? (Muốn tạm tắt thì bỏ tick ô \"Hiện\" rồi bấm 💾 — an toàn hơn)")) return;
  nut.disabled = true;
  adminGoiRpc("admin_xoa_loi_dong_vien", { p_id: id }).then(function (ph) {
    if (!ph.thanhCong) { nut.disabled = false; adminXuLyLoi(ph); return; }
    adminBaoTin("✅ Đã xóa câu nói ID " + id + ".", true);
    adminTaiLoiDongVien();
  });
}

/**
 * Nghe thu 1 cau: uu tien PHAT FILE MP3 (dung thu tang du phong ma tre se nghe),
 * khong co file thi doc bang giong tren may nay.
 */
function adminNgheThu(noiDung, duongDan) {
  if (duongDan && duongDan.trim()) {
    var am = new Audio(duongDan.trim());
    am.play().catch(function () {
      adminBaoTin("❌ Không phát được file âm thanh. Kiểm tra lại link.", false);
    });
    return;
  }
  adminDocBangGiong(noiDung, null);
}


// ================================================================
// PHAN 9: MAN HINH "GIONG DOC"
// ================================================================

function adminDungManHinhGiongDoc() {
  adminEl("btnGdNgheThu").addEventListener("click", function () {
    var ten = adminEl("gdChonGiong").value;
    adminDocBangGiong(adminEl("gdCauThu").value, ten);
  });
  adminEl("btnGdLuu").addEventListener("click", function () {
    adminLuuGiongDoc(adminEl("gdChonGiong").value);
  });
  adminEl("btnGdXoa").addEventListener("click", function () {
    adminEl("gdChonGiong").value = "";
    adminLuuGiongDoc("");
  });
}

function adminTaiGiongDoc() {
  adminQuetGiongNoi();

  // Giong nap bat dong bo tren nhieu may -> quet lai vai lan (bai hoc tu board.js)
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = adminQuetGiongNoi;
    setTimeout(adminQuetGiongNoi, 800);
    setTimeout(adminQuetGiongNoi, 2500);
  }

  // Doc gia tri dang luu trong cau_hinh_chung
  adminGoiRpc("admin_lay_cau_hinh_chung", {}).then(function (ph) {
    if (!ph.thanhCong) { adminXuLyLoi(ph); return; }

    var ten = "", ngonNgu = "";
    (ph.cauHinhChung || []).forEach(function (ch) {
      if (ch.khoa === "giong_doc_ten") ten = ch.giaTri;
      if (ch.khoa === "giong_doc_ngon_ngu") ngonNgu = ch.giaTri;
    });

    adminEl("gdDangLuuTen").textContent = ten || "(để trống — mỗi máy tự dò giọng Việt)";
    adminEl("gdDangLuuNgonNgu").textContent = ngonNgu || "vi-VN";

    // Neu giong da luu co tren may nay thi chon san trong danh sach
    if (ten) {
      var o = adminEl("gdChonGiong");
      for (var i = 0; i < o.options.length; i++) {
        if (o.options[i].value === ten) { o.selectedIndex = i; break; }
      }
    }
  });
}

/** Liet ke giong tren may nay, giong tieng Viet len dau va co dau ✅ */
function adminQuetGiongNoi() {
  if (!window.speechSynthesis) {
    adminEl("gdChonGiong").innerHTML = '<option value="">Trình duyệt này không hỗ trợ đọc giọng nói</option>';
    adminEl("gdCanhBaoKhongCoGiong").style.display = "block";
    return;
  }

  var ds = window.speechSynthesis.getVoices() || [];
  if (ds.length === 0) return;   // chua nap xong, cho lan quet sau

  adminDanhSachGiong = ds;

  var giongViet = ds.filter(adminLaGiongViet);
  var giongKhac = ds.filter(function (g) { return !adminLaGiongViet(g); });

  adminEl("gdCanhBaoKhongCoGiong").style.display = (giongViet.length === 0) ? "block" : "none";

  var html = '<option value="">(để trống — mỗi máy tự dò giọng tiếng Việt)</option>';
  if (giongViet.length > 0) {
    html += '<optgroup label="✅ Giọng tiếng Việt">';
    giongViet.forEach(function (g) {
      html += '<option value="' + adminThoat(g.name) + '">' + adminThoat(g.name) + " (" + adminThoat(g.lang) + ")</option>";
    });
    html += "</optgroup>";
  }
  html += '<optgroup label="⚠️ Giọng ngôn ngữ khác (KHÔNG nên chọn — trợ lý sẽ im lặng)">';
  giongKhac.forEach(function (g) {
    html += '<option value="' + adminThoat(g.name) + '">' + adminThoat(g.name) + " (" + adminThoat(g.lang) + ")</option>";
  });
  html += "</optgroup>";

  var giuLai = adminEl("gdChonGiong").value;
  adminEl("gdChonGiong").innerHTML = html;
  if (giuLai) adminEl("gdChonGiong").value = giuLai;
}

/** Giong tieng Viet: ma ngon ngu bat dau bang "vi" (vi-VN, vi_VN, vi) */
function adminLaGiongViet(giong) {
  if (!giong || !giong.lang) return false;
  return giong.lang.toLowerCase().replace("_", "-").indexOf("vi") === 0;
}

/**
 * Doc 1 cau bang Web Speech API.
 * VA LOI CHROME (HUONG DAN 4.10): goi speak() NGAY sau cancel() thi cau moi bi
 * NUOT mat. Bat buoc lui speak() lai ~80ms.
 */
function adminDocBangGiong(noiDung, tenGiong) {
  if (!window.speechSynthesis) {
    adminBaoTin("❌ Trình duyệt này không đọc được giọng nói.", false);
    return;
  }
  if (!noiDung || !noiDung.trim()) {
    adminBaoTin("❌ Chưa có nội dung để đọc.", false);
    return;
  }

  window.speechSynthesis.cancel();

  setTimeout(function () {
    var cau = new SpeechSynthesisUtterance(noiDung.trim());
    cau.lang = "vi-VN";
    cau.rate = 0.95;

    var giong = null;
    if (tenGiong) {
      for (var i = 0; i < adminDanhSachGiong.length; i++) {
        if (adminDanhSachGiong[i].name === tenGiong) { giong = adminDanhSachGiong[i]; break; }
      }
    }
    if (!giong) {
      for (var j = 0; j < adminDanhSachGiong.length; j++) {
        if (adminLaGiongViet(adminDanhSachGiong[j])) { giong = adminDanhSachGiong[j]; break; }
      }
    }

    // KHONG doc bang giong ngoai tieng Viet (HUONG DAN 4.10 - nguyen tac toi thuong)
    if (!giong) {
      adminBaoTin("⚠️ Máy này không có giọng tiếng Việt nên không nghe thử được. Trên máy của trẻ, trợ lý 🦉 sẽ im lặng chứ không đọc tiếng Anh.", false);
      return;
    }

    cau.voice = giong;
    window.speechSynthesis.speak(cau);
  }, 80);
}

function adminLuuGiongDoc(tenGiong) {
  var nut = adminEl("btnGdLuu");
  nut.disabled = true;

  // Luu ten giong truoc, roi luu ma ngon ngu (luon la vi-VN)
  adminLuuKhoaCauHinh("giong_doc_ten", tenGiong, null, null)
    .then(function (ok) {
      if (!ok) return false;
      return adminLuuKhoaCauHinh("giong_doc_ngon_ngu", "vi-VN", null, null);
    })
    .then(function (ok) {
      nut.disabled = false;
      if (!ok) return;
      adminEl("gdDangLuuTen").textContent = tenGiong || "(để trống — mỗi máy tự dò giọng Việt)";
      adminEl("gdDangLuuNgonNgu").textContent = "vi-VN";
      adminBaoTin(tenGiong
        ? "✅ Đã lưu giọng \"" + tenGiong + "\"."
        : "✅ Đã xóa lựa chọn — mỗi máy sẽ tự dò giọng tiếng Việt của nó.", true);
    });
}
