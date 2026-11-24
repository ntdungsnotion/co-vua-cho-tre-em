/* ================================================================
   FILE: tt_tri_thuc/tt_cau_hoi.js
   CHỨC NĂNG: KHỐI CÂU HỎI + MÀN KẾT QUẢ DÙNG CHUNG của phân hệ THỬ THÁCH tri thức
              (đặc tả Thiet_Ke_On_The.md mục 5.4, 5.5). Đấu Trường dùng cho màn "Ôn lại trận
              vừa rồi" (TC_D34B); trang Thử Thách (KC_03C4) dùng lại cho Theo môn / Tổng hợp.
              Máy chủ giữ lượt + chấm (RPC kc_tt_tra_loi / kc_tt_ket_thuc, TC_D34A): trang chỉ
              hiện câu đang mở, gửi đáp án bé chọn, nhận đúng / sai + câu kế.
              Màn phủ toàn trang. Điện thoại 1 cột; máy tính: cột trái (môn + nhân vật bé cổ vũ),
              khung câu giữa ≤ 760 px, đáp án lưới 2 × 2, phím 1-6 trả lời ngay (chạm là chấm, tự sang câu).
   DÙNG:      KC_TT.moLuot({
                luot,                    // kc_tt_luot_json của máy chủ: { id, tong, viTri, daTraLoi, cau, ketQua }
                goi: { traLoi(luotId, viTri, chon, giay), ketThuc(luotId) },   // trả { ok, ... } như dt_may_chu_sb.js
                tieuDe, phuDe, batBuoc (true: không có nút ✕), nutKet ("Về thung lũng"),
                goc (tiền tố đường dẫn hình câu, vd "" ở kc/, "../" ở kc/dt/), lop (lớp bé: ≤ 3 có 🔊 đọc câu),
                hoSo (ngoại hình bé, chung/nv_ve.js: có thì vẽ bé cổ vũ ở cột trái máy tính),
                nutThem ([{ chu, ma }]: nút thêm ở màn kết quả, bấm thì đóng màn với dong = ma; KC_03C4 "▶ Chơi tiếp N câu"),
                loiMoDau (Cô Cú nói ở câu đầu, mặc định "Mình cùng ôn lại nhé!"),
                sanKhau ({ am: KC_TM_AM }, KC_03C4b Theo môn: đọc câu xong mới hiện 4 đáp án + nhạc lúc đọc, tích tắc lúc chờ,
                         bình luận đúng / sai + lời giải + nút "⏭ Bỏ qua"; không có thì như cũ)
              }) -> Promise<{ ketQua | null, dong: "xong" | "bo" | "loi" | ma của nutThem }>
   CẦN NẠP TRƯỚC: chung/gio_bai.js (KC_GIO_BAI: trừ 💎 theo giờ, module chung toàn app).
   BƯỚC: TC_D34B (phần 2: dùng module giờ chung); KC_03C4 (nutThem, loiMoDau, 🪙 xu vàng mỗi câu đúng); KC_03C4b (sanKhau)
   NGÀY: 20/11/2026 · sửa 24/11/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const doc = goc.document;
  const ngu = ms => new Promise(r => setTimeout(r, ms));
  const tao = (the, lop, chu) => { const e = doc.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; };
  const TEN_KHOAN = { hoan_thanh: "Hoàn thành", gioi: "Giỏi", thuoc_moi: "Thuộc mới", nhan_tong_hop: "Tổng hợp", toi_da: "Tối đa", sai: "Sai", thoi_gian: "⏱ Thời gian" };
  const soVi = x => String(Math.round(x * 10) / 10).replace(".", ",");
  const DONG_VIEN = ["Con đã cố gắng rồi! Lần sau mình nhớ thêm nhé 🦉", "Sai là để nhớ lâu hơn. Cô Cú tin con! 🦉", "Từng chút một, con giỏi lên mỗi ngày 🦉"];

  // ---------------- Âm thanh: module chung chung/am_thanh.js (KC_09A) ----------------
  // Tiếng đúng / sai / thưởng + đọc câu dùng chung toàn app; thiếu module (trang cũ chưa nạp) thì im lặng.
  const AM = () => goc.KC_AM_THANH || null;
  const tieng = {
    // KC_09B2: tiếng đúng / sai mọi lớp + lời khen / động viên khi lớp bé <= cài đặt (Quản trị › Âm thanh chung)
    ting(lop, keNghe) { const a = AM(); if (a) a.phanHoi(true, lop, { khongLoi: !!keNghe }); },
    tram(lop, keNghe) { const a = AM(); if (a) a.phanHoi(false, lop, { khongLoi: !!keNghe }); },
    ruong() { const a = AM(); if (a) a.tieng.thuong(); },
    kc(i) { const a = AM(); if (a) a.tieng.kc(i); },
    keng() { const a = AM(); if (a) a.tieng.keng(); }
  };

  // ---------------- Đọc câu ----------------
  function docTo(cau, lop, duongGoc) { const a = AM(); if (a && cau) a.docCau(cau, { lop, goc: duongGoc || "" }); }
  const coDoc = (cau, lop) => { const a = AM(); return !!a && a.coDoc(cau, lop); };
  const coAmThanh = cau => { const a = AM(); return !!a && a.coAmThanh(cau); };
  const dungDoc = () => { const a = AM(); if (a) a.dung(); };

  // ---------------- Màn ----------------
  function moLuot(tc) {
    const t = Object.assign({ tieuDe: "Ôn lại", phuDe: "", batBuoc: false, nutKet: "Xong", goc: "", lop: null, hoSo: null, nutThem: [], loiMoDau: "Mình cùng ôn lại nhé!", sanKhau: null }, tc || {});
    // KC_03C4b (người dùng 24/11/2026, Theo môn): sanKhau = { am: KC_TM_AM } -> đọc câu xong mới hiện 4 đáp án (nhạc sôi động lúc đọc),
    // tích tắc lúc chờ, trả lời xong có bình luận + nút bỏ qua. Đồng hồ bài chỉ chạy lúc 4 đáp án đang hiện.
    const sk = t.sanKhau && t.sanKhau.am ? t.sanKhau : null;
    const skAm = sk ? sk.am : null;
    const goi = t.goi;
    let luot = t.luot;
    return new Promise(xong => {
      // trạng thái lượt
      let daTraLoi = (luot.daTraLoi || []).map(x => ({ dung: !!x.dung, hoiLai: !!x.hoiLai }));
      // TC_D34B (người dùng 20/11/2026 13:21): ĐỒNG HỒ cả bài, chỉ chạy lúc câu đang mở. giayTong = a, giayGioi = t0 (máy chủ tính
      // theo số chữ, độ khó, lớp của bé). 0 → t0: đủ 💎; t0 → a: cứ (a − t0) / tối đa giây trừ 1 💎; hết giờ: 0 💎, vẫn ôn tiếp.
      // 💎 còn nhận = tối đa − trừ × số câu gốc sai − phần trừ theo giờ (máy chủ tính lại khi kết thúc).
      const taoDh = l => (l && l.giayTong > 0 ? { tong: +l.giayTong, gioi: Math.max(0, Math.min(+l.giayGioi || 0, +l.giayTong - 1)), daDung: +l.giayDaDung || 0, kcToiDa: Number.isFinite(+l.kcToiDa) && l.kcToiDa != null ? +l.kcToiDa : null, tru: +l.truMoiSai || 0 } : null);
      let dh = taoDh(luot), dhChay = false, dhHen = 0, dhBaoHet = false;
      const lichSu = []; // câu đã trả lời trong lần mở màn này (xem lại đáp án + lời giải ở màn nhận thưởng)
      let tong = luot.tong, viTri = luot.viTri, cau = luot.cau, chon = -1, luc0 = 0, dangGui = false, daCham = null, dong = false;
      let docDang = null, blDang = null; // KC_03C4b: pha đọc câu / pha bình luận đang mở

      const goc0 = tao("div", "ttMan"); goc0.setAttribute("role", "dialog"); goc0.setAttribute("aria-modal", "true"); goc0.setAttribute("aria-label", t.tieuDe);
      goc0.innerHTML =
        '<div class="ttNen"></div>' +
        '<div class="ttBo">' +
        '  <aside class="ttCot" aria-hidden="true"><div class="ttMon"><span class="ttMonBt"></span><b class="ttMonTen"></b></div>' +
        '    <canvas class="ttBe" width="200" height="220"></canvas><div class="ttCoCu"><span>🦉</span><p class="ttCoCuNoi">Con làm được mà!</p></div></aside>' +
        '  <main class="ttGiua">' +
        '    <header class="ttDau"><div class="ttTieuDe"><b></b><small></small></div><button class="ttDong" type="button" aria-label="Đóng">✕</button></header>' +
        '    <div class="ttCham" role="progressbar" aria-label="Tiến độ"></div>' +
        '    <div class="ttDongHo" hidden><span class="ttGio" aria-live="off">⏱ <b>0</b><small> giây</small></span><span class="ttKcCon" title="Kim cương con còn nhận được">💎 <b>0</b></span>' +
        '      <i class="ttVach" aria-hidden="true"><i></i></i></div>' +
        '    <section class="ttCau" aria-live="polite"></section>' +
        '  </main>' +
        '</div>';
      doc.body.appendChild(goc0);
      const $ = s => goc0.querySelector(s);
      $(".ttTieuDe b").textContent = t.tieuDe;
      $(".ttTieuDe small").textContent = t.phuDe || "";
      $(".ttDong").hidden = !!t.batBuoc;
      $(".ttDong").addEventListener("click", () => dongMan("bo", null));

      // bé cổ vũ (máy tính)
      const cv = $(".ttBe"), NV = goc.KC_NV;
      let raf = 0, tuThe = "vay", t0 = performance.now();
      function veBe(now) {
        if (dong) return;
        raf = requestAnimationFrame(veBe);
        if (!cv.offsetParent) return; // cột trái đang ẩn (điện thoại)
        const c = cv.getContext("2d"); c.clearRect(0, 0, cv.width, cv.height);
        try { NV.ve(c, t.hoSo, { x: cv.width / 2, y: cv.height - 12, co: 2.2, huong: 1, t: (now - t0) / 1000, tuThe, vaiTro: "thu_linh", cam: "" }); } catch (e) { cancelAnimationFrame(raf); cv.hidden = true; }
      }
      if (NV && t.hoSo) raf = requestAnimationFrame(veBe); else cv.hidden = true;
      const coCu = chu => { $(".ttCoCuNoi").textContent = chu; };

      function giayDung() { return dh ? dh.daDung + (dhChay ? (performance.now() - luc0) / 1000 : 0) : 0; }
      function veDongHo() {
        const o = $(".ttDongHo"); if (!dh) { o.hidden = true; return; }
        o.hidden = false;
        const con = Math.max(0, dh.tong - giayDung()), ty = dh.tong > 0 ? con / dh.tong : 0;
        o.querySelector(".ttGio b").textContent = con > 0 ? String(Math.ceil(con)) : "Hết giờ!";
        o.querySelector(".ttGio small").hidden = con <= 0;
        o.querySelector(".ttVach i").style.width = (ty * 100).toFixed(1) + "%";
        o.dataset.muc = ty > 0.5 ? "xanh" : ty > 0.2 ? "vang" : "do";
        const kcO = o.querySelector(".ttKcCon");
        if (dh.kcToiDa == null) kcO.hidden = true;
        else {
          const sai = daTraLoi.filter(x => x && !x.dung && !x.hoiLai).length;
          // mỗi câu sai trừ trước, rồi trừ theo giờ bằng module chung chung/gio_bai.js (trước t0 không trừ; hết giờ = 0 💎)
          const truoc = Math.max(0, dh.kcToiDa - dh.tru * sai);
          kcO.querySelector("b").textContent = String(goc.KC_GIO_BAI.kcSauGio(truoc, dh.kcToiDa, giayDung(), dh.gioi, dh.tong));
        }
        if (con <= 0 && !dhBaoHet && !goc0.classList.contains("ketQua")) { dhBaoHet = true; o.dataset.het = "1"; coCu("⏰ Hết giờ rồi! Lần này không có 💎, con ôn tiếp cho nhớ nhé"); tieng.tram(); }
      }
      function chayDh(bat) {
        if (!dh) return;
        if (!bat && dhChay) { dh.daDung += (performance.now() - luc0) / 1000; }
        dhChay = bat;
        clearInterval(dhHen); if (bat) dhHen = setInterval(veDongHo, 200);
        veDongHo();
      }

      function veCham() {
        const o = $(".ttCham"); o.innerHTML = "";
        for (let i = 0; i < tong; i++) {
          const d = tao("i", "ttCh");
          const k = daTraLoi[i];
          if (k) { d.classList.add(k.dung ? "dung" : "sai"); if (k.hoiLai) d.textContent = "🔁"; }
          else if (i === viTri) { d.classList.add("nay"); if (cau && cau.hoiLai) d.textContent = "🔁"; }
          o.appendChild(d);
        }
        o.setAttribute("aria-valuemin", "0"); o.setAttribute("aria-valuemax", String(tong)); o.setAttribute("aria-valuenow", String(daTraLoi.length));
      }

      function veCau() {
        daCham = null; chon = -1; dangGui = false;
        const s = $(".ttCau"); s.innerHTML = ""; s.classList.remove("daCham");
        if (cau && cau.monBieuTuong) { $(".ttMonBt").textContent = cau.monBieuTuong; $(".ttMonTen").textContent = cau.monTen || ""; }
        veCham();
        if (cau.hoiLai) s.appendChild(tao("div", "ttHoiLai", "🔁 Hỏi lại cho chắc nhé"));
        const khung = tao("div", "ttKhung");
        const hang = tao("div", "ttHang");
        const nd = tao("p", "ttNoiDung", cau.noiDung || "");
        hang.appendChild(nd);
        if (coDoc(cau, t.lop)) {
          const n = tao("button", "ttNghe", "🔊"); n.type = "button"; n.setAttribute("aria-label", "Nghe câu hỏi");
          n.addEventListener("click", () => docTo(cau, t.lop, t.goc)); hang.appendChild(n);
        }
        khung.appendChild(hang);
        if (cau.hinh || cau.hinhChu) {
          const h = tao("div", "ttHinh");
          if (cau.hinh) { const im = doc.createElement("img"); im.alt = ""; im.src = t.goc + cau.hinh; im.onerror = () => { h.textContent = cau.hinhChu || ""; if (!cau.hinhChu) h.remove(); }; h.appendChild(im); }
          else h.textContent = cau.hinhChu;
          khung.appendChild(h);
        }
        s.appendChild(khung);
        const ds = tao("div", "ttDap");
        const dai = (cau.dapAn || []).some(x => String(x).length > 22);
        if (dai || (cau.dapAn || []).length === 3) ds.classList.add("doc");
        (cau.dapAn || []).forEach((x, i) => {
          const b = tao("button", "ttDa"); b.type = "button"; b.dataset.i = String(i);
          b.appendChild(tao("span", "ttSo", String(i + 1)));
          b.appendChild(tao("span", "ttChu", String(x)));
          b.addEventListener("click", () => chonDa(i));
          ds.appendChild(b);
        });
        s.appendChild(ds);
        const ph = tao("div", "ttPhan"); ph.setAttribute("aria-live", "polite"); s.appendChild(ph);
        coCu(viTri === 0 ? t.loiMoDau : ["Con làm được mà!", "Cố lên nào!", "Đọc kỹ rồi chọn nhé!"][viTri % 3]);
        tuThe = "dung";
        if (sk) { docTruoc(s, ds); return; }
        luc0 = performance.now();
        chayDh(true);
        if (coAmThanh(cau)) setTimeout(() => { if (!dong) docTo(cau, t.lop, t.goc); }, 250); // câu nghe: tự đọc
      }

      // ---------------- KC_03C4b: pha đọc câu (chưa hiện đáp án) ----------------
      function docTruoc(s, ds) {
        const n = skAm.nhip(), A = AM();
        ds.classList.add("ttAnDa"); ds.setAttribute("aria-hidden", "true");
        ds.querySelectorAll(".ttDa").forEach(b => { b.disabled = true; });
        const khoi = tao("div", "ttDocKhoi");
        const thanh = tao("div", "ttDocThanh"); const vach = tao("i"); thanh.appendChild(vach);
        const nut = tao("button", "ttNut ttXongDoc", "👀 Xem đáp án"); nut.type = "button";
        khoi.append(tao("p", "ttDocChu", "📖 Con đọc kỹ câu hỏi nhé…"), thanh, nut);
        s.insertBefore(khoi, ds);
        const dd = { xong: false, hen: [], ds, khoi };
        docDang = dd;
        const soChu = String(cau.noiDung || "").trim().split(/\s+/).filter(Boolean).length;
        const nghe = coAmThanh(cau);
        const thanhTieng = !nghe && n.docThanhTieng && !!A && (t.lop == null || t.lop <= n.docDenLop);
        // giờ đọc ước lượng: bé tự đọc (chữ / giây) hoặc máy đọc (~2,5 chữ / giây); kẹp giữa tối thiểu và tối đa
        const uoc = thanhTieng ? soChu / 2.5 + 1 : n.docChuMoiGiay > 0 ? soChu / n.docChuMoiGiay : n.docGiayToiThieu;
        const giay = Math.min(n.docGiayToiDa, Math.max(n.docGiayToiThieu, uoc));
        vach.style.transitionDuration = giay + "s";
        requestAnimationFrame(() => requestAnimationFrame(() => { vach.style.width = "100%"; }));
        const het = () => hienDa(dd);
        nut.addEventListener("click", () => { skAm.mo(); het(); });
        if (!nghe) skAm.batNhac();
        if (nghe) { // câu nghe: không nhạc, đọc phần nghe xong mới hiện đáp án
          dd.hen.push(setTimeout(() => { if (dd.xong || dong) return; const a = AM(); if (a) a.docCau(cau, { lop: t.lop, goc: t.goc || "", khiXong: () => { dd.hen.push(setTimeout(het, 500)); } }); else het(); }, 250));
          dd.hen.push(setTimeout(het, Math.max(giay, n.docGiayToiDa) * 1000));
        } else if (thanhTieng) {
          // máy đọc thành tiếng: hiện đáp án khi đọc xong (ít nhất docGiayToiThieu), chậm nhất docGiayToiDa + 5 giây (máy đọc lỗi)
          const t0 = performance.now();
          skAm.nhoNhac(true);
          A.doc(cau.noiDung || "", { lang: "vi-VN", khiXong: () => {
            if (dd.xong) return; skAm.nhoNhac(false);
            const con = n.docGiayToiThieu * 1000 - (performance.now() - t0);
            dd.hen.push(setTimeout(het, Math.max(400, con)));
          } });
          dd.hen.push(setTimeout(het, (n.docGiayToiDa + 5) * 1000));
        } else dd.hen.push(setTimeout(het, giay * 1000));
      }
      function hienDa(dd) {
        if (!dd || dd !== docDang || dd.xong || dong) return;
        dd.xong = true; docDang = null;
        dd.hen.forEach(clearTimeout);
        skAm.dungNhac(); skAm.nhoNhac(false);
        dd.khoi.remove();
        dd.ds.classList.remove("ttAnDa"); dd.ds.classList.add("ttHienDa"); dd.ds.removeAttribute("aria-hidden");
        dd.ds.querySelectorAll(".ttDa").forEach(b => { b.disabled = false; });
        skAm.phat("hienDapAn");
        coCu("Con chọn đáp án nào?");
        luc0 = performance.now();
        chayDh(true);
        skAm.batTicTac();
      }

      function chonDa(i) {
        if (daCham || dangGui) return;
        chon = i; // người dùng 20/11/2026: chạm đáp án là chấm luôn (không có nút Trả lời)
        goc0.querySelectorAll(".ttDa").forEach(b => b.classList.toggle("chon", Number(b.dataset.i) === i));
        guiDa();
      }

      async function guiDa() {
        if (daCham || dangGui || chon < 0) return;
        dangGui = true;
        const bChon = goc0.querySelector('.ttDa[data-i="' + chon + '"]'); if (bChon) bChon.classList.add("cho");
        goc0.querySelectorAll(".ttDa").forEach(b => { b.disabled = true; });
        const giay = Math.round((performance.now() - luc0) / 100) / 10, tBat = performance.now();
        chayDh(false);
        if (skAm) skAm.dungTicTac();
        let kq = null;
        for (let lan = 0; lan < 3; lan++) {
          try { kq = await goi.traLoi(luot.id, viTri, chon, giay); } catch (e) { kq = null; }
          if (kq && (kq.ok || (kq.ma && kq.ma !== "mang"))) break;
          coCu("Mạng đang chập chờn, con đợi chút nhé");
          await ngu(1000 * (lan + 1));
        }
        const conCho = 350 - (performance.now() - tBat); if (conCho > 0) await ngu(conCho); // vòng sáng ≥ 0,35 giây (luật 3.17)
        if (bChon) bChon.classList.remove("cho");
        if (!kq || !kq.ok) return loiTraLoi(kq);
        nhanCham(kq);
      }

      function loiTraLoi(kq) {
        dangGui = false;
        const ma = kq && kq.ma;
        if (ma === "vi_tri" && kq.luot) { napLuot(kq.luot); return; } // trang lệch với máy chủ (vd đã trả lời ở máy khác): theo máy chủ
        if (ma === "da_xong") { ketThuc(); return; }
        const ph = $(".ttPhan"); ph.innerHTML = "";
        const p = tao("p", "ttLoi", ma === "dang_nhap" ? "Con đăng nhập lại rồi vào lại nhé. Bài ôn vẫn chờ con." : "Mạng đang chập chờn. Con bấm Thử lại nhé, bài ôn vẫn giữ nguyên.");
        ph.appendChild(p);
        const nut = tao("button", "ttNut", ma === "dang_nhap" ? "Đóng" : "Thử lại"); nut.type = "button"; ph.appendChild(nut);
        if (ma === "dang_nhap") { chon = -1; nut.addEventListener("click", () => dongMan("loi", null)); return; }
        const chon0 = chon;
        nut.addEventListener("click", () => { ph.innerHTML = ""; chon = chon0; guiDa(); }, { once: true });
        goc0.querySelectorAll(".ttDa").forEach(b => { b.disabled = false; });
        coCu("Mạng đang chập chờn, con đợi chút nhé");
      }

      function napLuot(l) {
        luot = l; tong = l.tong; viTri = l.viTri; cau = l.cau;
        daTraLoi = (l.daTraLoi || []).map(x => ({ dung: !!x.dung, hoiLai: !!x.hoiLai }));
        if (l.giayTong > 0) { chayDh(false); dh = taoDh(l); }
        if (!cau || viTri >= tong) ketThuc(); else veCau();
      }

      function nhanCham(kq) {
        dangGui = false;
        const dung = !!kq.dung;
        const keNghe = !!(kq.cau && coAmThanh(kq.cau)) || !!(sk && skAm.nhip().binhLuanThanhTieng); // KC_03C4b: bình luận đọc thành tiếng thay lời khen // câu kế là câu nghe: không nói lời khen / động viên (câu nghe tự đọc ngay, lời sẽ đè lên) (người dùng 21/11/2026)
        daTraLoi[viTri] = { dung, hoiLai: !!(cau && cau.hoiLai) };
        veDongHo();
        daCham = kq;
        tong = Number.isInteger(kq.tong) ? kq.tong : tong;
        const s = $(".ttCau"); s.classList.add("daCham");
        goc0.querySelectorAll(".ttDa").forEach(b => {
          const i = Number(b.dataset.i);
          b.disabled = true;
          if (i === kq.dapAnDung) b.classList.add("dung");
          if (i === chon && !dung) b.classList.add("sai");
          if (i !== kq.dapAnDung && i !== chon) b.classList.add("mo");
        });
        const ph = $(".ttPhan"); ph.innerHTML = "";
        const dap = cau.dapAn && cau.dapAn[kq.dapAnDung];
        // người dùng 20/11/2026: chỉ báo đúng / sai ngắn ở cuối màn rồi tự sang câu; lời giải xem lại ở màn nhận thưởng
        lichSu.push({ viTri, noiDung: cau.noiDung || "", hinhChu: cau.hinhChu || "", hoiLai: !!cau.hoiLai, dapAn: (cau.dapAn || []).map(String), chon, dapAnDung: kq.dapAnDung, dung, loiGiai: kq.loiGiai || "" });
        if (dung) {
          const pDung = tao("p", "ttDung", ["✓ Đúng rồi!", "⭐ Giỏi quá!", "✓ Chính xác!"][viTri % 3]);
          // KC_03C2 (người dùng 20/11/2026): mỗi câu đúng +vangMoiCau 🪙 xu vàng, không phụ thuộc đồng hồ / trần 💎
          if (luot && luot.vangMoiCau > 0) pDung.appendChild(tao("span", "ttVangCau", "+" + luot.vangMoiCau + " 🪙"));
          ph.appendChild(pDung);
          const b = goc0.querySelector('.ttDa[data-i="' + kq.dapAnDung + '"]'); if (b) phaoSao(b);
          tieng.ting(t.lop, keNghe); tuThe = "vay"; coCu("Tuyệt vời!");
        } else {
          const p = tao("p", "ttSaiChu"); p.append("✗ Đáp án: ", tao("b", "", dap != null ? String(dap) : "…"));
          ph.appendChild(p);
          tieng.tram(t.lop, keNghe); coCu(kq.hoiLai ? "Lát nữa Cô Cú hỏi lại để con nhớ nhé" : "Không sao, mình nhớ lần sau nhé");
        }
        veCham();
        if (sk) { binhLuan(kq, dung, dap); return; }
        setTimeout(tiep, dung ? 700 : 1300);
      }

      // ---------------- KC_03C4b: bình luận sau khi trả lời + nút bỏ qua ----------------
      function binhLuan(kq, dung, dap) {
        const n = skAm.nhip(), A = AM();
        const ph = $(".ttPhan"); ph.innerHTML = "";
        const bl = tao("div", "ttBinhLuan " + (dung ? "dung" : "sai"));
        const dau = tao("p", "ttBlDau", dung ? ["✓ Đúng rồi!", "⭐ Giỏi quá!", "✓ Chính xác!"][viTri % 3] : "✗ Chưa đúng rồi");
        if (dung && luot && luot.vangMoiCau > 0) dau.appendChild(tao("span", "ttVangCau", "+" + luot.vangMoiCau + " 🪙"));
        bl.appendChild(dau);
        const pd = tao("p", "ttBlDap"); pd.append(dung ? "Con chọn đúng: " : "Đáp án đúng: ", tao("b", "", dap != null ? String(dap) : "…")); bl.appendChild(pd);
        const giai = String(kq.loiGiai || "").trim();
        if (giai) bl.appendChild(tao("p", "ttBlGiai", "💡 " + giai));
        if (!dung && kq.hoiLai) bl.appendChild(tao("p", "ttBlHoiLai", "🔁 Lát nữa Cô Cú hỏi lại bằng câu khác để con nhớ lâu nhé"));
        const cuoi = kq.xong || !kq.cau;
        const nut = tao("button", "ttNut tiep ttBoQua", cuoi ? "🎁 Xem phần thưởng" : "⏭ Bỏ qua, sang câu mới"); nut.type = "button";
        bl.appendChild(nut);
        ph.appendChild(bl);
        skAm.phat("binhLuan");
        const b = { hen: [], xong: false };
        blDang = b;
        const sang = () => {
          if (b.xong || blDang !== b || dong) return;
          b.xong = true; blDang = null; b.hen.forEach(clearTimeout); dungDoc();
          skAm.phat("sangCau"); tiep();
        };
        b.sang = sang;
        nut.addEventListener("click", sang);
        const giay = dung ? n.binhLuanGiayDung : n.binhLuanGiaySai;
        const tuSang = ms => { if (giay > 0) b.hen.push(setTimeout(sang, ms)); };
        const loi = (dung ? "Đúng rồi! " : "Chưa đúng. Đáp án đúng là " + (dap != null ? String(dap) : "") + ". ") + giai;
        if (n.binhLuanThanhTieng && A) {
          // đọc lời bình luận (sau tiếng đúng / sai ~0,6 giây); đọc xong thì chờ 1,5 giây rồi tự sang câu
          b.hen.push(setTimeout(() => { if (b.xong || dong) return; A.doc(loi, { lang: "vi-VN", khiXong: () => tuSang(1500) }); }, 650));
          b.hen.push(setTimeout(() => tuSang(0), (giay + 25) * 1000)); // máy đọc lỗi: vẫn tự sang
        } else tuSang(giay * 1000);
        try { nut.focus({ preventScroll: true }); } catch (e) { /* bỏ qua */ }
        try { bl.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) { /* bỏ qua */ } // màn thấp (laptop 125 %): nút Bỏ qua luôn thấy
      }

      function tiep() {
        const kq = daCham; if (!kq || dong) return;
        viTri = Number.isInteger(kq.viTri) ? kq.viTri : viTri + 1;
        if (kq.xong || !kq.cau) { ketThuc(); return; }
        cau = kq.cau; veCau();
      }

      function phaoSao(b) {
        const r = b.getBoundingClientRect(), gr = goc0.getBoundingClientRect();
        for (let i = 0; i < 8; i++) {
          const s = tao("span", "ttSao", "⭐");
          s.style.left = (r.left - gr.left + r.width / 2) + "px"; s.style.top = (r.top - gr.top + r.height / 2) + "px";
          const g = (i / 8) * Math.PI * 2; s.style.setProperty("--dx", Math.cos(g) * 70 + "px"); s.style.setProperty("--dy", Math.sin(g) * 50 - 20 + "px");
          goc0.appendChild(s); setTimeout(() => s.remove(), 800);
        }
      }

      // ---------------- Kết thúc + màn kết quả ----------------
      async function ketThuc() {
        const s = $(".ttCau"); s.innerHTML = ""; s.classList.remove("daCham");
        veCham();
        const cho = tao("div", "ttChoKq"); cho.appendChild(tao("div", "ttRuongNho", "🎁")); cho.appendChild(tao("p", "", "Cô Cú đang đếm phần thưởng…")); s.appendChild(cho);
        let kq = null;
        for (let lan = 0; lan < 4; lan++) {
          try { kq = await goi.ketThuc(luot.id); } catch (e) { kq = null; }
          if (kq && kq.ok) break;
          if (kq && kq.ma === "chua_xong" && kq.luot) { napLuot(kq.luot); return; }
          if (kq && kq.ma && kq.ma !== "mang") break;
          await ngu(1200 * (lan + 1));
        }
        if (!kq || !kq.ok) {
          s.innerHTML = "";
          s.appendChild(tao("p", "ttLoi", kq && kq.ma === "dang_nhap" ? "Con đăng nhập lại nhé. Phần thưởng vẫn giữ cho con." : "Mạng đang chập chờn. Con bấm Thử lại để nhận thưởng nhé."));
          const n = tao("button", "ttNut", kq && kq.ma === "dang_nhap" ? "Đóng" : "Thử lại"); n.type = "button";
          n.addEventListener("click", () => (kq && kq.ma === "dang_nhap" ? dongMan("loi", null) : ketThuc()));
          s.appendChild(n); return;
        }
        veKetQua(kq.ketQua || {});
      }

      function veKetQua(k) {
        goc0.classList.add("ketQua"); chayDh(false); $(".ttDongHo").hidden = true;
        const s = $(".ttCau"); s.innerHTML = "";
        const n = k.soCauGoc || 0, d = k.dungGoc || 0, ty = n ? d / n : 0;
        const kq = tao("div", "ttKq");
        const ruong = tao("div", "ttRuong"); ruong.innerHTML = '<i class="ttNap"></i><i class="ttThan"></i><i class="ttKhoa"></i><i class="ttSang"></i>';
        kq.appendChild(ruong);
        kq.appendChild(tao("h2", "ttDiem", "Con đúng " + d + " / " + n + " câu"));
        const tb = []; if (k.tienBo > 0) tb.push("🌱 Tiến bộ " + k.tienBo + " điều"); if (k.thuocMoi > 0) tb.push("⭐ Thuộc thêm " + k.thuocMoi + " điều");
        if (tb.length) kq.appendChild(tao("p", "ttTienBo", tb.join(" · ")));
        const tui = tao("div", "ttTui"); const so = tao("b", "", "0");
        tui.append("💎 +", so); kq.appendChild(tui);
        // KC_03C2: xu vàng 🪙 = mỗi câu đúng (vangCau) + 💎 đổi xu vàng khi đã đủ trần (vang)
        const vangTong = k.khongPhaiBe ? 0 : Math.max(0, (k.vangCau || 0) + (k.vang || 0));
        if (vangTong > 0) {
          const tv = tao("div", "ttTui vang"); tv.append("🪙 +" + vangTong + " xu vàng");
          if (k.vangCau > 0 && k.vangMoiCau > 0) tv.appendChild(tao("small", "", k.soCauDung + " câu đúng × " + k.vangMoiCau));
          kq.appendChild(tv);
          if (typeof goc.kcCapNhatTui === "function" && typeof k.viVang === "number") goc.kcCapNhatTui({ viVang: k.viVang });
        }
        const ds = tao("ul", "ttKhoan");
        (k.khoan || []).forEach(x => {
          if (!x || (x.ma !== "hoan_thanh" && x.ma !== "toi_da" && x.ma !== "thoi_gian" && !x.kc)) return;
          const ten = x.ma === "sai" ? "Sai " + (x.so || 0) + " câu" : x.ma === "thoi_gian" && x.giayTong ? TEN_KHOAN.thoi_gian + " " + soVi(Math.min(x.giay, x.giayTong)) + " / " + x.giayTong + " giây"
            : (TEN_KHOAN[x.ma] || x.ma) + (x.so ? " × " + x.so : "");
          const kc = x.kc || 0, li = tao("li", kc < 0 ? "tru" : ""); li.append(tao("span", "", ten), tao("b", "", (kc < 0 ? "−" + -kc : "+" + kc) + " 💎"));
          ds.appendChild(li);
        });
        if (ds.children.length) kq.appendChild(ds);
        const kGio = (k.khoan || []).find(x => x && x.ma === "thoi_gian");
        if (kGio && kGio.giayTong && kGio.giay >= kGio.giayTong && !k.khongPhaiBe) kq.appendChild(tao("p", "ttGhiChu", "⏰ Hết giờ nên lần này không có 💎. Lần sau trả lời nhanh hơn nhé!"));
        // người dùng 20/11/2026 15:53: mọi tài khoản là người chơi (máy chủ tc_d34b5 không còn chặn); máy chủ cũ còn chặn thì báo nhẹ
        if (k.khongPhaiBe) kq.appendChild(tao("p", "ttGhiChu", "Lần này chưa cộng 💎 vào túi."));
        else if (k.vang > 0) kq.appendChild(tao("p", "ttGhiChu", "Hôm nay con đã nhận đủ 💎, phần thưởng đổi thành 🪙 " + k.vang + " xu vàng."));
        else if (k.catTran || (k.tongKc > 0 && k.kc < k.tongKc)) kq.appendChild(tao("p", "ttGhiChu", "Hôm nay con đã nhận đủ 💎 rồi. Mai mình nhận tiếp nhé!"));
        if (ty < 0.5) kq.appendChild(tao("p", "ttDongVien", DONG_VIEN[Math.floor(Math.random() * DONG_VIEN.length)]));
        // người dùng 20/11/2026: nút 📖 Xem lại đáp án (muốn thì xem) + nút nhận
        const hang = tao("div", "ttHangNut");
        const nut = tao("button", "ttNut tiep", t.nutKet); nut.type = "button";
        nut.addEventListener("click", () => dongMan("xong", k));
        // KC_03C4: nút thêm (vd "▶ Chơi tiếp 10 câu") đứng trước nút kết
        const nutPhu = (t.nutThem || []).map(x => { const b = tao("button", "ttNut tiep", x.chu); b.type = "button"; b.addEventListener("click", () => dongMan(x.ma, k)); return b; });
        if (nutPhu.length) nut.className = "ttNut ttNutPhu";
        if (lichSu.length) {
          const xem = tao("button", "ttNut ttNutPhu", "📖 Xem lại đáp án"); xem.type = "button"; xem.setAttribute("aria-expanded", "false");
          const bang = veXemLai(); bang.hidden = true;
          xem.addEventListener("click", () => { bang.hidden = !bang.hidden; xem.setAttribute("aria-expanded", String(!bang.hidden)); xem.textContent = bang.hidden ? "📖 Xem lại đáp án" : "📖 Ẩn đáp án"; if (!bang.hidden) bang.scrollIntoView({ block: "start", behavior: "smooth" }); });
          hang.appendChild(xem); nutPhu.forEach(b => hang.appendChild(b)); hang.appendChild(nut); kq.appendChild(hang); kq.appendChild(bang);
        } else { nutPhu.forEach(b => hang.appendChild(b)); hang.appendChild(nut); kq.appendChild(hang); }
        s.appendChild(kq);
        coCu(ty >= 0.8 ? "Xuất sắc! Con nhớ bài rất tốt!" : ty >= 0.5 ? "Giỏi lắm! Ôn thêm là nhớ hết!" : "Cô Cú tin con sẽ nhớ hơn!");
        tuThe = "vay";
        // hiệu ứng: rương mở → kim cương bay vào túi → số nhảy
        tieng.ruong();
        setTimeout(() => ruong.classList.add("mo"), 250);
        const kc = k.khongPhaiBe ? 0 : Math.max(0, k.kc || 0);
        setTimeout(() => {
          const bay = Math.min(12, Math.max(kc, 3));
          for (let i = 0; i < bay; i++) setTimeout(() => {
            const v = tao("span", "ttKcBay", "💎"); v.style.setProperty("--x", (Math.random() * 120 - 60) + "px");
            ruong.appendChild(v); setTimeout(() => v.remove(), 900); tieng.kc(i);
          }, i * 90);
          let dem = 0; const buoc = Math.max(1, Math.ceil(kc / 12));
          const iv = setInterval(() => { dem = Math.min(kc, dem + buoc); so.textContent = String(dem); tui.classList.remove("nay"); void tui.offsetWidth; tui.classList.add("nay"); if (dem >= kc) clearInterval(iv); }, 90);
          if (!kc) so.textContent = "0";
        }, 650);
        if (ty >= 0.8) setTimeout(() => { phaoGiay(); tieng.keng(); }, 900);
        if (goc.matchMedia && goc.matchMedia("(pointer: fine)").matches) setTimeout(() => (nutPhu[0] || nut).focus({ preventScroll: true }), 700);
      }

      function veXemLai() {
        const bang = tao("ol", "ttXemLai");
        lichSu.forEach((x, i) => {
          const li = tao("li", x.dung ? "dung" : "sai");
          const dau = tao("div", "ttXlCau"); dau.append(tao("span", "ttXlDau", x.dung ? "✓" : "✗"), tao("b", "", (x.hoiLai ? "🔁 " : "") + x.noiDung + (x.hinhChu ? " " + x.hinhChu : "")));
          li.appendChild(dau);
          const tl = tao("p", "ttXlDap");
          if (!x.dung && x.dapAn[x.chon] != null) tl.append("Con chọn: ", tao("s", "", x.dapAn[x.chon]), " · ");
          tl.append("Đáp án: ", tao("b", "", x.dapAn[x.dapAnDung] != null ? x.dapAn[x.dapAnDung] : "…"));
          li.appendChild(tl);
          if (x.loiGiai) li.appendChild(tao("p", "ttXlGiai", "💡 " + x.loiGiai));
          bang.appendChild(li);
        });
        return bang;
      }

      function phaoGiay() {
        const mau = ["#ffc24b", "#ff8a3d", "#6fe3a0", "#7fb5ff", "#ff7aa8", "#fff6dc"];
        for (let i = 0; i < 60; i++) {
          const p = tao("i", "ttGiay");
          p.style.left = Math.random() * 100 + "%"; p.style.background = mau[i % mau.length];
          p.style.animationDelay = (Math.random() * 0.6) + "s"; p.style.setProperty("--xoay", (Math.random() * 720 - 360) + "deg");
          goc0.appendChild(p); setTimeout(() => p.remove(), 3200);
        }
      }

      // ---------------- Phím (máy tính) ----------------
      function phim(e) {
        if (dong || e.altKey || e.ctrlKey || e.metaKey) return;
        if (goc0.classList.contains("ketQua")) { if (e.key === "Enter") { const n = goc0.querySelector(".ttKq .ttNut"); if (n && doc.activeElement !== n) { e.preventDefault(); n.click(); } } return; }
        if (docDang && !docDang.xong && (e.key === " " || e.key === "Enter")) { e.preventDefault(); skAm.mo(); hienDa(docDang); return; }
        if (blDang && (e.key === " " || e.key === "Enter")) { if (doc.activeElement && doc.activeElement.classList && doc.activeElement.classList.contains("ttBoQua")) return; e.preventDefault(); blDang.sang(); return; }
        const so = Number(e.key);
        if (Number.isInteger(so) && so >= 1 && so <= 6 && !daCham) { const b = goc0.querySelector('.ttDa[data-i="' + (so - 1) + '"]'); if (b && !b.disabled) { e.preventDefault(); chonDa(so - 1); } return; }
        if (e.key === "Escape" && !t.batBuoc) dongMan("bo", null);
      }
      doc.addEventListener("keydown", phim, true);

      function dongMan(lyDo, ketQua) {
        if (dong) return; dong = true;
        cancelAnimationFrame(raf); clearInterval(dhHen);
        if (docDang) { docDang.hen.forEach(clearTimeout); docDang = null; }
        if (blDang) { blDang.hen.forEach(clearTimeout); blDang = null; }
        if (skAm) { skAm.dungNhac(); skAm.dungTicTac(); }
        doc.removeEventListener("keydown", phim, true);
        dungDoc();
        goc0.classList.add("tat");
        setTimeout(() => goc0.remove(), 250);
        xong({ ketQua, dong: lyDo });
      }

      // bắt đầu
      veDongHo();
      if (!cau || viTri >= tong) ketThuc(); else veCau();
    });
  }

  goc.KC_TT = { moLuot, _tieng: tieng };
})(typeof window !== "undefined" ? window : globalThis);
// 20/11/2026 - BƯỚC: TC_D34B (khối câu hỏi + màn kết quả dùng chung, màn ôn sau trận Đấu Trường)
// 20/11/2026 12:xx - BƯỚC: TC_D34B sửa (người dùng): đồng hồ đếm ngược + 💎 còn nhận giảm dần, khoản Tối đa / Sai / Thời gian
// 20/11/2026 12:4x - BƯỚC: TC_D34B sửa (người dùng): chạm đáp án là chấm, báo đúng / sai ngắn rồi tự sang câu; 📖 Xem lại đáp án ở màn nhận
// 21/11/2026 - BƯỚC: KC_09A: tiếng + đọc câu chuyển sang chung/am_thanh.js (chống nuốt câu, chọn giọng, câu đọc tệp / doc:vi)
// 24/11/2026 - BƯỚC: KC_03C4b: sanKhau (Theo môn): đọc câu xong mới hiện 4 đáp án, nhạc lúc đọc, tích tắc lúc chờ, bình luận + nút bỏ qua
// 24/11/2026 - BƯỚC: KC_03C4: nutThem ("▶ Chơi tiếp N câu" của Theo môn), loiMoDau; 🪙 xu vàng mỗi câu đúng (chép đúng phần KC_03C2 chưa merge)
