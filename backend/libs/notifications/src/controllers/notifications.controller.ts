// Notifications Controller - xử lý các request liên quan đến thông báo
import {
  Controller,
  Get,
  Put,
  Delete,
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
import { NotificationsService } from "../services/notifications.service";
import { JwtAuthGuard, CurrentUser } from "@libs/auth";

@ApiTags("Notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Lấy danh sách thông báo của user" })
  @ApiResponse({
    status: 200,
    description: "Lấy danh sách thông báo thành công",
  })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  async findAll(
    @CurrentUser() user: any,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("isRead") isRead?: boolean
  ) {
    return this.notificationsService.findAll(user.id, { page, limit, isRead });
  }

  @Get("unread-count")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Lấy số lượng thông báo chưa đọc" })
  @ApiResponse({ status: 200, description: "Lấy số lượng thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  async getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Put(":id/read")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Đánh dấu thông báo đã đọc" })
  @ApiResponse({ status: 200, description: "Đánh dấu thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  @ApiResponse({ status: 404, description: "Không tìm thấy thông báo" })
  async markAsRead(@Param("id") id: string, @CurrentUser() user: any) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Put("read-all")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Đánh dấu tất cả thông báo đã đọc" })
  @ApiResponse({ status: 200, description: "Đánh dấu tất cả thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  async markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Xóa thông báo" })
  @ApiResponse({ status: 200, description: "Xóa thông báo thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  @ApiResponse({ status: 404, description: "Không tìm thấy thông báo" })
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.notificationsService.remove(id, user.id);
  }
}
