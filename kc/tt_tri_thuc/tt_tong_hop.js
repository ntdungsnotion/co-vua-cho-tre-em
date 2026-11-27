/* ================================================================
   FILE: tt_tri_thuc/tt_tong_hop.js
   CHỨC NĂNG: 🌈 TỔNG HỢP của phân hệ THỬ THÁCH tri thức (đặc tả Thiet_Ke_On_The.md mục 4.2).
              Giống 📚 Theo môn, chỉ khác: MÁY CHỦ bốc ngẫu nhiên MỘT môn (lệch về môn nhiều điều cần ôn, môn vừa chơi
              giảm cơ hội), cả bộ một môn; thưởng × hệ số (mặc định 1,5) nhân sau cùng, làm tròn xuống.
              Sảnh: vòng quay môn (các môn đang mở) + dải môn có 🔔, chọn số câu, luật, khung thưởng (đã nhân hệ số),
              nhân vật bé + Cô Cú, nút "🎡 Quay môn!". Lượt dở hiện "▶ Chơi tiếp".
              Bấm Quay: máy chủ bốc môn + tạo lượt TRƯỚC, rồi màn vòng quay phủ toàn trang quay và dừng đúng môn đó
              (chỉ để vui), pháo giấy + "🎉 Môn …!", rồi vào khối câu hỏi chung KC_TT.moLuot với sanKhau (luật màn hỏi
              Theo môn: đọc câu xong mới hiện đáp án, nhạc, tích tắc, bình luận + Bỏ qua; người dùng chốt 24/11/2026).
              Điện thoại (< 900 px): 1 cột, nút Quay dính đáy. Máy tính (≥ 900 px): trái vòng quay to | phải số câu + luật + thưởng.
   DÙNG:      KC_TH.gan(phanTu, { ten, maPhien, goiRpc(ten, thamSo) -> Promise<json> })
   RPC:       kc_th_trang_chu, kc_th_bat_dau, kc_tt_tra_loi, kc_tt_ket_thuc (SQL repo_rieng supabase_kc03c7_tong_hop.sql).
   ÂM THANH:  như Theo môn: âm thanh chung KC_AM_THANH + âm thanh riêng Theo môn KC_TM_AM (nhạc đọc câu, tích tắc, bình luận).
   PHỤ THUỘC: chung/am_thanh.js, chung/gio_bai.js, tt_tri_thuc/tt_cau_hoi.js + .css, tt_theo_mon.css (bố cục .tm*),
              tt_theo_mon_am.js, tt_tong_hop.css, chung/nv_ve.js + nv_ho_so.js (có thì vẽ bé); nút .cpNut của tt_chinh_phuc.css.
   BƯỚC: KC_03C7
   NGÀY: 24/11/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const doc = goc.document;
  const ngu = ms => new Promise(r => setTimeout(r, ms));
  const tao = (the, lop, chu) => { const e = doc.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; };
  const nut = (lop, chu) => { const b = tao("button", lop, chu); b.type = "button"; return b; };
  const so = n => Number(n || 0).toLocaleString("vi-VN");
  const soVi = x => String(Math.round(x * 10) / 10).replace(".", ",");
  const AM = () => goc.KC_AM_THANH || null;
  const docLS = k => { try { return JSON.parse(goc.localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const ghiLS = (k, v) => { try { goc.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* chặn lưu: bỏ qua */ } };
  const MAU_O = ["#ffd6e8", "#ffe6c7", "#fff3b8", "#d4f7e2", "#d6ecff", "#e6dcff", "#ffdcdc", "#d9f7f7"];
  const giamDong = () => !!(goc.matchMedia && goc.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // Vòng quay: đĩa conic-gradient, mỗi môn một ô, biểu tượng ở giữa ô. Trả { goc, dia, quayToi(i) -> Promise }
  function veVong(dsMon) {
    const n = Math.max(1, dsMon.length), seg = 360 / n;
    const vong = tao("div", "thVong"); vong.setAttribute("aria-hidden", "true");
    const dia = tao("div", "thDia");
    dia.style.background = "conic-gradient(" + dsMon.map((m, i) => MAU_O[i % MAU_O.length] + " " + (i * seg) + "deg " + ((i + 1) * seg) + "deg").join(", ") + ")";
    dsMon.forEach((m, i) => {
      const o = tao("i", "thO");
      o.style.transform = "rotate(" + (i * seg + seg / 2) + "deg) translateY(calc(var(--th-co) * -0.33))";
      o.appendChild(tao("span", "", m.bieuTuong || "📘"));
      dia.appendChild(o);
    });
    vong.append(dia, tao("div", "thTam", "🦉"), tao("div", "thKim"));
    let hienTai = 0;
    function quayToi(i, giay) {
      const tam = i * seg + seg / 2;
      const lech = (Math.random() - 0.5) * seg * 0.5;
      const dich = ((360 - tam - (hienTai % 360)) % 360 + 360) % 360;
      hienTai += 360 * (giamDong() ? 1 : 5) + dich + lech;
      dia.style.setProperty("--th-giay", (giamDong() ? 0.9 : giay || 3.4) + "s");
      dia.classList.add("quay");
      void dia.offsetWidth;
      dia.style.transform = "rotate(" + hienTai + "deg)";
      return new Promise(r => {
        let xong = false;
        const het = () => { if (!xong) { xong = true; r(); } };
        dia.addEventListener("transitionend", het, { once: true });
        setTimeout(het, (giamDong() ? 0.9 : giay || 3.4) * 1000 + 300);
      });
    }
    return { goc: vong, dia, quayToi };
  }

  function gan(goc0, tc) {
    const S = { ten: tc.ten, maPhien: tc.maPhien, goi: tc.goiRpc, tc: null, soCau: 10, dangChoi: false };
    const KHOA = "kc_th_chon_" + String(S.ten || "").toLowerCase();
    S.soCau = (docLS(KHOA) || {}).soCau || 0;
    const hoSo = (goc.KC_NV_HO_SO && goc.KC_NV && S.ten) ? goc.KC_NV_HO_SO.doc(S.ten) : null;
    let rafBe = 0;

    function rpc(ten, ts) {
      return Promise.resolve(S.goi(ten, Object.assign({ p_ten: S.ten, p_ma_phien: S.maPhien }, ts || {})))
        .then(kq => (!kq ? { thanhCong: false, ma: "mang" } : (!kq.thanhCong && !kq.ma ? Object.assign({}, kq, { ma: kq.thongBao && /function|does not exist|schema cache/i.test(kq.thongBao) ? "chua_co" : "mang" }) : kq)))
        .catch(() => ({ thanhCong: false, ma: "mang" }));
    }
    async function rpcBen(ten, ts) {
      let kq = null;
      for (let lan = 0; lan < 3; lan++) {
        kq = await rpc(ten, ts);
        if (kq.thanhCong || (kq.ma && kq.ma !== "mang")) return kq;
        await ngu(800 * (lan + 1));
      }
      return kq;
    }
    const heSo = () => (S.tc && +S.tc.heSo > 0 ? +S.tc.heSo : 1.5);
    const kcGoc = n => Math.floor(((S.tc && S.tc.kcToiDa10) || 30) * n / 10);

    // ================= SẢNH =================
    async function veSanh() {
      cancelAnimationFrame(rafBe);
      goc0.innerHTML = '<div class="tmSanh thSanh"><p class="tmTai">Cô Cú đang lắc vòng quay… 🌈</p></div>';
      const kq = await rpcBen("kc_th_trang_chu");
      if (!kq.thanhCong) { veLoiSanh(kq); return; }
      S.tc = kq;
      const dsMon = kq.mon || [];
      const chon = (kq.soCauChon || [10, 15, 20, 30]).map(Number);
      if (chon.indexOf(S.soCau) < 0) S.soCau = kq.soCauMacDinh || chon[0] || 10;

      const s = tao("div", "tmSanh thSanh");
      const dau = tao("header", "tmDau");
      dau.append(tao("div", "tmSach", "🌈"));
      const td = tao("div", "tmTieuDe");
      td.append(tao("h2", "", "Tổng hợp"), tao("p", "", "Dám thử môn bất ngờ? Vòng quay chọn môn, con nhận thưởng gấp rưỡi!"));
      dau.appendChild(td);
      const chip = tao("div", "tmChip");
      chip.append(tao("span", "", "🪙 " + so(kq.viVang)), tao("span", "", "💎 Hôm nay " + so(kq.daNhanHomNay) + " / " + so(kq.tranNgay)));
      if (kq.luotHomNay > 0) chip.append(tao("span", "", "✅ " + kq.luotHomNay + " lượt hôm nay"));
      dau.appendChild(chip);
      s.appendChild(dau);

      const ld = kq.luotDang;
      if (ld) {
        const k = tao("div", "tmDo");
        k.append(tao("span", "tmDoBt", ld.monBieuTuong || "🌈"));
        const ch = tao("div", "tmDoChu");
        ch.append(tao("b", "", "Con đang dở lượt " + (ld.monTen || "Tổng hợp")), tao("small", "", "Câu " + Math.min(ld.viTri + 1, ld.tong) + " / " + ld.tong + " · lượt giữ 30 phút"));
        k.appendChild(ch);
        const tiep = nut("cpNut chinh tmNutTiep", "▶ Chơi tiếp");
        tiep.addEventListener("click", () => batDau(ld.soCau, false));
        k.appendChild(tiep);
        s.appendChild(k);
      }

      const than = tao("div", "tmThan");
      // --- trái: vòng quay + dải môn
      const trai = tao("section", "thKhoiQuay");
      trai.append(tao("h3", "", "🎡 Vòng quay môn"), tao("p", "", "Vòng quay dừng ở môn nào, con thử thách môn đó!"));
      if (dsMon.length) {
        trai.appendChild(veVong(dsMon).goc);
        const dai = tao("div", "thDaiMon");
        dsMon.forEach(m => {
          const sp = tao("span"); sp.append(m.bieuTuong || "📘", " " + m.ten);
          if (m.toiHan > 0) sp.appendChild(tao("b", "", "🔔" + m.toiHan));
          dai.appendChild(sp);
        });
        trai.appendChild(dai);
        if (dsMon.some(m => m.toiHan > 0)) trai.appendChild(tao("p", "thMeo", "🔔 Môn có nhiều điều cần ôn sẽ dễ trúng hơn."));
      } else trai.appendChild(tao("p", "tmGhiChu", "Cô Cú đang soạn câu cho các môn. Con quay lại sau nhé!"));
      than.appendChild(trai);

      // --- phải: số câu, luật, thưởng, bé, nút
      const phai = tao("section", "tmKhoiPhai");
      phai.appendChild(tao("h3", "", "Bao nhiêu câu?"));
      const hs = tao("div", "tmSoCau"); hs.setAttribute("role", "radiogroup"); hs.setAttribute("aria-label", "Số câu");
      chon.forEach(n => {
        const b = nut("tmSo" + (n === S.soCau ? " chon" : ""), String(n));
        b.setAttribute("role", "radio"); b.setAttribute("aria-checked", n === S.soCau ? "true" : "false");
        b.addEventListener("click", () => { S.soCau = n; ghiLS(KHOA, { soCau: n }); capNhatPhai(); });
        hs.appendChild(b);
      });
      phai.appendChild(hs);
      const luatChu = [
        "Con bấm Quay, vòng quay chọn một môn bất ngờ.",
        "Chơi như Theo môn: đọc câu xong mới hiện 4 đáp án, chạm là chấm, xong sớm được trọn kim cương.",
        "Thưởng gấp rưỡi Theo môn vì con dám thử môn bất ngờ!",
        "Sai thì Cô Cú hỏi lại bằng câu khác để con nhớ lâu."
      ];
      const luat = tao("div", "tmLuat");
      const hl = tao("div", "tmLuatDau"); hl.appendChild(tao("b", "", "📜 Luật chơi"));
      const nghe = nut("tmNghe", "🔊"); nghe.setAttribute("aria-label", "Nghe luật");
      nghe.addEventListener("click", () => { const a = AM(); if (a) a.doc(luatChu.join(" "), { lang: "vi" }); });
      hl.appendChild(nghe); luat.appendChild(hl);
      const ul = tao("ul");
      ul.append(tao("li", "", "🎡 " + luatChu[0]), tao("li", "", "⏱️ " + luatChu[1]), tao("li", "", "🌈 " + luatChu[2]), tao("li", "", "🔁 " + luatChu[3]));
      luat.appendChild(ul);
      phai.appendChild(luat);
      const th = tao("div", "tmThuong");
      phai.appendChild(th);
      const beO = tao("div", "tmBeO");
      const cv = tao("canvas", "tmBe"); cv.width = 150; cv.height = 160; cv.setAttribute("aria-hidden", "true");
      const boNoi = tao("p", "tmCoCu", "🦉 Con dám quay không nào?");
      beO.append(cv, boNoi);
      phai.appendChild(beO);
      const hn = tao("div", "tmHangNut");
      const bd = nut("cpNut chinh lon tmNutBatDau", "🎡 Quay môn!");
      bd.appendChild(tao("small", "", ""));
      bd.disabled = !dsMon.length;
      bd.addEventListener("click", () => batDau(S.soCau, !!ld));
      hn.appendChild(bd);
      phai.appendChild(hn);
      than.appendChild(phai);
      s.appendChild(than);
      goc0.innerHTML = ""; goc0.appendChild(s);

      function capNhatPhai() {
        hs.querySelectorAll(".tmSo").forEach(b => { const c = Number(b.textContent) === S.soCau; b.classList.toggle("chon", c); b.setAttribute("aria-checked", c ? "true" : "false"); });
        const n = S.soCau, g = kcGoc(n), toiDa = Math.floor(g * heSo()), tru = n > 0 ? Math.floor(g / n) : 0;
        th.innerHTML = "";
        th.appendChild(tao("b", "tmThTieuDe", "🎁 Phần thưởng " + n + " câu"));
        const h = tao("div", "tmThHang");
        const o1 = tao("div", "tmThO kc"); o1.append(tao("b", "", "tới " + so(toiDa) + " 💎"), tao("small", "", "× " + soVi(heSo()) + " so với Theo môn"));
        const o2 = tao("div", "tmThO vang"); o2.append(tao("b", "", "+" + so(kq.vangMoiCau) + " 🪙"), tao("small", "", "mỗi câu đúng"));
        const o3 = tao("div", "tmThO tru"); o3.append(tao("b", "", "−" + so(tru) + " 💎"), tao("small", "", "mỗi câu sai (trước × " + soVi(heSo()) + ")"));
        h.append(o1, o2); if (tru > 0) h.appendChild(o3);
        th.appendChild(h);
        bd.querySelector("small").textContent = n + " câu · tới " + so(toiDa) + " 💎";
        if (ld) bd.firstChild.textContent = "🎡 Quay lượt mới";
      }
      capNhatPhai();
      if (hoSo && goc.KC_NV) {
        const t0 = performance.now();
        const ve = now => {
          if (!cv.isConnected) return;
          rafBe = requestAnimationFrame(ve);
          if (!cv.offsetParent) return;
          try { const c = cv.getContext("2d"); c.clearRect(0, 0, cv.width, cv.height); goc.KC_NV.ve(c, hoSo, { x: cv.width / 2, y: cv.height - 8, co: 1.55, huong: 1, t: (now - t0) / 1000, tuThe: "vay", vaiTro: "thu_linh", cam: "" }); }
          catch (e) { cancelAnimationFrame(rafBe); cv.hidden = true; }
        };
        rafBe = requestAnimationFrame(ve);
      } else cv.hidden = true;
      if (goc.matchMedia && goc.matchMedia("(pointer: fine)").matches) bd.focus({ preventScroll: true });
    }

    function coCuNoi(chu) {
      const p = goc0.querySelector(".tmCoCu");
      if (p) { p.textContent = chu; p.classList.remove("nay"); void p.offsetWidth; p.classList.add("nay"); }
      let tb = goc0.querySelector(".tmToast");
      if (!tb) { tb = tao("div", "tmToast"); tb.setAttribute("role", "status"); goc0.appendChild(tb); }
      tb.textContent = chu; tb.classList.add("hien");
      clearTimeout(coCuNoi._h); coCuNoi._h = setTimeout(() => tb.classList.remove("hien"), 2600);
    }

    function veLoiSanh(kq) {
      goc0.innerHTML = "";
      const s = tao("div", "tmSanh thSanh tmLoiKhoi");
      const ma = kq && kq.ma;
      s.append(tao("p", "tmTai", ma === "dang_nhap" ? "Con đăng nhập lại rồi vào lại nhé." :
        ma === "chua_co" ? "Tổng hợp đang được chuẩn bị trên máy chủ. Con quay lại sau nhé!" : "Mạng đang chập chờn. Con bấm Thử lại nhé."));
      const n = nut("cpNut chinh", "Thử lại"); n.addEventListener("click", veSanh);
      s.appendChild(n); goc0.appendChild(s);
    }

    // Màn vòng quay phủ toàn trang: quay rồi dừng ở môn máy chủ đã bốc (luot.mon)
    async function manQuay(luot) {
      const ds = ((S.tc && S.tc.mon) || []).slice();
      if (!ds.some(m => m.ma === luot.mon)) ds.push({ ma: luot.mon, ten: luot.monTen, bieuTuong: luot.monBieuTuong });
      const man = tao("div", "thQuay"); man.setAttribute("role", "dialog"); man.setAttribute("aria-modal", "true"); man.setAttribute("aria-label", "Vòng quay môn");
      const bo = tao("div", "thQuayBo");
      const h = tao("h2", "", "🎡 Vòng quay đang chạy…");
      const v = veVong(ds);
      const kq = tao("div", "thKetQua"); kq.setAttribute("aria-live", "polite");
      bo.append(h, v.goc, kq); man.appendChild(bo);
      doc.body.appendChild(man);
      const a = AM();
      await ngu(120);
      await v.quayToi(ds.findIndex(m => m.ma === luot.mon), 3.4);
      if (a && a.tieng && a.tieng.thuong) try { a.tieng.thuong(); } catch (e) { /* im lặng */ }
      h.textContent = "🎉 Trúng rồi!";
      kq.textContent = (luot.monBieuTuong || "📘") + " " + (luot.monTen || "");
      kq.appendChild(tao("small", "", (luot.soGoc || luot.tong) + " câu · thưởng × " + soVi(+luot.heSo || heSo())));
      kq.classList.add("hien");
      if (a && a.doc) try { a.doc("Môn " + (luot.monTen || "") + "! Con cố lên nhé!", { lang: "vi" }); } catch (e) { /* im lặng */ }
      if (!giamDong()) {
        const PHAO = ["🎉", "✨", "🌟", "💎", "🎊"];
        for (let i = 0; i < 18; i++) {
          const p = tao("span", "thPhao", PHAO[i % PHAO.length]);
          p.style.left = (Math.random() * 100) + "vw"; p.style.animationDelay = (Math.random() * 0.5) + "s";
          doc.body.appendChild(p); setTimeout(() => p.remove(), 2400);
        }
      }
      await ngu(1700);
      man.remove();
    }

    // ================= CHƠI =================
    async function batDau(soCau, moi) {
      if (S.dangChoi) return;
      S.dangChoi = true;
      const TA = goc.KC_TM_AM; if (TA) { TA.mo(); TA.taiCauHinh(); } // mở khoá âm thanh trong cú chạm (luật màn hỏi Theo môn)
      const b0 = goc0.querySelector(".tmNutBatDau"); if (b0) b0.disabled = true;
      const kq = await rpcBen("kc_th_bat_dau", { p_so_cau: soCau || null, p_moi: !!moi });
      if (!kq.thanhCong || !kq.luot) {
        S.dangChoi = false; if (b0) b0.disabled = false;
        const ma = kq && kq.ma;
        coCuNoi(ma === "khong_co_mon" ? "Cô Cú đang soạn câu cho các môn, con chờ nhé! 🦉" : ma === "khong_du_cau" ? "Các môn chưa đủ câu cho con, con thử lại sau nhé!" :
          ma === "dang_nhap" ? "Con đăng nhập lại nhé." : "Mạng đang chập chờn. Con bấm lại nhé.");
        return;
      }
      cancelAnimationFrame(rafBe);
      const l = kq.luot;
      if (!kq.tiep) await manQuay(l);
      if (TA) await TA.taiCauHinh();
      const n = l.soGoc || l.tong;
      const ten = (l.monBieuTuong ? l.monBieuTuong + " " : "") + (l.monTen || "Tổng hợp");
      const goi = {
        traLoi: (id, viTri, chon, giay, hanhVi) => rpc("kc_tt_tra_loi", Object.assign({ p_luot: id, p_vi_tri: viTri, p_chon: chon, p_giay: giay }, hanhVi ? { p_hanh_vi: hanhVi } : {})).then(r => Object.assign({ ok: !!r.thanhCong }, r)),
        ketThuc: id => rpc("kc_tt_ket_thuc", { p_luot: id }).then(r => Object.assign({ ok: !!r.thanhCong }, r)),
        chuoi: id => rpc("kc_tt_chuoi_luot", { p_luot: id }),  // KC_03C7b: 🔥 chuỗi ngày ở màn kết quả
        danhHieu: rpc                                            // KC_08F2: màn chúc mừng lên sao / danh hiệu
      };
      const kqMan = await goc.KC_TT.moLuot({
        luot: l, goi, tieuDe: "🌈 " + ten, phuDe: n + " câu · thưởng × " + soVi(+l.heSo || heSo()) + (kq.tiep ? " · chơi tiếp" : ""), nutKet: "🎯 Về Thử Thách",
        nutThem: [{ chu: "🎡 Quay tiếp " + (soCau || n) + " câu", ma: "tiep" }], goc: "", lop: S.tc ? S.tc.lop : null, hoSo,
        loiMoDau: "Môn " + (l.monTen || "") + " nè! Con làm được mà!",
        sanKhau: TA ? { am: TA } : null
      });
      S.dangChoi = false;
      if (kqMan && kqMan.dong === "tiep") { const nc = soCau || n; S.soCau = nc; ghiLS(KHOA, { soCau: nc }); batDau(nc, false); return; }
      veSanh();
    }

    veSanh();
    return { veLai: veSanh };
  }

  goc.KC_TH = { gan };
})(typeof window !== "undefined" ? window : globalThis);
// 24/11/2026 - BƯỚC: KC_03C7 (tạo mới: 🌈 Tổng hợp + vòng quay môn)
// 24/11/2026 - BƯỚC: KC_03C7b (goi.chuoi: dòng 🔥 chuỗi ngày ở màn kết quả)
// 25/11/2026 - BƯỚC: KC_08F2 (goi.danhHieu: màn chúc mừng lên sao / danh hiệu, chung/danh_hieu.js)
// 27/11/2026 - BƯỚC: KC_11C (goi.traLoi gửi kèm p_hanh_vi: chống bấm bừa, máy chủ ghi + kết luận lượt)
