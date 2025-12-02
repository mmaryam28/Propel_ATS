import { Module } from '@nestjs/common';
import { NetworkingController } from './networking.controller';
import { NetworkingService } from './networking.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [NetworkingController],
  providers: [NetworkingService],
  exports: [NetworkingService],
})
export class NetworkingModule {}
