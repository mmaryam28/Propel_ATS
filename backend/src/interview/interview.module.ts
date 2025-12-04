import { Module } from '@nestjs/common';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { InterviewPrepService } from './interview-prep.service';

@Module({
  imports: [SupabaseModule],
  controllers: [
    InterviewController,
    AnalyticsController
  ],
  providers: [
    InterviewService,
    AnalyticsService,
    InterviewPrepService
  ],
  exports: [
    InterviewService,
    AnalyticsService,
    InterviewPrepService
  ],
})
export class InterviewModule {}
