import { Controller, Get } from '@nestjs/common';
import { ApiMonitoringService } from './api-monitoring.service';

@Controller('admin/api-monitoring')
export class ApiMonitoringController {
  constructor(private readonly apiMonitoringService: ApiMonitoringService) {}

  @Get('usage')
  getUsageStats() {
    return this.apiMonitoringService.getUsageStats();
  }

  @Get('errors')
  getErrorLogs() {
    return this.apiMonitoringService.getErrorLogs();
  }

  @Get('alerts')
  getAlerts() {
    return this.apiMonitoringService.getAlerts();
  }

  @Get('response-times')
  getAverageResponseTimes() {
    return this.apiMonitoringService.getAverageResponseTimes();
  }
}
