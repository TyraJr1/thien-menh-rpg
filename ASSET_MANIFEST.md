# Danh mục tài nguyên

| Tài nguyên | Nguồn | Tải khi nào |
| --- | --- | --- |
| `prologue.webp`, `chapter01.webp` | Tranh gốc tạo riêng cho Thiên Mệnh trong Phase 1 bằng ImageGen. Không dùng tranh hoặc nhân vật từ game khác. | High, chỉ bối cảnh hiện tại |
| `*-low.webp`, `*-medium.webp` | Hai bộ ảnh nền thu nhỏ từ hai tranh gốc, chiều rộng 768 và 1152 px. | Chỉ kích cỡ và chương hiện tại |
| `hero.webp`, `ferryman.webp`, `yan.webp`, `shade.webp` | Hình người cắt từ atlas nguyên bản tạo bằng ImageGen cho dự án. | Hero dùng chung, NPC chọn theo chương |
| `portrait.webp`, `*-detail.webp` | Ảnh cắt của cùng atlas gốc. | Chân dung nhỏ dùng chung; ảnh chi tiết khi tạo nhân vật hoặc mở cuộc thoại liên quan |
| `bamboo-front.webp` | Hình trúc Alpha vẽ bằng hình học thủ tục cho dự án. | Khi bắt đầu cảnh Medium/High |
| Sương, đèn, hạt, vệt kiếm và quầng tâm pháp | Vẽ bằng mã Phaser, texture gradient chung 64 × 64. | Sinh trong cảnh; Low bỏ các hiệu ứng khí quyển |
| Âm báo và hiệu ứng đấu | Các dao động và envelope tổng hợp trong `src/game/audio.ts`. | Chỉ sinh khi người chơi bật âm thanh |
| Playfair Display, Be Vietnam Pro | Gói Fontsource, giấy phép SIL Open Font License kèm gói. | Tệp chữ và phân vùng ký tự dùng trên trang |

Playwright chụp ảnh minh họa trong Cloud. Các ảnh QA nằm ngoài `src` và `public`, không được ghép vào bản phân phối game.
