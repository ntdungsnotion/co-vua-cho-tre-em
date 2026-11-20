// ================================================================
// FILE: dt/dt_chon_cau_td.js
// CHỨC NĂNG: BỘ CHỌN CÂU của trận Đấu Trường theo MODULE TRÌNH ĐỘ DÙNG CHUNG (KC_08D, đặc tả repo_rieng Thiet_Ke_Trinh_Do.md
//            mục 7.2, 7.3, 9.2). Thay dt_cau_hoi.js + dt_trinh_do.js ở trận dùng KHO CÂU (trận quái, trận trụ / công trình):
//            - Hồ sơ = trình độ MÁY CHỦ (RPC kc_td_ho_so, lấy đầu mỗi trận): { lop, nguon, ch, mon: { <môn>: st } }, st cùng khoá
//              với lõi kc/chung/trinh_do.js (KC_TRINH_DO) và bảng kc_td_be. Môn chưa có: khoiTao(lop khai, nguồn) như máy chủ.
//            - Chọn ô (lớp × mức) bằng KC_TRINH_DO.chonO (noi 'tran', nhắm 75 %; dò / chống nản / thử lớp mới / ôn tập như lõi),
//              rồi chủ đề trong ô (tránh chủ đề vừa hỏi), câu lấy từ lô của nguồn kho (dt_nguon_kho.js).
//            - Sau mỗi câu máy chủ chấm: cập nhật BẢN TẠM trên máy bằng KC_TRINH_DO.capNhat với CÙNG đầu vào như trigger
//              kc_td_cap_nhat (b theo lớp + mức, số đáp án, câu lớp M + 1 = câu thử lớp mới, giây), để câu kế trong trận vừa sức.
//              Trận sau lấy lại hồ sơ máy chủ (nguồn chân lý: trigger KC_08C trên kc_luot_tra_loi). Máy không biết câu đã gặp
//              (trọng số câu lặp) nên bản tạm có thể lệch nhẹ; không bao giờ gửi lên.
//            Không đụng DOM: chạy được trong node (kiểm thử).
// HÀM KHAI RA (goc.KC_DT_CHON_TD):
//   hoSo(kq, lopDuPhong) -> hs: kq = kết quả kc_td_ho_so ({ ok, ch, lop, nguon, mon }) hoặc null (không lấy được: khởi tạo theo lopDuPhong)
//   taoBoChon(hs, nguon) -> bo = { ch, coMon(mon), cauTiep(hs, mon, rng?) -> { cau, p, doKho, onTap, laThu } | null,
//        traLoi(hs, cau, chiSo, giay?) (câu chấm tại máy), ghiKetQua(hs, cau, dung, giay?) (máy chủ chấm), lopDuocHoi(hs, mon), st(hs, mon) }
//   luotCua(st, cau, dung, giay, ch, ngay?) -> luot đưa vào KC_TRINH_DO.capNhat (cùng luật trigger máy chủ; kiểm thử dùng)
// BƯỚC: KC_08D - NGÀY: 20/11/2026
// ================================================================
(function (goc) {
  "use strict";
  const SO_TRANH_LAP = 3;
  const TD = () => goc.KC_TRINH_DO;

  // Hồ sơ trận từ kết quả kc_td_ho_so; thiếu / lỗi thì hồ sơ mới theo lớp dự phòng (lớp Đấu Trường của bé)
  function hoSo(kq, lopDuPhong) {
    const coMayChu = !!(kq && kq.ok && kq.mon && typeof kq.mon === "object");
    const lop = coMayChu ? (Number.isFinite(kq.lop) ? kq.lop : null) : (Number.isFinite(+lopDuPhong) ? +lopDuPhong : null);
    const nguon = coMayChu ? (kq.nguon === "phu_huynh" || kq.nguon === "be" ? kq.nguon : null) : (lop == null ? null : "be");
    const ch = TD().cauHinh(coMayChu && kq.ch && typeof kq.ch === "object" ? kq.ch : {});
    const mon = {};
    if (coMayChu) Object.keys(kq.mon).forEach(m => { const st = kq.mon[m]; if (st && typeof st === "object" && Number.isFinite(+st.theta)) mon[m] = JSON.parse(JSON.stringify(st)); });
    return { kieu: "td", mayChu: coMayChu, lop, nguon, ch, mon };
  }

  function stCua(hs, mon) {
    if (!hs.mon[mon]) hs.mon[mon] = TD().khoiTao(hs.lop, hs.nguon, hs.ch);
    return hs.mon[mon];
  }

  // Lượt đưa vào capNhat: cùng luật với kc_td_cap_nhat (SQL KC_08C) cho câu kho: b theo lớp (lop_tu) + mức, không dùng cấp từ;
  // câu đúng lớp M + 1 (chưa vượt lớp) = câu thử lớp mới; câu "mới" (máy không biết lịch sử gặp).
  function luotCua(st, cau, dung, giay, ch, ngay) {
    const T = TD(), lop = Number.isInteger(cau.lop) ? cau.lop : 1, muc = /^(de|vua|kho)$/.test(cau.doKho) ? cau.doKho : "vua";
    return {
      b: T.doKhoCau({ mon: cau.mon, lop, muc }, ch), soDapAn: Array.isArray(cau.dapAn) ? cau.dapAn.length : 4, dung: !!dung, muc,
      ngay: ngay != null ? ngay : Date.now() / 864e5, mon: cau.mon, lop, cauMoi: true,
      laThu: !st.vuotLop && lop === st.lopDaMo + 1,
      gap: { lanGap: 0, giay: Number.isFinite(giay) ? giay : null }
    };
  }

  function taoBoChon(hs0, nguon) {
    const ch = hs0.ch;
    const ng = nguon || {};
    const ganDay = {};
    const coMon = mon => !!ng[mon];

    function cauTiep(hs, mon, rng) {
      const r = rng || Math.random, T = TD();
      const nguonMon = ng[mon];
      if (!nguonMon) return null;
      const st = stCua(hs, mon);
      const gd = ganDay[mon] || (ganDay[mon] = []);
      const dsO = nguonMon.dsMuc().map(m => ({ lop: m.lop, muc: m.muc, b: T.doKhoCau({ mon, lop: m.lop, muc: m.muc }, ch), soDapAn: 4 }));
      for (let lan = 0; lan < 8; lan++) {
        const x = T.chonO(st, dsO, r, ch, { noi: "tran", mon });
        if (!x) return null;
        const ds = nguonMon.dangCho({ lop: x.o.lop, muc: x.o.muc });
        const moi = ds.filter(d => gd.indexOf(d.ma) < 0), chon = moi.length ? moi : ds;
        const dang = chon[Math.floor(r() * chon.length)];
        const cau = dang && nguonMon.taoCau(dang.ma, x.o.muc, Math.floor(r() * 4294967296), null);
        if (!cau) continue; // lô của ô trống: nguồn kho đã tự xin lô; chọn lại (vẫn quanh mức nhắm), hết lượt thì trang chờ lô về
        gd.push(dang.ma); while (gd.length > SO_TRANH_LAP) gd.shift();
        return { cau, p: x.p, doKho: x.o.b, onTap: false, laThu: !!x.laThu };
      }
      return null;
    }

    // Cập nhật bản tạm. Chỉ câu KHO (có mã) mới cập nhật: máy chủ chỉ tính câu kho, câu khác (câu tự soạn của trụ) bỏ qua.
    function ghi(hs, cau, dung, giay) {
      if (!cau || !Number.isInteger(cau.id) || !cau.mon) return null;
      const st = stCua(hs, cau.mon);
      return TD().capNhat(st, luotCua(st, cau, dung, giay, ch), ch);
    }
    function traLoi(hs, cau, chiSo, giay) {
      const dung = Array.isArray(cau.dung) && cau.dung.indexOf(chiSo) >= 0;
      const kq = ghi(hs, cau, dung, giay) || {};
      kq.dung = dung;
      kq.dapAnDung = cau.dapAn && cau.dung ? cau.dapAn[cau.dung[0]] : undefined;
      return kq;
    }
    function ghiKetQua(hs, cau, dung, giay) {
      const kq = ghi(hs, cau, !!dung, giay) || {};
      kq.dung = !!dung;
      return kq;
    }
    // Lớp hỏi khi ô thiếu câu (câu dự phòng của nguồn kho): lớp đã mở của môn
    function lopDuocHoi(hs, mon) { return stCua(hs, mon || Object.keys(ng)[0]).lopDaMo || 1; }

    return { ch, coMon, cauTiep, traLoi, ghiKetQua, lopDuocHoi, st: stCua, td: true };
  }

  goc.KC_DT_CHON_TD = { hoSo, taoBoChon, luotCua };
})(typeof window !== "undefined" ? window : globalThis);
// 20/11/2026 - BƯỚC: KC_08D
