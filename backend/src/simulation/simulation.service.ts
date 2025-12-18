import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateSimulationDto,
  UpdateSimulationDto,
  SimulationResponse,
  CareerSnapshot,
  DecisionPoint,
  Recommendation,
  RiskTolerance,
  Scenario,
  IndustryTrend,
  CareerRoleTemplate,
} from './dto/simulation.dto';

@Injectable()
export class SimulationService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Run a new career path simulation
   */
  async createSimulation(userId: string, dto: CreateSimulationDto): Promise<SimulationResponse> {
    const client = this.supabase.getClient();

    // If starting from a job or offer, get that data
    let startingData = {
      role: dto.startingRole,
      salary: dto.startingSalary,
      industry: dto.industry,
      companySize: dto.companySize,
    };

    if (dto.jobId) {
      const { data: job } = await client
        .from('jobs')
        .select('title, company, salaryMin, salaryMax, industry')
        .eq('id', dto.jobId)
        .eq('"userId"', userId)
        .single();
      
      if (job) {
        startingData = {
          role: job.title,
          salary: job.salaryMax || job.salaryMin || dto.startingSalary,
          industry: job.industry || dto.industry,
          companySize: dto.companySize,
        };
      }
    } else if (dto.offerId) {
      const { data: offer } = await client
        .from('offers')
        .select('jobTitle, company, baseSalary, totalComp')
        .eq('id', dto.offerId)
        .eq('"userId"', userId)
        .single();
      
      if (offer) {
        startingData = {
          role: offer.jobTitle,
          salary: offer.totalComp || offer.baseSalary,
          industry: dto.industry,
          companySize: dto.companySize,
        };
      }
    }

    // Get industry trends for modeling
    const industryTrends = await this.getIndustryTrends(startingData.industry || 'Technology');

    // Generate three scenarios
    const bestCase = await this.simulateCareerPath(
      startingData,
      dto.simulationYears || 10,
      'best',
      dto.riskTolerance || RiskTolerance.MODERATE,
      industryTrends
    );

    const avgCase = await this.simulateCareerPath(
      startingData,
      dto.simulationYears || 10,
      'average',
      dto.riskTolerance || RiskTolerance.MODERATE,
      industryTrends
    );

    const worstCase = await this.simulateCareerPath(
      startingData,
      dto.simulationYears || 10,
      'worst',
      dto.riskTolerance || RiskTolerance.MODERATE,
      industryTrends
    );

    // Calculate lifetime earnings
    const lifetimeEarningsBest = this.calculateLifetimeEarnings(bestCase);
    const lifetimeEarningsAvg = this.calculateLifetimeEarnings(avgCase);
    const lifetimeEarningsWorst = this.calculateLifetimeEarnings(worstCase);

    // Identify decision points
    const decisionPoints = this.identifyDecisionPoints(avgCase, startingData);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      avgCase,
      startingData,
      {
        workLifeBalance: dto.workLifeBalanceWeight || 0.33,
        salary: dto.salaryWeight || 0.33,
        learning: dto.learningWeight || 0.34,
      }
    );

    // Save simulation to database
    const { data: simulation, error } = await client
      .from('career_simulations')
      .insert({
        userId,
        simulationName: dto.simulationName,
        startingRole: startingData.role,
        startingSalary: startingData.salary,
        industry: startingData.industry,
        companySize: startingData.companySize,
        simulationYears: dto.simulationYears || 10,
        workLifeBalanceWeight: dto.workLifeBalanceWeight || 0.33,
        salaryWeight: dto.salaryWeight || 0.33,
        learningWeight: dto.learningWeight || 0.34,
        riskTolerance: dto.riskTolerance || RiskTolerance.MODERATE,
        bestCaseTrajectory: bestCase,
        averageCaseTrajectory: avgCase,
        worstCaseTrajectory: worstCase,
        lifetimeEarningsBest,
        lifetimeEarningsAvg,
        lifetimeEarningsWorst,
        decisionPoints,
        recommendations,
      })
      .select()
      .single();

    if (error) throw error;

    // Save individual snapshots for querying
    await this.saveSnapshots(simulation.id, bestCase, 'best');
    await this.saveSnapshots(simulation.id, avgCase, 'average');
    await this.saveSnapshots(simulation.id, worstCase, 'worst');

    return this.formatSimulationResponse(simulation);
  }

  /**
   * Get all simulations for a user
   */
  async listSimulations(userId: string): Promise<SimulationResponse[]> {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('career_simulations')
      .select('*')
      .eq('"userId"', userId)
      .order('"createdAt"', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.formatSimulationResponse);
  }

  /**
   * Get a specific simulation
   */
  async getSimulation(userId: string, id: string): Promise<SimulationResponse> {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('career_simulations')
      .select('*')
      .eq('id', id)
      .eq('"userId"', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Simulation not found');
    }

    return this.formatSimulationResponse(data);
  }

  /**
   * Update simulation preferences and re-run
   */
  async updateSimulation(
    userId: string,
    id: string,
    dto: UpdateSimulationDto
  ): Promise<SimulationResponse> {
    const client = this.supabase.getClient();

    const { data: existing } = await client
      .from('career_simulations')
      .select('*')
      .eq('id', id)
      .eq('"userId"', userId)
      .single();

    if (!existing) {
      throw new NotFoundException('Simulation not found');
    }

    // Re-run simulation with new preferences
    const industryTrends = await this.getIndustryTrends(existing.industry || 'Technology');
    
    const bestCase = await this.simulateCareerPath(
      {
        role: existing.startingRole,
        salary: existing.startingSalary,
        industry: existing.industry,
        companySize: existing.companySize,
      },
      existing.simulationYears,
      'best',
      dto.riskTolerance || existing.riskTolerance,
      industryTrends
    );

    const avgCase = await this.simulateCareerPath(
      {
        role: existing.startingRole,
        salary: existing.startingSalary,
        industry: existing.industry,
        companySize: existing.companySize,
      },
      existing.simulationYears,
      'average',
      dto.riskTolerance || existing.riskTolerance,
      industryTrends
    );

    const worstCase = await this.simulateCareerPath(
      {
        role: existing.startingRole,
        salary: existing.startingSalary,
        industry: existing.industry,
        companySize: existing.companySize,
      },
      existing.simulationYears,
      'worst',
      dto.riskTolerance || existing.riskTolerance,
      industryTrends
    );

    const lifetimeEarningsBest = this.calculateLifetimeEarnings(bestCase);
    const lifetimeEarningsAvg = this.calculateLifetimeEarnings(avgCase);
    const lifetimeEarningsWorst = this.calculateLifetimeEarnings(worstCase);

    const decisionPoints = this.identifyDecisionPoints(avgCase, {
      role: existing.startingRole,
      salary: existing.startingSalary,
      industry: existing.industry,
      companySize: existing.companySize,
    });

    const recommendations = this.generateRecommendations(
      avgCase,
      {
        role: existing.startingRole,
        salary: existing.startingSalary,
        industry: existing.industry,
        companySize: existing.companySize,
      },
      {
        workLifeBalance: dto.workLifeBalanceWeight || existing.workLifeBalanceWeight,
        salary: dto.salaryWeight || existing.salaryWeight,
        learning: dto.learningWeight || existing.learningWeight,
      }
    );

    const { data, error } = await client
      .from('career_simulations')
      .update({
        ...dto,
        bestCaseTrajectory: bestCase,
        averageCaseTrajectory: avgCase,
        worstCaseTrajectory: worstCase,
        lifetimeEarningsBest,
        lifetimeEarningsAvg,
        lifetimeEarningsWorst,
        decisionPoints,
        recommendations,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('"userId"', userId)
      .select()
      .single();

    if (error) throw error;

    // Update snapshots
    await client.from('career_path_snapshots').delete().eq('simulation_id', id);
    await this.saveSnapshots(id, bestCase, 'best');
    await this.saveSnapshots(id, avgCase, 'average');
    await this.saveSnapshots(id, worstCase, 'worst');

    return this.formatSimulationResponse(data);
  }

  /**
   * Delete a simulation
   */
  async deleteSimulation(userId: string, id: string): Promise<void> {
    const client = this.supabase.getClient();

    const { error } = await client
      .from('career_simulations')
      .delete()
      .eq('id', id)
      .eq('"userId"', userId);

    if (error) throw error;
  }

  /**
   * Get career role templates for an industry
   */
  async getCareerTemplates(industry?: string): Promise<CareerRoleTemplate[]> {
    const client = this.supabase.getClient();

    let query = client.from('career_role_templates').select('*').order('level');

    if (industry) {
      query = query.eq('industry', industry);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      roleName: row.role_name,
      industry: row.industry,
      level: row.level,
      typicalYearsToNext: row.typical_years_to_next,
      avgSalaryMin: row.avg_salary_min,
      avgSalaryMax: row.avg_salary_max,
      nextRoleIds: row.next_role_ids || [],
      skillsRequired: row.skills_required || [],
    }));
  }

  /**
   * Simulate career path for a given scenario
   */
  private async simulateCareerPath(
    startingData: any,
    years: number,
    scenario: string,
    riskTolerance: RiskTolerance,
    industryTrends: IndustryTrend[]
  ): Promise<CareerSnapshot[]> {
    const snapshots: CareerSnapshot[] = [];
    let currentRole = startingData.role;
    let currentSalary = startingData.salary;
    let level = this.estimateCareerLevel(currentRole);

    // Scenario multipliers
    const multipliers = {
      best: { salary: 1.15, promotion: 1.3, satisfaction: 1.2 },
      average: { salary: 1.05, promotion: 1.0, satisfaction: 1.0 },
      worst: { salary: 1.02, promotion: 0.7, satisfaction: 0.8 },
    };

    const mult = multipliers[scenario] || multipliers.average;

    for (let year = 0; year <= years; year++) {
      const industryTrend = industryTrends.find(t => t.year === new Date().getFullYear() + year);
      const salaryGrowth = (industryTrend?.avgSalaryIncrease || 3) / 100;

      // Apply salary growth
      if (year > 0) {
        currentSalary = Math.round(currentSalary * (1 + salaryGrowth * mult.salary));
      }

      // Check for promotion (every 2-4 years in average case)
      const promotionChance = mult.promotion / (level * 1.5);
      if (year > 0 && year % 3 === 0 && Math.random() < promotionChance) {
        level++;
        currentRole = this.getNextRole(currentRole, level);
        currentSalary = Math.round(currentSalary * 1.15); // 15% raise on promotion
      }

      const snapshot: CareerSnapshot = {
        year,
        roleTitle: currentRole,
        companyType: startingData.companySize || 'medium',
        salary: currentSalary,
        totalComp: Math.round(currentSalary * 1.2), // Assume 20% in benefits/equity
        skillsAcquired: this.getSkillsForYear(level, year),
        probabilityScore: this.calculateProbability(year, scenario),
        satisfactionScore: Math.min(10, 7 * mult.satisfaction + Math.random() * 2),
      };

      snapshots.push(snapshot);
    }

    return snapshots;
  }

  /**
   * Get industry trends
   */
  private async getIndustryTrends(industry: string): Promise<IndustryTrend[]> {
    const client = this.supabase.getClient();

    const { data } = await client
      .from('industry_trends')
      .select('*')
      .eq('industry', industry)
      .order('year');

    if (!data || data.length === 0) {
      // Return default trends
      return this.getDefaultTrends();
    }

    return data.map(row => ({
      industry: row.industry,
      year: row.year,
      growthRate: parseFloat(row.growth_rate),
      avgSalaryIncrease: parseFloat(row.avg_salary_increase),
      jobMarketScore: parseFloat(row.job_market_score),
      economicOutlook: row.economic_outlook,
    }));
  }

  private getDefaultTrends(): IndustryTrend[] {
    const currentYear = new Date().getFullYear();
    const trends: IndustryTrend[] = [];
    
    for (let i = 0; i < 10; i++) {
      trends.push({
        industry: 'General',
        year: currentYear + i,
        growthRate: 3.5,
        avgSalaryIncrease: 3.0,
        jobMarketScore: 7.0,
        economicOutlook: 'fair',
      });
    }
    
    return trends;
  }

  /**
   * Calculate total lifetime earnings
   */
  private calculateLifetimeEarnings(snapshots: CareerSnapshot[]): number {
    return snapshots.reduce((sum, snapshot) => sum + snapshot.salary, 0);
  }

  /**
   * Identify key decision points in career path
   */
  private identifyDecisionPoints(snapshots: CareerSnapshot[], startingData: any): DecisionPoint[] {
    const points: DecisionPoint[] = [];

    // Year 3-4: First major decision
    points.push({
      year: 3,
      title: 'Stay or Switch Companies?',
      description: 'After 3 years, consider if staying offers growth or if external opportunities provide better advancement.',
      options: [
        {
          choice: 'Stay and specialize',
          impact: 'Deeper expertise, slower salary growth, stronger internal network',
          salaryDelta: 5,
          satisfactionDelta: 0.5,
        },
        {
          choice: 'Switch companies',
          impact: 'Faster salary growth (15-30%), broader experience, reset relationships',
          salaryDelta: 20,
          satisfactionDelta: -0.5,
        },
      ],
    });

    // Year 5-6: Management vs IC track
    points.push({
      year: 5,
      title: 'Individual Contributor vs Management Track?',
      description: 'Choose between technical leadership or people management path.',
      options: [
        {
          choice: 'Technical track (Staff/Principal)',
          impact: 'Deep technical work, architecture influence, fewer meetings',
          salaryDelta: 10,
          satisfactionDelta: 1,
        },
        {
          choice: 'Management track',
          impact: 'People leadership, broader scope, meetings and politics',
          salaryDelta: 15,
          satisfactionDelta: 0,
        },
      ],
    });

    // Year 8-10: Senior leadership decision
    if (snapshots.length > 8) {
      points.push({
        year: 8,
        title: 'Pursue Executive Leadership?',
        description: 'Consider Director/VP roles or remain at senior technical level.',
        options: [
          {
            choice: 'Executive leadership',
            impact: 'Strategic influence, high visibility, significant stress',
            salaryDelta: 40,
            satisfactionDelta: -1,
          },
          {
            choice: 'Stay at senior level',
            impact: 'Work-life balance, technical focus, steady progression',
            salaryDelta: 8,
            satisfactionDelta: 1.5,
          },
        ],
      });
    }

    return points;
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    snapshots: CareerSnapshot[],
    startingData: any,
    weights: any
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Skills recommendation
    recommendations.push({
      title: 'Invest in Cloud Architecture Skills',
      description: 'Cloud expertise is becoming essential. Consider AWS/Azure certifications.',
      priority: 'high',
      category: 'skills',
      timeframe: '6-12 months',
      expectedImpact: '10-15% salary increase, expanded opportunities',
    });

    // Role transition
    if (weights.salary > 0.4) {
      recommendations.push({
        title: 'Consider Company Switch at Year 3',
        description: 'External moves typically offer 20-30% salary increases vs 3-5% internal raises.',
        priority: 'medium',
        category: 'role',
        timeframe: '2-3 years',
        expectedImpact: '25% salary increase, new challenges',
      });
    }

    // Work-life balance focused
    if (weights.workLifeBalance > 0.4) {
      recommendations.push({
        title: 'Target Companies with Strong WLB Culture',
        description: 'Research companies with 4-day weeks, unlimited PTO, or flexible remote policies.',
        priority: 'high',
        category: 'role',
        timeframe: 'Ongoing',
        expectedImpact: 'Better satisfaction, sustainable career',
      });
    }

    // Learning focused
    if (weights.learning > 0.4) {
      recommendations.push({
        title: 'Seek Roles with Emerging Technologies',
        description: 'Look for positions working with AI/ML, blockchain, or cutting-edge tech stacks.',
        priority: 'medium',
        category: 'skills',
        timeframe: '1-2 years',
        expectedImpact: 'Accelerated learning, future-proof skills',
      });
    }

    // Industry recommendation
    recommendations.push({
      title: 'Monitor Industry Trends',
      description: `${startingData.industry} is projected to grow. Stay informed about sector changes.`,
      priority: 'low',
      category: 'industry',
      timeframe: 'Ongoing',
      expectedImpact: 'Strategic positioning, informed decisions',
    });

    return recommendations;
  }

  /**
   * Save snapshots to database
   */
  private async saveSnapshots(simulationId: string, snapshots: CareerSnapshot[], scenario: string) {
    const client = this.supabase.getClient();

    const rows = snapshots.map(snapshot => ({
      simulation_id: simulationId,
      year: snapshot.year,
      scenario,
      role_title: snapshot.roleTitle,
      company_type: snapshot.companyType,
      salary: snapshot.salary,
      total_comp: snapshot.totalComp,
      skills_acquired: snapshot.skillsAcquired,
      probability_score: snapshot.probabilityScore,
      satisfaction_score: snapshot.satisfactionScore,
    }));

    await client.from('career_path_snapshots').insert(rows);
  }

  /**
   * Helper: Estimate career level from role title
   */
  private estimateCareerLevel(role: string): number {
    const title = role.toLowerCase();
    if (title.includes('junior') || title.includes('entry')) return 2;
    if (title.includes('senior') || title.includes('sr.')) return 4;
    if (title.includes('lead') || title.includes('staff')) return 5;
    if (title.includes('principal') || title.includes('director')) return 6;
    if (title.includes('vp') || title.includes('chief')) return 7;
    return 3; // Default mid-level
  }

  /**
   * Helper: Get next role based on level
   */
  private getNextRole(currentRole: string, newLevel: number): string {
    const roleMap = {
      2: 'Junior',
      3: 'Mid-Level',
      4: 'Senior',
      5: 'Lead/Staff',
      6: 'Principal/Director',
      7: 'VP/Executive',
    };

    const baseRole = currentRole.replace(/(Junior|Senior|Lead|Staff|Principal|Director|VP|Sr\.|Jr\.)/gi, '').trim();
    const prefix = roleMap[newLevel] || '';
    
    return prefix ? `${prefix} ${baseRole}` : baseRole;
  }

  /**
   * Helper: Get skills acquired by year
   */
  private getSkillsForYear(level: number, year: number): string[] {
    const skillsByLevel = {
      2: ['Programming', 'Version Control', 'Testing'],
      3: ['System Design', 'Databases', 'APIs', 'Debugging'],
      4: ['Architecture', 'Mentoring', 'Code Review', 'Performance Optimization'],
      5: ['Strategic Planning', 'Cross-team Leadership', 'Technical Vision'],
      6: ['Organization Impact', 'Product Strategy', 'Hiring'],
      7: ['Executive Leadership', 'Business Strategy', 'Board Communication'],
    };

    return skillsByLevel[level] || skillsByLevel[3];
  }

  /**
   * Helper: Calculate probability of reaching scenario
   */
  private calculateProbability(year: number, scenario: string): number {
    const baseProbability = {
      best: 0.15,
      average: 0.70,
      worst: 0.15,
    };

    // Probability decreases with time (uncertainty increases)
    const timeFactor = Math.max(0.3, 1 - (year * 0.05));
    
    return Math.min(100, (baseProbability[scenario] || 0.5) * timeFactor * 100);
  }

  /**
   * Format database row to API response
   */
  private formatSimulationResponse(row: any): SimulationResponse {
    return {
      id: row.id,
      userId: row.userId,
      simulationName: row.simulationName || row.simulation_name,
      startingRole: row.startingRole || row.starting_role,
      startingSalary: row.startingSalary || row.starting_salary,
      industry: row.industry,
      companySize: row.companySize || row.company_size,
      simulationYears: row.simulationYears || row.simulation_years,
      workLifeBalanceWeight: parseFloat(row.workLifeBalanceWeight || row.work_life_balance_weight),
      salaryWeight: parseFloat(row.salaryWeight || row.salary_weight),
      learningWeight: parseFloat(row.learningWeight || row.learning_weight),
      riskTolerance: row.riskTolerance || row.risk_tolerance,
      bestCaseTrajectory: row.bestCaseTrajectory || row.best_case_trajectory,
      averageCaseTrajectory: row.averageCaseTrajectory || row.average_case_trajectory,
      worstCaseTrajectory: row.worstCaseTrajectory || row.worst_case_trajectory,
      lifetimeEarningsBest: parseInt(row.lifetimeEarningsBest || row.lifetime_earnings_best),
      lifetimeEarningsAvg: parseInt(row.lifetimeEarningsAvg || row.lifetime_earnings_avg),
      lifetimeEarningsWorst: parseInt(row.lifetimeEarningsWorst || row.lifetime_earnings_worst),
      decisionPoints: row.decisionPoints || row.decision_points,
      recommendations: row.recommendations,
      createdAt: row.createdAt || row.created_at,
      updatedAt: row.updatedAt || row.updated_at,
    };
  }
}
