import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileCompletenessService } from './profile-completeness.service';
import { SupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [ProfileController],
  providers: [SupabaseService, ProfileCompletenessService],
})
export class ProfileModule {}
