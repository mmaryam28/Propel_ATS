import { Module } from '@nestjs/common';
import { RelationshipMaintenanceController } from './relationship-maintenance.controller';
import { RelationshipMaintenanceService } from './relationship-maintenance.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [RelationshipMaintenanceController],
  providers: [RelationshipMaintenanceService],
  exports: [RelationshipMaintenanceService],
})
export class RelationshipMaintenanceModule {}
