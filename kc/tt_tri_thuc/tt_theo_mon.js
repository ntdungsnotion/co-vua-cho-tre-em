/* ================================================================
   FILE: tt_tri_thuc/tt_theo_mon.js
   CHỨC NĂNG: 📚 THEO MÔN của phân hệ THỬ THÁCH tri thức (đặc tả Thiet_Ke_On_The.md mục 4.0, 4.1, 5.2-5.5).
              Sảnh: bé chọn môn (ô to: ⭐ % đã thuộc, 🔔 số điều cần ôn hôm nay, ✨ số điều mới; môn chưa đủ kiến thức
              nằm trong "Môn sắp có"), nút 🔔 Ôn ngay (môn nhiều điều tới hạn nhất), chọn số câu 10 / 15 / 20 / 30,
              luật 3 dòng + 🔊 đọc, khung thưởng (💎 tối đa, 🪙 mỗi câu đúng, sai trừ), nhân vật bé + Cô Cú, nút Bắt đầu.
              Lượt dở (tải lại / đóng giữa chừng) hiện "▶ Chơi tiếp" hoặc "Lượt mới".
              Chơi + kết quả: khối câu hỏi dùng chung KC_TT.moLuot (tt_cau_hoi.js): máy chủ chọn câu theo Sổ Ghi Nhớ + trình độ,
              gửi từng câu không kèm đáp án, chạm là chấm, sai thì hỏi lại bằng câu khác, đồng hồ cả bài, 💎 giảm dần,
              rương + kim cương bay, 📖 Xem lại đáp án, "▶ Chơi tiếp N câu" (giữ môn + số câu).
              Điện thoại (< 900 px): 1 cột, lưới môn 2 cột, nút Bắt đầu dính đáy. Máy tính (≥ 900 px): trái lưới môn 3 cột,
              phải khung số câu + luật + thưởng + nhân vật bé.
   DÙNG:      KC_TM.gan(phanTu, { ten, maPhien, goiRpc(ten, thamSo) -> Promise<json> })
   RPC:       kc_tm_trang_chu, kc_tm_bat_dau, kc_tt_tra_loi, kc_tt_ket_thuc (SQL repo_rieng supabase_kc03c4_theo_mon.sql).
   ÂM THANH:  tiếng đúng / sai / thưởng / kim cương / lời khen + đọc câu: module chung KC_AM_THANH (chỉnh ở Quản trị ›
              🎵 Âm thanh chung). Theo môn chưa có tiếng riêng.
   PHỤ THUỘC: chung/am_thanh.js, chung/gio_bai.js, tt_tri_thuc/tt_cau_hoi.js + .css, chung/nv_ve.js + nv_ho_so.js (có thì vẽ bé);
              dùng lại nút .cpNut của tt_chinh_phuc.css.
   BƯỚC: KC_03C4
   NGÀY: 24/11/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const doc = goc.document;
  const ngu = ms => new Promise(r => setTimeout(r, ms));
  const tao = (the, lop, chu) => { const e = doc.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; };
  const nut = (lop, chu) => { const b = tao("button", lop, chu); b.type = "button"; return b; };
  const so = n => Number(n || 0).toLocaleString("vi-VN");
  const AM = () => goc.KC_AM_THANH || null;
  const docLS = k => { try { return JSON.parse(goc.localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const ghiLS = (k, v) => { try { if (v == null) goc.localStorage.removeItem(k); else goc.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* chặn lưu: bỏ qua */ } };
  const MAU_MON = ["#e9f3ff", "#fff1f7", "#fff8e2", "#eafbf1", "#f3edff", "#e8fbfb", "#fff0e6"];

  function gan(goc0, tc) {
    const S = { ten: tc.ten, maPhien: tc.maPhien, goi: tc.goiRpc, tc: null, mon: "", soCau: 10, dangChoi: false };
    const KHOA = "kc_tm_chon_" + String(S.ten || "").toLowerCase();
    const nho = docLS(KHOA) || {};
    S.mon = nho.mon || ""; S.soCau = nho.soCau || 0;
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
    const luuChon = () => ghiLS(KHOA, { mon: S.mon, soCau: S.soCau });
    const monCua = ma => ((S.tc && S.tc.mon) || []).find(m => m.ma === ma) || null;
    const kcToiDa = n => Math.floor(((S.tc && S.tc.kcToiDa10) || 30) * n / 10);

    // ================= SẢNH =================
    async function veSanh() {
      cancelAnimationFrame(rafBe);
      goc0.innerHTML = '<div class="tmSanh"><p class="tmTai">Cô Cú đang xếp sách các môn… 📚</p></div>';
      const kq = await rpcBen("kc_tm_trang_chu");
      if (!kq.thanhCong) { veLoiSanh(kq); return; }
      S.tc = kq;
      const dsMon = kq.mon || [], sang = dsMon.filter(m => m.sang), mo = dsMon.filter(m => !m.sang);
      if (S.mon && !sang.some(m => m.ma === S.mon)) S.mon = "";
      if (!S.mon && sang.length) S.mon = (sang.slice().sort((a, b) => b.toiHan - a.toiHan)[0] || sang[0]).ma;
      const chon = (kq.soCauChon || [10, 15, 20, 30]).map(Number);
      if (chon.indexOf(S.soCau) < 0) S.soCau = kq.soCauMacDinh || chon[0] || 10;

      const s = tao("div", "tmSanh");
      // --- đầu: tiêu đề + chip
      const dau = tao("header", "tmDau");
      dau.append(tao("div", "tmSach", "📚"));
      const td = tao("div", "tmTieuDe");
      td.append(tao("h2", "", "Theo môn"), tao("p", "", "Con chọn môn, Cô Cú chọn câu vừa sức để con nhớ lâu!"));
      dau.appendChild(td);
      const chip = tao("div", "tmChip");
      chip.append(tao("span", "", "🪙 " + so(kq.viVang)), tao("span", "", "💎 Hôm nay " + so(kq.daNhanHomNay) + " / " + so(kq.tranNgay)));
      if (kq.luotHomNay > 0) chip.append(tao("span", "", "✅ " + kq.luotHomNay + " lượt hôm nay"));
      dau.appendChild(chip);
      s.appendChild(dau);

      // --- lượt dở
      const ld = kq.luotDang;
      if (ld) {
        const k = tao("div", "tmDo");
        k.append(tao("span", "tmDoBt", ld.monBieuTuong || "📘"));
        const ch = tao("div", "tmDoChu");
        ch.append(tao("b", "", "Con đang dở " + (ld.monTen || "một lượt")), tao("small", "", "Câu " + Math.min(ld.viTri + 1, ld.tong) + " / " + ld.tong + " · lượt giữ 30 phút"));
        k.appendChild(ch);
        const tiep = nut("cpNut chinh tmNutTiep", "▶ Chơi tiếp");
        tiep.addEventListener("click", () => batDau(ld.mon, ld.soCau, false));
        k.appendChild(tiep);
        s.appendChild(k);
      }

      const than = tao("div", "tmThan");
      // --- trái: chọn môn
      const trai = tao("section", "tmKhoiMon");
      const hTrai = tao("div", "tmHangTieuDe");
      hTrai.appendChild(tao("h3", "", "1. Con chọn môn"));
      const tongHan = sang.reduce((a, m) => a + (m.toiHan || 0), 0);
      if (tongHan > 0) {
        const on = nut("tmOnNgay", "🔔 Ôn ngay (" + tongHan + ")");
        on.title = "Cô Cú chọn môn có nhiều điều cần ôn nhất";
        on.addEventListener("click", () => {
          const m = sang.slice().sort((a, b) => b.toiHan - a.toiHan)[0];
          S.mon = m.ma; luuChon(); batDau(m.ma, S.soCau, !!ld);
        });
        hTrai.appendChild(on);
      }
      trai.appendChild(hTrai);
      const luoi = tao("div", "tmLuoiMon");
      sang.forEach((m, i) => luoi.appendChild(oMon(m, i)));
      if (!sang.length) luoi.appendChild(tao("p", "tmGhiChu", "Cô Cú đang soạn câu cho các môn. Con quay lại sau nhé!"));
      trai.appendChild(luoi);
      if (mo.length) {
        const ct = tao("details", "tmMonMo");
        ct.appendChild(tao("summary", "", "Môn sắp có (" + mo.length + ") · Cô Cú đang soạn câu"));
        const lm = tao("div", "tmLuoiMo");
        mo.forEach(m => {
          const o = nut("tmMonMoO"); o.append(tao("span", "", m.bieuTuong || "📘"), tao("span", "", m.ten));
          o.addEventListener("click", () => coCuNoi("Môn " + m.ten + " Cô Cú đang soạn câu, con chờ nhé! 🦉"));
          lm.appendChild(o);
        });
        ct.appendChild(lm); trai.appendChild(ct);
      }
      than.appendChild(trai);

      // --- phải: số câu, luật, thưởng, bé, nút
      const phai = tao("section", "tmKhoiPhai");
      phai.appendChild(tao("h3", "", "2. Bao nhiêu câu?"));
      const hs = tao("div", "tmSoCau"); hs.setAttribute("role", "radiogroup"); hs.setAttribute("aria-label", "Số câu");
      chon.forEach(n => {
        const b = nut("tmSo" + (n === S.soCau ? " chon" : ""), String(n));
        b.setAttribute("role", "radio"); b.setAttribute("aria-checked", n === S.soCau ? "true" : "false");
        b.addEventListener("click", () => { S.soCau = n; luuChon(); capNhatPhai(); });
        hs.appendChild(b);
      });
      phai.appendChild(hs);
      const luatChu = [
        "Con đọc câu hỏi trước, đọc xong mới hiện 4 đáp án.",
        "Đồng hồ chỉ chạy khi 4 đáp án đang hiện. Chạm đáp án là chấm luôn. Xong sớm thì được trọn kim cương.",
        "Trả lời xong Cô Cú giải thích đáp án đúng. Con bấm Bỏ qua để sang câu mới.",
        "Sai thì Cô Cú hỏi lại bằng câu khác để con nhớ lâu."
      ];
      const luat = tao("div", "tmLuat");
      const hl = tao("div", "tmLuatDau"); hl.appendChild(tao("b", "", "📜 Luật chơi"));
      const nghe = nut("tmNghe", "🔊"); nghe.setAttribute("aria-label", "Nghe luật");
      nghe.addEventListener("click", () => { const a = AM(); if (a) a.doc(luatChu.join(" "), { lang: "vi" }); });
      hl.appendChild(nghe); luat.appendChild(hl);
      const ul = tao("ul");
      ul.append(tao("li", "", "📖 " + luatChu[0]), tao("li", "", "⏱️ " + luatChu[1]), tao("li", "", "💬 " + luatChu[2]), tao("li", "", "🔁 " + luatChu[3]));
      luat.appendChild(ul);
      phai.appendChild(luat);
      const th = tao("div", "tmThuong");
      phai.appendChild(th);
      const beO = tao("div", "tmBeO");
      const cv = tao("canvas", "tmBe"); cv.width = 150; cv.height = 160; cv.setAttribute("aria-hidden", "true");
      const boNoi = tao("p", "tmCoCu", "🦉 Con chọn môn rồi bấm Bắt đầu nhé!");
      beO.append(cv, boNoi);
      phai.appendChild(beO);
      const hn = tao("div", "tmHangNut");
      const bd = nut("cpNut chinh lon tmNutBatDau", "📚 Bắt đầu");
      bd.appendChild(tao("small", "", ""));
      bd.disabled = !sang.length;
      bd.addEventListener("click", () => batDau(S.mon, S.soCau, !!ld));
      hn.appendChild(bd);
      phai.appendChild(hn);
      than.appendChild(phai);
      s.appendChild(than);
      goc0.innerHTML = ""; goc0.appendChild(s);

      function oMon(m, i) {
        const b = nut("tmMon" + (S.mon === m.ma ? " chon" : ""));
        b.dataset.mon = m.ma; b.setAttribute("aria-pressed", S.mon === m.ma ? "true" : "false");
        b.style.setProperty("--tm-nen", MAU_MON[i % MAU_MON.length]);
        const pt = m.soKienThuc ? Math.round(100 * (m.daThuoc || 0) / m.soKienThuc) : 0;
        const moi = Math.max(0, (m.soKienThuc || 0) - (m.daGap || 0));
        b.append(tao("span", "tmMonBt", m.bieuTuong || "📘"), tao("b", "tmMonTen", m.ten));
        const thanh = tao("span", "tmThanh"); const t = tao("i"); t.style.width = Math.max(pt, pt > 0 ? 4 : 0) + "%"; thanh.appendChild(t);
        b.append(thanh, tao("small", "tmPt", "⭐ Đã thuộc " + pt + " %"));
        b.appendChild(tao("small", "tmDong", m.toiHan > 0 ? "🔔 " + m.toiHan + " điều cần ôn" : moi > 0 ? "✨ " + so(moi) + " điều mới" : "🌟 Con đã gặp hết!"));
        if (m.toiHan > 0) b.appendChild(tao("span", "tmHuy", "🔔 " + m.toiHan));
        b.addEventListener("click", () => {
          S.mon = m.ma; luuChon();
          luoi.querySelectorAll(".tmMon").forEach(x => { const c = x.dataset.mon === m.ma; x.classList.toggle("chon", c); x.setAttribute("aria-pressed", c ? "true" : "false"); });
          capNhatPhai();
          if (goc.matchMedia && goc.matchMedia("(max-width: 899px)").matches) bd.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
        return b;
      }
      function capNhatPhai() {
        hs.querySelectorAll(".tmSo").forEach(b => { const c = Number(b.textContent) === S.soCau; b.classList.toggle("chon", c); b.setAttribute("aria-checked", c ? "true" : "false"); });
        const n = S.soCau, toiDa = kcToiDa(n), tru = n > 0 ? Math.floor(toiDa / n) : 0;
        th.innerHTML = "";
        th.appendChild(tao("b", "tmThTieuDe", "🎁 Phần thưởng " + n + " câu"));
        const h = tao("div", "tmThHang");
        const o1 = tao("div", "tmThO kc"); o1.append(tao("b", "", "tới " + so(toiDa) + " 💎"), tao("small", "", "xong sớm, đúng hết"));
        const o2 = tao("div", "tmThO vang"); o2.append(tao("b", "", "+" + so(kq.vangMoiCau) + " 🪙"), tao("small", "", "mỗi câu đúng"));
        const o3 = tao("div", "tmThO tru"); o3.append(tao("b", "", "−" + so(tru) + " 💎"), tao("small", "", "mỗi câu sai"));
        h.append(o1, o2); if (tru > 0) h.appendChild(o3);
        th.appendChild(h);
        const m = monCua(S.mon);
        bd.querySelector("small").textContent = m ? (m.bieuTuong || "") + " " + m.ten + " · " + n + " câu" : n + " câu";
        if (ld) bd.firstChild.textContent = "📚 Lượt mới";
        if (m) boNoi.textContent = "🦉 " + (m.toiHan > 0 ? "Hôm nay " + m.ten + " có " + m.toiHan + " điều cần ôn đó!" : "Mình cùng học " + m.ten + " nhé!");
      }
      capNhatPhai();
      // nhân vật bé (nếu có hồ sơ)
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
      const s = tao("div", "tmSanh tmLoiKhoi");
      const ma = kq && kq.ma;
      s.append(tao("p", "tmTai", ma === "dang_nhap" ? "Con đăng nhập lại rồi vào lại nhé." :
        ma === "chua_co" ? "Theo môn đang được chuẩn bị trên máy chủ. Con quay lại sau nhé!" : "Mạng đang chập chờn. Con bấm Thử lại nhé."));
      const n = nut("cpNut chinh", "Thử lại"); n.addEventListener("click", veSanh);
      s.appendChild(n); goc0.appendChild(s);
    }

    // ================= CHƠI =================
    async function batDau(mon, soCau, moi) {
      if (S.dangChoi) return;
      S.dangChoi = true;
      const TA = goc.KC_TM_AM; if (TA) { TA.mo(); TA.taiCauHinh(); } // mở khoá âm thanh trong cú chạm (KC_03C4b)
      const b0 = goc0.querySelector(".tmNutBatDau"); if (b0) b0.disabled = true;
      const kq = await rpcBen("kc_tm_bat_dau", { p_mon: mon || null, p_so_cau: soCau || null, p_moi: !!moi });
      if (!kq.thanhCong || !kq.luot) {
        S.dangChoi = false; if (b0) b0.disabled = false;
        const ma = kq && kq.ma;
        coCuNoi(ma === "sap_co" ? "Môn này Cô Cú đang soạn câu, con chờ nhé! 🦉" : ma === "khong_du_cau" ? "Môn này chưa đủ câu cho con, con chọn môn khác nhé!" :
          ma === "dang_nhap" ? "Con đăng nhập lại nhé." : "Mạng đang chập chờn. Con bấm lại nhé.");
        return;
      }
      cancelAnimationFrame(rafBe);
      if (TA) await TA.taiCauHinh();
      const l = kq.luot;
      const n = l.soGoc || l.tong;
      const ten = (l.monBieuTuong ? l.monBieuTuong + " " : "") + (l.monTen || "Theo môn");
      const goi = {
        traLoi: (id, viTri, chon, giay, hanhVi) => rpc("kc_tt_tra_loi", Object.assign({ p_luot: id, p_vi_tri: viTri, p_chon: chon, p_giay: giay }, hanhVi ? { p_hanh_vi: hanhVi } : {})).then(r => Object.assign({ ok: !!r.thanhCong }, r)),
        ketThuc: id => rpc("kc_tt_ket_thuc", { p_luot: id }).then(r => Object.assign({ ok: !!r.thanhCong }, r)),
        chuoi: id => rpc("kc_tt_chuoi_luot", { p_luot: id }),  // KC_03C7b: 🔥 chuỗi ngày ở màn kết quả
        danhHieu: rpc,                                           // KC_08F2: màn chúc mừng lên sao / danh hiệu
        rpc                                                      // KC_11D: bé kháng nghị lượt ⛔ (chung/khang_nghi.js -> kc_kn_gui)
      };
      const kqMan = await goc.KC_TT.moLuot({
        luot: l, goi, tieuDe: "📚 " + ten, phuDe: n + " câu" + (kq.tiep ? " · chơi tiếp" : ""), nutKet: "🎯 Về Thử Thách",
        nutThem: [{ chu: "▶ Chơi tiếp " + (soCau || n) + " câu", ma: "tiep" }], goc: "", lop: S.tc ? S.tc.lop : null, hoSo, loiMoDau: "Mình cùng học " + (l.monTen || "") + " nhé!",
        sanKhau: TA ? { am: TA } : null
      });
      S.dangChoi = false;
      if (kqMan && kqMan.dong === "tiep") { const nc = soCau || n; S.mon = l.mon; S.soCau = nc; luuChon(); batDau(l.mon, nc, false); return; }
      veSanh();
    }

    veSanh();
    return { veLai: veSanh };
  }

  goc.KC_TM = { gan };
})(typeof window !== "undefined" ? window : globalThis);
// 24/11/2026 - BƯỚC: KC_03C4 (tạo mới: 📚 Theo môn)
// 24/11/2026 - BƯỚC: KC_03C4b (luật mới: đọc câu xong mới hiện đáp án, nhạc + tích tắc + bình luận qua KC_TM_AM)
// 24/11/2026 - BƯỚC: KC_03C7b (goi.chuoi: dòng 🔥 chuỗi ngày ở màn kết quả)
// 25/11/2026 - BƯỚC: KC_08F2 (goi.danhHieu: màn chúc mừng lên sao / danh hiệu, chung/danh_hieu.js)
// 27/11/2026 - BƯỚC: KC_11C (goi.traLoi gửi kèm p_hanh_vi: chống bấm bừa, máy chủ ghi + kết luận lượt)
// 27/11/2026 - BƯỚC: KC_11D (goi.rpc: hộp 🙋 bé phản hồi lượt ⛔)
