// ================================================================
// FILE: dt/dt_khoi_tao.js
// CHỨC NĂNG: Sảnh + màn mở đầu của game Đấu Trường Tri Thức (kc/dautruongtrithuc.html).
//            - Chưa có Thủ lĩnh: nút "Bắt đầu" mở màn tạo Thủ lĩnh (dt_tao_nhan_vat.js).
//            - Đã có: chào Thủ lĩnh, nút "Tiếp tục" vào Lều trại (Thủ lĩnh + nông dân
//              vung rìu chặt cây), nút "Sửa Thủ lĩnh".
//            - Bốn thời kỳ (dt/du_lieu/thoi_ky.json): Nhà chính + Thủ lĩnh của bé mặc
//              trang phục từng thời kỳ, danh hiệu, cần gì để lên, mở thêm gì.
//            - Các đấu trường môn học (dt/du_lieu/the_gioi.json).
//            Nhân vật vẽ bằng bộ vẽ DÙNG CHUNG toàn app (chung/nv_ve.js).
// BƯỚC: TC_D01 (bản đầu TC_D00: 3 kỷ nguyên, nay thay bằng 4 thời kỳ)
// NGÀY: 21/10/2026
// PHỤ THUỘC: kc_auth.js (sự kiện kcSanSang), chung/nv_*.js, chung/loc_ten.js,
//            dt/dt_tien_do.js, dt/dt_tao_nhan_vat.js
// ================================================================

(function () {
  "use strict";

  var KHOA_NHO_KY = "kc_dt_ky_dang_xem";
  var NV = window.KC_NV, SK = window.KC_SAN_KHAU;
  var duLieu = null;      // { theGioi, chungLoai, thoiKy }
  var tenDangNhap = null;
  var tienDo = null, hoSo = null;
  var kyDangXem = "do_da";

  function $(id) { return document.getElementById(id); }
  function hoSoMacDinh() { return NV.chuanHoa({ chungLoai: "nhan", gioi: "nam", mauToc: 1, mauAo: 0 }); }

  // ----------------------------------------------------------------
  // PHẦN 1: HÌNH NHÀ CHÍNH 4 THỜI KỲ (SVG vẽ tay, viewBox 320 x 220)
  // ----------------------------------------------------------------
  var SAO = '<g>' +
    '<circle class="dtSao" cx="30" cy="26" r="1.8" fill="#fff6dc"/><circle class="dtSao" cx="72" cy="14" r="1.3" fill="#fff6dc"/>' +
    '<circle class="dtSao" cx="118" cy="34" r="1.5" fill="#ffe3a3"/><circle class="dtSao" cx="210" cy="18" r="1.8" fill="#fff6dc"/>' +
    '<circle class="dtSao" cx="262" cy="40" r="1.3" fill="#ffe3a3"/><circle class="dtSao" cx="296" cy="16" r="1.6" fill="#fff6dc"/>' +
    '<circle class="dtSao" cx="160" cy="10" r="1.2" fill="#fff6dc"/><circle class="dtSao" cx="16" cy="70" r="1.2" fill="#ffe3a3"/>' +
    '</g>';
  var TRANG = '<circle cx="270" cy="52" r="16" fill="#fff3c4" opacity=".95"/><circle cx="277" cy="47" r="14" fill="#2b3f8a"/>';

  var NHA = {
    // Đồ đá: lều da căng trên cọc, đống lửa, tảng đá
    do_da:
      '<ellipse cx="160" cy="200" rx="152" ry="18" fill="#3f9a4f"/><ellipse cx="160" cy="197" rx="136" ry="13" fill="#58b862"/>' +
      '<g fill="#2f7d3d"><circle cx="40" cy="166" r="20"/><circle cx="58" cy="156" r="15"/></g><rect x="46" y="174" width="6" height="22" fill="#7a4a24"/>' +
      '<path d="M96 194 L160 84 L224 194 Z" fill="#b98455"/><path d="M160 84 L224 194 L196 194 Z" fill="#9a6a3f"/>' +
      '<g stroke="#7a4f2c" stroke-width="2" fill="none"><path d="M118 156 Q160 150 202 156"/><path d="M106 176 Q160 170 214 176"/></g>' +
      '<path d="M146 194 L160 140 L174 194 Z" fill="#4a2c18"/>' +
      '<g stroke="#6b3d1d" stroke-width="3"><line x1="160" y1="84" x2="150" y2="66"/><line x1="160" y1="84" x2="172" y2="64"/></g>' +
      '<ellipse cx="258" cy="196" rx="20" ry="5" fill="#6d6f78"/>' +
      '<g class="dtDen"><path d="M246 192 Q250 170 258 162 Q262 176 270 192 Z" fill="#ff8a3d"/><path d="M252 192 Q256 178 259 172 Q263 182 265 192 Z" fill="#ffd36b"/></g>' +
      '<g stroke="#7a4a24" stroke-width="4" stroke-linecap="round"><line x1="242" y1="196" x2="274" y2="190"/><line x1="242" y1="190" x2="274" y2="197"/></g>' +
      '<ellipse cx="80" cy="192" rx="14" ry="8" fill="#9aa0a8"/><ellipse cx="76" cy="189" rx="5" ry="2" fill="#c3c7cd"/>',
    // Đồ đồng: nhà gỗ mái lá, cờ (Nhà chính cấp 1)
    do_dong:
      '<ellipse cx="160" cy="200" rx="152" ry="18" fill="#3f9a4f"/><ellipse cx="160" cy="197" rx="136" ry="13" fill="#58b862"/>' +
      '<g fill="#2f7d3d"><circle cx="46" cy="170" r="20"/><circle cx="62" cy="160" r="16"/><circle cx="276" cy="168" r="20"/><circle cx="260" cy="158" r="14"/></g>' +
      '<rect x="52" y="178" width="6" height="18" fill="#7a4a24"/><rect x="266" y="176" width="6" height="20" fill="#7a4a24"/>' +
      '<rect x="102" y="120" width="116" height="74" rx="6" fill="#b7794a"/>' +
      '<g stroke="#8d5a32" stroke-width="2"><line x1="102" y1="140" x2="218" y2="140"/><line x1="102" y1="160" x2="218" y2="160"/><line x1="102" y1="180" x2="218" y2="180"/></g>' +
      '<path d="M88 126 L160 70 L232 126 Z" fill="#e3b25a"/><path d="M96 126 L160 78 L224 126" fill="none" stroke="#c99436" stroke-width="3"/>' +
      '<g stroke="#c99436" stroke-width="2"><line x1="120" y1="112" x2="132" y2="100"/><line x1="150" y1="112" x2="160" y2="90"/><line x1="186" y1="112" x2="196" y2="102"/></g>' +
      '<rect x="146" y="150" width="28" height="44" rx="12" fill="#6b3d1d"/><circle cx="168" cy="173" r="2" fill="#ffc24b"/>' +
      '<rect class="dtDen" x="114" y="146" width="22" height="20" rx="4" fill="#ffd36b"/><rect class="dtDen" x="184" y="146" width="22" height="20" rx="4" fill="#ffd36b"/>' +
      '<line x1="160" y1="70" x2="160" y2="40" stroke="#6b3d1d" stroke-width="3"/><path class="dtCo" d="M161 41 L186 47 L161 54 Z" fill="#ff8a3d"/>',
    // Đồ sắt: tháp đá mái tím, tường răng cưa (Nhà chính cấp 2)
    do_sat:
      '<ellipse cx="160" cy="200" rx="152" ry="18" fill="#4a5a86"/><ellipse cx="160" cy="197" rx="136" ry="13" fill="#6474a4"/>' +
      '<rect x="62" y="140" width="196" height="56" fill="#8a93b3"/>' +
      '<g fill="#8a93b3"><rect x="62" y="130" width="18" height="12"/><rect x="92" y="130" width="18" height="12"/><rect x="210" y="130" width="18" height="12"/><rect x="240" y="130" width="18" height="12"/></g>' +
      '<g stroke="#6f7898" stroke-width="2"><line x1="62" y1="160" x2="258" y2="160"/><line x1="62" y1="178" x2="258" y2="178"/></g>' +
      '<rect x="126" y="78" width="68" height="118" fill="#a3abc8"/>' +
      '<g stroke="#858ead" stroke-width="2"><line x1="126" y1="100" x2="194" y2="100"/><line x1="126" y1="124" x2="194" y2="124"/><line x1="126" y1="148" x2="194" y2="148"/><line x1="160" y1="78" x2="160" y2="100"/><line x1="142" y1="100" x2="142" y2="124"/><line x1="178" y1="100" x2="178" y2="124"/></g>' +
      '<path d="M118 82 L160 26 L202 82 Z" fill="#7c4fd6"/><path d="M160 26 L202 82 L180 82 Z" fill="#6438bd"/>' +
      '<path d="M146 196 L146 168 Q160 150 174 168 L174 196 Z" fill="#3c2a6e"/>' +
      '<path class="dtDen" d="M150 118 L150 108 Q160 98 170 108 L170 118 Z" fill="#ffd36b"/>' +
      '<rect class="dtDen" x="82" y="164" width="14" height="14" rx="3" fill="#ffd36b"/><rect class="dtDen" x="224" y="164" width="14" height="14" rx="3" fill="#ffd36b"/>' +
      '<line x1="160" y1="26" x2="160" y2="4" stroke="#3c2a6e" stroke-width="3"/><path class="dtCo" d="M161 5 L188 11 L161 18 Z" fill="#4fc3f7"/>',
    // Đế quốc: cung điện pha lê và vàng (Nhà chính cấp 3)
    de_quoc:
      '<ellipse cx="160" cy="200" rx="152" ry="18" fill="#c99a2e"/><ellipse cx="160" cy="197" rx="136" ry="13" fill="#e7bd52"/>' +
      '<rect x="70" y="138" width="180" height="58" rx="6" fill="#e8f6ff"/><rect x="70" y="138" width="180" height="8" fill="#ffc24b"/>' +
      '<path d="M78 140 L96 92 L114 140 Z" fill="#9fe3ff"/><path d="M206 140 L224 92 L242 140 Z" fill="#9fe3ff"/>' +
      '<path d="M96 92 L114 140 L104 140 Z" fill="#6cc8f0"/><path d="M224 92 L242 140 L232 140 Z" fill="#6cc8f0"/>' +
      '<rect x="128" y="92" width="64" height="104" fill="#f4fbff"/><rect x="128" y="92" width="64" height="7" fill="#ffc24b"/>' +
      '<path d="M120 96 L160 10 L200 96 Z" fill="#7fd8ff"/><path d="M160 10 L200 96 L174 96 Z" fill="#4fb6e8"/><path d="M160 10 L146 96 L134 96 Z" fill="#b8ecff"/>' +
      '<path d="M146 196 L146 166 Q160 148 174 166 L174 196 Z" fill="#ffc24b"/>' +
      '<circle class="dtDen" cx="160" cy="122" r="9" fill="#ffd36b"/>' +
      '<rect class="dtDen" x="88" y="158" width="14" height="18" rx="7" fill="#ffd36b"/><rect class="dtDen" x="218" y="158" width="14" height="18" rx="7" fill="#ffd36b"/>' +
      '<g><circle class="dtHatSang" cx="62" cy="96" r="3" fill="#fff3c4"/><circle class="dtHatSang" cx="258" cy="84" r="3.5" fill="#fff3c4"/>' +
      '<circle class="dtHatSang" cx="110" cy="56" r="2.5" fill="#9fe3ff"/><circle class="dtHatSang" cx="214" cy="48" r="2.5" fill="#9fe3ff"/></g>'
  };

  function veNhaChinh(maKy) {
    $("dtVuongQuoc").innerHTML = SAO + TRANG + '<g class="dtNha">' + (NHA[maKy] || NHA.do_da) + "</g>";
  }

  // ----------------------------------------------------------------
  // PHẦN 2: CẢNH CANVAS (mở đầu, lều trại, nhân vật theo thời kỳ)
  // ----------------------------------------------------------------
  function veTroi(c, w, h, mat) { // trời chạng vạng + đồi xa + cỏ; trả về y mặt đất
    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#1c2a62"); g.addColorStop(0.55, "#3b4f99"); g.addColorStop(0.8, "#e59a6a");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = "#fff6dc";
    for (var i = 0; i < 14; i++) { var sx = (i * 97.3) % w, sy = (i * 41.7) % (h * 0.4); c.globalAlpha = 0.35 + 0.5 * ((i * 7) % 5) / 5; c.fillRect(sx, sy, 1.6, 1.6); }
    c.globalAlpha = 1;
    c.fillStyle = "#fff3c4"; c.beginPath(); c.arc(w * 0.86, h * 0.17, Math.min(w, h) * 0.06, 0, 6.29); c.fill();
    var dat = h * mat;
    c.fillStyle = "#2f5f6b"; c.beginPath(); c.moveTo(0, dat);
    for (var x = 0; x <= w; x += w / 8) c.quadraticCurveTo(x + w / 16, dat - h * (0.14 + 0.06 * Math.sin(x)), x + w / 8, dat - h * 0.03);
    c.lineTo(w, dat); c.closePath(); c.fill();
    c.fillStyle = "#4e9e55"; c.fillRect(0, dat - 2, w, h - dat + 2);
    c.fillStyle = "#5fb562"; c.fillRect(0, dat - 2, w, Math.max(3, h * 0.03));
    return dat;
  }
  function veLeuDa(c, x, y, s) { // lều da nhỏ trên canvas, đáy tại (x, y)
    c.fillStyle = "#b98455"; c.beginPath(); c.moveTo(x - 34 * s, y); c.lineTo(x, y - 48 * s); c.lineTo(x + 34 * s, y); c.closePath(); c.fill();
    c.fillStyle = "#9a6a3f"; c.beginPath(); c.moveTo(x, y - 48 * s); c.lineTo(x + 34 * s, y); c.lineTo(x + 20 * s, y); c.closePath(); c.fill();
    c.fillStyle = "#4a2c18"; c.beginPath(); c.moveTo(x - 7 * s, y); c.lineTo(x, y - 24 * s); c.lineTo(x + 7 * s, y); c.closePath(); c.fill();
    c.strokeStyle = "#6b3d1d"; c.lineWidth = 2.4 * s; c.beginPath(); c.moveTo(x, y - 48 * s); c.lineTo(x - 5 * s, y - 58 * s); c.moveTo(x, y - 48 * s); c.lineTo(x + 6 * s, y - 59 * s); c.stroke();
  }
  function veLua(c, x, y, s, t) { // đống lửa bập bùng
    c.strokeStyle = "#7a4a24"; c.lineWidth = 4 * s; c.lineCap = "round";
    c.beginPath(); c.moveTo(x - 10 * s, y); c.lineTo(x + 10 * s, y - 4 * s); c.moveTo(x - 10 * s, y - 4 * s); c.lineTo(x + 10 * s, y); c.stroke();
    var n = 1 + 0.12 * Math.sin(t * 9) + 0.08 * Math.sin(t * 13);
    c.fillStyle = "rgba(255,180,80,.18)"; c.beginPath(); c.arc(x, y - 8 * s, 26 * s, 0, 6.29); c.fill();
    c.fillStyle = "#ff8a3d"; c.beginPath(); c.moveTo(x - 8 * s, y - 2 * s); c.quadraticCurveTo(x - 6 * s, y - 18 * s * n, x, y - 26 * s * n); c.quadraticCurveTo(x + 7 * s, y - 16 * s * n, x + 8 * s, y - 2 * s); c.closePath(); c.fill();
    c.fillStyle = "#ffd36b"; c.beginPath(); c.moveTo(x - 4 * s, y - 2 * s); c.quadraticCurveTo(x - 3 * s, y - 11 * s * n, x + 1 * s, y - 16 * s * n); c.quadraticCurveTo(x + 4 * s, y - 9 * s, x + 4 * s, y - 2 * s); c.closePath(); c.fill();
  }
  function veCay(c, x, y, s, lac) { // cây tròn, lac = độ rung khi bị chặt
    c.fillStyle = "#7a4a24"; c.fillRect(x - 4 * s, y - 34 * s, 8 * s, 34 * s);
    c.fillStyle = "#5a3418"; c.beginPath(); c.moveTo(x - 4 * s, y - 10 * s); c.lineTo(x + 1 * s, y - 13 * s); c.lineTo(x - 4 * s, y - 16 * s); c.closePath(); c.fill();
    var dx = lac * s;
    [["#2f7d3d", 0, -50, 22], ["#3a9149", -12, -40, 15], ["#3a9149", 13, -42, 16], ["#48a656", 2, -60, 15]].forEach(function (v) {
      c.fillStyle = v[0]; c.beginPath(); c.arc(x + v[1] * s + dx, y + v[2] * s, v[3] * s, 0, 6.29); c.fill();
    });
  }

  function taoCanhLeu(td, hs) {
    var vun = [], trungTruoc = false, tRung = -9;
    var nd = NV.hoSoNongDan(hs.chungLoai, 0);
    return function (c, w, h, t) {
      var dat = veTroi(c, w, h, 0.84);
      var co = Math.min(h * 0.42 / NV.CAO, w / 230);
      var s = co * 1.15;
      veLeuDa(c, w * 0.17, dat, s);
      veLua(c, w * 0.34, dat, s * 0.9, t);
      var xCay = w * 0.86, lac = t - tRung < 0.25 ? Math.sin((t - tRung) * 60) * 2.5 : 0;
      veCay(c, xCay, dat, s * 1.15, lac);
      NV.ve(c, hs, { x: w * 0.5, y: dat + 2, co: co, t: t, tuThe: "dung", thoiKy: td.thoiKy });
      var k = NV.ve(c, nd, { x: xCay - 30 * s, y: dat + 4, co: co * 0.92, t: t, lech: 0.5, tuThe: "chat", vaiTro: "nong_dan" });
      if (k.trung && !trungTruoc) {
        tRung = t;
        for (var i = 0; i < 5; i++) vun.push({ x: xCay - 6 * s, y: dat - 12 * s, vx: (-20 - Math.random() * 40) * s, vy: (-40 - Math.random() * 50) * s, t0: t });
      }
      trungTruoc = k.trung;
      vun = vun.filter(function (v) { return t - v.t0 < 0.8; });
      c.fillStyle = "#e3b25a";
      vun.forEach(function (v) { var d = t - v.t0; c.fillRect(v.x + v.vx * d, v.y + v.vy * d + 120 * s * d * d, 3 * s, 2 * s); });
    };
  }

  function taoCanhMoDau() {
    return function (c, w, h, t) {
      var dat = veTroi(c, w, h, 0.86);
      var co = Math.min(h * 0.58 / NV.CAO, w / 190);
      if (tienDo && hoSo) {
        veLua(c, w * 0.72, dat, co * 0.95, t);
        NV.ve(c, hoSo, { x: w * 0.4, y: dat + 2, co: co, t: t, tuThe: "vay", thoiKy: tienDo.thoiKy });
      } else { // chưa có Thủ lĩnh: ba chủng loại đứng chờ bé chọn
        var mau = [{ chungLoai: "quy", gioi: "nu", kieuToc: 0, mauToc: 4, mauDa: 2, mauAo: 3 },
          { chungLoai: "nhan", gioi: "nam", kieuToc: 1, mauToc: 1, mauDa: 1, mauAo: 1 },
          { chungLoai: "tien", gioi: "nu", kieuToc: 1, mauToc: 5, mauDa: 0, mauAo: 2 }];
        var c2 = Math.min(co, w / 4 / 36);
        mau.forEach(function (m, i) {
          NV.ve(c, m, { x: w * (0.22 + i * 0.28), y: dat + 2, co: c2, t: t, lech: i * 0.7, tuThe: i === 1 ? "vay" : "dung" });
        });
      }
    };
  }

  function veNhanVatKy(c, w, h, t) {
    var dat = h * 0.92;
    c.fillStyle = "rgba(255,255,255,.06)"; c.beginPath(); c.ellipse(w / 2, dat, w * 0.42, h * 0.06, 0, 0, 6.29); c.fill();
    NV.ve(c, hoSo || hoSoMacDinh(), { x: w / 2, y: dat, co: h * 0.8 / NV.CAO, t: t, tuThe: "dung", thoiKy: kyDangXem });
  }

  // ----------------------------------------------------------------
  // PHẦN 3: BỐN THỜI KỲ + ĐẤU TRƯỜNG
  // ----------------------------------------------------------------
  function dongTT(nhan, giaTri) {
    var p = document.createElement("p");
    var b = document.createElement("b"); b.textContent = nhan + ": ";
    p.appendChild(b); p.appendChild(document.createTextNode(giaTri));
    return p;
  }

  function chonKy(ma) {
    var ds = duLieu.thoiKy.thoiKy;
    var ky = ds.filter(function (k) { return k.ma === ma; })[0] || ds[0];
    kyDangXem = ky.ma;
    try { localStorage.setItem(KHOA_NHO_KY, ky.ma); } catch (e) { /* máy chặn bộ nhớ thì thôi */ }
    Array.prototype.forEach.call(document.querySelectorAll(".dtNutKy"), function (nut) {
      nut.setAttribute("aria-pressed", nut.getAttribute("data-ky") === ky.ma ? "true" : "false");
    });
    veNhaChinh(ky.ma);
    $("dtTenNha").textContent = ky.nhaChinh;
    var hienTai = tienDo ? tienDo.thoiKy : "do_da";
    var tenNguoi = tienDo ? tienDo.tenThuLinh : "Thủ lĩnh của con";
    $("dtKyDanhHieu").textContent = ky.danhHieu + " " + (tienDo ? tenNguoi : "");
    $("dtKyMoc").textContent = ky.ma === hienTai ? "📍 Con đang ở đây" : (ds.indexOf(ky) > ds.map(function (x) { return x.ma; }).indexOf(hienTai) ? "🔒 Chưa tới" : "✅ Đã qua");
    var ct = $("dtKyChiTiet"); ct.innerHTML = "";
    var mo = document.createElement("p"); mo.className = "dtKyMoTa"; mo.textContent = ky.moTa; ct.appendChild(mo);
    if (ky.canTaiNguyen.length || ky.phatMinh.length) {
      var can = ky.canTaiNguyen.join(" + ");
      if (ky.phatMinh.length) can += (can ? " + " : "") + "phát minh " + ky.phatMinh.join(", ");
      if (ky.canTrum) can += " + thắng trùm thời kỳ";
      ct.appendChild(dongTT("Lên thời kỳ cần", can));
    } else ct.appendChild(dongTT("Lên thời kỳ cần", "Bắt đầu game ở đây"));
    ct.appendChild(dongTT("Mở thêm", ky.moThem.join(", ")));
    ct.appendChild(dongTT("Vùng đất", ky.vungDat));
    ct.appendChild(dongTT("Thẻ tri thức", ky.theTriThuc));
    SK.veLai($("dtKyNhanVat"));
  }

  function dungNutKy() {
    var hop = $("dtChonKy"); hop.innerHTML = "";
    duLieu.thoiKy.thoiKy.forEach(function (ky) {
      var nut = document.createElement("button");
      nut.type = "button"; nut.className = "dtNutKy";
      nut.setAttribute("data-ky", ky.ma); nut.setAttribute("aria-pressed", "false");
      nut.textContent = ky.ten;
      var phu = document.createElement("small"); phu.textContent = ky.danhHieu;
      nut.appendChild(phu);
      nut.addEventListener("click", function () { chonKy(ky.ma); });
      hop.appendChild(nut);
    });
  }

  function chuLop(tu, den) { return tu === den ? "Lớp " + tu : "Lớp " + tu + "–" + den; }

  function dungDauTruong() {
    var luoi = $("dtLuoiDauTruong"); luoi.innerHTML = "";
    duLieu.theGioi.dauTruong.forEach(function (dt) {
      var the = document.createElement("div"); the.className = "dtDauTruong";
      var bt = document.createElement("span"); bt.className = "dtBieuTuong"; bt.setAttribute("aria-hidden", "true"); bt.textContent = dt.bieuTuong || "📘";
      the.appendChild(bt);
      (dt.giaiDoan || []).forEach(function (g) {
        var h3 = document.createElement("h3"); h3.textContent = g.ten;
        var ct = document.createElement("p"); ct.className = "dtCongTrinh"; ct.textContent = "🏰 " + g.congTrinh;
        var lop = document.createElement("p"); lop.className = "dtLop"; lop.textContent = chuLop(g.tuLop, g.denLop);
        the.appendChild(h3); the.appendChild(ct); the.appendChild(lop);
      });
      (dt.nhanh || []).forEach(function (n) {
        var p = document.createElement("p"); p.className = "dtLop"; p.textContent = "Lớp " + n.tuLop + ": " + n.ten + " (" + n.congTrinh + ")";
        the.appendChild(p);
      });
      if (dt.chiSo) { var cs = document.createElement("span"); cs.className = "dtChiSo"; cs.textContent = "Nuôi: " + dt.chiSo; the.appendChild(cs); }
      luoi.appendChild(the);
    });
  }

  // ----------------------------------------------------------------
  // PHẦN 4: CHUYỂN MÀN (sảnh / tạo / lều trại)
  // ----------------------------------------------------------------
  function tenLoai(ma) {
    var x = duLieu.chungLoai.chungLoai.filter(function (c) { return c.ma === ma; })[0];
    return x ? x.ten : ma;
  }
  function danhHieu() {
    var ky = duLieu.thoiKy.thoiKy.filter(function (k) { return k.ma === (tienDo ? tienDo.thoiKy : "do_da"); })[0];
    return ky ? ky.danhHieu : "Thủ lĩnh";
  }

  function hienSanh() {
    $("dtManTao").hidden = true; $("dtManLeu").hidden = true; SK.huy($("dtCanhLeu"));
    $("dtMoDau").hidden = false; $("dtSanhPhu").hidden = false;
    var co = !!(tienDo && hoSo);
    $("dtNutBatDau").hidden = co; $("dtNutTiepTuc").hidden = !co; $("dtNutSua").hidden = !co;
    $("dtChao").textContent = co
      ? "Chào mừng " + danhHieu() + " " + tienDo.tenThuLinh + " trở lại vương quốc " + tienDo.tenVuongQuoc + "!"
      : "Con hãy tạo Thủ lĩnh, đặt tên vương quốc và chọn chủng loại để bắt đầu.";
    $("dtChuThichMoDau").textContent = co ? danhHieu() + " " + tienDo.tenThuLinh + " · " + tenLoai(tienDo.chungLoai) : "Nhân tộc · Quỷ tộc · Tiên tộc";
    SK.veLai($("dtCanhMoDau"));
    chonKy(kyDangXem);
  }

  function moTao(sua) {
    $("dtMoDau").hidden = true; $("dtSanhPhu").hidden = true; $("dtManLeu").hidden = true;
    window.KC_DT_TAO.mo({
      tenDangNhap: tenDangNhap, dsChungLoai: duLieu.chungLoai.chungLoai, tenChiSo: duLieu.chungLoai.tenChiSo,
      tienDo: sua ? tienDo : null, hoSo: sua ? hoSo : null,
      xong: function (td, hs) { tienDo = td; hoSo = hs; moLeu(); },
      huy: hienSanh
    });
  }

  function moLeu() {
    $("dtMoDau").hidden = true; $("dtSanhPhu").hidden = true; $("dtManTao").hidden = true;
    $("dtManLeu").hidden = false;
    $("dtTieuDeLeu").textContent = "🏕️ Lều trại vương quốc " + tienDo.tenVuongQuoc;
    var the = $("dtTheThongTin"); the.innerHTML = "";
    [["👑", danhHieu() + " " + tienDo.tenThuLinh], ["🧬", tenLoai(tienDo.chungLoai)], ["🎒", "Lớp " + tienDo.lop], ["🪨", "Thời kỳ Đồ đá"]].forEach(function (x) {
      var s = document.createElement("span"); s.className = "dtChipTT"; s.textContent = x[0] + " " + x[1]; the.appendChild(s);
    });
    SK.dang($("dtCanhLeu"), taoCanhLeu(tienDo, hoSo));
    $("dtManLeu").scrollIntoView({ block: "start" });
  }

  // ----------------------------------------------------------------
  // PHẦN 5: KHỞI ĐỘNG (sau khi kc_auth.js biết chắc đã đăng nhập)
  // ----------------------------------------------------------------
  function taiJson(duongDan) {
    return fetch(duongDan, { cache: "no-cache" }).then(function (tl) { if (!tl.ok) throw new Error("HTTP " + tl.status); return tl.json(); });
  }

  function baoLoi() {
    $("dtChao").textContent = "Bản đồ thế giới chưa tải được. Con kiểm tra mạng rồi tải lại trang nhé!";
    $("dtNutBatDau").hidden = true;
  }

  function khoiDong(taiKhoan) {
    if (tenDangNhap || !taiKhoan || !taiKhoan.tenDangNhap) return; // chỉ khởi động một lần
    tenDangNhap = taiKhoan.tenDangNhap;
    Promise.all([taiJson("dt/du_lieu/the_gioi.json"), taiJson("dt/du_lieu/chung_loai.json"), taiJson("dt/du_lieu/thoi_ky.json")])
      .then(function (kq) {
        if (!kq[0].dauTruong || !kq[1].chungLoai || !kq[2].thoiKy || kq[2].thoiKy.length !== 4) throw new Error("Thiếu dữ liệu");
        duLieu = { theGioi: kq[0], chungLoai: kq[1], thoiKy: kq[2] };
        tienDo = window.KC_DT_TIEN_DO.doc(tenDangNhap);
        hoSo = window.KC_NV_HO_SO.doc(tenDangNhap);
        if (tienDo && !hoSo) hoSo = NV.chuanHoa({ chungLoai: tienDo.chungLoai });
        try { kyDangXem = localStorage.getItem(KHOA_NHO_KY) || (tienDo ? tienDo.thoiKy : "do_da"); } catch (e) { kyDangXem = "do_da"; }
        dungNutKy(); dungDauTruong();
        $("dtNutBatDau").addEventListener("click", function () { moTao(false); });
        $("dtNutSua").addEventListener("click", function () { moTao(true); });
        $("dtNutTiepTuc").addEventListener("click", moLeu);
        $("dtNutVeSanh").addEventListener("click", function () { hienSanh(); $("dtMoDau").scrollIntoView({ block: "start" }); });
        $("dtNutSuaLeu").addEventListener("click", function () { moTao(true); });
        SK.dang($("dtCanhMoDau"), taoCanhMoDau());
        SK.dang($("dtKyNhanVat"), veNhanVatKy);
        hienSanh();
      })
      .catch(baoLoi);
  }

  document.addEventListener("kcSanSang", function (su) {
    if (su.detail && su.detail.daDangNhap) khoiDong(su.detail.taiKhoan);
  });
})();
