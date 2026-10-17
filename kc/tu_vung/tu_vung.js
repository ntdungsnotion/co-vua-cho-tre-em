/* ================================================================
   FILE: kc/tu_vung/tu_vung.js
   CHỨC NĂNG: KHO TỪ VỰNG TIẾNG ANH DÙNG CHUNG TOÀN APP (KC_TU_VUNG).
              Mọi game, bài học dùng chung một kho, chia 4 cấp khó dần:
                cấp 1 (Dễ), cấp 2 (Trung bình), cấp 3 (Khó), cấp 4 (Thử thách).
              Dữ liệu nằm ở tu_cap1.js .. tu_cap4.js (nạp SAU file này), mỗi dòng
              "từ|hình|nghĩa|chủ đề"; hình là 1-3 emoji, chủ đề có thể trống.
              Các file cấp do công cụ nạp từ ghi ra, không sửa tay.
              Tiến độ học của bé KHÔNG lưu ở đây (xem sổ ghi nhớ của từng game).
   CÁCH DÙNG: KC_TU_VUNG.cap[1] -> [{ en, e, vi, cd }, ...]
   BƯỚC: TC_T01
   NGÀY: 17/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const TV = goc.KC_TU_VUNG = goc.KC_TU_VUNG || {};
  TV.SO_CAP = 4;
  TV.cap = TV.cap || { 1: [], 2: [], 3: [], 4: [] };

  // Thêm cả khối dòng "từ|hình|nghĩa|chủ đề" vào một cấp
  TV.them = function (cap, chu) {
    const ds = TV.cap[cap] = TV.cap[cap] || [];
    chu.split("\n").map(d => d.trim()).filter(Boolean).forEach(d => {
      const [en = "", e = "", vi = "", cd = ""] = d.split("|").map(s => s.trim());
      if (en) ds.push({ en, e, vi, cd });
    });
  };
})(typeof window !== "undefined" ? window : globalThis);
