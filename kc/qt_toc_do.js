// ================================================================
// FILE: kc/qt_toc_do.js
// CHỨC NĂNG: Quản trị › 🎯 Thử Thách › ⚡ Tốc độ (KC_03C5, đặc tả Thiet_Ke_On_The.md 4.3, 7):
//   - ⚙️ Cấu hình: số giây, số câu tối đa, 💎 thưởng theo số câu đúng (0..số câu, không giảm), 🪙 trừ mỗi câu sai,
//     mức câu được dùng (dễ / vừa / khó), độ dài lời hỏi tối đa, giây bù mạng. Đổi số câu thì bảng thưởng tự thêm / bớt ô.
//     Ô khác mặc định tô cam; ↺ từng ô / "Về mặc định" cả nhóm. Máy chủ kiểm lại và chỉ lưu phần khác mặc định.
//   - 📊 Thống kê 7 ngày: lượt / bé / 💎 / 🪙 đổi / 🪙 trừ / trung bình đúng / bỏ dở; phân bố số câu đúng;
//     số câu ngắn mỗi môn (môn nào chưa đủ câu thì bé thấy mờ).
//   Điện thoại: 1 cột. Máy tính: cấu hình + thống kê 2 cột (dùng chung khung .qcp* của Chinh phục).
// RPC: kc_tt_admin_cau_hinh_doc, kc_tt_admin_cau_hinh_luu (nhóm toc_do), kc_tdo_admin_thong_ke (SQL repo_rieng supabase_kc03c5_toc_do.sql).
// PHỤ THUỘC: ../admin_NC.js (adminGoiRpc, adminBaoTin), sự kiện "adminDaChuyenManHinh".
// BƯỚC: KC_03C5 - NGÀY: 24/11/2026
// ================================================================
(function () {
  "use strict";
  if (typeof adminGoiRpc !== "function") return;
  var MAN = "tocdo-thuthach";
  var S = { md: null, dang: null, daTai: false };
  var TEN_MUC = { de: "Dễ", vua: "Vừa", kho: "Khó" };

  function tao(the, lop, chu) { var e = document.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; }
  function goi(ham, ts) {
    return adminGoiRpc(ham, ts || {}).then(function (kq) {
      if (kq && kq.thanhCong === false && /function|does not exist|schema cache/i.test(kq.thongBao || "")) kq.thongBao = "Máy chủ chưa có hàm " + ham + " (cần chạy SQL KC_03C5)";
      return kq || { thanhCong: false, thongBao: "Máy chủ không trả lời" };
    });
  }
  function so(n) { return Number(n || 0).toLocaleString("vi-VN"); }

  document.addEventListener("adminDaChuyenManHinh", function (e) {
    if (e.detail && e.detail.ten === MAN && !S.daTai) { S.daTai = true; tai(); }
  });

  function tai() {
    var g = document.getElementById("qtdGoc");
    g.innerHTML = '<p class="adminDangTai">Đang tải...</p>';
    Promise.all([goi("kc_tt_admin_cau_hinh_doc"), goi("kc_tdo_admin_thong_ke", { p_ngay: 7 })]).then(function (r) {
      var ch = r[0], tk = r[1];
      g.innerHTML = "";
      if (!ch.thanhCong) { g.appendChild(tao("p", "qcpLoi", "⚠️ " + (ch.thongBao || "Không tải được cấu hình"))); return; }
      S.md = ch.macDinh.toc_do; S.dang = (tk && tk.thanhCong && tk.dangDung) || ch.dangDung.toc_do;
      var hai = tao("div", "qcpHai");
      hai.appendChild(veCauHinh(ch));
      hai.appendChild(veThongKe(tk));
      g.appendChild(hai);
    });
  }

  // ---------------- ⚙️ CẤU HÌNH ----------------
  function oSo(gt, md, ten, khoa) {
    var w = tao("label", "qcpO");
    var i = tao("input"); i.type = "number"; i.step = "1"; i.min = "0"; i.value = gt; i.setAttribute("aria-label", ten);
    if (khoa) i.dataset.khoa = khoa;
    var nut = tao("button", "qcpVe", "↺"); nut.type = "button";
    function to() { var co = md != null; var khac = co && String(i.value) !== String(md); w.classList.toggle("khac", khac); nut.hidden = !khac; nut.title = co ? "Về mặc định (" + md + ")" : ""; }
    i.addEventListener("input", to);
    nut.addEventListener("click", function () { i.value = md; to(); i.dispatchEvent(new Event("input")); });
    w.append(tao("small", "", ten), i, nut); to();
    return w;
  }

  function veCauHinh(ch) {
    var k = tao("div", "qcpKhoi");
    k.appendChild(tao("h4", "", "⚙️ Cấu hình"));
    if (ch.suaLuc && ch.daLuu && ch.daLuu.toc_do) k.appendChild(tao("p", "adminGhiChu", "Sửa lần cuối: " + (ch.suaBoi || "?") + ", " + new Date(ch.suaLuc).toLocaleString("vi-VN")));
    var luat = tao("div", "qcpKho");
    [["giay", "Số giây (20-600)"], ["so_cau", "Số câu tối đa (3-30)"], ["tru_vang_sai", "🪙 trừ mỗi câu sai"]].forEach(function (x) {
      luat.appendChild(oSo(S.dang[x[0]], S.md[x[0]], x[1], x[0]));
    });
    k.appendChild(luat);
    k.appendChild(tao("p", "qcpTieuDe", "💎 Thưởng khi đúng k câu (không được giảm; câu bỏ qua không tính)"));
    var luoi = tao("div", "qcpKho qtdThuong");
    k.appendChild(luoi);
    function veThuong(n, cu) {
      luoi.innerHTML = "";
      for (var j = 0; j <= n; j++) {
        var gt = cu && cu[j] != null ? cu[j] : (S.dang.thuong_theo_so_dung[j] != null ? S.dang.thuong_theo_so_dung[j] : (j > 0 && cu ? cu[j - 1] : 0));
        var o = oSo(gt, S.md.thuong_theo_so_dung[j], "Đúng " + j + " câu");
        o.querySelector("input").dataset.thuong = String(j);
        luoi.appendChild(o);
      }
    }
    veThuong(S.dang.so_cau);
    var iSoCau = luat.querySelector('input[data-khoa="so_cau"]');
    iSoCau.addEventListener("input", function () {
      var n = Number(iSoCau.value);
      if (!Number.isInteger(n) || n < 3 || n > 30) return;
      var cu = []; luoi.querySelectorAll("input[data-thuong]").forEach(function (i) { cu[+i.dataset.thuong] = Number(i.value); });
      for (var j = cu.length; j <= n; j++) cu[j] = cu[j - 1] || 0;
      veThuong(n, cu.slice(0, n + 1));
    });
    k.appendChild(tao("p", "adminGhiChu", "Mặc định: 60 giây, 10 câu; đúng 3-4 câu 1 💎 … đúng 10 câu 6 💎; sai mỗi câu −5 🪙 (ví không xuống dưới 0). Vượt trần 💎 trong ngày thì 💎 đổi sang 🪙 như mọi trò."));

    k.appendChild(tao("p", "qcpTieuDe", "📝 Câu được chọn (câu ngắn, không âm thanh, không hình tệp)"));
    var mucH = tao("div", "adminHang qtdMuc");
    ["de", "vua", "kho"].forEach(function (m) {
      var l = tao("label", "qtdChon"); var c = tao("input"); c.type = "checkbox"; c.value = m; c.checked = (S.dang.muc || []).indexOf(m) >= 0; c.dataset.muc = m;
      l.append(c, document.createTextNode(" " + TEN_MUC[m])); mucH.appendChild(l);
    });
    k.appendChild(mucH);
    var khac = tao("div", "qcpKho");
    [["do_dai_cau_toi_da", "Lời hỏi tối đa (ký tự)"], ["giay_du_mang", "Giây bù mạng (0-60)"]].forEach(function (x) { khac.appendChild(oSo(S.dang[x[0]], S.md[x[0]], x[1], x[0])); });
    k.appendChild(khac);
    var tb = tao("p", "qcpTb"); tb.setAttribute("aria-live", "polite");
    var hang2 = tao("div", "adminHang");
    var luu = tao("button", "adminNut adminNutThanhCong", "💾 Lưu"); luu.type = "button";
    var ve = tao("button", "adminNut adminNutPhu", "↺ Về mặc định cả nhóm"); ve.type = "button";
    hang2.append(luu, ve);
    k.append(hang2, tb);
    luu.addEventListener("click", function () { luuCH(k, tb, luu, false); });
    ve.addEventListener("click", function () { if (window.confirm("Đưa mọi số Tốc độ về mặc định?")) luuCH(k, tb, luu, true); });
    return k;
  }

  function luuCH(k, tb, nut, veMacDinh) {
    var g = JSON.parse(JSON.stringify(S.md));
    if (!veMacDinh) {
      var loi = null;
      k.querySelectorAll("input[data-khoa]").forEach(function (i) { var v = Number(i.value); if (!Number.isInteger(v) || v < 0) loi = loi || ("Cần số nguyên ≥ 0"); g[i.dataset.khoa] = v; });
      g.thuong_theo_so_dung = [];
      k.querySelectorAll("input[data-thuong]").forEach(function (i) { var v = Number(i.value); if (!Number.isInteger(v) || v < 0) loi = loi || ("Đúng " + i.dataset.thuong + " câu: cần số nguyên ≥ 0"); g.thuong_theo_so_dung[+i.dataset.thuong] = v; });
      for (var n = 1; n < g.thuong_theo_so_dung.length && !loi; n++) if (g.thuong_theo_so_dung[n] < g.thuong_theo_so_dung[n - 1]) loi = "Đúng " + n + " câu không được ít 💎 hơn đúng " + (n - 1) + " câu";
      g.muc = []; k.querySelectorAll("input[data-muc]").forEach(function (c) { if (c.checked) g.muc.push(c.value); });
      if (!g.muc.length) loi = loi || "Chọn ít nhất một mức câu";
      if (loi) { tb.className = "qcpTb xau"; tb.textContent = "⚠️ " + loi; return; }
    }
    nut.disabled = true; tb.className = "qcpTb"; tb.textContent = "Đang lưu...";
    goi("kc_tt_admin_cau_hinh_luu", { p_nhom: "toc_do", p_gia_tri: g }).then(function (kq) {
      nut.disabled = false;
      if (!kq.thanhCong) { tb.className = "qcpTb xau"; tb.textContent = "⚠️ " + (kq.thongBao || "Không lưu được"); return; }
      adminBaoTin("Đã lưu cấu hình Tốc độ", true);
      S.daTai = true; tai();
    });
  }

  // ---------------- 📊 THỐNG KÊ ----------------
  function veThongKe(tk) {
    var k = tao("div", "qcpKhoi");
    k.appendChild(tao("h4", "", "📊 Thống kê 7 ngày"));
    if (!tk || !tk.thanhCong) { k.appendChild(tao("p", "qcpLoi", "⚠️ " + ((tk && tk.thongBao) || "Không tải được"))); return k; }
    var ds = tk.theoNgay || [];
    if (!ds.length) k.appendChild(tao("p", "adminGhiChu", "Chưa có lượt Tốc độ nào trong 7 ngày."));
    else {
      var cuon = tao("div", "adminCuonNgang"), bang = tao("table", "adminBang");
      bang.innerHTML = "<thead><tr><th>Ngày</th><th>Lượt</th><th>Bé</th><th>TB đúng</th><th>💎</th><th>🪙 đổi</th><th>🪙 trừ</th><th>Bỏ dở</th></tr></thead>";
      var tb = tao("tbody");
      ds.forEach(function (d) {
        var tr = tao("tr");
        [new Date(d.ngay + "T00:00:00").toLocaleDateString("vi-VN"), d.soLuot, d.soBe, d.tbDung != null ? String(d.tbDung).replace(".", ",") : "-", so(d.kc), so(d.vang), so(d.truVang), d.bo]
          .forEach(function (x) { tr.appendChild(tao("td", "", String(x))); });
        tb.appendChild(tr);
      });
      bang.appendChild(tb); cuon.appendChild(bang); k.appendChild(cuon);
    }
    var pb = tk.phanBo || {}, n = (tk.dangDung && tk.dangDung.so_cau) || 10, tong = 0;
    Object.keys(pb).forEach(function (x) { tong += pb[x]; });
    k.appendChild(tao("p", "qcpTieuDe", "🎯 Số câu đúng mỗi lượt (trên " + tong + " lượt)"));
    var toi = tao("div", "qcpToi qtdPhanBo");
    for (var d = 0; d <= n; d++) {
      var o = tao("div", "qcpToiO"); var pt = tong ? Math.round(100 * (pb[d] || 0) / tong) : 0;
      o.append(tao("small", "", "Đúng " + d), tao("b", "", String(pb[d] || 0)), tao("i", "", pt + " %"));
      toi.appendChild(o);
    }
    k.appendChild(toi);
    k.appendChild(tao("p", "qcpTieuDe", "📚 Câu ngắn dùng được mỗi môn (cần ≥ " + n + " câu)"));
    var cuon2 = tao("div", "adminCuonNgang"), b2 = tao("table", "adminBang");
    b2.innerHTML = "<thead><tr><th>Môn</th><th>Câu ngắn</th><th>Bé thấy</th></tr></thead>";
    var tb2 = tao("tbody");
    (tk.mon || []).slice().sort(function (a, b) { return b.soCau - a.soCau; }).forEach(function (m) {
      var tr = tao("tr");
      [(m.bieuTuong || "") + " " + m.ten, so(m.soCau), m.du ? "✅ chơi được" : "mờ (chưa đủ)"].forEach(function (v) { tr.appendChild(tao("td", "", v)); });
      tb2.appendChild(tr);
    });
    b2.appendChild(tb2); cuon2.appendChild(b2); k.appendChild(cuon2);
    k.appendChild(tao("p", "adminGhiChu", "Trung bình đúng thấp (dưới 5) thì có thể tăng số giây hoặc chỉ dùng câu Dễ; cao (trên 8) thì giảm số giây."));
    var lm = tao("button", "adminNut adminNutPhu", "🔄 Làm mới"); lm.type = "button"; lm.addEventListener("click", tai);
    k.appendChild(lm);
    return k;
  }
})();
// 24/11/2026 - BƯỚC: KC_03C5 (tạo mới)
