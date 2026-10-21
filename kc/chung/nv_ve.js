/* ================================================================
   FILE: chung/nv_ve.js
   CHỨC NĂNG: BỘ VẼ NHÂN VẬT DÙNG CHUNG TOÀN APP (người dùng yêu cầu 21/10/2026:
              "hình vua dùng chung cho toàn app, ví dụ Giải Cứu Mèo Con").
              Vẽ nhân vật của bé (Thủ lĩnh / Quốc vương trong Đấu Trường Tri Thức) và
              nông dân lên canvas 2D bằng KHUNG XƯƠNG (hông, vai, cổ, đầu, đầu gối,
              khuỷu tay, bàn chân, bàn tay) nên chuyển động mềm.
              - Ngoại hình (hồ sơ, lưu chung theo tài khoản ở chung/nv_ho_so.js):
                { chungLoai: "nhan"|"quy"|"tien", gioi: "nam"|"nu",
                  kieuToc, mauToc, mauDa, mauAo (chỉ số trong bảng bên dưới) }
              - Tùy chọn khi vẽ: { x, y (chân nhân vật trên mặt đất, điểm ảnh), co (phóng),
                huong (1 nhìn phải, -1 nhìn trái), t (giây), lech (lệch pha để nhiều nhân vật
                không thở cùng nhịp), tuThe, thoiKy: "do_da"|"do_dong"|"do_sat"|"de_quoc",
                vaiTro: "thu_linh"|"nong_dan", cam: "gay"|"riu"|"" (mặc định theo vai trò),
                u (0..1, tiến độ cú nhảy; bỏ trống thì tự lặp) }
              - Tư thế: "dung" (đứng thở) | "di" | "vay" (vẫy tay) | "chat" (vung rìu)
                | "chay" | "nhay" (chạy, nhảy: để game khác như Giải Cứu Mèo Con dùng).
              - Trả về khung xương (tọa độ so với chân nhân vật, đơn vị nhân vật, chưa
                nhân co / huong) để game gắn thêm đồ; khung.trung = true đúng lúc rìu chạm.
              Không đụng DOM, không đọc bộ nhớ: chạy được cả trong node (kiểm thử).
   BƯỚC: TC_D01
   NGÀY: 21/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const PI = Math.PI, PI2 = PI * 2;

  // ---------------- BẢNG LỰA CHỌN (thứ tự cố định: hồ sơ lưu chỉ số) ----------------
  const BANG = {
    da: ["#f7d4b6", "#edbb92", "#d29767", "#a06c47"],
    toc: ["#2a1b14", "#5b3520", "#8e5a2c", "#dba543", "#b8402c", "#e4e1ee", "#5b3fa8"],
    ao: ["#c0703a", "#3f7fbf", "#4f9a4a", "#b8473d", "#7a52c7", "#d9a62e"]
  };
  const TEN_MAU = {
    da: ["Sáng", "Hồng hào", "Bánh mật", "Nâu"],
    toc: ["Đen", "Nâu", "Hạt dẻ", "Vàng", "Đỏ", "Bạc", "Tím"],
    ao: ["Da bò", "Xanh trời", "Xanh lá", "Đỏ", "Tím", "Vàng nghệ"]
  };
  const KIEU_TOC = {
    nam: [{ ma: "ngan", ten: "Tóc ngắn" }, { ma: "dung", ten: "Tóc dựng" }, { ma: "buoc", ten: "Búi tó" }],
    nu: [{ ma: "duoi_ngua", ten: "Đuôi ngựa" }, { ma: "dai", ten: "Tóc dài" }, { ma: "tet", ten: "Tóc tết" }]
  };
  const CHUNG_LOAI = ["nhan", "quy", "tien"];
  const THOI_KY = ["do_da", "do_dong", "do_sat", "de_quoc"];
  const TU_THE = ["dung", "di", "vay", "chat", "chay", "nhay"];

  // Màu riêng của từng chủng loại (đồ phụ, quần, áo choàng, gậy)
  const TOC_LOAI = {
    nhan: { quan: "#6b4a2f", long: "#efe0bf", khan: "#b5442f", choang: "#b8473d", choangTrong: "#e7b04a", giay: "#7a4f2c", gay: "#8a5a2c", mat: "#2b2640" },
    quy: { quan: "#3a2c45", long: "#5d4a70", khan: "#2a1f33", choang: "#6a2a86", choangTrong: "#c23a5a", giay: "#2f2538", gay: "#3a2c45", mat: "#8a4a00", sung: "#d9c7e8", sungToi: "#4b2f6b" },
    tien: { quan: "#3f6b45", long: "#86cf73", khan: "#5fb04a", choang: "#2a9d8f", choangTrong: "#bfeadf", giay: "#5b7a3a", gay: "#7a5a32", mat: "#1d6f55" }
  };
  // Nông dân: áo cố định theo chủng loại (không theo lựa chọn của bé)
  const AO_NONG_DAN = { nhan: "#a87a4a", quy: "#5c5470", tien: "#7aa35a" };

  const VIEN = "#2b2640";
  const DAI = { dui: 15, ong: 15, than: 21, co: 3, dau: 11, canh: 11, cang: 10 };

  // ---------------- TIỆN ÍCH ----------------
  const kep = (v, a, b) => Math.max(a, Math.min(b, v));
  const tron = (a, b, k) => a + (b - a) * k;
  const muot = k => k * k * (3 - 2 * k);
  function toi(hex, k) { // làm tối (k < 0) hoặc sáng (k > 0) một màu #rrggbb
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
    return "#" + [r, g, b].map(v => Math.round(kep(v, 0, 255)).toString(16).padStart(2, "0")).join("");
  }
  // đoạn "chỉ xuống" xoay góc g: g > 0 đưa về phía sau (bên trái khi nhìn phải)
  const diem = (p, g, d) => ({ x: p.x - Math.sin(g) * d, y: p.y + Math.cos(g) * d });
  function ik(a, b, l1, l2, huong) { // tìm khớp giữa để 2 đoạn l1 + l2 nối a tới b
    let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001;
    const dMax = l1 + l2 - 0.3;
    if (d > dMax) { dx *= dMax / d; dy *= dMax / d; d = dMax; b = { x: a.x + dx, y: a.y + dy }; }
    const g0 = Math.atan2(dy, dx), A = Math.acos(kep((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const g = g0 - huong * A;
    return { khop: { x: a.x + Math.cos(g) * l1, y: a.y + Math.sin(g) * l1 }, cuoi: b };
  }
  const chanIK = (hong, dich) => { const r = ik(hong, dich, DAI.dui, DAI.ong, 1); return { goi: r.khop, ban: r.cuoi }; };
  const tayGoc = (vai, b1, b2) => { const khuyu = diem(vai, b1, DAI.canh); return { khuyu, ban: diem(khuyu, b1 + b2, DAI.cang) }; };
  const tayIK = (vai, dich) => { const r = ik(vai, dich, DAI.canh, DAI.cang, -1); return { khuyu: r.khop, ban: r.cuoi }; };

  // ---------------- HỒ SƠ NGOẠI HÌNH ----------------
  function chuanHoa(h) {
    h = h || {};
    const gioi = h.gioi === "nu" ? "nu" : "nam";
    const so = (v, n, md) => { v = Math.floor(Number(v)); return isFinite(v) && v >= 0 && v < n ? v : md; };
    return {
      chungLoai: CHUNG_LOAI.indexOf(h.chungLoai) >= 0 ? h.chungLoai : "nhan",
      gioi,
      kieuToc: so(h.kieuToc, KIEU_TOC[gioi].length, 0),
      mauToc: so(h.mauToc, BANG.toc.length, 1),
      mauDa: so(h.mauDa, BANG.da.length, 0),
      mauAo: so(h.mauAo, BANG.ao.length, 0)
    };
  }
  // Nông dân số i của một chủng loại: ngoại hình khác nhau một chút, cố định theo i
  function hoSoNongDan(chungLoai, i) {
    i = Math.abs(Math.floor(i || 0));
    const gioi = i % 3 === 1 ? "nu" : "nam";
    return chuanHoa({ chungLoai, gioi, kieuToc: (i * 2) % 3, mauToc: [1, 0, 2, 3][i % 4], mauDa: [1, 0, 2, 3][(i + 1) % 4], mauAo: 0 });
  }

  // ---------------- KHUNG XƯƠNG THEO TƯ THẾ ----------------
  function dungKhung(tuThe, t, tc) {
    let than = 0.02, hong = { x: 0, y: -29.4 }, nang = 0, chan, tay, gocDau = 0;
    const rieng = {};
    const caGay = tc.cam === "gay";
    if (tuThe === "di") {
      const ph = t * 6.5;
      hong = { x: 0, y: -29.6 + 0.9 * Math.abs(Math.sin(ph)) - 0.4 };
      chan = [0, 1].map(i => { const p = ph + i * PI; return chanIK(hong, { x: 6.5 * Math.sin(p), y: -3 * Math.max(0, Math.cos(p)) }); });
      than = 0.06;
      rieng.vung = ph;
    } else if (tuThe === "chay") {
      const ph = t * 11;
      hong = { x: 0, y: -28.2 + 1.6 * Math.abs(Math.cos(ph)) - 1.4 };
      chan = [0, 1].map(i => { const p = ph + i * PI; return chanIK(hong, { x: 9 * Math.sin(p) + 1, y: -7 * Math.max(0, Math.cos(p)) }); });
      than = 0.2;
      gocDau = -0.08;
    } else if (tuThe === "nhay") {
      const u = tc.u != null ? kep(tc.u, 0, 1) : (t % 1.1) / 1.1;
      const co = Math.sin(PI * u);
      nang = co * 16;
      hong = { x: 0, y: -29.4 - nang + 2 * co };
      chan = [chanIK(hong, { x: -4 - 3 * co, y: -nang - 6 * co }), chanIK(hong, { x: 3 + 2 * co, y: -nang - 8 * co })];
      than = 0.08 + 0.1 * co;
      rieng.u = u;
    } else if (tuThe === "chat") {
      // Vung rìu: sẵn sàng -> giơ cao sau đầu -> bổ xuống trước mặt -> giật lại -> sẵn sàng
      const T = 1.25, u = ((t % T) + T) % T / T;
      const KF = [ // u, tay (so với vai), góc rìu (0 = phía trước, -PI/2 = lên trời), nghiêng thân, nhún
        [0, 8, 13, -0.6, 0.05, 0], [0.48, -1, -12, -2.35, -0.14, 0], [0.6, 12, 11, 0.55, 0.28, 1.6],
        [0.72, 11, 9, 0.35, 0.24, 1.2], [1, 8, 13, -0.6, 0.05, 0]
      ];
      let a = KF[0], b = KF[1];
      for (let i = 0; i < KF.length - 1; i++) if (u >= KF[i][0] && u <= KF[i + 1][0]) { a = KF[i]; b = KF[i + 1]; break; }
      const k = (b[0] === 0.6) ? Math.pow((u - a[0]) / (b[0] - a[0]), 2.2) : muot((u - a[0]) / (b[0] - a[0] || 1));
      const L = v => tron(a[v], b[v], k);
      than = L(4);
      hong = { x: -1, y: -29.4 + L(5) };
      chan = [chanIK(hong, { x: -5.5, y: 0 }), chanIK(hong, { x: 5, y: 0 })];
      rieng.tayDich = { x: L(1), y: L(2) };
      rieng.gocRiu = L(3);
      rieng.trung = u >= 0.6 && u < 0.67;
      gocDau = 0.1 * L(4);
    } else { // "dung", "vay": đứng thở
      const tho = Math.sin(t * 2.4);
      hong = { x: 0, y: -29.5 + 0.22 * tho };
      chan = [chanIK(hong, { x: -3.6, y: 0 }), chanIK(hong, { x: 3.8, y: 0 })];
      rieng.tho = tho;
      gocDau = 0.03 * Math.sin(t * 1.1);
    }

    // Thân và vai
    const L = DAI.than + (rieng.tho || 0) * 0.35;
    const len = { x: Math.sin(than), y: -Math.cos(than) }, truoc = { x: Math.cos(than), y: Math.sin(than) };
    const vai = { x: hong.x + len.x * L, y: hong.y + len.y * L };
    const coTren = { x: vai.x + len.x * DAI.co, y: vai.y + len.y * DAI.co };
    const gd = than + gocDau;
    const dau = { x: coTren.x + Math.sin(gd) * 9.5, y: coTren.y - Math.cos(gd) * 9.5, goc: gd };

    // Tay (cần vai)
    if (tuThe === "chat") {
      const d = rieng.tayDich, dich = { x: vai.x + d.x, y: vai.y + d.y };
      const dirX = Math.cos(rieng.gocRiu), dirY = Math.sin(rieng.gocRiu);
      tay = [tayIK(vai, { x: dich.x - dirX * 3.2, y: dich.y - dirY * 3.2 }), tayIK(vai, dich)];
      rieng.riu = { x: dich.x, y: dich.y, goc: rieng.gocRiu };
    } else if (tuThe === "vay") {
      tay = [tayGoc(vai, 0.12 + 0.03 * rieng.tho, -0.15), tayGoc(vai, -2.0, -0.55 + 0.5 * Math.sin(t * 9))];
    } else if (tuThe === "dung") {
      tay = [tayGoc(vai, 0.13 + 0.03 * rieng.tho, -0.18), caGay ? tayGoc(vai, -0.32, -1.0) : tayGoc(vai, -0.05 - 0.03 * rieng.tho, -0.2)];
    } else {
      const goc0 = tuThe === "di" ? [0.42 * Math.sin(rieng.vung), 0.42 * Math.sin(rieng.vung + PI)] : null;
      if (tuThe === "di") {
        tay = goc0.map((g, i) => (i === 1 && caGay) ? tayGoc(vai, -0.3 + 0.08 * g, -1.0) : tayGoc(vai, g, -0.3 - 0.15 * Math.max(0, -g)));
      } else if (tuThe === "chay") {
        const ph = t * 11;
        tay = [0, 1].map(i => tayGoc(vai, 0.9 * Math.sin(ph + i * PI), -1.25));
      } else if (tuThe === "nhay") {
        const co = Math.sin(PI * rieng.u);
        tay = [tayGoc(vai, -0.4 - 1.5 * co, -0.5), tayGoc(vai, -0.7 - 1.8 * co, -0.4)];
      }
    }
    return { than, len, truoc, hong, vai, coTren, dau, chan, tay, nang, riu: rieng.riu || null, trung: !!rieng.trung, tho: rieng.tho || 0 };
  }

  // ---------------- VẼ TỪNG PHẦN ----------------
  function net(c, pts, w, mau, vien) { // đường dày có viền (tay, chân)
    c.lineCap = "round"; c.lineJoin = "round";
    const duong = () => { c.beginPath(); c.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y); };
    if (vien !== false) { duong(); c.strokeStyle = VIEN; c.lineWidth = w + 1.5; c.stroke(); }
    duong(); c.strokeStyle = mau; c.lineWidth = w; c.stroke();
  }
  function tronDay(c, x, y, r, mau, vien) {
    c.beginPath(); c.arc(x, y, r, 0, PI2); c.fillStyle = mau; c.fill();
    if (vien) { c.lineWidth = 0.9; c.strokeStyle = VIEN; c.stroke(); }
  }
  function elip(c, x, y, rx, ry, g, mau, vien) {
    c.beginPath(); c.ellipse(x, y, rx, ry, g || 0, 0, PI2); c.fillStyle = mau; c.fill();
    if (vien) { c.lineWidth = 0.9; c.strokeStyle = VIEN; c.stroke(); }
  }

  function veChan(c, ch, quan, giay, sau) {
    net(c, [ch.hong, ch.goi, ch.ban], 6.2, sau ? toi(quan, -0.18) : quan);
    elip(c, ch.ban.x + 2.2, ch.ban.y - 1.4, 4.1, 2.3, 0, sau ? toi(giay, -0.2) : giay, true);
  }
  function veTay(c, ty, vai, da, ao, sau) {
    const mauDa = sau ? toi(da, -0.14) : da, mauAo = sau ? toi(ao, -0.18) : ao;
    net(c, [vai, ty.khuyu, ty.ban], 4.6, mauDa);
    const giua = { x: tron(vai.x, ty.khuyu.x, 0.75), y: tron(vai.y, ty.khuyu.y, 0.75) };
    net(c, [vai, giua], 5.8, mauAo, false);
    tronDay(c, ty.ban.x, ty.ban.y, 2.5, mauDa, true);
  }

  function veThan(c, k, ao, ky, gioi, toc, vaiTro) {
    const L = Math.hypot(k.vai.x - k.hong.x, k.vai.y - k.hong.y);
    const P = (a, b) => ({ x: k.hong.x + k.len.x * a + k.truoc.x * b, y: k.hong.y + k.len.y * a + k.truoc.y * b });
    const vat = gioi === "nu" ? 9 : 6.5; // vạt áo dưới hông
    const vaiS = P(L - 1, -5.6), vaiT = P(L - 1, 5), nguc = P(L - 7, 6.4), eoT = P(4, 5.3), vatT = P(-vat, 7.6 + (gioi === "nu" ? 1.2 : 0)),
      vatS = P(-vat, -7.6 - (gioi === "nu" ? 1.2 : 0)), eoS = P(4, -5.6), lung = P(L - 7, -6.2), dinh = P(L + 2.2, -0.3);
    c.beginPath();
    c.moveTo(vaiS.x, vaiS.y);
    c.quadraticCurveTo(dinh.x, dinh.y, vaiT.x, vaiT.y);
    c.quadraticCurveTo(nguc.x + k.truoc.x, nguc.y + k.truoc.y, eoT.x, eoT.y);
    c.lineTo(vatT.x, vatT.y);
    c.lineTo(vatS.x, vatS.y);
    c.lineTo(eoS.x, eoS.y);
    c.quadraticCurveTo(lung.x, lung.y, vaiS.x, vaiS.y);
    c.closePath();
    c.fillStyle = ao; c.fill();
    c.lineWidth = 1; c.strokeStyle = VIEN; c.stroke();
    // bóng phía lưng
    c.beginPath(); c.moveTo(vaiS.x, vaiS.y); c.lineTo(P(L - 2, -2.5).x, P(L - 2, -2.5).y); c.lineTo(P(-vat + 1, -4).x, P(-vat + 1, -4).y); c.lineTo(vatS.x, vatS.y); c.lineTo(eoS.x, eoS.y); c.closePath();
    c.fillStyle = "rgba(0,0,0,.13)"; c.fill();
    // viền lông / răng cưa ở vạt áo (Đồ đá), viền vàng (Đế quốc)
    const nViet = 6;
    if (ky === "do_da" || vaiTro === "nong_dan") {
      c.beginPath(); c.moveTo(vatT.x, vatT.y);
      for (let i = 1; i <= nViet; i++) {
        const b = 7.6 - (15.2 * (i - 0.5)) / nViet, b2 = 7.6 - (15.2 * i) / nViet;
        const p1 = P(-vat - 2.2, b), p2 = P(-vat, b2);
        c.lineTo(p1.x, p1.y); c.lineTo(p2.x, p2.y);
      }
      c.lineTo(P(-vat + 1.8, -7.6).x, P(-vat + 1.8, -7.6).y); c.lineTo(P(-vat + 1.8, 7.6).x, P(-vat + 1.8, 7.6).y); c.closePath();
      c.fillStyle = vaiTro === "nong_dan" ? toi(ao, -0.25) : toc.long; c.fill();
    } else {
      net(c, [P(-vat + 0.6, 7.4), P(-vat + 0.6, -7.4)], 1.6, ky === "de_quoc" ? "#ffd04a" : ky === "do_sat" ? "#9aa5b8" : "#d0913f", false);
    }
    // thắt lưng
    const thatL = ky === "do_da" || vaiTro === "nong_dan" ? "#6b4424" : ky === "do_dong" ? "#c98a3a" : ky === "do_sat" ? "#59606e" : "#e7b23a";
    net(c, [P(1.2, 5.5), P(1.2, -5.8)], 2, thatL, false);
    if (vaiTro !== "nong_dan" && ky !== "do_da") { const kh = P(1.2, 3.2); tronDay(c, kh.x, kh.y, 1.7, ky === "do_sat" ? "#c3cad6" : "#ffd04a", true); }
    // giáp ngực (Đồ sắt) / áo vai lông (Đế quốc)
    if (vaiTro !== "nong_dan" && ky === "do_sat") {
      c.beginPath(); const a1 = P(L - 3, -4), a2 = P(L - 3, 5), a3 = P(L - 11, 5.6), a4 = P(L - 11, -4.6);
      c.moveTo(a1.x, a1.y); c.lineTo(a2.x, a2.y); c.lineTo(a3.x, a3.y); c.lineTo(a4.x, a4.y); c.closePath();
      c.fillStyle = "rgba(143,155,176,.85)"; c.fill(); c.lineWidth = 0.8; c.strokeStyle = VIEN; c.stroke();
    }
  }

  function veChoang(c, k, toc, ky, t, sau) { // áo choàng (Thủ lĩnh từ Đồ đồng); sau = phần sau lưng
    const dai = ky === "do_dong" ? 22 : ky === "do_sat" ? 30 : 36;
    const bay = Math.sin(t * 2.6) * 1.6 + 2;
    const goc = { x: k.vai.x - k.truoc.x * 5, y: k.vai.y - k.truoc.y * 5 + 1 };
    const day = { x: k.hong.x - k.truoc.x * (9 + bay) - k.len.x * (dai - 21), y: Math.min(-1.5, k.vai.y + dai) };
    if (sau) {
      c.beginPath();
      c.moveTo(goc.x + 1, goc.y - 1.5);
      c.quadraticCurveTo(goc.x - 9 - bay, (goc.y + day.y) / 2, day.x, day.y);
      c.lineTo(day.x + 12, day.y + 0.5);
      c.quadraticCurveTo(k.hong.x, (goc.y + day.y) / 2, goc.x + 5, goc.y);
      c.closePath();
      c.fillStyle = toc.choang; c.fill(); c.lineWidth = 1; c.strokeStyle = VIEN; c.stroke();
      c.beginPath(); c.moveTo(day.x, day.y); c.lineTo(day.x + 12, day.y + 0.5); c.lineWidth = 2; c.strokeStyle = ky === "de_quoc" ? "#ffd04a" : toc.choangTrong; c.stroke();
    } else if (ky === "de_quoc") { // cổ áo lông trắng chấm đen
      for (let i = 0; i < 5; i++) {
        const p = { x: k.vai.x - k.truoc.x * (4 - i * 2) + k.len.x * 0.5, y: k.vai.y - k.truoc.y * (4 - i * 2) - 0.6 + (i % 2) * 0.8 };
        tronDay(c, p.x, p.y, 2.4, "#fbf6ee", false);
      }
      tronDay(c, k.vai.x - k.truoc.x * 1, k.vai.y + 0.5, 0.6, "#2b2640", false);
    } else { // khóa áo choàng trên vai
      tronDay(c, k.vai.x + k.truoc.x * 2, k.vai.y + 1, 1.6, ky === "do_sat" ? "#c3cad6" : "#d9a13f", true);
    }
  }

  function veGay(c, ty, toc, chungLoai, ky, t) { // gậy thủ lĩnh cầm đứng ở tay trước
    const x = ty.ban.x + 0.4, tren = ty.ban.y - 27, duoi = Math.min(ty.ban.y + 24, -0.5);
    const vang = ky === "de_quoc";
    net(c, [{ x, y: duoi }, { x, y: tren }], 2.2, vang ? "#e7b23a" : toc.gay);
    const sang = 0.6 + 0.4 * Math.sin(t * 3);
    if (vang) {
      tronDay(c, x, tren - 2.5, 3.2, "#ffd04a", true);
      tronDay(c, x, tren - 2.5, 1.6, "#e2384d", false);
    } else if (chungLoai === "quy") {
      c.save(); c.globalAlpha = 0.35 * sang; tronDay(c, x, tren - 3, 6, "#c77dff", false); c.restore();
      tronDay(c, x, tren - 3, 3.2, "#9b4dff", true);
      tronDay(c, x - 1, tren - 4, 1, "#f0ddff", false);
    } else if (chungLoai === "tien") {
      c.save(); c.globalAlpha = 0.35 * sang; tronDay(c, x, tren - 3, 6, "#b6ffcf", false); c.restore();
      c.beginPath(); c.moveTo(x, tren - 8); c.lineTo(x + 2.8, tren - 3); c.lineTo(x, tren + 1); c.lineTo(x - 2.8, tren - 3); c.closePath();
      c.fillStyle = "#6fe3a4"; c.fill(); c.lineWidth = 0.9; c.strokeStyle = VIEN; c.stroke();
      elip(c, x - 3.5, tren + 1, 2.6, 1.2, -0.5, "#5fb04a", false);
    } else { // Nhân tộc: đầu gậy đá buộc lông chim
      elip(c, x, tren - 2, 3, 2.4, 0, "#9aa0a8", true);
      c.save(); c.translate(x + 1.5, tren - 1); c.rotate(0.5 + 0.1 * Math.sin(t * 2));
      elip(c, 4, 0, 4.2, 1.3, 0, toc.khan, false); c.restore();
      net(c, [{ x: x - 2.4, y: tren + 1 }, { x: x + 2.4, y: tren + 1 }], 1.2, "#6b4424", false);
    }
  }

  function veRiu(c, r, ky) { // rìu: cán từ tay theo góc r.goc, lưỡi ở đầu cán
    const dx = Math.cos(r.goc), dy = Math.sin(r.goc);
    const a = { x: r.x - dx * 4, y: r.y - dy * 4 }, b = { x: r.x + dx * 17, y: r.y + dy * 17 };
    net(c, [a, b], 2.1, "#8a5a2c");
    c.save(); c.translate(b.x, b.y); c.rotate(r.goc);
    c.beginPath(); // lưỡi rìu nhô về phía "dưới" của cán (phía bổ xuống)
    c.moveTo(-3.5, -1.2); c.lineTo(1.5, -1.6); c.quadraticCurveTo(4.5, 3.5, 2.5, 7.5); c.lineTo(-4.5, 6.5); c.quadraticCurveTo(-3, 2.5, -3.5, -1.2); c.closePath();
    c.fillStyle = ky === "do_da" ? "#a3a7ad" : ky === "do_dong" ? "#c98a3a" : "#b9c2cf"; c.fill();
    c.lineWidth = 0.9; c.strokeStyle = VIEN; c.stroke();
    c.beginPath(); c.moveTo(2.5, 7.4); c.quadraticCurveTo(4.3, 3.5, 1.6, -1.4); c.lineWidth = 1; c.strokeStyle = "rgba(255,255,255,.7)"; c.stroke();
    if (ky === "do_da") net(c, [{ x: -1, y: -2.2 }, { x: -1, y: 1.4 }], 1.3, "#6b4424", false); // dây buộc đá
    c.restore();
  }

  // --- tóc ---
  function veTocSau(c, d, h, mau, t) { // phần tóc nằm SAU đầu (vẽ trước đầu)
    const kieu = KIEU_TOC[h.gioi][h.kieuToc].ma;
    c.fillStyle = mau; c.strokeStyle = VIEN; c.lineWidth = 0.9;
    if (kieu === "duoi_ngua") {
      const lac = Math.sin(t * 3.1) * 2.2;
      c.beginPath();
      c.moveTo(d.x - 7, d.y - 7);
      c.quadraticCurveTo(d.x - 20, d.y - 6 + lac * 0.3, d.x - 18 + lac, d.y + 12);
      c.quadraticCurveTo(d.x - 15 + lac * 0.6, d.y + 7, d.x - 9, d.y - 1);
      c.closePath(); c.fill(); c.stroke();
      tronDay(c, d.x - 9.2, d.y - 5, 1.8, "#ff5c8a", true);
    } else if (kieu === "dai") {
      c.beginPath();
      c.moveTo(d.x - 9, d.y - 6);
      c.quadraticCurveTo(d.x - 14, d.y + 6, d.x - 11 + Math.sin(t * 2) * 0.6, d.y + 19);
      c.lineTo(d.x - 1, d.y + 17);
      c.quadraticCurveTo(d.x - 2, d.y + 8, d.x + 1, d.y + 3);
      c.closePath(); c.fill(); c.stroke();
    } else if (kieu === "tet") {
      for (let i = 0; i < 5; i++) {
        const lac = Math.sin(t * 2.6 - i * 0.5) * 0.5 * i;
        elip(c, d.x - 9.5 - i * 0.8 + lac, d.y + 4 + i * 3.4, 2.4, 2, 0.5, i % 2 ? toi(mau, -0.12) : mau, true);
      }
      tronDay(c, d.x - 13.7 + Math.sin(t * 2.6 - 2.5) * 2.5, d.y + 21, 1.5, "#ff5c8a", true);
    } else if (kieu === "buoc") {
      tronDay(c, d.x - 5, d.y - 11.5, 4.2, mau, true);
      net(c, [{ x: d.x - 7.5, y: d.y - 9.5 }, { x: d.x - 3, y: d.y - 8.5 }], 1.3, "#b5442f", false);
    }
  }
  function veTocTruoc(c, d, h, mau) { // mái tóc trên đầu + mái trước trán
    const R = DAI.dau, kieu = KIEU_TOC[h.gioi][h.kieuToc].ma;
    c.beginPath();
    c.arc(d.x, d.y, R + 1.2, PI * 0.66, PI * 1.92);
    // mép mái tóc trước trán (răng cưa nhẹ)
    c.lineTo(d.x + 9, d.y - 3.5);
    c.lineTo(d.x + 6.5, d.y - 5.4);
    c.lineTo(d.x + 5, d.y - 2.8);
    c.lineTo(d.x + 2.5, d.y - 5.6);
    c.lineTo(d.x + 0.5, d.y - 3.4);
    c.lineTo(d.x - 2.5, d.y - 5);
    c.quadraticCurveTo(d.x - 5.5, d.y - 1, d.x - 4.6, d.y + 4.6);
    c.lineTo(d.x - 6.5, d.y + 9.5);
    c.closePath();
    c.fillStyle = mau; c.fill(); c.lineWidth = 0.9; c.strokeStyle = VIEN; c.stroke();
    if (kieu === "dung") { // tóc dựng: các chỏm nhọn
      c.beginPath();
      [[-8, -6, -13, -14], [-3, -10, -4, -19], [3, -10, 5, -18], [8, -6, 12, -12]].forEach(([x1, y1, x2, y2]) => {
        c.moveTo(d.x + x1 - 3, d.y + y1 + 1); c.lineTo(d.x + x2, d.y + y2); c.lineTo(d.x + x1 + 3, d.y + y1 - 0.5);
      });
      c.fillStyle = mau; c.fill(); c.stroke();
    } else if (kieu === "ngan") { // tóc ngắn: một lọn vểnh trên đỉnh
      c.beginPath();
      c.moveTo(d.x - 3, d.y - 11.6); c.quadraticCurveTo(d.x - 1, d.y - 17.5, d.x + 5.5, d.y - 15.5);
      c.quadraticCurveTo(d.x + 2, d.y - 14.2, d.x + 2.5, d.y - 11.4); c.closePath();
      c.fillStyle = mau; c.fill(); c.stroke();
    }
    // ánh tóc
    c.beginPath(); c.arc(d.x - 1, d.y - 1, R - 2.5, PI * 1.25, PI * 1.6); c.lineWidth = 1.4; c.strokeStyle = "rgba(255,255,255,.28)"; c.stroke();
  }

  function veMat(c, d, h, toc, t, lech) { // mặt nhìn nghiêng 3/4 sang phải
    const chop = ((t + lech * 1.7) % 3.7) < 0.13;
    const mo = chop ? 0.15 : 1;
    const mauMat = toc.mat;
    [[3.2, 1.55], [8.1, 1.2]].forEach(([dx, rx]) => {
      elip(c, d.x + dx, d.y + 1.2, rx + 0.6, 2.5 * mo, 0, "#ffffff", false);
      elip(c, d.x + dx + 0.3, d.y + 1.3, rx, 2.2 * mo, 0, mauMat, false);
      if (!chop) { tronDay(c, d.x + dx + 0.3, d.y + 1.4, rx * 0.55, "#1a1626", false); tronDay(c, d.x + dx + 0.8, d.y + 0.2, 0.55, "#ffffff", false); }
    });
    // lông mày (hơi xếch: trông quyết đoán, không trẻ con quá)
    c.lineCap = "round"; c.strokeStyle = toi(BANG.toc[h.mauToc], -0.25); c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(d.x + 1.4, d.y - 2.2); c.lineTo(d.x + 4.8, d.y - 2.9); c.moveTo(d.x + 7, d.y - 2.9); c.lineTo(d.x + 9.4, d.y - 2.2); c.stroke();
    if (h.gioi === "nu") { c.beginPath(); c.moveTo(d.x + 9.4, d.y - 0.6); c.lineTo(d.x + 10.4, d.y - 1.6); c.lineWidth = 0.7; c.strokeStyle = VIEN; c.stroke(); }
    // mũi, má, miệng
    c.beginPath(); c.moveTo(d.x + 10.6, d.y + 2.6); c.lineTo(d.x + 11.3, d.y + 4.3); c.lineTo(d.x + 10.4, d.y + 4.6); c.lineWidth = 0.7; c.strokeStyle = toi(BANG.da[h.mauDa], -0.3); c.stroke();
    c.save(); c.globalAlpha = 0.32; elip(c, d.x + 7.4, d.y + 5, 2, 1.2, 0, "#ff7a8a", false); c.restore();
    c.beginPath(); c.moveTo(d.x + 5.6, d.y + 6.6); c.quadraticCurveTo(d.x + 7.6, d.y + 8.1, d.x + 9.2, d.y + 6.6); c.lineWidth = 0.9; c.strokeStyle = "#7a3b3b"; c.stroke();
  }

  function veTai(c, d, h, da) {
    if (h.chungLoai === "tien") { // tai nhọn của Tiên tộc, chỉa ra sau
      c.beginPath(); c.moveTo(d.x - 3, d.y + 0.5); c.lineTo(d.x - 12.5, d.y - 5.5); c.quadraticCurveTo(d.x - 6.5, d.y + 2.5, d.x - 2.5, d.y + 4.8); c.closePath();
      c.fillStyle = da; c.fill(); c.lineWidth = 0.9; c.strokeStyle = VIEN; c.stroke();
      c.beginPath(); c.moveTo(d.x - 4, d.y + 1.4); c.lineTo(d.x - 9.5, d.y - 2.6); c.lineWidth = 0.8; c.strokeStyle = toi(da, -0.2); c.stroke();
    } else {
      elip(c, d.x - 2.2, d.y + 2.4, 2.4, 3, 0, da, true);
      elip(c, d.x - 2, d.y + 2.6, 1.1, 1.6, 0, toi(da, -0.18), false);
    }
  }

  function veSung(c, d, toc) { // sừng nhỏ của Quỷ tộc: ngầu, không đáng sợ
    [[2.5, -9.6, 0.72], [-3.5, -10.2, 0.8]].forEach(([dx, dy, k]) => {
      c.save(); c.translate(d.x + dx, d.y + dy); c.scale(k, k);
      c.beginPath(); c.moveTo(-2.4, 1); c.quadraticCurveTo(-2.4, -5, -6.5, -8.5); c.quadraticCurveTo(1, -6.5, 2.6, 0.4); c.closePath();
      const g = c.createLinearGradient(0, 1, -6, -8); g.addColorStop(0, toc.sung); g.addColorStop(1, toc.sungToi);
      c.fillStyle = g; c.fill(); c.lineWidth = 0.9; c.strokeStyle = VIEN; c.stroke();
      c.restore();
    });
  }

  function veMu(c, d, h, toc, ky, vaiTro, t) { // đồ đội đầu theo thời kỳ / vai trò
    const R = DAI.dau;
    if (vaiTro === "nong_dan") {
      if (h.chungLoai === "nhan") { // nón lá
        c.beginPath(); c.moveTo(d.x - 15, d.y - 4.5); c.lineTo(d.x + 1, d.y - 19); c.lineTo(d.x + 16, d.y - 4); c.quadraticCurveTo(d.x, d.y - 2, d.x - 15, d.y - 4.5); c.closePath();
        c.fillStyle = "#e9cf8a"; c.fill(); c.lineWidth = 0.9; c.strokeStyle = VIEN; c.stroke();
        c.beginPath(); c.moveTo(d.x - 8, d.y - 7.5); c.lineTo(d.x + 9, d.y - 7.4); c.moveTo(d.x - 3.5, d.y - 12.5); c.lineTo(d.x + 5, d.y - 12.4); c.lineWidth = 0.7; c.strokeStyle = "#c9a95a"; c.stroke();
      } else if (h.chungLoai === "tien") { // mũ lá
        c.beginPath(); c.moveTo(d.x - 11, d.y - 4); c.quadraticCurveTo(d.x - 4, d.y - 18, d.x + 12, d.y - 9); c.quadraticCurveTo(d.x + 2, d.y - 5, d.x - 11, d.y - 4); c.closePath();
        c.fillStyle = "#6cc04a"; c.fill(); c.lineWidth = 0.9; c.strokeStyle = VIEN; c.stroke();
        c.beginPath(); c.moveTo(d.x - 9, d.y - 5); c.quadraticCurveTo(d.x, d.y - 11, d.x + 11, d.y - 9); c.lineWidth = 0.7; c.strokeStyle = "#3f8a2f"; c.stroke();
      } else { // khăn buộc đầu
        c.beginPath(); c.arc(d.x, d.y, R + 1.3, PI * 1.05, PI * 1.9); c.lineWidth = 3; c.strokeStyle = "#8a2a3a"; c.stroke();
      }
      return;
    }
    if (ky === "do_da") {
      if (h.chungLoai === "tien") { // vòng lá
        c.beginPath(); c.ellipse(d.x - 0.5, d.y - 5, R + 0.6, 3.2, -0.08, PI * 0.95, PI * 2.05); c.lineWidth = 1.6; c.strokeStyle = "#3f8a2f"; c.stroke();
        for (let i = 0; i < 6; i++) {
          const a = PI * (1 + i / 5.2), x = d.x - 0.5 + Math.cos(a) * (R + 0.6), y = d.y - 5 + Math.sin(a) * 3.2;
          elip(c, x, y - 1, 2.4, 1.3, a + 0.6, i % 2 ? "#86cf73" : "#5fb04a", true);
        }
      } else { // khăn quấn đầu, đuôi khăn bay sau gáy
        c.beginPath(); c.ellipse(d.x, d.y - 4.5, R + 0.8, 3.2, -0.06, PI * 0.92, PI * 2.04); c.lineWidth = 3.2; c.strokeStyle = toc.khan; c.stroke();
        const bay = Math.sin(t * 3.3) * 1.5;
        c.beginPath(); c.moveTo(d.x - 10.5, d.y - 4); c.quadraticCurveTo(d.x - 15, d.y - 4 + bay, d.x - 18, d.y + 1 + bay); c.lineTo(d.x - 16, d.y + 2.5 + bay); c.quadraticCurveTo(d.x - 13, d.y - 1, d.x - 10, d.y - 1.5); c.closePath();
        c.fillStyle = toc.khan; c.fill(); c.lineWidth = 0.8; c.strokeStyle = VIEN; c.stroke();
        if (h.chungLoai === "quy") tronDay(c, d.x + 6.5, d.y - 6.6, 1.3, "#c77dff", true); // đá tím trên khăn
        else tronDay(c, d.x + 6.5, d.y - 6.6, 1.3, "#e7b04a", true);
      }
    } else if (ky === "do_dong") { // vòng đồng + lông chim (gợi người Đông Sơn đội mũ lông chim)
      const bay = Math.sin(t * 2.5) * 0.08;
      for (let i = 0; i < 3; i++) {
        c.save(); c.translate(d.x - 3 - i * 2.2, d.y - 8); c.rotate(-0.5 - i * 0.35 + bay);
        elip(c, 0, -7, 2.2, 7.5, 0, i === 1 ? "#f2e7d0" : toc.choangTrong, true);
        c.beginPath(); c.moveTo(0, -1); c.lineTo(0, -13); c.lineWidth = 0.6; c.strokeStyle = VIEN; c.stroke();
        c.restore();
      }
      c.beginPath(); c.ellipse(d.x, d.y - 5, R + 0.9, 3.2, -0.06, PI * 0.92, PI * 2.04); c.lineWidth = 3.4; c.strokeStyle = "#c98a3a"; c.stroke();
      tronDay(c, d.x + 6.8, d.y - 7, 2, "#e7b04a", true);
      c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * PI / 4; c.moveTo(d.x + 6.8, d.y - 7); c.lineTo(d.x + 6.8 + Math.cos(a) * 1.6, d.y - 7 + Math.sin(a) * 1.6); } c.lineWidth = 0.4; c.strokeStyle = "#7a4a14"; c.stroke();
    } else if (ky === "do_sat") { // mũ sắt
      c.beginPath(); c.arc(d.x, d.y - 1, R + 2, PI * 1.0, PI * 2.0); c.lineTo(d.x + R + 2, d.y - 2); c.lineTo(d.x - R - 2, d.y - 2); c.closePath();
      c.fillStyle = "#8f9bb0"; c.fill(); c.lineWidth = 0.9; c.strokeStyle = VIEN; c.stroke();
      net(c, [{ x: d.x - R - 2.4, y: d.y - 2.4 }, { x: d.x + R + 2.4, y: d.y - 2.4 }], 2.4, "#6d7891");
      net(c, [{ x: d.x + 8.5, y: d.y - 2.5 }, { x: d.x + 9.2, y: d.y + 3.2 }], 1.6, "#6d7891"); // che mũi
      c.beginPath(); c.arc(d.x - 1, d.y - 2, R - 2, PI * 1.25, PI * 1.6); c.lineWidth = 1.4; c.strokeStyle = "rgba(255,255,255,.5)"; c.stroke();
      net(c, [{ x: d.x - 1, y: d.y - 14 }, { x: d.x - 1, y: d.y - 18 }], 1.4, "#6d7891");
      elip(c, d.x - 4, d.y - 19, 4.5, 2, 0.4, toc.choang, true); // chùm lông trên đỉnh
    } else { // Đế quốc: vương miện
      const y0 = d.y - 7.5;
      c.beginPath();
      c.moveTo(d.x - 8.5, y0); c.lineTo(d.x - 9.5, y0 - 8); c.lineTo(d.x - 5, y0 - 4); c.lineTo(d.x - 1, y0 - 10.5); c.lineTo(d.x + 3, y0 - 4); c.lineTo(d.x + 7.5, y0 - 8.5); c.lineTo(d.x + 8.5, y0 + 0.5);
      c.quadraticCurveTo(d.x, y0 + 2, d.x - 8.5, y0); c.closePath();
      const g = c.createLinearGradient(0, y0 - 10, 0, y0 + 2); g.addColorStop(0, "#fff0a8"); g.addColorStop(1, "#e7a92a");
      c.fillStyle = g; c.fill(); c.lineWidth = 0.9; c.strokeStyle = VIEN; c.stroke();
      tronDay(c, d.x - 1, y0 - 2, 1.6, "#e2384d", true);
      tronDay(c, d.x + 5, y0 - 1.5, 1.1, "#3fa3ff", true);
      tronDay(c, d.x - 6, y0 - 1.5, 1.1, "#3fd18a", true);
      [[-9.5, -8], [-1, -10.5], [7.5, -8.5]].forEach(([dx, dy]) => tronDay(c, d.x + dx, y0 + dy, 0.9, "#fff6c8", false));
    }
  }

  // ---------------- HÀM VẼ CHÍNH ----------------
  function ve(c, hoSo, tc) {
    tc = tc || {};
    const h = chuanHoa(hoSo);
    const tuThe = TU_THE.indexOf(tc.tuThe) >= 0 ? tc.tuThe : "dung";
    const ky = THOI_KY.indexOf(tc.thoiKy) >= 0 ? tc.thoiKy : "do_da";
    const vaiTro = tc.vaiTro === "nong_dan" ? "nong_dan" : "thu_linh";
    const cam = tc.cam != null ? tc.cam : (tuThe === "chat" ? "riu" : (vaiTro === "thu_linh" && (tuThe === "dung" || tuThe === "di") ? "gay" : ""));
    const lech = tc.lech || 0, t = (tc.t || 0) + lech;
    const k = dungKhung(tuThe, t, { cam, u: tc.u });
    const toc = TOC_LOAI[h.chungLoai];
    const da = BANG.da[h.mauDa], mauToc = BANG.toc[h.mauToc];
    const ao = vaiTro === "nong_dan" ? AO_NONG_DAN[h.chungLoai] : BANG.ao[h.mauAo];
    const coChoang = vaiTro === "thu_linh" && ky !== "do_da";
    const co = tc.co || 1, huong = tc.huong === -1 ? -1 : 1;

    c.save();
    c.translate(tc.x || 0, tc.y || 0);
    c.scale(co * huong, co);

    // hào quang Quốc vương (Đế quốc)
    if (vaiTro === "thu_linh" && ky === "de_quoc") {
      const g = c.createRadialGradient(0, -40 - k.nang, 4, 0, -40 - k.nang, 44);
      g.addColorStop(0, "rgba(255,226,120,.42)"); g.addColorStop(1, "rgba(255,226,120,0)");
      c.fillStyle = g; c.beginPath(); c.arc(0, -40 - k.nang, 44, 0, PI2); c.fill();
    }
    // bóng dưới chân (nhỏ lại khi nhảy)
    const bong = 1 - Math.min(0.6, k.nang / 30);
    c.save(); c.globalAlpha = 0.22; elip(c, 0.5, 0.3, 12 * bong, 2.6 * bong, 0, "#000000", false); c.restore();

    if (coChoang) veChoang(c, k, toc, ky, t, true);
    veTocSau(c, k.dau, h, mauToc, t);
    veTay(c, k.tay[0], k.vai, da, ao, true);
    veChan(c, { hong: k.hong, goi: k.chan[0].goi, ban: k.chan[0].ban }, toc.quan, toc.giay, true);
    veChan(c, { hong: k.hong, goi: k.chan[1].goi, ban: k.chan[1].ban }, toc.quan, toc.giay, false);
    veThan(c, k, ao, ky, h.gioi, toc, vaiTro);
    if (coChoang) veChoang(c, k, toc, ky, t, false);
    if (cam === "riu" && k.riu) veRiu(c, k.riu, vaiTro === "nong_dan" ? "do_da" : ky);
    if (cam === "gay") veGay(c, k.tay[1], toc, h.chungLoai, ky, t);
    // cổ + đầu
    net(c, [k.vai, k.coTren], 4.4, da);
    const d = k.dau;
    if (h.chungLoai !== "tien") veTai(c, d, h, da);
    c.beginPath(); c.ellipse(d.x + 0.3, d.y, DAI.dau - 0.3, DAI.dau, 0, 0, PI2); c.fillStyle = da; c.fill(); c.lineWidth = 1; c.strokeStyle = VIEN; c.stroke();
    // cằm hơi nhô về phía trước
    c.beginPath(); c.moveTo(d.x + 4, d.y + 9.5); c.quadraticCurveTo(d.x + 10.5, d.y + 9, d.x + 10.8, d.y + 3); c.lineTo(d.x + 4, d.y + 3); c.closePath(); c.fillStyle = da; c.fill();
    c.beginPath(); c.moveTo(d.x + 3.5, d.y + 10.6); c.quadraticCurveTo(d.x + 10.6, d.y + 9.6, d.x + 11.2, d.y + 3.2); c.lineWidth = 1; c.strokeStyle = VIEN; c.stroke();
    veMat(c, d, h, toc, t, lech);
    veTocTruoc(c, d, h, mauToc);
    if (h.chungLoai === "tien") veTai(c, d, h, da);
    veMu(c, d, h, toc, ky, vaiTro, t);
    if (h.chungLoai === "quy") veSung(c, d, toc);
    veTay(c, k.tay[1], k.vai, da, ao, false);
    c.restore();
    return k;
  }

  goc.KC_NV = {
    phienBan: 1,
    BANG, TEN_MAU, KIEU_TOC, CHUNG_LOAI, THOI_KY, TU_THE,
    CAO: 78, // chiều cao nhân vật đứng (đơn vị nhân vật, chưa nhân co), để game tính co cho vừa khung
    chuanHoa, hoSoNongDan, dungKhung, ve
  };
})(typeof window !== "undefined" ? window : globalThis);
