// Monitoring Controller - API endpoints cho monitoring RabbitMQ
import { Controller, Get, Param } from "@nestjs/common";
import { MonitoringService } from "../services/monitoring.service";

@Controller("monitoring")
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  // Lấy tổng quan về RabbitMQ
  @Get("rabbitmq/overview")
  async getRabbitMQOverview() {
    const overview = await this.monitoringService.getRabbitMQOverview();
    return {
      success: true,
      data: overview,
    };
  }

  // Lấy metrics của tất cả queues
  @Get("rabbitmq/queues")
  async getQueueMetrics() {
    const queues = await this.monitoringService.getQueueMetrics();
    return {
      success: true,
      data: queues,
    };
  }

  // Lấy metrics của queue cụ thể
  @Get("rabbitmq/queues/:name")
  async getQueueMetricsByName(@Param("name") queueName: string) {
    const queue = await this.monitoringService.getQueueMetricsByName(queueName);
    return {
      success: true,
      data: queue,
    };
  }

  // Kiểm tra health của RabbitMQ
  @Get("rabbitmq/health")
  async checkRabbitMQHealth() {
    const isHealthy = await this.monitoringService.checkRabbitMQHealth();
    return {
      success: true,
      data: {
        status: isHealthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Lấy tất cả metrics cho dashboard
  @Get("dashboard")
  async getMetricsForDashboard() {
    const metrics = await this.monitoringService.getMetricsForDashboard();
    return {
      success: true,
      data: metrics,
    };
  }
}
