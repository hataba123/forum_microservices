// RabbitMQ Service - Quản lý kết nối và xử lý message queue
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import amqp from "amqplib";

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  constructor(private readonly configService: ConfigService) {}

  // Khởi tạo kết nối RabbitMQ khi module được load
  async onModuleInit() {
    try {
      const url =
        this.configService.get<string>("RABBITMQ_URL") ||
        "amqp://admin:admin123@localhost:5672";
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      // Đảm bảo queues tồn tại
      await this.setupQueues();

      this.logger.log("✅ RabbitMQ connected successfully");
    } catch (error) {
      this.logger.error("❌ Failed to connect to RabbitMQ", error);
    }
  }

  // Đóng kết nối khi module bị destroy
  async onModuleDestroy() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      this.logger.log("🔌 RabbitMQ connection closed");
    } catch (error) {
      this.logger.error("❌ Error closing RabbitMQ connection", error);
    }
  }

  // Thiết lập các queues cần thiết
  private async setupQueues() {
    const queues = ["notifications.queue", "emails.queue"];

    for (const queue of queues) {
      await this.channel.assertQueue(queue, { durable: true });
      this.logger.log(`📬 Queue "${queue}" is ready`);
    }
  }

  // Gửi message vào queue
  async sendToQueue(queueName: string, message: any): Promise<void> {
    try {
      if (!this.channel) {
        this.logger.error("❌ RabbitMQ channel not available");
        return;
      }

      const buffer = Buffer.from(JSON.stringify(message));
      await this.channel.sendToQueue(queueName, buffer, { persistent: true });
      this.logger.log(`📨 Message sent to queue "${queueName}"`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send message to queue "${queueName}"`,
        error
      );
    }
  }

  // Consume messages từ queue
  async consumeFromQueue(
    queueName: string,
    callback: (message: any) => Promise<void>
  ): Promise<void> {
    try {
      if (!this.channel) {
        this.logger.error("❌ RabbitMQ channel not available");
        return;
      }

      await this.channel.consume(queueName, async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            await callback(content);
            this.channel.ack(msg);
            this.logger.log(`✅ Message processed from queue "${queueName}"`);
          } catch (error) {
            this.logger.error(
              `❌ Error processing message from queue "${queueName}"`,
              error
            );
            this.channel.nack(msg, false, false); // Reject message
          }
        }
      });
      this.logger.log(`👂 Listening to queue "${queueName}"`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to consume from queue "${queueName}"`,
        error
      );
    }
  }

  // Kiểm tra trạng thái kết nối
  isConnected(): boolean {
    return !!(this.connection && this.channel);
  }
}
