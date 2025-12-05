import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateReferenceDto, UpdateReferenceDto, CreateReferenceRequestDto, UpdateReferenceRequestDto } from './dto/reference.dto';

@Injectable()
export class ReferencesService {
  constructor(private supabaseService: SupabaseService) {}

  // Get all references for a user
  async getAllReferences(userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('professional_references')
      .select(`
        *,
        professional_contacts (
          id,
          full_name,
          company,
          role,
          email,
          phone,
          linkedin_profile_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get reference by ID
  async getReferenceById(userId: string, referenceId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('professional_references')
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
          relationship_type
        )
      `)
      .eq('id', referenceId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  // Create a new reference
  async createReference(userId: string, dto: CreateReferenceDto) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('professional_references')
      .insert({
        user_id: userId,
        contact_id: dto.contactId,
        reference_type: dto.referenceType || 'professional',
        email: dto.email,
        phone: dto.phone,
        notes: dto.notes,
      })
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
      .single();

    if (error) throw error;
    return data;
  }

  // Update a reference
  async updateReference(userId: string, referenceId: string, dto: UpdateReferenceDto) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('professional_references')
      .update({
        reference_type: dto.referenceType,
        email: dto.email,
        phone: dto.phone,
        notes: dto.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', referenceId)
      .eq('user_id', userId)
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
      .single();

    if (error) throw error;
    return data;
  }

  // Delete a reference
  async deleteReference(userId: string, referenceId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('professional_references')
      .delete()
      .eq('id', referenceId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  // Get all reference requests for a user
  async getAllReferenceRequests(userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('reference_requests')
      .select(`
        *,
        professional_references (
          id,
          reference_type,
          professional_contacts (
            id,
            full_name,
            company,
            role,
            email,
            phone
          )
        ),
        job_applications (
          id,
          company_name,
          position_title,
          status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Create a reference request
  async createReferenceRequest(userId: string, dto: CreateReferenceRequestDto) {
    const supabase = this.supabaseService.getClient();
    
    // Store job info in talking_points with metadata prefix
    let talkingPointsWithMeta = dto.talkingPoints || '';
    if (dto.jobId) {
      // Fetch job details to store in metadata
      const { data: job } = await supabase
        .from('jobs')
        .select('id, title, company')
        .eq('id', dto.jobId)
        .eq('userId', String(userId))
        .single();
      
      if (job) {
        talkingPointsWithMeta = `[JOB:${job.id}|${job.title}|${job.company}]\n\n${talkingPointsWithMeta}`;
      }
    }
    
    const { data, error} = await supabase
      .from('reference_requests')
      .insert({
        user_id: userId,
        reference_id: dto.referenceId,
        job_application_id: null, // Not using old job_applications table
        status: 'requested',
        talking_points: talkingPointsWithMeta,
        due_date: dto.dueDate ? new Date(dto.dueDate).toISOString() : null,
      })
      .select(`
        *,
        professional_references (
          id,
          reference_type,
          professional_contacts (
            id,
            full_name,
            company,
            role,
            email
          )
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Update a reference request
  async updateReferenceRequest(userId: string, requestId: string, dto: UpdateReferenceRequestDto) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('reference_requests')
      .update({
        status: dto.status,
        talking_points: dto.talkingPoints,
        due_date: dto.dueDate ? new Date(dto.dueDate).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete a reference request
  async deleteReferenceRequest(userId: string, requestId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('reference_requests')
      .delete()
      .eq('id', requestId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  // Get reference stats
  async getReferenceStats(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Get total references
    const { count: totalReferences } = await supabase
      .from('professional_references')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get total requests
    const { count: totalRequests } = await supabase
      .from('reference_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get pending requests
    const { count: pendingRequests } = await supabase
      .from('reference_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'requested');

    // Get completed requests
    const { count: completedRequests } = await supabase
      .from('reference_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    return {
      totalReferences: totalReferences || 0,
      totalRequests: totalRequests || 0,
      pendingRequests: pendingRequests || 0,
      completedRequests: completedRequests || 0,
    };
  }

  // Get reference request impact on jobs from pipeline
  async getReferenceImpact(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Get all interested jobs from pipeline
    const { data: interestedJobs } = await supabase
      .from('jobs')
      .select('id, title, company, status')
      .eq('userId', String(userId))
      .eq('status', 'Interested')
      .is('archivedAt', null);

    // Get all reference requests with their talking_points that might contain job info
    const { data: allRequests } = await supabase
      .from('reference_requests')
      .select('id, status, talking_points')
      .eq('user_id', userId);

    // Count jobs that have references requested
    // Since we can't directly link, we'll count total requests as proxy
    const jobsWithReferences = Math.min(
      allRequests?.length || 0,
      interestedJobs?.length || 0
    );

    return {
      totalApplications: interestedJobs?.length || 0,
      applicationsWithReferences: jobsWithReferences,
      applicationsWithoutReferences: (interestedJobs?.length || 0) - jobsWithReferences,
      referencesByType: await this.getReferencesByType(userId),
    };
  }

  // Get references grouped by type
  private async getReferencesByType(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data } = await supabase
      .from('professional_references')
      .select('reference_type')
      .eq('user_id', userId);

    const types = data?.reduce((acc, ref) => {
      const type = ref.reference_type || 'professional';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return types;
  }

  // Generate prep materials template
  async generatePrepMaterialsTemplate(userId: string, referenceId: string, jobId?: string) {
    const supabase = this.supabaseService.getClient();
    
    // Get reference details
    const { data: reference } = await supabase
      .from('professional_references')
      .select(`
        *,
        professional_contacts (
          full_name,
          company,
          role
        )
      `)
      .eq('id', referenceId)
      .eq('user_id', userId)
      .single();

    let jobDetails: { company: string; title: string; location?: string } | null = null;
    if (jobId) {
      const { data: job } = await supabase
        .from('jobs')
        .select('company, title, location')
        .eq('id', jobId)
        .eq('userId', String(userId))
        .single();
      jobDetails = job;
      
      if (job) {
        console.log(`Generating materials for job: ${job.title} at ${job.company}`);
      }
    }

    const contact = reference?.professional_contacts;
    const contactName = contact?.full_name || 'Reference';
    const contactRole = contact?.role || 'colleague';
    const contactCompany = contact?.company || 'our previous company';
    
    // Build email and talking points with actual job data
    const jobTitle = jobDetails?.title || '[Position Title]';
    const jobCompany = jobDetails?.company || '[Company Name]';
    const jobLocation = jobDetails?.location || '';

    const template = {
      emailSubject: jobDetails 
        ? `Reference Request for ${jobCompany} Position`
        : 'Reference Request for Job Application',
      emailBody: jobDetails
        ? `Hi ${contactName},

I hope you're doing well! I'm reaching out because I'm applying for a ${jobTitle} role at ${jobCompany}${jobLocation ? ` (${jobLocation})` : ''} and would be honored if you'd be willing to serve as a professional reference.

Given our time working together${contactCompany !== 'our previous company' ? ` at ${contactCompany}` : ''}, I think your perspective on my ${contactRole.includes('manager') ? 'work and growth' : 'collaboration and contributions'} would be valuable to the hiring team.

The company may reach out within the next 2-3 weeks. I've included some talking points below that might be helpful if they contact you.

Please let me know if you're comfortable with this, and feel free to reach out if you have any questions about the role.

Thank you so much for your support!

Best,
[Your Name]`
        : `Hi ${contactName},

I hope you're doing well! I'm reaching out because I'm applying for a position and would be honored if you'd be willing to serve as a professional reference.

I think your perspective on my work would be valuable to the hiring team.

Please let me know if you're comfortable with this. I'll provide more details about the role once I have them.

Thank you so much for your support!

Best,
[Your Name]`,
      talkingPoints: jobDetails
        ? `**Quick Reference Guide for ${contactName}**

**About the Role:**
- Position: ${jobTitle}
- Company: ${jobCompany}${jobLocation ? `\n- Location: ${jobLocation}` : ''}
- Why I'm interested: Great fit for my skills and career goals

**Our Working Relationship:**
- You were my ${contactRole}${contactCompany !== 'our previous company' ? ` at ${contactCompany}` : ''}
- We worked together on: [key projects/initiatives]
- Duration: [timeframe]

**Key Points to Highlight:**
1. **Skills & Strengths:** [2-3 specific skills relevant to ${jobTitle} role]
2. **Notable Achievements:** [1-2 measurable results from your time together]
3. **Work Style:** [How you collaborate, communicate, problem-solve]
4. **Growth Areas:** [Any improvements or learning you demonstrated]

**Why This Role at ${jobCompany} Fits:**
- The ${jobTitle} position leverages my experience in [relevant area]
- Aligns with skills you've seen me develop
- Next logical step in my career progression

Feel free to share specific examples or anecdotes that come to mind!`
        : `**Quick Reference Guide for ${contactName}**

**Our Working Relationship:**
- You were my ${contactRole}${contactCompany !== 'our previous company' ? ` at ${contactCompany}` : ''}
- We worked together on: [key projects/initiatives]
- Duration: [timeframe]

**Key Points to Highlight:**
1. **Skills & Strengths:** [2-3 specific skills]
2. **Notable Achievements:** [1-2 measurable results from your time together]
3. **Work Style:** [How you collaborate, communicate, problem-solve]

Feel free to share specific examples or anecdotes that come to mind!`,
    };

    return template;
  }

  // Get interested jobs for reference requests (from jobs table, not job_applications)
  async getInterestedJobs(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, company, location, status, createdAt')
      .eq('userId', String(userId))
      .eq('status', 'Interested')
      .is('archivedAt', null)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching interested jobs:', error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} interested jobs for user ${userId}`);
    return data || [];
  }
}
