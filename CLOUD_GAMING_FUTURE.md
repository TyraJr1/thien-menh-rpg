# Đánh giá Unreal Engine và Pixel Streaming

Unreal có thể dựng hình trên máy Cloud có GPU rồi truyền video/âm thanh qua WebRTC. Client gửi điều khiển. Hệ thống cần signaling, STUN/TURN, quản lý phiên, ảnh triển khai GPU, giám sát và lựa chọn vùng gần người chơi. Cloudflare Workers Static Assets chỉ phục vụ web và dữ liệu, không chạy bộ dựng hình GPU.

Trước khi chọn, đo từ thao tác đến hình ảnh. Tách mạng hai chiều, thời gian dựng khung hình, mã hóa, truyền video, giải mã và hiển thị. Thử vùng xa, mất gói tin và mạng di động. Đo số người chơi đồng thời theo số phiên mà GPU, VRAM, CPU và bộ mã hóa thực sự phục vụ ổn định.

Chi phí theo giờ gồm máy GPU, thời gian chờ, băng thông, chuyển tiếp TURN, lưu log và vận hành. Ví dụ một stream 8 Mbit/s dùng khoảng 3,6 GB mỗi giờ, chưa tính overhead. Đánh giá giá trên mỗi phiên chơi, khả năng chạy khi ít người và lợi ích so với client Babylon. Chưa triển khai hoặc mua tài nguyên Cloud GPU.
