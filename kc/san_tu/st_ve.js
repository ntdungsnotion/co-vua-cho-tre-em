/* ================================================================
   FILE: san_tu/st_ve.js
   CHỨC NĂNG: VẼ game Săn Từ lên <canvas> (2D, hình vẽ NGUYÊN BẢN bằng code, không
              dùng ảnh ngoài -> không lo bản quyền, không lo thiếu file ảnh).
              Gồm: bầu trời đổi màu theo tiến độ, núi / đồi / cây cuộn nhiều lớp,
              mặt đường có hố, chướng ngại vật + biển chữ, kim cương, phép thuật,
              em bé (chạy, nhảy, đáp đất, phép, khựng, gặp nạn, rơi, hồi sinh, chiến thắng),
              lâu đài + mèo trong lồng + hoạt cảnh giải cứu, hạt hiệu ứng.
   BƯỚC: TC_00B
   NGÀY: 15/10/2026
   KHUNG NHÌN: luôn thấy ít nhất 560 đơn vị bề ngang và 330 đơn vị bề cao. Màn rộng
               (máy tính) thấy xa hơn về phía trước, màn dọc (điện thoại) thấy nhiều trời hơn.
   CẬP NHẬT: 16/10/2026 - TC_00D2: thanh máu trên đầu quái / vật cản phải bắn, tường đá
             (cao hơn cú nhảy), vạch "Nhảy!" trên đường ở màn 1-2 để bé tập canh lúc bấm.
             Cấp từ 3-4 (anChu): biển chữ hiện hình + 🔊 thay cho chữ, đúng rồi mới hiện chữ.
             Dải "Nhảy ở đây" CHỈ có ở màn Tập chơi (người dùng yêu cầu 16/10/2026).
             Cụm kim cương có từ riêng: biển chữ cắm trên đất dưới cụm, không vẽ thân vật.
             Kho mở rộng: vẽ thêm khúc gỗ, hàng rào, bụi gai, thùng gỗ, cột tô-tem, ốc sên, cua,
             ếch, sâu róm, cây biết đi, dơi, chim sẻ, bọ rùa bay.
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST = goc.ST || {};
  const PI2 = Math.PI * 2;
  const FONT = '"Baloo 2", "Be Vietnam Pro", system-ui, sans-serif';
  const lerp = (a, b, t) => a + (b - a) * t;
  const tronMau = (c1, c2, t) => {
    const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    const r = Math.round(lerp(a >> 16, b >> 16, t)), g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t)), bl = Math.round(lerp(a & 255, b & 255, t));
    return "rgb(" + r + "," + g + "," + bl + ")";
  };
  // Trình duyệt cũ (Safari < 16) chưa có roundRect: tự bổ sung để game không bị dừng
  if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      let [a, b, c, d] = Array.isArray(r) ? (r.length === 4 ? r : r.length === 2 ? [r[0], r[1], r[0], r[1]] : [r[0], r[0], r[0], r[0]]) : [r, r, r, r];
      const m = Math.min(Math.abs(w), Math.abs(h)) / 2;
      [a, b, c, d] = [a, b, c, d].map(v => Math.min(v || 0, m));
      this.moveTo(x + a, y); this.lineTo(x + w - b, y); this.arcTo(x + w, y, x + w, y + b, b);
      this.lineTo(x + w, y + h - c); this.arcTo(x + w, y + h, x + w - c, y + h, c);
      this.lineTo(x + d, y + h); this.arcTo(x, y + h, x, y + h - d, d);
      this.lineTo(x, y + a); this.arcTo(x, y, x + a, y, a); this.closePath();
    };
  }
  const bam = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }; // "ngẫu nhiên" cố định theo số

  class BoVe {
    constructor(canvas) {
      this.cv = canvas;
      this.c = canvas.getContext("2d");
      this.hat = [];       // hạt hiệu ứng (bụi, lấp lánh, sao, tim, pháo giấy)
      this.t = 0;          // đồng hồ hoạt ảnh (chạy cả ở menu)
      this.doiCo();
    }

    doiCo() {
      const r = this.cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
      // màn dọc (điện thoại) cần nhân vật to hơn: khung tối thiểu hẹp hơn một chút
      this.k = Math.min(w / (w < h * 1.1 ? 500 : 560), h / 330, 2.2);
      this.rong = w / this.k; this.cao = h / this.k;  // kích thước khung nhìn (đơn vị thế giới)
      this.dat = this.cao - 64;                       // vị trí mặt đất trên màn
      this.tiLe = dpr * this.k;
    }

    /* ---------------- HẠT HIỆU ỨNG ---------------- */
    phun(x, y, kieu, so, mau) {
      for (let i = 0; i < so && this.hat.length < 320; i++) {
        const goc = Math.random() * PI2, toc = 40 + Math.random() * 160;
        const h = { x, y, vx: Math.cos(goc) * toc, vy: Math.sin(goc) * toc + 60, t: 0, song: 0.5 + Math.random() * 0.5, kieu, mau, co: 3 + Math.random() * 4, xoay: Math.random() * PI2 };
        if (kieu === "bui") { h.vx = -30 - Math.random() * 60; h.vy = 20 + Math.random() * 40; h.song = 0.4; h.co = 4 + Math.random() * 5; }
        if (kieu === "giay") { h.vx = (Math.random() - 0.5) * 260; h.vy = 160 + Math.random() * 220; h.song = 2.6; h.co = 5 + Math.random() * 4; }
        if (kieu === "tim") { h.vx = (Math.random() - 0.5) * 40; h.vy = 50 + Math.random() * 40; h.song = 1.6; h.co = 9 + Math.random() * 5; }
        this.hat.push(h);
      }
    }
    capNhatHat(dt) {
      for (const h of this.hat) {
        h.t += dt; h.x += h.vx * dt; h.y += h.vy * dt; h.xoay += dt * 6;
        if (h.kieu === "giay") h.vy -= 260 * dt; else if (h.kieu !== "tim") h.vy -= 240 * dt;
      }
      this.hat = this.hat.filter(h => h.t < h.song);
    }

    /* ---------------- VẼ MỘT KHUNG HÌNH ---------------- */
    ve(g, dt) {
      this.t += dt;
      if (dt > 0 && (!g || g.trangThai !== "tamDung")) this.capNhatHat(dt);
      const c = this.c;
      c.setTransform(this.tiLe, 0, 0, this.tiLe, 0, 0);
      c.lineJoin = "round"; c.lineCap = "round";
      const choi = g && g.trangThai !== "menu";
      const be = choi ? g.be : { x: this.t * 150, y: 0, che: "chay", batTu: 0, tTiepDat: 9, tPhep: 9, tChe: 0 };
      const doDai = choi ? g.doDai : 1e9;
      const tienDo = choi ? g.tienDo : 0.08;
      // camera: bám theo bé, dừng lại khi lâu đài đã vào khung
      let camX = be.x - this.rong * 0.24;
      if (choi) camX = Math.min(camX, doDai + 300 - this.rong);
      if (choi && g.trangThai === "thang") camX = Math.min(doDai - this.rong * 0.24, doDai + 300 - this.rong);
      this.camX = camX;
      this.veNen(camX, tienDo);
      this.veDat(camX, choi ? g.chuongNgai : [], doDai);
      if (choi) {
        if (g.dk.laManCuoi) this.veLauDai(g, camX); else this.veCongMan(g, camX);
        this.veVachXuatPhat(camX);
        this.veVungNhay(g, camX);
        g.chuongNgai.forEach(o => this.veChuongNgai(o, g, camX));
        g.kimCuongs.forEach(k => { if (!k.daNhat) this.veKimCuong(k.x - camX, this.dat - k.y, 1, k.tHien); });
        g.dan.forEach(d => this.veDan(d, camX));
      }
      this.veBe(be, g, camX);
      if (choi && g.trangThai === "thang" && g.dk.laManCuoi) this.veMeoDiRa(g, camX);
      this.veHat(camX);
      if (choi) this.veMuiTenSapToi(g, camX);
    }

    /* ---------------- NỀN ---------------- */
    veNen(camX, p) {
      const c = this.c, W = this.rong, H = this.cao;
      // trời: sáng trong veo -> chiều vàng ấm khi gần lâu đài
      const s = Math.max(0, (p - 0.45) / 0.55);
      const gr = c.createLinearGradient(0, 0, 0, this.dat);
      gr.addColorStop(0, tronMau("#6cc8ff", "#ff9e7a", s * 0.8));
      gr.addColorStop(1, tronMau("#dff4ff", "#ffe2b8", s));
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // mặt trời
      const mtX = W * 0.8 - p * W * 0.15, mtY = 70 + s * 60;
      c.fillStyle = "rgba(255,240,160,0.35)"; c.beginPath(); c.arc(mtX, mtY, 46, 0, PI2); c.fill();
      c.fillStyle = "#ffe36e"; c.beginPath(); c.arc(mtX, mtY, 30, 0, PI2); c.fill();
      // mây
      for (let i = 0; i < 7; i++) {
        const chuKy = 1600, x = ((i * 260 + 80 - camX * 0.12 - this.t * 6) % chuKy + chuKy) % chuKy - 160;
        this.veMay(x, 40 + bam(i) * Math.min(150, this.dat * 0.35), 0.7 + bam(i + 9) * 0.6);
      }
      // núi xa
      this.veLop(camX, 0.18, 420, this.dat - 120, (x, y, i) => {
        c.fillStyle = tronMau("#a9b8f0", "#c9a0d8", s);
        c.beginPath(); c.moveTo(x - 30, this.dat); c.lineTo(x + 140 + bam(i) * 60, y - 60 - bam(i + 3) * 90); c.lineTo(x + 450, this.dat); c.fill();
        c.fillStyle = "rgba(255,255,255,0.7)";
        const dx = x + 140 + bam(i) * 60, dy = y - 60 - bam(i + 3) * 90;
        c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx - 26, dy + 34); c.lineTo(dx + 4, dy + 26); c.lineTo(dx + 28, dy + 36); c.fill();
      });
      // lâu đài xa xa hiện dần khi đi được hơn nửa đường (cho bé thấy đích đến)
      if (p > 0.45) {
        const a = Math.min(1, (p - 0.45) / 0.15), x = W + 60 - (p - 0.45) / 0.55 * W * 0.35;
        c.globalAlpha = 0.55 * a; this.veBongLauDai(x, this.dat - 70, 0.45); c.globalAlpha = 1;
      }
      // đồi
      this.veLop(camX, 0.4, 300, this.dat - 40, (x, y, i) => {
        c.fillStyle = tronMau("#7fd67a", "#9fcf6a", s);
        c.beginPath(); c.ellipse(x + 150, this.dat, 190 + bam(i) * 40, 70 + bam(i + 1) * 50, 0, Math.PI, PI2); c.fill();
      });
      // cây và bụi phía sau đường
      this.veLop(camX, 0.7, 170, this.dat, (x, y, i) => {
        if (bam(i + 5) < 0.55) this.veCayNen(x + 40 + bam(i) * 60, this.dat - 8, 0.8 + bam(i + 2) * 0.5, s);
        else { c.fillStyle = "#4fb85a"; c.beginPath(); c.arc(x + 60, this.dat - 6, 22, Math.PI, PI2); c.arc(x + 88, this.dat - 6, 16, Math.PI, PI2); c.fill(); }
      });
    }
    veLop(camX, heSo, buoc, y, fn) {
      const lech = camX * heSo, dau = Math.floor(lech / buoc) - 1;
      for (let i = dau; i < dau + Math.ceil(this.rong / buoc) + 3; i++) fn(i * buoc - lech, y, i);
    }
    veMay(x, y, k) {
      const c = this.c;
      c.fillStyle = "rgba(255,255,255,0.92)";
      c.beginPath();
      c.arc(x, y, 18 * k, 0, PI2); c.arc(x + 20 * k, y - 10 * k, 22 * k, 0, PI2); c.arc(x + 44 * k, y, 18 * k, 0, PI2);
      c.rect(x, y, 44 * k, 18 * k);
      c.fill();
    }
    veCayNen(x, y, k, s) {
      const c = this.c;
      c.fillStyle = "#8a5a35"; c.fillRect(x - 5 * k, y - 34 * k, 10 * k, 34 * k);
      c.fillStyle = tronMau("#3fae55", "#6aa84a", s);
      c.beginPath(); c.arc(x, y - 52 * k, 26 * k, 0, PI2); c.arc(x - 18 * k, y - 38 * k, 18 * k, 0, PI2); c.arc(x + 18 * k, y - 38 * k, 18 * k, 0, PI2); c.fill();
      c.fillStyle = "rgba(255,255,255,0.18)"; c.beginPath(); c.arc(x - 8 * k, y - 60 * k, 10 * k, 0, PI2); c.fill();
    }

    /* ---------------- MẶT ĐƯỜNG (có khoét hố) ---------------- */
    veDat(camX, ds, doDai) {
      const c = this.c, W = this.rong, y = this.dat, H = this.cao;
      const ho = ds.filter(o => o.nhom === "ho" && o.x - camX < W + 20 && o.x + o.rong - camX > -20)
        .map(o => [o.x - camX, o.x + o.rong - camX]).sort((a, b) => a[0] - b[0]);
      const doan = []; let x0 = -10;
      ho.forEach(([a, b]) => { if (a > x0) doan.push([x0, a]); x0 = Math.max(x0, b); });
      doan.push([x0, W + 10]);
      // lòng hố: tối sâu
      ho.forEach(([a, b]) => {
        const gr = c.createLinearGradient(0, y, 0, H);
        gr.addColorStop(0, "#3b2a4a"); gr.addColorStop(1, "#120a1c");
        c.fillStyle = gr; c.fillRect(a, y + 4, b - a, H - y);
      });
      doan.forEach(([a, b]) => {
        // đất
        c.fillStyle = "#b8763c"; c.fillRect(a, y + 10, b - a, H - y);
        c.save(); c.beginPath(); c.rect(a, y + 10, b - a, H - y); c.clip();
        const lech = camX % 48;
        for (let x = -lech - 48; x < W + 48; x += 48) {
          const i = Math.round((x + camX) / 48);
          c.fillStyle = i % 2 ? "#a8682f" : "#c08045"; c.fillRect(x, y + 22, 48, H - y);
          c.fillStyle = "rgba(90,50,20,0.35)"; c.beginPath(); c.arc(x + 14 + bam(i) * 20, y + 34 + bam(i + 1) * 18, 3, 0, PI2); c.fill();
        }
        c.restore();
        // cỏ phủ mép trên
        c.fillStyle = "#58c84e"; c.beginPath(); c.roundRect(a - 2, y - 2, b - a + 4, 16, 6); c.fill();
        c.fillStyle = "#3fa83a"; c.fillRect(a, y + 10, b - a, 4);
        // hoa nhỏ trang trí (cố định theo vị trí)
        const dau = Math.floor((a + camX) / 70), cuoi = Math.ceil((b + camX) / 70);
        for (let i = dau; i <= cuoi; i++) {
          if (bam(i * 3) > 0.35) continue;
          const fx = i * 70 + 20 - camX; if (fx < a + 6 || fx > b - 6 || fx > doDai - camX + 40) continue;
          c.strokeStyle = "#2f8f34"; c.lineWidth = 2; c.beginPath(); c.moveTo(fx, y); c.lineTo(fx, y - 10); c.stroke();
          c.fillStyle = ["#ff7eb6", "#ffd23f", "#ffffff", "#9b7bff"][i & 3]; c.beginPath(); c.arc(fx, y - 12, 4, 0, PI2); c.fill();
          c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(fx, y - 12, 1.6, 0, PI2); c.fill();
        }
      });
    }

    veVachXuatPhat(camX) {
      const x = 30 - camX; if (x < -60 || x > this.rong + 60) return;
      const c = this.c, y = this.dat;
      c.fillStyle = "#7a4b25"; c.fillRect(x - 3, y - 70, 6, 70);
      c.fillStyle = "#fff"; c.beginPath(); c.roundRect(x - 34, y - 92, 68, 26, 8); c.fill();
      c.strokeStyle = "#7a4b25"; c.lineWidth = 3; c.stroke();
      c.fillStyle = "#4B2FB0"; c.font = "700 14px " + FONT; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("Xuất phát", x, y - 78);
    }

    /* ---------------- LÂU ĐÀI + MÈO ---------------- */
    veBongLauDai(x, y, k) {
      const c = this.c;
      c.fillStyle = "#8d7fb8";
      c.fillRect(x - 60 * k, y - 80 * k, 120 * k, 80 * k);
      c.fillRect(x - 90 * k, y - 120 * k, 40 * k, 120 * k); c.fillRect(x + 50 * k, y - 120 * k, 40 * k, 120 * k);
      c.beginPath(); c.moveTo(x - 96 * k, y - 120 * k); c.lineTo(x - 70 * k, y - 170 * k); c.lineTo(x - 44 * k, y - 120 * k); c.fill();
      c.beginPath(); c.moveTo(x + 44 * k, y - 120 * k); c.lineTo(x + 70 * k, y - 170 * k); c.lineTo(x + 96 * k, y - 120 * k); c.fill();
    }
    veLauDai(g, camX) {
      const x0 = g.doDai + 150 - camX, y0 = this.dat; // tâm lâu đài
      if (x0 < -300 || x0 > this.rong + 300) return;
      const c = this.c;
      c.save(); c.translate(x0, y0); c.scale(0.8, 0.8);
      const x = 0, y = 0;
      // thân
      c.fillStyle = "#e9dcff"; c.fillRect(x - 110, y - 150, 220, 150);
      c.fillStyle = "#d6c4fa";
      for (let i = 0; i < 7; i++) c.fillRect(x - 110 + i * 34, y - 166, 20, 18);
      // tháp hai bên
      [[-150, 230], [150, 230]].forEach(([dx, cao]) => {
        c.fillStyle = "#f3eaff"; c.fillRect(x + dx - 34, y - cao, 68, cao);
        c.strokeStyle = "#c9b5f5"; c.lineWidth = 2;
        for (let r = 1; r < 9; r++) { c.beginPath(); c.moveTo(x + dx - 34, y - cao + r * 26); c.lineTo(x + dx + 34, y - cao + r * 26); c.stroke(); }
        c.fillStyle = "#ff7eb6"; c.beginPath(); c.moveTo(x + dx - 44, y - cao); c.lineTo(x + dx, y - cao - 70); c.lineTo(x + dx + 44, y - cao); c.fill();
        c.fillStyle = "#7a4b25"; c.fillRect(x + dx - 1, y - cao - 100, 3, 32);
        const song = Math.sin(this.t * 6 + dx) * 4;
        c.fillStyle = "#ffd23f"; c.beginPath(); c.moveTo(x + dx + 2, y - cao - 100); c.lineTo(x + dx + 30, y - cao - 92 + song); c.lineTo(x + dx + 2, y - cao - 82); c.fill();
        c.fillStyle = "#6C4CE0"; c.beginPath(); c.roundRect(x + dx - 12, y - cao + 50, 24, 34, [12, 12, 2, 2]); c.fill();
      });
      // cổng vòm
      c.fillStyle = "#5a3d8a"; c.beginPath(); c.roundRect(x - 120 + 0, y - 96, 64, 96, [32, 32, 0, 0]); c.fill();
      const mo = g.trangThai === "thang" ? Math.min(1, g.tKetThuc / 0.8) : 0;
      c.fillStyle = "#9a6a3c"; c.beginPath(); c.roundRect(x - 120, y - 96 + mo * 80, 64, 96 - mo * 80, [32, 32, 0, 0]); c.fill();
      // cờ "Đích"
      c.fillStyle = "#fff"; c.beginPath(); c.roundRect(x - 10, y - 140, 100, 30, 10); c.fill();
      c.fillStyle = "#4B2FB0"; c.font = "800 18px " + FONT; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("Lâu Đài", x + 40, y - 125);
      // lồng + mèo (trước khi được cứu); khi thắng: lồng nhấc lên, mèo được tự do
      const lx = x + 38, ly = y - 4;
      const daCuu = g.trangThai === "thang" && g.tKetThuc > 1.4;
      const nang = g.trangThai === "thang" ? Math.min(1, Math.max(0, (g.tKetThuc - 0.8) / 0.6)) : 0;
      if (!daCuu) this.veMeo(lx, ly - 2, 1.1, false, 1);
      c.save(); c.globalAlpha = 1 - nang; c.translate(0, -nang * 90);
      c.strokeStyle = "#8a8fa8"; c.lineWidth = 4;
      c.beginPath(); c.roundRect(lx - 42, ly - 78, 84, 78, [24, 24, 2, 2]); c.stroke();
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(lx + i * 16, ly - 76); c.lineTo(lx + i * 16, ly); c.stroke(); }
      c.fillStyle = "#8a8fa8"; c.fillRect(lx - 5, ly - 90, 10, 12);
      c.restore();
      if (!daCuu && Math.sin(this.t * 3) > 0.3) { // mèo kêu cứu
        c.fillStyle = "#fff"; c.beginPath(); c.roundRect(lx - 4, ly - 128, 92, 32, 12); c.fill();
        c.fillStyle = "#e5484d"; c.font = "800 17px " + FONT; c.fillText("Meo! Cứu!", lx + 42, ly - 111);
      }
      c.restore();
    }
    // Cổng về đích của màn 1-6: hai cột sọc, băng rôn "Màn n", cờ caro; biển chỉ đường tới lâu đài
    veCongMan(g, camX) {
      const x0 = g.doDai + 40 - camX, y0 = this.dat;
      if (x0 < -260 || x0 > this.rong + 260) return;
      const c = this.c, cao = 150, rong = 150, qua = g.trangThai === "thang";
      // hai cột sọc
      [-rong / 2, rong / 2].forEach(dx => {
        c.fillStyle = "#fff"; c.fillRect(x0 + dx - 9, y0 - cao, 18, cao);
        c.fillStyle = "#ff7eb6";
        for (let i = 0; i < 6; i++) c.fillRect(x0 + dx - 9, y0 - cao + i * 26, 18, 13);
        c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(x0 + dx, y0 - cao - 6, 10, 0, PI2); c.fill();
      });
      // băng rôn
      const lac = Math.sin(this.t * 3) * 2;
      c.fillStyle = qua ? "#2BB673" : "#6C4CE0";
      c.beginPath(); c.roundRect(x0 - rong / 2 - 6, y0 - cao + 6 + lac, rong + 12, 38, 12); c.fill();
      c.fillStyle = "#fff"; c.font = "800 20px " + FONT; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(qua ? (g.dk.laHuongDan ? "Giỏi lắm! ✓" : "Qua màn! ✓") : g.dk.laHuongDan ? "Đích tập chơi" : "Đích màn " + g.dk.soMan, x0, y0 - cao + 26 + lac);
      // cờ caro trên cột phải
      const cx = x0 + rong / 2, cy = y0 - cao - 16;
      c.fillStyle = "#7a4b25"; c.fillRect(cx - 2, cy - 54, 4, 54);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
        const song = Math.sin(this.t * 6 + i * 0.8) * 3;
        c.fillStyle = (i + j) % 2 ? "#2B2640" : "#fff";
        c.fillRect(cx + 2 + i * 9, cy - 54 + j * 9 + song, 9, 9);
      }
      // biển chỉ đường: lâu đài còn bao nhiêu màn
      const bx = x0 + rong / 2 + 70, con = ST.SO_MAN - g.dk.soMan;
      c.fillStyle = "#9a6a3c"; c.fillRect(bx - 3, y0 - 70, 6, 70);
      c.fillStyle = "#fff6d6"; c.beginPath(); c.roundRect(bx - 56, y0 - 104, 112, 44, 10); c.fill();
      c.strokeStyle = "#c48f00"; c.lineWidth = 3; c.stroke();
      c.fillStyle = "#7a5600"; c.font = "800 15px " + FONT;
      c.fillText(g.dk.duong.bieuTuongDich + " Bé mèo 🐱", bx, y0 - 90);
      c.fillText(g.dk.laHuongDan ? "vào màn 1 ➜" : "còn " + con + " màn ➜", bx, y0 - 72);
    }
    veMeo(x, y, k, vui, huong) {
      const c = this.c;
      c.save(); c.translate(x, y); c.scale(k * (huong || 1), k);
      // đuôi
      c.strokeStyle = "#f08a24"; c.lineWidth = 6; c.beginPath(); c.moveTo(-14, -10); c.quadraticCurveTo(-34, -20 + Math.sin(this.t * 5) * 8, -26, -40); c.stroke();
      // thân
      c.fillStyle = "#ffa940"; c.beginPath(); c.ellipse(0, -14, 18, 15, 0, 0, PI2); c.fill();
      c.fillStyle = "#fff3e0"; c.beginPath(); c.ellipse(4, -10, 9, 9, 0, 0, PI2); c.fill();
      // đầu
      c.fillStyle = "#ffa940"; c.beginPath(); c.arc(8, -38, 15, 0, PI2); c.fill();
      c.beginPath(); c.moveTo(-4, -46); c.lineTo(-2, -62); c.lineTo(8, -50); c.fill();
      c.beginPath(); c.moveTo(12, -50); c.lineTo(22, -62); c.lineTo(22, -44); c.fill();
      c.fillStyle = "#ff9fb0"; c.beginPath(); c.moveTo(0, -48); c.lineTo(0, -57); c.lineTo(5, -50); c.fill();
      c.strokeStyle = "#d9731c"; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(2, -30); c.lineTo(2, -24); c.moveTo(-6, -16); c.lineTo(-6, -8); c.moveTo(-12, -20); c.lineTo(-12, -12); c.stroke();
      // mặt
      c.fillStyle = "#2B2640";
      if (vui) { c.lineWidth = 2; c.strokeStyle = "#2B2640"; c.beginPath(); c.arc(3, -38, 3, Math.PI, PI2); c.stroke(); c.beginPath(); c.arc(14, -38, 3, Math.PI, PI2); c.stroke(); }
      else { c.beginPath(); c.arc(3, -39, 2.6, 0, PI2); c.arc(14, -39, 2.6, 0, PI2); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(4, -40, 1, 0, PI2); c.arc(15, -40, 1, 0, PI2); c.fill(); }
      c.fillStyle = "#ff6b8a"; c.beginPath(); c.arc(9, -33, 2, 0, PI2); c.fill();
      c.strokeStyle = "#2B2640"; c.lineWidth = 1.5; c.beginPath(); c.arc(7, -30, 2, 0, Math.PI); c.arc(11, -30, 2, 0, Math.PI); c.stroke();
      c.restore();
    }
    // Hoạt cảnh giải cứu: cửa mở -> mèo nhảy ra -> chạy tới bé -> tim bay
    veMeoDiRa(g, camX) {
      const t = g.tKetThuc; if (t < 1.4) return;
      const lx = g.doDai + 150 + 0.8 * 38 - camX, bx = this.viTriBeThang(g) - camX + 34;
      const u = Math.min(1, (t - 1.4) / 0.8);
      const x = lerp(lx, bx, u), y = this.dat - Math.sin(u * Math.PI) * 60 - (u >= 1 ? Math.abs(Math.sin(t * 6)) * 14 : 0);
      this.veMeo(x, y, 0.9, true, -1);
      if (u >= 1 && Math.random() < 0.08) this.phun(x - 10 + camX, this.dat - y + 40, "tim", 1);
    }
    viTriBeThang(g) { return g.doDai + Math.min(1, g.tKetThuc / 1.2) * 70; }

    /* ---------------- CHƯỚNG NGẠI VẬT ---------------- */
    veChuongNgai(o, g, camX) {
      const x = o.x - camX;
      if (x > this.rong + 120 || x + o.rong < -160) return;
      const c = this.c, y = this.dat, t = this.t;
      c.save();
      let alpha = 1, scale = 1;
      if (!o.song) { alpha = Math.max(0, 1 - o.tChet / 0.45); scale = 1 + o.tChet * 0.8; }   // bị phép thuật: phồng lên rồi tan
      if (o.boChay) { alpha = Math.max(0, 1 - o.tChet / 0.9); }
      c.globalAlpha = alpha;
      const tamX = x + o.rong / 2, day = y - o.bayCao;
      if (alpha > 0.01) {
        c.translate(tamX + (o.boChay ? o.tChet * 160 : 0), day - (o.boChay ? o.tChet * 60 : 0)); c.scale(scale, scale);
        const w = o.rong, h = o.cao;
        switch (o.loai) {
          case "cong": this.veCong(w, h); break;
          case "da": this.veDa(w, h, o.bienThe); break;
          case "gocCay": this.veGocCay(w, h); break;
          case "tuongDa": this.veTuongDa(w, h); break;
          case "nam": this.veNam(w, h, t, o); break;
          case "nhim": this.veNhim(w, h, t, o); break;
          case "slime": this.veSlime(w, h, t, o); break;
          case "vit": this.veVit(w, h, t); break;
          case "ong": this.veOng(w, h, t); break;
          case "khucGo": this.veKhucGo(w, h); break;
          case "hangRao": this.veHangRao(w, h, o.bienThe); break;
          case "buiGai": this.veBuiGai(w, h, o.bienThe); break;
          case "thungGo": this.veThungGo(w, h); break;
          case "cotTotem": this.veCotTotem(w, h, t); break;
          case "ocSen": this.veOcSen(w, h, t, o); break;
          case "cua": this.veCua(w, h, t, o); break;
          case "ech": this.veEch(w, h, t, o); break;
          case "sau": this.veSau(w, h, t, o); break;
          case "cayBietDi": this.veCayBietDi(w, h, t, o); break;
          case "doi": this.veDoi(w, h, t); break;
          case "chim": this.veChim(w, h, t, o.bienThe); break;
          case "boRua": this.veBoRua(w, h, t); break;
        }
      }
      c.restore();
      if (o.nhom === "ho") this.veMieng(x, o.rong);
      this.veThanhMau(o, x);
      this.veBien(o, g, x);
    }
    // Thanh máu: mỗi ô là 1 viên phải bắn trúng; ô đã trúng thành màu xám
    veThanhMau(o, x) {
      if (!o.mauToiDa || !o.song || o.boChay) return;
      const c = this.c, n = o.mauToiDa, o1 = 13, khe = 3;
      const w = n * o1 + (n - 1) * khe + 8, tamX = x + o.rong / 2;
      const y = Math.max(40, this.dat - o.bayCao - o.cao - 22);
      c.fillStyle = "rgba(43,38,64,0.85)"; c.beginPath(); c.roundRect(tamX - w / 2, y, w, 18, 7); c.fill();
      for (let i = 0; i < n; i++) {
        c.fillStyle = i < o.mau ? (o.mau <= 1 ? "#ff5a5f" : "#ff7a3d") : "#5d5872";
        c.beginPath(); c.roundRect(tamX - w / 2 + 4 + i * (o1 + khe), y + 4, o1, 10, 3); c.fill();
      }
    }
    // Chỉ màn Tập chơi: dải xanh trên đường = chỗ bé nên đứng khi bấm nhảy (dạy bé canh lúc bấm)
    veVungNhay(g, camX) {
      const tt = g.thuThach;
      if (!tt || tt.trangThai !== "mo" || tt.o.hanhDong !== "nhay" || !g.dk.laHuongDan || g.trangThai !== "choi") return;
      const [gan, xa] = ST.cuaSoNhay(tt.o, g.v), tam = tt.o.x + tt.o.rong / 2;
      const x1 = tam - xa - camX, x2 = tam - gan - camX, c = this.c, y = this.dat;
      if (x2 < 0 || x1 > this.rong) return;
      const trong = g.trongCuaSoNhay(), nhip = trong ? 0.75 + Math.sin(this.t * 14) * 0.2 : 0.5;
      c.fillStyle = `rgba(43,182,115,${nhip})`; c.strokeStyle = "#fff"; c.lineWidth = 2;
      c.beginPath(); c.roundRect(x1, y - 7, x2 - x1, 14, 7); c.fill(); c.stroke();
      const chu = trong ? "Nhảy! ⤴" : "Nhảy ở đây", giua = (x1 + x2) / 2;
      c.font = "800 15px " + FONT; c.textAlign = "center"; c.textBaseline = "middle";
      const wc = c.measureText(chu).width + 16;
      c.fillStyle = trong ? "#2BB673" : "rgba(255,255,255,0.92)";
      c.beginPath(); c.roundRect(giua - wc / 2, y + 12, wc, 22, 11); c.fill();
      c.fillStyle = trong ? "#fff" : "#1f8a55"; c.fillText(chu, giua, y + 24);
    }
    veMieng(x, w) { // mép hố có rìa cỏ rủ xuống
      const c = this.c, y = this.dat;
      c.fillStyle = "#3fa83a";
      for (const ex of [x, x + w]) { c.beginPath(); c.arc(ex, y + 8, 6, 0, PI2); c.fill(); }
      c.fillStyle = "rgba(255,255,255,0.08)"; c.fillRect(x + 6, y + 18, w - 12, 3);
    }
    veCong(w, h) { // ống cống bê tông nằm ngang, nhìn từ bên hông
      const c = this.c;
      c.fillStyle = "#9aa3b5"; c.beginPath(); c.roundRect(-w / 2, -h, w, h, 8); c.fill();
      c.fillStyle = "#b8c0cf"; c.fillRect(-w / 2 + 4, -h + 5, w - 8, 8);
      c.strokeStyle = "#7d8699"; c.lineWidth = 3;
      for (let i = 1; i < 3; i++) { const xx = -w / 2 + w * i / 3; c.beginPath(); c.moveTo(xx, -h + 2); c.lineTo(xx, -2); c.stroke(); }
      c.fillStyle = "#7d8699"; c.beginPath(); c.ellipse(-w / 2 + 4, -h / 2, 10, h / 2, 0, 0, PI2); c.fill();
      c.fillStyle = "#2f2a3d"; c.beginPath(); c.ellipse(-w / 2 + 4, -h / 2, 6, h / 2 - 7, 0, 0, PI2); c.fill();
      c.fillStyle = "#6ec46a"; c.beginPath(); c.arc(w / 4, -h + 2, 7, Math.PI, PI2); c.arc(w / 4 + 10, -h + 2, 5, Math.PI, PI2); c.fill();
    }
    veDa(w, h, bt) {
      const c = this.c;
      c.fillStyle = "#8f95a8";
      c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w / 2 + 4, -h * 0.6); c.lineTo(-w * 0.2, -h); c.lineTo(w * 0.25, -h * (0.9 + bt * 0.03));
      c.lineTo(w / 2, -h * 0.45); c.lineTo(w / 2, 0); c.closePath(); c.fill();
      c.fillStyle = "#b5bacb"; c.beginPath(); c.moveTo(-w * 0.2, -h + 4); c.lineTo(w * 0.2, -h * 0.88); c.lineTo(0, -h * 0.6); c.fill();
      c.strokeStyle = "#6f7488"; c.lineWidth = 2; c.beginPath(); c.moveTo(-w * 0.1, -h * 0.5); c.lineTo(w * 0.1, -h * 0.3); c.stroke();
    }
    veGocCay(w, h) {
      const c = this.c;
      c.fillStyle = "#8a5a35"; c.beginPath(); c.moveTo(-w / 2 - 6, 0); c.lineTo(-w / 2 + 4, -h); c.lineTo(w / 2 - 4, -h); c.lineTo(w / 2 + 6, 0); c.fill();
      c.fillStyle = "#e3b57a"; c.beginPath(); c.ellipse(0, -h, w / 2 - 4, 8, 0, 0, PI2); c.fill();
      c.strokeStyle = "#b78347"; c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, -h, w / 4, 4, 0, 0, PI2); c.stroke();
      c.strokeStyle = "#6c4325"; c.lineWidth = 2; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * w / 4, -h + 10); c.lineTo(i * w / 4 + 2, -8); c.stroke(); }
      c.fillStyle = "#58c84e"; c.beginPath(); c.arc(w / 2 - 8, -h - 2, 5, 0, PI2); c.fill();
    }
    veTuongDa(w, h) { // tường đá cao hơn cú nhảy: phải bắn vỡ
      const c = this.c, hang = 22;
      c.fillStyle = "#8a8fa3"; c.beginPath(); c.roundRect(-w / 2, -h, w, h, 6); c.fill();
      c.strokeStyle = "#6a6f83"; c.lineWidth = 2;
      for (let r = 0, yy = -h; yy < 0; r++, yy += hang) {
        c.beginPath(); c.moveTo(-w / 2, yy); c.lineTo(w / 2, yy); c.stroke();
        const lech = r % 2 ? w / 4 : 0;
        for (let xx = -w / 2 + lech + w / 2; xx < w / 2; xx += w / 2) { c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, Math.min(0, yy + hang)); c.stroke(); }
      }
      c.fillStyle = "#a9aec0"; c.fillRect(-w / 2 + 3, -h + 3, w - 6, 6);
      c.fillStyle = "#58c84e"; c.beginPath(); c.arc(-w / 2 + 10, -h + 2, 6, Math.PI, PI2); c.arc(w / 2 - 12, -h + 2, 5, Math.PI, PI2); c.fill();
      c.strokeStyle = "#4b4f60"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(w * 0.1, -h * 0.55); c.lineTo(-w * 0.05, -h * 0.45); c.lineTo(w * 0.12, -h * 0.38); c.stroke();
    }
    mat(x, y, r, gian) { // đôi mắt to dễ thương; gian = nhíu mày (quái)
      const c = this.c;
      c.fillStyle = "#fff"; c.beginPath(); c.arc(x - r * 1.3, y, r, 0, PI2); c.arc(x + r * 1.3, y, r, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(x - r * 1.5, y + 1, r * 0.55, 0, PI2); c.arc(x + r * 1.1, y + 1, r * 0.55, 0, PI2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(x - r * 1.3, y - 1, r * 0.2, 0, PI2); c.arc(x + r * 1.3, y - 1, r * 0.2, 0, PI2); c.fill();
      if (gian) { c.strokeStyle = "#2B2640"; c.lineWidth = 2; c.beginPath(); c.moveTo(x - r * 2.3, y - r * 1.4); c.lineTo(x - r * 0.5, y - r * 0.9); c.moveTo(x + r * 2.3, y - r * 1.4); c.lineTo(x + r * 0.5, y - r * 0.9); c.stroke(); }
    }
    veNam(w, h, t, o) { // nấm tí hon biết đi: mũ tím chấm vàng
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 12) : Math.sin(t * 3) * 0.3;
      c.fillStyle = "#5a3d8a"; c.beginPath(); c.ellipse(-10 + buoc * 4, -3, 9, 5, 0, 0, PI2); c.ellipse(10 - buoc * 4, -3, 9, 5, 0, 0, PI2); c.fill();
      c.fillStyle = "#fff2d6"; c.beginPath(); c.roundRect(-w * 0.3, -h * 0.62, w * 0.6, h * 0.58, 10); c.fill();
      c.fillStyle = "#9b5de5"; c.beginPath(); c.ellipse(0, -h * 0.6, w / 2 + 4, h * 0.42, 0, Math.PI, PI2); c.fill();
      c.fillStyle = "#ffd23f"; [[-14, -h * 0.78, 5], [8, -h * 0.9, 6], [20, -h * 0.68, 4]].forEach(([a, b, r]) => { c.beginPath(); c.arc(a, b, r, 0, PI2); c.fill(); });
      this.mat(0, -h * 0.4, 5, true);
      c.strokeStyle = "#2B2640"; c.lineWidth = 2; c.beginPath(); c.arc(0, -h * 0.2, 4, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    }
    veNhim(w, h, t, o) { // nhím gai: thân nâu nhiều gai, mặt quay về phía bé
      const c = this.c, nhun = o.dangDi ? Math.abs(Math.sin(t * 14)) * 3 : 0;
      c.save(); c.translate(0, -nhun);
      c.fillStyle = "#6b4226";
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + (i + 0.5) / 9 * Math.PI, r = w * 0.55;
        c.beginPath(); c.moveTo(Math.cos(a - 0.2) * r * 0.7, -h * 0.4 + Math.sin(a - 0.2) * h * 0.7);
        c.lineTo(Math.cos(a) * r * 1.15, -h * 0.4 + Math.sin(a) * h * 1.15); c.lineTo(Math.cos(a + 0.2) * r * 0.7, -h * 0.4 + Math.sin(a + 0.2) * h * 0.7); c.fill();
      }
      c.fillStyle = "#8b5a35"; c.beginPath(); c.ellipse(0, -h * 0.4, w / 2, h * 0.5, 0, 0, PI2); c.fill();
      c.fillStyle = "#e8c39e"; c.beginPath(); c.ellipse(-w * 0.32, -h * 0.35, w * 0.22, h * 0.32, 0, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.5, -h * 0.35, 3, 0, PI2); c.fill();
      c.beginPath(); c.arc(-w * 0.3, -h * 0.48, 3, 0, PI2); c.fill();
      c.fillStyle = "#ff9fb0"; c.beginPath(); c.arc(-w * 0.22, -h * 0.3, 3, 0, PI2); c.fill();
      c.restore();
      c.fillStyle = "#4a2d18"; c.fillRect(-w * 0.3, -6, 8, 6); c.fillRect(w * 0.15, -6, 8, 6);
    }
    veSlime(w, h, t, o) { // thạch khổng lồ: QUÁ CAO để nhảy qua -> phải dùng phép thuật
      const c = this.c, lac = Math.sin(t * 4) * 0.04;
      c.save(); c.scale(1 + lac, 1 - lac);
      const gr = c.createLinearGradient(0, -h, 0, 0); gr.addColorStop(0, "#7ef0a0"); gr.addColorStop(1, "#2fbf71");
      c.fillStyle = gr;
      c.beginPath(); c.moveTo(-w / 2, 0); c.bezierCurveTo(-w / 2 - 8, -h * 0.6, -w * 0.35, -h, 0, -h); c.bezierCurveTo(w * 0.35, -h, w / 2 + 8, -h * 0.6, w / 2, 0); c.fill();
      c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.ellipse(-w * 0.22, -h * 0.75, 7, 18, 0.3, 0, PI2); c.fill();
      this.mat(-4, -h * 0.55, 8, true);
      c.fillStyle = "#1d6b44"; c.beginPath(); c.ellipse(-4, -h * 0.35, 12, 8, 0, 0, Math.PI); c.fill();
      c.fillStyle = "#fff"; c.fillRect(-10, -h * 0.35, 5, 5); c.fillRect(1, -h * 0.35, 5, 5);
      c.restore();
      c.fillStyle = "#ffd23f"; c.beginPath(); // vương miện nhỏ
      c.moveTo(-16, -h + 2); c.lineTo(-16, -h - 14); c.lineTo(-8, -h - 6); c.lineTo(0, -h - 18); c.lineTo(8, -h - 6); c.lineTo(16, -h - 14); c.lineTo(16, -h + 2); c.fill();
    }
    veVit(w, h, t) { // vịt bay đeo kính phi công
      const c = this.c, vo = Math.sin(t * 16);
      c.fillStyle = "#ffd23f"; c.beginPath(); c.ellipse(0, -h / 2, w / 2 - 4, h / 2 - 4, 0, 0, PI2); c.fill();
      c.beginPath(); c.arc(-w * 0.32, -h * 0.75, h * 0.32, 0, PI2); c.fill();
      c.fillStyle = "#ff8c1a"; c.beginPath(); c.moveTo(-w * 0.55, -h * 0.75); c.lineTo(-w * 0.78, -h * 0.66); c.lineTo(-w * 0.55, -h * 0.6); c.fill();
      c.fillStyle = "#6C4CE0"; c.beginPath(); c.roundRect(-w * 0.5, -h * 0.92, w * 0.32, 9, 4); c.fill();
      c.fillStyle = "#bfe6ff"; c.beginPath(); c.arc(-w * 0.42, -h * 0.88, 3.5, 0, PI2); c.fill();
      c.fillStyle = "#f0b400"; c.beginPath(); c.ellipse(w * 0.05, -h * 0.55 - vo * 10, w * 0.3, 8, -0.3 - vo * 0.5, 0, PI2); c.fill();
    }
    veOng(w, h, t) {
      const c = this.c, vo = Math.sin(t * 30);
      c.fillStyle = "rgba(220,240,255,0.85)";
      c.beginPath(); c.ellipse(-2, -h + 2 - vo * 3, 10, 14, -0.4, 0, PI2); c.ellipse(10, -h + 4 + vo * 3, 9, 12, 0.4, 0, PI2); c.fill();
      c.fillStyle = "#ffd23f"; c.beginPath(); c.ellipse(0, -h / 2, w / 2, h / 2 - 6, 0, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.fillRect(-4, -h + 8, 7, h - 16); c.fillRect(10, -h + 10, 6, h - 20);
      c.beginPath(); c.moveTo(w / 2 - 2, -h / 2 - 4); c.lineTo(w / 2 + 9, -h / 2); c.lineTo(w / 2 - 2, -h / 2 + 4); c.fill();
      c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(-w * 0.38, -h / 2, 10, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.45, -h / 2 - 2, 2.6, 0, PI2); c.fill();
      c.strokeStyle = "#2B2640"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-w * 0.4, -h / 2 - 9); c.lineTo(-w * 0.5, -h / 2 - 18); c.stroke();
    }

    /* ----- Kho mở rộng (TC_00D2, 16/10/2026): vật cản, quái đất, quái bay mới -----
       Gốc tọa độ: giữa đáy vật (đáy quái bay = độ cao bay), vẽ trong [-w/2, w/2] x [-h, 0],
       mặt quái quay sang TRÁI (phía bé chạy tới). */
    veKhucGo(w, h) { // khúc gỗ nằm ngang, đầu cắt có vân tròn
      const c = this.c;
      c.fillStyle = "#9b6a3e"; c.beginPath(); c.roundRect(-w / 2 + h * 0.3, -h, w - h * 0.3, h, h / 2); c.fill();
      c.strokeStyle = "#7a4f2a"; c.lineWidth = 2;
      for (let i = 1; i <= 2; i++) { c.beginPath(); c.moveTo(-w / 2 + h * 0.6, -h * i / 3); c.lineTo(w / 2 - 8, -h * i / 3 + (i - 1.5) * 3); c.stroke(); }
      c.fillStyle = "#e7bf87"; c.beginPath(); c.ellipse(-w / 2 + h * 0.3, -h / 2, h * 0.32, h / 2, 0, 0, PI2); c.fill();
      c.strokeStyle = "#b9874d"; c.lineWidth = 1.6;
      [0.62, 0.36].forEach(k => { c.beginPath(); c.ellipse(-w / 2 + h * 0.3, -h / 2, h * 0.32 * k, h / 2 * k, 0, 0, PI2); c.stroke(); });
      c.fillStyle = "#e35d6a"; c.beginPath(); c.ellipse(w * 0.18, -h - 4, 8, 5, 0, Math.PI, PI2); c.fill(); // nấm nhỏ mọc trên gỗ
      c.fillStyle = "#fff"; c.beginPath(); c.arc(w * 0.16, -h - 6, 1.6, 0, PI2); c.fill();
      c.fillStyle = "#fff2d6"; c.fillRect(w * 0.18 - 2, -h - 4, 4, 4);
    }
    veHangRao(w, h, bt) { // hàng rào cọc gỗ đầu nhọn, sơn trắng / vàng / xanh
      const c = this.c, mau = ["#fff7ea", "#ffe08a", "#bfe9ff"][bt % 3], vien = "#b8946a";
      const n = Math.max(3, Math.round(w / 18)), cw = w / n;
      c.fillStyle = mau; c.strokeStyle = vien; c.lineWidth = 2;
      c.beginPath(); c.roundRect(-w / 2, -h * 0.72, w, 8, 3); c.fill(); c.stroke();
      c.beginPath(); c.roundRect(-w / 2, -h * 0.32, w, 8, 3); c.fill(); c.stroke();
      for (let i = 0; i < n; i++) {
        const x0 = -w / 2 + i * cw + 2, x1 = x0 + cw - 4;
        c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0, -h + 8); c.lineTo((x0 + x1) / 2, -h); c.lineTo(x1, -h + 8); c.lineTo(x1, 0); c.closePath(); c.fill(); c.stroke();
      }
      c.fillStyle = "#58c84e"; c.beginPath(); c.arc(-w / 2 + 6, -4, 7, Math.PI, PI2); c.arc(w / 2 - 8, -4, 6, Math.PI, PI2); c.fill();
    }
    veBuiGai(w, h, bt) { // bụi cây gai có quả mọng
      const c = this.c;
      c.fillStyle = "#2f7d3a";
      for (let i = 0; i < 8; i++) { // gai nhọn chĩa ra ngoài
        const a = Math.PI + (i + 0.5) / 8 * Math.PI;
        c.beginPath(); c.moveTo(Math.cos(a - 0.15) * w * 0.4, -h * 0.45 + Math.sin(a - 0.15) * h * 0.45);
        c.lineTo(Math.cos(a) * w * 0.58, -h * 0.45 + Math.sin(a) * h * 0.62); c.lineTo(Math.cos(a + 0.15) * w * 0.4, -h * 0.45 + Math.sin(a + 0.15) * h * 0.45); c.fill();
      }
      c.fillStyle = "#3a9a45";
      [[-w * 0.25, -h * 0.4, h * 0.42], [w * 0.22, -h * 0.42, h * 0.44], [0, -h * 0.62, h * 0.4]].forEach(([a, b, r]) => { c.beginPath(); c.arc(a, b, r, 0, PI2); c.fill(); });
      c.fillStyle = "#4fb85a"; c.beginPath(); c.arc(-w * 0.1, -h * 0.7, h * 0.18, 0, PI2); c.fill();
      c.fillStyle = ["#e8344e", "#7b4fd6", "#ff8a1f"][bt % 3];
      [[-w * 0.28, -h * 0.5], [w * 0.05, -h * 0.35], [w * 0.28, -h * 0.6], [-w * 0.05, -h * 0.78]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 3.6, 0, PI2); c.fill(); });
    }
    veThungGo(w, h) { // thùng gỗ đóng nẹp chéo
      const c = this.c;
      c.fillStyle = "#c98c4a"; c.beginPath(); c.roundRect(-w / 2, -h, w, h, 4); c.fill();
      c.strokeStyle = "#8a5a2b"; c.lineWidth = 3; c.strokeRect(-w / 2 + 3, -h + 3, w - 6, h - 6);
      c.lineWidth = 5; c.beginPath(); c.moveTo(-w / 2 + 6, -6); c.lineTo(w / 2 - 6, -h + 6); c.stroke();
      c.strokeStyle = "#a8713a"; c.lineWidth = 1.5;
      for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(-w / 2 + 4, -h * i / 3); c.lineTo(w / 2 - 4, -h * i / 3); c.stroke(); }
      c.fillStyle = "#5a3a1a"; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { c.beginPath(); c.arc(a * (w / 2 - 6), -h / 2 + b * (h / 2 - 6), 2, 0, PI2); c.fill(); });
    }
    veCotTotem(w, h, t) { // cột tô-tem nhiều tầng mặt cười, cao hơn cú nhảy: phải bắn đổ
      const c = this.c, tang = 4, th = (h - 16) / tang, mau = ["#e86f4d", "#3fb6a8", "#f2b134", "#8a6bd8"];
      for (let i = 0; i < tang; i++) {
        const y0 = -(i + 1) * th;
        c.fillStyle = mau[i % 4]; c.beginPath(); c.roundRect(-w / 2, y0, w, th - 2, 6); c.fill();
        c.fillStyle = "rgba(255,255,255,0.25)"; c.fillRect(-w / 2 + 4, y0 + 3, w - 8, 4);
        // mắt + miệng mỗi tầng
        c.fillStyle = "#fff"; c.beginPath(); c.arc(-w * 0.2, y0 + th * 0.38, 6, 0, PI2); c.arc(w * 0.2, y0 + th * 0.38, 6, 0, PI2); c.fill();
        c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.24, y0 + th * 0.4, 3, 0, PI2); c.arc(w * 0.16, y0 + th * 0.4, 3, 0, PI2); c.fill();
        c.strokeStyle = "#2B2640"; c.lineWidth = 2.5; c.beginPath();
        if (i % 2) { c.moveTo(-w * 0.18, y0 + th * 0.7); c.lineTo(w * 0.18, y0 + th * 0.7); } else c.arc(0, y0 + th * 0.58, w * 0.16, 0.2, Math.PI - 0.2);
        c.stroke();
      }
      // đôi cánh trên đỉnh
      const vo = Math.sin(t * 3) * 3;
      c.fillStyle = "#ffd23f";
      c.beginPath(); c.moveTo(-w / 2, -h + 18); c.lineTo(-w / 2 - 22, -h + 4 - vo); c.lineTo(-w / 2 - 8, -h + 24); c.fill();
      c.beginPath(); c.moveTo(w / 2, -h + 18); c.lineTo(w / 2 + 22, -h + 4 - vo); c.lineTo(w / 2 + 8, -h + 24); c.fill();
      c.beginPath(); c.moveTo(-w * 0.3, -h + 16); c.lineTo(0, -h); c.lineTo(w * 0.3, -h + 16); c.fill();
    }
    veOcSen(w, h, t, o) { // ốc sên vỏ xoắn, mắt trên râu
      const c = this.c, co = o.dangDi ? Math.sin(t * 6) * 3 : 0;
      c.fillStyle = "#9fd86b"; c.beginPath(); c.roundRect(-w / 2 - co, -h * 0.32, w + co, h * 0.32, h * 0.16); c.fill();
      c.strokeStyle = "#9fd86b"; c.lineWidth = 3.5;
      c.beginPath(); c.moveTo(-w * 0.38, -h * 0.3); c.lineTo(-w * 0.5 - co, -h * 0.8); c.moveTo(-w * 0.3, -h * 0.3); c.lineTo(-w * 0.3, -h * 0.85); c.stroke();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(-w * 0.5 - co, -h * 0.82, 5, 0, PI2); c.arc(-w * 0.3, -h * 0.87, 5, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.52 - co, -h * 0.82, 2.4, 0, PI2); c.arc(-w * 0.32, -h * 0.87, 2.4, 0, PI2); c.fill();
      c.fillStyle = "#ff7aa8"; c.beginPath(); c.arc(w * 0.1, -h * 0.55, h * 0.45, 0, PI2); c.fill();
      c.strokeStyle = "#c2407a"; c.lineWidth = 3; c.beginPath();
      for (let a = 0; a < Math.PI * 5; a += 0.2) { const r = h * 0.42 * (1 - a / (Math.PI * 5.4)); c.lineTo(w * 0.1 + Math.cos(a) * r, -h * 0.55 + Math.sin(a) * r); }
      c.stroke();
      c.strokeStyle = "#2B2640"; c.lineWidth = 2; c.beginPath(); c.arc(-w * 0.38, -h * 0.18, 3, 0, Math.PI); c.stroke();
    }
    veCua(w, h, t, o) { // cua đỏ giơ càng, đi ngang
      const c = this.c, kep = (o.dangDi ? Math.sin(t * 10) : Math.sin(t * 3)) * 0.25, nhun = o.dangDi ? Math.abs(Math.sin(t * 16)) * 2 : 0;
      c.save(); c.translate(0, -nhun);
      c.strokeStyle = "#c2302f"; c.lineWidth = 3;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-w * 0.25 + i * 6, -h * 0.35); c.lineTo(-w * 0.45 + i * 5, nhun); c.moveTo(w * 0.2 - i * 6, -h * 0.35); c.lineTo(w * 0.42 - i * 5, nhun); c.stroke(); }
      c.fillStyle = "#e8483f"; c.beginPath(); c.ellipse(0, -h * 0.45, w * 0.38, h * 0.38, 0, 0, PI2); c.fill();
      c.fillStyle = "#ff8577"; c.beginPath(); c.ellipse(-w * 0.08, -h * 0.58, w * 0.18, h * 0.12, 0, 0, PI2); c.fill();
      // hai càng
      [[-1, -w * 0.42], [1, w * 0.42]].forEach(([s, x]) => {
        c.save(); c.translate(x, -h * 0.75); c.rotate(s * kep);
        c.fillStyle = "#e8483f"; c.beginPath(); c.arc(0, 0, 9, 0, PI2); c.fill();
        c.fillStyle = "#87ceeb"; c.beginPath(); c.moveTo(0, -1); c.lineTo(s * 9, -7); c.lineTo(s * 9, 3); c.fill(); // khe càng (màu trời)
        c.restore();
      });
      c.strokeStyle = "#c2302f"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-8, -h * 0.75); c.lineTo(-10, -h - 2); c.moveTo(6, -h * 0.75); c.lineTo(6, -h - 2); c.stroke();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(-10, -h - 3, 4.5, 0, PI2); c.arc(6, -h - 3, 4.5, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-11, -h - 3, 2.2, 0, PI2); c.arc(5, -h - 3, 2.2, 0, PI2); c.fill();
      c.strokeStyle = "#7a1b1b"; c.lineWidth = 2; c.beginPath(); c.arc(-4, -h * 0.42, 5, 0.2, Math.PI - 0.2); c.stroke();
      c.restore();
    }
    veEch(w, h, t, o) { // ếch xanh nhảy cóc
      const c = this.c, nhay = o.dangDi ? Math.abs(Math.sin(t * 6)) * 14 : Math.abs(Math.sin(t * 2)) * 2;
      c.save(); c.translate(0, -nhay);
      c.fillStyle = "#3aa64a"; c.beginPath(); c.ellipse(w * 0.22, -h * 0.25, w * 0.24, h * 0.24, 0, 0, PI2); c.fill(); // chân sau
      c.fillStyle = "#5cc96a"; c.beginPath(); c.ellipse(0, -h * 0.42, w * 0.46, h * 0.4, 0, 0, PI2); c.fill();
      c.fillStyle = "#d8f5b0"; c.beginPath(); c.ellipse(-w * 0.12, -h * 0.3, w * 0.24, h * 0.2, 0, 0, PI2); c.fill();
      c.fillStyle = "#5cc96a"; c.beginPath(); c.arc(-w * 0.28, -h * 0.82, 8, 0, PI2); c.arc(-w * 0.02, -h * 0.84, 8, 0, PI2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(-w * 0.28, -h * 0.84, 5.5, 0, PI2); c.arc(-w * 0.02, -h * 0.86, 5.5, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.31, -h * 0.84, 2.8, 0, PI2); c.arc(-w * 0.05, -h * 0.86, 2.8, 0, PI2); c.fill();
      c.strokeStyle = "#1f6b2a"; c.lineWidth = 2; c.beginPath(); c.arc(-w * 0.2, -h * 0.58, 8, 0.25, Math.PI - 0.25); c.stroke();
      c.fillStyle = "#ff9fb0"; c.beginPath(); c.arc(-w * 0.38, -h * 0.6, 3, 0, PI2); c.fill();
      c.fillStyle = "#3aa64a"; c.beginPath(); c.ellipse(-w * 0.3, -3, 7, 3.5, 0, 0, PI2); c.fill();
      c.restore();
    }
    veSau(w, h, t, o) { // sâu róm nhiều đốt uốn lượn
      const c = this.c, n = 5, r = h * 0.42, toc = o.dangDi ? 10 : 3;
      for (let i = n - 1; i >= 0; i--) {
        const x = -w / 2 + r + i * (w - 2 * r) / (n - 1), y = -r - Math.max(0, Math.sin(t * toc - i * 0.9)) * 5;
        c.fillStyle = i === 0 ? "#ffb02e" : i % 2 ? "#8fd14f" : "#6cbf3a";
        c.beginPath(); c.arc(x, y, i === 0 ? r * 1.1 : r, 0, PI2); c.fill();
        if (i > 0) { c.strokeStyle = "#3d7a1e"; c.lineWidth = 1.5; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x + k * 4, y - r); c.lineTo(x + k * 6, y - r - 5); c.stroke(); } }
      }
      const hx = -w / 2 + r, hy = -r - Math.max(0, Math.sin(t * toc)) * 5;
      c.strokeStyle = "#2B2640"; c.lineWidth = 2; c.beginPath(); c.moveTo(hx - 3, hy - r); c.lineTo(hx - 8, hy - r - 9); c.moveTo(hx + 3, hy - r); c.lineTo(hx + 4, hy - r - 10); c.stroke();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(hx - 8, hy - r - 9, 2.5, 0, PI2); c.arc(hx + 4, hy - r - 10, 2.5, 0, PI2); c.fill();
      this.mat(hx - 2, hy - 2, 3.6, true);
    }
    veCayBietDi(w, h, t, o) { // cây cổ thụ biết đi: QUÁ CAO để nhảy qua -> phải bắn
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 5) : 0, lac = Math.sin(t * 2) * 0.03;
      c.fillStyle = "#6b4226"; // rễ làm chân
      c.beginPath(); c.ellipse(-w * 0.22 + buoc * 6, -5, 14, 6, 0, 0, PI2); c.ellipse(w * 0.22 - buoc * 6, -5, 14, 6, 0, 0, PI2); c.fill();
      c.save(); c.rotate(lac);
      c.fillStyle = "#8a5a35"; c.beginPath(); c.moveTo(-w * 0.3, -6); c.lineTo(-w * 0.2, -h * 0.62); c.lineTo(w * 0.2, -h * 0.62); c.lineTo(w * 0.3, -6); c.fill();
      c.strokeStyle = "#6b4226"; c.lineWidth = 2; for (let i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(i * w * 0.1, -h * 0.58); c.lineTo(i * w * 0.14, -12); c.stroke(); }
      // tán lá tròn nhiều lớp
      [["#2f8f3e", 0, -h * 0.78, w * 0.55], ["#3fae4c", -w * 0.28, -h * 0.72, w * 0.32], ["#3fae4c", w * 0.3, -h * 0.74, w * 0.3], ["#5bc865", -w * 0.08, -h * 0.9, w * 0.26]]
        .forEach(([m, a, b, r]) => { c.fillStyle = m; c.beginPath(); c.arc(a, b, r, 0, PI2); c.fill(); });
      c.fillStyle = "#e8344e"; [[-w * 0.3, -h * 0.8], [w * 0.2, -h * 0.92], [w * 0.36, -h * 0.68]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 4, 0, PI2); c.fill(); });
      // mặt trên thân cây
      this.mat(-w * 0.04, -h * 0.42, 7, true);
      c.fillStyle = "#4a2d18"; c.beginPath(); c.ellipse(-w * 0.04, -h * 0.28, 10, 6, 0, 0, Math.PI); c.fill();
      c.restore();
    }
    veDoi(w, h, t) { // dơi tím vỗ cánh
      const c = this.c, vo = Math.sin(t * 18), cy = -h / 2;
      c.fillStyle = "#5b3f8f";
      [-1, 1].forEach(s => {
        c.beginPath(); c.moveTo(s * 6, cy);
        c.lineTo(s * w * 0.5, cy - 12 - vo * 10); c.lineTo(s * w * 0.42, cy + 2 - vo * 4); c.lineTo(s * w * 0.3, cy - 2 - vo * 6); c.lineTo(s * w * 0.2, cy + 8); c.closePath(); c.fill();
      });
      c.fillStyle = "#7a58b8"; c.beginPath(); c.ellipse(0, cy, 12, h * 0.42, 0, 0, PI2); c.fill();
      c.beginPath(); c.moveTo(-9, cy - h * 0.3); c.lineTo(-7, cy - h * 0.62); c.lineTo(-2, cy - h * 0.36); c.moveTo(9, cy - h * 0.3); c.lineTo(7, cy - h * 0.62); c.lineTo(2, cy - h * 0.36); c.fill();
      c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(-5, cy - 4, 3.5, 0, PI2); c.arc(5, cy - 4, 3.5, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-6, cy - 4, 1.8, 0, PI2); c.arc(4, cy - 4, 1.8, 0, PI2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-4, cy + 4); c.lineTo(-2, cy + 8); c.lineTo(0, cy + 4); c.moveTo(1, cy + 4); c.lineTo(3, cy + 8); c.lineTo(5, cy + 4); c.fill();
    }
    veChim(w, h, t, bt) { // chim sẻ tròn, vỗ cánh, mỏ quay về phía bé
      const c = this.c, vo = Math.sin(t * 20), than = ["#5aa9e6", "#ff8c5a", "#b98be0"][bt % 3];
      c.fillStyle = than; c.beginPath(); c.moveTo(w * 0.3, -h * 0.55); c.lineTo(w * 0.55, -h * 0.75); c.lineTo(w * 0.55, -h * 0.35); c.fill(); // đuôi
      c.beginPath(); c.ellipse(0, -h / 2, w * 0.36, h * 0.44, 0, 0, PI2); c.fill();
      c.fillStyle = "#fff4dc"; c.beginPath(); c.ellipse(-w * 0.08, -h * 0.36, w * 0.2, h * 0.24, 0, 0, PI2); c.fill();
      c.fillStyle = "#ffb000"; c.beginPath(); c.moveTo(-w * 0.34, -h * 0.62); c.lineTo(-w * 0.52, -h * 0.55); c.lineTo(-w * 0.34, -h * 0.48); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.2, -h * 0.66, 3, 0, PI2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(-w * 0.19, -h * 0.68, 1, 0, PI2); c.fill();
      c.fillStyle = "#ff9fb0"; c.beginPath(); c.arc(-w * 0.24, -h * 0.5, 2.5, 0, PI2); c.fill();
      c.fillStyle = tronMau(than.length === 7 ? than : "#5aa9e6", "#2B2640", 0.25);
      c.beginPath(); c.ellipse(w * 0.06, -h * 0.55 - vo * 9, w * 0.24, 7, -0.4 - vo * 0.5, 0, PI2); c.fill();
    }
    veBoRua(w, h, t) { // bọ rùa đỏ chấm đen, cánh mỏng vỗ nhanh
      const c = this.c, vo = Math.sin(t * 28);
      c.fillStyle = "rgba(220,240,255,0.8)";
      c.beginPath(); c.ellipse(4, -h + 4 - vo * 3, 9, 14, 0.5, 0, PI2); c.ellipse(12, -h + 6 + vo * 3, 8, 12, 0.9, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.34, -h * 0.45, h * 0.24, 0, PI2); c.fill();
      c.fillStyle = "#e8344e"; c.beginPath(); c.arc(w * 0.04, -h * 0.45, h * 0.42, Math.PI * 0.5, Math.PI * 2.5); c.fill();
      c.strokeStyle = "#2B2640"; c.lineWidth = 2; c.beginPath(); c.moveTo(w * 0.04 - h * 0.42, -h * 0.45); c.lineTo(w * 0.04 + h * 0.42, -h * 0.45); c.stroke();
      c.fillStyle = "#2B2640"; [[-4, -h * 0.62], [10, -h * 0.66], [-2, -h * 0.28], [12, -h * 0.3]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 3.4, 0, PI2); c.fill(); });
      c.fillStyle = "#fff"; c.beginPath(); c.arc(-w * 0.4, -h * 0.5, 2.6, 0, PI2); c.arc(-w * 0.28, -h * 0.52, 2.6, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-w * 0.41, -h * 0.5, 1.3, 0, PI2); c.arc(-w * 0.29, -h * 0.52, 1.3, 0, PI2); c.fill();
      c.strokeStyle = "#2B2640"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-w * 0.4, -h * 0.66); c.lineTo(-w * 0.5, -h * 0.82); c.moveTo(-w * 0.3, -h * 0.66); c.lineTo(-w * 0.3, -h * 0.84); c.stroke();
    }

    /* ---------------- BIỂN CHỮ trên chướng ngại vật ---------------- */
    veBien(o, g, x) {
      if (!o.tu || o.trangThai === "qua" || o.boChay || (!o.song && o.tChet > 0.3)) return;
      const c = this.c, tt = g.thuThach, dangHoi = tt && tt.o === o && tt.trangThai === "mo";
      const daDung = o.trangThai === "daTraLoi";
      const tamX = (o.nhom === "ho" ? x - 18 : x + o.rong / 2); // hố: biển cắm trên đất ngay trước miệng hố
      let dinhY = this.dat - o.bayCao - o.cao - 14 - (o.mauToiDa && o.song ? 22 : 0);
      if (o.nhom === "ho" || o.nhom === "kimCuong") dinhY = this.dat - 62; // hố / cụm kim cương: biển cắm trên đất
      dinhY = Math.max(dinhY, 64);
      c.font = "800 19px " + FONT;
      const chu = g.dk.anChu && !daDung ? o.tu.e + " 🔊" : o.tu.en; // cấp 3-4: chưa đúng thì chỉ có hình
      const w = Math.max(64, c.measureText(chu).width + 24), h = 30;
      const nay = dangHoi ? Math.sin(this.t * 7) * 3 : 0;
      const by = dinhY - h + nay;
      if (o.nhom === "ho" || o.nhom === "can" || o.nhom === "kimCuong") { c.fillStyle = "#7a4b25"; c.fillRect(tamX - 2, by + h, 4, this.dat - by - h - (o.nhom === "can" ? o.cao : 0)); }
      c.fillStyle = daDung ? "#e6fff0" : "#fff";
      c.beginPath(); c.roundRect(tamX - w / 2, by, w, h, 10); c.fill();
      c.lineWidth = dangHoi ? 4 : 2.5; c.strokeStyle = daDung ? "#2BB673" : dangHoi ? "#FFB800" : "#4B2FB0"; c.stroke();
      c.fillStyle = daDung ? "#1f8a55" : "#2B2640"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(chu, tamX, by + h / 2 + 1);
    }
    veKimCuong(x, y, k, t) {
      const c = this.c, s = 13 * k, nay = Math.sin((t || 0) * 5) * 2;
      c.save(); c.translate(x, y + nay);
      c.fillStyle = "rgba(120,220,255,0.35)"; c.beginPath(); c.arc(0, 0, s * 1.5 + Math.sin(this.t * 8) * 2, 0, PI2); c.fill();
      c.fillStyle = "#3fc8ff"; c.beginPath(); c.moveTo(-s, -s * 0.35); c.lineTo(-s * 0.5, -s * 0.85); c.lineTo(s * 0.5, -s * 0.85); c.lineTo(s, -s * 0.35); c.lineTo(0, s); c.closePath(); c.fill();
      c.fillStyle = "#a8ecff"; c.beginPath(); c.moveTo(-s * 0.5, -s * 0.85); c.lineTo(0, -s * 0.35); c.lineTo(-s, -s * 0.35); c.fill();
      c.fillStyle = "#1c8fd6"; c.beginPath(); c.moveTo(0, s); c.lineTo(s, -s * 0.35); c.lineTo(s * 0.2, -s * 0.35); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(-s * 0.35, -s * 0.5, s * 0.14, 0, PI2); c.fill();
      c.restore();
    }
    veDan(d, camX) { // ngôi sao phép thuật có đuôi sáng
      const c = this.c, x = d.x - camX, y = this.dat - d.y;
      if (Math.random() < 0.7) this.hat.push({ x: d.x, y: d.y, vx: -40, vy: (Math.random() - 0.5) * 40, t: 0, song: 0.35, kieu: "sang", mau: "#fff7a8", co: 4, xoay: 0 });
      this.veSao(x, y, 12, "#ffe14d", this.t * 12);
    }
    veSao(x, y, r, mau, xoay) {
      const c = this.c;
      c.save(); c.translate(x, y); c.rotate(xoay || 0); c.fillStyle = mau;
      c.beginPath();
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      c.fill(); c.restore();
    }
    // Từ đang hỏi mà chướng ngại vật còn ngoài màn hình: mũi tên ở mép phải báo "sắp tới"
    veMuiTenSapToi(g, camX) {
      const tt = g.thuThach; if (!tt || tt.trangThai !== "mo") return;
      const x = tt.o.x + tt.o.rong / 2 - camX; if (x < this.rong - 10) return;
      const c = this.c, y = Math.max(70, this.dat - 120), nay = Math.sin(this.t * 8) * 4;
      c.font = "800 18px " + FONT;
      const chuTu = g.dk.anChu ? tt.tu.e + " 🔊" : tt.tu.en;
      const w = c.measureText(chuTu).width + 44;
      c.fillStyle = "rgba(255,255,255,0.95)"; c.strokeStyle = "#FFB800"; c.lineWidth = 3;
      c.beginPath(); c.roundRect(this.rong - w - 14 + nay, y - 16, w, 32, 12); c.fill(); c.stroke();
      c.fillStyle = "#2B2640"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(chuTu + " ➜", this.rong - w / 2 - 14 + nay, y + 1);
      if (tt.o.hanhDong === "ban" && tt.o.song) { // quái có máu còn ngoài màn hình: báo số viên còn phải bắn
        c.fillStyle = "#c2410c"; c.font = "800 13px " + FONT;
        c.fillText("💥 còn " + tt.o.mau + " viên", this.rong - w / 2 - 14 + nay, y + 28);
      }
    }

    /* ---------------- EM BÉ ---------------- */
    veBe(be, g, camX) {
      const c = this.c;
      let x = be.x - camX, y = this.dat - be.y;
      const t = this.t, che = be.che;
      const thang = g && g.trangThai === "thang";
      if (thang) { x = this.viTriBeThang(g) - camX; y = this.dat - (g.tKetThuc > 1.2 ? Math.abs(Math.sin(g.tKetThuc * 5)) * 22 : 0); }
      // bóng dưới chân (không vẽ khi đang rơi hố)
      if (che !== "roi") {
        c.fillStyle = "rgba(0,0,0,0.15)"; const r = 18 - Math.min(10, be.y / 12);
        c.beginPath(); c.ellipse(x, this.dat + 2, r, 4, 0, 0, PI2); c.fill();
      }
      c.save();
      // bất tử sau hồi sinh: nhấp nháy rõ ràng
      if (be.batTu > 0 && !thang) c.globalAlpha = Math.sin(t * 28) > 0 ? 1 : 0.3;
      c.translate(x, y);
      let sx = 1, sy = 1, nghieng = 0;
      if (che === "chay" && be.tTiepDat < 0.12) { sx = 1.1; sy = 0.86; }      // đáp đất: nhún
      if (che === "gapNan") { nghieng = -0.4 * Math.min(1, be.tChe * 4); }
      if (che === "roi") { const k = Math.max(0.3, 1 - be.tChe * 0.4); sx = k; sy = k; nghieng = be.tChe * 4; }
      if (g && g.trangThai === "thua" && che === "roi") { const k = Math.max(0.2, 1 - (g.tKetThuc + 1) * 0.4); sx = sy = k; nghieng = (g.tKetThuc + 1) * 4; c.translate(0, g.tKetThuc * 120); }
      c.rotate(nghieng); c.scale(sx, sy);
      const pha = (be.x || 0) * 0.075;   // nhịp bước theo quãng đường -> mượt ở mọi tốc độ khung hình
      const dangChay = che === "chay" && !thang;
      const nhay = che === "nhay" || (thang && y < this.dat - 2);
      const phep = be.tPhep < 0.35; // vừa bắn: giơ đũa
      // chân
      c.fillStyle = "#ffcfa6"; c.strokeStyle = "#ffcfa6"; c.lineWidth = 8;
      const chan = (goc, dx) => { c.save(); c.translate(dx, -18); c.rotate(goc); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 14); c.stroke(); c.fillStyle = "#ff6b6b"; c.beginPath(); c.ellipse(3, 17, 7, 4.5, 0, 0, PI2); c.fill(); c.restore(); };
      if (nhay) { chan(-0.9, -5); chan(-0.5, 6); }
      else if (dangChay) { chan(Math.sin(pha) * 0.8, -4); chan(-Math.sin(pha) * 0.8, 5); }
      else { chan(0, -5); chan(0, 6); }
      // thân: bộ áo liền màu vàng
      const nhun = dangChay ? Math.abs(Math.sin(pha)) * 2 : 0;
      c.translate(0, -nhun);
      c.fillStyle = "#ffcc33"; c.beginPath(); c.roundRect(-13, -42, 26, 26, 10); c.fill();
      c.fillStyle = "#ff9f1c"; c.beginPath(); c.arc(0, -30, 3, 0, PI2); c.fill();
      // tay
      c.strokeStyle = "#ffcfa6"; c.lineWidth = 7;
      const tay = (goc, dx) => { c.save(); c.translate(dx, -38); c.rotate(goc); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 13); c.stroke(); c.restore(); };
      if (nhay || thang) { tay(2.6, -10); tay(-2.6, 10); }
      else if (che === "khung" || che === "gapNan") { tay(2.2, -10); tay(-2.2, 10); }
      else if (dangChay) { tay(-Math.sin(pha) * 0.9, -11); tay(Math.sin(pha) * 0.9 - (phep ? 0 : 0), 11); }
      else { tay(0.2, -11); tay(-0.2, 11); }
      // đũa phép (giơ ra trước khi bắn phép)
      c.save(); c.translate(12, -38); c.rotate(phep ? -1.4 : -0.3);
      c.strokeStyle = "#7a4b25"; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -16); c.stroke();
      this.veSao(0, -19, phep ? 8 : 5, phep ? "#fff27a" : "#ffd23f", t * 3);
      c.restore();
      // đầu to tròn
      const dx = 2;
      c.fillStyle = "#ffd9b8"; c.beginPath(); c.arc(dx, -58, 19, 0, PI2); c.fill();
      // tóc + lọn tóc xoăn
      c.fillStyle = "#6b3f1f"; c.beginPath(); c.arc(dx, -62, 19, Math.PI * 1.05, Math.PI * 1.95); c.fill();
      c.strokeStyle = "#6b3f1f"; c.lineWidth = 3.5; c.beginPath(); c.arc(dx + 2, -80, 5, Math.PI * 0.5, Math.PI * 2.1); c.stroke();
      // nơ hồng
      c.fillStyle = "#ff7eb6"; c.beginPath(); c.moveTo(dx + 12, -74); c.lineTo(dx + 22, -80); c.lineTo(dx + 22, -68); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(dx + 12, -74); c.lineTo(dx + 4, -82); c.lineTo(dx + 3, -70); c.closePath(); c.fill();
      // mặt
      const matY = -56;
      c.fillStyle = "#2B2640";
      if (che === "khung" || che === "gapNan" || che === "roi") {
        c.strokeStyle = "#2B2640"; c.lineWidth = 2;
        [dx - 6, dx + 8].forEach(mx => { c.beginPath(); c.arc(mx, matY, 3.5, t * 10, t * 10 + Math.PI * 1.6); c.stroke(); }); // mắt xoáy chóng mặt
        c.beginPath(); c.ellipse(dx + 1, -47, 3, 4, 0, 0, PI2); c.stroke();
      } else {
        c.beginPath(); c.ellipse(dx - 6, matY, 3.3, 4.2, 0, 0, PI2); c.ellipse(dx + 8, matY, 3.3, 4.2, 0, 0, PI2); c.fill();
        c.fillStyle = "#fff"; c.beginPath(); c.arc(dx - 5, matY - 2, 1.4, 0, PI2); c.arc(dx + 9, matY - 2, 1.4, 0, PI2); c.fill();
        c.strokeStyle = "#2B2640"; c.lineWidth = 2;
        if (nhay || thang || phep) { c.fillStyle = "#c2185b"; c.beginPath(); c.arc(dx + 1, -47, 4, 0, Math.PI); c.fill(); }
        else { c.beginPath(); c.arc(dx + 1, -49, 4, 0.2, Math.PI - 0.2); c.stroke(); }
      }
      c.fillStyle = "rgba(255,120,150,0.45)"; c.beginPath(); c.arc(dx - 12, -50, 3.6, 0, PI2); c.arc(dx + 14, -50, 3.6, 0, PI2); c.fill();
      c.restore();
      // chóng mặt: sao xoay quanh đầu
      if (che === "khung") for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; this.veSao(x + Math.cos(a) * 18, y - 86 + Math.sin(a) * 5, 5, "#ffd23f", a); }
      // vừa hồi sinh: lấp lánh
      if (be.batTu > (ST.CAU_HINH.thoiGianBatTu - 0.5) && !thang) for (let i = 0; i < 4; i++) { const a = t * 6 + i * 1.6; this.veSao(x + Math.cos(a) * 26, y - 40 + Math.sin(a) * 30, 5, "#fff", a); }
    }

    veHat(camX) {
      const c = this.c;
      for (const h of this.hat) {
        const x = h.x - camX, y = this.dat - h.y, a = Math.max(0, 1 - h.t / h.song);
        c.globalAlpha = a;
        if (h.kieu === "sang" || h.kieu === "lapLanh") this.veSao(x, y, h.co, h.mau || "#fff7a8", h.xoay);
        else if (h.kieu === "bui") { c.fillStyle = "rgba(200,170,130,0.8)"; c.beginPath(); c.arc(x, y, h.co * (1 + h.t * 2), 0, PI2); c.fill(); }
        else if (h.kieu === "khoi") { c.fillStyle = "rgba(255,255,255,0.9)"; c.beginPath(); c.arc(x, y, h.co * (1.5 + h.t * 3), 0, PI2); c.fill(); }
        else if (h.kieu === "tim") { this.veTim(x, y, h.co); }
        else if (h.kieu === "giay") { c.save(); c.translate(x, y); c.rotate(h.xoay); c.fillStyle = h.mau; c.fillRect(-h.co / 2, -h.co / 4, h.co, h.co / 2); c.restore(); }
        else { c.fillStyle = h.mau || "#fff"; c.beginPath(); c.arc(x, y, h.co, 0, PI2); c.fill(); }
      }
      c.globalAlpha = 1;
    }
    veTim(x, y, r) {
      const c = this.c;
      c.fillStyle = "#ff5c8a"; c.beginPath();
      c.moveTo(x, y + r * 0.9); c.bezierCurveTo(x - r * 1.4, y - r * 0.2, x - r * 0.6, y - r * 1.2, x, y - r * 0.4);
      c.bezierCurveTo(x + r * 0.6, y - r * 1.2, x + r * 1.4, y - r * 0.2, x, y + r * 0.9); c.fill();
    }
  }
  ST.BoVe = BoVe;
})(typeof window !== "undefined" ? window : globalThis);
