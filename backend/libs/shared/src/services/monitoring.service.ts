// Monitoring Service - Theo dõi RabbitMQ metrics và health
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import axios from "axios";
import {
  QueueMetrics,
  RabbitMQOverview,
  MonitoringDashboard,
} from "../interfaces/monitoring.interface";

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly rabbitmqApiUrl: string;
  private readonly rabbitmqAuth: string;

  constructor(private readonly configService: ConfigService) {
    // RabbitMQ Management API URL
    this.rabbitmqApiUrl = "http://localhost:15672/api";

    // Basic auth cho RabbitMQ Management API
    const username = "admin";
    const password = "admin123";
    this.rabbitmqAuth = Buffer.from(`${username}:${password}`).toString(
      "base64"
    );
  }

  // Lấy tổng quan về RabbitMQ
  async getRabbitMQOverview(): Promise<RabbitMQOverview | null> {
    try {
      const response = await axios.get(`${this.rabbitmqApiUrl}/overview`, {
        headers: {
          Authorization: `Basic ${this.rabbitmqAuth}`,
        },
        timeout: 5000,
      });

      return response.data;
    } catch (error) {
      this.logger.error("Failed to fetch RabbitMQ overview:", error.message);
      return null;
    }
  }

  // Lấy metrics của tất cả queues
  async getQueueMetrics(): Promise<QueueMetrics[]> {
    try {
      const response = await axios.get(`${this.rabbitmqApiUrl}/queues`, {
        headers: {
          Authorization: `Basic ${this.rabbitmqAuth}`,
        },
        timeout: 5000,
      });

      return response.data.map((queue: any) => ({
        name: queue.name,
        messages: queue.messages || 0,
        messages_ready: queue.messages_ready || 0,
        messages_unacknowledged: queue.messages_unacknowledged || 0,
        consumers: queue.consumers || 0,
        memory: queue.memory || 0,
        message_stats: queue.message_stats,
      }));
    } catch (error) {
      this.logger.error("Failed to fetch queue metrics:", error.message);
      return [];
    }
  }

  // Lấy metrics của queue cụ thể
  async getQueueMetricsByName(queueName: string): Promise<QueueMetrics | null> {
    try {
      const response = await axios.get(
        `${this.rabbitmqApiUrl}/queues/%2F/${encodeURIComponent(queueName)}`,
        {
          headers: {
            Authorization: `Basic ${this.rabbitmqAuth}`,
          },
          timeout: 5000,
        }
      );

      const queue = response.data;
      return {
        name: queue.name,
        messages: queue.messages || 0,
        messages_ready: queue.messages_ready || 0,
        messages_unacknowledged: queue.messages_unacknowledged || 0,
        consumers: queue.consumers || 0,
        memory: queue.memory || 0,
        message_stats: queue.message_stats,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch metrics for queue ${queueName}:`,
        error.message
      );
      return null;
    }
  }

  // Kiểm tra health của RabbitMQ
  async checkRabbitMQHealth(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.rabbitmqApiUrl}/aliveness-test/%2F`,
        {
          headers: {
            Authorization: `Basic ${this.rabbitmqAuth}`,
          },
          timeout: 3000,
        }
      );

      return response.data.status === "ok";
    } catch (error) {
      this.logger.error("RabbitMQ health check failed:", error.message);
      return false;
    }
  }

  // Lấy danh sách connections
  async getConnections(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.rabbitmqApiUrl}/connections`, {
        headers: {
          Authorization: `Basic ${this.rabbitmqAuth}`,
        },
        timeout: 5000,
      });

      return response.data.map((conn: any) => ({
        name: conn.name,
        state: conn.state,
        user: conn.user,
        protocol: conn.protocol,
        client_properties: conn.client_properties,
        recv_oct: conn.recv_oct,
        send_oct: conn.send_oct,
      }));
    } catch (error) {
      this.logger.error("Failed to fetch connections:", error.message);
      return [];
    }
  }

  // Cron job - Log metrics mỗi 5 phút
  @Cron("0 */5 * * * *")
  async logMetrics(): Promise<void> {
    this.logger.log("📊 Collecting RabbitMQ metrics...");

    const overview = await this.getRabbitMQOverview();
    if (overview) {
      this.logger.log(`📈 Total messages: ${overview.queue_totals.messages}`);
      this.logger.log(
        `🔄 Ready messages: ${overview.queue_totals.messages_ready}`
      );
      this.logger.log(
        `⏳ Unacknowledged: ${overview.queue_totals.messages_unacknowledged}`
      );
      this.logger.log(`👥 Connections: ${overview.object_totals.connections}`);
      this.logger.log(`🗳️ Queues: ${overview.object_totals.queues}`);
    }

    const queues = await this.getQueueMetrics();
    if (queues.length > 0) {
      this.logger.log("📋 Queue details:");
      queues.forEach((queue) => {
        this.logger.log(
          `  - ${queue.name}: ${queue.messages} messages (${queue.consumers} consumers)`
        );
      });
    }

    const isHealthy = await this.checkRabbitMQHealth();
    this.logger.log(`💚 RabbitMQ Health: ${isHealthy ? "OK" : "ERROR"}`);
  }

  // Cron job - Cảnh báo nếu queue có quá nhiều message
  @Cron("0 */2 * * * *")
  async checkQueueHealth(): Promise<void> {
    const queues = await this.getQueueMetrics();

    for (const queue of queues) {
      // Cảnh báo nếu queue có > 1000 messages chưa xử lý
      if (queue.messages_ready > 1000) {
        this.logger.warn(
          `⚠️ Queue ${queue.name} has ${queue.messages_ready} unprocessed messages`
        );
      }

      // Cảnh báo nếu không có consumer
      if (queue.messages > 0 && queue.consumers === 0) {
        this.logger.warn(
          `⚠️ Queue ${queue.name} has ${queue.messages} messages but no consumers`
        );
      }
    }
  }

  // API endpoint để frontend lấy metrics
  async getMetricsForDashboard(): Promise<MonitoringDashboard> {
    const overview = await this.getRabbitMQOverview();
    const queues = await this.getQueueMetrics();
    const connections = await this.getConnections();
    const isHealthy = await this.checkRabbitMQHealth();

    return {
      overview,
      queues,
      connections: connections.length,
      isHealthy,
      timestamp: new Date().toISOString(),
    };
  }
}
