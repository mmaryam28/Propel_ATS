import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InterviewService } from './interview.service';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
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
  // UC-074+ Research Endpoints (fixed routes FIRST)
  // ------------------------------------------------
  @Get('process')
  async getInterviewProcess(@Req() req) {
    return this.interviewService.getInterviewProcess(req.query.company);
  }

  @Get('questions')
  async getCommonQuestions(@Req() req) {
    return this.interviewService.getCommonQuestions(req.query.company, req.query.role);
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
    return this.interviewService.getPreparationRecommendations(req.query.company, req.query.role);
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
    return this.interviewService.getComprehensiveInsights(req.query.company, req.query.role);
  }

  // ------------------------------------------------
  // UC-079 — Get/Update/Delete Interview
  // ------------------------------------------------
  @Get(':id/prep')
  async getInterviewPrep(@Req() req, @Param('id') id: string) {
    return this.interviewPrepService.getOrCreatePrep(req.user.userId, id);
  }

}
