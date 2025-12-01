import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from './dto/create-time-entry.dto';
import {
  TimeBreakdown,
  ProductivityPattern,
  EfficiencyMetric,
  ROIAnalysis,
  BurnoutIndicator,
  EnergyPattern,
  OptimalSchedule,
  TimeOptimizationRecommendation,
  ProductivityDashboard,
} from './dto/productivity-analytics.dto';

@Injectable()
export class ProductivityService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // AC1: Track time spent on different job search activities
  async createTimeEntry(userId: string, createTimeEntryDto: CreateTimeEntryDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        user_id: userId,
        activity_type: createTimeEntryDto.activity_type,
        job_id: createTimeEntryDto.job_id,
        duration_minutes: createTimeEntryDto.duration_minutes,
        start_time: createTimeEntryDto.start_time,
        end_time: createTimeEntryDto.end_time,
        energy_level: createTimeEntryDto.energy_level,
        productivity_rating: createTimeEntryDto.productivity_rating,
        notes: createTimeEntryDto.notes,
      })
      .select()
      .single();

    if (error) throw error;

    // Update daily productivity metrics
    await this.updateDailyProductivity(userId, new Date(createTimeEntryDto.start_time));

    return data;
  }

  async getTimeEntries(userId: string, filters?: {
    activity_type?: string;
    start_date?: string;
    end_date?: string;
    job_id?: string;
  }) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('time_entries')
      .select('*, jobs(title, company)')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (filters?.activity_type) {
      query = query.eq('activity_type', filters.activity_type);
    }

    if (filters?.start_date) {
      query = query.gte('start_time', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('start_time', filters.end_date);
    }

    if (filters?.job_id) {
      query = query.eq('job_id', filters.job_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data;
  }

  async updateTimeEntry(userId: string, entryId: string, updateTimeEntryDto: UpdateTimeEntryDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('time_entries')
      .update(updateTimeEntryDto)
      .eq('id', entryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Time entry not found');

    return data;
  }

  async deleteTimeEntry(userId: string, entryId: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId);

    if (error) throw error;

    return { message: 'Time entry deleted successfully' };
  }

  // AC2: Analyze productivity patterns and optimal working schedules
  async getProductivityPatterns(userId: string): Promise<ProductivityPattern[]> {
    const supabase = this.supabaseService.getClient();

    const { data: entries, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .not('productivity_rating', 'is', null);

    if (error) throw error;
    if (!entries || entries.length === 0) return [];

    // Group by hour and day of week
    const patterns: { [key: string]: { total_productivity: number; total_energy: number; count: number } } = {};

    entries.forEach((entry) => {
      const date = new Date(entry.start_time);
      const hour = date.getHours();
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const key = `${dayOfWeek}-${hour}`;

      if (!patterns[key]) {
        patterns[key] = { total_productivity: 0, total_energy: 0, count: 0 };
      }

      patterns[key].total_productivity += entry.productivity_rating || 0;
      patterns[key].total_energy += entry.energy_level || 0;
      patterns[key].count += 1;
    });

    return Object.entries(patterns).map(([key, data]) => {
      const [dayOfWeek, hourStr] = key.split('-');
      return {
        hour: parseInt(hourStr),
        day_of_week: dayOfWeek,
        avg_productivity: data.total_productivity / data.count,
        avg_energy: data.total_energy / data.count,
        total_entries: data.count,
      };
    });
  }

  // AC3: Monitor task completion rates and efficiency improvements
  async getEfficiencyMetrics(userId: string): Promise<EfficiencyMetric[]> {
    const supabase = this.supabaseService.getClient();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: recentEntries } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', thirtyDaysAgo.toISOString());

    const { data: oldEntries } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', sixtyDaysAgo.toISOString())
      .lt('start_time', thirtyDaysAgo.toISOString());

    if (!recentEntries) return [];

    const activityTypes = [...new Set(recentEntries.map((e) => e.activity_type))];

    return activityTypes.map((activity_type) => {
      const recent = recentEntries.filter((e) => e.activity_type === activity_type);
      const old = oldEntries?.filter((e) => e.activity_type === activity_type) || [];

      const recentAvgTime = recent.reduce((sum, e) => sum + e.duration_minutes, 0) / recent.length;
      const oldAvgTime = old.length > 0 ? old.reduce((sum, e) => sum + e.duration_minutes, 0) / old.length : recentAvgTime;

      const recentProductivity = recent.filter((e) => e.productivity_rating).reduce((sum, e) => sum + (e.productivity_rating || 0), 0) / recent.filter((e) => e.productivity_rating).length || 0;
      const oldProductivity = old.filter((e) => e.productivity_rating).length > 0 ? old.filter((e) => e.productivity_rating).reduce((sum, e) => sum + (e.productivity_rating || 0), 0) / old.filter((e) => e.productivity_rating).length : recentProductivity;

      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (recentProductivity > oldProductivity * 1.1) trend = 'improving';
      else if (recentProductivity < oldProductivity * 0.9) trend = 'declining';

      return {
        activity_type,
        avg_time_per_task: Math.round(recentAvgTime),
        completion_rate: 100, // Assume completed if logged
        productivity_score: Math.round(recentProductivity * 20), // Convert 1-5 to 0-100
        trend,
      };
    });
  }

  // AC4: Compare time investment with outcome generation and success rates
  async getROIAnalysis(userId: string): Promise<ROIAnalysis[]> {
    const supabase = this.supabaseService.getClient();

    const { data: timeEntries } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId);

    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId);

    if (!timeEntries || !jobs) return [];

    const activityTypes = [...new Set(timeEntries.map((e) => e.activity_type))];

    return activityTypes.map((activity_type) => {
      const entries = timeEntries.filter((e) => e.activity_type === activity_type);
      const totalTime = entries.reduce((sum, e) => sum + e.duration_minutes, 0);

      let outcomes = 0;
      let successRate = 0;

      if (activity_type === 'application') {
        outcomes = jobs.filter((j) => ['applied', 'interviewing', 'offer', 'accepted'].includes(j.status)).length;
        successRate = outcomes > 0 ? (jobs.filter((j) => j.status === 'offer' || j.status === 'accepted').length / outcomes) * 100 : 0;
      } else if (activity_type === 'interview_prep') {
        outcomes = jobs.filter((j) => j.status === 'interviewing' || j.status === 'offer').length;
        successRate = outcomes > 0 ? (jobs.filter((j) => j.status === 'offer').length / outcomes) * 100 : 0;
      } else {
        outcomes = entries.length;
        successRate = 75; // Default assumption
      }

      const roiScore = outcomes > 0 && totalTime > 0 ? (outcomes / (totalTime / 60)) * (successRate / 100) * 100 : 0;

      return {
        activity_type,
        time_invested_minutes: totalTime,
        outcomes_generated: outcomes,
        success_rate: Math.round(successRate * 10) / 10,
        roi_score: Math.round(roiScore * 10) / 10,
      };
    });
  }

  // AC5: Generate recommendations for time allocation optimization
  async getRecommendations(userId: string): Promise<TimeOptimizationRecommendation[]> {
    const supabase = this.supabaseService.getClient();

    const { data: entries } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!entries || entries.length === 0) {
      return [{
        type: 'getting_started',
        priority: 'high',
        message: 'Start tracking your time to receive personalized recommendations',
        action: 'Begin logging time entries for your job search activities',
        expected_impact: 'Gain insights into your productivity patterns within 1-2 weeks',
      }];
    }

    const recommendations: TimeOptimizationRecommendation[] = [];

    // Check time distribution
    const timeByActivity = entries.reduce((acc, e) => {
      acc[e.activity_type] = (acc[e.activity_type] || 0) + e.duration_minutes;
      return acc;
    }, {} as { [key: string]: number });

    const totalTime = (Object.values(timeByActivity) as number[]).reduce((sum: number, t: number) => sum + t, 0);
    const applicationTime = timeByActivity['application'] || 0;
    const applicationPercentage = (applicationTime / totalTime) * 100;

    if (applicationPercentage < 30) {
      recommendations.push({
        type: 'time_allocation',
        priority: 'high',
        message: `Only ${applicationPercentage.toFixed(1)}% of your time is spent on applications`,
        action: 'Increase application time to 30-40% of total job search time',
        expected_impact: 'Higher response rates and more interview opportunities',
      });
    }

    // Check for low productivity periods
    const lowProductivityEntries = entries.filter((e) => e.productivity_rating && e.productivity_rating <= 2);
    if (lowProductivityEntries.length > entries.length * 0.3) {
      recommendations.push({
        type: 'productivity_improvement',
        priority: 'medium',
        message: '30%+ of your sessions have low productivity ratings',
        action: 'Identify and eliminate distractions during work sessions',
        expected_impact: 'Increase overall productivity by 20-30%',
      });
    }

    // Check energy patterns
    const avgEnergy = entries.filter((e) => e.energy_level).reduce((sum, e) => sum + (e.energy_level || 0), 0) / entries.filter((e) => e.energy_level).length;
    if (avgEnergy < 3) {
      recommendations.push({
        type: 'energy_management',
        priority: 'high',
        message: 'Your average energy level is below 3/5',
        action: 'Schedule difficult tasks during high-energy periods and take more breaks',
        expected_impact: 'Improved focus and higher quality work output',
      });
    }

    return recommendations;
  }

  // AC6: Include burnout prevention and work-life balance monitoring
  async getBurnoutIndicator(userId: string): Promise<BurnoutIndicator> {
    const supabase = this.supabaseService.getClient();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: entries } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', sevenDaysAgo.toISOString());

    if (!entries || entries.length === 0) {
      return {
        burnout_score: 0,
        risk_level: 'low',
        factors: {
          excessive_hours: false,
          low_energy_trend: false,
          declining_productivity: false,
          lack_of_breaks: false,
        },
        work_life_balance_score: 10,
        recommendations: ['Start tracking time to monitor burnout risk'],
      };
    }

    const totalMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0);
    const hoursPerWeek = totalMinutes / 60;
    const excessive_hours = hoursPerWeek > 50;

    const avgEnergy = entries.filter((e) => e.energy_level).reduce((sum, e) => sum + (e.energy_level || 0), 0) / entries.filter((e) => e.energy_level).length || 3;
    const low_energy_trend = avgEnergy < 2.5;

    const avgProductivity = entries.filter((e) => e.productivity_rating).reduce((sum, e) => sum + (e.productivity_rating || 0), 0) / entries.filter((e) => e.productivity_rating).length || 3;
    const declining_productivity = avgProductivity < 2.5;

    // Check for lack of breaks (entries on consecutive days)
    const uniqueDays = new Set(entries.map((e) => new Date(e.start_time).toDateString()));
    const lack_of_breaks = uniqueDays.size >= 7;

    const burnoutFactors = [excessive_hours, low_energy_trend, declining_productivity, lack_of_breaks].filter(Boolean).length;
    const burnout_score = (burnoutFactors / 4) * 10;

    let risk_level: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    if (burnout_score >= 7.5) risk_level = 'critical';
    else if (burnout_score >= 5) risk_level = 'high';
    else if (burnout_score >= 2.5) risk_level = 'moderate';

    const work_life_balance_score = 10 - burnout_score;

    const recommendations: string[] = [];
    if (excessive_hours) recommendations.push('Reduce weekly hours to 40-45 for better sustainability');
    if (low_energy_trend) recommendations.push('Take more frequent breaks and prioritize sleep');
    if (declining_productivity) recommendations.push('Focus on quality over quantity in your work sessions');
    if (lack_of_breaks) recommendations.push('Schedule at least 1-2 rest days per week');
    if (recommendations.length === 0) recommendations.push('Maintain your healthy work-life balance!');

    return {
      burnout_score: Math.round(burnout_score * 10) / 10,
      risk_level,
      factors: {
        excessive_hours,
        low_energy_trend,
        declining_productivity,
        lack_of_breaks,
      },
      work_life_balance_score: Math.round(work_life_balance_score * 10) / 10,
      recommendations,
    };
  }

  // AC7: Track energy levels and performance correlation patterns
  async getEnergyPatterns(userId: string): Promise<EnergyPattern[]> {
    const supabase = this.supabaseService.getClient();

    const { data: entries } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .not('energy_level', 'is', null)
      .not('productivity_rating', 'is', null);

    if (!entries || entries.length === 0) return [];

    const hourlyData: { [hour: number]: { energy: number[]; productivity: number[] } } = {};

    entries.forEach((entry) => {
      const hour = new Date(entry.start_time).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { energy: [], productivity: [] };
      }
      hourlyData[hour].energy.push(entry.energy_level);
      hourlyData[hour].productivity.push(entry.productivity_rating);
    });

    return Object.entries(hourlyData).map(([hourStr, data]) => {
      const hour = parseInt(hourStr);
      const avgEnergy = data.energy.reduce((sum, e) => sum + e, 0) / data.energy.length;
      const avgProductivity = data.productivity.reduce((sum, p) => sum + p, 0) / data.productivity.length;

      // Calculate correlation (simplified)
      const correlation = (avgEnergy / 5) * (avgProductivity / 5);

      return {
        hour,
        avg_energy: Math.round(avgEnergy * 10) / 10,
        productivity_correlation: Math.round(correlation * 100),
      };
    }).sort((a, b) => a.hour - b.hour);
  }

  // AC8: Provide productivity coaching and efficiency improvement suggestions
  async getOptimalSchedule(userId: string): Promise<OptimalSchedule> {
    const patterns = await this.getProductivityPatterns(userId);
    const energyPatterns = await this.getEnergyPatterns(userId);

    if (patterns.length === 0 || energyPatterns.length === 0) {
      return {
        best_hours: [9, 10, 11],
        best_days: ['Monday', 'Tuesday', 'Wednesday'],
        peak_productivity_time: '9:00 AM - 11:00 AM',
        recommended_schedule: [],
      };
    }

    // Find top 3 productive hours
    const sortedByProductivity = [...patterns].sort((a, b) => b.avg_productivity - a.avg_productivity);
    const best_hours = [...new Set(sortedByProductivity.slice(0, 3).map((p) => p.hour))];

    // Find best days
    const dayProductivity: { [day: string]: number[] } = {};
    patterns.forEach((p) => {
      if (!dayProductivity[p.day_of_week]) dayProductivity[p.day_of_week] = [];
      dayProductivity[p.day_of_week].push(p.avg_productivity);
    });

    const best_days = Object.entries(dayProductivity)
      .map(([day, scores]) => ({ day, avg: scores.reduce((sum, s) => sum + s, 0) / scores.length }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3)
      .map((d) => d.day);

    const peakHour = best_hours[0];
    
    // Helper to convert 24-hour to 12-hour format
    const formatTime = (hour: number) => {
      const normalizedHour = hour % 24; // Handle overflow
      const hour12 = normalizedHour === 0 ? 12 : normalizedHour > 12 ? normalizedHour - 12 : normalizedHour;
      const period = normalizedHour < 12 ? 'AM' : 'PM';
      return `${hour12}:00 ${period}`;
    };
    
    const peak_productivity_time = `${formatTime(peakHour)} - ${formatTime(peakHour + 2)}`;

    const recommended_schedule = [
      {
        activity_type: 'application',
        suggested_time: peak_productivity_time,
        reason: 'High energy and focus required for quality applications',
      },
      {
        activity_type: 'interview_prep',
        suggested_time: peak_productivity_time,
        reason: 'Complex preparation tasks benefit from peak performance',
      },
      {
        activity_type: 'networking',
        suggested_time: 'Afternoon (2:00 PM - 4:00 PM)',
        reason: 'Social activities work well during moderate energy periods',
      },
    ];

    return {
      best_hours,
      best_days,
      peak_productivity_time,
      recommended_schedule,
    };
  }

  // Dashboard overview
  async getDashboard(userId: string): Promise<ProductivityDashboard> {
    const supabase = this.supabaseService.getClient();

    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [thisWeekRes, lastWeekRes] = await Promise.all([
      supabase.from('time_entries').select('*').eq('user_id', userId).gte('start_time', oneWeekAgo.toISOString()),
      supabase.from('time_entries').select('*').eq('user_id', userId).gte('start_time', twoWeeksAgo.toISOString()).lt('start_time', oneWeekAgo.toISOString()),
    ]);

    const thisWeekEntries = thisWeekRes.data || [];
    const lastWeekEntries = lastWeekRes.data || [];

    const total_time_this_week = thisWeekEntries.reduce((sum, e) => sum + e.duration_minutes, 0);
    const total_time_last_week = lastWeekEntries.reduce((sum, e) => sum + e.duration_minutes, 0);

    const avgProductivity = thisWeekEntries.filter((e) => e.productivity_rating).reduce((sum, e) => sum + (e.productivity_rating || 0), 0) / thisWeekEntries.filter((e) => e.productivity_rating).length || 0;
    const productivity_score = Math.round(avgProductivity * 20);

    const burnout_indicator = await this.getBurnoutIndicator(userId);
    const avg_energy = thisWeekEntries.filter((e) => e.energy_level).reduce((sum, e) => sum + (e.energy_level || 0), 0) / thisWeekEntries.filter((e) => e.energy_level).length || 0;

    // Time breakdown
    const timeByActivity: { [key: string]: number } = {};
    thisWeekEntries.forEach((e) => {
      timeByActivity[e.activity_type] = (timeByActivity[e.activity_type] || 0) + e.duration_minutes;
    });

    const time_breakdown: TimeBreakdown[] = Object.entries(timeByActivity).map(([activity_type, total_minutes]) => ({
      activity_type,
      total_minutes,
      percentage: Math.round((total_minutes / total_time_this_week) * 100),
      entry_count: thisWeekEntries.filter((e) => e.activity_type === activity_type).length,
      avg_duration: Math.round(total_minutes / thisWeekEntries.filter((e) => e.activity_type === activity_type).length),
    }));

    const [
      productivity_patterns,
      efficiency_metrics,
      roi_analysis,
      energy_patterns,
      optimal_schedule,
      recommendations,
    ] = await Promise.all([
      this.getProductivityPatterns(userId),
      this.getEfficiencyMetrics(userId),
      this.getROIAnalysis(userId),
      this.getEnergyPatterns(userId),
      this.getOptimalSchedule(userId),
      this.getRecommendations(userId),
    ]);

    return {
      summary: {
        total_time_this_week,
        total_time_last_week,
        productivity_score,
        burnout_risk: burnout_indicator.risk_level,
        activities_completed: thisWeekEntries.length,
        avg_energy: Math.round(avg_energy * 10) / 10,
      },
      time_breakdown,
      productivity_patterns,
      efficiency_metrics,
      roi_analysis,
      burnout_indicator,
      energy_patterns,
      optimal_schedule,
      recommendations,
    };
  }

  // Helper: Update daily productivity metrics
  private async updateDailyProductivity(userId: string, date: Date) {
    const supabase = this.supabaseService.getClient();
    const dateStr = date.toISOString().split('T')[0];

    const { data: entries } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', `${dateStr}T00:00:00`)
      .lt('start_time', `${dateStr}T23:59:59`);

    if (!entries || entries.length === 0) return;

    const total_minutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0);
    const energyEntries = entries.filter((e) => e.energy_level);
    const productivityEntries = entries.filter((e) => e.productivity_rating);

    const energy_average = energyEntries.length > 0 ? energyEntries.reduce((sum, e) => sum + (e.energy_level || 0), 0) / energyEntries.length : null;
    const productivity_average = productivityEntries.length > 0 ? productivityEntries.reduce((sum, e) => sum + (e.productivity_rating || 0), 0) / productivityEntries.length : null;

    // Simple burnout calculation
    const hoursToday = total_minutes / 60;
    const burnout_score = hoursToday > 10 ? 8 : hoursToday > 8 ? 5 : hoursToday > 6 ? 3 : 1;
    const work_life_balance_score = 10 - burnout_score;

    await supabase
      .from('daily_productivity')
      .upsert({
        user_id: userId,
        date: dateStr,
        total_minutes,
        energy_average,
        productivity_average,
        activities_completed: entries.length,
        burnout_score,
        work_life_balance_score,
      }, { onConflict: 'user_id,date' });
  }
}
