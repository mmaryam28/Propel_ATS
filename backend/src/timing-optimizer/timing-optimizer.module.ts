import { Module } from '@nestjs/common';
import { TimingOptimizerController } from './timing-optimizer.controller';
import { TimingAnalysisService } from './timing-analysis.service';
import { RecommendationEngineService } from './recommendation-engine.service';
import { SchedulingService } from './scheduling.service';
import { TimingAnalyticsService } from './timing-analytics.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [
    TimingAnalysisService,
    RecommendationEngineService,
    SchedulingService,
    TimingAnalyticsService,
  ],
  controllers: [TimingOptimizerController],
  exports: [
    TimingAnalysisService,
    RecommendationEngineService,
    SchedulingService,
    TimingAnalyticsService,
  ],
})
export class TimingOptimizerModule {}
