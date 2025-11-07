import { Module } from '@nestjs/common';
import { EmploymentController } from './employment.controller';
import { SupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [EmploymentController],
  providers: [SupabaseService],
})
export class EmploymentModule {}
