// ================================
// FILE: admin_NC.js
// CHUC NANG: Toan bo logic cua Trang Quan Tri (admin_NC.html)
//   9 man hinh: Vat Pham | Doi Thuong | Y Tuong | Cau Hinh Chung |
//               Cap Do May | Loi Dong Vien | Giong Doc | Ho So Tre | Don Kho Anh
// BUOC: NC_06A-2 (nang cap tu NC_09B) - NGAY: 12/07/2026 21:00
//   NC_06A-2 (3 tinh nang quan tri con thieu - KE HOACH muc NC_06A-2):
//     (a) XEM NGUOI SO HUU: nut 👥 o cot "Da doi" cua bang vat pham -> khoi
//         danh sach tre da doi/mua vat pham do (RPC admin_lay_nguoi_so_huu_vat_pham).
//     (b) MAN HINH "HO SO TRE": danh sach moi tre (RPC cong khai lay_xep_hang)
//         + chi tiet 1 tre (RPC cong khai lay_ho_so) - theo LUAT DOC/GHI chot o
//         NC_06A: RPC cong khai da tra DU truong thi dung lai, khong viet RPC trung.
//     (c) MAN HINH "DON KHO ANH": quet file mo coi trong bucket hinh-vat-pham.
//         Tham chieu lay tu RPC admin_lay_tham_chieu_storage (gop DU 4 nguon
//         HUONG DAN 4.6 + 1 nguon du phong trang_bi); danh sach file lay bang
//         storage.list() de quy theo thu muc. CHI liet ke - xoa phai xac nhan
//         TUNG FILE, khong bao gio tu xoa hang loat.
//   NC_09B (sua loi chay thu NC_09):
//     (1) SUA LOI: adminXoaFormVatPham con xoa luoi quan theo id 6 o cu -> gay;
//         nay theo 12 o (6 quan x 2 mau).
//     (2) BANG RO CHE DO FORM (#vpCheDoForm): "CHE DO SUA #id" / "CHE DO THEM MOI"
//         hien ro ngay canh nut Luu de khong bam nham tao vat pham trung.
//     (3) CHAN CUNG luu trung MA DINH DANH (moi ma chi thuoc 1 vat pham); tang
//         CSDL them UNIQUE index (supabase_nc09b_thong_nhat_avatar.sql).
//   NC_09: man hinh Vat Pham cho bo_quan_co nay nhap ANH RIENG TUNG MAU:
//     12 o = 6 quan x 2 mau (Trang/Den). Ghi/doc du_lieu dang
//     { trang:{k,q,...}, den:{k,q,...} }. Van doc nguoc duoc du_lieu dang PHANG
//     cu ({k,q,...}) -> do vao ca 2 mau. HUONG DAN 4.6.
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
var adminDsFileMoCoi = [];     // NC_06A-2: cache file mo coi sau khi quet kho

// 6 quan co (dung cho tro ly nhap bo quan co bang anh)
var ADMIN_QUAN_CO = [
  { ma: "k", ten: "Vua",   emojiMau: "♚" },
  { ma: "q", ten: "Hậu",   emojiMau: "♛" },
  { ma: "r", ten: "Xe",    emojiMau: "♜" },
  { ma: "b", ten: "Tượng", emojiMau: "♝" },
  { ma: "n", ten: "Mã",    emojiMau: "♞" },
  { ma: "p", ten: "Tốt",   emojiMau: "♟" }
];

// NC_09: 2 mau quan - moi quan nhap ANH RIENG cho Trang va Den. Khoa du_lieu
// tuong ung: du_lieu = { trang:{k,q,...}, den:{k,q,...} }.
var ADMIN_MAU_QUAN = [
  { ma: "trang", ten: "Trắng" },
  { ma: "den",   ten: "Đen" }
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
 *
 * CHONG TRUNG (NC_06B): dat ten file theo MA BAM SHA-256 cua noi dung (content-
 * addressed). Nho vay file co noi dung Y HET nhau se co CUNG duong dan -> khong
 * tao ban sao trong kho. Neu file da ton tai thi bo qua buoc tai, tra lai link cu.
 * GHI CHU: bucket cong khai + cho phep khoa anon ghi (danh doi da chot o NC_00,
 * quy mo ~3 nguoi choi). crypto.subtle can https (GitHub Pages la https -> ok).
 */
function adminTaiFileLen(file, thuMuc) {
  return file.arrayBuffer()
    .then(function (buf) { return crypto.subtle.digest("SHA-256", buf); })
    .then(function (hashBuf) {
      var hash = adminHexTuBuffer(hashBuf);
      var duoi = adminDuoiFile(file.name);          // .webp / .png / .mp3 ...
      var duongDan = thuMuc + "/" + hash + duoi;
      var layLink = function () {
        return supabaseClient.storage.from(ADMIN_BUCKET_HINH).getPublicUrl(duongDan).data.publicUrl;
      };

      // Neu da co file cung ma bam -> khong tai lai (neu list bi chan quyen thi
      // ham nay tra ve loi, ta bo qua va cu tai len; upsert cung ten van khong nhan doi).
      return supabaseClient.storage.from(ADMIN_BUCKET_HINH)
        .list(thuMuc, { search: hash })
        .then(function (kq) {
          var daCo = kq && kq.data && kq.data.some(function (f) { return f.name === hash + duoi; });
          if (daCo) return layLink();
          return supabaseClient.storage.from(ADMIN_BUCKET_HINH)
            .upload(duongDan, file, { upsert: true, cacheControl: "3600" })
            .then(function (up) {
              if (up.error) throw new Error(up.error.message);
              return layLink();
            });
        });
    });
}

/** Chuoi hex tu ArrayBuffer (dung cho ma bam SHA-256) */
function adminHexTuBuffer(buf) {
  var b = new Uint8Array(buf), s = "";
  for (var i = 0; i < b.length; i++) {
    s += b[i].toString(16).padStart(2, "0");
  }
  return s;
}

/** Lay duoi file (.webp/.png/.mp3...) tu ten, chu thuong; khong co thi tra "" */
function adminDuoiFile(ten) {
  var m = /\.[a-zA-Z0-9]+$/.exec(ten || "");
  return m ? m[0].toLowerCase() : "";
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
  adminDungManHinhHoSoTre();   // NC_06A-2
  adminDungManHinhDonKho();    // NC_06A-2

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
  if (ten === "hosotre")      adminTaiDanhSachTre();   // NC_06A-2
  // "donkho" KHONG tu quet: viec quet doc toan bo kho + CSDL, va la man hinh
  // co rui ro xoa nham -> chi chay khi quan tri chu dong bam nut "Quet Kho".
}


// ================================================================
// PHAN 3: MAN HINH "VAT PHAM"
// ================================================================

function adminDungManHinhVatPham() {
  // NC_09: ve 12 o nhap quan co = 6 quan x 2 mau (Trang/Den). Id o:
  //   vpQuan_<mau>_<quan>, vpFileQuan_<mau>_<quan>, vpXemTruocQuan_<mau>_<quan>.
  var luoi = adminEl("vpLuoiQuan");
  var html = "";
  ADMIN_QUAN_CO.forEach(function (q) {
    ADMIN_MAU_QUAN.forEach(function (mau) {
      var id = mau.ma + "_" + q.ma;
      html +=
        '<div class="adminOAnhQuan">' +
          '<span class="adminNhanQuan">' + q.emojiMau + " " + adminThoat(q.ten) +
            " • " + adminThoat(mau.ten) + "</span>" +
          '<div class="adminXemTruocQuan" id="vpXemTruocQuan_' + id + '">—</div>' +
          '<input type="text" id="vpQuan_' + id + '" placeholder="emoji hoặc link">' +
          '<input type="file" id="vpFileQuan_' + id + '" accept="image/*" style="font-size:0.75rem;">' +
        "</div>";
    });
  });
  luoi.innerHTML = html;

  // Gan su kien cho 12 o
  ADMIN_QUAN_CO.forEach(function (q) {
    ADMIN_MAU_QUAN.forEach(function (mau) {
      var id = mau.ma + "_" + q.ma;
      var nhan = q.ten + " (" + mau.ten + ")";
      adminEl("vpQuan_" + id).addEventListener("input", function () {
        adminVeXemTruocQuan(id);
      });
      adminEl("vpFileQuan_" + id).addEventListener("change", function () {
        var file = this.files[0];
        if (!file) return;
        adminBaoTin("⏳ Đang tải ảnh quân " + nhan + " lên...", true);
        adminTaiFileLen(file, "quan-co")
          .then(function (url) {
            adminEl("vpQuan_" + id).value = url;
            adminVeXemTruocQuan(id);
            adminBaoTin("✅ Đã tải ảnh quân " + nhan + " lên. Nhớ bấm \"Ghi vào ô Dữ liệu\".", true);
          })
          .catch(function (loi) {
            adminBaoTin("❌ Không tải được ảnh: " + loi.message, false);
          });
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

/**
 * NC_09: Gom 12 o quan thanh JSON dang { trang:{k,q,...}, den:{k,q,...} },
 * ghi vao o Du lieu. O trong thi BO QUA khoa do (board.js tu ve ky tu co dien).
 */
function adminGhiJsonBoQuan() {
  var obj = { trang: {}, den: {} };
  var thieu = [];
  ADMIN_QUAN_CO.forEach(function (q) {
    ADMIN_MAU_QUAN.forEach(function (mau) {
      var v = adminEl("vpQuan_" + mau.ma + "_" + q.ma).value.trim();
      if (v) obj[mau.ma][q.ma] = v;
      else thieu.push(q.ten + " (" + mau.ten + ")");
    });
  });

  adminEl("vpDuLieu").value = JSON.stringify(obj);

  if (thieu.length > 0) {
    adminBaoTin("⚠️ Đã ghi. Còn trống: " + thieu.join(", ") +
                ". Ô trống sẽ dùng quân cổ điển mặc định (không sao, up sau cũng được).", false);
  } else {
    adminBaoTin("✅ Đã ghi đủ 12 ô (6 quân × 2 màu) vào ô Dữ liệu.", true);
  }
}

/**
 * NC_09: Doc nguoc JSON trong o Du lieu ra 12 o quan (dung khi sua vat pham cu).
 * Chap nhan CA 2 dinh dang:
 *   - Tach mau: { trang:{...}, den:{...} } -> do dung tung mau.
 *   - Phang cu: { k,q,r,b,n,p }            -> do CHUNG gia tri cho ca Trang lan Den.
 */
function adminDocJsonBoQuan() {
  var obj;
  try {
    obj = JSON.parse(adminEl("vpDuLieu").value || "{}");
  } catch (loi) {
    adminBaoTin("❌ Ô Dữ liệu không phải JSON hợp lệ.", false);
    return;
  }

  var coTachMau = obj && (obj.trang || obj.den);
  ADMIN_QUAN_CO.forEach(function (q) {
    ADMIN_MAU_QUAN.forEach(function (mau) {
      var giaTri;
      if (coTachMau) {
        giaTri = (obj[mau.ma] && obj[mau.ma][q.ma]) || "";
      } else {
        giaTri = obj[q.ma] || ""; // dinh dang phang: dung chung cho ca 2 mau
      }
      adminEl("vpQuan_" + mau.ma + "_" + q.ma).value = giaTri;
      adminVeXemTruocQuan(mau.ma + "_" + q.ma);
    });
  });
  adminBaoTin("✅ Đã đọc dữ liệu ra 12 ô quân (Trắng/Đen).", true);
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
        // NC_06A-2: cot "Da doi" thanh nut 👥 -> xem TRE NAO da doi/mua
        '<td><button class="adminNut adminNutPhu" data-sohuu="' + vp.id + '" type="button" ' +
          'title="Xem trẻ nào đã đổi/mua vật phẩm này">👥 ' + vp.daDoi + "</button></td>" +
        "<td>" + hienThi + "</td>" +
        "<td>" + vp.thuTuHienThi + "</td>" +
        '<td>' +
          '<button class="adminNut" data-suavp="' + vp.id + '" type="button">✏️ Sửa</button> ' +
          '<button class="adminNut adminNutNguyHiem" data-xoavp="' + vp.id + '" type="button">🗑️ Xóa</button>' +
        '</td>' +
      "</tr>";
  });
  than.innerHTML = html;

  var nut = than.querySelectorAll("[data-suavp]");
  for (var i = 0; i < nut.length; i++) {
    nut[i].addEventListener("click", function () {
      adminDoVatPhamVaoForm(parseInt(this.getAttribute("data-suavp"), 10));
    });
  }

  var nutXoa = than.querySelectorAll("[data-xoavp]");
  for (var k = 0; k < nutXoa.length; k++) {
    nutXoa[k].addEventListener("click", function () {
      adminXoaVatPham(parseInt(this.getAttribute("data-xoavp"), 10));
    });
  }

  // NC_06A-2: nut 👥 xem nguoi so huu
  var nutSoHuu = than.querySelectorAll("[data-sohuu]");
  for (var m = 0; m < nutSoHuu.length; m++) {
    nutSoHuu[m].addEventListener("click", function () {
      adminXemNguoiSoHuu(parseInt(this.getAttribute("data-sohuu"), 10));
    });
  }
}

/**
 * NC_06A-2 (a): Hien khoi "Nguoi So Huu" cua 1 vat pham.
 * Danh sach lay tu lich_su_doi_qua (RPC admin_lay_nguoi_so_huu_vat_pham) -
 * moi luot doi 1 dong. LUU Y: vat pham mo khoa theo moc_level la "co san" cho
 * moi tre du level, KHONG nam trong danh sach nay (HUONG DAN 4.6).
 */
function adminXemNguoiSoHuu(id) {
  var khoi = adminEl("khoiNguoiSoHuu");
  khoi.style.display = "block";
  adminEl("tieuDeNguoiSoHuu").textContent = "👥 Người Sở Hữu — đang tải...";
  adminEl("bangNguoiSoHuu").innerHTML = '<tr><td colspan="6" class="adminDangTai">Đang tải...</td></tr>';
  khoi.scrollIntoView({ behavior: "smooth", block: "start" });

  adminGoiRpc("admin_lay_nguoi_so_huu_vat_pham", { p_vat_pham_id: id }).then(function (ph) {
    if (!ph.thanhCong) {
      adminXuLyLoi(ph);
      adminEl("bangNguoiSoHuu").innerHTML = '<tr><td colspan="6" class="adminRong">Không tải được danh sách.</td></tr>';
      return;
    }

    adminEl("tieuDeNguoiSoHuu").textContent = "👥 Người Sở Hữu: \"" + (ph.ten || "") + "\" (#" + id + ")";

    var ghiChu = "Danh sách dưới đây là các lượt đổi/mua thật sự (ghi trong lịch sử đổi quà).";
    if (ph.mocLevel !== null && ph.mocLevel !== undefined) {
      ghiChu += " ⚠️ Vật phẩm này có mốc level " + ph.mocLevel +
        ": mọi trẻ đạt level đó đều được dùng MIỄN PHÍ mà KHÔNG hiện ở đây.";
    }
    adminEl("ghiChuNguoiSoHuu").textContent = ghiChu;

    var ds = ph.danhSachSoHuu || [];
    if (ds.length === 0) {
      adminEl("bangNguoiSoHuu").innerHTML = '<tr><td colspan="6" class="adminRong">Chưa có trẻ nào đổi/mua vật phẩm này.</td></tr>';
      return;
    }

    var html = "";
    ds.forEach(function (sh) {
      var choTrao = (sh.trangThai === "cho_trao");
      var huyHieu = choTrao
        ? '<span class="adminHuyHieu adminHuyHieuCho">Chờ trao</span>'
        : '<span class="adminHuyHieu adminHuyHieuXong">Đã nhận</span>';
      html +=
        "<tr>" +
          "<td><strong>" + adminThoat(sh.tenDangNhap) + "</strong></td>" +
          "<td>Lv " + sh.level + "</td>" +
          "<td>" + sh.giaLucDoi + " 💎</td>" +
          "<td>" + huyHieu + "</td>" +
          "<td>" + adminDinhDangGio(sh.thoiGianDoi) + "</td>" +
          '<td><button class="adminNut adminNutPhu" data-mohoso="' + adminThoat(sh.tenDangNhap) + '" type="button">👦 Xem hồ sơ</button></td>' +
        "</tr>";
    });
    adminEl("bangNguoiSoHuu").innerHTML = html;

    var nut = adminEl("bangNguoiSoHuu").querySelectorAll("[data-mohoso]");
    for (var i = 0; i < nut.length; i++) {
      nut[i].addEventListener("click", function () {
        adminMoHoSoTre(this.getAttribute("data-mohoso"));
      });
    }
  });
}

/**
 * Xóa 1 vật phẩm: hỏi xác nhận -> gọi RPC admin_xoa_vat_pham (xóa dòng + lịch sử
 * đổi của nó) -> xóa luôn file ảnh khỏi Storage cho sạch rác -> tải lại danh sách.
 */
function adminXoaVatPham(id) {
  var vp = null;
  for (var i = 0; i < adminDsVatPham.length; i++) {
    if (adminDsVatPham[i].id === id) { vp = adminDsVatPham[i]; break; }
  }
  if (!vp) return;

  var canhBao = "Xóa hẳn vật phẩm #" + id + " (\"" + (vp.ten || "") + "\")?";
  if (vp.daDoi && vp.daDoi > 0) {
    canhBao += "\n\n⚠️ Vật phẩm này đã được đổi " + vp.daDoi + " lần. Xóa sẽ XÓA LUÔN " +
      "lịch sử đổi của nó (mọi trẻ). Nếu chỉ muốn ngưng bán mà giữ lịch sử, hãy " +
      "bấm Hủy rồi dùng nút \"Sửa\" để đặt Ẩn thay vì xóa.";
  }
  canhBao += "\n\nHành động này KHÔNG hoàn tác được.";
  if (!window.confirm(canhBao)) return;

  adminBaoTin("⏳ Đang xóa vật phẩm...", true);
  adminGoiRpc("admin_xoa_vat_pham", { p_id: id }).then(function (ph) {
    if (!ph.thanhCong) { adminXuLyLoi(ph); return; }

    // Xóa file ảnh khỏi Storage cho sạch (không chặn nếu lỗi quyền Storage)
    adminXoaAnhTrongStorage(ph.danhSachUrlAnh || []).then(function (ketQua) {
      if (ketQua.loi > 0) {
        adminBaoTin("✅ Đã xóa vật phẩm. Nhưng " + ketQua.loi + " ảnh chưa xóa được " +
          "khỏi Storage (có thể do quyền) - chú có thể xóa tay trong Supabase Storage.", true);
      } else if (ketQua.xong > 0) {
        adminBaoTin("✅ Đã xóa vật phẩm và " + ketQua.xong + " ảnh kèm theo.", true);
      } else {
        adminBaoTin("✅ Đã xóa vật phẩm.", true);
      }
      adminXoaFormVatPham();
      adminTaiVatPham();
    });
  });
}

/**
 * Xóa danh sách URL ảnh khỏi Supabase Storage (bucket hinh-vat-pham).
 * Chuyển URL công khai -> đường dẫn trong bucket rồi gọi remove().
 * Trả về Promise {xong, loi}. Không ném lỗi ra ngoài (best-effort).
 */
function adminXoaAnhTrongStorage(danhSachUrl) {
  var moc = "/object/public/" + ADMIN_BUCKET_HINH + "/";
  var duongDan = [];
  (danhSachUrl || []).forEach(function (url) {
    var viTri = (url || "").indexOf(moc);
    if (viTri >= 0) duongDan.push(url.substring(viTri + moc.length));
  });

  if (duongDan.length === 0) {
    return Promise.resolve({ xong: 0, loi: 0 });
  }

  return supabaseClient.storage.from(ADMIN_BUCKET_HINH).remove(duongDan)
    .then(function (kq) {
      if (kq && kq.error) return { xong: 0, loi: duongDan.length };
      return { xong: duongDan.length, loi: 0 };
    })
    .catch(function () {
      return { xong: 0, loi: duongDan.length };
    });
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
  adminCapNhatBangCheDo(vp.id, vp.ten || "");
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
  // NC_09B SUA LOI: luoi quan nay la 12 o (6 quan x 2 mau - NC_09), id moi
  // vpQuan_<mau>_<quan>; vong lap cu theo id 6 o (vpQuan_<quan>) lam ham gay giua chung
  ADMIN_QUAN_CO.forEach(function (q) {
    ADMIN_MAU_QUAN.forEach(function (mau) {
      var id = mau.ma + "_" + q.ma;
      adminEl("vpQuan_" + id).value = "";
      adminEl("vpFileQuan_" + id).value = "";
      adminVeXemTruocQuan(id);
    });
  });
  adminEl("tieuDeFormVatPham").textContent = "➕ Thêm Vật Phẩm Mới";
  adminCapNhatBangCheDo(null, "");
  adminVeXemTruocHinhChinh();
}

/**
 * NC_09B: Bang ro CHE DO FORM ngay canh nut Luu - de khong con bam nham:
 *   - Dang SUA (co id):  Luu = CAP NHAT dung vat pham do, KHONG tao moi.
 *   - Dang THEM (id rong): Luu = TAO vat pham moi.
 */
function adminCapNhatBangCheDo(id, ten) {
  var bang = adminEl("vpCheDoForm");
  if (!bang) return;
  if (id) {
    bang.textContent = "🔒 CHẾ ĐỘ SỬA — bấm Lưu sẽ CẬP NHẬT vật phẩm #" + id +
      (ten ? " (\"" + ten + "\")" : "") + ", KHÔNG tạo vật phẩm mới.";
    bang.style.background = "#fff3cd";
    bang.style.border = "1px solid #e0a800";
  } else {
    bang.textContent = "🆕 CHẾ ĐỘ THÊM MỚI — bấm Lưu sẽ TẠO một vật phẩm mới.";
    bang.style.background = "#d1e7dd";
    bang.style.border = "1px solid #198754";
  }
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

  // NC_09B: CHAN CUNG trung MA DINH DANH (goc cua vu 2 bo Dong Vat cung "Dang
  // Dung"). Ma khac rong ma da thuoc MOT VAT PHAM KHAC -> khong cho luu, chi ra
  // dung vat pham do de quan tri bam Sua tren dong ay. Tang CSDL cung co UNIQUE
  // index chan lop 2 (NC_09B SQL).
  var maMoi = adminEl("vpMaDinhDanh").value.trim();
  if (maMoi) {
    for (var it = 0; it < adminDsVatPham.length; it++) {
      var vpTrung = adminDsVatPham[it];
      if ((vpTrung.maDinhDanh || "") === maMoi && String(vpTrung.id) !== String(idCu)) {
        adminBaoTin("❌ KHÔNG LƯU: mã định danh \"" + maMoi + "\" đã thuộc vật phẩm #" +
          vpTrung.id + " (\"" + (vpTrung.ten || "") + "\"). Mỗi mã chỉ dùng cho MỘT vật phẩm. " +
          "Muốn sửa vật phẩm đó, bấm nút Sửa trên đúng dòng của nó; muốn tạo vật phẩm mới, đặt mã khác.", false);
        return;
      }
    }
  }

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


// ================================================================
// PHAN 10: MAN HINH "HO SO TRE" (NC_06A-2)
// KHONG can RPC quan tri moi: lay_xep_hang() va lay_ho_so() cong khai da tra
// DU truong can xem (LUAT DOC/GHI chot o NC_06A - HUONG DAN muc 5).
// ================================================================

function adminDungManHinhHoSoTre() {
  adminEl("btnLamMoiHoSoTre").addEventListener("click", adminTaiDanhSachTre);
}

function adminTaiDanhSachTre() {
  adminEl("bangDanhSachTre").innerHTML = '<tr><td colspan="10" class="adminDangTai">Đang tải...</td></tr>';
  apiGoiRpc("lay_xep_hang", {}).then(function (ph) {
    if (!ph.thanhCong) {
      adminXuLyLoi(ph);
      adminEl("bangDanhSachTre").innerHTML = '<tr><td colspan="10" class="adminRong">Không tải được danh sách.</td></tr>';
      return;
    }

    var ds = ph.danhSachXepHang || [];
    if (ds.length === 0) {
      adminEl("bangDanhSachTre").innerHTML = '<tr><td colspan="10" class="adminRong">Chưa có tài khoản nào.</td></tr>';
      return;
    }

    var html = "";
    ds.forEach(function (t) {
      html +=
        "<tr>" +
          "<td>" + t.hangThu + "</td>" +
          "<td><strong>" + adminThoat(t.tenDangNhap) + "</strong></td>" +
          "<td>Lv " + t.level + "</td>" +
          "<td>" + adminThoat(t.danhHieu) + "</td>" +
          "<td>" + t.diemSo + " 💎</td>" +
          "<td>" + t.kinhNghiem + "</td>" +
          "<td>" + t.tongTran + "</td>" +
          "<td>" + t.tongThang + "</td>" +
          "<td>" + t.tyLeThang + "%</td>" +
          '<td><button class="adminNut adminNutPhu" data-hoso="' + adminThoat(t.tenDangNhap) + '" type="button">👦 Xem hồ sơ</button></td>' +
        "</tr>";
    });
    adminEl("bangDanhSachTre").innerHTML = html;

    var nut = adminEl("bangDanhSachTre").querySelectorAll("[data-hoso]");
    for (var i = 0; i < nut.length; i++) {
      nut[i].addEventListener("click", function () {
        adminMoHoSoTre(this.getAttribute("data-hoso"));
      });
    }
  });
}

/**
 * Mo ho so chi tiet cua 1 tre. Goi duoc tu 2 noi:
 *   - Nut "Xem ho so" trong man hinh Ho So Tre.
 *   - Nut "Xem ho so" trong khoi Nguoi So Huu (man hinh Vat Pham) -> ham nay
 *     tu CHUYEN sang man hinh Ho So Tre truoc khi tai.
 */
function adminMoHoSoTre(ten) {
  // Chuyen sang man hinh Ho So Tre (dung dung duong di cua adminChuyenManHinh
  // de nut dieu huong sang mau "dang chon" va lazy-load danh sach lan dau)
  var nutManHinh = document.querySelector('.adminNutManHinh[data-manhinh="hosotre"]');
  if (nutManHinh) adminChuyenManHinh("hosotre", nutManHinh);

  var khoi = adminEl("khoiChiTietTre");
  khoi.style.display = "block";
  adminEl("tieuDeChiTietTre").textContent = "📄 Hồ Sơ Chi Tiết: " + ten + " — đang tải...";
  adminEl("htAvatarVaTen").innerHTML = "";
  adminEl("htLuoiThe").innerHTML = "";
  adminEl("htBangVatPham").innerHTML = '<tr><td colspan="3" class="adminDangTai">Đang tải...</td></tr>';
  adminEl("htBangDoiQua").innerHTML = '<tr><td colspan="5" class="adminDangTai">Đang tải...</td></tr>';
  adminEl("htBangTran").innerHTML = '<tr><td colspan="4" class="adminDangTai">Đang tải...</td></tr>';

  apiGoiRpc("lay_ho_so", { p_ten: ten }).then(function (ph) {
    if (!ph.thanhCong) {
      adminXuLyLoi(ph);
      adminEl("tieuDeChiTietTre").textContent = "📄 Hồ Sơ Chi Tiết: " + ten + " — không tải được.";
      return;
    }
    adminVeChiTietTre(ph.hoSo || {});
    khoi.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function adminVeChiTietTre(hoSo) {
  var tt = hoSo.thongTin || {};

  adminEl("tieuDeChiTietTre").textContent = "📄 Hồ Sơ Chi Tiết: " + (tt.tenDangNhap || "");

  // Avatar: ap dung QUY TAC NHAN DIEN URL (HUONG DAN 4.6 - moi cho ve avatar
  // deu phai co): bat dau "http" hoac chua "/" -> ve <img> tron; nguoc lai ve chu/emoji
  var av = tt.avatarDaChon || "";
  var htmlAvatar = adminLaDuongDanAnh(av)
    ? '<img class="adminAvatarHoSo" src="' + adminThoat(av) + '" alt="">'
    : '<span class="adminAvatarHoSoChu">' + (av ? adminThoat(av) : "🙂") + "</span>";
  adminEl("htAvatarVaTen").innerHTML =
    htmlAvatar + ' <strong style="font-size:1.1rem; margin-left:8px;">' + adminThoat(tt.tenDangNhap) + "</strong>" +
    ' <span class="adminGhiChu">(' + adminThoat(tt.danhHieu) + ")</span>";

  // Luoi the so lieu
  function the(nhan, soLieu) {
    return '<div class="adminTheThongTin"><div class="nhan">' + nhan +
           '</div><div class="soLieu">' + soLieu + "</div></div>";
  }
  adminEl("htLuoiThe").innerHTML =
    the("Hạng", "#" + tt.hangThu) +
    the("Level", tt.level) +
    the("Kim cương", tt.diemSo + " 💎") +
    the("EXP", tt.kinhNghiem) +
    the("Đấu máy (thắng / khác)", tt.tranMayThang + " / " + tt.tranMayKhac) +
    the("2 người (T / B / H)", tt.tran2nThang + " / " + tt.tran2nThua + " / " + tt.tran2nHoa) +
    the("Tổng thắng / tổng trận", tt.tongThang + " / " + tt.tongTran) +
    the("Tỷ lệ thắng", tt.tyLeThang + "%");

  // Vat pham so huu (da doi/mua that su - vat pham theo moc level KHONG o day)
  var vps = hoSo.vatPhamSoHuu || [];
  if (vps.length === 0) {
    adminEl("htBangVatPham").innerHTML = '<tr><td colspan="3" class="adminRong">Chưa đổi/mua vật phẩm nào.</td></tr>';
  } else {
    var htmlVp = "";
    vps.forEach(function (vp) {
      htmlVp +=
        "<tr>" +
          "<td>" + adminThoat(vp.loai) + "</td>" +
          "<td>" + adminThoat(vp.ten) + "</td>" +
          "<td><code>" + adminThoat(vp.maDinhDanh) + "</code></td>" +
        "</tr>";
    });
    adminEl("htBangVatPham").innerHTML = htmlVp;
  }

  // Lich su doi qua
  var lsq = hoSo.lichSuDoiQua || [];
  if (lsq.length === 0) {
    adminEl("htBangDoiQua").innerHTML = '<tr><td colspan="5" class="adminRong">Chưa có lượt đổi quà nào.</td></tr>';
  } else {
    var htmlQ = "";
    lsq.forEach(function (ls) {
      var choTrao = (ls.trangThai === "cho_trao");
      var huyHieu = choTrao
        ? '<span class="adminHuyHieu adminHuyHieuCho">Chờ trao</span>'
        : '<span class="adminHuyHieu adminHuyHieuXong">Đã nhận</span>';
      htmlQ +=
        "<tr>" +
          "<td>" + adminThoat(ls.tenVatPham) + "</td>" +
          "<td>" + adminThoat(ls.loai) + "</td>" +
          "<td>" + ls.giaLucDoi + " 💎</td>" +
          "<td>" + huyHieu + "</td>" +
          "<td>" + adminDinhDangGio(ls.thoiGianDoi) + "</td>" +
        "</tr>";
    });
    adminEl("htBangDoiQua").innerHTML = htmlQ;
  }

  // 50 tran gan nhat
  var lst = hoSo.lichSuTran || [];
  if (lst.length === 0) {
    adminEl("htBangTran").innerHTML = '<tr><td colspan="4" class="adminRong">Chưa có trận nào.</td></tr>';
  } else {
    var htmlT = "";
    lst.forEach(function (tr) {
      var kq = tr.ketQua === "thang" ? "🏆 Thắng" : (tr.ketQua === "hoa" ? "🤝 Hòa" : "❌ Thua");
      htmlT +=
        "<tr>" +
          "<td>" + adminDinhDangGio(tr.thoiGian) + "</td>" +
          "<td>" + (tr.cheDo === "may" ? "Đấu máy" : "2 người") + "</td>" +
          "<td>" + adminThoat(tr.doiThu) + "</td>" +
          "<td>" + kq + "</td>" +
        "</tr>";
    });
    adminEl("htBangTran").innerHTML = htmlT;
  }
}


// ================================================================
// PHAN 11: MAN HINH "DON KHO ANH" - FILE MO COI (NC_06A-2)
// Quy trinh AN TOAN (KE HOACH NC_06A-2 muc c):
//   1) Liet ke MOI file trong bucket hinh-vat-pham (storage.list, de quy thu muc).
//   2) Lay MOI URL dang duoc tham chieu trong CSDL qua RPC
//      admin_lay_tham_chieu_storage (4 nguon bat buoc + 1 nguon du phong).
//   3) File co mat trong kho nhung KHONG co trong tham chieu = MO COI.
//   4) CHI liet ke; xoa phai bam 🗑️ va xac nhan TUNG file. Khong xoa hang loat.
// Bucket da co policy select(public) + delete(anon) tu NC_00 (PHAN O cua
// supabase_nang_cap.sql); neu bucket tao tay thieu quyen thi bao loi ro rang.
// ================================================================

function adminDungManHinhDonKho() {
  adminEl("btnQuetKho").addEventListener("click", adminQuetKho);
}

/** Doi so byte thanh chuoi de doc (B / KB / MB) */
function adminDinhDangKichThuoc(soByte) {
  if (soByte === null || soByte === undefined || isNaN(soByte)) return "—";
  if (soByte < 1024) return soByte + " B";
  if (soByte < 1024 * 1024) return (soByte / 1024).toFixed(1) + " KB";
  return (soByte / (1024 * 1024)).toFixed(2) + " MB";
}

/**
 * Liet ke DE QUY moi file trong bucket, bat dau tu tien to (thu muc) cho truoc.
 * Supabase tra thu muc la muc KHONG co id -> goi lai chinh ham nay cho thu muc do.
 * Bo qua file ky thuat ".emptyFolderPlaceholder" (Supabase tu tao cho thu muc rong).
 * Tra ve Promise<mang {duongDan, kichThuoc, suaLanCuoi}>.
 */
function adminLietKeKho(tienTo) {
  return supabaseClient.storage.from(ADMIN_BUCKET_HINH)
    .list(tienTo, { limit: 1000 })
    .then(function (kq) {
      if (kq.error) throw new Error(kq.error.message);

      var viecCon = [];
      var dsFile = [];
      (kq.data || []).forEach(function (muc) {
        if (!muc || !muc.name || muc.name.charAt(0) === ".") return;
        var duongDan = tienTo ? tienTo + "/" + muc.name : muc.name;
        if (muc.id === null || muc.id === undefined) {
          viecCon.push(adminLietKeKho(duongDan));   // la thu muc -> quet tiep
        } else {
          dsFile.push({
            duongDan:   duongDan,
            kichThuoc:  (muc.metadata && muc.metadata.size) || null,
            suaLanCuoi: muc.updated_at || muc.created_at || null
          });
        }
      });

      return Promise.all(viecCon).then(function (cacMang) {
        cacMang.forEach(function (mg) { dsFile = dsFile.concat(mg); });
        return dsFile;
      });
    });
}

/** Doi URL cong khai -> duong dan trong bucket; khong thuoc bucket nay tra null */
function adminUrlSangDuongDan(url) {
  var moc = "/object/public/" + ADMIN_BUCKET_HINH + "/";
  var viTri = (url || "").indexOf(moc);
  if (viTri < 0) return null;
  var duongDan = url.substring(viTri + moc.length);
  var dauHoi = duongDan.indexOf("?");
  if (dauHoi >= 0) duongDan = duongDan.substring(0, dauHoi);
  try { return decodeURIComponent(duongDan); } catch (loi) { return duongDan; }
}

function adminQuetKho() {
  var nut = adminEl("btnQuetKho");
  nut.disabled = true;
  adminEl("dkTrangThai").textContent = "⏳ Đang quét kho và cơ sở dữ liệu...";
  adminEl("bangFileMoCoi").innerHTML = '<tr><td colspan="5" class="adminDangTai">Đang quét...</td></tr>';

  Promise.all([
    adminGoiRpc("admin_lay_tham_chieu_storage", {}),
    adminLietKeKho("")
  ]).then(function (kq) {
    nut.disabled = false;
    var phTC = kq[0];        // tham chieu tu CSDL
    var dsKho = kq[1];       // file thuc te trong bucket

    if (!phTC.thanhCong) {
      adminXuLyLoi(phTC);
      adminEl("dkTrangThai").textContent = "❌ Không lấy được danh sách tham chiếu từ máy chủ (đã chạy file SQL NC_06A-2 chưa?).";
      adminEl("bangFileMoCoi").innerHTML = '<tr><td colspan="5" class="adminRong">Quét thất bại.</td></tr>';
      return;
    }

    // Tap hop duong dan dang duoc dung
    var dangDung = {};
    (phTC.danhSachUrl || []).forEach(function (url) {
      var dd = adminUrlSangDuongDan(url);
      if (dd) dangDung[dd] = true;
    });

    adminDsFileMoCoi = dsKho.filter(function (f) { return !dangDung[f.duongDan]; });

    adminEl("dkTrangThai").textContent =
      "📊 Kho có " + dsKho.length + " file — đang dùng " +
      (dsKho.length - adminDsFileMoCoi.length) + " — mồ côi " + adminDsFileMoCoi.length + ".";
    adminVeBangFileMoCoi();
  }).catch(function (loi) {
    nut.disabled = false;
    adminEl("dkTrangThai").textContent = "❌ Không quét được kho: " + loi.message +
      " (kiểm tra bucket hinh-vat-pham đã cho phép ĐỌC (select) chưa - xem PHẦN O của supabase_nang_cap.sql).";
    adminEl("bangFileMoCoi").innerHTML = '<tr><td colspan="5" class="adminRong">Quét thất bại.</td></tr>';
  });
}

function adminVeBangFileMoCoi() {
  var than = adminEl("bangFileMoCoi");
  if (adminDsFileMoCoi.length === 0) {
    than.innerHTML = '<tr><td colspan="5" class="adminRong">🎉 Không có file mồ côi nào — kho đang sạch.</td></tr>';
    return;
  }

  var html = "";
  adminDsFileMoCoi.forEach(function (f, chiSo) {
    var url = supabaseClient.storage.from(ADMIN_BUCKET_HINH).getPublicUrl(f.duongDan).data.publicUrl;
    var duoi = adminDuoiFile(f.duongDan);
    var xemTruoc;
    if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].indexOf(duoi) >= 0) {
      xemTruoc = '<img class="adminAnhXemTruoc" style="max-width:48px;max-height:48px;" src="' + adminThoat(url) + '" alt="">';
    } else if ([".mp3", ".wav", ".ogg", ".m4a"].indexOf(duoi) >= 0) {
      xemTruoc = '<button class="adminNut adminNutPhu" data-nghefile="' + chiSo + '" type="button">▶️</button>';
    } else {
      xemTruoc = "—";
    }

    html +=
      "<tr>" +
        "<td><code>" + adminThoat(f.duongDan) + "</code></td>" +
        "<td>" + adminDinhDangKichThuoc(f.kichThuoc) + "</td>" +
        "<td>" + adminDinhDangGio(f.suaLanCuoi) + "</td>" +
        "<td>" + xemTruoc + "</td>" +
        '<td><button class="adminNut adminNutNguyHiem" data-xoafile="' + chiSo + '" type="button">🗑️ Xóa</button></td>' +
      "</tr>";
  });
  than.innerHTML = html;

  var nutNghe = than.querySelectorAll("[data-nghefile]");
  for (var i = 0; i < nutNghe.length; i++) {
    nutNghe[i].addEventListener("click", function () {
      var f = adminDsFileMoCoi[parseInt(this.getAttribute("data-nghefile"), 10)];
      if (!f) return;
      var url = supabaseClient.storage.from(ADMIN_BUCKET_HINH).getPublicUrl(f.duongDan).data.publicUrl;
      new Audio(url).play().catch(function () {
        adminBaoTin("❌ Không phát được file âm thanh này.", false);
      });
    });
  }

  var nutXoa = than.querySelectorAll("[data-xoafile]");
  for (var j = 0; j < nutXoa.length; j++) {
    nutXoa[j].addEventListener("click", function () {
      adminXoaFileMoCoi(parseInt(this.getAttribute("data-xoafile"), 10), this);
    });
  }
}

/** Xoa 1 file mo coi - LUON hoi xac nhan rieng tung file (khong xoa hang loat) */
function adminXoaFileMoCoi(chiSo, nut) {
  var f = adminDsFileMoCoi[chiSo];
  if (!f) return;

  if (!window.confirm(
    "Xóa hẳn file này khỏi kho?\n\n" + f.duongDan +
    "\n\nFile này hiện KHÔNG được dùng ở đâu trong cơ sở dữ liệu (theo lần quét gần nhất)." +
    "\nHành động này KHÔNG hoàn tác được.")) return;

  nut.disabled = true;
  supabaseClient.storage.from(ADMIN_BUCKET_HINH).remove([f.duongDan])
    .then(function (kq) {
      if (kq.error) throw new Error(kq.error.message);
      adminDsFileMoCoi.splice(chiSo, 1);
      adminBaoTin("✅ Đã xóa file " + f.duongDan + ".", true);
      adminEl("dkTrangThai").textContent = "📊 Còn " + adminDsFileMoCoi.length + " file mồ côi (theo lần quét gần nhất).";
      adminVeBangFileMoCoi();  // ve lai de chi so cac nut khop mang moi
    })
    .catch(function (loi) {
      nut.disabled = false;
      adminBaoTin("❌ Không xóa được file: " + loi.message +
        " (kiểm tra bucket đã cho phép XÓA (delete) cho anon chưa - xem hướng dẫn kèm bước này).", false);
    });
}
