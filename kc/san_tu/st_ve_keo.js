/* ================================================================
   FILE: san_tu/st_ve_keo.js
   CHỨC NĂNG: HÌNH VẼ của đường đua 2 "Xứ sở kẹo ngọt" (game Giải Cứu Mèo Con / Săn Từ).
              Vẽ bằng code, không dùng ảnh ngoài. Gồm:
                - ST.CHU_DE_VE.keo: trời hồng, mây kẹo bông, núi kem, đồi sô-cô-la,
                  cây kẹo mút / gậy kẹo / kẹo dẻo phía sau đường; mặt đường bánh bông lan
                  phủ kem hồng rắc cốm; hố sô-cô-la; hang kẹo bí mật; lâu đài kẹo (màn 7);
                  màu cổng về đích kiểu gậy kẹo.
                - ST.VE_QUAI: 22 quái / vật cản kẹo. Mỗi hàm vẽ quanh gốc tọa độ ở GIỮA ĐÁY
                  vật (quái bay: đáy = độ cao bay), trong khung [-w/2, w/2] x [-h, 0], mặt quay
                  sang TRÁI (phía bé chạy tới). "this" là BoVe (st_ve.js) nên dùng được this.c,
                  this.mat(), this.veSao()...
              Thêm đường đua mới: làm một file st_ve_<mã>.js giống file này rồi nạp sau st_ve.js.
   BƯỚC: TC_00E
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST = goc.ST || {};
  const PI2 = Math.PI * 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const tronMau = (c1, c2, t) => {
    const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    const r = Math.round(lerp(a >> 16, b >> 16, t)), g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t)), bl = Math.round(lerp(a & 255, b & 255, t));
    return "rgb(" + r + "," + g + "," + bl + ")";
  };
  const bam = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const COM = ["#ff5c8a", "#ffd23f", "#5ad1ff", "#7bd88f", "#b98be0", "#ffffff"]; // cốm màu rắc trên kem
  const com = i => COM[((i % 6) + 6) % 6];

  /* ================================================================
     CẢNH (nền, mặt đường, hang, lâu đài)
     ================================================================ */
  ST.CHU_DE_VE = ST.CHU_DE_VE || {};
  ST.CHU_DE_VE.keo = {
    cong: { soc: "#ff4f7b", nut: "#ff9fd0" }, // cổng về đích: cột trắng sọc đỏ như gậy kẹo
    mauGoHang: ["#e0a85c", "#f6d08d"],        // gờ bánh quế trong hang kẹo

    nen(camX, p) {
      const c = this.c, W = this.rong, H = this.cao, dat = this.dat, t = this.t;
      const s = Math.max(0, (p - 0.45) / 0.55); // gần lâu đài: trời chuyển tím cam
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, tronMau("#ff9fd6", "#b48cff", s * 0.8));
      gr.addColorStop(1, tronMau("#fff0fa", "#ffd9c2", s));
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // mặt trời kẹo xoắn
      const mtX = W * 0.8 - p * W * 0.15, mtY = 70 + s * 60;
      c.fillStyle = "rgba(255,245,180,0.4)"; c.beginPath(); c.arc(mtX, mtY, 48, 0, PI2); c.fill();
      c.fillStyle = "#fff3a8"; c.beginPath(); c.arc(mtX, mtY, 30, 0, PI2); c.fill();
      c.strokeStyle = "#ffb3d1"; c.lineWidth = 4; c.beginPath();
      for (let a = 0; a < Math.PI * 5; a += 0.15) { const r = 27 * a / (Math.PI * 5); c.lineTo(mtX + Math.cos(a + t * 0.6) * r, mtY + Math.sin(a + t * 0.6) * r); }
      c.stroke();
      // mây kẹo bông hồng / xanh
      for (let i = 0; i < 7; i++) {
        const chuKy = 1600, x = ((i * 260 + 80 - camX * 0.12 - t * 6) % chuKy + chuKy) % chuKy - 160;
        veMayKeo(c, x, 40 + bam(i) * Math.min(150, dat * 0.35), 0.7 + bam(i + 9) * 0.6, i % 3 === 1 ? "rgba(190,230,255,0.95)" : "rgba(255,214,236,0.95)");
      }
      // núi kem xa: phủ kem trắng chảy xuống
      this.veLop(camX, 0.18, 420, dat - 120, (x, y, i) => {
        const cx = x + 200, rx = 230 + bam(i) * 60, ry = 150 + bam(i + 3) * 90;
        const mau = ["#ffc4dc", "#bff0dc", "#fff1c9", "#d8c8ff"][((i % 4) + 4) % 4];
        c.fillStyle = tronMau(mau.length === 7 ? mau : "#ffc4dc", "#d9a0d8", s * 0.6);
        c.beginPath(); c.ellipse(cx, dat, rx, ry, 0, Math.PI, PI2); c.fill();
        c.save(); c.beginPath(); c.ellipse(cx, dat, rx, ry, 0, Math.PI, PI2); c.clip();
        c.fillStyle = "rgba(255,255,255,0.85)"; c.beginPath();
        const yk = dat - ry * 0.68;
        c.moveTo(cx - rx, yk);
        for (let k = 0; k <= 12; k++) { const xx = cx - rx + k * rx / 6; c.lineTo(xx, yk + (k % 2 ? 10 + bam(i * 13 + k) * 22 : 2)); }
        c.lineTo(cx + rx, dat - ry - 10); c.lineTo(cx - rx, dat - ry - 10); c.fill();
        c.restore();
        c.fillStyle = "#e8344e"; c.beginPath(); c.arc(cx, dat - ry - 4, 9, 0, PI2); c.fill(); // quả anh đào trên đỉnh
      });
      // lâu đài kẹo xa xa hiện dần khi đi được hơn nửa đường
      if (p > 0.45) {
        const a = Math.min(1, (p - 0.45) / 0.15), x = W + 60 - (p - 0.45) / 0.55 * W * 0.35;
        c.globalAlpha = 0.55 * a; ST.CHU_DE_VE.keo.bongLauDai.call(this, x, dat - 70, 0.45); c.globalAlpha = 1;
      }
      // đồi sô-cô-la rắc cốm
      this.veLop(camX, 0.4, 300, dat - 40, (x, y, i) => {
        const cx = x + 150, rx = 190 + bam(i) * 40, ry = 70 + bam(i + 1) * 50;
        c.fillStyle = tronMau(i % 2 ? "#a8643a" : "#c07a4a", "#9a5a4a", s * 0.5);
        c.beginPath(); c.ellipse(cx, dat, rx, ry, 0, Math.PI, PI2); c.fill();
        for (let k = 0; k < 7; k++) {
          const u = bam(i * 7 + k) * 1.6 - 0.8, xx = cx + u * rx * 0.8, yy = dat - ry * Math.sqrt(Math.max(0, 1 - u * u * 0.64)) * (0.35 + bam(i + k) * 0.5);
          c.save(); c.translate(xx, yy); c.rotate(bam(k + i) * 3); c.fillStyle = com(k + i * 3);
          c.fillRect(-4, -1.5, 8, 3); c.restore();
        }
      });
      // cây kẹo mút, gậy kẹo, kẹo dẻo phía sau đường
      this.veLop(camX, 0.7, 170, dat, (x, y, i) => {
        const r = bam(i + 5), xx = x + 40 + bam(i) * 60, k = 0.8 + bam(i + 2) * 0.5;
        if (r < 0.45) veCayKeoMut(c, xx, dat - 8, k, i, t);
        else if (r < 0.7) veGayKeoNen(c, xx, dat - 6, k);
        else { const m = ["#ff5c8a", "#7bd88f", "#ffb03b", "#b98be0"][i & 3]; c.fillStyle = m; c.beginPath(); c.arc(xx, dat - 6, 18 * k, Math.PI, PI2); c.fill(); c.arc(xx + 26 * k, dat - 6, 13 * k, Math.PI, PI2); c.fill(); c.fillStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.arc(xx - 6 * k, dat - 16 * k, 4 * k, 0, PI2); c.fill(); }
      });
    },

    // MẶT ĐƯỜNG: bánh bông lan nhiều lớp, phủ kem hồng chảy giọt, rắc cốm; hố là sô-cô-la sâu
    dat(camX, ds, doDai) {
      const c = this.c, W = this.rong, y = this.dat, H = this.cao;
      const ho = ds.filter(o => o.nhom === "ho" && o.x - camX < W + 20 && o.x + o.rong - camX > -20)
        .map(o => [o.x - camX, o.x + o.rong - camX]).sort((a, b) => a[0] - b[0]);
      const doan = []; let x0 = -10;
      ho.forEach(([a, b]) => { if (a > x0) doan.push([x0, a]); x0 = Math.max(x0, b); });
      doan.push([x0, W + 10]);
      ho.forEach(([a, b]) => {
        const gr = c.createLinearGradient(0, y, 0, H);
        gr.addColorStop(0, "#6b3420"); gr.addColorStop(1, "#24100a");
        c.fillStyle = gr; c.fillRect(a, y + 4, b - a, H - y);
        c.fillStyle = "rgba(255,220,190,0.18)"; c.beginPath(); c.ellipse((a + b) / 2, y + 30, (b - a) * 0.3, 4, 0, 0, PI2); c.fill(); // ánh bóng sô-cô-la
      });
      doan.forEach(([a, b]) => {
        c.fillStyle = "#f5c77e"; c.fillRect(a, y + 10, b - a, H - y);
        c.save(); c.beginPath(); c.rect(a, y + 10, b - a, H - y); c.clip();
        c.fillStyle = "#fff6e8"; c.fillRect(a, y + 30, b - a, 7);   // lớp kem
        c.fillStyle = "#ff7a9a"; c.fillRect(a, y + 37, b - a, 5);   // lớp mứt dâu
        c.fillStyle = "#e9b468"; c.fillRect(a, y + 42, b - a, H - y);
        const lech = camX % 48;
        for (let x = -lech - 48; x < W + 48; x += 48) {
          const i = Math.round((x + camX) / 48);
          c.fillStyle = "rgba(160,100,40,0.35)"; c.beginPath(); c.arc(x + 12 + bam(i) * 24, y + 52 + bam(i + 1) * 14, 2.5, 0, PI2); c.arc(x + 30 + bam(i + 2) * 12, y + 20, 2, 0, PI2); c.fill();
        }
        c.restore();
        // kem hồng phủ mép trên + giọt kem chảy
        c.fillStyle = "#ff9ccf"; c.beginPath(); c.roundRect(a - 2, y - 3, b - a + 4, 16, 7); c.fill();
        const dau = Math.floor((a + camX) / 22), cuoi = Math.ceil((b + camX) / 22);
        for (let i = dau; i <= cuoi; i++) {
          const gx = i * 22 + 8 - camX; if (gx < a + 4 || gx > b - 4) continue;
          const dai = 4 + bam(i * 5) * 10;
          c.beginPath(); c.roundRect(gx - 4, y + 8, 8, dai + 4, 4); c.fill();
        }
        c.fillStyle = "rgba(255,255,255,0.45)"; c.fillRect(a + 2, y - 1, b - a - 4, 3);
        // cốm rắc trên kem (cố định theo vị trí)
        const d2 = Math.floor((a + camX) / 16), c2 = Math.ceil((b + camX) / 16);
        for (let i = d2; i <= c2; i++) {
          const fx = i * 16 + bam(i) * 10 - camX; if (fx < a + 4 || fx > b - 4) continue;
          c.save(); c.translate(fx, y + 4 + bam(i + 7) * 5); c.rotate(bam(i * 3) * 3); c.fillStyle = com(i);
          c.fillRect(-3, -1, 6, 2.4); c.restore();
        }
        // kẹo tí hon trang trí trên đường
        const d3 = Math.floor((a + camX) / 90), c3 = Math.ceil((b + camX) / 90);
        for (let i = d3; i <= c3; i++) {
          if (bam(i * 3) > 0.3) continue;
          const fx = i * 90 + 30 - camX; if (fx < a + 8 || fx > b - 8 || fx > doDai - camX + 40) continue;
          c.fillStyle = ["#ff5c8a", "#ffd23f", "#7bd88f", "#5ad1ff"][((i % 4) + 4) % 4];
          c.beginPath(); c.arc(fx, y - 3, 6, Math.PI, PI2); c.fill();
          c.fillStyle = "rgba(255,255,255,0.6)"; c.beginPath(); c.arc(fx - 2, y - 6, 1.6, 0, PI2); c.fill();
        }
      });
    },
    mieng(x, w) { // mép hố: giọt kem hồng rủ xuống
      const c = this.c, y = this.dat;
      c.fillStyle = "#ff9ccf";
      for (const ex of [x, x + w]) { c.beginPath(); c.arc(ex, y + 8, 7, 0, PI2); c.fill(); c.beginPath(); c.roundRect(ex - 3, y + 8, 6, 14, 3); c.fill(); }
    },

    // HANG KẸO BÍ MẬT: hang sô-cô-la, siro caramel nhỏ giọt từ trần, kẹo đường phát sáng
    nenHang(camX) {
      const c = this.c, W = this.rong, Hc = this.cao, dat = this.dat, t = this.t;
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, "#2a1208"); gr.addColorStop(1, "#5a2c18");
      c.fillStyle = gr; c.fillRect(0, 0, W, Hc);
      c.fillStyle = "#43200f";
      for (let i = Math.floor(camX * 0.4 / 120) - 1; i < (camX * 0.4 + W) / 120 + 1; i++) {
        const x = i * 120 - camX * 0.4, h = 70 + ((i * 37) % 5) * 18;
        c.beginPath(); c.ellipse(x, dat - 10, 80, h, 0, Math.PI, PI2); c.fill();
      }
      // kẹo đường (kẹo phèn) phát sáng
      const mau = ["#ff9fd6", "#9fe6ff", "#fff08a", "#b6ffb0"];
      for (let i = Math.floor(camX * 0.7 / 170) - 1; i < (camX * 0.7 + W) / 170 + 1; i++) {
        const x = i * 170 + 60 - camX * 0.7, m = mau[((i % 4) + 4) % 4], nhip = 0.55 + Math.sin(t * 2 + i) * 0.25;
        c.fillStyle = m; c.globalAlpha = 0.22 * nhip; c.beginPath(); c.arc(x, dat - 30, 36, 0, PI2); c.fill(); c.globalAlpha = 0.9;
        c.strokeStyle = "#f3e2c8"; c.lineWidth = 3; c.beginPath(); c.moveTo(x, dat - 4); c.lineTo(x, dat - 58); c.stroke(); // que
        [[-1, 0], [1, 6], [0, 13], [-1, 20], [1, 27]].forEach(([s, dy]) => { c.fillStyle = m; c.beginPath(); c.roundRect(x - 10 + s * 3, dat - 60 + dy, 20, 8, 3); c.fill(); });
        c.globalAlpha = 1;
      }
      // trần hang: siro caramel nhỏ giọt
      c.fillStyle = "#b8662a";
      c.fillRect(0, 0, W, 14);
      for (let i = Math.floor(camX / 46) - 1; i < (camX + W) / 46 + 1; i++) {
        const x = i * 46 - camX, h = 16 + ((i * 53) % 7) * 7, r = 7 + (i % 3);
        c.beginPath(); c.moveTo(x - r - 6, 0); c.lineTo(x - r, h); c.arc(x, h, r, Math.PI, 0, true); c.lineTo(x + r + 6, 0); c.fill();
        const roi = (t * 0.6 + bam(i)) % 1; // giọt siro rơi chậm
        if (bam(i + 3) < 0.4) { c.beginPath(); c.arc(x, h + 10 + roi * (dat - h - 30), 3.5, 0, PI2); c.fill(); }
      }
      // nền hang: sô-cô-la có hạt
      c.fillStyle = "#6e3a1e"; c.fillRect(0, dat, W, Hc - dat);
      c.fillStyle = "#9a5a30"; c.fillRect(0, dat, W, 8);
      c.fillStyle = "#4a240f";
      for (let i = Math.floor(camX / 60); i < (camX + W) / 60 + 1; i++) { c.beginPath(); c.arc(i * 60 - camX + 18, dat + 22 + (i % 2) * 12, 4, 0, PI2); c.fill(); }
    },

    bongLauDai(x, y, k) { // bóng lâu đài kẹo phía xa: tháp ốc quế + kem xoắn
      const c = this.c;
      c.fillStyle = "#c78ab8";
      c.fillRect(x - 60 * k, y - 80 * k, 120 * k, 80 * k);
      [[-70, 120], [70, 120], [0, 150]].forEach(([dx, cao]) => {
        c.fillRect(x + (dx - 20) * k, y - cao * k, 40 * k, cao * k);
        c.beginPath(); c.arc(x + dx * k, y - cao * k, 24 * k, Math.PI, PI2); c.fill();
        c.beginPath(); c.arc(x + dx * k, y - (cao + 26) * k, 14 * k, 0, PI2); c.fill();
      });
    },

    // Lâu đài kẹo (màn 7): thân bánh kem hồng phủ kem chảy, 2 tháp gậy kẹo đội kem xoắn + anh đào,
    // tháp giữa hình bánh cupcake; cổng sô-cô-la mở ra khi thắng. Gốc tọa độ: giữa chân lâu đài.
    lauDai(g) {
      const c = this.c, t = this.t;
      // tháp giữa: cupcake to
      c.fillStyle = "#ffe0ef"; c.fillRect(-60, -230, 120, 90);
      c.fillStyle = "#ffb3d6"; for (let i = 0; i < 6; i++) c.fillRect(-60 + i * 22, -230, 10, 90);
      kemXoan(c, 0, -230, 78, 70, "#ff9ccf");
      c.fillStyle = "#e8344e"; c.beginPath(); c.arc(0, -306, 11, 0, PI2); c.fill();
      c.strokeStyle = "#3f8f3a"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, -316); c.quadraticCurveTo(6, -328, 14, -330); c.stroke();
      // thân bánh kem hai tầng
      c.fillStyle = "#ffd1e8"; c.fillRect(-110, -150, 220, 150);
      c.fillStyle = "#f7c58a"; c.fillRect(-110, -78, 220, 14);
      c.fillStyle = "#fff6e8"; c.fillRect(-110, -64, 220, 6);
      c.fillStyle = "#ff8cc0"; c.beginPath(); c.roundRect(-116, -158, 232, 16, 8); c.fill();
      for (let i = 0; i < 11; i++) { c.beginPath(); c.roundRect(-108 + i * 21, -146, 9, 10 + bam(i) * 16, 5); c.fill(); }
      for (let i = 0; i < 14; i++) { c.save(); c.translate(-100 + bam(i) * 200, -130 + bam(i + 4) * 40); c.rotate(bam(i * 2) * 3); c.fillStyle = com(i); c.fillRect(-4, -1.5, 8, 3); c.restore(); }
      // hai tháp gậy kẹo
      [-150, 150].forEach(dx => {
        const cao = 230;
        c.fillStyle = "#fff"; c.fillRect(dx - 30, -cao, 60, cao);
        c.save(); c.beginPath(); c.rect(dx - 30, -cao, 60, cao); c.clip();
        c.fillStyle = "#ff4f7b";
        for (let yy = -cao - 60; yy < 0; yy += 34) { c.beginPath(); c.moveTo(dx - 30, yy); c.lineTo(dx + 30, yy + 40); c.lineTo(dx + 30, yy + 56); c.lineTo(dx - 30, yy + 16); c.fill(); }
        c.restore();
        kemXoan(c, dx, -cao, 76, 62, dx < 0 ? "#bff0dc" : "#fff1c9");
        c.fillStyle = "#e8344e"; c.beginPath(); c.arc(dx, -cao - 66, 8, 0, PI2); c.fill();
        c.fillStyle = "#6C4CE0"; c.beginPath(); c.roundRect(dx - 11, -cao + 60, 22, 32, [11, 11, 2, 2]); c.fill();
        c.fillStyle = "#fff6a8"; c.beginPath(); c.roundRect(dx - 7, -cao + 64, 14, 22, [7, 7, 1, 1]); c.fill();
      });
      // cổng sô-cô-la
      c.fillStyle = "#4a240f"; c.beginPath(); c.roundRect(-120, -96, 64, 96, [32, 32, 0, 0]); c.fill();
      const mo = g.trangThai === "thang" ? Math.min(1, g.tKetThuc / 0.8) : 0;
      c.fillStyle = "#8a4a24"; c.beginPath(); c.roundRect(-120, -96 + mo * 80, 64, 96 - mo * 80, [32, 32, 0, 0]); c.fill();
      if (mo < 0.9) { c.strokeStyle = "#6b3420"; c.lineWidth = 2; for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(-120 + i * 21, -90 + mo * 80); c.lineTo(-120 + i * 21, 0); c.stroke(); } }
      // biển "Lâu Đài Kẹo"
      c.fillStyle = "#fff"; c.beginPath(); c.roundRect(-20, -140, 120, 30, 10); c.fill();
      c.strokeStyle = "#ff8cc0"; c.lineWidth = 3; c.stroke();
      c.fillStyle = "#c2185b"; c.font = '800 18px "Baloo 2", "Be Vietnam Pro", system-ui, sans-serif'; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("Lâu Đài Kẹo", 40, -124);
      void t;
    }
  };
  function veMayKeo(c, x, y, k, mau) {
    c.fillStyle = mau; c.beginPath();
    c.arc(x, y, 18 * k, 0, PI2); c.arc(x + 20 * k, y - 10 * k, 22 * k, 0, PI2); c.arc(x + 44 * k, y, 18 * k, 0, PI2); c.arc(x + 24 * k, y + 8 * k, 16 * k, 0, PI2);
    c.fill();
  }
  function veCayKeoMut(c, x, y, k, i, t) {
    c.fillStyle = "#fff"; c.fillRect(x - 3 * k, y - 60 * k, 6 * k, 60 * k);
    const cy = y - 76 * k, r = 22 * k, mau = ["#ff5c8a", "#5ad1ff", "#ffb03b", "#b98be0"][((i % 4) + 4) % 4];
    c.fillStyle = "#fff"; c.beginPath(); c.arc(x, cy, r, 0, PI2); c.fill();
    c.strokeStyle = mau; c.lineWidth = 5 * k; c.beginPath();
    for (let a = 0; a < Math.PI * 5; a += 0.2) { const rr = r * 0.92 * a / (Math.PI * 5); c.lineTo(x + Math.cos(a + i) * rr, cy + Math.sin(a + i) * rr); }
    c.stroke();
    c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.arc(x - r * 0.4, cy - r * 0.4, r * 0.25, 0, PI2); c.fill();
    void t;
  }
  function veGayKeoNen(c, x, y, k) {
    c.lineWidth = 9 * k; c.strokeStyle = "#fff";
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 54 * k); c.arc(x + 12 * k, y - 54 * k, 12 * k, Math.PI, 0); c.stroke();
    c.strokeStyle = "#ff4f7b"; c.setLineDash([6 * k, 6 * k]); c.stroke(); c.setLineDash([]);
  }
  // Kem xoắn (soft-serve) đặt trên đỉnh (x, y), rộng w, cao h
  function kemXoan(c, x, y, w, h, mau) {
    c.fillStyle = mau;
    for (let i = 0; i < 3; i++) {
      const ww = w * (1 - i * 0.28), yy = y - i * h * 0.3;
      c.beginPath(); c.ellipse(x, yy - h * 0.12, ww / 2, h * 0.2, 0, 0, PI2); c.fill();
    }
    c.beginPath(); c.moveTo(x - w * 0.12, y - h * 0.8); c.quadraticCurveTo(x, y - h * 1.08, x + w * 0.06, y - h * 0.82); c.fill();
    c.fillStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.ellipse(x - w * 0.2, y - h * 0.18, w * 0.1, h * 0.06, 0, 0, PI2); c.fill();
  }

  /* ================================================================
     QUÁI / VẬT CẢN KẸO (gọi từ BoVe.veChuongNgai, "this" là BoVe)
     ================================================================ */
  ST.VE_QUAI = ST.VE_QUAI || {};
  Object.assign(ST.VE_QUAI, {
    /* ----- vật cản thấp (nhảy qua) ----- */
    banhQuy(w, h, t, o) { // chồng 3 bánh quy sô-cô-la chip, bánh trên cùng phủ kem hồng
      const c = this.c, n = 3, hh = h / n;
      for (let i = 0; i < n; i++) {
        const rx = w / 2 - i * 4, cy = -hh * (i + 0.5);
        c.fillStyle = "#b97a3c"; c.beginPath(); c.ellipse(0, cy + 2, rx, hh / 2 + 1, 0, 0, PI2); c.fill();
        c.fillStyle = "#e2ac66"; c.beginPath(); c.ellipse(0, cy, rx - 1, hh / 2 - 1, 0, 0, PI2); c.fill();
        c.fillStyle = "#5a2e1a";
        [[-0.5, 0], [-0.1, -0.2], [0.3, 0.1], [0.6, -0.1]].forEach(([a, b]) => { c.beginPath(); c.arc(a * rx, cy + b * hh, 2.6, 0, PI2); c.fill(); });
      }
      c.fillStyle = "#ff9ccf"; c.beginPath(); c.ellipse(0, -h + hh * 0.42, w / 2 - 12, hh * 0.3, 0, 0, PI2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(-6, -h + hh * 0.36, 1.8, 0, PI2); c.arc(5, -h + hh * 0.46, 1.8, 0, PI2); c.fill();
      void t; void o;
    },
    keoDeo(w, h, t, o) { // kẹo dẻo hình vòm phủ đường lấp lánh
      const c = this.c, mau = ["#ff5c8a", "#7bd88f", "#ffb03b"][(o && o.bienThe || 0) % 3];
      c.fillStyle = mau; c.beginPath(); c.moveTo(-w / 2, 0);
      c.bezierCurveTo(-w / 2, -h * 0.75, -w * 0.32, -h, 0, -h); c.bezierCurveTo(w * 0.32, -h, w / 2, -h * 0.75, w / 2, 0); c.closePath(); c.fill();
      c.fillStyle = "rgba(0,0,0,0.12)"; c.fillRect(-w / 2, -5, w, 5);
      c.fillStyle = "rgba(255,255,255,0.45)"; c.beginPath(); c.ellipse(-w * 0.2, -h * 0.68, w * 0.1, h * 0.16, -0.4, 0, PI2); c.fill();
      c.fillStyle = "rgba(255,255,255,0.85)";
      for (let i = 0; i < 9; i++) { c.beginPath(); c.arc((bam(i) - 0.5) * w * 0.7, -h * (0.15 + bam(i + 4) * 0.7), 1.4, 0, PI2); c.fill(); }
      void t;
    },
    thanhSoCoLa(w, h) { // thanh sô-cô-la nằm ngang, một đầu còn giấy gói đỏ
      const c = this.c, giay = w * 0.34;
      c.fillStyle = "#5a2e1a"; c.beginPath(); c.roundRect(-w / 2, -h, w - giay + 6, h, 5); c.fill();
      const o1 = (w - giay - 6) / 3;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
        c.fillStyle = "#7d4526"; c.beginPath(); c.roundRect(-w / 2 + 4 + i * o1, -h + 4 + j * (h - 8) / 2, o1 - 4, (h - 8) / 2 - 3, 3); c.fill();
        c.fillStyle = "rgba(255,255,255,0.15)"; c.fillRect(-w / 2 + 6 + i * o1, -h + 6 + j * (h - 8) / 2, o1 - 8, 2);
      }
      c.fillStyle = "#d9dde6"; c.fillRect(w / 2 - giay - 2, -h - 1, 8, h + 1); // giấy bạc
      c.fillStyle = "#e8344e"; c.beginPath(); c.roundRect(w / 2 - giay + 4, -h - 2, giay - 4, h + 2, 5); c.fill();
      c.fillStyle = "#ffd23f"; c.fillRect(w / 2 - giay + 4, -h * 0.62, giay - 4, h * 0.24);
      c.fillStyle = "#fff"; c.beginPath(); c.arc(w / 2 - giay / 2 + 2, -h / 2, 4, 0, PI2); c.fill();
    },
    cocKem(w, h, t, o) { // cốc giấy sọc đựng 3 viên kem + anh đào
      const c = this.c;
      c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-w * 0.4, -h * 0.5); c.lineTo(w * 0.4, -h * 0.5); c.lineTo(w * 0.3, 0); c.lineTo(-w * 0.3, 0); c.fill();
      c.save(); c.clip(); c.fillStyle = ["#ff7eb6", "#5ad1ff", "#b98be0"][(o && o.bienThe || 0) % 3];
      for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 12 - 3, -h * 0.5); c.lineTo(i * 12 + 3, -h * 0.5); c.lineTo(i * 9 + 3, 0); c.lineTo(i * 9 - 3, 0); c.fill(); }
      c.restore();
      [["#bff0dc", -w * 0.16, -h * 0.6], ["#ffc4dc", w * 0.16, -h * 0.6], ["#fff1c9", 0, -h * 0.76]].forEach(([m, x, y]) => {
        c.fillStyle = m; c.beginPath(); c.arc(x, y, w * 0.24, 0, PI2); c.fill();
      });
      c.fillStyle = "#e8344e"; c.beginPath(); c.arc(0, -h + 5, 5, 0, PI2); c.fill();
      c.fillStyle = "rgba(255,255,255,0.6)"; c.beginPath(); c.arc(-w * 0.2, -h * 0.66, 3, 0, PI2); c.fill();
      void t;
    },
    banhKem(w, h) { // miếng bánh kem nhiều lớp, quả dâu trên đỉnh
      const c = this.c, than = h - 10;
      c.fillStyle = "#f7d08a"; c.beginPath(); c.roundRect(-w / 2, -than, w, than, 6); c.fill();
      c.fillStyle = "#fff6e8"; c.fillRect(-w / 2, -than * 0.62, w, 5);
      c.fillStyle = "#ff6b8a"; c.fillRect(-w / 2, -than * 0.36, w, 5);
      c.fillStyle = "#ffb3d6"; c.beginPath(); c.roundRect(-w / 2 - 2, -than - 2, w + 4, 10, 5); c.fill();
      for (let i = 0; i < 5; i++) { c.beginPath(); c.roundRect(-w / 2 + 3 + i * (w - 6) / 5, -than + 4, 7, 6 + bam(i) * 8, 4); c.fill(); }
      c.fillStyle = "#e8344e"; c.beginPath(); c.moveTo(-7, -than - 2); c.quadraticCurveTo(0, -h - 6, 7, -than - 2); c.quadraticCurveTo(0, -than + 6, -7, -than - 2); c.fill();
      c.fillStyle = "#3f8f3a"; c.beginPath(); c.ellipse(0, -h + 1, 6, 3, 0, 0, PI2); c.fill();
    },
    hopKeo(w, h, t, o) { // hộp kẹo có nơ
      const c = this.c, bt = (o && o.bienThe || 0) % 3, than = h * 0.78;
      c.fillStyle = ["#7bd0ff", "#ffd23f", "#c7a6ff"][bt]; c.beginPath(); c.roundRect(-w / 2, -than, w, than, 5); c.fill();
      c.fillStyle = "rgba(255,255,255,0.35)";
      for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-w / 2 + 8 + i * (w - 16) / 3, -than * 0.3, 3.5, 0, PI2); c.arc(-w / 2 + 14 + i * (w - 16) / 3, -than * 0.7, 3.5, 0, PI2); c.fill(); }
      const no = ["#ff4f7b", "#ff4f7b", "#ff8c1a"][bt];
      c.fillStyle = no; c.fillRect(-5, -than, 10, than); c.fillRect(-w / 2, -than * 0.55, w, 8);
      c.beginPath(); c.ellipse(-10, -than - 6, 11, 7, -0.4, 0, PI2); c.ellipse(10, -than - 6, 11, 7, 0.4, 0, PI2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(0, -than - 4, 4, 0, PI2); c.fill();
      void t;
    },
    gayKeo(w, h) { // hàng rào gậy kẹo sọc đỏ trắng + ruy băng xanh
      const c = this.c, n = Math.max(3, Math.round(w / 26)), buoc = (w - 16) / (n - 1);
      c.fillStyle = "#7bd88f"; c.beginPath(); c.roundRect(-w / 2, -h * 0.5, w, 8, 4); c.fill();
      c.lineWidth = 8;
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + 8 + i * buoc, r = 7;
        c.strokeStyle = "#fff"; c.setLineDash([]);
        c.beginPath(); c.moveTo(x, 0); c.lineTo(x, -h + r + 4); c.arc(x - r, -h + r + 4, r, 0, Math.PI, true); c.stroke();
        c.strokeStyle = "#ff4f7b"; c.setLineDash([5, 5]); c.stroke(); c.setLineDash([]);
      }
    },

    /* ----- vật cản cao hơn cú nhảy (phải bắn) ----- */
    thapBanh(w, h) { // tháp bánh kem 4 tầng, nến trên đỉnh
      const c = this.c, tang = 4, th = (h - 18) / tang, mau = ["#ffc4dc", "#bff0dc", "#fff1c9", "#d8c8ff"];
      for (let i = 0; i < tang; i++) {
        const ww = w * (1 - i * 0.1), y0 = -(i + 1) * th;
        c.fillStyle = mau[i]; c.beginPath(); c.roundRect(-ww / 2, y0, ww, th - 1, 5); c.fill();
        c.fillStyle = "#fff"; c.beginPath(); c.roundRect(-ww / 2 - 2, y0 - 2, ww + 4, 8, 4); c.fill();
        for (let k = 0; k < 5; k++) { c.beginPath(); c.roundRect(-ww / 2 + 2 + k * (ww - 4) / 5, y0 + 2, 6, 5 + bam(i * 5 + k) * 8, 3); c.fill(); }
        c.fillStyle = "#e8344e"; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(-ww / 3 + k * ww / 3, y0 + th * 0.62, 3.4, 0, PI2); c.fill(); }
      }
      // nến + ngọn lửa
      const dinh = -tang * th;
      c.fillStyle = "#5ad1ff"; c.fillRect(-3, dinh - 16, 6, 16);
      c.fillStyle = "#ffb000"; c.beginPath(); c.ellipse(0, -h + 1, 4, 6 + Math.sin(this.t * 12) * 1.2, 0, 0, PI2); c.fill();
      c.fillStyle = "#fff6a8"; c.beginPath(); c.ellipse(0, -h + 3, 2, 3, 0, 0, PI2); c.fill();
    },
    keoMutKhongLo(w, h) { // kẹo mút khổng lồ cắm trong đụn kem: quá cao để nhảy qua
      const c = this.c, r = w * 0.62, cy = -h + r;
      c.fillStyle = "#fff"; c.strokeStyle = "#e9d6c8"; c.lineWidth = 2;
      c.beginPath(); c.roundRect(-w * 0.14, cy, w * 0.28, -cy - 20, 4); c.fill(); c.stroke();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(0, cy, r, 0, PI2); c.fill();
      const mau = ["#ff5c8a", "#ffb03b", "#ffd23f", "#7bd88f", "#5ad1ff", "#b98be0"];
      c.lineWidth = 6;
      for (let k = 0; k < 6; k++) {
        c.strokeStyle = mau[k]; c.beginPath();
        for (let a = 0; a < Math.PI * 1.1; a += 0.1) { const rr = r * 0.95 * (a + k * 0.5) / (Math.PI * 1.1 + 2.5); c.lineTo(Math.cos(a + k * 1.05 + this.t * 0.8) * rr, cy + Math.sin(a + k * 1.05 + this.t * 0.8) * rr); }
        c.stroke();
      }
      c.fillStyle = "rgba(255,255,255,0.4)"; c.beginPath(); c.arc(-r * 0.4, cy - r * 0.4, r * 0.22, 0, PI2); c.fill();
      // đụn kem ở chân
      c.fillStyle = "#ffe0ef"; c.beginPath(); c.ellipse(0, -4, w * 0.62, 22, 0, Math.PI, PI2); c.fill();
      c.beginPath(); c.ellipse(-w * 0.25, -14, w * 0.25, 12, 0, Math.PI, PI2); c.ellipse(w * 0.22, -16, w * 0.22, 12, 0, Math.PI, PI2); c.fill();
    },

    /* ----- quái đất ----- */
    gauDeo(w, h, t, o) { veGau.call(this, w, h, t, o, false); },
    ocKem(w, h, t, o) { // ốc kem: thân kem hồng bò chậm, vỏ là kem xoắn
      const c = this.c, co = o.dangDi ? Math.sin(t * 6) * 3 : 0;
      c.fillStyle = "#ffb3d6"; c.beginPath(); c.roundRect(-w / 2 - co, -h * 0.3, w + co, h * 0.3, h * 0.15); c.fill();
      c.strokeStyle = "#ffb3d6"; c.lineWidth = 3.5;
      c.beginPath(); c.moveTo(-w * 0.38, -h * 0.28); c.lineTo(-w * 0.5 - co, -h * 0.8); c.moveTo(-w * 0.28, -h * 0.28); c.lineTo(-w * 0.28, -h * 0.86); c.stroke();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(-w * 0.5 - co, -h * 0.82, 5, 0, PI2); c.arc(-w * 0.28, -h * 0.88, 5, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.52 - co, -h * 0.82, 2.4, 0, PI2); c.arc(-w * 0.3, -h * 0.88, 2.4, 0, PI2); c.fill();
      // vỏ: bánh ốc quế + kem xoắn
      c.fillStyle = "#e2ac66"; c.beginPath(); c.roundRect(-w * 0.08, -h * 0.42, w * 0.5, h * 0.16, 4); c.fill();
      c.strokeStyle = "#b97a3c"; c.lineWidth = 1.5; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-w * 0.08 + i * w * 0.125, -h * 0.42); c.lineTo(-w * 0.08 + i * w * 0.125, -h * 0.26); c.stroke(); }
      kemXoan(c, w * 0.17, -h * 0.4, w * 0.56, h * 0.62, ["#fff4fa", "#bff0dc", "#d8c8ff"][(o.bienThe || 0) % 3]);
      c.strokeStyle = "#2B2640"; c.lineWidth = 2; c.beginPath(); c.arc(-w * 0.38, -h * 0.16, 3, 0, Math.PI); c.stroke();
    },
    giunDeo(w, h, t, o) { // giun dẻo chua 3 màu, rắc đường
      const c = this.c, n = 5, r = h * 0.42, toc = o.dangDi ? 10 : 3, mau = ["#ff5c8a", "#ffd23f", "#5ad1ff"];
      for (let i = n - 1; i >= 0; i--) {
        const x = -w / 2 + r + i * (w - 2 * r) / (n - 1), y = -r - Math.max(0, Math.sin(t * toc - i * 0.9)) * 5;
        c.fillStyle = mau[i % 3]; c.beginPath(); c.arc(x, y, i === 0 ? r * 1.1 : r, 0, PI2); c.fill();
        c.fillStyle = "rgba(255,255,255,0.8)"; c.beginPath(); c.arc(x - 3, y - r * 0.4, 1.3, 0, PI2); c.arc(x + 3, y + r * 0.2, 1.3, 0, PI2); c.fill();
      }
      const hx = -w / 2 + r, hy = -r - Math.max(0, Math.sin(t * toc)) * 5;
      this.mat(hx - 2, hy - 2, 3.6, true);
      c.strokeStyle = "#2B2640"; c.lineWidth = 1.8; c.beginPath(); c.arc(hx - 3, hy + 5, 3, 0.2, Math.PI - 0.2); c.stroke();
    },
    thachRauCau(w, h, t, o) { // thạch rau câu khuôn gợn sóng, rung rinh
      const c = this.c, rung = (o.dangDi ? Math.sin(t * 14) : Math.sin(t * 4)) * 0.06;
      c.save(); c.transform(1, 0, rung, 1, 0, 0);
      const mau = ["rgba(255,92,138,0.85)", "rgba(123,216,143,0.85)", "rgba(185,139,224,0.85)"][(o.bienThe || 0) % 3];
      c.fillStyle = mau; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w * 0.38, -h + 6); c.quadraticCurveTo(0, -h - 4, w * 0.38, -h + 6); c.lineTo(w / 2, 0); c.closePath(); c.fill();
      c.strokeStyle = "rgba(255,255,255,0.45)"; c.lineWidth = 2;
      for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * w * 0.22, -h + 6); c.lineTo(i * w * 0.3, -2); c.stroke(); }
      c.fillStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.ellipse(-w * 0.22, -h * 0.7, 4, 8, 0.3, 0, PI2); c.fill();
      this.mat(-w * 0.08, -h * 0.5, 4.5, true);
      c.strokeStyle = "#2B2640"; c.lineWidth = 2; c.beginPath(); c.arc(-w * 0.08, -h * 0.26, 4, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      c.restore();
    },
    banhRan(w, h, t, o) { // bánh rán lăn tròn, phủ kem hồng rắc cốm (mặt không xoay)
      const c = this.c, r = Math.min(w, h) / 2, cy = -r, xoay = o.dangDi ? -t * 8 : 0;
      c.save(); c.translate(0, cy); c.rotate(xoay);
      c.fillStyle = "#d9944e"; c.beginPath(); c.arc(0, 0, r, 0, PI2); c.arc(0, 0, r * 0.32, 0, PI2, true); c.fill("evenodd");
      c.fillStyle = ["#ff9ccf", "#7a3f1e", "#fff1c9"][(o.bienThe || 0) % 3];
      c.beginPath();
      for (let a = 0; a <= PI2 + 0.01; a += PI2 / 16) { const rr = r * (0.86 + (Math.round(a / (PI2 / 16)) % 2) * 0.06); c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      c.arc(0, 0, r * 0.4, 0, PI2, true); c.fill("evenodd");
      for (let i = 0; i < 10; i++) { const a = i * PI2 / 10, rr = r * 0.63; c.save(); c.translate(Math.cos(a) * rr, Math.sin(a) * rr); c.rotate(a * 2); c.fillStyle = com(i % 5); c.fillRect(-3, -1, 6, 2.4); c.restore(); }
      c.restore();
      this.mat(-r * 0.5, cy - r * 0.15, 4, true);
      c.strokeStyle = "#2B2640"; c.lineWidth = 2; c.beginPath(); c.arc(-r * 0.5, cy + r * 0.3, 4, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    },
    banhGung(w, h, t, o) { // người bánh gừng viền kem trắng, chạy lạch bạch
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 12) : 0;
      // vẽ dáng người 2 lần: viền kem trắng dày phía sau (nổi trên đồi sô-cô-la), rồi thân bánh nâu vàng
      [["#fff6e8", 5], ["#d98a3d", 0]].forEach(([mau, vien]) => {
        c.fillStyle = mau; c.strokeStyle = mau; c.lineCap = "round";
        c.lineWidth = w * 0.22 + vien;
        c.beginPath(); c.moveTo(-w * 0.12, -h * 0.35); c.lineTo(-w * 0.2 + buoc * 6, -6); c.moveTo(w * 0.12, -h * 0.35); c.lineTo(w * 0.2 - buoc * 6, -6); c.stroke(); // chân
        c.beginPath(); c.moveTo(-w * 0.1, -h * 0.55); c.lineTo(-w * 0.42, -h * 0.62 - buoc * 4); c.moveTo(w * 0.1, -h * 0.55); c.lineTo(w * 0.42, -h * 0.62 + buoc * 4); c.stroke(); // tay
        c.beginPath(); c.roundRect(-w * 0.22 - vien / 2, -h * 0.66 - vien / 2, w * 0.44 + vien, h * 0.36 + vien, 8); c.fill();
        c.beginPath(); c.arc(0, -h * 0.8, h * 0.2 + vien / 2, 0, PI2); c.fill();
      });
      // viền kem trắng zíc zắc trên tay / chân, cúc kẹo
      c.strokeStyle = "#fff"; c.lineWidth = 1.8;
      [[-0.36, -0.6], [0.36, -0.6], [-0.18, -0.12], [0.18, -0.12]].forEach(([a, b]) => { c.beginPath(); c.moveTo(a * w - 3, b * h - 3); c.lineTo(a * w, b * h + 2); c.lineTo(a * w + 3, b * h - 3); c.stroke(); });
      [["#ff5c8a", -0.56], ["#7bd88f", -0.45]].forEach(([m, b]) => { c.fillStyle = m; c.beginPath(); c.arc(0, b * h, 3.2, 0, PI2); c.fill(); });
      c.fillStyle = "#fff"; c.beginPath(); c.arc(-w * 0.14, -h * 0.83, 2.8, 0, PI2); c.arc(w * 0.06, -h * 0.83, 2.8, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.16, -h * 0.83, 1.6, 0, PI2); c.arc(w * 0.04, -h * 0.83, 1.6, 0, PI2); c.fill();
      c.strokeStyle = "#2B2640"; c.lineWidth = 2; c.beginPath(); c.moveTo(-w * 0.22, -h * 0.9); c.lineTo(-w * 0.08, -h * 0.87); c.moveTo(w * 0.12, -h * 0.9); c.lineTo(-w * 0.02, -h * 0.87); c.stroke();
      c.strokeStyle = "#fff"; c.beginPath(); c.arc(-w * 0.05, -h * 0.73, 4, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    },

    /* ----- quái khổng lồ (cao hơn cú nhảy: phải bắn) ----- */
    kemKhongLo(w, h, t, o) { // kem ốc quế khổng lồ biết đi
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 5) : 0, lac = Math.sin(t * 2) * 0.03;
      c.fillStyle = "#8a4a24"; c.beginPath(); c.ellipse(-w * 0.16 + buoc * 5, -5, 12, 6, 0, 0, PI2); c.ellipse(w * 0.16 - buoc * 5, -5, 12, 6, 0, 0, PI2); c.fill();
      c.save(); c.rotate(lac);
      const dinhOc = -h * 0.48;
      c.fillStyle = "#e2ac66"; c.beginPath(); c.moveTo(-w * 0.12, -8); c.lineTo(-w / 2, dinhOc); c.lineTo(w / 2, dinhOc); c.lineTo(w * 0.12, -8); c.closePath(); c.fill();
      c.save(); c.clip(); c.strokeStyle = "#b97a3c"; c.lineWidth = 2;
      for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(i * 14, dinhOc); c.lineTo(i * 14 + 60, -8); c.moveTo(i * 14, dinhOc); c.lineTo(i * 14 - 60, -8); c.stroke(); }
      c.restore();
      // 3 viên kem: vẽ từ trên xuống để viên dưới (to nhất, có mặt) nằm trước
      [["#fff1c9", 0, -h * 0.86, w * 0.36], ["#bff0dc", -w * 0.06, -h * 0.72, w * 0.46], ["#ffc4dc", 0, -h * 0.56, w * 0.54]].forEach(([m, x, y, r]) => {
        c.fillStyle = m; c.beginPath(); c.arc(x, y, r, 0, PI2); c.fill();
      });
      c.fillStyle = "#ffc4dc"; c.beginPath(); c.roundRect(-w * 0.4, -h * 0.52, 10, 24, 5); c.roundRect(w * 0.25, -h * 0.52, 9, 18, 5); c.fill(); // kem chảy
      this.mat(-w * 0.12, -h * 0.6, 7, true);
      c.fillStyle = "#c2185b"; c.beginPath(); c.ellipse(-w * 0.12, -h * 0.5, 10, 6, 0, 0, Math.PI); c.fill();
      c.fillStyle = "#e8344e"; c.beginPath(); c.arc(0, -h - 2, 8, 0, PI2); c.fill();
      c.strokeStyle = "#3f8f3a"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -h - 9); c.quadraticCurveTo(5, -h - 18, 11, -h - 19); c.stroke();
      c.restore();
    },
    gauDeoKhongLo(w, h, t, o) { veGau.call(this, w, h, t, o, true); },

    /* ----- quái bay (luôn phải bắn) ----- */
    keoBay(w, h, t, o) { // viên kẹo bọc giấy, hai đầu giấy vỗ như cánh
      const c = this.c, vo = Math.sin(t * 16) * 0.35, mau = ["#ff5c8a", "#5ad1ff", "#ffb03b"][(o && o.bienThe || 0) % 3];
      [-1, 1].forEach(s => {
        c.save(); c.translate(s * w * 0.26, -h / 2); c.rotate(s * vo);
        c.fillStyle = mau; c.beginPath(); c.moveTo(0, 0); c.lineTo(s * w * 0.26, -h * 0.42); c.lineTo(s * w * 0.2, 0); c.lineTo(s * w * 0.26, h * 0.42); c.closePath(); c.fill();
        c.restore();
      });
      c.fillStyle = mau; c.beginPath(); c.ellipse(0, -h / 2, w * 0.3, h * 0.44, 0, 0, PI2); c.fill();
      c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 3;
      for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 8 - 4, -h * 0.9); c.lineTo(i * 8 + 4, -h * 0.1); c.stroke(); }
      this.mat(-w * 0.08, -h * 0.55, 4, true);
    },
    buomKeo(w, h, t) { // bướm cánh kẹo mút xoắn
      const c = this.c, vo = Math.abs(Math.sin(t * 14));
      [[-1, "#ff9fd6"], [1, "#9fe6ff"]].forEach(([s, m]) => {
        c.save(); c.translate(s * 3, -h / 2); c.scale(1, 0.35 + vo * 0.65);
        c.fillStyle = m; c.beginPath(); c.ellipse(s * w * 0.26, -h * 0.12, w * 0.24, h * 0.36, s * 0.3, 0, PI2); c.fill();
        c.strokeStyle = "#fff"; c.lineWidth = 2.5; c.beginPath();
        for (let a = 0; a < Math.PI * 4; a += 0.3) { const r = w * 0.18 * a / (Math.PI * 4); c.lineTo(s * w * 0.26 + Math.cos(a) * r, -h * 0.12 + Math.sin(a) * r); }
        c.stroke(); c.restore();
      });
      c.fillStyle = "#3a2550"; c.beginPath(); c.roundRect(-5, -h * 0.85, 10, h * 0.75, 5); c.fill();
      c.strokeStyle = "#3a2550"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-2, -h * 0.84); c.lineTo(-9, -h - 2); c.moveTo(2, -h * 0.84); c.lineTo(1, -h - 4); c.stroke();
      c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(-9, -h - 2, 2.5, 0, PI2); c.arc(1, -h - 4, 2.5, 0, PI2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(-2, -h * 0.74, 2.6, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-2.6, -h * 0.74, 1.4, 0, PI2); c.fill();
    },
    bongBong(w, h, t) { // bong bóng kẹo cao su hồng phập phồng
      const c = this.c, phong = 1 + Math.sin(t * 5) * 0.05, r = Math.min(w, h) / 2;
      c.save(); c.translate(0, -h / 2); c.scale(phong, 1 / phong);
      c.fillStyle = "#ff8cc0"; c.beginPath(); c.arc(0, 0, r, 0, PI2); c.fill();
      c.fillStyle = "rgba(255,255,255,0.55)"; c.beginPath(); c.ellipse(-r * 0.35, -r * 0.4, r * 0.25, r * 0.14, -0.6, 0, PI2); c.fill();
      c.fillStyle = "#ff6aa8"; c.beginPath(); c.moveTo(r * 0.2, r * 0.95); c.lineTo(r * 0.5, r * 1.1); c.lineTo(r * 0.55, r * 0.75); c.fill();
      this.mat(-r * 0.25, -r * 0.05, 4, true);
      c.strokeStyle = "#2B2640"; c.lineWidth = 2; c.beginPath(); c.arc(-r * 0.25, r * 0.42, 4, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      c.restore();
    },
    keoBong(w, h, t) { // đám kẹo bông hồng xanh có mặt cau có
      const c = this.c, nhun = Math.sin(t * 4) * 2;
      c.save(); c.translate(0, nhun);
      [["#ffd6ec", -w * 0.25, -h * 0.45, h * 0.4], ["#cfeeff", w * 0.22, -h * 0.5, h * 0.42], ["#ffc4e0", 0, -h * 0.62, h * 0.46], ["#e6d6ff", -w * 0.05, -h * 0.32, h * 0.36]]
        .forEach(([m, x, y, r]) => { c.fillStyle = m; c.beginPath(); c.arc(x, y, r, 0, PI2); c.fill(); });
      this.mat(-w * 0.1, -h * 0.55, 4.2, true);
      c.strokeStyle = "#2B2640"; c.lineWidth = 2; c.beginPath(); c.arc(-w * 0.1, -h * 0.28, 4, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      c.restore();
    },
    macaron(w, h, t, o) { // bánh macaron có đôi cánh nhỏ
      const c = this.c, vo = Math.sin(t * 22), mau = ["#b6f0c8", "#ffc4dc", "#d8c8ff"][(o && o.bienThe || 0) % 3];
      c.fillStyle = "rgba(255,255,255,0.85)";
      c.beginPath(); c.ellipse(w * 0.15, -h + 4 - vo * 4, 8, 13, 0.6, 0, PI2); c.ellipse(w * 0.3, -h + 6 + vo * 4, 7, 11, 1, 0, PI2); c.fill();
      c.fillStyle = mau; c.beginPath(); c.ellipse(0, -h * 0.72, w / 2, h * 0.26, 0, 0, PI2); c.fill();
      c.fillStyle = "#fff6e8"; c.beginPath(); c.roundRect(-w / 2 + 3, -h * 0.55, w - 6, h * 0.12, 4); c.fill();
      c.fillStyle = mau; c.beginPath(); c.ellipse(0, -h * 0.28, w / 2, h * 0.24, 0, 0, PI2); c.fill();
      c.fillStyle = "rgba(0,0,0,0.08)"; c.fillRect(-w / 2 + 2, -h * 0.47, w - 4, 3);
      this.mat(-w * 0.12, -h * 0.74, 3.6, true);
      c.strokeStyle = "#2B2640"; c.lineWidth = 1.8; c.beginPath(); c.arc(-w * 0.12, -h * 0.25, 3.5, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    }
  });

  // Gấu dẻo (thường / khổng lồ): thân trong suốt, tay chân lạch bạch; khổng lồ có vương miện
  function veGau(w, h, t, o, khongLo) {
    const c = this.c, buoc = o.dangDi ? Math.sin(t * (khongLo ? 5 : 12)) : Math.sin(t * 3) * 0.3;
    const mau = ["rgba(255,80,110,0.88)", "rgba(110,210,120,0.88)", "rgba(255,170,50,0.9)"][(o.bienThe || 0) % 3];
    const dau = h * 0.34, than = h - dau * 1.6, rT = w * 0.42;
    c.fillStyle = mau;
    c.beginPath(); c.ellipse(-w * 0.2 + buoc * w * 0.06, -h * 0.07, w * 0.16, h * 0.08, 0, 0, PI2); c.ellipse(w * 0.2 - buoc * w * 0.06, -h * 0.07, w * 0.16, h * 0.08, 0, 0, PI2); c.fill(); // chân
    c.beginPath(); c.ellipse(0, -h * 0.1 - than / 2, rT, than / 2 + 2, 0, 0, PI2); c.fill(); // thân
    c.beginPath(); c.ellipse(-w * 0.44, -h * 0.42 - buoc * 3, w * 0.12, h * 0.1, -0.5, 0, PI2); c.ellipse(w * 0.44, -h * 0.42 + buoc * 3, w * 0.12, h * 0.1, 0.5, 0, PI2); c.fill(); // tay
    const dy = -h + dau * 0.95;
    c.beginPath(); c.arc(-w * 0.3, dy - dau * 0.62, dau * 0.3, 0, PI2); c.arc(w * 0.3, dy - dau * 0.62, dau * 0.3, 0, PI2); c.fill(); // tai
    c.beginPath(); c.ellipse(0, dy, w * 0.38, dau * 0.92, 0, 0, PI2); c.fill(); // đầu
    c.fillStyle = "rgba(255,255,255,0.4)"; c.beginPath(); c.ellipse(-w * 0.2, -h * 0.45, w * 0.06, h * 0.08, 0.3, 0, PI2); c.ellipse(-w * 0.16, dy - dau * 0.4, w * 0.06, dau * 0.15, 0.3, 0, PI2); c.fill();
    c.fillStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.ellipse(-w * 0.08, dy + dau * 0.35, w * 0.14, dau * 0.26, 0, 0, PI2); c.fill(); // mõm
    const r = khongLo ? 7 : 4.2;
    this.mat(-w * 0.1, dy - dau * 0.12, r, true);
    c.fillStyle = "#2B2640"; c.beginPath(); c.ellipse(-w * 0.1, dy + dau * 0.26, r * 0.7, r * 0.45, 0, 0, PI2); c.fill();
    c.strokeStyle = "#2B2640"; c.lineWidth = khongLo ? 3 : 2; c.beginPath(); c.arc(-w * 0.1, dy + dau * 0.56, r * 0.8, Math.PI * 1.2, Math.PI * 1.8); c.stroke();
    if (khongLo) {
      c.fillStyle = "#ffd23f"; c.beginPath();
      c.moveTo(-16, -h + 4); c.lineTo(-16, -h - 12); c.lineTo(-8, -h - 4); c.lineTo(0, -h - 16); c.lineTo(8, -h - 4); c.lineTo(16, -h - 12); c.lineTo(16, -h + 4); c.fill();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
