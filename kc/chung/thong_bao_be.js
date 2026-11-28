/* ================================================================
   FILE: chung/thong_bao_be.js
   CHỨC NĂNG: KHỐI "📬 CẦN CON XEM" Ở TRANG CHỦ CỦA BÉ, đọc từ HÒM THƯ CHUNG (KC_12C2, Thiet_Ke_Hom_Thu.md 9.1;
              thay khối "Cô Cú báo" đọc tin tc_* của KC_11D).
              Máy chủ: kc_thu_dem (theTrangChu = số thẻ tối đa, Quản trị chỉnh) + kc_thu_ds('can_xem') = thư chưa đọc
              hoặc đang chờ con làm. Mỗi thẻ là một thư; CHẠM THẺ mở thẳng thư đó (homthu_NC.html#thu-<id>).
              Mọi nút việc (🎁 Nhận quà, 🙋 gửi phản hồi, trả lời) nằm trong thư (homthu.js): module này không vẽ nút việc.
              Không có thư cần xem / đặt 0 thẻ / mất mạng: khối tự ẩn. Lối vào hòm thư luôn có: nút 📬 thanh đầu.
              Tính năng mới KHÔNG phải sửa file này: mở thư bằng kc_thu_mo là thẻ tự hiện.
   DÙNG:      KC_THONG_BAO_BE.veKhoi(vung, { rpc, duongHomThu }) -> Promise
                rpc(tenHam, thamSo) -> Promise (trang tự thêm p_ten / p_ma_phien);
                duongHomThu: đường tới homthu_NC.html tính từ trang đang mở.
   ĐIỆN THOẠI: thẻ 1 cột, cao ≥ 64 px. MÁY TÍNH (≥ 700 px): hình và chữ to hơn.
   BƯỚC: KC_12C2 · NGÀY: 28/11/2026 (tạo ở KC_11D, 27/11/2026)
   ================================================================ */
(function (goc) {
  "use strict";
  if (goc.KC_THONG_BAO_BE) return;
  const doc = goc.document;
  const tao = (the, lop, chu) => { const e = doc.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; };
  const HINH_LOAI = { y_tuong: "💡", khang_nghi: "📮", cap_thuong: "🎁", co_cu: "✉️", tin: "📢" };

  const CSS = `
.tbbKhoi { background: linear-gradient(135deg, #fff6d6, #eaf6ff); border: 3px solid #ffd27a; border-radius: 18px; padding: 14px 12px 12px; margin: 0 0 18px; }
.tbbKhoi h3 { margin: 0 0 10px; text-align: center; font-family: "Baloo 2", system-ui, sans-serif; color: #4b2fb0; }
.tbbDs { display: grid; gap: 10px; }
.tbbThe { display: grid; grid-template-columns: 48px 1fr 20px; gap: 10px; align-items: center; min-height: 64px; background: #fff;
  border: 2px solid #f1e6c9; border-radius: 16px; padding: 10px 12px; text-decoration: none; color: #3d2f66; text-align: left; }
.tbbThe:hover, .tbbThe:focus-visible { border-color: #7b5cf0; }
.tbbThe.vui { border-color: #ffb800; box-shadow: 0 0 0 3px #ffe7a3; }
.tbbHinh { font-size: 2.2rem; line-height: 1; text-align: center; }
.tbbGiua { min-width: 0; display: grid; gap: 4px; justify-items: start; }
.tbbChinh { font-weight: 700; line-height: 1.4; overflow-wrap: anywhere; }
.tbbNhan { border-radius: 999px; padding: 2px 10px; font-size: .82rem; font-weight: 700; background: #fff0b8; color: #7a4b00; }
.tbbNhan.can { background: #ffe1e1; color: #b3261e; }
.tbbMui { font-size: 1.6rem; color: #7b5cf0; text-align: right; }
.tbbMo { display: flex; justify-content: center; margin-top: 10px; }
.tbbMo a { display: inline-flex; align-items: center; min-height: 44px; padding: 6px 18px; border-radius: 999px; background: #efeaff;
  color: #4b2fb0; font-weight: 700; text-decoration: none; }
@media (min-width: 700px) {
  .tbbThe { grid-template-columns: 56px 1fr 24px; padding: 12px 16px; }
  .tbbHinh { font-size: 2.6rem; }
  .tbbChinh { font-size: 1.05rem; }
}
`;
  function chenKieu() {
    if (doc.getElementById("tbbKieu")) return;
    const s = doc.createElement("style"); s.id = "tbbKieu"; s.textContent = CSS; doc.head.appendChild(s);
  }

  // nhãn giống trang Hòm thư (homthu.js nhanCua); chỉ 2 loại vì khối chỉ có thư cần xem
  const canLam = t => !!t.viecCho && t.viecCho !== "xu_ly" && t.vai !== "phu_huynh";

  function veKhoi(vung, tc) {
    if (!vung) return Promise.resolve(null);
    chenKieu();
    const o = tc || {}, rpc = o.rpc, duong = o.duongHomThu || "kc/homthu_NC.html";
    const an = () => { vung.hidden = true; vung.innerHTML = ""; return null; };
    if (typeof rpc !== "function") { an(); return Promise.resolve(null); }
    let dangTai = false;

    function taiLai() {
      if (dangTai) return Promise.resolve(null);
      dangTai = true;
      return Promise.all([rpc("kc_thu_dem", {}), rpc("kc_thu_ds", { p_loc: "can_xem" })]).then(([dem, kq]) => {
        dangTai = false;
        if (!kq || !kq.thanhCong) return an();
        const toiDa = dem && dem.thanhCong && Number.isFinite(+dem.theTrangChu) ? +dem.theTrangChu : 3;
        // thư đang chờ con làm lên trước, còn lại giữ thứ tự mới nhất trước
        const ds = (kq.ds || []).slice().sort((a, b) => canLam(b) - canLam(a));
        if (!ds.length || toiDa <= 0) return an();
        ve(ds.slice(0, toiDa));
        return kq;
      }, () => { dangTai = false; return an(); });
    }

    function ve(ds) {
      vung.innerHTML = "";
      vung.hidden = false;
      const k = tao("section", "tbbKhoi"); k.setAttribute("aria-label", "Cần con xem");
      k.appendChild(tao("h3", "", "📬 Cần con xem"));
      const list = tao("div", "tbbDs");
      ds.forEach(t => list.appendChild(veThe(t)));
      k.appendChild(list);
      const mo = tao("div", "tbbMo"), a = tao("a", "", "Mở hòm thư ›"); a.href = duong;
      mo.appendChild(a); k.appendChild(mo);
      vung.appendChild(k);
    }

    function veThe(t) {
      const can = canLam(t), hinh = (t.duLieu && t.duLieu.bieuTuong) || HINH_LOAI[t.loai] || "📬";
      const the = tao("a", "tbbThe" + (can ? " vui" : ""));
      the.href = duong + "#thu-" + t.id;
      the.dataset.id = t.id;
      the.appendChild(tao("span", "tbbHinh", hinh));
      const giua = tao("span", "tbbGiua");
      giua.append(tao("span", "tbbChinh", t.tieuDe || "Cô Cú có thư cho con"),
                  tao("span", "tbbNhan" + (can ? " can" : ""), can ? "🙋 Con cần làm" : "📬 Thư mới"));
      the.appendChild(giua);
      the.appendChild(tao("span", "tbbMui", "›"));
      return the;
    }

    // Bé quay lại Trang chủ bằng nút Back (trang lấy từ bộ nhớ đệm) hoặc quay lại tab: hỏi lại để thẻ đã đọc biến mất
    goc.addEventListener("pageshow", e => { if (e.persisted) taiLai(); });
    doc.addEventListener("visibilitychange", () => { if (doc.visibilityState === "visible") taiLai(); });

    return taiLai();
  }

  goc.KC_THONG_BAO_BE = { veKhoi };
})(typeof window !== "undefined" ? window : globalThis);
// 27/11/2026 - BƯỚC: KC_11D (khối 📬 Cô Cú báo ở Trang chủ)
// 28/11/2026 - BƯỚC: KC_12C2 (đổi thành khối 📬 Cần con xem, đọc từ Hòm thư chung)
