// Service quản lý kết nối Prisma database
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // Kết nối database khi module khởi tạo
  async onModuleInit() {
    await this.$connect();
    console.log('🗄️ PostgreSQL database connected via Prisma');
  }

  // Đóng kết nối khi ứng dụng tắt
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
