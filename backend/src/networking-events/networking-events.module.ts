import { Module } from '@nestjs/common';
import { NetworkingEventsController } from './networking-events.controller';
import { NetworkingEventsService } from './networking-events.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [NetworkingEventsController],
  providers: [NetworkingEventsService],
  exports: [NetworkingEventsService],
})
export class NetworkingEventsModule {}
