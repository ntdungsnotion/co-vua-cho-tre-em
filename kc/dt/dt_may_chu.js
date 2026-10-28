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
//   TC_D03A - MÁY CHỦ GIỮ TIẾN ĐỘ XÂY + TÍNH BÙ KHI BÉ VẮNG MẶT (SQL làm y hệt):
//   - lenh có thêm xay (id công trình đang tới xây) + hang (id móng xây tiếp). tinhXay(bé): mô phỏng từ lần
//     tính trước tới giờ: mỗi công trình tiến theo số người ĐÃ TỚI nơi (KC_DT_LANG.tocDoXay), xong thì người
//     xây sang móng kế trong hàng, hết hàng thì nghỉ. Gọi trước mọi việc đổi lệnh + khi hỏi lại -> điều người
//     đi thì công trình dừng đúng chỗ. xayXong chỉ nhận khi máy chủ thấy đã xong (cho sớm tối đa xay.treGiay giây).
//   - bé không liên lạc quá lang.vangMat.sauGiay giây = vắng mặt: tinhVang(bé) tính bù việc nông dân đang
//     làm (chuyến đi về lều theo khoảng cách + sức mang + nhịp làm), nguồn cạn thì sang nguồn sát bên, kho
//     đầy thì dừng; không giới hạn số giờ. Bé khác đang chơi: tính bù tối đa mỗi tinhLaiGiay giây (nguồn
//     chung vơi đúng). vaoVung trả vang = { giay, thu{tài nguyên: số}, xong[loại], day{tài nguyên} }.
//   - guiThuHoach: kho mỗi loại không quá sức chứa (congTrinh.*.sucChua của công trình đã xong).
//   TC_D03B1 - KHO RIÊNG + DÂN SỐ + SINH NÔNG DÂN (SQL làm y hệt):
//   - sức chứa theo cấp + chủng loại (KC_DT_LANG.sucChuaCt); tính bù vắng mặt: chuyến đi về chỗ cất GẦN NHẤT nhận
//     loại tài nguyên đó (Lều trại hoặc kho đúng loại).
//   - sinhNongDan(ten) -> { ok, hang{so, batDau}, kho, danSo, choO } | { ok: false, ma: chua_leu | hang_day | cho_o | thieu }:
//     xếp hàng ở Lều trại, trả giá lúc xếp; tinhSinh(bé) ra từng người mỗi congTrinh.leu.sinh.giay giây theo giờ máy
//     chủ (cả khi bé vắng mặt; vang.sinh = số người ra lúc vắng). vaoVung + layQuanh trả hang (null = không có ai chờ).
//   TC_D03B2 - RUỘNG (SQL làm y hệt): ruộng xong (hoanThanh) có trongLuc / con (sanLuong theo cấp) / gatLuc; chín sau
//     chinGiay giây giờ máy chủ. Lệnh viec < 0 = gặt ruộng id -viec: guiThuHoach nhận khi chín, gặt hết -> gatLuc (bãi);
//     tinhVang gặt bù khi vắng mặt (chờ chín, chuyến về chỗ cất gần nhất như hái quả; vang.gat = số ruộng gặt hết);
//     donRuong: bãi quá coSauGiay giây thành cỏ (bỏ ruộng); xay ruộng: tâm cách tâm Lều trại ≤ cachLeuToiDa ô (xa_leu);
//     trongLai(ten, id) -> { ok, id, trongLuc, con, kho } | { ok: false, ma: het_bai | chua_gat | thieu }.
// BƯỚC: TC_D02B2a; TC_D02B2b (dựng lều + nông dân đầu tiên, kho tài nguyên, lệnh nhớ việc); TC_D02C; TC_D03A; TC_D03B1; TC_D03B2
// NGÀY: 26/10/2026; 27/10/2026; 28/10/2026 00:05; 28/10/2026 10:50; 28/10/2026 15:10; 28/10/2026 19:05
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
    const LUOI = goc.KC_DT_LUOI;
    const oCua = (ct, f) => { for (let oy = ct.y; oy < ct.y + ct.sau; oy++) for (let ox = ct.x; ox < ct.x + ct.rong; ox++) if (ox >= 0 && oy >= 0 && ox < vung.rong && oy < vung.cao) f(ox, oy); };
    const datCt = ct => {
      lang.datMong(ct.x, ct.y, ct.rong, ct.sau);
      if (ct.loai === "cong") lang.datCong(ct.x, ct.y, ct.rong, ct.sau, ct.chu, true);
      if (ct.loai === "ruong") oCua(ct, (ox, oy) => LUOI.datChan(lang.luoi, ox, oy, false)); // TC_D03B2: ô ruộng đi được
      if (ct.xongLuc && BD.LA_RAO[ct.loai]) lanhDia.dat(ct.chu, ct.x, ct.y, ct.rong, ct.sau, true);
    };
    for (const ct of tt.congTrinh) datCt(ct);

    const viTri = dv => dv.lenh ? BD.viTriTuLenh(lang, dv.lenh, gio(), null, dv.chu) : { x: dv.x, z: dv.z };
    const khoCua = be => { const k = {}; for (const t in CH.lang.taiNguyen) k[t] = (be.kho && be.kho[t]) || 0; return k; };
    const hangCua = be => (be && be.hangSinh && be.hangSinh.so ? { so: be.hangSinh.so, batDau: be.hangSinh.batDau } : null); // TC_D03B1
    const cuaBe = ten => tt.donVi.filter(d => d.chu === ten);
    const cungPhe = ten => chu => chu === ten; // đồng minh: TC_D17B
    const trongCt = (c, x, y) => x >= c.x && x < c.x + c.rong && y >= c.y && y < c.y + c.sau;
    const laRaoCua = (ten, loai) => (x, y) => tt.congTrinh.some(c => c.chu === ten && (loai ? c.loai === loai : BD.LA_RAO[c.loai]) && trongCt(c, x, y));
    // Tài nguyên còn thiếu cho giá x n (null = đủ)
    const thieuGia = (be, gia, n) => { for (const t in gia || {}) if (((be.kho && be.kho[t]) || 0) < gia[t] * n) return t; return null; };
    const truGia = (be, gia, n) => { be.kho = be.kho || {}; for (const t in gia || {}) be.kho[t] = (be.kho[t] || 0) - gia[t] * n; };
    const loiThieu = t => ({ ok: false, ma: "thieu", lyDo: BD.LY_DO.thieu(CH.lang.taiNguyen[t].ten.toLowerCase()) });

    // ---------------- TC_D03A: tiến độ xây + tính bù khi vắng mặt ----------------
    const VM = CH.lang.vangMat, TOC = CH.lang.tocDo;
    const mauCt = loai => (CH.congTrinh && CH.congTrinh[loai]) || { giayXay: 0 };
    // Giây đi hết lệnh theo đường thẳng (như SQL kc_dt_giay_di; Thủ lĩnh chạy khi xa, như viTriTuLenh)
    function giayDi(l) {
      const L = Math.hypot(l.den[0] + 0.5 - l.tu[0], l.den[1] + 0.5 - l.tu[1]);
      if (l.vaiTro === "thu_linh" && L > TOC.chayKhiXaHon) return (L - TOC.chayKhiXaHon) / TOC.chay + TOC.chayKhiXaHon / TOC.di;
      return L / TOC.di;
    }
    const toiLuc = l => l.batDau + giayDi(l) * 1000;
    // Sức chứa mỗi loại tài nguyên của bé: tổng sucChua công trình đã xong (lõi: lang.sucChua; TC_D03B1: theo cấp + chủng loại)
    function sucChua(ten, t) {
      const cl = tt.be[ten] && tt.be[ten].chungLoai;
      let s = 0;
      for (const c of tt.congTrinh) if (c.chu === ten && c.xongLuc) s += LANG.sucChuaCt(CH, c.loai, c.cap, cl, t);
      return s;
    }
    // TC_D03B1: chỗ ở (Lều 5, Nhà ở 3 mỗi nhà đã xong) + dân số (đơn vị chiếm chỗ ở: nông dân)
    const choO = ten => tt.congTrinh.reduce((s, c) => s + (c.chu === ten && c.xongLuc ? LANG.choOCt(CH, c.loai) : 0), 0);
    const danSo = ten => tt.donVi.filter(d => d.chu === ten && LANG.chiemCho(CH, d.loai)).length;
    const leuXongCua = ten => tt.congTrinh.find(c => c.chu === ten && c.loai === "leu" && c.xongLuc) || null;
    // Ô quanh lều đi được, gần cửa (phía nam) trước (SQL: kc_dt_cho_quanh)
    function choQuanh(ct) {
      const cho = [], cx = ct.x + ct.rong / 2, cz = ct.y + ct.sau + 1;
      for (let oy = ct.y - 1; oy <= ct.y + ct.sau; oy++) for (let ox = ct.x - 1; ox <= ct.x + ct.rong; ox++) {
        if (oy >= ct.y && oy < ct.y + ct.sau && ox >= ct.x && ox < ct.x + ct.rong) continue;
        if (goc.KC_DT_LUOI.diDuoc(lang.luoi, ox, oy)) cho.push({ x: ox + 0.5, z: oy + 0.5, d: Math.hypot(ox + 0.5 - cx, oy + 0.5 - cz) });
      }
      cho.sort((a, b) => a.d - b.d);
      return cho.length ? cho : [{ x: cx, z: cz }];
    }
    // Công trình xong (mô phỏng hoặc báo xong): tường / cổng tính lại lãnh địa; Lều trại sinh nông dân đầu tiên
    function hoanThanh(ct, luc) {
      ct.xongLuc = luc; ct.tienDo = 1;
      if (BD.LA_RAO[ct.loai]) lanhDia.dat(ct.chu, ct.x, ct.y, ct.rong, ct.sau, true);
      if (ct.loai === "ruong") { ct.trongLuc = luc; ct.con = LANG.sanLuongRuong(CH, ct.cap); ct.gatLuc = null; } // TC_D03B2: xong là trồng
      if (ct.loai !== "leu") return;
      const cho = choQuanh(ct); // mỗi người một ô
      for (let i = 0; i < (mauCt("leu").nongDanDau || 0); i++) {
        const p = cho[i % cho.length];
        tt.donVi.push({ id: ++tt.soId, chu: ct.chu, loai: "nong_dan", x: p.x, z: p.z, lenh: null });
      }
    }
    // TC_D03B1: hàng sinh nông dân ở Lều trại (be.hangSinh = { so, batDau }: batDau = lúc người đầu hàng bắt đầu).
    // Mỗi sinh.giay giây ra một người ở ô quanh lều (theo giờ máy chủ, cả khi bé vắng mặt). Trả số người vừa ra.
    function tinhSinh(ten, bay) {
      const be = tt.be[ten], h = be.hangSinh, leu = leuXongCua(ten);
      if (!h || !h.so || !leu) return 0;
      const ms = mauCt("leu").sinh.giay * 1000, cho = choQuanh(leu);
      let ra = 0;
      while (h.so > 0 && h.batDau + ms <= bay) {
        if (danSo(ten) >= choO(ten)) break; // hết chỗ ở (chỉ khi cài đặt đổi): chờ, có chỗ thì ra ngay
        const p = cho[danSo(ten) % cho.length];
        tt.donVi.push({ id: ++tt.soId, chu: ten, loai: "nong_dan", x: p.x, z: p.z, lenh: null });
        h.so--; h.batDau += ms; ra++;
      }
      if (!h.so) be.hangSinh = null;
      return ra;
    }
    // Mô phỏng xây của bé từ be.xayBuLuc tới bay (SQL: kc_dt_tinh_xay). Trả các công trình vừa xong.
    function tinhXay(ten, bay) {
      const be = tt.be[ten];
      const tu = be.xayBuLuc != null ? be.xayBuLuc : be.vaoLuc;
      be.xayBuLuc = Math.max(tu, bay);
      const ct = new Map();
      for (const c of tt.congTrinh) if (c.chu === ten && !c.xongLuc) ct.set(c.id, c);
      const tho = [];
      for (const d of tt.donVi) if (d.chu === ten && d.lenh && d.lenh.xay != null) {
        const c = ct.get(d.lenh.xay);
        tho.push({ d, dich: c && LANG.duocXay(d.loai, c.loai) ? c.id : null, hang: (d.lenh.hang || []).slice(), toi: toiLuc(d.lenh), doi: false });
      }
      if (!ct.size || !tho.length || bay <= tu) return [];
      const conXay = (t, id) => { const c = ct.get(id); return !!c && !c.xongLuc && LANG.duocXay(t.d.loai, c.loai); };
      const sangTiep = (t, luc) => { // đích xong / không xây được: sang móng kế (ngay tại chỗ), hết thì nghỉ
        t.dich = null; t.doi = true;
        while (t.hang.length) { const id = t.hang.shift(); if (conXay(t, id)) { t.dich = id; t.toi = luc; break; } }
      };
      for (const t of tho) if (t.dich == null && (t.d.lenh.xay != null)) sangTiep(t, Math.max(tu, t.toi));
      const xong = [];
      let t0 = tu;
      for (let vong = 0; vong < 2000 && t0 < bay; vong++) {
        const so = new Map(); let toiSau = Infinity;
        for (const t of tho) if (t.dich != null) { if (t.toi <= t0) so.set(t.dich, (so.get(t.dich) || 0) + 1); else toiSau = Math.min(toiSau, t.toi); }
        if (!so.size && toiSau === Infinity) break;
        let t1 = Math.min(bay, toiSau);
        for (const [id, n] of so) { const c = ct.get(id), v = LANG.tocDoXay(CH, { giayXay: mauCt(c.loai).giayXay, cap: c.cap }, n); t1 = Math.min(t1, t0 + (1 - (c.tienDo || 0)) / v * 1000); }
        for (const [id, n] of so) {
          const c = ct.get(id), v = LANG.tocDoXay(CH, { giayXay: mauCt(c.loai).giayXay, cap: c.cap }, n);
          c.tienDo = Math.min(1, (c.tienDo || 0) + v * (t1 - t0) / 1000);
          if (c.tienDo >= 1 - 1e-9) { hoanThanh(c, Math.round(t1)); xong.push(c); }
        }
        for (const t of tho) if (t.dich != null && ct.get(t.dich).xongLuc) sangTiep(t, t1);
        t0 = t1;
      }
      // người đã sang móng khác / thôi xây: chỉ đổi phần xây của lệnh, GIỮ chỗ đứng (lệnh kế của máy bé so tốc độ
      // với chỗ thật; móng kế liền bên nên coi như đã tới)
      for (const t of tho) if (t.doi) {
        const c = t.dich != null ? ct.get(t.dich) : null;
        t.d.lenh = Object.assign({}, t.d.lenh, c ? { xay: c.id, hang: t.hang, viec: null } : { xay: null, hang: [] });
      }
      return xong;
    }
    // Số món một nông dân mang về mỗi mili giây ở nguồn n (đi về chỗ cất + làm đủ một lần vác).
    // TC_D03B1: chỗ cất = công trình đã xong của bé GẦN NHẤT nhận loại tài nguyên đó (Lều trại hoặc kho đúng loại);
    // quãng = từ nguồn tới tâm công trình trừ (nửa cạnh dài + 1) ô (Lều 2 x 2: trừ 2 như TC_D03A)
    function nhipThu(n, ten, cl) {
      const sm = CH.lang.sucMang[cl] || CH.lang.sucMang.nhan;
      let d = Infinity;
      for (const c of tt.congTrinh) if (c.chu === ten && c.xongLuc && LANG.nhanCat(CH, c.loai, n.taiNguyen))
        d = Math.min(d, Math.hypot(n.x - (c.x + c.rong / 2), n.z - (c.y + c.sau / 2)) - (Math.max(c.rong, c.sau) / 2 + 1));
      if (d === Infinity) return 0;
      d = Math.max(0.5, d);
      return sm / (2 * d * VM.heSoDuong / TOC.di + sm * CH.lang.nguon[n.loai].nhipLam) / 1000;
    }
    // ---------------- TC_D03B2: ruộng (công trình có thêm trongLuc, con, gatLuc) ----------------
    const MR = LANG.mauRuong(CH);
    const ruongCua = (ten, id) => tt.congTrinh.find(c => c.id === id && c.chu === ten && c.loai === "ruong" && c.xongLuc) || null;
    const chinLuc = ct => ct.trongLuc + MR.chinGiay * 1000;
    const tamRuong = ct => ({ x: ct.x + ct.rong / 2, z: ct.y + ct.sau / 2, taiNguyen: CH.lang.nguon.ruong.taiNguyen, loai: "ruong" });
    // Bãi gặt hết bỏ quá coSauGiay giây thành cỏ: bỏ ruộng, trả ô (SQL: kc_dt_don_ruong)
    function donRuong(ten, bay) {
      tt.congTrinh = tt.congTrinh.filter(c => {
        if (c.chu !== ten || c.loai !== "ruong" || c.gatLuc == null || LANG.giaiDoanRuong(CH, c, bay) !== "co") return true;
        oCua(c, (ox, oy) => { lang.danh[oy * vung.rong + ox] = 0; LUOI.datChan(lang.luoi, ox, oy, false); });
        return false;
      });
    }
    // Tính bù việc nông dân lúc bé vắng mặt (SQL: kc_dt_tinh_vang)
    function tinhVang(ten, bay, bao) {
      const be = tt.be[ten];
      const tu = Math.max(be.songLuc || be.vaoLuc, be.buLuc || 0);
      be.buLuc = Math.max(tu, bay);
      const leu = tt.congTrinh.find(c => c.chu === ten && c.loai === "leu" && c.xongLuc);
      if (!leu || bay <= tu) return;
      be.kho = be.kho || {};
      for (const d of cuaBe(ten)) {
        const l = d.lenh;
        if (d.loai !== "nong_dan" || !l || l.viec == null || l.xay != null) continue;
        if (l.viec < 0) { // TC_D03B2: gặt ruộng: chờ lúa chín, gánh về chỗ cất gần nhất; gặt hết thì thành bãi (không tự trồng lại)
          const ct = ruongCua(ten, -l.viec);
          if (!ct || ct.gatLuc != null) continue;
          const nr = tamRuong(ct), tn = nr.taiNguyen, cho = sucChua(ten, tn) - (be.kho[tn] || 0);
          const t = Math.max(tu, toiLuc(l), leu.xongLuc, chinLuc(ct));
          if (t >= bay) continue;
          if (cho <= 0) { bao.day[tn] = true; continue; }
          const v = nhipThu(nr, ten, be.chungLoai), lay = v > 0 ? Math.min(Math.floor(v * (bay - t)), ct.con, cho) : 0;
          if (lay <= 0) continue;
          ct.con -= lay;
          be.kho[tn] = (be.kho[tn] || 0) + lay;
          bao.thu[tn] = (bao.thu[tn] || 0) + lay;
          if (ct.con <= 0) { ct.gatLuc = Math.round(t + lay / v); bao.gat = (bao.gat || 0) + 1; }
          if (lay === cho) bao.day[tn] = true;
          continue;
        }
        let n = lang.nguonTheoMa(l.viec), doi = false, t = Math.max(tu, toiLuc(l), leu.xongLuc);
        while (n && lang.dangSong(n) && t < bay) {
          const tn = n.taiNguyen, cho = sucChua(ten, tn) - (be.kho[tn] || 0);
          if (cho <= 0) { bao.day[tn] = true; break; }
          const v = nhipThu(n, ten, be.chungLoai), lay = v > 0 ? Math.min(Math.floor(v * (bay - t)), n.con, cho) : 0;
          if (lay <= 0) break;
          n.con -= lay;
          tt.nguon[n.ma] = { con: n.con, hetLuc: n.con <= 0 ? bay : null };
          be.kho[tn] = (be.kho[tn] || 0) + lay;
          bao.thu[tn] = (bao.thu[tn] || 0) + lay;
          t += lay / v;
          if (lay === cho) { bao.day[tn] = true; break; } // vừa đầy kho
          if (n.con > 0) break; // hết giờ hoặc kho đầy
          const tiep = lang.nguonSatBen(n);
          if (!tiep) break;
          n = tiep; doi = true;
        }
        if (doi) d.lenh = Object.assign({}, l, { tu: [l.den[0] + 0.5, l.den[1] + 0.5], den: [n.o.x, n.o.y], batDau: Math.round(t), viec: n.ma });
      }
    }
    // Tính bù cho một bé trước khi trả lời: xây (luôn) + việc nông dân (khi bé vắng mặt; bé khác hỏi thì
    // tối đa mỗi tinhLaiGiay giây). Ghi lời báo vắng mặt vào be.baoVang (vaoVung trả rồi xoá).
    function tinhBu(ten, bay, laChinh) {
      const be = tt.be[ten];
      const vang = bay - (be.songLuc || be.vaoLuc) > VM.sauGiay * 1000;
      if (!laChinh && vang && bay - (be.buLuc || 0) < VM.tinhLaiGiay * 1000) return;
      const bao = vang ? (be.baoVang = be.baoVang || { tu: be.songLuc || be.vaoLuc, thu: {}, xong: [], day: {} }) : null;
      const xong = tinhXay(ten, bay);
      const sinh = tinhSinh(ten, bay); // TC_D03B1: sau xây (Nhà ở vừa xong thì có chỗ)
      donRuong(ten, bay); // TC_D03B2
      if (!bao) return;
      for (const c of xong) bao.xong.push(c.loai);
      if (sinh) bao.sinh = (bao.sinh || 0) + sinh;
      tinhVang(ten, bay, bao);
      donRuong(ten, bay); // ruộng gặt hết lúc vắng mặt mà đã quá hạn bãi
    }
    const songLai = (ten, bay) => { tinhBu(ten, bay, true); tt.be[ten].songLuc = bay; };

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
        laLanhDiaDoiThu: (ox, oy) => !!lanhDia.chuO(ox, oy, ten), deLen: loai === "cong" ? laRaoCua(ten, "tuong") : null,
        ganLeu: loai === "ruong" ? BD.kiemGanLeu(leuXongCua(ten), MR.cachLeuToiDa) : null }; // TC_D03B2
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
        } else if (chungLoai && be.chungLoai !== chungLoai) be.chungLoai = chungLoai;
        // TC_D03A: tính bù lúc vắng mặt rồi mới trả trạng thái; lời báo trả một lần
        const bay = gio();
        songLai(ten, bay);
        const b = be.baoVang;
        delete be.baoVang;
        luu();
        const vang = b ? { giay: Math.round((bay - b.tu) / 1000), thu: b.thu, xong: b.xong, day: Object.keys(b.day), sinh: b.sinh || 0, gat: b.gat || 0 } : null;
        const cong = vung.cong.find(c => c.so === be.cong);
        return { ok: true, maVung: vung.ma, banSao: 1, cong: { so: cong.so, x: cong.x, z: cong.z }, lanDau, khamPha: be.khamPha,
          donVi: cuaBe(ten).map(d => ({ id: d.id, loai: d.loai, x: d.x, z: d.z, lenh: d.lenh })), kho: khoCua(be), vang, gio: bay, hang: hangCua(be) };
      },

      async layQuanh(ten) {
        ten = tenChuan(ten);
        if (!tt.be[ten]) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const bay = gio(); // TC_D03A: bé này còn đang chơi; tính bù xây mọi bé + việc của bé vắng mặt
        tt.be[ten].songLuc = bay;
        for (const k in tt.be) tinhBu(k, bay, false);
        luu();
        const s = suongCua(ten);
        const thay = BD.locDonViThayDuoc(tt.donVi, cungPhe(ten), s, viTri);
        const nguon = Object.keys(tt.nguon).map(ma => ({ ma: Number(ma), con: tt.nguon[ma].con }));
        const congTrinh = tt.congTrinh.filter(ct => ct.chu === ten || s.muc(ct.x, ct.y) !== BD.DEN);
        return { ok: true, gio: gio(), nguon, congTrinh, donVi: thay.map(d => ({ id: d.id, chu: d.chu, loai: d.loai, x: d.x, z: d.z, lenh: d.lenh })),
          hang: hangCua(tt.be[ten]) };
      },

      // TC_D03B1: xếp một nông dân vào hàng sinh ở Lều trại (chỉ nhà chính sinh nông dân). Trả giá lúc xếp; cần
      // lều xong, hàng chưa đủ sinh.hangToiDa, dân số + hàng chờ < chỗ ở. -> { ok, hang, kho, danSo, choO }
      async sinhNongDan(ten) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const bay = gio();
        songLai(ten, bay);
        if (!leuXongCua(ten)) return { ok: false, ma: "chua_leu", lyDo: BD.LY_DO.chua_leu() };
        const S = mauCt("leu").sinh, h = be.hangSinh || { so: 0, batDau: bay };
        if (h.so >= S.hangToiDa) return { ok: false, ma: "hang_day", lyDo: BD.LY_DO.hang_day(S.hangToiDa) };
        const co = danSo(ten) + h.so, toiDa = choO(ten);
        if (co >= toiDa) return { ok: false, ma: "cho_o", co, toiDa, lyDo: BD.LY_DO.cho_o(co, toiDa) };
        const thieu = thieuGia(be, S.gia, 1);
        if (thieu) return loiThieu(thieu);
        truGia(be, S.gia, 1);
        if (!h.so) h.batDau = bay;
        h.so++; be.hangSinh = h;
        luu();
        return { ok: true, hang: hangCua(be), kho: khoCua(be), danSo: danSo(ten), choO: toiDa, gio: bay };
      },

      // TC_D03B2: trồng lại trên bãi đã gặt (chưa thành cỏ), trả congTrinh.ruong.ruong.giaTrongLai
      // -> { ok, id, trongLuc, con, kho } | { ok: false, ma: het_bai | chua_gat | thieu }
      async trongLai(ten, id) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const bay = gio();
        songLai(ten, bay); // bãi quá hạn thì đã thành cỏ
        const ct = tt.congTrinh.find(c => c.id === id && c.chu === ten && c.loai === "ruong");
        if (!ct) return { ok: false, ma: "het_bai", lyDo: BD.LY_DO.het_bai() };
        if (!ct.xongLuc || ct.gatLuc == null) return { ok: false, ma: "chua_gat", lyDo: BD.LY_DO.chua_gat() };
        const thieu = thieuGia(be, MR.giaTrongLai, 1);
        if (thieu) return loiThieu(thieu);
        truGia(be, MR.giaTrongLai, 1);
        ct.trongLuc = bay; ct.con = LANG.sanLuongRuong(CH, ct.cap); ct.gatLuc = null;
        luu();
        return { ok: true, id: ct.id, trongLuc: bay, con: ct.con, kho: khoCua(be), gio: bay };
      },

      async guiLenh(ten, idDonVi, lenh) {
        ten = tenChuan(ten);
        const dv = tt.donVi.find(d => d.id === idDonVi);
        if (!dv || dv.chu !== ten) return { ok: false, lyDo: "Đây không phải người của con." };
        const den = lenh && lenh.den, tu = lenh && lenh.tu;
        if (!Array.isArray(den) || !Array.isArray(tu) || !den.every(Number.isFinite) || !tu.every(Number.isFinite)) return { ok: false, lyDo: "Lệnh không đúng." };
        // TC_D02C: không đi vào lãnh địa của bé khác (đường đi máy bé đã vòng qua tường; đây là chốt chặn)
        if (lanhDia.chuO(Math.floor(den[0]), Math.floor(den[1]), ten)) return { ok: false, ma: "vao_lanh_dia", lyDo: "Đây là lãnh địa của bạn khác, không vào được." };
        // TC_D03A: chốt tiến độ xây tới giờ này TRƯỚC khi đổi lệnh (người rời móng thì móng dừng đúng chỗ)
        const batDau = gio();
        songLai(ten, batDau);
        // Chỗ xuất phát: tin máy bé nếu không xa hơn tốc độ tối đa cho phép từ lệnh trước (như SQL kc_dt_gui_lenh,
        // TC_D03A: máy chủ tính "tới nơi xây" theo chỗ này), xa quá thì dùng vị trí máy chủ tính
        const cu = dv.lenh, goc0 = cu ? cu.tu : [dv.x, dv.z], tGiay = cu ? Math.max(0, (batDau - cu.batDau) / 1000) : 0;
        const vMax = dv.loai === "thu_linh" ? TOC.chay : TOC.di;
        const tinDuoc = Math.hypot(tu[0] - goc0[0], tu[1] - goc0[1]) <= vMax * tGiay + 2;
        const p = tinDuoc ? { x: Math.min(Math.max(tu[0], 0), vung.rong), z: Math.min(Math.max(tu[1], 0), vung.cao) } : viTri(dv);
        // xay: chỉ công trình chưa xong của chính bé mà người này được xây; hang: tối đa doanToiDa móng như thế
        const laMong = id => Number.isInteger(id) && tt.congTrinh.some(c => c.id === id && c.chu === ten && !c.xongLuc && LANG.duocXay(dv.loai, c.loai));
        const xay = laMong(lenh.xay) ? lenh.xay : null;
        dv.lenh = { tu: [p.x, p.z], den: [Math.floor(den[0]), Math.floor(den[1])], batDau, vaiTro: dv.loai,
          viec: xay == null && Number.isInteger(lenh.viec) ? lenh.viec : null, khamPha: !!lenh.khamPha,
          xay, hang: xay != null && Array.isArray(lenh.hang) ? lenh.hang.filter(laMong).slice(0, CH.congTrinh.tuong.doanToiDa) : [] };
        luu();
        return { ok: true, batDau, tu: dv.lenh.tu };
      },

      async guiThuHoach(ten, ds) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const bay = gio();
        songLai(ten, bay);
        // TC_D03A: phần máy chủ đã tính bù lúc vắng mặt không tính lại (từ max(guiLuc, buLuc))
        const giay = Math.max(0, (bay - Math.max(be.guiLuc || be.vaoLuc, be.buLuc || 0)) / 1000);
        const soNd = cuaBe(ten).filter(d => d.loai === "nong_dan").length;
        const ra = [];
        be.kho = be.kho || {};
        for (const { ma, so } of ds || []) {
          if (ma < 0) { // TC_D03B2: ruộng của chính bé, chỉ khi chín (cho sớm xay.treGiay giây: giờ máy bé lệch); gặt hết thì thành bãi
            const ct = ruongCua(ten, -ma);
            if (!ct || ct.gatLuc != null || bay + CH.xay.treGiay * 1000 < chinLuc(ct) || !(so > 0)) { ra.push({ ma, duoc: 0 }); continue; }
            const tn = CH.lang.nguon.ruong.taiNguyen;
            const toiDa = Math.floor(soNd * giay / CH.lang.nguon.ruong.nhipLam), cho = Math.max(0, sucChua(ten, tn) - (be.kho[tn] || 0));
            const duoc = Math.max(0, Math.min(Math.floor(so), ct.con, toiDa, cho));
            ct.con -= duoc;
            if (ct.con <= 0) ct.gatLuc = bay;
            be.kho[tn] = (be.kho[tn] || 0) + duoc;
            ra.push({ ma, duoc, con: ct.con });
            continue;
          }
          const n = lang.nguonTheoMa(ma);
          if (!n || !lang.dangSong(n) || !(so > 0)) { ra.push({ ma, duoc: 0 }); continue; }
          // tốc độ tối đa: mọi nông dân của bé cùng làm nguồn loại này trong suốt khoảng giờ đó
          const toiDa = Math.floor(soNd * giay / lang.CH.nguon[n.loai].nhipLam);
          const cho = Math.max(0, sucChua(ten, n.taiNguyen) - (be.kho[n.taiNguyen] || 0)); // TC_D03A: sức chứa
          const duoc = Math.max(0, Math.min(Math.floor(so), n.con, toiDa, cho));
          n.con -= duoc;
          tt.nguon[ma] = { con: n.con, hetLuc: n.con <= 0 ? bay : null };
          be.kho[n.taiNguyen] = (be.kho[n.taiNguyen] || 0) + duoc; // kho của bé giữ ở máy chủ
          ra.push({ ma, duoc, con: n.con });
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
        songLai(ten, gio());
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
        const ct = { id: ++tt.soId, chu: ten, loai, x, y, rong, sau, cap: 1, tienDo: 0, xayLuc: gio(), xongLuc: null };
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
        songLai(ten, gio());
        const raoMinh = laRaoCua(ten), daCo = new Set(), moi = [];
        for (const [ox, oy] of dsO) { const k = oy * vung.rong + ox; if (!daCo.has(k) && !raoMinh(ox, oy)) moi.push([ox, oy]); daCo.add(k); }
        if (!moi.length) return { ok: true, ds: [], kho: khoCua(be) };
        const thieu = thieuGia(be, mau.gia, moi.length);
        if (thieu) return loiThieu(thieu);
        const the = theXay(ten, "tuong");
        for (const [ox, oy] of moi) { const k = BD.oXayDuoc(the, ox, oy); if (!k.duoc) return { ok: false, ma: k.ma, lyDo: k.lyDo, o: [ox, oy] }; }
        truGia(be, mau.gia, moi.length);
        const ds = moi.map(([ox, oy]) => {
          const ct = { id: ++tt.soId, chu: ten, loai: "tuong", x: ox, y: oy, rong: 1, sau: 1, cap: 1, tienDo: 0, xayLuc: gio(), xongLuc: null };
          tt.congTrinh.push(ct); datCt(ct);
          return { id: ct.id, x: ox, y: oy };
        });
        luu();
        return { ok: true, ds, kho: khoCua(be) };
      },

      // Dựng xong (máy bé báo khi người đứng sát móng làm đủ). TC_D03A: máy chủ tự mô phỏng tiến độ theo
      // người đã tới xây (tinhXay); chỉ nhận khi còn lại không quá xay.treGiay giây. Báo lần đầu thì trả
      // nông dân đầu tiên (Lều trại; máy chủ có thể đã sinh sẵn khi mô phỏng thấy xong), lần sau: da_xong.
      async xayXong(ten, id) {
        ten = tenChuan(ten);
        const ct = tt.congTrinh.find(c => c.id === id);
        if (!ct || ct.chu !== ten) return { ok: false, lyDo: "Đây không phải nhà của con." };
        const bay = gio();
        songLai(ten, bay);
        if (ct.baoXong) return { ok: false, ma: "da_xong", lyDo: "Nhà này dựng xong rồi." };
        if (!ct.xongLuc) {
          const n = tt.donVi.filter(d => d.chu === ten && d.lenh && d.lenh.xay === ct.id && toiLuc(d.lenh) <= bay).length;
          const v = LANG.tocDoXay(CH, { giayXay: mauCt(ct.loai).giayXay, cap: ct.cap }, Math.max(1, n));
          if ((ct.tienDo || 0) < 1 - 1e-9 && (!n || (1 - (ct.tienDo || 0)) / v > CH.xay.treGiay)) return { ok: false, ma: "chua_xong", lyDo: "Chưa dựng xong đâu, con chờ thêm chút nhé." };
          hoanThanh(ct, bay);
        }
        ct.baoXong = true;
        luu();
        const moi = ct.loai === "leu" ? cuaBe(ten).filter(d => d.loai === "nong_dan").map(d => ({ id: d.id, loai: d.loai, x: d.x, z: d.z, lenh: d.lenh })) : [];
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
        be.songLuc = Math.max(be.songLuc || 0, gio());
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
// 28/10/2026 19:05 - BƯỚC: TC_D03B2
