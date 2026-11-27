/* ================================================================
   FILE: chung/khang_nghi.js
   CHỨC NĂNG: HỘP "BÉ KHÁNG NGHỊ": MODULE DÙNG CHUNG TOÀN APP (KC_11D; người dùng 27/11/2026: "Kháng nghị của bé nên là module
              riêng vì nhiều chức năng app dùng đến"). Bé thấy một quyết định của app chưa đúng (bị cắt thưởng vì chọn vội, câu bị
              chấm sai...) thì TỰ VIẾT lý do (không có lý do viết sẵn): ≥ toiThieu (5) ký tự, ≤ toiDa (200), lọc từ xấu bằng
              chung/loc_ten.js (có thì dùng). Nút Gửi mờ tới khi đủ chữ.
              Gửi -> RPC kc_kn_gui(nguon, tham_chieu, loi). Xong: "Cô Cú đã gửi cho thầy cô xem lại rồi…". Mỗi việc gửi một lần.
              Tính năng tự mở kháng nghị ở máy chủ (SQL kc_kn_mo); admin xử lý ở Quản trị › 📮 Bé kháng nghị; kết quả về 📬 Trang chủ.
              Dùng ở: màn ⛔ chọn vội (tt_tri_thuc/tt_cau_hoi.js, nguồn "bb"), thẻ 📬 Cô Cú báo ở Trang chủ (chung/thong_bao_be.js).
   DÙNG:      KC_KHANG_NGHI.moHop({ rpc, nguon, thamChieu, cauHoi?, moTa?, toiThieu?, toiDa?, cha? }) -> Promise<{ daGui, loiBe? }>
                rpc(tenHam, thamSo) -> Promise (trang tự thêm p_ten / p_ma_phien); nguon + thamChieu: việc bị kháng nghị
                (vd "bb" + mã lượt); cauHoi: câu Cô Cú hỏi (mặc định "Con thấy chưa đúng chỗ nào? Con kể Cô Cú nghe nhé!");
                moTa: "Bài Toán ngày 27/11" (tuỳ chọn); cha: phần tử chứa hộp (mặc định body, hộp phủ toàn màn).
   ĐIỆN THOẠI: hộp gần hết bề ngang, nút to ≥ 48 px, ô viết cao 5 dòng. MÁY TÍNH: hộp giữa 520 px, Esc đóng, Ctrl+Enter gửi.
   BƯỚC: KC_11D · NGÀY: 27/11/2026
   ================================================================ */
(function (goc) {
  "use strict";
  if (goc.KC_KHANG_NGHI) return;
  const doc = goc.document;
  const tao = (the, lop, chu) => { const e = doc.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; };

  const CSS = `
.knMan { position: fixed; inset: 0; z-index: 2147483000; display: flex; align-items: center; justify-content: center; padding: 16px;
  background: rgba(40, 30, 70, .55); font-family: "Baloo 2", "Nunito", system-ui, sans-serif; animation: knHien .2s ease-out; }
.knHop { width: min(520px, 100%); max-height: calc(100dvh - 32px); overflow: auto; background: #fffaf0; border: 3px solid #ffd27a;
  border-radius: 22px; padding: 18px 16px 16px; box-shadow: 0 14px 40px rgba(0,0,0,.25); color: #3d2f66; box-sizing: border-box; }
.knDau { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; }
.knCu { font-size: 2.6rem; line-height: 1; animation: knLac 2.4s ease-in-out infinite; }
.knDau h3 { margin: 0; font-size: 1.2rem; line-height: 1.3; color: #4b2fb0; }
.knMoTa { margin: 0 0 10px; font-size: .88rem; color: #766f91; }
.knO { width: 100%; box-sizing: border-box; min-height: 7.5em; resize: vertical; font: inherit; font-size: 1.05rem; line-height: 1.45;
  padding: 10px 12px; border: 2px solid #e4dbfb; border-radius: 14px; background: #fff; color: #2e2450; }
.knO:focus { outline: none; border-color: #8a6cf0; box-shadow: 0 0 0 3px #e4dbfb; }
.knDem { display: flex; justify-content: space-between; gap: 8px; margin: 4px 2px 0; font-size: .8rem; color: #8a83a6; }
.knDem b.du { color: #2e9b57; }
.knGoiY { margin: 8px 2px 0; font-size: .84rem; color: #766f91; }
.knLoi { margin: 8px 0 0; padding: 8px 10px; border-radius: 12px; background: #fff1d6; color: #8a5300; font-size: .92rem; }
.knNut { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; margin-top: 14px; }
.knNut button { min-height: 48px; padding: 10px 18px; border-radius: 14px; font: inherit; font-weight: 700; font-size: 1rem; cursor: pointer; border: 0; }
.knGui { background: #7b5cf0; color: #fff; flex: 1 1 180px; }
.knGui:disabled { background: #cfc6ef; cursor: default; }
.knThoi { background: #efeaff; color: #4b2fb0; }
.knXong { text-align: center; padding: 6px 4px 2px; }
.knXong .knCu { font-size: 3.2rem; display: block; margin: 0 auto 6px; }
.knXong p { margin: 0 0 6px; font-size: 1.08rem; }
@keyframes knHien { from { opacity: 0; } to { opacity: 1; } }
@keyframes knLac { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-8deg); } }
@media (prefers-reduced-motion: reduce) { .knMan, .knCu { animation: none; } }
@media (min-width: 900px) { .knHop { padding: 22px 24px 20px; } .knDau h3 { font-size: 1.3rem; } }
`;
  function chenKieu() {
    if (doc.getElementById("knKieu")) return;
    const s = doc.createElement("style"); s.id = "knKieu"; s.textContent = CSS; doc.head.appendChild(s);
  }

  // Lọc từ xấu: dùng chung/loc_ten.js (chỉ phần chặn từ; dấu câu / emoji được phép nên tách bỏ trước khi kiểm)
  function kiemLoi(chu) {
    const lt = goc.KC_LOC_TEN;
    if (!lt || typeof lt.kiemTra !== "function") return "";
    const chiChu = String(chu).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    if (!chiChu) return "";
    const r = lt.kiemTra(chiChu, { toiThieu: 1, toiDa: 5000 });
    return r && !r.hopLe ? "Có chữ chưa đẹp, con viết lại bằng lời hay hơn nhé!" : "";
  }

  const LOI_MAY_CHU = {
    ngan: "Con viết thêm vài chữ nữa nhé!", dai: "Con viết ngắn lại một chút nhé!",
    da_gui: "Con đã gửi cho việc này rồi. Cô Cú báo kết quả ở Trang chủ nhé!", het_han: "Việc này đã quá hạn gửi rồi con ạ.",
    da_xu_ly: "Thầy cô đã xem việc này rồi. Con xem ở Trang chủ nhé!", tat: "Hiện chưa gửi được, con thử lại sau nhé.",
    khong_co: "Cô Cú không tìm thấy việc này.", dang_nhap: "Con đăng nhập lại rồi gửi nhé."
  };

  function moHop(tc) {
    chenKieu();
    const o = Object.assign({ toiThieu: 5, toiDa: 200, moTa: "", cha: doc.body, cauHoi: "Con thấy chưa đúng chỗ nào? Con kể Cô Cú nghe nhé!" }, tc || {});
    const min = Math.max(1, +o.toiThieu || 5), max = Math.max(min, +o.toiDa || 200);
    return new Promise(xong => {
      const truoc = doc.activeElement;
      const man = tao("div", "knMan"); man.setAttribute("role", "dialog"); man.setAttribute("aria-modal", "true"); man.setAttribute("aria-label", "Gửi Cô Cú");
      const hop = tao("div", "knHop"); man.appendChild(hop);
      const dau = tao("div", "knDau"); dau.append(tao("span", "knCu", "🦉"), tao("h3", "", o.cauHoi));
      hop.appendChild(dau);
      if (o.moTa) hop.appendChild(tao("p", "knMoTa", o.moTa));
      const oViet = tao("textarea", "knO"); oViet.maxLength = max; oViet.rows = 5;
      oViet.placeholder = "Ví dụ: Con học bài này rồi nên con biết ngay ạ…"; oViet.setAttribute("aria-label", "Lý do của con");
      hop.appendChild(oViet);
      const dem = tao("div", "knDem"); const demTrai = tao("span", ""), demPhai = tao("b", "");
      dem.append(demTrai, demPhai); hop.appendChild(dem);
      hop.appendChild(tao("p", "knGoiY", "Con có thể bấm 🎤 trên bàn phím để nói, hoặc nhờ bố mẹ viết giúp."));
      const loi = tao("p", "knLoi"); loi.hidden = true; hop.appendChild(loi);
      const hang = tao("div", "knNut");
      const thoi = tao("button", "knThoi", "Để sau"); thoi.type = "button";
      const gui = tao("button", "knGui", "💌 Gửi Cô Cú"); gui.type = "button";
      hang.append(thoi, gui); hop.appendChild(hang);
      (o.cha || doc.body).appendChild(man);

      let dang = false, ketQua = { daGui: false };
      const sach = () => oViet.value.replace(/\s+/g, " ").trim();
      function capNhat() {
        const n = sach().length;
        demTrai.textContent = n < min ? "Con viết ít nhất " + min + " chữ nhé" : "Đủ rồi, con gửi được!";
        demPhai.textContent = n + " / " + max; demPhai.className = n >= min ? "du" : "";
        gui.disabled = dang || n < min || n > max;
      }
      function dong() {
        goc.removeEventListener("keydown", phim, true);
        man.remove();
        try { if (truoc && truoc.focus) truoc.focus({ preventScroll: true }); } catch (e) { /* bỏ qua */ }
        xong(ketQua);
      }
      function baoLoi(chu) { loi.textContent = chu; loi.hidden = !chu; }
      function daGuiXong(loiBe) {
        ketQua = { daGui: true, loiBe };
        hop.innerHTML = "";
        const x = tao("div", "knXong");
        x.append(tao("span", "knCu", "💌"), tao("p", "", "Cô Cú đã gửi cho thầy cô xem lại rồi."), tao("p", "", "Có kết quả Cô Cú báo con ở Trang chủ nhé! 💌"));
        hop.appendChild(x);
        const h = tao("div", "knNut"); const ok = tao("button", "knGui", "Vâng ạ"); ok.type = "button";
        ok.addEventListener("click", dong); h.appendChild(ok); hop.appendChild(h);
        setTimeout(() => ok.focus({ preventScroll: true }), 50);
      }
      function guiDi() {
        const chu = sach();
        if (dang || chu.length < min || chu.length > max) return;
        const xau = kiemLoi(chu); if (xau) { baoLoi(xau); return; }
        dang = true; capNhat(); gui.textContent = "Đang gửi…"; baoLoi("");
        Promise.resolve().then(() => o.rpc("kc_kn_gui", { p_nguon: o.nguon, p_tham_chieu: String(o.thamChieu), p_loi: chu })).then(r => {
          dang = false; gui.textContent = "💌 Gửi Cô Cú";
          if (r && r.thanhCong) { daGuiXong(r.loiBe || chu); return; }
          if (r && r.ma === "da_gui") { daGuiXong(r.loiBe || chu); return; }
          baoLoi((r && LOI_MAY_CHU[r.ma]) || "Mạng đang chập chờn, con bấm Gửi lại nhé."); capNhat();
        }, () => { dang = false; gui.textContent = "💌 Gửi Cô Cú"; baoLoi("Mạng đang chập chờn, con bấm Gửi lại nhé."); capNhat(); });
      }
      function phim(e) {
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); if (!dang) dong(); }
        else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); e.stopPropagation(); guiDi(); }
        else e.stopPropagation(); // phím 1-6 của hộp câu hỏi không được chọn đáp án khi bé đang gõ
      }
      oViet.addEventListener("input", () => { baoLoi(""); capNhat(); });
      gui.addEventListener("click", guiDi);
      thoi.addEventListener("click", () => { if (!dang) dong(); });
      man.addEventListener("click", e => { if (e.target === man && !dang && !sach()) dong(); });
      goc.addEventListener("keydown", phim, true); // window (pha bắt) chạy TRƯỚC phím của hộp câu hỏi (document)
      capNhat();
      setTimeout(() => oViet.focus({ preventScroll: true }), 80);
    });
  }

  goc.KC_KHANG_NGHI = { moHop };
})(typeof window !== "undefined" ? window : globalThis);
// 27/11/2026 - BƯỚC: KC_11D (bé kháng nghị: hộp tự viết lý do, module chung; gửi kc_kn_gui)
