# Phát triển Thiên Mệnh

- Dùng checkout của Codex Cloud. Xác nhận đúng remote và nhánh trước khi sửa. Giữ thay đổi của người dùng và đẩy lên nhánh làm việc để mở PR vào `main`.
- Cài đúng phiên bản đã khóa với `npm ci` trên Node.js 22 trở lên. Chạy `npm run dev -- --host 0.0.0.0` khi phát triển.
- Chạy `npm test`, `npm run build`, rồi `npm run test:e2e`. Trên Cloud có Chromium hệ thống, đặt `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`; nếu thiếu thì dùng trình duyệt Playwright được cài qua `npx playwright install chromium`.
- Đọc `GAME_DESIGN.md` và `STORY_BIBLE.md` trước khi sửa luồng chơi. Khi có Master Prompt, đối chiếu các tên, lời thoại và quy tắc trước khi coi chúng là thiết kế đã chốt.
- Giữ trạng thái và luật chiến đấu độc lập với Phaser trong `src/game/state.ts`. Khi đổi cấu trúc lưu, thêm xử lý cho phiên bản cũ và kiểm tra tiến độ đang dở.
- Đặt cảnh, hội thoại và tham chiếu ảnh riêng trong module của chương. Thêm chương qua import động trong `src/chapters/load.ts`. Giữ lớp hiển thị và cách điều khiển dùng chung.
- Dùng tranh WebP tối ưu, kiểm tra lưu lượng tải rỗng cache và xác minh trên cả bàn phím lẫn cảm ứng. Hủy cảnh cũ khi chuyển chương.
- Cloudflare Workers Static Assets nhận thư mục `dist` theo `wrangler.jsonc`. Chạy `npx wrangler deploy --assets=./dist --dry-run` để kiểm tra cấu hình trước khi push; Workers Builds tự triển khai từ `dev/chapter-01`.

## Tiếp tục từ V0.5

- Đối chiếu `MASTER_PROMPT.md` và `REQUIREMENTS_MATRIX.md` trước khi thay thiết kế. Khi chưa có nguyên văn V3.0, giữ mốc truyện và ghi rõ giả định.
- Kiểm tra quy tắc nhân vật và save trong `src/game/character.ts` và `src/game/state.ts`. Khóa lưu giữ nguyên để dữ liệu v1 chuyển lên v2.
- Chạy `npm run typecheck` trước khi build. Kịch bản hiện chưa có lệnh lint. Có thể lấy ảnh từ Playwright bằng `JOURNEY_SCREENSHOT_DIR`, với đường dẫn nằm ngoài `src` và `public`.
- Dùng `tools/measure.mjs` theo `PERFORMANCE.md`. Đổi cấu hình hoặc chương phải dọn world hiện tại trước khi tạo world khác. Không đổi cấu hình tự động giữa trận.
- Cập nhật PR #1 trong nhánh `dev/chapter-01` theo quy trình Phase 2, kiểm thử trên Cloud và dùng `DEPLOYMENT.md` để kiểm tra Workers Builds và URL công khai.
