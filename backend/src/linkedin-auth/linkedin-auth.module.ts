import { Module } from '@nestjs/common';
import { LinkedinAuthController } from './linkedin-auth.controller';
import { LinkedinAuthService } from './linkedin-auth.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { LinkedInNetworkingStrategy } from './linkedin-networking.strategy';
import { ApiMonitoringModule } from '../api-monitoring/api-monitoring.module';

@Module({
  imports: [SupabaseModule, ApiMonitoringModule],
  controllers: [LinkedinAuthController],
  providers: [LinkedinAuthService, LinkedInNetworkingStrategy],
  exports: [LinkedinAuthService],
})
export class LinkedinAuthModule {}
