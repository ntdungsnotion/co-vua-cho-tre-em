// ================================================================
// FILE: dt/dt_tao_nhan_vat.js
// CHỨC NĂNG: Màn TẠO THỦ LĨNH của Đấu Trường Tri Thức (khung HTML #dtManTao trong
//            kc/dautruongtrithuc.html): tên vương quốc + tên Thủ lĩnh (lọc từ xấu),
//            chủng loại (3 thẻ có hình động), bé trai / bé gái, kiểu tóc, màu tóc,
//            màu da, màu áo, lớp đang học; hình xem trước lớn đổi ngay theo lựa chọn.
//            Bấm "Vào vương quốc": lưu ngoại hình (dùng chung toàn app) + tiến độ game.
//            Dùng lại được để SỬA Thủ lĩnh (điền sẵn lựa chọn cũ).
// BƯỚC: TC_D01
// NGÀY: 21/10/2026
// PHỤ THUỘC: chung/nv_ve.js, chung/nv_ho_so.js, chung/nv_san_khau.js, chung/loc_ten.js,
//            dt/dt_tien_do.js
// ================================================================
(function (goc) {
  "use strict";
  var NV = goc.KC_NV;
  var TEN_NGAU_NHIEN = {
    vuongQuoc: ["Mặt Trời", "Rồng Xanh", "Sao Băng", "Gió Ngàn", "Trăng Bạc", "Hoa Sen", "Sấm Sét", "Cầu Vồng", "Bạch Hổ", "Núi Thần", "Biển Ngọc", "Lửa Thiêng"],
    nam: ["Gióng", "Minh Khôi", "Đại Bàng", "Bảo Long", "Sơn Lâm", "Hùng Anh", "Phong Vân", "Tuấn Kiệt"],
    nu: ["Sao Mai", "Ánh Trăng", "Mây Hồng", "Hoa Lửa", "Mai Anh", "Ngọc Lan", "Bảo Châu", "Thiên Hương"]
  };
  var TU_THE_XEM = [["vay", "👋 Vẫy tay"], ["dung", "🧍 Đứng"], ["di", "🚶 Đi"], ["nhay", "🦘 Nhảy"]];

  var tt = null;      // trạng thái màn tạo
  var tuyChon = null; // { tenDangNhap, dsChungLoai, tenChiSo, xong, huy }
  var daGan = false;

  function $(id) { return document.getElementById(id); }
  function chon(ds) { return ds[Math.floor(Math.random() * ds.length)]; }

  function nut(lop, noiDung, khiBam) {
    var b = document.createElement("button");
    b.type = "button"; b.className = lop;
    if (typeof noiDung === "string") b.textContent = noiDung; else b.appendChild(noiDung);
    b.addEventListener("click", khiBam);
    return b;
  }
  function danhDau(hop, dieuKien) {
    Array.prototype.forEach.call(hop.children, function (x, i) { x.setAttribute("aria-pressed", dieuKien(x, i) ? "true" : "false"); });
  }

  // ---------------- HÌNH ----------------
  function veXemTruoc(c, w, h, t) {
    nen(c, w, h);
    var co = Math.min(h * 0.78 / NV.CAO, w * 0.5 / 34);
    NV.ve(c, tt.hoSo, { x: w * 0.5, y: h * 0.93, co: co, t: t, tuThe: tt.tuThe, thoiKy: "do_da" });
  }
  function nen(c, w, h) { // nền đồi cỏ dưới trời đêm xanh
    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#22336f"); g.addColorStop(1, "#33508f");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = "#3f9a4f"; c.beginPath(); c.ellipse(w / 2, h * 0.97, w * 0.6, h * 0.12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#58b862"; c.beginPath(); c.ellipse(w / 2, h * 0.95, w * 0.42, h * 0.07, 0, 0, Math.PI * 2); c.fill();
  }
  function veTheLoai(ma) {
    return function (c, w, h, t) {
      nen(c, w, h);
      var hs = NV.chuanHoa(Object.assign({}, tt.hoSo, { chungLoai: ma }));
      NV.ve(c, hs, { x: w / 2, y: h * 0.93, co: h * 0.8 / NV.CAO, t: t, lech: ma.length * 0.4, tuThe: tt.hoSo.chungLoai === ma ? "vay" : "dung" });
    };
  }

  // ---------------- DỰNG CÁC LỰA CHỌN ----------------
  function dungTuThe() {
    var hop = $("dtChonTuThe"); hop.innerHTML = "";
    TU_THE_XEM.forEach(function (x) {
      hop.appendChild(nut("dtChip", x[1], function () { tt.tuThe = x[0]; capNhat(); }));
    });
  }
  function dungChungLoai() {
    var hop = $("dtChonLoai"); hop.innerHTML = "";
    tuyChon.dsChungLoai.forEach(function (cl) {
      var bo = document.createElement("span");
      var cv = document.createElement("canvas"); cv.className = "dtTheLoaiHinh"; cv.setAttribute("aria-hidden", "true");
      var ten = document.createElement("b"); ten.textContent = cl.bieuTuong + " " + cl.ten;
      bo.appendChild(cv); bo.appendChild(ten);
      var b = nut("dtTheLoai", bo, function () { tt.hoSo.chungLoai = cl.ma; capNhat(); });
      b.setAttribute("data-ma", cl.ma);
      hop.appendChild(b);
      goc.KC_SAN_KHAU.dang(cv, veTheLoai(cl.ma));
    });
  }
  function dungSoMau(idHop, loai, truong) {
    var hop = $(idHop); hop.innerHTML = "";
    NV.BANG[loai].forEach(function (mau, i) {
      var b = nut("dtMau", "", function () { tt.hoSo[truong] = i; capNhat(); });
      b.style.background = mau;
      b.setAttribute("aria-label", NV.TEN_MAU[loai][i]);
      b.title = NV.TEN_MAU[loai][i];
      hop.appendChild(b);
    });
  }
  function dungLop() {
    var hop = $("dtChonLop"); hop.innerHTML = "";
    for (var i = 1; i <= 12; i++) (function (lop) {
      hop.appendChild(nut("dtChip dtLopNut", String(lop), function () { tt.lop = lop; capNhat(); }));
    })(i);
  }
  function dungToc() { // kiểu tóc đổi theo giới
    var hop = $("dtChonToc"); hop.innerHTML = "";
    NV.KIEU_TOC[tt.hoSo.gioi].forEach(function (k, i) {
      hop.appendChild(nut("dtChip", k.ten, function () { tt.hoSo.kieuToc = i; capNhat(); }));
    });
  }

  // ---------------- CẬP NHẬT GIAO DIỆN THEO TRẠNG THÁI ----------------
  function capNhat() {
    var h = tt.hoSo = NV.chuanHoa(tt.hoSo);
    danhDau($("dtChonTuThe"), function (x, i) { return TU_THE_XEM[i][0] === tt.tuThe; });
    danhDau($("dtChonLoai"), function (x) { return x.getAttribute("data-ma") === h.chungLoai; });
    danhDau($("dtChonGioi"), function (x) { return x.getAttribute("data-gioi") === h.gioi; });
    danhDau($("dtChonToc"), function (x, i) { return i === h.kieuToc; });
    danhDau($("dtMauToc"), function (x, i) { return i === h.mauToc; });
    danhDau($("dtMauDa"), function (x, i) { return i === h.mauDa; });
    danhDau($("dtMauAo"), function (x, i) { return i === h.mauAo; });
    danhDau($("dtChonLop"), function (x, i) { return i + 1 === tt.lop; });

    var cl = tuyChon.dsChungLoai.filter(function (x) { return x.ma === h.chungLoai; })[0];
    if (cl) {
      $("dtMoTaLoai").textContent = cl.moTa + " Làng: " + cl.kienTruc.toLowerCase() + ".";
      var bang = $("dtChiSoLoai"); bang.innerHTML = "";
      Object.keys(cl.chiSo).forEach(function (k) {
        var dong = document.createElement("div"); dong.className = "dtChiSoDong";
        var ten = document.createElement("span"); ten.textContent = (tuyChon.tenChiSo[k] || k);
        var thanh = document.createElement("span"); thanh.className = "dtThanh";
        var day = document.createElement("i"); day.style.width = (cl.chiSo[k] * 20) + "%";
        thanh.appendChild(day); dong.appendChild(ten); dong.appendChild(thanh); bang.appendChild(dong);
      });
    }
    var tenTL = $("dtOThuLinh").value.trim(), tenVQ = $("dtOVuongQuoc").value.trim();
    $("dtTenXem").textContent = "Thủ lĩnh " + (tenTL || "…") + (cl ? " · " + cl.ten : "");
    $("dtVuongXem").textContent = "Vương quốc " + (tenVQ || "…");
    $("dtLoiTao").textContent = "";
    ["dtXemTruoc"].concat(Array.prototype.map.call(document.querySelectorAll(".dtTheLoaiHinh"), function (x) { return x; }))
      .forEach(function (cv) { goc.KC_SAN_KHAU.veLai(typeof cv === "string" ? $(cv) : cv); });
  }

  function ganSuKien() {
    if (daGan) return; daGan = true;
    Array.prototype.forEach.call($("dtChonGioi").children, function (b) {
      b.addEventListener("click", function () {
        if (tt.hoSo.gioi === b.getAttribute("data-gioi")) return;
        tt.hoSo.gioi = b.getAttribute("data-gioi"); tt.hoSo.kieuToc = 0; dungToc(); capNhat();
      });
    });
    $("dtOThuLinh").addEventListener("input", capNhat);
    $("dtOVuongQuoc").addEventListener("input", capNhat);
    $("dtNutNgauNhien").addEventListener("click", function () {
      $("dtOVuongQuoc").value = chon(TEN_NGAU_NHIEN.vuongQuoc);
      $("dtOThuLinh").value = chon(TEN_NGAU_NHIEN[tt.hoSo.gioi]);
      capNhat();
    });
    $("dtNutVao").addEventListener("click", vaoVuongQuoc);
    $("dtNutHuy").addEventListener("click", function () { dong(); if (tuyChon.huy) tuyChon.huy(); });
  }

  function baoLoi(chu, oNhap) {
    var o = $("dtLoiTao"); o.textContent = chu;
    if (oNhap) oNhap.focus();
  }

  function vaoVuongQuoc() {
    var kqVQ = goc.KC_LOC_TEN.kiemTra($("dtOVuongQuoc").value);
    if (!kqVQ.hopLe) return baoLoi("Tên vương quốc: " + kqVQ.loi, $("dtOVuongQuoc"));
    var kqTL = goc.KC_LOC_TEN.kiemTra($("dtOThuLinh").value);
    if (!kqTL.hopLe) return baoLoi("Tên Thủ lĩnh: " + kqTL.loi, $("dtOThuLinh"));
    if (!tt.lop) return baoLoi("Con chọn lớp đang học nhé.", $("dtChonLop").children[0]);
    var cu = tuyChon.tienDo || {};
    var td = {
      tenVuongQuoc: kqVQ.ten, tenThuLinh: kqTL.ten, chungLoai: tt.hoSo.chungLoai, lop: tt.lop,
      thoiKy: cu.thoiKy || "do_da", taoLuc: cu.taoLuc
    };
    var okHs = goc.KC_NV_HO_SO.luu(tuyChon.tenDangNhap, tt.hoSo);
    var okTd = goc.KC_DT_TIEN_DO.luu(tuyChon.tenDangNhap, td);
    if (!okHs || !okTd) return baoLoi("Máy chưa lưu được (trình duyệt đang chặn bộ nhớ). Con nhờ bố mẹ kiểm tra nhé.");
    dong();
    if (tuyChon.xong) tuyChon.xong(goc.KC_DT_TIEN_DO.doc(tuyChon.tenDangNhap), goc.KC_NV_HO_SO.doc(tuyChon.tenDangNhap));
  }

  function dong() {
    goc.KC_SAN_KHAU.huy($("dtXemTruoc"));
    Array.prototype.forEach.call(document.querySelectorAll(".dtTheLoaiHinh"), function (cv) { goc.KC_SAN_KHAU.huy(cv); });
    $("dtManTao").hidden = true;
  }

  /** Mở màn tạo / sửa Thủ lĩnh. */
  function mo(tc) {
    tuyChon = tc;
    var td = tc.tienDo, hs = tc.hoSo;
    tt = {
      hoSo: NV.chuanHoa(hs || { chungLoai: "nhan", gioi: Math.random() < 0.5 ? "nam" : "nu", mauToc: 1, mauDa: 0, mauAo: Math.floor(Math.random() * 6) }),
      lop: td ? td.lop : 0,
      tuThe: "vay"
    };
    if (td) tt.hoSo.chungLoai = td.chungLoai;
    $("dtOVuongQuoc").value = td ? td.tenVuongQuoc : "";
    $("dtOThuLinh").value = td ? td.tenThuLinh : "";
    $("dtTieuDeTao").textContent = td ? "✏️ Sửa Thủ lĩnh" : "🏕️ Tạo Thủ lĩnh";
    $("dtNutVao").textContent = td ? "💾 Lưu Thủ lĩnh" : "🏕️ Vào vương quốc";
    $("dtManTao").hidden = false;
    ganSuKien();
    dungTuThe(); dungChungLoai(); dungToc(); dungLop();
    dungSoMau("dtMauToc", "toc", "mauToc"); dungSoMau("dtMauDa", "da", "mauDa"); dungSoMau("dtMauAo", "ao", "mauAo");
    goc.KC_SAN_KHAU.dang($("dtXemTruoc"), veXemTruoc);
    capNhat();
    $("dtManTao").scrollIntoView({ block: "start" });
  }

  goc.KC_DT_TAO = { mo: mo };
})(window);
