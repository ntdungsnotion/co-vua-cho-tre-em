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
// HÀM KHAI RA:
//   vaoThungLung(the) -> Promise<vung>   (gọi sau khi đã dựng lõi + các phần vẽ, trước khung đầu)
//     the = { ctx, cam, lang, banDo, cauHinh, diaHinh, boNv, dk, uiDk (ui đã đưa cho dk: thêm móc),
//             be: { ten, hoSo, tenThuLinh }, themNongDan(x, z) -> dv, $, baoGoiY, kho (localStorage | null) }
//     vung = { dvTl, hTl, suong, veSuong, mayChu, vao, batDau() (sau khung đầu), moc (kịch bản thử) }
//   Không vào được (thung lũng đầy...): ném lỗi, err.lyDo là câu cho bé.
//     the.mayChu (TC_D02B3a): máy chủ thật dt/dt_may_chu_sb.js (trang game); không có thì máy chủ giả
// BƯỚC: TC_D02B2b (tách từ chế độ ?vung của dt3d_thu.js, TC_D02B2a); TC_D02B3a (máy chủ Supabase, sửa
//       trữ lượng theo số máy chủ trả, lều của bạn khác không là chỗ cất đồ)
// NGÀY: 27/10/2026; 27/10/2026 18:55
// PHỤ THUỘC: dt/dt_ban_do.js (KC_DT_BAN_DO), dt/dt_may_chu.js (KC_DT_MAY_CHU), dt3d_suong_mu.js, dt3d_o_xay.js
// ================================================================
import { taoVeSuong } from "./dt3d_suong_mu.js";
import { taoSoiDat } from "./dt3d_o_xay.js";

const BD = window.KC_DT_BAN_DO, MC = window.KC_DT_MAY_CHU;
const VIEC_DAU = ["cay", "cay", "bui_trai_cay"]; // nông dân vừa ra: 2 người chặt cây, 1 người hái trái cây

export async function vaoThungLung(the) {
  const { ctx, cam, lang, banDo, cauHinh, boNv, dk, uiDk, be, $, baoGoiY, themNongDan } = the;
  const CB = cauHinh.banDo, CT = cauHinh.congTrinh, W = banDo.rong, H = banDo.cao;
  const ten = be.ten, tenChuan = String(ten).trim().toLowerCase();
  const R = CT.leu.rong, S = CT.leu.sau;

  // ---------------- Vào vùng: trạng thái chung từ máy chủ ----------------
  const mayChu = the.mayChu || MC.taoMayChuGia({ vung: banDo, cauHinh, kho: the.kho });
  const vao = await mayChu.vaoVung(ten, be.hoSo.chungLoai);
  if (!vao.ok) throw Object.assign(new Error(vao.lyDo), { lyDo: vao.lyDo });
  const quanh = await mayChu.layQuanh(ten);
  for (const n of quanh.nguon || []) lang.capNhatNguon(n.ma, n.con);
  for (const k in vao.kho) if (k in lang.kho) lang.kho[k] = vao.kho[k];

  // ---------------- Sương mù -> lõi ----------------
  const suong = BD.taoSuongMu(W, H);
  suong.nap(vao.khamPha);
  const veSuong = taoVeSuong(ctx, suong);
  const soiLai = () => {
    const ds = lang.donVi.map(d => ({ x: d.x, z: d.z, r: BD.tamNhin(CB, d.vaiTro, lang.chungLoai) }));
    for (const c of lang.congTrinh) if (c.xong && c.chu === tenChuan) ds.push({ x: c.x + c.rong / 2, z: c.y + c.sau / 2, r: BD.tamNhin(CB, c.loai === "leu" ? "leu" : "nha", lang.chungLoai) });
    if (suong.soi(ds)) veSuong.capNhat();
  };
  const daBiet = (x, y) => suong.daKham[y * W + x] === 1;
  lang.datBiet(daBiet, soiLai, dv => BD.timBienKhamPha(lang, suong, dv.x, dv.z,
    lang.donVi.filter(d => d !== dv && d.tuKhamPha && d.dich).map(d => d.dich), CB.cachNhauKhamPha));

  // ---------------- Công trình ----------------
  let leuBe = null;
  for (const c of quanh.congTrinh || []) {
    const ct = lang.themCongTrinh({ id: c.id, chu: c.chu, cuaMinh: c.chu === tenChuan, loai: c.loai, x: c.x, y: c.y, rong: c.rong, sau: c.sau, xong: !!c.xongLuc, giayXay: (CT[c.loai] || CT.leu).giayXay });
    if (c.chu === tenChuan && c.loai === "leu") leuBe = ct;
  }

  // ---------------- Thủ lĩnh + nông dân ----------------
  let dangNap = true; // đang dựng lại theo máy chủ: không gửi lại lệnh cũ
  const viTriCua = d => (d.lenh ? BD.viTriTuLenh(lang, d.lenh, mayChu.gio()) : { x: d.x, z: d.z, xong: true });
  const dvMcTl = vao.donVi.find(d => d.loai === "thu_linh");
  const pTl = viTriCua(dvMcTl);
  const dvTl = lang.themDonVi("thu_linh", pTl.x, pTl.z, be.tenThuLinh || "Thủ lĩnh");
  dvTl.idMayChu = dvMcTl.id;
  const hTl = boNv.tao(dvTl, "thu_linh", be.hoSo);
  soiLai();
  if (leuBe && !leuBe.xong) lang.lenhXay(dvTl, leuBe); // đang dựng dở: dựng tiếp
  else if (!pTl.xong) lang.lenhDi(dvTl, { x: dvMcTl.lenh.den[0], y: dvMcTl.lenh.den[1] }); // đang đi dở: đi tiếp

  const dsNd = [];
  function nhanNongDan(d) {
    const p = viTriCua(d), l = d.lenh;
    const dv = themNongDan(p.x, p.z);
    dv.idMayChu = d.id; dsNd.push(dv);
    const n = l && l.viec != null ? lang.nguonTheoMa(l.viec) : null;
    if (n && lang.dangSong(n)) lang.giaoViec(dv, n);
    else if (l && l.khamPha) { if (!lang.khamPhaTuDo(dv)) dv.ranh = true; }
    else if (l && !p.xong) lang.lenhDi(dv, { x: l.den[0], y: l.den[1] });
    else if (l && l.viec != null) dv.ranh = true; // nguồn đang làm đã hết: đứng chờ việc
    return dv;
  }
  for (const d of vao.donVi) if (d.loai === "nong_dan") nhanNongDan(d);

  // ---------------- Gửi máy chủ ----------------
  const gui = (dv, lenh) => { if (!dangNap && dv.idMayChu) mayChu.guiLenh(ten, dv.idMayChu, lenh); };
  let gom = {};
  const guiThuHoach = giu => {
    const ds = Object.keys(gom).map(ma => ({ ma: Number(ma), so: gom[ma] }));
    if (!ds.length) return;
    gom = {};
    // máy chủ thật trả trữ lượng còn lại: bạn khác lấy trước thì cây / mỏ trên máy mình vơi theo
    mayChu.guiThuHoach(ten, ds, giu).then(kq => { if (kq && kq.ok) for (const d of kq.ds) if (Number.isFinite(d.con)) lang.capNhatNguon(d.ma, d.con); });
  };
  lang.nghe(su => {
    switch (su.loai) {
      case "lenh_di": gui(su.dv, { tu: [su.tu.x, su.tu.z], den: [su.den.x, su.den.y], khamPha: su.khamPha }); break;
      case "giao_viec": gui(su.dv, { tu: [su.dv.x, su.dv.z], den: [su.n.o.x, su.n.o.y], viec: su.n.ma }); break;
      case "lay": gom[su.n.ma] = (gom[su.n.ma] || 0) + 1; break;
      case "xay_xong": if (su.ct === leuBe) leuXong(); break;
      case "xay_ket": if (su.dv === dvTl) { baoGoiY("👑 " + dvTl.ten + " chưa tới được chỗ dựng lều. Con bấm 🔨 Dựng tiếp nhé."); capNhatNut(); } break;
      case "het_kham_pha": baoGoiY("🔭 " + su.dv.ten + " đã khám phá hết chỗ đi được quanh đây!"); break;
    }
  });

  // ---------------- Chọn chỗ dựng Lều trại ----------------
  const soiDat = taoSoiDat(ctx, the.diaHinh, (x, y, r, s) => BD.oXayDuocVung({ lang, suong }, x, y, r, s));
  let dangChonCho = false, choXem = null, dangGui = false;
  const neo = o => ({ x: Math.round(o.px - R / 2), y: Math.round(o.pz - S / 2) }); // móng nằm giữa chỗ chạm
  // Chỗ dựng được gần Thủ lĩnh nhất: hiện sẵn ô xanh để bé thấy ngay "chỗ xanh" là gì
  function choGoiY() {
    const cx = Math.floor(dvTl.x - R / 2 + 0.5), cy = Math.floor(dvTl.z - S / 2 + 0.5);
    for (let r = 2; r <= 10; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      if (BD.oXayDuocVung({ lang, suong }, cx + dx, cy + dy, R, S).duoc) return { x: cx + dx, y: cy + dy };
    }
    return null;
  }
  function batChonCho(bat) {
    dangChonCho = bat; choXem = null;
    if (!bat) { soiDat.an(); dk.datCheDoCham(null); capNhatNut(); return; }
    const g = choGoiY();
    if (g) { soiDat.hien(g.x, g.y, R, S); choXem = g; } // chạm đúng ô xanh này là dựng luôn
    dk.datCheDoCham((o, kieu) => {
      const a = neo(o), kq = soiDat.hien(a.x, a.y, R, S);
      const cungCho = choXem && choXem.x === a.x && choXem.y === a.y;
      if (kieu === "re") { choXem = kq.duoc ? a : null; return; }
      if (!kq.duoc) { choXem = null; baoGoiY("❌ " + kq.lyDo); return; }
      if (!cungCho) { choXem = a; baoGoiY("✅ Chỗ này dựng được Lều trại! Chạm lần nữa vào chỗ xanh để dựng nhé."); return; }
      dungLeu(a);
    });
    capNhatNut();
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
  async function leuXong() {
    boNv.reo(hTl, 2.5);
    let kq = await mayChu.xayXong(ten, leuBe.id);
    if (!kq.ok && !/xong rồi/.test(kq.lyDo)) { await new Promise(r => setTimeout(r, 1000)); kq = await mayChu.xayXong(ten, leuBe.id); } // giờ máy bé nhanh hơn máy chủ chút
    if (!kq.ok) { baoGoiY("❌ " + kq.lyDo); return; }
    const goc = { x: leuBe.x + R / 2, z: leuBe.y + S / 2 };
    kq.donVi.forEach((d, i) => {
      const dv = nhanNongDan(d);
      const n = lang.nguonGanNhat(VIEC_DAU[i % VIEC_DAU.length], goc.x, goc.z, 16) || lang.nguonGanNhat("cay", goc.x, goc.z, 40);
      if (n) lang.giaoViec(dv, n); else dv.ranh = true;
    });
    capNhatNut();
    baoGoiY("🎉 Lều trại dựng xong! " + kq.donVi.length + " nông dân đã tới và đi làm ngay. Chạm nông dân 🧑‍🌾 rồi chạm chỗ tối để đi khám phá, hoặc bấm 🔭.");
  }

  // ---------------- Nút ----------------
  function capNhatNut() {
    const nut = $("d3SoiDat");
    if (leuBe && leuBe.xong) nut.hidden = true;
    else if (leuBe) { nut.hidden = !!dvTl.xay; nut.innerHTML = "🔨<span class=\"d3Chu\"> Dựng tiếp</span>"; nut.setAttribute("aria-label", "Thủ lĩnh dựng tiếp Lều trại"); }
    else {
      nut.hidden = false;
      nut.innerHTML = dangChonCho ? "✋<span class=\"d3Chu\"> Thôi chọn</span>" : "🏕️<span class=\"d3Chu\"> Dựng lều</span>";
      nut.setAttribute("aria-label", dangChonCho ? "Thôi chọn chỗ dựng lều" : "Chọn chỗ dựng Lều trại");
      nut.setAttribute("aria-pressed", String(dangChonCho));
    }
    $("d3KhamPhaNut").hidden = !dsNd.length;
    const ve = leuBe ? "🏕️<span class=\"d3Chu\"> Về lều</span>" : "👑<span class=\"d3Chu\"> Về Thủ lĩnh</span>";
    if ($("d3VeLang").innerHTML !== ve) { $("d3VeLang").innerHTML = ve; $("d3VeLang").setAttribute("aria-label", leuBe ? "Về lều" : "Về chỗ Thủ lĩnh"); }
  }
  $("d3SoiDat").addEventListener("click", () => {
    if (leuBe && !leuBe.xong) {
      dk.chon(hTl);
      baoGoiY(lang.lenhXay(dvTl, leuBe) ? "👑 " + dvTl.ten + " đang tới dựng Lều trại…" : "Chưa có lối tới móng lều. Con cho nông dân chặt bớt cây quanh đó nhé.");
      capNhatNut(); return;
    }
    batChonCho(!dangChonCho);
    baoGoiY(dangChonCho ? "🏕️ Ô vuông XANH là chỗ dựng được Lều trại: chạm vào đó để dựng, hoặc chạm chỗ khác để xem thử. Ô đỏ là chưa dựng được."
      : "Chạm mặt đất để Thủ lĩnh 👑 đi khám phá. Muốn dựng lều thì bấm 🏕️.");
  });
  $("d3VeLang").addEventListener("click", () => (leuBe ? cam.nhinVe(leuBe.x + R / 2, leuBe.y + S / 2 + 2) : cam.nhinVe(dvTl.x, dvTl.z)));
  $("d3KhamPhaNut").addEventListener("click", () => {
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
  ctx.moiKhung(dt => {
    if ((demSoi += dt) >= 0.2) { demSoi = 0; soiLai(); capNhatPt(); }
    if ((demLuu += dt) >= CB.chuKyLuuKhamPha) { demLuu = 0; luuKhamPha(); }
    if ((demGui += dt) >= CB.chuKyGui) { demGui = 0; guiThuHoach(); }
    if ((demNut += dt) >= 0.5) { demNut = 0; capNhatNut(); }
    if (leuBe && !leuBe.xong && dvTl.trangThai === "xay" && (demXay += dt) >= 0.25) { demXay = 0; baoGoiY("🔨 " + dvTl.ten + " đang dựng Lều trại… " + Math.round(leuBe.tienDo * 100) + "%"); }
  });
  addEventListener("pagehide", roiTrang);
  document.addEventListener("visibilitychange", () => { if (document.hidden) roiTrang(); });
  capNhatPt();
  chuPt.hidden = false;
  $("d3SoiDat").hidden = false;
  capNhatNut();
  dangNap = false;

  function batDau() {
    dk.chon(hTl);
    if (leuBe && leuBe.xong) {
      cam.nhinVe(leuBe.x + R / 2, leuBe.y + S / 2 + 2);
      baoGoiY("Chào mừng con quay lại làng! Nông dân vẫn đang làm việc. Bấm 🔭 để cho nông dân rảnh đi khám phá.");
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
      soiDat: (x, y) => BD.oXayDuocVung({ lang, suong }, x, y, R, S),
      dangSoi: () => dangChonCho, choDangXem: () => choXem,
      leu: () => leuBe && { id: leuBe.id, x: leuBe.x, y: leuBe.y, xong: leuBe.xong, tienDo: leuBe.tienDo },
      nongDan: () => dsNd.map(d => ({ ten: d.ten, x: d.x, z: d.z, viec: d.trangThai, nguon: d.viec && d.viec.loai, tuKhamPha: d.tuKhamPha, ranh: d.ranh }))
    }
  };
}
// 27/10/2026 18:55 - BƯỚC: TC_D02B3a
