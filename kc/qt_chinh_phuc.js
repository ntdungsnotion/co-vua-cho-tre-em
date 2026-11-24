// ================================================================
// FILE: kc/qt_chinh_phuc.js
// CHỨC NĂNG: Quản trị › 🎯 Thử Thách › 🏆 Chinh phục 30 câu (KC_03C6, đặc tả Thiet_Ke_On_The.md 5.9, 7):
//   - ⚙️ Cấu hình: bảng thưởng 30 câu (💎 khi đúng k câu, không giảm), độ khó từng chặng (xác suất bé trả lời đúng mà máy chủ
//     nhắm khi chọn câu, theo trình độ từng bé), số câu tối thiểu để một môn được trộn vào, số môn mỗi chặng, phút giữ lượt dở.
//     Ô nào khác mặc định thì tô vàng; ↺ từng ô / "Về mặc định" cả nhóm. Máy chủ kiểm lại và chỉ lưu phần khác mặc định.
//   - 📊 Thống kê 7 ngày: lượt / bé / 💎 / 🪙 / cách kết thúc mỗi ngày; số lượt tới câu 5..30; tỉ lệ đúng thật mỗi chặng so với mức nhắm.
//   Điện thoại: 1 cột, lưới thưởng 5 ô một hàng. Máy tính: cấu hình + thống kê 2 cột.
// RPC: kc_tt_admin_cau_hinh_doc, kc_tt_admin_cau_hinh_luu, kc_tt_admin_thong_ke (SQL repo_rieng supabase_kc03c6_chinh_phuc.sql).
// PHỤ THUỘC: ../admin_NC.js (adminGoiRpc, adminBaoTin), sự kiện "adminDaChuyenManHinh".
// BƯỚC: KC_03C6 - NGÀY: 24/11/2026
// ================================================================
(function () {
  "use strict";
  if (typeof adminGoiRpc !== "function") return;
  var MAN = "chinhphuc-thuthach";
  var S = { md: null, dang: null, daTai: false };
  var TEN_CHANG = ["1 · Khởi hành", "2 · Rừng xanh", "3 · Sông lớn", "4 · Núi đá", "5 · Đèo mây", "6 · Lâu đài"];

  function tao(the, lop, chu) { var e = document.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; }
  function goi(ham, ts) {
    return adminGoiRpc(ham, ts || {}).then(function (kq) {
      if (kq && kq.thanhCong === false && /function|does not exist|schema cache/i.test(kq.thongBao || "")) kq.thongBao = "Máy chủ chưa có hàm " + ham + " (cần chạy SQL KC_03C6)";
      return kq || { thanhCong: false, thongBao: "Máy chủ không trả lời" };
    });
  }
  function so(n) { return Number(n || 0).toLocaleString("vi-VN"); }

  document.addEventListener("adminDaChuyenManHinh", function (e) {
    if (e.detail && e.detail.ten === MAN && !S.daTai) { S.daTai = true; tai(); }
  });

  function tai() {
    var g = document.getElementById("qcpGoc");
    g.innerHTML = '<p class="adminDangTai">Đang tải...</p>';
    Promise.all([goi("kc_tt_admin_cau_hinh_doc"), goi("kc_tt_admin_thong_ke", { p_ngay: 7 })]).then(function (r) {
      var ch = r[0], tk = r[1];
      g.innerHTML = "";
      if (!ch.thanhCong) { g.appendChild(tao("p", "qcpLoi", "⚠️ " + (ch.thongBao || "Không tải được cấu hình"))); return; }
      S.md = ch.macDinh.chinh_phuc; S.dang = ch.dangDung.chinh_phuc;
      var hai = tao("div", "qcpHai");
      hai.appendChild(veCauHinh(ch));
      hai.appendChild(veThongKe(tk));
      g.appendChild(hai);
    });
  }

  // ---------------- ⚙️ CẤU HÌNH ----------------
  function oSo(gt, md, buoc, ten) {
    var w = tao("label", "qcpO");
    var i = tao("input"); i.type = "number"; i.step = buoc || "1"; i.min = "0"; i.value = gt; i.dataset.md = md; i.setAttribute("aria-label", ten);
    var nut = tao("button", "qcpVe", "↺"); nut.type = "button"; nut.title = "Về mặc định (" + md + ")";
    function to() { var khac = String(i.value) !== String(md); w.classList.toggle("khac", khac); nut.hidden = !khac; }
    i.addEventListener("input", to);
    nut.addEventListener("click", function () { i.value = md; to(); });
    w.append(tao("small", "", ten), i, nut); to();
    return w;
  }

  function veCauHinh(ch) {
    var k = tao("div", "qcpKhoi");
    k.appendChild(tao("h4", "", "⚙️ Cấu hình"));
    if (ch.suaLuc && ch.daLuu && ch.daLuu.chinh_phuc) k.appendChild(tao("p", "adminGhiChu", "Sửa lần cuối: " + (ch.suaBoi || "?") + ", " + new Date(ch.suaLuc).toLocaleString("vi-VN")));
    // thưởng 30 câu
    k.appendChild(tao("p", "qcpTieuDe", "💎 Thưởng khi đúng k câu (mốc bảo toàn: câu 5, 10, 15, 20, 25; không được giảm)"));
    var luoi = tao("div", "qcpThuong");
    for (var c = 0; c < 6; c++) {
      var hang = tao("div", "qcpHang");
      hang.appendChild(tao("span", "qcpChang", "Chặng " + TEN_CHANG[c]));
      for (var j = 0; j < 5; j++) {
        var n = c * 5 + j;
        var o = oSo(S.dang.thuong[n], S.md.thuong[n], "1", "Câu " + (n + 1));
        o.querySelector("input").dataset.thuong = String(n);
        if (j === 4) o.classList.add("moc");
        hang.appendChild(o);
      }
      luoi.appendChild(hang);
    }
    k.appendChild(luoi);
    // độ khó
    k.appendChild(tao("p", "qcpTieuDe", "🎯 Độ khó từng chặng: % bé trả lời đúng mà máy chủ nhắm khi chọn câu theo trình độ của bé (30-99; càng nhỏ càng khó)"));
    var kho = tao("div", "qcpKho");
    for (var c2 = 0; c2 < 6; c2++) {
      var o2 = oSo(Math.round(S.dang.nham_chang[c2] * 100), Math.round(S.md.nham_chang[c2] * 100), "1", "Chặng " + (c2 + 1) + " (%)");
      o2.querySelector("input").dataset.nham = String(c2);
      kho.appendChild(o2);
    }
    k.appendChild(kho);
    k.appendChild(tao("p", "adminGhiChu", "Mặc định 95 → 70 % (mô phỏng: bé trung bình ~24 💎 / lượt, ~46 % qua chặng 2, ~20 % qua chặng 3, ~0,3 % đủ 30 câu). Bé mới chơi (trình độ chưa chắc) máy chủ tự cho câu dễ hơn (≥ 80 %)."));
    // khác
    var khac = tao("div", "qcpKho");
    [["mon_toi_thieu_cau", "Môn tối thiểu (câu)"], ["mon_moi_chang", "Số môn mỗi chặng"], ["het_han_phut", "Giữ lượt dở (phút)"]].forEach(function (x) {
      var o3 = oSo(S.dang[x[0]], S.md[x[0]], "1", x[1]); o3.querySelector("input").dataset.khoa = x[0]; khac.appendChild(o3);
    });
    k.appendChild(khac);
    var tb = tao("p", "qcpTb"); tb.setAttribute("aria-live", "polite");
    var hang2 = tao("div", "adminHang");
    var luu = tao("button", "adminNut adminNutThanhCong", "💾 Lưu"); luu.type = "button";
    var ve = tao("button", "adminNut adminNutPhu", "↺ Về mặc định cả nhóm"); ve.type = "button";
    hang2.append(luu, ve);
    k.append(hang2, tb);
    luu.addEventListener("click", function () { luuCH(k, tb, luu, false); });
    ve.addEventListener("click", function () { if (window.confirm("Đưa mọi số Chinh phục về mặc định?")) luuCH(k, tb, luu, true); });
    return k;
  }

  function luuCH(k, tb, nut, veMacDinh) {
    var g = JSON.parse(JSON.stringify(S.md));
    if (!veMacDinh) {
      var loi = null;
      k.querySelectorAll("input[data-thuong]").forEach(function (i) { var v = Number(i.value); if (!Number.isInteger(v) || v < 0) loi = loi || ("Câu " + (+i.dataset.thuong + 1) + ": cần số nguyên ≥ 0"); g.thuong[+i.dataset.thuong] = v; });
      k.querySelectorAll("input[data-nham]").forEach(function (i) { var v = Number(i.value); if (!(v >= 30 && v <= 99)) loi = loi || ("Chặng " + (+i.dataset.nham + 1) + ": từ 30 đến 99 %"); g.nham_chang[+i.dataset.nham] = Math.round(v) / 100; });
      k.querySelectorAll("input[data-khoa]").forEach(function (i) { g[i.dataset.khoa] = Number(i.value); });
      for (var n = 1; n < 30 && !loi; n++) if (g.thuong[n] < g.thuong[n - 1]) loi = "Câu " + (n + 1) + " không được ít 💎 hơn câu " + n;
      if (loi) { tb.className = "qcpTb xau"; tb.textContent = "⚠️ " + loi; return; }
    }
    nut.disabled = true; tb.className = "qcpTb"; tb.textContent = "Đang lưu...";
    goi("kc_tt_admin_cau_hinh_luu", { p_nhom: "chinh_phuc", p_gia_tri: g }).then(function (kq) {
      nut.disabled = false;
      if (!kq.thanhCong) { tb.className = "qcpTb xau"; tb.textContent = "⚠️ " + (kq.thongBao || "Không lưu được"); return; }
      adminBaoTin("Đã lưu cấu hình Chinh phục 30 câu", true);
      S.daTai = true; tai();
    });
  }

  // ---------------- 📊 THỐNG KÊ ----------------
  function veThongKe(tk) {
    var k = tao("div", "qcpKhoi");
    k.appendChild(tao("h4", "", "📊 Thống kê 7 ngày"));
    if (!tk || !tk.thanhCong) { k.appendChild(tao("p", "qcpLoi", "⚠️ " + ((tk && tk.thongBao) || "Không tải được"))); return k; }
    var ds = tk.theoNgay || [];
    if (!ds.length) k.appendChild(tao("p", "adminGhiChu", "Chưa có lượt Chinh phục nào trong 7 ngày."));
    else {
      var cuon = tao("div", "adminCuonNgang"), bang = tao("table", "adminBang");
      bang.innerHTML = "<thead><tr><th>Ngày</th><th>Lượt</th><th>Bé</th><th>💎</th><th>🪙</th><th>Dừng</th><th>Sai</th><th>Đủ 30</th></tr></thead>";
      var tb = tao("tbody");
      ds.forEach(function (d) {
        var tr = tao("tr");
        [new Date(d.ngay + "T00:00:00").toLocaleDateString("vi-VN"), d.soLuot, d.soBe, so(d.kc), so(d.vang), d.dung, d.sai, d.xong].forEach(function (x) { tr.appendChild(tao("td", "", String(x))); });
        tb.appendChild(tr);
      });
      bang.appendChild(tb); cuon.appendChild(bang); k.appendChild(cuon);
    }
    var t = tk.toiCau || {}, tong = t.tong || 0;
    k.appendChild(tao("p", "qcpTieuDe", "🚩 Số lượt đi tới câu (trên " + tong + " lượt)"));
    var toi = tao("div", "qcpToi");
    ["5", "10", "15", "20", "25", "30"].forEach(function (x) {
      var o = tao("div", "qcpToiO"); var pt = tong ? Math.round(100 * (t[x] || 0) / tong) : 0;
      o.append(tao("small", "", "Câu " + x), tao("b", "", String(t[x] || 0)), tao("i", "", pt + " %"));
      toi.appendChild(o);
    });
    k.appendChild(toi);
    k.appendChild(tao("p", "qcpTieuDe", "🎯 Tỉ lệ đúng thật mỗi chặng (so với mức nhắm)"));
    var cuon2 = tao("div", "adminCuonNgang"), b2 = tao("table", "adminBang");
    b2.innerHTML = "<thead><tr><th>Chặng</th><th>Số câu đã hỏi</th><th>Đúng thật</th><th>Máy chủ dự đoán</th><th>Mức nhắm</th></tr></thead>";
    var tb2 = tao("tbody"), theo = {};
    (tk.theoChang || []).forEach(function (c) { theo[c.chang] = c; });
    for (var c = 1; c <= 6; c++) {
      var x = theo[c] || {}, tr = tao("tr");
      [String(c), String(x.soCau || 0), x.soCau ? Math.round(x.tiLeDung * 100) + " %" : "-", x.pNham != null ? Math.round(x.pNham * 100) + " %" : "-",
        tk.nham ? Math.round(tk.nham[c - 1] * 100) + " %" : "-"].forEach(function (v) { tr.appendChild(tao("td", "", v)); });
      tb2.appendChild(tr);
    }
    b2.appendChild(tb2); cuon2.appendChild(b2); k.appendChild(cuon2);
    k.appendChild(tao("p", "adminGhiChu", "Đúng thật thấp hơn nhiều so với dự đoán thì giảm độ khó chặng đó (tăng %), cao hơn nhiều thì tăng độ khó."));
    var lm = tao("button", "adminNut adminNutPhu", "🔄 Làm mới"); lm.type = "button"; lm.addEventListener("click", tai);
    k.appendChild(lm);
    return k;
  }
})();
// 24/11/2026 - BƯỚC: KC_03C6 (tạo mới)
