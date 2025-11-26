import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';

@Injectable()
export class GoalsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // AC1: Users can set SMART goals with validation
  async createGoal(userId: string, createGoalDto: CreateGoalDto) {
    const supabase = this.supabaseService.getClient();

    // Validate SMART criteria
    if (!createGoalDto.title || createGoalDto.title.length < 5) {
      throw new BadRequestException('Goal title must be specific (at least 5 characters)');
    }

    if (!createGoalDto.target || createGoalDto.target <= 0) {
      throw new BadRequestException('Goal must be measurable with a positive target value');
    }

    const startDate = new Date(createGoalDto.start_date);
    const targetDate = new Date(createGoalDto.target_date);
    const today = new Date();

    if (targetDate <= startDate) {
      throw new BadRequestException('Target date must be after start date');
    }

    if (targetDate < today) {
      throw new BadRequestException('Target date must be in the future (Time-bound)');
    }

    // Check if goal is realistic based on historical data
    const { data: historicalGoals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('category', createGoalDto.category)
      .eq('completed', true);

    const avgCompletionRate = historicalGoals && historicalGoals.length > 0
      ? historicalGoals.reduce((sum, g) => sum + (g.progress / g.target), 0) / historicalGoals.length
      : 0.7; // Default assumption

    if (avgCompletionRate < 0.5 && createGoalDto.target > 50) {
      throw new BadRequestException(
        'Goal may not be achievable based on your history. Consider starting with a smaller target.'
      );
    }

    // Create the goal
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        title: createGoalDto.title,
        description: createGoalDto.description,
        category: createGoalDto.category,
        goal_type: createGoalDto.goal_type,
        metric_type: createGoalDto.metric_type,
        target: createGoalDto.target,
        progress: 0,
        unit: createGoalDto.unit,
        priority: createGoalDto.priority,
        status: 'not_started',
        start_date: createGoalDto.start_date,
        target_date: createGoalDto.target_date,
        completed: false,
        why_important: createGoalDto.why_important,
        celebration_message: createGoalDto.celebration_message,
        shared_with: createGoalDto.shared_with,
        progress_percentage: 0,
      })
      .select()
      .single();

    if (error) throw error;

    // Log initial progress history entry
    await supabase.from('goal_progress_history').insert({
      goal_id: data.id,
      progress_value: 0,
      notes: 'Goal created',
    });

    return data;
  }

  // AC2: Support for both short-term and long-term objectives
  async getGoals(userId: string, filters?: {
    category?: string;
    status?: string;
    priority?: string;
    timeframe?: 'short_term' | 'long_term' | 'all';
  }) {
    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('goals')
      .select('*, goal_milestones(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Filter by timeframe if specified
    if (filters?.timeframe && filters.timeframe !== 'all') {
      const today = new Date();
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(today.getMonth() + 3);

      return data.filter(goal => {
        const targetDate = new Date(goal.target_date);
        if (filters.timeframe === 'short_term') {
          return targetDate <= threeMonthsFromNow;
        } else {
          return targetDate > threeMonthsFromNow;
        }
      });
    }

    return data;
  }

  async getGoalById(userId: string, goalId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('goals')
      .select('*, goal_milestones(*)')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Goal not found');
    }

    // Get progress history
    const { data: history } = await supabase
      .from('goal_progress_history')
      .select('*')
      .eq('goal_id', goalId)
      .order('recorded_at', { ascending: true });

    return { ...data, progress_history: history };
  }

  // AC3: Track achievement rates and progress
  async getAchievementAnalytics(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.completed).length;
    const inProgressGoals = goals.filter(g => g.status === 'in_progress').length;
    const abandonedGoals = goals.filter(g => g.status === 'abandoned').length;
    const notStartedGoals = goals.filter(g => g.status === 'not_started').length;

    const overallAchievementRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    // Category-wise achievement rates
    const categoryRates = goals.reduce((acc, goal) => {
      if (!acc[goal.category]) {
        acc[goal.category] = { total: 0, completed: 0, inProgress: 0 };
      }
      acc[goal.category].total++;
      if (goal.completed) acc[goal.category].completed++;
      if (goal.status === 'in_progress') acc[goal.category].inProgress++;
      return acc;
    }, {});

    const categoryAnalysis = Object.entries(categoryRates).map(([category, stats]: [string, any]) => ({
      category,
      total: stats.total,
      completed: stats.completed,
      inProgress: stats.inProgress,
      achievementRate: (stats.completed / stats.total) * 100,
    }));

    // Priority-wise breakdown
    const priorityBreakdown = goals.reduce((acc, goal) => {
      if (!acc[goal.priority]) {
        acc[goal.priority] = { total: 0, completed: 0, avgProgress: 0 };
      }
      acc[goal.priority].total++;
      if (goal.completed) acc[goal.priority].completed++;
      acc[goal.priority].avgProgress += goal.progress_percentage || 0;
      return acc;
    }, {});

    Object.keys(priorityBreakdown).forEach(priority => {
      priorityBreakdown[priority].avgProgress /= priorityBreakdown[priority].total;
    });

    // Average time to completion
    const completedGoalsWithDates = goals.filter(g => g.completed && g.completed_date);
    const avgDaysToCompletion = completedGoalsWithDates.length > 0
      ? completedGoalsWithDates.reduce((sum, g) => {
          const start = new Date(g.start_date);
          const end = new Date(g.completed_date);
          return sum + Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / completedGoalsWithDates.length
      : 0;

    return {
      summary: {
        totalGoals,
        completedGoals,
        inProgressGoals,
        abandonedGoals,
        notStartedGoals,
        overallAchievementRate: Math.round(overallAchievementRate * 10) / 10,
        avgDaysToCompletion: Math.round(avgDaysToCompletion),
      },
      categoryAnalysis,
      priorityBreakdown,
    };
  }

  // AC4: Adjust goals based on progress and recommend modifications
  async getRecommendations(userId: string, goalId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: goal, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (error || !goal) {
      throw new NotFoundException('Goal not found');
    }

    const recommendations: Array<{ type: string; message: string; action?: string }> = [];

    // Time-based recommendations
    const today = new Date();
    const startDate = new Date(goal.start_date);
    const targetDate = new Date(goal.target_date);
    const totalDuration = targetDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();
    const percentTimeElapsed = (elapsed / totalDuration) * 100;
    const progressPercentage = goal.progress_percentage || 0;

    if (percentTimeElapsed > 50 && progressPercentage < 30) {
      recommendations.push({
        type: 'adjust_target',
        message: `You're ${Math.round(percentTimeElapsed)}% through the timeline but only ${Math.round(progressPercentage)}% complete. Consider adjusting your target or extending the deadline.`,
        action: 'reduce_target_or_extend_deadline',
      });
    }

    if (percentTimeElapsed > 75 && progressPercentage < 50) {
      recommendations.push({
        type: 'urgent_action',
        message: 'Time is running out! Focus on this goal or consider marking it as abandoned if it\'s no longer relevant.',
        action: 'prioritize_or_abandon',
      });
    }

    // Progress momentum recommendations
    const { data: progressHistory } = await supabase
      .from('goal_progress_history')
      .select('*')
      .eq('goal_id', goalId)
      .order('recorded_at', { ascending: false })
      .limit(5);

    if (progressHistory && progressHistory.length >= 3) {
      const recentProgress = progressHistory.slice(0, 3);
      const progressChanges: number[] = [];
      for (let i = 0; i < recentProgress.length - 1; i++) {
        progressChanges.push(recentProgress[i].progress_value - recentProgress[i + 1].progress_value);
      }
      const avgProgressChange = progressChanges.reduce((sum, val) => sum + val, 0) / progressChanges.length;

      if (avgProgressChange <= 0) {
        recommendations.push({
          type: 'momentum_warning',
          message: 'Your progress has stalled. Consider breaking this goal into smaller milestones.',
          action: 'create_milestones',
        });
      } else if (avgProgressChange > (goal.target / 10)) {
        recommendations.push({
          type: 'excellent_momentum',
          message: 'Great progress! You might achieve this goal ahead of schedule. Consider setting a stretch goal.',
          action: 'increase_target',
        });
      }
    }

    // Priority-based recommendations
    if (goal.priority === 'high' && goal.status === 'not_started') {
      const daysSinceCreation = Math.floor((today.getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceCreation > 7) {
        recommendations.push({
          type: 'start_high_priority',
          message: `This high-priority goal hasn't been started in ${daysSinceCreation} days. Time to take action!`,
          action: 'start_goal',
        });
      }
    }

    return {
      goal_id: goalId,
      goal_title: goal.title,
      current_status: goal.status,
      progress_percentage: progressPercentage,
      time_elapsed_percentage: Math.round(percentTimeElapsed * 10) / 10,
      recommendations,
    };
  }

  // AC5: Celebrate milestone completions
  async addMilestone(userId: string, goalId: string, createMilestoneDto: CreateMilestoneDto) {
    const supabase = this.supabaseService.getClient();

    // Verify goal belongs to user
    const { data: goal } = await supabase
      .from('goals')
      .select('id')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    const { data, error } = await supabase
      .from('goal_milestones')
      .insert({
        goal_id: goalId,
        title: createMilestoneDto.title,
        description: createMilestoneDto.description,
        target_value: createMilestoneDto.target_value,
        target_date: createMilestoneDto.target_date,
        completed: false,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  async completeMilestone(userId: string, goalId: string, milestoneId: string) {
    const supabase = this.supabaseService.getClient();

    // Verify goal belongs to user
    const { data: goal } = await supabase
      .from('goals')
      .select('celebration_message')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    const { data, error } = await supabase
      .from('goal_milestones')
      .update({
        completed: true,
        completed_date: new Date().toISOString(),
      })
      .eq('id', milestoneId)
      .eq('goal_id', goalId)
      .select()
      .single();

    if (error) throw error;

    // Get milestone count for celebration message
    const { data: milestones } = await supabase
      .from('goal_milestones')
      .select('*')
      .eq('goal_id', goalId);

    const completedCount = milestones?.filter(m => m.completed).length || 0;

    return {
      milestone: data,
      celebration: {
        message: goal.celebration_message || `🎉 Milestone achieved! ${completedCount} milestone(s) completed!`,
        completedCount,
        totalMilestones: milestones?.length || 0,
      },
    };
  }

  // AC6: Correlate goal progress with job search outcomes
  async getGoalImpact(userId: string) {
    const supabase = this.supabaseService.getClient();

    // Get all goals with their progress
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    // Get job search outcomes
    const { data: applications } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['applied', 'interviewing', 'offer', 'accepted', 'rejected']);

    const { data: interviews } = await supabase
      .from('interviews')
      .select('*')
      .eq('user_id', userId);

    if (!goals || !applications) {
      return { impact: [], correlations: [] };
    }

    // Analyze correlation between goal activity and outcomes
    const goalsWithImpact = goals.map(goal => {
      const goalStart = new Date(goal.start_date);
      const goalEnd = goal.target_date ? new Date(goal.target_date) : new Date();

      // Applications during goal period
      const relevantApplications = applications?.filter(app => {
        const appDate = new Date(app.applied_date || app.createdAt || app.created_at);
        return appDate >= goalStart && appDate <= goalEnd;
      });

      const relevantInterviews = interviews?.filter(interview => {
        const intDate = new Date(interview.interview_date);
        return intDate >= goalStart && intDate <= goalEnd;
      }) || [];

      // Calculate impact metrics
      const applicationRate = relevantApplications.length;
      const interviewRate = relevantInterviews.length;
      const responseRate = relevantApplications.filter(a => a.status !== 'applied').length;
      const offerRate = relevantApplications.filter(a => a.status === 'offer' || a.status === 'accepted').length;

      return {
        goal_id: goal.id,
        goal_title: goal.title,
        goal_category: goal.category,
        progress_percentage: goal.progress_percentage,
        impact_metrics: {
          applications: applicationRate,
          interviews: interviewRate,
          responses: responseRate,
          offers: offerRate,
          response_rate: applicationRate > 0 ? (responseRate / applicationRate) * 100 : 0,
          interview_rate: applicationRate > 0 ? (interviewRate / applicationRate) * 100 : 0,
          offer_rate: applicationRate > 0 ? (offerRate / applicationRate) * 100 : 0,
        },
      };
    });

    // Identify high-impact goals
    const avgApplications = goalsWithImpact.reduce((sum, g) => sum + g.impact_metrics.applications, 0) / goalsWithImpact.length || 0;
    const avgInterviews = goalsWithImpact.reduce((sum, g) => sum + g.impact_metrics.interviews, 0) / goalsWithImpact.length || 0;

    const correlations = goalsWithImpact
      .filter(g => g.impact_metrics.applications > avgApplications || g.impact_metrics.interviews > avgInterviews)
      .map(g => ({
        goal_title: g.goal_title,
        category: g.goal_category,
        correlation: 'positive',
        insight: `Goals in ${g.goal_category} correlate with ${g.impact_metrics.applications > avgApplications ? 'higher application rates' : 'higher interview rates'}`,
      }));

    return {
      impact: goalsWithImpact,
      correlations,
      summary: {
        avgApplications: Math.round(avgApplications * 10) / 10,
        avgInterviews: Math.round(avgInterviews * 10) / 10,
        highImpactCategories: [...new Set(correlations.map(c => c.category))],
      },
    };
  }

  // AC7: Share goals with mentors or accountability partners
  async shareGoal(userId: string, goalId: string, shareWithEmails: string[]) {
    const supabase = this.supabaseService.getClient();

    const { data: goal } = await supabase
      .from('goals')
      .select('shared_with')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    const currentShares = goal.shared_with || [];
    const updatedShares = [...new Set([...currentShares, ...shareWithEmails])];

    const { data, error } = await supabase
      .from('goals')
      .update({ shared_with: updatedShares })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;

    return {
      goal: data,
      shared_with: updatedShares,
      message: `Goal shared with ${shareWithEmails.length} accountability partner(s)`,
    };
  }

  async getSharedGoals(userEmail: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('goals')
      .select('*, user:user_id(email, full_name)')
      .contains('shared_with', [userEmail]);

    if (error) throw error;

    return data;
  }

  // AC8: Insights on optimal goal-setting practices
  async getGoalSettingInsights(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    if (!goals || goals.length === 0) {
      return {
        insights: [
          {
            type: 'getting_started',
            message: 'Start with 2-3 specific goals to avoid overwhelming yourself.',
            recommendation: 'Focus on one goal per category (job search, skill development, networking)',
          },
        ],
      };
    }

    const insights: Array<{ type: string; message: string; recommendation: string }> = [];

    // Analyze completion patterns
    const completedGoals = goals.filter(g => g.completed);
    const activeGoals = goals.filter(g => g.status === 'in_progress');

    // Optimal number of concurrent goals
    if (activeGoals.length > 5) {
      insights.push({
        type: 'goal_overload',
        message: `You have ${activeGoals.length} active goals. Research shows 3-5 concurrent goals is optimal.`,
        recommendation: 'Consider prioritizing your top 3-5 goals and pausing others',
      });
    }

    // Best performing categories
    const categorySuccess = goals.reduce((acc, goal) => {
      if (!acc[goal.category]) {
        acc[goal.category] = { total: 0, completed: 0 };
      }
      acc[goal.category].total++;
      if (goal.completed) acc[goal.category].completed++;
      return acc;
    }, {});

    const bestCategory = Object.entries(categorySuccess)
      .map(([category, stats]: [string, any]) => ({
        category,
        rate: stats.completed / stats.total,
      }))
      .sort((a, b) => b.rate - a.rate)[0];

    if (bestCategory && bestCategory.rate > 0.7) {
      insights.push({
        type: 'success_pattern',
        message: `You have a ${Math.round(bestCategory.rate * 100)}% completion rate in ${bestCategory.category} goals`,
        recommendation: `Consider setting more goals in ${bestCategory.category} to leverage your strengths`,
      });
    }

    // Optimal goal duration analysis
    const completedGoalsWithDuration = completedGoals.filter(g => g.start_date && g.completed_date);
    if (completedGoalsWithDuration.length >= 3) {
      const durations = completedGoalsWithDuration.map(g => {
        const start = new Date(g.start_date);
        const end = new Date(g.completed_date);
        return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      });
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

      insights.push({
        type: 'optimal_duration',
        message: `Your average goal completion time is ${Math.round(avgDuration)} days`,
        recommendation: avgDuration < 30
          ? 'You complete goals quickly! Consider setting slightly more challenging targets'
          : 'Consider breaking longer goals into smaller 30-day milestones for better momentum',
      });
    }

    // Priority effectiveness
    const highPriorityComplete = goals.filter(g => g.priority === 'high' && g.completed).length;
    const highPriorityTotal = goals.filter(g => g.priority === 'high').length;
    const highPriorityRate = highPriorityTotal > 0 ? highPriorityComplete / highPriorityTotal : 0;

    if (highPriorityRate < 0.5 && highPriorityTotal >= 3) {
      insights.push({
        type: 'priority_alignment',
        message: `Only ${Math.round(highPriorityRate * 100)}% of your high-priority goals are completed`,
        recommendation: 'Review what you mark as high-priority. True priorities should have >70% completion rate',
      });
    }

    return {
      insights,
      statistics: {
        totalGoals: goals.length,
        completionRate: goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0,
        avgGoalDuration: completedGoalsWithDuration.length > 0
          ? Math.round(completedGoalsWithDuration.reduce((sum, g) => {
              const start = new Date(g.start_date);
              const end = new Date(g.completed_date);
              return sum + Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            }, 0) / completedGoalsWithDuration.length)
          : 0,
        activeGoals: activeGoals.length,
        bestCategory: bestCategory?.category,
      },
    };
  }

  // Update goal and track progress
  async updateGoal(userId: string, goalId: string, updateGoalDto: UpdateGoalDto) {
    const supabase = this.supabaseService.getClient();

    const { data: existingGoal } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (!existingGoal) {
      throw new NotFoundException('Goal not found');
    }

    // Calculate progress percentage if progress is updated
    let progressPercentage = existingGoal.progress_percentage;
    if (updateGoalDto.progress !== undefined) {
      const target = updateGoalDto.target || existingGoal.target;
      progressPercentage = Math.min((updateGoalDto.progress / target) * 100, 100);

      // Log progress history
      await supabase.from('goal_progress_history').insert({
        goal_id: goalId,
        progress_value: updateGoalDto.progress,
        notes: 'Progress updated',
      });

      // Auto-complete if target reached
      if (progressPercentage >= 100 && !updateGoalDto.completed) {
        updateGoalDto.completed = true;
        updateGoalDto.status = 'completed';
        updateGoalDto.completed_date = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('goals')
      .update({
        ...updateGoalDto,
        progress_percentage: progressPercentage,
      })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  async deleteGoal(userId: string, goalId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: goal } = await supabase
      .from('goals')
      .select('id')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    // Delete associated milestones and history (cascade should handle this, but being explicit)
    await supabase.from('goal_milestones').delete().eq('goal_id', goalId);
    await supabase.from('goal_progress_history').delete().eq('goal_id', goalId);

    const { error } = await supabase.from('goals').delete().eq('id', goalId);

    if (error) throw error;

    return { message: 'Goal deleted successfully' };
  }
}
