// ================================================================
// FILE: dt/3d/dt3d_chieu_them.js  (ES module) - PHẦN VẼ 3D: KHO CHIÊU THÊM (phụ tá làm)
// CHỨC NĂNG: Kho chiêu chiến đấu bổ sung, mỗi chiêu một mục trong mảng ds. Sân đấu (dt3d_tran.js)
//            tự nạp file này; trang đấu thử tự hiện một nút cho mỗi mục. File lỗi => sân bỏ qua, vẫn chạy.
//            Việc giao: claude_code/GEMINI.md mục 3, việc A6.
// HÀM KHAI RA:
//   taoChieuThem({ ctx, hu, bo, cv, nhe, layCamera }) -> { ds, capNhat(dt, t) }
//     ctx: cảnh (ctx.canh, ctx.renderer, ctx.nang) - dt3d_canh.js
//     hu : hiệu ứng điểm dt3d_hieu_ung.js
//     bo : bộ hạt card đồ hoạ dt3d_hat.js
//     cv : 7 chiêu vùng dt3d_chieu_vung.js
//     nhe: máy yếu    layCamera(): camera đang dùng
//   ds[i] = { ma, nut, ten, chay(tran) -> số giây diễn }
//     tran = { be: { tam, chan, cao }, quai: { nhom, tam, chan, cao, chop },
//              dongTac, them, mau, am }
// BƯỚC: TC_D05B2 (khung + chiêu ví dụ, Claude Code); THỬ NGHIỆM plasma-skill + camera điện ảnh (Antigravity 01/11/2026)
// NGÀY: 30/10/2026; Cập nhật: 01/11/2026 (camera chéo 45 độ từ người đến quái khi phóng beam)
// ================================================================
import * as THREE from "three";
import { PlasmaSkill } from "../../thu_vien/plasma-skill.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ngau = (a, b) => a + Math.random() * (b - a);

function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function lerp(a, b, t) { return a + (b - a) * t; }

// Chuyển màu tộc (CSS string) sang hue radian cho PlasmaSkill
function _hueChoToc(mauCSS) {
  const c = new THREE.Color(mauCSS);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  if (hsl.h > 0.40) return Math.PI;   // xanh  → Tiên
  if (hsl.l > 0.60) return 0.42;      // vàng sáng → Nhân
  return 0;                            // cam đỏ → Quỷ
}

export function taoChieuThem({ ctx, hu, bo, cv, nhe, layCamera }) {
  const { canh, renderer } = ctx;

  // --- PlasmaSkill ---
  const _tayNeo = new THREE.Object3D();
  canh.add(_tayNeo);
  let _plasma = null;

  // Cấu hình thời gian chiêu (tụ chiêu 1.8s để dồn nén nội lực)
  const TIMING = {
    charge: 1.80,   // tụ chiêu 1.8s: camera hướng vào toàn thân nhân vật, ánh sáng bay vào cầu
    fire:   0.25,   // beam phóng tới quái (camera chuyển góc chéo 45 độ)
    hold:   0.90,   // duy trì chùm beam thiêu đốt ở góc chéo 45 độ
    fade:   0.45    // tia tan, camera quay về góc gốc
  };

  function _damBaoPlasma() {
    const cam = layCamera();
    if (!cam) return false;
    if (!_plasma) {
      _plasma = new PlasmaSkill({
        scene: canh,
        camera: cam,
        renderer,
        hands: [_tayNeo],
        scale: 1.35,
        sphereRadius: 0.40,
        beamWidth:    0.60,
        targetLift:   0.45,
        hue: 0,
        shake: false,
        timing: TIMING,
      });
    } else {
      _plasma.camera = cam;
    }
    return true;
  }

  // Tìm xương nhân vật thủ lĩnh (nằm ở bên trái sân, x < 0.3)
  function _timXuongNhanVat() {
    let tay = null, dau = null, nguc = null;
    canh.traverse(o => {
      if (!o.isBone) return;
      const wp = new THREE.Vector3();
      o.getWorldPosition(wp);
      if (wp.x > 0.3) return; // bỏ qua quái vật ở bên phải

      const ten = o.name.toLowerCase();
      // Bàn tay phải
      if (!tay && (ten.includes("righthand") || ten.includes("handslot.r") || ten.includes("handslotr") || ten === "hand.r" || ten === "right_hand")) {
        tay = o;
      }
      // Đầu
      if (!dau && (ten.includes("head") || ten === "head")) {
        dau = o;
      }
      // Ngực / cổ
      if (!nguc && (ten.includes("spine2") || ten.includes("chest") || ten.includes("neck") || ten.includes("spine1"))) {
        nguc = o;
      }
    });
    return { tay, dau, nguc };
  }

  // ── Trạng thái camera và tụ chiêu ──────────────────────────────────────────
  let _state = null;
  let _posCamGocBanDau = null;

  function _batDauChieu(tran) {
    const cam = layCamera();
    if (!cam) return;

    // Tìm xương thực tế của nhân vật
    const bones = _timXuongNhanVat();

    // Toạ độ thực tế của tay
    const posTay = new THREE.Vector3();
    if (bones.tay) {
      bones.tay.getWorldPosition(posTay);
      posTay.add(new THREE.Vector3(0.08, 0.04, 0.02));
    } else {
      posTay.set(tran.be.chan.x + 0.44, tran.be.cao * 0.68, tran.be.chan.z + 0.15);
    }

    // 1. Pha Tụ chiêu: Tâm điểm nhìn lấy TRỌNG TÂM THÂN NGƯỜI (ngực/eo, y ≈ 0.95m)
    // để camera lấy ĐỦ TOÀN BỘ HÌNH DÁNG NHÂN VẬT từ đầu tới chân chạm đất
    const lookToanThan = new THREE.Vector3(
      tran.be.chan.x + 0.15,
      tran.be.cao * 0.50,
      tran.be.chan.z
    );

    // Vị trí camera lúc tụ chiêu (Lấy trọn vẹn toàn bộ hình dáng nhân vật):
    const posToanThan = new THREE.Vector3(
      lookToanThan.x + 0.55,
      1.15,
      lookToanThan.z + 3.90
    );

    // 2. Pha Phóng beam: GÓC QUAY CHÉO 45 ĐỘ PHÍA SAU NGƯỜI TẤN CÔNG ĐẾN QUÁI
    // Theo sơ đồ: 1 là Camera (-4.10, 1.45, 3.30), 2 là Người tấn công (-1.55, 0, 0), 3 là Quái (1.55, 0, 0)
    // Vector nhìn dx = +4.30, dz = -4.30 => đúng chuẩn góc 45 độ, thấy rõ cả người và quái!
    const posCheo45 = new THREE.Vector3(-4.10, 1.45, 3.30);
    const lookCheo45 = new THREE.Vector3(0.20, 0.75, -1.00);

    // Điểm nhìn và vị trí camera gốc của sân đấu
    const lookGoc = new THREE.Vector3(0, 0.92, 0);
    if (!_posCamGocBanDau) _posCamGocBanDau = cam.position.clone();
    const posCamGoc = _posCamGocBanDau.clone();

    _state = {
      t: 0,
      tong: TIMING.charge + TIMING.fire + TIMING.hold + TIMING.fade,
      timing: TIMING,
      cam,
      fovGoc: cam.fov,
      posGoc: posCamGoc,
      posToanThan,
      posCheo45,
      lookGoc,
      lookToanThan,
      lookCheo45,
      bones,
      tran,
      posTayHienTai: posTay.clone(),
      tichHat: 0,
    };

    // Đặt vị trí ban đầu cho điểm neo plasma
    _tayNeo.position.copy(posTay);
  }

  function _capNhatTrangThai(dt) {
    if (!_state) return;
    const s = _state;
    s.t += dt;

    const { t, timing, tong, bones, tran } = s;
    const { charge, fire, hold } = timing;
    const tFire = charge + fire;
    const tFade = tFire + hold;

    // 1. Cập nhật vị trí xương tay theo thời gian thực (để quả cầu plasma luôn dính đúng bàn tay)
    if (bones.tay) {
      bones.tay.getWorldPosition(s.posTayHienTai);
      s.posTayHienTai.add(new THREE.Vector3(0.08, 0.04, 0.02));
      _tayNeo.position.copy(s.posTayHienTai);
    }

    // 2. Hiệu ứng ánh sáng từ xa bay tập trung vào quả cầu (trong suốt pha charge)
    if (t < charge) {
      const pCau = s.posTayHienTai;
      // Sinh hạt ánh sáng hội tụ vào tâm quả cầu
      s.tichHat += dt * bo.so(nhe ? 45 : 95);
      while (s.tichHat >= 1) {
        s.tichHat -= 1;
        // Điểm xuất phát: ngẫu nhiên trong bán kính 1.2m - 2.8m quanh quả cầu
        const huong = V(ngau(-1, 1), ngau(-0.8, 1), ngau(-1, 1)).normalize();
        const kc = ngau(1.2, 2.8);
        const pBatDau = pCau.clone().addScaledVector(huong, kc);
        const songHat = ngau(0.32, 0.58);
        // Vận tốc bay thẳng vào tâm quả cầu
        const vHat = huong.clone().multiplyScalar(-kc / songHat);

        bo.hat("sang", {
          p: pBatDau,
          v: vHat,
          song: songHat,
          co: ngau(0.06, 0.12),
          coCuoi: 0.02,
          keoDai: 0.04,
          mau: tran.mau,
          sang: 2.6,
          mo: 0.9,
          moCuoi: 1.0,
          hienDan: 0.2
        });
      }

      // Xoáy bụi khí quyển cuộn dưới chân nhân vật
      if (Math.random() < 0.25) {
        bo.hat("khoi", {
          p: V(tran.be.chan.x, 0.08, tran.be.chan.z),
          song: 0.75,
          co: 0.35,
          coCuoi: 1.1,
          mau: "#9fb0bb",
          mo: 0.22,
          quy: { r: ngau(0.5, 1.0), a: ngau(0, 6.28), w: 5, vr: -0.5 }
        });
      }

      // Rung nhẹ tăng dần theo độ nén năng lượng
      const doTich = t / charge;
      if (Math.random() < 0.15) {
        hu.rung(0.01 + 0.025 * doTich, 0.10);
      }

      // Khi nén gần đầy (> 60%), thỉnh thoảng xẹt tia điện nhỏ quanh quả cầu
      if (doTich > 0.6 && Math.random() < 0.2) {
        hu.tia(pCau, tran.mau, 4, 1.2);
      }
    }

    // 3. Điều khiển Camera Điện Ảnh (chuyển sang hàm riêng _capNhatCamera)
  }

  function _capNhatCamera(dt) {
    if (!_state) return;
    const s = _state;
    const { t, timing, tong } = s;
    const { charge, fire, hold } = timing;
    const tFire = charge + fire;
    const tFade = tFire + hold;

    let posCam, lookCam, fovCam;

    if (t < charge) {
      // Pha 1: Tụ chiêu — Camera lấy ĐỦ TOÀN BỘ HÌNH DÁNG NHÂN VẬT từ đầu đến chân
      const k = easeInOut(t / charge);
      posCam  = s.posGoc.clone().lerp(s.posToanThan, k);
      lookCam = s.lookGoc.clone().lerp(s.lookToanThan, k);
      fovCam  = lerp(s.fovGoc, s.fovGoc * 0.94, k);

    } else if (t < tFire) {
      // Pha 2: Phóng beam — Camera dịch chuyển mượt mà sang GÓC QUAY CHÉO 45 ĐỘ từ phía sau người đến quái
      const k = easeInOut((t - charge) / (tFire - charge));
      posCam  = s.posToanThan.clone().lerp(s.posCheo45, k);
      lookCam = s.lookToanThan.clone().lerp(s.lookCheo45, k);
      fovCam  = lerp(s.fovGoc, 38, k);

    } else if (t < tFade) {
      // Pha 3: Giữ góc chéo 45 độ — thấy rõ người bắn chùm beam ở tiền cảnh và quái vật nổ tung ở hậu cảnh
      posCam  = s.posCheo45.clone();
      lookCam = s.lookCheo45.clone();
      fovCam  = 38;

    } else if (t < tong) {
      // Pha 4: Chiêu tan — Camera lerp êm ái trở lại vị trí gốc ban đầu
      const k = easeInOut((t - tFade) / (tong - tFade));
      posCam  = s.posCheo45.clone().lerp(s.posGoc, k);
      lookCam = s.lookCheo45.clone().lerp(s.lookGoc, k);
      fovCam  = lerp(38, s.fovGoc, k);

    } else {
      // Hoàn tất: Khôi phục camera gốc hoàn toàn
      s.cam.position.copy(s.posGoc);
      s.cam.lookAt(s.lookGoc);
      s.cam.fov = s.fovGoc;
      s.cam.updateProjectionMatrix();
      _state = null;
      return;
    }

    // Ghi đè camera ở cuối khung (chạy sau khi dt3d_tran.js đã gán camGoc)
    s.cam.position.copy(posCam);
    s.cam.lookAt(lookCam);
    s.cam.fov = fovCam;
    s.cam.updateProjectionMatrix();
  }

  // Đăng ký cập nhật camera cuối khung hình
  ctx.moiKhung((dt) => _capNhatCamera(dt));

  // vật tự xoá sau "giay" giây; cap(k 0..1, dt, t) gọi mỗi khung.
  const vat = [];
  function them(o, giay, cap) { canh.add(o); vat.push({ o, con: giay, tong: giay, cap }); return o; }

  const ds = [
    // CHIÊU VÍ DỤ (khung, Claude Code): giữ nguyên để so sánh
    {
      ma: "vi_du", nut: "🧪 Ví dụ", ten: "CHIÊU VÍ DỤ",
      chay(tran) {
        tran.dongTac("phep");
        const p = tran.quai.tam;
        const vong = them(
          new THREE.Mesh(
            new THREE.RingGeometry(0.6, 0.8, 40).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: tran.mau, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
          ), 1.2,
          k => { vong.scale.setScalar(1 + k * 1.5); vong.material.opacity = 1 - k; }
        );
        vong.position.set(tran.quai.chan.x, 0.05, tran.quai.chan.z);
        for (let i = 0; i < bo.so(20); i++)
          bo.hat("sang", { p: p.clone(), v: V(ngau(-2, 2), ngau(1, 3), ngau(-1, 1)), g: 5, song: 0.8, co: 0.08, mau: tran.mau, sang: 1.8 });
        tran.them(0.01, () => tran.quai.chop(0.2), 0.3);
        return 1.2;
      }
    },

    // ── PLASMA BEAM + CAMERA CHÉO 45 ĐỘ ĐIỆN ẢNH ────────────────────────────
    {
      ma: "plasma_beam", nut: "⚡ Plasma Beam", ten: "HOẢ LONG PHÓNG XẠ",
      chay(tran) {
        if (!_damBaoPlasma()) return 3.40;

        // Bật trạng thái bám xương và camera điện ảnh góc chéo 45 độ
        _batDauChieu(tran);

        // Màu beam theo tộc
        _plasma.setHue(_hueChoToc(tran.mau));
        tran.dongTac("phepLon");

        // Phóng beam
        _plasma.play({
          target: tran.quai.nhom,
          onHit: () => {
            tran.quai.chop(0.50);
            hu.chop(tran.quai.tam, tran.mau, 2.2, 0.40, 0.60);
            hu.tia(tran.quai.tam, tran.mau, nhe ? 14 : 26, nhe ? 4 : 7);
            hu.songXung(V(tran.quai.chan.x, 0, tran.quai.chan.z), tran.mau, 2.4, 0.65);
            hu.rung(0.08, 0.45);
            const p = tran.quai.tam.clone();
            for (let i = 0; i < bo.so(nhe ? 18 : 36); i++)
              bo.hat("no", {
                p,
                v: V(ngau(-3.5, 3.5), ngau(0.5, 4.5), ngau(-1.8, 1.8)),
                g: 6,
                song: ngau(0.5, 0.95),
                co: ngau(0.18, 0.35),
                mau: tran.mau,
                sang: 2.4
              });
            if (tran.am && tran.am.thachNo) tran.am.thachNo(tran.quai.chan.x, 0.90);
          },
          onEnd: () => {},
        });

        return TIMING.charge + TIMING.fire + TIMING.hold + TIMING.fade;
      }
    },
  ];

  function capNhat(dt, t) {
    if (_plasma) _plasma.update(dt);

    // Camera điện ảnh & luồng ánh sáng tụ chiêu
    _capNhatTrangThai(dt);

    for (let i = vat.length - 1; i >= 0; i--) {
      const v = vat[i]; v.con -= dt;
      v.cap(Math.min(1, 1 - Math.max(0, v.con) / v.tong), dt, t);
      if (v.con <= 0) {
        canh.remove(v.o);
        v.o.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); });
        vat.splice(i, 1);
      }
    }
  }

  return { ds, capNhat };
}
// 01/11/2026 - THỬ NGHIỆM: plasma-skill + camera chéo 45 độ từ người đến quái khi phóng beam
