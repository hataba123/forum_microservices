// Interfaces cho Monitoring Service
export interface QueueMetrics {
  name: string;
  messages: number;
  messages_ready: number;
  messages_unacknowledged: number;
  consumers: number;
  memory: number;
  message_stats?: {
    publish?: number;
    deliver_get?: number;
    ack?: number;
  };
}

export interface RabbitMQOverview {
  message_stats: {
    publish: number;
    deliver_get: number;
    ack: number;
  };
  queue_totals: {
    messages: number;
    messages_ready: number;
    messages_unacknowledged: number;
  };
  object_totals: {
    connections: number;
    channels: number;
    exchanges: number;
    queues: number;
    consumers: number;
  };
}

export interface MonitoringDashboard {
  overview: RabbitMQOverview | null;
  queues: QueueMetrics[];
  connections: number;
  isHealthy: boolean;
  timestamp: string;
}
