/* ================================================================
   FILE: caro/cr_may_nghi.js
   CHỨC NĂNG: WEB WORKER - máy Caro nghĩ ở luồng riêng (TC_02C) để màn hình không đơ khi
              cấp cao nghĩ tới 2 giây. Trang game gửi {id, nuocDi, cap}, nhận lại {id, o}
              (o = ô máy đi, -1 nếu lỗi - trang tự đi bằng bộ não cũ).
              Nạp thư viện Gomoku Engine + lõi Caro bằng đường dẫn tương đối (không CDN).
   BƯỚC: TC_02C
   NGÀY: 21/10/2026 23:22
   PHỤ THUỘC: caro/thu_vien/gomoku_engine.js, caro/cr_logic.js (CR.mayDiCap)
   ================================================================ */
importScripts("thu_vien/gomoku_engine.js", "cr_logic.js");

self.onmessage = function (su) {
  const d = su.data || {};
  let o = -1;
  try {
    o = self.CR.mayDiCap(Array.isArray(d.nuocDi) ? d.nuocDi : [], Number(d.cap) || 1, Math.random, self.GomokuEngine);
  } catch (e) { o = -1; }
  self.postMessage({ id: d.id, o: o });
};
// 21/10/2026 23:22 - BƯỚC: TC_02C
