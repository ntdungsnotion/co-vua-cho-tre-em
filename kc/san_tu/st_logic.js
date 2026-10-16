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
             (sau khi người dùng thử 16/10) Bé nhảy được NHIỀU LẦN: còn từ đang hỏi thì bấm lại
             đúng từ là nhảy tiếp, miễn là đang đứng trên đất. Kim cương luôn ở trên không.
             (người dùng chốt lại 16/10) Kim cương thành CỤM riêng ở đoạn đường trống, mỗi cụm có
             một từ như chướng ngại vật (bấm đúng là nhảy lên lấy); cú nhảy ngắn lại còn 3 đơn vị
             (1 đơn vị = cỡ một con quái). Chốt lần cuối: đơn vị = bề ngang của CHÍNH vật sắp gặp
             (thongSoNhay); mọi quái bay luôn phải bắn (không tính vào giới hạn 1/4).
             Kho quái phong phú: trọng số các loại xáo ngẫu nhiên mỗi lượt, không 2 cái giống nhau
             liền nhau, cố tránh loại vừa gặp; cái đầu là một vật cản thấp bất kỳ (không chỉ ống cống).
             Gặp quái nhiều máu mà không đủ giờ bắn thì bé chạy chậm lại (tinhHeSoTocDo), chỉ khi quái
             đã hiện trên màn hình và chậm ít. HANG KIM CƯƠNG: rơi hố có xác suất vào hang (vaoHang).
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
  /* CÚ NHẢY theo KÍCH THƯỚC của vật sắp gặp (người dùng chốt 16/10/2026): 1 đơn vị = bề ngang
     của chính quái / vật cản / hố đó, cú nhảy dài soDonViNhay (3) đơn vị; cao tiLeCaoNhay (2) lần
     chiều cao của vật (ít nhất 1/3 cự ly, tối đa doCaoNhay). Cụm kim cương: cú nhảy mặc định. */
  function thongSoNhay(o) {
    const CH = ST.CAU_HINH;
    if (!o || o.nhom === "kimCuong") return { D: CH.cuLyNhay, H: CH.doCaoNhayKimCuong };
    const D = CH.soDonViNhay * o.rong;
    return { D, H: Math.min(CH.doCaoNhay, Math.max(CH.tiLeCaoNhay * (o.bayCao + o.cao), D / 3)) };
  }
  // Thời gian bay của cú nhảy vượt vật o (đi đúng cự ly D trên mặt đất)
  function thoiGianNhay(v, o) { return thongSoNhay(o).D / v; }
  /* CỬA SỔ NHẢY: khoảng cách TÂM (vật - bé) lúc bấm mà cú nhảy cố định qua được an toàn.
     Bấm khi còn xa hơn [1] (quá sớm): đáp xuống trước vật / rơi vào hố. Bấm khi đã gần hơn
     [0] (quá trễ): chưa lên đủ cao đã chạm. Trả về [gầnNhất, xaNhất]. */
  function cuaSoNhay(o, v) {
    const CH = ST.CAU_HINH, w = tocDoKhep(o, v), nh = thongSoNhay(o), D = w * nh.D / v, le = CH.leNhay;
    if (o.nhom === "kimCuong") return [D / 2 - CH.kimCuongLe, D / 2 + CH.kimCuongLe]; // đỉnh cú nhảy ngay giữa cụm
    if (o.nhom === "ho") { const s = o.rong / 2 - 6 + le; return [s, D - s]; } // bay qua trọn miệng hố
    const s = (o.rong - 2 * CH.coVaCham + CH.nhanVat.rong) / 2 + le;          // nửa quãng chồng nhau theo chiều ngang
    const dinh = Math.min(nh.H * 0.99, o.bayCao + o.cao - CH.coVaCham + le); // phải cao hơn đỉnh vật
    const a = (1 - Math.sqrt(1 - dinh / nh.H)) / 2;                    // phần cú nhảy còn thấp hơn đỉnh vật
    return [s + D * a, D * (1 - a) - s];
  }
  // Khoảng cách TÂM mà tại đó thanh đếm ngược hết: nhảy = hết cửa sổ an toàn; bắn = quái đã sát
  function khoangHetHan(o, v) {
    const CH = ST.CAU_HINH;
    if (o.hanhDong === "nhay") return cuaSoNhay(o, v)[1];
    return (o.rong + CH.nhanVat.rong) / 2 + CH.khoangPhepToiThieu;
  }
  // Thời gian đọc từ: quái nhiều máu được thêm giờ cho mỗi viên từ viên thứ 2
  // Cụm kim cương: bỏ lỡ không mất gì nên thời gian đọc ngắn hơn (tiLeDocKimCuong)
  function thoiGianPhanUng(o, phanUng) {
    if (o.nhom === "kimCuong") return phanUng * ST.CAU_HINH.tiLeDocKimCuong;
    return phanUng + (o.mau > 1 ? ST.CAU_HINH.thoiGianThemMoiVien * (o.mau - 1) : 0);
  }
  // Khoảng cách TÂM mà tại đó thử thách hiện ra: còn đúng "thời gian phản ứng" giây
  function khoangKichHoat(o, v, phanUng) { return khoangHetHan(o, v) + tocDoKhep(o, v) * thoiGianPhanUng(o, phanUng); }

  ST.thoiGianNhay = thoiGianNhay;
  ST.thongSoNhay = thongSoNhay;
  ST.khoangHetHan = khoangHetHan;
  ST.khoangKichHoat = khoangKichHoat;
  ST.cuaSoNhay = cuaSoNhay;

  /* ================================================================
     SINH ĐƯỜNG ĐI (LevelGenerator): xếp chướng ngại vật có kiểm soát
     ================================================================ */
  /* Xếp đường; màn ngắn mà cụm kim cương chiếm nhiều chỗ thì có thể thiếu quái / hố:
     xếp lại (tối đa 30 lần) tới khi đủ số chướng ngại vật nguy hiểm >= số mạng ban đầu,
     để không bấm gì thì không thể qua màn. Từ chỉ gắn SAU khi chốt cách xếp. */
  function sinhDuongDi(dk, rng, khoTu) {
    const nguyHiem = o => o.vaCham === "matMang" || o.vaCham === "roi";
    let d = null;
    for (let lan = 0; lan < 30; lan++) {
      d = xepDuong(dk, rng);
      if (dk.thuTu || d.ds.filter(nguyHiem).length >= ST.CAU_HINH.mangBanDau) break;
    }
    d.ds.forEach(o => { o.tu = khoTu.layTu(); });
    return d;
  }
  function xepDuong(dk, rng) {
    const CH = ST.CAU_HINH, v = dk.tocDo;
    // màn Tập chơi: chướng ngại vật xếp sẵn (dk.thuTu), cổng đích đặt ngay sau cái cuối
    let dai = dk.thuTu ? 1e9 : Math.round(v * dk.thoiGianDiDuKien);   // vị trí cổng lâu đài
    const ds = [];
    const tenLoai = Object.keys(dk.loai).filter(t => ST.LOAI_CHUONG_NGAI[t]);
    // Mỗi lượt chơi XÁO trọng số (x0.3 .. x1.7): chơi lại cùng màn vẫn gặp quái khác, thứ tự khác
    const trongSo = {};
    tenLoai.forEach(t => { trongSo[t] = dk.loai[t] * (0.3 + 1.4 * rng()); });
    const LCN = t => ST.LOAI_CHUONG_NGAI[t];
    let mepSau = v * CH.choTruocKhiVaoDuong - CH.leQuaChuongNgai; // mép sau của "chướng ngại vật trước"
    let soQuai = 0, soCoMau = 0; // quái có thanh máu: luôn KHÔNG QUÁ 1/4 số quái (ở mọi đoạn đường)
    const bocTham = nhom => {
      let tong = 0; nhom.forEach(t => { tong += trongSo[t]; });
      let r = rng() * tong;
      for (const t of nhom) { r -= trongSo[t]; if (r <= 0) return t; }
      return nhom[nhom.length - 1];
    };

    function chonLoai(i) {
      // cái đầu tiên luôn là một vật cản thấp (chỉ khựng, không mất mạng) để bé làm quen; loại thì ngẫu nhiên
      if (i === 0) {
        const an = tenLoai.filter(t => LCN(t).nhom === "can" && !LCN(t).caoHonNhay);
        return an.length ? bocTham(an) : "cong";
      }
      // Bảo đảm đủ tỉ lệ chướng ngại vật nguy hiểm: không thể về đích mà không trả lời từ nào
      const nguyHiem = t => { const vc = LCN(t).vaCham; return vc === "matMang" || vc === "roi"; };
      const vat = ds.filter(o => o.nhom !== "kimCuong");
      const soNguyHiem = vat.filter(o => nguyHiem(o.loai)).length;
      // ít nhất bằng số mạng ban đầu: cụm kim cương chiếm chỗ nên màn ngắn vẫn phải đủ quái / hố
      const epNguyHiem = soNguyHiem < Math.max((dk.tiLeNguyHiemToiThieu || 0) * i, Math.min(i, CH.mangBanDau));
      const nhom = epNguyHiem ? tenLoai.filter(nguyHiem) : tenLoai;
      const n = vat.length, ganDay = vat.slice(-3).map(o => o.loai);
      for (let thu = 0; thu < 30; thu++) {
        const ma = bocTham(nhom);
        // không 2 cái giống nhau liền nhau; cố tránh cả loại vừa gặp trong 3 cái gần nhất
        if (n >= 1 && vat[n - 1].loai === ma && nhom.length > 1) continue;
        if (thu < 15 && ganDay.includes(ma) && nhom.length > 4) continue;
        // màn dễ: không để 3 cái nguy hiểm (mất mạng) đứng liền nhau
        // (cụm kim cương xen giữa cũng là một quãng nghỉ)
        const m = ds.length;
        // (riêng khi chưa đủ số quái / hố tối thiểu bằng số mạng thì vẫn phải xếp)
        if (dk.soPhuongAn <= 2 && soNguyHiem >= CH.mangBanDau && m >= 2 && nguyHiem(ds[m - 1].loai) && nguyHiem(ds[m - 2].loai) && nguyHiem(ma)) continue;
        return ma;
      }
      return nhom.find(t => !(n >= 1 && vat[n - 1].loai === t)) || nhom[0];
    }

    /* KIM CƯƠNG: chia tổng số viên thành các CỤM (tối đa kimCuongMoiCum viên), mỗi cụm chiếm
       một "ô" riêng trên đường (chỗ trống, không có vật cản / quái) và có MỘT TỪ riêng như một
       chướng ngại vật. Ô 0 luôn là ống cống; các cụm không đứng liền nhau. */
    const kimCuongs = [], cumKC = [];
    if (!dk.thuTu) {
      const [ka, kb] = dk.soKimCuong;
      const tong = ka + Math.floor(rng() * (kb - ka + 1));
      const quangO = CH.leQuaChuongNgai + v * dk.thoiGianPhanUng + (dk.khoangThem[0] + dk.khoangThem[1]) / 2 + v * 0.9 + 60; // ước lượng một ô
      const soO = Math.max(3, Math.floor((dai - mepSau - CH.khoangCuoiTruocLauDai) / quangO));
      const soCum = Math.ceil(tong / CH.kimCuongMoiCum), viTri = [];
      for (let lan = 0; lan < 300 && viTri.length < soCum; lan++) {
        const k = 1 + Math.floor(rng() * (soO - 2));
        if (!viTri.some(x => Math.abs(x - k) < 2)) viTri.push(k);
      }
      viTri.sort((p, q) => p - q);
      let con = tong;
      viTri.forEach((k, j) => { const so = Math.min(CH.kimCuongMoiCum, Math.ceil(con / (viTri.length - j))); con -= so; cumKC.push({ k, so }); });
    }
    function taoCumKimCuong() {
      const L = ST.LOAI_CHUONG_NGAI.kimCuong;
      return { loai: "kimCuong", ten: L.ten, nhom: L.nhom, hanhDong: "nhay", vaCham: L.vaCham, mau: 0, mauToiDa: 0,
        rong: Math.round(CH.cuLyNhay * 0.56 + CH.kichThuocKimCuong), cao: 0, bayCao: 0, tocDoDi: 0, dangDi: false,
        song: true, boChay: false, daQua: false, trangThai: "cho", bienThe: 0 };
    }
    // Các viên của một cụm xếp theo đường cong cú nhảy: bấm đúng lúc (tâm cụm cách bé nửa cú nhảy) là lấy đủ
    function xepKimCuong(tam, so, idCum) {
      const { D, H } = thongSoNhay(null);
      for (let j = 0; j < so; j++) {
        const u = so === 1 ? 0.5 : 0.22 + 0.56 * j / (so - 1);
        kimCuongs.push({ x: Math.round(tam - D / 2 + D * u), y: Math.round(4 * H * u * (1 - u) + CH.nhanVat.cao / 2), loai: "cao", daNhat: false, tHien: 0, cum: idCum });
      }
    }

    let iVat = 0; // số chướng ngại vật thật đã xếp (không tính cụm kim cương)
    for (let k = 0; k < (dk.thuTu ? dk.thuTu.length : 200); k++) {
      const cum = dk.thuTu ? (dk.thuTu[k].loai === "kimCuong" ? { so: Math.min(dk.thuTu[k].so || 3, dk.soKimCuong[1]) } : null) : cumKC.find(c => c.k === k);
      let o;
      if (cum) o = taoCumKimCuong();
      else {
        let ma = dk.thuTu ? dk.thuTu[k].loai : chonLoai(iVat), L = ST.LOAI_CHUONG_NGAI[ma];
        let mau = 0;
        if (dk.thuTu) mau = dk.thuTu[k].mau || (L.caoHonNhay ? dk.mauQuai : 0);
        else if (L.nhom === "quaiBay") mau = dk.mauQuai; // quái bay: LUÔN phải bắn (người dùng chốt)
        else if (L.nhom === "quaiDat") {
          soQuai++;
          const choPhep = (soCoMau + 1) * 4 <= soQuai;
          if (L.caoHonNhay && !choPhep) { // quái khổng lồ mà đã đủ 1/4: đổi thành quái nhỏ nhảy qua được
            const truoc = ds.filter(x => x.nhom !== "kimCuong").slice(-1).map(x => x.loai)[0];
            const nho = tenLoai.filter(t => LCN(t).nhom === "quaiDat" && !LCN(t).caoHonNhay && t !== truoc);
            ma = nho.length ? bocTham(nho) : "nam"; L = LCN(ma);
          }
          if (L.caoHonNhay || (choPhep && rng() < dk.tiLeCoMau)) { mau = dk.mauQuai; soCoMau++; }
        } else if (L.caoHonNhay) mau = dk.mauQuai; // vật cản cao hơn cú nhảy: phải bắn
        o = {
          loai: ma, ten: L.ten, nhom: L.nhom, hanhDong: mau > 0 ? "ban" : "nhay", vaCham: L.vaCham,
          mau, mauToiDa: mau,
          rong: Math.round(doanTrong(rng, L.rong)), cao: Math.round(doanTrong(rng, L.cao)),
          bayCao: L.bayCao || 0, tocDoDi: L.tocDoDi || 0, dangDi: false,
          song: true, boChay: false, daQua: false, trangThai: "cho", bienThe: Math.floor(rng() * 3)
        };
      }
      o.id = ds.length + 1;
      const tam = mepSau + CH.leQuaChuongNgai + khoangKichHoat(o, v, dk.thoiGianPhanUng) + doanTrong(rng, dk.khoangThem);
      o.x = Math.round(tam - o.rong / 2);
      if (o.x + o.rong + CH.khoangCuoiTruocLauDai > dai) break;
      ds.push(o);
      if (cum) { o.soKimCuong = cum.so; xepKimCuong(o.x + o.rong / 2, cum.so, o.id); } else iVat++;
      mepSau = o.x + o.rong;
    }
    if (dk.thuTu) dai = Math.round(mepSau + CH.khoangCuoiTruocLauDai + 40);
    return { dai, ds, kimCuongs: kimCuongs.sort((p, q) => p.x - q.x) };
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
      this.heSoTocDo = 1;       // < 1: đang chạy chậm lại cho bé kịp bắn quái nhiều máu
      this.hang = null;         // đang ở hang kim cương (rơi hố may mắn)
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
      // 0. Đang ở HANG KIM CƯƠNG: đồng hồ đứng yên, thế giới bên ngoài đứng yên
      if (this.hang) { this.buocHang(h); return; }
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

      // 2. Di chuyển nhân vật (gặp quái phải bắn mà không đủ giờ thì chạy chậm lại)
      this.heSoTocDo = this.tinhHeSoTocDo();
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
      let v = this.v * (this.heSoTocDo || 1);
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
        if (o.dangDi && o.song && !o.boChay) o.x -= o.tocDoDi * (this.heSoTocDo || 1) * h;
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
          const cum = k.cum && this.chuongNgai.find(o => o.id === k.cum);
          if (cum) cum.daLay = (cum.daLay || 0) + 1; // đếm số viên bé lấy được của cụm
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
      this.viTriHoiSinh = this.viTriSauVat(o);
      this.phat("matMang", { lyDo, o, mang: this.mang, mangDuTru: this.mangDuTru });
      this.doiMang(); // vừa xuống dưới giới hạn: nếu đang để dành đủ kim cương thì đổi ngay
      if (this.tongMang <= 0) { this.ketThuc("hetMang"); return true; }
      this.trangThai = "hoiSinh";
      return true;
    }
    // Vị trí hồi sinh an toàn: qua hẳn chướng ngại vật, không rơi vào hố, không sát cái kế tiếp
    viTriSauVat(o) {
      const be = this.be;
      let viTri = o ? o.x + o.rong + this.CH.leHoiSinh + this.CH.nhanVat.rong / 2 : be.x;
      const keTiep = this.chuongNgai.find(c => c !== o && c.trangThai === "cho" && c.x > be.x);
      // (phòng xa) không hồi sinh vào sát cái kế tiếp: chừa ít nhất 60% thời gian phản ứng
      if (keTiep) viTri = Math.min(viTri, keTiep.x + keTiep.rong / 2 - khoangKichHoat(keTiep, this.v, this.dk.thoiGianPhanUng * 0.6));
      return Math.max(viTri, o ? o.x + o.rong + this.CH.nhanVat.rong / 2 + 4 : be.x);
    }

    /* ---------------- HANG KIM CƯƠNG (người dùng yêu cầu 16/10/2026) ----------------
       Rơi hố may mắn: không mất mạng, rơi vào hang bí mật. Đồng hồ ĐỨNG YÊN trong hang.
       Bé tự chạy qua hàng kim cương (5-10 viên, nhặt khi chạy qua); cuối hang là CỬA ÁNH SÁNG
       trên gờ đá: phải bấm đúng từ để bé NHẢY vào cửa (không giới hạn thời gian, sai thì bấm lại).
       Ra khỏi cửa: bé về đường chính, ngay sau cái hố. Tọa độ trong hang tính riêng (x từ 0).
       Các pha: roi (rơi xuống hố ở đường chính) -> vao (rơi từ trần hang xuống) -> chay -> nhay -> sang. */
    vaoHang(o) {
      const CH = this.CH, be = this.be, [a, b] = CH.kimCuongHang;
      this.dongThuThach();
      this.dan = [];
      o.trangThai = "qua";
      be.nhay = null; be.che = "roi"; be.tChe = 0;
      const so = a + Math.floor(this.rng() * (b - a + 1)), kimCuongs = [];
      for (let i = 0; i < so; i++) kimCuongs.push({ x: 220 + i * 74, y: Math.round(30 + 18 * Math.sin(i * 1.3)), daNhat: false, tHien: 0 });
      const cuaX = 220 + so * 74 + 300;
      this.hang = { o, pha: "roi", t: 0, x: 0, y: 0, che: "roi", so, daLay: 0, kimCuongs, cuaX, doCaoGo: 86,
        diemDung: cuaX - 150, daDung: false, tt: null, viTriRa: this.viTriSauVat(o) };
      this.phat("vaoHang", { o, so });
      return true;
    }
    buocHang(h) {
      const H = this.hang, CH = this.CH, be = this.be;
      H.t += h;
      if (H.pha === "roi") { // rơi xuống hố ở đường chính (giống lúc gặp nạn)
        be.y -= 260 * h; be.tChe += h;
        if (H.t >= 0.8) { H.pha = "vao"; H.t = 0; H.y = 220; H.che = "nhay"; this.phat("trongHang", { so: H.so }); }
        return;
      }
      if (H.pha === "vao") { // rơi từ trần hang xuống đất
        H.y = Math.max(0, 220 - 520 * H.t * H.t);
        if (H.y <= 0) { H.pha = "chay"; H.t = 0; H.che = "chay"; this.phat("tiepDat"); }
        return;
      }
      if (H.pha === "chay") {
        H.x = Math.min(H.diemDung, H.x + this.v * 0.85 * h);
        H.che = H.x >= H.diemDung ? "dung" : "chay";
        const r = CH.kichThuocKimCuong / 2 + CH.nhanVat.rong / 2;
        for (const k of H.kimCuongs) {
          k.tHien += h;
          if (!k.daNhat && Math.abs(k.x - H.x) < r && k.y - r < CH.nhanVat.cao) {
            k.daNhat = true; H.daLay++;
            this.kimCuong++; this.tongKimCuong++;
            this.phat("nhatKimCuong", { k, kimCuong: this.kimCuong, trongHang: true });
            this.doiMang();
          }
        }
        // gần tới gờ đá thì hiện từ của cửa ánh sáng (đọc to như mọi từ)
        if (!H.tt && H.x >= H.diemDung - this.v * 2) this.moCuaHang();
        if (H.x >= H.diemDung && H.daDung) { H.pha = "nhay"; H.t = 0; H.che = "nhay"; this.phat("nhay", { lyDo: "cuaHang" }); }
        return;
      }
      if (H.pha === "nhay") { // nhảy lên gờ đá vào cửa ánh sáng
        const T = 0.75, u = Math.min(1, H.t / T);
        H.x = H.diemDung + (H.cuaX - H.diemDung) * u;
        H.y = H.doCaoGo * u + 130 * 4 * u * (1 - u);
        if (u >= 1) { H.pha = "sang"; H.t = 0; H.che = "dung"; this.phat("vaoCuaSang"); }
        return;
      }
      if (H.pha === "sang" && H.t >= 0.7) this.raHang();
    }
    moCuaHang() {
      const H = this.hang;
      const o = { id: 0, loai: "cuaSang", ten: "Cửa ánh sáng", nhom: "cuaSang", hanhDong: "nhay", vaCham: "khong",
        mau: 0, mauToiDa: 0, rong: 60, cao: 90, bayCao: 0, x: 0, song: true, trangThai: "hoi", tu: this.khoTu.layTu() };
      this.soThuThach++;
      H.tt = this.thuThach = {
        id: this.soThuThach, o, tu: o.tu, phuongAn: this.khoTu.taoPhuongAn(o.tu), daSai: [], trangThai: "mo",
        tMo: this.tChoi, thoiHan: 0, soVien: 0, daDung: false, laCuaHang: true
      };
      this.phat("thuThachMoi", { tt: this.thuThach });
    }
    raHang() {
      const H = this.hang, be = this.be;
      if (H.tt && H.tt.trangThai === "mo") H.tt.trangThai = "dung";
      this.thuThach = null;
      be.x = H.viTriRa; be.y = 0; be.nhay = null; be.tCham = 0; be.che = "chay"; be.tChe = 0;
      be.batTu = this.CH.thoiGianBatTu * 0.5;
      this.hang = null;
      this.phat("raHang", { daLay: H.daLay, so: H.so });
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
        if (tt.daDung) { tt.trangThai = "dung"; this.phat("vuotQua", { tt }); } // đã nhảy qua an toàn
        else { this.dongThuThach(); this.phat("hetHanThuThach", { tt }); }
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
    /* GẶP QUÁI NHIỀU MÁU THÌ CHẠY CHẬM LẠI (người dùng yêu cầu 16/10/2026): khi quái đã hiện trên màn
       hình (tamNhin do giao diện báo), mỗi viên còn phải bắn cần giayMoiVien giây; nếu chạy đủ tốc độ
       không còn đủ giờ thì bé (và quái) chậm lại, chậm nhất còn tiLeTocDoBanToiThieu (chậm ít thôi). Bắn trúng bớt máu thì tăng tốc lại dần; hạ xong chạy bình thường. */
    tinhHeSoTocDo() {
      const tt = this.thuThach, CH = this.CH;
      if (!tt || tt.trangThai !== "mo" || tt.o.hanhDong !== "ban" || !tt.o.song || tt.o.boChay || tt.o.mau <= 0) return 1;
      // chỉ chậm lại khi quái đã HIỆN trên màn hình (người dùng chỉnh 16/10/2026)
      if (this.khoangTam(tt.o) - tt.o.rong / 2 > (this.tamNhin || CH.tamNhinMacDinh)) return 1;
      const conMau = tt.o.mau - this.dan.filter(d => d.o === tt.o).length; // viên đang bay coi như đã trúng
      if (conMau <= 0) return 1;
      const co = (this.khoangTam(tt.o) - khoangHetHan(tt.o, this.v)) / tocDoKhep(tt.o, this.v);
      const can = conMau * CH.giayMoiVien;
      return co >= can ? 1 : Math.max(CH.tiLeTocDoBanToiThieu, co / can);
    }
    // Phần trăm thời gian còn lại để chọn (cho thanh đếm ngược)
    phanThoiGianConLai() {
      const tt = this.thuThach;
      if (!tt || tt.trangThai !== "mo") return 0;
      if (tt.laCuaHang) return 1; // trong hang: không giới hạn thời gian
      const con = (this.khoangTam(tt.o) - khoangHetHan(tt.o, this.v)) / (tocDoKhep(tt.o, this.v) * (this.heSoTocDo || 1));
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
      if (tu !== tt.tu.en) {
        tt.daSai.push(tu);
        this.thongKe.sai++;
        this.phat("chonSai", { tt, tu });
        return { kq: "sai" };
      }
      const o = tt.o, be = this.be;
      if (tt.laCuaHang) { // cửa ánh sáng trong hang: bấm đúng là bé nhảy vào cửa (tới gờ đá thì nhảy)
        if (!tt.daDung) this.ghiLanDungDau(tt, tu);
        if (this.hang) this.hang.daDung = true;
        return { kq: "dung" };
      }
      if (o.hanhDong === "nhay") {
        // Đang lơ lửng (vd cú nhảy nhặt kim cương) thì chưa nhảy được: bé bấm lại sau
        if (be.nhay || be.che !== "chay") return { kq: "boQua", lyDo: "dangNhay" };
        // Thử thách vẫn mở tới khi bé qua hẳn vật: bấm lại đúng từ là nhảy thêm lần nữa
        if (!tt.daDung) this.ghiLanDungDau(tt, tu);
        else this.phat("chonDung", { tt, tu, lan: (tt.soLanNhay || 0) + 1 });
        tt.soLanNhay = (tt.soLanNhay || 0) + 1;
        // NHẢY NGAY, cự ly cố định: canh giờ là việc của bé
        const T = thoiGianNhay(this.v, o), H = thongSoNhay(o).H;
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
        if (o.vaCham === "khong") continue; // cụm kim cương: không va chạm
        if (o.nhom === "ho") {
          // Rơi: tâm bé nằm trong miệng hố khi đang chạm đất
          if (!be.nhay && be.y <= 0 && be.x > o.x + 6 && be.x < o.x + o.rong - 6) {
            this.phat("roiHo", { o });
            // may mắn (tiLeHangKimCuong): không mất mạng mà rơi vào HANG KIM CƯƠNG (màn Tập chơi thì không)
            if (!this.dk.laHuongDan && this.rng() < this.CH.tiLeHangKimCuong) return this.vaoHang(o);
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
