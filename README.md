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

## Cloudflare Workers

Worker `thien-menh-rpg` triển khai Static Assets từ `dist`. Workers Builds chạy `npm run build` và `npx wrangler deploy --assets=./dist` khi push vào `dev/chapter-01`. Nút **Chia sẻ** dùng URL gốc của tên miền đang phục vụ game.

Xem [thiết kế](GAME_DESIGN.md), [hướng dẫn phát triển](AGENTS.md), [cốt truyện](STORY_BIBLE.md) và [lộ trình](ROADMAP.md).

## V0.5

Tạo nhân vật trước khi vào game. Mở **Túi đồ** để trang bị kiếm và dùng thuốc. Trong **Thiết lập**, chọn Low, Medium, High hoặc Auto và bật âm thanh nếu muốn.

[Nghiệm thu và ảnh game](PROJECT_STATUS.md) · [Ma trận yêu cầu](REQUIREMENTS_MATRIX.md) · [Hiệu năng](PERFORMANCE.md) · [Triển khai Cloudflare Workers](DEPLOYMENT.md)
