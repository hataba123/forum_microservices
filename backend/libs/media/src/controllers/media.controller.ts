// Media Controller - xử lý các request liên quan đến media
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Query,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from "@nestjs/swagger";
import { MediaService } from "../services/media.service";
import { JwtAuthGuard, CurrentUser } from "@libs/auth";

@ApiTags("Media")
@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("upload")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Upload một file" })
  @ApiResponse({ status: 201, description: "Upload thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  @ApiResponse({ status: 400, description: "File không hợp lệ" })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any
  ) {
    return this.mediaService.uploadFile(file, user.id);
  }

  @Post("upload-multiple")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor("files", 10))
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Upload nhiều file" })
  @ApiResponse({ status: 201, description: "Upload thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  @ApiResponse({ status: 400, description: "File không hợp lệ" })
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: any
  ) {
    return this.mediaService.uploadFiles(files, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Lấy danh sách file của user" })
  @ApiResponse({ status: 200, description: "Lấy danh sách thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  async findAll(
    @CurrentUser() user: any,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("type") type?: string
  ) {
    return this.mediaService.findAll(user.id, { page, limit, type });
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy thông tin chi tiết file" })
  @ApiResponse({ status: 200, description: "Lấy thông tin thành công" })
  @ApiResponse({ status: 404, description: "Không tìm thấy file" })
  async findOne(@Param("id") id: string) {
    return this.mediaService.findOne(id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Xóa file" })
  @ApiResponse({ status: 200, description: "Xóa file thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  @ApiResponse({ status: 403, description: "Không có quyền xóa" })
  @ApiResponse({ status: 404, description: "Không tìm thấy file" })
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.mediaService.remove(id, user.id);
  }
}
