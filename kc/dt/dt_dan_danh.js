// ================================================================
// FILE: dt/dt_dan_danh.js
// CHỨC NĂNG: NÔNG DÂN TỰ ĐÁNH QUÁI của Đấu Trường Tri Thức (Thung Lũng). Không đụng DOM / Three.js: chạy
//            được trong node (kiểm thử). Người dùng 04/11/2026: "nếu bị tấn công, bé có thể vào điều khiển, nếu
//            không vào điều khiển thì nông dân tự chiến đấu, xác suất trả lời đúng là 50%, hết máu thì chạy trốn".
//            Dùng ĐÚNG lõi trận theo lượt dt_tran_dau.js (cùng luật lượt, né, combo, chí mạng, sát thương), chỉ khác:
//            - bên bé là nông dân (chiSoNongDan: chỉ số theo tộc, máu còn lại máy chủ giữ)
//            - không có câu thật: mỗi lượt một "câu giả" 4 đáp án; nông dân bấm sau giayTraLoi giây, đúng với xác
//              suất nongDan.xacSuatDung (đáp án sai chọn ngẫu nhiên); quái bấm như trận thường (dt_quai.js)
//            - hết lượt chờ latBaiGiay rồi tự sang lượt sau (như màn chiến đấu)
//            - bé vào điều khiển giữa chừng: chuyen() trả máu hai bên + số lượt đã đánh để màn chiến đấu đánh tiếp
//              từ đó (lượt đang dở bỏ, lượt sau giữ đúng bên tấn công)
//            Mọi con số đọc từ du_lieu/cau_hinh_tran_dau.json (khối nongDan + luật trận).
// HÀM KHAI RA (goc.KC_DT_DAN_DANH):
//   taoTuDanh({ ch, chungLoai, quai (KC_DT_QUAI.taoQuai), hp (máu nông dân còn, bỏ trống = đầy), quaiTruoc, rng, t })
//     -> { capNhat(t) -> [kết quả lượt] (mỗi phần tử = kết quả chot của dt_tran_dau.js, có ketThuc khi xong),
//          ketThuc() -> null | { thang: "be" | "quai" | null, lyDo, tongKet }, hp() -> { be, beToiDa, quai, quaiToiDa },
//          soLuot() (số lượt đã chốt), dang() (đang đánh), chuyen() -> { hpBe, hpQuai, soLuot } (thôi tự đánh) }
//   CAU_GIA: câu giả dùng cho lượt tự đánh
// BƯỚC: TC_D06C2b - NGÀY: 04/11/2026 23:xx
// PHỤ THUỘC: dt/dt_quai.js (KC_DT_QUAI), dt/dt_tran_dau.js (KC_DT_TRAN_DAU)
// ================================================================
(function (goc) {
  "use strict";
  const CAU_GIA = Object.freeze({ noiDung: "", dapAn: ["A", "B", "C", "D"], dung: [0], doKho: "vua", loiGiai: "" });

  function taoTuDanh(tc) {
    const TR = goc.KC_DT_TRAN_DAU, ch = tc.ch, rng = tc.rng || Math.random, nd = ch.nongDan || {};
    const xs = Number.isFinite(nd.xacSuatDung) ? nd.xacSuatDung : 0.5;
    const [g0, g1] = nd.giayTraLoi || [2, 6];
    const T = TR.taoTran({ ch, chungLoai: tc.chungLoai, quai: tc.quai, lop: 12, thongTha: false, rng, quaiTruoc: !!tc.quaiTruoc,
      be: TR.chiSoNongDan(tc.chungLoai, ch, tc.hp) });
    let bam = null;            // { t, chiSo } lúc nông dân sẽ bấm trong lượt đang mở
    let tiep = tc.t || 0;      // lúc mở lượt sau
    let soLuot = 0, thoi = false;

    function moLuot(t) {
      const info = T.moLuot(CAU_GIA, t);
      if (!info) return;
      const dung = rng() < xs;
      const chiSo = dung ? 0 : 1 + Math.floor(rng() * 3);
      let tb = t + (g0 + rng() * Math.max(0, g1 - g0)) * 1000;
      if (info.tanCong === "be") tb = Math.min(tb, info.han - 50); // tấn công: luôn kịp bấm trong giờ
      bam = { t: tb, chiSo };
    }
    function capNhat(t) {
      const ra = [];
      for (let vong = 0; vong < 8 && !thoi && !T.ketThuc(); vong++) {
        if (!T.dangLuot()) { if (t < tiep) break; moLuot(Math.max(tiep, 0) || t); continue; }
        let k = null;
        const L = T.luot();
        // nông dân bấm (trước lúc chốt của lượt): đúng thứ tự thời gian với quái
        if (bam && bam.t <= t) { const r = T.beBam(bam.chiSo, bam.t); bam = null; k = r.ketQua || null; }
        if (!k && T.dangLuot()) k = T.capNhat(t);
        if (!k) break;
        soLuot = k.so; ra.push(k);
        if (k.ketThuc) break;
        const beDung = k.beChon != null && k.beChon === 0;
        tiep = (k.tKet || t) + (beDung ? ch.latBaiGiay.dung : ch.latBaiGiay.sai) * 1000;
        if (L && L.so !== k.so) break; // phòng hờ
      }
      return ra;
    }
    return {
      capNhat,
      ketThuc: () => T.ketThuc(),
      hp: () => ({ be: T.be().hp, beToiDa: T.be().hpToiDa, quai: T.quai().hp, quaiToiDa: T.quai().hpToiDa }),
      soLuot: () => soLuot,
      dang: () => !thoi && !T.ketThuc(),
      chuyen() { thoi = true; return { hpBe: T.be().hp, hpQuai: T.quai().hp, soLuot }; },
      tran: T
    };
  }

  goc.KC_DT_DAN_DANH = { taoTuDanh, CAU_GIA };
})(typeof window !== "undefined" ? window : globalThis);
// 04/11/2026 23:xx - BƯỚC: TC_D06C2b
