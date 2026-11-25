// ================================================================
// FILE: dt/3d/dt3d_cai_dat.js  (ES module) - BẢNG ⚙️ CÀI ĐẶT CỦA BÉ (màn Thung lũng Đấu Trường)
// CHỨC NĂNG: Nút ⚙️ ở thanh trên mở một bảng cài đặt (người dùng 25/11/2026: "di chuyển biểu tượng trong trận
//            đấu thành biểu tượng cài đặt trên trang chủ: trẻ bấm vào có các tùy chọn âm thanh nền, âm thanh
//            trận đấu, độ phân giải game (chất lượng game) và cài đặt khác sau này bổ sung"):
//            - 🎵 Nhạc nền: bật / tắt + to nhỏ (thả thanh trượt thì nghe thử vài giây nhạc trận)
//            - 🔊 Âm thanh trận đấu: tiếng đánh, chiêu, tiếng khi chạm chọn: bật / tắt + to nhỏ (thả thanh: kêu thử)
//            - ✨ Chất lượng game: Đẹp / Nhẹ (đổi thì tải lại trang)
//            Máy nhớ mọi lựa chọn (localStorage, dt3d_am_thanh.js + dt3d_canh.js đọc); khung trận mở sau đó đọc theo.
//            Thêm mục mới: thêm một khối vào mảng MUC bên dưới (mỗi khối tự vẽ + tự nối).
// HÀM KHAI RA:
//   taoCaiDat({ nut, am, doHoa, luuDoHoa }) -> { mo(), dong(), dangMo() }
//     nut: nút ⚙️ (DOM); am: bộ tiếng dt3d_am_thanh.js (có thể null: ẩn 2 mục tiếng);
//     doHoa: "dep" | "nhe" đang dùng; luuDoHoa(chế độ) (dt3d_canh.js)
// BƯỚC: TC_D06D3
// NGÀY: 25/11/2026
// ================================================================

const phanTram = v => Math.round(v * 100);

export function taoCaiDat({ nut, am, doHoa, luuDoHoa }) {
  const nen = document.createElement("div");
  nen.className = "d3CaiDat"; nen.hidden = true;
  nen.innerHTML = '<div class="d3CaiDatHop d3Khung" role="dialog" aria-modal="true" aria-labelledby="d3CaiDatTen">'
    + '<div class="d3CaiDatDau"><h2 id="d3CaiDatTen">⚙️ Cài đặt</h2>'
    + '<button class="d3Nut d3Khung" type="button" data-cd="dong" aria-label="Đóng cài đặt">✖</button></div>'
    + '<div class="d3CaiDatRuot"></div></div>';
  document.body.appendChild(nen);
  const ruot = nen.querySelector(".d3CaiDatRuot");

  // mục âm thanh: một hàng bật / tắt + thanh to nhỏ
  function mucTieng({ ma, bieuTuong, ten, phu, bat, datBat, to, datTo, nghe }) {
    const k = document.createElement("section");
    k.className = "d3CdMuc"; k.dataset.muc = ma;
    k.innerHTML = '<div class="d3CdHang"><span class="d3CdTen"><b>' + bieuTuong + " " + ten + "</b><small>" + phu + "</small></span>"
      + '<button class="d3CdBat" type="button" role="switch" data-cd="bat"></button></div>'
      + '<label class="d3CdTo"><span aria-hidden="true">🔈</span><input type="range" min="0" max="100" step="5" data-cd="to" aria-label="' + ten + ' to nhỏ">'
      + '<span aria-hidden="true">🔊</span><output></output></label>';
    const nb = k.querySelector("[data-cd=bat]"), tt = k.querySelector("[data-cd=to]"), ra = k.querySelector("output");
    const ve = () => {
      const b = bat();
      nb.setAttribute("aria-checked", b ? "true" : "false"); nb.textContent = b ? "Bật" : "Tắt";
      nb.setAttribute("aria-label", ten + (b ? ": đang bật, chạm để tắt" : ": đang tắt, chạm để bật"));
      tt.value = phanTram(to()); ra.textContent = phanTram(to()) + "%";
      tt.disabled = !b; k.classList.toggle("d3CdTat", !b);
    };
    nb.addEventListener("click", () => { datBat(!bat()); ve(); if (bat()) nghe(); else nghe(true); });
    tt.addEventListener("input", () => { datTo(Number(tt.value) / 100); ra.textContent = tt.value + "%"; });
    tt.addEventListener("change", () => nghe());
    ve();
    return { k, ve };
  }

  let henTat = null;
  const dungNghe = () => { clearTimeout(henTat); henTat = null; if (am) try { am.dungNhac(0.6); } catch (e) { /* thôi */ } };
  const MUC = [];
  if (am) {
    MUC.push(mucTieng({ ma: "nhac", bieuTuong: "🎵", ten: "Nhạc nền", phu: "Nhạc chơi trong trận đấu",
      bat: () => am.nhacBat(), datBat: b => am.datNhac(b), to: () => am.toNhac(), datTo: v => am.datToNhac(v),
      nghe: tat => { // nghe thử 4 giây nhạc trận (chưa có bài thì im)
        dungNghe(); if (tat || !am.nhacBat()) return;
        try { am.moKhoa(); am.phatNhac({ boiCanh: "tran" }); } catch (e) { return; }
        henTat = setTimeout(dungNghe, 4000);
      } }));
    MUC.push(mucTieng({ ma: "tieng", bieuTuong: "🔊", ten: "Âm thanh trận đấu", phu: "Tiếng đánh, chiêu, tiếng khi chạm chọn",
      bat: () => am.dangBat(), datBat: b => am.datBat(b), to: () => am.toTieng(), datTo: v => am.datToTieng(v),
      nghe: tat => { if (tat) return; try { am.moKhoa(); am.chem(0); am.trung(0, false, 0.12); } catch (e) { /* thôi */ } } }));
  }
  // chất lượng game: 2 nút lớn; đổi thì tải lại trang (cảnh 3D dựng lại theo chế độ mới)
  const cl = document.createElement("section");
  cl.className = "d3CdMuc"; cl.dataset.muc = "chat_luong";
  cl.innerHTML = '<div class="d3CdHang"><span class="d3CdTen"><b>✨ Chất lượng game</b><small>Máy chạy chậm, giật thì chọn Nhẹ</small></span></div>'
    + '<div class="d3CdChon" role="radiogroup" aria-label="Chất lượng game">'
    + '<button type="button" role="radio" data-cl="dep">✨ Đẹp<small>Bóng, ánh sáng đầy đủ</small></button>'
    + '<button type="button" role="radio" data-cl="nhe">🪶 Nhẹ<small>Mượt hơn trên máy yếu</small></button></div>'
    + '<p class="d3CdBao" hidden>Đang tải lại trò chơi…</p>';
  for (const b of cl.querySelectorAll("[data-cl]")) {
    b.setAttribute("aria-checked", b.dataset.cl === doHoa ? "true" : "false");
    b.addEventListener("click", () => {
      if (b.dataset.cl === doHoa) return;
      luuDoHoa(b.dataset.cl); cl.querySelector(".d3CdBao").hidden = false;
      setTimeout(() => location.reload(), 300);
    });
  }
  for (const m of MUC) ruot.appendChild(m.k);
  ruot.appendChild(cl);

  let truoc = null;
  function mo() {
    for (const m of MUC) m.ve();
    truoc = document.activeElement; nen.hidden = false; nut.setAttribute("aria-expanded", "true");
    const dau = nen.querySelector("[data-cd=dong]"); if (dau) dau.focus();
  }
  function dong() {
    if (nen.hidden) return;
    dungNghe(); nen.hidden = true; nut.setAttribute("aria-expanded", "false");
    if (truoc && truoc.focus) truoc.focus();
  }
  nut.setAttribute("aria-haspopup", "dialog"); nut.setAttribute("aria-expanded", "false");
  nut.addEventListener("click", () => (nen.hidden ? mo() : dong()));
  nen.addEventListener("click", e => { if (e.target === nen || e.target.closest("[data-cd=dong]")) dong(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !nen.hidden) dong(); });
  // chạm trong bảng không lọt xuống cảnh 3D (không chọn / ra lệnh nhầm)
  for (const ev of ["pointerdown", "pointerup", "wheel"]) nen.addEventListener(ev, e => e.stopPropagation());
  return { mo, dong, dangMo: () => !nen.hidden };
}
