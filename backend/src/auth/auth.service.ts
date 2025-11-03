import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  // ===== Registration and login (existing) ===================================

  async register(firstname: string, lastname: string, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(password, 10);

    try {
      const user = await this.prisma.user.create({
        data: { firstname, lastname, email: normalizedEmail, password: hash },
      });
      return this.issueLoginForUser(user.id);
    } catch (e: any) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') throw new ConflictException('Email already registered');
        if (e.code === 'P2003') throw new ConflictException('Foreign key constraint failed');
        throw new ConflictException(`Prisma error: ${e.message}`);
      }
      throw new ConflictException(e?.message || 'Unknown error during registration');
    }
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.issueLoginForUser(user.id);
  }

  async loginOrCreateOAuthUser(
    provider: string,
    profile: { email?: string; firstname?: string; lastname?: string },
  ) {
    const email = (profile.email || '').trim().toLowerCase();
    if (!email) throw new UnauthorizedException(`${provider} account does not provide an email`);

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      const hash = await bcrypt.hash(`oauth:${provider}:${email}:${Date.now()}`, 10);
      const firstname = profile.firstname || 'User';
      const lastname = profile.lastname || provider;
      user = await this.prisma.user.create({ data: { email, password: hash, firstname, lastname } });
    }

    return this.issueLoginForUser(user.id);
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async updateUserProfile(userId: string, data: any) {
    const allowed = ['firstname', 'lastname', 'email'];
    const update: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) update[key] = data[key];
    }
    if (update.email) update.email = update.email.trim().toLowerCase();
    return this.prisma.user.update({ where: { id: userId }, data: update });
  }

  // ===== Password reset: UC-006 request =====================================

  async requestPasswordReset(email: string) {
    const normalized = (email || '').trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });

    // Always return generic success, but only create token if user exists
    if (user) {
      // Invalidate any previous unused tokens
      await this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });

      // Generate raw token and store only its hash
      const raw = crypto.randomBytes(48).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const appName = process.env.APP_NAME || 'Propel';
      const resetUrl = `${frontendUrl.replace(/\/+$/, '')}/reset/${raw}`;

      await this.mail.send({
        to: user.email,
        subject: `${appName} password reset`,
        html: `
          <p>We received a request to reset your password for ${appName}.</p>
          <p>This link expires in 1 hour. If you did not request this, you can safely ignore this message.</p>
          <p><a href="${resetUrl}">Reset your password</a></p>
          <p>If the button does not work, copy and paste this URL into your browser:</p>
          <p>${resetUrl}</p>
        `,
      });
    }

    return { message: 'If your email exists, a reset link has been sent.' };
  }

  // ===== Password reset: UC-007 complete ====================================

  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new BadRequestException('Token and password are required');
    }

    // Apply the same policy as registration. Adjust if your registration enforces more.
    this.validatePasswordPolicy(newPassword);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const prt = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!prt || prt.usedAt || prt.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: prt.userId },
        data: { password: passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: prt.userId, usedAt: null, tokenHash: { not: tokenHash } },
      }),
    ]);

    // Auto-login after reset
    return this.issueLoginForUser(prt.userId);
  }

  // ===== Helpers =============================================================

  private validatePasswordPolicy(pw: string) {
    // Minimal example. If your registration has stricter rules, mirror them here.
    if (pw.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
  }

  private async issueLoginForUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    return {
      token: this.jwtService.sign({ sub: user.id.toString(), email: user.email }),
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
      },
      message: 'Login successful',
    };
  }
}
