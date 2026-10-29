// ================================================================
// FILE: dt/dt_tran_dau.js
// CHỨC NĂNG: LÕI TRẬN ĐẤU THEO LƯỢT của Đấu Trường Tri Thức (đặc tả dac_ta.md VI,
//            repo_rieng dau_truong_tri_thuc/dac_ta_tran_dau.md). Thủ lĩnh của bé đấu một quái:
//            - Lượt lẻ bé tấn công, lượt chẵn quái tấn công; mỗi lượt một câu chung.
//            - Bé tấn công: lượt hết ngay khi bé bấm (hoặc hết giờ); quái phòng thủ đã rút trước
//              thời điểm bấm + đúng / sai, chỉ tính nếu bấm trước bé.
//            - Quái tấn công: lượt hết lúc quái bấm; bé bấm trước lúc đó mới được tính; bé đã bấm thì
//              quái bấm sau nhiều nhất tuaKhiDaBamGiay (kết quả không đổi, bé khỏi chờ).
//            - Bảng kết quả VI.2 (hụt / né theo AGI / trúng / sơ hở), combo, chí mạng, công thức VI.6.
//            - Thời gian (TC_D05B1): bé có thoiGian.be theo cấp quái (Lv 1 10 giây ... thấp nhất 5), hết giờ
//              tự ra đòn; quái nghĩ ngẫu nhiên, luôn ngắn hơn bé (dt_quai.js giayTraLoi).
//            - Chế độ Thong thả (lớp nhỏ): cả bé lẫn quái thêm thời gian (x heSoNghi), bé phòng thủ sai không bị gì.
//            - Kết thúc: quái hết HP (thắng), Thủ lĩnh hết HP (thua: về Lều nghỉ thua.nghiGiay),
//              đủ soLuotToiDa (hết lượt, quái chạy mất). Mỗi lượt sát thương nhiều nhất 1 lần.
//            Lõi không chọn câu (nhận từ dt_cau_hoi.js qua moLuot), không đụng DOM, không đọc đồng hồ:
//            mọi hàm nhận thời điểm t (mili giây) từ ngoài => kiểm thử node chạy tua nhanh được.
//            Mọi con số đọc từ du_lieu/cau_hinh_tran_dau.json.
// BƯỚC: TC_D05
// NGÀY: 29/10/2026
// PHỤ THUỘC: dt/dt_quai.js (KC_DT_QUAI)
// ================================================================
(function (goc) {
  "use strict";

  function chiSoThuLinh(chungLoai, ch) {
    const c = ch.thuLinh[chungLoai] || ch.thuLinh.nhan;
    return { hpToiDa: c.hp, hp: c.hp, mpToiDa: c.mp, mp: 0, str: c.str, int: c.int, agi: c.agi, def: c.def, uyLuc: c.uyLuc, chiSoDanh: c.chiSoDanh };
  }


  function tiLeNe(agi, ch) { return Math.min(ch.ne.toiDa, ch.ne.goc + ch.ne.moiAgi * agi); }

  // combo: số cú đúng liên tiếp đã tính cú này (>= 1)
  function satThuong(benDanh, benDo, combo, chiMang, soHo, ch) {
    const kCombo = Math.min(ch.combo.toiDa, 1 + ch.combo.buoc * (combo - 1));
    const kChiMang = chiMang ? ch.chiMang.heSo : 1;
    const kSoHo = soHo ? ch.soHo : 1;
    const goc0 = benDanh.uyLuc * (1 + (benDanh[benDanh.chiSoDanh] || 0) / 100) * kCombo * kChiMang * kSoHo - ch.satThuong.heSoDef * benDo.def;
    return Math.round(Math.max(ch.satThuong.toiThieu, goc0));
  }

  // tc: { ch, chungLoai, quai (KC_DT_QUAI.taoQuai), lop, thongTha (bỏ trống: theo lớp), rng }
  function taoTran(tc) {
    const QU = goc.KC_DT_QUAI, ch = tc.ch, rng = tc.rng || Math.random;
    const lop = Math.max(1, Math.min(12, Math.floor(tc.lop) || 1));
    const thongTha = tc.thongTha != null ? !!tc.thongTha : lop <= ch.thongTha.denLop;
    const be = Object.assign(chiSoThuLinh(tc.chungLoai, ch), { combo: 0 });
    const quai = Object.assign({}, tc.quai, { combo: 0 });
    // thời gian tối đa của bé mỗi lượt (theo cấp quái; Thong thả nhân cả bé lẫn quái để quái vẫn nhanh hơn bé)
    const nghi = thongTha ? ch.thongTha.heSoNghi : 1, giayBe = QU.giayBe(quai.lv, ch) * nghi;
    const tongKet = { soLuot: 0, beDung: 0, beBam: 0, comboCaoNhat: 0, satThuongGay: 0, satThuongNhan: 0 };
    let luot = null, ketThuc = null, soLuot = 0;

    function benCua(ten) { return ten === "be" ? be : quai; }

    // Mở lượt mới với câu cau = { dapAn[], dung[], doKho, loiGiai, ... }, t = mili giây
    function moLuot(cau, t) {
      if (ketThuc) return null;
      if (luot && !luot.ketQua) return luot.info;
      soLuot++;
      const tanCong = soLuot % 2 === 1 ? "be" : "quai";
      const han = t + giayBe * 1000;
      const tl = QU.traLoi(quai, cau, ch, rng);
      let tQuai = t + QU.giayTraLoi(quai, ch, rng, nghi) * 1000;
      if (tanCong === "quai") tQuai = Math.min(tQuai, han);
      luot = {
        so: soLuot, tanCong, cau, tMo: t, han,
        quai: { t: tQuai, dung: tl.dung, chiSo: tl.chiSo },
        be: null, ketQua: null, daGaySatThuong: false
      };
      luot.info = { so: soLuot, tanCong, han, thongTha };
      return luot.info;
    }

    function quaiDaBam(t) { return !!luot && !luot.ketQua && luot.quai.t <= t && luot.quai.t <= luot.han; }

    // Bé bấm đáp án chiSo lúc t. Trả { nhan: bool, ketQua? }. Bấm lần hai / sau khi khóa: nhan false.
    function beBam(chiSo, t) {
      if (!luot || luot.ketQua || luot.be || ketThuc) return { nhan: false };
      // quái tấn công đã bấm trước lúc này: lượt đã xong (nếu trang chưa gọi capNhat thì chốt ngay)
      if (luot.tanCong === "quai" && luot.quai.t <= t) { const kq = chot(luot.quai.t); return { nhan: false, ketQua: kq }; }
      if (luot.tanCong === "be" && t > luot.han) { const kq = chot(luot.han); return { nhan: false, ketQua: kq }; }
      const dung = luot.cau.dung.indexOf(chiSo) >= 0;
      luot.be = { t, chiSo, dung };
      tongKet.beBam++; if (dung) tongKet.beDung++;
      if (luot.tanCong === "be") return { nhan: true, ketQua: chot(t) };
      luot.quai.t = Math.min(luot.quai.t, t + ch.tuaKhiDaBamGiay * 1000); // tua nhanh: kết quả không đổi
      return { nhan: true, ketQua: null };
    }

    // Gọi đều đặn với thời điểm hiện tại: chốt lượt khi quái tấn công bấm hoặc bé hết giờ.
    function capNhat(t) {
      if (!luot || luot.ketQua || ketThuc) return null;
      if (luot.tanCong === "quai" && t >= luot.quai.t) return chot(luot.quai.t);
      if (luot.tanCong === "be" && t >= luot.han) return chot(luot.han);
      return null;
    }

    function chot(tKet) {
      const L = luot;
      const tc0 = L.tanCong, pt0 = tc0 === "be" ? "quai" : "be";
      const A = benCua(tc0), D = benCua(pt0);
      // lựa chọn của bên tấn công / phòng thủ (phòng thủ chỉ tính khi bấm trước lúc tKet)
      let aBam, dBam;
      if (tc0 === "be") {
        aBam = L.be;
        dBam = L.quai.t < tKet && L.quai.t <= L.han ? L.quai : null;
        if (!aBam) dBam = L.quai.t <= L.han ? L.quai : null; // hết giờ: quái bấm lúc nào trong giờ cũng được +MP
      } else {
        aBam = L.quai;
        dBam = L.be && L.be.t < tKet ? L.be : null;
      }
      const kq = {
        so: L.so, tanCong: tc0, kieu: "", satThuong: 0, chiMang: false, neThu: false,
        beChon: L.be ? L.be.chiSo : null, quaiChon: (tc0 === "quai" || dBam) ? L.quai.chiSo : null,
        dapAnDung: L.cau.dung[0], loiGiai: L.cau.loiGiai || "",
        mp: { be: 0, quai: 0 }, tKet
      };
      const boSoHo = pt0 === "be" && thongTha && ch.thongTha.boSoHo;
      if (!aBam || !aBam.dung) {
        kq.kieu = aBam ? "hut" : "het_gio";
        A.combo = 0;
        if (dBam && dBam.dung) kq.mp[pt0] += ch.mpPhongThuDung;
        else if (dBam && !dBam.dung && !boSoHo) D.combo = 0;
      } else {
        A.combo++;
        let soHo = false;
        if (dBam && dBam.dung) {
          kq.neThu = true;
          if (rng() < tiLeNe(D.agi, ch)) { kq.kieu = "ne"; D.combo++; kq.mp[pt0] += ch.mpPhongThuDung; }
          else kq.kieu = "trung";
        } else if (dBam && !dBam.dung) {
          if (boSoHo) kq.kieu = "trung";
          else { kq.kieu = "so_ho"; soHo = true; D.combo = 0; }
        } else kq.kieu = "trung";
        if (kq.kieu !== "ne" && !L.daGaySatThuong) {
          kq.chiMang = (A.combo % ch.chiMang.moiCombo === 0) || (ch.chiMang.khiCauKho && L.cau.doKho === "kho");
          kq.satThuong = Math.min(D.hp, satThuong(A, D, A.combo, kq.chiMang, soHo, ch));
          D.hp = Math.max(0, D.hp - kq.satThuong);
          L.daGaySatThuong = true;
        }
      }
      be.mp = Math.min(be.mpToiDa, be.mp + kq.mp.be);
      quai.mp = Math.min(quai.mpToiDa, quai.mp + kq.mp.quai);
      tongKet.soLuot = L.so;
      tongKet.comboCaoNhat = Math.max(tongKet.comboCaoNhat, be.combo);
      if (tc0 === "be") tongKet.satThuongGay += kq.satThuong; else tongKet.satThuongNhan += kq.satThuong;
      kq.hp = { be: be.hp, quai: quai.hp };
      kq.combo = { be: be.combo, quai: quai.combo };
      L.ketQua = kq;
      if (quai.hp <= 0) ketThuc = { thang: "be", lyDo: "quai_het_hp" };
      else if (be.hp <= 0) ketThuc = { thang: "quai", lyDo: "be_het_hp", nghiDen: tKet + ch.thua.nghiGiay * 1000 };
      else if (L.so >= ch.soLuotToiDa) ketThuc = { thang: null, lyDo: "het_luot" };
      if (ketThuc) { ketThuc.tongKet = Object.assign({}, tongKet); kq.ketThuc = ketThuc; }
      return kq;
    }

    return {
      moLuot, beBam, capNhat, quaiDaBam,
      be: () => be, quai: () => quai, lop, thongTha, giayBe,
      luot: () => luot && luot.info, ketQuaLuot: () => luot && luot.ketQua,
      dangLuot: () => !!luot && !luot.ketQua && !ketThuc,
      ketThuc: () => ketThuc, tongKet: () => Object.assign({}, tongKet)
    };
  }

  goc.KC_DT_TRAN_DAU = { taoTran, chiSoThuLinh, tiLeNe, satThuong };
})(typeof window !== "undefined" ? window : globalThis);
// 29/10/2026 - BƯỚC: TC_D05; 29/10/2026 23:40 - TC_D05B1 (đồng hồ bé theo cấp quái: T.giayBe)
