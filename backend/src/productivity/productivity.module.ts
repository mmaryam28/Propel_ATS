import { Module } from '@nestjs/common';
import { ProductivityController } from './productivity.controller';
import { ProductivityService } from './productivity.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [ProductivityController],
  providers: [ProductivityService],
  exports: [ProductivityService],
})
export class ProductivityModule {}
