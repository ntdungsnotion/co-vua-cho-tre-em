// ================================================================
// FILE: kc/qt_bam_bua.js
// CHỨC NĂNG: Quản trị chung › 🧠 CHỐNG BẤM BỪA (KC_11E; đặc tả repo riêng Thiet_Ke_Chong_Bam_Bua.md mục 9, 10).
//   - ⚙️ Cấu hình: mọi số của module (chế độ chung + từng nơi, chạm, D3, kết luận lượt, lời Cô Cú nhắc, phản hồi, phụ huynh,
//     ngưỡng gợi ý). Ô khác mặc định viền cam + nút ↺. Máy chủ kiểm trước khi lưu: sai thì tô đỏ đúng ô, không lưu gì.
//     Lịch sử 30 bản, "↩️ Dùng lại bản này".
//   - 📊 Thống kê 7 / 30 ngày theo nơi: số lượt, % ⛔, bị cắt, ⛔ không cắt (chỉ ghi / nhắc), D1 / D2 / D3; câu có / không dấu hiệu
//     (tỉ lệ đúng), phân bố số chạm thừa và giây.
//   - 📈 Kháng nghị "chọn vội" theo nơi + theo dấu hiệu, tỉ lệ chấp nhận; gợi ý ô nên chỉnh (bấm "Sửa ô này" nhảy tới ô).
//   Số admin sửa đến trang của bé kèm lượt (luot.bb, kc_tt_luot_json) -> hộp câu hỏi dùng ngay từ lượt kế tiếp.
// RPC: kc_bb_admin_doc, kc_bb_admin_luu, kc_bb_admin_hoan_tac, kc_bb_admin_thong_ke (SQL repo riêng supabase_kc11e_quan_tri_bb.sql).
// PHỤ THUỘC: ../admin_NC.js (adminGoiRpc, adminBaoTin), khung adminManHinh trong quantri_NC.html.
// ĐIỆN THOẠI: ô xếp một cột, bảng cuộn ngang. MÁY TÍNH: ô 2-3 cột, bảng rộng.
// BƯỚC: KC_11E - NGÀY: 28/11/2026
// ================================================================
(function () {
  "use strict";
  if (typeof adminGoiRpc !== "function") return;
  var MAN = "bambua";
  var S = { tab: "ch", ngay: 7, d: null, form: null, loi: {}, tk: null };

  var CHE_DO = [["day_du", "⛔ Đầy đủ: ghi + nhắc + cắt thưởng"], ["nhac", "💬 Ghi + Cô Cú nhắc (không cắt)"], ["chi_ghi", "📝 Chỉ ghi (bé không thấy gì)"], ["tat", "⏸ Tắt hẳn"]];
  var TEN_CD = { day_du: "Đầy đủ", nhac: "Ghi + nhắc", chi_ghi: "Chỉ ghi", tat: "Tắt" };
  var NOI = [["theo_mon", "📚 Theo môn"], ["tong_hop", "🌈 Tổng hợp"], ["on_sau_tran", "⚔️ Ôn sau trận"], ["toc_do", "⚡ Tốc độ"], ["chinh_phuc", "🏆 Chinh phục"]];
  var TEN_NOI = {}; NOI.forEach(function (n) { TEN_NOI[n[0]] = n[1]; });
  var TEN_DH = { D1: "D1 · Bấm dồn", D2: "D2 · Chạm tức thì", D3: "D3 · Nhanh như đoán mò" };
  // kieu: so (số), pt (tỉ lệ 0-1 hiện thành %), bat (bật / tắt), chu (chữ), ds (mỗi dòng một lời)
  var NHOM = [
    { ten: "👆 Chạm (D1 bấm dồn, D2 chạm tức thì)", o: [
      ["cham.cham_thua_toi_thieu", "so", "Số chạm thừa tối thiểu (D1)", "Bé chạm thừa từ ngần này lần trở lên, cách nhau không quá \"giây coi là dồn\", thì câu có D1.", 1],
      ["cham.giay_don", "so", "Giây coi là dồn (D1)", "Hai lần chạm cách nhau không quá ngần này giây là chạm dồn.", 0.1],
      ["cham.giay_tuc_thi", "so", "Giây chạm tức thì (D2)", "Chạm được nhận sớm hơn ngần này giây sau khi đáp án hiện là D2 (câu ≥ 3 đáp án).", 0.05]] },
    { ten: "🎲 D3 · Nhanh mà như đoán mò (dấu hiệu phụ)", o: [
      ["d3.bat", "bat", "Bật D3", "", 0],
      ["d3.ty_le_nhanh", "pt", "Nhanh = dưới bao nhiêu % giờ bé giỏi", "Ngưỡng giây của câu = tỉ lệ này × giờ bé giỏi làm câu đó, kẹp trong sàn / trần.", 1],
      ["d3.san", "so", "Sàn ngưỡng (giây)", "", 0.1],
      ["d3.tran", "so", "Trần ngưỡng (giây)", "", 0.1],
      ["d3.so_cau_toi_thieu", "so", "Số câu nhanh tối thiểu để xét", "", 1],
      ["d3.p_doan", "pt", "Coi như đoán mò khi xác suất đoán trúng ≥", "Càng CAO càng khó bị bắt (ít bắt oan hơn).", 1]] },
    { ten: "⛔ Kết luận cả lượt", o: [
      ["luot.so_cau_toi_thieu", "so", "Lượt phải có ít nhất (câu)", "Lượt ngắn hơn không bao giờ bị ⛔.", 1],
      ["luot.so_dau_hieu_toi_thieu", "so", "Số câu có dấu hiệu tối thiểu", "", 1],
      ["luot.ty_le_dau_hieu", "pt", "Tỉ lệ câu có dấu hiệu tối thiểu", "Cả hai điều kiện (số câu và tỉ lệ) đều đủ thì lượt bị ⛔.", 1]] },
    { ten: "🦉 Cô Cú nhắc giữa bài (không chặn bấm)", o: [
      ["nhac.sau_lien", "so", "Nhắc khi bao nhiêu câu liền có D1 / D2", "", 1],
      ["nhac.toi_da", "so", "Tối đa số lần nhắc mỗi lượt", "0 = không nhắc.", 1],
      ["nhac.giay_hien", "so", "Bong bóng hiện bao lâu (giây)", "", 0.5],
      ["nhac.chu", "ds", "Lời nhắc (mỗi dòng một lời, lần nhắc thứ 2 dùng dòng 2...)", "1-5 dòng.", 0]] },
    { ten: "🙋 Bé phản hồi khi thấy oan", o: [
      ["phan_hoi.bat", "bat", "Mở kháng nghị cho lượt bị cắt", "Tắt thì bé không có nút 🙋 cho lượt mới bị cắt. Số chữ tối thiểu / tối đa chỉnh ở 📮 Bé kháng nghị.", 0],
      ["phan_hoi.han_phan_hoi_ngay", "so", "Hạn bé phản hồi (ngày)", "", 1],
      ["phan_hoi.mau_tra_thuong", "chu", "Lời nhắn mẫu khi chấp nhận", "", 0],
      ["phan_hoi.mau_giu_nguyen", "chu", "Lời nhắn mẫu khi giữ nguyên", "", 0]] },
    { ten: "👨‍👩‍👧 Phụ huynh + 📈 gợi ý", o: [
      ["phu_huynh.bao_ngay", "so", "Phụ huynh xem bao nhiêu ngày gần nhất", "Khối \"Con chọn vội\" ở Học của con.", 1],
      ["phu_huynh.bao_lan", "so", "Tô đậm khi từ bao nhiêu lượt", "", 1],
      ["thong_ke.goi_y_so_toi_thieu", "so", "Gợi ý chỉnh số khi đã xử lý ít nhất (kháng nghị)", "", 1],
      ["thong_ke.goi_y_ty_le", "pt", "… và tỉ lệ chấp nhận từ", "", 1]] }
  ];
  var TEN_O = { "che_do": "Chế độ chung" };
  NHOM.forEach(function (n) { n.o.forEach(function (o) { TEN_O[o[0]] = o[2]; }); });
  NOI.forEach(function (n) { TEN_O["noi." + n[0] + ".che_do"] = n[1] + " · chế độ"; TEN_O["noi." + n[0] + ".nhac"] = n[1] + " · nhắc"; TEN_O["noi." + n[0] + ".cat_thuong"] = n[1] + " · cắt thưởng"; });

  var CSS = [
    "#qbbGoc { max-width: 1100px; color: #2d2550; } #qbbGoc .adminCuonNgang { overflow-x: auto; max-width: 100%; }",
    "#qbbGoc p, #qbbGoc td, #qbbGoc th, #qbbGoc label, #qbbGoc li { color: #2d2550; }",
    "#qbbGoc select, #qbbGoc input, #qbbGoc textarea { background: #fff; color: #2d2550; }",
    ".qbbTab { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 12px; } .qbbTab button { min-height: 44px; padding: 8px 14px; border-radius: 999px; border: 2px solid #d9d2ef; background: #fff; color: #3b2f6b; font: inherit; font-weight: 600; cursor: pointer; }",
    ".qbbTab button.dang { background: #7b5cf0; border-color: #7b5cf0; color: #fff; }",
    ".qbbNhom { border: 2px solid #e6e0f5; border-radius: 14px; padding: 12px; margin-bottom: 12px; background: #fff; }",
    ".qbbNhom h4 { margin: 0 0 8px; font-size: 1.02rem; }",
    ".qbbLuoi { display: grid; grid-template-columns: 1fr; gap: 10px; }",
    "@media (min-width: 760px) { .qbbLuoi { grid-template-columns: 1fr 1fr; } }",
    "@media (min-width: 1200px) { .qbbLuoi { grid-template-columns: 1fr 1fr 1fr; } }",
    ".qbbO { display: flex; flex-direction: column; gap: 4px; padding: 8px; border-radius: 10px; border: 2px solid transparent; min-width: 0; }",
    ".qbbO.khac { border-color: #ff9f1a; background: #fff8ec; } .qbbO.loi { border-color: #e0342b; background: #fff0ef; }",
    ".qbbO label { font-weight: 600; } .qbbO small { color: #6f6890; } .qbbO .qbbLoi { color: #c0261d; font-weight: 700; }",
    ".qbbHang { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }",
    ".qbbO input[type=number], .qbbO input[type=text], .qbbO select, .qbbO textarea { font: inherit; padding: 8px; border: 2px solid #d9d2ef; border-radius: 10px; min-height: 44px; box-sizing: border-box; }",
    ".qbbO input[type=number] { width: 120px; } .qbbO input[type=text], .qbbO textarea, .qbbO select { width: 100%; } .qbbO textarea { min-height: 70px; }",
    ".qbbO input[type=checkbox] { width: 26px; height: 26px; }",
    ".qbbVe { min-width: 44px; min-height: 44px; border-radius: 10px; border: 2px solid #ff9f1a; background: #fff; color: #b36200; cursor: pointer; font: inherit; font-size: 1.2rem; font-weight: 700; }",
    ".qbbMd { color: #8a83a6; font-size: .82rem; }",
    ".qbbNoi { border-collapse: collapse; width: 100%; min-width: 560px; } .qbbNoi th, .qbbNoi td { padding: 6px; border-bottom: 1px solid #eee; text-align: left; }",
    ".qbbNoi td.khac { background: #fff8ec; box-shadow: inset 0 0 0 2px #ff9f1a; } .qbbNoi td.loi { background: #fff0ef; box-shadow: inset 0 0 0 2px #e0342b; }",
    ".qbbNoi select { font: inherit; min-height: 44px; border-radius: 10px; border: 2px solid #d9d2ef; padding: 4px 8px; } .qbbNoi input[type=checkbox] { width: 26px; height: 26px; }",
    ".qbbNut { display: flex; flex-wrap: wrap; gap: 8px; position: sticky; bottom: 0; background: rgba(255,255,255,.96); padding: 10px 0; z-index: 2; }",
    ".qbbNut .adminNut { min-height: 44px; }",
    ".qbbTom { margin: 0 0 10px; padding: 10px 12px; background: #f4f0ff; border-radius: 12px; }",
    ".qbbLs li { margin: 6px 0; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; } .qbbLs code { font-size: .8rem; background: #f5f5f5; padding: 2px 6px; border-radius: 6px; word-break: break-all; }",
    ".qbbBang { border-collapse: collapse; width: 100%; min-width: 620px; font-size: .92rem; } .qbbBang th, .qbbBang td { padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right; } .qbbBang th:first-child, .qbbBang td:first-child { text-align: left; }",
    ".qbbThe { display: grid; grid-template-columns: 1fr; gap: 12px; } @media (min-width: 900px) { .qbbThe { grid-template-columns: 1fr 1fr; } }",
    ".qbbCot { display: grid; grid-template-columns: 70px 1fr 44px; gap: 6px; align-items: center; font-size: .85rem; margin: 3px 0; }",
    ".qbbThanh { height: 14px; background: #eee; border-radius: 7px; overflow: hidden; } .qbbThanh i { display: block; height: 100%; background: #7b5cf0; }",
    ".qbbThanh.cam i { background: #ff9f1a; }",
    ".qbbGoiY { padding: 10px 12px; border-left: 4px solid #ff9f1a; background: #fff8ec; border-radius: 8px; margin: 8px 0; }",
    ".qbbGoiY .adminNut { min-height: 44px; margin-top: 6px; }",
    ".qbbNhay { animation: qbbNhay 1.2s ease 2; } @keyframes qbbNhay { 50% { box-shadow: 0 0 0 5px #ffd27a; } }"
  ].join("\n");
  function chenKieu() { if (document.getElementById("qbbKieu")) return; var s = document.createElement("style"); s.id = "qbbKieu"; s.textContent = CSS; document.head.appendChild(s); }
  function tao(the, lop, chu) { var e = document.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; }
  function soVN(n, le) { var x = Number(n) || 0; return x.toLocaleString("vi-VN", { maximumFractionDigits: le == null ? 2 : le }); }
  function ngayGio(iso) { var d = new Date(iso); if (isNaN(d)) return ""; var h = function (n) { return ("0" + n).slice(-2); }; return h(d.getDate()) + "/" + h(d.getMonth() + 1) + "/" + d.getFullYear() + " " + h(d.getHours()) + ":" + h(d.getMinutes()); }
  function sao(x) { return JSON.parse(JSON.stringify(x)); }
  function lay(o, duong) { return duong.split(".").reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function dat(o, duong, v) { var k = duong.split("."), x = o; for (var i = 0; i < k.length - 1; i++) { if (x[k[i]] == null || typeof x[k[i]] !== "object") x[k[i]] = {}; x = x[k[i]]; } x[k[k.length - 1]] = v; }
  function giongNhau(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function goi(ham, ts) {
    return adminGoiRpc(ham, ts || {}).then(function (kq) {
      if (kq && kq.thanhCong === false && /function|does not exist|schema cache/i.test(kq.thongBao || "")) kq.thongBao = "Máy chủ chưa có hàm " + ham + " (cần chạy SQL KC_11E)";
      return kq || { thanhCong: false, thongBao: "Máy chủ không trả lời" };
    }, function () { return { thanhCong: false, thongBao: "Mất mạng" }; });
  }
  function bao(chu, tot) { if (typeof adminBaoTin === "function") adminBaoTin(chu, tot); }

  document.addEventListener("adminDaChuyenManHinh", function (e) { if (e.detail && e.detail.ten === MAN) tai(); });

  function tai() {
    chenKieu();
    var g = document.getElementById("qbbGoc"); if (!g) return;
    g.innerHTML = '<p class="adminDangTai">Đang tải...</p>';
    goi("kc_bb_admin_doc").then(function (r) {
      if (!r.thanhCong) { g.innerHTML = ""; g.appendChild(tao("p", "adminGhiChu", "⚠️ " + (r.thongBao || "Không tải được"))); return; }
      S.d = r; S.form = sao(r.dangDung); S.loi = {};
      ve();
    });
  }

  function ve() {
    var g = document.getElementById("qbbGoc"); g.innerHTML = "";
    var tab = tao("div", "qbbTab"); tab.setAttribute("role", "tablist");
    [["ch", "⚙️ Cấu hình"], ["tk", "📊 Thống kê"], ["ls", "🕘 Lịch sử (" + (S.d.lichSu || []).length + ")"]].forEach(function (t) {
      var b = tao("button", S.tab === t[0] ? "dang" : "", t[1]); b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", S.tab === t[0] ? "true" : "false");
      b.onclick = function () { S.tab = t[0]; ve(); };
      tab.appendChild(b);
    });
    g.appendChild(tab);
    var noi = tao("div"); g.appendChild(noi);
    if (S.tab === "ch") veCauHinh(noi); else if (S.tab === "tk") veThongKe(noi); else veLichSu(noi);
  }

  // ---------------- ⚙️ CẤU HÌNH ----------------
  function soKhac() { var n = 0; Object.keys(TEN_O).forEach(function (k) { if (!giongNhau(lay(S.form, k), lay(S.d.macDinh, k))) n++; }); return n; }

  function veCauHinh(k) {
    var md = S.d.macDinh, f = S.form;
    var tom = tao("p", "qbbTom");
    tom.innerHTML = "Đang dùng: <b>" + (TEN_CD[S.d.dangDung.che_do] || S.d.dangDung.che_do) + "</b>"
      + (S.d.suaLuc && S.d.suaBoi ? " · sửa lần cuối " + ngayGio(S.d.suaLuc) + " bởi " + thoatHtml(S.d.suaBoi) : " · chưa ai sửa (toàn số mặc định)")
      + '. Ô <span style="color:#d97800;font-weight:700">viền cam</span> là khác mặc định; bấm ↺ để trả ô đó về mặc định. Bấm <b>💾 Lưu</b> thì lượt chơi kế tiếp của bé dùng số mới.';
    k.appendChild(tom);

    // chế độ chung + từng nơi
    var n0 = tao("div", "qbbNhom"); n0.appendChild(tao("h4", "", "🎚️ Chế độ"));
    var o0 = oKhung("che_do");
    var sel = tao("select"); sel.id = "qbb_che_do";
    CHE_DO.forEach(function (c) { var op = tao("option", "", c[1]); op.value = c[0]; sel.appendChild(op); });
    sel.value = f.che_do; sel.onchange = function () { f.che_do = sel.value; capNhatO(o0, "che_do"); };
    o0.insertBefore(sel, o0.querySelector(".qbbMd"));
    n0.appendChild(o0);
    var cuon = tao("div", "adminCuonNgang"), b = tao("table", "qbbNoi");
    b.innerHTML = "<thead><tr><th>Nơi</th><th>Chế độ</th><th>Cô Cú nhắc</th><th>Cắt thưởng lượt ⛔</th></tr></thead>";
    var tb = tao("tbody");
    NOI.forEach(function (n) {
      var tr = tao("tr"); tr.appendChild(tao("td", "", n[1]));
      var td1 = tao("td"), s = tao("select"); s.id = "qbb_noi." + n[0] + ".che_do";
      [["", "Theo chế độ chung"]].concat(CHE_DO).forEach(function (c) { var op = tao("option", "", c[0] ? TEN_CD[c[0]] : c[1]); op.value = c[0]; s.appendChild(op); });
      s.value = f.noi[n[0]].che_do || "";
      s.onchange = function () { f.noi[n[0]].che_do = s.value || null; danhDauTd(td1, "noi." + n[0] + ".che_do"); };
      td1.appendChild(s); tr.appendChild(td1); danhDauTd(td1, "noi." + n[0] + ".che_do");
      ["nhac", "cat_thuong"].forEach(function (kh) {
        var td = tao("td"), c = tao("input"); c.type = "checkbox"; c.id = "qbb_noi." + n[0] + "." + kh; c.checked = !!f.noi[n[0]][kh];
        c.setAttribute("aria-label", n[1] + " " + (kh === "nhac" ? "nhắc" : "cắt thưởng"));
        c.onchange = function () { f.noi[n[0]][kh] = c.checked; danhDauTd(td, "noi." + n[0] + "." + kh); };
        td.appendChild(c); tr.appendChild(td); danhDauTd(td, "noi." + n[0] + "." + kh);
      });
      tb.appendChild(tr);
    });
    b.appendChild(tb); cuon.appendChild(b); n0.appendChild(cuon);
    n0.appendChild(tao("small", "adminGhiChu", "Tốc độ và Chinh phục chưa gửi dữ liệu chạm (bước KC_11F), nên hiện chưa có lượt nào ở hai nơi này."));
    k.appendChild(n0);

    NHOM.forEach(function (nh) {
      var n = tao("div", "qbbNhom"); n.appendChild(tao("h4", "", nh.ten));
      var l = tao("div", "qbbLuoi");
      nh.o.forEach(function (o) { l.appendChild(oNhap(o)); });
      n.appendChild(l); k.appendChild(n);
    });

    var nut = tao("div", "qbbNut");
    var bL = tao("button", "adminNut", "💾 Lưu"); bL.type = "button"; bL.onclick = luu;
    var bM = tao("button", "adminNut adminNutPhu", "↺ Tất cả về mặc định"); bM.type = "button";
    bM.onclick = function () { S.form = sao(md); S.loi = {}; ve(); bao("Đã đưa mọi ô về mặc định. Bấm 💾 Lưu để dùng.", true); };
    var bH = tao("button", "adminNut adminNutPhu", "✖ Bỏ thay đổi"); bH.type = "button";
    bH.onclick = function () { S.form = sao(S.d.dangDung); S.loi = {}; ve(); };
    var dem = tao("span", "adminGhiChu", soKhac() + " ô khác mặc định"); dem.id = "qbbDem";
    nut.append(bL, bM, bH, dem);
    k.appendChild(nut);
  }

  function thoatHtml(x) { var d = document.createElement("div"); d.textContent = String(x == null ? "" : x); return d.innerHTML; }
  function chuMd(duong) {
    var v = lay(S.d.macDinh, duong), kieu = (oCua(duong) || [])[1];
    if (kieu === "pt") return soVN(v * 100, 1) + " %";
    if (kieu === "bat" || typeof v === "boolean") return v ? "bật" : "tắt";
    if (kieu === "ds") return (v || []).length + " lời";
    if (duong === "che_do") return TEN_CD[v];
    return typeof v === "number" ? soVN(v) : String(v == null ? "" : v).slice(0, 40);
  }
  function oCua(duong) { var r = null; NHOM.forEach(function (n) { n.o.forEach(function (o) { if (o[0] === duong) r = o; }); }); return r; }

  function oKhung(duong) {
    var o = tao("div", "qbbO"); o.dataset.o = duong;
    var hang = tao("div", "qbbHang"), lb = tao("label", "", TEN_O[duong] || duong); lb.htmlFor = "qbb_" + duong;
    var ve0 = tao("button", "qbbVe", "↺"); ve0.type = "button"; ve0.title = "Về mặc định"; ve0.setAttribute("aria-label", "Trả " + (TEN_O[duong] || duong) + " về mặc định");
    ve0.onclick = function () { dat(S.form, duong, sao(lay(S.d.macDinh, duong))); delete S.loi[duong]; ve(); var x = document.getElementById("qbb_" + duong); if (x) x.focus(); };
    hang.append(lb, ve0); o.appendChild(hang);
    o.appendChild(tao("span", "qbbMd", "Mặc định: " + chuMd(duong)));
    capNhatO(o, duong);
    return o;
  }
  function capNhatO(o, duong) {
    var khac = !giongNhau(lay(S.form, duong), lay(S.d.macDinh, duong));
    o.classList.toggle("khac", khac); o.classList.toggle("loi", !!S.loi[duong]);
    var v = o.querySelector(".qbbVe"); if (v) v.hidden = !khac;
    var l = o.querySelector(".qbbLoi"); if (l) l.remove();
    if (S.loi[duong]) o.appendChild(tao("span", "qbbLoi", "⚠️ " + S.loi[duong]));
    var dem = document.getElementById("qbbDem"); if (dem) dem.textContent = soKhac() + " ô khác mặc định";
  }
  function danhDauTd(td, duong) {
    td.classList.toggle("khac", !giongNhau(lay(S.form, duong), lay(S.d.macDinh, duong)));
    td.classList.toggle("loi", !!S.loi[duong]); td.title = S.loi[duong] ? "⚠️ " + S.loi[duong] : "Mặc định: " + chuMd(duong);
    var dem = document.getElementById("qbbDem"); if (dem) dem.textContent = soKhac() + " ô khác mặc định";
  }

  function oNhap(o) {
    var duong = o[0], kieu = o[1], v = lay(S.form, duong), khung = oKhung(duong), x;
    if (kieu === "bat") {
      x = tao("input"); x.type = "checkbox"; x.checked = !!v;
      x.onchange = function () { dat(S.form, duong, x.checked); capNhatO(khung, duong); };
    } else if (kieu === "chu") {
      x = tao("input"); x.type = "text"; x.maxLength = 300; x.value = v || "";
      x.oninput = function () { dat(S.form, duong, x.value); capNhatO(khung, duong); };
    } else if (kieu === "ds") {
      x = tao("textarea"); x.value = (v || []).join("\n"); x.rows = 3;
      x.oninput = function () { dat(S.form, duong, x.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean)); capNhatO(khung, duong); };
    } else {
      var hang = tao("div", "qbbHang");
      x = tao("input"); x.type = "number"; x.inputMode = "decimal"; x.step = String(o[4] || "any");
      x.value = v == null ? "" : kieu === "pt" ? String(Math.round(v * 1000) / 10) : String(v);
      x.oninput = function () {
        var s = x.value.replace(",", "."), n = s === "" ? null : Number(s);
        dat(S.form, duong, n == null || !isFinite(n) ? x.value : kieu === "pt" ? Math.round(n * 10) / 1000 : n);
        capNhatO(khung, duong);
      };
      hang.appendChild(x); if (kieu === "pt") hang.appendChild(tao("span", "", "%"));
      x.id = "qbb_" + duong;
      khung.insertBefore(hang, khung.querySelector(".qbbMd"));
      if (o[3]) khung.appendChild(tao("small", "", o[3]));
      capNhatO(khung, duong);
      return khung;
    }
    x.id = "qbb_" + duong;
    khung.insertBefore(x, khung.querySelector(".qbbMd"));
    if (o[3]) khung.appendChild(tao("small", "", o[3]));
    capNhatO(khung, duong);
    return khung;
  }

  function luu() {
    var nut = document.querySelector("#qbbGoc .qbbNut .adminNut"); if (nut) nut.disabled = true;
    goi("kc_bb_admin_luu", { p_gia_tri: S.form }).then(function (r) {
      if (nut) nut.disabled = false;
      if (!r.thanhCong) {
        S.loi = {};
        (r.loi || []).forEach(function (e) { S.loi[e.o] = e.chu; });
        ve();
        var dau = (r.loi || [])[0];
        bao("❌ Chưa lưu gì. " + ((r.loi || []).length ? (r.loi.length + " ô sai, ô đầu: " + (TEN_O[dau.o] || dau.o) + " (" + dau.chu + ")") : (r.thongBao || "")), false);
        if (dau) nhayToi(dau.o);
        return;
      }
      bao("✅ Đã lưu. Lượt chơi kế tiếp của bé dùng số mới.", true);
      tai();
    });
  }
  function nhayToi(duong) {
    var x = document.getElementById("qbb_" + duong); if (!x) return;
    var khung = x.closest(".qbbO") || x.closest("td") || x;
    khung.scrollIntoView({ behavior: "smooth", block: "center" });
    khung.classList.remove("qbbNhay"); void khung.offsetWidth; khung.classList.add("qbbNhay");
    try { x.focus({ preventScroll: true }); } catch (e) { x.focus(); }
  }

  // ---------------- 🕘 LỊCH SỬ ----------------
  function moTaKhac(gt) {
    var ds = [];
    (function di(o, tien) { Object.keys(o || {}).forEach(function (k) { var d = tien ? tien + "." + k : k; if (o[k] && typeof o[k] === "object" && !Array.isArray(o[k])) di(o[k], d); else ds.push(d); }); })(gt, "");
    return ds;
  }
  function veLichSu(k) {
    var ls = S.d.lichSu || [];
    k.appendChild(tao("p", "adminGhiChu", "Mỗi lần 💾 Lưu, bản TRƯỚC đó được giữ ở đây (tối đa 30 bản). \"↩️ Dùng lại\" đưa bản đó thành đang dùng ngay; bản hiện tại lại vào lịch sử."));
    if (!ls.length) { k.appendChild(tao("p", "adminGhiChu", "Chưa có lần sửa nào.")); return; }
    var ul = tao("ul", "qbbLs");
    ls.forEach(function (h) {
      var li = tao("li"), d = moTaKhac(h.giaTri);
      li.appendChild(tao("b", "", ngayGio(h.suaLuc)));
      li.appendChild(tao("span", "adminGhiChu", "(trước khi " + (h.suaBoi || "?") + " sửa)"));
      li.appendChild(tao("span", "", d.length ? d.length + " ô khác mặc định: " + d.map(function (x) { return TEN_O[x] || x; }).join(", ") : "toàn số mặc định"));
      var b = tao("button", "adminNut adminNutPhu", "↩️ Dùng lại bản này"); b.type = "button"; b.style.minHeight = "44px";
      b.onclick = function () {
        if (!confirm("Dùng lại bản cấu hình lúc " + ngayGio(h.suaLuc) + "?")) return;
        goi("kc_bb_admin_hoan_tac", { p_id: h.id }).then(function (r) {
          if (!r.thanhCong) { bao("❌ " + (r.thongBao || "Không dùng lại được"), false); return; }
          bao("✅ Đã dùng lại bản " + ngayGio(h.suaLuc), true); S.tab = "ch"; tai();
        });
      };
      li.appendChild(b); ul.appendChild(li);
    });
    k.appendChild(ul);
  }

  // ---------------- 📊 THỐNG KÊ ----------------
  function veThongKe(k) {
    var loc = tao("div", "qbbTab qbbNgay");
    [7, 30].forEach(function (n) {
      var b = tao("button", S.ngay === n ? "dang" : "", n + " ngày"); b.type = "button";
      b.onclick = function () { S.ngay = n; S.tk = null; veThongKe(xoa(k)); };
      loc.appendChild(b);
    });
    k.appendChild(loc);
    var noi = tao("div"); k.appendChild(noi);
    if (S.tk && S.tk.soNgay === S.ngay) { veSoLieu(noi, S.tk); return; }
    noi.innerHTML = '<p class="adminDangTai">Đang tính...</p>';
    goi("kc_bb_admin_thong_ke", { p_ngay: S.ngay }).then(function (r) {
      noi.innerHTML = "";
      if (!r.thanhCong) { noi.appendChild(tao("p", "adminGhiChu", "⚠️ " + (r.thongBao || "Không tải được"))); return; }
      S.tk = r; veSoLieu(noi, r);
    });
  }
  function xoa(e) { e.innerHTML = ""; return e; }
  function phanTram(a, b) { return b > 0 ? soVN(100 * a / b, 1) + " %" : "–"; }

  function veSoLieu(k, t) {
    var tn = t.theoNoi || [];
    // 1. theo nơi
    var n1 = tao("div", "qbbNhom"); n1.appendChild(tao("h4", "", "📊 Các lượt " + t.soNgay + " ngày qua (từ " + String(t.tuNgay).split("-").reverse().join("/") + ")"));
    if (!tn.length) n1.appendChild(tao("p", "adminGhiChu", "Chưa có lượt nào có dữ liệu chống bấm bừa trong khoảng này."));
    else {
      var c1 = tao("div", "adminCuonNgang"), b1 = tao("table", "qbbBang");
      b1.innerHTML = "<thead><tr><th>Nơi</th><th>Chế độ</th><th>Lượt</th><th>⛔ bấm bừa</th><th>Bị cắt thưởng</th><th>⛔ không cắt</th><th>Câu có dấu hiệu</th><th>D1</th><th>D2</th><th>D3</th></tr></thead>";
      var tb = tao("tbody");
      tn.forEach(function (x) {
        var tr = tao("tr");
        [TEN_NOI[x.noi] || x.noi, TEN_CD[x.cheDo] || x.cheDo, soVN(x.soLuot), soVN(x.soBua) + " (" + phanTram(x.soBua, x.soLuot) + ")", soVN(x.soCat),
          soVN(x.soBuaKhongCat), soVN(x.cauDauHieu) + " / " + soVN(x.cauTinh), soVN(x.d1), soVN(x.d2), soVN(x.d3)].forEach(function (v) { tr.appendChild(tao("td", "", v)); });
        tb.appendChild(tr);
      });
      b1.appendChild(tb); c1.appendChild(b1); n1.appendChild(c1);
      n1.appendChild(tao("small", "adminGhiChu", "\"⛔ không cắt\": lượt bị kết luận bấm bừa ở nơi đang Chỉ ghi / Ghi + nhắc hoặc tắt cắt thưởng — nếu bật đầy đủ thì sẽ bị cắt."));
    }
    k.appendChild(n1);

    // 2. từng câu
    var cs = t.cau || [];
    if (cs.length) {
      var n2 = tao("div", "qbbNhom"); n2.appendChild(tao("h4", "", "🔍 Từng câu: chạm thừa, giây, tỉ lệ đúng"));
      var luoi = tao("div", "qbbThe");
      cs.forEach(function (c) {
        var o = tao("div");
        o.appendChild(tao("b", "", (TEN_NOI[c.noi] || c.noi) + " · " + soVN(c.soCau) + " câu"));
        o.appendChild(tao("p", "", "Đúng: câu có dấu hiệu " + (c.coDauHieu.tyLeDung == null ? "–" : c.coDauHieu.tyLeDung + " %") + " (" + soVN(c.coDauHieu.so) + " câu) · câu không dấu hiệu "
          + (c.khongDauHieu.tyLeDung == null ? "–" : c.khongDauHieu.tyLeDung + " %") + " (" + soVN(c.khongDauHieu.so) + " câu)"));
        o.appendChild(tao("small", "adminGhiChu", "Số lần chạm dồn mỗi câu:"));
        veThanh(o, c.thuaDon, ["0", "1", "2", "3-4", "5+"], c.soCau, function (kh) { return kh !== "0" && kh !== "1"; });
        o.appendChild(tao("small", "adminGhiChu", "Giây trả lời mỗi câu:"));
        veThanh(o, c.giay, ["<0,4", "0,4-1", "1-2", "2-4", "4-8", "8+"], c.soCau, function (kh) { return kh === "<0,4"; });
        luoi.appendChild(o);
      });
      n2.appendChild(luoi);
      n2.appendChild(tao("small", "adminGhiChu", "Thanh cam: nhóm thường là dấu hiệu bấm bừa. Câu có dấu hiệu mà đúng gần bằng câu không dấu hiệu nghĩa là app có thể đang bắt oan bé làm thật."));
      k.appendChild(n2);
    }

    // 3. kháng nghị
    var n3 = tao("div", "qbbNhom"); n3.appendChild(tao("h4", "", "📈 Bé kháng nghị \"chọn vội\": tỉ lệ được chấp nhận"));
    var kn = t.khangNghi || [];
    if (!kn.length) n3.appendChild(tao("p", "adminGhiChu", "Chưa có kháng nghị nào trong khoảng này."));
    else {
      var c3 = tao("div", "adminCuonNgang"), b3 = tao("table", "qbbBang");
      b3.innerHTML = "<thead><tr><th>Nơi</th><th>Lượt bị cắt</th><th>Bé đã viết</th><th>Chờ xử lý</th><th>✅ Chấp nhận</th><th>↩️ Giữ nguyên</th><th>Quá hạn</th><th>Tỉ lệ chấp nhận</th></tr></thead>";
      var tb3 = tao("tbody");
      kn.forEach(function (x) {
        var tr = tao("tr");
        [TEN_NOI[x.noi] || x.noi, soVN(x.mo), soVN(x.beGui), soVN(x.cho), soVN(x.chapNhan), soVN(x.giuNguyen), soVN(x.hetHan), x.tyLeChapNhan == null ? "–" : x.tyLeChapNhan + " %"]
          .forEach(function (v) { tr.appendChild(tao("td", "", v)); });
        tb3.appendChild(tr);
      });
      b3.appendChild(tb3); c3.appendChild(b3); n3.appendChild(c3);
    }
    var dh = t.theoDauHieu || [];
    if (dh.length) {
      n3.appendChild(tao("p", "", "Theo dấu hiệu (một lượt có nhiều dấu hiệu thì tính cho mỗi dấu hiệu):"));
      dh.forEach(function (x) {
        var o = tao("div", "qbbCot");
        o.appendChild(tao("span", "", x.dh));
        var th = tao("div", "qbbThanh cam"), i = tao("i"); i.style.width = (x.tyLeChapNhan || 0) + "%"; th.appendChild(i);
        th.title = TEN_DH[x.dh] + ": chấp nhận " + x.chapNhan + " / " + x.xuLy;
        o.appendChild(th);
        o.appendChild(tao("span", "", x.tyLeChapNhan == null ? "–" : x.tyLeChapNhan + "%"));
        n3.appendChild(o);
        n3.appendChild(tao("small", "adminGhiChu", TEN_DH[x.dh] + ": " + x.chapNhan + " / " + x.xuLy + " kháng nghị đã xử lý được chấp nhận"));
      });
    }
    var gy = t.goiY || [];
    var ng = t.nguongGoiY || {};
    if (!gy.length) n3.appendChild(tao("p", "adminGhiChu", "Chưa có gợi ý chỉnh số (gợi ý khi một dấu hiệu / nơi có ít nhất " + (ng.soToiThieu || 5) + " kháng nghị đã xử lý và từ "
      + soVN((ng.tyLe || 0.5) * 100, 0) + " % được chấp nhận)."));
    gy.forEach(function (x) {
      var o = tao("div", "qbbGoiY"), dang = lay(S.form, x.o);
      var kieu = (oCua(x.o) || [])[1], chuDang = kieu === "pt" ? soVN(dang * 100, 1) + " %" : soVN(dang);
      o.appendChild(tao("p", "", "💡 " + (x.dh ? TEN_DH[x.dh] : TEN_NOI[x.noi] || x.noi) + " bị chấp nhận " + x.chapNhan + " / " + x.xuLy + " kháng nghị: có thể đang bắt oan. Nên "
        + (x.huong === "ha" ? "HẠ" : "TĂNG") + " \"" + (TEN_O[x.o] || x.o) + "\" (đang " + chuDang + ")."));
      var b = tao("button", "adminNut", "✏️ Sửa ô này"); b.type = "button";
      b.onclick = function () { S.tab = "ch"; ve(); nhayToi(x.o); };
      o.appendChild(b); n3.appendChild(o);
    });
    k.appendChild(n3);
  }
  function veThanh(k, dl, khoa, tong, laCam) {
    khoa.forEach(function (kh) {
      var so = (dl || {})[kh] || 0, o = tao("div", "qbbCot");
      o.appendChild(tao("span", "", kh));
      var th = tao("div", "qbbThanh" + (laCam(kh) ? " cam" : "")), i = tao("i"); i.style.width = (tong > 0 ? 100 * so / tong : 0) + "%"; th.appendChild(i);
      o.appendChild(th); o.appendChild(tao("span", "", soVN(so)));
      k.appendChild(o);
    });
  }
})();
// 28/11/2026 - BƯỚC: KC_11E (Quản trị › 🧠 Chống bấm bừa: cấu hình + lịch sử + thống kê + tỉ lệ chấp nhận kháng nghị + gợi ý)
