// ================================================================
// FILE: dt/dt_may_chu.js
// CHỨC NĂNG: LỚP MÁY CHỦ của bản đồ chung Đấu Trường Tri Thức (dac_ta_ban_do.md mục 9-10).
//            Trang game CHỈ gọi máy chủ qua lớp này. Bản đầu (TC_D02B2a) là MÁY CHỦ GIẢ lưu
//            localStorage trên máy bé (một hoặc vài bé cùng máy); TC_D02B3 thay bằng bản gọi
//            RPC Supabase CÙNG GIAO DIỆN (cùng tên hàm, cùng tham số, cùng dạng kết quả, đều
//            trả Promise) -> phần vẽ + lõi không phải sửa.
//            Máy chủ giữ luật (bé sửa mã trên máy cũng không gian lận được ở bản Supabase):
//            - xếp bé vào vùng + cấp cổng thung lũng trống, mở sẵn vùng quanh cổng
//            - chỉ trả đơn vị đối thủ đứng trong vùng SÁNG của bé (chống xem trộm, mục 8)
//            - kiểm lại ô xây được (mục 4), ai tới trước được
//            - thu hoạch gộp: cắt theo trữ lượng còn lại + tốc độ tối đa (mục 6)
//            - mặt nạ khám phá chỉ thêm, không bớt
// HÀM KHAI RA (goc.KC_DT_MAY_CHU):
//   taoMayChuGia({ vung, cauHinh, kho?, dongHo? }) -> máy chủ có các hàm (đều async):
//     vaoVung(ten)                 -> { ok, maVung, banSao, cong, lanDau, khamPha, donVi[], gio }
//     layQuanh(ten)                -> { ok, gio, nguon[{ma, con}], congTrinh[], donVi[] }
//     guiLenh(ten, idDonVi, lenh)  -> { ok, batDau }        lenh = { tu: [x, z], den: [ô x, ô y] }
//     guiThuHoach(ten, [{ma, so}]) -> { ok, ds[{ma, duoc}] }
//     xay(ten, { loai, x, y, rong, sau }) -> { ok, id } | { ok: false, lyDo }
//     luuKhamPha(ten, chuoiBase64) -> { ok }
//     gio()                        -> giờ máy chủ (ms)
//   kho: giống localStorage (getItem / setItem); không có thì giữ trong bộ nhớ.
// BƯỚC: TC_D02B2a
// NGÀY: 26/10/2026
// PHỤ THUỘC: dt/dt_luoi.js, dt/dt_lang.js (KC_DT_LANG), dt/dt_ban_do.js (KC_DT_BAN_DO)
// ================================================================
(function (goc) {
  "use strict";
  const PHIEN_BAN = 1;
  const khoaLuu = maVung => "kc_dt_may_chu_gia_" + maVung;
  const tenChuan = t => String(t || "").trim().toLowerCase();

  function taoMayChuGia(opt) {
    const LANG = goc.KC_DT_LANG, BD = goc.KC_DT_BAN_DO;
    const vung = opt.vung, CH = opt.cauHinh, CB = CH.banDo;
    const gio = () => (opt.dongHo ? opt.dongHo() : Date.now());
    const boNho = {};
    const kho = opt.kho || { getItem: k => (k in boNho ? boNho[k] : null), setItem: (k, v) => { boNho[k] = String(v); } };

    // Trạng thái chung (bản Supabase: các bảng kc_dt_vung / _nguon / _cong_trinh / _don_vi / _kham_pha)
    function docTrangThai() {
      try {
        const t = JSON.parse(kho.getItem(khoaLuu(vung.ma)) || "null");
        if (t && t.phienBan === PHIEN_BAN) return t;
      } catch (e) { /* dữ liệu hỏng: làm lại từ đầu */ }
      return { phienBan: PHIEN_BAN, be: {}, donVi: [], congTrinh: [], nguon: {}, soId: 0 };
    }
    let tt = docTrangThai();
    const luu = () => { try { kho.setItem(khoaLuu(vung.ma), JSON.stringify(tt)); } catch (e) { /* bộ nhớ đầy / bị chặn */ } };

    // Lõi làng của máy chủ: giữ trữ lượng nguồn chung + lưới đường đi để tính vị trí từ lệnh
    const lang = LANG.taoLang({ banDo: vung, cauHinh: CH, dongHo: gio });
    for (const ma in tt.nguon) {
      const n = lang.nguonTheoMa(Number(ma));
      if (n) { n.con = Math.min(n.con, tt.nguon[ma].con); }
    }
    for (const ct of tt.congTrinh) lang.datMong(ct.x, ct.y, ct.rong, ct.sau);

    const viTri = dv => dv.lenh ? BD.viTriTuLenh(lang, dv.lenh, gio()) : { x: dv.x, z: dv.z };
    const cuaBe = ten => tt.donVi.filter(d => d.chu === ten);
    const cungPhe = ten => chu => chu === ten; // đồng minh: TC_D17B

    // Sương mù của một bé, tính tại máy chủ: đã khám phá (lưu) + sáng (đơn vị + công trình của phe)
    function suongCua(ten) {
      const s = BD.taoSuongMu(vung.rong, vung.cao), be = tt.be[ten];
      if (be && be.khamPha) s.nap(be.khamPha);
      const cl = be && be.chungLoai;
      const nguonSoi = cuaBe(ten).map(d => { const p = viTri(d); return { x: p.x, z: p.z, r: BD.tamNhin(CB, d.loai, cl) }; });
      for (const ct of tt.congTrinh) if (ct.chu === ten) nguonSoi.push({ x: ct.x + ct.rong / 2, z: ct.y + ct.sau / 2, r: BD.tamNhin(CB, ct.loai === "leu" ? "leu" : "nha", cl) });
      s.soi(nguonSoi);
      return s;
    }

    const api = {
      gio: () => gio(),

      async vaoVung(ten, chungLoai) {
        ten = tenChuan(ten);
        if (!ten) return { ok: false, lyDo: "Chưa có tên đăng nhập." };
        let be = tt.be[ten], lanDau = false;
        if (!be) {
          const daDung = new Set(Object.values(tt.be).map(b => b.cong));
          if (daDung.size >= Math.min(CB.soBeToiDa, vung.cong.length)) return { ok: false, lyDo: "Thung lũng đã đủ bạn rồi." }; // bản sao: TC_D02B3
          const cong = vung.cong.find(c => !daDung.has(c.so));
          const s = BD.taoSuongMu(vung.rong, vung.cao);
          s.khamPha(cong.x, cong.z, CB.banKinhCong);
          be = tt.be[ten] = { cong: cong.so, vaoLuc: gio(), khamPha: s.xuat(), chungLoai: chungLoai || "nhan" };
          tt.donVi.push({ id: ++tt.soId, chu: ten, loai: "thu_linh", x: cong.x, z: cong.z, lenh: null });
          lanDau = true;
          luu();
        } else if (chungLoai && be.chungLoai !== chungLoai) { be.chungLoai = chungLoai; luu(); }
        const cong = vung.cong.find(c => c.so === be.cong);
        return { ok: true, maVung: vung.ma, banSao: 1, cong: { so: cong.so, x: cong.x, z: cong.z }, lanDau, khamPha: be.khamPha,
          donVi: cuaBe(ten).map(d => ({ id: d.id, loai: d.loai, x: d.x, z: d.z, lenh: d.lenh })), gio: gio() };
      },

      async layQuanh(ten) {
        ten = tenChuan(ten);
        if (!tt.be[ten]) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const s = suongCua(ten);
        const thay = BD.locDonViThayDuoc(tt.donVi, cungPhe(ten), s, viTri);
        const nguon = Object.keys(tt.nguon).map(ma => ({ ma: Number(ma), con: tt.nguon[ma].con }));
        const congTrinh = tt.congTrinh.filter(ct => ct.chu === ten || s.muc(ct.x, ct.y) !== BD.DEN);
        return { ok: true, gio: gio(), nguon, congTrinh, donVi: thay.map(d => ({ id: d.id, chu: d.chu, loai: d.loai, x: d.x, z: d.z, lenh: d.lenh })) };
      },

      async guiLenh(ten, idDonVi, lenh) {
        ten = tenChuan(ten);
        const dv = tt.donVi.find(d => d.id === idDonVi);
        if (!dv || dv.chu !== ten) return { ok: false, lyDo: "Đây không phải người của con." };
        const den = lenh && lenh.den, tu = lenh && lenh.tu;
        if (!Array.isArray(den) || !Array.isArray(tu) || !den.every(Number.isFinite) || !tu.every(Number.isFinite)) return { ok: false, lyDo: "Lệnh không đúng." };
        // Máy chủ không tin chỗ đứng máy bé gửi: điểm xuất phát = vị trí hiện tại máy chủ tính
        const p = viTri(dv);
        const batDau = gio();
        dv.lenh = { tu: [p.x, p.z], den: [Math.floor(den[0]), Math.floor(den[1])], batDau, vaiTro: dv.loai };
        luu();
        return { ok: true, batDau, tu: dv.lenh.tu };
      },

      async guiThuHoach(ten, ds) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const bay = gio(), giay = Math.max(0, (bay - (be.guiLuc || be.vaoLuc)) / 1000);
        const soNd = cuaBe(ten).filter(d => d.loai === "nong_dan").length;
        const ra = [];
        for (const { ma, so } of ds || []) {
          const n = lang.nguonTheoMa(ma);
          if (!n || !lang.dangSong(n) || !(so > 0)) { ra.push({ ma, duoc: 0 }); continue; }
          // tốc độ tối đa: mọi nông dân của bé cùng làm nguồn loại này trong suốt khoảng giờ đó
          const toiDa = Math.floor(soNd * giay / lang.CH.nguon[n.loai].nhipLam);
          const duoc = Math.min(Math.floor(so), n.con, toiDa);
          n.con -= duoc;
          tt.nguon[ma] = { con: n.con, hetLuc: n.con <= 0 ? bay : null };
          ra.push({ ma, duoc });
        }
        be.guiLuc = bay;
        luu();
        return { ok: true, ds: ra };
      },

      async xay(ten, yeuCau) {
        ten = tenChuan(ten);
        if (!tt.be[ten]) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const { loai, x, y } = yeuCau, rong = yeuCau.rong || 1, sau = yeuCau.sau || 1;
        const s = suongCua(ten);
        const oDoiThu = new Set();
        for (const d of tt.donVi) if (d.chu !== ten) { const p = viTri(d); oDoiThu.add(Math.floor(p.z) * vung.rong + Math.floor(p.x)); }
        const kq = BD.oXayDuocVung({ lang, suong: s, coDoiThu: (ox, oy) => oDoiThu.has(oy * vung.rong + ox) }, x, y, rong, sau);
        if (!kq.duoc) return { ok: false, lyDo: kq.lyDo, ma: kq.ma };
        const ct = { id: ++tt.soId, chu: ten, loai, x, y, rong, sau, xayLuc: gio() };
        tt.congTrinh.push(ct);
        lang.datMong(x, y, rong, sau);
        luu();
        return { ok: true, id: ct.id };
      },

      async luuKhamPha(ten, chuoi) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const s = BD.taoSuongMu(vung.rong, vung.cao);
        s.nap(be.khamPha);
        if (!s.nap(chuoi)) return { ok: false, lyDo: "Mặt nạ không đúng." };
        be.khamPha = s.xuat();
        luu();
        return { ok: true };
      },

      // Chỉ trang thử + kiểm thử (bản Supabase không có): xoá hết để bé vào lại từ đầu (tải lại
      // trang sau khi gọi); đọc trạng thái thô
      async xoaHet() { tt = { phienBan: PHIEN_BAN, be: {}, donVi: [], congTrinh: [], nguon: {}, soId: 0 }; luu(); return { ok: true }; },
      _trangThai: () => tt
    };
    return api;
  }

  goc.KC_DT_MAY_CHU = { taoMayChuGia };
})(typeof window !== "undefined" ? window : globalThis);
// 26/10/2026 22:05 - BƯỚC: TC_D02B2a
