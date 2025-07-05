// Threads Module - quản lý chủ đề
import { Module } from "@nestjs/common";
import { ThreadsController } from "./controllers/threads.controller";
import { ThreadsService } from "./services/threads.service";

@Module({
  controllers: [ThreadsController],
  providers: [ThreadsService],
  exports: [ThreadsService],
})
export class ThreadsModule {}
