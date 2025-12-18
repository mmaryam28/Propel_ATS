import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

export interface ApiUsage {
  service: string;
  count: number;
  quota: number;
  remaining: number;
  responseTimes: number[];
}

export interface ApiErrorLog {
  service: string;
  timestamp: Date;
  error: string;
}

@Injectable()
export class ApiMonitoringService {
  private readonly logger = new Logger(ApiMonitoringService.name);
  private usageStats: Record<string, ApiUsage> = {};
  private errorLogs: ApiErrorLog[] = [];

  recordUsage(service: string, quota: number, responseTime: number) {
    if (!this.usageStats[service]) {
      this.usageStats[service] = { service, count: 0, quota, remaining: quota, responseTimes: [] };
    }
    this.usageStats[service].count++;
    this.usageStats[service].remaining = Math.max(0, quota - this.usageStats[service].count);
    this.usageStats[service].responseTimes.push(responseTime);
  }

  recordError(service: string, error: string) {
    const log: ApiErrorLog = { service, timestamp: new Date(), error };
    this.errorLogs.push(log);
    this.logger.error(`[${service}] ${error}`);
  }

  getUsageStats() {
    return Object.values(this.usageStats);
  }

  getErrorLogs() {
    return this.errorLogs;
  }

  getAlerts() {
    return Object.values(this.usageStats)
      .filter(u => u.remaining / u.quota < 0.1)
      .map(u => ({ service: u.service, remaining: u.remaining, quota: u.quota }));
  }

  getAverageResponseTimes() {
    return Object.values(this.usageStats).map(u => ({
      service: u.service,
      avgResponseTime: u.responseTimes.length ? (u.responseTimes.reduce((a, b) => a + b, 0) / u.responseTimes.length) : 0
    }));
  }

  // Weekly report generation (stub)
  @Cron('0 0 * * 0')
  generateWeeklyReport() {
    // Implement report generation logic (e.g., email, file, etc.)
    this.logger.log('Weekly API usage report generated.');
  }
}
