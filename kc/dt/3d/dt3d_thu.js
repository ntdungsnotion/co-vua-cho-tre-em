// ================================================================
// FILE: dt/3d/dt3d_thu.js  (ES module) - KHỞI ĐỘNG TRANG THỬ LÀNG 3D (kc/dt_thu_3d.html)
// CHỨC NĂNG: Tải dữ liệu + mô hình, dựng LÕI làng (dt_lang.js) rồi nối các PHẦN VẼ:
//            canh -> camera -> địa hình -> công trình -> tài nguyên -> nhân vật -> điều khiển.
//            Thanh tài nguyên, các nút thử (đồ họa, về lều, ngoại hình, động tác trận, thêm
//            nông dân, tua giờ), móc cho kịch bản thử Chrome (window.__dt3d).
//            Không cần đăng nhập: ngoại hình Thủ lĩnh đọc hồ sơ chung có sẵn trên máy.
//            HAI CHẾ ĐỘ:
//            - mặc định: làng mẫu 44 x 44 (lang_thu_3d.json) có lều, nông dân, tua giờ
//            - ?vung (TC_D02B2a): THUNG LŨNG KHỞI ĐẦU 128 x 128 (vung_dat.json) phủ sương mù 3
//              mức; vào qua lớp máy chủ (dt_may_chu.js, bản giả localStorage): Thủ lĩnh đứng ở
//              cổng thung lũng, bé chạm đất cho Thủ lĩnh đi khám phá, chỗ đã khám phá + chỗ
//              Thủ lĩnh đứng còn nguyên khi tải lại trang; nút "🔍 Soi đất" tô xanh / đỏ chỗ
//              dựng được Lều trại 2 x 2 (chưa dựng: TC_D02B2b)
// BƯỚC: TC_D02A (thay dt/dt_lang_3d.js của TC_D01C); TC_D02B2a (chế độ ?vung)
// NGÀY: 23/10/2026; 26/10/2026
// PHỤ THUỘC: chung/nv_ve.js (KC_NV), dt/dt_luoi.js, dt/dt_lang.js (KC_DT_LANG), các phần dt/3d/*.js;
//            chế độ ?vung thêm dt/dt_ban_do.js (KC_DT_BAN_DO), dt/dt_may_chu.js (KC_DT_MAY_CHU)
// ================================================================
import { taoCanh, docDoHoa, luuDoHoa } from "./dt3d_canh.js";
import { taoCamera } from "./dt3d_camera.js";
import { taiGlb, taoBoMoHinh } from "./dt3d_mo_hinh.js";
import { taoDiaHinh } from "./dt3d_dia_hinh.js";
import { taoCongTrinh } from "./dt3d_cong_trinh.js";
import { taoTaiNguyen } from "./dt3d_tai_nguyen.js";
import { taoBoNhanVat } from "./dt3d_nhan_vat.js";
import { taoDieuKhien } from "./dt3d_dieu_khien.js";
import { taoVeSuong } from "./dt3d_suong_mu.js";
import { taoSoiDat } from "./dt3d_o_xay.js";

const NV = window.KC_NV, LANG = window.KC_DT_LANG, BD = window.KC_DT_BAN_DO, MC = window.KC_DT_MAY_CHU;
const $ = id => document.getElementById(id);
const t0 = performance.now();
const duongDan = p => new URL(p, import.meta.url).href;
const VUNG = new URLSearchParams(location.search).has("vung");

// ---------------- Tải ----------------
const chuTai = $("d3TaiChu"), tienTai = {};
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

// Hồ sơ ngoại hình chung của bé (TC_D01): hồ sơ đầu tiên tìm thấy trên máy này
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

// ---------------- Thung lũng thật: vào qua máy chủ (chế độ ?vung) ----------------
// Bản giả lưu trên máy này; TC_D02B3 đổi sang Supabase cùng giao diện (dt_may_chu.js)
const tenBe = be.ten || "khach";
let mayChu = null, vao = null, suong = null, veSuong = null;
if (VUNG) {
  let kho = null; try { localStorage.setItem("kc_dt_thu", "1"); kho = localStorage; } catch (e) { /* bị chặn: giữ trong bộ nhớ */ }
  mayChu = MC.taoMayChuGia({ vung: banDo, cauHinh, kho });
  vao = await mayChu.vaoVung(tenBe, be.hoSo.chungLoai);
  if (!vao.ok) { chuTai.textContent = vao.lyDo; throw new Error(vao.lyDo); }
  suong = BD.taoSuongMu(banDo.rong, banDo.cao);
  suong.nap(vao.khamPha);
  veSuong = taoVeSuong(ctx, suong);
}

// Thủ lĩnh: bản mẫu đứng cạnh lều; thung lũng thật đứng ở cổng (lần đầu) hoặc ở chỗ tính từ lệnh cuối
const dvMayChu = vao && vao.donVi.find(d => d.loai === "thu_linh");
let viTriDau = VUNG ? { x: dvMayChu.x, z: dvMayChu.z, xong: true } : banDo.batDau.thuLinh;
if (VUNG && dvMayChu.lenh) viTriDau = BD.viTriTuLenh(lang, dvMayChu.lenh, mayChu.gio());
const dvTl = lang.themDonVi("thu_linh", viTriDau.x, viTriDau.z, be.tenThuLinh || "Thủ lĩnh");
let hoSoTl = be.hoSo, hTl = boNv.tao(dvTl, "thu_linh", hoSoTl);
let soNongDan = 0;
function themNongDan(x, z) {
  const i = soNongDan++;
  const dv = lang.themDonVi("nong_dan", x, z, "Nông dân " + (i + 1));
  boNv.tao(dv, "nong_dan", NV.hoSoNongDan(lang.chungLoai, i));
  return dv;
}
for (const p of (banDo.batDau && banDo.batDau.nongDan) || []) themNongDan(p.x, p.z);
$("d3TenVuong").textContent = be.tenVuongQuoc ? "Vương quốc " + be.tenVuongQuoc : VUNG ? banDo.ten + " · Cổng " + vao.cong.so : "Thung Lũng Khởi Đầu";

if (VUNG) {
  // Lệnh đi của Thủ lĩnh -> máy chủ (lưu "lệnh", không lưu từng bước: dac_ta_ban_do.md mục 7)
  lang.nghe(su => {
    if (su.loai !== "lenh_di" || su.dv !== dvTl) return;
    mayChu.guiLenh(tenBe, dvMayChu.id, { tu: [su.tu.x, su.tu.z], den: [su.den.x, su.den.y] });
  });
  if (!viTriDau.xong) lang.lenhDi(dvTl, { x: dvMayChu.lenh.den[0], y: dvMayChu.lenh.den[1] }); // đang đi dở thì đi tiếp
  // Sương mù: soi lại 5 lần / giây theo mọi đơn vị của bé
  const CB = cauHinh.banDo, tongO = banDo.rong * banDo.cao, chuPt = $("d3KhamPha");
  let demSoi = 0, daLuu = -1, demLuu = 0, ptCu = -1;
  const soiLai = () => {
    if (suong.soi(lang.donVi.map(d => ({ x: d.x, z: d.z, r: BD.tamNhin(CB, d.vaiTro, lang.chungLoai) })))) veSuong.capNhat();
    const pt = Math.round(1000 * suong.demDaKham() / tongO) / 10;
    if (pt !== ptCu) { ptCu = pt; chuPt.textContent = "🗺️ Đã khám phá " + pt.toLocaleString("vi-VN") + "%"; }
  };
  const luuKhamPha = () => {
    if (suong.phienBan === daLuu) return;
    daLuu = suong.phienBan;
    mayChu.luuKhamPha(tenBe, suong.xuat());
  };
  ctx.moiKhung(dt => {
    if ((demSoi += dt) >= 0.2) { demSoi = 0; soiLai(); }
    if ((demLuu += dt) >= CB.chuKyLuuKhamPha) { demLuu = 0; luuKhamPha(); }
  });
  addEventListener("pagehide", luuKhamPha);
  document.addEventListener("visibilitychange", () => { if (document.hidden) luuKhamPha(); });
  soiLai();
  chuPt.hidden = false;
}

// ---------------- Thanh tài nguyên ----------------
const O_KHO = { go: "d3Go", da: "d3Da", vang: "d3Vang", luong_thuc: "d3Lt" };
function capNhatKho() { for (const k in O_KHO) $(O_KHO[k]).textContent = lang.kho[k]; }
lang.nghe(su => { if (su.loai === "cat") capNhatKho(); });

// ---------------- Nút ----------------
$("d3DoHoa").innerHTML = NHE ? "🪶<span class=\"d3Chu\"> Đồ họa:</span> Nhẹ" : "✨<span class=\"d3Chu\"> Đồ họa:</span> Đẹp";
$("d3DoHoa").addEventListener("click", () => { luuDoHoa(NHE ? "dep" : "nhe"); location.reload(); });
if (VUNG) {
  // Thung lũng chưa có lều, chưa có nông dân (TC_D02B2b): "Về lều" thành "Về Thủ lĩnh"
  $("d3VeLang").innerHTML = "👑<span class=\"d3Chu\"> Về Thủ lĩnh</span>";
  $("d3VeLang").setAttribute("aria-label", "Về chỗ Thủ lĩnh");
  $("d3VeLang").addEventListener("click", () => cam.nhinVe(dvTl.x, dvTl.z));
  $("d3Tua").hidden = $("d3ThemNd").hidden = true;
  $("d3SoiDat").hidden = $("d3LamLai").hidden = false;
} else $("d3VeLang").addEventListener("click", () => cam.nhinVe(banDo.leu.x, banDo.leu.z + 2));
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
// Soi đất (chỉ thung lũng thật): chạm / rê chuột -> tô móng Lều trại 2 x 2 xanh (dựng được) / đỏ (không)
let soiDat = null, dangSoi = false;
if (VUNG) {
  soiDat = taoSoiDat(ctx, diaHinh, (x, y, r, s) => BD.oXayDuocVung({ lang, suong }, x, y, r, s));
  const datNutSoi = () => {
    $("d3SoiDat").innerHTML = dangSoi ? "✋<span class=\"d3Chu\"> Thôi soi</span>" : "🔍<span class=\"d3Chu\"> Soi đất</span>";
    $("d3SoiDat").setAttribute("aria-pressed", String(dangSoi));
  };
  $("d3SoiDat").addEventListener("click", () => {
    dangSoi = !dangSoi; datNutSoi();
    if (!dangSoi) { soiDat.an(); dk.datCheDoCham(null); baoGoiY("Chạm mặt đất để Thủ lĩnh đi khám phá tiếp nhé."); return; }
    baoGoiY("🔍 Chạm vào mặt đất: ô xanh là dựng được Lều trại, ô đỏ là chưa được.");
    dk.datCheDoCham((o, kieu) => {
      const kq = soiDat.hien(o.x, o.y, 2, 2);
      if (kieu === "cham") baoGoiY(kq.duoc ? "✅ Chỗ này dựng được Lều trại!" : "❌ " + kq.lyDo);
    });
  });
  $("d3LamLai").addEventListener("click", async () => {
    if (!confirm("Xoá chỗ đã khám phá và vào lại thung lũng từ đầu?")) return;
    await mayChu.xoaHet(); location.reload();
  });
}
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
const gocNguon = () => (banDo.leu ? { x: banDo.leu.x, z: banDo.leu.z } : { x: dvTl.x, z: dvTl.z });
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
  // Thung lũng thật (?vung)
  vung: VUNG && {
    cong: vao.cong, lanDau: vao.lanDau, mayChu,
    muc: (x, z) => suong.muc(Math.floor(x), Math.floor(z)), demDaKham: () => suong.demDaKham(),
    soiDat: (x, y) => BD.oXayDuocVung({ lang, suong }, x, y, 2, 2),
    dangSoi: () => dangSoi
  }
};
ctx.khiDo(so => {
  Object.assign(window.__dt3d, so);
  fpsEl.textContent = so.fps + " khung/giây";
  if (!NHE && so.fps < 24) { if (++chamLien === 4) baoGoiY("Máy hơi chậm: bấm nút ✨ để chuyển đồ họa sang Nhẹ nhé."); } else chamLien = 0;
});

capNhatKho();
const ndThem = VUNG ? 0 : Number(new URLSearchParams(location.search).get("nd")) || 0; // thử nhiều nông dân: ?nd=20
for (let i = 0; i < Math.min(ndThem, 39); i++) $("d3ThemNd").click();
$("d3SoNd").textContent = soNongDan;
if (veSuong) veSuong.quet(); // áp sương mù cho mọi vật liệu trước khung đầu (khỏi dịch shader hai lần)
ctx.batDau(cam.camera);
window.__dt3d.taiMs = Math.round(performance.now() - t0);
$("d3Tai").hidden = true;
if (VUNG) {
  cam.nhinVe(dvTl.x, dvTl.z);
  dk.chon(hTl);
  baoGoiY(vao.lanDau
    ? "Chào mừng tới " + banDo.ten + "! Sương mù còn che kín nơi chưa ai tới. Chạm mặt đất để Thủ lĩnh 👑 đi khám phá nhé."
    : "Chào mừng con quay lại! Chỗ đã khám phá vẫn còn đó. Chạm mặt đất để Thủ lĩnh 👑 đi tiếp nhé.");
} else baoGoiY("Chạm vào nông dân 🧑‍🌾 rồi chạm cây, mỏ, bãi cá hoặc bụi trái cây để giao việc. Kéo để xem quanh làng, chụm hai ngón (hoặc lăn chuột) để phóng to.");
// 26/10/2026 22:05 - BƯỚC: TC_D02B2a
