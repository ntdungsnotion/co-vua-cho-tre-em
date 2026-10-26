// ================================================================
// FILE: dt/3d/dt3d_suong_mu.js  (ES module) - PHẦN VẼ 3D: SƯƠNG MÙ 3 MỨC
// CHỨC NĂNG: Vẽ sương mù kiểu Đế Chế THEO LÕI (dt_ban_do.js taoSuongMu): mỗi ô một điểm ảnh
//            trong ảnh 128 x 128 (đen 0 / mờ 128 / sáng 255), nội suy mượt giữa các ô. Mọi vật
//            liệu trong cảnh (đất, nước, cây, mỏ, nhà, nhân vật) được chèn thêm vài dòng shader:
//            lấy mức sương theo toạ độ thế giới (x, z) của từng điểm ảnh rồi
//            - ĐEN: tô gần đen (chưa khám phá, không thấy gì)
//            - MỜ: xám bớt màu + tối đi một nửa (đã khám phá, thấy địa hình, nguồn, nhà)
//            - SÁNG: giữ nguyên màu
//            Không thêm lệnh vẽ, không phủ tấm che (cây cao không lòi lên trên sương).
// HÀM KHAI RA:
//   taoVeSuong(ctx, suong) -> { capNhat() (gọi khi suong.phienBan đổi), apVao(vatLieu), quet() }
// LUẬT NỐI: dùng ctx (dt3d_canh.js); suong = lõi taoSuongMu (chỉ đọc daKham / sang).
// BƯỚC: TC_D02B2a
// NGÀY: 26/10/2026
// ================================================================
import * as THREE from "three";

const MAU_DEN = "vec3(0.02, 0.03, 0.07)"; // đêm xanh thẫm, đỡ "lỗ thủng" hơn đen tuyền

export function taoVeSuong(ctx, suong) {
  const W = suong.W, H = suong.H, du = new Uint8Array(W * H);
  const anh = new THREE.DataTexture(du, W, H, THREE.RedFormat, THREE.UnsignedByteType);
  anh.magFilter = anh.minFilter = THREE.LinearFilter;
  anh.generateMipmaps = false;
  anh.wrapS = anh.wrapT = THREE.ClampToEdgeWrapping;
  const uSuong = { value: anh }, uCo = { value: new THREE.Vector2(W, H) };

  function capNhat() {
    for (let i = 0; i < W * H; i++) du[i] = suong.sang[i] ? 255 : suong.daKham[i] ? 128 : 0;
    anh.needsUpdate = true;
  }

  const daAp = new WeakSet();
  function apVao(vl) {
    if (!vl || daAp.has(vl)) return;
    daAp.add(vl);
    const cu = vl.onBeforeCompile;
    vl.onBeforeCompile = (shader, renderer) => {
      if (cu) cu(shader, renderer);
      shader.uniforms.uSuong = uSuong; shader.uniforms.uSuongCo = uCo;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vSuongXZ;")
        .replace("#include <project_vertex>", `#include <project_vertex>
  vec4 dtSuongP = vec4( transformed, 1.0 );
  #ifdef USE_BATCHING
    dtSuongP = batchingMatrix * dtSuongP;
  #endif
  #ifdef USE_INSTANCING
    dtSuongP = instanceMatrix * dtSuongP;
  #endif
  vSuongXZ = ( modelMatrix * dtSuongP ).xz;`);
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform sampler2D uSuong;\nuniform vec2 uSuongCo;\nvarying vec2 vSuongXZ;")
        .replace("#include <dithering_fragment>", `#include <dithering_fragment>
  vec2 dtUv = vSuongXZ / uSuongCo;
  float dtM = texture2D( uSuong, dtUv ).r;
  // ngoài mép bản đồ: tối dần trong 1,5 ô (ảnh kẹp mép sẽ kéo dài dải sáng ra ngoài)
  vec2 dtRa = max( -vSuongXZ, vSuongXZ - uSuongCo );
  dtM *= 1.0 - smoothstep( 0.0, 1.5, max( dtRa.x, dtRa.y ) );
  float dtSang = smoothstep( 0.55, 0.95, dtM ), dtThay = smoothstep( 0.05, 0.45, dtM );
  vec3 dtXam = vec3( dot( gl_FragColor.rgb, vec3( 0.3, 0.59, 0.11 ) ) );
  vec3 dtMo = mix( dtXam, gl_FragColor.rgb, 0.4 ) * 0.5;
  gl_FragColor.rgb = mix( ${MAU_DEN}, mix( dtMo, gl_FragColor.rgb, dtSang ), dtThay );`);
    };
    const khoaCu = vl.customProgramCacheKey ? vl.customProgramCacheKey.bind(vl) : () => "";
    vl.customProgramCacheKey = () => khoaCu() + "|suong";
    vl.needsUpdate = true;
  }
  // Áp vào mọi vật liệu đang có trong cảnh (gọi lại khi thêm hình mới: nông dân, mầm cây...)
  function quet() {
    ctx.canh.traverse(o => { if (!o.material || o.userData.khongSuong) return; for (const vl of Array.isArray(o.material) ? o.material : [o.material]) apVao(vl); });
  }
  // Trời ngoài bản đồ cũng tối theo (không thấy "trời xanh" cạnh vùng chưa khám phá)
  ctx.canh.background = new THREE.Color(0x05080f);
  let dem = 0;
  ctx.moiKhung(dt => { if ((dem += dt) > 1) { dem = 0; quet(); } });
  capNhat(); quet();
  return { capNhat, apVao, quet };
}
// 26/10/2026 22:05 - BƯỚC: TC_D02B2a
