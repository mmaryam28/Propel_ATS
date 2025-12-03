import { Controller, Get, Query, Req, Res, UseGuards, Delete, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LinkedinAuthService } from './linkedin-auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Response } from 'express';

@Controller('linkedin-auth')
export class LinkedinAuthController {
  constructor(private readonly linkedinAuthService: LinkedinAuthService) {}

  /**
   * Get LinkedIn OAuth authorization URL
   * GET /linkedin-auth/url
   */
  @Get('url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@Query('state') state?: string) {
    const authUrl = this.linkedinAuthService.getAuthorizationUrl(state);
    return { url: authUrl };
  }

  /**
   * Initiate LinkedIn OAuth flow (redirects to LinkedIn)
   * GET /linkedin-auth/connect?state=<userId>
   */
  @Get('connect')
  @UseGuards(AuthGuard('linkedin-networking'))
  connect(@Req() req: any, @Query('state') state: string) {
    // The state parameter will be automatically passed through by passport to LinkedIn
    // and LinkedIn will return it in the callback URL
  }

  /**
   * LinkedIn OAuth callback
   * GET /linkedin-auth/callback?code=xxx&state=xxx
   */
  @Get('callback')
  @UseGuards(AuthGuard('linkedin-networking'))
  async callback(
    @Req() req: any,
    @Query('state') state: string,
    @Res() res: Response
  ) {
    try {
      const profile = req.user; // Profile data from the strategy
      
      // state parameter contains the userId (may be URL encoded)
      const userId = state ? decodeURIComponent(state) : null;
      if (!userId) {
        console.error('No userId in state parameter');
        return res.redirect(`${process.env.FRONTEND_URL}/networking/contacts?error=no_user_id`);
      }
      
      console.log('=== LinkedIn Callback Debug ===');
      console.log('User ID from state:', userId);
      console.log('LinkedIn profile from strategy:', profile);

      // Extract access token from request (passport stores it)
      const accessToken = req.authInfo?.accessToken || profile.accessToken;
      console.log('Access token available:', !!accessToken);

      // Fetch full LinkedIn profile using OpenID Connect userinfo
      const profileData = await this.linkedinAuthService.getLinkedInProfile(accessToken);
      console.log('Profile data fetched:', profileData);

      // Save linked account
      const savedAccount = await this.linkedinAuthService.saveLinkedAccount(
        userId,
        accessToken,
        '', // refresh token not provided by LinkedIn anymore
        3600, // default expiry
        profileData
      );
      console.log('Account saved to DB:', savedAccount ? 'SUCCESS' : 'FAILED');
      console.log('Saved account ID:', savedAccount?.id);

      // Redirect to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/networking/contacts?linkedin_connected=true`);
    } catch (error) {
      console.error('LinkedIn callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/networking/contacts?error=linkedin_auth_failed`);
    }
  }

  /**
   * Get linked account status
   * GET /linkedin-auth/status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Req() req: any) {
    const userId = req.user.userId;
    console.log('=== LinkedIn Status Check ===');
    console.log('Checking status for userId:', userId);
    
    const account = await this.linkedinAuthService.getLinkedAccount(userId);
    console.log('Account found:', !!account);
    if (account) {
      console.log('Account ID:', account.id);
      console.log('Profile data exists:', !!account.linked_profile);
      console.log('Profile data:', account.linked_profile);
    }
    
    const response = {
      connected: !!account,
      account: account ? {
        provider: account.provider,
        linkedAt: account.created_at,
        profile: account.linked_profile,
      } : null,
    };
    
    console.log('Returning response:', JSON.stringify(response, null, 2));
    return response;
  }

  /**
   * Disconnect LinkedIn account
   * DELETE /linkedin-auth/disconnect
   */
  @Delete('disconnect')
  @UseGuards(JwtAuthGuard)
  async disconnect(@Req() req: any) {
    const userId = req.user.userId;
    await this.linkedinAuthService.disconnectAccount(userId);
    
    return {
      message: 'LinkedIn account disconnected successfully',
    };
  }

  /**
   * Import LinkedIn profile as a professional contact
   * POST /linkedin-auth/import-profile
   */
  @Post('import-profile')
  @UseGuards(JwtAuthGuard)
  async importProfile(@Req() req: any) {
    const userId = req.user.userId;
    const account = await this.linkedinAuthService.getLinkedAccount(userId);

    if (!account || !account.linked_profile) {
      return {
        error: 'LinkedIn account not connected or no profile data available',
      };
    }

    const contact = await this.linkedinAuthService.importProfileAsContact(
      userId,
      account.linked_profile
    );

    return {
      message: 'Profile imported successfully',
      contact,
    };
  }
}
