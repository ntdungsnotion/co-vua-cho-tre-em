// ================================================================
// FILE: dt/dt_khoi_tao.js
// CHỨC NĂNG: Sảnh chờ của game Đấu Trường Tri Thức (trang kc/dautruongtrithuc.html).
//            - Tải thế giới game từ dt/du_lieu/the_gioi.json (kỷ nguyên, đấu trường).
//            - Nút chọn kỷ nguyên: đổi hình Nhà chính (gỗ -> đá -> pha lê) và lưới
//              các đấu trường môn học có trong kỷ nguyên đó.
//            Nhớ kỷ nguyên bé chọn lần trước trong localStorage (chỉ cho tiện).
// BƯỚC: TC_D00
// NGÀY: 21/10/2026
// ================================================================

(function () {
  "use strict";

  var KHOA_NHO_KY = "kc_dt_ky_dang_xem";
  var NS = "http://www.w3.org/2000/svg";
  var theGioi = null;

  // ----------------------------------------------------------------
  // PHẦN 1: HÌNH NHÀ CHÍNH 3 KỶ NGUYÊN (SVG vẽ tay, viewBox 320 x 220)
  // ----------------------------------------------------------------
  var SAO = '<g>' +
    '<circle class="dtSao" cx="30" cy="26" r="1.8" fill="#fff6dc"/><circle class="dtSao" cx="72" cy="14" r="1.3" fill="#fff6dc"/>' +
    '<circle class="dtSao" cx="118" cy="34" r="1.5" fill="#ffe3a3"/><circle class="dtSao" cx="210" cy="18" r="1.8" fill="#fff6dc"/>' +
    '<circle class="dtSao" cx="262" cy="40" r="1.3" fill="#ffe3a3"/><circle class="dtSao" cx="296" cy="16" r="1.6" fill="#fff6dc"/>' +
    '<circle class="dtSao" cx="160" cy="10" r="1.2" fill="#fff6dc"/><circle class="dtSao" cx="16" cy="70" r="1.2" fill="#ffe3a3"/>' +
    '</g>';
  var TRANG = '<circle cx="270" cy="52" r="16" fill="#fff3c4" opacity=".95"/><circle cx="277" cy="47" r="14" fill="#2b3f8a"/>';

  var NHA = {
    // Kỷ Khởi Nguyên: nhà gỗ mái lá trên đồi cỏ, cây xanh, cờ
    khoi_nguyen:
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
    // Kỷ Khai Sáng: tháp đá mái tím, tường thành răng cưa, cờ xanh
    khai_sang:
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
      '<line x1="160" y1="26" x2="160" y2="4" stroke="#3c2a6e" stroke-width="3"/><path class="dtCo" d="M161 5 L188 11 L161 18 Z" fill="#4fc3f7"/>' +
      '<circle class="dtHatSang" cx="104" cy="104" r="3" fill="#b99bff"/><circle class="dtHatSang" cx="220" cy="96" r="2.5" fill="#b99bff"/>',
    // Kỷ Hoàng Kim: cung điện pha lê và vàng, chóp cao, hạt sáng bay
    hoang_kim:
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
    var svg = document.getElementById("dtVuongQuoc");
    if (!svg) return;
    svg.innerHTML = SAO + TRANG + '<g class="dtNha">' + (NHA[maKy] || NHA.khoi_nguyen) + "</g>";
  }

  // ----------------------------------------------------------------
  // PHẦN 2: CHỌN KỶ NGUYÊN + LƯỚI ĐẤU TRƯỜNG
  // ----------------------------------------------------------------
  function giaiDoanTrongKy(dauTruong, ky) {
    return (dauTruong.giaiDoan || []).filter(function (g) {
      return g.tuLop <= ky.denLop && g.denLop >= ky.tuLop;
    });
  }

  function chuLop(tu, den) {
    return tu === den ? "Lớp " + tu : "Lớp " + tu + "–" + den;
  }

  function taoThe(dauTruong, ky) {
    var dsGiaiDoan = giaiDoanTrongKy(dauTruong, ky);
    if (!dsGiaiDoan.length) return null;
    var the = document.createElement("div");
    the.className = "dtDauTruong";
    var bieuTuong = document.createElement("span");
    bieuTuong.className = "dtBieuTuong";
    bieuTuong.setAttribute("aria-hidden", "true");
    bieuTuong.textContent = dauTruong.bieuTuong || "📘";
    the.appendChild(bieuTuong);

    dsGiaiDoan.forEach(function (g) {
      var tieuDe = document.createElement("h3");
      tieuDe.textContent = g.ten;
      var congTrinh = document.createElement("p");
      congTrinh.className = "dtCongTrinh";
      congTrinh.textContent = "🏰 " + g.congTrinh;
      var lop = document.createElement("p");
      lop.className = "dtLop";
      lop.textContent = chuLop(Math.max(g.tuLop, ky.tuLop), Math.min(g.denLop, ky.denLop));
      the.appendChild(tieuDe);
      the.appendChild(congTrinh);
      the.appendChild(lop);
    });

    (dauTruong.nhanh || []).forEach(function (n) {
      if (n.tuLop < ky.tuLop || n.tuLop > ky.denLop) return;
      var nhanh = document.createElement("p");
      nhanh.className = "dtLop";
      nhanh.textContent = "Lớp " + n.tuLop + ": " + n.ten + " (" + n.congTrinh + ")";
      the.appendChild(nhanh);
    });

    if (dauTruong.chiSo) {
      var chiSo = document.createElement("span");
      chiSo.className = "dtChiSo";
      chiSo.textContent = "Nuôi: " + dauTruong.chiSo;
      the.appendChild(chiSo);
    }
    return the;
  }

  function chonKy(maKy) {
    var ky = theGioi.kyNguyen.filter(function (k) { return k.ma === maKy; })[0] || theGioi.kyNguyen[0];
    try { localStorage.setItem(KHOA_NHO_KY, ky.ma); } catch (e) { /* máy chặn bộ nhớ thì thôi */ }

    Array.prototype.forEach.call(document.querySelectorAll(".dtNutKy"), function (nut) {
      nut.setAttribute("aria-pressed", nut.getAttribute("data-ky") === ky.ma ? "true" : "false");
    });
    document.getElementById("dtMoTaKy").textContent = ky.moTa;
    document.getElementById("dtTenNha").textContent = "Nhà chính " + ky.ten + " (cấp " + ky.tuLop + "–" + ky.denLop + ")";
    veNhaChinh(ky.ma);

    var luoi = document.getElementById("dtLuoiDauTruong");
    luoi.innerHTML = "";
    theGioi.dauTruong.forEach(function (dt) {
      var the = taoThe(dt, ky);
      if (the) luoi.appendChild(the);
    });
  }

  function dungNutKy() {
    var hop = document.getElementById("dtChonKy");
    hop.innerHTML = "";
    theGioi.kyNguyen.forEach(function (ky) {
      var nut = document.createElement("button");
      nut.type = "button";
      nut.className = "dtNutKy";
      nut.setAttribute("data-ky", ky.ma);
      nut.setAttribute("aria-pressed", "false");
      nut.textContent = ky.ten;
      var phu = document.createElement("small");
      phu.textContent = ky.capHoc + " · lớp " + ky.tuLop + "–" + ky.denLop;
      nut.appendChild(phu);
      nut.addEventListener("click", function () { chonKy(ky.ma); });
      hop.appendChild(nut);
    });
  }

  function baoLoi() {
    veNhaChinh("khoi_nguyen");
    var luoi = document.getElementById("dtLuoiDauTruong");
    luoi.innerHTML = '<p class="dtThongBaoLoi">Bản đồ thế giới chưa tải được. Con kiểm tra mạng rồi tải lại trang nhé!</p>';
  }

  // ----------------------------------------------------------------
  // PHẦN 3: KHỞI ĐỘNG
  // ----------------------------------------------------------------
  function khoiDong() {
    fetch("dt/du_lieu/the_gioi.json", { cache: "no-cache" })
      .then(function (tl) { if (!tl.ok) throw new Error("HTTP " + tl.status); return tl.json(); })
      .then(function (duLieu) {
        if (!duLieu || !duLieu.kyNguyen || !duLieu.kyNguyen.length || !duLieu.dauTruong) throw new Error("Thiếu dữ liệu");
        theGioi = duLieu;
        dungNutKy();
        var kyNho = null;
        try { kyNho = localStorage.getItem(KHOA_NHO_KY); } catch (e) { kyNho = null; }
        chonKy(kyNho || duLieu.kyNguyen[0].ma);
      })
      .catch(baoLoi);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", khoiDong);
  else khoiDong();
})();
