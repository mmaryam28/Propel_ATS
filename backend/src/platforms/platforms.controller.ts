import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformsService } from './platforms.service';
import { AddPlatformDto } from './dto/add-platform.dto';

@Controller('platforms')
@UseGuards(JwtAuthGuard)
export class PlatformsController {
  constructor(private platformsService: PlatformsService) {}

  // Add platform to job
  @Post('job/:jobId')
  async addPlatform(
    @Request() req,
    @Param('jobId') jobId: string,
    @Body() platformData: AddPlatformDto,
  ) {
    console.log('POST /platforms/job/:jobId', { jobId, platformData });
    return this.platformsService.addPlatformToJob(
      req.user.userId,
      jobId,
      platformData,
    );
  }

  // Get all platforms for a job
  @Get('job/:jobId')
  async getJobPlatforms(@Request() req, @Param('jobId') jobId: string) {
    return this.platformsService.getJobPlatforms(req.user.userId, jobId);
  }

  // Get all jobs with platforms
  @Get('jobs/all')
  async getAllJobsWithPlatforms(@Request() req) {
    return this.platformsService.getAllJobsWithPlatforms(req.user.userId);
  }

  // Update platform
  @Patch(':platformId')
  async updatePlatform(
    @Request() req,
    @Param('platformId') platformId: string,
    @Body() updates: Partial<AddPlatformDto>,
  ) {
    return this.platformsService.updatePlatform(
      req.user.userId,
      platformId,
      updates,
    );
  }

  // Remove platform
  @Delete(':platformId')
  async removePlatform(@Request() req, @Param('platformId') platformId: string) {
    return this.platformsService.removePlatform(req.user.userId, platformId);
  }
}
