import { Controller, Get, Post, Query, Body, Req } from '@nestjs/common';
import { SalaryService } from './salary.service';

@Controller('salary')
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @Get('ranges')
  async getSalaryRanges(
    @Query('title') title: string,
    @Query('location') location?: string,
    @Query('experienceLevel') experienceLevel?: string,
    @Query('benefits') benefits?: string,
  ) {
    if (!title) return { error: 'Missing job title' };
    return await this.salaryService.getSalaryRanges(title, location, experienceLevel, benefits);
  }

  @Get('total-compensation')
  async getTotalCompensation(
    @Query('title') title: string,
    @Query('location') location?: string,
    @Query('experienceLevel') experienceLevel?: string,
    @Query('benefits') benefits?: string,
  ) {
    if (!title) return { error: 'Missing job title' };
    return await this.salaryService.getTotalCompensation(title, location, experienceLevel, benefits);
  }

  @Get('compare-companies')
  async compareSalariesAcrossCompanies(
    @Query('title') title: string,
    @Query('location') location?: string,
    @Query('benefits') benefits?: string,
  ) {
    if (!title) return { error: 'Missing job title' };
    return await this.salaryService.compareSalariesAcrossCompanies(title, location, benefits);
  }

  @Get('trends')
  async getSalaryTrends(
    @Query('title') title: string,
    @Query('location') location?: string,
  ) {
    if (!title) return { error: 'Missing job title' };
    return await this.salaryService.getSalaryTrends(title, location);
  }

  @Post('negotiation-recommendations')
  async getNegotiationRecommendations(@Body() body: any) {
    const { title, currentSalary, location, experienceLevel } = body;
    if (!title || currentSalary === undefined) {
      return { error: 'Missing required fields: title, currentSalary' };
    }
    return await this.salaryService.getNegotiationRecommendations(
      title,
      currentSalary,
      location,
      experienceLevel,
    );
  }

  @Post('compare-with-current')
  async compareSalaryWithCurrent(@Body() body: any) {
    const { title, userCurrentSalary, userBonusPercentage, userBenefitsValue } = body;
    if (!title || userCurrentSalary === undefined) {
      return { error: 'Missing required fields: title, userCurrentSalary' };
    }
    return await this.salaryService.compareSalaryWithCurrent(
      title,
      userCurrentSalary,
      userBonusPercentage,
      userBenefitsValue,
    );
  }

  @Get('export')
  async exportSalaryReport(
    @Query('title') title: string,
    @Query('location') location?: string,
    @Query('format') format: 'csv' | 'json' = 'json',
  ) {
    if (!title) return { error: 'Missing job title' };
    return await this.salaryService.exportSalaryReport(title, location, format);
  }

  @Post('analysis')
  async generateSalaryAnalytics(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || body.userId;
    if (!userId) {
      return { error: 'User ID is required' };
    }
    const { title, location, experienceLevel, currentSalary } = body;
    return await this.salaryService.generateSalaryAnalytics(
      userId,
      title,
      location,
      experienceLevel,
      currentSalary,
    );
  }
}
