// Controller quản lý users
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
import { UsersService } from "../services/users.service";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { JwtAuthGuard, RolesGuard, Roles } from "@libs/auth";
import { UserRole } from "@libs/shared";

@ApiTags("Users")
@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Tạo user mới (chỉ admin)
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Tạo user mới (Admin only)" })
  @ApiResponse({ status: 201, description: "Tạo user thành công" })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // Lấy danh sách users
  @Get()
  @ApiOperation({ summary: "Lấy danh sách users" })
  @ApiResponse({ status: 200, description: "Thành công" })
  async findAll(@Query("page") page?: number, @Query("limit") limit?: number) {
    return this.usersService.findMany(page, limit);
  }

  // Lấy thông tin user theo ID
  @Get(":id")
  @ApiOperation({ summary: "Lấy thông tin user theo ID" })
  @ApiResponse({ status: 200, description: "Thành công" })
  @ApiResponse({ status: 404, description: "User không tồn tại" })
  async findOne(@Param("id") id: string) {
    return this.usersService.findById(id);
  }

  // Cập nhật user
  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: "Cập nhật user (Admin/Mod only)" })
  @ApiResponse({ status: 200, description: "Cập nhật thành công" })
  async update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  // Xóa user (soft delete)
  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Xóa user (Admin only)" })
  @ApiResponse({ status: 200, description: "Xóa user thành công" })
  async remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
