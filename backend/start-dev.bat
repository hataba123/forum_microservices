@echo off
REM Script khởi động development environment cho Windows

echo 🚀 Starting Forum VOZ Backend Development Environment...

REM Kiểm tra Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker chưa được cài đặt
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose chưa được cài đặt
    exit /b 1
)

REM Kiểm tra Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js chưa được cài đặt
    exit /b 1
)

REM Kiểm tra file .env
if not exist .env (
    echo 📋 Tạo file .env từ .env.example...
    copy .env.example .env
    echo ⚠️ Vui lòng chỉnh sửa file .env với cấu hình phù hợp
)

REM Cài đặt dependencies
echo 📦 Cài đặt dependencies...
npm install

REM Khởi động databases
echo 🗄️ Khởi động databases...
docker-compose up -d postgres mongodb redis

REM Đợi database khởi động
echo ⏳ Đợi database khởi động...
timeout /t 10 /nobreak >nul

REM Generate Prisma client
echo 🔧 Generate Prisma client...
npx prisma generate

REM Run migrations
echo 🗄️ Chạy database migrations...
npx prisma migrate dev --name init

REM Khởi động ứng dụng
echo 🎯 Khởi động API Gateway...
npm run start:dev
