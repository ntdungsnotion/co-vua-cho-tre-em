// ================================================================
// FILE: dt/3d/dt3d_quai_ban_do.js  (ES module) - PHẦN VẼ 3D: QUÁI TRÊN BẢN ĐỒ + VÀO TRẬN
// CHỨC NĂNG: Quái nhỏ lang thang trong Thung Lũng (lõi dt/dt_quai_ban_do.js, hình dt3d_quai.js):
//            - chỉ hiện khi đứng trong vùng SÁNG của bé; trên đầu có nhãn "Lv n" khung xanh / vàng / đỏ
//              (so với cấp Thủ lĩnh); không đi vào lãnh địa, không tới sát lều
//            - đang chọn Thủ lĩnh + chạm quái: quái đứng lại, Thủ lĩnh tiến tới; tới gần (vaoTranCach)
//              thì MÀN CHIẾN ĐẤU mở phủ lên bản đồ (khung dt/thu_tran_dau.html?nhung=1, trận theo lượt
//              TC_D05, câu hỏi theo trình độ của bé); bản đồ thôi vẽ trong lúc đánh (dân làng vẫn làm)
//            - thắng / hòa: quái bỏ chạy, mờ dần rồi mất, hoiSinhGiay sau quái mới xuất hiện chỗ khác;
//              thua: Thủ lĩnh về Lều nghỉ (thua.nghiGiay của cau_hinh_tran_dau.json), nhãn "⛺ m:ss" trên
//              đầu, nghỉ xong mới đánh tiếp; rút lui giữa trận: quái đi tiếp, không phạt
//            - chạm quái khi chưa chọn Thủ lĩnh: chỉ báo tên + cấp
//            - lưu ở máy (localStorage "kc_dt_quai_<tên bé>"): hẹn quái xuất hiện lại + giờ hết nghỉ
// HÀM KHAI RA:
//   taoQuaiBanDo(the) -> Promise<{ trung(tia) -> { q, kc } | null, cham(q, hinhDangChon), moc }>
//     the = { ctx, lang, diaHinh, banDo, cauHinh, cam, suong?, laLanhDia?(x, y), dvTl, hTl, be: { ten, hoSo, lop },
//             lop (DOM phủ cảnh), baoGoiY(chu) }
//   dt3d_dieu_khien.js gọi trung / cham qua ui.trungQuai / ui.chamQuai.
// LUẬT NỐI: lõi KC_DT_QUAI_BAN_DO, KC_DT_LUOI, KC_DT_BAN_DO (SANG); lang.lenhDi; ctx.nghiVe (dt3d_canh.js).
// BƯỚC: TC_D06A
// NGÀY: 30/10/2026
// ================================================================
import * as THREE from "three";
import { taoQuai3d } from "./dt3d_quai.js";

const QB = window.KC_DT_QUAI_BAN_DO, LUOI = window.KC_DT_LUOI, BD = window.KC_DT_BAN_DO;
const CAO_QUAI = 0.95; // quái trên bản đồ cao chừng này (ô), thấp hơn Thủ lĩnh
const CHU_QUAI = { slime_so: () => String(1 + Math.floor(Math.random() * 9)), nam_chu_cai: () => "ABCDEFGHKLMNPRST"[Math.floor(Math.random() * 16)], dom_dom: () => "?" };
const DAU_MAU = { xanh: "🟢", vang: "🟡", do: "🔴" };

export async function taoQuaiBanDo(the) {
  const { ctx, lang, diaHinh, cauHinh, cam, suong, dvTl, hTl, be } = the;
  const ch = cauHinh.quaiBanDo;
  const chTran = await fetch(new URL("../du_lieu/cau_hinh_tran_dau.json", import.meta.url), { cache: "no-cache" }).then(r => r.json());
  const canvas = ctx.renderer.domElement;

  // ---------- lưu ở máy ----------
  const KHOA = "kc_dt_quai_" + String(be.ten || "khach").toLowerCase();
  let luuCu = null; try { luuCu = JSON.parse(localStorage.getItem(KHOA) || "null"); } catch (e) { /* bị chặn */ }
  let nghiDen = (luuCu && Number(luuCu.nghiDen)) || 0;
  const luu = () => { try { localStorage.setItem(KHOA, JSON.stringify({ hen: bo.hen(), nghiDen })); } catch (e) { /* bị chặn: chỉ mất hẹn */ } };

  // ---------- lõi ----------
  const leuGan = (x, y) => lang.congTrinh.some(c => c.loai === "leu" && Math.hypot(c.x + c.rong / 2 - x - 0.5, c.y + c.sau / 2 - y - 0.5) < ch.khongGanLeu);
  const diDuoc = (x, y) => LUOI.diDuoc(lang.luoi, x, y) && !lang.ruongTaiO(x, y) && !(the.laLanhDia && the.laLanhDia(x, y)) && !leuGan(x, y);
  const bo = QB.taoBoQuai({ ch, W: lang.W, H: lang.H, diDuoc, cong: the.banDo.cong || [], bayGio: Date.now, hen: luuCu && luuCu.hen });
  const tenLoai = ma => (chTran.quai.loai[ma] || {}).ten || ma;
  const capTl = () => ch.capThuLinh;
  const mau = q => QB.mauKhung(ch, q.lv, capTl());

  // ---------- hình ----------
  const hinh = new Map(); // id -> { q3, trung, nhan (DOM), chu }
  const hinhTrung = new THREE.CylinderGeometry(0.55, 0.55, 1.2, 8).translate(0, 0.6, 0);
  const vlTrung = new THREE.MeshBasicMaterial({ visible: false });
  function taoHinh(q) {
    const q3 = taoQuai3d(q.ma, { nhe: ctx.nhe });
    q3.nhom.scale.setScalar(CAO_QUAI / q3.cao);
    const chu = CHU_QUAI[q.ma] ? CHU_QUAI[q.ma]() : ""; if (chu) q3.datChu(chu);
    const vo = new THREE.Group(); vo.add(q3.nhom);
    const trung = new THREE.Mesh(hinhTrung, vlTrung); trung.userData.q = q; vo.add(trung);
    ctx.canh.add(vo);
    const nhan = document.createElement("div"); nhan.className = "d3LvQuai"; nhan.dataset.mau = mau(q); nhan.textContent = "Lv " + q.lv; nhan.hidden = true;
    the.lop.appendChild(nhan);
    const h = { q3, vo, trung, nhan, chu, mo: 1 };
    hinh.set(q.id, h);
    return h;
  }
  function xoaHinh(id) {
    const h = hinh.get(id); if (!h) return;
    ctx.canh.remove(h.vo); h.nhan.remove(); hinh.delete(id);
    h.vo.traverse(o => { if (o.isMesh && o.geometry !== hinhTrung) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } });
  }
  const thay = q => !suong || suong.muc(Math.floor(q.x), Math.floor(q.z)) === BD.SANG;

  // nhãn "⛺ m:ss" trên đầu Thủ lĩnh khi đang nghỉ
  const nhanNghi = document.createElement("div"); nhanNghi.className = "d3NghiTl"; nhanNghi.hidden = true; the.lop.appendChild(nhanNghi);
  const conNghi = () => Math.max(0, nghiDen - Date.now());
  const dongHo = ms => { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

  const vt = new THREE.Vector3();
  const raManHinh = (x, y, z) => { vt.set(x, y, z).project(cam.camera); return [(vt.x + 1) / 2 * canvas.clientWidth, (1 - vt.y) / 2 * canvas.clientHeight, vt.z < 1]; };
  const datNhan = (el, x, y, z) => { const [sx, sy, truoc] = raManHinh(x, y, z); el.hidden = !truoc; el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -100%)`; };

  // ---------- đánh quái ----------
  let dangToi = null;   // quái Thủ lĩnh đang tiến tới
  let trongTran = null; // { q, khung, ket }
  let demLuu = 0, soHenCu = bo.hen().length;

  function cham(q, chonH) {
    const ten = tenLoai(q.ma), nhan = DAU_MAU[mau(q)] + " " + ten + " · Lv " + q.lv;
    if (trongTran || q.trangThai === "chay") return;
    if (!chonH || chonH.vaiTro !== "thu_linh") { the.baoGoiY(chonH ? nhan + " · ❌ Chỉ Thủ lĩnh 👑 đánh quái" : nhan); return; }
    if (conNghi() > 0) { the.baoGoiY("⛺ " + dvTl.ten + " đang nghỉ ở Lều · còn " + dongHo(conNghi())); return; }
    if (dangToi && dangToi !== q) bo.tha(dangToi);
    bo.giu(q);
    if (Math.hypot(dvTl.x - q.x, dvTl.z - q.z) <= ch.vaoTranCach) { dangToi = q; return; } // đã đứng sát: khung sau vào trận
    if (!lang.lenhDi(dvTl, { x: Math.floor(q.x), y: Math.floor(q.z) })) { bo.tha(q); dangToi = null; the.baoGoiY("❌ Chỗ đó chưa tới được."); return; }
    dangToi = q;
    the.baoGoiY("⚔️ " + dvTl.ten + " tiến về " + nhan);
  }

  function dungTl() { // dừng Thủ lĩnh tại chỗ (gửi lệnh đi tới ô đang đứng để máy chủ nhớ đúng chỗ)
    lang.lenhDi(dvTl, { x: Math.floor(dvTl.x), y: Math.floor(dvTl.z) });
    dvTl.duong.length = 0;
  }

  function moTran(q) {
    dangToi = null;
    dungTl();
    dvTl.huongMuon = Math.atan2(q.x - dvTl.x, q.z - dvTl.z);
    q.huong = Math.atan2(dvTl.x - q.x, dvTl.z - q.z);
    const h = hinh.get(q.id);
    const ts = new URLSearchParams({ nhung: "1", quai: q.ma, lv: String(q.lv), cl: be.hoSo.chungLoai || "nhan", gioi: be.hoSo.gioi || "nam",
      lop: String(be.lop || 2), ten: be.ten || "", tl: dvTl.ten || "", chu: (h && h.chu) || "" });
    const khung = document.createElement("div"); khung.className = "d3Tran";
    const fr = document.createElement("iframe");
    fr.title = "Trận đấu"; fr.allow = "autoplay"; fr.src = new URL("../thu_tran_dau.html?" + ts, import.meta.url).href;
    khung.appendChild(fr); document.body.appendChild(khung);
    trongTran = { q, khung, fr, ket: undefined };
    ctx.nghiVe = true; // bản đồ thôi vẽ, lõi làng vẫn chạy
    fr.focus();
  }

  // thang: "be" | "quai" | null (hòa) | undefined (rút lui)
  function ghiKet(thang, nghiGiay) {
    if (!trongTran || trongTran.ket !== undefined) return;
    trongTran.ket = thang;
    if (thang === "quai") { nghiDen = Date.now() + Math.max(0, nghiGiay || chTran.thua.nghiGiay) * 1000; luu(); }
  }
  function dongTran() {
    if (!trongTran) return;
    const { q, khung, ket } = trongTran;
    trongTran = null; khung.remove(); ctx.nghiVe = false;
    const ten = tenLoai(q.ma);
    if (ket === "be" || ket === null) {
      bo.boChay(q, dvTl.x, dvTl.z);
      the.baoGoiY((ket === "be" ? "🏆 Thắng · " : "🤝 Hòa · ") + ten + " bỏ chạy");
    } else if (ket === "quai") {
      bo.tha(q);
      const l = lang.leu;
      if (l) lang.lenhDi(dvTl, { x: Math.floor(l.x), y: l.ct.y + l.ct.sau }); // trước cửa Lều
      the.baoGoiY("⛺ " + dvTl.ten + (l ? " về Lều nghỉ · " : " nghỉ · ") + dongHo(conNghi()));
    } else { bo.tha(q); the.baoGoiY("🏃 " + dvTl.ten + " rút lui"); }
  }
  window.addEventListener("message", e => {
    if (!trongTran || e.source !== trongTran.fr.contentWindow || !e.data) return;
    if (e.data.loai === "dt-tran-ket") ghiKet(e.data.thang, e.data.nghiGiay);
    else if (e.data.loai === "dt-tran-dong") dongTran();
  });

  // ---------- mỗi khung ----------
  ctx.moiKhung((dt, t) => {
    bo.capNhat(dt);
    // tiến tới quái: đủ gần thì vào trận; Thủ lĩnh dừng / đổi hướng khác thì thôi
    if (dangToi && !trongTran) {
      const q = dangToi, kc = Math.hypot(dvTl.x - q.x, dvTl.z - q.z), c = dvTl.duong[dvTl.duong.length - 1];
      if (!bo.ds.includes(q)) dangToi = null;
      else if (kc <= ch.vaoTranCach) moTran(q);
      else if (dvTl.trangThai !== "di" || (c && Math.hypot(c.x - q.x, c.z - q.z) > 2.5)) {
        bo.tha(q); dangToi = null;
        if (dvTl.trangThai !== "di") the.baoGoiY("❌ Chưa tới được chỗ " + tenLoai(q.ma) + ".");
      }
    }
    // hình theo lõi
    const con = new Set();
    for (const q of bo.ds) {
      con.add(q.id);
      const h = hinh.get(q.id) || taoHinh(q);
      const hien = thay(q);
      h.vo.visible = hien;
      if (!hien) { h.nhan.hidden = true; continue; }
      const y = diaHinh.doCaoDi(q.x, q.z);
      h.vo.position.set(q.x, y, q.z);
      const lech = Math.atan2(Math.sin(q.huong - h.vo.rotation.y), Math.cos(q.huong - h.vo.rotation.y));
      h.vo.rotation.y += lech * Math.min(1, dt * 8);
      h.q3.capNhat(dt, t + q.id);
      if (q.trangThai === "chay") { if (Math.abs(h.mo - q.mo) > 0.02) { h.mo = q.mo; h.q3.datMo(Math.max(0, q.mo)); } h.nhan.hidden = true; }
      else datNhan(h.nhan, q.x, y + CAO_QUAI + 0.35, q.z);
    }
    for (const id of [...hinh.keys()]) if (!con.has(id)) xoaHinh(id);
    // nghỉ ở Lều
    const n = conNghi();
    if (n > 0 && hTl.vo.visible) { nhanNghi.textContent = "⛺ " + dongHo(n); const p = hTl.vo.position; datNhan(nhanNghi, p.x, p.y + 2.1, p.z); }
    else if (!nhanNghi.hidden) nhanNghi.hidden = true;
    // lưu khi có quái mới mất / mới xuất hiện (hẹn đổi)
    demLuu += dt;
    const soHen = bo.hen().length;
    if (soHen !== soHenCu || demLuu > 15) { soHenCu = soHen; demLuu = 0; luu(); }
  });

  // chạm: tia trúng quái đang hiện (không tính quái đang bỏ chạy)
  function trung(tia) {
    const ds = [...hinh.values()].filter(h => h.vo.visible && h.trung.userData.q.trangThai !== "chay").map(h => h.trung);
    const k = tia.intersectObjects(ds, false)[0];
    return k ? { q: k.object.userData.q, kc: k.distance } : null;
  }

  return {
    trung, cham,
    moc: { // kịch bản thử Chrome
      ds: () => bo.ds.map(q => ({ id: q.id, ma: q.ma, lv: q.lv, x: q.x, z: q.z, trangThai: q.trangThai, hien: !!(hinh.get(q.id) && hinh.get(q.id).vo.visible), mau: mau(q) })),
      hen: () => bo.hen(), conNghi, dangToi: () => dangToi && dangToi.id, trongTran: () => !!trongTran,
      cham: (id, chonTl) => { const q = bo.theoId(id); if (q) cham(q, chonTl ? { vaiTro: "thu_linh" } : null); return !!q; },
      // đặt quái đứng ngay cạnh Thủ lĩnh (thử nhanh, khỏi đi xa)
      keBen: id => { const q = bo.theoId(id); if (!q) return false; q.x = q.nhaX = dvTl.x + 1; q.z = q.nhaZ = dvTl.z; return true; },
      chamDiem: id => { const q = bo.theoId(id); return q && cam.chieu(q.x, diaHinh.doCaoDi(q.x, q.z) + 0.5, q.z); },
      ghiKet, dongTran, khung: () => trongTran && trongTran.fr
    }
  };
}
// 30/10/2026 - BƯỚC: TC_D06A
