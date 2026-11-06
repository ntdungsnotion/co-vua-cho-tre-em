// ================================================================
// FILE: dt/dt_roi_do.js
// CHỨC NĂNG: QUÁI RƠI ĐỒ của Đấu Trường Tri Thức (repo_rieng dac_ta_roi_do.md). Lõi gieo dùng chung cho máy chủ thử
//            (dt_may_chu.js) và trang (hiện "Có thể rơi"); máy chủ thật làm đúng luật này bằng SQL kc_dt_gieo_roi
//            (repo_rieng SQL/supabase_tc_d06c4_roi_do.sql).
//            Bảng rơi đồ (giống RPC kc_dt_doc_roi_do / khối cau_hinh.json roiDo):
//              { vatPham: { ma: { ten, bieuTuong, nhom: "tai_nguyen" | "vat_pham", soTu, soDen, themMoiLv } },
//                quai: { maQuai: [[maDo, tiLe %], ...] (tối đa 7 ô) }, macDinh: [[maDo, tiLe %], ...] (quái chưa có dòng) }
//            - oRoi(bang, maQuai): 7 ô của quái (bỏ ô trống / tỉ lệ 0); quái chưa có dòng -> macDinh.
//            - gieo(bang, maQuai, lv, rnd): mỗi ô gieo riêng (rnd() * 100 < tiLe), số = soTu..soDen + làm tròn(themMoiLv x (Lv - 1)),
//              hai ô cùng mã cộng dồn -> [{ ma, so }].
//            - chuRoi(bang, ds): "+12 🍖 · +5 🪵" cho dòng báo.
//            Không đụng DOM: chạy được trong node.
// BƯỚC: TC_D06C4 - NGÀY: 06/11/2026
// ================================================================
(function (goc) {
  "use strict";

  function oRoi(bang, maQuai) {
    const ds = bang && bang.quai && Array.isArray(bang.quai[maQuai]) ? bang.quai[maQuai] : (bang && bang.macDinh) || [];
    return ds.slice(0, 7).filter(o => Array.isArray(o) && o[0] && Number(o[1]) > 0);
  }

  function gieo(bang, maQuai, lv, rnd) {
    rnd = rnd || Math.random;
    const cong = new Map();
    for (const [ma, tiLe] of oRoi(bang, maQuai)) {
      if (!(rnd() * 100 < Number(tiLe))) continue;
      const vp = bang.vatPham && bang.vatPham[ma];
      if (!vp) continue;
      const tu = Math.min(vp.soTu, vp.soDen), den = Math.max(vp.soTu, vp.soDen);
      const so = tu + Math.floor(rnd() * (den - tu + 1)) + Math.floor((vp.themMoiLv || 0) * (Math.max(1, Math.floor(lv) || 1) - 1) + 0.5);
      if (so > 0) cong.set(ma, (cong.get(ma) || 0) + so);
    }
    return [...cong].map(([ma, so]) => ({ ma, so }));
  }

  const bieuTuong = (bang, ma) => (bang && bang.vatPham && bang.vatPham[ma] && bang.vatPham[ma].bieuTuong) || "🎁";
  const chuRoi = (bang, ds) => (ds || []).map(d => "+" + (d.duoc != null ? d.duoc : d.so) + " " + (d.bieuTuong || bieuTuong(bang, d.ma))).join(" · ");

  goc.KC_DT_ROI_DO = { oRoi, gieo, bieuTuong, chuRoi };
})(typeof window !== "undefined" ? window : globalThis);
// 06/11/2026 - BƯỚC: TC_D06C4
