// ================================================================
// FILE: dt/dt_cau_hoi.js
// CHỨC NĂNG: BỘ CHỌN CÂU HỎI của Đấu Trường Tri Thức: nối trình độ của bé (dt_trinh_do.js) với
//            các nguồn câu. Không đụng DOM: chạy được trong node (kiểm thử, mô phỏng) và trên máy bé.
//            - Nguồn = { dsMuc(), DANG: [{ ma, lop, chuDe }], taoCau(maDang, muc, hat) } theo từng môn.
//              Hôm nay: "toan" = dt_sinh_toan.js. Tiếng Anh (kho từ) thêm ở TC_D04B, câu soạn tay
//              cau_hoi/<môn>_<lớp>.json sau.
//            - cauTiep(hs, mon): khoảng tiLeOnTap số câu là ÔN TẬP (chủ đề bé yếu nhất, câu dễ hơn),
//              còn lại chọn (lớp, mức) vừa sức rồi chọn dạng của lớp đó, tránh lặp dạng vừa hỏi.
//            - traLoi(hs, cau, chiSo): chấm, cập nhật trình độ + thành thạo chủ đề, trả hệ số thưởng.
//            Câu trong trận đấu thật sẽ chấm ở máy chủ khi có SQL (đáp án không lộ); bước này chấm tại máy.
// BƯỚC: TC_D04A
// NGÀY: 29/10/2026
// PHỤ THUỘC: dt/dt_trinh_do.js (KC_DT_TRINH_DO), dt/dt_sinh_toan.js (KC_DT_SINH_TOAN)
// ================================================================
(function (goc) {
  "use strict";
  const SO_TRANH_LAP = 3; // số dạng vừa hỏi không hỏi lại ngay (để câu đổi kiểu, không phải số cân bằng)

  // chTrinhDo: nội dung cau_hinh_trinh_do.json (thiếu thì dùng mặc định trong dt_trinh_do.js)
  function taoBoChon(chTrinhDo, nguon) {
    const TD = goc.KC_DT_TRINH_DO;
    const ch = TD.cauHinh(chTrinhDo);
    const ng = nguon || { toan: goc.KC_DT_SINH_TOAN };
    const ganDay = {};

    function lopCoCau(mon) { return Math.max(...ng[mon].dsMuc().map(m => m.lop)); }

    function cauTiep(hs, mon, rng) {
      const r = rng || Math.random;
      const nguonMon = ng[mon];
      if (!nguonMon) return null;
      const tranLop = TD.lopDuocHoi(hs, ch);
      const dangHoiDuoc = nguonMon.DANG.filter(d => d.lop <= tranLop);
      const gd = ganDay[mon] || (ganDay[mon] = []);
      let onTap = false, x = null, dsDang = null;

      if (r() < ch.tiLeOnTap) {
        const chuDe = TD.chuDeYeu(hs, [...new Set(dangHoiDuoc.map(d => d.chuDe))], ch);
        if (chuDe) {
          dsDang = dangHoiDuoc.filter(d => d.chuDe === chuDe);
          const dsMuc = [];
          dsDang.forEach(d => TD.MUC.forEach(muc => dsMuc.push({ lop: d.lop, muc })));
          x = TD.chonDoKho(hs, mon, dsMuc, r, ch, ch.onTap.xacSuat);
          if (x) { onTap = true; dsDang = dsDang.filter(d => d.lop === x.lop); }
        }
      }
      if (!onTap) {
        x = TD.chonDoKho(hs, mon, nguonMon.dsMuc(), r, ch);
        if (!x) return null;
        dsDang = dangHoiDuoc.filter(d => d.lop === x.lop);
      }
      const moi = dsDang.filter(d => gd.indexOf(d.ma) < 0);
      const dang = (moi.length ? moi : dsDang)[Math.floor(r() * (moi.length || dsDang.length))];
      const cau = nguonMon.taoCau(dang.ma, x.muc, Math.floor(r() * 4294967296));
      if (!cau) return null;
      gd.push(dang.ma); while (gd.length > SO_TRANH_LAP) gd.shift();
      return { cau, p: x.p, doKho: x.doKho, onTap };
    }

    // chiSo: vị trí đáp án bé chọn (0-3). Trả { dung, truoc, sau, p, k, heSoThuong, dapAnDung }
    function traLoi(hs, cau, chiSo) {
      const dung = cau.dung.indexOf(chiSo) >= 0;
      const kq = TD.capNhat(hs, cau, dung, ch, lopCoCau(cau.mon));
      kq.dung = dung;
      kq.dapAnDung = cau.dapAn[cau.dung[0]];
      return kq;
    }

    return { ch, cauTiep, traLoi, lopCoCau };
  }

  goc.KC_DT_CAU_HOI = { taoBoChon };
})(typeof window !== "undefined" ? window : globalThis);
// 29/10/2026 - BƯỚC: TC_D04A
