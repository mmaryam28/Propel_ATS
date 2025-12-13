import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface ScheduleRequest {
  applicationId: number;
  scheduledSubmitTime: Date;
  sendReminder?: boolean;
  reminderMinutesBefore?: number;
  schedulingReason?: string;
}

export interface ScheduledSubmission {
  id: string;
  applicationId: number;
  scheduledSubmitTime: Date;
  status: string;
  reminderSentAt?: Date;
}

@Injectable()
export class SchedulingService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Schedule an application submission for optimal timing
   */
  async scheduleSubmission(userId: string, data: ScheduleRequest): Promise<ScheduledSubmission> {
    const supabase = this.supabaseService.getClient();

    const { data: schedule, error } = await supabase
      .from('application_timing_schedules')
      .insert({
        user_id: userId,
        application_id: data.applicationId,
        scheduled_submit_time: data.scheduledSubmitTime.toISOString(),
        status: 'scheduled',
        send_reminder: data.sendReminder !== false, // Default to true
        reminder_minutes_before: data.reminderMinutesBefore || 30,
        scheduling_reason: data.schedulingReason,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: schedule.id,
      applicationId: schedule.application_id,
      scheduledSubmitTime: new Date(schedule.scheduled_submit_time),
      status: schedule.status,
    };
  }

  /**
   * Get all scheduled submissions for a user
   */
  async getUserScheduledSubmissions(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('application_timing_schedules')
      .select(`
        id,
        application_id,
        scheduled_submit_time,
        status,
        send_reminder,
        reminder_minutes_before,
        scheduling_reason
      `)
      .eq('user_id', userId)
      .order('scheduled_submit_time', { ascending: true });

    if (error) throw error;

    return (data || []).map(schedule => ({
      id: schedule.id,
      applicationId: schedule.application_id,
      scheduledSubmitTime: new Date(schedule.scheduled_submit_time),
      status: schedule.status,
      sendReminder: schedule.send_reminder,
      reminderMinutesBefore: schedule.reminder_minutes_before,
      schedulingReason: schedule.scheduling_reason,
    }));
  }

  /**
   * Get upcoming scheduled submissions (next 7 days)
   */
  async getUpcomingSubmissions(userId: string) {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('application_timing_schedules')
      .select(`
        id,
        application_id,
        scheduled_submit_time,
        status
      `)
      .eq('user_id', userId)
      .eq('status', 'scheduled')
      .gte('scheduled_submit_time', now.toISOString())
      .lte('scheduled_submit_time', sevenDaysFromNow.toISOString())
      .order('scheduled_submit_time', { ascending: true });

    if (error) throw error;

    return (data || []).map(schedule => ({
      id: schedule.id,
      applicationId: schedule.application_id,
      scheduledSubmitTime: new Date(schedule.scheduled_submit_time),
      status: schedule.status,
    }));
  }

  /**
   * Reschedule a previously scheduled submission
   */
  async rescheduleSubmission(
    userId: string,
    scheduleId: string,
    newSubmitTime: Date,
  ): Promise<ScheduledSubmission> {
    const supabase = this.supabaseService.getClient();

    // Get the current schedule
    const { data: currentSchedule, error: fetchError } = await supabase
      .from('application_timing_schedules')
      .select('scheduled_submit_time')
      .eq('id', scheduleId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Update with new time
    const { data: updated, error } = await supabase
      .from('application_timing_schedules')
      .update({
        scheduled_submit_time: newSubmitTime.toISOString(),
        previous_scheduled_time: currentSchedule.scheduled_submit_time,
        is_rescheduled: true,
      })
      .eq('id', scheduleId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: updated.id,
      applicationId: updated.application_id,
      scheduledSubmitTime: new Date(updated.scheduled_submit_time),
      status: updated.status,
    };
  }

  /**
   * Cancel a scheduled submission
   */
  async cancelSchedule(userId: string, scheduleId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('application_timing_schedules')
      .update({ status: 'cancelled' })
      .eq('id', scheduleId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      status: data.status,
      message: 'Submission cancelled successfully',
    };
  }

  /**
   * Process scheduled submissions (should be called by a cron job)
   * This would trigger the actual submission or send reminders
   */
  async processScheduledSubmissions() {
    const supabase = this.supabaseService.getClient();
    const now = new Date();

    // Get submissions that are due
    const { data: dueSubmissions, error } = await supabase
      .from('application_timing_schedules')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_submit_time', now.toISOString());

    if (error) throw error;

    const results: any[] = [];

    for (const submission of dueSubmissions || []) {
      // In a real scenario, this would trigger the actual application submission
      // For now, we'll just update the status and record the submission time
      const { data: updated, error: updateError } = await supabase
        .from('application_timing_schedules')
        .update({
          status: 'submitted',
          actual_submit_time: now.toISOString(),
        })
        .eq('id', submission.id)
        .select()
        .single();

      if (updateError) {
        results.push({ id: submission.id, status: 'error', error: updateError });
      } else {
        results.push({ id: submission.id, status: 'submitted', timestamp: now });
      }
    }

    return {
      processed: results.length,
      results,
    };
  }

  /**
   * Send reminders for upcoming scheduled submissions
   * This would be called periodically by a cron job
   */
  async sendReminders() {
    const supabase = this.supabaseService.getClient();
    const now = new Date();

    // Get submissions that need reminders
    const { data: scheduledSubmissions, error } = await supabase
      .from('application_timing_schedules')
      .select('*')
      .eq('status', 'scheduled')
      .eq('send_reminder', true)
      .is('reminder_sent_at', null);

    if (error) throw error;

    const remindersSent: any[] = [];

    for (const submission of scheduledSubmissions || []) {
      const scheduleTime = new Date(submission.scheduled_submit_time);
      const minutesUntilSubmission = (scheduleTime.getTime() - now.getTime()) / (1000 * 60);

      // Send reminder if within the reminder window
      if (minutesUntilSubmission <= submission.reminder_minutes_before && minutesUntilSubmission > 0) {
        // In a real implementation, this would send an actual notification/email
        const { error: updateError } = await supabase
          .from('application_timing_schedules')
          .update({ reminder_sent_at: now.toISOString() })
          .eq('id', submission.id);

        if (!updateError) {
          remindersSent.push({
            scheduleId: submission.id,
            applicationId: submission.application_id,
            minutesUntilSubmission: Math.round(minutesUntilSubmission),
            reminderSent: true,
          });
        }
      }
    }

    return {
      remindersSent: remindersSent.length,
      details: remindersSent,
    };
  }

  /**
   * Get calendar view of scheduled submissions
   */
  async getCalendarView(userId: string, month: number, year: number) {
    const supabase = this.supabaseService.getClient();

    // Get all submissions for the month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const { data: submissions, error } = await supabase
      .from('application_timing_schedules')
      .select(`
        id,
        application_id,
        scheduled_submit_time,
        status
      `)
      .eq('user_id', userId)
      .gte('scheduled_submit_time', startDate.toISOString())
      .lte('scheduled_submit_time', endDate.toISOString())
      .order('scheduled_submit_time', { ascending: true });

    if (error) throw error;

    // Group by day
    const calendarData: any = {};

    (submissions || []).forEach(submission => {
      const submissionDate = new Date(submission.scheduled_submit_time);
      const day = submissionDate.getDate();

      if (!calendarData[day]) {
        calendarData[day] = [];
      }

      calendarData[day].push({
        id: submission.id,
        applicationId: submission.application_id,
        time: submissionDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: submission.status,
      });
    });

    return {
      month,
      year,
      monthName: new Date(year, month).toLocaleString('en-US', { month: 'long' }),
      calendar: calendarData,
      summary: {
        totalScheduled: submissions?.length || 0,
        daysWithSubmissions: Object.keys(calendarData).length,
      },
    };
  }

  /**
   * Get statistics on scheduled submissions
   */
  async getSchedulingStatistics(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: allSchedules, error } = await supabase
      .from('application_timing_schedules')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const schedules = allSchedules || [];

    const now = new Date();
    const scheduled = schedules.filter(s => s.status === 'scheduled');
    const submitted = schedules.filter(s => s.status === 'submitted');
    const upcoming = scheduled.filter(s => new Date(s.scheduled_submit_time) > now);
    const overdue = scheduled.filter(s => new Date(s.scheduled_submit_time) <= now);

    return {
      totalScheduled: scheduled.length,
      totalSubmitted: submitted.length,
      upcoming: upcoming.length,
      overdue: overdue.length,
      cancelled: schedules.filter(s => s.status === 'cancelled').length,
      conversionRate: submitted.length > 0 ? (submitted.length / (scheduled.length + submitted.length)) * 100 : 0,
    };
  }
}
