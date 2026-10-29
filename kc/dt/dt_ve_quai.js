// ================================================================
// FILE: dt/dt_ve_quai.js
// CHỨC NĂNG: VẼ QUÁI của Đấu Trường Tri Thức lên canvas 2D (màn chiến đấu; TC_D06 dùng lại).
//            ve(c, ma, { x, y (chân quái trên mặt đất), co (phóng, 1 = cao khoảng 100 px), t (giây),
//                       huong (-1 nhìn trái), chu (số / chữ trên mình quái), mo (0..1 mờ dần) })
//            Ba quái đầu: slime_so (khối thạch xanh mang con số), nam_chu_cai (nấm mũ đỏ mang chữ cái),
//            dom_dom (đom đóm phát sáng). Phong cách: dễ thương vừa phải, viền đậm, không đáng sợ.
//            Không đụng DOM ngoài canvas được đưa vào.
// BƯỚC: TC_D05
// NGÀY: 29/10/2026
// ================================================================
(function (goc) {
  "use strict";
  const PI2 = Math.PI * 2;
  const VIEN = "#1d1630";

  function mat(c, x, y, r, t, huong) { // đôi mắt + chớp mắt
    const chop = (t % 3.7) < 0.12;
    [-1, 1].forEach(s => {
      const mx = x + s * r * 1.15 + huong * r * 0.25;
      c.fillStyle = "#fff"; c.strokeStyle = VIEN; c.lineWidth = 2;
      c.beginPath();
      if (chop) c.ellipse(mx, y, r * 0.8, r * 0.15, 0, 0, PI2); else c.ellipse(mx, y, r * 0.8, r, 0, 0, PI2);
      c.fill(); c.stroke();
      if (!chop) { c.fillStyle = VIEN; c.beginPath(); c.arc(mx + huong * r * 0.25, y + r * 0.1, r * 0.45, 0, PI2); c.fill();
        c.fillStyle = "#fff"; c.beginPath(); c.arc(mx + huong * r * 0.25 - r * 0.15, y - r * 0.15, r * 0.15, 0, PI2); c.fill(); }
    });
  }

  function chuTren(c, chu, x, y, co, mau) {
    if (!chu) return;
    c.font = "800 " + Math.round(co) + "px system-ui, sans-serif";
    c.textAlign = "center"; c.textBaseline = "middle";
    c.lineWidth = Math.max(2, co * 0.14); c.strokeStyle = VIEN; c.strokeText(chu, x, y);
    c.fillStyle = mau; c.fillText(chu, x, y);
  }

  function slime(c, o) {
    const t = o.t, nhun = Math.sin(t * 3.2) * 0.06;
    const w = 46 * (1 + nhun), h = 40 * (1 - nhun);
    // bóng
    c.fillStyle = "rgba(0,0,0,.22)"; c.beginPath(); c.ellipse(0, 0, 44, 8, 0, 0, PI2); c.fill();
    const g = c.createRadialGradient(-12, -h * 1.2, 4, 0, -h * 0.7, w * 1.3);
    g.addColorStop(0, "#c8ffb0"); g.addColorStop(0.45, "#5fd35a"); g.addColorStop(1, "#2a8d3d");
    c.fillStyle = g; c.strokeStyle = VIEN; c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-w, 0);
    c.bezierCurveTo(-w * 1.05, -h * 1.1, -w * 0.5, -h * 2, 0, -h * 2);
    c.bezierCurveTo(w * 0.5, -h * 2, w * 1.05, -h * 1.1, w, 0);
    c.quadraticCurveTo(0, 6, -w, 0);
    c.fill(); c.stroke();
    // giọt bóng sáng
    c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.ellipse(-w * 0.45, -h * 1.45, 7, 11, -0.5, 0, PI2); c.fill();
    mat(c, 0, -h * 1.25, 7, t, o.huong);
    chuTren(c, o.chu || "7", 0, -h * 0.5, 26, "#fff6a8");
  }

  function nam(c, o) {
    const t = o.t, lac = Math.sin(t * 2.4) * 0.05;
    c.fillStyle = "rgba(0,0,0,.22)"; c.beginPath(); c.ellipse(0, 0, 38, 7, 0, 0, PI2); c.fill();
    c.save(); c.rotate(lac);
    // thân
    c.fillStyle = "#f6e7c8"; c.strokeStyle = VIEN; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-20, 0); c.quadraticCurveTo(-26, -40, -16, -52); c.lineTo(16, -52); c.quadraticCurveTo(26, -40, 20, 0); c.quadraticCurveTo(0, 5, -20, 0); c.fill(); c.stroke();
    mat(c, 0, -30, 6, t, o.huong);
    // mũ
    const g = c.createLinearGradient(0, -100, 0, -48);
    g.addColorStop(0, "#ff7a6b"); g.addColorStop(1, "#c4322e");
    c.fillStyle = g;
    c.beginPath(); c.moveTo(-52, -50); c.bezierCurveTo(-56, -95, 56, -95, 52, -50); c.quadraticCurveTo(0, -38, -52, -50); c.fill(); c.stroke();
    c.fillStyle = "#fff4e6";
    [[-34, -64, 7], [33, -66, 6], [-14, -84, 5], [18, -86, 4]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, PI2); c.fill(); });
    chuTren(c, o.chu || "A", 2, -68, 28, "#fff6a8");
    c.restore();
  }

  function domDom(c, o) {
    const t = o.t, bay = Math.sin(t * 2.6) * 8, vo = Math.sin(t * 28);
    c.fillStyle = "rgba(0,0,0,.18)"; c.beginPath(); c.ellipse(0, 0, 26, 5, 0, 0, PI2); c.fill();
    c.save(); c.translate(0, -70 + bay);
    // quầng sáng
    const s = c.createRadialGradient(-24 * o.huong * -1, 12, 2, -24 * o.huong * -1, 12, 60);
    s.addColorStop(0, "rgba(255,240,120,.75)"); s.addColorStop(1, "rgba(255,240,120,0)");
    c.fillStyle = s; c.beginPath(); c.arc(-24 * o.huong * -1, 12, 60, 0, PI2); c.fill();
    // cánh
    c.fillStyle = "rgba(200,230,255,.75)"; c.strokeStyle = VIEN; c.lineWidth = 2;
    [-1, 1].forEach(k => { c.save(); c.rotate(k * (0.5 + vo * 0.35)); c.beginPath(); c.ellipse(0, -26, 12, 26, 0, 0, PI2); c.fill(); c.stroke(); c.restore(); });
    // đuôi phát sáng
    const g = c.createRadialGradient(24, 10, 2, 24, 10, 22);
    g.addColorStop(0, "#fffbd0"); g.addColorStop(1, "#f2c230");
    c.fillStyle = g; c.lineWidth = 3;
    c.beginPath(); c.ellipse(24 * -o.huong, 10, 22, 17, 0, 0, PI2); c.fill(); c.stroke();
    // thân + đầu
    c.fillStyle = "#3b3f7a"; c.beginPath(); c.ellipse(0, 0, 24, 20, 0, 0, PI2); c.fill(); c.stroke();
    c.fillStyle = "#4b4f96"; c.beginPath(); c.arc(-22 * -o.huong, -8, 17, 0, PI2); c.fill(); c.stroke();
    // râu
    c.beginPath(); c.moveTo(-28 * -o.huong, -22); c.quadraticCurveTo(-34 * -o.huong, -40, -42 * -o.huong, -38); c.moveTo(-18 * -o.huong, -24); c.quadraticCurveTo(-20 * -o.huong, -42, -26 * -o.huong, -44); c.stroke();
    mat(c, -22 * -o.huong, -9, 4.5, t, o.huong);
    chuTren(c, o.chu || "?", 24 * -o.huong, 11, 18, "#7a4b00");
    c.restore();
  }

  const BANG = { slime_so: slime, nam_chu_cai: nam, dom_dom: domDom };

  function ve(c, ma, tc) {
    const o = Object.assign({ x: 0, y: 0, co: 1, t: 0, huong: -1, chu: "", mo: 1 }, tc || {});
    const f = BANG[ma] || slime;
    c.save();
    c.globalAlpha *= Math.max(0, Math.min(1, o.mo));
    c.translate(o.x, o.y); c.scale(o.co, o.co);
    f(c, o);
    c.restore();
  }

  goc.KC_DT_VE_QUAI = { ve, LOAI: Object.keys(BANG) };
})(typeof window !== "undefined" ? window : globalThis);
// 29/10/2026 - BƯỚC: TC_D05
