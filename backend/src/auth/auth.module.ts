// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { MailModule } from '../mail/mail.module';
import { JwtStrategy } from './jwt.strategy';
import { LinkedInStrategy } from './strategies/linkedin.strategy';

// JSON Web Token "ms" style duration string type
type MsString = `${number}${'ms'|'s'|'m'|'h'|'d'|'w'|'y'}`;

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const raw = config.get<string>('JWT_EXPIRES_IN');
        const expiresIn: number | MsString =
          raw && !Number.isNaN(Number(raw)) ? Number(raw) : ((raw as MsString) ?? '7d');

        return {
          secret: config.get<string>('JWT_SECRET') ?? 'changeme',
          signOptions: { expiresIn },
        };
      },
    }),
    MailModule, // <-- ensures MailService is available here
    SupabaseModule, // <-- provides SupabaseService
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LinkedInStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
