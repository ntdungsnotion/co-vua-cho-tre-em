/* ================================================================
   FILE: co_tuong/ct_bo_nao.js
   CHỨC NĂNG: BỘ NÃO MÁY CỜ TƯỚNG (Claude tự viết, không thư viện) - chạy trong Web Worker
              (co_tuong/ct_may_nghi.js) cho màn hình không đơ, chạy được cả bằng Node để
              tự đấu đo độ mạnh.
              - Tìm kiếm alpha-beta (negamax + PVS), tìm sâu dần có hạn giờ, bảng ghi nhớ
                (Zobrist), bỏ lượt (null move), giảm sâu nước muộn (LMR), nước sát thủ +
                lịch sử, nối dài khi bị chiếu, dò tiếp nước ăn quân (quiescence).
              - Chấm điểm: giá trị quân + bảng vị trí từng quân + an toàn Tướng (thiếu Sĩ /
                Tượng khi đối phương còn Xe, Mã, Pháo). Lặp thế cờ = hoà (0 điểm).
              - 20 CẤP (CT.NAO_CAP): cấp thấp nghĩ nông, cộng "nhiễu" vào điểm từng nước và
                thỉnh thoảng đi bừa (giống người mới tập); cấp cao nghĩ theo giờ, không nhiễu.
                Bảng chỉnh theo kết quả tự đấu (nhật ký TC_03A). Cấp 20 trình độ chuyên nghiệp
                sẽ dùng máy mạnh hơn ở bước TC_03B; tới lúc đó cấp 20 = bộ não này hết sức.
   BƯỚC: TC_03A
   NGÀY: 22/10/2026 21:10
   PHỤ THUỘC: co_tuong/ct_logic.js (CT.TheCo, CT.VanCoTuong)
   ================================================================ */
(function (goc) {
  "use strict";
  const CT = goc.CT;
  const R = CT.R, NGOAI = CT.NGOAI, O_SANG_VT = CT.O_SANG_VT, VT_SANG_O = CT.VT_SANG_O;
  const KICH = 14 * R;

  /* ---------------- 20 CẤP ---------------- */
  /* sau = độ sâu tối đa; giay = giờ nghĩ (máy tính để bàn; điện thoại chậm hơn thì tự nông hơn);
     nhieu = điểm ngẫu nhiên (0..nhieu, đơn vị 1 Tốt = 100) cộng vào từng nước ở gốc;
     sai = xác suất đi một nước bừa (hợp lệ). */
  CT.NAO_CAP = [null,
    { sau: 1, giay: 0.3, nhieu: 400, sai: 0.30 },
    { sau: 1, giay: 0.3, nhieu: 250, sai: 0.20 },
    { sau: 2, giay: 0.3, nhieu: 220, sai: 0.14 },
    { sau: 2, giay: 0.3, nhieu: 150, sai: 0.09 },
    { sau: 2, giay: 0.3, nhieu: 100, sai: 0.06 },
    { sau: 3, giay: 0.4, nhieu: 90,  sai: 0.04 },
    { sau: 3, giay: 0.4, nhieu: 60,  sai: 0.025 },
    { sau: 3, giay: 0.5, nhieu: 40,  sai: 0.015 },
    { sau: 4, giay: 0.6, nhieu: 40,  sai: 0.01 },
    { sau: 4, giay: 0.7, nhieu: 20,  sai: 0 },
    { sau: 5, giay: 0.3, nhieu: 0,   sai: 0 },
    { sau: 6, giay: 0.4, nhieu: 0,   sai: 0 },
    { sau: 64, giay: 0.4, nhieu: 0,  sai: 0 },
    { sau: 64, giay: 0.6, nhieu: 0,  sai: 0 },
    { sau: 64, giay: 0.8, nhieu: 0,  sai: 0 },
    { sau: 64, giay: 1.0, nhieu: 0,  sai: 0 },
    { sau: 64, giay: 1.3, nhieu: 0,  sai: 0 },
    { sau: 64, giay: 1.6, nhieu: 0,  sai: 0 },
    { sau: 64, giay: 2.0, nhieu: 0,  sai: 0 },
    { sau: 64, giay: 2.5, nhieu: 0,  sai: 0 }
  ];

  /* ---------------- CHẤM ĐIỂM ---------------- */
  const GIA = [0, 0, 200, 200, 400, 900, 450, 100];     // chỉ dùng xếp thứ tự nước ăn
  /* Bảng giá trị (đã gồm giá quân) cho quân Đỏ, hàng 0 = phía Đen (trên), hàng 9 = nhà Đỏ.
     Kiểu bảng cổ điển của các máy cờ tướng mã nguồn mở (Xe ~ 210, Mã / Pháo ~ 95, Tốt chưa
     qua sông ~ 7, Sĩ / Tượng ~ 20); nhân HE_SO để 1 Tốt qua sông ~ 100 điểm. Đen lật hàng. */
  const HE_SO = 4;
  const BANG = {
    1: [ // Tướng (chỉ 3 hàng cuối có nghĩa)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 1, 1, 1, 0, 0, 0,
      0, 0, 0, 2, 2, 2, 0, 0, 0,
      0, 0, 0, 11, 15, 11, 0, 0, 0],
    2: [ // Sĩ
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 20, 0, 20, 0, 0, 0,
      0, 0, 0, 0, 23, 0, 0, 0, 0,
      0, 0, 0, 20, 0, 20, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0],
    3: [ // Tượng
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 20, 0, 0, 0, 20, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0,
      18, 0, 0, 0, 23, 0, 0, 0, 18,
      0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 20, 0, 0, 0, 20, 0, 0],
    4: [ // Mã
      90, 90, 90, 96, 90, 96, 90, 90, 90,
      90, 96, 103, 97, 94, 97, 103, 96, 90,
      92, 98, 99, 103, 99, 103, 99, 98, 92,
      93, 108, 100, 107, 100, 107, 100, 108, 93,
      90, 100, 99, 103, 104, 103, 99, 100, 90,
      90, 98, 101, 102, 103, 102, 101, 98, 90,
      92, 94, 98, 95, 98, 95, 98, 94, 92,
      93, 92, 94, 95, 92, 95, 94, 92, 93,
      85, 90, 92, 93, 78, 93, 92, 90, 85,
      88, 85, 90, 88, 90, 88, 90, 85, 88],
    5: [ // Xe
      206, 208, 207, 213, 214, 213, 207, 208, 206,
      206, 212, 209, 216, 233, 216, 209, 212, 206,
      206, 208, 207, 214, 216, 214, 207, 208, 206,
      206, 213, 213, 216, 216, 216, 213, 213, 206,
      208, 211, 211, 214, 215, 214, 211, 211, 208,
      208, 212, 212, 214, 215, 214, 212, 212, 208,
      204, 209, 204, 212, 214, 212, 204, 209, 204,
      198, 208, 204, 212, 212, 212, 204, 208, 198,
      200, 208, 206, 212, 200, 212, 206, 208, 200,
      194, 206, 204, 212, 200, 212, 204, 206, 194],
    6: [ // Pháo
      100, 100, 96, 91, 90, 91, 96, 100, 100,
      98, 98, 96, 92, 89, 92, 96, 98, 98,
      97, 97, 96, 91, 92, 91, 96, 97, 97,
      96, 99, 99, 98, 100, 98, 99, 99, 96,
      96, 96, 96, 96, 100, 96, 96, 96, 96,
      95, 96, 99, 96, 100, 96, 99, 96, 95,
      96, 96, 96, 96, 96, 96, 96, 96, 96,
      97, 96, 100, 99, 101, 99, 100, 96, 97,
      96, 97, 98, 98, 98, 98, 98, 97, 96,
      96, 96, 97, 99, 99, 99, 97, 96, 96],
    7: [ // Tốt
      9, 9, 9, 11, 13, 11, 9, 9, 9,
      19, 24, 34, 42, 44, 42, 34, 24, 19,
      19, 24, 32, 37, 37, 37, 32, 24, 19,
      19, 23, 27, 29, 30, 29, 27, 23, 19,
      14, 18, 20, 27, 29, 27, 20, 18, 14,
      7, 0, 13, 0, 16, 0, 13, 0, 7,
      7, 0, 7, 0, 15, 0, 7, 0, 7,
      0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0]
  };
  // PST[(chỉ số quân 0..13) * KICH + ô có viền] = giá trị theo góc nhìn bên có quân
  const PST = new Int16Array(14 * KICH);
  for (let loai = 1; loai <= 7; loai++) {
    if (BANG[loai].length !== 90) throw new Error("Bảng giá trị quân " + loai + " sai kích thước");
    for (let h = 0; h < 10; h++) for (let c = 0; c < 9; c++) {
      const s = CT.vt(h, c);
      PST[(loai - 1) * KICH + s] = BANG[loai][h * 9 + c] * HE_SO;
      PST[(6 + loai) * KICH + s] = BANG[loai][(9 - h) * 9 + c] * HE_SO;
    }
  }
  const chiSo = q => (q > 0 ? q - 1 : 6 - q);
  const pst = (q, s) => PST[chiSo(q) * KICH + s];

  /* Điểm tĩnh của thế cờ theo góc nhìn Đỏ (dựng lại từ đầu - chỉ dùng ở gốc) */
  function diemTinh(t) {
    let d = 0;
    for (let o = 0; o < 90; o++) {
      const s = O_SANG_VT[o], q = t.b[s];
      if (q) d += q > 0 ? pst(q, s) : -pst(q, s);
    }
    return d;
  }

  /* ---------------- BẢNG GHI NHỚ ---------------- */
  const TT_BIT = 20, TT_SO = 1 << TT_BIT, TT_MAT = TT_SO - 1;
  const ttK = new Int32Array(TT_SO), ttM = new Int32Array(TT_SO), ttS = new Int16Array(TT_SO);
  const ttD = new Int8Array(TT_SO), ttF = new Int8Array(TT_SO);  // F: 1 đúng, 2 cận dưới, 3 cận trên
  const INF = 32000, MATE = 30000, GAN_MATE = MATE - 1000;

  /* ---------------- TÌM KIẾM ---------------- */
  const MAX_PLY = 96;
  const satThu = new Int32Array(MAX_PLY * 2);
  const lichSu = new Int32Array(KICH * KICH);         // theo (tu, den)
  const viTriLs = m => (m >> 8) * KICH + (m & 255);

  class BoNao {
    constructor() { this.nut = 0; this.han = 0; this.dung = false; }

    /* the: CT.TheCo; khoaCu: khoá thế cờ đã qua (từ lần ăn quân cuối) để biết lặp */
    nghi(the, tuyChon) {
      const t = the.sao();
      const sau = Math.max(1, Math.min(64, tuyChon.sau || 64));
      this.t = t;
      this.han = Date.now() + Math.max(30, (tuyChon.giay || 1) * 1000);
      this.dung = false; this.nut = 0;
      this.ngan = (tuyChon.khoaCu || []).slice();    // ngăn xếp khoá k1 (lặp thế)
      this.mocLap = 0;
      this.diem = diemTinh(t) * t.ben;               // điểm theo góc nhìn bên đang đi
      satThu.fill(0);
      for (let i = 0; i < lichSu.length; i++) lichSu[i] >>= 2;

      const goc0 = t.nuocHopLe();
      if (!goc0.length) return { nuoc: 0, diem: -MATE, sau: 0 };
      if (goc0.length === 1) return { nuoc: goc0[0], diem: 0, sau: 0 };

      if (tuyChon.nhieu > 0) return this.nghiNhieu(goc0, sau, tuyChon);

      let tot = goc0[0], diemTot = 0, sauXong = 0;
      for (let d = 1; d <= sau; d++) {
        const kq = this.timGoc(goc0, d, tot);
        if (kq.nuoc) { tot = kq.nuoc; diemTot = kq.diem; }
        if (this.dung) break;
        sauXong = d;
        if (Math.abs(diemTot) > GAN_MATE) break;     // đã thấy chiếu bí
        // đã dùng quá 45% giờ: độ sâu kế tiếp chắc không kịp xong, thôi khỏi mở
        if (Date.now() > this.han - 0.55 * Math.max(30, (tuyChon.giay || 1) * 1000)) break;
      }
      return { nuoc: tot, diem: diemTot, sau: sauXong, nut: this.nut };
    }

    /* Cấp thấp: chấm điểm TỪNG nước ở gốc (đủ cửa sổ) rồi cộng nhiễu */
    nghiNhieu(goc0, sau, tc) {
      const rnd = tc.ngauNhien || Math.random;
      this.han = Date.now() + 8000;                    // độ sâu nhỏ: không cắt theo giờ
      let tot = goc0[0], diemTot = -INF;
      for (const m of goc0) {
        const an = this.lam(m);
        const s = -this.tim(sau - 1, -INF, INF, 1, true);
        this.bo(m, an);
        const v = s + rnd() * tc.nhieu;
        if (v > diemTot) { diemTot = v; tot = m; }
      }
      return { nuoc: tot, diem: Math.round(diemTot), sau };
    }

    timGoc(goc0, d, pv) {
      // nước tốt lần trước lên đầu, còn lại xếp theo bảng ghi nhớ / ăn quân
      const ds = goc0.slice().sort((a, b) => (b === pv) - (a === pv) || this.diemXep(b, 0, 0) - this.diemXep(a, 0, 0));
      let alpha = -INF, tot = 0;
      for (let i = 0; i < ds.length; i++) {
        const m = ds[i];
        const an = this.lam(m);
        let s;
        if (i === 0) s = -this.tim(d - 1, -INF, -alpha, 1, true);
        else {
          s = -this.tim(d - 1, -alpha - 1, -alpha, 1, true);
          if (s > alpha && !this.dung) s = -this.tim(d - 1, -INF, -alpha, 1, true);
        }
        this.bo(m, an);
        if (this.dung) break;
        if (s > alpha) { alpha = s; tot = m; }
      }
      if (tot) this.luuTT(d, alpha, 1, tot, 0);
      return { nuoc: tot, diem: alpha };
    }

    /* Đi / hoàn nước, cập nhật điểm và ngăn xếp lặp */
    lam(m) {
      const t = this.t, tu = m >> 8, den = m & 255;
      const q = t.b[tu], an = t.b[den];
      let d = pst(q, den) - pst(q, tu);
      if (an) d += pst(an, den);
      this.ngan.push(t.k1);
      t.di(m);
      this.diem = -(this.diem + d);
      return an;
    }
    bo(m, an) {
      const t = this.t;
      t.hoan(m, an);
      this.ngan.pop();
      const tu = m >> 8, den = m & 255, q = t.b[tu];
      let d = pst(q, den) - pst(q, tu);
      if (an) d += pst(an, den);
      this.diem = -this.diem - d;
    }

    /* Điểm hiện tại theo bên đang đi + an toàn Tướng */
    danhGia() {
      const t = this.t, b = t.b;
      let thu1 = 0, thu2 = 0, cong1 = 0, cong2 = 0;
      for (let o = 0; o < 90; o++) {
        const q = b[O_SANG_VT[o]];
        if (!q) continue;
        const a = q > 0 ? q : -q;
        if (a === 2 || a === 3) { if (q > 0) thu1++; else thu2++; }
        else if (a === 5) { if (q > 0) cong1 += 3; else cong2 += 3; }
        else if (a === 4 || a === 6) { if (q > 0) cong1 += 2; else cong2 += 2; }
      }
      const doChenh = (4 - thu1) * cong2 * 6 - (4 - thu2) * cong1 * 6;   // góc nhìn Đỏ
      return this.diem - doChenh * t.ben;
    }

    lap() {
      // thế hiện tại đã gặp (cùng lượt) trong ngăn xếp -> hoà
      const k = this.t.k1, n = this.ngan;
      for (let i = n.length - 2; i >= 0; i -= 2) if (n[i] === k) return true;
      return false;
    }

    diemXep(m, ply, ttMove) {
      if (m === ttMove) return 1 << 30;
      const an = this.t.b[m & 255];
      if (an) return (1 << 28) + GIA[an > 0 ? an : -an] * 16 - GIA[Math.abs(this.t.b[m >> 8])] / 8;
      if (satThu[ply * 2] === m) return 1 << 27;
      if (satThu[ply * 2 + 1] === m) return (1 << 27) - 1;
      return lichSu[viTriLs(m)];
    }

    luuTT(d, s, f, m, ply) {
      const t = this.t, i = t.k2 & TT_MAT;
      if (ttK[i] === t.k1 && ttD[i] > d && ttF[i] === 1) return;
      if (s > GAN_MATE) s += ply; else if (s < -GAN_MATE) s -= ply;
      ttK[i] = t.k1; ttM[i] = m; ttS[i] = s; ttD[i] = d; ttF[i] = f;
    }

    tim(d, alpha, beta, ply, choBo) {
      const t = this.t;
      if ((++this.nut & 1023) === 0 && Date.now() > this.han) this.dung = true;
      if (this.dung) return 0;
      if (this.lap()) return 0;
      if (ply >= MAX_PLY - 2) return this.danhGia();

      const chieu = t.biChieu(t.ben);
      if (chieu) d++;
      if (d <= 0) return this.tinh(alpha, beta, ply);

      // Bảng ghi nhớ
      const i = t.k2 & TT_MAT;
      let ttMove = 0;
      if (ttK[i] === t.k1) {
        ttMove = ttM[i];
        if (ttD[i] >= d) {
          let s = ttS[i];
          if (s > GAN_MATE) s -= ply; else if (s < -GAN_MATE) s += ply;
          const f = ttF[i];
          if (f === 1 || (f === 2 && s >= beta) || (f === 3 && s <= alpha)) return s;
        }
      }

      // Bỏ lượt: bên mình mạnh tới mức cho đối phương đi 2 nước vẫn >= beta
      if (choBo && !chieu && d >= 3 && beta < GAN_MATE && this.coQuanLon(t.ben)) {
        const Rn = d > 6 ? 3 : 2;
        this.ngan.push(t.k1);
        t.boLuot(); this.diem = -this.diem;
        const s = -this.tim(d - 1 - Rn, -beta, -beta + 1, ply + 1, false);
        t.boLuot(); this.diem = -this.diem;
        this.ngan.pop();
        if (this.dung) return 0;
        if (s >= beta) return beta;
      }

      const ds = t.sinhNuoc([], false);
      const diem = new Int32Array(ds.length);
      for (let k = 0; k < ds.length; k++) diem[k] = this.diemXep(ds[k], ply, ttMove);

      let tot = 0, totS = -INF, soHopLe = 0;
      const alpha0 = alpha;
      for (let k = 0; k < ds.length; k++) {
        // chọn nước điểm xếp cao nhất còn lại
        let j = k;
        for (let x = k + 1; x < ds.length; x++) if (diem[x] > diem[j]) j = x;
        const m = ds[j]; ds[j] = ds[k]; ds[k] = m;
        const dj = diem[j]; diem[j] = diem[k]; diem[k] = dj;

        const ben = t.ben;
        const an = this.lam(m);
        if (t.biChieu(ben)) { this.bo(m, an); continue; }
        soHopLe++;
        let s;
        if (soHopLe === 1) s = -this.tim(d - 1, -beta, -alpha, ply + 1, true);
        else {
          let giam = 0;
          if (d >= 3 && soHopLe > 3 && !an && !chieu && dj < (1 << 27)) giam = soHopLe > 10 && d >= 6 ? 2 : 1;
          s = -this.tim(d - 1 - giam, -alpha - 1, -alpha, ply + 1, true);
          if (s > alpha && giam && !this.dung) s = -this.tim(d - 1, -alpha - 1, -alpha, ply + 1, true);
          if (s > alpha && s < beta && !this.dung) s = -this.tim(d - 1, -beta, -alpha, ply + 1, true);
        }
        this.bo(m, an);
        if (this.dung) return 0;
        if (s > totS) { totS = s; tot = m; }
        if (s > alpha) {
          alpha = s;
          if (s >= beta) {
            if (!an) {
              if (satThu[ply * 2] !== m) { satThu[ply * 2 + 1] = satThu[ply * 2]; satThu[ply * 2] = m; }
              lichSu[viTriLs(m)] += d * d;
            }
            this.luuTT(d, s, 2, m, ply);
            return s;
          }
        }
      }
      if (!soHopLe) return -MATE + ply;            // bị chiếu bí hoặc hết nước: thua
      this.luuTT(d, totS, totS > alpha0 ? 1 : 3, tot, ply);
      return totS;
    }

    /* Dò tiếp nước ăn quân cho tới khi yên (bị chiếu thì xét mọi nước) */
    tinh(alpha, beta, ply) {
      const t = this.t;
      if ((++this.nut & 1023) === 0 && Date.now() > this.han) this.dung = true;
      if (this.dung) return 0;
      const chieu = t.biChieu(t.ben);
      if (ply >= MAX_PLY - 2) return this.danhGia();
      let totS = -INF;
      if (!chieu) {
        const dung = this.danhGia();
        if (dung >= beta) return dung;
        if (dung > alpha) alpha = dung;
        totS = dung;
      }
      const ds = t.sinhNuoc([], !chieu);
      const diem = new Int32Array(ds.length);
      for (let k = 0; k < ds.length; k++) diem[k] = this.diemXep(ds[k], ply, 0);
      let soHopLe = 0;
      for (let k = 0; k < ds.length; k++) {
        let j = k;
        for (let x = k + 1; x < ds.length; x++) if (diem[x] > diem[j]) j = x;
        const m = ds[j]; ds[j] = ds[k]; ds[k] = m;
        const dj = diem[j]; diem[j] = diem[k]; diem[k] = dj;
        const ben = t.ben;
        const an = this.lam(m);
        if (t.biChieu(ben)) { this.bo(m, an); continue; }
        soHopLe++;
        const s = -this.tinh(-beta, -alpha, ply + 1);
        this.bo(m, an);
        if (this.dung) return 0;
        if (s > totS) totS = s;
        if (s > alpha) { alpha = s; if (s >= beta) return s; }
      }
      if (chieu && !soHopLe) return -MATE + ply;
      return totS;
    }

    coQuanLon(ben) {
      const b = this.t.b;
      for (let o = 0; o < 90; o++) {
        const q = b[O_SANG_VT[o]] * ben;
        if (q === 4 || q === 5 || q === 6) return true;
      }
      return false;
    }
  }
  const boNao = new BoNao();
  CT.BoNao = BoNao;

  /* Xoá bảng ghi nhớ (ván mới) */
  CT.xoaNho = function () { ttK.fill(0); ttD.fill(0); lichSu.fill(0); };

  /* Máy đi một nước theo cấp 1-20 từ danh sách nước của ván (số tu * 90 + den).
     tuyChonThem: {giay, sau} ghi đè (tự đấu / kiểm thử). Trả về số tu * 90 + den, hoặc -1. */
  CT.mayDiCap = function (nuocDi, cap, ngauNhien, tuyChonThem) {
    const rnd = ngauNhien || Math.random;
    const c = CT.NAO_CAP[cap] || CT.NAO_CAP[1];
    const t = CT.TheCo.banDau();
    let khoaCu = [t.k1];
    for (const n of nuocDi || []) {
      const m = CT.giaiNuoc(Number(n));
      const an = t.di(m);
      khoaCu = an ? [t.k1] : khoaCu.concat(t.k1);
    }
    khoaCu.pop();                                   // thế hiện tại: BoNao tự đẩy khi đi
    const ds = t.nuocHopLe();
    if (!ds.length) return -1;
    if (c.sai && rnd() < c.sai) return CT.maNuoc(ds[Math.floor(rnd() * ds.length)]);
    const tc = Object.assign({ khoaCu, ngauNhien: rnd }, c, tuyChonThem || {});
    const kq = boNao.nghi(t, tc);
    return kq.nuoc ? CT.maNuoc(kq.nuoc) : CT.maNuoc(ds[0]);
  };
  /* Như trên nhưng trả cả thông tin (độ sâu, số nút) - cho tự đấu */
  CT.nghiChiTiet = function (the, tuyChon) { return boNao.nghi(the, tuyChon); };
})(typeof window !== "undefined" ? window : globalThis);
// 22/10/2026 21:10 - BƯỚC: TC_03A
