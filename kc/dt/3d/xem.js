// ================================================================
// FILE: dt/3d/xem.js  (ES module) - TRANG XEM THỬ TỪNG PHẦN 3D (dt/3d/xem.html)
// CHỨC NĂNG: Dựng riêng một phần vẽ trên bản đồ nhỏ, bày đủ mọi trạng thái của phần đó
//            để soi bằng mắt / chụp ảnh so trước - sau khi sửa đồ họa:
//            - tai_nguyen: 4 loài cây x 3 cỡ, mầm 0-75%, gốc, mỏ Đá / Vàng 3 cỡ + mỏ còn nửa,
//              bụi 3 cỡ + bụi còn 1/3, bãi cá 3 cỡ
//            - nhan_vat: Thủ lĩnh 3 chủng loại; nông dân mang gỗ / đá / vàng / cá / trái cây;
//              nông dân đang chặt / đào / bắt cá / hái
//            - cong_trinh: lều, lửa trại, ruộng, trang trí trên bản đồ thử
//            - dia_hinh: đất, suối, cầu, rừng viền của bản đồ thử
// BƯỚC: TC_D02A
// NGÀY: 23/10/2026
// ================================================================
import { taoCanh, docDoHoa } from "./dt3d_canh.js";
import { taoCamera } from "./dt3d_camera.js";
import { taiGlb, taoBoMoHinh } from "./dt3d_mo_hinh.js";
import { taoDiaHinh } from "./dt3d_dia_hinh.js";
import { taoCongTrinh } from "./dt3d_cong_trinh.js";
import { taoTaiNguyen } from "./dt3d_tai_nguyen.js";
import { taoBoNhanVat } from "./dt3d_nhan_vat.js";

const NV = window.KC_NV, LANG = window.KC_DT_LANG;
const $ = id => document.getElementById(id);
const duongDan = p => new URL(p, import.meta.url).href;
const phan = new URLSearchParams(location.search).get("phan") || "tai_nguyen";
$("xPhan").value = phan;
$("xPhan").addEventListener("change", e => { location.search = "?phan=" + e.target.value; });

const [cauHinh, banDoThu, glbLang, glbNv] = await Promise.all([
  fetch(duongDan("../du_lieu/cau_hinh.json"), { cache: "no-cache" }).then(r => r.json()),
  fetch(duongDan("../du_lieu/lang_thu_3d.json"), { cache: "no-cache" }).then(r => r.json()),
  taiGlb(duongDan("../mo_hinh/lang.glb")),
  phan === "nhan_vat" ? taiGlb(duongDan("../mo_hinh/nhan_vat.glb")) : null
]);
const ctx = taoCanh($("d3Canh"), { nhe: docDoHoa() === "nhe" });
const moHinh = taoBoMoHinh(ctx, glbLang);
const CO = ["nho", "vua", "to"];
// Bản đồ nhỏ: suối ngang ở mép dưới, lều ở xa (không vẽ) chỉ để lõi có chỗ cất
const banDoNho = them => Object.assign({ rong: 20, cao: 16, hatGiong: 5, suoi: { rong: 2.2, diem: [[-4, 14.2], [24, 14.2]] }, leu: { x: 40, z: 40, ti: 3 }, ruong: [], trangTri: [], batDau: {} }, them);
let banDo, lang, ghiChu = "", camX, camZ, zoom = 1;

if (phan === "tai_nguyen") {
  banDo = banDoNho({
    cay: [].concat(...[0, 1, 2, 3].map(g => CO.map((c, k) => ({ x: 1.5 + g * 2.5, z: 1.5 + k * 2.5, co: c, giong: g })))),
    moDa: CO.map((c, k) => ({ x: 11.5 + k * 2, z: 1.5, co: c })),
    moVang: CO.map((c, k) => ({ x: 11.5 + k * 2, z: 4.5, co: c })).concat([{ x: 17.5, z: 4.5, co: "to", con: 0.5 }]),
    buiTraiCay: CO.map((c, k) => ({ x: 11.5 + k * 2, z: 7.5, co: c })).concat([{ x: 17.5, z: 7.5, co: "to", con: 0.33 }]),
    baiCa: CO.map((c, k) => ({ x: 3 + k * 5, z: 13.5, co: c }))
  });
  lang = LANG.taoLang({ banDo, cauHinh, chungLoai: "nhan" });
  // Ép loài cây theo hàng, nguồn còn một phần, mầm ở 4 mức lớn, 3 gốc cây
  for (const n of lang.nguon) {
    const goc = [...banDo.cay, ...banDo.moVang, ...banDo.buiTraiCay].find(m => Math.floor(m.x) === n.o.x && Math.floor(m.z) === n.o.y);
    if (!goc) continue;
    if (goc.giong != null) n.giong = goc.giong;
    if (goc.con) n.con = Math.round(n.toiDa * goc.con);
  }
  const bay = lang.bayGio(), gioLon = cauHinh.lang.nguon.cay.mocLaiGio * LANG.GIO_MS;
  [0, 0.25, 0.5, 0.75].forEach((f, k) => {
    const n = { id: 9000 + k, loai: "cay", taiNguyen: "go", co: null, toiDa: 0, con: 0, o: { x: 1 + k * 2, y: 10 }, x: 1.5 + k * 2, z: 10.5, trangThai: "mam", giong: 0, lech: k / 4, lucTrong: bay - f * gioLon, lucLon: bay + (1 - f) * gioLon };
    lang.nguon.push(n);
  });
  CO.forEach((c, k) => lang.gocCay.push({ x: 9.5 + k * 1.5, z: 10.5, o: { x: 9 + k, y: 10 }, giong: k, co: c }));
  ghiChu = "Hàng trên trái: 4 loài cây (thông xanh, thông sẫm, tán tròn, lá vàng cam), mỗi cột nhỏ / vừa / to. Phải: mỏ Đá, mỏ Vàng (cột cuối còn 1/2), bụi trái cây (cột cuối còn 1/3). Giữa: mầm 0 / 25 / 50 / 75%, 3 gốc cây. Dưới: bãi cá nhỏ / vừa / to.";
  camX = 9; camZ = 7.5; zoom = 1.05;
} else if (phan === "nhan_vat") {
  banDo = banDoNho({ suoi: { rong: 2.2, diem: [[-30, -30], [-29, -30]] } });
  lang = LANG.taoLang({ banDo, cauHinh, chungLoai: "nhan" });
  ghiChu = "Hàng sau: Thủ lĩnh Nhân / Quỷ / Tiên. Hàng giữa: nông dân mang Gỗ (bó củi trên lưng), Đá, Vàng, cá, trái cây. Hàng trước: đang chặt cây, đào mỏ, bắt cá, hái quả.";
  camX = 8.5; camZ = 6.2; zoom = 1.75;
} else {
  banDo = banDoThu;
  lang = LANG.taoLang({ banDo, cauHinh, chungLoai: "nhan" });
  ghiChu = phan === "cong_trinh" ? "Lều da Đồ đá, lửa trại, 2 ruộng, đồ trang trí." : "Mặt đất, suối, cầu, rừng viền (không có cây chặt được, mỏ, nhân vật).";
  camX = phan === "cong_trinh" ? banDo.leu.x : banDo.rong / 2; camZ = phan === "cong_trinh" ? banDo.leu.z + 2 : banDo.cao / 2; zoom = phan === "cong_trinh" ? 1.6 : 0.6;
}

const cam = taoCamera(ctx, $("d3Canh"), banDo);
const diaHinh = taoDiaHinh(ctx, moHinh, phan === "dia_hinh" || phan === "cong_trinh" ? banDo : Object.assign({}, banDo, { vien: null }), lang);
if (phan === "cong_trinh") taoCongTrinh(ctx, moHinh, diaHinh, banDo, cam.huong);
if (phan === "tai_nguyen") taoTaiNguyen(ctx, moHinh, diaHinh, lang);
if (phan === "nhan_vat") {
  const boNv = taoBoNhanVat(ctx, glbNv, moHinh, diaHinh, NV, { nhipLam: loai => cauHinh.lang.nguon[loai].nhipLam });
  const huong = Math.atan2(cam.huong.x, cam.huong.z); // nhìn về phía camera
  const dv = (x, z, them) => Object.assign({ ten: "", x, z, huongMuon: huong, trangThai: "dung", duong: [], viec: null, mang: { loai: null, so: 0 }, chay: false, ranh: false }, them);
  ["nhan", "quy", "tien"].forEach((cl, k) => boNv.tao(dv(5 + k * 2, 5 - k * 0.0), "thu_linh", NV.chuanHoa({ chungLoai: cl, gioi: k === 1 ? "nu" : "nam", mauDa: k, mauToc: k + 1, mauAo: k + 2 })));
  const mang = [["go", "cay"], ["da", "mo_da"], ["vang", "mo_vang"], ["luong_thuc", "bai_ca"], ["luong_thuc", "bui_trai_cay"]];
  mang.forEach(([loai, nguon], k) => boNv.tao(dv(4 + k * 1.6, 7.5, { mang: { loai, so: 10 }, viec: { loai: nguon } }), "nong_dan", NV.hoSoNongDan("nhan", k)));
  ["cay", "mo_da", "bai_ca", "bui_trai_cay"].forEach((nguon, k) => boNv.tao(dv(4.8 + k * 1.8, 10, { trangThai: "lam", viec: { loai: nguon }, mang: { loai: nguon === "cay" ? "go" : null, so: nguon === "cay" ? 4 : 0 } }), "nong_dan", NV.hoSoNongDan(["nhan", "quy", "tien", "nhan"][k], k + 5)));
  boNv.tao(dv(12.4, 7.5, { huongMuon: huong + Math.PI, mang: { loai: "go", so: 10 } }), "nong_dan", NV.hoSoNongDan("nhan", 9)); // quay lưng: thấy bó củi
  ctx.moiKhung(dt => boNv.capNhat(dt));
}
cam.nhinVe(camX, camZ); cam.datZoom(zoom);
$("xGhiChu").textContent = ghiChu;
ctx.khiDo(so => { $("xFps").textContent = so.fps + " khung/giây · " + so.lenhVe + " lệnh vẽ"; window.__xem.fps = so.fps; });
window.__xem = { xong: true, fps: 0, phan };
ctx.batDau(cam.camera);
// 23/10/2026 19:00 - BƯỚC: TC_D02A
