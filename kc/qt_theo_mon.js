// ================================================================
// FILE: kc/qt_theo_mon.js
// CHỨC NĂNG: Quản trị › 🎯 Thử Thách › 📚 Theo môn (KC_03C4, đặc tả Thiet_Ke_On_The.md 4.0, 4.1, 5.9, 7):
//   - ⚙️ Thưởng Theo môn: 💎 tối đa cho 10 câu (bộ N câu nhân N / 10), 🪙 xu vàng mỗi câu đúng, hệ số giờ k (× giờ chung).
//   - ⚙️ Luật chọn câu dùng chung (nhóm "chung": Theo môn, Tổng hợp, Ôn sau trận): số câu bé chọn, số câu mặc định,
//     số kiến thức tối thiểu để môn sáng, phút giữ lượt dở, ngày tránh lặp câu, hỏi lại sau / tối đa, kiến thức mới mỗi 10 câu
//     theo tỉ lệ đúng bộ trước, lần đầu, tồn nhiều thì không thêm mới.
//     Ô khác mặc định tô cam; ↺ từng ô / "Về mặc định" cả nhóm. Máy chủ kiểm lại, chỉ lưu phần khác mặc định.
//   - 📊 Thống kê 7 ngày: lượt / bé / tỉ lệ đúng / 💎 / 🪙 / bỏ dở; mỗi môn; số câu bé chọn; kiến thức mỗi môn của cả kho (sáng / Sắp có).
//   - 🎯 Xem thử bộ câu: gõ tên bé + môn + số câu -> máy chủ chọn thử đúng như khi bé bấm Bắt đầu (CHỈ XEM, không ghi gì).
//   - 🔊 Âm thanh: Theo môn chỉ dùng âm thanh chung (đúng / sai / thưởng / lời khen / đọc câu) -> nút mở 🎵 Âm thanh chung.
//   Điện thoại: 1 cột. Máy tính: cấu hình + thống kê 2 cột (khung .qcp* của Chinh phục).
// RPC: kc_tt_admin_cau_hinh_doc, kc_tt_admin_cau_hinh_luu (nhóm theo_mon, chung), kc_tm_admin_thong_ke, kc_tm_admin_xem_thu
//      (SQL repo_rieng supabase_kc03c4_theo_mon.sql).
// PHỤ THUỘC: ../admin_NC.js (adminGoiRpc, adminBaoTin), sự kiện "adminDaChuyenManHinh".
// BƯỚC: KC_03C4 - NGÀY: 24/11/2026
// ================================================================
(function () {
  "use strict";
  if (typeof adminGoiRpc !== "function") return;
  var MAN = "theomon-thuthach";
  var S = { md: null, dang: null, daTai: false, mon: [] };
  var TEN_NHOM = { moi: "✨ mới", toi_han: "🔔 tới hạn", on: "🔁 ôn" };

  function tao(the, lop, chu) { var e = document.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; }
  function goi(ham, ts) {
    return adminGoiRpc(ham, ts || {}).then(function (kq) {
      if (kq && kq.thanhCong === false && /function|does not exist|schema cache/i.test(kq.thongBao || "")) kq.thongBao = "Máy chủ chưa có hàm " + ham + " (cần chạy SQL KC_03C4)";
      return kq || { thanhCong: false, thongBao: "Máy chủ không trả lời" };
    });
  }
  function so(n) { return Number(n || 0).toLocaleString("vi-VN"); }
  function soVi(n) { return String(n).replace(".", ","); }

  document.addEventListener("adminDaChuyenManHinh", function (e) {
    if (e.detail && e.detail.ten === MAN && !S.daTai) { S.daTai = true; tai(); }
  });

  function tai() {
    var g = document.getElementById("qtmGoc");
    g.innerHTML = '<p class="adminDangTai">Đang tải...</p>';
    Promise.all([goi("kc_tt_admin_cau_hinh_doc"), goi("kc_tm_admin_thong_ke", { p_ngay: 7 })]).then(function (r) {
      var ch = r[0], tk = r[1];
      g.innerHTML = "";
      if (!ch.thanhCong) { g.appendChild(tao("p", "qcpLoi", "⚠️ " + (ch.thongBao || "Không tải được cấu hình"))); return; }
      if (!ch.macDinh || !ch.macDinh.theo_mon || ch.macDinh.theo_mon.kc_toi_da_10 == null) {
        g.appendChild(tao("p", "qcpLoi", "⚠️ Máy chủ chưa có cấu hình Theo môn mới (cần chạy SQL KC_03C4).")); return;
      }
      S.md = ch.macDinh; S.dang = ch.dangDung; S.ch = ch;
      S.mon = (tk && tk.thanhCong && tk.mon) || [];
      var hai = tao("div", "qcpHai");
      var trai = tao("div", "qtmCot");
      trai.appendChild(veThuong());
      trai.appendChild(veChung());
      hai.appendChild(trai);
      var phai = tao("div", "qtmCot");
      phai.appendChild(veThongKe(tk));
      phai.appendChild(veXemThu());
      phai.appendChild(veAmThanh());
      hai.appendChild(phai);
      g.appendChild(hai);
    });
  }

  // ---------------- ô số ----------------
  function oSo(gt, md, ten, khoa, buoc) {
    var w = tao("label", "qcpO");
    var i = tao("input"); i.type = "number"; i.step = buoc || "1"; i.min = "0"; i.value = gt; i.setAttribute("aria-label", ten);
    if (khoa) i.dataset.khoa = khoa;
    var nut = tao("button", "qcpVe", "↺"); nut.type = "button";
    function to() { var co = md != null; var khac = co && Number(i.value) !== Number(md); w.classList.toggle("khac", khac); nut.hidden = !khac; nut.title = co ? "Về mặc định (" + soVi(md) + ")" : ""; }
    i.addEventListener("input", to);
    nut.addEventListener("click", function () { i.value = md; to(); i.dispatchEvent(new Event("input")); });
    w.append(tao("small", "", ten), i, nut); to();
    return w;
  }
  function oChu(gt, md, ten, khoa) {
    var w = tao("label", "qcpO");
    var i = tao("input"); i.type = "text"; i.value = gt; i.setAttribute("aria-label", ten); i.dataset.khoaChu = khoa;
    var nut = tao("button", "qcpVe", "↺"); nut.type = "button";
    function to() { var khac = i.value.replace(/\s/g, "") !== String(md).replace(/\s/g, ""); w.classList.toggle("khac", khac); nut.hidden = !khac; nut.title = "Về mặc định (" + md + ")"; }
    i.addEventListener("input", to);
    nut.addEventListener("click", function () { i.value = md; to(); });
    w.append(tao("small", "", ten), i, nut); to();
    return w;
  }
  function hangLuu(k, nhom, tenNhom, thuGom) {
    var tb = tao("p", "qcpTb"); tb.setAttribute("aria-live", "polite");
    var h = tao("div", "adminHang");
    var luu = tao("button", "adminNut adminNutThanhCong", "💾 Lưu"); luu.type = "button";
    var ve = tao("button", "adminNut adminNutPhu", "↺ Về mặc định cả nhóm"); ve.type = "button";
    h.append(luu, ve); k.append(h, tb);
    function gui(gv) {
      luu.disabled = true; tb.className = "qcpTb"; tb.textContent = "Đang lưu...";
      goi("kc_tt_admin_cau_hinh_luu", { p_nhom: nhom, p_gia_tri: gv }).then(function (kq) {
        luu.disabled = false;
        if (!kq.thanhCong) { tb.className = "qcpTb xau"; tb.textContent = "⚠️ " + (kq.thongBao || "Không lưu được"); return; }
        adminBaoTin("Đã lưu " + tenNhom, true);
        tai();
      });
    }
    luu.addEventListener("click", function () {
      var r = thuGom();
      if (r.loi) { tb.className = "qcpTb xau"; tb.textContent = "⚠️ " + r.loi; return; }
      gui(r.gv);
    });
    ve.addEventListener("click", function () { if (window.confirm("Đưa mọi số của " + tenNhom + " về mặc định?")) gui({}); });
  }

  // ---------------- ⚙️ THƯỞNG THEO MÔN ----------------
  function veThuong() {
    var k = tao("div", "qcpKhoi");
    k.appendChild(tao("h4", "", "⚙️ Thưởng Theo môn"));
    var md = S.md.theo_mon, d = S.dang.theo_mon;
    var luoi = tao("div", "qcpKho");
    luoi.append(oSo(d.kc_toi_da_10, md.kc_toi_da_10, "💎 tối đa / 10 câu", "kc_toi_da_10"),
      oSo(d.vang_moi_cau_dung, md.vang_moi_cau_dung, "🪙 mỗi câu đúng", "vang_moi_cau_dung"),
      oSo(d.he_so_k, md.he_so_k, "Hệ số giờ k (0,3-3)", "he_so_k", "0.05"));
    k.appendChild(luoi);
    var vd = tao("p", "adminGhiChu");
    function capVd() {
      var t = Number(luoi.querySelector('[data-khoa="kc_toi_da_10"]').value) || 0;
      vd.textContent = "Bộ 10 câu: tối đa " + t + " 💎, mỗi câu sai trừ " + Math.floor(t / 10) + " 💎; bộ 20 câu: " + Math.floor(t * 2) + " 💎. "
        + "Đồng hồ cả bài tính theo độ dài câu + độ khó + lớp của bé (module giờ chung, ⚙️ Cấu hình › Giờ bài); k > 1 cho thêm giờ, k < 1 bớt giờ. "
        + "Xong trước mốc t₀ được trọn, sau đó trừ dần, hết giờ = 0 💎 (xu vàng câu đúng vẫn nhận). Đã đủ trần 💎 trong ngày thì 💎 đổi sang 🪙 như mọi trò.";
    }
    luoi.addEventListener("input", capVd); capVd();
    k.appendChild(vd);
    hangLuu(k, "theo_mon", "thưởng Theo môn", function () {
      var gv = {}, loi = null;
      luoi.querySelectorAll("input[data-khoa]").forEach(function (i) {
        var v = Number(i.value);
        if (i.dataset.khoa === "he_so_k") { if (!(v >= 0.3 && v <= 3)) loi = loi || "Hệ số giờ k: từ 0,3 đến 3"; }
        else if (!Number.isInteger(v) || v < 0 || v > 1000) loi = loi || "Cần số nguyên 0 - 1000";
        gv[i.dataset.khoa] = v;
      });
      return { loi: loi, gv: gv };
    });
    return k;
  }

  // ---------------- ⚙️ LUẬT CHỌN CÂU (nhóm chung) ----------------
  function veChung() {
    var k = tao("div", "qcpKhoi");
    k.appendChild(tao("h4", "", "⚙️ Luật chọn câu (dùng chung Theo môn, Tổng hợp, Ôn sau trận)"));
    var md = S.md.chung, d = S.dang.chung;
    var luoi = tao("div", "qcpKho qtmChung");
    luoi.appendChild(oChu((d.so_cau_chon || []).join(", "), (md.so_cau_chon || []).join(", "), "Số câu bé chọn (5-50)", "so_cau_chon"));
    [["so_cau_mac_dinh", "Số câu mặc định"], ["toi_thieu_kien_thuc_mon", "Kiến thức tối thiểu để môn sáng"], ["het_han_phut", "Phút giữ lượt dở"],
      ["tranh_cau_ngay", "Ngày tránh lặp câu"], ["hoi_lai_sau", "Sai: hỏi lại sau ... câu"], ["hoi_lai_toi_da", "Hỏi lại tối đa / lượt"],
      ["moi_lan_dau", "Kiến thức mới / 10 câu (bộ đầu)"], ["ton_khong_moi", "Tồn ≥ ... thì không thêm mới"]].forEach(function (x) {
      luoi.appendChild(oSo(d[x[0]], md[x[0]], x[1], x[0]));
    });
    k.appendChild(luoi);
    k.appendChild(tao("p", "qcpTieuDe", "✨ Kiến thức mới mỗi 10 câu theo tỉ lệ đúng bộ trước (cùng môn)"));
    var tl = tao("div", "qcpKho");
    var dsTl = d.moi_theo_ty_le || [], dsMd = md.moi_theo_ty_le || [];
    dsTl.forEach(function (x, j) {
      var sau = dsTl[j + 1] ? "–" + (dsTl[j + 1][0] - 1) + " %" : "–100 %";
      var o = oSo(x[1], dsMd[j] ? dsMd[j][1] : null, "Đúng " + x[0] + sau, null);
      o.querySelector("input").dataset.tyLe = String(x[0]);
      tl.appendChild(o);
    });
    k.appendChild(tl);
    k.appendChild(tao("p", "adminGhiChu", "Máy chủ chọn cho mỗi bộ: kiến thức mới (tối đa theo bảng trên) → kiến thức tới hạn ôn → ôn ngẫu nhiên → thiếu thì thêm mới. Môn có ít kiến thức hơn số tối thiểu thì bé thấy \"Sắp có\". Đổi ở đây có hiệu lực cả Ôn sau trận Đấu Trường."));
    hangLuu(k, "chung", "luật chọn câu", function () {
      var gv = JSON.parse(JSON.stringify(S.dang.chung)), loi = null;
      luoi.querySelectorAll("input[data-khoa]").forEach(function (i) { var v = Number(i.value); if (!Number.isInteger(v) || v < 0) loi = loi || "Cần số nguyên ≥ 0"; gv[i.dataset.khoa] = v; });
      var sc = luoi.querySelector('[data-khoa-chu="so_cau_chon"]').value.split(/[,;\s]+/).filter(Boolean).map(Number);
      if (!sc.length || sc.some(function (n) { return !Number.isInteger(n) || n < 5 || n > 50; })) loi = loi || "Số câu bé chọn: các số nguyên 5-50, cách nhau dấu phẩy";
      gv.so_cau_chon = sc;
      if (sc.indexOf(gv.so_cau_mac_dinh) < 0) loi = loi || "Số câu mặc định phải là một trong các số bé chọn";
      gv.moi_theo_ty_le = [];
      tl.querySelectorAll("input[data-ty-le]").forEach(function (i) { var v = Number(i.value); if (!Number.isInteger(v) || v < 0 || v > 10) loi = loi || "Kiến thức mới: số nguyên 0-10"; gv.moi_theo_ty_le.push([Number(i.dataset.tyLe), v]); });
      return { loi: loi, gv: gv };
    });
    return k;
  }

  // ---------------- 📊 THỐNG KÊ ----------------
  function veThongKe(tk) {
    var k = tao("div", "qcpKhoi");
    k.appendChild(tao("h4", "", "📊 Thống kê 7 ngày"));
    if (!tk || !tk.thanhCong) { k.appendChild(tao("p", "qcpLoi", "⚠️ " + ((tk && tk.thongBao) || "Không tải được"))); return k; }
    var ds = tk.theoNgay || [];
    if (!ds.length) k.appendChild(tao("p", "adminGhiChu", "Chưa có lượt Theo môn nào trong 7 ngày."));
    else k.appendChild(bang(["Ngày", "Lượt xong", "Bé", "Đúng TB", "💎", "🪙", "Bỏ dở"], ds.map(function (d) {
      return [new Date(d.ngay + "T00:00:00").toLocaleDateString("vi-VN"), d.soLuot, d.soBe, d.tyLe != null ? d.tyLe + " %" : "-", so(d.kc), so(d.vang), d.bo];
    })));
    if ((tk.theoMon || []).length) {
      k.appendChild(tao("p", "qcpTieuDe", "📚 Mỗi môn"));
      k.appendChild(bang(["Môn", "Lượt", "Đúng TB", "💎"], tk.theoMon.map(function (m) { return [(m.bieuTuong || "") + " " + (m.ten || m.mon), m.soLuot, (m.tyLe != null ? m.tyLe : "-") + " %", so(m.kc)]; })));
    }
    var sc = tk.soCau || {}, ks = Object.keys(sc);
    if (ks.length) k.appendChild(tao("p", "adminGhiChu", "Bé chọn số câu: " + ks.map(function (n) { return n + " câu × " + sc[n]; }).join(" · ")));
    k.appendChild(tao("p", "qcpTieuDe", "🗂️ Kiến thức có câu hỏi mỗi môn (cả kho; cần ≥ " + ((tk.dangDung && tk.dangDung.chung && tk.dangDung.chung.toi_thieu_kien_thuc_mon) || 20) + " để môn sáng)"));
    k.appendChild(bang(["Môn", "Kiến thức", "Lớp", "Bé thấy"], (tk.mon || []).slice().sort(function (a, b) { return b.soKienThuc - a.soKienThuc; }).map(function (m) {
      return [(m.bieuTuong || "") + " " + m.ten, so(m.soKienThuc), m.lopTu ? (m.lopTu === m.lopDen ? m.lopTu : m.lopTu + "-" + m.lopDen) : "-", m.sang ? "✅ chơi được" : "Sắp có"];
    })));
    var lm = tao("button", "adminNut adminNutPhu", "🔄 Làm mới"); lm.type = "button"; lm.addEventListener("click", tai);
    k.appendChild(lm);
    return k;
  }
  function bang(dau, hang) {
    var cuon = tao("div", "adminCuonNgang"), b = tao("table", "adminBang");
    var th = tao("thead"), tr0 = tao("tr"); dau.forEach(function (x) { tr0.appendChild(tao("th", "", x)); }); th.appendChild(tr0); b.appendChild(th);
    var tb = tao("tbody");
    hang.forEach(function (h) { var tr = tao("tr"); h.forEach(function (x) { tr.appendChild(tao("td", "", String(x))); }); tb.appendChild(tr); });
    b.appendChild(tb); cuon.appendChild(b); return cuon;
  }

  // ---------------- 🎯 XEM THỬ BỘ CÂU ----------------
  function veXemThu() {
    var k = tao("div", "qcpKhoi");
    k.appendChild(tao("h4", "", "🎯 Xem thử bộ câu"));
    k.appendChild(tao("p", "adminGhiChu", "Máy chủ chọn thử một bộ đúng như khi bé bấm Bắt đầu (theo Sổ Ghi Nhớ + trình độ của bé). Chỉ xem, không ghi gì, không tốn lượt của bé."));
    var h = tao("div", "adminHang qtmXtHang");
    var iBe = tao("input", "adminO"); iBe.type = "text"; iBe.placeholder = "Tên bé (vd thu)"; iBe.value = "thu"; iBe.setAttribute("aria-label", "Tên bé");
    var sMon = tao("select", "adminO"); sMon.setAttribute("aria-label", "Môn");
    S.mon.filter(function (m) { return m.soKienThuc > 0; }).forEach(function (m) { var o = tao("option", "", (m.bieuTuong || "") + " " + m.ten + (m.sang ? "" : " (Sắp có)")); o.value = m.ma; sMon.appendChild(o); });
    var iSo = tao("input", "adminO"); iSo.type = "number"; iSo.min = "1"; iSo.max = "50"; iSo.value = String((S.dang.chung && S.dang.chung.so_cau_mac_dinh) || 10); iSo.style.width = "80px"; iSo.setAttribute("aria-label", "Số câu");
    var nut = tao("button", "adminNut adminNutThanhCong", "🎯 Chọn thử"); nut.type = "button";
    h.append(iBe, sMon, iSo, nut); k.appendChild(h);
    var ra = tao("div", "qtmXt"); k.appendChild(ra);
    nut.addEventListener("click", function () {
      nut.disabled = true; ra.innerHTML = '<p class="adminDangTai">Đang chọn...</p>';
      goi("kc_tm_admin_xem_thu", { p_be: iBe.value.trim(), p_mon: sMon.value, p_so_cau: Number(iSo.value) || 10 }).then(function (kq) {
        nut.disabled = false; ra.innerHTML = "";
        if (!kq.thanhCong) { ra.appendChild(tao("p", "qcpLoi", "⚠️ " + (kq.thongBao || "Không chọn được"))); return; }
        var m = kq.monTk || {};
        ra.appendChild(tao("p", "adminGhiChu", "Bé " + kq.be + (kq.lop != null ? " (lớp " + kq.lop + ")" : "") + ": môn có " + so(m.soKienThuc) + " kiến thức, đã gặp " + so(m.daGap)
          + ", đã thuộc " + so(m.daThuoc) + ", tới hạn hôm nay " + so(m.toiHan) + ". Bộ này được tối đa " + kq.soMoiToiDa + " kiến thức mới (theo tỉ lệ đúng bộ trước)."));
        if (!(kq.cau || []).length) { ra.appendChild(tao("p", "qcpLoi", "Không chọn được câu nào cho bé ở môn này.")); return; }
        ra.appendChild(bang(["#", "Loại", "Kiến thức", "Hộp", "Mức", "Câu hỏi", "Đáp án"], kq.cau.map(function (c, i) {
          return [i + 1, TEN_NHOM[c.nhom] || c.nhom, c.ktTen || "", c.hop != null ? c.hop : "-", ({ de: "Dễ", vua: "Vừa", kho: "Khó" })[c.muc] || c.muc, c.noiDung, c.dapAnDung != null ? (typeof c.dapAnDung === "string" ? c.dapAnDung : JSON.stringify(c.dapAnDung)) : ""];
        })));
      });
    });
    return k;
  }

  // ---------------- 🔊 ÂM THANH ----------------
  function veAmThanh() {
    var k = tao("div", "qcpKhoi");
    k.appendChild(tao("h4", "", "🔊 Âm thanh Theo môn"));
    k.appendChild(tao("p", "adminGhiChu", "Theo môn dùng âm thanh chung của cả app: tiếng đúng / sai, rương thưởng, kim cương bay, kèn làm giỏi, lời khen + động viên đọc thành tiếng (bé nhỏ), giọng đọc câu nghe. Chỉnh ở 🎵 Âm thanh chung: đổi ở đó thì Theo môn, Ôn sau trận và mọi màn hỏi cùng đổi."));
    var n = tao("button", "adminNut adminNutPhu", "🎵 Mở Âm thanh chung"); n.type = "button";
    n.addEventListener("click", function () { var b = document.querySelector('.adminNutManHinh[data-manhinh="khotieng"]'); if (b) b.click(); });
    k.appendChild(n);
    return k;
  }
})();
// 24/11/2026 - BƯỚC: KC_03C4 (tạo mới)
