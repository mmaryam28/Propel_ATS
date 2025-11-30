import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface JobStatistics {
  totalJobs: number;
  byStatus: {
    interested: number;
    applied: number;
    phoneScreen: number;
    interview: number;
    offer: number;
    rejected: number;
  };
  interviewSuccessRate: number; // % of applications that reached interview stage
  responseRate: number; // % of applications that got a response (not stuck in Applied)
  averageTimeInStages: {
    interested: number | null; // days
    applied: number | null;
    phoneScreen: number | null;
    interview: number | null;
  };
  deadlineAdherence: {
    upcoming: number;
    missed: number;
    adherenceRate: number; // % of deadlines met
  };
  timeToOffer: number | null; // average days from application to offer
  timeToResponse: number | null; // average days from application to first response
  timeToInterview: number | null; // average days from application to interview
}

export interface MonthlyVolume {
  month: string; // YYYY-MM format
  count: number;
}

@Injectable()
export class StatisticsService {
  constructor(private supabase: SupabaseService) {}

  async getOverview(userId: string, startDate?: string, endDate?: string): Promise<JobStatistics> {
    const client = this.supabase.getClient();

    // Build query for non-archived jobs with optional date filtering
    let query = client
      .from('jobs')
      .select('*')
      .eq('userId', userId)
      .is('archivedAt', null);

    // Apply date filters if provided
    if (startDate) {
      query = query.gte('createdAt', startDate);
    }
    if (endDate) {
      query = query.lte('createdAt', endDate);
    }

    const { data: jobs, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }

    if (!jobs || jobs.length === 0) {
      return this.getEmptyStatistics();
    }

    // Count by status
    const byStatus = {
      interested: jobs.filter((j) => j.status === 'Interested').length,
      applied: jobs.filter((j) => j.status === 'Applied').length,
      phoneScreen: jobs.filter((j) => j.status === 'Phone Screen').length,
      interview: jobs.filter((j) => j.status === 'Interview').length,
      offer: jobs.filter((j) => j.status === 'Offer').length,
      rejected: jobs.filter((j) => j.status === 'Rejected').length,
    };

    const totalJobs = jobs.length;

    // Interview success rate: % of jobs that reached interview stage (Phone Screen, Interview, or Offer)
    const interviewStageJobs = byStatus.phoneScreen + byStatus.interview + byStatus.offer;
    const interviewSuccessRate = totalJobs > 0 ? (interviewStageJobs / totalJobs) * 100 : 0;

    // Response rate: % of jobs that moved beyond Applied (got some response)
    const respondedJobs = totalJobs - byStatus.interested - byStatus.applied;
    const responseRate = totalJobs > 0 ? (respondedJobs / totalJobs) * 100 : 0;

    // Calculate average time in each stage using status history
    const averageTimeInStages = await this.calculateAverageTimeInStages(userId);

    // Deadline adherence
    const jobsWithDeadlines = jobs.filter((j) => j.deadline);
    const upcoming = jobsWithDeadlines.filter(
      (j) => new Date(j.deadline) >= new Date() && j.status === 'Interested'
    ).length;
    const missed = jobsWithDeadlines.filter(
      (j) => new Date(j.deadline) < new Date() && j.status === 'Interested'
    ).length;
    const adherenceRate =
      jobsWithDeadlines.length > 0 ? ((jobsWithDeadlines.length - missed) / jobsWithDeadlines.length) * 100 : 100;

    // Time to offer: average days from creation to reaching Offer status
    const timeToOffer = await this.calculateAverageTimeToOffer(userId);
    const timeToResponse = await this.calculateAverageTimeToResponse(userId);
    const timeToInterview = await this.calculateAverageTimeToInterview(userId);

    return {
      totalJobs,
      byStatus,
      interviewSuccessRate: Math.round(interviewSuccessRate * 10) / 10,
      responseRate: Math.round(responseRate * 10) / 10,
      averageTimeInStages,
      deadlineAdherence: {
        upcoming,
        missed,
        adherenceRate: Math.round(adherenceRate * 10) / 10,
      },
      timeToOffer,
      timeToResponse,
      timeToInterview,
    };
  }

  async getMonthlyVolume(userId: string, months: number = 12, startDateParam?: string, endDateParam?: string): Promise<MonthlyVolume[]> {
    const client = this.supabase.getClient();

    // Use custom date range if provided, otherwise use months parameter
    let query = client
      .from('jobs')
      .select('createdAt')
      .eq('userId', userId);

    if (startDateParam) {
      query = query.gte('createdAt', startDateParam);
    } else {
      // Default: Get all jobs created in the last N months
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      query = query.gte('createdAt', startDate.toISOString());
    }

    if (endDateParam) {
      query = query.lte('createdAt', endDateParam);
    }

    const { data: jobs, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }

    if (!jobs || jobs.length === 0) {
      return [];
    }

    // Group by month
    const monthlyMap = new Map<string, number>();
    jobs.forEach((job) => {
      const date = new Date(job.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
    });

    // Convert to array and sort
    const result: MonthlyVolume[] = Array.from(monthlyMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return result;
  }

  async exportToCSV(userId: string): Promise<string> {
    const stats = await this.getOverview(userId);
    const monthly = await this.getMonthlyVolume(userId, 12);

    // Build CSV content
    const lines: string[] = [];
    
    // Overview section
    lines.push('Job Search Statistics Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('OVERVIEW');
    lines.push(`Total Jobs,${stats.totalJobs}`);
    lines.push(`Interview Success Rate,${stats.interviewSuccessRate}%`);
    lines.push(`Response Rate,${stats.responseRate}%`);
    lines.push(`Time to Offer (days),${stats.timeToOffer ?? 'N/A'}`);
    lines.push('');
    
    // Status breakdown
    lines.push('JOBS BY STATUS');
    lines.push(`Interested,${stats.byStatus.interested}`);
    lines.push(`Applied,${stats.byStatus.applied}`);
    lines.push(`Phone Screen,${stats.byStatus.phoneScreen}`);
    lines.push(`Interview,${stats.byStatus.interview}`);
    lines.push(`Offer,${stats.byStatus.offer}`);
    lines.push(`Rejected,${stats.byStatus.rejected}`);
    lines.push('');
    
    // Average time in stages
    lines.push('AVERAGE TIME IN STAGES (DAYS)');
    lines.push(`Interested,${stats.averageTimeInStages.interested ?? 'N/A'}`);
    lines.push(`Applied,${stats.averageTimeInStages.applied ?? 'N/A'}`);
    lines.push(`Phone Screen,${stats.averageTimeInStages.phoneScreen ?? 'N/A'}`);
    lines.push(`Interview,${stats.averageTimeInStages.interview ?? 'N/A'}`);
    lines.push('');
    
    // Deadline adherence
    lines.push('DEADLINE ADHERENCE');
    lines.push(`Upcoming Deadlines,${stats.deadlineAdherence.upcoming}`);
    lines.push(`Missed Deadlines,${stats.deadlineAdherence.missed}`);
    lines.push(`Adherence Rate,${stats.deadlineAdherence.adherenceRate}%`);
    lines.push('');
    
    // Monthly volume
    lines.push('MONTHLY APPLICATION VOLUME');
    lines.push('Month,Count');
    monthly.forEach((m) => {
      lines.push(`${m.month},${m.count}`);
    });

    return lines.join('\n');
  }

  private async calculateAverageTimeInStages(userId: string): Promise<{
    interested: number | null;
    applied: number | null;
    phoneScreen: number | null;
    interview: number | null;
  }> {
    const client = this.supabase.getClient();

    // Get status history for all jobs
    const { data: history, error } = await client
      .from('job_history')
      .select('jobid, status, createdat')
      .eq('userid', userId)
      .order('createdat', { ascending: true });

    if (error || !history || history.length === 0) {
      return { interested: null, applied: null, phoneScreen: null, interview: null };
    }

    // Group by jobid and calculate time spent in each status
    const jobStages = new Map<string, Map<string, number>>();
    const jobTimestamps = new Map<string, Date>();

    history.forEach((h) => {
      if (!jobStages.has(h.jobid)) {
        jobStages.set(h.jobid, new Map());
        jobTimestamps.set(h.jobid, new Date(h.createdat));
      }
    });

    // Calculate time differences
    for (const jobid of jobStages.keys()) {
      const statusHistory = history.filter((h) => h.jobid === jobid);
      for (let i = 0; i < statusHistory.length - 1; i++) {
        const current = statusHistory[i];
        const next = statusHistory[i + 1];
        const timeInStage = (new Date(next.createdat).getTime() - new Date(current.createdat).getTime()) / (1000 * 60 * 60 * 24);
        
        const stages = jobStages.get(jobid)!;
        stages.set(current.status, (stages.get(current.status) || 0) + timeInStage);
      }
    }

    // Calculate averages
    const averages = {
      interested: this.calculateAverage(jobStages, 'Interested'),
      applied: this.calculateAverage(jobStages, 'Applied'),
      phoneScreen: this.calculateAverage(jobStages, 'Phone Screen'),
      interview: this.calculateAverage(jobStages, 'Interview'),
    };

    return averages;
  }

  private calculateAverage(jobStages: Map<string, Map<string, number>>, status: string): number | null {
    const values: number[] = [];
    for (const stages of jobStages.values()) {
      const time = stages.get(status);
      if (time !== undefined && time > 0) {
        values.push(time);
      }
    }
    if (values.length === 0) return null;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.round(avg * 10) / 10;
  }

  private async calculateAverageTimeToOffer(userId: string): Promise<number | null> {
    const client = this.supabase.getClient();

    // Get all jobs that reached Offer status
    const { data: jobs, error } = await client
      .from('jobs')
      .select('*')
      .eq('userId', userId)
      .eq('status', 'Offer');

    if (error || !jobs || jobs.length === 0) {
      return null;
    }

    // Get the timestamp when each job reached Offer status from history
    const { data: history } = await client
      .from('job_history')
      .select('*')
      .eq('userid', userId)
      .eq('status', 'Offer')
      .in('jobid', jobs.map((j) => j.id));

    // Calculate time differences
    const times: number[] = [];
    jobs.forEach((job) => {
      const jobCreated = job.createdAt || job.createdat || job.created_at;
      if (!jobCreated) return;

      const offerHistory = history?.find((h) => h.jobid === job.id);
      if (offerHistory && offerHistory.createdat) {
        // Use history record if available
        const createdDate = new Date(jobCreated);
        const offerDate = new Date(offerHistory.createdat);
        const days = (offerDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        if (days >= 0) {
          times.push(days);
        }
      } else {
        // Fallback: use statusUpdatedAt if no history record
        const statusUpdated = job.statusUpdatedAt || job.statusupdatedat || job.status_updated_at || job.updatedAt || job.updatedat || job.updated_at;
        if (statusUpdated) {
          const createdDate = new Date(jobCreated);
          const updatedDate = new Date(statusUpdated);
          const days = (updatedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
          if (days >= 0) {
            times.push(days);
          }
        }
      }
    });

    if (times.length === 0) return null;
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return Math.round(avg * 10) / 10;
  }

  private async calculateAverageTimeToResponse(userId: string): Promise<number | null> {
    const client = this.supabase.getClient();

    // Get all jobs that moved past Applied status (indicating a response)
    const { data: jobs, error } = await client
      .from('jobs')
      .select('*')
      .eq('userId', userId)
      .in('status', ['Phone Screen', 'Interview', 'Offer', 'Rejected']);

    if (error || !jobs || jobs.length === 0) {
      return null;
    }

    // Get the first status change from Applied for each job
    const { data: history } = await client
      .from('job_history')
      .select('*')
      .eq('userid', userId)
      .in('status', ['Phone Screen', 'Interview', 'Offer', 'Rejected'])
      .in('jobid', jobs.map((j) => j.id))
      .order('createdat', { ascending: true });

    // Calculate time differences
    const times: number[] = [];
    jobs.forEach((job) => {
      const jobCreated = job.createdAt || job.createdat || job.created_at;
      if (!jobCreated) return;

      // Find first response for this job
      const firstResponse = history?.find((h) => h.jobid === job.id);
      if (firstResponse && firstResponse.createdat) {
        const createdDate = new Date(jobCreated);
        const responseDate = new Date(firstResponse.createdat);
        const days = (responseDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        if (days >= 0) {
          times.push(days);
        }
      } else {
        // Fallback: use statusUpdatedAt if no history record
        const statusUpdated = job.statusUpdatedAt || job.statusupdatedat || job.status_updated_at || job.updatedAt || job.updatedat || job.updated_at;
        if (statusUpdated) {
          const createdDate = new Date(jobCreated);
          const updatedDate = new Date(statusUpdated);
          const days = (updatedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
          if (days >= 0) {
            times.push(days);
          }
        }
      }
    });

    if (times.length === 0) return null;
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return Math.round(avg * 10) / 10;
  }

  private async calculateAverageTimeToInterview(userId: string): Promise<number | null> {
    const client = this.supabase.getClient();

    // Get all jobs that reached Interview status
    const { data: jobs, error } = await client
      .from('jobs')
      .select('*')
      .eq('userId', userId)
      .eq('status', 'Interview');

    if (error || !jobs || jobs.length === 0) {
      return null;
    }

    // Get the timestamp when each job reached Interview status from history
    const { data: history } = await client
      .from('job_history')
      .select('*')
      .eq('userid', userId)
      .eq('status', 'Interview')
      .in('jobid', jobs.map((j) => j.id));

    // Calculate time differences
    const times: number[] = [];
    jobs.forEach((job) => {
      const jobCreated = job.createdAt || job.createdat || job.created_at;
      if (!jobCreated) return;

      const interviewHistory = history?.find((h) => h.jobid === job.id);
      if (interviewHistory && interviewHistory.createdat) {
        const createdDate = new Date(jobCreated);
        const interviewDate = new Date(interviewHistory.createdat);
        const days = (interviewDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        if (days >= 0) {
          times.push(days);
        }
      } else {
        // Fallback: use statusUpdatedAt if no history record
        const statusUpdated = job.statusUpdatedAt || job.statusupdatedat || job.status_updated_at || job.updatedAt || job.updatedat || job.updated_at;
        if (statusUpdated) {
          const createdDate = new Date(jobCreated);
          const updatedDate = new Date(statusUpdated);
          const days = (updatedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
          if (days >= 0) {
            times.push(days);
          }
        }
      }
    });

    if (times.length === 0) return null;
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return Math.round(avg * 10) / 10;
  }

  private getEmptyStatistics(): JobStatistics {
    return {
      totalJobs: 0,
      byStatus: {
        interested: 0,
        applied: 0,
        phoneScreen: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
      },
      interviewSuccessRate: 0,
      responseRate: 0,
      averageTimeInStages: {
        interested: null,
        applied: null,
        phoneScreen: null,
        interview: null,
      },
      deadlineAdherence: {
        upcoming: 0,
        missed: 0,
        adherenceRate: 100,
      },
      timeToOffer: null,
      timeToResponse: null,
      timeToInterview: null,
    };
  }
}
