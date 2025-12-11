import { Module } from '@nestjs/common';
import { ApplicationQualityService } from './application-quality.service';
import { ApplicationQualityController } from './application-quality.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [ApplicationQualityService],
  controllers: [ApplicationQualityController],
  exports: [ApplicationQualityService],
})
export class ApplicationQualityModule {}
