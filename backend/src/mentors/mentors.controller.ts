import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { MentorsService } from './mentors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('mentors')
@UseGuards(JwtAuthGuard)
export class MentorsController {
  constructor(private readonly mentorsService: MentorsService) {}

  @Get()
  async getMentorRelationships(@Request() req) {
    return this.mentorsService.getMentorRelationships(req.user.userId);
  }

  @Post('invite')
  async inviteMentor(@Request() req, @Body() inviteData: any) {
    return this.mentorsService.inviteMentor(req.user.userId, inviteData);
  }

  @Post('accept/:relationshipId')
  async acceptInvitation(@Request() req, @Param('relationshipId') relationshipId: string) {
    return this.mentorsService.acceptInvitation(req.user.userId, relationshipId);
  }

  @Delete(':relationshipId')
  async removeMentorRelationship(@Request() req, @Param('relationshipId') relationshipId: string) {
    return this.mentorsService.removeMentorRelationship(req.user.userId, relationshipId);
  }

  @Get('feedback')
  async getFeedback(@Request() req) {
    return this.mentorsService.getFeedback(req.user.userId);
  }

  @Put('feedback/:feedbackId/read')
  async markFeedbackAsRead(@Request() req, @Param('feedbackId') feedbackId: string) {
    return this.mentorsService.markFeedbackAsRead(req.user.userId, feedbackId);
  }

  @Get('progress-reports')
  async getProgressReports(@Request() req) {
    return this.mentorsService.getProgressReports(req.user.userId);
  }

  @Post('progress-report')
  async createProgressReport(@Request() req, @Body() reportData: any) {
    return this.mentorsService.createProgressReport(req.user.userId, reportData);
  }

  // Mentor Dashboard endpoints
  @Get('my-mentees')
  async getMyMentees(@Request() req) {
    return this.mentorsService.getMyMentees(req.user.userId);
  }

  @Get('mentee/:menteeId/profile')
  async getMenteeProfile(@Request() req, @Param('menteeId') menteeId: string) {
    return this.mentorsService.getMenteeProfile(req.user.userId, menteeId);
  }

  @Get('mentee/:menteeId/applications')
  async getMenteeApplications(@Request() req, @Param('menteeId') menteeId: string) {
    return this.mentorsService.getMenteeApplications(req.user.userId, menteeId);
  }

  @Get('mentee/:menteeId/progress-reports')
  async getMenteeProgressReports(@Request() req, @Param('menteeId') menteeId: string) {
    return this.mentorsService.getMenteeProgressReports(req.user.userId, menteeId);
  }

  @Post('mentee/:menteeId/feedback')
  async provideFeedback(@Request() req, @Param('menteeId') menteeId: string, @Body() feedbackData: any) {
    return this.mentorsService.provideFeedback(req.user.userId, menteeId, feedbackData);
  }
}
