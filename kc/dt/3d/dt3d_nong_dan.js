// ================================================================
// FILE: dt/3d/dt3d_nong_dan.js  (ES module) - TÌM NÔNG DÂN RẢNH + BÁO NÔNG DÂN BỊ TẤN CÔNG
// CHỨC NĂNG (người dùng 06/11/2026: "Bổ sung nút tìm nông dân rảnh, và dịch màn hình đến nông dân bị tấn công"):
//   - Nút 🧑‍🌾 (số nông dân đang rảnh) ở ô chung thanh dưới, cạnh 👑 / 🏕️: mỗi lần bấm, màn hình tới một nông dân rảnh
//     (lần lượt từng người) và chọn luôn người đó để bé giao việc. Không ai rảnh thì nút ẩn.
//     Rảnh = nông dân của bé đứng chờ việc (dấu "!"), hoặc đứng yên không làm gì (không đi, không làm, không xây, không đánh).
//   - Nông dân bị tấn công (quái hung dữ lao vào, trụ của bạn bắn): hiện nút đỏ "⚠️ Nông dân 2 bị tấn công" dưới thanh trên;
//     chạm thì màn hình tới chỗ người đó + chọn (bé dẫn đi trốn hoặc bấm ⚔️ vào trận). Không tự kéo màn hình (bé đang
//     xem chỗ khác không bị giật). Hết bị đánh thì nút tự ẩn; nhiều người cùng bị đánh thì báo người mới nhất, kèm số.
// HÀM KHAI RA:
//   taoNongDan(the) -> { moc }
//     the = { ctx, lang, boNv, dk, cam, baoGoiY, chung (ô chung thanh dưới), truocNut (nút đứng sau nút 🧑‍🌾), tren (thanh trên),
//             biTanCong(dv) -> "quai" | "tru" | null }
// BƯỚC: TC_D06C5 - NGÀY: 06/11/2026
// ================================================================

const NHIP_MS = 400; // đếm lại người rảnh / người bị đánh mỗi bấy nhiêu ms (không cần mỗi khung)

export function taoNongDan(the) {
  const { ctx, lang, boNv, dk, cam, baoGoiY } = the;
  const danMinh = () => lang.donVi.filter(d => d.vaiTro === "nong_dan" && !d.laBan && !d.chay);
  const ranh = d => !d.dangNhatDo && (d.ranh || (d.trangThai === "dung" && !d.viec && !d.xay && !(d.hangXay && d.hangXay.length) && !(d.duong && d.duong.length)));
  const hinhCua = dv => boNv.dsHinh.find(h => h.dv === dv);
  function toiVaChon(dv) {
    cam.nhinVe(dv.x, dv.z);
    const h = hinhCua(dv); if (h) dk.chon(h);
  }

  // ---- nút 🧑‍🌾 nông dân rảnh ----
  const nut = document.createElement("button");
  nut.type = "button"; nut.id = "d3NdRanh"; nut.className = "d3Nut d3Khung d3NdRanh"; nut.hidden = true;
  nut.innerHTML = '🧑‍🌾<b class="d3NdRanhSo">0</b><span class="d3Chu"> Rảnh</span>';
  if (the.chung) the.chung.insertBefore(nut, the.truocNut && the.truocNut.parentNode === the.chung ? the.truocNut : the.chung.firstChild);
  let thuTu = -1, dsRanh = [];
  nut.addEventListener("click", () => {
    dsRanh = danMinh().filter(ranh);
    if (!dsRanh.length) { capNhat(); baoGoiY("👍 Nông dân nào cũng đang có việc."); return; }
    thuTu = (thuTu + 1) % dsRanh.length;
    const dv = dsRanh[thuTu];
    toiVaChon(dv);
    baoGoiY("🧑‍🌾 " + dv.ten + " đang rảnh" + (dsRanh.length > 1 ? " (" + (thuTu + 1) + "/" + dsRanh.length + ")" : "") + " · chạm cây, mỏ hoặc ruộng để giao việc");
  });

  // ---- TC_D06C6 (người dùng 07/11/2026: "Không tìm thấy thủ lĩnh, cần có nút tìm"): nút 👑 tới chỗ Thủ lĩnh + chọn ----
  // (nút 🏕️ cũ đổi thành "Về lều" khi đã có Lều nên không còn cách nào tìm Thủ lĩnh)
  const nutTl = document.createElement("button");
  nutTl.type = "button"; nutTl.id = "d3TimTl"; nutTl.className = "d3Nut d3Khung d3TimTl";
  nutTl.innerHTML = '👑<span class="d3Chu"> Thủ lĩnh</span>'; nutTl.setAttribute("aria-label", "Tìm Thủ lĩnh");
  if (the.chung) the.chung.insertBefore(nutTl, nut.nextSibling);
  nutTl.addEventListener("click", () => {
    const tl = lang.donVi.find(d => d.vaiTro === "thu_linh" && !d.laBan);
    if (!tl) { baoGoiY("👑 Thủ lĩnh đang nghỉ ở Lều."); return; }
    toiVaChon(tl);
    baoGoiY("👑 " + tl.ten + " ở đây · chạm đất để đi");
  });

  // ---- TC_D06C6 ("Trên điện thoại khó thoát đối tượng đang chọn => cần bổ sung nút x để thoát"): nút ✕ ở góc ô đang xem ----
  const bang = document.querySelector(".d3BangChon"), lenh = document.getElementById("d3Lenh");
  const nutX = document.createElement("button");
  nutX.type = "button"; nutX.id = "d3BoChon"; nutX.className = "d3BoChon"; nutX.textContent = "✕"; nutX.hidden = true;
  nutX.setAttribute("aria-label", "Bỏ chọn");
  if (bang) bang.appendChild(nutX);
  nutX.addEventListener("click", e => { e.stopPropagation(); if (dk.boChonTatCa) dk.boChonTatCa(); veX(); });
  function veX() {
    const co = !!(dk.dangChon && dk.dangChon()) || !!(lenh && lenh.classList.contains("d3XemKhac"));
    if (nutX.hidden !== !co) nutX.hidden = !co;
  }
  setInterval(veX, 250);

  // ---- nút đỏ ⚠️ nông dân bị tấn công ----
  // TC_D06D4 (người dùng 25/11/2026: "nên có 1 vị trí cho nút cài đặt và thông báo bị tấn công"): nút nằm trong Ô CHUNG
  // #d3OChung của thanh trên; đang báo thì ⚙️ ẩn, hết bị đánh thì ⚙️ hiện lại. Điện thoại chỉ hiện ⚠️ + số người (chữ .d3Chu ẩn).
  // Trang không có ô chung thì nút nổi như cũ (dưới thanh trên, bên phải).
  const oChung = document.getElementById("d3OChung"), nutCaiDat = document.getElementById("d3CaiDat");
  const bao = document.createElement("button");
  bao.type = "button"; bao.id = "d3BiDanh"; bao.className = "d3Nut d3Khung d3BiDanh" + (oChung ? " d3BiDanhO" : ""); bao.hidden = true;
  bao.setAttribute("aria-live", "assertive");
  bao.innerHTML = '<span aria-hidden="true">⚠️</span><span class="d3Chu"></span><b class="d3BiDanhSo" hidden></b>';
  const baoChu = bao.querySelector(".d3Chu"), baoSo = bao.querySelector(".d3BiDanhSo");
  (oChung || document.body).appendChild(bao);
  const biDanh = new Map(); // dv -> { loai, luc }
  let dvBao = null, epBiDanh = false; // epBiDanh: kịch bản thử bật giả "nông dân đầu tiên bị quái đánh"
  function hienBao(co) {
    if (bao.hidden === !co) return;
    bao.hidden = !co;
    if (oChung && nutCaiDat) nutCaiDat.hidden = co;
    if (the.doiBao) the.doiBao(co); // TC_D06D6b: ⚔️ ở thanh trên ẩn / hiện theo ⚠️
  }
  bao.addEventListener("click", e => {
    e.stopPropagation();
    if (!dvBao || !lang.donVi.includes(dvBao)) { hienBao(false); return; }
    // TC_D06D6b (người dùng 26/11/2026): chạm ⚠️ mở bảng trận (mỗi người bị đánh: ⚔️ Vào trận / 👀 Tới chỗ); chưa có trận thì như cũ
    if (the.moBangTran && the.moBangTran()) return;
    toiVaChon(dvBao);
    const loai = (biDanh.get(dvBao) || {}).loai;
    baoGoiY("👀 " + dvBao.ten + (loai === "tru" ? " đang bị trụ bắn · chạm chỗ xa trụ để dẫn đi trốn, hoặc bấm ⚔️ để đánh trả" : " đang bị quái tấn công · bấm ⚔️ để vào trận giúp"));
  });
  function veBao() {
    const ds = [...biDanh.entries()].sort((a, b) => b[1].luc - a[1].luc);
    if (!ds.length) { dvBao = null; hienBao(false); return; }
    dvBao = ds[0][0];
    const chu = " " + dvBao.ten + " bị tấn công · 👀", so = ds.length > 1 ? String(ds.length) : "";
    if (baoChu.textContent !== chu) { baoChu.textContent = chu; bao.setAttribute("aria-label", dvBao.ten + " bị tấn công, chạm để xem"); }
    if (baoSo.textContent !== so) { baoSo.textContent = so; baoSo.hidden = !so; }
    hienBao(true);
  }

  function capNhat() {
    const ds = danMinh();
    const n = ds.filter(ranh).length;
    if (nut.hidden !== !n) nut.hidden = !n;
    const so = nut.querySelector("b");
    if (so.textContent !== String(n)) so.textContent = String(n);
    nut.setAttribute("aria-label", n + " nông dân đang rảnh, bấm để tìm");
    // bị tấn công
    const bay = Date.now(), con = new Set();
    for (const dv of ds) {
      const loai = epBiDanh && dv === ds[0] ? "quai" : the.biTanCong ? the.biTanCong(dv) : null;
      if (!loai) continue;
      con.add(dv);
      if (!biDanh.has(dv)) biDanh.set(dv, { loai, luc: bay });
    }
    for (const dv of [...biDanh.keys()]) if (!con.has(dv)) biDanh.delete(dv);
    veBao();
  }
  let dem = 0;
  ctx.moiKhung(dt => { dem += dt * 1000; if (dem >= NHIP_MS) { dem = 0; capNhat(); } });
  capNhat();

  return {
    moc: { // kịch bản thử Chrome
      soRanh: () => danMinh().filter(ranh).length, nut: () => !nut.hidden && nut.textContent,
      bao: () => !bao.hidden && bao.textContent, dangBao: () => !bao.hidden /* TC_D06D6b */, bamRanh: () => nut.click(), bamBao: () => bao.click(), capNhat,
      bamTl: () => nutTl.click(), coX: () => !nutX.hidden, bamX: () => nutX.click(),
      thuBiDanh: co => { epBiDanh = !!co; capNhat(); return dvBao && dvBao.ten } // TC_D06D4: bật / tắt giả "bị tấn công"
    }
  };
}
// 06/11/2026 - BƯỚC: TC_D06C5
// 07/11/2026 - BƯỚC: TC_D06C6 (nút 👑 tìm Thủ lĩnh, nút ✕ bỏ chọn)
// 25/11/2026 - BƯỚC: TC_D06D4 (nút ⚠️ vào ô chung #d3OChung thay chỗ ⚙️; điện thoại chỉ ⚠️ + số người; móc thử thuBiDanh)
// 26/11/2026 - BƯỚC: TC_D06D6b (chạm ⚠️ mở bảng trận của quaiBd; báo doiBao để ẩn ⚔️)
