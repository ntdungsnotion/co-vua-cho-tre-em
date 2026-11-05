// ================================================================
// FILE: dt/3d/dt3d_tru.js  (ES module) - TRỤ PHÒNG THỦ TRÊN BẢN ĐỒ (TC_D06C2g, người dùng 05/11/2026)
// CHỨC NĂNG: Trụ tên (luật dt/dt_tru_tran.js, máy chủ giữ câu + chấm) trong Thung Lũng:
//            - TRỤ CỦA MÌNH dựng xong mà chưa có câu: máy bé chọn ngẫu nhiên soCau câu trong kho (Toán + Tiếng Anh theo
//              trình độ của bé, dt_cau_hoi.js; bỏ câu có hình) rồi gửi máy chủ (truCau). TC_D06E: bé đổi câu bằng thư viện.
//            - Chạm trụ của mình: thanh dưới có ❤️ máu · 🎯 tầm · tỉ lệ đúng · nút "📜 7 câu" mở bảng xem câu + đáp án.
//              Chạm trụ của bạn: máu, tầm (không thấy câu).
//            - TRỤ CỦA BẠN KHÁC: Thủ lĩnh (rảnh: không tới / đánh quái, không nghỉ) đi vào tầm trụ (đã có câu, chưa hỏng) thì
//              hỏi máy chủ truKhai. Được: Thủ lĩnh dừng, KÈN LỆNH, màn chiến đấu phủ lên bản đồ (dt/thu_tran_dau.html?tru=1);
//              trang trận nhờ bản đồ gọi truLuot / truTra qua postMessage. Không được (làng bảo hộ, vừa giao chiến...): thôi,
//              thử lại sau ít giây. Trang ẩn (chạy nền) thì không khai chiến.
//            - Kết thúc: thắng -> trụ thành đống gạch (dt3d_cong_trinh.js vẽ), mất sau hongGiay giây (máy chủ xoá); thua ->
//              Thủ lĩnh về Lều nghỉ (máy chủ giữ giờ), nghỉ xong đủ máu; hòa / rút lui -> máu giữ nguyên. Không thưởng.
// HÀM KHAI RA:
//   taoTruBanDo(the) -> { thongTin(ct) -> { phu, nut[] } | null, dangTran(), moc }
//     the = { ctx, lang, cauHinh, mayChu (truCau / truKhai / truLuot / truTra / truRut), dvTl, vung, quaiBd (banThuLinh,
//             conNghi, datNghi, dungTl), be: { ten, hoSo, lop }, baoGoiY, lop (DOM phủ cảnh) }
// LUẬT NỐI: trang phải nạp dt_tru_tran.js, dt_trinh_do.js, dt_sinh_toan.js, dt_sinh_tieng_anh.js, dt_cau_hoi.js.
// BƯỚC: TC_D06C2g
// NGÀY: 05/11/2026
// ================================================================
import { taoAmThanh } from "./dt3d_am_thanh.js";

const TT = window.KC_DT_TRU_TRAN;
const nap = u => fetch(new URL(u, import.meta.url), { cache: "no-cache" }).then(r => (r.ok ? r.json() : null)).catch(() => null);

export function taoTruBanDo(the) {
  const { ctx, lang, cauHinh, mayChu, dvTl, vung, quaiBd, be, baoGoiY } = the;
  const C = cauHinh.tru, ten = be.ten || "khach", tenMinh = String(ten).trim().toLowerCase();
  const laTru = ct => !!ct && TT.laTru(cauHinh, ct.loai);
  const tenTru = ct => (cauHinh.congTrinh[ct.loai] || {}).ten || "Trụ";
  const tamCt = ct => ({ x: ct.x + ct.rong / 2, z: ct.y + ct.sau / 2 });
  let am = null; try { am = taoAmThanh(); } catch (e) { am = null; }

  // ---------- trụ của mình: gắn câu ngẫu nhiên từ kho ----------
  let boChon = null; // Promise<{ bo, hs, mon[] }>
  function nguonCau() {
    if (boChon) return boChon;
    const TD = window.KC_DT_TRINH_DO, ST = window.KC_DT_SINH_TOAN, TA = window.KC_DT_SINH_TA, CHQ = window.KC_DT_CAU_HOI;
    boChon = Promise.all([nap("../du_lieu/cau_hinh_trinh_do.json"), nap("../../tu_vung/kho_tu.json")]).then(([chTd0, kho]) => {
      const chTD = TD.cauHinh(chTd0), NG = { toan: ST };
      if (kho && TA) { try { NG.tieng_anh = TA.tao(kho, chTD); } catch (e) { /* thiếu kho từ: chỉ Toán */ } }
      let hs = null;
      try { const cu = JSON.parse(localStorage.getItem("kc_dt_trinh_do_" + tenMinh) || "null"); if (cu && cu.hs) hs = TD.chuanHoa(cu.hs, chTD); } catch (e) { /* bị chặn */ }
      if (!hs) hs = TD.taoHoSo(Math.max(1, Math.min(12, Math.floor(be.lop) || 2)), chTD);
      return { bo: CHQ.taoBoChon(chTD, NG), hs, mon: Object.keys(NG) };
    });
    return boChon;
  }
  async function taoBoCau(n) {
    const { bo, hs, mon } = await nguonCau();
    const ds = [];
    for (let lan = 0; ds.length < n && lan < n * 25; lan++) {
      const m = mon[Math.floor(Math.random() * mon.length)], x = bo.cauTiep(hs, m), c = x && x.cau;
      // câu có hình (đường dẫn ảnh) không gửi máy chủ: trụ chỉ giữ chữ
      if (!c || c.hinh || typeof c.noiDung !== "string" || !Array.isArray(c.dapAn) || c.dapAn.length < 2 || !(c.dung || []).length) continue;
      if (ds.some(d => d.noiDung === c.noiDung && String(d.dapAn) === String(c.dapAn))) continue;
      ds.push({ noiDung: c.noiDung, dapAn: c.dapAn.map(String), dung: c.dung.slice(), loiGiai: c.loiGiai || "", mon: m, doKho: c.doKho || "", hinhChu: c.hinhChu || "", amThanh: c.amThanh || "" });
    }
    return ds.length === n ? ds : null;
  }
  const dangGan = new Set(), ganLuc = new Map();
  async function ganCau(ct) {
    if (dangGan.has(ct.id) || Date.now() - (ganLuc.get(ct.id) || 0) < 15000) return;
    dangGan.add(ct.id); ganLuc.set(ct.id, Date.now());
    try {
      const ds = await taoBoCau(TT.soTru(cauHinh, ct.loai, ct.cap).soCau);
      if (!ds) return;
      const kq = await mayChu.truCau(ten, ct.id, ds);
      if (kq.ok) { ct.cau = ds; ct.coCau = true; }
    } finally { dangGan.delete(ct.id); }
  }

  // ---------- trụ của bạn: Thủ lĩnh vào tầm -> khai chiến ----------
  const mien = new Map(); // id trụ -> Date.now() được thử lại
  let tran = null, dangKhai = false, baoBaoHo = 0, dem = 0;
  ctx.moiKhung(dt => {
    if ((dem += dt) < 0.5) return;
    dem = 0;
    for (const ct of lang.congTrinh) if (ct.cuaMinh !== false && laTru(ct) && ct.xong && ct.hongLuc == null && !ct.coCau) ganCau(ct);
    if (tran || dangKhai || ctx.chayNen || !dvTl || dvTl.xay) return;
    if (quaiBd && (quaiBd.banThuLinh() || quaiBd.conNghi() > 0)) return;
    const bay = Date.now();
    for (const ct of lang.congTrinh) {
      if (ct.cuaMinh !== false || !laTru(ct) || !ct.xong || ct.hongLuc != null || !ct.coCau) continue; // chỉ trụ của bạn, đã có câu, chưa hỏng
      if ((mien.get(ct.id) || 0) > bay) continue;
      const p = tamCt(ct);
      if (Math.hypot(dvTl.x - p.x, dvTl.z - p.z) > TT.soTru(cauHinh, ct.loai, ct.cap).tam) continue;
      khai(ct);
      break;
    }
  });
  async function khai(ct) {
    dangKhai = true;
    const kq = await mayChu.truKhai(ten, ct.id);
    dangKhai = false;
    if (!kq.ok) {
      mien.set(ct.id, Date.now() + (kq.ma === "bao_ho" ? 30000 : kq.ma === "mien" ? 15000 : 6000));
      if (kq.ma === "bao_ho" && Date.now() - baoBaoHo > 60000) { baoBaoHo = Date.now(); baoGoiY("🛡️ Làng của " + ct.chu + " đang có vòng sáng bảo hộ · " + tenTru(ct) + " không khai chiến."); }
      if (kq.ma === "dang_nghi" && Number.isFinite(kq.nghiDen) && quaiBd) quaiBd.datNghi(kq.nghiDen);
      return;
    }
    if (tran || (quaiBd && quaiBd.banThuLinh())) { mayChu.truRut(ten, kq.tran.id); return; } // vừa bận việc khác
    if (am) am.kenLenh();
    if (quaiBd) quaiBd.dungTl();
    const p = tamCt(ct);
    dvTl.huongMuon = Math.atan2(p.x - dvTl.x, p.z - dvTl.z);
    baoGoiY("🏹 " + tenTru(ct) + " của " + ct.chu + " khai chiến!");
    moTran(ct, kq.tran);
  }
  function moTran(ct, tr) {
    const ts = new URLSearchParams({ nhung: "1", tru: "1", tran: String(tr.id), loaiTru: ct.loai, cap: String(tr.cap || 1),
      tenTru: tenTru(ct) + " của " + ct.chu, mauBe: String(tr.mauBe), mauBeToiDa: String(tr.mauBeToiDa), mauTru: String(tr.mauTru),
      mauTruToiDa: String(tr.mauTruToiDa), giayBe: String(C.giayBe), nghi: String(C.nghiGiay),
      cl: be.hoSo.chungLoai || "nhan", gioi: be.hoSo.gioi || "nam", lop: String(be.lop || 2), ten: be.ten || "", tl: dvTl.ten || "" });
    const khung = document.createElement("div"); khung.className = "d3Tran";
    const fr = document.createElement("iframe");
    fr.title = "Trận đấu"; fr.allow = "autoplay"; fr.src = new URL("../thu_tran_dau.html?" + ts, import.meta.url).href;
    khung.appendChild(fr); document.body.appendChild(khung);
    tran = { ct, tr, khung, fr, ket: undefined, hp: undefined };
    ctx.nghiVe = true; // bản đồ thôi vẽ, lõi làng vẫn chạy
    fr.focus();
  }
  window.addEventListener("message", async e => {
    if (!tran || e.source !== tran.fr.contentWindow || !e.data) return;
    const d = e.data, t = tran;
    if (Number.isFinite(d.hpBe)) t.hp = d.hpBe;
    if (d.loai === "dt-tru-hoi") { // trang trận nhờ gọi máy chủ
      const ts = d.ts || {};
      const kq = d.ham === "luot" ? await mayChu.truLuot(ten, t.tr.id)
        : d.ham === "tra" ? await mayChu.truTra(ten, t.tr.id, { chon: Number.isInteger(ts.chon) ? ts.chon : null, beDung: !!ts.beDung })
          : { ok: false, ma: "lenh" };
      try { t.fr.contentWindow.postMessage({ loai: "dt-tru-dap", so: d.so, kq }, location.origin); } catch (er) { /* khung đã đóng */ }
    } else if (d.loai === "dt-tran-ket") t.ket = d.thang;
    else if (d.loai === "dt-tran-dong") dongTran();
  });
  function dongTran() {
    if (!tran) return;
    const { ct, tr, khung, ket, hp } = tran;
    tran = null; khung.remove(); ctx.nghiVe = false;
    mien.set(ct.id, Date.now() + C.mienGiay * 1000);
    if (Number.isFinite(hp)) dvTl.mau = hp; // máu Thủ lĩnh giữ nguyên (không tự hồi)
    const ten2 = tenTru(ct) + " của " + ct.chu;
    if (ket === "be") { ct.hongLuc = mayChu.gio(); ct.mau = 0; baoGoiY("🏆 Thắng · " + ten2 + " sụp đổ · ❤️ " + dvTl.mau); }
    else if (ket === "quai") {
      dvTl.mau = null; // nghỉ xong đủ máu
      if (quaiBd) quaiBd.datNghi(mayChu.gio() + C.nghiGiay * 1000);
      const l = lang.leu;
      if (l) lang.lenhDi(dvTl, { x: Math.floor(l.x), y: l.ct.y + l.ct.sau }); // trước cửa Lều
      baoGoiY("⛺ " + dvTl.ten + " thua " + ten2 + " · về Lều nghỉ");
    } else if (ket === null) baoGoiY("🤝 Hòa · " + ten2 + " vẫn đứng · ❤️ " + dvTl.mau);
    else { mayChu.truRut(ten, tr.id); baoGoiY("🏃 " + dvTl.ten + " rút lui"); }
    if (vung && vung.hoiLai) vung.hoiLai();
  }
  addEventListener("pagehide", () => { if (tran && tran.ket === undefined) mayChu.truRut(ten, tran.tr.id, true); });

  // ---------- thanh dưới + bảng xem câu ----------
  function moBangCau(ct) {
    const cu = document.getElementById("d3BangCau"); if (cu) cu.remove();
    const p = document.createElement("div"); p.id = "d3BangCau"; p.className = "d3BangCau d3Khung"; p.setAttribute("role", "dialog");
    const dau = document.createElement("div"); dau.className = "d3BangCauDau";
    const td = document.createElement("b"); td.textContent = "📜 " + tenTru(ct) + " · " + (ct.cau || []).length + " câu phòng thủ";
    const dong = document.createElement("button"); dong.type = "button"; dong.className = "d3Nut"; dong.textContent = "✖"; dong.setAttribute("aria-label", "Đóng");
    dong.addEventListener("click", () => p.remove());
    dau.append(td, dong); p.appendChild(dau);
    const ol = document.createElement("ol");
    for (const c of ct.cau || []) {
      const li = document.createElement("li");
      const nd = document.createElement("div"); nd.textContent = (c.hinhChu ? c.hinhChu + " " : "") + c.noiDung; li.appendChild(nd);
      const da = document.createElement("div"); da.className = "d3BangCauDa";
      c.dapAn.forEach((x, i) => { const s = document.createElement("span"); s.textContent = x; if (c.dung.indexOf(i) >= 0) s.className = "dung"; da.appendChild(s); });
      li.appendChild(da); ol.appendChild(li);
    }
    p.appendChild(ol);
    document.body.appendChild(p);
  }
  function thongTin(ct) {
    if (!laTru(ct)) return null;
    const s = TT.soTru(cauHinh, ct.loai, ct.cap), mau = ct.mau == null ? s.mauToiDa : ct.mau;
    if (ct.hongLuc != null) return { dong: "🧱 Đống gạch · biến mất sau " + Math.max(0, Math.ceil((C.hongGiay * 1000 - (mayChu.gio() - ct.hongLuc)) / 1000)) + " giây", nut: [] };
    if (!ct.xong) return null;
    const phu = "❤️ " + mau + "/" + s.mauToiDa + " · 🎯 tầm " + s.tam + " ô · trụ đúng " + Math.round(s.tiLe * 100) + "%";
    if (ct.cuaMinh === false) return { phu: phu + " · của " + ct.chu, nut: [] };
    const nut = [];
    if (ct.cau && ct.cau.length) nut.push({ id: "d3XemCau", lop: "", chu: "📜<span class=\"d3Chu\"> " + ct.cau.length + " câu</span>", nhan: "Xem " + ct.cau.length + " câu phòng thủ", bam: () => moBangCau(ct) });
    return { phu: phu + " · " + (ct.coCau ? "❓ " + s.soCau + " câu" : "⏳ đang chọn câu"), nut };
  }

  return {
    thongTin, dangTran: () => !!tran,
    moc: { // kịch bản thử Chrome
      tran: () => tran && { id: tran.tr.id, truId: tran.ct.id, ket: tran.ket },
      mien: id => Math.max(0, (mien.get(id) || 0) - Date.now()), boMien: () => mien.clear(),
      kenLenh: () => (am && am.thongKe ? (am.thongKe().daKeu || {}).kenLenh || 0 : 0),
      truMinh: () => lang.congTrinh.filter(c => c.cuaMinh !== false && laTru(c)).map(c => ({ id: c.id, x: c.x, y: c.y, xong: c.xong, coCau: !!c.coCau, soCau: (c.cau || []).length, mau: c.mau, hongLuc: c.hongLuc })),
      truBan: () => lang.congTrinh.filter(c => c.cuaMinh === false && laTru(c)).map(c => ({ id: c.id, chu: c.chu, x: c.x, y: c.y, xong: c.xong, coCau: !!c.coCau, mau: c.mau, hongLuc: c.hongLuc })),
      moBangCau: id => { const ct = lang.congTrinh.find(c => c.id === id); if (ct) moBangCau(ct); return !!ct; }
    }
  };
}
// 05/11/2026 - BƯỚC: TC_D06C2g (trụ phòng thủ trên bản đồ)
