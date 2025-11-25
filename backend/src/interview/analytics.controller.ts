import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('interview/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('conversion-rates')
  async getConversionRates(@Query('userId') userId: string) {
    if (!userId) {
      return { error: 'userId parameter is required' };
    }
    return this.analyticsService.getConversionRates(userId);
  }

  @Get('company-type-performance')
  async getCompanyTypePerformance(@Query('userId') userId: string) {
    if (!userId) {
      return { error: 'userId parameter is required' };
    }
    return this.analyticsService.getCompanyTypePerformance(userId);
  }

  @Get('strengths-weaknesses')
  async getStrengthsAndWeaknesses(@Query('userId') userId: string) {
    if (!userId) {
      return { error: 'userId parameter is required' };
    }
    return this.analyticsService.getStrengthsAndWeaknesses(userId);
  }

  @Get('format-performance')
  async getFormatPerformance(@Query('userId') userId: string) {
    if (!userId) {
      return { error: 'userId parameter is required' };
    }
    return this.analyticsService.getFormatPerformance(userId);
  }

  @Get('improvement-trends')
  async getImprovementTrends(@Query('userId') userId: string) {
    if (!userId) {
      return { error: 'userId parameter is required' };
    }
    return this.analyticsService.getImprovementTrends(userId);
  }

  @Get('optimal-strategies')
  async getOptimalStrategies(@Query('userId') userId: string) {
    if (!userId) {
      return { error: 'userId parameter is required' };
    }
    return this.analyticsService.getOptimalStrategies(userId);
  }

  @Get('industry-benchmarks')
  async getIndustryBenchmarks(@Query('userId') userId: string) {
    if (!userId) {
      return { error: 'userId parameter is required' };
    }
    return this.analyticsService.getIndustryBenchmarks(userId);
  }

  @Get('recommendations')
  async getPersonalizedRecommendations(@Query('userId') userId: string) {
    if (!userId) {
      return { error: 'userId parameter is required' };
    }
    return this.analyticsService.getPersonalizedRecommendations(userId);
  }

  @Get('dashboard')
  async getCompleteDashboard(@Query('userId') userId: string) {
    if (!userId) {
      return { error: 'userId parameter is required' };
    }

    const [
      conversionRates,
      companyTypePerformance,
      strengthsWeaknesses,
      formatPerformance,
      improvementTrends,
      optimalStrategies,
      industryBenchmarks,
      recommendations,
    ] = await Promise.all([
      this.analyticsService.getConversionRates(userId),
      this.analyticsService.getCompanyTypePerformance(userId),
      this.analyticsService.getStrengthsAndWeaknesses(userId),
      this.analyticsService.getFormatPerformance(userId),
      this.analyticsService.getImprovementTrends(userId),
      this.analyticsService.getOptimalStrategies(userId),
      this.analyticsService.getIndustryBenchmarks(userId),
      this.analyticsService.getPersonalizedRecommendations(userId),
    ]);

    return {
      conversionRates,
      companyTypePerformance,
      strengthsWeaknesses,
      formatPerformance,
      improvementTrends,
      optimalStrategies,
      industryBenchmarks,
      recommendations,
    };
  }
}
