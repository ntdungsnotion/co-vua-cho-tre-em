// ================================================================
// FILE: dt/3d/dt3d_bong_den.js  (ES module) - 💡 BÓNG ĐIỆN THÔNG BÁO Ở THANH TRÊN CỦA GAME
// CHỨC NĂNG: KC_06F2 (người dùng 14/11/2026: "bổ sung bóng điện thông báo ở thanh trên game, bé có thể theo dõi câu nào đã
//            chấm xong"). Nút 💡 cuối thanh trên (.d3Tren), có chấm đỏ số tin mới (bảng kc_be_thong_bao, RPC kc_be_thong_bao_ds).
//            - Chạm 💡: bảng "💡 Tin của con" (mới nhất trước; tin mới có nhãn "Mới"): Cô Cú đọc xong (✅ dùng được / ✏️ cần sửa /
//              ⏳ chờ cô chú), cô chú duyệt (🌟), câu bị trả lại (🙈). Mở bảng là các tin đã đọc (số đỏ về 0).
//            - Chạm một tin có câu của con: mở bảng "✏️ Câu riêng của con" (dt3d_cau_cua_be.js), câu đó tô sáng + cuộn tới.
//            - Hỏi máy chủ mỗi 30 giây khi trang đang hiện; bé vừa gửi câu Cô Cú chấm ngầm (sự kiện "kc-cau-cho-ngam") thì hỏi dày
//              hơn (8, 20, 40, 70 giây). Có tin mới thì 💡 rung + lời nhắc ở ô gợi ý.
//            - Máy chủ chưa có hàm (chưa chạy SQL KC_06F2) / máy chủ giả: không hiện nút 💡.
//            Điện thoại: nút gọn cạnh thanh tài nguyên, bảng phủ gần hết màn hình; máy tính: hộp giữa 560px (khung .d3BangCau).
// DÙNG: taoBongDen({ mayChu, cauBe, baoGoiY, tren }) -> { lamMoi(), mo(), dong() } | null
//   mayChu.dsThongBao(so) + daXemThongBao(ids) (dt_may_chu_sb.js); cauBe = taoCauCuaBe(...) (để mở Câu riêng của con)
// BƯỚC: KC_06F2 - NGÀY: 17/11/2026
// ================================================================
import { loiTin, bieuTuongTin, cauCuaTin } from "./dt3d_thong_bao.js";

const tao = (the, lop, chu) => { const e = document.createElement(the); if (lop) e.className = lop; if (chu !== undefined) e.textContent = chu; return e; };
const CHU_KY_MS = 30000, DAY_MS = [8000, 20000, 40000, 70000];

// "vừa xong" / "5 phút trước" / "2 giờ trước" / "3 ngày trước"
export function luc(chu, bayGio) {
  const t = Date.parse(chu); if (!Number.isFinite(t)) return "";
  const p = Math.max(0, Math.round(((bayGio || Date.now()) - t) / 60000));
  if (p < 1) return "vừa xong";
  if (p < 60) return p + " phút trước";
  if (p < 60 * 24) return Math.round(p / 60) + " giờ trước";
  return Math.round(p / 1440) + " ngày trước";
}

export function taoBongDen(the) {
  const { mayChu, cauBe, baoGoiY } = the || {};
  if (!mayChu || !mayChu.dsThongBao || !mayChu.daXemThongBao) return null;
  const tren = the.tren || document.querySelector(".d3Tren");
  if (!tren) return null;

  const nutDen = tao("button", "d3Nut d3Khung d3BongDen"); nutDen.type = "button"; nutDen.id = "d3BongDen"; nutDen.hidden = true;
  nutDen.setAttribute("aria-label", "Tin của con");
  const hinh = tao("span", "d3BdHinh", "💡"), so = tao("b", "d3BdSo"); so.hidden = true;
  nutDen.append(hinh, so);
  tren.appendChild(nutDen);

  let tin = [], tong = 0, daCo = false, hen = null, dayHen = [], dangHoi = false;
  const veSo = () => {
    so.hidden = !(tong > 0); so.textContent = tong > 9 ? "9+" : String(tong);
    nutDen.classList.toggle("coTin", tong > 0);
    nutDen.setAttribute("aria-label", tong > 0 ? "Tin của con: " + tong + " tin mới" : "Tin của con");
  };

  async function lamMoi() {
    if (dangHoi) return; dangHoi = true;
    let kq; try { kq = await mayChu.dsThongBao(30); } catch (e) { kq = null; } finally { dangHoi = false; }
    if (!kq || !kq.ok || !Array.isArray(kq.tin)) return; // máy chủ chưa có hàm / mạng lỗi: giữ như cũ
    const truoc = tong, lanDau = !daCo;
    tin = kq.tin.filter(t => t && loiTin(t)); tong = tin.filter(t => !t.daXem).length;
    daCo = true; nutDen.hidden = false; veSo();
    if (tong > truoc && !lanDau) { // tin mới tới lúc đang chơi
      nutDen.classList.remove("rung"); void nutDen.offsetWidth; nutDen.classList.add("rung");
      const moi = tin.find(t => !t.daXem);
      if (typeof baoGoiY === "function") baoGoiY(moi && /^ai_/.test(moi.loai) ? "💡 Cô Cú đọc xong câu của con rồi! Chạm 💡 để xem nhé." : "💡 Con có tin mới! Chạm 💡 để xem nhé.");
    } else if (lanDau && tong > 0 && typeof baoGoiY === "function" && tin.some(t => !t.daXem && t.loai !== "cau_bi_tra")) {
      baoGoiY("💡 Con có " + tong + " tin mới. Chạm 💡 để xem nhé!");
    }
    const p = document.getElementById("d3BangTin"); if (p) veDs(p.querySelector(".d3TbDs"));
  }

  // ---------- bảng 💡 Tin của con ----------
  function veDs(ul) {
    if (!ul) return;
    ul.textContent = "";
    if (!tin.length) {
      const li = tao("li", "d3TbTin d3BdTrong");
      li.append(tao("p", "d3Tb_chinh", "Chưa có tin nào."), tao("p", "d3Tb_goiY", "Con đặt câu hỏi ở nút 📝 của công trình. Cô Cú đọc xong sẽ báo con ở đây nhé!"));
      ul.appendChild(li); return;
    }
    const bayGio = Date.now();
    for (const t of tin) {
      const li = tao("li", "d3TbTin d3BdTin d3BdTin_" + t.loai + (t.moi ? " moi" : ""));
      const dau = tao("div", "d3BdDau");
      dau.appendChild(tao("span", "d3BdBt", bieuTuongTin(t)));
      if (t.moi) dau.appendChild(tao("span", "d3BdMoi", "Mới"));
      dau.appendChild(tao("small", "d3BdLuc", luc(t.luc, bayGio)));
      li.appendChild(dau);
      loiTin(t).forEach(([lop, chu]) => li.appendChild(tao("p", "d3Tb_" + lop, chu)));
      const ma = cauCuaTin(t);
      if (ma && cauBe && cauBe.co) {
        li.classList.add("d3CauChon"); li.tabIndex = 0; li.setAttribute("role", "button"); li.title = "Chạm để xem câu này";
        const xem = tao("span", "d3BdXem", "✏️ Xem câu ›"); li.appendChild(xem);
        const mo = () => { dong(); moCauCuaCon(ma); };
        li.addEventListener("click", mo);
        li.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); mo(); } });
      }
      ul.appendChild(li);
    }
  }

  function mo() {
    dong(); const cuCau = document.getElementById("d3CauCon"); if (cuCau) cuCau.remove();
    const p = tao("div", "d3BangCau d3Khung d3ThongBao d3BangTin"); p.id = "d3BangTin"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Tin của con");
    const dau = tao("div", "d3BangCauDau");
    const dongNut = tao("button", "d3Nut", "✖"); dongNut.type = "button"; dongNut.setAttribute("aria-label", "Đóng"); dongNut.addEventListener("click", dong);
    dau.append(tao("b", "", "💡 Tin của con"), dongNut); p.appendChild(dau);
    const ul = tao("ul", "d3TbDs"); p.appendChild(ul);
    // tin chưa đọc: nhãn "Mới" trong lần mở này, rồi báo máy chủ đã đọc (số đỏ về 0)
    const chuaDoc = tin.filter(t => !t.daXem);
    chuaDoc.forEach(t => { t.moi = true; t.daXem = true; });
    tin.forEach(t => { if (chuaDoc.indexOf(t) < 0) t.moi = false; });
    tong = 0; veSo(); nutDen.classList.remove("rung");
    veDs(ul);
    document.body.appendChild(p);
    nutDen.setAttribute("aria-expanded", "true");
    try { dongNut.focus({ preventScroll: true }); } catch (e) { /* bỏ qua */ }
    if (chuaDoc.length) mayChu.daXemThongBao(chuaDoc.map(t => t.id).slice(0, 100)).catch(() => null);
  }
  function dong() {
    const p = document.getElementById("d3BangTin"); if (p) p.remove();
    nutDen.setAttribute("aria-expanded", "false");
  }

  // ---------- bảng ✏️ Câu riêng của con (mở từ một tin) ----------
  function moCauCuaCon(ma) {
    const cu = document.getElementById("d3CauCon"); if (cu) cu.remove();
    const p = tao("div", "d3BangCau d3Khung d3ThongBao d3CauCon"); p.id = "d3CauCon"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Câu riêng của con");
    const dau = tao("div", "d3BangCauDau");
    const lui = tao("button", "d3Nut", "‹ 💡"); lui.type = "button"; lui.setAttribute("aria-label", "Về danh sách tin"); lui.addEventListener("click", () => { p.remove(); mo(); });
    const dongNut = tao("button", "d3Nut", "✖"); dongNut.type = "button"; dongNut.setAttribute("aria-label", "Đóng"); dongNut.addEventListener("click", () => p.remove());
    dau.append(lui, tao("b", "", "✏️ Câu riêng của con"), dongNut); p.appendChild(dau);
    // cùng khung + lớp với thẻ Câu của con trong bảng 📝 (dt3d_tru.js) để dùng chung kiểu chữ / nút
    const tv = tao("div", "d3CnTv"), cd = tao("div", "d3CnCd"), ol = tao("ol", "d3ChonCauDs");
    tv.append(cd, ol); p.appendChild(tv);
    document.body.appendChild(p);
    try { dongNut.focus({ preventScroll: true }); } catch (e) { /* bỏ qua */ }
    cauBe.ve(cd, ol, null, ma).catch(() => { ol.textContent = "Chưa mở được câu của con, con thử lại sau nhé."; });
  }

  nutDen.addEventListener("click", () => { if (document.getElementById("d3BangTin")) dong(); else mo(); });
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const c = document.getElementById("d3CauCon"); if (c && !document.getElementById("d3SoanCau")) { c.remove(); return; }
    if (document.getElementById("d3BangTin")) dong();
  });

  // ---------- hỏi máy chủ ----------
  const henLai = () => { clearTimeout(hen); hen = setTimeout(() => { if (document.visibilityState !== "hidden") lamMoi(); henLai(); }, CHU_KY_MS); };
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") lamMoi(); });
  window.addEventListener("kc-cau-cho-ngam", () => { dayHen.forEach(clearTimeout); dayHen = DAY_MS.map(ms => setTimeout(lamMoi, ms)); });
  lamMoi(); henLai();
  return { lamMoi, mo, dong, nut: nutDen };
}
// 17/11/2026 - BƯỚC: KC_06F2
