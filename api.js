// ================================
// FILE: api.js
// CHUC NANG: Goi 4 ham RPC tren Supabase (dang_ky, dang_nhap, cap_nhat_diem, lay_xep_hang)
// BUOC: MIG_02
// QUY UOC: GIU NGUYEN ten ham va kieu tra ve Promise/.then() giong ban cu,
//          de app.js / auth.js / board.js / rank.js KHONG phai sua logic
// PHU THUOC: config.js (bien supabaseClient) phai duoc nap TRUOC file nay
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
 * ketQua: "thang" hoac "thua"
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
 * Ham lay bang xep hang top 10
 * Tra ve Promise: { thanhCong, thongBao, danhSachXepHang }
 */
function apiLayXepHang() {
  return apiGoiRpc("lay_xep_hang", {});
}