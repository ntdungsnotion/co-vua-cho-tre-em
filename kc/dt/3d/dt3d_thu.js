// ================================================================
// FILE: dt/3d/dt3d_thu.js  (ES module) - KHỞI ĐỘNG TRANG THỬ LÀNG 3D (kc/dt_thu_3d.html)
// CHỨC NĂNG: Tải dữ liệu + mô hình, dựng LÕI làng (dt_lang.js) rồi nối các PHẦN VẼ:
//            canh -> camera -> địa hình -> công trình -> tài nguyên -> nhân vật -> điều khiển.
//            Thanh tài nguyên, các nút thử (đồ họa, về lều, ngoại hình, động tác trận, thêm
//            nông dân, tua giờ), móc cho kịch bản thử Chrome (window.__dt3d).
//            Không cần đăng nhập: ngoại hình Thủ lĩnh đọc hồ sơ chung có sẵn trên máy.
// BƯỚC: TC_D02A (thay dt/dt_lang_3d.js của TC_D01C)
// NGÀY: 23/10/2026
// PHỤ THUỘC: chung/nv_ve.js (KC_NV), dt/dt_luoi.js, dt/dt_lang.js (KC_DT_LANG), các phần dt/3d/*.js
// ================================================================
import { taoCanh, docDoHoa, luuDoHoa } from "./dt3d_canh.js";
import { taoCamera } from "./dt3d_camera.js";
import { taiGlb, taoBoMoHinh } from "./dt3d_mo_hinh.js";
import { taoDiaHinh } from "./dt3d_dia_hinh.js";
import { taoCongTrinh } from "./dt3d_cong_trinh.js";
import { taoTaiNguyen } from "./dt3d_tai_nguyen.js";
import { taoBoNhanVat } from "./dt3d_nhan_vat.js";
import { taoDieuKhien } from "./dt3d_dieu_khien.js";

const NV = window.KC_NV, LANG = window.KC_DT_LANG;
const $ = id => document.getElementById(id);
const t0 = performance.now();
const duongDan = p => new URL(p, import.meta.url).href;

// ---------------- Tải ----------------
const chuTai = $("d3TaiChu"), tienTai = {};
function baoTai(ten, da, tong) {
  tienTai[ten] = [da, tong];
  let a = 0, b = 0; for (const k in tienTai) { a += tienTai[k][0]; b += tienTai[k][1]; }
  chuTai.textContent = "Đang dựng thung lũng… " + Math.round(100 * a / Math.max(b, 1)) + "%";
}
const [banDo, cauHinh, glbLang, glbNv] = await Promise.all([
  fetch(duongDan("../du_lieu/lang_thu_3d.json"), { cache: "no-cache" }).then(r => r.json()),
  fetch(duongDan("../du_lieu/cau_hinh.json"), { cache: "no-cache" }).then(r => r.json()),
  taiGlb(duongDan("../mo_hinh/lang.glb"), baoTai),
  taiGlb(duongDan("../mo_hinh/nhan_vat.glb"), baoTai)
]).catch(e => { chuTai.textContent = "Chưa tải được thung lũng. Con kiểm tra mạng rồi tải lại trang nhé!"; throw e; });
let soByte = 0; for (const k in tienTai) soByte += tienTai[k][1];

// Hồ sơ ngoại hình chung của bé (TC_D01): hồ sơ đầu tiên tìm thấy trên máy này
function docHoSoBe() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("kc_nhan_vat_")) {
        const ten = k.slice("kc_nhan_vat_".length);
        const td = JSON.parse(localStorage.getItem("kc_dt_tien_do_" + ten) || "null");
        return { hoSo: NV.chuanHoa(JSON.parse(localStorage.getItem(k))), tenThuLinh: td && td.tenThuLinh, tenVuongQuoc: td && td.tenVuongQuoc };
      }
    }
  } catch (e) { /* bộ nhớ bị chặn: dùng hình mẫu */ }
  return { hoSo: NV.chuanHoa({ chungLoai: "nhan", gioi: "nam", mauDa: 1, mauToc: 1, mauAo: 3 }), tenThuLinh: null, tenVuongQuoc: null };
}
const be = docHoSoBe();

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
taoCongTrinh(ctx, moHinh, diaHinh, banDo, cam.huong);
const taiNguyen = taoTaiNguyen(ctx, moHinh, diaHinh, lang);
const boNv = taoBoNhanVat(ctx, glbNv, moHinh, diaHinh, NV, { nhipLam: loai => CH.nguon[loai].nhipLam });
ctx.moiKhung(dt => boNv.capNhat(dt));
const goiY = $("d3GoiY");
const baoGoiY = chu => { goiY.textContent = chu; };
const dk = taoDieuKhien(ctx, cam, lang, taiNguyen, boNv, diaHinh, { baoGoiY, baoChon: chu => { $("d3Chon").textContent = chu; }, lop: $("d3ChuNoi") });

const dvTl = lang.themDonVi("thu_linh", banDo.batDau.thuLinh.x, banDo.batDau.thuLinh.z, be.tenThuLinh || "Thủ lĩnh");
let hoSoTl = be.hoSo, hTl = boNv.tao(dvTl, "thu_linh", hoSoTl);
let soNongDan = 0;
function themNongDan(x, z) {
  const i = soNongDan++;
  const dv = lang.themDonVi("nong_dan", x, z, "Nông dân " + (i + 1));
  boNv.tao(dv, "nong_dan", NV.hoSoNongDan(lang.chungLoai, i));
  return dv;
}
for (const p of banDo.batDau.nongDan) themNongDan(p.x, p.z);
$("d3TenVuong").textContent = be.tenVuongQuoc ? "Vương quốc " + be.tenVuongQuoc : "Thung Lũng Khởi Đầu";

// ---------------- Thanh tài nguyên ----------------
const O_KHO = { go: "d3Go", da: "d3Da", vang: "d3Vang", luong_thuc: "d3Lt" };
function capNhatKho() { for (const k in O_KHO) $(O_KHO[k]).textContent = lang.kho[k]; }
lang.nghe(su => { if (su.loai === "cat") capNhatKho(); });

// ---------------- Nút ----------------
$("d3DoHoa").innerHTML = NHE ? "🪶<span class=\"d3Chu\"> Đồ họa:</span> Nhẹ" : "✨<span class=\"d3Chu\"> Đồ họa:</span> Đẹp";
$("d3DoHoa").addEventListener("click", () => { luuDoHoa(NHE ? "dep" : "nhe"); location.reload(); });
$("d3VeLang").addEventListener("click", () => cam.nhinVe(banDo.leu.x, banDo.leu.z + 2));
const VIEC_LAN_LUOT = ["cay", "cay", "mo_da", "mo_vang", "bai_ca", "bui_trai_cay"];
$("d3ThemNd").addEventListener("click", () => {
  if (soNongDan >= 40) { baoGoiY("Thử tối đa 40 nông dân thôi."); return; }
  const dv = themNongDan(banDo.leu.x + 1, banDo.leu.z + 2);
  const n = lang.nguonGanNhat(VIEC_LAN_LUOT[soNongDan % VIEC_LAN_LUOT.length], dv.x, dv.z, 60);
  if (n) lang.giaoViec(dv, n);
  $("d3SoNd").textContent = soNongDan;
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
  baoGoiY("Thử ngoại hình: " + TEN_CL[hoSoTl.chungLoai] + ", " + (hoSoTl.gioi === "nu" ? "bé gái" : "bé trai") + ". Nông dân " + TEN_CL[hoSoTl.chungLoai] + " mang mỗi chuyến " + lang.sucMang() + ".");
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
window.__dt3d = { fps: 0, lenhVe: 0, tamGiac: 0, taiMs: 0, soByte, doHoa, soNongDan: () => soNongDan, kho: lang.kho, chon: () => dk.dangChon() && dk.dangChon().dv.ten,
  chamDiem: (x, z) => cam.chieu(x, diaHinh.doCaoDi(x, z) + 0.5, z),
  chamNguon: (x, z, y) => cam.chieu(x, diaHinh.doCao(x, z) + (y || 0.5), z),
  tenThuLinh: () => dvTl.ten,
  viTri: ten => { const d = lang.donVi.find(v => v.ten === ten); return d && { x: d.x, z: d.z, viec: d === dvTl && hTl.dien ? "dien" : d.trangThai, mang: d.mang.so, loai: d.mang.loai, ranh: d.ranh, nguon: d.viec && d.viec.loai }; },
  nguonGan: loai => { const n = lang.nguonGanNhat(loai, banDo.leu.x, banDo.leu.z, 99); return n && { x: n.x, z: n.z, id: n.id, con: n.con }; },
  demNguon: (loai, trangThai) => lang.nguon.filter(n => n.loai === loai && (!trangThai || n.trangThai === trangThai)).length,
  lechGio: () => lang.lechGio / LANG.GIO_MS,
  nhinVe: (x, z) => cam.nhinVe(x, z),
  lang // kịch bản thử đọc / chỉnh trạng thái lõi (vd làm cạn nhanh một cây)
};
ctx.khiDo(so => {
  Object.assign(window.__dt3d, so);
  fpsEl.textContent = so.fps + " khung/giây";
  if (!NHE && so.fps < 24) { if (++chamLien === 4) baoGoiY("Máy hơi chậm: bấm nút ✨ để chuyển đồ họa sang Nhẹ nhé."); } else chamLien = 0;
});

capNhatKho();
const ndThem = Number(new URLSearchParams(location.search).get("nd")) || 0; // thử nhiều nông dân: ?nd=20
for (let i = 0; i < Math.min(ndThem, 39); i++) $("d3ThemNd").click();
$("d3SoNd").textContent = soNongDan;
ctx.batDau(cam.camera);
window.__dt3d.taiMs = Math.round(performance.now() - t0);
$("d3Tai").hidden = true;
baoGoiY("Chạm vào nông dân 🧑‍🌾 rồi chạm cây, mỏ, bãi cá hoặc bụi trái cây để giao việc. Kéo để xem quanh làng, chụm hai ngón (hoặc lăn chuột) để phóng to.");
// 23/10/2026 18:45 - BƯỚC: TC_D02A
