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
                goi: { traLoi(luotId, viTri, chon, giay, hanhVi), ketThuc(luotId),     // trả { ok, ... } như dt_may_chu_sb.js
                                                 // KC_11C: hanhVi { thua, thuaDon, som, an, nguongD3 } -> RPC p_hanh_vi (null: không có module)
                       chuoi(luotId) },  // KC_03C7b, tuỳ chọn: RPC kc_tt_chuoi_luot -> dòng 🔥 ở màn kết quả
                tieuDe, phuDe, batBuoc (true: không có nút ✕), nutKet ("Về thung lũng"),
                xacNhanDong ({ tieuDe, chu, co, khong }, TC_D34D: ✕ / Esc hỏi lại trước khi đóng; không có thì đóng luôn),
                goc (tiền tố đường dẫn hình câu, vd "" ở kc/, "../" ở kc/dt/), lop (lớp bé: ≤ 3 có 🔊 đọc câu),
                hoSo (ngoại hình bé, chung/nv_ve.js: có thì vẽ bé cổ vũ ở cột trái máy tính),
                nutThem ([{ chu, ma }]: nút thêm ở màn kết quả, bấm thì đóng màn với dong = ma; KC_03C4 "▶ Chơi tiếp N câu"),
                loiMoDau (Cô Cú nói ở câu đầu, mặc định "Mình cùng ôn lại nhé!"),
                sanKhau ({ am: KC_TM_AM }, KC_03C4b Theo môn: đọc câu xong mới hiện 4 đáp án + nhạc lúc đọc, tích tắc lúc chờ,
                         bình luận đúng / sai + lời giải + nút "⏭ Bỏ qua"; không có thì như cũ)
              }) -> Promise<{ ketQua | null, dong: "xong" | "bo" | "loi" | "phan_hoi" | ma của nutThem, bamBua }>
              KC_11B: bamBua = kết luận chống bấm bừa trên máy (chỉ ghi). ketQua.bamBua của máy chủ { ketLuan: "bua", catThuong: true }
              -> màn ⛔ (nút 🙋 thay nút kết; goi.phanHoi(luotId, ketQua) nếu trang có; KC_11D: không có thì goi.rpc(tenHam, thamSo) +
              chung/khang_nghi.js (bé kháng nghị, module chung, nguồn "bb") mở hộp bé tự viết lý do ngay trong màn; thiếu cả hai thì dong = "phan_hoi").
   CẦN NẠP TRƯỚC: chung/gio_bai.js (KC_GIO_BAI: trừ 💎 theo giờ, module chung toàn app);
              chung/bam_bua.js (KC_BAM_BUA, KC_11B; thiếu thì không ghi chạm).
   BƯỚC: TC_D34B (phần 2: dùng module giờ chung); KC_03C4 (nutThem, loiMoDau, 🪙 xu vàng mỗi câu đúng); KC_03C4b (sanKhau);
              KC_03C7 (Tổng hợp: 💎 đang chạy × heSo của lượt, khoản "🌈 Thưởng Tổng hợp × 1,5");
              KC_03C7b (dòng 🔥 chuỗi ngày ở màn kết quả: goi.chuoi + KC_TT.veChuoi dùng chung cho Tốc độ / Chinh phục)
   NGÀY: 20/11/2026 · sửa 24/11/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const doc = goc.document;
  const ngu = ms => new Promise(r => setTimeout(r, ms));
  const tao = (the, lop, chu) => { const e = doc.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; };
  const TEN_KHOAN = { hoan_thanh: "Hoàn thành", gioi: "Giỏi", thuoc_moi: "Thuộc mới", nhan_tong_hop: "🌈 Thưởng Tổng hợp", toi_da: "Tối đa", sai: "Sai", thoi_gian: "⏱ Thời gian" };
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
      const taoDh = l => (l && l.giayTong > 0 ? { tong: +l.giayTong, gioi: Math.max(0, Math.min(+l.giayGioi || 0, +l.giayTong - 1)), daDung: +l.giayDaDung || 0, kcToiDa: Number.isFinite(+l.kcToiDa) && l.kcToiDa != null ? +l.kcToiDa : null, tru: +l.truMoiSai || 0, heSo: +l.heSo > 0 ? +l.heSo : 1 } : null);
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
      // KC_11B: chống bấm bừa (chung/bam_bua.js, Hướng Dẫn 1.8B) — CHỈ GHI TRÊN MÁY: đếm chạm vào vùng đáp án (kể cả lúc nút tắt),
      // không gửi máy chủ, không hiện gì, không đổi cách chấm. Kết luận trả kèm khi đóng màn (bamBua). Thiếu module: bỏ qua.
      const BB = goc.KC_BAM_BUA || null;
      // KC_11E: số admin sửa ở Quản trị › 🧠 đến kèm lượt (luot.bb của kc_tt_luot_json); máy chủ cũ chưa gửi thì dùng mặc định
      let bbCh = null;
      try { bbCh = BB ? BB.cauHinh(luot && luot.bb && typeof luot.bb === "object" ? luot.bb : null) : null; } catch (e) { bbCh = BB ? BB.cauHinh() : null; }
      const bbGhi = BB ? BB.taoBoGhi({ cauHinh: bbCh }) : null, bbDs = [];
      let bbHv = null, bbPhim = false, bbGiay = 0, bbNguong = 0;
      const bbGo = bbGhi ? BB.ganVung(goc0, bbGhi, e => {
        if (goc0.classList.contains("ketQua")) return false;
        const v = goc0.querySelector(".ttCau .ttDap"); if (!v) return false;
        const r = v.getBoundingClientRect();
        return r.width > 0 && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      }) : null;
      const bbMo = () => { if (bbGhi) bbGhi.mo(luc0); };
      // KC_11C (đặc tả 5.1): NHẮC NHẸ, KHÔNG CHẶN BẤM. sau_lien (2) câu liền có D1 / D2 -> bong bóng Cô Cú giay_hien giây,
      // tối đa toi_da (2) lần mỗi lượt; lần sau phải đủ sau_lien câu MỚI kể từ lần nhắc trước. Bé lớp ≤ 3: máy đọc lời nhắc
      // (trừ khi câu kế là câu nghe / Theo môn đang đọc bình luận thành tiếng, để tiếng không đè nhau). Nơi tắt nhắc
      // (noi.<cheDo>.nhac = false) thì không hiện. Cấu hình: mặc định KC_BAM_BUA.MAC_DINH (Quản trị ở KC_11E).
      let bbNhacTu = 0, bbDaNhac = 0, bbBongBong = null;
      function bbXetNhac(kq) {
        if (!BB || !bbDs.length || dong) return false;
        const ch = bbCh, noi = ch.noi && ch.noi[luot.cheDo];
        if (noi && noi.nhac === false) return false;
        // KC_11E: chế độ của nơi (máy chủ tính sẵn trong luot.bb.che_do) là "tat" / "chi_ghi" thì không nhắc
        if (luot.bb && (luot.bb.che_do === "tat" || luot.bb.che_do === "chi_ghi")) return false;
        const toiDa = Math.max(0, +ch.nhac.toi_da || 0);
        if (bbDaNhac >= toiDa || !BB.canNhac(bbDs.slice(bbNhacTu), ch)) return false;
        const ds = Array.isArray(ch.nhac.chu) ? ch.nhac.chu : [];
        const chu = String(ds[Math.min(bbDaNhac, ds.length - 1)] || "Cô Cú nhắc con nhé! Mình đọc kỹ câu hỏi rồi hãy chọn nha 😊");
        bbDaNhac++; bbNhacTu = bbDs.length;
        if (bbBongBong) bbBongBong.remove();
        const b = tao("div", "ttBbNhac"); b.setAttribute("role", "status"); b.setAttribute("aria-live", "polite");
        b.append(tao("span", "ttBbNhacCu", "🦉"), tao("p", "", chu));
        goc0.appendChild(b); bbBongBong = b;
        setTimeout(() => { b.classList.add("het"); setTimeout(() => { b.remove(); if (bbBongBong === b) bbBongBong = null; }, 350); }, Math.max(1, +ch.nhac.giay_hien || 2.5) * 1000);
        const A = AM();
        const docDuoc = A && t.lop != null && t.lop <= 3 && !(kq && kq.cau && coAmThanh(kq.cau)) && !(sk && skAm.nhip().binhLuanThanhTieng);
        if (docDuoc) { try { A.doc(chu.replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, ""), { lang: "vi-VN" }); } catch (e) { /* bỏ qua */ } }
        return true;
      }
      $(".ttTieuDe b").textContent = t.tieuDe;
      $(".ttTieuDe small").textContent = t.phuDe || "";
      $(".ttDong").hidden = !!t.batBuoc;
      $(".ttDong").addEventListener("click", () => boMan());
      // TC_D34D: xacNhanDong ({ tieuDe, chu, co, khong }) -> ✕ / Esc hỏi lại trước khi đóng (vd ôn sau trận: thoát là mất 💎).
      // Đồng hồ bài dừng lúc hỏi, chạy tiếp khi bé chọn ở lại. Đang ở màn kết quả thì đóng luôn.
      let hoiDong = null;
      function boMan() {
        if (dong || hoiDong) return;
        if (!t.xacNhanDong || goc0.classList.contains("ketQua")) { dongMan("bo", null); return; }
        const dangChay = dhChay; chayDh(false);
        hoiDong = hoi(Object.assign({ cha: goc0, bieuTuong: "🚪", co: "🚪 Thoát", khong: "↩ Ôn tiếp", nutChinh: "khong" }, t.xacNhanDong));
        hoiDong.hua.then(kq => {
          hoiDong = null;
          if (kq === "co") { dongMan("bo", null); return; }
          if (dangChay && !dong) { luc0 = performance.now(); chayDh(true); }
        });
      }

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
          // KC_03C7: Tổng hợp nhân hệ số (1,5) sau cùng, làm tròn xuống, như máy chủ
          kcO.querySelector("b").textContent = String(Math.floor(goc.KC_GIO_BAI.kcSauGio(truoc, dh.kcToiDa, giayDung(), dh.gioi, dh.tong) * dh.heSo));
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
        if (bbGhi) {
          bbGhi.cauMoi(); bbHv = null; bbPhim = false; bbNguong = 0;
          // ngưỡng D3 = 30 % giờ bé giỏi của câu (giờ bài chung); Theo môn đọc câu ở pha riêng nên chỉ tính phần đáp án
          try { if (goc.KC_GIO_BAI) bbNguong = BB.nguongD3(goc.KC_GIO_BAI.tinh([{ noiDung: sk ? "" : cau.noiDung, dapAn: cau.dapAn || [], muc: cau.muc || "vua", coHinh: !sk && !!(cau.hinh || cau.hinhChu) }], t.lop).p90.gioi, bbCh); } catch (e) { bbNguong = 0; }
        }
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
        luc0 = performance.now(); bbMo();
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
        luc0 = performance.now(); bbMo();
        chayDh(true);
        skAm.batTicTac();
      }

      function chonDa(i, quaPhim) {
        if (daCham || dangGui) return;
        bbPhim = !!quaPhim;
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
        if (bbGhi && !bbHv) { bbHv = bbGhi.chon(tBat, { phim: bbPhim }); bbGiay = giay; } // KC_11B: lần chọn đầu của câu (Thử lại không tính lại)
        chayDh(false);
        if (skAm) skAm.dungTicTac();
        let kq = null;
        for (let lan = 0; lan < 3; lan++) {
          // KC_11C: gửi kèm hành vi bấm (số chạm thừa / dồn / sớm, ẩn trang, ngưỡng D3 của câu) cho máy chủ ghi + kết luận lượt
          try { kq = await goi.traLoi(luot.id, viTri, chon, giay, bbHv ? Object.assign({ nguongD3: bbNguong }, bbHv) : null); } catch (e) { kq = null; }
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
        let keNghe = !!(kq.cau && coAmThanh(kq.cau)) || !!(sk && skAm.nhip().binhLuanThanhTieng); // KC_03C4b: bình luận đọc thành tiếng thay lời khen // câu kế là câu nghe: không nói lời khen / động viên (câu nghe tự đọc ngay, lời sẽ đè lên) (người dùng 21/11/2026)
        daTraLoi[viTri] = { dung, hoiLai: !!(cau && cau.hoiLai) };
        if (bbHv) bbDs.push({ hanhVi: bbHv, giay: bbGiay, nguongD3: bbNguong, dung, soDapAn: (cau.dapAn || []).length, hoiLai: !!(cau && cau.hoiLai), o: chon });
        const nhac = bbXetNhac(kq); // KC_11C: 2 câu liền bấm dồn / chạm tức thì -> Cô Cú nhắc (không khen câu này)
        if (nhac) keNghe = true;
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
        if (nhac) { coCu("Con đọc kỹ rồi hãy chọn nhé!"); tuThe = "dung"; } // máy tính: cột Cô Cú không khen câu bấm dồn (lời nhắc ở bong bóng)
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
        // KC_11B (đặc tả chống bấm bừa 5.2): máy chủ (từ KC_11C) báo lượt bấm bừa bị cắt thưởng -> màn ⛔ riêng
        if (k.bamBua && k.bamBua.ketLuan === "bua" && k.bamBua.catThuong === true) { veKetQuaBua(k); return; }
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
            : (TEN_KHOAN[x.ma] || x.ma) + (x.so ? " × " + soVi(x.so) : "");
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
        // KC_03C7b: 🔥 chuỗi ngày (trang có goi.chuoi)
        if (goi && typeof goi.chuoi === "function") { try { veChuoi(kq, Promise.resolve(goi.chuoi(luot.id))); } catch (e) { /* bỏ qua */ } }
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
        // KC_08F2: vừa lên sao / danh hiệu thì màn chúc mừng (sau rương + kim cương bay); trang truyền goi.danhHieu = rpc
        if (goi && typeof goi.danhHieu === "function" && goc.KC_DANH_HIEU) goc.KC_DANH_HIEU.xet(goi.danhHieu, { tre: 2600 });
        if (ty >= 0.8) setTimeout(() => { phaoGiay(); tieng.keng(); }, 900);
        if (goc.matchMedia && goc.matchMedia("(pointer: fine)").matches) setTimeout(() => (nutPhu[0] || nut).focus({ preventScroll: true }), 700);
      }

      /* KC_11B: MÀN KẾT QUẢ LƯỢT ⛔ BẤM BỪA (Thiet_Ke_Chong_Bam_Bua.md 5.2). Không rương, không 💎 bay, không màu đỏ.
         Người dùng 27/11/2026: "nút nhận quà đổi thành nút phản hồi" -> chỗ nút kết (t.nutKet) là nút chính 🙋;
         "Thôi ạ" (nút phụ) đóng màn như nút kết cũ. 🙋: goi.phanHoi(luotId, ketQua) nếu trang có (hộp viết lý do, KC_11D),
         không có thì đóng màn với dong = "phan_hoi". Chuỗi ngày 🔥 vẫn hiện (vẫn tính, người dùng chốt). */
      function veKetQuaBua(k) {
        const s = $(".ttCau"); s.innerHTML = "";
        const n = k.soCauGoc || 0, d = k.dungGoc || 0;
        const kq = tao("div", "ttKq ttKqBua");
        kq.appendChild(tao("div", "ttBbCu", "🦉"));
        kq.appendChild(tao("h2", "ttBbTieuDe", "Lần này con chọn vội quá!"));
        kq.appendChild(tao("p", "ttBbChu", "Cô Cú thấy con bấm liên tục mà chưa kịp đọc câu, nên lượt này chưa có thưởng."));
        kq.appendChild(tao("p", "ttBbChu", "Lượt sau con đọc kỹ từng câu rồi chọn là có 💎 ngay nhé! 💪"));
        if (n) kq.appendChild(tao("p", "ttBbDiem", "Con đúng " + d + " / " + n + " câu"));
        if (goi && typeof goi.chuoi === "function") { try { veChuoi(kq, Promise.resolve(goi.chuoi(luot.id))); } catch (e) { /* bỏ qua */ } }
        const hang = tao("div", "ttHangNut");
        const thoi = tao("button", "ttNut ttNutPhu ttBbThoi", "Thôi ạ"); thoi.type = "button";
        thoi.addEventListener("click", () => dongMan("xong", k));
        const ph = tao("button", "ttNut tiep ttBbPhanHoi", "🙋 Con có suy nghĩ thật mà!"); ph.type = "button";
        ph.addEventListener("click", () => {
          if (goi && typeof goi.phanHoi === "function") { try { goi.phanHoi(luot.id, k); return; } catch (e) { /* đóng màn */ } }
          // KC_11D: BÉ KHÁNG NGHỊ (module chung chung/khang_nghi.js, nguồn "bb", tham chiếu = mã lượt; máy chủ đã tự mở kháng nghị khi
          // cắt thưởng) qua goi.rpc của trang. Gửi xong: nút thành "💌 Đã gửi", "Thôi ạ" thành nút kết thường ngày; kết quả Cô Cú
          // báo ở Trang chủ (📬). Bé đóng hộp không gửi: màn vẫn như cũ.
          const KN = goc.KC_KHANG_NGHI;
          if (KN && goi && typeof goi.rpc === "function") {
            KN.moHop({ rpc: goi.rpc, nguon: "bb", thamChieu: luot.id, cha: goc0, cauHoi: "Con kể Cô Cú nghe nhé, sao con chọn nhanh vậy?",
                       moTa: (k.monTen ? "Bài " + k.monTen : t.tieuDe) + " vừa rồi" }).then(r => {
              if (!r || !r.daGui) return;
              ph.disabled = true; ph.textContent = "💌 Đã gửi Cô Cú"; ph.className = "ttNut ttNutPhu ttBbPhanHoi";
              thoi.textContent = t.nutKet; thoi.className = "ttNut tiep ttBbThoi"; hang.appendChild(thoi); thoi.focus({ preventScroll: true });
              coCu("Cô Cú sẽ báo con ở 📬 Hòm thư nhé! 💌");
            });
            return;
          }
          dongMan("phan_hoi", k);
        });
        const nutPhu = (t.nutThem || []).map(x => { const b = tao("button", "ttNut ttNutPhu", x.chu); b.type = "button"; b.addEventListener("click", () => dongMan(x.ma, k)); return b; });
        let bang = null;
        if (lichSu.length) {
          const xem = tao("button", "ttNut ttNutPhu", "📖 Xem lại đáp án"); xem.type = "button"; xem.setAttribute("aria-expanded", "false");
          bang = veXemLai(); bang.hidden = true;
          xem.addEventListener("click", () => { bang.hidden = !bang.hidden; xem.setAttribute("aria-expanded", String(!bang.hidden)); xem.textContent = bang.hidden ? "📖 Xem lại đáp án" : "📖 Ẩn đáp án"; if (!bang.hidden) bang.scrollIntoView({ block: "start", behavior: "smooth" }); });
          hang.appendChild(xem);
        }
        nutPhu.forEach(b => hang.appendChild(b));
        hang.appendChild(thoi); hang.appendChild(ph);
        kq.appendChild(hang); if (bang) kq.appendChild(bang);
        s.appendChild(kq);
        coCu("Lần sau mình đọc kỹ nhé, Cô Cú tin con! 💪");
        tuThe = "dung";
        if (goc.matchMedia && goc.matchMedia("(pointer: fine)").matches) setTimeout(() => thoi.focus({ preventScroll: true }), 700);
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
        if (dong || hoiDong || e.altKey || e.ctrlKey || e.metaKey) return;
        if (goc0.classList.contains("ketQua")) { if (e.key === "Enter") { const n = goc0.querySelector(".ttKq .ttNut"); if (n && doc.activeElement !== n) { e.preventDefault(); n.click(); } } return; }
        if (docDang && !docDang.xong && (e.key === " " || e.key === "Enter")) { e.preventDefault(); skAm.mo(); hienDa(docDang); return; }
        if (blDang && (e.key === " " || e.key === "Enter")) { if (doc.activeElement && doc.activeElement.classList && doc.activeElement.classList.contains("ttBoQua")) return; e.preventDefault(); blDang.sang(); return; }
        const so = Number(e.key);
        if (Number.isInteger(so) && so >= 1 && so <= 6 && !daCham) { const b = goc0.querySelector('.ttDa[data-i="' + (so - 1) + '"]'); if (b && !b.disabled) { e.preventDefault(); chonDa(so - 1, true); } return; }
        if (e.key === "Escape" && !t.batBuoc) boMan();
      }
      doc.addEventListener("keydown", phim, true);

      function dongMan(lyDo, ketQua) {
        if (dong) return; dong = true;
        cancelAnimationFrame(raf); clearInterval(dhHen);
        if (docDang) { docDang.hen.forEach(clearTimeout); docDang = null; }
        if (blDang) { blDang.hen.forEach(clearTimeout); blDang = null; }
        if (skAm) { skAm.dungNhac(); skAm.dungTicTac(); }
        doc.removeEventListener("keydown", phim, true);
        if (hoiDong) hoiDong.tat();
        dungDoc();
        if (bbGo) bbGo();
        goc0.classList.add("tat");
        setTimeout(() => goc0.remove(), 250);
        // KC_11B: bamBua = kết luận trên máy (chỉ ghi, chưa ai dùng; máy chủ KC_11C mới là chuẩn) + từng câu
        let bamBua = null;
        try { if (BB && bbDs.length) bamBua = Object.assign(BB.ketLuan(bbDs, bbCh), { ds: bbDs }); } catch (e) { bamBua = null; }
        xong({ ketQua, dong: lyDo, bamBua });
      }

      // bắt đầu
      veDongHo();
      if (!cau || viTri >= tong) ketThuc(); else veCau();
    });
  }

  /* KC_03C7b: dòng 🔥 CHUỖI NGÀY ở màn kết quả (dùng chung: Theo môn, Tổng hợp, ôn sau trận, Tốc độ, Chinh phục).
     hua: Promise của RPC kc_tt_chuoi_luot -> { thanhCong, chuoi: {soNgay, mocToi, kcMocToi, conNgay}, ngayMoi, thuong: {moc, kc, vang} | null }.
     Vẽ vào khung (trước phần tử truoc nếu có). Máy chủ chưa có hàm / mất mạng: không vẽ gì. */
  function veChuoi(khung, hua, truoc) {
    if (!khung || !hua || typeof hua.then !== "function") return;
    const o = tao("div", "ttChuoiKq"); o.hidden = true;
    if (truoc && truoc.parentNode === khung) khung.insertBefore(o, truoc); else khung.appendChild(o);
    hua.then(r => {
      const c = r && r.thanhCong === true && r.chuoi;
      if (!c || !(c.soNgay > 0)) { o.remove(); return; }
      const so = x => Number(x || 0).toLocaleString("vi-VN");
      const th = r.thuong;
      o.appendChild(tao("span", "ttChuoiBt", "🔥"));
      const chu = tao("div", "ttChuoiChu");
      if (th && (th.kc > 0 || th.vang > 0)) {
        o.classList.add("thuong");
        chu.appendChild(tao("b", "", (th.soNgay || c.soNgay) + " ngày liền! " + (th.kc > 0 ? "+" + so(th.kc) + " 💎" : "+" + so(th.vang) + " 🪙")));
        if (!(th.kc > 0)) chu.appendChild(tao("small", "", "Hôm nay con đã đủ 💎 nên quà mốc đổi thành xu vàng"));
        const am = AM(); if (am && am.tieng && typeof am.tieng.thuong === "function") setTimeout(() => { try { am.tieng.thuong(); } catch (e) { /* bỏ qua */ } }, 900);
      } else if (r.ngayMoi) {
        chu.appendChild(tao("b", "", c.soNgay >= 2 ? c.soNgay + " ngày liền! Lửa cháy tiếp rồi!" : "Con đã nhóm lửa hôm nay!"));
      } else {
        chu.appendChild(tao("b", "", c.soNgay + " ngày liền"));
      }
      if (c.mocToi && c.kcMocToi > 0) chu.appendChild(tao("small", "", "Còn " + c.conNgay + " ngày nữa: 🎁 +" + so(c.kcMocToi) + " 💎"));
      o.appendChild(chu);
      o.hidden = false;
    }).catch(() => o.remove());
  }

  /* TC_D34D: HỘP HỎI 2 NÚT dùng chung (bảng mời ôn sau trận, hỏi lại trước khi thoát màn ôn).
     hoi({ cha (mặc định body), bieuTuong, tieuDe, chu, co, khong, nutChinh ("co" | "khong") }) -> { hua: Promise<"co" | "khong" | "tat">, tat() }
     Esc / chạm nền = "khong"; tat() đóng lặng (vd trận khác vừa mở). Điện thoại: 2 nút xếp dọc; máy tính: cạnh nhau. */
  function hoi(tc) {
    const t = Object.assign({ cha: doc.body, bieuTuong: "", tieuDe: "", chu: "", co: "Có", khong: "Không" }, tc || {});
    let xong, daDong = false;
    const hua = new Promise(r => { xong = r; });
    const o = tao("div", "ttHoi" + (t.cha === doc.body ? " ttHoiTrang" : ""));
    o.setAttribute("role", "alertdialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", t.tieuDe || t.chu);
    const hop = tao("div", "ttHoiHop");
    if (t.bieuTuong) hop.appendChild(tao("div", "ttHoiBt", t.bieuTuong));
    if (t.tieuDe) hop.appendChild(tao("b", "ttHoiTieuDe", t.tieuDe));
    if (t.chu) hop.appendChild(tao("p", "ttHoiChu", t.chu));
    const hang = tao("div", "ttHoiNut");
    // nutChinh: "co" (mặc định) | "khong" — nút nổi bật (xanh, đứng trước, được chọn sẵn); vd hỏi thoát thì "↩ Ôn tiếp" nổi bật
    const chinhKhong = t.nutChinh === "khong";
    const nCo = tao("button", (chinhKhong ? "ttNut ttHoiPhu" : "ttNut tiep") + " ttHoiCo", t.co);
    const nKhong = tao("button", (chinhKhong ? "ttNut tiep" : "ttNut ttHoiPhu") + " ttHoiKhong", t.khong);
    nCo.type = nKhong.type = "button";
    if (chinhKhong) { hang.appendChild(nKhong); hang.appendChild(nCo); } else { hang.appendChild(nCo); hang.appendChild(nKhong); }
    hop.appendChild(hang); o.appendChild(hop);
    function dongHoi(kq) {
      if (daDong) return; daDong = true;
      doc.removeEventListener("keydown", phimHoi, true);
      o.classList.add("tat"); setTimeout(() => o.remove(), 200);
      xong(kq);
    }
    function phimHoi(e) { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); dongHoi("khong"); } }
    nCo.addEventListener("click", () => dongHoi("co"));
    nKhong.addEventListener("click", () => dongHoi("khong"));
    o.addEventListener("click", e => { if (e.target === o) dongHoi("khong"); });
    doc.addEventListener("keydown", phimHoi, true);
    t.cha.appendChild(o);
    setTimeout(() => { try { (chinhKhong ? nKhong : nCo).focus({ preventScroll: true }); } catch (e) { /* bỏ qua */ } }, 30);
    return { hua, tat: () => dongHoi("tat") };
  }

  goc.KC_TT = { moLuot, veChuoi, hoi, _tieng: tieng };
})(typeof window !== "undefined" ? window : globalThis);
// 20/11/2026 - BƯỚC: TC_D34B (khối câu hỏi + màn kết quả dùng chung, màn ôn sau trận Đấu Trường)
// 20/11/2026 12:xx - BƯỚC: TC_D34B sửa (người dùng): đồng hồ đếm ngược + 💎 còn nhận giảm dần, khoản Tối đa / Sai / Thời gian
// 20/11/2026 12:4x - BƯỚC: TC_D34B sửa (người dùng): chạm đáp án là chấm, báo đúng / sai ngắn rồi tự sang câu; 📖 Xem lại đáp án ở màn nhận
// 21/11/2026 - BƯỚC: KC_09A: tiếng + đọc câu chuyển sang chung/am_thanh.js (chống nuốt câu, chọn giọng, câu đọc tệp / doc:vi)
// 24/11/2026 - BƯỚC: KC_03C4b: sanKhau (Theo môn): đọc câu xong mới hiện 4 đáp án, nhạc lúc đọc, tích tắc lúc chờ, bình luận + nút bỏ qua
// 24/11/2026 - BƯỚC: KC_03C4: nutThem ("▶ Chơi tiếp N câu" của Theo môn), loiMoDau; 🪙 xu vàng mỗi câu đúng (chép đúng phần KC_03C2 chưa merge)
// 25/11/2026 - BƯỚC: KC_08F2 (goi.danhHieu = rpc: màn kết quả gọi KC_DANH_HIEU.xet, chúc mừng lên sao / danh hiệu)
// 27/11/2026 - BƯỚC: TC_D34D (KC_TT.hoi: hộp hỏi 2 nút dùng chung; xacNhanDong: ✕ hỏi lại trước khi thoát, đồng hồ dừng lúc hỏi)
// 27/11/2026 - BƯỚC: KC_11B (chống bấm bừa: ghi chạm vùng đáp án chỉ trên máy, trả bamBua khi đóng; màn ⛔ khi máy chủ báo ketQua.bamBua cắt thưởng: nút 🙋 thay nút nhận)
// 27/11/2026 - BƯỚC: KC_11C (gửi hanhVi kèm traLoi cho máy chủ; bong bóng Cô Cú nhắc khi 2 câu liền bấm dồn / chạm tức thì, tối đa 2 lần, không chặn bấm)
// 27/11/2026 - BƯỚC: KC_11D (nút 🙋 ở màn ⛔ mở hộp bé kháng nghị chung/khang_nghi.js (nguồn "bb") qua goi.rpc; gửi xong nút thành "💌 Đã gửi")
// 28/11/2026 - BƯỚC: KC_11E (chống bấm bừa dùng số admin sửa ở Quản trị › 🧠, đến kèm luot.bb; nơi "tat" / "chi_ghi" không nhắc)
