/* ================================================================
   FILE: san_tu/st_ve_khunglong.js
   CHỨC NĂNG: HÌNH VẼ đường đua 5 "Thung lũng khủng long" (game Giải Cứu Mèo Con).
              Cảnh: trời tiền sử, núi lửa xa phun khói, bóng khủng long cổ dài đi xa, rừng tuế,
              dương xỉ; đất nâu có hóa thạch; hố bùn sôi; hang hóa thạch (xương, hổ phách);
              hang núi đá ở màn 7; bé CƯỠI khủng long con. 19 quái / vật cản thời tiền sử.
              Quy ước giống st_ve_keo.js: gốc tọa độ giữa đáy vật, mặt quay sang TRÁI, "this" là BoVe.
   BƯỚC: TC_00F
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST;
  const { PI2, tronMau, bam, chiaDuong, moiBuoc } = ST.VE_CHUNG;

  ST.CHU_DE_VE = ST.CHU_DE_VE || {};
  ST.CHU_DE_VE.khungLong = {
    cong: { soc: "#3fae5a", nut: "#ff9f1c" },
    mauGoHang: ["#8a5a30", "#d8a868"],
    phuongTien: {
      nang: 16, dungYen: true,
      sau(tt) { // khủng long con xanh lá, gai cam, bé ngồi trên lưng
        const c = this.c, buoc = tt.dangChay ? Math.sin(tt.pha * 1.2) : 0, gat = Math.sin(tt.t * 6) * 0.08;
        c.fillStyle = "#3f9e4a";
        [[-18, 1], [-8, -1], [10, 1], [20, -1]].forEach(([dx, s]) => { c.beginPath(); c.roundRect(dx - 4 + s * buoc * 4, -14, 9, 14, 4); c.fill(); });
        c.fillStyle = "#4fbf5a";
        c.save(); c.translate(-26, -18); c.rotate(gat); // đuôi
        c.beginPath(); c.moveTo(0, -8); c.quadraticCurveTo(-18, -8, -26, -2); c.quadraticCurveTo(-14, 4, 0, 6); c.fill(); c.restore();
        c.beginPath(); c.ellipse(0, -20, 30, 12, 0, 0, PI2); c.fill();
        c.beginPath(); c.moveTo(18, -26); c.quadraticCurveTo(28, -40, 32, -42); c.lineTo(38, -30); c.quadraticCurveTo(30, -22, 22, -14); c.fill(); // cổ
        c.beginPath(); c.ellipse(38, -40, 12, 9, 0.15, 0, PI2); c.fill(); // đầu
        c.fillStyle = "#ff9f1c"; // gai lưng
        [-24, -14, 16, 24].forEach(dx => { c.beginPath(); c.moveTo(dx - 5, -28 + Math.abs(dx) * 0.08); c.lineTo(dx, -38 + Math.abs(dx) * 0.12); c.lineTo(dx + 5, -28 + Math.abs(dx) * 0.08); c.fill(); });
        c.fillStyle = "#c8f0a8"; c.beginPath(); c.ellipse(4, -13, 20, 5, 0, 0, PI2); c.fill(); // bụng
        c.fillStyle = "#e8344e"; c.beginPath(); c.roundRect(-11, -33, 22, 8, 4); c.fill(); // yên
        c.fillStyle = "#fff"; c.beginPath(); c.arc(41, -43, 4, 0, PI2); c.fill();
        c.fillStyle = "#2B2640"; c.beginPath(); c.arc(42, -43, 2, 0, PI2); c.fill();
        c.strokeStyle = "#2B2640"; c.lineWidth = 1.5; c.beginPath(); c.arc(42, -37, 5, 0.2, Math.PI * 0.6); c.stroke();
        c.fillStyle = "rgba(255,120,150,0.5)"; c.beginPath(); c.arc(36, -36, 2.5, 0, PI2); c.fill();
      }
    },

    nen(camX, p) {
      const c = this.c, W = this.rong, H = this.cao, dat = this.dat, t = this.t;
      const s = Math.max(0, (p - 0.45) / 0.55);
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, tronMau("#8fd8e0", "#ffa86a", s * 0.7));
      gr.addColorStop(1, tronMau("#fff2c0", "#ffe0a0", s));
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // núi lửa xa phun khói
      this.veLop(camX, 0.1, 900, dat, (x, y, i) => {
        const cx = x + 450, r = 230;
        c.fillStyle = tronMau("#b8c8c0", "#c0a8a8", s * 0.5);
        c.beginPath(); c.moveTo(cx - r * 1.4, dat); c.lineTo(cx - 34, dat - r); c.lineTo(cx + 34, dat - r); c.lineTo(cx + r * 1.4, dat); c.fill();
        c.fillStyle = "#ff8a3a"; c.beginPath(); c.moveTo(cx - 34, dat - r); c.lineTo(cx - 18, dat - r + 28); c.lineTo(cx - 6, dat - r + 10); c.lineTo(cx + 10, dat - r + 34); c.lineTo(cx + 34, dat - r); c.fill();
        c.fillStyle = "rgba(120,110,110,0.35)";
        for (let k = 0; k < 4; k++) { const u = (t * 0.12 + k / 4) % 1; c.beginPath(); c.arc(cx + u * 60, dat - r - 20 - u * 120, 18 + u * 30, 0, PI2); c.fill(); }
      });
      // bóng khủng long cổ dài đi chậm phía xa
      this.veLop(camX, 0.22, 700, dat, (x, y, i) => {
        if (bam(i + 3) < 0.35) return;
        const cx = x + 300 + Math.sin(t * 0.3 + i) * 10, k = 0.7 + bam(i) * 0.3;
        c.fillStyle = tronMau("#9cc8b4", "#b8a090", s * 0.5);
        c.beginPath(); c.ellipse(cx, dat - 60 * k, 70 * k, 30 * k, 0, 0, PI2); c.fill();
        c.lineWidth = 16 * k; c.strokeStyle = c.fillStyle; c.lineCap = "round";
        c.beginPath(); c.moveTo(cx - 40 * k, dat - 70 * k); c.quadraticCurveTo(cx - 80 * k, dat - 150 * k, cx - 70 * k, dat - 190 * k); c.stroke();
        c.beginPath(); c.moveTo(cx + 60 * k, dat - 60 * k); c.quadraticCurveTo(cx + 120 * k, dat - 50 * k, cx + 150 * k, dat - 30 * k); c.stroke();
        c.beginPath(); c.ellipse(cx - 78 * k, dat - 192 * k, 16 * k, 9 * k, 0, 0, PI2); c.fill();
        [-40, -15, 25, 45].forEach(dx => c.fillRect(cx + dx * k - 8 * k, dat - 50 * k, 16 * k, 50 * k));
      });
      // rừng tuế / cọ cổ
      this.veLop(camX, 0.42, 230, dat - 30, (x, y, i) => {
        const cx = x + 100 + bam(i) * 60, cao = 150 + bam(i + 1) * 90;
        c.fillStyle = tronMau("#7cbf98", "#a8a080", s * 0.4);
        c.fillRect(cx - 7, dat - cao, 14, cao);
        for (let j = 0; j < 7; j++) { const a = -Math.PI / 2 + (j - 3) * 0.48; c.save(); c.translate(cx, dat - cao); c.rotate(a + Math.PI / 2); c.beginPath(); c.ellipse(0, -36, 10, 40, 0, 0, PI2); c.fill(); c.restore(); }
      });
      // dương xỉ phía trước
      this.veLop(camX, 0.7, 140, dat, (x, y, i) => {
        const xx = x + 40 + bam(i) * 60, k = 0.7 + bam(i + 2) * 0.5;
        if (bam(i + 7) < 0.3) return;
        veDuongXi(c, xx, dat - 2, k, "#4fa860", Math.sin(t * 1.5 + i) * 0.04);
      });
    },

    dat(camX, ds, doDai) {
      const c = this.c, y = this.dat, H = this.cao, t = this.t;
      const { ho, doan } = chiaDuong(this, camX, ds);
      ho.forEach(([a, b]) => { // bùn đen sôi lục bục
        const gr = c.createLinearGradient(0, y, 0, H);
        gr.addColorStop(0, "#5a3a20"); gr.addColorStop(1, "#1a0f08");
        c.fillStyle = gr; c.fillRect(a, y + 4, b - a, H - y);
        c.fillStyle = "#3a2410"; c.fillRect(a, y + 16, b - a, 8);
        for (let k = 0; k < 3; k++) {
          const u = (t * 0.7 + k / 3) % 1, bx = a + (b - a) * (0.25 + k * 0.25);
          c.strokeStyle = `rgba(160,110,60,${1 - u})`; c.lineWidth = 2; c.beginPath(); c.arc(bx, y + 18, 3 + u * 9, Math.PI, PI2); c.stroke();
        }
      });
      doan.forEach(([a, b]) => {
        c.fillStyle = "#a8683a"; c.fillRect(a, y + 10, b - a, H - y);
        c.save(); c.beginPath(); c.rect(a, y + 10, b - a, H - y); c.clip();
        c.fillStyle = "#8a5230"; c.fillRect(a, y + 40, b - a, 10);
        moiBuoc(camX, a, b, 130, (i, x) => { // hóa thạch trong đất
          const yy = y + 28 + bam(i) * 30;
          if (bam(i + 4) < 0.5) {
            c.strokeStyle = "rgba(255,240,210,0.65)"; c.lineWidth = 2; c.beginPath();
            for (let g = 0; g < Math.PI * 4; g += 0.3) { const r = 1 + g * 1.4; c.lineTo(x + 30 + Math.cos(g) * r, yy + Math.sin(g) * r); }
            c.stroke(); // ốc cúc
          } else {
            c.fillStyle = "rgba(255,240,210,0.7)"; c.fillRect(x + 20, yy - 2, 22, 4);
            [x + 20, x + 42].forEach(xx => { c.beginPath(); c.arc(xx, yy - 3, 3.5, 0, PI2); c.arc(xx, yy + 3, 3.5, 0, PI2); c.fill(); }); // khúc xương
          }
        });
        c.restore();
        c.fillStyle = "#6cc04a"; c.beginPath(); c.roundRect(a - 2, y - 3, b - a + 4, 15, 7); c.fill();
        c.fillStyle = "#4fa03a";
        moiBuoc(camX, a, b, 22, (i, x) => { if (x < a + 4 || x > b - 4) return; c.beginPath(); c.moveTo(x - 4, y + 1); c.lineTo(x, y - 7 - bam(i) * 4); c.lineTo(x + 4, y + 1); c.fill(); });
        moiBuoc(camX, a, b, 120, (i, x) => { // hoa nhỏ
          if (bam(i * 3) > 0.4 || x < a + 8 || x > b - 8 || x > doDai - camX + 40) return;
          c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(x, y - 4, 3.5, 0, PI2); c.fill();
        });
      });
    },
    mieng(x, w) { // mép cỏ và bùn nhỏ giọt
      const c = this.c, y = this.dat, t = this.t;
      c.fillStyle = "#6cc04a";
      for (const ex of [x, x + w]) { c.beginPath(); c.arc(ex, y + 5, 7, 0, PI2); c.fill(); }
      c.fillStyle = "#3a2410";
      for (let k = 0; k < 2; k++) { const u = (t + k * 0.5) % 1; c.beginPath(); c.ellipse(x + 5, y + 10 + u * 12, 2.5, 3.5, 0, 0, PI2); c.ellipse(x + w - 5, y + 10 + ((u + 0.3) % 1) * 12, 2.5, 3.5, 0, 0, PI2); c.fill(); }
    },

    nenHang(camX) { // hang hóa thạch: vách đá cam nâu, bộ xương khủng long trong vách, hổ phách sáng
      const c = this.c, W = this.rong, Hc = this.cao, dat = this.dat, t = this.t;
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, "#3a2214"); gr.addColorStop(1, "#7a4a28");
      c.fillStyle = gr; c.fillRect(0, 0, W, Hc);
      c.fillStyle = "rgba(0,0,0,0.15)";
      moiBuoc(camX * 0.4, -100, W + 100, 90, (i, x) => { c.beginPath(); c.ellipse(x + 40, 30 + bam(i) * dat * 0.5, 40, 22, 0, 0, PI2); c.fill(); });
      // bộ xương trong vách
      moiBuoc(camX * 0.6, -300, W + 300, 420, (i, x) => {
        const yb = Math.max(60, dat - 170), cx = x + 200;
        c.strokeStyle = "rgba(255,236,200,0.75)"; c.lineWidth = 5; c.lineCap = "round";
        c.beginPath(); c.moveTo(cx - 90, yb + 40); c.quadraticCurveTo(cx, yb - 10, cx + 110, yb + 50); c.stroke(); // sống lưng
        c.lineWidth = 3;
        for (let k = 0; k < 7; k++) { const xx = cx - 50 + k * 16, yy = yb + 12 + Math.abs(k - 3) * 3; c.beginPath(); c.moveTo(xx, yy); c.quadraticCurveTo(xx + 6, yy + 30, xx, yy + 46); c.stroke(); }
        c.fillStyle = "rgba(255,236,200,0.75)"; c.beginPath(); c.ellipse(cx - 104, yb + 44, 20, 13, -0.3, 0, PI2); c.fill();
        c.fillStyle = "#3a2214"; c.beginPath(); c.arc(cx - 108, yb + 40, 4, 0, PI2); c.fill();
      });
      // hổ phách phát sáng
      moiBuoc(camX * 0.8, -60, W + 60, 170, (i, x) => {
        const yb = dat - 40 - bam(i) * 120, nhip = 1 + Math.sin(t * 3 + i) * 0.15;
        c.fillStyle = "rgba(255,180,60,0.25)"; c.beginPath(); c.arc(x + 60, yb, 26 * nhip, 0, PI2); c.fill();
        c.fillStyle = "#ffae2a"; c.beginPath(); c.moveTo(x + 50, yb); c.lineTo(x + 58, yb - 13); c.lineTo(x + 70, yb - 6); c.lineTo(x + 68, yb + 9); c.lineTo(x + 54, yb + 10); c.fill();
        c.fillStyle = "#6b3f1f"; c.beginPath(); c.ellipse(x + 60, yb, 3, 2, 0.5, 0, PI2); c.fill();
      });
      c.fillStyle = "#6b4226"; c.fillRect(0, dat, W, Hc - dat);
      c.fillStyle = "#a8683a"; c.fillRect(0, dat, W, 8);
    },

    bongLauDai(x, y, k) {
      const c = this.c;
      c.fillStyle = "#8a7a6a";
      c.beginPath(); c.moveTo(x - 200 * k, y); c.lineTo(x - 120 * k, y - 140 * k); c.lineTo(x - 40 * k, y - 190 * k); c.lineTo(x + 60 * k, y - 160 * k); c.lineTo(x + 150 * k, y - 100 * k); c.lineTo(x + 210 * k, y); c.fill();
    },

    lauDai(g) { // hang núi đá: vách đá xám có dây leo, đầu lâu khủng long trên cửa, tảng đá lăn ra khi thắng
      const c = this.c, t = this.t;
      c.fillStyle = "#9a8a78"; c.beginPath(); c.moveTo(-210, 0); c.lineTo(-180, -120); c.lineTo(-110, -200); c.lineTo(-20, -240); c.lineTo(70, -215); c.lineTo(150, -160); c.lineTo(200, -80); c.lineTo(215, 0); c.fill();
      c.fillStyle = "#7a6a5a"; c.beginPath(); c.moveTo(-20, -240); c.lineTo(70, -215); c.lineTo(150, -160); c.lineTo(200, -80); c.lineTo(215, 0); c.lineTo(60, 0); c.fill();
      c.strokeStyle = "rgba(60,40,30,0.3)"; c.lineWidth = 2;
      [[-160, -100, -100, -130], [-60, -200, 0, -170], [80, -140, 140, -100]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
      // dây leo
      c.strokeStyle = "#3f9e4a"; c.lineWidth = 3;
      [[-150, -140], [110, -170], [170, -100]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(dx, dy); c.quadraticCurveTo(dx + 10, dy + 40, dx - 4, dy + 80); c.stroke(); c.fillStyle = "#4fbf5a"; for (let j = 0; j < 4; j++) { c.beginPath(); c.ellipse(dx + 4, dy + 14 + j * 18, 6, 3.5, 0.5, 0, PI2); c.fill(); } });
      // cây tuế nhỏ trên đỉnh
      c.fillStyle = "#3f8a5a"; for (let j = 0; j < 5; j++) { c.save(); c.translate(-20, -238); c.rotate((j - 2) * 0.5); c.beginPath(); c.ellipse(0, -22, 7, 24, 0, 0, PI2); c.fill(); c.restore(); }
      // cửa hang + đầu lâu khủng long
      c.fillStyle = "#2a1a10"; c.beginPath(); c.roundRect(-120, -96, 64, 96, [32, 32, 0, 0]); c.fill();
      c.fillStyle = "#fff0d6"; c.beginPath(); c.ellipse(-88, -112, 30, 16, 0, 0, PI2); c.fill();
      c.fillStyle = "#2a1a10"; c.beginPath(); c.arc(-100, -114, 5, 0, PI2); c.arc(-76, -114, 5, 0, PI2); c.fill();
      c.fillStyle = "#fff0d6"; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(-108 + k * 9, -98); c.lineTo(-104 + k * 9, -88); c.lineTo(-100 + k * 9, -98); c.fill(); }
      const mo = g.trangThai === "thang" ? Math.min(1, g.tKetThuc / 0.8) : 0;
      c.save(); c.translate(-88 - mo * 70, -36); c.rotate(-mo * 2.4);
      c.fillStyle = "#8a7a68"; c.beginPath(); c.arc(0, 0, 36, 0, PI2); c.fill();
      c.strokeStyle = "rgba(60,40,30,0.35)"; c.lineWidth = 2; c.beginPath(); c.moveTo(-14, -20); c.lineTo(6, -2); c.lineTo(-4, 18); c.stroke();
      c.restore();
      // đuốc
      [-142, -34].forEach(dx => {
        c.fillStyle = "#6b4226"; c.fillRect(dx - 3, -78, 6, 26);
        const nhip = 1 + Math.sin(t * 12 + dx) * 0.15;
        c.fillStyle = "#ff8c1a"; c.beginPath(); c.ellipse(dx, -84, 6, 11 * nhip, 0, 0, PI2); c.fill();
        c.fillStyle = "#ffe27a"; c.beginPath(); c.ellipse(dx, -81, 3, 6 * nhip, 0, 0, PI2); c.fill();
      });
      c.fillStyle = "#fff"; c.beginPath(); c.roundRect(-10, -150, 110, 30, 10); c.fill();
      c.strokeStyle = "#3fae5a"; c.lineWidth = 3; c.stroke();
      c.fillStyle = "#2a5a2a"; c.font = '800 18px "Baloo 2", "Be Vietnam Pro", system-ui, sans-serif'; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("Hang Núi", 45, -134);
    }
  };

  function veDuongXi(c, x, y, k, mau, lac) { // bụi dương xỉ: các lá cong tỏa ra
    c.fillStyle = mau;
    for (let j = 0; j < 5; j++) {
      const a = -Math.PI / 2 + (j - 2) * 0.5 + lac;
      c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(14 * k, -24 * k, 4 * k, -50 * k); c.quadraticCurveTo(-10 * k, -24 * k, 0, 0); c.fill();
      c.restore();
    }
  }

  /* ================================================================
     QUÁI / VẬT CẢN THỜI KHỦNG LONG
     ================================================================ */
  ST.VE_QUAI = ST.VE_QUAI || {};
  Object.assign(ST.VE_QUAI, {
    trungKhungLong(w, h, t, o) { // quả trứng to có đốm, nứt nhẹ, rung rinh
      const c = this.c, rung = Math.sin(t * 9) * 0.05 * (Math.sin(t * 1.3) > 0.6 ? 1 : 0), dom = ["#5fae5a", "#e8743a", "#7a5ce0"][(o.bienThe || 0) % 3];
      c.save(); c.rotate(rung);
      c.fillStyle = "#fff4dc"; c.strokeStyle = "#c8a878"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-w * 0.62, 0, -w * 0.42, -h * 1.02, 0, -h); c.bezierCurveTo(w * 0.42, -h * 1.02, w * 0.62, 0, 0, 0); c.fill(); c.stroke();
      c.fillStyle = dom; [[-0.18, -0.3, 6], [0.15, -0.5, 5], [-0.05, -0.75, 4], [0.2, -0.2, 4]].forEach(([a, b, r]) => { c.beginPath(); c.arc(a * w, b * h, r, 0, PI2); c.fill(); });
      c.strokeStyle = "#8a6a40"; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-w * 0.3, -h * 0.6); c.lineTo(-w * 0.15, -h * 0.66); c.lineTo(-w * 0.05, -h * 0.58); c.lineTo(w * 0.08, -h * 0.66); c.stroke();
      c.restore();
    },
    xuongKhungLong(w, h) { // đống xương hóa thạch: sọ có sừng và hai khúc xương bắt chéo
      const c = this.c;
      c.fillStyle = "#8a6a40"; c.beginPath(); c.ellipse(0, -2, w / 2, 5, 0, Math.PI, PI2); c.fill();
      c.strokeStyle = "#f2e2c0"; c.lineWidth = 7; c.lineCap = "round";
      c.beginPath(); c.moveTo(w * 0.05, -6); c.lineTo(w * 0.42, -h * 0.75); c.moveTo(w * 0.42, -6); c.lineTo(w * 0.05, -h * 0.75); c.stroke();
      c.fillStyle = "#f2e2c0"; [[0.05, -6], [0.42, -h * 0.75], [0.42, -6], [0.05, -h * 0.75]].forEach(([a, b]) => { const xx = a * w; c.beginPath(); c.arc(xx - 3, b - 2, 4.5, 0, PI2); c.arc(xx + 3, b + 2, 4.5, 0, PI2); c.fill(); });
      c.fillStyle = "#f2e2c0"; c.strokeStyle = "#b89a68"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-w / 2, -4); c.quadraticCurveTo(-w / 2 - 2, -h * 0.7, -w * 0.25, -h * 0.85); c.quadraticCurveTo(-w * 0.02, -h * 0.9, -w * 0.02, -h * 0.4); c.lineTo(-w * 0.08, -4); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = "#2B2640"; c.beginPath(); c.ellipse(-w * 0.2, -h * 0.55, 5, 6, 0, 0, PI2); c.fill();
      c.beginPath(); c.ellipse(-w * 0.4, -h * 0.35, 2.5, 3, 0, 0, PI2); c.fill();
      c.fillStyle = "#f2e2c0"; c.beginPath(); c.moveTo(-w * 0.2, -h * 0.82); c.lineTo(-w * 0.32, -h - 4); c.lineTo(-w * 0.12, -h * 0.86); c.fill(); c.stroke();
      c.fillStyle = "#fff"; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-w * 0.46 + k * 6, -8); c.lineTo(-w * 0.44 + k * 6, -2); c.lineTo(-w * 0.42 + k * 6, -8); c.fill(); }
    },
    buiDuongXi(w, h, t) { // bụi dương xỉ xanh tươi, đầu lá cuộn
      const c = this.c, lac = Math.sin(t * 2) * 0.05;
      const k = h / 50;
      c.save(); c.scale(w / (h * 1.4), 1);
      for (let j = 0; j < 7; j++) {
        const a = (j - 3) * 0.38 + lac;
        c.save(); c.rotate(a);
        c.fillStyle = j % 2 ? "#3fae5a" : "#58c84e";
        c.beginPath(); c.moveTo(-3, 0); c.quadraticCurveTo(-14 * k, -h * 0.5, 0, -h); c.quadraticCurveTo(14 * k, -h * 0.5, 3, 0); c.fill();
        c.strokeStyle = "#2f7d3a"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -h + 4); c.stroke();
        c.restore();
      }
      c.restore();
      c.strokeStyle = "#2f7d3a"; c.lineWidth = 3; c.beginPath(); c.arc(-w * 0.12, -h - 2, 5, 0, Math.PI * 1.6); c.stroke();
    },
    tangDaReu(w, h) { // tảng đá xám phủ rêu xanh
      const c = this.c;
      c.fillStyle = "#8a8f9a"; c.beginPath(); c.moveTo(-w / 2, 0); c.quadraticCurveTo(-w / 2, -h, -w * 0.05, -h); c.quadraticCurveTo(w / 2, -h, w / 2, 0); c.fill();
      c.fillStyle = "#6f7480"; c.beginPath(); c.moveTo(w * 0.1, -h * 0.9); c.quadraticCurveTo(w / 2, -h * 0.8, w / 2, 0); c.lineTo(w * 0.1, 0); c.fill();
      c.fillStyle = "#58b04a"; c.beginPath(); c.moveTo(-w * 0.42, -h * 0.6); c.quadraticCurveTo(-w * 0.3, -h - 3, 0, -h - 2); c.quadraticCurveTo(w * 0.32, -h, w * 0.42, -h * 0.62);
      c.quadraticCurveTo(w * 0.2, -h * 0.66, w * 0.1, -h * 0.55); c.quadraticCurveTo(-w * 0.1, -h * 0.7, -w * 0.42, -h * 0.6); c.fill();
      c.fillStyle = "#ff7eb6"; c.beginPath(); c.arc(-w * 0.1, -h - 2, 3.5, 0, PI2); c.fill();
    },
    toTrung(w, h, t) { // tổ cành cây với ba quả trứng
      const c = this.c, tm = h * 0.5;
      ["#c8f0a8", "#ffd6a0", "#b8d8ff"].forEach((m, i) => {
        const x = (i - 1) * w * 0.22, cao = tm + (i === 1 ? 6 : 0), lac = Math.sin(t * 6 + i) * 0.04;
        c.save(); c.translate(x, -h * 0.4); c.rotate(lac);
        c.fillStyle = m; c.strokeStyle = "#8a6a40"; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, -cao * 0.5, w * 0.13, cao * 0.62, 0, 0, PI2); c.fill(); c.stroke();
        c.restore();
      });
      c.fillStyle = "#a8743a"; c.beginPath(); c.moveTo(-w / 2, -h * 0.5); c.quadraticCurveTo(-w * 0.45, 2, 0, 0); c.quadraticCurveTo(w * 0.45, 2, w / 2, -h * 0.5); c.closePath(); c.fill();
      c.strokeStyle = "#6b4226"; c.lineWidth = 2;
      for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-w / 2 + i * 4, -h * 0.5 + i * 2); c.lineTo(w / 2 - i * 3, -h * 0.25 + (i % 3) * 3); c.stroke(); }
    },
    khucGoCo(w, h) { // khúc gỗ nằm, vòng tuổi, nấm cam
      const c = this.c;
      c.fillStyle = "#8a5530"; c.beginPath(); c.roundRect(-w / 2 + h * 0.2, -h, w - h * 0.2, h, h * 0.3); c.fill();
      c.strokeStyle = "#6b3f1f"; c.lineWidth = 2; for (let i = 1; i <= 2; i++) { c.beginPath(); c.moveTo(-w / 2 + h * 0.5, -h * i / 3); c.lineTo(w / 2 - 6, -h * i / 3 + 2); c.stroke(); }
      c.fillStyle = "#d8a868"; c.beginPath(); c.ellipse(-w / 2 + h * 0.25, -h / 2, h * 0.3, h / 2, 0, 0, PI2); c.fill();
      c.strokeStyle = "#a8743a"; c.lineWidth = 1.5; [0.2, 0.1].forEach(k => { c.beginPath(); c.ellipse(-w / 2 + h * 0.25, -h / 2, h * k, h * k * 1.6, 0, 0, PI2); c.stroke(); });
      c.fillStyle = "#58b04a"; c.beginPath(); c.ellipse(w * 0.1, -h, w * 0.18, 4, 0, Math.PI, PI2); c.fill();
      c.fillStyle = "#ff8c1a"; c.beginPath(); c.ellipse(w * 0.3, -h - 4, 8, 6, 0, Math.PI, PI2); c.fill(); c.fillStyle = "#fff4dc"; c.fillRect(w * 0.3 - 2, -h - 4, 4, 5);
    },
    cotDaCao(w, h) { // cột đá cao nhiều tầng có dây leo, quá cao để nhảy qua
      const c = this.c, so = 5, buoc = h / so;
      for (let j = 0; j < so; j++) {
        const rr = w * (0.5 - j * 0.04), y0 = -j * buoc;
        c.fillStyle = j % 2 ? "#9a8f86" : "#aaa096"; c.beginPath(); c.roundRect(-rr + (j % 2 ? 3 : -3), y0 - buoc - 2, rr * 2, buoc + 2, 8); c.fill();
        c.fillStyle = "rgba(0,0,0,0.12)"; c.fillRect(rr * 0.3, y0 - buoc, rr * 0.6, buoc);
      }
      c.strokeStyle = "#3f9e4a"; c.lineWidth = 3; c.beginPath(); c.moveTo(-w * 0.2, -h); c.quadraticCurveTo(-w * 0.45, -h * 0.6, -w * 0.15, -h * 0.25); c.stroke();
      c.fillStyle = "#58c84e"; for (let j = 0; j < 6; j++) { c.beginPath(); c.ellipse(-w * 0.3 + Math.sin(j) * 6, -h * 0.9 + j * h * 0.11, 6, 3.5, 0.6, 0, PI2); c.fill(); }
      c.fillStyle = "#58c84e"; c.beginPath(); c.ellipse(0, -h, w * 0.4, 8, 0, Math.PI, PI2); c.fill();
    },
    cayTueCao(w, h, t) { // cây tuế cổ thụ: thân vảy hình thoi, chùm lá xòe trên ngọn
      const c = this.c, lac = Math.sin(t * 1.5) * 0.04, ngon = -h + 34;
      c.fillStyle = "#8a5a30"; c.beginPath(); c.moveTo(-w * 0.16, 0); c.lineTo(-w * 0.11, ngon); c.lineTo(w * 0.11, ngon); c.lineTo(w * 0.16, 0); c.fill();
      c.strokeStyle = "#6b3f1f"; c.lineWidth = 1.5;
      for (let y = -10; y > ngon; y -= 14) { c.beginPath(); c.moveTo(-w * 0.14, y); c.lineTo(0, y - 7); c.lineTo(w * 0.14, y); c.stroke(); }
      for (let j = 0; j < 9; j++) {
        const a = (j - 4) * 0.36 + lac;
        c.save(); c.translate(0, ngon); c.rotate(a);
        c.fillStyle = j % 2 ? "#2f8a4a" : "#3fae5a"; c.beginPath(); c.ellipse(0, -w * 0.38, 7, w * 0.42, 0, 0, PI2); c.fill();
        c.restore();
      }
      c.fillStyle = "#ff9f1c"; c.beginPath(); c.arc(-5, ngon + 2, 5, 0, PI2); c.arc(5, ngon + 3, 5, 0, PI2); c.fill();
    },
    khungLongGiap(w, h, t, o) { // khủng long giáp: lưng gù có giáp gai, đuôi chùy
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 6) : 0, quat = Math.sin(t * 4) * 0.25;
      c.fillStyle = "#b8803a";
      [[-0.28, 1], [-0.12, -1], [0.12, 1], [0.28, -1]].forEach(([a, s]) => { c.beginPath(); c.roundRect(a * w - 5 + s * buoc * 3, -h * 0.35, 10, h * 0.35, 4); c.fill(); });
      c.save(); c.translate(w * 0.36, -h * 0.4); c.rotate(quat);
      c.strokeStyle = "#c8903e"; c.lineWidth = 7; c.lineCap = "round"; c.beginPath(); c.moveTo(0, 0); c.lineTo(w * 0.16, 2); c.stroke();
      c.fillStyle = "#8a5a2a"; c.beginPath(); c.ellipse(w * 0.17, 2, 8, 6, 0, 0, PI2); c.fill();
      c.restore();
      c.fillStyle = "#d89a4a"; c.beginPath(); c.ellipse(0, -h * 0.45, w * 0.4, h * 0.42, 0, Math.PI, PI2); c.lineTo(w * 0.4, -h * 0.3); c.lineTo(-w * 0.4, -h * 0.3); c.fill();
      c.fillStyle = "#8a5a2a";
      for (let k = 0; k < 5; k++) { const xx = -w * 0.28 + k * w * 0.14, yy = -h * 0.45 - Math.sin((k + 0.5) / 5 * Math.PI) * h * 0.38; c.beginPath(); c.moveTo(xx - 5, yy + 3); c.lineTo(xx, yy - 8); c.lineTo(xx + 5, yy + 3); c.fill(); }
      c.fillStyle = "#c8803a"; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(-w * 0.2 + k * w * 0.13, -h * 0.55, 4, 0, PI2); c.fill(); }
      c.fillStyle = "#d89a4a"; c.beginPath(); c.ellipse(-w * 0.42, -h * 0.4, w * 0.12, h * 0.18, 0, 0, PI2); c.fill();
      this.mat(-w * 0.44, -h * 0.46, 2.6, true);
      c.strokeStyle = "#2B2640"; c.lineWidth = 1.5; c.beginPath(); c.arc(-w * 0.46, -h * 0.34, 3, 0.2, Math.PI - 0.4); c.stroke();
    },
    khungLongBaSung(w, h, t, o) { // khủng long ba sừng: diềm cổ tím, ba sừng trắng
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 7) : 0;
      c.fillStyle = "#3f8fc8";
      [[-0.2, 1], [-0.05, -1], [0.18, 1], [0.32, -1]].forEach(([a, s]) => { c.beginPath(); c.roundRect(a * w - 6 + s * buoc * 3, -h * 0.35, 12, h * 0.35, 4); c.fill(); });
      c.fillStyle = "#4fa8e0"; c.beginPath(); c.ellipse(w * 0.1, -h * 0.48, w * 0.36, h * 0.3, 0, 0, PI2); c.fill();
      c.beginPath(); c.moveTo(w * 0.4, -h * 0.5); c.lineTo(w / 2, -h * 0.4); c.lineTo(w * 0.38, -h * 0.34); c.fill();
      c.fillStyle = "#9b5de5"; c.beginPath(); c.arc(-w * 0.16, -h * 0.62, h * 0.38, -Math.PI * 0.95, Math.PI * 0.25); c.fill(); // diềm
      c.fillStyle = "#ffd23f"; for (let k = 0; k < 5; k++) { const a = -Math.PI * 0.85 + k * 0.42; c.beginPath(); c.arc(-w * 0.16 + Math.cos(a) * h * 0.32, -h * 0.62 + Math.sin(a) * h * 0.32, 3, 0, PI2); c.fill(); }
      c.fillStyle = "#4fa8e0"; c.beginPath(); c.ellipse(-w * 0.32, -h * 0.48, w * 0.17, h * 0.2, -0.1, 0, PI2); c.fill();
      c.fillStyle = "#fff4dc";
      [[-0.28, -0.72, -0.52, -0.98], [-0.18, -0.74, -0.38, -1.0], [-0.46, -0.52, -0.58, -0.66]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a * w - 4, b * h); c.lineTo(d * w, e * h); c.lineTo(a * w + 4, b * h + 3); c.fill(); });
      this.mat(-w * 0.32, -h * 0.55, 2.8, true);
    },
    khungLongMoVit(w, h, t, o) { // khủng long mỏ vịt: đứng hai chân, mào cong dài trên đầu
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 9) : 0;
      c.fillStyle = "#c86a9a";
      c.beginPath(); c.roundRect(-w * 0.05 + buoc * 4, -h * 0.3, 9, h * 0.3, 4); c.roundRect(w * 0.12 - buoc * 4, -h * 0.3, 9, h * 0.3, 4); c.fill();
      c.fillStyle = "#e88ab8"; c.beginPath(); c.moveTo(w * 0.15, -h * 0.5); c.quadraticCurveTo(w * 0.5, -h * 0.4, w / 2, -h * 0.18); c.quadraticCurveTo(w * 0.3, -h * 0.28, w * 0.1, -h * 0.3); c.fill();
      c.beginPath(); c.ellipse(w * 0.06, -h * 0.42, w * 0.24, h * 0.2, -0.3, 0, PI2); c.fill();
      c.beginPath(); c.moveTo(-w * 0.08, -h * 0.5); c.quadraticCurveTo(-w * 0.18, -h * 0.65, -w * 0.16, -h * 0.72); c.lineTo(-w * 0.02, -h * 0.68); c.lineTo(w * 0.05, -h * 0.5); c.fill();
      c.beginPath(); c.ellipse(-w * 0.22, -h * 0.74, w * 0.16, h * 0.11, -0.15, 0, PI2); c.fill();
      c.fillStyle = "#ffd6a0"; c.beginPath(); c.ellipse(-w * 0.38, -h * 0.71, w * 0.08, h * 0.05, 0, 0, PI2); c.fill();
      c.strokeStyle = "#ff9f1c"; c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(-w * 0.15, -h * 0.82); c.quadraticCurveTo(w * 0.1, -h * 0.98, w * 0.28, -h * 0.86); c.stroke();
      c.fillStyle = "#fff4dc"; c.beginPath(); c.ellipse(w * 0.02, -h * 0.38, w * 0.12, h * 0.12, -0.3, 0, PI2); c.fill();
      c.strokeStyle = "#c86a9a"; c.lineWidth = 3; c.beginPath(); c.moveTo(-w * 0.08, -h * 0.5); c.lineTo(-w * 0.22, -h * 0.42); c.stroke();
      this.mat(-w * 0.22, -h * 0.77, 2.6, true);
    },
    khungLongCon(w, h, t, o) { // khủng long con vừa nở, đội nửa vỏ trứng, chạy lon ton
      const c = this.c, nhun = o.dangDi ? Math.abs(Math.sin(t * 12)) * 3 : 0, buoc = o.dangDi ? Math.sin(t * 12) : 0;
      c.save(); c.translate(0, -nhun);
      c.fillStyle = "#ff9f1c";
      c.beginPath(); c.roundRect(-w * 0.08 + buoc * 4, -h * 0.3, 8, h * 0.3 + nhun, 4); c.roundRect(w * 0.12 - buoc * 4, -h * 0.3, 8, h * 0.3 + nhun, 4); c.fill();
      c.fillStyle = "#ffb03b"; c.beginPath(); c.moveTo(w * 0.2, -h * 0.4); c.quadraticCurveTo(w * 0.5, -h * 0.4, w / 2, -h * 0.25); c.lineTo(w * 0.2, -h * 0.28); c.fill();
      c.beginPath(); c.ellipse(w * 0.04, -h * 0.4, w * 0.24, h * 0.2, 0, 0, PI2); c.fill();
      c.beginPath(); c.arc(-w * 0.18, -h * 0.62, h * 0.25, 0, PI2); c.fill();
      c.fillStyle = "#fff4dc"; c.strokeStyle = "#c8a878"; c.lineWidth = 1.5; // vỏ trứng
      c.beginPath(); c.moveTo(-w * 0.18 - h * 0.27, -h * 0.72); c.lineTo(-w * 0.28, -h * 0.8); c.lineTo(-w * 0.22, -h * 0.74); c.lineTo(-w * 0.14, -h * 0.82); c.lineTo(-w * 0.08, -h * 0.74); c.lineTo(-w * 0.18 + h * 0.27, -h * 0.72);
      c.arc(-w * 0.18, -h * 0.72, h * 0.27, 0, Math.PI, true); c.fill(); c.stroke();
      c.fillStyle = "#5fae5a"; c.beginPath(); c.arc(-w * 0.12, -h * 0.94, 3, 0, PI2); c.fill();
      this.mat(-w * 0.24, -h * 0.6, 3, true);
      c.strokeStyle = "#2B2640"; c.lineWidth = 1.5; c.beginPath(); c.arc(-w * 0.28, -h * 0.5, 4, 0.2, Math.PI - 0.2); c.stroke();
      c.restore();
    },
    khungLongVuot(w, h, t, o) { // khủng long vuốt: thân thon, chạy nhanh, lông đuôi, móng cong
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 15) : 0;
      c.strokeStyle = "#8a4a1e"; c.lineWidth = 5; c.lineCap = "round";
      c.beginPath(); c.moveTo(0, -h * 0.4); c.lineTo(-6 + buoc * 8, -h * 0.15); c.lineTo(-2 + buoc * 10, -2); c.moveTo(w * 0.08, -h * 0.4); c.lineTo(w * 0.08 - buoc * 8, -h * 0.15); c.lineTo(w * 0.1 - buoc * 10, -2); c.stroke();
      c.fillStyle = "#d8843a"; c.beginPath(); c.moveTo(w * 0.15, -h * 0.55); c.lineTo(w / 2, -h * 0.7 + buoc * 3); c.lineTo(w * 0.14, -h * 0.4); c.fill();
      c.fillStyle = "#3f7fd0"; c.beginPath(); c.moveTo(w * 0.38, -h * 0.66); c.lineTo(w / 2 + 6, -h * 0.82); c.lineTo(w / 2, -h * 0.66); c.fill(); // lông đuôi
      c.fillStyle = "#d8843a"; c.beginPath(); c.ellipse(w * 0.02, -h * 0.5, w * 0.2, h * 0.16, -0.15, 0, PI2); c.fill();
      c.beginPath(); c.moveTo(-w * 0.12, -h * 0.55); c.lineTo(-w * 0.22, -h * 0.82); c.lineTo(-w * 0.12, -h * 0.85); c.lineTo(-w * 0.02, -h * 0.55); c.fill();
      c.beginPath(); c.ellipse(-w * 0.27, -h * 0.84, w * 0.17, h * 0.12, -0.1, 0, PI2); c.fill();
      c.fillStyle = "#3f7fd0"; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-w * 0.14 + k * 4, -h * 0.92 + k * 4); c.lineTo(-w * 0.06 + k * 4, -h * 1.0 + k * 4); c.lineTo(-w * 0.06 + k * 4, -h * 0.88 + k * 4); c.fill(); }
      c.strokeStyle = "#8a4a1e"; c.lineWidth = 3; c.beginPath(); c.moveTo(-w * 0.12, -h * 0.55); c.lineTo(-w * 0.24, -h * 0.48); c.stroke();
      c.fillStyle = "#fff"; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-w * 0.4 + k * 5, -h * 0.79); c.lineTo(-w * 0.38 + k * 5, -h * 0.74); c.lineTo(-w * 0.36 + k * 5, -h * 0.79); c.fill(); }
      this.mat(-w * 0.28, -h * 0.88, 2.5, true);
    },
    khungLongBaoChua(w, h, t, o) { // khủng long bạo chúa: đầu to, răng trắng, tay ngắn tí, đi rầm rập
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 5) : 0, ha = (Math.sin(t * 3) + 1) * 0.06;
      c.fillStyle = "#3f8a4a";
      c.beginPath(); c.roundRect(-w * 0.12 + buoc * 6, -h * 0.32, w * 0.2, h * 0.32, 8); c.roundRect(w * 0.14 - buoc * 6, -h * 0.32, w * 0.2, h * 0.32, 8); c.fill();
      c.fillStyle = "#4fa85a"; c.beginPath(); c.moveTo(w * 0.2, -h * 0.5); c.quadraticCurveTo(w * 0.55, -h * 0.35, w / 2, -h * 0.1); c.quadraticCurveTo(w * 0.35, -h * 0.25, w * 0.15, -h * 0.3); c.fill();
      c.beginPath(); c.ellipse(w * 0.08, -h * 0.5, w * 0.32, h * 0.24, -0.4, 0, PI2); c.fill();
      c.beginPath(); c.moveTo(-w * 0.1, -h * 0.62); c.lineTo(-w * 0.15, -h * 0.82); c.lineTo(w * 0.15, -h * 0.82); c.lineTo(w * 0.1, -h * 0.6); c.fill();
      c.fillStyle = "#e8d080"; c.beginPath(); c.ellipse(0, -h * 0.48, w * 0.16, h * 0.18, -0.4, 0, PI2); c.fill();
      c.fillStyle = "#4fa85a"; c.beginPath(); c.roundRect(-w * 0.5, -h + 4, w * 0.62, h * 0.18, 14); c.fill(); // đầu trên
      c.save(); c.translate(-w * 0.0, -h * 0.82); c.rotate(-ha);
      c.beginPath(); c.roundRect(-w * 0.48, 0, w * 0.5, h * 0.07, 8); c.fill(); c.restore(); // hàm dưới
      c.fillStyle = "#fff";
      for (let k = 0; k < 6; k++) { const xx = -w * 0.46 + k * w * 0.07; c.beginPath(); c.moveTo(xx, -h * 0.83); c.lineTo(xx + 3, -h * 0.79); c.lineTo(xx + 6, -h * 0.83); c.fill(); }
      c.fillStyle = "#c2185b"; c.beginPath(); c.ellipse(-w * 0.25, -h * 0.82, w * 0.14, 3 + ha * 30, 0, 0, PI2); c.fill();
      c.strokeStyle = "#3f8a4a"; c.lineWidth = 5; c.lineCap = "round"; // tay ngắn
      c.beginPath(); c.moveTo(-w * 0.1, -h * 0.6); c.lineTo(-w * 0.2, -h * 0.56 + buoc * 3); c.moveTo(-w * 0.04, -h * 0.56); c.lineTo(-w * 0.14, -h * 0.5 - buoc * 3); c.stroke();
      c.fillStyle = "#3f8a4a"; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(w * 0.05 + k * 10, -h + 6 + k * 6); c.lineTo(w * 0.1 + k * 10, -h - 4 + k * 6); c.lineTo(w * 0.13 + k * 10, -h + 8 + k * 6); c.fill(); }
      this.mat(-w * 0.12, -h + 18, 5.5, true);
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.44, -h + 12, 2.2, 0, PI2); c.fill();
    },
    khungLongCoDai(w, h, t, o) { // khủng long cổ dài: thân to, cổ vươn cao, đầu nhỏ mỉm cười nhưng rất chắn đường
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 4) : 0, lac = Math.sin(t * 1.5) * 4;
      c.fillStyle = "#7a5ce0";
      [[-0.32, 1], [-0.12, -1], [0.14, 1], [0.32, -1]].forEach(([a, s]) => { c.beginPath(); c.roundRect(a * w - 7 + s * buoc * 3, -h * 0.25, 14, h * 0.25, 5); c.fill(); });
      c.fillStyle = "#9b7cf0"; c.beginPath(); c.moveTo(w * 0.3, -h * 0.35); c.quadraticCurveTo(w * 0.6, -h * 0.3, w * 0.55, -h * 0.12); c.quadraticCurveTo(w * 0.42, -h * 0.2, w * 0.3, -h * 0.22); c.fill();
      c.beginPath(); c.ellipse(0, -h * 0.34, w * 0.42, h * 0.16, 0, 0, PI2); c.fill();
      c.lineWidth = w * 0.18; c.strokeStyle = "#9b7cf0"; c.lineCap = "round";
      c.beginPath(); c.moveTo(-w * 0.22, -h * 0.4); c.quadraticCurveTo(-w * 0.3, -h * 0.7, -w * 0.2 + lac, -h * 0.9); c.stroke();
      c.fillStyle = "#9b7cf0"; c.beginPath(); c.ellipse(-w * 0.28 + lac, -h * 0.92, w * 0.2, h * 0.06, -0.1, 0, PI2); c.fill();
      c.fillStyle = "#c8b8ff"; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(-w * 0.1 + k * w * 0.12, -h * 0.4, 5, 0, PI2); c.fill(); }
      c.fillStyle = "#c8b8ff"; c.beginPath(); c.ellipse(0, -h * 0.28, w * 0.28, h * 0.06, 0, 0, PI2); c.fill();
      this.mat(-w * 0.3 + lac, -h * 0.94, 3.2, true);
      c.strokeStyle = "#2B2640"; c.lineWidth = 1.6; c.beginPath(); c.arc(-w * 0.38 + lac, -h * 0.9, 4, 0.2, Math.PI - 0.4); c.stroke();
    },
    thanLanBay(w, h, t) { // thằn lằn bay: cánh da cam, mào nhọn sau đầu, mỏ dài
      const c = this.c, vo = Math.sin(t * 9), cy = -h * 0.5;
      c.fillStyle = "#e8743a";
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(-4, cy); c.quadraticCurveTo(s * w * 0.2, cy - 14 - vo * 16, s * w * 0.5, cy - 6 - vo * 14); c.quadraticCurveTo(s * w * 0.25, cy + 6, 6, cy + 6); c.fill(); });
      c.fillStyle = "#c2551e"; c.beginPath(); c.ellipse(0, cy + 2, 10, 7, 0, 0, PI2); c.fill();
      c.fillStyle = "#e8743a"; c.beginPath(); c.arc(-w * 0.22, cy - 6, 7, 0, PI2); c.fill();
      c.beginPath(); c.moveTo(-w * 0.2, cy - 10); c.lineTo(-w * 0.02, cy - 16); c.lineTo(-w * 0.16, cy - 4); c.fill(); // mào
      c.fillStyle = "#ffd23f"; c.beginPath(); c.moveTo(-w * 0.27, cy - 8); c.lineTo(-w * 0.55, cy - 3); c.lineTo(-w * 0.27, cy - 2); c.fill(); // mỏ
      this.mat(-w * 0.22, cy - 7, 2.4, true);
    },
    chuonChuonKhong(w, h, t) { // chuồn chuồn khổng lồ: bốn cánh trong, thân dài xanh ngọc
      const c = this.c, vo = Math.sin(t * 40), cy = -h * 0.55;
      c.fillStyle = "rgba(220,245,255,0.75)"; c.strokeStyle = "rgba(80,140,180,0.6)"; c.lineWidth = 1;
      [[-4, -1], [6, -1], [-4, 1], [6, 1]].forEach(([dx, s]) => { c.beginPath(); c.ellipse(dx, cy + s * 9, 22, 6, s * (0.3 + vo * 0.25), 0, PI2); c.fill(); c.stroke(); });
      c.fillStyle = "#1fa8a0"; c.beginPath(); c.roundRect(0, cy - 3, w / 2, 6, 3); c.fill();
      c.fillStyle = "#147a74"; for (let k = 1; k < 5; k++) c.fillRect(k * w * 0.1, cy - 3, 2, 6);
      c.fillStyle = "#2fc8bf"; c.beginPath(); c.ellipse(-4, cy, 8, 6, 0, 0, PI2); c.fill();
      c.beginPath(); c.arc(-w * 0.26, cy - 1, 7, 0, PI2); c.fill();
      c.fillStyle = "#7a2ad0"; c.beginPath(); c.arc(-w * 0.3, cy - 4, 4, 0, PI2); c.arc(-w * 0.22, cy - 5, 4, 0, PI2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(-w * 0.31, cy - 5, 1.3, 0, PI2); c.arc(-w * 0.23, cy - 6, 1.3, 0, PI2); c.fill();
    },
    chimThuyTo(w, h, t) { // chim thủy tổ: lông xanh đỏ, đuôi dài nhiều lông, mỏ có răng
      const c = this.c, vo = Math.sin(t * 14), cy = -h * 0.5;
      c.fillStyle = "#3f7fd0"; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(w * 0.3 + k * 4, cy + 2 + k * 2, w * 0.18, 4, 0.2 + k * 0.08, 0, PI2); c.fill(); }
      c.fillStyle = "#e8344e"; c.beginPath(); c.ellipse(0, cy, w * 0.24, h * 0.24, 0, 0, PI2); c.fill();
      c.fillStyle = "#3f7fd0"; c.beginPath(); c.moveTo(-4, cy - 4); c.quadraticCurveTo(w * 0.15, cy - 22 - vo * 12, w * 0.35, cy - 16 - vo * 14); c.quadraticCurveTo(w * 0.18, cy - 2, 6, cy + 2); c.fill();
      c.fillStyle = "#ffd23f"; c.beginPath(); c.moveTo(w * 0.05, cy - 10 - vo * 6); c.lineTo(w * 0.3, cy - 16 - vo * 14); c.lineTo(w * 0.18, cy - 8 - vo * 7); c.fill();
      c.fillStyle = "#e8344e"; c.beginPath(); c.arc(-w * 0.26, cy - 8, 8, 0, PI2); c.fill();
      c.fillStyle = "#3f7fd0"; c.beginPath(); c.moveTo(-w * 0.22, cy - 15); c.lineTo(-w * 0.1, cy - 22); c.lineTo(-w * 0.16, cy - 12); c.fill();
      c.fillStyle = "#e8b04a"; c.beginPath(); c.moveTo(-w * 0.34, cy - 10); c.lineTo(-w * 0.52, cy - 6); c.lineTo(-w * 0.34, cy - 3); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-w * 0.44, cy - 7); c.lineTo(-w * 0.42, cy - 4); c.lineTo(-w * 0.4, cy - 7); c.fill();
      this.mat(-w * 0.27, cy - 10, 2.4, true);
    },
    boCanhCung(w, h, t) { // bọ cánh cứng: vỏ cánh đỏ chấm đen mở ra, cánh mỏng vỗ nhanh, sừng
      const c = this.c, vo = Math.sin(t * 36), cy = -h * 0.5;
      c.fillStyle = "rgba(230,240,255,0.7)"; c.beginPath(); c.ellipse(w * 0.12, cy - 12, 18, 6, -0.6 + vo * 0.3, 0, PI2); c.ellipse(w * 0.2, cy - 10, 16, 5, -0.2 - vo * 0.3, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.ellipse(w * 0.05, cy + 2, w * 0.3, h * 0.28, 0, 0, PI2); c.fill();
      c.fillStyle = "#e8344e"; c.beginPath(); c.ellipse(w * 0.14, cy - 4, w * 0.24, h * 0.16, -0.5, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; [[0.08, -6], [0.2, -10], [0.18, 0]].forEach(([a, b]) => { c.beginPath(); c.arc(a * w, cy + b, 3, 0, PI2); c.fill(); });
      c.fillStyle = "#3a3a4a"; c.beginPath(); c.arc(-w * 0.26, cy + 2, 8, 0, PI2); c.fill();
      c.strokeStyle = "#3a3a4a"; c.lineWidth = 3; c.beginPath(); c.moveTo(-w * 0.32, cy - 4); c.quadraticCurveTo(-w * 0.45, cy - 12, -w * 0.42, cy - 18); c.stroke();
      c.lineWidth = 2; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-w * 0.05 + k * 8, cy + h * 0.24); c.lineTo(-w * 0.1 + k * 9, cy + h * 0.44); c.stroke(); }
      this.mat(-w * 0.28, cy, 2.4, true);
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
