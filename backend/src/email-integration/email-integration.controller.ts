import { Controller, Get, Post, Delete, Body, Query, Param, Request, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { EmailIntegrationService } from './email-integration.service';
import { ConnectGmailDto, SearchEmailsDto, LinkEmailDto } from './dto/email-integration.dto';

@Controller('email-integration')
export class EmailIntegrationController {
  constructor(private readonly emailService: EmailIntegrationService) {}

  /**
   * Get Gmail OAuth URL
   */
  @Get('auth-url')
  getAuthUrl() {
    const url = this.emailService.getAuthUrl();
    return { authUrl: url };
  }

  /**
   * Gmail OAuth callback - receives authorization code from Google
   */
  @Get('callback')
  async handleCallback(@Query('code') code: string, @Query('error') error: string, @Request() req, @Res() res: Response) {
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    
    if (error) {
      return res.redirect(`${frontendUrl}/gmail-callback?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/gmail-callback?error=no_code`);
    }

    try {
      // Get userId from session/cookie or use default for testing
      const userId = req.headers['x-user-id'] || req.cookies?.userId || 'default-user';
      
      await this.emailService.connectGmail(userId, code);
      
      return res.redirect(`${frontendUrl}/gmail-callback?success=true`);
    } catch (err) {
      console.error('Gmail callback error:', err);
      return res.redirect(`${frontendUrl}/gmail-callback?error=connection_failed`);
    }
  }

  /**
   * Check if user has connected Gmail
   */
  @Get('status')
  async getConnectionStatus(@Request() req) {
    const userId = req.headers['x-user-id'] || 'default-user';
    return this.emailService.isConnected(userId);
  }

  /**
   * Connect Gmail account (exchange code for tokens)
   */
  @Post('connect')
  async connectGmail(@Body() dto: ConnectGmailDto, @Request() req) {
    const userId = req.headers['x-user-id'] || 'default-user';
    return this.emailService.connectGmail(userId, dto.code);
  }

  /**
   * Disconnect Gmail account
   */
  @Delete('disconnect')
  async disconnectGmail(@Request() req) {
    const userId = req.headers['x-user-id'] || 'default-user';
    return this.emailService.disconnectGmail(userId);
  }

  /**
   * Search emails
   */
  @Get('search')
  async searchEmails(@Query() query: SearchEmailsDto, @Request() req) {
    const userId = req.headers['x-user-id'] || 'default-user';
    return this.emailService.searchEmails(
      userId,
      query.query,
      query.maxResults || 20,
      query.pageToken
    );
  }

  /**
   * Link email to job application
   */
  @Post('link')
  async linkEmail(@Body() dto: LinkEmailDto, @Request() req) {
    const userId = req.headers['x-user-id'] || 'default-user';
    return this.emailService.linkEmail(userId, dto.jobId, dto.emailId);
  }

  /**
   * Get linked emails for a job
   */
  @Get('job/:jobId')
  async getLinkedEmails(@Param('jobId') jobId: string, @Request() req) {
    const userId = req.headers['x-user-id'] || 'default-user';
    return this.emailService.getLinkedEmails(userId, jobId);
  }

  /**
   * Unlink email from job
   */
  @Delete('unlink/:emailLinkId')
  async unlinkEmail(@Param('emailLinkId') emailLinkId: string, @Request() req) {
    const userId = req.headers['x-user-id'] || 'default-user';
    return this.emailService.unlinkEmail(userId, emailLinkId);
  }
}
