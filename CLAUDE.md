# Chỉ dẫn cho Claude: repo code (công khai)

> Cập nhật: 14/10/2026, bước QT_02. File này CHỈ là con trỏ, không chứa kế hoạch hay tài liệu dự án.

Repo này chứa **toàn bộ code** của webapp Cờ Vua cho trẻ em (thư mục gốc) và Kids Challenge (`/kc/`). Repo là **công khai** và chạy GitHub Pages: `main` chính là trang web đang chạy.

## Quy tắc làm việc, tài liệu, kế hoạch, nhật ký nằm ở repo riêng tư

**`ntdungsnotion/repo_rieng`** - đọc `CLAUDE.md` ở gốc repo đó TRƯỚC khi làm bất cứ việc gì.

Đầu mỗi phiên:
1. Nếu `repo_rieng` chưa có trong phiên: thêm bằng `add_repo`, clone vào `/home/user/repo_rieng`, rồi đọc `CLAUDE.md` của nó và làm theo.
2. Người dùng gõ `/khoi-tao` hoặc `/ket-thuc` mà lệnh chưa hiện ra: đọc `repo_rieng/.claude/skills/khoi-tao/SKILL.md` (hoặc `ket-thuc`) và làm đúng như nội dung đó.
3. Không có quyền vào `repo_rieng`: báo người dùng, không tự suy đoán quy tắc.

## Chỉ nhắc 4 điều bắt buộc (chi tiết ở repo_rieng)
- Code sửa trên nhánh làm việc, mở Pull Request vào `main`; **chỉ merge khi người dùng đồng ý**.
- **Không** đưa tài liệu, kế hoạch, nhật ký vào repo này.
- Mỗi phiên một việc có sản phẩm cụ thể; chạy `/khoi-tao` để bắt đầu, `/ket-thuc` sau khi người dùng xác nhận xong.
- Nguyên tắc tối cao: Cờ Vua và Kids Challenge phải như **một ứng dụng duy nhất** với người dùng.
