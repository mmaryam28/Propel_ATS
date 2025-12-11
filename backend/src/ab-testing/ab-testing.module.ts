import { Module } from '@nestjs/common';
import { AbTestingController } from './ab-testing.controller';
import { AbTestingService } from './ab-testing.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [AbTestingController],
  providers: [AbTestingService],
  exports: [AbTestingService],
})
export class AbTestingModule {}
