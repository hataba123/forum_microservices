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
## Phase 2A Database/Auth Security Result

Ngày thực hiện: 2026-07-06

### Database config đã kiểm tra

- Prisma provider: PostgreSQL.
- `backend/.env.example` dùng PostgreSQL local mẫu: host `localhost`, database `forum_voz`.
- `backend/.env` hiện tại có `DATABASE_URL` trỏ host `localhost`, port `5432`, database `forum_db`.
- Không in user/password/secret ra báo cáo.
- Vì host là `localhost`, đây được xem là local dev an toàn để thử migration.

### File đã sửa

- `backend/libs/users/src/services/users.service.ts`
  - `UsersService.create` hash password bằng bcrypt trước khi lưu.
  - `create`, `findById`, `findByUsername`, `findByEmailOrUsername`, `update`, `remove` loại `password` khỏi object trả ra.
  - `findByEmail` vẫn trả password vì auth/internal cần dùng để `bcrypt.compare`.

- `backend/libs/auth/src/services/auth.service.ts`
  - `register` không hash trước nữa để tránh double-hash; password raw được truyền vào `UsersService.create`, nơi duy nhất chịu trách nhiệm hash.
  - `login` vẫn không trả password trong response.
  - `me/getProfile` dùng `findById`, hiện đã không có password.

- `backend/package.json`
  - Thêm script `seed`.
  - Thêm cấu hình `prisma.seed`.

- `backend/prisma/seed.ts`
  - Thêm seed dev idempotent.
  - Password dev được hash bằng bcrypt.
  - Dùng `upsert` để chạy lại không tạo trùng user/category/thread/post.

- `backend/prisma/migrations/20260706000000_init/migration.sql`
  - Tạo baseline migration SQL bằng `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`.

### Migration

- Đã tạo migration baseline trong repo: `backend/prisma/migrations/20260706000000_init/migration.sql`.
- Chưa apply được migration vào DB local vì Prisma migration engine fail.
- Lệnh đã thử:
  - `npx prisma migrate dev --name init`: FAIL
  - `npx prisma migrate dev --name init --create-only` với debug/backtrace: FAIL
  - `npx prisma migrate deploy`: FAIL
  - `npx prisma migrate status`: FAIL
- Lỗi còn lại chính xác:

```text
Error: Schema engine error:
```

- Prisma version tại máy audit:
  - `prisma`: 5.22.0
  - `@prisma/client`: 5.22.0
  - Node.js: v26.4.0
  - OS/binary target: Windows x64

### Seed

- Đã tạo seed file: `backend/prisma/seed.ts`.
- Chưa chạy seed vì migration chưa apply được; tránh ghi dữ liệu vào DB chưa chắc có schema đúng.
- User dev mẫu được định nghĩa trong seed:
  - Admin: `admin@example.com` / `Admin@123456`
  - User: `user@example.com` / `User@123456`
- Đây là credential local/dev, không phải production secret.
- Seed category mẫu:
  - `general`
  - `mobile-it`
  - `game-entertainment`
- Seed thêm 1 thread mẫu và 2 post mẫu bằng Prisma vì schema hiện hỗ trợ `Thread`/`Post`; phần service threads vẫn chưa implement trong Phase 2A.

### Security đã sửa

- API-facing user response không còn trả field `password` qua `UsersService.findById`, `create`, `update`, `remove`.
- `UsersService.findMany` trước đó đã dùng `select` không có password và vẫn giữ nguyên.
- `UsersService.create` không còn lưu plaintext password khi admin tạo user qua `POST /api/users`.
- `AuthService.register` không phá flow register/login: password được hash một lần tại `UsersService.create`.
- `AuthService.login` vẫn dùng `findByEmail` để lấy hash password phục vụ `bcrypt.compare`, response login không chứa password.

### Refresh token/session audit

- Auth hiện vẫn set refresh token cookie khi login.
- Chưa có endpoint refresh token.
- Chưa persist/revoke refresh token vào `Session` dù schema có model `Session`.
- Không implement refresh/session trong Phase 2A vì sẽ cần thay đổi flow auth lớn hơn phạm vi minimal fix.

### Lệnh đã chạy và kết quả

Backend:

- `npm ci`: PASS
- `npx prisma validate`: PASS
- `npx prisma generate`: PASS
- `npm run build`: PASS
- `npm test`: PASS, 1 test passed
- `npx eslint "apps/**/*.ts" "libs/**/*.ts"`: PASS

Migration/seed:

- `npx prisma migrate dev --name init`: FAIL với `Schema engine error:`
- `npx prisma migrate deploy`: FAIL với `Schema engine error:`
- `npx prisma migrate status`: FAIL với `Schema engine error:`
- `npm run seed`: chưa chạy vì migration chưa apply được.

### Vấn đề còn lại

- Cần xử lý lỗi Prisma schema engine local trước khi apply migration/seed được.
- `Vote` schema vẫn là thiết kế đa hình `targetId` nhưng relation chỉ trỏ `Post`; đây chưa sửa trong Phase 2A.
- Refresh token/session vẫn chưa hoàn chỉnh.
- Threads service vẫn placeholder, đúng phạm vi Phase 2A là chưa implement.
- npm audit vulnerabilities vẫn còn, chưa xử lý trong Phase 2A.

### Bước tiếp theo đề xuất cho Phase 2B

1. Sửa/blocker Prisma migrate engine trên môi trường local, ưu tiên thử Node LTS thay vì Node v26 hoặc chạy migration trong môi trường Docker/dev shell ổn định.
2. Apply baseline migration và chạy `npm run seed` hai lần để xác nhận idempotent.
3. Nếu DB đã ổn, xử lý tiếp schema vote thread/post trước khi implement vote đầy đủ.
4. Phase 2B nên implement `threads.service.ts` bằng Prisma ở mức CRUD tối thiểu, chưa mở rộng realtime/media.
## Phase 2A.1 Prisma Engine Fix Result

Ngày thực hiện: 2026-07-06

### Nguyên nhân thật của lỗi

Nguyên nhân hiện tại là PostgreSQL local chưa chạy hoặc không nghe ở `localhost:5432`, nên Prisma không kết nối được database `forum_db`.

Bằng chứng chính:

- `Test-NetConnection localhost:5432`: `TcpTestSucceeded = False`.
- `psql`: không có trong PATH.
- `docker`: không có trong PATH, nên không thể dùng `docker compose` local hiện tại.
- `npx prisma db execute --stdin --schema prisma/schema.prisma` trả lỗi rõ:

```text
Error: P1001
Can't reach database server at `localhost:5432`
Please make sure your database server is running at `localhost:5432`.
```

`npx prisma migrate status` và `npx prisma migrate dev --name init` vẫn trả lỗi mơ hồ:

```text
Error: Schema engine error:
```

Debug log không hiện lỗi permission/parsing SQL; lỗi kết nối được xác nhận qua TCP và `prisma db execute`.

### Thông tin môi trường

- Node.js: `v26.4.0`
- npm: `11.17.0`
- Prisma CLI: `5.22.0`
- `@prisma/client`: `5.22.0`
- Prisma CLI và client cùng version.
- Node/npm/npx đang chạy từ `C:\Program Files\nodejs`.
- DATABASE_URL đã được kiểm tra dạng masked: `postgresql://***:***@localhost:5432/forum_db`.
- Prisma schema validate: PASS.
- Prisma generate: PASS.

### PostgreSQL local

- Host yêu cầu: `localhost`
- Port yêu cầu: `5432`
- Database yêu cầu: `forum_db`
- TCP check tới port 5432: FAIL.
- Không kiểm tra được database tồn tại/quyền user bằng `psql` vì `psql` không có trong PATH.
- Không tạo/drop database.
- Không chạy lệnh phá dữ liệu.

Đề xuất để user tự chuẩn bị DB local:

```sql
CREATE DATABASE forum_db;
```

Sau đó đảm bảo user trong `DATABASE_URL` có quyền create table/schema trên database local này. Không ghi credential thật vào repo hoặc audit.

### Prisma cache/engine

Đã thử bước an toàn:

- Xóa `backend/node_modules/.prisma`.
- Xóa `backend/node_modules/@prisma/engines`.
- Chạy lại `npm ci`.
- Chạy lại `npx prisma generate`.
- Chạy lại `npx prisma migrate status`.

Kết quả:

- `npm ci`: PASS.
- `npx prisma generate`: PASS.
- `npx prisma migrate status`: vẫn FAIL vì database không reachable.

### OneDrive/path

Hiện chưa có bằng chứng lỗi do OneDrive/path/sync/permission. Prisma engine binary path tồn tại và `prisma validate/generate` chạy được.

Không cần chuyển repo ra khỏi OneDrive ngay để xử lý lỗi hiện tại. Nếu sau khi PostgreSQL local chạy đúng mà migrate vẫn fail, bước test an toàn tiếp theo là copy repo sang thư mục không nằm trong OneDrive, ví dụ `C:\dev\forum_microservices`, vì OneDrive đôi khi gây file lock/sync delay với binary hoặc generated files.

### Migration SQL

Đã kiểm tra `backend/prisma/migrations/20260706000000_init/migration.sql`:

- SQL là PostgreSQL.
- Có `CREATE TYPE`, `CREATE TABLE`, unique index, foreign key theo thứ tự hợp lý.
- Không có `CREATE EXTENSION`.
- Không thấy yêu cầu quyền superuser.
- Không thấy SQL lạ/không tương thích ở baseline.
- Có FK `votes.targetId -> posts.id`, đúng với schema hiện tại nhưng vẫn là rủi ro nghiệp vụ vote thread/post đã ghi ở audit trước; không sửa schema trong Phase 2A.1 vì chưa chứng minh đây là nguyên nhân migrate fail.

### File đã sửa

- Chỉ cập nhật `PROJECT_PROGRESS_AUDIT.md`.
- Không sửa code backend/frontend.
- Không sửa schema Prisma.
- Không sửa migration SQL.

### Lệnh đã chạy và kết quả

Pass:

- `npm ci`
- `node -v`
- `npm -v`
- `npx prisma -v`
- `npm ls prisma @prisma/client`
- `where node`
- `where npm`
- `where npx`
- `npx prisma validate`
- `npx prisma generate`
- `npm run build`
- `npm test`
- `npx eslint "apps/**/*.ts" "libs/**/*.ts"`

Fail:

- `Test-NetConnection localhost -Port 5432`: FAIL.
- `npx prisma db execute --stdin --schema prisma/schema.prisma`: FAIL với `P1001`.
- `npx prisma migrate status`: FAIL với `Schema engine error:`.
- `npx prisma migrate dev --name init`: FAIL với `Schema engine error:`.

Không chạy:

- `npm run seed`, vì migration chưa apply được.
- Bất kỳ reset/drop database nào.

### Migration/seed

- Migration chưa apply được.
- Seed chưa chạy được.
- Baseline migration file và seed file vẫn giữ nguyên từ Phase 2A.

### Bước tiếp theo đề xuất

1. Cài/chạy PostgreSQL local hoặc đưa `DATABASE_URL` về một Postgres local đang chạy.
2. Đảm bảo database `forum_db` tồn tại và user trong `DATABASE_URL` có quyền tạo table/schema.
3. Chạy lại:

```powershell
cd backend
npx prisma db execute --stdin --schema prisma/schema.prisma
npx prisma migrate status
npx prisma migrate dev --name init
npm run seed
npm run seed
```

4. Nếu DB đã reachable nhưng migrate vẫn fail, thử Node LTS hoặc copy repo ra khỏi OneDrive để loại trừ runtime/path issue.
## Phase 2A.1 Prisma Migration Apply Result

Ngày thực hiện: 2026-07-06

### DATABASE_URL local dev

- `backend/.env` đã được kiểm tra và cập nhật local để trỏ PostgreSQL dev.
- DATABASE_URL masked: `postgresql://***:***@localhost:5432/forum_db?schema=public`.
- Host: `localhost`
- Port: `5432`
- Database: `forum_db`
- Password không được ghi vào audit.
- Không commit `.env` vì file chứa credential local.
- Không cần đổi `localhost` sang `127.0.0.1`; kết nối qua `localhost` đã pass.

### Kết quả migration

- `Test-NetConnection localhost -Port 5432`: PASS.
- `npx prisma migrate status` đã connect được DB và báo migration pending.
- Lần apply đầu tiên fail với:

```text
Error: P3006
Migration `20260706000000_init` failed to apply cleanly to the shadow database.
ERROR: syntax error at or near "﻿"
```

- Nguyên nhân: `migration.sql` có UTF-8 BOM ở đầu file do lần tạo migration trước đó dùng PowerShell `Out-File -Encoding utf8`.
- Đã sửa tối thiểu `backend/prisma/migrations/20260706000000_init/migration.sql` bằng cách lưu lại UTF-8 không BOM.
- Byte đầu file sau sửa: `2D 2D 20`, tương ứng comment SQL `-- `.
- Sau khi sửa BOM, `npx prisma migrate dev --name init`: PASS.
- `npx prisma migrate status`: PASS, database schema up to date.
- Không dùng `prisma migrate reset`.
- Không drop database.

### Kết quả seed

- `npm run seed`: PASS.
- `npm run seed` lần 2: PASS.
- Seed idempotent, không tạo trùng dữ liệu.
- Smoke query sau seed lần 2:

```json
{"users":2,"categories":3,"threads":1,"posts":2,"seededUsers":2}
```

Seed dev account:

- Admin: `admin@example.com` / `Admin@123456`
- User: `user@example.com` / `User@123456`

Đây là credential local/dev, không phải production secret.

### Lệnh verify đã chạy

Pass:

- `npm ci`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate status`
- `npx prisma migrate dev --name init`
- `npm run seed`
- `npm run seed` lần 2
- `npm run build`
- `npm test`
- `npx eslint "apps/**/*.ts" "libs/**/*.ts"`

Fail còn lại:

- Không còn lệnh Phase 2A.1 nào fail sau khi sửa BOM migration.

### File đã sửa

- `backend/prisma/migrations/20260706000000_init/migration.sql`
  - Chỉ đổi encoding để bỏ BOM, không thay đổi SQL nghiệp vụ.
- `PROJECT_PROGRESS_AUDIT.md`
  - Ghi kết quả apply migration/seed và verify.

### Bước tiếp theo đề xuất

1. Không commit `.env`; nên đưa credential local vào `.env.example` dạng placeholder hoặc hướng dẫn riêng nếu cần.
2. Phase 2B có thể bắt đầu implement `threads.service.ts` bằng Prisma CRUD tối thiểu.
3. Sau đó xử lý rủi ro schema `Vote.targetId` đang FK về `posts` trong khi `VoteType` có cả `THREAD`.
## Phase 2B Threads Implementation Result

Ngày thực hiện: 2026-07-06

### File đã sửa/thêm

- `backend/libs/threads/src/dto/create-thread.dto.ts`
- `backend/libs/threads/src/dto/update-thread.dto.ts`
- `backend/libs/threads/src/dto/query-thread.dto.ts`
- `backend/libs/threads/src/controllers/threads.controller.ts`
- `backend/libs/threads/src/services/threads.service.ts`
- `backend/libs/threads/src/services/threads.service.spec.ts`
- `backend/libs/threads/src/index.ts`
- `PROJECT_PROGRESS_AUDIT.md`

### Trước Phase 2B

- `ThreadsService` chỉ là placeholder, trả các message như `Threads service - create method`.
- `ThreadsController` có route CRUD nhưng chưa có DTO, chưa có auth guard cho create/update/delete.
- Không có Prisma CRUD thật cho model `Thread`.

### Sau Phase 2B

Threads đã có CRUD thật bằng Prisma ở mức tối thiểu:

- `POST /api/threads`
  - Yêu cầu JWT.
  - Validate body bằng `CreateThreadDto`.
  - Kiểm tra category tồn tại và `isActive = true`.
  - Tự tạo slug từ title nếu client không gửi slug.
  - Slug unique bằng hậu tố `-2`, `-3`, ...
  - Tạo `Thread` và `Post` đầu tiên trong cùng transaction.

- `GET /api/threads`
  - Public.
  - Có pagination `page`, `limit`, limit tối đa 100.
  - Filter tối thiểu: `categoryId`, `categorySlug`, `authorId`, `isPinned`.
  - Search title/content bằng `search`.
  - Include author public info không có password, category, `_count.posts`.
  - Sort pinned trước, sau đó newest trước.

- `GET /api/threads/:id`
  - Public.
  - Tìm theo id.
  - Tăng `viewCount` khi xem detail.
  - Include author/category/posts cơ bản, không trả password.
  - Throw `NotFoundException` nếu không tìm thấy.

- `PATCH /api/threads/:id`
  - Yêu cầu JWT.
  - Chỉ author hoặc `ADMIN`/`MODERATOR` được sửa.
  - User thường không được sửa thread bị locked.
  - Admin/mod có thể sửa thread locked.
  - Nếu đổi title hoặc slug, slug được xử lý unique.

- `DELETE /api/threads/:id`
  - Yêu cầu JWT.
  - Chỉ author hoặc `ADMIN`/`MODERATOR` được xóa.
  - Schema chưa có `isDeleted`, `status`, hoặc `deletedAt`, nên hiện dùng hard delete.

### Auth/role

- Create/update/delete dùng `JwtAuthGuard`.
- Dùng `CurrentUser` decorator.
- Không import auth qua barrel `@libs/auth` để tránh circular import.
- Quyền update/delete kiểm tra trong service:
  - Author được sửa/xóa thread của mình.
  - `ADMIN`/`MODERATOR` được sửa/xóa thread của người khác.
  - User khác bị chặn với `ForbiddenException`.

### Post đầu tiên

- Create thread có tạo post đầu tiên.
- Lý do: schema hiện có `Thread.content` và `Post.threadId`; tạo post đầu tiên giúp thread detail/list bài viết có dữ liệu nhất quán với forum workflow mà không cần đổi schema.
- Dữ liệu được tạo trong transaction để tránh thread có mà post đầu tiên không có.

### Soft delete

- Chưa có soft delete vì schema `Thread` không có field phù hợp.
- Hiện `remove` dùng hard delete, và schema có cascade từ `Post` sang `Thread`.
- Rủi ro: xóa thread sẽ xóa posts liên quan theo cascade, không giữ lịch sử/audit. Nên thêm `deletedAt` hoặc `status` trong phase riêng nếu muốn hành vi forum an toàn hơn.

### Test/API smoke

Unit test mới:

- `ThreadsService.create` tạo thread và post đầu tiên trong transaction.
- `ThreadsService.findAll` xử lý pagination.
- `ThreadsService.findById` throw `NotFoundException` khi không có thread.

Smoke API local đã chạy:

- Login admin seed: PASS.
- Login user seed: PASS.
- `GET /api/categories`: PASS.
- `POST /api/threads`: PASS.
- `GET /api/threads?page=1&limit=20`: PASS.
- `GET /api/threads/:id`: PASS.
- User khác update thread: bị chặn 403, PASS.
- Admin update thread: PASS.
- Admin delete thread: PASS.

### Lệnh verify

Pass:

- `npm ci`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate status`
- `npm run build`
- `npm test`
- `npx eslint "apps/**/*.ts" "libs/**/*.ts"`

Fail:

- Không còn lệnh Phase 2B nào fail.

### Vấn đề còn lại

- `GET /api/threads/:id` hiện tìm theo id, chưa thêm route slug riêng để tránh route change không cần thiết.
- Vote schema vẫn có rủi ro: `Vote.targetId` FK về `posts.id` nhưng `VoteType` có cả `THREAD`.
- Thread delete hiện là hard delete do schema chưa hỗ trợ soft delete.
- Notifications chưa được gọi khi tạo thread/post đầu tiên.
- Frontend chưa tích hợp threads API.

### Bước tiếp theo đề xuất

1. Phase 2C: xử lý schema/logic vote thread/post hoặc tạm giới hạn vote cho post để tránh lỗi FK khi vote thread.
2. Thêm soft delete cho thread/post trong phase schema có kiểm soát nếu muốn giữ lịch sử.
3. Tích hợp frontend với API threads: list/detail/create.
4. Bổ sung e2e test auth + thread CRUD qua HTTP.
## Phase 2C Votes Fix Result

Ngày thực hiện: 2026-07-06

### Vấn đề vote cũ

- `Vote.targetId` là field đa hình nhưng lại có foreign key trực tiếp về `posts.id`.
- `VoteType` có cả `POST` và `THREAD`, trong khi schema chỉ relation được với `Post`.
- Service cũ cho phép vote thread bằng `targetId`, nhưng DB không có relation rõ với `Thread`; thread vote có thể fail hoặc sai mô hình dữ liệu.

### Schema vote mới

`Vote` hiện dùng target rõ ràng:

- `userId`
- `postId` nullable
- `threadId` nullable
- `type`
- `value`
- `createdAt`
- `updatedAt`

Relations:

- `Vote.user -> User`
- `Vote.post -> Post?`
- `Vote.thread -> Thread?`
- `Post.votes`
- `Thread.votes`

Constraints:

- `@@unique([userId, postId])`
- `@@unique([userId, threadId])`

Service enforce thêm:

- `type = POST` thì bắt buộc có `postId`, không có `threadId`.
- `type = THREAD` thì bắt buộc có `threadId`, không có `postId`.
- Không cho request vừa có `postId` vừa có `threadId`.
- Không cho thiếu target.

### Migration

- Có migration mới: `backend/prisma/migrations/20260706000001_fix_vote_targets/migration.sql`.
- Tạo bằng `prisma migrate diff` vì `migrate dev` non-interactive dừng ở warning unique constraint.
- Migration đã apply thành công bằng `npx prisma migrate deploy`.
- Migration preserve dữ liệu cũ bằng cách:
  - Thêm `postId`, `threadId`, `updatedAt`.
  - Copy `targetId` sang `postId` khi `type = POST`.
  - Copy `targetId` sang `threadId` khi `type = THREAD`.
  - Sau đó mới drop `targetId`.
- Không dùng `prisma migrate reset`.
- Không drop database.

### File đã sửa/thêm

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260706000001_fix_vote_targets/migration.sql`
- `backend/libs/votes/src/dto/create-vote.dto.ts`
- `backend/libs/votes/src/controllers/votes.controller.ts`
- `backend/libs/votes/src/services/votes.service.ts`
- `backend/libs/votes/src/services/votes.service.spec.ts`
- `backend/libs/votes/src/index.ts`
- `backend/libs/posts/src/services/posts.service.ts`
- `backend/libs/threads/src/services/threads.service.ts`
- `PROJECT_PROGRESS_AUDIT.md`

### Endpoint vote hiện tại

- `POST /api/votes`
  - JWT required.
  - Body cho post:

```json
{
  "type": "POST",
  "postId": "<postId>",
  "value": 1
}
```

  - Body cho thread:

```json
{
  "type": "THREAD",
  "threadId": "<threadId>",
  "value": 1
}
```

- `DELETE /api/votes/:targetId/:type`
  - Giữ route cũ để không breaking.
  - `POST` map `targetId` thành `postId`.
  - `THREAD` map `targetId` thành `threadId`.

Response vote gồm:

- `voted`
- `value`
- `targetType`
- `targetId`
- `upvotes`
- `downvotes`
- `score`
- `total`

### Logic vote

- Vote lần đầu: create vote.
- Vote lại cùng value: toggle remove, trả `voted=false`, `value=0`.
- Vote ngược chiều: update value.
- Target không tồn tại: `NotFoundException`.
- Body sai target/type: `BadRequestException`.

### Posts/Threads response

- `GET /api/threads` và `GET /api/threads/:id` có thêm `voteStats`.
- `GET /api/posts` và `GET /api/posts/:id` có thêm `voteStats`.
- Vẫn giữ `_count` hiện có.
- Không trả password của author.

### Test

Unit test mới cho `VotesService` cover:

- Vote post lần đầu tạo vote.
- Vote cùng value lần 2 toggle remove.
- Vote ngược chiều update value.
- Vote thread hoạt động với `threadId`.
- POST thiếu `postId` bị `BadRequestException`.
- THREAD thiếu `threadId` bị `BadRequestException`.
- Target không tồn tại bị `NotFoundException`.

Smoke API local đã chạy:

- Login seed user: PASS.
- Vote thread up: PASS.
- Vote thread opposite/down: PASS.
- Delete thread vote: PASS.
- Vote post up: PASS.
- Vote post cùng value để toggle: PASS.
- Vote post down: PASS.
- Delete post vote: PASS.

### Lệnh verify

Pass:

- `npm ci`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate status`
- `npm run build`
- `npm test`
- `npx eslint "apps/**/*.ts" "libs/**/*.ts"`

Fail:

- Không còn lệnh Phase 2C nào fail.

### Rủi ro còn lại

- DB-level check constraint để đảm bảo đúng một trong `postId/threadId` chưa có vì Prisma schema không hỗ trợ trực tiếp check constraint portable trong model.
- Logic service đã enforce target/type; nếu có write ngoài service trực tiếp vào DB thì vẫn có thể tạo row không hợp lệ.
- Vote notification chưa implement.
- Frontend chưa tích hợp vote API.

### Bước tiếp theo đề xuất

1. Phase 2D: hoàn thiện Posts DTO/service để đồng bộ validation và permission với Threads.
2. Hoặc chuyển sang frontend tích hợp auth + threads + votes nếu muốn kiểm thử end-to-end UI sớm.
3. Cân nhắc thêm DB check constraint thủ công trong migration riêng nếu muốn khóa chặt invariant post/thread vote ở database.

## Phase 2D Posts/Replies Result

### Vấn đề trước khi sửa

- `PostsController` và `PostsService` còn nhận body/query bằng `any`, chưa có DTO riêng cho create/update/query posts.
- `create` chưa kiểm tra thread tồn tại, chưa kiểm tra thread locked, chưa validate parent reply thuộc cùng thread.
- `update` chỉ kiểm tra author, chưa cho ADMIN/MODERATOR sửa, chưa chặn user thường sửa trong thread locked.
- `delete` bị khóa ở controller cho ADMIN/MODERATOR; author không tự xóa được dù service không nhận user để kiểm tra ownership.
- Schema `Post` không có soft delete field, nên hard delete parent có replies có rủi ro phá cây reply hoặc fail vì constraint.
- Response đã không trả password nhờ select author public info, nhưng vote response mới chỉ có `voteStats`, chưa chuẩn hóa top-level `voteScore/upvotes/downvotes/currentUserVote`.
- List posts đã có filter `threadId` nhưng pagination default còn `limit=10`, chưa có filter `parentId/authorId/sort`.

### File đã sửa/thêm

- `backend/libs/posts/src/dto/create-post.dto.ts`
- `backend/libs/posts/src/dto/update-post.dto.ts`
- `backend/libs/posts/src/dto/query-posts.dto.ts`
- `backend/libs/posts/src/controllers/posts.controller.ts`
- `backend/libs/posts/src/services/posts.service.ts`
- `backend/libs/posts/src/services/posts.service.spec.ts`
- `backend/libs/posts/src/index.ts`
- `PROJECT_PROGRESS_AUDIT.md`

Không sửa Prisma schema và không tạo migration mới trong Phase 2D.
Không sửa frontend.
Không commit `.env`.

### DTO/validation đã thêm

- `CreatePostDto`: `content`, `threadId` required; `parentId` optional.
- `UpdatePostDto`: `content` optional nhưng không được rỗng nếu truyền lên.
- `QueryPostsDto`: `page`, `limit`, `threadId`, `parentId`, `authorId`, `sort`.
- `sort` chỉ nhận `newest` hoặc `oldest`.
- Default pagination: `page=1`, `limit=20`, max `limit=100`.

Service vẫn trim và kiểm tra content rỗng để tránh payload toàn khoảng trắng lọt qua validation.

### Endpoint hoạt động

- `GET /api/posts`
- `GET /api/posts/:id`
- `POST /api/posts`
- `PUT /api/posts/:id`
- `DELETE /api/posts/:id`

Read endpoints vẫn public.
Create/update/delete yêu cầu JWT.

### Auth/ownership/role

- Create kiểm tra thread tồn tại và tạo post bằng user hiện tại.
- Thread locked: user thường bị chặn; ADMIN/MODERATOR được phép create/update/delete.
- Update: chỉ author hoặc ADMIN/MODERATOR được sửa; user khác trả 403.
- Delete: chỉ author hoặc ADMIN/MODERATOR được xóa; user khác trả 403.
- Nếu post có replies, delete trả `BadRequestException` vì schema chưa có soft delete.

### Reply/nested reply

- `parentId` optional để tạo reply lồng nhau.
- Khi có `parentId`, service kiểm tra parent post tồn tại.
- Parent post phải thuộc cùng `threadId`; nếu khác thread trả `BadRequestException`.
- `findOne` include children cơ bản, author public info, `_count`, vote summary.
- `findAll` hỗ trợ filter `threadId`, `parentId`, `authorId`.
- Khi có `threadId`, sort mặc định là `oldest` để phù hợp thread detail.
- Nếu không có `threadId`, sort mặc định là `newest` cho list global.

### Vote score/currentUserVote

Post response hiện trả thêm top-level:

- `upvotes`
- `downvotes`
- `voteScore`
- `currentUserVote`

Vẫn giữ `voteStats` để không phá client/code cũ.
Vì read endpoints đang public và chưa có optional JWT guard, `currentUserVote` mặc định là `0` trên public read.
Các response create/update có truyền user hiện tại nên tính được `currentUserVote` nếu post đã có vote của user.

### Soft delete

Schema hiện chưa có soft delete field.
Phase 2D không đổi schema theo yêu cầu minimal change.
Delete hiện vẫn là hard delete cho post không có replies.
Rủi ro còn lại: nếu sản phẩm cần giữ lịch sử hội thoại, cần thêm soft delete ở phase riêng trước khi production.

### Test

Thêm unit test `PostsService` cover:

- Create post thành công khi thread tồn tại.
- Create reply với parent cùng thread.
- Create reply với parent khác thread bị `BadRequestException`.
- Update bởi author thành công.
- Update bởi user khác bị `ForbiddenException`.
- Delete bởi admin thành công.
- `findAll` có pagination và sort oldest theo thread detail.
- `findOne` post không tồn tại bị `NotFoundException`.

### Smoke test API local

Đã chạy backend local trên `http://localhost:3001` và test:

- Login `user@example.com`: PASS.
- Login `admin@example.com`: PASS.
- Register user phụ ngắn để test 403 ownership: PASS.
- `GET /api/threads?page=1&limit=20`: PASS.
- `POST /api/posts` tạo reply: PASS.
- `POST /api/posts` tạo nested reply: PASS.
- `GET /api/posts?threadId=<threadId>&page=1&limit=20`: PASS.
- `GET /api/posts/:id`: PASS.
- `PUT /api/posts/:id` bởi author: PASS.
- `PUT /api/posts/:id` bởi user khác: PASS, trả 403.
- `DELETE /api/posts/:id` parent đang có child: PASS, trả 400 rõ ràng.
- `DELETE /api/posts/:id` child bởi author: PASS.
- `DELETE /api/posts/:id` parent bởi admin sau khi xóa child: PASS.

### Lệnh verify

Pass:

- `npm ci`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate status`
- `npm run build`
- `npm test`
- `npx eslint "apps/**/*.ts" "libs/**/*.ts"`

Fail:

- Không còn lệnh Phase 2D nào fail.

### Rủi ro còn lại

- `currentUserVote` cho public read hiện luôn là `0`; muốn đúng theo token optional cần thêm optional JWT guard ở phase riêng.
- Chưa có soft delete nên delete post không replies là hard delete.
- Parent có replies đang bị chặn xóa; frontend cần hiển thị lỗi này hợp lý.
- Smoke test có tạo một user phụ local dev để kiểm tra 403, không ảnh hưởng schema/migration.
- `npm ci` vẫn báo vulnerability/deprecated dependency có sẵn; Phase 2D không nâng package để tránh scope creep.

### Bước tiếp theo đề xuất

1. Phase 2E: chuẩn hóa optional auth/currentUserVote cho read endpoints hoặc tích hợp frontend thread detail với posts/replies.
2. Thêm soft delete cho posts nếu muốn hỗ trợ xóa nội dung nhưng giữ cây hội thoại.
3. Chuẩn hóa response shape giữa Threads/Posts/Votes trước khi frontend dùng sâu.

## Phase 2E Optional Auth Read Result

### Đã thêm optional auth guard ở đâu

- Thêm `backend/libs/auth/src/guards/optional-jwt-auth.guard.ts`.
- Export guard trong `backend/libs/auth/src/index.ts`.
- Không sửa `JwtAuthGuard` bắt buộc hiện có.

Hành vi guard:

- Không có `Authorization` header: cho request đi tiếp, `req.user` không có.
- Có JWT hợp lệ: Passport JWT validate user và gán `req.user`.
- Token sai/expired: guard bắt lỗi và cho request đi tiếp như anonymous.

Lý do chọn anonymous cho token sai: các read endpoints là public, cách này tránh làm vỡ UI chỉ vì client giữ token cũ. Protected endpoints vẫn dùng `JwtAuthGuard` nên không bị nới quyền.

### Endpoint dùng optional auth

Threads:

- `GET /api/threads`
- `GET /api/threads/:id`

Posts:

- `GET /api/posts`
- `GET /api/posts/:id`

Các endpoint protected vẫn dùng `JwtAuthGuard`:

- `POST /api/threads`
- `PATCH /api/threads/:id`
- `DELETE /api/threads/:id`
- `POST /api/posts`
- `PUT /api/posts/:id`
- `DELETE /api/posts/:id`
- Vote endpoints protected hiện có.

### currentUserVote cho Threads

Đã hoạt động.

Thread response hiện có top-level:

- `upvotes`
- `downvotes`
- `voteScore`
- `currentUserVote`
- `voteStats` giữ tương thích cũ.

`currentUserVote`:

- `1` nếu user đã upvote thread.
- `-1` nếu user đã downvote thread.
- `0` nếu anonymous hoặc user chưa vote.

`GET /api/threads/:id` cũng thêm vote summary cho posts được include trong thread detail khi có dữ liệu votes.

### currentUserVote cho Posts

Đã hoạt động.

Post response hiện có top-level:

- `upvotes`
- `downvotes`
- `voteScore`
- `currentUserVote`
- `voteStats` giữ tương thích cũ.

`currentUserVote`:

- `1` nếu user đã upvote post.
- `-1` nếu user đã downvote post.
- `0` nếu anonymous hoặc user chưa vote.

### File đã sửa/thêm

- `backend/libs/auth/src/guards/optional-jwt-auth.guard.ts`
- `backend/libs/auth/src/index.ts`
- `backend/libs/threads/src/controllers/threads.controller.ts`
- `backend/libs/threads/src/services/threads.service.ts`
- `backend/libs/threads/src/services/threads.service.spec.ts`
- `backend/libs/posts/src/controllers/posts.controller.ts`
- `backend/libs/posts/src/services/posts.service.spec.ts`
- `PROJECT_PROGRESS_AUDIT.md`

Không sửa Prisma schema.
Không tạo migration mới.
Không sửa frontend.
Không commit `.env`.

### Test

Unit test cập nhật:

- Threads anonymous read trả `currentUserVote = 0`.
- Threads read có `currentUserId` trả đúng vote của user.
- Posts anonymous read trả `currentUserVote = 0`.
- Posts read có `currentUserId` trả đúng vote của user.

### Smoke test API local

Đã chạy backend local trên `http://localhost:3001` và test:

- Login `user@example.com`: PASS.
- Public `GET /api/threads`: PASS, `currentUserVote = 0`.
- Public `GET /api/threads/:id`: PASS, `currentUserVote = 0`.
- Public `GET /api/posts?threadId=<threadId>`: PASS, `currentUserVote = 0`.
- Public `GET /api/posts/:id`: PASS, `currentUserVote = 0`.
- `GET /api/threads` với token sai: PASS, status 200, xử lý anonymous.
- `POST /api/posts` không token: PASS, status 401.
- Vote thread bằng user seed: PASS.
- Vote post bằng user seed: PASS.
- Authenticated `GET /api/threads`: PASS, `currentUserVote = 1`.
- Authenticated `GET /api/threads/:id`: PASS, `currentUserVote = 1`.
- Authenticated `GET /api/posts?threadId=<threadId>`: PASS, `currentUserVote = 1`.
- Authenticated `GET /api/posts/:id`: PASS, `currentUserVote = 1`.
- Public read lại sau khi vote: PASS, `currentUserVote = 0`.

### Lệnh verify

Pass:

- `npm ci`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate status`
- `npm run build`
- `npm test`
- `npx eslint "apps/**/*.ts" "libs/**/*.ts"`

Fail:

- Không còn lệnh Phase 2E nào fail.

### Rủi ro còn lại

- Optional guard hiện cố ý coi token sai/expired là anonymous trên read endpoints. Nếu sau này cần phân biệt token sai để báo logout UI, frontend/backend nên thống nhất contract riêng.
- Threads/Posts list đang tính vote summary từ votes include. Dễ hiểu và không N+1, nhưng với thread/post có rất nhiều votes thì cần tối ưu aggregate ở phase performance.
- Smoke test có để lại vote local dev của seed user trên thread/post được test; không ảnh hưởng code/migration.
- `npm ci` vẫn báo vulnerability/deprecated dependency có sẵn; Phase 2E không nâng package để tránh scope creep.

### Bước tiếp theo đề xuất

1. Phase 2F: tích hợp frontend thread detail với posts/replies/votes/currentUserVote.
2. Hoặc thêm soft delete cho posts nếu muốn xử lý xóa reply giống forum thật.
3. Tối ưu vote aggregate nếu dữ liệu lớn.

## Phase 3A Frontend API/Auth Foundation Result

### File đã sửa/thêm

- `frontend/.env.example`
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/src/main.tsx`
- `frontend/src/types/auth.ts`
- `frontend/src/services/apiClient.ts`
- `frontend/src/services/authService.ts`
- `frontend/src/services/tokenStorage.ts`
- `frontend/src/stores/authContextValue.ts`
- `frontend/src/stores/AuthContext.tsx`
- `frontend/src/stores/useAuth.ts`
- `frontend/src/components/Header.tsx`
- `frontend/src/components/LoginModal.tsx`
- `frontend/src/pages/RegisterPage.tsx`
- `PROJECT_PROGRESS_AUDIT.md`

Không sửa backend code trong Phase 3A.
Không commit `.env` chứa config local/secret.

### Audit frontend trước khi sửa

- Frontend dùng React + Vite và `react-router-dom` v7.6.2.
- Trước Phase 3A chưa có `frontend/src/services`, `frontend/src/stores`, `frontend/src/types`.
- Chưa có Axios trong dependencies.
- `LoginModal` là form tĩnh, chưa submit backend.
- `RegisterPage` là form tĩnh, chưa submit backend.
- `Header` luôn hiển thị Log in/Register, chưa biết trạng thái auth.

### API client

Tạo `frontend/src/services/apiClient.ts`.

- Dùng Axios.
- Base URL lấy từ `import.meta.env.VITE_API_BASE_URL`.
- Fallback: `http://localhost:3000/api`.
- `frontend/.env.example` có:
  - `VITE_API_BASE_URL=http://localhost:3000/api`
- Request interceptor tự gắn `Authorization: Bearer <accessToken>` nếu localStorage có token.
- Response interceptor gặp 401 thì clear token local và phát event `auth:unauthorized` để UI logout.
- Không hard-code token trong source code.

### Auth service

Tạo `frontend/src/services/authService.ts`.

Hỗ trợ backend endpoints thật:

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `POST /auth/logout`

Response login map theo backend thật: `{ accessToken, user }`.
Register backend hiện trả `{ message, user }`, chưa trả token; frontend gọi register xong sẽ auto-login bằng email/password vừa nhập.

### Auth types

Tạo `frontend/src/types/auth.ts`.

Có type:

- `UserRole`
- `User`
- `LoginRequest`
- `RegisterRequest`
- `AuthResponse`
- `RegisterResponse`
- `AuthState`

`User` không chứa password.

### AuthProvider/AuthContext

Tạo nền auth bằng Context API, không thêm state management library mới.

- `frontend/src/stores/authContextValue.ts`: context value type + context.
- `frontend/src/stores/AuthContext.tsx`: `AuthProvider`.
- `frontend/src/stores/useAuth.ts`: hook `useAuth`.

AuthProvider quản lý:

- `user`
- `accessToken`
- `isAuthenticated`
- `isLoading`
- `login`
- `register`
- `logout`
- `loadMe`

Khi app khởi động:

- Nếu có token trong localStorage, gọi `/auth/me`.
- Nếu `/auth/me` fail, clear token/user.

### Token storage

Tạo `frontend/src/services/tokenStorage.ts`.

- Access token lưu ở localStorage key `forum_access_token` cho môi trường dev.
- Không lưu password.
- Chưa implement refresh token vì backend chưa có endpoint refresh.

### Bọc app

Cập nhật `frontend/src/main.tsx` để bọc toàn app bằng `AuthProvider` phía ngoài `RouterProvider`.

### LoginModal

Cập nhật `frontend/src/components/LoginModal.tsx`.

- Form có controlled `email/password`.
- Submit gọi `login` từ auth context.
- Có loading state.
- Có error message từ backend.
- Login thành công thì đóng modal.
- Không reload page.
- Không hard-code user.

Seed user có thể dùng khi backend chạy:

- `admin@example.com` / `Admin@123456`
- `user@example.com` / `User@123456`

### RegisterPage

Cập nhật `frontend/src/pages/RegisterPage.tsx`.

- Form có controlled `username/email/password/date`.
- Validate tối thiểu username/email/password không rỗng.
- Submit gọi backend `POST /auth/register`.
- Register thành công thì auto-login bằng email/password vừa nhập.
- Auto-login thành công thì redirect `/`.
- Nếu register thành công nhưng auto-login fail thì hiển thị success và yêu cầu login lại.

### Header

Cập nhật `frontend/src/components/Header.tsx`.

- Chưa login: hiển thị Log in/Register như trước.
- Đã login: hiển thị username hoặc email và nút Logout.
- Logout clear token/user qua auth context.
- Desktop và mobile đều dùng trạng thái auth.

### Protected route

Chưa thêm `ProtectedRoute` vì frontend hiện chưa có page protected rõ ràng.
TODO cho phase sau khi có Create Thread/Profile hoặc trang cần bắt login.

### Lệnh verify frontend

Pass:

- `npm ci`
- `npm run build`
- `npm run lint`

Ghi chú:

- `npm ci` báo 13 vulnerabilities và deprecated `heroicons-react` có sẵn/hiện tại từ dependency tree. Phase 3A không nâng package ngoài việc thêm `axios` để tránh scope creep.
- `npm run build` có Node deprecation warning `DEP0205` từ toolchain, build vẫn pass.

Fail:

- Không còn lệnh frontend nào fail.

### Manual test

Chưa chạy browser manual test end-to-end vì backend local không đang chạy ở port `3000` hoặc `3001`, và `backend/node_modules` đã được dọn từ phase trước.

Đã verify bằng build/lint TypeScript rằng:

- Login/Register gọi service thật.
- AuthProvider bọc app.
- Header đọc trạng thái auth.
- Axios interceptor gắn token tự động.

### Rủi ro còn lại

- Access token đang lưu localStorage, chấp nhận cho dev phase; production nên cân nhắc chiến lược token/cookie chặt hơn.
- Chưa có refresh token flow vì backend chưa có endpoint refresh.
- Nếu backend thực tế chạy `3001` thay vì `3000`, cần tạo `frontend/.env.local` với `VITE_API_BASE_URL=http://localhost:3001/api`. File `.env.local` không nên commit.
- Chưa có protected route vì chưa có trang cần bảo vệ trong frontend hiện tại.
- UI auth đã nối logic nhưng chưa được kiểm thử qua browser do backend local chưa chạy.

### Bước tiếp theo đề xuất

1. Phase 3B: tích hợp frontend Home/Thread list với backend categories/threads thật.
2. Phase 3C: làm Thread detail dùng posts/replies/votes/currentUserVote.
3. Thêm ProtectedRoute khi có Create Thread/Profile hoặc route cần login.

## Phase 3B Frontend Forum Read Pages Result

### File đã sửa/thêm

- `frontend/src/types/forum.ts`
- `frontend/src/services/categoryService.ts`
- `frontend/src/services/threadService.ts`
- `frontend/src/components/ForumBlock.tsx`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/ThreadsPage.tsx`
- `frontend/src/router/index.tsx`
- `frontend/src/components/Header.tsx`
- `PROJECT_PROGRESS_AUDIT.md`

Không sửa backend code trong Phase 3B.
Không commit `.env.local`.

### HomePage trước khi sửa

- `frontend/src/pages/HomePage.tsx` chứa `forumData` hard-code ngay trong file.
- Các block forum, số thread/post và last post đều là dữ liệu tĩnh.
- Sidebar Top Chủ đề cũng là hard-code.

### HomePage sau khi sửa

HomePage hiện gọi API thật khi load trang:

- `GET /categories`
- `GET /threads?page=1&limit=20`

Dữ liệu threads được group theo category trả từ backend.
Nếu có thread không map được category, UI đưa vào nhóm `Other Threads`.
Sidebar Top Chủ đề lấy từ threads API thay vì hard-code.

### Category service

Tạo `frontend/src/services/categoryService.ts`.

- `categoryService.getCategories()` gọi `GET /categories`.
- Response type là `Category[]` theo backend Prisma category response.

### Thread service

Tạo `frontend/src/services/threadService.ts`.

- `threadService.getThreads(params?)` gọi `GET /threads`.
- Hỗ trợ params: `page`, `limit`, `categoryId`, `categorySlug`, `search`, `authorId`, `isPinned`.
- Response type là `PaginatedResponse<Thread>`.

### Types

Tạo `frontend/src/types/forum.ts`.

Có type:

- `Category`
- `Thread`
- `ThreadAuthor`
- `ThreadCategory`
- `PaginationMeta`
- `PaginatedResponse<T>`
- `ThreadQueryParams`

Author type không chứa password.

### ForumBlock

Cập nhật `frontend/src/components/ForumBlock.tsx`.

- Export `ForumRow` type.
- Hỗ trợ `href` để thread title link tới `/threads/:id`.
- Có empty row `No threads yet.` khi category chưa có thread.
- Giữ layout table cũ để tránh refactor UI lớn.

### /threads page

Đã tạo `frontend/src/pages/ThreadsPage.tsx` và thêm route `/threads` trong `frontend/src/router/index.tsx`.

Trang `/threads`:

- Gọi `GET /threads?page=<page>&limit=20`.
- Hiển thị title, category, author, createdAt, posts count, voteScore, currentUserVote.
- Có loading/error/empty state.
- Có pagination Previous/Next đơn giản nếu backend trả nhiều page.
- Thread item link tới `/threads/:id` để chuẩn bị cho Phase 3C, chưa implement detail page trong Phase 3B.

### Header/routing

- Desktop `Forums` link chuyển tới `/threads` cho nhất quán với mobile.
- Logo/root vẫn mở HomePage.
- Không thêm route ngoài `/threads`.

### Loading/error/empty state

Đã có:

- HomePage loading state.
- HomePage error state khi API lỗi.
- HomePage empty state khi không có category/thread.
- ForumBlock empty row cho category không có thread.
- ThreadsPage loading/error/empty state.

### Backend port/env

- Backend code dùng `process.env.PORT || 3001`.
- Local `backend/.env` hiện có `PORT=3001`.
- `frontend/.env.example` vẫn giữ `VITE_API_BASE_URL=http://localhost:3000/api` theo Phase 3A/request.
- Để manual test local với backend port thật, đã tạo `frontend/.env.local` với `VITE_API_BASE_URL=http://localhost:3001/api` nhưng không commit.

### Manual smoke test

Đã chạy backend local tạm trên `http://localhost:3001` và frontend Vite tạm trên `http://127.0.0.1:5173`.

Backend API smoke:

- `GET http://localhost:3001/api/categories`: PASS, trả 3 categories.
- `GET http://localhost:3001/api/threads?page=1&limit=20`: PASS, trả 1 thread seed.
- Thread seed có `voteScore`: PASS.

Frontend route smoke:

- `GET http://127.0.0.1:5173`: PASS, status 200.
- `GET http://127.0.0.1:5173/threads`: PASS, status 200.

Sau smoke test đã tắt backend/frontend server tạm và xóa log tạm.

### Lệnh verify frontend

Pass:

- `npm ci`
- `npm run build`
- `npm run lint`

Ghi chú:

- `npm ci` vẫn báo 13 vulnerabilities và deprecated `heroicons-react` từ dependency tree hiện tại.
- `npm run build` vẫn có Node deprecation warning `DEP0205` từ toolchain, build pass.

Fail:

- Không còn lệnh frontend nào fail.

### Rủi ro còn lại

- `frontend/.env.example` đang để port 3000 theo request, nhưng local backend repo hiện chạy port 3001. Dev local cần `.env.local` không commit nếu dùng port 3001.
- `/threads/:id` link đã chuẩn bị nhưng detail page chưa implement theo đúng scope Phase 3B.
- HomePage group thread theo category từ page đầu tiên `limit=20`; nếu dữ liệu lớn cần paging/filter category tốt hơn ở phase sau.
- Chưa có search/filter UI cho ThreadList dù service đã hỗ trợ params backend.

### Bước tiếp theo đề xuất

1. Phase 3C: implement Thread detail page dùng `GET /threads/:id`, posts/replies và currentUserVote.
2. Phase 3D: thêm Create Thread UI protected bằng auth.
3. Sau đó mới làm Vote UI và Reply form để hoàn thiện luồng forum thật.

## Phase 3C Frontend Thread Detail Result

### File đã sửa/thêm

- `frontend/src/types/forum.ts`
- `frontend/src/services/threadService.ts`
- `frontend/src/services/postService.ts`
- `frontend/src/pages/ThreadDetailPage.tsx`
- `frontend/src/router/index.tsx`
- `PROJECT_PROGRESS_AUDIT.md`

Không sửa backend code trong Phase 3C.
Không commit `.env.local`.
Không thêm Create Thread, Reply form, Vote action, Edit/Delete UI.

### Route `/threads/:id`

Đã thêm route trong `frontend/src/router/index.tsx`:

- `/threads/:id` -> `ThreadDetailPage`

Các link từ HomePage/ThreadsPage đã dùng sẵn dạng `/threads/:id`, nên route mới mở đúng detail page.

### Thread detail API

Cập nhật `frontend/src/services/threadService.ts`:

- `threadService.getThreadById(id)` gọi `GET /threads/:id`.

`ThreadDetailPage` đọc `id` từ `useParams()` và gọi API thật.

### Posts/replies API

Tạo `frontend/src/services/postService.ts`:

- `postService.getPosts(params)` gọi `GET /posts`.

Thread detail page gọi:

- `GET /posts?threadId=<id>&page=1&limit=100&sort=oldest`

Phase này chỉ đọc dữ liệu, không thêm create/update/delete post.

### Types

Cập nhật `frontend/src/types/forum.ts` thêm:

- `VoteSummary`
- `ThreadDetail`
- `Post`
- `PostAuthor`
- `PostThread`
- `PostQueryParams`

Author type không chứa password.
Types map theo backend response hiện có: author/thread public info, `_count`, `upvotes`, `downvotes`, `voteScore`, `currentUserVote`, `voteStats`.

### ThreadDetailPage

Tạo `frontend/src/pages/ThreadDetailPage.tsx`.

Hiển thị thread:

- title
- category
- author
- createdAt
- posts count
- viewCount
- locked/pinned state nếu có
- content
- voteScore read-only
- upvotes/downvotes read-only
- currentUserVote read-only

Hiển thị posts:

- content
- author
- createdAt
- voteScore read-only
- upvotes/downvotes read-only
- currentUserVote read-only

Không có nút vote/reply/edit/delete action trong Phase 3C.

### Nested replies

Backend `GET /posts` trả flat list có `parentId`.
Frontend dựng cây replies trong `ThreadDetailPage` bằng `parentId`:

- Post không có `parentId` hoặc parent không có trong page hiện tại -> root post.
- Post có `parentId` khớp post khác -> render lồng dưới parent.
- Nested replies render recursive với left border và indent nhẹ.

Giới hạn hiện tại: chỉ dựng từ tối đa 100 posts đầu tiên theo query Phase 3C.

### Loading/error/empty state

Đã có:

- Loading state khi đang gọi thread/posts API.
- Error state khi API lỗi.
- Empty state khi không có thread hoặc không có posts.
- Back link về `/threads`.

### Optional auth interaction

API client Phase 3A tự gắn Bearer token nếu có `forum_access_token`.
Vì read endpoints backend có optional auth:

- Không login vẫn xem detail được.
- Có login thì backend có thể trả `currentUserVote` đúng nếu user đã vote trước đó.
- Phase 3C chỉ hiển thị read-only, chưa làm vote action.

### Manual smoke test

Đã chạy backend local tạm trên `http://localhost:3001` và frontend Vite tạm trên `http://127.0.0.1:5173`.

Kết quả:

- `GET /api/threads?page=1&limit=20`: PASS, lấy được thread seed.
- `GET /api/threads/:id`: PASS, title `Welcome to Forum Microservices`.
- Thread detail có `voteScore`: PASS.
- Thread detail anonymous có `currentUserVote = 0`: PASS.
- `GET /api/posts?threadId=<id>&page=1&limit=100&sort=oldest`: PASS, trả 2 posts.
- Post đầu tiên có `voteScore`: PASS.
- `GET http://127.0.0.1:5173/threads/<id>`: PASS, status 200.

Sau smoke test đã tắt backend/frontend server tạm và xóa log tạm.

### Lệnh verify frontend

Pass:

- `npm ci`
- `npm run build`
- `npm run lint`

Ghi chú:

- `npm ci` vẫn báo 13 vulnerabilities và deprecated `heroicons-react` từ dependency tree hiện tại.
- `npm run build` vẫn có Node deprecation warning `DEP0205` từ toolchain, build pass.

Fail:

- Không còn lệnh frontend nào fail.

### Rủi ro còn lại

- Thread detail đang fetch posts `limit=100`; thread dài cần pagination hoặc lazy loading ở phase sau.
- Nested replies dựng từ page hiện tại, nếu parent/child nằm ngoài 100 posts đầu thì cây có thể chưa đầy đủ.
- `/threads/:id` hiện read-only; Reply form, Vote action, Edit/Delete sẽ làm ở phase sau.
- UI chưa render rich text/markdown; content đang hiển thị plain text với line breaks.

### Bước tiếp theo đề xuất

1. Phase 3D: thêm Reply form protected bằng auth và refresh posts sau khi reply.
2. Phase 3E: thêm Vote UI cho thread/post, dùng API votes đã có.
3. Sau đó thêm Create Thread UI và protected route nếu cần.
