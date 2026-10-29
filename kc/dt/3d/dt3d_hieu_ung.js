// ================================================================
// FILE: dt/3d/dt3d_hieu_ung.js  (ES module) - PHẦN VẼ 3D: HIỆU ỨNG CHIẾN ĐẤU + PHÉP THUẬT
// CHỨC NĂNG: Bộ hiệu ứng dựng hoàn toàn bằng mã Three.js (không cần tải hình): vệt chém,
//            tia lửa va chạm, sóng xung kích mặt đất, chớp sáng, cầu phép bay có đuôi, sét giáng,
//            cột lửa, khiên năng lượng, vòng phù văn hào quang, bụi sáng lơ lửng, chữ tên chiêu,
//            rung camera. Dùng cho sân đấu (dt3d_tran.js); trận tướng đánh tướng sau này dùng lại.
// HÀM KHAI RA:
//   taoHieuUng(ctx, { nhe }) -> hu = { capNhat(dt, t), chop, tia, songXung, vetChem, phong, set,
//        cotLua, khien, khoi, gio, chuChieu, rung, lechCamera(), taoVlKhien(mau), taoHaoQuang(mau), taoBui(vung) }
//   Mọi hiệu ứng tự xoá khi hết thời gian. nhe = máy yếu: giảm số hạt.
// BƯỚC: TC_D05 (người dùng 29/10/2026: "hiệu ứng chiến đấu, phép thuật có thể làm trước không?")
// NGÀY: 29/10/2026
// ================================================================
import * as THREE from "three";

function taoAnh(ve, w = 64, h = w) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  ve(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const DINH_DON_GIAN = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";

export function taoHieuUng(ctx, { nhe } = {}) {
  const { canh } = ctx;
  const heSo = nhe ? 0.5 : 1;
  const soHat = n => Math.max(2, Math.round(n * heSo));
  const ngau = (a, b) => a + Math.random() * (b - a);

  // --- ảnh dùng chung ---
  const TEX = {
    chop: taoAnh((g, n) => { const gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,.75)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, n, n); }),
    tia: taoAnh((g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.75, "rgba(255,255,255,.9)"); gr.addColorStop(1, "rgba(255,255,255,1)"); g.fillStyle = gr; const g2 = g.createLinearGradient(0, 0, 0, h); g.fillRect(0, h * 0.3, w, h * 0.4); g2.addColorStop(0, "rgba(255,255,255,0)"); g2.addColorStop(0.5, "rgba(255,255,255,.35)"); g2.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = g2; g.fillRect(w * 0.5, 0, w * 0.5, h); }, 128, 16),
    vong: taoAnh((g, n) => { const gr = g.createRadialGradient(n / 2, n / 2, n * 0.28, n / 2, n / 2, n / 2); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.8, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, n, n); }, 128),
    khoi: taoAnh((g, n) => {
      for (let i = 0; i < 7; i++) {
        const x = n / 2 + Math.cos(i * 2.4) * n * 0.14, y = n / 2 + Math.sin(i * 2.4) * n * 0.14, r = n * (0.22 + (i % 3) * 0.05);
        const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, n, n);
      }
    }, 96),
    loi: taoAnh((g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.35, "rgba(255,255,255,.5)"); gr.addColorStop(0.5, "rgba(255,255,255,1)"); gr.addColorStop(0.65, "rgba(255,255,255,.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, 32, 4),
    phuVan: taoAnh((g, n) => { // vòng phù văn dưới chân
      const c = n / 2; g.strokeStyle = "#fff"; g.fillStyle = "#fff"; g.lineCap = "round";
      g.lineWidth = n * 0.018; g.beginPath(); g.arc(c, c, n * 0.47, 0, Math.PI * 2); g.stroke();
      g.lineWidth = n * 0.008; g.beginPath(); g.arc(c, c, n * 0.41, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(c, c, n * 0.25, 0, Math.PI * 2); g.stroke();
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, r1 = n * 0.42, r2 = n * (i % 2 ? 0.455 : 0.465); g.beginPath(); g.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1); g.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2); g.stroke(); }
      g.lineWidth = n * 0.012;
      for (let k = 0; k < 2; k++) { g.beginPath(); for (let i = 0; i <= 3; i++) { const a = i / 3 * Math.PI * 2 + k * Math.PI / 3 - Math.PI / 2; const x = c + Math.cos(a) * n * 0.4, y = c + Math.sin(a) * n * 0.4; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6; g.beginPath(); g.arc(c + Math.cos(a) * n * 0.33, c + Math.sin(a) * n * 0.33, n * 0.022, 0, Math.PI * 2); g.fill(); }
    }, 256)
  };

  const vlSprite = (map, mau, cong = true) => new THREE.SpriteMaterial({ map, color: mau, transparent: true, depthWrite: false, depthTest: false, blending: cong ? THREE.AdditiveBlending : THREE.NormalBlending });

  // --- danh sách vật đang sống ---
  const ds = [];
  function them(o, giay, cap, xoaHinh) {
    canh.add(o); o.renderOrder = 10;
    const v = { o, con: giay, tong: giay, cap, xoaHinh }; ds.push(v); return v;
  }
  function xoa(v) {
    canh.remove(v.o);
    v.o.traverse(m => { if (m.material) m.material.dispose(); if (v.xoaHinh && m.geometry) m.geometry.dispose(); });
  }
  const dsVlKhien = [];
  const rungs = [];
  const lech = new THREE.Vector3();

  function capNhat(dt, t) {
    for (let i = ds.length - 1; i >= 0; i--) {
      const v = ds[i]; v.con -= dt;
      const k = Math.min(1, 1 - Math.max(0, v.con) / v.tong);
      v.cap(k, dt, t);
      if (v.con <= 0) { xoa(v); ds.splice(i, 1); }
    }
    for (const m of dsVlKhien) m.uniforms.uT.value = t;
    lech.set(0, 0, 0);
    for (let i = rungs.length - 1; i >= 0; i--) {
      const r = rungs[i]; r.con -= dt;
      if (r.con <= 0) { rungs.splice(i, 1); continue; }
      const c = r.cuong * (r.con / r.tong);
      lech.x += Math.sin(t * 61 + i) * c; lech.y += Math.sin(t * 47 + 1.7 + i) * c * 0.7;
    }
  }

  // 1 hạt sprite bay thẳng, mờ dần
  function hat(p, { mau = "#fff", map = TEX.chop, co = 0.3, coCuoi = co, giay = 0.5, v = null, roi = 0, cong = true, mauCuoi = null, xoay = 0, mo = 1 } = {}) {
    const s = new THREE.Sprite(vlSprite(map, mau, cong)); s.position.copy(p); s.scale.setScalar(co);
    s.material.rotation = Math.random() * 6.28;
    const vt = v ? v.clone() : new THREE.Vector3(); const c0 = new THREE.Color(mau), c1 = mauCuoi ? new THREE.Color(mauCuoi) : null;
    return them(s, giay, (k, dt) => {
      vt.y -= roi * dt; s.position.addScaledVector(vt, dt);
      s.scale.setScalar(co + (coCuoi - co) * k); s.material.opacity = (1 - k) * mo;
      s.material.rotation += xoay * dt;
      if (c1) s.material.color.copy(c0).lerp(c1, k);
    });
  }

  const hu = {
    capNhat,
    lechCamera: () => lech,
    rung(cuong = 0.06, giay = 0.3) { rungs.push({ cuong, con: giay, tong: giay }); },

    chop(p, mau = "#fff", co = 1.6, giay = 0.25, mo = 0.7) {
      const s = new THREE.Sprite(vlSprite(TEX.chop, mau)); s.position.copy(p); s.scale.setScalar(co * 0.5);
      them(s, giay, k => { s.scale.setScalar(co * (0.5 + 0.7 * k)); s.material.opacity = (1 - k) * (1 - k) * mo; });
    },

    // tia lửa văng ra (vạch sáng xoay theo hướng bay)
    tia(p, mau = "#ffe7a0", so = 14, toc = 5, giay = 0.45, huong = null) {
      for (let i = 0; i < soHat(so); i++) {
        const s = new THREE.Sprite(vlSprite(TEX.tia, mau)); s.position.copy(p);
        const a = Math.random() * Math.PI * 2, v = new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.8 + 0.35, ngau(-0.4, 0.4)).multiplyScalar(toc * ngau(0.45, 1));
        if (huong) v.addScaledVector(huong, toc * 0.6);
        const dai = ngau(0.3, 0.55);
        them(s, giay * ngau(0.6, 1.2), (k, dt) => {
          v.y -= 7 * dt; v.multiplyScalar(1 - 2.5 * dt); s.position.addScaledVector(v, dt);
          s.material.rotation = Math.atan2(v.y, v.x);
          s.scale.set(dai * (0.35 + Math.min(1, v.length() / toc)), 0.06, 1); s.material.opacity = 1 - k * k;
        });
      }
    },

    // sóng tròn lan trên mặt đất
    songXung(p, mau = "#ffe2a0", r = 1.6, giay = 0.5) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: TEX.vong, color: mau, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.position.set(p.x, 0.04, p.z);
      them(m, giay, k => { const s = 0.3 + r * 2 * (1 - (1 - k) * (1 - k)); m.scale.set(s, 1, s); m.material.opacity = 1 - k; }, true);
    },

    // vệt chém hình cung, đầu sáng chạy dọc cung rồi tắt. tam: tâm cung; tu/den: góc (radian, mặt phẳng nhìn camera)
    vetChem(tam, mau = "#ffffff", { r = 1, day = 0.42, tu = 2.2, den = -0.9, nghieng = 0, giay = 0.3, xoayY = 0.35, sang = 1.6 } = {}) {
      const N = 40, pos = [], uv = [], idx = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N, a = tu + (den - tu) * u, rr = r - day * (0.3 + 0.7 * Math.sin(u * Math.PI));
        pos.push(Math.cos(a) * rr, Math.sin(a) * rr, 0, Math.cos(a) * r, Math.sin(a) * r, 0); uv.push(u, 0, u, 1);
        if (i) { const b = i * 2; idx.push(b - 2, b - 1, b, b - 1, b + 1, b); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const vl = new THREE.ShaderMaterial({
        uniforms: { uMau: { value: new THREE.Color(mau) }, uTien: { value: 0 }, uMo: { value: 1 }, uSang: { value: sang } },
        vertexShader: DINH_DON_GIAN,
        fragmentShader: "uniform vec3 uMau; uniform float uTien, uMo, uSang; varying vec2 vUv;" +
          "void main(){ float d = uTien - vUv.x; float a = step(0.0, d) * (1.0 - smoothstep(0.0, 0.6, d));" +
          " float ngang = smoothstep(0.0, 0.5, vUv.y) * (1.0 - smoothstep(0.92, 1.0, vUv.y)); float loi = smoothstep(0.7, 0.97, vUv.y);" +
          " vec3 c = mix(uMau, vec3(1.0), loi * 0.85 + (1.0 - smoothstep(0.0, 0.08, d)) * 0.6); gl_FragColor = vec4(c * a * ngang * uSang * uMo, 1.0); }",
        transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      });
      const m = new THREE.Mesh(g, vl); m.position.copy(tam); m.rotation.set(0, xoayY, nghieng);
      them(m, giay, k => { vl.uniforms.uTien.value = k * 1.7; vl.uniforms.uMo.value = k < 0.65 ? 1 : 1 - (k - 0.65) / 0.35; }, true);
      return m;
    },

    // cầu phép bay từ tu tới den (có đuôi hạt), gọi khiToi khi chạm
    phong(tu, den, { mau = "#7fd8ff", mau2 = "#ffffff", giay = 0.4, co = 0.5, cong = 0.4, khiToi = null, hinh = "cau" } = {}) {
      const nhom = new THREE.Group();
      const vo = new THREE.Sprite(vlSprite(TEX.chop, mau)); vo.scale.setScalar(co * 2.2);
      const loi = new THREE.Sprite(vlSprite(TEX.chop, mau2)); loi.scale.setScalar(co * 0.8);
      nhom.add(vo, loi); nhom.position.copy(tu);
      let tich = 0, xong = false; const p = new THREE.Vector3();
      them(nhom, giay, (k, dt, t) => {
        p.lerpVectors(tu, den, k); p.y += Math.sin(k * Math.PI) * cong; nhom.position.copy(p);
        vo.scale.setScalar(co * (2 + Math.sin(t * 40) * 0.3));
        tich += dt;
        while (tich > (nhe ? 0.03 : 0.015)) {
          tich -= nhe ? 0.03 : 0.015;
          hat(p.clone().add(new THREE.Vector3(ngau(-0.05, 0.05), ngau(-0.05, 0.05), 0)), { mau, co: co * 1.1, coCuoi: co * 0.2, giay: 0.35, map: hinh === "lua" ? TEX.khoi : TEX.chop, mauCuoi: hinh === "lua" ? "#5a1500" : null });
        }
        if (k >= 1 && !xong) { xong = true; if (khiToi) khiToi(p.clone()); }
      });
    },

    // sét giáng từ trời xuống điểm den
    set(den, mau = "#bfe9ff", giay = 0.45) {
      const taoTia = (a, b, w, nhanh) => {
        const pts = [a.clone()]; const N = 12;
        for (let i = 1; i < N; i++) { const q = a.clone().lerp(b, i / N); q.x += ngau(-0.35, 0.35) * (1 - Math.abs(i / N - 0.5)); q.z += ngau(-0.1, 0.1); pts.push(q); }
        pts.push(b.clone());
        const pos = [], uv = [], idx = [];
        pts.forEach((q, i) => {
          const tr = pts[Math.max(0, i - 1)], sa = pts[Math.min(pts.length - 1, i + 1)];
          const dx = sa.x - tr.x, dy = sa.y - tr.y, l = Math.hypot(dx, dy) || 1, ww = w * (1 - i / pts.length * 0.5);
          pos.push(q.x - dy / l * ww, q.y + dx / l * ww, q.z, q.x + dy / l * ww, q.y - dx / l * ww, q.z); uv.push(0, 0, 1, 0);
          if (i) { const b2 = i * 2; idx.push(b2 - 2, b2 - 1, b2, b2 - 1, b2 + 1, b2); }
          if (nhanh && i > 2 && i < N - 2 && Math.random() < 0.3) nhanh.push([q.clone(), q.clone().add(new THREE.Vector3(ngau(-1, 1), ngau(-1.4, -0.6), 0))]);
        });
        const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
        return g;
      };
      const nhom = new THREE.Group();
      const vl = new THREE.MeshBasicMaterial({ map: TEX.loi, color: mau, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      const vlLoi = vl.clone(); vlLoi.color = new THREE.Color("#ffffff");
      const dung = () => {
        while (nhom.children.length) { const c = nhom.children.pop(); c.geometry.dispose(); }
        const nhanh = [], tren = new THREE.Vector3(den.x + ngau(-1, 1), 7, den.z);
        nhom.add(new THREE.Mesh(taoTia(tren, den, 0.22, nhanh), vl), new THREE.Mesh(taoTia(tren, den, 0.07), vlLoi));
        for (const [a, b] of nhanh) nhom.add(new THREE.Mesh(taoTia(a, b, 0.08), vl));
      };
      dung(); let lan = 0;
      them(nhom, giay, k => { const l = Math.floor(k * 4); if (l !== lan && l < 4) { lan = l; dung(); } const nhay = Math.random() > 0.25 ? 1 : 0.3; vl.opacity = vlLoi.opacity = (1 - k) * nhay; }, true);
      hu.chop(den.clone().setY(den.y + 0.4), mau, 2.2, 0.3, 0.6);
      hu.songXung(den, mau, 2, 0.6);
      hu.tia(den.clone().setY(0.3), "#e9f8ff", 18, 6, 0.5);
    },

    // cột lửa bốc lên tại p
    cotLua(p, giay = 0.9, cao = 1) {
      let tich = 0;
      const moc = new THREE.Object3D(); moc.position.copy(p);
      them(moc, giay, (k, dt) => {
        tich += dt;
        const buoc = nhe ? 0.03 : 0.012;
        while (tich > buoc && k < 0.8) {
          tich -= buoc; const r = ngau(0, 0.4), a = ngau(0, 6.28);
          hat(new THREE.Vector3(p.x + Math.cos(a) * r, 0.1, p.z + Math.sin(a) * r * 0.6), { map: TEX.khoi, mau: "#ffb347", mauCuoi: "#8a1a05", mo: 0.55, co: 0.5, coCuoi: 1.1, giay: ngau(0.45, 0.7), v: new THREE.Vector3(ngau(-0.3, 0.3), ngau(3, 5) * cao, 0), xoay: 2 });
        }
      });
      hu.songXung(p, "#ff8a3a", 2.1, 0.6);
      hu.tia(p.clone().setY(0.4), "#ffb35a", 16, 5, 0.7);
    },

    // khói / bào tử loang ra
    khoi(p, mau = "#c9a6ff", so = 10, giay = 0.8, cong = true) {
      for (let i = 0; i < soHat(so); i++) hat(p.clone().add(new THREE.Vector3(ngau(-0.2, 0.2), ngau(-0.1, 0.3), ngau(-0.1, 0.1))), { map: TEX.khoi, mau, co: 0.4, coCuoi: 1.2, giay: giay * ngau(0.7, 1.1), v: new THREE.Vector3(ngau(-1.2, 1.2), ngau(0.2, 1.2), ngau(-0.3, 0.3)), cong, xoay: ngau(-2, 2) });
    },

    // vệt gió ngang khi lùi né (huong: +1 sang phải, -1 sang trái)
    gio(p, huong = -1, mau = "#e6f6ff") {
      for (let i = 0; i < soHat(8); i++) {
        const s = new THREE.Sprite(vlSprite(TEX.tia, mau)); s.position.copy(p).add(new THREE.Vector3(ngau(-0.3, 0.3), ngau(0.2, 1.8), ngau(0, 0.3)));
        s.material.rotation = huong > 0 ? 0 : Math.PI; const dai = ngau(0.5, 0.9);
        them(s, ngau(0.25, 0.4), (k, dt) => { s.position.x += huong * 5 * dt; s.scale.set(dai * (1 - k * 0.5), 0.04, 1); s.material.opacity = (1 - k) * 0.8; });
      }
    },

    // khiên năng lượng bật lên rồi tắt
    khien(p, mau = "#8fd3ff", giay = 0.55, co = 1.2) {
      const vl = hu.taoVlKhien(mau);
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), vl); m.position.copy(p);
      them(m, giay, k => { const s = co * (0.85 + 0.2 * Math.sin(Math.min(1, k * 3) * Math.PI / 2)); m.scale.set(s, s * 1.15, s); vl.uniforms.uMo.value = (1 - k) * 1.6; }, true);
      hu.chop(p, mau, 1.4, 0.2, 0.5);
    },

    // vật liệu khiên (viền sáng theo góc nhìn + vạch chạy)
    taoVlKhien(mau) {
      const vl = new THREE.ShaderMaterial({
        uniforms: { uMau: { value: new THREE.Color(mau) }, uMo: { value: 1 }, uT: { value: 0 } },
        vertexShader: "varying vec3 vN; varying vec3 vV; varying vec2 vUv; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
        fragmentShader: "uniform vec3 uMau; uniform float uMo, uT; varying vec3 vN; varying vec3 vV; varying vec2 vUv;" +
          "void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.2); float v = 0.5 + 0.5 * sin(vUv.y * 46.0 - uT * 6.0);" +
          " float o = smoothstep(0.86, 1.0, 0.5 + 0.5 * sin(vUv.x * 60.0)) * 0.35; gl_FragColor = vec4(uMau * (f * 1.3 + (v * 0.25 + o) * (0.25 + f)) * uMo, 1.0); }",
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      });
      dsVlKhien.push(vl);
      const goc = vl.dispose.bind(vl); vl.dispose = () => { const i = dsVlKhien.indexOf(vl); if (i >= 0) dsVlKhien.splice(i, 1); goc(); };
      return vl;
    },

    // tên chiêu thức hiện to giữa sân
    chuChieu(chu, p, mau = "#ffd36b", giay = 1.3) {
      const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 192;
      const g = cv.getContext("2d");
      g.font = "italic 900 112px 'Segoe UI', system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.lineJoin = "round"; g.lineWidth = 18; g.strokeStyle = "rgba(20,8,0,.85)"; g.strokeText(chu, 512, 100);
      const gr = g.createLinearGradient(0, 40, 0, 160); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.5, mau); gr.addColorStop(1, new THREE.Color(mau).multiplyScalar(0.55).getStyle()); g.fillStyle = gr; g.fillText(chu, 512, 100);
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })); s.position.copy(p);
      const r = 2.4;
      them(s, giay, k => {
        const vao = Math.min(1, k / 0.1), co = r * (1 + (1 - vao) * 0.35);
        s.scale.set(co, co * 192 / 1024, 1); s.position.y = p.y + k * 0.25;
        s.material.opacity = k < 0.75 ? vao : 1 - (k - 0.75) / 0.25;
      });
      s.material.map = tex; const xoaGoc = s.material.dispose.bind(s.material); s.material.dispose = () => { tex.dispose(); xoaGoc(); };
    },

    // vòng phù văn + hạt bay lên quanh chân (hào quang combo); muc 0 = tắt
    taoHaoQuang(mau) {
      const nhom = new THREE.Group();
      const vl = new THREE.MeshBasicMaterial({ map: TEX.phuVan, color: mau, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      const dia = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2).rotateX(-Math.PI / 2), vl); dia.position.y = 0.05; nhom.add(dia);
      const quanh = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.95, 1.6, 32, 1, true).translate(0, 0.8, 0), new THREE.MeshBasicMaterial({ color: mau, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, map: taoAnh((g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(255,255,255,.6)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, 4, 64) }));
      nhom.add(quanh);
      canh.add(nhom);
      let muc = 0, hien = 0, tich = 0;
      return {
        nhom,
        bat(m) { muc = m; },
        capNhat(dt, t, viTri) {
          hien += (Math.min(1, muc) - hien) * Math.min(1, dt * 6);
          nhom.visible = hien > 0.01; if (!nhom.visible) return;
          nhom.position.set(viTri.x, 0, viTri.z);
          dia.rotation.y += dt * 0.8; vl.opacity = 0.9 * hien;
          quanh.material.opacity = 0.16 * hien * (0.8 + 0.2 * Math.sin(t * 6));
          tich += dt * hien * (muc >= 2 ? 2 : 1);
          while (tich > (nhe ? 0.12 : 0.05)) {
            tich -= nhe ? 0.12 : 0.05; const a = ngau(0, 6.28), r = ngau(0.4, 0.9);
            hat(new THREE.Vector3(viTri.x + Math.cos(a) * r, 0.1, viTri.z + Math.sin(a) * r * 0.7), { mau, co: 0.12, coCuoi: 0.04, giay: ngau(0.6, 1.1), v: new THREE.Vector3(0, ngau(1, 2.2), 0) });
          }
        }
      };
    },

    // bụi sáng lơ lửng khắp sân (không khí trận đấu)
    taoBui({ rong = 9, cao = 3.5, sau = 4, so = 36, mau = "#ffe9b0" } = {}) {
      const dsBui = [];
      for (let i = 0; i < soHat(so); i++) {
        const s = new THREE.Sprite(vlSprite(TEX.chop, mau)); s.scale.setScalar(ngau(0.04, 0.1));
        s.position.set(ngau(-rong / 2, rong / 2), ngau(0.2, cao), ngau(-sau, 1.5)); s.material.depthTest = true;
        canh.add(s); dsBui.push({ s, pha: ngau(0, 6.28), toc: ngau(0.08, 0.25) });
      }
      return {
        capNhat(dt, t) {
          for (const b of dsBui) {
            b.s.position.x += b.toc * dt; b.s.position.y += Math.sin(t * 0.7 + b.pha) * 0.08 * dt;
            if (b.s.position.x > rong / 2) b.s.position.x = -rong / 2;
            b.s.material.opacity = 0.35 + 0.35 * Math.sin(t * 1.3 + b.pha);
          }
        }
      };
    }
  };
  return hu;
}
// 29/10/2026 - BƯỚC: TC_D05
