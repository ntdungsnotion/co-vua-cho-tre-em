// ================================================================
// FILE: kc/qt_trinh_do.js
// CHỨC NĂNG: Quản trị chung › 🎯 Trình độ (KC_08F1, đặc tả Thiet_Ke_Trinh_Do.md 9.4): module trình độ dùng chung toàn app.
//   - 👦 Các bé: danh sách bé có trình độ (lọc "có cờ", tìm tên); mỗi bé: θ từng môn, độ tin cậy, lớp đã mở, cờ khai lệch /
//     bất thường. Bấm một bé: chi tiết từng môn (θ, bằng chứng, Dễ / Vừa / Khó, K, trần, đợt thử lớp mới, danh hiệu),
//     📈 đồ thị θ theo thời gian (rê chuột / chạm xem từng điểm), ✏️ đặt trình độ tay / 🔄 làm lại từ lớp khai (vd anh chị
//     chơi hộ) + ↩ hoàn tác, 20 lần cập nhật gần nhất (vì sao trình độ đổi).
//   - 🎛️ Thông số: mọi số của module (nhóm, giải thích, ô khác mặc định tô cam, ↺ từng ô / về mặc định cả bảng),
//     lịch sử mọi lần sửa + ↩ hoàn tác. Máy chủ kiểm khoảng (kc_td_khoa_sua), chỉ lưu phần khác mặc định.
//   - 🩺 Máy chủ: lịch đối soát đêm (02:50), nút Đối soát ngay, lỗi trình độ gần đây.
//   Điện thoại: 1 cột, danh sách dạng thẻ. Máy tính: danh sách trái, chi tiết phải.
// RPC: kc_td_admin_doc, kc_td_admin_luu_cau_hinh, kc_td_admin_hoan_tac_cau_hinh, kc_td_admin_xem, kc_td_admin_be,
//      kc_td_admin_dat, kc_td_admin_hoan_tac_dat, kc_td_admin_doi_soat (SQL repo_rieng supabase_kc08f1_quan_tri.sql).
// PHỤ THUỘC: ../admin_NC.js (adminGoiRpc, adminBaoTin), qt_trinh_do.css.
// BƯỚC: KC_08F1 - NGÀY: 24/11/2026
// ================================================================
(function () {
  "use strict";
  if (typeof adminGoiRpc !== "function") return;
  var MAN = "trinhdo";
  var S = { tab: "be", loc: "", tim: "", ds: null, chon: null, ct: null, monDo: null, ngay: 120, ch: null };

  // nhãn từng khoá thông số: đường dẫn -> [nhóm, nhãn, bước]
  var NHOM = [
    ["cong", "📈 Đường cong và mục tiêu", "Xác suất bé đúng một câu theo trình độ θ và độ khó b (cùng thang lớp). Mục tiêu 0,75 = khi θ = b bé đúng 75 %."],
    ["k", "⚖️ Tốc độ thay đổi trình độ", "K lớn lúc đầu, nhỏ dần khi có nhiều bằng chứng: K = max(Kmin, K0 / (1 + beta × bằng chứng)). D = giới hạn tăng / giảm mỗi câu (lớp)."],
    ["w", "🔁 Trọng số lượt (câu gặp lại)", "Câu mới tính đủ 1. Cùng một câu gặp lại tính ít hơn; sai do bấm quá nhanh không tính."],
    ["tc", "✅ Độ tin cậy", "Thấp (đang dò) khi bằng chứng < ngưỡng dò. Cao khi đủ bằng chứng, đủ câu khác nhau, nhiều mức và θ ít dao động. Chỉ môn tin cậy cao mới được xét báo khai lệch."],
    ["khoi", "🚀 Điểm xuất phát", "Bé mới: θ = lớp khai + độ lệch (phụ huynh nhập / bé tự chọn), hoặc θ cố định khi chưa biết lớp. n0 = bằng chứng ban đầu."],
    ["lech", "⚠️ Bất thường và báo khai lệch", "Bất thường: |z| trên N lượt gần nhất ≥ ngưỡng bật (dấu − hạ tin cậy). Khai lệch: ≥ số môn tin cậy cao lệch ≥ số lớp."],
    ["mo", "🎓 Mở lớp mới", "Mở lớp M + 1 khi tin cậy cao + θ đủ ngưỡng + làm thử một đợt câu lớp mới đạt tỉ lệ đúng."],
    ["noi", "🎯 Mục tiêu đúng theo nơi hỏi", "Xác suất đúng nhắm tới ở từng hoạt động. Chinh phục 30 câu: 6 chặng khó dần."],
    ["chon", "🧩 Chọn câu và độ khó câu", "Chống nản: sai liền vài câu thì câu sau dễ hơn. Độ khó câu ban đầu = lớp + cộng thêm theo mức Dễ / Vừa / Khó."],
    ["dh", "🏅 Danh hiệu của bé", "Mốc bậc k = hệ số × k^mũ điểm. Thưởng tiến bộ mỗi khi θ cao nhất tăng thêm một bước. (Tên + biểu tượng sửa ở KC_08F2.)"]
  ];
  var NHAN = {
    "doDoc": ["cong", "Độ dốc đường cong", 0.05], "mucTieu": ["cong", "Mục tiêu (θ = b thì đúng)", 0.01],
    "vungVuaSuc.0": ["cong", "Vùng vừa sức: từ", 0.01], "vungVuaSuc.1": ["cong", "Vùng vừa sức: đến", 0.01],
    "mucTieuDo": ["cong", "Mục tiêu lúc đang dò", 0.01],
    "K.K0": ["k", "K0 (K lúc đầu)", 0.05], "K.beta": ["k", "beta (K giảm theo bằng chứng)", 0.01], "K.Kmin": ["k", "Kmin (K nhỏ nhất)", 0.01],
    "D.tang": ["k", "Tăng tối đa mỗi câu (lớp)", 0.01], "D.giam": ["k", "Giảm tối đa mỗi câu (lớp)", 0.01],
    "heSoSaiKhiLeo": ["k", "Hệ số câu sai lúc đang leo", 0.05], "chuoiLeo": ["k", "Số câu đúng liền = đang leo", 1],
    "nuaDoiNgay": ["k", "Nghỉ bao nhiêu ngày thì bằng chứng còn nửa", 1],
    "w.gapLaiXa": ["w", "Gặp lại câu cũ, cách xa", 0.05], "w.gapLaiGan": ["w", "Gặp lại câu cũ, gần / nhiều lần", 0.05],
    "w.mocNgay": ["w", "Mốc 'cách xa' (ngày)", 1], "w.mocLan": ["w", "Mốc 'nhiều lần'", 1], "w.giayBamVoi": ["w", "Sai trong bấy nhiêu giây = bấm vội", 0.1],
    "tinCay.nDo": ["tc", "Bằng chứng < số này = đang dò", 1], "tinCay.nCao": ["tc", "Bằng chứng ≥ số này mới có thể cao", 1],
    "tinCay.cauKhac": ["tc", "Số câu khác nhau tối thiểu", 1], "tinCay.soMuc": ["tc", "Số mức (Dễ / Vừa / Khó) tối thiểu", 1],
    "tinCay.daoDong": ["tc", "Dao động θ tối đa (lớp)", 0.1], "tinCay.soLuotDaoDong": ["tc", "Xét dao động trên bao nhiêu lượt", 1],
    "khoi.phu_huynh.lech": ["khoi", "Phụ huynh nhập lớp: θ = lớp + ", 0.1], "khoi.phu_huynh.n0": ["khoi", "Phụ huynh nhập lớp: n0", 1],
    "khoi.be.lech": ["khoi", "Bé tự chọn lớp: θ = lớp + ", 0.1], "khoi.be.n0": ["khoi", "Bé tự chọn lớp: n0", 1],
    "khoi.khong.theta": ["khoi", "Chưa biết lớp: θ =", 0.1], "khoi.khong.n0": ["khoi", "Chưa biết lớp: n0", 1],
    "batThuong.soLuot": ["lech", "Bất thường: xét N lượt", 1], "batThuong.z": ["lech", "Bất thường: |z| bật", 0.1], "batThuong.zTat": ["lech", "Bất thường: |z| tắt", 0.1],
    "coLech.lop": ["lech", "Khai lệch: lệch ≥ (lớp)", 0.1], "coLech.soMon": ["lech", "Khai lệch: số môn", 1],
    "moLop.nguongThu": ["mo", "Ngưỡng được thử (p câu Vừa lớp mới)", 0.01], "moLop.tiLeThu": ["mo", "Tỉ lệ câu thử khi vừa đạt ngưỡng", 0.05],
    "moLop.nguongXa": ["mo", "Ngưỡng vượt xa", 0.01], "moLop.tiLeThuXa": ["mo", "Tỉ lệ câu thử khi vượt xa", 0.05],
    "moLop.soCauThu": ["mo", "Số câu một đợt thử", 1], "moLop.nguongMo": ["mo", "Đúng ≥ tỉ lệ này thì mở lớp", 0.01],
    "moLop.nhamThu": ["mo", "Câu thử nhắm p =", 0.01], "moLop.nguongKho": ["mo", "Đợt thử < tỉ lệ này = khó rõ (giảm nửa tỉ lệ thử)", 0.01],
    "moLop.giamBangChung": ["mo", "Mở lớp xong nhân bằng chứng với", 0.05], "moLop.choSauTruot": ["mo", "Chờ bao nhiêu câu sau đợt trượt", 1],
    "mucTieuNoi.tran": ["noi", "Trận Đấu Trường", 0.01], "mucTieuNoi.cong_trinh": ["noi", "Câu phòng thủ công trình", 0.01],
    "mucTieuNoi.on_sau_tran": ["noi", "Ôn sau trận (thay câu)", 0.01], "mucTieuNoi.kt_moi": ["noi", "Kiến thức mới", 0.01],
    "mucTieuNoi.on_kt": ["noi", "Ôn kiến thức đã có", 0.01], "mucTieuNoi.toc_do": ["noi", "⚡ Tốc độ", 0.01],
    "mucTieuNoi.chinh_phuc.0": ["noi", "🏆 Chinh phục chặng 1", 0.01], "mucTieuNoi.chinh_phuc.1": ["noi", "🏆 Chặng 2", 0.01],
    "mucTieuNoi.chinh_phuc.2": ["noi", "🏆 Chặng 3", 0.01], "mucTieuNoi.chinh_phuc.3": ["noi", "🏆 Chặng 4", 0.01],
    "mucTieuNoi.chinh_phuc.4": ["noi", "🏆 Chặng 5", 0.01], "mucTieuNoi.chinh_phuc.5": ["noi", "🏆 Chặng 6", 0.01],
    "chongNan.soSai": ["chon", "Chống nản: sai liền bao nhiêu câu", 1], "chongNan.nham": ["chon", "Chống nản: câu sau nhắm p =", 0.01],
    "chongNan.lui": ["chon", "Chống nản: θ tạm hạ mỗi câu sai (lớp)", 0.1],
    "tiLeOnTap": ["chon", "Tỉ lệ câu ôn tập (dễ)", 0.01], "onTap.xacSuat": ["chon", "Câu ôn tập nhắm p =", 0.01],
    "beRongChon": ["chon", "Độ rộng chọn ô (|p − nhắm| ≤)", 0.01],
    "mucDoKho.de": ["chon", "Câu Dễ: lớp +", 0.05], "mucDoKho.vua": ["chon", "Câu Vừa: lớp +", 0.05], "mucDoKho.kho": ["chon", "Câu Khó: lớp +", 0.05],
    "danhHieu.heSo": ["dh", "Hệ số mốc", 1], "danhHieu.mu": ["dh", "Mũ", 0.01], "danhHieu.buocTienBo": ["dh", "Bước tiến bộ θ", 0.05],
    "danhHieu.diemTienBo": ["dh", "Điểm mỗi bước tiến bộ", 1]
  };
  var TIN = { thap: ["🔵", "đang dò"], tb: ["🟡", "trung bình"], cao: ["🟢", "cao"] };
  var MUC = { de: "Dễ", vua: "Vừa", kho: "Khó" };

  // ---------------- tiện ích ----------------
  function tao(the, lop, chu) { var e = document.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; }
  function so(x, n) { if (x === null || x === undefined || x === "" || isNaN(x)) return "–"; return Number(x).toFixed(n == null ? 2 : n).replace(".", ","); }
  function soVi(x) { return String(x).replace(".", ","); }
  function ngay(t) { if (!t) return "–"; var d = new Date(t); return isNaN(d) ? "–" : d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  function lay(o, duong) { return duong.reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function dat(o, duong, v) { var a = o; for (var i = 0; i < duong.length - 1; i++) a = a[duong[i]]; a[duong[duong.length - 1]] = v; }
  function tenLop(l) { return l === null || l === undefined ? "chưa biết lớp" : (l === 0 ? "mẫu giáo" : "lớp " + l); }
  function goi(ham, ts) {
    return adminGoiRpc(ham, ts || {}).then(function (kq) {
      if (kq && kq.thanhCong === false && /function|does not exist|schema cache/i.test(kq.thongBao || "")) kq.thongBao = "Máy chủ chưa có hàm " + ham + " (cần chạy SQL KC_08F1)";
      return kq || { thanhCong: false, thongBao: "Máy chủ không trả lời" };
    }, function () { return { thanhCong: false, thongBao: "Không kết nối được máy chủ" }; });
  }
  function goc() { return document.getElementById("qtrGoc"); }

  document.addEventListener("adminDaChuyenManHinh", function (e) { if (e.detail && e.detail.ten === MAN) moTab(S.tab); });

  function moTab(tab) {
    S.tab = tab;
    var g = goc(); g.innerHTML = "";
    var the = tao("div", "qtrTab"); the.setAttribute("role", "tablist");
    [["be", "👦 Các bé"], ["so", "🎛️ Thông số"], ["may", "🩺 Máy chủ"]].forEach(function (t) {
      var n = tao("button", "qtrTabNut" + (t[0] === tab ? " chon" : ""), t[1]); n.type = "button"; n.setAttribute("role", "tab");
      n.setAttribute("aria-selected", t[0] === tab ? "true" : "false");
      n.addEventListener("click", function () { moTab(t[0]); });
      the.appendChild(n);
    });
    g.appendChild(the);
    var than = tao("div", "qtrThan"); than.id = "qtrThan"; g.appendChild(than);
    if (tab === "be") taiDs(); else if (tab === "so") taiSo(); else taiMay();
  }

  // ================= 👦 CÁC BÉ =================
  function taiDs() {
    var t = document.getElementById("qtrThan");
    t.innerHTML = "";
    var hang = tao("div", "qtrLoc");
    var tim = tao("input"); tim.type = "search"; tim.placeholder = "Tìm tên bé"; tim.value = S.tim; tim.setAttribute("aria-label", "Tìm tên bé");
    var loc = tao("select"); loc.setAttribute("aria-label", "Lọc");
    [["", "Mọi bé"], ["co", "⚑ Chỉ bé có cờ"]].forEach(function (x) { var o = tao("option", "", x[1]); o.value = x[0]; loc.appendChild(o); });
    loc.value = S.loc;
    var nut = tao("button", "adminNut adminNutPhu", "🔄 Tải lại"); nut.type = "button";
    hang.append(tim, loc, nut); t.appendChild(hang);
    var tom = tao("div", "qtrTom"); t.appendChild(tom);
    var hai = tao("div", "qtrHai"), ds = tao("div", "qtrDs"), ct = tao("div", "qtrCt");
    ds.id = "qtrDs"; ct.id = "qtrCt"; hai.append(ds, ct); t.appendChild(hai);
    var hen;
    tim.addEventListener("input", function () { clearTimeout(hen); hen = setTimeout(function () { S.tim = tim.value.trim(); napDs(); }, 350); });
    loc.addEventListener("change", function () { S.loc = loc.value; napDs(); });
    nut.addEventListener("click", function () { napDs(); if (S.chon) moBe(S.chon); });
    napDs();
    if (S.chon) moBe(S.chon); else ct.appendChild(tao("p", "adminGhiChu qtrGoiY", "👈 Bấm một bé để xem chi tiết, đồ thị và đặt lại trình độ."));
  }

  function napDs() {
    var ds = document.getElementById("qtrDs"); if (!ds) return;
    ds.innerHTML = '<p class="adminDangTai">Đang tải...</p>';
    goi("kc_td_admin_xem", { p_loc: S.loc, p_tim: S.tim }).then(function (r) {
      ds.innerHTML = "";
      if (!r.thanhCong) { ds.appendChild(tao("p", "qcpLoi", "⚠️ " + (r.thongBao || "Không tải được"))); return; }
      S.ds = r;
      var tom = document.querySelector("#qtrThan .qtrTom");
      if (tom) {
        tom.innerHTML = "";
        [["👦", (r.soBe | 0) + " bé có trình độ"], ["📝", (r.soLuotTuan | 0).toLocaleString("vi-VN") + " lượt 7 ngày"],
          [r.soLoiTuan ? "⚠️" : "✅", (r.soLoiTuan | 0) + " lỗi 7 ngày"]].forEach(function (x) { tom.appendChild(tao("span", "qtrChip", x[0] + " " + x[1])); });
      }
      if (!r.be.length) { ds.appendChild(tao("p", "adminGhiChu", S.loc || S.tim ? "Không có bé nào khớp." : "Chưa bé nào trả lời câu hỏi.")); return; }
      r.be.forEach(function (b) { ds.appendChild(theBe(b)); });
    });
  }

  function coChu(b) {
    var c = [];
    if (b.coLech && b.coLech.loai === "thap") c.push(["qtrCoLen", "⬆ có thể khai thấp"]);
    if (b.coLech && b.coLech.loai === "cao") c.push(["qtrCoXuong", "⬇ có thể khai cao"]);
    if (b.coLech && !b.coLech.loai) {
      (b.coLech.gioi || []).forEach(function (m) { c.push(["qtrCoNhe", "giỏi hơn lớp: " + tenMon(b, m)]); });
      (b.coLech.yeu || []).forEach(function (m) { c.push(["qtrCoNhe", "yếu hơn lớp: " + tenMon(b, m)]); });
    }
    (b.mon || []).forEach(function (m) {
      if (m.batThuong) c.push(["qtrCoBat", (m.batThuong > 0 ? "⚡ tiến bộ đột ngột: " : "❗ kém đột ngột: ") + m.ten]);
    });
    return c;
  }
  function tenMon(b, ma) { var m = (b.mon || []).filter(function (x) { return x.mon === ma; })[0]; return m ? m.ten : ma; }

  function theBe(b) {
    var n = tao("button", "qtrBe" + (S.chon === b.be ? " chon" : "")); n.type = "button"; n.dataset.be = b.be;
    var dau = tao("div", "qtrBeDau");
    dau.append(tao("strong", "", b.be), tao("span", "qtrBeLop", (b.nguon === "phu_huynh" ? "📋 " : b.nguon === "be" ? "🧒 " : "") + tenLop(b.lop)),
      tao("span", "qtrBeLuc", (b.soLuot | 0) + " lượt · " + ngay(b.lanCuoi)));
    n.appendChild(dau);
    var mon = tao("div", "qtrBeMon");
    (b.mon || []).forEach(function (m) {
      var c = tao("span", "qtrMonChip tc-" + m.tinCay);
      c.title = m.ten + ": θ " + so(m.theta) + ", tin cậy " + TIN[m.tinCay][1] + ", lớp đã mở " + m.lopDaMo + ", " + m.soLuot + " lượt";
      c.textContent = (m.bieuTuong || "") + " " + so(m.theta, 1) + " · mở " + m.lopDaMo;
      mon.appendChild(c);
    });
    n.appendChild(mon);
    var co = coChu(b);
    if (co.length) { var cw = tao("div", "qtrCoHang"); co.forEach(function (x) { cw.appendChild(tao("span", "qtrCo " + x[0], x[1])); }); n.appendChild(cw); }
    n.addEventListener("click", function () { moBe(b.be); });
    return n;
  }

  function moBe(be) {
    S.chon = be;
    Array.prototype.forEach.call(document.querySelectorAll("#qtrDs .qtrBe"), function (x) { x.classList.toggle("chon", x.dataset.be === be); });
    var ct = document.getElementById("qtrCt"); if (!ct) return;
    ct.innerHTML = '<p class="adminDangTai">Đang tải ' + be.replace(/</g, "") + "...</p>";
    goi("kc_td_admin_be", { p_be: be, p_ngay: S.ngay }).then(function (r) {
      if (S.chon !== be) return;
      ct.innerHTML = "";
      if (!r.thanhCong) { ct.appendChild(tao("p", "qcpLoi", "⚠️ " + (r.thongBao || "Không tải được"))); return; }
      S.ct = r;
      var ma = Object.keys(r.mon);
      if (!S.monDo || ma.indexOf(S.monDo) < 0) S.monDo = ma.sort(function (a, b) { return r.mon[b].soLuot - r.mon[a].soLuot; })[0] || null;
      veCt(ct, r);
      if (window.matchMedia && !window.matchMedia("(min-width: 1024px)").matches) ct.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function veCt(ct, r) {
    var t = r.tomTat;
    var dau = tao("div", "qtrCtDau");
    dau.append(tao("h4", "", "👦 " + t.be), tao("span", "qtrChip", "Lớp khai: " + tenLop(t.lop) + (t.nguon === "phu_huynh" ? " (phụ huynh nhập)" : t.nguon === "be" ? " (bé chọn ở Đấu Trường)" : "")));
    var dong = tao("button", "adminNut adminNutPhu qtrDong", "✕"); dong.type = "button"; dong.setAttribute("aria-label", "Đóng chi tiết");
    dong.addEventListener("click", function () { S.chon = null; S.ct = null; taiDs(); });
    dau.appendChild(dong);
    ct.appendChild(dau);
    var co = coChu(t);
    if (t.coLech && t.coLech.loai) {
      ct.appendChild(tao("p", "qtrBaoLech", t.coLech.loai === "thap"
        ? "💡 Bé làm tốt câu cao hơn lớp khai rõ rệt ở " + t.coLech.gioi.length + " môn. Có thể lớp trong hồ sơ thấp hơn thật (sửa ở 👦 Hồ sơ các bé). Chỉ người lớn thấy dòng này."
        : "💡 Bé làm thấp hơn lớp khai rõ rệt ở mọi môn đủ tin cậy. Có thể lớp trong hồ sơ cao hơn thật, hoặc bé cần ôn lớp dưới. Chỉ người lớn thấy dòng này."));
    }
    if (co.length) { var cw = tao("div", "qtrCoHang"); co.forEach(function (x) { cw.appendChild(tao("span", "qtrCo " + x[0], x[1])); }); ct.appendChild(cw); }
    var ma = Object.keys(r.mon);
    if (!ma.length) { ct.appendChild(tao("p", "adminGhiChu", "Bé chưa có trình độ môn nào.")); return; }
    ct.appendChild(veDoThi(r));
    var luoi = tao("div", "qtrMonLuoi");
    ma.sort(function (a, b) { return r.mon[b].soLuot - r.mon[a].soLuot; }).forEach(function (m) { luoi.appendChild(theMon(r, m)); });
    ct.appendChild(luoi);
    ct.appendChild(veDatLai(r));
    ct.appendChild(veGanDay(r));
  }

  function tenMonCt(r, m) { var x = r.tenMon[m]; return x ? (x[1] ? x[1] + " " : "") + x[0] : m; }

  function theMon(r, m) {
    var d = r.mon[m], k = tao("div", "qtrMon tc-" + d.tinCay + (m === S.monDo ? " chon" : ""));
    var dau = tao("div", "qtrMonDau");
    dau.append(tao("strong", "", tenMonCt(r, m)), tao("span", "qtrMonTheta", "θ " + so(d.theta)));
    k.appendChild(dau);
    var muc = d.soMuc || {};
    var dong = [
      ["Tin cậy", TIN[d.tinCay][0] + " " + TIN[d.tinCay][1] + (d.batThuong ? (d.batThuong > 0 ? " · ⚡ tiến bộ đột ngột" : " · ❗ kém đột ngột") : "")],
      ["Lớp khai / đã mở / hiệu lực", (d.lopKhai == null ? "–" : d.lopKhai) + " / " + d.lopDaMo + " / " + d.lopHieuLuc + (d.tran ? " (trần câu " + so(d.tran) + ")" : "")],
      ["Lượt · câu khác · sai", d.soLuot + " · " + d.soCauKhac + " · " + d.soSai],
      ["Dễ / Vừa / Khó", (muc.de | 0) + " / " + (muc.vua | 0) + " / " + (muc.kho | 0)],
      ["Bằng chứng (nEff / nW) · K", so(d.nEff, 1) + " / " + so(d.nW, 1) + " · " + so(d.k)],
      ["Dao động θ", d.daoDong == null ? "chưa đủ lượt" : so(d.daoDong)],
      ["θ xuất phát → cao nhất", so(d.theta0) + " → " + so(d.thetaMax)],
      ["Danh hiệu (bé thấy)", d.danhHieu ? d.danhHieu.bieuTuong + " " + d.danhHieu.ten + " " + "⭐".repeat(d.danhHieu.sao) + " · " + Math.round(d.diem) + (d.danhHieu.diemMocKe ? " / " + d.danhHieu.diemMocKe : "") + " điểm" : "–"]
    ];
    var thu = d.thuLop || [];
    if (thu.length || d.duocThu) {
      var dung = thu.filter(function (x) { return x === 1 || x === true || (x && x.dung); }).length;
      dong.push(["Thử lớp " + (d.lopDaMo + 1), (d.duocThu ? "đang được thử · " : "") + "đợt này " + dung + " / " + thu.length + " đúng"]);
    }
    var dl = tao("dl", "qtrMonSo");
    dong.forEach(function (x) { dl.append(tao("dt", "", x[0]), tao("dd", "", x[1])); });
    k.appendChild(dl);
    var h = tao("div", "qtrMonNut");
    var xem = tao("button", "qtrNutNho", "📈 Đồ thị"); xem.type = "button";
    xem.addEventListener("click", function () { S.monDo = m; veLai(); });
    var datN = tao("button", "qtrNutNho", "✏️ Đặt trình độ"); datN.type = "button";
    datN.addEventListener("click", function () { datTay(r.tomTat.be, m, d); });
    var lai = tao("button", "qtrNutNho qtrNutXoa", "🔄 Làm lại từ lớp khai"); lai.type = "button";
    lai.addEventListener("click", function () { lamLai(r.tomTat.be, m); });
    h.append(xem, datN, lai); k.appendChild(h);
    return k;
  }
  function veLai() { var ct = document.getElementById("qtrCt"); if (ct && S.ct) { ct.innerHTML = ""; veCt(ct, S.ct); } }

  function datTay(be, m, d) {
    var v = window.prompt("Đặt trình độ " + m + " của " + be + " (thang lớp, vd 4,3 = làm tốt câu đầu lớp 4; 0 đến 12,99).\n"
      + "Lớp đã mở = lớp khai hoặc phần nguyên của số này (lấy số lớn hơn). Danh hiệu của bé giữ nguyên.", so(d.theta, 1));
    if (v === null) return;
    var x = Number(String(v).replace(",", "."));
    if (!(x >= 0 && x <= 12.99)) { adminBaoTin("❌ Trình độ phải là số từ 0 đến 12,99", false); return; }
    var gc = window.prompt("Ghi chú (vì sao đặt lại, không bắt buộc):", "") || "";
    goi("kc_td_admin_dat", { p_be: be, p_mon: m, p_kieu: "dat", p_theta: x, p_ghi_chu: gc }).then(function (k) {
      if (!k.thanhCong) { adminBaoTin("❌ " + (k.thongBao || "Không đặt được"), false); return; }
      adminBaoTin("Đã đặt trình độ " + m + " = " + so(k.theta) + ", lớp đã mở " + k.lopDaMo, true);
      moBe(be); napDs();
    });
  }
  function lamLai(be, m) {
    if (!window.confirm("Làm lại trình độ " + m + " của " + be + " từ lớp khai (như bé mới)?\nDùng khi anh chị đã chơi hộ hoặc trình độ lệch hẳn. Danh hiệu của bé giữ nguyên. Hoàn tác được nếu bé chưa trả lời thêm câu môn này.")) return;
    var gc = window.prompt("Ghi chú (vì sao làm lại, không bắt buộc):", "") || "";
    goi("kc_td_admin_dat", { p_be: be, p_mon: m, p_kieu: "khoi_lai", p_theta: null, p_ghi_chu: gc }).then(function (k) {
      if (!k.thanhCong) { adminBaoTin("❌ " + (k.thongBao || "Không làm lại được"), false); return; }
      adminBaoTin("Đã làm lại " + m + ": θ = " + so(k.theta) + ", lớp đã mở " + k.lopDaMo, true);
      moBe(be); napDs();
    });
  }

  function veDatLai(r) {
    var k = tao("div", "qcpKhoi qtrKhoi");
    k.appendChild(tao("h4", "", "🔄 Các lần đặt lại trình độ"));
    if (!r.datLai.length) { k.appendChild(tao("p", "adminGhiChu", "Chưa đặt lại lần nào.")); return k; }
    var ul = tao("ul", "qtrLs");
    r.datLai.forEach(function (x) {
      var li = tao("li");
      var ten = x.kieu === "dat" ? "✏️ Đặt tay" : x.kieu === "khoi_lai" ? "🔄 Làm lại" : "↩ Hoàn tác";
      li.appendChild(tao("span", "", ngay(x.luc) + " · " + ten + " " + tenMonCt(r, x.mon) + ": θ " + so(x.thetaTruoc) + " → " + so(x.thetaSau)
        + " · " + (x.nguoi || "") + (x.ghiChu ? " · " + x.ghiChu : "")));
      if (x.kieu !== "hoan_tac") {
        var n = tao("button", "qtrNutNho", "↩ Hoàn tác"); n.type = "button";
        n.addEventListener("click", function () {
          if (!window.confirm("Hoàn tác lần đặt lại này?")) return;
          goi("kc_td_admin_hoan_tac_dat", { p_id: x.id }).then(function (kq) {
            if (!kq.thanhCong) { adminBaoTin("❌ " + (kq.thongBao || "Không hoàn tác được"), false); return; }
            adminBaoTin("Đã hoàn tác", true); moBe(r.tomTat.be); napDs();
          });
        });
        li.appendChild(n);
      }
      ul.appendChild(li);
    });
    k.appendChild(ul);
    return k;
  }

  function veGanDay(r) {
    var k = tao("div", "qcpKhoi qtrKhoi");
    k.appendChild(tao("h4", "", "🧾 20 lần cập nhật gần nhất (vì sao trình độ đổi)"));
    if (!r.ganDay.length) { k.appendChild(tao("p", "adminGhiChu", "Chưa có.")); return k; }
    var cuon = tao("div", "qtrCuon"), b = tao("table", "qtrBang");
    var h = tao("tr");
    ["Lúc", "Môn", "Câu", "b", "p", "Kết quả", "w", "θ trước → sau"].forEach(function (x) { h.appendChild(tao("th", "", x)); });
    b.appendChild(h);
    r.ganDay.forEach(function (x) {
      var tr = tao("tr");
      var cau = tao("td", "qtrCauNd", (x.lop != null ? "L" + x.lop + " " : "") + (MUC[x.muc] || "") + " · " + (x.noiDung || "#" + x.cauId));
      cau.title = x.noiDung || "";
      tr.append(tao("td", "", ngay(x.luc)), tao("td", "", (r.tenMon[x.mon] || [x.mon])[1] || x.mon), cau, tao("td", "", so(x.b)), tao("td", "", so(x.p)),
        tao("td", x.r ? "qtrDung" : "qtrSai", (x.r ? "✔ đúng" : "✘ sai") + (x.laThu ? " ⭐thử" : "") + (x.moLop ? " 🎓mở lớp" : "")),
        tao("td", "", so(x.w)), tao("td", "", so(x.truoc) + " → " + so(Number(x.truoc) + Number(x.delta)) + " (" + (x.delta >= 0 ? "+" : "") + so(x.delta, 3) + ")"));
      b.appendChild(tr);
    });
    cuon.appendChild(b); k.appendChild(cuon);
    k.appendChild(tao("p", "adminGhiChu", "b = độ khó câu, p = xác suất đúng dự đoán, w = trọng số lượt (câu gặp lại / hỏi lại / bấm vội tính ít hoặc 0). θ đổi = K × w × (kết quả − p), có giới hạn mỗi câu."));
    return k;
  }

  // ---------------- 📈 ĐỒ THỊ θ ----------------
  function veDoThi(r) {
    var k = tao("div", "qcpKhoi qtrKhoi qtrDoThi");
    var dau = tao("div", "qtrDoThiDau");
    dau.appendChild(tao("h4", "", "📈 Trình độ theo thời gian"));
    var chon = tao("select"); chon.setAttribute("aria-label", "Môn");
    Object.keys(r.mon).forEach(function (m) { var o = tao("option", "", tenMonCt(r, m) + " (" + r.mon[m].soLuot + " lượt)"); o.value = m; chon.appendChild(o); });
    chon.value = S.monDo || "";
    chon.addEventListener("change", function () { S.monDo = chon.value; veLai(); });
    var kh = tao("select"); kh.setAttribute("aria-label", "Khoảng thời gian");
    [[7, "7 ngày"], [30, "30 ngày"], [120, "120 ngày"], [400, "400 ngày"]].forEach(function (x) { var o = tao("option", "", x[1]); o.value = x[0]; kh.appendChild(o); });
    kh.value = String(S.ngay);
    kh.addEventListener("change", function () { S.ngay = Number(kh.value); moBe(r.tomTat.be); });
    dau.append(chon, kh);
    k.appendChild(dau);
    var d = (r.duong[S.monDo] || []), mon = r.mon[S.monDo];
    if (d.length < 2) { k.appendChild(tao("p", "adminGhiChu", "Chưa đủ lượt trong " + S.ngay + " ngày để vẽ (nhật ký giữ 120 ngày).")); return k; }
    k.appendChild(svgDuong(d, mon));
    k.appendChild(tao("p", "adminGhiChu", "Đường = θ sau mỗi câu, theo thứ tự lượt (dưới trục ghi ngày; thang lớp: θ 4,3 = làm tốt câu đầu lớp 4). Vạch đứt = lớp đã mở hiện tại. 🎓 = lúc mở lớp mới. "
      + (d.length >= 400 ? "Nhiều lượt nên chỉ vẽ ~400 điểm đại diện. " : "") + "Rê chuột / chạm vào đồ thị để xem từng điểm."));
    return k;
  }

  function svgDuong(d, mon) {
    var NS = "http://www.w3.org/2000/svg", W = 640, H = 240, L = 34, R = 10, T = 12, B = 26;
    // trục ngang = thứ tự lượt (bé hay làm dồn nhiều câu trong vài phút rồi nghỉ vài ngày: theo giờ thì dồn cục), nhãn = ngày
    var t0 = 0, t1 = Math.max(1, d.length - 1);
    var ys = d.map(function (p) { return p[1]; }).concat([mon.lopDaMo, mon.lopDaMo + 1]);
    var y0 = Math.max(0, Math.floor(Math.min.apply(null, ys)) - 0), y1 = Math.min(13, Math.ceil(Math.max.apply(null, ys)));
    if (y1 - y0 < 2) y1 = y0 + 2;
    var X = function (t) { return L + (t - t0) / (t1 - t0) * (W - L - R); }, Y = function (v) { return T + (y1 - v) / (y1 - y0) * (H - T - B); };
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.setAttribute("class", "qtrSvg");
    svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "Đồ thị trình độ theo thời gian, " + d.length + " điểm, hiện tại " + so(d[d.length - 1][1]));
    function e(ten, a, chu) { var x = document.createElementNS(NS, ten); for (var k in a) x.setAttribute(k, a[k]); if (chu != null) x.textContent = chu; svg.appendChild(x); return x; }
    for (var v = y0; v <= y1; v++) {
      e("line", { x1: L, x2: W - R, y1: Y(v), y2: Y(v), "class": "qtrLuoi" });
      e("text", { x: L - 6, y: Y(v) + 4, "class": "qtrTruc", "text-anchor": "end" }, String(v));
    }
    [0, Math.round(t1 / 2), t1].forEach(function (t, i) {
      e("text", { x: X(t), y: H - 6, "class": "qtrTruc", "text-anchor": i === 0 ? "start" : i === 2 ? "end" : "middle" },
        new Date(d[t][0]).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }));
    });
    e("line", { x1: L, x2: W - R, y1: Y(mon.lopDaMo), y2: Y(mon.lopDaMo), "class": "qtrMoc" });
    e("text", { x: W - R - 2, y: Y(mon.lopDaMo) - 4, "class": "qtrMocChu", "text-anchor": "end" }, "đã mở lớp " + mon.lopDaMo);
    e("polyline", { points: d.map(function (p, i) { return X(i).toFixed(1) + "," + Y(p[1]).toFixed(1); }).join(" "), "class": "qtrDuong" });
    d.forEach(function (p, i) { if (p[4]) e("text", { x: X(i), y: Y(p[1]) - 8, "text-anchor": "middle", "class": "qtrMoLop" }, "🎓"); });
    var cuoi = d[d.length - 1];
    e("circle", { cx: X(d.length - 1), cy: Y(cuoi[1]), r: 4.5, "class": "qtrDiemCuoi" });
    // lớp tương tác
    var doc = e("line", { y1: T, y2: H - B, "class": "qtrDoc", visibility: "hidden" });
    var cham = e("circle", { r: 5, "class": "qtrCham", visibility: "hidden" });
    var vung = e("rect", { x: L, y: 0, width: W - L - R, height: H, fill: "transparent" });
    var bo = tao("div", "qtrBoc"), tip = tao("div", "qtrTip"); tip.hidden = true;
    bo.append(svg, tip);
    function hien(ev) {
      var hop = svg.getBoundingClientRect(), x = (ev.clientX - hop.left) / hop.width * W;
      var i = Math.max(0, Math.min(d.length - 1, Math.round((x - L) / (W - L - R) * t1))), p = d[i];
      doc.setAttribute("x1", X(i)); doc.setAttribute("x2", X(i)); doc.setAttribute("visibility", "visible");
      cham.setAttribute("cx", X(i)); cham.setAttribute("cy", Y(p[1])); cham.setAttribute("visibility", "visible");
      tip.hidden = false;
      tip.textContent = new Date(p[0]).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
        + " · lượt " + (i + 1) + " · θ " + so(p[1]) + " · " + (p[2] ? "✔ đúng" : "✘ sai") + (p[3] ? " · ⭐ câu thử lớp mới" : "") + (p[4] ? " · 🎓 mở lớp" : "");
      var px = X(i) / W * hop.width;
      tip.style.left = Math.max(0, Math.min(hop.width - tip.offsetWidth, px - tip.offsetWidth / 2)) + "px";
    }
    function an() { doc.setAttribute("visibility", "hidden"); cham.setAttribute("visibility", "hidden"); tip.hidden = true; }
    vung.addEventListener("pointermove", hien); vung.addEventListener("pointerdown", hien); vung.addEventListener("pointerleave", function (ev) { if (ev.pointerType === "mouse") an(); });   // chạm: giữ điểm sau khi nhấc tay
    return bo;
  }

  // ================= 🎛️ THÔNG SỐ =================
  function taiSo() {
    var t = document.getElementById("qtrThan");
    t.innerHTML = '<p class="adminDangTai">Đang tải...</p>';
    goi("kc_td_admin_doc").then(function (r) {
      t.innerHTML = "";
      if (!r.thanhCong) { t.appendChild(tao("p", "qcpLoi", "⚠️ " + (r.thongBao || "Không tải được"))); return; }
      S.ch = r;
      t.appendChild(tao("p", "adminGhiChu", "Mọi số của module trình độ dùng chung (Đấu Trường, ôn sau trận, Thử Thách...). Đang dùng phiên bản " + r.phienBan
        + ". Số mặc định đã chốt bằng mô phỏng KC_08B: chỉ sửa khi hiểu rõ. Ô viền cam là số khác mặc định. Lưu xong, lượt trả lời mới dùng số mới ngay; trang chơi lấy số mới ở trận / lượt sau."));
      var hai = tao("div", "qcpHai qtrSoHai"), trai = tao("div", "qtmCot"), phai = tao("div", "qtmCot");
      var nhom = {};
      NHOM.forEach(function (n) {
        var k = tao("div", "qcpKhoi"); k.appendChild(tao("h4", "", n[1]));
        var luoi = tao("div", "qcpKho qtrSoLuoi"); k.appendChild(luoi); k.appendChild(tao("p", "adminGhiChu", n[2]));
        nhom[n[0]] = { k: k, luoi: luoi };
      });
      r.khoa.forEach(function (x) {
        var p = x.duong.join("."), nh = NHAN[p] || ["chon", p, 0.01];
        nhom[nh[0]].luoi.appendChild(oSo(x.duong, nh[1], x.thap, x.cao, nh[2], lay(r.cauHinh, x.duong), lay(r.macDinh, x.duong)));
      });
      NHOM.forEach(function (n, i) { (i < 5 ? trai : phai).appendChild(nhom[n[0]].k); });
      phai.appendChild(veNutSo());
      phai.appendChild(veLichSu(r));
      hai.append(trai, phai); t.appendChild(hai);
    });
  }
  function oSo(duong, ten, lo, hi, buoc, gt, md) {
    var w = tao("label", "qcpO");
    var i = tao("input"); i.type = "number"; i.step = String(buoc); i.min = String(lo); i.max = String(hi); i.value = gt; i.setAttribute("aria-label", ten);
    i.dataset.duong = JSON.stringify(duong); i.title = "Từ " + soVi(lo) + " đến " + soVi(hi) + " · mặc định " + soVi(md);
    var nut = tao("button", "qcpVe", "↺"); nut.type = "button";
    function to() { var khac = Number(i.value) !== Number(md); w.classList.toggle("khac", khac); nut.hidden = !khac; nut.title = "Về mặc định (" + soVi(md) + ")"; }
    i.addEventListener("input", to);
    nut.addEventListener("click", function () { i.value = md; to(); });
    w.append(tao("small", "", ten), i, nut); to();
    return w;
  }
  function veNutSo() {
    var k = tao("div", "qcpKhoi");
    k.appendChild(tao("h4", "", "💾 Lưu"));
    var gc = tao("input", "qtrGhiChuO"); gc.placeholder = "Ghi chú lần sửa (không bắt buộc)"; gc.maxLength = 200; gc.setAttribute("aria-label", "Ghi chú");
    var h = tao("div", "adminHang");
    var luu = tao("button", "adminNut adminNutThanhCong", "💾 Lưu thông số"); luu.type = "button";
    var ve = tao("button", "adminNut adminNutPhu", "↺ Về mặc định cả bảng"); ve.type = "button";
    var tb = tao("p", "qcpTb"); tb.setAttribute("aria-live", "polite");
    h.append(luu, ve); k.append(gc, h, tb);
    function gui(gv, md) {
      luu.disabled = ve.disabled = true; tb.className = "qcpTb"; tb.textContent = "Đang lưu...";
      goi("kc_td_admin_luu_cau_hinh", { p_gia_tri: gv, p_ve_mac_dinh: !!md, p_ghi_chu: gc.value.trim() }).then(function (kq) {
        luu.disabled = ve.disabled = false;
        if (!kq.thanhCong) { tb.className = "qcpTb xau"; tb.textContent = "⚠️ " + (kq.thongBao || "Không lưu được"); return; }
        adminBaoTin(kq.doi ? "Đã lưu thông số trình độ (phiên bản " + kq.phienBan + ")" : "Không có số nào thay đổi", true);
        taiSo();
      });
    }
    luu.addEventListener("click", function () {
      var gv = JSON.parse(JSON.stringify(S.ch.cauHinh)), loi = null;
      Array.prototype.forEach.call(document.querySelectorAll("#qtrThan input[data-duong]"), function (i) {
        var duong = JSON.parse(i.dataset.duong), v = Number(i.value);
        if (i.value === "" || !(v >= Number(i.min) && v <= Number(i.max))) loi = loi || (i.getAttribute("aria-label") + ": số từ " + soVi(i.min) + " đến " + soVi(i.max));
        dat(gv, duong, v);
      });
      if (loi) { tb.className = "qcpTb xau"; tb.textContent = "⚠️ " + loi; return; }
      gui(gv, false);
    });
    ve.addEventListener("click", function () { if (window.confirm("Đưa MỌI số trình độ về mặc định?")) gui({}, true); });
    return k;
  }
  // phẳng hoá để so lần sửa: "K.K0" -> số
  function phang(o, tien, kq) {
    kq = kq || {};
    Object.keys(o || {}).forEach(function (k) {
      var v = o[k], ten = tien ? tien + "." + k : k;
      if (v && typeof v === "object" && !Array.isArray(v)) phang(v, ten, kq);
      else if (Array.isArray(v) && v.every(function (x) { return typeof x === "number"; })) v.forEach(function (x, i) { kq[ten + "." + i] = x; });
      else kq[ten] = JSON.stringify(v);
    });
    return kq;
  }
  function tron(a, b) {
    var kq = JSON.parse(JSON.stringify(a));
    (function g(x, y) { Object.keys(y || {}).forEach(function (k) {
      if (x[k] && typeof x[k] === "object" && !Array.isArray(x[k]) && y[k] && typeof y[k] === "object" && !Array.isArray(y[k])) g(x[k], y[k]); else x[k] = y[k];
    }); })(kq, b);
    return kq;
  }
  function veLichSu(r) {
    var k = tao("div", "qcpKhoi");
    k.appendChild(tao("h4", "", "🕘 Lịch sử sửa thông số"));
    if (!r.lichSu.length) { k.appendChild(tao("p", "adminGhiChu", "Chưa sửa lần nào: mọi số đang là mặc định.")); return k; }
    var ul = tao("ul", "qtrLs");
    r.lichSu.forEach(function (x) {
      var a = phang(tron(r.macDinh, x.truoc)), b = phang(tron(r.macDinh, x.sau)), doi = [];
      Object.keys(b).forEach(function (p) { if (a[p] !== b[p]) doi.push(((NHAN[p] || [])[1] || p) + ": " + soVi(a[p]) + " → " + soVi(b[p])); });
      var li = tao("li");
      li.appendChild(tao("span", "", ngay(x.luc) + " · bản " + x.phienBan + " · " + (x.nguoi || "") + (x.ghiChu ? " · " + x.ghiChu : "")
        + (doi.length ? " — " + doi.slice(0, 6).join("; ") + (doi.length > 6 ? "; … (+" + (doi.length - 6) + ")" : "") : "")));
      var n = tao("button", "qtrNutNho", "↩ Hoàn tác"); n.type = "button"; n.title = "Đưa các số về đúng như trước lần sửa này";
      n.addEventListener("click", function () {
        if (!window.confirm("Đưa thông số về đúng như TRƯỚC lần sửa này (bản " + (x.phienBan - 1) + ")?")) return;
        goi("kc_td_admin_hoan_tac_cau_hinh", { p_id: x.id }).then(function (kq) {
          if (!kq.thanhCong) { adminBaoTin("❌ " + (kq.thongBao || "Không hoàn tác được"), false); return; }
          adminBaoTin("Đã hoàn tác (phiên bản " + kq.phienBan + ")", true); taiSo();
        });
      });
      li.appendChild(n); ul.appendChild(li);
    });
    k.appendChild(ul);
    return k;
  }

  // ================= 🩺 MÁY CHỦ =================
  function taiMay() {
    var t = document.getElementById("qtrThan");
    t.innerHTML = '<p class="adminDangTai">Đang tải...</p>';
    goi("kc_td_admin_xem", { p_loc: "co", p_tim: "§khong_ai§" }).then(function (r) {
      t.innerHTML = "";
      if (!r.thanhCong) { t.appendChild(tao("p", "qcpLoi", "⚠️ " + (r.thongBao || "Không tải được"))); return; }
      var k = tao("div", "qcpKhoi");
      k.appendChild(tao("h4", "", "🔁 Đối soát (tính bù lượt trả lời còn sót)"));
      k.appendChild(tao("p", "", r.lichDoiSoat ? "✅ Máy chủ tự đối soát mỗi đêm lúc 02:50 (trước việc dọn dữ liệu 03:00), xét lượt 3 ngày gần nhất."
        : "⚠️ Chưa có lịch đối soát đêm (máy chủ chưa bật pg_cron). Bấm nút dưới để đối soát tay."));
      k.appendChild(tao("p", "adminGhiChu", "Mỗi câu bé trả lời đã tự cập nhật trình độ ngay lúc đó. Đối soát chỉ tính bù lượt bị sót khi máy chủ gặp lỗi; thường ra 0."));
      var h = tao("div", "adminHang"), sel = tao("select"), nut = tao("button", "adminNut", "🔁 Đối soát ngay"); nut.type = "button";
      sel.setAttribute("aria-label", "Số ngày");
      [[3, "3 ngày gần nhất"], [30, "30 ngày"], [120, "120 ngày"]].forEach(function (x) { var o = tao("option", "", x[1]); o.value = x[0]; sel.appendChild(o); });
      var tb = tao("p", "qcpTb"); tb.setAttribute("aria-live", "polite");
      nut.addEventListener("click", function () {
        nut.disabled = true; tb.className = "qcpTb"; tb.textContent = "Đang đối soát...";
        goi("kc_td_admin_doi_soat", { p_ngay: Number(sel.value) }).then(function (kq) {
          nut.disabled = false;
          if (!kq.thanhCong) { tb.className = "qcpTb xau"; tb.textContent = "⚠️ " + (kq.thongBao || "Lỗi"); return; }
          tb.textContent = "✅ Đã tính bù " + kq.daTinh + " lượt.";
        });
      });
      h.append(sel, nut); k.append(h, tb); t.appendChild(k);
      var l = tao("div", "qcpKhoi");
      l.appendChild(tao("h4", "", "⚠️ Lỗi trình độ gần đây (" + (r.soLoiTuan | 0) + " lỗi 7 ngày)"));
      if (!r.loi.length) l.appendChild(tao("p", "adminGhiChu", "Không có lỗi. Lỗi (nếu có) không làm hỏng lượt trả lời của bé: bé vẫn được chấm, chỉ trình độ chưa cập nhật lượt đó."));
      else {
        var ul = tao("ul", "qtrLs");
        r.loi.forEach(function (x) { ul.appendChild(tao("li", "", ngay(x.luc) + " · " + (x.be || "?") + " · lượt " + (x.luotId || "?") + " · " + x.loi)); });
        l.appendChild(ul);
      }
      t.appendChild(l);
    });
  }
})();
// 24/11/2026 - BƯỚC: KC_08F1
