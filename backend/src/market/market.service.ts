import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface IndustryTrend {
  industry: string;
  trend: 'up' | 'flat' | 'down';
  jobCount: number;
  growth: number; // percentage
  monthlyData: { month: string; count: number }[];
}

export interface SkillDemand {
  skill: string;
  demand: 'High' | 'Medium' | 'Emerging' | 'Low';
  trendScore: number;
  yearlyData: { year: number; score: number }[];
}

export interface SalaryTrend {
  role: string;
  industry: string;
  location: string;
  minSalary: number;
  maxSalary: number;
  avgSalary: number;
  trend: 'up' | 'flat' | 'down';
  yearlyData: { year: number; avg: number }[];
}

export interface CompanyGrowth {
  company: string;
  openings: number;
  growth: 'Growing' | 'Stable' | 'Declining';
  hiringLevel: 'High' | 'Medium' | 'Low';
}

export interface IndustryInsight {
  industry: string;
  insights: string[];
}

export interface SkillRecommendation {
  skill: string;
  reason: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface MarketTiming {
  role: string;
  bestMonths: string[];
  peakQuarters: string[];
  reasoning: string;
}

export interface CompetitiveLandscape {
  role: string;
  avgCandidatesPerRole: number;
  avgYearsExperience: string;
  topSkills: string[];
  userMatch: {
    skillsMatchPercent: number;
    experienceMatch: string;
    recommendations: string[];
  };
}

@Injectable()
export class MarketService {
  constructor(private supabase: SupabaseService) {}

  async getIndustryTrends(industry?: string, location?: string): Promise<IndustryTrend[]> {
    // Mock data - in production, this would come from external APIs
    const allTrends: IndustryTrend[] = [
      {
        industry: 'Technology',
        trend: 'up',
        jobCount: 15420,
        growth: 23.5,
        monthlyData: [
          { month: '2025-06', count: 12500 },
          { month: '2025-07', count: 13200 },
          { month: '2025-08', count: 14100 },
          { month: '2025-09', count: 14800 },
          { month: '2025-10', count: 15100 },
          { month: '2025-11', count: 15420 },
        ],
      },
      {
        industry: 'Finance',
        trend: 'flat',
        jobCount: 8900,
        growth: 2.1,
        monthlyData: [
          { month: '2025-06', count: 8700 },
          { month: '2025-07', count: 8750 },
          { month: '2025-08', count: 8800 },
          { month: '2025-09', count: 8850 },
          { month: '2025-10', count: 8875 },
          { month: '2025-11', count: 8900 },
        ],
      },
      {
        industry: 'Healthcare',
        trend: 'up',
        jobCount: 12300,
        growth: 18.7,
        monthlyData: [
          { month: '2025-06', count: 10200 },
          { month: '2025-07', count: 10800 },
          { month: '2025-08', count: 11300 },
          { month: '2025-09', count: 11700 },
          { month: '2025-10', count: 12000 },
          { month: '2025-11', count: 12300 },
        ],
      },
      {
        industry: 'Retail',
        trend: 'down',
        jobCount: 5600,
        growth: -8.3,
        monthlyData: [
          { month: '2025-06', count: 6100 },
          { month: '2025-07', count: 6000 },
          { month: '2025-08', count: 5900 },
          { month: '2025-09', count: 5800 },
          { month: '2025-10', count: 5700 },
          { month: '2025-11', count: 5600 },
        ],
      },
      {
        industry: 'Manufacturing',
        trend: 'flat',
        jobCount: 7200,
        growth: 1.5,
        monthlyData: [
          { month: '2025-06', count: 7100 },
          { month: '2025-07', count: 7120 },
          { month: '2025-08', count: 7150 },
          { month: '2025-09', count: 7170 },
          { month: '2025-10', count: 7185 },
          { month: '2025-11', count: 7200 },
        ],
      },
    ];

    let filtered = allTrends;
    if (industry) {
      filtered = filtered.filter((t) => t.industry.toLowerCase().includes(industry.toLowerCase()));
    }

    return filtered;
  }

  async getSkillDemand(): Promise<SkillDemand[]> {
    // Mock data based on current tech trends
    return [
      {
        skill: 'React',
        demand: 'High',
        trendScore: 95,
        yearlyData: [
          { year: 2022, score: 78 },
          { year: 2023, score: 85 },
          { year: 2024, score: 90 },
          { year: 2025, score: 95 },
        ],
      },
      {
        skill: 'TypeScript',
        demand: 'High',
        trendScore: 92,
        yearlyData: [
          { year: 2022, score: 70 },
          { year: 2023, score: 80 },
          { year: 2024, score: 87 },
          { year: 2025, score: 92 },
        ],
      },
      {
        skill: 'Python',
        demand: 'High',
        trendScore: 97,
        yearlyData: [
          { year: 2022, score: 88 },
          { year: 2023, score: 92 },
          { year: 2024, score: 95 },
          { year: 2025, score: 97 },
        ],
      },
      {
        skill: 'AI/ML',
        demand: 'Emerging',
        trendScore: 89,
        yearlyData: [
          { year: 2022, score: 55 },
          { year: 2023, score: 68 },
          { year: 2024, score: 78 },
          { year: 2025, score: 89 },
        ],
      },
      {
        skill: 'Kubernetes',
        demand: 'High',
        trendScore: 85,
        yearlyData: [
          { year: 2022, score: 65 },
          { year: 2023, score: 73 },
          { year: 2024, score: 80 },
          { year: 2025, score: 85 },
        ],
      },
      {
        skill: 'AWS',
        demand: 'High',
        trendScore: 93,
        yearlyData: [
          { year: 2022, score: 82 },
          { year: 2023, score: 87 },
          { year: 2024, score: 90 },
          { year: 2025, score: 93 },
        ],
      },
      {
        skill: 'GraphQL',
        demand: 'Medium',
        trendScore: 72,
        yearlyData: [
          { year: 2022, score: 58 },
          { year: 2023, score: 64 },
          { year: 2024, score: 68 },
          { year: 2025, score: 72 },
        ],
      },
      {
        skill: 'Rust',
        demand: 'Emerging',
        trendScore: 68,
        yearlyData: [
          { year: 2022, score: 42 },
          { year: 2023, score: 52 },
          { year: 2024, score: 60 },
          { year: 2025, score: 68 },
        ],
      },
    ];
  }

  async getSalaryTrends(role?: string): Promise<SalaryTrend[]> {
    const client = this.supabase.getClient();

    // Try to get real salary data from database
    const { data: salaryData } = await client
      .from('salary_data')
      .select('*')
      .limit(100);

    // Combine real data with mock trends
    const mockTrends: SalaryTrend[] = [
      {
        role: 'Software Engineer',
        industry: 'Technology',
        location: 'United States',
        minSalary: 95000,
        maxSalary: 180000,
        avgSalary: 130000,
        trend: 'up',
        yearlyData: [
          { year: 2022, avg: 115000 },
          { year: 2023, avg: 122000 },
          { year: 2024, avg: 126000 },
          { year: 2025, avg: 130000 },
        ],
      },
      {
        role: 'Product Manager',
        industry: 'Technology',
        location: 'United States',
        minSalary: 110000,
        maxSalary: 200000,
        avgSalary: 145000,
        trend: 'up',
        yearlyData: [
          { year: 2022, avg: 130000 },
          { year: 2023, avg: 137000 },
          { year: 2024, avg: 141000 },
          { year: 2025, avg: 145000 },
        ],
      },
      {
        role: 'Data Scientist',
        industry: 'Technology',
        location: 'United States',
        minSalary: 100000,
        maxSalary: 175000,
        avgSalary: 135000,
        trend: 'up',
        yearlyData: [
          { year: 2022, avg: 120000 },
          { year: 2023, avg: 127000 },
          { year: 2024, avg: 131000 },
          { year: 2025, avg: 135000 },
        ],
      },
      {
        role: 'UX Designer',
        industry: 'Technology',
        location: 'United States',
        minSalary: 80000,
        maxSalary: 140000,
        avgSalary: 105000,
        trend: 'flat',
        yearlyData: [
          { year: 2022, avg: 100000 },
          { year: 2023, avg: 102000 },
          { year: 2024, avg: 104000 },
          { year: 2025, avg: 105000 },
        ],
      },
    ];

    if (role) {
      return mockTrends.filter((t) => t.role.toLowerCase().includes(role.toLowerCase()));
    }

    return mockTrends;
  }

  async getCompanyGrowth(): Promise<CompanyGrowth[]> {
    // Mock data based on typical company hiring patterns
    return [
      { company: 'Google', openings: 1250, growth: 'Growing', hiringLevel: 'High' },
      { company: 'Amazon', openings: 2100, growth: 'Growing', hiringLevel: 'High' },
      { company: 'Microsoft', openings: 980, growth: 'Stable', hiringLevel: 'High' },
      { company: 'Apple', openings: 780, growth: 'Stable', hiringLevel: 'Medium' },
      { company: 'Meta', openings: 420, growth: 'Declining', hiringLevel: 'Low' },
      { company: 'Netflix', openings: 180, growth: 'Stable', hiringLevel: 'Low' },
      { company: 'Tesla', openings: 650, growth: 'Growing', hiringLevel: 'Medium' },
      { company: 'Salesforce', openings: 540, growth: 'Stable', hiringLevel: 'Medium' },
      { company: 'Adobe', openings: 320, growth: 'Growing', hiringLevel: 'Medium' },
      { company: 'Nvidia', openings: 890, growth: 'Growing', hiringLevel: 'High' },
    ];
  }

  async getIndustryInsights(): Promise<IndustryInsight[]> {
    return [
      {
        industry: 'Technology',
        insights: [
          'AI and machine learning adoption accelerating across all sectors',
          'Remote work driving demand for cloud infrastructure skills',
          'Cybersecurity positions seeing 35% year-over-year growth',
          'Full-stack developers with AI experience commanding premium salaries',
        ],
      },
      {
        industry: 'Healthcare',
        insights: [
          'Telemedicine platforms expanding rapidly post-pandemic',
          'Health tech startups raising record funding levels',
          'Data privacy regulations creating new compliance roles',
          'Digital health records specialists in high demand',
        ],
      },
      {
        industry: 'Finance',
        insights: [
          'Fintech disrupting traditional banking models',
          'Blockchain and cryptocurrency expertise increasingly valued',
          'Regulatory technology (RegTech) sector growing 40% annually',
          'ESG (Environmental, Social, Governance) roles emerging',
        ],
      },
      {
        industry: 'Retail',
        insights: [
          'E-commerce continuing to replace brick-and-mortar stores',
          'Supply chain optimization roles critical for competitiveness',
          'Omnichannel experience designers in high demand',
          'Sustainability and circular economy focus increasing',
        ],
      },
    ];
  }

  async getSkillRecommendations(userId: string): Promise<SkillRecommendation[]> {
    const client = this.supabase.getClient();

    // Get user's current jobs/applications to understand target roles
    const { data: userJobs } = await client
      .from('jobs')
      .select('title, industry')
      .eq('userId', userId)
      .limit(10);

    // Generate recommendations based on market trends and user's interests
    const recommendations: SkillRecommendation[] = [
      {
        skill: 'React',
        reason: 'High demand in your target companies with 95% market score',
        priority: 'High',
      },
      {
        skill: 'AWS Certification',
        reason: 'Cloud skills show 93% demand score and 25% salary increase',
        priority: 'High',
      },
      {
        skill: 'TypeScript',
        reason: '92% of modern frontend roles require TypeScript proficiency',
        priority: 'High',
      },
      {
        skill: 'AI/Machine Learning',
        reason: 'Emerging skill with fastest growth trajectory (61% increase)',
        priority: 'Medium',
      },
      {
        skill: 'System Design',
        reason: 'Critical for senior roles, requested in 78% of senior positions',
        priority: 'Medium',
      },
      {
        skill: 'GraphQL',
        reason: 'Gaining adoption in your target industry',
        priority: 'Low',
      },
    ];

    return recommendations;
  }

  async getMarketTiming(): Promise<MarketTiming[]> {
    return [
      {
        role: 'Software Engineer',
        bestMonths: ['January', 'February', 'September'],
        peakQuarters: ['Q1', 'Q3'],
        reasoning: 'New fiscal year budgets and fall hiring cycles drive peak activity',
      },
      {
        role: 'Product Manager',
        bestMonths: ['January', 'March', 'September'],
        peakQuarters: ['Q1', 'Q3'],
        reasoning: 'Product planning cycles align with quarterly business reviews',
      },
      {
        role: 'Data Scientist',
        bestMonths: ['February', 'August', 'September'],
        peakQuarters: ['Q1', 'Q3'],
        reasoning: 'Analytics teams scale up for year-end reporting and new initiatives',
      },
    ];
  }

  async getCompetitiveLandscape(userId: string): Promise<CompetitiveLandscape> {
    const client = this.supabase.getClient();

    // Get user's profile data
    const { data: education } = await client
      .from('education')
      .select('*')
      .eq('user_id', userId);

    const { data: certifications } = await client
      .from('certifications')
      .select('*')
      .eq('user_id', userId);

    // Mock competitive analysis
    return {
      role: 'Software Engineer',
      avgCandidatesPerRole: 250,
      avgYearsExperience: '3-5 years',
      topSkills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'TypeScript'],
      userMatch: {
        skillsMatchPercent: 75,
        experienceMatch: 'Within range',
        recommendations: [
          'Add AWS certification to stand out from 65% of candidates',
          'Build 2-3 side projects showcasing React expertise',
          'Contribute to open source to demonstrate collaboration skills',
          'Consider specializing in AI/ML to target emerging opportunities',
        ],
      },
    };
  }

  async getMarketIntelligence(userId: string) {
    const [
      industryTrends,
      skillDemand,
      salaryTrends,
      companyGrowth,
      insights,
      recommendations,
      timing,
      landscape,
    ] = await Promise.all([
      this.getIndustryTrends(),
      this.getSkillDemand(),
      this.getSalaryTrends(),
      this.getCompanyGrowth(),
      this.getIndustryInsights(),
      this.getSkillRecommendations(userId),
      this.getMarketTiming(),
      this.getCompetitiveLandscape(userId),
    ]);

    return {
      industryTrends,
      skillDemand,
      salaryTrends,
      companyGrowth,
      insights,
      recommendations,
      timing,
      landscape,
    };
  }
}
