import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@libs/auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "@libs/auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "@libs/auth/guards/optional-jwt-auth.guard";
import { CreateThreadDto } from "../dto/create-thread.dto";
import { QueryThreadDto } from "../dto/query-thread.dto";
import { UpdateThreadDto } from "../dto/update-thread.dto";
import { ThreadsService } from "../services/threads.service";

@ApiTags("Threads")
@Controller("threads")
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Tao thread moi" })
  async create(@Body() createThreadDto: CreateThreadDto, @CurrentUser() user: any) {
    return this.threadsService.create(createThreadDto, user);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "Lay danh sach threads" })
  async findAll(@Query() query: QueryThreadDto, @CurrentUser() user: any) {
    return this.threadsService.findAll(query, user?.id);
  }

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "Lay thread theo ID" })
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    return this.threadsService.findById(id, user?.id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cap nhat thread" })
  async update(
    @Param("id") id: string,
    @Body() updateThreadDto: UpdateThreadDto,
    @CurrentUser() user: any
  ) {
    return this.threadsService.update(id, updateThreadDto, user);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Xoa thread" })
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.threadsService.remove(id, user);
  }
}
