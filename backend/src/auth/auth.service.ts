import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private supabase: SupabaseService,
    private mail: MailService,
  ) {}

  // ===== Registration and login (existing) ===================================

  async register(firstname: string, lastname: string, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const client = this.supabase.getClient();

    // Check if user already exists
    const { data: existing } = await client
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existing) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(password, 10);

    try {
      const { data: user, error } = await client
        .from('users')
        .insert({
          firstname,
          lastname,
          email: normalizedEmail,
          password: hash,
        })
        .select()
        .single();

      if (error) throw new ConflictException(error.message);
      if (!user) throw new ConflictException('Failed to create user');

      return this.issueLoginForUser(user.id);
    } catch (e: any) {
      if (e.code === '23505') throw new ConflictException('Email already registered');
      throw new ConflictException(e?.message || 'Unknown error during registration');
    }
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const client = this.supabase.getClient();

    const { data: user, error } = await client
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (error || !user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.issueLoginForUser(user.id);
  }

  async loginOrCreateOAuthUser(
    provider: string,
    profile: { email?: string; firstname?: string; lastname?: string; profilePicture?: string },
  ) {
    const email = (profile.email || '').trim().toLowerCase();
    if (!email) throw new UnauthorizedException(`${provider} account does not provide an email`);
    const client = this.supabase.getClient();

    let { data: user } = await client
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      const hash = await bcrypt.hash(`oauth:${provider}:${email}:${Date.now()}`, 10);
      const firstname = profile.firstname || 'User';
      const lastname = profile.lastname || provider;
      
      const insertData: any = { email, password: hash, firstname, lastname };
      if (profile.profilePicture) {
        insertData.profile_picture = profile.profilePicture;
      }
      
      const { data: newUser, error } = await client
        .from('users')
        .insert(insertData)
        .select()
        .single();

      if (error || !newUser) throw new ConflictException('Failed to create OAuth user');
      user = newUser;
    } else if (profile.profilePicture && !user.profile_picture) {
      // Update existing user with profile picture if they don't have one
      await client
        .from('users')
        .update({ profile_picture: profile.profilePicture })
        .eq('id', user.id);
    }

    return this.issueLoginForUser(user.id);
  }

  async getUserById(userId: string) {
    const client = this.supabase.getClient();
    const { data } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    console.log('getUserById result for', userId, ':', data?.profile_picture ? 'has profile_picture' : 'no profile_picture');
    return data;
  }

  async updateUserProfile(userId: string, data: any) {
    const allowed = ['firstname', 'lastname', 'email', 'bio', 'phone', 'role', 'title', 'location', 'linkedin_url', 'github_url', 'portfolio_url'];
    const update: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) update[key] = data[key];
    }
    if (update.email) update.email = update.email.trim().toLowerCase();
    
    // Auto-add https:// to URLs if they don't have a protocol
    const urlFields = ['linkedin_url', 'github_url', 'portfolio_url'];
    for (const field of urlFields) {
      if (update[field] && update[field].trim() && !update[field].match(/^https?:\/\//i)) {
        update[field] = 'https://' + update[field].trim();
      }
    }
    
    const client = this.supabase.getClient();
    const { data: updatedUser, error } = await client
      .from('users')
      .update(update)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return updatedUser;
  }

  // ===== Password reset: UC-006 request =====================================

  async requestPasswordReset(email: string) {
    const normalized = (email || '').trim().toLowerCase();
    const client = this.supabase.getClient();

    const { data: user } = await client
      .from('users')
      .select('*')
      .eq('email', normalized)
      .single();

    // Always return generic success, but only create token if user exists
    if (user) {
      // Invalidate any previous unused tokens
      await client
        .from('PasswordResetToken')
        .delete()
        .eq('userId', user.id)
        .is('usedAt', null);

      // Generate raw token and store only its hash
      const raw = crypto.randomBytes(48).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await client
        .from('PasswordResetToken')
        .insert({
          userId: user.id,
          tokenHash,
          expiresAt: expiresAt.toISOString(),
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
    const client = this.supabase.getClient();

    const { data: prt, error } = await client
      .from('PasswordResetToken')
      .select('*, user:users(*)')
      .eq('tokenHash', tokenHash)
      .single();

    if (error || !prt || prt.usedAt || new Date(prt.expiresAt) < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await client
      .from('users')
      .update({ password: passwordHash })
      .eq('id', prt.userId);

    // Mark token as used
    await client
      .from('PasswordResetToken')
      .update({ usedAt: new Date().toISOString() })
      .eq('tokenHash', tokenHash);

    // Delete other unused tokens for this user
    await client
      .from('PasswordResetToken')
      .delete()
      .eq('userId', prt.userId)
      .is('usedAt', null)
      .neq('tokenHash', tokenHash);

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
    const client = this.supabase.getClient();
    const { data: user, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) throw new UnauthorizedException('User not found');

    return {
      token: this.jwtService.sign({ userId: user.id.toString(), sub: user.id.toString(), email: user.email }),
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
