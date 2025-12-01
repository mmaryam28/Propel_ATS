import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface PeerBenchmarks {
  applicationsPerMonth: {
    user: number;
    peer: number;
    industry: number;
  };
  responseRate: {
    user: number;
    peer: number;
    industry: number;
  };
  interviewRate: {
    user: number;
    peer: number;
    industry: number;
  };
  offerRate: {
    user: number;
    peer: number;
    industry: number;
  };
}

export interface SkillPositioning {
  overallRating: 'Above Market' | 'At Market' | 'Below Market';
  userSkills: Array<{ name: string; proficiency: string; level: number }>;
  peerAverage: number;
  topPerformerAverage: number;
  skillGaps: string[];
}

export interface CareerPattern {
  userJourney: Array<{ week: number; stage: string }>;
  successfulPattern: Array<{ week: number; stage: string }>;
  currentWeek: number;
  expectedWeek: number;
}

export interface Recommendations {
  actionPlan: string[];
  differentiationStrategy: string[];
  marketPositioning: {
    targetCompanies: string;
    targetRoles: string;
    targetLocations: string;
    competitionLevel: 'High' | 'Medium' | 'Low';
  };
}

@Injectable()
export class CompetitiveService {
  constructor(private supabase: SupabaseService) {}

  async getBenchmarks(userId: string): Promise<PeerBenchmarks> {
    const client = this.supabase.getClient();

    // Get user's data
    const { data: userJobs, error: userError } = await client
      .from('jobs')
      .select('*')
      .eq('userId', userId)
      .is('archivedAt', null);

    if (userError) {
      throw new Error(`Failed to fetch user jobs: ${userError.message}`);
    }

    // Get all users' data for peer comparison (anonymized)
    const { data: allJobs, error: allError } = await client
      .from('jobs')
      .select('userId, status, createdAt')
      .is('archivedAt', null);

    if (allError) {
      throw new Error(`Failed to fetch peer data: ${allError.message}`);
    }

    // Calculate user metrics
    const userMetrics = this.calculateUserMetrics(userJobs || [], userId);
    
    // Calculate peer averages (excluding current user)
    const peerMetrics = this.calculatePeerAverages(allJobs || [], userId);

    // Industry standards (based on general market data)
    const industryStandards = {
      applicationsPerMonth: 25,
      responseRate: 18,
      interviewRate: 12,
      offerRate: 5,
    };

    return {
      applicationsPerMonth: {
        user: userMetrics.applicationsPerMonth,
        peer: peerMetrics.applicationsPerMonth,
        industry: industryStandards.applicationsPerMonth,
      },
      responseRate: {
        user: userMetrics.responseRate,
        peer: peerMetrics.responseRate,
        industry: industryStandards.responseRate,
      },
      interviewRate: {
        user: userMetrics.interviewRate,
        peer: peerMetrics.interviewRate,
        industry: industryStandards.interviewRate,
      },
      offerRate: {
        user: userMetrics.offerRate,
        peer: peerMetrics.offerRate,
        industry: industryStandards.offerRate,
      },
    };
  }

  async getSkillPositioning(userId: string): Promise<SkillPositioning> {
    const client = this.supabase.getClient();

    // Get user's skills (from in-memory store via skills service or mock)
    // For now, we'll return structured data that frontend can use
    
    const proficiencyToLevel = {
      'Beginner': 1,
      'Intermediate': 2,
      'Advanced': 3,
      'Expert': 4,
    };

    // Mock user skills - in production, fetch from skills service/DB
    const userSkills = [
      { name: 'JavaScript', proficiency: 'Advanced', level: 3 },
      { name: 'React', proficiency: 'Advanced', level: 3 },
      { name: 'Node.js', proficiency: 'Intermediate', level: 2 },
      { name: 'Python', proficiency: 'Intermediate', level: 2 },
    ];

    const userAverage = userSkills.reduce((sum, s) => sum + s.level, 0) / userSkills.length;
    const peerAverage = 2.5; // Mock peer average
    const topPerformerAverage = 3.2; // Mock top performer average

    // Determine skill gaps
    const commonTopSkills = ['SQL', 'System Design', 'AWS', 'Docker', 'TypeScript'];
    const userSkillNames = userSkills.map(s => s.name);
    const skillGaps = commonTopSkills.filter(skill => !userSkillNames.includes(skill));

    let overallRating: 'Above Market' | 'At Market' | 'Below Market';
    if (userAverage > peerAverage) {
      overallRating = 'Above Market';
    } else if (userAverage >= peerAverage - 0.3) {
      overallRating = 'At Market';
    } else {
      overallRating = 'Below Market';
    }

    return {
      overallRating,
      userSkills,
      peerAverage,
      topPerformerAverage,
      skillGaps,
    };
  }

  async getCareerPatterns(userId: string): Promise<CareerPattern> {
    const client = this.supabase.getClient();

    // Get user's job application timeline
    const { data: userJobs, error } = await client
      .from('jobs')
      .select('createdAt, status')
      .eq('userId', userId)
      .is('archivedAt', null)
      .order('createdAt', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch career pattern: ${error.message}`);
    }

    // Calculate weeks since first application
    const jobs = userJobs || [];
    if (jobs.length === 0) {
      return {
        userJourney: [],
        successfulPattern: this.getTypicalSuccessPattern(),
        currentWeek: 0,
        expectedWeek: 0,
      };
    }

    const firstDate = new Date(jobs[0].createdAt);
    const currentDate = new Date();
    const currentWeek = Math.floor((currentDate.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

    // Map user's journey
    const userJourney = jobs.map(job => {
      const jobDate = new Date(job.createdAt);
      const week = Math.floor((jobDate.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return { week, stage: job.status };
    });

    // Get typical successful pattern
    const successfulPattern = this.getTypicalSuccessPattern();

    // Expected week based on typical pattern (when user should have offers)
    const expectedWeek = 12; // Typical timeline to offers

    return {
      userJourney,
      successfulPattern,
      currentWeek,
      expectedWeek,
    };
  }

  async getRecommendations(userId: string): Promise<Recommendations> {
    const benchmarks = await this.getBenchmarks(userId);
    const skills = await this.getSkillPositioning(userId);

    const actionPlan: string[] = [];
    const differentiationStrategy: string[] = [];

    // Generate action plan based on benchmarks
    if (benchmarks.applicationsPerMonth.user < benchmarks.applicationsPerMonth.peer) {
      actionPlan.push(`Increase application volume to ${Math.ceil(benchmarks.applicationsPerMonth.peer)} per month (currently ${benchmarks.applicationsPerMonth.user})`);
    }

    if (benchmarks.responseRate.user < benchmarks.responseRate.peer) {
      actionPlan.push('Improve resume and application quality to increase response rate');
    }

    // Generate skill recommendations
    if (skills.skillGaps.length > 0) {
      actionPlan.push(`Develop missing skills: ${skills.skillGaps.slice(0, 3).join(', ')}`);
    }

    if (skills.overallRating === 'Below Market') {
      actionPlan.push('Focus on skill development through projects and certifications');
    }

    // Differentiation strategies
    differentiationStrategy.push('Highlight unique combination of technical and soft skills');
    differentiationStrategy.push('Build portfolio projects that demonstrate real-world problem solving');
    differentiationStrategy.push('Engage with tech communities and contribute to open source');

    // Market positioning
    const marketPositioning = {
      targetCompanies: 'Mid-size companies (100-500 employees)',
      targetRoles: 'Full-stack Developer, Backend Engineer',
      targetLocations: 'Remote, NYC Metro Area',
      competitionLevel: 'Medium' as const,
    };

    return {
      actionPlan,
      differentiationStrategy,
      marketPositioning,
    };
  }

  // Helper methods
  private calculateUserMetrics(jobs: any[], userId: string) {
    const totalJobs = jobs.length;
    
    // Calculate time range
    if (totalJobs === 0) {
      return {
        applicationsPerMonth: 0,
        responseRate: 0,
        interviewRate: 0,
        offerRate: 0,
      };
    }

    const dates = jobs.map(j => new Date(j.createdAt).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const monthsActive = Math.max(1, (maxDate - minDate) / (30 * 24 * 60 * 60 * 1000));

    const applicationsPerMonth = totalJobs / monthsActive;
    
    const responded = jobs.filter(j => 
      !['Interested', 'Applied'].includes(j.status)
    ).length;
    const responseRate = totalJobs > 0 ? (responded / totalJobs) * 100 : 0;

    const interviewed = jobs.filter(j => 
      ['Phone Screen', 'Interview', 'Offer'].includes(j.status)
    ).length;
    const interviewRate = totalJobs > 0 ? (interviewed / totalJobs) * 100 : 0;

    const offers = jobs.filter(j => j.status === 'Offer').length;
    const offerRate = totalJobs > 0 ? (offers / totalJobs) * 100 : 0;

    return {
      applicationsPerMonth: Math.round(applicationsPerMonth * 10) / 10,
      responseRate: Math.round(responseRate * 10) / 10,
      interviewRate: Math.round(interviewRate * 10) / 10,
      offerRate: Math.round(offerRate * 10) / 10,
    };
  }

  private calculatePeerAverages(allJobs: any[], excludeUserId: string) {
    // Group by user
    const userJobsMap = new Map<string, any[]>();
    allJobs.forEach(job => {
      if (job.userId === excludeUserId) return; // Exclude current user
      const jobs = userJobsMap.get(job.userId) || [];
      jobs.push(job);
      userJobsMap.set(job.userId, jobs);
    });

    // Calculate metrics for each user
    const allMetrics = Array.from(userJobsMap.entries()).map(([userId, jobs]) => 
      this.calculateUserMetrics(jobs, userId)
    );

    if (allMetrics.length === 0) {
      return {
        applicationsPerMonth: 20,
        responseRate: 15,
        interviewRate: 10,
        offerRate: 4,
      };
    }

    // Average across all peers
    const avgMetrics = {
      applicationsPerMonth: allMetrics.reduce((sum, m) => sum + m.applicationsPerMonth, 0) / allMetrics.length,
      responseRate: allMetrics.reduce((sum, m) => sum + m.responseRate, 0) / allMetrics.length,
      interviewRate: allMetrics.reduce((sum, m) => sum + m.interviewRate, 0) / allMetrics.length,
      offerRate: allMetrics.reduce((sum, m) => sum + m.offerRate, 0) / allMetrics.length,
    };

    return {
      applicationsPerMonth: Math.round(avgMetrics.applicationsPerMonth * 10) / 10,
      responseRate: Math.round(avgMetrics.responseRate * 10) / 10,
      interviewRate: Math.round(avgMetrics.interviewRate * 10) / 10,
      offerRate: Math.round(avgMetrics.offerRate * 10) / 10,
    };
  }

  private getTypicalSuccessPattern() {
    // Typical successful job search pattern (weeks -> stage)
    return [
      { week: 0, stage: 'Started' },
      { week: 2, stage: 'Applied' },
      { week: 4, stage: 'Responses' },
      { week: 6, stage: 'Phone Screen' },
      { week: 8, stage: 'Interview' },
      { week: 10, stage: 'Final Round' },
      { week: 12, stage: 'Offer' },
    ];
  }
}
