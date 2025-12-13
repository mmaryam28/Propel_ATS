import { Controller, Get, Post, Query, Body, Req, UseGuards } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
  @UseGuards(JwtAuthGuard)
  async generateSalaryAnalytics(@Body() body: any, @Req() req: any) {
    // Try to get userId from JWT token or body
    const userId = req.user?.userId || body.userId;
    
    // If no userId, return basic analysis without user-specific data
    if (!userId) {
      return {
        userOffers: [],
        salaryProgression: [],
        negotiationStats: {
          successRate: 0,
          avgIncrease: 0,
          totalNegotiated: 0,
        },
        careerProgression: {
          totalOffers: 0,
          avgIncrease: 0,
          trending: 'insufficient_data',
        },
        message: 'Login to see personalized analytics',
      };
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

  @Get('debug/roles')
  async getAvailableRoles() {
    return await this.salaryService.getAvailableRoles();
  }

  /**
   * UC-112: Get salary benchmarks with percentile breakdowns
   */
  @Get('benchmarks')
  async getSalaryBenchmarks(
    @Query('jobTitle') jobTitle: string,
    @Query('location') location: string,
  ) {
    if (!jobTitle || !location) {
      return { error: 'Missing required parameters: jobTitle, location' };
    }
    return await this.salaryService.getSalaryBenchmarks(jobTitle, location);
  }

  /**
   * UC-112: Get salary data for a specific job detail page
   */
  @Get('job-detail/:jobId')
  @UseGuards(JwtAuthGuard)
  async getSalaryDataForJobDetail(@Req() req: any) {
    const jobId = req.params.jobId;
    if (!jobId) {
      return { error: 'Missing job ID' };
    }
    return await this.salaryService.getSalaryDataForJobDetail(jobId);
  }

  /**
   * UC-112: Admin endpoint to refresh expired cache
   */
  @Post('admin/refresh-cache')
  async refreshExpiredCache() {
    return await this.salaryService.refreshExpiredCache();
  }

  /**
   * UC-112: Admin endpoint to clear cache
   */
  @Post('admin/clear-cache')
  async clearMemoryCache() {
    this.salaryService.clearMemoryCache();
    return { message: 'Cache cleared' };
  }
}
