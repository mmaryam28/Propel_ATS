import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateInformationalInterviewDto,
  UpdateInformationalInterviewDto,
  GenerateOutreachDto,
} from './dto/informational-interview.dto';

@Injectable()
export class InformationalInterviewsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getAllInterviews(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('informational_interviews')
      .select(`
        *,
        professional_contacts (
          id,
          full_name,
          company,
          role,
          email,
          phone,
          linkedin_profile_url,
          industry
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getInterviewById(interviewId: string, userId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('informational_interviews')
      .select(`
        *,
        professional_contacts (
          id,
          full_name,
          company,
          role,
          email,
          phone,
          linkedin_profile_url,
          industry,
          headline
        )
      `)
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single();

    if (error) throw new NotFoundException('Interview request not found');
    return data;
  }

  async createInterview(userId: string, dto: CreateInformationalInterviewDto) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('informational_interviews')
      .insert({
        user_id: userId,
        contact_id: dto.contactId,
        request_status: dto.requestStatus || 'requested',
        scheduled_time: dto.scheduledTime,
        prep_notes: dto.prepNotes,
        outcome_notes: dto.outcomeNotes,
      })
      .select(`
        *,
        professional_contacts (
          id,
          full_name,
          company,
          role,
          email
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateInterview(
    interviewId: string,
    userId: string,
    dto: UpdateInformationalInterviewDto,
  ) {
    // Verify ownership
    await this.getInterviewById(interviewId, userId);

    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('informational_interviews')
      .update({
        request_status: dto.requestStatus,
        scheduled_time: dto.scheduledTime,
        prep_notes: dto.prepNotes,
        outcome_notes: dto.outcomeNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', interviewId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteInterview(interviewId: string, userId: string) {
    // Verify ownership
    await this.getInterviewById(interviewId, userId);

    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('informational_interviews')
      .delete()
      .eq('id', interviewId)
      .eq('user_id', userId);

    if (error) throw error;
    return { message: 'Interview request deleted successfully' };
  }

  async generateOutreachMessage(userId: string, dto: GenerateOutreachDto) {
    const supabase = this.supabaseService.getClient();
    
    // Get contact details
    const { data: contact, error: contactError } = await supabase
      .from('professional_contacts')
      .select('*')
      .eq('id', dto.contactId)
      .eq('user_id', userId)
      .single();

    if (contactError) throw new NotFoundException('Contact not found');

    // Generate personalized outreach message
    const purpose = dto.purpose || 'learn more about their career path and industry insights';
    const topics = dto.topics || 'career development and industry trends';

    const message = `Subject: Request for Informational Interview

Hi ${contact.full_name},

I hope this message finds you well. I came across your profile and was impressed by your experience as a ${contact.role || 'professional'}${contact.company ? ` at ${contact.company}` : ''}.

I'm currently exploring opportunities in ${contact.industry || 'the industry'} and would greatly appreciate the opportunity to learn from your experience. I'm particularly interested in ${purpose}.

Would you be open to a brief 20-30 minute conversation (virtual or in-person, whichever works best for you) to discuss ${topics}?

I'm flexible with timing and happy to work around your schedule. Please let me know if you'd be available, and I'll send over some time options.

Thank you for considering my request. I look forward to the possibility of connecting with you.

Best regards,
[Your Name]`;

    return { message, contact };
  }

  async getInterviewStats(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { count: totalRequests } = await supabase
      .from('informational_interviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: requestedCount } = await supabase
      .from('informational_interviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('request_status', 'requested');

    const { count: scheduledCount } = await supabase
      .from('informational_interviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('request_status', 'scheduled');

    const { count: completedCount } = await supabase
      .from('informational_interviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('request_status', 'completed');

    const { count: declinedCount } = await supabase
      .from('informational_interviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('request_status', 'declined');

    const acceptanceRate =
      totalRequests && totalRequests > 0
        ? Math.round((((scheduledCount || 0) + (completedCount || 0)) / totalRequests) * 100)
        : 0;

    return {
      totalRequests: totalRequests || 0,
      requested: requestedCount || 0,
      scheduled: scheduledCount || 0,
      completed: completedCount || 0,
      declined: declinedCount || 0,
      acceptanceRate,
    };
  }

  async getUpcomingInterviews(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('informational_interviews')
      .select(`
        *,
        professional_contacts (
          id,
          full_name,
          company,
          role,
          email,
          phone
        )
      `)
      .eq('user_id', userId)
      .eq('request_status', 'scheduled')
      .gte('scheduled_time', new Date().toISOString())
      .order('scheduled_time', { ascending: true });

    if (error) throw error;
    return data;
  }

  getPreparationFramework(contactInfo: any) {
    return {
      researchChecklist: [
        `Research ${contactInfo.company || 'the company'}'s recent news and developments`,
        `Review ${contactInfo.full_name}'s LinkedIn profile and career trajectory`,
        `Understand current trends in ${contactInfo.industry || 'the industry'}`,
        'Prepare specific questions based on their expertise',
        'Review your own goals and what you hope to learn',
      ],
      questionTemplates: [
        `Can you tell me about your journey to becoming a ${contactInfo.role || 'professional'}?`,
        'What does a typical day look like in your role?',
        `What skills are most important for success in ${contactInfo.industry || 'this field'}?`,
        'What challenges do you face in your current position?',
        'What advice would you give someone looking to enter this field?',
        'Are there any resources (books, courses, podcasts) you\'d recommend?',
        'How do you see the industry evolving in the next few years?',
        'What do you wish you had known when you were starting your career?',
      ],
      agendaOutline: [
        'Introduction (2-3 minutes): Brief background and purpose of the conversation',
        'Their Career Journey (5-7 minutes): Ask about their path and key decisions',
        'Industry Insights (5-7 minutes): Discuss trends, challenges, and opportunities',
        'Skills & Advice (5-7 minutes): Learn about essential skills and recommendations',
        'Next Steps (3-5 minutes): Ask about resources, additional contacts, or follow-up',
        'Closing (2 minutes): Express gratitude and discuss future connection',
      ],
      followUpTemplate: `Hi ${contactInfo.full_name},

Thank you so much for taking the time to speak with me today. I really appreciated your insights on [SPECIFIC TOPIC] and your advice about [SPECIFIC ADVICE].

I've already started looking into [ACTIONABLE ITEM] that you mentioned, and I'm excited to explore it further.

I'll keep you updated on my progress, and I hope we can stay in touch. Please don't hesitate to reach out if there's anything I can help you with.

Thanks again for your time and generosity.

Best regards,
[Your Name]`,
    };
  }
}
