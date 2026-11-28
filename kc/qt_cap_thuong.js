// ================================================================
// FILE: kc/qt_cap_thuong.js
// CHỨC NĂNG: Quản trị chung › 🎁 CẤP THƯỞNG CHO BÉ (KC_11D): chức năng RIÊNG, dùng chung (người dùng 27/11/2026: "Việc quản trị
//   cấp thưởng cho bé là chức năng riêng. Dùng chức năng này để bù cho bé khi cần").
//   - Chọn bé, số 💎 / 🪙, lý do (bắt buộc), lời nhắn -> bé nhận ở 📬 Hòm thư (Trang chủ có thẻ Cần con xem). Cộng thẳng, không ăn vào trần ngày
//     bé tự kiếm. Mỗi lần mở form có một mã riêng: bấm 2 lần / mạng gửi lại không cấp 2 lần.
//   - Gắn kháng nghị (từ 📮 Bé kháng nghị, qt_khang_nghi.js): QT_CAP_THUONG.moGan(kn) điền sẵn bé + số bù đề xuất + lời nhắn mẫu;
//     cấp xong = CHẤP NHẬN kháng nghị đó (mỗi kháng nghị bù một lần) rồi quay về 📮.
//   - ⚙️ Trần mỗi lần (sửa được, ô khác mặc định viền cam). 📜 50 lần cấp gần nhất (bé đã nhận chưa).
// RPC: kc_ct_admin_doc, kc_ct_admin_luu, kc_ct_admin_cap (SQL repo_rieng supabase_kc11d_phan_hoi.sql).
// PHỤ THUỘC: ../admin_NC.js (adminGoiRpc, adminBaoTin), khung adminManHinh trong quantri_NC.html.
// ĐIỆN THOẠI: form 1 cột. MÁY TÍNH: form + trần 2 cột, lịch sử dạng bảng.
// BƯỚC: KC_11D - NGÀY: 27/11/2026
// ================================================================
(function () {
  "use strict";
  if (typeof adminGoiRpc !== "function") return;
  var MAN = "capthuong";
  var S = { gan: null, ma: null };

  var CSS = [
    ".qctHai { display: grid; gap: 14px; } @media (min-width: 900px) { .qctHai { grid-template-columns: 1fr 1fr; align-items: start; } }",
    ".qctForm label { display: block; font-weight: 600; margin: 10px 0 4px; }",
    ".qctForm input, .qctForm select, .qctForm textarea { width: 100%; box-sizing: border-box; padding: 9px 10px; border: 2px solid #d9d2ef; border-radius: 10px; font: inherit; }",
    ".qctForm textarea { min-height: 64px; resize: vertical; }",
    ".qctSo { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }",
    ".qctGoiY { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; } .qctGoiY button { padding: 5px 10px; border-radius: 999px; border: 1px solid #d9d2ef; background: #f7f4ff; cursor: pointer; font: inherit; font-size: .85rem; }",
    ".qctGan { background: #fff4d6; border: 2px solid #ffcf6b; border-radius: 12px; padding: 10px 12px; margin-bottom: 8px; } .qctGan b { color: #8a5300; }",
    ".qctXem { background: #f7f4ff; border: 2px dashed #cfc3f5; border-radius: 12px; padding: 10px 12px; margin-top: 12px; font-size: .95rem; }",
    ".qctNutHang { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; } .qctNutHang .adminNut { min-height: 44px; }",
    ".qctLoi { color: #b23b00; font-weight: 600; margin-top: 8px; }",
    ".qctKhac { border-color: #ff9f1a !important; }",
    ".qctPhu { color: #6f6890; font-size: .88rem; margin: 4px 0; }"
  ].join("\n");
  function chenKieu() { if (document.getElementById("qctKieu")) return; var s = document.createElement("style"); s.id = "qctKieu"; s.textContent = CSS; document.head.appendChild(s); }
  function tao(the, lop, chu) { var e = document.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; }
  function ngayGio(iso) { var d = new Date(iso); if (isNaN(d)) return ""; var h = function (n) { return ("0" + n).slice(-2); }; return h(d.getDate()) + "/" + h(d.getMonth() + 1) + " " + h(d.getHours()) + ":" + h(d.getMinutes()); }
  function soVN(n) { return (Number(n) || 0).toLocaleString("vi-VN"); }
  function maMoi() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(b); else for (var i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
    return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
  }
  function goi(ham, ts) {
    return adminGoiRpc(ham, ts || {}).then(function (kq) {
      if (kq && kq.thanhCong === false && /function|does not exist|schema cache/i.test(kq.thongBao || "")) kq.thongBao = "Máy chủ chưa có hàm " + ham + " (cần chạy SQL KC_11D)";
      return kq || { thanhCong: false, thongBao: "Máy chủ không trả lời" };
    }, function () { return { thanhCong: false, thongBao: "Mất mạng" }; });
  }
  function moMan(ten) { var b = document.querySelector('[data-manhinh="' + ten + '"]'); if (b) b.click(); }

  document.addEventListener("adminDaChuyenManHinh", function (e) { if (e.detail && e.detail.ten === MAN) tai(); });

  // Gọi từ 📮 Bé kháng nghị: kn = { id, be, ten (việc), kc, vang, loiNhan (mẫu), quayVe (màn) }
  window.QT_CAP_THUONG = { moGan: function (kn) { S.gan = kn; S.ma = maMoi(); moMan(MAN); } };

  function tai() {
    chenKieu();
    var g = document.getElementById("qctGoc");
    g.innerHTML = '<p class="adminDangTai">Đang tải...</p>';
    goi("kc_ct_admin_doc").then(function (r) {
      g.innerHTML = "";
      if (!r.thanhCong) { g.appendChild(tao("p", "qctLoi", "⚠️ " + (r.thongBao || "Không tải được"))); return; }
      if (!S.ma) S.ma = maMoi();
      var hai = tao("div", "qctHai");
      hai.appendChild(veForm(r)); hai.appendChild(veTran(r));
      g.appendChild(hai);
      g.appendChild(veLichSu(r.lichSu || []));
    });
  }

  function veForm(r) {
    var k = tao("div", "adminKhoi qctForm");
    k.appendChild(tao("h3", "", "🎁 Cấp thưởng"));
    var gan = S.gan;
    if (gan) {
      var gd = tao("div", "qctGan");
      gd.append("📮 Đang ", tao("b", "", "chấp nhận kháng nghị"), " của ", tao("b", "", gan.be), ": " + (gan.ten || "") + ". Bù đề xuất: ",
        tao("b", "", soVN(gan.kc) + " 💎 + " + soVN(gan.vang) + " 🪙"), ".");
      var bo = tao("button", "adminNut adminNutPhu", "Bỏ gắn kháng nghị"); bo.type = "button"; bo.style.marginTop = "8px";
      bo.addEventListener("click", function () { S.gan = null; S.ma = maMoi(); tai(); });
      gd.appendChild(tao("br")); gd.appendChild(bo);
      k.appendChild(gd);
    }
    k.appendChild(tao("label", "", "Bé nhận thưởng"));
    var chon = tao("select");
    chon.appendChild(new Option("— Chọn tài khoản —", ""));
    (r.taiKhoan || []).forEach(function (t) {
      chon.appendChild(new Option(t.ten + (t.vaiTro && t.vaiTro !== "tre" ? " (" + t.vaiTro + ")" : "") + " · 💎 " + soVN(t.diemSo) + " · 🪙 " + soVN(t.viVang), t.ten));
    });
    if (gan) { chon.value = gan.be; chon.disabled = true; }
    k.appendChild(chon);
    var so = tao("div", "qctSo"), c1 = tao("div"), c2 = tao("div");
    c1.appendChild(tao("label", "", "💎 Kim cương (tối đa " + soVN(r.cauHinh.kcToiDa) + ")"));
    var oKc = tao("input"); oKc.type = "number"; oKc.min = "0"; oKc.max = String(r.cauHinh.kcToiDa); oKc.step = "1"; oKc.value = gan ? (gan.kc || 0) : "0"; c1.appendChild(oKc);
    c2.appendChild(tao("label", "", "🪙 Xu vàng (tối đa " + soVN(r.cauHinh.vangToiDa) + ")"));
    var oVang = tao("input"); oVang.type = "number"; oVang.min = "0"; oVang.max = String(r.cauHinh.vangToiDa); oVang.step = "1"; oVang.value = gan ? (gan.vang || 0) : "0"; c2.appendChild(oVang);
    so.append(c1, c2); k.appendChild(so);
    k.appendChild(tao("label", "", "Lý do (bắt buộc; ghi ở lịch sử, bé thấy dòng \"Vì: …\" khi cấp thường)"));
    var oLy = tao("input"); oLy.maxLength = 200; oLy.value = gan ? "Chấp nhận kháng nghị: " + (gan.ten || "") : "";
    k.appendChild(oLy);
    if (!gan) {
      var gy = tao("div", "qctGoiY");
      ["Bù thưởng bị thiếu", "Thưởng chăm học", "Sửa lỗi của app", "Hoàn thành việc nhà"].forEach(function (x) {
        var b = tao("button", "", x); b.type = "button"; b.addEventListener("click", function () { oLy.value = x; xem(); }); gy.appendChild(b);
      });
      k.appendChild(gy);
    }
    k.appendChild(tao("label", "", "Lời nhắn cho bé (tuỳ chọn, hiện ở thẻ 📬)"));
    var oLn = tao("textarea"); oLn.maxLength = 300; oLn.value = gan ? gan.loiNhan || "" : "";
    k.appendChild(oLn);
    var xemTruoc = tao("div", "qctXem"); k.appendChild(xemTruoc);
    var loi = tao("p", "qctLoi"); loi.hidden = true; k.appendChild(loi);
    var hang = tao("div", "qctNutHang");
    var chuNut = gan ? "✅ Chấp nhận + cấp thưởng" : "🎁 Cấp thưởng";
    var nut = tao("button", "adminNut adminNutThanhCong", chuNut); nut.type = "button";
    hang.appendChild(nut); k.appendChild(hang);

    function giaTri() { return { be: chon.value, kc: Math.floor(+oKc.value || 0), vang: Math.floor(+oVang.value || 0), ly: oLy.value.trim(), ln: oLn.value.trim() }; }
    function kiem(v) {
      if (!v.be) return "Chọn bé nhận thưởng";
      if (v.kc < 0 || v.vang < 0) return "Số không được âm";
      if (v.kc + v.vang <= 0) return "Nhập số 💎 hoặc 🪙";
      if (v.kc > r.cauHinh.kcToiDa) return "Mỗi lần tối đa " + soVN(r.cauHinh.kcToiDa) + " 💎 (sửa ở ⚙️ Trần mỗi lần)";
      if (v.vang > r.cauHinh.vangToiDa) return "Mỗi lần tối đa " + soVN(r.cauHinh.vangToiDa) + " 🪙";
      if (v.ly.length < 3) return "Ghi lý do (ít nhất 3 chữ)";
      return "";
    }
    function xem() {
      var v = giaTri(), s = [];
      if (v.kc > 0) s.push("+" + soVN(v.kc) + " 💎"); if (v.vang > 0) s.push("+" + soVN(v.vang) + " 🪙");
      xemTruoc.textContent = "Bé " + (v.be || "…") + " sẽ thấy ở 📬 Hòm thư: " + (gan ? "🎉 " + (gan.chuChapNhan || "Cô Cú xem lại rồi: con đúng!") + " Con được " : "🎁 Cô Cú tặng con ")
        + (s.join(" ") || "…") + (!gan && v.ly ? " · Vì: " + v.ly : "") + (v.ln ? " · “" + v.ln + "”" : "") + "  [🎁 Nhận]";
      var l = kiem(v); nut.disabled = !!l; loi.textContent = l ? "⚠️ " + l : ""; loi.hidden = !l;
    }
    [chon, oKc, oVang, oLy, oLn].forEach(function (e) { e.addEventListener("input", xem); e.addEventListener("change", xem); });
    nut.addEventListener("click", function () {
      var v = giaTri(), l = kiem(v); if (l) { xem(); return; }
      var s = []; if (v.kc > 0) s.push(soVN(v.kc) + " 💎"); if (v.vang > 0) s.push(soVN(v.vang) + " 🪙");
      if (!window.confirm("Cấp " + s.join(" + ") + " cho bé " + v.be + "?\nLý do: " + v.ly)) return;
      nut.disabled = true; nut.textContent = "Đang cấp...";
      goi("kc_ct_admin_cap", { p_be: v.be, p_kc: v.kc, p_vang: v.vang, p_ly_do: v.ly, p_loi_nhan: v.ln, p_ma: S.ma, p_khang_nghi: gan ? gan.id : null }).then(function (kq) {
        if (!kq.thanhCong) { nut.disabled = false; nut.textContent = chuNut; adminBaoTin("❌ " + (kq.thongBao || "Chưa cấp được"), false); return; }
        adminBaoTin(kq.trungLap ? "Lần cấp này đã ghi trước đó (không cấp thêm)" : "✅ Đã cấp " + s.join(" + ") + " cho " + v.be + ". Bé nhận ở 📬 Hòm thư.", true);
        var quayVe = gan && gan.quayVe;
        S.gan = null; S.ma = maMoi();
        if (quayVe) moMan(quayVe); else tai();
      });
    });
    xem();
    return k;
  }

  function veTran(r) {
    var k = tao("div", "adminKhoi qctForm");
    k.appendChild(tao("h3", "", "⚙️ Trần mỗi lần cấp"));
    k.appendChild(tao("p", "adminGhiChu", "Chặn gõ nhầm số quá lớn. Không phải trần ngày: thưởng admin cấp không tính vào trần 💎 / ngày bé tự kiếm. Ô viền cam là khác mặc định."));
    var o = {};
    [["kcToiDa", "💎 tối đa mỗi lần"], ["vangToiDa", "🪙 tối đa mỗi lần"]].forEach(function (x) {
      k.appendChild(tao("label", "", x[1] + " (mặc định " + soVN(r.macDinh[x[0]]) + ")"));
      var i = tao("input"); i.type = "number"; i.min = "1"; i.step = "1"; i.value = r.cauHinh[x[0]];
      var to = function () { i.classList.toggle("qctKhac", +i.value !== +r.macDinh[x[0]]); }; i.addEventListener("input", to); to();
      o[x[0]] = i; k.appendChild(i);
    });
    var hang = tao("div", "qctNutHang");
    var luu = tao("button", "adminNut", "💾 Lưu"); luu.type = "button";
    var md = tao("button", "adminNut adminNutPhu", "↺ Về mặc định"); md.type = "button";
    md.addEventListener("click", function () { ["kcToiDa", "vangToiDa"].forEach(function (x) { o[x].value = r.macDinh[x]; o[x].dispatchEvent(new Event("input")); }); });
    luu.addEventListener("click", function () {
      goi("kc_ct_admin_luu", { p_kc_toi_da: Math.floor(+o.kcToiDa.value), p_vang_toi_da: Math.floor(+o.vangToiDa.value) }).then(function (kq) {
        adminBaoTin(kq.thanhCong ? "✅ Đã lưu trần mỗi lần cấp" : "❌ " + (kq.thongBao || "Chưa lưu được"), !!kq.thanhCong);
        if (kq.thanhCong) tai();
      });
    });
    hang.append(luu, md); k.appendChild(hang);
    if (r.cauHinh.suaBoi) k.appendChild(tao("p", "qctPhu", "Sửa lần cuối: " + r.cauHinh.suaBoi + " · " + ngayGio(r.cauHinh.suaLuc)));
    return k;
  }

  function veLichSu(ds) {
    var k = tao("div", "adminKhoi");
    k.appendChild(tao("h3", "", "📜 50 lần cấp gần nhất"));
    if (!ds.length) { k.appendChild(tao("p", "adminGhiChu", "Chưa cấp lần nào.")); return k; }
    var cuon = tao("div", "adminCuonNgang"), b = tao("table", "adminBang");
    b.innerHTML = "<thead><tr><th>Lúc</th><th>Bé</th><th>💎</th><th>🪙</th><th>Lý do</th><th>Lời nhắn</th><th>Người cấp</th><th>Bé đã nhận</th></tr></thead>";
    var tb = tao("tbody");
    ds.forEach(function (x) {
      var tr = tao("tr");
      [ngayGio(x.luc), x.be, soVN(x.kc), soVN(x.vang), (x.khangNghi ? "📮 " : "") + x.lyDo, x.loiNhan || "", x.boi, x.daNhan ? "✅ Rồi" : "⏳ Chưa"].forEach(function (c) { tr.appendChild(tao("td", "", c)); });
      tb.appendChild(tr);
    });
    b.appendChild(tb); cuon.appendChild(b); k.appendChild(cuon);
    return k;
  }
})();
// 27/11/2026 - BƯỚC: KC_11D (Quản trị chung › 🎁 Cấp thưởng cho bé: chức năng riêng, dùng chung; chấp nhận kháng nghị + bù)
