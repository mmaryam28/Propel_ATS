import { Module } from '@nestjs/common';
import { ApiMonitoringService } from './api-monitoring.service';
import { ApiMonitoringController } from './api-monitoring.controller';

@Module({
  providers: [ApiMonitoringService],
  controllers: [ApiMonitoringController],
  exports: [ApiMonitoringService],
})
export class ApiMonitoringModule {}
