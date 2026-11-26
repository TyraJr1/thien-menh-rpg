# Cloudflare Workers Static Assets

Worker `thien-menh-rpg` lấy mã từ `TyraJr1/thien-menh-rpg`. Mỗi push lên `dev/chapter-01` kích hoạt Workers Builds theo cấu hình Git hiện tại.

| Thiết lập Workers Builds | Giá trị |
| --- | --- |
| Worker | `thien-menh-rpg` |
| Production branch | `dev/chapter-01` |
| Root directory | `/` (gốc repository) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy --assets=./dist` |
| Node.js | `22`, từ `22.12.0` trở lên |

`wrangler.jsonc` khai báo tên Worker và thư mục `./dist`. Lệnh deploy hiện tại cũng chỉ định cùng thư mục. Wrangler được khóa trong `package-lock.json`. Ứng dụng phục vụ HTML và asset tĩnh, không cần mã Worker hay binding. Các URL không tồn tại trả 404. `public/_headers` được Vite chép vào `dist`; Cloudflare dùng tệp này để đặt cache dài hạn cho tệp băm trong `/assets/` và kiểm tra lại cache của trang gốc.

## Kiểm tra trước khi push

```sh
npm ci
npm run typecheck
npm test
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
npx wrangler deploy --assets=./dist --dry-run
```

Chạy các lệnh trong Codex Cloud. Dry run xác minh cấu hình và đóng gói, không tạo deployment. Việc triển khai dùng push Git và đường chạy Workers Builds hiện hữu. Các yêu cầu tới Static Assets được Cloudflare phục vụ miễn phí; Workers Builds vẫn có hạn mức riêng của gói Free.

## Kiểm tra lần triển khai

1. Trên GitHub, mở check **Workers Builds: thien-menh-rpg** của commit vừa push. Dùng liên kết **Details** để xem build tương ứng trong Cloudflare. Nếu bước build báo không tìm thấy cấu hình, kiểm tra thư mục gốc của build và commit đang chạy. Tên trong `wrangler.jsonc` phải khớp tên Worker.
2. Sau khi check báo thành công, lấy URL HTTPS từ **Settings → Domains & Routes** của Worker. Mở trang gốc, xác nhận game và các tệp JS/WebP tải đúng.
3. Chọn **Chia sẻ**. URL hiển thị và mã QR phải mở trang gốc của tên miền đang dùng. Nếu đang kiểm tra bản nội bộ của Wrangler thì QR chỉ trỏ đến địa chỉ của bản đó.

[Wrangler Static Assets](https://developers.cloudflare.com/workers/static-assets/) · [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) · [Hạn mức build](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)
