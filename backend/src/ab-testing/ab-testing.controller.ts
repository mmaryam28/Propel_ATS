import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, Query } from '@nestjs/common';
import { AbTestingService } from './ab-testing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ab-testing')
@UseGuards(JwtAuthGuard)
export class AbTestingController {
  constructor(private readonly abTestingService: AbTestingService) {}

  // ==================== Experiments ====================

  @Post('experiments')
  async createExperiment(@Req() req, @Body() body: any) {
    const userId = req.user.userId;
    return this.abTestingService.createExperiment(userId, body);
  }

  @Get('experiments')
  async getExperiments(@Req() req) {
    const userId = req.user.userId;
    return this.abTestingService.getExperiments(userId);
  }

  @Get('experiments/:id')
  async getExperiment(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.abTestingService.getExperiment(userId, id);
  }

  @Put('experiments/:id/status')
  async updateExperimentStatus(@Req() req, @Param('id') id: string, @Body() body: { status: string }) {
    const userId = req.user.userId;
    return this.abTestingService.updateExperimentStatus(userId, id, body.status);
  }

  // ==================== Variants ====================

  @Post('experiments/:experimentId/variants')
  async addVariant(@Req() req, @Param('experimentId') experimentId: string, @Body() body: any) {
    const userId = req.user.userId;
    return this.abTestingService.addVariant(userId, experimentId, body);
  }

  @Get('experiments/:experimentId/variants')
  async getVariants(@Param('experimentId') experimentId: string) {
    return this.abTestingService.getVariants(experimentId);
  }

  @Delete('variants/:id')
  async archiveVariant(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.abTestingService.archiveVariant(userId, id);
  }

  // ==================== Applications ====================

  @Post('experiments/:experimentId/assign-job')
  async assignVariantToJob(
    @Req() req,
    @Param('experimentId') experimentId: string,
    @Body() body: { job_id: number; job_details?: any }
  ) {
    const userId = req.user.userId;
    return this.abTestingService.assignVariantToJob(userId, experimentId, body.job_id, body.job_details);
  }

  @Post('track-response')
  async trackResponse(@Req() req, @Body() body: { job_id: number; response_data: any }) {
    const userId = req.user.userId;
    return this.abTestingService.trackResponse(userId, body.job_id, body.response_data);
  }

  // ==================== Results & Analytics ====================

  @Post('experiments/:experimentId/calculate')
  async calculateResults(@Param('experimentId') experimentId: string) {
    return this.abTestingService.calculateResults(experimentId);
  }

  @Get('experiments/:experimentId/dashboard')
  async getExperimentDashboard(@Req() req, @Param('experimentId') experimentId: string) {
    const userId = req.user.userId;
    return this.abTestingService.getExperimentDashboard(userId, experimentId);
  }
}
