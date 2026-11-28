// ================================================================
// FILE: kc/kc_hoc_cua_be.js
// CHỨC NĂNG: Khối "🎓 Học của con" DÙNG CHUNG cho 2 nơi - KC_03B3:
//   - Quản trị › 👦 Hồ sơ các bé › tiểu mục 🎓 Học & thẻ nhớ (admin, mọi bé) - gắn ở qt_ghi_nho.js;
//   - khu phụ huynh (thuthach_NC.html › Các con của tôi › nút 🎓 Học của con) - gắn ở tt_phuhuynh.js.
//   Người lớn sửa: lớp hiện tại (lưu thành năm vào lớp 1, tự lên lớp ngày 1/9), vùng, nhánh THPT; thẻ riêng của bé
//   (khuôn hỏi đáp: số điện thoại bố mẹ, địa chỉ nhà...); bật chủ đề nhạy cảm theo môn; giao thêm / bỏ thẻ hoặc bộ thẻ.
//   Máy chủ tự kiểm quyền (admin hoặc phụ huynh đã liên kết): RPC kc_hs_xem, kc_hs_tim, kc_hs_luu_ho_so, kc_hs_giao,
//   kc_hs_the_rieng_luu, kc_hs_the_rieng_xoa (SQL/supabase_kc03b3_giao_the.sql, repo riêng).
// CÁCH DÙNG: KcHocCuaBe.mo(khungDom, { be: "tên bé", goi: function (tenHam, thamSo) -> Promise<kết quả RPC> })
//   `goi` tự thêm p_nguoi + p_ma_phien của người đang đăng nhập. Hai khổ: điện thoại 1 cột, máy tính 2 cột (kc_hoc_cua_be.css).
// BƯỚC: KC_03B3 - NGÀY: 18/11/2026
// CẬP NHẬT: 18/11/2026 - KC_03B3 (người dùng thử): thêm nhánh bằng TÊN tiếng Việt (tự đặt mã bỏ dấu, RPC kc_hs_them_nhanh,
//   tên lưu ở kc_nhanh_hoc, SQL supabase_kc03b3b_nhanh.sql); đổi lớp thì dòng gợi ý đổi theo ngay.
// CẬP NHẬT: 24/11/2026 18:00 - KC_03C2: ô "🪙 xu vàng" của bé ở đầu khối (RPC kc_vi_vang_xem, SQL supabase_kc03c2_vi_vang.sql).
// CẬP NHẬT: 24/11/2026 22:xx - KC_08F1: khối "🎯 Con đang học tới đâu" (đầu cột trái): mỗi môn một dòng chữ "đang làm tốt câu
//   khoảng lớp N (khá chắc)", lời báo lớp khai lệch trung tính + [✏️ Sửa lớp] [Giữ nguyên], dấu làm kém / tiến bộ đột ngột.
//   Không số thập phân. RPC kc_td_phu_huynh (SQL supabase_kc08f1_quan_tri.sql). Chỉ người lớn thấy, bé không thấy.
// CẬP NHẬT: 28/11/2026 - KC_11E: khối "🦉 Con chọn vội" (lượt bị Cô Cú kết luận bấm bừa trong phu_huynh.bao_ngay ngày, bấm xem
//   từng lượt; tô đậm từ phu_huynh.bao_lan lượt; số 30 ngày cho Hồ sơ bé). RPC kc_bb_phu_huynh (SQL supabase_kc11e_quan_tri_bb.sql).
// ================================================================
(function () {
  "use strict";
  var NHANH_TEN = { thpt_cong_nghiep: "Định hướng Công nghiệp (THPT)", thpt_nong_nghiep: "Định hướng Nông nghiệp (THPT)" };
  var VUNG = [["", "Chưa chọn"], ["bac", "Miền Bắc"], ["trung", "Miền Trung"], ["nam", "Miền Nam"]];
  var MAU_THE = {
    dien_thoai: { tieuDe: "Số điện thoại của bố mẹ", nguCanh: "Khi bị lạc hoặc cần giúp, con đọc số này cho cô chú công an / bảo vệ gọi giúp.",
      cap: [{ hoi: "Số điện thoại của mẹ là gì?", dap: "" }, { hoi: "Số điện thoại của bố là gì?", dap: "" }] },
    dia_chi: { tieuDe: "Nhà mình ở đâu", nguCanh: "Con nhớ địa chỉ để nói khi cần người lớn đưa về nhà.",
      cap: [{ hoi: "Nhà con ở số mấy, đường nào?", dap: "" }, { hoi: "Nhà con ở phường / xã nào, tỉnh / thành phố nào?", dap: "" }] }
  };

  function thoat(x) {
    return String(x === null || x === undefined ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function chuLop(tu, den) {
    if (tu === null || tu === undefined) return "";
    var t = tu === 0 ? "Mẫu giáo" : "Lớp " + tu;
    if (den === null || den === undefined) return tu === 0 ? "Mọi lớp" : "Từ lớp " + tu;
    return den === tu ? t : t + "-" + den;
  }
  function tenLop(l) { return l === 0 ? "Mẫu giáo (lớp 0)" : "Lớp " + l; }
  // Tên -> mã nhánh: bỏ dấu, chữ thường, a-z 0-9 _ (vd "Công nghệ thông tin (CNTT)" -> cong_nghe_thong_tin_cntt)
  function maTuTen(ten) {
    return String(ten || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase()
      .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40).replace(/_+$/, "");
  }

  function KhoiHoc(khung, ch) {
    this.k = khung; this.be = ch.be; this.goi = ch.goi;
    this.d = null; this.tim = { chu: "", mon: "", kq: null }; this.sua = null; this.lanTai = 0;
    var self = this;
    khung.classList.add("hcb");
    khung.onclick = function (e) { self.bam(e); };
    khung.onchange = function (e) {
      if (e.target && e.target.classList.contains("hcbLop")) {
        var o = khung.querySelector(".hcbGoiYLop");
        if (o) o.textContent = self.goiYLop(e.target.value === "" ? null : Number(e.target.value));
      }
    };
    khung.onkeydown = function (e) {
      if (e.key === "Enter" && e.target && e.target.classList.contains("hcbONhanh")) { e.preventDefault(); self.themNhanh(); return; }
      if (e.key === "Enter" && e.target && e.target.classList.contains("hcbOTim")) { e.preventDefault(); self.timThe(); }
    };
    this.tai();
  }

  KhoiHoc.prototype.goiRpc = function (ten, ts) {
    ts = ts || {}; ts.p_be = this.be;
    return this.goi(ten, ts).then(function (kq) { return kq || { thanhCong: false, thongBao: "Không có phản hồi" }; },
      function () { return { thanhCong: false, thongBao: "Không kết nối được máy chủ." }; });
  };

  KhoiHoc.prototype.bao = function (chu, tot) {
    var o = this.k.querySelector(".hcbTin");
    if (!o) return;
    o.textContent = chu; o.className = "hcbTin hien " + (tot ? "tot" : "xau");
    clearTimeout(this.henTin);
    this.henTin = setTimeout(function () { o.className = "hcbTin"; }, tot ? 2500 : 6000);
  };

  KhoiHoc.prototype.tai = function () {
    var self = this, so = ++this.lanTai;
    if (!this.d) this.k.innerHTML = '<p class="hcbGhiChu">Đang tải việc học của bé...</p>';
    return this.goiRpc("kc_hs_xem").then(function (kq) {
      if (so !== self.lanTai) return;
      if (!kq.thanhCong) {
        self.k.innerHTML = '<p class="hcbGhiChu">❌ ' + thoat(kq.thongBao || "Chưa đọc được") + "</p>";
        return;
      }
      self.d = kq; self.ve();
      self.taiVang(so);
      self.taiTrinhDo(so);
      self.taiBamBua(so);
    });
  };

  // KC_11E: lượt con chọn vội (chống bấm bừa) — chỉ thông tin cho người lớn, không thông báo đẩy (đặc tả 5.3).
  //   RPC kc_bb_phu_huynh (admin hoặc phụ huynh đã liên kết; SQL supabase_kc11e_quan_tri_bb.sql). Máy chủ cũ chưa có: ẩn khối.
  KhoiHoc.prototype.taiBamBua = function (so) {
    var self = this;
    this.goiRpc("kc_bb_phu_huynh").then(function (kq) {
      if (so !== self.lanTai) return;
      self.bb = kq && kq.thanhCong ? kq : null;
      var o = self.k.querySelector(".hcbBamBua");
      if (o) o.outerHTML = self.veBamBua();
    });
  };
  var TEN_NOI_BB = { theo_mon: "📚 Theo môn", tong_hop: "🌈 Tổng hợp", on_sau_tran: "⚔️ Ôn sau trận", toc_do: "⚡ Tốc độ", chinh_phuc: "🏆 Chinh phục" };
  var TEN_KN_BB = { cho_be: "con chưa phản hồi", be_gui: "con đã viết lý do, chờ Cô Cú xem", chap_nhan: "✅ Cô Cú đã trả thưởng", giu_nguyen: "↩️ giữ nguyên", het_han: "quá hạn phản hồi" };
  KhoiHoc.prototype.veBamBua = function () {
    var b = this.bb;
    if (!b) return '<section class="hcbKhoi hcbBamBua" hidden></section>';
    var ds = b.ds || [], n = b.soCat | 0, dam = n >= (b.baoLan || 3);
    var ngay = b.soNgay === 7 ? "Tuần này" : b.soNgay + " ngày qua";
    var dau = '<section class="hcbKhoi hcbBamBua' + (dam ? " hcbBbDam" : "") + '"><h4>🦉 Con chọn vội</h4>';
    if (!ds.length) return dau + '<p>' + ngay + ' con không có lượt nào chọn vội. 👍</p>'
      + (b.so30 ? '<p class="hcbGhiChu">30 ngày qua: ' + b.so30 + " lượt.</p>" : "") + "</section>";
    var chu = '<p>' + ngay + ' <strong>' + n + ' lượt con chọn vội (không có thưởng)</strong>'
      + (ds.length > n ? " và " + (ds.length - n) + " lượt Cô Cú chỉ ghi lại" : "") + ".</p>";
    if (dam) chu += '<p class="hcbGhiChu">Bố mẹ có thể nhắc con: đọc kỹ câu hỏi rồi mới chọn, làm thật sẽ được nhiều 💎 hơn.</p>';
    var hang = ds.map(function (x) {
      var d = new Date(x.luc), h = function (s) { return ("0" + s).slice(-2); };
      var luc = isNaN(d) ? "" : h(d.getDate()) + "/" + h(d.getMonth() + 1) + " " + h(d.getHours()) + ":" + h(d.getMinutes());
      var noi = x.noi === "theo_mon" && x.monTen ? (x.monBieuTuong || "📚") + " " + x.monTen : (TEN_NOI_BB[x.noi] || x.noi);
      var dh = [x.d1 ? "bấm dồn " + x.d1 : "", x.d2 ? "chạm ngay " + x.d2 : "", x.d3 ? "nhanh như đoán " + x.d3 : ""].filter(Boolean).join(", ");
      return "<li><strong>" + thoat(luc) + "</strong> · " + thoat(noi) + ": " + (x.soDauHieu | 0) + " / " + (x.soCau | 0) + " câu chọn vội"
        + (dh ? ' <span class="hcbGhiChu">(' + thoat(dh) + ")</span>" : "")
        + (x.catThuong ? " · không có thưởng" + (x.khangNghi ? " · " + thoat(TEN_KN_BB[x.khangNghi] || x.khangNghi) : "") : " · chỉ ghi, vẫn có thưởng") + "</li>";
    }).join("");
    return dau + chu + '<details class="hcbBbXem"><summary>Xem từng lượt</summary><ul class="hcbTdDs">' + hang + "</ul></details>"
      + '<p class="hcbGhiChu">30 ngày qua: ' + (b.so30 | 0) + ' lượt. Mỗi lượt Cô Cú xét riêng; số này không làm lượt sau bị xét chặt hơn. Con thấy oan thì tự viết lý do, Cô Cú xem lại.</p></section>';
  };

  // KC_03C2: 🪙 xu vàng của bé (ví chung toàn app, RPC kc_vi_vang_xem; admin hoặc phụ huynh đã liên kết)
  KhoiHoc.prototype.taiVang = function (so) {
    var self = this;
    this.goiRpc("kc_vi_vang_xem").then(function (kq) {
      if (so !== self.lanTai || !kq || !kq.thanhCong) return;
      self.vang = { soDu: Number(kq.soDu) || 0, homNay: Number(kq.homNay) || 0 };
      var o = self.k.querySelector(".hcbChipVang");
      if (o) o.outerHTML = self.veVang();
    });
  };

  KhoiHoc.prototype.veVang = function () {
    if (!this.vang) return '<span class="hcbChip hcbChipVang" hidden></span>';
    return '<span class="hcbChip hcbChipVang" title="Xu vàng dùng chung cả app (khác Vàng mỏ của Đấu Trường)">🪙 '
      + this.vang.soDu.toLocaleString("vi-VN") + " xu vàng"
      + (this.vang.homNay > 0 ? " · hôm nay +" + this.vang.homNay.toLocaleString("vi-VN") : "") + "</span>";
  };

  // KC_08F1: trình độ của bé dạng chữ cho người lớn (admin / phụ huynh đã liên kết; RPC kc_td_phu_huynh)
  KhoiHoc.prototype.taiTrinhDo = function (so) {
    var self = this;
    this.goiRpc("kc_td_phu_huynh").then(function (kq) {
      if (so !== self.lanTai) return;
      self.td = kq && kq.thanhCong ? kq : { loi: (kq && kq.thongBao) || "Chưa đọc được" };
      var o = self.k.querySelector(".hcbTrinhDo");
      if (o) o.outerHTML = self.veTrinhDo();
    });
  };

  var TIN_CAY = { thap: "mới làm ít câu, chưa chắc", tb: "khá chắc", cao: "chắc chắn" };
  function chuLopLam(l) { return l === 0 ? "mẫu giáo" : "lớp " + l; }
  function giuaDs(ds) { var a = ds.slice().sort(function (x, y) { return x - y; }); return a.length ? a[Math.floor((a.length - 1) / 2)] : null; }

  KhoiHoc.prototype.veTrinhDo = function () {
    var t = this.td, dau = '<section class="hcbKhoi hcbTrinhDo"><h4>🎯 Con đang học tới đâu</h4>';
    if (!t) return dau + '<p class="hcbGhiChu">Đang tải...</p></section>';
    if (t.loi) return dau + '<p class="hcbGhiChu">' + thoat(/function|does not exist|schema cache/i.test(t.loi) ? "Máy chủ chưa có phần trình độ (cần chạy SQL KC_08F1)." : t.loi) + "</p></section>";
    var ds = t.mon || [];
    if (!ds.length) return dau + '<p class="hcbGhiChu">Con chưa trả lời câu hỏi nào. Sau vài trận Đấu Trường hoặc Thử Thách, ở đây sẽ hiện con đang làm tốt câu khoảng lớp mấy ở từng môn.</p></section>';
    var lech = t.coLech || {}, html = "", an = false;
    try { an = localStorage.getItem("kc_td_giu_lop_" + this.be) === String(t.lop) + ":" + (lech.loai || ""); } catch (e) { an = false; }
    if (lech.loai && !an) {
      var lopTot = giuaDs(ds.filter(function (m) { return (lech.loai === "thap" ? lech.gioi : lech.yeu).indexOf(m.mon) >= 0; }).map(function (m) { return m.lopLamTot; }));
      html += '<div class="hcbBaoLech"><p>💡 Con đang làm tốt câu khoảng <strong>' + chuLopLam(lopTot) + "</strong> ở nhiều môn, hồ sơ ghi <strong>"
        + (t.lop === null || t.lop === undefined ? "chưa có lớp" : chuLopLam(t.lop)) + "</strong>. "
        + (lech.loai === "thap" ? "Nếu con thật sự học lớp cao hơn, người lớn có thể sửa lớp; giữ nguyên cũng được, câu hỏi vẫn tự lên dần theo sức con."
          : "Có thể lớp trong hồ sơ cao hơn thật, con cần ôn lại kiến thức lớp dưới, hoặc ai đó đã chơi hộ. Câu hỏi vẫn tự vừa sức con.")
        + '</p><div class="hcbHang"><button type="button" class="hcbNutNho" data-hd="tdSuaLop">✏️ Sửa lớp</button>'
        + '<button type="button" class="hcbNutNho" data-hd="tdGiuLop">Giữ nguyên</button></div></div>';
    }
    html += '<ul class="hcbTdDs">' + ds.map(function (m) {
      var ghi = [];
      if (!lech.loai && (lech.gioi || []).indexOf(m.mon) >= 0) ghi.push("⬆ giỏi hơn lớp trong hồ sơ");
      if (!lech.loai && (lech.yeu || []).indexOf(m.mon) >= 0) ghi.push("⬇ cần ôn thêm lớp dưới");
      if (m.batThuong < 0) ghi.push("❗ gần đây làm kém hơn thường lệ (con mệt, hoặc người khác chơi hộ?)");
      if (m.batThuong > 0) ghi.push("⚡ gần đây tiến bộ nhanh");
      return '<li><span class="hcbTdMon">' + thoat(m.bieuTuong || "") + " " + thoat(m.ten) + "</span>: đang làm tốt câu khoảng <strong>" + chuLopLam(m.lopLamTot)
        + '</strong> <span class="hcbTdChac tc-' + thoat(m.tinCay) + '">(' + (TIN_CAY[m.tinCay] || "") + ")</span>"
        + ' <span class="hcbGhiChu">· ' + (m.soLuot | 0).toLocaleString("vi-VN") + " câu</span>"
        + (ghi.length ? '<div class="hcbTdGhi">' + ghi.join(" · ") + "</div>" : "") + "</li>";
    }).join("") + "</ul>";
    return dau + html + '<p class="hcbGhiChu">Tính từ mọi câu con trả lời trong app, không theo lớp khai. Chỉ người lớn thấy khối này; con chỉ thấy danh hiệu 🐣 → ⚡, không thấy chữ "lớp".</p></section>';
  };

  // ---------------- VẼ ----------------
  KhoiHoc.prototype.ve = function () {
    var d = this.d;
    this.k.innerHTML = '<div class="hcbDau"><div class="hcbDauTen">🎓 Việc học của <strong>' + thoat(d.be) + "</strong></div>"
      + '<div class="hcbDauSo"><span class="hcbChip">' + (d.lop === null || d.lop === undefined ? "Chưa biết lớp" : tenLop(d.lop))
      + "</span><span class=\"hcbChip\">Năm học " + d.namHoc + "-" + (d.namHoc + 1) + "</span>"
      + '<span class="hcbChip hcbChipNhan">🃏 Đang phải nhớ ' + (d.soThe | 0) + " thẻ · " + (d.soManh | 0) + " mảnh</span>" + this.veVang() + "</div></div>"
      + '<div class="hcbTin"></div>'
      + '<div class="hcbLuoi"><div class="hcbCot">' + this.veTrinhDo() + this.veBamBua() + this.veHoSo() + this.veNhayCam() + "</div>"
      + '<div class="hcbCot">' + this.veTheRieng() + this.veGiao() + "</div></div>";
  };

  KhoiHoc.prototype.veHoSo = function () {
    var d = this.d, hs = d.hoSo || {}, lopHs = hs.namVaoLop1 ? d.namHoc - hs.namVaoLop1 + 1 : null;
    var opt = '<option value="">' + (d.lopDauTruong !== null && d.lopDauTruong !== undefined
      ? "Chưa đặt (theo Đấu Trường: " + tenLop(d.lopDauTruong) + ")" : "Chưa đặt") + "</option>";
    for (var l = 0; l <= 12; l++) opt += '<option value="' + l + '"' + (lopHs === l ? " selected" : "") + ">" + tenLop(l) + "</option>";
    var vung = VUNG.map(function (v) { return '<option value="' + v[0] + '"' + ((hs.vung || "") === v[0] ? " selected" : "") + ">" + v[1] + "</option>"; }).join("");
    var ten = {}, dsNhanh = [];
    (d.nhanhDs || Object.keys(NHANH_TEN).map(function (m) { return { ma: m, ten: NHANH_TEN[m] }; })).forEach(function (n) {
      if (!ten[n.ma]) { ten[n.ma] = n.ten; dsNhanh.push(n.ma); }
    });
    (d.nhanhCo || []).concat(hs.nhanh || []).forEach(function (m) { if (dsNhanh.indexOf(m) < 0) dsNhanh.push(m); });
    var nhanh = dsNhanh.map(function (m) {
      return '<label class="hcbHop"><input type="checkbox" class="hcbNhanh" value="' + thoat(m) + '"'
        + ((hs.nhanh || []).indexOf(m) >= 0 ? " checked" : "") + "> " + thoat(ten[m] || m) + "</label>";
    }).join("");
    return '<section class="hcbKhoi"><h4>📅 Lớp và hồ sơ học</h4>'
      + '<label class="hcbNhan">Năm học này bé học<select class="hcbLop">' + opt + "</select></label>"
      + '<p class="hcbGoiY hcbGoiYLop">' + this.goiYLop(lopHs) + "</p>"
      + '<label class="hcbNhan">Vùng miền<select class="hcbVung">' + vung + "</select></label>"
      + '<div class="hcbNhan">Nhánh học (THPT, chuyên đề)<div class="hcbDsHop">' + nhanh + "</div></div>"
      + (d.laAdmin ? '<div class="hcbHang"><input class="hcbONhanh" placeholder="Tên nhánh mới, vd Công nghệ thông tin" maxlength="80">'
        + '<button type="button" class="hcbNut hcbNutPhu" data-hd="themNhanh">➕ Thêm nhánh</button></div>' : "")
      + '<div class="hcbHang"><button type="button" class="hcbNut" data-hd="luuHoSo">💾 Lưu hồ sơ</button>'
      + (hs.boi ? '<span class="hcbGhiChu">Sửa lần cuối: ' + thoat(hs.boi) + "</span>" : "") + "</div>"
      + '<p class="hcbGhiChu">Bé phải nhớ mọi thẻ từ lớp của bé trở xuống. Ngày 1/9 hằng năm bé tự lên lớp.</p></section>';
  };
  KhoiHoc.prototype.goiYLop = function (lop) {
    if (lop === null || lop === undefined || lop === "") return "Chưa đặt lớp: app dùng lớp bé chọn ở Đấu Trường (nếu có).";
    return "Tức là vào lớp 1 năm " + (this.d.namHoc - lop + 1) + "; năm sau tự thành " + (lop >= 12 ? "hết lớp 12" : tenLop(lop + 1)) + ".";
  };

  KhoiHoc.prototype.veNhayCam = function () {
    var d = this.d, bat = {};
    (d.giao || []).forEach(function (g) { if (g.loai === "nhay_cam" && g.hanhDong === "bat") bat[g.doiTuong] = true; });
    var dong = [{ ma: "*", ten: "Mọi môn", bieuTuong: "🌐", soNhayCam: null }]
      .concat((d.mon || []).filter(function (m) { return m.soNhayCam > 0 || bat[m.ma]; }));
    var html = dong.map(function (m) {
      return '<label class="hcbCongTac"><input type="checkbox" data-hd="nhayCam" data-ma="' + thoat(m.ma) + '"' + (bat[m.ma] ? " checked" : "")
        + '><span class="hcbCongTacNut"></span><span>' + thoat(m.bieuTuong || "") + " " + thoat(m.ten)
        + (m.soNhayCam ? ' <small>(' + m.soNhayCam + " thẻ)</small>" : "") + "</span></label>";
    }).join("");
    return '<section class="hcbKhoi"><h4>⚠️ Chủ đề nhạy cảm</h4>'
      + '<p class="hcbGhiChu">Thẻ nhạy cảm (cơ thể, an toàn, sự kiện buồn...) chỉ hiện cho bé khi người lớn bật. '
      + "Giao thêm đúng thẻ nào thì thẻ đó cũng hiện.</p>" + html
      + (dong.length === 1 ? '<p class="hcbGhiChu">Kho hiện chưa có thẻ nhạy cảm nào.</p>' : "") + "</section>";
  };

  KhoiHoc.prototype.veTheRieng = function () {
    var self = this, ds = this.d.theRieng || [];
    var html = ds.map(function (t) {
      if (self.sua && self.sua.id === t.id) return self.veSoan();
      var cap = ((t.noiDung || {}).cap || []);
      return '<div class="hcbThe"><div class="hcbTheDau"><strong>🔒 ' + thoat(t.tieuDe) + "</strong><span>"
        + '<button type="button" class="hcbNutNho" data-hd="suaRieng" data-id="' + thoat(t.id) + '">✏️ Sửa</button>'
        + '<button type="button" class="hcbNutNho hcbNutXoa" data-hd="xoaRieng" data-id="' + thoat(t.id) + '">🗑️ Xoá</button></span></div>'
        + '<ul class="hcbCap">' + cap.map(function (c) { return "<li>" + thoat(c.hoi) + " <b>→ " + thoat(c.dap) + "</b></li>"; }).join("") + "</ul>"
        + (t.nguCanh ? '<p class="hcbGhiChu">💡 ' + thoat(t.nguCanh) + "</p>" : "") + "</div>";
    }).join("");
    var them = this.sua && !this.sua.id ? this.veSoan()
      : '<div class="hcbHang"><button type="button" class="hcbNut" data-hd="themRieng">➕ Thêm thẻ riêng</button>'
        + '<button type="button" class="hcbNut hcbNutPhu" data-hd="themRieng" data-mau="dien_thoai">📞 Số điện thoại bố mẹ</button>'
        + '<button type="button" class="hcbNut hcbNutPhu" data-hd="themRieng" data-mau="dia_chi">🏠 Địa chỉ nhà</button></div>';
    return '<section class="hcbKhoi"><h4>🔒 Thẻ riêng của bé</h4>'
      + '<p class="hcbGhiChu">Điều riêng của nhà mình bé cần thuộc (số điện thoại bố mẹ, địa chỉ nhà...). Chỉ bé này thấy; bé ôn suốt đời.</p>'
      + (html || '<p class="hcbGhiChu">Chưa có thẻ riêng nào.</p>') + them + "</section>";
  };

  KhoiHoc.prototype.veSoan = function () {
    var s = this.sua;
    var cap = s.cap.map(function (c, i) {
      return '<div class="hcbCapSoan" data-ma="' + thoat(c.ma || "") + '"><input class="hcbHoi" placeholder="Câu hỏi" maxlength="200" value="' + thoat(c.hoi) + '">'
        + '<input class="hcbDap" placeholder="Câu trả lời" maxlength="200" value="' + thoat(c.dap) + '">'
        + '<button type="button" class="hcbNutNho hcbNutXoa" data-hd="boCap" data-i="' + i + '" title="Bỏ dòng này">✕</button></div>';
    }).join("");
    return '<div class="hcbThe hcbSoan"><label class="hcbNhan">Tên thẻ<input class="hcbTieuDe" maxlength="120" value="' + thoat(s.tieuDe) + '"></label>'
      + '<div class="hcbNhan">Các cặp hỏi - đáp</div>' + cap
      + '<button type="button" class="hcbNutNho" data-hd="themCap">➕ Thêm dòng</button>'
      + '<label class="hcbNhan">Ghi chú cho bé (khi nào cần dùng)<input class="hcbNguCanh" maxlength="300" value="' + thoat(s.nguCanh) + '"></label>'
      + '<div class="hcbHang"><button type="button" class="hcbNut" data-hd="luuRieng">💾 Lưu thẻ</button>'
      + '<button type="button" class="hcbNut hcbNutPhu" data-hd="huyRieng">Huỷ</button></div></div>';
  };

  KhoiHoc.prototype.veGiao = function () {
    var d = this.d, mon = {};
    (d.mon || []).forEach(function (m) { mon[m.ma] = m; });
    var ds = (d.giao || []).filter(function (g) { return g.loai !== "nhay_cam"; });
    var daGiao = ds.map(function (g) {
      return '<li class="hcbMuc"><span class="hcbNhanGiao ' + (g.hanhDong === "bo" ? "bo" : "them") + '">'
        + (g.hanhDong === "bo" ? "🚫 Đã bỏ" : "➕ Giao thêm") + "</span><span class=\"hcbMucTen\">"
        + (g.loai === "bo" ? "📦 Bộ: " : "") + thoat(g.bieuTuong || "") + " " + thoat(g.ten || g.doiTuong)
        + ' <small>' + thoat(chuLop(g.lopTu, g.lopDen)) + "</small></span>"
        + '<button type="button" class="hcbNutNho" data-hd="giao" data-loai="' + g.loai + '" data-ma="' + thoat(g.doiTuong) + '" data-gt="">↩️ Gỡ</button></li>';
    }).join("");
    var chonMon = '<option value="">Mọi môn</option>' + (d.mon || []).map(function (m) {
      return '<option value="' + thoat(m.ma) + '"' + (this.tim.mon === m.ma ? " selected" : "") + ">" + thoat((m.bieuTuong || "") + " " + m.ten) + "</option>";
    }, this).join("");
    return '<section class="hcbKhoi"><h4>🃏 Giao thêm / bỏ thẻ</h4>'
      + '<p class="hcbGhiChu">Mặc định bé học mọi thẻ đúng lớp. <b>Giao thêm</b> thẻ lớp trên để bé học trước; <b>Bỏ</b> thẻ / bộ bé chưa cần.</p>'
      + (daGiao ? '<ul class="hcbDs">' + daGiao + "</ul>" : '<p class="hcbGhiChu">Chưa giao / bỏ thẻ nào.</p>')
      + '<div class="hcbHang hcbTim"><input class="hcbOTim" placeholder="Tìm thẻ: bảng nhân, Pythagore..." value="' + thoat(this.tim.chu) + '">'
      + '<select class="hcbMonTim">' + chonMon + '</select><button type="button" class="hcbNut" data-hd="tim">🔍 Tìm</button></div>'
      + '<div class="hcbKqTim">' + this.veKqTim(mon) + "</div></section>";
  };

  KhoiHoc.prototype.veKqTim = function (mon) {
    var kq = this.tim.kq;
    if (!kq) return "";
    if (!kq.thanhCong) return '<p class="hcbGhiChu">❌ ' + thoat(kq.thongBao) + "</p>";
    function nut(loai, ma, gt, chu, phu) {
      return '<button type="button" class="hcbNutNho' + (phu ? " " + phu : "") + '" data-hd="giao" data-loai="' + loai + '" data-ma="' + thoat(ma) + '" data-gt="' + gt + '">' + chu + "</button>";
    }
    function bt(ma) { return (mon[ma] || {}).bieuTuong || ""; }
    var bo = (kq.bo || []).map(function (b) {
      var tt = b.giao === "them" ? '<span class="hcbNhanGiao them">➕ Đã giao</span>' : b.giao === "bo" ? '<span class="hcbNhanGiao bo">🚫 Đã bỏ</span>' : "";
      return '<li class="hcbMuc">' + tt + '<span class="hcbMucTen">📦 ' + thoat(bt(b.mon)) + " " + thoat(b.ten) + " <small>" + thoat(chuLop(b.lopTu, b.lopDen))
        + " · " + (b.soThe | 0) + " thẻ</small></span>" + (b.giao ? nut("bo", b.ma, "", "↩️ Gỡ")
          : nut("bo", b.ma, "them", "➕ Giao") + nut("bo", b.ma, "bo", "🚫 Bỏ", "hcbNutXoa")) + "</li>";
    }).join("");
    var the = (kq.the || []).map(function (t) {
      var tt = t.giao === "them" ? '<span class="hcbNhanGiao them">➕ Đã giao</span>' : t.giao === "bo" ? '<span class="hcbNhanGiao bo">🚫 Đã bỏ</span>'
        : t.beThay ? '<span class="hcbNhanGiao co">✅ Đang học</span>' : '<span class="hcbNhanGiao chua">➖ Chưa tới</span>';
      var nutHtml = t.giao ? nut("the", t.id, "", "↩️ Gỡ") : t.beThay ? nut("the", t.id, "bo", "🚫 Bỏ", "hcbNutXoa") : nut("the", t.id, "them", "➕ Giao");
      return '<li class="hcbMuc">' + tt + '<span class="hcbMucTen">' + thoat(bt(t.mon)) + " " + thoat(t.tieuDe) + " <small>" + thoat(chuLop(t.lopTu, t.lopDen))
        + " · " + (t.soManh | 0) + " mảnh" + (t.canDuyet ? " · ⚠️ nhạy cảm" : "") + "</small></span>" + nutHtml + "</li>";
    }).join("");
    if (!bo && !the) return '<p class="hcbGhiChu">Không thấy thẻ nào khớp.</p>';
    return (bo ? '<div class="hcbNhan">Bộ thẻ</div><ul class="hcbDs">' + bo + "</ul>" : "")
      + (the ? '<div class="hcbNhan">Thẻ' + ((kq.the || []).length >= 40 ? " (40 thẻ đầu, gõ thêm chữ để lọc)" : "") + '</div><ul class="hcbDs">' + the + "</ul>" : "");
  };

  // ---------------- BẤM ----------------
  KhoiHoc.prototype.docSoan = function () {
    var s = this.sua, k = this.k;
    if (!s) return;
    var o = k.querySelector(".hcbTieuDe"); if (o) s.tieuDe = o.value;
    o = k.querySelector(".hcbNguCanh"); if (o) s.nguCanh = o.value;
    s.cap = Array.prototype.map.call(k.querySelectorAll(".hcbCapSoan"), function (r) {
      return { ma: r.getAttribute("data-ma") || "", hoi: r.querySelector(".hcbHoi").value, dap: r.querySelector(".hcbDap").value };
    });
  };

  KhoiHoc.prototype.bam = function (e) {
    var n = e.target.closest ? e.target.closest("[data-hd]") : null;
    if (!n || !this.k.contains(n)) return;
    var hd = n.getAttribute("data-hd"), self = this;
    if (hd === "nhayCam") {
      if (n.tagName !== "INPUT") return;
      return this.giao("nhay_cam", n.getAttribute("data-ma"), n.checked ? "bat" : "");
    }
    if (hd === "tdSuaLop") {   // KC_08F1: tới ô lớp của khối 📅
      var o = this.k.querySelector(".hcbLop");
      if (o) { o.scrollIntoView({ behavior: "smooth", block: "center" }); o.focus(); }
      return;
    }
    if (hd === "tdGiuLop") {   // KC_08F1: người lớn giữ lớp -> ẩn lời báo trên máy này tới khi lớp / kiểu lệch đổi
      try { localStorage.setItem("kc_td_giu_lop_" + this.be, String(this.td.lop) + ":" + ((this.td.coLech || {}).loai || "")); } catch (e2) { /* không lưu được thì thôi */ }
      var b = this.k.querySelector(".hcbBaoLech"); if (b) b.remove();
      return;
    }
    if (hd === "luuHoSo") return this.luuHoSo(n);
    if (hd === "themNhanh") return this.themNhanh(n);
    if (hd === "giao") return this.giao(n.getAttribute("data-loai"), n.getAttribute("data-ma"), n.getAttribute("data-gt"));
    if (hd === "tim") return this.timThe();
    if (hd === "themRieng") {
      var mau = MAU_THE[n.getAttribute("data-mau")] || { tieuDe: "", nguCanh: "", cap: [{ hoi: "", dap: "" }] };
      this.sua = { id: null, tieuDe: mau.tieuDe, nguCanh: mau.nguCanh, cap: mau.cap.map(function (c) { return { ma: "", hoi: c.hoi, dap: c.dap }; }) };
      return this.ve();
    }
    if (hd === "suaRieng") {
      var t = (this.d.theRieng || []).filter(function (x) { return x.id === n.getAttribute("data-id"); })[0];
      if (!t) return;
      this.sua = { id: t.id, tieuDe: t.tieuDe, nguCanh: t.nguCanh || "", cap: ((t.noiDung || {}).cap || []).map(function (c) { return { ma: c.ma, hoi: c.hoi, dap: c.dap }; }) };
      return this.ve();
    }
    if (hd === "themCap") { this.docSoan(); this.sua.cap.push({ ma: "", hoi: "", dap: "" }); return this.ve(); }
    if (hd === "boCap") {
      this.docSoan(); this.sua.cap.splice(+n.getAttribute("data-i"), 1);
      if (!this.sua.cap.length) this.sua.cap.push({ ma: "", hoi: "", dap: "" });
      return this.ve();
    }
    if (hd === "huyRieng") { this.sua = null; return this.ve(); }
    if (hd === "luuRieng") return this.luuRieng(n);
    if (hd === "xoaRieng") {
      var the = (this.d.theRieng || []).filter(function (x) { return x.id === n.getAttribute("data-id"); })[0];
      if (!the || !window.confirm('Xoá thẻ riêng "' + the.tieuDe + '"? Tiến độ bé đã nhớ thẻ này cũng mất.')) return;
      n.disabled = true;
      return this.goiRpc("kc_hs_the_rieng_xoa", { p_id: the.id }).then(function (kq) {
        if (!kq.thanhCong) { n.disabled = false; return self.bao("❌ " + kq.thongBao, false); }
        self.bao("Đã xoá thẻ riêng.", true); self.tai();
      });
    }
  };

  // Thêm nhánh bằng tên (chỉ admin): lưu tên vào danh mục, tích sẵn cho bé; bấm 💾 Lưu hồ sơ mới gán cho bé.
  KhoiHoc.prototype.themNhanh = function (n) {
    var self = this, o = this.k.querySelector(".hcbONhanh"), ten = (o && o.value || "").trim(), ma = maTuTen(ten);
    if (ma.length < 2) return this.bao("Gõ tên nhánh (ít nhất 2 chữ cái), vd Công nghệ thông tin.", false);
    var co = this.k.querySelector('.hcbNhanh[value="' + ma + '"]');
    if (co) { co.checked = true; o.value = ""; return this.bao("Nhánh này đã có, đã tích chọn. Bấm 💾 Lưu hồ sơ.", true); }
    if (n) n.disabled = true;
    this.goi("kc_hs_them_nhanh", { p_ma: ma, p_ten: ten }).then(function (kq) {
      if (n) n.disabled = false;
      kq = kq || {};
      if (!kq.thanhCong) return self.bao("❌ " + (kq.thongBao || "Chưa thêm được nhánh"), false);
      (self.d.nhanhDs = self.d.nhanhDs || []).push({ ma: kq.ma, ten: kq.ten });
      var hop = document.createElement("label"); hop.className = "hcbHop";
      hop.innerHTML = '<input type="checkbox" class="hcbNhanh" value="' + thoat(kq.ma) + '" checked> ' + thoat(kq.ten);
      self.k.querySelector(".hcbDsHop").appendChild(hop); o.value = "";
      self.bao("Đã thêm nhánh \"" + kq.ten + "\" và tích chọn. Bấm 💾 Lưu hồ sơ để gán cho bé.", true);
    }, function () { if (n) n.disabled = false; self.bao("❌ Không kết nối được máy chủ.", false); });
  };

  KhoiHoc.prototype.luuHoSo = function (n) {
    var self = this, k = this.k, lop = k.querySelector(".hcbLop").value;
    var nhanh = Array.prototype.filter.call(k.querySelectorAll(".hcbNhanh"), function (o) { return o.checked; }).map(function (o) { return o.value; });
    n.disabled = true;
    this.goiRpc("kc_hs_luu_ho_so", { p_nam_vao_lop_1: lop === "" ? null : this.d.namHoc - Number(lop) + 1, p_nhanh: nhanh,
      p_vung: k.querySelector(".hcbVung").value }).then(function (kq) {
      n.disabled = false;
      if (!kq.thanhCong) return self.bao("❌ " + kq.thongBao, false);
      self.tai().then(function () { self.bao("Đã lưu hồ sơ học.", true); });
    });
  };

  KhoiHoc.prototype.luuRieng = function (n) {
    var self = this;
    this.docSoan();
    var s = this.sua, cap = s.cap.filter(function (c) { return c.hoi.trim() || c.dap.trim(); });
    if (!s.tieuDe.trim()) return this.bao("Thẻ cần có tên.", false);
    if (!cap.length) return this.bao("Thẻ cần ít nhất một cặp hỏi - đáp.", false);
    if (cap.some(function (c) { return !c.hoi.trim() || !c.dap.trim(); })) return this.bao("Mỗi dòng cần cả câu hỏi và câu trả lời.", false);
    n.disabled = true;
    this.goiRpc("kc_hs_the_rieng_luu", { p_the: { id: s.id || null, tieuDe: s.tieuDe.trim(), nguCanh: s.nguCanh.trim(),
      cap: cap.map(function (c) { var x = { hoi: c.hoi.trim(), dap: c.dap.trim() }; if (c.ma) x.ma = c.ma; return x; }) } }).then(function (kq) {
      n.disabled = false;
      if (!kq.thanhCong) return self.bao("❌ " + kq.thongBao, false);
      self.sua = null;
      self.tai().then(function () { self.bao("Đã lưu thẻ riêng.", true); });
    });
  };

  KhoiHoc.prototype.giao = function (loai, ma, hanhDong) {
    var self = this;
    if (this.sua) this.docSoan();
    return this.goiRpc("kc_hs_giao", { p_loai: loai, p_doi_tuong: ma, p_hanh_dong: hanhDong || "" }).then(function (kq) {
      if (!kq.thanhCong) { self.bao("❌ " + kq.thongBao, false); return self.tai(); }
      var chu = loai === "nhay_cam" ? (hanhDong ? "Đã bật chủ đề nhạy cảm." : "Đã tắt chủ đề nhạy cảm.")
        : hanhDong === "them" ? "Đã giao thêm cho bé." : hanhDong === "bo" ? "Đã bỏ khỏi việc học của bé." : "Đã gỡ, trở về mặc định.";
      return Promise.all([self.tai(), self.tim.kq ? self.timLai() : null]).then(function () { self.ve(); self.bao(chu, true); });
    });
  };

  KhoiHoc.prototype.timThe = function () {
    var o = this.k.querySelector(".hcbOTim"), m = this.k.querySelector(".hcbMonTim");
    this.tim.chu = o ? o.value.trim() : ""; this.tim.mon = m ? m.value : "";
    var self = this;
    return this.timLai().then(function () { self.ve(); var oo = self.k.querySelector(".hcbOTim"); if (oo) oo.focus(); });
  };
  KhoiHoc.prototype.timLai = function () {
    var self = this;
    return this.goiRpc("kc_hs_tim", { p_tim: this.tim.chu, p_mon: this.tim.mon }).then(function (kq) { self.tim.kq = kq; });
  };

  window.KcHocCuaBe = {
    mo: function (khung, cauHinh) {
      if (!khung || !cauHinh || !cauHinh.be || typeof cauHinh.goi !== "function") return null;
      return new KhoiHoc(khung, cauHinh);
    }
  };
})();
