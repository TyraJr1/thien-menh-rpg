# Lộ trình Thiên Mệnh

1. Đối chiếu Master Prompt. Chốt tên chương, nhân vật, nhánh cốt truyện, quy tắc tu luyện và định hướng hình ảnh. Cập nhật dữ liệu theo chương cùng tài liệu thiết kế.
2. Hoàn thiện bản thử Khúc dạo và Chương 01. Thu phản hồi về tốc độ đọc, độ khó, điều khiển cảm ứng và hiệu năng trên điện thoại phổ thông. Dùng tải lần đầu và độ ổn định trên máy Cloud làm đường cơ sở, sau đó đo trên thiết bị thật.
3. Bổ sung chuyển động đi và đánh, âm thanh tùy chọn, nhật ký nhánh đã chọn và các lần gặp NPC theo thiết kế đã chốt. Thêm màn tải lại hoặc điểm lưu phù hợp khi chương dài hơn.
4. Chuẩn hóa cấu trúc chương khi thêm tuyến mới. Đo kích thước WebP, mã JavaScript, số texture và thời gian chuyển chương. Giữ tài nguyên từng chương ngoài gói khởi động.
5. Kiểm tra bản đóng gói, bàn phím, điện thoại và liên kết QR trên bản triển khai Cloudflare Workers Static Assets.

## Sau Phase 2

1. Trước khi hợp nhất PR, lưu nguyên văn V3.0, xong đối chiếu cốt truyện và cân bằng, rồi cập nhật ma trận cùng các bài kiểm thử.
2. Xác minh lần triển khai Cloudflare Workers, kiểm tra liên kết HTTPS và QR, thử trên điện thoại Android/iOS thật và đo hiệu năng ngoài Chromium headless.
3. Bổ sung sprite nhiều pose, biểu cảm thoại và âm thanh môi trường. Mở rộng trang bị, tiến triển võ công và quan hệ sinh động hơn khi V3.0 đã xác nhận.
4. Chỉ mở thêm nội dung Chapter 02 sau khi hai chương đầu đạt các tiêu chí trên. Save V0.5 đã có điều kiện để nối chương sau.


## Sau foundation V4.0

1. Đo lại trên WebGPU và GPU thật, tinh chỉnh IK và camera tại các khúc hẹp.
2. Dựng Khách áo đen và boss, nối combo, stagger, báo đòn và phần thưởng.
3. Hoàn chỉnh quest, cutscene, chuyển khu vực và các mốc sang Chương 01.
4. Tách asset theo khu và đánh giá bản preview riêng trước khi phát hành.
