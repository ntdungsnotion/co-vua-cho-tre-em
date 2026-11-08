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
//            - TC_D06C2h (người dùng 06/11/2026) TRỤ TỰ BẮN NÔNG DÂN của bé khác: máy có nông dân trong tầm trụ của bạn hỏi
//              máy chủ truBan (máy chủ quyết trúng theo tỉ lệ trụ, một phát mỗi nhipBanGiay giây); phát đầu: kèn lệnh, nông dân
//              tự chạy ra ngoài tầm, nhãn "🏹 ❤️ máu" trên đầu, nút ⚔️ góc trên phải (dt3d_quai_ban_do.js themTranNgoai) có hàng
//              trận với 2 nút: ⚔️ Đánh (trận câu hỏi với trụ như Thủ lĩnh, truKhai có dv; thua = mất dân) / 👀 Xem (camera tới
//              nông dân + chọn để bé dẫn đi trốn). Hết máu: bỏ chạy, mất hẳn. Máy CHỦ TRỤ vẽ lại phát bắn máy chủ ghi (ct.ban):
//              nỏ quay về phía người bị bắn, mũi tên bay (trúng / cắm đất), tiếng khi cảnh trong khung hình.
//            - TC_D06C7b (người dùng 07/11 + 08/11/2026) MỌI CÔNG TRÌNH BỊ BÉ KHÁC ĐÁNH SẬP: chạm công trình thường của bạn (trừ Lều)
//              -> thanh dưới ❤️ máu · ❓ số câu + nút ⚔️ Tấn công: Thủ lĩnh tự đi tới sát (tru.chamO ô) rồi hỏi máy chủ danhKhai
//              -> kèn lệnh, trận y luật trụ (số theo congTrinh.<loai>.danh; công trình không tự khai chiến). Câu do máy chủ chọn trong
//              KHO CÂU của chủ (máy bé gửi kho câu theo trình độ của bé lúc vào vùng, cauKho). Thắng: đống gạch; rào / cổng sụp thì
//              vòng rào thủng, lãnh địa tính lại ngay (vung.hongCt).
// HÀM KHAI RA:
//   taoTruBanDo(the) -> { thongTin(ct) -> { phu, nut[] } | null, dangTran(), moc }
//     the = { ctx, lang, cauHinh, mayChu (truCau / truKhai / truLuot / truTra / truRut / truBan), dvTl, vung, quaiBd (banThuLinh,
//             conNghi, datNghi, dungTl, themTranNgoai, datBanNgoai, danBoChay, veNut, dangTran), be: { ten, hoSo, lop }, baoGoiY,
//             lop (DOM phủ cảnh), cam, diaHinh, hinhCt(id) (dt3d_cong_trinh.js), nhinVe(x, z), chonDv(dv) (TC_D06C2h) }
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

  // ---------- TC_D06C7b: KHO CÂU của bé (công trình thường của bé bị bạn đánh thì máy chủ lấy câu trong kho này) ----------
  // Máy chủ trả soCauKho lúc vào vùng (máy chủ cũ không trả: bỏ qua); thiếu thì chọn tru.soCauKho câu theo trình độ của bé gửi lên một lần
  const soKho = vung && vung.vao ? vung.vao.soCauKho : undefined;
  if (Number.isFinite(soKho) && soKho < (C.soCauKho || 30) && mayChu.cauKho) {
    setTimeout(async () => {
      try { const ds = await taoBoCau(C.soCauKho || 30); if (ds) await mayChu.cauKho(ten, ds); } catch (e) { /* lần vào sau gửi lại */ }
    }, 3000);
  }

  // ---------- TC_D06C7b: Thủ lĩnh đánh công trình THƯỜNG của bạn (chạm công trình -> ⚔️ Tấn công) ----------
  const laDanh = ct => !!ct && TT.laDanh(cauHinh, ct.loai);
  const laRao = ct => ct.loai === "tuong" || ct.loai === "cong";
  let danhCho = null; // { ct, het }: Thủ lĩnh đang đi tới sát công trình để đánh
  const satCt = ct => TT.kcMep(ct, dvTl.x, dvTl.z) <= C.chamO;
  // Ô đi được sát móng gần Thủ lĩnh nhất (lang.lenhDi tìm được đường)
  function toiSat(ct) {
    const o = [];
    for (let y = ct.y - 1; y <= ct.y + ct.sau; y++) for (let x = ct.x - 1; x <= ct.x + ct.rong; x++) {
      if (y >= ct.y && y < ct.y + ct.sau && x >= ct.x && x < ct.x + ct.rong) continue;
      o.push({ x, y, d: Math.hypot(x + 0.5 - dvTl.x, y + 0.5 - dvTl.z) });
    }
    o.sort((a, b) => a.d - b.d);
    for (const p of o) if (lang.lenhDi(dvTl, { x: p.x, y: p.y })) return true;
    return false;
  }
  function batDauDanh(ct) {
    if (!dvTl || tran || dangKhai) return;
    if (quaiBd && quaiBd.conNghi() > 0) { baoGoiY("⛺ " + dvTl.ten + " đang nghỉ ở Lều, chưa đánh được."); return; }
    if (quaiBd && quaiBd.banThuLinh()) { baoGoiY("⚔️ " + dvTl.ten + " đang giao chiến."); return; }
    if (!laDanh(ct) || !ct.xong || ct.hongLuc != null || !lang.congTrinh.includes(ct)) return;
    if (satCt(ct)) { danhCho = null; khaiCt(ct); return; }
    if (!toiSat(ct)) { baoGoiY("🚧 " + dvTl.ten + " không tới sát " + tenTru(ct) + " được."); return; }
    danhCho = { ct, het: Date.now() + 40000 };
    baoGoiY("👑 " + dvTl.ten + " đang tới " + tenTru(ct) + " của " + ct.chu + "…");
  }
  function theoDanh() {
    if (!danhCho) return;
    const { ct } = danhCho;
    if (tran || Date.now() > danhCho.het || ct.hongLuc != null || !lang.congTrinh.includes(ct)) { danhCho = null; return; }
    if (satCt(ct)) { danhCho = null; khaiCt(ct); }
    else if (!dvTl.duong || !dvTl.duong.length) { if (!dvTl.dich) danhCho = null; } // bé cho Thủ lĩnh đi chỗ khác / đứng lại: thôi
  }
  async function khaiCt(ct) {
    dangKhai = true;
    let kq;
    try {
      const duPhong = await taoBoCau(TT.soDanh(cauHinh, ct.loai, ct.cap).soCau); // chủ chưa có kho câu: máy chủ dùng câu này
      kq = await mayChu.danhKhai(ten, ct.id, duPhong || undefined);
    } catch (e) { kq = { ok: false, lyDo: "Chưa vào trận được." }; }
    dangKhai = false;
    if (!kq.ok) {
      if (kq.ma === "dang_nghi" && Number.isFinite(kq.nghiDen) && quaiBd) quaiBd.datNghi(kq.nghiDen);
      baoGoiY((kq.ma === "bao_ho" ? "🛡️ Làng của " + ct.chu + " đang có vòng sáng bảo hộ (bạn ấy vắng mặt) · chưa đánh được " + tenTru(ct) + "."
        : kq.ma === "mien" ? "⏳ Vừa đánh " + tenTru(ct) + " xong, chờ một lát nhé." : "❌ " + (kq.lyDo || "Chưa vào trận được.")));
      return;
    }
    if (tran || (quaiBd && quaiBd.banThuLinh())) { mayChu.truRut(ten, kq.tran.id); return; }
    if (am) am.kenLenh();
    if (quaiBd) quaiBd.dungTl();
    const p = tamCt(ct);
    dvTl.huongMuon = Math.atan2(p.x - dvTl.x, p.z - dvTl.z);
    baoGoiY("⚔️ " + dvTl.ten + " tấn công " + tenTru(ct) + " của " + ct.chu + "!");
    moTran(ct, kq.tran);
  }

  // ---------- trụ của bạn: Thủ lĩnh vào tầm -> khai chiến ----------
  const mien = new Map(); // id trụ -> Date.now() được thử lại
  let tran = null, dangKhai = false, baoBaoHo = 0, dem = 0;
  ctx.moiKhung(dt => {
    if ((dem += dt) < 0.5) return;
    dem = 0;
    for (const ct of lang.congTrinh) if (ct.cuaMinh !== false && laTru(ct) && ct.xong && ct.hongLuc == null && !ct.coCau) ganCau(ct);
    banNongDan(); veBanChu(); // TC_D06C2h
    theoDanh(); // TC_D06C7b
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
  function moTran(ct, tr, dv) { // TC_D06C2h: dv = nông dân vào trận (không có = Thủ lĩnh)
    // TC_D06C7b: công trình thường trên sân đấu: ct_rao (hàng rào, cổng) / ct_nha (nhà, kho, chòi...) (dt3d_quai.js)
    const loaiSan = laTru(ct) ? ct.loai : laRao(ct) ? "ct_rao" : "ct_nha";
    const ts = new URLSearchParams({ nhung: "1", tru: "1", tran: String(tr.id), loaiTru: loaiSan, cap: String(tr.cap || 1),
      tenTru: tenTru(ct) + " của " + ct.chu, mauBe: String(tr.mauBe), mauBeToiDa: String(tr.mauBeToiDa), mauTru: String(tr.mauTru),
      mauTruToiDa: String(tr.mauTruToiDa), giayBe: String(C.giayBe), nghi: String(C.nghiGiay),
      cl: be.hoSo.chungLoai || "nhan", gioi: be.hoSo.gioi || "nam", lop: String(be.lop || 2), ten: be.ten || "", tl: (dv ? dv.ten : dvTl.ten) || "" });
    if (dv) { ts.set("vai", "nong_dan"); ts.set("nd", String(dv.id)); } // nông dân (trang trận: thua = bỏ chạy, không nghỉ)
    if (!laTru(ct)) { // TC_D06C7b: đối thủ trên sân là Thủ lĩnh của chủ (tộc theo Thủ lĩnh bạn ấy máy này đang thấy; chưa thấy: Nhân tộc)
      const b = vung && vung.tlBan ? vung.tlBan(ct.chu) : null;
      ts.set("doiCl", (b && ((b.d && b.d.chungLoai) || b.dv.chungLoai)) || "nhan");
    }
    const khung = document.createElement("div"); khung.className = "d3Tran";
    const fr = document.createElement("iframe");
    fr.title = "Trận đấu"; fr.allow = "autoplay"; fr.src = new URL("../thu_tran_dau.html?" + ts, import.meta.url).href;
    khung.appendChild(fr); document.body.appendChild(khung);
    tran = { ct, tr, khung, fr, ket: undefined, hp: undefined, dv: dv || null };
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
    if (tran.dv) return dongTranDan(); // TC_D06C2h
    const { ct, tr, khung, ket, hp } = tran;
    tran = null; khung.remove(); ctx.nghiVe = false;
    mien.set(ct.id, Date.now() + C.mienGiay * 1000);
    if (Number.isFinite(hp)) dvTl.mau = hp; // máu Thủ lĩnh giữ nguyên (không tự hồi)
    const ten2 = tenTru(ct) + " của " + ct.chu;
    if (ket === "be") {
      ct.hongLuc = mayChu.gio(); ct.mau = 0;
      if (vung && vung.hongCt) vung.hongCt(ct); // TC_D06C7b: rào sụp -> lãnh địa tính lại ngay
      baoGoiY("🏆 Thắng · " + ten2 + " sụp đổ" + (laRao(ct) ? " · vòng rào đã thủng" : "") + " · ❤️ " + dvTl.mau);
    }
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

  // ================= TC_D06C2h: TRỤ TỰ BẮN NÔNG DÂN (người dùng 06/11/2026) =================
  // Máy CÓ NÔNG DÂN hỏi máy chủ (truBan) khi nông dân của mình đứng trong tầm trụ của bạn: máy chủ quyết trúng / trượt, mỗi trụ
  // một phát mỗi nhipBanGiay giây. Phát đầu: kèn lệnh, nông dân tự chạy ra ngoài tầm, nút ⚔️ góc trên phải có hàng trận
  // (⚔️ Đánh = trận câu hỏi với trụ như Thủ lĩnh; 👀 Xem = tới chỗ nông dân để bé tự dẫn đi trốn). Hết máu: bỏ chạy, mất dân.
  // Máy CHỦ TRỤ: vẽ lại các phát bắn máy chủ ghi (ct.ban, mỗi lần hỏi lại) vào người của bạn đang thấy: nỏ quay + mũi tên bay.
  const { cam, diaHinh, hinhCt, nhinVe, chonDv } = the;
  const lopNhan = the.lop || document.body;
  const canvas = ctx.renderer.domElement, THREE = ctx.THREE;
  const tam = ct => TT.soTru(cauHinh, ct.loai, ct.cap).tam;
  const xa = (ct, d) => { const p = tamCt(ct); return Math.hypot(d.x - p.x, d.z - p.z); };
  const truBanDuoc = ct => ct.cuaMinh === false && laTru(ct) && ct.xong && ct.hongLuc == null;
  const dsDanMinh = () => lang.donVi.filter(d => d.vaiTro === "nong_dan" && !d.laBan && d.idMayChu != null);
  const clBe = () => (be.hoSo && be.hoSo.chungLoai) || lang.chungLoai || "nhan";
  const toiDaDan = () => TT.hpNongDan(cauHinh, clBe());
  const mauDan = dv => (dv.mau == null ? toiDaDan() : Math.max(0, Math.min(toiDaDan(), dv.mau)));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const biBan = new Map(); // dv.id -> { dv, ct, nhan, ngoaiLuc }
  const choTru = new Map(); // ct.id -> Date.now() được hỏi lại
  const dangHoi = new Set(); // dv.id đang chờ máy chủ trả lời
  let kenLuc = 0, soDanMat = 0, soPhat = 0, soPhatChu = 0, soMuiTen = 0;
  const keu = () => { if (am && Date.now() - kenLuc > 4000) { kenLuc = Date.now(); am.kenLenh(); } };

  function banNongDan() {
    if (ctx.chayNen) return; // trang ẩn: bé không ở đó, trụ không bắn (như quái hung)
    const bay = Date.now(), truDs = lang.congTrinh.filter(truBanDuoc);
    if (truDs.length) for (const dv of dsDanMinh()) {
      if (dangHoi.has(dv.id) || (tran && tran.dv === dv) || dv.trangThai === "danh" || dv.chay) continue; // đang đánh quái / đang vào trận
      let tot = null;
      for (const ct of truDs) {
        if ((choTru.get(ct.id) || 0) > bay) continue;
        const d = xa(ct, dv);
        if (d <= tam(ct) && (!tot || d < tot.d)) tot = { ct, d };
      }
      if (tot) hoiBan(tot.ct, dv);
    }
    for (const f of [...biBan.values()]) { // ra khỏi tầm mọi trụ quá 4 giây: hết bị bắn
      if (!lang.donVi.includes(f.dv)) { dongBiBan(f); continue; }
      if (tran && tran.dv === f.dv) continue;
      if (lang.congTrinh.some(ct => truBanDuoc(ct) && xa(ct, f.dv) <= tam(ct) + 0.5)) { f.ngoaiLuc = 0; continue; }
      if (!f.ngoaiLuc) f.ngoaiLuc = bay;
      else if (bay - f.ngoaiLuc > 4000) { dongBiBan(f); baoGoiY("🏃 " + f.dv.ten + " đã chạy khỏi tầm " + tenTru(f.ct)); }
    }
  }
  async function hoiBan(ct, dv) {
    dangHoi.add(dv.id);
    choTru.set(ct.id, Date.now() + C.nhipBanGiay * 1000);
    let kq;
    try { kq = await mayChu.truBan(ten, ct.id, dv.idMayChu); } catch (e) { kq = { ok: false, ma: "mang" }; }
    dangHoi.delete(dv.id);
    if (!kq.ok) {
      const cho = kq.ma === "cho" ? Math.max(200, kq.con || 500) : kq.ma === "bao_ho" ? 30000 : kq.ma === "xa_qua" ? 1500 : kq.ma === "khong_tru" ? 15000 : 4000;
      choTru.set(ct.id, Date.now() + cho);
      if (kq.ma === "bao_ho" && Date.now() - baoBaoHo > 60000) { baoBaoHo = Date.now(); baoGoiY("🛡️ Làng của " + ct.chu + " đang có vòng sáng bảo hộ · " + tenTru(ct) + " không bắn."); }
      return;
    }
    soPhat++;
    if (!lang.donVi.includes(dv)) return;
    let f = biBan.get(dv.id);
    const moi = !f;
    if (moi) f = moBiBan(dv, ct);
    f.ct = ct; f.ngoaiLuc = 0;
    banTen(ct, dv, kq.trung);
    if (kq.mat) {
      dongBiBan(f); dv.mau = 0; soDanMat++;
      const p = tamCt(ct);
      if (quaiBd && quaiBd.danBoChay) quaiBd.danBoChay(dv, p); else lang.boDonVi(dv);
      baoGoiY("💨 " + dv.ten + " hết máu, bỏ chạy khỏi thung lũng · mất 1 dân");
      return;
    }
    if (kq.trung) dv.mau = kq.mau;
    if (moi) {
      keu();
      baoGoiY("🏹 " + tenTru(ct) + " của " + ct.chu + " bắn " + dv.ten + "! " + dv.ten + " chạy đi · bấm ⚔️ để đánh trả");
      chayTron(f);
    }
  }
  // nông dân tự chạy ra ngoài tầm trụ (hướng ngược phía trụ; chỗ không tới được thì xoay dần hướng khác)
  function chayTron(f) {
    const dv = f.dv, ct = f.ct, p = tamCt(ct), g = Math.atan2(dv.x - p.x, dv.z - p.z), R = tam(ct) + C.chayThemO;
    for (const lech of [0, 0.4, -0.4, 0.8, -0.8, 1.3, -1.3, 1.9, -1.9, Math.PI]) for (const r of [R, R + 1.5]) {
      const x = Math.floor(p.x + Math.sin(g + lech) * r), y = Math.floor(p.z + Math.cos(g + lech) * r);
      if (lang.lenhDi(dv, { x, y })) return true;
    }
    return false;
  }
  function moBiBan(dv, ct) {
    const nhan = document.createElement("div"); nhan.className = "d3MauDan"; nhan.hidden = true; lopNhan.appendChild(nhan);
    const f = { dv, ct, nhan, ngoaiLuc: 0 };
    biBan.set(dv.id, f);
    if (quaiBd && quaiBd.veNut) quaiBd.veNut();
    return f;
  }
  function dongBiBan(f) { f.nhan.remove(); biBan.delete(f.dv.id); if (quaiBd && quaiBd.veNut) quaiBd.veNut(); }
  // hàng trận ở nút ⚔️ (dt3d_quai_ban_do.js themTranNgoai)
  const hangTran = () => [...biBan.values()].filter(f => !(tran && tran.dv === f.dv)).map(f => {
    const s = TT.soTru(cauHinh, f.ct.loai, f.ct.cap), mt = f.ct.mau == null ? s.mauToiDa : Math.min(f.ct.mau, s.mauToiDa), md = mauDan(f.dv), td = toiDaDan();
    return { khoa: "tru:" + f.dv.id + ":" + f.ct.id + ":" + md + ":" + mt, nhan: f.dv.ten,
      html: '<span class="d3BtQuai"><b>🏹 ' + esc(tenTru(f.ct)) + " của " + esc(f.ct.chu) + "</b><i>❤️ " + mt + "/" + s.mauToiDa + "</i></span>"
        + '<span class="d3BtVs">đang bắn</span>'
        + '<span class="d3BtDan"><b>🧑‍🌾 ' + esc(f.dv.ten) + "</b><i" + (md / Math.max(1, td) < 0.3 ? ' class="d3Thap"' : "") + ">❤️ " + md + "/" + td + "</i></span>",
      vao: () => vaoTranDan(f), xem: () => xemDan(f) };
  });
  if (quaiBd && quaiBd.themTranNgoai) { quaiBd.themTranNgoai(hangTran); quaiBd.datBanNgoai(() => !!tran); }
  function xemDan(f) {
    if (!lang.donVi.includes(f.dv)) return;
    if (nhinVe) nhinVe(f.dv.x, f.dv.z);
    if (chonDv) chonDv(f.dv);
    baoGoiY("👀 " + f.dv.ten + " · chạm chỗ xa trụ để dẫn " + f.dv.ten + " đi trốn");
  }
  async function vaoTranDan(f) {
    if (tran || dangKhai || (quaiBd && quaiBd.dangTran && quaiBd.dangTran())) return;
    const { dv, ct } = f;
    if (!lang.donVi.includes(dv) || !truBanDuoc(ct)) return;
    if (!ct.coCau) { baoGoiY("⏳ " + tenTru(ct) + " chưa có câu hỏi, chưa vào trận được."); return; }
    dangKhai = true;
    const kq = await mayChu.truKhai(ten, ct.id, dv.idMayChu);
    dangKhai = false;
    if (!kq.ok) { baoGoiY("❌ " + (kq.lyDo || "Chưa vào trận được.")); return; }
    if (tran || !lang.donVi.includes(dv)) { mayChu.truRut(ten, kq.tran.id); return; }
    const p = tamCt(ct);
    if (lang.dungDanh) lang.dungDanh(dv, p.x, p.z); // dân đứng lại quay về phía trụ trong lúc bé đánh
    if (am) am.kenLenh();
    moTran(ct, kq.tran, dv);
  }
  function dongTranDan() {
    const { ct, tr, khung, ket, hp, dv } = tran;
    tran = null; khung.remove(); ctx.nghiVe = false;
    const f = biBan.get(dv.id), ten2 = tenTru(ct) + " của " + ct.chu, con = lang.donVi.includes(dv);
    if (Number.isFinite(hp) && con) dv.mau = hp; // máu giữ nguyên (không tự hồi)
    if (ket === "quai") { // nông dân thua: bỏ chạy, mất hẳn (máy chủ đã xoá)
      if (f) dongBiBan(f);
      soDanMat++;
      if (con) { if (quaiBd && quaiBd.danBoChay) quaiBd.danBoChay(dv, tamCt(ct)); else lang.boDonVi(dv); }
      baoGoiY("💨 " + dv.ten + " thua " + ten2 + ", bỏ chạy khỏi thung lũng · mất 1 dân");
    } else {
      if (con && lang.thoiDanh) lang.thoiDanh(dv);
      if (ket === "be") { ct.hongLuc = mayChu.gio(); ct.mau = 0; if (f) dongBiBan(f); baoGoiY("🏆 " + dv.ten + " thắng · " + ten2 + " sụp đổ · ❤️ " + mauDan(dv)); }
      else {
        if (ket !== null) mayChu.truRut(ten, tr.id);
        baoGoiY((ket === null ? "🤝 Hòa · " + ten2 + " vẫn đứng" : "🏃 " + dv.ten + " rút lui") + " · ❤️ " + mauDan(dv) + " · " + dv.ten + " chạy khỏi tầm trụ");
        if (con && f) chayTron(f);
      }
    }
    if (vung && vung.hoiLai) vung.hoiLai();
  }

  // ---------- vẽ: nỏ quay + mũi tên bay (cả hai máy) ----------
  const vlTen = new THREE.MeshLambertMaterial({ color: "#6b4a2b" }), vlMui = new THREE.MeshLambertMaterial({ color: "#d9d9d9" });
  const hinhThan = new THREE.CylinderGeometry(0.025, 0.025, 0.75, 5).rotateX(Math.PI / 2);
  const hinhMui = new THREE.ConeGeometry(0.06, 0.16, 6).rotateX(Math.PI / 2).translate(0, 0, 0.45);
  const muiTen = [];
  const vt = new THREE.Vector3();
  const raManHinh = (x, y, z) => { vt.set(x, y, z).project(cam.camera); return [(vt.x + 1) / 2 * canvas.clientWidth, (1 - vt.y) / 2 * canvas.clientHeight, vt.z < 1]; };
  const trongKhung = (x, z) => { if (!cam || !diaHinh) return false; const [sx, sy, truoc] = raManHinh(x, diaHinh.doCaoDi(x, z) + 0.6, z); return truoc && sx >= 0 && sy >= 0 && sx <= canvas.clientWidth && sy <= canvas.clientHeight; };
  function banTen(ct, dv, trung) {
    const p = tamCt(ct), h = hinhCt ? hinhCt(ct.id) : null, g = Math.atan2(dv.x - p.x, dv.z - p.z);
    const no = h && h.nha && h.nha.userData.no;
    if (no) no.rotation.y = g - (h.nhom.rotation.y || 0) - (h.nha.rotation.y || 0); // nỏ quay về phía người bị bắn
    if (!diaHinh) return;
    const y0 = (h ? h.nhom.position.y : diaHinh.doCaoDi(p.x, p.z)) + ((h && h.nha && h.nha.userData.caoNo) || 2.5);
    const m = new THREE.Group(); m.add(new THREE.Mesh(hinhThan, vlTen), new THREE.Mesh(hinhMui, vlMui));
    const tu = new THREE.Vector3(p.x, y0, p.z);
    let dx = dv.x, dz = dv.z;
    if (!trung) { const l = (Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 0.6); dx += Math.cos(g) * l; dz -= Math.sin(g) * l; } // trượt: cắm cạnh
    const den = new THREE.Vector3(dx, diaHinh.doCaoDi(dx, dz) + (trung ? 0.9 : 0.05), dz);
    m.position.copy(tu); ctx.canh.add(m); soMuiTen++;
    muiTen.push({ m, tu, den, t: 0, T: 0.18 + tu.distanceTo(den) / 16, trung, dv, nghe: trongKhung(p.x, p.z) || trongKhung(dv.x, dv.z), cam: 0 });
    if (am && muiTen[muiTen.length - 1].nghe) am.hut(0);
  }
  const v2 = new THREE.Vector3();
  ctx.moiKhung(dt => {
    for (let i = muiTen.length - 1; i >= 0; i--) {
      const a = muiTen[i];
      if (a.t < a.T) {
        a.t = Math.min(a.T, a.t + dt);
        const k = a.t / a.T;
        v2.lerpVectors(a.tu, a.den, k); v2.y += Math.sin(Math.PI * k) * 0.6;
        a.m.lookAt(v2); a.m.position.copy(v2);
        if (a.t >= a.T && a.nghe && am) { if (a.trung) am.trung(0, false); else am.hut(0); }
      } else if ((a.cam += dt) > (a.trung ? 0.15 : 1.2)) { ctx.canh.remove(a.m); muiTen.splice(i, 1); } // trúng: mất ngay; trượt: cắm đất một lúc
    }
    // nhãn máu trên đầu nông dân đang bị trụ bắn
    for (const f of biBan.values()) {
      const hien = cam && diaHinh && !(tran && tran.dv === f.dv) && lang.donVi.includes(f.dv);
      if (!hien) { if (!f.nhan.hidden) f.nhan.hidden = true; continue; }
      const m = mauDan(f.dv), td = toiDaDan(), chu = "🏹 ❤️ " + m + "/" + td;
      if (f.nhan.textContent !== chu) f.nhan.textContent = chu;
      const thap = m / Math.max(1, td) < 0.3 ? "1" : ""; if ((f.nhan.dataset.thap || "") !== thap) f.nhan.dataset.thap = thap;
      const [sx, sy, truoc] = raManHinh(f.dv.x, diaHinh.doCaoDi(f.dv.x, f.dv.z) + 2.0, f.dv.z);
      f.nhan.hidden = !truoc; f.nhan.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -100%)`;
    }
  });
  // máy chủ trụ: phát bắn máy chủ ghi ở trụ của mình (người của bạn đang thấy) -> vẽ lại theo đúng nhịp
  const daVe = new Map(); // "id:luc:dv" -> luc
  function veBanChu() {
    const bay = mayChu.gio();
    for (const ct of lang.congTrinh) {
      if (ct.cuaMinh === false || !laTru(ct) || !Array.isArray(ct.ban)) continue;
      const moi = ct.ban.filter(b => b && Number.isFinite(b.luc) && !daVe.has(ct.id + ":" + b.luc + ":" + b.dv));
      if (!moi.length) continue;
      const goc = moi[0].luc;
      for (const b of moi) {
        daVe.set(ct.id + ":" + b.luc + ":" + b.dv, b.luc);
        if (bay - b.luc > (cauHinh.banDo.chuKyGui + 6) * 1000) continue; // phát quá cũ (vừa vào game): bỏ
        setTimeout(() => {
          const ai = vung && vung.dvBan ? vung.dvBan(b.dv) : null;
          if (!ai || !ai.h || !ai.h.vo.visible || !lang.congTrinh.includes(ct) || ct.hongLuc != null) return;
          banTen(ct, ai.dv, !!b.trung); soPhatChu++;
        }, Math.min(10000, Math.max(0, b.luc - goc)));
      }
    }
    if (daVe.size > 400) for (const [k, l] of daVe) if (bay - l > 120000) daVe.delete(k);
  }

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
  // TC_D06C7b: công trình thường: đống gạch; của bạn: máu + ⚔️ Tấn công (Thủ lĩnh tự đi tới sát rồi vào trận); của mình: máu nếu đã bị đánh
  function thongTinDanh(ct) {
    const s = TT.soDanh(cauHinh, ct.loai, ct.cap), mau = ct.mau == null ? s.mauToiDa : Math.min(ct.mau, s.mauToiDa);
    if (ct.hongLuc != null) return { dong: "🧱 Đống gạch · biến mất sau " + Math.max(0, Math.ceil((C.hongGiay * 1000 - (mayChu.gio() - ct.hongLuc)) / 1000)) + " giây", nut: [] };
    if (!ct.xong) return null;
    if (ct.cuaMinh !== false) return ct.mau != null ? { phu: "❤️ " + mau + "/" + s.mauToiDa + " · bị bạn đánh", nut: [] } : null;
    const nut = [];
    if (dvTl && !dvTl.laBan) nut.push({ id: "d3DanhCt", lop: "d3NutDanh", chu: "⚔️<span class=\"d3Chu\"> Tấn công</span>", nhan: "Tấn công " + tenTru(ct) + " của " + ct.chu, bam: () => batDauDanh(ct) });
    return { phu: "❤️ " + mau + "/" + s.mauToiDa + " · ❓ " + s.soCau + " câu · của " + ct.chu, nut };
  }
  function thongTin(ct) {
    if (laDanh(ct)) return thongTinDanh(ct);
    if (!laTru(ct)) return null;
    const s = TT.soTru(cauHinh, ct.loai, ct.cap), mau = ct.mau == null ? s.mauToiDa : Math.min(ct.mau, s.mauToiDa); // TC_D06C7b: máu tối đa đổi (số câu x máu mỗi câu)
    if (ct.hongLuc != null) return { dong: "🧱 Đống gạch · biến mất sau " + Math.max(0, Math.ceil((C.hongGiay * 1000 - (mayChu.gio() - ct.hongLuc)) / 1000)) + " giây", nut: [] };
    if (!ct.xong) return null;
    const phu = "❤️ " + mau + "/" + s.mauToiDa + " · 🎯 tầm " + s.tam + " ô · trụ đúng " + Math.round(s.tiLe * 100) + "%";
    if (ct.cuaMinh === false) return { phu: phu + " · của " + ct.chu, nut: [] };
    const nut = [];
    if (ct.cau && ct.cau.length) nut.push({ id: "d3XemCau", lop: "", chu: "📜<span class=\"d3Chu\"> " + ct.cau.length + " câu</span>", nhan: "Xem " + ct.cau.length + " câu phòng thủ", bam: () => moBangCau(ct) });
    return { phu: phu + " · " + (ct.coCau ? "❓ " + s.soCau + " câu" : "⏳ đang chọn câu"), nut };
  }

  return {
    thongTin, dangTran: () => !!tran, biBan: dv => biBan.has(dv.id), // TC_D06C5: nông dân đang bị trụ bắn
    moc: { // kịch bản thử Chrome
      tran: () => tran && { id: tran.tr.id, truId: tran.ct.id, ket: tran.ket },
      mien: id => Math.max(0, (mien.get(id) || 0) - Date.now()), boMien: () => mien.clear(),
      kenLenh: () => (am && am.thongKe ? (am.thongKe().daKeu || {}).kenLenh || 0 : 0),
      truMinh: () => lang.congTrinh.filter(c => c.cuaMinh !== false && laTru(c)).map(c => ({ id: c.id, x: c.x, y: c.y, xong: c.xong, coCau: !!c.coCau, soCau: (c.cau || []).length, mau: c.mau, hongLuc: c.hongLuc })),
      truBan: () => lang.congTrinh.filter(c => c.cuaMinh === false && laTru(c)).map(c => ({ id: c.id, chu: c.chu, x: c.x, y: c.y, xong: c.xong, coCau: !!c.coCau, mau: c.mau, hongLuc: c.hongLuc })),
      moBangCau: id => { const ct = lang.congTrinh.find(c => c.id === id); if (ct) moBangCau(ct); return !!ct; },
      // TC_D06C2h: trụ bắn nông dân
      biBan: () => [...biBan.values()].map(f => ({ dv: f.dv.idMayChu, ten: f.dv.ten, tru: f.ct.id, mau: mauDan(f.dv), nhan: f.nhan.hidden ? null : f.nhan.textContent })),
      soPhat: () => soPhat, soPhatChu: () => soPhatChu, soDanMat: () => soDanMat, muiTen: () => muiTen.length, soMuiTen: () => soMuiTen,
      goc: id => { const h = hinhCt && hinhCt(id), no = h && h.nha && h.nha.userData.no; return no ? no.rotation.y : null; },
      vaoDan: idDv => { const f = [...biBan.values()].find(k => k.dv.idMayChu === idDv); if (f) vaoTranDan(f); return !!f; },
      xemDan: idDv => { const f = [...biBan.values()].find(k => k.dv.idMayChu === idDv); if (f) xemDan(f); return !!f; },
      tranDv: () => (tran && tran.dv ? tran.dv.idMayChu : null),
      // TC_D06C7b: đánh công trình thường của bạn (như bé bấm ⚔️ Tấn công), Thủ lĩnh đang đi tới công trình nào
      danh: id => { const ct = lang.congTrinh.find(c => c.id === id); if (ct) batDauDanh(ct); return !!ct; },
      danhCho: () => (danhCho ? danhCho.ct.id : null),
      ctBan: () => lang.congTrinh.filter(c => c.cuaMinh === false && laDanh(c)).map(c => ({ id: c.id, chu: c.chu, loai: c.loai, x: c.x, y: c.y, xong: c.xong, mau: c.mau, hongLuc: c.hongLuc })),
      thongTin: id => { const ct = lang.congTrinh.find(c => c.id === id); const t = ct && thongTin(ct); return t ? { dong: t.dong, phu: t.phu, nut: (t.nut || []).map(n => n.id) } : null; }
    }
  };
}
// 05/11/2026 - BƯỚC: TC_D06C2g (trụ phòng thủ trên bản đồ)
// 06/11/2026 - BƯỚC: TC_D06C2h (trụ tự bắn nông dân, nông dân vào trận với trụ, máy chủ trụ thấy nỏ quay + mũi tên)
// 06/11/2026 - BƯỚC: TC_D06C5 (biBan: nông dân đang bị trụ bắn)
// 08/11/2026 - BƯỚC: TC_D06C7b (kho câu của bé; ⚔️ Tấn công công trình thường của bạn: Thủ lĩnh tới sát -> trận y luật trụ; rào sụp -> lãnh địa tính lại)
