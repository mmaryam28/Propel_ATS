import { Module } from '@nestjs/common';
import { DuplicatesController } from './duplicates.controller';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [DuplicatesController],
  providers: [DuplicateDetectionService],
  exports: [DuplicateDetectionService],
})
export class DuplicatesModule {}
