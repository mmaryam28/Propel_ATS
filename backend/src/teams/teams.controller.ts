import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateTeamDto,
  UpdateTeamDto,
  InviteMemberDto,
  UpdateMemberDto,
  AcceptInvitationDto,
} from './dto/team.dto';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  // Team management
  @Post()
  async createTeam(@Request() req, @Body() createTeamDto: CreateTeamDto) {
    console.log('Received createTeamDto:', createTeamDto);
    console.log('User ID:', req.user.userId);
    return this.teamsService.createTeam(req.user.userId, createTeamDto);
  }

  @Get()
  async getTeams(@Request() req) {
    return this.teamsService.getTeams(req.user.userId);
  }

  @Get(':id')
  async getTeamById(@Request() req, @Param('id') teamId: string) {
    return this.teamsService.getTeamById(req.user.userId, teamId);
  }

  @Put(':id')
  async updateTeam(
    @Request() req,
    @Param('id') teamId: string,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.teamsService.updateTeam(req.user.userId, teamId, updateTeamDto);
  }

  @Delete(':id')
  async deleteTeam(@Request() req, @Param('id') teamId: string) {
    return this.teamsService.deleteTeam(req.user.userId, teamId);
  }

  // Member management
  @Get(':id/members')
  async getTeamMembers(@Request() req, @Param('id') teamId: string) {
    return this.teamsService.getTeamMembers(req.user.userId, teamId);
  }

  @Put(':teamId/members/:memberId')
  async updateMember(
    @Request() req,
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    return this.teamsService.updateMember(req.user.userId, teamId, memberId, updateMemberDto);
  }

  @Delete(':teamId/members/:memberId')
  async removeMember(
    @Request() req,
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.teamsService.removeMember(req.user.userId, teamId, memberId);
  }

  // Invitation management
  @Post(':id/invitations')
  async inviteMember(
    @Request() req,
    @Param('id') teamId: string,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    console.log('Received inviteMemberDto:', inviteMemberDto);
    console.log('Team ID:', teamId);
    return this.teamsService.inviteMember(req.user.userId, teamId, inviteMemberDto);
  }

  @Get(':id/invitations')
  async getTeamInvitations(@Request() req, @Param('id') teamId: string) {
    return this.teamsService.getTeamInvitations(req.user.userId, teamId);
  }

  @Get('invitations/my-invitations')
  async getMyInvitations(@Request() req) {
    return this.teamsService.getMyInvitations(req.user.userId);
  }

  @Post('invitations/accept')
  async acceptInvitation(@Request() req, @Body() acceptInvitationDto: AcceptInvitationDto) {
    console.log('Controller received acceptInvitationDto:', acceptInvitationDto);
    console.log('DTO type:', typeof acceptInvitationDto);
    console.log('DTO keys:', Object.keys(acceptInvitationDto || {}));
    return this.teamsService.acceptInvitation(req.user.userId, acceptInvitationDto);
  }

  @Post('invitations/:token/decline')
  async declineInvitation(@Request() req, @Param('token') token: string) {
    return this.teamsService.declineInvitation(req.user.userId, token);
  }

  @Delete('invitations/:invitationId')
  async cancelInvitation(@Request() req, @Param('invitationId') invitationId: string) {
    return this.teamsService.cancelInvitation(req.user.userId, invitationId);
  }

  // Analytics
  @Get(':id/analytics')
  async getTeamAnalytics(@Request() req, @Param('id') teamId: string) {
    return this.teamsService.getTeamAnalytics(req.user.userId, teamId);
  }

  @Get(':id/activity')
  async getTeamActivity(@Request() req, @Param('id') teamId: string) {
    return this.teamsService.getTeamActivity(req.user.userId, teamId);
  }

  // Team Resources
  @Get(':id/resources')
  async getTeamResources(@Request() req, @Param('id') teamId: string) {
    return this.teamsService.getTeamResources(req.user.userId, teamId);
  }

  @Get(':id/my-jobs')
  async getMyJobs(@Request() req, @Param('id') teamId: string) {
    return this.teamsService.getMyJobsNotInTeam(req.user.userId, teamId);
  }

  @Post(':id/job-postings')
  async addJobPosting(
    @Request() req,
    @Param('id') teamId: string,
    @Body() jobData: any,
  ) {
    return this.teamsService.addJobPostingToTeam(req.user.userId, teamId, jobData);
  }

  @Post(':id/link-job/:jobId')
  async linkJob(
    @Request() req,
    @Param('id') teamId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.teamsService.linkExistingJobToTeam(req.user.userId, teamId, jobId);
  }

  @Post(':id/share-resume/:resumeId')
  async shareResume(
    @Request() req,
    @Param('id') teamId: string,
    @Param('resumeId') resumeId: string,
  ) {
    return this.teamsService.shareResumeWithTeam(req.user.userId, teamId, resumeId);
  }

  @Post(':id/share-cover-letter/:letterId')
  async shareCoverLetter(
    @Request() req,
    @Param('id') teamId: string,
    @Param('letterId') letterId: string,
  ) {
    return this.teamsService.shareCoverLetterWithTeam(req.user.userId, teamId, letterId);
  }

  @Post(':id/resumes')
  async addResume(
    @Request() req,
    @Param('id') teamId: string,
    @Body() resumeData: any,
  ) {
    return this.teamsService.addResumeToTeam(req.user.userId, teamId, resumeData);
  }

  @Post(':id/cover-letters')
  async addCoverLetter(
    @Request() req,
    @Param('id') teamId: string,
    @Body() coverLetterData: any,
  ) {
    return this.teamsService.addCoverLetterToTeam(req.user.userId, teamId, coverLetterData);
  }

  // Task Management
  @Get(':id/tasks')
  async getTasks(@Request() req, @Param('id') teamId: string) {
    return this.teamsService.getTeamTasks(req.user.userId, teamId);
  }

  @Post(':id/tasks')
  async createTask(
    @Request() req,
    @Param('id') teamId: string,
    @Body() taskData: any,
  ) {
    return this.teamsService.createTask(req.user.userId, teamId, taskData);
  }

  @Put(':id/tasks/:taskId')
  async updateTask(
    @Request() req,
    @Param('id') teamId: string,
    @Param('taskId') taskId: string,
    @Body() taskData: any,
  ) {
    return this.teamsService.updateTask(req.user.userId, teamId, taskId, taskData);
  }

  @Delete(':id/tasks/:taskId')
  async deleteTask(
    @Request() req,
    @Param('id') teamId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.teamsService.deleteTask(req.user.userId, teamId, taskId);
  }

  // Comments Management
  @Get(':id/comments/:resourceType/:resourceId')
  async getComments(
    @Request() req,
    @Param('id') teamId: string,
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.teamsService.getComments(req.user.userId, teamId, resourceType, resourceId);
  }

  @Post(':id/comments')
  async addComment(
    @Request() req,
    @Param('id') teamId: string,
    @Body() commentData: any,
  ) {
    return this.teamsService.addComment(req.user.userId, teamId, commentData);
  }

  @Delete(':id/comments/:commentId')
  async deleteComment(
    @Request() req,
    @Param('id') teamId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.teamsService.deleteComment(req.user.userId, teamId, commentId);
  }
}
