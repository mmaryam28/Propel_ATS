import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { MailService } from '../mail/mail.service';
import { randomBytes } from 'crypto';

@Injectable()
export class MentorsService {
  constructor(
    private supabaseService: SupabaseService,
    private mailService: MailService,
  ) {}

  async getMentorRelationships(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('mentor_relationships')
      .select('*')
      .eq('mentee_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { relationships: data };
  }

  async inviteMentor(userId: string, inviteData: any) {
    const supabase = this.supabaseService.getClient();

    // Check if user with this email exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', inviteData.mentorEmail)
      .single();

    // Create the relationship
    const { data, error } = await supabase
      .from('mentor_relationships')
      .insert({
        mentee_id: userId,
        mentor_email: inviteData.mentorEmail,
        mentor_id: existingUser?.id || null,
        relationship_type: inviteData.relationshipType,
        can_view_profile: inviteData.canViewProfile,
        can_view_applications: inviteData.canViewApplications,
        can_view_resumes: inviteData.canViewResumes,
        can_view_cover_letters: inviteData.canViewCoverLetters,
        can_provide_feedback: inviteData.canProvideFeedback,
        notes: inviteData.notes,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Generate invite link
    const token = randomBytes(32).toString('hex');
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/mentor-dashboard?token=${token}&relationshipId=${data.id}`;

    // Send invitation email
    try {
      await this.mailService.send({
        to: inviteData.mentorEmail,
        subject: 'Invitation to be a Mentor',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">You've been invited to be a mentor!</h2>
            <p>You have been invited to mentor a job seeker on Propel.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Relationship Type:</strong> ${inviteData.relationshipType === 'mentor' ? 'Mentor' : 'Career Coach'}</p>
              ${inviteData.notes ? `<p style="margin: 10px 0 0 0;"><strong>Notes:</strong> ${inviteData.notes}</p>` : ''}
            </div>

            <p>Click the button below to accept this invitation:</p>
            
            <a href="${inviteLink}" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0;">
              Accept Invitation
            </a>

            <p style="color: #6b7280; font-size: 14px;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px;">
              Or copy and paste this link into your browser:<br>
              <a href="${inviteLink}" style="color: #2563eb; word-break: break-all;">${inviteLink}</a>
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
    }

    return { success: true, inviteLink, relationship: data };
  }

  async acceptInvitation(mentorId: string, relationshipId: string) {
    const supabase = this.supabaseService.getClient();

    // Get the relationship to verify it exists and get mentor email
    const { data: relationship, error: fetchError } = await supabase
      .from('mentor_relationships')
      .select('*')
      .eq('id', relationshipId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !relationship) {
      throw new Error('Invitation not found or already accepted');
    }

    // Verify the current user's email matches the invited mentor email
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', mentorId)
      .single();

    if (!user || user.email !== relationship.mentor_email) {
      throw new Error('This invitation is not for you');
    }

    // Update the relationship to active and set the mentor_id
    const { error: updateError } = await supabase
      .from('mentor_relationships')
      .update({
        status: 'active',
        mentor_id: mentorId,
        accepted_at: new Date().toISOString()
      })
      .eq('id', relationshipId);

    if (updateError) throw updateError;

    return { success: true, message: 'Invitation accepted successfully' };
  }

  async removeMentorRelationship(userId: string, relationshipId: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('mentor_relationships')
      .delete()
      .eq('id', relationshipId)
      .eq('mentee_id', userId);

    if (error) throw error;

    return { success: true };
  }

  async getFeedback(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('mentor_feedback')
      .select(`
        *,
        mentor:mentor_id (
          id,
          firstname,
          lastname,
          email
        )
      `)
      .eq('mentee_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { feedback: data };
  }

  async markFeedbackAsRead(userId: string, feedbackId: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('mentor_feedback')
      .update({ is_read: true })
      .eq('id', feedbackId)
      .eq('mentee_id', userId);

    if (error) throw error;

    return { success: true };
  }

  async getProgressReports(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('mentor_progress_reports')
      .select('*')
      .eq('mentee_id', userId)
      .order('report_period_end', { ascending: false });

    if (error) throw error;

    return { reports: data };
  }

  async createProgressReport(userId: string, reportData: any) {
    const supabase = this.supabaseService.getClient();

    // Get job statistics for the period
    const { data: applications } = await supabase
      .from('job')
      .select('id, status')
      .eq('userId', userId)
      .gte('applied_date', reportData.periodStart)
      .lte('applied_date', reportData.periodEnd);

    const applicationsSubmitted = applications?.length || 0;
    const interviewsScheduled = applications?.filter(a => 
      ['interview_scheduled', 'interview_completed', 'offer', 'accepted'].includes(a.status)
    ).length || 0;
    const interviewsCompleted = applications?.filter(a => 
      ['interview_completed', 'offer', 'accepted'].includes(a.status)
    ).length || 0;
    const offersReceived = applications?.filter(a => 
      ['offer', 'accepted'].includes(a.status)
    ).length || 0;

    const { data, error } = await supabase
      .from('mentor_progress_reports')
      .insert({
        mentee_id: userId,
        relationship_id: reportData.relationshipId || null,
        report_period_start: reportData.periodStart,
        report_period_end: reportData.periodEnd,
        applications_submitted: applicationsSubmitted,
        interviews_scheduled: interviewsScheduled,
        interviews_completed: interviewsCompleted,
        offers_received: offersReceived,
        goals_achieved: reportData.goalsAchieved,
        challenges_faced: reportData.challengesFaced,
        next_steps: reportData.nextSteps,
        mentee_notes: reportData.menteeNotes,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, report: data };
  }

  // Mentor Dashboard methods
  async getMyMentees(mentorId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('mentor_relationships')
      .select(`
        *,
        mentee:mentee_id (
          id,
          firstname,
          lastname,
          email
        )
      `)
      .eq('mentor_id', mentorId)
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { mentees: data };
  }

  async getMenteeProfile(mentorId: string, menteeId: string) {
    const supabase = this.supabaseService.getClient();

    // Verify mentor has access to this mentee
    const { data: relationship } = await supabase
      .from('mentor_relationships')
      .select('can_view_profile')
      .eq('mentor_id', mentorId)
      .eq('mentee_id', menteeId)
      .eq('status', 'active')
      .single();

    if (!relationship || !relationship.can_view_profile) {
      throw new Error('Access denied');
    }

    // Get mentee profile
    const { data: profile, error } = await supabase
      .from('users')
      .select('id, firstname, lastname, email')
      .eq('id', menteeId)
      .single();

    if (error) throw error;

    // Get additional profile data
    const { data: education } = await supabase
      .from('education')
      .select('*')
      .eq('userId', menteeId);

    const { data: skills } = await supabase
      .from('skills')
      .select('*')
      .eq('userId', menteeId);

    const { data: employment } = await supabase
      .from('employment')
      .select('*')
      .eq('userId', menteeId);

    return {
      profile: {
        ...profile,
        education: education || [],
        skills: skills || [],
        employment: employment || []
      }
    };
  }

  async getMenteeApplications(mentorId: string, menteeId: string) {
    const supabase = this.supabaseService.getClient();

    // Verify mentor has access
    const { data: relationship } = await supabase
      .from('mentor_relationships')
      .select('can_view_applications')
      .eq('mentor_id', mentorId)
      .eq('mentee_id', menteeId)
      .eq('status', 'active')
      .single();

    if (!relationship || !relationship.can_view_applications) {
      throw new Error('Access denied');
    }

    const { data, error } = await supabase
      .from('job')
      .select('*')
      .eq('userId', menteeId)
      .order('applied_date', { ascending: false });

    if (error) throw error;

    return { applications: data };
  }

  async getMenteeProgressReports(mentorId: string, menteeId: string) {
    const supabase = this.supabaseService.getClient();

    // Verify mentor has access
    const { data: relationship } = await supabase
      .from('mentor_relationships')
      .select('id')
      .eq('mentor_id', mentorId)
      .eq('mentee_id', menteeId)
      .eq('status', 'active')
      .single();

    if (!relationship) {
      throw new Error('Access denied');
    }

    const { data, error } = await supabase
      .from('mentor_progress_reports')
      .select('*')
      .eq('mentee_id', menteeId)
      .order('report_period_end', { ascending: false });

    if (error) throw error;

    return { reports: data };
  }

  async provideFeedback(mentorId: string, menteeId: string, feedbackData: any) {
    const supabase = this.supabaseService.getClient();

    // Get relationship
    const { data: relationship } = await supabase
      .from('mentor_relationships')
      .select('*')
      .eq('mentor_id', mentorId)
      .eq('mentee_id', menteeId)
      .eq('status', 'active')
      .single();

    if (!relationship || !relationship.can_provide_feedback) {
      throw new Error('Access denied');
    }

    const { data, error } = await supabase
      .from('mentor_feedback')
      .insert({
        relationship_id: relationship.id,
        mentor_id: mentorId,
        mentee_id: menteeId,
        feedback_type: feedbackData.feedbackType,
        subject: feedbackData.subject,
        content: feedbackData.content,
        reference_type: feedbackData.referenceType || null,
        reference_id: feedbackData.referenceId || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Send email notification
    try {
      const { data: mentee } = await supabase
        .from('users')
        .select('email, firstname')
        .eq('id', menteeId)
        .single();

      if (mentee?.email) {
        await this.mailService.send({
          to: mentee.email,
          subject: feedbackData.subject || 'New feedback from your mentor',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">New Feedback from Your Mentor</h2>
              <p>Hi ${mentee.firstname},</p>
              <p>Your mentor has provided new feedback for you.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">${feedbackData.subject || 'Feedback'}</h3>
                <p style="white-space: pre-wrap;">${feedbackData.content}</p>
              </div>

              <p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/mentors" 
                   style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; font-weight: 500;">
                  View in Propel
                </a>
              </p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error('Failed to send feedback notification:', emailError);
    }

    return { success: true, feedback: data };
  }
}
