# Thiên Mệnh — Hành Trình Giang Hồ

Bản thiết kế này ghi lại những gì chơi được trong PR đầu tiên. Yêu cầu triển khai trực tiếp là nền tảng của bản hiện tại. Master Prompt đầy đủ chưa có trong phiên Cloud khi soạn, nên tình tiết, tên riêng và cân bằng dưới đây là đề xuất để đối chiếu với tài liệu chính.

## Vòng chơi

Người chơi điều khiển Lữ Khách qua một tuyến đường đi ngang. Tranh nền chuyển nhẹ theo vị trí người chơi để tạo chiều sâu. Dấu ◆ chỉ NPC hoặc vật thể liên quan đến nhiệm vụ hiện tại. Tiếp cận và tương tác mở lời thoại, lựa chọn hoặc giao đấu. Hoàn thành mục tiêu mở điểm tiếp theo.

| Phần | Mục tiêu | Cơ chế mới |
| --- | --- | --- |
| Khúc dạo — Đêm ở bến Vân Thủy | Nhận Mộc Ấn, tìm lối lên núi | Lựa chọn cách bảo vệ dân làng, đọc hai nhánh hội thoại, giao đấu nhập môn |
| Chương 01 — Sương trên Tàng Phong | Giải dấu khắc và mở sơn môn | Gặp Yên Ly, tu luyện một trong hai tâm pháp, đấu Hộ vệ Vô Danh, kết chương |

Lựa chọn ở bến đổi manh mối, tình tiết cuối Khúc dạo và lời mở đầu của Yên Ly. Chọn tâm pháp thay đổi hiệu quả giao đấu và lời thoại khi khép chương. Người chơi có thể thử lại sau khi thua. Tiến độ JavaScript được lưu trên cùng trình duyệt sau từng lựa chọn và lượt đấu.

## Giao đấu và tu luyện

- Sinh lực tối đa 36, Khí tối đa 8. Trảm kích gây 7 sát thương và hồi 1 Khí. Kiếm kỹ tiêu 3 Khí, gây 13 sát thương cơ bản.
- Thủ thế giảm đòn nhận còn một phần tư, làm tròn lên, đồng thời hồi 3 Khí. Địch báo trước đòn mạnh ở lượt thứ ba và mỗi ba lượt tiếp theo.
- Sinh Tức hồi thêm 1 Khí khi Thủ thế. Phá Phong tăng 3 sát thương kiếm kỹ. Lần học tâm pháp đầu hồi đầy Sinh lực và Khí.
- Nếu thua, người chơi hồi đầy Sinh lực và có 5 Khí. Đối thủ trở lại trạng thái ban đầu và nhiệm vụ vẫn đang ở bước giao đấu.

## Hình ảnh và tải tài nguyên

Tranh nguyên bản mang phong cách Donghua, phối xanh ngọc, vàng đèn lồng và đỏ gạch. Các lớp là nền, bóng chân, nhân vật, dấu tương tác và hiệu ứng có thể giảm chuyển động. Giao diện HTML co giãn theo khung nhìn. Phaser dùng khung vẽ 960 × 540 và giới hạn 30 FPS, dùng WebGL khi có và Canvas khi cần.

Màn mở đầu lấy nền của chương hiện tại và chân dung dùng chung. Bấm chơi mới tải Phaser, module chương và ảnh cần cho cảnh. Chuyển chương hủy cảnh cũ và tạo cảnh mới. QR tạo ngay trên trình duyệt khi mở Chia sẻ. Game không cần yêu cầu mạng đến dịch vụ bên thứ ba khi chơi bản build.
