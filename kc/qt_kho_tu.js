// ================================================================
// FILE: kc/qt_kho_tu.js
// CHỨC NĂNG: Mục "📖 Kho từ vựng" của TRANG QUẢN TRỊ CHUNG (quantri_NC.html).
//   Bảng giống Excel để sửa kho từ dùng chung toàn app (kc/tu_vung/kho_tu.json):
//   sửa trực tiếp từ, nghĩa, emoji, cấp, chủ đề, đã soát, ghi chú; tải hình riêng của từ
//   (SVG / PNG / WebP, app tự đặt tên <từ>.<đuôi>); lọc, tìm, thêm, xoá; nhập / xuất Excel;
//   kiểm tra như công cụ nạp từ (nap_tu.js ở repo riêng): trùng từ, trùng hình cùng cấp,
//   nghĩa dài, chủ đề sai... Có lỗi thì không cho lưu.
//   LƯU = MỘT commit vào nhánh main của repo code qua GitHub API (kho_tu.json + file hình),
//   bằng mã truy cập fine-grained nhập một lần trên máy quản trị (nhớ trong localStorage
//   của máy đó). GitHub Pages cập nhật khoảng 1 phút sau thì game thấy từ / hình mới.
//   Kho trên repo đổi ở nơi khác (Claude nạp lô từ...) thì tự áp lại các thay đổi lên bản mới.
// BƯỚC: TC_T03B - NGÀY: 20/10/2026
// CẬP NHẬT: 21/10/2026 - TC_T03B (người dùng thêm): ô "Sắp xếp" (A-Z, Z-A, theo chủ đề, theo cấp, theo nghĩa).
// CẬP NHẬT: 21/10/2026 - TC_T02I: từ chưa có emoji / hình chỉ cảnh báo (vẫn lưu được), game chưa lấy ra chơi.
// PHỤ THUỘC: ../admin_NC.js (adminTaiKhoan, sự kiện "adminDaChuyenManHinh"), quantri_NC.html
//   (khung #manhinh-khotu), qt_kho_tu.css. Excel: SheetJS tải từ CDN khi bấm nút.
// ĐỊNH DẠNG FILE: GIỐNG HỆT vanBanKho() của repo_rieng/tu_dien/cong_cu/nap_tu.js (một từ một
//   dòng, thứ tự cột en|vi|e|cap|cd|hinh|soat|ghiChu, nhóm theo cấp 1 -> 4). Sửa một bên
//   thì sửa cả bên kia.
// ================================================================

var KT = {
  REPO: "ntdungsnotion/co-vua-cho-tre-em",
  NHANH: "main",
  DUONG_KHO: "kc/tu_vung/kho_tu.json",
  THU_MUC_HINH: "kc/tu_vung/hinh/",
  URL_KHO_TRANG: "tu_vung/kho_tu.json",   // bản trên GitHub Pages (trang này ở kc/)
  URL_HINH_TRANG: "tu_vung/hinh/",
  KHOA_MA: "kc_qt_ma_github",
  SO_DONG_TRANG: 50,
  NGHIA_DAI_CANH_BAO: 20,                 // như nap_tu.js
  NGHIA_DAI_TOI_DA: 28,
  CANH_TOI_DA_ANH: 512,                   // ảnh PNG / JPG lớn hơn thì thu nhỏ còn cạnh dài 512 px
  ANH_NHE: 200 * 1024,                    // ảnh nhẹ hơn và đủ nhỏ thì giữ nguyên file

  // Chủ đề (giống CHU_DE của nap_tu.js)
  CHU_DE: {
    con_vat: "con vật", cay_hoa: "cây, hoa, quả", do_an: "đồ ăn, đồ uống", thien_nhien: "thiên nhiên",
    thoi_tiet: "thời tiết", co_the: "cơ thể", gia_dinh: "gia đình", con_nguoi: "con người",
    nghe_nghiep: "nghề nghiệp", quan_ao: "quần áo", nha_cua: "nhà cửa", do_vat: "đồ vật",
    truong_hoc: "trường học", giao_thong: "giao thông", the_thao: "thể thao, trò chơi",
    am_nhac: "âm nhạc, nghệ thuật", mau_sac: "màu sắc, hình dạng", so_dem: "số đếm",
    thoi_gian: "thời gian", noi_chon: "nơi chốn", hanh_dong: "hành động", tinh_chat: "tính chất",
    cam_xuc: "cảm xúc", khac: "khác"
  },
  TEN_CAP: { 1: "Dễ", 2: "Trung bình", 3: "Khó", 4: "Thử thách" },
  COT: ["en", "vi", "e", "cap", "cd", "hinh", "soat", "ghiChu"],

  // ----- trạng thái -----
  daTai: false,
  dau: null,          // phần đầu file (moTa, giayPhep, phienBan, capNhat, soTu)
  dong: [],           // [{ id, goc: {...}|null, t: {...}, xoa, anhMoi: {ten, b64, url, kb}|null, kq: {loi, cb} }]
  soId: 0,
  nguon: "",          // "github" | "trang"
  commitTai: "",      // commit lúc tải (nguồn github)
  hinhCo: null,       // Set tên file đang có trong kc/tu_vung/hinh/ (biết khi tải bằng mã)
  trang: 0,
  dangLuu: false,
  henKiem: 0
};

document.addEventListener("DOMContentLoaded", function () {
  if (typeof adminTaiKhoan === "undefined" || !adminTaiKhoan) return;
  if (!document.getElementById("manhinh-khotu")) return;
  ktGanSuKien();
  document.addEventListener("adminDaChuyenManHinh", function (su) {
    if (su.detail.ten === "khotu" && !KT.daTai) { KT.daTai = true; ktTai(); }
  });
  // Mở thẳng bằng địa chỉ #khotu: quantri_NC.js đã mở mục này trước khi file này kịp nghe sự kiện
  if (ktEl("manhinh-khotu").classList.contains("dangHien")) { KT.daTai = true; ktTai(); }
  window.addEventListener("beforeunload", function (su) {
    if (ktSoThayDoi().tong > 0) { su.preventDefault(); su.returnValue = ""; }
  });
});

function ktEl(id) { return document.getElementById(id); }

// ================================================================
// PHẦN 1: MÃ TRUY CẬP GITHUB + GỌI API
// ================================================================

function ktLayMa() { try { return localStorage.getItem(KT.KHOA_MA) || ""; } catch (e) { return ""; } }
function ktDatMa(ma) {
  try { if (ma) localStorage.setItem(KT.KHOA_MA, ma); else localStorage.removeItem(KT.KHOA_MA); } catch (e) { /* bỏ qua */ }
}

/** Gọi GitHub API của repo code. Trả về JSON; lỗi thì ném Error có .trangThai (mã HTTP) */
function ktGoiGithub(duong, phuongThuc, than) {
  var ma = ktLayMa();
  if (!ma) return Promise.reject(new Error("Chưa có mã truy cập GitHub trên máy này."));
  var tuyChon = {
    method: phuongThuc || "GET",
    headers: {
      "Authorization": "Bearer " + ma,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    cache: "no-store"
  };
  if (than !== undefined) {
    tuyChon.headers["Content-Type"] = "application/json";
    tuyChon.body = JSON.stringify(than);
  }
  return fetch("https://api.github.com/repos/" + KT.REPO + duong, tuyChon).then(function (r) {
    return r.text().then(function (chu) {
      var du = null;
      try { du = chu ? JSON.parse(chu) : null; } catch (e) { du = null; }
      if (!r.ok) {
        var loi = new Error(ktLoiGithub(r.status, du && du.message));
        loi.trangThai = r.status;
        throw loi;
      }
      return du;
    });
  });
}

/** Lỗi GitHub -> câu dễ hiểu */
function ktLoiGithub(trangThai, thongDiep) {
  if (trangThai === 401) return "Mã truy cập GitHub sai hoặc đã hết hạn. Hãy tạo mã mới rồi nhập lại.";
  if (trangThai === 403) return "Mã truy cập không có quyền ghi. Khi tạo mã phải chọn repo co-vua-cho-tre-em và quyền Contents: Read and write.";
  if (trangThai === 404) return "Mã truy cập không thấy repo co-vua-cho-tre-em. Khi tạo mã phải chọn đúng repo này.";
  if (trangThai === 409 || trangThai === 422) return "Kho trên GitHub vừa thay đổi (" + (thongDiep || trangThai) + ").";
  return "GitHub báo lỗi " + trangThai + (thongDiep ? ": " + thongDiep : "");
}

/** Base64 (GitHub) -> chuỗi UTF-8 */
function ktGiaiBase64(b64) {
  var nhiPhan = atob(String(b64).replace(/\s/g, ""));
  var mang = new Uint8Array(nhiPhan.length);
  for (var i = 0; i < nhiPhan.length; i++) mang[i] = nhiPhan.charCodeAt(i);
  return new TextDecoder("utf-8").decode(mang);
}

/** Đọc bản mới nhất trên nhánh main: { commit, cay, chu (nội dung kho_tu.json), hinhCo } */
function ktDocTuGithub() {
  var kq = {};
  return ktGoiGithub("/git/ref/heads/" + KT.NHANH).then(function (ref) {
    kq.commit = ref.object.sha;
    return ktGoiGithub("/git/commits/" + kq.commit);
  }).then(function (cm) {
    kq.cay = cm.tree.sha;
    return ktGoiGithub("/git/trees/" + kq.cay + "?recursive=1");
  }).then(function (cay) {
    var muc = null;
    kq.hinhCo = new Set();
    (cay.tree || []).forEach(function (m) {
      if (m.path === KT.DUONG_KHO) muc = m;
      if (m.type === "blob" && m.path.indexOf(KT.THU_MUC_HINH) === 0) kq.hinhCo.add(m.path.slice(KT.THU_MUC_HINH.length));
    });
    if (!muc) throw new Error("Không thấy " + KT.DUONG_KHO + " trên nhánh " + KT.NHANH + ".");
    return ktGoiGithub("/git/blobs/" + muc.sha);
  }).then(function (blob) {
    kq.chu = ktGiaiBase64(blob.content);
    return kq;
  });
}

// ================================================================
// PHẦN 2: TẢI KHO
// ================================================================

function ktTai() {
  if (ktSoThayDoi().tong > 0 && !confirm("Còn thay đổi chưa lưu. Tải lại sẽ bỏ hết các thay đổi đó. Tải lại?")) return;
  ktEl("ktBang").innerHTML = '<tr><td class="adminDangTai">⏳ Đang tải kho từ…</td></tr>';
  ktCapNhatMaUI();
  var viec;
  if (ktLayMa()) {
    viec = ktDocTuGithub().then(function (kq) {
      KT.nguon = "github"; KT.commitTai = kq.commit; KT.hinhCo = kq.hinhCo;
      return kq.chu;
    }).catch(function (loi) {
      // Mã lỗi: vẫn cho xem bản trên trang web, báo rõ lý do
      ktBao("Không đọc được từ GitHub: " + loi.message + " Đang dùng bản trên trang web (chỉ xem / sửa thử).", false);
      return ktDocTuTrang();
    });
  } else {
    viec = ktDocTuTrang();
  }
  viec.then(function (chu) {
    ktNapChu(chu);
    ktVeLai(true);
    ktCapNhatMaUI();
  }).catch(function (loi) {
    ktEl("ktBang").innerHTML = "";
    ktBao("Không tải được kho từ: " + (loi && loi.message || loi), false);
  });
}

function ktDocTuTrang() {
  return fetch(KT.URL_KHO_TRANG, { cache: "no-cache" }).then(function (r) {
    if (!r.ok) throw new Error("trang web trả lỗi " + r.status);
    KT.nguon = "trang"; KT.commitTai = ""; KT.hinhCo = null;
    return r.text();
  });
}

/** Nạp nội dung kho_tu.json vào bảng (bỏ mọi thay đổi chưa lưu) */
function ktNapChu(chu) {
  var du = JSON.parse(chu);
  if (!du || !Array.isArray(du.tu)) throw new Error("kho_tu.json không đúng định dạng (thiếu mảng tu)");
  KT.dau = du;
  KT.dong = du.tu.map(function (t) { var c = ktChuanTu(t); return ktDongMoi(c, ktChep(c)); });
  KT.trang = 0;
  ktKiemTatCa();
}

function ktChuanTu(t) {
  return {
    en: String(t.en || ""), vi: String(t.vi || ""), e: String(t.e || ""),
    cap: Number(t.cap) || 0, cd: String(t.cd || ""), hinh: String(t.hinh || ""),
    soat: !!t.soat, ghiChu: String(t.ghiChu || "")
  };
}
function ktChep(t) { var c = {}; KT.COT.forEach(function (k) { c[k] = t[k]; }); return c; }
function ktDongMoi(t, goc) { KT.soId++; return { id: KT.soId, goc: goc || null, t: t, xoa: false, anhMoi: null, kq: { loi: [], cb: [] } }; }

// ================================================================
// PHẦN 3: GHI FILE (giống hệt vanBanKho của nap_tu.js)
// ================================================================

function ktNgayGio() {
  var d = new Date(Date.now() + 7 * 3600e3); // giờ Việt Nam
  function p(n) { return String(n).padStart(2, "0"); }
  return p(d.getUTCDate()) + "/" + p(d.getUTCMonth() + 1) + "/" + d.getUTCFullYear() + " " + p(d.getUTCHours()) + ":" + p(d.getUTCMinutes());
}

/** Chuỗi JSON của cả kho từ danh sách từ (đã bỏ dòng xoá). capNhat: chuỗi ghi ở đầu file */
function ktVanBan(dsTu, dau, capNhat) {
  var ds = [];
  for (var cap = 1; cap <= 4; cap++) dsTu.forEach(function (t) { if (t.cap === cap) ds.push(t); });
  var phanDau = [
    ["moTa", dau.moTa || ""],
    ["giayPhep", dau.giayPhep || ""],
    ["phienBan", dau.phienBan || 1],
    ["capNhat", capNhat],
    ["soTu", ds.length]
  ];
  var dong = ds.map(function (t) {
    var o = {};
    KT.COT.forEach(function (k) { o[k] = t[k]; });
    return "    " + JSON.stringify(o);
  });
  return "{\n" + phanDau.map(function (kv) { return "  " + JSON.stringify(kv[0]) + ": " + JSON.stringify(kv[1]) + ","; }).join("\n") +
    '\n  "tu": [\n' + dong.join(",\n") + "\n  ]\n}\n";
}

// ================================================================
// PHẦN 4: KIỂM TRA (giống kiemTu của nap_tu.js, thêm trùng hình riêng)
// ================================================================

var KT_NHAY_CAM = new Set(("alcohol beer wine vodka drunk drug drugs cigarette tobacco smoke casino gambling bet " +
  "kill killed killing murder dead death die suicide gun guns weapon weapons bomb sex sexy nude naked porn adult " +
  "dating violence blood war").split(" "));
var KT_EMOJI_MOI = [[0x1F6DC, 0x1F6DF], [0x1F7F0, 0x1F7F0], [0x1FA75, 0x1FA77], [0x1FA7B, 0x1FA7C], [0x1FA87, 0x1FA89],
  [0x1FA8F, 0x1FA8F], [0x1FAA9, 0x1FAAF], [0x1FAB7, 0x1FABF], [0x1FAC3, 0x1FAC6], [0x1FACE, 0x1FACF],
  [0x1FAD7, 0x1FADF], [0x1FAE0, 0x1FAE9], [0x1FAF0, 0x1FAF8]];
var KT_LA_HINH = /\p{Extended_Pictographic}|\p{Regional_Indicator}|^[0-9#*]️?⃣$/u;
var KT_TEN_FILE = /^[a-z0-9_-]+\.(svg|png|webp)$/;
var KT_TACH = (typeof Intl !== "undefined" && Intl.Segmenter) ? new Intl.Segmenter("en", { granularity: "grapheme" }) : null;

function ktTenFile(hinh) { return String(hinh || "").split("?")[0]; }
/** Khóa so trùng hình (như KC_TU_VUNG.khoaHinh của game) */
function ktKhoaHinh(t) { return t.hinh ? "h:" + ktTenFile(t.hinh) : (t.e ? "e:" + t.e : ""); }

function ktKiemTatCa() {
  var demTu = new Map(), theoHinh = new Map();
  KT.dong.forEach(function (d) {
    if (d.xoa) return;
    demTu.set(d.t.en, (demTu.get(d.t.en) || 0) + 1);
    var k = ktKhoaHinh(d.t);
    if (k) { var kk = d.t.cap + "|" + k; if (!theoHinh.has(kk)) theoHinh.set(kk, []); theoHinh.get(kk).push(d.t.en); }
  });
  KT.dong.forEach(function (d) { d.kq = d.xoa ? { loi: [], cb: [] } : ktKiemTu(d, demTu, theoHinh); });
}

function ktKiemTu(d, demTu, theoHinh) {
  var t = d.t, loi = [], cb = [];
  if (!/^[a-z]{3,}$/.test(t.en)) loi.push("Từ phải là chữ thường a-z, ít nhất 3 chữ, không dấu cách.");
  else if (demTu.get(t.en) > 1) loi.push("Trùng từ: \"" + t.en + "\" có " + demTu.get(t.en) + " dòng.");
  [["Nghĩa", t.vi], ["Emoji", t.e], ["Chủ đề", t.cd], ["Ghi chú", t.ghiChu]].forEach(function (x) {
    if (/[`\\|]|\$\{/.test(x[1])) loi.push(x[0] + " chứa ký tự cấm (` \\ | ${).");
  });
  var cum = KT_TACH ? Array.from(KT_TACH.segment(t.e), function (s) { return s.segment; }).filter(function (s) { return s.trim(); }) : (t.e.trim() ? [t.e] : []);
  if (!cum.length) { if (!t.hinh) cb.push("Chưa có hình: game chưa lấy từ này ra chơi (thêm emoji hoặc tải hình)."); }
  else if (cum.length > 3) loi.push("Emoji quá 3 hình.");
  else if (KT_TACH && !cum.every(function (s) { return KT_LA_HINH.test(s); })) loi.push("Ô emoji có ký tự không phải emoji.");
  else if (Array.from(t.e).some(function (c) { var m = c.codePointAt(0); return KT_EMOJI_MOI.some(function (r) { return m >= r[0] && m <= r[1]; }); }))
    cb.push("Emoji mới, máy cũ có thể hiện ô vuông.");
  if (!t.vi.trim()) loi.push("Thiếu nghĩa.");
  else if (t.vi.length > KT.NGHIA_DAI_TOI_DA) loi.push("Nghĩa dài " + t.vi.length + " ký tự (tối đa " + KT.NGHIA_DAI_TOI_DA + ").");
  else if (t.vi.length > KT.NGHIA_DAI_CANH_BAO) cb.push("Nghĩa hơi dài (" + t.vi.length + " ký tự, nên dưới " + KT.NGHIA_DAI_CANH_BAO + ").");
  if (t.cd && !KT.CHU_DE[t.cd]) loi.push("Chủ đề \"" + t.cd + "\" không có trong danh sách.");
  if (!(t.cap >= 1 && t.cap <= 4)) loi.push("Cấp phải là 1-4.");
  if (t.hinh) {
    var ten = ktTenFile(t.hinh);
    if (!KT_TEN_FILE.test(ten)) loi.push("Tên file hình \"" + t.hinh + "\" chỉ gồm a-z 0-9 _ -, đuôi .svg .png .webp.");
    else if (!d.anhMoi && KT.hinhCo && !KT.hinhCo.has(ten)) loi.push("Chưa có file hình " + ten + " trên repo: bấm 📷 để tải lên.");
  }
  if (KT_NHAY_CAM.has(t.en)) cb.push("Từ nhạy cảm với trẻ, người lớn nên cân nhắc.");
  var k = ktKhoaHinh(t);
  if (k) {
    var cung = (theoHinh.get(t.cap + "|" + k) || []).filter(function (en) { return en !== t.en; });
    if (cung.length) cb.push("Trùng hình với \"" + cung.slice(0, 3).join("\", \"") + "\" cùng cấp " + t.cap + " (bảng ôn có thể có 2 đáp án).");
  }
  return { loi: loi, cb: cb };
}

/** Dòng này khác bản gốc không (mới / sửa / xoá / có ảnh mới) */
function ktTrangThaiDong(d) {
  if (!d.goc) return d.xoa ? "" : "moi";
  if (d.xoa) return "xoa";
  if (d.anhMoi) return "sua";
  for (var i = 0; i < KT.COT.length; i++) if (d.t[KT.COT[i]] !== d.goc[KT.COT[i]]) return "sua";
  return "";
}

function ktSoThayDoi() {
  var kq = { moi: 0, sua: 0, xoa: 0, hinh: 0, tong: 0 };
  KT.dong.forEach(function (d) {
    var tt = ktTrangThaiDong(d);
    if (tt) { kq[tt]++; kq.tong++; }
    if (d.anhMoi && !d.xoa) kq.hinh++;
  });
  return kq;
}

// ================================================================
// PHẦN 5: VẼ BẢNG (máy tính: bảng nhiều cột; điện thoại / màn vừa: thẻ, CSS lo)
// ================================================================

function ktBoDau(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase(); }

function ktLocDong() {
  var cap = ktEl("ktLocCap").value, cd = ktEl("ktLocChuDe").value, soat = ktEl("ktLocSoat").value,
    hinh = ktEl("ktLocHinh").value, bao = ktEl("ktLocBao").value, tim = ktBoDau(ktEl("ktTim").value.trim());
  var ds = KT.dong.filter(function (d) {
    var t = d.t;
    if (cap && String(t.cap) !== cap) return false;
    if (cd === "_trong" ? t.cd : (cd && t.cd !== cd)) return false;
    if (soat === "roi" && !t.soat) return false;
    if (soat === "chua" && t.soat) return false;
    if (hinh === "rieng" && !(t.hinh || d.anhMoi)) return false;
    if (hinh === "emoji" && (t.hinh || d.anhMoi)) return false;
    if (bao === "loi" && !d.kq.loi.length) return false;
    if (bao === "cb" && !(d.kq.loi.length || d.kq.cb.length)) return false;
    if (bao === "doi" && !ktTrangThaiDong(d)) return false;
    if (tim && ktBoDau(t.en).indexOf(tim) < 0 && ktBoDau(t.vi).indexOf(tim) < 0 && ktBoDau(t.ghiChu).indexOf(tim) < 0) return false;
    return true;
  });
  // Từ mới thêm lên đầu (mới nhất trước), còn lại theo thứ tự đã chọn (mặc định: thứ tự trong file)
  var moi = ds.filter(function (d) { return !d.goc; }).reverse();
  var cu = ds.filter(function (d) { return d.goc; });
  var cach = ktEl("ktSapXep").value;
  if (cach) {
    var soAbc = function (a, b) { return a.t.en.localeCompare(b.t.en, "en"); };
    var tenCd = function (d) { return d.t.cd ? (KT.CHU_DE[d.t.cd] || d.t.cd) : "\uffff"; };  // chưa có chủ đề xếp cuối
    var so = {
      az: soAbc,
      za: function (a, b) { return soAbc(b, a); },
      chude: function (a, b) { return tenCd(a).localeCompare(tenCd(b), "vi") || soAbc(a, b); },
      cap: function (a, b) { return (a.t.cap - b.t.cap) || soAbc(a, b); },
      nghia: function (a, b) { return a.t.vi.localeCompare(b.t.vi, "vi") || soAbc(a, b); }
    }[cach];
    if (so) cu.sort(so);
  }
  return moi.concat(cu);
}

function ktVeLai(veTrangDau) {
  if (veTrangDau) KT.trang = 0;
  var ds = ktLocDong();
  var soTrang = Math.max(1, Math.ceil(ds.length / KT.SO_DONG_TRANG));
  if (KT.trang >= soTrang) KT.trang = soTrang - 1;
  var dau = KT.trang * KT.SO_DONG_TRANG;
  var trangNay = ds.slice(dau, dau + KT.SO_DONG_TRANG);

  var tb = ktEl("ktBang");
  tb.innerHTML = "";
  if (!trangNay.length) {
    tb.innerHTML = '<tr class="ktDongRong"><td class="adminRong">Không có từ nào khớp bộ lọc.</td></tr>';
  }
  trangNay.forEach(function (d) { tb.appendChild(ktVeDong(d)); });

  ktEl("ktSoKhop").textContent = ds.length === KT.dong.length
    ? "Đang xem cả kho: " + ds.length.toLocaleString("vi-VN") + " từ"
    : "Khớp bộ lọc: " + ds.length.toLocaleString("vi-VN") + " / " + KT.dong.length.toLocaleString("vi-VN") + " từ";
  ["ktTrangTren", "ktTrangDuoi"].forEach(function (id) {
    var o = ktEl(id);
    o.querySelector(".ktSoTrang").textContent = "Trang " + (KT.trang + 1) + " / " + soTrang;
    o.querySelector(".ktTruoc").disabled = KT.trang === 0;
    o.querySelector(".ktSau").disabled = KT.trang >= soTrang - 1;
  });
  ktCapNhatTongKet();
}

function ktTaoO(nhan, lop) {
  var td = document.createElement("td");
  td.setAttribute("data-nhan", nhan);
  if (lop) td.className = lop;
  return td;
}
function ktTaoNhap(truong, giaTri, goiY) {
  var o = document.createElement("input");
  o.type = "text"; o.defaultValue = giaTri; o.setAttribute("data-truong", truong);
  if (goiY) o.placeholder = goiY;
  o.setAttribute("aria-label", goiY || truong);
  return o;
}

function ktVeDong(d) {
  var t = d.t;
  var tr = document.createElement("tr");
  tr.setAttribute("data-id", d.id);
  var tt = ktTrangThaiDong(d);
  tr.className = "ktDong" + (tt ? " kt-" + tt : "");

  // Hình
  var oHinh = ktTaoO("Hình", "ktOHinh");
  var xem = document.createElement("div");
  xem.className = "ktXemHinh";
  ktGanXemHinh(xem, d);
  var nutTai = document.createElement("button");
  nutTai.type = "button"; nutTai.className = "ktNutNho"; nutTai.setAttribute("data-viec", "taiAnh");
  nutTai.textContent = "📷"; nutTai.title = "Tải hình riêng của từ (SVG, PNG, WebP)";
  oHinh.appendChild(xem);
  var hang = document.createElement("div"); hang.className = "ktHangNut";
  hang.appendChild(nutTai);
  if (t.hinh || d.anhMoi) {
    var nutBo = document.createElement("button");
    nutBo.type = "button"; nutBo.className = "ktNutNho"; nutBo.setAttribute("data-viec", "boAnh");
    nutBo.textContent = "✕"; nutBo.title = "Bỏ hình riêng, dùng lại emoji";
    hang.appendChild(nutBo);
  }
  oHinh.appendChild(hang);
  tr.appendChild(oHinh);

  var oEn = ktTaoO("Từ tiếng Anh", "ktOEn"); oEn.appendChild(ktTaoNhap("en", t.en, "từ tiếng Anh")); tr.appendChild(oEn);
  var oVi = ktTaoO("Nghĩa", "ktOVi"); oVi.appendChild(ktTaoNhap("vi", t.vi, "nghĩa tiếng Việt")); tr.appendChild(oVi);
  var oE = ktTaoO("Emoji", "ktOE"); oE.appendChild(ktTaoNhap("e", t.e, "emoji")); tr.appendChild(oE);

  var oCap = ktTaoO("Cấp", "ktOCap");
  var chonCap = document.createElement("select"); chonCap.setAttribute("data-truong", "cap"); chonCap.setAttribute("aria-label", "Cấp");
  for (var c = 1; c <= 4; c++) chonCap.add(new Option(c + " " + KT.TEN_CAP[c], String(c)));
  if (!(t.cap >= 1 && t.cap <= 4)) chonCap.add(new Option("?", String(t.cap)));
  chonCap.value = String(t.cap);
  oCap.appendChild(chonCap); tr.appendChild(oCap);

  var oCd = ktTaoO("Chủ đề", "ktOCd");
  var chonCd = document.createElement("select"); chonCd.setAttribute("data-truong", "cd"); chonCd.setAttribute("aria-label", "Chủ đề");
  chonCd.add(new Option("(chưa có)", ""));
  Object.keys(KT.CHU_DE).forEach(function (k) { chonCd.add(new Option(KT.CHU_DE[k], k)); });
  if (t.cd && !KT.CHU_DE[t.cd]) chonCd.add(new Option(t.cd + " (sai)", t.cd));
  chonCd.value = t.cd;
  oCd.appendChild(chonCd); tr.appendChild(oCd);

  var oSoat = ktTaoO("Đã soát", "ktOSoat");
  var nhanSoat = document.createElement("label"); nhanSoat.className = "ktNhanSoat";
  var hop = document.createElement("input"); hop.type = "checkbox"; hop.checked = t.soat; hop.setAttribute("data-truong", "soat");
  nhanSoat.appendChild(hop); nhanSoat.appendChild(document.createTextNode(" Đạt"));
  oSoat.appendChild(nhanSoat); tr.appendChild(oSoat);

  var oGc = ktTaoO("Ghi chú", "ktOGc"); oGc.appendChild(ktTaoNhap("ghiChu", t.ghiChu, "ghi chú")); tr.appendChild(oGc);

  var oBao = ktTaoO("Kiểm tra", "ktOBao"); tr.appendChild(oBao); ktGanBao(oBao, d);

  var oXoa = ktTaoO("", "ktOXoa");
  var nutXoa = document.createElement("button");
  nutXoa.type = "button"; nutXoa.className = "ktNutNho";
  nutXoa.setAttribute("data-viec", d.xoa ? "hoanTac" : "xoa");
  nutXoa.textContent = d.xoa ? "↩️" : "🗑️";
  nutXoa.title = d.xoa ? "Giữ lại từ này" : "Xoá từ này";
  oXoa.appendChild(nutXoa); tr.appendChild(oXoa);

  if (d.xoa) tr.querySelectorAll("input, select").forEach(function (o) { o.disabled = true; });
  return tr;
}

function ktGanXemHinh(xem, d) {
  xem.textContent = "";
  var t = d.t, url = d.anhMoi ? d.anhMoi.url : (t.hinh ? KT.URL_HINH_TRANG + t.hinh : "");
  if (url) {
    var img = document.createElement("img");
    img.alt = t.vi || t.en; img.src = url;
    img.onerror = function () { xem.textContent = t.e || "🖼️"; xem.title = "Hình chưa hiện trên trang web (vừa lưu thì chờ khoảng 1 phút)"; };
    xem.appendChild(img);
    if (d.anhMoi) xem.title = "Hình mới chọn (" + d.anhMoi.ten + ", " + d.anhMoi.kb + " KB), chưa lưu";
    else xem.title = t.hinh;
  } else {
    xem.textContent = t.e || "—";
    xem.title = "Chưa có hình riêng, game dùng emoji";
  }
}

function ktGanBao(o, d) {
  o.textContent = "";
  var tt = ktTrangThaiDong(d);
  if (tt) {
    var nhan = document.createElement("span");
    nhan.className = "ktNhanDoi kt-" + tt;
    nhan.textContent = { moi: "Mới", sua: "Đã sửa", xoa: "Sẽ xoá" }[tt];
    o.appendChild(nhan);
  }
  d.kq.loi.forEach(function (x) { var p = document.createElement("div"); p.className = "ktLoi"; p.textContent = "❌ " + x; o.appendChild(p); });
  d.kq.cb.forEach(function (x) { var p = document.createElement("div"); p.className = "ktCanhBao"; p.textContent = "⚠️ " + x; o.appendChild(p); });
  if (!tt && !d.kq.loi.length && !d.kq.cb.length) { var ok = document.createElement("span"); ok.className = "ktOn"; ok.textContent = "✓"; o.appendChild(ok); }
  var tr = o.parentNode;
  if (tr) {
    tr.className = "ktDong" + (tt ? " kt-" + tt : "") + (d.kq.loi.length ? " ktCoLoi" : "");
  }
}

/** Cập nhật phần báo của các dòng đang hiện + dòng tổng kết (không vẽ lại ô nhập, giữ con trỏ) */
function ktCapNhatBao() {
  ktKiemTatCa();
  document.querySelectorAll("#ktBang tr[data-id]").forEach(function (tr) {
    var d = ktTimDong(tr.getAttribute("data-id"));
    if (d) ktGanBao(tr.querySelector(".ktOBao"), d);
  });
  ktCapNhatTongKet();
}

function ktCapNhatTongKet() {
  var demCap = { 1: 0, 2: 0, 3: 0, 4: 0 }, coHinh = 0, daSoat = 0, soLoi = 0, soCb = 0, con = 0;
  KT.dong.forEach(function (d) {
    if (d.xoa) return;
    con++;
    if (demCap[d.t.cap] !== undefined) demCap[d.t.cap]++;
    if (d.t.hinh || d.anhMoi) coHinh++;
    if (d.t.soat) daSoat++;
    if (d.kq.loi.length) soLoi++;
    if (d.kq.cb.length) soCb++;
  });
  var o = ktEl("ktTongKet");
  o.innerHTML = "";
  function the(chu, lop, loc) {
    var b = document.createElement(loc ? "button" : "span");
    b.className = "ktThe" + (lop ? " " + lop : "");
    b.textContent = chu;
    if (loc) { b.type = "button"; b.addEventListener("click", function () { ktEl("ktLocBao").value = loc; ktVeLai(true); }); }
    o.appendChild(b);
  }
  the("📚 " + con.toLocaleString("vi-VN") + " từ");
  for (var c = 1; c <= 4; c++) the("Cấp " + c + ": " + demCap[c]);
  the("🖼️ hình riêng: " + coHinh);
  the("✅ đã soát: " + daSoat);
  the("❌ lỗi: " + soLoi, soLoi ? "ktTheLoi" : "", soLoi ? "loi" : "");
  the("⚠️ cảnh báo: " + soCb, soCb ? "ktTheCb" : "", soCb ? "cb" : "");

  var dem = ktSoThayDoi();
  var phan = [];
  if (dem.moi) phan.push(dem.moi + " từ mới");
  if (dem.sua) phan.push(dem.sua + " từ sửa");
  if (dem.xoa) phan.push(dem.xoa + " từ xoá");
  if (dem.hinh) phan.push(dem.hinh + " hình mới");
  ktEl("ktThayDoi").textContent = dem.tong ? "Chưa lưu: " + phan.join(", ") + "." : "Không có thay đổi chưa lưu.";
  ktEl("ktThanhLuu").classList.toggle("coDoi", dem.tong > 0);
  var nutLuu = ktEl("ktNutLuu");
  nutLuu.disabled = KT.dangLuu || dem.tong === 0;
  nutLuu.textContent = KT.dangLuu ? "⏳ Đang lưu…" : (soLoi ? "💾 Lưu (còn " + soLoi + " từ lỗi)" : "💾 Lưu vào kho");
  ktEl("ktNutBoDoi").disabled = KT.dangLuu || dem.tong === 0;
}

function ktTimDong(id) {
  id = Number(id);
  for (var i = 0; i < KT.dong.length; i++) if (KT.dong[i].id === id) return KT.dong[i];
  return null;
}

// ================================================================
// PHẦN 6: SỰ KIỆN
// ================================================================

function ktGanSuKien() {
  // Bộ lọc
  var chonCd = ktEl("ktLocChuDe");
  Object.keys(KT.CHU_DE).forEach(function (k) { chonCd.add(new Option(KT.CHU_DE[k], k)); });
  ["ktLocCap", "ktLocChuDe", "ktLocSoat", "ktLocHinh", "ktLocBao", "ktSapXep"].forEach(function (id) {
    ktEl(id).addEventListener("change", function () { ktVeLai(true); });
  });
  var henTim = 0;
  ktEl("ktTim").addEventListener("input", function () { clearTimeout(henTim); henTim = setTimeout(function () { ktVeLai(true); }, 250); });
  ktEl("ktBoLoc").addEventListener("click", function () {
    ["ktLocCap", "ktLocChuDe", "ktLocSoat", "ktLocHinh", "ktLocBao"].forEach(function (id) { ktEl(id).value = ""; });
    ktEl("ktTim").value = "";
    ktVeLai(true);
  });

  // Chia trang
  ["ktTrangTren", "ktTrangDuoi"].forEach(function (id) {
    var o = ktEl(id);
    o.querySelector(".ktTruoc").addEventListener("click", function () { KT.trang--; ktVeLai(); ktCuonLenBang(id); });
    o.querySelector(".ktSau").addEventListener("click", function () { KT.trang++; ktVeLai(); ktCuonLenBang(id); });
  });

  // Sửa ô trong bảng
  var bang = ktEl("ktBang");
  bang.addEventListener("input", ktKhiSua);
  bang.addEventListener("change", ktKhiSua);
  bang.addEventListener("click", ktKhiBamNut);

  // Thêm từ, lưu, bỏ thay đổi, tải lại
  ktEl("ktNutThem").addEventListener("click", ktThemTu);
  ktEl("ktNutLuu").addEventListener("click", ktLuu);
  ktEl("ktNutBoDoi").addEventListener("click", function () {
    if (!confirm("Bỏ hết thay đổi chưa lưu, quay về bản đang có trong kho?")) return;
    KT.dong = KT.dong.filter(function (d) { return d.goc; });
    KT.dong.forEach(function (d) { d.t = ktChep(d.goc); d.xoa = false; ktBoAnhMoi(d); });
    ktKiemTatCa(); ktVeLai();
  });
  ktEl("ktNutTaiLai").addEventListener("click", ktTai);

  // Mã GitHub
  ktEl("ktNutLuuMa").addEventListener("click", function () {
    var ma = ktEl("ktONhapMa").value.trim();
    if (!ma) { ktBao("Hãy dán mã truy cập GitHub vào ô trước.", false); return; }
    ktDatMa(ma);
    ktEl("ktONhapMa").value = "";
    ktKiemMa();
  });
  ktEl("ktNutXoaMa").addEventListener("click", function () {
    if (!confirm("Xoá mã truy cập GitHub khỏi máy này? Sau đó máy này không lưu kho từ được nữa.")) return;
    ktDatMa("");
    ktCapNhatMaUI();
    ktBao("Đã xoá mã khỏi máy này.", true);
  });

  // Ảnh: một ô chọn file dùng chung
  ktEl("ktChonAnh").addEventListener("change", ktKhiChonAnh);

  // Excel
  ktEl("ktNutXuat").addEventListener("click", ktXuatExcel);
  ktEl("ktNutNhap").addEventListener("click", function () { ktEl("ktChonExcel").click(); });
  ktEl("ktChonExcel").addEventListener("change", ktNhapExcel);
}

function ktCuonLenBang(id) {
  if (id === "ktTrangDuoi") ktEl("ktTrangTren").scrollIntoView({ block: "start" });
}

function ktKhiSua(su) {
  var o = su.target, truong = o.getAttribute("data-truong");
  if (!truong) return;
  var tr = o.closest("tr[data-id]"), d = tr && ktTimDong(tr.getAttribute("data-id"));
  if (!d) return;
  var gt;
  if (truong === "soat") gt = o.checked;
  else if (truong === "cap") gt = Number(o.value);
  else gt = o.value;
  if (truong === "en") {
    // Từ luôn chữ thường, không khoảng trắng hai đầu (sửa khi rời ô để không nhảy con trỏ)
    if (su.type === "change") { gt = gt.trim().toLowerCase(); o.value = gt; }
  } else if (truong === "vi" || truong === "e" || truong === "ghiChu") {
    if (su.type === "change") { gt = gt.trim(); o.value = gt; }
  }
  if (d.t[truong] === gt && su.type === "input") return;
  d.t[truong] = gt;
  if (truong === "e" && !d.t.hinh && !d.anhMoi) ktGanXemHinh(tr.querySelector(".ktXemHinh"), d);
  clearTimeout(KT.henKiem);
  KT.henKiem = setTimeout(ktCapNhatBao, su.type === "change" ? 0 : 200);
}

function ktKhiBamNut(su) {
  var nut = su.target.closest("button[data-viec]");
  if (!nut) return;
  var tr = nut.closest("tr[data-id]"), d = tr && ktTimDong(tr.getAttribute("data-id"));
  if (!d) return;
  var viec = nut.getAttribute("data-viec");
  if (viec === "xoa") {
    if (!d.goc) { KT.dong = KT.dong.filter(function (x) { return x !== d; }); ktBoAnhMoi(d); }
    else d.xoa = true;
    ktKiemTatCa(); ktVeLai();
  } else if (viec === "hoanTac") {
    d.xoa = false; ktKiemTatCa(); ktVeLai();
  } else if (viec === "taiAnh") {
    d.t.en = d.t.en.trim().toLowerCase();
    if (!/^[a-z]{3,}$/.test(d.t.en)) { ktBao("Điền từ tiếng Anh đúng (chữ thường a-z) trước khi tải hình: tên file hình đặt theo từ.", false); return; }
    KT.dongChonAnh = d;
    ktEl("ktChonAnh").value = "";
    ktEl("ktChonAnh").click();
  } else if (viec === "boAnh") {
    ktBoAnhMoi(d);
    d.t.hinh = "";
    ktKiemTatCa(); ktVeLai();
  }
}

function ktThemTu() {
  var capLoc = Number(ktEl("ktLocCap").value) || 1;
  var cdLoc = ktEl("ktLocChuDe").value;
  var d = ktDongMoi({ en: "", vi: "", e: "", cap: capLoc, cd: (cdLoc && cdLoc !== "_trong") ? cdLoc : "", hinh: "", soat: false, ghiChu: "" }, null);
  KT.dong.push(d);
  // Bỏ bộ lọc có thể giấu dòng mới (tìm, soát, hình, báo)
  ["ktLocSoat", "ktLocHinh", "ktLocBao"].forEach(function (id) { ktEl(id).value = ""; });
  ktEl("ktTim").value = "";
  ktKiemTatCa();
  ktVeLai(true);
  var o = document.querySelector('#ktBang tr[data-id="' + d.id + '"] input[data-truong="en"]');
  if (o) { o.scrollIntoView({ block: "center" }); o.focus(); }
}

// ================================================================
// PHẦN 7: ẢNH
// ================================================================

function ktBoAnhMoi(d) {
  if (d.anhMoi && d.anhMoi.url) { try { URL.revokeObjectURL(d.anhMoi.url); } catch (e) { /* bỏ qua */ } }
  d.anhMoi = null;
}

function ktDocFile(file, kieu) {
  return new Promise(function (xong, hong) {
    var fr = new FileReader();
    fr.onload = function () { xong(fr.result); };
    fr.onerror = function () { hong(fr.error || new Error("không đọc được file")); };
    if (kieu === "url") fr.readAsDataURL(file); else fr.readAsArrayBuffer(file);
  });
}

function ktBlobBase64(blob) {
  return ktDocFile(blob, "url").then(function (u) { return String(u).replace(/^data:[^,]*,/, ""); });
}

/** Ảnh raster: lớn quá thì thu nhỏ còn cạnh dài 512 px, lưu WebP (máy không làm được WebP thì PNG) */
function ktXuLyAnhRaster(file) {
  return new Promise(function (xong, hong) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var w = img.naturalWidth, h = img.naturalHeight;
      var duoiGoc = (file.type === "image/png") ? "png" : (file.type === "image/webp" ? "webp" : "");
      if (duoiGoc && file.size <= KT.ANH_NHE && Math.max(w, h) <= KT.CANH_TOI_DA_ANH) {
        URL.revokeObjectURL(url);
        xong({ blob: file, duoi: duoiGoc });
        return;
      }
      var tl = Math.min(1, KT.CANH_TOI_DA_ANH / Math.max(w, h));
      var cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(w * tl)); cv.height = Math.max(1, Math.round(h * tl));
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      cv.toBlob(function (b) {
        if (b && b.type === "image/webp") { xong({ blob: b, duoi: "webp" }); return; }
        cv.toBlob(function (b2) { if (b2) xong({ blob: b2, duoi: "png" }); else hong(new Error("không chuyển được ảnh")); }, "image/png");
      }, "image/webp", 0.85);
    };
    img.onerror = function () { URL.revokeObjectURL(url); hong(new Error("file không phải ảnh hoặc ảnh hỏng")); };
    img.src = url;
  });
}

function ktKhiChonAnh() {
  var file = ktEl("ktChonAnh").files[0], d = KT.dongChonAnh;
  KT.dongChonAnh = null;
  if (!file || !d) return;
  var ten = file.name.toLowerCase();
  var laSvg = file.type === "image/svg+xml" || /\.svg$/.test(ten);
  var laRaster = /^image\/(png|webp|jpeg|gif)$/.test(file.type) || /\.(png|webp|jpe?g|gif)$/.test(ten);
  if (!laSvg && !laRaster) { ktBao("Chỉ nhận hình SVG, PNG, WebP (hoặc JPG, app tự đổi sang WebP).", false); return; }
  var viec;
  if (laSvg) {
    viec = ktDocFile(file).then(function (buf) {
      var chu = new TextDecoder("utf-8").decode(buf);
      if (!/<svg[\s>]/i.test(chu)) throw new Error("file SVG không có thẻ <svg>");
      if (file.size > KT.ANH_NHE) ktBao("Lưu ý: hình SVG nặng " + Math.round(file.size / 1024) + " KB, nên dưới 200 KB để game tải nhanh.", false);
      return { blob: file, duoi: "svg" };
    });
  } else {
    viec = ktXuLyAnhRaster(file);
  }
  viec.then(function (kq) {
    return ktBlobBase64(kq.blob).then(function (b64) {
      var tenFile = d.t.en + "." + kq.duoi;
      ktBoAnhMoi(d);
      d.anhMoi = { ten: tenFile, b64: b64, url: URL.createObjectURL(kq.blob), kb: Math.max(1, Math.round(kq.blob.size / 1024)) };
      // Thay ảnh cùng tên file đã có -> thêm ?v=<số> để máy của bé không dùng ảnh cũ trong bộ nhớ đệm
      var cu = d.goc ? d.goc.hinh : "";
      var daCo = ktTenFile(cu) === tenFile || ktTenFile(d.t.hinh) === tenFile || (KT.hinhCo && KT.hinhCo.has(tenFile));
      if (daCo) {
        var m = /\?v=(\d+)/.exec(cu || d.t.hinh || "");
        d.t.hinh = tenFile + "?v=" + (m ? Number(m[1]) + 1 : 2);
      } else {
        d.t.hinh = tenFile;
      }
      ktKiemTatCa(); ktVeLai();
      ktBao("Đã chọn hình " + tenFile + " cho \"" + d.t.en + "\" (" + d.anhMoi.kb + " KB). Bấm 💾 Lưu để đưa lên kho.", true);
    });
  }).catch(function (loi) { ktBao("Không dùng được hình này: " + (loi && loi.message || loi), false); });
}

// ================================================================
// PHẦN 8: LƯU VÀO REPO (một commit qua GitHub API)
// ================================================================

/**
 * Áp các thay đổi của bảng lên một bản kho mới đọc từ repo (để không ghi đè việc người khác
 * vừa làm). Trả về { ds: [từ], dongTheoTu: Map(en -> dòng bảng) }.
 */
function ktApThayDoi(dsMoi) {
  var ds = dsMoi.map(function (t) { return ktChuanTu(t); });
  var viTri = new Map();
  ds.forEach(function (t, i) { viTri.set(t.en, i); });
  var boDi = new Set();
  KT.dong.forEach(function (d) {
    var tt = ktTrangThaiDong(d);
    if (!tt) return;
    if (tt === "xoa") { if (viTri.has(d.goc.en)) boDi.add(viTri.get(d.goc.en)); return; }
    var i = d.goc ? viTri.get(d.goc.en) : viTri.get(d.t.en);
    if (i === undefined && d.goc && viTri.has(d.t.en)) i = viTri.get(d.t.en);
    if (i === undefined) { ds.push(ktChep(d.t)); viTri.set(d.t.en, ds.length - 1); return; }
    KT.COT.forEach(function (k) {
      // dòng cũ: chỉ đổi cột mình đã sửa; dòng mới trùng từ đã có: lấy hết cột của mình
      if (!d.goc || d.t[k] !== d.goc[k]) ds[i][k] = d.t[k];
    });
  });
  return ds.filter(function (t, i) { return !boDi.has(i); });
}

function ktLuu() {
  if (KT.dangLuu) return;
  ktKiemTatCa();
  var soLoi = KT.dong.filter(function (d) { return d.kq.loi.length; }).length;
  if (soLoi) {
    ktEl("ktLocBao").value = "loi"; ktVeLai(true);
    ktBao("Còn " + soLoi + " từ bị lỗi (❌). Sửa xong mới lưu được. Bảng đang lọc ra các từ lỗi.", false);
    return;
  }
  if (!ktLayMa()) {
    ktEl("ktKhoiMa").open = true;
    ktEl("ktKhoiMa").scrollIntoView({ block: "start" });
    ktBao("Máy này chưa có mã truy cập GitHub nên chưa lưu được. Nhập mã ở khung 🔑 rồi bấm Lưu lại (các thay đổi vẫn giữ trên trang).", false);
    return;
  }
  var dem = ktSoThayDoi();
  KT.dangLuu = true; ktCapNhatTongKet();
  ktBao("⏳ Đang lưu vào kho trên GitHub…", true);
  ktLuuMotLan(dem, 0).then(function (kq) {
    KT.dangLuu = false;
    ktNapChu(kq.chu);
    KT.nguon = "github"; KT.commitTai = kq.commit; KT.hinhCo = kq.hinhCo;
    // Lọc "từ lỗi" / "từ đã đổi" không còn ý nghĩa sau khi lưu
    if (ktEl("ktLocBao").value === "loi" || ktEl("ktLocBao").value === "doi") ktEl("ktLocBao").value = "";
    ktVeLai();
    ktCapNhatMaUI();
    ktBao("✅ Đã lưu vào kho (" + kq.moTa + "). Khoảng 1 phút nữa game sẽ thấy từ và hình mới.", true);
  }).catch(function (loi) {
    KT.dangLuu = false; ktCapNhatTongKet();
    ktBao("❌ Chưa lưu được: " + (loi && loi.message || loi) + " Các thay đổi vẫn còn trên trang, có thể bấm Lưu lại.", false);
  });
}

function ktLuuMotLan(dem, lanThu) {
  var ban, dsMoi, chuMoi, moTa;
  return ktDocTuGithub().then(function (b) {
    ban = b;
    dsMoi = ktApThayDoi(JSON.parse(b.chu).tu);
    // Kiểm tra lại sau khi áp lên bản mới (bản mới có thể vừa thêm từ trùng)
    var demTu = new Map();
    dsMoi.forEach(function (t) { demTu.set(t.en, (demTu.get(t.en) || 0) + 1); });
    var trung = Array.from(demTu).filter(function (x) { return x[1] > 1; }).map(function (x) { return x[0]; });
    if (trung.length) throw new Error("Sau khi gộp với bản mới trên GitHub thì bị trùng từ: " + trung.slice(0, 5).join(", ") + ". Bấm 🔄 Tải lại rồi sửa lại.");
    var dau = JSON.parse(b.chu);
    chuMoi = ktVanBan(dsMoi, dau, ktNgayGio() + " - Trang quản trị: tab Kho từ (" + (adminTaiKhoan.tenDangNhap || "quản trị") + ")");

    // Hình: file mới tải + file không còn từ nào dùng (chỉ xoá file mà bảng này vừa bỏ)
    var dungSau = new Set(dsMoi.map(function (t) { return ktTenFile(t.hinh); }).filter(Boolean));
    var anh = [];
    KT.dong.forEach(function (d) { if (d.anhMoi && !d.xoa && dungSau.has(d.anhMoi.ten)) anh.push(d.anhMoi); });
    var boFile = new Set();
    KT.dong.forEach(function (d) {
      var cu = d.goc && ktTenFile(d.goc.hinh);
      if (cu && !dungSau.has(cu) && b.hinhCo.has(cu)) boFile.add(cu);
    });
    var phan = [];
    if (dem.moi) phan.push("thêm " + dem.moi);
    if (dem.sua) phan.push("sửa " + dem.sua);
    if (dem.xoa) phan.push("xoá " + dem.xoa);
    if (anh.length) phan.push(anh.length + " hình mới");
    if (boFile.size) phan.push("bỏ " + boFile.size + " hình");
    moTa = phan.join(", ") || "không đổi";

    return Promise.all(anh.map(function (a) {
      return ktGoiGithub("/git/blobs", "POST", { content: a.b64, encoding: "base64" }).then(function (r) {
        return { path: KT.THU_MUC_HINH + a.ten, mode: "100644", type: "blob", sha: r.sha };
      });
    })).then(function (cayAnh) {
      return ktGoiGithub("/git/blobs", "POST", { content: chuMoi, encoding: "utf-8" }).then(function (r) {
        var cay = cayAnh.concat([{ path: KT.DUONG_KHO, mode: "100644", type: "blob", sha: r.sha }]);
        boFile.forEach(function (f) { cay.push({ path: KT.THU_MUC_HINH + f, mode: "100644", type: "blob", sha: null }); });
        return ktGoiGithub("/git/trees", "POST", { base_tree: ban.cay, tree: cay });
      });
    }).then(function (cay) {
      return ktGoiGithub("/git/commits", "POST", {
        message: "Kho từ (trang quản trị): " + moTa + "\n\nLưu từ tab Kho từ vựng của trang quản trị (TC_T03B).",
        tree: cay.sha,
        parents: [ban.commit]
      });
    }).then(function (cm) {
      return ktGoiGithub("/git/refs/heads/" + KT.NHANH, "PATCH", { sha: cm.sha, force: false }).then(function () {
        var hinhCo = new Set(ban.hinhCo);
        anh.forEach(function (a) { hinhCo.add(a.ten); });
        boFile.forEach(function (f) { hinhCo.delete(f); });
        return { chu: chuMoi, commit: cm.sha, hinhCo: hinhCo, moTa: moTa };
      });
    });
  }).catch(function (loi) {
    // Có người vừa ghi vào main giữa chừng -> đọc lại bản mới và thử thêm một lần
    if ((loi.trangThai === 422 || loi.trangThai === 409) && lanThu < 1) return ktLuuMotLan(dem, lanThu + 1);
    throw loi;
  });
}

// ================================================================
// PHẦN 9: MÃ TRUY CẬP: giao diện
// ================================================================

function ktCapNhatMaUI() {
  var coMa = !!ktLayMa();
  ktEl("ktTrangThaiMa").textContent = coMa
    ? "🔑 Máy này đã có mã truy cập GitHub: bấm 💾 Lưu là ghi thẳng vào kho."
    : "🔒 Máy này chưa có mã truy cập GitHub: xem và sửa thử được, nhưng chưa lưu được.";
  ktEl("ktTrangThaiMa").className = "ktTrangThaiMa " + (coMa ? "ktMaCo" : "ktMaChua");
  ktEl("ktNutXoaMa").style.display = coMa ? "" : "none";
  var nguon = ktEl("ktNguon");
  if (KT.nguon === "github") nguon.textContent = "Đang xem bản mới nhất trên GitHub (" + KT.commitTai.slice(0, 7) + ").";
  else if (KT.nguon === "trang") nguon.textContent = "Đang xem bản trên trang web" + (KT.dau && KT.dau.capNhat ? " (cập nhật " + KT.dau.capNhat + ")" : "") + ".";
  else nguon.textContent = "";
  if (!coMa) ktEl("ktKhoiMa").open = true;
}

function ktKiemMa() {
  ktBao("⏳ Đang thử mã với GitHub…", true);
  ktGoiGithub("").then(function (repo) {
    var quyen = repo && repo.permissions;
    if (quyen && quyen.push === false) {
      ktBao("Mã đọc được repo nhưng tài khoản không có quyền ghi.", false);
    } else {
      ktBao("✅ Mã dùng được. Máy này đã nhớ mã; từ giờ bấm 💾 Lưu là ghi vào kho.", true);
    }
    ktEl("ktKhoiMa").open = false;
    // Tải lại từ GitHub để có bản mới nhất (nếu chưa sửa gì)
    if (ktSoThayDoi().tong === 0) ktTai(); else ktCapNhatMaUI();
  }).catch(function (loi) {
    ktBao("Mã chưa dùng được: " + loi.message, false);
    ktCapNhatMaUI();
  });
}

function ktBao(chu, tot) {
  var o = ktEl("ktThongBao");
  o.textContent = chu;
  o.className = "adminThongBao hien " + (tot ? "thanhCong" : "thatBai");
}

// ================================================================
// PHẦN 10: NHẬP / XUẤT EXCEL (SheetJS, tải khi cần)
// ================================================================

var KT_XLSX = [
  "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js",
  "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
];
function ktTaiXlsx() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  var thu = function (i) {
    if (i >= KT_XLSX.length) return Promise.reject(new Error("không tải được thư viện Excel (kiểm tra mạng)"));
    return new Promise(function (xong, hong) {
      var s = document.createElement("script");
      s.src = KT_XLSX[i];
      s.onload = function () { if (window.XLSX) xong(window.XLSX); else hong(new Error("thư viện Excel lỗi")); };
      s.onerror = function () { s.remove(); hong(new Error("không tải được")); };
      document.head.appendChild(s);
    }).catch(function () { return thu(i + 1); });
  };
  return thu(0);
}

var KT_COT_EXCEL = ["Từ tiếng Anh", "Nghĩa tiếng Việt", "Emoji", "Cấp", "Chủ đề", "File hình", "Đã soát", "Ghi chú"];

function ktXuatExcel() {
  ktTaiXlsx().then(function (XLSX) {
    var hang = [KT_COT_EXCEL];
    KT.dong.forEach(function (d) {
      if (d.xoa) return;
      var t = d.t;
      hang.push([t.en, t.vi, t.e, t.cap, KT.CHU_DE[t.cd] || t.cd, t.hinh, t.soat ? "Đạt" : "", t.ghiChu]);
    });
    var ws = XLSX.utils.aoa_to_sheet(hang);
    ws["!cols"] = [{ wch: 16 }, { wch: 26 }, { wch: 8 }, { wch: 6 }, { wch: 18 }, { wch: 18 }, { wch: 9 }, { wch: 30 }];
    ws["!autofilter"] = { ref: "A1:H" + hang.length };
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kho từ");
    var d = new Date(Date.now() + 7 * 3600e3);
    var ngay = d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, "0") + String(d.getUTCDate()).padStart(2, "0");
    XLSX.writeFile(wb, "kho_tu_" + ngay + ".xlsx");
    ktBao("Đã xuất " + (hang.length - 1) + " từ ra file Excel. Sửa trong Excel xong thì bấm 📥 Nhập Excel để đưa vào bảng.", true);
  }).catch(function (loi) { ktBao("Không xuất được Excel: " + loi.message, false); });
}

/** Tìm cột theo tên tiêu đề (đọc được file xuất ở đây và bảng soát bang_tra_soat_tu_vung.xlsx) */
function ktCotExcel(tieuDe) {
  var ban = {};
  tieuDe.forEach(function (x, i) {
    var s = ktBoDau(x);
    if (!s) return;
    var k = null;
    if (/tu tieng anh/.test(s)) k = "en";
    else if (/^nghia/.test(s)) k = "vi";
    else if (/file hinh|ten file/.test(s)) k = "hinh";
    else if (/emoji|hinh hien tai/.test(s)) k = "e";
    else if (/^cap/.test(s)) k = "cap";
    else if (/chu de/.test(s)) k = "cd";
    else if (/soat/.test(s)) k = "soat";
    else if (/ghi chu/.test(s)) k = "ghiChu";
    if (k && ban[k] === undefined) ban[k] = i;
  });
  return ban;
}

function ktChuDeTuChu(s) {
  s = String(s || "").trim();
  if (!s) return "";
  if (KT.CHU_DE[s]) return s;
  var bd = ktBoDau(s);
  var keys = Object.keys(KT.CHU_DE);
  for (var i = 0; i < keys.length; i++) if (ktBoDau(KT.CHU_DE[keys[i]]) === bd) return keys[i];
  return s;  // sai: để phần kiểm tra báo lỗi
}

function ktCapTuDong(en) { var n = en.length; return n <= 3 ? 1 : n <= 5 ? 2 : n <= 7 ? 3 : 4; }

function ktNhapExcel() {
  var file = ktEl("ktChonExcel").files[0];
  ktEl("ktChonExcel").value = "";
  if (!file) return;
  Promise.all([ktTaiXlsx(), ktDocFile(file)]).then(function (x) {
    var XLSX = x[0], wb = XLSX.read(x[1], { type: "array" });
    var dongExcel = [];
    wb.SheetNames.forEach(function (tenTrang) {
      var hang = XLSX.utils.sheet_to_json(wb.Sheets[tenTrang], { header: 1, defval: "", raw: false });
      for (var h = 0; h < Math.min(6, hang.length); h++) {
        var ban = ktCotExcel(hang[h]);
        if (ban.en === undefined || ban.vi === undefined) continue;   // dòng tiêu đề phải có cả cột từ và nghĩa
        for (var r = h + 1; r < hang.length; r++) dongExcel.push({ hang: hang[r], ban: ban });
        break;
      }
    });
    if (!dongExcel.length) throw new Error("không thấy cột \"Từ tiếng Anh\" trong file");

    var theoTu = new Map();
    KT.dong.forEach(function (d) { if (!d.xoa) theoTu.set(d.t.en, d); });
    var soSua = 0, soMoi = 0, soBo = 0, soBoTu = 0, soEmojiHong = 0, daGap = new Set();
    var ap = [];
    dongExcel.forEach(function (x) {
      function lay(k) { return x.ban[k] === undefined ? undefined : String(x.hang[x.ban[k]] === undefined ? "" : x.hang[x.ban[k]]).trim(); }
      var en = (lay("en") || "").toLowerCase();
      if (!en) return;
      if (en.length > 40 || !/^[a-z][a-z' -]*$/.test(en)) { soBo++; return; }   // dòng chữ, không phải một từ
      var gc = lay("ghiChu");
      if (gc && /^vi du\b/.test(ktBoDau(gc))) { soBo++; return; }   // dòng ví dụ của bảng mẫu
      if (daGap.has(en)) { soBo++; return; }
      daGap.add(en);
      var moi = {};
      var vi = lay("vi"); if (vi) moi.vi = vi;
      // Emoji đọc hỏng (vài file ghi emoji dạng &#128049; mà thư viện cũ đọc sai) thì giữ emoji đang có
      var e = lay("e");
      if (e && KT_TACH && !Array.from(KT_TACH.segment(e)).every(function (x) { return !x.segment.trim() || KT_LA_HINH.test(x.segment); })) { soEmojiHong++; e = ""; }
      if (e) moi.e = e;
      var hinh = lay("hinh"); if (hinh) moi.hinh = hinh;
      var cap = lay("cap"); var mc = /[1-4]/.exec(cap || ""); if (mc) moi.cap = Number(mc[0]);
      var cd = lay("cd"); if (cd) moi.cd = ktChuDeTuChu(cd);
      var soat = lay("soat");
      if (soat !== undefined) {
        moi.soat = /^(dat|x|co|true|1|✓|✔)/.test(ktBoDau(soat));
        if (/bo tu/.test(ktBoDau(soat))) soBoTu++;
      }
      if (gc !== undefined && gc) moi.ghiChu = gc;
      var d = theoTu.get(en);
      if (d) {
        var doi = KT.COT.filter(function (k) { return moi[k] !== undefined && moi[k] !== d.t[k]; });
        if (doi.length) { soSua++; ap.push({ d: d, moi: moi, doi: doi }); }
      } else {
        soMoi++;
        ap.push({ d: null, en: en, moi: moi });
      }
    });
    if (!soSua && !soMoi) { ktBao("File Excel không khác gì kho hiện tại (" + daGap.size + " từ). Không có gì để nhập.", true); return; }
    var hoi = "File có " + daGap.size + " từ: sẽ sửa " + soSua + " từ đang có, thêm " + soMoi + " từ mới" +
      (soBo ? ", bỏ qua " + soBo + " dòng ví dụ / trùng / không phải từ" : "") +
      (soEmojiHong ? ", " + soEmojiHong + " ô emoji đọc không được nên giữ emoji cũ" : "") + ".\nTừ không có trong file thì giữ nguyên (không xoá).\nNhập vào bảng?";
    if (!confirm(hoi)) return;
    ap.forEach(function (a) {
      if (a.d) { a.doi.forEach(function (k) { a.d.t[k] = a.moi[k]; }); return; }
      var t = { en: a.en, vi: a.moi.vi || "", e: a.moi.e || "", cap: a.moi.cap || ktCapTuDong(a.en), cd: a.moi.cd || "", hinh: a.moi.hinh || "", soat: !!a.moi.soat, ghiChu: a.moi.ghiChu || "" };
      KT.dong.push(ktDongMoi(t, null));
    });
    ktKiemTatCa();
    ktEl("ktLocBao").value = "doi";
    ktVeLai(true);
    ktBao("Đã nhập vào bảng: sửa " + soSua + ", thêm " + soMoi + " từ (bảng đang lọc các từ đã đổi)." +
      (soBoTu ? " Có " + soBoTu + " từ ghi \"Bỏ từ\" ở cột Soát: chưa xoá, hãy tự bấm 🗑️ nếu đồng ý." : "") +
      " Kiểm tra lại rồi bấm 💾 Lưu.", true);
  }).catch(function (loi) { ktBao("Không đọc được file Excel: " + (loi && loi.message || loi), false); });
}
