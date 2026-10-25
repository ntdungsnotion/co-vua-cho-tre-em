// ============================================================
// kiem_thu · thu_web_chuyen_dong.mjs
// Vai trò : Chụp ảnh trang kiểm thử 3D xem_chuyen_dong.html trên Chrome
//           để kiểm tra trực quan nhân vật chuyển động trực tiếp trên webapp.
// Dùng    : node kiem-thu/thu_chrome.mjs co-vua-cho-tre-em/kc/dt/3d_nhap/thu_web_chuyen_dong.mjs <thư mục ảnh>
// ============================================================
export const KHO = [
  { ten: 'may1366', rong: 1366, cao: 768 },
  { ten: 'dt390', rong: 390, cao: 844, dienThoai: true }
];

export default async function (tab) {
  const kq = [];
  await tab.diToi('http://127.0.0.1:8090/kc/dt/3d_nhap/xem_chuyen_dong.html');
  
  // Đợi màn hình tải ẩn đi
  await tab.doi('document.getElementById("manHinhTai").style.display === "none"', 30000);
  await tab.ngu(1500);
  await tab.chup('01_web_idle');
  kq.push('Idle chụp xong');

  // Đi bộ
  await tab.bam('#btn_dt_Walking_A');
  await tab.ngu(500); // Khoảnh khắc sải bước
  await tab.chup('02_web_di_bo');
  kq.push('Walking_A chụp xong');

  // Chạy nhanh
  await tab.bam('#btn_dt_Running_A');
  await tab.ngu(400); // Khoảnh khắc chạy
  await tab.chup('03_web_chay');
  kq.push('Running_A chụp xong');

  // Chặt cây
  await tab.bam('#btn_dt_1H_Melee_Attack_Chop');
  await tab.ngu(450); // Khoảnh khắc vung rìu
  await tab.chup('04_web_chat_cay');
  kq.push('1H_Melee_Attack_Chop chụp xong');

  // Đào mỏ
  await tab.bam('#btn_dt_2H_Melee_Attack_Chop');
  await tab.ngu(450); // Khoảnh khắc bổ cuốc
  await tab.chup('05_web_dao_mo');
  kq.push('2H_Melee_Attack_Chop chụp xong');

  // Ăn mừng
  await tab.bam('#btn_dt_Cheer');
  await tab.ngu(550); // Khoảnh khắc giơ tay reo hò
  await tab.chup('06_web_an_mung');
  kq.push('Cheer chụp xong');

  return kq.join('; ');
}
