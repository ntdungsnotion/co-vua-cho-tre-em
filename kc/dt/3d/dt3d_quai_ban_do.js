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
//            - TC_D06C2a QUÁI HUNG DỮ (máy chủ đánh dấu lúc sinh, khối quaiBanDo.hung): vòng đỏ dưới chân, nhãn "😠 Lv n"
//              nền đỏ sẫm. Thủ lĩnh rảnh (không đang tới / đánh quái, không nghỉ) vào tầm nhìn quái (hung.tamNhin) thì
//              Thủ lĩnh dừng, KÈN LỆNH (dt3d_am_thanh.js kenLenh), máy chủ khoá quái trạng thái "lao" (mọi bé thấy quái
//              lao tới), tới nơi thì màn chiến đấu tự mở, QUÁI ĐÁNH TRƯỚC (?quaiTruoc=1). Trong lúc quái lao bé cho Thủ
//              lĩnh chạy đi được: quái tới nơi không thấy Thủ lĩnh thì thả. Đánh / rút / thả xong con đó miễn hung.mienGiay giây.
//            - TC_D06C2b NÔNG DÂN ĐÁNH QUÁI (người dùng 04/11/2026): quái hung dữ thấy nông dân của bé (bé đang mở game) thì
//              KÈN LỆNH + lao vào, nông dân đứng lại; tới nơi thì nông dân TỰ ĐÁNH (dt/dt_dan_danh.js: đúng 50%, luật trận
//              dt_tran_dau.js, chỉ số theo tộc cau_hinh_tran_dau.json nongDan) ngay trên bản đồ (động tác chém, quái chớp, nhãn
//              "⚔️ ❤️ máu" trên đầu dân, tiếng chém / trúng khi cảnh nằm trong khung hình). Thanh dưới KHÔNG đổi (bé có thể đang
//              xem thứ khác); góc trên bên phải hiện nút ⚔️ (số trận): bấm là VÀO ĐIỀU KHIỂN trận đó (màn chiến đấu đánh tiếp
//              từ máu + lượt đang có; quái còn đang lao thì vào ngay khi quái tới). Chọn nông dân rồi chạm quái = sai dân đi đánh
//              (tới nơi mở màn chiến đấu). Thắng / hòa: quái bỏ chạy, dân làm tiếp việc cũ, máu còn lại máy chủ giữ (không tự hồi).
//              Thua: dân hết máu BỎ CHẠY khỏi bản đồ = mất hẳn người dân (cả đồ đang vác). Bé ra lệnh cho dân đang đánh đi chỗ
//              khác = rút lui (thả quái, giữ máu).
//            - TC_D06C2d (người dùng 05/11/2026): nút ⚔️ Đánh là BONG BÓNG TRÊN ĐẦU QUÁI (máy tính: rê chuột khi đang chọn người;
//              điện thoại: chạm quái -> bong bóng, chạm bong bóng mới đánh), ghi ai sẽ đánh (người đang chọn, không thì nông dân rảnh
//              gần nhất; không còn ở thanh dưới); từ 2 trận nông dân
//              trở lên, bấm ⚔️ góc trên phải hiện DANH SÁCH TRẬN (quái + nông dân, máu) để bé chọn trận vào điều khiển.
// HÀM KHAI RA:
//   taoQuaiBanDo(the) -> Promise<{ trung(tia) -> { q, kc } | null, cham(q, hinhDangChon), moc }>
//     the = { ctx, lang, diaHinh, banDo, cauHinh, cam, suong?, laLanhDia?(x, y), dvTl, hTl, be: { ten, hoSo, lop },
//             mayChu (dt_may_chu.js / dt_may_chu_sb.js: gio, quaiGiu, quaiDanh, quaiKet),
//             vung ({ quanhDau, ngheQuanh, tlBan, hoiLai } của dt3d_vung.js), lop (DOM phủ cảnh), baoGoiY(chu),
//             (TC_D06D) khiXem(fn): chạm quái -> thanh dưới đọc fn() lấy thông số + nút ⚔️ Đánh; chonTl(): chọn Thủ lĩnh;
//             (TC_D06C2d) dangChon(): người đang chọn -> nút ⚔️ Đánh sai nông dân (đang chọn / rảnh gần nhất), không phải Thủ lĩnh }
//     trả thêm conNghi() (ms còn nghỉ), dongHo(ms) cho thông số Thủ lĩnh ở thanh dưới
//   dt3d_dieu_khien.js gọi trung / cham qua ui.trungQuai / ui.chamQuai.
// LUẬT NỐI: lõi KC_DT_QUAI_BAN_DO, KC_DT_LUOI, KC_DT_BAN_DO (SANG); lang.lenhDi; ctx.nghiVe (dt3d_canh.js).
//   TC_D06C2b: the thêm boNv (bộ vẽ nhân vật: dân bỏ chạy), boChon(dv) (bỏ chọn dân vừa mất); trả thêm mauDan(dv) ->
//     { hp, toiDa } cho thông số nông dân ở thanh dưới; moc thêm danDs(), vaoDan(idDv), laoDan(idQuai, idDv).
//   TC_D06C4: the thêm capNhatKho() (vẽ lại thanh tài nguyên), oKho(ma) -> ô tài nguyên trên thanh (đồ rơi bay tới). Thắng quái gọi
//     mayChu.quaiThang (máy chủ gieo đồ) thay quaiKet "be"; đồ nằm trên đất, nông dân ra nhặt (dt3d_do_roi.js); xem quái thấy "🎁 Có thể rơi".
// BƯỚC: TC_D06C4 (06/11/2026: quái rơi đồ); TC_D06F (05/11/2026: trang ẩn thì quái hung không lao); TC_D06A; TC_D06C1 (quái chung trên máy chủ, thấy bạn đánh quái, giờ nghỉ ở máy chủ); TC_D06C2a (quái hung dữ); TC_D06C2b (nông dân đánh quái)
// NGÀY: 30/10/2026; 30/10/2026 17:30; 04/11/2026; 04/11/2026 23:xx
// ================================================================
import * as THREE from "three";
import { taoQuai3d } from "./dt3d_quai.js";
import { NHIP_DANH } from "./dt3d_nhan_vat.js";
import { taoAmThanh } from "./dt3d_am_thanh.js";
import { taoDoRoi } from "./dt3d_do_roi.js"; // TC_D06C4

const QB = window.KC_DT_QUAI_BAN_DO, LUOI = window.KC_DT_LUOI, BD = window.KC_DT_BAN_DO;
const QU = window.KC_DT_QUAI, DD = window.KC_DT_DAN_DANH; // TC_D06C2b: nông dân tự đánh (trang phải nạp dt_quai.js, dt_tran_dau.js, dt_dan_danh.js)
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
  // TC_D06C2a: quái hung dữ
  const hung = ch.hung || null;
  const mien = new Map(); // id quái -> Date.now() hết miễn: vừa đánh / rút / thả thì con đó chưa lao lại ngay
  const datMien = id => { if (hung) mien.set(id, Date.now() + hung.mienGiay * 1000); };
  let am = null; // bộ tiếng (kèn lệnh); tạo một lần, mở ở lần chạm đầu
  try { am = taoAmThanh(); } catch (e) { am = null; }
  let soLao = 0; // số lần quái lao vào Thủ lĩnh (kịch bản thử Chrome đọc)
  const danh = new Map(); // TC_D06C2b: id nông dân -> trận của nông dân { dv, r, giai: "toi" | "lao" | "danh" | "be", td, nhan, ... }
  const giuTren = id => (dangToi && dangToi.id === id) || (trongTran && trongTran.r.id === id) || [...danh.values()].some(f => f.r.id === id);
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
  // TC_D06C4: bảng rơi đồ (máy chủ thật: bảng Supabase; không đọc được thì số mặc định du_lieu/roi_do.json)
  const RD = window.KC_DT_ROI_DO;
  let bangRoi = null;
  (mayChu.bangRoiDo ? mayChu.bangRoiDo() : Promise.resolve(null)).then(kq => kq && kq.ok ? kq : null).catch(() => null)
    .then(kq => kq || fetch(new URL("../du_lieu/roi_do.json", import.meta.url), { cache: "no-cache" }).then(r => r.json()).catch(() => null))
    .then(b => { bangRoi = b; });
  const coTheRoi = ma => RD && bangRoi ? RD.oRoi(bangRoi, ma).map(o => RD.bieuTuong(bangRoi, o[0])).filter((b, i, a) => a.indexOf(b) === i).join("") : "";
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
    if (r.hung) { // TC_D06C2a: vòng đỏ dưới chân quái hung dữ
      const vong = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.86, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0.85, depthWrite: false }));
      vong.position.y = 0.04; vong.renderOrder = 2; vo.add(vong);
    }
    ctx.canh.add(vo);
    const nhan = document.createElement("div"); nhan.className = "d3LvQuai"; nhan.hidden = true;
    if (r.hung) nhan.dataset.hung = "1";
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
  function giuQuai(r, p, lao) { // lao (TC_D06C2a): quái hung dữ tự lao tới p
    r.khoa = { ten: tenMinh, x: p.x, z: p.z, trang: lao ? "lao" : "toi", luc: gio() }; dung(r.id);
    mayChu.quaiGiu(ten, r.id, p.x, p.z, !!lao).then(kq => {
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
    dung(r.id); datMien(r.id);
    mayChu.quaiKet(ten, r.id, ket || "tha", null, giuKetNoi);
  }

  // TC_D06D: thông số quái cho ô "đang xem" ở thanh dưới (null: quái đã chạy / mất -> thanh về người đang chọn)
  const SUC = { xanh: "Yếu hơn Thủ lĩnh", vang: "Ngang sức Thủ lĩnh", do: "Mạnh hơn Thủ lĩnh" };
  function thongTin(r) {
    const p = viTri(r);
    if (!ghi.has(r.id) || p.mat || p.trangThai === "chay") return null;
    const roiCo = coTheRoi(r.ma); // TC_D06C4
    const tt = { anh: r.hung ? "😠" : "👾", ten: tenLoai(r.ma) + " · Lv " + r.lv, dong: DAU_MAU[mau(r)] + " " + SUC[mau(r)] + (roiCo ? " · 🎁 " + roiCo : ""), nut: [] };
    if (cuaBan(r)) tt.phu = "⚔️ Đang giao chiến với Thủ lĩnh của " + r.khoa.ten;
    else if (danCuaQuai(r)) tt.phu = "⚔️ Đang giao chiến với " + danCuaQuai(r).dv.ten; // TC_D06C2b
    else if (dangToi === r && r.khoa && r.khoa.trang === "lao") tt.phu = "😠 Đang lao vào " + dvTl.ten + "!";
    else if (dangToi === r) tt.phu = "⚔️ " + dvTl.ten + " đang tiến tới";
    else if (conNghi() > 0) tt.phu = "⛺ " + dvTl.ten + " đang nghỉ · còn " + dongHo(conNghi());
    else {
      tt.phu = r.hung ? "😠 Hung dữ: thấy người là lao tới" : "Đang lang thang";
      // TC_D06C2d (người dùng 05/11/2026): nút ⚔️ Đánh nằm TRÊN ĐẦU QUÁI (bong bóng, xem moDau), không ở thanh dưới
    }
    return tt;
  }

  // TC_D06C2d: nông dân đi đánh khi bấm ⚔️ Đánh: người đang chọn (nếu là nông dân của bé, không đang đánh), không thì nông dân
  // không đang đánh gần quái nhất; null = làng chưa có nông dân rảnh
  function danDiDanhQuai(r) {
    const c = the.dangChon && the.dangChon();
    const ranh = d => !danh.has(d.id) && d.trangThai !== "danh" && !d.chay;
    if (c && c.vaiTro === "nong_dan" && !c.dv.laBan && c.dv.idMayChu != null && ranh(c.dv)) return c.dv;
    const p = viTri(r);
    let tot = null, kc = Infinity;
    for (const d of dsDanMinh()) { if (!ranh(d)) continue; const k = Math.hypot(d.x - p.x, d.z - p.z); if (k < kc) { kc = k; tot = d; } }
    return tot;
  }

  // ===== TC_D06C2d: BONG BÓNG "⚔️ Đánh" TRÊN ĐẦU QUÁI (người dùng 05/11/2026) =====
  // Máy tính: đang chọn Thủ lĩnh / nông dân của bé (sau này cả lính), rê chuột tới quái -> bong bóng hiện trên đầu quái; bấm quái
  //   hoặc bong bóng = người đang chọn đánh. Không chọn ai: bấm quái = chọn quái, thông số ở thanh dưới (không bong bóng).
  // Điện thoại (không rê được), đang chọn người: chạm quái KHÔNG đánh ngay (tránh chạm nhầm khi kéo bản đồ) -> bong bóng hiện trên đầu quái
  //   ghi ai sẽ đánh; chạm bong bóng = đánh. Chạm chỗ khác / quái chạy / quái đã có người đánh -> bong bóng tắt.
  // Ai đánh: đang chọn Thủ lĩnh -> Thủ lĩnh; đang chọn nông dân (rảnh) -> người đó; không chọn ai -> nông dân rảnh gần quái nhất,
  //   làng chưa có nông dân thì Thủ lĩnh (người dùng 05/11/2026: "Vào trận chiến thì nông dân chiến chứ không phải thủ lĩnh").
  function aiDanh(r) {
    const c = the.dangChon && the.dangChon();
    if (c && !c.dv.laBan && c.vaiTro === "thu_linh") return { tl: true, ten: dvTl.ten };
    const d = danDiDanhQuai(r);
    return d ? { dv: d, ten: d.ten } : { tl: true, ten: dvTl.ten };
  }
  function danhBang(r, ai) {
    if (ai.tl) { if (the.chonTl) the.chonTl(); cham(r, { vaiTro: "thu_linh" }); }
    else cham(r, { vaiTro: "nong_dan", dv: ai.dv });
  }
  const coTheDanh = r => { const p = viTri(r); return ghi.has(r.id) && !p.mat && p.trangThai !== "chay" && !r.khoa && !trongTran && thay(p); };
  const nutDau = document.createElement("button");
  nutDau.type = "button"; nutDau.className = "d3DanhDau"; nutDau.hidden = true;
  document.body.appendChild(nutDau);
  let dau = null, dauAn = 0; // dau = { r, re: true (rê chuột) | false (chạm) }
  function moDau(r, re) {
    if (!coTheDanh(r)) { anDau(); return; }
    dau = { r, re }; dauAn = 0; veDau();
  }
  function anDau() { dau = null; if (!nutDau.hidden) nutDau.hidden = true; }
  function veDau() {
    if (!dau) return;
    const r = dau.r, h = hinh.get(r.id);
    if (!coTheDanh(r) || !h || !h.vo.visible) { anDau(); return; }
    const ai = aiDanh(r), chu = '⚔️ Đánh<small>' + (ai.tl ? "👑 " : "🧑‍🌾 ") + ai.ten + "</small>";
    if (nutDau.dataset.chu !== chu) { nutDau.dataset.chu = chu; nutDau.innerHTML = chu; nutDau.setAttribute("aria-label", ai.ten + " đánh " + tenLoai(r.ma) + " Lv " + r.lv); }
    const p = h.vo.position, [sx, sy, truoc] = raManHinh(p.x, p.y + CAO_QUAI + 0.95, p.z);
    nutDau.hidden = !truoc;
    nutDau.style.transform = `translate(${Math.round(sx)}px, ${Math.round(sy)}px) translate(-50%, -100%)`;
  }
  nutDau.addEventListener("pointerdown", e => e.stopPropagation());
  nutDau.addEventListener("click", e => {
    e.stopPropagation();
    if (!dau) return;
    const r = dau.r, ai = aiDanh(r);
    anDau();
    if (coTheDanh(r)) danhBang(r, ai);
  });
  nutDau.addEventListener("pointerenter", () => { if (dau) dauAn = 0; });
  nutDau.addEventListener("pointerleave", e => { if (dau && dau.re && e.pointerType === "mouse") dauAn = performance.now() + 350; });
  canvas.addEventListener("pointerdown", e => { if (dau && !(dau.re && e.pointerType === "mouse")) anDau(); });
  // rê chuột: chỉ khi đang chọn người của bé
  const tiaRe = new THREE.Raycaster(), diemRe = new THREE.Vector2();
  canvas.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse" || e.buttons || trongTran) return;
    const c = the.dangChon && the.dangChon();
    if (!c || c.dv.laBan) { if (dau && dau.re) anDau(); return; }
    const b = canvas.getBoundingClientRect();
    diemRe.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
    tiaRe.setFromCamera(diemRe, cam.camera);
    const k = trung(tiaRe);
    if (k && coTheDanh(k.q)) { canvas.style.cursor = "crosshair"; if (!dau || dau.r !== k.q) moDau(k.q, true); else dauAn = 0; }
    else { canvas.style.cursor = ""; if (dau && dau.re && !dauAn) dauAn = performance.now() + 350; } // rời quái: chờ chút để kịp đưa chuột lên bong bóng
  });
  ctx.moiKhung(() => { if (dau && dauAn && performance.now() > dauAn) anDau(); else veDau(); });

  // Chạm / bấm quái từ dt3d_dieu_khien.js (e = sự kiện con trỏ): chuột + đang chọn người -> đánh ngay; còn lại -> xem + bong bóng
  // Không chọn người của bé (người dùng 05/11/2026): bấm quái = chọn quái, thông tin ở thanh dưới, không có bong bóng.
  function chamUi(r, chonH, e) {
    const laChuot = !e || e.pointerType === "mouse", coNguoi = !!(chonH && !chonH.dv.laBan);
    if (!coNguoi) { anDau(); cham(r, null); return; }
    if (laChuot) { anDau(); cham(r, chonH); return; }
    cham(r, null); // điện thoại: xem quái + bong bóng, chạm bong bóng mới đánh
    moDau(r, false);
  }

  function cham(r, chonH) {
    if (trongTran) return;
    const p = viTri(r);
    if (p.mat || p.trangThai === "chay") return;
    if (the.khiXem) the.khiXem(() => thongTin(r)); // TC_D06D
    const hq = hinh.get(r.id); if (hq && the.den) the.den(hq.vo); // TC_D06C2e: đèn chiếu quái đang chọn
    const nhan = DAU_MAU[mau(r)] + " " + tenLoai(r.ma) + " · Lv " + r.lv;
    if (cuaBan(r)) { the.baoGoiY("⚔️ " + nhan + " đang giao chiến với Thủ lĩnh của " + r.khoa.ten + "."); return; }
    const fq = danCuaQuai(r); // TC_D06C2b
    if (fq) { the.baoGoiY("⚔️ " + nhan + " đang giao chiến với " + fq.dv.ten + "."); return; }
    if (chonH && chonH.vaiTro === "nong_dan" && !chonH.dv.laBan) { danDiDanh(r, chonH.dv, p, nhan); return; } // TC_D06C2b: sai dân đi đánh
    if (!chonH || chonH.vaiTro !== "thu_linh") { the.baoGoiY(nhan); return; }
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
    const k = r.khoa, quaiTruoc = k.trang === "lao"; // TC_D06C2a: quái lao vào thì quái đánh trước
    dvTl.huongMuon = Math.atan2(k.x - dvTl.x, k.z - dvTl.z);
    k.trang = "danh"; dung(r.id);
    baoDanh(r, 0);
    const h = hinh.get(r.id);
    const ts = new URLSearchParams({ nhung: "1", quai: r.ma, lv: String(r.lv), cl: be.hoSo.chungLoai || "nhan", gioi: be.hoSo.gioi || "nam",
      lop: String(be.lop || 2), ten: be.ten || "", tl: dvTl.ten || "", chu: (h && h.chu) || "" });
    if (quaiTruoc) ts.set("quaiTruoc", "1");
    if (dvTl.mau != null) ts.set("hp", String(dvTl.mau)); // TC_D06C2g: máu Thủ lĩnh còn lại (không tự hồi)
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
    if (trongTran.dan) { const f = trongTran.dan, hp = trongTran.hpBe; trongTran = null; khung.remove(); ctx.nghiVe = false; xongDanDieuKhien(f, ket, hp); return; } // TC_D06C2b
    const trongTran0Hp = trongTran.hpBe; // TC_D06C2g
    trongTran = null; khung.remove(); ctx.nghiVe = false;
    const ten2 = tenLoai(r.ma), k = r.khoa || { x: r.x, z: r.z };
    dung(r.id); datMien(r.id);
    if (ket === "be" || ket === null) {
      r.chay = { x: k.x, z: k.z, huong: Math.atan2(k.x - dvTl.x, k.z - dvTl.z), luc: gio() }; r.khoa = null;
      const hp = trongTran0Hp; if (Number.isFinite(hp)) dvTl.mau = hp; // TC_D06C2g: máu Thủ lĩnh giữ nguyên sau trận
      const dan = Number.isFinite(hp) ? { mau: hp } : null;
      const loiBao = (ket === "be" ? "🏆 Thắng · " : "🤝 Hòa · ") + ten2 + " bỏ chạy";
      if (ket === "be" && mayChu.quaiThang) mayChu.quaiThang(ten, r.id, dan).then(kq => nhanRoi(kq, loiBao)); // TC_D06C4: đồ rơi trên đất
      else mayChu.quaiKet(ten, r.id, ket === "be" ? "be" : "hoa", null, false, dan);
      the.baoGoiY(loiBao);
    } else if (ket === "quai") {
      r.khoa = null; dvTl.mau = null; // TC_D06C2g: thua -> nghỉ ở Lều, nghỉ xong đủ máu
      mayChu.quaiKet(ten, r.id, "quai", nghiGiay).then(kq => { if (kq.ok && Number.isFinite(kq.nghiDen)) nghiDen = kq.nghiDen; });
      const l = lang.leu;
      if (l) lang.lenhDi(dvTl, { x: Math.floor(l.x), y: l.ct.y + l.ct.sau }); // trước cửa Lều
      the.baoGoiY("⛺ " + dvTl.ten + (l ? " về Lều nghỉ · " : " nghỉ · ") + dongHo(conNghi()));
    } else {
      if (Number.isFinite(trongTran0Hp)) { // TC_D06C2g: rút lui vẫn giữ máu đã mất
        dvTl.mau = Math.min(trongTran0Hp, dvTl.mau == null ? Infinity : dvTl.mau);
        mayChu.quaiKet(ten, -1, "tha", null, false, { mau: dvTl.mau });
      }
      thaQuai(r, "rut"); the.baoGoiY("🏃 " + dvTl.ten + " rút lui");
    }
  }
  window.addEventListener("message", e => {
    if (!trongTran || e.source !== trongTran.fr.contentWindow || !e.data) return;
    if (Number.isFinite(e.data.hpBe)) trongTran.hpBe = e.data.hpBe; // TC_D06C2b: máu nông dân lúc kết / rút
    if (e.data.loai === "dt-tran-ket") ghiKet(e.data.thang, e.data.nghiGiay);
    else if (e.data.loai === "dt-tran-dong") dongTran();
  });
  // rời trang giữa lúc đang tới / đang đánh: thả quái cho bạn khác (gửi kiểu giữ kết nối)
  addEventListener("pagehide", () => {
    const r = trongTran && !trongTran.dan ? trongTran.r : dangToi;
    if (r && r.khoa && r.khoa.ten === tenMinh && !r.khoa.dv) mayChu.quaiKet(ten, r.id, "rut", null, true);
    for (const f of danh.values()) mayChu.quaiKet(ten, f.r.id, "rut", null, true, { dv: f.dv.idMayChu, mau: mauHienTai(f) }); // TC_D06C2b
  });

  // ---------- mỗi khung ----------
  const tlDangDanh = new Set(); // người của bạn (Thủ lĩnh / nông dân, TC_D06C2b) đang được vẽ đánh quái
  ctx.moiKhung((dt, t) => {
    // tiến tới quái: đủ gần thì vào trận; Thủ lĩnh dừng / đổi hướng khác thì thôi (thả quái)
    if (dangToi && !trongTran) {
      const r = dangToi, k = r.khoa, c = dvTl.duong[dvTl.duong.length - 1];
      if (!k || k.ten !== tenMinh) dangToi = null;
      else if (k.trang === "lao") { // TC_D06C2a: quái hung dữ đang lao tới: tới nơi mà Thủ lĩnh còn đứng gần thì vào trận
        if (viTri(r).trangThai !== "lao") {
          if (Math.hypot(dvTl.x - k.x, dvTl.z - k.z) <= ch.vaoTranCach) moTran(r);
          else { thaQuai(r); dangToi = null; the.baoGoiY("🏃 " + dvTl.ten + " đã thoát khỏi " + tenLoai(r.ma) + "!"); }
        }
      }
      else if (Math.hypot(dvTl.x - k.x, dvTl.z - k.z) <= ch.vaoTranCach) moTran(r);
      else if (dvTl.trangThai !== "di" || (c && Math.hypot(c.x - k.x, c.z - k.z) > 2.5)) {
        thaQuai(r); dangToi = null;
        if (dvTl.trangThai !== "di") the.baoGoiY("❌ Chưa tới được chỗ " + tenLoai(r.ma) + ".");
      }
    }
    // TC_D06C2a: quái hung dữ thấy Thủ lĩnh (rảnh: không đang tới quái, không đánh, không nghỉ) thì kèn lệnh + lao tới
    // TC_D06F: trang đang ẩn (làng chạy nền) thì quái hung dữ không lao vào (bé không thấy để đánh / chạy)
    if (hung && !ctx.chayNen && !dangToi && !trongTran && conNghi() <= 0) laoNeuThay();
    if (hung && !ctx.chayNen) laoVaoDan(); // TC_D06C2b: quái hung dữ thấy nông dân
    capNhatDan(dt); // TC_D06C2b: trận của nông dân (tự đánh trên bản đồ)
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
      const ban = cuaBan(r) ? (r.khoa.dv != null && vung.dvBan ? vung.dvBan(r.khoa.dv) : vung.tlBan(r.khoa.ten)) : null; // TC_D06C2b: nông dân bạn
      if (ban) {
        huong = Math.atan2(ban.dv.x - p.x, ban.dv.z - p.z);
        if (p.trangThai === "danh") { ban.dv.danhQuai = { x: p.x, z: p.z }; danhNay.add(ban); }
      }
      const fm = danCuaQuai(r); // TC_D06C2b: nông dân của mình đang đánh con này
      if (fm) huong = Math.atan2(fm.dv.x - p.x, fm.dv.z - p.z);
      const dangGiao = p.trangThai === "danh" && (cuaBan(r) || (fm && fm.giai === "danh"));
      if (!hien) { h.nhan.hidden = true; continue; }
      let y = diaHinh.doCaoDi(p.x, p.z);
      if (dangGiao) {
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
        const chu = (dangGiao ? "⚔️ " : "") + (r.hung ? "😠 " : "") + "Lv " + r.lv, m = mau(r);
        if (h.nhan.textContent !== chu) h.nhan.textContent = chu;
        if (h.nhan.dataset.mau !== m) h.nhan.dataset.mau = m;
        const lao = p.trangThai === "lao" ? "1" : ""; if ((h.nhan.dataset.lao || "") !== lao) h.nhan.dataset.lao = lao;
        datNhan(h.nhan, p.x, y + CAO_QUAI + 0.35, p.z);
      }
    }
    for (const id of [...hinh.keys()]) if (!con.has(id)) xoaHinh(id);
    for (const b of tlDangDanh) if (!danhNay.has(b)) b.dv.danhQuai = null;
    tlDangDanh.clear(); for (const b of danhNay) tlDangDanh.add(b);
    // nghỉ ở Lều
    const n = conNghi();
    if (n > 0 && hTl.vo.visible) { nhanNghi.textContent = "⛺ " + dongHo(n); const p = hTl.vo.position; datNhan(nhanNghi, p.x, p.y + 2.1, p.z); }
    else if (!nhanNghi.hidden) nhanNghi.hidden = true;
  });

  // TC_D06C2a: tìm quái hung dữ gần Thủ lĩnh nhất đang thấy Thủ lĩnh (lõi diemLao: trong tầm nhìn quái, không đuổi xa
  // chỗ ở, không vào lãnh địa / sát Lều); có thì dừng Thủ lĩnh, kèn lệnh, máy chủ khoá quái trạng thái "lao"
  function laoNeuThay() {
    if (!hTl.vo.visible) return;
    const bay = Date.now();
    let tot = null;
    for (const r of ghi.values()) {
      if (!r.hung || r.khoa || r.chay || (mien.get(r.id) || 0) > bay) continue;
      const p = viTri(r);
      if (!thay(p)) continue;
      const K = QB.diemLao(ch, r, p, dvTl, diDuoc);
      if (!K) continue;
      const d = Math.hypot(p.x - dvTl.x, p.z - dvTl.z);
      if (!tot || d < tot.d) tot = { r, K, d };
    }
    if (!tot) return;
    const r = tot.r;
    dungTl();
    dvTl.huongMuon = Math.atan2(tot.K.x - dvTl.x, tot.K.z - dvTl.z);
    giuQuai(r, tot.K, true);
    dangToi = r; soLao++;
    if (am) am.kenLenh();
    if (the.khiXem) the.khiXem(() => thongTin(r));
    the.baoGoiY("📯 " + tenLoai(r.ma) + " hung dữ lao vào " + dvTl.ten + "!");
  }

  // ================= TC_D06C2b: NÔNG DÂN ĐÁNH QUÁI =================
  const ND = chTran.nongDan || {};
  const clBe = () => (be.hoSo && be.hoSo.chungLoai) || lang.chungLoai || "nhan";
  const toiDaDan = () => { const c = (ND.chiSo || {})[clBe()] || (ND.chiSo || {}).nhan; return c ? c.hp : 0; };
  // máu nông dân: dv.mau (máy chủ giữ, null = đầy); không tự hồi (người dùng 04/11/2026: chỉ phù thủy chữa)
  function mauDan(dv) { const toiDa = toiDaDan(); return { hp: dv.mau == null ? toiDa : Math.max(0, Math.min(toiDa, dv.mau)), toiDa }; }
  const mauHienTai = f => (f.td ? f.td.hp().be : mauDan(f.dv).hp);
  const danCuaQuai = r => { if (!r.khoa || r.khoa.ten !== tenMinh || r.khoa.dv == null) return null; for (const f of danh.values()) if (f.r === r) return f; return null; };
  const dsDanMinh = () => lang.donVi.filter(d => d.vaiTro === "nong_dan" && !d.laBan && d.idMayChu != null);
  let soDanMat = 0, soDanThang = 0, kenLuc = 0;
  const keu = () => { if (am && Date.now() - kenLuc > 4000) { kenLuc = Date.now(); am.kenLenh(); } }; // nhiều con lao cùng lúc: một hồi kèn

  // nút ⚔️ ở góc trên bên phải (người dùng 04/11/2026: thanh dưới giữ thứ bé đang xem; kiếm hiện ở góc trên cùng bên phải)
  const nutTran = document.createElement("button");
  nutTran.type = "button"; nutTran.className = "d3Nut d3Khung d3TranNhanh"; nutTran.hidden = true;
  nutTran.setAttribute("aria-label", "Vào trận nông dân đang đánh quái");
  (document.querySelector(".d3Tren") || document.body).appendChild(nutTran);
  const tranDangCo = () => [...danh.values()].filter(f => f.giai === "danh" || f.giai === "lao");
  // TC_D06C2h: trận NGOÀI (dt3d_tru.js: trụ của bạn đang bắn nông dân) cùng hiện ở nút ⚔️ + danh sách trận. Mỗi nguồn trả
  // [{ khoa, html, nhan, vao(), xem() }]: hàng có 2 nút ⚔️ Đánh (vào trận câu hỏi) + 👀 Xem (tới chỗ nông dân để dẫn đi trốn)
  const dsNgoai = []; let banNgoai = () => false;
  const tranNgoai = () => dsNgoai.flatMap(f => f() || []);
  // TC_D06C2d (người dùng 05/11/2026): từ 2 trận trở lên, bấm ⚔️ hiện DANH SÁCH TRẬN nông dân vs quái (thông tin quái + nông dân),
  // bé chọn trận để vào điều khiển; 1 trận thì vào thẳng như cũ
  const bangTran = document.createElement("div");
  bangTran.className = "d3BangTran d3Khung"; bangTran.hidden = true; bangTran.setAttribute("role", "dialog"); bangTran.setAttribute("aria-label", "Chọn trận để vào điều khiển");
  document.body.appendChild(bangTran);
  let khoaBang = "";
  const dongBang = () => { if (!bangTran.hidden) { bangTran.hidden = true; khoaBang = ""; nutTran.setAttribute("aria-expanded", "false"); } };
  function dongTranBang(f) {
    const r = f.r, mq = f.td ? f.td.hp() : null, hpQ = mq ? mq.quai : QU.taoQuai(r.ma, r.lv, chTran).hpToiDa;
    const toiQ = mq ? mq.quaiToiDa : hpQ, md = mauDan(f.dv), hpD = mauHienTai(f);
    return { f, khoa: f.dv.id + ":" + r.id + ":" + f.giai + ":" + hpD + ":" + hpQ,
      html: '<span class="d3BtQuai"><b>' + (r.hung ? "😠 " : "👾 ") + tenLoai(r.ma) + " · Lv " + r.lv + '</b><i>❤️ ' + hpQ + "/" + toiQ + "</i></span>"
        + '<span class="d3BtVs">' + (f.giai === "lao" ? "đang lao tới" : "⚔️") + "</span>"
        + '<span class="d3BtDan"><b>🧑‍🌾 ' + f.dv.ten + '</b><i' + (hpD / Math.max(1, md.toiDa) < 0.3 ? ' class="d3Thap"' : "") + '>❤️ ' + hpD + "/" + md.toiDa + "</i></span>" };
  }
  function veBang() {
    if (bangTran.hidden) return;
    const ds = tranDangCo(), ng = tranNgoai();
    if ((!ds.length && !ng.length) || trongTran || banNgoai()) { dongBang(); return; }
    const dong = ds.map(dongTranBang), khoa = dong.map(d => d.khoa).concat(ng.map(n => n.khoa)).join("|");
    if (khoa === khoaBang) return;
    khoaBang = khoa;
    const dau = document.createElement("div"); dau.className = "d3BtDau";
    dau.innerHTML = "<strong>⚔️ " + (ds.length + ng.length) + " trận đang diễn ra</strong>";
    const dong0 = document.createElement("button"); dong0.type = "button"; dong0.className = "d3Nut d3BtDong"; dong0.textContent = "✖"; dong0.setAttribute("aria-label", "Đóng");
    dong0.addEventListener("click", e => { e.stopPropagation(); dongBang(); });
    dau.appendChild(dong0);
    // TC_D06C2h: hàng trận ngoài: thông tin + nút ⚔️ Đánh + 👀 Xem
    const hangNgoai = n => {
      const h = document.createElement("div"); h.className = "d3BtDong1 d3BtNgoai"; h.innerHTML = n.html;
      const nut = (chu, nhan, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = "d3Nut d3BtNut"; b.textContent = chu; b.setAttribute("aria-label", nhan);
        b.addEventListener("click", e => { e.stopPropagation(); dongBang(); fn(); }); return b; };
      const cum = document.createElement("span"); cum.className = "d3BtCum";
      cum.append(nut("⚔️ Đánh", "Vào trận: " + n.nhan, n.vao), nut("👀 Xem", "Tới chỗ " + n.nhan, n.xem));
      h.appendChild(cum);
      return h;
    };
    bangTran.replaceChildren(dau, ...dong.map(d => {
      const b = document.createElement("button"); b.type = "button"; b.className = "d3BtDong1"; b.innerHTML = d.html;
      b.setAttribute("aria-label", "Vào điều khiển " + d.f.dv.ten + " đánh " + tenLoai(d.f.r.ma));
      b.addEventListener("click", e => { e.stopPropagation(); dongBang(); if (!trongTran && danh.get(d.f.dv.id) === d.f) vaoDieuKhien(d.f); });
      return b;
    }), ...ng.map(hangNgoai));
  }
  nutTran.setAttribute("aria-haspopup", "dialog"); nutTran.setAttribute("aria-expanded", "false");
  nutTran.addEventListener("click", e => {
    e.stopPropagation();
    if (trongTran || banNgoai()) return;
    const ds = tranDangCo();
    if (ds.length >= 2 || tranNgoai().length) { // TC_D06C2h: có trận trụ thì luôn mở danh sách (bé chọn Đánh hay Xem)
      if (!bangTran.hidden) { dongBang(); return; }
      bangTran.hidden = false; khoaBang = ""; nutTran.setAttribute("aria-expanded", "true"); veBang(); return;
    }
    if (ds[0]) vaoDieuKhien(ds[0]);
  });
  addEventListener("keydown", e => { if (e.key === "Escape") dongBang(); });
  canvas.addEventListener("pointerdown", dongBang); // chạm bản đồ: đóng bảng
  function veNut() {
    const n = tranDangCo().length + tranNgoai().length; // TC_D06C2h: cả trận trụ bắn nông dân
    if (nutTran.hidden !== !n) nutTran.hidden = !n;
    const chu = "⚔️" + (n > 1 ? " " + n : "");
    if (nutTran.textContent !== chu) nutTran.textContent = chu;
    veBang();
  }

  function moDan(dv, r, giai) {
    const nhan = document.createElement("div"); nhan.className = "d3MauDan"; nhan.hidden = true; the.lop.appendChild(nhan);
    const f = { dv, r, giai, td: null, nhan, quaiTruoc: giai === "lao", muonVao: false };
    danh.set(dv.id, f);
    return f;
  }
  function dongDan(f) { danh.delete(f.dv.id); f.nhan.remove(); veNut(); }

  // giữ quái cho nông dân f trên máy chủ (khoá có dv); bị từ chối thì thôi
  function giuQuaiDan(r, p, lao, f) {
    r.khoa = { ten: tenMinh, dv: f.dv.idMayChu, x: p.x, z: p.z, trang: lao ? "lao" : "toi", luc: gio() }; dung(r.id);
    mayChu.quaiGiu(ten, r.id, p.x, p.z, !!lao, f.dv.idMayChu).then(kq => {
      if (kq.ok) { if (r.khoa && kq.quai && kq.quai.khoa) r.khoa = kq.quai.khoa; return; }
      if (!LOI_DUNG[kq.ma] && kq.ma !== "khong_phai_nguoi") return; // lỗi mạng: đánh trên máy như đã giữ
      if (danh.get(f.dv.id) !== f || f.giai === "be") return;
      r.khoa = kq.ma === "dang_danh" && kq.chu ? { ten: kq.chu, x: p.x, z: p.z, trang: "danh", luc: gio() } : null;
      if (kq.ma === "quai_mat") ghi.delete(r.id);
      lang.thoiDanh(f.dv); dongDan(f);
    });
  }
  function thaDan(f, ket, thongBao) { // ket "rut" | "tha": thả quái, dân giữ máu, làm tiếp việc cũ
    const r = f.r, hp = mauHienTai(f);
    if (r.khoa && r.khoa.ten === tenMinh) r.khoa = null;
    dung(r.id); datMien(r.id);
    f.dv.mau = hp < mauDan(f.dv).toiDa || f.dv.mau != null ? hp : null;
    mayChu.quaiKet(ten, r.id, ket || "tha", null, false, { dv: f.dv.idMayChu, mau: hp });
    lang.thoiDanh(f.dv); dongDan(f);
    if (thongBao) the.baoGoiY(thongBao);
  }

  // quái hung dữ thấy nông dân: lao vào (mỗi khung nhiều nhất một con mới)
  function laoVaoDan() {
    const bay = Date.now();
    let tot = null;
    for (const r of ghi.values()) {
      if (!r.hung || r.khoa || r.chay || (mien.get(r.id) || 0) > bay) continue;
      const p = viTri(r);
      if (!thay(p)) continue;
      for (const dv of dsDanMinh()) {
        if (danh.has(dv.id) || dv.trangThai === "danh") continue;
        const K = QB.diemLao(ch, r, p, dv, diDuoc);
        if (!K) continue;
        const d = Math.hypot(p.x - dv.x, p.z - dv.z);
        if (!tot || d < tot.d) tot = { r, K, d, dv };
      }
    }
    if (!tot) return;
    const f = moDan(tot.dv, tot.r, "lao");
    lang.dungDanh(tot.dv, tot.K.x, tot.K.z); // dân đứng lại, quay về phía quái
    giuQuaiDan(tot.r, tot.K, true, f);
    soLao++; keu(); veNut();
    the.baoGoiY("📯 " + tenLoai(tot.r.ma) + " hung dữ lao vào " + tot.dv.ten + "!");
  }

  // chọn nông dân rồi chạm quái: dân đi tới, tới nơi mở màn chiến đấu (bé tự chọn đánh)
  function danDiDanh(r, dv, p, nhan) {
    const cu = danh.get(dv.id);
    if (cu) { if (cu.r === r) return; if (cu.giai === "toi") thaDan(cu, "tha"); else { the.baoGoiY("⚔️ " + dv.ten + " đang đánh quái."); return; } }
    if (r.khoa && r.khoa.ten === tenMinh) { the.baoGoiY("⚔️ " + nhan + " đang giao chiến."); return; }
    const f = moDan(dv, r, "toi");
    f.muonVao = true;
    giuQuaiDan(r, p, false, f);
    if (Math.hypot(dv.x - r.khoa.x, dv.z - r.khoa.z) <= ch.vaoTranCach) return; // đã đứng sát
    if (!lang.lenhDi(dv, { x: Math.floor(r.khoa.x), y: Math.floor(r.khoa.z) })) { thaDan(f, "tha", "❌ Chỗ đó chưa tới được."); return; }
    the.baoGoiY("⚔️ " + dv.ten + " tiến về " + nhan);
  }

  function baoDanhDan(f, lan) {
    mayChu.quaiDanh(ten, f.r.id, f.dv.idMayChu).then(kq => {
      if (kq.ok || danh.get(f.dv.id) !== f) return;
      if (kq.ma === "xa_qua" && lan < 3) setTimeout(() => baoDanhDan(f, lan + 1), 2000);
    });
  }
  function batDauDanh(f) {
    const r = f.r, k = r.khoa;
    lang.dungDanh(f.dv, k.x, k.z);
    k.trang = "danh"; dung(r.id);
    f.giai = "danh";
    f.td = DD.taoTuDanh({ ch: chTran, chungLoai: clBe(), quai: QU.taoQuai(r.ma, r.lv, chTran), hp: mauDan(f.dv).hp, quaiTruoc: f.quaiTruoc, t: Date.now() });
    baoDanhDan(f, 0);
    veNut();
    if (f.muonVao) vaoDieuKhien(f);
  }

  // điểm (x, z) có nằm trong khung hình không (tiếng đánh chỉ kêu khi bé đang nhìn thấy cảnh)
  const trongKhung = (x, z) => { const [sx, sy, truoc] = raManHinh(x, diaHinh.doCaoDi(x, z) + 0.6, z); return truoc && sx >= 0 && sy >= 0 && sx <= canvas.clientWidth && sy <= canvas.clientHeight; };
  function tiengLuot(f, k) {
    if (!am || ctx.nghiVe || !trongKhung(f.dv.x, f.dv.z)) return;
    const x = 0;
    if (k.satThuong > 0) { am.chem(x); am.trung(x, k.chiMang, 0.12); }
    else if (k.kieu === "ne") { am.chem(x); am.ne(x, 0.1); }
    else am.hut(x);
  }

  // ===== TC_D06C4: ĐỒ RƠI NẰM TRÊN ĐẤT (dt3d_do_roi.js; người dùng 06/11/2026 chọn: rơi xuống đất, nông dân nhặt) =====
  const doRoi = taoDoRoi({ ctx, cam, canvas, lang, diaHinh, mayChu, ten, baoGoiY: c => the.baoGoiY(c), capNhatKho: the.capNhatKho, oKho: the.oKho,
    lop: the.lop, dangChon: the.dangChon, dangDanh: dv => danh.has(dv.id), tenMinh, ngheQuanh: f => vung.ngheQuanh(f) });
  doRoi.nap();
  let soLanRoi = 0, dsRoiCuoi = []; // kịch bản thử Chrome đọc
  function nhanRoi(kq, loiBao, dvThang) {
    if (!kq || !kq.ok || !Array.isArray(kq.roi) || !kq.roi.length) return;
    soLanRoi++; dsRoiCuoi = kq.roi;
    doRoi.them(kq.roi, dvThang);
    the.baoGoiY(loiBao + " · 🎁 rơi " + kq.roi.map(d => d.bieuTuong + " +" + d.so).join(" ") + (dvThang ? "" : " · chạm đồ để nông dân ra nhặt"));
  }

  function ketThucDan(f, thang, hp) {
    const r = f.r, dv = f.dv, ten2 = tenLoai(r.ma), k = r.khoa || { x: r.x, z: r.z };
    dung(r.id); datMien(r.id);
    if (thang === "quai") { // hết máu: bỏ chạy khỏi bản đồ = mất hẳn người dân
      r.khoa = null;
      mayChu.quaiKet(ten, r.id, "quai", null, false, { dv: dv.idMayChu, mau: 0 });
      dongDan(f); danBoChay(dv, k); soDanMat++;
      the.baoGoiY("💨 " + dv.ten + " hết máu, bỏ chạy khỏi thung lũng · mất 1 dân");
      return;
    }
    r.chay = { x: k.x, z: k.z, huong: Math.atan2(k.x - dv.x, k.z - dv.z), luc: gio() }; r.khoa = null;
    dv.mau = hp;
    const loiBao = (thang === "be" ? "🏆 " + dv.ten + " thắng · " : "🤝 Hòa · ") + ten2 + " bỏ chạy · ❤️ " + hp + "/" + mauDan(dv).toiDa;
    if (thang === "be" && mayChu.quaiThang) mayChu.quaiThang(ten, r.id, { dv: dv.idMayChu, mau: hp }).then(kq => nhanRoi(kq, loiBao, dv)); // TC_D06C4: nông dân thắng tự nhặt
    else mayChu.quaiKet(ten, r.id, thang === "be" ? "be" : "hoa", null, false, { dv: dv.idMayChu, mau: hp });
    lang.thoiDanh(dv); dongDan(f);
    if (thang === "be") soDanThang++;
    the.baoGoiY(loiBao);
  }
  // dân hết máu: bỏ khỏi làng, hình chạy ra xa (ngược phía quái) rồi mất
  const chayDi = [];
  function danBoChay(dv, k) {
    lang.boDonVi(dv);
    if (the.boChon) the.boChon(dv);
    const h = the.boNv && the.boNv.dsHinh.find(x => x.dv === dv);
    if (!h) return;
    const g = Math.atan2(dv.x - k.x, dv.z - k.z);
    dv.trangThai = "dung"; dv.chay = true; dv.duong = [{ x: dv.x + Math.sin(g) * 6, z: dv.z + Math.cos(g) * 6 }]; dv.huongMuon = g;
    chayDi.push({ dv, h, g, con: 2.2 });
    if (am && trongKhung(dv.x, dv.z)) am.chayTron(0);
  }

  function vaoDieuKhien(f) {
    if (trongTran || banNgoai()) return; // TC_D06C2h: đang trong trận trụ
    if (f.giai !== "danh") { f.muonVao = true; the.baoGoiY("⚔️ Vào trận khi " + tenLoai(f.r.ma) + " tới chỗ " + f.dv.ten); return; }
    const c = f.td.chuyen(), r = f.r, h = hinh.get(r.id);
    f.giai = "be"; veNut();
    const quaiTruoc = (c.soLuot % 2 === 0) === f.quaiTruoc; // lượt sau (soLuot + 1) quái đánh trước?
    const ts = new URLSearchParams({ nhung: "1", vai: "nong_dan", quai: r.ma, lv: String(r.lv), cl: clBe(), gioi: "nam",
      lop: String(be.lop || 2), ten: be.ten || "", tl: f.dv.ten || "Nông dân", chu: (h && h.chu) || "",
      hp: String(c.hpBe), hpQuai: String(c.hpQuai), luot: String(c.soLuot), nd: String(f.dv.id) });
    if (quaiTruoc) ts.set("quaiTruoc", "1");
    const khung = document.createElement("div"); khung.className = "d3Tran";
    const fr = document.createElement("iframe");
    fr.title = "Trận đấu"; fr.allow = "autoplay"; fr.src = new URL("../thu_tran_dau.html?" + ts, import.meta.url).href;
    khung.appendChild(fr); document.body.appendChild(khung);
    trongTran = { r, khung, fr, ket: undefined, dan: f, hpBe: c.hpBe };
    ctx.nghiVe = true;
    fr.focus();
  }
  function xongDanDieuKhien(f, ket, hp) {
    if (danh.get(f.dv.id) !== f) return;
    const m = Number.isFinite(hp) ? hp : mauHienTai(f);
    f.td = null;
    if (ket === "be" || ket === null || ket === "quai") ketThucDan(f, ket === "quai" ? "quai" : ket, ket === "quai" ? 0 : m);
    else { f.dv.mau = m; thaDan(f, "rut", "🏃 " + f.dv.ten + " rút lui · ❤️ " + m + "/" + mauDan(f.dv).toiDa); }
  }

  function capNhatDan(dt) {
    const bay = Date.now();
    for (const f of [...danh.values()]) {
      const dv = f.dv, r = f.r, k = r.khoa;
      if (!lang.donVi.includes(dv) || !ghi.has(r.id)) { dongDan(f); continue; }
      if (f.giai === "be") continue; // bé đang điều khiển trong màn chiến đấu
      if (!k || k.ten !== tenMinh) { lang.thoiDanh(dv); dongDan(f); continue; } // máy chủ đã thả
      const gan = Math.hypot(dv.x - k.x, dv.z - k.z) <= ch.vaoTranCach + 0.3;
      if (f.giai === "lao") {
        if (viTri(r).trangThai !== "lao") {
          if (gan && dv.trangThai === "danh") batDauDanh(f);
          else thaDan(f, "tha", "🏃 " + dv.ten + " đã thoát khỏi " + tenLoai(r.ma) + "!");
        }
      } else if (f.giai === "toi") {
        if (gan) batDauDanh(f);
        else if (dv.trangThai !== "di") thaDan(f, "tha", dv.trangThai === "dung" ? "❌ " + dv.ten + " chưa tới được chỗ " + tenLoai(r.ma) + "." : null);
      } else if (f.giai === "danh") {
        if (dv.trangThai !== "danh") { thaDan(f, "rut", "🏃 " + dv.ten + " rút lui · ❤️ " + mauHienTai(f) + "/" + mauDan(dv).toiDa); continue; } // bé sai dân đi chỗ khác
        dv.huongMuon = Math.atan2(k.x - dv.x, k.z - dv.z);
        for (const kq of f.td.capNhat(bay)) {
          tiengLuot(f, kq);
          const h = hinh.get(r.id); if (h && kq.tanCong === "be" && kq.satThuong > 0) h.q3.chop(0.15);
          if (kq.ketThuc) { ketThucDan(f, kq.ketThuc.thang, f.td.hp().be); break; }
        }
      }
    }
    // nhãn máu trên đầu nông dân đang bị tấn công / đang đánh
    for (const f of danh.values()) {
      if (f.giai === "toi" || f.giai === "be" || !thay(f.dv)) { if (!f.nhan.hidden) f.nhan.hidden = true; continue; }
      const m = mauHienTai(f), td = mauDan(f.dv).toiDa, chu = "⚔️ ❤️ " + m + "/" + td;
      if (f.nhan.textContent !== chu) f.nhan.textContent = chu;
      const thap = m / Math.max(1, td) < 0.3 ? "1" : ""; if ((f.nhan.dataset.thap || "") !== thap) f.nhan.dataset.thap = thap;
      datNhan(f.nhan, f.dv.x, diaHinh.doCaoDi(f.dv.x, f.dv.z) + 2.0, f.dv.z);
    }
    // dân bỏ chạy: chạy ra xa rồi mất
    for (let i = chayDi.length - 1; i >= 0; i--) {
      const c = chayDi[i];
      c.con -= dt;
      c.dv.x += Math.sin(c.g) * 3 * dt; c.dv.z += Math.cos(c.g) * 3 * dt;
      c.dv.duong = [{ x: c.dv.x + Math.sin(c.g), z: c.dv.z + Math.cos(c.g) }];
      if (c.con <= 0) { the.boNv.xoa(c.h); chayDi.splice(i, 1); }
    }
    veNut();
  }

  // chạm: tia trúng quái đang hiện (không tính quái đang bỏ chạy)
  function trung(tia) {
    const ds = [...hinh.values()].filter(h => h.vo.visible && h.p && h.p.trangThai !== "chay").map(h => h.trung);
    const k = tia.intersectObjects(ds, false)[0];
    const r = k && ghi.get(k.object.userData.id);
    return r ? { q: r, kc: k.distance } : null;
  }

  return {
    trung, cham: chamUi, conNghi, dongHo, mauDan, // TC_D06C2b: mauDan; TC_D06C2d: chạm quái qua chamUi (bong bóng ⚔️ Đánh)
    // TC_D06C2g (trụ phòng thủ, dt3d_tru.js): Thủ lĩnh đang tới / đang đánh quái thì trụ không khai chiến; thua trụ thì nghỉ
    banThuLinh: () => !!(dangToi || (trongTran && !trongTran.dan)), datNghi: ms => { nghiDen = Math.max(nghiDen, ms); }, dungTl,
    // TC_D06C2h (trụ bắn nông dân, dt3d_tru.js): thêm nguồn trận ngoài cho nút ⚔️; báo đang trong trận trụ; màn trận quái đang mở;
    // nông dân hết máu bỏ chạy (hình chạy ra xa rồi mất); vẽ lại nút
    themTranNgoai: fn => { dsNgoai.push(fn); veNut(); }, datBanNgoai: fn => { banNgoai = fn; }, dangTran: () => !!trongTran,
    danBoChay, veNut, dangDanh: dv => danh.has(dv.id),
    // TC_D06C5: nông dân bị quái hung dữ tấn công (quái đang lao tới, hoặc trận do quái lao vào) -> dt3d_nong_dan.js báo ⚠️
    biTanCong: dv => { const f = danh.get(dv.id); return !!(f && (f.giai === "lao" || (f.giai === "danh" && f.quaiTruoc))); },
    moc: { // kịch bản thử Chrome
      ds: () => [...ghi.values()].map(r => { const p = viTri(r), h = hinh.get(r.id);
        return { id: r.id, ma: r.ma, lv: r.lv, x: p.x, z: p.z, nhaX: r.x, nhaZ: r.z, trangThai: p.mat ? "mat" : p.trangThai, hien: !!(h && h.vo.visible), mau: mau(r),
          hung: !!r.hung, khoa: r.khoa && r.khoa.ten, khoaTrang: r.khoa && r.khoa.trang, nhan: h && !h.nhan.hidden ? h.nhan.textContent : null }; }),
      conNghi, nghiDen: () => nghiDen, dangToi: () => dangToi && dangToi.id, trongTran: () => !!trongTran,
      soLanRoi: () => soLanRoi, dsRoiCuoi: () => dsRoiCuoi, bangRoi: () => bangRoi, doRoi: doRoi.moc, // TC_D06C4
      soLao: () => soLao, kenLenh: () => (am && am.thongKe ? (am.thongKe().daKeu || {}).kenLenh || 0 : 0), // TC_D06C2a
      cham: (id, chonTl) => { const r = ghi.get(id); if (r) cham(r, chonTl ? { vaiTro: "thu_linh" } : null); return !!r; },
      // đặt chỗ ở một quái cách Thủ lĩnh (dx, dz) ô (mặc định 1 ô bên phải; chỉ máy chủ giả: thử nhanh, khỏi đi xa);
      // hung = true / false (TC_D06C2a): đặt luôn quái hung dữ / hiền
      keBen: (id, dx, dz, hungMoi) => {
        const r = ghi.get(id), x = Math.floor(dvTl.x) + 0.5 + (dx == null ? 1 : dx), z = Math.floor(dvTl.z) + 0.5 + (dz || 0);
        if (!r || !mayChu._dichQuai || !mayChu._dichQuai(id, x, z, hungMoi)) return false;
        const hd = hungMoi == null ? r.hung : !!hungMoi;
        if (hd !== !!r.hung) xoaHinh(id); // vẽ lại (vòng đỏ)
        Object.assign(r, { x, z, sinhLuc: gio(), khoa: null, chay: null, hung: hd }); dung(id); mien.delete(id); return true;
      },
      chamDiem: id => { const r = ghi.get(id); if (!r) return null; const p = viTri(r); return cam.chieu(p.x, diaHinh.doCaoDi(p.x, p.z) + 0.5, p.z); },
      hoiLai: () => vung.hoiLai(),
      ghiKet, dongTran, khung: () => trongTran && trongTran.fr,
      // TC_D06C2b: trận nông dân
      dau: () => (dau && !nutDau.hidden ? { id: dau.r.id, re: dau.re, chu: nutDau.textContent } : null), // TC_D06C2d
      chamUi: (id, kieu) => { const r = ghi.get(id); if (r) chamUi(r, the.dangChon ? the.dangChon() : null, { pointerType: kieu || "touch" }); return !!r; },
      reVao: id => { const r = ghi.get(id); if (r) moDau(r, true); return !!r; },
      bangTran: () => (bangTran.hidden ? null : [...bangTran.querySelectorAll(".d3BtDong1")].map(b => b.textContent)), // TC_D06C2d
      danDs: () => [...danh.values()].map(f => ({ dv: f.dv.idMayChu, ten: f.dv.ten, quai: f.r.id, giai: f.giai, hp: mauHienTai(f), toiDa: mauDan(f.dv).toiDa, soLuot: f.td ? f.td.soLuot() : 0 })),
      mauDan, danMat: () => soDanMat, danThang: () => soDanThang, nutTran: () => ({ hien: !nutTran.hidden, so: nutTran.textContent }),
      vaoDan: idDv => { const f = [...danh.values()].find(k => k.dv.idMayChu === idDv); if (f) vaoDieuKhien(f); return !!f; },
      bamNutTran: () => nutTran.click(),
      dsDan: () => lang.donVi.filter(d => d.vaiTro === "nong_dan" && !d.laBan).map(d => ({ id: d.idMayChu, ten: d.ten, x: d.x, z: d.z, trangThai: d.trangThai, mau: d.mau == null ? null : d.mau })),
      // đặt quái (máy chủ giả) cạnh nông dân idDv cách (dx, dz) ô
      keBenDan: (id, idDv, dx, dz, hungMoi) => {
        const r = ghi.get(id), dv = lang.donVi.find(d => d.idMayChu === idDv);
        if (!r || !dv || !mayChu._dichQuai) return false;
        const x = Math.floor(dv.x) + 0.5 + (dx == null ? 2 : dx), z = Math.floor(dv.z) + 0.5 + (dz || 0);
        if (!mayChu._dichQuai(id, x, z, hungMoi)) return false;
        const hd = hungMoi == null ? r.hung : !!hungMoi; if (hd !== !!r.hung) xoaHinh(id);
        Object.assign(r, { x, z, sinhLuc: gio(), khoa: null, chay: null, hung: hd }); dung(id); mien.delete(id); return true;
      },
      chamBangDan: (id, idDv) => { const r = ghi.get(id), dv = lang.donVi.find(d => d.idMayChu === idDv); if (!r || !dv) return false; cham(r, { vaiTro: "nong_dan", dv }); return true; }
    }
  };
}
// 30/10/2026 17:30 - BƯỚC: TC_D06C1; 04/11/2026 - TC_D06D (thông số quái + nút ⚔️ Đánh ở thanh dưới); 04/11/2026 - TC_D06C2a (quái hung dữ); 04/11/2026 23:xx - TC_D06C2b (nông dân đánh quái)
// 05/11/2026 - BƯỚC: TC_D06C2d (⚔️ Đánh sai nông dân; danh sách trận khi có từ 2 trận)
// 05/11/2026 - BƯỚC: TC_D06C2g (máu Thủ lĩnh còn lại vào / ra trận quái; banThuLinh, datNghi, dungTl cho trụ phòng thủ)
// 06/11/2026 - BƯỚC: TC_D06C2h (trận ngoài ở nút ⚔️: trụ bắn nông dân, hàng có ⚔️ Đánh + 👀 Xem; themTranNgoai, datBanNgoai, danBoChay)
// 06/11/2026 - BƯỚC: TC_D06C4 (thắng quái -> quaiThang, đồ rơi nằm trên đất cho nông dân nhặt, xem quái thấy có thể rơi gì)
// 06/11/2026 - BƯỚC: TC_D06C5 (biTanCong: nông dân bị quái hung dữ tấn công)
