// Controller quản lý categories
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CategoriesService } from "../services/categories.service";
import { CreateCategoryDto } from "../dto/create-category.dto";
import { UpdateCategoryDto } from "../dto/update-category.dto";
import { JwtAuthGuard, RolesGuard, Roles } from "@libs/auth";
import { UserRole } from "@libs/shared";

@ApiTags("Categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // Tạo category mới (chỉ admin)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Tạo danh mục mới (Admin only)" })
  @ApiResponse({ status: 201, description: "Tạo danh mục thành công" })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  // Lấy danh sách categories
  @Get()
  @ApiOperation({ summary: "Lấy danh sách danh mục" })
  @ApiResponse({ status: 200, description: "Thành công" })
  async findAll(@Query("includeInactive") includeInactive?: boolean) {
    return this.categoriesService.findAll(includeInactive);
  }

  // Lấy category theo ID
  @Get(":id")
  @ApiOperation({ summary: "Lấy danh mục theo ID" })
  @ApiResponse({ status: 200, description: "Thành công" })
  @ApiResponse({ status: 404, description: "Danh mục không tồn tại" })
  async findOne(@Param("id") id: string) {
    return this.categoriesService.findById(id);
  }

  // Cập nhật category
  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: "Cập nhật danh mục (Admin/Mod only)" })
  @ApiResponse({ status: 200, description: "Cập nhật thành công" })
  async update(
    @Param("id") id: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  // Xóa category
  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Xóa danh mục (Admin only)" })
  @ApiResponse({ status: 200, description: "Xóa danh mục thành công" })
  async remove(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}
