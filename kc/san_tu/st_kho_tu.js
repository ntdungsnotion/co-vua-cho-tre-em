/* ================================================================
   FILE: san_tu/st_kho_tu.js
   CHỨC NĂNG: KHO TỪ VỰNG của game Săn Từ, chia 4 cấp theo độ khó:
                cấp 1 (Dễ)        - từ ngắn, bé gặp hằng ngày
                cấp 2 (Trung bình) - từ thông dụng
                cấp 3 (Khó)        - từ dài hơn, ít gặp hơn
                cấp 4 (Thử thách)  - từ dài, ít quen, dễ nhầm
              Từ KHÔNG gắn với loại quái: chướng ngại vật nào cũng bốc từ trong kho
              của cấp đang chơi, nên thêm bao nhiêu từ cũng được.
   BƯỚC: TC_00B (15/10/2026: mở rộng từ 130 lên hơn 450 từ)
   CẬP NHẬT: 17/10/2026 - TC_T01: từ chuyển sang KHO DÙNG CHUNG TOÀN APP (kc/tu_vung/,
             nạp trước file này). File này chỉ đổi kho chung sang dạng game đang dùng:
             ST.KHO_TU[cấp] = [[từ, hình, nghĩa], ...].
   CẬP NHẬT: 20/10/2026 - TC_T03A: kho chung tải từ kc/tu_vung/kho_tu.json (bất đồng bộ): mảng
             ST.KHO_TU[cấp] được điền lại mỗi khi kho nạp xong; phần tử thứ 4 là file hình riêng.
             ST.KHO_TU[cấp] = [[từ, emoji, nghĩa, hình riêng], ...].
   THÊM TỪ: dùng công cụ nạp từ (ghi vào kc/tu_vung/kho_tu.json) hoặc tab Kho từ của trang quản trị.
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST = goc.ST || {};
  const TV = goc.KC_TU_VUNG;

  // Mảng của từng cấp giữ nguyên (st_tu_vung.js giữ tham chiếu), chỉ thay nội dung khi kho nạp xong
  const KHO = { 1: [], 2: [], 3: [], 4: [] };
  if (TV) TV.khiNap(() => [1, 2, 3, 4].forEach(cap => {
    KHO[cap].length = 0;
    (TV.cap[cap] || []).forEach(t => KHO[cap].push([t.en, t.e, t.vi, t.hinh || ""]));
  }));
  ST.KHO_TU = KHO;
})(typeof window !== "undefined" ? window : globalThis);
