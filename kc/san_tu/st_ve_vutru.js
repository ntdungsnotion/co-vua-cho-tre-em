/* ================================================================
   FILE: san_tu/st_ve_vutru.js
   CHỨC NĂNG: HÌNH VẼ đường đua 10 "Vũ trụ" (game Giải Cứu Mèo Con).
              Cảnh: không gian tím thẫm, tinh vân, sao lấp lánh, hành tinh có vành, Trái Đất xa, sao băng;
              mặt đường trên mặt trăng có miệng núi nhỏ; miệng hố thiên thạch nhìn xuống vũ trụ; hang pha lê
              sao băng; trạm vũ trụ ở màn 7; bé CƯỠI TÀU TÊN LỬA nhỏ, đội mũ phi hành gia.
              19 quái / vật cản vũ trụ, màu sáng nổi trên nền tối.
              Quy ước giống st_ve_keo.js: gốc tọa độ giữa đáy vật, mặt quay sang TRÁI, "this" là BoVe.
   BƯỚC: TC_00F
   CẬP NHẬT: 16/10/2026 - TC_00G: đồ của bé gắn theo khung xương mới (st_ve_be.js), bé NGỒI trong tàu.
   CẬP NHẬT: 16/10/2026 - TC_00G2: không còn mặt trăng / mặt đường: tàu bay giữa tinh không (sao, tinh vân,
             thiên hà trôi bên dưới); hố là LỖ ĐEN (người dùng yêu cầu).
   CẬP NHẬT: 16/10/2026 - TC_00G3: bỏ vệt mờ như mặt đường; sao là các điểm sáng nhấp nháy, xen ngôi sao
             5 cánh nhấp nháy; hành tinh tròn lớn thay bằng MẶT TRỜI có tia sáng tỏa ra, vành lửa bao quanh (người dùng yêu cầu).
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST;
  const { PI2, tronMau, bam, chiaDuong, moiBuoc } = ST.VE_CHUNG;

  /* Sao nhấp nháy: phần lớn là điểm sáng (sáng lên thì có tia chữ thập), thỉnh thoảng một
     ngôi sao 5 cánh nhỏ phồng lên xẹp xuống. i: số thứ tự để mỗi sao một nhịp riêng. */
  function veSaoNhay(bv, x, y, i, co) {
    const c = bv.c, t = bv.t, nhip = 0.5 + 0.5 * Math.sin(t * (1.6 + bam(i + 11) * 2.4) + i * 1.7);
    if (bam(i + 13) < 0.12) { // ngôi sao 5 cánh
      const r = (3 + co * 2) * (0.75 + nhip * 0.45);
      c.globalAlpha = 0.55 + nhip * 0.45;
      bv.veSao(x, y, r, ["#fff6b0", "#ffd6f4", "#c8ecff"][i % 3], Math.sin(t * 0.8 + i) * 0.3);
      c.globalAlpha = 1;
      return;
    }
    const r = 0.7 + co * 1.1;
    c.fillStyle = `rgba(255,255,255,${0.25 + nhip * 0.75})`; c.beginPath(); c.arc(x, y, r, 0, PI2); c.fill();
    if (nhip > 0.7 && co > 0.5) { // lóe sáng: tia chữ thập
      const d = r * (2 + (nhip - 0.7) * 14);
      c.strokeStyle = `rgba(255,255,255,${(nhip - 0.7) * 2.4})`; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x - d, y); c.lineTo(x + d, y); c.moveTo(x, y - d); c.lineTo(x, y + d); c.stroke();
    }
  }

  ST.CHU_DE_VE = ST.CHU_DE_VE || {};
  ST.CHU_DE_VE.vuTru = {
    cong: { soc: "#3fd6c8", nut: "#ff6ab8" },
    mauGoHang: ["#3a3a6a", "#8ae8ff"],
    phuongTien: {
      tuThe: "ngoi", nang: 22, khongBong: true, // trong không gian: không có bóng dưới tàu
      sau(tt) { // tàu vũ trụ nhỏ: lửa phụt, đuôi tàu phía sau bé (bé ngồi trong khoang lái)
        const c = this.c, t = tt.t, lua = tt.nhay ? 1.7 : 1, y0 = tt.k.hong.y + 8; // y0: đáy khoang lái
        c.translate(0, y0);
        for (let k = 0; k < 3; k++) { // lửa
          const dai = (16 + k * 7) * lua * (1 + Math.sin(t * 25 + k) * 0.15);
          c.fillStyle = ["#fff2a0", "#ffb03b", "#ff5a3a"][k]; c.globalAlpha = 1 - k * 0.2;
          c.beginPath(); c.moveTo(-38, -14); c.quadraticCurveTo(-38 - dai, -7, -38, 0); c.fill();
        }
        c.globalAlpha = 1;
        c.fillStyle = "#e8344e"; // cánh đuôi dựng phía sau
        c.beginPath(); c.moveTo(-36, -16); c.lineTo(-40, -36); c.lineTo(-28, -36); c.lineTo(-18, -16); c.fill();
        c.fillStyle = "#c8cde0"; c.beginPath(); c.roundRect(-30, -24, 30, 12, 6); c.fill(); // lưng ghế
      },
      truoc(tt) { // thân tàu che nửa dưới người bé, kính chắn gió, mũ phi hành gia
        const c = this.c, t = this.t, k = tt.k, y0 = k.hong.y + 8;
        c.save(); c.translate(0, y0);
        c.fillStyle = "#e8344e"; c.beginPath(); c.moveTo(-20, 0); c.lineTo(-34, 12); c.lineTo(-8, 4); c.fill(); // cánh dưới
        c.fillStyle = "#f0f0f8"; c.strokeStyle = "#9aa3c0"; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(-40, -16); c.lineTo(14, -16); c.quadraticCurveTo(44, -14, 50, -6); c.quadraticCurveTo(44, 3, 14, 4); c.lineTo(-40, 4); c.quadraticCurveTo(-44, -6, -40, -16); c.fill(); c.stroke();
        c.fillStyle = "#e8344e"; c.beginPath(); c.moveTo(30, -15); c.quadraticCurveTo(46, -13, 50, -6); c.quadraticCurveTo(46, 1, 30, 3); c.fill(); // mũi tàu
        c.fillStyle = "#3f7fd0"; c.fillRect(-34, -16, 5, 20);
        c.fillStyle = "#8ae8ff"; c.strokeStyle = "#3f7fd0"; c.lineWidth = 2; c.beginPath(); c.arc(22, -6, 4, 0, PI2); c.fill(); c.stroke(); // ô cửa
        c.fillStyle = Math.sin(t * 5) > 0 ? "#ff5a5f" : "#ffd23f"; c.beginPath(); c.arc(-14, -6, 2.4, 0, PI2); c.fill(); // đèn nháy
        c.fillStyle = "rgba(170,230,255,0.45)"; c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 1.5; // kính chắn gió
        c.beginPath(); c.moveTo(12, -16); c.quadraticCurveTo(20, -30, 14, -40); c.lineTo(10, -40); c.quadraticCurveTo(14, -28, 6, -16); c.closePath(); c.fill(); c.stroke();
        c.restore();
        ST.VE_CHUNG.theoDau(c, k, r => { // mũ phi hành gia: bong bóng kính trong suốt + ăng-ten
          c.fillStyle = "rgba(200,240,255,0.22)"; c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 2.2;
          c.beginPath(); c.arc(1, 0, r + 6, 0, PI2); c.fill(); c.stroke();
          c.fillStyle = "rgba(255,255,255,0.6)"; c.beginPath(); c.ellipse(-6, -9, 3.5, 6.5, 0.6, 0, PI2); c.fill();
          c.strokeStyle = "#c8c8d8"; c.lineWidth = 2; c.beginPath(); c.moveTo(10, -r - 2); c.lineTo(15, -r - 12); c.stroke();
          c.fillStyle = Math.sin(t * 5) > 0 ? "#ff5a5f" : "#ffd23f"; c.beginPath(); c.arc(15, -r - 13, 3, 0, PI2); c.fill();
        });
        ST.VE_CHUNG.theoThan(c, k, () => { c.fillStyle = "#c8c8d8"; c.beginPath(); c.roundRect(-8, 0, 16, 4.5, 2); c.fill(); }); // vòng cổ áo
      }
    },

    nen(camX, p) {
      const c = this.c, W = this.rong, H = this.cao, dat = this.dat, t = this.t;
      const s = Math.max(0, (p - 0.45) / 0.55);
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, "#0a0a2a"); gr.addColorStop(1, tronMau("#2a1a5a", "#3a1a4a", s));
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // tinh vân
      [["rgba(255,100,200,0.12)", 0.2, 0.3, 220], ["rgba(80,200,255,0.12)", 0.6, 0.45, 260], ["rgba(160,100,255,0.12)", 0.9, 0.2, 200]].forEach(([m, a, b, r]) => {
        const x = ((a * W * 1.5 - camX * 0.02) % (W * 1.5) + W * 1.5) % (W * 1.5) - W * 0.25;
        c.fillStyle = m; c.beginPath(); c.ellipse(x, b * dat, r, r * 0.5, 0.4, 0, PI2); c.fill();
      });
      for (let i = 0; i < 90; i++) { // sao nhấp nháy
        const x = ((bam(i) * W * 1.5 - camX * (0.02 + bam(i + 5) * 0.04)) % W + W) % W, y = bam(i + 90) * dat;
        veSaoNhay(this, x, y, i, bam(i + 4));
      }
      // mặt trời xa: lõi nhỏ chói, vành lửa, tia sáng tỏa ra (không vẽ khối tròn lớn)
      ST.VE_CHUNG.veMatTroi(c, W * 0.8 - p * W * 0.12, 92, 13, t, 58);
      // Trái Đất nhỏ
      const ex = W * 0.2 - p * W * 0.06, ey = 70;
      c.fillStyle = "#3f8fe0"; c.beginPath(); c.arc(ex, ey, 22, 0, PI2); c.fill();
      c.fillStyle = "#4fc84e"; c.beginPath(); c.ellipse(ex - 6, ey - 4, 9, 7, 0.4, 0, PI2); c.ellipse(ex + 9, ey + 8, 6, 5, 0, 0, PI2); c.fill();
      c.fillStyle = "rgba(255,255,255,0.7)"; c.beginPath(); c.ellipse(ex + 4, ey - 12, 8, 3, 0, 0, PI2); c.fill();
      // sao băng
      const u = (t * 0.25) % 1;
      if (u < 0.3) { const sx = W * (1 - u * 3), sy = 40 + u * 300; c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 2; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + 60, sy - 24); c.stroke(); }
      if (p > 0.45) {
        const a = Math.min(1, (p - 0.45) / 0.15), x = W + 60 - (p - 0.45) / 0.55 * W * 0.35;
        c.globalAlpha = 0.6 * a; ST.CHU_DE_VE.vuTru.bongLauDai.call(this, x, dat - 70, 0.45); c.globalAlpha = 1;
      }
      // không có mặt trăng / đường: chỉ có tinh không (người dùng yêu cầu 16/10/2026)
    },

    dat(camX, ds, doDai) { // không có đường: dưới tàu là tinh không với sao, tinh vân, thiên hà trôi qua
      const c = this.c, y = this.dat, H = this.cao, W = this.rong, t = this.t;
      const gr = c.createLinearGradient(0, y - 40, 0, H);
      gr.addColorStop(0, "rgba(42,26,90,0)"); gr.addColorStop(0.35, "#1c1248"); gr.addColorStop(1, "#0a0820");
      c.fillStyle = gr; c.fillRect(0, y - 40, W, H - y + 40);
      // tinh vân và thiên hà trôi theo tốc độ bay (cùng nhịp với quái nên bé thấy mình đang lao đi)
      moiBuoc(camX, -260, W + 260, 260, (i, x) => {
        const xx = x + bam(i) * 120, yy = y + 26 + bam(i + 1) * Math.max(10, H - y - 50), loai = bam(i + 2);
        if (loai < 0.4) { // tinh vân
          const m = ["rgba(255,110,210,", "rgba(90,200,255,", "rgba(170,110,255,"][i % 3];
          c.fillStyle = m + "0.16)"; c.beginPath(); c.ellipse(xx, yy, 90, 26, 0.15, 0, PI2); c.fill();
          c.fillStyle = m + "0.14)"; c.beginPath(); c.ellipse(xx + 30, yy - 6, 50, 16, -0.2, 0, PI2); c.fill();
        } else if (loai < 0.75) { // thiên hà xoắn ốc
          c.save(); c.translate(xx, yy); c.rotate(t * 0.15 + i); c.scale(1, 0.45);
          c.fillStyle = "rgba(255,240,200,0.55)"; c.beginPath(); c.arc(0, 0, 6, 0, PI2); c.fill();
          c.strokeStyle = "rgba(190,170,255,0.45)"; c.lineWidth = 3;
          for (const g of [0, Math.PI]) { c.beginPath(); for (let k = 0; k <= 20; k++) { const a = g + k * 0.22, r = 4 + k * 1.6; k ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke(); }
          c.restore();
        } else { // hành tinh tí hon
          c.fillStyle = ["#7ad0ff", "#ffb36b", "#c79bff"][i % 3]; c.beginPath(); c.arc(xx, yy, 7 + bam(i + 3) * 6, 0, PI2); c.fill();
        }
      });
      moiBuoc(camX, -10, W + 10, 23, (i, x) => { // sao nhấp nháy dưới tàu
        veSaoNhay(this, x + bam(i) * 20, y + 12 + bam(i + 7) * Math.max(10, H - y - 16), i + 300, bam(i + 3));
      });
    },
    mieng(x, w) { // HỐ = LỖ ĐEN: tâm đen, đĩa sáng xoay quanh, sao bị hút vào
      const c = this.c, y = this.dat, t = this.t, cx = x + w / 2, r = w / 2;
      const cy = y + r * 0.2;
      const hao = c.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.25);
      hao.addColorStop(0, "rgba(255,170,90,0.0)"); hao.addColorStop(0.55, "rgba(255,140,80,0.35)"); hao.addColorStop(1, "rgba(120,60,200,0)");
      c.fillStyle = hao; c.beginPath(); c.arc(cx, cy, r * 1.25, 0, PI2); c.fill();
      c.save(); c.translate(cx, cy); c.scale(1, 0.38);
      for (let k = 0; k < 3; k++) { // đĩa bồi tụ xoay
        c.strokeStyle = ["rgba(255,210,120,0.9)", "rgba(255,130,80,0.75)", "rgba(200,110,255,0.6)"][k]; c.lineWidth = 5 - k;
        c.beginPath(); c.arc(0, 0, r * (0.95 - k * 0.12), t * (2 + k) + k, t * (2 + k) + k + Math.PI * 1.5); c.stroke();
      }
      c.restore();
      c.fillStyle = "#000"; c.beginPath(); c.arc(cx, cy, r * 0.5, 0, PI2); c.fill();
      c.strokeStyle = "rgba(255,220,160,0.9)"; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, r * 0.52, 0, PI2); c.stroke();
      for (let k = 0; k < 5; k++) { // sao xoáy vào tâm
        const u = (t * 0.6 + k / 5) % 1, a = k * 1.3 + u * 5, rr = r * (1.1 - u * 0.7);
        c.fillStyle = `rgba(255,255,255,${1 - u})`; c.beginPath(); c.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.38, 1.6, 0, PI2); c.fill();
      }
    },

    nenHang(camX) { // hang pha lê sao băng: tím thẫm, cụm pha lê hồng tím phát sáng, bụi sao
      const c = this.c, W = this.rong, Hc = this.cao, dat = this.dat, t = this.t;
      const gr = c.createLinearGradient(0, 0, 0, dat);
      gr.addColorStop(0, "#120a30"); gr.addColorStop(1, "#3a1a6a");
      c.fillStyle = gr; c.fillRect(0, 0, W, Hc);
      for (let i = 0; i < 40; i++) { const x = ((bam(i) * W * 1.4 - camX * 0.3) % W + W) % W, y = bam(i + 40) * dat, sang = 0.4 + Math.sin(t * 3 + i) * 0.4; c.fillStyle = `rgba(255,220,255,${sang})`; c.beginPath(); c.arc(x, y, 1.5, 0, PI2); c.fill(); }
      moiBuoc(camX * 0.8, -150, W + 150, 200, (i, x) => {
        const cx = x + 100, cy = dat - 6, nhip = 0.6 + Math.sin(t * 3 + i) * 0.2;
        c.fillStyle = `rgba(255,140,230,${0.2 * nhip})`; c.beginPath(); c.arc(cx, cy - 40, 66, 0, PI2); c.fill();
        [[-20, 50, -0.35], [0, 78, 0], [18, 56, 0.3], [34, 30, 0.55]].forEach(([dx, cao, g], k) => {
          c.save(); c.translate(cx + dx, cy); c.rotate(g);
          c.fillStyle = k % 2 ? "#ffb0f0" : "#e070ff"; c.beginPath(); c.moveTo(-9, 0); c.lineTo(-9, -cao * 0.75); c.lineTo(0, -cao); c.lineTo(9, -cao * 0.75); c.lineTo(9, 0); c.fill();
          c.fillStyle = "rgba(255,255,255,0.45)"; c.beginPath(); c.moveTo(-5, -4); c.lineTo(-5, -cao * 0.7); c.lineTo(0, -cao * 0.9); c.fill();
          c.restore();
        });
      });
      c.fillStyle = "#5a4a8a"; c.fillRect(0, dat, W, Hc - dat);
      c.fillStyle = "#8a7ab8"; c.fillRect(0, dat, W, 8);
    },

    bongLauDai(x, y, k) { // bóng trạm vũ trụ: mái vòm + tấm pin
      const c = this.c;
      c.fillStyle = "#5a5a8a";
      c.fillRect(x - 140 * k, y - 90 * k, 280 * k, 90 * k);
      c.beginPath(); c.arc(x, y - 90 * k, 90 * k, Math.PI, PI2); c.fill();
      c.fillRect(x - 300 * k, y - 160 * k, 130 * k, 50 * k); c.fillRect(x + 170 * k, y - 160 * k, 130 * k, 50 * k);
      c.fillRect(x - 4 * k, y - 230 * k, 8 * k, 60 * k);
    },

    lauDai(g) { // trạm vũ trụ: mái vòm kính, khoang bạc, tấm pin mặt trời, đèn nhấp nháy, cửa trượt khi thắng
      const c = this.c, t = this.t;
      [-1, 1].forEach(s => { // tấm pin
        c.strokeStyle = "#c8c8dc"; c.lineWidth = 4; c.beginPath(); c.moveTo(s * 150, -110); c.lineTo(s * 200, -150); c.stroke();
        c.fillStyle = "#2a4aa8"; c.fillRect(s > 0 ? 180 : -290, -190, 110, 50);
        c.strokeStyle = "#8ae8ff"; c.lineWidth = 1.5; for (let k = 1; k < 5; k++) { const x0 = (s > 0 ? 180 : -290) + k * 22; c.beginPath(); c.moveTo(x0, -190); c.lineTo(x0, -140); c.stroke(); }
        c.beginPath(); c.moveTo(s > 0 ? 180 : -290, -165); c.lineTo(s > 0 ? 290 : -180, -165); c.stroke();
      });
      c.fillStyle = "#d8d8e8"; c.beginPath(); c.roundRect(-170, -120, 340, 120, 20); c.fill();
      c.fillStyle = "#b8b8cc"; c.fillRect(-170, -40, 340, 8);
      c.fillStyle = "rgba(140,230,255,0.45)"; c.beginPath(); c.arc(30, -120, 90, Math.PI, PI2); c.fill();
      c.strokeStyle = "#e8f8ff"; c.lineWidth = 3; c.stroke();
      c.fillStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.ellipse(-10, -170, 14, 26, 0.6, 0, PI2); c.fill();
      c.fillStyle = "#3a3a6a"; c.fillRect(28, -280, 6, 70);
      c.fillStyle = Math.sin(t * 4) > 0 ? "#ff5a5f" : "#ffd23f"; c.beginPath(); c.arc(31, -284, 6, 0, PI2); c.fill();
      [-150, -30, 90, 150].forEach((dx, i) => { c.fillStyle = Math.sin(t * 3 + i * 1.5) > 0 ? "#3fd6c8" : "#1a6a6a"; c.beginPath(); c.arc(dx, -100, 5, 0, PI2); c.fill(); });
      [20, 70, 120].forEach(dx => { c.fillStyle = "#3a3a6a"; c.beginPath(); c.arc(dx, -70, 11, 0, PI2); c.fill(); c.fillStyle = "#8ae8ff"; c.beginPath(); c.arc(dx, -70, 8, 0, PI2); c.fill(); });
      // cửa trượt
      c.fillStyle = "#1a1a3a"; c.beginPath(); c.roundRect(-120, -96, 64, 96, [16, 16, 0, 0]); c.fill();
      const mo = g.trangThai === "thang" ? Math.min(1, g.tKetThuc / 0.8) : 0;
      c.save(); c.beginPath(); c.roundRect(-120, -96, 64, 96, [16, 16, 0, 0]); c.clip();
      c.fillStyle = "#9a9ab8"; c.fillRect(-120 - mo * 32, -96, 32, 96); c.fillRect(-88 + mo * 32, -96, 32, 96);
      c.fillStyle = "#3fd6c8"; c.fillRect(-90 - mo * 32, -60, 2, 30); c.fillRect(-86 + mo * 32, -60, 2, 30);
      c.restore();
      c.fillStyle = "#fff"; c.beginPath(); c.roundRect(-30, -228, 130, 30, 10); c.fill();
      c.strokeStyle = "#3fd6c8"; c.lineWidth = 3; c.stroke();
      c.fillStyle = "#2a2a6a"; c.font = '800 18px "Baloo 2", "Be Vietnam Pro", system-ui, sans-serif'; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("Trạm Vũ Trụ", 35, -212);
    }
  };

  /* ================================================================
     QUÁI / VẬT CẢN VŨ TRỤ
     ================================================================ */
  ST.VE_QUAI = ST.VE_QUAI || {};
  Object.assign(ST.VE_QUAI, {
    daThienThach(w, h, t) { // đá thiên thạch xám có hố nhỏ, khói nóng mỏng
      const c = this.c;
      c.fillStyle = "#9a8aa8"; c.beginPath(); c.moveTo(-w / 2, 0); c.quadraticCurveTo(-w / 2, -h, -w * 0.05, -h); c.quadraticCurveTo(w / 2, -h * 0.95, w / 2, 0); c.fill();
      c.fillStyle = "#7a6a88"; [[-0.2, -0.6, 7], [0.18, -0.4, 5], [-0.05, -0.25, 4], [0.2, -0.75, 3.5]].forEach(([a, b, r]) => { c.beginPath(); c.arc(a * w, b * h, r, 0, PI2); c.fill(); });
      c.fillStyle = "rgba(255,255,255,0.25)"; c.beginPath(); c.ellipse(-w * 0.18, -h * 0.8, 8, 4, -0.4, 0, PI2); c.fill();
      c.fillStyle = "rgba(255,160,80,0.5)"; for (let k = 0; k < 2; k++) { const u = (t * 0.7 + k / 2) % 1; c.beginPath(); c.arc(w * 0.1 + u * 6, -h - u * 18, 3 + u * 4, 0, PI2); c.fill(); }
    },
    chaoAngTen(w, h, t) { // chảo ăng-ten trắng xoay chậm, đèn đỏ đầu
      const c = this.c, quay = Math.sin(t * 0.8) * 0.25;
      c.fillStyle = "#8a8aa8"; c.beginPath(); c.moveTo(-w * 0.3, 0); c.lineTo(-w * 0.12, -h * 0.4); c.lineTo(w * 0.12, -h * 0.4); c.lineTo(w * 0.3, 0); c.fill();
      c.save(); c.translate(0, -h * 0.5); c.rotate(-0.4 + quay);
      c.fillStyle = "#f0f0f8"; c.beginPath(); c.ellipse(0, 0, w * 0.46, h * 0.36, 0, Math.PI * 1.05, Math.PI * 1.95); c.closePath(); c.fill();
      c.strokeStyle = "#b8b8cc"; c.lineWidth = 2; c.stroke();
      c.strokeStyle = "#c8c8dc"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -h * 0.05); c.lineTo(0, -h * 0.42); c.stroke();
      c.fillStyle = Math.sin(t * 4) > 0 ? "#ff5a5f" : "#ffd23f"; c.beginPath(); c.arc(0, -h * 0.44, 3.5, 0, PI2); c.fill();
      c.restore();
    },
    roBotNgu(w, h, t) { // rô-bốt đứng ngủ quên, mắt nhắm, chữ Z bay lên
      const c = this.c;
      c.fillStyle = "#8ab8d8"; c.beginPath(); c.roundRect(-w * 0.3, -h * 0.25, w * 0.2, h * 0.25, 3); c.roundRect(w * 0.1, -h * 0.25, w * 0.2, h * 0.25, 3); c.fill();
      c.fillStyle = "#a8d0ec"; c.beginPath(); c.roundRect(-w * 0.4, -h * 0.62, w * 0.8, h * 0.4, 6); c.fill();
      c.fillStyle = "#ffd23f"; c.beginPath(); c.roundRect(-w * 0.18, -h * 0.52, w * 0.36, h * 0.18, 3); c.fill();
      c.fillStyle = "#e8443a"; c.beginPath(); c.arc(-w * 0.08, -h * 0.43, 3, 0, PI2); c.fill(); c.fillStyle = "#3fd6c8"; c.beginPath(); c.arc(w * 0.08, -h * 0.43, 3, 0, PI2); c.fill();
      c.fillStyle = "#a8d0ec"; c.beginPath(); c.roundRect(-w * 0.32, -h * 0.95, w * 0.64, h * 0.32, 8); c.fill();
      c.strokeStyle = "#2B2640"; c.lineWidth = 2; c.beginPath(); c.arc(-w * 0.14, -h * 0.8, 4, 0.2, Math.PI - 0.2); c.moveTo(w * 0.14 + 4, -h * 0.8); c.arc(w * 0.14, -h * 0.8, 4, 0.2, Math.PI - 0.2); c.stroke();
      c.strokeStyle = "#8ab8d8"; c.beginPath(); c.moveTo(0, -h * 0.95); c.lineTo(0, -h - 6); c.stroke();
      c.fillStyle = "#ff8ab8"; c.beginPath(); c.arc(0, -h - 7, 3, 0, PI2); c.fill();
      c.fillStyle = "#e8e8ff"; c.font = "800 12px sans-serif"; c.textAlign = "left"; c.fillText("z", w * 0.3, -h - 2 - Math.sin(t * 2) * 3); c.font = "800 9px sans-serif"; c.fillText("z", w * 0.42, -h - 12 - Math.sin(t * 2 + 1) * 3);
    },
    hopCungCap(w, h) { // thùng hàng vũ trụ có sọc vàng đen, biểu tượng ngôi sao
      const c = this.c;
      c.fillStyle = "#e8e8f4"; c.beginPath(); c.roundRect(-w / 2, -h, w, h, 5); c.fill();
      c.save(); c.beginPath(); c.rect(-w / 2, -h, w, 8); c.clip(); c.fillStyle = "#ffd23f"; c.fillRect(-w / 2, -h, w, 8); c.fillStyle = "#2B2640"; for (let k = -1; k < w / 8 + 1; k++) { c.beginPath(); c.moveTo(-w / 2 + k * 8, -h + 8); c.lineTo(-w / 2 + k * 8 + 4, -h + 8); c.lineTo(-w / 2 + k * 8 + 8, -h); c.lineTo(-w / 2 + k * 8 + 4, -h); c.fill(); } c.restore();
      c.strokeStyle = "#a8a8c4"; c.lineWidth = 2; c.strokeRect(-w / 2 + 4, -h + 12, w - 8, h - 16);
      this.veSao(0, -h * 0.45, 9, "#3f7fd0", 0);
    },
    tinhTheSao(w, h, t) { // cụm tinh thể xanh ngọc phát sáng
      const c = this.c, nhip = 0.3 + Math.sin(t * 3) * 0.1;
      c.fillStyle = `rgba(120,240,255,${nhip})`; c.beginPath(); c.arc(0, -h * 0.5, w * 0.6, 0, PI2); c.fill();
      [[-w * 0.25, h * 0.6, -0.35], [0, h, 0], [w * 0.25, h * 0.7, 0.35]].forEach(([dx, cao, g]) => {
        c.save(); c.translate(dx, 0); c.rotate(g);
        c.fillStyle = "#3fd6e8"; c.beginPath(); c.moveTo(-8, 0); c.lineTo(-8, -cao * 0.75); c.lineTo(0, -cao); c.lineTo(8, -cao * 0.75); c.lineTo(8, 0); c.fill();
        c.fillStyle = "#c8f8ff"; c.beginPath(); c.moveTo(-4, -2); c.lineTo(-4, -cao * 0.7); c.lineTo(0, -cao * 0.9); c.fill();
        c.restore();
      });
    },
    xeTuHanh(w, h, t) { // xe tự hành sáu bánh, camera trên cột, tấm pin
      const c = this.c;
      c.fillStyle = "#4a4a6a"; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(-w * 0.32 + k * w * 0.32, -8, 8, 0, PI2); c.fill(); c.fillStyle = "#8a8aa8"; c.beginPath(); c.arc(-w * 0.32 + k * w * 0.32, -8, 3, 0, PI2); c.fill(); c.fillStyle = "#4a4a6a"; }
      c.fillStyle = "#e8e8f4"; c.beginPath(); c.roundRect(-w * 0.42, -h * 0.6, w * 0.84, h * 0.32, 4); c.fill();
      c.fillStyle = "#2a4aa8"; c.fillRect(-w * 0.4, -h * 0.68, w * 0.5, 6);
      c.strokeStyle = "#8a8aa8"; c.lineWidth = 3; c.beginPath(); c.moveTo(-w * 0.32, -h * 0.6); c.lineTo(-w * 0.32, -h * 0.92); c.stroke();
      c.fillStyle = "#c8c8dc"; c.beginPath(); c.roundRect(-w * 0.42, -h, w * 0.2, h * 0.14, 3); c.fill();
      c.fillStyle = "#3fd6c8"; c.beginPath(); c.arc(-w * 0.4, -h * 0.93, 3, 0, PI2); c.fill();
      c.fillStyle = Math.sin(t * 4) > 0 ? "#ff5a5f" : "#ffd23f"; c.beginPath(); c.arc(w * 0.34, -h * 0.5, 3, 0, PI2); c.fill();
    },
    tenLuaCao(w, h, t) { // tên lửa lớn trên bệ phóng, quá cao để vượt
      const c = this.c, than = h * 0.85;
      c.fillStyle = "#6a6a88"; c.fillRect(-w / 2, -14, w, 14);
      c.strokeStyle = "#8a8aa8"; c.lineWidth = 3; c.beginPath(); c.moveTo(w * 0.42, -14); c.lineTo(w * 0.42, -h * 0.7); c.moveTo(w * 0.42, -h * 0.4); c.lineTo(w * 0.2, -h * 0.4); c.stroke();
      c.fillStyle = "#e8344e"; c.beginPath(); c.moveTo(-w * 0.2, -14); c.lineTo(-w * 0.42, -6); c.lineTo(-w * 0.2, -h * 0.25); c.moveTo(w * 0.2, -14); c.lineTo(w * 0.36, -6); c.lineTo(w * 0.2, -h * 0.25); c.fill();
      c.fillStyle = "#f0f0f8"; c.beginPath(); c.roundRect(-w * 0.22, -than, w * 0.44, than - 14, [w * 0.2, w * 0.2, 4, 4]); c.fill();
      c.fillStyle = "#e8344e"; c.beginPath(); c.moveTo(-w * 0.2, -than + w * 0.08); c.quadraticCurveTo(0, -h - 6, w * 0.2, -than + w * 0.08); c.fill();
      c.fillStyle = "#3f7fd0"; c.fillRect(-w * 0.22, -h * 0.4, w * 0.44, 8);
      [0.6, 0.48].forEach(k => { c.fillStyle = "#3f7fd0"; c.beginPath(); c.arc(0, -h * k, 8, 0, PI2); c.fill(); c.fillStyle = "#8ae8ff"; c.beginPath(); c.arc(0, -h * k, 5.5, 0, PI2); c.fill(); });
      c.fillStyle = "rgba(220,220,240,0.6)"; for (let k = 0; k < 3; k++) { const u = (t * 0.5 + k / 3) % 1; c.beginPath(); c.arc(-w * 0.3 - u * 10, -8 - u * 6, 5 + u * 6, 0, PI2); c.fill(); }
    },
    cotAngTen(w, h, t) { // cột ăng-ten giàn sắt cao, đèn đỏ nhấp nháy trên đỉnh
      const c = this.c;
      c.strokeStyle = "#a8a8c4"; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-w * 0.4, 0); c.lineTo(-w * 0.08, -h + 20); c.moveTo(w * 0.4, 0); c.lineTo(w * 0.08, -h + 20); c.stroke();
      c.lineWidth = 2; for (let k = 0; k < 8; k++) { const y1 = -k * (h - 20) / 8, y2 = -(k + 1) * (h - 20) / 8, x1 = w * 0.4 - (w * 0.32) * k / 8, x2 = w * 0.4 - (w * 0.32) * (k + 1) / 8; c.beginPath(); c.moveTo(-x1, y1); c.lineTo(x2, y2); c.moveTo(x1, y1); c.lineTo(-x2, y2); c.moveTo(-x2, y2); c.lineTo(x2, y2); c.stroke(); }
      c.lineWidth = 3; c.beginPath(); c.moveTo(0, -h + 20); c.lineTo(0, -h + 4); c.stroke();
      c.fillStyle = "#f0f0f8"; c.beginPath(); c.ellipse(w * 0.1, -h * 0.7, 14, 9, -0.6, Math.PI, PI2); c.fill();
      const sang = Math.sin(t * 4) > 0;
      c.fillStyle = sang ? "rgba(255,90,95,0.35)" : "rgba(0,0,0,0)"; c.beginPath(); c.arc(0, -h + 2, 12, 0, PI2); c.fill();
      c.fillStyle = sang ? "#ff5a5f" : "#8a2a2a"; c.beginPath(); c.arc(0, -h + 2, 5, 0, PI2); c.fill();
    },
    senVuTru(w, h, t, o) { // sên vũ trụ xanh lá trong suốt, ba mắt trên cuống
      const c = this.c, truon = o.dangDi ? Math.sin(t * 5) : 0;
      c.fillStyle = "#7ae84a"; c.beginPath(); c.moveTo(-w / 2, 0); c.quadraticCurveTo(-w * 0.45, -h * 0.75, -w * 0.15, -h * 0.65 - truon * 3); c.quadraticCurveTo(w * 0.3, -h * 0.55, w / 2 + truon * 3, 0); c.fill();
      c.fillStyle = "rgba(255,255,255,0.3)"; c.beginPath(); c.ellipse(-w * 0.1, -h * 0.4, w * 0.2, h * 0.12, -0.2, 0, PI2); c.fill();
      c.fillStyle = "#4fb82a"; [[0.05, -0.25], [0.2, -0.2], [-0.1, -0.15]].forEach(([a, b]) => { c.beginPath(); c.arc(a * w, b * h, 3, 0, PI2); c.fill(); });
      c.strokeStyle = "#7ae84a"; c.lineWidth = 3;
      [[-0.38, -1.0], [-0.26, -1.05], [-0.14, -0.95]].forEach(([a, b], i) => { const lac = Math.sin(t * 4 + i) * 3; c.beginPath(); c.moveTo(-w * 0.26, -h * 0.6); c.lineTo(a * w + lac, b * h); c.stroke(); c.fillStyle = "#fff"; c.beginPath(); c.arc(a * w + lac, b * h, 4.5, 0, PI2); c.fill(); c.fillStyle = "#2B2640"; c.beginPath(); c.arc(a * w + lac - 1, b * h, 2.2, 0, PI2); c.fill(); });
    },
    roBotNho(w, h, t, o) { // rô-bốt tí hon cam đi lạch cạch, ăng-ten lò xo
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 10) : 0;
      c.fillStyle = "#6a6a88"; c.beginPath(); c.roundRect(-w * 0.28 + buoc * 3, -h * 0.25, w * 0.2, h * 0.25, 3); c.roundRect(w * 0.08 - buoc * 3, -h * 0.25, w * 0.2, h * 0.25, 3); c.fill();
      c.fillStyle = "#ff9f1c"; c.beginPath(); c.roundRect(-w * 0.38, -h * 0.6, w * 0.76, h * 0.38, 6); c.fill();
      c.strokeStyle = "#ff9f1c"; c.lineWidth = 4; c.lineCap = "round"; c.beginPath(); c.moveTo(-w * 0.38, -h * 0.5); c.lineTo(-w * 0.52, -h * 0.4 + buoc * 4); c.moveTo(w * 0.38, -h * 0.5); c.lineTo(w * 0.52, -h * 0.4 - buoc * 4); c.stroke();
      c.fillStyle = "#3fd6c8"; c.beginPath(); c.roundRect(-w * 0.18, -h * 0.5, w * 0.36, h * 0.12, 3); c.fill();
      c.fillStyle = "#ffb35c"; c.beginPath(); c.roundRect(-w * 0.3, -h * 0.94, w * 0.6, h * 0.32, 8); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.roundRect(-w * 0.24, -h * 0.86, w * 0.48, h * 0.14, 5); c.fill();
      c.fillStyle = "#7affd0"; c.beginPath(); c.arc(-w * 0.1, -h * 0.79, 3, 0, PI2); c.arc(w * 0.08, -h * 0.79, 3, 0, PI2); c.fill();
      c.strokeStyle = "#8a8aa8"; c.lineWidth = 1.5; c.beginPath(); for (let k = 0; k < 6; k++) c.lineTo((k % 2 ? 3 : -3) + Math.sin(t * 8) * k * 0.3, -h * 0.94 - k * 2); c.stroke();
      c.fillStyle = "#ff5a5f"; c.beginPath(); c.arc(Math.sin(t * 8) * 1.8, -h - 4, 3, 0, PI2); c.fill();
    },
    ngoaiHanhTinh(w, h, t, o) { veNgoaiHanhTinh.call(this, w, h, t, o, false); },
    ngoaiHanhTinhKhongLo(w, h, t, o) { veNgoaiHanhTinh.call(this, w, h, t, o, true); },
    choRobot(w, h, t, o) { // chó rô-bốt xanh bạc, tai ăng-ten, đuôi lò xo vẫy
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 14) : 0;
      c.fillStyle = "#6a6a88"; [[-0.24, 1], [-0.1, -1], [0.14, -1], [0.26, 1]].forEach(([a, s]) => { c.beginPath(); c.roundRect(a * w - 4 + s * buoc * 4, -h * 0.35, 8, h * 0.35, 3); c.fill(); });
      c.fillStyle = "#8ab8e8"; c.beginPath(); c.roundRect(-w * 0.28, -h * 0.65, w * 0.6, h * 0.34, 10); c.fill();
      c.fillStyle = "#c8e0f8"; c.fillRect(-w * 0.1, -h * 0.6, w * 0.3, 4);
      c.strokeStyle = "#a8a8c4"; c.lineWidth = 2; c.beginPath(); for (let k = 0; k < 6; k++) c.lineTo(w * 0.32 + k * 2.5, -h * 0.6 - (k % 2 ? 4 : 0) - Math.sin(t * 15) * k * 0.6); c.stroke();
      c.fillStyle = "#8ab8e8"; c.beginPath(); c.roundRect(-w * 0.5, -h * 0.92, w * 0.32, h * 0.36, 8); c.fill();
      c.fillStyle = "#6a8ab8"; c.beginPath(); c.roundRect(-w * 0.56, -h * 0.72, w * 0.1, h * 0.12, 3); c.fill();
      c.strokeStyle = "#a8a8c4"; c.lineWidth = 2; c.beginPath(); c.moveTo(-w * 0.26, -h * 0.92); c.lineTo(-w * 0.22, -h * 1.02); c.stroke();
      c.fillStyle = "#ff5a5f"; c.beginPath(); c.arc(-w * 0.22, -h * 1.03, 2.5, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.roundRect(-w * 0.46, -h * 0.86, w * 0.2, 8, 3); c.fill();
      c.fillStyle = "#7affd0"; c.fillRect(-w * 0.43, -h * 0.84, 4, 4); c.fillRect(-w * 0.34, -h * 0.84, 4, 4);
    },
    thoMatTrang(w, h, t, o) { // thỏ mặt trăng trắng đội mũ kính nhỏ, nhảy cao
      const c = this.c, nhay = o.dangDi ? Math.abs(Math.sin(t * 7)) * 9 : 0;
      c.save(); c.translate(0, -nhay);
      c.fillStyle = "#f4f0ff"; c.beginPath(); c.ellipse(w * 0.08, -h * 0.3, w * 0.34, h * 0.26, 0, 0, PI2); c.fill();
      c.beginPath(); c.arc(w * 0.4, -h * 0.32, 6, 0, PI2); c.fill();
      [[-0.32, -0.2], [-0.18, 0.2]].forEach(([dx, g]) => { c.save(); c.translate(w * dx, -h * 0.66); c.rotate(g); c.fillStyle = "#f4f0ff"; c.beginPath(); c.ellipse(0, -h * 0.18, 5.5, h * 0.2, 0, 0, PI2); c.fill(); c.fillStyle = "#ffb0c8"; c.beginPath(); c.ellipse(0, -h * 0.18, 2.5, h * 0.13, 0, 0, PI2); c.fill(); c.restore(); });
      c.fillStyle = "#f4f0ff"; c.beginPath(); c.arc(-w * 0.24, -h * 0.52, h * 0.2, 0, PI2); c.fill();
      c.strokeStyle = "rgba(255,255,255,0.9)"; c.fillStyle = "rgba(200,240,255,0.25)"; c.lineWidth = 1.8; c.beginPath(); c.arc(-w * 0.24, -h * 0.52, h * 0.27, 0, PI2); c.fill(); c.stroke();
      this.mat(-w * 0.27, -h * 0.55, 2.6, true);
      c.fillStyle = "#ff7eb6"; c.beginPath(); c.arc(-w * 0.4, -h * 0.48, 2.2, 0, PI2); c.fill();
      c.fillStyle = "#f4f0ff"; c.beginPath(); c.ellipse(-w * 0.08, -3, 8, 4, 0, 0, PI2); c.ellipse(w * 0.22, -3, 8, 4, 0, 0, PI2); c.fill();
      c.restore();
    },
    roBotKhongLo(w, h, t, o) { // rô-bốt khổng lồ xanh lam, mắt màn hình, tay kìm, đi rầm rập
      const c = this.c, buoc = o.dangDi ? Math.sin(t * 5) : 0, lac = Math.sin(t * 2) * 0.02;
      c.save(); c.rotate(lac);
      c.fillStyle = "#4a5a8a"; c.beginPath(); c.roundRect(-w * 0.3 + buoc * 5, -h * 0.3, w * 0.22, h * 0.3, 6); c.roundRect(w * 0.08 - buoc * 5, -h * 0.3, w * 0.22, h * 0.3, 6); c.fill();
      c.fillStyle = "#6a8ac8"; c.beginPath(); c.roundRect(-w * 0.42, -h * 0.7, w * 0.84, h * 0.42, 12); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.roundRect(-w * 0.26, -h * 0.62, w * 0.52, h * 0.16, 6); c.fill();
      for (let k = 0; k < 5; k++) { const cao = (Math.sin(t * 6 + k) + 1) * 0.5 * h * 0.1 + 3; c.fillStyle = "#7affd0"; c.fillRect(-w * 0.22 + k * w * 0.1, -h * 0.48 - cao, w * 0.06, cao); }
      [-1, 1].forEach(s => {
        c.strokeStyle = "#8aa8d8"; c.lineWidth = 10; c.lineCap = "round"; c.beginPath(); c.moveTo(s * w * 0.42, -h * 0.62); c.lineTo(s * w * 0.55, -h * 0.4 + s * buoc * 8); c.stroke();
        c.strokeStyle = "#ffd23f"; c.lineWidth = 4; c.beginPath(); c.moveTo(s * w * 0.55, -h * 0.4 + s * buoc * 8); c.lineTo(s * w * 0.5, -h * 0.3 + s * buoc * 8); c.moveTo(s * w * 0.55, -h * 0.4 + s * buoc * 8); c.lineTo(s * w * 0.62, -h * 0.3 + s * buoc * 8); c.stroke();
      });
      c.fillStyle = "#8aa8d8"; c.beginPath(); c.roundRect(-w * 0.3, -h, w * 0.6, h * 0.28, 10); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.roundRect(-w * 0.24, -h * 0.94, w * 0.48, h * 0.14, 6); c.fill();
      c.fillStyle = "#ff5a5f"; c.beginPath(); c.arc(-w * 0.12, -h * 0.87, 5.5, 0, PI2); c.arc(w * 0.08, -h * 0.87, 5.5, 0, PI2); c.fill();
      c.strokeStyle = "#ff5a5f"; c.lineWidth = 3; c.beginPath(); c.moveTo(-w * 0.22, -h * 0.96); c.lineTo(-w * 0.04, -h * 0.92); c.moveTo(w * 0.18, -h * 0.96); c.lineTo(0, -h * 0.92); c.stroke();
      c.strokeStyle = "#8aa8d8"; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -h); c.lineTo(0, -h - 10); c.stroke();
      c.fillStyle = Math.sin(t * 5) > 0 ? "#ffd23f" : "#ff5a5f"; c.beginPath(); c.arc(0, -h - 12, 4, 0, PI2); c.fill();
      c.restore();
    },
    diaBay(w, h, t) { // đĩa bay bạc có vòm kính, người ngoài hành tinh bé xíu bên trong, đèn quay
      const c = this.c, cy = -h * 0.4, lac = Math.sin(t * 3) * 0.08;
      c.save(); c.translate(0, cy); c.rotate(lac);
      c.fillStyle = "rgba(170,240,255,0.6)"; c.beginPath(); c.arc(0, -h * 0.15, w * 0.22, Math.PI, PI2); c.fill();
      c.fillStyle = "#7ae84a"; c.beginPath(); c.arc(0, -h * 0.22, 6, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-2, -h * 0.24, 1.6, 0, PI2); c.arc(2.5, -h * 0.24, 1.6, 0, PI2); c.fill();
      c.fillStyle = "#c8c8dc"; c.beginPath(); c.ellipse(0, -h * 0.1, w / 2, h * 0.2, 0, 0, PI2); c.fill();
      c.fillStyle = "#9a9ab8"; c.beginPath(); c.ellipse(0, -h * 0.04, w * 0.36, h * 0.1, 0, 0, Math.PI); c.fill();
      for (let k = 0; k < 5; k++) { const on = Math.sin(t * 8 - k) > 0; c.fillStyle = on ? ["#ff5a5f", "#ffd23f", "#3fd6c8", "#ff8ab8", "#7ae84a"][k] : "#6a6a88"; c.beginPath(); c.arc(-w * 0.36 + k * w * 0.18, -h * 0.1, 3, 0, PI2); c.fill(); }
      c.restore();
    },
    saoChoi(w, h, t) { // sao chổi: đầu băng xanh có mặt, đuôi sáng dài
      const c = this.c, cy = -h * 0.5, r = h * 0.3;
      for (let k = 0; k < 5; k++) { const u = k / 5; c.fillStyle = `rgba(150,220,255,${0.5 * (1 - u)})`; c.beginPath(); c.ellipse(r + u * w * 0.5, cy + Math.sin(t * 5 + k) * 2, w * 0.18 * (1 - u * 0.5), r * (1 - u * 0.6), 0, 0, PI2); c.fill(); }
      c.fillStyle = "#e8f8ff"; c.beginPath(); c.arc(-w * 0.1, cy, r, 0, PI2); c.fill();
      c.fillStyle = "#a8d8f8"; c.beginPath(); c.arc(-w * 0.04, cy + 3, r * 0.4, 0, PI2); c.fill();
      this.mat(-w * 0.16, cy - 2, 2.6, true);
    },
    veTinh(w, h, t) { // vệ tinh nhỏ: thân vàng, hai tấm pin xanh, ăng-ten
      const c = this.c, cy = -h * 0.5, xoay = Math.sin(t * 1.5) * 0.15;
      c.save(); c.translate(0, cy); c.rotate(xoay);
      [-1, 1].forEach(s => { c.strokeStyle = "#a8a8c4"; c.lineWidth = 2; c.beginPath(); c.moveTo(s * 9, 0); c.lineTo(s * w * 0.18, 0); c.stroke(); c.fillStyle = "#2a4aa8"; c.fillRect(s > 0 ? w * 0.18 : -w / 2, -h * 0.3, w * 0.32, h * 0.6); c.strokeStyle = "#8ae8ff"; c.lineWidth = 1; for (let k = 1; k < 3; k++) { const x0 = (s > 0 ? w * 0.18 : -w / 2) + k * w * 0.32 / 3; c.beginPath(); c.moveTo(x0, -h * 0.3); c.lineTo(x0, h * 0.3); c.stroke(); } });
      c.fillStyle = "#ffd23f"; c.beginPath(); c.roundRect(-10, -12, 20, 24, 3); c.fill();
      c.strokeStyle = "#e8a800"; c.lineWidth = 1.5; c.strokeRect(-7, -9, 14, 18);
      c.strokeStyle = "#c8c8dc"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -12); c.lineTo(-6, -h * 0.5); c.stroke();
      c.fillStyle = "#ff5a5f"; c.beginPath(); c.arc(-6, -h * 0.5, 2.5, 0, PI2); c.fill();
      c.fillStyle = "#2B2640"; c.beginPath(); c.arc(-3, -2, 2, 0, PI2); c.arc(3, -2, 2, 0, PI2); c.fill();
      c.restore();
    },
    suaVuTru(w, h, t) { // sứa vũ trụ tím phát sáng, xúc tu lấp lánh
      const c = this.c, co = Math.sin(t * 4) * 0.08, r = w / 2;
      c.fillStyle = "rgba(200,140,255,0.2)"; c.beginPath(); c.arc(0, -h * 0.55, r * 1.3, 0, PI2); c.fill();
      c.save(); c.translate(0, -h * 0.55); c.scale(1 + co, 1 - co);
      c.fillStyle = "rgba(190,120,255,0.9)"; c.beginPath(); c.arc(0, 0, r, Math.PI, PI2); c.quadraticCurveTo(r * 0.5, 6, 0, 3); c.quadraticCurveTo(-r * 0.5, 6, -r, 0); c.fill();
      c.fillStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.ellipse(-r * 0.4, -r * 0.5, 5, 8, -0.5, 0, PI2); c.fill();
      this.mat(0, -r * 0.35, 3, true);
      c.restore();
      c.strokeStyle = "rgba(220,170,255,0.9)"; c.lineWidth = 3; c.lineCap = "round";
      for (let k = 0; k < 4; k++) { const x = -r * 0.6 + k * r * 0.4; c.beginPath(); c.moveTo(x, -h * 0.5); c.quadraticCurveTo(x + Math.sin(t * 5 + k) * 6, -h * 0.25, x + Math.sin(t * 5 + k + 1) * 5, 0); c.stroke(); c.fillStyle = "#fff6c0"; c.beginPath(); c.arc(x + Math.sin(t * 5 + k + 1) * 5, 0, 2, 0, PI2); c.fill(); }
    }
  });

  // Người ngoài hành tinh (nhỏ: xanh lá hai ăng-ten / khổng lồ: tím ba mắt)
  function veNgoaiHanhTinh(w, h, t, o, khongLo) {
    const c = this.c, buoc = o.dangDi ? Math.sin(t * (khongLo ? 5 : 10)) : 0, lac = Math.sin(t * 2) * 0.03;
    const mau = khongLo ? "#a85ae8" : "#7ae84a", dam = khongLo ? "#7a3ab8" : "#4fb82a";
    c.save(); c.rotate(lac);
    c.fillStyle = dam; c.beginPath(); c.roundRect(-w * 0.22 + buoc * 4, -h * 0.28, w * 0.14, h * 0.28, 5); c.roundRect(w * 0.08 - buoc * 4, -h * 0.28, w * 0.14, h * 0.28, 5); c.fill();
    c.fillStyle = mau; c.beginPath(); c.ellipse(0, -h * 0.42, w * 0.3, h * 0.2, 0, 0, PI2); c.fill();
    c.strokeStyle = mau; c.lineWidth = khongLo ? 10 : 5; c.lineCap = "round";
    c.beginPath(); c.moveTo(-w * 0.26, -h * 0.48); c.lineTo(-w * 0.48, -h * (khongLo ? 0.7 : 0.55) + buoc * 5); c.moveTo(w * 0.26, -h * 0.48); c.lineTo(w * 0.48, -h * (khongLo ? 0.65 : 0.4) - buoc * 5); c.stroke();
    c.fillStyle = "#fff"; c.beginPath(); c.ellipse(0, -h * 0.4, w * 0.16, h * 0.1, 0, 0, PI2); c.fill();
    c.fillStyle = mau; c.beginPath(); c.ellipse(0, -h * 0.76, w * 0.4, h * 0.2, 0, 0, PI2); c.fill();
    if (khongLo) {
      [-0.2, 0, 0.2].forEach((k, i) => { const r = i === 1 ? 9 : 7; c.fillStyle = "#fff"; c.beginPath(); c.arc(k * w, -h * 0.8 - (i === 1 ? 6 : 0), r, 0, PI2); c.fill(); c.fillStyle = "#2B2640"; c.beginPath(); c.arc(k * w - 2, -h * 0.8 - (i === 1 ? 6 : 0), r * 0.5, 0, PI2); c.fill(); });
      c.strokeStyle = "#2B2640"; c.lineWidth = 2.5; c.beginPath(); c.arc(0, -h * 0.66, 9, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      c.fillStyle = "#ffd23f"; [-0.3, 0.3].forEach(k => { c.beginPath(); c.moveTo(k * w - 6, -h * 0.9); c.lineTo(k * w * 1.2, -h - 4); c.lineTo(k * w + 6, -h * 0.9); c.fill(); });
    } else {
      this.mat(0, -h * 0.76, 4.2, true);
      c.strokeStyle = mau; c.lineWidth = 2; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * w * 0.12, -h * 0.92); c.lineTo(s * w * 0.2, -h + 2 + Math.sin(t * 6 + s) * 2); c.stroke(); c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(s * w * 0.2, -h + 2 + Math.sin(t * 6 + s) * 2, 3, 0, PI2); c.fill(); });
    }
    c.restore();
  }
})(typeof window !== "undefined" ? window : globalThis);
