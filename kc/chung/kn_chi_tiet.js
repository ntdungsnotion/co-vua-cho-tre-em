// ================================================================
// FILE: kc/chung/kn_chi_tiet.js
// CHỨC NĂNG: PHẦN CHI TIẾT KHÁNG NGHỊ THEO TÍNH NĂNG (module kháng nghị chung, Thiet_Ke_Khang_Nghi.md) - dùng chung cho
//   Quản trị › 📮 Bé kháng nghị (qt_khang_nghi.js) và 🦉 Hộp Cô Cú trong 📬 Hòm thư (homthu_co_cu.js).
//   KC_KN_CHI_TIET.ve(nguon, chiTiet) -> phần tử DOM. Tính năng mới dùng kháng nghị thêm cách vẽ ở VE[nguon];
//   chưa có thì bảng khoá / giá trị. Chữ luôn textContent.
// BƯỚC: KC_12D1 (tách từ qt_khang_nghi.js KC_11D) · NGÀY: 28/11/2026
// ================================================================
(function () {
  "use strict";
  var CSS = [
    ".knCuon { overflow-x: auto; -webkit-overflow-scrolling: touch; }",
    ".knBang { border-collapse: collapse; font-size: .85rem; min-width: 640px; width: 100%; } .knBang th, .knBang td { border-bottom: 1px solid #eee; padding: 5px 6px; text-align: left; vertical-align: top; }",
    ".knBang td.dh { color: #b23b00; font-weight: 700; } .knBang tr.sai td:first-child { color: #b23b00; }",
    ".knPhu { color: #6f6890; font-size: .88rem; margin: 4px 0; }"
  ].join("\n");
  function chenKieu() { if (document.getElementById("knChiTietKieu")) return; var s = document.createElement("style"); s.id = "knChiTietKieu"; s.textContent = CSS; document.head.appendChild(s); }
  function tao(the, lop, chu) { var e = document.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; }

  var VE = {
    // 🦉 Chọn vội (chống bấm bừa): kết luận + bảng từng câu
    bb: function (ct) {
      var g = tao("div"), kl = ct.ketLuan || {};
      g.appendChild(tao("p", "knPhu", "Câu có dấu hiệu: " + (kl.soDauHieu != null ? kl.soDauHieu : "?") + " / " + (kl.soCauTinh != null ? kl.soCauTinh : "?")
        + " (bấm dồn D1 " + (kl.d1 || 0) + " · chạm tức thì D2 " + (kl.d2 || 0) + " · nhanh như đoán D3 " + (kl.d3 || 0) + ")"
        + (kl.oNhieuNhat != null && kl.tyLeO ? " · chọn ô " + (kl.oNhieuNhat + 1) + " ở " + Math.round(kl.tyLeO * 100) + " % câu" : "")));
      var cuon = tao("div", "knCuon"), b = tao("table", "knBang");
      b.innerHTML = "<thead><tr><th>#</th><th>Câu</th><th>Giây</th><th>Chạm thừa</th><th>Dồn</th><th>Sớm</th><th>Dấu hiệu</th><th>Ô chọn</th><th>Kết quả</th></tr></thead>";
      var tb = tao("tbody");
      (ct.cau || []).forEach(function (c, i) {
        var hv = c.hanhVi || {}, dh = [c.d1 ? "D1" : "", c.d2 ? "D2" : "", c.d3 ? "D3" : ""].filter(Boolean).join(" ");
        var tr = tao("tr", c.dung ? "" : "sai");
        [String(i + 1) + (c.hoiLai ? " 🔁" : ""), c.noiDung || "", c.giay != null ? String(Math.round(c.giay * 10) / 10).replace(".", ",") : "",
          hv.thua != null ? hv.thua : "", hv.thuaDon != null ? hv.thuaDon : "", hv.som != null ? hv.som : "",
          dh + (hv.an ? " (ẩn trang)" : "") + (c.tinh === false ? " · không tính" : ""), c.o != null ? "ô " + (c.o + 1) + " / " + (c.soDapAn || "?") : "", c.dung ? "✓ đúng" : "✗ sai"]
          .forEach(function (x, j) { tr.appendChild(tao("td", j === 6 && dh ? "dh" : "", String(x))); });
        tb.appendChild(tr);
      });
      b.appendChild(tb); cuon.appendChild(b); g.appendChild(cuon);
      return g;
    }
  };

  function macDinh(ct) {
    var cuon = tao("div", "knCuon"), b = tao("table", "knBang"), tb = tao("tbody");
    b.style.minWidth = "0";
    Object.keys(ct || {}).forEach(function (k) {
      var v = ct[k], tr = tao("tr");
      tr.append(tao("td", "", k), tao("td", "", typeof v === "object" ? JSON.stringify(v) : String(v)));
      tb.appendChild(tr);
    });
    b.appendChild(tb); cuon.appendChild(b);
    return cuon;
  }

  window.KC_KN_CHI_TIET = {
    ve: function (nguon, ct) { chenKieu(); return (VE[nguon] || macDinh)(ct || {}); }
  };
})();
// 28/11/2026 - BƯỚC: KC_12D1 (tạo mới: tách CHI_TIET khỏi qt_khang_nghi.js để Hộp Cô Cú dùng chung)
