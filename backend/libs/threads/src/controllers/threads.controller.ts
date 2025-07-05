// Controller quản lý threads
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ThreadsService } from "../services/threads.service";

@ApiTags("Threads")
@Controller("threads")
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  // Tạo thread mới
  @Post()
  @ApiOperation({ summary: "Tạo thread mới" })
  async create(@Body() createThreadDto: any) {
    return this.threadsService.create(createThreadDto);
  }

  // Lấy danh sách threads
  @Get()
  @ApiOperation({ summary: "Lấy danh sách threads" })
  async findAll() {
    return this.threadsService.findAll();
  }

  // Lấy thread theo ID
  @Get(":id")
  @ApiOperation({ summary: "Lấy thread theo ID" })
  async findOne(@Param("id") id: string) {
    return this.threadsService.findById(id);
  }

  // Cập nhật thread
  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thread" })
  async update(@Param("id") id: string, @Body() updateThreadDto: any) {
    return this.threadsService.update(id, updateThreadDto);
  }

  // Xóa thread
  @Delete(":id")
  @ApiOperation({ summary: "Xóa thread" })
  async remove(@Param("id") id: string) {
    return this.threadsService.remove(id);
  }
}
