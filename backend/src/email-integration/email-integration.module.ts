import { Module, forwardRef } from '@nestjs/common';
import { EmailIntegrationController } from './email-integration.controller';
import { EmailIntegrationService } from './email-integration.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { ApiMonitoringModule } from '../api-monitoring/api-monitoring.module';

@Module({
  imports: [
    SupabaseModule,
    forwardRef(() => ApiMonitoringModule),
  ],
  controllers: [EmailIntegrationController],
  providers: [EmailIntegrationService],
  exports: [EmailIntegrationService],
})
export class EmailIntegrationModule {}
