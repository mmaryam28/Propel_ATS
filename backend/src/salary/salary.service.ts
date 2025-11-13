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
}
