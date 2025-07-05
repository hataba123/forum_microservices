# 🔧 Setup & Troubleshooting Guide

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Node.js 18+ và npm
node --version
npm --version

# Docker (optional nhưng recommended)
docker --version
docker compose version

# Git
git --version
```

### 2. Clone & Install
```bash
git clone <your-repo-url>
cd forum-microservices

# Backend setup
cd backend
npm install --legacy-peer-deps

# Frontend setup  
cd ../frontend
npm install
```

### 3. Environment Setup
```bash
# Backend
cd backend
cp .env.example .env

# Chỉnh sửa .env theo môi trường của bạn:
# - DATABASE_URL (nếu có PostgreSQL local)
# - JWT_SECRET 
# - RABBITMQ_URL (nếu có RabbitMQ)
# - FRONTEND_URL
```

### 4. Database Setup (Optional)
```bash
# Nếu có Docker:
docker compose up -d postgres redis

# Nếu có PostgreSQL local:
createdb forum_db

# Run migrations
npx prisma migrate dev
npx prisma generate
```

### 5. Start Development
```bash
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Frontend  
cd frontend
npm run dev
```

## 🔍 Troubleshooting

### ❌ Build Errors

#### 1. TypeScript Compilation Errors
```bash
# Problem: Missing dependencies
Solution: npm install --legacy-peer-deps

# Problem: Prisma client not generated  
Solution: npx prisma generate

# Problem: TypeScript config
Solution: npm run build
```

#### 2. Module Resolution Issues
```bash
# Problem: Cannot resolve '@libs/shared'
Solution: 
1. Check tsconfig.json paths
2. Run: npm run build
3. Restart VS Code TypeScript service
```

#### 3. RabbitMQ Type Conflicts
```bash
# Current status: RabbitMQService commented out
# Temporary workaround: Using direct processing

# To fix:
1. npm uninstall amqplib @types/amqplib  
2. npm install amqplib@^0.10.3 @types/amqplib@^0.10.1 --legacy-peer-deps
3. Or use @golevelup/nestjs-rabbitmq package
```

### 🗄️ Database Issues

#### 1. No Database Connection
```bash
# Check if PostgreSQL is running
# Option 1: Docker
docker compose up -d postgres

# Option 2: Local PostgreSQL
sudo service postgresql start  # Linux
brew services start postgresql # Mac
```

#### 2. Migration Errors
```bash
# Reset migrations (careful!)
npx prisma migrate reset

# Manual migration
npx prisma db push

# Generate client
npx prisma generate
```

#### 3. Prisma Client Issues
```bash
# Regenerate Prisma client
rm -rf node_modules/.prisma
npx prisma generate

# Clear cache
rm -rf node_modules
npm install --legacy-peer-deps
```

### 🐰 RabbitMQ Issues

#### 1. RabbitMQ Not Available
```bash
# Start with Docker
docker compose up -d rabbitmq

# Check RabbitMQ Management UI
# URL: http://localhost:15672
# User: admin / Password: admin123

# Local RabbitMQ (if installed)
sudo systemctl start rabbitmq-server # Linux
brew services start rabbitmq # Mac
```

#### 2. Connection Refused
```bash
# Check RabbitMQ status
docker compose ps
docker compose logs rabbitmq

# Check if port is available
netstat -tulpn | grep 5672  # Linux
netstat -an | findstr 5672  # Windows
```

### 🌐 WebSocket Issues

#### 1. CORS Errors
```bash
# Update NotificationsGateway cors config:
cors: {
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}
```

#### 2. Authentication Errors
```bash
# Check JWT token in WebSocket handshake
# Token should be in auth.token or Authorization header

# Debug in browser:
const socket = io('/notifications', {
  auth: { token: 'your-jwt-token' }
});
```

### 📦 Dependency Issues

#### 1. Peer Dependency Conflicts
```bash
# Always use legacy peer deps flag
npm install --legacy-peer-deps

# If still issues, clear cache:
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### 2. Missing Dependencies
```bash
# Common missing packages:
npm install @nestjs/websockets socket.io --legacy-peer-deps
npm install @nestjs/schedule --legacy-peer-deps  
npm install axios --legacy-peer-deps
npm install webpack --save-dev --legacy-peer-deps
```

## 🧪 Testing

### Test Backend
```bash
cd backend

# Check if app starts
npm run start:dev

# Test specific endpoints
curl http://localhost:3001/health
curl http://localhost:3001/monitoring/dashboard
```

### Test WebSocket
```bash
# Open browser console and test:
const socket = io('http://localhost:3001/notifications');
socket.emit('ping');
socket.on('pong', (data) => console.log(data));
```

### Test Notifications  
```bash
# Create notification via API
curl -X POST http://localhost:3001/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"title":"Test","content":"Test notification"}'
```

## 🎯 Feature Flags

### Temporarily Disabled Features
```bash
# RabbitMQ Service (type conflicts)
# Location: libs/shared/src/services/rabbitmq.service.ts.bak
# Status: Commented out in SharedModule

# Email Queue with RabbitMQ  
# Current: Direct processing
# Future: Enable when RabbitMQ fixed
```

### Working Features
```bash
✅ Database models (Notification, EmailQueue)
✅ Email Service with retry mechanism  
✅ WebSocket real-time notifications
✅ Monitoring service (RabbitMQ API ready)
✅ Notification CRUD operations
✅ Docker compose configuration
```

## 📝 Development Commands

### Useful Commands
```bash
# Backend
npm run start:dev          # Development server
npm run build              # Build for production  
npm run start:prod         # Production server
npx prisma studio          # Database GUI
npx prisma migrate dev     # Create migration
npx prisma generate        # Generate Prisma client

# Frontend
npm run dev                # Development server
npm run build              # Build for production
npm run preview            # Preview build

# Docker
docker compose up -d       # Start all services
docker compose down        # Stop all services  
docker compose logs <service> # View logs
```

### Code Generation
```bash
# Generate new NestJS resource
nest g resource users

# Generate new service
nest g service shared/services/notification

# Generate new controller  
nest g controller monitoring
```

## 🔄 Update Workflow

### When Adding New Features
1. Update Prisma schema if needed
2. Run migration: `npx prisma migrate dev`
3. Generate client: `npx prisma generate`  
4. Implement service logic
5. Add to appropriate module
6. Update exports in index.ts
7. Write tests
8. Update documentation

### When Fixing RabbitMQ
1. Fix type conflicts in rabbitmq.service.ts
2. Uncomment in SharedModule 
3. Uncomment in NotificationsService
4. Test RabbitMQ connection
5. Enable queue processing
6. Update monitoring endpoints

## 📞 Support

### Common Issues & Solutions
- **Build fails**: Check dependencies, run `npm install --legacy-peer-deps`
- **Database errors**: Check connection, run migrations
- **WebSocket not working**: Check CORS, JWT token
- **RabbitMQ errors**: Currently expected (service disabled)
- **Port conflicts**: Change ports in .env file

### Logs Location
```bash
# Application logs: Console output
# Database logs: Docker logs or PostgreSQL logs
# RabbitMQ logs: docker compose logs rabbitmq
```

Dự án đã được thiết lập thành công và sẵn sàng phát triển! 🚀
