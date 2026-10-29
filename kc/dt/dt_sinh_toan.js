// ================================================================
// FILE: dt/dt_sinh_toan.js
// CHỨC NĂNG: BỘ SINH CÂU TOÁN LỚP 1-6 của Đấu Trường Tri Thức (Ke_Hoach_Dau_Truong.md mục 7),
//            bám danh mục chuong_trinh/gdpt_2018/ghi_nho/toan.md (repo_rieng). Không đụng DOM:
//            chạy được trong node (kiểm thử) và trên máy bé.
//            - DANG: mỗi dạng = { ma, lop, chuDe, ten, sinh(r, muc) }; muc = "de" | "vua" | "kho".
//            - sinh trả câu thô { nd, dung, nhieu, lg, hinhChu?, donVi?, am? } -> taoCau() làm thành
//              câu đủ định dạng chung (mục 8 kế hoạch): 4 đáp án KHÁC NHAU, đúng 1 đáp án đúng ở vị trí
//              ngẫu nhiên; đáp án nhiễu là lỗi hay gặp (quên nhớ, nhầm chu vi / diện tích, tính từ trái
//              sang phải...), thiếu thì bù số gần; lớp 1-5 không có số âm.
//            - hinhChu: hình bằng chữ biểu tượng (đếm hình, mặt đồng hồ) để trang vẽ to.
//            - Số viết kiểu Việt Nam: tách nghìn bằng dấu cách hẹp, phần thập phân sau dấu phẩy,
//              dấu trừ "−".
//            Cùng hạt ngẫu nhiên -> cùng câu (mã câu chứa hạt: TOAN<lớp>-<DẠNG>-<mức>-<hạt>).
// BƯỚC: TC_D04A
// NGÀY: 29/10/2026
// ================================================================
(function (goc) {
  "use strict";

  // ---------- Tiện ích ----------
  const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const chon = (r, ds) => ds[Math.floor(r() * ds.length)];
  function tron(r, ds) {
    const a = ds.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const ucln = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const bcnn = (a, b) => a / ucln(a, b) * b;
  const AM = "−", HEP = " ";

  // Số nguyên kiểu Việt Nam: 12 345 (từ 10 000 mới tách, như sách giáo khoa: 1234 vẫn viết liền)
  function so(n) {
    const am = n < 0, s = String(Math.abs(Math.round(n)));
    const t = s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, HEP) : s;
    return (am ? AM : "") + t;
  }
  // Số thập phân từ số nguyên "phần" (vd 245 phần trăm = 2,45), bỏ số 0 thừa ở cuối
  function tp(nguyen, chuSoSauPhay) {
    const m = Math.pow(10, chuSoSauPhay), am = nguyen < 0, x = Math.abs(nguyen);
    let sau = String(x % m).padStart(chuSoSauPhay, "0").replace(/0+$/, "");
    return (am ? AM : "") + so(Math.floor(x / m)) + (sau ? "," + sau : "");
  }
  const ps = (t, m) => t + "/" + m;
  function rutGon(t, m) { const g = ucln(t, m); return [t / g, m / g]; }
  function laMa(n) {
    const bang = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let s = "";
    for (const [g, k] of bang) while (n >= g) { s += k; n -= g; }
    return s;
  }
  const MU = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  const mu = n => String(n).split("").map(c => MU[c]).join("");

  // ---------- Dạng câu ----------
  const DANG = [];
  const them = (lop, ma, chuDe, ten, sinh) => DANG.push({ lop, ma, chuDe, ten, sinh });

  // ===== LỚP 1 =====
  const VAT = [["🍎", "quả táo"], ["🐟", "con cá"], ["⭐", "ngôi sao"], ["🌸", "bông hoa"], ["🐥", "chú gà con"], ["🍌", "quả chuối"], ["🚗", "chiếc ô tô"], ["🎈", "quả bóng bay"]];
  them(1, "DEM", "dem_hinh", "Đếm hình", (r, muc) => {
    const [a, tenA] = chon(r, VAT);
    if (muc !== "kho") {
      const n = muc === "de" ? ri(r, 2, 5) : ri(r, 6, 10);
      return { nd: "Có bao nhiêu " + tenA + "?", hinhChu: a.repeat(n), dung: n, nhieu: [n - 1, n + 1, n + 2, n - 2], lg: "Đếm lần lượt từng " + tenA + ": có " + n + ".", min: 1 };
    }
    let b; do b = chon(r, VAT); while (b[0] === a);
    const n = ri(r, 3, 8), m = ri(r, 2, 6);
    const hinh = tron(r, Array(n).fill(a).concat(Array(m).fill(b[0]))).join("");
    return { nd: "Có bao nhiêu " + tenA + "?", hinhChu: hinh, dung: n, nhieu: [n + m, m, n + 1, n - 1], lg: "Chỉ đếm " + tenA + " " + a + ": có " + n + " (không đếm " + b[1] + ").", min: 1 };
  });
  them(1, "SOSANH", "so_sanh", "So sánh số", (r, muc) => {
    const max = { de: 10, vua: 20, kho: 99 }[muc];
    const lon = r() < 0.5;
    let ds;
    if (muc === "kho") {
      // số dễ nhầm: đảo chữ số, cùng chục
      let a, b; do { a = ri(r, 1, 9); b = ri(r, 1, 9); } while (a === b);
      ds = [a * 10 + b, b * 10 + a, a * 10 + a, b * 10 + b];
    } else {
      const tap = new Set(); while (tap.size < 4) tap.add(ri(r, 0, max));
      ds = [...tap];
    }
    const sx = ds.slice().sort((x, y) => x - y);
    const dung = lon ? sx[3] : sx[0];
    const thuTu = lon ? sx.slice().reverse().join(" > ") : sx.join(" < ");
    return { nd: "Số nào " + (lon ? "LỚN nhất?" : "BÉ nhất?"), dung, nhieu: ds.filter(x => x !== dung), lg: "Xếp thứ tự: " + thuTu + ", nên số " + (lon ? "lớn" : "bé") + " nhất là " + dung + "." };
  });
  them(1, "CT10", "cong_tru_10", "Cộng trừ trong 10", (r, muc) => {
    if (muc === "de") {
      const a = ri(r, 1, 6), b = ri(r, 1, 10 - a), c = a + b;
      return { nd: a + " + " + b + " = ?", dung: c, nhieu: [c - 1, c + 1, Math.abs(a - b), c + 2], lg: a + " thêm " + b + " là " + c + "." };
    }
    if (muc === "vua") {
      const a = ri(r, 4, 10), b = ri(r, 1, a), c = a - b;
      return { nd: a + " " + AM + " " + b + " = ?", dung: c, nhieu: [a + b, c + 1, c - 1, c + 2], lg: a + " bớt " + b + " còn " + c + "." };
    }
    const c = ri(r, 4, 10), a = ri(r, 1, c - 1), b = c - a;
    return { nd: a + " + ? = " + c, dung: b, nhieu: [c, a + c, b + 1, b - 1], lg: "Số cần tìm = " + c + " " + AM + " " + a + " = " + b + "." };
  });
  them(1, "KNHO", "cong_tru_khong_nho", "Cộng trừ không nhớ", (r, muc) => {
    if (muc === "de") { // 1x + y trong 20, không nhớ
      const y0 = ri(r, 0, 7), b = ri(r, 1, 9 - y0), a = 10 + y0, c = a + b;
      return { nd: a + " + " + b + " = ?", dung: c, nhieu: [c - 10, c + 1, c - 1, c + 10], lg: a + " = 10 + " + y0 + "; " + y0 + " + " + b + " = " + (y0 + b) + ", nên " + a + " + " + b + " = " + c + "." };
    }
    if (muc === "vua") {
      const y0 = ri(r, 2, 9), b = ri(r, 1, y0), a = 10 + y0, c = a - b;
      return { nd: a + " " + AM + " " + b + " = ?", dung: c, nhieu: [c - 10, c + 1, c - 1, a + b], lg: y0 + " " + AM + " " + b + " = " + (y0 - b) + ", nên " + a + " " + AM + " " + b + " = " + c + "." };
    }
    // hai chữ số, không nhớ, trong 100
    const cong = r() < 0.5;
    const ca = ri(r, 1, 8), dva = ri(r, 0, 9);
    if (cong) {
      const cb = ri(r, 1, 9 - ca), dvb = ri(r, 0, 9 - dva), a = ca * 10 + dva, b = cb * 10 + dvb, c = a + b;
      return { nd: a + " + " + b + " = ?", dung: c, nhieu: [c + 10, c - 10, c + 1, c - 1], lg: "Cộng hàng đơn vị: " + dva + " + " + dvb + " = " + (dva + dvb) + "; hàng chục: " + ca + " + " + cb + " = " + (ca + cb) + ". Kết quả " + c + "." };
    }
    const ca2 = ri(r, 2, 9), cb = ri(r, 1, ca2 - 1), dvb = ri(r, 0, dva), a = ca2 * 10 + dva, b = cb * 10 + dvb, c = a - b;
    return { nd: a + " " + AM + " " + b + " = ?", dung: c, nhieu: [a + b, c + 10, c - 10, c + 1], lg: "Trừ hàng đơn vị: " + dva + " " + AM + " " + dvb + " = " + (dva - dvb) + "; hàng chục: " + ca2 + " " + AM + " " + cb + " = " + (ca2 - cb) + ". Kết quả " + c + "." };
  });
  them(1, "LIENSAU", "lien_truoc_sau", "Số liền trước, liền sau", (r, muc) => {
    const max = { de: 10, vua: 20, kho: 99 }[muc];
    let n = ri(r, 1, max - 1);
    if (muc === "kho" && r() < 0.6) n = chon(r, [19, 29, 39, 49, 59, 69, 79, 89, 20, 30, 40, 50, 60, 70, 80, 90]);
    const sau = r() < 0.5;
    const dung = sau ? n + 1 : n - 1;
    return { nd: "Số liền " + (sau ? "sau" : "trước") + " của " + n + " là số nào?", dung, nhieu: [sau ? n - 1 : n + 1, n, sau ? n + 2 : n - 2, sau ? n + 10 : n - 10], lg: "Số liền " + (sau ? "sau thì thêm 1" : "trước thì bớt 1") + ": " + n + (sau ? " + 1 = " : " " + AM + " 1 = ") + dung + "." };
  });

  // ===== LỚP 2 =====
  them(2, "CONHO", "cong_tru_co_nho", "Cộng trừ có nhớ trong 100", (r, muc) => {
    if (muc !== "kho") {
      let a, b;
      if (muc === "de") { a = ri(r, 1, 8) * 10 + ri(r, 2, 9); b = ri(r, 10 - (a % 10), 9); }
      else { do { a = ri(r, 11, 79); b = ri(r, 11, 89 - a); } while ((a % 10) + (b % 10) < 10 || a + b > 99); }
      const c = a + b;
      return { nd: a + " + " + b + " = ?", dung: c, nhieu: [c - 10, c + 10, c - 1, c + 1], lg: (a % 10) + " + " + (b % 10) + " = " + ((a % 10) + (b % 10)) + ", viết " + (c % 10) + " nhớ 1 sang hàng chục. Kết quả " + c + "." };
    }
    let a, b;
    do { a = ri(r, 21, 99); b = ri(r, 11, a - 1); } while ((a % 10) >= (b % 10));
    const c = a - b;
    const sai = (Math.floor(a / 10) - Math.floor(b / 10)) * 10 + ((b % 10) - (a % 10)); // lấy số lớn trừ số bé ở hàng đơn vị
    return { nd: a + " " + AM + " " + b + " = ?", dung: c, nhieu: [sai, c + 10, c - 1, c + 1], lg: (a % 10) + " không trừ được " + (b % 10) + ", lấy 1" + (a % 10) + " " + AM + " " + (b % 10) + " = " + (10 + (a % 10) - (b % 10)) + ", nhớ 1 sang hàng chục. Kết quả " + c + "." };
  });
  them(2, "NHAN25", "bang_nhan_2_5", "Bảng nhân chia 2 và 5", (r, muc) => {
    const a = chon(r, [2, 5]), b = ri(r, 1, 10), c = a * b;
    if (muc === "de") return { nd: a + " × " + b + " = ?", dung: c, nhieu: [a + b, c + a, c - a, c + 1], lg: a + " × " + b + " = " + c + " (bảng nhân " + a + ")." };
    if (muc === "vua") return { nd: c + " : " + a + " = ?", dung: b, nhieu: [c - a, b + 1, b - 1, c], lg: "Vì " + a + " × " + b + " = " + c + " nên " + c + " : " + a + " = " + b + "." };
    return { nd: a + " × ? = " + c, dung: b, nhieu: [c - a, b + 1, b - 1, c + a], lg: "Số cần tìm = " + c + " : " + a + " = " + b + "." };
  });
  them(2, "DODAI", "do_dai", "Đổi m, dm, cm", (r, muc) => {
    if (muc === "de") {
      const [nd, dung, nhieu, lg] = chon(r, [
        ["1 m = ? cm", 100, [10, 1000, 1], "1 m = 100 cm."],
        ["1 dm = ? cm", 10, [100, 1, 1000], "1 dm = 10 cm."],
        ["1 m = ? dm", 10, [100, 1, 1000], "1 m = 10 dm."]]);
      return { nd, dung, nhieu, lg };
    }
    if (muc === "vua") {
      const k = ri(r, 2, 9);
      return r() < 0.5
        ? { nd: k + " dm = ? cm", dung: k * 10, nhieu: [k * 100, k, k + 10], lg: "1 dm = 10 cm, nên " + k + " dm = " + k * 10 + " cm." }
        : { nd: k + " m = ? dm", dung: k * 10, nhieu: [k * 100, k, k + 10], lg: "1 m = 10 dm, nên " + k + " m = " + k * 10 + " dm." };
    }
    const a = ri(r, 1, 9), b = ri(r, 1, 9), dv = chon(r, [["m", "dm"], ["dm", "cm"]]);
    return { nd: a + " " + dv[0] + " " + b + " " + dv[1] + " = ? " + dv[1], dung: a * 10 + b, nhieu: [a * 100 + b, a + b, a * 10, (a * 10 + b) * 10], lg: a + " " + dv[0] + " = " + a * 10 + " " + dv[1] + "; " + a * 10 + " + " + b + " = " + (a * 10 + b) + " " + dv[1] + "." };
  });
  // Mặt đồng hồ: 🕐 (U+1F550) .. 🕛 = 1..12 giờ; 🕜 (U+1F55C) .. 🕧 = 1 giờ 30 .. 12 giờ 30
  const dongHo = (h, ruoi) => String.fromCodePoint((ruoi ? 0x1F55C : 0x1F550) + h - 1);
  const gio = (h, ruoi) => h + " giờ" + (ruoi ? " 30 phút" : "");
  const quay = h => ((h - 1 + 12) % 12) + 1;
  them(2, "GIO", "xem_gio", "Xem đồng hồ", (r, muc) => {
    const h = ri(r, 1, 12);
    if (muc === "de") return { nd: "Đồng hồ chỉ mấy giờ?", hinhChu: dongHo(h, false), dung: gio(h), nhieu: [gio(quay(h + 1)), gio(quay(h - 1)), gio(h, true), gio(quay(h + 2))], lg: "Kim dài chỉ số 12, kim ngắn chỉ số " + h + ": " + h + " giờ." };
    if (muc === "vua") return { nd: "Đồng hồ chỉ mấy giờ?", hinhChu: dongHo(h, true), dung: gio(h, true), nhieu: [gio(quay(h + 1), true), gio(h), gio(quay(h + 1)), gio(quay(h - 1), true)], lg: "Kim dài chỉ số 6 là 30 phút; kim ngắn đã qua số " + h + ": " + gio(h, true) + "." };
    const bd = ri(r, 1, 9), them2 = ri(r, 2, 12 - bd), kq = bd + them2;
    return { nd: "Bây giờ là " + bd + " giờ. Sau " + them2 + " giờ nữa là mấy giờ?", hinhChu: dongHo(bd, false), dung: gio(kq), nhieu: [gio(quay(kq + 1)), gio(quay(kq - 1)), gio(them2 === bd ? quay(kq + 2) : them2), gio(kq, true)], lg: bd + " + " + them2 + " = " + kq + ": " + kq + " giờ." };
  });
  them(2, "TIMSO", "tim_thanh_phan", "Tìm số chưa biết", (r, muc) => {
    if (muc === "de") {
      const c = ri(r, 8, 20), b = ri(r, 2, c - 2), a = c - b;
      return { nd: "? + " + b + " = " + c, dung: a, nhieu: [c + b, a + 1, a - 1, c], lg: "Số hạng chưa biết = tổng " + AM + " số hạng kia: " + c + " " + AM + " " + b + " = " + a + "." };
    }
    if (muc === "vua") {
      const c = ri(r, 30, 99), a = ri(r, 11, c - 11), b = c - a;
      return { nd: a + " + ? = " + c, dung: b, nhieu: [c + a, b + 10, b - 10, b + 1], lg: c + " " + AM + " " + a + " = " + b + "." };
    }
    const b = ri(r, 11, 49), c = ri(r, 11, 99 - b), a = b + c;
    return { nd: "? " + AM + " " + b + " = " + c, dung: a, nhieu: [Math.abs(c - b), a + 10, a - 10, a + 1], lg: "Số bị trừ = hiệu + số trừ: " + c + " + " + b + " = " + a + "." };
  });

  // ===== LỚP 3 =====
  them(3, "NHAN", "bang_nhan_chia", "Bảng nhân chia 2-9", (r, muc) => {
    const a = ri(r, 3, 9), b = ri(r, 2, 10), c = a * b;
    if (muc === "de") return { nd: a + " × " + b + " = ?", dung: c, nhieu: [c + a, c - a, a + b, c + 1], lg: a + " × " + b + " = " + c + "." };
    if (muc === "vua") return { nd: c + " : " + a + " = ?", dung: b, nhieu: [b + 1, b - 1, c - a, a], lg: "Vì " + a + " × " + b + " = " + c + " nên " + c + " : " + a + " = " + b + "." };
    return { nd: "? × " + a + " = " + c, dung: b, nhieu: [b + 1, b - 1, c + a, c - a], lg: "Thừa số chưa biết = tích : thừa số kia: " + c + " : " + a + " = " + b + "." };
  });
  them(3, "CHIADU", "chia_co_du", "Chia có dư", (r, muc) => {
    const b = muc === "de" ? ri(r, 2, 5) : ri(r, 6, 9);
    const q = muc === "kho" ? ri(r, 12, 99) : ri(r, 2, 9);
    const du = ri(r, 1, b - 1), a = b * q + du;
    const vb = (x, y) => x + " (dư " + y + ")";
    const nhieu = [vb(q, du + 1 < b ? du + 1 : du - 1 || 1), vb(q - 1, du + b), vb(q + 1, du), vb(q, 0)];
    return { nd: a + " : " + b + " = ?", dung: vb(q, du), nhieu, lg: b + " × " + q + " = " + b * q + "; " + a + " " + AM + " " + b * q + " = " + du + " (số dư " + du + " bé hơn số chia " + b + ")." };
  });
  // Viết La Mã sai hay gặp: viết 4 nét I thay IV / IX
  const laMaSai = n => laMa(n).replace("IX", "VIIII").replace("IV", "IIII");
  function sinhLaMa(r, lo, hi, viet, chiSo) {
    const n = chiSo ? chon(r, chiSo) : ri(r, lo, hi);
    if (!viet) return { nd: "Số La Mã " + laMa(n) + " là số mấy?", dung: n, nhieu: [n + 1, n - 1, n + 2, n - 2, n + 10, n - 10], lg: laMa(n) + " = " + n + "." };
    const nhieu = [laMa(n + 1), laMa(n - 1), laMa(n + 2), laMa(n + 10)];
    if (laMaSai(n) !== laMa(n)) nhieu.unshift(laMaSai(n));
    return { nd: "Số " + n + " viết bằng chữ số La Mã là?", dung: laMa(n), nhieu, lg: n + " = " + laMa(n) + "." };
  }
  them(3, "LAMA", "la_ma", "Chữ số La Mã 1-20", (r, muc) => muc === "de" ? sinhLaMa(r, 1, 10, false) : muc === "vua" ? sinhLaMa(r, 11, 20, false) : sinhLaMa(r, 4, 20, true));
  them(3, "PHANN", "mot_phan_n", "Một phần mấy của một số", (r, muc) => {
    const n = muc === "de" ? 2 : muc === "vua" ? ri(r, 3, 5) : ri(r, 6, 9);
    const k = muc === "kho" ? ri(r, 3, 12) : ri(r, 2, 9), N = n * k;
    return { nd: "1/" + n + " của " + N + " là bao nhiêu?", dung: k, nhieu: [N * n, N - n, k + 1, N + n, k - 1], lg: "Lấy " + N + " : " + n + " = " + k + "." };
  });
  them(3, "CVDT", "chu_vi_dien_tich", "Chu vi, diện tích", (r, muc) => {
    if (muc === "de") {
      const a = ri(r, 2, 15);
      return { nd: "Hình vuông cạnh " + a + " cm. Chu vi bằng bao nhiêu?", donVi: " cm", dung: a * 4, nhieu: [a * a, a * 2, a + 4, a * 4 + 4], lg: "Chu vi hình vuông = cạnh × 4 = " + a + " × 4 = " + a * 4 + " cm." };
    }
    let a = ri(r, 4, 15), b; do b = ri(r, 2, a - 1); while (2 * (a + b) === a * b);
    if (muc === "vua") return { nd: "Hình chữ nhật dài " + a + " cm, rộng " + b + " cm. Chu vi bằng bao nhiêu?", donVi: " cm", dung: 2 * (a + b), nhieu: [a + b, a * b, 2 * a + b, 2 * (a + b) + 2], lg: "Chu vi = (dài + rộng) × 2 = (" + a + " + " + b + ") × 2 = " + 2 * (a + b) + " cm." };
    return { nd: "Hình chữ nhật dài " + a + " cm, rộng " + b + " cm. Diện tích bằng bao nhiêu?", donVi: " cm²", dung: a * b, nhieu: [2 * (a + b), a + b, a * b + a, a * b - b], lg: "Diện tích = dài × rộng = " + a + " × " + b + " = " + a * b + " cm²." };
  });

  // ===== LỚP 4 =====
  them(4, "LAMTRON", "lam_tron", "Làm tròn số", (r, muc) => {
    const [p, ten] = muc === "de" ? [100, "trăm"] : muc === "vua" ? [1000, "nghìn"] : chon(r, [[10000, "chục nghìn"], [100000, "trăm nghìn"]]);
    let N; do N = ri(r, p * 2, p * 99); while (N % p === 0 || N % (p / 10) === 0);
    const duoi = Math.floor(N / p) * p, tren = duoi + p, dung = (N - duoi) * 2 >= p ? tren : duoi, khac = dung === tren ? duoi : tren;
    const sai2 = Math.round(N / (p / 10)) * (p / 10);
    return { nd: "Làm tròn " + so(N) + " đến hàng " + ten + " được số nào?", dung, nhieu: [khac, sai2, Math.round(N / (p * 10)) * p * 10, dung + p], lg: "Chữ số hàng sau hàng " + ten + " là " + Math.floor((N % p) / (p / 10)) + (dung === tren ? " (≥ 5) nên làm tròn lên: " : " (< 5) nên làm tròn xuống: ") + so(dung) + "." };
  });
  them(4, "NHAN10", "nhan_chia_10", "Nhân chia với 10, 100, 1000", (r, muc) => {
    const k = muc === "de" ? 10 : chon(r, [100, 1000]), soKhong = String(k).length - 1;
    if (muc !== "kho") {
      const a = ri(r, 12, 999);
      return { nd: so(a) + " × " + so(k) + " = ?", dung: a * k, nhieu: [a * k * 10, a * k * 100, a + k, a], lg: "Nhân với " + so(k) + " thì viết thêm " + soKhong + " chữ số 0: " + so(a * k) + "." };
    }
    const a = ri(r, 12, 999), N = a * k;
    return { nd: so(N) + " : " + so(k) + " = ?", dung: a, nhieu: [a * 10, k === 1000 ? a * 100 : a * 1000, N - k, a + 1], lg: "Chia cho " + so(k) + " thì bỏ bớt " + soKhong + " chữ số 0 ở cuối: " + so(a) + "." };
  });
  them(4, "TBC", "trung_binh_cong", "Trung bình cộng", (r, muc) => {
    const n = { de: 2, vua: 3, kho: 4 }[muc];
    let ds, tong;
    do { ds = Array.from({ length: n }, () => ri(r, 10, muc === "kho" ? 120 : 60)); tong = ds.reduce((a, b) => a + b, 0); } while (tong % n !== 0);
    const tb = tong / n;
    return { nd: "Trung bình cộng của " + ds.join("; ") + " là bao nhiêu?", dung: tb, nhieu: [tong, tb + 1, tb - 1, tb + n, Math.round(tong / (n + 1))], lg: "Tổng " + ds.join(" + ") + " = " + tong + "; " + tong + " : " + n + " = " + tb + "." };
  });
  them(4, "PHANSO", "phan_so", "Phân số", (r, muc) => {
    if (muc === "de") {
      let t, m; do { t = ri(r, 1, 8); m = ri(r, t + 1, 9); } while (ucln(t, m) !== 1);
      const k = ri(r, 2, 5), T = t * k, M = m * k;
      // nhiễu: đảo tử / mẫu, chỉ chia tử quên chia mẫu, lệch 1 (không đưa phân số bằng nhau chưa tối giản)
      const nhieu = [ps(m, t), ps(t, M), ps(t + 1, m), ps(t, m + 1)];
      return { nd: "Rút gọn phân số " + ps(T, M) + " được phân số tối giản nào?", dung: ps(t, m), nhieu, lg: "Chia cả tử và mẫu cho " + k + ": " + T + " : " + k + " = " + t + "; " + M + " : " + k + " = " + m + ". Được " + ps(t, m) + "." };
    }
    if (muc === "vua") {
      const m = ri(r, 5, 12), lon = r() < 0.5, tap = new Set();
      while (tap.size < 4) tap.add(ri(r, 1, m - 1));
      const tus = [...tap], tt = lon ? Math.max(...tus) : Math.min(...tus);
      return { nd: "Phân số nào " + (lon ? "LỚN nhất?" : "BÉ nhất?"), dung: ps(tt, m), nhieu: tus.filter(x => x !== tt).map(x => ps(x, m)), lg: "Cùng mẫu số " + m + ": phân số nào có tử số " + (lon ? "lớn" : "bé") + " hơn thì " + (lon ? "lớn" : "bé") + " hơn. Tử số " + (lon ? "lớn" : "bé") + " nhất là " + tt + ": " + ps(tt, m) + "." };
    }
    const cong = r() < 0.5;
    let m, a, b, kq;
    do { m = ri(r, 5, 13); a = ri(r, 1, m - 2); b = ri(r, 1, m - 1 - a); kq = cong ? a + b : a; if (!cong) { a = a + b; kq = a - b; } } while (kq < 1 || ucln(kq, m) !== 1);
    const nd = ps(a, m) + (cong ? " + " : " " + AM + " ") + ps(b, m) + " = ?";
    return { nd, dung: ps(kq, m), nhieu: [cong ? ps(kq, 2 * m) : ps(a + b, m), ps(kq + 1, m), cong ? ps(a * b, m) : ps(kq > 1 ? kq - 1 : kq + 2, m), ps(kq, m + 1)], lg: "Cùng mẫu số: " + (cong ? "cộng" : "trừ") + " hai tử số, giữ nguyên mẫu số: " + ps(kq, m) + "." };
  });
  them(4, "KHOILUONG", "khoi_luong", "Đổi yến, tạ, tấn", (r, muc) => {
    const DV = [["yến", 10], ["tạ", 100], ["tấn", 1000]];
    if (muc !== "kho") {
      const [ten, g] = muc === "de" ? DV[0] : chon(r, DV.slice(1)), k = ri(r, 2, 9);
      const khac = DV.map(d => d[1]).filter(x => x !== g);
      return { nd: k + " " + ten + " = ? kg", dung: k * g, nhieu: [k * khac[0], k * khac[1], k + g, k * g * 10], lg: "1 " + ten + " = " + so(g) + " kg, nên " + k + " " + ten + " = " + so(k * g) + " kg." };
    }
    const a = ri(r, 1, 9), b = ri(r, 1, 9);
    return r() < 0.5
      ? { nd: a + " tấn " + b + " tạ = ? kg", dung: a * 1000 + b * 100, nhieu: [a * 1000 + b * 10, a * 1000 + b, a * 100 + b * 10, a * 10000 + b * 100], lg: a + " tấn = " + so(a * 1000) + " kg; " + b + " tạ = " + b * 100 + " kg; cộng lại " + so(a * 1000 + b * 100) + " kg." }
      : { nd: a + " tạ " + b + " kg = ? kg", dung: a * 100 + b, nhieu: [a * 10 + b, a * 1000 + b, a * 100 + b * 10, a + b], lg: a + " tạ = " + a * 100 + " kg; thêm " + b + " kg là " + (a * 100 + b) + " kg." };
  });

  // ===== LỚP 5 ===== (số thập phân tính bằng số nguyên phần trăm để không sai số)
  them(5, "THAPPHAN", "so_thap_phan", "Số thập phân", (r, muc) => {
    if (muc === "de") {
      const nguyen = ri(r, 1, 9), x = ri(r, 1, 9), y = ri(r, 1, 9);
      const ds = [nguyen * 100 + x * 10, nguyen * 100 + y * 10 + x, nguyen * 100 + x * 10 + y, nguyen * 100 + y];
      const tap = [...new Set(ds)]; if (tap.length < 4) return null;
      const lon = r() < 0.5, dung = lon ? Math.max(...tap) : Math.min(...tap);
      return { nd: "Số nào " + (lon ? "LỚN nhất?" : "BÉ nhất?"), dung: tp(dung, 2), nhieu: tap.filter(v => v !== dung).map(v => tp(v, 2)), lg: "So sánh từng hàng: phần nguyên bằng nhau, xét hàng phần mười rồi phần trăm. Số " + (lon ? "lớn" : "bé") + " nhất là " + tp(dung, 2) + "." };
    }
    if (muc === "vua") {
      const a = ri(r, 11, 99) * 10, b = ri(r, 101, 999); // a có 1 chữ số thập phân, b có 2
      const cong = r() < 0.6 || a <= b;
      const kq = cong ? a + b : a - b;
      const lech = Math.abs(cong ? a / 10 + b : a / 10 - b); // đặt thẳng hàng chữ số cuối thay vì dấu phẩy: 3,7 + 2,45 = 2,82
      return { nd: tp(a, 2) + (cong ? " + " : " " + AM + " ") + tp(b, 2) + " = ?", dung: tp(kq, 2), nhieu: [tp(lech, 2), tp(kq + 10, 2), tp(kq - 10, 2), tp(kq + 100, 2)], lg: "Đặt các dấu phẩy thẳng cột rồi " + (cong ? "cộng" : "trừ") + " như số tự nhiên: " + tp(kq, 2) + "." };
    }
    const a = ri(r, 11, 99), k = ri(r, 2, 9), kq = a * k; // a phần mười × k
    return { nd: tp(a, 1) + " × " + k + " = ?", dung: tp(kq, 1), nhieu: [tp(kq, 2), String(kq), tp(kq + k, 1), tp(a + k * 10, 1)], lg: a + " × " + k + " = " + kq + "; thừa số có 1 chữ số ở phần thập phân nên tách 1 chữ số: " + tp(kq, 1) + "." };
  });
  them(5, "PHANTRAM", "phan_tram", "Tỉ số phần trăm", (r, muc) => {
    if (muc !== "kho") {
      const p = muc === "de" ? chon(r, [10, 50]) : chon(r, [20, 25, 75, 30, 40]);
      const N = ri(r, 2, 20) * (100 / ucln(p, 100));
      const kq = N * p / 100;
      return { nd: p + "% của " + N + " là bao nhiêu?", dung: kq, nhieu: [N * p, N - p, kq * 2, kq + 10, Math.round(N / p)], lg: N + " × " + p + " : 100 = " + kq + "." };
    }
    const m = chon(r, [4, 5, 10, 20, 25, 50]), t = ri(r, 1, m - 1), k = ri(r, 1, 6);
    const a = t * k, b = m * k, pt = t * 100 / m;
    return { nd: "Tỉ số phần trăm của " + a + " và " + b + " là bao nhiêu?", dung: pt + "%", nhieu: [Math.round(b * 100 / a) + "%", (b - a) + "%", (100 - pt) + "%", (pt + 10) + "%"], lg: a + " : " + b + " = " + tp(pt, 2) + " = " + pt + "%." };
  });
  them(5, "DTHINH", "dien_tich_hinh", "Diện tích tam giác, hình thang, hình tròn", (r, muc) => {
    if (muc === "de") {
      let a, h; do { a = ri(r, 3, 20); h = ri(r, 2, 15); } while ((a * h) % 2);
      return { nd: "Tam giác có đáy " + a + " cm, chiều cao " + h + " cm. Diện tích bằng bao nhiêu?", donVi: " cm²", dung: a * h / 2, nhieu: [a * h, a + h, (a + h) * 2, a * h / 2 + h], lg: "Diện tích tam giác = đáy × cao : 2 = " + a + " × " + h + " : 2 = " + a * h / 2 + " cm²." };
    }
    if (muc === "vua") {
      let a, b, h; do { a = ri(r, 6, 20); b = ri(r, 2, a - 1); h = ri(r, 2, 12); } while (((a + b) * h) % 2);
      const kq = (a + b) * h / 2;
      return { nd: "Hình thang có hai đáy " + a + " cm và " + b + " cm, chiều cao " + h + " cm. Diện tích bằng bao nhiêu?", donVi: " cm²", dung: kq, nhieu: [(a + b) * h, a * b * h / 2, (a + b + h) * 2, kq + h], lg: "Diện tích hình thang = (đáy lớn + đáy bé) × cao : 2 = (" + a + " + " + b + ") × " + h + " : 2 = " + kq + " cm²." };
    }
    const R = ri(r, 2, 10), kq = R * R * 314; // phần trăm
    return { nd: "Hình tròn bán kính " + R + " cm. Diện tích bằng bao nhiêu? (π lấy 3,14)", dung: tp(kq, 2) + " cm²", nhieu: [tp(R * 2 * 314, 2) + " cm²", tp(R * 314, 2) + " cm²", tp(R * R * 4 * 314, 2) + " cm²", tp(kq + 314, 2) + " cm²"], lg: "Diện tích = r × r × 3,14 = " + R + " × " + R + " × 3,14 = " + tp(kq, 2) + " cm²." };
  });
  them(5, "VANTOC", "van_toc", "Vận tốc, quãng đường, thời gian", (r, muc) => {
    const v = ri(r, 3, 12) * 5, t = ri(r, 2, 6), s = v * t;
    const xe = chon(r, ["Một ô tô", "Một xe máy", "Một đoàn tàu"]);
    if (muc === "de") return { nd: xe + " đi mỗi giờ " + v + " km. Đi trong " + t + " giờ được bao nhiêu ki-lô-mét?", donVi: " km", dung: s, nhieu: [v + t, s + v, s - v, v * (t + 1) + 5], lg: "Quãng đường = vận tốc × thời gian = " + v + " × " + t + " = " + s + " km." };
    if (muc === "vua") return { nd: xe + " đi " + s + " km hết " + t + " giờ. Vận tốc là bao nhiêu?", donVi: " km/giờ", dung: v, nhieu: [s * t, s - t, v + 5, v - 5], lg: "Vận tốc = quãng đường : thời gian = " + s + " : " + t + " = " + v + " km/giờ." };
    return { nd: xe + " đi " + s + " km với vận tốc " + v + " km/giờ. Hết bao nhiêu giờ?", donVi: " giờ", dung: t, nhieu: [t + 1, t - 1 || t + 2, t + 2, s - v], lg: "Thời gian = quãng đường : vận tốc = " + s + " : " + v + " = " + t + " giờ." };
  });

  // ===== LỚP 6 ===== (được có số âm)
  them(6, "LUYTHUA", "luy_thua", "Lũy thừa", (r, muc) => {
    if (muc === "de") {
      const [a, n] = chon(r, [[2, 3], [3, 2], [5, 2], [10, 3], [2, 4], [4, 2], [10, 2], [6, 2], [3, 3]]);
      const kq = Math.pow(a, n);
      return { nd: a + mu(n) + " = ?", dung: kq, nhieu: [a * n, a + n, Math.pow(n, a), kq + a], lg: a + mu(n) + " = " + Array(n).fill(a).join(" × ") + " = " + kq + "." };
    }
    if (muc === "vua") {
      const [a, n] = chon(r, [[2, 5], [3, 4], [5, 3], [2, 6], [4, 3], [3, 5], [10, 5], [7, 2], [9, 2]]);
      const kq = Math.pow(a, n);
      return { nd: a + mu(n) + " = ?", dung: kq, nhieu: [a * n, Math.pow(a, n - 1), Math.pow(a, n + 1), Math.pow(n, a) === kq ? kq + 1 : Math.pow(n, a)], lg: a + mu(n) + " = " + Array(n).fill(a).join(" × ") + " = " + so(kq) + "." };
    }
    const a = chon(r, [2, 3, 5, 7, 10, "a"]), m = ri(r, 2, 9), n = ri(r, 2, 9), nhan = r() < 0.5;
    if (nhan) return { nd: a + mu(m) + " · " + a + mu(n) + " = " + a + "^?", dung: m + n, nhieu: [m * n, Math.abs(m - n) || m + n + 1, m + n + 1, m + n - 1], lg: "Nhân hai lũy thừa cùng cơ số: giữ cơ số, CỘNG số mũ: " + m + " + " + n + " = " + (m + n) + "." };
    const M = m + n;
    return { nd: a + mu(M) + " : " + a + mu(n) + " = " + a + "^?", dung: m, nhieu: [M + n, Math.round(M / n) === m ? m + 2 : Math.round(M / n), m + 1, m - 1 || m + 3], lg: "Chia hai lũy thừa cùng cơ số: giữ cơ số, TRỪ số mũ: " + M + " " + AM + " " + n + " = " + m + "." };
  });
  them(6, "THUTU", "thu_tu_phep_tinh", "Thứ tự thực hiện phép tính", (r, muc) => {
    if (muc === "de") {
      const a = ri(r, 2, 20), b = ri(r, 2, 9), c = ri(r, 2, 9), kq = a + b * c;
      return { nd: a + " + " + b + " × " + c + " = ?", dung: kq, nhieu: [(a + b) * c, kq + 1, a * b + c, kq - 1], lg: "Nhân trước, cộng sau: " + b + " × " + c + " = " + b * c + "; " + a + " + " + b * c + " = " + kq + "." };
    }
    if (muc === "vua") {
      const a = ri(r, 2, 9), b = ri(r, 2, 9), c = ri(r, 2, 9), d = ri(r, 1, 9), kq = a * (b + c) - d;
      return { nd: a + " × (" + b + " + " + c + ") " + AM + " " + d + " = ?", dung: kq, nhieu: [a * b + c - d, a * (b + c - d), kq + d * 2, kq + 1], lg: "Trong ngoặc trước: " + b + " + " + c + " = " + (b + c) + "; rồi " + a + " × " + (b + c) + " = " + a * (b + c) + "; " + a * (b + c) + " " + AM + " " + d + " = " + kq + "." };
    }
    const a = ri(r, 2, 6), b = ri(r, 2, 5), c = ri(r, 1, Math.min(30, a * b * b - 1)), kq = a * b * b - c;
    return { nd: a + " × " + b + "² " + AM + " " + c + " = ?", dung: kq, nhieu: [(a * b) * (a * b) - c, a * b * 2 - c, kq + c * 2, kq + 1], lg: "Lũy thừa trước: " + b + "² = " + b * b + "; rồi nhân: " + a + " × " + b * b + " = " + a * b * b + "; cuối cùng trừ: " + so(kq) + "." };
  });
  them(6, "CHIAHET", "chia_het", "Dấu hiệu chia hết", (r, muc) => {
    const [d, ten, giai] = muc === "de" ? chon(r, [[2, "2", "chữ số tận cùng là 0, 2, 4, 6, 8"], [5, "5", "chữ số tận cùng là 0 hoặc 5"]])
      : muc === "vua" ? chon(r, [[3, "3", "tổng các chữ số chia hết cho 3"], [9, "9", "tổng các chữ số chia hết cho 9"]])
        : [30, "cả 2, 3 và 5", "tận cùng là 0 và tổng các chữ số chia hết cho 3"];
    const lo = muc === "de" ? 10 : 100, hi = muc === "de" ? 999 : 9999;
    let dung; do dung = ri(r, lo, hi); while (dung % d);
    // nhiễu: số gần đó KHÔNG chia hết; "cả 2, 3, 5" thì nhiễu chia hết 2 trong 3 số (dễ nhầm)
    const sai = new Set();
    for (let lan = 0; sai.size < 3 && lan < 500; lan++) {
      const x = muc === "kho" ? ri(r, lo, hi) : dung + ri(r, -12, 12);
      const gan = muc !== "kho" || x % 15 === 0 || x % 10 === 0 || x % 6 === 0;
      if (x >= lo && x % d && gan) sai.add(x);
    }
    return { nd: "Số nào chia hết cho " + ten + "?", dung, nhieu: [...sai], lg: "Số chia hết cho " + ten + " khi " + giai + ": " + so(dung) + "." };
  });
  them(6, "UCBC", "ucln_bcnn", "ƯCLN và BCNN", (r, muc) => {
    if (muc === "de") {
      let a, b; do { const g = ri(r, 2, 9); a = g * ri(r, 1, 6); b = g * ri(r, 1, 6); } while (a === b || ucln(a, b) < 2);
      const g = ucln(a, b);
      return { nd: "ƯCLN(" + a + ", " + b + ") = ?", dung: g, nhieu: [bcnn(a, b), Math.min(a, b) === g ? g * 2 : Math.min(a, b), a * b, g + 1], lg: "Số lớn nhất mà cả " + a + " và " + b + " đều chia hết: " + g + "." };
    }
    if (muc === "vua") {
      let a, b; do { a = ri(r, 3, 15); b = ri(r, 3, 15); } while (a === b || ucln(a, b) === Math.min(a, b));
      const m = bcnn(a, b);
      return { nd: "BCNN(" + a + ", " + b + ") = ?", dung: m, nhieu: [a * b === m ? m * 2 : a * b, ucln(a, b), m + Math.min(a, b), Math.max(a, b)], lg: "Số nhỏ nhất (khác 0) chia hết cho cả " + a + " và " + b + ": " + m + "." };
    }
    let a, b, c; do { const g = ri(r, 2, 12); a = g * ri(r, 2, 8); b = g * ri(r, 2, 8); c = g * ri(r, 2, 8); } while (new Set([a, b, c]).size < 3);
    const g = ucln(ucln(a, b), c);
    return { nd: "ƯCLN(" + a + ", " + b + ", " + c + ") = ?", dung: g, nhieu: [ucln(a, b) === g ? g * 2 : ucln(a, b), g + 1, g > 2 ? g - 1 : g * 3, Math.min(a, b, c)], lg: "Phân tích ra thừa số nguyên tố, lấy thừa số chung với số mũ nhỏ nhất: " + g + "." };
  });
  them(6, "SONGUYEN", "so_nguyen", "Số nguyên", (r, muc) => {
    const v = n => n < 0 ? "(" + so(n) + ")" : so(n);
    if (muc === "de") {
      const a = -ri(r, 1, 15), b = ri(r, 1, 15), kq = a + b;
      return { nd: v(a) + " + " + b + " = ?", dung: kq, am: true, nhieu: [-kq, a - b, b - a === kq ? kq + 1 : b - a, kq + 2], lg: "Cộng hai số khác dấu: lấy " + Math.max(-a, b) + " " + AM + " " + Math.min(-a, b) + " = " + Math.abs(kq) + ", dấu của số có giá trị tuyệt đối lớn hơn: " + so(kq) + "." };
    }
    if (muc === "vua") {
      const a = ri(r, -15, 10), b = a >= 0 ? ri(r, a + 1, a + 15) : ri(r, 1, 20), kq = a - b; // kết quả luôn âm
      return { nd: v(a) + " " + AM + " " + b + " = ?", dung: kq, am: true, nhieu: [-kq, a + b, kq + 2, kq - 2], lg: "Trừ " + b + " là cộng với " + so(-b) + ": " + so(a) + " + " + v(-b) + " = " + so(kq) + "." };
    }
    const a = ri(r, 2, 12) * chon(r, [-1, 1]), b = ri(r, 2, 9) * (a > 0 ? -1 : chon(r, [-1, 1]));
    if (r() < 0.5) return { nd: v(a) + " × " + v(b) + " = ?", dung: a * b, am: true, nhieu: [-a * b, a + b, -(a + b), a * b + (a * b > 0 ? 1 : -1)], lg: "Nhân hai số " + (a * b > 0 ? "cùng dấu được số dương" : "khác dấu được số âm") + ": " + so(a * b) + "." };
    const N = a * b;
    return { nd: v(N) + " : " + v(a) + " = ?", dung: b, am: true, nhieu: [-b, N - a, b + 1, b - 1], lg: "Chia hai số " + (b > 0 ? "cùng dấu được số dương" : "khác dấu được số âm") + ": " + so(b) + "." };
  });
  them(6, "LAMA30", "la_ma", "Chữ số La Mã 1-30", (r, muc) => muc === "de" ? sinhLaMa(r, 21, 30, false) : muc === "vua" ? sinhLaMa(r, 21, 30, true) : sinhLaMa(r, 0, 0, true, [14, 19, 24, 29, 9, 4]));
  them(6, "PSTP", "phan_so_thap_phan", "Phân số và số thập phân", (r, muc) => {
    if (muc === "de") {
      const [x, t, m] = chon(r, [[50, 1, 2], [25, 1, 4], [75, 3, 4], [20, 1, 5], [40, 2, 5], [60, 3, 5], [80, 4, 5], [10, 1, 10], [30, 3, 10]]);
      return { nd: tp(x, 2) + " viết thành phân số tối giản là?", dung: ps(t, m), nhieu: [ps(x, 10), ps(m, t), ps(t + 1, m), ps(t, m + 1)], lg: tp(x, 2) + " = " + ps(x, 100) + " = " + ps(t, m) + "." };
    }
    if (muc === "vua") {
      let a, b, c, d; do { b = ri(r, 2, 6); d = ri(r, 2, 6); a = ri(r, 1, b - 1); c = ri(r, 1, d - 1); } while (b === d || ucln(a, b) > 1 || ucln(c, d) > 1);
      const [t, m] = rutGon(a * d + c * b, b * d);
      return { nd: ps(a, b) + " + " + ps(c, d) + " = ?", dung: ps(t, m), nhieu: [ps(a + c, b + d), ps(a + c, b * d), ps(t + 1, m), ps(a * c, b * d)], lg: "Quy đồng mẫu số " + b * d + ": " + ps(a * d, b * d) + " + " + ps(c * b, b * d) + " = " + ps(a * d + c * b, b * d) + (m !== b * d ? " = " + ps(t, m) : "") + "." };
    }
    let t, m; do { m = ri(r, 3, 9); t = ri(r, 1, m - 1); } while (ucln(t, m) !== 1);
    const N = m * ri(r, 2, 12), kq = N / m * t;
    return { nd: ps(t, m) + " của " + N + " là bao nhiêu?", dung: kq, nhieu: [N * t, N / m, N * m / t === kq ? kq + 1 : Math.round(N * m / t), kq + t], lg: N + " × " + ps(t, m) + " = " + N + " : " + m + " × " + t + " = " + kq + "." };
  });

  // ---------- Làm câu ----------
  // Ra 4 đáp án khác nhau (chuỗi), đúng 1 đáp án đúng. Trả null khi không đủ đáp án (dạng sinh lại).
  function phuongAn(tho, lop, r) {
    const dv = tho.donVi || "", choAm = tho.am || lop >= 6, min = tho.min != null ? tho.min : 0;
    const laSo = typeof tho.dung === "number";
    const hien = x => typeof x === "number" ? so(x) + dv : x;
    // khóa so giá trị: 2/10 và 1/5 là một; chuỗi khác giữ nguyên
    const khoa = s => { const m = /^(\d+)\/(\d+)$/.exec(s); if (!m) return s; const g = ucln(+m[1], +m[2]) || 1; return (+m[1] / g) + "/" + (+m[2] / g); };
    const hopLe = x => x != null && (typeof x === "number" ? Number.isInteger(x) && (choAm || x >= min) : (choAm || x.indexOf(AM) < 0));
    const dung = hien(tho.dung);
    const tap = [], daCo = [khoa(dung)];
    const nhan = x => { if (!hopLe(x)) return; const s = hien(x), k = khoa(s); if (daCo.indexOf(k) < 0) { daCo.push(k); tap.push(s); } };
    tho.nhieu.forEach(nhan);
    if (laSo) for (let k = 1; tap.length < 3 && k < 40; k++) nhan(tho.dung + (k % 2 ? 1 : -1) * Math.ceil(k / 2));
    if (tap.length < 3) return null;
    const nhieu = tron(r, tap.slice(0, 3));
    const vt = Math.floor(r() * 4);
    nhieu.splice(vt, 0, dung);
    return { dapAn: nhieu, dung: [vt] };
  }

  const timDang = ma => DANG.find(d => d.ma === ma) || null;
  const MA_MUC = { de: "D", vua: "V", kho: "K" };
  // Câu đủ định dạng chung (Ke_Hoach_Dau_Truong.md mục 8). rng: hàm ngẫu nhiên hoặc hạt (số)
  function taoCau(maDang, muc, hat) {
    const dg = timDang(maDang);
    if (!dg) return null;
    for (let lan = 0; lan < 30; lan++) {
      const h = ((hat >>> 0) + lan * 7919) >>> 0;
      const r = goc.KC_DT_TRINH_DO ? goc.KC_DT_TRINH_DO.rngHat(h) : Math.random;
      const tho = dg.sinh(r, muc);
      if (!tho) continue;
      const pa = phuongAn(tho, dg.lop, r);
      if (!pa) continue;
      return {
        ma: "TOAN" + dg.lop + "-" + dg.ma + "-" + MA_MUC[muc] + "-" + h,
        mon: "toan", lop: dg.lop, chuDe: dg.chuDe, dang: "trac_nghiem", doKho: muc,
        noiDung: tho.nd, hinh: "", hinhChu: tho.hinhChu || "", amThanh: "",
        dapAn: pa.dapAn, dung: pa.dung, loiGiai: tho.lg, nguon: "sinh", trangThai: "xuat_ban"
      };
    }
    return null;
  }
  // Các (lớp, mức) đang có dạng câu -> cho bộ chọn độ khó
  function dsMuc() {
    const kq = [], co = {};
    DANG.forEach(d => ["de", "vua", "kho"].forEach(m => { const k = d.lop + m; if (!co[k]) { co[k] = 1; kq.push({ lop: d.lop, muc: m }); } }));
    return kq;
  }
  const dangCuaLop = lop => DANG.filter(d => d.lop === lop);

  goc.KC_DT_SINH_TOAN = { DANG, taoCau, dsMuc, dangCuaLop, timDang, so, tp, laMa };
})(typeof window !== "undefined" ? window : globalThis);
// 29/10/2026 - BƯỚC: TC_D04A
