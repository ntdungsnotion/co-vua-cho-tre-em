// ================================================================
// FILE: dt/3d/dt3d_thu_gon.js  (ES module) - THU GỌN THANH TRÊN / THANH DƯỚI THUNG LŨNG TRÊN ĐIỆN THOẠI
// CHỨC NĂNG (người dùng 26/11/2026: "Trên điện thoại, bổ sung chức năng thu gọn thanh trên và thanh dưới thành nút";
//            thẻ chọn: "Tự mở khi chạm"):
//   - Thanh trên: chạm ▴ ở cuối ô tài nguyên -> thu còn nút 💰 (⬅, tên, ô tài nguyên ẩn); ô chung ⚙️ / ⚠️ và nút báo
//     (⚔️ trận, 💡) VẪN hiện. Chạm 💰 -> mở lại.
//   - Thanh dưới: chạm tay nắm ▾ ở mép trên -> thu còn nút 🎛️ góc dưới phải. Chạm 🎛️ -> mở lại.
//   - Đang gọn mà bé chạm nhân vật / công trình / nguồn / quái (thanh dưới có thứ để xem) -> thanh dưới TỰ MỞ TẠM; bỏ chọn
//     (chạm đất trống, ✕) -> gọn lại. Bé tự bấm ▾ khi đang mở tạm: gọn ngay. Chỉ tính khi chọn ngay sau cú chạm (trang tự chọn
//     Thủ lĩnh lúc vào thì không mở).
//   - Máy nhớ lựa chọn (localStorage, hỏng thì thôi). Chỉ có hiệu lực ở khổ điện thoại (CSS trong @media điện thoại của
//     dt3d.css: rộng <= 600 hoặc cao <= 500); máy tính không có nút, thanh luôn mở.
// HÀM KHAI RA:
//   taoThuGon() -> { moTam(), dongTam(), moc: { trang(), thuTren(co), thuDuoi(co) } }
// PHỤ THUỘC: .d3Tren, .d3Kho, .d3Duoi, .d3Thanh trong kc/dt_thung_lung.html / kc/dt_thu_3d.html; kiểu ở dt3d.css (TC_D06D6c).
// BƯỚC: TC_D06D6c - NGÀY: 26/11/2026
// ================================================================
const KHOA = "kc_dt_thu_gon";
const CHAM_MS = 2000; // chọn trong bấy nhiêu ms sau cú chạm thì tính là bé chạm

export function taoThuGon() {
  const tren = document.querySelector(".d3Tren"), kho = tren && tren.querySelector(".d3Kho");
  const duoi = document.querySelector(".d3Duoi"), thanh = duoi && duoi.querySelector(".d3Thanh");
  if (!tren || !kho || !duoi || !thanh) return { moTam() {}, dongTam() {}, moc: { trang: () => null } };
  let luu = { tren: false, duoi: false };
  try { const d = JSON.parse(localStorage.getItem(KHOA) || "null"); if (d) luu = { tren: !!d.tren, duoi: !!d.duoi }; } catch (e) { /* không có bộ nhớ: mở hết */ }
  let tamMo = false, chamLuc = 0;
  // chỉ mở tạm khi việc chọn đến từ CÚ CHẠM của bé (trang tự chọn Thủ lĩnh lúc vào thì không mở)
  addEventListener("pointerdown", () => { chamLuc = Date.now(); }, true);
  const ghi = () => { try { localStorage.setItem(KHOA, JSON.stringify(luu)); } catch (e) { /* bỏ qua */ } };
  const taoNut = (id, lop, chu, nhan, cha, truoc) => {
    const b = document.createElement("button");
    b.type = "button"; b.id = id; b.className = lop; b.innerHTML = chu; b.setAttribute("aria-label", nhan); b.title = nhan;
    cha.insertBefore(b, truoc || null);
    return b;
  };
  const moTren = taoNut("d3MoTren", "d3Nut d3Khung d3MoTren", "💰", "Hiện thanh tài nguyên", tren, kho);
  const thuTren = taoNut("d3ThuTren", "d3ThuGon", "▴", "Thu gọn thanh trên", kho);
  const moDuoi = taoNut("d3MoDuoi", "d3Nut d3Khung d3MoDuoi", "🎛️", "Hiện thanh điều khiển", duoi, thanh);
  const thuDuoi = taoNut("d3ThuDuoi", "d3ThuGon d3ThuDuoi", "▾", "Thu gọn thanh điều khiển", thanh);
  function ve() {
    document.body.classList.toggle("d3TrenGon", luu.tren);
    document.body.classList.toggle("d3DuoiGon", luu.duoi && !tamMo);
    document.body.classList.toggle("d3DuoiTam", luu.duoi && tamMo);
  }
  const chan = fn => e => { e.stopPropagation(); fn(); ve(); };
  thuTren.addEventListener("click", chan(() => { luu.tren = true; ghi(); }));
  moTren.addEventListener("click", chan(() => { luu.tren = false; ghi(); }));
  thuDuoi.addEventListener("click", chan(() => { luu.duoi = true; tamMo = false; ghi(); }));
  moDuoi.addEventListener("click", chan(() => { luu.duoi = false; tamMo = false; ghi(); }));
  ve();
  return {
    moTam() { if (luu.duoi && !tamMo && Date.now() - chamLuc < CHAM_MS) { tamMo = true; ve(); } },
    dongTam() { if (tamMo) { tamMo = false; ve(); } },
    moc: { // kịch bản thử Chrome
      trang: () => ({ tren: luu.tren, duoi: luu.duoi, tamMo, gonTren: document.body.classList.contains("d3TrenGon"), gonDuoi: document.body.classList.contains("d3DuoiGon") }),
      thuTren: co => (co ? thuTren : moTren).click(), thuDuoi: co => (co ? thuDuoi : moDuoi).click()
    }
  };
}
// 26/11/2026 - BƯỚC: TC_D06D6c
