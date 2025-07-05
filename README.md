# Forum Microservices

Dự án forum sử dụng kiến trúc microservices với NestJS (Backend) và React (Frontend).

## 🏗️ Kiến trúc

### Backend (NestJS)

- **API Gateway**: Điểm truy cập chính cho tất cả các request
- **Microservices**:
  - **Auth**: Xác thực và phân quyền người dùng
  - **Users**: Quản lý thông tin người dùng
  - **Categories**: Quản lý danh mục forum
  - **Threads**: Quản lý chủ đề thảo luận
  - **Posts**: Quản lý bài viết trong thread
  - **Votes**: Hệ thống vote up/down
  - **Media**: Upload và quản lý file media
  - **Notifications**: Thông báo người dùng

### Frontend (React + Vite)

- **Modern UI**: Giao diện người dùng hiện đại
- **TypeScript**: Type safety và developer experience
- **Responsive Design**: Tương thích đa thiết bị

## 🛠️ Công nghệ sử dụng

### Backend

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL với Prisma ORM
- **Authentication**: JWT + Guards
- **API Documentation**: Swagger/OpenAPI
- **File Upload**: Multer
- **Validation**: class-validator, class-transformer

### Frontend

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS Modules / Tailwind CSS
- **State Management**: Context API / Zustand
- **HTTP Client**: Axios

## 📁 Cấu trúc dự án

```
forum-microservices/
├── backend/
│   ├── apps/
│   │   └── api-gateway/          # API Gateway chính
│   ├── libs/
│   │   ├── auth/                 # Module xác thực
│   │   ├── users/                # Module người dùng
│   │   ├── categories/           # Module danh mục
│   │   ├── threads/              # Module chủ đề
│   │   ├── posts/                # Module bài viết
│   │   ├── votes/                # Module voting
│   │   ├── media/                # Module media
│   │   ├── notifications/        # Module thông báo
│   │   └── shared/               # Utilities chung
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/           # UI Components
│   │   ├── pages/                # Page components
│   │   ├── features/             # Feature modules
│   │   ├── services/             # API services
│   │   ├── stores/               # State management
│   │   ├── hooks/                # Custom hooks
│   │   └── types/                # TypeScript types
│   └── package.json
└── README.md
```

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống

- Node.js >= 18
- PostgreSQL
- npm hoặc yarn

### Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Setup database
cp .env.example .env
# Cập nhật DATABASE_URL và các biến môi trường khác

# Chạy Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Chạy development server
npm run start:dev
```

### Frontend

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

## 📝 API Documentation

Sau khi chạy backend, truy cập Swagger UI tại:

```
http://localhost:3000/api/docs
```

## 🔒 Authentication & Authorization

### Roles

- **USER**: Người dùng thường
- **MODERATOR**: Người điều hành
- **ADMIN**: Quản trị viên

### Endpoints chính

- `POST /auth/register` - Đăng ký tài khoản
- `POST /auth/login` - Đăng nhập
- `GET /categories` - Lấy danh sách danh mục
- `GET /threads` - Lấy danh sách thread
- `POST /posts` - Tạo bài viết mới

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📊 Database Schema

### Entities chính

- **User**: Thông tin người dùng
- **Category**: Danh mục forum
- **Thread**: Chủ đề thảo luận
- **Post**: Bài viết trong thread
- **Vote**: Vote cho post/thread
- **Media**: File upload
- **Notification**: Thông báo

## 🔧 Development

### Coding Standards

- ESLint + Prettier
- TypeScript strict mode
- Comment bằng tiếng Việt
- Tuân theo NestJS best practices
- Clean Architecture patterns

### Git Workflow

```bash
# Tạo feature branch
git checkout -b feature/feature-name

# Commit changes
git commit -m "feat: mô tả tính năng"

# Push và tạo PR
git push origin feature/feature-name
```

## 🚧 Roadmap

- [ ] Real-time notifications với WebSocket
- [ ] Search functionality với Elasticsearch
- [ ] Caching với Redis
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Mobile app với React Native

## 👥 Contributing

1. Fork dự án
2. Tạo feature branch
3. Commit changes
4. Push và tạo Pull Request

## 📄 License

MIT License

## 📞 Contact

- **Developer**: [Your Name]
- **Email**: [your.email@example.com]
- **GitHub**: [hataba123](https://github.com/hataba123)
