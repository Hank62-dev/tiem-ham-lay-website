# Tiệm Ham Lầy

Website bán phụ kiện handmade với landing page tương tác, giỏ hàng, trải nghiệm tặng quà, order API MongoDB, email Brevo và admin vận hành.

## Cấu trúc

- `frontend/`: React + Vite + Tailwind CSS + Motion. Landing page và `/admin` dùng chung bundle, admin được bảo vệ ở backend.
- `backend/`: Express + Mongoose + Zod + JWT. Backend là nguồn sự thật cho giá, tổng tiền, trạng thái đơn và trạng thái thanh toán.
- `Ảnh chụp sản phẩm/`, `qr.jpg`: tài nguyên gốc được giữ nguyên. Một số ảnh thật được copy sang `frontend/public/products/` với tên ổn định để build.

## Chạy local

```powershell
pnpm install
pnpm --dir backend dev
pnpm --dir frontend dev
```

Frontend chạy ở `http://localhost:5173`, API ở `http://localhost:5000`.

Nếu PowerShell chặn shim `pnpm.ps1`, dùng `pnpm.cmd` tương đương.

Build production:

```powershell
pnpm --dir frontend build
pnpm --dir backend build
```

## Environment

Hai file `.env.development` local đã được tạo và được ignore khỏi Git. File mẫu tương ứng là `frontend/.env.example` và `backend/.env.example`.

Backend bắt buộc để nhận đơn:

- `MONGODB_URI`: connection string MongoDB Atlas/local.
- `JWT_SECRET`: chuỗi ngẫu nhiên dài.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD_SALT`, `ADMIN_PASSWORD_HASH`: thông tin admin. Không dùng plaintext password.

Email tùy chọn theo môi trường:

- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `SHOP_NOTIFICATION_EMAIL`.
- Brevo sender phải được verify trong Brevo. Backend lưu order trước, sau đó mới gửi email; nếu Brevo lỗi, order vẫn tồn tại với `emailDelivery.status=failed`.

Tạo hash admin:

```powershell
pnpm --dir backend hash-password "mat-khau-manh-cua-ban"
```

Copy hai dòng output vào `ADMIN_PASSWORD_SALT` và `ADMIN_PASSWORD_HASH`.

## Nghiệp vụ đã triển khai

- Product catalog thật với giá tập trung: vòng tay 30.000đ, dây đeo thẻ 49.000đ, móc khóa 35.000đ.
- Giỏ hàng, cập nhật số lượng, backend tính lại tổng, idempotency key chống tạo đơn trùng, rate limit tạo đơn.
- Form khách hàng gồm tên, điện thoại, email tùy chọn, năm sinh/giới tính tùy chọn, địa chỉ, ghi chú.
- Gift flow có tên người nhận, lời chúc và preview thiệp; khi tắt gift, dữ liệu gift không gửi lên backend.
- Thanh toán chuyển khoản với QR thật, MB, `NGUYEN LE THU HA`, `0399799892`; không tự đánh dấu paid.
- Instagram fallback: copy tin nhắn và mở `@tiemhamlay.handmade`; website không tuyên bố đã gửi tin.
- Admin `/admin`: JWT login + refresh token xoay vòng, dashboard số liệu thật, search/filter/pagination order, chi tiết dữ liệu trong bảng, cập nhật order status hợp lệ, toggle payment paid/unpaid, customer aggregation theo số điện thoại.
- Brevo transactional email ở backend.
- Responsive, semantic labels, focus state, reduced-motion fallback, custom cursor chỉ dùng với pointer phù hợp.

## Deploy

### Render

Tạo Web Service trỏ root directory `backend`, build `pnpm install --frozen-lockfile && pnpm build`, start `pnpm start`. Có thể dùng `render.yaml`; nhập toàn bộ secret trong Render Environment Variables.

### Netlify

Tạo site trỏ root directory `frontend`, build `pnpm install --frozen-lockfile && pnpm build`, publish `dist`. Thêm `VITE_API_URL=https://<render-api>/api` và `VITE_INSTAGRAM_URL`. `netlify.toml` đã có SPA redirect cho `/admin`.

Sau deploy, cập nhật `CLIENT_URL` ở Render bằng domain Netlify và `PUBLIC_SITE_URL` bằng domain frontend, rồi kiểm tra `/health`, `/api/products`, login admin và tạo đơn với MongoDB thật.

## Kiểm thử đã chạy

- `pnpm --dir frontend build`: pass.
- `pnpm --dir backend build`: pass.
- Backend runtime: pass; `/health` trả `ok: true`, `/api/products` trả 7 sản phẩm.
- Chưa thể kiểm thử tạo order vào MongoDB/Brevo thật trong workspace vì chưa có `MONGODB_URI` và secret dịch vụ. Khi thiếu MongoDB, API cố ý trả 503, không tạo dữ liệu giả.
