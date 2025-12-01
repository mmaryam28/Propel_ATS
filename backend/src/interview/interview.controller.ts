import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InterviewService } from './interview.service';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('interview')
@UseGuards(JwtAuthGuard)
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  // -------------------------------
  // UC-079 — Schedule Interview
  // -------------------------------

  @Post('schedule')
  async scheduleInterview(@Req() req, @Body() dto: ScheduleInterviewDto) {
    return this.interviewService.scheduleInterview(req.user.id, dto);
  }

  @Get()
  async getUserInterviews(@Req() req) {
    return this.interviewService.getInterviews(req.user.id);
  }

  @Get(':id')
  async getInterviewById(@Req() req, @Param('id') id: string) {
    return this.interviewService.getInterviewById(req.user.id, id);
  }

  // -------------------------------
  // UC-079 — Update Interview
  // -------------------------------

  @Put(':id')
  async updateInterview(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: Partial<ScheduleInterviewDto>,
  ) {
    return this.interviewService.updateInterview(id, req.user.id, dto);
  }

  // -------------------------------
  // UC-079 — Delete Interview
  // -------------------------------

  @Delete(':id')
  async deleteInterview(@Req() req, @Param('id') id: string) {
    return this.interviewService.deleteInterview(id, req.user.id);
  }

  // -------------------------------
  // Company Research Endpoints (UC-068)
  // -------------------------------

  @Get('process')
  async getInterviewProcess(@Query('company') company: string) {
    if (!company) return { error: 'Company parameter is required' };
    return this.interviewService.getInterviewProcess(company);
  }

  @Get('questions')
  async getCommonQuestions(
    @Query('company') company: string,
    @Query('role') role?: string,
  ) {
    if (!company) return { error: 'Company parameter is required' };
    return this.interviewService.getCommonQuestions(company, role);
  }

  @Get('interviewers')
  async getInterviewerInfo(@Query('company') company: string) {
    if (!company) return { error: 'Company parameter is required' };
    return this.interviewService.getInterviewerInfo(company);
  }

  @Get('formats')
  async getInterviewFormats(@Query('company') company: string) {
    if (!company) return { error: 'Company parameter is required' };
    return this.interviewService.getInterviewFormats(company);
  }

  @Get('recommendations')
  async getPreparationRecommendations(
    @Query('company') company: string,
    @Query('role') role?: string,
  ) {
    if (!company) return { error: 'Company parameter is required' };
    return this.interviewService.getPreparationRecommendations(company, role);
  }

  @Get('timeline')
  async getTimelineExpectations(@Query('company') company: string) {
    if (!company) return { error: 'Company parameter is required' };
    return this.interviewService.getTimelineExpectations(company);
  }

  @Get('success-tips')
  async getSuccessTips(@Query('company') company: string) {
    if (!company) return { error: 'Company parameter is required' };
    return this.interviewService.getSuccessTips(company);
  }

  @Get('insights')
  async getComprehensiveInsights(
    @Query('company') company: string,
    @Query('role') role?: string,
  ) {
    if (!company) return { error: 'Company parameter is required' };
    return this.interviewService.getComprehensiveInsights(company, role);
  }
}
