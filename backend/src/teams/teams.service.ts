import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { MailService } from '../mail/mail.service';
import { CreateTeamDto, UpdateTeamDto, InviteMemberDto, UpdateMemberDto, AcceptInvitationDto } from './dto/team.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class TeamsService {
  constructor(
    private supabaseService: SupabaseService,
    private mailService: MailService,
  ) {}

  // Team CRUD
  async createTeam(userId: string, createTeamDto: CreateTeamDto) {
    const supabase = this.supabaseService.getClient();
    
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: createTeamDto.name,
          description: createTeamDto.description,
          owner_id: userId,
          subscription_type: createTeamDto.subscriptionType || 'free',
          billing_email: createTeamDto.billingEmail,
          max_members: createTeamDto.subscriptionType === 'enterprise' ? 100 : 
                       createTeamDto.subscriptionType === 'premium' ? 50 : 
                       createTeamDto.subscriptionType === 'basic' ? 10 : 5,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating team:', error);
        throw new Error(`Failed to create team: ${error.message}`);
      }

      // Log activity
      await this.logActivity(data.id, userId, 'team_created', { team_name: data.name });

      return data;
    } catch (err) {
      console.error('Exception in createTeam:', err);
      throw err;
    }
  }

  async getTeams(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        teams (
          id,
          name,
          description,
          owner_id,
          subscription_type,
          subscription_status,
          max_members,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw error;

    // Get member counts for each team
    const teamsWithCounts = await Promise.all(
      data.map(async (member) => {
        const { count } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', member.team_id)
          .eq('status', 'active');

        return {
          ...member.teams,
          member_count: count,
          user_role: member.role,
          user_permissions: member.permissions,
        };
      })
    );

    return teamsWithCounts;
  }

  async getTeamById(userId: string, teamId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is a member
    const { data: membership } = await supabase
      .from('team_members')
      .select('role, permissions')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!membership) {
      throw new Error('Not a member of this team');
    }

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (error) throw error;

    return {
      ...data,
      user_role: membership.role,
      user_permissions: membership.permissions,
    };
  }

  async updateTeam(userId: string, teamId: string, updateTeamDto: UpdateTeamDto) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is admin
    await this.verifyAdminAccess(userId, teamId);

    const { data, error } = await supabase
      .from('teams')
      .update(updateTeamDto)
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;

    await this.logActivity(teamId, userId, 'team_updated', { updates: updateTeamDto });

    return data;
  }

  async deleteTeam(userId: string, teamId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is owner
    const { data: team } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    if (!team || team.owner_id !== userId) {
      throw new Error('Only team owner can delete the team');
    }

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) throw error;

    return { success: true };
  }

  // Member Management
  async getTeamMembers(userId: string, teamId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is a member
    await this.verifyMembership(userId, teamId);

    // Get team members
    const { data: members, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false });

    if (error) throw error;

    // Get user details for each member
    const memberIds = members.map(m => m.user_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, firstname, lastname')
      .in('id', memberIds);

    if (usersError) throw usersError;

    // Combine member data with user data
    const membersWithUsers = members.map(member => ({
      ...member,
      users: users.find(u => u.id === member.user_id) || null
    }));

    return membersWithUsers;
  }

  async updateMember(userId: string, teamId: string, memberId: string, updateMemberDto: UpdateMemberDto) {
    const supabase = this.supabaseService.getClient();
    
    console.log('updateMember called:', { userId, teamId, memberId, updateMemberDto });
    
    // Verify user is admin
    try {
      await this.verifyAdminAccess(userId, teamId);
    } catch (err) {
      console.error('Admin access verification failed:', err);
      throw err;
    }

    const { data, error } = await supabase
      .from('team_members')
      .update(updateMemberDto)
      .eq('id', memberId)
      .eq('team_id', teamId)
      .select()
      .single();

    if (error) {
      console.error('Error updating member:', error);
      throw error;
    }

    console.log('Member updated successfully:', data);

    // Log activity (don't let this fail the whole operation)
    try {
      // Get user email for better activity log
      const { data: memberData } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('id', memberId)
        .single();
      
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', memberData?.user_id)
        .single();

      await this.logActivity(teamId, userId, 'role_changed', {
        email: userData?.email,
        new_role: updateMemberDto.role,
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
      // Don't throw - activity logging is not critical
    }

    return data;
  }

  async removeMember(userId: string, teamId: string, memberId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is admin
    await this.verifyAdminAccess(userId, teamId);

    const { data, error } = await supabase
      .from('team_members')
      .update({ status: 'removed' })
      .eq('id', memberId)
      .eq('team_id', teamId)
      .select()
      .single();

    if (error) throw error;

    await this.logActivity(teamId, userId, 'member_removed', { member_id: memberId });

    return { success: true };
  }

  // Invitation Management
  async inviteMember(userId: string, teamId: string, inviteMemberDto: InviteMemberDto) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user has permission to invite
    const { data: member } = await supabase
      .from('team_members')
      .select('role, permissions')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!member || (member.role !== 'admin' && !member.permissions?.invite_members)) {
      throw new Error('No permission to invite members');
    }

    // Check team member limit
    const { count } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('status', 'active');

    const { data: team } = await supabase
      .from('teams')
      .select('max_members')
      .eq('id', teamId)
      .single();

    if (!team || (count !== null && count >= team.max_members)) {
      throw new Error('Team member limit reached');
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', inviteMemberDto.email)
      .single();

    // Generate invitation token
    const token = randomBytes(32).toString('hex');
    console.log('Generated invitation token:', token);
    console.log('Token length:', token.length);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        inviter_id: userId,
        invitee_email: inviteMemberDto.email,
        invitee_id: existingUser?.id || null,
        role: inviteMemberDto.role,
        token: token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    console.log('Saved invitation to database:', data);
    console.log('Saved token:', data?.token);

    await this.logActivity(teamId, userId, 'invitation_sent', {
      email: inviteMemberDto.email,
      role: inviteMemberDto.role,
    });

    // Send email notification with invitation link
    await this.sendInvitationEmail(data, teamId);

    return data;
  }

  private async sendInvitationEmail(invitation: any, teamId: string) {
    try {
      const supabase = this.supabaseService.getClient();
      
      // Get team details
      const { data: team } = await supabase
        .from('teams')
        .select('name')
        .eq('id', teamId)
        .single();

      const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/teams/invite/${invitation.token}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">You've been invited to join a team!</h2>
          <p>You have been invited to join the team <strong>${team?.name || 'Unknown Team'}</strong> as a <strong>${invitation.role}</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Team:</strong> ${team?.name || 'Unknown Team'}</p>
            <p style="margin: 10px 0 0 0;"><strong>Role:</strong> ${invitation.role}</p>
          </div>

          <p>Click the button below to accept this invitation:</p>
          
          <a href="${inviteUrl}" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
            Accept Invitation
          </a>

          <p style="color: #6b7280; font-size: 14px;">
            This invitation will expire on ${new Date(invitation.expires_at).toLocaleDateString()}.
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px;">
            Or copy and paste this link into your browser:<br>
            <a href="${inviteUrl}" style="color: #2563eb; word-break: break-all;">${inviteUrl}</a>
          </p>
        </div>
      `;

      await this.mailService.send({
        to: invitation.invitee_email,
        subject: `Invitation to join ${team?.name || 'a team'}`,
        html,
      });

      console.log(`✓ Invitation email sent to ${invitation.invitee_email}`);
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      // Don't throw - we don't want to fail the invitation if email fails
    }
  }

  async getTeamInvitations(userId: string, teamId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is a member
    await this.verifyMembership(userId, teamId);

    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId)
      .in('status', ['pending', 'accepted', 'declined'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  }

  async getMyInvitations(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Get user's email from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (userError || !user?.email) {
      throw new Error('User not found');
    }
    
    // Return all pending invitations (not filtered by email)
    // This allows users to see invitations they have links for
    const { data, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        teams (
          id,
          name,
          description
        )
      `)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    return data;
  }

  async acceptInvitation(userId: string, acceptInvitationDto: AcceptInvitationDto) {
    const supabase = this.supabaseService.getClient();
    
    console.log('acceptInvitation called:', { userId, token: acceptInvitationDto.token });
    
    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', acceptInvitationDto.token)
      .eq('status', 'pending')
      .single();

    console.log('Invitation lookup result:', { invitation, inviteError });

    if (inviteError || !invitation) {
      console.error('Invitation not found or error:', inviteError);
      throw new Error('Invalid or expired invitation');
    }

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('team_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
      throw new Error('Invitation has expired');
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id, status')
      .eq('team_id', invitation.team_id)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      if (existingMember.status === 'active') {
        // Mark invitation as accepted anyway since they're already a member
        await supabase
          .from('team_invitations')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
            invitee_id: userId,
          })
          .eq('id', invitation.id);
        
        throw new Error('You are already a member of this team');
      } else {
        // Reactivate inactive member
        await supabase
          .from('team_members')
          .update({ status: 'active', role: invitation.role })
          .eq('id', existingMember.id);
        
        await supabase
          .from('team_invitations')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
            invitee_id: userId,
          })
          .eq('id', invitation.id);
        
        return existingMember;
      }
    }

    // Set default permissions based on role
    const permissions = this.getDefaultPermissions(invitation.role);

    // Add user as team member
    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: invitation.team_id,
        user_id: userId,
        role: invitation.role,
        permissions: permissions,
      })
      .select()
      .single();

    if (memberError) throw memberError;

    // Update invitation status
    await supabase
      .from('team_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        invitee_id: userId,
      })
      .eq('id', invitation.id);

    await this.logActivity(invitation.team_id, userId, 'member_added', {
      role: invitation.role,
    });

    return memberData;
  }

  async declineInvitation(userId: string, token: string) {
    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('team_invitations')
      .update({ status: 'declined' })
      .eq('token', token)
      .eq('status', 'pending');

    if (error) throw error;

    return { success: true };
  }

  async cancelInvitation(userId: string, invitationId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Get invitation to check team_id
    const { data: invitation, error: fetchError } = await supabase
      .from('team_invitations')
      .select('team_id')
      .eq('id', invitationId)
      .single();

    if (fetchError || !invitation) {
      throw new Error('Invitation not found');
    }

    // Verify user is admin
    await this.verifyAdminAccess(userId, invitation.team_id);

    // Delete the invitation
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) throw error;

    await this.logActivity(invitation.team_id, userId, 'invitation_cancelled', {
      invitation_id: invitationId,
    });

    return { success: true };
  }

  // Analytics
  async getTeamAnalytics(userId: string, teamId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Get team to check if user is owner
    const { data: team } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    // Check if user is owner or has analytics permission
    if (team?.owner_id !== userId) {
      const { data: member } = await supabase
        .from('team_members')
        .select('role, permissions')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!member || (member.role !== 'admin' && member.role !== 'mentor' && !member.permissions?.view_analytics)) {
        throw new Error('No permission to view analytics');
      }
    }

    // Get all candidate members
    const { data: candidates } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .eq('role', 'candidate')
      .eq('status', 'active');

    const candidateIds = candidates?.map(c => c.user_id) || [];

    // Aggregate statistics
    const { data: applications } = await supabase
      .from('applications')
      .select('*')
      .in('user_id', candidateIds);

    const { data: interviews } = await supabase
      .from('interview_prep')
      .select('*')
      .in('user_id', candidateIds);

    const candidateCount = candidates?.length || 0;
    const applicationCount = applications?.length || 0;

    const analytics = {
      total_candidates: candidateCount,
      total_applications: applicationCount,
      total_interviews: interviews?.length || 0,
      applications_by_status: this.groupByField(applications || [], 'status'),
      average_applications_per_candidate: candidateCount > 0 ? applicationCount / candidateCount : 0,
      recent_activity: await this.getRecentTeamActivity(teamId),
    };

    return analytics;
  }

  async getTeamActivity(userId: string, teamId: string, limit: number = 50) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is a member
    await this.verifyMembership(userId, teamId);

    const { data, error } = await supabase
      .from('team_activity')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data;
  }

  // Helper methods
  private async verifyMembership(userId: string, teamId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      throw new Error('Not a member of this team');
    }
  }

  private async verifyAdminAccess(userId: string, teamId: string) {
    const supabase = this.supabaseService.getClient();
    
    console.log('Verifying admin access:', { userId, teamId });
    
    // First check if user is the team owner
    const { data: team } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();
    
    console.log('Team owner check:', { teamOwnerId: team?.owner_id, userId });
    
    if (team?.owner_id === userId) {
      console.log('User is team owner - access granted');
      return; // Owner always has admin access
    }
    
    // Check if user is an admin member
    const { data, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    console.log('Admin member check result:', { data, error });

    if (error || !data || data.role !== 'admin') {
      throw new Error('Admin access required');
    }
  }

  private async logActivity(teamId: string, userId: string, activityType: string, activityData: any) {
    const supabase = this.supabaseService.getClient();
    
    await supabase
      .from('team_activity')
      .insert({
        team_id: teamId,
        user_id: userId,
        activity_type: activityType,
        activity_data: activityData,
      });
  }

  private getDefaultPermissions(role: string) {
    switch (role) {
      case 'admin':
        return {
          view_all_candidates: true,
          edit_candidates: true,
          view_analytics: true,
          manage_team: true,
          invite_members: true,
        };
      case 'mentor':
        return {
          view_all_candidates: true,
          edit_candidates: false,
          view_analytics: true,
          manage_team: false,
          invite_members: false,
        };
      case 'candidate':
        return {
          view_all_candidates: false,
          edit_candidates: false,
          view_analytics: false,
          manage_team: false,
          invite_members: false,
        };
      default:
        return {};
    }
  }

  private groupByField(data: any[], field: string) {
    return data?.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}) || {};
  }

  private async getRecentTeamActivity(teamId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data } = await supabase
      .from('team_activity')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(10);

    return data || [];
  }

  // Team Resources Management
  async getTeamResources(userId: string, teamId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is a member
    await this.verifyMembership(userId, teamId);

    // Get all team members
    const { data: members } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .eq('status', 'active');

    if (!members || members.length === 0) {
      return { applications: [], resumes: [], coverLetters: [] };
    }

    const memberIds = members.map(m => m.user_id);

    // Get jobs (job postings) - all jobs from team members
    const { data: applications } = await supabase
      .from('jobs')
      .select('*')
      .in('userId', memberIds)
      .order('createdAt', { ascending: false });

    // Get shared resumes from team_activity
    const { data: resumeActivities } = await supabase
      .from('team_activity')
      .select('activity_data')
      .eq('team_id', teamId)
      .eq('activity_type', 'resume_added');

    const resumeIds = resumeActivities?.map(a => a.activity_data?.resume_id).filter(Boolean) || [];
    
    let resumes: any[] = [];
    if (resumeIds.length > 0) {
      const { data: resumeData } = await supabase
        .from('resume')
        .select('*')
        .in('id', resumeIds)
        .order('created_at', { ascending: false });
      resumes = resumeData || [];
    }

    // Get shared cover letters from team_activity
    const { data: coverLetterActivities } = await supabase
      .from('team_activity')
      .select('activity_data')
      .eq('team_id', teamId)
      .eq('activity_type', 'cover_letter_added');

    const coverLetterIds = coverLetterActivities?.map(a => a.activity_data?.cover_letter_id).filter(Boolean) || [];
    
    let coverLetters: any[] = [];
    if (coverLetterIds.length > 0) {
      const { data: coverLetterData } = await supabase
        .from('cover_letters')
        .select('*')
        .in('id', coverLetterIds)
        .order('created_at', { ascending: false });
      coverLetters = coverLetterData || [];
    }

    // Get user details for each resource
    const { data: users } = await supabase
      .from('users')
      .select('id, email, firstname, lastname')
      .in('id', memberIds);

    // Attach user info to each resource
    const addUserInfo = (item) => ({
      ...item,
      user: users?.find(u => u.id === (item.userId || item.user_id))
    });

    return {
      applications: (applications || []).map(addUserInfo),
      resumes: resumes.map(addUserInfo),
      coverLetters: coverLetters.map(addUserInfo)
    };
  }

  async addJobPostingToTeam(userId: string, teamId: string, jobData: any) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is a team member
    await this.verifyMembership(userId, teamId);

    // Create job for this user
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        userId: userId,
        company: jobData.company,
        title: jobData.position,
        location: jobData.location,
        description: jobData.jobDescription,
        salaryMin: jobData.salary,
        status: jobData.status || 'Interested',
        notes: jobData.notes
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await this.logActivity(teamId, userId, 'job_posting_added', {
      company: jobData.company,
      position: jobData.position
    });

    return data;
  }

  async addResumeToTeam(userId: string, teamId: string, resumeData: any) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is a team member
    await this.verifyMembership(userId, teamId);

    // Create resume for this user
    const { data, error } = await supabase
      .from('resume')
      .insert({
        userId: userId,
        title: resumeData.title,
        content: resumeData.content,
        filePath: resumeData.filePath,
        fileSize: resumeData.fileSize,
        mimeType: resumeData.mimeType
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await this.logActivity(teamId, userId, 'resume_added', {
      title: resumeData.title
    });

    return data;
  }

  async addCoverLetterToTeam(userId: string, teamId: string, coverLetterData: any) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is a team member
    await this.verifyMembership(userId, teamId);

    // Create cover letter for this user
    const { data, error } = await supabase
      .from('cover_letters')
      .insert({
        userId: userId,
        jobId: coverLetterData.jobId,
        company: coverLetterData.company,
        position: coverLetterData.position,
        content: coverLetterData.content,
        status: coverLetterData.status || 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await this.logActivity(teamId, userId, 'cover_letter_added', {
      company: coverLetterData.company,
      position: coverLetterData.position
    });

    return data;
  }

  async getMyJobsNotInTeam(userId: string, teamId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is a team member
    await this.verifyMembership(userId, teamId);

    // Get all team members' user IDs
    const { data: members } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .eq('status', 'active');

    const teamMemberIds = members?.map(m => m.user_id) || [];

    // Get all jobs already in the team (from all team members)
    const { data: teamJobs } = await supabase
      .from('jobs')
      .select('id')
      .in('userId', teamMemberIds);

    const teamJobIds = teamJobs?.map(j => j.id) || [];

    // Get ALL user's jobs first
    const { data: allMyJobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    // Filter out jobs that are already in the team
    const myJobs = (allMyJobs || []).filter(job => !teamJobIds.includes(job.id));

    return myJobs;
  }

  async linkExistingJobToTeam(userId: string, teamId: string, jobId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is a team member
    await this.verifyMembership(userId, teamId);

    // Verify the job belongs to the user
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('userId', userId)
      .single();

    if (jobError || !job) {
      throw new Error('Job not found or you do not have access to it');
    }

    // Job is already in jobs table, just log the activity
    await this.logActivity(teamId, userId, 'job_posting_added', {
      company: job.company,
      position: job.title
    });

    return job;
  }

  async shareResumeWithTeam(userId: string, teamId: string, resumeId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is a team member
    await this.verifyMembership(userId, teamId);

    // Verify the resume belongs to the user
    const { data: resume, error: resumeError } = await supabase
      .from('resume')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', userId)
      .single();

    if (resumeError || !resume) {
      throw new Error('Resume not found or you do not have access to it');
    }

    // Check if resume is already shared with this team
    const { data: existing } = await supabase
      .from('team_activity')
      .select('*')
      .eq('team_id', teamId)
      .eq('activity_type', 'resume_added')
      .eq('resource_id', resumeId)
      .single();

    if (existing) {
      throw new Error('Resume already shared with this team');
    }

    // Log the activity
    await this.logActivity(teamId, userId, 'resume_added', {
      resume_id: resumeId,
      filename: resume.file_name
    });

    return resume;
  }

  async shareCoverLetterWithTeam(userId: string, teamId: string, letterId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is a team member
    await this.verifyMembership(userId, teamId);

    // Verify the cover letter belongs to the user
    const { data: letter, error: letterError } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('id', letterId)
      .eq('user_id', userId)
      .single();

    if (letterError || !letter) {
      throw new Error('Cover letter not found or you do not have access to it');
    }

    // Check if cover letter is already shared with this team
    const { data: existing } = await supabase
      .from('team_activity')
      .select('*')
      .eq('team_id', teamId)
      .eq('activity_type', 'cover_letter_added')
      .eq('resource_id', letterId)
      .single();

    if (existing) {
      throw new Error('Cover letter already shared with this team');
    }

    // Log the activity
    await this.logActivity(teamId, userId, 'cover_letter_added', {
      cover_letter_id: letterId,
      company: letter.company,
      position: letter.position
    });

    return letter;
  }

  // Task Management
  async getTeamTasks(userId: string, teamId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is a team member
    await this.verifyMembership(userId, teamId);

    // Get all tasks for this team
    const { data: tasks, error } = await supabase
      .from('team_tasks')
      .select(`
        *,
        assigned_to_user:users!team_tasks_assigned_to_fkey(id, email, firstname, lastname),
        created_by_user:users!team_tasks_created_by_fkey(id, email, firstname, lastname)
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return tasks || [];
  }

  async createTask(userId: string, teamId: string, taskData: any) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is admin or mentor
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .eq('status', 'active')
      .single();

    if (!member || (member.role !== 'admin' && member.role !== 'mentor')) {
      throw new Error('Only admins and mentors can create tasks');
    }

    // Verify assigned_to user is a team member
    if (taskData.assigned_to) {
      const { data: assignedMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_id', taskData.assigned_to)
        .eq('team_id', teamId)
        .eq('status', 'active')
        .single();

      if (!assignedMember) {
        throw new Error('Assigned user is not a member of this team');
      }
    }

    // Create task
    const { data, error } = await supabase
      .from('team_tasks')
      .insert({
        team_id: teamId,
        title: taskData.title,
        description: taskData.description,
        assigned_to: taskData.assigned_to,
        due_date: taskData.due_date,
        priority: taskData.priority || 'medium',
        status: taskData.status || 'todo',
        created_by: userId
      })
      .select(`
        *,
        assigned_to_user:users!team_tasks_assigned_to_fkey(id, email, firstname, lastname),
        created_by_user:users!team_tasks_created_by_fkey(id, email, firstname, lastname)
      `)
      .single();

    if (error) throw error;

    // Log activity
    await this.logActivity(teamId, userId, 'task_created', {
      title: taskData.title,
      assigned_to: taskData.assigned_to
    });

    return data;
  }

  async updateTask(userId: string, teamId: string, taskId: string, taskData: any) {
    const supabase = this.supabaseService.getClient();
    
    // Get the task
    const { data: task, error: taskError } = await supabase
      .from('team_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('team_id', teamId)
      .single();

    if (taskError || !task) {
      console.error('Task lookup error:', taskError);
      throw new Error('Task not found');
    }

    // Check permissions: only task creator can update
    if (task.created_by !== userId) {
      throw new Error('Only the task creator can edit this task');
    }

    // Update task
    const { data, error } = await supabase
      .from('team_tasks')
      .update({
        title: taskData.title,
        description: taskData.description,
        assigned_to: taskData.assigned_to,
        due_date: taskData.due_date,
        priority: taskData.priority,
        status: taskData.status,
        completed_at: taskData.status === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', taskId)
      .eq('team_id', teamId)
      .select(`
        *,
        assigned_to_user:users!team_tasks_assigned_to_fkey(id, email, firstname, lastname),
        created_by_user:users!team_tasks_created_by_fkey(id, email, firstname, lastname)
      `)
      .single();

    if (error) throw error;

    // Log activity
    await this.logActivity(teamId, userId, 'task_updated', {
      title: taskData.title,
      status: taskData.status
    });

    return data;
  }

  async deleteTask(userId: string, teamId: string, taskId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Get the task
    const { data: task } = await supabase
      .from('team_tasks')
      .select('created_by')
      .eq('id', taskId)
      .eq('team_id', teamId)
      .single();

    if (!task) {
      throw new Error('Task not found');
    }

    // Only admin, mentor, or task creator can delete
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .eq('status', 'active')
      .single();

    const canDelete = member && (
      member.role === 'admin' ||
      member.role === 'mentor' ||
      task.created_by === userId
    );

    if (!canDelete) {
      throw new Error('You do not have permission to delete this task');
    }

    // Delete task
    const { error } = await supabase
      .from('team_tasks')
      .delete()
      .eq('id', taskId)
      .eq('team_id', teamId);

    if (error) throw error;

    // Log activity
    await this.logActivity(teamId, userId, 'task_deleted', {
      task_id: taskId
    });

    return { message: 'Task deleted successfully' };
  }

  // Comments Management
  async getComments(userId: string, teamId: string, resourceType: string, resourceId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is a team member
    await this.verifyMembership(userId, teamId);

    // Get comments for this resource
    const { data: comments, error } = await supabase
      .from('team_comments')
      .select(`
        *,
        user:users!team_comments_user_id_fkey(id, email, firstname, lastname)
      `)
      .eq('team_id', teamId)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return comments || [];
  }

  async addComment(userId: string, teamId: string, commentData: any) {
    const supabase = this.supabaseService.getClient();
    
    // Verify user is a team member
    await this.verifyMembership(userId, teamId);

    // Validate resource type
    const validTypes = ['job', 'resume', 'cover_letter'];
    if (!validTypes.includes(commentData.resource_type)) {
      throw new Error('Invalid resource type');
    }

    // Create comment
    const { data, error } = await supabase
      .from('team_comments')
      .insert({
        team_id: teamId,
        user_id: userId,
        resource_type: commentData.resource_type,
        resource_id: commentData.resource_id,
        comment: commentData.comment
      })
      .select(`
        *,
        user:users!team_comments_user_id_fkey(id, email, firstname, lastname)
      `)
      .single();

    if (error) throw error;

    // Log activity
    await this.logActivity(teamId, userId, 'comment_added', {
      resource_type: commentData.resource_type,
      resource_id: commentData.resource_id
    });

    return data;
  }

  async deleteComment(userId: string, teamId: string, commentId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Get the comment
    const { data: comment } = await supabase
      .from('team_comments')
      .select('user_id')
      .eq('id', commentId)
      .eq('team_id', teamId)
      .single();

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Only comment creator or admin can delete
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .eq('status', 'active')
      .single();

    const canDelete = member && (
      member.role === 'admin' ||
      comment.user_id === userId
    );

    if (!canDelete) {
      throw new Error('You do not have permission to delete this comment');
    }

    // Delete comment
    const { error } = await supabase
      .from('team_comments')
      .delete()
      .eq('id', commentId)
      .eq('team_id', teamId);

    if (error) throw error;

    return { message: 'Comment deleted successfully' };
  }
}
