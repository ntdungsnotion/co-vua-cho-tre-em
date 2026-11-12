// ================================================================
// FILE: kc/qt_kho_tri_thuc.js
// CHỨC NĂNG: Mục "📚 Kho tri thức" của trang Quản trị chung (KC_03B1, repo_rieng/Thiet_Ke_Kho_Tri_Thuc.md mục 7).
//   Kho tri thức = thẻ nhớ mọi môn (bảng kc_the_nho trên Supabase), dùng chung toàn app như kho câu hỏi.
//   - Lưới các KHO (mỗi môn một ô: số thẻ, số mảnh nhớ); bấm ô để lọc môn đó. Kho từ vựng có ô riêng trỏ sang 📖 Kho từ vựng.
//   - Bộ lọc: tìm chữ, môn, bộ thẻ, lớp, hình dạng (9 khuôn), thẻ riêng của bé, đến hạn soát lại, thẻ đang ẩn.
//   - Danh sách thẻ: nhãn (môn, lớp, hình dạng, bộ, riêng / nhạy cảm / ôn suốt đời / hạn soát), XEM TRƯỚC nội dung theo khuôn
//     (bảng hỏi đáp, bảng nhiều mặt, công thức + ký hiệu, quy tắc, dãy thứ tự, nhóm, thơ, điểm trên hình, các bước),
//     danh sách mảnh nhớ (đơn vị Sổ Ghi Nhớ ghi tiến độ), ngữ cảnh, nguồn.
//   KC_03B2 (12/11/2026): thanh công cụ ➕ Thêm thẻ / 📥 Nhập nhiều thẻ (khung soạn ở qt_the_nho_soan.js, kiểm trùng trước khi lưu);
//     mỗi thẻ có nút ✏️ Sửa và 🙈 Ẩn / 👁 Hiện (RPC kc_the_nho_admin_an, SQL/supabase_kc03b2_them_the.sql). Giao thẻ cho bé: KC_03B3.
//   RPC: kc_the_nho_admin_ds (kiểm admin ở máy chủ, SQL/supabase_kc03b1_kho_tri_thuc.sql ở repo_rieng), kc_mon_chu_de.
// BƯỚC: KC_03B1 - NGÀY: 12/11/2026 · KC_03B2 - 12/11/2026
// PHỤ THUỘC: ../api.js, ../admin_NC.js (adminGoiRpc, adminThoat), kc_the_nho_khuon.js (KC_THE_NHO), quantri_NC.html có nút
//   data-manhinh="khotrithuc" + section #manhinh-khotrithuc (#qttGoc), qt_kho_tri_thuc.css.
// ================================================================
(function () {
  "use strict";
  if (typeof adminGoiRpc !== "function" || !window.KC_THE_NHO) return;
  var goc = document.getElementById("qttGoc");
  if (!goc) return;
  var T = adminThoat, K = window.KC_THE_NHO, CO = 24;
  var NHAN_HD = { hoi_dap: "❓ Hỏi đáp", nhieu_mat: "🔀 Nhiều mặt", cong_thuc: "🧮 Công thức", quy_tac: "📏 Quy tắc", thu_tu: "🔢 Thứ tự",
    nhom: "🗂️ Nhóm", thuoc_long: "📜 Thuộc lòng", tren_hinh: "🖼️ Trên hình", quy_trinh: "🪜 Quy trình" };
  var mon = [], bo = [], hinhNen = {}, thongKe = null, tong = 0, trang = 0, lanTai = 0, daMo = false, dsThe = {};
  var loc = { tim: "", mon: "", bo: "", lop: "", hinhDang: "", rieng: "", denHanSoat: false, an: false };

  function el(id) { return document.getElementById(id); }
  function goi(ham, ts) {
    return adminGoiRpc(ham, ts || {}).then(function (kq) {
      return kq || { thanhCong: false, thongBao: "Máy chủ chưa có hàm " + ham + " (cần chạy SQL KC_03B1)" };
    }, function (e) { return { thanhCong: false, thongBao: "Không kết nối được máy chủ" + (e && e.message ? ": " + e.message : "") }; });
  }
  function canSql(kq) {
    return kq && kq.thongBao && /function|does not exist|schema cache|chưa có hàm/i.test(kq.thongBao) ? " Hãy chạy SQL KC_03B1 trong Supabase." : "";
  }
  function monCua(ma) { for (var i = 0; i < mon.length; i++) if (mon[i].ma === ma) return mon[i]; return { ma: ma, ten: ma, bieuTuong: "📘" }; }
  function lopChu(t) {
    if (t.lopDen === null || t.lopDen === undefined) return "Từ lớp " + t.lopTu;
    return t.lopDen === t.lopTu ? "Lớp " + t.lopTu : "Lớp " + t.lopTu + "-" + t.lopDen;
  }
  function homNay() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }

  // ---------------- phương tiện -> HTML ----------------
  function pt(x) {
    if (x && typeof x === "object" && !Array.isArray(x)) {
      if (x.loai === "mau") return '<span class="qttMau" style="background:' + T(x.ma) + '"></span>' + T(x.ten || x.ma);
      if (x.loai === "hinh") return '<img class="qttHinhNho" src="' + T(x.url) + '" alt="' + T(x.chu || "") + '" loading="lazy">';
      if (x.loai === "cong_thuc") return '<span class="qttCongThuc" title="' + T(x.tex) + '">' + T(K.chu(x)) + "</span>";
      if (x.loai === "ma") return '<code class="qttMa">' + T(x.ma) + "</code>";
    }
    return T(K.chu(x));
  }
  function danhSach(ds, the) { return ds && ds.length ? "<" + (the || "ul") + ">" + ds.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</" + (the || "ul") + ">" : ""; }

  // ---------------- xem trước theo khuôn ----------------
  function xemTruoc(t) {
    var n = t.noiDung || {}, h = "";
    switch (t.hinhDang) {
      case "hoi_dap": {
        var cap = n.sinh ? K.sinhCap(n.sinh) : (n.cap || []), them = cap.length > 12 ? cap.length - 12 : 0;
        h = (n.sinh ? '<p class="qttGhi">⚙️ Sinh tự động: ' + cap.length + " phép</p>" : "")
          + '<table class="qttBang"><tbody>' + cap.slice(0, 12).map(function (c) {
            return "<tr><td>" + pt(c.hoi) + "</td><td>→</td><td><b>" + pt(c.dap) + "</b>"
              + (c.dap_khac && c.dap_khac.length ? ' <small>(' + c.dap_khac.map(pt).join(", ") + ")</small>" : "") + "</td></tr>";
          }).join("") + "</tbody></table>" + (them ? '<p class="qttGhi">… và ' + them + " cặp nữa</p>" : "");
        break;
      }
      case "nhieu_mat": {
        var tr = n.truong || [];
        h = '<div class="qttCuon"><table class="qttBang qttBangKe"><thead><tr>' + tr.map(function (x) { return "<th>" + T(x.ten) + "</th>"; }).join("")
          + "</tr></thead><tbody>" + (n.muc || []).map(function (m) {
            return "<tr>" + tr.map(function (x) { return "<td>" + pt((m.gia_tri || {})[x.ma]) + "</td>"; }).join("") + "</tr>";
          }).join("") + "</tbody></table></div>"
          + (n.hoi && n.hoi.length ? '<p class="qttGhi">Hỏi chéo: ' + n.hoi.map(function (p) {
            var a = tr.filter(function (x) { return x.ma === p[0]; })[0], b = tr.filter(function (x) { return x.ma === p[1]; })[0];
            return T((a || {}).ten) + " → " + T((b || {}).ten);
          }).join(" · ") + "</p>" : "");
        break;
      }
      case "cong_thuc":
        h = '<div class="qttCongThucLon">' + pt(n.bieu_thuc) + "</div>"
          + (n.ki_hieu && n.ki_hieu.length ? danhSach(n.ki_hieu.map(function (k) {
            return "<b>" + T(k.kh) + "</b>: " + T(k.nghia) + (k.don_vi ? " <small>(" + T(k.don_vi) + ")</small>" : "");
          })) : "")
          + (n.dieu_kien ? '<p class="qttGhi">⚠️ Điều kiện: ' + pt(n.dieu_kien) + "</p>" : "")
          + (n.dang_tuong_duong && n.dang_tuong_duong.length ? '<p class="qttGhi">Dạng khác: ' + n.dang_tuong_duong.map(pt).join(" ; ") + "</p>" : "");
        break;
      case "quy_tac":
        h = '<p class="qttPhatBieu">' + pt(n.phat_bieu) + "</p>"
          + danhSach((n.cau_truc || []).map(function (c) { return (c.ten ? "<b>" + T(c.ten) + ":</b> " : "") + pt(c.mau); }))
          + (n.dau_hieu && n.dau_hieu.length ? '<p class="qttGhi">Dấu hiệu: ' + n.dau_hieu.map(function (d) { return '<span class="qttChip">' + pt(d) + "</span>"; }).join(" ") + "</p>" : "")
          + (n.vi_du && n.vi_du.length ? '<p class="qttGhi">Ví dụ: ' + n.vi_du.map(pt).join(" · ") + "</p>" : "")
          + (n.ngoai_le && n.ngoai_le.length ? '<p class="qttGhi">Ngoại lệ / lưu ý: ' + n.ngoai_le.map(function (x) { return pt(x.noi_dung); }).join(" · ") + "</p>" : "");
        break;
      case "thu_tu":
        h = '<div class="qttDay">' + (n.phan_tu || []).map(function (p, i) {
          return (i ? '<span class="qttMuiTen">→</span>' : "") + '<span class="qttChip">' + (p.moc !== undefined ? "<small>" + T(p.moc) + "</small> " : "") + pt(p.ten) + "</span>";
        }).join("") + (n.vong ? '<span class="qttMuiTen" title="Quay vòng">↻</span>' : "") + "</div>"
          + (n.meo ? '<p class="qttGhi">💡 Mẹo nhớ: ' + pt(n.meo) + "</p>" : "");
        break;
      case "nhom":
        h = '<div class="qttNhom">' + (n.nhom || []).map(function (g) {
          return '<div class="qttONhom"><b>' + T(g.ten) + "</b>" + (n.phan_tu || []).filter(function (p) { return p.nhom === g.ma; })
            .map(function (p) { return '<span class="qttChip">' + pt(p.ten) + "</span>"; }).join("") + "</div>";
        }).join("") + "</div>";
        break;
      case "thuoc_long":
        h = (n.tac_gia ? '<p class="qttGhi">' + T(n.tac_gia) + "</p>" : "") + '<div class="qttTho">' + (n.van_ban || []).map(function (k) {
          return "<p>" + (k.dong || []).map(T).join("<br>") + "</p>";
        }).join("") + "</div>" + (n.dich ? '<p class="qttGhi">' + T(n.dich) + "</p>" : "");
        break;
      case "tren_hinh": {
        var hn = n.hinh_nen ? hinhNen[n.hinh_nen] : null, url = n.hinh ? n.hinh.url : hn ? hn.url : "";
        h = '<div class="qttTrenHinh">' + (url ? '<img src="' + T(url) + '" alt="" loading="lazy">' : '<div class="qttThieuHinh">Chưa có hình "' + T(n.hinh_nen || "") + '"</div>')
          + (n.diem || []).map(function (d) {
            return '<span class="qttDiem" style="left:' + Number(d.x) + "%;top:" + Number(d.y) + '%"><i></i>' + pt(d.ten) + "</span>";
          }).join("") + "</div>" + (hn ? '<p class="qttGhi">Hình dùng chung: ' + T(hn.ten) + "</p>" : "");
        break;
      }
      case "quy_trinh":
        h = danhSach((n.buoc || []).map(function (b) {
          return pt(b.viec) + (b.neu || []).map(function (x) {
            var dich = (n.buoc || []).map(function (y) { return y.ma; }).indexOf(x.den);
            return '<div class="qttGhi">↪ Nếu ' + T(x.dieu_kien) + " → bước " + (dich + 1) + "</div>";
          }).join("") + (b.khong_duoc ? '<div class="qttKhongDuoc">🚫 ' + pt(b.khong_duoc) + "</div>" : "");
        }), "ol");
        break;
    }
    return h;
  }

  function theHtml(t, khongNut) {
    var m = monCua(t.mon), b = bo.filter(function (x) { return x.ma === t.bo; })[0], hn = homNay();
    var nhan = '<span class="qttNhan qttNhanMon">' + T(m.bieuTuong + " " + m.ten) + "</span>"
      + '<span class="qttNhan">' + T(lopChu(t)) + "</span>"
      + '<span class="qttNhan qttNhanHd">' + T(NHAN_HD[t.hinhDang] || t.hinhDang) + "</span>"
      + (b ? '<span class="qttNhan">' + T((b.bieuTuong || "📦") + " " + b.ten) + "</span>" : "")
      + (t.chiChoBe ? '<span class="qttNhan qttNhanRieng">🔒 Riêng của ' + T(t.chiChoBe) + "</span>" : "")
      + (t.canDuyet ? '<span class="qttNhan qttNhanNhay">⚠️ Nhạy cảm</span>' : "")
      + (t.onSuotDoi ? '<span class="qttNhan qttNhanSuotDoi">♾️ Ôn suốt đời</span>' : "")
      + (t.nhanh ? '<span class="qttNhan">🌿 Nhánh ' + T(t.nhanh) + "</span>" : "")
      + (t.kiemLai ? '<span class="qttNhan' + (t.kiemLai <= hn ? " qttNhanHan" : "") + '">🔁 Soát lại ' + T(t.kiemLai) + "</span>" : "")
      + (t.hien ? "" : '<span class="qttNhan qttNhanAn">🙈 Đang ẩn</span>');
    var manh = (t.manh || []);
    return '<article class="qttThe" data-id="' + T(t.id) + '">'
      + '<div class="qttNhanDong">' + nhan + "</div>"
      + '<h4 class="qttTieuDe">' + T(t.tieuDe) + "</h4>"
      + '<div class="qttNoiDung">' + xemTruoc(t) + "</div>"
      + (t.nguCanh ? '<p class="qttNguCanh">💬 ' + T(t.nguCanh) + "</p>" : "")
      + '<details class="qttManh"><summary>🧩 ' + manh.length + " mảnh nhớ</summary><div>"
      + manh.map(function (x) { return '<span class="qttChip" title="' + T(x.ma) + '">' + T(x.ten || x.ma) + "</span>"; }).join("") + "</div></details>"
      + '<p class="qttChan"><code>' + T(t.id) + "</code>" + (t.nguon ? " · " + T(t.nguon) : "") + (t.phienBan ? " · bản " + (t.phienBan | 0) : "") + "</p>"
      + (khongNut ? "" : '<div class="qttNutThe"><button type="button" class="adminNut adminNutPhu" data-sua="' + T(t.id) + '">✏️ Sửa</button>'
        + '<button type="button" class="adminNut adminNutPhu" data-an="' + T(t.id) + '" data-hien="' + (t.hien ? "0" : "1") + '">' + (t.hien ? "🙈 Ẩn" : "👁 Hiện lại") + "</button></div>")
      + "</article>";
  }

  // ---------------- khung ----------------
  function veKhung() {
    var lop = '<option value="">Mọi lớp</option>';
    for (var i = 1; i <= 12; i++) lop += '<option value="' + i + '">Lớp ' + i + "</option>";
    goc.innerHTML = '<div class="qttCongCu"><button type="button" class="adminNut adminNutThanhCong" id="qttThem">➕ Thêm thẻ</button>'
      + '<button type="button" class="adminNut adminNutPhu" id="qttNhap">📥 Nhập nhiều thẻ (JSON)</button></div><div id="qtsKhung"></div>'
      + '<div id="qttKho" class="qttKho"></div>'
      + '<div class="qttLoc">'
      + '<input type="search" id="qttTim" placeholder="Tìm chữ trong thẻ, mã thẻ…" aria-label="Tìm thẻ">'
      + '<details class="qttLocThem" id="qttLocThem"><summary>⚙️ Bộ lọc</summary><div class="qttLocLuoi">'
      + '<label>Môn<select id="qttLMon"><option value="">Mọi môn</option>' + mon.map(function (m) { return '<option value="' + T(m.ma) + '">' + T(m.bieuTuong + " " + m.ten) + "</option>"; }).join("") + "</select></label>"
      + '<label>Bộ thẻ<select id="qttLBo"></select></label>'
      + '<label>Lớp<select id="qttLLop">' + lop + "</select></label>"
      + '<label>Hình dạng<select id="qttLHd"><option value="">Mọi hình dạng</option>' + Object.keys(NHAN_HD).map(function (k) { return '<option value="' + k + '">' + NHAN_HD[k] + "</option>"; }).join("") + "</select></label>"
      + '<label>Loại thẻ<select id="qttLRieng"><option value="">Chung + riêng</option><option value="chung">Thẻ chung</option><option value="rieng">🔒 Thẻ riêng của bé</option></select></label>'
      + '<label class="qttHop"><input type="checkbox" id="qttLHan"> 🔁 Đến hạn soát lại</label>'
      + '<label class="qttHop"><input type="checkbox" id="qttLAn"> 🙈 Thẻ đang ẩn</label>'
      + '<button type="button" class="adminNut adminNutPhu" id="qttBoLoc">↺ Bỏ lọc</button>'
      + "</div></details></div>"
      + '<p class="qttTom" id="qttTom"></p><div id="qttDs" class="qttDs"></div><div class="qttTrang" id="qttTrang"></div>';
    veBo();
    var hen = null;
    el("qttTim").addEventListener("input", function () { clearTimeout(hen); hen = setTimeout(function () { loc.tim = el("qttTim").value.trim(); trang = 0; taiDs(); }, 350); });
    [["qttLMon", "mon"], ["qttLBo", "bo"], ["qttLLop", "lop"], ["qttLHd", "hinhDang"], ["qttLRieng", "rieng"]].forEach(function (x) {
      el(x[0]).addEventListener("change", function () { loc[x[1]] = el(x[0]).value; if (x[1] === "mon") { loc.bo = ""; veBo(); } trang = 0; taiDs(); });
    });
    el("qttLHan").addEventListener("change", function () { loc.denHanSoat = el("qttLHan").checked; trang = 0; taiDs(); });
    el("qttLAn").addEventListener("change", function () { loc.an = el("qttLAn").checked; trang = 0; taiDs(); });
    el("qttBoLoc").addEventListener("click", function () { chonMon(""); });
    el("qttKho").addEventListener("click", function (su) {
      var o = su.target.closest("[data-mon]"); if (!o) return;
      var ma = o.getAttribute("data-mon");
      if (ma === "__tu") { var nut = document.querySelector('.adminNutManHinh[data-manhinh="khotu"]'); if (nut) nut.click(); return; }
      chonMon(loc.mon === ma ? "" : ma);
    });
    el("qttThem").addEventListener("click", function () { if (window.QTS) window.QTS.moi(); });
    el("qttNhap").addEventListener("click", function () { if (window.QTS) window.QTS.nhap(); });
    el("qttDs").addEventListener("click", function (su) {
      var n = su.target.closest("[data-sua]");
      if (n) { if (window.QTS && dsThe[n.getAttribute("data-sua")]) window.QTS.sua(dsThe[n.getAttribute("data-sua")]); return; }
      n = su.target.closest("[data-an]");
      if (n) anHien(n);
    });
    el("qttTrang").addEventListener("click", function (su) {
      var n = su.target.closest("[data-trang]"); if (!n) return;
      trang = Number(n.getAttribute("data-trang")); taiDs(); goc.scrollIntoView({ block: "start" });
    });
    if (window.matchMedia("(min-width: 900px)").matches) el("qttLocThem").open = true;
  }
  function anHien(nut) {
    var id = nut.getAttribute("data-an"), hien = nut.getAttribute("data-hien") === "1", t = dsThe[id];
    if (!hien && !window.confirm("Ẩn thẻ \"" + (t ? t.tieuDe : id) + "\"?\nBé sẽ không thấy thẻ này nữa. Tiến độ đã học vẫn giữ, có thể hiện lại.")) return;
    nut.disabled = true;
    goi("kc_the_nho_admin_an", { p_id: id, p_hien: hien }).then(function (kq) {
      if (!kq.thanhCong) { nut.disabled = false; window.alert("❌ " + kq.thongBao + canSql(kq).replace("KC_03B1", "KC_03B2")); return; }
      taiDs();
    });
  }
  function chonMon(ma) {
    loc = { tim: "", mon: ma, bo: "", lop: "", hinhDang: "", rieng: "", denHanSoat: false, an: false };
    el("qttTim").value = ""; el("qttLMon").value = ma; el("qttLLop").value = ""; el("qttLHd").value = ""; el("qttLRieng").value = "";
    el("qttLHan").checked = false; el("qttLAn").checked = false; veBo(); trang = 0; taiDs();
  }
  function veBo() {
    var ds = bo.filter(function (b) { return !loc.mon || b.mon === loc.mon; });
    el("qttLBo").innerHTML = '<option value="">Mọi bộ</option>' + ds.map(function (b) {
      return '<option value="' + T(b.ma) + '"' + (b.ma === loc.bo ? " selected" : "") + ">" + T((b.bieuTuong || "📦") + " " + b.ten + " (" + b.soThe + ")") + "</option>";
    }).join("");
  }
  function veKho() {
    var so = {};
    ((thongKe && thongKe.mon) || []).forEach(function (x) { so[x.mon] = x; });
    var h = mon.map(function (m) {
      var s = so[m.ma] || { soThe: 0, soManh: 0 };
      return '<button type="button" class="qttOKho' + (s.soThe ? "" : " trong") + (loc.mon === m.ma ? " dangChon" : "") + '" data-mon="' + T(m.ma) + '">'
        + '<span class="qttBieuTuong">' + T(m.bieuTuong) + '</span><span class="qttTenKho">' + T(m.ten) + "</span>"
        + "<small>" + (s.soThe ? s.soThe + " thẻ · " + s.soManh + " mảnh" : "chưa có thẻ") + "</small></button>";
    }).join("");
    h += '<button type="button" class="qttOKho qttOTu" data-mon="__tu"><span class="qttBieuTuong">🔤</span><span class="qttTenKho">Từ vựng tiếng Anh</span><small>kho riêng ›</small></button>';
    el("qttKho").innerHTML = h;
  }

  // ---------------- tải ----------------
  function taiDs() {
    var so = ++lanTai, o = el("qttDs");
    o.innerHTML = '<p class="adminDangTai">Đang tải thẻ...</p>';
    goi("kc_the_nho_admin_ds", { p_loc: loc, p_trang: trang, p_co: CO }).then(function (kq) {
      if (so !== lanTai) return;
      if (!kq.thanhCong) { o.innerHTML = '<p class="adminGhiChu">❌ ' + T(kq.thongBao) + T(canSql(kq)) + "</p>"; return; }
      tong = kq.tong | 0; thongKe = kq.thongKe; bo = kq.bo || [];
      hinhNen = {}; (kq.hinhNen || []).forEach(function (x) { hinhNen[x.ma] = x; });
      veKho(); veBo();
      var tk = thongKe || {}, tatCa = (tk.mon || []).reduce(function (a, x) { return a + x.soThe; }, 0);
      el("qttTom").innerHTML = "<b>" + tong + " thẻ</b> · " + (kq.tongManh | 0) + " mảnh nhớ"
        + (tong !== tatCa ? " (trong " + tatCa + " thẻ của kho)" : "")
        + (tk.denHanSoat ? ' · <span class="qttDo">🔁 ' + tk.denHanSoat + " thẻ đến hạn soát</span>" : "")
        + (tk.rieng ? " · 🔒 " + tk.rieng + " thẻ riêng" : "");
      var ds = kq.the || [];
      dsThe = {}; ds.forEach(function (t) { dsThe[t.id] = t; });
      o.innerHTML = ds.length ? ds.map(function (t) { return theHtml(t); }).join("") : '<p class="adminGhiChu">Không có thẻ nào khớp bộ lọc.</p>';
      var soTrang = Math.max(1, Math.ceil(tong / CO)), h = "";
      if (soTrang > 1) {
        h = '<button type="button" class="adminNut adminNutPhu" data-trang="' + Math.max(0, trang - 1) + '"' + (trang === 0 ? " disabled" : "") + ">‹ Trước</button>"
          + "<span>Trang " + (trang + 1) + " / " + soTrang + "</span>"
          + '<button type="button" class="adminNut adminNutPhu" data-trang="' + Math.min(soTrang - 1, trang + 1) + '"' + (trang >= soTrang - 1 ? " disabled" : "") + ">Sau ›</button>";
      }
      el("qttTrang").innerHTML = h;
    });
  }
  function moLanDau() {
    if (daMo) return;
    daMo = true;
    goc.innerHTML = '<p class="adminDangTai">Đang tải...</p>';
    apiGoiRpc("kc_mon_chu_de", {}).then(function (kq) { if (kq && kq.thanhCong) mon = kq.mon || []; }, function () {}).then(function () {
      veKhung(); taiDs();
    });
  }
  document.addEventListener("adminDaChuyenManHinh", function (su) { if (su.detail && su.detail.ten === "khotrithuc") moLanDau(); });
  if (el("manhinh-khotrithuc").classList.contains("dangHien")) moLanDau();
  window.QTT = { mo: moLanDau, xemTruoc: xemTruoc, theHtml: theHtml, goi: goi, taiLai: function () { taiDs(); },
    mon: function () { return mon; }, bo: function () { return bo; }, hinhNen: function () { return hinhNen; } };
})();
// 12/11/2026 - BƯỚC: KC_03B1 · KC_03B2 (12/11/2026: thanh công cụ thêm / nhập, nút sửa / ẩn mỗi thẻ)
