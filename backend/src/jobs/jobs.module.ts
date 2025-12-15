import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { ApplicationAnalyticsController } from './application-analytics.controller';
import { ApplicationAnalyticsService } from './application-analytics.service';
import { SupabaseModule } from '../supabase/supabase.module';
<<<<<<< HEAD
import { GeocodingModule } from '../geocoding/geocoding.module';

@Module({
  imports: [SupabaseModule, GeocodingModule],
=======
import { SalaryModule } from '../salary/salary.module';

@Module({
  imports: [SupabaseModule, SalaryModule],
>>>>>>> 99c95de78c7bc6955fd8595b3145082d68e0d3fe
  controllers: [JobsController, ApplicationAnalyticsController],
  providers: [JobsService, ApplicationAnalyticsService],
})
export class JobsModule {}
