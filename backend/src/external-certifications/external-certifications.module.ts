import { Module } from '@nestjs/common';
import { ExternalCertificationsController } from './external-certifications.controller';
import { ExternalCertificationsService } from './external-certifications.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [ExternalCertificationsController],
  providers: [ExternalCertificationsService],
  exports: [ExternalCertificationsService],
})
export class ExternalCertificationsModule {}
