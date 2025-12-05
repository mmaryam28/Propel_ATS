import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Param,
  Query,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import { InterviewService } from './interview.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InterviewPrepService } from './interview-prep.service';

@Controller('interview')
@UseGuards(JwtAuthGuard)
export class InterviewController {
  constructor(
    private readonly interviewService: InterviewService,
    private readonly interviewPrepService: InterviewPrepService,
  ) {}

  // ------------------------------------------------
  // UC-074+ Research Endpoints (company / role insights)
  // ------------------------------------------------
  @Get('process')
  async getInterviewProcess(@Req() req) {
    return this.interviewService.getInterviewProcess(req.query.company);
  }

  @Get('questions')
  async getCommonQuestions(@Req() req) {
    return this.interviewService.getCommonQuestions(
      req.query.company,
      req.query.role,
    );
  }

  @Get('interviewers')
  async getInterviewerInfo(@Req() req) {
    return this.interviewService.getInterviewerInfo(req.query.company);
  }

  @Get('formats')
  async getInterviewFormats(@Req() req) {
    return this.interviewService.getInterviewFormats(req.query.company);
  }

  @Get('recommendations')
  async getPreparationRecommendations(@Req() req) {
    return this.interviewService.getPreparationRecommendations(
      req.query.company,
      req.query.role,
    );
  }

  @Get('timeline')
  async getTimelineExpectations(@Req() req) {
    return this.interviewService.getTimelineExpectations(req.query.company);
  }

  @Get('success-tips')
  async getSuccessTips(@Req() req) {
    return this.interviewService.getSuccessTips(req.query.company);
  }

  @Get('insights')
  async getComprehensiveInsights(@Req() req) {
    return this.interviewService.getComprehensiveInsights(
      req.query.company,
      req.query.role,
    );
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

  // ------------------------------------------------
  // UC-079 + UC-074–078 — AI Interview Prep Package
  // ------------------------------------------------

  // Frontend: GET /interview/:id/prep
  @Get(':id/prep')
  async getInterviewPrep(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.interviewPrepService.getOrCreatePrep(userId, id);
  }

  // Frontend: POST /interview/:id/generate-section?section=company_research|question_bank|mock_interview|technical_prep|checklist
  @Post(':id/generate-section')
  async generateSection(
    @Req() req,
    @Param('id') id: string,
    @Query('section') section: string,
  ) {
    const userId = req.user.userId;
    const sec = section || 'all';

    try {
      return await this.interviewPrepService.generateAndUpsertSection(
        userId,
        id,
        sec,
      );
    } catch (err: any) {
      console.error('[InterviewController] generateSection error:', err);
      throw new HttpException(
        {
          message: err?.message || 'Generation error',
        },
        500,
      );
    }
  }

  // Frontend: POST /interview/:id/generate-all
  @Post(':id/generate-all')
  async generateAll(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;

    try {
      return await this.interviewPrepService.generateAllSections(userId, id);
    } catch (err: any) {
      console.error('[InterviewController] generateAll error:', err);
      throw new HttpException(
        {
          message: err?.message || 'Generation error',
        },
        500,
      );
    }
  }
}
