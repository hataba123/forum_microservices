// Posts Controller - xử lý các request liên quan đến bài viết
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { PostsService } from "../services/posts.service";
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from "@libs/auth";
import { UserRole } from "@libs/shared";

@ApiTags("Posts")
@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: "Lấy danh sách bài viết" })
  @ApiResponse({
    status: 200,
    description: "Lấy danh sách bài viết thành công",
  })
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("threadId") threadId?: string
  ) {
    return this.postsService.findAll({ page, limit, threadId });
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy thông tin chi tiết bài viết" })
  @ApiResponse({
    status: 200,
    description: "Lấy thông tin bài viết thành công",
  })
  @ApiResponse({ status: 404, description: "Không tìm thấy bài viết" })
  async findOne(@Param("id") id: string) {
    return this.postsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Tạo bài viết mới" })
  @ApiResponse({ status: 201, description: "Tạo bài viết thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  async create(@Body() createPostDto: any, @CurrentUser() user: any) {
    return this.postsService.create(createPostDto, user.id);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cập nhật bài viết" })
  @ApiResponse({ status: 200, description: "Cập nhật bài viết thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  @ApiResponse({ status: 403, description: "Không có quyền cập nhật" })
  @ApiResponse({ status: 404, description: "Không tìm thấy bài viết" })
  async update(
    @Param("id") id: string,
    @Body() updatePostDto: any,
    @CurrentUser() user: any
  ) {
    return this.postsService.update(id, updatePostDto, user.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Xóa bài viết" })
  @ApiResponse({ status: 200, description: "Xóa bài viết thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  @ApiResponse({ status: 403, description: "Không có quyền xóa" })
  @ApiResponse({ status: 404, description: "Không tìm thấy bài viết" })
  async remove(@Param("id") id: string) {
    return this.postsService.remove(id);
  }
}
