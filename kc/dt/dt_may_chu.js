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
//     vaoVung(ten)                 -> { ok, maVung, banSao, cong, lanDau, khamPha, donVi[], kho, gio }
//     layQuanh(ten)                -> { ok, gio, nguon[{ma, con}], congTrinh[], donVi[] }
//     guiLenh(ten, idDonVi, lenh)  -> { ok, batDau, tu }
//         lenh = { tu: [x, z], den: [ô x, ô y], viec?: mã nguồn đang làm, khamPha?: đang tự khám phá }
//     guiThuHoach(ten, [{ma, so}]) -> { ok, ds[{ma, duoc}], kho }
//     xay(ten, { loai, x, y, xoay? }) -> { ok, id, boTuong[], kho } | { ok: false, ma, lyDo }   (đặt móng)
//     xayTuong(ten, [[x, y]...])   -> { ok, ds[{id, x, y}], kho } | { ok: false, ma, lyDo, o }   (TC_D02C)
//     xayXong(ten, id)             -> { ok, donVi[] } (Lều trại: kèm nông dân đầu tiên) | { ok: false, lyDo }
//     luuKhamPha(ten, chuoiBase64) -> { ok }
//     gio()                        -> giờ máy chủ (ms)
//   kho: giống localStorage (getItem / setItem); không có thì giữ trong bộ nhớ.
//   TC_D02C: trừ giá khi đặt móng + giới hạn số mỗi bé; lãnh địa (tường + cổng đã xong khép kín):
//   bé khác không xây trong đó, lệnh đi không vào đó; tháp canh / tường / cổng soi sương theo tầm nhìn riêng.
// BƯỚC: TC_D02B2a; TC_D02B2b (dựng lều + nông dân đầu tiên, kho tài nguyên, lệnh nhớ việc); TC_D02C
// NGÀY: 26/10/2026; 27/10/2026; 28/10/2026 00:05
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
    // Lãnh địa từng bé (TC_D02C): tường + cổng ĐÃ DỰNG XONG
    const lanhDia = BD.taoBoLanhDia(vung.rong, vung.cao);
    const datCt = ct => {
      lang.datMong(ct.x, ct.y, ct.rong, ct.sau);
      if (ct.loai === "cong") lang.datCong(ct.x, ct.y, ct.rong, ct.sau, ct.chu, true);
      if (ct.xongLuc && BD.LA_RAO[ct.loai]) lanhDia.dat(ct.chu, ct.x, ct.y, ct.rong, ct.sau, true);
    };
    for (const ct of tt.congTrinh) datCt(ct);

    const viTri = dv => dv.lenh ? BD.viTriTuLenh(lang, dv.lenh, gio(), null, dv.chu) : { x: dv.x, z: dv.z };
    const khoCua = be => { const k = {}; for (const t in CH.lang.taiNguyen) k[t] = (be.kho && be.kho[t]) || 0; return k; };
    const cuaBe = ten => tt.donVi.filter(d => d.chu === ten);
    const cungPhe = ten => chu => chu === ten; // đồng minh: TC_D17B
    const trongCt = (c, x, y) => x >= c.x && x < c.x + c.rong && y >= c.y && y < c.y + c.sau;
    const laRaoCua = (ten, loai) => (x, y) => tt.congTrinh.some(c => c.chu === ten && (loai ? c.loai === loai : BD.LA_RAO[c.loai]) && trongCt(c, x, y));
    // Tài nguyên còn thiếu cho giá x n (null = đủ)
    const thieuGia = (be, gia, n) => { for (const t in gia || {}) if (((be.kho && be.kho[t]) || 0) < gia[t] * n) return t; return null; };
    const truGia = (be, gia, n) => { be.kho = be.kho || {}; for (const t in gia || {}) be.kho[t] = (be.kho[t] || 0) - gia[t] * n; };
    const loiThieu = t => ({ ok: false, ma: "thieu", lyDo: BD.LY_DO.thieu(CH.lang.taiNguyen[t].ten.toLowerCase()) });

    // Sương mù của một bé, tính tại máy chủ: đã khám phá (lưu) + sáng (đơn vị + công trình đã xong của phe)
    function suongCua(ten) {
      const s = BD.taoSuongMu(vung.rong, vung.cao), be = tt.be[ten];
      if (be && be.khamPha) s.nap(be.khamPha);
      const cl = be && be.chungLoai;
      const nguonSoi = cuaBe(ten).map(d => { const p = viTri(d); return { x: p.x, z: p.z, r: BD.tamNhin(CB, d.loai, cl) }; });
      for (const ct of tt.congTrinh) if (ct.chu === ten && ct.xongLuc) nguonSoi.push({ x: ct.x + ct.rong / 2, z: ct.y + ct.sau / 2, r: BD.tamNhinCt(CB, ct.loai, cl) });
      s.soi(nguonSoi);
      return s;
    }
    // Điều kiện ô xây được của bé (mục 4): sương, đơn vị đối thủ, lãnh địa đối thủ; cổng được đè tường của bé
    function theXay(ten, loai) {
      const oDoiThu = new Set();
      for (const d of tt.donVi) if (d.chu !== ten) { const p = viTri(d); oDoiThu.add(Math.floor(p.z) * vung.rong + Math.floor(p.x)); }
      return { lang, suong: suongCua(ten), coDoiThu: (ox, oy) => oDoiThu.has(oy * vung.rong + ox),
        laLanhDiaDoiThu: (ox, oy) => !!lanhDia.chuO(ox, oy, ten), deLen: loai === "cong" ? laRaoCua(ten, "tuong") : null };
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
          be = tt.be[ten] = { cong: cong.so, vaoLuc: gio(), khamPha: s.xuat(), chungLoai: chungLoai || "nhan", kho: {} };
          tt.donVi.push({ id: ++tt.soId, chu: ten, loai: "thu_linh", x: cong.x, z: cong.z, lenh: null });
          lanDau = true;
          luu();
        } else if (chungLoai && be.chungLoai !== chungLoai) { be.chungLoai = chungLoai; luu(); }
        const cong = vung.cong.find(c => c.so === be.cong);
        return { ok: true, maVung: vung.ma, banSao: 1, cong: { so: cong.so, x: cong.x, z: cong.z }, lanDau, khamPha: be.khamPha,
          donVi: cuaBe(ten).map(d => ({ id: d.id, loai: d.loai, x: d.x, z: d.z, lenh: d.lenh })), kho: khoCua(be), gio: gio() };
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
        // TC_D02C: không đi vào lãnh địa của bé khác (đường đi máy bé đã vòng qua tường; đây là chốt chặn)
        if (lanhDia.chuO(Math.floor(den[0]), Math.floor(den[1]), ten)) return { ok: false, ma: "vao_lanh_dia", lyDo: "Đây là lãnh địa của bạn khác, không vào được." };
        // Máy chủ không tin chỗ đứng máy bé gửi: điểm xuất phát = vị trí hiện tại máy chủ tính
        const p = viTri(dv);
        const batDau = gio();
        dv.lenh = { tu: [p.x, p.z], den: [Math.floor(den[0]), Math.floor(den[1])], batDau, vaiTro: dv.loai,
          viec: Number.isInteger(lenh.viec) ? lenh.viec : null, khamPha: !!lenh.khamPha };
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
          be.kho = be.kho || {};
          be.kho[n.taiNguyen] = (be.kho[n.taiNguyen] || 0) + duoc; // kho của bé giữ ở máy chủ
          ra.push({ ma, duoc });
        }
        be.guiLuc = bay;
        luu();
        return { ok: true, ds: ra, kho: khoCua(be) };
      },

      // xoay (TC_D02C): cổng dọc 1 x 3. Trừ giá (cau_hinh congTrinh.*.gia) khỏi kho của bé; giới hạn số mỗi bé.
      // Cổng đè lên tường của chính bé: các ô tường đó bị bỏ (kq.boTuong = id tường đã bỏ).
      async xay(ten, yeuCau) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const { loai, x, y } = yeuCau, mau = CH.congTrinh && CH.congTrinh[loai];
        let rong = mau ? mau.rong : yeuCau.rong || 1, sau = mau ? mau.sau : yeuCau.sau || 1; // cỡ theo cau_hinh, không tin máy bé
        if (yeuCau.xoay) [rong, sau] = [sau, rong];
        if (loai === "tuong") return { ok: false, ma: "lenh", lyDo: "Lệnh không đúng." }; // tường: xayTuong
        if (loai === "leu" && tt.congTrinh.some(ct => ct.chu === ten && ct.loai === "leu")) return { ok: false, ma: "da_co", lyDo: "Con đã có Lều trại rồi." };
        if (mau && mau.gioiHan && tt.congTrinh.filter(ct => ct.chu === ten && ct.loai === loai).length >= mau.gioiHan) return { ok: false, ma: "gioi_han", lyDo: BD.LY_DO.gioi_han(mau.ten) };
        const thieu = thieuGia(be, mau && mau.gia, 1);
        if (thieu) return loiThieu(thieu);
        const kq = BD.oXayDuocVung(theXay(ten, loai), x, y, rong, sau);
        if (!kq.duoc) return { ok: false, lyDo: kq.lyDo, ma: kq.ma };
        const boTuong = [];
        if (loai === "cong") tt.congTrinh = tt.congTrinh.filter(c => {
          let de = false;
          for (let oy = y; oy < y + sau && !de; oy++) for (let ox = x; ox < x + rong; ox++) if (trongCt(c, ox, oy)) { de = true; break; }
          if (!de || c.chu !== ten || c.loai !== "tuong") return true;
          boTuong.push(c.id);
          if (c.xongLuc) lanhDia.dat(ten, c.x, c.y, c.rong, c.sau, false);
          return false;
        });
        truGia(be, mau && mau.gia, 1);
        const ct = { id: ++tt.soId, chu: ten, loai, x, y, rong, sau, xayLuc: gio(), xongLuc: null };
        tt.congTrinh.push(ct);
        datCt(ct);
        luu();
        return { ok: true, id: ct.id, boTuong, kho: khoCua(be) };
      },

      // Đoạn tường (TC_D02C): dsO = [[x, y], ...] tối đa doanToiDa ô; ô đã có tường / cổng của bé thì bỏ qua
      // (nối góc); mọi ô còn lại phải xây được, không thì không xây ô nào. -> { ok, ds[{id, x, y}], kho }
      async xayTuong(ten, dsO) {
        ten = tenChuan(ten);
        const be = tt.be[ten], mau = CH.congTrinh.tuong;
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        if (!Array.isArray(dsO) || !dsO.length || dsO.length > mau.doanToiDa || !dsO.every(o => Array.isArray(o) && o.every(Number.isInteger))) return { ok: false, ma: "lenh", lyDo: "Lệnh không đúng." };
        const raoMinh = laRaoCua(ten), daCo = new Set(), moi = [];
        for (const [ox, oy] of dsO) { const k = oy * vung.rong + ox; if (!daCo.has(k) && !raoMinh(ox, oy)) moi.push([ox, oy]); daCo.add(k); }
        if (!moi.length) return { ok: true, ds: [], kho: khoCua(be) };
        const thieu = thieuGia(be, mau.gia, moi.length);
        if (thieu) return loiThieu(thieu);
        const the = theXay(ten, "tuong");
        for (const [ox, oy] of moi) { const k = BD.oXayDuoc(the, ox, oy); if (!k.duoc) return { ok: false, ma: k.ma, lyDo: k.lyDo, o: [ox, oy] }; }
        truGia(be, mau.gia, moi.length);
        const ds = moi.map(([ox, oy]) => {
          const ct = { id: ++tt.soId, chu: ten, loai: "tuong", x: ox, y: oy, rong: 1, sau: 1, xayLuc: gio(), xongLuc: null };
          tt.congTrinh.push(ct); datCt(ct);
          return { id: ct.id, x: ox, y: oy };
        });
        luu();
        return { ok: true, ds, kho: khoCua(be) };
      },

      // Dựng xong (máy bé báo khi người đứng sát móng làm đủ giờ). Máy chủ không cho xong sớm
      // hơn giayXay kể từ lúc đặt móng. Lều trại xong: sinh nongDanDau nông dân ở quanh lều.
      async xayXong(ten, id) {
        ten = tenChuan(ten);
        const ct = tt.congTrinh.find(c => c.id === id);
        if (!ct || ct.chu !== ten) return { ok: false, lyDo: "Đây không phải nhà của con." };
        if (ct.xongLuc) return { ok: false, lyDo: "Nhà này dựng xong rồi." };
        const mau = (CH.congTrinh && CH.congTrinh[ct.loai]) || { giayXay: 0 };
        if (gio() - ct.xayLuc < mau.giayXay * 1000 - 500) return { ok: false, lyDo: "Chưa dựng xong đâu, con chờ thêm chút nhé." };
        ct.xongLuc = gio();
        if (BD.LA_RAO[ct.loai]) lanhDia.dat(ten, ct.x, ct.y, ct.rong, ct.sau, true); // tường / cổng xong: tính lại lãnh địa
        const moi = [];
        if (ct.loai === "leu") {
          // ô quanh lều, gần cửa (phía nam) trước; mỗi người một ô
          const cho = [], cx = ct.x + ct.rong / 2, cz = ct.y + ct.sau + 1;
          for (let oy = ct.y - 1; oy <= ct.y + ct.sau; oy++) for (let ox = ct.x - 1; ox <= ct.x + ct.rong; ox++) {
            if (oy >= ct.y && oy < ct.y + ct.sau && ox >= ct.x && ox < ct.x + ct.rong) continue;
            if (goc.KC_DT_LUOI.diDuoc(lang.luoi, ox, oy)) cho.push({ x: ox + 0.5, z: oy + 0.5, d: Math.hypot(ox + 0.5 - cx, oy + 0.5 - cz) });
          }
          cho.sort((a, b) => a.d - b.d);
          for (let i = 0; i < (mau.nongDanDau || 0); i++) {
            const p = cho[i % Math.max(1, cho.length)] || { x: cx, z: cz };
            const dv = { id: ++tt.soId, chu: ten, loai: "nong_dan", x: p.x, z: p.z, lenh: null };
            tt.donVi.push(dv); moi.push({ id: dv.id, loai: dv.loai, x: dv.x, z: dv.z, lenh: null });
          }
        }
        luu();
        return { ok: true, donVi: moi };
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
      _trangThai: () => tt, _lanhDia: lanhDia
    };
    return api;
  }

  goc.KC_DT_MAY_CHU = { taoMayChuGia };
})(typeof window !== "undefined" ? window : globalThis);
// 28/10/2026 00:05 - BƯỚC: TC_D02C
