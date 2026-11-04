// ================================================================
// FILE: dt/3d/dt3d_thanh_duoi.js  (ES module) - THANH ĐIỀU KHIỂN Ở CUỐI MÀN HÌNH
// CHỨC NĂNG: Thanh dưới kiểu Đế Chế: Ô ĐANG XEM bên trái (hình + tên + 2 dòng thông số + thanh tiến độ
//            của thứ vừa chạm: Thủ lĩnh, nông dân, nhà, Lều, ruộng, cây / mỏ, quái), Ô LỆNH ở giữa (nút
//            làm được với thứ đó; nút riêng của thứ đang xem do thanh tự vẽ, các nút cố định như 🔨 Xây,
//            🧑‍🌾 Sinh nông dân, 🌱 Trồng lại do dt3d_vung.js bật / tắt), Ô CHUNG bên phải (về lều, dân số,
//            khám phá, đồ họa). Thông số vẽ lại 4 lần / giây nên đếm giờ, tiến độ xây tự chạy.
// HÀM KHAI RA:
//   taoThanhDuoi($, macDinh) -> { xem(fn | null), ve() }
//     fn() -> { anh, ten, dong, phu, muc (0..1 | null), nut: [{ id, chu, nhan, bam }] } | null
//     xem(fn): từ giờ ô đang xem đọc fn; fn trả null (quái đã chạy, cây đã cạn...) hoặc xem(null)
//     thì quay về macDinh() (người đang chọn, không chọn ai thì cả làng).
// PHỤ THUỘC: các phần tử d3BangAnh, d3BangTen, d3BangDong, d3BangPhu, d3BangMuc(+Day), d3LenhRieng, d3Lenh
//            trong kc/dt_thung_lung.html và kc/dt_thu_3d.html; kiểu ở dt3d.css.
// BƯỚC: TC_D06D
// NGÀY: 04/11/2026
// ================================================================
const NUT_NGUOI = "#d3SoiDat, [id^='d3Xay_'], #d3KhamPhaNut"; // nút gắn với người đang chọn (khớp dt3d.css)

export function taoThanhDuoi($, macDinh) {
  const anh = $("d3BangAnh"), ten = $("d3BangTen"), dong = $("d3BangDong"), phu = $("d3BangPhu");
  const muc = $("d3BangMuc"), mucDay = $("d3BangMucDay"), lenhRieng = $("d3LenhRieng"), lenh = $("d3Lenh");
  let nguon = null, khoaNut = "";
  const dat = (el, chu) => { chu = chu || ""; if (el.textContent !== chu) el.textContent = chu; el.hidden = !chu; };

  let dsNut = []; // nút của lần vẽ mới nhất (bấm gọi đúng thứ đang xem, kể cả khi nút không vẽ lại)
  function veNut(ds) {
    dsNut = ds;
    const khoa = ds.map(n => n.id + "|" + n.chu).join("§");
    if (khoa === khoaNut) return;
    khoaNut = khoa;
    lenhRieng.replaceChildren(...ds.map((n, i) => {
      const b = document.createElement("button");
      b.className = "d3Nut d3Khung" + (n.lop ? " " + n.lop : ""); b.type = "button"; b.id = n.id; b.innerHTML = n.chu;
      b.setAttribute("aria-label", n.nhan || b.textContent);
      b.addEventListener("click", () => { if (dsNut[i]) dsNut[i].bam(); ve(); });
      return b;
    }));
  }

  function ve() {
    let tt = null;
    try { tt = nguon && nguon(); } catch (e) { tt = null; console.warn("Thanh dưới: chưa đọc được thông số", e); window.__dt3dLoiThanh = String(e && e.stack || e); }
    if (!tt) { nguon = null; tt = macDinh() || {}; }
    if (anh.textContent !== (tt.anh || "🏰")) anh.textContent = tt.anh || "🏰";
    dat(ten, tt.ten || "");
    dat(dong, tt.dong);
    dat(phu, tt.phu);
    const coMuc = Number.isFinite(tt.muc);
    muc.hidden = !coMuc;
    if (coMuc) mucDay.style.width = Math.round(Math.max(0, Math.min(1, tt.muc)) * 100) + "%";
    veNut(tt.nut || []);
    // Đang xem thứ khác (nhà, nguồn, quái) thì nút của NGƯỜI đang chọn (🔨 Xây + menu, 🔭) thôi hiện (dt3d.css .d3XemKhac):
    // ô lệnh chỉ có nút của đúng thứ đang xem. Ô lệnh trống: điện thoại thu hàng nút lại cho rộng chỗ nhìn.
    lenh.classList.toggle("d3XemKhac", !!nguon);
    lenh.classList.toggle("d3Trong", ![...lenh.querySelectorAll(".d3Nut:not([hidden])")].some(b => !(nguon && b.matches(NUT_NGUOI))));
  }
  setInterval(ve, 250);
  return { xem(fn) { nguon = fn || null; ve(); }, ve };
}
// 04/11/2026 - BƯỚC: TC_D06D
