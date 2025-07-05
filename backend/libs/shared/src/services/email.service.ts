// Email Service - Quản lý hàng đợi email (tạm thời không dùng RabbitMQ)
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../database/prisma.service";
import { EmailStatus } from "@prisma/client";

// Interface cho email data
interface EmailData {
  to: string;
  subject: string;
  content: string;
  template?: string;
  scheduledAt?: Date;
  maxRetries?: number;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  // Thêm email vào queue
  async queueEmail(emailData: EmailData): Promise<void> {
    try {
      // Lưu vào database
      const emailRecord = await this.prisma.emailQueue.create({
        data: {
          to: emailData.to,
          subject: emailData.subject,
          content: emailData.content,
          template: emailData.template,
          scheduledAt: emailData.scheduledAt,
          maxRetries: emailData.maxRetries || 3,
        },
      });

      // Tạm thời gửi trực tiếp thay vì queue
      await this.processEmail({ emailId: emailRecord.id, emailData });

      this.logger.log(
        `📧 Email queued: ${emailData.to} - ${emailData.subject}`
      );
    } catch (error) {
      this.logger.error("❌ Failed to queue email:", error);
    }
  }

  // Xử lý email từ queue
  private async processEmail(data: {
    emailId: string;
    emailData: EmailData;
  }): Promise<void> {
    try {
      // Cập nhật status thành SENDING
      await this.prisma.emailQueue.update({
        where: { id: data.emailId },
        data: { status: EmailStatus.SENDING },
      });

      // Gửi email thật
      await this.sendEmail(data.emailData);

      // Cập nhật status thành SENT
      await this.prisma.emailQueue.update({
        where: { id: data.emailId },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
        },
      });

      this.logger.log(`✅ Email sent: ${data.emailData.to}`);
    } catch (error) {
      // Xử lý retry
      await this.handleEmailError(data.emailId, error);
    }
  }

  // Gửi email thật (mock implementation)
  private async sendEmail(emailData: EmailData): Promise<void> {
    // Mock delay để simulate gửi email
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Ở đây bạn có thể tích hợp với service thật như:
    // - AWS SES
    // - SendGrid
    // - Nodemailer với SMTP
    // - ...

    // Mock success/failure (90% success rate)
    if (Math.random() < 0.1) {
      throw new Error("Simulated email sending failure");
    }

    this.logger.log(`📤 Email sent to ${emailData.to}: ${emailData.subject}`);
  }

  // Xử lý lỗi và retry
  private async handleEmailError(emailId: string, error: any): Promise<void> {
    try {
      const emailRecord = await this.prisma.emailQueue.findUnique({
        where: { id: emailId },
      });

      if (!emailRecord) return;

      const retryCount = emailRecord.attempts + 1;

      if (retryCount >= emailRecord.maxRetries) {
        // Đã retry đủ số lần, đánh dấu failed
        await this.prisma.emailQueue.update({
          where: { id: emailId },
          data: {
            status: EmailStatus.FAILED,
            errorMessage: error.message,
            attempts: retryCount,
          },
        });

        this.logger.error(
          `❌ Email failed after ${retryCount} retries: ${emailRecord.to}`
        );
      } else {
        // Retry lại
        await this.prisma.emailQueue.update({
          where: { id: emailId },
          data: {
            status: EmailStatus.PENDING,
            errorMessage: error.message,
            attempts: retryCount,
            scheduledAt: new Date(Date.now() + Math.pow(2, retryCount) * 60000), // Exponential backoff
          },
        });

        this.logger.warn(
          `⚠️ Email retry ${retryCount}/${emailRecord.maxRetries}: ${emailRecord.to}`
        );
      }
    } catch (updateError) {
      this.logger.error("❌ Failed to update email status:", updateError);
    }
  }

  // Cron job - Xử lý email pending mỗi phút
  @Cron("0 * * * * *")
  async processPendingEmails(): Promise<void> {
    try {
      const pendingEmails = await this.prisma.emailQueue.findMany({
        where: {
          status: EmailStatus.PENDING,
          scheduledAt: {
            lte: new Date(),
          },
        },
        take: 10, // Xử lý tối đa 10 email mỗi lần
        orderBy: {
          createdAt: "asc",
        },
      });

      if (pendingEmails.length > 0) {
        this.logger.log(`📮 Processing ${pendingEmails.length} pending emails`);

        for (const email of pendingEmails) {
          await this.processEmail({
            emailId: email.id,
            emailData: {
              to: email.to,
              subject: email.subject,
              content: email.content,
              template: email.template || undefined,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error("❌ Failed to process pending emails:", error);
    }
  }

  // Helper methods cho các loại email phổ biến
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    await this.queueEmail({
      to: userEmail,
      subject: "Chào mừng bạn đến với Forum Voz!",
      content: `Xin chào ${userName},\n\nChào mừng bạn đến với Forum Voz! Cảm ơn bạn đã đăng ký tài khoản.\n\nTrân trọng,\nTeam Forum Voz`,
      template: "welcome",
    });
  }

  async sendPasswordResetEmail(
    userEmail: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${this.configService.get("FRONTEND_URL")}/reset-password?token=${resetToken}`;

    await this.queueEmail({
      to: userEmail,
      subject: "Đặt lại mật khẩu",
      content: `Bạn đã yêu cầu đặt lại mật khẩu.\n\nNhấn vào link sau để đặt lại: ${resetUrl}\n\nLink này sẽ hết hạn sau 1 giờ.`,
      template: "password-reset",
    });
  }

  async sendNotificationEmail(
    userEmail: string,
    notification: string
  ): Promise<void> {
    await this.queueEmail({
      to: userEmail,
      subject: "Thông báo mới",
      content: notification,
      template: "notification",
    });
  }
}
