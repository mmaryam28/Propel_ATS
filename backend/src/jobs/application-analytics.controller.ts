import {
  Controller,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApplicationAnalyticsService } from './application-analytics.service';

@Controller('application-analytics')
@UseGuards(JwtAuthGuard)
export class ApplicationAnalyticsController {
  constructor(
    private readonly analyticsService: ApplicationAnalyticsService,
  ) {}

  /**
   * Get complete dashboard data
   * GET /application-analytics/dashboard
   */
  @Get('dashboard')
  async getDashboard(@Request() req) {
    return this.analyticsService.getDashboard(req.user.userId);
  }

  /**
   * AC1: Analyze success rates by industry, company size, and role type
   * GET /application-analytics/success-rates
   */
  @Get('success-rates')
  async getSuccessRates(@Request() req) {
    return this.analyticsService.getSuccessRatesByCategory(req.user.userId);
  }

  /**
   * AC2: Compare performance across different application methods and sources
   * GET /application-analytics/method-performance
   */
  @Get('method-performance')
  async getMethodPerformance(@Request() req) {
    return this.analyticsService.getApplicationMethodPerformance(req.user.userId);
  }

  /**
   * AC3: Identify patterns in successful applications vs. rejections
   * GET /application-analytics/patterns
   */
  @Get('patterns')
  async getPatterns(@Request() req) {
    return this.analyticsService.getSuccessPatterns(req.user.userId);
  }

  /**
   * AC4: Track correlation between application materials and response rates
   * GET /application-analytics/material-impact
   */
  @Get('material-impact')
  async getMaterialImpact(@Request() req) {
    return this.analyticsService.getMaterialImpact(req.user.userId);
  }

  /**
   * AC5: Monitor impact of resume and cover letter customization
   * GET /application-analytics/customization-impact
   */
  @Get('customization-impact')
  async getCustomizationImpact(@Request() req) {
    return this.analyticsService.getCustomizationImpact(req.user.userId);
  }

  /**
   * AC6: Analyze timing patterns for optimal application submission
   * GET /application-analytics/timing
   */
  @Get('timing')
  async getTimingPatterns(@Request() req) {
    return this.analyticsService.getTimingPatterns(req.user.userId);
  }

  /**
   * AC7: Generate recommendations for improving application success
   * GET /application-analytics/recommendations
   */
  @Get('recommendations')
  async getRecommendations(@Request() req) {
    return this.analyticsService.getRecommendations(req.user.userId);
  }
}
