import { Module } from '@nestjs/common';
import { InformationalInterviewsController } from './informational-interviews.controller';
import { InformationalInterviewsService } from './informational-interviews.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [InformationalInterviewsController],
  providers: [InformationalInterviewsService],
  exports: [InformationalInterviewsService],
})
export class InformationalInterviewsModule {}
