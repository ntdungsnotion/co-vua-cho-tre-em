/* ================================================================
   FILE: san_tu/st_ve_tuyet.js
   CHỨC NĂNG: HÌNH VẼ đường đua 4 "Núi tuyết" (game Giải Cứu Mèo Con).
              Cảnh: trời xanh băng, tuyết rơi, núi phủ tuyết, rừng thông; mặt đường tuyết trắng trên
              lớp băng; khe băng có nhũ băng; hang băng (pha lê, nhũ băng); lâu đài băng ở màn 7;
              bé TRƯỢT VÁN tuyết (ván dưới chân, mũ len, khăn quàng). 19 quái / vật cản xứ tuyết.
              Vật màu trắng luôn có viền xanh để nổi trên nền tuyết.
              Quy ước giống st_ve_keo.js: gốc tọa độ giữa đáy vật, mặt quay sang TRÁI, "this" là BoVe.
   BƯỚC: TC_00F
   CẬP NHẬT: 16/10/2026 - TC_00G: đồ của bé gắn theo khung xương mới (st_ve_be.js), tư thế trượt ván.
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST;
  const { PI2, tronMau, bam, chiaDuong, moiBuoc } = ST.VE_CHUNG;
  const VIEN = "#6f9cc8"; // viền xanh cho vật trắng

  ST.CHU_DE_VE = ST.CHU_DE_VE || {};
  ST.CHU_DE_VE.tuyet = {
    cong: { soc: "#4fa3e0", nut: "#ff6b8a" },
    mauGoHang: ["#5f95c8", "#d8eeff"],
    phuongTien: {
      tuThe: "truot",
      sau(tt) { // ván trượt tuyết dưới chân + bụi tuyết tung phía sau
        const c = this.c, t = tt.t, lac = tt.dangChay ? Math.sin(t * 9) * 0.04 : 0;
        if (tt.dangChay) {
          c.fillStyle = "rgba(255,255,255,0.9)";
          for (let k = 0; k < 6; k++) { const u = (t * 3 + k / 6) % 1; c.beginPath(); c.arc(-26 - u * 34, -4 - u * 16 + Math.sin(k * 7) * 4, 4 * (1 - u) + 1, 0, PI2); c.fill(); }
        }
        c.rotate(tt.nhay ? -0.12 : lac);
        c.fillStyle = "#2f6fd0"; c.beginPath(); c.roundRect(-28, -7, 56, 7, 4); c.fill();
        c.beginPath(); c.ellipse(26, -6, 6, 4, -0.5, 0, PI2); c.ellipse(-26, -6, 6, 4, 0.5, 0, PI2); c.fill(); // hai mũi ván cong
        c.fillStyle = "#ffd23f"; c.fillRect(-20, -5, 40, 2.5);
        c.fillStyle = "#ff6b8a"; c.beginPath(); c.arc(0, -4, 3, 0, PI2); c.fill();
      },
      truoc(tt) { // mũ len có quả bông + khăn quàng bay
        const c = this.c, t = this.t, k = tt.k;
        ST.VE_CHUNG.theoDau(c, k, r => {
          c.fillStyle = "#e8344e"; c.beginPath(); c.arc(-1, -1, r + 1.6, Math.PI * 1.0, Math.PI * 2.0); c.fill();
          c.fillStyle = "#fff"; c.beginPath(); c.roundRect(-r - 2.5, -4, 2 * r + 4, 5, 2.5); c.fill();
          c.beginPath(); c.arc(-1, -r - 6, 4.5, 0, PI2); c.fill();
          c.fillStyle = "#ffd23f"; for (let i = 0; i < 3; i++) c.fillRect(-8 + i * 6, -r + 1, 3, 4);
        });
        ST.VE_CHUNG.theoThan(c, k, () => {
          const bay = Math.sin(t * 8) * 3;
          c.fillStyle = "#e8344e"; c.beginPath(); c.roundRect(-7, -2, 14, 6, 3); c.fill();
          c.beginPath(); c.moveTo(-5, 0); c.lineTo(-22, -1 + bay); c.lineTo(-22, 6 + bay); c.lineTo(-4, 4); c.fill();
          c.fillStyle = "#fff"; c.fillRect(-16, 0 + bay * 0.6, 2.5, 5);
        });
      }
    },

    nen(camX, p) {
      const c = this.c, W = this.rong, H = this.cao, dat = this.dat, t = this.t;
      const s = Math.max(0, (p - 0.45) / 0.55); // càng về cuối trời càng hồng hoàng hôn
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, tronMau("#7cc4f4", "#9a8ee0", s * 0.7));
      gr.addColorStop(1, tronMau("#e6f5ff", "#ffd6e6", s * 0.8));
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = "rgba(255,255,240,0.9)"; c.beginPath(); c.arc(W * 0.8 - p * W * 0.12, 70 + s * 50, 26, 0, PI2); c.fill();
      // núi tuyết xa
      this.veLop(camX, 0.15, 380, dat, (x, y, i) => {
        const cx = x + 190, r = 150 + bam(i) * 110, dinh = dat - r * 1.05;
        c.fillStyle = tronMau("#8fb4d8", "#9a90c8", s * 0.6);
        c.beginPath(); c.moveTo(cx - r * 1.2, dat); c.lineTo(cx, dinh); c.lineTo(cx + r * 1.2, dat); c.fill();
        c.fillStyle = "#fff"; c.beginPath(); c.moveTo(cx - r * 0.36, dinh + r * 0.32); c.lineTo(cx, dinh); c.lineTo(cx + r * 0.36, dinh + r * 0.32);
        c.lineTo(cx + r * 0.16, dinh + r * 0.24); c.lineTo(cx + r * 0.02, dinh + r * 0.36); c.lineTo(cx - r * 0.14, dinh + r * 0.24); c.fill();
      });
      if (p > 0.45) {
        const a = Math.min(1, (p - 0.45) / 0.15), x = W + 60 - (p - 0.45) / 0.55 * W * 0.35;
        c.globalAlpha = 0.6 * a; ST.CHU_DE_VE.tuyet.bongLauDai.call(this, x, dat - 70, 0.45); c.globalAlpha = 1;
      }
      // đồi tuyết gần
      this.veLop(camX, 0.4, 300, dat - 40, (x, y, i) => {
        c.fillStyle = i % 2 ? "#eef7ff" : "#dcecfa";
        c.beginPath(); c.moveTo(x - 60, dat); c.quadraticCurveTo(x + 80 + bam(i) * 60, dat - 90 - bam(i + 1) * 50, x + 330, dat); c.fill();
        c.strokeStyle = "rgba(111,156,200,0.35)"; c.lineWidth = 2; c.stroke();
      });
      // thông phủ tuyết, người tuyết nhỏ phía sau đường
      this.veLop(camX, 0.7, 150, dat, (x, y, i) => {
        const r = bam(i + 5), xx = x + 30 + bam(i) * 60, k = 0.75 + bam(i + 2) * 0.55;
        if (r < 0.65) veThong(c, xx, dat - 4, k);
        else if (r < 0.8) { c.fillStyle = "#fff"; c.strokeStyle = VIEN; c.lineWidth = 1.5; c.beginPath(); c.arc(xx, dat - 14 * k, 13 * k, 0, PI2); c.arc(xx, dat - 34 * k, 9 * k, 0, PI2); c.fill(); c.stroke(); c.fillStyle = "#ff8c1a"; c.beginPath(); c.moveTo(xx - 2, dat - 35 * k); c.lineTo(xx - 12 * k, dat - 33 * k); c.lineTo(xx - 2, dat - 31 * k); c.fill(); }
      });
      // tuyết rơi
      c.fillStyle = "rgba(255,255,255,0.85)";
      for (let i = 0; i < 46; i++) {
        const x = ((bam(i) * W * 1.3 - camX * 0.3 + Math.sin(t + i) * 12) % W + W) % W, y = ((bam(i + 50) * H + t * (24 + bam(i + 9) * 26)) % dat);
        c.beginPath(); c.arc(x, y, 1.5 + bam(i + 3) * 2.2, 0, PI2); c.fill();
      }
    },

    dat(camX, ds, doDai) {
      const c = this.c, y = this.dat, H = this.cao;
      const { ho, doan } = chiaDuong(this, camX, ds);
      ho.forEach(([a, b]) => { // khe băng sâu xanh thẫm
        const gr = c.createLinearGradient(0, y, 0, H);
        gr.addColorStop(0, "#4f8fc8"); gr.addColorStop(1, "#0f2a4a");
        c.fillStyle = gr; c.fillRect(a, y + 4, b - a, H - y);
        c.strokeStyle = "rgba(200,235,255,0.4)"; c.lineWidth = 2;
        c.beginPath(); c.moveTo(a + 8, y + 20); c.lineTo(a + (b - a) * 0.3, y + 60); c.moveTo(b - 8, y + 26); c.lineTo(b - (b - a) * 0.3, y + 70); c.stroke();
      });
      doan.forEach(([a, b]) => {
        const gr = c.createLinearGradient(0, y, 0, H);
        gr.addColorStop(0, "#bfe0f7"); gr.addColorStop(1, "#7fb2de");
        c.fillStyle = gr; c.fillRect(a, y + 10, b - a, H - y);
        c.save(); c.beginPath(); c.rect(a, y + 10, b - a, H - y); c.clip();
        c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 2; // vết nứt băng
        moiBuoc(camX, a, b, 70, (i, x) => { c.beginPath(); c.moveTo(x, y + 22); c.lineTo(x + 12, y + 34 + bam(i) * 10); c.lineTo(x + 4, y + 52); c.moveTo(x + 12, y + 36); c.lineTo(x + 26, y + 40); c.stroke(); });
        c.restore();
        c.fillStyle = "#ffffff"; c.beginPath(); c.roundRect(a - 2, y - 4, b - a + 4, 16, 8); c.fill();
        c.fillStyle = "#d4e8f8"; c.fillRect(a, y + 8, b - a, 4);
        moiBuoc(camX, a, b, 54, (i, x) => { // lấp lánh trên tuyết
          if (bam(i * 3) > 0.4 || x < a + 6 || x > b - 6 || x > doDai - camX + 40) return;
          c.fillStyle = "#9fd0ff"; c.beginPath(); c.moveTo(x, y - 2); c.lineTo(x + 2, y + 2); c.lineTo(x, y + 6); c.lineTo(x - 2, y + 2); c.fill();
        });
      });
    },
    mieng(x, w) { // gờ tuyết và nhũ băng hai bên miệng khe
      const c = this.c, y = this.dat;
      c.fillStyle = "#fff";
      for (const ex of [x, x + w]) { c.beginPath(); c.arc(ex, y + 4, 8, 0, PI2); c.fill(); }
      c.fillStyle = "#cdeeff";
      for (let k = 0; k < 3; k++) {
        c.beginPath(); c.moveTo(x + 2 + k * 6, y + 8); c.lineTo(x + 5 + k * 6, y + 22 + (k % 2) * 8); c.lineTo(x + 8 + k * 6, y + 8); c.fill();
        c.beginPath(); c.moveTo(x + w - 2 - k * 6, y + 8); c.lineTo(x + w - 5 - k * 6, y + 20 + (k % 2) * 10); c.lineTo(x + w - 8 - k * 6, y + 8); c.fill();
      }
    },

    nenHang(camX) { // hang băng: tường xanh thẫm, cụm pha lê phát sáng, nhũ băng trên trần
      const c = this.c, W = this.rong, Hc = this.cao, dat = this.dat, t = this.t;
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, "#0e2748"); gr.addColorStop(1, "#2f6a9e");
      c.fillStyle = gr; c.fillRect(0, 0, W, Hc);
      // nhũ băng trên trần
      moiBuoc(camX * 0.6, -40, W + 40, 34, (i, x) => {
        const dai = 20 + bam(i) * 60;
        c.fillStyle = "rgba(190,230,255,0.75)"; c.beginPath(); c.moveTo(x - 9, 0); c.lineTo(x, dai); c.lineTo(x + 9, 0); c.fill();
      });
      // cụm pha lê tím phát sáng (khác màu kim cương xanh)
      moiBuoc(camX * 0.8, -150, W + 150, 210, (i, x) => {
        const nhip = 0.6 + Math.sin(t * 3 + i) * 0.2, cx = x + 100, cy = dat - 10;
        c.fillStyle = `rgba(200,170,255,${0.2 * nhip})`; c.beginPath(); c.arc(cx, cy - 40, 70, 0, PI2); c.fill();
        [[-22, 50, -0.3], [0, 80, 0], [20, 58, 0.3], [36, 34, 0.5]].forEach(([dx, cao, g], k) => {
          c.save(); c.translate(cx + dx, cy); c.rotate(g);
          c.fillStyle = k % 2 ? "#e6dcff" : "#b39cf5"; c.beginPath(); c.moveTo(-9, 0); c.lineTo(-9, -cao * 0.75); c.lineTo(0, -cao); c.lineTo(9, -cao * 0.75); c.lineTo(9, 0); c.fill();
          c.fillStyle = "rgba(255,255,255,0.45)"; c.beginPath(); c.moveTo(-5, -4); c.lineTo(-5, -cao * 0.7); c.lineTo(0, -cao * 0.9); c.fill();
          c.restore();
        });
      });
      c.fillStyle = "#9cc8ec"; c.fillRect(0, dat, W, Hc - dat);
      c.fillStyle = "#e8f6ff"; c.fillRect(0, dat, W, 8);
    },

    bongLauDai(x, y, k) {
      const c = this.c;
      c.fillStyle = "#b8d8f2";
      c.fillRect(x - 120 * k, y - 120 * k, 240 * k, 120 * k);
      [-130, -40, 50, 130].forEach((dx, i) => {
        const cao = (i === 1 || i === 2 ? 200 : 160) * k;
        c.fillRect(x + (dx - 18) * k, y - cao, 36 * k, cao);
        c.beginPath(); c.moveTo(x + (dx - 24) * k, y - cao); c.lineTo(x + dx * k, y - cao - 50 * k); c.lineTo(x + (dx + 24) * k, y - cao); c.fill();
      });
    },

    lauDai(g) { // lâu đài băng: tường xanh nhạt, tháp nhọn, cửa băng tan khi thắng
      const c = this.c, t = this.t;
      const thap = (dx, rong, cao) => {
        c.fillStyle = "#cfe8fb"; c.fillRect(dx - rong / 2, -cao, rong, cao);
        c.fillStyle = "rgba(255,255,255,0.55)"; c.fillRect(dx - rong / 2 + 4, -cao + 6, 6, cao - 12);
        c.strokeStyle = VIEN; c.lineWidth = 2; c.strokeRect(dx - rong / 2, -cao, rong, cao);
        c.fillStyle = "#5fa8e6"; c.beginPath(); c.moveTo(dx - rong / 2 - 8, -cao); c.lineTo(dx, -cao - rong * 1.4); c.lineTo(dx + rong / 2 + 8, -cao); c.fill();
        c.fillStyle = "#fff"; c.beginPath(); c.moveTo(dx - rong / 2 - 8, -cao); c.lineTo(dx - rong * 0.2, -cao - rong * 0.5); c.lineTo(dx, -cao - 4); c.lineTo(dx + rong * 0.2, -cao - rong * 0.5); c.lineTo(dx + rong / 2 + 8, -cao); c.fill();
        c.fillStyle = "#3f7fd0"; c.beginPath(); c.roundRect(dx - 7, -cao + 22, 14, 22, [7, 7, 0, 0]); c.fill();
      };
      c.fillStyle = "#dff0fd"; c.fillRect(-170, -130, 340, 130);
      c.strokeStyle = VIEN; c.lineWidth = 2; c.strokeRect(-170, -130, 340, 130);
      for (let i = 0; i < 9; i++) { c.fillStyle = "#dff0fd"; c.fillRect(-170 + i * 40, -146, 22, 16); c.strokeRect(-170 + i * 40, -146, 22, 16); }
      c.strokeStyle = "rgba(111,156,200,0.45)"; c.lineWidth = 1.5;
      for (let r = 1; r < 5; r++) { c.beginPath(); c.moveTo(-170, -r * 26); c.lineTo(170, -r * 26); c.stroke(); }
      thap(-185, 40, 190); thap(185, 40, 190); thap(-60, 46, 220);
      c.fillStyle = "#ff6b8a"; c.beginPath(); c.moveTo(-60, -284); c.lineTo(-60, -304); c.lineTo(-40, -296); c.fill();
      // nhũ băng dưới mép tường
      c.fillStyle = "#b8e2ff"; for (let i = 0; i < 16; i++) { const xx = -165 + i * 21; c.beginPath(); c.moveTo(xx, -130); c.lineTo(xx + 5, -116 + (i % 3) * 4); c.lineTo(xx + 10, -130); c.fill(); }
      // cửa băng
      c.fillStyle = "#1d3b6a"; c.beginPath(); c.roundRect(-120, -96, 64, 96, [32, 32, 0, 0]); c.fill();
      const mo = g.trangThai === "thang" ? Math.min(1, g.tKetThuc / 0.8) : 0;
      c.save(); c.beginPath(); c.roundRect(-120, -96, 64, 96, [32, 32, 0, 0]); c.clip();
      c.fillStyle = "rgba(160,215,250,0.92)"; c.fillRect(-120, -96 + mo * 96, 64, 96);
      c.strokeStyle = "#fff"; c.lineWidth = 2; c.beginPath(); c.moveTo(-108, -70 + mo * 96); c.lineTo(-92, -50 + mo * 96); c.lineTo(-100, -30 + mo * 96); c.stroke();
      c.restore();
      c.fillStyle = "#fff"; c.beginPath(); c.roundRect(-20, -124, 132, 30, 10); c.fill();
      c.strokeStyle = "#4fa3e0"; c.lineWidth = 3; c.stroke();
      c.fillStyle = "#1d4f8a"; c.font = '800 18px "Baloo 2", "Be Vietnam Pro", system-ui, sans-serif'; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("Lâu Đài Băng", 46, -108);
      void t;
    }
  };

  function veThong(c, x, y, k) { // cây thông có tuyết đọng trên các tầng lá
    c.fillStyle = "#7a4a26"; c.fillRect(x - 4 * k, y - 14 * k, 8 * k, 14 * k);
    for (let j = 0; j < 3; j++) {
      const yy = y - 12 * k - j * 20 * k, r = (30 - j * 7) * k;
      c.fillStyle = "#2f8a5a"; c.beginPath(); c.moveTo(x - r, yy); c.lineTo(x, yy - 30 * k); c.lineTo(x + r, yy); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.moveTo(x - r * 0.55, yy - 13 * k); c.lineTo(x, yy - 30 * k); c.lineTo(x + r * 0.55, yy - 13 * k);
      c.quadraticCurveTo(x + r * 0.2, yy - 9 * k, x, yy - 14 * k); c.quadraticCurveTo(x - r * 0.2, yy - 9 * k, x - r * 0.55, yy - 13 * k); c.fill();
    }
  }

  /* ================================================================
     QUÁI / VẬT CẢN XỨ TUYẾT
     ================================================================ */
  ST.VE_QUAI = ST.VE_QUAI || {};
  Object.assign(ST.VE_QUAI, {
    dongTuyet(w, h) { // đống tuyết gồ ghề, có cành cây và đá cuội
      const c = this.c;
      c.fillStyle = "#fff"; c.strokeStyle = VIEN; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(-w / 2, 0);
      c.quadraticCurveTo(-w * 0.48, -h * 0.8, -w * 0.2, -h * 0.82); c.quadraticCurveTo(-w * 0.05, -h * 1.08, w * 0.15, -h * 0.85);
      c.quadraticCurveTo(w * 0.48, -h * 0.8, w / 2, 0); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = "rgba(111,156,200,0.3)"; c.beginPath(); c.moveTo(w * 0.05, -h * 0.5); c.quadraticCurveTo(w * 0.35, -h * 0.55, w * 0.46, 0); c.lineTo(0, 0); c.fill();
      c.strokeStyle = "#6b4226"; c.lineWidth = 3; c.beginPath(); c.moveTo(-w * 0.1, -h * 0.8); c.lineTo(-w * 0.2, -h * 1.2); c.moveTo(-w * 0.15, -h * 1.02); c.lineTo(-w * 0.28, -h * 1.08); c.stroke();
      c.fillStyle = "#8a94a8"; c.beginPath(); c.ellipse(-w * 0.28, -4, 6, 4, 0, 0, PI2); c.ellipse(w * 0.3, -3, 5, 3, 0, 0, PI2); c.fill();
    },
    khoiBang(w, h) { // khối băng trong suốt: mặt trên sáng, vết nứt, đốm lóe sáng
      const c = this.c, nong = 8;
      c.fillStyle = "#8fd3f4"; c.beginPath(); c.roundRect(-w / 2, -h + nong, w - nong, h - nong, 4); c.fill();
      c.fillStyle = "#c9f0ff"; c.beginPath(); c.moveTo(-w / 2, -h + nong); c.lineTo(-w / 2 + nong, -h); c.lineTo(w / 2, -h); c.lineTo(w / 2 - nong, -h + nong); c.fill();
      c.fillStyle = "#5fb4e0"; c.beginPath(); c.moveTo(w / 2 - nong, -h + nong); c.lineTo(w / 2, -h); c.lineTo(w / 2, -nong); c.lineTo(w / 2 - nong, 0); c.fill();
      c.strokeStyle = "#2f7fbf"; c.lineWidth = 2; c.strokeRect(-w / 2, -h + nong, w - nong, h - nong);
      c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-w * 0.1, -h + nong); c.lineTo(-w * 0.02, -h * 0.55); c.lineTo(-w * 0.18, -h * 0.3); c.moveTo(-w * 0.02, -h * 0.55); c.lineTo(w * 0.18, -h * 0.42); c.stroke();
      c.fillStyle = "rgba(255,255,255,0.7)"; c.fillRect(-w / 2 + 5, -h + nong + 5, 5, h * 0.4);
    },
    nguoiTuyetNho(w, h, t, o) { // người tuyết nhỏ đứng yên, mũi cà rốt, khăn quàng, tay cành cây
      const c = this.c, mauKhan = ["#e8344e", "#2f9e5a", "#7a5ce0"][(o.bienThe || 0) % 3];
      c.fillStyle = "#fff"; c.strokeStyle = VIEN; c.lineWidth = 2;
      c.beginPath(); c.arc(0, -h * 0.3, w * 0.45, 0, PI2); c.fill(); c.stroke();
      c.beginPath(); c.arc(0, -h * 0.74, w * 0.32, 0, PI2); c.fill(); c.stroke();
      c.strokeStyle = "#6b4226"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-w * 0.35, -h * 0.42); c.lineTo(-w * 0.62, -h * 0.62); c.moveTo(w * 0.35, -h * 0.42); c.lineTo(w * 0.62, -h * 0.6); c.stroke();
      c.fillStyle = mauKhan; c.beginPath(); c.roundRect(-w * 0.32, -h * 0.55, w * 0.64, 7, 3); c.fill(); c.fillRect(w * 0.1, -h * 0.55, 7, 16);
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.14, -h * 0.8, 2.6, 0, PI2); c.arc(w * 0.08, -h * 0.8, 2.6, 0, PI2); c.fill();
      [-0.35, -0.22].forEach(k => { c.beginPath(); c.arc(0, h * k, 2.4, 0, PI2); c.fill(); });
      c.fillStyle = "#ff8c1a"; c.beginPath(); c.moveTo(-2, -h * 0.74); c.lineTo(-w * 0.4, -h * 0.71); c.lineTo(-2, -h * 0.68); c.fill();
      c.strokeStyle = "#2B2640"; c.lineWidth = 1.6; c.beginPath(); c.arc(-w * 0.02, -h * 0.66, 5, 0.3, Math.PI - 0.3); c.stroke();
    },
    goThong(w, h) { // gốc thông cưa ngang, vòng gỗ, mũ tuyết
      const c = this.c, than = h - 8;
      c.fillStyle = "#8a5530"; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w * 0.4, -than); c.lineTo(w * 0.4, -than); c.lineTo(w / 2, 0); c.fill();
      c.strokeStyle = "#6b3f1f"; c.lineWidth = 2; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * w * 0.18, -4); c.lineTo(i * w * 0.15, -than + 4); c.stroke(); }
      c.fillStyle = "#e0b47a"; c.beginPath(); c.ellipse(0, -than, w * 0.4, 7, 0, 0, PI2); c.fill();
      c.strokeStyle = "#a8743a"; c.lineWidth = 1.3; [0.28, 0.17, 0.07].forEach(k => { c.beginPath(); c.ellipse(0, -than, w * k, 7 * k / 0.4, 0, 0, PI2); c.stroke(); });
      c.fillStyle = "#fff"; c.strokeStyle = VIEN; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(-w * 0.44, -than + 2); c.quadraticCurveTo(-w * 0.3, -h - 4, 0, -h - 2); c.quadraticCurveTo(w * 0.32, -h - 6, w * 0.44, -than + 2);
      c.quadraticCurveTo(w * 0.3, -than + 6, w * 0.15, -than + 4); c.quadraticCurveTo(w * 0.1, -than + 12, 0, -than + 4); c.quadraticCurveTo(-w * 0.2, -than + 8, -w * 0.44, -than + 2); c.fill(); c.stroke();
      c.fillStyle = "#3f9a5a"; c.beginPath(); c.moveTo(-w / 2 - 2, -6); c.lineTo(-w / 2 - 12, -18); c.lineTo(-w / 2 + 2, -14); c.fill();
    },
    xeTruot(w, h, t, o) { // xe trượt gỗ đỏ, càng cong ở đầu, chở hộp quà
      const c = this.c, quaMau = ["#7a5ce0", "#2f9e5a", "#ff8c1a"][(o.bienThe || 0) % 3];
      c.strokeStyle = "#8a94a8"; c.lineWidth = 4; c.lineCap = "round";
      c.beginPath(); c.moveTo(w / 2 - 4, -3); c.lineTo(-w / 2 + 12, -3); c.quadraticCurveTo(-w / 2, -3, -w / 2, -14); c.quadraticCurveTo(-w / 2, -22, -w / 2 + 8, -20); c.stroke();
      c.lineWidth = 3; [-0.2, 0.3].forEach(k => { c.beginPath(); c.moveTo(k * w, -3); c.lineTo(k * w, -h * 0.4); c.stroke(); });
      c.fillStyle = "#d63a3a"; c.beginPath(); c.roundRect(-w * 0.4, -h * 0.52, w * 0.88, h * 0.16, 4); c.fill();
      c.fillStyle = "#ffd23f"; c.fillRect(-w * 0.36, -h * 0.46, w * 0.8, 3);
      c.fillStyle = quaMau; c.beginPath(); c.roundRect(-w * 0.05, -h, w * 0.4, h * 0.48, 3); c.fill();
      c.fillStyle = "#ffd23f"; c.fillRect(w * 0.13, -h, 5, h * 0.48); c.fillRect(-w * 0.05, -h * 0.8, w * 0.4, 5);
      c.beginPath(); c.ellipse(w * 0.11, -h - 4, 7, 4, -0.5, 0, PI2); c.ellipse(w * 0.21, -h - 4, 7, 4, 0.5, 0, PI2); c.fill();
    },
    hangRaoTuyet(w, h) { // hàng rào gỗ đầu nhọn, tuyết đọng trên đỉnh
      const c = this.c, so = Math.max(4, Math.round(w / 16)), b = w / so;
      c.fillStyle = "#c98a4a";
      c.fillRect(-w / 2, -h * 0.68, w, 7); c.fillRect(-w / 2, -h * 0.32, w, 7);
      for (let i = 0; i < so; i++) {
        const x = -w / 2 + i * b + 2, rr = b - 5;
        c.fillStyle = i % 2 ? "#b8783a" : "#d8995a";
        c.beginPath(); c.moveTo(x, 0); c.lineTo(x, -h + 10); c.lineTo(x + rr / 2, -h + 2); c.lineTo(x + rr, -h + 10); c.lineTo(x + rr, 0); c.fill();
        c.fillStyle = "#fff"; c.strokeStyle = VIEN; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(x - 1, -h + 11); c.lineTo(x + rr / 2, -h); c.lineTo(x + rr + 1, -h + 11); c.quadraticCurveTo(x + rr / 2, -h + 15, x - 1, -h + 11); c.fill(); c.stroke();
      }
      c.fillStyle = "#fff"; c.beginPath(); c.roundRect(-w / 2, -h * 0.68 - 3, w, 4, 2); c.fill();
    },
    thapBang(w, h) { // tháp băng nhọn nhiều tầng pha lê, quá cao để nhảy qua
      const c = this.c;
      const tang = [[0, 1, 0.5], [0.3, 0.75, 0.42], [0.55, 0.5, 0.34]];
      tang.forEach(([y0, rk]) => {
        const day = -h * y0, rong = w * rk / 2;
        c.fillStyle = "#8fd3f4"; c.beginPath(); c.moveTo(-rong, day); c.lineTo(-rong * 0.7, day - h * 0.38); c.lineTo(rong * 0.7, day - h * 0.38); c.lineTo(rong, day); c.fill();
        c.fillStyle = "#5fb4e0"; c.beginPath(); c.moveTo(rong * 0.2, day); c.lineTo(rong * 0.2, day - h * 0.38); c.lineTo(rong * 0.7, day - h * 0.38); c.lineTo(rong, day); c.fill();
        c.strokeStyle = "#2f7fbf"; c.lineWidth = 2; c.beginPath(); c.moveTo(-rong, day); c.lineTo(-rong * 0.7, day - h * 0.38); c.lineTo(rong * 0.7, day - h * 0.38); c.lineTo(rong, day); c.stroke();
      });
      c.fillStyle = "#c9f0ff"; c.beginPath(); c.moveTo(-w * 0.16, -h * 0.92); c.lineTo(0, -h); c.lineTo(w * 0.16, -h * 0.92); c.fill();
      c.fillStyle = "rgba(255,255,255,0.75)"; c.fillRect(-w * 0.32, -h * 0.34, 5, h * 0.28); c.fillRect(-w * 0.2, -h * 0.66, 4, h * 0.2);
      this.veSao(0, -h * 0.94, 7, "#fff", this.t * 2);
    },
    thongTuyetCao(w, h) { // cây thông rất cao, tuyết trên từng tầng, ngôi sao trên ngọn
      const c = this.c, so = 5, buoc = (h - 30) / so;
      c.fillStyle = "#7a4a26"; c.fillRect(-7, -22, 14, 22);
      for (let j = 0; j < so; j++) {
        const yy = -18 - j * buoc, r = w / 2 - j * (w * 0.07);
        c.fillStyle = j % 2 ? "#2f8a5a" : "#277a4e"; c.beginPath(); c.moveTo(-r, yy); c.lineTo(0, yy - buoc * 1.5); c.lineTo(r, yy); c.fill();
        c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-r, yy); c.quadraticCurveTo(-r * 0.4, yy - 9, 0, yy - 4); c.quadraticCurveTo(r * 0.4, yy - 9, r, yy); c.quadraticCurveTo(0, yy - 1, -r, yy); c.fill();
      }
      this.veSao(0, -h + 6, 9, "#ffd23f", 0);
    },
    canhCut(w, h, t, o) { // chim cánh cụt lạch bạch, bụng trắng, mỏ cam
      const c = this.c, lac = o.dangDi ? Math.sin(t * 10) * 0.12 : Math.sin(t * 2) * 0.04;
      c.fillStyle = "#ff9f1c"; c.beginPath(); c.ellipse(-8, -3, 8, 4, 0, 0, PI2); c.ellipse(8, -3, 8, 4, 0, 0, PI2); c.fill();
      c.save(); c.rotate(lac);
      c.fillStyle = "#24304a"; c.beginPath(); c.ellipse(0, -h * 0.48, w * 0.44, h * 0.48, 0, 0, PI2); c.fill();
      c.beginPath(); c.ellipse(-w * 0.4, -h * 0.45, 6, 14, 0.5, 0, PI2); c.ellipse(w * 0.4, -h * 0.45, 6, 14, -0.5, 0, PI2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.ellipse(-w * 0.05, -h * 0.4, w * 0.3, h * 0.34, 0, 0, PI2); c.fill();
      c.beginPath(); c.ellipse(-w * 0.12, -h * 0.74, w * 0.22, h * 0.14, 0, 0, PI2); c.fill();
      this.mat(-w * 0.12, -h * 0.75, 3.2, false);
      c.fillStyle = "#ff9f1c"; c.beginPath(); c.moveTo(-w * 0.2, -h * 0.66); c.lineTo(-w * 0.44, -h * 0.62); c.lineTo(-w * 0.2, -h * 0.58); c.fill();
      c.fillStyle = "#e8344e"; c.beginPath(); c.roundRect(-w * 0.32, -h * 0.56, w * 0.6, 5, 2); c.fill(); // khăn nhỏ
      c.restore();
    },
    haiCau(w, h, t, o) { // hải cẩu xám nằm trườn, đỡ quả bóng trên mũi
      const c = this.c, truon = o.dangDi ? Math.sin(t * 6) * 2 : 0, nay = Math.abs(Math.sin(t * 4)) * 6;
      c.fillStyle = "#8a9ab0"; c.beginPath(); c.moveTo(w / 2, -4); c.quadraticCurveTo(w * 0.2, -h * 0.75 - truon, -w * 0.2, -h * 0.6); c.quadraticCurveTo(-w * 0.45, -h * 0.4, -w * 0.32, 0); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(w / 2, -4); c.lineTo(w / 2 + 8, -12); c.lineTo(w / 2 + 6, 0); c.fill();
      c.fillStyle = "#b8c4d4"; c.beginPath(); c.ellipse(-w * 0.12, -h * 0.25, w * 0.18, h * 0.22, 0, 0, PI2); c.fill();
      c.fillStyle = "#6f7f96"; c.beginPath(); c.ellipse(-w * 0.12 + truon, -4, 10, 4, -0.3, 0, PI2); c.fill();
      c.fillStyle = "#9aaac0"; c.beginPath(); c.arc(-w * 0.3, -h * 0.68, h * 0.28, 0, PI2); c.fill();
      this.mat(-w * 0.32, -h * 0.74, 2.8, true);
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.46, -h * 0.62, 3, 0, PI2); c.fill();
      c.strokeStyle = "#2B2640"; c.lineWidth = 1; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(-w * 0.44, -h * 0.58); c.lineTo(-w * 0.56, -h * 0.58 + i * 4); c.stroke(); }
      const by = -h - 4 - nay; // quả bóng
      ["#e8344e", "#ffd23f", "#2f6fd0"].forEach((m, i) => { c.fillStyle = m; c.beginPath(); c.moveTo(-w * 0.44, by); c.arc(-w * 0.44, by, 8, i * PI2 / 3 + t * 3, (i + 1) * PI2 / 3 + t * 3); c.fill(); });
    },
    banhTuyetLan(w, h, t, o) { // quả cầu tuyết to lăn tới, mặt cau có
      const c = this.c, r = Math.min(w, h) / 2, lan = o.dangDi ? -t * 5 : 0;
      c.save(); c.translate(0, -r);
      c.fillStyle = "#fff"; c.strokeStyle = VIEN; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, r, 0, PI2); c.fill(); c.stroke();
      c.save(); c.rotate(lan); c.fillStyle = "rgba(111,156,200,0.35)";
      for (let i = 0; i < 6; i++) { const a = i * PI2 / 6; c.beginPath(); c.arc(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, 4, 0, PI2); c.fill(); }
      c.strokeStyle = "#6b4226"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(r * 0.5, -r * 0.5); c.lineTo(r * 1.05, -r * 0.95); c.stroke();
      c.restore();
      this.mat(-r * 0.25, -r * 0.2, 4.2, true);
      c.strokeStyle = "#2B2640"; c.lineWidth = 2; c.beginPath(); c.arc(-r * 0.25, r * 0.45, 6, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      c.restore();
      c.fillStyle = "rgba(255,255,255,0.9)"; if (o.dangDi) for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(r + 4 + k * 6, -3 - (k % 2) * 4, 3 - k * 0.6, 0, PI2); c.fill(); }
    },
    thoTuyet(w, h, t, o) { // thỏ tuyết trắng nhảy cà tưng, tai hồng
      const c = this.c, nhay = o.dangDi ? Math.abs(Math.sin(t * 8)) * 8 : 0;
      c.save(); c.translate(0, -nhay);
      c.fillStyle = "#fff"; c.strokeStyle = VIEN; c.lineWidth = 2;
      c.beginPath(); c.ellipse(w * 0.08, -h * 0.3, w * 0.36, h * 0.28, 0, 0, PI2); c.fill(); c.stroke();
      c.beginPath(); c.arc(w * 0.42, -h * 0.34, 6, 0, PI2); c.fill(); c.stroke();
      [[-0.32, -0.25], [-0.16, 0.2]].forEach(([dx, g]) => { c.save(); c.translate(w * dx, -h * 0.62); c.rotate(g); c.fillStyle = "#fff"; c.beginPath(); c.ellipse(0, -h * 0.2, 6, h * 0.22, 0, 0, PI2); c.fill(); c.stroke(); c.fillStyle = "#ffb0c8"; c.beginPath(); c.ellipse(0, -h * 0.2, 3, h * 0.15, 0, 0, PI2); c.fill(); c.restore(); });
      c.fillStyle = "#fff"; c.beginPath(); c.arc(-w * 0.24, -h * 0.52, h * 0.22, 0, PI2); c.fill(); c.stroke();
      this.mat(-w * 0.27, -h * 0.56, 2.8, true);
      c.fillStyle = "#ff7eb6"; c.beginPath(); c.arc(-w * 0.42, -h * 0.48, 2.4, 0, PI2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.ellipse(-w * 0.1, -3, 9, 4, 0, 0, PI2); c.ellipse(w * 0.22, -3, 9, 4, 0, 0, PI2); c.fill(); c.stroke();
      c.restore();
    },
    caoTuyet(w, h, t, o) { // cáo tuyết lông xám bạc, đuôi xù to, chạy nhanh
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 14) : 0;
      c.strokeStyle = "#b8c8dc"; c.lineWidth = 5; c.lineCap = "round";
      [[-0.2, 1], [-0.08, -1], [0.18, -1], [0.28, 1]].forEach(([a, s]) => { c.beginPath(); c.moveTo(a * w, -h * 0.4); c.lineTo(a * w + s * buoc * 6, -2); c.stroke(); });
      c.fillStyle = "#dfe8f4"; c.strokeStyle = VIEN; c.lineWidth = 2;
      c.beginPath(); c.moveTo(w * 0.28, -h * 0.5); c.quadraticCurveTo(w * 0.6, -h * 0.9 + buoc * 3, w * 0.52, -h * 0.25); c.quadraticCurveTo(w * 0.42, -h * 0.3, w * 0.28, -h * 0.4); c.fill(); c.stroke(); // đuôi
      c.fillStyle = "#fff"; c.beginPath(); c.arc(w * 0.55, -h * 0.75 + buoc * 3, 5, 0, PI2); c.fill();
      c.fillStyle = "#dfe8f4"; c.beginPath(); c.ellipse(0, -h * 0.5, w * 0.32, h * 0.24, 0, 0, PI2); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-w * 0.22, -h * 0.75); c.lineTo(-w * 0.18, -h); c.lineTo(-w * 0.08, -h * 0.72); c.moveTo(-w * 0.38, -h * 0.75); c.lineTo(-w * 0.38, -h * 0.98); c.lineTo(-w * 0.26, -h * 0.78); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-w * 0.12, -h * 0.75); c.quadraticCurveTo(-w * 0.32, -h * 0.9, -w * 0.42, -h * 0.72); c.lineTo(-w * 0.55, -h * 0.55); c.quadraticCurveTo(-w * 0.3, -h * 0.42, -w * 0.12, -h * 0.5); c.fill(); c.stroke();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.55, -h * 0.56, 3, 0, PI2); c.fill();
      this.mat(-w * 0.3, -h * 0.7, 2.6, true);
    },
    yeti(w, h, t, o) { // Yeti khổng lồ lông trắng xanh, mặt xanh, sừng nhỏ, hai tay giơ cao
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 5) : 0, lac = Math.sin(t * 2) * 0.03;
      c.save(); c.rotate(lac);
      c.fillStyle = "#e8f2fc"; c.strokeStyle = VIEN; c.lineWidth = 2.5;
      c.beginPath(); c.roundRect(-w * 0.32 + buoc * 4, -h * 0.22, w * 0.24, h * 0.22, 8); c.roundRect(w * 0.08 - buoc * 4, -h * 0.22, w * 0.24, h * 0.22, 8); c.fill(); c.stroke();
      c.beginPath(); c.roundRect(-w * 0.42, -h * 0.82, w * 0.84, h * 0.66, w * 0.3); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-w * 0.4, -h * 0.66); c.quadraticCurveTo(-w * 0.62, -h * 0.85, -w * 0.5, -h + 6 + buoc * 6); c.lineTo(-w * 0.36, -h * 0.94); c.lineTo(-w * 0.3, -h * 0.6); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(w * 0.4, -h * 0.66); c.quadraticCurveTo(w * 0.62, -h * 0.85, w * 0.5, -h + 6 - buoc * 6); c.lineTo(w * 0.36, -h * 0.94); c.lineTo(w * 0.3, -h * 0.6); c.fill(); c.stroke();
      c.strokeStyle = "rgba(111,156,200,0.5)"; c.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) { const xx = -w * 0.3 + (i % 4) * w * 0.2, yy = -h * 0.5 + Math.floor(i / 4) * h * 0.18; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + 4, yy + 8); c.lineTo(xx + 8, yy); c.stroke(); }
      c.fillStyle = "#e8f2fc"; c.strokeStyle = VIEN; c.lineWidth = 2.5; c.beginPath(); c.arc(0, -h * 0.82, w * 0.3, 0, PI2); c.fill(); c.stroke();
      c.fillStyle = "#c8d4e4"; c.beginPath(); c.moveTo(-w * 0.22, -h * 0.94); c.lineTo(-w * 0.3, -h - 4); c.lineTo(-w * 0.14, -h * 0.98); c.moveTo(w * 0.22, -h * 0.94); c.lineTo(w * 0.3, -h - 4); c.lineTo(w * 0.14, -h * 0.98); c.fill();
      c.fillStyle = "#5fa8e6"; c.beginPath(); c.roundRect(-w * 0.22, -h * 0.88, w * 0.4, h * 0.13, 10); c.fill();
      this.mat(-w * 0.04, -h * 0.84, 5, true);
      c.fillStyle = "#1d3b6a"; c.beginPath(); c.ellipse(-w * 0.04, -h * 0.765, 10, 5, 0, 0, Math.PI); c.fill();
      c.fillStyle = "#fff"; c.fillRect(-w * 0.04 - 7, -h * 0.765, 5, 4); c.fillRect(-w * 0.04 + 2, -h * 0.765, 5, 4);
      c.restore();
    },
    nguoiTuyetKhongLo(w, h, t, o) { // người tuyết khổng lồ ba tầng biết đi, mũ chóp, mắt đỏ giận
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 5) : 0, lac = Math.sin(t * 2) * 0.03;
      c.save(); c.rotate(lac);
      c.fillStyle = "#fff"; c.strokeStyle = VIEN; c.lineWidth = 2.5;
      const r1 = w * 0.48, r2 = w * 0.38, r3 = w * 0.3;
      c.beginPath(); c.arc(buoc * 2, -r1, r1, 0, PI2); c.fill(); c.stroke();
      c.beginPath(); c.arc(0, -r1 * 2 - r2 + 10, r2, 0, PI2); c.fill(); c.stroke();
      const dauY = -r1 * 2 - r2 * 2 - r3 + 20;
      c.beginPath(); c.arc(0, dauY, r3, 0, PI2); c.fill(); c.stroke();
      c.strokeStyle = "#6b4226"; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-r2 * 0.9, -r1 * 2 - r2 + 4); c.lineTo(-w * 0.62, -r1 * 2 - r2 * 1.6 + buoc * 8); c.lineTo(-w * 0.7, -r1 * 2 - r2 * 1.8 + buoc * 8); c.stroke();
      c.beginPath(); c.moveTo(r2 * 0.9, -r1 * 2 - r2 + 4); c.lineTo(w * 0.62, -r1 * 2 - r2 * 1.6 - buoc * 8); c.lineTo(w * 0.7, -r1 * 2 - r2 * 1.4 - buoc * 8); c.stroke();
      c.fillStyle = "#2B2640"; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, -r1 * 2 - r2 * 1.5 + 10 + i * r2 * 0.5, 4, 0, PI2); c.fill(); }
      c.fillStyle = "#e8344e"; c.beginPath(); c.roundRect(-r3 - 2, dauY + r3 - 8, r3 * 2 + 4, 10, 5); c.fill(); c.fillRect(r3 * 0.3, dauY + r3, 10, 24);
      c.fillStyle = "#2B2640"; c.fillRect(-r3 * 0.8, dauY - r3 - 4, r3 * 1.6, 7); c.fillRect(-r3 * 0.55, dauY - r3 - 30, r3 * 1.1, 28);
      c.fillStyle = "#e8344e"; c.fillRect(-r3 * 0.55, dauY - r3 - 10, r3 * 1.1, 5);
      this.mat(-r3 * 0.15, dauY - r3 * 0.2, 4.5, true);
      c.fillStyle = "#ff5a5f"; c.beginPath(); c.arc(-r3 * 0.15 - 6.5, dauY - r3 * 0.2 + 1, 2, 0, PI2); c.arc(-r3 * 0.15 + 5, dauY - r3 * 0.2 + 1, 2, 0, PI2); c.fill();
      c.fillStyle = "#ff8c1a"; c.beginPath(); c.moveTo(-4, dauY + 2); c.lineTo(-r3 - 16, dauY + 6); c.lineTo(-4, dauY + 10); c.fill();
      c.strokeStyle = "#2B2640"; c.lineWidth = 2; c.beginPath(); c.arc(-4, dauY + r3 * 0.7, 7, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      c.restore();
    },
    cuTuyet(w, h, t) { // cú tuyết trắng đốm đen, mắt vàng tròn, vỗ cánh
      const c = this.c, vo = Math.sin(t * 10), cy = -h * 0.5;
      c.fillStyle = "#fff"; c.strokeStyle = VIEN; c.lineWidth = 2;
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * 6, cy); c.quadraticCurveTo(s * w * 0.4, cy - 18 - vo * 14, s * w * 0.52, cy - 4 - vo * 12); c.quadraticCurveTo(s * w * 0.3, cy + 8, s * 6, cy + 8); c.fill(); c.stroke(); });
      c.beginPath(); c.ellipse(0, cy + 2, w * 0.25, h * 0.42, 0, 0, PI2); c.fill(); c.stroke();
      c.fillStyle = "#2B2640"; [[-6, 8], [6, 12], [0, 16], [-8, 18]].forEach(([a, b]) => { c.beginPath(); c.moveTo(a - 3, cy + b); c.lineTo(a, cy + b + 3); c.lineTo(a + 3, cy + b); c.fill(); });
      c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(-7, cy - 8, 6, 0, PI2); c.arc(7, cy - 8, 6, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-8, cy - 8, 3, 0, PI2); c.arc(6, cy - 8, 3, 0, PI2); c.fill();
      c.strokeStyle = "#2B2640"; c.lineWidth = 2; c.beginPath(); c.moveTo(-14, cy - 17); c.lineTo(-3, cy - 13); c.moveTo(14, cy - 17); c.lineTo(3, cy - 13); c.stroke();
      c.fillStyle = "#3a3a4a"; c.beginPath(); c.moveTo(-3, cy - 3); c.lineTo(0, cy + 3); c.lineTo(3, cy - 3); c.fill();
    },
    chimCoDo(w, h, t) { // chim cổ đỏ: lưng nâu, ngực cam đỏ
      const c = this.c, vo = Math.sin(t * 22);
      c.fillStyle = "#7a5030"; c.beginPath(); c.moveTo(w * 0.32, -h * 0.5); c.lineTo(w / 2, -h * 0.66); c.lineTo(w / 2, -h * 0.36); c.fill();
      c.beginPath(); c.ellipse(w * 0.05, -h * 0.5, w * 0.32, h * 0.32, 0, 0, PI2); c.fill();
      c.fillStyle = "#ff6a3a"; c.beginPath(); c.ellipse(-w * 0.12, -h * 0.42, w * 0.2, h * 0.24, 0, 0, PI2); c.fill();
      c.fillStyle = "#5a3a20"; c.beginPath(); c.ellipse(w * 0.08, -h * 0.62 - vo * 8, w * 0.22, 7, -0.5 - vo * 0.5, 0, PI2); c.fill();
      c.fillStyle = "#7a5030"; c.beginPath(); c.arc(-w * 0.28, -h * 0.66, h * 0.2, 0, PI2); c.fill();
      c.fillStyle = "#ffb03b"; c.beginPath(); c.moveTo(-w * 0.4, -h * 0.7); c.lineTo(-w * 0.52, -h * 0.64); c.lineTo(-w * 0.4, -h * 0.6); c.fill();
      this.mat(-w * 0.3, -h * 0.7, 2.6, true);
    },
    bongTuyetBay(w, h, t) { // bông tuyết sáu cánh xoay tròn, mặt tinh nghịch ở giữa
      const c = this.c, r = Math.min(w, h) / 2, cy = -h / 2;
      c.save(); c.translate(0, cy); c.rotate(t * 1.5);
      c.strokeStyle = "#3f8fd8"; c.lineWidth = 4.5; c.lineCap = "round";
      for (let i = 0; i < 6; i++) {
        c.save(); c.rotate(i * PI2 / 6);
        c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r); c.moveTo(0, -r * 0.6); c.lineTo(-r * 0.25, -r * 0.82); c.moveTo(0, -r * 0.6); c.lineTo(r * 0.25, -r * 0.82); c.stroke();
        c.restore();
      }
      c.strokeStyle = "#fff"; c.lineWidth = 1.6;
      for (let i = 0; i < 6; i++) { c.save(); c.rotate(i * PI2 / 6); c.beginPath(); c.moveTo(0, -r * 0.3); c.lineTo(0, -r * 0.95); c.stroke(); c.restore(); }
      c.restore();
      c.fillStyle = "#c9f0ff"; c.strokeStyle = "#3f8fd8"; c.lineWidth = 2; c.beginPath(); c.arc(0, cy, r * 0.42, 0, PI2); c.fill(); c.stroke();
      this.mat(-1, cy - 2, 2.6, true);
      c.strokeStyle = "#2B2640"; c.lineWidth = 1.5; c.beginPath(); c.arc(-1, cy + 2, 3.5, 0.2, Math.PI - 0.2); c.stroke();
    },
    doiBang(w, h, t) { // dơi băng: cánh xanh lam có tinh thể, thân xanh nhạt
      const c = this.c, vo = Math.sin(t * 18), cy = -h / 2;
      c.fillStyle = "#3f7fd0";
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * 6, cy); c.lineTo(s * w * 0.5, cy - 10 - vo * 10); c.lineTo(s * w * 0.42, cy + 4 - vo * 4); c.lineTo(s * w * 0.28, cy - 1 - vo * 5); c.lineTo(s * w * 0.18, cy + 8); c.closePath(); c.fill(); });
      c.fillStyle = "#c9f0ff"; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * w * 0.3, cy - 4 - vo * 6); c.lineTo(s * w * 0.36, cy - 12 - vo * 7); c.lineTo(s * w * 0.4, cy - 3 - vo * 6); c.fill(); });
      c.fillStyle = "#8fc8f0"; c.beginPath(); c.ellipse(0, cy, 11, h * 0.4, 0, 0, PI2); c.fill();
      c.beginPath(); c.moveTo(-9, cy - 8); c.lineTo(-7, cy - h * 0.55); c.lineTo(-2, cy - 10); c.moveTo(9, cy - 8); c.lineTo(7, cy - h * 0.55); c.lineTo(2, cy - 10); c.fill();
      this.mat(-2, cy - 3, 3, true);
      c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-5, cy + 4); c.lineTo(-3, cy + 8); c.lineTo(-1, cy + 4); c.fill();
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
