// ================================================================
// FILE: dt/3d/dt3d_cau_cua_be.js  (ES module) - "✏️ CÂU CỦA CON": BÉ TỰ ĐẶT CÂU HỎI (KC_06D, Thiet_Ke_Kho_Cau_Hoi.md mục 4, 5, 9)
// CHỨC NĂNG: - Thẻ "✏️ Câu của con" trong bảng 📝 Cập nhật câu hỏi (dt3d_tru.js): 2 lựa chọn 📚 Chọn trong kho của con | ➕ Thêm câu mới + số lượt còn hôm nay, danh sách
//              câu bé đã đặt với nhãn trạng thái thân thiện (⏳ đang xem / ✅ dùng được / ✏️ cần sửa / 🙈 đã cất). Câu dùng được
//              chạm là gắn vào công trình (như câu thư viện). Câu cần sửa / đã cất có lý do + gợi ý và nút ✏️ Sửa lại.
//              Câu có tin mới (vừa được duyệt / bị loại) tô sáng, rồi báo máy chủ "đã xem".
//            - Màn soạn (#d3SoanCau): môn, lớp (mặc định lớp của bé), câu hỏi, 4 đáp án (chạm ⭕ để chọn đáp án đúng), lời giải
//              (không bắt buộc) -> 🔍 Kiểm tra (KC_06E2) -> 📨 Gửi sáng -> bé tự trả lời đúng câu của mình (đáp án xáo) -> 📨 Gửi câu.
//              Điện thoại: một cột cuộn. Máy tính: 2 cột (trái câu hỏi, phải đáp án), chữ to.
//            - KC_06G: khung 🔎 Câu giống trong kho (mayChu.tuongTu): bé gõ câu hỏi thì tự lọc câu tương tự (kho chung đã duyệt + câu của
//              chính bé), chạm một câu xổ đáp án / đáp án đúng / lời giải / môn / lớp. Chỉ tham khảo: máy chủ chỉ chặn câu y hệt.
//              Máy tính rộng: cột thứ 3; điện thoại: khung gọn giữa câu hỏi và đáp án, chạm để mở. Máy chủ chưa có hàm: ẩn khung.
//            - Máy chủ chặn lại hết (giới hạn ngày, từ cấm, thông tin riêng, trùng, khoá tạm): trang chỉ đổi MÃ lỗi thành lời
//              nhẹ nhàng, không bao giờ nói từ nào bị bắt.
//            - Câu có chủ đề nhạy cảm học tập (máy chủ trả nhayCam): vẫn vào Câu của con nhưng chỉ gắn được khi admin duyệt, kể cả khi AI
//              cho đạt; trang báo rõ cho bé lúc gửi và trong danh sách (người dùng 12/11/2026).
// HÀM KHAI RA: taoCauCuaBe({ mayChu, lopBe, baoGoiY }) -> { co, ve(cd, ol, chonCau) -> Promise, soanMoi(cau?) }
//   mayChu: cauCuaBe() / guiCau(id, cau) / daXemCau(ids) / monChuDe() (dt_may_chu_sb.js; máy chủ giả không có -> co = false)
//   cd, ol: chỗ vẽ thanh công cụ + danh sách (hàng chủ đề + danh sách câu của thư viện); chonCau(câu có id) gắn vào công trình.
// BƯỚC: KC_06D - NGÀY: 12/11/2026. Sửa 14/11/2026 KC_06E2: nút 🔍 Kiểm tra (app tự kiểm + trùng + Cô Cú/AI) -> đạt thì 📨 Gửi mới sáng;
//   gửi xong câu AI đạt có nút 🛡️ Gắn vào công trình.
// ================================================================

const TRANG_THAI = {
  cho_ai: { nhan: "⏳ Cô Cú đang đọc câu của con...", lop: "cho" },
  cho_nguoi: { nhan: "⏳ Cô chú đang xem câu của con...", lop: "cho" },
  ai_dat: { nhan: "✅ Câu hay! Con dùng được rồi", lop: "dat" },
  dat: { nhan: "✅ Câu hay! Con dùng được rồi", lop: "dat" },
  ai_loai: { nhan: "✏️ Cần sửa một chút", lop: "sua" },
  loai: { nhan: "🙈 Câu này chưa đúng, cô chú đã cất đi", lop: "cat" },
};
const SUA_DUOC = ["cho_ai", "cho_nguoi", "ai_loai", "loai"];
const MON_MAC_DINH = [
  { ma: "toan", ten: "Toán", bieuTuong: "➗" }, { ma: "tieng_anh", ten: "Tiếng Anh", bieuTuong: "🔤" },
  { ma: "tieng_viet", ten: "Tiếng Việt", bieuTuong: "📖" }, { ma: "khoa_hoc", ten: "Khoa học", bieuTuong: "🔬" },
  { ma: "lich_su", ten: "Lịch sử", bieuTuong: "🏛️" }, { ma: "dia_ly", ten: "Địa lý", bieuTuong: "🌍" },
  { ma: "do_vui", ten: "Đố vui", bieuTuong: "🧩" },
];
const SO_DAP_AN = 4;
const CHO_AI_MS = 35000; // 🦉 Nhờ Cô Cú đọc lại: chờ tối đa (Edge Function chờ Gemini 20 giây mặc định)
const CHO_BE_GIAY = 12;  // KC_06F2 (người dùng 17/11/2026): 🔍 Kiểm tra chờ Cô Cú tối đa 12 giây (máy chủ gửi ai.giay_cho_be, admin sửa)
// Câu có chủ đề nhạy cảm học tập (chiến tranh, bệnh...): nằm trong Câu của con, admin duyệt xong mới gắn được (người dùng 12/11/2026)
const NHAY_CAM = "🔎 Câu này có chủ đề cần người lớn xem (như chiến tranh, bệnh tật...). Cô chú duyệt xong thì con mới gắn vào công trình được nhé.";

// Mã lỗi máy chủ -> lời cho bé
function loiChoBe(kq) {
  const k = kq || {}, gh = (k.luot && k.luot.gioiHan) || 10;
  switch (k.ma) {
    case "het_luot": return "Hôm nay con đặt " + gh + " câu rồi, mai đặt tiếp nhé!";
    case "khoa": return "Hôm nay mình nghỉ đặt câu nhé, mai con thử lại!";
    case "chan":
      if (k.loai === "ca_nhan") return "Câu này có thông tin riêng (số điện thoại, địa chỉ, tên tài khoản, đường link...). Con bỏ phần đó đi rồi gửi lại nhé.";
      if (k.loai === "rac") return "Câu này hơi khó đọc, con viết lại rõ ràng hơn nhé.";
      return "Câu này có chữ chưa phù hợp với các bạn nhỏ, con sửa lại nhé.";
    case "trung": return "Kho đã có câu y hệt rồi (cùng câu hỏi, cùng đáp án đúng). Con đổi cách hỏi hoặc đổi đáp án nhé!";
    case "khong_sua": return "Câu này không sửa được nữa, con đặt câu mới nhé.";
    case "sai_khuon": return "Câu chưa đủ phần, con kiểm tra lại câu hỏi và 4 đáp án nhé.";
    case "dang_nhap": return "Con cần đăng nhập lại rồi mới gửi câu được.";
    default: return "Chưa gửi được, con kiểm tra mạng rồi thử lại nhé.";
  }
}
const chuan = s => String(s || "").normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");

export function taoCauCuaBe(the) {
  const { mayChu, baoGoiY } = the;
  const lopBe = () => Math.max(1, Math.min(12, Math.floor(the.lopBe ? the.lopBe() : 2) || 2));
  const co = !!(mayChu && mayChu.cauCuaBe && mayChu.guiCau && mayChu.kiemCau);
  let dsMon = null, veLai = null, ganCau = null; // ganCau: gắn câu vừa duyệt vào công trình (đổi câu / mua câu, dt3d_tru.js)
  const tao = (the2, lop, chu) => { const e = document.createElement(the2); if (lop) e.className = lop; if (chu !== undefined) e.textContent = chu; return e; };
  const nut = (chu, lop) => { const b = tao("button", "d3Nut " + (lop || ""), chu); b.type = "button"; return b; };

  async function layMon() {
    if (dsMon) return dsMon;
    const kq = mayChu.monChuDe ? await mayChu.monChuDe().catch(() => null) : null;
    const ds = kq && kq.ok && Array.isArray(kq.mon) ? kq.mon.filter(m => m && m.ma).map(m => ({ ma: m.ma, ten: m.ten || m.ma, bieuTuong: m.bieuTuong || "📘" })) : [];
    return (dsMon = ds.length ? ds : MON_MAC_DINH);
  }

  // ---------- thẻ "Câu của con" trong bảng 📝 ----------
  // soi (KC_06F2): mã câu cần tô sáng + cuộn tới (bé chạm một tin ở 💡)
  async function ve(cd, ol, chonCau, soi) {
    veLai = () => ve(cd, ol, chonCau); ganCau = chonCau || null;
    cd.textContent = ""; ol.textContent = "⏳";
    // Hai lựa chọn (người dùng 12/11/2026): chọn câu trong kho của con | thêm câu mới
    const kho = nut("📚 Chọn trong kho của con", "d3CnChip d3CbKho"); kho.setAttribute("aria-pressed", "true");
    kho.addEventListener("click", () => ve(cd, ol, chonCau));
    const moi = nut("➕ Thêm câu mới", "d3CbMoi"); moi.addEventListener("click", () => soanMoi(null));
    const luot = tao("span", "d3CbLuot");
    cd.append(kho, moi, luot);
    const kq = await mayChu.cauCuaBe().catch(() => null);
    if (!ol.isConnected) return;
    ol.textContent = "";
    if (!kq || !kq.ok) { ol.textContent = "Chưa mở được câu của con, con thử lại sau nhé."; return; }
    if (Number.isInteger(kq.lop)) the.lopMayChu = kq.lop;
    const l = kq.luot || {};
    if (l.khoa) { luot.textContent = "Hôm nay mình nghỉ đặt câu nhé, mai con thử lại!"; moi.disabled = true; }
    else if (l.conLai === 0) { luot.textContent = "Hôm nay con đặt đủ " + (l.gioiHan || 10) + " câu rồi, mai đặt tiếp nhé!"; moi.disabled = true; }
    else if (Number.isInteger(l.conLai)) luot.textContent = "Hôm nay con còn " + l.conLai + " lượt đặt câu";
    // câu dùng được lên đầu, rồi câu cần sửa / đã cất, cuối cùng câu đang chờ (giữ thứ tự mới nhất trong từng nhóm)
    const THU_TU = { dat: 0, sua: 1, cat: 2, cho: 3 };
    const ds = (kq.cau || []).map((c, i) => [c, i]).sort((a, b) => (THU_TU[(TRANG_THAI[a[0].trangThai] || {}).lop] - THU_TU[(TRANG_THAI[b[0].trangThai] || {}).lop]) || a[1] - b[1]).map(x => x[0]);
    if (!ds.length) {
      const g = tao("li", "d3CbTrong");
      g.append(tao("b", "", "Con chưa đặt câu nào."), tao("div", "", "Con nghĩ ra một câu đố thật hay, cô chú xem xong là con gắn vào công trình để thử tài các bạn khác!"));
      ol.appendChild(g); return;
    }
    if (ds.some(c => (TRANG_THAI[c.trangThai] || {}).lop === "dat")) ol.appendChild(tao("li", "d3CbGoiY", chonCau ? "Chạm một câu có ✅ để gắn vào công trình."
      : "Câu có ✅ con gắn vào công trình ở nút 📝 / 🛡️ của công trình nhé."));
    const moiXem = [];
    for (const c of ds) {
      const tt = TRANG_THAI[c.trangThai] || TRANG_THAI.cho_nguoi, dung = tt.lop === "dat";
      const li = tao("li", "d3CauBe d3CauBe_" + tt.lop + (c.daXem ? "" : " d3CbMoiTin") + (soi && c.id === soi ? " d3CbSoi" : ""));
      li.dataset.cauId = String(c.id);
      const nhan = tao("small", "d3CbNhan", tt.nhan + (dung && c.soCongTrinh ? " · đang giữ " + c.soCongTrinh + " công trình" : ""));
      li.appendChild(nhan);
      const nd = tao("div", "", c.noiDung); li.appendChild(nd);
      const da = tao("div", "d3BangCauDa");
      (c.dapAn || []).forEach((x, i) => { const s = tao("span", (c.dung || []).indexOf(i) >= 0 ? "dung" : "", x); da.appendChild(s); });
      li.appendChild(da);
      if (c.nhayCam && tt.lop === "cho") li.appendChild(tao("p", "d3CbLyDo d3CbNhayCam", NHAY_CAM));
      if (tt.lop === "sua" || tt.lop === "cat") {
        const ly = [c.lyDo, c.goiY].filter(Boolean).join(" ");
        if (ly) li.appendChild(tao("p", "d3CbLyDo", "💬 " + ly));
      }
      // KC_06E3 (người dùng 14/11/2026): hàng nút của mỗi câu: 🛡️ Chọn câu này / 🦉 Nhờ Cô Cú đọc lại / ✏️ Sửa lại / 🗑 Xoá
      const hang = tao("div", "d3CbNutHang");
      let ganVao = null;
      if (dung && chonCau) {
        const cau = { id: c.id, noiDung: c.noiDung, dapAn: c.dapAn, dung: c.dung, loiGiai: c.loiGiai || "", mon: c.mon, doKho: c.muc || "", hinhChu: "", amThanh: "", lop: c.lop, chuDe: c.chuDe, cuaBe: true };
        ganVao = () => chonCau(cau);
        const chonNut = nut("🛡️ Chọn câu này", "d3CbChon"); chonNut.addEventListener("click", e => { e.stopPropagation(); ganVao(); });
        hang.appendChild(chonNut);
      }
      if (c.trangThai === "cho_ai" && mayChu.docLai) {
        const doc = nut("🦉 Nhờ Cô Cú đọc lại", "d3CbDocLai");
        doc.addEventListener("click", async e => {
          e.stopPropagation(); doc.disabled = true; doc.textContent = "🦉 Cô Cú đang đọc...";
          const kq = await mayChu.docLai(c.id).catch(() => null);
          if (!kq || !kq.ok) {
            doc.textContent = kq && kq.ma === "vua_doc" ? "Cô Cú vừa đọc xong, con chờ 1 phút nhé" : "Chưa nhờ được, con thử lại sau nhé";
            setTimeout(() => { doc.disabled = false; doc.textContent = "🦉 Nhờ Cô Cú đọc lại"; }, 4000); return;
          }
          if (mayChu.goiAi) await Promise.race([mayChu.goiAi().catch(() => null), new Promise(r => setTimeout(r, CHO_AI_MS))]);
          if (veLai) veLai();
        });
        hang.appendChild(doc);
      }
      if (SUA_DUOC.indexOf(c.trangThai) >= 0 && tt.lop !== "cho") {
        const sua = nut("✏️ Sửa lại", "d3CbSua"); sua.addEventListener("click", e => { e.stopPropagation(); soanMoi(c); });
        hang.appendChild(sua);
      }
      if (!c.congKhai && mayChu.xoaCau) { // chạm 2 lần mới xoá (không dùng hộp hỏi của trình duyệt)
        const xoa = nut("🗑 Xoá", "d3CbXoa"); let hoi = false, hen = null;
        xoa.addEventListener("click", async e => {
          e.stopPropagation();
          if (!hoi) {
            hoi = true; xoa.classList.add("hoi");
            xoa.textContent = c.soCongTrinh ? "Xoá thật? Câu đang giữ " + c.soCongTrinh + " công trình" : "Chạm lần nữa để xoá";
            hen = setTimeout(() => { hoi = false; xoa.classList.remove("hoi"); xoa.textContent = "🗑 Xoá"; }, 4000); return;
          }
          clearTimeout(hen); xoa.disabled = true;
          const kq = await mayChu.xoaCau(c.id).catch(() => null);
          if (kq && kq.ok) { if (typeof baoGoiY === "function") baoGoiY("🗑 Đã xoá câu của con"); if (veLai) veLai(); }
          else { xoa.textContent = kq && kq.ma === "cong_khai" ? "Câu đã vào thư viện chung, không xoá được" : "Chưa xoá được, con thử lại nhé"; }
        });
        hang.appendChild(xoa);
      }
      if (hang.childNodes.length) li.appendChild(hang);
      if (ganVao) {
        li.classList.add("d3CauChon"); li.tabIndex = 0; li.setAttribute("role", "button");
        li.title = "Chạm để gắn câu này vào công trình";
        li.addEventListener("click", ganVao);
        li.addEventListener("keydown", e => { if (e.target === li && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); ganVao(); } });
      }
      if (!c.daXem) moiXem.push(c.id);
      ol.appendChild(li);
    }
    if (moiXem.length && mayChu.daXemCau) mayChu.daXemCau(moiXem).catch(() => null);
    const soiLi = soi ? ol.querySelector('[data-cau-id="' + soi + '"]') : null;
    if (soiLi) { try { soiLi.scrollIntoView({ block: "center" }); } catch (e) { /* bỏ qua */ } }
    else if (soi) ol.insertBefore(tao("li", "d3CbGoiY", "Câu này không còn trong kho của con nữa."), ol.firstChild);
  }

  // ---------- màn soạn câu ----------
  async function soanMoi(cu) {
    const cuSo = document.getElementById("d3SoanCau"); if (cuSo) cuSo.remove();
    const p = tao("div", "d3Khung d3SoanCau"); p.id = "d3SoanCau"; p.setAttribute("role", "dialog"); p.setAttribute("aria-modal", "true");
    p.dataset.buoc = "soan";
    const dau = tao("div", "d3BangCauDau");
    const td = tao("b", "", cu ? "✏️ Sửa câu của con" : "✏️ Con đặt câu hỏi");
    const dong = nut("✖"); dong.setAttribute("aria-label", "Đóng"); dong.addEventListener("click", () => p.remove());
    dau.append(td, dong); p.appendChild(dau);

    // --- bước 1: soạn
    const soan = tao("div", "d3ScSoan");
    const trai = tao("section", "d3ScTrai"), phai = tao("section", "d3ScPhai");
    const nhanMon = tao("label", "d3ScNhan", "Môn"); const hangMon = tao("div", "d3ScMon"); hangMon.setAttribute("role", "radiogroup");
    const nhanLop = tao("label", "d3ScNhan", "Câu này cho lớp mấy?"); const chonLop = tao("select", "d3ScLop"); chonLop.id = "d3ScLop"; nhanLop.htmlFor = "d3ScLop";
    for (let i = 1; i <= 12; i++) { const o = tao("option", "", "Lớp " + i); o.value = String(i); chonLop.appendChild(o); }
    chonLop.value = String((cu && cu.lop) || the.lopMayChu || lopBe());
    const nhanCau = tao("label", "d3ScNhan", "Câu hỏi"); const oCau = tao("textarea", "d3ScCau"); oCau.id = "d3ScCau"; nhanCau.htmlFor = "d3ScCau";
    oCau.maxLength = 300; oCau.rows = 3; oCau.placeholder = "Ví dụ: Con vật nào là vua của rừng xanh?"; oCau.value = cu ? cu.noiDung : "";
    const demCau = tao("small", "d3ScDem");
    const nhanLg = tao("label", "d3ScNhan", "Lời giải (không bắt buộc)"); const oLg = tao("textarea", "d3ScLg"); oLg.id = "d3ScLg"; nhanLg.htmlFor = "d3ScLg";
    oLg.maxLength = 300; oLg.rows = 2; oLg.placeholder = "Vì sao đáp án đó đúng? Các bạn sẽ đọc sau khi trả lời."; oLg.value = cu ? (cu.loiGiai || "") : "";
    trai.append(nhanMon, hangMon, nhanLop, chonLop, nhanCau, oCau, demCau, nhanLg, oLg);
    const nhanDa = tao("div", "d3ScNhan", "4 đáp án · chạm ⭕ cạnh đáp án ĐÚNG");
    const dsDa = tao("ol", "d3ScDa");
    let dung = cu && Array.isArray(cu.dung) ? cu.dung[0] : -1;
    const oDa = [], nutDung = [];
    for (let i = 0; i < SO_DAP_AN; i++) {
      const li = tao("li", "d3ScDaO");
      const d = nut("⭕", "d3ScDung"); d.setAttribute("role", "radio"); d.setAttribute("aria-label", "Đáp án " + (i + 1) + " là đáp án đúng");
      const o = tao("input", "d3ScDaChu"); o.type = "text"; o.maxLength = 80; o.placeholder = "Đáp án " + (i + 1); o.setAttribute("aria-label", "Đáp án " + (i + 1));
      o.value = cu && cu.dapAn ? (cu.dapAn[i] || "") : "";
      d.addEventListener("click", () => { dung = i; veDung(); if (/⭕/.test(bao.textContent)) { bao.textContent = ""; bao.className = "d3ScBao"; } });
      li.append(d, o); dsDa.appendChild(li); oDa.push(o); nutDung.push(d);
    }
    function veDung() {
      nutDung.forEach((d, i) => { d.textContent = i === dung ? "✅" : "⭕"; d.setAttribute("aria-checked", String(i === dung)); d.parentNode.classList.toggle("dung", i === dung); });
    }
    veDung();
    const bao = tao("p", "d3ScBao"); bao.setAttribute("role", "status"); bao.setAttribute("aria-live", "polite");
    const hangNut = tao("div", "d3ScHang");
    const huy = nut("Để sau", "d3ScPhu"); huy.addEventListener("click", () => p.remove());
    // KC_06E2 (người dùng 14/11/2026): 🔍 Kiểm tra (lớp 1 máy chủ tự kiểm + trùng kho chung / kho của con, lớp 2 Cô Cú) -> đạt thì 📨 Gửi mới sáng
    const kiemNut = nut("🔍 Kiểm tra", "d3ScChinh d3ScKiem");
    const thu = nut("📨 Gửi", "d3ScChinh d3ScGui"); thu.disabled = true; thu.title = "Con bấm 🔍 Kiểm tra trước nhé";
    hangNut.append(huy, kiemNut, thu);
    phai.append(nhanDa, dsDa, bao, hangNut);
    // KC_06G (người dùng 17/11/2026): khung 🔎 Câu giống trong kho — bé gõ thì tự lọc, chạm một câu để xổ chi tiết. Chỉ tham khảo, không chặn.
    const tt = tao("section", "d3ScTT"); tt.hidden = !mayChu.tuongTu;
    const ttDau = nut("", "d3ScTTDau"); ttDau.setAttribute("aria-controls", "d3ScTTThan");
    const ttThan = tao("div", "d3ScTTThan"); ttThan.id = "d3ScTTThan";
    const ttBao = tao("p", "d3ScTTBao"); const ttDs = tao("ul", "d3ScTTDs");
    ttThan.append(ttBao, ttDs); tt.append(ttDau, ttThan);
    soan.append(trai, tt, phai);

    // --- bước 2: tự trả lời
    const thuB = tao("div", "d3ScThu");
    const thuTd = tao("p", "d3ScGoiY", "Trước khi gửi, con thử trả lời câu của mình nhé. Các bạn khác sẽ thấy câu y như thế này:");
    const thuCau = tao("div", "d3ScThuCau"); const thuDa = tao("div", "d3ScThuDa"); const thuBao = tao("p", "d3ScBao"); thuBao.setAttribute("role", "status");
    const thuHang = tao("div", "d3ScHang");
    const lui = nut("◀ Sửa lại", "d3ScPhu"); lui.addEventListener("click", () => { p.dataset.buoc = "soan"; });
    const gui = nut("📨 Gửi câu", "d3ScChinh"); gui.hidden = true;
    thuHang.append(lui, gui);
    thuB.append(thuTd, thuCau, thuDa, thuBao, thuHang);

    // --- bước 3: kết quả
    const kqB = tao("div", "d3ScKq");
    const kqChu = tao("p", "d3ScKqChu"); const kqHang = tao("div", "d3ScHang");
    const ganNut = nut("🛡️ Gắn vào công trình", "d3ScChinh d3ScGan"); ganNut.hidden = true;
    const xong = nut("👍 Xong", "d3ScChinh"); xong.addEventListener("click", () => { p.remove(); if (veLai) veLai(); });
    const themNua = nut("➕ Đặt câu khác", "d3ScPhu"); themNua.addEventListener("click", () => { if (veLai) veLai(); soanMoi(null); });
    kqHang.append(themNua, xong, ganNut); kqB.append(kqChu, kqHang);

    // lời góp ý của Cô Cú: đầu màn soạn (điện thoại bé thấy ngay, không bị đáp án che xuống dưới)
    const gopY = tao("div", "d3ScGopY"); gopY.hidden = true; gopY.setAttribute("role", "alert");
    p.append(gopY, soan, thuB, kqB);
    document.body.appendChild(p);

    const dem = () => { demCau.textContent = oCau.value.length + " / 300"; };
    oCau.addEventListener("input", dem); dem();
    const monDs = await layMon();
    if (!p.isConnected) return;
    let mon = cu ? cu.mon : null;
    if (!monDs.some(m => m.ma === mon)) mon = monDs[0].ma;
    function veMon() {
      hangMon.textContent = "";
      for (const m of monDs) {
        const b = nut(m.bieuTuong + " " + m.ten, "d3ScMonNut"); b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(m.ma === mon));
        b.addEventListener("click", () => { mon = m.ma; veMon(); henLoc(true); });
        hangMon.appendChild(b);
      }
    }
    veMon();
    // máy tính: con trỏ sẵn ở ô câu hỏi; điện thoại thì không (bàn phím bật lên che màn)
    if (window.matchMedia && window.matchMedia("(min-width: 900px)").matches) { try { oCau.focus({ preventScroll: true }); } catch (e) { /* bỏ qua */ } }

    // ---------- KC_06G: 🔎 CÂU GIỐNG TRONG KHO ----------
    // Máy tính: khung luôn mở (cột phải). Điện thoại: thu gọn thành một dòng có số câu, chạm để mở; kho có câu y hệt thì tự mở.
    const mayTinh = () => !!(window.matchMedia && window.matchMedia("(min-width: 900px)").matches);
    let ttMo = mayTinh(), ttSo = 0, ttHen = null, ttLuot = 0, ttChu = null, ttDaCo = false;
    const veDauTT = () => {
      ttDau.textContent = "🔎 Câu giống trong kho" + (ttSo ? " (" + ttSo + ")" : "") + (mayTinh() ? "" : ttMo ? " ▴" : " ▾");
      ttDau.setAttribute("aria-expanded", String(ttMo)); ttThan.hidden = !ttMo;
    };
    ttDau.addEventListener("click", () => { if (mayTinh()) return; ttMo = !ttMo; veDauTT(); });
    const loGop = c => [c.bieuTuong ? c.bieuTuong + " " + c.monTen : c.monTen, c.chuDe && c.chuDe !== "Khác" ? c.chuDe : "",
      Number.isInteger(c.lopTu) ? "Lớp " + c.lopTu + (Number.isInteger(c.lopDen) && c.lopDen !== c.lopTu ? "-" + c.lopDen : "") : ""].filter(Boolean).join(" · ");
    function veChiTiet(c) { // phần xổ xuống của một câu
      const ct = tao("div", "d3ScTTCt");
      const da = tao("ol", "d3ScTTDa");
      (c.dapAn || []).forEach((x, i) => { const li = tao("li", i === c.dung ? "dung" : "", (i === c.dung ? "✅ " : "") + x); da.appendChild(li); });
      ct.appendChild(da);
      if (c.loiGiai) ct.appendChild(tao("p", "d3ScTTLg", "💡 " + c.loiGiai));
      ct.appendChild(tao("small", "d3ScTTMeta", loGop(c)));
      if (c.soCung > 1) ct.appendChild(tao("small", "d3ScTTMeta", "Kho có " + c.soCung + " câu cùng lời hỏi này (khác hình, khác đáp án). Đây là một câu mẫu."));
      if (c.cuaBe && TRANG_THAI[c.trangThai]) ct.appendChild(tao("small", "d3ScTTMeta", TRANG_THAI[c.trangThai].nhan));
      return ct;
    }
    // gộp câu cùng lời hỏi (câu máy sinh "Có bao nhiêu bông hoa?" ×N chỉ khác hình): máy chủ đã gộp + trả soCung; đây gộp phòng hờ
    const gopCung = ds => {
      const theo = new Map();
      for (const c of ds) {
        const k = String(c.noiDung || "").toLowerCase().replace(/\s+/g, " ").trim();
        const cu = theo.get(k);
        if (cu) cu.soCung = (cu.soCung || 1) + (c.soCung || 1); else theo.set(k, { ...c });
      }
      return [...theo.values()];
    };
    function veTT(ds) {
      ds = gopCung(ds);
      ttDs.textContent = ""; ttSo = ds.length;
      const yHet = ds.some(c => c.yHet);
      if (!oCau.value.trim()) { ttBao.textContent = "Con gõ câu hỏi, câu giống trong kho sẽ hiện ở đây để con tham khảo."; ttBao.className = "d3ScTTBao"; }
      else if (!ds.length) { ttBao.textContent = "✨ Chưa có câu nào giống. Câu của con mới toanh!"; ttBao.className = "d3ScTTBao moi"; }
      else if (yHet) { ttBao.textContent = "📌 Kho đã có câu hỏi y như vậy. Con vẫn gửi được nếu đáp án đúng của con khác câu trong kho."; ttBao.className = "d3ScTTBao yhet"; }
      else { ttBao.textContent = "Các bạn đã hỏi những câu này. Con hỏi kiểu khác, hay đổi đáp án đều được nhé! Chạm một câu để xem."; ttBao.className = "d3ScTTBao"; }
      for (const c of ds) {
        const li = tao("li", "d3ScTTO" + (c.yHet ? " yhet" : ""));
        const b = nut("", "d3ScTTCau"); b.setAttribute("aria-expanded", "false");
        b.append(tao("span", "d3ScTTMui", "▸"), tao("span", "d3ScTTNd", c.noiDung));
        const nhan = tao("span", "d3ScTTNhan", (c.cuaBe ? "📚 của con" : (c.bieuTuong || "📘")) + (c.soCung > 1 ? " ×" + c.soCung : ""));
        b.appendChild(nhan);
        let ct = null;
        b.addEventListener("click", () => {
          const mo = b.getAttribute("aria-expanded") !== "true";
          ttDs.querySelectorAll(".d3ScTTCau[aria-expanded='true']").forEach(x => { x.setAttribute("aria-expanded", "false"); x.firstChild.textContent = "▸"; x.parentNode.classList.remove("mo"); });
          if (!mo) return;
          if (!ct) { ct = veChiTiet(c); li.appendChild(ct); }
          b.setAttribute("aria-expanded", "true"); b.firstChild.textContent = "▾"; li.classList.add("mo");
        });
        li.appendChild(b); ttDs.appendChild(li);
      }
      if (yHet && !ttMo) ttMo = true;
      veDauTT();
    }
    async function locTT() {
      const chu = oCau.value.trim().replace(/\s+/g, " ");
      if (chu === ttChu && ttChu !== null) return;
      ttChu = chu;
      const luot = ++ttLuot;
      if (chu.length < 4) { veTT([]); return; }
      const kq = await mayChu.tuongTu(chu, mon, suaId).catch(() => null);
      if (luot !== ttLuot || !p.isConnected) return;
      // lần đầu đã lỗi (máy chủ chưa có hàm vì chưa chạy SQL KC_06G, hoặc mất mạng): ẩn khung, bé soạn câu như cũ
      if (!kq || !kq.ok) { if (!ttDaCo) tt.hidden = true; return; }
      ttDaCo = true;
      veTT(Array.isArray(kq.cau) ? kq.cau : []);
    }
    function henLoc(ngay) { if (tt.hidden) return; clearTimeout(ttHen); if (ngay) ttChu = null; ttHen = setTimeout(locTT, ngay ? 0 : 450); }
    if (!tt.hidden) {
      oCau.addEventListener("input", () => henLoc());
      veTT([]); if (oCau.value.trim()) henLoc(true);
    }

    function kiem() { // trình duyệt chỉ kiểm cho bé đỡ mất công; máy chủ kiểm lại hết
      const nd = oCau.value.trim().replace(/\s+/g, " ");
      if (nd.length < 8) return [oCau, "Câu hỏi ngắn quá, con viết dài hơn một chút nhé."];
      for (const o of oDa) if (!o.value.trim()) return [o, "Con điền đủ 4 đáp án nhé."];
      const da = oDa.map(o => chuan(o.value));
      for (let i = 0; i < da.length; i++) if (da.indexOf(da[i]) !== i) return [oDa[i], "Có hai đáp án giống nhau rồi, con đổi một đáp án nhé."];
      if (dung < 0) return [nutDung[0], "Con chạm ⭕ cạnh đáp án đúng nhé."];
      return null;
    }
    const cauGui = () => ({ mon, lop: Number(chonLop.value), noiDung: oCau.value.trim().replace(/\s+/g, " "),
      dapAn: oDa.map(o => o.value.trim()), dung, loiGiai: oLg.value.trim() });

    thu.addEventListener("click", () => {
      if (!daKiemDat()) { thu.disabled = true; return; }
      const loi = kiem();
      if (loi) { bao.textContent = loi[1]; bao.className = "d3ScBao loi"; try { loi[0].focus(); } catch (e) { /* bỏ qua */ } return; }
      bao.textContent = ""; bao.className = "d3ScBao";
      const c = cauGui();
      thuCau.textContent = c.noiDung; thuDa.textContent = ""; thuBao.textContent = ""; thuBao.className = "d3ScBao"; gui.hidden = true; lui.hidden = false;
      const thuTu = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      for (const i of thuTu) {
        const b = nut(c.dapAn[i], "d3ScThuNut");
        b.addEventListener("click", () => {
          thuDa.querySelectorAll("button").forEach(x => { x.disabled = true; });
          if (i === c.dung) {
            b.classList.add("dung"); thuBao.textContent = "🎉 Đúng rồi! Con bấm 📨 Gửi câu nhé."; thuBao.className = "d3ScBao vui"; gui.hidden = false; gui.focus();
          } else {
            b.classList.add("sai"); thuBao.textContent = "Ơ, đáp án này chưa khớp với đáp án đúng con đã đánh dấu. Con xem lại câu nhé!";
            thuBao.className = "d3ScBao loi";
          }
        });
        thuDa.appendChild(b);
      }
      p.dataset.buoc = "thu";
    });

    // ---------- KC_06E2: 🔍 KIỂM TRA (bé chờ tại chỗ) ----------
    let suaId = cu ? cu.id : null, daKiem = null; // daKiem = { ma, ban } phiếu kiểm đạt của đúng bản câu đang soạn
    const banCau = () => JSON.stringify(cauGui());
    const daKiemDat = () => !!daKiem && daKiem.ban === banCau();
    const veGopY = (lop, ...dong) => {
      gopY.textContent = ""; gopY.className = "d3ScGopY " + lop; gopY.hidden = false;
      dong.filter(Boolean).forEach((d, i) => gopY.appendChild(tao(i ? "p" : "div", "", d)));
    };
    // bé sửa câu sau khi đã kiểm đạt -> nút Gửi tắt, phải kiểm lại
    const doiChu = () => {
      if (daKiem && !daKiemDat()) { daKiem = null; thu.disabled = true; veGopY("nhac", "✏️ Con vừa sửa câu, bấm 🔍 Kiểm tra lại nhé."); }
    };
    soan.addEventListener("input", doiChu); soan.addEventListener("click", () => setTimeout(doiChu, 0)); chonLop.addEventListener("change", doiChu);

    // Cô Cú chấm phiếu kiểm; quá giờ (KC_06F2: ai.giay_cho_be, mặc định 12 giây) thì hỏi máy chủ kết quả một lần rồi thôi chờ.
    // Cô Cú vẫn đọc tiếp ở máy chủ: bé gửi trước thì kết quả ghi vào câu + tin ở 💡 (SQL kc06f2).
    const choAi = async (ma, ms) => {
      let kq = null;
      if (mayChu.aiKiem) kq = await Promise.race([mayChu.aiKiem(ma).catch(() => null), new Promise(r => setTimeout(() => r(null), ms || CHO_AI_MS))]);
      if (kq && (kq.ketQua === "dat" || kq.ketQua === "loai")) return kq;
      if (mayChu.xemKiem) { const x = await mayChu.xemKiem(ma).catch(() => null); if (x && x.ok && (x.ai === "dat" || x.ai === "loai")) return Object.assign({ ketQua: x.ai }, x); }
      return { ketQua: "loi" };
    };
    kiemNut.addEventListener("click", async () => {
      const loi = kiem();
      if (loi) { bao.textContent = loi[1]; bao.className = "d3ScBao loi"; try { loi[0].focus(); } catch (e) { /* bỏ qua */ } return; }
      bao.textContent = ""; bao.className = "d3ScBao";
      const ban = banCau(); daKiem = null; thu.disabled = true; kiemNut.disabled = true;
      veGopY("doi", "🔍 Đang kiểm tra câu của con...");
      p.scrollTop = 0;
      let kq; try { kq = await mayChu.kiemCau(suaId, cauGui()); } catch (e) { kq = null; }
      if (!p.isConnected) return;
      if (!kq || !kq.ok) {
        kiemNut.disabled = false;
        const k = kq || {};
        if (k.ma === "trung" && k.cuaBe) veGopY("loi", "📚 Câu này đã có trong kho của con rồi. Con nghĩ câu khác nhé!", k.giongVoi ? "Câu giống: “" + k.giongVoi + "”" : "");
        else if (k.ma === "het_kiem") veGopY("loi", "Hôm nay con kiểm tra nhiều quá rồi, mai mình đặt tiếp nhé!");
        else veGopY("loi", loiChoBe(k), k.ma === "trung" && k.giongVoi ? "Câu giống: “" + k.giongVoi + "”" : "");
        if (k.ma === "khoa" || (k.luot && k.luot.khoa)) { kiemNut.disabled = true; veGopY("loi", loiChoBe({ ma: "khoa" })); }
        return;
      }
      let ai = { ketQua: "tat" };
      if (kq.goiAi) {
        // KC_06F2: bé chờ tối đa giayChoBe giây (máy chủ gửi; máy chủ cũ chưa có thì 12), có đếm ngược
        const giay = Math.max(5, Math.min(60, Math.round(Number(kq.giayChoBe)) || CHO_BE_GIAY));
        let con = giay;
        const dem = () => veGopY("doi", "✅ Câu qua vòng kiểm của app.", "🦉 Cô Cú đang đọc câu của con, con chờ một chút nhé... ⏱️ " + con);
        dem();
        const hen = setInterval(() => { con = Math.max(0, con - 1); if (p.isConnected && gopY.classList.contains("doi")) dem(); }, 1000);
        try { ai = await choAi(kq.maKiem, giay * 1000); } finally { clearInterval(hen); }
        if (!p.isConnected) return;
      }
      kiemNut.disabled = false;
      if (banCau() !== ban) { veGopY("nhac", "✏️ Con vừa sửa câu, bấm 🔍 Kiểm tra lại nhé."); return; }
      const nhay = kq.nhayCam || ai.nhayCam;
      if (ai.ketQua === "loai") {
        veGopY("loi", "🦉 Cô Cú góp ý: " + (ai.lyDo || "Câu này chưa ổn lắm."), ai.goiY ? "💡 " + ai.goiY : "", "Con sửa rồi bấm 🔍 Kiểm tra lại nhé!");
        return;
      }
      daKiem = { ma: kq.maKiem, ban, ai: ai.ketQua, nhay }; thu.disabled = false; thu.title = "";
      if (ai.ketQua === "dat") veGopY("dat", "✅ Cô Cú khen: " + (ai.lyDo || "Câu hay lắm!"), nhay ? NHAY_CAM : "", "Con bấm 📨 Gửi nhé!");
      else if (ai.ketQua === "tat") veGopY("dat", "✅ Câu qua vòng kiểm rồi!", "Gửi xong cô chú sẽ xem, duyệt rồi con gắn vào công trình được. Con bấm 📨 Gửi nhé!");
      else veGopY("nhac", "✅ Câu qua vòng kiểm của app.", "🦉 Cô Cú đọc hơi lâu, con không cần chờ nữa!",
        "Con bấm 📨 Gửi, tự trả lời câu của con là câu vào kho. Cô Cú đọc tiếp, đọc xong sẽ báo con ở 💡 trên cùng màn hình. Đạt thì con gắn vào công trình được.");
      try { thu.focus({ preventScroll: true }); } catch (e) { /* bỏ qua */ }
    });

    // ---------- 📨 GỬI (chỉ khi đã kiểm đạt, sau khi bé tự trả lời đúng) ----------
    const ketThuc = (chu, l, cauMoi) => {
      kqChu.textContent = chu;
      themNua.hidden = !(l && l.conLai > 0) || !!(l && l.khoa);
      ganNut.hidden = !(cauMoi && ganCau);
      if (cauMoi && ganCau) ganNut.onclick = () => { p.remove(); ganCau(cauMoi); };
      p.dataset.buoc = "kq"; (ganNut.hidden ? xong : ganNut).focus();
    };
    gui.addEventListener("click", async () => {
      if (!daKiemDat()) { p.dataset.buoc = "soan"; thu.disabled = true; veGopY("nhac", "Con bấm 🔍 Kiểm tra trước nhé."); return; }
      gui.disabled = true; lui.disabled = true; thuBao.textContent = "⏳ Đang gửi..."; thuBao.className = "d3ScBao";
      let kq;
      try { kq = await mayChu.guiCau(suaId, cauGui(), daKiem.ma); } catch (e) { kq = null; }
      gui.disabled = false; lui.disabled = false;
      if (!p.isConnected) return;
      if (!kq || !kq.ok) {
        const k = kq || {};
        if (["chan", "trung", "sai_khuon", "chua_kiem"].indexOf(k.ma) >= 0) { // về màn soạn, giữ chữ, kiểm lại
          daKiem = null; thu.disabled = true; p.dataset.buoc = "soan"; p.scrollTop = 0;
          veGopY("loi", k.ma === "chua_kiem" ? "Con bấm 🔍 Kiểm tra lại câu nhé." : loiChoBe(k), k.ma === "trung" && k.giongVoi ? "Câu giống: “" + k.giongVoi + "”" : "");
        } else { thuBao.textContent = loiChoBe(k); thuBao.className = "d3ScBao loi"; if (k.ma === "het_luot" || k.ma === "khoa") gui.hidden = true; }
        return;
      }
      const c = kq.cau || {}, tt = c.trangThai, l = kq.luot;
      if (c.id) suaId = c.id;
      daKiem = null;
      if (typeof baoGoiY === "function") baoGoiY("📨 Đã gửi câu của con");
      if (veLai) veLai();
      if (kq.goiAi && mayChu.goiAi) mayChu.goiAi().catch(() => null); // Cô Cú bận lúc kiểm: đánh thức chấm hàng chờ
      if (tt === "ai_dat" || tt === "dat") ketThuc("✅ Câu đã vào kho của con! Con gắn vào công trình được ngay rồi.", l, c);
      else if (c.nhayCam) ketThuc("📨 Câu đã vào kho của con. " + NHAY_CAM, l);
      else if (tt === "cho_ai") {
        // KC_06F2: Cô Cú chấm ngầm -> 💡 hỏi máy chủ dày hơn một lúc để báo bé sớm
        try { window.dispatchEvent(new CustomEvent("kc-cau-cho-ngam", { detail: { id: c.id } })); } catch (e) { /* bỏ qua */ }
        ketThuc("📨 Câu đã vào kho của con! 🦉 Cô Cú đang đọc tiếp, đọc xong sẽ báo con ở 💡 trên cùng màn hình. Đạt là con gắn vào công trình được.", l);
      }
      else ketThuc("📨 Câu đã vào kho của con. Cô chú duyệt xong là con gắn vào công trình được. Con xem ở thẻ ✏️ Câu riêng của con nhé!", l);
    });
  }

  return { co, ve, soanMoi, loiChoBe };
}
// 14/11/2026 - BƯỚC: KC_06E3 (nút 🛡️ Chọn câu này, 🦉 Nhờ Cô Cú đọc lại, 🗑 Xoá); KC_06E2
// 17/11/2026 10:00 - KC_06G sửa sau thử thật: câu cùng lời hỏi (câu máy sinh khác hình) gộp một dòng, nhãn ×N
// 17/11/2026 - BƯỚC: KC_06G (khung 🔎 Câu giống trong kho: tự lọc khi bé gõ, chạm xổ chi tiết; lời báo trùng chỉ còn cho câu y hệt)
// 17/11/2026 - BƯỚC: KC_06F2 (🔍 chờ Cô Cú tối đa 12 giây có đếm ngược, rồi bé gửi luôn, Cô Cú chấm ngầm báo ở 💡; ve(..., soi) tô câu từ tin 💡)
