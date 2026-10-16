/* ================================================================
   FILE: san_tu/st_ve_bien.js
   CHỨC NĂNG: HÌNH VẼ đường đua 6 "Biển san hô" (game Giải Cứu Mèo Con).
              Cảnh: dưới nước xanh, tia nắng xiên, bong bóng nổi, rạn san hô, rong biển đung đưa;
              đáy cát có vỏ ốc; vực biển sâu; hang ngọc trai; tàu đắm ở màn 7; bé BƠI với kính lặn,
              ống thở, chân vịt. 19 sinh vật / vật cản dưới biển.
              Quy ước giống st_ve_keo.js: gốc tọa độ giữa đáy vật, mặt quay sang TRÁI, "this" là BoVe.
   BƯỚC: TC_00F
   CẬP NHẬT: 16/10/2026 - TC_00G: đồ của bé gắn theo khung xương mới (st_ve_be.js), bé BƠI.
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST;
  const { PI2, tronMau, bam, chiaDuong, moiBuoc } = ST.VE_CHUNG;

  ST.CHU_DE_VE = ST.CHU_DE_VE || {};
  ST.CHU_DE_VE.bien = {
    cong: { soc: "#ff8a5c", nut: "#ffd23f" },
    mauGoHang: ["#5a4a8a", "#b8a8e8"],
    phuongTien: {
      tuThe: "boi", nang: 6,
      truoc(tt) { // chân vịt (theo bàn chân), kính lặn, ống thở và bong bóng
        const c = this.c, t = tt.t, k = tt.k, VC = ST.VE_CHUNG;
        k.chan.forEach(ch => VC.theoBanChan(c, ch, () => {
          c.fillStyle = "#2fb6a8"; c.beginPath(); c.moveTo(-1, -3.5); c.lineTo(18, -6); c.lineTo(20, 5); c.lineTo(-1, 3.5); c.closePath(); c.fill();
          c.strokeStyle = "#1d8f84"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(4, 0); c.lineTo(18, -1); c.stroke();
        }));
        VC.theoDau(c, k, r => {
          c.strokeStyle = "#2B2640"; c.lineWidth = 1.8; c.beginPath(); c.moveTo(2, -2); c.lineTo(-r + 1, -4); c.stroke(); // dây kính
          c.fillStyle = "rgba(170,230,255,0.55)"; c.strokeStyle = "#ff8a3a"; c.lineWidth = 2.4;
          c.beginPath(); c.roundRect(2, -4.5, 12.5, 9, 3.5); c.fill(); c.stroke();
          c.fillStyle = "#fff"; c.beginPath(); c.arc(5, -2, 1.5, 0, PI2); c.fill();
          c.strokeStyle = "#ffd23f"; c.lineWidth = 3.2; c.beginPath(); c.moveTo(8, 8); c.quadraticCurveTo(-1, 11, -4, 3); c.lineTo(-4, -r - 9); c.stroke(); // ống thở
          c.fillStyle = "#ff8a3a"; c.beginPath(); c.roundRect(-6.5, -r - 14, 5, 5, 2); c.fill();
        });
        const dinh = VC.diemDau(k, { x: -4, y: -k.dau.r - 14 });
        c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) { const u = (t * 0.9 + i / 3) % 1; c.beginPath(); c.arc(dinh.x + Math.sin(u * 9 + i) * 4, dinh.y - u * 40, 2 + u * 3, 0, PI2); c.stroke(); }
      }
    },

    nen(camX, p) {
      const c = this.c, W = this.rong, H = this.cao, dat = this.dat, t = this.t;
      const s = Math.max(0, (p - 0.45) / 0.55); // càng về cuối càng xuống sâu, nước xanh thẫm hơn
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, tronMau("#5fd6ee", "#3a8ad0", s * 0.8));
      gr.addColorStop(1, tronMau("#1f8ac0", "#1a4f8e", s * 0.8));
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // tia nắng xiên
      c.fillStyle = "rgba(255,255,255,0.08)";
      for (let i = 0; i < 6; i++) {
        const x = ((i * 260 - camX * 0.05) % (W + 300) + W + 300) % (W + 300) - 150, lac = Math.sin(t * 0.6 + i) * 20;
        c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 70, 0); c.lineTo(x + 170 + lac, dat); c.lineTo(x + 110 + lac, dat); c.fill();
      }
      // vách đá xa
      this.veLop(camX, 0.15, 420, dat, (x, y, i) => {
        c.fillStyle = tronMau("#3f9cc0", "#2a6aa0", s * 0.7);
        const cao = 120 + bam(i) * 120;
        c.beginPath(); c.moveTo(x - 40, dat); c.quadraticCurveTo(x + 40, dat - cao, x + 140, dat - cao * 0.9); c.quadraticCurveTo(x + 260, dat - cao * 1.1, x + 460, dat); c.fill();
      });
      if (p > 0.45) {
        const a = Math.min(1, (p - 0.45) / 0.15), x = W + 60 - (p - 0.45) / 0.55 * W * 0.35;
        c.globalAlpha = 0.5 * a; ST.CHU_DE_VE.bien.bongLauDai.call(this, x, dat - 50, 0.45); c.globalAlpha = 1;
      }
      // đàn cá nhỏ bơi xa
      c.fillStyle = "rgba(255,255,255,0.35)";
      for (let i = 0; i < 9; i++) {
        const x = ((W - (t * 30 + i * 140 + camX * 0.2)) % (W + 200) + W + 200) % (W + 200) - 100, y = 70 + bam(i) * Math.max(60, dat * 0.45);
        c.beginPath(); c.ellipse(x, y, 8, 3.5, 0, 0, PI2); c.moveTo(x + 7, y); c.lineTo(x + 13, y - 4); c.lineTo(x + 13, y + 4); c.fill();
      }
      // rạn san hô phía sau
      this.veLop(camX, 0.45, 260, dat, (x, y, i) => {
        const xx = x + 60 + bam(i) * 80;
        const mau = ["#ff8aa8", "#ffb35c", "#b98aff", "#ff7a6a"][((i % 4) + 4) % 4];
        c.fillStyle = tronMau(mau, "#5a6ab0", 0.35 + s * 0.3);
        veSanHoNhanh(c, xx, dat, 0.9 + bam(i + 1) * 0.5);
        c.fillStyle = tronMau("#ffe0a0", "#5a6ab0", 0.4);
        c.beginPath(); c.ellipse(xx + 70, dat, 28, 16, 0, Math.PI, PI2); c.fill();
      });
      // rong biển đung đưa phía trước
      this.veLop(camX, 0.75, 120, dat, (x, y, i) => {
        if (bam(i + 7) < 0.35) return;
        const xx = x + 30 + bam(i) * 50, cao = 50 + bam(i + 2) * 60;
        c.strokeStyle = i % 2 ? "#3fae6a" : "#2f9a5a"; c.lineWidth = 7; c.lineCap = "round";
        for (let k = 0; k < 2; k++) { c.beginPath(); c.moveTo(xx + k * 10, dat); c.quadraticCurveTo(xx + k * 10 + Math.sin(t * 1.5 + i + k) * 14, dat - cao * 0.5, xx + k * 10 + Math.sin(t * 1.5 + i + k + 1) * 10, dat - cao + k * 12); c.stroke(); }
      });
      // bong bóng nổi lên
      c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 1.5;
      for (let i = 0; i < 26; i++) {
        const x = ((bam(i) * W * 1.3 - camX * 0.3 + Math.sin(t * 2 + i) * 6) % W + W) % W, y = dat - ((bam(i + 50) * H + t * (30 + bam(i + 9) * 30)) % dat);
        c.beginPath(); c.arc(x, y, 2 + bam(i + 3) * 4, 0, PI2); c.stroke();
      }
    },

    dat(camX, ds, doDai) {
      const c = this.c, y = this.dat, H = this.cao, t = this.t;
      const { ho, doan } = chiaDuong(this, camX, ds);
      ho.forEach(([a, b]) => { // vực sâu tối, đốm sáng li ti
        const gr = c.createLinearGradient(0, y, 0, H);
        gr.addColorStop(0, "#14508a"); gr.addColorStop(1, "#050f2a");
        c.fillStyle = gr; c.fillRect(a, y + 4, b - a, H - y);
        for (let k = 0; k < 4; k++) { const nhap = 0.4 + Math.sin(t * 3 + k * 2) * 0.4; c.fillStyle = `rgba(150,255,230,${nhap})`; c.beginPath(); c.arc(a + (b - a) * (0.2 + k * 0.2), y + 30 + (k % 2) * 20, 2, 0, PI2); c.fill(); }
      });
      doan.forEach(([a, b]) => {
        c.fillStyle = "#e8c98a"; c.fillRect(a, y + 10, b - a, H - y);
        c.save(); c.beginPath(); c.rect(a, y + 10, b - a, H - y); c.clip();
        c.fillStyle = "rgba(160,120,60,0.25)";
        moiBuoc(camX, a, b, 30, (i, x) => { c.beginPath(); c.arc(x + bam(i) * 20, y + 24 + bam(i + 1) * 40, 2 + bam(i + 2) * 2, 0, PI2); c.fill(); });
        c.restore();
        c.fillStyle = "#f6dfa8"; c.beginPath(); c.roundRect(a - 2, y - 3, b - a + 4, 15, 7); c.fill();
        c.strokeStyle = "#e0c080"; c.lineWidth = 1.6;
        moiBuoc(camX, a, b, 40, (i, x) => { if (x < a + 6 || x > b - 26) return; c.beginPath(); c.moveTo(x, y + 5); c.quadraticCurveTo(x + 10, y + 1, x + 20, y + 5); c.stroke(); });
        moiBuoc(camX, a, b, 100, (i, x) => { // vỏ sò, sao biển nhỏ
          if (bam(i * 3) > 0.45 || x < a + 8 || x > b - 8 || x > doDai - camX + 40) return;
          if (bam(i) < 0.5) { c.fillStyle = "#ffb0c0"; c.beginPath(); c.moveTo(x - 6, y + 2); c.quadraticCurveTo(x, y - 9, x + 6, y + 2); c.fill(); }
          else { c.fillStyle = "#ff8a5c"; c.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 2.5 : 6, g = k * Math.PI / 5 - Math.PI / 2; c.lineTo(x + Math.cos(g) * r, y - 3 + Math.sin(g) * r); } c.fill(); }
        });
      });
    },
    mieng(x, w) { // mép cát lở xuống vực
      const c = this.c, y = this.dat;
      c.fillStyle = "#f6dfa8";
      for (const ex of [x, x + w]) { c.beginPath(); c.arc(ex, y + 5, 7, 0, PI2); c.fill(); }
      c.fillStyle = "rgba(246,223,168,0.5)"; c.beginPath(); c.moveTo(x, y + 8); c.lineTo(x + 12, y + 30); c.lineTo(x, y + 30); c.fill();
      c.beginPath(); c.moveTo(x + w, y + 8); c.lineTo(x + w - 12, y + 30); c.lineTo(x + w, y + 30); c.fill();
    },

    nenHang(camX) { // hang ngọc trai: vách tím thẫm, sò mở có ngọc trai sáng, hải quỳ phát quang
      const c = this.c, W = this.rong, Hc = this.cao, dat = this.dat, t = this.t;
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, "#1a1440"); gr.addColorStop(1, "#3a2a7a");
      c.fillStyle = gr; c.fillRect(0, 0, W, Hc);
      c.fillStyle = "rgba(255,255,255,0.05)";
      moiBuoc(camX * 0.4, -100, W + 100, 110, (i, x) => { c.beginPath(); c.ellipse(x + 50, 40 + bam(i) * dat * 0.5, 50, 26, 0, 0, PI2); c.fill(); });
      // hải quỳ phát quang
      moiBuoc(camX * 0.7, -80, W + 80, 150, (i, x) => {
        const xx = x + 40, mau = i % 2 ? "rgba(120,255,220," : "rgba(255,140,220,";
        for (let k = 0; k < 7; k++) { c.strokeStyle = mau + "0.8)"; c.lineWidth = 4; c.lineCap = "round"; c.beginPath(); c.moveTo(xx, dat - 4); c.quadraticCurveTo(xx + (k - 3) * 6 + Math.sin(t * 2 + k) * 4, dat - 20, xx + (k - 3) * 8, dat - 32 + Math.abs(k - 3) * 3); c.stroke(); }
        c.fillStyle = mau + "0.15)"; c.beginPath(); c.arc(xx, dat - 20, 34, 0, PI2); c.fill();
      });
      // sò mở có ngọc trai
      moiBuoc(camX * 0.85, -100, W + 100, 230, (i, x) => {
        const xx = x + 140, yy = dat - 6, nhip = 1 + Math.sin(t * 3 + i) * 0.2;
        c.fillStyle = "rgba(255,240,255,0.2)"; c.beginPath(); c.arc(xx, yy - 18, 30 * nhip, 0, PI2); c.fill();
        c.fillStyle = "#c8a8e8"; c.beginPath(); c.ellipse(xx, yy, 30, 10, 0, 0, PI2); c.fill();
        c.save(); c.translate(xx - 30, yy - 2); c.rotate(-0.5); c.fillStyle = "#b898e0"; c.beginPath(); c.ellipse(30, 0, 30, 12, 0, Math.PI, PI2); c.fill(); c.restore();
        c.fillStyle = "#fff8ff"; c.beginPath(); c.arc(xx, yy - 8, 8, 0, PI2); c.fill();
        c.fillStyle = "rgba(255,200,240,0.7)"; c.beginPath(); c.arc(xx - 2, yy - 10, 3, 0, PI2); c.fill();
      });
      c.fillStyle = "#c8b080"; c.fillRect(0, dat, W, Hc - dat);
      c.fillStyle = "#e8d4a0"; c.fillRect(0, dat, W, 8);
    },

    bongLauDai(x, y, k) { // bóng tàu đắm nghiêng
      const c = this.c;
      c.save(); c.translate(x, y); c.rotate(-0.08); c.fillStyle = "#2a6aa0";
      c.beginPath(); c.moveTo(-220 * k, -60 * k); c.lineTo(220 * k, -80 * k); c.lineTo(170 * k, 0); c.lineTo(-180 * k, 0); c.fill();
      c.fillRect(-20 * k, -260 * k, 12 * k, 200 * k); c.fillRect(-100 * k, -66 * k, 120 * k, -60 * k);
      c.restore();
    },

    lauDai(g) { // tàu đắm gỗ nghiêng, cột buồm gãy, lá cờ rách, cửa khoang mở khi thắng
      const c = this.c, t = this.t;
      c.save(); c.rotate(-0.05);
      c.fillStyle = "#7a4a28"; c.beginPath(); c.moveTo(-230, -150); c.lineTo(230, -170); c.quadraticCurveTo(220, -60, 170, 0); c.lineTo(-170, 0); c.quadraticCurveTo(-220, -60, -230, -150); c.fill();
      c.strokeStyle = "#5a3418"; c.lineWidth = 2.5;
      for (let r = 1; r < 5; r++) { c.beginPath(); c.moveTo(-224 + r * 6, -150 + r * 30); c.lineTo(224 - r * 10, -168 + r * 32); c.stroke(); }
      c.fillStyle = "#c89a58"; c.fillRect(-232, -158, 464, 10);
      // ô cửa sổ tròn
      [-30, 40, 110, 170].forEach(dx => { c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(dx, -110, 12, 0, PI2); c.fill(); c.fillStyle = "#1a4f8e"; c.beginPath(); c.arc(dx, -110, 8, 0, PI2); c.fill(); });
      // cột buồm, buồm rách
      c.fillStyle = "#5a3418"; c.fillRect(30, -290, 12, 130);
      c.fillStyle = "rgba(255,248,230,0.85)"; c.beginPath(); c.moveTo(42, -276); c.quadraticCurveTo(100, -250 + Math.sin(t * 2) * 6, 110, -196); c.lineTo(92, -188); c.lineTo(78, -200); c.lineTo(58, -182); c.lineTo(42, -186); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.moveTo(42, -290); c.lineTo(80 + Math.sin(t * 2) * 4, -282); c.lineTo(76, -270); c.lineTo(42, -272); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(56, -281, 4, 0, PI2); c.fill();
      c.restore();
      // rong biển, sao biển bám tàu
      c.strokeStyle = "#3fae6a"; c.lineWidth = 6; c.lineCap = "round";
      [-200, 150, 190].forEach((dx, i) => { c.beginPath(); c.moveTo(dx, 0); c.quadraticCurveTo(dx + Math.sin(t * 1.5 + i) * 12, -40, dx + Math.sin(t * 1.5 + i + 1) * 8, -80); c.stroke(); });
      c.fillStyle = "#ff8a5c"; c.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 5 : 12, gg = k * Math.PI / 5 - Math.PI / 2; c.lineTo(-170 + Math.cos(gg) * r, -60 + Math.sin(gg) * r); } c.fill();
      // cửa khoang
      c.fillStyle = "#1a1030"; c.beginPath(); c.roundRect(-120, -96, 64, 96, [10, 10, 0, 0]); c.fill();
      const mo = g.trangThai === "thang" ? Math.min(1, g.tKetThuc / 0.8) : 0;
      c.save(); c.translate(-120, -96); c.scale(1 - mo * 0.85, 1);
      c.fillStyle = "#9a6a3a"; c.fillRect(0, 0, 64, 96); c.strokeStyle = "#5a3418"; c.lineWidth = 2; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(k * 16, 0); c.lineTo(k * 16, 96); c.stroke(); }
      c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(52, 50, 4, 0, PI2); c.fill();
      c.restore();
      c.fillStyle = "#fff"; c.beginPath(); c.roundRect(-20, -150, 110, 30, 10); c.fill();
      c.strokeStyle = "#ff8a5c"; c.lineWidth = 3; c.stroke();
      c.fillStyle = "#1a4f8e"; c.font = '800 18px "Baloo 2", "Be Vietnam Pro", system-ui, sans-serif'; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("Tàu Đắm", 35, -134);
    }
  };

  function veSanHoNhanh(c, x, y, k) { // san hô cành phía xa (vẽ bằng đường dày)
    c.strokeStyle = c.fillStyle; c.lineWidth = 9 * k; c.lineCap = "round";
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 60 * k);
    c.moveTo(x, y - 30 * k); c.lineTo(x - 24 * k, y - 56 * k); c.lineTo(x - 26 * k, y - 76 * k);
    c.moveTo(x, y - 40 * k); c.lineTo(x + 22 * k, y - 62 * k); c.lineTo(x + 30 * k, y - 84 * k);
    c.moveTo(x, y - 60 * k); c.lineTo(x - 6 * k, y - 90 * k); c.stroke();
  }

  /* ================================================================
     SINH VẬT / VẬT CẢN DƯỚI BIỂN
     ================================================================ */
  ST.VE_QUAI = ST.VE_QUAI || {};
  Object.assign(ST.VE_QUAI, {
    sanHoNao(w, h) { // san hô não: khối tròn có vân uốn lượn
      const c = this.c;
      c.fillStyle = "#f0a840"; c.beginPath(); c.ellipse(0, -h * 0.5, w / 2, h * 0.55, 0, Math.PI, PI2); c.lineTo(w / 2, 0); c.lineTo(-w / 2, 0); c.fill();
      c.strokeStyle = "#c8782a"; c.lineWidth = 2.5;
      for (let r = 0; r < 3; r++) { c.beginPath(); for (let x = -w * 0.4; x <= w * 0.4; x += 4) c.lineTo(x, -h * (0.3 + r * 0.22) + Math.sin(x * 0.4 + r) * 4); c.stroke(); }
      c.fillStyle = "rgba(255,255,255,0.3)"; c.beginPath(); c.ellipse(-w * 0.2, -h * 0.75, 8, 5, -0.3, 0, PI2); c.fill();
    },
    soKhongLo(w, h, t) { // con sò khổng lồ hé miệng, lấp ló viên ngọc trai
      const c = this.c, mo = (Math.sin(t * 2) + 1) * 0.08;
      c.fillStyle = "#9b7cf0"; c.beginPath(); c.moveTo(-w / 2, -h * 0.35); c.quadraticCurveTo(0, 6, w / 2, -h * 0.35); c.closePath(); c.fill();
      c.fillStyle = "#fff8ff"; c.beginPath(); c.arc(0, -h * 0.4, 8, 0, PI2); c.fill();
      c.save(); c.translate(w / 2, -h * 0.35); c.rotate(mo);
      c.fillStyle = "#b8a0ff"; c.beginPath(); c.moveTo(-w, 0); c.quadraticCurveTo(-w * 0.5, -h * 1.3, 0, 0); c.closePath(); c.fill();
      c.strokeStyle = "#7a5ce0"; c.lineWidth = 2; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(-w * 0.5, -h * 0.55); c.lineTo(-w + k * w / 5, 0); c.stroke(); }
      c.restore();
    },
    moNeo(w, h) { // mỏ neo gỉ cắm nghiêng trên cát, có dây thừng
      const c = this.c;
      c.save(); c.rotate(0.12);
      c.strokeStyle = "#5a6478"; c.lineWidth = 8; c.lineCap = "round";
      c.beginPath(); c.moveTo(0, -h + 12); c.lineTo(0, -6); c.stroke();
      c.beginPath(); c.moveTo(-w * 0.32, -h * 0.66); c.lineTo(w * 0.32, -h * 0.66); c.stroke();
      c.beginPath(); c.arc(0, -h * 0.4, w * 0.42, Math.PI * 0.1, Math.PI * 0.9); c.stroke();
      c.lineWidth = 4; c.beginPath(); c.arc(0, -h + 6, 7, 0, PI2); c.stroke();
      c.fillStyle = "#5a6478"; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * w * 0.44, -h * 0.34); c.lineTo(s * w * 0.5, -h * 0.5); c.lineTo(s * w * 0.3, -h * 0.4); c.fill(); });
      c.fillStyle = "#c8783a"; [[-0.2, -0.5], [0.1, -0.2], [0.3, -0.35]].forEach(([a, b]) => { c.beginPath(); c.arc(a * w, b * h, 3, 0, PI2); c.fill(); });
      c.restore();
      c.strokeStyle = "#d8b878"; c.lineWidth = 3; c.beginPath(); c.moveTo(4, -h + 6); c.quadraticCurveTo(w * 0.5, -h * 0.8, w * 0.45, -2); c.stroke();
    },
    ruongDam(w, h) { // rương châu báu mở nắp, ngọc và vàng tràn ra
      const c = this.c, than = h * 0.58;
      c.fillStyle = "#8a4a24"; c.beginPath(); c.roundRect(-w / 2, -than, w, than, 4); c.fill();
      c.fillStyle = "#c8a840"; c.fillRect(-w / 2, -than, w, 4); c.fillRect(-w * 0.1, -than, 6, than);
      c.save(); c.translate(-w / 2, -than); c.rotate(-0.55);
      c.fillStyle = "#9a5a2a"; c.beginPath(); c.roundRect(0, -h * 0.34, w, h * 0.34, [10, 10, 2, 2]); c.fill();
      c.fillStyle = "#c8a840"; c.fillRect(0, -4, w, 4); c.restore();
      [["#ffd23f", -0.2], ["#ff5a8a", 0.05], ["#3fd6c8", 0.25], ["#ffd23f", 0.15]].forEach(([m, a], i) => { c.fillStyle = m; c.beginPath(); c.arc(a * w, -than - 3 - (i % 2) * 4, 5, 0, PI2); c.fill(); });
      c.fillStyle = "#fff8ff"; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(w * 0.36 - k * 5, -than * 0.85 + k * 5, 2.4, 0, PI2); c.fill(); } // chuỗi ngọc
    },
    thungGoBien(w, h) { // thùng gỗ đắm có vành sắt, rong bám
      const c = this.c;
      c.fillStyle = "#a8683a"; c.beginPath(); c.moveTo(-w * 0.42, 0); c.quadraticCurveTo(-w * 0.56, -h / 2, -w * 0.42, -h); c.lineTo(w * 0.42, -h); c.quadraticCurveTo(w * 0.56, -h / 2, w * 0.42, 0); c.fill();
      c.strokeStyle = "#7a4a22"; c.lineWidth = 1.6; [-0.2, 0, 0.2].forEach(k => { c.beginPath(); c.moveTo(k * w, -2); c.lineTo(k * w, -h + 2); c.stroke(); });
      c.fillStyle = "#5a6478"; c.fillRect(-w * 0.48, -h * 0.82, w * 0.96, 5); c.fillRect(-w * 0.48, -h * 0.22, w * 0.96, 5);
      c.strokeStyle = "#3fae6a"; c.lineWidth = 4; c.lineCap = "round"; c.beginPath(); c.moveTo(w * 0.3, -h); c.quadraticCurveTo(w * 0.45, -h - 12, w * 0.32, -h - 20); c.stroke();
    },
    cumRongBien(w, h, t) { // bụi rong biển xanh đung đưa
      const c = this.c;
      c.lineCap = "round";
      for (let k = 0; k < 6; k++) {
        const x = -w * 0.4 + k * w * 0.16, lac = Math.sin(t * 2 + k) * 6;
        c.strokeStyle = k % 2 ? "#2fae6a" : "#58c84e"; c.lineWidth = 7;
        c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + lac, -h * 0.5, x + lac * 0.6, -h + (k % 3) * 6); c.stroke();
      }
      c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(-w * 0.1, -h * 0.5, 2.5, 0, PI2); c.arc(w * 0.2, -h * 0.65, 2.5, 0, PI2); c.fill();
    },
    cotSanHo(w, h) { // cột san hô cao chồng nhiều tầng hồng cam, quá cao để vượt
      const c = this.c, so = 5, buoc = h / so;
      for (let j = 0; j < so; j++) {
        c.fillStyle = j % 2 ? "#ff7a8a" : "#ff9a6a";
        const rr = w * (0.48 - j * 0.04);
        c.beginPath(); c.ellipse(j % 2 ? 3 : -3, -j * buoc - buoc / 2, rr, buoc * 0.62, 0, 0, PI2); c.fill();
        c.fillStyle = "rgba(255,255,255,0.4)"; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(-rr * 0.6 + k * rr * 0.3, -j * buoc - buoc / 2 + (k % 2) * 6 - 3, 2.5, 0, PI2); c.fill(); }
      }
      c.fillStyle = "#ffd23f"; c.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 4 : 10, g = k * Math.PI / 5 - Math.PI / 2; c.lineTo(Math.cos(g) * r, -h - 4 + Math.sin(g) * r); } c.fill();
    },
    rongBienCao(w, h, t) { // rừng tảo bẹ cao có phao khí tròn
      const c = this.c;
      c.lineCap = "round";
      for (let k = 0; k < 4; k++) {
        const x = -w * 0.36 + k * w * 0.24, lac = Math.sin(t * 1.5 + k) * 8;
        c.strokeStyle = k % 2 ? "#7a8a2a" : "#9aa83a"; c.lineWidth = 9;
        c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + lac, -h * 0.3, x - lac, -h * 0.65, x + lac * 0.5, -h + (k % 2) * 10); c.stroke();
        c.fillStyle = "#c8a83a"; for (let j = 1; j < 5; j++) { c.beginPath(); c.ellipse(x + 8 + Math.sin(j + k) * 3, -h * j / 5, 7, 4, 0.5, 0, PI2); c.fill(); }
      }
    },
    saoBien(w, h, t, o) { // sao biển hồng đứng bò bằng năm cánh
      const c = this.c, lac = o.dangDi ? Math.sin(t * 6) * 0.15 : 0, r = Math.min(w, h) / 2;
      c.save(); c.translate(0, -r); c.rotate(lac);
      c.fillStyle = "#ff6a8a"; c.beginPath();
      for (let k = 0; k < 10; k++) { const rr = k % 2 ? r * 0.45 : r, g = k * Math.PI / 5 - Math.PI / 2; c.lineTo(Math.cos(g) * rr, Math.sin(g) * rr); }
      c.closePath(); c.fill();
      c.fillStyle = "#ffd0d8"; for (let k = 0; k < 5; k++) { const g = k * PI2 / 5 - Math.PI / 2; c.beginPath(); c.arc(Math.cos(g) * r * 0.6, Math.sin(g) * r * 0.6, 2.4, 0, PI2); c.fill(); }
      this.mat(-2, -2, 3, true);
      c.strokeStyle = "#2B2640"; c.lineWidth = 1.5; c.beginPath(); c.arc(-2, 5, 4, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      c.restore();
    },
    cuaBien(w, h, t, o) { // cua đỏ bò ngang, hai càng giơ cao kẹp kẹp
      const c = this.c, kep = Math.sin(t * (o.dangDi ? 10 : 4)) * 0.3, buoc = o.dangDi ? Math.sin(t * 14) * 3 : 0;
      c.strokeStyle = "#c2381e"; c.lineWidth = 3;
      for (let k = 0; k < 3; k++) [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * w * 0.2, -h * 0.35); c.lineTo(s * (w * 0.36 + k * 4), -h * 0.2 + buoc * s); c.lineTo(s * (w * 0.4 + k * 4), -1); c.stroke(); });
      c.fillStyle = "#e8443a"; c.beginPath(); c.ellipse(0, -h * 0.42, w * 0.3, h * 0.26, 0, 0, PI2); c.fill();
      [-1, 1].forEach(s => {
        c.save(); c.translate(s * w * 0.3, -h * 0.6); c.rotate(s * kep);
        c.fillStyle = "#e8443a"; c.beginPath(); c.ellipse(s * 4, -h * 0.18, 8, 10, 0, 0, PI2); c.fill();
        c.fillStyle = "#c2381e"; c.beginPath(); c.moveTo(s * 2, -h * 0.3); c.lineTo(s * 6, -h * 0.42); c.lineTo(s * 10, -h * 0.3); c.fill();
        c.restore();
      });
      c.strokeStyle = "#c2381e"; c.lineWidth = 2; c.beginPath(); c.moveTo(-6, -h * 0.6); c.lineTo(-7, -h * 0.75); c.moveTo(6, -h * 0.6); c.lineTo(7, -h * 0.75); c.stroke();
      this.mat(0, -h * 0.75, 3.2, true);
    },
    ocMuonHon(w, h, t, o) { // ốc mượn hồn: vỏ xoắn cam sọc, chân thò ra bò về phía bé
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 10) * 3 : 0;
      c.strokeStyle = "#c2551e"; c.lineWidth = 3; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-w * 0.2, -h * 0.25); c.lineTo(-w * 0.3 - k * 5 + buoc, -1); c.stroke(); }
      c.fillStyle = "#ffb35c"; c.beginPath(); c.arc(w * 0.08, -h * 0.48, h * 0.44, 0, PI2); c.fill();
      c.strokeStyle = "#c8682a"; c.lineWidth = 3; c.beginPath();
      for (let g = 0; g < Math.PI * 4; g += 0.2) { const r = h * 0.4 * (1 - g / (Math.PI * 4.4)); c.lineTo(w * 0.08 + Math.cos(g) * r, -h * 0.48 + Math.sin(g) * r); }
      c.stroke();
      c.fillStyle = "#e8743a"; c.beginPath(); c.ellipse(-w * 0.3, -h * 0.3, w * 0.16, h * 0.16, 0, 0, PI2); c.fill();
      c.strokeStyle = "#e8743a"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-w * 0.34, -h * 0.4); c.lineTo(-w * 0.38, -h * 0.62); c.moveTo(-w * 0.26, -h * 0.4); c.lineTo(-w * 0.24, -h * 0.62); c.stroke();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(-w * 0.38, -h * 0.64, 3.5, 0, PI2); c.arc(-w * 0.24, -h * 0.64, 3.5, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.39, -h * 0.64, 1.8, 0, PI2); c.arc(-w * 0.25, -h * 0.64, 1.8, 0, PI2); c.fill();
    },
    caNoc(w, h, t, o) { // cá nóc phồng tròn đầy gai, bơi sát đáy
      const c = this.c, phong = 1 + Math.sin(t * 3) * 0.06, bo = o.dangDi ? Math.sin(t * 8) * 3 : 0, r = Math.min(w, h) * 0.42 * phong;
      c.save(); c.translate(0, -h * 0.5 + bo);
      c.fillStyle = "#e8c84a";
      for (let k = 0; k < 14; k++) { const g = k * PI2 / 14; c.beginPath(); c.moveTo(Math.cos(g - 0.12) * r, Math.sin(g - 0.12) * r); c.lineTo(Math.cos(g) * (r + 7), Math.sin(g) * (r + 7)); c.lineTo(Math.cos(g + 0.12) * r, Math.sin(g + 0.12) * r); c.fill(); }
      c.fillStyle = "#ffe06a"; c.beginPath(); c.arc(0, 0, r, 0, PI2); c.fill();
      c.fillStyle = "#fff4c8"; c.beginPath(); c.ellipse(0, r * 0.35, r * 0.7, r * 0.5, 0, 0, Math.PI); c.fill();
      c.fillStyle = "#c8a030"; [[0.2, -0.4], [0.45, -0.1], [0.1, -0.7]].forEach(([a, b]) => { c.beginPath(); c.arc(a * r, b * r, 3, 0, PI2); c.fill(); });
      c.fillStyle = "#ffb03b"; c.beginPath(); c.moveTo(r - 2, 0); c.lineTo(r + 12, -8 + bo); c.lineTo(r + 12, 8 + bo); c.fill();
      this.mat(-r * 0.35, -r * 0.2, 3.6, true);
      c.fillStyle = "#e8743a"; c.beginPath(); c.ellipse(-r * 0.75, r * 0.15, 4, 3, 0, 0, PI2); c.fill();
      c.restore();
    },
    tomHum(w, h, t, o) { // tôm hùm đỏ thân dài, càng to, râu dài
      const c = this.c, kep = Math.sin(t * (o.dangDi ? 9 : 3)) * 0.25, buoc = o.dangDi ? Math.sin(t * 14) * 3 : 0;
      c.strokeStyle = "#a82a1e"; c.lineWidth = 2.5;
      for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-w * 0.05 + k * 8, -h * 0.3); c.lineTo(-w * 0.1 + k * 9 + buoc * (k % 2 ? 1 : -1), -1); c.stroke(); }
      c.fillStyle = "#d8442a";
      for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(w * 0.12 + k * w * 0.08, -h * 0.4 + k * 1.5, w * 0.07, h * 0.2 - k, 0, 0, PI2); c.fill(); }
      c.beginPath(); c.moveTo(w * 0.42, -h * 0.35); c.lineTo(w / 2, -h * 0.6); c.lineTo(w / 2 + 4, -h * 0.25); c.lineTo(w / 2, -h * 0.1); c.fill(); // đuôi quạt
      c.beginPath(); c.ellipse(-w * 0.08, -h * 0.45, w * 0.18, h * 0.26, 0, 0, PI2); c.fill();
      c.save(); c.translate(-w * 0.22, -h * 0.6); c.rotate(kep);
      c.fillStyle = "#e8543a"; c.beginPath(); c.ellipse(-w * 0.12, -2, w * 0.14, h * 0.18, -0.2, 0, PI2); c.fill();
      c.fillStyle = "#c2381e"; c.beginPath(); c.moveTo(-w * 0.2, -8); c.lineTo(-w * 0.32, -h * 0.3); c.lineTo(-w * 0.24, -2); c.fill();
      c.restore();
      c.strokeStyle = "#a82a1e"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-w * 0.2, -h * 0.7); c.quadraticCurveTo(-w * 0.4, -h * 1.2, -w * 0.55, -h * 0.9 + Math.sin(t * 4) * 3); c.moveTo(-w * 0.16, -h * 0.7); c.quadraticCurveTo(-w * 0.3, -h * 1.3, -w * 0.48, -h * 1.1); c.stroke();
      this.mat(-w * 0.14, -h * 0.62, 2.6, true);
    },
    bachTuoc(w, h, t, o) { // bạch tuộc tím khổng lồ: đầu to tròn, tám xúc tu uốn lượn, quá cao để vượt
      const c = this.c, nhun = o.dangDi ? Math.sin(t * 4) * 4 : 0;
      c.strokeStyle = "#8a4ac8"; c.lineCap = "round";
      for (let k = 0; k < 8; k++) {
        const x0 = -w * 0.32 + k * w * 0.09, lac = Math.sin(t * 3 + k) * 10;
        c.lineWidth = 12 - Math.abs(k - 3.5); c.beginPath(); c.moveTo(x0, -h * 0.45); c.quadraticCurveTo(x0 + lac - (k < 4 ? 20 : -20), -h * 0.2, x0 + lac * 0.5 + (k - 3.5) * 8, -4); c.stroke();
      }
      c.fillStyle = "#ffd0f0"; for (let k = 0; k < 8; k++) { const x0 = -w * 0.32 + k * w * 0.09 + (k - 3.5) * 6; c.beginPath(); c.arc(x0, -h * 0.12, 2.5, 0, PI2); c.fill(); }
      c.fillStyle = "#a85ae8"; c.beginPath(); c.ellipse(0, -h * 0.66 + nhun, w * 0.44, h * 0.34, 0, 0, PI2); c.fill();
      c.beginPath(); c.ellipse(0, -h * 0.42 + nhun, w * 0.36, h * 0.1, 0, 0, PI2); c.fill();
      c.fillStyle = "#c88af8"; [[-0.2, -0.86], [0.18, -0.8], [0.05, -0.95], [-0.05, -0.72]].forEach(([a, b]) => { c.beginPath(); c.arc(a * w, b * h + nhun, 6, 0, PI2); c.fill(); });
      this.mat(-w * 0.08, -h * 0.56 + nhun, 7, true);
      c.strokeStyle = "#5a2a8a"; c.lineWidth = 2.5; c.beginPath(); c.arc(-w * 0.08, -h * 0.44 + nhun, 8, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    },
    caNguaKhongLo(w, h, t, o) { // cá ngựa vàng khổng lồ: mõm ống, bụng khoang, đuôi cuộn
      const c = this.c, nhun = o.dangDi ? Math.sin(t * 4) * 5 : Math.sin(t * 2) * 3;
      c.save(); c.translate(0, nhun);
      c.strokeStyle = "#e8a83a"; c.lineWidth = w * 0.18; c.lineCap = "round";
      c.beginPath(); c.moveTo(0, -h * 0.4); c.quadraticCurveTo(w * 0.3, -h * 0.15, w * 0.1, -h * 0.08); c.arc(0, -h * 0.1, w * 0.1, 0, Math.PI * 1.6, false); c.stroke(); // đuôi cuộn
      c.fillStyle = "#ffc24a"; c.beginPath(); c.moveTo(-w * 0.1, -h * 0.85); c.quadraticCurveTo(w * 0.4, -h * 0.75, w * 0.2, -h * 0.4); c.quadraticCurveTo(w * 0.05, -h * 0.25, -w * 0.15, -h * 0.4); c.quadraticCurveTo(-w * 0.3, -h * 0.6, -w * 0.1, -h * 0.85); c.fill();
      c.strokeStyle = "#e8a83a"; c.lineWidth = 2; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(-w * 0.2, -h * (0.45 + k * 0.06)); c.lineTo(w * 0.05, -h * (0.43 + k * 0.06)); c.stroke(); }
      c.fillStyle = "#ff8aa8"; c.beginPath(); c.moveTo(w * 0.22, -h * 0.7); c.quadraticCurveTo(w * 0.5, -h * 0.62 + Math.sin(t * 8) * 4, w * 0.3, -h * 0.5); c.fill(); // vây lưng
      c.fillStyle = "#ffc24a"; c.beginPath(); c.ellipse(-w * 0.05, -h * 0.88, w * 0.2, h * 0.1, -0.3, 0, PI2); c.fill();
      c.beginPath(); c.roundRect(-w * 0.46, -h * 0.88, w * 0.3, h * 0.05, 5); c.fill(); // mõm ống
      c.fillStyle = "#e8a83a"; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-w * 0.1 + k * 10, -h * 0.96); c.lineTo(-w * 0.06 + k * 10, -h - 6); c.lineTo(-w * 0.02 + k * 10, -h * 0.96); c.fill(); }
      this.mat(-w * 0.06, -h * 0.9, 5, true);
      c.restore();
    },
    caHe(w, h, t) { // cá hề cam sọc trắng viền đen
      const c = this.c, vay = Math.sin(t * 10) * 5, cy = -h * 0.5;
      c.fillStyle = "#ff8a1c"; c.beginPath(); c.moveTo(w * 0.3, cy); c.lineTo(w / 2, cy - 12 + vay); c.lineTo(w / 2, cy + 12 + vay); c.fill();
      c.beginPath(); c.ellipse(-w * 0.02, cy, w * 0.36, h * 0.42, 0, 0, PI2); c.fill();
      c.save(); c.beginPath(); c.ellipse(-w * 0.02, cy, w * 0.36, h * 0.42, 0, 0, PI2); c.clip();
      [-0.16, 0.12].forEach(k => { c.fillStyle = "#2B2640"; c.fillRect(k * w - 7, cy - h, 14, h * 2); c.fillStyle = "#fff"; c.fillRect(k * w - 5, cy - h, 10, h * 2); });
      c.restore();
      c.fillStyle = "#ff8a1c"; c.beginPath(); c.ellipse(0, cy - h * 0.4, 9, 6, 0, Math.PI, PI2); c.fill();
      this.mat(-w * 0.26, cy - 3, 2.8, true);
    },
    sua(w, h, t) { // con sứa hồng trong mờ, xúc tu lượn sóng, nhấp nhô
      const c = this.c, co = Math.sin(t * 4) * 0.08, r = w / 2;
      c.save(); c.translate(0, -h * 0.55); c.scale(1 + co, 1 - co);
      c.fillStyle = "rgba(255,140,200,0.85)"; c.beginPath(); c.arc(0, 0, r, Math.PI, PI2); c.quadraticCurveTo(r * 0.5, 6, 0, 3); c.quadraticCurveTo(-r * 0.5, 6, -r, 0); c.fill();
      c.fillStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.ellipse(-r * 0.4, -r * 0.5, 5, 8, -0.5, 0, PI2); c.fill();
      this.mat(0, -r * 0.35, 3, true);
      c.restore();
      c.strokeStyle = "rgba(220,90,170,0.85)"; c.lineWidth = 3; c.lineCap = "round";
      for (let k = 0; k < 4; k++) { const x = -r * 0.6 + k * r * 0.4; c.beginPath(); c.moveTo(x, -h * 0.5); c.quadraticCurveTo(x + Math.sin(t * 5 + k) * 6, -h * 0.25, x + Math.sin(t * 5 + k + 1) * 5, 0); c.stroke(); }
    },
    caDuoi(w, h, t) { // cá đuối cát đốm: cánh rộng vẫy sóng, đuôi dài
      const c = this.c, vo = Math.sin(t * 5), cy = -h * 0.5;
      c.strokeStyle = "#8a6a3a"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(w * 0.2, cy); c.quadraticCurveTo(w * 0.45, cy + 4, w * 0.6, cy - 4 + vo * 4); c.stroke();
      c.fillStyle = "#d8a868"; c.beginPath(); c.moveTo(-w * 0.38, cy); c.quadraticCurveTo(-w * 0.1, cy - h * 0.5 - vo * 10, w * 0.25, cy); c.quadraticCurveTo(-w * 0.1, cy + h * 0.5 + vo * 10, -w * 0.38, cy); c.fill();
      c.fillStyle = "#a87838"; [[-0.05, -0.15], [0.08, 0.1], [-0.15, 0.12], [0.1, -0.2]].forEach(([a, b]) => { c.beginPath(); c.arc(a * w, cy + b * h, 3, 0, PI2); c.fill(); });
      this.mat(-w * 0.24, cy - 3, 2.6, true);
    },
    ruaBien(w, h, t) { // rùa biển xanh bơi, mai hoa văn, chân chèo vẫy
      const c = this.c, vo = Math.sin(t * 5) * 0.5, cy = -h * 0.5;
      c.fillStyle = "#7ac85a";
      [[-0.2, -1], [0.22, 1]].forEach(([a, s]) => { c.save(); c.translate(a * w, cy + 6); c.rotate(s * vo + (a < 0 ? 0.6 : -0.4)); c.beginPath(); c.ellipse(0, 10, 6, 14, 0, 0, PI2); c.fill(); c.restore(); });
      c.beginPath(); c.ellipse(-w * 0.42, cy, w * 0.13, h * 0.2, 0, 0, PI2); c.fill();
      c.fillStyle = "#3f8a4a"; c.beginPath(); c.ellipse(0, cy - 2, w * 0.32, h * 0.38, 0, 0, PI2); c.fill();
      c.strokeStyle = "#a8d870"; c.lineWidth = 2;
      [[-0.1, -0.1], [0.12, -0.1], [0, 0.18], [-0.2, 0.15], [0.2, 0.15]].forEach(([a, b]) => { c.beginPath(); for (let k = 0; k < 6; k++) { const g = k * PI2 / 6; c.lineTo(a * w + Math.cos(g) * 6, cy + b * h + Math.sin(g) * 5); } c.closePath(); c.stroke(); });
      this.mat(-w * 0.44, cy - 3, 2.4, true);
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
