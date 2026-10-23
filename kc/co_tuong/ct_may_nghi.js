/* ================================================================
   FILE: co_tuong/ct_may_nghi.js
   CHỨC NĂNG: WEB WORKER - máy Cờ Tướng nghĩ ở luồng riêng để màn hình không đơ khi
              cấp cao nghĩ tới 2-3 giây. Trang game gửi {id, nuocDi, cap}, nhận lại {id, n}
              (n = nước máy đi tu * 90 + den, -1 nếu lỗi - trang tự nghĩ ở luồng chính).
              Ván mới (nuocDi ít hơn 2 nước) thì xoá bảng ghi nhớ.
              TC_03E: {goiY: true, giay} = tìm nước GỢI Ý cho bé (CT.goiYNuoc) thay vì nước máy.
   BƯỚC: TC_03A
   NGÀY: 22/10/2026 21:10
   CẬP NHẬT: 23/10/2026 07:40 - TC_03E (gợi ý)
   PHỤ THUỘC: co_tuong/ct_logic.js, co_tuong/ct_bo_nao.js (CT.mayDiCap)
   ================================================================ */
importScripts("ct_logic.js", "ct_bo_nao.js");

self.onmessage = function (su) {
  const d = su.data || {};
  let n = -1;
  try {
    const nuocDi = Array.isArray(d.nuocDi) ? d.nuocDi : [];
    if (nuocDi.length < 2) self.CT.xoaNho();
    n = d.goiY ? self.CT.goiYNuoc(nuocDi, Number(d.giay) || 0)
               : self.CT.mayDiCap(nuocDi, Number(d.cap) || 1, Math.random);
  } catch (e) { n = -1; }
  self.postMessage({ id: d.id, n: n });
};
// 23/10/2026 07:40 - BƯỚC: TC_03E
