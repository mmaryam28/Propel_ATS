import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  async getOverview(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = req.user.userId;
    return this.statisticsService.getOverview(userId, startDate, endDate);
  }

  @Get('monthly-volume')
  async getMonthlyVolume(
    @Req() req: any,
    @Query('months') months?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = req.user.userId;
    const monthsNum = months ? parseInt(months, 10) : 12;
    return this.statisticsService.getMonthlyVolume(userId, monthsNum, startDate, endDate);
  }

  @Get('export-csv')
  async exportToCSV(@Req() req: any, @Res() res: Response) {
    const userId = req.user.userId;
    
    const csv = await this.statisticsService.exportToCSV(userId);
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="job-statistics-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  }
}
