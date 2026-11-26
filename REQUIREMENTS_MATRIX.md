# Ma trận yêu cầu và Game Audit · V0.5

Nguồn đối chiếu là yêu cầu Phase 2 và commit nền `1465e20`. Tài liệu V3.0 chưa có nên các trạng thái dưới đây mô tả mức đáp ứng Phase 2. Không có số liệu về độ khớp với V3.0.

| Hạng mục | Trạng thái | Bằng chứng và phần còn thiếu |
| --- | --- | --- |
| Master Prompt V3.0 | Chưa triển khai | Chưa nhận nguyên văn. Có vị trí lưu trong `MASTER_PROMPT.md`. |
| Main Menu | Đã hoàn thành | Bắt đầu, Tiếp tục, Chơi lại có xác nhận qua lần tạo mới, Thiết lập, Chia sẻ. Có thông báo nếu save không đọc được. |
| Tạo nhân vật | Đã hoàn thành | Tên tiếng Việt, chọn một trong ba xuất thân, chỉ số thực tế. Chưa có tùy biến ngoại hình trong phạm vi này. |
| Prologue | Đã hoàn thành | Lão Chu, Mộc Ấn, hai hướng lựa chọn, đèn dẫn lối, giao đấu, rời bến. |
| Chapter 01 | Đã hoàn thành | Yên Ly, bia đá, tọa thiền, tùy chọn thắp đèn, boss, phần thưởng và đạt điều kiện mở Chapter 02. |
| Gameplay, điều khiển | Đã hoàn thành | A/D, mũi tên, E, chạm cảnh, nút di chuyển và đi đến mục tiêu; hạn chế trôi sau khi nhả phím. |
| Cốt truyện và bí ẩn thân thế | Hoàn thành một phần | Tua kiếm, tên bị giấu, chuông đứt dây và ký ức động tác tại bia gắn với mạch truyện cũ. Chờ V3.0 để chốt lai lịch và lộ trình. |
| Hội thoại phân nhánh | Đã hoàn thành | Khác lời thoại, manh mối, trang bị hoặc thuốc; chân dung riêng và trình tự đối thoại thử được. |
| Nhiệm vụ và quan hệ NPC | Hoàn thành một phần | Đường chính, việc phụ, liên kết qua cốt truyện và trạng thái Lão Chu/Yên Ly; quan hệ suy ra từ lựa chọn, chưa có thang điểm hay nhiều nhiệm vụ phụ. |
| Sinh lực, Nội lực, Linh lực, thuộc tính | Đã hoàn thành | Hệ xuất thân, chỉ số nhân vật và HUD. Linh lực chuyển thành Nội lực bằng Tĩnh tức. |
| Cấp độ, kinh nghiệm và phần thưởng | Đã hoàn thành | EXP theo trận và mốc chương, cấp tăng Sinh lực, vật phẩm nhánh, Kiếm Tàng Phong khi khép chương. |
| Chiến đấu, võ công, kỹ năng và boss | Hoàn thành một phần | Giao đấu theo lượt, Trảm kích, Thủ thế, Kiếm kỹ, Tĩnh tức, thuốc, thắng/thua, tín hiệu đòn nặng và pha đổi thế của Vô Danh. Cây võ công đa dạng thuộc bản sau. |
| Tâm pháp | Đã hoàn thành | Sinh Tức/Phá Phong có tác động khác nhau và phản hồi thị giác. |
| Trang bị, túi đồ | Hoàn thành một phần | Có trang bị ba thanh kiếm, tác động sát thương, thuốc tiêu hao và thông tin quan hệ. Giáp, nhiều ô và sắp xếp thuộc bản sau. |
| Lưu tiến trình, save lỗi | Đã hoàn thành | Save v2 gồm hồ sơ, túi đồ, chiến đấu; chuyển v1, bảo toàn nhánh và báo save lỗi. |
| UI/UX, responsive | Đã hoàn thành | HUD trong trận, bảng thoại chân dung, bảng liên kết/QR, điều khiển cảm ứng và kiểm thử không tràn ngang. |
| Donghua 2.5D, môi trường và trang phục | Hoàn thành một phần | Tranh gốc và trang phục minh họa, chân dung cắt từ atlas gốc, lớp trúc mới, sương, ánh sáng, parallax và hiệu ứng; đạt chất lượng bản chơi thử. |
| Animation, kiếm khí, tâm pháp và chuyển cảnh | Hoàn thành một phần | Nghiêng người theo bước/đòn, vệt kiếm, quầng vận khí, chuyển mờ; bộ sprite nhiều pose và cutscene dựng trước thuộc bản sau. |
| Âm thanh | Hoàn thành một phần | Web Audio tổng hợp, có bật/tắt; chưa có nhạc nền, không gian và lồng tiếng. |
| Hiệu năng, thiết lập Low/Medium/High/Auto | Đã hoàn thành | Chất lượng đổi độ phân giải, ảnh và renderer/hiệu ứng. Auto chọn theo thiết bị và hạ khi FPS thấp. Có phép đo Cloud, giới hạn được ghi trong `PERFORMANCE.md`. |
| Tải tài nguyên và giải phóng cảnh | Đã hoàn thành | Module, ảnh theo chương, không precache offline; test trình duyệt xác nhận cô lập lần tải, hủy Phaser khi đổi cảnh. |
| Chia sẻ URL và QR | Đã hoàn thành | QR sinh từ origin thật của bản đang chạy. Test trên địa chỉ preview nội bộ Cloud. |
| Cloudflare HTTPS | Hoàn thành một phần | Worker đã kết nối Git theo cấu hình hiện tại. Có Wrangler Static Assets và quy trình xác minh bản deploy trong `DEPLOYMENT.md`. |
| Chapter 02, hệ RPG mở rộng | Thuộc phiên bản tương lai | Điểm mở khóa đã có. Nội dung Chapter 02 chờ V3.0 và xác nhận trước khi mở rộng. |

Các lỗi ưu tiên được xử lý gồm save hỏng không có phản hồi, nhả phím nhưng nhân vật còn trôi, người chơi mobile không thấy tài nguyên trong trận nếu bảng bên nằm dưới màn hình, panel thoại mất khỏi khung nhìn và cảnh mới có thể khởi tạo trước khi cảnh cũ dọn xong. Phần so sánh chất lượng hình ảnh xem `ART_DIRECTION.md`.
