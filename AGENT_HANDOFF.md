# Tiệm Ham Lầy — Agent Handoff

Tài liệu này dành cho agent/developer tiếp tục dự án. Đọc hết file này trước khi sửa code.

## 1. Bản chất dự án

Đây là website thương mại điện tử cho thương hiệu **Tiệm Ham Lầy** — không phải Tiệm Ham Lấy.

Sản phẩm:

- Vòng tay: `30.000đ`.
- Dây đeo thẻ: `49.000đ`.
- Móc khóa: `35.000đ`.

Mục tiêu chính là kết hợp landing page giàu animation với luồng mua hàng thật, giỏ hàng, form đặt đơn, API MongoDB, email Brevo và admin quản lý đơn.

## 2. Cấu trúc repository

```text
/
├─ frontend/                 # React + Vite, landing page và admin UI
│  ├─ src/
│  │  ├─ main.jsx            # Entry point, cố ý không dùng React.StrictMode
│  │  ├─ App.jsx             # Shell chính, admin và các component legacy
│  │  ├─ LandingPage.jsx     # Landing page Ham Lầy hiện tại
│  │  ├─ api.js              # HTTP client frontend → backend
│  │  └─ styles.css          # Design system và toàn bộ CSS
│  └─ public/
│     ├─ products/           # 16 ảnh sản phẩm + combo-* + model-*
│     ├─ brand/              # logo.png, mascot.png
│     ├─ Download.mp3        # Nhạc nền
│     └─ qr.jpg              # QR chuyển khoản thật
├─ backend/                  # Node.js + Express + TypeScript
│  └─ src/
│     ├─ server.ts           # Express app, CORS, helmet, MongoDB
│     ├─ config/products.ts  # Nguồn giá và danh sách sản phẩm backend
│     ├─ models/             # Mongoose schemas
│     ├─ routes/public.ts    # Products và tạo order public
│     ├─ routes/admin.ts     # Login, dashboard, orders, customers
│     ├─ services/email.ts   # Brevo
│     └─ middleware/         # JWT admin auth
├─ Ảnh chụp sản phẩm/       # Tài nguyên gốc, không xóa
├─ qr.jpg                   # Bản QR gốc
├─ package.json              # Workspace scripts
├─ pnpm-workspace.yaml
├─ netlify.toml
└─ render.yaml
```

## 3. Stack và quy ước bắt buộc

- Package manager: **pnpm**. Không tạo `package-lock.json` hoặc `yarn.lock`.
- Frontend: React 19 + Vite.
- Styling: CSS hiện tại trong `frontend/src/styles.css`; Tailwind được cài nhưng phần landing chính đang dùng CSS design system hiện hữu.
- Animation UI: `motion`.
- Animation UI: `motion` (`gsap`, `@bsmnt/scrollytelling`, `page-flip`, `page-mascot` đã gỡ khỏi dependency; `pullcord` đã được thêm lại).
- Backend: Node.js + Express + TypeScript.
- Database: MongoDB + Mongoose.
- Email: Brevo từ backend.
- Deploy: frontend Netlify, backend Render.

Trong PowerShell, nếu `pnpm` bị chặn shim thì dùng `pnpm.cmd`:

```powershell
pnpm.cmd install
pnpm.cmd --dir frontend dev
pnpm.cmd --dir backend dev
pnpm.cmd --dir frontend build
pnpm.cmd --dir backend build
```

## 4. Frontend hiện tại

### Entry và route

`frontend/src/main.jsx` mount `<App />` và **không dùng `React.StrictMode`** (đã ổn định từ thời còn catalogue `page-flip`; chỉ bật lại sau khi test kỹ các effect của `CharmCursor` và `usePointerParallax`).

`App.jsx` import `LandingPage.jsx`. Admin vẫn nằm trong `App.jsx`; không chuyển toàn bộ admin sang landing component nếu không cần thiết.

### Landing page

`LandingPage.jsx` hiện có các phần chính:

- `Navigation` (logo ở góc trái).
- `Hero` với mascot, ảnh sản phẩm thật, parallax pointer và nút "Mua nhanh qua Instagram".
- `Story` — giới thiệu thương hiệu, tên thương hiệu / tầm nhìn / sứ mệnh, thời gian hoạt động (animation bằng `motion` `whileInView`).
- `Products` với filter, phân trang 9 sản phẩm/trang và product detail modal.
- `CharmLab` ("Thử vibe") với ảnh sản phẩm xoay quanh mascot.
- `GiftExperience` với textarea lời chúc có thể chỉnh sửa.
- `HowToOrder`.
- `GalleryContact` (combo 20·10) và `ModelSection` (ảnh người mẫu; vòng tròn phóng to món đang đeo theo toạ độ trong mảng `MODELS`, chia nhóm Vòng tay / Dây đeo thẻ; thêm ảnh mới thì thêm một dòng với x, y, ratio, zoom).
- `Policy` (giao hàng, thanh toán/cọc, bảo hành) và `Contact` (Instagram + các kênh khác).
- Cart drawer, checkout form, success modal và ambient music.

### Design tokens

Các màu thương hiệu nằm ở đầu `styles.css` dưới dạng CSS variables. Không hard-code thêm palette mới nếu có thể dùng token:

- `--cream`, `--paper`.
- `--mint`, `--pink`, `--yellow`.
- `--blue`, `--red`, `--yellow-strong`.
- `--ink`, `--muted`, `--line`.
- `--cherry`, `--muli`.

Trong landing (`.site-shell`) `--blue` đã được đặt thành đen, `--cherry` trỏ về Muli, `--cream`/`--yellow` là vàng nhạt `#fbf8ce`. Các màu xanh cứng trong CSS đã được chuyển thành `var(--blue)` / `rgba(var(--blue-rgb), …)` để đổi theo ngữ cảnh.

`styles.css` có nhiều block override ở cuối file vì đã xử lý nhiều breakpoint và bug visual trong quá trình build. Không xóa hàng loạt các override nếu chưa kiểm tra desktop và mobile.

### Product data

Danh sách hiện có 16 sản phẩm thật, lấy từ `Ảnh chụp sản phẩm/`:

- 7 `bracelet-*` (Vòng tay, 30.000đ).
- 4 `strap-*` (Dây đeo thẻ, 49.000đ).
- 5 `keychain-*` (Móc khóa, 35.000đ).

`combo-*` (4 ảnh Combo 20·10) và `model-*` (4 ảnh người mẫu) chỉ dùng cho gallery / `ModelSection`.

Backend `config/products.ts` là nguồn sự thật về ID, loại, giá và tên snapshot; `GROUPS` trong `LandingPage.jsx` là bản fallback và **phải giữ đồng bộ** với backend. Không dùng giá frontend để tạo order.

Ảnh sản phẩm phải dùng ảnh thật trong `frontend/public/products/`. Không thay bằng placeholder hoặc ảnh giả nếu ảnh thật tồn tại.

### Brand (theo `public/Landing page.md`)

- Logo ở góc trái nav và mascot nằm trong `frontend/public/brand/` (`logo.png`, `mascot.png`), cắt từ `Ảnh chụp sản phẩm/Bộ nhận diện thương hiệu/*.pdf`. Mascot dùng ở Hero, `Story` và `CharmLab`.
- Nội dung giới thiệu, tầm nhìn, sứ mệnh, chính sách (`Policy`) lấy nguyên văn từ tài liệu của tiệm. **Không thêm nội dung ngoài những gì tiệm cung cấp**; tên và câu mô tả sản phẩm là chữ in trên ảnh sản phẩm.
- Màu: nền chỉ hồng `--pink` + vàng (`--yellow` nhạt, `--yellow-strong`); chữ chỉ đen `--ink` + đỏ `--red`. Khung sản phẩm giữ nguyên các màu cũ. Block "Brand pass" ở cuối `styles.css` ghi đè token trong `.site-shell` (`--blue` = đen) để admin giữ giao diện riêng.
- Font: Muli cho tất cả (`--cherry` được trỏ về Muli trong `.site-shell`). Admin vẫn dùng Cherry Bomb One.
- Dây kéo đổi theme (`pullcord`) + chế độ tối đã được bật lại; skin tối cho thương hiệu nằm ở block "Round 4" cuối `styles.css` (nền mận đêm, chữ kem, thẻ giữ màu sáng). Đã bỏ: sổ catalogue `page-flip`, mascot cáo `page-mascot`, `@bsmnt/scrollytelling`. Các rule `.theme-dark`/`.book-*`/`.hamlay-pullcord` còn trong `styles.css` nhưng không còn được dùng.

### Accessibility và motion

- Không phụ thuộc hover để truy cập CTA.
- Input phải có label/aria-label.
- Giữ focus state.
- Custom cursor chỉ chạy với pointer phù hợp. Trên cảm ứng (`pointer: coarse`), chạm đúp vào chỗ trống sẽ gọi con trỏ sao chạy tới điểm đó (`CharmCursor`); nó phát sự kiện `hamlay-cursor` để `usePointerParallax` nghiêng Hero/Thử vibe theo. Chạm đúp lên phần tử tương tác (`CURSOR_BLOCKERS`) thì không kích hoạt.
- Animation phải có fallback `prefers-reduced-motion`.
- Không dùng animation làm thay đổi vùng click của nút.

## 5. Backend và nghiệp vụ

### Public API

- `GET /health` — trạng thái server/MongoDB.
- `GET /api/products` — danh sách sản phẩm từ backend.
- `POST /api/orders` — tạo order public.

`POST /api/orders` yêu cầu header `Idempotency-Key`. Backend:

1. Validate bằng Zod.
2. Tra sản phẩm theo ID từ `config/products.ts`.
3. Tự tính line total và tổng đơn.
4. Lưu MongoDB trước.
5. Gửi email Brevo sau khi order đã tồn tại.
6. Cập nhật `emailDelivery.status`; email lỗi không làm mất order.

Không tin giá, tổng tiền hoặc trạng thái thanh toán từ frontend.

### Admin API

- `POST /api/admin/login`.
- `GET /api/admin/dashboard`.
- `GET /api/admin/orders?page=&limit=&search=&status=&paymentStatus=`.
- `GET /api/admin/orders/:id`.
- `PATCH /api/admin/orders/:id/status`.
- `PATCH /api/admin/orders/:id/payment`.
- `GET /api/admin/customers?page=&limit=&search=`.

Admin dùng JWT. Không hard-code mật khẩu, secret hoặc token. Trạng thái xử lý và trạng thái thanh toán là hai field độc lập.

### Schema order

Order lưu:

- `orderCode`, `idempotencyKey`.
- Snapshot customer.
- Snapshot item name/category/price/image/quantity/lineTotal.
- `subtotal`, `total`.
- `note`, `gift`.
- `status`: `pending`, `confirmed`, `processing`, `completed`, `cancelled`.
- `paymentStatus`: `unpaid`, `paid`, `failed`, `refunded`.
- `emailDelivery`.
- `createdAt`, `updatedAt`.

Customer aggregation hiện nhận diện theo số điện thoại, không gộp chỉ dựa trên tên.

## 6. Environment

Không commit `.env.development` hoặc secret thật. Dùng các file mẫu:

- `frontend/.env.example`.
- `backend/.env.example`.

Backend cần các biến chính:

```dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=
CLIENT_URL=http://localhost:5173
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD_SALT=
ADMIN_PASSWORD_HASH=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
SHOP_NOTIFICATION_EMAIL=tiemnhalayhandmade@gmail.com
```

Tạo hash admin bằng:

```powershell
pnpm.cmd --dir backend hash-password "mat-khau-manh"
```

Frontend chỉ dùng biến public như `VITE_API_URL` và `VITE_INSTAGRAM_URL`. Không đặt API key/secret trong biến `VITE_*`.

## 7. Deploy

### Netlify

- Root directory: `frontend`.
- Build command: `pnpm install --frozen-lockfile && pnpm build`.
- Publish directory: `dist`.
- Cấu hình `VITE_API_URL=https://<render-domain>/api`.
- `netlify.toml` đã có SPA redirect.

### Render

- Root directory: `backend`.
- Build command: `pnpm install --frozen-lockfile && pnpm build`.
- Start command: `pnpm start`.
- Cấu hình MongoDB, JWT, admin và Brevo trên Render Environment Variables.
- `CLIENT_URL` phải khớp domain Netlify.

## 8. Quy trình làm việc cho agent tiếp theo

Trước khi sửa:

```powershell
git status --short
Get-Content -Encoding utf8 README.md
Get-Content -Encoding utf8 AGENT_HANDOFF.md
```

Sau khi sửa:

```powershell
pnpm.cmd --dir frontend build
pnpm.cmd --dir backend build
git diff --check
git status --short
```

Nguyên tắc:

1. Không `git reset --hard`, không xóa tài nguyên nếu chưa được yêu cầu.
2. Không sửa repository tham khảo bên ngoài phạm vi dự án.
3. Không tạo component trùng với component hiện có.
4. Không đổi tên thương hiệu thành “Ham Lấy”. Tên chính thức là **Tiệm Ham Lầy**.
5. Không đổi package manager sang npm/yarn.
6. Không thêm dependency chỉ để giải quyết một hiệu ứng nhỏ nếu CSS/Motion hiện tại đủ dùng.
7. Nếu thêm thư viện animation, kiểm tra cleanup, reduced-motion, bundle size và mobile fallback.
8. Không báo production-ready nếu chưa test MongoDB/Brevo thật.
9. Không commit `.env`, token, password hoặc API key.
10. Khi thay đổi landing page, test tối thiểu desktop, mobile, reduced-motion, cart, product detail và checkout.

## 9. Tình trạng kiểm thử hiện tại

Đã kiểm tra:

- Frontend Vite build: pass.
- Backend TypeScript build: pass ở các lần kiểm tra trước.
- `git diff --check`: pass sau các thay đổi gần nhất.
- Product assets, QR, music, logo và mascot đã có trong repository (`frontend/public/products`, `frontend/public/brand`).

Chưa thể xác nhận end-to-end với dịch vụ thật nếu thiếu:

- `MONGODB_URI` hợp lệ.
- Brevo API key và sender đã verify.
- Admin environment variables production.

Build frontend hiện chỉ còn cảnh báo bundle JavaScript lớn (React + Motion + GSAP-free); đây là warning hiệu năng, không phải lỗi build.
