# Nghiệm thu foundation 3D

Chế độ Babylon.js chơi tại `/` của nhánh `feature/3d-action-rpg`. Chế độ Phaser có entry riêng `/legacy.html`. Bản thử dùng cùng lời thoại Khúc dạo và ghi tiến trình riêng.

Đã có địa hình bến Vân Thủy, camera sau lưng xoay và zoom, trọng lực, va chạm, nhảy, né, blend hoạt ảnh khung xương, HUD, điều khiển cảm ứng, hội thoại Lão Chu và bãi luyện ba nhát kiếm. Có các lớp đồ họa thực tế. Bản thử chưa có AI địch, boss, chiến đấu pha C hoàn chỉnh hay chuyển sang Chương 01.

Chạy production ở trang thử: `npm run build` rồi `npm run preview`. Thêm `?renderer=webgl` để kiểm tra đường WebGL 2. Kiểm thử và capture bằng `TM3D_SHOTS=/duong/dan/anh PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`.
