import { Module } from '@nestjs/common';
import { MentorController } from './mentor.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [SupabaseModule, AuthModule, MailModule],
  controllers: [MentorController],
})
export class MentorModule {}
