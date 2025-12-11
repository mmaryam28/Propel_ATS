import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ApplicationQualityService } from './application-quality.service';
import type { ApplicationQualityScorePayload, ApplicationQualityScoreResult } from './application-quality.service';

@Controller('application-quality')
export class ApplicationQualityController {
  constructor(private readonly qualityService: ApplicationQualityService) {}

  @Post('score')
  async scoreApplication(@Body() payload: ApplicationQualityScorePayload): Promise<ApplicationQualityScoreResult> {
    return await this.qualityService.scoreApplication(payload);
  }

  @Get('history/:userId')
  async getScoreHistory(
    @Param('userId') userId: string,
    @Query('jobId') jobId?: string,
  ) {
    return await this.qualityService.getScoreHistory(userId, jobId);
  }

  @Get('statistics/:userId')
  async getUserStatistics(@Param('userId') userId: string) {
    return await this.qualityService.getUserStatistics(userId);
  }
}
