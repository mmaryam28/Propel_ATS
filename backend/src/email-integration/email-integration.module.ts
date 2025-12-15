import { Module } from '@nestjs/common';
import { EmailIntegrationController } from './email-integration.controller';
import { EmailIntegrationService } from './email-integration.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [EmailIntegrationController],
  providers: [EmailIntegrationService],
  exports: [EmailIntegrationService],
})
export class EmailIntegrationModule {}
