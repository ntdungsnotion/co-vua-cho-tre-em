// ================================================================
// FILE: dt/3d/dt3d_thu.js  (ES module) - KHỞI ĐỘNG CẢNH 3D ĐẤU TRƯỜNG
// CHỨC NĂNG: Tải dữ liệu + mô hình, dựng LÕI làng (dt_lang.js) rồi nối các PHẦN VẼ:
//            canh -> camera -> địa hình -> công trình -> tài nguyên -> nhân vật -> điều khiển.
//            Thanh tài nguyên, các nút, móc cho kịch bản thử Chrome (window.__dt3d).
//            BA CHẾ ĐỘ:
//            - trang thử kc/dt_thu_3d.html (mặc định): làng mẫu 44 x 44 (lang_thu_3d.json) có lều,
//              nông dân, tua giờ; không cần đăng nhập (ngoại hình đọc hồ sơ chung có trên máy)
//            - trang thử ?vung (TC_D02B2a): THUNG LŨNG KHỞI ĐẦU 128 x 128 (vung_dat.json), phần
//              riêng ở dt3d_vung.js (máy chủ, sương mù, dựng lều, khám phá) + nút thử
//            - TRANG GAME kc/dt_thung_lung.html (TC_D02B2b, <body data-che-do="game">): thung lũng
//              của bé ĐANG ĐĂNG NHẬP, không có nút thử; chưa đăng nhập / chưa tạo Thủ lĩnh thì về
//              sảnh Đấu Trường
// BƯỚC: TC_D02A (thay dt/dt_lang_3d.js của TC_D01C); TC_D02B2a (chế độ ?vung);
//       TC_D02B2b (thung lũng tách sang dt3d_vung.js, trang game); TC_D02B3a (trang game dùng máy chủ
//       Supabase dt/dt_may_chu_sb.js; kịch bản thử đặt sessionStorage kc_dt_may_chu_gia = "1" để dùng bản giả)
// NGÀY: 23/10/2026; 26/10/2026; 27/10/2026; 27/10/2026 18:55
// PHỤ THUỘC: chung/nv_ve.js (KC_NV), dt/dt_luoi.js, dt/dt_lang.js (KC_DT_LANG), các phần dt/3d/*.js;
//            thung lũng thêm dt/dt_ban_do.js, dt/dt_may_chu.js; trang game thêm chung/nv_ho_so.js,
//            dt/dt_tien_do.js (phiên đăng nhập: sessionStorage của kc_auth.js)
// ================================================================
import { taoCanh, docDoHoa, luuDoHoa } from "./dt3d_canh.js";
import { taoCamera } from "./dt3d_camera.js";
import { taiGlb, taoBoMoHinh } from "./dt3d_mo_hinh.js";
import { taoDiaHinh } from "./dt3d_dia_hinh.js";
import { taoCongTrinh } from "./dt3d_cong_trinh.js";
import { taoTaiNguyen } from "./dt3d_tai_nguyen.js";
import { taoBoNhanVat } from "./dt3d_nhan_vat.js";
import { taoDieuKhien } from "./dt3d_dieu_khien.js";
import { vaoThungLung } from "./dt3d_vung.js";

const NV = window.KC_NV, LANG = window.KC_DT_LANG, BD = window.KC_DT_BAN_DO;
const $ = id => document.getElementById(id);
const t0 = performance.now();
const duongDan = p => new URL(p, import.meta.url).href;
const GAME = document.body.dataset.cheDo === "game";
const VUNG = GAME || new URLSearchParams(location.search).has("vung");
const chuTai = $("d3TaiChu");

// ---------------- Bé là ai ----------------
// Trang game: bé đang đăng nhập (phiên của kc_auth.js) + Thủ lĩnh đã tạo ở sảnh (TC_D01)
function docBeDangNhap() {
  let ten = null;
  try { ten = (JSON.parse(sessionStorage.getItem("coVuaTaiKhoanDangNhap") || "null") || {}).tenDangNhap || null; } catch (e) { /* bị chặn */ }
  const td = ten && window.KC_DT_TIEN_DO.doc(ten);
  if (!td) return null;
  const hoSo = window.KC_NV_HO_SO.doc(ten) || NV.chuanHoa({ chungLoai: td.chungLoai });
  return { ten, hoSo, tenThuLinh: td.tenThuLinh, tenVuongQuoc: td.tenVuongQuoc };
}
// Trang thử: hồ sơ ngoại hình đầu tiên tìm thấy trên máy này (không có thì hình mẫu)
function docHoSoBe() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("kc_nhan_vat_")) {
        const ten = k.slice("kc_nhan_vat_".length);
        const td = JSON.parse(localStorage.getItem("kc_dt_tien_do_" + ten) || "null");
        return { ten, hoSo: NV.chuanHoa(JSON.parse(localStorage.getItem(k))), tenThuLinh: td && td.tenThuLinh, tenVuongQuoc: td && td.tenVuongQuoc };
      }
    }
  } catch (e) { /* bộ nhớ bị chặn: dùng hình mẫu */ }
  return { ten: null, hoSo: NV.chuanHoa({ chungLoai: "nhan", gioi: "nam", mauDa: 1, mauToc: 1, mauAo: 3 }), tenThuLinh: null, tenVuongQuoc: null };
}
// Trang game: máy chủ THẬT (Supabase, TC_D02B3a) gọi bằng tên + mã phiên đăng nhập chung.
// Kịch bản thử Chrome đặt sessionStorage kc_dt_may_chu_gia = "1" để dùng máy chủ giả (trả null).
function taoMayChuThat() {
  let phien = null, gia = false;
  try { phien = JSON.parse(sessionStorage.getItem("coVuaTaiKhoanDangNhap") || "null"); gia = sessionStorage.getItem("kc_dt_may_chu_gia") === "1"; } catch (e) { /* bị chặn */ }
  if (gia) return null;
  // Lúc rời trang: fetch keepalive thẳng tới RPC (supabase-js không gửi được khi trang đang đóng)
  const goiRpcGiu = (ham, thamSo) => fetch(window.KC_CONFIG_SUPABASE_URL + "/rest/v1/rpc/" + ham, {
    method: "POST", keepalive: true, body: JSON.stringify(thamSo),
    headers: { "Content-Type": "application/json", apikey: window.KC_CONFIG_SUPABASE_ANON_KEY }
  }).then(r => r.json()).catch(() => null);
  return window.KC_DT_MAY_CHU_SB.taoMayChuSupabase({ goiRpc: window.kcGoiRpc, goiRpcGiu, ten: phien && phien.tenDangNhap, maPhien: phien && phien.maPhien, vung: banDo, cauHinh });
}
const be = GAME ? docBeDangNhap() : docHoSoBe();
if (!be) { location.replace("dautruongtrithuc.html"); await new Promise(() => {}); } // chưa đăng nhập / chưa tạo Thủ lĩnh: về sảnh

// ---------------- Tải ----------------
const tienTai = {};
function baoTai(ten, da, tong) {
  tienTai[ten] = [da, tong];
  let a = 0, b = 0; for (const k in tienTai) { a += tienTai[k][0]; b += tienTai[k][1]; }
  chuTai.textContent = "Đang dựng thung lũng… " + Math.round(100 * a / Math.max(b, 1)) + "%";
}
const [banDo, cauHinh, glbLang, glbNv] = await Promise.all([
  fetch(duongDan(VUNG ? "../du_lieu/vung_dat.json" : "../du_lieu/lang_thu_3d.json"), { cache: "no-cache" }).then(r => r.json()),
  fetch(duongDan("../du_lieu/cau_hinh.json"), { cache: "no-cache" }).then(r => r.json()),
  taiGlb(duongDan("../mo_hinh/lang.glb"), baoTai),
  taiGlb(duongDan("../mo_hinh/nhan_vat.glb"), baoTai)
]).catch(e => { chuTai.textContent = "Chưa tải được thung lũng. Con kiểm tra mạng rồi tải lại trang nhé!"; throw e; });
let soByte = 0; for (const k in tienTai) soByte += tienTai[k][1];

// ---------------- Lõi + các phần vẽ ----------------
const doHoa = docDoHoa(), NHE = doHoa === "nhe";
const lang = LANG.taoLang({ banDo, cauHinh, chungLoai: be.hoSo.chungLoai });
const CH = lang.CH;
const vungVe = $("d3Canh");
const ctx = taoCanh(vungVe, { nhe: NHE });
ctx.moiKhung(dt => lang.capNhat(dt)); // lõi chạy trước, các phần vẽ theo sau
const moHinh = taoBoMoHinh(ctx, glbLang);
const cam = taoCamera(ctx, vungVe, banDo);
const diaHinh = taoDiaHinh(ctx, moHinh, banDo, lang);
taoCongTrinh(ctx, moHinh, diaHinh, banDo, cam.huong, lang);
const taiNguyen = taoTaiNguyen(ctx, moHinh, diaHinh, lang);
const boNv = taoBoNhanVat(ctx, glbNv, moHinh, diaHinh, NV, { nhipLam: loai => CH.nguon[loai].nhipLam });
ctx.moiKhung(dt => boNv.capNhat(dt));
const goiY = $("d3GoiY");
const baoGoiY = chu => { goiY.textContent = chu; };
const uiDk = { baoGoiY, baoChon: chu => { $("d3Chon").textContent = chu; }, lop: $("d3ChuNoi") };
const dk = taoDieuKhien(ctx, cam, lang, taiNguyen, boNv, diaHinh, uiDk);

let soNongDan = 0;
function themNongDan(x, z) {
  const i = soNongDan++;
  const dv = lang.themDonVi("nong_dan", x, z, "Nông dân " + (i + 1));
  boNv.tao(dv, "nong_dan", NV.hoSoNongDan(lang.chungLoai, i));
  $("d3SoNd").textContent = soNongDan;
  return dv;
}

// Thủ lĩnh + nông dân: làng mẫu đặt sẵn; thung lũng thật lấy từ máy chủ (dt3d_vung.js)
let hoSoTl = be.hoSo, dvTl, hTl, vung = null;
if (VUNG) {
  let kho = null; try { localStorage.setItem("kc_dt_thu", "1"); kho = localStorage; } catch (e) { /* bị chặn: giữ trong bộ nhớ */ }
  const mayChu = GAME ? taoMayChuThat() : null; // trang thử ?vung: máy chủ giả trên máy
  try {
    vung = await vaoThungLung({ ctx, cam, lang, banDo, cauHinh, diaHinh, boNv, dk, uiDk, be: { ...be, ten: be.ten || "khach" }, themNongDan, $, baoGoiY, kho, mayChu });
  } catch (e) { chuTai.textContent = e.lyDo || "Chưa vào được thung lũng. Con tải lại trang nhé!"; throw e; }
  dvTl = vung.dvTl; hTl = vung.hTl;
} else {
  dvTl = lang.themDonVi("thu_linh", banDo.batDau.thuLinh.x, banDo.batDau.thuLinh.z, be.tenThuLinh || "Thủ lĩnh");
  hTl = boNv.tao(dvTl, "thu_linh", hoSoTl);
  for (const p of banDo.batDau.nongDan || []) themNongDan(p.x, p.z);
}
$("d3TenVuong").textContent = be.tenVuongQuoc ? "Vương quốc " + be.tenVuongQuoc : VUNG ? banDo.ten + " · Cổng " + vung.vao.cong.so : "Thung Lũng Khởi Đầu";

// ---------------- Thanh tài nguyên ----------------
const O_KHO = { go: "d3Go", da: "d3Da", vang: "d3Vang", luong_thuc: "d3Lt" };
function capNhatKho() { for (const k in O_KHO) $(O_KHO[k]).textContent = lang.kho[k]; }
lang.nghe(su => { if (su.loai === "cat") capNhatKho(); });

// ---------------- Nút ----------------
$("d3DoHoa").innerHTML = NHE ? "🪶<span class=\"d3Chu\"> Đồ họa:</span> Nhẹ" : "✨<span class=\"d3Chu\"> Đồ họa:</span> Đẹp";
$("d3DoHoa").addEventListener("click", () => { luuDoHoa(NHE ? "dep" : "nhe"); location.reload(); });
if (GAME) {
  for (const id of ["d3DoiHinh", "d3ThuTran", "d3Tua", "d3ThemNd", "d3LamLai"]) $(id).hidden = true; // nút thử: chỉ trang thử
} else if (VUNG) {
  $("d3Tua").hidden = $("d3ThemNd").hidden = true;
  $("d3LamLai").hidden = false;
  $("d3LamLai").addEventListener("click", async () => {
    if (!confirm("Xoá lều, nông dân, chỗ đã khám phá và vào lại thung lũng từ đầu?")) return;
    await vung.mayChu.xoaHet(); location.reload();
  });
} else $("d3VeLang").addEventListener("click", () => cam.nhinVe(banDo.leu.x, banDo.leu.z + 2));
const VIEC_LAN_LUOT = ["cay", "cay", "mo_da", "mo_vang", "bai_ca", "bui_trai_cay"];
$("d3ThemNd").addEventListener("click", () => {
  if (soNongDan >= 40) { baoGoiY("Thử tối đa 40 nông dân thôi."); return; }
  const dv = themNongDan(banDo.leu.x + 1, banDo.leu.z + 2);
  const n = lang.nguonGanNhat(VIEC_LAN_LUOT[soNongDan % VIEC_LAN_LUOT.length], dv.x, dv.z, 60);
  if (n) lang.giaoViec(dv, n);
});
$("d3Tua").addEventListener("click", () => {
  lang.tuaNhanh(3 * LANG.GIO_MS);
  taiNguyen.veLaiMam();
  const g = Math.round(lang.lechGio / LANG.GIO_MS), ng = CH.nguon;
  baoGoiY("⏩ Đã tua thêm 3 giờ (tổng " + g + " giờ). Mầm cây lớn sau " + ng.cay.mocLaiGio + " giờ, bãi cá mới sau " + ng.bai_ca.mocLaiGio +
    " giờ, bụi trái cây " + ng.bui_trai_cay.mocLaiGio + " giờ, mỏ mới sau " + ng.mo_da.mocLaiGio + " giờ.");
});
const TEN_CL = { nhan: "Nhân tộc", quy: "Quỷ tộc", tien: "Tiên tộc" };
$("d3DoiHinh").addEventListener("click", () => {
  // Thử ngoại hình: đổi lần lượt chủng loại / giới / màu (chỉ trong trang thử, không lưu)
  const h = { ...hoSoTl }, thuTu = ["nhan", "quy", "tien"], k = (thuTu.indexOf(h.chungLoai) + 1) % 3;
  h.chungLoai = thuTu[k]; if (k === 0) h.gioi = h.gioi === "nam" ? "nu" : "nam";
  h.mauAo = (h.mauAo + 1) % NV.BANG.ao.length; h.mauToc = (h.mauToc + 2) % NV.BANG.toc.length; h.mauDa = (h.mauDa + 1) % NV.BANG.da.length;
  hoSoTl = NV.chuanHoa(h);
  const dangChonTl = dk.dangChon() === hTl, huong = hTl.huong;
  boNv.xoa(hTl); hTl = boNv.tao(dvTl, "thu_linh", hoSoTl); hTl.huong = huong;
  if (dangChonTl) dk.chon(hTl);
  lang.datChungLoai(hoSoTl.chungLoai);
  baoGoiY("Thử ngoại hình: " + TEN_CL[hoSoTl.chungLoai] + ", " + (hoSoTl.gioi === "nu" ? "bé gái" : "bé trai") + ". " +
    (VUNG ? (hoSoTl.chungLoai === "tien" ? "Tiên tộc nhìn xa hơn 1 ô." : "Thủ lĩnh nhìn xa " + BD.tamNhin(cauHinh.banDo, "thu_linh", hoSoTl.chungLoai) + " ô.")
      : "Nông dân " + TEN_CL[hoSoTl.chungLoai] + " mang mỗi chuyến " + lang.sucMang() + "."));
});
// Động tác chia 2 gói theo bối cảnh: gói BẢN ĐỒ 8 động tác đi kèm nhân vật; gói TRẬN ĐẤU
// (33 động tác) chỉ tải khi vào trận. Không có động tác "chết" (phi bạo lực).
const TEN_DONG_TAC = { "1H_Melee_Attack_Slice_Diagonal": "Chém chéo", "Spellcast_Shoot": "Phóng phép", "Block_Hit": "Đỡ đòn",
  "Dodge_Right": "Né sang phải", "2H_Melee_Attack_Spin": "Xoay vòng", "Hit_A": "Trúng đòn", "1H_Ranged_Shoot": "Bắn", "Cheer": "Reo mừng chiến thắng" };
let goiTran = null;
$("d3ThuTran").addEventListener("click", async () => {
  if (hTl.dien) return;
  baoGoiY("Đang tải gói động tác trận…");
  try { goiTran = goiTran || (await taiGlb(duongDan("../mo_hinh/dong_tac_tran.glb"))).animations; } catch (e) { baoGoiY("Chưa tải được gói động tác trận."); return; }
  boNv.themDongTac(goiTran);
  dvTl.duong.length = 0;
  boNv.dien(hTl, Object.keys(TEN_DONG_TAC), ten => baoGoiY("⚔️ " + (TEN_DONG_TAC[ten] || ten)),
    () => baoGoiY("Gói động tác trận có " + Object.keys(hTl.dt).length + " động tác; trận đấu thật sẽ chọn theo đúng / sai của câu trả lời."));
});

// ---------------- Đo + móc cho kịch bản thử ----------------
const fpsEl = $("d3Fps");
let chamLien = 0;
const gocNguon = () => (lang.leu ? { x: lang.leu.x, z: lang.leu.z } : { x: dvTl.x, z: dvTl.z });
window.__dt3d = { fps: 0, lenhVe: 0, tamGiac: 0, taiMs: 0, soByte, doHoa, soNongDan: () => soNongDan, kho: lang.kho, chon: () => dk.dangChon() && dk.dangChon().dv.ten,
  chamDiem: (x, z) => cam.chieu(x, diaHinh.doCaoDi(x, z) + 0.5, z),
  chamNguon: (x, z, y) => cam.chieu(x, diaHinh.doCao(x, z) + (y || 0.5), z),
  tenThuLinh: () => dvTl.ten,
  viTri: ten => { const d = lang.donVi.find(v => v.ten === ten); return d && { x: d.x, z: d.z, viec: d === dvTl && hTl.dien ? "dien" : d.trangThai, mang: d.mang.so, loai: d.mang.loai, ranh: d.ranh, nguon: d.viec && d.viec.loai }; },
  nguonGan: loai => { const g = gocNguon(), n = lang.nguonGanNhat(loai, g.x, g.z, 99); return n && { x: n.x, z: n.z, id: n.id, con: n.con }; },
  demNguon: (loai, trangThai) => lang.nguon.filter(n => n.loai === loai && (!trangThai || n.trangThai === trangThai)).length,
  lechGio: () => lang.lechGio / LANG.GIO_MS,
  nhinVe: (x, z) => cam.nhinVe(x, z),
  zoom: z => cam.datZoom(z),
  lang, // kịch bản thử đọc / chỉnh trạng thái lõi (vd làm cạn nhanh một cây)
  vung: vung && vung.moc // thung lũng thật
};
ctx.khiDo(so => {
  Object.assign(window.__dt3d, so);
  fpsEl.textContent = so.fps + " khung/giây";
  if (!NHE && so.fps < 24) { if (++chamLien === 4) baoGoiY("Máy hơi chậm: bấm nút ✨ để chuyển đồ họa sang Nhẹ nhé."); } else chamLien = 0;
});

capNhatKho();
const ndThem = VUNG ? 0 : Number(new URLSearchParams(location.search).get("nd")) || 0; // thử nhiều nông dân: ?nd=20
for (let i = 0; i < Math.min(ndThem, 39); i++) $("d3ThemNd").click();
if (vung) vung.veSuong.quet(); // áp sương mù cho mọi vật liệu trước khung đầu (khỏi dịch shader hai lần)
ctx.batDau(cam.camera);
window.__dt3d.taiMs = Math.round(performance.now() - t0);
$("d3Tai").hidden = true;
if (vung) vung.batDau();
else baoGoiY("Chạm vào nông dân 🧑‍🌾 rồi chạm cây, mỏ, bãi cá hoặc bụi trái cây để giao việc. Kéo để xem quanh làng, chụm hai ngón (hoặc lăn chuột) để phóng to.");
// 27/10/2026 18:55 - BƯỚC: TC_D02B3a
