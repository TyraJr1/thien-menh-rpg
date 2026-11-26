# Trạng thái dự án · V0.5

Bản chơi thử nối tiếp commit nền `1465e20` trong nhánh `dev/chapter-01` và [PR #1](https://github.com/TyraJr1/thien-menh-rpg/pull/1). Chơi được trọn Khúc dạo và Chương 01. Chapter 02 mới có điều kiện mở khóa.

## Kết quả nghiệm thu

- Tạo nhân vật, lựa chọn và phần thưởng, giao đấu thắng/thua, chuyển chương, khôi phục save v1/v2 và save bị lỗi đã được thử.
- Luồng Chromium production đi hết hai chương. Luồng điện thoại giả lập kiểm tra thao tác chạm, biến thể thoại, trang bị, tải trận đang dở, Low, URL và QR. Một kịch bản riêng xác nhận hồi sức sau khi thua.
- Type check, kiểm thử logic, build và Playwright chạy trong Codex Cloud. Không có script lint trong dự án.
- Có [5 ảnh chụp thật](docs/screenshots/README.md) và [số đo bản build](PERFORMANCE.md).
- [Ma trận](REQUIREMENTS_MATRIX.md) nêu độ đáp ứng Phase 2. Phiên này thiếu Master Prompt V3.0, nên chưa có kết luận về độ khớp thiết kế chính thức.

## Trước khi hợp nhất

1. Lưu nguyên văn V3.0, đối chiếu các mốc truyện, xuất thân, hệ tài nguyên và phép cân bằng.
2. Có người có quyền kết nối Cloudflare Pages để kích hoạt Preview, kiểm tra truy cập HTTPS và quét QR từ URL đó. Làm theo [hướng dẫn triển khai](DEPLOYMENT.md).
3. Chơi trọn luồng trên thiết bị thật để xác nhận thao tác cảm ứng, chữ, FPS và ổn định. Đối chiếu [chỉ đạo mỹ thuật](ART_DIRECTION.md) với tiêu chuẩn nội dung của nhóm.

Chưa có deployment Cloudflare Pages Preview, URL chia sẻ công khai hoặc QR triển khai. Music, nhiều pose nhân vật, các ô trang bị khác và nội dung Chapter 02 nằm ở lộ trình.
