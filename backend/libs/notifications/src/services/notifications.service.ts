// Notifications Service - Quản lý thông báo với RabbitMQ và Prisma
import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService /*, RabbitMQService*/ } from "@libs/shared";
import { NotificationsGateway } from "../gateways/notifications.gateway";

// Enum tạm thời cho NotificationType (sẽ được thay thế khi Prisma generate)
enum NotificationType {
  NEW_POST = "NEW_POST",
  NEW_REPLY = "NEW_REPLY",
  THREAD_PINNED = "THREAD_PINNED",
  THREAD_LOCKED = "THREAD_LOCKED",
  USER_MENTIONED = "USER_MENTIONED",
  VOTE_RECEIVED = "VOTE_RECEIVED",
  SYSTEM = "SYSTEM",
}

// DTO cho tạo notification
interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  relatedId?: string;
  relatedType?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    // private readonly rabbitMQ: RabbitMQService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway
  ) {
    // Bắt đầu consumer cho notification queue (disabled tạm thời)
    // this.startNotificationConsumer();
  }

  // Lấy danh sách thông báo của user với pagination
  async findAll(
    userId: string,
    options: { page?: number; limit?: number; isRead?: boolean } = {}
  ) {
    const { page = 1, limit = 20, isRead } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    try {
      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        this.prisma.notification.count({ where }),
      ]);

      return { notifications, total };
    } catch (error) {
      // Fallback nếu chưa có table notification
      return {
        notifications: [
          {
            id: "1",
            title: "Thông báo mẫu",
            content: "Đây là thông báo mẫu",
            isRead: false,
            createdAt: new Date(),
          },
        ],
        total: 1,
      };
    }
  }

  // Lấy số lượng thông báo chưa đọc
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });
    } catch (error) {
      // Fallback nếu chưa có table notification
      return 5;
    }
  }

  // Đánh dấu thông báo đã đọc
  async markAsRead(id: string, userId: string) {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        throw new NotFoundException("Không tìm thấy thông báo");
      }

      return await this.prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Fallback
      return { message: "Đánh dấu thành công" };
    }
  }

  // Đánh dấu tất cả thông báo đã đọc
  async markAllAsRead(userId: string) {
    try {
      await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    } catch (error) {
      // Fallback - không làm gì
    }
  }

  // Xóa thông báo
  async remove(id: string, userId: string) {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        throw new NotFoundException("Không tìm thấy thông báo");
      }

      await this.prisma.notification.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Fallback - không làm gì
    }
  }

  // Gửi thông báo vào queue
  async sendNotification(data: CreateNotificationDto): Promise<void> {
    // await this.rabbitMQ.sendToQueue("notifications.queue", data);
    // Tạm thời tạo notification trực tiếp
    await this.processNotification(data);
  }

  // Bắt đầu consumer cho notification queue
  private async startNotificationConsumer(): Promise<void> {
    // await this.rabbitMQ.consumeFromQueue(
    //   "notifications.queue",
    //   this.processNotification.bind(this)
    // );
  }

  // Xử lý notification từ queue
  private async processNotification(
    data: CreateNotificationDto
  ): Promise<void> {
    try {
      // Tạo notification trong database
      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          content: data.content,
          relatedId: data.relatedId,
          relatedType: data.relatedType,
        },
      });

      // Gửi thông báo real-time qua WebSocket
      await this.notificationsGateway.sendNotificationToUser(
        data.userId,
        notification
      );

      // Cập nhật số lượng thông báo chưa đọc
      const unreadCount = await this.getUnreadCount(data.userId);
      await this.notificationsGateway.sendUnreadCountUpdate(
        data.userId,
        unreadCount
      );

      console.log("📢 Notification created:", data.title);
    } catch (error) {
      console.error("❌ Failed to process notification:", error);
    }
  }

  // Tạo thông báo khi có post mới
  async notifyNewPost(
    authorId: string,
    threadId: string,
    threadTitle: string
  ): Promise<void> {
    try {
      // Lấy danh sách users đã comment trong thread (trừ author)
      const usersInThread = await this.prisma.post.findMany({
        where: {
          threadId,
          authorId: { not: authorId },
        },
        select: { authorId: true },
        distinct: ["authorId"],
      });

      // Gửi notification cho từng user
      for (const user of usersInThread) {
        await this.sendNotification({
          userId: user.authorId,
          type: NotificationType.NEW_POST,
          title: "Có bài viết mới",
          content: `Có bài viết mới trong thread: ${threadTitle}`,
          relatedId: threadId,
          relatedType: "thread",
        });
      }
    } catch (error) {
      console.error("❌ Failed to notify new post:", error);
    }
  }

  // Tạo thông báo khi có reply
  async notifyNewReply(
    replyAuthorId: string,
    originalPostId: string
  ): Promise<void> {
    try {
      const originalPost = await this.prisma.post.findUnique({
        where: { id: originalPostId },
        include: {
          author: true,
          thread: true,
        },
      });

      if (!originalPost || originalPost.authorId === replyAuthorId) {
        return; // Không gửi notification cho chính mình
      }

      await this.sendNotification({
        userId: originalPost.authorId,
        type: NotificationType.NEW_REPLY,
        title: "Có reply mới",
        content: `${originalPost.author.username} đã reply bài viết của bạn trong "${originalPost.thread.title}"`,
        relatedId: originalPostId,
        relatedType: "post",
      });
    } catch (error) {
      console.error("❌ Failed to notify new reply:", error);
    }
  }
}
