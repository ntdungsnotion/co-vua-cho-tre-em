// ================================================================
// FILE: kc/qt_khang_nghi.js
// CHỨC NĂNG: Quản trị chung › 📮 BÉ KHÁNG NGHỊ: hộp thư CHUNG cho mọi tính năng mở kháng nghị (KC_11D, module chung; người dùng
//   27/11/2026: "Kháng nghị của bé nên là module riêng vì nhiều chức năng app dùng đến"). Đặc tả: Thiet_Ke_Khang_Nghi.md.
//   - Lọc theo trạng thái (Chờ xử lý / Chưa phản hồi / Đã xử lý / Quá hạn / Tất cả) và nguồn (🦉 Chọn vội, ...). Số chờ xử lý trên tên mục.
//   - Mỗi kháng nghị: bé, việc, lời bé tự viết, hạn, bù đề xuất; phần CHI TIẾT do tính năng vẽ (CHI_TIET[nguon]; chưa có thì bảng khoá / giá trị).
//   - Có bù đề xuất (💎 / 🪙): ✅ Chấp nhận = mở 🎁 Cấp thưởng cho bé (qt_cap_thuong.js) điền sẵn; không có: ✅ Chấp nhận + lời nhắn.
//     ↩️ Giữ nguyên + lời nhắn (mẫu của tính năng, rồi mẫu chung). Kết quả về 📬 Hòm thư của bé.
//   - ⚙️ Cài đặt chung: bật / tắt, hạn (ngày), số chữ tối thiểu / tối đa, lời nhắn mẫu.
// RPC: kc_kn_admin_ds, kc_kn_admin_xu_ly, kc_kn_admin_luu_cau_hinh (SQL repo_rieng supabase_kc11d_phan_hoi.sql).
// PHỤ THUỘC: ../admin_NC.js (adminGoiRpc, adminBaoTin), qt_cap_thuong.js (QT_CAP_THUONG.moGan), khung adminManHinh trong quantri_NC.html.
// ĐIỆN THOẠI: thẻ xếp dọc, bảng chi tiết cuộn ngang. MÁY TÍNH: như cũ, rộng hơn.
// BƯỚC: KC_11D - NGÀY: 27/11/2026
// ================================================================
(function () {
  "use strict";
  if (typeof adminGoiRpc !== "function") return;
  var MAN = "khangnghi";
  var S = { loc: "cho", nguon: "", daDem: false };

  var CSS = [
    ".qknLoc { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 10px; } .qknLoc button { padding: 7px 12px; border-radius: 999px; border: 2px solid #d9d2ef; background: #fff; cursor: pointer; font: inherit; min-height: 40px; }",
    ".qknLoc button.dang { background: #7b5cf0; border-color: #7b5cf0; color: #fff; }",
    ".qknLoc select { padding: 7px 10px; border-radius: 10px; border: 2px solid #d9d2ef; font: inherit; }",
    ".qknThe { border: 2px solid #e6e0f5; border-radius: 14px; padding: 12px; margin-bottom: 10px; background: #fff; }",
    ".qknThe.be_gui { border-color: #ffb800; box-shadow: 0 0 0 3px #fff0c2; }",
    ".qknDau { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: baseline; } .qknDau b { font-size: 1.05rem; }",
    ".qknTt { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: .8rem; font-weight: 700; background: #eee; }",
    ".qknTt.be_gui { background: #ffe7a3; } .qknTt.cho_be { background: #e4f0ff; } .qknTt.chap_nhan { background: #d8f5e1; } .qknTt.giu_nguyen { background: #f0e6ff; } .qknTt.het_han { background: #f1f1f1; }",
    ".qknLoiBe { margin: 8px 0; padding: 8px 10px; background: #fffaf0; border-left: 4px solid #ffb800; border-radius: 8px; font-style: italic; }",
    ".qknPhu { color: #6f6890; font-size: .88rem; margin: 4px 0; }",
    ".qknNutHang { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; } .qknNutHang .adminNut { min-height: 44px; }",
    ".qknBang { border-collapse: collapse; font-size: .85rem; min-width: 640px; width: 100%; } .qknBang th, .qknBang td { border-bottom: 1px solid #eee; padding: 5px 6px; text-align: left; vertical-align: top; }",
    ".qknBang td.dh { color: #b23b00; font-weight: 700; } .qknBang tr.sai td:first-child { color: #b23b00; }",
    ".qknXuLy { margin-top: 8px; } .qknXuLy textarea, .qknCh textarea { width: 100%; box-sizing: border-box; min-height: 56px; padding: 8px; border: 2px solid #d9d2ef; border-radius: 10px; font: inherit; }",
    ".qknCh label { display: block; font-weight: 600; margin: 10px 0 4px; } .qknCh input[type=number] { width: 120px; padding: 8px; border: 2px solid #d9d2ef; border-radius: 10px; font: inherit; }",
    ".qknKhac { border-color: #ff9f1a !important; }"
  ].join("\n");
  function chenKieu() { if (document.getElementById("qknKieu")) return; var s = document.createElement("style"); s.id = "qknKieu"; s.textContent = CSS; document.head.appendChild(s); }
  function tao(the, lop, chu) { var e = document.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; }
  function ngayGio(iso) { var d = new Date(iso); if (isNaN(d)) return ""; var h = function (n) { return ("0" + n).slice(-2); }; return h(d.getDate()) + "/" + h(d.getMonth() + 1) + " " + h(d.getHours()) + ":" + h(d.getMinutes()); }
  function soVN(n) { return (Number(n) || 0).toLocaleString("vi-VN"); }
  function goi(ham, ts) {
    return adminGoiRpc(ham, ts || {}).then(function (kq) {
      if (kq && kq.thanhCong === false && /function|does not exist|schema cache/i.test(kq.thongBao || "")) kq.thongBao = "Máy chủ chưa có hàm " + ham + " (cần chạy SQL KC_11D)";
      return kq || { thanhCong: false, thongBao: "Máy chủ không trả lời" };
    }, function () { return { thanhCong: false, thongBao: "Mất mạng" }; });
  }
  var TEN_TT = { be_gui: "💌 Bé đã gửi, chờ xử lý", cho_be: "⏳ Bé chưa phản hồi", chap_nhan: "✅ Đã chấp nhận", giu_nguyen: "↩️ Giữ nguyên", het_han: "⌛ Quá hạn" };
  var LOC = [["cho", "💌 Chờ xử lý", "cho"], ["chua", "⏳ Chưa phản hồi", "chua"], ["da", "✅ Đã xử lý", "da"], ["het", "⌛ Quá hạn", "het"], ["tat_ca", "Tất cả", "tatCa"]];

  // ---------------- Chi tiết theo nguồn (tính năng mới thêm cách vẽ ở đây; chưa có thì bảng khoá / giá trị) ----------------
  var CHI_TIET = {
    // 🦉 Chọn vội (chống bấm bừa): kết luận + bảng từng câu
    bb: function (ct) {
      var g = tao("div"), kl = ct.ketLuan || {};
      g.appendChild(tao("p", "qknPhu", "Câu có dấu hiệu: " + (kl.soDauHieu != null ? kl.soDauHieu : "?") + " / " + (kl.soCauTinh != null ? kl.soCauTinh : "?")
        + " (bấm dồn D1 " + (kl.d1 || 0) + " · chạm tức thì D2 " + (kl.d2 || 0) + " · nhanh như đoán D3 " + (kl.d3 || 0) + ")"
        + (kl.oNhieuNhat != null && kl.tyLeO ? " · chọn ô " + (kl.oNhieuNhat + 1) + " ở " + Math.round(kl.tyLeO * 100) + " % câu" : "")));
      var cuon = tao("div", "adminCuonNgang"), b = tao("table", "qknBang");
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
  function chiTietMacDinh(ct) {
    var cuon = tao("div", "adminCuonNgang"), b = tao("table", "qknBang"), tb = tao("tbody");
    Object.keys(ct || {}).forEach(function (k) {
      var v = ct[k], tr = tao("tr");
      tr.append(tao("td", "", k), tao("td", "", typeof v === "object" ? JSON.stringify(v) : String(v)));
      tb.appendChild(tr);
    });
    b.appendChild(tb); cuon.appendChild(b);
    return cuon;
  }

  document.addEventListener("adminDaChuyenManHinh", function (e) {
    var ten = e.detail && e.detail.ten;
    if (ten === MAN) tai();
    else if (!S.daDem) demCho();
  });
  function demCho() {
    S.daDem = true;
    goi("kc_kn_admin_ds", { p_loc: "cho", p_so: 1 }).then(function (r) { if (r.thanhCong) ghiSoMuc(r.dem); });
  }
  function ghiSoMuc(dem) {
    var b = document.querySelector('[data-manhinh="' + MAN + '"]'); if (!b) return;
    var n = dem && dem.cho || 0;
    b.textContent = "📮 Bé kháng nghị" + (n ? " (" + n + ")" : "");
  }

  function tai() {
    chenKieu();
    var g = document.getElementById("qknGoc");
    g.innerHTML = '<p class="adminDangTai">Đang tải...</p>';
    goi("kc_kn_admin_ds", { p_loc: S.loc, p_nguon: S.nguon || null, p_so: 100 }).then(function (r) {
      g.innerHTML = "";
      if (!r.thanhCong) { g.appendChild(tao("p", "adminGhiChu", "⚠️ " + (r.thongBao || "Không tải được"))); return; }
      if (!S.nguon) ghiSoMuc(r.dem);
      var loc = tao("div", "qknLoc");
      LOC.forEach(function (x) {
        var b = tao("button", S.loc === x[0] ? "dang" : "", x[1] + " (" + soVN((r.dem || {})[x[2]]) + ")"); b.type = "button";
        b.addEventListener("click", function () { S.loc = x[0]; tai(); });
        loc.appendChild(b);
      });
      var sel = tao("select"); sel.setAttribute("aria-label", "Nguồn");
      sel.appendChild(new Option("Mọi nguồn", ""));
      (r.nguon || []).forEach(function (n) { sel.appendChild(new Option((n.ten || n.ma) + " (" + soVN(n.so) + ")", n.ma)); });
      sel.value = S.nguon; sel.addEventListener("change", function () { S.nguon = sel.value; tai(); });
      loc.appendChild(sel);
      g.appendChild(loc);
      if (!r.ds.length) g.appendChild(tao("p", "adminGhiChu", "Không có kháng nghị nào ở mục này."));
      r.ds.forEach(function (k) { g.appendChild(veThe(k, r)); });
      g.appendChild(veCaiDat(r));
    });
  }

  function veThe(k, r) {
    var d = k.duLieu || {}, dx = k.deXuat || {}, coBu = (+dx.kc > 0 || +dx.vang > 0);
    var the = tao("div", "qknThe " + k.trangThai);
    var dau = tao("div", "qknDau");
    dau.append(tao("b", "", "👦 " + k.be), tao("span", "", (d.bieuTuong ? d.bieuTuong + " " : "") + (d.ten || k.thamChieu)),
      tao("span", "qknTt " + k.trangThai, TEN_TT[k.trangThai] || k.trangThai), tao("span", "qknPhu", d.nguonTen || k.nguon));
    the.appendChild(dau);
    if (d.chuMo) the.appendChild(tao("p", "qknPhu", "Bé đã thấy: “" + d.chuMo + "”"));
    the.appendChild(tao("p", "qknPhu", "Mở " + ngayGio(k.luc) + " · hạn gửi " + ngayGio(k.han) + (coBu ? " · bù đề xuất: " + soVN(dx.kc) + " 💎 + " + soVN(dx.vang) + " 🪙" : "")));
    if (k.loiBe) { the.appendChild(tao("p", "qknLoiBe", "“" + k.loiBe + "”")); the.appendChild(tao("p", "qknPhu", "Bé gửi lúc " + ngayGio(k.beGuiLuc))); }
    if (k.capThuong) the.appendChild(tao("p", "qknPhu", "✅ Đã bù " + soVN(k.capThuong.kc) + " 💎 + " + soVN(k.capThuong.vang) + " 🪙 · " + k.capThuong.boi + " · " + ngayGio(k.capThuong.luc)));
    else if (k.xuLyBoi) the.appendChild(tao("p", "qknPhu", "Xử lý: " + k.xuLyBoi + " · " + ngayGio(k.xuLyLuc)));
    if (k.loiNhan) the.appendChild(tao("p", "qknPhu", "Lời nhắn cho bé: “" + k.loiNhan + "”"));

    var hang = tao("div", "qknNutHang");
    var xem = tao("button", "adminNut adminNutPhu", "🔎 Xem chi tiết"); xem.type = "button";
    var ct = (CHI_TIET[k.nguon] || chiTietMacDinh)(k.chiTiet || {}); ct.hidden = true;
    xem.addEventListener("click", function () { ct.hidden = !ct.hidden; });
    hang.appendChild(xem);
    var mo = ["cho_be", "be_gui", "het_han"].indexOf(k.trangThai) >= 0;
    var nhanDuoc = !k.capThuong && (mo || (coBu && k.trangThai === "giu_nguyen"));
    var khung = tao("div", "qknXuLy"); khung.hidden = true;
    var nhan = tao("label", "", ""), ta = tao("textarea"); ta.maxLength = 300;
    var ok = tao("button", "adminNut", ""); ok.type = "button"; ok.style.marginTop = "6px";
    khung.append(nhan, ta, ok);
    var viec = "";
    function moKhung(v) {
      viec = v; khung.hidden = false;
      nhan.textContent = "Lời nhắn cho bé (hiện ở thẻ " + (v === "chap_nhan" ? "🎉" : "🦉") + " trong 📬 Hòm thư)";
      ta.value = v === "chap_nhan" ? (d.mauChapNhan || r.cauHinh.mau_chap_nhan || "") : (d.mauGiuNguyen || r.cauHinh.mau_giu_nguyen || "");
      ok.textContent = v === "chap_nhan" ? "✅ Xác nhận chấp nhận" : "↩️ Xác nhận giữ nguyên";
    }
    if (nhanDuoc) {
      var cn = tao("button", "adminNut adminNutThanhCong", coBu ? "✅ Chấp nhận + bù thưởng" : "✅ Chấp nhận"); cn.type = "button";
      cn.addEventListener("click", function () {
        if (coBu && window.QT_CAP_THUONG) {
          window.QT_CAP_THUONG.moGan({ id: k.id, be: k.be, ten: d.ten || k.thamChieu, kc: +dx.kc || 0, vang: +dx.vang || 0,
                                        loiNhan: d.mauChapNhan || r.cauHinh.mau_chap_nhan || "", chuChapNhan: d.chuChapNhan, quayVe: MAN });
        } else moKhung("chap_nhan");
      });
      hang.appendChild(cn);
    }
    if (mo) {
      var giu = tao("button", "adminNut adminNutPhu", "↩️ Giữ nguyên"); giu.type = "button";
      giu.addEventListener("click", function () { moKhung("giu_nguyen"); });
      hang.appendChild(giu);
    }
    ok.addEventListener("click", function () {
      ok.disabled = true;
      goi("kc_kn_admin_xu_ly", { p_id: k.id, p_ket_qua: viec, p_loi_nhan: ta.value.trim() }).then(function (kq) {
        ok.disabled = false;
        adminBaoTin(kq.thanhCong ? (viec === "chap_nhan" ? "✅ Đã chấp nhận" : "↩️ Đã giữ nguyên") + ", bé nhận lời nhắn ở 📬 Hòm thư" : "❌ " + (kq.thongBao || "Chưa lưu được"), !!kq.thanhCong);
        if (kq.thanhCong) { S.daDem = false; tai(); }
      });
    });
    the.append(hang, khung, ct);
    return the;
  }

  function veCaiDat(r) {
    var k = tao("details", "adminKhoi qknCh");
    k.appendChild(tao("summary", "", "⚙️ Cài đặt kháng nghị (chung mọi tính năng)"));
    var c = r.cauHinh || {}, md = r.macDinh || {}, o = {};
    var bat = tao("input"); bat.type = "checkbox"; bat.checked = !!c.bat;
    var lb = tao("label", ""); lb.append(bat, " Cho bé gửi kháng nghị"); k.appendChild(lb);
    [["han_ngay", "Hạn gửi (ngày, 1-30)"], ["do_dai_toi_thieu", "Số chữ tối thiểu"], ["do_dai_toi_da", "Số chữ tối đa"]].forEach(function (x) {
      k.appendChild(tao("label", "", x[1] + " · mặc định " + md[x[0]]));
      var i = tao("input"); i.type = "number"; i.step = "1"; i.value = c[x[0]];
      var to = function () { i.classList.toggle("qknKhac", +i.value !== +md[x[0]]); }; i.addEventListener("input", to); to();
      o[x[0]] = i; k.appendChild(i);
    });
    [["mau_chap_nhan", "Lời nhắn mẫu khi chấp nhận (tính năng có mẫu riêng thì dùng mẫu riêng)"], ["mau_giu_nguyen", "Lời nhắn mẫu khi giữ nguyên"]].forEach(function (x) {
      k.appendChild(tao("label", "", x[1]));
      var t = tao("textarea"); t.maxLength = 300; t.value = c[x[0]] || "";
      var to = function () { t.classList.toggle("qknKhac", t.value !== md[x[0]]); }; t.addEventListener("input", to); to();
      o[x[0]] = t; k.appendChild(t);
    });
    var hang = tao("div", "qknNutHang");
    var luu = tao("button", "adminNut", "💾 Lưu"); luu.type = "button";
    var ve = tao("button", "adminNut adminNutPhu", "↺ Về mặc định"); ve.type = "button";
    ve.addEventListener("click", function () {
      bat.checked = !!md.bat;
      Object.keys(o).forEach(function (x) { o[x].value = md[x]; o[x].dispatchEvent(new Event("input")); });
    });
    luu.addEventListener("click", function () {
      var gt = { bat: bat.checked, han_ngay: Math.floor(+o.han_ngay.value), do_dai_toi_thieu: Math.floor(+o.do_dai_toi_thieu.value),
                 do_dai_toi_da: Math.floor(+o.do_dai_toi_da.value), mau_chap_nhan: o.mau_chap_nhan.value.trim(), mau_giu_nguyen: o.mau_giu_nguyen.value.trim() };
      goi("kc_kn_admin_luu_cau_hinh", { p_gia_tri: gt }).then(function (kq) {
        adminBaoTin(kq.thanhCong ? "✅ Đã lưu cài đặt kháng nghị" : "❌ " + (kq.thongBao || "Chưa lưu được"), !!kq.thanhCong);
        if (kq.thanhCong) tai();
      });
    });
    hang.append(luu, ve); k.appendChild(hang);
    return k;
  }
})();
// 27/11/2026 - BƯỚC: KC_11D (Quản trị chung › 📮 Bé kháng nghị: hộp thư chung mọi tính năng)
