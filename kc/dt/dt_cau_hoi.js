// ================================================================
// FILE: dt/dt_cau_hoi.js
// CHỨC NĂNG: BỘ CHỌN CÂU HỎI của Đấu Trường Tri Thức: nối trình độ của bé (dt_trinh_do.js) với
//            các nguồn câu. Không đụng DOM: chạy được trong node (kiểm thử, mô phỏng) và trên máy bé.
//            - Nguồn (theo môn) = { dsMuc(): [{ lop, muc, doKho? }], dangCho(muc, chuDe?): [dạng],
//              coChuDe(cd), taoCau(maDang, muc, hat, chuDe?) }. "toan" = dt_sinh_toan.js (mặc định);
//              "tieng_anh" = KC_DT_SINH_TA.tao(khoTu) (TC_D04B); câu soạn tay cau_hoi/<môn>_<lớp>.json sau.
//            - cauTiep(hs, mon): khoảng tiLeOnTap số câu là ÔN TẬP (chủ đề bé yếu nhất, câu dễ hơn),
//              còn lại chọn (lớp, mức) vừa sức rồi chọn dạng của lớp đó, tránh lặp dạng vừa hỏi.
//            - traLoi(hs, cau, chiSo): chấm, cập nhật trình độ + thành thạo chủ đề, trả hệ số thưởng.
//            Câu trong trận đấu thật sẽ chấm ở máy chủ khi có SQL (đáp án không lộ); bước này chấm tại máy.
// BƯỚC: TC_D04A; TC_D04B (giao diện nguồn chung, thêm Tiếng Anh)
// NGÀY: 29/10/2026
// PHỤ THUỘC: dt/dt_trinh_do.js (KC_DT_TRINH_DO), dt/dt_sinh_toan.js (KC_DT_SINH_TOAN), dt/dt_sinh_tieng_anh.js
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
    const coMon = mon => !!ng[mon];

    function cauTiep(hs, mon, rng) {
      const r = rng || Math.random;
      const nguonMon = ng[mon];
      if (!nguonMon) return null;
      const tranLop = TD.lopDuocHoi(hs, ch);
      const tatCa = nguonMon.dsMuc().filter(m => m.lop <= tranLop);
      const gd = ganDay[mon] || (ganDay[mon] = []);
      for (let lan = 0; lan < 8; lan++) {
        let x = null, chuDe = null, onTap = false;
        if (r() < ch.tiLeOnTap) {
          // ôn tập: chủ đề yếu nhất của môn này trong số bé đã làm, nhắm câu dễ hơn
          const cd = TD.chuDeYeu(hs, Object.keys(hs.chuDe).filter(nguonMon.coChuDe), ch);
          if (cd) {
            const dsMuc = tatCa.filter(m => nguonMon.dangCho(m, cd).length);
            x = TD.chonDoKho(hs, mon, dsMuc, r, ch, ch.onTap.xacSuat);
            if (x) { chuDe = cd; onTap = true; }
          }
        }
        if (!x) x = TD.chonDoKho(hs, mon, tatCa, r, ch);
        if (!x) return null;
        const dsDang = nguonMon.dangCho(x, chuDe);
        const moi = dsDang.filter(d => gd.indexOf(d.ma) < 0);
        const ds = moi.length ? moi : dsDang;
        const dang = ds[Math.floor(r() * ds.length)];
        const cau = dang && nguonMon.taoCau(dang.ma, x.muc, Math.floor(r() * 4294967296), chuDe);
        if (!cau) continue; // vd. chủ đề không có từ có hình cho dạng nhìn hình: chọn lại
        gd.push(dang.ma); while (gd.length > SO_TRANH_LAP) gd.shift();
        return { cau, p: x.p, doKho: x.doKho, onTap };
      }
      return null;
    }

    // chiSo: vị trí đáp án bé chọn (0-3). Trả { dung, truoc, sau, p, k, heSoThuong, dapAnDung }
    function traLoi(hs, cau, chiSo) {
      const dung = cau.dung.indexOf(chiSo) >= 0;
      const kq = TD.capNhat(hs, cau, dung, ch, lopCoCau(cau.mon));
      kq.dung = dung;
      kq.dapAnDung = cau.dapAn[cau.dung[0]];
      return kq;
    }

    return { ch, cauTiep, traLoi, lopCoCau, coMon };
  }

  goc.KC_DT_CAU_HOI = { taoBoChon };
})(typeof window !== "undefined" ? window : globalThis);
// 29/10/2026 - BƯỚC: TC_D04A
