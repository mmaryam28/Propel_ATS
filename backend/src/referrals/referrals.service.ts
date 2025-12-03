import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateReferralRequestDto, UpdateReferralRequestDto, GenerateTemplateDto } from './dto/referral.dto';

@Injectable()
export class ReferralsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get all referral requests for a user
   */
  async getAllReferrals(userId: string, filters?: any) {
    const supabase = this.supabaseService.getClient();
    
    let query = supabase
      .from('referral_requests')
      .select(`
        *,
        job:jobs(id, title, company, status),
        contact:professional_contacts(id, full_name, company, role, email, linkedin_profile_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.jobId) {
      query = query.eq('job_id', filters.jobId);
    }

    const { data, error } = await query;

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Get a single referral request by ID
   */
  async getReferralById(userId: string, referralId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('referral_requests')
      .select(`
        *,
        job:jobs(id, title, company, location, status, postingUrl),
        contact:professional_contacts(id, full_name, headline, company, role, industry, email, phone, linkedin_profile_url)
      `)
      .eq('id', referralId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new HttpException('Referral request not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Generate referral request template
   */
  async generateTemplate(userId: string, dto: GenerateTemplateDto) {
    const supabase = this.supabaseService.getClient();

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', dto.jobId)
      .eq('userId', userId)
      .single();

    if (jobError) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    // Fetch contact details
    const { data: contact, error: contactError } = await supabase
      .from('professional_contacts')
      .select('*')
      .eq('id', dto.contactId)
      .eq('user_id', userId)
      .single();

    if (contactError) {
      throw new HttpException('Contact not found', HttpStatus.NOT_FOUND);
    }

    // Generate template
    const template = this.buildTemplate(job, contact);

    return { template, job, contact };
  }

  /**
   * Build referral request template
   */
  private buildTemplate(job: any, contact: any): string {
    const contactName = contact.full_name.split(' ')[0]; // First name
    const jobTitle = job.title;
    const companyName = job.company;

    return `Hi ${contactName},

I hope this message finds you well! I wanted to reach out because I'm very interested in the ${jobTitle} position at ${companyName}.

Given your experience at ${contact.company || companyName}${contact.role ? ` as a ${contact.role}` : ''}, I thought you might be able to provide some valuable insights or potentially refer me for this role.

I believe my background and skills align well with this opportunity, and I would greatly appreciate any guidance or support you could offer in the application process.

Would you be open to discussing this further? I'd be happy to share my resume and provide any additional information that would be helpful.

Thank you for considering my request!

Best regards`;
  }

  /**
   * Create a new referral request
   */
  async createReferral(userId: string, dto: CreateReferralRequestDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('referral_requests')
      .insert({
        user_id: userId,
        job_id: dto.jobId,
        contact_id: dto.contactId,
        request_template: dto.requestTemplate,
        notes: dto.notes,
        status: 'pending',
      })
      .select(`
        *,
        job:jobs(id, title, company),
        contact:professional_contacts(id, full_name, company, role)
      `)
      .single();

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Update a referral request
   */
  async updateReferral(userId: string, referralId: string, dto: UpdateReferralRequestDto) {
    const supabase = this.supabaseService.getClient();

    // Verify ownership
    await this.getReferralById(userId, referralId);

    // Track status change in history if status is being updated
    if (dto.status) {
      const { data: currentReferral } = await supabase
        .from('referral_requests')
        .select('status')
        .eq('id', referralId)
        .single();

      if (currentReferral && currentReferral.status !== dto.status) {
        await supabase.from('referral_request_history').insert({
          referral_request_id: referralId,
          old_status: currentReferral.status,
          new_status: dto.status,
          changed_by: userId,
        });
      }
    }

    const updateData: any = {};
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.requestTemplate !== undefined) updateData.request_template = dto.requestTemplate;
    if (dto.sentDate !== undefined) updateData.sent_date = dto.sentDate;
    if (dto.followUpDate !== undefined) updateData.follow_up_date = dto.followUpDate;
    if (dto.followUpCount !== undefined) updateData.follow_up_count = dto.followUpCount;
    if (dto.responseDate !== undefined) updateData.response_date = dto.responseDate;
    if (dto.responseType !== undefined) updateData.response_type = dto.responseType;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const { data, error } = await supabase
      .from('referral_requests')
      .update(updateData)
      .eq('id', referralId)
      .eq('user_id', userId)
      .select(`
        *,
        job:jobs(id, title, company),
        contact:professional_contacts(id, full_name, company, role)
      `)
      .single();

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Delete a referral request
   */
  async deleteReferral(userId: string, referralId: string) {
    const supabase = this.supabaseService.getClient();

    // Verify ownership
    await this.getReferralById(userId, referralId);

    const { error } = await supabase
      .from('referral_requests')
      .delete()
      .eq('id', referralId)
      .eq('user_id', userId);

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { message: 'Referral request deleted successfully' };
  }

  /**
   * Get referral statistics
   */
  async getReferralStats(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: referrals, error } = await supabase
      .from('referral_requests')
      .select('status, response_type')
      .eq('user_id', userId);

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const respondedCount = referrals.filter(r => r.status === 'responded').length;
    const acceptedCount = referrals.filter(r => r.response_type === 'accepted').length;

    const stats = {
      total: referrals.length,
      pending: referrals.filter(r => r.status === 'pending').length,
      sent: referrals.filter(r => r.status === 'sent').length,
      responded: respondedCount,
      accepted: acceptedCount,
      declined: referrals.filter(r => r.response_type === 'declined').length,
      successRate: respondedCount > 0 
        ? Math.round((acceptedCount / respondedCount) * 100)
        : 0,
    };

    return stats;
  }

  /**
   * Get referrals needing follow-up
   */
  async getReferralsNeedingFollowUp(userId: string) {
    const supabase = this.supabaseService.getClient();

    const today = new Date().toISOString();

    const { data, error } = await supabase
      .from('referral_requests')
      .select(`
        *,
        job:jobs(id, title, company),
        contact:professional_contacts(id, full_name, company)
      `)
      .eq('user_id', userId)
      .eq('status', 'sent')
      .lte('follow_up_date', today)
      .order('follow_up_date', { ascending: true });

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Get referral request history
   */
  async getReferralHistory(userId: string, referralId: string) {
    const supabase = this.supabaseService.getClient();

    // Verify ownership
    await this.getReferralById(userId, referralId);

    const { data, error } = await supabase
      .from('referral_request_history')
      .select('*')
      .eq('referral_request_id', referralId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }
}
