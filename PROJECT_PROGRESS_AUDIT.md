# PROJECT_PROGRESS_AUDIT

Ngày audit: 2026-07-06

Phạm vi: audit code thật trong repo `forum_microservices`, không dựa vào README để kết luận. Các lệnh đã chạy gồm cài dependency cần thiết, Prisma validate, build/test/lint backend, build/lint frontend. Không sửa source code.

## 1. Goal

Đánh giá tiến độ thật của dự án Forum Microservices hiện tại:

- Backend NestJS: `api-gateway`, `auth`, `users`, `categories`, `threads`, `posts`, `votes`, `media`, `notifications`.
- Prisma schema, migrations, quan hệ entity.
- Frontend React + Vite: routing, pages, auth, API services, state management, responsive UI.
- Endpoint thật đang có.
- Phân loại tính năng: done / partial / missing / broken / placeholder.
- Ghi lỗi build/test/lint nếu có.
- Chấm phần trăm tiến độ từng phần.
- Đề xuất roadmap tối thiểu để chạy end-to-end.

## 2. Executive summary

Tiến độ tổng thể ước tính theo code thật: khoảng **35%**.

Dự án có khung backend NestJS tương đối rõ, Prisma schema validate được, backend build pass, và đã có một số endpoint CRUD/auth cơ bản. Tuy nhiên đây chưa phải microservices thật theo nghĩa vận hành độc lập; hiện là modular monolith qua `api-gateway` import các `libs/*`. Frontend còn chủ yếu là UI tĩnh, chưa tích hợp API, chưa có auth state, và hiện **frontend build đang fail**.

Các blocker chính để chạy end-to-end:

1. Frontend build fail do import sai casing: `ForumBlocK` vs `ForumBlock`.
2. Dependency backend cài chuẩn bằng `npm ci` fail do peer dependency conflict giữa Nest v10 và một số package Nest v11/v6.
3. Không có migrations Prisma trong repo.
4. Threads là placeholder, trong khi đây là core flow của forum.
5. Frontend chưa gọi API thật.
6. Media/notifications/email có nhiều fallback/mock/TODO.
7. Không có test nào.

## 3. Cause / Problem

Dự án đang ở trạng thái có scaffold backend tốt hơn frontend, nhưng nhiều module chỉ dừng ở mức route/service skeleton hoặc implementation chưa nối trọn luồng nghiệp vụ.

Vấn đề lớn nhất không nằm ở README hay ý tưởng kiến trúc, mà nằm ở code thật:

- `threads.service.ts` trả message placeholder, không thao tác DB.
- Frontend render dữ liệu hard-code, không gọi backend.
- Không có API service layer, auth store/context, route protected, thread detail page hoặc create post/thread UI.
- Prisma có schema hợp lệ nhưng không có migration, không có seed, không có media model.
- Vote dùng `targetId` đa hình cho thread/post, schema chỉ có relation optional từ `Vote.targetId` sang `Post.id`; vote thread có thể không biểu diễn quan hệ DB đầy đủ.
- Notifications có Prisma thật nhưng nhiều catch fallback trả dữ liệu mẫu, dễ che lỗi DB thật.
- Monitoring/RabbitMQ và email có code phụ trợ nhưng chưa được tích hợp vào flow diễn đàn.

## 4. Build / test / lint / validate result

### Backend

Dependency install:

- `npm ci`: **FAIL**
- Lỗi chính: `@nestjs/common@10.4.19` conflict với `@nestjs/microservices@11.1.3` yêu cầu `@nestjs/common@^11.0.0`.
- Sau đó có thử `npm ci --legacy-peer-deps` để audit tiếp. Lệnh đầu bị timeout stdout sau khoảng 124 giây, nhưng process sau đó kết thúc và `node_modules` được tạo đủ để chạy build.

Prisma:

- `npx prisma validate`: **PASS**
- Schema hợp lệ.
- Có `.env` được Prisma load, nhưng audit không đọc hoặc in nội dung `.env`.

Build:

- `npm run build`: **PASS**
- `nest build` compile thành công.

Test:

- `npm test -- --runInBand`: **FAIL**
- Lý do: không có file test `*.spec.ts`.
- Jest warning: config đang dùng sai key `moduleNameMapping`; Jest đúng là `moduleNameMapper`.

Lint:

- Không chạy `npm run lint` vì script backend là `eslint ... --fix`, có thể tự sửa code.
- Chạy an toàn `npx eslint "apps/**/*.ts" "libs/**/*.ts"`: **FAIL**
- Lý do: backend không có ESLint config.

### Frontend

Dependency install:

- `npm ci`: **PASS**
- NPM báo 13 vulnerabilities: 1 low, 4 moderate, 8 high.

Build:

- `npm run build`: **FAIL**
- Lỗi:

```text
src/pages/HomePage.tsx(2,24): error TS1261:
Already included file name '.../src/components/ForumBlocK.tsx'
differs from file name '.../src/components/ForumBlock.tsx' only in casing.
```

Lint:

- `npm run lint`: **PASS**

## 5. Backend audit

### API Gateway

Status: **partial, khoảng 65%**

Code thật:

- `apps/api-gateway/src/main.ts`
- `apps/api-gateway/src/app.module.ts`

Đã có:

- Nest bootstrap.
- CORS theo `FRONTEND_URL` hoặc `http://localhost:5173`.
- `cookie-parser`.
- Global `ValidationPipe` với `transform`, `whitelist`, `forbidNonWhitelisted`.
- Global prefix `/api`.
- Swagger tại `/api/docs`.
- Import các module: auth, users, categories, threads, posts, votes, notifications, media, shared.

Vấn đề/rủi ro:

- `JWT_SECRET` không có fallback; nếu env thiếu, auth runtime có thể lỗi hoặc token không an toàn tùy config.
- Repo tên microservices nhưng code hiện là modular monolith, không có app/service riêng cho từng domain.
- Dependency Nest version đang lệch, cài chuẩn fail.

### Auth

Status: **partial, khoảng 55%**

Endpoint thật:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Đã có:

- DTO validate cho login/register.
- Register hash password bằng bcrypt.
- Login tạo access token và refresh token.
- Refresh token được set vào HTTP-only cookie.
- `JwtAuthGuard`, `JwtStrategy`, `RolesGuard`, `CurrentUser`.

Thiếu/chưa ổn:

- Không có endpoint refresh token.
- Không persist session/refresh token dù schema có `Session`.
- Logout chỉ clear cookie, không revoke token/session.
- Không có forgot/reset password endpoint dù email service có helper.
- Không có rate limit/bruteforce protection.
- Không thấy frontend login/register gọi API.

### Users

Status: **partial, khoảng 60%**

Endpoint thật:

- `POST /api/users`
- `GET /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`

Đã có:

- CRUD cơ bản qua Prisma.
- Guard JWT toàn controller.
- Role guard cho create/update/delete.
- `remove` là soft delete bằng `status = BANNED`.

Thiếu/chưa ổn:

- `POST /api/users` tạo user trực tiếp nhưng không hash password trong `UsersService`; nếu admin dùng endpoint này sẽ lưu password plaintext.
- `GET /api/users/:id` trả full user, có nguy cơ lộ `password` vì `findById` không select loại bỏ password.
- Query `page`/`limit` nhận từ query string nhưng type method là number; cần xác nhận transform runtime, hiện không có `ParseIntPipe`.
- Không có user self-update/avatar profile flow.

### Categories

Status: **partial/gần usable, khoảng 70%**

Endpoint thật:

- `POST /api/categories`
- `GET /api/categories`
- `GET /api/categories/:id`
- `PATCH /api/categories/:id`
- `DELETE /api/categories/:id`

Đã có:

- CRUD cơ bản qua Prisma.
- Soft delete bằng `isActive = false`.
- Validate DTO.
- Check trùng slug.
- Public read, admin/mod write tùy route.

Thiếu/chưa ổn:

- `includeInactive` là query boolean nhưng không dùng `ParseBoolPipe`; chuỗi `"false"` có thể bị hiểu truthy nếu transform không xử lý như mong đợi.
- Có helper generate slug nhưng create DTO vẫn yêu cầu client gửi slug.
- Chưa include thread count hoặc cấu trúc category block cho forum homepage.

### Threads

Status: **placeholder/broken về nghiệp vụ, khoảng 10%**

Endpoint thật:

- `POST /api/threads`
- `GET /api/threads`
- `GET /api/threads/:id`
- `PATCH /api/threads/:id`
- `DELETE /api/threads/:id`

Code thật:

- Controller tồn tại.
- Service chỉ trả `{ message: "Threads service - ... method" }`.

Thiếu/chưa ổn:

- Không dùng Prisma model `Thread`.
- Không có auth guard cho create/update/delete.
- Không có DTO.
- Không có category filter, slug lookup, pagination, view count, lock/pin handling.
- Không tạo post đầu tiên hoặc liên kết author/category thật.
- Comment nói dùng MongoDB, nhưng Prisma schema đang có PostgreSQL model `Thread`; kiến trúc dữ liệu đang lệch.

### Posts

Status: **partial, khoảng 55%**

Endpoint thật:

- `GET /api/posts`
- `GET /api/posts/:id`
- `POST /api/posts`
- `PUT /api/posts/:id`
- `DELETE /api/posts/:id`

Đã có:

- List/detail/create/update/delete qua Prisma.
- Include author/thread/children/vote count.
- Auth required cho create/update.
- Delete chỉ admin/mod.
- Author-only update.

Thiếu/chưa ổn:

- Dùng `any`, chưa có DTO validate body.
- Query `page`/`limit` chưa parse int rõ ràng.
- Create không kiểm tra thread locked.
- Create không kiểm tra parent post thuộc cùng thread.
- Không gọi notification khi có post/reply mới dù service notifications có helper.
- Delete là hard delete, có thể không phù hợp forum/audit.

### Votes

Status: **partial/risky, khoảng 45%**

Endpoint thật:

- `POST /api/votes`
- `DELETE /api/votes/:targetId/:type`

Đã có:

- Upvote/downvote với value `1` hoặc `-1`.
- Toggle nếu vote cùng value.
- Update nếu đổi chiều vote.
- Unique theo `[userId, targetId, type]`.

Thiếu/chưa ổn:

- DTO dùng `any` ở controller.
- Không expose endpoint lấy stats/user vote dù service có method.
- Với `VoteType.THREAD`, service query `prisma.thread`, nhưng Prisma relation của `Vote` chỉ nối tới `Post?` qua `targetId`.
- `Vote.targetId` đa hình có thể làm FK tới `Post` gây không phù hợp cho thread vote tùy migration DB thực tế.
- Không cập nhật notification `VOTE_RECEIVED`.

### Media

Status: **partial/mostly placeholder, khoảng 25%**

Endpoint thật:

- `POST /api/media/upload`
- `POST /api/media/upload-multiple`
- `GET /api/media`
- `GET /api/media/:id`
- `DELETE /api/media/:id`

Đã có:

- Upload file vào disk `uploads`.
- Validate MIME type cơ bản và size 10MB.
- JWT guard cho upload/list/delete.

Thiếu/chưa ổn:

- Prisma schema không có `Media` model.
- Upload không persist metadata vào DB.
- `GET /api/media` luôn trả `data: []`.
- `GET /api/media/:id` luôn NotFound.
- `DELETE /api/media/:id` trả success mock, không xóa DB/file thật.
- App chưa serve static `/uploads`.
- File path dùng `process.cwd()/uploads`, cần kiểm soát deployment/security kỹ hơn.

### Notifications

Status: **partial/mock fallback, khoảng 45%**

Endpoint thật:

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `DELETE /api/notifications/:id`

WebSocket:

- Namespace `/notifications`
- Event client: `ping`
- Server emit: `notification`, `broadcast_notification`, `unread_count_update`

Đã có:

- Prisma model `Notification`.
- REST endpoints protected by JWT.
- Gateway xác thực bằng JWT.
- Helper notify new post/reply.

Thiếu/chưa ổn:

- Nhiều catch fallback trả dữ liệu mẫu hoặc bỏ qua lỗi, có thể che lỗi DB thật.
- RabbitMQ bị comment/disable.
- `NotificationType` khai báo enum tạm trong service thay vì import từ Prisma.
- Posts/threads/votes chưa tích hợp gọi notification helper.
- Frontend không có socket client.

### Shared / monitoring / email

Status: **partial/supporting, khoảng 40%**

Endpoint monitoring thật:

- `GET /api/monitoring/rabbitmq/overview`
- `GET /api/monitoring/rabbitmq/queues`
- `GET /api/monitoring/rabbitmq/queues/:name`
- `GET /api/monitoring/rabbitmq/health`
- `GET /api/monitoring/dashboard`

Đã có:

- PrismaService global.
- RabbitMQ monitoring qua Management API.
- Email queue model/service với cron.

Thiếu/chưa ổn:

- RabbitMQ credentials hard-code trong docker-compose và monitoring service.
- Email sending là mock có random failure.
- Monitoring endpoints không thấy guard/auth, có thể expose operational data.
- RabbitMQ actual queue service bị comment.

## 6. Prisma schema / migrations / relationships

Status: **schema partial, migrations missing, khoảng 50%**

Prisma validate: **PASS**.

Models hiện có:

- `User`
- `Session`
- `Category`
- `Thread`
- `Post`
- `Vote`
- `BlockedUser`
- `Notification`
- `EmailQueue`

Enums:

- `UserRole`
- `UserStatus`
- `VoteType`
- `NotificationType`
- `EmailStatus`

Quan hệ chính:

- User -> Session, Thread, Post, Vote, Notification.
- Category -> Thread.
- Thread -> Post.
- Post -> parent/children replies, votes.
- BlockedUser self-relation giữa User.

Vấn đề/rủi ro:

- Không có thư mục `prisma/migrations`.
- Không có seed data.
- Không có `Media` model dù media module tồn tại.
- `Session` model chưa được auth dùng.
- `Vote` dùng `targetId` cho cả thread/post nhưng relation chỉ khai báo `post Post? @relation("PostVotes", fields: [targetId], references: [id])`; thiếu relation rõ với `Thread` hoặc thiết kế tách target.
- Schema comment bị lỗi encoding, không ảnh hưởng validate nhưng gây khó bảo trì.
- `Thread.slug` unique toàn cục; nếu muốn slug theo category cần constraint khác, hiện chưa rõ yêu cầu.

## 7. Frontend audit

Status tổng frontend: **partial/static, khoảng 20%**

### Routing

Status: **partial, khoảng 35%**

Route thật:

- `/` -> `HomePage`
- `/register` -> `RegisterPage`

Link có nhưng chưa có route:

- `/latest-posts`
- `/latest-threads`
- `/trending`
- `/threads`
- `/login`
- Thread detail route đang comment.

### Pages/components

Đã có:

- `App` layout với Header/Footer/Outlet.
- `Header` responsive bằng Headless UI Disclosure/Menu.
- `LoginModal`.
- `HomePage` với forum blocks hard-code.
- `RegisterPage` form static.
- `ForumBlock` table.
- `Footer`.

Broken:

- `HomePage.tsx` import `../components/ForumBlocK`, trong khi file thật là `ForumBlock.tsx`; build fail vì casing.

Partial/missing:

- Register form không submit.
- Login modal không submit.
- Không có validation frontend.
- Không lưu token/user.
- Không có API client/service.
- Không có thread list/detail/create, post/reply UI, vote UI, media upload UI, notifications UI.
- Homepage dùng `forumData` hard-code thay vì `/api/categories` hoặc `/api/threads`.
- Mobile UI có cấu trúc responsive cơ bản, nhưng chưa test visual và chưa có dữ liệu thật.

### Auth / API services / state management

Status: **missing, khoảng 0-5%**

Search code không thấy:

- `fetch(`
- frontend `axios`
- `localStorage`
- `createContext`/auth context
- Redux/Zustand/TanStack Query
- socket client
- `VITE_` API base URL

Kết luận: frontend chưa tích hợp backend.

## 8. Endpoint thật đang có

Tất cả REST endpoint bên dưới có global prefix `/api`.

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Users

- `POST /api/users`
- `GET /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`

### Categories

- `POST /api/categories`
- `GET /api/categories`
- `GET /api/categories/:id`
- `PATCH /api/categories/:id`
- `DELETE /api/categories/:id`

### Threads

- `POST /api/threads`
- `GET /api/threads`
- `GET /api/threads/:id`
- `PATCH /api/threads/:id`
- `DELETE /api/threads/:id`

Ghi chú: endpoint tồn tại nhưng service chỉ placeholder.

### Posts

- `GET /api/posts`
- `GET /api/posts/:id`
- `POST /api/posts`
- `PUT /api/posts/:id`
- `DELETE /api/posts/:id`

### Votes

- `POST /api/votes`
- `DELETE /api/votes/:targetId/:type`

### Media

- `POST /api/media/upload`
- `POST /api/media/upload-multiple`
- `GET /api/media`
- `GET /api/media/:id`
- `DELETE /api/media/:id`

Ghi chú: list/detail/delete chưa có DB thật.

### Notifications

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `DELETE /api/notifications/:id`

### Monitoring

- `GET /api/monitoring/rabbitmq/overview`
- `GET /api/monitoring/rabbitmq/queues`
- `GET /api/monitoring/rabbitmq/queues/:name`
- `GET /api/monitoring/rabbitmq/health`
- `GET /api/monitoring/dashboard`

### Docs / realtime

- Swagger: `/api/docs`
- WebSocket namespace: `/notifications`

## 9. Feature status matrix

| Feature | Status | Tiến độ |
|---|---:|---:|
| Backend app bootstrap/API gateway | partial | 65% |
| Auth register/login/me/logout | partial | 55% |
| Refresh/session management | missing | 0% |
| Users CRUD/admin | partial | 60% |
| Categories CRUD | partial | 70% |
| Threads CRUD | placeholder | 10% |
| Posts CRUD/replies | partial | 55% |
| Votes | partial/risky | 45% |
| Media upload | partial/placeholder | 25% |
| Notifications REST/WebSocket | partial/mock fallback | 45% |
| RabbitMQ integration | mostly missing | 15% |
| Email queue | mock/partial | 35% |
| Prisma schema | partial | 60% |
| Prisma migrations | missing | 0% |
| Backend tests | missing | 0% |
| Backend lint config | missing/broken | 0% |
| Frontend routing/layout | partial | 35% |
| Frontend auth UI | static only | 15% |
| Frontend API integration | missing | 0% |
| Frontend state management | missing | 0% |
| Frontend build health | broken | 0% until casing fix |
| Responsive UI | partial | 30% |

## 10. Chấm tiến độ theo phần

- Backend tổng thể: **50%**
- Database/Prisma: **45%**
- Frontend tổng thể: **20%**
- DevOps/local setup: **35%**
- Test/quality gate: **5%**
- End-to-end usable forum flow: **15%**

Tổng hợp có trọng số theo khả năng chạy sản phẩm: **khoảng 35%**.

## 11. Roadmap tối thiểu để chạy end-to-end

Mục tiêu roadmap này là chạy được flow nhỏ nhất: user đăng ký/đăng nhập -> xem category/thread -> tạo thread -> reply post -> vote -> frontend gọi API thật.

1. Sửa health/build blockers.
   - Đồng bộ version Nest dependencies để `npm ci` pass không cần `--legacy-peer-deps`.
   - Sửa import casing `ForumBlocK` thành `ForumBlock`.
   - Thêm ESLint config backend hoặc chỉnh script lint.
   - Sửa Jest config `moduleNameMapping` thành `moduleNameMapper`.

2. Chốt database baseline.
   - Tạo migration đầu tiên từ schema hiện tại.
   - Thêm seed admin/user/category mẫu.
   - Quyết định thiết kế vote thread/post: tách `threadId`/`postId` hoặc bỏ FK đa hình gây rủi ro.
   - Thêm `Media` model nếu media cần persistence.

3. Implement threads thật bằng Prisma.
   - DTO create/update thread.
   - Auth guard cho create/update/delete.
   - List theo category, pagination, slug/detail.
   - Tạo thread với content, author, category.
   - Xử lý `isLocked`, `isPinned`, `viewCount`.

4. Hoàn thiện posts tối thiểu.
   - DTO create/update post.
   - Validate thread tồn tại và không locked.
   - Validate parent reply.
   - Gọi notifications khi tạo post/reply.

5. Hoàn thiện auth tối thiểu.
   - Hash password cho `UsersService.create` hoặc tách admin create user an toàn.
   - Không trả password ở user endpoints.
   - Implement refresh token hoặc bỏ refresh cookie khỏi response cho nhất quán.
   - Persist/revoke session nếu giữ model `Session`.

6. Tích hợp frontend API.
   - Thêm API client với `VITE_API_BASE_URL`.
   - Login/register submit thật.
   - Auth state context/store.
   - Homepage lấy categories/threads từ API.
   - Thread detail page lấy posts.
   - Create thread/reply form.
   - Vote button gọi `/api/votes`.

7. Quality gate tối thiểu.
   - Backend unit tests cho auth/users/categories/threads/posts.
   - E2E smoke test: register/login/create category/create thread/create post/vote.
   - Frontend build/lint trong CI/local script.

## 12. Exact fixes ưu tiên

Các fix này chưa được thực hiện trong audit, chỉ là đề xuất tối thiểu:

1. Frontend build:
   - Suspected file: `frontend/src/pages/HomePage.tsx`
   - Root cause: import path casing sai.
   - Exact fix: đổi `../components/ForumBlocK` thành `../components/ForumBlock`.
   - How to verify: chạy `npm run build` trong `frontend`.

2. Backend dependency:
   - Suspected file: `backend/package.json`
   - Root cause: Nest package major version lệch.
   - Exact fix: đồng bộ `@nestjs/*` về cùng major, ưu tiên giữ v10 hoặc nâng toàn bộ lên v11 có kiểm soát.
   - How to verify: xóa `node_modules`, chạy `npm ci`.

3. Backend test config:
   - Suspected file: `backend/package.json`
   - Root cause: Jest config dùng `moduleNameMapping`, không phải `moduleNameMapper`.
   - Exact fix: đổi key config và thêm ít nhất một test smoke.
   - How to verify: chạy `npm test`.

4. Threads:
   - Suspected file/class/method: `backend/libs/threads/src/services/threads.service.ts`
   - Root cause: service placeholder không dùng DB.
   - Exact fix: implement Prisma CRUD tối thiểu với DTO, guard và pagination.
   - How to verify: call `POST /api/threads`, `GET /api/threads`, `GET /api/threads/:id` với DB thật.

5. Users password exposure:
   - Suspected file/class/method: `backend/libs/users/src/services/users.service.ts`
   - Root cause: `findById` trả full user và `create` không hash password.
   - Exact fix: select loại `password` khỏi public responses; hash password hoặc chỉ cho auth service tạo password.
   - How to verify: call `GET /api/users/:id` không thấy password; admin create user không lưu plaintext.

## 13. Side effects or risks

- Vì không có migrations, việc deploy DB từ schema hiện tại chưa có baseline rõ.
- Vì frontend chưa gọi backend, backend pass build không đồng nghĩa app chạy end-to-end.
- Vì notifications có fallback/mock, lỗi DB thật có thể bị che trong runtime.
- Vì monitoring endpoints không có guard, nếu chạy public có thể lộ thông tin vận hành.
- Vì dependency backend conflict, môi trường sạch sẽ fail ngay tại `npm ci` nếu không dùng workaround.
- Vì chưa có test, các thay đổi tiếp theo cần rất nhỏ và kiểm tra thủ công kỹ.

## 14. Debug / clean code notes

- Code comment và message tiếng Việt trong nhiều file bị lỗi encoding mojibake, gây khó đọc nhưng không làm build backend fail.
- Backend có nhiều `any` ở threads/posts/votes controller/service, làm giảm hiệu quả `ValidationPipe`.
- Backend lint script hiện có `--fix`; trong audit không chạy script này để tránh tự sửa source.
- Frontend có dependency `@types/react-router-dom` v5 trong khi dùng `react-router-dom` v7; build hiện fail trước ở casing nên chưa kết luận được rủi ro type sâu hơn sau khi sửa casing.
- `docker-compose.yml` có Postgres, MongoDB, Redis, RabbitMQ, pgAdmin, mongo-express; nhưng code nghiệp vụ hiện chủ yếu dùng PostgreSQL/Prisma, MongoDB/Redis/RabbitMQ chưa tích hợp thật vào core forum.

## Phase 1 Fix Result

Ngày thực hiện: 2026-07-06

### File đã sửa

- `backend/package.json`
  - Hạ các package NestJS bị lệch major về NestJS v10 tương thích: `@nestjs/microservices`, `@nestjs/platform-socket.io`, `@nestjs/websockets`.
  - Hạ `@nestjs/schedule` về bản tương thích NestJS v10.
  - Sửa Jest config từ `moduleNameMapping` thành `moduleNameMapper`.
  - Bổ sung mapper cho alias sâu dạng `@libs/auth/guards/...`.

- `backend/package-lock.json`
  - Regenerate bằng `npm install` sau khi sửa dependency để `npm ci` chạy sạch, không cần `--legacy-peer-deps`.

- `backend/.eslintrc.js`
  - Thêm ESLint config tối thiểu cho TypeScript/NestJS.
  - Tắt `no-explicit-any` và `no-unused-vars` để tránh sửa hàng loạt ngoài phạm vi Phase 1.

- `backend/apps/api-gateway/src/app.module.spec.ts`
  - Thêm smoke test tối thiểu để `npm test` không fail vì không có test.

- `backend/libs/users/src/controllers/users.controller.ts`
- `backend/libs/categories/src/controllers/categories.controller.ts`
- `backend/libs/posts/src/controllers/posts.controller.ts`
- `backend/libs/votes/src/controllers/votes.controller.ts`
- `backend/libs/media/src/controllers/media.controller.ts`
- `backend/libs/notifications/src/controllers/notifications.controller.ts`
  - Đổi import guard/decorator từ barrel `@libs/auth` sang path trực tiếp để tránh circular import runtime khi Jest load `AppModule`.

- `frontend/src/pages/HomePage.tsx`
  - Sửa import casing từ `ForumBlocK` thành `ForumBlock`.

### Lỗi ban đầu

- Backend `npm ci` fail do peer dependency conflict: NestJS core/common v10 nhưng `@nestjs/microservices`, `@nestjs/platform-socket.io`, `@nestjs/websockets` đang ở v11.
- Backend `npm test` fail vì không có test và Jest config dùng sai key `moduleNameMapping`.
- Backend ESLint fail vì thiếu config.
- Frontend `npm run build` fail trên casing file `ForumBlocK` vs `ForumBlock`.
- Repo không có thư mục `backend/prisma/migrations`.

### Cách sửa

- Giữ NestJS v10 làm baseline vì backend đã build được với v10.
- Không nâng toàn bộ lên NestJS v11.
- Không chạy `--legacy-peer-deps` trong bản verify cuối.
- Không chạy migration hoặc lệnh thay đổi database thật.
- Thêm smoke test rất nhỏ, chỉ kiểm tra `AppModule` được import/defined.
- Thêm ESLint config tối thiểu để command lint chạy được, chưa xử lý style/lint sâu.
- Sửa frontend import đúng tên file thật để build ổn trên Windows/Linux.

### Lệnh đã chạy và kết quả

Backend:

- `npm ci`: PASS
- `npx prisma validate`: PASS
- `npm run build`: PASS
- `npm test`: PASS, 1 test passed
- `npx eslint "apps/**/*.ts" "libs/**/*.ts"`: PASS

Frontend:

- `npm ci`: PASS
- `npm run build`: PASS
- `npm run lint`: PASS

Ghi chú:

- `npm ci` backend vẫn báo audit vulnerabilities: 56 vulnerabilities, gồm 5 low, 24 moderate, 26 high, 1 critical.
- `npm ci` frontend vẫn báo audit vulnerabilities: 13 vulnerabilities, gồm 1 low, 4 moderate, 8 high.
- Các cảnh báo audit/deprecated chưa được xử lý vì Phase 1 yêu cầu minimal change và không update package ngoài blocker install/build.
- `backend/prisma/migrations` hiện chưa có.
- Prisma validate pass, nhưng chưa tạo/chạy migration.

### Hướng dẫn chạy local sau Phase 1

Backend:

```powershell
cd backend
npm ci
npx prisma validate
npm run build
npm test
npm run start:dev
```

Frontend:

```powershell
cd frontend
npm ci
npm run build
npm run dev
```

Database/service local:

```powershell
cd backend
docker compose up -d postgres redis rabbitmq
```

Lưu ý:

- Backend runtime cần `.env` hợp lệ, đặc biệt `DATABASE_URL` và `JWT_SECRET`.
- Chưa chạy migration trong Phase 1. Nếu database local chưa có schema, bước tiếp theo cần tạo baseline migration/seed dev có kiểm soát.
- MongoDB có trong `docker-compose.yml` nhưng core backend hiện chưa dùng thật cho threads.

### Bước tiếp theo sau Phase 1

1. Tạo migration baseline và seed dev sau khi xác nhận `DATABASE_URL` trỏ local dev.
2. Sửa các vấn đề bảo mật tối thiểu ở users/auth: không trả password, không lưu plaintext khi admin tạo user.
3. Implement `threads.service.ts` bằng Prisma vì hiện vẫn là placeholder.
4. Tích hợp frontend với API thật cho register/login/homepage.
5. Tách phase riêng cho audit vulnerability/package upgrade vì có thể kéo theo breaking change.
