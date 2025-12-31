import {
  Body,
  Controller,
  Post,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Get,
  Put,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const firstname = (body as any).firstname ?? (body as any).firstName ?? body.firstname;
    const lastname  = (body as any).lastname  ?? (body as any).lastName  ?? body.lastname;

    if (body.password !== body.confirmPassword) {
      throw new BadRequestException({ error: 'Passwords do not match' });
    }

    try {
      return await this.authService.register(firstname, lastname, body.email, body.password);
    } catch (e: any) {
      throw new BadRequestException({ error: e.message || 'Registration failed' });
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    try {
      return await this.authService.login(body.email, body.password);
    } catch (e: any) {
      throw new BadRequestException({ error: e.message || 'Login failed' });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req) {
    const userId = req.user.userId;
    const user = await this.authService.getUserById(userId);
    if (!user) throw new BadRequestException({ error: 'User not found' });
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateMe(@Req() req, @Body() body) {
    const userId = req.user.userId;
    try {
      const updated = await this.authService.updateUserProfile(userId, body);
      return { user: updated };
    } catch (e: any) {
      throw new BadRequestException({ error: e.message || 'Update failed' });
    }
  }

  // ---------- Password reset (new) ----------
  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; password: string }) {
    const { token, password } = body || {};
    if (!token || !password) {
      throw new BadRequestException({ error: 'Token and password are required' });
    }
    try {
      return await this.authService.resetPassword(token, password);
    } catch (e: any) {
      // Keep message shape consistent with your frontend expectations
      throw new BadRequestException({ message: e?.message || 'Invalid or expired reset link' });
    }
  }

  // ---------- Google OAuth ----------
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res: any) {
    const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    try {
      const result = await this.authService.loginOrCreateOAuthUser('google', req.user);
      return res.redirect(`${frontend}/login?token=${encodeURIComponent(result.token)}`);
    } catch (e: any) {
      return res.redirect(`${frontend}/login?error=${encodeURIComponent(e?.message || 'Google login failed')}`);
    }
  }

  // ---------- LinkedIn OAuth ----------
  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinAuth() {
    console.log('LinkedIn auth initiated');
  }

  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinCallback(@Req() req, @Res() res: any) {
    console.log('LinkedIn callback hit, user:', req.user);
    const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    try {
      if (!req.user) {
        console.error('No user in request after LinkedIn auth');
        return res.redirect(`${frontend}/login?error=${encodeURIComponent('Authentication failed')}`);
      }
      const result = await this.authService.loginOrCreateOAuthUser('linkedin', req.user);
      return res.redirect(`${frontend}/login?token=${encodeURIComponent(result.token)}`);
    } catch (e: any) {
      console.error('LinkedIn callback error:', e);
      return res.redirect(`${frontend}/login?error=${encodeURIComponent(e?.message || 'LinkedIn login failed')}`);
    }
  }
}
