# Quy Trình Biên Tập Đồ Họa 3D (Blender Ngầm)

*Cập nhật: 24/10/2026 09:05 · Áp dụng cho: Đấu Trường Tri Thức (Kids Challenge)*

Tài liệu này quy định quy trình phối hợp giữa **Chủ dự án (Mèo Đen)** và **AI Phụ tá (Antigravity)** trong việc biên tập, nâng cấp các mô hình đồ họa 3D (nhân vật, cây cối, công trình) bằng phần mềm Blender chạy ngầm.

---

## 1. Nguyên Tắc Cốt Lõi

1. **Cô lập an toàn tuyệt đối:**
   - Toàn bộ quá trình thử nghiệm, chỉnh sửa mô hình diễn ra trong thư mục nháp: `co-vua-cho-tre-em/kc/dt/3d_nhap/`.
   - **Tuyệt đối không sửa** thư mục gốc `kc/dt/3d/` và `kc/dt/mo_hinh/` do Claude Code kiến trúc.
   - Khi hoàn thành và được Mèo Đen nghiệm thu toàn bộ, mới đề xuất chuyển giao qua `PHOI-HOP-AI.md` để Claude Code rà duyệt vào bản chính.
2. **Trẻ em là trung tâm:**
   - Tạo hình theo phong cách hoạt hình (chibi/low-poly hoạt họa), màu sắc tươi sáng, nét mặt thân thiện, ngộ nghĩnh, phù hợp với học sinh lớp 2.
   - Không thiết kế nhân vật dữ tợn, u tối hay kỳ quái gây sợ cho trẻ nhỏ.
3. **Hai bên cùng nhìn thấy kết quả (Visual Feedback Loop):**
   - Mọi chỉnh sửa đều phải kết xuất (render) thành ảnh tĩnh chất lượng cao (`.png`).
   - AI phụ tá tự đọc và kiểm tra ảnh bằng mắt máy trước khi báo cáo.
   - Mèo Đen xem ảnh trực tiếp trên máy hoặc xem chuyển động trực tiếp trong game qua trang web nội bộ.

---

## 2. Cấu Trúc Thư Mục `3d_nhap/`

```
co-vua-cho-tre-em/kc/dt/3d_nhap/
├── quy-trinh-bien-tap-3d.md     ← Tài liệu này
├── mo_hinh/                     ← Các file mô hình 3D (.glb) đang biên tập
│   ├── nhan_vat.glb             ← Nhân vật (Vua, nông dân, cử động)
│   ├── lang.glb                 ← Cây cối, đá, tài nguyên, đạo cụ
│   └── dong_tac_tran.glb        ← Động tác chiến đấu
├── kich_ban_blender/            ← Các kịch bản Python (.py) điều khiển Blender
│   └── bien_tap_*.py            ← Script chỉnh sửa lưới (mesh), chất liệu, gắn xương
├── hinh_anh/                    ← Nơi lưu ảnh chụp kết quả (.png) đối chiếu
│   ├── vua_goc.png              ← Ảnh Vua gốc trước khi sửa
│   ├── vua_v1.png ...           ← Ảnh Vua qua từng đợt sửa
│   └── ...
├── xem.html & xem.js            ← Trang web nội bộ kiểm tra trực tiếp mô hình chuyển động
└── dt3d_*.js                    ← Các module điều khiển hiển thị 3D nháp
```

---

## 3. Quy Trình Phối Hợp 4 Bước

```
[1. Mèo Đen nêu ý tưởng]
         ↓
[2. Antigravity viết script Python + gọi Blender chạy ngầm]
         ↓
[3. Xuất file GLB + Render ảnh PNG vào hinh_anh/]
         ↓
[4. Cả hai cùng soi ảnh: Antigravity đọc mắt máy + Mèo Đen duyệt]
         ↓
(Chưa ưng) ──→ Lặp lại Bước 1-4 tinh chỉnh
         ↓
(Đã ưng)   ──→ Chuyển sang mô hình kế tiếp
```

### Bước 1: Mèo Đen đưa yêu cầu
Mèo Đen nêu cụ thể mong muốn trực quan về hình mẫu (ví dụ: *"Vua bỏ mũ đầu gấu, đổi thành vương miện vàng 3 chóp có ngọc đỏ, áo choàng đỏ viền lông trắng, mặt cười tươi"*).

### Bước 2: Antigravity thực thi ngầm
1. Antigravity lập trình script Python (`bpy`) trong `kich_ban_blender/`:
   - Chỉnh sửa hình dạng lưới (mesh), vật liệu, màu sắc.
   - Gắn các bộ phận mới vào hệ xương (`Rig`) để nhân vật vẫn cử động, đi lại bình thường.
2. Gọi Blender chạy ngầm:
   `"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python <script.py>`
3. Xuất file mô hình `.glb` mới vào `3d_nhap/mo_hinh/`.
4. Thiết lập góc máy studio chuẩn và render ảnh kết quả `.png` vào `3d_nhap/hinh_anh/`.

### Bước 3: Cùng soi và đánh giá kết quả
- **Antigravity:** Mở file ảnh vừa render bằng công cụ đọc ảnh, phân tích tỉ lệ, vị trí đính kết, màu sắc, ánh sáng.
- **Mèo Đen:**
  - Bấm vào link ảnh được cung cấp để mở ngay trên máy tính.
  - (Tùy chọn) Bật `BAT-MAY-CHU-THU.bat` và mở trình duyệt tại:
    `http://127.0.0.1:8090/kc/dt/3d_nhap/xem.html?phan=nhan_vat`
    để ngắm nhân vật đang chạy nhảy, làm việc trên nền làng.

### Bước 4: Tinh chỉnh hoặc nghiệm thu
- Nếu còn điểm chưa ưng ý (ví dụ: *"vương miện hơi to", "áo choàng cần dài hơn"*): Mèo Đen phản hồi, Antigravity tiếp tục ra bản `v2`, `v3`...
- Khi Mèo Đen xác nhận "Đạt": Chốt phiên bản mô hình đó và chuyển sang đối tượng tiếp theo.

---

## 4. Danh Sách Đối Tượng Biên Tập (Theo Thứ Tự)

1. **VUA (Thủ lĩnh):**
   - Thay mũ thú bằng Vương miện vàng quyền quý, ngộ nghĩnh.
   - Chỉnh áo choàng hoàng gia viền lông trắng.
   - Nét mặt tươi vui, mắt to tròn thân thiện.
   - Thêm quyền trượng ngọc hoặc kiếm báu hoàng gia.
2. **NÔNG DÂN:**
   - Nón lá truyền thống cân đối, xinh xắn.
   - Trang phục gọn gàng, khỏe khoắn, tươi tắn.
   - Các món đồ mang trên lưng/tay (bó củi, tảng đá, thỏi vàng, xâu cá, giỏ quả) rõ nét, dễ nhận biết.
3. **CÂY CỐI & MỎ TÀI NGUYÊN:**
   - Cây thông, cây tán tròn hoạt hình tươi mát, lá chuyển màu sinh động.
   - Gốc cây, mầm non mọc lại tự nhiên.
   - Mỏ đá, mỏ vàng có góc cạnh lấp lánh, bắt mắt.
