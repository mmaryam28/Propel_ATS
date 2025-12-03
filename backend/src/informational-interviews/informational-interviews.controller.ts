import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InformationalInterviewsService } from './informational-interviews.service';
import {
  CreateInformationalInterviewDto,
  UpdateInformationalInterviewDto,
  GenerateOutreachDto,
} from './dto/informational-interview.dto';

@Controller('informational-interviews')
@UseGuards(JwtAuthGuard)
export class InformationalInterviewsController {
  constructor(
    private readonly informationalInterviewsService: InformationalInterviewsService,
  ) {}

  @Get()
  async getAllInterviews(@Request() req) {
    return this.informationalInterviewsService.getAllInterviews(
      req.user.userId,
    );
  }

  @Get('stats')
  async getInterviewStats(@Request() req) {
    return this.informationalInterviewsService.getInterviewStats(
      req.user.userId,
    );
  }

  @Get('upcoming')
  async getUpcomingInterviews(@Request() req) {
    return this.informationalInterviewsService.getUpcomingInterviews(
      req.user.userId,
    );
  }

  @Get(':id')
  async getInterviewById(@Param('id') id: string, @Request() req) {
    return this.informationalInterviewsService.getInterviewById(
      id,
      req.user.userId,
    );
  }

  @Post()
  async createInterview(
    @Body() createInterviewDto: CreateInformationalInterviewDto,
    @Request() req,
  ) {
    return this.informationalInterviewsService.createInterview(
      req.user.userId,
      createInterviewDto,
    );
  }

  @Post('generate-outreach')
  async generateOutreachMessage(
    @Body() generateOutreachDto: GenerateOutreachDto,
    @Request() req,
  ) {
    return this.informationalInterviewsService.generateOutreachMessage(
      req.user.userId,
      generateOutreachDto,
    );
  }

  @Post(':id/prep-framework')
  async getPreparationFramework(@Param('id') id: string, @Request() req) {
    const interview = await this.informationalInterviewsService.getInterviewById(
      id,
      req.user.userId,
    );
    return this.informationalInterviewsService.getPreparationFramework(
      interview.professional_contacts,
    );
  }

  @Put(':id')
  async updateInterview(
    @Param('id') id: string,
    @Body() updateInterviewDto: UpdateInformationalInterviewDto,
    @Request() req,
  ) {
    return this.informationalInterviewsService.updateInterview(
      id,
      req.user.userId,
      updateInterviewDto,
    );
  }

  @Delete(':id')
  async deleteInterview(@Param('id') id: string, @Request() req) {
    return this.informationalInterviewsService.deleteInterview(
      id,
      req.user.userId,
    );
  }
}
