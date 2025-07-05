// Module chung chứa các service và utility dùng chung
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class SharedModule {}
