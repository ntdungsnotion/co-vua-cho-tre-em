/* ================================================================
   FILE: san_tu/st_ve_troi.js
   CHỨC NĂNG: HÌNH VẼ đường đua 8 "Bầu trời mây" (game Giải Cứu Mèo Con).
              Cảnh: trời xanh hồng, cầu vồng lớn, đảo bay, mây trôi; con đường mây trắng bồng bềnh;
              khoảng trời trống nhìn xuống mặt đất xa tít; hang mây cầu vồng; lâu đài mây ở màn 7;
              bé ĐEO ĐÔI CÁNH trắng vỗ bay. 19 quái / vật cản trên trời (vật trắng có viền tím).
              Quy ước giống st_ve_keo.js: gốc tọa độ giữa đáy vật, mặt quay sang TRÁI, "this" là BoVe.
   BƯỚC: TC_00F
   CẬP NHẬT: 16/10/2026 - TC_00G: đồ của bé gắn theo khung xương mới (st_ve_be.js), bé BAY.
   CẬP NHẬT: 16/10/2026 - TC_00G2: đôi cánh bướm vỗ xòe hai bên (người dùng yêu cầu).
   CẬP NHẬT: 16/10/2026 - TC_00G3: nhìn chéo thấy CẢ HAI cánh (xòe chữ V); mặt trời có tia sáng + vành lửa.
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST;
  const { PI2, tronMau, bam, chiaDuong, moiBuoc } = ST.VE_CHUNG;
  const VIEN = "#9a8ad8"; // viền tím nhạt cho vật trắng
  const CAU_VONG = ["#ff5a5f", "#ff9f1c", "#ffd23f", "#4fc84e", "#3fa3e0", "#7a5ce0"];

  ST.CHU_DE_VE = ST.CHU_DE_VE || {};
  ST.CHU_DE_VE.troi = {
    cong: { soc: "#b8a0ff", nut: "#ffd23f" },
    mauGoHang: ["#b8a8e8", "#fff4ff"],
    phuongTien: {
      tuThe: "bay", nang: 6,
      sau(tt) { // đôi cánh BƯỚM sau lưng (người dùng yêu cầu 16/10/2026): hai cánh xòe hai bên thân rồi khép lại
        const c = this.c, k = tt.k, toc = tt.nhay ? 15 : 8;
        const nhip = Math.sin(tt.t * toc);                  // -1 khép .. 1 xòe
        c.translate(k.lung.x, k.lung.y); c.rotate(k.than);   // hệ thân: -x là phía lưng, -y là phía đầu
        // Nhìn chéo từ phía sau - trên nên thấy CẢ HAI cánh (TC_00G3, người dùng thấy "chỉ 1 cánh"):
        // cánh xa ngả về phía đầu, cánh gần ngả về phía chân; vỗ thì hai cánh cùng xòe ra rồi khép lại như chữ V.
        const mo = 0.5 + 0.5 * nhip;
        [[0.55, 0.88, "#e2d4ff", "#b9a3f5", -0.62 - mo * 0.32, -4], [1, 1, "#ffb3e6", "#c89bff", 0.2 + mo * 0.3, 1]].forEach(([dam, kk, m1, m2, goc, dy]) => {
          const xoe = 0.55 + 0.45 * mo; // khép thì cánh ngắn lại (cánh quay về phía người xem)
          c.save(); c.translate(0, dy); c.rotate(goc); c.scale(xoe * kk, kk); const mo2 = dam;
          c.globalAlpha = 0.72 + 0.28 * mo2;
          const gr = c.createLinearGradient(0, 0, -44, 0); gr.addColorStop(0, m2); gr.addColorStop(1, m1);
          c.fillStyle = gr; c.strokeStyle = VIEN; c.lineWidth = 1.6;
          // cánh trên (to, hướng về phía đầu) + cánh dưới (nhỏ, hướng về phía chân)
          c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-14, -30, -46, -30, -44, -8); c.bezierCurveTo(-42, 2, -18, 2, 0, 0); c.fill(); c.stroke();
          c.beginPath(); c.moveTo(0, 2); c.bezierCurveTo(-12, 4, -34, 10, -30, 24); c.bezierCurveTo(-24, 32, -6, 18, 0, 2); c.fill(); c.stroke();
          c.fillStyle = "rgba(255,255,255,0.75)"; // chấm hoa văn
          c.beginPath(); c.arc(-30, -14, 5, 0, PI2); c.arc(-18, 14, 3.5, 0, PI2); c.fill();
          c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(-38, -9, 2.5, 0, PI2); c.fill();
          c.restore();
        });
        c.globalAlpha = 1;
      },
      truoc(tt) { // vòng hào quang vàng trên đầu
        const c = this.c, t = this.t;
        ST.VE_CHUNG.theoDau(c, tt.k, r => {
          c.strokeStyle = "#ffd23f"; c.lineWidth = 2.6; c.beginPath(); c.ellipse(-1, -r - 6 + Math.sin(t * 3) * 1.2, 10, 3.2, 0, 0, PI2); c.stroke();
        });
      }
    },

    nen(camX, p) {
      const c = this.c, W = this.rong, H = this.cao, dat = this.dat, t = this.t;
      const s = Math.max(0, (p - 0.45) / 0.55); // về cuối: hoàng hôn hồng tím
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, tronMau("#7cc8ff", "#9a7ae8", s * 0.8));
      gr.addColorStop(1, tronMau("#ffe8f4", "#ffc8d8", s));
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // mặt trời: lõi nhỏ, vành lửa, tia sáng tỏa ra (không vẽ khối tròn lớn)
      ST.VE_CHUNG.veMatTroi(c, W * 0.82 - p * W * 0.1, 70 + s * 40, 15, t, 54);
      // cầu vồng lớn xa
      const cvX = W * 0.35 - camX * 0.03 % (W * 2), cvY = dat + 40;
      c.lineWidth = 12;
      CAU_VONG.forEach((m, i) => { c.strokeStyle = m; c.globalAlpha = 0.35; c.beginPath(); c.arc(cvX, cvY, Math.min(W, 900) * 0.42 - i * 12, Math.PI, PI2); c.stroke(); });
      c.globalAlpha = 1;
      // đảo bay xa có thác nước
      this.veLop(camX, 0.15, 520, dat, (x, y, i) => {
        if (bam(i + 2) < 0.3) return;
        const cx = x + 260, cy = 120 + bam(i) * Math.max(40, dat * 0.35) + Math.sin(t * 0.8 + i) * 6, r = 50 + bam(i + 1) * 30;
        c.fillStyle = tronMau("#b89a7a", "#a88aa8", s * 0.5); c.beginPath(); c.moveTo(cx - r, cy); c.lineTo(cx + r, cy); c.lineTo(cx, cy + r * 0.9); c.fill();
        c.fillStyle = tronMau("#7ac85a", "#9aa880", s * 0.5); c.beginPath(); c.ellipse(cx, cy, r, 10, 0, 0, PI2); c.fill();
        c.fillStyle = tronMau("#4fa84a", "#7a8a70", s * 0.5); c.beginPath(); c.arc(cx - r * 0.3, cy - 14, 14, 0, PI2); c.arc(cx - r * 0.15, cy - 22, 12, 0, PI2); c.fill();
        c.fillStyle = "rgba(200,235,255,0.7)"; c.fillRect(cx + r * 0.4, cy, 5, 40 + r * 0.4);
      });
      if (p > 0.45) {
        const a = Math.min(1, (p - 0.45) / 0.15), x = W + 60 - (p - 0.45) / 0.55 * W * 0.35;
        c.globalAlpha = 0.6 * a; ST.CHU_DE_VE.troi.bongLauDai.call(this, x, dat - 70, 0.45); c.globalAlpha = 1;
      }
      // mây trôi lớp giữa
      this.veLop(camX, 0.35, 330, dat - 40, (x, y, i) => {
        veMay(c, x + 100 + bam(i) * 80, 90 + bam(i + 1) * Math.max(60, dat * 0.5) + Math.sin(t * 0.5 + i) * 5, 0.9 + bam(i + 2) * 0.6, "rgba(255,255,255,0.85)");
      });
      // mây gần sát đường
      this.veLop(camX, 0.65, 200, dat, (x, y, i) => {
        veMay(c, x + 40 + bam(i) * 60, dat - 6, 1 + bam(i + 3) * 0.5, tronMau("#ffffff", "#ffe0ec", 0.4 + s * 0.4));
      });
    },

    dat(camX, ds, doDai) {
      const c = this.c, y = this.dat, H = this.cao, t = this.t;
      const { ho, doan } = chiaDuong(this, camX, ds);
      ho.forEach(([a, b]) => { // nhìn xuống: trời xanh, mặt đất xanh lá xa tít, mây nhỏ trôi
        const gr = c.createLinearGradient(0, y, 0, H);
        gr.addColorStop(0, "#9ad8ff"); gr.addColorStop(1, "#5fb0e8");
        c.fillStyle = gr; c.fillRect(a, y + 6, b - a, H - y);
        c.fillStyle = "#7ac85a"; c.fillRect(a, H - 16, b - a, 16);
        c.fillStyle = "#4fa84a"; for (let k = 0; k < 3; k++) c.fillRect(a + (b - a) * (0.15 + k * 0.3), H - 22, 6, 6);
        c.fillStyle = "rgba(255,255,255,0.85)"; const u = (t * 0.2) % 1;
        c.beginPath(); c.ellipse(a + (b - a) * u, y + 40, 12, 5, 0, 0, PI2); c.fill();
      });
      doan.forEach(([a, b]) => {
        const gr = c.createLinearGradient(0, y, 0, H);
        gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, "#e2d8ff");
        c.fillStyle = gr; c.fillRect(a, y + 6, b - a, H - y);
        c.fillStyle = "rgba(154,138,216,0.18)";
        moiBuoc(camX, a, b, 60, (i, x) => { c.beginPath(); c.arc(x + 20, y + 36 + bam(i) * 20, 18, 0, PI2); c.fill(); });
        c.fillStyle = "#ffffff"; c.strokeStyle = "#d8ccff"; c.lineWidth = 2;
        c.save(); c.beginPath(); c.rect(a - 12, y - 30, b - a + 24, 50); c.clip();
        moiBuoc(camX, a - 20, b + 20, 28, (i, x) => { const xx = Math.min(Math.max(x, a + 8), b - 8); c.beginPath(); c.arc(xx, y + 4, 12 + bam(i) * 4, Math.PI, PI2); c.fill(); });
        c.restore();
        c.fillRect(a, y, b - a, 8);
        moiBuoc(camX, a, b, 90, (i, x) => { // lấp lánh
          if (bam(i * 3) > 0.4 || x < a + 8 || x > b - 8 || x > doDai - camX + 40) return;
          this.veSao(x, y - 4, 4, "#ffd23f", t);
        });
      });
    },
    mieng(x, w) { // mép mây tròn
      const c = this.c, y = this.dat;
      c.fillStyle = "#fff";
      for (const ex of [x, x + w]) { c.beginPath(); c.arc(ex, y + 8, 12, 0, PI2); c.fill(); }
    },

    nenHang(camX) { // trong lòng mây: tím hồng, cầu vồng uốn, sao lấp lánh
      const c = this.c, W = this.rong, Hc = this.cao, dat = this.dat, t = this.t;
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, "#5a3a9a"); gr.addColorStop(1, "#c88ad8");
      c.fillStyle = gr; c.fillRect(0, 0, W, Hc);
      moiBuoc(camX * 0.5, -300, W + 300, 420, (i, x) => {
        c.lineWidth = 9; CAU_VONG.forEach((m, k) => { c.strokeStyle = m; c.globalAlpha = 0.55; c.beginPath(); c.arc(x + 210, dat + 20, 170 - k * 9, Math.PI, PI2); c.stroke(); });
        c.globalAlpha = 1;
      });
      for (let i = 0; i < 30; i++) { const x = ((bam(i) * W * 1.5 - camX * 0.3) % W + W) % W, y = bam(i + 30) * dat * 0.85; this.veSao(x, y, 2 + bam(i + 7) * 3 * (0.7 + Math.sin(t * 3 + i) * 0.3), "#fff6c0", t * 0.5 + i); }
      c.fillStyle = "rgba(255,255,255,0.35)"; moiBuoc(camX * 0.3, -100, W + 100, 160, (i, x) => veMay(c, x + 60, 40 + bam(i) * 40, 1.2, "rgba(255,255,255,0.3)"));
      c.fillStyle = "#f4ecff"; c.fillRect(0, dat, W, Hc - dat);
      c.fillStyle = "#fff"; c.fillRect(0, dat, W, 8);
    },

    bongLauDai(x, y, k) {
      const c = this.c;
      c.fillStyle = "#f0e8ff";
      c.fillRect(x - 130 * k, y - 120 * k, 260 * k, 120 * k);
      [-140, -45, 45, 140].forEach((dx, i) => {
        const cao = (i === 1 || i === 2 ? 200 : 160) * k;
        c.fillRect(x + (dx - 20) * k, y - cao, 40 * k, cao);
        c.beginPath(); c.arc(x + dx * k, y - cao, 22 * k, Math.PI, PI2); c.fill();
      });
    },

    lauDai(g) { // lâu đài mây: tường trắng hồng, mái vòm vàng, cờ cầu vồng, cửa mây tan khi thắng
      const c = this.c, t = this.t;
      const thap = (dx, rong, cao) => {
        c.fillStyle = "#fff4fb"; c.fillRect(dx - rong / 2, -cao, rong, cao);
        c.strokeStyle = VIEN; c.lineWidth = 2; c.strokeRect(dx - rong / 2, -cao, rong, cao);
        c.fillStyle = "#ffd23f"; c.beginPath(); c.moveTo(dx - rong / 2 - 4, -cao); c.quadraticCurveTo(dx - rong / 2, -cao - rong * 0.9, dx, -cao - rong * 1.2); c.quadraticCurveTo(dx + rong / 2, -cao - rong * 0.9, dx + rong / 2 + 4, -cao); c.fill();
        c.fillStyle = "#ff8ab8"; c.beginPath(); c.roundRect(dx - 7, -cao + 22, 14, 22, [7, 7, 0, 0]); c.fill();
      };
      c.fillStyle = "#fff4fb"; c.fillRect(-170, -130, 340, 130);
      c.strokeStyle = VIEN; c.lineWidth = 2; c.strokeRect(-170, -130, 340, 130);
      thap(-185, 40, 190); thap(185, 40, 190); thap(-50, 50, 230);
      CAU_VONG.forEach((m, i) => { c.fillStyle = m; c.fillRect(-50, -310 + i * 4, 36 + Math.sin(t * 4 + i * 0.4) * 3, 4); });
      c.fillStyle = "#8a6ac8"; c.fillRect(-52, -312, 3, 40);
      // chân mây
      [-200, -130, -60, 10, 80, 150, 210].forEach((dx, i) => { c.fillStyle = "#fff"; c.beginPath(); c.arc(dx, 4, 30 + (i % 2) * 8, Math.PI, PI2); c.fill(); });
      // cửa
      c.fillStyle = "#6a4ab8"; c.beginPath(); c.roundRect(-120, -96, 64, 96, [32, 32, 0, 0]); c.fill();
      const mo = g.trangThai === "thang" ? Math.min(1, g.tKetThuc / 0.8) : 0;
      c.save(); c.beginPath(); c.roundRect(-120, -96, 64, 96, [32, 32, 0, 0]); c.clip();
      c.globalAlpha = 1 - mo; c.fillStyle = "#fff"; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(-108 + (k % 2) * 30, -80 + k * 18, 20, 0, PI2); c.fill(); }
      c.restore(); c.globalAlpha = 1;
      c.fillStyle = "#fff"; c.beginPath(); c.roundRect(-16, -124, 132, 30, 10); c.fill();
      c.strokeStyle = "#b8a0ff"; c.lineWidth = 3; c.stroke();
      c.fillStyle = "#5a3a9a"; c.font = '800 18px "Baloo 2", "Be Vietnam Pro", system-ui, sans-serif'; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("Lâu Đài Mây", 50, -108);
    }
  };

  function veMay(c, x, y, k, mau) { // đám mây tròn bồng bềnh (đáy phẳng ở y)
    c.fillStyle = mau; c.beginPath();
    c.arc(x, y - 14 * k, 18 * k, 0, PI2); c.arc(x + 22 * k, y - 24 * k, 24 * k, 0, PI2); c.arc(x + 48 * k, y - 14 * k, 18 * k, 0, PI2);
    c.rect(x, y - 14 * k, 48 * k, 14 * k); c.fill();
  }
  function veThanMay(c, x, y, rw, rh) { // khối mây có viền (cho quái làm bằng mây)
    c.beginPath();
    const so = Math.max(3, Math.round(rw / 14));
    for (let k = 0; k <= so; k++) { const g = Math.PI + k * Math.PI / so, cx = x + Math.cos(g) * rw * 0.85, cy = y + Math.sin(g) * rh * 0.85, r = rw / so * 1.3; c.moveTo(cx + r, cy); c.arc(cx, cy, r, 0, PI2); }
    c.moveTo(x + rw, y); c.ellipse(x, y, rw, rh * 0.75, 0, 0, PI2);
  }
  function toMay(c) { // viền ngoài trước (nét dày), tô sau: che các nét bên trong, chỉ còn viền bao quanh
    const lw = c.lineWidth; c.lineWidth = lw * 2; c.stroke(); c.lineWidth = lw; c.fill();
  }

  /* ================================================================
     QUÁI / VẬT CẢN TRÊN TRỜI
     ================================================================ */
  ST.VE_QUAI = ST.VE_QUAI || {};
  Object.assign(ST.VE_QUAI, {
    mayDen(w, h, t) { // đám mây đen nhỏ có mưa lất phất
      const c = this.c;
      c.strokeStyle = "rgba(90,130,200,0.8)"; c.lineWidth = 2;
      for (let k = 0; k < 4; k++) { const u = (t * 2 + k / 4) % 1; c.beginPath(); c.moveTo(-w * 0.3 + k * w * 0.2, -h * 0.4 + u * h * 0.35); c.lineTo(-w * 0.32 + k * w * 0.2, -h * 0.3 + u * h * 0.35); c.stroke(); }
      c.fillStyle = "#6a7088"; veThanMay(c, 0, -h * 0.65, w * 0.48, h * 0.38); c.fill();
      c.fillStyle = "#8a90a8"; c.beginPath(); c.ellipse(-w * 0.1, -h * 0.8, w * 0.2, h * 0.12, 0, 0, PI2); c.fill();
      c.strokeStyle = "#2B2640"; c.lineWidth = 2; c.beginPath(); c.arc(-w * 0.1, -h * 0.55, 5, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.2, -h * 0.68, 2.4, 0, PI2); c.arc(0, -h * 0.68, 2.4, 0, PI2); c.fill();
    },
    cauVong(w, h) { // cầu vồng nhỏ cắm hai đầu vào hai cụm mây
      const c = this.c, r0 = Math.min(w / 2 - 8, h - 6);
      c.lineWidth = 4;
      CAU_VONG.forEach((m, i) => { c.strokeStyle = m; c.beginPath(); c.arc(0, -4, r0 - i * 4, Math.PI, PI2); c.stroke(); });
      [-1, 1].forEach(s => { c.fillStyle = "#fff"; c.strokeStyle = VIEN; c.lineWidth = 1.6; c.beginPath(); c.arc(s * (r0 - 10) - 6, -6, 9, 0, PI2); c.arc(s * (r0 - 10) + 6, -6, 9, 0, PI2); c.arc(s * (r0 - 10), -12, 9, 0, PI2); c.fill(); c.stroke(); });
    },
    dieuGiay(w, h, t, o) { // con diều giấy cắm trên mây, đuôi nơ bay
      const c = this.c, mau = ["#ff5a5f", "#3fa3e0", "#4fc84e"][(o.bienThe || 0) % 3], lac = Math.sin(t * 3) * 0.06;
      c.save(); c.translate(0, -h * 0.55); c.rotate(lac);
      c.fillStyle = mau; c.beginPath(); c.moveTo(0, -h * 0.45); c.lineTo(w * 0.42, 0); c.lineTo(0, h * 0.4); c.lineTo(-w * 0.42, 0); c.fill();
      c.fillStyle = "#ffd23f"; c.beginPath(); c.moveTo(0, -h * 0.45); c.lineTo(w * 0.42, 0); c.lineTo(0, 0); c.fill(); c.beginPath(); c.moveTo(0, h * 0.4); c.lineTo(-w * 0.42, 0); c.lineTo(0, 0); c.fill();
      c.strokeStyle = "#6b4226"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -h * 0.45); c.lineTo(0, h * 0.4); c.moveTo(-w * 0.42, 0); c.lineTo(w * 0.42, 0); c.stroke();
      c.restore();
      c.strokeStyle = "#6b4226"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -h * 0.15); c.quadraticCurveTo(w * 0.3, -h * 0.05 + Math.sin(t * 4) * 4, w * 0.4, 0); c.stroke();
      [[0.15, -0.08], [0.3, -0.03]].forEach(([a, b]) => { c.fillStyle = "#ff8ab8"; c.beginPath(); c.moveTo(a * w, b * h); c.lineTo(a * w - 5, b * h - 5); c.lineTo(a * w - 5, b * h + 5); c.closePath(); c.moveTo(a * w, b * h); c.lineTo(a * w + 5, b * h - 5); c.lineTo(a * w + 5, b * h + 5); c.fill(); });
    },
    coiXayGio(w, h, t) { // cối xay gió nhỏ, cánh quay
      const c = this.c;
      c.fillStyle = "#ffb0c8"; c.beginPath(); c.moveTo(-w * 0.25, 0); c.lineTo(-w * 0.15, -h * 0.66); c.lineTo(w * 0.15, -h * 0.66); c.lineTo(w * 0.25, 0); c.fill();
      c.fillStyle = "#ff6a8a"; c.beginPath(); c.moveTo(-w * 0.22, -h * 0.64); c.lineTo(0, -h * 0.8); c.lineTo(w * 0.22, -h * 0.64); c.fill();
      c.fillStyle = "#7a4ab8"; c.beginPath(); c.roundRect(-6, -h * 0.28, 12, h * 0.28, [6, 6, 0, 0]); c.fill();
      c.save(); c.translate(0, -h * 0.66); c.rotate(t * 2);
      for (let k = 0; k < 4; k++) { c.rotate(PI2 / 4); c.fillStyle = "#fff"; c.strokeStyle = VIEN; c.lineWidth = 1.2; c.beginPath(); c.rect(2, -4, w * 0.4, 8); c.fill(); c.stroke(); }
      c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(0, 0, 4, 0, PI2); c.fill();
      c.restore();
    },
    gioKhinhKhi(w, h) { // giỏ mây tre của khinh khí cầu, dây buộc và bao cát
      const c = this.c, gio = h * 0.6;
      c.fillStyle = "#c8904a"; c.beginPath(); c.moveTo(-w * 0.42, -gio); c.lineTo(w * 0.42, -gio); c.lineTo(w * 0.36, 0); c.lineTo(-w * 0.36, 0); c.fill();
      c.strokeStyle = "#8a5a2a"; c.lineWidth = 1.5;
      for (let r = 1; r < 4; r++) { c.beginPath(); c.moveTo(-w * 0.4, -gio * r / 4); c.lineTo(w * 0.4, -gio * r / 4); c.stroke(); }
      for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * w * 0.16, -gio); c.lineTo(k * w * 0.14, 0); c.stroke(); }
      c.fillStyle = "#8a5a2a"; c.fillRect(-w * 0.44, -gio - 4, w * 0.88, 5);
      c.strokeStyle = "#6b4226"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-w * 0.4, -gio); c.lineTo(-w * 0.3, -h); c.moveTo(w * 0.4, -gio); c.lineTo(w * 0.3, -h); c.stroke();
      c.fillStyle = "#e8d8a8"; c.beginPath(); c.ellipse(w * 0.44, -gio * 0.4, 6, 8, 0, 0, PI2); c.fill();
      c.fillStyle = "#ff5a5f"; c.beginPath(); c.ellipse(0, -h, w * 0.36, 5, 0, Math.PI, PI2); c.fill();
    },
    saoRoi(w, h, t) { // ngôi sao vàng rơi cắm nghiêng trên mây, ngủ gật
      const c = this.c, r = Math.min(w, h) / 2;
      c.save(); c.translate(0, -r); c.rotate(0.2);
      c.fillStyle = `rgba(255,230,120,${0.3 + Math.sin(t * 3) * 0.1})`; c.beginPath(); c.arc(0, 0, r + 8, 0, PI2); c.fill();
      c.fillStyle = "#ffd23f"; c.strokeStyle = "#e8a800"; c.lineWidth = 2; c.beginPath();
      for (let k = 0; k < 10; k++) { const rr = k % 2 ? r * 0.45 : r, g = k * Math.PI / 5 - Math.PI / 2; c.lineTo(Math.cos(g) * rr, Math.sin(g) * rr); }
      c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = "#2B2640"; c.lineWidth = 1.8; c.beginPath(); c.arc(-5, -1, 3, 0.2, Math.PI - 0.2); c.moveTo(8, -1); c.arc(5, -1, 3, 0.2, Math.PI - 0.2); c.stroke();
      c.restore();
      c.fillStyle = "#fff"; c.strokeStyle = VIEN; c.lineWidth = 1.5; c.beginPath(); c.arc(-w * 0.3, -4, 9, 0, PI2); c.arc(-w * 0.1, -2, 9, 0, PI2); c.arc(w * 0.2, -3, 9, 0, PI2); c.fill(); c.stroke();
      c.fillStyle = "#7a5ce0"; c.font = "800 11px sans-serif"; c.textAlign = "left"; c.fillText("z", w * 0.25, -h - 2 - Math.sin(t * 2) * 3);
    },
    thapMay(w, h) { // tháp mây chồng nhiều tầng, quá cao để vượt
      const c = this.c, so = 5, buoc = h / so;
      for (let j = 0; j < so; j++) {
        c.fillStyle = j % 2 ? "#fff" : "#f2ecff"; c.strokeStyle = VIEN; c.lineWidth = 2;
        veThanMay(c, (j % 2 ? 4 : -4), -j * buoc - buoc * 0.45, w * (0.5 - j * 0.03), buoc * 0.5); toMay(c);
      }
      this.veSao(0, -h - 4, 8, "#ffd23f", this.t);
    },
    cayDauThan(w, h, t) { // cây đậu thần xanh cuộn lên trời, lá to
      const c = this.c, lac = Math.sin(t * 1.5) * 4;
      c.strokeStyle = "#3fae4a"; c.lineWidth = 12; c.lineCap = "round";
      c.beginPath(); c.moveTo(0, 0);
      for (let k = 1; k <= 8; k++) c.lineTo(Math.sin(k * 1.2) * w * 0.25 + (k > 5 ? lac : 0), -h * k / 8);
      c.stroke();
      c.strokeStyle = "#2f8a3a"; c.lineWidth = 3; c.beginPath(); c.moveTo(4, 0);
      for (let k = 1; k <= 8; k++) c.lineTo(Math.sin(k * 1.2 + 0.4) * w * 0.25 + 4 + (k > 5 ? lac : 0), -h * k / 8);
      c.stroke();
      c.fillStyle = "#58c84e";
      for (let k = 1; k < 8; k++) { const x = Math.sin(k * 1.2) * w * 0.25, s = k % 2 ? -1 : 1; c.save(); c.translate(x, -h * k / 8); c.rotate(s * 0.8); c.beginPath(); c.ellipse(s * 12, 0, 13, 7, 0, 0, PI2); c.fill(); c.restore(); }
    },
    cuuMay(w, h, t, o) { // cừu lông mây trắng, mặt tím, chân ngắn lũn cũn
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 8) : 0;
      c.fillStyle = "#4a3a6a"; [[-0.22, 1], [-0.08, -1], [0.12, 1], [0.26, -1]].forEach(([a, s]) => { c.fillRect(a * w - 3 + s * buoc * 3, -h * 0.3, 6, h * 0.3); });
      c.fillStyle = "#fff"; c.strokeStyle = VIEN; c.lineWidth = 2; veThanMay(c, w * 0.05, -h * 0.55, w * 0.38, h * 0.36); toMay(c);
      c.fillStyle = "#5a4a7a"; c.beginPath(); c.ellipse(-w * 0.34, -h * 0.55, w * 0.13, h * 0.2, 0, 0, PI2); c.fill();
      c.beginPath(); c.ellipse(-w * 0.26, -h * 0.72, 7, 3.5, 0.6, 0, PI2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(-w * 0.3, -h * 0.75, 7, 0, PI2); c.fill();
      this.mat(-w * 0.36, -h * 0.58, 2.6, true);
    },
    heoCanh(w, h, t, o) { // heo hồng có đôi cánh nhỏ, đi lạch bạch
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 9) : 0, vo = Math.sin(t * 16);
      c.fillStyle = "#e88aa8"; [[-0.2, 1], [-0.06, -1], [0.12, 1], [0.24, -1]].forEach(([a, s]) => { c.beginPath(); c.roundRect(a * w - 4 + s * buoc * 3, -h * 0.3, 8, h * 0.3, 3); c.fill(); });
      c.fillStyle = "#ffb0c8"; c.beginPath(); c.ellipse(w * 0.04, -h * 0.5, w * 0.36, h * 0.3, 0, 0, PI2); c.fill();
      c.fillStyle = "#fff"; c.strokeStyle = VIEN; c.lineWidth = 1.4; c.beginPath(); c.ellipse(w * 0.12, -h * 0.82 - vo * 3, 12, 6, -0.6 - vo * 0.3, 0, PI2); c.fill(); c.stroke();
      c.fillStyle = "#ffb0c8"; c.beginPath(); c.arc(-w * 0.3, -h * 0.58, h * 0.24, 0, PI2); c.fill();
      c.fillStyle = "#e88aa8"; c.beginPath(); c.ellipse(-w * 0.46, -h * 0.52, 6, 5, 0, 0, PI2); c.fill();
      c.fillStyle = "#a8506a"; c.beginPath(); c.arc(-w * 0.47, -h * 0.53, 1.4, 0, PI2); c.arc(-w * 0.45, -h * 0.51, 1.4, 0, PI2); c.fill();
      c.fillStyle = "#e88aa8"; c.beginPath(); c.moveTo(-w * 0.32, -h * 0.78); c.lineTo(-w * 0.26, -h * 0.92); c.lineTo(-w * 0.2, -h * 0.76); c.fill();
      c.strokeStyle = "#e88aa8"; c.lineWidth = 2; c.beginPath(); c.arc(w * 0.42, -h * 0.55, 4, 0, Math.PI * 1.5); c.stroke();
      this.mat(-w * 0.32, -h * 0.66, 2.4, true);
    },
    ngoiSaoDi(w, h, t, o) { // ngôi sao vàng có tay chân, đi nghênh ngang
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 10) : 0, r = w * 0.5;
      c.strokeStyle = "#e8a800"; c.lineWidth = 5; c.lineCap = "round";
      c.beginPath(); c.moveTo(-6, -h * 0.25); c.lineTo(-8 + buoc * 5, -2); c.moveTo(6, -h * 0.25); c.lineTo(8 - buoc * 5, -2); c.stroke();
      c.save(); c.translate(0, -h * 0.55); c.rotate(buoc * 0.08);
      c.fillStyle = "#ffd23f"; c.beginPath();
      for (let k = 0; k < 10; k++) { const rr = k % 2 ? r * 0.48 : r, g = k * Math.PI / 5 - Math.PI / 2; c.lineTo(Math.cos(g) * rr, Math.sin(g) * rr); }
      c.closePath(); c.fill();
      this.mat(-2, -2, 3.4, true);
      c.strokeStyle = "#a86800"; c.lineWidth = 1.8; c.beginPath(); c.arc(-2, 7, 4, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      c.restore();
    },
    kyLanCon(w, h, t, o) { // kỳ lân con trắng, bờm cầu vồng, sừng vàng, phi nước kiệu
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 13) : 0;
      c.strokeStyle = "#e0d8f8"; c.lineWidth = 6; c.lineCap = "round";
      [[-0.2, 1], [-0.06, -1], [0.16, -1], [0.28, 1]].forEach(([a, s]) => { c.beginPath(); c.moveTo(a * w, -h * 0.4); c.lineTo(a * w + s * buoc * 6, -2); c.stroke(); });
      CAU_VONG.forEach((m, i) => { c.strokeStyle = m; c.lineWidth = 3; c.beginPath(); c.moveTo(w * 0.3, -h * 0.55 + i * 2); c.quadraticCurveTo(w * 0.5, -h * 0.55 + i * 3 + Math.sin(t * 6) * 3, w * 0.48, -h * 0.25 + i * 2); c.stroke(); });
      c.fillStyle = "#fff"; c.strokeStyle = VIEN; c.lineWidth = 2;
      c.beginPath(); c.ellipse(w * 0.05, -h * 0.5, w * 0.3, h * 0.18, 0, 0, PI2); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-w * 0.15, -h * 0.55); c.lineTo(-w * 0.25, -h * 0.82); c.lineTo(-w * 0.08, -h * 0.82); c.lineTo(0, -h * 0.55); c.fill();
      c.beginPath(); c.ellipse(-w * 0.28, -h * 0.8, w * 0.15, h * 0.12, -0.2, 0, PI2); c.fill(); c.stroke();
      CAU_VONG.slice(0, 4).forEach((m, i) => { c.fillStyle = m; c.beginPath(); c.ellipse(-w * 0.06 + i * 3, -h * 0.88 + i * 9, 5, 6, 0.4, 0, PI2); c.fill(); });
      c.fillStyle = "#ffd23f"; c.beginPath(); c.moveTo(-w * 0.3, -h * 0.9); c.lineTo(-w * 0.36, -h - 6); c.lineTo(-w * 0.24, -h * 0.9); c.fill();
      c.fillStyle = "#ffb0c8"; c.beginPath(); c.arc(-w * 0.4, -h * 0.76, 2.5, 0, PI2); c.fill();
      this.mat(-w * 0.28, -h * 0.82, 2.4, true);
    },
    tiaSetNho(w, h, t, o) { // tia sét vàng có mặt, nhảy tưng tưng, tóe điện
      const c = this.c, nhun = o.dangDi ? Math.abs(Math.sin(t * 12)) * 5 : 0;
      c.save(); c.translate(0, -nhun);
      c.fillStyle = "#ffe03a"; c.strokeStyle = "#e8a800"; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(-w * 0.1, -h); c.lineTo(w * 0.4, -h); c.lineTo(w * 0.1, -h * 0.55); c.lineTo(w * 0.38, -h * 0.55); c.lineTo(-w * 0.3, 0); c.lineTo(-w * 0.05, -h * 0.42); c.lineTo(-w * 0.35, -h * 0.42); c.closePath(); c.fill(); c.stroke();
      this.mat(w * 0.08, -h * 0.78, 2.6, true);
      c.restore();
      c.strokeStyle = "#7ad8ff"; c.lineWidth = 2;
      if (Math.sin(t * 9) > 0.3) { c.beginPath(); c.moveTo(-w * 0.4, -h * 0.5); c.lineTo(-w * 0.5, -h * 0.6); c.lineTo(-w * 0.45, -h * 0.68); c.moveTo(w * 0.45, -h * 0.3); c.lineTo(w * 0.55, -h * 0.4); c.stroke(); }
    },
    nguoiKhongLoMay(w, h, t, o) { // người khổng lồ mây trắng: thân mây, má hồng, mắt to giận dỗi
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 5) : 0, lac = Math.sin(t * 2) * 0.03;
      c.save(); c.rotate(lac);
      c.fillStyle = "#fff"; c.strokeStyle = VIEN; c.lineWidth = 2.5;
      c.beginPath(); c.roundRect(-w * 0.3 + buoc * 5, -h * 0.25, w * 0.24, h * 0.25, 10); c.roundRect(w * 0.06 - buoc * 5, -h * 0.25, w * 0.24, h * 0.25, 10); c.fill(); c.stroke();
      veThanMay(c, 0, -h * 0.5, w * 0.46, h * 0.28); toMay(c);
      c.beginPath(); c.ellipse(-w * 0.5, -h * 0.55 + buoc * 6, w * 0.12, h * 0.14, 0.3, 0, PI2); c.ellipse(w * 0.5, -h * 0.55 - buoc * 6, w * 0.12, h * 0.14, -0.3, 0, PI2); c.fill(); c.stroke();
      veThanMay(c, 0, -h * 0.82, w * 0.34, h * 0.17); toMay(c);
      this.mat(-w * 0.06, -h * 0.82, 6, true);
      c.fillStyle = "rgba(255,120,160,0.5)"; c.beginPath(); c.arc(-w * 0.28, -h * 0.76, 6, 0, PI2); c.arc(w * 0.18, -h * 0.76, 6, 0, PI2); c.fill();
      c.strokeStyle = "#5a3a9a"; c.lineWidth = 2.5; c.beginPath(); c.arc(-w * 0.06, -h * 0.7, 8, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      c.restore();
    },
    mayGiongKhongLo(w, h, t, o) { // mây giông khổng lồ xám tím, sét lóe, mưa rơi phía dưới
      const c = this.c, lac = Math.sin(t * 2) * 4, set = Math.sin(t * 7) > 0.6;
      c.strokeStyle = "rgba(90,130,200,0.85)"; c.lineWidth = 2.5;
      for (let k = 0; k < 6; k++) { const u = (t * 2.5 + k / 6) % 1; c.beginPath(); c.moveTo(-w * 0.38 + k * w * 0.15, -h * 0.55 + u * h * 0.5); c.lineTo(-w * 0.4 + k * w * 0.15, -h * 0.45 + u * h * 0.5); c.stroke(); }
      if (set) { c.fillStyle = "#ffe03a"; c.beginPath(); c.moveTo(w * 0.1, -h * 0.55); c.lineTo(w * 0.22, -h * 0.55); c.lineTo(w * 0.12, -h * 0.32); c.lineTo(w * 0.22, -h * 0.32); c.lineTo(0, 0); c.lineTo(w * 0.06, -h * 0.26); c.lineTo(-w * 0.04, -h * 0.26); c.fill(); }
      c.fillStyle = "#5a5a7a"; veThanMay(c, lac, -h * 0.75, w * 0.5, h * 0.24); c.fill();
      c.fillStyle = "#7a7a9a"; veThanMay(c, lac - 4, -h * 0.82, w * 0.36, h * 0.14); c.fill();
      this.mat(-w * 0.1 + lac, -h * 0.74, 6.5, true);
      c.fillStyle = "#2B2640"; c.beginPath(); c.ellipse(-w * 0.1 + lac, -h * 0.63, 10, 6, 0, 0, Math.PI); c.fill();
    },
    chimEn(w, h, t) { // chim én xanh đậm, đuôi chẻ, cánh nhọn vỗ nhanh
      const c = this.c, vo = Math.sin(t * 16), cy = -h * 0.5;
      c.fillStyle = "#2a3a7a"; c.beginPath(); c.moveTo(w * 0.2, cy); c.lineTo(w / 2, cy - 8); c.lineTo(w * 0.36, cy); c.lineTo(w / 2, cy + 8); c.fill();
      c.beginPath(); c.moveTo(-w * 0.05, cy - 2); c.lineTo(w * 0.15, cy - h * 0.6 - vo * 8); c.lineTo(w * 0.15, cy - 2); c.fill();
      c.beginPath(); c.ellipse(0, cy, w * 0.28, h * 0.24, 0, 0, PI2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.ellipse(-w * 0.04, cy + 4, w * 0.2, h * 0.14, 0, 0, PI2); c.fill();
      c.fillStyle = "#e8443a"; c.beginPath(); c.arc(-w * 0.26, cy + 2, 4, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.moveTo(-w * 0.32, cy - 3); c.lineTo(-w * 0.42, cy); c.lineTo(-w * 0.32, cy + 1); c.fill();
      this.mat(-w * 0.2, cy - 4, 2.2, true);
    },
    buomCauVong(w, h, t) { // bướm cánh cầu vồng
      const c = this.c, vo = Math.abs(Math.sin(t * 10)), cy = -h * 0.5;
      [-1, 1].forEach(s => {
        c.save(); c.translate(0, cy); c.scale(s * (0.4 + vo * 0.6), 1);
        CAU_VONG.forEach((m, i) => { c.fillStyle = m; c.beginPath(); c.ellipse(w * 0.22, -h * 0.18, w * 0.26 - i * 2.5, h * 0.3 - i * 2.5, -0.3, 0, PI2); c.fill(); });
        c.fillStyle = "#ff8ab8"; c.beginPath(); c.ellipse(w * 0.16, h * 0.2, w * 0.14, h * 0.16, 0.4, 0, PI2); c.fill();
        c.restore();
      });
      c.fillStyle = "#3a2a5a"; c.beginPath(); c.ellipse(0, cy, 4, h * 0.34, 0, 0, PI2); c.fill();
      c.strokeStyle = "#3a2a5a"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-1, cy - h * 0.3); c.lineTo(-6, cy - h * 0.5); c.moveTo(1, cy - h * 0.3); c.lineTo(6, cy - h * 0.5); c.stroke();
      this.mat(0, cy - h * 0.2, 2, true);
    },
    dieuRong(w, h, t) { // con diều hình rồng đỏ, thân uốn lượn nhiều khúc
      const c = this.c, cy = -h * 0.5;
      for (let k = 5; k >= 0; k--) { const x = -w * 0.25 + k * w * 0.13, y = cy + Math.sin(t * 6 - k * 0.8) * 6; c.fillStyle = k % 2 ? "#ffd23f" : "#e8343a"; c.beginPath(); c.arc(x, y, 9 - k * 0.6, 0, PI2); c.fill(); }
      c.fillStyle = "#e8343a"; c.beginPath(); c.roundRect(-w * 0.5, cy - 12, w * 0.3, 22, 8); c.fill();
      c.fillStyle = "#ffd23f"; c.beginPath(); c.moveTo(-w * 0.3, cy - 12); c.lineTo(-w * 0.24, cy - 22); c.lineTo(-w * 0.22, cy - 10); c.fill();
      c.fillStyle = "#fff"; c.fillRect(-w * 0.5, cy + 2, w * 0.14, 3);
      c.strokeStyle = "#ffd23f"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-w * 0.48, cy + 6); c.quadraticCurveTo(-w * 0.56, cy + 14, -w * 0.5, cy + 20); c.stroke();
      this.mat(-w * 0.38, cy - 4, 2.8, true);
    },
    giotMua(w, h, t) { // giọt mưa xanh có mặt tinh nghịch, rơi lắc lư
      const c = this.c, lac = Math.sin(t * 4) * 0.12;
      c.save(); c.translate(0, -h * 0.05); c.rotate(lac);
      c.fillStyle = "#4fb0f0"; c.strokeStyle = "#2a7ac8"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, -h * 0.95); c.quadraticCurveTo(w * 0.45, -h * 0.4, w * 0.4, -h * 0.25); c.arc(0, -h * 0.3, w * 0.4, 0, Math.PI); c.quadraticCurveTo(-w * 0.45, -h * 0.4, 0, -h * 0.95); c.fill(); c.stroke();
      c.fillStyle = "rgba(255,255,255,0.6)"; c.beginPath(); c.ellipse(-w * 0.15, -h * 0.5, 3, 7, 0.3, 0, PI2); c.fill();
      this.mat(0, -h * 0.35, 3, true);
      c.strokeStyle = "#1a4a8a"; c.lineWidth = 1.5; c.beginPath(); c.arc(0, -h * 0.18, 3.5, 0.2, Math.PI - 0.2); c.stroke();
      c.restore();
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
