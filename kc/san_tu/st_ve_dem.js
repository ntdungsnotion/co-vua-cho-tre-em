/* ================================================================
   FILE: san_tu/st_ve_dem.js
   CHỨC NĂNG: HÌNH VẼ đường đua 9 "Lâu đài đêm trăng" (game Giải Cứu Mèo Con).
              Cảnh: đêm xanh tím, trăng tròn to, sao lấp lánh, đồi có lâu đài xa, cây trụi lá, sương mờ;
              đường đá lát; hầm tối; hầm kho báu (nến, vàng); lâu đài ma ở màn 7; bé khoác áo choàng
              tím. 19 quái / vật cản dễ thương (ma trắng, bí ngô cười...), màu sáng nổi trên nền tối.
              Quy ước giống st_ve_keo.js: gốc tọa độ giữa đáy vật, mặt quay sang TRÁI, "this" là BoVe.
   BƯỚC: TC_00F
   CẬP NHẬT: 16/10/2026 - TC_00G: đồ của bé gắn theo khung xương mới (st_ve_be.js).
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST;
  const { PI2, tronMau, bam, chiaDuong, moiBuoc } = ST.VE_CHUNG;

  ST.CHU_DE_VE = ST.CHU_DE_VE || {};
  ST.CHU_DE_VE.dem = {
    cong: { soc: "#9b5de5", nut: "#ffd23f" },
    mauGoHang: ["#4a3a6a", "#a898d8"],
    phuongTien: {
      sau(tt) { // áo choàng tím bay phía sau lưng
        const c = this.c, bay = Math.sin(tt.t * (tt.dangChay ? 12 : 4)) * 3, xa = tt.dangChay || tt.nhay ? 1 : 0.4;
        ST.VE_CHUNG.theoThan(c, tt.k, () => {
          c.fillStyle = "#7a3ad0";
          c.beginPath(); c.moveTo(3, 2); c.quadraticCurveTo(-6 - 6 * xa, 14, -12 - 12 * xa, 32 + bay); c.lineTo(-20 - 12 * xa, 27 - bay); c.quadraticCurveTo(-14 - 4 * xa, 12, -6, 1); c.closePath(); c.fill();
          c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(-12 - 9 * xa, 22 + bay * 0.5, 2.2, 0, PI2); c.arc(-7 - 4 * xa, 12, 1.8, 0, PI2); c.fill();
        });
      },
      truoc(tt) { // cổ áo choàng có khuy sao
        const c = this.c;
        ST.VE_CHUNG.theoThan(c, tt.k, () => {
          c.fillStyle = "#7a3ad0"; c.beginPath(); c.roundRect(-7, 0, 14, 5, 2.5); c.fill();
          this.veSao(1, 2.5, 3.6, "#ffd23f", 0);
        });
      }
    },

    nen(camX, p) {
      const c = this.c, W = this.rong, H = this.cao, dat = this.dat, t = this.t;
      const s = Math.max(0, (p - 0.45) / 0.55);
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, tronMau("#1a1a4a", "#24104a", s));
      gr.addColorStop(1, tronMau("#4a4a9a", "#6a3a8a", s));
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 50; i++) { // sao
        const x = ((bam(i) * W * 1.4 - camX * 0.02) % W + W) % W, y = bam(i + 60) * dat * 0.7, sang = 0.5 + Math.sin(t * 2 + i) * 0.4;
        c.fillStyle = `rgba(255,250,220,${sang})`; c.beginPath(); c.arc(x, y, 1 + bam(i + 4) * 1.5, 0, PI2); c.fill();
      }
      // trăng tròn
      const tx = W * 0.75 - p * W * 0.1, ty = 90;
      c.fillStyle = "rgba(255,250,210,0.18)"; c.beginPath(); c.arc(tx, ty, 80, 0, PI2); c.fill();
      c.fillStyle = "#fff8d8"; c.beginPath(); c.arc(tx, ty, 50, 0, PI2); c.fill();
      c.fillStyle = "rgba(220,210,170,0.6)"; [[-14, -10, 9], [16, 8, 7], [-4, 18, 5], [20, -16, 4]].forEach(([a, b, r]) => { c.beginPath(); c.arc(tx + a, ty + b, r, 0, PI2); c.fill(); });
      // dơi bay ngang trăng
      c.fillStyle = "#1a1030";
      for (let k = 0; k < 3; k++) { const x = ((t * 40 + k * 90) % (W + 200)) - 100, y = ty - 30 + k * 20 + Math.sin(t * 3 + k) * 8, vo = Math.sin(t * 14 + k) * 5; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 10, y - 5 - vo); c.lineTo(x - 5, y + 2); c.lineTo(x, y + 4); c.lineTo(x + 5, y + 2); c.lineTo(x + 10, y - 5 - vo); c.fill(); }
      // đồi và lâu đài xa
      this.veLop(camX, 0.15, 560, dat, (x, y, i) => {
        const cx = x + 280, r = 160 + bam(i) * 80;
        c.fillStyle = "#2a2a5a"; c.beginPath(); c.ellipse(cx, dat, r * 1.4, r * 0.6, 0, Math.PI, PI2); c.fill();
        if (bam(i + 3) < 0.5) return;
        const dy = dat - r * 0.58;
        c.fillRect(cx - 50, dy - 60, 100, 60);
        [-50, 0, 50].forEach((dx, k) => { const cao = k === 1 ? 110 : 85; c.fillRect(cx + dx - 12, dy - cao, 24, cao); c.beginPath(); c.moveTo(cx + dx - 16, dy - cao); c.lineTo(cx + dx, dy - cao - 30); c.lineTo(cx + dx + 16, dy - cao); c.fill(); });
        c.fillStyle = "#ffd23f"; [[-50, -60], [0, -80], [50, -60], [-20, -30], [20, -30]].forEach(([a, b]) => c.fillRect(cx + a - 3, dy + b, 6, 9));
        c.fillStyle = "#2a2a5a";
      });
      if (p > 0.45) {
        const a = Math.min(1, (p - 0.45) / 0.15), x = W + 60 - (p - 0.45) / 0.55 * W * 0.35;
        c.globalAlpha = 0.7 * a; ST.CHU_DE_VE.dem.bongLauDai.call(this, x, dat - 60, 0.45); c.globalAlpha = 1;
      }
      // cây trụi lá
      this.veLop(camX, 0.45, 260, dat, (x, y, i) => {
        if (bam(i + 5) < 0.4) return;
        const xx = x + 80 + bam(i) * 80, k = 0.8 + bam(i + 1) * 0.6;
        c.strokeStyle = "#1e1838"; c.lineCap = "round";
        c.lineWidth = 10 * k; c.beginPath(); c.moveTo(xx, dat); c.lineTo(xx + 4 * k, dat - 90 * k); c.stroke();
        c.lineWidth = 5 * k; c.beginPath(); c.moveTo(xx + 2 * k, dat - 50 * k); c.quadraticCurveTo(xx - 20 * k, dat - 70 * k, xx - 34 * k, dat - 100 * k);
        c.moveTo(xx + 4 * k, dat - 70 * k); c.quadraticCurveTo(xx + 26 * k, dat - 90 * k, xx + 30 * k, dat - 120 * k); c.moveTo(xx + 4 * k, dat - 90 * k); c.lineTo(xx, dat - 124 * k); c.stroke();
      });
      // sương mờ
      c.fillStyle = "rgba(200,190,255,0.12)";
      for (let k = 0; k < 4; k++) { const x = ((k * 400 - camX * 0.5 - t * 10) % (W + 400) + W + 400) % (W + 400) - 200; c.beginPath(); c.ellipse(x, dat - 10, 220, 26, 0, 0, PI2); c.fill(); }
    },

    dat(camX, ds, doDai) {
      const c = this.c, y = this.dat, H = this.cao, t = this.t;
      const { ho, doan } = chiaDuong(this, camX, ds);
      ho.forEach(([a, b]) => { // hầm tối, hai đốm mắt chớp chớp dễ thương
        const gr = c.createLinearGradient(0, y, 0, H);
        gr.addColorStop(0, "#2a1e4a"); gr.addColorStop(1, "#08041a");
        c.fillStyle = gr; c.fillRect(a, y + 4, b - a, H - y);
        if (Math.sin(t * 1.3 + a * 0.01) > -0.8) { c.fillStyle = "#ffd23f"; const cx = (a + b) / 2; c.beginPath(); c.ellipse(cx - 7, y + 40, 3, 4, 0, 0, PI2); c.ellipse(cx + 7, y + 40, 3, 4, 0, 0, PI2); c.fill(); }
      });
      doan.forEach(([a, b]) => {
        c.fillStyle = "#3a3a5e"; c.fillRect(a, y + 10, b - a, H - y);
        c.save(); c.beginPath(); c.rect(a, y + 10, b - a, H - y); c.clip();
        c.strokeStyle = "rgba(0,0,0,0.3)"; c.lineWidth = 2;
        for (let r = 0; r < 4; r++) {
          const yy = y + 12 + r * 18; c.beginPath(); c.moveTo(a, yy); c.lineTo(b, yy); c.stroke();
          moiBuoc(camX + (r % 2) * 22, a, b, 44, (i, x) => { c.beginPath(); c.moveTo(x, yy); c.lineTo(x, yy + 18); c.stroke(); });
        }
        c.restore();
        c.fillStyle = "#6a6a92"; c.beginPath(); c.roundRect(a - 2, y - 3, b - a + 4, 14, 5); c.fill();
        c.strokeStyle = "rgba(0,0,0,0.25)"; c.lineWidth = 1.5;
        moiBuoc(camX, a, b, 30, (i, x) => { if (x < a + 4 || x > b - 4) return; c.beginPath(); c.moveTo(x, y - 3); c.lineTo(x, y + 11); c.stroke(); });
        c.fillStyle = "#4a7a5a";
        moiBuoc(camX, a, b, 70, (i, x) => { if (bam(i) < 0.5 || x < a + 8 || x > b - 8) return; c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x - 2, y - 7); c.lineTo(x, y); c.lineTo(x + 3, y - 8); c.lineTo(x + 5, y); c.fill(); });
        moiBuoc(camX, a, b, 130, (i, x) => { // nấm phát sáng nhỏ
          if (bam(i * 3) > 0.35 || x < a + 8 || x > b - 8 || x > doDai - camX + 40) return;
          c.fillStyle = "rgba(120,255,200,0.3)"; c.beginPath(); c.arc(x, y - 4, 8, 0, PI2); c.fill();
          c.fillStyle = "#7affd0"; c.beginPath(); c.ellipse(x, y - 5, 5, 3.5, 0, Math.PI, PI2); c.fill(); c.fillStyle = "#e8f8f0"; c.fillRect(x - 1, y - 5, 2, 5);
        });
      });
    },
    mieng(x, w) { // mép đá lát
      const c = this.c, y = this.dat;
      c.fillStyle = "#6a6a92";
      for (const ex of [x, x + w]) { c.beginPath(); c.roundRect(ex - 6, y - 3, 12, 18, 3); c.fill(); }
    },

    nenHang(camX) { // hầm kho báu: tường đá tím, kệ nến, rương vàng, rèm đỏ
      const c = this.c, W = this.rong, Hc = this.cao, dat = this.dat, t = this.t;
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, "#1a1430"); gr.addColorStop(1, "#3a2a5a");
      c.fillStyle = gr; c.fillRect(0, 0, W, Hc);
      c.strokeStyle = "rgba(0,0,0,0.3)"; c.lineWidth = 2;
      for (let r = 0; r * 40 < dat; r++) { c.beginPath(); c.moveTo(0, r * 40); c.lineTo(W, r * 40); c.stroke(); moiBuoc(camX * 0.5 + (r % 2) * 35, 0, W, 70, (i, x) => { c.beginPath(); c.moveTo(x, r * 40); c.lineTo(x, r * 40 + 40); c.stroke(); }); }
      moiBuoc(camX * 0.6, -150, W + 150, 300, (i, x) => { // rèm đỏ có tua vàng
        c.fillStyle = "#a82a4a"; c.beginPath(); c.moveTo(x + 40, 0); c.quadraticCurveTo(x + 50, dat * 0.4, x + 30, dat * 0.6); c.lineTo(x + 70, dat * 0.6); c.quadraticCurveTo(x + 80, dat * 0.3, x + 100, 0); c.fill();
        c.fillStyle = "#ffd23f"; c.fillRect(x + 28, dat * 0.6, 44, 5);
      });
      moiBuoc(camX * 0.8, -60, W + 60, 180, (i, x) => { // chân nến ba ngọn
        const yt = Math.max(70, dat - 110);
        c.fillStyle = "#c8a840"; c.fillRect(x + 88, yt, 4, 30); c.fillRect(x + 72, yt, 36, 4);
        [76, 90, 104].forEach(dx => {
          c.fillStyle = "#fff4e0"; c.fillRect(x + dx - 3, yt - 18, 6, 18);
          const nhip = 1 + Math.sin(t * 10 + dx + i) * 0.15;
          c.fillStyle = "rgba(255,210,100,0.25)"; c.beginPath(); c.arc(x + dx, yt - 24, 14 * nhip, 0, PI2); c.fill();
          c.fillStyle = "#ffb03b"; c.beginPath(); c.ellipse(x + dx, yt - 24, 3, 6 * nhip, 0, 0, PI2); c.fill();
        });
      });
      c.fillStyle = "#4a3a6a"; c.fillRect(0, dat, W, Hc - dat);
      c.fillStyle = "#7a6aa0"; c.fillRect(0, dat, W, 8);
      moiBuoc(camX, -60, W + 60, 240, (i, x) => { if (bam(i) < 0.4) return; c.fillStyle = "#f2c230"; for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(x + 30 + (k % 3) * 11 + (k > 2 ? 6 : 0), dat - 4 - (k > 2 ? 7 : 0), 7, 3.5, 0, 0, PI2); c.fill(); } });
    },

    bongLauDai(x, y, k) {
      const c = this.c;
      c.fillStyle = "#3a2a6a";
      c.fillRect(x - 130 * k, y - 120 * k, 260 * k, 120 * k);
      [-140, -45, 45, 140].forEach((dx, i) => {
        const cao = (i === 1 || i === 2 ? 210 : 170) * k;
        c.fillRect(x + (dx - 20) * k, y - cao, 40 * k, cao);
        c.beginPath(); c.moveTo(x + (dx - 26) * k, y - cao); c.lineTo(x + dx * k, y - cao - 50 * k); c.lineTo(x + (dx + 26) * k, y - cao); c.fill();
      });
    },

    lauDai(g) { // lâu đài ma: tím, mái nhọn, cửa sổ vàng ấm, chú ma nhỏ ló ra vẫy tay, cổng gỗ mở khi thắng
      const c = this.c, t = this.t;
      const thap = (dx, rong, cao) => {
        c.fillStyle = "#5a4a8a"; c.fillRect(dx - rong / 2, -cao, rong, cao);
        c.fillStyle = "#3a2a6a"; c.beginPath(); c.moveTo(dx - rong / 2 - 8, -cao); c.lineTo(dx, -cao - rong * 1.5); c.lineTo(dx + rong / 2 + 8, -cao); c.fill();
        c.fillStyle = "#ffd23f"; c.beginPath(); c.roundRect(dx - 7, -cao + 22, 14, 20, [7, 7, 0, 0]); c.fill();
      };
      c.fillStyle = "#5a4a8a"; c.fillRect(-170, -130, 340, 130);
      for (let k = 0; k < 9; k++) c.fillRect(-170 + k * 40, -146, 22, 16);
      c.strokeStyle = "rgba(0,0,0,0.2)"; c.lineWidth = 2; for (let r = 1; r < 5; r++) { c.beginPath(); c.moveTo(-170, -r * 26); c.lineTo(170, -r * 26); c.stroke(); }
      thap(-185, 40, 190); thap(185, 40, 190); thap(-40, 48, 230);
      c.fillStyle = "#ff8a1a"; c.beginPath(); c.moveTo(-40, -302); c.lineTo(-40, -322); c.lineTo(-18, -314); c.fill();
      c.fillStyle = "#ffd23f"; [[30, -100], [80, -100], [130, -100]].forEach(([a, b]) => { c.beginPath(); c.roundRect(a - 8, b, 16, 22, [8, 8, 0, 0]); c.fill(); });
      // ma nhỏ ló ra từ tháp, vẫy tay
      const ly = -170 + Math.sin(t * 2) * 4;
      c.fillStyle = "#fff"; c.beginPath(); c.arc(185, ly, 14, Math.PI, PI2); c.lineTo(199, ly + 12); c.lineTo(171, ly + 12); c.fill();
      c.beginPath(); c.ellipse(201, ly - 2 + Math.sin(t * 6) * 3, 4, 7, 0.6, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(180, ly - 2, 2, 0, PI2); c.arc(190, ly - 2, 2, 0, PI2); c.fill();
      // bí ngô hai bên cửa
      [-140, -36].forEach(dx => veBiNgo(c, dx, 0, 26, 20, 0));
      // cổng gỗ
      c.fillStyle = "#1a1030"; c.beginPath(); c.roundRect(-120, -96, 64, 96, [32, 32, 0, 0]); c.fill();
      const mo = g.trangThai === "thang" ? Math.min(1, g.tKetThuc / 0.8) : 0;
      [[-120, 1], [-56, -1]].forEach(([x0, s]) => {
        c.save(); c.translate(x0, 0); c.scale(1 - mo * 0.8, 1);
        c.fillStyle = "#7a4a2a"; c.beginPath(); if (s > 0) c.roundRect(0, -96, 32, 96, [32, 0, 0, 0]); else c.roundRect(-32, -96, 32, 96, [0, 32, 0, 0]); c.fill();
        c.fillStyle = "#c8a840"; c.beginPath(); c.arc(s * 24, -48, 3, 0, PI2); c.fill();
        c.restore();
      });
      c.fillStyle = "#fff"; c.beginPath(); c.roundRect(-10, -184, 120, 30, 10); c.fill();
      c.strokeStyle = "#9b5de5"; c.lineWidth = 3; c.stroke();
      c.fillStyle = "#4a2a8a"; c.font = '800 18px "Baloo 2", "Be Vietnam Pro", system-ui, sans-serif'; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("Lâu Đài Ma", 50, -168);
    }
  };

  function veBiNgo(c, x, y, w, h, cuoi) { // quả bí ngô cam có mặt cười khắc
    c.fillStyle = "#ff8a1a";
    [-0.28, 0.28, 0].forEach(k => { c.beginPath(); c.ellipse(x + k * w, y - h * 0.48, w * 0.32, h * 0.48, 0, 0, PI2); c.fill(); });
    c.strokeStyle = "#d8640a"; c.lineWidth = 1.5; [-0.15, 0.15].forEach(k => { c.beginPath(); c.ellipse(x + k * w, y - h * 0.48, w * 0.12, h * 0.46, 0, 0, PI2); c.stroke(); });
    c.fillStyle = "#4a7a2a"; c.fillRect(x - 2, y - h - 5, 5, 7);
    c.fillStyle = "#ffe27a";
    c.beginPath(); c.moveTo(x - w * 0.28, y - h * 0.62); c.lineTo(x - w * 0.18, y - h * 0.78); c.lineTo(x - w * 0.08, y - h * 0.62); c.fill();
    c.beginPath(); c.moveTo(x + w * 0.04, y - h * 0.62); c.lineTo(x + w * 0.14, y - h * 0.78); c.lineTo(x + w * 0.24, y - h * 0.62); c.fill();
    c.beginPath(); c.moveTo(x - w * 0.3, y - h * 0.4); c.quadraticCurveTo(x, y - h * (0.1 - cuoi), x + w * 0.3, y - h * 0.4); c.quadraticCurveTo(x, y - h * 0.25, x - w * 0.3, y - h * 0.4); c.fill();
  }

  /* ================================================================
     QUÁI / VẬT CẢN LÂU ĐÀI ĐÊM TRĂNG (dễ thương, không đáng sợ)
     ================================================================ */
  ST.VE_QUAI = ST.VE_QUAI || {};
  Object.assign(ST.VE_QUAI, {
    biNgo(w, h, t) { // bí ngô cam cười, đèn bên trong nhấp nháy
      const c = this.c;
      c.fillStyle = `rgba(255,200,80,${0.2 + Math.sin(t * 5) * 0.08})`; c.beginPath(); c.arc(0, -h * 0.5, w * 0.7, 0, PI2); c.fill();
      veBiNgo(c, 0, 0, w, h, 0.05);
      c.strokeStyle = "#4a7a2a"; c.lineWidth = 2; c.beginPath(); c.moveTo(2, -h - 2); c.quadraticCurveTo(12, -h - 8, 16, -h); c.stroke();
    },
    chongSach(w, h, t, o) { // chồng sách phép nhiều màu, cuốn trên cùng hé mở có sao bay
      const c = this.c, so = 4, d = h * 0.2, mau = ["#e8443a", "#3f7fd0", "#4fa84a", "#9b5de5", "#ff8a1a"];
      for (let k = 0; k < so; k++) {
        const lech = (k % 2 ? 4 : -3) + ((o.bienThe || 0) - 1) * 2, rw = w * (0.95 - k * 0.07);
        c.fillStyle = mau[(k + (o.bienThe || 0)) % 5]; c.beginPath(); c.roundRect(-rw / 2 + lech, -(k + 1) * d, rw, d - 1, 3); c.fill();
        c.fillStyle = "#fff4e0"; c.fillRect(-rw / 2 + lech + rw - 6, -(k + 1) * d + 3, 4, d - 7);
        c.fillStyle = "#ffd23f"; c.fillRect(-rw / 2 + lech + 6, -(k + 1) * d + d * 0.4, rw * 0.3, 2);
      }
      const yb = -so * d;
      c.fillStyle = "#fff4e0"; c.beginPath(); c.moveTo(-w * 0.35, yb); c.quadraticCurveTo(-w * 0.15, yb - h * 0.22, 0, yb - 2); c.quadraticCurveTo(w * 0.15, yb - h * 0.22, w * 0.35, yb); c.fill();
      for (let k = 0; k < 3; k++) { const u = (t * 0.8 + k / 3) % 1; this.veSao(Math.sin(k * 2 + u * 4) * 8, yb - 6 - u * 24, 3.5 * (1 - u) + 1, "#ffd23f", t); }
    },
    nenChay(w, h, t) { // chân nến đồng ba nhánh, nến cháy lung linh
      const c = this.c;
      c.fillStyle = "#c8a840"; c.beginPath(); c.ellipse(0, -3, w * 0.3, 4, 0, 0, PI2); c.fill();
      c.fillRect(-2.5, -h * 0.6, 5, h * 0.58);
      c.strokeStyle = "#c8a840"; c.lineWidth = 4; c.beginPath(); c.moveTo(-w * 0.36, -h * 0.66); c.quadraticCurveTo(-w * 0.36, -h * 0.45, 0, -h * 0.45); c.quadraticCurveTo(w * 0.36, -h * 0.45, w * 0.36, -h * 0.66); c.stroke();
      [-w * 0.36, 0, w * 0.36].forEach((dx, i) => {
        const day = i === 1 ? -h * 0.62 : -h * 0.66;
        c.fillStyle = "#fff4e0"; c.fillRect(dx - 4, day - h * 0.22, 8, h * 0.22);
        const nhip = 1 + Math.sin(t * 11 + i * 2) * 0.15, y = day - h * 0.22;
        c.fillStyle = "rgba(255,210,100,0.3)"; c.beginPath(); c.arc(dx, y - 6, 10 * nhip, 0, PI2); c.fill();
        c.fillStyle = "#ffb03b"; c.beginPath(); c.ellipse(dx, y - 6, 3.5, 7 * nhip, 0, 0, PI2); c.fill();
        c.fillStyle = "#fff6a0"; c.beginPath(); c.ellipse(dx, y - 4, 1.6, 3.5, 0, 0, PI2); c.fill();
      });
    },
    vacPhuThuy(w, h, t) { // vạc đen sủi bọt xanh lá
      const c = this.c, than = h * 0.78;
      c.strokeStyle = "#3a3a4a"; c.lineWidth = 4; c.beginPath(); c.moveTo(-w * 0.32, -2); c.lineTo(-w * 0.26, -than * 0.3); c.moveTo(w * 0.32, -2); c.lineTo(w * 0.26, -than * 0.3); c.stroke();
      c.fillStyle = "#4a4a5e"; c.beginPath(); c.ellipse(0, -than * 0.5, w / 2, than * 0.5, 0, 0, PI2); c.fill();
      c.fillStyle = "#6a6a82"; c.beginPath(); c.ellipse(0, -than * 0.95, w * 0.44, 6, 0, 0, PI2); c.fill();
      c.fillStyle = "#7ae84a"; c.beginPath(); c.ellipse(0, -than * 0.95, w * 0.38, 4, 0, 0, PI2); c.fill();
      for (let k = 0; k < 4; k++) { const u = (t * 0.9 + k / 4) % 1; c.fillStyle = `rgba(140,255,100,${1 - u})`; c.beginPath(); c.arc(-w * 0.2 + k * w * 0.14, -than - u * h * 0.35, 3 + u * 4, 0, PI2); c.fill(); }
      c.fillStyle = "rgba(255,255,255,0.2)"; c.beginPath(); c.ellipse(-w * 0.2, -than * 0.6, 5, 10, 0.4, 0, PI2); c.fill();
    },
    hangRaoSat(w, h) { // hàng rào sắt uốn có đầu mũi giáo vàng
      const c = this.c, so = Math.max(4, Math.round(w / 14)), b = w / so;
      c.strokeStyle = "#8a8aa8"; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-w / 2, -h * 0.75); c.lineTo(w / 2, -h * 0.75); c.moveTo(-w / 2, -h * 0.2); c.lineTo(w / 2, -h * 0.2); c.stroke();
      for (let i = 0; i <= so; i++) {
        const x = -w / 2 + i * b;
        c.strokeStyle = "#8a8aa8"; c.lineWidth = 3.5; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, -h + 8); c.stroke();
        c.fillStyle = "#ffd23f"; c.beginPath(); c.moveTo(x - 4, -h + 9); c.lineTo(x, -h); c.lineTo(x + 4, -h + 9); c.fill();
      }
      c.strokeStyle = "#a8a8c8"; c.lineWidth = 2;
      for (let i = 0; i < so; i++) { const x = -w / 2 + (i + 0.5) * b; c.beginPath(); c.arc(x, -h * 0.47, b * 0.3, 0, PI2); c.stroke(); }
    },
    gieng(w, h, t) { // giếng đá có mái gỗ nhỏ và gầu
      const c = this.c, than = h * 0.55;
      c.fillStyle = "#8a8aa8"; c.beginPath(); c.roundRect(-w * 0.4, -than, w * 0.8, than, 4); c.fill();
      c.strokeStyle = "#5a5a78"; c.lineWidth = 1.6;
      for (let r = 1; r < 3; r++) { c.beginPath(); c.moveTo(-w * 0.4, -than * r / 3); c.lineTo(w * 0.4, -than * r / 3); c.stroke(); }
      for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(k * w * 0.2 + (k === 0 ? 0 : 6), -than); c.lineTo(k * w * 0.2 + (k === 0 ? 0 : 6), -than * 0.66); c.stroke(); }
      c.fillStyle = "#1a1030"; c.beginPath(); c.ellipse(0, -than, w * 0.38, 5, 0, 0, PI2); c.fill();
      c.fillStyle = "#6b4226"; c.fillRect(-w * 0.36, -h, 5, h - than); c.fillRect(w * 0.31, -h, 5, h - than);
      c.fillStyle = "#a82a4a"; c.beginPath(); c.moveTo(-w / 2, -h + 4); c.lineTo(0, -h - 10); c.lineTo(w / 2, -h + 4); c.fill();
      const lac = Math.sin(t * 2) * 3;
      c.strokeStyle = "#c8a878"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -h + 2); c.lineTo(lac, -than - 14); c.stroke();
      c.fillStyle = "#7a4a2a"; c.beginPath(); c.roundRect(lac - 6, -than - 16, 12, 9, 2); c.fill();
    },
    thapDongHo(w, h, t) { // tháp đồng hồ cao, mặt đồng hồ phát sáng, kim quay, quá cao để vượt
      const c = this.c, cy = -h + 52;
      c.fillStyle = "#6a5a9a"; c.fillRect(-w * 0.4, -h + 24, w * 0.8, h - 24);
      c.fillStyle = "#4a3a7a"; c.fillRect(w * 0.15, -h + 24, w * 0.25, h - 24);
      c.fillStyle = "#3a2a6a"; c.beginPath(); c.moveTo(-w / 2, -h + 26); c.lineTo(0, -h - 14); c.lineTo(w / 2, -h + 26); c.fill();
      c.fillStyle = "rgba(255,240,180,0.3)"; c.beginPath(); c.arc(0, cy, w * 0.36, 0, PI2); c.fill();
      c.fillStyle = "#fff8d8"; c.beginPath(); c.arc(0, cy, w * 0.28, 0, PI2); c.fill();
      c.strokeStyle = "#2B2640"; c.lineWidth = 2;
      for (let k = 0; k < 12; k++) { const g = k * PI2 / 12; c.beginPath(); c.moveTo(Math.cos(g) * w * 0.24, cy + Math.sin(g) * w * 0.24); c.lineTo(Math.cos(g) * w * 0.27, cy + Math.sin(g) * w * 0.27); c.stroke(); }
      c.lineWidth = 3; c.beginPath(); c.moveTo(0, cy); c.lineTo(Math.cos(t * 0.5) * w * 0.14, cy + Math.sin(t * 0.5) * w * 0.14); c.moveTo(0, cy); c.lineTo(Math.cos(t * 3) * w * 0.22, cy + Math.sin(t * 3) * w * 0.22); c.stroke();
      c.fillStyle = "#ffd23f"; for (let k = 0; k < 3; k++) { c.beginPath(); c.roundRect(-8, -h * (0.55 - k * 0.15), 16, 20, [8, 8, 0, 0]); c.fill(); }
      c.fillStyle = "#1a1030"; c.beginPath(); c.roundRect(-10, -26, 20, 26, [10, 10, 0, 0]); c.fill();
    },
    aoGiapHiepSi(w, h) { // tượng hiệp sĩ áo giáp bạc cầm khiên và giáo, quá cao để vượt
      const c = this.c;
      c.fillStyle = "#6a6a82"; c.beginPath(); c.roundRect(-w / 2, -h * 0.08, w, h * 0.08, 3); c.fill();
      c.fillStyle = "#c8c8d8";
      c.beginPath(); c.roundRect(-w * 0.22, -h * 0.4, w * 0.18, h * 0.32, 4); c.roundRect(w * 0.04, -h * 0.4, w * 0.18, h * 0.32, 4); c.fill();
      c.beginPath(); c.roundRect(-w * 0.28, -h * 0.72, w * 0.56, h * 0.34, 10); c.fill();
      c.beginPath(); c.roundRect(-w * 0.2, -h * 0.9, w * 0.4, h * 0.18, [14, 14, 4, 4]); c.fill();
      c.fillStyle = "#2B2640"; c.fillRect(-w * 0.14, -h * 0.84, w * 0.28, 4);
      c.fillStyle = "#e8443a"; c.beginPath(); c.moveTo(0, -h * 0.9); c.quadraticCurveTo(w * 0.3, -h, w * 0.2, -h * 0.82); c.quadraticCurveTo(w * 0.1, -h * 0.94, 0, -h * 0.9); c.fill();
      c.fillStyle = "#a8a8b8"; c.fillRect(-w * 0.04, -h * 0.72, w * 0.08, h * 0.34);
      c.strokeStyle = "#8a6a3a"; c.lineWidth = 4; c.beginPath(); c.moveTo(w * 0.34, -h * 0.08); c.lineTo(w * 0.34, -h + 4); c.stroke();
      c.fillStyle = "#c8c8d8"; c.beginPath(); c.moveTo(w * 0.28, -h + 14); c.lineTo(w * 0.34, -h - 2); c.lineTo(w * 0.4, -h + 14); c.fill();
      c.fillStyle = "#3f7fd0"; c.beginPath(); c.moveTo(-w * 0.48, -h * 0.66); c.lineTo(-w * 0.18, -h * 0.66); c.lineTo(-w * 0.18, -h * 0.46); c.quadraticCurveTo(-w * 0.33, -h * 0.36, -w * 0.48, -h * 0.46); c.closePath(); c.fill();
      c.fillStyle = "#ffd23f"; c.fillRect(-w * 0.35, -h * 0.64, 4, h * 0.2); c.fillRect(-w * 0.46, -h * 0.58, w * 0.26, 4);
    },
    nhenNho(w, h, t, o) { // nhện con tím lông xù, tám chân, mắt to tròn
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 14) : 0;
      c.strokeStyle = "#7a4ab8"; c.lineWidth = 3; c.lineCap = "round";
      for (let k = 0; k < 4; k++) [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * 6, -h * 0.45); c.lineTo(s * (w * 0.3 + k * 4), -h * 0.6 + k * 4 + (k % 2 ? buoc : -buoc) * 3); c.lineTo(s * (w * 0.36 + k * 4), -1); c.stroke(); });
      c.fillStyle = "#9b5de5"; c.beginPath(); c.arc(w * 0.08, -h * 0.5, h * 0.36, 0, PI2); c.fill();
      c.fillStyle = "#b88af0"; c.beginPath(); c.arc(-w * 0.14, -h * 0.42, h * 0.26, 0, PI2); c.fill();
      c.fillStyle = "#ff8ab8"; c.beginPath(); c.arc(w * 0.12, -h * 0.66, 4, 0, PI2); c.fill();
      this.mat(-w * 0.16, -h * 0.46, 3.4, false);
      c.strokeStyle = "#2B2640"; c.lineWidth = 1.5; c.beginPath(); c.arc(-w * 0.16, -h * 0.32, 3, 0.2, Math.PI - 0.2); c.stroke();
    },
    maNho(w, h, t, o) { veMa.call(this, w, h, t, o, false); },
    maKhongLo(w, h, t, o) { veMa.call(this, w, h, t, o, true); },
    boXuong(w, h, t, o) { // bộ xương vui nhộn đi nhún nhảy, đội mũ chóp nhỏ
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 10) : 0;
      c.strokeStyle = "#f4f0e8"; c.lineWidth = 4; c.lineCap = "round";
      c.beginPath(); c.moveTo(-4, -h * 0.35); c.lineTo(-6 + buoc * 5, -2); c.moveTo(4, -h * 0.35); c.lineTo(6 - buoc * 5, -2); c.stroke();
      c.beginPath(); c.moveTo(0, -h * 0.35); c.lineTo(0, -h * 0.66); c.stroke();
      c.lineWidth = 2.5; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-w * 0.18, -h * (0.42 + k * 0.08)); c.lineTo(w * 0.18, -h * (0.42 + k * 0.08)); c.stroke(); }
      c.lineWidth = 3.5; c.beginPath(); c.moveTo(-4, -h * 0.62); c.lineTo(-w * 0.4, -h * 0.75 + buoc * 6); c.moveTo(4, -h * 0.62); c.lineTo(w * 0.36, -h * 0.5 - buoc * 6); c.stroke();
      c.fillStyle = "#f4f0e8"; c.beginPath(); c.arc(0, -h * 0.8, h * 0.17, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-5, -h * 0.82, 3.5, 0, PI2); c.arc(5, -h * 0.82, 3.5, 0, PI2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(-4, -h * 0.83, 1.2, 0, PI2); c.arc(6, -h * 0.83, 1.2, 0, PI2); c.fill();
      c.strokeStyle = "#2B2640"; c.lineWidth = 1.5; c.beginPath(); c.arc(0, -h * 0.75, 4, 0.2, Math.PI - 0.2); c.stroke();
      c.fillStyle = "#9b5de5"; c.beginPath(); c.moveTo(-9, -h * 0.94); c.lineTo(2, -h - 8); c.lineTo(9, -h * 0.94); c.fill(); this.veSao(2, -h - 8, 3, "#ffd23f", 0);
    },
    chuotDem(w, h, t, o) { // chuột xám tai hồng chạy nhanh, đuôi dài
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 16) : 0;
      c.strokeStyle = "#e8a0b8"; c.lineWidth = 2; c.beginPath(); c.moveTo(w * 0.3, -h * 0.35); c.quadraticCurveTo(w * 0.5, -h * 0.8 + buoc * 3, w * 0.55, -h * 0.3); c.stroke();
      c.fillStyle = "#a8a8c0"; c.beginPath(); c.ellipse(w * 0.05, -h * 0.4, w * 0.28, h * 0.36, 0, 0, PI2); c.fill();
      c.fillStyle = "#e8a0b8"; c.beginPath(); c.ellipse(-w * 0.08 + buoc * 4, -3, 5, 3, 0, 0, PI2); c.ellipse(w * 0.16 - buoc * 4, -3, 5, 3, 0, 0, PI2); c.fill();
      c.fillStyle = "#a8a8c0"; c.beginPath(); c.moveTo(-w * 0.15, -h * 0.6); c.quadraticCurveTo(-w * 0.35, -h * 0.6, -w * 0.48, -h * 0.35); c.quadraticCurveTo(-w * 0.3, -h * 0.2, -w * 0.12, -h * 0.25); c.fill();
      c.beginPath(); c.arc(-w * 0.2, -h * 0.75, h * 0.2, 0, PI2); c.fill();
      c.fillStyle = "#ffb0c8"; c.beginPath(); c.arc(-w * 0.2, -h * 0.75, h * 0.12, 0, PI2); c.fill();
      c.fillStyle = "#ff8ab8"; c.beginPath(); c.arc(-w * 0.49, -h * 0.36, 3, 0, PI2); c.fill();
      this.mat(-w * 0.32, -h * 0.48, 2.4, true);
    },
    soiCon(w, h, t, o) { // sói con xám xanh lông xù, tru trăng nhỏ xíu
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 14) : 0;
      c.strokeStyle = "#7a8aa8"; c.lineWidth = 5; c.lineCap = "round";
      [[-0.2, 1], [-0.08, -1], [0.18, -1], [0.28, 1]].forEach(([a, s]) => { c.beginPath(); c.moveTo(a * w, -h * 0.4); c.lineTo(a * w + s * buoc * 6, -2); c.stroke(); });
      c.fillStyle = "#8a9ab8"; c.beginPath(); c.moveTo(w * 0.3, -h * 0.5); c.quadraticCurveTo(w * 0.55, -h * 0.75 + buoc * 4, w / 2, -h * 0.35); c.lineTo(w * 0.3, -h * 0.4); c.fill();
      c.beginPath(); c.ellipse(w * 0.05, -h * 0.48, w * 0.3, h * 0.2, 0, 0, PI2); c.fill();
      c.fillStyle = "#d8e0f0"; c.beginPath(); c.ellipse(-w * 0.12, -h * 0.4, w * 0.14, h * 0.14, 0, 0, PI2); c.fill();
      c.fillStyle = "#8a9ab8"; c.beginPath(); c.arc(-w * 0.26, -h * 0.68, h * 0.22, 0, PI2); c.fill();
      c.beginPath(); c.moveTo(-w * 0.34, -h * 0.82); c.lineTo(-w * 0.32, -h); c.lineTo(-w * 0.24, -h * 0.84); c.moveTo(-w * 0.2, -h * 0.84); c.lineTo(-w * 0.14, -h * 0.98); c.lineTo(-w * 0.1, -h * 0.78); c.fill();
      c.fillStyle = "#d8e0f0"; c.beginPath(); c.ellipse(-w * 0.42, -h * 0.62, w * 0.1, h * 0.08, 0, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.5, -h * 0.64, 2.5, 0, PI2); c.fill();
      this.mat(-w * 0.28, -h * 0.72, 2.6, true);
    },
    hiepSiMa(w, h, t, o) { // hiệp sĩ ma: áo giáp xanh mờ trôi bồng bềnh, mắt xanh lá, kiếm gỗ
      const c = this.c, troi = Math.sin(t * 2) * 5, buoc = o.dangDi ? Math.sin(t * 5) : 0;
      c.save(); c.translate(0, troi - 4);
      c.globalAlpha = 0.9;
      c.fillStyle = "rgba(150,230,220,0.25)"; c.beginPath(); c.ellipse(0, -h * 0.5, w * 0.6, h * 0.52, 0, 0, PI2); c.fill();
      c.fillStyle = "#9ad8d0";
      c.beginPath(); c.moveTo(-w * 0.3, -h * 0.35); c.lineTo(w * 0.3, -h * 0.35); c.lineTo(w * 0.2, -h * 0.08); c.lineTo(w * 0.08, -h * 0.14); c.lineTo(0, -h * 0.04); c.lineTo(-w * 0.08, -h * 0.14); c.lineTo(-w * 0.2, -h * 0.06); c.closePath(); c.fill();
      c.beginPath(); c.roundRect(-w * 0.32, -h * 0.72, w * 0.64, h * 0.4, 12); c.fill();
      c.beginPath(); c.roundRect(-w * 0.22, -h * 0.94, w * 0.44, h * 0.22, [16, 16, 6, 6]); c.fill();
      c.fillStyle = "#2a4a5a"; c.beginPath(); c.roundRect(-w * 0.16, -h * 0.87, w * 0.32, 10, 4); c.fill();
      c.fillStyle = "#7affa0"; c.beginPath(); c.arc(-w * 0.08, -h * 0.87 + 5, 3, 0, PI2); c.arc(w * 0.08, -h * 0.87 + 5, 3, 0, PI2); c.fill();
      c.fillStyle = "#5ab8b0"; c.beginPath(); c.moveTo(0, -h * 0.94); c.quadraticCurveTo(w * 0.3, -h - 8 + Math.sin(t * 4) * 3, w * 0.24, -h * 0.84); c.quadraticCurveTo(w * 0.12, -h * 0.96, 0, -h * 0.94); c.fill();
      c.strokeStyle = "#c8a878"; c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(-w * 0.3, -h * 0.5 + buoc * 4); c.lineTo(-w * 0.55, -h * 0.75 + buoc * 4); c.stroke();
      c.strokeStyle = "#8a6a3a"; c.lineWidth = 4; c.beginPath(); c.moveTo(-w * 0.36, -h * 0.5 + buoc * 4); c.lineTo(-w * 0.24, -h * 0.58 + buoc * 4); c.stroke();
      c.globalAlpha = 1;
      c.restore();
    },
    doiDem(w, h, t) { // dơi đêm tím nhỏ mặt ngộ nghĩnh, răng nanh tí xíu
      const c = this.c, vo = Math.sin(t * 18), cy = -h / 2;
      c.fillStyle = "#7a5ac8";
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * 6, cy); c.lineTo(s * w * 0.5, cy - 10 - vo * 10); c.lineTo(s * w * 0.42, cy + 4 - vo * 4); c.lineTo(s * w * 0.28, cy - 1 - vo * 5); c.lineTo(s * w * 0.18, cy + 8); c.closePath(); c.fill(); });
      c.fillStyle = "#9a7ae8"; c.beginPath(); c.ellipse(0, cy, 11, h * 0.4, 0, 0, PI2); c.fill();
      c.beginPath(); c.moveTo(-9, cy - 8); c.lineTo(-7, cy - h * 0.55); c.lineTo(-2, cy - 10); c.moveTo(9, cy - 8); c.lineTo(7, cy - h * 0.55); c.lineTo(2, cy - 10); c.fill();
      this.mat(-2, cy - 3, 3, false);
      c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-4, cy + 4); c.lineTo(-3, cy + 8); c.lineTo(-2, cy + 4); c.moveTo(1, cy + 4); c.lineTo(2, cy + 8); c.lineTo(3, cy + 4); c.fill();
    },
    cuMeo(w, h, t) { // cú mèo nâu mắt vàng to tròn, tai nhọn
      const c = this.c, vo = Math.sin(t * 9), cy = -h * 0.5;
      c.fillStyle = "#8a5a3a";
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * 8, cy - 4); c.quadraticCurveTo(s * w * 0.4, cy - 16 - vo * 12, s * w * 0.5, cy - 2 - vo * 10); c.quadraticCurveTo(s * w * 0.3, cy + 10, s * 8, cy + 8); c.fill(); });
      c.fillStyle = "#a8724a"; c.beginPath(); c.ellipse(0, cy + 2, w * 0.25, h * 0.44, 0, 0, PI2); c.fill();
      c.beginPath(); c.moveTo(-w * 0.22, cy - h * 0.3); c.lineTo(-w * 0.2, cy - h * 0.55); c.lineTo(-w * 0.08, cy - h * 0.36); c.moveTo(w * 0.22, cy - h * 0.3); c.lineTo(w * 0.2, cy - h * 0.55); c.lineTo(w * 0.08, cy - h * 0.36); c.fill();
      c.fillStyle = "#f4e0c0"; c.beginPath(); c.ellipse(0, cy + 8, w * 0.16, h * 0.24, 0, 0, PI2); c.fill();
      c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(-7, cy - 8, 6.5, 0, PI2); c.arc(7, cy - 8, 6.5, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-8, cy - 8, 3.2, 0, PI2); c.arc(6, cy - 8, 3.2, 0, PI2); c.fill();
      c.fillStyle = "#e8a800"; c.beginPath(); c.moveTo(-3, cy - 3); c.lineTo(0, cy + 3); c.lineTo(3, cy - 3); c.fill();
    },
    phuThuyChoi(w, h, t) { // phù thủy nhí áo cam cưỡi chổi, mũ nhọn tím, cười tinh nghịch
      const c = this.c, cy = -h * 0.35, lac = Math.sin(t * 4) * 2;
      c.strokeStyle = "#8a5a2a"; c.lineWidth = 4; c.beginPath(); c.moveTo(-w / 2, cy + lac); c.lineTo(w * 0.3, cy + 2 + lac); c.stroke();
      c.fillStyle = "#e8b84a"; c.beginPath(); c.moveTo(w * 0.28, cy + lac); c.lineTo(w / 2 + 4, cy - 10 + lac); c.lineTo(w / 2 + 6, cy + 12 + lac); c.closePath(); c.fill();
      c.fillStyle = "#ff8a1a"; c.beginPath(); c.moveTo(-w * 0.12, cy + lac); c.lineTo(w * 0.2, cy + lac); c.lineTo(w * 0.08, cy - h * 0.38 + lac); c.lineTo(-w * 0.04, cy - h * 0.38 + lac); c.fill();
      c.fillStyle = "#7ac85a"; c.beginPath(); c.arc(0, cy - h * 0.5 + lac, h * 0.17, 0, PI2); c.fill();
      c.fillStyle = "#7a3ad0"; c.beginPath(); c.ellipse(0, cy - h * 0.6 + lac, h * 0.26, 3.5, 0, 0, PI2); c.fill();
      c.beginPath(); c.moveTo(-h * 0.14, cy - h * 0.6 + lac); c.lineTo(h * 0.12, cy - h - 2 + lac); c.lineTo(h * 0.14, cy - h * 0.6 + lac); c.fill();
      c.fillStyle = "#ffd23f"; c.fillRect(-h * 0.12, cy - h * 0.66 + lac, h * 0.26, 3);
      c.fillStyle = "#ff8a1a"; c.beginPath(); c.arc(h * 0.15, cy - h * 0.5 + lac, 5, 0, PI2); c.fill();
      this.mat(-3, cy - h * 0.5 + lac, 2.3, true);
      c.strokeStyle = "#2B2640"; c.lineWidth = 1.3; c.beginPath(); c.arc(-3, cy - h * 0.44 + lac, 3, 0.2, Math.PI - 0.2); c.stroke();
    },
    maTroi(w, h, t) { // đốm ma trơi xanh ngọc lập lòe, có mặt cười
      const c = this.c, r = Math.min(w, h) * 0.32, cy = -h * 0.5, sang = 0.7 + Math.sin(t * 5) * 0.3;
      c.fillStyle = `rgba(120,255,220,${0.25 * sang})`; c.beginPath(); c.arc(0, cy, r * 1.8, 0, PI2); c.fill();
      c.fillStyle = `rgba(150,255,230,${0.9 * sang})`;
      c.beginPath(); c.arc(0, cy, r, 0, Math.PI); c.quadraticCurveTo(-r, cy - r * 1.4, 0, cy - r * 2.1 + Math.sin(t * 6) * 3); c.quadraticCurveTo(r, cy - r * 1.4, r, cy); c.fill();
      this.mat(-1, cy - 1, 2.6, false);
      c.strokeStyle = "#2a6a5a"; c.lineWidth = 1.5; c.beginPath(); c.arc(-1, cy + 3, 3, 0.2, Math.PI - 0.2); c.stroke();
    }
  });

  // Con ma (nhỏ / khổng lồ): trắng tròn trịa, vạt dưới lượn sóng, má hồng; ma khổng lồ đội vương miện
  function veMa(w, h, t, o, khongLo) {
    const c = this.c, troi = Math.sin(t * (khongLo ? 2 : 3)) * (khongLo ? 6 : 4), song = o.dangDi ? t * 6 : t * 2;
    c.save(); c.translate(0, troi - (khongLo ? 6 : 4));
    c.fillStyle = "rgba(220,220,255,0.25)"; c.beginPath(); c.ellipse(0, -h * 0.5, w * 0.6, h * 0.52, 0, 0, PI2); c.fill();
    c.fillStyle = "#fbfaff"; c.strokeStyle = "#b8b0e8"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-w / 2, -h * 0.55);
    c.arc(0, -h + w / 2, w / 2, Math.PI, PI2);
    c.lineTo(w / 2, -h * 0.08);
    const so = 4; for (let k = so; k > 0; k--) { const x1 = -w / 2 + (k - 0.5) * w / so, x0 = -w / 2 + (k - 1) * w / so; c.quadraticCurveTo(x1, -h * 0.08 + Math.sin(song + k) * 5 + 10, x0, -h * 0.08); }
    c.closePath(); c.fill(); c.stroke();
    const mr = khongLo ? 7 : 4, my = -h + w * 0.48;
    c.fillStyle = "#2B2640"; c.beginPath(); c.ellipse(-w * 0.16, my, mr * 0.8, mr, 0, 0, PI2); c.ellipse(w * 0.06, my, mr * 0.8, mr, 0, 0, PI2); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(-w * 0.16 + 1, my - mr * 0.4, mr * 0.3, 0, PI2); c.arc(w * 0.06 + 1, my - mr * 0.4, mr * 0.3, 0, PI2); c.fill();
    c.fillStyle = "rgba(255,140,180,0.55)"; c.beginPath(); c.arc(-w * 0.3, my + mr * 1.6, mr * 0.9, 0, PI2); c.arc(w * 0.2, my + mr * 1.6, mr * 0.9, 0, PI2); c.fill();
    c.fillStyle = "#2B2640"; c.beginPath(); c.ellipse(-w * 0.05, my + mr * 2.2, mr * 0.7, mr * (khongLo ? 1 : 0.8), 0, 0, PI2); c.fill();
    c.fillStyle = "#fbfaff"; c.strokeStyle = "#b8b0e8"; // hai tay giơ "hù"
    [[-1, 0.5], [1, 0.45]].forEach(([s, k]) => { c.beginPath(); c.ellipse(s * w * 0.5, -h * k, w * 0.12, h * 0.07, s * -0.6, 0, PI2); c.fill(); c.stroke(); });
    if (khongLo) {
      c.fillStyle = "#ffd23f"; c.beginPath(); c.moveTo(-w * 0.22, -h + 8); c.lineTo(-w * 0.22, -h - 12); c.lineTo(-w * 0.11, -h - 2); c.lineTo(0, -h - 16); c.lineTo(w * 0.11, -h - 2); c.lineTo(w * 0.22, -h - 12); c.lineTo(w * 0.22, -h + 8); c.fill();
      c.fillStyle = "#e8443a"; c.beginPath(); c.arc(0, -h - 2, 3, 0, PI2); c.fill();
    }
    c.restore();
  }
})(typeof window !== "undefined" ? window : globalThis);
