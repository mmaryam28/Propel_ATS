import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { InterviewService } from './interview.service';

@Controller('interview')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Get('process')
  async getInterviewProcess(@Query('company') company: string) {
    if (!company) {
      return { error: 'Company parameter is required' };
    }
    return this.interviewService.getInterviewProcess(company);
  }

  @Get('questions')
  async getCommonQuestions(
    @Query('company') company: string,
    @Query('role') role?: string,
  ) {
    if (!company) {
      return { error: 'Company parameter is required' };
    }
    return this.interviewService.getCommonQuestions(company, role);
  }

  @Get('interviewers')
  async getInterviewerInfo(@Query('company') company: string) {
    if (!company) {
      return { error: 'Company parameter is required' };
    }
    return this.interviewService.getInterviewerInfo(company);
  }

  @Get('formats')
  async getInterviewFormats(@Query('company') company: string) {
    if (!company) {
      return { error: 'Company parameter is required' };
    }
    return this.interviewService.getInterviewFormats(company);
  }

  @Get('recommendations')
  async getPreparationRecommendations(
    @Query('company') company: string,
    @Query('role') role?: string,
  ) {
    if (!company) {
      return { error: 'Company parameter is required' };
    }
    return this.interviewService.getPreparationRecommendations(company, role);
  }

  @Get('timeline')
  async getTimelineExpectations(@Query('company') company: string) {
    if (!company) {
      return { error: 'Company parameter is required' };
    }
    return this.interviewService.getTimelineExpectations(company);
  }

  @Get('success-tips')
  async getSuccessTips(@Query('company') company: string) {
    if (!company) {
      return { error: 'Company parameter is required' };
    }
    return this.interviewService.getSuccessTips(company);
  }

  @Get('insights')
  async getComprehensiveInsights(
    @Query('company') company: string,
    @Query('role') role?: string,
  ) {
    if (!company) {
      return { error: 'Company parameter is required' };
    }
    return this.interviewService.getComprehensiveInsights(company, role);
  }
  @Post('insights/analyze-response')
  async analyzeResponse(
    @Body()
    body: {
      userId?: string;
      question?: string;
      response: string;
    },
  ) {
    if (!body || !body.response || !body.response.trim()) {
      return { error: 'Response text is required' };
    }

    return this.interviewService.analyzeResponse(body);
  }


  @Get('follow-up-templates')
  async getFollowUpTemplates(
    @Query('company') company: string,
    @Query('role') role?: string,
    @Query('interviewerName') interviewerName?: string,
    @Query('interviewDate') interviewDate?: string,
    @Query('outcome') outcome?: string,
    @Query('topics') topics?: string, // comma-separated from FE: "ML system design,team culture"
  ) {
    if (!company) {
      return { error: 'Company parameter is required' };
    }

    const topicsDiscussed = topics
      ? topics.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    return this.interviewService.getFollowUpTemplates({
      company,
      role,
      interviewerName,
      interviewDate,
      outcome: (outcome as any) || 'pending',
      topicsDiscussed,
    });
  }

  @Get('prep-checklist')
  async getPreparationChecklist(
    @Query('company') company: string,
    @Query('role') role?: string,
    @Query('interviewDate') interviewDate?: string,
    @Query('format') format?: string,
  ) {
    if (!company) {
      return { error: 'Company parameter is required' };
    }

    return this.interviewService.getPreparationChecklist(
      company,
      role,
      interviewDate,
      format,
    );
  }

  @Get('success-score')
  async getSuccessScore(
    @Query('userId') userId: string,
    @Query('company') company: string,
    @Query('role') role?: string,
    @Query('checklistProgress') checklistProgress?: string,
    @Query('practiceSessions') practiceSessions?: string,
  ) {
    if (!userId || !company) {
      return { error: 'userId and company are required' };
    }

    return this.interviewService.calculateSuccessScore({
      userId,
      company,
      role,
      checklistProgress: Number(checklistProgress) || 0,
      practiceSessions: Number(practiceSessions) || 0,
    });
  }

}