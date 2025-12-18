import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ApiMonitoringService } from '../api-monitoring/api-monitoring.service';
import axios from 'axios';

@Injectable()
export class LinkedinAuthService {
  private readonly clientId = process.env.LINKEDIN_CLIENT_ID;
  private readonly clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  private readonly redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/linkedin-auth/callback';

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly apiMonitoringService: ApiMonitoringService,
  ) {}

  /**
   * Generate LinkedIn OAuth URL
   */
  getAuthorizationUrl(state?: string): string {
    const scope = 'openid profile email';
    const randomState = state || this.generateRandomState();
    
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&state=${encodeURIComponent(randomState)}&scope=${encodeURIComponent(scope)}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<any> {
    const start = Date.now();
    const serviceName = 'LinkedIn API';
    const quota = 500; // LinkedIn API quota varies by app, typically 500 calls/day

    try {
      const response = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        null,
        {
          params: {
            grant_type: 'authorization_code',
            code,
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.apiMonitoringService.recordUsage(serviceName, quota, Date.now() - start);
      return response.data;
    } catch (error) {
      this.apiMonitoringService.recordError(serviceName, error?.response?.data?.message || error?.message || String(error));
      console.error('LinkedIn token exchange error:', error.response?.data || error.message);
      throw new HttpException(
        'Failed to exchange authorization code',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Fetch LinkedIn profile data using OpenID Connect
   */
  async getLinkedInProfile(accessToken: string): Promise<any> {
    const start = Date.now();
    const serviceName = 'LinkedIn API';
    const quota = 500;

    try {
      const profileResponse = await axios.get(
        'https://api.linkedin.com/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      this.apiMonitoringService.recordUsage(serviceName, quota, Date.now() - start);
      return profileResponse.data;
    } catch (error) {
      this.apiMonitoringService.recordError(serviceName, error?.response?.data?.message || error?.message || String(error));
      console.error('LinkedIn profile fetch error:', error.response?.data || error.message);
      throw new HttpException(
        'Failed to fetch LinkedIn profile',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Save or update linked account in Supabase
   */
  async saveLinkedAccount(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    profileData: any
  ) {
    const supabase = this.supabaseService.getClient();
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from('linked_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'linkedin')
      .single();

    if (existingAccount) {
      // Update existing account
      const { data, error } = await supabase
        .from('linked_accounts')
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          linked_profile: profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAccount.id)
        .select()
        .single();

      if (error) {
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return data;
    } else {
      // Create new account
      const { data, error } = await supabase
        .from('linked_accounts')
        .insert({
          user_id: userId,
          provider: 'linkedin',
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          linked_profile: profileData,
        })
        .select()
        .single();

      if (error) {
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return data;
    }
  }

  /**
   * Get linked account for user
   */
  async getLinkedAccount(userId: string, provider: string = 'linkedin') {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('linked_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Disconnect linked account
   */
  async disconnectAccount(userId: string, provider: string = 'linkedin') {
    const supabase = this.supabaseService.getClient();

    const { data: account } = await supabase
      .from('linked_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (!account) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }

    const { error } = await supabase
      .from('linked_accounts')
      .delete()
      .eq('id', account.id);

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { message: 'Account disconnected successfully' };
  }

  /**
   * Import LinkedIn profile data as a professional contact
   */
  async importProfileAsContact(userId: string, profileData: any) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('professional_contacts')
      .insert({
        user_id: userId,
        full_name: profileData.name || `${profileData.given_name} ${profileData.family_name}`,
        headline: profileData.headline || null,
        email: profileData.email || null,
        linkedin_profile_url: profileData.profile || profileData.sub || null,
        source: 'linkedin',
        relationship_type: 'self',
      })
      .select()
      .single();

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
