/* ================================================================
   FILE: san_tu/st_kiem_thu_node.js
   CHỨC NĂNG: KIỂM THỬ TỰ ĐỘNG phần lõi game Săn Từ (không cần trình duyệt).
              Chạy: node kc/san_tu/st_kiem_thu_node.js
              Mô phỏng hàng trăm lượt chơi với "người chơi máy" (luôn đúng, luôn sai,
              không bấm, bấm dồn dập, trả lời sát giờ...) và kiểm tra các tiêu chí
              nghiệm thu: thắng/thua, mạng, kim cương, đổi mạng, tạm dừng, chơi lại.
   BƯỚC: TC_00B
   NGÀY: 15/10/2026
   ================================================================ */
"use strict";
require("./st_cau_hinh.js");
require("./st_tu_vung.js");
require("./st_logic.js");
const ST = globalThis.ST;

let soLoi = 0, soKiem = 0;
function kiem(dk, moTa) { soKiem++; if (!dk) { soLoi++; console.log("  ✗ " + moTa); } }

// Chạy một lượt với "bộ não" quyết định khi nào bấm gì
function chay(maDoKho, hat, naoBo, tuyChon) {
  tuyChon = tuyChon || {};
  const rng = ST.taoNgauNhien(hat);
  const suKien = [];
  const g = new ST.TroChoi(maDoKho, { ngauNhien: rng, suKien: (t, d) => suKien.push({ t, d, luc: g ? g.tChoi : 0 }) });
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
for (const ma of ST.THU_TU_DO_KHO) {
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
for (const ma of ST.THU_TU_DO_KHO) for (let hat = 1; hat <= 15; hat++) {
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
  // đồng hồ vẫn chạy khi khựng: tổng thời gian chơi = 120 - thời gian còn
  kiem(Math.abs(g.tChoi - (ST.CAU_HINH.thoiGianChoi - g.thoiGian)) < 1e-6, `${ma}#${hat}: đồng hồ`);
}

console.log("3. Chọn sai rồi đúng / bấm dồn dập / trả lời sát giờ");
for (const ma of ST.THU_TU_DO_KHO) for (let hat = 1; hat <= 10; hat++) {
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
  kiem(g.kimCuong === 0 && g.mangDuTru === 0 && g.thoiGian === ST.CAU_HINH.thoiGianChoi && g.be.x === 0 && !g.thuThach && g.mang === ST.CAU_HINH.mangBanDau,
    "chơi lại phải đặt lại toàn bộ");
}

console.log("6. Hết giờ thì thua dù còn mạng; tới lâu đài thì đồng hồ dừng");
{
  const g = new ST.TroChoi("de", { ngauNhien: ST.taoNgauNhien(5) }); g.batDau();
  g.thoiGian = 1;
  for (let i = 0; i < 200; i++) g.capNhat(1 / 60);
  kiem(g.trangThai === "thua" && g.lyDoThua === "hetGio" && g.tongMang > 0, "hết giờ");
  kiem(g.chonDapAn(1, "cat").kq === "boQua", "thua rồi không nhận đáp án");
  const r = chay("de", 2, nao.luonDung(0.5));
  const tg = r.g.thoiGian; r.g.capNhat(0.2); r.g.capNhat(0.2);
  kiem(r.g.thoiGian === tg && r.g.trangThai === "thang", "thắng rồi đồng hồ phải dừng");
  kiem(r.g.tamDung() === false, "thắng rồi không tạm dừng được");
}

console.log("7. Đường đi hợp lệ: không chồng lấn, cái đầu là ống cống, đủ khoảng phản ứng");
for (const ma of ST.THU_TU_DO_KHO) for (let hat = 1; hat <= 40; hat++) {
  const dk = ST.DO_KHO[ma], v = dk.tocDo;
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
for (const ma of ST.THU_TU_DO_KHO) {
  const dk = ST.DO_KHO[ma], kho = new ST.KhoTuVung(dk, ST.taoNgauNhien(11)), viTri = new Set();
  for (let i = 0; i < 200; i++) {
    const t = kho.layTu(), pa = kho.taoPhuongAn(t);
    kiem(pa.length === dk.soPhuongAn && new Set(pa).size === pa.length && pa.indexOf(t.en) >= 0, `${ma}: phương án ${pa}`);
    kiem(pa.every(p => p.length >= 3), `${ma}: không dùng chữ cái đơn lẻ`);
    viTri.add(pa.indexOf(t.en));
  }
  kiem(viTri.size === dk.soPhuongAn, `${ma}: đáp án đúng phải đổi vị trí`);
}

console.log("9. Người chơi lung tung (đúng/sai/không bấm, khung hình giật): bất biến luôn đúng");
for (const ma of ST.THU_TU_DO_KHO) for (let hat = 100; hat < 160; hat++) {
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
    else if (g.tChoi > CH.thoiGianChoi + 0.01) loi = "quá 120 giây";
    else if (g.trangThai === "choi" && g.be.y === 0 && !g.be.nhay && g.chuongNgai.some(o => o.nhom === "ho" && g.be.x > o.x + 6 && g.be.x < o.x + o.rong - 6)) loi = "đứng giữa hố";
    if (b % 97 === 0 && g.dangChoi) { g.tamDung(); g.capNhat(0.5); g.tiepTuc(); }
  } });
  kiem(!loi, `${ma}#${hat}: ${loi}`);
  kiem(r.g.trangThai === "thang" || r.g.trangThai === "thua", `${ma}#${hat}: lượt chơi phải kết thúc (${r.g.trangThai})`);
}

console.log(`\n${soKiem - soLoi}/${soKiem} kiểm tra đạt` + (soLoi ? ` - ${soLoi} LỖI` : " ✓"));
process.exit(soLoi ? 1 : 0);
