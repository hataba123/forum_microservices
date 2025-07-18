// Media Module - quản lý media
import { Module } from "@nestjs/common";
import { MediaController } from "./controllers/media.controller";
import { MediaService } from "./services/media.service";

@Module({
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
