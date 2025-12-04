import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AnalyticsService {
  constructor(private supabase: SupabaseService) {}

  /**
   * UC-080 AC1: Track interview-to-offer conversion rates
   */
  async getConversionRates(userId: string) {
    const { data: interviews, error } = await this.supabase.getClient()
      .from('interviews')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    if (!interviews) return this.getEmptyConversionRates();

    const totalInterviews = interviews.length;
    const offersReceived = interviews.filter(i => i.offer_received).length;
    const offersAccepted = interviews.filter(i => i.offer_accepted).length;
    const passedInterviews = interviews.filter(i => i.outcome === 'Passed' || i.outcome === 'Offer').length;
    const rejectedInterviews = interviews.filter(i => i.outcome === 'Rejected').length;

    return {
      totalInterviews,
      offersReceived,
      offersAccepted,
      passedInterviews,
      rejectedInterviews,
      conversionRate: totalInterviews > 0 ? (offersReceived / totalInterviews * 100).toFixed(1) : '0',
      acceptanceRate: offersReceived > 0 ? (offersAccepted / offersReceived * 100).toFixed(1) : '0',
      passRate: totalInterviews > 0 ? (passedInterviews / totalInterviews * 100).toFixed(1) : '0',
    };
  }

  private getEmptyConversionRates() {
    return {
      totalInterviews: 0,
      offersReceived: 0,
      offersAccepted: 0,
      passedInterviews: 0,
      rejectedInterviews: 0,
      conversionRate: '0',
      acceptanceRate: '0',
      passRate: '0',
    };
  }

  /**
   * UC-080 AC2: Analyze performance trends across different company types
   */
  async getCompanyTypePerformance(userId: string) {
    const { data: interviews, error } = await this.supabase.getClient()
      .from('interviews')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    if (!interviews) return {};

    const companyTypes = {};
    
    interviews.forEach(interview => {
      const type = interview.company_type || 'Unknown';
      if (!companyTypes[type]) {
        companyTypes[type] = {
          total: 0,
          offers: 0,
          passed: 0,
          avgRating: 0,
          ratings: [],
        };
      }
      
      companyTypes[type].total++;
      if (interview.offer_received) companyTypes[type].offers++;
      if (interview.outcome === 'Passed' || interview.outcome === 'Offer') companyTypes[type].passed++;
      if (interview.performance_rating) companyTypes[type].ratings.push(interview.performance_rating);
    });

    // Calculate averages
    Object.keys(companyTypes).forEach(type => {
      const data = companyTypes[type];
      data.successRate = data.total > 0 ? (data.offers / data.total * 100).toFixed(1) : 0;
      data.avgRating = data.ratings.length > 0 
        ? (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(1)
        : 0;
      delete data.ratings;
    });

    return companyTypes;
  }

  /**
   * UC-080 AC3: Identify strongest and weakest interview areas
   */
  async getStrengthsAndWeaknesses(userId: string) {
    const { data: interviews, error } = await this.supabase.getClient()
      .from('interviews')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    if (!interviews) return { strengths: [], weaknesses: [] };

    const strengthsCount = {};
    const weaknessesCount = {};

    interviews.forEach(interview => {
      // Handle strengths as array (already stored as array in database)
      if (interview.strengths && Array.isArray(interview.strengths)) {
        interview.strengths.forEach(strength => {
          strengthsCount[strength] = (strengthsCount[strength] || 0) + 1;
        });
      }

      // Handle weaknesses as array (already stored as array in database)
      if (interview.weaknesses && Array.isArray(interview.weaknesses)) {
        interview.weaknesses.forEach(weakness => {
          weaknessesCount[weakness] = (weaknessesCount[weakness] || 0) + 1;
        });
      }
    });

    const topStrengths = Object.entries(strengthsCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([area, count]) => ({ area, count }));

    const topWeaknesses = Object.entries(weaknessesCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([area, count]) => ({ area, count }));

    return {
      strengths: topStrengths,
      weaknesses: topWeaknesses,
    };
  }

  /**
   * UC-080 AC4: Compare performance across different interview formats
   */
  async getFormatPerformance(userId: string) {
    const { data: interviews, error } = await this.supabase.getClient()
      .from('interviews')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    if (!interviews) return {};

    const formats = {};

    interviews.forEach(interview => {
      const format = interview.interview_type || 'Unknown';
      if (!formats[format]) {
        formats[format] = {
          total: 0,
          passed: 0,
          offers: 0,
          avgRating: 0,
          ratings: [],
        };
      }

      formats[format].total++;
      if (interview.outcome === 'Passed' || interview.outcome === 'Offer') formats[format].passed++;
      if (interview.offer_received) formats[format].offers++;
      if (interview.performance_rating) formats[format].ratings.push(interview.performance_rating);
    });

    // Calculate statistics
    Object.keys(formats).forEach(format => {
      const data = formats[format];
      data.successRate = data.total > 0 ? (data.passed / data.total * 100).toFixed(1) : 0;
      data.offerRate = data.total > 0 ? (data.offers / data.total * 100).toFixed(1) : 0;
      data.avgRating = data.ratings.length > 0
        ? (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(1)
        : 0;
      delete data.ratings;
    });

    return formats;
  }

  /**
   * UC-080 AC5: Monitor improvement over time with practice sessions
   */
  async getImprovementTrends(userId: string) {
    const { data: interviews, error: interviewsError } = await this.supabase.getClient()
      .from('interviews')
      .select('*')
      .eq('user_id', userId)
      .order('interview_date', { ascending: true });

    if (interviewsError) throw interviewsError;
    if (!interviews) return this.getEmptyTrends();

    // Calculate monthly trends
    const monthlyData = {};

    interviews.forEach(interview => {
      const date = interview.interview_date || interview.scheduled_at;
      if (!date) return; // Skip if no date available
      
      const monthKey = new Date(date).toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          interviews: 0,
          offers: 0,
          ratings: [],
          prepTime: 0,
        };
      }

      monthlyData[monthKey].interviews++;
      if (interview.offer_received) monthlyData[monthKey].offers++;
      if (interview.performance_rating) monthlyData[monthKey].ratings.push(interview.performance_rating);
      if (interview.prep_time_hours) monthlyData[monthKey].prepTime += interview.prep_time_hours;
    });

    // Calculate averages and format for charting
    const trends = Object.entries(monthlyData)
      .map(([month, data]: [string, any]) => ({
        month,
        interviews: data.interviews,
        offers: data.offers,
        successRate: data.interviews > 0 ? (data.offers / data.interviews * 100).toFixed(1) : 0,
        avgRating: data.ratings.length > 0
          ? (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(1)
          : 0,
        avgPrepTime: data.interviews > 0 ? (data.prepTime / data.interviews).toFixed(1) : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Practice session impact - use practice_sessions_used from interviews
    const totalPracticeSessions = interviews
      .filter(i => i.practice_sessions_used)
      .reduce((sum, i) => sum + (i.practice_sessions_used || 0), 0);

    const interviewsWithPractice = interviews.filter(i => i.practice_sessions_used && i.practice_sessions_used > 0);
    const avgPracticeScore = interviewsWithPractice.length > 0
      ? (interviewsWithPractice
          .filter(i => i.performance_rating)
          .reduce((sum, i) => sum + (i.performance_rating || 0), 0) / 
         interviewsWithPractice.filter(i => i.performance_rating).length).toFixed(1)
      : '0';

    return {
      monthlyTrends: trends,
      practiceHistory: interviewsWithPractice.map(i => ({
        date: new Date(i.interview_date || i.scheduled_at).toISOString().substring(0, 10),
        sessions: i.practice_sessions_used,
        rating: i.performance_rating,
      })),
      totalPracticeSessions,
      avgPracticeScore,
    };
  }

  private getEmptyTrends() {
    return {
      monthlyTrends: [],
      practiceHistory: [],
      totalPracticeSessions: 0,
      avgPracticeScore: '0',
    };
  }

  /**
   * UC-080 AC6: Generate insights on optimal interview strategies
   */
  async getOptimalStrategies(userId: string) {
    const { data: interviews, error } = await this.supabase.getClient()
      .from('interviews')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    if (!interviews || interviews.length === 0) return this.getEmptyStrategies();

    // Analyze correlation between prep time and success
    const withPrep = interviews.filter(i => i.prep_time_hours && i.prep_time_hours > 0);
    const successfulWithPrep = withPrep.filter(i => i.offer_received);
    const avgPrepTimeSuccess = successfulWithPrep.length > 0
      ? (successfulWithPrep.reduce((sum, i) => sum + (i.prep_time_hours || 0), 0) / successfulWithPrep.length).toFixed(1)
      : '0';

    // Best performing interview stages
    const stagePerformance = {};
    interviews.forEach(interview => {
      const stage = interview.interview_stage || 'Unknown';
      if (!stagePerformance[stage]) {
        stagePerformance[stage] = { total: 0, success: 0 };
      }
      stagePerformance[stage].total++;
      if (interview.offer_received) stagePerformance[stage].success++;
    });

    const bestStage = Object.entries(stagePerformance)
      .map(([stage, data]: [string, any]) => ({
        stage,
        successRate: data.total > 0 ? (data.success / data.total * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => parseFloat(String(b.successRate)) - parseFloat(String(a.successRate)))[0];

    // Practice session correlation
    const withPractice = interviews.filter(i => i.practice_sessions_used && i.practice_sessions_used > 0);
    const successWithPractice = withPractice.filter(i => i.offer_received);
    const practiceImpact = withPractice.length > 0
      ? (successWithPractice.length / withPractice.length * 100).toFixed(1)
      : '0';

    return {
      optimalPrepTime: avgPrepTimeSuccess,
      bestPerformingStage: bestStage,
      practiceSessionImpact: practiceImpact,
      recommendations: this.generateRecommendations(interviews),
    };
  }

  private getEmptyStrategies() {
    return {
      optimalPrepTime: '0',
      bestPerformingStage: { stage: 'N/A', successRate: '0' },
      practiceSessionImpact: '0',
      recommendations: ['Log more interview experiences to get better insights'],
    };
  }

  /**
   * UC-080 AC7: Benchmark performance against industry standards
   */
  async getIndustryBenchmarks(userId: string) {
    const userStats = await this.getConversionRates(userId);
    
    // Industry benchmarks (these would typically come from aggregated data)
    const industryBenchmarks = {
      avgConversionRate: 15, // 15% of interviews lead to offers
      avgAcceptanceRate: 70, // 70% of offers are accepted
      avgInterviewsPerOffer: 7, // Average 7 interviews per offer
      avgPrepTime: 10, // 10 hours preparation per interview
    };

    const { data: userInterviews, error } = await this.supabase.getClient()
      .from('interviews')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    if (!userInterviews) return this.getEmptyBenchmarks(industryBenchmarks);

    const userAvgPrepTime = userInterviews.length > 0
      ? userInterviews
          .filter(i => i.prep_time_hours)
          .reduce((sum, i) => sum + (i.prep_time_hours || 0), 0) / 
        userInterviews.filter(i => i.prep_time_hours).length
      : 0;

    return {
      userStats: {
        conversionRate: parseFloat(String(userStats.conversionRate)),
        acceptanceRate: parseFloat(String(userStats.acceptanceRate)),
        interviewsPerOffer: userStats.offersReceived > 0 
          ? (userStats.totalInterviews / userStats.offersReceived).toFixed(1)
          : '0',
        avgPrepTime: userAvgPrepTime.toFixed(1),
      },
      industryBenchmarks,
      comparison: {
        conversionRate: this.getComparisonText(
          parseFloat(String(userStats.conversionRate)),
          industryBenchmarks.avgConversionRate
        ),
        acceptanceRate: this.getComparisonText(
          parseFloat(String(userStats.acceptanceRate)),
          industryBenchmarks.avgAcceptanceRate
        ),
        prepTime: this.getComparisonText(
          userAvgPrepTime,
          industryBenchmarks.avgPrepTime
        ),
      },
    };
  }

  private getEmptyBenchmarks(industryBenchmarks: any) {
    return {
      userStats: {
        conversionRate: 0,
        acceptanceRate: 0,
        interviewsPerOffer: '0',
        avgPrepTime: '0',
      },
      industryBenchmarks,
      comparison: {
        conversionRate: 'No data',
        acceptanceRate: 'No data',
        prepTime: 'No data',
      },
    };
  }

  /**
   * UC-080 AC8: Provide personalized improvement recommendations
   */
  async getPersonalizedRecommendations(userId: string) {
    const [
      conversionRates,
      strengths,
      formatPerformance,
      trends,
      strategies,
    ] = await Promise.all([
      this.getConversionRates(userId),
      this.getStrengthsAndWeaknesses(userId),
      this.getFormatPerformance(userId),
      this.getImprovementTrends(userId),
      this.getOptimalStrategies(userId),
    ]);

    const recommendations: Array<{
      category: string;
      priority: string;
      recommendation: string;
      actionItems: string[];
    }> = [];

    // Conversion rate recommendations
    if (parseFloat(conversionRates.conversionRate as string) < 15) {
      recommendations.push({
        category: 'Conversion Rate',
        priority: 'high',
        recommendation: 'Your interview-to-offer conversion rate is below industry average. Focus on interview preparation and practice sessions.',
        actionItems: [
          'Schedule more mock interviews',
          'Review common interview questions',
          'Work on your weakest areas identified in past interviews',
        ],
      });
    }

    // Format-specific recommendations
    const weakestFormat = Object.entries(formatPerformance)
      .sort(([, a], [, b]) => parseFloat((a as any).successRate) - parseFloat((b as any).successRate))[0];
    
    if (weakestFormat) {
      recommendations.push({
        category: 'Interview Format',
        priority: 'medium',
        recommendation: `Your success rate in ${weakestFormat[0]} interviews is lower. Focus on improving this format.`,
        actionItems: [
          `Practice ${weakestFormat[0]} interview scenarios`,
          `Study best practices for ${weakestFormat[0]} interviews`,
          'Request feedback after these interview types',
        ],
      });
    }

    // Weakness-specific recommendations
    if (strengths.weaknesses.length > 0) {
      const topWeakness = strengths.weaknesses[0];
      recommendations.push({
        category: 'Skill Development',
        priority: 'high',
        recommendation: `"${topWeakness.area}" appears frequently as a weakness. Prioritize improvement in this area.`,
        actionItems: [
          `Create a study plan for ${topWeakness.area}`,
          `Practice questions related to ${topWeakness.area}`,
          'Track improvement in this area over time',
        ],
      });
    }

    // Preparation time recommendations
    if (parseFloat(strategies.optimalPrepTime as string) > 0) {
      recommendations.push({
        category: 'Preparation Strategy',
        priority: 'medium',
        recommendation: `Your most successful interviews had an average of ${strategies.optimalPrepTime} hours of preparation.`,
        actionItems: [
          `Aim for ${strategies.optimalPrepTime} hours of prep per interview`,
          'Focus preparation on high-impact areas',
          'Use practice sessions effectively',
        ],
      });
    }

    return {
      recommendations,
      overallScore: this.calculateOverallScore(conversionRates, trends),
      nextSteps: strategies.recommendations,
    };
  }

  // Helper methods
  private generateRecommendations(interviews: any[]): string[] {
    const recommendations: string[] = [];

    if (interviews.length < 5) {
      recommendations.push('Log more interview experiences to get better insights');
    }

    const withPrep = interviews.filter(i => i.prep_time_hours);
    if (withPrep.length < interviews.length * 0.5) {
      recommendations.push('Track preparation time for more accurate analysis');
    }

    const withRatings = interviews.filter(i => i.performance_rating);
    if (withRatings.length < interviews.length * 0.5) {
      recommendations.push('Rate your interview performance to identify trends');
    }

    return recommendations;
  }

  private getComparisonText(userValue: number, benchmarkValue: number): string {
    const diff = ((userValue - benchmarkValue) / benchmarkValue * 100).toFixed(0);
    if (userValue > benchmarkValue) {
      return `${diff}% above average`;
    } else if (userValue < benchmarkValue) {
      return `${Math.abs(parseFloat(diff))}% below average`;
    }
    return 'At industry average';
  }

  private calculateOverallScore(conversionRates: any, trends: any): number {
    let score = 50; // Base score

    // Conversion rate impact (max +25)
    const conversionRate = parseFloat(conversionRates.conversionRate as string);
    if (conversionRate > 20) score += 25;
    else if (conversionRate > 15) score += 20;
    else if (conversionRate > 10) score += 15;
    else if (conversionRate > 5) score += 10;

    // Improvement trend impact (max +25)
    if (trends.monthlyTrends.length >= 2) {
      const recent = trends.monthlyTrends.slice(-2);
      if (parseFloat(recent[1].successRate) > parseFloat(recent[0].successRate)) {
        score += 25;
      } else if (parseFloat(recent[1].successRate) === parseFloat(recent[0].successRate)) {
        score += 15;
      }
    }

    return Math.min(score, 100);
  }
}
