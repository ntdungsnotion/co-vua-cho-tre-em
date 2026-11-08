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
//   laTru(CH, loai) -> bool;  soTru(CH, loai, cap) -> { dangCap, mauToiDa (= soCau x mauMoiCau), mauMoiCau, thu, cong, tam, soCau, tiLe }
//   TC_D06C7b: congNguoi(CH, chungLoai, laDan) công người đánh; beDanhCt(CH, so, chungLoai, laDan) = max(1, công - thủ công trình)
//     = tr.beDanh (máu công trình mất mỗi câu bé đúng)
//   hpThuLinh(CH, chungLoai) -> máu tối đa Thủ lĩnh;  hpNongDan(CH, chungLoai) -> máu tối đa nông dân (TC_D06C2h)
//   banMot(soTru, mau, rng) -> { trung, satThuong, mau } một phát trụ tự bắn nông dân (TC_D06C2h)
//   TC_D06C7b: laDanh(CH, loai) công trình thường đánh được; danhDuoc = trụ hoặc laDanh; soDanh(CH, loai, cap) số trận mọi loại
//     (trụ = soTru; thường: tam null); kcMep(ct, x, z) khoảng cách tới mép móng; trongBaoHo(CH, ct, leuCuaChu);
//     chonCau(kho, n, rng) n câu ngẫu nhiên từ kho câu của chủ
//   TC_D06C7d (người dùng 08/11/2026: bé mua câu bằng vàng): soCt(CH, ct) số trận theo SỐ CÂU RIÊNG ct.soCau (null = công trình xây trước
//     TC_D06C7d: số câu của loại); mauCt(CH, ct) máu còn; coSan(CH) số câu có sẵn khi xây; giaCau(CH, loai) giá 1 câu ({ vang: 100 });
//     cauSua(CH, ct) số câu phải trả khi sửa (máu mất / mauMoiCau, làm tròn lên); cauDu(cau, kho, n, rng) đủ n câu cho trận trụ
//   TC_D06C7e: ganCauMua(cau, n, moi) chèn câu bé chọn sau n câu đang dùng; phanMat(CH, ct) phần máu mất; giaSua(CH, ct) tài nguyên sửa
//     ({ go, da... }, không vàng); giaySua(CH, ct) giây 1 nông dân sửa xong; mucChay(CH, ct) 0 / 1 cháy nhỏ / 2 cháy to
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
      dangCap: t0.dangCap || 1, mauToiDa: t.soCau * t.mauMoiCau, mauMoiCau: t.mauMoiCau, thu: t.thu || 0, cong: t.cong, tam: t.tam, soCau: t.soCau,
      tiLe: Math.min(CH.tru.tiLeToiDa, t.tiLeDung)
    };
  }
  // TC_D06C7b (người dùng 08/11/2026, dac_ta_pha_thanh.md 3.1 + 7.2): máu công trình = soCau x mauMoiCau; mỗi câu bé đúng công trình
  // mất max(1, CÔNG người đánh - thủ công trình). CÔNG người đánh: tru.congThuLinh / tru.congNongDan theo chủng loại.
  const congNguoi = (CH, cl, laDan) => { const b = (laDan ? CH.tru.congNongDan : CH.tru.congThuLinh) || {}; return b[cl] || b.nhan || 20; };
  const beDanhCt = (CH, so, cl, laDan) => Math.max(1, congNguoi(CH, cl, laDan) - (so.thu || 0));

  // TC_D06C7b: công trình THƯỜNG bị bé khác đánh (congTrinh.<loai>.danh; trụ không tính: trụ dùng khối tru); Lều không có danh
  const laDanh = (CH, loai) => !!(CH.congTrinh && CH.congTrinh[loai] && CH.congTrinh[loai].danh && !CH.congTrinh[loai].tru);
  const danhDuoc = (CH, loai) => laTru(CH, loai) || laDanh(CH, loai);
  // Số trận của mọi công trình đánh được: trụ = soTru; công trình thường = khối danh (không có tầm, không tự khai chiến)
  function soDanh(CH, loai, cap) {
    if (laTru(CH, loai)) return soTru(CH, loai, cap);
    const d = CH.congTrinh[loai].danh;
    return { dangCap: 0, mauToiDa: d.soCau * d.mauMoiCau, mauMoiCau: d.mauMoiCau, thu: d.thu || 0, cong: d.cong, tam: null, soCau: d.soCau, tiLe: Math.min(CH.tru.tiLeToiDa, d.tiLeDung) };
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

  // TC_D06C7d (người dùng 08/11/2026, dac_ta_cong_trinh.md mục 0B "Mua câu bằng vàng"): mỗi công trình giữ SỐ CÂU RIÊNG ct.soCau (xây xong
  // có sẵn muaCau.coSan câu, bé mua thêm không giới hạn); máu tối đa = ct.soCau x mauMoiCau. ct.soCau null = xây trước bước này: số của loại.
  function soCt(CH, ct) {
    const s = soDanh(CH, ct.loai, ct.cap);
    if (Number.isInteger(ct.soCau) && ct.soCau >= 1) { s.soCau = ct.soCau; s.mauToiDa = ct.soCau * s.mauMoiCau; }
    return s;
  }
  // Máu còn (ct.mau null = đầy)
  const mauCt = (CH, ct, s) => { const k = s || soCt(CH, ct); return ct.mau == null ? k.mauToiDa : Math.max(0, Math.min(ct.mau, k.mauToiDa)); };
  const coSan = CH => Math.max(1, Math.floor((CH.muaCau || {}).coSan) || 1);
  // Giá một câu: muaCau.giaRieng[loai] (hàng rào + cổng rẻ hơn) hoặc muaCau.gia
  const giaCau = (CH, loai) => { const m = CH.muaCau || {}; return (m.giaRieng && m.giaRieng[loai]) || m.gia || { vang: 100 }; };
  // Sửa = mua lại phần máu đã mất: số câu = máu mất / mauMoiCau (làm tròn lên); 0 = không hư
  const cauSua = (CH, ct) => { const s = soCt(CH, ct); return Math.ceil((s.mauToiDa - mauCt(CH, ct, s)) / s.mauMoiCau); };
  // Trận trụ: câu chủ trụ đã gắn (ct.cau) + bù câu ngẫu nhiên trong kho câu của chủ cho đủ n (kho trống: lặp lại câu của trụ)
  function cauDu(cau, kho, n, rng) {
    const co = Array.isArray(cau) ? cau.slice(0, n) : [];
    if (co.length >= n) return co;
    const them = chonCau(Array.isArray(kho) && kho.length ? kho : co, n - co.length, rng);
    return them ? co.concat(them) : null;
  }

  // TC_D06C7e (người dùng 08/11/2026 12:1x, dac_ta_cong_trinh.md mục 0B): câu bé TỰ CHỌN khi mua gắn vào ct.cau ngay sau n câu đang dùng
  // (n = số câu trước khi mua) để trận (cauDu lấy n câu đầu) hỏi đúng câu bé chọn; câu dư phía sau (trụ đã gắn sẵn 7 câu) đẩy lùi.
  const ganCauMua = (cau, n, moi) => { const c = Array.isArray(cau) ? cau : []; return c.slice(0, n).concat(moi, c.slice(n)); };
  // Phần máu đã mất (0..1)
  const phanMat = (CH, ct) => { const s = soCt(CH, ct); return s.mauToiDa > 0 ? (s.mauToiDa - mauCt(CH, ct, s)) / s.mauToiDa : 0; };
  // TC_D06C7e: SỬA không tốn vàng, tốn tài nguyên theo loại: giá xây (x hệ số cấp) x sua.tiLeGia x phần máu mất, mỗi loại làm tròn lên
  // (ít nhất 1). Công trình không có giá xây (Lều): không tốn gì.
  function giaSua(CH, ct) {
    const p = phanMat(CH, ct), m = CH.congTrinh[ct.loai] || {}, g = m.gia || {}, S = CH.sua || {}, ra = {};
    if (!(p > 0)) return ra;
    const hs = ((CH.xay && CH.xay.heSoCap && CH.xay.heSoCap.gia) || [1])[Math.max(1, ct.cap || 1) - 1] || 1;
    for (const t in g) if (g[t] > 0) ra[t] = Math.max(1, Math.ceil(g[t] * hs * (S.tiLeGia == null ? 0.25 : S.tiLeGia) * p - 1e-9));
    return ra;
  }
  // TC_D06C7e: NÔNG DÂN SỬA (người dùng chốt 08/11/2026 15:4x): số giây 1 người sửa xong = giayXay x sua.tiLeGiay x phần máu mất
  // (hệ số cấp + số người như khi xây: tocDoXay dt_lang.js với { giayXay: giaySua, cap })
  const giaySua = (CH, ct) => { const m = CH.congTrinh[ct.loai] || {}, S = CH.sua || {}; return (m.giayXay || 0) * (S.tiLeGiay == null ? 1 / 3 : S.tiLeGiay) * phanMat(CH, ct); };
  // TC_D06C7e: CHÁY theo máu: 0 = không, 1 = cháy nhỏ (chay.to < máu / tối đa < 1), 2 = cháy to (máu / tối đa <= chay.to, mặc định 0,5)
  function mucChay(CH, ct) {
    if (!ct || ct.hongLuc != null || !danhDuoc(CH, ct.loai)) return 0;
    const s = soCt(CH, ct), m = mauCt(CH, ct, s);
    if (!(s.mauToiDa > 0) || m >= s.mauToiDa) return 0;
    return m / s.mauToiDa <= ((CH.chay || {}).to == null ? 0.5 : CH.chay.to) ? 2 : 1;
  }

  goc.KC_DT_TRU_TRAN = { laTru, soTru, congNguoi, beDanhCt, laDanh, danhDuoc, soDanh, kcMep, trongBaoHo, chonCau, hpThuLinh, hpNongDan, banMot, moLuot, traLoi,
    soCt, mauCt, coSan, giaCau, cauSua, cauDu, ganCauMua, phanMat, giaSua, giaySua, mucChay };
})(typeof window !== "undefined" ? window : globalThis);
// 05/11/2026 - BƯỚC: TC_D06C2g (trụ phòng thủ tấn công người chơi khác)
// 06/11/2026 - BƯỚC: TC_D06C2h (hpNongDan, banMot: trụ tự bắn nông dân)
// 08/11/2026 - BƯỚC: TC_D06C7b (laDanh, danhDuoc, soDanh, kcMep, trongBaoHo, chonCau: mọi công trình bị bé khác đánh sập)
// 08/11/2026 - BƯỚC: TC_D06C7d (soCt, mauCt, coSan, giaCau, cauSua, cauDu: số câu riêng từng công trình, bé mua bằng vàng)
// 08/11/2026 16:xx - BƯỚC: TC_D06C7e (ganCauMua: câu bé tự chọn; giaSua / giaySua: sửa bằng tài nguyên, nông dân sửa; mucChay: cháy nhỏ / to)
