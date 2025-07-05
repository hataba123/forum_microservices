// Votes Controller - xử lý các request liên quan đến vote
import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { VotesService } from "../services/votes.service";
import { JwtAuthGuard, CurrentUser } from "@libs/auth";

@ApiTags("Votes")
@Controller("votes")
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Vote cho thread hoặc post" })
  @ApiResponse({ status: 201, description: "Vote thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  async vote(@Body() voteDto: any, @CurrentUser() user: any) {
    return this.votesService.vote(voteDto, user.id);
  }

  @Delete(":targetId/:type")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Hủy vote" })
  @ApiResponse({ status: 200, description: "Hủy vote thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  async removeVote(
    @Param("targetId") targetId: string,
    @Param("type") type: string,
    @CurrentUser() user: any
  ) {
    return this.votesService.removeVote(targetId, type as any, user.id);
  }
}
