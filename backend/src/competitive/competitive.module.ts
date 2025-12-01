import { Module } from '@nestjs/common';
import { CompetitiveController } from './competitive.controller';
import { CompetitiveService } from './competitive.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [CompetitiveController],
  providers: [CompetitiveService],
  exports: [CompetitiveService],
})
export class CompetitiveModule {}
