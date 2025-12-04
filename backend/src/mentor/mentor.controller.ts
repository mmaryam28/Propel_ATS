import { Controller, Get, Post, Put, Delete, Body, Req, Param, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SupabaseService } from '../supabase/supabase.service';
import { MailService } from '../mail/mail.service';

@Controller('mentors')
@UseGuards(AuthGuard('jwt'))
export class MentorController {
  constructor(
    private supabase: SupabaseService,
    private mail: MailService
  ) {}

  /**
   * GET /mentors
   * Get all mentor relationships for the authenticated user
   */
  @Get()
  async getMentorRelationships(@Req() req) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const client = this.supabase.getClient();
    
    // Get relationships where user is the mentee
    const { data: relationships, error } = await client
      .from('mentor_relationships')
      .select('*')
      .eq('mentee_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { message: 'Failed to fetch mentor relationships', error: error.message };
    }

    return { relationships: relationships || [] };
  }

  /**
   * POST /mentors/invite
   * Invite a mentor or coach
   */
  @Post('invite')
  async inviteMentor(@Req() req, @Body() body) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const {
      mentorEmail,
      relationshipType,
      canViewProfile = true,
      canViewApplications = true,
      canViewResumes = true,
      canViewCoverLetters = true,
      canProvideFeedback = true,
      notes
    } = body;

    if (!mentorEmail || !relationshipType) {
      return { message: 'Mentor email and relationship type are required', success: false };
    }

    if (!['mentor', 'coach'].includes(relationshipType)) {
      return { message: 'Relationship type must be "mentor" or "coach"', success: false };
    }

    const client = this.supabase.getClient();

    // Check if mentor exists in system
    const { data: mentorUser } = await client
      .from('users')
      .select('id')
      .eq('email', mentorEmail)
      .single();

    // Create relationship
    const { data, error } = await client
      .from('mentor_relationships')
      .insert({
        mentee_id: userId,
        mentor_email: mentorEmail,
        mentor_id: mentorUser?.id || null,
        relationship_type: relationshipType,
        status: 'pending',
        can_view_profile: canViewProfile,
        can_view_applications: canViewApplications,
        can_view_resumes: canViewResumes,
        can_view_cover_letters: canViewCoverLetters,
        can_provide_feedback: canProvideFeedback,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return { message: 'Failed to create mentor relationship', error: error.message, success: false };
    }

    // Get mentee information for the email
    const { data: mentee } = await client
      .from('users')
      .select('firstname, lastname, email, title')
      .eq('id', userId)
      .single();

    const menteeName = mentee ? `${mentee.firstname} ${mentee.lastname}` : 'A user';
    const menteeTitle = mentee?.title || 'Job Seeker';

    // Generate invitation link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/mentor-dashboard`;
    const loginLink = `${frontendUrl}/login`;
    
    // Send email invitation to mentor (optional - skip if SMTP not configured)
    const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
    
    if (smtpConfigured) {
      try {
        const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .info-box { background: white; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            ul { padding-left: 20px; }
            li { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Mentorship Invitation</h1>
            </div>
            <div class="content">
              <h2>You've Been Invited to Be a ${relationshipType === 'mentor' ? 'Mentor' : 'Career Coach'}!</h2>
              
              <p><strong>${menteeName}</strong> (${menteeTitle}) has invited you to be their ${relationshipType} and help guide them through their job search journey.</p>
              
              <div class="info-box">
                <strong>What you can help with:</strong>
                <ul>
                  ${canViewProfile ? '<li>Review their professional profile</li>' : ''}
                  ${canViewApplications ? '<li>Track their job applications and progress</li>' : ''}
                  ${canViewResumes ? '<li>Provide feedback on their resumes</li>' : ''}
                  ${canViewCoverLetters ? '<li>Review their cover letters</li>' : ''}
                  ${canProvideFeedback ? '<li>Offer guidance and career advice</li>' : ''}
                </ul>
              </div>

              ${notes ? `<p><strong>Personal message:</strong><br/><em>"${notes}"</em></p>` : ''}

              <h3>Getting Started:</h3>
              <ol>
                <li>If you don't have an account, <a href="${loginLink}">create one here</a> using this email address (${mentorEmail})</li>
                <li>Once logged in, visit your mentor dashboard</li>
                <li>You'll see ${menteeName} in your mentees list</li>
                <li>Start providing guidance and support!</li>
              </ol>

              <div style="text-align: center;">
                <a href="${inviteLink}" class="button">Go to Mentor Dashboard</a>
              </div>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <strong>Why mentorship matters:</strong><br/>
                Your guidance can make a real difference in someone's career journey. Share your experience, provide constructive feedback, and help ${menteeName.split(' ')[0]} achieve their professional goals.
              </p>
            </div>
            <div class="footer">
              <p>This invitation was sent from PROPEL Job Search Platform</p>
              <p>If you have questions, please contact ${mentee?.email}</p>
            </div>
          </div>
        </body>
        </html>
      `;

        await this.mail.send({
          to: mentorEmail,
          subject: `${menteeName} invited you to be their ${relationshipType}!`,
          html: emailHtml,
        });

        console.log(`✓ Mentor invitation email sent to ${mentorEmail}`);
      } catch (emailError) {
        console.error('Failed to send mentor invitation email:', emailError);
        // Don't fail the invitation if email fails
      }
    } else {
      console.log(`⚠ SMTP not configured - invitation created but no email sent to ${mentorEmail}`);
      console.log(`Share this link with your mentor: ${inviteLink}`);
    }

    return {
      message: `${relationshipType === 'mentor' ? 'Mentor' : 'Coach'} invitation sent successfully`,
      success: true,
      relationship: data,
      inviteLink // Include in response for testing
    };
  }

  /**
   * PUT /mentors/:id/permissions
   * Update permissions for a mentor relationship
   */
  @Put(':id/permissions')
  async updatePermissions(@Req() req, @Param('id') relationshipId: string, @Body() body) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const client = this.supabase.getClient();

    // Verify ownership
    const { data: relationship } = await client
      .from('mentor_relationships')
      .select('mentee_id')
      .eq('id', relationshipId)
      .single();

    if (!relationship || relationship.mentee_id !== userId) {
      return { message: 'Relationship not found or unauthorized', success: false };
    }

    const updateData: any = {};
    if (body.canViewProfile !== undefined) updateData.can_view_profile = body.canViewProfile;
    if (body.canViewApplications !== undefined) updateData.can_view_applications = body.canViewApplications;
    if (body.canViewResumes !== undefined) updateData.can_view_resumes = body.canViewResumes;
    if (body.canViewCoverLetters !== undefined) updateData.can_view_cover_letters = body.canViewCoverLetters;
    if (body.canProvideFeedback !== undefined) updateData.can_provide_feedback = body.canProvideFeedback;

    const { data, error } = await client
      .from('mentor_relationships')
      .update(updateData)
      .eq('id', relationshipId)
      .select()
      .single();

    if (error) {
      return { message: 'Failed to update permissions', error: error.message, success: false };
    }

    return { message: 'Permissions updated successfully', success: true, relationship: data };
  }

  /**
   * PUT /mentors/:id/status
   * Update relationship status (accept/decline/end)
   */
  @Put(':id/status')
  async updateStatus(@Req() req, @Param('id') relationshipId: string, @Body() body: { status: string }) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const { status } = body;
    if (!['active', 'declined', 'ended'].includes(status)) {
      return { message: 'Invalid status', success: false };
    }

    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('mentor_relationships')
      .update({ status, last_activity_at: new Date().toISOString() })
      .eq('id', relationshipId)
      .eq('mentee_id', userId)
      .select()
      .single();

    if (error) {
      return { message: 'Failed to update status', error: error.message, success: false };
    }

    return { message: 'Status updated successfully', success: true, relationship: data };
  }

  /**
   * DELETE /mentors/:id
   * Remove a mentor relationship
   */
  @Delete(':id')
  async removeMentor(@Req() req, @Param('id') relationshipId: string) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const client = this.supabase.getClient();

    const { error } = await client
      .from('mentor_relationships')
      .delete()
      .eq('id', relationshipId)
      .eq('mentee_id', userId);

    if (error) {
      return { message: 'Failed to remove mentor', error: error.message, success: false };
    }

    return { message: 'Mentor relationship removed successfully', success: true };
  }

  /**
   * GET /mentors/feedback
   * Get all feedback from mentors
   */
  @Get('feedback')
  async getFeedback(@Req() req) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const client = this.supabase.getClient();

    const { data: feedback, error } = await client
      .from('mentor_feedback')
      .select(`
        *,
        mentor:mentor_id(firstname, lastname, email)
      `)
      .eq('mentee_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { message: 'Failed to fetch feedback', error: error.message };
    }

    return { feedback: feedback || [] };
  }

  /**
   * PUT /mentors/feedback/:id/read
   * Mark feedback as read
   */
  @Put('feedback/:id/read')
  async markFeedbackAsRead(@Req() req, @Param('id') feedbackId: string) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('mentor_feedback')
      .update({ is_read: true })
      .eq('id', feedbackId)
      .eq('mentee_id', userId)
      .select()
      .single();

    if (error) {
      return { message: 'Failed to mark feedback as read', error: error.message, success: false };
    }

    return { message: 'Feedback marked as read', success: true, feedback: data };
  }

  /**
   * POST /mentors/progress-report
   * Create a progress report
   */
  @Post('progress-report')
  async createProgressReport(@Req() req, @Body() body) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const {
      relationshipId,
      periodStart,
      periodEnd,
      goalsAchieved,
      challengesFaced,
      nextSteps,
      menteeNotes
    } = body;

    if (!periodStart || !periodEnd) {
      return { message: 'Period start and end dates are required', success: false };
    }

    const client = this.supabase.getClient();

    // Get application stats for the period
    const { data: applications } = await client
      .from('job_applications')
      .select('status')
      .eq('user_id', userId)
      .gte('applied_at', periodStart)
      .lte('applied_at', periodEnd);

    const stats = {
      applicationsSubmitted: applications?.length || 0,
      interviewsScheduled: applications?.filter(a => ['interview_scheduled', 'interviewed', 'offer'].includes(a.status)).length || 0,
      interviewsCompleted: applications?.filter(a => ['interviewed', 'offer'].includes(a.status)).length || 0,
      offersReceived: applications?.filter(a => a.status === 'offer').length || 0,
    };

    const { data, error } = await client
      .from('mentor_progress_reports')
      .insert({
        mentee_id: userId,
        relationship_id: relationshipId || null,
        report_period_start: periodStart,
        report_period_end: periodEnd,
        applications_submitted: stats.applicationsSubmitted,
        interviews_scheduled: stats.interviewsScheduled,
        interviews_completed: stats.interviewsCompleted,
        offers_received: stats.offersReceived,
        goals_achieved: goalsAchieved || null,
        challenges_faced: challengesFaced || null,
        next_steps: nextSteps || null,
        mentee_notes: menteeNotes || null,
      })
      .select()
      .single();

    if (error) {
      return { message: 'Failed to create progress report', error: error.message, success: false };
    }

    return {
      message: 'Progress report created successfully',
      success: true,
      report: data
    };
  }

  /**
   * GET /mentors/progress-reports
   * Get all progress reports
   */
  @Get('progress-reports')
  async getProgressReports(@Req() req) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const client = this.supabase.getClient();

    const { data: reports, error } = await client
      .from('mentor_progress_reports')
      .select('*')
      .eq('mentee_id', userId)
      .order('report_period_end', { ascending: false });

    if (error) {
      return { message: 'Failed to fetch progress reports', error: error.message };
    }

    return { reports: reports || [] };
  }

  /**
   * GET /mentors/my-mentees
   * Get all mentees where the authenticated user is the mentor
   */
  @Get('my-mentees')
  async getMyMentees(@Req() req) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const client = this.supabase.getClient();

    // Get user email to find invitations by email
    const { data: user } = await client
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user) {
      return { message: 'User not found', mentees: [] };
    }

    // Get relationships where user is mentor (by mentor_id OR mentor_email)
    const { data: relationships, error } = await client
      .from('mentor_relationships')
      .select(`
        *,
        mentee:mentee_id(id, firstname, lastname, email, phone, location, title, bio, profile_picture)
      `)
      .or(`mentor_id.eq.${userId},mentor_email.eq.${user.email}`)
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false });

    if (error) {
      return { message: 'Failed to fetch mentees', error: error.message };
    }

    return { mentees: relationships || [] };
  }

  /**
   * PUT /mentors/relationship/:id/accept
   * Accept a mentor invitation (for mentors who have an account)
   */
  @Put('relationship/:id/accept')
  async acceptInvitation(@Req() req, @Param('id') relationshipId: string) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const client = this.supabase.getClient();

    // Get user email
    const { data: user } = await client
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user) {
      return { message: 'User not found', success: false };
    }

    // Update relationship to active and set mentor_id
    const { data, error } = await client
      .from('mentor_relationships')
      .update({
        mentor_id: userId,
        status: 'active',
        last_activity_at: new Date().toISOString()
      })
      .eq('id', relationshipId)
      .eq('mentor_email', user.email)
      .select()
      .single();

    if (error) {
      return { message: 'Failed to accept invitation', error: error.message, success: false };
    }

    return { message: 'Invitation accepted successfully', success: true, relationship: data };
  }

  /**
   * GET /mentors/mentee/:menteeId/profile
   * Get mentee profile information (with permission check)
   */
  @Get('mentee/:menteeId/profile')
  async getMenteeProfile(@Req() req, @Param('menteeId') menteeId: string) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const client = this.supabase.getClient();

    // Get user email
    const { data: user } = await client
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    // Check mentor has permission (by mentor_id OR mentor_email)
    const { data: relationship } = await client
      .from('mentor_relationships')
      .select('can_view_profile, status')
      .eq('mentee_id', menteeId)
      .or(`mentor_id.eq.${userId},mentor_email.eq.${user?.email}`)
      .in('status', ['pending', 'active'])
      .single();

    if (!relationship || !relationship.can_view_profile) {
      return { message: 'Access denied', success: false };
    }

    // Get mentee profile
    const { data: profile, error } = await client
      .from('users')
      .select('id, firstname, lastname, email, phone, location, title, bio, linkedin_url, github_url, portfolio_url, profile_picture')
      .eq('id', menteeId)
      .single();

    if (error) {
      return { message: 'Failed to fetch profile', error: error.message };
    }

    return { profile };
  }

  /**
   * GET /mentors/mentee/:menteeId/applications
   * Get mentee job applications (with permission check)
   */
  @Get('mentee/:menteeId/applications')
  async getMenteeApplications(@Req() req, @Param('menteeId') menteeId: string) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const client = this.supabase.getClient();

    // Get user email
    const { data: user } = await client
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    // Check mentor has permission (by mentor_id OR mentor_email)
    const { data: relationship } = await client
      .from('mentor_relationships')
      .select('can_view_applications, status')
      .eq('mentee_id', menteeId)
      .or(`mentor_id.eq.${userId},mentor_email.eq.${user?.email}`)
      .in('status', ['pending', 'active'])
      .single();

    if (!relationship || !relationship.can_view_applications) {
      return { message: 'Access denied', success: false };
    }

    // Get applications
    const { data: applications, error } = await client
      .from('job_applications')
      .select('*')
      .eq('user_id', menteeId)
      .order('applied_at', { ascending: false });

    if (error) {
      return { message: 'Failed to fetch applications', error: error.message };
    }

    return { applications: applications || [] };
  }

  /**
   * GET /mentors/mentee/:menteeId/progress-reports
   * Get mentee progress reports
   */
  @Get('mentee/:menteeId/progress-reports')
  async getMenteeProgressReports(@Req() req, @Param('menteeId') menteeId: string) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const client = this.supabase.getClient();

    // Get user email
    const { data: user } = await client
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    // Verify mentor relationship (by mentor_id OR mentor_email)
    const { data: relationship } = await client
      .from('mentor_relationships')
      .select('id')
      .eq('mentee_id', menteeId)
      .or(`mentor_id.eq.${userId},mentor_email.eq.${user?.email}`)
      .in('status', ['pending', 'active'])
      .single();

    if (!relationship) {
      return { message: 'Access denied', success: false };
    }

    // Get progress reports
    const { data: reports, error } = await client
      .from('mentor_progress_reports')
      .select('*')
      .eq('mentee_id', menteeId)
      .order('report_period_end', { ascending: false });

    if (error) {
      return { message: 'Failed to fetch progress reports', error: error.message };
    }

    return { reports: reports || [] };
  }

  /**
   * POST /mentors/mentee/:menteeId/feedback
   * Provide feedback to a mentee
   */
  @Post('mentee/:menteeId/feedback')
  async provideFeedback(@Req() req, @Param('menteeId') menteeId: string, @Body() body) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const { feedbackType, subject, content, referenceType, referenceId } = body;

    if (!content) {
      return { message: 'Feedback content is required', success: false };
    }

    const client = this.supabase.getClient();

    // Get user email to check if they're the invited mentor
    const { data: user } = await client
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user) {
      return { message: 'User not found', success: false };
    }

    // Check mentor has permission (by mentor_id OR mentor_email)
    const { data: relationship } = await client
      .from('mentor_relationships')
      .select('id, can_provide_feedback, status, mentor_id')
      .eq('mentee_id', menteeId)
      .or(`mentor_id.eq.${userId},mentor_email.eq.${user.email}`)
      .in('status', ['pending', 'active'])
      .single();

    if (!relationship || !relationship.can_provide_feedback) {
      return { message: 'Access denied or no permission to provide feedback', success: false };
    }

    // Auto-accept the invitation if not already active
    if (relationship.status === 'pending' && !relationship.mentor_id) {
      await client
        .from('mentor_relationships')
        .update({
          mentor_id: userId,
          status: 'active',
          last_activity_at: new Date().toISOString()
        })
        .eq('id', relationship.id);
    }

    // Create feedback
    const { data, error } = await client
      .from('mentor_feedback')
      .insert({
        relationship_id: relationship.id,
        mentor_id: userId,
        mentee_id: menteeId,
        feedback_type: feedbackType || 'general',
        subject: subject || null,
        content,
        reference_type: referenceType || null,
        reference_id: referenceId || null,
      })
      .select()
      .single();

    if (error) {
      return { message: 'Failed to create feedback', error: error.message, success: false };
    }

    // Update last activity
    await client
      .from('mentor_relationships')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', relationship.id);

    return { message: 'Feedback provided successfully', success: true, feedback: data };
  }
}
