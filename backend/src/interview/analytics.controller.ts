import { Controller, Get, Query, Post, Body, Patch, Param } from '@nestjs/common';
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

    /**
   * UC-082: Get follow-up stats (completion & response rates)
   */
  @Get('follow-up-stats')
  async getFollowUpStats(@Query('userId') userId: string) {
    if (!userId) {
      return { error: 'userId parameter is required' };
    }
    return this.analyticsService.getFollowUpStats(userId);
  }

  /**
   * UC-082: Log a follow-up event when user sends a template
   * Frontend Verification: "Send interview follow-up from template, verify personalization and tracking"
   */
  @Post('follow-up-event')
  async logFollowUpEvent(
    @Body()
    body: {
      userId: string;
      interviewId?: string;
      company?: string;
      role?: string;
      interviewerName?: string;
      type: 'thank_you' | 'status_inquiry' | 'feedback_request' | 'networking';
      status?: 'pending' | 'sent' | 'completed' | 'responded';
      channel?: string;
      suggestedSendAt?: string;
      sentAt?: string;
      respondedAt?: string;
    },
  ) {
    if (!body.userId) {
      return { error: 'userId is required' };
    }
    return this.analyticsService.logFollowUpEvent(body);
  }

  /**
   * UC-082: Update a follow-up when a response is received
   */
  @Patch('follow-up-event/:id')
  async updateFollowUpStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status: 'pending' | 'sent' | 'completed' | 'responded';
      respondedAt?: string;
    },
  ) {
    if (!body.status) {
      return { error: 'status is required' };
    }
    return this.analyticsService.updateFollowUpStatus(id, body.status, body.respondedAt);
  }


}
