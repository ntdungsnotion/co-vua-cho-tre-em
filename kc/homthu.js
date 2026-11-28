/* ================================================================
   FILE: homthu.js
   CHỨC NĂNG: TRANG 📬 HÒM THƯ (homthu_NC.html) cho bé + phụ huynh (+ hộp riêng của admin).
              Đặc tả: Thiet_Ke_Hom_Thu.md bản 1.1 mục 9.2 / 9.3 (repo riêng). Máy chủ: SQL kc12b.
   RPC (trang tự thêm p_ten + p_ma_phien; máy chủ kiểm quyền ở MỌI thao tác, không có quyền = "khong_co"):
     kc_thu_ds(p_loc, p_be, p_truoc_luc, p_truoc_id)  danh sách tóm tắt 20 thư / trang; trả con (phụ huynh) + tiep
     kc_thu_xem(p_thu_id)     thư + các lời + quyen {viet, nhan, guiLyDo, doDaiLoi} + khangNghi; đánh dấu đã đọc
     kc_thu_viet(p_thu_id, p_chu)  bé trả lời (thư ý tưởng của mình / thư Cô Cú chờ trả lời); máy chủ lọc chữ
     kc_thu_nhan(p_thu_id)    🎁 Nhận: chỉ chạy hiệu ứng (máy chủ đã cộng lúc cấp), trả diemSo + viVang mới
     kc_thu_xoa(p_thu_id)     xoá khỏi hòm của mình (xoá hẳn), không đổi nghiệp vụ
     kc_kn_gui                (qua hộp chung/khang_nghi.js) bé gửi phản hồi kháng nghị
   NHÃN cho bé: 🙋 Con cần làm · 📬 Thư mới · ⏳ Cô Cú đang xem · ✅ Đã xong. Không hiện tên admin, chữ kỹ thuật.
   CHỮ do người viết: luôn textContent (không innerHTML).
   ĐƯỜNG DẪN: homthu_NC.html#thu-<id> mở thẳng một thư (nút Back của máy quay về danh sách).
   ĐIỆN THOẠI: danh sách, chạm mở thư toàn màn hình. MÁY TÍNH (≥ 900 px): hai cột (homthu.css).
   BƯỚC: KC_12C1 · NGÀY: 28/11/2026
   ================================================================ */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const tao = (the, lop, chu) => { const e = document.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; };
  const HINH_LOAI = { y_tuong: "💡", khang_nghi: "📮", cap_thuong: "🎁", co_cu: "✉️", tin: "📢" };
  const LUC_DO = { "dang_nhap": "Con đăng nhập lại nhé!", "khong_co": "Thư này không còn nữa." };

  let tk = null, vai = "be", loc = "can_xem", be = null, ds = [], tiep = null, dangTai = false, moId = null, thuMo = null;

  const rpc = (ham, ts) => kcGoiRpc(ham, Object.assign({ p_ten: tk.tenDangNhap, p_ma_phien: tk.maPhien || "" }, ts || {}));
  const laPh = () => vai === "phu_huynh";

  // ---------- giờ ----------
  function gio(iso, du) {
    const d = new Date(iso); if (isNaN(d)) return "";
    const h = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    const n = ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2);
    const homNay = new Date().toDateString() === d.toDateString();
    return du ? (homNay ? "hôm nay " + h : n + " " + h) : (homNay ? h : n);
  }

  // ---------- nhãn ----------
  function nhanCua(t) {
    if (t.viecCho && t.viecCho !== "xu_ly" && t.vai !== "phu_huynh") return ["🙋", laPh() ? "Cần làm" : "Con cần làm", "can"];
    if (t.chuaDoc) return ["📬", "Thư mới", "moi"];
    if (t.trangThai === "mo") return ["⏳", "Cô Cú đang xem", "dang"];
    return ["✅", "Đã xong", "xong"];
  }
  const hinhCua = t => (t.duLieu && t.duLieu.bieuTuong) || HINH_LOAI[t.loai] || "📬";

  // ---------- thông báo nhỏ dưới màn ----------
  let henBao = 0;
  function bao(chu, vui) {
    let o = $("htBao");
    if (!o) { o = tao("div", "htBao"); o.id = "htBao"; o.setAttribute("role", "status"); document.body.appendChild(o); }
    o.textContent = chu; o.classList.toggle("vui", !!vui); o.classList.add("hien");
    clearTimeout(henBao); henBao = setTimeout(() => o.classList.remove("hien"), 3200);
  }

  // ================================================================
  // DANH SÁCH
  // ================================================================
  function taiDs(them) {
    if (dangTai) return Promise.resolve();
    dangTai = true;
    const vung = $("htDs");
    if (!them) { ds = []; tiep = null; vung.innerHTML = ""; vung.appendChild(tao("p", "htCho", "Cô Cú đang mang thư tới…")); }
    const ts = { p_loc: loc, p_be: be };
    if (them && tiep) { ts.p_truoc_luc = tiep.luc; ts.p_truoc_id = tiep.id; }
    return rpc("kc_thu_ds", ts).then(kq => {
      dangTai = false;
      if (!kq || !kq.thanhCong) {
        if (!them) { vung.innerHTML = ""; vung.appendChild(tao("p", "htCho", (kq && LUC_DO[kq.ma]) || "Hòm thư chưa mở được, con thử lại sau nhé.")); }
        return;
      }
      if (laPh()) veChonCon(kq.con || []);
      ds = ds.concat(kq.ds || []);
      tiep = kq.tiep || null;
      veDs();
    }, () => { dangTai = false; });
  }

  function veDs() {
    const vung = $("htDs");
    vung.innerHTML = "";
    if (!ds.length) {
      const rong = tao("div", "htRong");
      rong.appendChild(tao("div", "htCuTo", loc === "can_xem" ? "🎉" : "🦉"));
      rong.appendChild(tao("p", "", loc === "can_xem" ? (laPh() ? "Đã xem hết thư rồi." : "Con đã xem hết thư rồi! Giỏi quá!")
        : loc === "xong" ? "Chưa có thư nào xong." : "Chưa có thư nào. Cô Cú sẽ mang thư tới khi có tin vui!"));
      vung.appendChild(rong);
    }
    ds.forEach(t => vung.appendChild(veMuc(t)));
    $("htThem").hidden = !tiep;
  }

  function veMuc(t) {
    const n = nhanCua(t);
    const b = tao("button", "htMucThu" + (t.chuaDoc ? " chuaDoc" : "") + (t.id === moId ? " dangMo" : ""));
    b.type = "button"; b.dataset.id = t.id;
    b.appendChild(tao("span", "htHinh", hinhCua(t)));
    const giua = tao("span", "htGiua");
    giua.appendChild(tao("span", "htTieuDe", t.tieuDe || "Thư"));
    const phu = tao("span", "htPhu");
    phu.appendChild(tao("span", "htNhan " + n[2], n[0] + " " + n[1]));
    if (laPh() && !be && t.be) phu.appendChild(tao("span", "htCon", "👧 " + t.be));
    giua.appendChild(phu);
    b.appendChild(giua);
    b.appendChild(tao("span", "htGio", gio(t.capNhat)));
    b.setAttribute("aria-label", (t.tieuDe || "Thư") + ", " + n[1]);
    b.addEventListener("click", () => moThu(t.id));
    return b;
  }

  function capNhatMuc(id, doi) {
    const t = ds.find(x => x.id === id);
    if (t) Object.assign(t, doi);
    const cu = $("htDs").querySelector('.htMucThu[data-id="' + id + '"]');
    if (cu && t) cu.replaceWith(veMuc(t));
  }

  function veChonCon(con) {
    const vung = $("htChonCon");
    if (!con.length) { vung.hidden = true; return; }
    if (vung.dataset.ve === con.join("|")) return;
    vung.dataset.ve = con.join("|");
    vung.innerHTML = "";
    [null].concat(con).forEach(ten => {
      const b = tao("button", "htNutCon", ten ? "👧 " + ten : "👨‍👩‍👧 Tất cả các con");
      b.type = "button"; b.setAttribute("aria-pressed", String(ten === be));
      b.addEventListener("click", () => {
        be = ten;
        vung.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
        taiDs(false);
      });
      vung.appendChild(b);
    });
    vung.hidden = false;
  }

  // ================================================================
  // MỞ THƯ
  // ================================================================
  function moThu(id) {
    const h = "#thu-" + id;
    if (location.hash === h) { hienThu(id); return; }
    location.hash = h;  // hashchange -> hienThu (Back của máy quay về danh sách)
  }

  function dongThu() {
    moId = null; thuMo = null;
    try { if (window.KC_AM_THANH) KC_AM_THANH.dung(); } catch (e) { /* bỏ qua */ }
    $("htTrang").querySelector(".htKhung").classList.remove("coThu");
    const cot = $("htCotThu"); cot.innerHTML = "";
    const trong = tao("div", "htTrongThu");
    trong.appendChild(tao("div", "htCuTo", "🦉"));
    trong.appendChild(tao("p", "", laPh() ? "Chạm vào một thư để đọc." : "Con chạm vào một thư để đọc nhé!"));
    cot.appendChild(trong);
    $("htDs").querySelectorAll(".htMucThu.dangMo").forEach(x => x.classList.remove("dangMo"));
  }

  function theoDuongDan() {
    const m = /^#thu-(\d+)$/.exec(location.hash);
    if (m) hienThu(Number(m[1])); else dongThu();
  }

  function hienThu(id) {
    moId = id;
    try { if (window.KC_AM_THANH) KC_AM_THANH.dung(); } catch (e) { /* bỏ qua */ }
    $("htTrang").querySelector(".htKhung").classList.add("coThu");
    $("htDs").querySelectorAll(".htMucThu").forEach(x => x.classList.toggle("dangMo", Number(x.dataset.id) === id));
    const cot = $("htCotThu");
    // điện thoại: thư thay chỗ danh sách -> cuộn lên đầu thư
    if (!matchMedia("(min-width: 900px)").matches) { try { cot.scrollIntoView({ block: "start" }); } catch (e) { /* bỏ qua */ } }
    cot.innerHTML = "";
    cot.appendChild(veDauThu(null));
    cot.appendChild(tao("p", "htCho", "Đang mở thư…"));
    return rpc("kc_thu_xem", { p_thu_id: id }).then(kq => {
      if (moId !== id) return;
      if (!kq || !kq.thanhCong) {
        cot.innerHTML = ""; cot.appendChild(veDauThu(null));
        cot.appendChild(tao("p", "htCho", (kq && LUC_DO[kq.ma]) || "Chưa mở được thư, con thử lại nhé."));
        if (kq && kq.ma === "khong_co") { ds = ds.filter(x => x.id !== id); veDs(); }
        return;
      }
      thuMo = kq;
      veThu(kq);
      const t = ds.find(x => x.id === id);
      if (t && t.chuaDoc) { capNhatMuc(id, { chuaDoc: false }); kcCapNhatHomThu(); }
    });
  }

  function veDauThu(kq) {
    const dau = tao("div", "htDauThu");
    const lui = tao("button", "htLui", "‹"); lui.type = "button"; lui.setAttribute("aria-label", "Quay lại danh sách thư");
    lui.addEventListener("click", () => { if (/^#thu-/.test(location.hash)) history.back(); else dongThu(); });
    dau.appendChild(lui);
    if (!kq) return dau;
    const t = kq.thu;
    dau.appendChild(tao("span", "htHinhTo", hinhCua(t)));
    const giua = tao("div", "htDauGiua");
    giua.appendChild(tao("h2", "", t.tieuDe || "Thư"));
    const n = nhanCua(Object.assign({}, t, { chuaDoc: false }));
    const phu = tao("p", "htPhu");
    phu.appendChild(tao("span", "htNhan " + n[2], n[0] + " " + n[1]));
    if (laPh() && t.be) phu.appendChild(tao("span", "htCon", "👧 " + t.be));
    giua.appendChild(phu);
    dau.appendChild(giua);
    const nut = tao("div", "htDauNut");
    if (window.KC_AM_THANH && "speechSynthesis" in window) {
      const nghe = tao("button", "htNutTron", "🔊"); nghe.type = "button";
      nghe.title = laPh() ? "Đọc thư" : "Đọc cho con nghe"; nghe.setAttribute("aria-label", nghe.title);
      nghe.addEventListener("click", () => docThu(kq, nghe));
      nut.appendChild(nghe);
    }
    const xoa = tao("button", "htNutTron xoa", "🗑"); xoa.type = "button";
    xoa.title = "Xoá thư"; xoa.setAttribute("aria-label", "Xoá thư");
    xoa.addEventListener("click", () => hoiXoa(kq));
    nut.appendChild(xoa);
    dau.appendChild(nut);
    return dau;
  }

  function veThu(kq) {
    const cot = $("htCotThu"), t = kq.thu, d = t.duLieu || {};
    cot.innerHTML = "";
    cot.appendChild(veDauThu(kq));
    const than = tao("div", "htThan");
    // quà kèm thư (cấp thưởng / kháng nghị được bù)
    if ((t.loai === "cap_thuong" || d.capThuong) && (+d.kc > 0 || +d.vang > 0)) {
      const qua = tao("div", "htQua");
      if (+d.kc > 0) qua.appendChild(tao("b", "", "+" + d.kc + " 💎"));
      if (+d.vang > 0) qua.appendChild(tao("b", "", "+" + d.vang + " 🪙"));
      than.appendChild(qua);
    }
    const hoi = tao("div", "htHoiThoai");
    (kq.loi || []).forEach(l => hoi.appendChild(veLoi(l)));
    if (!(kq.loi || []).length) hoi.appendChild(tao("p", "htSuKien", t.tieuDe || ""));
    than.appendChild(hoi);
    cot.appendChild(than);
    const viec = veViec(kq);
    if (viec) cot.appendChild(viec);
  }

  function veLoi(l) {
    if (l.kieu === "su_kien" || l.tu === "he_thong") {
      const s = tao("div", "htSuKien");
      s.appendChild(tao("span", "", l.chu));
      return s;
    }
    const cua = l.tu === "toi" ? "toi" : l.tu === "co_cu" ? "cocu" : "nguoi";
    const hang = tao("div", "htLoi " + cua);
    if (cua !== "toi") hang.appendChild(tao("span", "htAi", cua === "cocu" ? "🦉" : "🙂"));
    const bong = tao("div", "htBong");
    if (cua === "cocu") bong.appendChild(tao("span", "htTen", "Cô Cú"));
    else if (cua === "nguoi" && l.ten) bong.appendChild(tao("span", "htTen", l.ten));
    bong.appendChild(tao("p", "", l.chu));
    bong.appendChild(tao("span", "htGioLoi", gio(l.luc, true)));
    hang.appendChild(bong);
    return hang;
  }

  // ---------- việc trong thư: 🎁 Nhận · 🙋 Gửi phản hồi · trả lời ----------
  function veViec(kq) {
    const q = kq.quyen || {}, t = kq.thu, d = t.duLieu || {};
    if (laPh()) return null;
    const vung = tao("div", "htViec");
    if (q.nhan) {
      const b = tao("button", "htNut vang", "🎁 Nhận quà"); b.type = "button";
      b.addEventListener("click", () => nhanQua(t.id, b));
      vung.appendChild(b);
    }
    if (q.guiLyDo && kq.khangNghi && window.KC_KHANG_NGHI) {
      const k = kq.khangNghi;
      if (k.han) vung.appendChild(tao("p", "htGhi", "Con gửi được tới hết ngày " + gio(k.han).replace(/^\d\d:\d\d$/, "hôm nay") + "."));
      const b = tao("button", "htNut chinh", "🙋 Con kể Cô Cú nghe"); b.type = "button";
      b.addEventListener("click", () => {
        KC_KHANG_NGHI.moHop({ rpc, nguon: k.nguon, thamChieu: k.thamChieu, cauHoi: d.cauHoi, moTa: d.ten ? d.ten.charAt(0).toUpperCase() + d.ten.slice(1) : "",
                              toiThieu: k.toiThieu, toiDa: k.toiDa })
          .then(r => { if (r && r.daGui) { hienThu(t.id); taiDs(false); kcCapNhatHomThu(); } });
      });
      vung.appendChild(b);
    }
    if (q.viet) vung.appendChild(veOViet(t, q));
    return vung.childNodes.length ? vung : null;
  }

  function veOViet(t, q) {
    const max = Math.max(20, +q.doDaiLoi || 300);
    const khung = tao("div", "htViet");
    const o = tao("textarea", "htO"); o.rows = 3; o.maxLength = max;
    o.placeholder = t.loai === "y_tuong" ? "Con muốn kể thêm gì với Cô Cú không?" : "Con trả lời Cô Cú nhé…";
    o.setAttribute("aria-label", "Lời của con");
    const duoi = tao("div", "htVietDuoi");
    const dem = tao("span", "htDem", "0 / " + max);
    const gui = tao("button", "htNut chinh", "📨 Gửi Cô Cú"); gui.type = "button"; gui.disabled = true;
    const loi = tao("p", "htLoiViet"); loi.setAttribute("role", "alert");
    o.addEventListener("input", () => { dem.textContent = o.value.length + " / " + max; gui.disabled = !o.value.trim(); loi.textContent = ""; });
    o.addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !gui.disabled) gui.click(); });
    gui.addEventListener("click", () => {
      const chu = o.value.trim(); if (!chu) return;
      gui.disabled = true; o.disabled = true; gui.textContent = "Đang gửi…";
      rpc("kc_thu_viet", { p_thu_id: t.id, p_chu: chu }).then(kq => {
        if (kq && kq.thanhCong) {
          bao("💌 Cô Cú nhận được lời của con rồi!", true);
          hienThu(t.id); taiDs(false);
          return;
        }
        o.disabled = false; gui.disabled = false; gui.textContent = "📨 Gửi Cô Cú";
        const ma = kq && kq.ma;
        loi.textContent = ma === "loc" ? "🦉 Con viết lại bằng lời khác nhé."
          : ma === "qua_ngay" ? "Hôm nay con viết đủ " + (kq.toiDa || "") + " lời rồi, mai con viết tiếp nhé!"
          : ma === "dai" ? "Dài quá rồi, con viết ngắn hơn nhé (tối đa " + (kq.toiDa || max) + " chữ)."
          : ma === "tat" ? "Hòm thư đang tạm nghỉ, con gửi sau nhé."
          : ma === "khong_duoc" || ma === "khong_co" ? "Thư này không trả lời được nữa."
          : "Chưa gửi được, con thử lại nhé.";
      });
    });
    duoi.append(dem, gui);
    khung.append(o, duoi, loi);
    return khung;
  }

  function nhanQua(id, nut) {
    nut.disabled = true;
    rpc("kc_thu_nhan", { p_thu_id: id }).then(kq => {
      if (!kq || !kq.thanhCong) { nut.disabled = false; bao("Chưa nhận được, con thử lại nhé."); return; }
      const kc = +kq.kc || 0, vang = +kq.vang || 0;
      if (typeof window.kcCapNhatTui === "function") {
        const so = {}; if (typeof kq.diemSo === "number") so.diemSo = kq.diemSo; if (typeof kq.viVang === "number") so.viVang = kq.viVang;
        kcCapNhatTui(so);
      }
      if (kq.lanDau) {
        try { if (window.KC_AM_THANH) KC_AM_THANH.tieng.thuong(); } catch (e) { /* bỏ qua */ }
        if (kc > 0) mua(Math.min(24, 6 + kc * 2));
        const chu = []; if (kc > 0) chu.push(kc + " 💎"); if (vang > 0) chu.push(vang + " 🪙");
        bao("🎉 Con nhận được " + (chu.join(" + ") || "quà") + "!", true);
      } else bao("Quà đã vào túi con rồi nhé!", true);
      hienThu(id);
      capNhatMuc(id, { viecCho: null, chuaDoc: false });
      kcCapNhatHomThu();
    });
  }

  function mua(soHat) {
    try { if (matchMedia("(prefers-reduced-motion: reduce)").matches) return; } catch (e) { /* bỏ qua */ }
    for (let i = 0; i < soHat; i++) {
      const h = tao("span", "htHat", "💎");
      h.style.left = (Math.random() * 92 + 2) + "vw";
      h.style.animationDelay = (Math.random() * 0.6) + "s";
      h.style.fontSize = (1.2 + Math.random() * 1.2) + "rem";
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 2600);
    }
  }

  // ---------- 🔊 đọc thư ----------
  function docThu(kq, nut) {
    const A = window.KC_AM_THANH;
    if (A.dangDoc && A.dangDoc()) { A.dung(); nut.classList.remove("dangDoc"); return; }
    const phan = [kq.thu.tieuDe || ""];
    (kq.loi || []).forEach(l => {
      const ai = l.kieu === "su_kien" || l.tu === "he_thong" ? "" : l.tu === "co_cu" ? "Cô Cú nói: " : l.tu === "toi" ? (laPh() ? "Bạn viết: " : "Con viết: ") : (l.ten ? l.ten + " viết: " : "");
      phan.push(ai + l.chu);
    });
    nut.classList.add("dangDoc");
    const ok = A.doc(phan.filter(Boolean).join(". "), { lang: "vi-VN", khiXong: () => nut.classList.remove("dangDoc") });
    if (!ok) { nut.classList.remove("dangDoc"); if (!A.dangBat()) bao("Tiếng đang tắt. Con bật tiếng ở trò chơi nhé."); }
  }

  // ---------- 🗑 xoá (hỏi lại) ----------
  function hoiXoa(kq) {
    const t = kq.thu, v = t.viecCho;
    const them = v === "gui_ly_do" ? "Con sẽ không gửi phản hồi cho Cô Cú được nữa."
      : v === "tra_loi" ? "Con sẽ không trả lời Cô Cú được nữa."
      : v === "nhan" ? "Quà vẫn ở trong túi con, chỉ mất thư thôi." : "";
    const man = tao("div", "htMan"); man.setAttribute("role", "dialog"); man.setAttribute("aria-modal", "true"); man.setAttribute("aria-label", "Xoá thư");
    const hop = tao("div", "htHopXoa");
    hop.appendChild(tao("div", "htCuTo", "🗑"));
    hop.appendChild(tao("h3", "", laPh() ? "Xoá thư này nhé?" : "Con xoá thư này nhé?"));
    hop.appendChild(tao("p", "", "Xoá rồi là mất luôn." + (them ? " " + them : "")));
    const hang = tao("div", "htHangNut");
    const thoi = tao("button", "htNut phu", "Thôi"); thoi.type = "button";
    const xoa = tao("button", "htNut do", "🗑 Xoá"); xoa.type = "button";
    hang.append(thoi, xoa); hop.appendChild(hang); man.appendChild(hop);
    const dong = () => { man.remove(); document.removeEventListener("keydown", phim); };
    const phim = e => { if (e.key === "Escape") dong(); };
    document.addEventListener("keydown", phim);
    man.addEventListener("click", e => { if (e.target === man) dong(); });
    thoi.addEventListener("click", dong);
    xoa.addEventListener("click", () => {
      xoa.disabled = thoi.disabled = true;
      rpc("kc_thu_xoa", { p_thu_id: t.id }).then(r => {
        dong();
        if (!r || (!r.thanhCong && r.ma !== "khong_co")) { bao("Chưa xoá được, con thử lại nhé."); return; }
        ds = ds.filter(x => x.id !== t.id); veDs();
        if (/^#thu-/.test(location.hash)) history.back(); else dongThu();
        bao("Đã xoá thư.");
        kcCapNhatHomThu();
      });
    });
    document.body.appendChild(man);
    thoi.focus();
  }

  // ================================================================
  // KHỞI ĐỘNG
  // ================================================================
  function chonMuc(b) {
    loc = b.dataset.loc;
    document.querySelectorAll(".htMuc [role=tab]").forEach(x => x.setAttribute("aria-selected", String(x === b)));
    taiDs(false);
  }

  // Admin: hộp riêng + lối tạm sang Quản trị (Hộp Cô Cú ở KC_12D). Số do kc_auth.js hỏi (sự kiện kcHomThuDem).
  document.addEventListener("kcHomThuDem", e => {
    // dùng kcTaiKhoanHienTai: số có thể về TRƯỚC sự kiện kcSanSang
    const kq = e.detail || {}, vung = $("htCoCu"), ai = window.kcTaiKhoanHienTai || tk;
    if (!vung || !ai || ai.vaiTro !== "admin" || !kq.coCu) return;
    vung.innerHTML = "";
    vung.appendChild(tao("span", "htCuTo", "🦉"));
    const p = tao("p", "");
    p.appendChild(tao("b", "", "Hộp Cô Cú: " + (+kq.coCu.cho || 0) + " thư đang chờ xử lý. "));
    p.appendChild(document.createTextNode("Trang trả lời thư cho các bé sắp có ở đây; tạm thời xử lý ở Quản trị › 💡 Ý tưởng và 📮 Bé kháng nghị. Dưới đây là hòm thư riêng của tài khoản này."));
    vung.appendChild(p);
    const a = tao("a", "htNut chinh", "🛠️ Mở Quản trị"); a.href = "quantri_NC.html";
    vung.appendChild(a);
    vung.hidden = false;
  });

  document.addEventListener("kcSanSang", e => {
    if (!e.detail || !e.detail.daDangNhap) return;
    const lan2 = !!tk;
    tk = e.detail.taiKhoan;
    vai = tk.vaiTro === "phu_huynh" ? "phu_huynh" : tk.vaiTro === "admin" ? "admin" : "be";
    if (lan2) return;
    document.querySelectorAll("[data-chu-be]").forEach(s => { s.textContent = laPh() ? s.dataset.chuPh : s.dataset.chuBe; });
    document.querySelectorAll(".htMuc [role=tab]").forEach(b => b.addEventListener("click", () => chonMuc(b)));
    $("htThem").addEventListener("click", () => taiDs(true));
    window.addEventListener("hashchange", theoDuongDan);
    let lucAn = 0;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") lucAn = Date.now();
      else if (lucAn && Date.now() - lucAn > 30000) { taiDs(false); if (moId) hienThu(moId); }
    });
    const moThang = location.hash;
    if (/^#thu-\d+$/.test(moThang) && !(history.state && history.state.htThu)) {
      history.replaceState(null, "", location.pathname + location.search);
      history.pushState({ htThu: 1 }, "", moThang);
    }
    taiDs(false).then(theoDuongDan);
  });
})();
// 28/11/2026 - BƯỚC: KC_12C1 (tạo mới: trang Hòm thư bé / phụ huynh)
// 28/11/2026 - BƯỚC: KC_12C2 (mở thẳng một thư thì ‹ / Back về danh sách thư)
