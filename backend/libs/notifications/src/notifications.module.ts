// Notifications Module - quản lý thông báo
import { Module, forwardRef } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { NotificationsController } from "./controllers/notifications.controller";
import { NotificationsService } from "./services/notifications.service";
import { NotificationsGateway } from "./gateways/notifications.gateway";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>("JWT_ACCESS_EXPIRES", "15m"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: NotificationsGateway,
      useClass: NotificationsGateway,
    },
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
