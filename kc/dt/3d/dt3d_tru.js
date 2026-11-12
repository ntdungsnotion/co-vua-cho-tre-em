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
//            - TC_D06C7d (người dùng 08/11/2026) MUA CÂU BẰNG VÀNG: chạm công trình của mình (đã xong, chưa sụp; trụ: đã có câu) -> thanh dưới
//              ❤️ máu · ❓ số câu + nút 🛡️ +1 câu (giá muaCau, rào / cổng rẻ hơn; mayChu.muaCau) và 🔧 Sửa khi mất máu (mua lại máu đã mất;
//              mayChu.suaCt). Máy chủ trừ vàng, trả kho (vung.nhanKho). Số câu riêng ct.soCau (TT.soCt).
//            - TC_D06C7e (người dùng 08/11/2026): 🛡️ +1 câu mở BẢNG CHỌN CÂU (muaCau.soGoiY câu kho chung theo trình độ của bé, nút 🔄 Câu
//              khác), bé chạm một câu rồi mới trả vàng (mayChu.muaCau(..., [câu])). 🔧 Sửa tốn tài nguyên theo loại (TT.giaSua, không vàng),
//              máy chủ ghi ct.sua -> nông dân rảnh gần nhất tự tới sửa (vung.guiSua); đang sửa: dòng "🔧 Đang sửa x %".
//            - TC_D06E (người dùng 05/11 + 09/11/2026): chạm công trình của mình (mọi loại có câu; trụ: đã có câu) -> nút 📝 Cập nhật câu hỏi
//              -> bảng #d3CapNhat: các câu của công trình (chỗ chưa gắn = "câu ngẫu nhiên trong kho") -> chạm một câu -> THƯ VIỆN theo
//              môn -> chủ đề (dt_thu_vien_cau.js, cau_hinh.json thuVien; không lọc lớp, mỗi câu có nhãn lớp) -> chạm câu là đổi
//              (mayChu.doiCau, miễn phí). Nút "✏️ Câu của con" để sẵn, mờ (bé tự ra câu: TC_D06E2).
//            - KC_06B1 (11/11/2026, Hướng Dẫn 3.17): máy chủ thật (mayChu.thuVien) -> MỌI câu của công trình là câu trong KHO kc_cau_hoi,
//              gửi máy chủ bằng MÃ câu: trụ mới gắn câu = máy chủ tự bốc (truCau không kèm câu); bảng chọn câu 🛡️ = gợi ý theo lớp của bé
//              (mayChu.thuVien); 📝 thư viện = KC_DT_THU_VIEN.taoThuVienKho (môn -> chủ đề của kho); không gửi kho câu (cauKho) / câu dự
//              phòng nữa (máy chủ bốc câu kho theo lớp của chủ). Máy chủ giả (trang thử ?vung) giữ cách cũ (bộ sinh câu trên máy).
// HÀM KHAI RA:
//   taoTruBanDo(the) -> { thongTin(ct) -> { phu, nut[] } | null, dangTran(), moc }
//     the = { ctx, lang, cauHinh, mayChu (truCau / truKhai / truLuot / truTra / truRut / truBan), dvTl, vung, quaiBd (banThuLinh,
//             conNghi, datNghi, dungTl, themTranNgoai, datBanNgoai, danBoChay, veNut, dangTran), be: { ten, hoSo, lop }, baoGoiY,
//             lop (DOM phủ cảnh), cam, diaHinh, hinhCt(id) (dt3d_cong_trinh.js), nhinVe(x, z), chonDv(dv) (TC_D06C2h) }
// LUẬT NỐI: trang phải nạp dt_tru_tran.js, dt_trinh_do.js, dt_sinh_toan.js, dt_sinh_tieng_anh.js, dt_cau_hoi.js.
// BƯỚC: KC_06B2 (máy chủ giả mới sinh câu, nạp bộ sinh khi cần); TC_D06C2g
// NGÀY: 05/11/2026
// ================================================================
import { taoAmThanh } from "./dt3d_am_thanh.js";

const TT = window.KC_DT_TRU_TRAN;
const nap = u => fetch(new URL(u, import.meta.url), { cache: "no-cache" }).then(r => (r.ok ? r.json() : null)).catch(() => null);
// TC_D18A: độ khó câu hỏi = số mặc định + phần quản trị đã sửa (dt/dt_cau_hinh.js)
const napTd = () => window.KC_DT_CAU_HINH
  ? window.KC_DT_CAU_HINH.tai("cau_hinh_trinh_do", new URL("../du_lieu/cau_hinh_trinh_do.json", import.meta.url)).catch(() => null)
  : nap("../du_lieu/cau_hinh_trinh_do.json");

export function taoTruBanDo(the) {
  const { ctx, lang, cauHinh, mayChu, dvTl, vung, quaiBd, be, baoGoiY } = the;
  const C = cauHinh.tru, ten = be.ten || "khach", tenMinh = String(ten).trim().toLowerCase();
  const laTru = ct => !!ct && TT.laTru(cauHinh, ct.loai);
  const tenTru = ct => (cauHinh.congTrinh[ct.loai] || {}).ten || "Trụ";
  const tamCt = ct => ({ x: ct.x + ct.rong / 2, z: ct.y + ct.sau / 2 });
  let am = null; try { am = taoAmThanh(); } catch (e) { am = null; }
  const coKho = !!(mayChu.thuVien && mayChu.mucLuc); // KC_06B1: máy chủ thật có kho câu chung (công trình chỉ nhận mã câu)
  const lopBe = () => Math.max(1, Math.min(12, Math.floor(be.lop) || 2));
  // KC_06B1: n câu kho gợi ý theo lớp của bé (bảng chọn câu 🛡️), bỏ câu đã có trong công trình (mã)
  async function goiYKho(n, ct) {
    const boQua = (ct && ct.cau || []).map(c => c.id).filter(Number.isInteger);
    const kq = await mayChu.thuVien({ lop: lopBe(), n, boQua }).catch(() => null);
    return kq && kq.ok ? (kq.cau || []).map(c => window.KC_DT_THU_VIEN.cauKho(c)).filter(Boolean) : [];
  }

  // ---------- trụ của mình: gắn câu ngẫu nhiên từ kho ----------
  let boChon = null; // Promise<{ bo, hs, mon[] }>
  function nguonCau() {
    if (boChon) return boChon;
    // KC_06B2: chỉ máy chủ GIẢ (trang thử / kịch bản thử) còn sinh câu trên máy; trang game không nạp bộ sinh -> nạp khi cần
    const MC = window.KC_DT_MAY_CHU, sinh = MC && MC.napBoSinh ? MC.napBoSinh() : Promise.resolve();
    boChon = Promise.all([napTd(), nap("../../tu_vung/kho_tu.json"), sinh]).then(([chTd0, kho]) => {
      const TD = window.KC_DT_TRINH_DO, ST = window.KC_DT_SINH_TOAN, TA = window.KC_DT_SINH_TA, CHQ = window.KC_DT_CAU_HOI;
      const chTD = TD.cauHinh(chTd0), NG = { toan: ST };
      if (kho && TA) { try { NG.tieng_anh = TA.tao(kho, chTD); } catch (e) { /* thiếu kho từ: chỉ Toán */ } }
      let hs = null;
      try { const cu = JSON.parse(localStorage.getItem("kc_dt_trinh_do_" + tenMinh) || "null"); if (cu && cu.hs) hs = TD.chuanHoa(cu.hs, chTD); } catch (e) { /* bị chặn */ }
      if (!hs) hs = TD.taoHoSo(Math.max(1, Math.min(12, Math.floor(be.lop) || 2)), chTD);
      return { bo: CHQ.taoBoChon(chTD, NG), hs, mon: Object.keys(NG), NG, kho };
    });
    return boChon;
  }
  async function taoBoCau(n, tranh) { // TC_D06C7e: tranh = Set nội dung câu đã gắn (bảng chọn không gợi ý lại)
    const { bo, hs, mon } = await nguonCau();
    const ds = [];
    for (let lan = 0; ds.length < n && lan < n * 25; lan++) {
      const m = mon[Math.floor(Math.random() * mon.length)], x = bo.cauTiep(hs, m), c = x && x.cau;
      // câu có hình (đường dẫn ảnh) không gửi máy chủ: trụ chỉ giữ chữ
      if (!c || c.hinh || typeof c.noiDung !== "string" || !Array.isArray(c.dapAn) || c.dapAn.length < 2 || !(c.dung || []).length) continue;
      if (ds.some(d => d.noiDung === c.noiDung && String(d.dapAn) === String(c.dapAn))) continue;
      if (tranh && tranh.has(c.noiDung) && lan < n * 20) continue;
      ds.push({ noiDung: c.noiDung, dapAn: c.dapAn.map(String), dung: c.dung.slice(), loiGiai: c.loiGiai || "", mon: m, doKho: c.doKho || "", hinhChu: c.hinhChu || "", amThanh: c.amThanh || "" });
    }
    return ds.length === n ? ds : null;
  }
  const dangGan = new Set(), ganLuc = new Map();
  async function ganCau(ct) {
    if (dangGan.has(ct.id) || Date.now() - (ganLuc.get(ct.id) || 0) < 15000) return;
    dangGan.add(ct.id); ganLuc.set(ct.id, Date.now());
    try {
      if (coKho) { // KC_06B1: máy chủ tự bốc câu kho theo lớp của bé (câu + mã về ở lần hỏi layQuanh sau)
        const kq = await mayChu.truCau(ten, ct.id, null);
        if (kq.ok) ct.coCau = true;
        return;
      }
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
      // TC_D06C7d: số câu riêng; máy chủ giả: chủ chưa có kho câu thì dùng câu dự phòng này. KC_06B1: máy chủ thật tự bốc câu kho
      const duPhong = coKho ? null : await taoBoCau(TT.soCt(cauHinh, ct).soCau);
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
        : d.ham === "tra" ? await mayChu.truTra(ten, t.tr.id, { chon: Number.isInteger(ts.chon) ? ts.chon : null, maLuot: typeof ts.maLuot === "string" ? ts.maLuot : null, id: Number.isInteger(ts.id) ? ts.id : null }) // KC_06B3
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
    const s = TT.soCt(cauHinh, f.ct), mt = TT.mauCt(cauHinh, f.ct, s), md = mauDan(f.dv), td = toiDaDan();
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
    const n = TT.soCt(cauHinh, ct).soCau, ds = (ct.cau || []).slice(0, n); // TC_D06C7d: trận dùng n câu đầu (thiếu thì bù từ kho câu)
    const td = document.createElement("b"); td.textContent = "📜 " + tenTru(ct) + " · " + n + " câu phòng thủ";
    const dong = document.createElement("button"); dong.type = "button"; dong.className = "d3Nut"; dong.textContent = "✖"; dong.setAttribute("aria-label", "Đóng");
    dong.addEventListener("click", () => p.remove());
    dau.append(td, dong); p.appendChild(dau);
    const ol = document.createElement("ol");
    for (const c of ds) {
      const li = document.createElement("li");
      const nd = document.createElement("div"); nd.textContent = (c.hinhChu ? c.hinhChu + " " : "") + c.noiDung; li.appendChild(nd);
      const da = document.createElement("div"); da.className = "d3BangCauDa";
      c.dapAn.forEach((x, i) => { const s = document.createElement("span"); s.textContent = x; if (c.dung.indexOf(i) >= 0) s.className = "dung"; da.appendChild(s); });
      li.appendChild(da); ol.appendChild(li);
    }
    p.appendChild(ol);
    if (n > ds.length) { const g = document.createElement("p"); g.textContent = "+ " + (n - ds.length) + (coKho ? " câu lấy ngẫu nhiên trong kho câu (theo lớp của con) lúc vào trận" : " câu lấy ngẫu nhiên trong kho câu của con lúc vào trận"); p.appendChild(g); }
    document.body.appendChild(p);
  }
  // ---------- TC_D06C7d: bé mua câu phòng thủ bằng vàng (🛡️) / sửa công trình bị đánh (🔧) ----------
  const giaChu = (gia, n) => Object.keys(gia || {}).map(t => gia[t] * n + " " + ((cauHinh.lang.taiNguyen[t] || {}).bieuTuong || t)).join(" + ");
  let dangMua = false, soMua = 0, soSua = 0;
  async function muaCau(ct, so, cau) { // TC_D06C7e: cau = câu bé đã chọn (so câu)
    if (dangMua || !mayChu.muaCau) return false;
    if (!Array.isArray(cau) || cau.length !== (so || 1)) { moChonCau(ct); return false; }
    dangMua = true;
    let kq;
    try { kq = await mayChu.muaCau(ten, ct.id, so || 1, cau); } catch (e) { kq = { ok: false, lyDo: "Không kết nối được máy chủ, con thử lại nhé." }; }
    dangMua = false;
    if (!kq.ok) { baoGoiY((kq.ma === "thieu" ? "🪙 " : "❌ ") + kq.lyDo); return false; }
    const n0 = TT.soCt(cauHinh, ct).soCau;
    ct.cau = TT.ganCauMua(ct.cau, n0, cau); // máy chủ gắn y hệt (chủ nhận lại ở lần hỏi sau)
    ct.soCau = kq.soCau; ct.mau = Number.isFinite(kq.mau) ? kq.mau : null; soMua++;
    if (vung && vung.nhanKho) vung.nhanKho(kq.kho);
    baoGoiY("🛡️ " + tenTru(ct) + " có " + kq.soCau + " câu phòng thủ · ❤️ " + TT.mauCt(cauHinh, ct) + "/" + kq.mauToiDa);
    return true;
  }
  // TC_D06C7e: sửa = trả tài nguyên (không vàng), máy chủ ghi ct.sua; nông dân rảnh gần nhất tự tới sửa (bé chọn thêm người rồi chạm công trình)
  async function suaCt(ct) {
    if (dangMua || !mayChu.suaCt) return false;
    dangMua = true;
    let kq;
    try { kq = await mayChu.suaCt(ten, ct.id); } catch (e) { kq = { ok: false, lyDo: "Không kết nối được máy chủ, con thử lại nhé." }; }
    dangMua = false;
    if (!kq.ok && kq.ma === "dang_sua" && kq.sua) { ct.sua = kq.sua; return !!(vung && vung.guiSua && vung.guiSua(ct)); }
    if (!kq.ok) { baoGoiY((kq.ma === "thieu" ? "🪵 " : "❌ ") + kq.lyDo); return false; }
    ct.sua = kq.sua; soSua++;
    if (vung && vung.nhanKho) vung.nhanKho(kq.kho);
    const ai = vung && vung.guiSua ? vung.guiSua(ct) : null;
    baoGoiY("🔧 " + (ai ? "🧑‍🌾 " + ai.ten + " đang tới sửa " : "Đã trả " + giaChu(kq.gia, 1) + " · chọn một nông dân rồi chạm ") + tenTru(ct) + (ai ? " · " + giaChu(kq.gia, 1) : " để sửa"));
    return true;
  }
  // ---------- TC_D06C7e: bảng chọn câu khi mua (kho chung theo trình độ của bé; kho riêng của bé: TC_D06E2) ----------
  async function moChonCau(ct) {
    const cu = document.getElementById("d3ChonCau"); if (cu) cu.remove();
    const gia = TT.giaCau(cauHinh, ct.loai);
    const p = document.createElement("div"); p.id = "d3ChonCau"; p.className = "d3BangCau d3Khung"; p.setAttribute("role", "dialog");
    const dau = document.createElement("div"); dau.className = "d3BangCauDau";
    const td = document.createElement("b"); td.textContent = "🛡️ Chọn câu giữ " + tenTru(ct) + " · " + giaChu(gia, 1);
    const dong = document.createElement("button"); dong.type = "button"; dong.className = "d3Nut"; dong.textContent = "✖"; dong.setAttribute("aria-label", "Đóng");
    dong.addEventListener("click", () => p.remove());
    dau.append(td, dong); p.appendChild(dau);
    const goiY = document.createElement("p"); goiY.textContent = "Chạm câu con muốn bạn khác phải trả lời khi đánh công trình này."; p.appendChild(goiY);
    const ol = document.createElement("ol"); ol.className = "d3ChonCauDs"; p.appendChild(ol);
    const doi = document.createElement("button"); doi.type = "button"; doi.className = "d3Nut d3NutMua"; doi.id = "d3CauKhac"; doi.textContent = "🔄 Câu khác";
    p.appendChild(doi);
    document.body.appendChild(p);
    const daCo = new Set((ct.cau || []).map(c => c.noiDung));
    async function ve() {
      ol.textContent = "⏳";
      const soGoiY = (cauHinh.muaCau || {}).soGoiY || 3;
      const ds = coKho ? await goiYKho(soGoiY, ct) : (await taoBoCau(soGoiY, daCo)) || []; // KC_06B1: câu kho theo lớp của bé
      if (!p.isConnected) return;
      ol.textContent = "";
      if (!ds.length) { ol.textContent = "Chưa lấy được câu hỏi, con bấm 🔄 Câu khác nhé."; return; }
      for (const c of ds) {
        const li = document.createElement("li"); li.className = "d3CauChon"; li.tabIndex = 0; li.setAttribute("role", "button");
        const nd = document.createElement("div"); nd.textContent = (c.hinhChu ? c.hinhChu + " " : "") + c.noiDung; li.appendChild(nd);
        const da = document.createElement("div"); da.className = "d3BangCauDa";
        c.dapAn.forEach((x, i) => { const s = document.createElement("span"); s.textContent = x; if (c.dung.indexOf(i) >= 0) s.className = "dung"; da.appendChild(s); });
        li.appendChild(da);
        const chon = async () => { if (dangMua) return; if (await muaCau(ct, 1, [c])) p.remove(); };
        li.addEventListener("click", chon);
        li.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); chon(); } });
        ol.appendChild(li);
      }
    }
    doi.addEventListener("click", ve);
    await ve();
    return p;
  }
  // ---------- TC_D06E: 📝 CẬP NHẬT CÂU HỎI (người dùng 05/11 + 09/11/2026): bé đổi từng câu của công trình bằng câu trong THƯ VIỆN ----------
  // (dt_thu_vien_cau.js: môn -> chủ đề, không lọc lớp, mỗi câu có nhãn lớp), miễn phí. Điện thoại: danh sách câu của công trình rồi
  // sang thư viện (◀ Quay lại); máy tính: 2 cột (trái câu của công trình, phải thư viện).
  let boTv = null, tvMon = null, tvCd = {}; // thư viện (Promise) + môn / chủ đề bé chọn lần trước
  function thuVien() {
    if (!boTv) boTv = coKho // KC_06B1: thư viện = kho câu chung trên máy chủ (môn -> chủ đề), câu có mã
      ? window.KC_DT_THU_VIEN.taoThuVienKho(mayChu).then(tv => { if (!tv) boTv = null; return tv; })
      : nguonCau().then(({ NG, kho }) => window.KC_DT_THU_VIEN.taoThuVien(cauHinh.thuVien, NG, { khoTu: kho }));
    return boTv;
  }
  const TEN_MUC = { de: "dễ", vua: "vừa", kho: "khó" };
  let dangDoi = false, soDoi = 0;
  function veCauVao(li, c) { // nội dung + đáp án (đáp án đúng tô xanh), như bảng 📜
    const nd = document.createElement("div"); nd.textContent = (c.hinhChu ? c.hinhChu + " " : "") + c.noiDung; li.appendChild(nd);
    const da = document.createElement("div"); da.className = "d3BangCauDa";
    c.dapAn.forEach((x, i) => { const s = document.createElement("span"); s.textContent = x; if (c.dung.indexOf(i) >= 0) s.className = "dung"; da.appendChild(s); });
    li.appendChild(da);
  }
  const nutNho = (chu, lop) => { const b = document.createElement("button"); b.type = "button"; b.className = "d3Nut " + (lop || ""); b.textContent = chu; return b; };
  async function moCapNhatCau(ct) {
    ["d3CapNhat", "d3BangCau", "d3ChonCau"].forEach(id => { const cu = document.getElementById(id); if (cu) cu.remove(); });
    const p = document.createElement("div"); p.id = "d3CapNhat"; p.className = "d3BangCau d3Khung d3CapNhat"; p.setAttribute("role", "dialog"); p.dataset.che = "ds";
    const dau = document.createElement("div"); dau.className = "d3BangCauDau";
    const td = document.createElement("b"); td.textContent = "📝 Câu hỏi giữ " + tenTru(ct);
    const dong = nutNho("✖"); dong.setAttribute("aria-label", "Đóng"); dong.addEventListener("click", () => p.remove());
    dau.append(td, dong); p.appendChild(dau);
    const than = document.createElement("div"); than.className = "d3CnThan"; p.appendChild(than);
    // --- cột câu của công trình ---
    const cotDs = document.createElement("section"); cotDs.className = "d3CnDs";
    const gyDs = document.createElement("p"); gyDs.textContent = "Chạm một câu để đổi bằng câu trong thư viện (miễn phí)."; cotDs.appendChild(gyDs);
    const olDs = document.createElement("ol"); cotDs.appendChild(olDs);
    // --- cột thư viện ---
    const cotTv = document.createElement("section"); cotTv.className = "d3CnTv";
    const tvDau = document.createElement("div"); tvDau.className = "d3CnTvDau";
    const lui = nutNho("◀ Quay lại", "d3CnLui"); lui.addEventListener("click", () => { p.dataset.che = "ds"; });
    const tdTv = document.createElement("b"); tvDau.append(lui, tdTv); cotTv.appendChild(tvDau);
    const hangMon = document.createElement("div"); hangMon.className = "d3CnMon"; hangMon.setAttribute("role", "tablist"); cotTv.appendChild(hangMon);
    const hangCd = document.createElement("div"); hangCd.className = "d3CnCd"; cotTv.appendChild(hangCd);
    const olTv = document.createElement("ol"); olTv.className = "d3ChonCauDs"; cotTv.appendChild(olTv);
    const khac = nutNho("🔄 Câu khác", "d3NutMua"); khac.id = "d3CnKhac"; cotTv.appendChild(khac);
    than.append(cotDs, cotTv);
    document.body.appendChild(p);

    let o = 0; // chỗ bé đang đổi (0..n-1)
    const soN = () => TT.soCt(cauHinh, ct).soCau, daGan = () => (ct.cau || []).slice(0, soN());
    function veDs(vuaDoi) {
      olDs.textContent = "";
      const n = soN(), ds = daGan();
      for (let i = 0; i < n; i++) {
        const li = document.createElement("li"); li.className = "d3CnO" + (i === o ? " dangChon" : "") + (i === vuaDoi ? " vuaDoi" : "");
        li.tabIndex = 0; li.setAttribute("role", "button");
        if (ds[i]) veCauVao(li, ds[i]);
        else { const g = document.createElement("div"); g.className = "d3CnNgauNhien"; g.textContent = coKho ? "❔ Câu ngẫu nhiên trong kho (theo lớp của con)" : "❔ Câu ngẫu nhiên trong kho câu của con"; li.appendChild(g); }
        const chon = () => { o = i; veDs(); tdTv.textContent = "Đổi câu " + (i + 1); p.dataset.che = "tv"; };
        li.addEventListener("click", chon);
        li.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); chon(); } });
        olDs.appendChild(li);
      }
    }
    const tv = await thuVien();
    if (!p.isConnected) return p;
    if (!tv) { olTv.textContent = "Chưa mở được thư viện câu hỏi, con thử lại sau nhé."; veDs(); return p; } // KC_06B1: mất mạng
    const dsMon = tv.dsMon();
    if (!tvMon || !dsMon.some(m => m.ma === tvMon)) tvMon = dsMon.length ? dsMon[0].ma : null;
    function veMon() {
      hangMon.textContent = "";
      for (const m of dsMon) {
        const b = nutNho(m.bieuTuong + " " + m.ten, "d3CnTab"); b.dataset.mon = m.ma; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(m.ma === tvMon));
        b.addEventListener("click", () => { tvMon = m.ma; veMon(); veCd(); veCau(); });
        hangMon.appendChild(b);
      }
      const sau = nutNho("✏️ Câu của con · sắp có", "d3CnTab"); sau.disabled = true; sau.title = "Con tự ra câu: làm ở bước sau"; // TC_D06E2
      hangMon.appendChild(sau);
    }
    function veCd() {
      hangCd.textContent = "";
      const ds = tvMon ? tv.dsChuDe(tvMon) : [];
      if (!ds.some(c => c.ma === tvCd[tvMon])) tvCd[tvMon] = ds.length ? ds[0].ma : null;
      for (const c of ds) {
        const b = nutNho(c.ten + (c.lop ? " · lớp " + c.lop : ""), "d3CnChip"); b.dataset.cd = c.ma; b.setAttribute("aria-pressed", String(c.ma === tvCd[tvMon]));
        b.addEventListener("click", () => { tvCd[tvMon] = c.ma; veCd(); veCau(); });
        hangCd.appendChild(b);
      }
      const dang = hangCd.querySelector("[aria-pressed=true]"); if (dang && dang.scrollIntoView) dang.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    let lanVe = 0;
    async function veCau() {
      const lan = ++lanVe, cd = tvCd[tvMon];
      olTv.textContent = tv.kho ? "⏳" : "";
      const tranh = new Set((ct.cau || []).map(c => (tv.kho && Number.isInteger(c.id) ? c.id : c.noiDung))); // KC_06B1: kho tránh theo mã câu
      const ds = cd ? await tv.cau(tvMon, cd, (cauHinh.thuVien || {}).soGoiY || 4, null, tranh) : [];
      if (lan !== lanVe || !p.isConnected) return; // bé đã bấm chủ đề khác
      olTv.textContent = "";
      if (!ds.length) { olTv.textContent = "Chủ đề này chưa có câu, con chọn chủ đề khác nhé."; return; }
      for (const c of ds) {
        const li = document.createElement("li"); li.className = "d3CauChon"; li.tabIndex = 0; li.setAttribute("role", "button");
        const nhan = document.createElement("small"); nhan.className = "d3CnNhan"; nhan.textContent = (c.lop ? "Lớp " + c.lop : "") + (c.doKho ? " · " + (TEN_MUC[c.doKho] || c.doKho) : "") + (c.cuaBe ? " · ✏️ Câu của bạn nhỏ" : "");
        li.appendChild(nhan); veCauVao(li, c);
        const chon = async () => { const so = await doiCau(ct, o, c); if (so) { o = so - 1; veDs(o); veCau(); p.dataset.che = "ds"; } };
        li.addEventListener("click", chon);
        li.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); chon(); } });
        olTv.appendChild(li);
      }
    }
    khac.addEventListener("click", veCau);
    o = Math.min(daGan().length, soN() - 1); // máy tính: sẵn chỗ "ngẫu nhiên" đầu tiên (hoặc câu cuối)
    tdTv.textContent = "Đổi câu " + (o + 1);
    veDs(); veMon(); veCd(); veCau();
    return p;
  }
  async function doiCau(ct, o, c) {
    if (dangDoi || !mayChu.doiCau) return false;
    const viTri = Math.min(o, (ct.cau || []).length); // chỗ "ngẫu nhiên": gắn tiếp sau các câu đã gắn (TT.doiCau)
    const cau = Object.assign({ noiDung: c.noiDung, dapAn: c.dapAn, dung: c.dung, loiGiai: c.loiGiai, mon: c.mon, doKho: c.doKho, hinhChu: c.hinhChu, amThanh: c.amThanh },
      Number.isInteger(c.id) ? { id: c.id, lop: c.lop, chuDe: c.chuDe } : null); // KC_06B1: máy chủ chỉ nhận mã câu
    dangDoi = true;
    let kq;
    try { kq = await mayChu.doiCau(ten, ct.id, viTri, [cau]); } catch (e) { kq = { ok: false, lyDo: "Không kết nối được máy chủ, con thử lại nhé." }; }
    dangDoi = false;
    if (!kq.ok) { baoGoiY("❌ " + kq.lyDo); return false; }
    ct.cau = TT.doiCau(ct.cau, viTri, cau); soDoi++; // máy chủ đổi y hệt
    baoGoiY("📝 Đã đổi câu " + (viTri + 1) + " của " + tenTru(ct));
    return viTri + 1; // số thứ tự câu vừa đổi
  }
  const nutCapNhat = ct => (mayChu.doiCau && window.KC_DT_THU_VIEN ? [{ id: "d3CapNhatCau", lop: "", chu: "📝<span class=\"d3Chu\"> Cập nhật câu hỏi</span>", nhan: "Cập nhật câu hỏi giữ " + tenTru(ct), bam: () => moCapNhatCau(ct) }] : []);
  // Nút của công trình của mình (đã xong, chưa sụp): 🛡️ +1 câu (giá theo loại), 🔧 Sửa khi mất máu
  function nutMua(ct) {
    const nut = [];
    if (!mayChu.muaCau) return nut;
    const gia = TT.giaCau(cauHinh, ct.loai);
    // giá luôn hiện (điện thoại chỉ ẩn chữ "Sửa" / "+1 câu"); TC_D06C7e: sửa tốn tài nguyên (TT.giaSua), đang sửa thì không có nút
    if (ct.sua) return nut;
    if (TT.phanMat(cauHinh, ct) > 0 && mayChu.suaCt) { const gs = TT.giaSua(cauHinh, ct); nut.push({ id: "d3SuaCt", lop: "d3NutMua", chu: "🔧<span class=\"d3Chu\"> Sửa ·</span> " + (giaChu(gs, 1) || "0"), nhan: "Sửa " + tenTru(ct) + " (" + (giaChu(gs, 1) || "miễn phí") + ")", bam: () => suaCt(ct) }); }
    nut.push({ id: "d3MuaCau", lop: "d3NutMua", chu: "🛡️<span class=\"d3Chu\"> +1 câu ·</span> " + giaChu(gia, 1), nhan: "Chọn 1 câu phòng thủ (" + giaChu(gia, 1) + ")", bam: () => moChonCau(ct) });
    return nut;
  }
  // TC_D06C7b: công trình thường: đống gạch; của bạn: máu + ⚔️ Tấn công (Thủ lĩnh tự đi tới sát rồi vào trận); của mình: máu + số câu + 🛡️ / 🔧
  function thongTinDanh(ct) {
    const s = TT.soCt(cauHinh, ct), mau = TT.mauCt(cauHinh, ct, s); // TC_D06C7d: số câu riêng của công trình
    if (ct.hongLuc != null) return { dong: "🧱 Đống gạch · biến mất sau " + Math.max(0, Math.ceil((C.hongGiay * 1000 - (mayChu.gio() - ct.hongLuc)) / 1000)) + " giây", nut: [] };
    if (!ct.xong) return null;
    // của mình: máu + số câu ở dòng chính (thay "Đã hoàn thành"); dòng phụ giữ thông số riêng (sức chứa, chỗ ở...)
    if (ct.cuaMinh !== false) return { dong: "❤️ " + mau + "/" + s.mauToiDa + " · ❓ " + s.soCau + " câu" + (ct.sua ? " · 🔧 Đang sửa " + Math.round((ct.sua.tienDo || 0) * 100) + "%" : mau < s.mauToiDa ? " · 🔥 bị bạn đánh" : ""), nut: nutCapNhat(ct).concat(nutMua(ct)), muc: ct.sua ? ct.sua.tienDo || 0 : undefined };
    const nut = [];
    if (dvTl && !dvTl.laBan) nut.push({ id: "d3DanhCt", lop: "d3NutDanh", chu: "⚔️<span class=\"d3Chu\"> Tấn công</span>", nhan: "Tấn công " + tenTru(ct) + " của " + ct.chu, bam: () => batDauDanh(ct) });
    return { phu: "❤️ " + mau + "/" + s.mauToiDa + " · ❓ " + s.soCau + " câu · của " + ct.chu, nut };
  }
  function thongTin(ct) {
    if (laDanh(ct)) return thongTinDanh(ct);
    if (!laTru(ct)) return null;
    const s = TT.soCt(cauHinh, ct), mau = TT.mauCt(cauHinh, ct, s); // TC_D06C7b: máu = số câu x máu mỗi câu; TC_D06C7d: số câu riêng của trụ
    if (ct.hongLuc != null) return { dong: "🧱 Đống gạch · biến mất sau " + Math.max(0, Math.ceil((C.hongGiay * 1000 - (mayChu.gio() - ct.hongLuc)) / 1000)) + " giây", nut: [] };
    if (!ct.xong) return null;
    const phu = "❤️ " + mau + "/" + s.mauToiDa + " · 🎯 tầm " + s.tam + " ô · trụ đúng " + Math.round(s.tiLe * 100) + "%";
    if (ct.cuaMinh === false) return { phu: phu + " · của " + ct.chu, nut: [] };
    const nut = [];
    if (ct.cau && ct.cau.length) nut.push({ id: "d3XemCau", lop: "", chu: "📜<span class=\"d3Chu\"> " + s.soCau + " câu</span>", nhan: "Xem " + s.soCau + " câu phòng thủ", bam: () => moBangCau(ct) });
    if (ct.coCau) nut.push(...nutCapNhat(ct), ...nutMua(ct));
    return { phu: phu + " · " + (ct.coCau ? "❓ " + s.soCau + " câu" : "⏳ đang chọn câu") + (ct.sua ? " · 🔧 Đang sửa " + Math.round((ct.sua.tienDo || 0) * 100) + "%" : ""), nut };
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
      thongTin: id => { const ct = lang.congTrinh.find(c => c.id === id); const t = ct && thongTin(ct); return t ? { dong: t.dong, phu: t.phu, nut: (t.nut || []).map(n => n.id) } : null; },
      // TC_D06C7d: mua câu / sửa như bé bấm 🛡️ / 🔧 (Promise<bool>), số lần đã mua / sửa, nút của công trình (chữ)
      muaCau: (id, so, cau) => { const ct = lang.congTrinh.find(c => c.id === id); return ct ? muaCau(ct, so, cau) : Promise.resolve(false); },
      // TC_D06C7e: mở bảng chọn câu (như bé bấm 🛡️), chọn câu thứ i trong bảng (như bé chạm), mức cháy
      moChonCau: id => { const ct = lang.congTrinh.find(c => c.id === id); return ct ? moChonCau(ct).then(() => true) : Promise.resolve(false); },
      chonCauSo: i => { const li = document.querySelectorAll("#d3ChonCau .d3CauChon")[i || 0]; if (li) li.click(); return !!li; },
      cauCt: id => { const ct = lang.congTrinh.find(c => c.id === id); return ct && ct.cau ? ct.cau.map(c => c.noiDung) : null; },
      chay: id => { const ct = lang.congTrinh.find(c => c.id === id); return ct ? TT.mucChay(cauHinh, ct) : null; },
      suaCt: id => { const ct = lang.congTrinh.find(c => c.id === id); return ct ? suaCt(ct) : Promise.resolve(false); },
      soMua: () => soMua, soSua: () => soSua,
      // TC_D06E: như bé bấm 📝, chạm chỗ câu thứ i, chạm môn / chủ đề, chạm câu thư viện thứ i; trạng thái bảng
      moCapNhat: id => { const ct = lang.congTrinh.find(c => c.id === id); return ct ? moCapNhatCau(ct).then(() => true) : Promise.resolve(false); },
      cnO: i => { const li = document.querySelectorAll("#d3CapNhat .d3CnO")[i || 0]; if (li) li.click(); return !!li; },
      cnMon: ma => { const b = document.querySelector("#d3CapNhat .d3CnTab[data-mon=\"" + ma + "\"]"); if (b) b.click(); return !!b; },
      cnChuDe: ma => { const b = document.querySelector("#d3CapNhat .d3CnChip[data-cd=\"" + ma + "\"]"); if (b) b.click(); return !!b; },
      cnCau: i => { const li = document.querySelectorAll("#d3CapNhat .d3CnTv .d3CauChon")[i || 0]; if (!li) return null; const nd = li.children[1] && li.children[1].textContent; li.click(); return nd; },
      cnTrangThai: () => { const p = document.getElementById("d3CapNhat"); return p ? { che: p.dataset.che, soO: p.querySelectorAll(".d3CnO").length,
        mon: [...p.querySelectorAll(".d3CnTab[data-mon]")].map(b => b.dataset.mon), soCd: p.querySelectorAll(".d3CnChip").length,
        soCau: p.querySelectorAll(".d3CnTv .d3CauChon").length, dangChon: [...p.querySelectorAll(".d3CnO")].findIndex(li => li.classList.contains("dangChon")) } : null; },
      soDoi: () => soDoi,
      nutChu: id => { const ct = lang.congTrinh.find(c => c.id === id); const t = ct && thongTin(ct); return t ? (t.nut || []).map(n => ({ id: n.id, chu: n.chu.replace(/<[^>]+>/g, "") })) : null; },
      ctMinh: () => lang.congTrinh.filter(c => c.cuaMinh !== false && TT.danhDuoc(cauHinh, c.loai)).map(c => ({ id: c.id, loai: c.loai, xong: c.xong, soCau: c.soCau, mau: c.mau, hongLuc: c.hongLuc }))
    }
  };
}
// 05/11/2026 - BƯỚC: TC_D06C2g (trụ phòng thủ trên bản đồ)
// 06/11/2026 - BƯỚC: TC_D06C2h (trụ tự bắn nông dân, nông dân vào trận với trụ, máy chủ trụ thấy nỏ quay + mũi tên)
// 06/11/2026 - BƯỚC: TC_D06C5 (biBan: nông dân đang bị trụ bắn)
// 08/11/2026 - BƯỚC: TC_D06C7b (kho câu của bé; ⚔️ Tấn công công trình thường của bạn: Thủ lĩnh tới sát -> trận y luật trụ; rào sụp -> lãnh địa tính lại)
// 08/11/2026 - BƯỚC: TC_D06C7d (🛡️ mua câu bằng vàng, 🔧 sửa công trình; số câu riêng từng công trình)
// 08/11/2026 16:xx - BƯỚC: TC_D06C7e (bảng chọn câu khi mua; 🔧 sửa bằng tài nguyên, nông dân tới sửa)
// 09/11/2026 - BƯỚC: TC_D06E (📝 Cập nhật câu hỏi: bé đổi từng câu của công trình bằng thư viện câu hỏi theo môn -> chủ đề)
// 10/11/2026 - BƯỚC: TC_D18A (số cân bằng = mặc định + phần quản trị đã sửa, dt/dt_cau_hinh.js)
// 11/11/2026 - BƯỚC: KC_06B1 (máy chủ thật: câu công trình = câu kho có mã; trụ mới máy chủ tự bốc; 🛡️ gợi ý kho theo lớp; 📝 thư viện kho; bỏ cauKho / câu dự phòng)
// 11/11/2026 - BƯỚC: KC_06B2 (máy chủ giả: nạp bộ sinh câu khi cần, trang game không nạp sẵn)
// 12/11/2026 - BƯỚC: KC_06B3 (truTra gửi mã lượt + mã câu phòng thủ để máy chủ tự chấm)
