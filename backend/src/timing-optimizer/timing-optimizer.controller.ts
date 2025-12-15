import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TimingAnalysisService } from './timing-analysis.service';
import { RecommendationEngineService, TimingRecommendation, RecommendationRequest } from './recommendation-engine.service';
import { SchedulingService, ScheduledSubmission, ScheduleRequest } from './scheduling.service';
import { TimingAnalyticsService, TestResult, ABTestConfig } from './timing-analytics.service';

export class JwtAuthGuard extends AuthGuard('jwt') {}

@Controller('timing-optimizer')
@UseGuards(JwtAuthGuard)
export class TimingOptimizerController {
  constructor(
    private readonly timingAnalysisService: TimingAnalysisService,
    private readonly recommendationEngineService: RecommendationEngineService,
    private readonly schedulingService: SchedulingService,
    private readonly analyticsService: TimingAnalyticsService,
  ) {}

  // ==================== Analysis Endpoints ====================

  /**
   * Analyze industry timing patterns
   * GET /timing-optimizer/patterns?industry=Technology&companySize=large
   */
  @Get('patterns')
  async getPatterns(
    @Query('industry') industry: string,
    @Query('companySize') companySize: string,
  ) {
    return await this.timingAnalysisService.analyzeIndustryPatterns(industry, companySize);
  }

  /**
   * Track a submission for metrics
   * POST /timing-optimizer/track-submission
   */
  @Post('track-submission')
  async trackSubmission(@Req() req, @Body() data: any) {
    const metric = await this.timingAnalysisService.trackSubmission(req.user.userId, {
      applicationId: data.applicationId,
      submittedAt: new Date(data.submittedAt),
      dayOfWeek: data.dayOfWeek,
      hourOfDay: data.hourOfDay,
      industry: data.industry,
      companySize: data.companySize,
      gotInterview: data.gotInterview,
      responseTime: data.responseTime,
    });

    return {
      success: true,
      message: 'Submission tracked for analysis',
      metric,
    };
  }

  /**
   * Calculate timing correlation for user
   * GET /timing-optimizer/correlation?industry=Technology
   */
  @Get('correlation')
  async getCorrelation(@Req() req, @Query('industry') industry?: string) {
    return await this.timingAnalysisService.calculateTimingCorrelation(req.user.userId, industry);
  }

  // ==================== Recommendation Endpoints ====================

  /**
   * Generate personalized timing recommendation
   * POST /timing-optimizer/recommendation
   */
  @Post('recommendation')
  async generateRecommendation(@Req() req, @Body() data: any) {
    const recommendation = await this.recommendationEngineService.generateRecommendation(req.user.userId, {
      industry: data.industry,
      companySize: data.companySize,
      applicationQualityScore: data.applicationQualityScore,
      userTimezone: data.userTimezone,
      isRemote: data.isRemote,
    });

    // Save recommendation to database
    await this.recommendationEngineService.saveRecommendation(req.user.userId, recommendation, data.industry);

    return {
      success: true,
      recommendation,
      actionItems: [
        'Review the recommended timing for your next application',
        'Consider scheduling your application at the suggested time',
        `Visit: ${recommendation.currentRecommendation}`,
      ],
    };
  }

  /**
   * Get latest recommendation for user
   * GET /timing-optimizer/recommendation
   */
  @Get('recommendation')
  async getLatestRecommendation(@Req() req) {
    const recommendation = await this.recommendationEngineService.getLatestRecommendation(req.user.userId);

    if (!recommendation) {
      return {
        success: false,
        message: 'No active recommendations found. Generate one to get started.',
        actionItems: [
          'Provide your application details (industry, company size)',
          'Get personalized timing recommendations',
          'Schedule your application for optimal submission',
        ],
      };
    }

    return {
      success: true,
      recommendation,
    };
  }

  // ==================== Scheduling Endpoints ====================

  /**
   * Schedule an application submission
   * POST /timing-optimizer/schedule
   */
  @Post('schedule')
  async scheduleSubmission(@Req() req, @Body() data: any) {
    const schedule = await this.schedulingService.scheduleSubmission(req.user.userId, {
      applicationId: data.applicationId,
      scheduledSubmitTime: new Date(data.scheduledSubmitTime),
      sendReminder: data.sendReminder,
      reminderMinutesBefore: data.reminderMinutesBefore,
      schedulingReason: data.schedulingReason,
    });

    return {
      success: true,
      message: 'Application scheduled for optimal submission',
      schedule,
      nextSteps: [
        'You will receive a reminder before submission time',
        'Monitor your email for application responses',
        'Track the correlation between timing and results',
      ],
    };
  }

  /**
   * Get all scheduled submissions for user
   * GET /timing-optimizer/schedules
   */
  @Get('schedules')
  async getUserSchedules(@Req() req) {
    const schedules = await this.schedulingService.getUserScheduledSubmissions(req.user.userId);

    return {
      success: true,
      schedules,
      summary: {
        total: schedules.length,
        upcoming: schedules.filter(s => s.status === 'scheduled').length,
        submitted: schedules.filter(s => s.status === 'submitted').length,
      },
    };
  }

  /**
   * Get upcoming scheduled submissions
   * GET /timing-optimizer/upcoming
   */
  @Get('upcoming')
  async getUpcomingSchedules(@Req() req) {
    const upcoming = await this.schedulingService.getUpcomingSubmissions(req.user.userId);

    return {
      success: true,
      upcoming,
      message: upcoming.length > 0
        ? `You have ${upcoming.length} scheduled submission(s) in the next 7 days`
        : 'No scheduled submissions in the next 7 days',
    };
  }

  /**
   * Reschedule an application submission
   * PUT /timing-optimizer/schedule/:scheduleId
   */
  @Put('schedule/:scheduleId')
  async rescheduleSubmission(
    @Req() req,
    @Param('scheduleId') scheduleId: string,
    @Body() data: any,
  ) {
    const schedule = await this.schedulingService.rescheduleSubmission(
      req.user.userId,
      scheduleId,
      new Date(data.newSubmitTime),
    );

    return {
      success: true,
      message: 'Submission rescheduled successfully',
      schedule,
    };
  }

  /**
   * Cancel a scheduled submission
   * DELETE /timing-optimizer/schedule/:scheduleId
   */
  @Delete('schedule/:scheduleId')
  async cancelSchedule(@Req() req, @Param('scheduleId') scheduleId: string) {
    const result = await this.schedulingService.cancelSchedule(req.user.userId, scheduleId);

    return {
      success: true,
      message: result.message,
    };
  }

  /**
   * Get calendar view for a month
   * GET /timing-optimizer/calendar?month=11&year=2025
   */
  @Get('calendar')
  async getCalendarView(
    @Req() req,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    const calendar = await this.schedulingService.getCalendarView(req.user.userId, month, year);

    return {
      success: true,
      calendar,
    };
  }

  /**
   * Get scheduling statistics
   * GET /timing-optimizer/stats
   */
  @Get('stats')
  async getSchedulingStats(@Req() req) {
    const stats = await this.schedulingService.getSchedulingStatistics(req.user.userId);

    return {
      success: true,
      stats,
    };
  }

  // ==================== A/B Testing Endpoints ====================

  /**
   * Create a new timing A/B test
   * POST /timing-optimizer/ab-test
   */
  @Post('ab-test')
  async createABTest(@Req() req, @Body() data: any) {
    const test = await this.analyticsService.createABTest(req.user.userId, {
      testName: data.testName,
      controlTiming: data.controlTiming,
      variantTiming: data.variantTiming,
      testDurationDays: data.testDurationDays,
      minimumSampleSize: data.minimumSampleSize,
    });

    return {
      success: true,
      message: 'A/B test created successfully',
      test,
      instructions: [
        'Control Group: Submit applications using your normal timing',
        'Variant Group: Submit applications using the variant timing',
        'Monitor progress as you submit applications',
        'Results will be analyzed automatically',
      ],
    };
  }

  /**
   * Get active A/B tests
   * GET /timing-optimizer/ab-test/active
   */
  @Get('ab-test/active')
  async getActiveTests(@Req() req) {
    const tests = await this.analyticsService.getActiveTests(req.user.userId);

    return {
      success: true,
      tests,
      message: tests.length > 0
        ? `You have ${tests.length} active test(s). Keep submitting applications to track results.`
        : 'No active tests. Create one to start optimizing your timing.',
    };
  }

  /**
   * Record a test submission
   * POST /timing-optimizer/ab-test/:testId/submission
   */
  @Post('ab-test/:testId/submission')
  async recordTestSubmission(
    @Req() req,
    @Param('testId') testId: string,
    @Body() data: any,
  ) {
    const result = await this.analyticsService.recordTestSubmission(
      req.user.userId,
      testId,
      data.isControlGroup,
      data.applicationId,
    );

    return {
      success: true,
      message: 'Submission recorded for test',
      result,
    };
  }

  /**
   * Record a test response (interview/rejection/follow-up)
   * POST /timing-optimizer/ab-test/:testId/response
   */
  @Post('ab-test/:testId/response')
  async recordTestResponse(
    @Req() req,
    @Param('testId') testId: string,
    @Body() data: any,
  ) {
    const result = await this.analyticsService.recordTestResponse(
      req.user.userId,
      testId,
      data.isControlGroup,
      data.responseType,
    );

    return {
      success: true,
      message: result.message,
    };
  }

  /**
   * Analyze A/B test results
   * GET /timing-optimizer/ab-test/:testId/analysis
   */
  @Get('ab-test/:testId/analysis')
  async analyzeTest(@Req() req, @Param('testId') testId: string) {
    const analysis = await this.analyticsService.analyzeTestResults(req.user.userId, testId);

    return {
      success: true,
      analysis,
    };
  }

  /**
   * Complete an A/B test and generate report
   * POST /timing-optimizer/ab-test/:testId/complete
   */
  @Post('ab-test/:testId/complete')
  async completeTest(@Req() req, @Param('testId') testId: string) {
    const result = await this.analyticsService.completeTest(req.user.userId, testId);

    return {
      success: true,
      message: `Test completed with status: ${result.status}`,
      result,
    };
  }

  /**
   * Get A/B test history
   * GET /timing-optimizer/ab-test/history
   */
  @Get('ab-test/history')
  async getTestHistory(@Req() req) {
    const history = await this.analyticsService.getTestHistory(req.user.userId);

    return {
      success: true,
      history,
      message: history.length > 0
        ? `You have completed ${history.filter(t => t.status === 'completed').length} tests`
        : 'No test history yet. Create your first test to start optimizing.',
    };
  }

  /**
   * Track timing correlation
   * GET /timing-optimizer/ab-test/correlation?days=30
   */
  @Get('ab-test/correlation')
  async getTimingCorrelation(@Req() req, @Query('days') days: number = 30) {
    const correlation = await this.analyticsService.trackTimingCorrelation(req.user.userId, days);

    return {
      success: true,
      correlation,
    };
  }
}
