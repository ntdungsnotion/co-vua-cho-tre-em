/* ================================================================
   FILE: san_tu/st_kiem_thu_node.js
   CHỨC NĂNG: KIỂM THỬ TỰ ĐỘNG phần lõi game Săn Từ (không cần trình duyệt).
              Chạy: node kc/san_tu/st_kiem_thu_node.js
              Mô phỏng hàng trăm lượt chơi với "người chơi máy" (luôn đúng, luôn sai,
              không bấm, bấm dồn dập, trả lời sát giờ...) và kiểm tra các tiêu chí
              nghiệm thu: thắng/thua, mạng, kim cương, đổi mạng, tạm dừng, chơi lại.
   BƯỚC: TC_00B
   NGÀY: 15/10/2026
   CẬP NHẬT: 15/10/2026 - kiểm thử kho từ lớn + sổ ghi nhớ từ (mục 10, 11).
   CẬP NHẬT: 15/10/2026 - TC_00D: chạy kiểm thử trên cả 7 màn; thêm mục 12 (màn khó dần,
             tiến độ màn / đường đua).
   ================================================================ */
"use strict";
require("./st_cau_hinh.js");
require("./st_tien_do.js");
require("./st_kho_tu.js");
require("./st_tu_vung.js");
require("./st_logic.js");
const ST = globalThis.ST;

let soLoi = 0, soKiem = 0;
function kiem(dk, moTa) { soKiem++; if (!dk) { soLoi++; console.log("  ✗ " + moTa); } }

// 7 màn của đường Rừng xanh, mỗi màn ghép một cấp từ khác nhau (cấp từ chỉ đổi từ vựng)
const MAN_THU = {};
for (let m = 1; m <= ST.SO_MAN; m++) {
  const man = ST.taoManChoi("rung", m, ST.THU_TU_DO_KHO[(m - 1) % 4]);
  MAN_THU[man.ma] = man;
}
const DS_MAN = Object.keys(MAN_THU);

// Chạy một lượt với "bộ não" quyết định khi nào bấm gì
function chay(maDoKho, hat, naoBo, tuyChon) {
  tuyChon = tuyChon || {};
  const rng = ST.taoNgauNhien(hat);
  const suKien = [];
  const g = new ST.TroChoi(MAN_THU[maDoKho] || maDoKho, { ngauNhien: rng, soTay: tuyChon.soTay, suKien: (t, d) => suKien.push({ t, d, luc: g ? g.tChoi : 0 }) });
  g.batDau();
  const dt = tuyChon.dt || 1 / 60;
  let lich = null, buoc = 0;
  while ((g.trangThai === "choi" || g.trangThai === "hoiSinh" || g.trangThai === "tamDung") && buoc < 60 * 400) {
    buoc++;
    const tt = g.thuThach;
    if (tt && tt.trangThai === "mo" && (!lich || lich.id !== tt.id)) lich = { id: tt.id, luc: g.tChoi + naoBo.tre(tt, g), lan: 0 };
    if (lich && tt && tt.id === lich.id && tt.trangThai === "mo" && g.tChoi >= lich.luc) {
      naoBo.bam(g, tt, lich);
      lich.luc = g.tChoi + 0.3;
    }
    if (tuyChon.moiBuoc) tuyChon.moiBuoc(g, buoc);
    g.capNhat(tuyChon.dtNgauNhien ? dt * (0.3 + rng() * 3) : dt);
  }
  return { g, suKien };
}
const nao = {
  luonDung: (tre) => ({ tre: () => tre, bam: (g, tt) => g.chonDapAn(tt.id, tt.tu.en) }),
  khongBam: { tre: () => 1e9, bam: () => {} },
  saiRoiDung: { tre: () => 0.4, bam: (g, tt, l) => { const sai = tt.phuongAn.find(p => p !== tt.tu.en && tt.daSai.indexOf(p) < 0); g.chonDapAn(tt.id, l.lan++ === 0 && sai ? sai : tt.tu.en); } },
  satGio: { tre: (tt, g) => tt.thoiHan - 0.04, bam: (g, tt) => g.chonDapAn(tt.id, tt.tu.en) },
  dongDap: { tre: () => 0.2, bam: (g, tt) => { for (let i = 0; i < 6; i++) tt.phuongAn.forEach(p => g.chonDapAn(tt.id, p)); g.chonDapAn(tt.id, tt.tu.en); g.chonDapAn(tt.id, tt.tu.en); } }
};
const dem = (sk, t) => sk.filter(e => e.t === t).length;

console.log("1. Luôn trả lời đúng -> thắng, không mất mạng, nhặt đủ kim cương");
for (const ma of DS_MAN) {
  let thoiGianMin = 999, soCN = [];
  for (let hat = 1; hat <= 25; hat++) {
    const { g, suKien } = chay(ma, hat, nao.luonDung(0.5 + (hat % 5) * 0.4));
    kiem(g.trangThai === "thang", `${ma}#${hat}: phải thắng, đang ${g.trangThai} (${g.lyDoThua})`);
    kiem(g.thongKe.matMang === 0, `${ma}#${hat}: không được mất mạng (mất ${g.thongKe.matMang})`);
    kiem(dem(suKien, "khung") === 0, `${ma}#${hat}: không được khựng`);
    const kcHien = suKien.filter(e => e.t === "hienKimCuong").reduce((s, e) => s + e.d.so, 0);
    kiem(g.tongKimCuong === kcHien, `${ma}#${hat}: nhặt ${g.tongKimCuong}/${kcHien} kim cương`);
    kiem(g.tongKimCuong === g.kimCuong + g.thongKe.mangDoi * ST.CAU_HINH.kimCuongDoiMang, `${ma}#${hat}: số dư kim cương sai`);
    kiem(g.thongKe.dung === g.tongChuongNgai, `${ma}#${hat}: số thử thách đúng ${g.thongKe.dung}/${g.tongChuongNgai}`);
    // nhảy liên tục ngoài ý muốn: số cú nhảy = số vật cần nhảy + số cú nhặt kim cương
    const canNhay = suKien.filter(e => e.t === "chonDung" && e.d.tt.o.hanhDong === "nhay").length;
    const nhayKC = suKien.filter(e => e.t === "haQuai" && e.d.o.soKimCuong > 0).length;
    kiem(dem(suKien, "nhay") === canNhay + nhayKC, `${ma}#${hat}: số cú nhảy ${dem(suKien, "nhay")} != ${canNhay + nhayKC}`);
    thoiGianMin = Math.min(thoiGianMin, g.thoiGian); soCN.push(g.tongChuongNgai);
  }
  console.log(`   ${ma}: còn ít nhất ${thoiGianMin.toFixed(1)} giây khi tới lâu đài; ${Math.min(...soCN)}-${Math.max(...soCN)} chướng ngại vật/lượt`);
}

console.log("2. Không bấm gì -> va ống cống chỉ khựng; quái / hố làm mất mạng; hết mạng thì thua ngay");
for (const ma of DS_MAN) for (let hat = 1; hat <= 15; hat++) {
  const { g, suKien } = chay(ma, hat, nao.khongBam);
  kiem(g.trangThai === "thua", `${ma}#${hat}: phải thua`);
  const matDoVatCan = suKien.filter(e => e.t === "matMang" && e.d.o && e.d.o.vaCham === "khung").length;
  kiem(matDoVatCan === 0, `${ma}#${hat}: vật cản không được làm mất mạng`);
  kiem(dem(suKien, "matMang") === g.thongKe.matMang, `${ma}#${hat}: đếm mất mạng`);
  if (g.lyDoThua === "hetMang") {
    kiem(g.tongMang === 0 && g.thongKe.matMang === ST.CAU_HINH.mangBanDau, `${ma}#${hat}: hết mạng`);
    const x = g.be.x, tg = g.thoiGian; g.capNhat(0.5); g.capNhat(0.5);
    kiem(g.be.x === x && g.thoiGian === tg, `${ma}#${hat}: thua rồi mà bé vẫn chạy / đồng hồ vẫn chạy`);
  }
  // đồng hồ vẫn chạy khi khựng: tổng thời gian chơi = thời gian màn - thời gian còn
  kiem(Math.abs(g.tChoi - (g.thoiGianToiDa - g.thoiGian)) < 1e-6, `${ma}#${hat}: đồng hồ`);
}

console.log("3. Chọn sai rồi đúng / bấm dồn dập / trả lời sát giờ");
for (const ma of DS_MAN) for (let hat = 1; hat <= 10; hat++) {
  let r = chay(ma, hat, nao.saiRoiDung);
  kiem(r.g.trangThai === "thang", `${ma}#${hat} sai-rồi-đúng: phải thắng (${r.g.trangThai})`);
  kiem(r.g.thongKe.sai >= r.g.tongChuongNgai, `${ma}#${hat}: phải đếm lần chọn sai`);
  r = chay(ma, hat, nao.dongDap);
  kiem(r.g.trangThai === "thang" && r.g.thongKe.matMang === 0, `${ma}#${hat} dồn dập: ${r.g.trangThai}`);
  kiem(dem(r.suKien, "chonDung") === r.g.tongChuongNgai, `${ma}#${hat} dồn dập: mỗi thử thách chỉ được đúng 1 lần`);
  const kcHien = r.suKien.filter(e => e.t === "hienKimCuong").reduce((s, e) => s + e.d.so, 0);
  kiem(r.g.tongKimCuong === kcHien, `${ma}#${hat} dồn dập: kim cương ${r.g.tongKimCuong}/${kcHien}`);
  r = chay(ma, hat, nao.satGio);
  kiem(r.g.trangThai === "thang" && r.g.thongKe.matMang === 0 && dem(r.suKien, "khung") === 0,
    `${ma}#${hat} sát giờ: ${r.g.trangThai}, mất ${r.g.thongKe.matMang}, khựng ${dem(r.suKien, "khung")}`);
  // khung hình giật (dt thay đổi lung tung) vẫn đúng
  r = chay(ma, hat, nao.luonDung(1), { dtNgauNhien: true });
  kiem(r.g.trangThai === "thang" && r.g.thongKe.matMang === 0, `${ma}#${hat} khung hình giật: ${r.g.trangThai}`);
}

console.log("4. Đổi kim cương lấy mạng (10 viên = 1 mạng, tối đa 3, giữ số dư)");
{
  const g = new ST.TroChoi("de", { ngauNhien: ST.taoNgauNhien(3) }); g.batDau();
  g.kimCuong = 8; g.kimCuong += 5; g.doiMang();
  kiem(g.mangDuTru === 1 && g.kimCuong === 3, `8+5: dự trữ ${g.mangDuTru}, dư ${g.kimCuong}`);
  g.kimCuong = 35; g.doiMang();
  kiem(g.mangDuTru === 3 && g.kimCuong === 15, `đạt giới hạn: dự trữ ${g.mangDuTru}, giữ ${g.kimCuong}`);
  const truoc = g.mang;
  g.matMang("quai", null);
  kiem(g.mang === truoc && g.mangDuTru === 3 && g.kimCuong === 5, `mất mạng dùng dự trữ rồi đổi lại ngay: mạng ${g.mang}, dự trữ ${g.mangDuTru}, dư ${g.kimCuong}`);
}

console.log("5. Tạm dừng / thử thách cũ / chơi lại");
{
  const rng = ST.taoNgauNhien(9);
  const g = new ST.TroChoi("vua", { ngauNhien: rng }); g.batDau();
  for (let i = 0; i < 60 * 30 && !g.thuThach; i++) g.capNhat(1 / 60);
  const tt = g.thuThach;
  kiem(!!tt, "phải có thử thách");
  const x = g.be.x, tg = g.thoiGian, xo = tt.o.x;
  g.tamDung();
  for (let i = 0; i < 300; i++) g.capNhat(1 / 60);
  kiem(g.be.x === x && g.thoiGian === tg && tt.o.x === xo, "tạm dừng: mọi thứ phải đứng yên");
  kiem(g.chonDapAn(tt.id, tt.tu.en).kq === "boQua", "tạm dừng: không nhận đáp án");
  g.tiepTuc();
  kiem(g.trangThai === "choi", "tiếp tục");
  kiem(g.chonDapAn(tt.id + 7, tt.tu.en).kq === "boQua", "đáp án của thử thách khác bị bỏ qua");
  kiem(g.chonDapAn(tt.id, tt.tu.en).kq === "dung", "trả lời đúng");
  kiem(g.chonDapAn(tt.id, tt.tu.en).kq === "boQua", "bấm lại lần 2 bị bỏ qua");
  g.kimCuong = 7; g.mangDuTru = 2; g.thoiGian = 3;
  g.batDau();
  kiem(g.kimCuong === 0 && g.mangDuTru === 0 && g.thoiGian === g.thoiGianToiDa && g.be.x === 0 && !g.thuThach && g.mang === ST.CAU_HINH.mangBanDau,
    "chơi lại phải đặt lại toàn bộ");
}

console.log("6. Hết giờ thì thua dù còn mạng; tới lâu đài thì đồng hồ dừng");
{
  const g = new ST.TroChoi("de", { ngauNhien: ST.taoNgauNhien(5) }); g.batDau();
  g.thoiGian = 1;
  for (let i = 0; i < 200; i++) g.capNhat(1 / 60);
  kiem(g.trangThai === "thua" && g.lyDoThua === "hetGio" && g.tongMang > 0, "hết giờ");
  kiem(g.chonDapAn(1, "cat").kq === "boQua", "thua rồi không nhận đáp án");
  const r = chay(DS_MAN[0], 2, nao.luonDung(0.5));
  const tg = r.g.thoiGian; r.g.capNhat(0.2); r.g.capNhat(0.2);
  kiem(r.g.thoiGian === tg && r.g.trangThai === "thang", "thắng rồi đồng hồ phải dừng");
  kiem(r.g.tamDung() === false, "thắng rồi không tạm dừng được");
}

console.log("7. Đường đi hợp lệ: không chồng lấn, cái đầu là ống cống, đủ khoảng phản ứng");
for (const ma of DS_MAN) for (let hat = 1; hat <= 40; hat++) {
  const dk = MAN_THU[ma], v = dk.tocDo;
  const d = ST.sinhDuongDi(dk, ST.taoNgauNhien(hat), new ST.KhoTuVung(dk, ST.taoNgauNhien(hat)));
  kiem(d.ds[0].loai === "cong", `${ma}#${hat}: cái đầu phải là ống cống`);
  for (let i = 1; i < d.ds.length; i++) {
    const a = d.ds[i - 1], b = d.ds[i];
    const tamB = b.x + b.rong / 2;
    kiem(tamB - ST.khoangKichHoat(b, v, dk.thoiGianPhanUng) >= a.x + a.rong + ST.CAU_HINH.leQuaChuongNgai - 1,
      `${ma}#${hat}: ${a.loai} và ${b.loai} quá sát`);
  }
  const cuoi = d.ds[d.ds.length - 1];
  kiem(cuoi.x + cuoi.rong < d.dai - ST.CAU_HINH.khoangCuoiTruocLauDai + 1, `${ma}#${hat}: sát lâu đài`);
  let kcLien = 0, maxLien = 0;
  d.ds.forEach(o => { kcLien = o.soKimCuong ? kcLien + 1 : 0; maxLien = Math.max(maxLien, kcLien); });
  kiem(maxLien <= dk.kimCuongLienTiepToiDa, `${ma}#${hat}: kim cương liên tiếp ${maxLien}`);
}
console.log("8. Phương án: đúng số lượng, không trùng, có đáp án đúng, vị trí đáp án đúng thay đổi");
for (const ma of DS_MAN) {
  const dk = MAN_THU[ma], kho = new ST.KhoTuVung(dk, ST.taoNgauNhien(11)), viTri = new Set();
  for (let i = 0; i < 200; i++) {
    const t = kho.layTu(), pa = kho.taoPhuongAn(t);
    kiem(pa.length === dk.soPhuongAn && new Set(pa).size === pa.length && pa.indexOf(t.en) >= 0, `${ma}: phương án ${pa}`);
    kiem(pa.every(p => p.length >= 3), `${ma}: không dùng chữ cái đơn lẻ`);
    viTri.add(pa.indexOf(t.en));
  }
  kiem(viTri.size === dk.soPhuongAn, `${ma}: đáp án đúng phải đổi vị trí`);
}

console.log("9. Người chơi lung tung (đúng/sai/không bấm, khung hình giật): bất biến luôn đúng");
for (const ma of DS_MAN) for (let hat = 100; hat < 160; hat++) {
  const rngNao = ST.taoNgauNhien(hat * 7);
  const naoLungTung = {
    tre: (tt) => rngNao() < 0.25 ? 1e9 : rngNao() * tt.thoiHan * 1.2,
    bam: (g, tt) => { const p = tt.phuongAn[Math.floor(rngNao() * tt.phuongAn.length)]; g.chonDapAn(tt.id, p); if (rngNao() < 0.3) g.chonDapAn(tt.id - 1, tt.tu.en); }
  };
  let loi = null;
  const r = chay(ma, hat, naoLungTung, { dtNgauNhien: true, moiBuoc: (g, b) => {
    if (loi) return;
    const CH = ST.CAU_HINH;
    if (g.tongKimCuong !== g.kimCuong + g.thongKe.mangDoi * CH.kimCuongDoiMang) loi = "kim cương lệch";
    else if (g.mangDuTru > CH.mangDuTruToiDa || g.mangDuTru < 0 || g.mang < 0) loi = "mạng sai";
    else if (g.kimCuong >= CH.kimCuongDoiMang && g.mangDuTru < CH.mangDuTruToiDa) loi = "đủ kim cương mà chưa đổi";
    else if (g.tChoi > g.thoiGianToiDa + 0.01) loi = "quá thời gian màn";
    else if (g.trangThai === "choi" && g.be.y === 0 && !g.be.nhay && g.chuongNgai.some(o => o.nhom === "ho" && g.be.x > o.x + 6 && g.be.x < o.x + o.rong - 6)) loi = "đứng giữa hố";
    if (b % 97 === 0 && g.dangChoi) { g.tamDung(); g.capNhat(0.5); g.tiepTuc(); }
  } });
  kiem(!loi, `${ma}#${hat}: ${loi}`);
  kiem(r.g.trangThai === "thang" || r.g.trangThai === "thua", `${ma}#${hat}: lượt chơi phải kết thúc (${r.g.trangThai})`);
}

console.log("10. Kho từ: đủ nhiều, không trùng, đủ hình + nghĩa, khó dần theo cấp");
{
  const tatCa = [];
  for (const cap of [1, 2, 3, 4]) {
    const ds = ST.KHO_TU[cap];
    kiem(ds && ds.length >= 80, `cấp ${cap}: phải có ít nhất 80 từ (đang ${ds && ds.length})`);
    ds.forEach(([en, e, vi]) => {
      kiem(/^[a-z]{3,}$/.test(en), `từ "${en}" phải là chữ thường, ít nhất 3 chữ`);
      kiem(!!e && !!vi, `từ "${en}" thiếu hình hoặc nghĩa`);
      tatCa.push(en);
    });
  }
  kiem(new Set(tatCa).size === tatCa.length, "kho từ không được trùng");
  const tb = c => ST.KHO_TU[c].reduce((a, [en]) => a + en.length, 0) / ST.KHO_TU[c].length;
  kiem(tb(1) < tb(2) && tb(2) < tb(3) && tb(3) < tb(4), "độ dài trung bình phải tăng theo cấp");
}

console.log("11. Sổ ghi nhớ: từ bé đã thuộc ít xuất hiện, từ mới được ưu tiên, lưu riêng từng bé");
{
  const kho = {};
  globalThis.localStorage = { getItem: k => (k in kho ? kho[k] : null), setItem: (k, v) => { kho[k] = String(v); } };
  const so = new ST.SoTayTu("be_a");
  const N = ST.SoTayTu.SO_DUNG_DE_THUOC;
  for (let i = 0; i < N; i++) so.ghi("cat", true);
  kiem(so.daThuoc("cat"), "đúng ngay lần đầu đủ số lần liên tiếp thì thuộc");
  so.ghi("dog", true); so.ghi("dog", true); so.ghi("dog", false);
  kiem(!so.daThuoc("dog") && so.lay("dog").lien === 0, "sai một lần thì chuỗi thuộc về 0");
  kiem(so.trongSo("cat") < so.trongSo("sun") / 10, "từ đã thuộc phải hiếm hơn từ mới rất nhiều");
  kiem(so.trongSo("dog") > so.trongSo("cat"), "từ vừa sai được gặp lại nhiều hơn từ đã thuộc");
  kiem(new ST.SoTayTu("be_a").daThuoc("cat"), "sổ phải còn sau khi mở lại game");
  kiem(!new ST.SoTayTu("be_b").daThuoc("cat"), "mỗi bé một sổ riêng");
  // Đánh dấu thuộc nửa đầu cấp 1, bốc nhiều lần: từ đã thuộc phải ít hơn hẳn
  const so2 = new ST.SoTayTu("be_c"), dk = ST.DO_KHO.de;
  const ds1 = ST.KHO_TU[1].map(t => t[0]), thuoc = new Set(ds1.slice(0, ds1.length >> 1));
  thuoc.forEach(en => { for (let i = 0; i < N; i++) so2.ghi(en, true); });
  kiem(so2.demThuoc(1) === thuoc.size, "đếm số từ đã thuộc đúng");
  let gapThuoc = 0, tong = 0;
  for (let lan = 0; lan < 60; lan++) {
    const k = new ST.KhoTuVung({ ...dk, capTu: [1] }, ST.taoNgauNhien(500 + lan), so2);
    for (let i = 0; i < 12; i++) { tong++; if (thuoc.has(k.layTu().en)) gapThuoc++; }
  }
  kiem(gapThuoc / tong < 0.15, `từ đã thuộc chỉ nên chiếm phần nhỏ (đang ${(100 * gapThuoc / tong).toFixed(1)}%)`);
  // Thuộc hết thì vẫn có từ để chơi (để ôn)
  const so3 = new ST.SoTayTu("be_d");
  ds1.forEach(en => { for (let i = 0; i < N; i++) so3.ghi(en, true); });
  const k3 = new ST.KhoTuVung({ ...dk, capTu: [1] }, ST.taoNgauNhien(9), so3);
  kiem(Array.from({ length: 200 }, () => k3.layTu()).every(t => !!t && !!t.en), "thuộc hết vẫn bốc được từ để ôn");
  // Chơi thật: luôn đúng ngay lần đầu thì sổ ghi thuộc; không bấm thì ghi chưa thuộc
  const so4 = new ST.SoTayTu("be_e");
  const r = chay(DS_MAN[6], 21, nao.luonDung(0.8), { soTay: so4 });
  const ghi = r.suKien.filter(e => e.t === "ketQuaTu");
  kiem(ghi.length > 5 && ghi.every(e => e.d.thuoc), "luôn đúng: mọi từ được ghi là nhớ");
  kiem(new Set(ghi.map(e => e.d.tu.en)).size === ghi.length, "mỗi thử thách chỉ ghi một lần");
  kiem(ghi.every(e => so4.lay(e.d.tu.en) && so4.lay(e.d.tu.en).d >= 1), "sổ đã lưu kết quả");
  const so5 = new ST.SoTayTu("be_f");
  const r2 = chay("de", 22, nao.khongBam, { soTay: so5 });
  const ghi2 = r2.suKien.filter(e => e.t === "ketQuaTu");
  kiem(ghi2.length > 0 && ghi2.every(e => !e.d.thuoc), "không bấm: ghi là chưa thuộc");
  delete globalThis.localStorage;
}

console.log("12. Đường đua: 10 đường x 7 màn, màn sau khó hơn màn trước; tiến độ mở khóa đúng");
{
  kiem(ST.DUONG_DUA.length === 10 && ST.SO_MAN === 7, "phải có 10 đường đua, mỗi đường 7 màn");
  kiem(new Set(ST.DUONG_DUA.map(d => d.ma)).size === 10, "mã đường đua không trùng");
  for (let m = 2; m <= ST.SO_MAN; m++) {
    const a = ST.MAN_CHOI[m - 2], b = ST.MAN_CHOI[m - 1];
    kiem(b.tocDo > a.tocDo, `màn ${m}: phải chạy nhanh hơn màn trước`);
    kiem(b.thoiGianPhanUng < a.thoiGianPhanUng, `màn ${m}: thời gian chọn phải ngắn hơn`);
    kiem(b.soPhuongAn >= a.soPhuongAn && b.doGiong > a.doGiong, `màn ${m}: phương án phải khó hơn`);
    kiem(b.thoiGianChoi === 60, `màn ${m}: mỗi màn 1 phút`);
  }
  const m7 = ST.taoManChoi("rung", 7, "kho"), m1 = ST.taoManChoi("rung", 0, "khongCo");
  kiem(m7.laManCuoi && !ST.taoManChoi("rung", 6, "kho").laManCuoi, "chỉ màn 7 là màn cuối (cứu mèo)");
  kiem(m1.soMan === 1 && m1.maCapTu === "de", "màn / cấp không hợp lệ thì về màn 1, cấp 1");
  kiem(String(m7.capTu) === String(ST.DO_KHO.kho.capTu), "cấp từ quyết định từ vựng");
  // Không bấm gì thì không qua được màn nào; luôn đúng thì màn nào cũng qua (đã chạy ở mục 1, 2)

  const kho = {};
  globalThis.localStorage = { getItem: k => (k in kho ? kho[k] : null), setItem: (k, v) => { kho[k] = String(v); } };
  const td = new ST.TienDoDuongDua("be_x");
  kiem(td.duongMo("rung") && td.manMo("rung") === 1, "mới chơi: mở Rừng xanh màn 1");
  kiem(!td.manChoiDuoc("rung", 2), "chưa qua màn 1 thì chưa chơi màn 2");
  kiem(!td.duongMo("keo"), "đường thứ 2 khóa khi chưa xong đường 1");
  let kq = td.ghiThang("rung", 1, 2);
  kiem(kq.manMoi && !kq.xongDuong && td.manMo("rung") === 2 && td.sao("rung", 1) === 2, "qua màn 1: mở màn 2, ghi 2 sao");
  kq = td.ghiThang("rung", 1, 1);
  kiem(!kq.manMoi && td.sao("rung", 1) === 2, "chơi lại kém hơn: giữ số sao cao nhất");
  for (let m = 2; m <= 6; m++) td.ghiThang("rung", m, 3);
  kq = td.ghiThang("rung", 7, 3);
  kiem(kq.xongDuong && td.daXong("rung") && td.manMo("rung") === 7, "qua màn 7: xong đường đua");
  kiem(td.tongSao("rung") === 20, `tổng sao ${td.tongSao("rung")}`);
  kiem(!ST.layDuongDua("keo").daCo || td.duongMo("keo"), "xong đường 1 thì mở đường 2 (khi đã có hình)");
  kiem(!td.ghiThang("rung", 7, 3).xongDuong, "chơi lại màn 7 không báo xong đường lần nữa");
  kiem(new ST.TienDoDuongDua("be_x").manMo("rung") === 7, "tiến độ còn sau khi mở lại game");
  kiem(new ST.TienDoDuongDua("be_y").manMo("rung") === 1, "mỗi bé một tiến độ riêng");
  kho.kc_santu_tien_do_hong = "{không phải json";
  kiem(new ST.TienDoDuongDua("hong").manMo("rung") === 1, "dữ liệu hỏng thì bắt đầu lại, không lỗi");
  delete globalThis.localStorage;
  kiem(new ST.TienDoDuongDua("khong_luu").manMo("rung") === 1, "trình duyệt chặn lưu: vẫn chơi được");
}

console.log(`\n${soKiem - soLoi}/${soKiem} kiểm tra đạt` + (soLoi ? ` - ${soLoi} LỖI` : " ✓"));
process.exit(soLoi ? 1 : 0);
