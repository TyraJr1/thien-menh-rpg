# Số đo 3D trên Codex Cloud

Chromium 156.0.8078.79 headless, WebGL 2 qua ANGLE/SwiftShader, môi trường giới hạn hai vCPU. Chạy bản Vite production trên HTTP nội bộ của Cloud. Mỗi hàng bắt đầu với context trình duyệt mới. Cả hai dùng preset Battery Saver. FPS là trung vị năm mẫu, khoảng một giây mỗi mẫu khi đang mở cảnh. Không có số đo GPU thật hoặc hiệu năng WebGPU.

| Khung nhìn | Bộ đệm vẽ | Tải đến menu | Tải cộng dồn khi vào cảnh | Mở menu | Bấm vào cảnh đến HUD | FPS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop 1440 × 900 | 691 × 431 | 1.376.612 B | 2.118.172 B | 3,20 giây | 5,29 giây | 2,8 |
| Pixel 7 giả lập | 197 × 402 | 1.376.612 B | 2.118.172 B | 2,44 giây | 2,08 giây | 6,5 |

`dist` có **7.772.898 byte** cho hai entry, gồm engine, shader, font, GLB và ảnh của bản legacy. Dung lượng truyền lấy từ Resource Timing, gồm overhead HTTP. Menu chỉ nạp GLB Lữ Khách (668.340 B). Vào cảnh mới nạp GLB Lão Chu (719.820 B). Cả hai luồng benchmark chỉ thấy yêu cầu đến cùng origin.

Battery Saver giới hạn 30 FPS và dựng ở 48% CSS viewport. Low dựng ở 69%, Medium 88%, High 100%, Ultra 118%. High và Ultra có shadow map; mật độ cây tăng theo preset. Auto chọn từ khả năng thiết bị và hạ chất lượng nếu thấp hơn ngưỡng trong nhiều mẫu. Ở SwiftShader, Auto có thể bắt đầu ở Battery Saver. Số đo trên đây thấp hơn mục tiêu và không dùng để dự đoán hiệu năng trên GPU thật.

Bản này gộp hình học tĩnh theo vật liệu, chia cây thành nhóm mật độ, dùng frustum culling của engine và dỡ scene/engine khi quay lại menu. Cần đo GPU thật trước khi điều chỉnh mật độ, shadow và LOD cho bản phát hành.

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4191 --strictPort
# Terminal Cloud thứ hai
node tools/measure-3d.mjs
```
