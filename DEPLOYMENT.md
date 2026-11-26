# Cloudflare Pages Preview

Hiện chưa có project Pages hoặc xác thực Cloudflare trong phiên Cloud này. Dự án đã build được và `dist` là nội dung tĩnh hoàn chỉnh. Mọi bước dưới đây dùng gói miễn phí tiêu chuẩn. Không nhập token trong repository.

## Tạo preview từ GitHub

1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com), vào **Workers & Pages → Create application → Pages → Connect to Git**. Chọn GitHub và cấp quyền ứng dụng Cloudflare cho riêng repository `TyraJr1/thien-menh-rpg`.
2. Chọn repository. Đặt **Production branch** là `main`, **Framework preset** là **Vite** nếu có. Nếu không thấy preset Vite, chọn **None** và điền đúng cấu hình bên dưới.
3. Trong **Build and deployments → Branch control**, tắt **Automatic production branch deployments** nếu giao diện cho phép trước khi triển khai. Ở **Preview branch**, chọn **Custom branches** và chỉ bật `dev/chapter-01`.
4. Trước khi xác nhận lần đầu, xem nhánh mà dashboard định triển khai. Nếu nút **Save and Deploy** chỉ chạy `main` và chưa có cách tắt, dừng ở đó. Một người có quyền có thể tạo project Pages dùng Direct Upload và đẩy một nhánh không phải production theo hướng dẫn bên dưới.
5. Mở thẻ **Deployments**, chọn lần chạy **Preview** cho `dev/chapter-01`, kiểm tra SHA trùng với PR #1 rồi mở URL HTTPS mà Pages trả về. Các commit sau khi kết nối sẽ kích hoạt preview theo cấu hình nhánh.

| Cấu hình | Giá trị |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Gốc repository |
| Node.js | 22 hoặc mới hơn. `.node-version` đã chọn 22. |
| Production branch | `main` |
| Preview branch | `dev/chapter-01` |
| Biến môi trường game | Không có |

## Direct Upload nếu cần kiểm soát lần triển khai đầu tiên

Chỉ dùng khi đã có tên project Pages sử dụng Direct Upload và quyền **Cloudflare Pages: Edit** trong đúng tài khoản. Trong Codex Cloud, build rồi dùng Wrangler với phiên xác thực đã cấu hình:

```sh
npm ci
npm run build
npx wrangler pages deploy dist --project-name TEN_PROJECT --branch dev/chapter-01
```

Trước khi chạy, xác nhận nhánh production của project là `main`, và URL được trả về thuộc lần deploy Preview. Không thể đổi một project Git integration sang Direct Upload trên cùng cấu hình. Direct Upload là phương án cho một project thích hợp đã được xác thực, không phải yêu cầu thay đổi chế độ của project hiện hữu.

## Nghiệm thu từ URL HTTPS

- Mở URL Preview và vào game. Xác nhận HTML, JS và WebP trả đúng loại nội dung, không có yêu cầu đến tài nguyên của chương chưa vào.
- Kiểm tra cú chạm, bảng thoại, combat và lưu rồi tải lại trên điện thoại. Nếu cần preview chỉ dành cho nhóm thử, chú ý yêu cầu đăng nhập khi mở QR.
- Chọn **Chia sẻ** trên đúng URL Preview, kiểm tra giá trị trong ô URL, rồi quét QR trên thiết bị khác. Không dùng QR từ địa chỉ nội bộ Cloud để chia sẻ bên ngoài.
- Cache trong `public/_headers` chỉ giữ dài hạn các tệp `/assets/*` có tên băm. Trang gốc yêu cầu kiểm tra lại trước khi dùng cache.

Tài liệu chính thức: [Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/), [Branch controls](https://developers.cloudflare.com/pages/configuration/branch-build-controls/), [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).
