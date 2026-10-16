/* ================================================================
   FILE: san_tu/st_ve_be.js
   CHỨC NĂNG: VẼ BÉ (nhân vật chính) cho game Giải Cứu Mèo Con (Săn Từ).
              Bé gái 11 tuổi: tỉ lệ người lớn hơn (đầu nhỏ, chân tay dài), tóc đuôi ngựa đung đưa,
              áo phông tím, quần short jean, giày thể thao. Thân người dựng bằng KHUNG XƯƠNG
              (hông, vai, cổ, đầu, đầu gối, khuỷu tay, bàn chân, bàn tay) nên chuyển động mềm:
              chạy có gập gối + vung tay, nhảy co chân, đáp đất nhún, bắn phép duỗi tay.
              Tư thế theo đường đua (ST.CHU_DE_VE[mã].phuongTien.tuThe):
                "chay" (mặc định) | "truot" (ván trượt) | "cuoi" (cưỡi khủng long)
                | "boi" (bơi dưới nước) | "bay" (đeo cánh bay) | "ngoi" (ngồi trong tàu vũ trụ).
              Phương tiện / đồ của đường đua vẽ bằng phuongTien.sau(tt) và .truoc(tt);
              tt.k là khung xương (tọa độ so với chân bé trên mặt đất) để gắn mũ, kính, cánh...
              CHỈ là hình: hộp va chạm và vật lý nhảy / bắn không đổi.
   BƯỚC: TC_00G (người dùng yêu cầu 16/10/2026: bé 11 tuổi, bơi / bay / ngồi tàu, hình tinh tế hơn)
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST = goc.ST || {};
  const { PI2 } = ST.VE_CHUNG;

  const MAU = {
    da: "#f7cba8", daToi: "#e9a986", toc: "#4e2c1a", tocSang: "#7a4528", buoc: "#ff5c8a",
    ao: "#7c5cff", aoToi: "#5a3ed8", quan: "#3a5d93", quanToi: "#2b4672",
    giay: "#ffffff", deGiay: "#ff5c8a", tat: "#ffffff", vien: "#2B2640", dua: "#3a2a4a"
  };
  const CO_BE = 1.06; // phóng hình bé một chút cho rõ trên điện thoại (không đổi hộp va chạm)
  const DAI = { dui: 17, ong: 17, canh: 12, cang: 11, than: 25, co: 4, dau: 12 }; // độ dài các đoạn (đơn vị game)

  // đoạn "chỉ xuống" xoay góc g (chiều kim đồng hồ trên màn hình): g > 0 đưa về phía sau (bên trái)
  const diem = (p, g, d) => ({ x: p.x - Math.sin(g) * d, y: p.y + Math.cos(g) * d });
  const xoay = (v, g) => ({ x: v.x * Math.cos(g) - v.y * Math.sin(g), y: v.x * Math.sin(g) + v.y * Math.cos(g) });
  // Tìm khớp giữa (đầu gối / khuỷu tay) để đoạn l1 + l2 nối từ a tới b; huong = 1: khớp nhô về phía trước
  function ik(a, b, l1, l2, huong) {
    let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001;
    const dMax = l1 + l2 - 0.3;
    if (d > dMax) { dx *= dMax / d; dy *= dMax / d; d = dMax; b = { x: a.x + dx, y: a.y + dy }; }
    const g0 = Math.atan2(dy, dx), A = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
    const g = g0 - huong * A;
    return { khop: { x: a.x + Math.cos(g) * l1, y: a.y + Math.sin(g) * l1 }, cuoi: b };
  }
  const chanGoc = (hong, a1, a2) => { const goi = diem(hong, a1, DAI.dui); return { goi, ban: diem(goi, a1 + a2, DAI.ong) }; };
  const tayGoc = (vai, b1, b2) => { const khuyu = diem(vai, b1, DAI.canh); return { khuyu, ban: diem(khuyu, b1 + b2, DAI.cang) }; };
  const chanIK = (hong, dich) => { const r = ik(hong, dich, DAI.dui, DAI.ong, 1); return { goi: r.khop, ban: r.cuoi }; };
  const tayIK = (vai, dich) => { const r = ik(vai, dich, DAI.canh, DAI.cang, -1); return { khuyu: r.khop, ban: r.cuoi }; };

  /* Dựng khung xương theo trạng thái. Trả về:
     { than (góc nghiêng thân), hong, vai, co, dau {x, y, r, goc}, lung (điểm giữa lưng),
       chan [sau, truoc] {goi, ban}, tay [sau, truoc] {khuyu, ban}, anChan, vui, choang, bayToc } */
  function dungKhung(s) {
    const { kieu, che, pha, t, nhay, uNhay, thang, phep, nang } = s;
    const n = nang || 0;
    let than = 0, hong = { x: 0, y: -34 - n }, chan, tay, anChan = false, gocDau = null, bayToc = 0.3, tuDat = false;
    const choang = che === "khung" || che === "gapNan";
    if (kieu === "boi" || kieu === "bay") {
      const lenCao = nhay ? 1 : 0;
      than = kieu === "boi" ? 1.15 - 0.45 * lenCao : 1.22 - 0.4 * lenCao;
      const nhip = Math.sin(t * 3) * 2.5;
      hong = { x: -12, y: (kieu === "boi" ? -30 : -36) - n + nhip };
      if (kieu === "boi") {
        const da = t * (nhay ? 14 : 9); // đạp chân vịt
        chan = [chanGoc(hong, than + 0.22 * Math.sin(da), 0.2 + 0.25 * Math.max(0, Math.sin(da))), chanGoc(hong, than + 0.22 * Math.sin(da + Math.PI), 0.2 + 0.25 * Math.max(0, Math.sin(da + Math.PI)))];
      } else {
        const lac = Math.sin(t * 3.2) * 0.06;
        chan = [chanGoc(hong, than - 0.04 + lac, 0.32), chanGoc(hong, than + 0.08 + lac, 0.18)];
      }
      gocDau = than - (kieu === "boi" ? 0.75 : 0.9);
      bayToc = 1;
    } else if (kieu === "ngoi") {
      than = 0.06 + (nhay ? -0.05 : 0);
      hong = { x: -3, y: -8 - n + Math.sin(t * 3) * 2 }; // tàu lơ lửng nhấp nhô (tàu vẽ theo hông bé)
      anChan = true;
      chan = [chanGoc(hong, -1.4, 0.9), chanGoc(hong, -1.3, 0.9)];
    } else if (kieu === "cuoi") {
      const nay = s.dangChay ? Math.abs(Math.sin(pha * 1.2)) * 1.8 : 0;
      than = 0.1 + (nhay ? -0.1 : 0);
      hong = { x: -3, y: -35 - n - nay };
      chan = [chanIK(hong, { x: -5, y: -18 - n - nay * 0.5 }), chanIK(hong, { x: 5, y: -17 - n - nay * 0.5 })];
    } else if (kieu === "truot") {
      const cui = nhay ? 5 : 2 + Math.sin(t * 2.2) * 0.8, gVan = nhay ? -0.12 : (s.dangChay ? Math.sin(t * 9) * 0.04 : 0);
      than = 0.16;
      hong = { x: -1, y: -35 - n + cui };
      const banS = xoay({ x: -9, y: -7 }, gVan), banT = xoay({ x: 9, y: -7 }, gVan);
      chan = [chanIK(hong, banS), chanIK(hong, banT)];
      bayToc = 0.8;
    } else if (nhay || (thang && s.trenKhong)) {
      // nhảy: bật lên duỗi chân -> co gối giữa không trung -> duỗi ra đón đất
      const co = uNhay < 0.15 ? uNhay / 0.15 : uNhay > 0.78 ? Math.max(0, 1 - (uNhay - 0.78) / 0.22) : 1;
      than = 0.08;
      chan = [chanGoc(hong, -0.25 * co + 0.15, 0.3 + 1.2 * co), chanGoc(hong, -1.0 * co, 0.2 + 1.5 * co)];
      bayToc = 0.9;
    } else if (che === "roi") {
      chan = [chanGoc(hong, 0.3, 0.6), chanGoc(hong, -0.4, 0.7)];
    } else if (choang) {
      than = -0.22;
      chan = [chanGoc(hong, 0.25, 0.1), chanGoc(hong, -0.3, 0.15)];
      tuDat = true;
    } else if (s.dangChay) {
      than = 0.13;
      chan = [0, 1].map(i => { const p = pha + i * Math.PI; return chanGoc(hong, -0.58 * Math.sin(p), 0.18 + 1.05 * Math.max(0, Math.cos(p))); });
      tuDat = true;
      bayToc = 0.7;
    } else {
      chan = [chanGoc(hong, 0.07, 0.04), chanGoc(hong, -0.07, 0.04)];
      tuDat = true;
    }
    // chạy / đứng: hạ hông cho bàn chân thấp nhất chạm đất -> tự có nhịp nhún lên xuống tự nhiên
    if (tuDat) {
      const thap = Math.max(chan[0].ban.y, chan[1].ban.y) + 2.5; // 2.5: nửa đế giày
      const dy = -n - thap;
      hong.y += dy; chan.forEach(ch => { ch.goi.y += dy; ch.ban.y += dy; });
    }
    const len = { x: Math.sin(than), y: -Math.cos(than) };
    const vai = { x: hong.x + len.x * DAI.than, y: hong.y + len.y * DAI.than };
    const co = { x: vai.x + len.x * DAI.co, y: vai.y + len.y * DAI.co };
    if (gocDau === null) gocDau = than * 0.5 + (choang ? -0.15 : 0);
    const dau = { x: co.x + Math.sin(gocDau) * DAI.dau + 1, y: co.y - Math.cos(gocDau) * DAI.dau, r: DAI.dau, goc: gocDau };
    // tay
    if (kieu === "boi") {
      const sai = t * (nhay ? 6 : 4);
      tay = [tayGoc(vai, than + Math.PI + sai, -0.25), tayGoc(vai, than + Math.PI + sai + Math.PI, -0.25)];
    } else if (kieu === "bay") {
      tay = [tayGoc(vai, than + 0.25, -0.05), tayGoc(vai, than + Math.PI - 0.12, 0.05)]; // tay sau xuôi theo người, tay trước vươn tới
    } else if (kieu === "ngoi") {
      const lac = s.dangChay ? Math.sin(t * 8) * 0.8 : 0;
      tay = [tayIK(vai, { x: vai.x + 8, y: vai.y + 19 + lac }), tayIK(vai, { x: vai.x + 15, y: vai.y + 17 - lac })];
    } else if (kieu === "cuoi") {
      tay = [tayIK(vai, { x: vai.x + 12, y: vai.y + 13 }), tayIK(vai, { x: vai.x + 17, y: vai.y + 11 })];
    } else if (kieu === "truot") {
      const lac = Math.sin(t * 2.5) * 0.15;
      tay = [tayGoc(vai, 1.15 - lac, -0.35), tayGoc(vai, -1.05 + lac, -0.45)];
    } else if (thang) {
      const v = Math.sin(t * 9) * 0.15;
      tay = [tayGoc(vai, 2.75 + v, -0.2), tayGoc(vai, -2.75 - v, 0.2)];
    } else if (nhay) {
      tay = [tayGoc(vai, 0.9, -0.6), tayGoc(vai, -2.3, -0.35)];
    } else if (che === "roi") {
      tay = [tayGoc(vai, 2.8, -0.2), tayGoc(vai, -2.8, 0.2)];
    } else if (choang) {
      tay = [tayGoc(vai, 1.9, -0.5), tayGoc(vai, -1.9, -0.5)];
    } else if (s.dangChay) {
      tay = [0, 1].map(i => tayGoc(vai, 0.62 * Math.sin(pha + i * Math.PI), -1.25 - 0.25 * Math.max(0, Math.sin(pha + (1 - i) * Math.PI))));
    } else {
      tay = [tayGoc(vai, 0.14, -0.3), tayGoc(vai, -0.12, -0.35)];
    }
    if (phep) tay[1] = tayGoc(vai, -1.5 + (kieu === "boi" || kieu === "bay" ? than - 0.3 : 0), -0.05); // bắn phép: duỗi thẳng tay cầm đũa về phía trước
    // hướng mũi bàn chân: đứng / chạy thì vuông góc ống chân; bơi / bay thì duỗi thẳng theo ống chân
    chan.forEach(ch => {
      const dx = ch.ban.x - ch.goi.x, dy = ch.ban.y - ch.goi.y;
      ch.gocBan = kieu === "boi" || kieu === "bay" ? Math.atan2(dy, dx) : Math.atan2(-dx, dy);
    });
    const vuong = { x: Math.cos(than), y: Math.sin(than) };
    const lung = { x: (hong.x + vai.x) / 2 - vuong.x * 7, y: (hong.y + vai.y) / 2 - vuong.y * 7 };
    return { kieu, than, hong, vai, co, dau, lung, chan, tay, anChan, choang, bayToc, vui: nhay || thang || phep };
  }

  /* ---------- các phần cơ thể ---------- */
  function net(c, a, b, rong, mau) { c.strokeStyle = mau; c.lineWidth = rong; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
  const giua = (a, b, u) => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
  function veChan(c, k, ch, toi) {
    const da = toi ? MAU.daToi : MAU.da;
    net(c, k.hong, ch.goi, 7, da);
    net(c, ch.goi, ch.ban, 6, da);
    net(c, k.hong, giua(k.hong, ch.goi, 0.5), 8.6, toi ? MAU.quanToi : MAU.quan); // ống quần short
    net(c, giua(ch.goi, ch.ban, 0.72), ch.ban, 6.4, MAU.tat);                       // tất
    // giày thể thao: hướng về phía mũi chân (vuông góc với ống chân)
    c.save(); c.translate(ch.ban.x, ch.ban.y); c.rotate(ch.gocBan);
    c.fillStyle = toi ? "#e6e1f2" : MAU.giay; c.strokeStyle = "#b9b0d6"; c.lineWidth = 1;
    c.beginPath(); c.roundRect(-4.5, -3, 14, 6.5, [3, 4.5, 2, 2]); c.fill(); c.stroke();
    c.fillStyle = MAU.deGiay; c.fillRect(-4.5, 2.2, 14, 2);
    c.restore();
  }
  function veTay(c, k, ty, toi) {
    const da = toi ? MAU.daToi : MAU.da;
    net(c, k.vai, ty.khuyu, 5.4, da);
    net(c, ty.khuyu, ty.ban, 4.8, da);
    net(c, k.vai, giua(k.vai, ty.khuyu, 0.5), 7.6, toi ? MAU.aoToi : MAU.ao); // tay áo
    c.fillStyle = da; c.beginPath(); c.arc(ty.ban.x, ty.ban.y, 3, 0, PI2); c.fill();
  }
  function veThan(c, k) {
    const v = { x: Math.cos(k.than), y: Math.sin(k.than) }, h = k.hong, s = k.vai;
    // quần short: một mảng ở hông
    c.fillStyle = MAU.quan; c.beginPath(); c.arc(h.x, h.y, 7.6, 0, PI2); c.fill();
    // áo phông: hình thang bo tròn từ hông lên vai
    c.fillStyle = MAU.ao; c.strokeStyle = MAU.ao; c.lineJoin = "round"; c.lineWidth = 5;
    const lenTren = 0.12, a = { x: h.x - v.x * 6.5 + (s.x - h.x) * 0.12, y: h.y - v.y * 6.5 + (s.y - h.y) * 0.12 };
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(h.x + v.x * 6.5 + (s.x - h.x) * lenTren, h.y + v.y * 6.5 + (s.y - h.y) * lenTren);
    c.lineTo(s.x + v.x * 6, s.y + v.y * 6);
    c.lineTo(s.x - v.x * 6, s.y - v.y * 6);
    c.closePath(); c.fill(); c.stroke();
    // gấu áo + ngôi sao trên ngực
    c.strokeStyle = MAU.aoToi; c.lineWidth = 2.2; c.beginPath();
    c.moveTo(h.x - v.x * 8 + (s.x - h.x) * 0.1, h.y - v.y * 8 + (s.y - h.y) * 0.1); c.lineTo(h.x + v.x * 8 + (s.x - h.x) * 0.1, h.y + v.y * 8 + (s.y - h.y) * 0.1); c.stroke();
    const ng = giua(h, s, 0.62);
    this.veSao(ng.x + v.x * 1.5, ng.y + v.y * 1.5, 4.2, "#ffd23f", k.than);
    // cổ
    net(c, s, k.co, 5, MAU.da);
  }
  function veToc(c, k, s) {
    // đuôi ngựa sau gáy: đung đưa theo nhịp chạy, bay về sau khi lao nhanh
    const d = k.dau, t = s.t;
    c.save(); c.translate(d.x, d.y); c.rotate(d.goc);
    const lac = Math.sin(s.dangChay ? s.pha * 2 : t * 2.4) * (s.dangChay ? 3 : 1.5), bay = k.bayToc;
    c.fillStyle = MAU.toc;
    c.beginPath();
    c.moveTo(-8, -9);
    c.quadraticCurveTo(-16 - 6 * bay, -12 + 4 * (1 - bay), -20 - 8 * bay, 2 - 10 * bay + lac);
    c.quadraticCurveTo(-21 - 6 * bay, 8 - 6 * bay + lac, -16 - 4 * bay, 9 - 6 * bay + lac * 0.6);
    c.quadraticCurveTo(-13, 2, -8, -1);
    c.closePath(); c.fill();
    c.restore();
  }
  function veDau(c, k, s) {
    const d = k.dau, r = d.r, t = s.t;
    c.save(); c.translate(d.x, d.y); c.rotate(d.goc);
    // tóc phía sau đầu
    c.fillStyle = MAU.toc; c.beginPath(); c.ellipse(-3, -1, r + 0.6, r + 1, 0, 0, PI2); c.fill();
    // mặt + tai
    c.fillStyle = MAU.da; c.beginPath(); c.ellipse(1.2, 0.5, r - 0.6, r, 0, 0, PI2); c.fill();
    c.beginPath(); c.moveTo(r - 1.5, 3); c.quadraticCurveTo(r + 1.4, 7, r - 3.5, 10); c.lineTo(3, 11); c.fill(); // cằm thon
    c.fillStyle = MAU.daToi; c.beginPath(); c.ellipse(-3.5, 1.5, 2.6, 3.4, 0, 0, PI2); c.fill(); // tai
    // tóc trên đầu + mái lệch
    c.fillStyle = MAU.toc;
    c.beginPath(); c.arc(0, -1, r + 0.8, Math.PI * 0.95, Math.PI * 1.93); c.quadraticCurveTo(r + 1, -4, r - 2, -2); c.quadraticCurveTo(5, -7, 1, -4); c.quadraticCurveTo(-2, -2, -5, 2); c.closePath(); c.fill();
    c.fillStyle = MAU.tocSang; c.beginPath(); c.ellipse(-2, -9.5, 5, 1.6, -0.25, 0, PI2); c.fill(); // ánh tóc
    c.fillStyle = MAU.buoc; c.beginPath(); c.arc(-8.5, -7.5, 2.3, 0, PI2); c.fill(); // dây buộc tóc
    // mặt (nghiêng 3/4 nhìn về phía trước)
    const ex1 = 4.6, ex2 = 10, ey = 1.2;
    c.fillStyle = c.strokeStyle = MAU.vien;
    if (k.choang || s.che === "roi") {
      c.lineWidth = 1.5;
      [ex1, ex2].forEach(x => { c.beginPath(); c.arc(x, ey, 2.4, t * 10, t * 10 + Math.PI * 1.6); c.stroke(); });
      c.beginPath(); c.ellipse(8, 7.2, 1.6, 2, 0, 0, PI2); c.stroke();
    } else {
      const chop = (t % 3.4) < 0.12; // chớp mắt
      if (chop) { c.lineWidth = 1.5; [ex1, ex2].forEach(x => { c.beginPath(); c.moveTo(x - 1.8, ey); c.lineTo(x + 1.8, ey); c.stroke(); }); }
      else {
        c.beginPath(); c.ellipse(ex1, ey, 1.75, 2.4, 0, 0, PI2); c.ellipse(ex2, ey, 1.5, 2.3, 0, 0, PI2); c.fill();
        c.fillStyle = "#fff"; c.beginPath(); c.arc(ex1 + 0.6, ey - 0.9, 0.7, 0, PI2); c.arc(ex2 + 0.5, ey - 0.9, 0.6, 0, PI2); c.fill();
      }
      c.lineWidth = 1.2; c.lineCap = "round";
      c.beginPath(); c.moveTo(ex1 - 2.2, ey - 4.2); c.quadraticCurveTo(ex1, ey - 5.2, ex1 + 2, ey - 4.4); c.stroke(); // lông mày
      c.beginPath(); c.moveTo(ex2 - 1.6, ey - 4.4); c.quadraticCurveTo(ex2 + 0.3, ey - 5.2, ex2 + 2, ey - 4.2); c.stroke();
      c.strokeStyle = MAU.daToi; c.lineWidth = 1.2; c.beginPath(); c.moveTo(r - 0.4, ey + 1.2); c.lineTo(r + 0.8, ey + 3.6); c.lineTo(r - 1, ey + 3.9); c.stroke(); // mũi
      c.strokeStyle = MAU.vien;
      if (k.vui) { c.fillStyle = "#c2185b"; c.beginPath(); c.moveTo(5.5, 6.6); c.quadraticCurveTo(8, 10.2, 10.6, 6.4); c.closePath(); c.fill(); }
      else { c.lineWidth = 1.3; c.beginPath(); c.moveTo(5.6, 7); c.quadraticCurveTo(8, 8.6, 10.4, 6.6); c.stroke(); }
    }
    c.fillStyle = "rgba(255,120,140,0.22)"; c.beginPath(); c.ellipse(3, 5, 2.6, 1.6, 0, 0, PI2); c.fill(); // má hồng nhẹ
    c.restore();
  }
  function veDua(c, k, s) {
    // đũa phép trong tay trước: khi bắn thì chĩa theo cánh tay, bình thường dựng hơi ngả về trước
    const ty = k.tay[1], dx = ty.ban.x - ty.khuyu.x, dy = ty.ban.y - ty.khuyu.y, d = Math.hypot(dx, dy) || 1;
    const huong = s.phep ? { x: dx / d, y: dy / d } : { x: Math.sin(0.35 + k.than * 0.5), y: -Math.cos(0.35 + k.than * 0.5) };
    const dau = { x: ty.ban.x + huong.x * 17, y: ty.ban.y + huong.y * 17 };
    net(c, { x: ty.ban.x - huong.x * 3, y: ty.ban.y - huong.y * 3 }, dau, 2.6, MAU.dua);
    if (s.phep) { c.fillStyle = "rgba(255,240,120,0.45)"; c.beginPath(); c.arc(dau.x, dau.y, 10, 0, PI2); c.fill(); }
    this.veSao(dau.x, dau.y, s.phep ? 7.5 : 4.6, s.phep ? "#fff27a" : "#ffd23f", s.t * 3);
  }

  ST.BoVe.prototype.veBe = function (be, g, camX) {
    const c = this.c;
    let x = be.x - camX, y = this.dat - be.y;
    const t = this.t, che = be.che;
    const thang = !!(g && g.trangThai === "thang");
    if (thang) { x = this.viTriBeThang(g) - camX; y = this.dat - (g.tKetThuc > 1.2 ? Math.abs(Math.sin(g.tKetThuc * 5)) * 22 : 0); }
    const pt = this.cd && this.cd.phuongTien;
    const kieu = (pt && pt.tuThe) || "chay";
    const noi = kieu === "boi" || kieu === "bay" || kieu === "ngoi"; // bơi / bay / ngồi tàu: lơ lửng, bóng nhạt hơn
    // bóng dưới chân (không vẽ khi đang rơi hố)
    if (che !== "roi") {
      c.fillStyle = noi ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.15)"; const r = (noi ? 24 : 17) - Math.min(10, be.y / 12);
      c.beginPath(); c.ellipse(x, this.dat + 2, r, 4, 0, 0, PI2); c.fill();
    }
    c.save();
    // bất tử sau hồi sinh: nhấp nháy rõ ràng
    if (be.batTu > 0 && !thang) c.globalAlpha = Math.sin(t * 28) > 0 ? 1 : 0.3;
    c.translate(x, y);
    let sx = 1, sy = 1, nghieng = 0;
    if (che === "chay" && be.tTiepDat < 0.12 && !noi) { const u = 1 - be.tTiepDat / 0.12; sx = 1 + 0.08 * u; sy = 1 - 0.12 * u; } // đáp đất: nhún
    if (che === "gapNan") { nghieng = -0.4 * Math.min(1, be.tChe * 4); }
    if (che === "roi") { const k = Math.max(0.3, 1 - be.tChe * 0.4); sx = k; sy = k; nghieng = be.tChe * 4; }
    if (g && g.trangThai === "thua" && che === "roi") { const k = Math.max(0.2, 1 - (g.tKetThuc + 1) * 0.4); sx = sy = k; nghieng = (g.tKetThuc + 1) * 4; c.translate(0, g.tKetThuc * 120); }
    c.rotate(nghieng); c.scale(sx * CO_BE, sy * CO_BE);
    const pha = (be.x || 0) * 0.075; // nhịp bước theo quãng đường -> mượt ở mọi tốc độ khung hình
    const nhay = che === "nhay";
    const s = {
      kieu, che, pha, t, thang, nhay,
      uNhay: be.nhay && be.nhay.T ? Math.min(1, be.nhay.t / be.nhay.T) : 0.5,
      trenKhong: thang && y < this.dat - 2,
      dangChay: che === "chay" && !thang,
      phep: be.tPhep < 0.35,
      nang: (pt && pt.nang) || 0
    };
    const k = dungKhung(s);
    // tt: thông tin cho phương tiện / đồ của đường đua (giữ tên cũ: che, pha, nhay, dangChay, thang, t)
    const tt = { che, pha, nhay: nhay || s.trenKhong, dangChay: s.dangChay, thang, t, phep: s.phep, k };
    c.lineCap = "round"; c.lineJoin = "round";
    if (pt && pt.sau) { c.save(); pt.sau.call(this, tt); c.restore(); }
    c.lineCap = "round"; c.lineJoin = "round";
    veTay(c, k, k.tay[0], true);
    if (!k.anChan) veChan(c, k, k.chan[0], true);
    veToc(c, k, s);
    veThan.call(this, c, k);
    if (!k.anChan) veChan(c, k, k.chan[1], false);
    veDau(c, k, s);
    veTay(c, k, k.tay[1], false);
    veDua.call(this, c, k, s);
    if (pt && pt.truoc) { c.save(); c.lineCap = "round"; c.lineJoin = "round"; pt.truoc.call(this, tt); c.restore(); }
    c.restore();
    const dinh = y + (k.dau.y - k.dau.r) * CO_BE;
    // chóng mặt: sao xoay quanh đầu
    if (che === "khung") for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; this.veSao(x + k.dau.x * CO_BE + Math.cos(a) * 16, dinh - 8 + Math.sin(a) * 5, 5, "#ffd23f", a); }
    // vừa hồi sinh: lấp lánh
    if (be.batTu > (ST.CAU_HINH.thoiGianBatTu - 0.5) && !thang) for (let i = 0; i < 4; i++) { const a = t * 6 + i * 1.6; this.veSao(x + Math.cos(a) * 26, y - 44 + Math.sin(a) * 32, 5, "#fff", a); }
  };

  // Công cụ cho file đồ theo đường đua: vẽ trong hệ tọa độ của ĐẦU bé (gốc = tâm đầu, đã xoay theo đầu, mặt nhìn sang phải)
  ST.VE_CHUNG.theoDau = function (c, k, fn) { const d = k.dau; c.save(); c.translate(d.x, d.y); c.rotate(d.goc); fn(d.r); c.restore(); };
  // ... trong hệ tọa độ THÂN bé (gốc = cổ, trục -y là hướng lên dọc thân)
  ST.VE_CHUNG.theoThan = function (c, k, fn) { c.save(); c.translate(k.co.x, k.co.y); c.rotate(k.than); fn(); c.restore(); };
  // ... tại bàn chân (gốc = bàn chân, trục +x là mũi giày)
  ST.VE_CHUNG.theoBanChan = function (c, ch, fn) { c.save(); c.translate(ch.ban.x, ch.ban.y); c.rotate(ch.gocBan); fn(); c.restore(); };
  // điểm trong hệ đầu -> tọa độ chung (để vẽ bong bóng / tia sáng không xoay theo đầu)
  ST.VE_CHUNG.diemDau = function (k, p) { const d = k.dau, v = xoay(p, d.goc); return { x: d.x + v.x, y: d.y + v.y }; };
  ST.dungKhungBe = dungKhung; // cho kiểm thử
})(typeof window !== "undefined" ? window : globalThis);
