/* ================================================================
   FILE: co_tuong/ct_logic.js
   CHỨC NĂNG: LÕI LUẬT CỜ TƯỚNG - không chạm giao diện, chạy được cả trong trình duyệt,
              Web Worker lẫn Node (kiểm thử repo_rieng/kiem_thu/ct_kiem_thu_node.js).
              - Bàn 9 cột x 10 hàng, quân đứng trên giao điểm. Ô đánh số o = hang * 9 + cot
                (0..89), hàng 0 ở TRÊN (phía Đen = máy), hàng 9 ở DƯỚI (phía Đỏ = bé).
                Cùng cách đánh số với SQL kc_ct_kiem_van_thang, nên danh sách nước đi gửi
                lên máy chủ kiểm lại được. Một nước = tu * 90 + den (0..8099).
              - Quân: dương = Đỏ (bé, đi trước), âm = Đen (máy). 1 Tướng, 2 Sĩ, 3 Tượng,
                4 Mã, 5 Xe, 6 Pháo, 7 Tốt.
              - Luật: Tướng / Sĩ trong cung; Tượng đi chéo 2 ô, không qua sông, bị cản mắt;
                Mã bị cản chân; Pháo ăn quân phải cách đúng 1 ngòi; Tốt qua sông được đi
                ngang; HAI TƯỚNG KHÔNG ĐƯỢC NHÌN MẶT NHAU; không được đi nước để Tướng mình
                bị chiếu. Hết nước đi (bị chiếu bí hoặc bị vây hết đường) là THUA.
              - Hoà (cho trẻ, đơn giản hơn luật thi đấu): lặp lại cùng thế cờ 3 lần; 120 nước
                (60 lượt mỗi bên) liền không ai ăn quân; ván dài 300 nước; hai bên không
                còn quân nào sang được sông (chỉ còn Tướng, Sĩ, Tượng).
              - Bên trong dùng bàn có viền (16 cột x 14 hàng) cho nhanh: bộ não máy
                (ct_bo_nao.js) dùng chung lớp CT.TheCo này.
   BƯỚC: TC_03A
   NGÀY: 22/10/2026 21:10
   ================================================================ */
(function (goc) {
  "use strict";
  const CT = goc.CT = goc.CT || {};

  CT.SO_COT = 9; CT.SO_HANG = 10; CT.SO_O = 90;
  CT.DO = 1; CT.DEN = -1;
  CT.TUONG = 1; CT.SI = 2; CT.VOI = 3; CT.MA = 4; CT.XE = 5; CT.PHAO = 6; CT.TOT = 7;
  CT.TEN_QUAN = [null, "Tướng", "Sĩ", "Tượng", "Mã", "Xe", "Pháo", "Tốt"];
  CT.CHU_DO = [null, "帥", "仕", "相", "傌", "俥", "炮", "兵"];
  CT.CHU_DEN = [null, "將", "士", "象", "馬", "車", "砲", "卒"];
  CT.NUOC_HOA_KHONG_AN = 120;
  CT.NUOC_TOI_DA = 300;

  /* ---------------- BÀN CÓ VIỀN ---------------- */
  const R = 16;                         // bề rộng một hàng (có viền)
  const NGOAI = 99;                     // ô ngoài bàn
  const KICH = 14 * R;
  const vt = (h, c) => (h + 2) * R + (c + 2);
  CT.vt = vt;
  const O_SANG_VT = new Int16Array(90);
  const VT_SANG_O = new Int16Array(KICH).fill(-1);
  const BEN_SONG = new Int8Array(KICH);     // 1: nửa bàn của Đỏ (hàng 5-9), -1: của Đen
  const CUNG = new Int8Array(KICH);         // 1 / -1: trong cung của Đỏ / Đen
  for (let h = 0; h < 10; h++) {
    for (let c = 0; c < 9; c++) {
      const s = vt(h, c), o = h * 9 + c;
      O_SANG_VT[o] = s; VT_SANG_O[s] = o;
      BEN_SONG[s] = h >= 5 ? 1 : -1;
      if (c >= 3 && c <= 5) CUNG[s] = h >= 7 ? 1 : (h <= 2 ? -1 : 0);
    }
  }
  CT.O_SANG_VT = O_SANG_VT; CT.VT_SANG_O = VT_SANG_O; CT.BEN_SONG = BEN_SONG; CT.CUNG = CUNG;
  CT.NGOAI = NGOAI; CT.R = R;

  const THANG = [-R, R, -1, 1];               // lên, xuống, trái, phải
  const CHEO = [-R - 1, -R + 1, R - 1, R + 1];
  // Mã: chân L (một bước thẳng), đích = 2L + P (P vuông góc với L)
  const MA_DI = [];
  for (const L of THANG) {
    const P = (L === R || L === -R) ? [-1, 1] : [-R, R];
    for (const p of P) MA_DI.push([L, 2 * L + p]);
  }
  CT.MA_DI = MA_DI;

  /* Khoá Zobrist (2 số 32 bit) - bộ sinh số cố định để mọi máy giống nhau */
  let hat = 0x9E3779B9 | 0;
  const ngauNhien32 = () => {
    hat ^= hat << 13; hat ^= hat >>> 17; hat ^= hat << 5;
    return hat | 0;
  };
  const Z1 = new Int32Array(14 * KICH), Z2 = new Int32Array(14 * KICH);
  for (let i = 0; i < Z1.length; i++) { Z1[i] = ngauNhien32(); Z2[i] = ngauNhien32(); }
  const ZB1 = ngauNhien32(), ZB2 = ngauNhien32();     // lượt Đen
  const chiSoQuan = q => (q > 0 ? q - 1 : 6 - q);     // 1..7 -> 0..6, -1..-7 -> 7..13

  const THE_DAU = [
    [-5, -4, -3, -2, -1, -2, -3, -4, -5],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, -6, 0, 0, 0, 0, 0, -6, 0],
    [-7, 0, -7, 0, -7, 0, -7, 0, -7],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [7, 0, 7, 0, 7, 0, 7, 0, 7],
    [0, 6, 0, 0, 0, 0, 0, 6, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [5, 4, 3, 2, 1, 2, 3, 4, 5]
  ];

  /* ---------------- THẾ CỜ ---------------- */
  /* Một thế cờ: bàn có viền + lượt + vị trí 2 Tướng + khoá Zobrist.
     Nước đi bên trong = tu * 256 + den (tu, den là ô có viền). */
  class TheCo {
    constructor() {
      this.b = new Int8Array(KICH).fill(NGOAI);
      for (let o = 0; o < 90; o++) this.b[O_SANG_VT[o]] = 0;
      this.ben = CT.DO;
      this.tuong = { 1: 0, "-1": 0 };
      this.k1 = 0; this.k2 = 0;
    }
    static banDau() {
      const t = new TheCo();
      for (let h = 0; h < 10; h++) for (let c = 0; c < 9; c++) t.datQuan(vt(h, c), THE_DAU[h][c]);
      return t;
    }
    datQuan(s, q) {
      const cu = this.b[s];
      if (cu) { const i = chiSoQuan(cu) * KICH + s; this.k1 ^= Z1[i]; this.k2 ^= Z2[i]; }
      this.b[s] = q;
      if (q) {
        const i = chiSoQuan(q) * KICH + s; this.k1 ^= Z1[i]; this.k2 ^= Z2[i];
        if (q === 1) this.tuong[1] = s; else if (q === -1) this.tuong[-1] = s;
      }
    }
    sao() {
      const t = new TheCo();
      t.b.set(this.b); t.ben = this.ben; t.tuong = { 1: this.tuong[1], "-1": this.tuong[-1] };
      t.k1 = this.k1; t.k2 = this.k2;
      return t;
    }
    /* Đi nước m (không kiểm luật) -> quân bị ăn (0 nếu không ăn) */
    di(m) {
      const tu = m >> 8, den = m & 255, b = this.b;
      const q = b[tu], an = b[den];
      let i = chiSoQuan(q) * KICH;
      this.k1 ^= Z1[i + tu] ^ Z1[i + den]; this.k2 ^= Z2[i + tu] ^ Z2[i + den];
      if (an) { i = chiSoQuan(an) * KICH + den; this.k1 ^= Z1[i]; this.k2 ^= Z2[i]; }
      b[den] = q; b[tu] = 0;
      if (q === 1) this.tuong[1] = den; else if (q === -1) this.tuong[-1] = den;
      this.ben = -this.ben; this.k1 ^= ZB1; this.k2 ^= ZB2;
      return an;
    }
    hoan(m, an) {
      const tu = m >> 8, den = m & 255, b = this.b;
      const q = b[den];
      let i = chiSoQuan(q) * KICH;
      this.k1 ^= Z1[i + tu] ^ Z1[i + den]; this.k2 ^= Z2[i + tu] ^ Z2[i + den];
      if (an) { i = chiSoQuan(an) * KICH + den; this.k1 ^= Z1[i]; this.k2 ^= Z2[i]; }
      b[tu] = q; b[den] = an;
      if (q === 1) this.tuong[1] = tu; else if (q === -1) this.tuong[-1] = tu;
      this.ben = -this.ben; this.k1 ^= ZB1; this.k2 ^= ZB2;
    }
    /* Nước "bỏ lượt" cho bộ não (null move) */
    boLuot() { this.ben = -this.ben; this.k1 ^= ZB1; this.k2 ^= ZB2; }

    /* Ô s có bị bên `boi` tấn công không (kể cả Tướng đối mặt khi s là Tướng) */
    biDanh(s, boi) {
      const b = this.b;
      // Xe, Pháo, Tướng đối mặt: dò 4 hướng
      for (let d = 0; d < 4; d++) {
        const L = THANG[d];
        let t = s + L;
        while (b[t] === 0) t += L;
        const q = b[t];
        if (q === NGOAI) continue;
        if (q === 5 * boi) return true;
        if (q === boi && d < 2) return true;            // Tướng đối mặt (cùng cột)
        t += L;
        while (b[t] === 0) t += L;
        if (b[t] === 6 * boi) return true;              // Pháo có đúng 1 ngòi
      }
      // Mã: mã ở n = s - (2L + P), chân của nó ở n + L
      const ma = 4 * boi;
      for (let i = 0; i < 8; i++) {
        const L = MA_DI[i][0], n = s - MA_DI[i][1];
        if (b[n] === ma && b[n + L] === 0) return true;
      }
      // Tốt: tiến vào s, hoặc đi ngang khi đã qua sông
      const tot = 7 * boi, tien = boi === 1 ? -R : R;
      if (b[s - tien] === tot) return true;
      if (b[s - 1] === tot && BEN_SONG[s - 1] !== boi) return true;
      if (b[s + 1] === tot && BEN_SONG[s + 1] !== boi) return true;
      return false;
    }
    biChieu(ben) { return this.biDanh(this.tuong[ben], -ben); }

    /* Sinh nước "giả hợp lệ" (chưa xét Tướng mình bị chiếu) của bên đang đi vào mảng ds.
       chiAn = true: chỉ nước ăn quân (bộ não dùng khi tính tiếp các nước ăn). */
    sinhNuoc(ds, chiAn) {
      const b = this.b, ben = this.ben;
      for (let o = 0; o < 90; o++) {
        const s = O_SANG_VT[o], q = b[s] * ben;
        if (q <= 0) continue;
        const base = s << 8;
        const them = t => {
          const v = b[t];
          if (v === NGOAI || v * ben > 0) return;
          if (chiAn && v === 0) return;
          ds.push(base | t);
        };
        switch (q) {
          case 1:
            for (let d = 0; d < 4; d++) { const t = s + THANG[d]; if (CUNG[t] === ben) them(t); }
            break;
          case 2:
            for (let d = 0; d < 4; d++) { const t = s + CHEO[d]; if (CUNG[t] === ben) them(t); }
            break;
          case 3:
            for (let d = 0; d < 4; d++) {
              const mat = s + CHEO[d], t = mat + CHEO[d];
              if (b[mat] === 0 && b[t] !== NGOAI && BEN_SONG[t] === ben) them(t);
            }
            break;
          case 4:
            for (let i = 0; i < 8; i++) { if (b[s + MA_DI[i][0]] === 0) them(s + MA_DI[i][1]); }
            break;
          case 5:
            for (let d = 0; d < 4; d++) {
              const L = THANG[d];
              let t = s + L;
              while (b[t] === 0) { if (!chiAn) ds.push(base | t); t += L; }
              them(t);
            }
            break;
          case 6:
            for (let d = 0; d < 4; d++) {
              const L = THANG[d];
              let t = s + L;
              while (b[t] === 0) { if (!chiAn) ds.push(base | t); t += L; }
              if (b[t] === NGOAI) continue;
              t += L;
              while (b[t] === 0) t += L;
              if (b[t] !== NGOAI && b[t] * ben < 0) ds.push(base | t);
            }
            break;
          case 7: {
            them(s + (ben === 1 ? -R : R));
            if (BEN_SONG[s] !== ben) { them(s - 1); them(s + 1); }
            break;
          }
        }
      }
      return ds;
    }
    /* Nước m có để Tướng mình bị chiếu không (đi thử rồi hoàn) */
    hopLe(m) {
      const ben = this.ben;
      const an = this.di(m);
      const ok = !this.biChieu(ben);
      this.hoan(m, an);
      return ok;
    }
    nuocHopLe() {
      const ds = this.sinhNuoc([], false);
      return ds.filter(m => this.hopLe(m));
    }
    conNuoc() {
      const ds = this.sinhNuoc([], false);
      for (const m of ds) if (this.hopLe(m)) return true;
      return false;
    }
    /* Không bên nào còn quân sang được sông (Xe, Mã, Pháo, Tốt) */
    hetQuanTanCong() {
      for (let o = 0; o < 90; o++) {
        const q = Math.abs(this.b[O_SANG_VT[o]]);
        if (q >= 4) return false;
      }
      return true;
    }
    khoa() { return (this.k1 >>> 0).toString(36) + "." + (this.k2 >>> 0).toString(36); }
    quan(o) { return this.b[O_SANG_VT[o]]; }
  }
  CT.TheCo = TheCo;

  /* Đổi nước đi: số gửi máy chủ (tu * 90 + den, ô 0..89) <-> nước bên trong */
  CT.maNuoc = m => VT_SANG_O[m >> 8] * 90 + VT_SANG_O[m & 255];
  CT.giaiNuoc = n => (O_SANG_VT[Math.floor(n / 90)] << 8) | O_SANG_VT[n % 90];
  CT.hopLeSo = n => Number.isInteger(n) && n >= 0 && n < 8100 && Math.floor(n / 90) !== n % 90;

  /* ---------------- MỨC MÁY: 20 CẤP ---------------- */
  /* Nhân vật bé thấy (quân lính -> tướng, người dùng chốt 22/10/2026). Thông số bộ não ở
     ct_bo_nao.js (CT.NAO_CAP) để file luật này nhẹ cho trang chọn cấp. */
  CT.CAP_TOI_DA = 20;
  CT.CAP = [null,
    { hinh: "👦", ten: "Tiểu Đồng" },
    { hinh: "🥁", ten: "Lính Trống" },
    { hinh: "🚩", ten: "Lính Cầm Cờ" },
    { hinh: "🏹", ten: "Cung Thủ" },
    { hinh: "🗡️", ten: "Kiếm Sĩ" },
    { hinh: "🛡️", ten: "Lính Khiên" },
    { hinh: "🐎", ten: "Kỵ Binh" },
    { hinh: "🔱", ten: "Thương Thủ" },
    { hinh: "🏇", ten: "Hiệp Sĩ" },
    { hinh: "🎖️", ten: "Đội Trưởng" },
    { hinh: "⚔️", ten: "Hiệu Úy" },
    { hinh: "🐘", ten: "Tượng Binh" },
    { hinh: "🏰", ten: "Thành Chủ" },
    { hinh: "🦁", ten: "Tướng Quân" },
    { hinh: "🐯", ten: "Hổ Tướng" },
    { hinh: "🧙", ten: "Quân Sư" },
    { hinh: "🦅", ten: "Đại Tướng" },
    { hinh: "🐲", ten: "Long Tướng" },
    { hinh: "🌟", ten: "Kỳ Vương" },
    { hinh: "👑", ten: "Thánh Cờ" }
  ];
  CT.CAP.forEach((c, i) => { if (c) { c.cap = i; c.muc = "c" + i; } });
  CT.capCuaMuc = function (muc) {
    const m = /^c([0-9]{1,2})$/.exec(String(muc || ""));
    const n = m ? Number(m[1]) : 0;
    return n >= 1 && n <= CT.CAP_TOI_DA ? n : 0;
  };

  /* ---------------- VÁN CỜ ---------------- */
  /* Một ván: bé = Đỏ đi trước (nước chẵn 0, 2, 4...), máy (hoặc bạn) = Đen.
     nuocDi: danh sách số tu * 90 + den. ketQua: "" đang chơi | "thang" (Đỏ thắng) |
     "thua" (Đen thắng) | "hoa". lyDo: "bi" (hết nước) | "lap" | "khong_an" | "dai" | "het_quan". */
  class VanCoTuong {
    constructor(muc) {
      this.muc = CT.capCuaMuc(muc) ? muc : "c1";
      this.the = TheCo.banDau();
      this.nuocDi = [];
      this.ketQua = "";
      this.lyDo = "";
      this.khongAn = 0;
      this.daGap = new Map([[this.the.khoa(), 1]]);
      this.anGanNhat = 0;
    }
    get luot() { return this.the.ben; }
    get daXong() { return this.ketQua !== ""; }
    get chieu() { return this.the.biChieu(this.the.ben); }
    quan(o) { return this.the.quan(o); }
    /* Các ô quân ở ô `tu` đi được (của bên đang tới lượt) */
    nuocCuaQuan(tu) {
      if (this.daXong || !(this.quan(tu) * this.the.ben > 0)) return [];
      const s = O_SANG_VT[tu];
      return this.the.nuocHopLe().filter(m => (m >> 8) === s).map(m => VT_SANG_O[m & 255]);
    }
    /* Đi nước n = tu * 90 + den của bên đang tới lượt. Trả về true nếu hợp lệ. */
    diSo(n) {
      if (this.daXong || !CT.hopLeSo(n)) return false;
      const m = CT.giaiNuoc(n);
      if (!(this.the.b[m >> 8] * this.the.ben > 0)) return false;
      const ds = this.the.sinhNuoc([], false);
      if (ds.indexOf(m) === -1 || !this.the.hopLe(m)) return false;
      const ben = this.the.ben;
      const an = this.the.di(m);
      this.anGanNhat = an;
      this.nuocDi.push(n);
      this.khongAn = an ? 0 : this.khongAn + 1;
      const k = this.the.khoa();
      if (an) this.daGap = new Map();            // ăn quân thì thế cũ không lặp lại được nữa
      this.daGap.set(k, (this.daGap.get(k) || 0) + 1);
      if (!this.the.conNuoc()) { this.ketQua = ben === CT.DO ? "thang" : "thua"; this.lyDo = "bi"; }
      else if (this.daGap.get(k) >= 3) { this.ketQua = "hoa"; this.lyDo = "lap"; }
      else if (this.khongAn >= CT.NUOC_HOA_KHONG_AN) { this.ketQua = "hoa"; this.lyDo = "khong_an"; }
      else if (this.nuocDi.length >= CT.NUOC_TOI_DA) { this.ketQua = "hoa"; this.lyDo = "dai"; }
      else if (an && this.the.hetQuanTanCong()) { this.ketQua = "hoa"; this.lyDo = "het_quan"; }
      return true;
    }
    di(tu, den) { return this.diSo(tu * 90 + den); }
    /* Dựng ván từ danh sách nước (nước sai thì dừng) */
    static tuNuocDi(muc, ds) {
      const v = new VanCoTuong(muc);
      for (const n of ds || []) { if (!v.diSo(Number(n))) break; }
      return v;
    }
  }
  CT.VanCoTuong = VanCoTuong;
})(typeof window !== "undefined" ? window : globalThis);
// 22/10/2026 21:10 - BƯỚC: TC_03A
