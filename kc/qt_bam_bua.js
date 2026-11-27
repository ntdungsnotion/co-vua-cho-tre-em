// ================================================================
// FILE: kc/qt_bam_bua.js
// CHỨC NĂNG: Quản trị chung (KC_11D):
//   1. 🎁 CẤP THƯỞNG CHO BÉ: chức năng RIÊNG, dùng chung (người dùng 27/11/2026: "Việc quản trị cấp thưởng cho bé là chức năng
//      riêng. Dùng chức năng này để bù cho bé khi cần"). Chọn bé, số 💎 / 🪙, lý do (bắt buộc), lời nhắn -> bé nhận ở 📬 Cô Cú báo
//      (Trang chủ). Cộng thẳng, không ăn vào trần ngày bé tự kiếm. Trần mỗi lần sửa được (⚙️). Lịch sử 50 lần gần nhất (bé đã nhận chưa).
//      Mỗi lần mở form có một mã riêng: bấm 2 lần / mạng gửi lại không cấp 2 lần.
//   2. 📮 BÉ PHẢN HỒI (chống bấm bừa, Thiet_Ke_Chong_Bam_Bua.md 5.4, 10): các lượt ⛔ bị cắt thưởng, lọc Chờ xử lý / Chưa phản hồi /
//      Đã xử lý / Quá hạn / Chỉ ghi / Tất cả; lời bé viết, thưởng lẽ ra, bảng từng câu (giây, chạm thừa / dồn / sớm, D1-D3, ô, đúng / sai).
//      ✅ Trả thưởng = mở 🎁 Cấp thưởng điền sẵn bé + thưởng lẽ ra + gắn lượt (mỗi lượt bù một lần). ↩️ Giữ nguyên + lời nhắn.
//      Số lượt chờ xử lý hiện trên tên mục.
// RPC: kc_ct_admin_doc, kc_ct_admin_luu, kc_ct_admin_cap, kc_bb_admin_ds, kc_bb_admin_giu (SQL repo_rieng supabase_kc11d_phan_hoi.sql).
// PHỤ THUỘC: ../admin_NC.js (adminGoiRpc, adminBaoTin), khung adminManHinh trong quantri_NC.html.
// ĐIỆN THOẠI: form 1 cột, thẻ lượt xếp dọc, bảng câu cuộn ngang. MÁY TÍNH: form 2 cột, lịch sử dạng bảng.
// BƯỚC: KC_11D - NGÀY: 27/11/2026
// ================================================================
(function () {
  "use strict";
  if (typeof adminGoiRpc !== "function") return;
  var MAN_CT = "capthuong", MAN_PH = "bbphanhoi";
  var S = { ct: null, gan: null, ma: null, loc: "cho", ph: null };

  var CSS = [
    ".qbbHai { display: grid; gap: 14px; } @media (min-width: 900px) { .qbbHai { grid-template-columns: 1fr 1fr; align-items: start; } }",
    ".qbbForm label { display: block; font-weight: 600; margin: 10px 0 4px; }",
    ".qbbForm input, .qbbForm select, .qbbForm textarea { width: 100%; box-sizing: border-box; padding: 9px 10px; border: 2px solid #d9d2ef; border-radius: 10px; font: inherit; }",
    ".qbbForm textarea { min-height: 64px; resize: vertical; }",
    ".qbbSo { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }",
    ".qbbGoiY { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; } .qbbGoiY button { padding: 5px 10px; border-radius: 999px; border: 1px solid #d9d2ef; background: #f7f4ff; cursor: pointer; font: inherit; font-size: .85rem; }",
    ".qbbGan { background: #fff4d6; border: 2px solid #ffcf6b; border-radius: 12px; padding: 10px 12px; margin-bottom: 8px; }",
    ".qbbGan b { color: #8a5300; }",
    ".qbbXem { background: #f7f4ff; border: 2px dashed #cfc3f5; border-radius: 12px; padding: 10px 12px; margin-top: 12px; font-size: .95rem; }",
    ".qbbNutHang { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }",
    ".qbbNutHang .adminNut { min-height: 44px; }",
    ".qbbLoi { color: #b23b00; font-weight: 600; margin-top: 8px; }",
    ".qbbKhac { border-color: #ff9f1a !important; }",
    ".qbbLoc { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 12px; } .qbbLoc button { padding: 7px 12px; border-radius: 999px; border: 2px solid #d9d2ef; background: #fff; cursor: pointer; font: inherit; }",
    ".qbbLoc button.dang { background: #7b5cf0; border-color: #7b5cf0; color: #fff; }",
    ".qbbThe { border: 2px solid #e6e0f5; border-radius: 14px; padding: 12px; margin-bottom: 10px; background: #fff; }",
    ".qbbThe.be_gui { border-color: #ffb800; box-shadow: 0 0 0 3px #fff0c2; }",
    ".qbbDau { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: baseline; } .qbbDau b { font-size: 1.05rem; }",
    ".qbbTt { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: .8rem; font-weight: 700; background: #eee; }",
    ".qbbTt.be_gui { background: #ffe7a3; } .qbbTt.cho_be { background: #e4f0ff; } .qbbTt.tra_thuong { background: #d8f5e1; } .qbbTt.giu_nguyen { background: #f0e6ff; } .qbbTt.het_han { background: #f1f1f1; } .qbbTt.chi_ghi { background: #f1f1f1; }",
    ".qbbLoiBe { margin: 8px 0; padding: 8px 10px; background: #fffaf0; border-left: 4px solid #ffb800; border-radius: 8px; font-style: italic; }",
    ".qbbPhu { color: #6f6890; font-size: .88rem; margin: 4px 0; }",
    ".qbbBang { border-collapse: collapse; font-size: .85rem; min-width: 640px; width: 100%; } .qbbBang th, .qbbBang td { border-bottom: 1px solid #eee; padding: 5px 6px; text-align: left; vertical-align: top; }",
    ".qbbBang td.dh { color: #b23b00; font-weight: 700; } .qbbBang tr.sai td:first-child { color: #b23b00; }",
    ".qbbGiu { margin-top: 8px; } .qbbGiu textarea { width: 100%; box-sizing: border-box; min-height: 56px; padding: 8px; border: 2px solid #d9d2ef; border-radius: 10px; font: inherit; }"
  ].join("\n");
  function chenKieu() { if (document.getElementById("qbbKieu")) return; var s = document.createElement("style"); s.id = "qbbKieu"; s.textContent = CSS; document.head.appendChild(s); }

  function tao(the, lop, chu) { var e = document.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; }
  function ngayGio(iso) { var d = new Date(iso); if (isNaN(d)) return ""; var h = function (n) { return ("0" + n).slice(-2); }; return h(d.getDate()) + "/" + h(d.getMonth() + 1) + " " + h(d.getHours()) + ":" + h(d.getMinutes()); }
  function ngay(iso) { return ngayGio(iso).slice(0, 5); }
  function soVN(n) { return (Number(n) || 0).toLocaleString("vi-VN"); }
  function maMoi() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(b) : b.forEach(function (_, i) { b[i] = Math.random() * 256; });
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
  var TEN_NOI = { theo_mon: "📚 Theo môn", tong_hop: "🌈 Tổng hợp", on_sau_tran: "⚔️ Ôn sau trận", toc_do: "⚡ Tốc độ", chinh_phuc: "🏆 Chinh phục" };
  var TEN_TT = { be_gui: "💌 Bé đã gửi, chờ xử lý", cho_be: "⏳ Bé chưa phản hồi", tra_thuong: "✅ Đã trả thưởng", giu_nguyen: "↩️ Giữ nguyên", het_han: "⌛ Quá hạn phản hồi", chi_ghi: "📝 Chỉ ghi (không cắt)" };
  function tenBai(n) { return (n.noi === "theo_mon" && n.monTen ? (n.monBieuTuong ? n.monBieuTuong + " " : "") + n.monTen : TEN_NOI[n.noi] || n.noi) + " ngày " + ngay(n.luc); }

  document.addEventListener("adminDaChuyenManHinh", function (e) {
    var ten = e.detail && e.detail.ten;
    if (ten === MAN_CT) taiCt();
    else if (ten === MAN_PH) taiPh();
    else if (!S.daDem) demCho();
  });

  // Số lượt chờ xử lý trên tên mục 📮
  function demCho() {
    S.daDem = true;
    goi("kc_bb_admin_ds", { p_loc: "cho", p_so: 1 }).then(function (r) { if (r.thanhCong) ghiSoMuc(r.dem); });
  }
  function ghiSoMuc(dem) {
    var b = document.querySelector('[data-manhinh="' + MAN_PH + '"]');
    if (!b) return;
    var n = dem && dem.cho || 0;
    b.textContent = "📮 Bé phản hồi" + (n ? " (" + n + ")" : "");
  }
  function moMan(ten) { var b = document.querySelector('[data-manhinh="' + ten + '"]'); if (b) b.click(); }

  // ================================================================ 🎁 CẤP THƯỞNG ================================================================
  function taiCt() {
    chenKieu();
    var g = document.getElementById("qbbCtGoc");
    g.innerHTML = '<p class="adminDangTai">Đang tải...</p>';
    goi("kc_ct_admin_doc").then(function (r) {
      g.innerHTML = "";
      if (!r.thanhCong) { g.appendChild(tao("p", "qbbLoi", "⚠️ " + (r.thongBao || "Không tải được"))); return; }
      S.ct = r; if (!S.ma) S.ma = maMoi();
      var hai = tao("div", "qbbHai");
      hai.appendChild(veForm(r)); hai.appendChild(veTran(r));
      g.appendChild(hai);
      g.appendChild(veLichSu(r.lichSu || []));
    });
  }

  function veForm(r) {
    var k = tao("div", "adminKhoi qbbForm");
    k.appendChild(tao("h3", "", "🎁 Cấp thưởng"));
    var gan = S.gan;
    if (gan) {
      var gd = tao("div", "qbbGan");
      gd.innerHTML = "📮 Đang <b>bù thưởng</b> lượt bị cắt của <b></b>: <span></span>. Thưởng lẽ ra: <b></b>.";
      var bs = gd.querySelectorAll("b"); bs[1].textContent = gan.be; bs[2].textContent = soVN(gan.kcLeRa) + " 💎 + " + soVN(gan.vangLeRa) + " 🪙";
      gd.querySelector("span").textContent = tenBai(gan);
      var bo = tao("button", "adminNut adminNutPhu", "Bỏ gắn lượt"); bo.type = "button"; bo.style.marginTop = "8px";
      bo.addEventListener("click", function () { S.gan = null; S.ma = maMoi(); taiCt(); });
      gd.appendChild(tao("br")); gd.appendChild(bo);
      k.appendChild(gd);
    }
    k.appendChild(tao("label", "", "Bé nhận thưởng"));
    var chon = tao("select"); chon.id = "qbbBe";
    chon.appendChild(new Option("— Chọn tài khoản —", ""));
    (r.taiKhoan || []).forEach(function (t) {
      chon.appendChild(new Option(t.ten + (t.vaiTro && t.vaiTro !== "tre" ? " (" + t.vaiTro + ")" : "") + " · 💎 " + soVN(t.diemSo) + " · 🪙 " + soVN(t.viVang), t.ten));
    });
    if (gan) { chon.value = gan.be; chon.disabled = true; }
    k.appendChild(chon);
    var so = tao("div", "qbbSo");
    var c1 = tao("div"), c2 = tao("div");
    c1.appendChild(tao("label", "", "💎 Kim cương (tối đa " + soVN(r.cauHinh.kcToiDa) + ")"));
    var oKc = tao("input"); oKc.type = "number"; oKc.min = "0"; oKc.max = String(r.cauHinh.kcToiDa); oKc.step = "1"; oKc.value = gan ? gan.kcLeRa : "0"; c1.appendChild(oKc);
    c2.appendChild(tao("label", "", "🪙 Xu vàng (tối đa " + soVN(r.cauHinh.vangToiDa) + ")"));
    var oVang = tao("input"); oVang.type = "number"; oVang.min = "0"; oVang.max = String(r.cauHinh.vangToiDa); oVang.step = "1"; oVang.value = gan ? gan.vangLeRa : "0"; c2.appendChild(oVang);
    so.append(c1, c2); k.appendChild(so);
    k.appendChild(tao("label", "", "Lý do (bắt buộc, chỉ người lớn thấy ở lịch sử; bé thấy dòng \"Vì: …\" khi cấp thường)"));
    var oLy = tao("input"); oLy.maxLength = 200;
    oLy.value = gan ? "Bù thưởng " + tenBai(gan) + " (xem lại phản hồi)" : "";
    k.appendChild(oLy);
    if (!gan) {
      var gy = tao("div", "qbbGoiY");
      ["Bù thưởng bị thiếu", "Thưởng chăm học", "Sửa lỗi của app", "Hoàn thành việc nhà"].forEach(function (x) {
        var b = tao("button", "", x); b.type = "button"; b.addEventListener("click", function () { oLy.value = x; xem(); }); gy.appendChild(b);
      });
      k.appendChild(gy);
    }
    k.appendChild(tao("label", "", "Lời nhắn cho bé (tuỳ chọn, hiện ở thẻ 📬)"));
    var oLn = tao("textarea"); oLn.maxLength = 300;
    oLn.value = gan ? (S.ph && S.ph.mau && S.ph.mau.traThuong) || "" : "";
    k.appendChild(oLn);
    var xemTruoc = tao("div", "qbbXem"); k.appendChild(xemTruoc);
    var loi = tao("p", "qbbLoi"); loi.hidden = true; k.appendChild(loi);
    var hang = tao("div", "qbbNutHang");
    var nut = tao("button", "adminNut adminNutThanhCong", gan ? "✅ Trả thưởng cho bé" : "🎁 Cấp thưởng"); nut.type = "button";
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
      xemTruoc.textContent = "Bé " + (v.be || "…") + " sẽ thấy ở Trang chủ: " + (gan ? "🎉 Thầy cô xem lại " + tenBai(gan).replace(/^\S+ /, "bài ") + " rồi: con làm thật! Con được " : "🎁 Thầy cô tặng con ")
        + (s.join(" ") || "…") + (!gan && v.ly ? " · Vì: " + v.ly : "") + (v.ln ? " · “" + v.ln + "”" : "") + "  [🎁 Nhận]";
      var l = kiem(v); nut.disabled = !!l; loi.textContent = l ? "⚠️ " + l : ""; loi.hidden = !l;
    }
    [chon, oKc, oVang, oLy, oLn].forEach(function (e) { e.addEventListener("input", xem); e.addEventListener("change", xem); });
    nut.addEventListener("click", function () {
      var v = giaTri(), l = kiem(v); if (l) { xem(); return; }
      var s = []; if (v.kc > 0) s.push(soVN(v.kc) + " 💎"); if (v.vang > 0) s.push(soVN(v.vang) + " 🪙");
      if (!window.confirm("Cấp " + s.join(" + ") + " cho bé " + v.be + "?\nLý do: " + v.ly)) return;
      nut.disabled = true; nut.textContent = "Đang cấp...";
      goi("kc_ct_admin_cap", { p_be: v.be, p_kc: v.kc, p_vang: v.vang, p_ly_do: v.ly, p_loi_nhan: v.ln, p_ma: S.ma, p_nghi_ngo: gan ? gan.id : null }).then(function (kq) {
        if (!kq.thanhCong) { nut.disabled = false; nut.textContent = gan ? "✅ Trả thưởng cho bé" : "🎁 Cấp thưởng"; adminBaoTin("❌ " + (kq.thongBao || "Chưa cấp được"), false); return; }
        adminBaoTin(kq.trungLap ? "Lần cấp này đã ghi trước đó (không cấp thêm)" : "✅ Đã cấp " + s.join(" + ") + " cho " + v.be + ". Bé nhận ở 📬 Trang chủ.", true);
        var veLai = !!gan;
        S.gan = null; S.ma = maMoi(); S.daDem = false;
        if (veLai) { S.ph = null; moMan(MAN_PH); } else taiCt();
      });
    });
    xem();
    return k;
  }

  function veTran(r) {
    var k = tao("div", "adminKhoi qbbForm");
    k.appendChild(tao("h3", "", "⚙️ Trần mỗi lần cấp"));
    k.appendChild(tao("p", "adminGhiChu", "Chặn gõ nhầm số quá lớn. Không phải trần ngày: thưởng admin cấp không tính vào trần 💎 / ngày bé tự kiếm. Ô viền cam là khác mặc định."));
    var o = {};
    [["kcToiDa", "💎 tối đa mỗi lần"], ["vangToiDa", "🪙 tối đa mỗi lần"]].forEach(function (x) {
      k.appendChild(tao("label", "", x[1] + " (mặc định " + soVN(r.macDinh[x[0]]) + ")"));
      var i = tao("input"); i.type = "number"; i.min = "1"; i.step = "1"; i.value = r.cauHinh[x[0]];
      var to = function () { i.classList.toggle("qbbKhac", +i.value !== +r.macDinh[x[0]]); }; i.addEventListener("input", to); to();
      o[x[0]] = i; k.appendChild(i);
    });
    var hang = tao("div", "qbbNutHang");
    var luu = tao("button", "adminNut", "💾 Lưu"); luu.type = "button";
    var md = tao("button", "adminNut adminNutPhu", "↺ Về mặc định"); md.type = "button";
    md.addEventListener("click", function () { o.kcToiDa.value = r.macDinh.kcToiDa; o.vangToiDa.value = r.macDinh.vangToiDa; o.kcToiDa.dispatchEvent(new Event("input")); o.vangToiDa.dispatchEvent(new Event("input")); });
    luu.addEventListener("click", function () {
      goi("kc_ct_admin_luu", { p_kc_toi_da: Math.floor(+o.kcToiDa.value), p_vang_toi_da: Math.floor(+o.vangToiDa.value) }).then(function (kq) {
        adminBaoTin(kq.thanhCong ? "✅ Đã lưu trần mỗi lần cấp" : "❌ " + (kq.thongBao || "Chưa lưu được"), !!kq.thanhCong);
        if (kq.thanhCong) taiCt();
      });
    });
    hang.append(luu, md); k.appendChild(hang);
    if (r.cauHinh.suaBoi) k.appendChild(tao("p", "qbbPhu", "Sửa lần cuối: " + r.cauHinh.suaBoi + " · " + ngayGio(r.cauHinh.suaLuc)));
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
      [ngayGio(x.luc), x.be, soVN(x.kc), soVN(x.vang), (x.nghiNgo ? "📮 " : "") + x.lyDo, x.loiNhan || "", x.boi, x.daNhan ? "✅ Rồi" : "⏳ Chưa"].forEach(function (c) { tr.appendChild(tao("td", "", c)); });
      tb.appendChild(tr);
    });
    b.appendChild(tb); cuon.appendChild(b); k.appendChild(cuon);
    return k;
  }

  // ================================================================ 📮 BÉ PHẢN HỒI ================================================================
  var LOC = [["cho", "💌 Chờ xử lý", "cho"], ["chua", "⏳ Chưa phản hồi", "chua"], ["da", "✅ Đã xử lý", "da"], ["het", "⌛ Quá hạn", "het"], ["chi_ghi", "📝 Chỉ ghi", "chiGhi"], ["tat_ca", "Tất cả", "tatCa"]];
  var TEN_CHE_DO = { day_du: "✂️ Cắt thưởng lượt bấm bừa (day_du)", chi_ghi: "📝 Chỉ ghi, chưa cắt (chi_ghi)", nhac: "💬 Chỉ nhắc (nhac)", tat: "⏸ Tắt (tat)" };

  function taiPh() {
    chenKieu();
    var g = document.getElementById("qbbPhGoc");
    g.innerHTML = '<p class="adminDangTai">Đang tải...</p>';
    goi("kc_bb_admin_ds", { p_loc: S.loc, p_so: 100 }).then(function (r) {
      g.innerHTML = "";
      if (!r.thanhCong) { g.appendChild(tao("p", "qbbLoi", "⚠️ " + (r.thongBao || "Không tải được"))); return; }
      S.ph = r; ghiSoMuc(r.dem);
      g.appendChild(tao("p", "qbbPhu", "Chế độ đang chạy (Theo môn): " + (TEN_CHE_DO[r.cheDo] || r.cheDo) + ". Chỉnh chế độ / ngưỡng ở 🧠 Chống bấm bừa (bước sau, KC_11E)."));
      var loc = tao("div", "qbbLoc");
      LOC.forEach(function (x) {
        var b = tao("button", S.loc === x[0] ? "dang" : "", x[1] + " (" + soVN((r.dem || {})[x[2]]) + ")"); b.type = "button";
        b.addEventListener("click", function () { S.loc = x[0]; taiPh(); });
        loc.appendChild(b);
      });
      g.appendChild(loc);
      if (!r.ds.length) { g.appendChild(tao("p", "adminGhiChu", "Không có lượt nào ở mục này.")); return; }
      r.ds.forEach(function (n) { g.appendChild(veLuot(n, r)); });
    });
  }

  function veLuot(n, r) {
    var the = tao("div", "qbbThe " + n.trangThai);
    var dau = tao("div", "qbbDau");
    dau.append(tao("b", "", "👦 " + n.be), tao("span", "", tenBai(n)), tao("span", "qbbTt " + n.trangThai, TEN_TT[n.trangThai] || n.trangThai));
    the.appendChild(dau);
    var kl = n.ketLuan || {};
    the.appendChild(tao("p", "qbbPhu", "Câu có dấu hiệu: " + (kl.soDauHieu != null ? kl.soDauHieu : "?") + " / " + (kl.soCauTinh != null ? kl.soCauTinh : "?")
      + " (bấm dồn D1 " + (kl.d1 || 0) + " · chạm tức thì D2 " + (kl.d2 || 0) + " · nhanh như đoán D3 " + (kl.d3 || 0) + ")"
      + (kl.oNhieuNhat != null && kl.tyLeO ? " · chọn ô " + (kl.oNhieuNhat + 1) + " ở " + Math.round(kl.tyLeO * 100) + " % câu" : "")
      + " · Thưởng lẽ ra: " + soVN(n.kcLeRa) + " 💎 + " + soVN(n.vangLeRa) + " 🪙"));
    if (n.loiBe) { var lb = tao("p", "qbbLoiBe", "“" + n.loiBe + "”"); the.appendChild(lb); the.appendChild(tao("p", "qbbPhu", "Bé gửi lúc " + ngayGio(n.beGuiLuc))); }
    if (n.capThuong) the.appendChild(tao("p", "qbbPhu", "✅ Đã bù " + soVN(n.capThuong.kc) + " 💎 + " + soVN(n.capThuong.vang) + " 🪙 · " + n.capThuong.boi + " · " + ngayGio(n.capThuong.luc)));
    else if (n.xuLyBoi) the.appendChild(tao("p", "qbbPhu", "Xử lý: " + n.xuLyBoi + " · " + ngayGio(n.xuLyLuc)));
    if (n.loiNhan) the.appendChild(tao("p", "qbbPhu", "Lời nhắn cho bé: “" + n.loiNhan + "”"));

    var hang = tao("div", "qbbNutHang");
    var xemCau = tao("button", "adminNut adminNutPhu", "🔎 Xem từng câu (" + (n.cau || []).length + ")"); xemCau.type = "button";
    var bang = veBangCau(n.cau || []); bang.hidden = true;
    xemCau.addEventListener("click", function () { bang.hidden = !bang.hidden; });
    hang.appendChild(xemCau);
    var giuDuoc = ["cho_be", "be_gui", "het_han"].indexOf(n.trangThai) >= 0, traDuoc = n.catThuong && !n.capThuong && (giuDuoc || n.trangThai === "giu_nguyen");
    if (traDuoc) {
      var tra = tao("button", "adminNut adminNutThanhCong", "✅ Trả thưởng"); tra.type = "button";
      tra.addEventListener("click", function () { S.gan = n; S.ma = maMoi(); moMan(MAN_CT); });
      hang.appendChild(tra);
    }
    var giuKhung = null;
    if (giuDuoc) {
      var giu = tao("button", "adminNut adminNutPhu", "↩️ Giữ nguyên"); giu.type = "button";
      giu.addEventListener("click", function () { if (giuKhung) giuKhung.hidden = !giuKhung.hidden; });
      hang.appendChild(giu);
      giuKhung = tao("div", "qbbGiu"); giuKhung.hidden = true;
      giuKhung.appendChild(tao("label", "", "Lời nhắn cho bé (hiện ở thẻ 🦉 Trang chủ)"));
      var ta = tao("textarea"); ta.maxLength = 300; ta.value = (r.mau && r.mau.giuNguyen) || ""; giuKhung.appendChild(ta);
      var ok = tao("button", "adminNut", "↩️ Xác nhận giữ nguyên"); ok.type = "button"; ok.style.marginTop = "6px";
      ok.addEventListener("click", function () {
        ok.disabled = true;
        goi("kc_bb_admin_giu", { p_id: n.id, p_loi_nhan: ta.value.trim() }).then(function (kq) {
          ok.disabled = false;
          adminBaoTin(kq.thanhCong ? "↩️ Đã giữ nguyên, bé nhận lời nhắn ở 📬 Trang chủ" : "❌ " + (kq.thongBao || "Chưa lưu được"), !!kq.thanhCong);
          if (kq.thanhCong) taiPh();
        });
      });
      giuKhung.appendChild(ok);
    }
    the.appendChild(hang);
    if (giuKhung) the.appendChild(giuKhung);
    the.appendChild(bang);
    return the;
  }

  function veBangCau(ds) {
    var cuon = tao("div", "adminCuonNgang"); cuon.style.marginTop = "8px";
    var b = tao("table", "qbbBang");
    b.innerHTML = "<thead><tr><th>#</th><th>Câu</th><th>Giây</th><th>Chạm thừa</th><th>Dồn</th><th>Sớm</th><th>Dấu hiệu</th><th>Ô chọn</th><th>Kết quả</th></tr></thead>";
    var tb = tao("tbody");
    ds.forEach(function (c, i) {
      var hv = c.hanhVi || {}, dh = [c.d1 ? "D1" : "", c.d2 ? "D2" : "", c.d3 ? "D3" : ""].filter(Boolean).join(" ");
      var tr = tao("tr", c.dung ? "" : "sai");
      var o = [String(i + 1) + (c.hoiLai ? " 🔁" : ""), c.noiDung || "", c.giay != null ? String(Math.round(c.giay * 10) / 10).replace(".", ",") : "",
        hv.thua != null ? hv.thua : "", hv.thuaDon != null ? hv.thuaDon : "", hv.som != null ? hv.som : "",
        dh + (hv.an ? " (ẩn trang)" : "") + (c.tinh === false ? " · không tính" : ""), c.o != null ? "ô " + (c.o + 1) + " / " + (c.soDapAn || "?") : "", c.dung ? "✓ đúng" : "✗ sai"];
      o.forEach(function (x, j) { tr.appendChild(tao("td", j === 6 && dh ? "dh" : "", String(x))); });
      tb.appendChild(tr);
    });
    b.appendChild(tb); cuon.appendChild(b);
    return cuon;
  }
})();
// 27/11/2026 - BƯỚC: KC_11D (Quản trị chung › 🎁 Cấp thưởng cho bé + 📮 Bé phản hồi)
