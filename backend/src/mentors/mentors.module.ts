import { Module } from '@nestjs/common';
import { MentorsController } from './mentors.controller';
import { MentorsService } from './mentors.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [SupabaseModule, MailModule],
  controllers: [MentorsController],
  providers: [MentorsService],
  exports: [MentorsService],
})
export class MentorsModule {}
