// ================================================================
// FILE: dt/3d/dt3d_thong_bao.js  (ES module) - TIN CỦA BÉ KHI VÀO THUNG LŨNG
// CHỨC NĂNG: KC_06F1 (người dùng 16/11/2026: "Câu bị trả lại thì thay bằng câu khác ngẫu nhiên trong kho và
//            thông báo cho tài khoản bị trả"). Vào thung lũng: hỏi máy chủ tin chưa đọc của bé (bảng kc_be_thong_bao);
//            có tin thì mở bảng "🦉 Tin từ Cô Cú": câu nào bị trả lại, lý do, công trình nào đã được thay câu
//            (số câu + máu công trình giữ nguyên). Bé bấm "👍 Con biết rồi" -> đánh dấu đã đọc. Còn tin thì mở tiếp.
//            Điện thoại: bảng phủ gần hết màn hình; máy tính: hộp giữa 560px (dùng khung .d3BangCau có sẵn).
//            Bảng tin này để 💡 bóng điện (KC_06F2) dùng lại.
// DÙNG: moThongBao({ mayChu }) -> Promise<số tin đã hiện>; mayChu cần thongBao() + daXemThongBao(ids)
//       (dt_may_chu_sb.js; máy chủ giả không có -> không làm gì). Máy chủ chưa có hàm (chưa chạy SQL) -> không hiện gì.
// BƯỚC: KC_06F1 - NGÀY: 16/11/2026
// ================================================================
const tao = (the, lop, chu) => { const e = document.createElement(the); if (lop) e.className = lop; if (chu !== undefined) e.textContent = chu; return e; };
const rutGon = s => { const c = String(s || "").trim(); return c.length > 90 ? c.slice(0, 88) + "…" : c; };
// "Trụ tên, Trụ tên, Tường" -> "2 Trụ tên, Tường"
function gopTen(ds) {
  const dem = new Map();
  (Array.isArray(ds) ? ds : []).forEach(t => { const k = String(t || "công trình"); dem.set(k, (dem.get(k) || 0) + 1); });
  return Array.from(dem, ([t, n]) => (n > 1 ? n + " " : "") + t).join(", ");
}

// Một tin -> các dòng chữ cho bé. Loại tin chưa biết (bản trang cũ hơn máy chủ) -> null (bỏ qua, vẫn đánh dấu đã đọc)
export function loiTin(tin) {
  const d = (tin && tin.duLieu) || {};
  if (!tin || tin.loai !== "cau_bi_tra") return null;
  const cau = "“" + rutGon(d.noiDung) + "”", ct = gopTen(d.congTrinh), dong = [];
  if (d.cuaCon) {
    dong.push(["chinh", (d.viec === "xoa" ? "🙈 Cô chú đã cất câu của con: " : "🙈 Câu của con bị trả lại: ") + cau]);
    if (d.lyDo) dong.push(["lyDo", "💬 Cô chú nhắn: " + d.lyDo]);
    if (ct) dong.push(["thay", "🔄 Cô Cú đã đặt câu khác vào " + ct + " của con rồi. Công trình vẫn đủ câu, đủ máu!"]);
    if (d.viec !== "xoa") dong.push(["goiY", "✏️ Con sửa lại câu ở thẻ ✏️ Câu của con (bảng 📝 của công trình) nhé."]);
  } else {
    dong.push(["chinh", "🔄 Cô Cú vừa đổi một câu ở " + (ct || "công trình") + " của con."]);
    dong.push(["lyDo", "Câu cũ " + cau + " đã được cất khỏi thư viện."]);
    dong.push(["thay", "Công trình vẫn đủ câu, đủ máu. Con xem câu mới ở bảng 📝 nhé!"]);
  }
  return dong;
}

export async function moThongBao(the) {
  const mayChu = the && the.mayChu;
  if (!mayChu || !mayChu.thongBao || !mayChu.daXemThongBao) return 0;
  let kq; try { kq = await mayChu.thongBao(); } catch (e) { kq = null; }
  const ds = kq && kq.ok && Array.isArray(kq.tin) ? kq.tin : [];
  if (!ds.length) return 0;
  const ids = ds.map(t => t.id), hien = ds.map(t => ({ t, dong: loiTin(t) })).filter(x => x.dong);
  if (!hien.length) { mayChu.daXemThongBao(ids).catch(() => null); return 0; }
  const con = Math.max(0, (Number(kq.tong) || ds.length) - ds.length);

  const cu = document.getElementById("d3ThongBao"); if (cu) cu.remove();
  const p = tao("div", "d3BangCau d3Khung d3ThongBao"); p.id = "d3ThongBao"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Tin từ Cô Cú");
  const dau = tao("div", "d3BangCauDau");
  dau.appendChild(tao("b", "", "🦉 Tin từ Cô Cú" + (hien.length > 1 ? " (" + hien.length + ")" : "")));
  p.appendChild(dau);
  const ul = tao("ul", "d3TbDs");
  for (const x of hien) {
    const li = tao("li", "d3TbTin");
    x.dong.forEach(([lop, chu]) => li.appendChild(tao("p", "d3Tb_" + lop, chu)));
    ul.appendChild(li);
  }
  p.appendChild(ul);
  if (con) p.appendChild(tao("p", "d3TbCon", "… và còn " + con + " tin nữa, bấm nút để xem tiếp."));
  const chan = tao("div", "d3TbChan"), biet = tao("button", "d3Nut d3ScChinh", con ? "👍 Con biết rồi, xem tiếp" : "👍 Con biết rồi");
  biet.type = "button"; chan.appendChild(biet); p.appendChild(chan);
  document.body.appendChild(p);
  try { biet.focus({ preventScroll: true }); } catch (e) { /* bỏ qua */ }
  return new Promise(xong => {
    biet.addEventListener("click", async () => {
      biet.disabled = true;
      let r; try { r = await mayChu.daXemThongBao(ids); } catch (e) { r = null; }
      p.remove();
      // còn tin và lần này máy chủ đã ghi nhận -> mở tiếp (không ghi nhận được thì thôi, lần vào sau hiện lại)
      if (con && r && r.ok) moThongBao(the).then(n => xong(hien.length + n)); else xong(hien.length);
    });
  });
}
// 16/11/2026 - BƯỚC: KC_06F1
