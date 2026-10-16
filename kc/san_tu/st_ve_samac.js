/* ================================================================
   FILE: san_tu/st_ve_samac.js
   CHỨC NĂNG: HÌNH VẼ đường đua 3 "Sa mạc kim tự tháp" (game Giải Cứu Mèo Con).
              Cảnh: trời nắng vàng, kim tự tháp xa, đụn cát, cây chà là / xương rồng; mặt đường cát
              gợn sóng; hố cát lún xoáy; hầm báu trong kim tự tháp (chữ tượng hình, đuốc, vàng);
              kim tự tháp lớn ở màn 7; bé đội mũ thám hiểm. 19 quái / vật cản sa mạc (ST.VE_QUAI).
              Quy ước giống st_ve_keo.js: gốc tọa độ giữa đáy vật, mặt quay sang TRÁI, "this" là BoVe.
   BƯỚC: TC_00F
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST;
  const { PI2, tronMau, bam, chiaDuong, moiBuoc } = ST.VE_CHUNG;

  ST.CHU_DE_VE = ST.CHU_DE_VE || {};
  ST.CHU_DE_VE.saMac = {
    cong: { soc: "#e0a83a", nut: "#3fb6a8" },
    mauGoHang: ["#b8873e", "#e8c07a"],
    phuongTien: { truoc() { // mũ thám hiểm
      const c = this.c;
      c.fillStyle = "#e8c27a"; c.beginPath(); c.ellipse(2, -74, 27, 5.5, -0.05, 0, PI2); c.fill();
      c.beginPath(); c.roundRect(-12, -93, 28, 20, [12, 12, 2, 2]); c.fill();
      c.fillStyle = "#c0392b"; c.fillRect(-12, -80, 28, 5);
      c.fillStyle = "rgba(255,255,255,0.35)"; c.fillRect(-8, -90, 6, 8);
    } },

    nen(camX, p) {
      const c = this.c, W = this.rong, H = this.cao, dat = this.dat, t = this.t;
      const s = Math.max(0, (p - 0.45) / 0.55);
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, tronMau("#ffc861", "#ff8a5c", s * 0.8));
      gr.addColorStop(1, tronMau("#fff1c9", "#ffd0a0", s));
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // mặt trời rực có tia
      const mtX = W * 0.78 - p * W * 0.15, mtY = 72 + s * 60;
      c.save(); c.translate(mtX, mtY); c.rotate(t * 0.15); c.fillStyle = "rgba(255,240,170,0.55)";
      for (let i = 0; i < 12; i++) { c.rotate(PI2 / 12); c.beginPath(); c.moveTo(-7, -38); c.lineTo(0, -62); c.lineTo(7, -38); c.fill(); }
      c.restore();
      c.fillStyle = "#fff6c2"; c.beginPath(); c.arc(mtX, mtY, 34, 0, PI2); c.fill();
      // mây mỏng
      c.fillStyle = "rgba(255,255,255,0.6)";
      for (let i = 0; i < 5; i++) {
        const chuKy = 1700, x = ((i * 340 + 60 - camX * 0.1 - t * 5) % chuKy + chuKy) % chuKy - 200, y = 50 + bam(i) * Math.min(120, dat * 0.3);
        c.beginPath(); c.roundRect(x, y, 140 + bam(i + 2) * 80, 10, 5); c.roundRect(x + 40, y - 9, 80, 9, 5); c.fill();
      }
      // kim tự tháp xa
      this.veLop(camX, 0.18, 460, dat, (x, y, i) => {
        if (bam(i + 11) < 0.25) return;
        const cx = x + 200, r = 120 + bam(i) * 90;
        c.fillStyle = tronMau("#efc47e", "#e09a7a", s * 0.6);
        c.beginPath(); c.moveTo(cx - r, dat); c.lineTo(cx, dat - r * 0.95); c.lineTo(cx + r, dat); c.fill();
        c.fillStyle = tronMau("#d9a55c", "#c47a62", s * 0.6);
        c.beginPath(); c.moveTo(cx, dat - r * 0.95); c.lineTo(cx + r, dat); c.lineTo(cx + r * 0.25, dat); c.fill();
      });
      if (p > 0.45) {
        const a = Math.min(1, (p - 0.45) / 0.15), x = W + 60 - (p - 0.45) / 0.55 * W * 0.35;
        c.globalAlpha = 0.6 * a; ST.CHU_DE_VE.saMac.bongLauDai.call(this, x, dat - 70, 0.45); c.globalAlpha = 1;
      }
      // đụn cát
      this.veLop(camX, 0.4, 300, dat - 40, (x, y, i) => {
        c.fillStyle = tronMau(i % 2 ? "#f2c270" : "#e8b35e", "#e0a070", s * 0.5);
        c.beginPath(); c.moveTo(x - 60, dat); c.quadraticCurveTo(x + 60 + bam(i) * 80, dat - 80 - bam(i + 1) * 60, x + 330, dat); c.fill();
        c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 2;
        c.beginPath(); c.moveTo(x + 40, dat - 30); c.quadraticCurveTo(x + 110, dat - 52, x + 190, dat - 26); c.stroke();
      });
      // cây chà là, xương rồng, đá phía sau đường
      this.veLop(camX, 0.7, 170, dat, (x, y, i) => {
        const r = bam(i + 5), xx = x + 40 + bam(i) * 60, k = 0.8 + bam(i + 2) * 0.5;
        if (r < 0.4) veChaLa(c, xx, dat - 6, k, t, i);
        else if (r < 0.7) veXuongRongNen(c, xx, dat - 6, k);
        else { c.fillStyle = "#c99448"; c.beginPath(); c.ellipse(xx, dat - 6, 22 * k, 14 * k, 0, Math.PI, PI2); c.fill(); }
      });
    },

    dat(camX, ds, doDai) {
      const c = this.c, W = this.rong, y = this.dat, H = this.cao, t = this.t;
      const { ho, doan } = chiaDuong(this, camX, ds);
      ho.forEach(([a, b]) => { // cát lún xoáy
        const gr = c.createLinearGradient(0, y, 0, H);
        gr.addColorStop(0, "#b07a36"); gr.addColorStop(1, "#4a2c12");
        c.fillStyle = gr; c.fillRect(a, y + 4, b - a, H - y);
        const cx = (a + b) / 2, cy = y + 34;
        c.strokeStyle = "rgba(255,225,160,0.35)"; c.lineWidth = 2.5; c.beginPath();
        for (let g = 0; g < Math.PI * 5; g += 0.2) { const r = (b - a) * 0.42 * g / (Math.PI * 5); c.lineTo(cx + Math.cos(g - t * 2) * r, cy + Math.sin(g - t * 2) * r * 0.35); }
        c.stroke();
      });
      doan.forEach(([a, b]) => {
        c.fillStyle = "#e6b468"; c.fillRect(a, y + 10, b - a, H - y);
        c.save(); c.beginPath(); c.rect(a, y + 10, b - a, H - y); c.clip();
        c.strokeStyle = "rgba(160,110,50,0.35)"; c.lineWidth = 2;
        for (let r = 0; r < 4; r++) { // lớp đá sa thạch
          const yy = y + 28 + r * 16; c.beginPath(); c.moveTo(a, yy); c.lineTo(b, yy); c.stroke();
          moiBuoc(camX + r * 23, a, b, 46, (i, x) => { c.beginPath(); c.moveTo(x, yy); c.lineTo(x, yy + 16); c.stroke(); });
        }
        c.restore();
        c.fillStyle = "#f7d48c"; c.beginPath(); c.roundRect(a - 2, y - 3, b - a + 4, 15, 7); c.fill();
        c.strokeStyle = "#e0b060"; c.lineWidth = 1.6; // gợn cát
        moiBuoc(camX, a, b, 38, (i, x) => { if (x < a + 6 || x > b - 26) return; c.beginPath(); c.moveTo(x, y + 4); c.quadraticCurveTo(x + 10, y + 1 + bam(i) * 2, x + 20, y + 5); c.stroke(); });
        moiBuoc(camX, a, b, 110, (i, x) => { // vỏ ốc / sỏi trang trí
          if (bam(i * 3) > 0.35 || x < a + 8 || x > b - 8 || x > doDai - camX + 40) return;
          c.fillStyle = bam(i) < 0.5 ? "#fff4dc" : "#b98a50"; c.beginPath(); c.ellipse(x, y - 1, 5, 3.5, 0, Math.PI, PI2); c.fill();
        });
      });
    },
    mieng(x, w) { // cát chảy xuống miệng hố
      const c = this.c, y = this.dat, t = this.t;
      c.fillStyle = "#f7d48c";
      for (const ex of [x, x + w]) { c.beginPath(); c.arc(ex, y + 6, 7, 0, PI2); c.fill(); }
      c.fillStyle = "rgba(247,212,140,0.8)";
      for (let k = 0; k < 4; k++) { const u = (t * 1.5 + k / 4) % 1; c.beginPath(); c.arc(x + 4 + k * 2, y + 10 + u * 30, 1.8, 0, PI2); c.arc(x + w - 4 - k * 2, y + 10 + ((u + 0.5) % 1) * 30, 1.8, 0, PI2); c.fill(); }
    },

    nenHang(camX) { // hầm báu: tường đá chữ tượng hình, đuốc lửa, đống vàng
      const c = this.c, W = this.rong, Hc = this.cao, dat = this.dat, t = this.t;
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, "#3a2410"); gr.addColorStop(1, "#7a5228");
      c.fillStyle = gr; c.fillRect(0, 0, W, Hc);
      c.strokeStyle = "rgba(0,0,0,0.22)"; c.lineWidth = 2;
      for (let r = 0; r * 44 < dat; r++) {
        c.beginPath(); c.moveTo(0, r * 44); c.lineTo(W, r * 44); c.stroke();
        moiBuoc(camX * 0.5 + (r % 2) * 40, 0, W, 80, (i, x) => { c.beginPath(); c.moveTo(x, r * 44); c.lineTo(x, r * 44 + 44); c.stroke(); });
      }
      // bảng chữ tượng hình
      moiBuoc(camX * 0.5, -200, W + 200, 260, (i, x) => {
        const yb = Math.max(40, dat - 230);
        c.fillStyle = "rgba(230,190,110,0.35)"; c.beginPath(); c.roundRect(x + 20, yb, 120, 150, 6); c.fill();
        c.strokeStyle = "rgba(255,225,150,0.75)"; c.lineWidth = 3;
        const k = ((i % 3) + 3) % 3;
        for (let j = 0; j < 3; j++) {
          const cx = x + 80, cy = yb + 28 + j * 44;
          c.beginPath();
          if ((k + j) % 3 === 0) { c.ellipse(cx, cy, 16, 8, 0, 0, PI2); c.moveTo(cx + 4, cy); c.arc(cx, cy, 4, 0, PI2); } // con mắt
          else if ((k + j) % 3 === 1) { c.arc(cx, cy - 8, 7, 0, PI2); c.moveTo(cx, cy - 1); c.lineTo(cx, cy + 16); c.moveTo(cx - 10, cy + 4); c.lineTo(cx + 10, cy + 4); } // chìa khóa sự sống
          else { c.moveTo(cx - 14, cy + 10); c.lineTo(cx, cy - 12); c.lineTo(cx + 14, cy + 10); c.closePath(); } // kim tự tháp
          c.stroke();
        }
      });
      // đuốc
      moiBuoc(camX * 0.7, -100, W + 100, 200, (i, x) => {
        const yt = Math.max(70, dat - 120);
        c.fillStyle = "#6b4226"; c.fillRect(x + 96, yt, 8, 34);
        const nhip = 1 + Math.sin(t * 12 + i) * 0.15;
        c.fillStyle = "rgba(255,200,80,0.25)"; c.beginPath(); c.arc(x + 100, yt - 8, 40 * nhip, 0, PI2); c.fill();
        c.fillStyle = "#ff8c1a"; c.beginPath(); c.ellipse(x + 100, yt - 8, 9, 15 * nhip, 0, 0, PI2); c.fill();
        c.fillStyle = "#ffe27a"; c.beginPath(); c.ellipse(x + 100, yt - 4, 4, 8 * nhip, 0, 0, PI2); c.fill();
      });
      // nền: đá + đống vàng
      c.fillStyle = "#a87a3e"; c.fillRect(0, dat, W, Hc - dat);
      c.fillStyle = "#c99a52"; c.fillRect(0, dat, W, 8);
      moiBuoc(camX, -60, W + 60, 230, (i, x) => {
        if (bam(i) < 0.4) return;
        c.fillStyle = "#f2c230";
        for (let k = 0; k < 6; k++) { c.beginPath(); c.ellipse(x + 30 + (k % 3) * 12 + (k > 2 ? 6 : 0), dat - 4 - (k > 2 ? 7 : 0), 8, 4, 0, 0, PI2); c.fill(); }
        c.fillStyle = "#fff4a8"; c.beginPath(); c.arc(x + 40, dat - 12, 2, 0, PI2); c.fill();
      });
    },

    bongLauDai(x, y, k) {
      const c = this.c;
      c.fillStyle = "#c9935a";
      c.beginPath(); c.moveTo(x - 130 * k, y); c.lineTo(x, y - 150 * k); c.lineTo(x + 130 * k, y); c.fill();
      c.fillRect(x - 170 * k, y - 120 * k, 14 * k, 120 * k); c.fillRect(x + 156 * k, y - 120 * k, 14 * k, 120 * k);
    },

    lauDai(g) { // kim tự tháp lớn, đỉnh vàng, hai cột tháp, cửa đá trượt lên khi thắng
      const c = this.c, t = this.t;
      c.fillStyle = "#e8b86a"; c.beginPath(); c.moveTo(-200, 0); c.lineTo(0, -230); c.lineTo(200, 0); c.fill();
      c.fillStyle = "#cf9b52"; c.beginPath(); c.moveTo(0, -230); c.lineTo(200, 0); c.lineTo(40, 0); c.fill();
      c.strokeStyle = "rgba(140,90,40,0.35)"; c.lineWidth = 2;
      for (let r = 1; r < 9; r++) { const yy = -r * 25, nua = 200 * (1 - r * 25 / 230); c.beginPath(); c.moveTo(-nua, yy); c.lineTo(nua, yy); c.stroke(); }
      c.fillStyle = "#ffd23f"; c.beginPath(); c.moveTo(-26, -200); c.lineTo(0, -230); c.lineTo(26, -200); c.fill();
      c.fillStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.moveTo(-8, -214); c.lineTo(0, -224); c.lineTo(4, -216); c.fill();
      [-185, 185].forEach(dx => { // hai cột tháp
        c.fillStyle = "#d9a55c"; c.beginPath(); c.moveTo(dx - 14, 0); c.lineTo(dx - 9, -170); c.lineTo(dx + 9, -170); c.lineTo(dx + 14, 0); c.fill();
        c.fillStyle = "#ffd23f"; c.beginPath(); c.moveTo(dx - 9, -170); c.lineTo(dx, -188); c.lineTo(dx + 9, -170); c.fill();
        c.strokeStyle = "#a06a2a"; c.lineWidth = 2; for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(dx, -140 + j * 32, 4, 0, PI2); c.stroke(); }
      });
      // cửa
      c.fillStyle = "#3a2410"; c.beginPath(); c.roundRect(-120, -96, 64, 96, [6, 6, 0, 0]); c.fill();
      const mo = g.trangThai === "thang" ? Math.min(1, g.tKetThuc / 0.8) : 0;
      c.fillStyle = "#b8873e"; c.fillRect(-120, -96, 64, 96 - mo * 80);
      c.strokeStyle = "#8a5a24"; c.lineWidth = 2; c.strokeRect(-116, -92, 56, Math.max(2, 88 - mo * 80));
      c.fillStyle = "#fff"; c.beginPath(); c.roundRect(-20, -140, 120, 30, 10); c.fill();
      c.strokeStyle = "#e0a83a"; c.lineWidth = 3; c.stroke();
      c.fillStyle = "#7a4a12"; c.font = '800 18px "Baloo 2", "Be Vietnam Pro", system-ui, sans-serif'; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("Kim Tự Tháp", 40, -124);
      void t;
    }
  };
  function veChaLa(c, x, y, k, t, i) {
    c.strokeStyle = "#a0703a"; c.lineWidth = 7 * k; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 8 * k, y - 40 * k, x + 4 * k, y - 78 * k); c.stroke();
    const dx = x + 4 * k, dy = y - 78 * k, lac = Math.sin(t * 1.5 + i) * 0.06;
    c.fillStyle = "#4fae5a";
    for (let j = 0; j < 6; j++) {
      const a = (j - 2.5) * 0.62 + lac;
      c.save(); c.translate(dx, dy); c.rotate(a); c.beginPath(); c.ellipse(0, -18 * k, 7 * k, 22 * k, 0, 0, PI2); c.fill(); c.restore();
    }
    c.fillStyle = "#8a4a24"; c.beginPath(); c.arc(dx - 4 * k, dy + 4 * k, 3.5 * k, 0, PI2); c.arc(dx + 4 * k, dy + 5 * k, 3.5 * k, 0, PI2); c.fill();
  }
  function veXuongRongNen(c, x, y, k) {
    c.fillStyle = "#5fae5a";
    c.beginPath(); c.roundRect(x - 7 * k, y - 50 * k, 14 * k, 50 * k, 7 * k); c.fill();
    c.beginPath(); c.roundRect(x - 20 * k, y - 34 * k, 8 * k, 18 * k, 4 * k); c.roundRect(x - 20 * k, y - 22 * k, 16 * k, 8 * k, 4 * k); c.fill();
    c.beginPath(); c.roundRect(x + 12 * k, y - 42 * k, 8 * k, 18 * k, 4 * k); c.roundRect(x + 4 * k, y - 30 * k, 16 * k, 8 * k, 4 * k); c.fill();
  }

  /* ================================================================
     QUÁI / VẬT CẢN SA MẠC
     ================================================================ */
  ST.VE_QUAI = ST.VE_QUAI || {};
  Object.assign(ST.VE_QUAI, {
    daCat(w, h) { // tảng đá cát có vân lớp
      const c = this.c;
      c.fillStyle = "#d39a52"; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w / 2 + 4, -h * 0.7); c.quadraticCurveTo(-w * 0.1, -h - 4, w * 0.3, -h * 0.9); c.lineTo(w / 2, -h * 0.4); c.lineTo(w / 2, 0); c.fill();
      c.strokeStyle = "rgba(255,240,200,0.5)"; c.lineWidth = 2;
      [0.3, 0.55].forEach(k => { c.beginPath(); c.moveTo(-w / 2 + 3, -h * k); c.quadraticCurveTo(0, -h * k - 4, w / 2 - 2, -h * k + 2); c.stroke(); });
      c.fillStyle = "rgba(120,70,30,0.25)"; c.beginPath(); c.moveTo(w * 0.15, -h * 0.9); c.lineTo(w / 2, -h * 0.4); c.lineTo(w / 2, 0); c.lineTo(w * 0.2, 0); c.fill();
    },
    binhGom(w, h, t, o) { // bình gốm hai quai có hoa văn
      const c = this.c, mau = ["#d9773a", "#3fa3b8", "#b8584a"][(o.bienThe || 0) % 3];
      c.fillStyle = mau;
      c.beginPath(); c.ellipse(0, -h * 0.42, w / 2, h * 0.4, 0, 0, PI2); c.fill();
      c.fillRect(-w * 0.18, -h, w * 0.36, h * 0.3);
      c.beginPath(); c.ellipse(0, -h, w * 0.26, 4, 0, 0, PI2); c.fill();
      c.strokeStyle = mau; c.lineWidth = 4; c.beginPath(); c.arc(-w * 0.32, -h * 0.72, 7, Math.PI * 0.5, Math.PI * 1.5); c.arc(w * 0.32, -h * 0.72, 7, -Math.PI * 0.5, Math.PI * 0.5); c.stroke();
      c.fillStyle = "#ffe8b0"; c.fillRect(-w / 2 + 3, -h * 0.5, w - 6, 6);
      c.fillStyle = "#2B2640"; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 8 - 3, -h * 0.47); c.lineTo(i * 8, -h * 0.5 + 1); c.lineTo(i * 8 + 3, -h * 0.47); c.fill(); }
      c.fillStyle = "rgba(255,255,255,0.3)"; c.beginPath(); c.ellipse(-w * 0.2, -h * 0.35, 4, 9, 0.2, 0, PI2); c.fill();
      c.fillStyle = "#e8c27a"; c.beginPath(); c.ellipse(0, -2, w * 0.3, 3, 0, 0, PI2); c.fill();
    },
    cotDo(w, h) { // cột đá đổ nằm ngang, có rãnh dọc
      const c = this.c;
      c.fillStyle = "#e9cc94"; c.beginPath(); c.roundRect(-w / 2 + h * 0.25, -h, w - h * 0.25, h, 4); c.fill();
      c.strokeStyle = "#c9a464"; c.lineWidth = 2; for (let i = 1; i <= 3; i++) { c.beginPath(); c.moveTo(-w / 2 + h * 0.4, -h * i / 4); c.lineTo(w / 2 - 6, -h * i / 4); c.stroke(); }
      c.fillStyle = "#d8b878"; c.beginPath(); c.ellipse(-w / 2 + h * 0.25, -h / 2, h * 0.28, h / 2, 0, 0, PI2); c.fill();
      c.strokeStyle = "#b8945a"; c.beginPath(); c.ellipse(-w / 2 + h * 0.25, -h / 2, h * 0.16, h * 0.3, 0, 0, PI2); c.stroke();
      c.fillStyle = "#cfa970"; c.fillRect(w / 2 - 10, -h - 3, 10, h + 3);
    },
    xuongRong(w, h) { // xương rồng có hoa hồng và gai
      const c = this.c;
      c.fillStyle = "#4fa85a";
      c.beginPath(); c.roundRect(-w * 0.16, -h, w * 0.32, h, w * 0.16); c.fill();
      c.beginPath(); c.roundRect(-w / 2, -h * 0.72, w * 0.18, h * 0.38, 6); c.roundRect(-w / 2, -h * 0.44, w * 0.42, w * 0.16, 6); c.fill();
      c.beginPath(); c.roundRect(w * 0.32, -h * 0.82, w * 0.18, h * 0.42, 6); c.roundRect(w * 0.08, -h * 0.5, w * 0.42, w * 0.16, 6); c.fill();
      c.strokeStyle = "#2f7d3a"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -h + 6); c.lineTo(0, -4); c.stroke();
      c.fillStyle = "#fff8d0"; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc((i % 2 ? -1 : 1) * w * 0.12, -h * 0.15 - i * h * 0.1, 1.4, 0, PI2); c.fill(); }
      c.fillStyle = "#ff6aa8"; c.beginPath(); for (let i = 0; i < 5; i++) { const a = i * PI2 / 5; c.ellipse(Math.cos(a) * 4, -h - 2 + Math.sin(a) * 4, 4, 3, a, 0, PI2); } c.fill();
      c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(0, -h - 2, 2.6, 0, PI2); c.fill();
    },
    ruongCo(w, h) { // rương gỗ nẹp vàng, hé mở lấp lánh
      const c = this.c, than = h * 0.62;
      c.fillStyle = "#9a5a2a"; c.beginPath(); c.roundRect(-w / 2, -than, w, than, 4); c.fill();
      c.fillStyle = "#ffd23f"; c.fillRect(-w / 2, -than, w, 4); c.fillRect(-w * 0.32, -than, 5, than); c.fillRect(w * 0.26, -than, 5, than);
      c.fillStyle = "#fff4a8"; c.beginPath(); c.ellipse(0, -than - 3, w * 0.4, 6, 0, Math.PI, PI2); c.fill();
      c.save(); c.translate(-w / 2, -than); c.rotate(-0.28);
      c.fillStyle = "#a8682f"; c.beginPath(); c.roundRect(0, -h * 0.34, w, h * 0.34, [10, 10, 2, 2]); c.fill();
      c.fillStyle = "#ffd23f"; c.fillRect(0, -4, w, 4); c.fillRect(w * 0.18, -h * 0.34, 5, h * 0.34); c.fillRect(w * 0.76, -h * 0.34, 5, h * 0.34);
      c.restore();
      c.fillStyle = "#f2c230"; c.beginPath(); c.roundRect(-5, -than * 0.6, 10, 12, 3); c.fill();
      c.fillStyle = "#3a2410"; c.beginPath(); c.arc(0, -than * 0.6 + 6, 1.8, 0, PI2); c.fill();
    },
    dunCat(w, h) { // đụn cát nhỏ có cây cỏ khô
      const c = this.c;
      c.fillStyle = "#e89a40"; c.beginPath(); c.moveTo(-w / 2, 0); c.quadraticCurveTo(-w * 0.1, -h * 1.25, w / 2, 0); c.fill();
      c.strokeStyle = "#b8702a"; c.lineWidth = 2.5; c.stroke();
      c.fillStyle = "#c97a30"; c.beginPath(); c.moveTo(-w * 0.05, -h * 0.62); c.quadraticCurveTo(w * 0.2, -h * 0.5, w / 2, 0); c.lineTo(w * 0.05, 0); c.fill();
      c.strokeStyle = "rgba(255,255,255,0.5)"; c.lineWidth = 1.6;
      [0.3, 0.5].forEach(k => { c.beginPath(); c.moveTo(-w * 0.35, -h * k); c.quadraticCurveTo(-w * 0.15, -h * k - 4, 0, -h * k); c.stroke(); });
      c.strokeStyle = "#9a7a3a"; c.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(-w * 0.15, -h * 0.58); c.lineTo(-w * 0.15 + i * 5, -h * 0.58 - 12 + Math.abs(i) * 3); c.stroke(); }
    },
    tuongNhanSu(w, h) { // tượng nhân sư trên bệ: khăn sọc xanh vàng, quá cao để nhảy qua
      const c = this.c, be = h * 0.18, than = h * 0.42;
      c.fillStyle = "#c99448"; c.beginPath(); c.roundRect(-w / 2, -be, w, be, 3); c.fill();
      c.fillStyle = "#e0b066"; c.fillRect(-w / 2, -be, w, 5);
      c.fillStyle = "#e8bf78"; c.beginPath(); c.roundRect(-w * 0.42, -be - than, w * 0.84, than, [14, 14, 2, 2]); c.fill(); // thân ngồi
      c.fillStyle = "#d9a85e"; c.beginPath(); c.roundRect(-w * 0.46, -be - 16, w * 0.4, 16, 6); c.fill(); // chân trước
      const dy = -h + h * 0.22;
      c.fillStyle = "#3f7fd0"; c.beginPath(); c.moveTo(-w * 0.45, dy + h * 0.2); c.lineTo(-w * 0.3, -h + 6); c.lineTo(w * 0.3, -h + 6); c.lineTo(w * 0.45, dy + h * 0.2); c.closePath(); c.fill();
      c.fillStyle = "#ffd23f"; for (let i = 0; i < 4; i++) c.fillRect(-w * 0.42 + i * w * 0.22, -h + 10, w * 0.1, h * 0.36);
      c.fillStyle = "#f0c886"; c.beginPath(); c.roundRect(-w * 0.24, -h + 18, w * 0.48, h * 0.24, 10); c.fill(); // mặt
      c.fillStyle = "#2B2640"; c.beginPath(); c.ellipse(-w * 0.1, -h + 34, 3.5, 2.5, 0, 0, PI2); c.ellipse(w * 0.1, -h + 34, 3.5, 2.5, 0, 0, PI2); c.fill();
      c.strokeStyle = "#2B2640"; c.lineWidth = 2; c.beginPath(); c.moveTo(-w * 0.18, -h + 30); c.lineTo(-w * 0.03, -h + 31); c.moveTo(w * 0.03, -h + 31); c.lineTo(w * 0.18, -h + 30); c.stroke();
      c.beginPath(); c.moveTo(-6, -h + 50); c.lineTo(6, -h + 50); c.stroke();
      c.fillStyle = "#3f7fd0"; c.beginPath(); c.roundRect(-4, -h + 58, 8, 14, 3); c.fill(); // râu
    },
    thapDa(w, h) { // cột tháp đá nhọn khắc chữ tượng hình, đỉnh vàng
      const c = this.c;
      c.fillStyle = "#e6c486"; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w * 0.3, -h + 26); c.lineTo(w * 0.3, -h + 26); c.lineTo(w / 2, 0); c.fill();
      c.fillStyle = "#cfa266"; c.beginPath(); c.moveTo(w * 0.1, -h + 26); c.lineTo(w * 0.3, -h + 26); c.lineTo(w / 2, 0); c.lineTo(w * 0.16, 0); c.fill();
      c.fillStyle = "#ffd23f"; c.beginPath(); c.moveTo(-w * 0.3, -h + 26); c.lineTo(0, -h); c.lineTo(w * 0.3, -h + 26); c.fill();
      c.strokeStyle = "#8a5a24"; c.lineWidth = 2.2;
      for (let j = 0; j < 5; j++) {
        const cy = -h + 52 + j * 28;
        c.beginPath();
        if (j % 3 === 0) { c.ellipse(-2, cy, 9, 5, 0, 0, PI2); c.moveTo(1, cy); c.arc(-2, cy, 2.5, 0, PI2); }
        else if (j % 3 === 1) { c.arc(-2, cy - 5, 4, 0, PI2); c.moveTo(-2, cy - 1); c.lineTo(-2, cy + 9); c.moveTo(-8, cy + 2); c.lineTo(4, cy + 2); }
        else { c.moveTo(-10, cy + 4); c.quadraticCurveTo(-2, cy - 10, 6, cy + 4); }
        c.stroke();
      }
    },
    boHung(w, h, t, o) { // bọ hung xanh bóng đẩy viên bi đất về phía bé
      const c = this.c, r = h * 0.45, lan = o.dangDi ? -t * 6 : 0;
      c.save(); c.translate(-w / 2 + r, -r); c.rotate(lan);
      c.fillStyle = "#a8743a"; c.beginPath(); c.arc(0, 0, r, 0, PI2); c.fill();
      c.fillStyle = "#8a5a2a"; [[-0.4, -0.3], [0.3, 0.2], [-0.1, 0.5], [0.4, -0.45]].forEach(([a, b]) => { c.beginPath(); c.arc(a * r, b * r, 3, 0, PI2); c.fill(); });
      c.restore();
      const bx = w * 0.22, by = -h * 0.4, nhun = o.dangDi ? Math.abs(Math.sin(t * 12)) * 2 : 0;
      c.strokeStyle = "#1d3b44"; c.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(bx - 8 + i * 8, by + 6); c.lineTo(bx - 12 + i * 10 + nhun, -2); c.stroke(); }
      c.fillStyle = "#1f8a8a"; c.beginPath(); c.ellipse(bx, by - nhun, w * 0.22, h * 0.3, 0, 0, PI2); c.fill();
      c.strokeStyle = "#145a5a"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx, by - h * 0.28 - nhun); c.lineTo(bx, by + h * 0.28 - nhun); c.stroke();
      c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.ellipse(bx - 5, by - 8 - nhun, 4, 7, 0.4, 0, PI2); c.fill();
      c.fillStyle = "#1d3b44"; c.beginPath(); c.arc(bx - w * 0.2, by + 2 - nhun, 7, 0, PI2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(bx - w * 0.24, by - nhun, 3, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(bx - w * 0.25, by - nhun, 1.5, 0, PI2); c.fill();
    },
    ruaSaMac(w, h, t, o) { // rùa mai cao hoa văn lục giác
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 6) : 0;
      c.fillStyle = "#9fbf6a"; c.beginPath(); c.ellipse(-w * 0.28 + buoc * 3, -5, 8, 6, 0, 0, PI2); c.ellipse(w * 0.25 - buoc * 3, -5, 8, 6, 0, 0, PI2); c.fill();
      c.beginPath(); c.ellipse(-w * 0.44, -h * 0.4, w * 0.13, h * 0.16, -0.3, 0, PI2); c.fill(); // đầu
      c.fillStyle = "#a8743a"; c.beginPath(); c.ellipse(0, -h * 0.35, w * 0.4, h * 0.6, 0, Math.PI, PI2); c.fill();
      c.fillStyle = "#c99448"; c.fillRect(-w * 0.42, -h * 0.38, w * 0.84, 6);
      c.strokeStyle = "#7a4a1e"; c.lineWidth = 2;
      [[-0.18, -0.62], [0.12, -0.66], [-0.02, -0.82], [0.28, -0.48], [-0.3, -0.48]].forEach(([a, b]) => {
        c.beginPath(); for (let k = 0; k < 6; k++) { const g = k * PI2 / 6; c.lineTo(a * w + Math.cos(g) * 7, b * h + Math.sin(g) * 6); } c.closePath(); c.stroke();
      });
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.48, -h * 0.45, 2.4, 0, PI2); c.fill();
      c.strokeStyle = "#2B2640"; c.lineWidth = 1.5; c.beginPath(); c.arc(-w * 0.47, -h * 0.34, 3, 0.2, Math.PI - 0.6); c.stroke();
    },
    boCap(w, h, t, o) { // bọ cạp cam, càng giơ ra trước, đuôi cong có ngòi
      const c = this.c, kep = (o.dangDi ? Math.sin(t * 10) : Math.sin(t * 3)) * 0.25, lac = Math.sin(t * 4) * 3;
      c.strokeStyle = "#a8481e"; c.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-w * 0.12 + i * 7, -h * 0.25); c.lineTo(-w * 0.2 + i * 9, 0); c.stroke(); }
      c.fillStyle = "#e8743a";
      for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(-w * 0.12 + i * w * 0.12, -h * 0.3, w * 0.11, h * 0.2, 0, 0, PI2); c.fill(); }
      // đuôi
      c.strokeStyle = "#e8743a"; c.lineWidth = 7; c.beginPath(); c.moveTo(w * 0.3, -h * 0.32); c.quadraticCurveTo(w * 0.55, -h * 0.9, w * 0.2 + lac * 0.5, -h - 2); c.stroke();
      c.fillStyle = "#7a2a10"; c.beginPath(); c.moveTo(w * 0.2 + lac * 0.5, -h - 6); c.lineTo(w * 0.06 + lac * 0.5, -h + 2); c.lineTo(w * 0.22 + lac * 0.5, -h + 3); c.fill();
      // càng
      [[-1, -h * 0.55], [1, -h * 0.25]].forEach(([s, y]) => {
        c.save(); c.translate(-w * 0.36, y); c.rotate(s * kep);
        c.fillStyle = "#e8743a"; c.beginPath(); c.ellipse(-6, 0, 9, 6, 0, 0, PI2); c.fill();
        c.fillStyle = "#c2551e"; c.beginPath(); c.moveTo(-10, -2); c.lineTo(-18, -6); c.lineTo(-12, 1); c.lineTo(-18, 5); c.lineTo(-10, 3); c.fill();
        c.restore();
      });
      this.mat(-w * 0.2, -h * 0.42, 3.2, true);
    },
    thanLan(w, h, t, o) { // thằn lằn đốm chạy uốn mình
      const c = this.c, uon = (o.dangDi ? Math.sin(t * 14) : Math.sin(t * 2)) * 3;
      c.strokeStyle = "#7bbf4a"; c.lineCap = "round"; c.lineWidth = h * 0.35;
      c.beginPath(); c.moveTo(-w * 0.2, -h * 0.4); c.quadraticCurveTo(w * 0.15, -h * 0.4 + uon, w * 0.25, -h * 0.4); c.stroke();
      c.lineWidth = 5; c.beginPath(); c.moveTo(w * 0.25, -h * 0.4); c.quadraticCurveTo(w * 0.4, -h * 0.6 - uon, w / 2, -h * 0.2); c.stroke();
      c.lineWidth = 3.5;
      [[-0.1, 1], [0.15, -1]].forEach(([a, s]) => { c.beginPath(); c.moveTo(a * w, -h * 0.35); c.lineTo(a * w - 6 + s * uon, -2); c.stroke(); });
      c.fillStyle = "#7bbf4a"; c.beginPath(); c.ellipse(-w * 0.33, -h * 0.45, w * 0.16, h * 0.3, -0.15, 0, PI2); c.fill();
      c.fillStyle = "#ffb03b"; [[-0.05, -0.45], [0.1, -0.5], [0.2, -0.42]].forEach(([a, b]) => { c.beginPath(); c.arc(a * w, b * h, 2.4, 0, PI2); c.fill(); });
      this.mat(-w * 0.38, -h * 0.6, 2.8, true);
      c.strokeStyle = "#e8344e"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-w * 0.48, -h * 0.4); c.lineTo(-w * 0.55, -h * 0.42 + uon * 0.5); c.stroke();
    },
    xacUop(w, h, t, o) { veXacUop.call(this, w, h, t, o, false); },
    xacUopKhongLo(w, h, t, o) { veXacUop.call(this, w, h, t, o, true); },
    xuongRongKhongLo(w, h, t, o) { // xương rồng khổng lồ biết đi, đội vương miện hoa
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 5) : 0, lac = Math.sin(t * 2) * 0.03;
      c.fillStyle = "#3f8f4a"; c.beginPath(); c.ellipse(-w * 0.18 + buoc * 5, -5, 12, 6, 0, 0, PI2); c.ellipse(w * 0.18 - buoc * 5, -5, 12, 6, 0, 0, PI2); c.fill();
      c.save(); c.rotate(lac);
      c.fillStyle = "#4fa85a"; c.beginPath(); c.roundRect(-w * 0.3, -h + 10, w * 0.6, h - 14, w * 0.3); c.fill();
      c.beginPath(); c.roundRect(-w / 2, -h * 0.7 + buoc * 6, w * 0.2, h * 0.3, 8); c.fill();
      c.beginPath(); c.roundRect(w * 0.3, -h * 0.78 - buoc * 6, w * 0.2, h * 0.3, 8); c.fill();
      c.strokeStyle = "#2f7d3a"; c.lineWidth = 2; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * w * 0.14, -h + 24); c.lineTo(i * w * 0.14, -10); c.stroke(); }
      c.fillStyle = "#fff8d0"; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc((bam(i) - 0.5) * w * 0.5, -h * (0.1 + bam(i + 3) * 0.8), 1.5, 0, PI2); c.fill(); }
      this.mat(-w * 0.06, -h * 0.68, 7, true);
      c.fillStyle = "#1d5a2a"; c.beginPath(); c.ellipse(-w * 0.06, -h * 0.55, 10, 6, 0, 0, Math.PI); c.fill();
      ["#ff6aa8", "#ffd23f", "#ff8c1a"].forEach((m, i) => { c.fillStyle = m; c.beginPath(); c.arc(-14 + i * 14, -h + 8 - (i === 1 ? 6 : 0), 7, 0, PI2); c.fill(); });
      c.restore();
    },
    kenKen(w, h, t) { // kền kền đầu hồng trọc, cánh nâu vỗ
      const c = this.c, vo = Math.sin(t * 12);
      c.fillStyle = "#6b4226";
      c.beginPath(); c.moveTo(-4, -h * 0.5); c.lineTo(w * 0.1, -h * 0.5 - 6 - vo * 16); c.lineTo(w * 0.42, -h * 0.4 - vo * 10); c.lineTo(w * 0.3, -h * 0.35); c.fill();
      c.fillStyle = "#7a5030"; c.beginPath(); c.ellipse(w * 0.05, -h * 0.4, w * 0.32, h * 0.3, 0, 0, PI2); c.fill();
      c.fillStyle = "#fff4e0"; c.beginPath(); c.ellipse(-w * 0.2, -h * 0.55, 9, 7, 0, 0, PI2); c.fill(); // cổ lông trắng
      c.fillStyle = "#ffaaa0"; c.beginPath(); c.arc(-w * 0.32, -h * 0.72, h * 0.2, 0, PI2); c.fill();
      c.fillStyle = "#e8b04a"; c.beginPath(); c.moveTo(-w * 0.44, -h * 0.76); c.lineTo(-w * 0.56, -h * 0.66); c.lineTo(-w * 0.42, -h * 0.64); c.fill();
      this.mat(-w * 0.34, -h * 0.76, 2.6, true);
    },
    chauChau(w, h, t) { // châu chấu xanh bay
      const c = this.c, vo = Math.sin(t * 30);
      c.fillStyle = "rgba(220,255,200,0.75)"; c.beginPath(); c.ellipse(w * 0.05, -h * 0.75 - vo * 4, 8, 16, 0.9 + vo * 0.2, 0, PI2); c.ellipse(w * 0.15, -h * 0.72 + vo * 4, 7, 14, 1.2, 0, PI2); c.fill();
      c.fillStyle = "#6cbf3a"; c.beginPath(); c.ellipse(w * 0.05, -h * 0.45, w * 0.4, h * 0.2, -0.1, 0, PI2); c.fill();
      c.strokeStyle = "#4a9a2a"; c.lineWidth = 3; c.beginPath(); c.moveTo(w * 0.15, -h * 0.4); c.lineTo(w * 0.35, -h * 0.85); c.lineTo(w * 0.48, -h * 0.25); c.stroke();
      c.fillStyle = "#7fd14a"; c.beginPath(); c.arc(-w * 0.34, -h * 0.5, h * 0.22, 0, PI2); c.fill();
      c.strokeStyle = "#2B2640"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-w * 0.38, -h * 0.68); c.quadraticCurveTo(-w * 0.5, -h, -w * 0.6, -h * 0.9); c.stroke();
      this.mat(-w * 0.36, -h * 0.55, 2.8, true);
    },
    doiTaiTo(w, h, t) { // dơi tai to màu cát
      const c = this.c, vo = Math.sin(t * 18), cy = -h / 2;
      c.fillStyle = "#b98a50";
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * 6, cy); c.lineTo(s * w * 0.5, cy - 10 - vo * 10); c.lineTo(s * w * 0.4, cy + 4 - vo * 4); c.lineTo(s * w * 0.26, cy - 1 - vo * 5); c.lineTo(s * w * 0.18, cy + 8); c.closePath(); c.fill(); });
      c.fillStyle = "#e0b070"; c.beginPath(); c.ellipse(0, cy, 11, h * 0.4, 0, 0, PI2); c.fill();
      c.beginPath(); c.ellipse(-8, cy - h * 0.45, 6, 13, -0.4, 0, PI2); c.ellipse(8, cy - h * 0.45, 6, 13, 0.4, 0, PI2); c.fill();
      c.fillStyle = "#ffb0b0"; c.beginPath(); c.ellipse(-8, cy - h * 0.45, 3, 8, -0.4, 0, PI2); c.ellipse(8, cy - h * 0.45, 3, 8, 0.4, 0, PI2); c.fill();
      this.mat(-2, cy - 3, 3, true);
    },
    thamBay(w, h, t) { // tấm thảm bay gợn sóng có đôi mắt, tua rua hai đầu
      const c = this.c, song = k => Math.sin(t * 7 + k) * 5;
      c.fillStyle = "#c0392b"; c.beginPath(); c.moveTo(-w / 2, -h * 0.5 + song(0));
      for (let k = 1; k <= 6; k++) c.lineTo(-w / 2 + k * w / 6, -h * 0.5 + song(k));
      for (let k = 6; k >= 0; k--) c.lineTo(-w / 2 + k * w / 6, -h * 0.15 + song(k));
      c.fill();
      c.strokeStyle = "#ffd23f"; c.lineWidth = 2.5; c.beginPath();
      for (let k = 0; k <= 6; k++) c.lineTo(-w / 2 + k * w / 6, -h * 0.42 + song(k));
      c.stroke();
      c.fillStyle = "#3fb6a8"; for (let k = 1; k < 6; k += 2) { c.beginPath(); c.arc(-w / 2 + k * w / 6, -h * 0.3 + song(k), 3, 0, PI2); c.fill(); }
      c.strokeStyle = "#ffd23f"; c.lineWidth = 1.5;
      for (let j = 0; j < 3; j++) { c.beginPath(); c.moveTo(w / 2, -h * 0.45 + j * 5 + song(6)); c.lineTo(w / 2 + 7, -h * 0.47 + j * 6 + song(6)); c.stroke(); }
      this.mat(-w * 0.32, -h * 0.66 + song(1), 3.6, true);
    }
  });

  // Xác ướp (thường / khổng lồ): quấn băng, hai tay giơ ra trước, mắt nhìn qua khe băng
  function veXacUop(w, h, t, o, khongLo) {
    const c = this.c, buoc = o.dangDi ? Math.sin(t * (khongLo ? 5 : 10)) : 0, lac = Math.sin(t * 2) * 0.03;
    c.save(); c.rotate(lac);
    c.fillStyle = "#e8e0c8"; c.strokeStyle = "#e8e0c8"; c.lineCap = "round";
    c.lineWidth = w * 0.22; c.beginPath(); c.moveTo(-w * 0.12, -h * 0.35); c.lineTo(-w * 0.16 + buoc * 5, -w * 0.11); c.moveTo(w * 0.12, -h * 0.35); c.lineTo(w * 0.16 - buoc * 5, -w * 0.11); c.stroke();
    c.beginPath(); c.roundRect(-w * 0.3, -h * 0.78, w * 0.6, h * 0.48, w * 0.2); c.fill();
    c.lineWidth = w * 0.16; c.beginPath(); c.moveTo(-w * 0.2, -h * 0.66); c.lineTo(-w * 0.5, -h * 0.62 + buoc * 3); c.moveTo(w * 0.15, -h * 0.66); c.lineTo(-w * 0.35, -h * 0.55 - buoc * 3); c.stroke();
    c.beginPath(); c.arc(0, -h * 0.84, w * 0.27, 0, PI2); c.fill();
    c.strokeStyle = "#c8bc9a"; c.lineWidth = 1.6;
    for (let i = 0; i < 9; i++) { const yy = -h * 0.95 + i * h * 0.1; c.beginPath(); c.moveTo(-w * 0.3, yy + (i % 2) * 4); c.lineTo(w * 0.3, yy + 6 - (i % 2) * 4); c.stroke(); }
    c.fillStyle = "#2B2640"; c.beginPath(); c.roundRect(-w * 0.24, -h * 0.88, w * 0.4, 9, 4); c.fill();
    c.fillStyle = khongLo ? "#ff5a5f" : "#ffd23f"; c.beginPath(); c.arc(-w * 0.14, -h * 0.84, khongLo ? 3.5 : 2.4, 0, PI2); c.arc(w * 0.04, -h * 0.84, khongLo ? 3.5 : 2.4, 0, PI2); c.fill();
    c.strokeStyle = "#e8e0c8"; c.lineWidth = 4; c.beginPath(); c.moveTo(w * 0.2, -h * 0.5); c.quadraticCurveTo(w * 0.45, -h * 0.45 + Math.sin(t * 5) * 4, w * 0.4, -h * 0.3); c.stroke(); // dải băng tuột
    if (khongLo) {
      c.fillStyle = "#3f7fd0"; c.beginPath(); c.moveTo(-w * 0.3, -h * 0.9); c.lineTo(-w * 0.2, -h - 2); c.lineTo(w * 0.2, -h - 2); c.lineTo(w * 0.3, -h * 0.9); c.fill();
      c.fillStyle = "#ffd23f"; for (let i = 0; i < 3; i++) c.fillRect(-w * 0.18 + i * w * 0.14, -h - 2, w * 0.07, h * 0.1);
    }
    c.restore();
  }
})(typeof window !== "undefined" ? window : globalThis);
