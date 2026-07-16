// ================================
// FILE: api.js
// CHUC NANG: Goi cac ham RPC tren Supabase
//            (dang_ky, dang_nhap, cap_nhat_diem, lay_xep_hang, lay_cau_hinh,
//             tru_diem_goi_y, lay_thong_tin_ca_nhan, lay_ho_so, cap_nhat_avatar,
//             cap_nhat_trang_bi, lay_lich_su_tran, lay_thong_ke_doi_thu, lay_bo_co)
// BUOC: NC_09 (nang cap tu NC_05) - NGAY: 11/07/2026
//       NC_05: them 6 ham cho "Thanh Thong Tin Tren Cung" + "Trang Tai Khoan".
//       NC_09: them apiLayBoCo() - lay danh sach bo quan co (du lieu tung quan) de
//              taikhoan_NC.js cho tre CHON bo, va board.js PHAN GIAI ma dinh danh
//              dang trang bi ra du_lieu that (HUONG DAN 4.6, KE HOACH NC_09)
// QUY UOC: GIU NGUYEN ten ham va kieu tra ve Promise/.then() giong ban cu,
//          de app.js / auth.js / board.js / rank.js / taikhoan_NC.js KHONG phai
//          sua logic goi API da co
// PHU THUOC: config.js (bien supabaseClient) phai duoc nap TRUOC file nay
//
// DIEM MOI CUA NC_05 (backend cac RPC nay da co san tu NC_00, file nay CHI THEM
// HAM BOC (wrapper) o phia giao dien, KHONG doi cau truc CSDL):
//   - apiLayThongTinCaNhan(tenDangNhap): RPC lay_thong_tin_ca_nhan(p_ten) - ban NHE,
//     dung cho Thanh Thong Tin Tren Cung (avatar, kim cuong, EXP, level, danh hieu,
//     hang). Goi lai sau moi van/giao dich de luon dung so lieu (app.js quan ly).
//   - apiLayHoSo(tenDangNhap): RPC lay_ho_so(p_ten) - ban DAY DU cho Trang Tai
//     Khoan: thongTin + vatPhamSoHuu (vat pham so da doi) + lichSuDoiQua + 50
//     tran gan nhat (lichSuTran).
//   - apiCapNhatAvatar(tenDangNhap, avatar): RPC cap_nhat_avatar(p_ten, p_avatar).
//   - apiCapNhatTrangBi(tenDangNhap, loai, ma): RPC cap_nhat_trang_bi(p_ten, p_loai,
//     p_ma) - loai: 'avatar' | 'bo_quan_co' | 'ban_co' | 'hieu_ung'.
//   - apiLayLichSuTran(tenDangNhap): RPC lay_lich_su_tran(p_ten) - lam moi RIENG
//     bang 50 tran gan nhat (nhe hon goi lai ca lay_ho_so).
//   - apiLayThongKeDoiThu(tenDangNhap): RPC lay_thong_ke_doi_thu(p_ten) - gom nhom
//     lich su tran theo doi thu (ke ca may), dung cho muc "Thong Ke Theo Doi Thu".
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
 * (duLieuTaiKhoan gom: tenDangNhap, level, diemSo, avatarDaChon, vaiTro,
 *  kinhNghiem, maPhien, trangBi - day du tu NC_00)
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
 * Moi nguoi choi trong danhSachXepHang co du: hangThu, tenDangNhap, avatarDaChon,
 * level, diemSo, kinhNghiem, danhHieu, thangMay, thangNguoi, tongThang,
 * tongTranMay, tongTranNguoi, tongTran, tyLeThang, tyLeThangMay, tyLeThangNguoi
 * (NC_05: rank.js tu sap theo 7 kieu tren trinh duyet, KHONG goi lai may chu)
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
 * KHONG can sua code (tu NC_06A se sua duoc ngay tren trang Quan Tri).
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

/**
 * NC_05: Ham lay thong tin ca nhan BAN NHE, dung cho "Thanh Thong Tin Tren Cung".
 * Tra ve Promise: { thanhCong, thongBao, thongTin }
 * thongTin gom: tenDangNhap, level, diemSo, kinhNghiem, danhHieu, avatarDaChon,
 * trangBi, vaiTro, hangThu, tranMayThang, tranMayKhac, tran2nThang, tran2nThua,
 * tran2nHoa, tongThang, tongTran, tyLeThang (%, 1 chu so thap phan)
 */
function apiLayThongTinCaNhan(tenDangNhap) {
  return apiGoiRpc("lay_thong_tin_ca_nhan", { p_ten: tenDangNhap });
}

/**
 * NC_05: Ham lay ho so BAN DAY DU, dung cho Trang Tai Khoan.
 * Tra ve Promise: { thanhCong, thongBao, hoSo }
 * hoSo gom: thongTin (giong lay_thong_tin_ca_nhan), vatPhamSoHuu (mang vat pham
 * SO da doi - moi loai tru 'qua'), lichSuDoiQua (mang lich su doi thuong CUA
 * CHINH MINH), lichSuTran (mang 50 tran gan nhat)
 */
function apiLayHoSo(tenDangNhap) {
  return apiGoiRpc("lay_ho_so", { p_ten: tenDangNhap });
}

/**
 * NC_05: Ham doi avatar (chi doi avatar_da_chon + khoa 'avatar' trong trang_bi).
 * Tra ve Promise: { thanhCong, thongBao, avatarDaChon }
 */
function apiCapNhatAvatar(tenDangNhap, avatarMoi) {
  return apiGoiRpc("cap_nhat_avatar", { p_ten: tenDangNhap, p_avatar: avatarMoi });
}

/**
 * NC_05: Ham trang bi 1 vat pham so da so huu (bo_quan_co / ban_co / hieu_ung /
 * avatar). Ghi vao cot trang_bi (jsonb) cua tai_khoan; board.js doc trang_bi nay
 * de ve ban co/hieu ung tu NC_03.
 * Tra ve Promise: { thanhCong, thongBao, trangBi }
 */
function apiCapNhatTrangBi(tenDangNhap, loai, maDinhDanh) {
  return apiGoiRpc("cap_nhat_trang_bi", {
    p_ten: tenDangNhap,
    p_loai: loai,
    p_ma: maDinhDanh
  });
}

/**
 * NC_05: Ham lam moi RIENG bang 50 tran gan nhat (nhe hon goi lai lay_ho_so).
 * Tra ve Promise: { thanhCong, thongBao, lichSuTran }
 */
function apiLayLichSuTran(tenDangNhap) {
  return apiGoiRpc("lay_lich_su_tran", { p_ten: tenDangNhap });
}

/**
 * NC_05: Ham lay thong ke gom nhom theo DOI THU (ke ca "May cap N").
 * Tra ve Promise: { thanhCong, thongBao, thongKeDoiThu }
 * Moi dong: doiThu, cheDo ('may'|'nguoi'), tongTran, thang, thua, hoa
 * Sap mac dinh (may chu tu sap): so tran THANG giam dan -> tong tran giam dan.
 */
function apiLayThongKeDoiThu(tenDangNhap) {
  return apiGoiRpc("lay_thong_ke_doi_thu", { p_ten: tenDangNhap });
}

/**
 * NC_09: Ham lay danh sach BO QUAN CO (loai='bo_quan_co', dang hien thi).
 * RPC lay_bo_co() - CONG KHAI (khong can ten), tra ve du_lieu tung quan.
 * Tra ve Promise: { thanhCong, thongBao, danhSachBoCo }
 * Moi bo: { id, maDinhDanh, ten, moTa, urlHinh, duLieu, mocLevel }
 *   duLieu co the la { k,q,r,b,n,p } (dung chung 2 mau) HOAC
 *   { trang:{k,q,...}, den:{k,q,...} } (anh rieng tung mau - NC_09).
 * Dung cho 2 noi:
 *   - taikhoan_NC.js: liet ke bo co da mo khoa (mocLevel <= level) de tre CHON.
 *   - board.js: dung ma dinh danh dang trang bi tra cuu ra duLieu that de ve quan.
 */
function apiLayBoCo() {
  return apiGoiRpc("lay_bo_co", {});
}
