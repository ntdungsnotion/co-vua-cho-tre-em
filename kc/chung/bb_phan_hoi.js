/* ================================================================
   FILE: chung/bb_phan_hoi.js
   CHỨC NĂNG: HỘP "🙋 CON CÓ SUY NGHĨ THẬT MÀ!" của module chống bấm bừa dùng chung (Thiet_Ke_Chong_Bam_Bua.md 5.4).
              Lượt bị ⛔ (không thưởng): bé TỰ VIẾT lý do (không có lý do viết sẵn, người dùng 27/11/2026),
              ≥ toiThieu (5) ký tự, ≤ toiDa (200), lọc từ xấu bằng chung/loc_ten.js (có thì dùng). Nút Gửi mờ tới khi đủ chữ.
              Gửi -> RPC kc_bb_phan_hoi; xong: "Cô Cú đã gửi cho thầy cô xem lại rồi…". Mỗi lượt gửi một lần (máy chủ giữ).
              Mở từ màn kết quả ⛔ (tt_tri_thuc/tt_cau_hoi.js) hoặc thẻ 📬 Cô Cú báo ở Trang chủ (chung/thong_bao_be.js).
   DÙNG:      KC_BB_PHAN_HOI.moHop({ rpc, luot, moTa?, toiThieu?, toiDa?, cha? }) -> Promise<{ daGui, loiBe? }>
                rpc(tenHam, thamSo) -> Promise (trang tự thêm p_ten / p_ma_phien); luot: mã lượt (uuid);
                moTa: "Bài Toán ngày 27/11" (tuỳ chọn); cha: phần tử chứa hộp (mặc định body, hộp phủ toàn màn).
   ĐIỆN THOẠI: hộp gần hết bề ngang, nút to ≥ 48 px, ô viết cao 5 dòng. MÁY TÍNH: hộp giữa 520 px, Esc đóng, Ctrl+Enter gửi.
   BƯỚC: KC_11D · NGÀY: 27/11/2026
   ================================================================ */
(function (goc) {
  "use strict";
  if (goc.KC_BB_PHAN_HOI) return;
  const doc = goc.document;
  const tao = (the, lop, chu) => { const e = doc.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; };

  const CSS = `
.bbphMan { position: fixed; inset: 0; z-index: 2147483000; display: flex; align-items: center; justify-content: center; padding: 16px;
  background: rgba(40, 30, 70, .55); font-family: "Baloo 2", "Nunito", system-ui, sans-serif; animation: bbphHien .2s ease-out; }
.bbphHop { width: min(520px, 100%); max-height: calc(100dvh - 32px); overflow: auto; background: #fffaf0; border: 3px solid #ffd27a;
  border-radius: 22px; padding: 18px 16px 16px; box-shadow: 0 14px 40px rgba(0,0,0,.25); color: #3d2f66; box-sizing: border-box; }
.bbphDau { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; }
.bbphCu { font-size: 2.6rem; line-height: 1; animation: bbphLac 2.4s ease-in-out infinite; }
.bbphDau h3 { margin: 0; font-size: 1.2rem; line-height: 1.3; color: #4b2fb0; }
.bbphMoTa { margin: 0 0 10px; font-size: .88rem; color: #766f91; }
.bbphO { width: 100%; box-sizing: border-box; min-height: 7.5em; resize: vertical; font: inherit; font-size: 1.05rem; line-height: 1.45;
  padding: 10px 12px; border: 2px solid #e4dbfb; border-radius: 14px; background: #fff; color: #2e2450; }
.bbphO:focus { outline: none; border-color: #8a6cf0; box-shadow: 0 0 0 3px #e4dbfb; }
.bbphDem { display: flex; justify-content: space-between; gap: 8px; margin: 4px 2px 0; font-size: .8rem; color: #8a83a6; }
.bbphDem b.du { color: #2e9b57; }
.bbphGoiY { margin: 8px 2px 0; font-size: .84rem; color: #766f91; }
.bbphLoi { margin: 8px 0 0; padding: 8px 10px; border-radius: 12px; background: #fff1d6; color: #8a5300; font-size: .92rem; }
.bbphNut { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; margin-top: 14px; }
.bbphNut button { min-height: 48px; padding: 10px 18px; border-radius: 14px; font: inherit; font-weight: 700; font-size: 1rem; cursor: pointer; border: 0; }
.bbphGui { background: #7b5cf0; color: #fff; flex: 1 1 180px; }
.bbphGui:disabled { background: #cfc6ef; cursor: default; }
.bbphThoi { background: #efeaff; color: #4b2fb0; }
.bbphXong { text-align: center; padding: 6px 4px 2px; }
.bbphXong .bbphCu { font-size: 3.2rem; display: block; margin: 0 auto 6px; }
.bbphXong p { margin: 0 0 6px; font-size: 1.08rem; }
@keyframes bbphHien { from { opacity: 0; } to { opacity: 1; } }
@keyframes bbphLac { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-8deg); } }
@media (prefers-reduced-motion: reduce) { .bbphMan, .bbphCu { animation: none; } }
@media (min-width: 900px) { .bbphHop { padding: 22px 24px 20px; } .bbphDau h3 { font-size: 1.3rem; } }
`;
  function chenKieu() {
    if (doc.getElementById("bbphKieu")) return;
    const s = doc.createElement("style"); s.id = "bbphKieu"; s.textContent = CSS; doc.head.appendChild(s);
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
    da_gui: "Con đã gửi cho bài này rồi. Cô Cú báo kết quả ở Trang chủ nhé!", het_han: "Bài này đã quá hạn gửi rồi con ạ.",
    da_xu_ly: "Thầy cô đã xem bài này rồi. Con xem ở Trang chủ nhé!", tat: "Hiện chưa gửi được, con thử lại sau nhé.",
    khong_co: "Cô Cú không tìm thấy bài này.", dang_nhap: "Con đăng nhập lại rồi gửi nhé."
  };

  function moHop(tc) {
    chenKieu();
    const o = Object.assign({ toiThieu: 5, toiDa: 200, moTa: "", cha: doc.body }, tc || {});
    const min = Math.max(1, +o.toiThieu || 5), max = Math.max(min, +o.toiDa || 200);
    return new Promise(xong => {
      const truoc = doc.activeElement;
      const man = tao("div", "bbphMan"); man.setAttribute("role", "dialog"); man.setAttribute("aria-modal", "true"); man.setAttribute("aria-label", "Gửi Cô Cú");
      const hop = tao("div", "bbphHop"); man.appendChild(hop);
      const dau = tao("div", "bbphDau"); dau.append(tao("span", "bbphCu", "🦉"), tao("h3", "", "Con kể Cô Cú nghe nhé, sao con chọn nhanh vậy?"));
      hop.appendChild(dau);
      if (o.moTa) hop.appendChild(tao("p", "bbphMoTa", o.moTa));
      const oViet = tao("textarea", "bbphO"); oViet.maxLength = max; oViet.rows = 5;
      oViet.placeholder = "Ví dụ: Con học bài này rồi nên con biết ngay ạ…"; oViet.setAttribute("aria-label", "Lý do của con");
      hop.appendChild(oViet);
      const dem = tao("div", "bbphDem"); const demTrai = tao("span", ""), demPhai = tao("b", "");
      dem.append(demTrai, demPhai); hop.appendChild(dem);
      hop.appendChild(tao("p", "bbphGoiY", "Con có thể bấm 🎤 trên bàn phím để nói, hoặc nhờ bố mẹ viết giúp."));
      const loi = tao("p", "bbphLoi"); loi.hidden = true; hop.appendChild(loi);
      const hang = tao("div", "bbphNut");
      const thoi = tao("button", "bbphThoi", "Để sau"); thoi.type = "button";
      const gui = tao("button", "bbphGui", "💌 Gửi Cô Cú"); gui.type = "button";
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
        const x = tao("div", "bbphXong");
        x.append(tao("span", "bbphCu", "💌"), tao("p", "", "Cô Cú đã gửi cho thầy cô xem lại rồi."), tao("p", "", "Có kết quả Cô Cú báo con ở Trang chủ nhé! 💌"));
        hop.appendChild(x);
        const h = tao("div", "bbphNut"); const ok = tao("button", "bbphGui", "Vâng ạ"); ok.type = "button";
        ok.addEventListener("click", dong); h.appendChild(ok); hop.appendChild(h);
        setTimeout(() => ok.focus({ preventScroll: true }), 50);
      }
      function guiDi() {
        const chu = sach();
        if (dang || chu.length < min || chu.length > max) return;
        const xau = kiemLoi(chu); if (xau) { baoLoi(xau); return; }
        dang = true; capNhat(); gui.textContent = "Đang gửi…"; baoLoi("");
        Promise.resolve().then(() => o.rpc("kc_bb_phan_hoi", { p_luot: o.luot, p_loi: chu })).then(r => {
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

  goc.KC_BB_PHAN_HOI = { moHop };
})(typeof window !== "undefined" ? window : globalThis);
// 27/11/2026 - BƯỚC: KC_11D (hộp bé tự viết lý do phản hồi lượt ⛔ bấm bừa)
