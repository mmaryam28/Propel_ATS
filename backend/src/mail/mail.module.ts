// src/mail/mail.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
  imports: [ConfigModule],     // so MailService can read from process.env
  providers: [MailService],
  exports: [MailService],      // <-- important: make it available to other modules
})
export class MailModule {}
