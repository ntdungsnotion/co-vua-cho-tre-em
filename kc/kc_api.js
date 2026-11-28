// ================================================================
// FILE: kc_api.js
// CHỨC NĂNG: Lớp gọi RPC DÙNG CHUNG cho mọi module của Kids Challenge - bọc
//            kcSupabaseClient.rpc() thành 1 hàm duy nhất, đổi lỗi mạng/máy
//            chủ thành { thanhCong:false, thongBao } để giao diện không vỡ
//            trang (mẫu hình y hệt api.js của Cờ Vua - xem Sổ Tay mục A6/D2).
// BƯỚC: KC_00
// NGÀY: 17/07/2026
// PHỤ THUỘC: kc_config.js (biến kcSupabaseClient) phải nạp TRƯỚC file này.
// ================================================================

/**
 * Gọi 1 RPC Supabase, luôn trả về Promise<Object> có { thanhCong, thongBao, ... }.
 * @param {string} tenHam   Tên hàm RPC trên Supabase (vd: "dang_nhap")
 * @param {Object} thamSo   Object tham số truyền cho RPC (vd: { p_ten: "..." })
 */
function kcGoiRpc(tenHam, thamSo) {
  return kcSupabaseClient.rpc(tenHam, thamSo || {}).then(function (ketQua) {
    if (ketQua.error) {
      return { thanhCong: false, thongBao: "Không kết nối được máy chủ, con thử lại nhé." };
    }
    var du = ketQua.data;
    // KC_00D2-B2: máy chủ từ chối vì phiên -> hỏi ngay phiên còn dùng được không (chung/phien.js)
    if (du && (du.ma === "dang_nhap" || du.ma === "phien_het_han") && window.KC_PHIEN) window.KC_PHIEN.kiemNgay();
    return du;
  }).catch(function () {
    return { thanhCong: false, thongBao: "Không kết nối được máy chủ, con thử lại nhé." };
  });
}
