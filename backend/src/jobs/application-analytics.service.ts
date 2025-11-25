import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ApplicationAnalyticsService {
  constructor(private supabase: SupabaseService) {}

  /**
   * UC-097 AC1: Analyze success rates by industry, company size, and role type
   */
  async getSuccessRatesByCategory(userId: string) {
    const { data: jobs, error } = await this.supabase.getClient()
      .from('jobs')
      .select('*')
      .eq('userId', userId)
      .is('archivedAt', null);

    if (error) throw error;
    if (!jobs || jobs.length === 0) return this.getEmptySuccessRates();

    // Analyze by Industry
    const byIndustry = this.groupByField(jobs, 'industry');
    
    // Analyze by Company Size
    const byCompanySize = this.groupByField(jobs, 'companySize');
    
    // Analyze by Role Type (extracted from title)
    const byRoleType = this.groupByRoleType(jobs);

    return {
      byIndustry,
      byCompanySize,
      byRoleType,
      overall: this.calculateOverallStats(jobs),
    };
  }

  private groupByField(jobs: any[], field: string) {
    const grouped = {};
    
    jobs.forEach(job => {
      const key = job[field] || 'Unknown';
      if (!grouped[key]) {
        grouped[key] = {
          total: 0,
          applied: 0,
          responded: 0,
          interviewed: 0,
          offered: 0,
          rejected: 0,
        };
      }
      
      grouped[key].total++;
      
      const status = job.status;
      if (status === 'Applied') grouped[key].applied++;
      if (['Phone Screen', 'Interview', 'Offer'].includes(status)) grouped[key].responded++;
      if (['Interview', 'Offer'].includes(status)) grouped[key].interviewed++;
      if (status === 'Offer') grouped[key].offered++;
      if (status === 'Rejected') grouped[key].rejected++;
    });

    // Calculate rates
    Object.keys(grouped).forEach(key => {
      const data = grouped[key];
      data.responseRate = data.total > 0 ? ((data.responded / data.total) * 100).toFixed(1) : '0';
      data.interviewRate = data.total > 0 ? ((data.interviewed / data.total) * 100).toFixed(1) : '0';
      data.offerRate = data.total > 0 ? ((data.offered / data.total) * 100).toFixed(1) : '0';
    });

    return grouped;
  }

  private groupByRoleType(jobs: any[]) {
    const roleCategories = {
      'Entry-Level': 0,
      'Mid-Level': 0,
      'Senior': 0,
      'Lead/Manager': 0,
    };

    const roleStats = {
      'Entry-Level': { total: 0, responded: 0, interviewed: 0, offered: 0 },
      'Mid-Level': { total: 0, responded: 0, interviewed: 0, offered: 0 },
      'Senior': { total: 0, responded: 0, interviewed: 0, offered: 0 },
      'Lead/Manager': { total: 0, responded: 0, interviewed: 0, offered: 0 },
    };

    jobs.forEach(job => {
      const title = (job.title || '').toLowerCase();
      let category = 'Mid-Level';

      if (title.includes('junior') || title.includes('entry') || title.includes('associate')) {
        category = 'Entry-Level';
      } else if (title.includes('senior') || title.includes('sr.')) {
        category = 'Senior';
      } else if (title.includes('lead') || title.includes('manager') || title.includes('director') || title.includes('head')) {
        category = 'Lead/Manager';
      }

      roleStats[category].total++;
      
      const status = job.status;
      if (['Phone Screen', 'Interview', 'Offer'].includes(status)) roleStats[category].responded++;
      if (['Interview', 'Offer'].includes(status)) roleStats[category].interviewed++;
      if (status === 'Offer') roleStats[category].offered++;
    });

    // Calculate rates
    Object.keys(roleStats).forEach(role => {
      const data = roleStats[role];
      data.responseRate = data.total > 0 ? ((data.responded / data.total) * 100).toFixed(1) : '0';
      data.interviewRate = data.total > 0 ? ((data.interviewed / data.total) * 100).toFixed(1) : '0';
      data.offerRate = data.total > 0 ? ((data.offered / data.total) * 100).toFixed(1) : '0';
    });

    return roleStats;
  }

  private calculateOverallStats(jobs: any[]) {
    const total = jobs.length;
    const responded = jobs.filter(j => ['Phone Screen', 'Interview', 'Offer'].includes(j.status)).length;
    const interviewed = jobs.filter(j => ['Interview', 'Offer'].includes(j.status)).length;
    const offered = jobs.filter(j => j.status === 'Offer').length;
    const rejected = jobs.filter(j => j.status === 'Rejected').length;

    return {
      total,
      responded,
      interviewed,
      offered,
      rejected,
      responseRate: total > 0 ? ((responded / total) * 100).toFixed(1) : '0',
      interviewRate: total > 0 ? ((interviewed / total) * 100).toFixed(1) : '0',
      offerRate: total > 0 ? ((offered / total) * 100).toFixed(1) : '0',
    };
  }

  private getEmptySuccessRates() {
    return {
      byIndustry: {},
      byCompanySize: {},
      byRoleType: {},
      overall: {
        total: 0,
        responded: 0,
        interviewed: 0,
        offered: 0,
        rejected: 0,
        responseRate: '0',
        interviewRate: '0',
        offerRate: '0',
      },
    };
  }

  /**
   * UC-097 AC2: Compare performance across different application methods and sources
   */
  async getApplicationMethodPerformance(userId: string) {
    const { data: jobs, error } = await this.supabase.getClient()
      .from('jobs')
      .select('*')
      .eq('userId', userId)
      .is('archivedAt', null);

    if (error) throw error;
    if (!jobs || jobs.length === 0) return { byMethod: {}, bySource: {} };

    const byMethod = this.groupByField(jobs, 'application_method');
    const bySource = this.groupByField(jobs, 'application_source');

    return { byMethod, bySource };
  }

  /**
   * UC-097 AC3: Identify patterns in successful applications vs. rejections
   */
  async getSuccessPatterns(userId: string) {
    const { data: jobs, error } = await this.supabase.getClient()
      .from('jobs')
      .select('*')
      .eq('userId', userId)
      .is('archivedAt', null);

    if (error) throw error;
    if (!jobs || jobs.length === 0) return this.getEmptyPatterns();

    const successful = jobs.filter(j => ['Phone Screen', 'Interview', 'Offer'].includes(j.status));
    const rejected = jobs.filter(j => j.status === 'Rejected');

    const successfulPatterns = this.analyzePatterns(successful);
    const rejectedPatterns = this.analyzePatterns(rejected);

    return {
      successful: successfulPatterns,
      rejected: rejectedPatterns,
      comparison: this.comparePatterns(successfulPatterns, rejectedPatterns),
    };
  }

  private analyzePatterns(jobs: any[]) {
    if (jobs.length === 0) return this.getEmptyPatternData();

    // Industry distribution
    const industries = {};
    jobs.forEach(j => {
      const industry = j.industry || 'Unknown';
      industries[industry] = (industries[industry] || 0) + 1;
    });

    // Company size distribution
    const companySizes = {};
    jobs.forEach(j => {
      const size = j.companySize || 'Unknown';
      companySizes[size] = (companySizes[size] || 0) + 1;
    });

    // Application sources
    const sources = {};
    jobs.forEach(j => {
      const source = j.application_source || 'Unknown';
      sources[source] = (sources[source] || 0) + 1;
    });

    return {
      totalCount: jobs.length,
      topIndustries: Object.entries(industries)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([industry, count]) => ({ industry, count })),
      companySizeDistribution: companySizes,
      topSources: Object.entries(sources)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([source, count]) => ({ source, count })),
    };
  }

  private comparePatterns(successful: any, rejected: any) {
    const comparison: Array<{ type: string; insight: string }> = [];

    // Compare industries
    if (successful.topIndustries.length > 0 && rejected.topIndustries.length > 0) {
      const successTop = successful.topIndustries[0].industry;
      const rejectTop = rejected.topIndustries[0].industry;
      
      if (successTop !== rejectTop) {
        comparison.push({
          type: 'industry',
          insight: `You're most successful in ${successTop}, but get rejected most in ${rejectTop}`,
        });
      }
    }

    return comparison;
  }

  private getEmptyPatterns() {
    return {
      successful: this.getEmptyPatternData(),
      rejected: this.getEmptyPatternData(),
      comparison: [],
    };
  }

  private getEmptyPatternData() {
    return {
      totalCount: 0,
      topIndustries: [],
      companySizeDistribution: {},
      topSources: [],
    };
  }

  /**
   * UC-097 AC4: Track correlation between application materials and response rates
   */
  async getMaterialImpact(userId: string) {
    const { data: jobs, error } = await this.supabase.getClient()
      .from('jobs')
      .select('*')
      .eq('userId', userId)
      .is('archivedAt', null);

    if (error) throw error;
    if (!jobs || jobs.length === 0) return this.getEmptyMaterialImpact();

    // Get user's default materials
    const { data: defaults } = await this.supabase.getClient()
      .from('user_material_defaults')
      .select('*')
      .eq('userId', userId)
      .single();

    const defaultResumeId = defaults?.defaultResumeVersionId;
    const defaultCLId = defaults?.defaultCoverLetterVersionId;

    // Categorize jobs by material usage
    const customizedResume = jobs.filter(j => j.resumeVersionId && j.resumeVersionId !== defaultResumeId);
    const standardResume = jobs.filter(j => !j.resumeVersionId || j.resumeVersionId === defaultResumeId);
    
    const customizedCL = jobs.filter(j => j.coverLetterVersionId && j.coverLetterVersionId !== defaultCLId);
    const standardCL = jobs.filter(j => !j.coverLetterVersionId || j.coverLetterVersionId === defaultCLId);

    const fullyCustomized = jobs.filter(j => 
      (j.resumeVersionId && j.resumeVersionId !== defaultResumeId) &&
      (j.coverLetterVersionId && j.coverLetterVersionId !== defaultCLId)
    );

    return {
      resumeImpact: {
        customized: this.calculateSuccessStats(customizedResume),
        standard: this.calculateSuccessStats(standardResume),
        improvement: this.calculateImprovement(customizedResume, standardResume),
      },
      coverLetterImpact: {
        customized: this.calculateSuccessStats(customizedCL),
        standard: this.calculateSuccessStats(standardCL),
        improvement: this.calculateImprovement(customizedCL, standardCL),
      },
      fullyCustomizedImpact: this.calculateSuccessStats(fullyCustomized),
      statisticalSignificance: this.testSignificance(customizedResume, standardResume),
    };
  }

  private calculateSuccessStats(jobs: any[]) {
    const total = jobs.length;
    if (total === 0) return { total: 0, responseRate: '0', interviewRate: '0', offerRate: '0' };

    const responded = jobs.filter(j => ['Phone Screen', 'Interview', 'Offer'].includes(j.status)).length;
    const interviewed = jobs.filter(j => ['Interview', 'Offer'].includes(j.status)).length;
    const offered = jobs.filter(j => j.status === 'Offer').length;

    return {
      total,
      responded,
      interviewed,
      offered,
      responseRate: ((responded / total) * 100).toFixed(1),
      interviewRate: ((interviewed / total) * 100).toFixed(1),
      offerRate: ((offered / total) * 100).toFixed(1),
    };
  }

  private calculateImprovement(customized: any[], standard: any[]) {
    const customStats = this.calculateSuccessStats(customized);
    const standardStats = this.calculateSuccessStats(standard);

    const responseImprovement = parseFloat(customStats.responseRate) - parseFloat(standardStats.responseRate);
    
    return {
      responseRateDiff: responseImprovement.toFixed(1),
      improvement: responseImprovement > 0 ? 'positive' : responseImprovement < 0 ? 'negative' : 'none',
    };
  }

  private getEmptyMaterialImpact() {
    return {
      resumeImpact: {
        customized: { total: 0, responseRate: '0', interviewRate: '0', offerRate: '0' },
        standard: { total: 0, responseRate: '0', interviewRate: '0', offerRate: '0' },
        improvement: { responseRateDiff: '0', improvement: 'none' },
      },
      coverLetterImpact: {
        customized: { total: 0, responseRate: '0', interviewRate: '0', offerRate: '0' },
        standard: { total: 0, responseRate: '0', interviewRate: '0', offerRate: '0' },
        improvement: { responseRateDiff: '0', improvement: 'none' },
      },
      fullyCustomizedImpact: { total: 0, responseRate: '0', interviewRate: '0', offerRate: '0' },
      statisticalSignificance: { significant: false, confidence: 'Low - Need more data' },
    };
  }

  /**
   * UC-097 AC5: Monitor impact of resume and cover letter customization
   */
  async getCustomizationImpact(userId: string) {
    // This is already covered in getMaterialImpact, but we can provide a focused view
    const materialImpact = await this.getMaterialImpact(userId);
    
    return {
      summary: {
        resumeCustomization: materialImpact.resumeImpact,
        coverLetterCustomization: materialImpact.coverLetterImpact,
        bothCustomized: materialImpact.fullyCustomizedImpact,
      },
      recommendation: this.generateCustomizationRecommendation(materialImpact),
    };
  }

  private generateCustomizationRecommendation(impact: any) {
    const resumeImprovement = parseFloat(impact.resumeImpact.improvement.responseRateDiff);
    const clImprovement = parseFloat(impact.coverLetterImpact.improvement.responseRateDiff);

    if (resumeImprovement > 10 && clImprovement > 10) {
      return 'Always customize both resume and cover letter - significant positive impact';
    } else if (resumeImprovement > 10) {
      return 'Prioritize resume customization - shows strong positive correlation';
    } else if (clImprovement > 10) {
      return 'Prioritize cover letter customization - shows strong positive correlation';
    } else if (resumeImprovement > 0 || clImprovement > 0) {
      return 'Customization shows positive trend - continue and track results';
    } else {
      return 'Need more data - continue logging applications with material tracking';
    }
  }

  /**
   * UC-097 AC6: Analyze timing patterns for optimal application submission
   */
  async getTimingPatterns(userId: string) {
    const { data: jobs, error } = await this.supabase.getClient()
      .from('jobs')
      .select('*')
      .eq('userId', userId)
      .is('archivedAt', null);

    if (error) throw error;
    if (!jobs || jobs.length === 0) return this.getEmptyTimingPatterns();

    // Group by day of week
    const byDayOfWeek = {
      Monday: { total: 0, responded: 0, responseRate: '0' },
      Tuesday: { total: 0, responded: 0, responseRate: '0' },
      Wednesday: { total: 0, responded: 0, responseRate: '0' },
      Thursday: { total: 0, responded: 0, responseRate: '0' },
      Friday: { total: 0, responded: 0, responseRate: '0' },
      Saturday: { total: 0, responded: 0, responseRate: '0' },
      Sunday: { total: 0, responded: 0, responseRate: '0' },
    };

    // Group by time of day
    const byTimeOfDay = {
      'Morning (6am-12pm)': { total: 0, responded: 0, responseRate: '0' },
      'Afternoon (12pm-6pm)': { total: 0, responded: 0, responseRate: '0' },
      'Evening (6pm-12am)': { total: 0, responded: 0, responseRate: '0' },
      'Night (12am-6am)': { total: 0, responded: 0, responseRate: '0' },
    };

    jobs.forEach(job => {
      const createdAt = new Date(job.createdAt);
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][createdAt.getDay()];
      const hour = createdAt.getHours();
      
      let timeSlot = 'Night (12am-6am)';
      if (hour >= 6 && hour < 12) timeSlot = 'Morning (6am-12pm)';
      else if (hour >= 12 && hour < 18) timeSlot = 'Afternoon (12pm-6pm)';
      else if (hour >= 18 && hour < 24) timeSlot = 'Evening (6pm-12am)';

      const responded = ['Phone Screen', 'Interview', 'Offer'].includes(job.status);

      byDayOfWeek[dayOfWeek].total++;
      if (responded) byDayOfWeek[dayOfWeek].responded++;

      byTimeOfDay[timeSlot].total++;
      if (responded) byTimeOfDay[timeSlot].responded++;
    });

    // Calculate rates
    Object.keys(byDayOfWeek).forEach(day => {
      const data = byDayOfWeek[day];
      data.responseRate = data.total > 0 ? ((data.responded / data.total) * 100).toFixed(1) : '0';
    });

    Object.keys(byTimeOfDay).forEach(slot => {
      const data = byTimeOfDay[slot];
      data.responseRate = data.total > 0 ? ((data.responded / data.total) * 100).toFixed(1) : '0';
    });

    // Find optimal times
    const bestDay = Object.entries(byDayOfWeek)
      .filter(([, data]) => data.total >= 3) // Minimum sample size
      .sort(([, a], [, b]) => parseFloat(b.responseRate) - parseFloat(a.responseRate))[0];

    const bestTimeSlot = Object.entries(byTimeOfDay)
      .filter(([, data]) => data.total >= 3)
      .sort(([, a], [, b]) => parseFloat(b.responseRate) - parseFloat(a.responseRate))[0];

    return {
      byDayOfWeek,
      byTimeOfDay,
      optimalTiming: {
        bestDay: bestDay ? { day: bestDay[0], responseRate: bestDay[1].responseRate } : null,
        bestTimeSlot: bestTimeSlot ? { slot: bestTimeSlot[0], responseRate: bestTimeSlot[1].responseRate } : null,
      },
    };
  }

  private getEmptyTimingPatterns() {
    return {
      byDayOfWeek: {},
      byTimeOfDay: {},
      optimalTiming: {
        bestDay: null,
        bestTimeSlot: null,
      },
    };
  }

  /**
   * UC-097 AC7: Generate recommendations for improving application success
   */
  async getRecommendations(userId: string) {
    const [
      successRates,
      methodPerformance,
      patterns,
      materialImpact,
      timingPatterns,
    ] = await Promise.all([
      this.getSuccessRatesByCategory(userId),
      this.getApplicationMethodPerformance(userId),
      this.getSuccessPatterns(userId),
      this.getMaterialImpact(userId),
      this.getTimingPatterns(userId),
    ]);

    const recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      category: string;
      recommendation: string;
      data: any;
      actionItems: string[];
    }> = [];

    // Industry recommendations
    const topIndustry = Object.entries(successRates.byIndustry)
      .filter(([, data]: [string, any]) => data.total >= 3)
      .sort(([, a]: [string, any], [, b]: [string, any]) => parseFloat(b.responseRate) - parseFloat(a.responseRate))[0];

    if (topIndustry) {
      const [industry, data] = topIndustry;
      recommendations.push({
        priority: 'high',
        category: 'Industry Focus',
        recommendation: `Focus on ${industry} - your response rate is ${(data as any).responseRate}%`,
        data: { industry, responseRate: (data as any).responseRate },
        actionItems: [
          `Search for more ${industry} positions`,
          `Network with ${industry} professionals`,
          `Tailor your resume to highlight ${industry} experience`,
        ],
      });
    }

    // Application method recommendations
    const bestMethod = Object.entries(methodPerformance.byMethod)
      .filter(([, data]: [string, any]) => data.total >= 3)
      .sort(([, a]: [string, any], [, b]: [string, any]) => parseFloat(b.responseRate) - parseFloat(a.responseRate))[0];

    if (bestMethod) {
      const [method, data] = bestMethod;
      recommendations.push({
        priority: 'high',
        category: 'Application Method',
        recommendation: `${method} applications have ${(data as any).responseRate}% response rate`,
        data: { method, responseRate: (data as any).responseRate },
        actionItems: [
          `Prioritize ${method} applications`,
          `Build more connections for ${method.toLowerCase()} opportunities`,
        ],
      });
    }

    // Customization recommendations
    const resumeImprovement = parseFloat(materialImpact.resumeImpact.improvement.responseRateDiff);
    if (resumeImprovement > 5) {
      recommendations.push({
        priority: 'medium',
        category: 'Resume Customization',
        recommendation: `Customized resumes show ${resumeImprovement.toFixed(1)}% better response rate`,
        data: { improvement: resumeImprovement },
        actionItems: [
          'Always customize your resume for each application',
          'Highlight relevant skills and experience',
          'Use keywords from the job description',
        ],
      });
    }

    // Timing recommendations
    if (timingPatterns.optimalTiming.bestDay) {
      recommendations.push({
        priority: 'low',
        category: 'Application Timing',
        recommendation: `Apply on ${timingPatterns.optimalTiming.bestDay.day} for best results`,
        data: timingPatterns.optimalTiming.bestDay,
        actionItems: [
          `Schedule applications for ${timingPatterns.optimalTiming.bestDay.day}`,
          'Track response patterns over time',
        ],
      });
    }

    return {
      recommendations,
      overallScore: this.calculateApplicationScore(successRates.overall),
    };
  }

  private calculateApplicationScore(overall: any): number {
    let score = 50; // Base score

    const responseRate = parseFloat(overall.responseRate);
    const interviewRate = parseFloat(overall.interviewRate);

    // Response rate impact (max +25)
    if (responseRate > 30) score += 25;
    else if (responseRate > 20) score += 20;
    else if (responseRate > 15) score += 15;
    else if (responseRate > 10) score += 10;

    // Interview rate impact (max +25)
    if (interviewRate > 20) score += 25;
    else if (interviewRate > 15) score += 20;
    else if (interviewRate > 10) score += 15;
    else if (interviewRate > 5) score += 10;

    return Math.min(score, 100);
  }

  /**
   * UC-097 AC8: Include statistical significance testing for meaningful insights
   */
  private testSignificance(customized: any[], standard: any[]) {
    const n1 = customized.length;
    const n2 = standard.length;

    // Minimum sample size check
    if (n1 < 10 || n2 < 10) {
      return {
        significant: false,
        confidence: 'Low - Need more data',
        reason: 'Insufficient sample size (minimum 10 per group)',
      };
    }

    const success1 = customized.filter(j => ['Phone Screen', 'Interview', 'Offer'].includes(j.status)).length;
    const success2 = standard.filter(j => ['Phone Screen', 'Interview', 'Offer'].includes(j.status)).length;

    const p1 = success1 / n1;
    const p2 = success2 / n2;

    // Pooled proportion
    const p_pool = (success1 + success2) / (n1 + n2);

    // Z-score calculation
    const z = (p1 - p2) / Math.sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2));

    // Approximate p-value (two-tailed test)
    const p_value = 2 * (1 - this.normalCDF(Math.abs(z)));

    return {
      significant: p_value < 0.05,
      confidence: p_value < 0.01 ? 'High' : p_value < 0.05 ? 'Medium' : 'Low - Need more data',
      p_value: p_value.toFixed(4),
      z_score: z.toFixed(2),
    };
  }

  // Standard normal cumulative distribution function approximation
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }

  /**
   * Get complete dashboard data
   */
  async getDashboard(userId: string) {
    const [
      successRates,
      methodPerformance,
      patterns,
      materialImpact,
      customizationImpact,
      timingPatterns,
      recommendations,
    ] = await Promise.all([
      this.getSuccessRatesByCategory(userId),
      this.getApplicationMethodPerformance(userId),
      this.getSuccessPatterns(userId),
      this.getMaterialImpact(userId),
      this.getCustomizationImpact(userId),
      this.getTimingPatterns(userId),
      this.getRecommendations(userId),
    ]);

    return {
      successRates,
      methodPerformance,
      patterns,
      materialImpact,
      customizationImpact,
      timingPatterns,
      recommendations,
    };
  }
}
