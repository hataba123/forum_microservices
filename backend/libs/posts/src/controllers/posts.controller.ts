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
import { AuthenticatedUser, PostsService } from "../services/posts.service";
import { JwtAuthGuard } from "@libs/auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "@libs/auth/guards/optional-jwt-auth.guard";
import { CurrentUser } from "@libs/auth/decorators/current-user.decorator";
import { CreatePostDto } from "../dto/create-post.dto";
import { QueryPostsDto } from "../dto/query-posts.dto";
import { UpdatePostDto } from "../dto/update-post.dto";

@ApiTags("Posts")
@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "Lấy danh sách bài viết" })
  @ApiResponse({
    status: 200,
    description: "Lấy danh sách bài viết thành công",
  })
  async findAll(@Query() query: QueryPostsDto, @CurrentUser() user?: AuthenticatedUser) {
    return this.postsService.findAll(query, user?.id);
  }

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "Lấy thông tin chi tiết bài viết" })
  @ApiResponse({
    status: 200,
    description: "Lấy thông tin bài viết thành công",
  })
  @ApiResponse({ status: 404, description: "Không tìm thấy bài viết" })
  async findOne(@Param("id") id: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.postsService.findOne(id, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Tạo bài viết mới" })
  @ApiResponse({ status: 201, description: "Tạo bài viết thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  async create(@Body() createPostDto: CreatePostDto, @CurrentUser() user: AuthenticatedUser) {
    return this.postsService.create(createPostDto, user);
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
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.postsService.update(id, updatePostDto, user);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Xóa bài viết" })
  @ApiResponse({ status: 200, description: "Xóa bài viết thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  @ApiResponse({ status: 403, description: "Không có quyền xóa" })
  @ApiResponse({ status: 404, description: "Không tìm thấy bài viết" })
  async remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.postsService.remove(id, user);
  }
}
