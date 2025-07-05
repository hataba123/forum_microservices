// Votes Module - quản lý vote
import { Module } from "@nestjs/common";
import { VotesController } from "./controllers/votes.controller";
import { VotesService } from "./services/votes.service";

@Module({
  controllers: [VotesController],
  providers: [VotesService],
  exports: [VotesService],
})
export class VotesModule {}
