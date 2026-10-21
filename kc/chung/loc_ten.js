/* ================================================================
   FILE: chung/loc_ten.js
   CHỨC NĂNG: KIỂM TRA TÊN BÉ TỰ ĐẶT (tên vương quốc, tên nhân vật...) dùng chung toàn app:
              độ dài, ký tự cho phép, chặn từ tục / xúc phạm (tiếng Việt + tiếng Anh).
              So khớp theo TỪ NGUYÊN VẸN để không chặn nhầm ("các", "lớn" vẫn dùng được);
              riêng vài từ tiếng Anh tục thì chặn cả khi viết dính vào chữ khác.
   BƯỚC: TC_D01
   NGÀY: 21/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  // So sánh sau khi viết thường (GIỮ dấu): từ có dấu chỉ khớp đúng từ đó
  const TU_CO_DAU = ["địt", "đụ", "đéo", "đếch", "lồn", "cặc", "buồi", "đĩ", "cứt", "ngu", "đần", "khốn", "chó chết", "mẹ mày", "bố mày", "con điếm", "điếm", "dâm", "giết"];
  // So sánh sau khi BỎ dấu: chỉ những từ không trùng từ thường dùng
  const TU_BO_DAU = ["dit", "dcm", "dmm", "dkm", "vcl", "vkl", "vl", "cmm", "clm", "cl", "dm", "dek", "loz", "cac" + "k", "buoi" + "z", "fuk", "wtf"];
  // Chặn cả khi dính vào chữ khác (tiếng Anh)
  const CHUOI_ANH = ["fuck", "shit", "bitch", "dick", "porn", "sex", "pussy", "asshole", "nigg", "cunt", "kill"];

  const boDau = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
  const tachTu = s => s.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

  function kiemTra(ten, tuyChon) {
    tuyChon = tuyChon || {};
    const toiThieu = tuyChon.toiThieu || 2, toiDa = tuyChon.toiDa || 20;
    const sach = String(ten == null ? "" : ten).normalize("NFC").replace(/\s+/g, " ").trim();
    if (sach.length < toiThieu) return { hopLe: false, ten: sach, loi: "Tên cần ít nhất " + toiThieu + " chữ nhé." };
    if (sach.length > toiDa) return { hopLe: false, ten: sach, loi: "Tên dài quá, tối đa " + toiDa + " chữ thôi." };
    if (!/^[\p{L}\p{N} '\-]+$/u.test(sach)) return { hopLe: false, ten: sach, loi: "Tên chỉ dùng chữ cái, số và dấu cách thôi." };
    const thuong = sach.toLowerCase(), tu = tachTu(thuong), tuBoDau = tu.map(boDau);
    const noiLien = " " + tu.join(" ") + " ", noiLienBoDau = boDau(thuong).replace(/[^a-z0-9]/g, "");
    const xau = TU_CO_DAU.some(x => noiLien.indexOf(" " + x + " ") >= 0) ||
      TU_BO_DAU.some(x => tuBoDau.indexOf(x) >= 0) ||
      CHUOI_ANH.some(x => noiLienBoDau.indexOf(x) >= 0);
    if (xau) return { hopLe: false, ten: sach, loi: "Tên này chưa đẹp, con chọn tên khác hay hơn nhé!" };
    return { hopLe: true, ten: sach, loi: "" };
  }

  goc.KC_LOC_TEN = { kiemTra };
})(typeof window !== "undefined" ? window : globalThis);
