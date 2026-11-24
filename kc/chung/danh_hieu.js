/* ================================================================
   FILE: chung/danh_hieu.js
   CHỨC NĂNG: DANH HIỆU CỦA BÉ dùng chung toàn app (đặc tả Thiet_Ke_Trinh_Do.md mục 9.5, KC_08F2):
              mỗi môn một danh hiệu 🐣 Gà Con → ⚡ Thần, mỗi danh hiệu 3 sao, CHỈ TĂNG, không có chữ "lớp".
              Điểm do máy chủ tính sau mỗi câu trả lời (trigger KC_08C); trang chỉ đọc + hiện.
              - veKhoi(vung, rpc): khối "🏅 Danh hiệu của con" (Trang chủ của bé): mỗi môn một dòng, thanh
                "còn X điểm" tới sao / danh hiệu kế. Xong thì tự xét màn chúc mừng.
              - xet(rpc, { tre }): hỏi máy chủ; môn nào vừa lên sao / danh hiệu mà bé chưa xem thì hiện MÀN CHÚC MỪNG
                (con vật nhảy ra, sao sáng lần lượt, pháo giấy, tiếng). Bấm "Tuyệt vời!" thì ghi đã xem lên máy chủ
                (đổi máy / tải lại không hiện lại). Màn kết quả Thử Thách (4 chế độ) + ôn sau trận gọi sau khi vẽ.
              rpc(tenHam, thamSo) -> Promise<kết quả máy chủ> (trang tự thêm p_ten / p_ma_phien).
              Máy chủ chưa có hàm (chưa chạy SQL) / mất mạng: im lặng, khối tự ẩn.
   ĐIỆN THOẠI: màn chúc mừng 1 cột. MÁY TÍNH (≥ 900 px): thẻ rộng 2 cột (con vật to bên trái, sao + thanh bên phải),
              phím Enter / Esc đóng.
   SQL: supabase_kc08f2_danh_hieu.sql (repo riêng): kc_td_danh_hieu_be, kc_td_danh_hieu_da_xem.
   PHỤ THUỘC: không bắt buộc. Có chung/am_thanh.js (KC_AM_THANH) thì có tiếng.
   BƯỚC: KC_08F2 · NGÀY: 25/11/2026
   ================================================================ */
(function (goc) {
  "use strict";
  if (goc.KC_DANH_HIEU) return;
  const doc = goc.document;
  const tao = (the, lop, chu) => { const e = doc.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; };
  const soVn = n => Math.max(0, Math.round(n)).toLocaleString("vi-VN");
  const giamChuyenDong = () => !!(goc.matchMedia && goc.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // ---------------- Kiểu (tự chèn một lần: dùng được ở mọi trang, kể cả trang Đấu Trường ở thư mục khác) ----------------
  const CSS = `
.dhKhoi { background: linear-gradient(135deg, #fff8e1, #f1ebff); border: 3px solid #e4dbfb; border-radius: 18px; padding: 14px 14px 10px; margin: 0 0 18px; }
.dhKhoi h3 { margin: 0 0 4px; text-align: center; font-family: "Baloo 2", system-ui, sans-serif; color: #4b2fb0; }
.dhKhoi > p { margin: 0 0 10px; text-align: center; font-size: .86rem; color: #766f91; }
.dhDs { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.dhDong { display: grid; grid-template-columns: 52px 1fr; gap: 10px; align-items: center; background: #fff; border: 2px solid #ece6fb; border-radius: 14px; padding: 8px 10px; }
.dhDong.moi { border-color: #ffb800; box-shadow: 0 0 0 3px #ffe7a3; }
.dhHinh { font-size: 2.2rem; line-height: 1; text-align: center; }
.dhMon { display: block; font-size: .78rem; color: #766f91; font-weight: 600; }
.dhTen { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 8px; font-family: "Baloo 2", system-ui, sans-serif; font-size: 1.12rem; color: #2b2640; line-height: 1.2; }
.dhSao { letter-spacing: 1px; font-size: .95rem; white-space: nowrap; }
.dhSao i { font-style: normal; opacity: .22; filter: grayscale(1); }
.dhThanh { height: 9px; border-radius: 9px; background: #ece6fb; overflow: hidden; margin: 5px 0 2px; }
.dhThanh b { display: block; height: 100%; border-radius: 9px; background: linear-gradient(90deg, #ffb800, #ff8a3d); width: 0; transition: width .9s ease-out; }
.dhCon { font-size: .76rem; color: #766f91; }
.dhThem { display: block; margin: 8px auto 0; border: 0; background: none; color: #4b2fb0; font-weight: 600; cursor: pointer; padding: 6px 10px; font-size: .9rem; }
.dhRong { display: flex; gap: 10px; align-items: center; background: #fff; border-radius: 14px; padding: 10px 12px; font-size: .92rem; }
.dhRong span { font-size: 2.2rem; }

.dhMan { position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; padding: 16px; box-sizing: border-box;
  background: radial-gradient(circle at 50% 40%, rgba(108,76,224,.55), rgba(20,12,48,.88)); font-family: "Be Vietnam Pro", system-ui, sans-serif;
  animation: dhHien .25s ease-out; overflow-y: auto; }
.dhMan.tat { animation: dhTat .22s ease-in forwards; }
@keyframes dhHien { from { opacity: 0; } to { opacity: 1; } }
@keyframes dhTat { to { opacity: 0; } }
.dhThe { position: relative; width: min(420px, 100%); background: linear-gradient(170deg, #fffdf5, #f3edff); border-radius: 26px; padding: 22px 18px 18px;
  text-align: center; color: #2b2640; box-shadow: 0 20px 60px rgba(0,0,0,.45); border: 4px solid #ffcf4d; box-sizing: border-box; animation: dhNay .5s cubic-bezier(.3,1.6,.5,1); }
@keyframes dhNay { from { transform: scale(.6); } to { transform: scale(1); } }
.dhTieuDe { margin: 0 0 2px; font-family: "Baloo 2", system-ui, sans-serif; font-size: 1.5rem; color: #4b2fb0; line-height: 1.2; }
.dhPhu { margin: 0 0 10px; font-size: .95rem; color: #766f91; }
.dhVong { position: relative; width: 150px; height: 150px; margin: 4px auto 6px; display: grid; place-items: center; }
.dhVong::before { content: ""; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, #ffe07a, #ffb800, #ff8a3d, #ff7aa8, #b89bff, #ffe07a);
  animation: dhXoay 6s linear infinite; opacity: .85; }
.dhVong::after { content: ""; position: absolute; inset: 9px; border-radius: 50%; background: #fffdf5; }
@keyframes dhXoay { to { transform: rotate(360deg); } }
.dhCu, .dhMoi { position: relative; z-index: 1; font-size: 5rem; line-height: 1; grid-area: 1 / 1; }
.dhCu { animation: dhBien .5s ease-in .5s forwards; }
.dhMoi { transform: scale(0); animation: dhRa .6s cubic-bezier(.3,1.8,.5,1) .9s forwards; }
.dhMoi.ngay { animation-delay: .15s; }
@keyframes dhBien { to { transform: scale(0) rotate(-40deg); opacity: 0; } }
@keyframes dhRa { to { transform: scale(1); } }
.dhTenLon { margin: 4px 0 2px; font-family: "Baloo 2", system-ui, sans-serif; font-size: 1.7rem; line-height: 1.15; color: #2b2640; }
.dhMonLon { margin: 0 0 6px; font-weight: 600; color: #6c4ce0; }
.dhSaoLon { font-size: 2.1rem; letter-spacing: 4px; margin: 2px 0 8px; }
.dhSaoLon i { display: inline-block; font-style: normal; opacity: .2; filter: grayscale(1); transition: opacity .2s, filter .2s; }
.dhSaoLon i.sang { opacity: 1; filter: none; animation: dhSaoNay .45s cubic-bezier(.3,1.8,.5,1); }
@keyframes dhSaoNay { 0% { transform: scale(.3); } 70% { transform: scale(1.35); } 100% { transform: scale(1); } }
.dhKe { font-size: .88rem; color: #766f91; margin: 2px 0 12px; }
.dhKe .dhThanh { max-width: 280px; margin: 6px auto 4px; height: 11px; }
.dhKhac { list-style: none; margin: 0 0 12px; padding: 8px 10px; background: #fff; border-radius: 14px; text-align: left; font-size: .9rem; display: grid; gap: 4px; }
.dhNutTuyet { font: inherit; font-family: "Baloo 2", system-ui, sans-serif; font-size: 1.25rem; font-weight: 700; color: #fff; border: 0; border-radius: 16px; padding: 12px 26px;
  min-height: 52px; min-width: 200px; cursor: pointer; background: linear-gradient(135deg, #ffb800, #ff7a1a); box-shadow: 0 5px 0 #c25500; }
.dhNutTuyet:active { transform: translateY(3px); box-shadow: 0 2px 0 #c25500; }
.dhNutTuyet:focus-visible { outline: 4px solid #6c4ce0; outline-offset: 3px; }
.dhGiay { position: fixed; top: -14px; z-index: 201; width: 9px; height: 14px; border-radius: 2px; pointer-events: none; animation: dhRoi 2.8s ease-in forwards; }
@keyframes dhRoi { to { transform: translateY(110vh) rotate(var(--xoay, 360deg)); } }
@media (min-width: 900px) {
  .dhThe { width: min(720px, 100%); display: grid; grid-template-columns: 260px 1fr; gap: 6px 26px; align-items: center; text-align: left; padding: 30px 34px 26px; }
  .dhThe > .dhDau { grid-column: 1 / -1; text-align: center; }
  .dhTieuDe { font-size: 2rem; }
  .dhVong { width: 230px; height: 230px; margin: 0; }
  .dhCu, .dhMoi { font-size: 7.5rem; }
  .dhTenLon { font-size: 2.3rem; }
  .dhSaoLon { font-size: 2.6rem; }
  .dhKe .dhThanh { margin-left: 0; }
  .dhNutTuyet { justify-self: start; }
}
@media (prefers-reduced-motion: reduce) {
  .dhMan, .dhThe, .dhVong::before, .dhSaoLon i.sang { animation: none; }
  .dhCu { display: none; } .dhMoi { transform: none; animation: none; }
}`;
  function chenKieu() {
    if (doc.getElementById("dhKieu")) return;
    const s = tao("style"); s.id = "dhKieu"; s.textContent = CSS; doc.head.appendChild(s);
  }

  // ---------------- Máy chủ ----------------
  let dangXet = false;
  function lay(rpc) {
    if (typeof rpc !== "function") return Promise.resolve(null);
    return Promise.resolve().then(() => rpc("kc_td_danh_hieu_be", {})).then(kq => (kq && kq.thanhCong === true && Array.isArray(kq.mon) ? kq : null), () => null);
  }
  // trang chủ, trang Thử Thách: rpc từ phiên đăng nhập chung (kc_auth.js)
  function rpcPhien() {
    const tk = goc.kcTaiKhoanHienTai;
    if (!tk || !tk.tenDangNhap || typeof goc.kcGoiRpc !== "function") return null;
    return (ham, ts) => goc.kcGoiRpc(ham, Object.assign({ p_ten: tk.tenDangNhap, p_ma_phien: tk.maPhien || "" }, ts || {}));
  }

  const saoChu = (sao, soSao) => { const s = tao("span", "dhSao"); for (let i = 1; i <= soSao; i++) { if (i <= sao) s.append("⭐"); else s.appendChild(tao("i", "", "⭐")); } return s; };
  // dòng "còn X điểm nữa" tới sao / danh hiệu kế
  function chuKe(m) {
    if (m.diemMocKe == null) return "Con đã lên tới danh hiệu cao nhất! 👑";
    const con = m.diemMocKe - m.diem;
    return m.sao >= 3 && m.tenKe ? "Còn " + soVn(con) + " điểm nữa lên " + (m.bieuTuongKe || "") + " " + m.tenKe : "Còn " + soVn(con) + " điểm nữa lên ⭐ thứ " + (m.sao + 1);
  }
  const phanTram = m => (m.diemMocKe == null ? 100 : Math.max(3, Math.min(100, ((m.diem - m.mocNay) / Math.max(1, m.diemMocKe - m.mocNay)) * 100)));

  // ---------------- Khối trên Trang chủ ----------------
  function veKhoi(vung, rpc) {
    if (!vung) return Promise.resolve(null);
    chenKieu();
    rpc = rpc || rpcPhien();
    return lay(rpc).then(kq => {
      vung.innerHTML = "";
      if (!kq) { vung.hidden = true; return null; }
      vung.hidden = false;
      const k = tao("div", "dhKhoi");
      k.appendChild(tao("h3", "", "🏅 Danh hiệu của con"));
      if (!kq.mon.length) {
        const r = tao("div", "dhRong"); r.append(tao("span", "", kq.dau.bieuTuong || "🐣"));
        r.appendChild(tao("div", "", "Con đang là " + (kq.dau.ten || "Gà Con") + " ở mọi môn. Trả lời câu hỏi ở 🎯 Thử Thách để lên sao, lên tới " + (kq.cuoi.bieuTuong || "") + " " + (kq.cuoi.ten || "") + " nhé!"));
        k.appendChild(r); vung.appendChild(k); return kq;
      }
      k.appendChild(tao("p", "", "Mỗi câu đúng là thêm điểm. Danh hiệu chỉ tăng, không bao giờ giảm!"));
      const ul = tao("ul", "dhDs"), toiDa = 4;
      kq.mon.forEach((m, i) => {
        const li = tao("li", "dhDong" + (kq.moi.indexOf(m.mon) >= 0 ? " moi" : ""));
        if (i >= toiDa) li.hidden = true;
        li.appendChild(tao("span", "dhHinh", m.bieuTuong));
        const p = tao("div");
        p.appendChild(tao("span", "dhMon", (m.bieuTuongMon ? m.bieuTuongMon + " " : "") + m.tenMon));
        const ten = tao("span", "dhTen", m.ten); ten.appendChild(saoChu(m.sao, kq.soSao)); p.appendChild(ten);
        const th = tao("div", "dhThanh"), b = tao("b"); th.appendChild(b); p.appendChild(th);
        p.appendChild(tao("span", "dhCon", chuKe(m)));
        li.appendChild(p); ul.appendChild(li);
        requestAnimationFrame(() => requestAnimationFrame(() => { b.style.width = phanTram(m) + "%"; }));
      });
      k.appendChild(ul);
      if (kq.mon.length > toiDa) {
        const n = tao("button", "dhThem", "▾ Xem thêm " + (kq.mon.length - toiDa) + " môn"); n.type = "button";
        n.addEventListener("click", () => { ul.querySelectorAll("li[hidden]").forEach(x => { x.hidden = false; }); n.remove(); });
        k.appendChild(n);
      }
      vung.appendChild(k);
      if (kq.moi.length) setTimeout(() => hienChucMung(kq, rpc), 600);
      return kq;
    });
  }

  // ---------------- Màn chúc mừng ----------------
  function xet(rpc, tc) {
    const t = Object.assign({ tre: 0 }, tc || {});
    rpc = rpc || rpcPhien();
    if (dangXet || typeof rpc !== "function") return Promise.resolve(false);
    dangXet = true;
    return new Promise(r => setTimeout(r, Math.max(0, t.tre))).then(() => lay(rpc)).then(kq => {
      if (!kq || !kq.moi.length) { dangXet = false; return false; }
      return hienChucMung(kq, rpc, true);
    }, () => { dangXet = false; return false; });
  }

  function hienChucMung(kq, rpc, tuXet) {
    if (doc.querySelector(".dhMan")) { if (tuXet) dangXet = false; return Promise.resolve(false); }
    dangXet = true;
    chenKieu();
    const soSao = kq.soSao || 3;
    const moi = kq.mon.filter(m => kq.moi.indexOf(m.mon) >= 0);
    // môn chính: lên danh hiệu mới (đổi con vật) trước, rồi môn lên nhiều bước nhất
    moi.sort((a, b) => ((Math.floor(b.buoc / soSao) - Math.floor(b.daXem / soSao)) - (Math.floor(a.buoc / soSao) - Math.floor(a.daXem / soSao))) || ((b.buoc - b.daXem) - (a.buoc - a.daXem)));
    const m = moi[0];
    const bacCu = Math.floor(m.daXem / soSao), lenBac = m.bac > bacCu;
    const saoCu = lenBac ? 0 : (m.daXem % soSao) + 1;
    return new Promise(xong => {
      const man = tao("div", "dhMan"); man.setAttribute("role", "dialog"); man.setAttribute("aria-modal", "true");
      const the = tao("div", "dhThe");
      const dau = tao("div", "dhDau");
      const td = tao("h2", "dhTieuDe", lenBac ? "🎉 Con lên danh hiệu mới!" : "⭐ Con được thêm sao!"); td.id = "dhTieuDe" + Date.now();
      man.setAttribute("aria-labelledby", td.id);
      dau.append(td, tao("p", "dhPhu", lenBac ? "Con chăm chỉ quá, Cô Cú tự hào về con! 🦉" : "Cố lên, sắp lên danh hiệu mới rồi! 🦉"));
      the.appendChild(dau);
      const vong = tao("div", "dhVong");
      if (lenBac && !giamChuyenDong()) vong.appendChild(tao("span", "dhCu", m.bieuTuongDaXem || (kq.dau && kq.dau.bieuTuong) || "🥚"));
      vong.appendChild(tao("span", "dhMoi" + (lenBac ? "" : " ngay"), m.bieuTuong));
      the.appendChild(vong);
      const phai = tao("div", "dhPhai");
      phai.appendChild(tao("p", "dhMonLon", (m.bieuTuongMon ? m.bieuTuongMon + " " : "") + m.tenMon));
      phai.appendChild(tao("p", "dhTenLon", m.ten));
      const sao = tao("div", "dhSaoLon"); sao.setAttribute("aria-label", m.sao + " trên " + soSao + " sao");
      const ds_i = [];
      // sao đã có từ trước sáng sẵn; sao mới sáng lần lượt
      for (let i = 1; i <= soSao; i++) { const s = tao("i", !lenBac && i <= saoCu ? "sang" : "", "⭐"); sao.appendChild(s); ds_i.push(s); }
      phai.appendChild(sao);
      const ke = tao("div", "dhKe"); const th = tao("div", "dhThanh"), b = tao("b"); th.appendChild(b);
      ke.append(th, tao("span", "", chuKe(m))); phai.appendChild(ke);
      if (moi.length > 1) {
        const khac = tao("ul", "dhKhac");
        moi.slice(1, 4).forEach(x => { const li = tao("li"); li.append((x.bieuTuongMon ? x.bieuTuongMon + " " : "") + x.tenMon + ": " + x.bieuTuong + " " + x.ten + " "); li.appendChild(saoChu(x.sao, soSao)); khac.appendChild(li); });
        if (moi.length > 4) khac.appendChild(tao("li", "", "… và " + (moi.length - 4) + " môn nữa"));
        phai.appendChild(khac);
      }
      const nut = tao("button", "dhNutTuyet", "🎉 Tuyệt vời!"); nut.type = "button";
      phai.appendChild(nut);
      the.appendChild(phai);
      man.appendChild(the);
      doc.body.appendChild(man);

      // sao sáng lần lượt + tiếng + pháo giấy
      const am = goc.KC_AM_THANH && goc.KC_AM_THANH.tieng ? goc.KC_AM_THANH.tieng : null;
      const t0 = lenBac ? 1300 : 450;
      try { if (am) am.thuong(); } catch (e) { /* bỏ qua */ }
      for (let i = lenBac ? 0 : saoCu; i < m.sao; i++) {
        setTimeout(() => { ds_i[i].classList.remove("sang"); void ds_i[i].offsetWidth; ds_i[i].classList.add("sang"); try { if (am) am.kc(i); } catch (e) { /* bỏ qua */ } }, t0 + (i - (lenBac ? 0 : saoCu)) * 380);
      }
      setTimeout(() => { b.style.width = phanTram(m) + "%"; }, t0 + 200);
      setTimeout(() => { phaoGiay(lenBac ? 80 : 40); try { if (am) am.keng(); } catch (e) { /* bỏ qua */ } }, lenBac ? 1100 : 300);
      setTimeout(() => { try { nut.focus({ preventScroll: true }); } catch (e) { nut.focus(); } }, 300);

      let dong = false;
      function dongMan() {
        if (dong) return; dong = true;
        doc.removeEventListener("keydown", phim, true);
        const buoc = {}; moi.forEach(x => { buoc[x.mon] = x.buoc; });
        Promise.resolve().then(() => rpc("kc_td_danh_hieu_da_xem", { p_buoc: buoc })).catch(() => null);
        man.classList.add("tat");
        setTimeout(() => { man.remove(); dangXet = false; xong(true); }, 230);
      }
      function phim(e) { if (e.key === "Enter" || e.key === "Escape" || e.key === " ") { e.preventDefault(); e.stopPropagation(); dongMan(); } }
      doc.addEventListener("keydown", phim, true);
      nut.addEventListener("click", dongMan);
    });
  }
  function phaoGiay(n) {
    if (giamChuyenDong()) return;
    const mau = ["#ffc24b", "#ff8a3d", "#6fe3a0", "#7fb5ff", "#ff7aa8", "#b89bff"];
    for (let i = 0; i < n; i++) {
      const p = tao("i", "dhGiay");
      p.style.left = Math.random() * 100 + "%"; p.style.background = mau[i % mau.length];
      p.style.animationDelay = (Math.random() * 0.7) + "s"; p.style.setProperty("--xoay", (Math.random() * 720 - 360) + "deg");
      doc.body.appendChild(p); setTimeout(() => p.remove(), 3600);
    }
  }

  goc.KC_DANH_HIEU = { veKhoi, xet, rpcPhien, hienChucMung };
})(typeof window !== "undefined" ? window : globalThis);
// 25/11/2026 - BƯỚC: KC_08F2
