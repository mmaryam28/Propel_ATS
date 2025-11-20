import { Controller, Get, Query } from '@nestjs/common';
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
}