/* ================================================================
   FILE: san_tu/st_ve_nuilua.js
   CHỨC NĂNG: HÌNH VẼ đường đua 7 "Núi lửa" (game Giải Cứu Mèo Con).
              Cảnh: trời đỏ cam, núi lửa phun, dòng dung nham, tàn lửa bay lên; đường đá bazan có
              khe sáng; hố dung nham sôi; hang đá quý dung nham; pháo đài lửa ở màn 7; bé đội mũ bảo
              hộ có đèn. 19 quái / vật cản vùng núi lửa (màu sáng để nổi trên nền tối).
              Quy ước giống st_ve_keo.js: gốc tọa độ giữa đáy vật, mặt quay sang TRÁI, "this" là BoVe.
   BƯỚC: TC_00F
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST;
  const { PI2, tronMau, bam, chiaDuong, moiBuoc } = ST.VE_CHUNG;

  ST.CHU_DE_VE = ST.CHU_DE_VE || {};
  ST.CHU_DE_VE.nuiLua = {
    cong: { soc: "#ff6a1a", nut: "#ffd23f" },
    mauGoHang: ["#5a3a3a", "#ff9a4a"],
    phuongTien: { truoc() { // mũ bảo hộ vàng có đèn
      const c = this.c, t = this.t;
      c.fillStyle = "#ffcc1a"; c.beginPath(); c.arc(2, -64, 21, Math.PI, PI2); c.fill();
      c.fillRect(-22, -66, 46, 6);
      c.fillStyle = "#e8a800"; c.fillRect(-1, -85, 6, 20);
      c.fillStyle = "#fff8c0"; c.beginPath(); c.arc(16, -74, 5, 0, PI2); c.fill();
      c.fillStyle = `rgba(255,236,120,${0.4 + Math.sin(t * 4) * 0.05})`; c.beginPath(); c.moveTo(19, -77); c.lineTo(60, -90); c.lineTo(60, -58); c.lineTo(19, -71); c.fill();
    } },

    nen(camX, p) {
      const c = this.c, W = this.rong, H = this.cao, dat = this.dat, t = this.t;
      const s = Math.max(0, (p - 0.45) / 0.55);
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, tronMau("#6a2a4a", "#3a1030", s));
      gr.addColorStop(0.7, tronMau("#d8603a", "#c0402a", s));
      gr.addColorStop(1, "#ffb060");
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // núi lửa xa có dòng dung nham
      this.veLop(camX, 0.15, 520, dat, (x, y, i) => {
        const cx = x + 260, r = 170 + bam(i) * 110, dinh = dat - r;
        c.fillStyle = "#4a2030"; c.beginPath(); c.moveTo(cx - r * 1.3, dat); c.lineTo(cx - 30, dinh); c.lineTo(cx + 30, dinh); c.lineTo(cx + r * 1.3, dat); c.fill();
        c.strokeStyle = "#ff8a2a"; c.lineWidth = 6; c.lineCap = "round";
        c.beginPath(); c.moveTo(cx - 10, dinh + 4); c.quadraticCurveTo(cx - 40, dinh + r * 0.4, cx - r * 0.5, dat - 10); c.stroke();
        c.lineWidth = 4; c.beginPath(); c.moveTo(cx + 14, dinh + 4); c.quadraticCurveTo(cx + 30, dinh + r * 0.5, cx + r * 0.4, dat - 6); c.stroke();
        const nhip = (Math.sin(t * 2 + i) + 1) / 2;
        c.fillStyle = `rgba(255,190,60,${0.4 + nhip * 0.4})`; c.beginPath(); c.ellipse(cx, dinh, 30, 8, 0, 0, PI2); c.fill();
        c.fillStyle = "rgba(60,30,40,0.45)";
        for (let k = 0; k < 4; k++) { const u = (t * 0.1 + k / 4 + bam(i) * 0.3) % 1; c.beginPath(); c.arc(cx + u * 50, dinh - 20 - u * 150, 16 + u * 36, 0, PI2); c.fill(); }
      });
      if (p > 0.45) {
        const a = Math.min(1, (p - 0.45) / 0.15), x = W + 60 - (p - 0.45) / 0.55 * W * 0.35;
        c.globalAlpha = 0.6 * a; ST.CHU_DE_VE.nuiLua.bongLauDai.call(this, x, dat - 60, 0.45); c.globalAlpha = 1;
      }
      // đồi đá gần
      this.veLop(camX, 0.4, 280, dat - 30, (x, y, i) => {
        c.fillStyle = i % 2 ? "#5a2a30" : "#4a2228";
        c.beginPath(); c.moveTo(x - 50, dat); c.lineTo(x + 40, dat - 60 - bam(i) * 50); c.lineTo(x + 120, dat - 80 - bam(i + 1) * 40); c.lineTo(x + 220, dat - 40); c.lineTo(x + 320, dat); c.fill();
      });
      // cây cháy, đá phía sau đường
      this.veLop(camX, 0.7, 160, dat, (x, y, i) => {
        const xx = x + 40 + bam(i) * 60, k = 0.8 + bam(i + 2) * 0.5;
        if (bam(i + 5) < 0.5) {
          c.strokeStyle = "#2a1a1a"; c.lineWidth = 6 * k; c.lineCap = "round";
          c.beginPath(); c.moveTo(xx, dat); c.lineTo(xx, dat - 60 * k); c.moveTo(xx, dat - 36 * k); c.lineTo(xx - 18 * k, dat - 54 * k); c.moveTo(xx, dat - 46 * k); c.lineTo(xx + 16 * k, dat - 66 * k); c.stroke();
        } else { c.fillStyle = "#3a2228"; c.beginPath(); c.ellipse(xx, dat - 4, 26 * k, 18 * k, 0, Math.PI, PI2); c.fill(); }
      });
      // tàn lửa bay lên
      for (let i = 0; i < 34; i++) {
        const x = ((bam(i) * W * 1.3 - camX * 0.3 + Math.sin(t * 2 + i) * 10) % W + W) % W, y = dat - ((bam(i + 50) * H + t * (40 + bam(i + 9) * 40)) % dat);
        c.fillStyle = bam(i + 4) < 0.5 ? "rgba(255,200,80,0.85)" : "rgba(255,120,40,0.8)"; c.beginPath(); c.arc(x, y, 1.5 + bam(i + 3) * 2, 0, PI2); c.fill();
      }
    },

    dat(camX, ds, doDai) {
      const c = this.c, y = this.dat, H = this.cao, t = this.t;
      const { ho, doan } = chiaDuong(this, camX, ds);
      ho.forEach(([a, b]) => { // dung nham sôi
        const gr = c.createLinearGradient(0, y, 0, H);
        gr.addColorStop(0, "#ffd23f"); gr.addColorStop(0.3, "#ff7a1a"); gr.addColorStop(1, "#a82010");
        c.fillStyle = gr; c.fillRect(a, y + 14, b - a, H - y);
        for (let k = 0; k < 3; k++) {
          const u = (t * 0.8 + k / 3) % 1, bx = a + (b - a) * (0.25 + k * 0.25);
          c.fillStyle = `rgba(255,240,150,${1 - u})`; c.beginPath(); c.arc(bx, y + 16 - u * 8, 3 + u * 4, 0, PI2); c.fill();
        }
      });
      doan.forEach(([a, b]) => {
        c.fillStyle = "#3a2a2e"; c.fillRect(a, y + 10, b - a, H - y);
        c.save(); c.beginPath(); c.rect(a, y + 10, b - a, H - y); c.clip();
        const nhip = 0.6 + Math.sin(t * 2) * 0.2;
        c.strokeStyle = `rgba(255,120,40,${nhip})`; c.lineWidth = 2.5; // khe dung nham sáng
        moiBuoc(camX, a, b, 80, (i, x) => { c.beginPath(); c.moveTo(x, y + 18); c.lineTo(x + 14, y + 32 + bam(i) * 10); c.lineTo(x + 8, y + 50); c.lineTo(x + 24, y + 66); c.moveTo(x + 14, y + 34); c.lineTo(x + 32, y + 38); c.stroke(); });
        c.restore();
        c.fillStyle = "#5a464a"; c.beginPath(); c.roundRect(a - 2, y - 3, b - a + 4, 15, 6); c.fill();
        c.fillStyle = "#6e5a5e";
        moiBuoc(camX, a, b, 34, (i, x) => { if (x < a + 6 || x > b - 20) return; c.beginPath(); c.ellipse(x + 8, y + 1, 10, 3, 0, Math.PI, PI2); c.fill(); });
        moiBuoc(camX, a, b, 110, (i, x) => { // đá đỏ lấp lánh
          if (bam(i * 3) > 0.35 || x < a + 8 || x > b - 8 || x > doDai - camX + 40) return;
          c.fillStyle = "#ff5a5a"; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + 4, y); c.lineTo(x, y + 3); c.lineTo(x - 4, y); c.fill();
        });
      });
    },
    mieng(x, w) { // mép đá cháy đỏ
      const c = this.c, y = this.dat;
      c.fillStyle = "#5a464a";
      for (const ex of [x, x + w]) { c.beginPath(); c.arc(ex, y + 5, 7, 0, PI2); c.fill(); }
      c.fillStyle = "rgba(255,140,40,0.6)"; c.fillRect(x - 2, y + 10, 4, 10); c.fillRect(x + w - 2, y + 10, 4, 10);
    },

    nenHang(camX) { // hang đá quý: vách đen, thác dung nham, đá quý đỏ / tím
      const c = this.c, W = this.rong, Hc = this.cao, dat = this.dat, t = this.t;
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, "#1a0a10"); gr.addColorStop(1, "#4a1a1a");
      c.fillStyle = gr; c.fillRect(0, 0, W, Hc);
      moiBuoc(camX * 0.5, -120, W + 120, 360, (i, x) => { // thác dung nham
        const xx = x + 180, gr2 = c.createLinearGradient(xx - 14, 0, xx + 14, 0);
        gr2.addColorStop(0, "rgba(255,120,30,0.2)"); gr2.addColorStop(0.5, "rgba(255,200,60,0.9)"); gr2.addColorStop(1, "rgba(255,120,30,0.2)");
        c.fillStyle = gr2; c.fillRect(xx - 14, 0, 28, dat);
        c.fillStyle = "rgba(255,240,150,0.6)"; for (let k = 0; k < 4; k++) { const u = (t * 0.8 + k / 4) % 1; c.fillRect(xx - 4, u * dat, 8, 14); }
      });
      moiBuoc(camX * 0.8, -60, W + 60, 140, (i, x) => { // cụm đá quý
        const xx = x + 70, yy = dat - 6, mau = i % 2 ? ["#ff3a5a", "#ff8aa0"] : ["#a85ae8", "#d8a8ff"];
        c.fillStyle = mau[0] + "40"; c.beginPath(); c.arc(xx, yy - 16, 28, 0, PI2); c.fill();
        [[-12, 26, -0.35], [0, 38, 0], [12, 24, 0.4]].forEach(([dx, cao, g]) => {
          c.save(); c.translate(xx + dx, yy); c.rotate(g);
          c.fillStyle = mau[0]; c.beginPath(); c.moveTo(-6, 0); c.lineTo(-6, -cao * 0.7); c.lineTo(0, -cao); c.lineTo(6, -cao * 0.7); c.lineTo(6, 0); c.fill();
          c.fillStyle = mau[1]; c.beginPath(); c.moveTo(-3, -3); c.lineTo(-3, -cao * 0.65); c.lineTo(0, -cao * 0.85); c.fill();
          c.restore();
        });
      });
      c.fillStyle = "#3a2a2e"; c.fillRect(0, dat, W, Hc - dat);
      c.fillStyle = "#6e5a5e"; c.fillRect(0, dat, W, 8);
    },

    bongLauDai(x, y, k) {
      const c = this.c;
      c.fillStyle = "#2a1018";
      c.fillRect(x - 150 * k, y - 120 * k, 300 * k, 120 * k);
      [-150, -50, 50, 150].forEach((dx, i) => { const cao = (i === 1 || i === 2 ? 200 : 170) * k; c.fillRect(x + (dx - 22) * k, y - cao, 44 * k, cao); });
    },

    lauDai(g) { // pháo đài lửa: đá đen, khe dung nham, cờ lửa, cổng sắt kéo lên khi thắng
      const c = this.c, t = this.t;
      const thap = (dx, cao) => {
        c.fillStyle = "#3a2a2e"; c.fillRect(dx - 24, -cao, 48, cao);
        for (let k = 0; k < 3; k++) c.fillRect(dx - 24 + k * 18, -cao - 12, 12, 12);
        c.fillStyle = "#ffb03b"; c.beginPath(); c.roundRect(dx - 6, -cao + 24, 12, 18, [6, 6, 0, 0]); c.fill();
        const nhip = 1 + Math.sin(t * 10 + dx) * 0.12;
        c.fillStyle = "#ff6a1a"; c.beginPath(); c.ellipse(dx, -cao - 26, 9, 15 * nhip, 0, 0, PI2); c.fill();
        c.fillStyle = "#ffe27a"; c.beginPath(); c.ellipse(dx, -cao - 22, 4, 8 * nhip, 0, 0, PI2); c.fill();
      };
      c.fillStyle = "#4a3638"; c.fillRect(-180, -140, 360, 140);
      c.strokeStyle = "rgba(0,0,0,0.3)"; c.lineWidth = 2;
      for (let r = 1; r < 6; r++) { c.beginPath(); c.moveTo(-180, -r * 24); c.lineTo(180, -r * 24); c.stroke(); }
      c.strokeStyle = `rgba(255,120,40,${0.6 + Math.sin(t * 2) * 0.2})`; c.lineWidth = 3;
      [[-160, -120, -140, -60], [120, -130, 150, -50], [40, -110, 20, -40]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo((a + d) / 2 + 8, (b + e) / 2); c.lineTo(d, e); c.stroke(); });
      for (let k = 0; k < 10; k++) { c.fillStyle = "#4a3638"; c.fillRect(-180 + k * 38, -156, 22, 16); }
      thap(-190, 200); thap(190, 200); thap(-40, 240);
      // cổng sắt
      c.fillStyle = "#1a0a10"; c.beginPath(); c.roundRect(-120, -96, 64, 96, [32, 32, 0, 0]); c.fill();
      const mo = g.trangThai === "thang" ? Math.min(1, g.tKetThuc / 0.8) : 0;
      c.save(); c.beginPath(); c.roundRect(-120, -96, 64, 96, [32, 32, 0, 0]); c.clip();
      c.strokeStyle = "#8a7a7a"; c.lineWidth = 4;
      for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(-120 + k * 13, -96 - mo * 90); c.lineTo(-120 + k * 13, -mo * 90); c.stroke(); }
      for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(-120, -96 + k * 24 - mo * 90); c.lineTo(-56, -96 + k * 24 - mo * 90); c.stroke(); }
      c.restore();
      c.fillStyle = "#fff"; c.beginPath(); c.roundRect(-14, -126, 128, 30, 10); c.fill();
      c.strokeStyle = "#ff6a1a"; c.lineWidth = 3; c.stroke();
      c.fillStyle = "#a82010"; c.font = '800 18px "Baloo 2", "Be Vietnam Pro", system-ui, sans-serif'; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("Pháo Đài Lửa", 50, -110);
    }
  };

  function veLua(c, x, y, r, t, pha) { // ngọn lửa nhỏ ba lớp
    const nhip = 1 + Math.sin(t * 12 + pha) * 0.15;
    c.fillStyle = "#ff5a1a"; c.beginPath(); c.moveTo(x - r, y); c.quadraticCurveTo(x - r, y - r * 1.4 * nhip, x, y - r * 2.2 * nhip); c.quadraticCurveTo(x + r, y - r * 1.4 * nhip, x + r, y); c.fill();
    c.fillStyle = "#ffb03b"; c.beginPath(); c.moveTo(x - r * 0.6, y); c.quadraticCurveTo(x - r * 0.6, y - r * nhip, x, y - r * 1.5 * nhip); c.quadraticCurveTo(x + r * 0.6, y - r * nhip, x + r * 0.6, y); c.fill();
    c.fillStyle = "#fff2a0"; c.beginPath(); c.ellipse(x, y - r * 0.4, r * 0.25, r * 0.5, 0, 0, PI2); c.fill();
  }

  /* ================================================================
     QUÁI / VẬT CẢN VÙNG NÚI LỬA
     ================================================================ */
  ST.VE_QUAI = ST.VE_QUAI || {};
  Object.assign(ST.VE_QUAI, {
    daDungNham(w, h, t) { // tảng đá xám nứt, khe đỏ rực nhấp nháy
      const c = this.c;
      c.fillStyle = "#8a7a7e"; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w * 0.44, -h * 0.7); c.lineTo(-w * 0.1, -h); c.lineTo(w * 0.32, -h * 0.85); c.lineTo(w / 2, -h * 0.3); c.lineTo(w / 2, 0); c.fill();
      c.fillStyle = "#6a5a5e"; c.beginPath(); c.moveTo(w * 0.1, -h * 0.9); c.lineTo(w * 0.32, -h * 0.85); c.lineTo(w / 2, -h * 0.3); c.lineTo(w / 2, 0); c.lineTo(w * 0.12, 0); c.fill();
      c.strokeStyle = `rgba(255,${120 + Math.sin(t * 3) * 40},40,1)`; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-w * 0.3, -h * 0.75); c.lineTo(-w * 0.1, -h * 0.5); c.lineTo(-w * 0.2, -h * 0.25); c.moveTo(-w * 0.1, -h * 0.5); c.lineTo(w * 0.2, -h * 0.45); c.lineTo(w * 0.3, -h * 0.15); c.stroke();
    },
    ongKhoi(w, h, t) { // ụ đá phun hơi nóng từng đợt
      const c = this.c, than = h * 0.6;
      c.fillStyle = "#8a6a5a"; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w * 0.2, -than); c.lineTo(w * 0.2, -than); c.lineTo(w / 2, 0); c.fill();
      c.fillStyle = "#c8a070"; c.beginPath(); c.ellipse(0, -than, w * 0.2, 4, 0, 0, PI2); c.fill();
      c.fillStyle = "#ff8a2a"; c.beginPath(); c.ellipse(0, -than, w * 0.12, 2.5, 0, 0, PI2); c.fill();
      c.fillStyle = "rgba(255,240,230,0.75)";
      for (let k = 0; k < 4; k++) { const u = (t * 0.9 + k / 4) % 1; c.beginPath(); c.arc(Math.sin(u * 6 + k) * 4, -than - 4 - u * h * 0.6, 5 + u * 6, 0, PI2); c.fill(); }
    },
    tinhTheLua(w, h, t) { // cụm tinh thể đỏ phát sáng
      const c = this.c, nhip = 0.3 + Math.sin(t * 3) * 0.1;
      c.fillStyle = `rgba(255,80,80,${nhip})`; c.beginPath(); c.arc(0, -h * 0.5, w * 0.6, 0, PI2); c.fill();
      [[-w * 0.25, h * 0.6, -0.35], [0, h, 0], [w * 0.25, h * 0.7, 0.35]].forEach(([dx, cao, g]) => {
        c.save(); c.translate(dx, 0); c.rotate(g);
        c.fillStyle = "#e8243a"; c.beginPath(); c.moveTo(-8, 0); c.lineTo(-8, -cao * 0.75); c.lineTo(0, -cao); c.lineTo(8, -cao * 0.75); c.lineTo(8, 0); c.fill();
        c.fillStyle = "#ff8aa0"; c.beginPath(); c.moveTo(-4, -2); c.lineTo(-4, -cao * 0.7); c.lineTo(0, -cao * 0.9); c.fill();
        c.restore();
      });
    },
    goCayChay(w, h, t) { // gốc cây cháy đen, đốm than đỏ, khói nhẹ
      const c = this.c;
      c.fillStyle = "#4a3030"; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w * 0.32, -h * 0.85); c.lineTo(-w * 0.12, -h); c.lineTo(0, -h * 0.82); c.lineTo(w * 0.16, -h * 0.98); c.lineTo(w * 0.34, -h * 0.8); c.lineTo(w / 2, 0); c.fill();
      c.strokeStyle = "#8a6a6a"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-w * 0.5, 0); c.lineTo(-w * 0.32, -h * 0.85); c.lineTo(-w * 0.12, -h); c.lineTo(0, -h * 0.82); c.lineTo(w * 0.16, -h * 0.98); c.lineTo(w * 0.34, -h * 0.8); c.lineTo(w / 2, 0); c.stroke();
      c.fillStyle = `rgba(255,${100 + Math.sin(t * 4) * 50},40,0.95)`; [[-0.1, -0.4], [0.18, -0.6], [-0.25, -0.2], [0.05, -0.75]].forEach(([a, b]) => { c.beginPath(); c.arc(a * w, b * h, 3, 0, PI2); c.fill(); });
      veLua(c, w * 0.16, -h * 0.98, 5, t, 1);
    },
    dongTro(w, h) { // đống tro xám có than hồng
      const c = this.c;
      c.fillStyle = "#a8a0a4"; c.beginPath(); c.moveTo(-w / 2, 0); c.quadraticCurveTo(-w * 0.1, -h * 1.3, w / 2, 0); c.fill();
      c.strokeStyle = "#e8e0e4"; c.lineWidth = 2; c.stroke();
      c.fillStyle = "#c8c0c4"; c.beginPath(); c.moveTo(-w * 0.3, -h * 0.4); c.quadraticCurveTo(-w * 0.1, -h * 0.75, w * 0.1, -h * 0.5); c.fill();
      c.fillStyle = "#ff6a2a"; [[-0.15, -0.3], [0.15, -0.2], [0, -0.55]].forEach(([a, b]) => { c.beginPath(); c.arc(a * w, b * h, 3.5, 0, PI2); c.fill(); });
    },
    trungRong(w, h, t) { // trứng rồng vảy cam đỏ, nằm trong tổ lửa
      const c = this.c, rung = Math.sin(t * 9) * 0.05 * (Math.sin(t * 1.7) > 0.5 ? 1 : 0);
      c.save(); c.rotate(rung);
      c.fillStyle = "#ff7a2a"; c.beginPath(); c.moveTo(0, -2); c.bezierCurveTo(-w * 0.62, -2, -w * 0.42, -h * 1.02, 0, -h); c.bezierCurveTo(w * 0.42, -h * 1.02, w * 0.62, -2, 0, -2); c.fill();
      c.strokeStyle = "#c8381a"; c.lineWidth = 1.8;
      for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(-w * 0.2 + k * w * 0.2 + (r % 2) * w * 0.1, -h * (0.25 + r * 0.17), 5, 0, Math.PI); c.stroke(); }
      c.fillStyle = "rgba(255,255,200,0.4)"; c.beginPath(); c.ellipse(-w * 0.15, -h * 0.7, 4, 9, 0.3, 0, PI2); c.fill();
      c.restore();
      [-0.35, 0, 0.35].forEach((k, i) => veLua(c, k * w, 0, 5, t, i));
    },
    cotDungNham(w, h, t) { // cột đá cao có dung nham chảy xuống, quá cao để vượt
      const c = this.c;
      c.fillStyle = "#5a464a"; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w * 0.4, -h + 10); c.lineTo(w * 0.4, -h + 10); c.lineTo(w / 2, 0); c.fill();
      c.fillStyle = "#4a3638"; c.fillRect(w * 0.1, -h + 10, w * 0.3, h - 10);
      const gr = c.createLinearGradient(0, -h, 0, 0); gr.addColorStop(0, "#ffd23f"); gr.addColorStop(1, "#ff5a1a");
      c.fillStyle = gr;
      c.beginPath(); c.moveTo(-w * 0.12, -h + 6); c.quadraticCurveTo(-w * 0.2, -h * 0.5, -w * 0.08, 0); c.lineTo(w * 0.06, 0); c.quadraticCurveTo(-w * 0.04, -h * 0.5, w * 0.04, -h + 6); c.fill();
      c.fillStyle = "#ff7a1a"; c.beginPath(); c.ellipse(0, -h + 8, w * 0.42, 8, 0, 0, PI2); c.fill();
      c.fillStyle = "#ffe27a"; for (let k = 0; k < 3; k++) { const u = (t * 0.6 + k / 3) % 1; c.beginPath(); c.arc(-w * 0.05, -h + 10 + u * (h - 16), 3, 0, PI2); c.fill(); }
    },
    thapDaDen(w, h) { // tháp đá đen bóng nhiều cạnh nhọn, gân đỏ
      const c = this.c;
      c.fillStyle = "#2a2230"; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w * 0.3, -h * 0.6); c.lineTo(-w * 0.12, -h); c.lineTo(w * 0.1, -h * 0.75); c.lineTo(w * 0.3, -h * 0.85); c.lineTo(w / 2, 0); c.fill();
      c.fillStyle = "#4a4060"; c.beginPath(); c.moveTo(-w * 0.12, -h); c.lineTo(-w * 0.05, -h * 0.4); c.lineTo(-w * 0.3, -h * 0.6); c.fill();
      c.strokeStyle = "#ff5a3a"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-w * 0.2, -h * 0.3); c.lineTo(0, -h * 0.5); c.lineTo(w * 0.15, -h * 0.4); c.moveTo(-w * 0.05, -h * 0.75); c.lineTo(w * 0.1, -h * 0.6); c.stroke();
      c.strokeStyle = "#8a80a8"; c.lineWidth = 2; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w * 0.3, -h * 0.6); c.lineTo(-w * 0.12, -h); c.lineTo(w * 0.1, -h * 0.75); c.lineTo(w * 0.3, -h * 0.85); c.lineTo(w / 2, 0); c.stroke();
    },
    ocLua(w, h, t, o) { // ốc sên lửa: vỏ đá xoắn, ngọn lửa trên vỏ
      const c = this.c, duoi = o.dangDi ? Math.sin(t * 5) * 3 : 0;
      c.fillStyle = "#ffb03b"; c.beginPath(); c.moveTo(-w / 2, -2); c.quadraticCurveTo(-w * 0.45, -h * 0.5, -w * 0.3, -h * 0.5); c.lineTo(w * 0.45 + duoi, -6); c.lineTo(w / 2 + duoi, 0); c.lineTo(-w / 2, 0); c.fill();
      c.fillStyle = "#6a5a5e"; c.beginPath(); c.arc(w * 0.1, -h * 0.45, h * 0.38, 0, PI2); c.fill();
      c.strokeStyle = "#ff7a2a"; c.lineWidth = 2.5; c.beginPath();
      for (let g = 0; g < Math.PI * 4; g += 0.2) { const r = h * 0.34 * (1 - g / (Math.PI * 4.4)); c.lineTo(w * 0.1 + Math.cos(g) * r, -h * 0.45 + Math.sin(g) * r); }
      c.stroke();
      veLua(c, w * 0.1, -h * 0.8, 6, t, 0);
      c.strokeStyle = "#ffb03b"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-w * 0.36, -h * 0.48); c.lineTo(-w * 0.42, -h * 0.72); c.moveTo(-w * 0.3, -h * 0.48); c.lineTo(-w * 0.28, -h * 0.72); c.stroke();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(-w * 0.42, -h * 0.74, 3.2, 0, PI2); c.arc(-w * 0.28, -h * 0.74, 3.2, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.43, -h * 0.74, 1.6, 0, PI2); c.arc(-w * 0.29, -h * 0.74, 1.6, 0, PI2); c.fill();
    },
    boHungLua(w, h, t, o) { // bọ lửa: vỏ đỏ có vân vàng như than hồng, chân đen
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 14) * 3 : 0;
      c.strokeStyle = "#2a1a1a"; c.lineWidth = 2.5;
      for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-w * 0.15 + k * w * 0.15, -h * 0.3); c.lineTo(-w * 0.22 + k * w * 0.16 + (k % 2 ? buoc : -buoc), -1); c.stroke(); }
      c.fillStyle = "#e8341a"; c.beginPath(); c.ellipse(w * 0.05, -h * 0.45, w * 0.36, h * 0.38, 0, Math.PI, PI2); c.lineTo(w * 0.41, -h * 0.3); c.lineTo(-w * 0.31, -h * 0.3); c.fill();
      c.strokeStyle = "#ffd23f"; c.lineWidth = 2; c.beginPath(); c.moveTo(w * 0.05, -h * 0.82); c.lineTo(w * 0.05, -h * 0.32); c.stroke();
      c.fillStyle = "#ffb03b"; [[-0.12, -0.6], [0.2, -0.55], [-0.05, -0.42], [0.28, -0.4]].forEach(([a, b]) => { c.beginPath(); c.arc(a * w, b * h, 3, 0, PI2); c.fill(); });
      c.fillStyle = "#3a2a2e"; c.beginPath(); c.arc(-w * 0.32, -h * 0.4, h * 0.2, 0, PI2); c.fill();
      c.strokeStyle = "#3a2a2e"; c.lineWidth = 2; c.beginPath(); c.moveTo(-w * 0.38, -h * 0.55); c.lineTo(-w * 0.48, -h * 0.75); c.stroke();
      this.mat(-w * 0.34, -h * 0.42, 2.6, true);
    },
    nguoiDaNho(w, h, t, o) { veNguoiDa.call(this, w, h, t, o, false); },
    nguoiDaKhongLo(w, h, t, o) { veNguoiDa.call(this, w, h, t, o, true); },
    thanLanLua(w, h, t, o) { // kỳ nhông lửa: thân cam chấm đen, uốn mình chạy, lưng có lửa
      const c = this.c, uon = (o.dangDi ? Math.sin(t * 14) : Math.sin(t * 2)) * 3;
      c.strokeStyle = "#ff8a1a"; c.lineCap = "round"; c.lineWidth = h * 0.36;
      c.beginPath(); c.moveTo(-w * 0.2, -h * 0.4); c.quadraticCurveTo(w * 0.15, -h * 0.4 + uon, w * 0.25, -h * 0.4); c.stroke();
      c.lineWidth = 5; c.beginPath(); c.moveTo(w * 0.25, -h * 0.4); c.quadraticCurveTo(w * 0.4, -h * 0.6 - uon, w / 2, -h * 0.2); c.stroke();
      c.lineWidth = 3.5; [[-0.1, 1], [0.15, -1]].forEach(([a, s]) => { c.beginPath(); c.moveTo(a * w, -h * 0.35); c.lineTo(a * w - 6 + s * uon, -2); c.stroke(); });
      c.fillStyle = "#ff8a1a"; c.beginPath(); c.ellipse(-w * 0.33, -h * 0.45, w * 0.16, h * 0.3, -0.15, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; [[-0.05, -0.45], [0.1, -0.5], [0.2, -0.42]].forEach(([a, b]) => { c.beginPath(); c.arc(a * w, b * h, 2.4, 0, PI2); c.fill(); });
      [-0.05, 0.12].forEach((k, i) => veLua(c, k * w, -h * 0.6, 4, t, i));
      this.mat(-w * 0.38, -h * 0.6, 2.8, true);
    },
    rongCon(w, h, t, o) { // rồng con đỏ chạy lon ton, cánh nhỏ vỗ, phì khói
      const c = this.c, nhun = o.dangDi ? Math.abs(Math.sin(t * 12)) * 3 : 0, buoc = o.dangDi ? Math.sin(t * 12) : 0, vo = Math.sin(t * 14);
      c.save(); c.translate(0, -nhun);
      c.fillStyle = "#c8281a";
      c.beginPath(); c.roundRect(-w * 0.08 + buoc * 4, -h * 0.3, 9, h * 0.3 + nhun, 4); c.roundRect(w * 0.12 - buoc * 4, -h * 0.3, 9, h * 0.3 + nhun, 4); c.fill();
      c.fillStyle = "#e8443a"; c.beginPath(); c.moveTo(w * 0.2, -h * 0.4); c.quadraticCurveTo(w * 0.5, -h * 0.4, w / 2, -h * 0.15); c.lineTo(w * 0.2, -h * 0.28); c.fill();
      c.fillStyle = "#ff8a6a"; c.beginPath(); c.moveTo(w * 0.05, -h * 0.55); c.lineTo(w * 0.3, -h * 0.85 - vo * 6); c.lineTo(w * 0.25, -h * 0.55); c.fill(); // cánh
      c.fillStyle = "#e8443a"; c.beginPath(); c.ellipse(w * 0.04, -h * 0.42, w * 0.24, h * 0.2, 0, 0, PI2); c.fill();
      c.beginPath(); c.arc(-w * 0.2, -h * 0.62, h * 0.22, 0, PI2); c.fill();
      c.fillStyle = "#ffd23f"; c.beginPath(); c.ellipse(w * 0.02, -h * 0.36, w * 0.14, h * 0.1, 0, 0, PI2); c.fill();
      c.beginPath(); c.moveTo(-w * 0.22, -h * 0.8); c.lineTo(-w * 0.18, -h * 0.98); c.lineTo(-w * 0.12, -h * 0.8); c.fill();
      this.mat(-w * 0.24, -h * 0.66, 2.8, true);
      c.fillStyle = "rgba(200,190,190,0.8)"; for (let k = 0; k < 2; k++) { const u = (t * 1.5 + k / 2) % 1; c.beginPath(); c.arc(-w * 0.42 - u * 14, -h * 0.58 - u * 8, 2 + u * 4, 0, PI2); c.fill(); }
      c.restore();
    },
    rongLua(w, h, t, o) { // rồng lửa khổng lồ đứng thẳng: cánh dơi, bụng vàng, phun lửa nhỏ
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 5) : 0, vo = Math.sin(t * 4), lac = Math.sin(t * 2) * 0.03;
      c.save(); c.rotate(lac);
      c.fillStyle = "#8a1a2a"; // cánh
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * w * 0.1, -h * 0.65); c.lineTo(s * w * 0.62, -h * 0.95 - vo * 8); c.lineTo(s * w * 0.55, -h * 0.6); c.lineTo(s * w * 0.42, -h * 0.68); c.lineTo(s * w * 0.3, -h * 0.5); c.closePath(); c.fill(); });
      c.fillStyle = "#c8281a";
      c.beginPath(); c.roundRect(-w * 0.28 + buoc * 5, -h * 0.25, w * 0.22, h * 0.25, 8); c.roundRect(w * 0.06 - buoc * 5, -h * 0.25, w * 0.22, h * 0.25, 8); c.fill();
      c.beginPath(); c.moveTo(w * 0.2, -h * 0.35); c.quadraticCurveTo(w * 0.6, -h * 0.25, w * 0.52, -h * 0.05); c.lineTo(w * 0.3, -h * 0.2); c.fill(); // đuôi
      c.beginPath(); c.roundRect(-w * 0.3, -h * 0.72, w * 0.6, h * 0.52, w * 0.25); c.fill();
      c.fillStyle = "#ffd23f"; c.beginPath(); c.roundRect(-w * 0.18, -h * 0.66, w * 0.36, h * 0.44, w * 0.15); c.fill();
      c.strokeStyle = "#e8a800"; c.lineWidth = 2; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(-w * 0.16, -h * 0.66 + k * h * 0.088); c.lineTo(w * 0.16, -h * 0.66 + k * h * 0.088); c.stroke(); }
      c.fillStyle = "#c8281a"; c.beginPath(); c.roundRect(-w * 0.42, -h * 0.97, w * 0.6, h * 0.24, 16); c.fill();
      c.fillStyle = "#ffd23f"; c.beginPath(); c.moveTo(-w * 0.0, -h * 0.95); c.lineTo(w * 0.08, -h - 8); c.lineTo(w * 0.12, -h * 0.93); c.moveTo(-w * 0.15, -h * 0.96); c.lineTo(-w * 0.1, -h - 6); c.lineTo(-w * 0.04, -h * 0.95); c.fill();
      this.mat(-w * 0.14, -h * 0.88, 5.5, true);
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.38, -h * 0.82, 2.5, 0, PI2); c.fill();
      const lua = (Math.sin(t * 3) + 1) / 2;
      if (lua > 0.4) { c.save(); c.translate(-w * 0.44, -h * 0.79); c.rotate(-Math.PI / 2); veLua(c, 0, 0, 6 + lua * 4, t, 0); c.restore(); }
      c.restore();
    },
    phuongHoang(w, h, t) { // phượng hoàng lửa: cánh lửa vỗ, đuôi dài nhiều lông
      const c = this.c, vo = Math.sin(t * 9), cy = -h * 0.5;
      c.fillStyle = "#ff5a1a"; for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(w * 0.32 + k * 3, cy + 2 + k * 4, w * 0.2, 4, 0.2 + k * 0.15, 0, PI2); c.fill(); }
      c.fillStyle = "#ff8a1a"; c.beginPath(); c.moveTo(-4, cy); c.quadraticCurveTo(w * 0.1, cy - 24 - vo * 14, w * 0.4, cy - 20 - vo * 16); c.quadraticCurveTo(w * 0.2, cy - 2, 6, cy + 4); c.fill();
      c.fillStyle = "#ffd23f"; c.beginPath(); c.moveTo(0, cy - 4); c.quadraticCurveTo(w * 0.1, cy - 16 - vo * 10, w * 0.28, cy - 16 - vo * 12); c.quadraticCurveTo(w * 0.12, cy - 2, 2, cy); c.fill();
      c.fillStyle = "#ff6a1a"; c.beginPath(); c.ellipse(0, cy + 2, w * 0.2, h * 0.24, 0, 0, PI2); c.fill();
      c.beginPath(); c.arc(-w * 0.24, cy - 8, 8, 0, PI2); c.fill();
      c.fillStyle = "#ffd23f"; for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(-w * 0.22 + k * 4, cy - 18 - k * 2, 2.5, 6, 0.3 + k * 0.2, 0, PI2); c.fill(); }
      c.fillStyle = "#ffd23f"; c.beginPath(); c.moveTo(-w * 0.32, cy - 10); c.lineTo(-w * 0.46, cy - 6); c.lineTo(-w * 0.32, cy - 3); c.fill();
      this.mat(-w * 0.25, cy - 10, 2.4, true);
    },
    doiLua(w, h, t) { // dơi lửa: cánh đỏ viền lửa, thân đen
      const c = this.c, vo = Math.sin(t * 18), cy = -h / 2;
      c.fillStyle = "#e8341a";
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * 6, cy); c.lineTo(s * w * 0.5, cy - 10 - vo * 10); c.lineTo(s * w * 0.42, cy + 4 - vo * 4); c.lineTo(s * w * 0.28, cy - 1 - vo * 5); c.lineTo(s * w * 0.18, cy + 8); c.closePath(); c.fill(); });
      c.fillStyle = "#ffd23f"; [-1, 1].forEach(s => { c.beginPath(); c.arc(s * w * 0.5, cy - 10 - vo * 10, 3, 0, PI2); c.fill(); });
      c.fillStyle = "#3a2a2e"; c.beginPath(); c.ellipse(0, cy, 11, h * 0.4, 0, 0, PI2); c.fill();
      c.beginPath(); c.moveTo(-9, cy - 8); c.lineTo(-7, cy - h * 0.55); c.lineTo(-2, cy - 10); c.moveTo(9, cy - 8); c.lineTo(7, cy - h * 0.55); c.lineTo(2, cy - 10); c.fill();
      c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(-4, cy - 3, 2.6, 0, PI2); c.arc(4, cy - 3, 2.6, 0, PI2); c.fill();
      c.fillStyle = "#c8281a"; c.beginPath(); c.arc(-4, cy - 3, 1.2, 0, PI2); c.arc(4, cy - 3, 1.2, 0, PI2); c.fill();
    },
    quaCauLua(w, h, t) { // quả cầu lửa có mặt, đuôi lửa phía sau
      const c = this.c, r = Math.min(w, h) * 0.36, cy = -h / 2;
      for (let k = 0; k < 4; k++) { const u = (t * 2 + k / 4) % 1; c.fillStyle = `rgba(255,${140 - u * 80},40,${0.7 * (1 - u)})`; c.beginPath(); c.arc(r * 0.6 + u * 26, cy + Math.sin(k * 5) * 4, r * (0.8 - u * 0.4), 0, PI2); c.fill(); }
      const gr = c.createRadialGradient(-r * 0.2, cy - r * 0.2, 2, 0, cy, r);
      gr.addColorStop(0, "#fff2a0"); gr.addColorStop(0.5, "#ffb03b"); gr.addColorStop(1, "#ff5a1a");
      c.fillStyle = gr; c.beginPath(); c.arc(0, cy, r, 0, PI2); c.fill();
      this.mat(-r * 0.25, cy - 2, 3.2, true);
      c.strokeStyle = "#a82010"; c.lineWidth = 1.8; c.beginPath(); c.arc(-r * 0.25, cy + r * 0.55, 4, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    },
    domDomLua(w, h, t) { // đom đóm lửa: đuôi sáng vàng nhấp nháy, cánh trong
      const c = this.c, vo = Math.sin(t * 30), cy = -h * 0.5, sang = 0.6 + Math.sin(t * 6) * 0.4;
      c.fillStyle = `rgba(255,230,90,${0.3 * sang})`; c.beginPath(); c.arc(w * 0.2, cy + 2, 18, 0, PI2); c.fill();
      c.fillStyle = "rgba(255,240,220,0.7)"; c.beginPath(); c.ellipse(0, cy - 10 - vo * 3, 7, 14, 0.9 + vo * 0.2, 0, PI2); c.ellipse(w * 0.1, cy - 9 + vo * 3, 6, 12, 1.3, 0, PI2); c.fill();
      c.fillStyle = `rgb(255,${200 + sang * 50},80)`; c.beginPath(); c.ellipse(w * 0.22, cy + 2, w * 0.2, h * 0.24, 0, 0, PI2); c.fill();
      c.fillStyle = "#3a2a2e"; c.beginPath(); c.ellipse(-w * 0.05, cy, w * 0.18, h * 0.22, 0, 0, PI2); c.fill();
      c.fillStyle = "#e8341a"; c.beginPath(); c.arc(-w * 0.26, cy - 2, h * 0.2, 0, PI2); c.fill();
      c.strokeStyle = "#3a2a2e"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-w * 0.3, cy - 8); c.quadraticCurveTo(-w * 0.4, cy - 20, -w * 0.48, cy - 16); c.stroke();
      this.mat(-w * 0.28, cy - 3, 2.4, true);
    }
  });

  // Người đá (tí hon / khổng lồ): khối đá xám xếp chồng, khe dung nham sáng, mắt lửa
  function veNguoiDa(w, h, t, o, khongLo) {
    const c = this.c, buoc = o.dangDi ? Math.sin(t * (khongLo ? 5 : 10)) : 0, lac = Math.sin(t * 2) * 0.03, sang = 0.7 + Math.sin(t * 3) * 0.3;
    c.save(); c.rotate(lac);
    const da = (x, y, rw, rh, r) => { c.fillStyle = "#9a8a8e"; c.beginPath(); c.roundRect(x, y, rw, rh, r); c.fill(); c.fillStyle = "rgba(0,0,0,0.15)"; c.fillRect(x + rw * 0.6, y + 3, rw * 0.35, rh - 6); };
    da(-w * 0.34 + buoc * 4, -h * 0.24, w * 0.26, h * 0.24, 6); da(w * 0.08 - buoc * 4, -h * 0.24, w * 0.26, h * 0.24, 6);
    da(-w * 0.4, -h * 0.68, w * 0.8, h * 0.46, 12);
    da(-w / 2, -h * 0.66 + buoc * 4, w * 0.18, h * 0.36, 8); da(w * 0.32, -h * 0.66 - buoc * 4, w * 0.18, h * 0.36, 8);
    da(-w * 0.28, -h, w * 0.5, h * 0.32, 10);
    c.strokeStyle = `rgba(255,${110 + sang * 60},40,1)`; c.lineWidth = khongLo ? 3.5 : 2.5;
    c.beginPath(); c.moveTo(-w * 0.2, -h * 0.6); c.lineTo(0, -h * 0.45); c.lineTo(-w * 0.1, -h * 0.3); c.moveTo(0, -h * 0.45); c.lineTo(w * 0.2, -h * 0.5); c.stroke();
    c.fillStyle = `rgba(255,${180 + sang * 50},60,1)`;
    c.beginPath(); c.ellipse(-w * 0.15, -h * 0.85, khongLo ? 7 : 4, khongLo ? 5 : 3, 0, 0, PI2); c.ellipse(w * 0.03, -h * 0.85, khongLo ? 7 : 4, khongLo ? 5 : 3, 0, 0, PI2); c.fill();
    c.strokeStyle = "#2B2640"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-w * 0.24, -h * 0.92); c.lineTo(-w * 0.08, -h * 0.89); c.moveTo(w * 0.12, -h * 0.92); c.lineTo(-w * 0.04, -h * 0.89); c.stroke();
    c.fillStyle = "#2B2640"; c.beginPath(); c.roundRect(-w * 0.14, -h * 0.76, w * 0.2, 4, 2); c.fill();
    if (khongLo) for (let k = 0; k < 3; k++) veLua(c, -w * 0.18 + k * w * 0.16, -h + 2, 6, t, k);
    c.restore();
  }
})(typeof window !== "undefined" ? window : globalThis);
