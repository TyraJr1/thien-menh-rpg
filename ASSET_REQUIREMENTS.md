# Tài nguyên 3D

| Hạng mục | Trong nhánh | Cần làm |
| --- | --- | --- |
| Nhân vật | `wanderer.glb` và `ferryman.glb` có skin, áo, tóc, nón và đạo cụ | Model tinh chỉnh, biểu cảm, LOD |
| Kẻ địch và boss | Bia gỗ thử thời điểm va chạm | Khách áo đen, AI, cảnh báo đòn và animation bị đánh |
| Trang phục, vũ khí | Nhiều lớp vạt áo, đai, chuôi/vỏ kiếm, gậy | Atlas vải, mesh vũ khí rút khỏi vỏ |
| Nhà, cầu, đò | Hình học sinh trong `scenery.ts`, mái ngói, nan cửa và lan can | Module GLB, mặt trong, collision chi tiết |
| Trúc, cây cối, đá | Cụm trúc, cỏ ba mật độ, phong đỏ, đá cuội và núi nhiều lớp | LOD theo khoảng cách, thin instances, gió |
| Địa hình, nước | Lưới cao độ, bờ sông, texture gợn nước chuyển động | Dỡ/tải từng vùng, phản xạ nước, thác Tàng Phong |
| Animation | Idle, Walk, Run, Jump, Land, Dodge, Slash và Sweep | IK, clip thoại, trúng đòn và combo |
| Texture, hiệu ứng | Màu đỉnh và texture đất/trời/nước tự vẽ, sương, vệt kiếm | KTX2/Basis, atlas, shader toon và ngân sách particle |

Hai GLB được sinh lại bằng `python tools/create-character-3d.py` với thư viện chuẩn. Hình học cảnh, texture và âm thanh tổng hợp là nguồn do dự án tạo. Không nhập tài nguyên ngoài. Fontsource và giấy phép font giữ nguyên như bản 2.5D; Babylon.js dùng MIT.

Vite đặt tên theo hash. Tải Lữ Khách khi mở menu và tải Lão Chu lúc vào vùng chơi. Geometry tĩnh theo nhóm vật liệu và mật độ cây. Hai GLB đang dưới 1 MB mỗi file. Trước khi tăng kích thước, đo Meshopt, Draco và KTX2 trên điện thoại thật rồi chọn theo chi phí truyền/giải mã. Dùng manifest từng khu để tải theo nhu cầu và dỡ khỏi scene; không lưu offline toàn bộ thế giới.
