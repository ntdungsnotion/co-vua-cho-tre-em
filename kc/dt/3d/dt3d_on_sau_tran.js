// ================================================================
// FILE: dt/3d/dt3d_on_sau_tran.js
// CHỨC NĂNG: ÔN SAU TRẬN Đấu Trường, KHÔNG BẮT BUỘC (đặc tả Thiet_Ke_On_The.md mục 4.5; TC_D34B, đổi luật TC_D34D).
//            - TC_D34D (người dùng 27/11/2026): có lượt ôn thì hiện BẢNG MỜI (KC_TT.hoi) "Ôn lại trận vừa rồi? N câu · tối đa +x 💎":
//              ✅ Ôn ngay = màn ôn; ⏭ Để sau = máy chủ bỏ lượt (kc_tt_on_sau_tran_bo 'de_sau'), chơi tiếp.
//              Trong màn ôn có ✕ (hỏi lại "Thoát bài ôn?") -> bỏ lượt ('thoat'), mất 💎 của bài. Trận khác mở lúc đang mời: đóng lặng, mời lại sau.
//            - Mọi màn trận (khung .d3Tran: đánh quái, trụ bắn, đánh công trình bạn, nông dân đánh quái) đóng lại
//              thì hỏi máy chủ kc_tt_on_sau_tran_tao(tuLuc = lúc mở trận). Máy chủ tự tìm câu bé trả lời trong
//              trận (không tin trình duyệt); trận không có câu -> không ôn.
//            - Vào thung lũng: còn lượt ôn đang chờ (đóng game giữa chừng) thì màn ôn hiện lại trước khi chơi tiếp.
//            - Màn ôn: khối câu hỏi dùng chung kc/tt_tri_thuc/tt_cau_hoi.js (KC_TT.moLuot).
//            - Vào thung lũng mà còn lượt chờ (đóng game giữa chừng): bảng mời hiện lại.
//            - Đang ôn mà có trận khác kết thúc: ôn xong thì hỏi lại máy chủ (câu sai mới được gộp vào lượt chờ).
//            Máy chủ không có hàm ôn (máy chủ giả cũ) hoặc trang không nạp KC_TT: không làm gì.
// BƯỚC: TC_D34B
// NGÀY: 20/11/2026
// ================================================================
const CHO_GHI_MS = 2500;      // chờ câu cuối trận được máy chủ ghi xong (chấm nền) rồi mới hỏi tạo lượt ôn
const LUI_MS = 10 * 60 * 1000; // lùi mốc mở trận 10 phút (giờ máy bé có thể lệch); máy chủ vẫn chặn bằng mốc lần ôn trước

export function ganOnSauTran({ mayChu, be, baoGoiY, goc = "" }) {
  if (!mayChu || !mayChu.ttOnTao || !window.KC_TT) return null;
  const moLuc = new Map(); // khung trận -> giờ mở
  let dangOn = false, choHoi = null, hen = 0, hopMoi = null;

  function sauTran(tuLuc) {
    choHoi = choHoi == null ? tuLuc : Math.min(choHoi, tuLuc);
    clearTimeout(hen);
    hen = setTimeout(hoiMayChu, CHO_GHI_MS);
  }
  async function hoiMayChu() {
    if (dangOn || choHoi == null) return;
    const tu = choHoi; choHoi = null;
    const kq = await mayChu.ttOnTao(new Date(tu - LUI_MS).toISOString()).catch(() => null);
    if (kq && kq.ok && kq.can && kq.luot) moOn(kq.luot);
  }
  // TC_D34D: bảng mời trước màn ôn. -> "co" | "khong" | "tat" (trận khác vừa mở: đóng lặng, lượt vẫn chờ, trận đóng thì mời lại)
  async function moi(luot) {
    if (typeof window.KC_TT.hoi !== "function") return "co"; // khối câu hỏi cũ (chưa có hộp hỏi): vào ôn như trước
    const soCau = +luot.soGoc || +luot.tong || 0, kc = Number.isFinite(+luot.kcToiDa) && luot.kcToiDa != null ? +luot.kcToiDa : null;
    const dangDo = +luot.viTri > 0;
    const chu = (dangDo ? "Bài ôn còn dở · " : "") + (soCau ? soCau + " câu" : "Ôn câu vừa sai") + (kc > 0 ? " · tối đa +" + kc + " 💎" : "");
    hopMoi = window.KC_TT.hoi({ bieuTuong: "📚", tieuDe: "Ôn lại trận vừa rồi?", chu, co: "✅ Ôn ngay", khong: "⏭ Để sau" });
    const kq = await hopMoi.hua; hopMoi = null;
    return kq;
  }
  async function boLuot(luot, lyDo) {
    if (typeof mayChu.ttOnBo !== "function") return;
    await mayChu.ttOnBo(luot.id, lyDo).catch(() => null); // mất mạng: lượt vẫn chờ, lần sau vào thung lũng mời lại
  }
  async function moOn(luot) {
    if (dangOn) return;
    // một trận khác đang mở (quái lao tới...): đợi trận đóng, lúc đó máy chủ gộp câu vào lượt này
    if (document.querySelector(".d3Tran")) return;
    dangOn = true;
    const chon = await moi(luot);
    if (chon !== "co") {
      if (chon === "khong") await boLuot(luot, "de_sau");
      dangOn = false;
      if (choHoi != null) hoiMayChu();
      return;
    }
    let kq = null;
    try {
      kq = await window.KC_TT.moLuot({
        luot, tieuDe: "📚 Ôn lại trận vừa rồi", phuDe: "", batBuoc: false, nutKet: "🎁 Nhận thưởng",
        xacNhanDong: { tieuDe: "Thoát bài ôn?", chu: "Thoát bây giờ thì không nhận 💎 của bài này.", co: "🚪 Thoát", khong: "↩ Ôn tiếp" },
        goc, lop: Number.isFinite(+be.lop) ? +be.lop : null, hoSo: be.hoSo || null,
        goi: { traLoi: (id, viTri, chon, giay, hanhVi) => mayChu.ttTraLoi(id, viTri, chon, giay, hanhVi), ketThuc: id => mayChu.ttKetThuc(id),
               chuoi: id => (typeof mayChu.ttChuoi === "function" ? mayChu.ttChuoi(id) : null), // KC_03C7b: 🔥 chuỗi ngày
               // KC_08F2: màn chúc mừng lên sao / danh hiệu (chung/danh_hieu.js)
               danhHieu: typeof mayChu.goiDanhHieu === "function" ? (ham, ts) => mayChu.goiDanhHieu(ham, ts) : null }
      });
    } catch (e) { console.warn("Màn ôn lỗi", e); }
    if (kq && kq.dong === "bo") await boLuot(luot, "thoat"); // TC_D34D: ✕ giữa chừng = bỏ lượt, mất thưởng
    dangOn = false;
    const k = kq && kq.ketQua;
    if (k && baoGoiY) baoGoiY("📚 Ôn xong " + (k.dungGoc || 0) + "/" + (k.soCauGoc || 0) + (k.kc > 0 ? " · 💎 +" + k.kc : ""));
    if (choHoi != null) hoiMayChu(); // có trận kết thúc trong lúc ôn
  }

  // theo dõi khung trận được thêm / gỡ khỏi trang
  const mo = new MutationObserver(ds => {
    for (const m of ds) {
      m.addedNodes.forEach(n => { if (n.nodeType === 1 && n.classList.contains("d3Tran")) { moLuc.set(n, Date.now()); if (hopMoi) hopMoi.tat(); } });
      m.removedNodes.forEach(n => { if (moLuc.has(n)) { const t = moLuc.get(n); moLuc.delete(n); sauTran(t); } });
    }
  });
  mo.observe(document.body, { childList: true });

  // vào thung lũng: lượt ôn còn chờ hiện lại; không có thì gom câu sai của trận vừa chơi mà chưa kịp ôn (≤ 1 giờ)
  (async () => {
    const kq = await mayChu.ttLuotDang().catch(() => null);
    const chua = kq && kq.ok && Array.isArray(kq.luot) ? kq.luot.find(l => l && l.cheDo === "on_sau_tran") : null;
    if (chua) return moOn(chua);
    const k2 = await mayChu.ttOnTao(null).catch(() => null);
    if (k2 && k2.ok && k2.can && k2.luot) moOn(k2.luot);
  })();

  return { moOn, sauTran, mayChu, get dangOn() { return dangOn; } }; // mayChu: kịch bản thử (máy chủ giả _ttThu)
}
// 20/11/2026 - BƯỚC: TC_D34B
// 24/11/2026 - BƯỚC: KC_03C7b (goi.chuoi: dòng 🔥 chuỗi ngày sau màn ôn)
// 25/11/2026 - BƯỚC: KC_08F2 (goi.danhHieu: màn chúc mừng lên sao / danh hiệu sau màn ôn)
// 27/11/2026 - BƯỚC: TC_D34D (ôn không bắt buộc: bảng mời Ôn ngay / Để sau, ✕ thoát mất thưởng, mayChu.ttOnBo)
// 27/11/2026 - BƯỚC: KC_11C (traLoi chuyển hanhVi cho mayChu.ttTraLoi: chống bấm bừa)
