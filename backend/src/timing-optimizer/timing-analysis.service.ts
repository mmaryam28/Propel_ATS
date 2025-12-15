import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface TimingPattern {
  industry: string;
  companySize: string;
  bestDayOfWeek: string;
  bestHourRange: string;
  avgResponseRate: number;
  badDays: string[];
  avoidReasons: string[];
}

interface SubmissionMetric {
  applicationId: number;
  submittedAt: Date;
  dayOfWeek: string;
  hourOfDay: number;
  industry: string;
  companySize: string;
  gotInterview: boolean;
  responseTime?: number;
}

@Injectable()
export class TimingAnalysisService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Analyze historical submission data to identify patterns by industry and company size
   */
  async analyzeIndustryPatterns(industry: string, companySize: string) {
    const supabase = this.supabaseService.getClient();

    // First, try to get pre-calculated patterns from industry_timing_patterns table
    const { data: patterns, error: patternError } = await supabase
      .from('industry_timing_patterns')
      .select('*')
      .eq('industry', industry)
      .eq('company_size', companySize)
      .single();

    if (patterns && !patternError) {
      return {
        industry: patterns.industry,
        companySize: patterns.company_size,
        bestDayOfWeek: patterns.best_day_of_week,
        bestHourRange: patterns.best_hour_range,
        avgResponseRate: patterns.avg_response_rate,
        submissions: patterns.submission_count,
        badDays: patterns.bad_days_of_week,
        avoidReasons: patterns.avoid_reasons,
        avgResponseTime: patterns.avg_response_time_hours,
        timeZoneConsiderations: this.getTimeZoneAdjustments(),
      };
    }

    // Fallback: calculate from historical submission metrics if available
    const { data: submissions, error } = await supabase
      .from('application_submission_metrics')
      .select('*')
      .eq('industry', industry)
      .eq('company_size', companySize);

    if (error) throw error;

    if (!submissions || submissions.length === 0) {
      return this.getDefaultPattern(industry, companySize);
    }

    return this.calculatePatterns(submissions, industry, companySize);
  }

  /**
   * Calculate timing patterns from historical data
   */
  private calculatePatterns(submissions: any[], industry: string, companySize: string) {
    // Group by day of week and hour
    const dayMetrics = this.groupByDayOfWeek(submissions);
    const hourMetrics = this.groupByHour(submissions);

    // Find best day and hour
    const bestDay = this.findBestDay(dayMetrics);
    const bestHour = this.findBestHour(hourMetrics);
    const badDays = this.identifyBadDays(dayMetrics);

    // Calculate response rates
    const respondedSubmissions = submissions.filter(s => s.got_interview);
    const responseRate = (respondedSubmissions.length / submissions.length) * 100;

    return {
      industry,
      companySize,
      bestDayOfWeek: bestDay.day,
      bestHourRange: `${bestHour.start}-${bestHour.start + 2} AM`,
      avgResponseRate: responseRate,
      submissions: submissions.length,
      badDays: badDays.map(d => d.day),
      avoidReasons: this.getAvoidReasons(badDays),
      avgResponseTime: this.calculateAvgResponseTime(submissions),
      timeZoneConsiderations: this.getTimeZoneAdjustments(),
    };
  }

  /**
   * Group submissions by day of week
   */
  private groupByDayOfWeek(submissions: any[]) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayData: any = {};

    days.forEach(day => {
      dayData[day] = {
        day,
        submissions: 0,
        responses: 0,
        interviews: 0,
      };
    });

    submissions.forEach(submission => {
      const day = submission.day_of_week;
      if (dayData[day]) {
        dayData[day].submissions++;
        if (submission.got_interview) {
          dayData[day].responses++;
          dayData[day].interviews++;
        }
      }
    });

    // Calculate response rates
    Object.keys(dayData).forEach(day => {
      dayData[day].responseRate =
        dayData[day].submissions > 0
          ? (dayData[day].responses / dayData[day].submissions) * 100
          : 0;
    });

    return Object.values(dayData);
  }

  /**
   * Group submissions by hour of day
   */
  private groupByHour(submissions: any[]) {
    const hourData: any = {};

    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourData[i] = {
        hour: i,
        submissions: 0,
        responses: 0,
        interviews: 0,
      };
    }

    // Aggregate data
    submissions.forEach(submission => {
      const hour = submission.hour_of_day;
      if (hourData[hour]) {
        hourData[hour].submissions++;
        if (submission.got_interview) {
          hourData[hour].responses++;
          hourData[hour].interviews++;
        }
      }
    });

    // Calculate response rates
    Object.keys(hourData).forEach(hour => {
      hourData[hour].responseRate =
        hourData[hour].submissions > 0
          ? (hourData[hour].responses / hourData[hour].submissions) * 100
          : 0;
    });

    return Object.values(hourData);
  }

  /**
   * Find the best day of week based on response rate
   */
  private findBestDay(dayMetrics: any) {
    return dayMetrics.reduce((best: any, current: any) =>
      current.responseRate > best.responseRate ? current : best,
    );
  }

  /**
   * Find the best hour range based on response rate
   */
  private findBestHour(hourMetrics: any) {
    let bestRange = { start: 9, responseRate: 0 };

    for (let i = 0; i < hourMetrics.length - 2; i++) {
      const rangeRate = (hourMetrics[i].responseRate +
        hourMetrics[i + 1].responseRate +
        hourMetrics[i + 2].responseRate) / 3;

      if (rangeRate > bestRange.responseRate) {
        bestRange = { start: i, responseRate: rangeRate };
      }
    }

    return bestRange;
  }

  /**
   * Identify bad days (Friday, weekends) with low response rates
   */
  private identifyBadDays(dayMetrics: any) {
    const avgResponseRate = dayMetrics.reduce((sum: number, day: any) => sum + day.responseRate, 0) / dayMetrics.length;
    return dayMetrics.filter((day: any) => day.responseRate < avgResponseRate * 0.7);
  }

  /**
   * Get reasons to avoid certain days
   */
  private getAvoidReasons(badDays: any[]): string[] {
    const reasons: Set<string> = new Set();

    badDays.forEach(day => {
      if (day.day === 'Friday') {
        reasons.add('Friday evenings - low hiring team availability');
      }
      if (day.day === 'Saturday' || day.day === 'Sunday') {
        reasons.add('Weekends - emails often missed by recruiters');
      }
      if (day.day === 'Monday') {
        reasons.add('Monday mornings - high email volume');
      }
    });

    // Add fiscal/seasonal reasons
    reasons.add('End of month - budget constraints');
    reasons.add('End of quarter - hiring freezes');
    reasons.add('Holiday periods - reduced staffing');

    return Array.from(reasons);
  }

  /**
   * Calculate average response time
   */
  private calculateAvgResponseTime(submissions: any[]): number {
    const withResponse = submissions.filter(s => s.response_time_hours);
    if (withResponse.length === 0) return 0;

    const totalTime = withResponse.reduce((sum, s) => sum + s.response_time_hours, 0);
    return Math.round(totalTime / withResponse.length);
  }

  /**
   * Get default pattern if no historical data
   */
  private getDefaultPattern(industry: string, companySize: string) {
    return {
      industry,
      companySize,
      bestDayOfWeek: 'Tuesday',
      bestHourRange: '9-11 AM',
      avgResponseRate: 15, // Industry average
      submissions: 0,
      badDays: ['Friday', 'Saturday', 'Sunday'],
      avoidReasons: [
        'Friday evenings - low hiring team availability',
        'Weekends - emails often missed by recruiters',
        'End of month - budget constraints',
      ],
      avgResponseTime: 48,
      timeZoneConsiderations: this.getTimeZoneAdjustments(),
    };
  }

  /**
   * Get time zone adjustment recommendations
   */
  private getTimeZoneAdjustments() {
    return {
      PST: { offset: -3, note: 'West Coast - earlier in the day recommended' },
      MST: { offset: -2, note: 'Mountain Time - standard timing' },
      CST: { offset: -1, note: 'Central Time - standard timing' },
      EST: { offset: 0, note: 'East Coast - baseline' },
      GMT: { offset: 5, note: 'UK/Europe - early morning EST' },
      IST: { offset: 10, note: 'India - very early morning EST' },
    };
  }

  /**
   * Track a new application submission for metrics
   */
  async trackSubmission(userId: string, data: SubmissionMetric) {
    const supabase = this.supabaseService.getClient();

    const now = new Date(data.submittedAt);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];

    const { data: metric, error } = await supabase
      .from('application_submission_metrics')
      .insert({
        user_id: userId,
        application_id: data.applicationId,
        submitted_at: data.submittedAt,
        day_of_week: dayOfWeek,
        hour_of_day: data.hourOfDay,
        industry: data.industry,
        company_size: data.companySize,
        got_interview: data.gotInterview,
        response_time_hours: data.responseTime,
      })
      .select()
      .single();

    if (error) throw error;
    return metric;
  }

  /**
   * Calculate correlation between timing and response rates
   */
  async calculateTimingCorrelation(userId: string, industry?: string) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('application_submission_metrics')
      .select('*')
      .eq('user_id', userId);

    if (industry) {
      query = query.eq('industry', industry);
    }

    const { data: submissions, error } = await query;

    if (error) throw error;
    if (!submissions || submissions.length < 5) {
      return { message: 'Insufficient data for correlation analysis', submissions: submissions?.length || 0 };
    }

    // Calculate correlation between day/hour and success
    const dayCorrelation = this.calculateDayCorrelation(submissions);
    const hourCorrelation = this.calculateHourCorrelation(submissions);

    return {
      dayOfWeekCorrelation: dayCorrelation,
      hourOfDayCorrelation: hourCorrelation,
      sampleSize: submissions.length,
      recommendation: this.generateCorrelationRecommendation(dayCorrelation, hourCorrelation),
    };
  }

  /**
   * Calculate correlation for day of week
   */
  private calculateDayCorrelation(submissions: any[]) {
    const days: any = {};

    submissions.forEach(sub => {
      const day = sub.day_of_week;
      if (!days[day]) {
        days[day] = { total: 0, success: 0 };
      }
      days[day].total++;
      if (sub.got_interview) {
        days[day].success++;
      }
    });

    const result: any = {};
    Object.keys(days).forEach(day => {
      result[day] = (days[day].success / days[day].total).toFixed(2);
    });

    return result;
  }

  /**
   * Calculate correlation for hour of day
   */
  private calculateHourCorrelation(submissions: any[]) {
    const hours: any = {};

    submissions.forEach(sub => {
      const hour = sub.hour_of_day;
      if (!hours[hour]) {
        hours[hour] = { total: 0, success: 0 };
      }
      hours[hour].total++;
      if (sub.got_interview) {
        hours[hour].success++;
      }
    });

    const result: any = {};
    Object.keys(hours).forEach(hour => {
      result[hour] = (hours[hour].success / hours[hour].total).toFixed(2);
    });

    return result;
  }

  /**
   * Generate recommendation based on correlation analysis
   */
  private generateCorrelationRecommendation(dayCorrelation: any, hourCorrelation: any): string {
    const bestDay = Object.entries(dayCorrelation).reduce((best: any, current: any) =>
      Number(current[1]) > Number(best[1]) ? current : best,
    );

    const bestHour = Object.entries(hourCorrelation).reduce((best: any, current: any) =>
      Number(current[1]) > Number(best[1]) ? current : best,
    );

    return `Based on your history, best submit on ${bestDay[0]} around ${bestHour[0]}:00. Success rate on that day/time: ${(Number(bestDay[1]) * 100).toFixed(1)}%`;
  }
}
