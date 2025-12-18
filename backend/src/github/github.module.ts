import { Module } from '@nestjs/common';
import { GitHubController } from './github.controller';
import { GitHubService } from './github.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { ApiMonitoringModule } from '../api-monitoring/api-monitoring.module';

@Module({
  imports: [SupabaseModule, ApiMonitoringModule],
  controllers: [GitHubController],
  providers: [GitHubService],
  exports: [GitHubService],
})
export class GitHubModule {}
