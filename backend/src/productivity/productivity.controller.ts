import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProductivityService } from './productivity.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from './dto/create-time-entry.dto';

@Controller('productivity')
@UseGuards(JwtAuthGuard)
export class ProductivityController {
  constructor(private readonly productivityService: ProductivityService) {}

  // Create time entry
  @Post('entries')
  async createTimeEntry(@Request() req, @Body() createTimeEntryDto: CreateTimeEntryDto) {
    return this.productivityService.createTimeEntry(req.user.userId, createTimeEntryDto);
  }

  // Get time entries with filters
  @Get('entries')
  async getTimeEntries(
    @Request() req,
    @Query('activity_type') activity_type?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('job_id') job_id?: string,
  ) {
    return this.productivityService.getTimeEntries(req.user.userId, {
      activity_type,
      start_date,
      end_date,
      job_id,
    });
  }

  // Update time entry
  @Put('entries/:id')
  async updateTimeEntry(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTimeEntryDto: UpdateTimeEntryDto,
  ) {
    return this.productivityService.updateTimeEntry(req.user.userId, id, updateTimeEntryDto);
  }

  // Delete time entry
  @Delete('entries/:id')
  async deleteTimeEntry(@Request() req, @Param('id') id: string) {
    return this.productivityService.deleteTimeEntry(req.user.userId, id);
  }

  // Get dashboard overview (all analytics combined)
  @Get('analytics/overview')
  async getDashboard(@Request() req) {
    return this.productivityService.getDashboard(req.user.userId);
  }

  // Get productivity patterns by hour and day
  @Get('analytics/patterns')
  async getProductivityPatterns(@Request() req) {
    return this.productivityService.getProductivityPatterns(req.user.userId);
  }

  // Get efficiency metrics
  @Get('analytics/efficiency')
  async getEfficiencyMetrics(@Request() req) {
    return this.productivityService.getEfficiencyMetrics(req.user.userId);
  }

  // Get ROI analysis
  @Get('analytics/roi')
  async getROIAnalysis(@Request() req) {
    return this.productivityService.getROIAnalysis(req.user.userId);
  }

  // Get time optimization recommendations
  @Get('analytics/recommendations')
  async getRecommendations(@Request() req) {
    return this.productivityService.getRecommendations(req.user.userId);
  }

  // Get burnout indicator
  @Get('analytics/burnout')
  async getBurnoutIndicator(@Request() req) {
    return this.productivityService.getBurnoutIndicator(req.user.userId);
  }

  // Get energy patterns
  @Get('analytics/energy')
  async getEnergyPatterns(@Request() req) {
    return this.productivityService.getEnergyPatterns(req.user.userId);
  }

  // Get optimal schedule
  @Get('analytics/optimal-schedule')
  async getOptimalSchedule(@Request() req) {
    return this.productivityService.getOptimalSchedule(req.user.userId);
  }
}
