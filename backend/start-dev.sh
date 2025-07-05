#!/bin/bash

# Script khởi động development environment

echo "🚀 Starting Forum VOZ Backend Development Environment..."

# Kiểm tra Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker chưa được cài đặt"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose chưa được cài đặt"
    exit 1
fi

# Kiểm tra Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js chưa được cài đặt"
    exit 1
fi

# Kiểm tra file .env
if [ ! -f .env ]; then
    echo "📋 Tạo file .env từ .env.example..."
    cp .env.example .env
    echo "⚠️  Vui lòng chỉnh sửa file .env với cấu hình phù hợp"
fi

# Cài đặt dependencies
echo "📦 Cài đặt dependencies..."
npm install

# Khởi động databases
echo "🗄️ Khởi động databases..."
docker-compose up -d postgres mongodb redis

# Đợi database khởi động
echo "⏳ Đợi database khởi động..."
sleep 10

# Generate Prisma client
echo "🔧 Generate Prisma client..."
npx prisma generate

# Run migrations
echo "🗄️ Chạy database migrations..."
npx prisma migrate dev --name init

# Khởi động ứng dụng
echo "🎯 Khởi động API Gateway..."
npm run start:dev
