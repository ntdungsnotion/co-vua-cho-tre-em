// ================================================================
// FILE: dt/dt_tru_tran.js
// CHỨC NĂNG: LUẬT TRẬN TRỤ PHÒNG THỦ của Đấu Trường Tri Thức (TC_D06C2g, người dùng 05/11/2026):
//            trụ (Trụ tên / nỏ / pháo) của bé A tự khai chiến khi Thủ lĩnh bé B vào tầm. Trận có soCau
//            lần giao chiến; mỗi lần = lượt TRỤ tấn công rồi lượt BÉ tấn công (trụ khai chiến nên trụ đánh trước).
//            - Lượt trụ: câu ngẫu nhiên theo trình độ bé B (máy bé tự chọn, bé B thấy đáp án sau khi bấm);
//              máy chủ quyết trụ đúng hay sai theo tỉ lệ (tiLe). Trụ đúng + bé phòng thủ sai / không kịp = trúng
//              (bé mất cong máu); trụ đúng + bé đúng = đỡ được; trụ sai = hụt.
//            - Lượt bé: câu thứ k của trụ (bé A đặt; máy chủ giữ đáp án, KHÔNG gửi cho bé B). Bé đúng = trụ mất
//              beDanh máu; bé sai / hết giờ = trụ phản đòn (bé mất cong máu). Trụ không phải trả lời.
//            - Kết thúc: trụ hết máu (bé thắng: trụ thành đống gạch), Thủ lĩnh hết máu (thua: về Lều nghỉ),
//              hết soCau lần giao chiến (hòa). Máu hai bên giữ nguyên sau trận (không tự hồi).
//            Không đụng DOM, không đọc đồng hồ: máy chủ giả (dt_may_chu.js) dùng y nguyên; SQL
//            (repo_rieng SQL/supabase_tc_d02b3_ban_do.sql mục TC_D06C2g) viết lại đúng các luật này.
// HÀM KHAI RA (goc.KC_DT_TRU_TRAN):
//   laTru(CH, loai) -> bool;  soTru(CH, loai, cap) -> { dangCap, mauToiDa, cong, beDanh, tam, soCau, tiLe }
//   hpThuLinh(CH, chungLoai) -> máu tối đa Thủ lĩnh;  hpNongDan(CH, chungLoai) -> máu tối đa nông dân (TC_D06C2h)
//   banMot(soTru, mau, rng) -> { trung, satThuong, mau } một phát trụ tự bắn nông dân (TC_D06C2h)
//   TC_D06C7b: laDanh(CH, loai) công trình thường đánh được; danhDuoc = trụ hoặc laDanh; soDanh(CH, loai, cap) số trận mọi loại
//     (trụ = soTru; thường: tam null); kcMep(ct, x, z) khoảng cách tới mép móng; trongBaoHo(CH, ct, leuCuaChu);
//     chonCau(kho, n, rng) n câu ngẫu nhiên từ kho câu của chủ
//   moLuot(tr, CH, bay, rng) -> lượt { so, ben: "tru" | "be", moLuc, han?, giayTru?, cau? (chỉ số câu của trụ) }
//   traLoi(tr, CH, bay, { chon, beDung }, cauTru) -> kết quả { so, ben, kieu, satThuong, dapAnDung?, mau{be, tru}, ket? }
//     tr = trạng thái trận (máy chủ giữ): { soCau, tiLe, cong, beDanh, mauBe, mauBeToiDa, mauTru, mauTruToiDa,
//          so (số lượt đã mở), ben, moLuc, truDung, giayTru, ket }; hai hàm sửa thẳng tr.
// BƯỚC: TC_D06C2g
// NGÀY: 05/11/2026
// ================================================================
(function (goc) {
  "use strict";

  const laTru = (CH, loai) => !!(CH.congTrinh && CH.congTrinh[loai] && CH.congTrinh[loai].tru);

  // Số của trụ cấp cap: cấp 1 = congTrinh.<loai>.tru, cấp 2, 3... = tru.capTren[cap - 2] (mỗi cấp một hàng của bảng
  // kc_dt_loai_cong_trinh); tỉ lệ đúng không quá tru.tiLeToiDa
  function soTru(CH, loai, cap) {
    const t0 = CH.congTrinh[loai].tru, k = Math.max(1, Math.floor(cap) || 1);
    const t = (k > 1 && t0.capTren && t0.capTren[k - 2]) || t0;
    return {
      dangCap: t0.dangCap || 1, mauToiDa: t.mau, cong: t.cong, beDanh: t.beDanh, tam: t.tam, soCau: t.soCau,
      tiLe: Math.min(CH.tru.tiLeToiDa, t.tiLeDung)
    };
  }

  // TC_D06C7b: công trình THƯỜNG bị bé khác đánh (congTrinh.<loai>.danh; trụ không tính: trụ dùng khối tru); Lều không có danh
  const laDanh = (CH, loai) => !!(CH.congTrinh && CH.congTrinh[loai] && CH.congTrinh[loai].danh && !CH.congTrinh[loai].tru);
  const danhDuoc = (CH, loai) => laTru(CH, loai) || laDanh(CH, loai);
  // Số trận của mọi công trình đánh được: trụ = soTru; công trình thường = khối danh (không có tầm, không tự khai chiến)
  function soDanh(CH, loai, cap) {
    if (laTru(CH, loai)) return soTru(CH, loai, cap);
    const d = CH.congTrinh[loai].danh;
    return { dangCap: 0, mauToiDa: d.mau, cong: d.cong, beDanh: d.beDanh, tam: null, soCau: d.soCau, tiLe: Math.min(CH.tru.tiLeToiDa, d.tiLeDung) };
  }
  // Khoảng cách từ điểm (x, z) tới mép công trình (0 = đứng trên móng); SQL: kc_dt_kc_mep
  const kcMep = (ct, x, z) => Math.hypot(Math.max(ct.x - x, 0, x - (ct.x + ct.rong)), Math.max(ct.y - z, 0, z - (ct.y + ct.sau)));
  // Vùng bảo hộ (người dùng 08/11/2026): công trình cách Lều trại của chủ (leu) không quá tru.phamViLang ô
  const trongBaoHo = (CH, ct, leu) => !!leu && Math.hypot(ct.x + ct.rong / 2 - (leu.x + leu.rong / 2), ct.y + ct.sau / 2 - (leu.y + leu.sau / 2)) <= CH.tru.phamViLang;

  const hpThuLinh = (CH, cl) => CH.tru.hpThuLinh[cl] || CH.tru.hpThuLinh.nhan;
  // TC_D06C2h: máu tối đa nông dân (máy chủ cần để biết nông dân hết máu)
  const hpNongDan = (CH, cl) => { const h = CH.tru.hpNongDan || {}; return h[cl] || h.nhan || 60; };
  // TC_D06C2h: trụ bắn MỘT PHÁT vào nông dân: trúng với xác suất s.tiLe, trúng thì mất s.cong máu (không dưới 0)
  function banMot(s, mau, rng) {
    const trung = (rng || Math.random)() < s.tiLe, st = trung ? Math.min(mau, s.cong) : 0;
    return { trung, satThuong: st, mau: mau - st };
  }

  // Lượt lẻ: trụ tấn công; lượt chẵn: bé tấn công bằng câu thứ (so / 2 - 1) của trụ
  function moLuot(tr, CH, bay, rng) {
    if (tr.ket) return null;
    const r = rng || Math.random, c = CH.tru;
    tr.so = (tr.so || 0) + 1;
    tr.moLuc = bay;
    if (tr.so % 2 === 1) {
      tr.ben = "tru";
      tr.truDung = r() < tr.tiLe;
      tr.giayTru = Math.round((c.giayTru[0] + (c.giayTru[1] - c.giayTru[0]) * r()) * 10) / 10;
      return { so: tr.so, ben: "tru", moLuc: bay, giayTru: tr.giayTru };
    }
    tr.ben = "be"; tr.truDung = null; tr.giayTru = null;
    return { so: tr.so, ben: "be", moLuc: bay, han: c.giayBe, cau: tr.so / 2 - 1 };
  }

  // tl = { chon: chỉ số đáp án bé chọn (lượt bé; null = hết giờ), beDung: bé phòng thủ đúng kịp lúc (lượt trụ) }
  // cauTru = câu của trụ đang hỏi (lượt bé) { dung[] ... }
  function traLoi(tr, CH, bay, tl, cauTru) {
    if (tr.ket || !tr.ben) return null;
    const kq = { so: tr.so, ben: tr.ben, kieu: "", satThuong: 0 };
    if (tr.ben === "tru") {
      if (!tr.truDung) kq.kieu = "hut";
      else if (tl && tl.beDung) kq.kieu = "do";
      else { kq.kieu = "trung"; kq.satThuong = Math.min(tr.mauBe, tr.cong); tr.mauBe -= kq.satThuong; }
    } else {
      const quaGio = bay - tr.moLuc > (CH.tru.giayBe + CH.tru.treGiay) * 1000;
      const chon = tl && Number.isInteger(tl.chon) && !quaGio ? tl.chon : null;
      const dung = cauTru && Array.isArray(cauTru.dung) ? cauTru.dung : [];
      kq.dapAnDung = dung[0];
      if (chon != null && dung.indexOf(chon) >= 0) { kq.kieu = "trung"; kq.satThuong = Math.min(tr.mauTru, tr.beDanh); tr.mauTru -= kq.satThuong; }
      else { kq.kieu = chon == null ? "het_gio" : "sai"; kq.phanDon = Math.min(tr.mauBe, tr.cong); tr.mauBe -= kq.phanDon; }
    }
    tr.ben = null; tr.truDung = null;
    if (tr.mauTru <= 0) tr.ket = "be";
    else if (tr.mauBe <= 0) tr.ket = "tru";
    else if (tr.so >= tr.soCau * 2) tr.ket = "hoa";
    kq.mau = { be: tr.mauBe, tru: tr.mauTru };
    if (tr.ket) kq.ket = tr.ket;
    return kq;
  }

  // TC_D06C7b: chọn n câu cho trận công trình thường từ kho (kho ít hơn n thì lặp lại kho đã xáo)
  function chonCau(kho, n, rng) {
    if (!Array.isArray(kho) || !kho.length || !(n > 0)) return null;
    const r = rng || Math.random, ra = [];
    while (ra.length < n) {
      const x = kho.slice();
      for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
      ra.push(...x.slice(0, n - ra.length));
    }
    return ra;
  }

  goc.KC_DT_TRU_TRAN = { laTru, soTru, laDanh, danhDuoc, soDanh, kcMep, trongBaoHo, chonCau, hpThuLinh, hpNongDan, banMot, moLuot, traLoi };
})(typeof window !== "undefined" ? window : globalThis);
// 05/11/2026 - BƯỚC: TC_D06C2g (trụ phòng thủ tấn công người chơi khác)
// 06/11/2026 - BƯỚC: TC_D06C2h (hpNongDan, banMot: trụ tự bắn nông dân)
// 08/11/2026 - BƯỚC: TC_D06C7b (laDanh, danhDuoc, soDanh, kcMep, trongBaoHo, chonCau: mọi công trình bị bé khác đánh sập)
