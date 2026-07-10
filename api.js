// ================================
// FILE: api.js
// CHUC NANG: Goi cac ham RPC tren Supabase
//            (dang_ky, dang_nhap, cap_nhat_diem, lay_xep_hang, lay_cau_hinh,
//             tru_diem_goi_y)
// BUOC: NC_03 (nang cap tu NC_02)
// QUY UOC: GIU NGUYEN ten ham va kieu tra ve Promise/.then() giong ban cu,
//          de app.js / auth.js / board.js / rank.js KHONG phai sua logic
// PHU THUOC: config.js (bien supabaseClient) phai duoc nap TRUOC file nay
//
// DIEM MOI CUA NC_01/NC_02:
//   - Them apiLayCauHinh(): goi RPC lay_cau_hinh, tra ve 1 luc:
//       cauHinhChung (bang cau_hinh_chung), cauHinhCapDo (20 cap may),
//       loiDongVien (cac cau khen/co vu dang hien thi).
//     board.js goi ham nay DUNG 1 LAN luc khoi dong trang.
//
// DIEM MOI CUA NC_03:
//   - Them apiTruDiemGoiY(): goi RPC tru_diem_goi_y khi tre dung nut "Goi Y".
//     MAY CHU tu tra chi phi theo Level TAI KHOAN (bang cau_hinh_cap_do), tu tru
//     kim cuong (khong bao gio am, khong tru EXP) - board.js KHONG tu tinh so tru.
//   - GIA DINH THAM SO: RPC tru_diem_goi_y da duoc tao san tu buoc NC_00 (backend).
//     Ham nay goi voi { p_ten: tenDangNhap } - GIONG HET quy uoc cua apiCapNhatDiem
//     (xac thuc don gian bang ten dang nhap, khong can ma_phien vi day khong phai
//     RPC quan tri). NEU RPC that su dinh nghia ten tham so khac thi CHI CAN SUA
//     LAI 1 DONG trong ham apiTruDiemGoiY ben duoi, khong anh huong file nao khac.
// ================================

/**
 * Ham phu tro: goi 1 ham RPC tren Supabase va tra ve Promise chua ket qua JSON
 * Neu loi mang hoac loi may chu: tra ve object { thanhCong: false, thongBao: ... }
 * de cac file giao dien hien thong bao ma khong bi vo trang
 */
function apiGoiRpc(tenHam, thamSo) {
  return supabaseClient
    .rpc(tenHam, thamSo)
    .then(function (phanHoi) {
      // phanHoi co dang { data, error }
      if (phanHoi.error) {
        return {
          thanhCong: false,
          thongBao: "Loi may chu: " + phanHoi.error.message
        };
      }
      return phanHoi.data;
    })
    .catch(function (loi) {
      return {
        thanhCong: false,
        thongBao: "Loi ket noi mang, vui long thu lai: " + loi.message
      };
    });
}

/**
 * Ham dang ky tai khoan moi
 * Tra ve Promise: { thanhCong, thongBao, duLieuTaiKhoan }
 */
function apiDangKy(tenDangNhap, matKhau) {
  return apiGoiRpc("dang_ky", { p_ten: tenDangNhap, p_mat_khau: matKhau });
}

/**
 * Ham dang nhap
 * Tra ve Promise: { thanhCong, thongBao, duLieuTaiKhoan }
 */
function apiDangNhap(tenDangNhap, matKhau) {
  return apiGoiRpc("dang_nhap", { p_ten: tenDangNhap, p_mat_khau: matKhau });
}

/**
 * Ham cap nhat diem va cap do sau khi ket thuc 1 van co
 * ketQua: "thang" | "thua" | "hoa"
 * Tra ve Promise: { thanhCong, thongBao, ketQuaCapNhat }
 */
function apiCapNhatDiem(tenDangNhap, ketQua, levelMay) {
  return apiGoiRpc("cap_nhat_diem", {
    p_ten: tenDangNhap,
    p_ket_qua: ketQua,
    p_level_may: levelMay
  });
}

/**
 * Ham lay bang xep hang
 * Tra ve Promise: { thanhCong, thongBao, danhSachXepHang }
 */
function apiLayXepHang() {
  return apiGoiRpc("lay_xep_hang", {});
}

/**
 * Ham lay toan bo cau hinh he thong (NC_01, NC_02, NC_03)
 * Tra ve Promise: {
 *   thanhCong, thongBao,
 *   cauHinhChung: { khoa: giaTri, ... },
 *   cauHinhCapDo: [ { capDo, tyLeNgauNhien, skillLevel, doSau, goiYGioiHan, goiYChiPhi }, ... ],
 *   loiDongVien: [ { loai, noiDung }, ... ]
 * }
 * Muon doi do kho cua may hoac doi loi khen: sua truc tiep trong Supabase Table Editor,
 * KHONG can sua code.
 */
function apiLayCauHinh() {
  return apiGoiRpc("lay_cau_hinh", {});
}

/**
 * Ham tru kim cuong khi tre dung nut "Goi Y" (NC_03).
 * MAY CHU tu tra chi phi theo Level TAI KHOAN (bang cau_hinh_cap_do) va tu tru,
 * KHONG BAO GIO am, KHONG tru EXP. board.js chi goi ham nay, khong tu tinh so tru.
 * Tra ve Promise: { thanhCong, thongBao, diemMoi }
 */
function apiTruDiemGoiY(tenDangNhap) {
  return apiGoiRpc("tru_diem_goi_y", { p_ten: tenDangNhap });
}
