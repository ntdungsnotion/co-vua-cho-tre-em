// ================================================================
// FILE: dt/3d/dt3d_vung.js  (ES module) - THUNG LŨNG THẬT (vào qua lớp máy chủ)
// CHỨC NĂNG: Phần riêng của THUNG LŨNG KHỞI ĐẦU 128 x 128 (vung_dat.json), dùng chung cho trang
//            game kc/dt_thung_lung.html và trang thử kc/dt_thu_3d.html?vung:
//            - vào vùng qua dt_may_chu.js (bản giả localStorage; TC_D02B3 đổi sang Supabase cùng
//              giao diện): Thủ lĩnh ở cổng (lần đầu) hoặc ở chỗ tính từ lệnh cuối; trữ lượng nguồn,
//              công trình, nông dân, kho của bé lấy từ máy chủ
//            - sương mù 3 mức (dt3d_suong_mu.js) nối vào lõi: lệnh đi chỉ qua ô đã biết + mép vùng
//              đen; nguồn còn trong vùng đen thì không chạm chọn được
//            - bé chọn chỗ dựng Lều trại: soi đất xanh / đỏ, chạm lần hai đúng chỗ xanh là dựng (máy
//              tính: rê chuột thấy xanh rồi bấm), Thủ lĩnh tới dựng, xong có nông dân (số trong
//              cau_hinh.json congTrinh.leu), nông dân ra là đi làm ngay
//            - khám phá: chạm nông dân rồi chạm chỗ tối; nút "🔭 Đi khám phá" cho nông dân rảnh
//              (hoặc nông dân đang chọn) tự đi mở vùng đen, mỗi người một hướng
//            - gửi máy chủ: lệnh đi + việc đang làm (lưu "lệnh"), thu hoạch gộp mỗi chuKyGui giây,
//              mặt nạ đã khám phá mỗi chuKyLuuKhamPha giây và lúc rời trang
//            - (TC_D02B3b) gửi thu hoạch xong thì HỎI LẠI máy chủ (cùng nhịp chuKyGui): Thủ lĩnh /
//              nông dân của bạn hiện ra và đi lại (vị trí tính mỗi khung từ lệnh cuối, chỉ hiện khi
//              đứng trong vùng sáng của mình, chạm vào chỉ xem không ra lệnh được); nhà mới của bạn
//              hiện ra, dựng xong thì đổi theo; nguồn cạn máy chủ cho mọc lại thì mọc lại đúng chỗ;
//              máy chủ cắt bớt thu hoạch (bạn lấy trước) thì kho trên máy trừ phần thừa
//            - (TC_D02C) Lều xong thì nút "🔨 Xây" mở menu: Tường cọc gỗ (chạm chỗ đầu rồi chạm 2 lần chỗ
//              cuối đoạn thẳng, kéo tiếp từ chỗ vừa xây), Cổng (3 ô, chạm lên tường dọc thì xoay dọc, đè lên
//              tường của mình được), Tháp canh (2 x 2, nhìn xa 8 ô); giá trừ khỏi kho, giới hạn số; người
//              đang chọn (không thì Thủ lĩnh) đi xây lần lượt; "🔨 Dựng tiếp" cho móng xây dở. Tường + cổng
//              đã xong khép kín = lãnh địa (tô vàng; của bạn tô đỏ): bạn không xây / không vào được
//            - (TC_D03A) chỉ nông dân xây (người đang chọn, không thì nông dân rảnh gần nhất; Thủ lĩnh chỉ Lều
//              trại); chọn nông dân rồi chạm móng đang xây = vào xây cùng (nhiều người nhanh hơn); lệnh đi gửi
//              kèm công trình đang xây để máy chủ giữ tiến độ. Thu hoạch gửi lúc ĐỒ VỀ KHO (sự kiện "cat" kèm
//              nguồn) -> kho máy chủ = kho trên máy, không vượt sức chứa; kho đầy thì báo. Vào lại sau khi vắng
//              mặt: báo phần dân làng đã làm (vao.vang). Ẩn trang quá vangMat.sauGiay giây rồi mở lại: tải lại
//              trang để lấy phần máy chủ đã tính bù. Lời báo mới theo giọng chuyên nghiệp (Ke_Hoach_Dau_Truong mục 11).
//              Góp ý người dùng thử: đang chọn chỗ xây thì chuột phải / Esc (máy tính), giữ ngón ~0,7 giây (điện
//              thoại) = bỏ chỗ đầu đoạn tường, lần nữa = thôi xây; cổng có nút "🔄 Xoay cổng" (phím R) đổi ngang / dọc.
//              Nút "🔭 Đi khám phá" chỉ hiện khi cau_hinh lang.khamPhaTuDo.mo (người dùng: tự dò đường dành cho
//              quân do thám, tốn lương thực, phải nâng cấp, từ Đồ đồng); Đồ đá khám phá bằng tay.
//            - (TC_D03B1) menu Xây thêm Nhà ở (+3 chỗ ở) + 4 kho riêng (Kho gỗ / đá / vàng / Vựa lương thực, mỗi kho
//              một loại, nông dân về chỗ cất gần nhất đúng loại); chạm Lều trại (cả khi chưa chọn ai) -> nút "🧑‍🌾 Sinh
//              nông dân" (chỉ nhà chính sinh nông dân; giá + giây ở cau_hinh congTrinh.leu.sinh), ô "👥 dân số/chỗ ở";
//              máy chủ ra người theo giờ máy chủ, tới giờ thì hỏi lại ngay để nhận người mới (đứng chờ việc, dấu "!").
//            - (TC_D03B2) menu Xây thêm 🌾 Ruộng (3 x 3, đặt ở bất kỳ chỗ nào hợp lệ; ô xanh gợi ý quanh Lều); chọn nông dân rồi chạm
//              ruộng = ra gặt (lúa chưa chín thì đứng chờ); chạm ruộng khi chưa chọn nông dân = xem ruộng (giây còn lại tới
//              chín / thành cỏ, lúa còn, số người gặt) + nút "🌱 Trồng lại" khi là bãi đã gặt; người vừa gặt ruộng đó
//              đang rảnh thì tự ra lại. Giờ ruộng máy chủ trả đổi sang đồng hồ của lõi (gioLoi); hỏi lại máy chủ thì
//              lúa của ruộng mình theo máy chủ (lang.dongBoRuong). Lời báo vắng mặt có số ruộng gặt xong.
// HÀM KHAI RA:
//   vaoThungLung(the) -> Promise<vung>   (gọi sau khi đã dựng lõi + các phần vẽ, trước khung đầu)
//     the = { ctx, cam, lang, banDo, cauHinh, diaHinh, boNv, dk, uiDk (ui đã đưa cho dk: thêm móc),
//             be: { ten, hoSo, tenThuLinh }, themNongDan(x, z) -> dv, $, baoGoiY, kho (localStorage | null),
//             capNhatKho? () (vẽ lại thanh tài nguyên khi kho bị trừ, TC_D02B3b) }
//     vung = { dvTl, hTl, suong, veSuong, mayChu, vao, batDau() (sau khung đầu), moc (kịch bản thử) }
//   Không vào được (thung lũng đầy...): ném lỗi, err.lyDo là câu cho bé.
//     the.mayChu (TC_D02B3a): máy chủ thật dt/dt_may_chu_sb.js (trang game); không có thì máy chủ giả.
//     Có máy chủ thật: nguồn cạn chỉ mọc lại theo máy chủ (lang.datMocTheoMayChu, TC_D02B3b).
// BƯỚC: TC_D02B2b (tách từ chế độ ?vung của dt3d_thu.js, TC_D02B2a); TC_D02B3a (máy chủ Supabase, sửa
//       trữ lượng theo số máy chủ trả, lều của bạn khác không là chỗ cất đồ); TC_D02B3b (hỏi lại máy
//       chủ: thấy bạn đi lại, nhà của bạn, mọc lại theo giờ máy chủ, trừ kho phần máy chủ cắt);
//       TC_D02C (menu Xây: tường, cổng, tháp canh; lãnh địa); TC_D03A (nông dân xây, tiến độ máy chủ, vắng mặt, sức chứa);
//       TC_D03B1 (4 kho, nhà ở, dân số, Lều sinh nông dân); TC_D03B2 (ruộng); TC_D03C (Chòi hái lượm, Chòi mỏ)
// NGÀY: 27/10/2026; 27/10/2026 18:55; 27/10/2026 20:55; 28/10/2026 00:05; 28/10/2026 10:50; 28/10/2026 12:17; 28/10/2026 15:30; 28/10/2026 19:05; 28/10/2026 23:35
// PHỤ THUỘC: dt/dt_ban_do.js (KC_DT_BAN_DO), dt/dt_may_chu.js (KC_DT_MAY_CHU), dt3d_suong_mu.js, dt3d_o_xay.js
// ================================================================
import { taoVeSuong } from "./dt3d_suong_mu.js";
import { taoSoiDat, taoVeLanhDia } from "./dt3d_o_xay.js";

const BD = window.KC_DT_BAN_DO, MC = window.KC_DT_MAY_CHU, NV = window.KC_NV, KC_LANG = window.KC_DT_LANG;
const VIEC_DAU = ["cay", "cay", "bui_trai_cay"]; // nông dân vừa ra: 2 người chặt cây, 1 người hái trái cây
// Menu "🔨 Xây" (TC_D02C): thứ tự nút, biểu tượng. TC_D03B1: 4 kho riêng + Nhà ở
const MENU_XAY = [["tuong", "🧱"], ["cong", "🚪"], ["thap_canh", "🗼"], ["nha_o", "🏠"], ["ruong", "🌾"],
  ["kho_go", "📦🪵"], ["kho_da", "📦🪨"], ["kho_vang", "📦🪙"], ["vua_luong_thuc", "📦🍖"],
  ["choi_hai_luom", "🧺"], ["choi_mo", "⛏️"]]; // TC_D03B2: + Ruộng; TC_D03C: + 2 chòi
const LA_KHO = { kho_go: "go", kho_da: "da", kho_vang: "vang", vua_luong_thuc: "luong_thuc" }; // kho -> loại tài nguyên chứa
const LA_CHOI = { choi_hai_luom: "🧺", choi_mo: "⛏️" }; // TC_D03C: chòi = chỗ cất (congTrinh.*.cat), không thêm sức chứa

export async function vaoThungLung(the) {
  const { ctx, cam, lang, banDo, cauHinh, boNv, dk, uiDk, be, $, baoGoiY, themNongDan } = the;
  const CB = cauHinh.banDo, CT = cauHinh.congTrinh, W = banDo.rong, H = banDo.cao;
  const ten = be.ten, tenChuan = String(ten).trim().toLowerCase();
  const R = CT.leu.rong, S = CT.leu.sau;

  // ---------------- Vào vùng: trạng thái chung từ máy chủ ----------------
  const mayChu = the.mayChu || MC.taoMayChuGia({ vung: banDo, cauHinh, kho: the.kho });
  const vao = await mayChu.vaoVung(ten, be.hoSo.chungLoai);
  if (!vao.ok) throw Object.assign(new Error(vao.lyDo), { lyDo: vao.lyDo });
  if (the.mayChu) lang.datMocTheoMayChu(true); // bản đồ chung: cây / mỏ cạn chỉ mọc lại theo máy chủ
  const quanh = await mayChu.layQuanh(ten);
  for (const n of quanh.nguon || []) lang.capNhatNguon(n.ma, n.con);
  for (const k in vao.kho) if (k in lang.kho) lang.kho[k] = vao.kho[k];

  // ---------------- Sương mù -> lõi ----------------
  const suong = BD.taoSuongMu(W, H);
  suong.nap(vao.khamPha);
  const veSuong = taoVeSuong(ctx, suong);
  const soiLai = () => {
    const ds = lang.donVi.map(d => ({ x: d.x, z: d.z, r: BD.tamNhin(CB, d.vaiTro, lang.chungLoai) }));
    for (const c of lang.congTrinh) if (c.xong && c.chu === tenChuan) ds.push({ x: c.x + c.rong / 2, z: c.y + c.sau / 2, r: BD.tamNhinCt(CB, c.loai, lang.chungLoai) });
    if (suong.soi(ds)) veSuong.capNhat();
  };
  const daBiet = (x, y) => suong.daKham[y * W + x] === 1;
  lang.datBiet(daBiet, soiLai, dv => BD.timBienKhamPha(lang, suong, dv.x, dv.z,
    lang.donVi.filter(d => d !== dv && d.tuKhamPha && d.dich).map(d => d.dich), CB.cachNhauKhamPha));

  // ---------------- Lãnh địa (TC_D02C) ----------------
  // Tường + cổng ĐÃ XONG của mỗi bé (của mình + của bạn máy chủ đã cho thấy) -> loang ô tính lãnh địa
  const lanhDia = BD.taoBoLanhDia(W, H), veLd = taoVeLanhDia(ctx, the.diaHinh, W, H);
  const oRaoMinh = new Map(); // ô -> công trình tường / cổng của mình (cả móng): cổng đè tường, đoạn tường nối góc
  let ldDoi = false, soOLd = -1;
  lang.nghe(su => {
    const ct = su.ct;
    if (!ct || !BD.LA_RAO[ct.loai]) return;
    const co = su.loai !== "bo_cong_trinh";
    if (su.loai === "cong_trinh" || su.loai === "bo_cong_trinh") {
      if (ct.cuaMinh !== false) for (let oy = ct.y; oy < ct.y + ct.sau; oy++) for (let ox = ct.x; ox < ct.x + ct.rong; ox++) { if (co) oRaoMinh.set(oy * W + ox, ct); else oRaoMinh.delete(oy * W + ox); }
      if (co && !ct.xong) return;
    } else if (su.loai !== "xay_xong") return;
    lanhDia.dat(ct.chu, ct.x, ct.y, ct.rong, ct.sau, co);
    ldDoi = true;
  });
  const laTuongMinh = (x, y) => { const c = oRaoMinh.get(y * W + x); return !!c && c.loai === "tuong" && x >= 0 && y >= 0 && x < W && y < H; };
  const laRaoMinh = (x, y) => x >= 0 && y >= 0 && x < W && y < H && oRaoMinh.has(y * W + x);
  // Vẽ lại lãnh địa + báo bé khi lãnh địa của mình vừa khép / rộng ra / bị hở
  function capNhatLd(im) {
    if (!ldDoi) return;
    ldDoi = false;
    const khac = [];
    for (const chu of new Set([...ctBan.values()].map(c => c.chu))) { const m = lanhDia.cua(chu); if (m) khac.push(m); }
    veLd.ve(lanhDia.cua(tenChuan), khac);
    const so = lanhDia.soO(tenChuan);
    if (!im && soOLd >= 0 && so !== soOLd) {
      if (so > 0 && soOLd === 0) baoGoiY("🎉 Con đã rào kín làng! Lãnh địa có " + so + " ô (tô vàng): bạn khác không vào được, không xây được trong đó.");
      else if (so > soOLd) baoGoiY("🎉 Lãnh địa rộng ra: " + so + " ô.");
      else if (so === 0) baoGoiY("⚠️ Tường đang hở nên chưa có lãnh địa. Con rào kín lại nhé!");
    }
    soOLd = so;
  }

  // ---------------- Công trình ----------------
  let leuBe = null;
  const ctBan = new Map(); // nhà của bạn: id máy chủ -> công trình lõi (TC_D02B3b)
  // TC_D03B2: giờ ruộng máy chủ trả (giờ máy chủ) -> đồng hồ của lõi (máy bé lệch giờ vẫn chín đúng lúc)
  const gioLoi = t => (t == null ? null : t - (mayChu.gio() - lang.bayGio()));
  const ruongMc = c => ({ trongLuc: gioLoi(c.trongLuc), gatLuc: gioLoi(c.gatLuc), con: c.con });
  function nhanCongTrinh(c) {
    const ct = lang.themCongTrinh(Object.assign({ id: c.id, chu: c.chu, cuaMinh: c.chu === tenChuan, loai: c.loai, x: c.x, y: c.y, rong: c.rong, sau: c.sau, xong: !!c.xongLuc,
      giayXay: (CT[c.loai] || CT.leu).giayXay, cap: c.cap || 1, tienDo: Number.isFinite(c.tienDo) ? c.tienDo : 0, xayLuc: c.xayLuc }, // TC_D03A: tiến độ máy chủ giữ
      c.loai === "ruong" && Number.isFinite(c.trongLuc) ? ruongMc(c) : {})); // TC_D03B2: lúa theo máy chủ
    if (c.chu !== tenChuan) ctBan.set(c.id, ct);
    else if (c.loai === "leu") leuBe = ct;
    return ct;
  }
  for (const c of quanh.congTrinh || []) nhanCongTrinh(c);
  capNhatLd(true);
  function dongBoCongTrinh(ds) {
    const con = new Set();
    for (const c of ds || []) {
      if (c.chu === tenChuan) { // nhà của mình: máy này tự giữ; TC_D03B2: lúa của ruộng theo máy chủ (trồng muộn hơn / đã gặt hết / máy khác trồng lại)
        if (c.loai === "ruong" && Number.isFinite(c.trongLuc)) lang.dongBoRuong(c.id, ruongMc(c));
        continue;
      }
      con.add(c.id);
      const ct = ctBan.get(c.id);
      if (!ct) nhanCongTrinh(c);
      else {
        if (c.xongLuc) lang.xongCongTrinh(ct);
        else if (Number.isFinite(c.tienDo)) ct.tienDo = c.tienDo; // TC_D03A: nhà bạn lớn theo tiến độ máy chủ
        if (c.loai === "ruong" && Number.isFinite(c.trongLuc)) Object.assign(ct, ruongMc(c)); // TC_D03B2: ruộng bạn chín / gặt theo máy chủ
      }
    }
    // Máy chủ trả mọi nhà ở vùng đã khám phá (chỉ thêm, không bớt): nhà bạn đã thấy mà nay không còn
    // là đã bị bỏ (TC_D02C: bạn đặt cổng đè lên tường)
    for (const [id, ct] of ctBan) if (!con.has(id)) { lang.boCongTrinh(ct); ctBan.delete(id); }
  }

  // ---------------- Thủ lĩnh + nông dân ----------------
  let dangNap = true; // đang dựng lại theo máy chủ: không gửi lại lệnh cũ
  const viTriCua = d => (d.lenh ? BD.viTriTuLenh(lang, d.lenh, mayChu.gio(), null, tenChuan) : { x: d.x, z: d.z, xong: true });
  const dvMcTl = vao.donVi.find(d => d.loai === "thu_linh");
  const pTl = viTriCua(dvMcTl);
  const dvTl = lang.themDonVi("thu_linh", pTl.x, pTl.z, be.tenThuLinh || "Thủ lĩnh");
  dvTl.idMayChu = dvMcTl.id;
  const hTl = boNv.tao(dvTl, "thu_linh", be.hoSo);
  soiLai();
  // Lều đang dựng dở: Thủ lĩnh dựng tiếp SAU khi nạp xong (gửi lại lệnh kèm công trình để máy chủ tính tiến độ)
  if (!(leuBe && !leuBe.xong) && !pTl.xong) lang.lenhDi(dvTl, { x: dvMcTl.lenh.den[0], y: dvMcTl.lenh.den[1] }); // đang đi dở: đi tiếp

  const dsNd = [];
  // TC_D03A (người dùng): tự dò đường dành cho quân do thám từ Đồ đồng; Đồ đá chỉ khám phá bằng tay
  const coTuKham = !!(cauHinh.lang.khamPhaTuDo && cauHinh.lang.khamPhaTuDo.mo);
  const ctMinh = id => lang.congTrinh.find(c => c.id === id && c.cuaMinh !== false && !c.xong) || null;
  function nhanNongDan(d) {
    const cu = dsNd.find(x => x.idMayChu === d.id);
    if (cu) return cu; // đã có (báo xong lều sau khi máy chủ đã sinh sẵn nông dân)
    const p = viTriCua(d), l = d.lenh;
    const dv = themNongDan(p.x, p.z);
    dv.idMayChu = d.id; dsNd.push(dv);
    const n = l && l.viec != null ? lang.nguonTheoMa(l.viec) : null;
    const ctXay = l && Number.isInteger(l.xay) ? ctMinh(l.xay) : null;
    if (ctXay) lang.lenhXay(dv, ctXay, (l.hang || []).map(ctMinh).filter(Boolean)); // TC_D03A: đang xây thì xây tiếp
    else if (n && (lang.dangSong(n) || lang.choRuong(n))) lang.giaoViec(dv, n); // TC_D03B2: ruộng đang lớn: ra đứng chờ
    else if (l && l.khamPha) { if (!coTuKham || !lang.khamPhaTuDo(dv)) dv.ranh = true; }
    else if (l && !p.xong) lang.lenhDi(dv, { x: l.den[0], y: l.den[1] });
    else if (l && l.viec != null) dv.ranh = true; // nguồn đang làm đã hết: đứng chờ việc
    else if (!l || (l.xay == null && !l.khamPha)) dv.ranh = true; // TC_D03A: không có việc (xây xong lúc vắng mặt...): dấu "!"
    return dv;
  }
  for (const d of vao.donVi) if (d.loai === "nong_dan") nhanNongDan(d);

  // ---------------- Bạn trong thung lũng (TC_D02B3b) ----------------
  // Quân bạn KHÔNG vào lõi (không soi sương của mình, không chắn đường, không nhận lệnh): mỗi người
  // một "đơn vị đọc" cho bộ vẽ nhân vật, vị trí tính lại mỗi khung từ lệnh cuối máy chủ trả.
  const DANG_DI = [{}]; // đường không rỗng: bộ vẽ cho động tác đi
  const ban = new Map(); // id máy chủ -> { d (đơn vị máy chủ), dv, h }
  const nhoDuong = new WeakMap();
  let soNdBan = 0;
  function themBan(d) {
    const laTl = d.loai === "thu_linh", cl = d.chungLoai || "nhan";
    const dv = { laBan: true, chu: d.chu, vaiTro: d.loai, ten: (laTl ? "Thủ lĩnh" : "Nông dân") + " của " + d.chu,
      x: d.x, z: d.z, huongMuon: 0, duong: [], trangThai: "dung", viec: null, mang: { loai: null, so: 0 }, ranh: false, chay: false };
    const h = boNv.tao(dv, laTl ? "thu_linh" : "nong_dan", laTl ? NV.chuanHoa({ chungLoai: cl }) : NV.hoSoNongDan(cl, soNdBan++));
    h.vo.visible = false;
    return { d, dv, h };
  }
  function dongBoBan(ds) {
    const con = new Set();
    for (const d of ds || []) {
      if (d.chu === tenChuan) continue;
      con.add(d.id);
      const b = ban.get(d.id);
      if (!b) ban.set(d.id, themBan(d));
      else if (JSON.stringify(b.d.lenh) !== JSON.stringify(d.lenh)) b.d = d; // lệnh mới: tìm đường lại
    }
    for (const [id, b] of ban) if (!con.has(id)) { boNv.xoa(b.h); ban.delete(id); } // ra khỏi vùng sáng: máy chủ thôi trả
  }
  function veBan() {
    const bay = mayChu.gio();
    for (const b of ban.values()) {
      const l = b.d.lenh, dv = b.dv;
      const p = l ? BD.viTriTuLenh(lang, l, bay, nhoDuong, b.d.chu) : { x: b.d.x, z: b.d.z, huong: dv.huongMuon, xong: true };
      dv.x = p.x; dv.z = p.z; dv.huongMuon = p.huong; dv.chay = !!p.chay;
      dv.duong = p.xong ? [] : DANG_DI;
      const n = p.xong && l && l.viec != null ? lang.nguonTheoMa(l.viec) : null;
      if (n && lang.dangSong(n)) { dv.trangThai = "lam"; dv.viec = n; dv.huongMuon = Math.atan2(n.x - dv.x, n.z - dv.z); }
      else { dv.trangThai = "dung"; dv.viec = null; }
      b.h.vo.visible = suong.muc(Math.floor(dv.x), Math.floor(dv.z)) === BD.SANG;
    }
  } // TC_D03A: nhà bạn đang dựng lớn theo tiến độ máy chủ trả (dongBoCongTrinh), không đoán theo giờ đặt móng
  dongBoBan(quanh.donVi);

  // ---------------- Gửi máy chủ ----------------
  const gui = (dv, lenh) => { if (!dangNap && dv.idMayChu) mayChu.guiLenh(ten, dv.idMayChu, lenh); };
  let gom = {};
  // Phần máy chủ cắt bớt (bạn lấy trước / nhanh quá tốc độ): trừ dần khỏi kho trên máy (đồ còn đang
  // vác thì trừ khi về kho) -> kho trên máy luôn khớp máy chủ, không phải chờ tải lại
  const no = {};
  const taiNguyenO = ma => { if (ma < 0) return lang.CH.nguon.ruong.taiNguyen; const x = ma % W, k = banDo.kyHieu[banDo.o[(ma - x) / W][x]], ng = k && lang.CH.nguon[k[0]]; return ng ? ng.taiNguyen : null; };
  function truNo() {
    let doi = false;
    for (const k in no) { const t = Math.min(no[k], lang.kho[k] || 0); if (t > 0) { lang.kho[k] -= t; no[k] -= t; doi = true; } }
    if (doi && the.capNhatKho) the.capNhatKho();
  }
  const guiThuHoach = giu => {
    const ds = Object.keys(gom).map(ma => ({ ma: Number(ma), so: gom[ma] }));
    if (!ds.length) return Promise.resolve();
    gom = {};
    // máy chủ thật trả trữ lượng còn lại: bạn khác lấy trước thì cây / mỏ trên máy mình vơi theo
    return mayChu.guiThuHoach(ten, ds, giu).then(kq => {
      if (!kq || !kq.ok) return;
      const daGui = new Map(ds.map(d => [d.ma, d.so]));
      for (const d of kq.ds) {
        if (Number.isFinite(d.con)) lang.capNhatNguon(d.ma, d.con);
        const thua = (daGui.get(d.ma) || 0) - (d.duoc || 0), tn = thua > 0 && taiNguyenO(d.ma);
        if (tn) no[tn] = (no[tn] || 0) + thua;
      }
      truNo();
    });
  };
  // Trữ lượng theo máy chủ: vơi theo bạn chặt; nguồn đã cạn mà máy chủ còn trữ lượng (mọc lại theo
  // giờ máy chủ: máy chủ bỏ dòng = đầy lại) thì mọc lại đúng chỗ
  function dongBoNguon(ds) {
    const con = new Map((ds || []).map(n => [n.ma, n.con]));
    for (const [ma, c] of con) lang.capNhatNguon(ma, c);
    for (const ma of lang.nguonDaCan()) {
      if (ma in gom) continue; // vừa chặt hết trên máy này, máy chủ chưa nhận
      const c = con.has(ma) ? con.get(ma) : Infinity;
      if (c > 0) lang.mocLaiNguon(ma, c);
    }
  }
  // Mỗi chuKyGui giây: gửi thu hoạch, CHỜ xong rồi mới hỏi lại (khỏi lấy trạng thái cũ hơn lần gửi)
  let dangHoi = false;
  async function chuKy() {
    if (dangHoi) return;
    dangHoi = true;
    try {
      await guiThuHoach();
      for (const { ct, dv } of [...choBaoXong.values()]) await xongCt(ct, dv, true); // TC_D03A
      const q = await mayChu.layQuanh(ten);
      if (q && q.ok) { dongBoNguon(q.nguon); dongBoCongTrinh(q.congTrinh); dongBoBan(q.donVi); dongBoMinh(q); }
    } finally { dangHoi = false; }
  }
  // TC_D03B1: nông dân Lều trại vừa sinh (máy chủ tạo theo giờ máy chủ) -> thêm vào làng, đứng chờ việc (dấu "!")
  function dongBoMinh(q) {
    if (q.hang !== undefined) hang = q.hang;
    if (!leuDaNhan) return; // lều vừa xong: nông dân đầu tiên nhận qua leuXong (giao việc đầu)
    let moi = 0;
    for (const d of q.donVi || []) {
      if (d.chu !== tenChuan || d.loai !== "nong_dan" || dsNd.some(x => x.idMayChu === d.id)) continue;
      nhanNongDan(d); moi++;
    }
    if (moi) { boNv.reo(hTl, 1.5); baoGoiY("🧑‍🌾 +" + moi + " nông dân · dân số " + lang.danSo() + "/" + lang.choO() + "."); capNhatNut(); }
  }
  const daBaoDay = {}; // kho đầy: báo một lần mỗi loại tới khi kho có chỗ lại
  lang.nghe(su => {
    switch (su.loai) {
      case "cat": // TC_D03A: gửi thu hoạch lúc đồ về kho (đúng số đã cất, đúng nguồn)
        for (const ma in su.tu || {}) gom[ma] = (gom[ma] || 0) + su.tu[ma];
        if (lang.kho[su.taiNguyen] < lang.sucChua(su.taiNguyen)) daBaoDay[su.taiNguyen] = false;
        truNo(); break;
      case "kho_day": {
        const t = su.taiNguyen, tn = lang.CH.taiNguyen[t];
        if (!daBaoDay[t]) baoGoiY("📦 Kho " + tn.ten + " đầy (" + lang.kho[t] + "/" + lang.sucChua(t) + " " + tn.bieuTuong + ").");
        daBaoDay[t] = true; break;
      }
      case "lenh_di": gui(su.dv, { tu: [su.tu.x, su.tu.z], den: [su.den.x, su.den.y], khamPha: su.khamPha, xay: su.xay, hang: su.hang }); break;
      case "giao_viec": gui(su.dv, { tu: [su.dv.x, su.dv.z], den: [su.n.o.x, su.n.o.y], viec: su.n.ma }); break;
      case "xay_xong": if (su.ct === leuBe) leuXong(); else if (su.dv && su.ct.cuaMinh !== false) xongCt(su.ct, su.dv); break;
      case "xay_ket":
        if (su.ct === leuBe) { if (su.dv === dvTl) baoGoiY("👑 " + dvTl.ten + " chưa tới được chỗ dựng lều. Con bấm 🔨 Dựng tiếp nhé."); }
        else baoGoiY((su.dv === dvTl ? "👑 " : "🧑‍🌾 ") + su.dv.ten + " chưa tới được một chỗ xây (cây hoặc tường chắn lối). Con bấm 🔨 Xây → Dựng tiếp nhé.");
        capNhatNut(); break;
      case "het_kham_pha": baoGoiY("🔭 " + su.dv.ten + " đã khám phá hết chỗ đi được quanh đây!"); break;
    }
  });

  // ---------------- Chọn chỗ xây: Lều trại (TC_D02B2b); Tường / Cổng / Tháp canh (TC_D02C) ----------------
  // cheDo: null | "leu" | "tuong" | "cong" | "thap_canh". Chạm 2 lần đúng chỗ xanh là xây (máy tính: rê
  // chuột thấy xanh rồi bấm). Tường: chạm chỗ đầu, rồi chạm 2 lần chỗ cuối đoạn; xong đoạn thì kéo tiếp
  // từ chỗ vừa xây.
  // Điều kiện ô xây được trên máy bé: sương, người của bạn đang đứng (đang thấy), lãnh địa bạn, cổng đè tường mình
  const coBanDung = (x, y) => { for (const b of ban.values()) if (b.h.vo.visible && Math.floor(b.dv.x) === x && Math.floor(b.dv.z) === y) return true; return false; };
  const MR = CT.ruong.ruong; // TC_D03B2
  const theXay = loai => ({ lang, suong, coDoiThu: coBanDung, laLanhDiaDoiThu: (x, y) => !!lanhDia.chuO(x, y, tenChuan), deLen: loai === "cong" ? laTuongMinh : null });
  const soiDat = taoSoiDat(ctx, the.diaHinh, (x, y, r, s) => BD.oXayDuocVung(theXay(cheDo), x, y, r, s));
  let cheDo = null, choXem = null, dangGui = false, menuMo = false, dauTuong = null;
  const TN = lang.CH.taiNguyen;
  const thieuGia = (gia, n) => { for (const t in gia || {}) if ((lang.kho[t] || 0) < gia[t] * n) return t; return null; };
  const giaChu = (gia, n) => Object.keys(gia || {}).map(t => gia[t] * n + " " + TN[t].bieuTuong).join(" + ") || "miễn phí";
  const catChu = loai => (CT[loai].cat || []).filter(t => TN[t]).map(t => TN[t].bieuTuong).join(" "); // TC_D03C: loại chòi nhận cất
  const loiThieu = (gia, n) => { const t = thieuGia(gia, n); return t ? "❌ " + BD.LY_DO.thieu(TN[t].ten.toLowerCase()) + " (cần " + giaChu(gia, n) + ")" : null; };
  function truKho(gia, n) { for (const t in gia || {}) lang.kho[t] = Math.max(0, (lang.kho[t] || 0) - gia[t] * n); if (the.capNhatKho) the.capNhatKho(); }
  const cuaMinh = loai => lang.congTrinh.filter(c => c.cuaMinh !== false && c.loai === loai);
  // Móng nằm giữa chỗ chạm; cổng: 3 x 1, chạm lên tường dọc của mình thì xoay dọc. TC_D03A (góp ý người dùng):
  // nút "🔄 Xoay cổng" / phím R chọn hẳn ngang / dọc (xoayTay); chưa bấm thì tự theo hướng tường.
  let xoayTay = null, oCongXem = null;
  function choDat(loai, o) {
    const m = CT[loai];
    if (loai === "cong") {
      const a = BD.choCong(o.x, o.y, m.rong, m.sau, laTuongMinh);
      if (xoayTay == null || a.xoay === xoayTay) return a;
      return xoayTay ? { x: o.x - Math.floor(m.sau / 2), y: o.y - Math.floor(m.rong / 2), rong: m.sau, sau: m.rong, xoay: true }
        : { x: o.x - Math.floor(m.rong / 2), y: o.y - Math.floor(m.sau / 2), rong: m.rong, sau: m.sau, xoay: false };
    }
    return { x: Math.round(o.px - m.rong / 2), y: Math.round(o.pz - m.sau / 2), rong: m.rong, sau: m.sau, xoay: false };
  }
  // Chỗ xây được gần Thủ lĩnh nhất: hiện sẵn ô xanh để bé thấy ngay "chỗ xanh" là gì
  function choGoiY(loai) {
    const m = CT[loai], the2 = theXay(loai), goc = loai === "ruong" && leuBe ? { x: leuBe.x + R / 2, z: leuBe.y + S / 2 } : dvTl; // TC_D03B2: ruộng quanh Lều
    const cx = Math.floor(goc.x - m.rong / 2 + 0.5), cy = Math.floor(goc.z - m.sau / 2 + 0.5);
    for (let r = 2; r <= 10; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      if (BD.oXayDuocVung(the2, cx + dx, cy + dy, m.rong, m.sau).duoc) return { x: cx + dx, y: cy + dy, rong: m.rong, sau: m.sau, xoay: false };
    }
    return null;
  }
  // Đoạn tường từ chỗ đầu tới ô o: ô đã có tường / cổng của mình bỏ qua (nối góc), còn lại phải xây được
  function kiemDoan(ds) {
    const the2 = theXay("tuong"), hong = new Map();
    let moi = 0, dau = null;
    for (const c of ds) {
      if (laRaoMinh(c.x, c.y)) continue;
      moi++;
      const k = BD.oXayDuoc(the2, c.x, c.y);
      if (!k.duoc) { hong.set(c.y * W + c.x, k); if (!dau) dau = k; }
    }
    return { moi, hong, dau };
  }
  function chamTuong(o, kieu) {
    if (!dauTuong) { // chỗ đầu đoạn
      const k = laRaoMinh(o.x, o.y) ? { duoc: true } : BD.oXayDuoc(theXay("tuong"), o.x, o.y);
      soiDat.hienO([o], () => !k.duoc);
      if (kieu === "re") return;
      if (!k.duoc) { baoGoiY("❌ " + k.lyDo); return; }
      dauTuong = { x: o.x, y: o.y }; choXem = null;
      baoGoiY("🧱 Giờ chạm chỗ CUỐI của đoạn tường (thẳng ngang hoặc dọc, tối đa " + CT.tuong.doanToiDa + " ô), chạm 2 lần để xây.");
      return;
    }
    const ds = BD.doanTuong(dauTuong, o, CT.tuong.doanToiDa), kq = kiemDoan(ds), cuoi = ds[ds.length - 1];
    soiDat.hienO(ds, (x, y) => kq.hong.has(y * W + x));
    const thieu = kq.moi ? loiThieu(CT.tuong.gia, kq.moi) : null, duoc = !kq.dau && !thieu && kq.moi > 0;
    if (kieu === "re") { choXem = duoc ? cuoi : null; return; }
    if (kq.dau) { choXem = null; baoGoiY("❌ " + kq.dau.lyDo); return; }
    if (!kq.moi) { choXem = null; baoGoiY("Chỗ này đã có tường rồi. Con chạm chỗ khác để kéo tường tiếp nhé."); return; }
    if (thieu) { choXem = null; baoGoiY(thieu); return; }
    if (!(choXem && choXem.x === cuoi.x && choXem.y === cuoi.y)) { choXem = cuoi; baoGoiY("✅ Đoạn tường " + kq.moi + " ô, giá " + giaChu(CT.tuong.gia, kq.moi) + ". Chạm lần nữa vào chỗ cuối để xây nhé."); return; }
    xayDoan(ds);
  }
  function chamCho(o, kieu) {
    if (cheDo === "cong") oCongXem = o;
    const a = choDat(cheDo, o), kq = soiDat.hien(a.x, a.y, a.rong, a.sau);
    const cungCho = choXem && choXem.x === a.x && choXem.y === a.y && !!choXem.xoay === !!a.xoay;
    if (kieu === "re") { choXem = kq.duoc ? a : null; return; }
    if (!kq.duoc) { choXem = null; baoGoiY("❌ " + kq.lyDo); return; }
    if (!cungCho) {
      choXem = a;
      baoGoiY(cheDo === "leu" ? "✅ Chỗ này dựng được Lều trại! Chạm lần nữa vào chỗ xanh để dựng nhé."
        : "✅ Chỗ này xây được " + CT[cheDo].ten + " (" + giaChu(CT[cheDo].gia, 1) + "). Chạm lần nữa vào chỗ xanh để xây nhé.");
      return;
    }
    if (cheDo === "leu") dungLeu(a); else dungCt(cheDo, a);
  }
  function batCheDo(loai) {
    cheDo = loai || null; choXem = null; dauTuong = null; xoayTay = null; oCongXem = null; soiDat.an();
    if (!cheDo) { dk.datCheDoCham(null); capNhatNut(); return; }
    menuMo = false;
    if (cheDo !== "tuong" && cheDo !== "cong") { const g = choGoiY(cheDo); if (g) { soiDat.hien(g.x, g.y, g.rong, g.sau); choXem = g; } } // chạm đúng ô xanh này là xây luôn
    dk.datCheDoCham((o, kieu) => (cheDo === "tuong" ? chamTuong(o, kieu) : chamCho(o, kieu)));
    capNhatNut();
  }
  const batChonCho = bat => batCheDo(bat ? "leu" : null);
  // Xoay cổng ngang <-> dọc rồi soi lại chỗ đang xem (chạm lần nữa vào đúng chỗ là xây theo hướng mới)
  function xoayCong() {
    if (cheDo !== "cong") return;
    xoayTay = !(choXem ? choXem.xoay : xoayTay);
    if (oCongXem) chamCho(oCongXem, "re");
    baoGoiY("🔄 Cổng " + (xoayTay ? "dọc (1 × 3)" : "ngang (3 × 1)") + ".");
    capNhatNut();
  }
  // TC_D03A (góp ý người dùng): đang chọn chỗ xây thì lùi một bước: đoạn tường đã có chỗ đầu -> bỏ chỗ đầu; còn lại
  // -> thôi xây. Máy tính: chuột phải. Điện thoại: giữ ngón ~0,7 giây (chạm nhanh vẫn là chạm; kéo / 2 ngón thì không tính).
  const laMay = typeof matchMedia === "function" && matchMedia("(hover: hover) and (pointer: fine)").matches;
  function luiMotBuoc() {
    if (!cheDo) return false;
    if (cheDo === "tuong" && dauTuong) {
      dauTuong = null; choXem = null; soiDat.an();
      baoGoiY("↩️ Đã bỏ chỗ đầu đoạn tường.");
      return true;
    }
    batCheDo(null);
    baoGoiY("Đã thôi xây.");
    return true;
  }
  {
    const cv = ctx.renderer.domElement;
    cv.addEventListener("contextmenu", e => { if (cheDo) { e.preventDefault(); luiMotBuoc(); } });
    let giu = null;
    const thoiGiu = () => { if (giu) { clearTimeout(giu.t); giu = null; } };
    cv.addEventListener("pointerdown", e => {
      if (e.pointerType === "mouse" || !cheDo) return;
      if (giu) { thoiGiu(); return; } // ngón thứ hai (phóng to): không tính
      giu = { x: e.clientX, y: e.clientY, t: setTimeout(() => { giu = null; luiMotBuoc(); }, 700) };
    });
    cv.addEventListener("pointermove", e => { if (giu && Math.hypot(e.clientX - giu.x, e.clientY - giu.y) > 12) thoiGiu(); });
    cv.addEventListener("pointerup", thoiGiu);
    cv.addEventListener("pointercancel", thoiGiu);
    addEventListener("keydown", e => {
      if (!cheDo || e.target.closest && e.target.closest("input, textarea")) return;
      if (e.key === "Escape") luiMotBuoc();
      else if ((e.key === "r" || e.key === "R") && cheDo === "cong") xoayCong();
    });
  }
  // TC_D03A - Ai xây: nông dân đang chọn; không thì nông dân rảnh gần móng nhất; không ai rảnh thì nông dân gần
  // nhất (bỏ việc đang làm). Thủ lĩnh không xây (trừ Lều trại). Đang xây dở thì xếp thêm vào hàng.
  function chonTho(ct) {
    const c = dk.dangChon();
    if (c && !c.dv.laBan && lang.duocXay(c.dv.vaiTro, ct.loai)) return c.dv;
    const gan = ds => ds.sort((a, b) => Math.hypot(a.x - ct.x, a.z - ct.y) - Math.hypot(b.x - ct.x, b.z - ct.y))[0] || null;
    return gan(dsNd.filter(d => d.ranh || (d.trangThai === "dung" && !d.viec && !d.xay))) || gan(dsNd.slice());
  }
  function giaoXay(ds) {
    const dv = chonTho(ds[0]);
    if (!dv) return null;
    const dangLam = dv.xay && !dv.xay.xong && dv.trangThai !== "dung";
    const hang = (dangLam ? (dv.hangXay || []) : []).concat(ds.filter(ct => ct !== dv.xay));
    if (dangLam) { dv.hangXay = hang; return dv; }
    dv.hangXay = hang;
    return lang.xayTiep(dv) ? dv : null;
  }
  const loiGiao = (dv, ten2) => (dv ? (dv === dvTl ? "👑 " : "🧑‍🌾 ") + dv.ten + " đang tới xây " + ten2 + "."
    : !dsNd.length ? "❌ Chưa có nông dân để xây." : "❌ Chưa có lối tới chỗ xây.");
  // Chọn nông dân rồi chạm móng đang xây của mình: vào xây cùng (TC_D03A). Trả true nếu đã xử lý cú chạm.
  // TC_D03B1: chạm Lều trại đã xong (cả khi chưa chọn ai; tính rộng thêm 1 ô vì chạm mái lều tia rơi sau lều)
  // -> mở phần Lều: dân số + nút sinh nông dân; chạm chỗ khác thì đóng.
  uiDk.chamO = (h, o) => {
    if (leuBe && leuBe.xong && o.x >= leuBe.x - 1 && o.x <= leuBe.x + R && o.y >= leuBe.y - 1 && o.y <= leuBe.y + S) {
      moLeu(true); return true;
    }
    if (leuMo) moLeu(false);
    // TC_D03B2: chạm ruộng của mình: đang chọn nông dân -> ra gặt (lúa chưa chín thì đứng chờ trên ruộng);
    // không -> xem ruộng (bãi đã gặt: nút trồng lại)
    const nr = lang.ruongTaiO(o.x, o.y);
    if (nr) {
      if (h && !h.dv.laBan && h.vaiTro === "nong_dan" && nr.trangThai !== "het") {
        if (lang.giaoViec(h.dv, nr)) { moRuong(null); baoGoiY("🌾 " + h.dv.ten + " · Ruộng · " + loiLua(nr) + "."); }
        else baoGoiY("❌ Chưa có lối tới ruộng.");
        return true;
      }
      moRuong(nr); return true;
    }
    if (ruongMo) moRuong(null);
    if (!h) return false;
    const ct = lang.congTrinh.find(c => c.cuaMinh !== false && !c.xong && o.x >= c.x && o.x < c.x + c.rong && o.y >= c.y && o.y < c.y + c.sau);
    if (!ct || h.dv.laBan) return false;
    if (!lang.duocXay(h.dv.vaiTro, ct.loai)) { baoGoiY("❌ Thủ lĩnh không xây công trình."); return true; }
    const n = lang.donVi.filter(d => d.xay === ct).length + (h.dv.xay === ct ? 0 : 1);
    const dangDoMinh = [h.dv.xay, ...(h.dv.hangXay || [])].filter(c => c && c !== ct && !c.xong); // xong chỗ này thì quay lại phần đang dở
    baoGoiY(lang.lenhXay(h.dv, ct, dangDoMinh) ? "🔨 " + h.dv.ten + " vào xây " + (CT[ct.loai] || {}).ten + " (" + Math.round(ct.tienDo * 100) + " %, " + n + " người)." : "❌ Chưa có lối tới móng này.");
    capNhatNut();
    return true;
  };
  async function xayDoan(ds) {
    if (dangGui) return { ok: false, lyDo: "đang gửi" };
    dangGui = true;
    const kq = await mayChu.xayTuong(ten, ds.map(c => [c.x, c.y]));
    dangGui = false;
    if (!kq.ok) { choXem = null; baoGoiY("❌ " + kq.lyDo); return kq; }
    const moi = kq.ds.map(c => lang.themCongTrinh({ id: c.id, chu: tenChuan, loai: "tuong", x: c.x, y: c.y, rong: 1, sau: 1, xong: false, giayXay: CT.tuong.giayXay }));
    truKho(CT.tuong.gia, moi.length);
    const cuoi = ds[ds.length - 1];
    if (cheDo === "tuong") { dauTuong = { x: cuoi.x, y: cuoi.y }; choXem = null; soiDat.hienO([dauTuong], () => false); }
    const dv = moi.length ? giaoXay(moi) : dvTl;
    baoGoiY(loiGiao(dv, moi.length + " ô tường") + " Chạm tiếp để kéo đoạn mới từ chỗ vừa xây, hoặc bấm ✋ Thôi xây.");
    capNhatNut();
    return kq;
  }
  async function dungCt(loai, a) {
    if (dangGui) return { ok: false, lyDo: "đang gửi" };
    dangGui = true;
    const kq = await mayChu.xay(ten, { loai, x: a.x, y: a.y, xoay: a.xoay });
    dangGui = false;
    if (!kq.ok) { choXem = null; baoGoiY("❌ " + kq.lyDo); return kq; }
    for (const id of kq.boTuong || []) { const c = lang.congTrinh.find(t => t.id === id && t.cuaMinh !== false); if (c) lang.boCongTrinh(c); } // cổng đè tường
    const ct = lang.themCongTrinh({ id: kq.id, chu: tenChuan, loai, x: a.x, y: a.y, rong: a.rong, sau: a.sau, xong: false, giayXay: CT[loai].giayXay });
    truKho(CT[loai].gia, 1);
    batCheDo(null);
    baoGoiY(loiGiao(giaoXay([ct]), CT[loai].ten));
    capNhatNut();
    return kq;
  }
  async function dungLeu(a) {
    if (dangGui) return;
    dangGui = true;
    const kq = await mayChu.xay(ten, { loai: "leu", x: a.x, y: a.y, rong: R, sau: S });
    dangGui = false;
    if (!kq.ok) { choXem = null; baoGoiY("❌ " + kq.lyDo); return; }
    leuBe = lang.themCongTrinh({ id: kq.id, chu: tenChuan, loai: "leu", x: a.x, y: a.y, rong: R, sau: S, xong: false, giayXay: CT.leu.giayXay });
    batChonCho(false);
    dk.chon(hTl);
    baoGoiY(lang.lenhXay(dvTl, leuBe) ? "👑 " + dvTl.ten + " đang tới dựng Lều trại…" : "👑 " + dvTl.ten + " chưa tới được chỗ dựng lều. Con bấm 🔨 Dựng tiếp nhé.");
    capNhatNut();
  }
  // Tường / cổng / tháp dựng xong trên máy bé: báo máy chủ (TC_D03A: máy chủ tự tính tiến độ theo người xây; chưa
  // khớp thì giữ lại, báo lại ở mỗi lần hỏi máy chủ tới khi được nhận)
  const choBaoXong = new Map(); // id -> { ct, dv }
  const daXongRoi = kq => kq.ma === "da_xong" || /xong rồi/.test(kq.lyDo || "");
  async function xongCt(ct, dv, im) {
    let kq = await mayChu.xayXong(ten, ct.id);
    if (!kq.ok && !daXongRoi(kq) && !im) { await new Promise(r => setTimeout(r, 1000)); kq = await mayChu.xayXong(ten, ct.id); }
    if (!kq.ok) { if (!daXongRoi(kq) && kq.ma !== "khong_phai_nha") choBaoXong.set(ct.id, { ct, dv }); else choBaoXong.delete(ct.id); return; }
    choBaoXong.delete(ct.id);
    if (im) return;
    if (ct.loai === "thap_canh") baoGoiY("🗼 Tháp canh dựng xong! Từ trên tháp nhìn xa " + BD.tamNhinCt(CB, "thap_canh", lang.chungLoai) + " ô trong sương mù.");
    else if (ct.loai === "cong") baoGoiY("🚪 Cổng dựng xong! Người của con đi qua cổng được, bạn khác thì không.");
    else if (ct.loai === "tuong" && !(dv.hangXay || []).length && !dv.xay) baoGoiY("🧱 " + dv.ten + " dựng xong đoạn tường!");
    else if (LA_KHO[ct.loai]) { const t = LA_KHO[ct.loai]; baoGoiY("📦 " + CT[ct.loai].ten + " hoàn thành · sức chứa " + TN[t].ten + " " + lang.sucChua(t) + " " + TN[t].bieuTuong + "."); } // TC_D03B1
    else if (ct.loai === "nha_o") baoGoiY("🏠 Nhà ở hoàn thành · chỗ ở " + lang.danSo() + "/" + lang.choO() + ".");
    else if (ct.loai === "ruong") baoGoiY("🌾 Ruộng hoàn thành · chín sau " + MR.chinGiay + " giây · " + KC_LANG.sanLuongRuong(cauHinh, ct.cap) + " " + TN.luong_thuc.bieuTuong + "/vụ."); // TC_D03B2
    else if (LA_CHOI[ct.loai]) baoGoiY(LA_CHOI[ct.loai] + " " + CT[ct.loai].ten + " hoàn thành · cất " + catChu(ct.loai) + "."); // TC_D03C
    capNhatNut();
  }
  // Móng của mình chưa xong mà không ai đang dựng (tải lại trang, người xây bị gọi đi việc khác)
  const dangDo = () => lang.congTrinh.filter(c => c.cuaMinh !== false && !c.xong && c !== leuBe && !lang.donVi.some(d => d.xay === c || (d.hangXay || []).includes(c)));
  async function leuXong(lan) {
    if (!lan) boNv.reo(hTl, 2.5);
    const kq = await mayChu.xayXong(ten, leuBe.id);
    if (!kq.ok && !daXongRoi(kq) && (lan || 0) < 10) { setTimeout(() => leuXong((lan || 0) + 1), 2000); return; } // máy chủ chưa thấy đủ: thử lại
    if (!kq.ok) { if (!daXongRoi(kq)) baoGoiY("❌ " + kq.lyDo); else leuDaNhan = true; return; }
    const goc = { x: leuBe.x + R / 2, z: leuBe.y + S / 2 };
    kq.donVi.forEach((d, i) => {
      if (dsNd.some(x => x.idMayChu === d.id)) return;
      const dv = nhanNongDan(d);
      const n = lang.nguonGanNhat(VIEC_DAU[i % VIEC_DAU.length], goc.x, goc.z, 16) || lang.nguonGanNhat("cay", goc.x, goc.z, 40);
      if (n) lang.giaoViec(dv, n); else dv.ranh = true;
    });
    leuDaNhan = true; // TC_D03B1: từ giờ nông dân mới (sinh ở lều) nhận qua dongBoMinh
    capNhatNut();
    baoGoiY("🏕️ Lều trại dựng xong: +" + kq.donVi.length + " nông dân.");
  }

  // ---------------- Lều trại: dân số + sinh nông dân (TC_D03B1) ----------------
  // Chỉ Lều trại (nhà chính) sinh nông dân. hang = { so, batDau } máy chủ trả (null: không ai chờ). Máy chủ ra người
  // theo giờ máy chủ; máy bé thấy tới giờ thì hỏi lại máy chủ ngay (chuKy) để nhận người mới.
  const SINH = CT.leu.sinh;
  let hang = vao.hang || null, leuMo = false, leuDaNhan = !!(leuBe && leuBe.xong), hoiSinh = 0;
  const conGiaySinh = () => (hang ? Math.max(0, Math.ceil((hang.batDau + SINH.giay * 1000 - mayChu.gio()) / 1000)) : 0);
  const loiLeu = () => "🏕️ Lều trại · 👥 " + lang.danSo() + "/" + lang.choO() + (hang ? " · ⏳ " + hang.so + " người, người kế sau " + conGiaySinh() + " giây" : "")
    + " · 🧑‍🌾 " + giaChu(SINH.gia, 1) + " / " + SINH.giay + " giây.";
  function moLeu(mo) {
    leuMo = !!mo;
    if (leuMo) { menuMo = false; ruongMo = null; baoGoiY(loiLeu()); }
    capNhatNut();
  }

  // ---------------- Ruộng (TC_D03B2) ----------------
  // Chạm ruộng của mình (không chọn nông dân): dòng báo giai đoạn bằng số + nút "🌱 Trồng lại" khi là bãi đã gặt.
  // Người vừa gặt ruộng thành bãi (dv.ruongCu) đang rảnh thì trồng lại xong tự ra ruộng lại.
  let ruongMo = null;
  const giayChu = g => (g >= 60 ? Math.floor(g / 60) + " phút " + (g % 60) + " giây" : g + " giây");
  const conGiay = luc => Math.max(0, Math.ceil((luc - lang.bayGio()) / 1000));
  function loiLua(n) {
    const ct = n.ct, bt = TN.luong_thuc.bieuTuong;
    if (ct.gatLuc != null) return "đã gặt · thành cỏ sau " + giayChu(conGiay(ct.gatLuc + MR.coSauGiay * 1000));
    if (n.trangThai === "mam") return "chín sau " + giayChu(conGiay(ct.trongLuc + MR.chinGiay * 1000)) + " · " + n.con + " " + bt;
    return "chín · còn " + n.con + "/" + n.toiDa + " " + bt;
  }
  const loiRuong = n => "🌾 Ruộng · " + loiLua(n) + " · 🧑‍🌾 " + lang.donVi.filter(d => d.viec === n).length
    + (n.ct.gatLuc != null ? " · 🌱 " + giaChu(MR.giaTrongLai, 1) : "") + ".";
  function moRuong(n) {
    ruongMo = n || null;
    if (ruongMo) { menuMo = false; leuMo = false; baoGoiY(loiRuong(ruongMo)); }
    capNhatNut();
  }
  async function trongLai() {
    const n = ruongMo;
    if (!n || dangGui) return { ok: false, lyDo: "đang gửi" };
    const t = thieuGia(MR.giaTrongLai, 1);
    if (t) { baoGoiY("❌ Thiếu " + TN[t].ten + " (" + (lang.kho[t] || 0) + "/" + MR.giaTrongLai[t] + " " + TN[t].bieuTuong + ")."); return { ok: false, ma: "thieu" }; }
    dangGui = true;
    const kq = await mayChu.trongLai(ten, n.ct.id);
    dangGui = false;
    if (!kq.ok) { baoGoiY("❌ " + kq.lyDo); return kq; }
    truKho(MR.giaTrongLai, 1);
    lang.trongLaiRuong(n.ct, gioLoi(kq.trongLuc));
    for (const d of dsNd) if (d.ruongCu === n && !d.xay && (d.ranh || !d.viec)) lang.giaoViec(d, n);
    baoGoiY("🌱 Ruộng trồng lại · chín sau " + MR.chinGiay + " giây · " + n.con + " " + TN.luong_thuc.bieuTuong + ".");
    capNhatNut();
    return kq;
  }
  lang.nghe(su => {
    if (su.loai !== "ruong" || dangNap || !su.ct || su.ct.cuaMinh === false) return;
    if (su.ct.giaiDoan === "chin" && su.n.trangThai === "song") baoGoiY("🌾 Ruộng chín · " + su.n.con + " " + TN.luong_thuc.bieuTuong + ".");
    else if (su.ct.giaiDoan === "bai") {
      for (const d of dsNd) if (d.viec === su.n) d.ruongCu = su.n;
      baoGoiY("🌾 Ruộng gặt xong · 🌱 trồng lại " + giaChu(MR.giaTrongLai, 1) + " trong " + giayChu(MR.coSauGiay) + ".");
    }
  });
  const nutTrong = document.createElement("button");
  nutTrong.className = "d3Nut d3Khung"; nutTrong.type = "button"; nutTrong.id = "d3TrongLai"; nutTrong.hidden = true;
  nutTrong.addEventListener("click", () => trongLai());
  $("d3SoiDat").parentNode.insertBefore(nutTrong, $("d3SoiDat"));
  async function sinhNd() {
    if (dangGui) return { ok: false, lyDo: "đang gửi" };
    const t = thieuGia(SINH.gia, 1);
    if (t) { baoGoiY("❌ Thiếu " + TN[t].ten + " (" + (lang.kho[t] || 0) + "/" + SINH.gia[t] + " " + TN[t].bieuTuong + ")."); return { ok: false, ma: "thieu" }; }
    dangGui = true;
    const kq = await mayChu.sinhNongDan(ten);
    dangGui = false;
    if (!kq.ok) { baoGoiY("❌ " + kq.lyDo); return kq; }
    truKho(SINH.gia, 1);
    hang = kq.hang;
    baoGoiY(loiLeu());
    capNhatNut();
    return kq;
  }
  const chipDan = document.createElement("span"); // 👥 dân số / chỗ ở (+ số đang chờ sinh)
  chipDan.className = "d3Khung d3Do"; chipDan.id = "d3DanSo"; chipDan.hidden = true;
  $("d3KhamPha").parentNode.insertBefore(chipDan, $("d3KhamPha").nextSibling);
  const nutSinh = document.createElement("button");
  nutSinh.className = "d3Nut d3Khung"; nutSinh.type = "button"; nutSinh.id = "d3SinhNd"; nutSinh.hidden = true;
  nutSinh.addEventListener("click", () => sinhNd());
  $("d3SoiDat").parentNode.insertBefore(nutSinh, $("d3SoiDat"));

  // ---------------- Nút ----------------
  // Menu "🔨 Xây" (TC_D02C): hiện sau khi Lều trại xong; mỗi nút ghi giá, nút có giới hạn ghi số đã xây
  const nutXay = {};
  const datNut = (nut, html, nhan) => { if (nut.innerHTML !== html) nut.innerHTML = html; nut.setAttribute("aria-label", nhan); };
  for (const [loai] of MENU_XAY.concat([["tiep"], ["xoay"]])) {
    const b = document.createElement("button");
    b.className = "d3Nut d3Khung"; b.type = "button"; b.id = "d3Xay_" + loai; b.hidden = true;
    b.addEventListener("click", () => chonMenu(loai));
    $("d3SoiDat").parentNode.insertBefore(b, $("d3KhamPhaNut"));
    nutXay[loai] = b;
  }
  function chonMenu(loai) {
    if (loai === "xoay") { xoayCong(); return; }
    if (loai === "tiep") {
      const ds = dangDo();
      if (!ds.length) { baoGoiY("Không còn chỗ nào xây dở."); capNhatNut(); return; }
      menuMo = false;
      baoGoiY(loiGiao(giaoXay(ds), ds.length + " chỗ xây dở"));
      capNhatNut(); return;
    }
    const m = CT[loai];
    if (m.gioiHan && cuaMinh(loai).length >= m.gioiHan) { baoGoiY("❌ " + BD.LY_DO.gioi_han(m.ten) + " (tối đa " + m.gioiHan + ")"); return; }
    const thieu = loiThieu(m.gia, 1);
    if (thieu) { baoGoiY(thieu); return; }
    batCheDo(loai);
    // TC_D03B1: kho + nhà ở báo thông tin bằng số (giọng chuyên nghiệp, không hướng dẫn)
    const kho = LA_KHO[loai];
    baoGoiY(loai === "tuong" ? "🧱 Chạm chỗ ĐẦU của đoạn tường. Rào kín quanh làng (chừa chỗ đặt Cổng) thì thành lãnh địa của con!"
      : loai === "cong" ? "🚪 Chạm lên tường của con (hoặc chỗ trống) để đặt Cổng 3 ô. Người của con đi qua cổng được, bạn khác thì không."
        : loai === "thap_canh" ? "🗼 Ô vuông XANH là chỗ xây được Tháp canh: chạm vào đó để xây. Từ tháp nhìn xa " + BD.tamNhinCt(CB, "thap_canh", lang.chungLoai) + " ô."
          : kho ? "📦 " + m.ten + " · " + giaChu(m.gia, 1) + " · +" + KC_LANG.sucChuaCt(cauHinh, loai, 1, lang.chungLoai, kho) + " " + TN[kho].bieuTuong + " sức chứa."
            : loai === "ruong" ? "🌾 Ruộng · " + giaChu(m.gia, 1) + " · " + KC_LANG.sanLuongRuong(cauHinh, 1) + " " + TN.luong_thuc.bieuTuong + "/vụ · chín sau " + MR.chinGiay + " giây." // TC_D03B2
            : LA_CHOI[loai] ? LA_CHOI[loai] + " " + m.ten + " · " + giaChu(m.gia, 1) + " · cất " + catChu(loai) + "." // TC_D03C
            : "🏠 " + m.ten + " · " + giaChu(m.gia, 1) + " · +" + (m.choO || 0) + " chỗ ở (👥 " + lang.danSo() + "/" + lang.choO() + ").");
  }
  function capNhatNut() {
    const nut = $("d3SoiDat"), xongLeu = !!(leuBe && leuBe.xong);
    if (xongLeu) {
      nut.hidden = false;
      const dang = !!cheDo || menuMo;
      datNut(nut, cheDo ? "✋<span class=\"d3Chu\"> Thôi xây</span>" : menuMo ? "✋<span class=\"d3Chu\"> Đóng</span>" : "🔨<span class=\"d3Chu\"> Xây</span>",
        cheDo ? "Thôi chọn chỗ xây" : menuMo ? "Đóng menu xây" : "Mở menu xây");
      nut.setAttribute("aria-pressed", String(dang));
    } else if (leuBe) { nut.hidden = !!dvTl.xay; nut.innerHTML = "🔨<span class=\"d3Chu\"> Dựng tiếp</span>"; nut.setAttribute("aria-label", "Thủ lĩnh dựng tiếp Lều trại"); }
    else {
      nut.hidden = false;
      nut.innerHTML = cheDo ? "✋<span class=\"d3Chu\"> Thôi chọn</span>" : "🏕️<span class=\"d3Chu\"> Dựng lều</span>";
      nut.setAttribute("aria-label", cheDo ? "Thôi chọn chỗ dựng lều" : "Chọn chỗ dựng Lều trại");
      nut.setAttribute("aria-pressed", String(!!cheDo));
    }
    const hienMenu = xongLeu && menuMo && !cheDo;
    for (const [loai, bt] of MENU_XAY) {
      const m = CT[loai], so = m.gioiHan ? " (" + cuaMinh(loai).length + "/" + m.gioiHan + ")" : "";
      nutXay[loai].hidden = !hienMenu;
      if (hienMenu) datNut(nutXay[loai], bt + "<span class=\"d3Chu\"> " + m.ten + "</span> " + giaChu(m.gia, 1) + (loai === "tuong" ? "/ô" : "") + so, "Xây " + m.ten + ", giá " + giaChu(m.gia, 1) + (loai === "tuong" ? " mỗi ô" : "") + so);
    }
    nutXay.xoay.hidden = cheDo !== "cong"; // TC_D03A: xoay cổng trước khi đặt
    if (cheDo === "cong") {
      const doc = choXem ? choXem.xoay : !!xoayTay;
      datNut(nutXay.xoay, "🔄<span class=\"d3Chu\"> Xoay cổng</span> " + (doc ? "↕" : "↔"), "Xoay cổng, đang " + (doc ? "dọc" : "ngang") + (laMay ? " (phím R)" : ""));
    }
    // TC_D03B1: dân số luôn hiện khi có lều; nút sinh nông dân khi mở Lều (chạm Lều trại)
    chipDan.hidden = !xongLeu;
    if (xongLeu) {
      const c = "👥 " + lang.danSo() + "/" + lang.choO() + (hang ? " · ⏳" + hang.so + " (" + conGiaySinh() + "s)" : "");
      if (chipDan.textContent !== c) { chipDan.textContent = c; chipDan.setAttribute("aria-label", "Dân số " + lang.danSo() + " trên " + lang.choO() + " chỗ ở" + (hang ? ", " + hang.so + " người đang chờ sinh" : "")); }
    }
    if (!xongLeu || cheDo || menuMo) leuMo = false;
    // TC_D03B2: ruộng đang xem đã thành cỏ (mất) / đang xây / mở menu thì đóng; bãi thì có nút trồng lại
    if (ruongMo && (cheDo || menuMo || leuMo || !lang.ruong().includes(ruongMo))) ruongMo = null;
    const coBai = !!ruongMo && ruongMo.ct.gatLuc != null;
    nutTrong.hidden = !coBai;
    if (coBai) datNut(nutTrong, "🌱<span class=\"d3Chu\"> Trồng lại</span> " + giaChu(MR.giaTrongLai, 1), "Trồng lại ruộng, giá " + giaChu(MR.giaTrongLai, 1));
    nutSinh.hidden = !leuMo;
    if (leuMo) datNut(nutSinh, "🧑‍🌾<span class=\"d3Chu\"> Sinh nông dân</span> " + giaChu(SINH.gia, 1) + (hang ? " · ⏳" + hang.so : ""),
      "Sinh nông dân, giá " + giaChu(SINH.gia, 1) + (hang ? ", đang chờ " + hang.so : ""));
    const soDo = hienMenu ? dangDo().length : 0;
    nutXay.tiep.hidden = !soDo;
    if (soDo) datNut(nutXay.tiep, "🔨<span class=\"d3Chu\"> Dựng tiếp</span> " + soDo, "Dựng tiếp " + soDo + " chỗ xây dở");
    $("d3KhamPhaNut").hidden = !coTuKham || !dsNd.length;
    const ve = leuBe ? "🏕️<span class=\"d3Chu\"> Về lều</span>" : "👑<span class=\"d3Chu\"> Về Thủ lĩnh</span>";
    if ($("d3VeLang").innerHTML !== ve) { $("d3VeLang").innerHTML = ve; $("d3VeLang").setAttribute("aria-label", leuBe ? "Về lều" : "Về chỗ Thủ lĩnh"); }
  }
  $("d3SoiDat").addEventListener("click", () => {
    if (leuBe && !leuBe.xong) {
      dk.chon(hTl);
      baoGoiY(lang.lenhXay(dvTl, leuBe) ? "👑 " + dvTl.ten + " đang tới dựng Lều trại…" : "Chưa có lối tới móng lều. Con cho nông dân chặt bớt cây quanh đó nhé.");
      capNhatNut(); return;
    }
    if (leuBe) { // Lều đã xong: menu Xây (TC_D02C)
      if (cheDo) { batCheDo(null); baoGoiY("Đã thôi xây. Bấm 🔨 Xây khi muốn xây tiếp nhé."); return; }
      menuMo = !menuMo;
      if (menuMo) leuMo = false; // TC_D03B1
      capNhatNut();
      if (menuMo) baoGoiY("🔨 Con muốn xây gì? Tường cọc gỗ rào kín làng thành lãnh địa, Cổng cho người của con đi qua, Tháp canh nhìn thật xa. (Ai đang được chọn sẽ đi xây, không thì Thủ lĩnh.)");
      return;
    }
    batChonCho(!cheDo);
    baoGoiY(cheDo ? "🏕️ Ô vuông XANH là chỗ dựng được Lều trại: chạm vào đó để dựng, hoặc chạm chỗ khác để xem thử. Ô đỏ là chưa dựng được."
      : "Chạm mặt đất để Thủ lĩnh 👑 đi khám phá. Muốn dựng lều thì bấm 🏕️.");
  });
  $("d3VeLang").addEventListener("click", () => (leuBe ? cam.nhinVe(leuBe.x + R / 2, leuBe.y + S / 2 + 2) : cam.nhinVe(dvTl.x, dvTl.z)));
  $("d3KhamPhaNut").addEventListener("click", () => {
    if (!coTuKham) return;
    if (!dsNd.length) { baoGoiY("Dựng Lều trại xong mới có nông dân đi khám phá con nhé."); return; }
    const chon = dk.dangChon();
    const ds = chon && chon.vaiTro === "nong_dan" ? [chon.dv] : dsNd.filter(d => !d.tuKhamPha && (d.ranh || (d.trangThai === "dung" && !d.viec)));
    if (!ds.length) { baoGoiY("Nông dân nào cũng đang bận. Con chạm một nông dân 🧑‍🌾 rồi bấm 🔭 để gọi bạn ấy đi khám phá nhé."); return; }
    const di = ds.filter(d => lang.khamPhaTuDo(d));
    baoGoiY(di.length ? "🔭 " + (di.length === 1 ? di[0].ten : di.length + " nông dân") + " đi khám phá! Chỗ tối sẽ sáng dần ra." : "Quanh đây đã khám phá hết chỗ đi được rồi!");
  });

  // Móc cho phần điều khiển: nguồn trong vùng đen không chọn được, lời báo khi đi / khi chọn
  uiDk.thayNguon = n => suong.muc(n.o.x, n.o.y) !== BD.DEN;
  uiDk.loiDi = (dv, o) => (suong.muc(o.x, o.y) === BD.DEN ? "🔭 " + dv.ten + " đi khám phá chỗ tối." : null);
  uiDk.loiBan = h => "👋 Đây là " + h.dv.ten + ". Con chỉ xem thôi, không ra lệnh cho người của bạn được nhé.";
  uiDk.loiChon = h => (h.vaiTro === "nong_dan" ? "Chạm cây, mỏ, bãi cá hoặc bụi trái cây để giao việc; chạm chỗ tối để đi khám phá."
    : leuBe ? "Chạm mặt đất để " + h.dv.ten + " đi tới đó." : "Chạm mặt đất để " + h.dv.ten + " đi khám phá. Bấm 🏕️ để chọn chỗ dựng Lều trại.");

  // ---------------- Mỗi khung: soi sương, lưu, gửi, báo tiến độ dựng ----------------
  const chuPt = $("d3KhamPha"), tongO = W * H;
  let demSoi = 0, demLuu = 0, demGui = 0, demNut = 0, demXay = 0, daLuu = -1, ptCu = -1;
  const capNhatPt = () => {
    const pt = Math.round(1000 * suong.demDaKham() / tongO) / 10;
    if (pt !== ptCu) { ptCu = pt; chuPt.textContent = "🗺️ Đã khám phá " + pt.toLocaleString("vi-VN") + "%"; }
  };
  const luuKhamPha = giu => {
    if (suong.phienBan === daLuu) return;
    daLuu = suong.phienBan;
    mayChu.luuKhamPha(ten, suong.xuat(), giu);
  };
  const roiTrang = () => { luuKhamPha(true); guiThuHoach(true); }; // rời trang: gửi kiểu giữ kết nối
  // TC_D03A: ẩn trang lâu (khoá máy, sang ứng dụng khác) thì máy chủ đã tính bù phần việc lúc vắng: tải lại trang
  let anLuc = 0;
  const anLau = () => anLuc && Date.now() - anLuc >= cauHinh.lang.vangMat.sauGiay * 1000;
  ctx.moiKhung(dt => {
    if ((demSoi += dt) >= 0.2) { demSoi = 0; soiLai(); capNhatPt(); capNhatLd(); }
    if ((demLuu += dt) >= CB.chuKyLuuKhamPha) { demLuu = 0; luuKhamPha(); }
    if ((demGui += dt) >= CB.chuKyGui) { demGui = 0; chuKy(); }
    veBan();
    if ((demNut += dt) >= 0.5) {
      demNut = 0; capNhatNut();
      if (leuMo && $("d3GoiY").textContent.startsWith("🏕️ Lều trại")) baoGoiY(loiLeu()); // đếm giây sinh; không đè lời báo khác
      if (ruongMo && $("d3GoiY").textContent.startsWith("🌾 Ruộng ·")) baoGoiY(loiRuong(ruongMo)); // TC_D03B2: đếm giây chín / thành cỏ
    }
    // TC_D03B1: tới giờ người đầu hàng ra (giờ máy chủ) -> hỏi lại máy chủ ngay để nhận nông dân mới
    if (hang && !dangHoi && hoiSinh !== hang.batDau && mayChu.gio() >= hang.batDau + SINH.giay * 1000) { hoiSinh = hang.batDau; chuKy(); }
    if (leuBe && !leuBe.xong && dvTl.trangThai === "xay" && (demXay += dt) >= 0.25) { demXay = 0; baoGoiY("🔨 " + dvTl.ten + " đang dựng Lều trại… " + Math.round(leuBe.tienDo * 100) + "%"); }
  });
  addEventListener("pagehide", roiTrang);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { anLuc = Date.now(); roiTrang(); return; }
    if (anLau()) { location.reload(); return; }
    anLuc = 0;
  });
  capNhatPt();
  chuPt.hidden = false;
  $("d3SoiDat").hidden = false;
  capNhatNut();
  dangNap = false;
  if (leuBe && !leuBe.xong) lang.lenhXay(dvTl, leuBe); // Lều dựng dở: dựng tiếp (lệnh gửi máy chủ kèm công trình)

  // TC_D03A: lời báo phần dân làng làm được lúc bé vắng mặt (nói rõ số; giọng chuyên nghiệp)
  function loiVang(v) {
    if (!v) return null;
    const g = v.giay, tg = g >= 3600 ? Math.floor(g / 3600) + " giờ " + Math.floor((g % 3600) / 60) + " phút" : g >= 60 ? Math.floor(g / 60) + " phút" : g + " giây";
    const thu = Object.keys(v.thu || {}).filter(t => v.thu[t] > 0 && TN[t]).map(t => "+" + v.thu[t] + " " + TN[t].bieuTuong);
    const dem = {}; for (const l of v.xong || []) dem[l] = (dem[l] || 0) + 1;
    const xong = Object.keys(dem).map(l => (l === "tuong" ? dem[l] + " ô " : dem[l] > 1 ? dem[l] + " " : "") + ((CT[l] || {}).ten || l));
    const day = (v.day || []).filter(t => TN[t]).map(t => "Kho " + TN[t].ten + " đầy");
    const sinh = v.sinh > 0 ? "+" + v.sinh + " nông dân" : ""; // TC_D03B1: hàng sinh ở lều chạy cả lúc vắng
    const gat = v.gat > 0 ? v.gat + " Ruộng gặt xong" : ""; // TC_D03B2
    if (!thu.length && !xong.length && !day.length && !sinh && !gat) return null;
    return "⏳ Khi vắng mặt (" + tg + "): " + [thu.join(" · "), sinh, xong.length ? "hoàn thành " + xong.join(", ") : "", gat, day.join(", ")].filter(Boolean).join(" · ") + ".";
  }
  function batDau() {
    dk.chon(hTl);
    const vang = loiVang(vao.vang);
    if (leuBe && leuBe.xong) {
      cam.nhinVe(leuBe.x + R / 2, leuBe.y + S / 2 + 2);
      baoGoiY(vang || "");
    } else if (leuBe) {
      cam.nhinVe(leuBe.x + R / 2, leuBe.y + S / 2);
      baoGoiY("👑 " + dvTl.ten + " đang dựng tiếp Lều trại…");
    } else {
      cam.nhinVe(dvTl.x, dvTl.z);
      batChonCho(true);
      baoGoiY((vao.lanDau ? "Chào mừng tới " + banDo.ten + "! " : "Chào mừng con quay lại! ") +
        "Chạm vào ô vuông XANH để Thủ lĩnh 👑 dựng Lều trại 🏕️ (chạm chỗ khác để xem chỗ đó dựng được không). Muốn đi xem quanh trước thì bấm ✋.");
    }
  }

  return {
    dvTl, hTl, suong, veSuong, mayChu, vao, batDau,
    moc: {
      cong: vao.cong, lanDau: vao.lanDau, mayChu,
      muc: (x, z) => suong.muc(Math.floor(x), Math.floor(z)), demDaKham: () => suong.demDaKham(),
      soiDat: (x, y) => BD.oXayDuocVung(theXay("leu"), x, y, R, S),
      dangSoi: () => !!cheDo, choDangXem: () => choXem,
      // TC_D02C: xây như bé bấm (đi qua đúng đường code của nút), công trình của mình, lãnh địa
      cheDo: () => cheDo, menuMo: () => menuMo, chonMenu, batCheDo,
      xayDoan: (a, b) => xayDoan(BD.doanTuong(a, b, CT.tuong.doanToiDa)),
      xayCt: (loai, x, y) => dungCt(loai, choDat(loai, { x, y, px: x + 0.5, pz: y + 0.5 })),
      congTrinh: () => lang.congTrinh.filter(c => c.cuaMinh !== false).map(c => ({ id: c.id, loai: c.loai, x: c.x, y: c.y, rong: c.rong, sau: c.sau, xong: c.xong, tienDo: c.tienDo })),
      lanhDia: chu => lanhDia.soO(chu || tenChuan), chuLanhDia: (x, y) => lanhDia.chuO(x, y, null),
      dangDo: () => dangDo().length,
      leu: () => leuBe && { id: leuBe.id, x: leuBe.x, y: leuBe.y, xong: leuBe.xong, tienDo: leuBe.tienDo },
      nongDan: () => dsNd.map(d => ({ ten: d.ten, x: d.x, z: d.z, viec: d.trangThai, nguon: d.viec && d.viec.loai, tuKhamPha: d.tuKhamPha, ranh: d.ranh })),
      // TC_D02B3b: quân + nhà của bạn đang thấy, hỏi lại máy chủ ngay, phần kho còn phải trừ
      ban: () => [...ban.values()].map(b => ({ id: b.d.id, chu: b.dv.chu, vaiTro: b.dv.vaiTro, x: b.dv.x, z: b.dv.z, hien: b.h.vo.visible, viec: b.dv.trangThai, di: b.dv.duong.length > 0 })),
      nhaBan: () => [...ctBan.values()].map(c => ({ id: c.id, chu: c.chu, x: c.x, y: c.y, xong: c.xong, tienDo: c.tienDo })),
      hoiLai: chuKy, no: () => ({ ...no }),
      // TC_D03A: lời báo vắng mặt, kho + sức chứa, ai đang xây gì, chạm móng như bé (chọn nông dân rồi chạm)
      vang: () => vao.vang, loiVang: () => loiVang(vao.vang), kho: () => ({ ...lang.kho }), sucChua: t => lang.sucChua(t),
      tho: () => lang.donVi.filter(d => d.xay).map(d => ({ ten: d.ten, vaiTro: d.vaiTro, xay: d.xay.id, dang: d.trangThai })),
      chamMong: (iNd, x, y) => { const d = dsNd[iNd]; return !!d && uiDk.chamO({ dv: d, vaiTro: d.vaiTro }, { x, y }); },
      choBaoXong: () => choBaoXong.size, dauTuong: () => dauTuong, xoayCong, luiMotBuoc,
      // TC_D03B1: dân số, hàng sinh, mở Lều + bấm sinh như bé, chỗ cất của nông dân (kho riêng)
      danSo: () => lang.danSo(), choO: () => lang.choO(), hang: () => hang, leuMo: () => leuMo, moLeu, sinhNd,
      chamLeu: () => !!leuBe && uiDk.chamO(null, { x: leuBe.x, y: leuBe.y }),
      // TC_D03B2: ruộng của mình (giai đoạn, lúa còn, số người gặt), chạm ruộng như bé (iNd: nông dân thứ mấy, null: chưa chọn ai), trồng lại
      ruong: () => lang.ruong().map(n => ({ id: n.ct.id, x: n.ct.x, y: n.ct.y, gd: n.ct.giaiDoan, con: n.con, toiDa: n.toiDa, nguoi: lang.donVi.filter(d => d.viec === n).length })),
      chamRuong: (iNd, x, y) => { const d = iNd == null ? null : dsNd[iNd]; return uiDk.chamO(d ? { dv: d, vaiTro: d.vaiTro } : null, { x, y }); },
      ruongMo: () => ruongMo && ruongMo.ct.id, trongLai
    }
  };
}
// 28/10/2026 19:05 - BƯỚC: TC_D03B2 (ruộng: xây, gặt, xem, trồng lại)
