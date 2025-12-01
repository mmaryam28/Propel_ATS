import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface SalaryRange {
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  avg: number;
}

@Injectable()
export class SalaryService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * UC-067 AC1: Display salary ranges for similar positions
   */
  async getSalaryRanges(
    title: string,
    location?: string,
    experienceLevel?: string,
    benefits?: string,
  ): Promise<any> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('salary_data')
      .select('min_salary, max_salary, avg_salary, benefits')
      .ilike('title', `%${title}%`);

    if (location) query = query.ilike('location', `%${location}%`);
    if (experienceLevel) query = query.eq('experience_level', experienceLevel);
    if (benefits) query = query.ilike('benefits', `%${benefits}%`);

    const { data, error } = await query;
    if (error) throw error;

    const salaries = (data || []).map((r) => r.avg_salary).filter((s) => s);

    return {
      title,
      location,
      experienceLevel,
      benefits,
      range: this.calculateRange(salaries),
    };
  }

  /**
   * UC-067 AC3: Show total compensation including benefits
   */
  async getTotalCompensation(
    title: string,
    location?: string,
    experienceLevel?: string,
    benefits?: string,
  ): Promise<any> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('salary_data')
      .select('avg_salary, benefits')
      .ilike('title', `%${title}%`);

    if (location) query = query.ilike('location', `%${location}%`);
    if (experienceLevel) query = query.eq('experience_level', experienceLevel);
    if (benefits) query = query.ilike('benefits', `%${benefits}%`);

    const { data, error } = await query;
    if (error) throw error;

    const records = data || [];
    const totalComps = records.map(
      (r) => (r.avg_salary || 0) + (r.benefits || 0),
    );

    return {
      title,
      location,
      experienceLevel,
      benefits,
      breakdown: {
        avgBase: Math.round(
          records.reduce((sum, r) => sum + (r.avg_salary || 0), 0) / (records.length || 1),
        ),
        avgBenefits: Math.round(
          records.reduce((sum, r) => sum + (r.benefits || 0), 0) / (records.length || 1),
        ),
      },
      compensation: this.calculateRange(totalComps),
    };
  }

  /**
   * UC-067 AC4: Compare salary across different companies
   */
  async compareSalariesAcrossCompanies(
    title: string,
    location?: string,
    benefits?: string,
  ): Promise<any> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('salary_data')
      .select('company, avg_salary, benefits')
      .ilike('title', `%${title}%`);

    if (location) query = query.ilike('location', `%${location}%`);
    if (benefits) query = query.ilike('benefits', `%${benefits}%`);

    const { data, error } = await query;
    if (error) throw error;

    const grouped: { [key: string]: any[] } = {};
    (data || []).forEach((record) => {
      const company = record.company || 'Unknown';
      if (!grouped[company]) grouped[company] = [];
      grouped[company].push(record);
    });

    const companies = Object.entries(grouped).map(([company, records]) => {
      // Collect all unique benefits across records for this company
      const allBenefits: string[] = [];
      records.forEach(r => {
        if (r.benefits && typeof r.benefits === 'string' && r.benefits.trim() !== '') {
          allBenefits.push(r.benefits.trim());
        }
      });
      
      // Get most common benefits string or combine unique ones
      const benefitsText = allBenefits.length > 0 
        ? allBenefits[0]  // Use the first record's benefits as representative
        : '';
      
      return {
        company,
        avgSalary: Math.round(
          records.reduce((sum, r) => sum + (r.avg_salary || 0), 0) / records.length,
        ),
        benefits: benefitsText,
        count: records.length,
      };
    });

    return {
      title,
      location,
      benefits,
      companies,
    };
  }

  /**
   * UC-067 AC5: Historical salary trend data
   */
  async getSalaryTrends(title: string, location?: string): Promise<any> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('salary_data')
      .select('avg_salary, created_at')
      .ilike('title', `%${title}%`);

    if (location) query = query.ilike('location', `%${location}%`);

    const { data, error } = await query;
    if (error) throw error;

    const monthlyData: { [key: string]: number[] } = {};
    (data || []).forEach((record) => {
      if (record.created_at) {
        const month = record.created_at.substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) monthlyData[month] = [];
        monthlyData[month].push(record.avg_salary || 0);
      }
    });

    const trends = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, salaries]) => ({
        month,
        avg: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
      }));

    return { title, location, trends };
  }

  /**
   * UC-067 AC6: Negotiation recommendations based on market data
   */
  async getNegotiationRecommendations(
    title: string,
    currentSalary: number,
    location?: string,
    experienceLevel?: string,
  ): Promise<any> {
    const ranges = await this.getSalaryRanges(title, location, experienceLevel);
    const marketAvg = ranges.range.avg;
    const percentDiff = ((currentSalary - marketAvg) / marketAvg) * 100;

    let strategy = '';
    let recommendedSalary = currentSalary;

    if (percentDiff < -15) {
      strategy = 'STRONG - You are significantly underpaid. Target 75th percentile or higher.';
      recommendedSalary = ranges.range.p75;
    } else if (percentDiff < -5) {
      strategy = 'MODERATE - You are below market average. Target median salary.';
      recommendedSalary = ranges.range.median;
    } else if (percentDiff > 15) {
      strategy = 'STRONG POSITION - You are above market average. Maintain current salary.';
    } else {
      strategy = 'COMPETITIVE - Your salary is aligned with market. Minor adjustments possible.';
    }

    return {
      title,
      location,
      experienceLevel,
      currentSalary,
      marketAverage: marketAvg,
      percentageDifference: Math.round(percentDiff),
      recommendedSalary: Math.round(recommendedSalary),
      negotiationStrategy: strategy,
      marketRange: ranges.range,
    };
  }

  /**
   * UC-067 AC7: Compare user's salary with current compensation
   */
  async compareSalaryWithCurrent(
    title: string,
    userCurrentSalary: number,
    userBonusPercentage?: number,
    userBenefitsValue?: number,
  ): Promise<any> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('salary_data')
      .select('avg_salary, benefits')
      .ilike('title', `%${title}%`);

    const { data, error } = await query;
    if (error) throw error;

    const records = data || [];
    const userBonus = Math.round(userCurrentSalary * ((userBonusPercentage || 0) / 100));
    const userBenefits = userBenefitsValue || 0;
    const userTotal = userCurrentSalary + userBonus + userBenefits;

    const marketAvgSalary = Math.round(
      records.reduce((sum, r) => sum + (r.avg_salary || 0), 0) / (records.length || 1),
    );
    const marketAvgBenefits = Math.round(
      records.reduce((sum, r) => sum + (r.benefits || 0), 0) / (records.length || 1),
    );
    const marketAvgTotal = marketAvgSalary + marketAvgBenefits;

    return {
      title,
      userCompensation: {
        baseSalary: userCurrentSalary,
        bonus: userBonus,
        benefits: userBenefits,
        total: userTotal,
      },
      marketComparison: {
        baseSalary: marketAvgSalary,
        benefits: marketAvgBenefits,
        total: marketAvgTotal,
      },
      differences: {
        baseSalaryDiff: marketAvgSalary - userCurrentSalary,
        benefitsDiff: marketAvgBenefits - userBenefits,
        totalDiff: marketAvgTotal - userTotal,
      },
      percentageDifference: Math.round(((marketAvgTotal - userTotal) / userTotal) * 100),
    };
  }

  /**
   * UC-067 AC8: Export salary research reports
   */
  async exportSalaryReport(
    title: string,
    location?: string,
    format: 'csv' | 'json' = 'json',
  ): Promise<any> {
    const ranges = await this.getSalaryRanges(title, location);
    const companies = await this.compareSalariesAcrossCompanies(title, location);
    const trends = await this.getSalaryTrends(title, location);
    const compensation = await this.getTotalCompensation(title, location);

    const report = {
      title,
      location,
      generatedDate: new Date().toISOString(),
      salaryRanges: ranges.range,
      companies: companies.companies,
      trends: trends.trends,
      compensation: compensation.breakdown,
    };

    if (format === 'csv') {
      return this.convertToCSV(report);
    }

    return report;
  }

  // Helper methods
  private calculateRange(values: number[]): SalaryRange {
    if (values.length === 0) {
      return { min: 0, p25: 0, median: 0, p75: 0, max: 0, avg: 0 };
    }

    const sorted = values.sort((a, b) => a - b);
    const len = sorted.length;

    return {
      min: sorted[0],
      p25: sorted[Math.floor(len * 0.25)],
      median: sorted[Math.floor(len * 0.5)],
      p75: sorted[Math.floor(len * 0.75)],
      max: sorted[len - 1],
      avg: Math.round(sorted.reduce((a, b) => a + b) / len),
    };
  }

  private convertToCSV(report: any): string {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Position', report.title],
      ['Location', report.location || 'N/A'],
      ['Generated Date', report.generatedDate],
      [''],
      ['Salary Range', ''],
      ['Minimum', report.salaryRanges?.min],
      ['Median', report.salaryRanges?.median],
      ['75th Percentile', report.salaryRanges?.p75],
      ['Maximum', report.salaryRanges?.max],
    ];

    return [headers, ...rows].map((row) => row.map((cell) => `"${cell || ''}"`).join(',')).join('\n');
  }

  /**
   * UC-100: Generate comprehensive salary analytics for user
   */
  async generateSalaryAnalytics(
    userId: string,
    title?: string,
    location?: string,
    experienceLevel?: string,
    currentSalary?: number,
  ): Promise<any> {
    const supabase = this.supabaseService.getClient();

    // Get user's job offers
    const { data: offers, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('userId', userId)
      .eq('status', 'Offer')
      .order('createdAt', { ascending: true });

    if (error) throw error;

    const userOffers = (offers || []).map((job: any) => ({
      id: job.id,
      company: job.company,
      title: job.title,
      location: job.location,
      date: job.createdAt,
      baseSalary: job.salaryMin || job.salaryMax || 0,
      maxSalary: job.salaryMax || job.salaryMin || 0,
      negotiationNotes: job.negotiationNotes,
      statusUpdatedAt: job.statusUpdatedAt,
    }));

    // Calculate salary progression
    const salaryProgression = userOffers.map((offer, index) => ({
      company: offer.company,
      title: offer.title,
      date: new Date(offer.date).toLocaleDateString(),
      baseSalary: offer.baseSalary,
      maxSalary: offer.maxSalary,
      increase: index > 0 ? offer.baseSalary - userOffers[index - 1].baseSalary : 0,
      negotiated: offer.negotiationNotes ? true : false,
    }));

    // Calculate negotiation success
    const negotiatedOffers = userOffers.filter(o => o.negotiationNotes);
    const negotiationSuccessRate = userOffers.length > 0 
      ? (negotiatedOffers.length / userOffers.length) * 100 
      : 0;

    // Calculate average increase from negotiation
    let avgNegotiationIncrease = 0;
    if (negotiatedOffers.length > 0) {
      const increases = negotiatedOffers.map((offer, idx) => {
        const offerIndex = userOffers.findIndex(o => o.id === offer.id);
        if (offerIndex > 0) {
          return offer.maxSalary - offer.baseSalary;
        }
        return 0;
      }).filter(inc => inc > 0);
      
      if (increases.length > 0) {
        avgNegotiationIncrease = increases.reduce((a, b) => a + b, 0) / increases.length;
      }
    }

    // Career progression impact
    const careerProgression = {
      totalOffers: userOffers.length,
      avgIncrease: userOffers.length > 1 
        ? (userOffers[userOffers.length - 1].baseSalary - userOffers[0].baseSalary) / (userOffers.length - 1)
        : 0,
      trending: userOffers.length > 1 
        ? userOffers[userOffers.length - 1].baseSalary > userOffers[0].baseSalary ? 'up' : 'flat'
        : 'insufficient_data',
    };

    // Timing insights
    const offersByQuarter: { [key: string]: number[] } = {};
    userOffers.forEach(offer => {
      const date = new Date(offer.date);
      const quarter = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
      if (!offersByQuarter[quarter]) offersByQuarter[quarter] = [];
      offersByQuarter[quarter].push(offer.baseSalary);
    });

    const quarterlyAvg = Object.entries(offersByQuarter).map(([quarter, salaries]) => ({
      quarter,
      avgSalary: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
      count: salaries.length,
    }));

    const bestQuarter = quarterlyAvg.length > 0 
      ? quarterlyAvg.reduce((best, curr) => curr.avgSalary > best.avgSalary ? curr : best)
      : null;

    // Market positioning
    let marketPositioning: any = null;
    if (title) {
      try {
        const marketData = await this.getSalaryRanges(title, location, experienceLevel);
        const userAvgSalary = userOffers.length > 0
          ? userOffers.reduce((sum, o) => sum + o.baseSalary, 0) / userOffers.length
          : currentSalary || 0;

        const marketAvg = marketData.range.avg;
        const percentile = this.calculatePercentile(userAvgSalary, marketData.range);

        marketPositioning = {
          userAvg: Math.round(userAvgSalary),
          marketAvg,
          percentile,
          status: percentile >= 75 ? 'top_25' : percentile >= 50 ? 'above_average' : percentile >= 25 ? 'average' : 'below_average',
          difference: Math.round(userAvgSalary - marketAvg),
          percentDifference: marketAvg > 0 ? Math.round(((userAvgSalary - marketAvg) / marketAvg) * 100) : 0,
        };
      } catch (err) {
        console.error('Error fetching market data:', err);
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      salaryProgression,
      negotiationSuccessRate,
      marketPositioning,
      careerProgression,
    );

    // Total compensation trends
    const compensationTrends = {
      basePay: salaryProgression.map(sp => ({ date: sp.date, value: sp.baseSalary })),
      trending: careerProgression.trending,
    };

    return {
      userId,
      generatedAt: new Date().toISOString(),
      salaryProgression,
      negotiationSuccess: {
        rate: Math.round(negotiationSuccessRate),
        avgIncrease: Math.round(avgNegotiationIncrease),
        totalNegotiated: negotiatedOffers.length,
        totalOffers: userOffers.length,
      },
      careerProgression,
      marketPositioning,
      timingInsights: {
        quarterlyAverage: quarterlyAvg,
        bestQuarter: bestQuarter?.quarter,
        bestQuarterAvg: bestQuarter?.avgSalary,
      },
      compensationTrends,
      recommendations,
    };
  }

  private calculatePercentile(value: number, range: SalaryRange): number {
    if (value <= range.min) return 0;
    if (value >= range.max) return 100;
    if (value <= range.p25) return 25 * ((value - range.min) / (range.p25 - range.min));
    if (value <= range.median) return 25 + 25 * ((value - range.p25) / (range.median - range.p25));
    if (value <= range.p75) return 50 + 25 * ((value - range.median) / (range.p75 - range.median));
    return 75 + 25 * ((value - range.p75) / (range.max - range.p75));
  }

  private generateRecommendations(
    salaryProgression: any[],
    negotiationRate: number,
    marketPos: any,
    careerProg: any,
  ): any[] {
    const recommendations: any[] = [];

    // Market positioning recommendation
    if (marketPos) {
      if (marketPos.status === 'below_average') {
        recommendations.push({
          type: 'market_position',
          priority: 'high',
          title: 'Below Market Average',
          message: `You are ${Math.abs(marketPos.percentDifference)}% below market average. Consider targeting companies known for competitive compensation or upskilling in high-demand areas.`,
          action: 'Research top-paying companies and update your skills',
        });
      } else if (marketPos.status === 'top_25') {
        recommendations.push({
          type: 'market_position',
          priority: 'low',
          title: 'Strong Market Position',
          message: `You're in the top 25% for your market. Focus on maintaining your competitive edge.`,
          action: 'Continue developing leadership and specialized skills',
        });
      }
    }

    // Negotiation recommendation
    if (negotiationRate < 50) {
      recommendations.push({
        type: 'negotiation',
        priority: 'medium',
        title: 'Improve Negotiation Success',
        message: `Your negotiation rate is ${Math.round(negotiationRate)}%. Research salary benchmarks and practice negotiation tactics to increase your offers.`,
        action: 'Prepare counter-examples and research market rates before negotiations',
      });
    }

    // Career progression recommendation
    if (careerProg.trending === 'flat' && salaryProgression.length > 2) {
      recommendations.push({
        type: 'career_growth',
        priority: 'high',
        title: 'Salary Growth Stagnant',
        message: 'Your salary offers have been relatively flat. Consider seeking roles with more responsibility or at larger companies.',
        action: 'Target senior positions or explore high-growth industries',
      });
    }

    // General advice if no offers yet
    if (salaryProgression.length === 0) {
      recommendations.push({
        type: 'general',
        priority: 'medium',
        title: 'Start Tracking Offers',
        message: 'Begin tracking your job offers to gain insights into your salary progression and negotiation success over time.',
        action: 'Add your current or past offers to see personalized analytics',
      });
    }

    return recommendations;
  }
}
