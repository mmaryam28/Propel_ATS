import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { ApplicationAnalyticsController } from './application-analytics.controller';
import { ApplicationAnalyticsService } from './application-analytics.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { GeocodingModule } from '../geocoding/geocoding.module';

@Module({
  imports: [SupabaseModule, GeocodingModule],
  controllers: [JobsController, ApplicationAnalyticsController],
  providers: [JobsService, ApplicationAnalyticsService],
})
export class JobsModule {}
