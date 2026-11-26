# Thiên Mệnh — Hành Trình Giang Hồ

RPG kiếm hiệp 2.5D trên trình duyệt. Bản đầu tiên có Khúc dạo **Đêm ở bến Vân Thủy** và Chương 01 **Sương trên Tàng Phong**.

- Dùng **A/D** hoặc **←/→** để di chuyển và **E** khi đến gần dấu ◆. Trên điện thoại, chạm cảnh hoặc dùng nút **Đến mục tiêu**.
- Trong giao đấu, thủ thế khi đối thủ tụ lực. Dùng Khí để thi triển kiếm kỹ. Sau khi luyện tâm pháp, hiệu quả thủ thế hoặc kiếm kỹ sẽ thay đổi.
- Tiến độ lưu trên trình duyệt đang dùng. Nút chia sẻ tạo liên kết và QR mở game trên thiết bị khác.

## Phát triển trên Cloud

```sh
npm ci
npm run dev -- --host 0.0.0.0
npm test
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Nếu hệ thống không có Chromium, cài trình duyệt bằng `npx playwright install chromium` và bỏ biến `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Kiểm thử Playwright chạy trên bản production trong `dist`.

## Cloudflare Pages

Kết nối repository làm dự án Pages với nhánh production `main`. Đặt build command là `npm run build`, thư mục đầu ra là `dist` và thư mục gốc là thư mục gốc repository. Bản build dùng Node.js 22 trở lên, có `.node-version` và cấu hình cache tệp có mã băm. Có thể dùng bản preview của nhánh PR để thử trước khi phát hành. Nút **Chia sẻ** lấy URL gốc của trang đang chạy, vì vậy QR trên preview trỏ đến preview.

Xem [thiết kế](GAME_DESIGN.md), [hướng dẫn phát triển](AGENTS.md), [cốt truyện](STORY_BIBLE.md) và [lộ trình](ROADMAP.md).

## V0.5

Tạo nhân vật trước khi vào game. Mở **Túi đồ** để trang bị kiếm và dùng thuốc. Trong **Thiết lập**, chọn Low, Medium, High hoặc Auto và bật âm thanh nếu muốn.

[Nghiệm thu và ảnh game](PROJECT_STATUS.md) · [Ma trận yêu cầu](REQUIREMENTS_MATRIX.md) · [Hiệu năng](PERFORMANCE.md) · [Triển khai Preview trên Cloudflare Pages](DEPLOYMENT.md)
