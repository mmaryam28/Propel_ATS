import { Module } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { SalaryController } from './salary.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { SalaryCacheScheduler } from './salary-cache.scheduler';

@Module({
  imports: [SupabaseModule],
  providers: [SalaryService, SalaryCacheScheduler],
  controllers: [SalaryController],
  exports: [SalaryService],
})
export class SalaryModule {}