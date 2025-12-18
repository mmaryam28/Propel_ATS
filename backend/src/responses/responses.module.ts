import { Module } from '@nestjs/common';
import { ResponsesController } from './responses.controller';
import { ResponsesService } from './responses.service';
import { ResponsesAIService } from './responses.ai.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [ResponsesController],
  providers: [ResponsesService, ResponsesAIService],
  exports: [ResponsesService],
})
export class ResponsesModule {}
