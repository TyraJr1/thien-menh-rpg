# Phát triển Thiên Mệnh

- Dùng checkout của Codex Cloud. Xác nhận đúng remote và nhánh trước khi sửa. Giữ thay đổi của người dùng và đẩy lên nhánh làm việc để mở PR vào `main`.
- Cài đúng phiên bản đã khóa với `npm ci` trên Node.js 22 trở lên. Chạy `npm run dev -- --host 0.0.0.0` khi phát triển.
- Chạy `npm test`, `npm run build`, rồi `npm run test:e2e`. Trên Cloud có Chromium hệ thống, đặt `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`; nếu thiếu thì dùng trình duyệt Playwright được cài qua `npx playwright install chromium`.
- Đọc `GAME_DESIGN.md` và `STORY_BIBLE.md` trước khi sửa luồng chơi. Khi có Master Prompt, đối chiếu các tên, lời thoại và quy tắc trước khi coi chúng là thiết kế đã chốt.
- Giữ trạng thái và luật chiến đấu độc lập với Phaser trong `src/game/state.ts`. Khi đổi cấu trúc lưu, thêm xử lý cho phiên bản cũ và kiểm tra tiến độ đang dở.
- Đặt cảnh, hội thoại và tham chiếu ảnh riêng trong module của chương. Thêm chương qua import động trong `src/chapters/load.ts`. Giữ lớp hiển thị và cách điều khiển dùng chung.
- Dùng tranh WebP tối ưu, kiểm tra lưu lượng tải rỗng cache và xác minh trên cả bàn phím lẫn cảm ứng. Hủy cảnh cũ khi chuyển chương.
- Cloudflare Pages nhận thư mục `dist`. Quy trình tạo bản build không cần tài khoản Cloudflare, công cụ backend hay dịch vụ trả phí.
