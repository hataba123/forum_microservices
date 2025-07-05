// WebSocket Gateway - Gửi thông báo real-time cho clients
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
  namespace: "/notifications",
})
@Injectable()
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(private readonly jwtService: JwtService) {}

  // Xử lý khi client kết nối
  async handleConnection(socket: AuthenticatedSocket) {
    try {
      const token =
        socket.handshake.auth.token || socket.handshake.headers.authorization;

      if (!token) {
        this.logger.warn("Client connected without token");
        socket.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token.replace("Bearer ", ""));
      socket.userId = payload.sub || payload.userId;

      this.connectedUsers.set(socket.id, socket.userId);

      // Join room theo userId để gửi notification riêng
      socket.join(`user:${socket.userId}`);

      this.logger.log(
        `User ${socket.userId} connected via socket ${socket.id}`
      );
    } catch (error) {
      this.logger.error("Invalid token during connection", error);
      socket.disconnect();
    }
  }

  // Xử lý khi client ngắt kết nối
  handleDisconnect(socket: AuthenticatedSocket) {
    const userId = this.connectedUsers.get(socket.id);
    if (userId) {
      this.connectedUsers.delete(socket.id);
      this.logger.log(`User ${userId} disconnected`);
    }
  }

  // Gửi thông báo real-time cho user cụ thể
  async sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit("notification", {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      relatedId: notification.relatedId,
      relatedType: notification.relatedType,
    });

    this.logger.log(
      `Notification sent to user ${userId}: ${notification.title}`
    );
  }

  // Gửi thông báo cho tất cả users online
  async broadcastNotification(notification: any) {
    this.server.emit("broadcast_notification", notification);
    this.logger.log(`Broadcast notification: ${notification.title}`);
  }

  // Gửi cập nhật số lượng thông báo chưa đọc
  async sendUnreadCountUpdate(userId: string, count: number) {
    this.server.to(`user:${userId}`).emit("unread_count_update", { count });
  }

  // Subscribe message - client có thể gửi message để test
  @SubscribeMessage("ping")
  handlePing(socket: AuthenticatedSocket) {
    socket.emit("pong", {
      message: "Connection is alive",
      userId: socket.userId,
    });
  }

  // Lấy danh sách users đang online
  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.values());
  }

  // Kiểm tra user có online không
  isUserOnline(userId: string): boolean {
    return Array.from(this.connectedUsers.values()).includes(userId);
  }
}
