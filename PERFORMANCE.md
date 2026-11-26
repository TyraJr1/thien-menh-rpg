# Hiệu năng bản production V0.5

Đo bằng Chromium 156.0.8078.79 headless trong Codex Cloud, viewport 1.440 × 900, Vite Preview trên máy Cloud. Mỗi hàng dùng browser context mới với save thử của chương tương ứng. Mốc menu bao gồm ảnh hiện tại và phông chữ đã tải. Mốc vào cảnh là lượng truyền cộng dồn sau khi bấm Tiếp tục và cảnh sẵn sàng. Lưu lượng lấy từ Resource Timing và Navigation Timing, tính cả overhead HTTP. FPS là trung vị ba mẫu khoảng một giây khi cảnh đang mở, không phải FPS trên thiết bị thật.

| Chương | Mức | Menu (kB) | Vào cảnh cộng dồn (kB) | Bấm đến sẵn sàng (ms) | FPS trung vị |
| --- | --- | ---: | ---: | ---: | ---: |
| Khúc dạo | Low | 221 | 617 | 313 | 20,0 |
| Khúc dạo | Medium | 354 | 761 | 726 | 21,0 |
| Khúc dạo | High | 541 | 948 | 803 | 19,4 |
| Chương 01 | Low | 236 | 635 | 254 | 20,0 |
| Chương 01 | Medium | 351 | 761 | 528 | 21,0 |
| Chương 01 | High | 510 | 920 | 563 | 19,7 |

`dist` có **2.918.571 byte** tệp thực, gồm cả ba cỡ ảnh cho hai chương. Phaser là chunk lớn nhất, 1.208.084 byte, khoảng 332 kB gzip, chỉ tải khi vào game. Mã khởi động 30,2 kB hoặc 11,1 kB gzip. Mã chương 2,5–3,7 kB. Mã QR 25,8 kB, tải khi mở Chia sẻ. Cảnh không tải trước tài nguyên chương kế tiếp. Luồng tạo mới có thêm ảnh chi tiết nhân vật khoảng 11 kB khi mở form.

| Chương | Ảnh cảnh Low / Medium / High (kB) | RGBA tham chiếu Low / Medium / High (MiB) |
| --- | --- | --- |
| Khúc dạo | 134 / 277 / 464 | 2,20 / 6,27 / 8,89 |
| Chương 01 | 130 / 255 / 415 | 2,22 / 6,29 / 8,92 |

Ảnh cảnh gồm hình nền, ba sprite của cảnh và lớp trúc nếu bật. Ước tính RGBA dùng chiều rộng × chiều cao × 4 cho ảnh, cộng hai texture gradient 64 × 64 ở Medium/High. Mức này không bao gồm framebuffer, canvas HTML, mipmap hoặc vùng nhớ bổ sung của driver. Low chạy Canvas 2D, nên đây là ước tính bộ nhớ ảnh giải mã. High và Medium dùng WebGL trong môi trường thử; mục tiêu FPS là giới hạn, không phải cam kết đạt trên mọi phần cứng.

## Bộ nhớ và đổi cảnh

JS heap sau GC là **4,98–5,48 MiB**. PSS cộng dồn các tiến trình renderer của Chromium là **127–146 MiB**. PSS bao gồm chính trình duyệt và dữ liệu liên quan, không phải bộ nhớ riêng của game hay số VRAM.

Đo chuyển từ cuối Khúc dạo sang Chương 01 ở Low được **456 ms**. Sau đó đổi High ↔ Low 8 lần. Quan sát được 9 lần hủy, sau mỗi lần chỉ có một canvas và cảnh Low cuối có 4 texture đang đăng ký. JS heap sau GC lần lượt **5,06 → 5,85 → 6,13 MiB** ở đầu, sau 4 và sau 8 lần đổi. Quan sát này chứng minh đường hủy được gọi và số canvas/texture không tăng trong kịch bản. Heap vẫn tăng khoảng 1,07 MiB, nên cần profile lâu hơn để phân biệt cache với dữ liệu bị giữ. Chưa có kết quả VRAM trực tiếp hay độ ổn định trên điện thoại thật.

## Lặp phép đo

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4180 --strictPort
```

Trong terminal Cloud khác:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
  node --experimental-strip-types tools/measure.mjs
```

Auto hạ dần cấu hình khi có ít nhất ba mẫu dưới 65% mục tiêu. Chế độ thủ công được giữ nguyên. Benchmark cố định từng mức để so sánh. Giữ phép đo sau thay đổi về asset hoặc Phaser và chạy riêng với E2E để giảm tranh tài nguyên.
