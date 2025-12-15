import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface ABTestConfig {
  testName: string;
  controlTiming: string;
  variantTiming: string;
  testDurationDays?: number;
  minimumSampleSize?: number;
}

export interface TestResult {
  testId: string;
  controlMetrics: any;
  variantMetrics: any;
  improvement: number;
  isSignificant: boolean;
  winningVariant: string;
  recommendation: string;
}

@Injectable()
export class TimingAnalyticsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Create a new timing A/B test
   */
  async createABTest(userId: string, config: ABTestConfig) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('timing_ab_test_results')
      .insert({
        user_id: userId,
        test_name: config.testName,
        control_timing: config.controlTiming,
        variant_timing: config.variantTiming,
        test_duration_days: config.testDurationDays || 30,
        minimum_sample_size: config.minimumSampleSize || 20,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      testId: data.id,
      testName: data.test_name,
      status: data.status,
      startedAt: new Date(data.started_at),
      message: 'A/B test started. Monitor your application submissions to track results.',
    };
  }

  /**
   * Get active A/B tests for a user
   */
  async getActiveTests(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('timing_ab_test_results')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('started_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(test => ({
      testId: test.id,
      testName: test.test_name,
      controlTiming: test.control_timing,
      variantTiming: test.variant_timing,
      status: test.status,
      progress: {
        controlSubmissions: test.control_submissions,
        variantSubmissions: test.variant_submissions,
        targetSampleSize: test.minimum_sample_size,
      },
      metrics: {
        controlResponseRate: test.control_response_rate,
        variantResponseRate: test.variant_response_rate,
        improvement: test.response_rate_improvement,
      },
      startedAt: new Date(test.started_at),
      endDate: test.ended_at ? new Date(test.ended_at) : null,
    }));
  }

  /**
   * Record a submission for an A/B test
   */
  async recordTestSubmission(
    userId: string,
    testId: string,
    isControlGroup: boolean,
    applicationId: number,
  ) {
    const supabase = this.supabaseService.getClient();

    const fieldToUpdate = isControlGroup ? 'control_submissions' : 'variant_submissions';

    const { data: test, error: fetchError } = await supabase
      .from('timing_ab_test_results')
      .select('*')
      .eq('id', testId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Increment submission count
    const newCount = isControlGroup ? test.control_submissions + 1 : test.variant_submissions + 1;

    const { data: updated, error } = await supabase
      .from('timing_ab_test_results')
      .update({ [fieldToUpdate]: newCount })
      .eq('id', testId)
      .select()
      .single();

    if (error) throw error;

    return {
      testId: updated.id,
      group: isControlGroup ? 'control' : 'variant',
      submissionRecorded: true,
      currentProgress: {
        control: updated.control_submissions,
        variant: updated.variant_submissions,
      },
    };
  }

  /**
   * Record a positive response (interview/follow-up) for a test submission
   */
  async recordTestResponse(
    userId: string,
    testId: string,
    isControlGroup: boolean,
    responseType: 'interview' | 'rejection' | 'follow_up',
  ) {
    const supabase = this.supabaseService.getClient();

    const { data: test, error: fetchError } = await supabase
      .from('timing_ab_test_results')
      .select('*')
      .eq('id', testId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Update response count for the group
    if (isControlGroup) {
      const newControlResponses = test.control_responses + 1;
      const newInterviews = responseType === 'interview' ? test.control_interviews + 1 : test.control_interviews;

      await supabase
        .from('timing_ab_test_results')
        .update({
          control_responses: newControlResponses,
          control_interviews: newInterviews,
          control_response_rate: (newControlResponses / test.control_submissions) * 100,
          control_interview_rate: (newInterviews / test.control_submissions) * 100,
        })
        .eq('id', testId);
    } else {
      const newVariantResponses = test.variant_responses + 1;
      const newInterviews = responseType === 'interview' ? test.variant_interviews + 1 : test.variant_interviews;

      await supabase
        .from('timing_ab_test_results')
        .update({
          variant_responses: newVariantResponses,
          variant_interviews: newInterviews,
          variant_response_rate: (newVariantResponses / test.variant_submissions) * 100,
          variant_interview_rate: (newInterviews / test.variant_submissions) * 100,
        })
        .eq('id', testId);
    }

    return {
      testId,
      responseRecorded: true,
      message: `Response recorded for ${isControlGroup ? 'control' : 'variant'} group`,
    };
  }

  /**
   * Analyze test results and generate insights
   */
  async analyzeTestResults(userId: string, testId: string): Promise<TestResult> {
    const supabase = this.supabaseService.getClient();

    const { data: test, error } = await supabase
      .from('timing_ab_test_results')
      .select('*')
      .eq('id', testId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const controlMetrics = {
      submissions: test.control_submissions,
      responses: test.control_responses,
      interviews: test.control_interviews,
      responseRate: test.control_response_rate || 0,
      interviewRate: test.control_interview_rate || 0,
      avgResponseTime: test.control_avg_response_time || 0,
    };

    const variantMetrics = {
      submissions: test.variant_submissions,
      responses: test.variant_responses,
      interviews: test.variant_interviews,
      responseRate: test.variant_response_rate || 0,
      interviewRate: test.variant_interview_rate || 0,
      avgResponseTime: test.variant_avg_response_time || 0,
    };

    // Calculate improvements
    const responseRateImprovement = variantMetrics.responseRate - controlMetrics.responseRate;
    const interviewRateImprovement = variantMetrics.interviewRate - controlMetrics.interviewRate;

    // Determine if results are statistically significant
    const isSignificant = this.performChiSquareTest(
      controlMetrics.responses,
      test.control_submissions,
      variantMetrics.responses,
      test.variant_submissions,
    );

    // Determine winner and recommendation
    let winningVariant = 'inconclusive';
    let recommendation = '';

    if (variantMetrics.responseRate > controlMetrics.responseRate) {
      winningVariant = 'variant';
      recommendation = `Variant timing (${test.variant_timing}) shows ${responseRateImprovement.toFixed(1)}% better response rate. ` +
        `Consider adopting this timing for future applications.`;
    } else if (controlMetrics.responseRate > variantMetrics.responseRate) {
      winningVariant = 'control';
      recommendation = `Control timing (${test.control_timing}) performs better. Continue with current approach.`;
    } else {
      recommendation = 'No significant difference detected. More data needed for conclusive results.';
    }

    // Update test with analysis results
    await supabase
      .from('timing_ab_test_results')
      .update({
        response_rate_improvement: responseRateImprovement,
        interview_rate_improvement: interviewRateImprovement,
        p_value: this.calculatePValue(
          controlMetrics.responses,
          test.control_submissions,
          variantMetrics.responses,
          test.variant_submissions,
        ),
        is_statistically_significant: isSignificant,
        winning_variant: winningVariant,
        recommendation_text: recommendation,
        implementation_confidence: Math.min(
          Math.max((test.control_submissions + test.variant_submissions) / (test.minimum_sample_size * 2), 0),
          1,
        ),
      })
      .eq('id', testId);

    return {
      testId,
      controlMetrics,
      variantMetrics,
      improvement: responseRateImprovement,
      isSignificant,
      winningVariant,
      recommendation,
    };
  }

  /**
   * Perform chi-square test for statistical significance
   */
  private performChiSquareTest(
    controlSuccesses: number,
    controlTotal: number,
    variantSuccesses: number,
    variantTotal: number,
  ): boolean {
    // Simplified chi-square test
    // In production, use a proper statistical library
    const controlFailures = controlTotal - controlSuccesses;
    const variantFailures = variantTotal - variantSuccesses;

    const chi2 = (controlSuccesses * variantFailures - controlFailures * variantSuccesses) ** 2 *
      (controlTotal + variantTotal) / (controlTotal * variantTotal * (controlSuccesses + variantSuccesses) * (controlFailures + variantFailures) || 1);

    // Chi-square critical value for p=0.05 is ~3.84
    return chi2 > 3.84;
  }

  /**
   * Calculate p-value from chi-square statistic
   */
  private calculatePValue(
    controlSuccesses: number,
    controlTotal: number,
    variantSuccesses: number,
    variantTotal: number,
  ): number {
    const controlFailures = controlTotal - controlSuccesses;
    const variantFailures = variantTotal - variantSuccesses;

    const chi2 = (controlSuccesses * variantFailures - controlFailures * variantSuccesses) ** 2 *
      (controlTotal + variantTotal) / (controlTotal * variantTotal * (controlSuccesses + variantSuccesses) * (controlFailures + variantFailures) || 1);

    // Approximate p-value from chi-square
    // This is a simplification; use a proper statistical library for production
    if (chi2 < 1) return 0.3;
    if (chi2 < 3.84) return 0.05;
    if (chi2 < 6.63) return 0.01;
    return 0.001;
  }

  /**
   * Complete a test and generate final report
   */
  async completeTest(userId: string, testId: string) {
    const supabase = this.supabaseService.getClient();

    // First analyze the results
    const analysis = await this.analyzeTestResults(userId, testId);

    // Update test status
    const { data: test, error } = await supabase
      .from('timing_ab_test_results')
      .update({
        status: analysis.isSignificant ? 'completed' : 'inconclusive',
        ended_at: new Date().toISOString(),
      })
      .eq('id', testId)
      .select()
      .single();

    if (error) throw error;

    return {
      testId,
      status: test.status,
      analysis,
      recommendation: {
        winningVariant: analysis.winningVariant,
        confidenceLevel: test.implementation_confidence,
        nextSteps: this.generateNextSteps(analysis.winningVariant),
      },
    };
  }

  /**
   * Generate next steps based on test results
   */
  private generateNextSteps(winningVariant: string): string[] {
    if (winningVariant === 'variant') {
      return [
        'Update your submission schedule to use the winning timing',
        'Create a new A/B test to validate results with a different industry',
        'Apply this timing strategy to all future applications',
      ];
    } else if (winningVariant === 'control') {
      return [
        'Continue with your current submission timing strategy',
        'Monitor for any seasonal changes that may affect optimal timing',
        'Consider testing timing by industry for more targeted optimization',
      ];
    } else {
      return [
        'Collect more data before making timing strategy changes',
        'Run the test for a longer period (30+ days)',
        'Increase sample size to ensure statistical significance',
      ];
    }
  }

  /**
   * Get test history for a user
   */
  async getTestHistory(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('timing_ab_test_results')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(test => ({
      testId: test.id,
      testName: test.test_name,
      status: test.status,
      controlTiming: test.control_timing,
      variantTiming: test.variant_timing,
      results: {
        controlResponseRate: test.control_response_rate,
        variantResponseRate: test.variant_response_rate,
        improvement: test.response_rate_improvement,
        isSignificant: test.is_statistically_significant,
        winningVariant: test.winning_variant,
      },
      period: {
        startedAt: new Date(test.started_at),
        endedAt: test.ended_at ? new Date(test.ended_at) : null,
      },
    }));
  }

  /**
   * Track timing correlation with response rates
   */
  async trackTimingCorrelation(userId: string, days: number = 30) {
    const supabase = this.supabaseService.getClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: submissions, error } = await supabase
      .from('application_submission_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('submitted_at', startDate.toISOString());

    if (error) throw error;

    if (!submissions || submissions.length < 5) {
      return {
        message: 'Insufficient data for correlation analysis',
        minRequired: 5,
        current: submissions?.length || 0,
      };
    }

    // Group by timing
    const timingGroups: any = {};

    submissions.forEach(sub => {
      const key = `${sub.day_of_week}-${sub.hour_of_day}:00`;
      if (!timingGroups[key]) {
        timingGroups[key] = { total: 0, responses: 0 };
      }
      timingGroups[key].total++;
      if (sub.got_interview) {
        timingGroups[key].responses++;
      }
    });

    // Calculate correlations
    const correlations: any = [];
    Object.entries(timingGroups).forEach(([timing, data]: any) => {
      correlations.push({
        timing,
        successRate: (data.responses / data.total * 100).toFixed(1),
        submissions: data.total,
      });
    });

    // Sort by success rate
    correlations.sort((a: any, b: any) => parseFloat(b.successRate) - parseFloat(a.successRate));

    return {
      period: `Last ${days} days`,
      bestTiming: correlations[0],
      allTimings: correlations,
      totalSubmissions: submissions.length,
      overallSuccessRate: (submissions.filter((s: any) => s.got_interview).length / submissions.length * 100).toFixed(1),
    };
  }
}
