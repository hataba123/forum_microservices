# 🏛️ Forum VOZ Clone - Backend

> Backend API cho Forum VOZ Clone sử dụng NestJS Modular Monolith Architecture

## 📋 Tổng quan

Đây là backend API cho dự án Forum VOZ Clone, được xây dựng với:

- **Framework**: NestJS (Modular Monolith)
- **Database**: PostgreSQL (Users, Auth, Votes) + MongoDB (Threads, Posts, Notifications)
- **ORM**: Prisma (PostgreSQL) + Mongoose (MongoDB)
- **Authentication**: JWT + HTTP-only Cookies
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI

## 🏗️ Kiến trúc

```
backend/
├── apps/
│   └── api-gateway/          # Entry point chính
├── libs/                     # Shared modules
│   ├── auth/                # Authentication
│   ├── users/               # User management
│   ├── categories/          # Category management (TODO)
│   ├── threads/             # Thread management (TODO)
│   ├── posts/               # Post management (TODO)
│   ├── votes/               # Voting system (TODO)
│   ├── notifications/       # Notifications (TODO)
│   ├── media/               # File upload (TODO)
│   └── shared/              # Shared utilities
├── prisma/                  # Database schema
└── docker-compose.yml       # Development databases
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ và npm/yarn
- Docker & Docker Compose
- PostgreSQL 15+ (hoặc dùng Docker)
- MongoDB 6+ (hoặc dùng Docker)

### 1. Clone và cài đặt

```bash
# Clone repository (nếu chưa có)
git clone <repo-url>
cd backend

# Cài đặt dependencies
npm install
```

### 2. Setup môi trường

```bash
# Copy file environment
cp .env.example .env

# Chỉnh sửa .env với thông tin database của bạn
```

### 3. Khởi động databases

```bash
# Start PostgreSQL, MongoDB, Redis với Docker
docker-compose up -d

# Kiểm tra trạng thái
docker-compose ps
```

### 4. Setup database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run migrate:dev

# (Optional) Xem database với Prisma Studio
npm run db:studio
```

### 5. Khởi động ứng dụng

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## 📚 API Documentation

Sau khi khởi động server, truy cập:

- **API Docs**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/health

### Database Management

- **pgAdmin**: http://localhost:5050 (admin@example.com / admin)
- **Mongo Express**: http://localhost:8081 (admin / admin)
- **Prisma Studio**: http://localhost:5555

## 🧪 Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## 📦 Modules đã hoàn thành

### ✅ Auth Module
- [x] Đăng ký tài khoản
- [x] Đăng nhập
- [x] JWT Authentication
- [x] Guards và Decorators

### ✅ Users Module
- [x] CRUD operations
- [x] Role-based access
- [x] Pagination

### ✅ Shared Module
- [x] Prisma service
- [x] Common utilities
- [x] Interfaces và DTOs

## 🚧 Modules đang phát triển

### 🔄 Categories Module
- [ ] CRUD categories
- [ ] Hierarchy support
- [ ] Permissions

### 🔄 Threads Module
- [ ] Create/edit threads
- [ ] Sticky threads
- [ ] Thread locking
- [ ] Search và filter

### 🔄 Posts Module
- [ ] Reply to threads
- [ ] Quote posts
- [ ] Edit/delete posts
- [ ] Rich text support

### 🔄 Votes Module
- [ ] Upvote/downvote
- [ ] Vote tracking
- [ ] Anti-spam

### 🔄 Notifications Module
- [ ] Real-time notifications
- [ ] Email notifications
- [ ] Push notifications

### 🔄 Media Module
- [ ] File upload
- [ ] Image processing
- [ ] Avatar management

## 🔧 Scripts có sẵn

```bash
# Development
npm run start:dev      # Start với hot reload
npm run start:debug    # Start với debugger

# Build
npm run build          # Build production
npm run start:prod     # Start production

# Database
npm run migrate:dev    # Run migrations (dev)
npm run migrate:deploy # Run migrations (prod)
npm run db:generate    # Generate Prisma client
npm run db:studio      # Open Prisma Studio

# Code quality
npm run lint           # ESLint check
npm run format         # Prettier format
```

## 🌐 Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."
MONGODB_URL="mongodb://..."

# JWT
JWT_SECRET="your-secret"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

# App
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Reset volumes (xóa data)
docker-compose down -v
```

## 📝 Development Guidelines

### Code Style
- Sử dụng TypeScript strict mode
- ESLint + Prettier cho formatting
- Comment tiếng Việt cho functions và classes
- Tuân theo NestJS conventions

### Database
- Prisma cho PostgreSQL
- Mongoose cho MongoDB
- Migrations cho schema changes
- Indexing cho performance

### API Design
- RESTful endpoints
- Consistent response format
- Proper HTTP status codes
- Swagger documentation

## 🤝 Contributing

1. Tạo feature branch: `git checkout -b feature/new-feature`
2. Commit changes: `git commit -m 'feat: add new feature'`
3. Push branch: `git push origin feature/new-feature`
4. Tạo Pull Request

## 📄 License

MIT License - xem [LICENSE](LICENSE) file.

---

🛠️ **Happy Coding!** Nếu có vấn đề, tạo issue hoặc liên hệ team.
