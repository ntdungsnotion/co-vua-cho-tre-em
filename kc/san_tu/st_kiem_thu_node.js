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
   CẬP NHẬT: 16/10/2026 - TC_00D2 (sau khi người dùng thử): bé nhảy nhiều lần, kim cương trên không,
             màn "Tập chơi" (mục 18), bảng ôn tập cuối màn (mục 19).
   CẬP NHẬT: 16/10/2026 - TC_00D2: cụm kim cương có từ riêng (mục 7, 16, 18), cú nhảy 3 đơn vị.
   CẬP NHẬT: 16/10/2026 - TC_00D2: "người chơi máy" tự canh lúc bấm nhảy (cửa sổ nhảy) và
             bấm nhiều lần để bắn hạ quái có máu; thêm mục 13-15 (bấm sớm / trễ thì chạm,
             luật thanh máu tối đa 1/4 số quái, số viên đúng bằng máu).
   ================================================================ */
"use strict";
require("./st_cau_hinh.js");
require("./st_tien_do.js");
require("./st_kho_tu.js");
require("./st_tu_vung.js");
require("./st_logic.js");
require("./st_on_tap.js");
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
      // bam() trả về false = chưa tới lúc bấm (đang canh cửa sổ nhảy): xét lại ở khung sau
      if (naoBo.bam(g, tt, lich) !== false) lich.luc = g.tChoi + (naoBo.lap || 0.15);
    }
    if (tuyChon.moiBuoc) tuyChon.moiBuoc(g, buoc);
    g.capNhat(tuyChon.dtNgauNhien ? dt * (0.3 + rng() * 3) : dt);
  }
  return { g, suKien };
}
// Bé giỏi canh giờ: với vật phải nhảy, chỉ bấm đúng khi khoảng cách vừa vào giữa cửa sổ nhảy
// (viTri: 0 = sát mép gần, 1 = sát mép xa; mặc định giữa cửa sổ)
function denLucNhay(g, tt, viTri) {
  if (tt.o.hanhDong !== "nhay") return true;
  const [gan, xa] = ST.cuaSoNhay(tt.o, g.v), d = g.khoangTam(tt.o);
  const p = viTri === undefined ? 0.5 : viTri;
  return d <= gan + (xa - gan) * p && d >= gan;
}
const bamDung = (g, tt, viTri) => denLucNhay(g, tt, viTri) ? g.chonDapAn(tt.id, tt.tu.en) : false;
const nao = {
  luonDung: (tre) => ({ tre: () => tre, bam: (g, tt) => bamDung(g, tt) }),
  // chỉ trả lời chướng ngại vật, bỏ qua các cụm kim cương
  boQuaKimCuong: { tre: () => 0.3, bam: (g, tt) => tt.o.nhom === "kimCuong" ? undefined : bamDung(g, tt) },
  khongBam: { tre: () => 1e9, bam: () => {} },
  saiRoiDung: { tre: () => 0.4, bam: (g, tt, l) => {
    const sai = tt.phuongAn.find(p => p !== tt.tu.en && tt.daSai.indexOf(p) < 0);
    if (l.lan === 0 && sai) { l.lan++; return g.chonDapAn(tt.id, sai); }
    return bamDung(g, tt);
  } },
  // nhảy: bấm sát mép muộn nhất của cửa sổ; bắn: để gần hết giờ mới bấm liên tục
  satGio: { lap: 0.1, tre: (tt) => tt.o.hanhDong === "nhay" ? 0 : Math.max(0, tt.thoiHan - 0.15 * tt.o.mau - 0.7),
    bam: (g, tt) => bamDung(g, tt, 0.97) },
  dongDap: { tre: () => 0.2, bam: (g, tt) => {
    if (!denLucNhay(g, tt)) { tt.phuongAn.forEach(p => { if (p !== tt.tu.en) g.chonDapAn(tt.id, p); }); return false; }
    for (let i = 0; i < 6; i++) tt.phuongAn.forEach(p => g.chonDapAn(tt.id, p));
    g.chonDapAn(tt.id, tt.tu.en); g.chonDapAn(tt.id, tt.tu.en);
  } }
};
const dem = (sk, t) => sk.filter(e => e.t === t).length;

console.log("1. Luôn trả lời đúng -> thắng, không mất mạng, nhặt đủ kim cương");
for (const ma of DS_MAN) {
  let thoiGianMin = 999, soCN = [];
  for (let hat = 1; hat <= 25; hat++) {
    const { g, suKien } = chay(ma, hat, nao.luonDung(0.3 + (hat % 5) * 0.1));
    kiem(g.trangThai === "thang", `${ma}#${hat}: phải thắng, đang ${g.trangThai} (${g.lyDoThua})`);
    kiem(g.thongKe.matMang === 0, `${ma}#${hat}: không được mất mạng (mất ${g.thongKe.matMang})`);
    kiem(dem(suKien, "khung") === 0, `${ma}#${hat}: không được khựng`);
    // kim cương tầm chạy: chạy qua là nhặt; trên cao: nhảy giữa cửa sổ là chạm
    kiem(g.tongKimCuong === g.tongKimCuongDuong, `${ma}#${hat}: nhặt ${g.tongKimCuong}/${g.tongKimCuongDuong} kim cương`);
    kiem(g.tongKimCuong === g.kimCuong + g.thongKe.mangDoi * ST.CAU_HINH.kimCuongDoiMang, `${ma}#${hat}: số dư kim cương sai`);
    kiem(g.thongKe.dung === g.tongChuongNgai, `${ma}#${hat}: số thử thách đúng ${g.thongKe.dung}/${g.tongChuongNgai}`);
    kiem(dem(suKien, "haQuai") === suKien.filter(e => e.t === "thuThachMoi" && e.d.tt.o.hanhDong === "ban").length, `${ma}#${hat}: phải hạ hết quái có máu`);
    // nhảy liên tục ngoài ý muốn: số cú nhảy = số vật cần nhảy + số cú nhặt kim cương
    const canNhay = suKien.filter(e => e.t === "chonDung" && e.d.tt.o.hanhDong === "nhay").length;
    kiem(dem(suKien, "nhay") === canNhay, `${ma}#${hat}: số cú nhảy ${dem(suKien, "nhay")} != ${canNhay}`);
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
    kiem(g.tongMang === 0 && g.thongKe.matMang === ST.CAU_HINH.mangBanDau + g.thongKe.mangDoi, `${ma}#${hat}: hết mạng`);
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
  kiem(r.g.thongKe.dung === r.g.tongChuongNgai && new Set(r.suKien.filter(e => e.t === "chonDung" && e.d.lan === 1).map(e => e.d.tt.id)).size === r.g.tongChuongNgai,
    `${ma}#${hat} dồn dập: mỗi thử thách chỉ tính đúng 1 lần`);
  kiem(dem(r.suKien, "nhay") === r.suKien.filter(e => e.t === "chonDung" && e.d.tt.o.hanhDong === "nhay").length,
    `${ma}#${hat} dồn dập: mỗi cú nhảy phải do một lần bấm đúng`);
  kiem(r.g.tongKimCuong <= r.g.tongKimCuongDuong, `${ma}#${hat} dồn dập: kim cương ${r.g.tongKimCuong}/${r.g.tongKimCuongDuong}`);
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
  kiem(tt.o.hanhDong === "nhay", "thử thách đầu (ống cống) là nhảy");
  kiem(g.chonDapAn(tt.id, tt.tu.en).kq === "dung" && g.be.nhay, "trả lời đúng: nhảy NGAY");
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
  // kim cương: thành cụm riêng có từ, ở đoạn đường trống, không gắn với quái / vật cản
  const [kmin, kmax] = dk.soKimCuong, cum = d.ds.filter(o => o.nhom === "kimCuong");
  kiem(d.kimCuongs.length >= Math.ceil(kmin / 2) && d.kimCuongs.length <= kmax, `${ma}#${hat}: ${d.kimCuongs.length} kim cương`);
  kiem(cum.every(o => o.tu && o.vaCham === "khong" && o.soKimCuong >= 1 && o.soKimCuong <= ST.CAU_HINH.kimCuongMoiCum), `${ma}#${hat}: cụm kim cương phải có từ riêng, không va chạm`);
  kiem(cum.reduce((t, o) => t + o.soKimCuong, 0) === d.kimCuongs.length, `${ma}#${hat}: số viên khớp các cụm`);
  kiem(d.ds.every(o => o.nhom === "kimCuong" || o.soKimCuong === undefined), `${ma}#${hat}: kim cương không được gắn với chướng ngại vật`);
  for (let i = 1; i < d.ds.length; i++) kiem(!(d.ds[i].nhom === "kimCuong" && d.ds[i - 1].nhom === "kimCuong"), `${ma}#${hat}: 2 cụm kim cương liền nhau`);
  d.kimCuongs.forEach(k => {
    const c = cum.find(o => o.id === k.cum);
    kiem(c && k.x >= c.x && k.x <= c.x + c.rong, `${ma}#${hat}: kim cương ở x=${k.x} nằm ngoài cụm của nó`);
    kiem(!d.ds.some(o => o.nhom !== "kimCuong" && k.x > o.x - 30 && k.x < o.x + o.rong + 30), `${ma}#${hat}: kim cương ở x=${k.x} treo trên chướng ngại vật`);
    kiem(k.y - ST.CAU_HINH.kichThuocKimCuong / 2 > ST.CAU_HINH.nhanVat.cao, `${ma}#${hat}: kim cương thấp, chạy cũng chạm`);
  });
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
  const m7 = ST.taoManChoi("rung", 7, "kho"), m1 = ST.taoManChoi("rung", -1, "khongCo");
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

console.log("13. Bấm đúng nhưng SAI THỜI ĐIỂM (sớm quá / trễ quá) thì vẫn chạm vật cản, chạm quái, rơi hố");
for (const ma of DS_MAN) {
  let soNhaySom = 0, chamSom = 0, soNhayTre = 0, chamTre = 0, soDung = 0, chamDung = 0;
  for (let hat = 1; hat <= 12; hat++) {
    // sớm: bấm khi còn xa hơn mép xa của cửa sổ một đoạn; trễ: khi đã gần hơn mép gần
    const thu = (dieuKien) => {
      let soNhay = 0, cham = 0, oDangNhay = null;
      const naoBo = { lap: 0.02, tre: () => 0, bam: (g, tt) => {
        if (tt.o.hanhDong !== "nhay") return g.chonDapAn(tt.id, tt.tu.en);
        if (tt.o.nhom === "kimCuong") return false; // cụm kim cương không va chạm: bỏ qua
        const [gan, xa] = ST.cuaSoNhay(tt.o, g.v), d = g.khoangTam(tt.o);
        if (!dieuKien(d, gan, xa)) return false;
        const kq = g.chonDapAn(tt.id, tt.tu.en);
        if (kq.kq === "dung") { soNhay++; oDangNhay = tt.o; }
        return kq;
      } };
      const r = chay(ma, hat, naoBo);
      const ids = new Set(r.suKien.filter(e => e.t === "chonDung" && e.d.tt.o.hanhDong === "nhay").map(e => e.d.tt.o.id));
      cham = r.suKien.filter(e => (e.t === "khung" || e.t === "vaQuai" || e.t === "roiHo") && ids.has(e.d.o.id)).length;
      return [soNhay, cham];
    };
    let [n, c] = thu((d, gan, xa) => d <= xa + 45 && d > xa + 25); soNhaySom += n; chamSom += c;
    [n, c] = thu((d, gan, xa) => d < gan - 20 && d > gan - 70); soNhayTre += n; chamTre += c;
    [n, c] = thu((d, gan, xa) => d <= (gan + xa) / 2); soDung += n; chamDung += c;
  }
  kiem(soNhaySom > 20 && chamSom === soNhaySom, `${ma}: bấm sớm phải chạm (${chamSom}/${soNhaySom})`);
  kiem(soNhayTre >= 15 && chamTre === soNhayTre, `${ma}: bấm trễ phải chạm (${chamTre}/${soNhayTre})`);
  kiem(soDung > 20 && chamDung === 0, `${ma}: bấm đúng lúc thì không chạm (${chamDung}/${soDung})`);
}

console.log("14. Thanh máu: chỉ quái có máu + vật cản cao phải bắn; quái có máu <= 1/4 số quái; máu tăng theo màn");
{
  let tongCoMau = 0, tongQuai = 0;
  for (const ma of DS_MAN) for (let hat = 1; hat <= 60; hat++) {
    const dk = MAN_THU[ma];
    const d = ST.sinhDuongDi(dk, ST.taoNgauNhien(hat), new ST.KhoTuVung(dk, ST.taoNgauNhien(hat)));
    const quai = d.ds.filter(o => o.nhom === "quaiDat" || o.nhom === "quaiBay"), coMau = quai.filter(o => o.mau > 0);
    tongCoMau += coMau.length; tongQuai += quai.length;
    kiem(coMau.length * 4 <= quai.length, `${ma}#${hat}: ${coMau.length} quái có máu / ${quai.length} quái (quá 1/4)`);
    d.ds.forEach(o => {
      const L = ST.LOAI_CHUONG_NGAI[o.loai];
      kiem(o.hanhDong === (o.mau > 0 ? "ban" : "nhay"), `${ma}#${hat}: ${o.loai} có máu ${o.mau} mà hành động ${o.hanhDong}`);
      kiem(o.mau === 0 || o.mau === dk.mauQuai, `${ma}#${hat}: máu ${o.mau} khác máu của màn ${dk.mauQuai}`);
      if (L.caoHonNhay) kiem(o.mau > 0, `${ma}#${hat}: ${o.loai} cao hơn cú nhảy phải bắn`);
      if (L.caoHonNhay) kiem(o.bayCao + o.cao > ST.CAU_HINH.doCaoNhay, `${ma}#${hat}: ${o.loai} phải cao hơn cú nhảy`);
      if (o.nhom === "can" && !L.caoHonNhay || o.nhom === "ho") kiem(o.mau === 0, `${ma}#${hat}: ${o.loai} phải nhảy qua`);
      if (o.hanhDong === "nhay" && o.nhom !== "ho") kiem(o.bayCao + o.cao < ST.CAU_HINH.doCaoNhay, `${ma}#${hat}: ${o.loai} quá cao để nhảy`);
    });
  }
  kiem(tongCoMau > 0 && tongCoMau * 4 <= tongQuai, `tổng: ${tongCoMau} quái có máu / ${tongQuai} quái`);
  for (let m = 2; m <= ST.SO_MAN; m++) kiem(ST.MAN_CHOI[m - 1].mauQuai >= ST.MAN_CHOI[m - 2].mauQuai, `màn ${m}: máu không được ít hơn màn trước`);
  kiem(ST.MAN_CHOI[6].mauQuai > ST.MAN_CHOI[0].mauQuai, "màn cuối phải nhiều máu hơn màn đầu");
}

console.log("15. Mỗi lần bấm đúng = 1 viên; hạ đúng sau số viên bằng máu; khung chọn giữ nguyên tới khi hạ");
for (const ma of DS_MAN) for (let hat = 1; hat <= 10; hat++) {
  let loi = null;
  const r = chay(ma, hat, nao.luonDung(0.3), { moiBuoc: (g) => {
    const tt = g.thuThach;
    if (!loi && tt && tt.o.hanhDong === "ban" && tt.o.song && tt.daDung && tt.trangThai !== "mo" && g.trangThai === "choi") loi = `thử thách đóng khi ${tt.o.loai} còn ${tt.o.mau} máu`;
  } });
  kiem(!loi, `${ma}#${hat}: ${loi}`);
  const trung = {}, phep = {};
  r.suKien.forEach(e => { if (e.t === "trungDan") trung[e.d.o.id] = (trung[e.d.o.id] || 0) + 1; if (e.t === "phep") phep[e.d.o.id] = (phep[e.d.o.id] || 0) + 1; });
  r.suKien.filter(e => e.t === "haQuai").forEach(e => {
    kiem(trung[e.d.o.id] === e.d.o.mauToiDa, `${ma}#${hat}: ${e.d.o.loai} hạ sau ${trung[e.d.o.id]} viên, máu ${e.d.o.mauToiDa}`);
    kiem(phep[e.d.o.id] >= e.d.o.mauToiDa, `${ma}#${hat}: số lần bắn ${phep[e.d.o.id]} < máu`);
  });
  const soBan = r.suKien.filter(e => e.t === "chonDung" && e.d.tt.o.hanhDong === "ban").length;
  kiem(soBan === dem(r.suKien, "phep"), `${ma}#${hat}: mỗi lần bấm đúng phải bắn đúng 1 viên (${soBan}/${dem(r.suKien, "phep")})`);
}
{
  // Không có giới hạn đạn: bấm đúng 30 lần vẫn bắn đủ 30 viên
  let thuDuoc = false;
  for (let hat = 1; hat <= 30 && !thuDuoc; hat++) {
    const g = new ST.TroChoi(MAN_THU[DS_MAN[6]], { ngauNhien: ST.taoNgauNhien(hat) }); g.batDau();
    for (let i = 0; i < 60 * 60 && (g.trangThai === "choi" || g.trangThai === "hoiSinh"); i++) {
      const t = g.thuThach;
      if (t && t.trangThai === "mo" && t.o.hanhDong === "ban") break;
      if (t && t.trangThai === "mo" && denLucNhay(g, t)) g.chonDapAn(t.id, t.tu.en);
      g.capNhat(1 / 60);
    }
    const tt = g.thuThach;
    if (!tt || tt.trangThai !== "mo" || tt.o.hanhDong !== "ban") continue;
    thuDuoc = true;
    tt.o.mau = tt.o.mauToiDa = 40; let ban = 0;
    for (let i = 0; i < 30; i++) if (g.chonDapAn(tt.id, tt.tu.en).kq === "dung") ban++;
    kiem(ban === 30 && g.dan.length === 30, `đạn không giới hạn: bắn ${ban}, đang bay ${g.dan.length}`);
  }
  if (!thuDuoc) kiem(false, "không tìm được quái có máu để thử đạn");
}

console.log("16. Cụm kim cương có từ riêng ở chỗ trống: không bấm từ của cụm thì không lấy được; bấm đúng lúc lấy đủ cụm");
for (const ma of DS_MAN) {
  const khacNhau = new Set();
  for (let hat = 1; hat <= 10; hat++) {
    khacNhau.add(JSON.stringify(ST.sinhDuongDi(MAN_THU[ma], ST.taoNgauNhien(hat), new ST.KhoTuVung(MAN_THU[ma], ST.taoNgauNhien(hat))).kimCuongs.map(k => k.x)));
    const r0 = chay(ma, hat, nao.khongBam);
    kiem(r0.g.tongKimCuong === 0, `${ma}#${hat}: không nhảy mà nhặt được ${r0.g.tongKimCuong} kim cương`);
    const r1 = chay(ma, hat, nao.boQuaKimCuong);
    kiem(r1.g.tongKimCuong === 0 && r1.g.trangThai === "thang", `${ma}#${hat}: chỉ nhảy qua vật thì không lấy được kim cương (${r1.g.tongKimCuong}, ${r1.g.trangThai})`);
    const r = chay(ma, hat, nao.luonDung(0.3));
    kiem(r.g.tongKimCuong === r.g.tongKimCuongDuong, `${ma}#${hat}: bấm đúng lúc lấy đủ kim cương (${r.g.tongKimCuong}/${r.g.tongKimCuongDuong})`);
    kiem(r.g.thongKe.dung === r.g.tongChuongNgai, `${ma}#${hat}: mỗi từ (cả từ của cụm kim cương) tính 1 lần đúng`);
  }
  kiem(khacNhau.size >= 8, `${ma}: vị trí kim cương phải ngẫu nhiên mỗi lượt (${khacNhau.size}/10 khác nhau)`);
}
{
  // Đang lơ lửng thì bấm không nhảy thêm; chạm đất rồi bấm lại thì nhảy tiếp
  const g = new ST.TroChoi(MAN_THU[DS_MAN[0]], { ngauNhien: ST.taoNgauNhien(5) }); g.batDau();
  for (let i = 0; i < 60 * 30 && !(g.thuThach && g.thuThach.trangThai === "mo"); i++) g.capNhat(1 / 60);
  const tt = g.thuThach;
  kiem(g.chonDapAn(tt.id, tt.tu.en).kq === "dung" && g.be.nhay, "bấm đúng: nhảy");
  kiem(g.chonDapAn(tt.id, tt.tu.en).lyDo === "dangNhay", "đang lơ lửng: chưa nhảy thêm");
  for (let i = 0; i < 60 * 3 && g.be.nhay; i++) g.capNhat(1 / 60);
  kiem(!g.be.nhay && tt.trangThai === "mo" && g.chonDapAn(tt.id, tt.tu.en).kq === "dung" && g.be.nhay, "chạm đất rồi: bấm lại là nhảy tiếp");
}

console.log("17. Kim cương tối đa mỗi màn theo cấp từ (5 / 8 / 12 / 15); cấp 3-4 ẩn chữ");
{
  const toiDa = { de: 5, vua: 8, kho: 12, thuThach: 15 };
  for (const cap of ST.THU_TU_DO_KHO) {
    kiem(ST.DO_KHO[cap].kimCuongToiDa === toiDa[cap], `${cap}: tối đa ${ST.DO_KHO[cap].kimCuongToiDa}`);
    kiem(!!ST.DO_KHO[cap].anChu === (cap === "kho" || cap === "thuThach"), `${cap}: ẩn chữ chỉ ở cấp 3-4`);
    let lonNhat = 0;
    for (let m = 1; m <= ST.SO_MAN; m++) for (let hat = 1; hat <= 30; hat++) {
      const dk = ST.taoManChoi("rung", m, cap);
      kiem(dk.anChu === !!ST.DO_KHO[cap].anChu, `${cap} màn ${m}: cờ ẩn chữ`);
      const d = ST.sinhDuongDi(dk, ST.taoNgauNhien(hat), new ST.KhoTuVung(dk, ST.taoNgauNhien(hat)));
      const n = d.kimCuongs.length;
      kiem(n <= toiDa[cap], `${cap} màn ${m}#${hat}: ${n} kim cương > ${toiDa[cap]}`);
      lonNhat = Math.max(lonNhat, n);
    }
    kiem(lonNhat === toiDa[cap], `${cap}: có màn đạt đủ ${toiDa[cap]} kim cương (lớn nhất ${lonNhat})`);
  }
}

console.log("18. Màn Tập chơi: chướng ngại vật xếp sẵn đúng thứ tự, cụm kim cương có từ riêng ở ô thứ 2, bé giỏi qua được, không bấm thì thua");
{
  for (const cap of ST.THU_TU_DO_KHO) {
    const dk = ST.taoManChoi("rung", 0, cap);
    kiem(dk.laHuongDan && dk.soMan === 0 && !dk.laManCuoi, `${cap}: màn 0 là Tập chơi`);
    for (let hat = 1; hat <= 20; hat++) {
      const d = ST.sinhDuongDi(dk, ST.taoNgauNhien(hat), new ST.KhoTuVung(dk, ST.taoNgauNhien(hat)));
      kiem(d.ds.map(o => o.loai).join() === "cong,kimCuong,da,ho,nam,nam,tuongDa", `${cap}#${hat}: thứ tự ${d.ds.map(o => o.loai).join()}`);
      kiem(d.ds.map(o => o.hanhDong).join() === "nhay,nhay,nhay,nhay,nhay,ban,ban", `${cap}#${hat}: nhảy / bắn đúng bài`);
      kiem(d.kimCuongs.length === Math.min(3, ST.DO_KHO[cap].kimCuongToiDa) && d.kimCuongs.every(k => k.x > d.ds[0].x + d.ds[0].rong && k.x < d.ds[2].x), `${cap}#${hat}: cụm kim cương giữa ống cống và tảng đá`);
      kiem(d.dai > d.ds[6].x + d.ds[6].rong && d.dai < d.ds[6].x + 1200, `${cap}#${hat}: đích ngay sau tường đá`);
    }
    for (let hat = 1; hat <= 10; hat++) {
      const r = chay(dk, hat, nao.luonDung(0.4));
      kiem(r.g.trangThai === "thang" && r.g.mang === ST.CAU_HINH.mangBanDau, `${cap}#${hat}: bé giỏi qua màn Tập chơi (${r.g.trangThai}, ${r.g.lyDoThua})`);
      kiem(r.g.tongKimCuong === r.g.tongKimCuongDuong, `${cap}#${hat}: lấy đủ kim cương tập chơi`);
      kiem(chay(dk, hat, nao.khongBam).g.trangThai === "thua", `${cap}#${hat}: không bấm thì không qua`);
    }
  }
}

console.log("19. Bảng ôn tập: ưu tiên từ sai, không trùng hình, ghép đúng thì biến mất, hết thẻ là xong");
{
  const kt = new ST.KhoTuVung(ST.taoManChoi("rung", 1, "de"), ST.taoNgauNhien(3));
  const ds = []; for (let i = 0; i < 14; i++) ds.push(kt.layTu());
  const sai = [ds[9].en, ds[12].en];
  const chon = ST.chonTuOnTap(ds.concat([ds[0]]), sai, 6, ST.taoNgauNhien(2));
  kiem(chon.length === 6, "tối đa 6 cặp");
  kiem(sai.every(en => chon.some(t => t.en === en)), "từ bé làm sai luôn được ôn");
  kiem(new Set(chon.map(t => t.en)).size === chon.length && new Set(chon.map(t => t.e)).size === chon.length, "không trùng từ, không trùng hình");
  kiem(ST.chonTuOnTap(ds.slice(0, 3), [], 6).length === 3, "ít từ thì ôn bấy nhiêu");
  const b = new ST.BangOnTap(chon, ST.taoNgauNhien(4));
  kiem(b.hinh.length === 6 && b.chu.length === 6 && b.conLai === 6 && !b.xong, "6 thẻ hình + 6 thẻ chữ");
  kiem(b.hinh.join() !== b.chu.join(), "hình và chữ xếp lệch nhau");
  const [x, y] = [chon[0].en, chon[1].en];
  kiem(b.bam("hinh", x).kq === "chon" && b.bam("hinh", x).kq === "boChon", "bấm lại thẻ đang chọn là bỏ chọn");
  kiem(b.bam("hinh", x).kq === "chon" && b.bam("hinh", y).kq === "chon" && b.dangChon.en === y, "bấm thẻ khác cùng bên là đổi chọn");
  const s1 = b.bam("chu", x);
  kiem(s1.kq === "sai" && b.conLai === 6 && !b.dangChon && b.soLanSai === 1, "ghép sai: không mất thẻ, thử lại");
  kiem(b.bam("chu", y).kq === "chon" && b.bam("hinh", y).kq === "dung" && b.conLai === 5, "ghép đúng (chữ trước, hình sau): cặp biến mất");
  kiem(b.bam("hinh", y).kq === "boQua", "thẻ đã biến mất thì bấm không có tác dụng");
  let cuoi = null;
  chon.forEach(t => { if (!b.daXong.has(t.en)) { b.bam("hinh", t.en); cuoi = b.bam("chu", t.en); } });
  kiem(cuoi && cuoi.kq === "dung" && cuoi.xong && b.xong && b.conLai === 0, "ghép hết là ôn xong");
}

console.log(`\n${soKiem - soLoi}/${soKiem} kiểm tra đạt` + (soLoi ? ` - ${soLoi} LỖI` : " ✓"));
process.exit(soLoi ? 1 : 0);
