import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { ApplicationAnalyticsController } from './application-analytics.controller';
import { ApplicationAnalyticsService } from './application-analytics.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [JobsController, ApplicationAnalyticsController],
  providers: [JobsService, ApplicationAnalyticsService],
})
export class JobsModule {}
