// backend/src/mail/mail.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {
    const host = String(this.config.get('SMTP_HOST') ?? '').trim();
    const portStr = String(this.config.get('SMTP_PORT') ?? '587').trim();
    const port = Number(portStr);
    const user = String(this.config.get('SMTP_USER') ?? '').trim();
    const pass = String(this.config.get('SMTP_PASS') ?? '').trim();
    const secure = port === 465; // SSL

    // Log what we actually loaded (never log the password)
    this.logger.log(
      `[SMTP] host=${host || '[MISSING]'} port=${port || '[MISSING]'} secure=${secure} user=${user ? '[SET]' : '[MISSING]'} pass=${pass ? '[SET]' : '[MISSING]'}`
    );

    if (!host || !port || !user || !pass) {
      this.logger.error('SMTP config missing. Check backend/.env values for SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure, // true for 465, false for 587
      auth: { user, pass },
    });
  }

  async onModuleInit() {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified.');
    } catch (err: any) {
      this.logger.error(`SMTP verification failed: ${err?.message || err}`);
    }
  }

  async send(opts: { to: string; subject: string; html: string }) {
    const from = (this.config.get<string>('EMAIL_FROM') ?? 'no-reply@example.com').trim();
    this.logger.debug(`Sending email to ${opts.to}: "${opts.subject}"`);
    return this.transporter.sendMail({ from, ...opts });
  }
}
