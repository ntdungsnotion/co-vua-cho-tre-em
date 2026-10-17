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
   THÊM TỪ: dùng công cụ nạp từ, công cụ ghi vào kc/tu_vung/tu_cap1..4.js (không sửa ở đây).
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST = goc.ST || {};
  const TV = goc.KC_TU_VUNG || { cap: {} };

  const KHO = {};
  [1, 2, 3, 4].forEach(cap => { KHO[cap] = (TV.cap[cap] || []).map(t => [t.en, t.e, t.vi]); });
  ST.KHO_TU = KHO;
})(typeof window !== "undefined" ? window : globalThis);
