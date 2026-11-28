// ================================================================
// FILE: kc/qt_hom_thu.js
// CHỨC NĂNG: NÚT 📬 HÒM THƯ trên thanh đầu trang Quản trị (quantri_NC.html), số đỏ = thư đang chờ Cô Cú (kc_thu_dem.coCu.cho).
//   Bấm vào là sang 📬 Hòm thư → 🦉 Hộp Cô Cú (homthu_co_cu.js). Thiet_Ke_Hom_Thu.md mục 9.0 / 9.2, bước KC_12D1.
//   Trang Quản trị không dùng kc_auth.js nên nút vẽ sẵn trong HTML (cùng lớp .kcNutHomThu của kc_style.css: điện thoại chỉ
//   biểu tượng + số). Hỏi số khi mở trang và khi quay lại tab sau 30 giây. Chưa có SQL kc12b / mất mạng: nút vẫn bấm được, không số.
//   KC_12D2: màn hình Quản trị chung › 📬 Hòm thư = ⚙️ Cài đặt hòm thư (mục 8 đặc tả): bật nhận thư, độ dài lời bé / Cô Cú,
//   số lời bé mỗi ngày, số thẻ "Cần con xem" ở Trang chủ, loại thư phụ huynh thấy, số người nhận tối đa. Ô viền cam = khác mặc định.
// RPC: kc_thu_dem(p_ten, p_ma_phien); kc_thu_admin_ds (đọc cauHinh / macDinh), kc_thu_admin_luu_cau_hinh (SQL kc12b).
// PHỤ THUỘC: ../api.js (apiGoiRpc), ../admin_NC.js (adminTaiKhoan, adminGoiRpc, adminBaoTin), #manhinh-homthu của quantri_NC.html.
// BƯỚC: KC_12D1 · NGÀY: 28/11/2026 · SỬA: KC_12D2 28/11/2026 (⚙️ Cài đặt hòm thư)
// ================================================================
(function () {
  "use strict";
  if (typeof apiGoiRpc !== "function") return;
  var lanCuoi = 0;

  function ve(n) {
    var nut = document.getElementById("kcNutHomThu"); if (!nut) return;
    var b = nut.querySelector(".kcHtSo");
    n = Math.max(0, Number(n) || 0);
    b.textContent = n > 99 ? "99+" : String(n);
    b.hidden = n === 0;
    nut.setAttribute("aria-label", "Hòm thư" + (n ? ", " + n + " thư chờ Cô Cú" : ""));
    nut.title = n ? n + " thư đang chờ Cô Cú" : "Hòm thư";
  }

  function hoi() {
    var tk = window.adminTaiKhoan;
    if (!tk || !tk.tenDangNhap) return;
    lanCuoi = Date.now();
    apiGoiRpc("kc_thu_dem", { p_ten: tk.tenDangNhap, p_ma_phien: tk.maPhien || "" }).then(function (kq) {
      ve(kq && kq.thanhCong && kq.coCu ? kq.coCu.cho : 0);
    }, function () { ve(0); });
  }

  // admin_NC.js đặt adminTaiKhoan trong DOMContentLoaded: đợi tối đa ~5 giây
  document.addEventListener("DOMContentLoaded", function () {
    var lan = 0;
    (function cho() {
      if (window.adminTaiKhoan) { hoi(); return; }
      if (++lan < 25) setTimeout(cho, 200);
    })();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && Date.now() - lanCuoi > 30000) hoi();
  });
  // mục 📮 / 💡 / 🎁 vừa xử lý xong thì số có thể đổi
  document.addEventListener("adminDaChuyenManHinh", function (e) {
    if (Date.now() - lanCuoi > 5000) hoi();
    if (e.detail && e.detail.ten === "homthu") taiCaiDat();
  });

  // ================================================================
  // KC_12D2: Quản trị chung › 📬 HÒM THƯ: ⚙️ CÀI ĐẶT (Thiet_Ke_Hom_Thu.md mục 8). Đọc cauHinh / macDinh từ kc_thu_admin_ds,
  // lưu bằng kc_thu_admin_luu_cau_hinh (máy chủ kiểm khoảng, chỉ lưu phần khác mặc định). Số ngày dọn thư ở 🗄️ Dung lượng dữ liệu.
  // ================================================================
  var SO = [
    ["do_dai_loi_be", "✍️ Lời bé viết trong thư: tối đa bao nhiêu chữ", 20, 1000],
    ["loi_be_moi_ngay", "📨 Số lời + ý tưởng mỗi bé được gửi trong một ngày", 1, 50],
    ["do_dai_loi_co_cu", "🦉 Lời / thư Cô Cú: tối đa bao nhiêu chữ", 50, 4000],
    ["the_can_xem_trang_chu", "🏠 Số thẻ “Cần con xem” hiện ngay trên Trang chủ (0 = không hiện)", 0, 6],
    ["toi_da_nguoi_nhan", "👥 Một thư / tin gửi tối đa bao nhiêu người (chặn gửi nhầm)", 10, 1000]
  ];
  var PH = [["y_tuong", "💡 Ý tưởng của con"], ["khang_nghi", "📮 Kháng nghị của con"], ["cap_thuong", "🎁 Cô Cú tặng / bù thưởng"]];
  var CSS = [
    ".qhtF { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; margin-top: 8px; }",
    ".qhtF label { display: grid; gap: 4px; font-weight: 600; font-size: .92rem; }",
    ".qhtF label small { font-weight: 400; opacity: .75; }",
    ".qhtF input[type=number] { width: 140px; min-height: 44px; box-sizing: border-box; padding: 8px; border: 2px solid #d9d2ef; border-radius: 10px; font: inherit; }",
    ".qhtHop { display: flex !important; grid-template-columns: none; align-items: center; gap: 8px !important; min-height: 44px; cursor: pointer; }",
    ".qhtHop input { width: 22px; height: 22px; flex: 0 0 auto; }",
    ".qhtNhom { grid-column: 1 / -1; border: 2px solid #e6e0f5; border-radius: 12px; padding: 8px 12px; margin: 0; }",
    ".qhtNhom legend { font-weight: 700; padding: 0 4px; }",
    ".qhtKhac { border-color: #ff9f1a !important; }",
    ".qhtNut { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; } .qhtNut .adminNut { min-height: 44px; }",
    ".qhtLoi { color: #b3261e; font-weight: 600; margin: 8px 0 0; }",
    "@media (max-width: 640px) { .qhtF { grid-template-columns: 1fr; } }"
  ].join("\n");

  function tao(the, lop, chu) { var e = document.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; }
  function goi(ham, ts) {
    return adminGoiRpc(ham, ts || {}).then(function (kq) { return kq || { thanhCong: false, thongBao: "Máy chủ không trả lời" }; },
      function () { return { thanhCong: false, thongBao: "Mất mạng" }; });
  }

  function taiCaiDat() {
    var g = document.getElementById("qhtGoc"); if (!g || typeof adminGoiRpc !== "function") return;
    if (!document.getElementById("qhtKieu")) { var s = tao("style"); s.id = "qhtKieu"; s.textContent = CSS; document.head.appendChild(s); }
    g.innerHTML = '<p class="adminDangTai">Đang tải...</p>';
    goi("kc_thu_admin_ds", { p_loc: "cho_co_cu" }).then(function (r) {
      g.innerHTML = "";
      if (!r.thanhCong || !r.cauHinh) { g.appendChild(tao("p", "adminGhiChu", "⚠️ " + (r.thongBao || "Không tải được cài đặt hòm thư"))); return; }
      veCaiDat(g, r.cauHinh, r.macDinh || {});
    });
  }

  function veCaiDat(g, c, md) {
    var f = tao("div", "qhtF"), o = {};
    var lb = tao("label", "qhtHop"), bat = tao("input"); bat.type = "checkbox"; bat.checked = c.bat !== false;
    lb.append(bat, tao("span", "", "📬 Nhận thư mới từ bé (tắt: bé không gửi được ý tưởng / lời trả lời; thư cũ vẫn xem được)"));
    lb.style.gridColumn = "1 / -1";
    f.appendChild(lb);
    var toBat = function () { lb.classList.toggle("qhtKhac", bat.checked !== (md.bat !== false)); }; bat.addEventListener("change", toBat); toBat();
    SO.forEach(function (x) {
      var l = tao("label", ""), i = tao("input");
      i.type = "number"; i.step = "1"; i.min = x[2]; i.max = x[3]; i.value = c[x[0]];
      l.append(tao("span", "", x[1]), tao("small", "", "Từ " + x[2] + " đến " + x[3] + " · mặc định " + md[x[0]]), i);
      var to = function () { i.classList.toggle("qhtKhac", +i.value !== +md[x[0]]); }; i.addEventListener("input", to); to();
      o[x[0]] = i; f.appendChild(l);
    });
    var nhom = tao("fieldset", "qhtNhom"), ph = {};
    nhom.appendChild(tao("legend", "", "👨‍👩‍👧 Phụ huynh được thấy loại thư nào của con"));
    var coPh = c.ph_thay || [], mdPh = md.ph_thay || [];
    PH.forEach(function (x) {
      var l = tao("label", "qhtHop"), h = tao("input"); h.type = "checkbox"; h.checked = coPh.indexOf(x[0]) >= 0;
      l.append(h, tao("span", "", x[1]));
      var to = function () { l.classList.toggle("qhtKhac", h.checked !== (mdPh.indexOf(x[0]) >= 0)); }; h.addEventListener("change", to); to();
      ph[x[0]] = h; nhom.appendChild(l);
    });
    nhom.appendChild(tao("small", "", "Thư ✉️ Cô Cú viết: chọn “Phụ huynh cũng thấy” ngay lúc viết. Số ngày giữ thư đã xong: 🗄️ Dung lượng dữ liệu."));
    f.appendChild(nhom);
    g.appendChild(f);

    var loi = tao("p", "qhtLoi"); loi.setAttribute("role", "alert");
    var hang = tao("div", "qhtNut");
    var luu = tao("button", "adminNut", "💾 Lưu"); luu.type = "button";
    var ve = tao("button", "adminNut adminNutPhu", "↺ Về mặc định"); ve.type = "button";
    var mo = tao("a", "adminNut adminNutPhu", "🦉 Mở Hộp Cô Cú"); mo.href = "homthu_NC.html"; mo.style.textDecoration = "none";
    hang.append(luu, ve, mo);
    g.append(loi, hang);

    ve.addEventListener("click", function () {
      bat.checked = md.bat !== false; bat.dispatchEvent(new Event("change"));
      SO.forEach(function (x) { o[x[0]].value = md[x[0]]; o[x[0]].dispatchEvent(new Event("input")); });
      PH.forEach(function (x) { ph[x[0]].checked = mdPh.indexOf(x[0]) >= 0; ph[x[0]].dispatchEvent(new Event("change")); });
      loi.textContent = "Đã điền lại số mặc định. Bấm 💾 Lưu để áp dụng.";
    });
    luu.addEventListener("click", function () {
      loi.textContent = "";
      var gt = { bat: bat.checked }, sai = null;
      SO.forEach(function (x) {
        var v = Number(o[x[0]].value);
        if (!sai && (o[x[0]].value === "" || !Number.isInteger(v) || v < x[2] || v > x[3])) sai = x;
        gt[x[0]] = v;
      });
      if (sai) { loi.textContent = "❌ " + sai[1].replace(/^\S+\s/, "") + ": cần số nguyên từ " + sai[2] + " đến " + sai[3] + "."; o[sai[0]].focus(); return; }
      gt.ph_thay = PH.filter(function (x) { return ph[x[0]].checked; }).map(function (x) { return x[0]; });
      luu.disabled = true;
      goi("kc_thu_admin_luu_cau_hinh", { p_gia_tri: gt }).then(function (kq) {
        luu.disabled = false;
        if (!kq.thanhCong) { loi.textContent = "❌ " + (kq.thongBao || "Chưa lưu được"); return; }
        adminBaoTin("✅ Đã lưu cài đặt hòm thư", true);
        taiCaiDat();
      });
    });
  }
})();
// 28/11/2026 - BƯỚC: KC_12D1 (tạo mới: nút 📬 Hòm thư ở Quản trị)
// 28/11/2026 - BƯỚC: KC_12D2 (màn hình 📬 Hòm thư: ⚙️ Cài đặt hòm thư)
