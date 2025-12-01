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

@Controller('interview')
@UseGuards(JwtAuthGuard)
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  // ------------------------------------------------
  // UC-079 — Schedule Interview
  // ------------------------------------------------
  @Post('schedule')
  async scheduleInterview(@Req() req, @Body() dto: ScheduleInterviewDto) {
    console.log("🔥 JWT Payload = ", req.user);

    const userId = req.user.userId; // ✔ correct key from JWT payload

    if (!userId) {
      throw new Error("Invalid token: missing user ID");
    }

    return this.interviewService.scheduleInterview(userId, dto);
  }

  // ------------------------------------------------
  // UC-079 — Get all interviews for user
  // ------------------------------------------------
  @Get()
  async getUserInterviews(@Req() req) {
    return this.interviewService.getInterviews(req.user.userId);
  }

  // ------------------------------------------------
  // UC-079 — Get single interview
  // ------------------------------------------------
  @Get(':id')
  async getInterviewById(@Req() req, @Param('id') id: string) {
    return this.interviewService.getInterviewById(req.user.userId, id);
  }

  // ------------------------------------------------
  // UC-079 — Update interview
  // ------------------------------------------------
  @Put(':id')
  async updateInterview(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: Partial<ScheduleInterviewDto>,
  ) {
    return this.interviewService.updateInterview(id, req.user.userId, dto);
  }

  // ------------------------------------------------
  // UC-079 — Delete interview
  // ------------------------------------------------
  @Delete(':id')
  async deleteInterview(@Req() req, @Param('id') id: string) {
    return this.interviewService.deleteInterview(id, req.user.userId);
  }

  // ------------------------------------------------
  // UC-074+ Research Endpoints (unchanged)
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
}
