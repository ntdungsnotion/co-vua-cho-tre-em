// ================================================================
// FILE: dt/3d/dt3d_quai_ban_do.js  (ES module) - PHẦN VẼ 3D: QUÁI TRÊN BẢN ĐỒ + VÀO TRẬN
// CHỨC NĂNG: Quái nhỏ lang thang trong Thung Lũng (lõi dt/dt_quai_ban_do.js, hình dt3d_quai.js):
//            - TC_D06C1: QUÁI CHUNG: danh sách quái do máy chủ giữ (vaoVung / layQuanh trả quai[]), mọi bé
//              trong vùng thấy cùng con quái ở cùng chỗ (vị trí tính từ bản ghi + giờ máy chủ)
//            - chỉ hiện khi đứng trong vùng SÁNG của bé; trên đầu có nhãn "Lv n" khung xanh / vàng / đỏ
//              (so với cấp Thủ lĩnh); không đi vào lãnh địa, không tới sát lều
//            - đang chọn Thủ lĩnh + chạm quái: máy chủ GIỮ quái cho bé (bé khác không đánh được con đó),
//              quái đứng lại, Thủ lĩnh tiến tới; tới gần (vaoTranCach) thì báo máy chủ vào trận và MÀN CHIẾN
//              ĐẤU mở phủ lên bản đồ (khung dt/thu_tran_dau.html?nhung=1, trận theo lượt TC_D05, câu hỏi theo
//              trình độ của bé); bản đồ thôi vẽ trong lúc đánh (dân làng vẫn làm)
//            - bé KHÁC đang đánh một quái: quái đứng yên quay về phía Thủ lĩnh bạn, chớp trắng + nảy theo nhịp
//              chém, nhãn "⚔️ Lv n"; Thủ lĩnh bạn (nếu thấy) đứng chém (động tác "danh"); chạm quái đó chỉ báo
//              "đang giao chiến với Thủ lĩnh của <bạn>"
//            - thắng / hòa: quái bỏ chạy (mọi bé thấy), mờ dần rồi mất, hoiSinhGiay sau máy chủ sinh quái mới;
//              thua: Thủ lĩnh về Lều nghỉ (thua.nghiGiay của cau_hinh_tran_dau.json, máy chủ giữ giờ hết nghỉ:
//              đổi máy vẫn nghỉ), nhãn "⛺ m:ss" trên đầu; rút lui giữa trận / thôi đi tới: thả quái, không phạt
//            - chạm quái khi chưa chọn Thủ lĩnh: chỉ báo tên + cấp
//            - mất mạng: vẫn đánh được quái đang thấy (máy chủ không trả lời thì giữ như đã giữ)
// HÀM KHAI RA:
//   taoQuaiBanDo(the) -> Promise<{ trung(tia) -> { q, kc } | null, cham(q, hinhDangChon), moc }>
//     the = { ctx, lang, diaHinh, banDo, cauHinh, cam, suong?, laLanhDia?(x, y), dvTl, hTl, be: { ten, hoSo, lop },
//             mayChu (dt_may_chu.js / dt_may_chu_sb.js: gio, quaiGiu, quaiDanh, quaiKet),
//             vung ({ quanhDau, ngheQuanh, tlBan, hoiLai } của dt3d_vung.js), lop (DOM phủ cảnh), baoGoiY(chu) }
//   dt3d_dieu_khien.js gọi trung / cham qua ui.trungQuai / ui.chamQuai.
// LUẬT NỐI: lõi KC_DT_QUAI_BAN_DO, KC_DT_LUOI, KC_DT_BAN_DO (SANG); lang.lenhDi; ctx.nghiVe (dt3d_canh.js).
// BƯỚC: TC_D06A; TC_D06C1 (quái chung trên máy chủ, thấy bạn đánh quái, giờ nghỉ ở máy chủ)
// NGÀY: 30/10/2026; 30/10/2026 17:30
// ================================================================
import * as THREE from "three";
import { taoQuai3d } from "./dt3d_quai.js";
import { NHIP_DANH } from "./dt3d_nhan_vat.js";

const QB = window.KC_DT_QUAI_BAN_DO, LUOI = window.KC_DT_LUOI, BD = window.KC_DT_BAN_DO;
const CAO_QUAI = 0.95; // quái trên bản đồ cao chừng này (ô), thấp hơn Thủ lĩnh
const CHU_QUAI = { slime_so: () => String(1 + Math.floor(Math.random() * 9)), nam_chu_cai: () => "ABCDEFGHKLMNPRST"[Math.floor(Math.random() * 16)], dom_dom: () => "?" };
const DAU_MAU = { xanh: "🟢", vang: "🟡", do: "🔴" };
const LOI_DUNG = { dang_danh: 1, quai_mat: 1, dang_nghi: 1 }; // máy chủ từ chối thật (khác lỗi mạng: vẫn đánh trên máy)

export async function taoQuaiBanDo(the) {
  const { ctx, lang, diaHinh, cauHinh, cam, suong, dvTl, hTl, be, mayChu, vung } = the;
  const ch = cauHinh.quaiBanDo;
  const chTran = await fetch(new URL("../du_lieu/cau_hinh_tran_dau.json", import.meta.url), { cache: "no-cache" }).then(r => r.json());
  const canvas = ctx.renderer.domElement;
  const ten = be.ten || "khach", tenMinh = String(ten).trim().toLowerCase();
  const gio = () => mayChu.gio();

  // ---------- bản ghi máy chủ ----------
  const ghi = new Map();    // id -> bản ghi { id, ma, lv, x, z, hat, sinhLuc, khoa, chay }
  const moiDung = new Map(); // id -> lúc (Date.now) bé vừa giữ / thả / đánh xong: lần hỏi lại gửi đi trước đó có thể cũ hơn
  let nghiDen = vung.quanhDau.nghiDen || 0;
  let dangToi = null;   // bản ghi quái Thủ lĩnh đang tiến tới
  let trongTran = null; // { r, khung, fr, ket, nghiGiay }
  const giuTren = id => (dangToi && dangToi.id === id) || (trongTran && trongTran.r.id === id);
  function nhanDs(ds) {
    const con = new Set(), bay = Date.now(), cu = (ch.buGiay + cauHinh.banDo.chuKyGui * 2) * 1000;
    for (const r of ds || []) {
      con.add(r.id);
      const cuCucBo = ghi.get(r.id);
      // Chỉ giữ bản ghi cục bộ khi chính bé đang giữ quái; khóa của bé khác phải
      // được nhận ngay, nếu không trạng thái "đang giao chiến" bị che mất sau lần chạm.
      if (giuTren(r.id) || (bay - (moiDung.get(r.id) || 0) < cu
        && cuCucBo && cuCucBo.khoa && cuCucBo.khoa.ten === tenMinh && !r.khoa)) continue;
      ghi.set(r.id, r);
    }
    for (const id of [...ghi.keys()]) if (!con.has(id) && !giuTren(id) && bay - (moiDung.get(id) || 0) >= cu) ghi.delete(id);
  }
  nhanDs(vung.quanhDau.quai);
  vung.ngheQuanh(q => { nhanDs(q.quai); if (Number.isFinite(q.nghiDen)) nghiDen = q.nghiDen; });
  const dung = id => moiDung.set(id, Date.now());

  // ---------- lõi ----------
  const leuGan = (x, y) => lang.congTrinh.some(c => c.loai === "leu" && Math.hypot(c.x + c.rong / 2 - x - 0.5, c.y + c.sau / 2 - y - 0.5) < ch.khongGanLeu);
  const diDuoc = (x, y) => LUOI.diDuoc(lang.luoi, x, y) && !lang.ruongTaiO(x, y) && !(the.laLanhDia && the.laLanhDia(x, y)) && !leuGan(x, y);
  const viTri = r => QB.viTri(ch, r, gio(), diDuoc);
  const tenLoai = ma => (chTran.quai.loai[ma] || {}).ten || ma;
  const capTl = () => ch.capThuLinh;
  const mau = r => QB.mauKhung(ch, r.lv, capTl());
  const cuaBan = r => r.khoa && r.khoa.ten !== tenMinh;

  // ---------- hình ----------
  const hinh = new Map(); // id -> { khoa (id:sinhLuc: quái sinh lại cùng id là hình mới), q3, vo, trung, nhan, chu, mo }
  const hinhTrung = new THREE.CylinderGeometry(0.55, 0.55, 1.2, 8).translate(0, 0.6, 0);
  const vlTrung = new THREE.MeshBasicMaterial({ visible: false });
  function taoHinh(r) {
    const q3 = taoQuai3d(r.ma, { nhe: ctx.nhe });
    q3.nhom.scale.setScalar(CAO_QUAI / q3.cao);
    const chu = CHU_QUAI[r.ma] ? CHU_QUAI[r.ma]() : ""; if (chu) q3.datChu(chu);
    const vo = new THREE.Group(); vo.add(q3.nhom);
    const trung = new THREE.Mesh(hinhTrung, vlTrung); trung.userData.id = r.id; vo.add(trung);
    ctx.canh.add(vo);
    const nhan = document.createElement("div"); nhan.className = "d3LvQuai"; nhan.hidden = true;
    the.lop.appendChild(nhan);
    const h = { khoa: r.id + ":" + r.sinhLuc, q3, vo, trung, nhan, chu, mo: 1, nhat: -1 };
    hinh.set(r.id, h);
    return h;
  }
  function xoaHinh(id) {
    const h = hinh.get(id); if (!h) return;
    ctx.canh.remove(h.vo); h.nhan.remove(); hinh.delete(id);
    h.vo.traverse(o => { if (o.isMesh && o.geometry !== hinhTrung) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } });
  }
  const thay = p => !suong || suong.muc(Math.floor(p.x), Math.floor(p.z)) === BD.SANG;

  // nhãn "⛺ m:ss" trên đầu Thủ lĩnh khi đang nghỉ
  const nhanNghi = document.createElement("div"); nhanNghi.className = "d3NghiTl"; nhanNghi.hidden = true; the.lop.appendChild(nhanNghi);
  const conNghi = () => Math.max(0, nghiDen - gio());
  const dongHo = ms => { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

  const vt = new THREE.Vector3();
  const raManHinh = (x, y, z) => { vt.set(x, y, z).project(cam.camera); return [(vt.x + 1) / 2 * canvas.clientWidth, (1 - vt.y) / 2 * canvas.clientHeight, vt.z < 1]; };
  const datNhan = (el, x, y, z) => { const [sx, sy, truoc] = raManHinh(x, y, z); el.hidden = !truoc; el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -100%)`; };

  // ---------- đánh quái ----------
  function giuQuai(r, p) {
    r.khoa = { ten: tenMinh, x: p.x, z: p.z, trang: "toi", luc: gio() }; dung(r.id);
    mayChu.quaiGiu(ten, r.id, p.x, p.z).then(kq => {
      if (kq.ok) { if (r.khoa && kq.quai && kq.quai.khoa) r.khoa = kq.quai.khoa; return; }
      if (!LOI_DUNG[kq.ma]) return; // lỗi mạng: đánh trên máy như đã giữ
      r.khoa = null;
      if (kq.ma === "quai_mat") ghi.delete(r.id);
      if (kq.ma === "dang_nghi" && Number.isFinite(kq.nghiDen)) nghiDen = kq.nghiDen;
      if (kq.ma === "dang_danh" && kq.chu) r.khoa = { ten: kq.chu, x: p.x, z: p.z, trang: "danh", luc: gio() };
      if (dangToi === r && !trongTran) { dangToi = null; dungTl(); }
      if (trongTran && trongTran.r === r) return; // đã vào trận trên máy (máy chủ chậm): đánh nốt
      the.baoGoiY(kq.ma === "dang_danh" ? "⚔️ " + tenLoai(r.ma) + " đang giao chiến với Thủ lĩnh của " + kq.chu + "."
        : kq.ma === "dang_nghi" ? "⛺ " + dvTl.ten + " đang nghỉ ở Lều · còn " + dongHo(conNghi()) : "💨 " + tenLoai(r.ma) + " đã chạy mất rồi.");
    });
  }
  function thaQuai(r, ket, giuKetNoi) { // ket: "tha" | "rut"
    if (r.khoa && r.khoa.ten === tenMinh) r.khoa = null;
    dung(r.id);
    mayChu.quaiKet(ten, r.id, ket || "tha", null, giuKetNoi);
  }

  function cham(r, chonH) {
    if (trongTran) return;
    const p = viTri(r);
    if (p.mat || p.trangThai === "chay") return;
    const nhan = DAU_MAU[mau(r)] + " " + tenLoai(r.ma) + " · Lv " + r.lv;
    if (cuaBan(r)) { the.baoGoiY("⚔️ " + nhan + " đang giao chiến với Thủ lĩnh của " + r.khoa.ten + "."); return; }
    if (!chonH || chonH.vaiTro !== "thu_linh") { the.baoGoiY(chonH ? nhan + " · ❌ Chỉ Thủ lĩnh 👑 đánh quái" : nhan); return; }
    if (conNghi() > 0) { the.baoGoiY("⛺ " + dvTl.ten + " đang nghỉ ở Lều · còn " + dongHo(conNghi())); return; }
    if (dangToi && dangToi !== r) thaQuai(dangToi);
    if (!(r.khoa && r.khoa.ten === tenMinh)) giuQuai(r, p);
    dangToi = r;
    const k = r.khoa;
    if (Math.hypot(dvTl.x - k.x, dvTl.z - k.z) <= ch.vaoTranCach) return; // đã đứng sát: khung sau vào trận
    if (!lang.lenhDi(dvTl, { x: Math.floor(k.x), y: Math.floor(k.z) })) { thaQuai(r); dangToi = null; the.baoGoiY("❌ Chỗ đó chưa tới được."); return; }
    the.baoGoiY("⚔️ " + dvTl.ten + " tiến về " + nhan);
  }

  function dungTl() { // dừng Thủ lĩnh tại chỗ (gửi lệnh đi tới ô đang đứng để máy chủ nhớ đúng chỗ)
    lang.lenhDi(dvTl, { x: Math.floor(dvTl.x), y: Math.floor(dvTl.z) });
    dvTl.duong.length = 0;
  }

  // Báo máy chủ vào trận (bé khác thấy đánh nhau). Thủ lĩnh trên máy chủ còn cách xa (lệnh vừa gửi chưa tới): thử lại
  function baoDanh(r, lan) {
    mayChu.quaiDanh(ten, r.id).then(kq => {
      if (kq.ok || !trongTran || trongTran.r !== r) return;
      if (kq.ma === "xa_qua" && lan < 3) setTimeout(() => baoDanh(r, lan + 1), 2000);
    });
  }
  function moTran(r) {
    dangToi = null;
    dungTl();
    const k = r.khoa;
    dvTl.huongMuon = Math.atan2(k.x - dvTl.x, k.z - dvTl.z);
    k.trang = "danh"; dung(r.id);
    baoDanh(r, 0);
    const h = hinh.get(r.id);
    const ts = new URLSearchParams({ nhung: "1", quai: r.ma, lv: String(r.lv), cl: be.hoSo.chungLoai || "nhan", gioi: be.hoSo.gioi || "nam",
      lop: String(be.lop || 2), ten: be.ten || "", tl: dvTl.ten || "", chu: (h && h.chu) || "" });
    const khung = document.createElement("div"); khung.className = "d3Tran";
    const fr = document.createElement("iframe");
    fr.title = "Trận đấu"; fr.allow = "autoplay"; fr.src = new URL("../thu_tran_dau.html?" + ts, import.meta.url).href;
    khung.appendChild(fr); document.body.appendChild(khung);
    trongTran = { r, khung, fr, ket: undefined };
    ctx.nghiVe = true; // bản đồ thôi vẽ, lõi làng vẫn chạy
    fr.focus();
  }

  // thang: "be" | "quai" | null (hòa) | undefined (rút lui)
  function ghiKet(thang, nghiGiay) {
    if (!trongTran || trongTran.ket !== undefined) return;
    trongTran.ket = thang;
    trongTran.nghiGiay = Math.max(0, Number.isFinite(nghiGiay) ? nghiGiay : chTran.thua.nghiGiay);
    if (thang === "quai") nghiDen = gio() + trongTran.nghiGiay * 1000;
  }
  function dongTran() {
    if (!trongTran) return;
    const { r, khung, ket, nghiGiay } = trongTran;
    trongTran = null; khung.remove(); ctx.nghiVe = false;
    const ten2 = tenLoai(r.ma), k = r.khoa || { x: r.x, z: r.z };
    dung(r.id);
    if (ket === "be" || ket === null) {
      r.chay = { x: k.x, z: k.z, huong: Math.atan2(k.x - dvTl.x, k.z - dvTl.z), luc: gio() }; r.khoa = null;
      mayChu.quaiKet(ten, r.id, ket === "be" ? "be" : "hoa", null);
      the.baoGoiY((ket === "be" ? "🏆 Thắng · " : "🤝 Hòa · ") + ten2 + " bỏ chạy");
    } else if (ket === "quai") {
      r.khoa = null;
      mayChu.quaiKet(ten, r.id, "quai", nghiGiay).then(kq => { if (kq.ok && Number.isFinite(kq.nghiDen)) nghiDen = kq.nghiDen; });
      const l = lang.leu;
      if (l) lang.lenhDi(dvTl, { x: Math.floor(l.x), y: l.ct.y + l.ct.sau }); // trước cửa Lều
      the.baoGoiY("⛺ " + dvTl.ten + (l ? " về Lều nghỉ · " : " nghỉ · ") + dongHo(conNghi()));
    } else { thaQuai(r, "rut"); the.baoGoiY("🏃 " + dvTl.ten + " rút lui"); }
  }
  window.addEventListener("message", e => {
    if (!trongTran || e.source !== trongTran.fr.contentWindow || !e.data) return;
    if (e.data.loai === "dt-tran-ket") ghiKet(e.data.thang, e.data.nghiGiay);
    else if (e.data.loai === "dt-tran-dong") dongTran();
  });
  // rời trang giữa lúc đang tới / đang đánh: thả quái cho bạn khác (gửi kiểu giữ kết nối)
  addEventListener("pagehide", () => {
    const r = trongTran ? trongTran.r : dangToi;
    if (r && r.khoa && r.khoa.ten === tenMinh) mayChu.quaiKet(ten, r.id, "rut", null, true);
  });

  // ---------- mỗi khung ----------
  const tlDangDanh = new Set(); // tên bạn có Thủ lĩnh đang được vẽ đánh quái
  ctx.moiKhung((dt, t) => {
    // tiến tới quái: đủ gần thì vào trận; Thủ lĩnh dừng / đổi hướng khác thì thôi (thả quái)
    if (dangToi && !trongTran) {
      const r = dangToi, k = r.khoa, c = dvTl.duong[dvTl.duong.length - 1];
      if (!k || k.ten !== tenMinh) dangToi = null;
      else if (Math.hypot(dvTl.x - k.x, dvTl.z - k.z) <= ch.vaoTranCach) moTran(r);
      else if (dvTl.trangThai !== "di" || (c && Math.hypot(c.x - k.x, c.z - k.z) > 2.5)) {
        thaQuai(r); dangToi = null;
        if (dvTl.trangThai !== "di") the.baoGoiY("❌ Chưa tới được chỗ " + tenLoai(r.ma) + ".");
      }
    }
    // hình theo bản ghi + giờ máy chủ
    const con = new Set(), danhNay = new Set();
    for (const r of ghi.values()) {
      const p = viTri(r);
      let h = hinh.get(r.id);
      if (h && h.khoa !== r.id + ":" + r.sinhLuc) { xoaHinh(r.id); h = null; } // quái mới sinh lại cùng id
      if (p.mat) continue;
      con.add(r.id);
      if (!h) h = taoHinh(r);
      const hien = thay(p);
      h.vo.visible = hien;
      h.p = p;
      let huong = p.huong;
      // bé khác giữ / đánh quái này: quay về phía Thủ lĩnh bạn; đang đánh thì Thủ lĩnh bạn chém, quái chớp + nảy theo nhịp
      const ban = cuaBan(r) ? vung.tlBan(r.khoa.ten) : null;
      if (ban) {
        huong = Math.atan2(ban.dv.x - p.x, ban.dv.z - p.z);
        if (p.trangThai === "danh") { ban.dv.danhQuai = { x: p.x, z: p.z }; danhNay.add(r.khoa.ten); }
      }
      if (!hien) { h.nhan.hidden = true; continue; }
      let y = diaHinh.doCaoDi(p.x, p.z);
      if (p.trangThai === "danh" && cuaBan(r)) {
        const nhat = Math.floor((t + r.id * 0.37) / NHIP_DANH), pha = (t + r.id * 0.37) / NHIP_DANH - nhat;
        if (nhat !== h.nhat && pha > 0.45) { h.nhat = nhat; h.q3.chop(0.15); }
        if (pha > 0.45 && pha < 0.75) y += Math.sin((pha - 0.45) / 0.3 * Math.PI) * 0.18;
      }
      h.vo.position.set(p.x, y, p.z);
      if (huong != null) {
        const lech = Math.atan2(Math.sin(huong - h.vo.rotation.y), Math.cos(huong - h.vo.rotation.y));
        h.vo.rotation.y += lech * Math.min(1, dt * 8);
      }
      h.q3.capNhat(dt, t + r.id);
      if (p.trangThai === "chay") { if (Math.abs(h.mo - p.mo) > 0.02) { h.mo = p.mo; h.q3.datMo(Math.max(0, p.mo)); } h.nhan.hidden = true; }
      else {
        const chu = (p.trangThai === "danh" && cuaBan(r) ? "⚔️ " : "") + "Lv " + r.lv, m = mau(r);
        if (h.nhan.textContent !== chu) h.nhan.textContent = chu;
        if (h.nhan.dataset.mau !== m) h.nhan.dataset.mau = m;
        datNhan(h.nhan, p.x, y + CAO_QUAI + 0.35, p.z);
      }
    }
    for (const id of [...hinh.keys()]) if (!con.has(id)) xoaHinh(id);
    for (const chu of tlDangDanh) if (!danhNay.has(chu)) { const b = vung.tlBan(chu); if (b) b.dv.danhQuai = null; }
    tlDangDanh.clear(); for (const chu of danhNay) tlDangDanh.add(chu);
    // nghỉ ở Lều
    const n = conNghi();
    if (n > 0 && hTl.vo.visible) { nhanNghi.textContent = "⛺ " + dongHo(n); const p = hTl.vo.position; datNhan(nhanNghi, p.x, p.y + 2.1, p.z); }
    else if (!nhanNghi.hidden) nhanNghi.hidden = true;
  });

  // chạm: tia trúng quái đang hiện (không tính quái đang bỏ chạy)
  function trung(tia) {
    const ds = [...hinh.values()].filter(h => h.vo.visible && h.p && h.p.trangThai !== "chay").map(h => h.trung);
    const k = tia.intersectObjects(ds, false)[0];
    const r = k && ghi.get(k.object.userData.id);
    return r ? { q: r, kc: k.distance } : null;
  }

  return {
    trung, cham,
    moc: { // kịch bản thử Chrome
      ds: () => [...ghi.values()].map(r => { const p = viTri(r), h = hinh.get(r.id);
        return { id: r.id, ma: r.ma, lv: r.lv, x: p.x, z: p.z, nhaX: r.x, nhaZ: r.z, trangThai: p.mat ? "mat" : p.trangThai, hien: !!(h && h.vo.visible), mau: mau(r),
          khoa: r.khoa && r.khoa.ten, nhan: h && !h.nhan.hidden ? h.nhan.textContent : null }; }),
      conNghi, nghiDen: () => nghiDen, dangToi: () => dangToi && dangToi.id, trongTran: () => !!trongTran,
      cham: (id, chonTl) => { const r = ghi.get(id); if (r) cham(r, chonTl ? { vaiTro: "thu_linh" } : null); return !!r; },
      // đặt chỗ ở một quái ngay cạnh Thủ lĩnh (chỉ máy chủ giả: thử nhanh, khỏi đi xa)
      keBen: id => {
        const r = ghi.get(id), x = Math.floor(dvTl.x) + 1.5, z = Math.floor(dvTl.z) + 0.5;
        if (!r || !mayChu._dichQuai || !mayChu._dichQuai(id, x, z)) return false;
        Object.assign(r, { x, z, sinhLuc: gio(), khoa: null, chay: null }); dung(id); return true;
      },
      chamDiem: id => { const r = ghi.get(id); if (!r) return null; const p = viTri(r); return cam.chieu(p.x, diaHinh.doCaoDi(p.x, p.z) + 0.5, p.z); },
      hoiLai: () => vung.hoiLai(),
      ghiKet, dongTran, khung: () => trongTran && trongTran.fr
    }
  };
}
// 30/10/2026 17:30 - BƯỚC: TC_D06C1
