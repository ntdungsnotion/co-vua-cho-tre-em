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
   TỌA ĐỘ: x = quãng đường (tăng về phía lâu đài), y = độ cao so với mặt đất.
           Nhân vật: x là TÂM người, y là CHÂN. Chướng ngại vật: x là MÉP TRÁI.
   THỨ TỰ XỬ LÝ MỖI BƯỚC (cố định để không chồng chéo):
     đồng hồ -> di chuyển -> phép thuật -> nhảy theo kế hoạch -> thử thách
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
  function thoiGianNhay(o, v) {
    const CH = ST.CAU_HINH, wp = CH.nhanVat.rong;
    if (o.nhom === "ho") return Math.max(CH.thoiGianNhayToiThieu, (o.rong + 2 * CH.leNhay) / v);
    return Math.max(CH.thoiGianNhayToiThieu, (o.rong + wp + 2 * CH.leNhay) / tocDoKhep(o, v));
  }
  // Khoảng cách TÂM (quái - bé) mà tại đó bé phải cất cánh / phép thuật phải bắn
  function khoangHetHan(o, v) {
    const CH = ST.CAU_HINH;
    if (o.hanhDong === "nhay") return tocDoKhep(o, v) * thoiGianNhay(o, v) / 2 + 6;
    return (o.rong + CH.nhanVat.rong) / 2 + CH.khoangPhepToiThieu;
  }
  // Khoảng cách TÂM mà tại đó thử thách hiện ra: còn đúng "thoiGianPhanUng" giây để chọn
  function khoangKichHoat(o, v, phanUng) { return khoangHetHan(o, v) + tocDoKhep(o, v) * phanUng; }

  ST.thoiGianNhay = thoiGianNhay;
  ST.khoangHetHan = khoangHetHan;
  ST.khoangKichHoat = khoangKichHoat;

  /* ================================================================
     SINH ĐƯỜNG ĐI (LevelGenerator): xếp chướng ngại vật có kiểm soát
     ================================================================ */
  function sinhDuongDi(dk, rng, khoTu) {
    const CH = ST.CAU_HINH, v = dk.tocDo;
    const dai = Math.round(v * dk.thoiGianDiDuKien);   // vị trí cổng lâu đài
    const ds = [];
    const tenLoai = Object.keys(dk.loai);
    let mepSau = v * CH.choTruocKhiVaoDuong - CH.leQuaChuongNgai; // mép sau của "chướng ngại vật trước"
    let kcLienTiep = 0;

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
      const ma = chonLoai(i), L = ST.LOAI_CHUONG_NGAI[ma];
      const o = {
        id: i + 1, loai: ma, ten: L.ten, nhom: L.nhom, hanhDong: L.hanhDong, vaCham: L.vaCham,
        rong: Math.round(doanTrong(rng, L.rong)), cao: Math.round(doanTrong(rng, L.cao)),
        bayCao: L.bayCao || 0, tocDoDi: L.tocDoDi || 0, dangDi: false,
        song: true, boChay: false, daQua: false, trangThai: "cho", bienThe: Math.floor(rng() * 3)
      };
      const tam = mepSau + CH.leQuaChuongNgai + khoangKichHoat(o, v, dk.thoiGianPhanUng) + doanTrong(rng, dk.khoangThem);
      o.x = Math.round(tam - o.rong / 2);
      // Phần đường cần sau chướng ngại vật này: với loại bắn phép có cú nhảy nhặt kim cương
      const duoi = o.hanhDong === "phep" ? v * CH.thoiGianNhayKimCuong + 60 : 0;
      if (o.x + o.rong + duoi + CH.khoangCuoiTruocLauDai > dai) break;
      o.tu = khoTu.layTu();
      // Kim cương gắn trên từ: theo xác suất, không quá N từ có kim cương liên tiếp
      o.soKimCuong = 0;
      if (kcLienTiep < dk.kimCuongLienTiepToiDa && rng() < dk.tiLeKimCuong) {
        const [a, b] = dk.soVienKimCuong;
        o.soKimCuong = a + Math.floor(rng() * (b - a + 1));
        kcLienTiep++;
      } else kcLienTiep = 0;
      ds.push(o);
      mepSau = o.x + o.rong + duoi;
    }
    return { dai, ds };
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
      this.kimCuongs = [];      // kim cương đang nằm trên đường (sau khi trả lời đúng)
      this.nhayKimCuong = null; // kế hoạch nhảy nhặt kim cương (sau khi bắn phép)
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
      // 4. Nhảy theo kế hoạch (đã trả lời đúng) + nhảy nhặt kim cương
      this.kiemTraCatCanh();
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
        if (kc <= s + 12) { d.xong = true; this.haQuai(o); continue; }
        d.x += dx / kc * s; d.y += dy / kc * s;
        if (d.t > 3) d.xong = true;
      }
      this.dan = this.dan.filter(d => !d.xong);
    }
    haQuai(o) {
      if (!o.song) return;
      o.song = false; o.tChet = 0;
      this.phat("haQuai", { o });
      if (o.choKimCuong > 0) {
        // Kim cương đặt ngay trên đường bé chạy, đúng đỉnh một cú nhảy nhỏ phía trước
        const CH = this.CH, T = CH.thoiGianNhayKimCuong, H = CH.doCaoNhayKimCuong;
        const dinh = Math.max(o.x + o.rong / 2, this.be.x + this.v * T / 2 + 30);
        const xCatCanh = dinh - this.v * T / 2;
        this.datKimCuong(o, o.choKimCuong, xCatCanh, T, H);
        this.nhayKimCuong = { xCatCanh, T, H, o };
        o.choKimCuong = 0;
      }
    }

    /* ---------------- KIM CƯƠNG (DiamondManager) ---------------- */
    // Rải các viên kim cương dọc ĐÚNG quỹ đạo cú nhảy sắp tới -> chắc chắn chạm được
    datKimCuong(o, so, xCatCanh, T, H) {
      const viTri = so === 1 ? [0.5] : so === 2 ? [0.4, 0.6] : [0.32, 0.5, 0.68];
      const caoTam = this.CH.nhanVat.cao / 2;
      viTri.forEach(u => {
        this.kimCuongs.push({
          x: xCatCanh + this.v * T * u, y: H * 4 * u * (1 - u) + caoTam,
          daNhat: false, tuO: o.id, tHien: 0
        });
      });
      this.phat("hienKimCuong", { o, so });
    }
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
      this.dan = []; this.nhayKimCuong = null; be.giuPhep = false;
      this.kimCuongs = this.kimCuongs.filter(k => k.daNhat);
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
      // Hết hạn: bé đã tới điểm phải hành động mà chưa chọn đúng
      if (tt && tt.trangThai === "mo" && this.khoangTam(tt.o) <= khoangHetHan(tt.o, this.v)) {
        tt.trangThai = "het"; tt.o.trangThai = "truot";
        this.ghiKetQuaTu(tt, false);
        this.thongKe.truot++;
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
        id: this.soThuThach, o, tu: o.tu, soKimCuong: o.soKimCuong,
        phuongAn: this.khoTu.taoPhuongAn(o.tu), daSai: [], trangThai: "mo",
        tMo: this.tChoi, thoiHan: this.dk.thoiGianPhanUng
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
      if (tt && tt.trangThai === "mo") { tt.trangThai = "het"; tt.o.trangThai = "truot"; if (ghiSo) this.ghiKetQuaTu(tt, false); }
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
      if (tu !== tt.tu.en) {
        tt.daSai.push(tu);
        this.thongKe.sai++;
        this.phat("chonSai", { tt, tu });
        return { kq: "sai" };
      }
      tt.trangThai = "dung";
      this.ghiKetQuaTu(tt, tt.daSai.length === 0);
      const o = tt.o;
      o.trangThai = "daTraLoi";
      this.thongKe.dung++;
      if (this.thongKe.tuDung.indexOf(tt.tu) < 0) this.thongKe.tuDung.push(tt.tu);
      this.phat("chonDung", { tt, tu });
      if (o.hanhDong === "nhay") {
        // Dự tính điểm cất cánh: tâm bé cách tâm vật cản đúng nửa quãng nhảy tương đối
        const T = thoiGianNhay(o, this.v), H = this.CH.doCaoNhay;
        const R = tocDoKhep(o, this.v) * T / 2;
        const tau = Math.max(0, (this.khoangTam(o) - R) / tocDoKhep(o, this.v));
        o.keHoach = { xCatCanh: this.be.x + this.v * tau, T, H };
        if (o.soKimCuong > 0) this.datKimCuong(o, o.soKimCuong, o.keHoach.xCatCanh, T, H);
      } else {
        // Bắn khi quái đã vào tầm nhìn (để bé THẤY phép thuật trúng quái); đã ở gần thì bắn ngay
        o.choKimCuong = o.soKimCuong;
        o.choBan = true;
        this.be.giuPhep = true;
        this.kiemTraBanPhep();
      }
      return { kq: "dung" };
    }

    kiemTraBanPhep() {
      for (const o of this.chuongNgai) {
        if (o.choBan && o.song && this.khoangTam(o) <= this.CH.tamBanPhep) {
          o.choBan = false; this.be.giuPhep = false;
          this.banPhep(o);
        }
      }
    }
    kiemTraCatCanh() {
      this.kiemTraBanPhep();
      const be = this.be;
      if (be.che !== "chay" || be.nhay) return;
      for (const o of this.chuongNgai) {
        if (o.keHoach && !o.keHoach.daNhay && be.x >= o.keHoach.xCatCanh) {
          o.keHoach.daNhay = true;
          this.batDauNhay(o.keHoach.T, o.keHoach.H, "vuot");
          return;
        }
      }
      const nk = this.nhayKimCuong;
      if (nk && be.x >= nk.xCatCanh) {
        this.nhayKimCuong = null;
        this.batDauNhay(nk.T, nk.H, "kimCuong");
      }
    }

    /* ---------------- VA CHẠM ---------------- */
    hopBe() {
      const b = this.be, CH = this.CH;
      return { x1: b.x - CH.nhanVat.rong / 2, x2: b.x + CH.nhanVat.rong / 2, y1: b.y, y2: b.y + CH.nhanVat.cao };
    }
    // Trả về true nếu lượt chơi đổi trạng thái (gặp nạn / thua)
    xetVaCham() {
      const be = this.be, hop = this.hopBe(), co = 5; // co: thu nhỏ hộp va chạm cho dễ thở
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
