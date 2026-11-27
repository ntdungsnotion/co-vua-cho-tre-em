/* ================================================================
   FILE: chung/thong_bao_be.js
   CHỨC NĂNG: KHỐI "📬 CÔ CÚ BÁO" Ở TRANG CHỦ CỦA BÉ: thông báo cho bé DÙNG CHUNG toàn app (KC_11D).
              Máy chủ: bảng kc_be_thong_bao (KC_06F1) với loại "tc_*" = tin của Trang chủ; RPC kc_tb_trang_chu (tin chưa xem)
              + kc_tb_da_xem (Nhận / Con hiểu rồi / Thôi ạ). Mỗi thẻ một việc, mới nhất trên cùng.
              Tin BÉ KHÁNG NGHỊ (module chung, Thiet_Ke_Khang_Nghi.md): chữ do tính năng gửi kèm trong duLieu
              (ten, bieuTuong, chuMo, chuChapNhan, chuGiu, cauHoi) nên tính năng mới không phải sửa file này:
                tc_kn_cho_be     chuMo + "Con thấy chưa đúng?" -> [🙋 Gửi phản hồi] [Thôi ạ] (hộp chung/khang_nghi.js)
                tc_kn_cho_xem    💌 con đã kể "…", thầy cô đang xem lại (tự thay khi có kết quả)
                tc_kn_chap_nhan  🎉 chuChapNhan (+💎 +🪙 nếu được bù) + lời nhắn -> [🎁 Nhận] (kim cương rơi) hoặc [Vâng ạ]
                tc_kn_giu_nguyen 🦉 chuGiu + lời nhắn -> [Con hiểu rồi]
                tc_cap_thuong    🎁 thầy cô tặng con (Quản trị › 🎁 Cấp thưởng cho bé) + lý do + lời nhắn -> [🎁 Nhận]
              Loại tc_* khác sau này: hiện duLieu.chu (+ bieuTuong) và nút [Đã xem]; thêm cách vẽ riêng ở VE.
              Không có tin / chưa chạy SQL / mất mạng: khối tự ẩn.
   DÙNG:      KC_THONG_BAO_BE.veKhoi(vung, { rpc, khiNhan? }) -> Promise
                rpc(tenHam, thamSo) -> Promise (trang tự thêm p_ten / p_ma_phien);
                khiNhan({ kc, vang, diemSo, viVang }): bé vừa bấm 🎁 Nhận (trang chạy hiệu ứng + cập nhật số).
   ĐIỆN THOẠI: thẻ 1 cột, nút to ≥ 44 px xếp dưới chữ. MÁY TÍNH (≥ 700 px): hình to bên trái, nút bên phải.
   PHỤ THUỘC: chung/khang_nghi.js (hộp kháng nghị; thiếu thì không có nút 🙋), chung/loc_ten.js (tuỳ chọn).
   BƯỚC: KC_11D · NGÀY: 27/11/2026
   ================================================================ */
(function (goc) {
  "use strict";
  if (goc.KC_THONG_BAO_BE) return;
  const doc = goc.document;
  const tao = (the, lop, chu) => { const e = doc.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; };

  const CSS = `
.tbbKhoi { background: linear-gradient(135deg, #fff6d6, #eaf6ff); border: 3px solid #ffd27a; border-radius: 18px; padding: 14px 12px 12px; margin: 0 0 18px; }
.tbbKhoi h3 { margin: 0 0 10px; text-align: center; font-family: "Baloo 2", system-ui, sans-serif; color: #4b2fb0; }
.tbbDs { display: grid; gap: 10px; }
.tbbThe { display: grid; grid-template-columns: 48px 1fr; gap: 10px; align-items: start; background: #fff; border: 2px solid #f1e6c9;
  border-radius: 16px; padding: 10px 12px; transition: opacity .35s, transform .35s; }
.tbbThe.vui { border-color: #ffb800; box-shadow: 0 0 0 3px #ffe7a3; }
.tbbThe.di { opacity: 0; transform: scale(.96); }
.tbbHinh { font-size: 2.2rem; line-height: 1; text-align: center; padding-top: 2px; }
.tbbGiua p { margin: 0 0 4px; line-height: 1.45; color: #3d2f66; }
.tbbGiua .tbbChinh { font-weight: 700; }
.tbbGiua .tbbPhu { font-size: .86rem; color: #766f91; }
.tbbGiua .tbbNhan { font-style: italic; background: #f7f3ff; border-radius: 10px; padding: 6px 9px; }
.tbbSo { display: inline-flex; gap: 8px; flex-wrap: wrap; margin: 2px 0 4px; }
.tbbSo b { background: #fff4cc; border-radius: 999px; padding: 2px 10px; font-size: 1.05rem; color: #7a4b00; }
.tbbNut { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.tbbNut button { min-height: 44px; padding: 8px 16px; border: 0; border-radius: 12px; font: inherit; font-weight: 700; cursor: pointer; }
.tbbNut .chinh { background: #7b5cf0; color: #fff; }
.tbbNut .vang { background: linear-gradient(135deg, #ffcf3f, #ff9f1a); color: #4a2a00; }
.tbbNut .phu { background: #efeaff; color: #4b2fb0; }
.tbbNut button:disabled { opacity: .6; cursor: default; }
@media (min-width: 700px) {
  .tbbThe { grid-template-columns: 56px 1fr auto; align-items: center; }
  .tbbHinh { font-size: 2.6rem; }
  .tbbNut { grid-column: auto; flex-direction: column; align-items: stretch; min-width: 150px; }
}
`;
  function chenKieu() {
    if (doc.getElementById("tbbKieu")) return;
    const s = doc.createElement("style"); s.id = "tbbKieu"; s.textContent = CSS; doc.head.appendChild(s);
  }

  const ngay = iso => { const d = new Date(iso); return isNaN(d) ? "" : ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2); };
  const tenViec = d => d.ten || "việc này";   // "bài Toán ngày 27/11" (tính năng gửi kèm)
  const hoaDau = s => s.charAt(0).toUpperCase() + s.slice(1);
  function soThuong(d) {
    const s = tao("div", "tbbSo");
    if (+d.kc > 0) s.appendChild(tao("b", "", "+" + d.kc + " 💎"));
    if (+d.vang > 0) s.appendChild(tao("b", "", "+" + d.vang + " 🪙"));
    return s;
  }
  const nhan = chu => tao("p", "tbbNhan", "“" + chu + "” – Thầy cô");

  // Mỗi loại: { hinh, vui?, ve(giua, d), nut: [[chữ, lớp, việc]] } với việc = "phan_hoi" | "nhan" | "xem"
  const coThuong = d => (+d.kc > 0 || +d.vang > 0);
  const VE = {
    tc_kn_cho_be: d => ({ hinh: d.bieuTuong || "📮",
      chu: [["tbbChinh", (d.chuMo || hoaDau(tenViec(d)) + " có kết quả con chưa vui.") + " Con thấy chưa đúng?"],
            d.han ? ["tbbPhu", "Con gửi được tới hết ngày " + ngay(d.han) + "."] : null],
      nut: [["🙋 Gửi phản hồi", "chinh", "phan_hoi"], ["Thôi ạ", "phu", "xem"]] }),
    tc_kn_cho_xem: d => ({ hinh: "💌",
      chu: [["", "Con đã kể: “" + (d.loiBe || "") + "”."], ["tbbPhu", "Thầy cô đang xem lại " + tenViec(d) + " nhé!"]], nut: [] }),
    tc_kn_chap_nhan: d => ({ hinh: "🎉", vui: true,
      chu: [["tbbChinh", (d.chuChapNhan || "Thầy cô xem lại " + tenViec(d) + " rồi: con đúng!") + (coThuong(d) ? " Con được" : "")],
            coThuong(d) ? ["so"] : null, d.loiNhan ? ["nhan", d.loiNhan] : null],
      nut: [coThuong(d) ? ["🎁 Nhận", "vang", "nhan"] : ["Vâng ạ", "chinh", "xem"]] }),
    tc_kn_giu_nguyen: d => ({ hinh: "🦉",
      chu: [["", d.chuGiu || "Thầy cô xem lại " + tenViec(d) + " rồi, lần này mình giữ nguyên nhé. Cô Cú tin con! 💪"],
            d.loiNhan ? ["nhan", d.loiNhan] : null],
      nut: [["Con hiểu rồi", "chinh", "xem"]] }),
    tc_cap_thuong: d => ({ hinh: "🎁", vui: true,
      chu: [["tbbChinh", "Thầy cô tặng con"], ["so"], d.lyDo ? ["tbbPhu", "Vì: " + d.lyDo] : null, d.loiNhan ? ["nhan", d.loiNhan] : null],
      nut: [["🎁 Nhận", "vang", "nhan"]] })
  };
  const VE_KHAC = d => ({ hinh: d.bieuTuong || "📬", chu: [["", d.chu || "Cô Cú có tin cho con."]], nut: [["Đã xem", "phu", "xem"]] });

  function veKhoi(vung, tc) {
    if (!vung) return Promise.resolve(null);
    chenKieu();
    const o = tc || {}, rpc = o.rpc;
    if (typeof rpc !== "function") { vung.hidden = true; return Promise.resolve(null); }
    let soHop = { toiThieu: 5, toiDa: 200, bat: true };

    function taiLai() {
      return Promise.resolve().then(() => rpc("kc_tb_trang_chu", {})).then(kq => {
        if (!kq || !kq.thanhCong) { vung.hidden = true; vung.innerHTML = ""; return null; }
        if (kq.khangNghi) soHop = Object.assign(soHop, kq.khangNghi);
        ve(kq.tin || []);
        return kq;
      }, () => { vung.hidden = true; return null; });
    }

    function ve(ds) {
      vung.innerHTML = "";
      if (!ds.length) { vung.hidden = true; return; }
      vung.hidden = false;
      const k = tao("section", "tbbKhoi"); k.setAttribute("aria-label", "Cô Cú báo");
      k.appendChild(tao("h3", "", "📬 Cô Cú báo"));
      const list = tao("div", "tbbDs");
      ds.forEach(t => list.appendChild(veThe(t)));
      k.appendChild(list); vung.appendChild(k);
    }

    function veThe(t) {
      const d = t.duLieu || {}, m = (VE[t.loai] || VE_KHAC)(d);
      const the = tao("article", "tbbThe" + (m.vui ? " vui" : ""));
      the.appendChild(tao("div", "tbbHinh", m.hinh));
      const giua = tao("div", "tbbGiua");
      m.chu.filter(Boolean).forEach(c => {
        if (c[0] === "so") giua.appendChild(soThuong(d));
        else if (c[0] === "nhan") giua.appendChild(nhan(c[1]));
        else giua.appendChild(tao("p", c[0], c[1]));
      });
      the.appendChild(giua);
      const nutDs = m.nut.filter(n => n[2] !== "phan_hoi" || (goc.KC_KHANG_NGHI && soHop.bat !== false && d.nguon && d.thamChieu));
      if (nutDs.length) {
        const hang = tao("div", "tbbNut");
        nutDs.forEach(n => {
          const b = tao("button", n[1], n[0]); b.type = "button";
          b.addEventListener("click", () => bam(n[2], t, the, hang));
          hang.appendChild(b);
        });
        the.appendChild(hang);
      }
      return the;
    }

    function khoa(hang, co) { hang.querySelectorAll("button").forEach(b => { b.disabled = co; }); }
    function bo(the) {
      the.classList.add("di");
      setTimeout(() => { the.remove(); if (!vung.querySelector(".tbbThe")) { vung.hidden = true; vung.innerHTML = ""; } }, 380);
    }

    function bam(viec, t, the, hang) {
      if (viec === "phan_hoi") {
        const d = t.duLieu;
        goc.KC_KHANG_NGHI.moHop({ rpc, nguon: d.nguon, thamChieu: d.thamChieu, cauHoi: d.cauHoi, moTa: d.ten ? hoaDau(d.ten) : "",
                                  toiThieu: soHop.toiThieu, toiDa: soHop.toiDa })
          .then(r => { if (r && r.daGui) taiLai(); });
        return;
      }
      khoa(hang, true);
      Promise.resolve().then(() => rpc("kc_tb_da_xem", { p_id: t.id })).then(kq => {
        if (!kq || !kq.thanhCong) { khoa(hang, false); if (kq && kq.ma === "khong_co") bo(the); return; }
        if (viec === "nhan" && typeof o.khiNhan === "function") { try { o.khiNhan(kq); } catch (e) { /* bỏ qua */ } }
        bo(the);
      }, () => khoa(hang, false));
    }

    return taiLai();
  }

  goc.KC_THONG_BAO_BE = { veKhoi };
})(typeof window !== "undefined" ? window : globalThis);
// 27/11/2026 - BƯỚC: KC_11D (khối 📬 Cô Cú báo: thông báo cho bé dùng chung ở Trang chủ)
