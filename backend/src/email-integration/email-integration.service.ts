import { Injectable, BadRequestException, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class EmailIntegrationService {
  private oauth2Client: OAuth2Client;

  constructor(
    private supabase: SupabaseService,
  ) {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/email-integration/callback';

    if (!clientId || !clientSecret) {
      console.warn('Gmail OAuth credentials not configured. Email integration will be disabled.');
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
  }

  /**
   * Generate Gmail OAuth URL for user consent
   */
  getAuthUrl(): string {
    if (!process.env.GMAIL_CLIENT_ID) {
      throw new BadRequestException('Gmail integration not configured');
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      prompt: 'consent',
    });
  }

  /**
   * Exchange authorization code for tokens and store them
   */
  async connectGmail(userId: string, code: string): Promise<{ success: boolean }> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      const supabaseClient = this.supabase.getClient();
      
      // Upsert token data
      const { error } = await supabaseClient
        .from('gmail_tokens')
        .upsert({
          userId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          scope: tokens.scope,
          updatedAt: new Date().toISOString(),
        }, {
          onConflict: 'userId'
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      throw new BadRequestException('Failed to connect Gmail account');
    }
  }

  /**
   * Get stored tokens for a user and refresh if needed
   */
  private async getTokens(userId: string): Promise<any> {
    const supabaseClient = this.supabase.getClient();
    
    const { data, error } = await supabaseClient
      .from('gmail_tokens')
      .select('*')
      .eq('userId', userId)
      .single();

    if (error || !data) {
      throw new UnauthorizedException('Gmail account not connected. Please connect your Gmail account first.');
    }

    // Check if token needs refresh
    const now = new Date();
    const expiry = data.tokenExpiry ? new Date(data.tokenExpiry) : null;
    
    if (expiry && expiry < now && data.refreshToken) {
      // Token expired, refresh it
      this.oauth2Client.setCredentials({
        refresh_token: data.refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Update stored tokens
      await supabaseClient
        .from('gmail_tokens')
        .update({
          accessToken: credentials.access_token,
          tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
          updatedAt: new Date().toISOString(),
        })
        .eq('userId', userId);

      return credentials;
    }

    return {
      access_token: data.accessToken,
      refresh_token: data.refreshToken,
      expiry_date: data.tokenExpiry ? new Date(data.tokenExpiry).getTime() : null,
    };
  }

  /**
   * Check if user has connected Gmail
   */
  async isConnected(userId: string): Promise<{ connected: boolean }> {
    const supabaseClient = this.supabase.getClient();
    
    const { data, error } = await supabaseClient
      .from('gmail_tokens')
      .select('id')
      .eq('userId', userId)
      .single();

    return { connected: !error && !!data };
  }

  /**
   * Disconnect Gmail account
   */
  async disconnectGmail(userId: string): Promise<{ success: boolean }> {
    const supabaseClient = this.supabase.getClient();
    
    const { error } = await supabaseClient
      .from('gmail_tokens')
      .delete()
      .eq('userId', userId);

    if (error) throw error;

    return { success: true };
  }

  /**
   * Search emails using Gmail API
   */
  async searchEmails(
    userId: string,
    query: string = '',
    maxResults: number = 20,
    pageToken?: string
  ): Promise<any> {
    const serviceName = 'GmailAPI';
    const quota = 1000; // Example quota, adjust as needed
    const start = Date.now();
    try {
      const tokens = await this.getTokens(userId);
      this.oauth2Client.setCredentials(tokens);

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Search messages
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
        pageToken,
      });

      if (!listResponse.data.messages) {
        return { emails: [], nextPageToken: null };
      }

      // Fetch full metadata for each message
      const emailPromises = listResponse.data.messages.map(async (message) => {
        const msgResponse = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        });

        const headers = msgResponse.data.payload?.headers || [];
        const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
        const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '';
        const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date')?.value || '';

        // Parse "From" header to extract name and email
        const fromMatch = fromHeader.match(/^(.*?)\s*<(.+?)>$/) || fromHeader.match(/^(.+)$/);
        const fromName = fromMatch?.[1]?.trim().replace(/^"|"$/g, '') || '';
        const fromEmail = fromMatch?.[2]?.trim() || fromMatch?.[1]?.trim() || '';

        return {
          id: msgResponse.data.id || '',
          threadId: msgResponse.data.threadId || '',
          subject: subjectHeader,
          fromEmail,
          fromName,
          receivedDate: dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString(),
          snippet: msgResponse.data.snippet || '',
          isRead: !msgResponse.data.labelIds?.includes('UNREAD'),
          labels: msgResponse.data.labelIds || [],
        };
      });

      const emails = await Promise.all(emailPromises);

      return {
        emails,
        nextPageToken: listResponse.data.nextPageToken || null,
      };
    } catch (error) {
      console.error('Error searching emails:', error);
      throw new BadRequestException('Failed to search emails. Please try again.');
    }
  }

  /**
   * Link an email to a job application
   */
  async linkEmail(userId: string, jobId: string, emailId: string): Promise<any> {
    try {
      // First, fetch the email metadata from Gmail
      const tokens = await this.getTokens(userId);
      this.oauth2Client.setCredentials(tokens);

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      const msgResponse = await gmail.users.messages.get({
        userId: 'me',
        id: emailId,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });

      const headers = msgResponse.data.payload?.headers || [];
      const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
      const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '';
      const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date')?.value || '';

      const fromMatch = fromHeader.match(/^(.*?)\s*<(.+?)>$/) || fromHeader.match(/^(.+)$/);
      const fromName = fromMatch?.[1]?.trim().replace(/^"|"$/g, '') || '';
      const fromEmail = fromMatch?.[2]?.trim() || fromMatch?.[1]?.trim() || '';

      // Store in database
      const supabaseClient = this.supabase.getClient();
      
      const { data, error } = await supabaseClient
        .from('job_emails')
        .insert({
          jobId,
          userId,
          emailId,
          threadId: msgResponse.data.threadId || '',
          subject: subjectHeader,
          fromEmail,
          fromName,
          receivedDate: dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString(),
          snippet: msgResponse.data.snippet || '',
          isRead: !msgResponse.data.labelIds?.includes('UNREAD'),
          labels: msgResponse.data.labelIds || [],
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new BadRequestException('This email is already linked to a job application');
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error linking email:', error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to link email');
    }
  }

  /**
   * Get emails linked to a specific job
   */
  async getLinkedEmails(userId: string, jobId: string): Promise<any[]> {
    const supabaseClient = this.supabase.getClient();
    
    const { data, error } = await supabaseClient
      .from('job_emails')
      .select('*')
      .eq('userId', userId)
      .eq('jobId', jobId)
      .order('receivedDate', { ascending: false });

    if (error) throw error;

    return data || [];
  }

  /**
   * Unlink an email from a job application
   */
  async unlinkEmail(userId: string, emailLinkId: string): Promise<{ success: boolean }> {
    const supabaseClient = this.supabase.getClient();
    
    const { error } = await supabaseClient
      .from('job_emails')
      .delete()
      .eq('id', emailLinkId)
      .eq('userId', userId);

    if (error) throw error;

    return { success: true };
  }

  /**
   * Suggest status based on email keywords
   */
  suggestStatus(subject: string, snippet: string): string | null {
    const text = `${subject} ${snippet}`.toLowerCase();
    
    if (text.match(/\b(interview|schedule|meeting|zoom|teams|call)\b/i)) {
      return 'Interview';
    }
    if (text.match(/\b(offer|congratulations|welcome aboard|pleased to offer)\b/i)) {
      return 'Offer';
    }
    if (text.match(/\b(reject|regret|unfortunately|not moving forward|other candidates)\b/i)) {
      return 'Rejected';
    }
    if (text.match(/\b(application received|thank you for applying|reviewing)\b/i)) {
      return 'Applied';
    }
    
    return null;
  }
}
