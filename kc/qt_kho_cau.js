// ================================================================
// FILE: kc/qt_kho_cau.js
// CHỨC NĂNG: Mục "❓ Kho câu hỏi" của trang Quản trị chung (KC_06C, Thiet_Ke_Kho_Cau_Hoi.md mục 8). Kho câu hỏi dùng chung
//   toàn app (bảng kc_cau_hoi trên Supabase), nên mục nằm ở Quản trị chung, không riêng một trò chơi. 6 phần (chip):
//   📋 Câu hỏi   : lọc (nguồn, trạng thái, môn, chủ đề, lớp, mức, tìm chữ / #mã / tên bé, đang dùng), xem đáp án đúng,
//                  số công trình đang dùng; ✅ Đạt (+ đưa vào thư viện), 🙈 Loại (lý do cho bé, mẫu chọn nhanh), ✏️ Sửa tại chỗ,
//                  🗑 Xoá; chọn nhiều câu -> làm cùng lúc (thanh dính đáy).
//   ➕ Thêm / Nhập: thêm một câu; nhập JSON (dán hoặc chọn file, kiểm trước ở trình duyệt, sai một câu thì không lưu câu nào).
//   📊 Ô thiếu câu: ô môn × lớp × mức × dạng chưa đủ số câu mục tiêu.
//   🚫 Từ cấm     : thêm (nhiều dòng) / xoá từ, ô thử một câu qua bộ lọc (thấy cả từ bị bắt).
//   📓 Nhật ký chặn: câu bé bị chặn, nhóm tự hại / khiêu dâm lên đầu, tô đỏ; đánh dấu đã xem.
//   ⚙️ Cấu hình    : giới hạn mỗi ngày, ngưỡng trùng, AI, số câu mục tiêu, thời gian giữ nhật ký.
//   Mọi RPC kc_cau_hoi_admin_* kiểm quyền admin ở máy chủ (SQL/supabase_kc06c_quan_tri_kho_cau.sql ở repo_rieng).
// BƯỚC: KC_06C - NGÀY: 12/11/2026
// PHỤ THUỘC: ../api.js (apiGoiRpc), ../admin_NC.js (adminGoiRpc, adminThoat, adminBaoTin, adminDinhDangGio), quantri_NC.html
//   có nút data-manhinh="khocau" + section #manhinh-khocau (#qkcGoc), qt_kho_cau.css.
// ================================================================
(function () {
  "use strict";
  if (typeof adminGoiRpc !== "function") return;
  var goc = document.getElementById("qkcGoc");
  if (!goc) return;

  var T = adminThoat;
  var TRANG_THAI = { cho_ai: "⏳ Chờ AI", cho_nguoi: "⏳ Chờ người duyệt", ai_dat: "🤖 AI cho đạt", dat: "✅ Đạt", ai_loai: "✏️ AI bảo sửa", loai: "🙈 Đã loại" };
  var NGUON = { he_thong: "⚙️ Hệ thống", quan_tri: "🛠️ Quản trị", be: "✏️ Câu của bé" };
  var MUC = { de: "Dễ", vua: "Vừa", kho: "Khó" };
  var NHOM = { tuc_tiu: "Tục tĩu", khieu_dam: "Khiêu dâm", bao_luc_ghe_ron: "Bạo lực ghê rợn", tu_hai: "Tự hại", chat_cam: "Chất cấm, rượu, cờ bạc",
    thu_ghet_bat_nat: "Thù ghét, bắt nạt", lien_lac_lua_dao: "Liên lạc riêng, lừa đảo", kinh_di: "Kinh dị",
    nhay_cam_hoc_tap: "Nhạy cảm học tập (không chặn, chờ duyệt)", ca_nhan: "Thông tin cá nhân", rac: "Câu rác" };
  var KIEU_SO = { co_dau: "Có dấu, nguyên từ", khong_dau: "Không dấu + chống lách chữ", chuoi: "Chuỗi con (chỉ từ dài)" };
  var LY_DO_MAU = ["Đáp án đúng chưa chính xác, con xem lại nhé.", "Câu hỏi chưa rõ ý, con viết lại rõ hơn nhé.",
    "Câu này có nhiều hơn một đáp án đúng, con sửa lại nhé.", "Câu này chưa phù hợp với các bạn nhỏ, con đặt câu khác nhé.",
    "Câu này giống câu đã có trong kho rồi, con nghĩ câu mới nhé.", "Con thử đặt câu có nội dung học tập hơn nhé."];
  var CAU_HINH = {
    "gioi_han.cau_moi_ngay": ["Giới hạn", "Số câu mỗi bé được gửi mỗi ngày"],
    "gioi_han.chan_moi_ngay": ["Giới hạn", "Bị chặn quá số lần này trong ngày thì tạm khoá đặt câu hôm đó"],
    "trung.nguong": ["Chặn trùng", "Ngưỡng gần giống (0,1 - 1; càng nhỏ càng chặt)"],
    "trung.nguong_cung_dap_an": ["Chặn trùng", "Ngưỡng gần giống khi cùng đáp án đúng"],
    "trung.do_dai_toi_thieu": ["Chặn trùng", "Câu ngắn hơn số ký tự này chỉ xét trùng y hệt"],
    "ai.bat": ["AI chấm câu của bé", "Bật AI chấm (tắt: câu bé chờ admin duyệt tay)"],
    "ai.mo_hinh": ["AI chấm câu của bé", "Tên mô hình AI"],
    "ai.diem_dat": ["AI chấm câu của bé", "Điểm tự tin tối thiểu để AI cho đạt (0-100)"],
    "ai.so_lan_thu_toi_da": ["AI chấm câu của bé", "Số lần thử lại khi AI lỗi"],
    "ai.giay_cho": ["AI chấm câu của bé", "Số giây chờ AI trả lời"],
    "ai.chu_ky_phut": ["AI chấm câu của bé", "Mỗi bao nhiêu phút máy chủ gọi AI chấm hàng chờ"],
    "kho.cau_moi_o": ["Kho", "Số câu mục tiêu mỗi ô (môn × lớp × mức × dạng)"],
    "nhat_ky.giu_ngay": ["Nhật ký", "Giữ nhật ký chặn bao nhiêu ngày"],
    "nhat_ky.giu_luot_ngay": ["Nhật ký", "Giữ lượt trả lời chi tiết bao nhiêu ngày"]
  };
  var CO = 30;

  var mon = [];             // [{ma, ten, bieuTuong, chuDe:[{ma, ten}]}]
  var loc = { nguon: "", trangThai: "", mon: "", chuDe: "", lop: "", muc: "", tim: "", dangDung: false, sap: "moi" };
  var trang = 0, tong = 0, dsCau = [], chon = {}, daMo = false, phanHienTai = "cau", lanTai = 0;

  // ---------------- tiện ích ----------------
  function el(id) { return document.getElementById(id); }
  function goi(ham, ts) {
    return adminGoiRpc(ham, ts || {}).then(function (kq) {
      if (!kq) return { thanhCong: false, thongBao: "Máy chủ chưa có hàm " + ham + " (cần chạy SQL KC_06C)" };
      return kq;
    }, function (e) { return { thanhCong: false, thongBao: "Không kết nối được máy chủ" + (e && e.message ? ": " + e.message : "") }; });
  }
  function loiKhongCoHam(kq) {
    return kq && kq.thongBao && /function|ham|does not exist|schema cache/i.test(kq.thongBao) && !/quan tri/i.test(kq.thongBao)
      ? " (máy chủ chưa chạy SQL KC_06C?)" : "";
  }
  function bao(kq, chuDat) {
    if (kq && kq.thanhCong) adminBaoTin("✅ " + chuDat, true);
    else adminBaoTin("❌ " + ((kq && kq.thongBao) || "Có lỗi") + loiKhongCoHam(kq), false);
  }
  function tenMon(ma) { for (var i = 0; i < mon.length; i++) if (mon[i].ma === ma) return mon[i].bieuTuong + " " + mon[i].ten; return ma; }
  function cacChuDe(ma) { for (var i = 0; i < mon.length; i++) if (mon[i].ma === ma) return mon[i].chuDe || []; return []; }
  function tenChuDe(m, cd) { var d = cacChuDe(m); for (var i = 0; i < d.length; i++) if (d[i].ma === cd) return d[i].ten; return cd; }
  function lopChu(c) {
    if (c.lopTu === null || c.lopTu === undefined) return "mọi lớp";
    return "Lớp " + c.lopTu + (c.lopDen !== null && c.lopDen !== undefined && c.lopDen !== c.lopTu ? "-" + c.lopDen : "");
  }
  function tuyChon(doiTuong, chon, dauTrong) {
    var h = dauTrong !== undefined ? '<option value="">' + T(dauTrong) + "</option>" : "";
    Object.keys(doiTuong).forEach(function (k) { h += '<option value="' + T(k) + '"' + (k === chon ? " selected" : "") + ">" + T(doiTuong[k]) + "</option>"; });
    return h;
  }
  function tuyChonMon(chon, dauTrong) {
    var o = {}; mon.forEach(function (m) { o[m.ma] = m.bieuTuong + " " + m.ten; }); return tuyChon(o, chon, dauTrong);
  }
  function tuyChonChuDe(m, chon, dauTrong) {
    var o = {}; cacChuDe(m).forEach(function (d) { o[d.ma] = d.ten; }); return tuyChon(o, chon, dauTrong);
  }
  function taiMon() {
    return apiGoiRpc("kc_mon_chu_de", {}).then(function (kq) { if (kq && kq.thanhCong) mon = kq.mon || []; }, function () {});
  }

  // ---------------- khung 6 phần ----------------
  var PHAN = [["cau", "📋 Câu hỏi"], ["them", "➕ Thêm / Nhập"], ["o", "📊 Ô thiếu câu"], ["tucam", "🚫 Từ cấm"], ["nhatky", "📓 Nhật ký chặn"], ["cauhinh", "⚙️ Cấu hình"]];
  goc.innerHTML = '<div class="qkcChips" role="tablist">' + PHAN.map(function (p) {
    return '<button type="button" class="qkcChip' + (p[0] === "cau" ? " dangChon" : "") + '" data-phan="' + p[0] + '">' + p[1]
      + ' <span class="qkcSo" id="qkcSo_' + p[0] + '"></span></button>';
  }).join("") + "</div>" + PHAN.map(function (p) {
    return '<div class="qkcPhan' + (p[0] === "cau" ? " hien" : "") + '" id="qkcPhan_' + p[0] + '"></div>';
  }).join("");
  goc.querySelector(".qkcChips").addEventListener("click", function (su) {
    var n = su.target.closest(".qkcChip"); if (n) moPhan(n.getAttribute("data-phan"));
  });
  function moPhan(p) {
    phanHienTai = p;
    goc.querySelectorAll(".qkcChip").forEach(function (n) { n.classList.toggle("dangChon", n.getAttribute("data-phan") === p); });
    goc.querySelectorAll(".qkcPhan").forEach(function (n) { n.classList.toggle("hien", n.id === "qkcPhan_" + p); });
    capNhatThanhChon();
    ({ cau: taiDs, them: veThem, o: taiO, tucam: taiTuCam, nhatky: taiNhatKy, cauhinh: taiCauHinh })[p]();
  }

  // ================================================================
  // PHẦN 1: DANH SÁCH CÂU
  // ================================================================
  function veKhungCau() {
    var p = el("qkcPhan_cau");
    p.innerHTML =
      '<div class="qkcLoc">'
      + '<input type="search" id="qkcTim" placeholder="Tìm chữ trong câu / đáp án, #mã câu, tên bé..." aria-label="Tìm">'
      + '<details class="qkcLocThem" id="qkcLocThem"><summary>⚙️ Bộ lọc</summary><div class="qkcLocLuoi">'
      + '<label>Nguồn<select id="qkcLNguon"><option value="">Tất cả</option><option value="he_thong">⚙️ Hệ thống</option><option value="be">✏️ Câu của bé</option></select></label>'
      + '<label>Trạng thái<select id="qkcLTrangThai"><option value="">Tất cả</option><option value="cho_duyet">⏳ Chờ duyệt (AI / người)</option>'
      + tuyChon(TRANG_THAI, "") + "</select></label>"
      + '<label>Môn<select id="qkcLMon">' + tuyChonMon("", "Tất cả") + "</select></label>"
      + '<label>Chủ đề<select id="qkcLChuDe"><option value="">Tất cả</option></select></label>'
      + '<label>Lớp<select id="qkcLLop"><option value="">Tất cả</option>' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (l) { return '<option value="' + l + '">Lớp ' + l + "</option>"; }).join("") + "</select></label>"
      + '<label>Mức<select id="qkcLMuc">' + tuyChon(MUC, "", "Tất cả") + "</select></label>"
      + '<label>Sắp xếp<select id="qkcLSap"><option value="moi">Mới thêm trước</option><option value="sua">Mới sửa trước</option><option value="cu">Cũ trước</option><option value="dung">Đang dùng nhiều</option></select></label>'
      + '<label class="qkcHop"><input type="checkbox" id="qkcLDangDung"> Chỉ câu đang ở công trình</label>'
      + '<button type="button" class="adminNut adminNutPhu" id="qkcBoLoc">↺ Bỏ lọc</button>'
      + "</div></details></div>"
      + '<div class="qkcDongTom"><label class="qkcHop"><input type="checkbox" id="qkcChonTrang"> Chọn cả trang</label><span id="qkcTom"></span></div>'
      + '<div id="qkcDs" class="qkcDs"></div><div class="qkcTrang" id="qkcPhanTrang"></div>';
    var hen = null;
    el("qkcTim").addEventListener("input", function () { clearTimeout(hen); hen = setTimeout(function () { loc.tim = el("qkcTim").value; trang = 0; taiDs(); }, 350); });
    [["qkcLNguon", "nguon"], ["qkcLTrangThai", "trangThai"], ["qkcLMon", "mon"], ["qkcLChuDe", "chuDe"], ["qkcLLop", "lop"], ["qkcLMuc", "muc"], ["qkcLSap", "sap"]].forEach(function (x) {
      el(x[0]).addEventListener("change", function () {
        loc[x[1]] = el(x[0]).value;
        if (x[1] === "mon") { loc.chuDe = ""; el("qkcLChuDe").innerHTML = tuyChonChuDe(loc.mon, "", "Tất cả"); }
        trang = 0; taiDs();
      });
    });
    el("qkcLDangDung").addEventListener("change", function () { loc.dangDung = el("qkcLDangDung").checked; trang = 0; taiDs(); });
    el("qkcBoLoc").addEventListener("click", function () {
      loc = { nguon: "", trangThai: "", mon: "", chuDe: "", lop: "", muc: "", tim: "", dangDung: false, sap: "moi" }; trang = 0; datOLoc(); taiDs();
    });
    el("qkcChonTrang").addEventListener("change", function () {
      var c = el("qkcChonTrang").checked;
      dsCau.forEach(function (q) { if (c) chon[q.id] = q; else delete chon[q.id]; });
      veDs(); capNhatThanhChon();
    });
    el("qkcDs").addEventListener("click", bamTrongDs);
    el("qkcDs").addEventListener("change", function (su) {
      var h = su.target.closest("[data-chon]");
      if (!h) return;
      var id = Number(h.getAttribute("data-chon")), q = timCau(id);
      if (h.checked && q) chon[id] = q; else delete chon[id];
      h.closest(".qkcThe").classList.toggle("daChon", h.checked);
      capNhatThanhChon();
    });
    el("qkcPhanTrang").addEventListener("click", function (su) {
      var n = su.target.closest("[data-trang]"); if (!n) return;
      trang = Number(n.getAttribute("data-trang")); taiDs(); window.scrollTo(0, 0);
    });
    if (window.matchMedia("(min-width: 900px)").matches) el("qkcLocThem").open = true;
  }
  function datOLoc() {
    el("qkcTim").value = loc.tim; el("qkcLNguon").value = loc.nguon; el("qkcLTrangThai").value = loc.trangThai; el("qkcLMon").value = loc.mon;
    el("qkcLChuDe").innerHTML = tuyChonChuDe(loc.mon, loc.chuDe, "Tất cả"); el("qkcLLop").value = loc.lop; el("qkcLMuc").value = loc.muc;
    el("qkcLSap").value = loc.sap; el("qkcLDangDung").checked = loc.dangDung;
  }
  function timCau(id) { for (var i = 0; i < dsCau.length; i++) if (dsCau[i].id === id) return dsCau[i]; return chon[id] || null; }

  function taiDs() {
    var so = ++lanTai, o = el("qkcDs");
    o.innerHTML = '<p class="adminDangTai">Đang tải câu hỏi...</p>';
    goi("kc_cau_hoi_admin_ds", { p_loc: loc, p_trang: trang, p_co: CO }).then(function (kq) {
      if (so !== lanTai) return;
      if (!kq.thanhCong) { o.innerHTML = '<p class="adminGhiChu">❌ ' + T(kq.thongBao) + T(loiKhongCoHam(kq)) + "</p>"; return; }
      dsCau = kq.cau || []; tong = kq.tong | 0;
      var d = kq.dem || {};
      el("qkcSo_cau").textContent = d.cho_duyet ? d.cho_duyet : "";
      el("qkcSo_cau").title = d.cho_duyet ? d.cho_duyet + " câu chờ duyệt" : "";
      el("qkcTom").textContent = tong + " câu" + (tong !== (d.tat_ca | 0) ? " (trong " + (d.tat_ca | 0) + " câu của kho)" : "")
        + (d.cho_duyet ? " · ⏳ " + d.cho_duyet + " chờ duyệt" : "") + (d.be ? " · ✏️ " + d.be + " câu của bé" : "");
      veDs(); vePhanTrang();
    });
  }
  function vePhanTrang() {
    var soTrang = Math.max(1, Math.ceil(tong / CO)), h = "";
    if (soTrang > 1) {
      h += '<button type="button" class="adminNut adminNutPhu" data-trang="' + Math.max(0, trang - 1) + '"' + (trang === 0 ? " disabled" : "") + ">‹ Trước</button>";
      h += "<span>Trang " + (trang + 1) + " / " + soTrang + "</span>";
      h += '<button type="button" class="adminNut adminNutPhu" data-trang="' + Math.min(soTrang - 1, trang + 1) + '"' + (trang >= soTrang - 1 ? " disabled" : "") + ">Sau ›</button>";
    }
    el("qkcPhanTrang").innerHTML = h;
  }
  function theCau(q) {
    var dapAn = (q.dapAn || []).map(function (a, i) {
      var dung = (q.dung || []).indexOf(i) >= 0;
      return '<li class="' + (dung ? "dung" : "") + '">' + (dung ? "✓ " : "") + T(a) + "</li>";
    }).join("");
    var nhan = '<span class="qkcNhan tt_' + T(q.trangThai) + '">' + T(TRANG_THAI[q.trangThai] || q.trangThai) + "</span>"
      + '<span class="qkcNhan">' + T(tenMon(q.mon)) + "</span>"
      + '<span class="qkcNhan">' + T(tenChuDe(q.mon, q.chuDe)) + "</span>"
      + '<span class="qkcNhan">' + T(lopChu(q)) + " · " + T(MUC[q.muc] || q.muc) + "</span>"
      + (q.nguon === "be" ? '<span class="qkcNhan nguonBe">' + T(NGUON.be) + (q.congKhai ? " · 📚 thư viện" : "") + "</span>" : "")
      + (q.soCongTrinh ? '<span class="qkcNhan dangDung" title="Số công trình đang gắn câu này">🏰 ' + q.soCongTrinh + " công trình</span>" : "")
      + ((q.nhanLoc || []).indexOf("nhay_cam_hoc_tap") >= 0 ? '<span class="qkcNhan nhayCam">⚠️ nhạy cảm học tập</span>' : "")
      + (q.amThanh ? '<span class="qkcNhan">🔊 câu nghe</span>' : "") + (q.hinh ? '<span class="qkcNhan">🖼️ có hình</span>' : "");
    var ai = q.aiKetQua ? '<div class="qkcAi">🤖 AI: ' + T(q.aiKetQua.ly_do || "") + (q.aiKetQua.diem_tu_tin !== undefined ? " · tự tin " + T(q.aiKetQua.diem_tu_tin) : "")
      + ((q.aiKetQua.nhom_vi_pham || []).length ? " · " + T(q.aiKetQua.nhom_vi_pham.map(function (n) { return NHOM[n] || n; }).join(", ")) : "") + "</div>" : "";
    var nut = (q.trangThai !== "dat" ? '<button type="button" class="adminNut adminNutThanhCong" data-viec="dat">✅ Đạt</button>' : "")
      + (q.trangThai !== "loai" ? '<button type="button" class="adminNut adminNutPhu" data-viec="loai">🙈 Loại</button>' : "")
      + '<button type="button" class="adminNut" data-viec="sua">✏️ Sửa</button>'
      + '<button type="button" class="adminNut adminNutNguyHiem" data-viec="xoa">🗑️ Xoá</button>';
    return '<article class="qkcThe' + (chon[q.id] ? " daChon" : "") + '" data-id="' + q.id + '">'
      + '<div class="qkcDauThe"><label class="qkcHop"><input type="checkbox" data-chon="' + q.id + '"' + (chon[q.id] ? " checked" : "") + "> <b>#" + q.id + "</b></label>"
      + '<div class="qkcNhanDong">' + nhan + "</div></div>"
      + '<div class="qkcThan"><p class="qkcNoiDung">' + (q.hinhChu ? '<span class="qkcHinhChu">' + T(q.hinhChu) + "</span> " : "") + T(q.noiDung) + "</p>"
      + '<ol class="qkcDapAn" type="A">' + dapAn + "</ol>"
      + (q.loiGiai ? '<p class="qkcLoiGiai">💡 ' + T(q.loiGiai) + "</p>" : "")
      + (q.lyDoBe ? '<p class="qkcLyDo">💬 Lý do cho bé: ' + T(q.lyDoBe) + "</p>" : "") + ai
      + '<p class="qkcPhu">' + T(NGUON[q.nguon] || q.nguon) + (q.taoBoi ? " · " + T(q.taoBoi) : "") + " · thêm " + T(adminDinhDangGio(q.taoLuc))
      + (q.duyetBoi ? " · duyệt " + T(q.duyetBoi) : "") + (q.phienBan > 1 ? " · sửa " + (q.phienBan - 1) + " lần" : "") + (q.maNgoai ? " · " + T(q.maNgoai) : "") + "</p></div>"
      + '<div class="qkcNutThe">' + nut + "</div></article>";
  }
  function veDs() {
    var o = el("qkcDs");
    if (!dsCau.length) { o.innerHTML = '<p class="adminGhiChu qkcRong">Không có câu nào khớp bộ lọc.</p>'; el("qkcChonTrang").checked = false; return; }
    o.innerHTML = dsCau.map(theCau).join("");
    el("qkcChonTrang").checked = dsCau.every(function (q) { return chon[q.id]; });
  }
  function bamTrongDs(su) {
    var n = su.target.closest("[data-viec]"); if (!n) return;
    var the = n.closest(".qkcThe"), id = Number(the.getAttribute("data-id")), q = timCau(id), v = n.getAttribute("data-viec");
    if (v === "dat") hopDat([id], q && q.nguon === "be");
    else if (v === "loai") hopLoai([id], q && q.nguon === "be");
    else if (v === "xoa") xoa([id]);
    else if (v === "sua") {
      the.classList.add("dangSua");
      var f = formCau(q, function (kq) { capNhatMotCau(kq.cau); }, function () { the.outerHTML = theCau(q); });
      the.innerHTML = ""; the.appendChild(f);
    }
  }
  function capNhatMotCau(c) {
    for (var i = 0; i < dsCau.length; i++) if (dsCau[i].id === c.id) dsCau[i] = c;
    if (chon[c.id]) chon[c.id] = c;
    var the = el("qkcDs").querySelector('.qkcThe[data-id="' + c.id + '"]');
    if (the) the.outerHTML = theCau(c);
  }

  // ---- thanh chọn nhiều (dính đáy)
  var thanh = document.createElement("div");
  thanh.className = "qkcThanhChon"; thanh.id = "qkcThanhChon";
  thanh.innerHTML = '<span id="qkcSoChon"></span><button type="button" class="adminNut adminNutThanhCong" data-loat="dat">✅ Đạt</button>'
    + '<button type="button" class="adminNut adminNutPhu" data-loat="loai">🙈 Loại</button><button type="button" class="adminNut adminNutNguyHiem" data-loat="xoa">🗑️ Xoá</button>'
    + '<button type="button" class="adminNut adminNutPhu" data-loat="bo">✕ Bỏ chọn</button>';
  document.body.appendChild(thanh);
  thanh.addEventListener("click", function (su) {
    var n = su.target.closest("[data-loat]"); if (!n) return;
    var ids = Object.keys(chon).map(Number), coBe = ids.some(function (i) { return chon[i].nguon === "be"; }), v = n.getAttribute("data-loat");
    if (v === "bo") { chon = {}; veDs(); capNhatThanhChon(); }
    else if (v === "dat") hopDat(ids, coBe);
    else if (v === "loai") hopLoai(ids, coBe);
    else xoa(ids);
  });
  function capNhatThanhChon() {
    var n = Object.keys(chon).length, hien = n > 0 && phanHienTai === "cau" && el("manhinh-khocau").classList.contains("dangHien");
    thanh.classList.toggle("hien", hien);
    document.body.classList.toggle("qkcCoThanh", hien);
    el("qkcSoChon").textContent = "Đã chọn " + n + " câu";
  }
  document.addEventListener("adminDaChuyenManHinh", function (su) {
    capNhatThanhChon();
    if (su.detail && su.detail.ten === "khocau") moLanDau();
  });

  // ---- hộp hỏi Đạt / Loại
  function hop(tieuDe, noiDung, chuNut, lop, xong) {
    var nen = document.createElement("div");
    nen.className = "qkcNenHop";
    nen.innerHTML = '<div class="qkcHopThoai" role="dialog" aria-modal="true"><h4>' + tieuDe + "</h4>" + noiDung
      + '<div class="qkcNutHop"><button type="button" class="adminNut adminNutPhu" data-hop="huy">Huỷ</button>'
      + '<button type="button" class="adminNut ' + lop + '" data-hop="ok">' + chuNut + "</button></div></div>";
    document.body.appendChild(nen);
    nen.addEventListener("click", function (su) {
      var n = su.target.closest("[data-hop]");
      if (su.target === nen || (n && n.getAttribute("data-hop") === "huy")) { nen.remove(); return; }
      if (n && n.getAttribute("data-hop") === "ok") xong(nen, function () { nen.remove(); });
    });
    var dau = nen.querySelector("textarea, select, input"); if (dau) dau.focus();
    return nen;
  }
  function hopDat(ids, coBe) {
    hop("✅ Cho đạt " + ids.length + " câu",
      (coBe ? '<label class="qkcHop"><input type="checkbox" id="qkcHopCongKhai" checked> 📚 Đưa câu của bé vào thư viện chung (mọi bé chọn được)</label>'
        : '<p class="adminGhiChu">Câu sẽ dùng được ngay trong trò chơi.</p>'), "✅ Đạt", "adminNutThanhCong", function (nen, dong) {
      var ck = nen.querySelector("#qkcHopCongKhai");
      goi("kc_cau_hoi_admin_duyet", { p_ids: ids, p_viec: "dat", p_ly_do: "", p_cong_khai: ck ? ck.checked : true }).then(function (kq) {
        dong(); sauLoat(kq, "Đã cho đạt " + (kq.so | 0) + " câu");
      });
    });
  }
  function hopLoai(ids, coBe) {
    var nen = hop("🙈 Loại " + ids.length + " câu",
      '<p class="adminGhiChu">Câu bị loại không còn dùng trong trò chơi; công trình đang gắn câu thì tự lấy câu khác.'
      + (coBe ? " Bé sẽ thấy lý do bên dưới (viết nhẹ nhàng)." : "") + "</p>"
      + '<label class="qkcNhanO">Lý do cho bé' + (coBe ? " (bắt buộc)" : " (không bắt buộc)") + '<select id="qkcHopMau"><option value="">Chọn nhanh một mẫu...</option>'
      + LY_DO_MAU.map(function (m) { return "<option>" + T(m) + "</option>"; }).join("") + "</select></label>"
      + '<textarea id="qkcHopLyDo" maxlength="300" rows="3" placeholder="Lý do..."></textarea>', "🙈 Loại", "adminNutNguyHiem", function (nen, dong) {
      var ly = nen.querySelector("#qkcHopLyDo").value.trim();
      if (coBe && !ly) { nen.querySelector("#qkcHopLyDo").classList.add("loi"); return; }
      goi("kc_cau_hoi_admin_duyet", { p_ids: ids, p_viec: "loai", p_ly_do: ly, p_cong_khai: false }).then(function (kq) {
        dong(); sauLoat(kq, "Đã loại " + (kq.so | 0) + " câu" + (kq.goCongTrinh ? ", gỡ khỏi " + kq.goCongTrinh + " công trình" : ""));
      });
    });
    nen.querySelector("#qkcHopMau").addEventListener("change", function () { if (this.value) nen.querySelector("#qkcHopLyDo").value = this.value; });
  }
  function xoa(ids) {
    var dangDung = ids.reduce(function (s, i) { var q = timCau(i); return s + (q && q.soCongTrinh ? 1 : 0); }, 0);
    hop("🗑️ Xoá hẳn " + ids.length + " câu", '<p>Xoá rồi không lấy lại được.' + (dangDung ? " <b>" + dangDung + " câu đang ở công trình</b>: công trình tự lấy câu khác khi có trận." : "")
      + ' Muốn tạm cất đi thì dùng <b>🙈 Loại</b>.</p>', "🗑️ Xoá hẳn", "adminNutNguyHiem", function (nen, dong) {
      goi("kc_cau_hoi_admin_xoa", { p_ids: ids }).then(function (kq) {
        dong(); sauLoat(kq, "Đã xoá " + (kq.so | 0) + " câu" + (kq.goCongTrinh ? ", " + kq.goCongTrinh + " công trình mất câu (tự lấy câu khác)" : ""));
      });
    });
  }
  function sauLoat(kq, chuDat) {
    if (kq.thanhCong && kq.loi && kq.loi.length) {
      adminBaoTin("⚠️ " + chuDat + ". " + kq.loi.length + " câu không đổi được: " + kq.loi.map(function (l) { return "#" + l.id + " " + l.loi; }).join("; "), false);
    } else bao(kq, chuDat);
    if (kq.thanhCong) { chon = {}; capNhatThanhChon(); taiDs(); }
  }

  // ---------------- biểu mẫu một câu (sửa tại chỗ / thêm mới) ----------------
  function formCau(q, sauLuu, huy) {
    var moi = !q, c = q || { mon: (mon[0] && mon[0].ma) || "toan", chuDe: "khac", lopTu: null, lopDen: null, muc: "vua", noiDung: "", dapAn: ["", "", "", ""], dung: [0], loiGiai: "", hinhChu: "", congKhai: true, nguon: "he_thong" };
    var f = document.createElement("form");
    f.className = "qkcForm"; f.noValidate = true;
    f.innerHTML = '<div class="qkcFormLuoi">'
      + '<label>Môn<select name="mon">' + tuyChonMon(c.mon) + "</select></label>"
      + '<label>Chủ đề<select name="chuDe"></select></label>'
      + '<label class="qkcCdMoi" hidden>Tên chủ đề mới<input name="chuDeTen" maxlength="80" placeholder="vd Hình học"></label>'
      + '<label>Từ lớp<select name="lopTu"><option value="">Mọi lớp</option>' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (l) { return '<option value="' + l + '"' + (c.lopTu === l ? " selected" : "") + ">" + (l === 0 ? "Mầm non" : "Lớp " + l) + "</option>"; }).join("") + "</select></label>"
      + '<label>Đến lớp<select name="lopDen"><option value="">(như từ lớp)</option>' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (l) { return '<option value="' + l + '"' + (c.lopDen === l ? " selected" : "") + ">" + (l === 0 ? "Mầm non" : "Lớp " + l) + "</option>"; }).join("") + "</select></label>"
      + '<label>Mức<select name="muc">' + tuyChon(MUC, c.muc) + "</select></label>"
      + '<label class="qkcRong2">Câu hỏi<textarea name="noiDung" rows="2" maxlength="300" required>' + T(c.noiDung) + "</textarea></label>"
      + '<label>Hình emoji (không bắt buộc)<input name="hinhChu" maxlength="40" value="' + T(c.hinhChu) + '" placeholder="vd 🐱"></label>'
      + '<div class="qkcRong2"><div class="qkcNhanO">Đáp án <small>(chạm ◉ để chọn đáp án đúng, 2-6 đáp án)</small></div><div class="qkcDsDapAn"></div>'
      + '<button type="button" class="adminNut adminNutPhu qkcThemDa">＋ Thêm đáp án</button></div>'
      + '<label class="qkcRong2">Lời giải (không bắt buộc)<textarea name="loiGiai" rows="2" maxlength="300">' + T(c.loiGiai) + "</textarea></label>"
      + (c.nguon === "be" ? '<label class="qkcHop qkcRong2"><input type="checkbox" name="congKhai"' + (c.congKhai || c.trangThai !== "dat" ? " checked" : "") + "> 📚 Đưa vào thư viện chung</label>" : "")
      + "</div><p class=\"qkcLoiForm\" hidden></p>"
      + '<div class="qkcNutForm">' + (huy ? '<button type="button" class="adminNut adminNutPhu" data-f="huy">Huỷ</button>' : "")
      + '<button type="submit" class="adminNut adminNutThanhCong">' + (moi ? "➕ Thêm vào kho" : "💾 Lưu (thành ✅ Đạt)") + "</button></div>";
    var sMon = f.elements.mon, sCd = f.elements.chuDe, oCdMoi = f.querySelector(".qkcCdMoi"), dsDa = f.querySelector(".qkcDsDapAn");
    function veCd(chonCd) {
      sCd.innerHTML = tuyChonChuDe(sMon.value, chonCd) + '<option value="__moi">➕ Chủ đề mới...</option>';
      if (chonCd && !cacChuDe(sMon.value).some(function (d) { return d.ma === chonCd; })) sCd.insertAdjacentHTML("afterbegin", '<option value="' + T(chonCd) + '" selected>' + T(chonCd) + "</option>");
      oCdMoi.hidden = sCd.value !== "__moi";
    }
    veCd(c.chuDe);
    sMon.addEventListener("change", function () { veCd("khac"); });
    sCd.addEventListener("change", function () { oCdMoi.hidden = sCd.value !== "__moi"; });
    var ten = "da" + Math.random().toString(36).slice(2, 8);
    function dongDa(gt, dung) {
      var d = document.createElement("div"); d.className = "qkcDongDa";
      d.innerHTML = '<input type="radio" name="' + ten + '"' + (dung ? " checked" : "") + ' aria-label="Đáp án đúng"><input type="text" maxlength="80" value="' + T(gt) + '" aria-label="Đáp án">'
        + '<button type="button" class="qkcBoDa" aria-label="Bỏ đáp án">✕</button>';
      dsDa.appendChild(d);
    }
    (c.dapAn || []).forEach(function (a, i) { dongDa(a, (c.dung || [0]).indexOf(i) >= 0); });
    f.querySelector(".qkcThemDa").addEventListener("click", function () { if (dsDa.children.length < 6) dongDa("", false); });
    dsDa.addEventListener("click", function (su) { if (su.target.classList.contains("qkcBoDa") && dsDa.children.length > 2) su.target.parentNode.remove(); });
    var nutHuy = f.querySelector('[data-f="huy"]'); if (nutHuy) nutHuy.addEventListener("click", huy);
    var oLoi = f.querySelector(".qkcLoiForm");
    function loiF(chu) { oLoi.hidden = !chu; oLoi.textContent = chu || ""; }
    function guiDi(boQuaTrung) {
      var dong = Array.prototype.slice.call(dsDa.children), dapAn = [], dung = -1;
      dong.forEach(function (d) { var v = d.querySelector('input[type="text"]').value.trim(); if (v) { if (d.querySelector('input[type="radio"]').checked) dung = dapAn.length; dapAn.push(v); } });
      var nd = f.elements.noiDung.value.trim();
      if (nd.length < 3) return loiF("Câu hỏi cần ít nhất 3 ký tự.");
      if (dapAn.length < 2) return loiF("Cần ít nhất 2 đáp án.");
      if (dung < 0) return loiF("Chạm ◉ để chọn đáp án đúng.");
      var thuong = dapAn.map(function (a) { return a.toLowerCase(); });
      if (thuong.some(function (a, i) { return thuong.indexOf(a) !== i; })) return loiF("Hai đáp án trùng nhau.");
      var cd = sCd.value, cdTen = "";
      if (cd === "__moi") {
        cdTen = f.elements.chuDeTen.value.trim();
        if (!cdTen) return loiF("Gõ tên chủ đề mới.");
        cd = cdTen.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "khac";
      }
      var lt = f.elements.lopTu.value, ld = f.elements.lopDen.value;
      if (lt !== "" && ld !== "" && Number(ld) < Number(lt)) return loiF("'Đến lớp' phải lớn hơn hoặc bằng 'Từ lớp'.");
      if (lt === "" && ld !== "") return loiF("Chọn 'Từ lớp' trước.");
      var cau = { mon: sMon.value, chuDe: cd, chuDeTen: cdTen, lopTu: lt === "" ? null : Number(lt), lopDen: ld === "" ? (lt === "" ? null : Number(lt)) : Number(ld),
        muc: f.elements.muc.value, noiDung: nd, dapAn: dapAn, dung: [dung], loiGiai: f.elements.loiGiai.value.trim(), hinhChu: f.elements.hinhChu.value.trim() };
      if (f.elements.congKhai) cau.congKhai = f.elements.congKhai.checked;
      loiF("");
      var nutLuu = f.querySelector('[type="submit"]'); nutLuu.disabled = true;
      goi("kc_cau_hoi_admin_sua", { p_id: moi ? null : q.id, p_cau: cau, p_phien_ban: moi ? null : q.phienBan, p_bo_qua_trung: !!boQuaTrung }).then(function (kq) {
        nutLuu.disabled = false;
        if (kq.thanhCong) {
          if (cdTen) taiMon();
          var canh = (kq.canhBao || []).length ? " ⚠️ Có chữ trong nhóm: " + kq.canhBao.map(function (n) { return NHOM[n] || n; }).join(", ") + " (admin chịu trách nhiệm)" : "";
          adminBaoTin((canh ? "⚠️ " : "✅ ") + (moi ? "Đã thêm câu #" + kq.cau.id : "Đã lưu câu #" + kq.cau.id) + (kq.nhayCam ? " · có từ nhạy cảm học tập" : "") + canh, !canh);
          sauLuu(kq);
        } else if (kq.trung && kq.trung.tang === 2 && !boQuaTrung) {
          if (window.confirm("Câu này gần giống câu #" + kq.trung.id + ":\n\"" + kq.trung.noiDung + "\"\n\nVẫn lưu?")) guiDi(true);
        } else if (kq.xungDot) {
          loiF("Câu vừa được sửa ở nơi khác. Bấm Huỷ rồi mở lại để sửa trên bản mới.");
        } else loiF((kq.trung ? "Đã có câu y hệt (#" + kq.trung.id + "): " + kq.trung.noiDung : kq.thongBao || "Có lỗi") + loiKhongCoHam(kq));
      });
    }
    f.addEventListener("submit", function (su) { su.preventDefault(); guiDi(false); });
    return f;
  }

  // ================================================================
  // PHẦN 2: THÊM MỘT CÂU / NHẬP JSON
  // ================================================================
  var MAU_JSON = '[\n  {\n    "mon": "vat_ly", "chuDe": "luc", "chuDeTen": "Lực",\n    "lopTu": 6, "lopDen": 6, "muc": "de",\n    "noiDung": "Đơn vị đo lực là gì?",\n    "dapAn": ["Niutơn (N)", "Mét (m)", "Giây (s)", "Ki-lô-gam (kg)"],\n    "dung": [0],\n    "loiGiai": "Lực đo bằng Niutơn."\n  }\n]';
  var daVeThem = false;
  function veThem() {
    if (daVeThem) return;
    daVeThem = true;
    var p = el("qkcPhan_them");
    p.innerHTML = '<div class="qkcHaiCot"><section class="qkcTheLon"><h4>➕ Thêm một câu</h4><p class="adminGhiChu">Câu admin thêm là câu hệ thống: dùng ngay ở mọi trò chơi (cả trận quái, thư viện câu của bé).</p><div id="qkcFormMoi"></div></section>'
      + '<section class="qkcTheLon"><h4>📥 Nhập nhiều câu từ JSON</h4>'
      + '<p class="adminGhiChu">Dán JSON (hoặc chọn file .json) là một mảng câu, tối đa 500 câu mỗi lần. Câu trùng câu đã có thì bỏ qua; câu sai khuôn thì <b>không lưu câu nào</b> và báo câu sai. Môn có sẵn: '
      + mon.map(function (m) { return "<code>" + T(m.ma) + "</code>"; }).join(", ") + ".</p>"
      + '<details class="qkcMau"><summary>Xem khuôn mẫu</summary><pre>' + T(MAU_JSON) + "</pre><p class=\"adminGhiChu\">Bắt buộc: <code>mon</code>, <code>noiDung</code>, <code>dapAn</code> (2-6), <code>dung</code> (vị trí đáp án đúng, đếm từ 0). Không bắt buộc: <code>chuDe</code> + <code>chuDeTen</code> (chủ đề mới tự tạo), <code>lopTu</code>, <code>lopDen</code>, <code>muc</code> (de / vua / kho), <code>loiGiai</code>, <code>hinhChu</code>, <code>maNgoai</code> (mã riêng để nhập lại không trùng).</p></details>"
      + '<input type="file" id="qkcFile" accept=".json,application/json">'
      + '<textarea id="qkcJson" rows="10" spellcheck="false" placeholder="[ { &quot;mon&quot;: &quot;toan&quot;, ... } ]"></textarea>'
      + '<label class="qkcHop"><input type="checkbox" id="qkcTrungGan" checked> Bỏ qua cả câu gần giống câu đã có</label>'
      + '<div class="qkcNutForm"><button type="button" class="adminNut adminNutPhu" id="qkcKiemJson">🔎 Kiểm tra</button><button type="button" class="adminNut adminNutThanhCong" id="qkcNhapJson" disabled>📥 Nhập vào kho</button></div>'
      + '<div id="qkcKqJson"></div></section></div>';
    el("qkcFormMoi").appendChild(formCau(null, function () { daVeThem = false; veThem(); }, null));
    el("qkcFile").addEventListener("change", function () {
      var f = this.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () { el("qkcJson").value = r.result; kiemJson(); };
      r.readAsText(f);
    });
    el("qkcJson").addEventListener("input", function () { el("qkcNhapJson").disabled = true; });
    el("qkcKiemJson").addEventListener("click", kiemJson);
    el("qkcNhapJson").addEventListener("click", function () {
      var ds = kiemJson(); if (!ds) return;
      var nut = this; nut.disabled = true;
      el("qkcKqJson").innerHTML = '<p class="adminDangTai">Đang nhập ' + ds.length + " câu...</p>";
      goi("kc_cau_hoi_admin_nhap", { p_ds: ds, p_loc: true, p_trung_gan: el("qkcTrungGan").checked }).then(function (kq) {
        var o = el("qkcKqJson");
        if (!kq.thanhCong) {
          o.innerHTML = '<div class="qkcKq loi"><b>❌ ' + T(kq.thongBao) + T(loiKhongCoHam(kq)) + "</b>" + (kq.loi || []).map(function (l) { return "<div>Câu " + l.viTri + ": " + T(l.loi) + "</div>"; }).join("") + "</div>";
          return;
        }
        o.innerHTML = '<div class="qkcKq"><b>✅ Đã thêm ' + kq.them + " câu.</b> Đã có (cùng mã): " + kq.daCo + " · Trùng bỏ qua: " + kq.trung
          + (kq.trungChiTiet || []).map(function (t) { return "<div>↷ Câu " + t.viTri + " giống: " + T(t.giongVoi) + "</div>"; }).join("")
          + ((kq.canhBao || []).length ? "<div><b>⚠️ " + kq.canhBao.length + " câu có chữ trong nhóm từ cấm (vẫn nhập, admin chịu trách nhiệm):</b></div>"
            + kq.canhBao.map(function (t) { return "<div>Câu " + t.viTri + " (" + T((t.nhom || []).map(function (n) { return NHOM[n] || n; }).join(", ")) + "): " + T(t.noiDung) + "</div>"; }).join("") : "") + "</div>";
        taiMon();
      });
    });
  }
  function kiemJson() {
    var o = el("qkcKqJson"), nut = el("qkcNhapJson"), ds, loi = [];
    nut.disabled = true;
    try { ds = JSON.parse(el("qkcJson").value); } catch (e) { o.innerHTML = '<div class="qkcKq loi">❌ JSON sai cú pháp: ' + T(e.message) + "</div>"; return null; }
    if (ds && !Array.isArray(ds) && Array.isArray(ds.cau)) ds = ds.cau;
    if (!Array.isArray(ds) || !ds.length) { o.innerHTML = '<div class="qkcKq loi">❌ Cần một mảng câu (vd <code>[ {...}, {...} ]</code>).</div>'; return null; }
    if (ds.length > 500) { o.innerHTML = '<div class="qkcKq loi">❌ ' + ds.length + " câu: tối đa 500 câu mỗi lần, chia file nhỏ hơn.</div>"; return null; }
    var maMon = mon.map(function (m) { return m.ma; });
    ds.forEach(function (c, i) {
      var l = [], n = i + 1;
      if (!c || typeof c !== "object") { loi.push("Câu " + n + ": không phải đối tượng"); return; }
      if (maMon.length && maMon.indexOf(c.mon) < 0) l.push("môn '" + c.mon + "' không có");
      if (typeof c.noiDung !== "string" || c.noiDung.trim().length < 3 || c.noiDung.length > 300) l.push("noiDung phải dài 3-300 ký tự");
      if (!Array.isArray(c.dapAn) || c.dapAn.length < 2 || c.dapAn.length > 6) l.push("dapAn phải có 2-6 đáp án");
      else {
        if (c.dapAn.some(function (a) { return typeof a !== "string" || !a.trim() || a.length > 80; })) l.push("mỗi đáp án là chữ 1-80 ký tự");
        var t = c.dapAn.map(function (a) { return String(a).trim().toLowerCase(); });
        if (t.some(function (a, j) { return t.indexOf(a) !== j; })) l.push("hai đáp án trùng nhau");
      }
      if (!Array.isArray(c.dung) || c.dung.length !== 1 || !Number.isInteger(c.dung[0]) || !Array.isArray(c.dapAn) || c.dung[0] < 0 || c.dung[0] >= c.dapAn.length) l.push("dung phải là [vị trí đáp án đúng], đếm từ 0");
      if (c.muc !== undefined && !MUC[c.muc]) l.push("muc chỉ là de / vua / kho");
      ["lopTu", "lopDen"].forEach(function (k) { if (c[k] !== undefined && c[k] !== null && (!Number.isInteger(c[k]) || c[k] < 0 || c[k] > 12)) l.push(k + " phải là số 0-12"); });
      if (c.chuDe !== undefined && !/^[a-z0-9_]{1,40}$/.test(c.chuDe)) l.push("chuDe chỉ gồm a-z, 0-9, _ (tên có dấu để ở chuDeTen)");
      if (l.length) loi.push("Câu " + n + " (" + T(String(c.noiDung || "").slice(0, 40)) + "): " + l.join("; "));
    });
    if (loi.length) { o.innerHTML = '<div class="qkcKq loi"><b>❌ ' + loi.length + " câu sai, sửa rồi kiểm lại:</b>" + loi.slice(0, 50).map(function (x) { return "<div>" + x + "</div>"; }).join("") + "</div>"; return null; }
    o.innerHTML = '<div class="qkcKq">✅ ' + ds.length + " câu đúng khuôn. Bấm <b>📥 Nhập vào kho</b>.</div>";
    nut.disabled = false;
    return ds;
  }

  // ================================================================
  // PHẦN 3: Ô THIẾU CÂU
  // ================================================================
  var thongKe = null;
  function taiO() {
    var p = el("qkcPhan_o");
    p.innerHTML = '<p class="adminDangTai">Đang đếm câu...</p>';
    goi("kc_cau_hoi_admin_thong_ke").then(function (kq) {
      if (!kq.thanhCong) { p.innerHTML = '<p class="adminGhiChu">❌ ' + T(kq.thongBao) + "</p>"; return; }
      thongKe = kq; veO();
    });
  }
  function veO() {
    var kq = thongKe, p = el("qkcPhan_o"), tt = kq.tongTheoTrangThai || {}, o = kq.o || [];
    var thieu = o.filter(function (x) { return x.thieu; });
    el("qkcSo_o").textContent = thieu.length || "";
    var h = '<div class="qkcTomTat">' + Object.keys(TRANG_THAI).map(function (k) { return '<div class="qkcO1"><b>' + (tt[k] | 0) + "</b><span>" + T(TRANG_THAI[k]) + "</span></div>"; }).join("") + "</div>"
      + '<p class="adminGhiChu">Mỗi ô là một môn × lớp × mức × dạng câu hệ thống đã duyệt. Mục tiêu <b>' + kq.mucTieu + " câu mỗi ô</b> (đổi ở ⚙️ Cấu hình). "
      + "Có " + o.length + " ô, <b>" + thieu.length + " ô thiếu</b>. Ô thiếu thì thêm câu bằng ➕ Thêm / Nhập (trò chơi vẫn chạy: máy chủ tự lấy câu lớp gần nhất).</p>"
      + '<label class="qkcHop"><input type="checkbox" id="qkcChiThieu" checked> Chỉ hiện ô thiếu</label>'
      + '<div class="adminCuonNgang"><table class="adminBang qkcBangO"><thead><tr><th>Môn</th><th>Lớp</th><th>Mức</th><th>Dạng</th><th>Số câu</th><th>Còn thiếu</th></tr></thead><tbody id="qkcBodyO"></tbody></table></div>';
    p.innerHTML = h;
    function veBang() {
      var chi = el("qkcChiThieu").checked, ds = chi ? thieu : o;
      el("qkcBodyO").innerHTML = ds.length ? ds.map(function (x) {
        var phan = Math.min(100, Math.round(100 * x.soCau / kq.mucTieu));
        return '<tr class="' + (x.thieu ? "thieu" : "") + '"><td>' + T(tenMon(x.mon)) + "</td><td>" + (x.lop === null ? "—" : x.lop) + "</td><td>" + T(MUC[x.muc] || x.muc) + "</td><td>"
          + T(x.dang || "—") + '</td><td><div class="qkcThanhSo"><i style="width:' + phan + '%"></i><span>' + x.soCau + "</span></div></td><td>" + (x.thieu ? kq.mucTieu - x.soCau : "đủ") + "</td></tr>";
      }).join("") : '<tr><td colspan="6" class="adminRong">' + (chi ? "Không ô nào thiếu câu. 👏" : "Kho chưa có câu hệ thống nào.") + "</td></tr>";
    }
    el("qkcChiThieu").addEventListener("change", veBang);
    veBang();
  }

  // ================================================================
  // PHẦN 4: TỪ CẤM + THỬ LỌC
  // ================================================================
  var dsTu = [];
  function taiTuCam() {
    var p = el("qkcPhan_tucam");
    if (!p.firstChild) {
      p.innerHTML = '<div class="qkcHaiCot"><section class="qkcTheLon"><h4>🔎 Thử một câu qua bộ lọc</h4>'
        + '<p class="adminGhiChu">Gõ một câu để xem bộ lọc có chặn không, và bắt được từ nào. Bé bị chặn chỉ thấy "con sửa lại nhé", không thấy từ nào (để bé không dò từ cấm).</p>'
        + '<textarea id="qkcThuChu" rows="3" maxlength="1500" placeholder="vd: Bạn Nam có 5 viên bi..."></textarea>'
        + '<div class="qkcNutForm"><select id="qkcThuNguon"><option value="be">Như câu của bé (đủ lớp lọc)</option><option value="he_thong">Như câu hệ thống (chỉ từ cấm)</option></select>'
        + '<button type="button" class="adminNut" id="qkcThuLoc">🔎 Thử</button></div><div id="qkcKqThu"></div>'
        + '<h4 style="margin-top:18px;">➕ Thêm từ cấm</h4>'
        + '<p class="adminGhiChu">Mỗi dòng một từ / cụm từ. Danh sách chỉ nằm ở máy chủ, không có trong mã của trang web.</p>'
        + '<textarea id="qkcTuMoi" rows="3" placeholder="mỗi dòng một từ"></textarea>'
        + '<div class="qkcFormLuoi"><label>Nhóm<select id="qkcTuNhom">' + tuyChon(Object.keys(NHOM).filter(function (k) { return k !== "ca_nhan" && k !== "rac"; }).reduce(function (o, k) { o[k] = NHOM[k]; return o; }, {}), "tuc_tiu") + "</select></label>"
        + '<label>Cách so<select id="qkcTuKieu">' + tuyChon(KIEU_SO, "co_dau") + "</select></label></div>"
        + '<p class="adminGhiChu"><b>Có dấu, nguyên từ</b>: chỉ bắt đúng từ có dấu (an toàn nhất, "ngu" không bắt "ngủ"). <b>Không dấu</b>: bắt cả khi bé bỏ dấu, chen chấm / cách, thay số cho chữ; chỉ dùng cho từ không thể nhầm. <b>Chuỗi con</b>: bắt cả khi dính liền chữ khác; chỉ cho từ dài.</p>'
        + '<div class="qkcNutForm"><button type="button" class="adminNut adminNutThanhCong" id="qkcThemTu">➕ Thêm</button></div></section>'
        + '<section class="qkcTheLon"><h4>🚫 Danh sách từ cấm <span id="qkcDemTu" class="adminGhiChu"></span></h4>'
        + '<input type="search" id="qkcTimTu" placeholder="Tìm từ..."><div id="qkcDsTu"></div></section></div>';
      el("qkcThuLoc").addEventListener("click", thuLoc);
      el("qkcThemTu").addEventListener("click", themTu);
      el("qkcTimTu").addEventListener("input", veTu);
      el("qkcDsTu").addEventListener("click", function (su) {
        var n = su.target.closest("[data-xoa-tu]"); if (!n) return;
        var t = n.getAttribute("data-ten");
        if (!window.confirm("Xoá từ cấm \"" + t + "\"?")) return;
        goi("kc_cau_hoi_admin_tu_cam_luu", { p_them: [], p_xoa: [Number(n.getAttribute("data-xoa-tu"))] }).then(function (kq) { bao(kq, "Đã xoá \"" + t + "\""); if (kq.thanhCong) taiTuCam(); });
      });
    }
    goi("kc_cau_hoi_admin_tu_cam").then(function (kq) {
      if (!kq.thanhCong) { el("qkcDsTu").innerHTML = '<p class="adminGhiChu">❌ ' + T(kq.thongBao) + T(loiKhongCoHam(kq)) + "</p>"; return; }
      dsTu = kq.tu || []; veTu();
    });
  }
  function veTu() {
    var tim = (el("qkcTimTu").value || "").trim().toLowerCase(), nhom = {};
    dsTu.forEach(function (t) { if (!tim || t.tu.toLowerCase().indexOf(tim) >= 0) (nhom[t.nhom] = nhom[t.nhom] || []).push(t); });
    el("qkcDemTu").textContent = "(" + dsTu.length + " từ)";
    el("qkcDsTu").innerHTML = Object.keys(NHOM).filter(function (k) { return nhom[k]; }).map(function (k) {
      return '<details class="qkcNhomTu"' + (tim ? " open" : "") + '><summary>' + T(NHOM[k]) + " <small>(" + nhom[k].length + ")</small></summary><div class=\"qkcChipTu\">"
        + nhom[k].map(function (t) {
          return '<span class="qkcTu k_' + t.kieuSo + '" title="' + T(KIEU_SO[t.kieuSo]) + '">' + T(t.tu) + ' <button type="button" data-xoa-tu="' + t.id + '" data-ten="' + T(t.tu) + '" aria-label="Xoá">✕</button></span>';
        }).join("") + "</div></details>";
    }).join("") || '<p class="adminGhiChu">Không có từ nào.</p>';
  }
  function themTu() {
    var ds = el("qkcTuMoi").value.split(/\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (!ds.length) return adminBaoTin("❌ Gõ ít nhất một từ", false);
    goi("kc_cau_hoi_admin_tu_cam_luu", { p_them: ds.map(function (t) { return { tu: t, nhom: el("qkcTuNhom").value, kieuSo: el("qkcTuKieu").value }; }), p_xoa: [] }).then(function (kq) {
      if (kq.thanhCong) {
        adminBaoTin("✅ Đã thêm " + kq.them + " từ" + (kq.daCo ? ", " + kq.daCo + " từ đã có sẵn" : "") + ((kq.loi || []).length ? ", " + kq.loi.length + " từ lỗi" : ""), !(kq.loi || []).length);
        el("qkcTuMoi").value = ""; taiTuCam();
      } else bao(kq);
    });
  }
  function thuLoc() {
    var chu = el("qkcThuChu").value.trim(); if (!chu) return;
    goi("kc_cau_hoi_admin_thu_loc", { p_noi_dung: chu, p_nguon: el("qkcThuNguon").value }).then(function (kq) {
      var o = el("qkcKqThu");
      if (!kq.thanhCong) { o.innerHTML = '<div class="qkcKq loi">❌ ' + T(kq.thongBao) + T(loiKhongCoHam(kq)) + "</div>"; return; }
      var nhom = (kq.nhom || []).map(function (n) { return NHOM[n] || n; }).join(", ");
      o.innerHTML = '<div class="qkcKq ' + (kq.chan ? "loi" : "") + '">' + (kq.chan ? "⛔ <b>Bị chặn</b>: " + T(nhom) : "✅ <b>Qua được</b>")
        + (kq.nhayCam ? "<div>⚠️ Có từ nhạy cảm học tập: câu của bé phải chờ admin duyệt.</div>" : "")
        + ((kq.tu || []).length ? "<div>Từ bắt được: " + kq.tu.map(function (t) { return '<span class="qkcTu k_' + t.kieuSo + '">' + T(t.tu) + " <small>" + T(NHOM[t.nhom] || t.nhom) + "</small></span>"; }).join(" ") + "</div>" : "")
        + "</div>";
    });
  }

  // ================================================================
  // PHẦN 5: NHẬT KÝ CHẶN
  // ================================================================
  var NOI = { gui: "bé gửi câu", sua: "bé sửa câu", ai: "AI chấm" };
  function taiNhatKy(xem) {
    var p = el("qkcPhan_nhatky");
    if (!p.firstChild) {
      p.innerHTML = '<p class="adminGhiChu">Mỗi lần bộ lọc chặn câu bé đặt thì ghi một dòng ở đây. Nhóm <b class="qkcDo">tự hại / khiêu dâm</b> lên đầu và tô đỏ để người lớn biết mà hỏi han bé. (Bé tự đặt câu có từ bước KC_06D.)</p>'
        + '<div class="qkcNutForm qkcTrai"><label class="qkcHop"><input type="checkbox" id="qkcChiChuaXem"> Chỉ dòng chưa xem</label>'
        + '<button type="button" class="adminNut adminNutPhu" id="qkcXemHet">👁️ Đánh dấu đã xem cả danh sách</button></div><div id="qkcDsNk"></div>';
      el("qkcChiChuaXem").addEventListener("change", function () { taiNhatKy(); });
      el("qkcXemHet").addEventListener("click", function () {
        var ids = Array.prototype.map.call(document.querySelectorAll("#qkcDsNk [data-nk].chuaXem"), function (n) { return Number(n.getAttribute("data-nk")); });
        if (ids.length) taiNhatKy(ids);
      });
      el("qkcDsNk").addEventListener("click", function (su) { var n = su.target.closest("[data-xem-nk]"); if (n) taiNhatKy([Number(n.getAttribute("data-xem-nk"))]); });
    }
    goi("kc_cau_hoi_admin_nhat_ky_chan", { p_chi_chua_xem: el("qkcChiChuaXem").checked, p_n: 200, p_xem: xem || [] }).then(function (kq) {
      var o = el("qkcDsNk");
      if (!kq.thanhCong) { o.innerHTML = '<p class="adminGhiChu">❌ ' + T(kq.thongBao) + T(loiKhongCoHam(kq)) + "</p>"; return; }
      el("qkcSo_nhatky").textContent = kq.chuaXem || "";
      el("qkcSo_nhatky").classList.toggle("do", kq.nguyHiemChuaXem > 0);
      var ds = kq.dong || [];
      o.innerHTML = '<p class="adminGhiChu">' + kq.chuaXem + " dòng chưa xem" + (kq.nguyHiemChuaXem ? ', <b class="qkcDo">' + kq.nguyHiemChuaXem + " dòng tự hại / khiêu dâm</b>" : "") + " · giữ " + kq.giuNgay + " ngày.</p>"
        + (ds.length ? '<div class="qkcDsNk">' + ds.map(function (d) {
          return '<div class="qkcNk' + (d.nguyHiem ? " nguyHiem" : "") + (d.daXem ? "" : " chuaXem") + '" data-nk="' + d.id + '"><div class="qkcNkDau"><b>' + T(d.ten) + "</b> · " + T(adminDinhDangGio(d.luc)) + " · " + T(NOI[d.noi] || d.noi)
            + " · " + (d.nhom || []).map(function (n) { return '<span class="qkcNhan">' + T(NHOM[n] || n) + "</span>"; }).join(" ")
            + (d.daXem ? ' <span class="adminGhiChu">đã xem</span>' : ' <button type="button" class="adminNut adminNutPhu" data-xem-nk="' + d.id + '">👁️ Đã xem</button>') + "</div>"
            + '<div class="qkcNkNd">' + T(d.noiDung) + "</div></div>";
        }).join("") + "</div>" : '<p class="adminGhiChu qkcRong">Chưa có câu nào bị chặn. 👍</p>');
    });
  }

  // ================================================================
  // PHẦN 6: CẤU HÌNH KHO
  // ================================================================
  var cauHinh = null;
  function lay(g, duong) { return duong.split(".").reduce(function (o, k) { return o && o[k] !== undefined ? o[k] : undefined; }, g); }
  function taiCauHinh() {
    var p = el("qkcPhan_cauhinh");
    p.innerHTML = '<p class="adminDangTai">Đang tải cấu hình...</p>';
    goi("kc_cau_hoi_admin_cau_hinh").then(function (kq) {
      if (!kq.thanhCong) { p.innerHTML = '<p class="adminGhiChu">❌ ' + T(kq.thongBao) + T(loiKhongCoHam(kq)) + "</p>"; return; }
      cauHinh = kq;
      var nhom = {};
      (kq.khoa || []).forEach(function (k) { var d = k.duong.join("."), m = CAU_HINH[d] || ["Khác", d]; (nhom[m[0]] = nhom[m[0]] || []).push([d, k, m[1]]); });
      p.innerHTML = '<p class="adminGhiChu">Một bảng cấu hình cho cả kho câu hỏi (bảng <code>kc_cau_hoi_cau_hinh</code>). Lần sửa cuối: ' + T(adminDinhDangGio(kq.suaLuc)) + (kq.suaBoi ? " · " + T(kq.suaBoi) : "") + ".</p>"
        + '<div class="qkcLuoiCh">' + Object.keys(nhom).map(function (n) {
          return '<section class="qkcTheLon"><h4>' + T(n) + "</h4>" + nhom[n].map(function (x) {
            var d = x[0], k = x[1], gt = lay(kq.giaTri, d);
            var nhap = k.kieu === "bool" ? '<input type="checkbox" data-ch="' + d + '"' + (gt ? " checked" : "") + ">"
              : '<input type="' + (k.kieu === "so" ? "number" : "text") + '" data-ch="' + d + '" value="' + T(gt === undefined ? "" : gt) + '"'
                + (k.kieu === "so" ? ' min="' + k.nho + '" max="' + k.lon + '" step="' + (k.lon <= 1 ? "0.05" : "1") + '"' : ' maxlength="' + k.lon + '"') + ">";
            return '<label class="qkcCh"><span>' + T(x[2]) + (k.kieu === "so" ? " <small>(" + k.nho + " - " + k.lon + ")</small>" : "") + "</span>" + nhap + "</label>";
          }).join("") + "</section>";
        }).join("") + "</div>"
        + '<div class="qkcNutForm"><button type="button" class="adminNut adminNutThanhCong" id="qkcLuuCh">💾 Lưu cấu hình</button></div>';
      el("qkcLuuCh").addEventListener("click", luuCauHinh);
    });
  }
  function luuCauHinh() {
    var sua = {}, sai = [];
    document.querySelectorAll("#qkcPhan_cauhinh [data-ch]").forEach(function (n) {
      var d = n.getAttribute("data-ch"), cu = lay(cauHinh.giaTri, d), moi;
      n.classList.remove("loi");
      if (n.type === "checkbox") moi = n.checked;
      else if (n.type === "number") {
        moi = Number(n.value);
        if (n.value === "" || isNaN(moi) || moi < Number(n.min) || moi > Number(n.max)) { sai.push(n); return; }
      } else moi = n.value.trim();
      if (moi !== cu) sua[d] = moi;
    });
    if (sai.length) { sai.forEach(function (n) { n.classList.add("loi"); }); return adminBaoTin("❌ Có ô ngoài khoảng cho phép (tô đỏ)", false); }
    if (!Object.keys(sua).length) return adminBaoTin("Không có gì thay đổi", true);
    goi("kc_cau_hoi_admin_cau_hinh_luu", { p_sua: sua }).then(function (kq) { bao(kq, "Đã lưu " + (kq.so | 0) + " ô cấu hình"); if (kq.thanhCong) taiCauHinh(); });
  }

  // ---------------- mở lần đầu ----------------
  function moLanDau() {
    if (daMo) { if (phanHienTai === "cau") taiDs(); return; }
    daMo = true;
    el("qkcPhan_cau").innerHTML = '<p class="adminDangTai">Đang tải...</p>';
    taiMon().then(function () {
      veKhungCau();
      // mặc định: có câu chờ duyệt thì mở thẳng danh sách chờ duyệt (thiết kế mục 8)
      goi("kc_cau_hoi_admin_ds", { p_loc: { trangThai: "cho_duyet" }, p_trang: 0, p_co: 5 }).then(function (kq) {
        if (kq.thanhCong && kq.tong > 0) { loc.trangThai = "cho_duyet"; datOLoc(); }
        taiDs();
      });
      goi("kc_cau_hoi_admin_nhat_ky_chan", { p_chi_chua_xem: true, p_n: 1 }).then(function (kq) {
        if (kq.thanhCong) { el("qkcSo_nhatky").textContent = kq.chuaXem || ""; el("qkcSo_nhatky").classList.toggle("do", kq.nguyHiemChuaXem > 0); }
      });
    });
  }
  if (el("manhinh-khocau").classList.contains("dangHien")) moLanDau();
  window.QKC = { mo: moLanDau, moPhan: moPhan };
})();
// 12/11/2026 - BƯỚC: KC_06C
