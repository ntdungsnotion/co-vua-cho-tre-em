/* ================================================================
   FILE: san_tu/st_logic.js
   CHỨC NĂNG: LÕI GAME "Săn Từ: Đường Đến Lâu Đài" - KHÔNG đụng tới màn hình hay
              âm thanh (chạy được cả trong Node để kiểm thử tự động). Gồm:
                - SinhDuongDi  (LevelGenerator + DifficultyManager): xếp chướng ngại
                  vật trên đường, bảo đảm khoảng cách an toàn và thời gian phản ứng.
                - TroChoi      (GameStateManager): trạng thái lượt chơi, đồng hồ,
                  thắng/thua, tạm dừng; điều phối các phần bên dưới.
                - phần NHÂN VẬT (PlayerController): chạy, nhảy, khựng, gặp nạn, hồi sinh.
                - phần THỬ THÁCH TỪ (WordChallengeManager): mở/đóng thử thách, chọn đáp án.
                - phần KIM CƯƠNG (DiamondManager) và MẠNG (LifeManager).
              Mọi thứ xảy ra đều báo ra ngoài bằng sự kiện (suKien(ten, duLieu)) để
              phần âm thanh / giao diện phản ứng.
   BƯỚC: TC_00B
   NGÀY: 15/10/2026
   CẬP NHẬT: 15/10/2026 - TC_00D: một lượt chơi = MỘT MÀN (cấu hình từ ST.taoManChoi),
             thời gian theo màn; màn cuối (7) mới có lâu đài + mèo.
   CẬP NHẬT: 16/10/2026 - TC_00D2: bấm đúng là hành động NGAY (không còn canh giờ thay bé).
             Nhảy: cự ly cố định, bé bấm sớm / trễ quá thì vẫn chạm vật cản, chạm quái hay
             rơi hố. Bắn: chỉ quái có THANH MÁU (tối đa 1/4 số quái) và vật cản cao hơn cú
             nhảy; mỗi lần bấm đúng = 1 viên, khung chọn từ giữ nguyên tới khi hạ xong.
             Kim cương rải NGẪU NHIÊN trên đường lúc sinh màn, không gắn với quái / từ.
   TỌA ĐỘ: x = quãng đường (tăng về phía lâu đài), y = độ cao so với mặt đất.
           Nhân vật: x là TÂM người, y là CHÂN. Chướng ngại vật: x là MÉP TRÁI.
   THỨ TỰ XỬ LÝ MỖI BƯỚC (cố định để không chồng chéo):
     đồng hồ -> di chuyển -> phép thuật -> thử thách
     -> nhặt kim cương -> va chạm (hố, vật cản, quái) -> về đích.
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST = goc.ST || {};

  // Bộ sinh số ngẫu nhiên có "hạt giống" (để kiểm thử lặp lại được)
  ST.taoNgauNhien = function (hat) {
    let a = hat >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const doanTrong = (rng, [a, b]) => a + rng() * (b - a);
  const giaoNhau = (a, b) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;

  /* ================================================================
     THÔNG SỐ HÌNH HỌC CỦA TỪNG CHƯỚNG NGẠI VẬT (dùng chung cho sinh đường và chơi)
     ================================================================ */
  function tocDoKhep(o, v) { return v + (o.tocDoDi || 0); }        // bé và quái tiến lại gần nhau
  // Cú nhảy luôn đi được đúng cự ly cuLyNhay trên mặt đất
  function thoiGianNhay(v) { return ST.CAU_HINH.cuLyNhay / v; }
  /* CỬA SỔ NHẢY: khoảng cách TÂM (vật - bé) lúc bấm mà cú nhảy cố định qua được an toàn.
     Bấm khi còn xa hơn [1] (quá sớm): đáp xuống trước vật / rơi vào hố. Bấm khi đã gần hơn
     [0] (quá trễ): chưa lên đủ cao đã chạm. Trả về [gầnNhất, xaNhất]. */
  function cuaSoNhay(o, v) {
    const CH = ST.CAU_HINH, w = tocDoKhep(o, v), D = w * thoiGianNhay(v), le = CH.leNhay;
    if (o.nhom === "ho") { const s = o.rong / 2 - 6 + le; return [s, D - s]; } // bay qua trọn miệng hố
    const s = (o.rong - 2 * CH.coVaCham + CH.nhanVat.rong) / 2 + le;          // nửa quãng chồng nhau theo chiều ngang
    const dinh = Math.min(CH.doCaoNhay * 0.99, o.bayCao + o.cao - CH.coVaCham + le); // phải cao hơn đỉnh vật
    const a = (1 - Math.sqrt(1 - dinh / CH.doCaoNhay)) / 2;                  // phần cú nhảy còn thấp hơn đỉnh vật
    return [s + D * a, D * (1 - a) - s];
  }
  // Khoảng cách TÂM mà tại đó thanh đếm ngược hết: nhảy = hết cửa sổ an toàn; bắn = quái đã sát
  function khoangHetHan(o, v) {
    const CH = ST.CAU_HINH;
    if (o.hanhDong === "nhay") return cuaSoNhay(o, v)[1];
    return (o.rong + CH.nhanVat.rong) / 2 + CH.khoangPhepToiThieu;
  }
  // Thời gian đọc từ: quái nhiều máu được thêm giờ cho mỗi viên từ viên thứ 2
  function thoiGianPhanUng(o, phanUng) { return phanUng + (o.mau > 1 ? ST.CAU_HINH.thoiGianThemMoiVien * (o.mau - 1) : 0); }
  // Khoảng cách TÂM mà tại đó thử thách hiện ra: còn đúng "thời gian phản ứng" giây
  function khoangKichHoat(o, v, phanUng) { return khoangHetHan(o, v) + tocDoKhep(o, v) * thoiGianPhanUng(o, phanUng); }

  ST.thoiGianNhay = thoiGianNhay;
  ST.khoangHetHan = khoangHetHan;
  ST.khoangKichHoat = khoangKichHoat;
  ST.cuaSoNhay = cuaSoNhay;

  /* ================================================================
     SINH ĐƯỜNG ĐI (LevelGenerator): xếp chướng ngại vật có kiểm soát
     ================================================================ */
  function sinhDuongDi(dk, rng, khoTu) {
    const CH = ST.CAU_HINH, v = dk.tocDo;
    const dai = Math.round(v * dk.thoiGianDiDuKien);   // vị trí cổng lâu đài
    const ds = [];
    const tenLoai = Object.keys(dk.loai);
    let mepSau = v * CH.choTruocKhiVaoDuong - CH.leQuaChuongNgai; // mép sau của "chướng ngại vật trước"
    let soQuai = 0, soCoMau = 0; // quái có thanh máu: luôn KHÔNG QUÁ 1/4 số quái (ở mọi đoạn đường)

    function chonLoai(i) {
      if (i === 0) return "cong"; // cái đầu tiên luôn là ống cống: an toàn, để bé làm quen
      // Bảo đảm đủ tỉ lệ chướng ngại vật nguy hiểm: không thể về đích mà không trả lời từ nào
      const nguyHiem = t => ST.LOAI_CHUONG_NGAI[t].vaCham !== "khung";
      const soNguyHiem = ds.filter(o => nguyHiem(o.loai)).length;
      const epNguyHiem = soNguyHiem < (dk.tiLeNguyHiemToiThieu || 0) * i;
      const nhom = epNguyHiem ? tenLoai.filter(nguyHiem) : tenLoai;
      for (let thu = 0; thu < 20; thu++) {
        let tong = 0; nhom.forEach(t => { tong += dk.loai[t]; });
        let r = rng() * tong, ma = nhom[0];
        for (const t of nhom) { r -= dk.loai[t]; if (r <= 0) { ma = t; break; } }
        const n = ds.length;
        // không 3 cái giống nhau liên tiếp
        if (n >= 2 && ds[n - 1].loai === ma && ds[n - 2].loai === ma) continue;
        // màn dễ: không để 3 cái nguy hiểm (mất mạng) đứng liền nhau
        if (dk.soPhuongAn <= 2 && n >= 2 && ds[n - 1].vaCham !== "khung" && ds[n - 2].vaCham !== "khung" && ST.LOAI_CHUONG_NGAI[ma].vaCham !== "khung") continue;
        return ma;
      }
      return "cong";
    }

    for (let i = 0; i < 200; i++) {
      let ma = chonLoai(i), L = ST.LOAI_CHUONG_NGAI[ma];
      let mau = 0;
      if (L.nhom === "quaiDat" || L.nhom === "quaiBay") {
        soQuai++;
        const choPhep = (soCoMau + 1) * 4 <= soQuai;
        if (L.caoHonNhay && !choPhep) { // quái khổng lồ mà đã đủ 1/4: đổi thành quái nhỏ nhảy qua được
          ma = dk.loai.nhim ? "nhim" : "nam"; L = ST.LOAI_CHUONG_NGAI[ma];
        }
        if (L.caoHonNhay || (choPhep && rng() < dk.tiLeCoMau)) { mau = dk.mauQuai; soCoMau++; }
      } else if (L.caoHonNhay) mau = dk.mauQuai; // vật cản cao hơn cú nhảy: phải bắn
      const o = {
        id: i + 1, loai: ma, ten: L.ten, nhom: L.nhom, hanhDong: mau > 0 ? "ban" : "nhay", vaCham: L.vaCham,
        mau, mauToiDa: mau,
        rong: Math.round(doanTrong(rng, L.rong)), cao: Math.round(doanTrong(rng, L.cao)),
        bayCao: L.bayCao || 0, tocDoDi: L.tocDoDi || 0, dangDi: false,
        song: true, boChay: false, daQua: false, trangThai: "cho", bienThe: Math.floor(rng() * 3)
      };
      const tam = mepSau + CH.leQuaChuongNgai + khoangKichHoat(o, v, dk.thoiGianPhanUng) + doanTrong(rng, dk.khoangThem);
      o.x = Math.round(tam - o.rong / 2);
      if (o.x + o.rong + CH.khoangCuoiTruocLauDai > dai) break;
      o.tu = khoTu.layTu();
      ds.push(o);
      mepSau = o.x + o.rong;
    }
    return { dai, ds, kimCuongs: raiKimCuong(dk, rng, ds, dai) };
  }

  /* Kim cương rải NGẪU NHIÊN, không gắn với quái hay từ:
     - Tầm chạy: từng cụm 1-3 viên nằm ở khoảng trống giữa 2 chướng ngại vật (tránh vùng bé
       đang nhảy, tránh miệng hố) -> chạy qua là nhặt.
     - Trên cao: một viên lơ lửng ngay trên vật cản đứng yên / hố, đúng đỉnh cú nhảy -> chỉ bé
       nhảy đúng lúc mới chạm được (phần thưởng cho canh giờ giỏi). */
  function raiKimCuong(dk, rng, ds, dai) {
    const CH = ST.CAU_HINH, v = dk.tocDo, kq = [];
    const caoTam = CH.nhanVat.cao / 2;
    const [a, b] = dk.soKimCuong;
    const tong = a + Math.floor(rng() * (b - a + 1));
    const them = (x, y, loai) => kq.push({ x: Math.round(x), y, loai, daNhat: false, tHien: 0 });
    // trên cao: cụm 1-3 viên ở đỉnh cú nhảy, cao hơn cú leo qua sau khi khựng
    const tinh = ds.filter(o => o.hanhDong === "nhay" && !o.tocDoDi);
    const soCaoToiThieu = Math.max(0, tong - CH.kimCuongTamChayToiDa);
    const caoDung = new Set();
    const datCao = (o, so) => { caoDung.add(o); for (let i = 0; i < so; i++) them(o.x + o.rong / 2 + (i - (so - 1) / 2) * 32, CH.doCaoNhay + 40, "cao"); };
    tinh.forEach(o => { if (kq.length < tong && rng() < dk.tiLeKimCuongTrenCao) datCao(o, 1); });
    // cấp nhiều kim cương: phần vượt mức tầm chạy phải nằm trên cao
    for (const o of tinh) {
      if (kq.length >= soCaoToiThieu) break;
      const daCo = kq.filter(k => k.loai === "cao" && Math.abs(k.x - (o.x + o.rong / 2)) < 60).length;
      if (daCo >= 3) continue;
      kq.splice(0, kq.length, ...kq.filter(k => !(k.loai === "cao" && Math.abs(k.x - (o.x + o.rong / 2)) < 60)));
      datCao(o, Math.min(3, daCo + soCaoToiThieu - kq.length));
    }
    // tầm chạy: các khoảng trống chắc chắn bé đang chạy trên đất
    const trong = [];
    let dau = v * 1.2;
    ds.forEach(o => {
      const tam = o.x + o.rong / 2;
      const xaNhat = o.hanhDong === "nhay" ? cuaSoNhay(o, v)[1] * v / tocDoKhep(o, v) : 0;
      // quái đi lại gần: lúc gặp bé đã tiến thêm một đoạn -> chừa rộng hơn
      const lui = o.tocDoDi ? o.tocDoDi * thoiGianPhanUng(o, dk.thoiGianPhanUng) + 40 : 0;
      const cuoi = tam - Math.max(xaNhat + 30, o.rong / 2 + 60) - lui;
      if (cuoi - dau > 60) trong.push([dau, cuoi]);
      dau = tam + Math.max(o.hanhDong === "nhay" ? CH.cuLyNhay : 0, o.rong / 2 + 90);
    });
    if (dai - CH.khoangCuoiTruocLauDai - dau > 60) trong.push([dau, dai - CH.khoangCuoiTruocLauDai]);
    let soChay = 0;
    for (let lan = 0; lan < 40 && kq.length < tong && soChay < CH.kimCuongTamChayToiDa && trong.length; lan++) {
      const [x1, x2] = trong[Math.floor(rng() * trong.length)];
      const so = Math.min(tong - kq.length, CH.kimCuongTamChayToiDa - soChay, 1 + Math.floor(rng() * 3)), cach = 34;
      if (x2 - x1 < (so - 1) * cach + 20) continue;
      const x0 = x1 + 10 + rng() * (x2 - x1 - 20 - (so - 1) * cach);
      if (kq.some(k => Math.abs(k.x - x0) < 120)) continue;
      for (let i = 0; i < so; i++) them(x0 + i * cach, caoTam, "chay");
      soChay += so;
    }
    return kq.sort((p, q) => p.x - q.x);
  }
  ST.sinhDuongDi = sinhDuongDi;

  /* ================================================================
     TRÒ CHƠI (GameStateManager)
     Trạng thái: menu | choi | hoiSinh (đang xử lý va chạm / hồi sinh) | tamDung | thang | thua
     ================================================================ */
  class TroChoi {
    // man: cấu hình màn từ ST.taoManChoi(); truyền mã cấp từ (vd "de") thì chơi màn 1 Rừng xanh
    constructor(man, tuyChon) {
      tuyChon = tuyChon || {};
      this.CH = ST.CAU_HINH;
      this.dk = typeof man === "string" ? ST.taoManChoi("rung", 1, man) : man;
      this.maDoKho = this.dk.maCapTu;
      this.rng = tuyChon.ngauNhien || Math.random;
      this.suKien = tuyChon.suKien || function () {};
      this.soTay = tuyChon.soTay || null; // sổ ghi nhớ từ của bé (có thể không có)
      this.trangThai = "menu";
      this.datLai();
      this.trangThai = "menu";
    }

    phat(ten, duLieu) { try { this.suKien(ten, duLieu || {}); } catch (e) { /* lỗi phía giao diện không được làm hỏng game */ } }

    datLai() {
      const CH = this.CH;
      this.khoTu = new ST.KhoTuVung(this.dk, this.rng, this.soTay);
      const duong = sinhDuongDi(this.dk, this.rng, this.khoTu);
      this.doDai = duong.dai;
      this.chuongNgai = duong.ds;
      this.tongChuongNgai = duong.ds.length;
      this.v = this.dk.tocDo;
      this.thoiGianToiDa = this.dk.thoiGianChoi || CH.thoiGianChoi;
      this.thoiGian = this.thoiGianToiDa;
      this.tChoi = 0;
      this.tichLuy = 0;
      this.be = { x: 0, y: 0, che: "chay", tChe: 0, batTu: 0, nhay: null, tTiepDat: 9, tPhep: 9, tCham: 0 };
      this.mang = CH.mangBanDau;
      this.mangDuTru = 0;
      this.kimCuong = 0;        // số đang tích lũy (chưa đổi)
      this.tongKimCuong = 0;    // tổng đã nhặt cả lượt
      this.thuThach = null;
      this.soThuThach = 0;
      this.dan = [];            // viên phép thuật đang bay
      this.kimCuongs = duong.kimCuongs; // kim cương rải ngẫu nhiên trên đường
      this.tongKimCuongDuong = duong.kimCuongs.length;
      this.thongKe = { dung: 0, sai: 0, truot: 0, matMang: 0, tuDung: [], mangDoi: 0 };
      this.lyDoThua = null;
      this.tKetThuc = 0;
      this.truocTamDung = null;
      this.viTriHoiSinh = 0;
    }

    batDau() {
      this.datLai();
      this.trangThai = "choi";
      this.phat("batDau", { man: this.dk });
    }

    get tienDo() { return Math.max(0, Math.min(1, this.be.x / this.doDai)); }
    get tongMang() { return this.mang + this.mangDuTru; }
    get dangChoi() { return this.trangThai === "choi" || this.trangThai === "hoiSinh"; }

    tamDung() {
      if (!this.dangChoi) return false;
      this.truocTamDung = this.trangThai;
      this.trangThai = "tamDung";
      this.phat("tamDung");
      return true;
    }
    tiepTuc() {
      if (this.trangThai !== "tamDung") return false;
      this.trangThai = this.truocTamDung || "choi";
      this.truocTamDung = null;
      this.phat("tiepTuc");
      return true;
    }

    // Gọi mỗi khung hình với dt (giây); vật lý chạy theo bước cố định
    capNhat(dt) {
      if (this.trangThai === "menu" || this.trangThai === "tamDung") return;
      if (!(dt > 0)) return;
      this.tichLuy += Math.min(dt, 0.25);
      const h = this.CH.buocVatLy;
      let n = 0;
      while (this.tichLuy >= h && n < 60) { this.buoc(h); this.tichLuy -= h; n++; }
    }

    buoc(h) {
      if (this.trangThai === "thang" || this.trangThai === "thua") { this.tKetThuc += h; return; }
      if (!this.dangChoi) return;
      // 1. Đồng hồ: chạy cả khi khựng / gặp nạn; dừng khi tạm dừng (không vào đây)
      this.tChoi += h;
      this.thoiGian -= h;
      if (this.thoiGian <= 0) { this.thoiGian = 0; this.ketThuc("hetGio"); return; }
      const be = this.be;
      be.tTiepDat += h; be.tPhep += h;
      if (be.batTu > 0) be.batTu = Math.max(0, be.batTu - h);

      // Đang diễn hoạt cảnh gặp nạn: thế giới đứng yên, hết giờ diễn thì hồi sinh
      if (this.trangThai === "hoiSinh") {
        be.tChe += h;
        if (be.che === "roi") be.y -= 260 * h; // rơi xuống hố
        if (be.tChe >= this.CH.thoiGianGapNan) this.hoiSinh();
        return;
      }

      // 2. Di chuyển nhân vật
      this.diChuyenBe(h);
      // 3. Quái tiến lại gần + viên phép thuật
      this.diChuyenQuai(h);
      this.capNhatDan(h);
      // 5. Thử thách từ: hết hạn / mở thử thách mới
      this.capNhatThuThach();
      // 6. Nhặt kim cương TRƯỚC khi xét va chạm nguy hiểm (cùng khung hình thì vẫn được tính)
      this.nhatKimCuong();
      // 7. Va chạm
      if (this.xetVaCham()) return;
      // 8. Dọn chướng ngại vật đã đi xa phía sau
      this.donDep();
      // 9. Về đích
      if (be.x >= this.doDai) this.veDich();
    }

    /* ---------------- NHÂN VẬT (PlayerController) ---------------- */
    diChuyenBe(h) {
      const be = this.be;
      if (be.che === "khung") {
        be.tChe += h;
        if (be.tChe >= this.CH.thoiGianKhung) this.nhayQuaSauKhiKhung();
        return;
      }
      // Vừa leo qua vật cản: chạy chậm một lúc rồi tăng tốc lại
      let v = this.v;
      if (be.tCham > 0) { be.tCham = Math.max(0, be.tCham - h); v *= this.CH.tiLeTocDoCham; }
      be.x += v * h;
      if (be.nhay) {
        const n = be.nhay;
        n.t += h;
        const u = Math.min(1, n.t / n.T);
        be.y = n.H * 4 * u * (1 - u);
        if (u >= 1) {
          if (n.lyDo === "leoQua") be.tCham = this.CH.thoiGianChamSauKhung;
          be.y = 0; be.nhay = null; be.che = "chay"; be.tTiepDat = 0;
          this.phat("tiepDat");
        }
      }
    }
    batDauNhay(T, H, lyDo) {
      const be = this.be;
      be.nhay = { t: 0, T, H, x0: be.x, lyDo };
      be.che = "nhay";
      this.phat("nhay", { lyDo });
    }
    nhayQuaSauKhiKhung() {
      const be = this.be, o = this.vatCanDangChan;
      this.vatCanDangChan = null;
      be.che = "chay"; be.tChe = 0;
      if (!o) return;
      o.daQua = true; // đã chịu khựng: cho bé leo qua, không va lại nữa
      const dai = (o.x + o.rong + this.CH.nhanVat.rong / 2 + 10) - be.x;
      this.batDauNhay(Math.max(0.5, dai / this.v), o.cao + 40, "leoQua");
    }

    diChuyenQuai(h) {
      for (const o of this.chuongNgai) {
        if (o.dangDi && o.song && !o.boChay) o.x -= o.tocDoDi * h;
        if (!o.song || o.boChay) o.tChet = (o.tChet || 0) + h;
      }
    }

    /* ---------------- PHÉP THUẬT ---------------- */
    banPhep(o) {
      const be = this.be;
      be.tPhep = 0;
      this.dan.push({ x: be.x + 16, y: be.y + 40, o, t: 0 });
      this.phat("phep", { o });
    }
    capNhatDan(h) {
      const s = this.CH.tocDoDan * h;
      for (const d of this.dan) {
        const o = d.o;
        if (!o.song || o.boChay) { d.xong = true; continue; }
        d.t += h;
        const tx = o.x + o.rong / 2, ty = o.bayCao + o.cao / 2;
        const dx = tx - d.x, dy = ty - d.y, kc = Math.hypot(dx, dy);
        if (kc <= s + 12) { d.xong = true; this.trungDan(o); continue; }
        d.x += dx / kc * s; d.y += dy / kc * s;
        if (d.t > 3) d.xong = true;
      }
      this.dan = this.dan.filter(d => !d.xong);
    }
    // Một viên trúng: trừ 1 máu; hết máu thì hạ
    trungDan(o) {
      if (!o.song) return;
      o.mau = Math.max(0, o.mau - 1);
      this.phat("trungDan", { o, mau: o.mau });
      if (o.mau > 0) return;
      const tt = this.thuThach;
      if (tt && tt.o === o && tt.trangThai === "mo") tt.trangThai = "dung";
      this.haQuai(o);
    }
    haQuai(o) {
      if (!o.song) return;
      o.song = false; o.tChet = 0;
      this.phat("haQuai", { o });
    }

    /* ---------------- KIM CƯƠNG (DiamondManager) ---------------- */
    nhatKimCuong() {
      const be = this.be, CH = this.CH, r = CH.kichThuocKimCuong / 2;
      const hop = this.hopBe();
      for (const k of this.kimCuongs) {
        k.tHien += CH.buocVatLy;
        if (k.daNhat) continue;
        if (giaoNhau(hop, { x1: k.x - r, x2: k.x + r, y1: k.y - r, y2: k.y + r })) {
          k.daNhat = true; // đánh dấu NGAY: một viên chỉ tính một lần
          this.kimCuong++; this.tongKimCuong++;
          this.phat("nhatKimCuong", { k, kimCuong: this.kimCuong });
          this.doiMang();
        }
      }
      // dọn viên đã nhặt / đã bị bỏ lại phía sau
      this.kimCuongs = this.kimCuongs.filter(k => !(k.daNhat && k.tHien > 5) && k.x > be.x - 600);
    }

    /* ---------------- MẠNG (LifeManager) ---------------- */
    // Đủ kim cương thì đổi mạng dự trữ; đã đủ giới hạn thì GIỮ kim cương, không tiêu
    doiMang() {
      const CH = this.CH;
      while (this.kimCuong >= CH.kimCuongDoiMang && this.mangDuTru < CH.mangDuTruToiDa) {
        this.kimCuong -= CH.kimCuongDoiMang;
        this.mangDuTru++;
        this.thongKe.mangDoi++;
        this.phat("doiMang", { mangDuTru: this.mangDuTru, kimCuong: this.kimCuong });
      }
    }
    matMang(lyDo, o) {
      const be = this.be;
      if (this.trangThai !== "choi") return false;
      if (lyDo !== "roi" && be.batTu > 0) return false; // đang bất tử: bỏ qua va chạm với quái
      // Dùng mạng dự trữ trước (để bé còn cơ hội đổi thêm)
      if (this.mangDuTru > 0) this.mangDuTru--; else this.mang--;
      this.thongKe.matMang++;
      this.dongThuThach();
      this.dan = [];
      be.nhay = null; be.tChe = 0;
      be.che = lyDo === "roi" ? "roi" : "gapNan";
      if (o) {
        o.trangThai = "qua";
        if (o.nhom !== "ho") { o.boChay = true; o.tChet = 0; }
      }
      // Vị trí hồi sinh an toàn: qua hẳn chướng ngại vật, không rơi vào hố, không sát cái kế tiếp
      let viTri = o ? o.x + o.rong + this.CH.leHoiSinh + this.CH.nhanVat.rong / 2 : be.x;
      const keTiep = this.chuongNgai.find(c => c !== o && c.trangThai === "cho" && c.x > be.x);
      // (phòng xa) không hồi sinh vào sát cái kế tiếp: chừa ít nhất 60% thời gian phản ứng
      if (keTiep) viTri = Math.min(viTri, keTiep.x + keTiep.rong / 2 - khoangKichHoat(keTiep, this.v, this.dk.thoiGianPhanUng * 0.6));
      this.viTriHoiSinh = Math.max(viTri, o ? o.x + o.rong + this.CH.nhanVat.rong / 2 + 4 : be.x);
      this.phat("matMang", { lyDo, o, mang: this.mang, mangDuTru: this.mangDuTru });
      this.doiMang(); // vừa xuống dưới giới hạn: nếu đang để dành đủ kim cương thì đổi ngay
      if (this.tongMang <= 0) { this.ketThuc("hetMang"); return true; }
      this.trangThai = "hoiSinh";
      return true;
    }
    hoiSinh() {
      const be = this.be;
      be.x = this.viTriHoiSinh; be.y = 0; be.nhay = null; be.tCham = 0;
      be.che = "chay"; be.tChe = 0;
      be.batTu = this.CH.thoiGianBatTu;
      this.trangThai = "choi";
      this.phat("hoiSinh");
    }

    /* ---------------- THỬ THÁCH TỪ (WordChallengeManager) ---------------- */
    khoangTam(o) { return o.x + o.rong / 2 - this.be.x; }
    capNhatThuThach() {
      const tt = this.thuThach;
      // Không còn kịp: bé đã chạy qua chướng ngại vật mà thử thách vẫn mở (thường thì va chạm
      // đã đóng thử thách trước đó). Bấm trễ trong lúc còn mở vẫn được: nhảy / bắn nhưng có thể chạm.
      if (tt && tt.trangThai === "mo" && this.khoangTam(tt.o) < -(tt.o.rong + this.CH.nhanVat.rong) / 2) {
        this.dongThuThach();
        this.phat("hetHanThuThach", { tt });
      }
      // Chướng ngại vật đã đi qua
      const wp = this.CH.nhanVat.rong;
      for (const o of this.chuongNgai) {
        if (o.trangThai !== "qua" && o.trangThai !== "cho" && this.be.x - wp / 2 > o.x + o.rong + 10) o.trangThai = "qua";
      }
      // Mở thử thách mới: chỉ MỘT thử thách mỗi lúc, cái trước phải được đi qua hẳn
      if (this.thuThach && this.thuThach.trangThai === "mo") return;
      const keTiep = this.chuongNgai.find(o => o.trangThai === "cho");
      if (!keTiep) return;
      if (this.khoangTam(keTiep) < 0) { keTiep.trangThai = "qua"; return; } // (phòng xa) đã lỡ đi qua
      const truoc = this.chuongNgai.filter(o => o.id < keTiep.id && o.trangThai !== "qua");
      if (truoc.length) return;
      if (this.khoangTam(keTiep) > khoangKichHoat(keTiep, this.v, this.dk.thoiGianPhanUng)) return;
      this.moThuThach(keTiep);
    }
    moThuThach(o) {
      o.trangThai = "hoi";
      if (o.tocDoDi) o.dangDi = true; // quái "nhìn thấy" bé và bắt đầu tiến lại
      this.soThuThach++;
      this.thuThach = {
        id: this.soThuThach, o, tu: o.tu,
        phuongAn: this.khoTu.taoPhuongAn(o.tu), daSai: [], trangThai: "mo",
        tMo: this.tChoi, thoiHan: thoiGianPhanUng(o, this.dk.thoiGianPhanUng), soVien: 0, daDung: false
      };
      this.phat("thuThachMoi", { tt: this.thuThach });
    }
    // Phần trăm thời gian còn lại để chọn (cho thanh đếm ngược)
    phanThoiGianConLai() {
      const tt = this.thuThach;
      if (!tt || tt.trangThai !== "mo") return 0;
      const con = (this.khoangTam(tt.o) - khoangHetHan(tt.o, this.v)) / tocDoKhep(tt.o, this.v);
      return Math.max(0, Math.min(1, con / tt.thoiHan));
    }
    // ghiSo = false khi lượt chơi kết thúc giữa chừng: bé chưa kịp đọc nên không tính là chưa thuộc
    dongThuThach(ghiSo = true) {
      const tt = this.thuThach;
      if (!tt || tt.trangThai !== "mo") return;
      tt.trangThai = "het";
      if (tt.daDung) return; // đã bắn trúng mà chưa hạ kịp: từ vẫn tính là đúng
      tt.o.trangThai = "truot";
      if (ghiSo) { this.ghiKetQuaTu(tt, false); this.thongKe.truot++; }
    }
    // Cho giao diện / kiểm thử: bé có đang ở đúng lúc bấm nhảy không
    trongCuaSoNhay() {
      const tt = this.thuThach;
      if (!tt || tt.trangThai !== "mo" || tt.o.hanhDong !== "nhay") return false;
      const [gan, xa] = cuaSoNhay(tt.o, this.v), d = this.khoangTam(tt.o);
      return d >= gan && d <= xa;
    }
    // Ghi vào sổ của bé: đúng ngay lần bấm đầu = nhớ từ; sai rồi mới đúng / không kịp = chưa thuộc
    ghiKetQuaTu(tt, thuoc) {
      if (tt.daGhi) return;
      tt.daGhi = true;
      if (thuoc) this.thongKe.tuThuoc = (this.thongKe.tuThuoc || 0) + 1;
      if (this.soTay) { try { this.soTay.ghi(tt.tu.en, thuoc); } catch (e) { /* bỏ qua */ } }
      this.phat("ketQuaTu", { tu: tt.tu, thuoc });
    }

    // Người chơi bấm một phương án. Trả về { kq: "dung" | "sai" | "boQua" }
    chonDapAn(idThuThach, tu) {
      const tt = this.thuThach;
      if (this.trangThai !== "choi") return { kq: "boQua", lyDo: "khongChoi" };
      if (!tt || tt.id !== idThuThach) return { kq: "boQua", lyDo: "thuThachCu" };
      if (tt.trangThai !== "mo") return { kq: "boQua", lyDo: "daDong" };
      if (tt.daSai.indexOf(tu) >= 0) return { kq: "boQua", lyDo: "daChonRoi" };
      if (tt.phuongAn.indexOf(tu) < 0) return { kq: "boQua", lyDo: "khongCo" };
      if (tu === tt.tu.en && tt.o.hanhDong === "nhay" && tt.daDung) return { kq: "boQua", lyDo: "daNhay" };
      if (tu !== tt.tu.en) {
        tt.daSai.push(tu);
        this.thongKe.sai++;
        this.phat("chonSai", { tt, tu });
        return { kq: "sai" };
      }
      const o = tt.o, be = this.be;
      if (o.hanhDong === "nhay") {
        // Đang lơ lửng (vd cú nhảy nhặt kim cương) thì chưa nhảy được: bé bấm lại sau
        if (be.nhay || be.che !== "chay") return { kq: "boQua", lyDo: "dangNhay" };
        tt.trangThai = "dung";
        this.ghiLanDungDau(tt, tu);
        // NHẢY NGAY, cự ly cố định: canh giờ là việc của bé
        const T = thoiGianNhay(this.v), H = this.CH.doCaoNhay;
        this.batDauNhay(T, H, "vuot");
        tt.cuaSo = cuaSoNhay(o, this.v); tt.khoangKhiBam = this.khoangTam(o);
        return { kq: "dung" };
      }
      // BẮN NGAY một viên; khung chọn từ giữ nguyên tới khi quái / vật cản hết máu
      if (!tt.daDung) this.ghiLanDungDau(tt, tu);
      else this.phat("chonDung", { tt, tu, lan: tt.soVien + 1 });
      tt.soVien = (tt.soVien || 0) + 1;
      this.banPhep(o);
      return { kq: "dung" };
    }
    // Lần đầu chọn đúng một thử thách: ghi sổ, thống kê, báo sự kiện
    ghiLanDungDau(tt, tu) {
      tt.daDung = true;
      this.ghiKetQuaTu(tt, tt.daSai.length === 0);
      tt.o.trangThai = "daTraLoi";
      this.thongKe.dung++;
      if (this.thongKe.tuDung.indexOf(tt.tu) < 0) this.thongKe.tuDung.push(tt.tu);
      this.phat("chonDung", { tt, tu, lan: 1 });
    }

    /* ---------------- VA CHẠM ---------------- */
    hopBe() {
      const b = this.be, CH = this.CH;
      return { x1: b.x - CH.nhanVat.rong / 2, x2: b.x + CH.nhanVat.rong / 2, y1: b.y, y2: b.y + CH.nhanVat.cao };
    }
    // Trả về true nếu lượt chơi đổi trạng thái (gặp nạn / thua)
    xetVaCham() {
      const be = this.be, hop = this.hopBe(), co = this.CH.coVaCham; // co: thu nhỏ hộp va chạm cho dễ thở
      for (const o of this.chuongNgai) {
        if (o.x > be.x + 200) break;
        if (o.x + o.rong < be.x - 200) continue;
        if (o.nhom === "ho") {
          // Rơi: tâm bé nằm trong miệng hố khi đang chạm đất
          if (!be.nhay && be.y <= 0 && be.x > o.x + 6 && be.x < o.x + o.rong - 6) {
            this.phat("roiHo", { o });
            return this.matMang("roi", o);
          }
          continue;
        }
        if (o.daQua || !o.song || o.boChay) continue;
        const hopO = { x1: o.x + co, x2: o.x + o.rong - co, y1: o.bayCao, y2: o.bayCao + o.cao - co };
        if (!giaoNhau(hop, hopO)) continue;
        if (o.vaCham === "khung") {
          if (be.che === "khung") continue;
          // Va ống cống / đá / gốc cây: khựng lại, KHÔNG mất mạng, đồng hồ vẫn chạy
          be.x = o.x - this.CH.nhanVat.rong / 2 - 1;
          be.y = 0; be.nhay = null; be.che = "khung"; be.tChe = 0;
          this.vatCanDangChan = o;
          this.dongThuThach();
          this.phat("khung", { o });
          continue;
        }
        if (be.batTu > 0) continue;
        this.phat("vaQuai", { o });
        return this.matMang("quai", o);
      }
      return false;
    }

    donDep() {
      const x = this.be.x;
      this.chuongNgai = this.chuongNgai.filter(o => o.x + o.rong > x - 700 || o.trangThai !== "qua");
    }

    /* ---------------- KẾT THÚC ---------------- */
    veDich() {
      if (this.trangThai !== "choi") return;
      this.trangThai = "thang";
      this.tKetThuc = 0;
      this.dongThuThach(false);
      this.be.che = "thang"; this.be.nhay = null; this.be.y = 0;
      this.phat("thang", { thoiGian: this.thoiGian, laManCuoi: !!this.dk.laManCuoi });
    }
    ketThuc(lyDo) {
      if (this.trangThai === "thang" || this.trangThai === "thua") return;
      this.trangThai = "thua";
      this.lyDoThua = lyDo;
      this.tKetThuc = 0;
      this.dongThuThach(false);
      this.dan = [];
      this.phat("thua", { lyDo });
    }
    // Số sao: theo tỉ lệ trả lời đúng (không tính tốc độ - công bằng giữa các bé)
    soSao() {
      if (this.trangThai !== "thang") return 0;
      const t = this.thongKe, tong = t.dung + t.sai + t.truot;
      const tiLe = tong ? t.dung / tong : 1;
      return tiLe >= 0.85 ? 3 : tiLe >= 0.6 ? 2 : 1;
    }
  }
  ST.TroChoi = TroChoi;
})(typeof window !== "undefined" ? window : globalThis);
