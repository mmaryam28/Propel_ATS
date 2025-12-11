import { Module } from '@nestjs/common';
import { EmploymentController } from './employment.controller';
import { EmploymentService } from './employment.service';
import { SupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [EmploymentController],
  providers: [SupabaseService, EmploymentService],
  exports: [EmploymentService],
})
export class EmploymentModule {}
