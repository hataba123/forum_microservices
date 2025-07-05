// Module chính của API Gateway - tích hợp tất cả các module con
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@libs/auth';
import { UsersModule } from '@libs/users';
import { CategoriesModule } from '@libs/categories';
import { ThreadsModule } from '@libs/threads';
import { PostsModule } from '@libs/posts';
import { VotesModule } from '@libs/votes';
import { NotificationsModule } from '@libs/notifications';
import { MediaModule } from '@libs/media';
import { SharedModule } from '@libs/shared';

@Module({
  imports: [
    // Cấu hình môi trường
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Shared module
    SharedModule,
    
    // Business modules
    AuthModule,
    UsersModule,
    CategoriesModule,
    ThreadsModule,
    PostsModule,
    VotesModule,
    NotificationsModule,
    MediaModule,
  ],
})
export class AppModule {}
