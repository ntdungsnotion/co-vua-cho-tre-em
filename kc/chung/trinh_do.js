// ================================================================
// FILE: kc/chung/trinh_do.js
// CHỨC NĂNG: LÕI MODULE TRÌNH ĐỘ + CHỌN CÂU DÙNG CHUNG TOÀN APP (KC_TRINH_DO). Không đụng DOM:
//            chạy được trong node (mô phỏng, kiểm thử) và trên máy bé. Đặc tả: repo_rieng
//            Thiet_Ke_Trinh_Do.md bản 1.1 (mục 4-6, 7.2, 9.3, 9.5; số mặc định chốt bằng mô phỏng
//            KC_08B, phụ lục C). Bản SQL (KC_08C) phải cho CÙNG SỐ với cùng đầu vào.
//            - Trình độ θ mỗi (bé × môn) trên THANG LỚP (θ = 4,3: làm tốt câu đầu lớp 4).
//            - Xác suất đúng = đoán mò c + (1 − c) · logistic, chỉnh để θ = b thì đúng đúng mucTieu.
//            - Cập nhật kiểu Elo có độ bất định: K giảm theo bằng chứng n_eff, có giới hạn mỗi câu,
//              nghỉ lâu thì n_eff giảm (K lớn lại), θ không tự tụt.
//            - Lớp khai chỉ là điểm xuất phát; lớp đã mở M chỉ tăng, mở M + 1 cần 3 bằng chứng.
//            - Chọn ô câu (lớp × mức) theo xác suất mục tiêu của từng nơi; dò / chống nản / thử lớp mới.
//            - Danh hiệu của bé (Gà Con → Thần), chỉ tăng, độc lập với lớp.
//            MỌI CON SỐ ở MAC_DINH là mặc định; admin sửa ở cấu hình máy chủ (kc_td_cau_hinh, KC_08C).
//            CHƯA NỐI GAME NÀO (KC_08D / KC_08E nối).
// BƯỚC: KC_08B (lõi JS + mô phỏng chốt số)
// NGÀY: 20/11/2026
// ================================================================
(function (goc) {
  "use strict";

  const MAC_DINH = {
    phienBan: 1,
    tranTuyetDoi: 12.99,
    lopToiDa: 12,
    cuoiLop: 0.99,
    // Xác suất (mục 4.1)
    doDoc: 1.6,
    doDocMon: {},                       // { toan: 1.6, ... } nếu dữ liệu thật cho thấy môn khác
    mucTieu: 0.75,
    vungVuaSuc: [0.65, 0.85],
    // Cập nhật (mục 4.2)
    K: { K0: 1.2, beta: 0.2, Kmin: 0.12 },
    D: { tang: 0.25, giam: 0.35 },
    heSoSaiKhiLeo: 0.75,
    chuoiLeo: 3,
    nuaDoiNgay: 60,
    bangChungThongTin: true,
    // Trọng số lượt (mục 4.3)
    w: { gapLaiXa: 0.5, gapLaiGan: 0.1, mocNgay: 14, mocLan: 3, giayBamVoi: 0.8 },
    // Độ tin cậy (mục 4.4)
    tinCay: { nDo: 15, nCao: 30, cauKhac: 20, soMuc: 2, daoDong: 1.0, soLuotDaoDong: 20 },
    mucTieuDo: 0.8,
    // Điểm xuất phát (mục 4.5)
    khoi: {
      phu_huynh: { lech: -0.5, n0: 3 },
      be: { lech: -0.5, n0: 0 },
      khong: { theta: 1.0, n0: 0 }
    },
    // Bất thường (mục 4.6)
    // bất thường: z = Σ(r − p) / √Σ p(1 − p) trên soLuot lượt gần nhất; |z| ≥ z thì bật, |z| < zTat thì tắt
    batThuong: { soLuot: 20, z: 3.0, zTat: 1.0 },
    kDong: { bat: false, chia: 4 },
    // Mở lớp (mục 6.1)
    // tiLeThuXa: tỉ lệ câu thử khi θ đã vượt xa lớp đang mở (p câu Vừa lớp M + 1 ≥ nguongXa), bé khai thấp mở nhanh hơn.
    // choSauTruot: đợt thử chưa đạt thì chờ bấy nhiêu câu thường mới thử đợt mới (thử liên tục thì sớm muộn cũng "may" đạt)
    moLop: { nguongThu: 0.65, tiLeThu: 0.2, nguongXa: 0.7, tiLeThuXa: 1.0, soCauThu: 15, nguongMo: 0.75, nhamThu: 0.8, nguongKho: 0.5, giamBangChung: 0.25, choSauTruot: 0 },
    // Báo lớp khai lệch (mục 6.3)
    coLech: { lop: 1.5, soMon: 2 },
    // Chọn câu (mục 7.2, 7.3)
    mucTieuNoi: {
      tran: 0.75, cong_trinh: 0.6, on_sau_tran: 0.8, kt_moi: 0.85, on_kt: 0.75, toc_do: 0.9,
      chinh_phuc: [0.9, 0.8, 0.7, 0.6, 0.5, 0.4]
    },
    // chống nản: sai soSai câu liền thì câu kế nhắm 'nham', và chọn theo θ tạm hạ thêm 'lui' lớp cho mỗi câu sai liền từ câu thứ soSai
    // (θ thật không đổi): bé khai cao không phải sai một chuỗi dài trước khi θ kịp tụt (KC_08B)
    chongNan: { soSai: 2, nham: 0.9, lui: 1.0 },
    tiLeOnTap: 0.1,
    onTap: { xacSuat: 0.88 },
    beRongChon: 0.1,                    // chỉ lấy ô có |p − nhắm| ≤ beRongChon (không có thì ô gần nhất)
    // Độ khó ban đầu của câu (mục 5.1)
    mucDoKho: { de: 0.1, vua: 0.5, kho: 0.9 },
    tiengAnh: { theoCap: true, batDauCap: [1, 3, 5, 7], mucCong: { de: 0, vua: 0.67, kho: 1.33 } },
    // Thưởng công bằng theo p lúc hỏi (mục 8.2)
    thuong: [
      { duoi: 0.5, heSo: 1.5 },
      { duoi: 0.65, heSo: 1.25 },
      { duoi: 0.86, heSo: 1 },
      { duoi: 0.95, heSo: 0.6 },
      { duoi: 1.01, heSo: 0.3 }
    ],
    // Danh hiệu của bé (mục 9.5): điểm = tổng hệ số thưởng câu đúng + diemTienBo mỗi lần θ_max vượt thêm buocTienBo
    danhHieu: {
      ds: [
        ["Gà Con", "🐣"], ["Chim Sẻ", "🐦"], ["Cáo Nhỏ", "🦊"], ["Sói Xám", "🐺"], ["Gấu Nâu", "🐻"], ["Hổ", "🐯"],
        ["Sư Tử", "🦁"], ["Đại Bàng", "🦅"], ["Kỳ Lân", "🦄"], ["Rồng", "🐉"], ["Phượng Hoàng", "🔥"], ["Thần", "⚡"]
      ],
      soSao: 3,
      // điểm mốc của bậc k (k = 0 .. 35; bậc 0 = Gà Con 1 sao từ đầu): moc(k) = heSo · k^mu
      heSo: 20, mu: 1.63,
      buocTienBo: 0.25, diemTienBo: 15
    }
  };
  const MUC = ["de", "vua", "kho"];

  const laDoiTuong = x => x && typeof x === "object" && !Array.isArray(x);
  function tron(a, b) {
    const kq = Object.assign({}, a);
    Object.keys(b || {}).forEach(k => {
      kq[k] = laDoiTuong(a[k]) && laDoiTuong(b[k]) ? tron(a[k], b[k]) : b[k];
    });
    return kq;
  }
  let _bo = null, _boCh = null;
  // Ghép cấu hình (từ máy chủ) lên mặc định; thiếu khoá nào lấy mặc định khoá đó
  function cauHinh(ch) {
    if (ch && ch._daGhep) return ch;
    if (ch === _boCh && _bo) return _bo;
    const c = tron(MAC_DINH, ch || {});
    Object.defineProperty(c, "_daGhep", { value: true });
    _boCh = ch; _bo = c;
    return c;
  }

  const kep = (x, a, b) => Math.min(b, Math.max(a, x));
  const logit = p => Math.log(p / (1 - p));
  const lam = x => Math.round(x * 10000) / 10000;

  // ---------- Độ khó ban đầu của câu (mục 5.1) ----------
  // cau: { mon, lop (lop_tu), muc, cap? (cấp kho từ), doKho? (b đã hiệu chỉnh) }
  function doKhoCau(cau, ch) {
    const c = cauHinh(ch);
    if (cau.doKho != null && isFinite(+cau.doKho)) return +cau.doKho;
    const muc = MUC.indexOf(cau.muc) >= 0 ? cau.muc : "vua";
    if (cau.mon === "tieng_anh" && c.tiengAnh.theoCap) {
      const cap = kep(Math.round(+cau.cap) || Math.ceil((+cau.lop || 1) / 2), 1, c.tiengAnh.batDauCap.length);
      return c.tiengAnh.batDauCap[cap - 1] + c.tiengAnh.mucCong[muc];
    }
    return (+cau.lop || 1) + c.mucDoKho[muc];
  }

  // ---------- Xác suất (mục 4.1) ----------
  function xacSuat(theta, b, soDapAn, ch, mon) {
    const c = cauHinh(ch);
    const s = (mon && c.doDocMon[mon]) || c.doDoc;
    const k = Math.max(2, Math.round(+soDapAn) || 4);
    const doan = 1 / k;
    const q = Math.max(c.mucTieu, doan + 0.01);
    const u = (q - doan) / (1 - doan);
    const pBiet = 1 / (1 + Math.exp(-(s * (theta - b) + logit(u))));
    return doan + (1 - doan) * pBiet;
  }

  // ---------- Hồ sơ một môn ----------
  // lop: lớp khai (0-12, null = không có); nguon: 'phu_huynh' | 'be' | null
  function khoiTao(lop, nguon, ch) {
    const c = cauHinh(ch);
    const coLop = lop != null && isFinite(+lop);
    const L = coLop ? kep(Math.round(+lop), 0, c.lopToiDa) : null;
    const k = !coLop ? c.khoi.khong : (nguon === "phu_huynh" ? c.khoi.phu_huynh : c.khoi.be);
    const theta = !coLop ? k.theta : kep(L + k.lech, 0, c.tranTuyetDoi);
    return {
      theta: lam(theta), nEff: k.n0, nW: k.n0, soLuot: 0, soCauKhac: 0, soSai: 0, soMuc: { de: 0, vua: 0, kho: 0 },
      lopKhai: L, lopDaMo: coLop ? L : 1, vuotLop: false, thuLop: [], tiLeThuGiam: false, thuCho: 0,
      theta0: lam(theta), thetaMax: lam(theta), nguon: coLop ? (nguon || "be") : "khong",
      lanCuoi: null, chuoiDung: 0, chuoiSai: 0, ganDay: [], batThuong: 0,
      diem: 0, buocTienBo: 0
    };
  }

  function heSoK(st, ch) {
    const c = cauHinh(ch);
    let n = st.nEff;
    if (c.kDong.bat && st.batThuong !== 0) n = n / c.kDong.chia;
    return Math.max(c.K.Kmin, c.K.K0 / (1 + c.K.beta * n));
  }

  // ---------- Độ tin cậy (mục 4.4) ----------
  // Dao động của θ trong soLuotDaoDong lượt gần nhất = phần "lên xuống" (tổng |Δθ| − |thay đổi ròng|):
  // θ đi lên đều (bé khai thấp đang leo) là xu hướng, không phải dao động (KC_08B: dùng max − min thì bé leo
  // nhanh mất độ tin cậy, không bao giờ mở được lớp)
  function daoDong(st, ch) {
    const c = cauHinh(ch);
    const ds = st.ganDay.slice(-c.tinCay.soLuotDaoDong - 1).map(g => g[3]);
    if (ds.length < c.tinCay.soLuotDaoDong + 1) return Infinity;
    let tong = 0;
    for (let i = 1; i < ds.length; i++) tong += Math.abs(ds[i] - ds[i - 1]);
    return tong - Math.abs(ds[ds.length - 1] - ds[0]);
  }
  function tinCay(st, ch) {
    const c = cauHinh(ch), t = c.tinCay;
    if (st.nW < t.nDo) return "thap";
    if (st.batThuong < 0) return "tb";   // kém hơn dự đoán rõ rệt: kiểm lại; giỏi hơn dự đoán thì vẫn cho thử lớp mới
    const soMuc = MUC.filter(m => st.soMuc[m] > 0).length;
    if (st.nW >= t.nCao && st.soCauKhac >= t.cauKhac && soMuc >= t.soMuc && daoDong(st, c) <= t.daoDong) return "cao";
    return "tb";
  }

  // ---------- Trọng số lượt (mục 4.3) ----------
  // g: { lanGap (số lần đã gặp CÙNG câu trước lượt này), cachNgay (ngày từ lần gặp trước), hoiLai, chuaDuyet, giay, dung }
  function trongSo(g, ch) {
    const c = cauHinh(ch).w;
    if (!g) return 1;
    if (g.hoiLai || g.chuaDuyet) return 0;
    // bấm nhanh hơn giayBamVoi: không kịp đọc, cả đúng lẫn sai đều w = 0 (chỉ bỏ câu sai thì bấm bừa nhanh làm θ tăng, KC_08B)
    if (g.giay != null && g.giay < c.giayBamVoi) return 0;
    const lan = +g.lanGap || 0;
    if (lan <= 0) return 1;
    if (lan >= c.mocLan || (g.cachNgay != null && g.cachNgay < c.mocNgay)) return c.gapLaiGan;
    return c.gapLaiXa;
  }

  function heSoThuong(p, ch) {
    const bang = cauHinh(ch).thuong;
    for (const h of bang) if (p < h.duoi) return h.heSo;
    return bang[bang.length - 1].heSo;
  }

  function tran(st, ch) {
    const c = cauHinh(ch);
    return st.vuotLop ? c.tranTuyetDoi : Math.min(c.lopToiDa, st.lopDaMo) + c.cuoiLop;
  }

  // Điều kiện 1 + 2 để bắt đầu làm thử câu lớp M + 1 (mục 6.1)
  function duocThu(st, ch, mon) {
    const c = cauHinh(ch);
    if (st.vuotLop || st.lopDaMo >= c.lopToiDa || st.thuCho > 0) return false;
    if (tinCay(st, c) !== "cao") return false;
    const bMoi = st.lopDaMo + 1 + c.mucDoKho.vua;
    return xacSuat(st.theta, bMoi, 4, c, mon) >= c.moLop.nguongThu;
  }

  // ---------- Cập nhật sau mỗi câu (mục 4.2) ----------
  // luot: { b, soDapAn, dung, muc, ngay (số ngày, thực), w? (đã tính) hoặc gap (đầu vào trongSo), cauMoi (lần đầu gặp câu này),
  //         laThu (câu thử lớp M + 1), lop (lớp của câu), mon }
  // Trả { p, w, delta, truoc, sau, k, heSoThuong, moLop (lớp vừa mở hoặc 0), diemThem }
  function capNhat(st, luot, ch) {
    const c = cauHinh(ch);
    const ngay = +luot.ngay || 0;
    if (st.lanCuoi != null && ngay > st.lanCuoi) {
      const giam = Math.pow(0.5, (ngay - st.lanCuoi) / c.nuaDoiNgay);
      st.nEff *= giam; st.nW *= giam;
    }
    st.lanCuoi = ngay;
    const p = luot.p != null ? luot.p : xacSuat(st.theta, luot.b, luot.soDapAn, c, luot.mon);
    const w = luot.w != null ? luot.w : trongSo(Object.assign({ dung: luot.dung }, luot.gap || {}), c);
    const r = luot.dung ? 1 : 0;
    const k = heSoK(st, c);
    let delta = k * w * (r - p);
    // sai khi đang leo (chỉ trong giai đoạn dò): một câu sơ ý không kéo tụt; áp mọi lúc thì θ lệch lên (mô phỏng KC_08B)
    if (!luot.dung && st.chuoiDung >= c.chuoiLeo && st.nW < c.tinCay.nDo) delta *= c.heSoSaiKhiLeo;
    delta = kep(delta, -c.D.giam, c.D.tang);
    const truoc = st.theta;
    st.theta = lam(kep(st.theta + delta, 0, c.tranTuyetDoi));
    // bằng chứng cho K tính theo THÔNG TIN của câu: câu quá dễ / quá khó (p gần 1 / 0) gần như không cho biết gì,
    // nên không làm K nhỏ đi (bé khai thấp ở trần vẫn leo nhanh, KC_08B). nW: số lượt có trọng số, cho độ tin cậy.
    st.nEff = lam(st.nEff + w * (c.bangChungThongTin ? Math.min(1, p * (1 - p) / (c.mucTieu * (1 - c.mucTieu))) : 1));
    st.nW = lam(st.nW + w);
    st.soLuot++;
    if (w > 0) {
      if (luot.cauMoi !== false) st.soCauKhac++;
      if (luot.muc && st.soMuc[luot.muc] != null) st.soMuc[luot.muc]++;
    }
    if (!luot.dung) st.soSai++;
    if (w > 0) {
      st.chuoiDung = luot.dung ? st.chuoiDung + 1 : 0;
      st.chuoiSai = luot.dung ? 0 : st.chuoiSai + 1;
    }
    // 20 lượt gần nhất: [b, r, w, θ sau, bất ngờ, p(1 − p)]
    if (w > 0) {
      st.ganDay.push([lam(luot.b), r, w, st.theta, lam(r - p), lam(p * (1 - p))]);
      const giu = Math.max(c.tinCay.soLuotDaoDong + 1, c.batThuong.soLuot);
      while (st.ganDay.length > giu) st.ganDay.shift();
      xetBatThuong(st, c);
    }
    // Câu thử lớp mới: từng đợt soCauThu câu; đủ đợt mà đạt nguongMo thì mở M + 1
    let moLop = 0;
    if (!luot.laThu && st.thuCho > 0) st.thuCho--;
    if (luot.laThu && w > 0) {
      st.thuLop.push(r);
      while (st.thuLop.length > c.moLop.soCauThu) st.thuLop.shift();
      if (st.thuLop.length >= c.moLop.soCauThu) {
        const ti = st.thuLop.reduce((a, b) => a + b, 0) / st.thuLop.length;
        if (ti >= c.moLop.nguongMo && tinCay(st, c) === "cao") {
          st.lopDaMo = Math.min(c.lopToiDa, st.lopDaMo + 1);
          // vừa mở lớp = trần cũ đã kìm θ: bằng chứng cũ (câu dưới sức) ít giá trị, giảm để K lớn lại, θ bắt kịp nhanh
          st.nEff = lam(st.nEff * c.moLop.giamBangChung);
          st.thuLop = []; st.tiLeThuGiam = false;
          moLop = st.lopDaMo;
        } else { st.tiLeThuGiam = ti < c.moLop.nguongKho; st.thuLop = []; st.thuCho = c.moLop.choSauTruot; }   // chưa đạt: làm lại đợt mới (không trượt cửa sổ, đỡ mở nhầm do may)
      }
    }
    // Danh hiệu: điểm công sức + tiến bộ (chỉ tăng)
    let diemThem = 0;
    const hs = luot.dung && w > 0 ? heSoThuong(p, c) : 0;
    diemThem += hs;
    if (st.theta > st.thetaMax) {
      st.thetaMax = st.theta;
      const d = c.danhHieu;
      while (st.thetaMax - st.theta0 >= (st.buocTienBo + 1) * d.buocTienBo - 1e-9) { st.buocTienBo++; diemThem += d.diemTienBo; }
    }
    st.diem = lam(st.diem + diemThem);
    return { p, w, delta: lam(st.theta - truoc), truoc, sau: st.theta, k, heSoThuong: hs, moLop, diemThem };
  }

  function xetBatThuong(st, c) {
    const b = c.batThuong;
    if (st.nW < c.tinCay.nDo) { st.batThuong = 0; return; }
    const ds = st.ganDay.slice(-b.soLuot);   // [b, r, w, θ, r − p, p(1 − p)]
    if (ds.length < b.soLuot) return;
    const z = ds.reduce((a, g) => a + g[4], 0) / Math.sqrt(Math.max(1e-6, ds.reduce((a, g) => a + g[5], 0)));
    if (Math.abs(z) >= b.z) st.batThuong = z > 0 ? 1 : -1;
    else if (Math.abs(z) < b.zTat) st.batThuong = 0;
  }

  // ---------- Chọn ô câu (mục 7.2) ----------
  // dsO: [{ lop, muc, b, soDapAn? , ... }] các ô (lớp × mức) đang còn câu dùng được của môn.
  // tuyChon: { noi ('tran' | 'kt_moi' | ...), mucTieu (ép), mon, chinhPhucChang (0..) }
  // Trả { o, p, nham, laThu } hoặc null khi dsO rỗng (luôn có câu nếu còn ô).
  function chonO(st, dsO, rng, ch, tuyChon) {
    const c = cauHinh(ch);
    const t = tuyChon || {};
    if (!dsO || !dsO.length) return null;
    let nham = t.mucTieu;
    if (nham == null) {
      const m = c.mucTieuNoi[t.noi || "tran"];
      nham = Array.isArray(m) ? m[kep(t.chinhPhucChang || 0, 0, m.length - 1)] : (m != null ? m : c.mucTieu);
    }
    const tc = tinCay(st, c);
    if (tc === "thap") nham = Math.max(nham, c.mucTieuDo);
    if (st.chuoiSai >= c.chongNan.soSai) nham = Math.max(nham, c.chongNan.nham);
    const tr = tran(st, c);
    const thChon = st.chuoiSai >= c.chongNan.soSai ? st.theta - c.chongNan.lui * (st.chuoiSai - c.chongNan.soSai + 1) : st.theta;
    const pO = o => xacSuat(thChon, o.b, o.soDapAn || 4, c, t.mon);
    // Thử lớp mới
    if (t.mucTieu == null && st.chuoiSai < c.chongNan.soSai && duocThu(st, c, t.mon)) {
      const xa = xacSuat(st.theta, st.lopDaMo + 1 + c.mucDoKho.vua, 4, c, t.mon) >= c.moLop.nguongXa;
      const tiLe = (xa ? c.moLop.tiLeThuXa : c.moLop.tiLeThu) * (st.tiLeThuGiam ? 0.5 : 1);
      const moi = dsO.filter(o => o.lop === st.lopDaMo + 1);
      if (moi.length && rng() < tiLe) {
        const kq = boc(moi.map(o => ({ o, p: pO(o) })), c.moLop.nhamThu, c, rng);
        return { o: kq.o, p: kq.p, nham: c.moLop.nhamThu, laThu: true };
      }
    }
    // Ôn tập: dễ hơn
    if (t.mucTieu == null && (t.noi || "tran") === "tran" && tc !== "thap" && rng() < c.tiLeOnTap) nham = Math.max(nham, c.onTap.xacSuat);
    let ung = dsO.filter(o => o.b <= tr + 1e-9);
    if (!ung.length) {
      // mọi ô đều trên trần (kho chỉ có câu lớp cao): lấy ô thấp nhất
      const bMin = Math.min(...dsO.map(o => o.b));
      ung = dsO.filter(o => o.b <= bMin + 1e-9);
    }
    const kq = boc(ung.map(o => ({ o, p: pO(o) })), nham, c, rng);
    return { o: kq.o, p: kq.p, nham, laThu: false };
  }
  function boc(ds, nham, c, rng) {
    let chon = ds.filter(x => Math.abs(x.p - nham) <= c.beRongChon);
    if (!chon.length) {
      const gan = Math.min(...ds.map(x => Math.abs(x.p - nham)));
      chon = ds.filter(x => Math.abs(x.p - nham) <= gan + 1e-9);
    }
    const w = chon.map(x => Math.exp(-Math.pow((x.p - nham) / 0.08, 2)) + 1e-6);
    let r = rng() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < chon.length; i++) { r -= w[i]; if (r <= 0) return chon[i]; }
    return chon[chon.length - 1];
  }

  // ---------- Lớp hiệu lực (mục 6.2) ----------
  function lopHieuLuc(st) {
    if (st.theta >= st.lopDaMo - 1) return st.lopDaMo;
    return Math.max(1, Math.floor(st.theta) + 1);
  }

  // ---------- Báo lớp khai lệch (mục 6.3) ----------
  // dsMon: { ma: st }; lopKhai: lớp trong hồ sơ. Trả { loai: 'cao' | 'thap' | null, gioi: [môn], yeu: [môn] }
  function coLech(dsMon, lopKhai, ch) {
    const c = cauHinh(ch);
    const L = +lopKhai;
    const ds = Object.keys(dsMon).filter(m => tinCay(dsMon[m], c) === "cao")
      .map(m => ({ m, lech: dsMon[m].theta - (L + 0.5), mo: dsMon[m].lopDaMo }));
    const gioi = ds.filter(x => x.lech >= c.coLech.lop || x.mo >= L + 2).map(x => x.m);
    const yeu = ds.filter(x => x.lech <= -c.coLech.lop).map(x => x.m);
    let loai = null;
    if (ds.length >= c.coLech.soMon && yeu.length === ds.length) loai = "cao";
    else if (gioi.length >= c.coLech.soMon) loai = "thap";
    return { loai, gioi, yeu };
  }

  // ---------- Danh hiệu của bé (mục 9.5) ----------
  function mocDanhHieu(k, ch) {
    const d = cauHinh(ch).danhHieu;
    return k <= 0 ? 0 : Math.round(d.heSo * Math.pow(k, d.mu));
  }
  function danhHieu(diem, ch) {
    const c = cauHinh(ch), d = c.danhHieu;
    const tong = d.ds.length * d.soSao;
    let k = 0;
    while (k + 1 < tong && diem >= mocDanhHieu(k + 1, c)) k++;
    const bac = Math.floor(k / d.soSao);
    return {
      buoc: k, bac, ten: d.ds[bac][0], bieuTuong: d.ds[bac][1], sao: (k % d.soSao) + 1,
      diemMocKe: k + 1 < tong ? mocDanhHieu(k + 1, c) : null
    };
  }

  // Bộ ngẫu nhiên có hạt (mô phỏng, kiểm thử)
  function rngHat(hat) {
    let a = (hat >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  goc.KC_TRINH_DO = {
    MAC_DINH, MUC, cauHinh, doKhoCau, xacSuat, khoiTao, heSoK, tinCay, daoDong, trongSo, heSoThuong,
    tran, duocThu, capNhat, chonO, lopHieuLuc, coLech, mocDanhHieu, danhHieu, rngHat
  };
})(typeof window !== "undefined" ? window : globalThis);
// 20/11/2026 - BƯỚC: KC_08B
