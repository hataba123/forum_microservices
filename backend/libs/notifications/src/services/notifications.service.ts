// Notifications Service - xử lý logic nghiệp vụ cho thông báo
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "@libs/shared";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách thông báo của user
   * @param userId - ID user
   * @param params - Tham số tìm kiếm và phân trang
   * @returns Danh sách thông báo
   */
  async findAll(
    userId: string,
    params: { page?: number; limit?: number; isRead?: boolean }
  ) {
    const { page = 1, limit = 20, isRead } = params;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    // Tạm thời return mock data vì chưa có model Notification
    // TODO: Implement sau khi có model Notification trong schema
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
      },
    };
  }

  /**
   * Lấy số lượng thông báo chưa đọc
   * @param userId - ID user
   * @returns Số lượng thông báo chưa đọc
   */
  async getUnreadCount(userId: string) {
    // TODO: Implement sau khi có model Notification
    return { count: 0 };
  }

  /**
   * Đánh dấu thông báo đã đọc
   * @param id - ID thông báo
   * @param userId - ID user
   * @returns Kết quả đánh dấu
   */
  async markAsRead(id: string, userId: string) {
    // TODO: Implement sau khi có model Notification
    return { message: "Đánh dấu thông báo đã đọc thành công" };
  }

  /**
   * Đánh dấu tất cả thông báo đã đọc
   * @param userId - ID user
   * @returns Kết quả đánh dấu
   */
  async markAllAsRead(userId: string) {
    // TODO: Implement sau khi có model Notification
    return { message: "Đánh dấu tất cả thông báo đã đọc thành công" };
  }

  /**
   * Xóa thông báo
   * @param id - ID thông báo
   * @param userId - ID user
   * @returns Kết quả xóa
   */
  async remove(id: string, userId: string) {
    // TODO: Implement sau khi có model Notification
    return { message: "Xóa thông báo thành công" };
  }

  /**
   * Tạo thông báo mới
   * @param data - Dữ liệu thông báo
   * @returns Thông báo vừa tạo
   */
  async create(data: {
    userId: string;
    type: string;
    title: string;
    content: string;
    relatedId?: string;
    relatedType?: string;
  }) {
    // TODO: Implement sau khi có model Notification
    return { message: "Tạo thông báo thành công" };
  }
}
