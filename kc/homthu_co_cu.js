/* ================================================================
   FILE: homthu_co_cu.js
   CHỨC NĂNG: 🦉 HỘP CÔ CÚ trong trang 📬 Hòm thư (homthu_NC.html), CHỈ admin. Đặc tả: Thiet_Ke_Hom_Thu.md bản 1.1
              mục 5, 6.3, 9.2 (phần Admin). Hộp chung mọi admin (dòng '@co_cu'): admin nào xử lý thì thư xong với mọi người.
     - Thanh chuyển: 🦉 Hộp Cô Cú (số chờ) · 📬 Thư riêng (hòm riêng của tài khoản, homthu.js). Mở trang = Hộp Cô Cú.
     - Mục: 🦉 Chờ Cô Cú · ⏳ Chờ bé · ✅ Đã xong · 📚 Tất cả (số đếm); lọc loại (💡 📮 🎁 ✉️ 📢), tên bé, tìm chữ.
     - Mở thư (#cc-<id>; Back của máy quay về danh sách): các lời (Cô Cú bên phải, ghi tên admin thật), "Xong bởi …, lúc …",
       ai còn giữ thư, "🗑 Con đã xoá thư này".
     - 💡 Ý tưởng / ✉️ thư Cô Cú: ô trả lời · 📨 Gửi lời · ✅ Gửi và xong · ✓ Đã xem · ↺ Mở lại.
     - 📮 Kháng nghị: trạng thái, lời bé, chi tiết tính năng (chung/kn_chi_tiet.js), ✅ Chấp nhận (có bù thì cấp 🎁 ngay trong thư)
       / ↩️ Giữ nguyên: gọi CÙNG hàm với Quản trị › 📮 / 🎁 (kc_kn_admin_xu_ly, kc_ct_admin_cap).
     - 🗑 Xoá khỏi Hộp Cô Cú (mọi admin) · ⛔ Xoá hẳn với mọi người (trừ kháng nghị chưa xử lý); đều hỏi lại.
   RPC (trang thêm p_ten_admin + p_ma_phien_admin; máy chủ kiem_tra_admin ở MỌI hàm):
     kc_thu_admin_ds, kc_thu_admin_xem, kc_thu_admin_tra_loi, kc_thu_admin_dat, kc_thu_admin_xoa (SQL kc12b);
     kc_kn_admin_ds, kc_kn_admin_xu_ly, kc_ct_admin_cap (SQL kc11d).
   KC_12D2: ✉️ VIẾT THƯ (#cc-viet, cột thư): gửi cho một / vài bé (chọn từ danh sách kc_admin_lay_danh_sach_tre) = thư ✉️
     (tuỳ chọn 🙋 Chờ con trả lời, 👨‍👩‍👧 Phụ huynh cũng thấy) hoặc 📢 tin chung cho tất cả bé / tất cả phụ huynh / mọi người.
     Bấm Gửi → hỏi máy chủ số người (kc_thu_admin_viet p_chi_dem) → hộp "Gửi cho N người?" → gửi với p_ma (mã lần gửi tạo lúc
     mở khung: bấm lại không gửi 2 lần). Thư có bé: nút "✉️ Viết thư cho bé này". Ô lọc tên bé có gợi ý tên.
     Đường dẫn ?loai=…&be=… (Quản trị › 💡 / 📮 dẫn sang) mở sẵn bộ lọc.
   CHỮ do người viết: luôn textContent. ⚙️ Cài đặt hòm thư ở Quản trị › 📬 Hòm thư (qt_hom_thu.js).
   ĐIỆN THOẠI: danh sách, chạm mở thư toàn màn hình. MÁY TÍNH (≥ 900 px): hai cột (homthu.css + phần .cc* cuối file đó).
   BƯỚC: KC_12D1 · NGÀY: 28/11/2026 · SỬA: KC_12D2 28/11/2026
   ================================================================ */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const tao = (the, lop, chu) => { const e = document.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; };
  const HINH_LOAI = { y_tuong: "💡", khang_nghi: "📮", cap_thuong: "🎁", co_cu: "✉️", tin: "📢" };
  const TEN_LOAI = { y_tuong: "Ý tưởng", khang_nghi: "Kháng nghị", cap_thuong: "Cấp thưởng", co_cu: "Thư Cô Cú", tin: "Tin chung" };
  const KET_QUA = { chap_nhan: "chấp nhận", giu_nguyen: "giữ nguyên", het_han: "quá hạn", da_xem: "đã xem", tra_loi: "đã trả lời" };
  const VIEC = { gui_ly_do: "chờ bé gửi phản hồi", nhan: "chờ bé bấm 🎁 Nhận", tra_loi: "chờ bé trả lời", xu_ly: "chờ Cô Cú" };
  const TEN_TT_KN = { be_gui: "💌 Bé đã gửi, chờ xử lý", cho_be: "⏳ Bé chưa phản hồi", chap_nhan: "✅ Đã chấp nhận", giu_nguyen: "↩️ Giữ nguyên", het_han: "⌛ Quá hạn" };
  const LOC = [["cho_co_cu", "🦉", "Chờ Cô Cú", "choCoCu"], ["cho_be", "⏳", "Chờ bé", "choBe"], ["xong", "✅", "Đã xong", "xong"], ["tat_ca", "📚", "Tất cả", "tatCa"]];

  let tk = null, cheDo = "cc", S = { loc: "cho_co_cu", loai: "", be: "", tim: "" }, ds = [], tiep = null, dem = {}, cauHinh = {};
  let dangTai = 0, moId = null, dsBe = null, hoiBe = null, vietSan = null;

  const rpcA = (ham, ts) => kcGoiRpc(ham, Object.assign({ p_ten_admin: tk.tenDangNhap, p_ma_phien_admin: tk.maPhien || "" }, ts || {}))
    .then(kq => kq || { thanhCong: false, thongBao: "Máy chủ không trả lời" });

  function gio(iso, du) {
    const d = new Date(iso); if (!iso || isNaN(d)) return "";
    const h = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    const n = ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2);
    const homNay = new Date().toDateString() === d.toDateString();
    return du ? (homNay ? "hôm nay " + h : n + " " + h) : (homNay ? h : n);
  }
  const soVN = n => (Number(n) || 0).toLocaleString("vi-VN");
  function maMoi() {
    try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) { /* bỏ qua */ }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16); });
  }

  let henBao = 0;
  function bao(chu, vui) {
    let o = $("htBao");
    if (!o) { o = tao("div", "htBao"); o.id = "htBao"; o.setAttribute("role", "status"); document.body.appendChild(o); }
    o.textContent = chu; o.classList.toggle("vui", !!vui); o.classList.add("hien");
    clearTimeout(henBao); henBao = setTimeout(() => o.classList.remove("hien"), 3600);
  }

  function nhanCua(t) {
    if (t.viecCho) return ["🦉", "Chờ Cô Cú", "can"];
    if (t.trangThai === "mo") return ["⏳", "Chờ bé", "dang"];
    return ["✅", "Đã xong", "xong"];
  }
  const hinhCua = (loai, d) => (d && d.bieuTuong) || HINH_LOAI[loai] || "📬";

  // ================================================================
  // CHẾ ĐỘ: 🦉 Hộp Cô Cú / 📬 Thư riêng
  // ================================================================
  function datCheDo(m) {
    cheDo = m;
    $("ccTrang").hidden = m !== "cc";
    $("htTrang").hidden = m === "cc";
    $("ccChuyen").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.che === m)));
    const h = location.hash;
    if ((m === "cc" && /^#thu-/.test(h)) || (m !== "cc" && /^#cc-/.test(h))) history.replaceState(null, "", location.pathname + location.search);
    if (m === "cc") theoDuongDan();
  }

  function veSoChuyen(n) {
    const b = $("ccChuyen").querySelector('[data-che="cc"] b');
    n = Math.max(0, Number(n) || 0);
    b.textContent = n > 99 ? "99+" : String(n); b.hidden = n === 0;
  }

  // ================================================================
  // DANH SÁCH
  // ================================================================
  function veMuc() {
    $("ccMuc").querySelectorAll("[role=tab]").forEach(b => {
      const x = LOC.find(l => l[0] === b.dataset.loc);
      b.setAttribute("aria-selected", String(x[0] === S.loc));
      b.querySelector(".ccSo").textContent = dem[x[3]] != null ? soVN(dem[x[3]]) : "";
    });
  }

  function taiDs(them) {
    const lan = ++dangTai;
    const vung = $("ccDs");
    if (!them) { tiep = null; vung.innerHTML = ""; vung.appendChild(tao("p", "htCho", "Cô Cú đang mở hộp thư…")); }
    const ts = { p_loc: S.loc, p_loai: S.loai || null, p_be: S.be || null, p_tim: S.tim || null };
    if (them && tiep) { ts.p_truoc_luc = tiep.luc; ts.p_truoc_id = tiep.id; }
    return rpcA("kc_thu_admin_ds", ts).then(kq => {
      if (lan !== dangTai) return;
      if (!kq.thanhCong) {
        if (!them) { vung.innerHTML = ""; vung.appendChild(tao("p", "htCho", "⚠️ " + (kq.thongBao || "Chưa mở được Hộp Cô Cú"))); }
        return;
      }
      dem = kq.dem || {}; cauHinh = kq.cauHinh || {};
      veMuc(); veSoChuyen(dem.choCoCu);
      ds = (them ? ds : []).concat(kq.ds || []);
      tiep = kq.tiep || null;
      veDs();
    });
  }

  function veDs() {
    const vung = $("ccDs");
    vung.innerHTML = "";
    if (!ds.length) {
      const rong = tao("div", "htRong");
      rong.appendChild(tao("div", "htCuTo", S.loc === "cho_co_cu" ? "🎉" : "🦉"));
      rong.appendChild(tao("p", "", S.loai || S.be || S.tim ? "Không có thư nào khớp bộ lọc."
        : S.loc === "cho_co_cu" ? "Không còn thư nào chờ Cô Cú. Tuyệt!" : "Chưa có thư nào ở mục này."));
      vung.appendChild(rong);
    }
    ds.forEach(t => vung.appendChild(veMucThu(t)));
    $("ccThem").hidden = !tiep;
  }

  function veMucThu(t) {
    const n = nhanCua(t);
    const b = tao("button", "htMucThu" + (t.chuaDoc ? " chuaDoc" : "") + (t.id === moId ? " dangMo" : ""));
    b.type = "button"; b.dataset.id = t.id;
    b.appendChild(tao("span", "htHinh", hinhCua(t.loai, t.duLieu)));
    const giua = tao("span", "htGiua");
    giua.appendChild(tao("span", "htTieuDe", t.tieuDe || "Thư"));
    const phu = tao("span", "htPhu");
    phu.appendChild(tao("span", "htNhan " + n[2], n[0] + " " + n[1]));
    if (t.be) phu.appendChild(tao("span", "htCon", "👧 " + t.be));
    else if (t.soNguoi > 1) phu.appendChild(tao("span", "htCon", "👥 " + soVN(t.soNguoi) + " người"));
    if (t.be && t.beConGiu === false) phu.appendChild(tao("span", "ccDaXoa", "🗑 bé đã xoá"));
    giua.appendChild(phu);
    b.appendChild(giua);
    b.appendChild(tao("span", "htGio", gio(t.capNhat)));
    b.setAttribute("aria-label", (TEN_LOAI[t.loai] || "Thư") + ": " + (t.tieuDe || "") + ", " + n[1] + (t.be ? ", bé " + t.be : ""));
    b.addEventListener("click", () => moThu(t.id));
    return b;
  }

  function capNhatMuc(id, doi) {
    const t = ds.find(x => x.id === id);
    if (!t) return;
    Object.assign(t, doi);
    const cu = $("ccDs").querySelector('.htMucThu[data-id="' + id + '"]');
    if (cu) cu.replaceWith(veMucThu(t));
  }

  // ================================================================
  // MỞ THƯ
  // ================================================================
  function moThu(id) {
    const h = "#cc-" + id;
    if (location.hash === h) { hienThu(id); return; }
    location.hash = h;
  }
  function veLui() {
    const lui = tao("button", "htLui", "‹"); lui.type = "button"; lui.setAttribute("aria-label", "Quay lại danh sách thư");
    lui.addEventListener("click", () => { if (/^#cc-/.test(location.hash)) history.back(); else dongThu(); });
    return lui;
  }
  function dongThu() {
    moId = null;
    $("ccTrang").querySelector(".htKhung").classList.remove("coThu");
    const cot = $("ccCotThu"); cot.innerHTML = "";
    const trong = tao("div", "htTrongThu");
    trong.appendChild(tao("div", "htCuTo", "🦉"));
    trong.appendChild(tao("p", "", "Chọn một thư để đọc và xử lý."));
    cot.appendChild(trong);
    $("ccDs").querySelectorAll(".htMucThu.dangMo").forEach(x => x.classList.remove("dangMo"));
  }
  function theoDuongDan() {
    if (cheDo !== "cc") return;
    if (location.hash === "#cc-viet") { hienViet(); return; }
    const m = /^#cc-(\d+)$/.exec(location.hash);
    if (m) hienThu(Number(m[1])); else dongThu();
  }

  function hienThu(id) {
    moId = id;
    $("ccTrang").querySelector(".htKhung").classList.add("coThu");
    $("ccDs").querySelectorAll(".htMucThu").forEach(x => x.classList.toggle("dangMo", Number(x.dataset.id) === id));
    const cot = $("ccCotThu");
    if (!matchMedia("(min-width: 900px)").matches) { try { cot.scrollIntoView({ block: "start" }); } catch (e) { /* bỏ qua */ } }
    cot.innerHTML = "";
    const dau = tao("div", "htDauThu"); dau.appendChild(veLui()); cot.appendChild(dau);
    cot.appendChild(tao("p", "htCho", "Đang mở thư…"));
    return rpcA("kc_thu_admin_xem", { p_thu_id: id }).then(kq => {
      if (moId !== id) return;
      if (!kq.thanhCong) {
        cot.innerHTML = ""; const d2 = tao("div", "htDauThu"); d2.appendChild(veLui()); cot.appendChild(d2);
        cot.appendChild(tao("p", "htCho", kq.ma === "khong_co" ? "Thư này không còn trong Hộp Cô Cú." : "⚠️ " + (kq.thongBao || "Chưa mở được thư")));
        if (kq.ma === "khong_co") { ds = ds.filter(x => x.id !== id); veDs(); }
        return;
      }
      veThu(kq);
      const t = ds.find(x => x.id === id);
      if (t && t.chuaDoc) capNhatMuc(id, { chuaDoc: false });
    });
  }

  // làm mới sau một thao tác: thư đang mở + danh sách (số đếm) + số trên thanh đầu
  function lamMoi(id) {
    taiDs(false);
    if (id != null && moId === id) hienThu(id);
    if (typeof window.kcCapNhatHomThu === "function") kcCapNhatHomThu();
  }

  function veThu(kq) {
    const t = kq.thu, d = t.du_lieu || {}, nguoi = kq.nguoi || [];
    const coCu = nguoi.find(n => n.ai === "@co_cu") || {};
    const tt = { viecCho: coCu.viecCho, trangThai: t.trang_thai };
    const cot = $("ccCotThu");
    cot.innerHTML = "";
    // đầu thư
    const dau = tao("div", "htDauThu");
    dau.appendChild(veLui());
    dau.appendChild(tao("span", "htHinhTo", hinhCua(t.loai, d)));
    const giua = tao("div", "htDauGiua");
    giua.appendChild(tao("h2", "", t.tieu_de || "Thư"));
    const n = nhanCua(tt), phu = tao("p", "htPhu");
    phu.appendChild(tao("span", "htNhan " + n[2], n[0] + " " + n[1]));
    phu.appendChild(tao("span", "htCon", TEN_LOAI[t.loai] || t.loai));
    if (t.be) phu.appendChild(tao("span", "htCon", "👧 " + t.be));
    giua.appendChild(phu);
    dau.appendChild(giua);
    cot.appendChild(dau);

    const than = tao("div", "htThan");
    than.appendChild(veThongTin(t, nguoi));
    if ((t.loai === "cap_thuong" || d.capThuong) && (+d.kc > 0 || +d.vang > 0)) {
      const qua = tao("div", "htQua");
      if (+d.kc > 0) qua.appendChild(tao("b", "", "+" + d.kc + " 💎"));
      if (+d.vang > 0) qua.appendChild(tao("b", "", "+" + d.vang + " 🪙"));
      than.appendChild(qua);
    }
    const hoi = tao("div", "htHoiThoai");
    (kq.loi || []).forEach(l => hoi.appendChild(veLoi(l, t)));
    if (!(kq.loi || []).length) hoi.appendChild(tao("p", "htSuKien", t.tieu_de || ""));
    than.appendChild(hoi);
    than.appendChild(veViec(kq));
    cot.appendChild(than);
  }

  function veThongTin(t, nguoi) {
    const k = tao("div", "ccTin");
    const dong = chu => k.appendChild(tao("p", "", chu));
    dong("Mở lúc " + gio(t.tao_luc, true) + " · cập nhật " + gio(t.cap_nhat_luc, true));
    if (t.trang_thai === "xong") {
      dong("✅ Xong bởi " + (t.xong_boi || "hệ thống (tự xong)") + (t.xong_luc ? ", lúc " + gio(t.xong_luc, true) : "")
        + (t.ket_qua && KET_QUA[t.ket_qua] ? " · " + KET_QUA[t.ket_qua] : ""));
    }
    const giu = nguoi.filter(x => x.ai !== "@co_cu");
    if (t.be && !giu.some(x => x.ai && x.ai.toLowerCase() === t.be.toLowerCase())) {
      k.appendChild(tao("p", "ccDaXoa", "🗑 Con đã xoá thư này (Cô Cú vẫn còn thư)."));
    }
    if (giu.length > 8) dong("👥 " + soVN(giu.length) + " người còn giữ thư · " + soVN(giu.filter(x => x.daDoc).length) + " người đã đọc");
    else if (giu.length) {
      const hang = tao("div", "ccNguoi");
      giu.forEach(x => {
        const chu = (x.vai === "phu_huynh" ? "👨‍👩‍👧 " + x.ai + (x.quaBe ? " (PH của " + x.quaBe + ")" : "") : "👧 " + x.ai)
          + " · " + (x.daDoc ? "đã đọc" : "chưa đọc") + (x.viecCho && VIEC[x.viecCho] ? " · " + VIEC[x.viecCho] : "");
        hang.appendChild(tao("span", "ccChip" + (x.daDoc ? "" : " chua"), chu));
      });
      k.appendChild(hang);
    } else dong("Không còn bé / phụ huynh nào giữ thư này.");
    return k;
  }

  function veLoi(l, t) {
    if (l.kieu === "su_kien" || l.tu === "@he_thong") {
      const s = tao("div", "htSuKien"); s.appendChild(tao("span", "", l.chu)); return s;
    }
    const laCoCu = l.tu === "@co_cu";
    const hang = tao("div", "htLoi " + (laCoCu ? "toi ccCoCu" : "nguoi"));
    if (!laCoCu) hang.appendChild(tao("span", "htAi", t.be && l.tu && l.tu.toLowerCase() === t.be.toLowerCase() ? "🧒" : "🙂"));
    const bong = tao("div", "htBong");
    bong.appendChild(tao("span", "htTen", laCoCu ? "🦉 Cô Cú" + (l.tuThat ? " · " + l.tuThat : "") : (l.tu || "")));
    bong.appendChild(tao("p", "", l.chu));
    bong.appendChild(tao("span", "htGioLoi", gio(l.luc, true)));
    hang.appendChild(bong);
    return hang;
  }

  // ---------- việc của Cô Cú ----------
  function veViec(kq) {
    const t = kq.thu, vung = tao("div", "htViec ccViec");
    if (t.be) {   // KC_12D2: viết thư mới cho đúng bé của thư này
      const h = tao("div", "ccHangNut"), v = tao("button", "htNut phu", "✉️ Viết thư cho bé " + t.be); v.type = "button";
      v.addEventListener("click", () => moViet({ be: [t.be] }));
      h.appendChild(v); vung.appendChild(h);
    }
    if (t.loai === "y_tuong" || t.loai === "co_cu") {
      vung.appendChild(veTraLoi(t));
      const hang = tao("div", "ccHangNut");
      if (t.trang_thai === "mo") hang.appendChild(nutThaoTac("✓ Đã xem (xong, không trả lời)", "htNut phu", () => datTrangThai(t.id, "xong")));
      else hang.appendChild(nutThaoTac("↺ Mở lại", "htNut phu", () => datTrangThai(t.id, "mo")));
      vung.appendChild(hang);
    } else if (t.loai === "khang_nghi") {
      const k = tao("div", "ccKn"); k.appendChild(tao("p", "htGhi", "Đang tải kháng nghị…"));
      vung.appendChild(k);
      taiKhangNghi(t, k);
    } else {
      vung.appendChild(tao("p", "htGhi", t.loai === "cap_thuong" ? "🎁 Thư tặng thưởng: không cần xử lý. Sửa cấp thưởng ở Quản trị › 🎁."
        : "📢 Tin chung: không cần xử lý."));
    }
    vung.appendChild(veXoa(t));
    return vung;
  }

  function nutThaoTac(chu, lop, lam) {
    const b = tao("button", lop, chu); b.type = "button";
    b.addEventListener("click", () => { b.disabled = true; Promise.resolve(lam()).then(() => { b.disabled = false; }); });
    return b;
  }

  function veTraLoi(t) {
    const max = Math.max(50, +cauHinh.do_dai_loi_co_cu || 1000);
    const khung = tao("div", "htViet");
    khung.appendChild(tao("label", "ccNhan", "🦉 Cô Cú trả lời" + (t.be ? " bé " + t.be : "")));
    const o = tao("textarea", "htO"); o.rows = 3; o.maxLength = max;
    o.placeholder = t.loai === "y_tuong" ? "Ví dụ: Ý tưởng hay quá! Cô Cú sẽ làm vào tháng sau nhé." : "Lời Cô Cú…";
    o.setAttribute("aria-label", "Lời Cô Cú trả lời");
    khung.querySelector("label").htmlFor = o.id = "ccO" + t.id;
    const duoi = tao("div", "htVietDuoi");
    const dem = tao("span", "htDem", "0 / " + max);
    const nut = tao("div", "ccHangNut");
    const gui = tao("button", "htNut phu", "📨 Gửi lời"); gui.type = "button";
    const xong = tao("button", "htNut chinh", "✅ Gửi và xong"); xong.type = "button";
    [gui, xong].forEach(b => { b.disabled = true; });
    const loi = tao("p", "htLoiViet"); loi.setAttribute("role", "alert");
    o.addEventListener("input", () => { dem.textContent = o.value.length + " / " + max; gui.disabled = xong.disabled = !o.value.trim(); loi.textContent = ""; });
    const goi = laXong => {
      const chu = o.value.trim(); if (!chu) return;
      gui.disabled = xong.disabled = o.disabled = true;
      rpcA("kc_thu_admin_tra_loi", { p_thu_id: t.id, p_chu: chu, p_xong: laXong }).then(kq => {
        if (kq.thanhCong) { bao(laXong ? "✅ Đã trả lời và xong. Bé thấy lời Cô Cú trong 📬 Hòm thư." : "📨 Đã gửi lời Cô Cú.", true); lamMoi(t.id); return; }
        o.disabled = false; gui.disabled = xong.disabled = false;
        loi.textContent = "❌ " + (kq.thongBao || "Chưa gửi được");
      });
    };
    gui.addEventListener("click", () => goi(false));
    xong.addEventListener("click", () => goi(true));
    nut.append(gui, xong);
    duoi.append(dem, nut);
    khung.append(o, duoi, loi);
    return khung;
  }

  function datTrangThai(id, tt) {
    return rpcA("kc_thu_admin_dat", { p_thu_id: id, p_trang_thai: tt }).then(kq => {
      if (!kq.thanhCong) { bao("❌ " + (kq.thongBao || "Chưa lưu được")); return; }
      bao(tt === "xong" ? "✓ Đã đánh dấu xong." : "↺ Đã mở lại thư: thư về mục Chờ Cô Cú.", true);
      lamMoi(id);
    });
  }

  // ---------- 📮 kháng nghị trong thư (cùng hàm với Quản trị › 📮 / 🎁) ----------
  function taiKhangNghi(t, vung) {
    const d = t.du_lieu || {}, knId = Number(d.khangNghi || t.tham_chieu);
    rpcA("kc_kn_admin_ds", { p_loc: "tat_ca", p_nguon: d.nguon || null, p_so: 200 }).then(r => {
      vung.innerHTML = "";
      const k = r.thanhCong && (r.ds || []).find(x => Number(x.id) === knId);
      if (!k) {
        vung.appendChild(tao("p", "htGhi", r.thanhCong ? "Không tìm thấy kháng nghị này trong 200 kháng nghị gần nhất." : "⚠️ " + (r.thongBao || "Chưa tải được kháng nghị")));
        const a = tao("a", "htNut phu", "🛠️ Mở Quản trị › 📮 Bé kháng nghị"); a.href = "quantri_NC.html";
        vung.appendChild(a);
        return;
      }
      veKhangNghi(t, k, r.cauHinh || {}, vung);
    });
  }

  function veKhangNghi(t, k, ch, vung) {
    const d = k.duLieu || {}, dx = k.deXuat || {}, coBu = (+dx.kc > 0 || +dx.vang > 0);
    const the = tao("div", "ccKnThe");
    const dau = tao("p", "ccKnDau");
    dau.append(tao("span", "htNhan " + (k.trangThai === "be_gui" ? "can" : ["cho_be", "het_han"].indexOf(k.trangThai) >= 0 ? "dang" : "xong"), TEN_TT_KN[k.trangThai] || k.trangThai),
      tao("span", "htCon", (d.nguonTen || k.nguon) + (d.ten ? " · " + d.ten : "")));
    the.appendChild(dau);
    the.appendChild(tao("p", "knPhu", "Hạn bé gửi: " + gio(k.han, true) + (coBu ? " · bù đề xuất: " + soVN(dx.kc) + " 💎 + " + soVN(dx.vang) + " 🪙" : " · không có bù đề xuất")));
    if (k.loiBe) the.appendChild(tao("p", "ccLoiBe", "“" + k.loiBe + "”"));
    if (k.capThuong) the.appendChild(tao("p", "knPhu", "✅ Đã bù " + soVN(k.capThuong.kc) + " 💎 + " + soVN(k.capThuong.vang) + " 🪙 · " + k.capThuong.boi + " · " + gio(k.capThuong.luc, true)));
    else if (k.xuLyBoi) the.appendChild(tao("p", "knPhu", "Xử lý: " + k.xuLyBoi + " · " + gio(k.xuLyLuc, true)));
    if (k.loiNhan) the.appendChild(tao("p", "knPhu", "Lời nhắn cho bé: “" + k.loiNhan + "”"));

    const ct = window.KC_KN_CHI_TIET ? KC_KN_CHI_TIET.ve(k.nguon, k.chiTiet || {}) : tao("p", "knPhu", "(thiếu chung/kn_chi_tiet.js)");
    ct.hidden = true; ct.classList.add("ccKnChiTiet");
    const hang = tao("div", "ccHangNut");
    const xem = tao("button", "htNut phu", "🔎 Xem chi tiết"); xem.type = "button"; xem.setAttribute("aria-expanded", "false");
    xem.addEventListener("click", () => { ct.hidden = !ct.hidden; xem.setAttribute("aria-expanded", String(!ct.hidden)); });
    hang.appendChild(xem);
    const mo = ["cho_be", "be_gui", "het_han"].indexOf(k.trangThai) >= 0;
    const nhanDuoc = !k.capThuong && (mo || (coBu && k.trangThai === "giu_nguyen"));
    const khung = tao("div", "ccKnXuLy"); khung.hidden = true;
    if (nhanDuoc) {
      const cn = tao("button", "htNut chinh", coBu ? "✅ Chấp nhận + bù thưởng" : "✅ Chấp nhận"); cn.type = "button";
      cn.addEventListener("click", () => moXuLy("chap_nhan"));
      hang.appendChild(cn);
    }
    if (mo) {
      const giu = tao("button", "htNut phu", "↩️ Giữ nguyên"); giu.type = "button";
      giu.addEventListener("click", () => moXuLy("giu_nguyen"));
      hang.appendChild(giu);
    }
    if (!nhanDuoc && !mo) hang.appendChild(tao("span", "htGhi", "Kháng nghị đã xử lý xong."));

    function o(nhan, el) { const l = tao("label", "ccNhan", nhan); el.id = "ccKn" + Math.random().toString(36).slice(2, 8); l.htmlFor = el.id; khung.append(l, el); return el; }
    function moXuLy(viec) {
      khung.innerHTML = ""; khung.hidden = false;
      const bu = viec === "chap_nhan" && coBu;
      let oKc, oVang, oLy;
      if (bu) {
        oKc = tao("input", "htO ccOSo"); oKc.type = "number"; oKc.min = "0"; oKc.step = "1"; oKc.value = +dx.kc || 0;
        oVang = tao("input", "htO ccOSo"); oVang.type = "number"; oVang.min = "0"; oVang.step = "1"; oVang.value = +dx.vang || 0;
        o("💎 Kim cương bù", oKc); o("🪙 Xu vàng bù", oVang);
        oLy = tao("input", "htO ccOSo"); oLy.maxLength = 200; oLy.value = "Chấp nhận kháng nghị: " + (d.ten || k.thamChieu || "");
        o("Lý do (chỉ admin thấy, 3-200 chữ)", oLy);
      }
      const ln = tao("textarea", "htO"); ln.rows = 2; ln.maxLength = 300;
      ln.value = viec === "chap_nhan" ? (d.mauChapNhan || ch.mau_chap_nhan || "") : (d.mauGiuNguyen || ch.mau_giu_nguyen || "");
      o("Lời nhắn cho bé (hiện trong thư " + (viec === "chap_nhan" ? "🎉" : "🦉") + ")", ln);
      const loi = tao("p", "htLoiViet"); loi.setAttribute("role", "alert");
      const ma = maMoi();
      const ok = tao("button", "htNut " + (viec === "chap_nhan" ? "chinh" : "do"), viec === "chap_nhan" ? (bu ? "✅ Xác nhận chấp nhận + cấp thưởng" : "✅ Xác nhận chấp nhận") : "↩️ Xác nhận giữ nguyên");
      ok.type = "button";
      const thoi = tao("button", "htNut phu", "Thôi"); thoi.type = "button";
      thoi.addEventListener("click", () => { khung.hidden = true; khung.innerHTML = ""; });
      ok.addEventListener("click", () => {
        loi.textContent = "";
        let p;
        if (bu) {
          const kc = Math.floor(+oKc.value || 0), vang = Math.floor(+oVang.value || 0);
          if (kc < 0 || vang < 0 || kc + vang === 0) { loi.textContent = "Nhập số kim cương / xu vàng bù (lớn hơn 0)."; return; }
          const s = []; if (kc > 0) s.push(soVN(kc) + " 💎"); if (vang > 0) s.push(soVN(vang) + " 🪙");
          if (!window.confirm("Chấp nhận kháng nghị và cấp " + s.join(" + ") + " cho bé " + k.be + "?")) return;
          ok.disabled = true;
          p = rpcA("kc_ct_admin_cap", { p_be: k.be, p_kc: kc, p_vang: vang, p_ly_do: oLy.value.trim(), p_loi_nhan: ln.value.trim(), p_ma: ma, p_khang_nghi: k.id });
        } else {
          ok.disabled = true;
          p = rpcA("kc_kn_admin_xu_ly", { p_id: k.id, p_ket_qua: viec, p_loi_nhan: ln.value.trim() });
        }
        p.then(kq => {
          if (!kq.thanhCong) { ok.disabled = false; loi.textContent = "❌ " + (kq.thongBao || "Chưa lưu được"); return; }
          bao(viec === "chap_nhan" ? (bu ? "✅ Đã chấp nhận và cấp thưởng. Bé bấm 🎁 Nhận trong Hòm thư." : "✅ Đã chấp nhận.") : "↩️ Đã giữ nguyên.", true);
          lamMoi(t.id);
        });
      });
      const h = tao("div", "ccHangNut"); h.append(ok, thoi);
      khung.append(loi, h);
      (bu ? oKc : ln).focus();
    }
    the.append(hang, khung, ct);
    vung.appendChild(the);
  }

  // ================================================================
  // ✉️ / 📢 VIẾT THƯ MỚI (KC_12D2). Máy chủ tự lập danh sách người nhận, tự kiểm quyền / độ dài / số người tối đa.
  // ================================================================
  const DOI_TUONG = [
    ["be", "✉️", "Một hoặc vài bé", "Thư ✉️ riêng cho bé được chọn"],
    ["tat_ca_be", "📢", "Tất cả các bé", "Tin chung"],
    ["tat_ca_phu_huynh", "📢", "Tất cả phụ huynh", "Tin chung"],
    ["tat_ca", "📢", "Mọi người", "Tin chung cho mọi bé + phụ huynh"]
  ];

  // danh sách tên bé (gợi ý ô lọc + chọn người nhận); hỏi máy chủ một lần mỗi lần mở trang
  function layDsBe() {
    if (dsBe) return Promise.resolve(dsBe);
    if (hoiBe) return hoiBe;
    hoiBe = rpcA("kc_admin_lay_danh_sach_tre").then(kq => {
      hoiBe = null;
      if (!kq.thanhCong) return [];
      dsBe = (kq.danhSachTre || []).map(b => ({ ten: b.tenDangNhap, ph: b.phuHuynh || [] }));
      const dl = $("ccDsBe");
      if (dl) { dl.innerHTML = ""; dsBe.forEach(b => { const o = document.createElement("option"); o.value = b.ten; dl.appendChild(o); }); }
      return dsBe;
    });
    return hoiBe;
  }

  function moViet(san) {
    vietSan = san || null;
    if (location.hash === "#cc-viet") { hienViet(); return; }
    location.hash = "#cc-viet";
  }

  function hienViet() {
    moId = "viet";
    const san = vietSan || {}; vietSan = null;
    $("ccTrang").querySelector(".htKhung").classList.add("coThu");
    $("ccDs").querySelectorAll(".htMucThu.dangMo").forEach(x => x.classList.remove("dangMo"));
    const cot = $("ccCotThu");
    if (!matchMedia("(min-width: 900px)").matches) { try { cot.scrollIntoView({ block: "start" }); } catch (e) { /* bỏ qua */ } }
    cot.innerHTML = "";
    const dau = tao("div", "htDauThu");
    dau.appendChild(veLui());
    dau.appendChild(tao("span", "htHinhTo", "✉️"));
    const giua = tao("div", "htDauGiua");
    giua.appendChild(tao("h2", "", "Viết thư của Cô Cú"));
    giua.appendChild(tao("p", "htPhu", "Bé và phụ huynh chỉ thấy “🦉 Cô Cú”, không thấy tên bạn."));
    dau.appendChild(giua);
    cot.appendChild(dau);

    const than = tao("div", "htThan ccViet");
    const ma = maMoi();               // mã lần gửi: bấm Gửi lại (mạng chậm) không thành 2 thư
    let doiTuong = "be";
    const chon = new Set((san.be || []).filter(Boolean));

    // --- gửi cho ---
    const nhom = tao("fieldset", "ccDoiTuong");
    nhom.appendChild(tao("legend", "ccNhan", "Gửi cho"));
    DOI_TUONG.forEach(x => {
      const l = tao("label", "ccDtMuc"), r = tao("input"); r.type = "radio"; r.name = "ccDt"; r.value = x[0]; r.checked = x[0] === doiTuong;
      const chu = tao("span", "");
      chu.append(tao("b", "", x[1] + " " + x[2]), tao("small", "", x[3]));
      l.append(r, chu);
      r.addEventListener("change", () => { if (r.checked) { doiTuong = x[0]; veTheoDoiTuong(); } });
      nhom.appendChild(l);
    });
    than.appendChild(nhom);

    // --- chọn bé ---
    const khungBe = tao("div", "ccChonBe");
    khungBe.appendChild(tao("p", "ccNhan", "Chọn bé nhận thư"));
    const daChon = tao("div", "ccDaChon"); daChon.setAttribute("aria-live", "polite");
    const oTim = tao("input", "htO ccOSo"); oTim.type = "search"; oTim.placeholder = "🔎 Tìm tên bé…"; oTim.setAttribute("aria-label", "Tìm tên bé");
    const dsChon = tao("div", "ccDsChon"); dsChon.appendChild(tao("p", "htGhi", "Đang tải danh sách bé…"));
    khungBe.append(daChon, oTim, dsChon);
    than.appendChild(khungBe);

    // --- tuỳ chọn (chỉ thư cho bé) ---
    const tuy = tao("div", "ccTuyChon");
    const hop = (chu, ghi) => { const l = tao("label", "ccHop"), c = tao("input"); c.type = "checkbox"; const s = tao("span", ""); s.append(tao("b", "", chu), tao("small", "", ghi)); l.append(c, s); tuy.appendChild(l); return c; };
    const oCho = hop("🙋 Chờ con trả lời", "Bé thấy thư ở “Con cần làm” và viết lời đáp ngay trong thư.");
    const oPh = hop("👨‍👩‍👧 Phụ huynh của bé cũng thấy", "Thêm thư vào hòm của phụ huynh đang liên kết với bé.");
    oCho.checked = !!san.choTraLoi;
    than.appendChild(tuy);

    // --- tiêu đề + nội dung ---
    const max = Math.max(50, +cauHinh.do_dai_loi_co_cu || 1000);
    const lTd = tao("label", "ccNhan", "Tiêu đề (bé thấy ở danh sách thư)");
    const oTd = tao("input", "htO ccOSo"); oTd.maxLength = 120; oTd.placeholder = "Ví dụ: Cô Cú khen con chăm học"; oTd.id = "ccVietTd"; lTd.htmlFor = oTd.id;
    oTd.value = san.tieuDe || "";
    const lNd = tao("label", "ccNhan", "Nội dung");
    const oNd = tao("textarea", "htO"); oNd.rows = 5; oNd.maxLength = max; oNd.id = "ccVietNd"; lNd.htmlFor = oNd.id;
    oNd.placeholder = "Ví dụ: Tuần này con ôn bài đều lắm. Cô Cú tự hào về con!";
    const dem = tao("span", "htDem", "0 / " + max);
    oNd.addEventListener("input", () => { dem.textContent = oNd.value.length + " / " + max; loi.textContent = ""; });
    oTd.addEventListener("input", () => { loi.textContent = ""; });
    than.append(lTd, oTd, lNd, oNd, dem);

    const loi = tao("p", "htLoiViet"); loi.setAttribute("role", "alert");
    const hang = tao("div", "ccHangNut ccHangGui");
    const gui = tao("button", "htNut chinh", "📨 Gửi thư…"); gui.type = "button";
    const thoi = tao("button", "htNut phu", "Thôi"); thoi.type = "button";
    thoi.addEventListener("click", () => { if (location.hash === "#cc-viet") history.back(); else dongThu(); });
    hang.append(gui, thoi);
    than.append(loi, hang);
    cot.appendChild(than);

    function veDaChon() {
      daChon.innerHTML = "";
      if (!chon.size) { daChon.appendChild(tao("span", "htGhi", "Chưa chọn bé nào.")); return; }
      chon.forEach(ten => {
        const c = tao("button", "ccChip ccChipBo", "👧 " + ten + " ✕"); c.type = "button"; c.setAttribute("aria-label", "Bỏ chọn " + ten);
        c.addEventListener("click", () => { chon.delete(ten); veDaChon(); veDsChon(); });
        daChon.appendChild(c);
      });
    }
    function veDsChon() {
      if (!dsBe) return;
      dsChon.innerHTML = "";
      const tim = oTim.value.trim().toLowerCase();
      const hop2 = dsBe.filter(b => !tim || b.ten.toLowerCase().indexOf(tim) >= 0);
      if (!dsBe.length) { dsChon.appendChild(tao("p", "htGhi", "Không tải được danh sách bé.")); return; }
      if (!hop2.length) { dsChon.appendChild(tao("p", "htGhi", "Không có bé nào tên như vậy.")); return; }
      hop2.forEach(b => {
        const l = tao("label", "ccBeMuc"), c = tao("input"); c.type = "checkbox"; c.checked = chon.has(b.ten);
        c.addEventListener("change", () => { if (c.checked) chon.add(b.ten); else chon.delete(b.ten); veDaChon(); });
        l.append(c, tao("span", "", b.ten + (b.ph.length ? " · 👨‍👩‍👧 " + b.ph.length : "")));
        dsChon.appendChild(l);
      });
    }
    function veTheoDoiTuong() {
      const laBe = doiTuong === "be";
      khungBe.hidden = tuy.hidden = !laBe;
      dau.querySelector(".htHinhTo").textContent = laBe ? "✉️" : "📢";
      loi.textContent = "";
    }
    oTim.addEventListener("input", veDsChon);
    veDaChon(); veTheoDoiTuong();
    layDsBe().then(() => { if (moId === "viet") veDsChon(); });

    gui.addEventListener("click", () => {
      loi.textContent = "";
      const laBe = doiTuong === "be";
      const td = oTd.value.trim(), nd = oNd.value.trim();
      if (laBe && !chon.size) { loi.textContent = "Chọn ít nhất một bé nhận thư."; return; }
      if (!td) { loi.textContent = "Cần có tiêu đề."; oTd.focus(); return; }
      if (!nd) { loi.textContent = "Cần có nội dung thư."; oNd.focus(); return; }
      const ts = {
        p_doi_tuong: laBe ? { be: Array.from(chon) } : { [doiTuong]: true },
        p_tieu_de: td, p_chu: nd,
        p_cho_tra_loi: laBe && oCho.checked, p_ph_thay: laBe && oPh.checked
      };
      gui.disabled = true;
      rpcA("kc_thu_admin_viet", Object.assign({ p_chi_dem: true }, ts)).then(kq => {
        gui.disabled = false;
        if (!kq.thanhCong) { loi.textContent = "❌ " + chuLoiViet(kq); return; }
        hoiGui(kq.soNguoi, kq.loai, ts, () => rpcA("kc_thu_admin_viet", Object.assign({ p_ma: ma }, ts)).then(r => {
          if (!r.thanhCong) { loi.textContent = "❌ " + chuLoiViet(r); return false; }
          bao(r.trungLap ? "Thư này đã gửi rồi, Cô Cú không gửi lại lần 2." : "📨 Đã gửi cho " + soVN(r.soNguoi) + " người.", true);
          if (typeof window.kcCapNhatHomThu === "function") kcCapNhatHomThu();
          S.loc = "tat_ca"; veMuc(); taiDs(false);
          history.replaceState({ ccThu: 1 }, "", "#cc-" + r.thuId);
          hienThu(Number(r.thuId));
          return true;
        }));
      });
    });
    (chon.size ? oTd : nhom.querySelector("input")).focus();
  }

  function chuLoiViet(kq) {
    const t = kq.thongBao || "";
    const toiDa = /Toi da (\d+)/i.exec(t);   // số của máy chủ lúc gửi (cài đặt có thể vừa đổi)
    if (kq.soNguoi && toiDa) return "Thư này tới " + soVN(kq.soNguoi) + " người, quá mức tối đa " + soVN(toiDa[1])
      + " người mỗi thư. Muốn gửi thì nâng mức ở ⚙️ Cài đặt hòm thư.";
    if (/Khong co tai khoan/i.test(t)) return "Không có tài khoản: " + t.replace(/^.*:\s*/, "");
    if (/Khong co ai nhan/i.test(t)) return "Không có ai nhận thư này.";
    if (/Tieu de/i.test(t)) return "Tiêu đề cần 1-120 ký tự.";
    if (/Noi dung/i.test(t)) return "Nội dung quá dài (tối đa " + soVN(cauHinh.do_dai_loi_co_cu || 1000) + " ký tự).";
    return t || "Chưa gửi được";
  }

  function hoiGui(so, loai, ts, lam) {
    const man = tao("div", "htMan"); man.setAttribute("role", "dialog"); man.setAttribute("aria-modal", "true"); man.setAttribute("aria-label", "Xác nhận gửi thư");
    const hop = tao("div", "htHopXoa");
    hop.appendChild(tao("div", "htCuTo", loai === "tin" ? "📢" : "✉️"));
    hop.appendChild(tao("h3", "", "Gửi cho " + soVN(so) + " người?"));
    const dt = ts.p_doi_tuong.be ? ts.p_doi_tuong.be.join(", ") + (ts.p_ph_thay ? " + phụ huynh" : "")
      : (DOI_TUONG.find(x => ts.p_doi_tuong[x[0]]) || [])[2];
    hop.appendChild(tao("p", "", "“" + ts.p_tieu_de + "” · " + dt + (ts.p_cho_tra_loi ? " · 🙋 chờ con trả lời" : "")));
    const hang = tao("div", "htHangNut");
    const thoi = tao("button", "htNut phu", "Thôi"); thoi.type = "button";
    const ok = tao("button", "htNut chinh", "📨 Gửi"); ok.type = "button";
    hang.append(thoi, ok); hop.appendChild(hang); man.appendChild(hop);
    const dong = () => { man.remove(); document.removeEventListener("keydown", phim); };
    const phim = e => { if (e.key === "Escape" && !ok.disabled) dong(); };
    document.addEventListener("keydown", phim);
    man.addEventListener("click", e => { if (e.target === man && !ok.disabled) dong(); });
    thoi.addEventListener("click", dong);
    ok.addEventListener("click", () => {
      ok.disabled = thoi.disabled = true; ok.textContent = "Đang gửi…";
      Promise.resolve(lam()).then(dong, dong);
    });
    document.body.appendChild(man);
    ok.focus();
  }

  // ---------- 🗑 / ⛔ xoá ----------
  function veXoa(t) {
    const hang = tao("div", "ccHangNut ccXoa");
    const x1 = tao("button", "htNut phu", "🗑 Xoá khỏi Hộp Cô Cú"); x1.type = "button";
    x1.addEventListener("click", () => hoiXoa(t, false));
    const x2 = tao("button", "htNut do", "⛔ Xoá hẳn với mọi người"); x2.type = "button";
    if (t.loai === "khang_nghi" && t.trang_thai === "mo") { x2.disabled = true; x2.title = "Kháng nghị chưa xử lý: không xoá hẳn được"; }
    x2.addEventListener("click", () => hoiXoa(t, true));
    hang.append(x1, x2);
    if (x2.disabled) hang.appendChild(tao("span", "htGhi", "Kháng nghị chưa xử lý thì chưa xoá hẳn được."));
    return hang;
  }

  function hoiXoa(t, het) {
    const man = tao("div", "htMan"); man.setAttribute("role", "dialog"); man.setAttribute("aria-modal", "true"); man.setAttribute("aria-label", "Xoá thư");
    const hop = tao("div", "htHopXoa");
    hop.appendChild(tao("div", "htCuTo", het ? "⛔" : "🗑"));
    hop.appendChild(tao("h3", "", het ? "Xoá hẳn thư này với mọi người?" : "Xoá thư khỏi Hộp Cô Cú?"));
    hop.appendChild(tao("p", "", het ? "Thư mất khỏi hòm của bé, phụ huynh và mọi admin. Không lấy lại được."
      : "Thư mất khỏi hộp của mọi admin. Bé và phụ huynh vẫn còn thư. Không lấy lại được."));
    const hang = tao("div", "htHangNut");
    const thoi = tao("button", "htNut phu", "Thôi"); thoi.type = "button";
    const xoa = tao("button", "htNut do", het ? "⛔ Xoá hẳn" : "🗑 Xoá"); xoa.type = "button";
    hang.append(thoi, xoa); hop.appendChild(hang); man.appendChild(hop);
    const dong = () => { man.remove(); document.removeEventListener("keydown", phim); };
    const phim = e => { if (e.key === "Escape") dong(); };
    document.addEventListener("keydown", phim);
    man.addEventListener("click", e => { if (e.target === man) dong(); });
    thoi.addEventListener("click", dong);
    xoa.addEventListener("click", () => {
      xoa.disabled = thoi.disabled = true;
      rpcA("kc_thu_admin_xoa", { p_thu_id: t.id, p_het: het }).then(r => {
        dong();
        if (!r.thanhCong && r.ma !== "khong_co") { bao("❌ " + (r.thongBao || "Chưa xoá được")); return; }
        ds = ds.filter(x => x.id !== t.id); veDs();
        if (/^#cc-/.test(location.hash)) history.back(); else dongThu();
        bao(het ? "⛔ Đã xoá hẳn thư." : "🗑 Đã xoá khỏi Hộp Cô Cú.");
        lamMoi(null);
      });
    });
    document.body.appendChild(man);
    thoi.focus();
  }

  // ================================================================
  // KHỞI ĐỘNG (chỉ admin)
  // ================================================================
  function ganBoLoc() {
    const oLoai = $("ccLoai"), oBe = $("ccBe"), oTim = $("ccTim");
    const loc = () => { S.loai = oLoai.value; S.be = oBe.value.trim(); S.tim = oTim.value.trim(); $("ccBoLoc").hidden = !(S.loai || S.be || S.tim); taiDs(false); };
    oLoai.addEventListener("change", loc);
    [oBe, oTim].forEach(o => o.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); loc(); } }));
    $("ccLoc").addEventListener("click", loc);
    $("ccBoLoc").addEventListener("click", () => { oLoai.value = ""; oBe.value = ""; oTim.value = ""; loc(); });
    $("ccMuc").querySelectorAll("[role=tab]").forEach(b => b.addEventListener("click", () => { S.loc = b.dataset.loc; veMuc(); taiDs(false); }));
    $("ccThem").addEventListener("click", () => taiDs(true));
    $("ccVietNut").addEventListener("click", () => moViet(null));
    // KC_12D2: Quản trị › 💡 / 📮 dẫn sang với ?loai=…&be=…&loc=…
    try {
      const q = new URLSearchParams(location.search);
      if (q.get("loai") && [...oLoai.options].some(o => o.value === q.get("loai"))) oLoai.value = q.get("loai");
      if (q.get("be")) oBe.value = q.get("be").slice(0, 60);
      if (LOC.some(l => l[0] === q.get("loc"))) S.loc = q.get("loc");
      S.loai = oLoai.value; S.be = oBe.value.trim();
      $("ccBoLoc").hidden = !(S.loai || S.be);
    } catch (e) { /* bỏ qua */ }
    oBe.addEventListener("focus", () => layDsBe(), { once: true });
  }

  document.addEventListener("kcHomThuDem", e => { const kq = e.detail || {}; if (tk && kq.coCu) veSoChuyen(kq.coCu.cho); });

  document.addEventListener("kcSanSang", e => {
    if (!e.detail || !e.detail.daDangNhap) return;
    const lan2 = !!tk;
    if (e.detail.taiKhoan.vaiTro !== "admin") return;
    tk = e.detail.taiKhoan;
    if (lan2) return;
    $("ccChuyen").hidden = false;
    $("ccChuyen").querySelectorAll("button").forEach(b => b.addEventListener("click", () => datCheDo(b.dataset.che)));
    ganBoLoc();
    window.addEventListener("hashchange", theoDuongDan);
    let lucAn = 0;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") lucAn = Date.now();
      else if (cheDo === "cc" && lucAn && Date.now() - lucAn > 30000) { taiDs(false); if (typeof moId === "number") hienThu(moId); }
    });
    const h = location.hash;
    if (/^#cc-(\d+|viet)$/.test(h) && !(history.state && history.state.ccThu)) {
      history.replaceState(null, "", location.pathname + location.search);
      history.pushState({ ccThu: 1 }, "", h);
    }
    datCheDo(/^#thu-\d+$/.test(h) ? "rieng" : "cc");
    taiDs(false);
  });
})();
// 28/11/2026 - BƯỚC: KC_12D1 (tạo mới: 🦉 Hộp Cô Cú cho admin trong trang Hòm thư)
// 28/11/2026 - BƯỚC: KC_12D2 (✉️ / 📢 viết thư mới, gợi ý tên bé, bộ lọc từ đường dẫn, nút ⚙️ Cài đặt hòm thư)
