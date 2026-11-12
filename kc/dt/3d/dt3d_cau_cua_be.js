// ================================================================
// FILE: dt/3d/dt3d_cau_cua_be.js  (ES module) - "✏️ CÂU CỦA CON": BÉ TỰ ĐẶT CÂU HỎI (KC_06D, Thiet_Ke_Kho_Cau_Hoi.md mục 4, 5, 9)
// CHỨC NĂNG: - Thẻ "✏️ Câu của con" trong bảng 📝 Cập nhật câu hỏi (dt3d_tru.js): 2 lựa chọn 📚 Chọn trong kho của con | ➕ Thêm câu mới + số lượt còn hôm nay, danh sách
//              câu bé đã đặt với nhãn trạng thái thân thiện (⏳ đang xem / ✅ dùng được / ✏️ cần sửa / 🙈 đã cất). Câu dùng được
//              chạm là gắn vào công trình (như câu thư viện). Câu cần sửa / đã cất có lý do + gợi ý và nút ✏️ Sửa lại.
//              Câu có tin mới (vừa được duyệt / bị loại) tô sáng, rồi báo máy chủ "đã xem".
//            - Màn soạn (#d3SoanCau): môn, lớp (mặc định lớp của bé), câu hỏi, 4 đáp án (chạm ⭕ để chọn đáp án đúng), lời giải
//              (không bắt buộc) -> "👉 Con thử trả lời" (bé phải tự trả lời đúng câu của mình, đáp án xáo) -> 📨 Gửi câu.
//              Điện thoại: một cột cuộn. Máy tính: 2 cột (trái câu hỏi, phải đáp án), chữ to.
//            - Máy chủ chặn lại hết (giới hạn ngày, từ cấm, thông tin riêng, trùng, khoá tạm): trang chỉ đổi MÃ lỗi thành lời
//              nhẹ nhàng, không bao giờ nói từ nào bị bắt.
//            - Câu có chủ đề nhạy cảm học tập (máy chủ trả nhayCam): vẫn vào Câu của con nhưng chỉ gắn được khi admin duyệt, kể cả khi AI
//              cho đạt; trang báo rõ cho bé lúc gửi và trong danh sách (người dùng 12/11/2026).
// HÀM KHAI RA: taoCauCuaBe({ mayChu, lopBe, baoGoiY }) -> { co, ve(cd, ol, chonCau) -> Promise, soanMoi(cau?) }
//   mayChu: cauCuaBe() / guiCau(id, cau) / daXemCau(ids) / monChuDe() (dt_may_chu_sb.js; máy chủ giả không có -> co = false)
//   cd, ol: chỗ vẽ thanh công cụ + danh sách (hàng chủ đề + danh sách câu của thư viện); chonCau(câu có id) gắn vào công trình.
// BƯỚC: KC_06D - NGÀY: 12/11/2026
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
    case "trung": return "Thư viện có câu này rồi, con thử nghĩ câu khác nhé!";
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
  const co = !!(mayChu && mayChu.cauCuaBe && mayChu.guiCau);
  let dsMon = null, veLai = null;
  const tao = (the2, lop, chu) => { const e = document.createElement(the2); if (lop) e.className = lop; if (chu !== undefined) e.textContent = chu; return e; };
  const nut = (chu, lop) => { const b = tao("button", "d3Nut " + (lop || ""), chu); b.type = "button"; return b; };

  async function layMon() {
    if (dsMon) return dsMon;
    const kq = mayChu.monChuDe ? await mayChu.monChuDe().catch(() => null) : null;
    const ds = kq && kq.ok && Array.isArray(kq.mon) ? kq.mon.filter(m => m && m.ma).map(m => ({ ma: m.ma, ten: m.ten || m.ma, bieuTuong: m.bieuTuong || "📘" })) : [];
    return (dsMon = ds.length ? ds : MON_MAC_DINH);
  }

  // ---------- thẻ "Câu của con" trong bảng 📝 ----------
  async function ve(cd, ol, chonCau) {
    veLai = () => ve(cd, ol, chonCau);
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
    if (ds.some(c => (TRANG_THAI[c.trangThai] || {}).lop === "dat")) ol.appendChild(tao("li", "d3CbGoiY", "Chạm một câu có ✅ để gắn vào công trình."));
    const moiXem = [];
    for (const c of ds) {
      const tt = TRANG_THAI[c.trangThai] || TRANG_THAI.cho_nguoi, dung = tt.lop === "dat";
      const li = tao("li", "d3CauBe d3CauBe_" + tt.lop + (c.daXem ? "" : " d3CbMoiTin"));
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
      if (SUA_DUOC.indexOf(c.trangThai) >= 0 && tt.lop !== "cho") {
        const sua = nut("✏️ Sửa lại", "d3CbSua"); sua.addEventListener("click", e => { e.stopPropagation(); soanMoi(c); });
        li.appendChild(sua);
      }
      if (dung && chonCau) {
        li.classList.add("d3CauChon"); li.tabIndex = 0; li.setAttribute("role", "button");
        li.title = "Chạm để gắn câu này vào công trình";
        const cau = { id: c.id, noiDung: c.noiDung, dapAn: c.dapAn, dung: c.dung, loiGiai: c.loiGiai || "", mon: c.mon, doKho: c.muc || "", hinhChu: "", amThanh: "", lop: c.lop, chuDe: c.chuDe, cuaBe: true };
        const chon = () => chonCau(cau);
        li.addEventListener("click", chon);
        li.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); chon(); } });
      }
      if (!c.daXem) moiXem.push(c.id);
      ol.appendChild(li);
    }
    if (moiXem.length && mayChu.daXemCau) mayChu.daXemCau(moiXem).catch(() => null);
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
    const thu = nut("👉 Con thử trả lời", "d3ScChinh");
    hangNut.append(huy, thu);
    phai.append(nhanDa, dsDa, bao, hangNut);
    soan.append(trai, phai);

    // --- bước 2: tự trả lời
    const thuB = tao("div", "d3ScThu");
    const thuTd = tao("p", "d3ScGoiY", "Con thử trả lời câu của mình nhé. Các bạn khác sẽ thấy câu y như thế này:");
    const thuCau = tao("div", "d3ScThuCau"); const thuDa = tao("div", "d3ScThuDa"); const thuBao = tao("p", "d3ScBao"); thuBao.setAttribute("role", "status");
    const thuHang = tao("div", "d3ScHang");
    const lui = nut("◀ Sửa lại", "d3ScPhu"); lui.addEventListener("click", () => { p.dataset.buoc = "soan"; });
    const gui = nut("📨 Gửi câu", "d3ScChinh"); gui.hidden = true;
    thuHang.append(lui, gui);
    thuB.append(thuTd, thuCau, thuDa, thuBao, thuHang);

    // --- bước 3: kết quả
    const kqB = tao("div", "d3ScKq");
    const kqChu = tao("p", "d3ScKqChu"); const kqHang = tao("div", "d3ScHang");
    const xong = nut("👍 Xong", "d3ScChinh"); xong.addEventListener("click", () => { p.remove(); if (veLai) veLai(); });
    const themNua = nut("➕ Đặt câu khác", "d3ScPhu"); themNua.addEventListener("click", () => { if (veLai) veLai(); soanMoi(null); });
    kqHang.append(themNua, xong); kqB.append(kqChu, kqHang);

    p.append(soan, thuB, kqB);
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
        b.addEventListener("click", () => { mon = m.ma; veMon(); });
        hangMon.appendChild(b);
      }
    }
    veMon();
    // máy tính: con trỏ sẵn ở ô câu hỏi; điện thoại thì không (bàn phím bật lên che màn)
    if (window.matchMedia && window.matchMedia("(min-width: 900px)").matches) { try { oCau.focus({ preventScroll: true }); } catch (e) { /* bỏ qua */ } }

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
            b.classList.add("dung"); thuBao.textContent = "🎉 Đúng rồi! Con gửi câu cho cô chú xem nhé."; thuBao.className = "d3ScBao vui"; gui.hidden = false; gui.focus();
          } else {
            b.classList.add("sai"); thuBao.textContent = "Ơ, đáp án này chưa khớp với đáp án đúng con đã đánh dấu. Con xem lại câu nhé!";
            thuBao.className = "d3ScBao loi";
          }
        });
        thuDa.appendChild(b);
      }
      p.dataset.buoc = "thu";
    });

    gui.addEventListener("click", async () => {
      gui.disabled = true; lui.disabled = true; thuBao.textContent = "⏳ Đang gửi..."; thuBao.className = "d3ScBao";
      let kq;
      try { kq = await mayChu.guiCau(cu ? cu.id : null, cauGui()); } catch (e) { kq = null; }
      gui.disabled = false; lui.disabled = false;
      if (!p.isConnected) return;
      if (!kq || !kq.ok) {
        const loi = loiChoBe(kq);
        // lỗi nội dung: quay về màn soạn để bé sửa, giữ nguyên chữ đã gõ
        if (kq && ["chan", "trung", "sai_khuon"].indexOf(kq.ma) >= 0) {
          bao.textContent = loi + (kq.ma === "trung" && kq.giongVoi ? " Câu giống: “" + kq.giongVoi + "”" : ""); bao.className = "d3ScBao loi";
          p.dataset.buoc = "soan";
          if (kq.ma === "chan" && kq.luot && kq.luot.khoa) { thu.disabled = true; bao.textContent = loiChoBe({ ma: "khoa" }); }
        } else { thuBao.textContent = loi; thuBao.className = "d3ScBao loi"; if (kq && (kq.ma === "het_luot" || kq.ma === "khoa")) gui.hidden = true; }
        return;
      }
      const tt = kq.cau && kq.cau.trangThai;
      kqChu.textContent = kq.cau && kq.cau.nhayCam
        ? "📨 Câu đã vào thẻ ✏️ Câu của con. " + NHAY_CAM
        : (tt === "cho_ai" ? "🦉 Cô Cú đang đọc câu của con..." : "⏳ Cô chú đang xem câu của con...")
          + " Câu được duyệt là con gắn vào công trình được ngay. Con xem kết quả ở thẻ ✏️ Câu của con nhé!";
      const l = kq.luot || {};
      themNua.hidden = !(l.conLai > 0) || !!l.khoa;
      p.dataset.buoc = "kq";
      if (typeof baoGoiY === "function") baoGoiY("📨 Đã gửi câu của con");
      if (mayChu.goiAi && kq.goiAi) mayChu.goiAi().catch(() => null); // KC_06E: đánh thức AI chấm
      xong.focus();
    });
  }

  return { co, ve, soanMoi, loiChoBe };
}
// 12/11/2026 - BƯỚC: KC_06D
