// ================================================================
// FILE: kc/qt_dt_tuong.js
// CHỨC NĂNG: Quản trị › ⚔️ Đấu Trường › 🛡️ TƯỚNG (đặc tả repo_rieng dau_truong_tri_thuc/dac_ta_tuong.md mục 9):
//   người lớn đổi tướng / chiêu không cần lập trình. Bốn thẻ + lịch sử:
//   👑 Thủ lĩnh  : bảng tộc × giới × 4 đời, mỗi ô chọn mẫu tướng (ô trống = như đời trước)
//   🛡️ Tướng     : mỗi mẫu một thẻ: tên, file 3D (chỉ xem), chiều cao, ẩn, 3 đòn tự động + ≤ 4 kỹ năng Quản trị gán, ▶ Xem thử
//   ✨ Kỹ năng   : tên, hệ số, MP, hồi chiêu, trình diễn dùng
//   🎆 Trình diễn: chữ tên chiêu, màu, thông số riêng của từng hàm vẽ
//   🕘 Lịch sử   : các lần sửa sổ tướng (cùng bảng lịch sử với 🎛️ Thông số), ↩ hoàn tác
//   Mọi ô chọn từ danh sách có sẵn (không gõ tay mã). Lưu = chỉ phần khác mặc định (kc_dt_admin_luu_thong_so, tên
//   'tuong' / 'ky_nang' / 'hieu_ung'); TRƯỚC khi lưu chạy KC_DT_TUONG.tao(bản sắp lưu).kiem(): có lỗi thì không lưu.
//   ▶ Xem thử mở dt/thu_tran_dau.html?tuong=<mã>&banNhap=1 trong khung phủ: trang trận lấy BẢN ĐANG SỬA (kể cả chưa lưu)
//   qua window.QDTT_banNhap(ten).
// BƯỚC: TC_D05C0c - NGÀY: 26/11/2026
// PHỤ THUỘC: qt_dt_khung.js (QDT), dt/dt_cau_hinh.js (tron, khac), dt/dt_tuong.js (tao, kiem), ../admin_NC.js (adminGoiRpc,
//   adminBaoTin), qt_dau_truong.css (ô .qdO, bảng .qdBang dùng chung với Thông số); SQL repo_rieng SQL/supabase_tc_d05c0a_so_tuong.sql.
// ================================================================

var QDTT = {
  MAN: "dautruong-tuong",
  TEP: ["tuong", "ky_nang", "hieu_ung"],
  TEN_TEP: { tuong: "Sổ tướng", ky_nang: "Kỹ năng", hieu_ung: "Trình diễn" },
  THE: [
    { ma: "thulinh", ten: "👑 Thủ lĩnh" }, { ma: "tuong", ten: "🛡️ Tướng" }, { ma: "kynang", ten: "✨ Kỹ năng" },
    { ma: "trinhdien", ten: "🎆 Trình diễn" }, { ma: "lichsu", ten: "🕘 Lịch sử sửa" }
  ],
  TEN_LOAI: { can_chien: "Cận chiến (lao tới)", phep: "Phép (đứng bắn)", vung: "Phủ vùng", dac_biet: "Đặc biệt (camera riêng)", ho_tro: "Hỗ trợ" },
  TEN_HAM: { chem: "Lao tới chém", cau_phep: "Đứng bắn cầu phép", vet_x: "Hai vệt chéo chữ X", cot_lua: "Cột lửa", set: "Sét giáng",
    chieu_them: "Chiêu riêng (camera điện ảnh)", chieu_vung: "Chiêu phủ vùng" },
  // ô sửa được của từng hàm vẽ (các số khác của hàm nằm trong mã)
  O_HAM: {
    chem: ["khoiKhiTrung"], cau_phep: ["khoiKhiTrung"], vet_x: ["chu", "mau"], cot_lua: ["chu", "mau", "co", "amNo"],
    set: ["chu", "mau", "mauSet", "amNo"], chieu_them: ["chu", "mau"], chieu_vung: ["chu", "mau"]
  },
  TEN_O_TD: { chu: ["Chữ tên chiêu giữa sân", "chuTrong"], mau: ["Màu chữ / chiêu (trống = màu chính của tướng)", "mau"],
    khoiKhiTrung: ["Màu khói khi trúng (đòn thường)", "mau"], co: ["Cỡ cột lửa", "so"], mauSet: ["Màu sét", "mau"], amNo: ["Độ to tiếng nổ (0-1)", "so"] },
  md: {}, daLuu: {}, ht: {}, lichSu: [], toc: [], doiTen: {},
  the: "thulinh", coMayChu: false, dangLuu: false, daTai: false
};

QDT.dangKyMuc({
  ma: "tuong", ten: "Tướng", bieuTuong: "🛡️", tieuDe: "Sổ Tướng Đấu Trường",
  moTa: "Thủ lĩnh của mỗi tộc × giới × đời, tên tướng, chiêu của tướng và cách chiêu hiện trên sân. Trận đấu và Thung Lũng cùng dùng sổ này. "
    + "Mọi ô chọn từ danh sách; số trong file của game là <strong>mặc định</strong>, ở đây chỉ lưu ô bạn sửa. Trước khi lưu, trang tự kiểm "
    + "sổ tướng: còn chỗ sai thì không lưu. ▶ Xem thử mở trận thử với bản đang sửa (kể cả chưa lưu). "
    + "Thêm tướng / chiêu mới cần file 3D hoặc mã mới (Claude làm). Tiếng chiêu: 🎛️ Thông số › 🔊 Âm thanh.",
  dung: function (than) {
    than.innerHTML = '<div class="qdChips" id="qdttChips" role="tablist" aria-label="Thẻ sổ tướng"></div>'
      + '<div class="qdChuGiai"><span class="cgSua">khác mặc định</span><span class="cgLuu">chưa lưu</span></div>'
      + '<div class="qdTrangThai" id="qdttTrangThai"></div>'
      + '<div class="qdttLoi" id="qdttLoi" role="alert"></div>'
      + '<div id="qdttNoiDung"><p class="adminDangTai">Đang tải...</p></div>'
      + '<div class="qdThanhLuu" id="qdttThanhLuu"><strong id="qdttSoChuaLuu">0 ô chưa lưu</strong>'
      + '<input type="text" id="qdttGhiChu" maxlength="300" placeholder="Ghi chú lần sửa (không bắt buộc)">'
      + '<button class="adminNut adminNutPhu" id="qdttBo" type="button">Bỏ</button>'
      + '<button class="adminNut" id="qdttLuu" type="button">💾 Lưu</button></div>';
  },
  mo: function () { qdttGanSuKien(); QDTT.daTai = true; qdttTai(); },
  soChuaLuu: function () { return QDTT.daTai ? qdttSoChuaLuu() : 0; }
});

// Trang trận thử (?banNhap=1, trong khung phủ của mục này) hỏi bản đang sửa: file mặc định + phần sửa (kể cả chưa lưu)
window.QDTT_banNhap = function (ten) { return QDTT.ht[ten] ? qdttChep(QDTT.ht[ten]) : null; };

// ----------------------------------------------------------------
// tiện ích
// ----------------------------------------------------------------
function qdttEl(id) { return document.getElementById(id); }
function qdttLaObj(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }
function qdttChep(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
function qdttGiong(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function qdttH(s) { return QDT.html(s); }
function qdttLay(o, duong) { for (var i = 0; i < duong.length; i++) { if (o === null || o === undefined) return undefined; o = o[duong[i]]; } return o; }
function qdttDat(o, duong, v) {
  for (var i = 0; i < duong.length - 1; i++) { if (!qdttLaObj(o[duong[i]])) o[duong[i]] = {}; o = o[duong[i]]; }
  if (v === undefined) delete o[duong[duong.length - 1]]; else o[duong[duong.length - 1]] = v;
}
function qdttPhang(o, tien, kq) {
  kq = kq || {};
  if (qdttLaObj(o)) Object.keys(o).forEach(function (k) { if (k.charAt(0) !== "_") qdttPhang(o[k], tien ? tien + "." + k : k, kq); });
  else if (o !== undefined) kq[tien] = o;
  return kq;
}
function qdttKhacNhau(a, b) {
  var pa = qdttPhang(a, ""), pb = qdttPhang(b, ""), ds = [];
  Object.keys(Object.assign({}, pa, pb)).forEach(function (k) { if (!qdttGiong(pa[k], pb[k])) ds.push({ k: k, cu: pa[k], moi: pb[k] }); });
  return ds;
}
function qdttChuSo(v) {
  if (v === undefined) return "(trống)";
  if (v === null) return "(không có)";
  if (typeof v === "boolean") return v ? "Bật" : "Tắt";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "(trống)";
  return String(v);
}

// ----------------------------------------------------------------
// TẢI
// ----------------------------------------------------------------
function qdttTai() {
  qdttBao("Đang tải sổ tướng mặc định và phần đã sửa…", "");
  var nap = function (url) { return fetch(url, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(url + ": HTTP " + r.status); return r.json(); }); };
  var md = QDTT.TEP.map(function (t) { return nap("dt/du_lieu/" + t + ".json"); });
  var phu = Promise.all([nap("dt/du_lieu/chung_loai.json").catch(function () { return {}; }), nap("dt/du_lieu/thoi_ky.json").catch(function () { return {}; })]);
  return Promise.all([Promise.all(md), phu, adminGoiRpc("kc_dt_admin_thong_so", {})]).then(function (kq) {
    var may = kq[2] || {};
    QDTT.coMayChu = !!may.thanhCong;
    var sua = (QDTT.coMayChu && may.sua) || {};
    QDTT.TEP.forEach(function (t, i) {
      QDTT.md[t] = kq[0][i];
      QDTT.daLuu[t] = KC_DT_CAU_HINH.tron(kq[0][i], sua[t]);
      QDTT.ht[t] = qdttChep(QDTT.daLuu[t]);
    });
    QDTT.toc = (kq[1][0].chungLoai || []).map(function (c) { return { ma: c.ma, ten: c.ten, bieuTuong: c.bieuTuong || "" }; });
    QDTT.doiTen = {};
    (kq[1][1].thoiKy || []).forEach(function (d) { QDTT.doiTen[d.ma] = d.ten; });
    QDTT.lichSu = (may.lichSu || []).filter(function (l) { return l.loai === "tep" && QDTT.TEP.indexOf(l.ten) >= 0; });
    if (QDTT.coMayChu) qdttBao("", "");
    else qdttBao("⚠️ Chưa đọc được máy chủ (" + (may.thongBao || "lỗi không rõ") + "). Trang đang hiện SỐ MẶC ĐỊNH, chưa lưu được. "
      + "Cần đã chạy SQL TC_D05C0a (repo_rieng SQL/supabase_tc_d05c0a_so_tuong.sql) rồi bấm lại vào mục này.", "loi");
    qdttVe();
  }).catch(function (e) { qdttBao("❌ Không tải được sổ tướng mặc định: " + e.message, "loi"); });
}

function qdttBao(chu, kieu) {
  var o = qdttEl("qdttTrangThai");
  o.textContent = chu;
  o.className = "qdTrangThai" + (chu ? " hien" : "") + (kieu ? " " + kieu : "");
}

// ----------------------------------------------------------------
// DANH SÁCH cho ô chọn
// ----------------------------------------------------------------
function qdttT() { return QDTT.ht.tuong || {}; }
function qdttKho() { return qdttT().kho || {}; }
function qdttDsKn() { return (QDTT.ht.ky_nang || {}).kyNang || {}; }
function qdttDsTd() { return (QDTT.ht.hieu_ung || {}).trinhDien || {}; }
function qdttDoi() { var d = qdttT().doi; return Array.isArray(d) && d.length ? d : ["do_da"]; }
function qdttTenToc(ma) { var t = QDTT.toc.find(function (x) { return x.ma === ma; }); return t ? t.bieuTuong + " " + t.ten : (ma || "?"); }
function qdttDsToc() {
  var ds = QDTT.toc.map(function (t) { return t.ma; });
  Object.keys(qdttT().thuLinh || {}).forEach(function (m) { if (ds.indexOf(m) < 0) ds.push(m); });
  return ds;
}
function qdttHinh(m) { // ảnh nhỏ của mẫu: chưa có ảnh chân dung -> biểu tượng tộc + giới
  var t = QDTT.toc.find(function (x) { return x.ma === m.toc; });
  return (t ? t.bieuTuong : "🧙") + (m.gioi === "nu" ? "👩" : m.gioi === "nam" ? "👨" : "");
}

/** [[giá trị, nhãn, nhóm]]: mọi mẫu tướng (ẩn: chỉ khi đang chọn) */
function qdttLcTuong(dangChon) {
  var kho = qdttKho();
  return Object.keys(kho).filter(function (ma) { return !kho[ma].an || ma === dangChon; }).map(function (ma) {
    var m = kho[ma];
    return [ma, (m.ten || ma) + (m.gioi === "nu" ? " (nữ)" : m.gioi === "nam" ? " (nam)" : "") + (m.an ? " (đã ẩn)" : ""), qdttTenToc(m.toc)];
  });
}
function qdttLcKn() {
  var ds = qdttDsKn();
  return Object.keys(ds).map(function (ma) { return [ma, (ds[ma].ten || ma) + " · " + (QDTT.TEN_LOAI[ds[ma].loai] || ds[ma].loai || "")]; });
}
function qdttLcTd() {
  var ds = qdttDsTd();
  return Object.keys(ds).map(function (ma) { return [ma, ma + " · " + (QDTT.TEN_HAM[ds[ma].ham] || ds[ma].ham) + (ds[ma].chu ? " «" + ds[ma].chu + "»" : "")]; });
}
function qdttTenKn(ma) { var k = qdttDsKn()[ma]; return k ? (k.ten || ma) : ma; }

// ----------------------------------------------------------------
// Ô SỬA: data-tep + data-duong (đường trong file) + data-kieu
//   chon (bắt buộc) | chonTrong ("" = bỏ khoá: như đời trước) | chonNull ("" = null) | so | chu | chuTrong | mau | bool | chon4
// ----------------------------------------------------------------
function qdttLopO(tep, duong) {
  var v = qdttLay(QDTT.ht[tep], duong);
  return (qdttGiong(v, qdttLay(QDTT.md[tep], duong)) ? "" : " daSua") + (qdttGiong(v, qdttLay(QDTT.daLuu[tep], duong)) ? "" : " chuaLuu");
}
function qdttThuoc(tep, duong, kieu) {
  return ' data-tep="' + tep + '" data-duong="' + qdttH(JSON.stringify(duong)) + '" data-kieu="' + kieu + '"';
}
function qdttSelect(lc, v, dau, them) {
  var nhom = {}, thuTu = [], co = v === "" || v === null || v === undefined;
  lc.forEach(function (l) { var g = l[2] || ""; if (!nhom[g]) { nhom[g] = []; thuTu.push(g); } nhom[g].push(l); if (l[0] === v) co = true; });
  var o = function (l) { return '<option value="' + qdttH(l[0]) + '"' + (l[0] === v ? " selected" : "") + ">" + qdttH(l[1]) + "</option>"; };
  var html = (dau ? '<option value=""' + (co && (v === "" || v == null) ? " selected" : "") + ">" + qdttH(dau) + "</option>" : "")
    + (co ? "" : '<option value="' + qdttH(v) + '" selected>' + qdttH(v) + " (không có)</option>");
  thuTu.forEach(function (g) { html += g ? '<optgroup label="' + qdttH(g) + '">' + nhom[g].map(o).join("") + "</optgroup>" : nhom[g].map(o).join(""); });
  return "<select" + (them || "") + ">" + html + "</select>";
}
/** nhập của một ô (không vỏ) */
function qdttNhap(tep, duong, kieu, tc) {
  tc = tc || {};
  var v = qdttLay(QDTT.ht[tep], duong), thuoc = qdttThuoc(tep, duong, kieu), lop = ' class="qdNhap qdttNhap' + (tc.mo && (v === undefined || v === "") ? " nhuTruoc" : "") + '"';
  if (kieu === "chon" || kieu === "chonTrong" || kieu === "chonNull") return qdttSelect(tc.lc || [], v === null || v === undefined ? "" : v, kieu === "chon" ? "" : tc.dau, lop + thuoc);
  if (kieu === "bool") return '<select' + lop + thuoc + '><option value="false"' + (v ? "" : " selected") + '>Không</option><option value="true"' + (v ? " selected" : "") + ">Có</option></select>";
  if (kieu === "so") return '<input type="number" inputmode="decimal" step="any" min="0"' + lop + thuoc + ' value="' + qdttH(v === undefined ? "" : v) + '">';
  if (kieu === "mau") return '<span class="qdttMau"><input type="text" maxlength="7" placeholder="#rrggbb"' + lop + thuoc + ' value="' + qdttH(v || "") + '">'
    + '<input type="color" class="qdttChonMau" tabindex="-1" aria-label="Bảng màu" value="' + qdttH(/^#[0-9a-f]{6}$/i.test(v || "") ? v : "#ffffff") + '"></span>';
  if (kieu === "chon4") {
    var ds = Array.isArray(v) ? v : [], lc = tc.lc || [];
    var s = '<div class="qdttBon"' + thuoc + ">";
    for (var i = 0; i < 4; i++) s += qdttSelect(lc, ds[i] || "", "— ô " + (i + 1) + " trống", ' class="qdNhap qdttO4" aria-label="Kỹ năng gán ' + (i + 1) + '"');
    return s + "</div>";
  }
  return '<input type="text" maxlength="60"' + lop + thuoc + ' value="' + qdttH(v === undefined ? "" : v) + '">';
}
function qdttTenMd(tep, duong, kieu, tc) {
  var md = qdttLay(QDTT.md[tep], duong);
  if (kieu === "chon4") return Array.isArray(md) && md.length ? md.map(qdttTenKn).join(", ") : "(trống)";
  if (tc && tc.lc && typeof md === "string") { var l = tc.lc.find(function (x) { return x[0] === md; }); if (l) return l[1]; }
  if (kieu === "bool") return md ? "Có" : "Không";
  if (md === null) return (tc && tc.dau) || "(không có)";
  return md === undefined || md === "" ? ((tc && tc.dau) || "(trống)") : String(md);
}
/** một dòng ô đầy đủ (tên + nhập + mặc định ↺) dùng trong thẻ */
function qdttO(tep, duong, nhan, kieu, tc) {
  return '<div class="qdO' + qdttLopO(tep, duong) + '" data-o' + qdttThuoc(tep, duong, kieu) + ">"
    + '<div class="qdTen">' + qdttH(nhan) + "</div>"
    + '<div class="qdO_nhap">' + qdttNhap(tep, duong, kieu, tc) + "</div>"
    + '<div class="qdMd">mặc định <b>' + qdttH(qdttTenMd(tep, duong, kieu, tc)) + '</b> <button type="button" class="qdVe" data-ve title="Về mặc định">↺</button></div></div>';
}
/** một ô trong bảng (td) */
function qdttTd(nhanCot, tep, duong, kieu, tc) {
  return '<td class="qdttTd' + qdttLopO(tep, duong) + '" data-o data-nhan="' + qdttH(nhanCot) + '"' + qdttThuoc(tep, duong, kieu) + ">"
    + '<div class="qdttTdNhap">' + qdttNhap(tep, duong, kieu, tc) + '<button type="button" class="qdVe" data-ve title="Về mặc định: '
    + qdttH(qdttTenMd(tep, duong, kieu, tc)) + '">↺</button></div></td>';
}
function qdttNutThu(maTuong, nhan) {
  return maTuong ? '<button type="button" class="adminNut adminNutPhu qdttThu" data-xem-thu="' + qdttH(maTuong) + '">▶ ' + qdttH(nhan || "Xem thử") + "</button>"
    : '<span class="qdChiDoc">chưa tướng nào dùng</span>';
}

// ----------------------------------------------------------------
// VẼ
// ----------------------------------------------------------------
function qdttVe() {
  qdttEl("qdttChips").innerHTML = QDTT.THE.map(function (t) {
    return '<button type="button" class="qdChip' + (t.ma === QDTT.the ? " dangChon" : "") + '" data-the-qdtt="' + t.ma + '">' + qdttH(t.ten) + "</button>";
  }).join("");
  var ve = { thulinh: qdttVeThuLinh, tuong: qdttVeTuong, kynang: qdttVeKyNang, trinhdien: qdttVeTrinhDien, lichsu: qdttVeLichSu }[QDTT.the];
  qdttEl("qdttNoiDung").innerHTML = ve();
  qdttCapNhat();
}

function qdttVeThuLinh() {
  var doi = qdttDoi(), lc = null, hang = [];
  qdttDsToc().forEach(function (toc) {
    ["nam", "nu"].forEach(function (gioi) {
      var o = (qdttT().thuLinh || {})[toc], d = o && o[gioi] || {}, truoc = null;
      var td = doi.map(function (maDoi, i) {
        var duong = ["thuLinh", toc, gioi, maDoi], v = d[maDoi];
        lc = qdttLcTuong(v);
        var dau = i === 0 ? "" : "↑ như đời trước" + (truoc ? " (" + ((qdttKho()[truoc] || {}).ten || truoc) + ")" : "");
        if (v) truoc = v;
        return qdttTd(QDTT.doiTen[maDoi] || maDoi, "tuong", duong, i === 0 ? "chon" : "chonTrong", { lc: lc, dau: dau, mo: true });
      }).join("");
      hang.push('<tr><th class="qdTenHang">' + qdttH(qdttTenToc(toc) + " · " + (gioi === "nu" ? "Nữ" : "Nam")) + "</th>" + td + "</tr>");
    });
  });
  return '<section class="qdThe qdTheBang"><h4>👑 Thủ lĩnh theo tộc × giới × đời</h4>'
    + '<p class="adminGhiChu">Bé tộc X, giới Y, đời Z thì Thủ lĩnh (trên Thung Lũng và trong trận) là tướng ở ô đó. Ô "↑ như đời trước" = dùng tướng của đời gần nhất đã đặt. '
    + "Đời đầu bắt buộc có tướng.</p>"
    + '<div class="qdCuonBang"><table class="qdBang qdttBang"><thead><tr><th>Tộc · giới</th>'
    + doi.map(function (m) { return "<th>" + qdttH(QDTT.doiTen[m] || m) + "</th>"; }).join("") + "</tr></thead><tbody>" + hang.join("") + "</tbody></table></div></section>";
}

function qdttVeTuong() {
  var kho = qdttKho(), lcKn = qdttLcKn();
  var the = Object.keys(kho).map(function (ma) {
    var m = kho[ma], g = ["kho", ma];
    return '<section class="qdThe qdttTheTuong' + (m.an ? " daAn" : "") + '"><h4><span class="qdttHinh" aria-hidden="true">' + qdttH(qdttHinh(m)) + "</span>"
      + qdttH(m.ten || ma) + ' <code class="qdTep">' + qdttH(ma) + "</code></h4>"
      + '<div class="qdttChiDoc">📦 <code>' + qdttH(m.tep || "(không có file)") + "</code> · " + qdttH(qdttTenToc(m.toc)) + " · " + (m.gioi === "nu" ? "nữ" : "nam")
      + (m.nguon ? '<br><span class="adminGhiChu">' + qdttH(m.nguon) + "</span>" : "") + "</div>"
      + qdttO("tuong", g.concat("ten"), "Tên hiện cho bé", "chu")
      + qdttO("tuong", g.concat("cao"), "Chiều cao (m, 1,85 = người lớn)", "so")
      + qdttO("tuong", g.concat("an"), "Ẩn tướng (không dùng được nữa)", "bool")
      + '<div class="qdTenCon">⚔️ 3 đòn tự động trong trận</div>'
      + '<p class="adminGhiChu qdttNho">Ô nào cũng gán được mọi kỹ năng trong kho. Chiêu dài (phủ vùng, có camera) ở đòn thường thì mỗi lần trúng diễn trọn chiêu (~3 giây).</p>'
      + qdttO("tuong", g.concat(["kyNang", "thuong"]), "Đòn thường", "chon", { lc: lcKn })
      + qdttO("tuong", g.concat(["kyNang", "chiMang"]), "Đòn chí mạng", "chonNull", { lc: lcKn, dau: "— không có" })
      + qdttO("tuong", g.concat(["kyNang", "ketLieu"]), "Đòn kết liễu", "chonNull", { lc: lcKn, dau: "— dùng đòn chí mạng" })
      + '<div class="qdTenCon">✨ Kỹ năng gán (tối đa 4, bé không chọn)</div>'
      + '<p class="adminGhiChu qdttNho">Lưu sẵn cho tướng; trận dùng 4 kỹ năng này từ bước TC_D05C.</p>'
      + qdttO("tuong", g.concat(["kyNang", "chon"]), "Bộ kỹ năng", "chon4", { lc: lcKn })
      + '<div class="qdttHangNut">' + qdttNutThu(ma, "Xem thử trong trận") + "</div></section>";
  }).join("");
  return '<div class="qdLuoi qdttLuoi">' + the + "</div>";
}

/** mã tướng đầu tiên dùng kỹ năng (3 đòn + bộ gán) */
function qdttTuongDung(maKn) {
  var kho = qdttKho(), ds = [];
  Object.keys(kho).forEach(function (ma) {
    var k = kho[ma].kyNang || {};
    if (!kho[ma].an && (k.thuong === maKn || k.chiMang === maKn || k.ketLieu === maKn || (Array.isArray(k.chon) && k.chon.indexOf(maKn) >= 0))) ds.push(ma);
  });
  return ds;
}

function qdttVeKyNang() {
  var ds = qdttDsKn(), lcTd = qdttLcTd();
  var hang = Object.keys(ds).map(function (ma) {
    var k = ds[ma], g = ["kyNang", ma], dung = qdttTuongDung(ma);
    return '<tr><th class="qdTenHang">' + qdttH(k.ten || ma) + ' <code>' + qdttH(ma) + "</code></th>"
      + qdttTd("Tên", "ky_nang", g.concat("ten"), "chu")
      + '<td data-nhan="Loại"><span class="qdChiDoc">' + qdttH(QDTT.TEN_LOAI[k.loai] || k.loai || "") + "</span></td>"
      + qdttTd("Hệ số sát thương", "ky_nang", g.concat("heSo"), "so")
      + qdttTd("MP", "ky_nang", g.concat("mp"), "so")
      + qdttTd("Hồi chiêu (lượt)", "ky_nang", g.concat("hoiChieu"), "so")
      + qdttTd("Trình diễn", "ky_nang", g.concat("trinhDien"), "chon", { lc: lcTd })
      + '<td data-nhan="Tướng dùng"><span class="qdChiDoc">' + qdttH(dung.map(function (t) { return qdttKho()[t].ten || t; }).join(", ") || "—") + "</span> "
      + qdttNutThu(dung[0]) + "</td></tr>";
  }).join("");
  return '<section class="qdThe qdTheBang"><h4>✨ Kỹ năng (luật của chiêu)</h4>'
    + '<p class="adminGhiChu">Hệ số, MP, hồi chiêu đã lưu được nhưng trận <strong>chưa dùng</strong> (mọi chiêu đang như nhau, máy chủ tính sát thương). Bước TC_D05C sẽ dùng. '
    + "Trình diễn = cách chiêu hiện trên sân (thẻ 🎆), không đổi sát thương.</p>"
    + '<div class="qdCuonBang"><table class="qdBang qdttBang"><thead><tr><th>Kỹ năng</th><th>Tên</th><th>Loại</th><th>Hệ số</th><th>MP</th><th>Hồi chiêu</th><th>Trình diễn</th><th>Tướng dùng</th></tr></thead><tbody>'
    + hang + "</tbody></table></div></section>";
}

function qdttVeTrinhDien() {
  var ds = qdttDsTd(), dsKn = qdttDsKn();
  var the = Object.keys(ds).map(function (ma) {
    var t = ds[ma], g = ["trinhDien", ma], o = QDTT.O_HAM[t.ham] || ["chu", "mau"];
    var kn = Object.keys(dsKn).filter(function (k) { return dsKn[k].trinhDien === ma; });
    var tuong = null;
    kn.some(function (k) { var d = qdttTuongDung(k); if (d.length) { tuong = d[0]; return true; } return false; });
    return '<section class="qdThe"><h4>🎆 ' + qdttH(t.chu || ma) + ' <code class="qdTep">' + qdttH(ma) + "</code></h4>"
      + '<div class="qdttChiDoc">Hàm vẽ: <strong>' + qdttH(QDTT.TEN_HAM[t.ham] || t.ham) + "</strong>" + (t.ma ? " · <code>" + qdttH(t.ma) + "</code>" : "")
      + "<br>Kỹ năng dùng: " + qdttH(kn.map(qdttTenKn).join(", ") || "—") + "</div>"
      + o.map(function (k) { var n = QDTT.TEN_O_TD[k]; return qdttO("hieu_ung", g.concat(k), n[0], n[1]); }).join("")
      + '<div class="qdttHangNut">' + qdttNutThu(tuong) + "</div></section>";
  }).join("");
  return '<p class="adminGhiChu">Đòn thường hiện khi trúng; chữ tên chiêu hiện với đòn chí mạng / kết liễu / chiêu vùng. Tiếng của chiêu: 🎛️ Thông số › 🔊 Âm thanh.</p>'
    + '<div class="qdLuoi qdttLuoi">' + the + "</div>";
}

function qdttVeLichSu() {
  if (!QDTT.coMayChu) return '<p class="adminGhiChu">Chưa đọc được máy chủ nên chưa có lịch sử.</p>';
  if (!QDTT.lichSu.length) return '<p class="adminGhiChu">Chưa có lần sửa sổ tướng nào (trong 60 lần sửa gần nhất của Đấu Trường).</p>';
  return '<section class="qdThe qdTheBang"><h4>🕘 Các lần sửa sổ tướng</h4><p class="adminGhiChu">Cùng lịch sử với 🎛️ Thông số. ↩ Hoàn tác = trả lại bản trước lần sửa đó (ghi thành một lần sửa mới).</p>'
    + '<ul class="qdLichSu">' + QDTT.lichSu.map(function (l) {
      var md = QDTT.md[l.ten] || {}, ds = qdttKhacNhau(KC_DT_CAU_HINH.tron(md, l.cu), KC_DT_CAU_HINH.tron(md, l.moi));
      var dong = ds.slice(0, 8).map(function (d) { return "<li><code>" + qdttH(d.k) + "</code>: " + qdttH(qdttChuSo(d.cu)) + " → <b>" + qdttH(qdttChuSo(d.moi)) + "</b></li>"; }).join("")
        + (ds.length > 8 ? "<li>… và " + (ds.length - 8) + " ô khác</li>" : "") + (ds.length ? "" : "<li>(về như cũ)</li>");
      return '<li class="qdMucLs"><div class="qdDauLs"><span>#' + l.id + " · " + qdttH(QDT.ngay(l.luc)) + " · " + qdttH(l.boi || "") + "</span><strong>"
        + qdttH(QDTT.TEN_TEP[l.ten]) + '</strong><button type="button" class="adminNut adminNutPhu" data-hoan-tac-qdtt="' + l.id + '">↩ Hoàn tác</button></div>'
        + (l.ghi_chu ? '<div class="qdGhiChuLs">“' + qdttH(l.ghi_chu) + "”</div>" : "") + "<ul>" + dong + "</ul></li>";
    }).join("") + "</ul></section>";
}

// ----------------------------------------------------------------
// SỬA
// ----------------------------------------------------------------
/** đọc giá trị của một ô -> { ok, v } (v undefined = bỏ khoá) */
function qdttDoc(o) {
  var kieu = o.getAttribute("data-kieu");
  if (kieu === "chon4") {
    var ds = [];
    Array.prototype.forEach.call(o.querySelectorAll(".qdttO4"), function (s) { if (s.value && ds.indexOf(s.value) < 0) ds.push(s.value); });
    return { ok: true, v: ds };
  }
  var el = o.querySelector(".qdttNhap"), s = el.value;
  if (kieu === "chon") return { ok: s !== "", v: s };
  if (kieu === "chonTrong") return { ok: true, v: s === "" ? undefined : s };
  if (kieu === "chonNull") return { ok: true, v: s === "" ? null : s };
  if (kieu === "bool") return { ok: true, v: s === "true" };
  if (kieu === "so") { var n = Number(s); return { ok: s.trim() !== "" && isFinite(n) && n >= 0, v: n }; }
  if (kieu === "mau") { s = s.trim(); return { ok: s === "" || /^#[0-9a-fA-F]{6}$/.test(s), v: s === "" ? undefined : s.toLowerCase() }; }
  if (kieu === "chuTrong") return { ok: true, v: s.trim() === "" ? undefined : s.trim() };
  return { ok: s.trim() !== "", v: s.trim() };
}

function qdttNhan(o) {
  var tep = o.getAttribute("data-tep"), duong = JSON.parse(o.getAttribute("data-duong")), kq = qdttDoc(o);
  if (!kq.ok) { o.classList.add("loi"); qdttCapNhat(); return; }
  o.classList.remove("loi");
  // bỏ khoá mà mặc định có (vd xoá chữ tên chiêu mặc định): giữ chuỗi rỗng để phần sửa ghi đè được
  if (kq.v === undefined && qdttLay(QDTT.md[tep], duong) !== undefined && o.getAttribute("data-kieu") !== "chonTrong") kq.v = "";
  // "an: false" = như mặc định không có khoá
  if (o.getAttribute("data-kieu") === "bool" && kq.v === false && qdttLay(QDTT.md[tep], duong) === undefined) kq.v = undefined;
  qdttDat(QDTT.ht[tep], duong, kq.v);
  if (tep === "tuong" && duong[0] === "thuLinh") { qdttVe(); return; } // nhãn "như đời trước (…)" của các đời sau đổi theo
  qdttLopLai(o, tep, duong);
  var el = o.querySelector(".qdttNhap");
  if (el && el.tagName === "SELECT") el.classList.toggle("nhuTruoc", el.value === "" && o.getAttribute("data-kieu") === "chonTrong");
  qdttCapNhat();
}

function qdttLopLai(o, tep, duong) {
  ["daSua", "chuaLuu"].forEach(function (c) { o.classList.remove(c); });
  qdttLopO(tep, duong).trim().split(" ").forEach(function (c) { if (c) o.classList.add(c); });
}

function qdttVeMacDinh(o) {
  var tep = o.getAttribute("data-tep"), duong = JSON.parse(o.getAttribute("data-duong"));
  qdttDat(QDTT.ht[tep], duong, qdttChep(qdttLay(QDTT.md[tep], duong)));
  qdttVe(); // vẽ lại (nhãn "như đời trước", danh sách chọn có thể đổi theo)
}

function qdttSoChuaLuu() {
  var so = 0;
  QDTT.TEP.forEach(function (t) { if (QDTT.ht[t]) so += qdttKhacNhau(QDTT.daLuu[t], QDTT.ht[t]).length; });
  return so;
}

/** lỗi của bản đang sửa: ô sai dạng + KC_DT_TUONG.kiem() */
function qdttLoiBanNhap() {
  var loi = [];
  if (qdttEl("qdttNoiDung").querySelector(".loi")) loi.push("Còn ô chưa đúng dạng (viền đỏ).");
  return loi.concat(KC_DT_TUONG.tao(QDTT.ht.tuong, QDTT.ht.ky_nang, QDTT.ht.hieu_ung).kiem());
}

function qdttCapNhat() {
  var so = qdttSoChuaLuu();
  qdttEl("qdttThanhLuu").classList.toggle("hien", so > 0);
  qdttEl("qdttSoChuaLuu").textContent = so + " ô chưa lưu";
  qdttEl("qdttLuu").disabled = QDTT.dangLuu || !QDTT.coMayChu;
  var loi = qdttLoiBanNhap(), o = qdttEl("qdttLoi");
  o.innerHTML = loi.length ? "<strong>⚠️ Sổ tướng đang có " + loi.length + " chỗ sai (chưa lưu được):</strong><ul>"
    + loi.slice(0, 12).map(function (l) { return "<li>" + qdttH(l) + "</li>"; }).join("") + (loi.length > 12 ? "<li>…</li>" : "") + "</ul>" : "";
  o.classList.toggle("hien", loi.length > 0);
}

function qdttGanSuKien() {
  var man = qdttEl("manhinh-" + QDTT.MAN);
  man.addEventListener("click", function (su) {
    var t = su.target;
    var chip = t.closest("[data-the-qdtt]");
    if (chip) { QDTT.the = chip.getAttribute("data-the-qdtt"); qdttVe(); return; }
    if (t.closest("[data-ve]")) { qdttVeMacDinh(t.closest("[data-o]")); return; }
    var thu = t.closest("[data-xem-thu]");
    if (thu) { qdttXemThu(thu.getAttribute("data-xem-thu")); return; }
    var ht = t.closest("[data-hoan-tac-qdtt]");
    if (ht) { qdttHoanTac(Number(ht.getAttribute("data-hoan-tac-qdtt"))); return; }
  });
  man.addEventListener("change", function (su) {
    var t = su.target, o = t.closest("[data-o]");
    if (!o || !t.closest("#qdttNoiDung")) return;
    if (t.classList.contains("qdttChonMau")) { var nhap = o.querySelector(".qdttNhap"); nhap.value = t.value; }
    qdttNhan(o);
  });
  man.addEventListener("input", function (su) {
    var t = su.target, o = t.closest("[data-o]");
    if (!o || t.tagName !== "INPUT" || t.classList.contains("qdttChonMau")) return;
    qdttNhan(o);
    if (o.getAttribute("data-kieu") === "mau") { var c = o.querySelector(".qdttChonMau"); if (/^#[0-9a-f]{6}$/i.test(t.value)) c.value = t.value; }
  });
  qdttEl("qdttLuu").addEventListener("click", qdttLuu);
  qdttEl("qdttBo").addEventListener("click", function () {
    if (!confirm("Bỏ mọi ô chưa lưu của sổ tướng?")) return;
    QDTT.TEP.forEach(function (t) { QDTT.ht[t] = qdttChep(QDTT.daLuu[t]); });
    qdttVe();
  });
}

// ----------------------------------------------------------------
// ▶ XEM THỬ: khung phủ chứa trang trận thử, lấy bản đang sửa qua window.QDTT_banNhap
// ----------------------------------------------------------------
function qdttXemThu(maTuong) {
  var cu = qdttEl("qdttKhungThu"); if (cu) cu.remove();
  var m = qdttKho()[maTuong] || {};
  var k = document.createElement("div");
  k.id = "qdttKhungThu"; k.className = "qdttKhungThu"; k.setAttribute("role", "dialog"); k.setAttribute("aria-label", "Xem thử tướng");
  k.innerHTML = '<div class="qdttKhungDau"><strong>▶ ' + qdttH(m.ten || maTuong) + "</strong>"
    + '<span class="adminGhiChu">bản đang sửa' + (qdttSoChuaLuu() ? " (có ô chưa lưu)" : "") + "</span>"
    + '<button type="button" class="adminNut adminNutPhu" id="qdttDongThu">✕ Đóng</button></div>'
    + '<iframe src="dt/thu_tran_dau.html?tuong=' + encodeURIComponent(maTuong) + '&banNhap=1" title="Trận thử"></iframe>';
  document.body.appendChild(k);
  var dong = function () { k.remove(); document.removeEventListener("keydown", phim); };
  var phim = function (e) { if (e.key === "Escape") dong(); };
  qdttEl("qdttDongThu").addEventListener("click", dong);
  document.addEventListener("keydown", phim);
}

// ----------------------------------------------------------------
// LƯU, HOÀN TÁC
// ----------------------------------------------------------------
function qdttLuu() {
  if (QDTT.dangLuu || !QDTT.coMayChu) return;
  var loi = qdttLoiBanNhap();
  if (loi.length) { adminBaoTin("❌ Sổ tướng còn " + loi.length + " chỗ sai, chưa lưu: " + loi[0], false); qdttCapNhat(); return; }
  var ghiChu = qdttEl("qdttGhiChu").value.trim() || null;
  var viec = QDTT.TEP.filter(function (t) { return qdttKhacNhau(QDTT.daLuu[t], QDTT.ht[t]).length; }).map(function (t) {
    var sua = KC_DT_CAU_HINH.khac(QDTT.md[t], QDTT.ht[t]) || {};
    delete sua._phienBan;
    if (Object.keys(sua).length) sua._phienBan = QDTT.md[t].phienBan || 1; // đặc tả mục 3.5: phần sửa ghi phiên bản file
    return { t: t, sua: sua, giu: qdttChep(QDTT.ht[t]) };
  });
  if (!viec.length) return;
  QDTT.dangLuu = true; qdttCapNhat();
  qdttEl("qdttLuu").textContent = "Đang lưu…";
  var loiDs = [], hong = [];
  viec.reduce(function (p, v) {
    return p.then(function () {
      return adminGoiRpc("kc_dt_admin_luu_thong_so", { p_ten: v.t, p_sua: v.sua, p_ghi_chu: ghiChu }).then(function (kq) {
        if (!kq || !kq.thanhCong) { loiDs.push(QDTT.TEN_TEP[v.t] + ": " + ((kq && kq.thongBao) || "lỗi")); hong.push(v); }
      });
    });
  }, Promise.resolve()).then(function () {
    QDTT.dangLuu = false;
    qdttEl("qdttLuu").textContent = "💾 Lưu";
    if (!loiDs.length) qdttEl("qdttGhiChu").value = "";
    return qdttTai();
  }).then(function () {
    if (hong.length) { hong.forEach(function (v) { QDTT.ht[v.t] = v.giu; }); qdttVe(); adminBaoTin("❌ " + loiDs.join(" · "), false); }
    else adminBaoTin("✅ Đã lưu sổ tướng. Bé thấy tướng / chiêu mới từ lần mở game kế tiếp.", true);
  });
}

function qdttHoanTac(id) {
  if (qdttSoChuaLuu() > 0) { adminBaoTin("❌ Đang có ô chưa lưu: lưu hoặc bỏ trước khi hoàn tác.", false); return; }
  if (!confirm("Hoàn tác lần sửa #" + id + "?")) return;
  adminGoiRpc("kc_dt_admin_hoan_tac", { p_id: id }).then(function (kq) {
    if (kq && kq.thanhCong) adminBaoTin("✅ Đã hoàn tác lần sửa #" + id + ".", true);
    else adminBaoTin("❌ " + ((kq && kq.thongBao) || "Không hoàn tác được"), false);
    qdttTai();
  });
}
// 26/11/2026 - BƯỚC: TC_D05C0c (tạo mới)
