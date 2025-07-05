// Module chung chứa các service và utility dùng chung
import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaService } from "./database/prisma.service";
// import { RabbitMQService } from './services/rabbitmq.service';
import { EmailService } from "./services/email.service";
import { MonitoringService } from "./services/monitoring.service";
import { MonitoringController } from "./controllers/monitoring.controller";

@Global()
@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(), // Cho Cron jobs
  ],
  controllers: [MonitoringController],
  providers: [
    PrismaService,
    // RabbitMQService,
    EmailService,
    MonitoringService,
  ],
  exports: [
    PrismaService,
    // RabbitMQService,
    EmailService,
    MonitoringService,
  ],
})
export class SharedModule {}
