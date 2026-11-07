// ================================================================
// FILE: dt/3d/dt3d_do_roi.js  (ES module) - ĐỒ RƠI NẰM TRÊN ĐẤT, NÔNG DÂN NHẶT RỒI MANG VỀ KHO
// CHỨC NĂNG (repo_rieng dac_ta_roi_do.md, TC_D06C4; người dùng 06/11/2026 chọn "Rơi xuống đất, nông dân nhặt"):
//   - Quái thua: các món đồ (🍖 🪵...) bật ra từ chỗ quái rồi NẰM SÁT ĐẤT (hình nhỏ 20 px có bóng; TC_D06C5 người dùng: "lửng lơ
//     trên không", "thu lại còn 1/4"), chỉ bé thắng nhặt được;
//     bé khác trong vùng cũng THẤY (hình xám), chạm vào thì báo "Đây không phải đồ của bạn" (người dùng 06/11/2026).
//     Mỗi lần trang hỏi lại máy chủ (chuKyGui giây) thì đọc lại đồ trên đất: thêm đồ mới của bé khác, bỏ đồ đã nhặt / đã mất.
//     còn dưới 60 giây thì nhấp nháy; hết hạn (máy chủ: hetLuc) thì mờ dần rồi mất.
//   - Chạm một món: nông dân đang chọn (hoặc nông dân rảnh gần nhất) đi tới nhặt cả đống đồ quanh đó (cách ≤ 2 ô), từng món một.
//     Nông dân thắng quái thì tự nhặt đống đồ của trận đó.
//   - TC_D06C5 (người dùng 06/11/2026: "Nông dân cần thời gian thu hoạch như thu tài nguyên khác"): tới sát món đồ, nông dân đứng
//     NHẶT TỪ TỪ: số đồ × nhịp làm của nguồn cùng loại (cau_hinh.json lang.nguon.*.nhipLam: thịt 1 giây / cái, gỗ 0,8...), có
//     vạch tiến độ dưới món đồ; đi chỗ khác thì nhặt lại từ đầu. Xong thì hỏi máy chủ (nhatDo) -> đồ CẦM TRÊN TAY (hình nhỏ trên đầu).
//   - TC_D06C5 (người dùng chọn "Nông dân mang đồ về kho"): nhặt hết đống thì nông dân mang đồ về Lều / kho gần nhất nhận loại đồ
//     đó; tới nơi hỏi máy chủ (catDo) -> đồ bay lên ô tài nguyên trên thanh, kho tăng (không quá sức chứa: kho đầy thì vẫn cầm,
//     báo bé). Bé giao việc khác giữa chừng: đồ vẫn cầm, lần sau nông dân cất đồ về kho thì cất luôn.
//     Máy chủ báo chưa tới (đường máy chủ tính thẳng) thì hỏi lại sau.
// HÀM KHAI RA:
//   taoDoRoi(the) -> { them(ds, dv?), nap(), moc }
//     the = { ctx, cam, canvas, lang, diaHinh, mayChu, ten, tenMinh?, cauHinh, baoGoiY, capNhatKho?, oKho?(ma), lop, dangChon?(),
//             dangDanh?(dv), ngheQuanh?(f) (mỗi lần hỏi lại máy chủ) }
//     them(ds, dv): thêm đồ máy chủ trả (quaiThang.roi); dv = nông dân vừa thắng -> tự đi nhặt
//     nap(): đọc đồ đang nằm trên đất + đồ nông dân đang cầm từ máy chủ (vào lại trang; cũng chạy mỗi lần hỏi lại máy chủ)
// BƯỚC: TC_D06C4 - NGÀY: 06/11/2026; TC_D06C5 06/11/2026 23:5x (nhặt mất thời gian, cầm đồ mang về kho)
// ================================================================
import * as THREE from "three";

const GOM_O = 2;          // chạm một món: nhặt luôn các món cách nó ≤ bấy nhiêu ô (cùng đống)
const HOI_LAI_MS = 1500;  // máy chủ báo chưa tới: hỏi lại sau
const BO_SAU_MS = 90000;  // nông dân đi quá lâu chưa tới (bị giao việc khác, kẹt đường): thôi
const NHIP_MAC_DINH = 1;  // giây / cái khi không có nguồn cùng loại

export function taoDoRoi(the) {
  const { ctx, cam, canvas, lang, diaHinh, mayChu, baoGoiY } = the;
  const ten = the.ten, tenMinh = String(the.tenMinh || ten || "").trim().toLowerCase();
  const CHF = the.cauHinh || null, LG = window.KC_DT_LANG;
  const cuaMinh = d => !d.chu || d.chu === tenMinh; // máy chủ cũ không trả chu: coi là đồ của bé
  const tamVoi = (lang.CH && lang.CH.tamVoi) || 1.6;
  const ds = new Map();     // id -> { d (bản ghi máy chủ), el } : đồ NẰM TRÊN ĐẤT
  const viec = new Map();   // nông dân (đối tượng) -> { dv, hang: [id...], dangDi, giai: "nhat" | "ve", nhatTu, luc, hen, dangHoi, dich }
  const camTheo = new Map(); // nông dân -> { ds: Map(id -> d), el } : đồ CẦM TRÊN TAY
  const vt = new THREE.Vector3();
  const raManHinh = (x, y, z) => { vt.set(x, y, z).project(cam.camera); return [(vt.x + 1) / 2 * canvas.clientWidth, (1 - vt.y) / 2 * canvas.clientHeight, vt.z < 1]; };
  const gio = () => mayChu.gio();
  const giamDong = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let soNhat = 0, soLoi = 0, soCat = 0;
  const xongViec = dv => { viec.delete(dv); delete dv.dangNhatDo; }; // dangNhatDo: nút 🧑‍🌾 (dt3d_nong_dan.js) không tính là rảnh

  // nhịp nhặt (giây / cái) = nhịp làm của nguồn cùng loại tài nguyên (cau_hinh.json lang.nguon)
  function nhipCua(ma) {
    const ng = (lang.CH && lang.CH.nguon) || (CHF && CHF.lang && CHF.lang.nguon) || {};
    let tot = null;
    for (const k in ng) if (ng[k].taiNguyen === ma && Number.isFinite(ng[k].nhipLam)) tot = tot == null ? ng[k].nhipLam : Math.min(tot, ng[k].nhipLam);
    return tot == null ? NHIP_MAC_DINH : tot;
  }
  const msNhat = d => Math.max(300, d.so * nhipCua(d.ma) * 1000);

  function taoNhan(d, moi) {
    const el = document.createElement("button");
    const minh = cuaMinh(d);
    el.type = "button"; el.className = "d3DoRoi" + (minh ? "" : " d3DoRoiKhac") + (moi && !giamDong() ? " d3DoRoiMoi" : "");
    el.setAttribute("aria-label", (minh ? "Nhặt " : "Đồ của bạn khác: ") + d.so + " " + d.ten);
    el.innerHTML = '<span class="d3DoRoiIcon"></span><b></b><i class="d3DoRoiTien" hidden><i></i></i>';
    el.querySelector(".d3DoRoiIcon").textContent = d.bieuTuong;
    el.querySelector("b").textContent = "+" + d.so;
    el.addEventListener("pointerdown", e => e.stopPropagation());
    el.addEventListener("click", e => { e.stopPropagation(); cham(d.id); });
    the.lop.appendChild(el);
    return el;
  }

  function them(dsMoi, dvThang) {
    if (!Array.isArray(dsMoi)) return;
    for (const d of dsMoi) {
      if (!d || ds.has(d.id) || d.camDv != null) continue;
      ds.set(d.id, { d, el: taoNhan(d, true) });
    }
    const cua = dsMoi.filter(d => d && d.camDv == null && cuaMinh(d)).map(d => d.id);
    if (dvThang && cua.length) giaoNhat(dvThang, cua);
  }

  // ---- đồ cầm trên tay ----
  const timDv = id => lang.donVi.find(d => d.idMayChu === id && !d.laBan);
  function camVao(dv, d) {
    let c = camTheo.get(dv);
    if (!c) {
      const el = document.createElement("div"); el.className = "d3DoCam"; el.setAttribute("aria-hidden", "true"); the.lop.appendChild(el);
      c = { ds: new Map(), el }; camTheo.set(dv, c);
    }
    c.ds.set(d.id, d); veCam(dv);
  }
  function boCam(dv, id) {
    const c = camTheo.get(dv); if (!c) return;
    if (id != null) c.ds.delete(id); else c.ds.clear();
    if (!c.ds.size) { c.el.remove(); camTheo.delete(dv); } else veCam(dv);
  }
  function veCam(dv) {
    const c = camTheo.get(dv); if (!c) return;
    const chu = [...c.ds.values()].map(d => d.bieuTuong).join("");
    if (c.el.textContent !== chu) c.el.textContent = chu;
  }

  // đọc lại từ máy chủ: thêm món mới (vd bé khác vừa thắng quái), bỏ món không còn (đã nhặt / đã mất), cập nhật số còn lại;
  // đồ nông dân của bé đang cầm (camDv): gắn lên tay người đó (vào lại trang)
  let dangNap = false;
  async function nap() {
    if (!mayChu.doRoiDs || dangNap) return;
    dangNap = true;
    const kq = await mayChu.doRoiDs(ten).catch(() => null);
    dangNap = false;
    if (!kq || !kq.ok || !Array.isArray(kq.ds)) return;
    const con = new Map(kq.ds.map(d => [d.id, d]));
    for (const [id, m] of [...ds]) {
      const d = con.get(id);
      if (!d || d.camDv != null) { if (!dangHoiMon(id)) bo(id); continue; }
      if (d.so !== m.d.so && !dangHoiMon(id)) { m.d.so = d.so; m.el.querySelector("b").textContent = "+" + d.so; }
    }
    for (const d of kq.ds) {
      if (d.camDv == null || !cuaMinh(d)) continue;
      const dv = timDv(d.camDv);
      if (dv && !(camTheo.get(dv) && camTheo.get(dv).ds.has(d.id))) camVao(dv, d);
    }
    for (const [dv, c] of [...camTheo]) for (const id of [...c.ds.keys()]) {
      const d = con.get(id);
      if (!d && !dangCat(dv)) boCam(dv, id); else if (d) c.ds.get(id).so = d.so;
    }
    them(kq.ds);
  }
  const dangHoiMon = id => [...viec.values()].some(v => v.dangDi === id && v.dangHoi);
  const dangCat = dv => { const v = viec.get(dv); return !!(v && v.giai === "ve" && v.dangHoi); };
  if (the.ngheQuanh) the.ngheQuanh(() => nap());

  function bo(id) {
    const m = ds.get(id); if (!m) return;
    ds.delete(id);
    m.el.classList.add("d3DoRoiMat");
    setTimeout(() => m.el.remove(), 450);
  }

  const nongDanMinh = () => lang.donVi.filter(d => d.vaiTro === "nong_dan" && !d.laBan && d.idMayChu != null && !d.chay);
  const ranh = dv => !(the.dangDanh && the.dangDanh(dv)) && dv.trangThai !== "danh";
  function chonNguoi(d) {
    const c = the.dangChon && the.dangChon();
    if (c && c.vaiTro === "nong_dan" && !c.dv.laBan && c.dv.idMayChu != null && ranh(c.dv)) return c.dv;
    let tot = null, kc = Infinity;
    for (const dv of nongDanMinh()) { if (!ranh(dv)) continue; const k = Math.hypot(dv.x - d.x, dv.z - d.z); if (k < kc) { kc = k; tot = dv; } }
    return tot;
  }

  function cham(id) {
    const m = ds.get(id); if (!m) return;
    const d = m.d;
    if (!cuaMinh(d)) { baoGoiY("🚫 Đây không phải đồ của bạn"); return; }
    const dv = chonNguoi(d);
    if (!dv) { baoGoiY("🧺 " + d.bieuTuong + " " + d.ten + " +" + d.so + " · cần một nông dân rảnh ra nhặt."); return; }
    const dong = [...ds.values()].filter(k => cuaMinh(k.d) && Math.hypot(k.d.x - d.x, k.d.z - d.z) <= GOM_O).map(k => k.d.id);
    giaoNhat(dv, [id, ...dong.filter(k => k !== id)]);
  }

  function giaoNhat(dv, hang) {
    for (const v of viec.values()) if (v.dv !== dv) v.hang = v.hang.filter(id => !hang.includes(id)); // món đã giao người khác: giao lại người này
    viec.set(dv, { dv, hang: hang.filter(id => ds.has(id) && cuaMinh(ds.get(id).d)), luc: Date.now(), dangDi: null, giai: "nhat" });
    diTiep(viec.get(dv));
    if (viec.has(dv)) baoGoiY("🧺 " + dv.ten + " ra nhặt đồ.");
  }

  function thoiNhat(v) { // bỏ vạch tiến độ món đang nhặt
    const m = ds.get(v.dangDi); if (m) { const t = m.el.querySelector(".d3DoRoiTien"); if (t) t.hidden = true; }
    v.nhatTu = 0;
  }
  function diTiep(v) {
    thoiNhat(v);
    v.hang = v.hang.filter(id => ds.has(id));
    if (!v.hang.length) { veKho(v); return; }
    // món gần nhất trước
    v.hang.sort((a, b) => Math.hypot(ds.get(a).d.x - v.dv.x, ds.get(a).d.z - v.dv.z) - Math.hypot(ds.get(b).d.x - v.dv.x, ds.get(b).d.z - v.dv.z));
    const d = ds.get(v.hang[0]).d;
    v.giai = "nhat"; v.dangDi = d.id; v.luc = Date.now(); v.hen = 0;
    if (Math.hypot(v.dv.x - d.x, v.dv.z - d.z) <= tamVoi) return; // đứng sát rồi
    if (!lang.lenhDi(v.dv, { x: Math.floor(d.x), y: Math.floor(d.z) })) { baoGoiY("❌ " + v.dv.ten + " không tới được chỗ đồ."); xongViec(v.dv); }
  }

  // ---- mang đồ về kho ----
  const laTaiNguyen = d => (d.nhom || "tai_nguyen") === "tai_nguyen";
  const nhanDo = (c, d) => (laTaiNguyen(d) ? !!(LG && CHF && LG.nhanCat(CHF, c.loai, d.ma)) : c.loai === "leu");
  const kcCt = (c, x, z) => Math.hypot(Math.max(c.x - x, 0, x - (c.x + c.rong)), Math.max(c.y - z, 0, z - (c.y + c.sau)));
  // công trình xong của bé nhận được nhiều món đang cầm nhất, gần nhất
  function khoToi(dv) {
    const cm = camTheo.get(dv); if (!cm) return null;
    let tot = null, diem = -1, kc = Infinity;
    for (const c of lang.congTrinh) {
      if (!c.xong || c.cuaMinh === false) continue;
      const n = [...cm.ds.values()].filter(d => nhanDo(c, d)).length;
      if (!n) continue;
      const k = kcCt(c, dv.x, dv.z);
      if (n > diem || (n === diem && k < kc)) { tot = c; diem = n; kc = k; }
    }
    return tot;
  }
  function veKho(v) {
    v.dangDi = null;
    if (!camTheo.has(v.dv)) { xongViec(v.dv); return; }
    const c = khoToi(v.dv);
    if (!c) { baoGoiY("📦 Chưa có Lều / kho để cất " + camTheo.get(v.dv).el.textContent + " · " + v.dv.ten + " cầm tạm trên tay."); xongViec(v.dv); return; }
    v.giai = "ve"; v.dich = c; v.luc = Date.now(); v.hen = 0;
    if (kcCt(c, v.dv.x, v.dv.z) <= tamVoi) return;
    const o = lang.oQuanh(c, v.dv.x, v.dv.z);
    if (!o || !lang.lenhDi(v.dv, o)) { baoGoiY("❌ " + v.dv.ten + " không về được kho."); xongViec(v.dv); return; }
    baoGoiY("🧺 " + v.dv.ten + " mang " + camTheo.get(v.dv).el.textContent + " về kho.");
  }

  async function nhat(v) {
    const m = ds.get(v.dangDi); if (!m) { diTiep(v); return; }
    v.dangHoi = true;
    const kq = await mayChu.nhatDo(ten, m.d.id, v.dv.idMayChu).catch(() => null);
    v.dangHoi = false;
    if (viec.get(v.dv) !== v) return;
    if (!kq || !kq.ok) {
      const ma = kq && kq.ma;
      if (ma === "xa_qua" || !kq || ma === "mang") { v.hen = Date.now() + HOI_LAI_MS; return; } // máy chủ tính đường thẳng: chờ chút
      soLoi++;
      if (ma === "do_mat") { bo(m.d.id); diTiep(v); return; }
      if (ma === "khong_cua_ban") baoGoiY("🚫 Đây không phải đồ của bạn");
      else baoGoiY("❌ " + ((kq && kq.lyDo) || "Chưa nhặt được."));
      v.hang = v.hang.filter(id => id !== m.d.id); diTiep(v); return;
    }
    soNhat++;
    ds.delete(m.d.id); m.el.remove();
    camVao(v.dv, { ...m.d, so: kq.so || m.d.so, camDv: v.dv.idMayChu });
    baoGoiY("🧺 " + v.dv.ten + " nhặt " + m.d.bieuTuong + " +" + (kq.so || m.d.so));
    diTiep(v);
  }

  async function catKho(dv, v) {
    if (v) v.dangHoi = true;
    const kq = await mayChu.catDo(ten, dv.idMayChu).catch(() => null);
    if (v) v.dangHoi = false;
    if (!kq || !kq.ok) {
      const ma = kq && kq.ma;
      if (v && (ma === "xa_qua" || !kq)) { v.hen = Date.now() + HOI_LAI_MS; return; }
      if (ma === "khong_cam") boCam(dv);
      else if (ma === "kho_day" && v) baoGoiY("📦 Kho đầy rồi · " + dv.ten + " vẫn cầm " + ((camTheo.get(dv) || {}).el || {}).textContent + ", xây thêm kho hoặc dùng bớt nhé.");
      if (v) xongViec(dv);
      return;
    }
    soCat++;
    const cm = camTheo.get(dv), chu = [];
    for (const k of kq.cat || []) {
      const d = cm && cm.ds.get(k.id); if (!d) continue;
      if (laTaiNguyen(d) && d.ma in lang.kho) {
        const tran = lang.sucChua ? lang.sucChua(d.ma) : Infinity;
        lang.kho[d.ma] = Math.max(lang.kho[d.ma] || 0, Math.min((lang.kho[d.ma] || 0) + k.duoc, Number.isFinite(tran) && tran > 0 ? tran : Infinity));
      }
      bay(dv, d, k.duoc);
      chu.push(d.bieuTuong + " +" + k.duoc);
      if (k.con > 0) d.so = k.con; else boCam(dv, k.id);
    }
    const con = camTheo.get(dv);
    baoGoiY("📦 " + dv.ten + " cất " + chu.join(" ") + " vào kho" + (con ? " · còn cầm " + con.el.textContent + " (kho đầy)" : ""));
    if (v) { if (con && khoToi(dv) !== v.dich) veKho(v); else xongViec(dv); }
  }
  // nông dân đang cầm đồ mà cất đồ thu hoạch về kho (bé đã giao việc khác): cất luôn đồ đang cầm
  if (lang.nghe) lang.nghe(su => { if (su.loai === "cat" && su.dv && camTheo.has(su.dv) && !viec.has(su.dv)) catKho(su.dv, null); });

  // đồ vừa cất bay từ tay nông dân lên ô tài nguyên trên thanh
  function bay(dv, d, so) {
    const o = the.oKho ? the.oKho(d.ma) : null;
    if (o && o.hidden) o.hidden = false; // ô Sắt hiện khi có
    const xong = () => { if (o) { o.classList.remove("d3TnNhan"); void o.offsetWidth; o.classList.add("d3TnNhan"); } if (the.capNhatKho) the.capNhatKho(); };
    const r = o ? o.getBoundingClientRect() : null;
    const [hx, hy, truoc] = raManHinh(dv.x, diaHinh.doCaoDi(dv.x, dv.z) + 1.4, dv.z);
    if (!r || !truoc || giamDong() || !document.body.animate) { xong(); return; }
    const bay1 = document.createElement("div");
    bay1.className = "d3Roi"; bay1.textContent = d.bieuTuong + " +" + so;
    const c = canvas.getBoundingClientRect();
    bay1.style.left = (c.left + hx) + "px"; bay1.style.top = (c.top + hy) + "px";
    document.body.appendChild(bay1);
    const dx = r.left + r.width / 2 - c.left - hx, dy = r.top + r.height / 2 - c.top - hy;
    bay1.animate([{ transform: "translate(-50%, -50%) scale(.8)" }, { transform: "translate(-50%, calc(-50% - 30px)) scale(1.1)", offset: 0.25 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.55)`, opacity: 0.9 }], { duration: 900, easing: "cubic-bezier(.45,.05,.55,.95)" })
      .onfinish = () => { bay1.remove(); xong(); };
  }

  ctx.moiKhung(() => {
    const bayGio = gio(), w = canvas.clientWidth, hh = canvas.clientHeight, daDat = [];
    for (const m of [...ds.values()]) {
      const d = m.d;
      if (bayGio >= d.hetLuc && !dangHoiMon(d.id)) { bo(d.id); continue; }
      let [sx, sy, truoc] = raManHinh(d.x, diaHinh.doCaoDi(d.x, d.z) + 0.02, d.z); // TC_D06C5: sát mặt đất (không lửng lơ)
      const an = !truoc || sx < -40 || sy < -40 || sx > w + 40 || sy > hh + 40 || ctx.nghiVe;
      if (m.el.hidden !== an) m.el.hidden = an;
      if (!an) {
        // cả đống đồ cùng chỗ mà hình chồng nhau: xếp sang ngang trên mặt đất (không chồng lên cao)
        for (let lan = 0; lan < 6; lan++) {
          const de = daDat.find(o => Math.abs(o.x - sx) < 20 && Math.abs(o.y - sy) < 14);
          if (!de) break;
          sx = de.x + (lan % 2 ? -22 : 22) * Math.ceil((lan + 1) / 2);
        }
        daDat.push({ x: sx, y: sy });
        m.el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -100%) translate(0, 10px)`; // bóng (đáy nút + 10 px) đặt đúng chỗ đồ
      }
      const sap = d.hetLuc - bayGio < 60000;
      if (m.el.dataset.sap !== String(sap)) m.el.dataset.sap = String(sap);
    }
    // đồ cầm trên tay: hình nhỏ trên đầu nông dân
    for (const [dv, c] of [...camTheo]) {
      if (!lang.donVi.includes(dv)) { c.el.remove(); camTheo.delete(dv); continue; }
      const [x, y, truoc] = raManHinh(dv.x, diaHinh.doCaoDi(dv.x, dv.z) + 1.25, dv.z);
      const an = !truoc || ctx.nghiVe;
      if (c.el.hidden !== an) c.el.hidden = an;
      if (!an) c.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    }
    const bay0 = Date.now();
    for (const v of [...viec.values()]) {
      if (!lang.donVi.includes(v.dv) || v.dv.chay) { thoiNhat(v); xongViec(v.dv); continue; }
      if (bay0 - v.luc > BO_SAU_MS || v.dv.trangThai === "lam" || v.dv.trangThai === "danh") { thoiNhat(v); xongViec(v.dv); continue; } // bé giao việc khác / kẹt
      v.dv.dangNhatDo = true; if (v.dv.ranh) v.dv.ranh = false;
      if (v.dangHoi || bay0 < (v.hen || 0)) continue;
      if (v.giai === "ve") {
        if (!v.dich || !lang.congTrinh.includes(v.dich)) { veKho(v); continue; }
        if (kcCt(v.dich, v.dv.x, v.dv.z) <= tamVoi) catKho(v.dv, v);
        continue;
      }
      if (!ds.has(v.dangDi)) { diTiep(v); continue; }
      const m = ds.get(v.dangDi), d = m.d, tien = m.el.querySelector(".d3DoRoiTien");
      if (Math.hypot(v.dv.x - d.x, v.dv.z - d.z) > tamVoi) { if (v.nhatTu) thoiNhat(v); continue; }
      // TC_D06C5: đứng nhặt từ từ (số đồ × nhịp làm), vạch tiến độ dưới món đồ
      if (!v.nhatTu) { v.nhatTu = bay0; v.can = msNhat(d); v.luc = bay0; if (tien) tien.hidden = false; }
      const p = Math.min(1, (bay0 - v.nhatTu) / v.can);
      if (tien) tien.firstChild.style.width = Math.round(p * 100) + "%";
      if (p >= 1) nhat(v);
    }
  });

  return {
    them, nap,
    moc: {
      ds: () => [...ds.values()].map(m => ({ ...m.d, hien: !m.el.hidden })),
      cam: () => [...camTheo].map(([dv, c]) => ({ dv: dv.idMayChu, ten: dv.ten, ds: [...c.ds.values()].map(d => ({ id: d.id, ma: d.ma, so: d.so })) })),
      cham, soNhat: () => soNhat, soLoi: () => soLoi, soCat: () => soCat, msNhat,
      viec: () => [...viec.values()].map(v => ({ dv: v.dv.idMayChu, ten: v.dv.ten, hang: v.hang.slice(), dangDi: v.dangDi, giai: v.giai }))
    }
  };
}
// 06/11/2026 - BƯỚC: TC_D06C4 (14:1x: bé khác thấy đồ nhưng không nhặt được; 14:28: lời báo ngắn gọn "Đây không phải đồ của bạn")
// 06/11/2026 23:5x - BƯỚC: TC_D06C5 (đồ sát đất, nhỏ 1/4; nhặt mất thời gian như thu tài nguyên; cầm trên tay mang về kho)
