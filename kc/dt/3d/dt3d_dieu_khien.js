// ================================================================
// FILE: dt/3d/dt3d_dieu_khien.js  (ES module) - PHẦN VẼ 3D: ĐIỀU KHIỂN
// CHỨC NĂNG: "Chọn rồi chạm" kiểu Đế Chế: chạm nhân vật -> chọn (vòng vàng dưới chân);
//            đang chọn nông dân + chạm cây / mỏ / bãi cá / bụi -> GỌI LÕI giao việc;
//            đang chọn ai đó + chạm đất -> GỌI LÕI đi tới (vòng xanh chỗ đến). Không tự sửa
//            hình: lõi đổi trạng thái, các phần vẽ tự vẽ theo. Chữ nổi "+10 🪵" khi đồ về
//            kho, dấu "!" trên đầu nông dân đang rảnh.
// HÀM KHAI RA:
//   taoDieuKhien(ctx, cam, lang, taiNguyen, boNhanVat, diaHinh, ui) -> { chon(hinh), dangChon() }
//   ui: { baoGoiY(chu), baoChon(chu), lop (phần tử DOM phủ trên cảnh cho chữ nổi + "!"),
//         (TC_D02B2b, đều không bắt buộc) thayNguon(n) -> false thì coi như chạm đất (nguồn trong
//         vùng đen), loiDi(dv, ô) -> câu báo khi ra lệnh đi, loiChon(hinh) -> câu gợi ý khi chọn,
//         (TC_D02B3b) loiBan(hinh) -> câu báo khi chạm người của bạn khác (dv.laBan: không chọn được) }
//   datCheDoCham(fn(ô {x, y, px, pz}, "cham" | "re")): chế độ chạm riêng (soi đất, chọn chỗ dựng)
// LUẬT NỐI: dùng ctx (dt3d_canh.js), cam.khiCham / camera (dt3d_camera.js), taiNguyen.chon
//           (dt3d_tai_nguyen.js), boNhanVat.dsHinh (dt3d_nhan_vat.js), diaHinh.matDat / doCaoDi,
//           lang (lõi: giaoViec, lenhDi, nghe).
// BƯỚC: TC_D02A (tách từ dt_lang_3d.js của TC_D01C); TC_D02B2a (datCheDoCham: chế độ chạm riêng);
//       TC_D02B2b (ô chạm kèm điểm chính xác, nguồn trong vùng đen, lời báo khám phá);
//       TC_D02B3b (người của bạn khác không chọn được, hình đang ẩn không chạm được)
// NGÀY: 23/10/2026; 26/10/2026; 27/10/2026; 27/10/2026 20:55
// ================================================================
import * as THREE from "three";

const LOI_GIAO = {
  cay: ten => "🪓 " + ten + " đi chặt cây. Gỗ sẽ được vác về lều.",
  mo_da: ten => "⛏️ " + ten + " đi đào đá.",
  mo_vang: ten => "⛏️ " + ten + " đi đào vàng.",
  mo_sat: ten => "⛏️ " + ten + " đi đào sắt.",
  bai_ca: ten => "🎣 " + ten + " đi bắt cá.",
  bui_trai_cay: ten => "🍓 " + ten + " đi hái trái cây."
};

export function taoDieuKhien(ctx, cam, lang, taiNguyen, boNhanVat, diaHinh, ui) {
  const tia = new THREE.Raycaster(), diem = new THREE.Vector2();
  const canvas = ctx.renderer.domElement;
  let dangChon = null;

  const vongChon = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.47, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#ffd24a", transparent: true, opacity: 0.95, depthWrite: false }));
  vongChon.visible = false; ctx.canh.add(vongChon);
  const vongDich = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.32, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#7dff9a", transparent: true, depthWrite: false }));
  vongDich.visible = false; ctx.canh.add(vongDich);
  let tDich = 0;
  function dauDich(x, z) { vongDich.position.set(x, diaHinh.doCaoDi(x, z) + 0.05, z); vongDich.visible = true; tDich = 0; }

  function chon(h) {
    dangChon = h;
    vongChon.visible = !!h;
    if (!h) { ui.baoChon("Chưa chọn ai"); return; }
    const laTl = h.vaiTro === "thu_linh";
    ui.baoChon((laTl ? "👑 " : "🧑‍🌾 ") + h.dv.ten);
    ui.baoGoiY((ui.loiChon && ui.loiChon(h)) || (laTl ? "Chạm mặt đất để Thủ lĩnh đi tới đó." : "Chạm cây để chặt gỗ, chạm mỏ để đào đá / vàng, chạm bãi cá hoặc bụi trái cây để lấy lương thực, hoặc chạm đất để đi."));
  }

  // Chế độ chạm riêng (TC_D02B2a: "🔍 Soi đất"): chạm đất -> gọi fn(ô) thay cho ra lệnh đi
  let cheDoRieng = null;
  const oDuoiTay = e => {
    const r = canvas.getBoundingClientRect();
    diem.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    tia.setFromCamera(diem, cam.camera);
    const t = tia.intersectObject(diaHinh.matDat, false)[0];
    return t ? { x: Math.floor(t.point.x), y: Math.floor(t.point.z), px: t.point.x, pz: t.point.z } : null;
  };

  cam.khiCham(e => {
    if (cheDoRieng) { const o = oDuoiTay(e); if (o) cheDoRieng(o, "cham"); return; }
    const r = canvas.getBoundingClientRect();
    diem.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    tia.setFromCamera(diem, cam.camera);
    // 1) chạm nhân vật -> chọn (người của bạn khác: chỉ xem, không ra lệnh; ẩn trong sương: bỏ qua)
    const trungNv = tia.intersectObjects(boNhanVat.dsHinh.filter(h => h.vo.visible).map(h => h.trung), false)[0];
    if (trungNv) {
      const h = trungNv.object.userData.hinh;
      if (h.dv.laBan) { ui.baoGoiY((ui.loiBan && ui.loiBan(h)) || "Đây là người của bạn khác."); return; }
      chon(h); return;
    }
    // 2) chạm nguồn tài nguyên
    let n = taiNguyen.chon(tia);
    if (n && ui.thayNguon && !ui.thayNguon(n)) n = null; // nguồn còn trong sương đen: bé chưa thấy
    if (n) {
      if (dangChon && dangChon.vaiTro === "nong_dan") {
        const that = lang.giaoViec(dangChon.dv, n);
        if (that) { dauDich(that.x, that.z); ui.baoGoiY(LOI_GIAO[that.loai](dangChon.dv.ten)); }
        else ui.baoGoiY("Chỗ đó chưa tới được, con chọn chỗ khác nhé.");
        return;
      }
      if (!dangChon) { ui.baoGoiY("Chạm vào nông dân 🧑‍🌾 trước, rồi chạm vào đây để giao việc nhé!"); return; }
    }
    // 3) chạm đất -> đi tới
    const trungDat = tia.intersectObject(diaHinh.matDat, false)[0];
    if (trungDat && dangChon) {
      const o = { x: Math.floor(trungDat.point.x), y: Math.floor(trungDat.point.z) };
      if (lang.lenhDi(dangChon.dv, o)) {
        const c = dangChon.dv.duong[dangChon.dv.duong.length - 1];
        if (c) dauDich(c.x, c.z); else dauDich(trungDat.point.x, trungDat.point.z);
        ui.baoGoiY((ui.loiDi && ui.loiDi(dangChon.dv, o)) || dangChon.dv.ten + " đang đi.");
      } else ui.baoGoiY("Chỗ đó không tới được đâu.");
    } else if (!dangChon) ui.baoGoiY("Chạm vào Thủ lĩnh hoặc nông dân để chọn.");
  });

  // --- Chữ nổi "+10 🪵" + dấu "!" ---
  const dsNoi = [], dauRanh = new Map(), vt = new THREE.Vector3();
  const bieuTuong = lang.CH.taiNguyen;
  lang.nghe(su => {
    if (su.loai !== "cat") return;
    const el = document.createElement("div"); el.className = "d3Noi"; el.textContent = "+" + su.so + " " + bieuTuong[su.taiNguyen].bieuTuong;
    ui.lop.appendChild(el); dsNoi.push({ el, x: su.dv.x, y: diaHinh.doCaoDi(su.dv.x, su.dv.z) + 1.6, z: su.dv.z, t: 0 });
  });
  const raManHinh = (x, y, z) => { vt.set(x, y, z).project(cam.camera); return [(vt.x + 1) / 2 * canvas.clientWidth, (1 - vt.y) / 2 * canvas.clientHeight]; };

  ctx.moiKhung((dt, t) => {
    if (dangChon) { const p = dangChon.vo.position; vongChon.position.set(p.x, p.y + 0.06, p.z); vongChon.rotation.y = t; }
    if (vongDich.visible) { tDich += dt; const k = 1 + tDich * 3; vongDich.scale.set(k, 1, k); vongDich.material.opacity = 1 - tDich * 1.6; if (tDich > 0.6) vongDich.visible = false; }
    for (let i = dsNoi.length - 1; i >= 0; i--) {
      const u = dsNoi[i]; u.t += dt;
      const [x, y] = raManHinh(u.x, u.y + u.t * 0.9, u.z);
      u.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      u.el.style.opacity = String(Math.max(0, 1 - u.t / 1.4));
      if (u.t > 1.4) { u.el.remove(); dsNoi.splice(i, 1); }
    }
    for (const h of boNhanVat.dsHinh) {
      let el = dauRanh.get(h);
      if (!h.dv.ranh) { if (el) el.hidden = true; continue; }
      if (!el) { el = document.createElement("div"); el.className = "d3Ranh"; el.textContent = "!"; el.setAttribute("aria-hidden", "true"); ui.lop.appendChild(el); dauRanh.set(h, el); }
      const p = h.vo.position, [x, y] = raManHinh(p.x, p.y + 1.5, p.z);
      el.hidden = false; el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    }
  });

  // Máy tính: rê chuột (không bấm) cũng báo ô dưới tay cho chế độ riêng
  canvas.addEventListener("pointermove", e => {
    if (!cheDoRieng || e.pointerType !== "mouse" || e.buttons) return;
    const o = oDuoiTay(e); if (o) cheDoRieng(o, "re");
  });

  return { chon, dangChon: () => dangChon, datCheDoCham(fn) { cheDoRieng = fn || null; } };
}
// 27/10/2026 20:55 - BƯỚC: TC_D02B3b
