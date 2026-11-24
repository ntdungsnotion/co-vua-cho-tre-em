// ================================================================
// FILE: kc/qt_gio_bai.js
// CHỨC NĂNG: Quản trị chung › ⏱️ Tính giờ trả lời (KC_GB1, đặc tả Thiet_Ke_On_The.md 4.0): MỌI thông số của công thức giờ bài
//   dùng chung toàn app (module kc_gio_bai / KC_GIO_BAI), không còn số nào cứng trong code:
//   - ⚙️ Số chung: giây xem hình, đơn vị ký hiệu, độ lệch từng câu / cả bài, z (mốc 90 %), mục tiêu bé khá / trung bình.
//   - 🧒 Bé khá / giỏi so với bé trung bình (tốc độ đọc, thời gian nghĩ) + độ khó dễ / vừa / khó.
//   - 📏 Bảng theo lớp 0-12: tốc độ đọc (tiếng / phút) và thời gian nghĩ + chọn (giây / câu) của bé trung bình.
//   - 🔬 Xem thử: gõ một câu mẫu + lớp + số câu -> thấy ngay tổng giờ a, mốc t₀ (trước khi lưu, tính bằng cùng thuật toán
//     chung/gio_bai.js), bảng theo lớp, nút "Đối chiếu máy chủ" gọi SQL kc_gio_bai_admin_xem_thu (phải ra đúng số).
//   Hệ số k của TỪNG GAME (Theo môn, Ôn sau trận...) KHÔNG ở đây: nằm ở cài đặt riêng của game (người dùng 24/11/2026).
//   Ô khác mặc định tô cam; ↺ từng ô / "Về mặc định" cả bảng. Máy chủ kiểm khoảng từng số, chỉ lưu phần khác mặc định.
//   Điện thoại: 1 cột, bảng theo lớp cuộn ngang. Máy tính: cấu hình trái, xem thử phải (dính khi cuộn).
// RPC: kc_gio_bai_admin_doc, kc_gio_bai_admin_luu, kc_gio_bai_admin_xem_thu (SQL repo_rieng supabase_kc_gb1_quan_tri_gio_bai.sql);
//      kc_gio_bai_doc_cau_hinh (qua KC_GIO_BAI.napCauHinh).
// PHỤ THUỘC: ../admin_NC.js (adminGoiRpc, adminBaoTin), chung/gio_bai.js, khung .qcp* trong quantri_NC.html.
// BƯỚC: KC_GB1 - NGÀY: 24/11/2026
// ================================================================
(function () {
  "use strict";
  if (typeof adminGoiRpc !== "function") return;
  var MAN = "giobai-chung";
  var S = { md: null, dang: null, daTai: false };
  var G = window.KC_GIO_BAI;

  // khoá -> [nhãn, thấp, cao, bước]. Khoảng khớp SQL kc_gio_bai_kiem_tra.
  var CHUNG = [
    ["giay_hinh", "Giây xem hình / câu", 0, 60, 0.5], ["chu_dau", "Ký hiệu (+ = ?) tính bằng số chữ", 0, 1, 0.1],
    ["cv_cau", "Độ lệch từng câu (0,3 = 30 %)", 0, 1.5, 0.05], ["cv_bai", "Độ lệch cả bài", 0, 1.5, 0.05], ["z", "z (1,2816 = mốc 90 %)", 0, 4, 0.01],
    ["muc_kha", "Mục tiêu bé khá (% 💎 nhận)", 1, 99, 1], ["muc_tb", "Mục tiêu bé TB (% 💎 nhận)", 1, 99, 1]];
  var HESO = [
    ["he_so_doc_kha", "Bé khá đọc nhanh × ", 0.5, 3, 0.05], ["he_so_doc_gioi", "Bé giỏi đọc nhanh × ", 0.5, 4, 0.05],
    ["he_so_nghi_kha", "Bé khá nghĩ × ", 0.1, 2, 0.05], ["he_so_nghi_gioi", "Bé giỏi nghĩ × ", 0.1, 2, 0.05],
    ["he_so_de", "Câu Dễ nghĩ × ", 0.1, 5, 0.05], ["he_so_vua", "Câu Vừa nghĩ × ", 0.1, 5, 0.05], ["he_so_kho", "Câu Khó nghĩ × ", 0.1, 5, 0.05]];
  var BANG = [["doc_tb_lop", "📖 Tốc độ đọc bé trung bình (tiếng / phút)", 10, 600, 1], ["nghi_tb_lop", "🤔 Nghĩ + chọn mỗi câu, bé trung bình (giây)", 0, 60, 0.1]];

  function tao(the, lop, chu) { var e = document.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; }
  function soVi(n) { return String(n).replace(".", ","); }
  function goi(ham, ts) {
    return adminGoiRpc(ham, ts || {}).then(function (kq) {
      if (kq && kq.thanhCong === false && /function|does not exist|schema cache/i.test(kq.thongBao || "")) kq.thongBao = "Máy chủ chưa có hàm " + ham + " (cần chạy SQL KC_GB1)";
      return kq || { thanhCong: false, thongBao: "Máy chủ không trả lời" };
    });
  }

  document.addEventListener("adminDaChuyenManHinh", function (e) {
    if (e.detail && e.detail.ten === MAN) tai();
  });

  function tai() {
    var g = document.getElementById("qtgGoc");
    g.innerHTML = '<p class="adminDangTai">Đang tải...</p>';
    goi("kc_gio_bai_admin_doc").then(function (r) {
      g.innerHTML = "";
      if (!r.thanhCong) { g.appendChild(tao("p", "qcpLoi", "⚠️ " + (r.thongBao || "Không tải được"))); return; }
      S.md = r.macDinh; S.dang = r.cauHinh;
      var hai = tao("div", "qcpHai qtgHai");
      var trai = tao("div", "qtmCot"), phai = tao("div", "qtmCot qtgPhai");
      trai.appendChild(veLuoi("⚙️ Số chung", CHUNG, "Hệ số k của từng game (nhân vào mốc t₀ và tổng giờ a) nằm ở cài đặt riêng của game đó, không đặt ở đây. Mục tiêu: bé giỏi (90 %) được đủ 💎, bé khá (90 %) được ≥ mục tiêu khá, bé trung bình (90 %) được ≥ mục tiêu TB."));
      trai.appendChild(veLuoi("🧒 Bé khá, bé giỏi và độ khó câu", HESO, "Bé khá / giỏi đọc nhanh hơn và nghĩ nhanh hơn bé trung bình bao nhiêu lần; câu Vừa / Khó cần nghĩ lâu hơn câu Dễ. Câu Dễ = 1 là mốc."));
      trai.appendChild(veBang());
      trai.appendChild(veNut());
      phai.appendChild(veXemThu());
      hai.append(trai, phai); g.appendChild(hai);
      // module chung của trang dùng số ĐÃ LƯU làm gốc để so với số đang nhập
      (G ? G.napCauHinh(function () { return Promise.resolve({ cauHinh: S.dang }); }) : Promise.resolve()).then(capNhat);
    });
  }

  // ---------------- ô số ----------------
  function oSo(khoa, ten, lo, hi, buoc, gt, md, nho) {
    var w = tao("label", "qcpO" + (nho ? " qtgNho" : ""));
    var i = tao("input"); i.type = "number"; i.step = String(buoc); i.min = String(lo); i.max = String(hi); i.value = gt; i.setAttribute("aria-label", ten);
    i.dataset.khoa = khoa;
    var nut = tao("button", "qcpVe", "↺"); nut.type = "button";
    function to() { var khac = Number(i.value) !== Number(md); w.classList.toggle("khac", khac); nut.hidden = !khac; nut.title = "Về mặc định (" + soVi(md) + ")"; }
    i.addEventListener("input", function () { to(); capNhat(); });
    nut.addEventListener("click", function () { i.value = md; to(); capNhat(); });
    if (!nho) w.appendChild(tao("small", "", ten));
    w.append(i, nut); to();
    return w;
  }
  function veLuoi(tieuDe, ds, ghiChu) {
    var k = tao("div", "qcpKhoi");
    k.appendChild(tao("h4", "", tieuDe));
    var luoi = tao("div", "qcpKho qtgLuoi");
    ds.forEach(function (x) { luoi.appendChild(oSo(x[0], x[1], x[2], x[3], x[4], S.dang[x[0]], S.md[x[0]])); });
    k.append(luoi, tao("p", "adminGhiChu", ghiChu));
    return k;
  }
  function veBang() {
    var k = tao("div", "qcpKhoi");
    k.appendChild(tao("h4", "", "📏 Theo lớp của bé (lớp 0 = mầm non / chưa biết)"));
    var cuon = tao("div", "qtgCuon"), b = tao("table", "qtgBang");
    var tr = tao("tr"); tr.appendChild(tao("th", "", ""));
    for (var l = 0; l <= 12; l++) tr.appendChild(tao("th", "", "Lớp " + l));
    b.appendChild(tr);
    BANG.forEach(function (x) {
      var h = tao("tr"); h.appendChild(tao("th", "qtgTen", x[1]));
      for (var l = 0; l <= 12; l++) {
        var td = tao("td"), o = oSo(x[0] + ":" + l, x[1] + " lớp " + l, x[2], x[3], x[4], S.dang[x[0]][l], S.md[x[0]][l], true);
        td.appendChild(o); h.appendChild(td);
      }
      b.appendChild(h);
    });
    cuon.appendChild(b); k.appendChild(cuon);
    k.appendChild(tao("p", "adminGhiChu", "Số mặc định theo tài liệu khoa học (Chương trình GDPT 2018 môn Tiếng Việt lớp 1-5; Hasbrouck & Tindal 2017; Soltanlou 2015; Dickson 2022; xem đặc tả Thiet_Ke_On_The.md 4.0). Lớp 0-2 và 6-12 là ước lượng: khi có dữ liệu bé thật sẽ căn lại ở đây."));
    return k;
  }

  // ---------------- thu gom + kiểm ----------------
  function thuGom() {
    var gv = {}, loi = null, kq = { loi: null, gv: gv };
    [].concat(CHUNG, HESO).forEach(function (x) {
      var i = document.querySelector('#qtgGoc input[data-khoa="' + x[0] + '"]'), v = i ? Number(i.value) : NaN;
      if (!i || i.value === "" || !(v >= x[2] && v <= x[3])) loi = loi || x[1] + ": số từ " + soVi(x[2]) + " đến " + soVi(x[3]);
      gv[x[0]] = v;
    });
    BANG.forEach(function (x) {
      gv[x[0]] = [];
      for (var l = 0; l <= 12; l++) {
        var i = document.querySelector('#qtgGoc input[data-khoa="' + x[0] + ":" + l + '"]'), v = i ? Number(i.value) : NaN;
        if (!i || i.value === "" || !(v >= x[2] && v <= x[3])) loi = loi || x[1] + ", lớp " + l + ": số từ " + x[2] + " đến " + x[3];
        gv[x[0]].push(v);
      }
    });
    gv.he_so_k = Number(S.dang.he_so_k) || 1; // k chung giữ nguyên, không sửa ở màn này
    kq.loi = loi; return kq;
  }

  // ---------------- 💾 ----------------
  function veNut() {
    var k = tao("div", "qcpKhoi");
    var tb = tao("p", "qcpTb"); tb.setAttribute("aria-live", "polite"); tb.id = "qtgTb";
    var h = tao("div", "adminHang");
    var luu = tao("button", "adminNut adminNutThanhCong", "💾 Lưu"); luu.type = "button";
    var ve = tao("button", "adminNut adminNutPhu", "↺ Về mặc định cả bảng"); ve.type = "button";
    h.append(luu, ve); k.append(h, tb);
    function gui(gv) {
      luu.disabled = true; tb.className = "qcpTb"; tb.textContent = "Đang lưu...";
      goi("kc_gio_bai_admin_luu", { p_gia_tri: gv }).then(function (kq) {
        luu.disabled = false;
        if (!kq.thanhCong) { tb.className = "qcpTb xau"; tb.textContent = "⚠️ " + (kq.thongBao || "Không lưu được"); return; }
        adminBaoTin("Đã lưu thông số tính giờ", true);
        tai();
      });
    }
    luu.addEventListener("click", function () { var r = thuGom(); if (r.loi) { tb.className = "qcpTb xau"; tb.textContent = "⚠️ " + r.loi; return; } gui(r.gv); });
    ve.addEventListener("click", function () { if (window.confirm("Đưa mọi số tính giờ về mặc định?")) gui({}); });
    return k;
  }

  // ---------------- 🔬 XEM THỬ ----------------
  var MAU = { nd: "Hình chữ nhật dài 9 cm, rộng 4 cm. Chu vi bằng bao nhiêu?", da: ["13 cm", "18 cm", "26 cm", "36 cm"] };
  function veXemThu() {
    var k = tao("div", "qcpKhoi qtgXt");
    k.appendChild(tao("h4", "", "🔬 Xem thử giờ của một bộ câu"));
    var f = tao("div", "qtgForm");
    function o(ten, el) { var w = tao("label", "qtgF"); w.append(tao("small", "", ten), el); return w; }
    var lop = tao("select"); lop.id = "qtgLop"; for (var l = 0; l <= 12; l++) { var op = tao("option", "", "Lớp " + l); op.value = l; lop.appendChild(op); } lop.value = "6";
    var n = tao("input"); n.type = "number"; n.min = "1"; n.max = "100"; n.value = "10"; n.id = "qtgN";
    var muc = tao("select"); muc.id = "qtgMuc"; [["de", "Dễ"], ["vua", "Vừa"], ["kho", "Khó"]].forEach(function (m) { var op = tao("option", "", m[1]); op.value = m[0]; muc.appendChild(op); }); muc.value = "vua";
    var kr = tao("input"); kr.type = "number"; kr.step = "0.05"; kr.min = "0.3"; kr.max = "3"; kr.value = "1"; kr.id = "qtgKr";
    var hinh = tao("input"); hinh.type = "checkbox"; hinh.id = "qtgHinh";
    var nd = tao("textarea"); nd.rows = 2; nd.value = MAU.nd; nd.id = "qtgNd";
    var da = tao("textarea"); da.rows = 4; da.value = MAU.da.join("\n"); da.id = "qtgDa";
    f.append(o("Lớp của bé", lop), o("Số câu giống câu mẫu", n), o("Độ khó", muc), o("k của game (chỉ để xem thử; đặt ở game)", kr),
      o("Câu có hình", hinh), o("Nội dung câu mẫu", nd), o("4 đáp án (mỗi dòng một đáp án)", da));
    f.addEventListener("input", capNhat); f.addEventListener("change", capNhat);
    k.appendChild(f);
    var kq = tao("div", "qtgKq"); kq.id = "qtgKq"; k.appendChild(kq);
    var nut = tao("button", "adminNut adminNutPhu", "🖥️ Đối chiếu với máy chủ (số đang nhập)"); nut.type = "button";
    var dc = tao("p", "qcpTb"); dc.id = "qtgDc"; dc.setAttribute("aria-live", "polite");
    nut.addEventListener("click", function () {
      var r = thuGom(); if (r.loi) { dc.className = "qcpTb xau"; dc.textContent = "⚠️ " + r.loi; return; }
      var m = mau(); dc.className = "qcpTb"; dc.textContent = "Đang tính...";
      goi("kc_gio_bai_admin_xem_thu", { p_lop: m.lop, p_cau: m.cau, p_cau_hinh: r.gv, p_k: m.k }).then(function (s) {
        if (!s.thanhCong) { dc.className = "qcpTb xau"; dc.textContent = "⚠️ " + (s.thongBao || "Lỗi"); return; }
        var t = tinh(r.gv, m), kho = s.ketQua, khop = t.a === kho.a && t.t0 === kho.t0;
        dc.className = khop ? "qcpTb" : "qcpTb xau";
        dc.textContent = (khop ? "✅ Khớp: " : "⚠️ LỆCH: ") + "máy chủ a = " + kho.a + " s, t₀ = " + kho.t0 + " s; trang tính a = " + t.a + " s, t₀ = " + t.t0 + " s.";
      });
    });
    k.append(nut, dc);
    return k;
  }
  function mau() {
    var n = Math.max(1, Math.min(100, Math.round(Number(document.getElementById("qtgN").value) || 1)));
    var c = { noiDung: document.getElementById("qtgNd").value, dapAn: document.getElementById("qtgDa").value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean),
      muc: document.getElementById("qtgMuc").value, coHinh: document.getElementById("qtgHinh").checked };
    var cau = []; for (var i = 0; i < n; i++) cau.push(c);
    return { lop: Number(document.getElementById("qtgLop").value), cau: cau, n: n, k: Number(document.getElementById("qtgKr").value) || 1 };
  }
  // tính bằng module chung của trang với số ĐANG NHẬP (chưa lưu): k nhập = k chung mới × k riêng
  function tinh(gv, m, lop) {
    var chungK = Number((G.cauHinh || {}).he_so_k) || 1, rieng = Object.assign({}, gv);
    rieng.he_so_k = (Number(gv.he_so_k) / chungK) * (m.k || 1);
    return G.tinh(m.cau, lop == null ? m.lop : lop, rieng);
  }
  function capNhat() {
    var kq = document.getElementById("qtgKq"); if (!kq || !G) return;
    var r = thuGom(); kq.innerHTML = "";
    if (r.loi) { kq.appendChild(tao("p", "qcpLoi", "⚠️ " + r.loi)); return; }
    var m = mau(), t = tinh(r.gv, m);
    if (!t || !t.a) { kq.appendChild(tao("p", "adminGhiChu", "Nhập nội dung câu mẫu để xem giờ.")); return; }
    var hang = tao("div", "qcpToi");
    [["⏱ t₀ (bắt đầu trừ 💎)", t.t0 + " s"], ["⏰ a (hết giờ = 0 💎)", t.a + " s"], ["Mỗi câu ~", soVi(Math.round(t.t0 / m.n * 10) / 10) + " s"]].forEach(function (x) {
      var c = tao("div", "qcpToiO"); c.append(tao("b", "", x[1]), tao("i", "", x[0])); hang.appendChild(c);
    });
    kq.appendChild(hang);
    if (t.p90) kq.appendChild(tao("p", "adminGhiChu", "P90 của bé giỏi / khá / trung bình: " + soVi(t.p90.gioi) + " / " + soVi(t.p90.kha) + " / " + soVi(t.p90.tb) + " giây."));
    var b = tao("table", "qtgBang qtgKetQua"), h = tao("tr"), d1 = tao("tr"), d2 = tao("tr");
    h.appendChild(tao("th", "", "Lớp")); d1.appendChild(tao("th", "", "t₀ (s)")); d2.appendChild(tao("th", "", "a (s)"));
    for (var l = 0; l <= 12; l++) {
      var x = tinh(r.gv, m, l); h.appendChild(tao("th", l === m.lop ? "chon" : "", String(l)));
      d1.appendChild(tao("td", l === m.lop ? "chon" : "", String(x.t0))); d2.appendChild(tao("td", l === m.lop ? "chon" : "", String(x.a)));
    }
    b.append(h, d1, d2);
    var cuon = tao("div", "qtgCuon"); cuon.appendChild(b); kq.appendChild(cuon);
    kq.appendChild(tao("p", "adminGhiChu", "Cùng bộ câu đó ở từng lớp. 💎 giữ nguyên nếu xong trước t₀, sau đó trừ dần, đến a thì hết (ví dụ tối đa 30 💎 → mỗi (a − t₀) / 30 giây trừ 1 💎)."));
  }
})();
// 24/11/2026 - BƯỚC: KC_GB1
