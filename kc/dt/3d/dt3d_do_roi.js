// ================================================================
// FILE: dt/3d/dt3d_do_roi.js  (ES module) - ĐỒ RƠI NẰM TRÊN ĐẤT, NÔNG DÂN RA NHẶT
// CHỨC NĂNG (repo_rieng dac_ta_roi_do.md, TC_D06C4; người dùng 06/11/2026 chọn "Rơi xuống đất, nông dân nhặt"):
//   - Quái thua: các món đồ (🍖 +12, 🪵 +5...) bật ra từ chỗ quái rồi nằm trên đất (nhãn nhấp nhô, chỉ bé thắng nhặt được);
//     bé khác trong vùng cũng THẤY (nhãn xám, không sáng), chạm vào thì báo "Đây không phải đồ của bạn" (người dùng 06/11/2026).
//     Mỗi lần trang hỏi lại máy chủ (chuKyGui giây) thì đọc lại đồ trên đất: thêm đồ mới của bé khác, bỏ đồ đã nhặt / đã mất.
//     còn dưới 60 giây thì nhấp nháy; hết hạn (máy chủ: hetLuc) thì mờ dần rồi mất.
//   - Chạm một món: nông dân đang chọn (hoặc nông dân rảnh gần nhất) đi tới nhặt cả đống đồ quanh đó (cách ≤ 2 ô), từng món một.
//     Nông dân thắng quái thì tự nhặt đống đồ của trận đó.
//   - Tới sát món đồ: hỏi máy chủ (nhatDo) -> đồ bay lên ô tài nguyên trên thanh, kho tăng; kho đầy thì báo, phần còn lại nằm lại;
//     máy chủ báo chưa tới (đường máy chủ tính thẳng) thì hỏi lại sau.
// HÀM KHAI RA:
//   taoDoRoi(the) -> { them(ds, dv?), nap(), moc }
//     the = { ctx, cam, canvas, lang, diaHinh, mayChu, ten, tenMinh?, baoGoiY, capNhatKho?, oKho?(ma), lop, dangChon?(), dangDanh?(dv),
//             ngheQuanh?(f) (mỗi lần hỏi lại máy chủ) }
//     them(ds, dv): thêm đồ máy chủ trả (quaiThang.roi); dv = nông dân vừa thắng -> tự đi nhặt
//     nap(): đọc đồ đang nằm trên đất từ máy chủ (vào lại trang; cũng chạy mỗi lần hỏi lại máy chủ)
// BƯỚC: TC_D06C4 - NGÀY: 06/11/2026
// ================================================================
import * as THREE from "three";

const GOM_O = 2;          // chạm một món: nhặt luôn các món cách nó ≤ bấy nhiêu ô (cùng đống)
const HOI_LAI_MS = 1500;  // máy chủ báo chưa tới: hỏi lại sau
const BO_SAU_MS = 60000;  // nông dân đi quá lâu chưa tới (bị giao việc khác, kẹt đường): thôi

export function taoDoRoi(the) {
  const { ctx, cam, canvas, lang, diaHinh, mayChu, baoGoiY } = the;
  const ten = the.ten, tenMinh = String(the.tenMinh || ten || "").trim().toLowerCase();
  const cuaMinh = d => !d.chu || d.chu === tenMinh; // máy chủ cũ không trả chu: coi là đồ của bé
  const tamVoi = (lang.CH && lang.CH.tamVoi) || 1.6;
  const ds = new Map();   // id -> { d (bản ghi máy chủ), el, dv?, hen (lúc hỏi lại) }
  const viec = new Map(); // id nông dân (đối tượng) -> { dv, hang: [id...], luc }
  const vt = new THREE.Vector3();
  const raManHinh = (x, y, z) => { vt.set(x, y, z).project(cam.camera); return [(vt.x + 1) / 2 * canvas.clientWidth, (1 - vt.y) / 2 * canvas.clientHeight, vt.z < 1]; };
  const gio = () => mayChu.gio();
  const giamDong = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let soNhat = 0, soLoi = 0;

  function taoNhan(d, moi) {
    const el = document.createElement("button");
    const minh = cuaMinh(d);
    el.type = "button"; el.className = "d3DoRoi" + (minh ? "" : " d3DoRoiKhac") + (moi && !giamDong() ? " d3DoRoiMoi" : "");
    el.setAttribute("aria-label", (minh ? "Nhặt " : "Đồ của bạn khác: ") + d.so + " " + d.ten);
    el.innerHTML = '<span class="d3DoRoiIcon"></span><b></b>';
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
      if (!d || ds.has(d.id)) continue;
      ds.set(d.id, { d, el: taoNhan(d, true) });
    }
    const cua = dsMoi.filter(d => d && cuaMinh(d)).map(d => d.id);
    if (dvThang && cua.length) giaoNhat(dvThang, cua);
  }

  // đọc lại đồ trên đất: thêm món mới (vd bé khác vừa thắng quái), bỏ món máy chủ không còn (đã nhặt / đã mất), cập nhật số còn lại
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
      if (!d) { if (!dangNhat(id)) bo(id); continue; }
      if (d.so !== m.d.so && !dangNhat(id)) { m.d.so = d.so; m.el.querySelector("b").textContent = "+" + d.so; }
    }
    them(kq.ds);
  }
  const dangNhat = id => [...viec.values()].some(v => v.dangDi === id && v.dangHoi);
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
    if (!cuaMinh(d)) { baoGoiY("🚫 Đây không phải đồ của bạn · " + d.bieuTuong + " +" + d.so + " là đồ bạn khác đánh quái được."); return; }
    const dv = chonNguoi(d);
    if (!dv) { baoGoiY("🧺 " + d.bieuTuong + " " + d.ten + " +" + d.so + " · cần một nông dân rảnh ra nhặt."); return; }
    const dong = [...ds.values()].filter(k => cuaMinh(k.d) && Math.hypot(k.d.x - d.x, k.d.z - d.z) <= GOM_O).map(k => k.d.id);
    giaoNhat(dv, [id, ...dong.filter(k => k !== id)]);
  }

  function giaoNhat(dv, hang) {
    for (const v of viec.values()) v.hang = v.hang.filter(id => !hang.includes(id)); // món đã giao người khác: giao lại người này
    viec.set(dv, { dv, hang: hang.filter(id => ds.has(id) && cuaMinh(ds.get(id).d)), luc: Date.now(), dangDi: null });
    diTiep(viec.get(dv));
    if (viec.has(dv)) baoGoiY("🧺 " + dv.ten + " ra nhặt đồ.");
  }

  function diTiep(v) {
    v.hang = v.hang.filter(id => ds.has(id));
    if (!v.hang.length) { viec.delete(v.dv); return; }
    // món gần nhất trước
    v.hang.sort((a, b) => Math.hypot(ds.get(a).d.x - v.dv.x, ds.get(a).d.z - v.dv.z) - Math.hypot(ds.get(b).d.x - v.dv.x, ds.get(b).d.z - v.dv.z));
    const d = ds.get(v.hang[0]).d;
    v.dangDi = d.id; v.luc = Date.now(); v.hen = 0;
    if (Math.hypot(v.dv.x - d.x, v.dv.z - d.z) <= tamVoi) return; // đứng sát rồi
    if (!lang.lenhDi(v.dv, { x: Math.floor(d.x), y: Math.floor(d.z) })) { baoGoiY("❌ " + v.dv.ten + " không tới được chỗ đồ."); viec.delete(v.dv); }
  }

  async function nhat(v) {
    const m = ds.get(v.dangDi); if (!m) { diTiep(v); return; }
    v.dangHoi = true;
    const kq = await mayChu.nhatDo(ten, m.d.id, v.dv.idMayChu).catch(() => null);
    v.dangHoi = false;
    if (!kq || !kq.ok) {
      const ma = kq && kq.ma;
      if (ma === "xa_qua" || !kq || ma === "mang") { v.hen = Date.now() + HOI_LAI_MS; return; } // máy chủ tính đường thẳng: chờ chút
      soLoi++;
      if (ma === "do_mat") { bo(m.d.id); diTiep(v); return; }
      if (ma === "khong_cua_ban") { baoGoiY("🚫 Đây không phải đồ của bạn."); v.hang = v.hang.filter(id => id !== m.d.id); diTiep(v); return; }
      if (ma === "kho_day") {
        const tn = (lang.CH && lang.CH.taiNguyen && lang.CH.taiNguyen[m.d.ma]) || { ten: m.d.ten };
        baoGoiY("📦 Kho " + tn.ten + " đầy rồi · " + m.d.bieuTuong + " vẫn nằm đó, xây thêm kho hoặc dùng bớt rồi nhặt nhé.");
      } else baoGoiY("❌ " + ((kq && kq.lyDo) || "Chưa nhặt được."));
      v.hang = v.hang.filter(id => id !== m.d.id); diTiep(v); return;
    }
    soNhat++;
    if (m.d.nhom === "tai_nguyen" && m.d.ma in lang.kho) {
      const tran = lang.sucChua ? lang.sucChua(m.d.ma) : Infinity;
      lang.kho[m.d.ma] = Math.max(lang.kho[m.d.ma] || 0, Math.min((lang.kho[m.d.ma] || 0) + kq.duoc, Number.isFinite(tran) && tran > 0 ? tran : Infinity));
    }
    bay(m, kq.duoc);
    baoGoiY("🧺 " + v.dv.ten + " nhặt " + m.d.bieuTuong + " +" + kq.duoc + (kq.con > 0 ? " · 📦 kho đầy, còn " + kq.con + " nằm lại" : ""));
    if (kq.con > 0) { m.d.so = kq.con; m.el.querySelector("b").textContent = "+" + kq.con; v.hang = v.hang.filter(id => id !== m.d.id); }
    else ds.delete(m.d.id);
    diTiep(v);
  }

  // món vừa nhặt bay lên ô tài nguyên trên thanh
  function bay(m, so) {
    const o = the.oKho ? the.oKho(m.d.ma) : null;
    if (o && o.hidden) o.hidden = false; // ô Sắt hiện khi có
    const r = o ? o.getBoundingClientRect() : null, el = m.el, h = el.getBoundingClientRect();
    if (m.d.so <= so) el.style.pointerEvents = "none";
    const xong = () => { if (!ds.has(m.d.id)) el.remove(); if (o) { o.classList.remove("d3TnNhan"); void o.offsetWidth; o.classList.add("d3TnNhan"); } if (the.capNhatKho) the.capNhatKho(); };
    if (!r || !el.animate || giamDong() || ds.has(m.d.id)) { if (!ds.has(m.d.id)) el.classList.add("d3DoRoiMat"); setTimeout(xong, 450); return; }
    const bay1 = document.createElement("div");
    bay1.className = "d3Roi"; bay1.textContent = m.d.bieuTuong + " +" + so;
    bay1.style.left = (h.left + h.width / 2) + "px"; bay1.style.top = (h.top + h.height / 2) + "px";
    document.body.appendChild(bay1); el.remove();
    const dx = r.left + r.width / 2 - h.left - h.width / 2, dy = r.top + r.height / 2 - h.top - h.height / 2;
    bay1.animate([{ transform: "translate(-50%, -50%) scale(1)" }, { transform: "translate(-50%, calc(-50% - 40px)) scale(1.2)", offset: 0.25 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.55)`, opacity: 0.9 }], { duration: 950, easing: "cubic-bezier(.45,.05,.55,.95)" })
      .onfinish = () => { bay1.remove(); xong(); };
  }

  ctx.moiKhung(() => {
    const bayGio = gio(), w = canvas.clientWidth, hh = canvas.clientHeight, daDat = [];
    for (const m of [...ds.values()]) {
      const d = m.d;
      if (bayGio >= d.hetLuc) { bo(d.id); continue; }
      let [sx, sy, truoc] = raManHinh(d.x, diaHinh.doCaoDi(d.x, d.z) + 0.25, d.z);
      const an = !truoc || sx < -40 || sy < -40 || sx > w + 40 || sy > hh + 40 || ctx.nghiVe;
      if (m.el.hidden !== an) m.el.hidden = an;
      if (!an) {
        // cả đống đồ cùng chỗ: nhãn chồng lên nhau thì xếp thành cột lên trên (đọc được từng món, chạm trúng món muốn)
        if (!m.rong) { m.rong = m.el.offsetWidth || 70; m.cao = m.el.offsetHeight || 40; }
        for (let lan = 0; lan < 8; lan++) {
          const de = daDat.find(o => Math.abs(o.x - sx) < (o.rong + m.rong) / 2 && Math.abs(o.y - sy) < Math.max(o.cao, m.cao) - 1);
          if (!de) break;
          sy = de.y - de.cao - 2; // điểm neo là đáy nhãn
        }
        daDat.push({ x: sx, y: sy, rong: m.rong, cao: m.cao });
        m.el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -100%)`;
      }
      const sap = d.hetLuc - bayGio < 60000;
      if (m.el.dataset.sap !== String(sap)) m.el.dataset.sap = String(sap);
    }
    const bay0 = Date.now();
    for (const v of [...viec.values()]) {
      if (!lang.donVi.includes(v.dv) || v.dv.chay) { viec.delete(v.dv); continue; }
      if (!ds.has(v.dangDi)) { diTiep(v); continue; }
      if (bay0 - v.luc > BO_SAU_MS || v.dv.trangThai === "lam") { viec.delete(v.dv); continue; } // bé giao việc khác / kẹt
      const d = ds.get(v.dangDi).d;
      if (!v.dangHoi && bay0 >= (v.hen || 0) && Math.hypot(v.dv.x - d.x, v.dv.z - d.z) <= tamVoi) nhat(v);
    }
  });

  return {
    them, nap,
    moc: {
      ds: () => [...ds.values()].map(m => ({ ...m.d, hien: !m.el.hidden })),
      cham, soNhat: () => soNhat, soLoi: () => soLoi,
      viec: () => [...viec.values()].map(v => ({ dv: v.dv.idMayChu, ten: v.dv.ten, hang: v.hang.slice(), dangDi: v.dangDi }))
    }
  };
}
// 06/11/2026 - BƯỚC: TC_D06C4 (14:1x: bé khác thấy đồ nhưng không nhặt được)
