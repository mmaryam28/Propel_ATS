import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateContactDto, UpdateContactDto } from './dto/create-contact.dto';
import { CreateActivityDto, UpdateActivityDto } from './dto/create-activity.dto';
import { CreateEventDto, UpdateEventDto } from './dto/create-event.dto';
import {
  ActivityVolumeMetrics,
  ReferralMetrics,
  RelationshipAnalysis,
  EventROIMetrics,
  ValueExchangeMetrics,
  NetworkingInsights,
  BenchmarkData,
  NetworkingDashboard,
} from './dto/networking-analytics.dto';

@Injectable()
export class NetworkingService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // Contact Management
  async createContact(userId: string, createContactDto: CreateContactDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('network_contacts')
      .insert({
        user_id: userId,
        ...createContactDto,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getContacts(
    userId: string,
    filters?: {
      relationship_strength?: number;
      industry?: string;
      connection_source?: string;
    },
  ) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('network_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('last_interaction_date', { ascending: false, nullsFirst: false });

    if (filters?.relationship_strength) {
      query = query.eq('relationship_strength', filters.relationship_strength);
    }
    if (filters?.industry) {
      query = query.eq('industry', filters.industry);
    }
    if (filters?.connection_source) {
      query = query.eq('connection_source', filters.connection_source);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async updateContact(userId: string, contactId: string, updateContactDto: UpdateContactDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('network_contacts')
      .update({
        ...updateContactDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteContact(userId: string, contactId: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('network_contacts')
      .delete()
      .eq('id', contactId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  // Activity Management
  async createActivity(userId: string, createActivityDto: CreateActivityDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('networking_activities')
      .insert({
        user_id: userId,
        ...createActivityDto,
      })
      .select()
      .single();

    if (error) throw error;

    // Update contact's last interaction date and increment total_interactions
    if (createActivityDto.contact_id) {
      const { data: contact } = await supabase
        .from('network_contacts')
        .select('total_interactions')
        .eq('id', createActivityDto.contact_id)
        .eq('user_id', userId)
        .single();

      if (contact) {
        await supabase
          .from('network_contacts')
          .update({
            last_interaction_date: createActivityDto.activity_date,
            total_interactions: (contact.total_interactions || 0) + 1,
          })
          .eq('id', createActivityDto.contact_id)
          .eq('user_id', userId);
      }
    }

    return data;
  }

  async getActivities(
    userId: string,
    filters?: {
      contact_id?: string;
      activity_type?: string;
      start_date?: string;
      end_date?: string;
    },
  ) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('networking_activities')
      .select('*')
      .eq('user_id', userId)
      .order('activity_date', { ascending: false });

    if (filters?.contact_id) {
      query = query.eq('contact_id', filters.contact_id);
    }
    if (filters?.activity_type) {
      query = query.eq('activity_type', filters.activity_type);
    }
    if (filters?.start_date) {
      query = query.gte('activity_date', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('activity_date', filters.end_date);
    }

    const { data: activities, error } = await query;
    if (error) throw error;

    // Manually fetch contact names for activities that have contact_id
    if (activities && activities.length > 0) {
      const contactIds = activities
        .filter(a => a.contact_id)
        .map(a => a.contact_id);

      if (contactIds.length > 0) {
        const { data: contacts } = await supabase
          .from('network_contacts')
          .select('id, contact_name, company')
          .in('id', contactIds);

        // Map contact names to activities
        const contactMap = new Map(contacts?.map(c => [c.id, c]) || []);
        return activities.map(activity => ({
          ...activity,
          contact_name: activity.contact_id ? contactMap.get(activity.contact_id)?.contact_name : null,
          company: activity.contact_id ? contactMap.get(activity.contact_id)?.company : null,
        }));
      }
    }

    return activities || [];
  }

  // Event Management
  async createEvent(userId: string, createEventDto: CreateEventDto) {
    const supabase = this.supabaseService.getClient();

    // Calculate ROI if data available
    let roi_score = createEventDto.roi_score;
    if (!roi_score && createEventDto.leads_generated !== undefined) {
      const timeValue = (createEventDto.time_invested_hours || 0) * 50;
      const totalCost = (createEventDto.cost || 0) + timeValue;
      const value = (createEventDto.leads_generated || 0) + (createEventDto.opportunities_created || 0) * 2;
      roi_score = totalCost > 0 ? (value / totalCost) * 100 : 0;
    }

    const { data, error } = await supabase
      .from('networking_events')
      .insert({
        user_id: userId,
        ...createEventDto,
        roi_score,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getEvents(userId: string, filters?: { event_type?: string; start_date?: string; end_date?: string }) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('networking_events')
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: false });

    if (filters?.event_type) {
      query = query.eq('event_type', filters.event_type);
    }
    if (filters?.start_date) {
      query = query.gte('event_date', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('event_date', filters.end_date);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // AC1: Track networking activity volume and relationship building progress
  async getActivityVolume(userId: string, timeframe: string = '6months'): Promise<ActivityVolumeMetrics> {
    const supabase = this.supabaseService.getClient();

    const startDate = this.getStartDate(timeframe);

    const { data: activities } = await supabase
      .from('networking_activities')
      .select('*')
      .eq('user_id', userId)
      .gte('activity_date', startDate.toISOString());

    if (!activities || activities.length === 0) {
      return {
        total_activities: 0,
        activities_by_type: {},
        monthly_trend: [],
        avg_per_week: 0,
        most_active_period: 'No data',
      };
    }

    // Group by type
    const activities_by_type = activities.reduce((acc, activity) => {
      acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Monthly trend
    const monthlyData = activities.reduce((acc, activity) => {
      const month = new Date(activity.activity_date).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const monthly_trend = Object.entries(monthlyData)
      .map(([month, count]) => ({ month, count: count as number }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Average per week
    const weeksInPeriod = Math.ceil((new Date().getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const avg_per_week = activities.length / weeksInPeriod;

    // Most active period
    const most_active_month = monthly_trend.length > 0 ? monthly_trend.reduce((max, curr) => (curr.count > max.count ? curr : max), monthly_trend[0]) : null;
    const most_active_period = most_active_month ? `${most_active_month.month} (${most_active_month.count} activities)` : 'No data';

    return {
      total_activities: activities.length,
      activities_by_type,
      monthly_trend,
      avg_per_week: Math.round(avg_per_week * 10) / 10,
      most_active_period,
    };
  }

  // AC2: Monitor referral generation and job opportunity sourcing through network
  async getReferralMetrics(userId: string): Promise<ReferralMetrics> {
    const supabase = this.supabaseService.getClient();

    const { data: contacts } = await supabase.from('network_contacts').select('*').eq('user_id', userId);

    if (!contacts || contacts.length === 0) {
      return {
        total_referrals_given: 0,
        total_referrals_received: 0,
        job_opportunities_sourced: 0,
        conversion_rate: 0,
        top_referral_sources: [],
      };
    }

    const total_referrals_given = contacts.reduce((sum, c) => sum + (c.referrals_given || 0), 0);
    const total_referrals_received = contacts.reduce((sum, c) => sum + (c.referrals_received || 0), 0);
    const job_opportunities_sourced = contacts.reduce((sum, c) => sum + (c.job_opportunities_sourced || 0), 0);

    const conversion_rate =
      total_referrals_received > 0 ? (job_opportunities_sourced / total_referrals_received) * 100 : 0;

    const top_referral_sources = contacts
      .filter((c) => c.referrals_received > 0)
      .map((c) => ({
        contact_name: c.contact_name,
        referrals_count: c.referrals_received,
      }))
      .sort((a, b) => b.referrals_count - a.referrals_count)
      .slice(0, 5);

    return {
      total_referrals_given,
      total_referrals_received,
      job_opportunities_sourced,
      conversion_rate: Math.round(conversion_rate * 10) / 10,
      top_referral_sources,
    };
  }

  // AC3: Analyze relationship strength development and engagement quality
  async getRelationshipAnalysis(userId: string): Promise<RelationshipAnalysis> {
    const supabase = this.supabaseService.getClient();

    const { data: contacts } = await supabase.from('network_contacts').select('*').eq('user_id', userId);

    if (!contacts || contacts.length === 0) {
      return {
        total_contacts: 0,
        contacts_by_strength: {},
        engagement_quality_score: 0,
        relationship_growth_trend: [],
        strong_relationships: 0,
        dormant_contacts: [],
      };
    }

    // Group by strength
    const contacts_by_strength = contacts.reduce((acc, c) => {
      const strength = c.relationship_strength || 1;
      acc[strength] = (acc[strength] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Engagement quality (avg interactions per contact)
    const totalInteractions = contacts.reduce((sum, c) => sum + (c.total_interactions || 0), 0);
    const engagement_quality_score = contacts.length > 0 ? totalInteractions / contacts.length : 0;

    // Growth trend (new contacts by month)
    const monthlyGrowth = contacts.reduce((acc, c) => {
      const month = new Date(c.first_contact_date).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const relationship_growth_trend = Object.entries(monthlyGrowth)
      .map(([month, new_contacts]) => ({ month, new_contacts: new_contacts as number }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    const strong_relationships = contacts.filter((c) => c.relationship_strength >= 4).length;

    // Dormant contacts (no interaction in 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const dormant_contacts = contacts
      .filter((c) => {
        if (!c.last_interaction_date) return true;
        return new Date(c.last_interaction_date) < ninetyDaysAgo;
      })
      .map((c) => ({
        contact_name: c.contact_name,
        days_since_last_contact: c.last_interaction_date
          ? Math.floor((new Date().getTime() - new Date(c.last_interaction_date).getTime()) / (24 * 60 * 60 * 1000))
          : 999,
      }))
      .sort((a, b) => b.days_since_last_contact - a.days_since_last_contact)
      .slice(0, 10);

    return {
      total_contacts: contacts.length,
      contacts_by_strength,
      engagement_quality_score: Math.round(engagement_quality_score * 10) / 10,
      relationship_growth_trend,
      strong_relationships,
      dormant_contacts,
    };
  }

  // AC4: Measure networking event ROI and relationship conversion rates
  async getEventROI(userId: string): Promise<EventROIMetrics> {
    const supabase = this.supabaseService.getClient();

    const { data: events } = await supabase.from('networking_events').select('*').eq('user_id', userId);

    if (!events || events.length === 0) {
      return {
        events_attended: 0,
        total_cost: 0,
        total_leads: 0,
        average_roi: 0,
        best_event_types: [],
        recent_events: [],
      };
    }

    const total_cost = events.reduce((sum, e) => sum + (e.cost || 0), 0);
    const total_leads = events.reduce((sum, e) => sum + (e.leads_generated || 0), 0);
    const average_roi = events.reduce((sum, e) => sum + (e.roi_score || 0), 0) / events.length;

    // Best event types
    const typeData = events.reduce((acc, e) => {
      if (!e.event_type) return acc;
      if (!acc[e.event_type]) {
        acc[e.event_type] = { total_roi: 0, total_leads: 0, count: 0 };
      }
      acc[e.event_type].total_roi += e.roi_score || 0;
      acc[e.event_type].total_leads += e.leads_generated || 0;
      acc[e.event_type].count += 1;
      return acc;
    }, {} as { [key: string]: { total_roi: number; total_leads: number; count: number } });

    const best_event_types = Object.entries(typeData)
      .map(([event_type, data]) => {
        const typedData = data as { total_roi: number; total_leads: number; count: number };
        return {
          event_type,
          avg_roi: Math.round((typedData.total_roi / typedData.count) * 10) / 10,
          avg_leads: Math.round((typedData.total_leads / typedData.count) * 10) / 10,
        };
      })
      .sort((a, b) => b.avg_roi - a.avg_roi)
      .slice(0, 5);

    const recent_events = events
      .slice(0, 5)
      .map((e) => ({
        event_name: e.event_name,
        event_date: e.event_date,
        roi_score: e.roi_score || 0,
        contacts_made: e.contacts_made || 0,
      }));

    return {
      events_attended: events.length,
      total_cost: Math.round(total_cost * 100) / 100,
      total_leads,
      average_roi: Math.round(average_roi * 10) / 10,
      best_event_types,
      recent_events,
    };
  }

  // AC5: Track mutual value exchange and relationship reciprocity
  async getValueExchangeMetrics(userId: string): Promise<ValueExchangeMetrics> {
    const supabase = this.supabaseService.getClient();

    const { data: contacts } = await supabase.from('network_contacts').select('*').eq('user_id', userId);

    if (!contacts || contacts.length === 0) {
      return {
        total_value_given: 0,
        total_value_received: 0,
        value_balance: 0,
        reciprocity_index: 100,
        giving_score: 0,
        receiving_score: 0,
        top_mutual_contacts: [],
      };
    }

    const total_value_given = contacts.reduce((sum, c) => sum + (c.value_provided_score || 0), 0);
    const total_value_received = contacts.reduce((sum, c) => sum + (c.value_received_score || 0), 0);

    const value_balance = total_value_given - total_value_received;
    const reciprocity_index = total_value_received > 0 ? (total_value_given / total_value_received) * 100 : 100;

    const giving_score = contacts.length > 0 ? total_value_given / contacts.length : 0;
    const receiving_score = contacts.length > 0 ? total_value_received / contacts.length : 0;

    const top_mutual_contacts = contacts
      .map((c) => ({
        contact_name: c.contact_name,
        company: c.company,
        value_provided_score: c.value_provided_score || 0,
        value_received_score: c.value_received_score || 0,
        mutual_value_score: (c.value_provided_score || 0) + (c.value_received_score || 0),
      }))
      .filter((c) => c.mutual_value_score > 0)
      .sort((a, b) => b.mutual_value_score - a.mutual_value_score)
      .slice(0, 10);

    return {
      total_value_given,
      total_value_received,
      value_balance,
      reciprocity_index: Math.round(reciprocity_index),
      giving_score: Math.round(giving_score * 10) / 10,
      receiving_score: Math.round(receiving_score * 10) / 10,
      top_mutual_contacts,
    };
  }

  // AC7: Generate insights on most effective networking strategies
  async getNetworkingInsights(userId: string): Promise<NetworkingInsights> {
    const supabase = this.supabaseService.getClient();

    const { data: activities } = await supabase.from('networking_activities').select('*').eq('user_id', userId);

    const { data: contacts } = await supabase.from('network_contacts').select('*').eq('user_id', userId);

    if (!activities || !contacts) {
      return {
        best_performing_strategies: [],
        optimization_recommendations: ['Start tracking your networking activities to get personalized insights'],
        time_allocation_suggestions: {},
        contact_quality_vs_quantity_score: 0,
      };
    }

    // Analyze which activity types lead to best outcomes
    const strategyAnalysis = activities.reduce((acc, a) => {
      if (!acc[a.activity_type]) {
        acc[a.activity_type] = { positive: 0, total: 0 };
      }
      acc[a.activity_type].total += 1;
      if (a.outcome === 'positive') acc[a.activity_type].positive += 1;
      return acc;
    }, {} as { [key: string]: { positive: number; total: number } });

    const best_performing_strategies = Object.entries(strategyAnalysis)
      .map(([strategy, data]) => {
        const typedData = data as { positive: number; total: number };
        const rate = typedData.positive / typedData.total;
        return {
          strategy,
          success_rate: rate * 100,
          recommendation: rate > 0.7 ? 'Increase frequency' : rate > 0.4 ? 'Maintain current level' : 'Optimize approach',
        };
      })
      .sort((a, b) => b.success_rate - a.success_rate)
      .slice(0, 5);

    // Generate recommendations
    const optimization_recommendations: string[] = [];
    const avgStrength = contacts.reduce((sum, c) => sum + (c.relationship_strength || 0), 0) / contacts.length;

    if (avgStrength < 3) {
      optimization_recommendations.push('Focus on deepening existing relationships before expanding network');
    }

    const dormantCount = contacts.filter((c) => {
      if (!c.last_interaction_date) return true;
      const daysSince = (new Date().getTime() - new Date(c.last_interaction_date).getTime()) / (24 * 60 * 60 * 1000);
      return daysSince > 90;
    }).length;

    if (dormantCount > contacts.length * 0.3) {
      optimization_recommendations.push(`Re-engage with ${dormantCount} dormant contacts through quick check-ins`);
    }

    if (activities.length / contacts.length < 3) {
      optimization_recommendations.push('Increase interaction frequency with key contacts');
    }

    if (optimization_recommendations.length === 0) {
      optimization_recommendations.push('Great work! Your networking strategy is well-balanced');
    }

    // Time allocation suggestions
    const time_allocation_suggestions = activities.reduce((acc, a) => {
      acc[a.activity_type] = (acc[a.activity_type] || 0) + (a.duration_minutes || 30);
      return acc;
    }, {} as { [key: string]: number });

    // Quality vs quantity score (prefer strong relationships over many weak ones)
    const strongContacts = contacts.filter((c) => c.relationship_strength >= 4).length;
    const contact_quality_vs_quantity_score = contacts.length > 0 ? (strongContacts / contacts.length) * 100 : 0;

    return {
      best_performing_strategies,
      optimization_recommendations,
      time_allocation_suggestions,
      contact_quality_vs_quantity_score: Math.round(contact_quality_vs_quantity_score),
    };
  }

  // AC8: Include industry-specific networking benchmarks and best practices
  async getIndustryBenchmarks(userId: string, industry?: string): Promise<BenchmarkData> {
    const supabase = this.supabaseService.getClient();

    const { data: contacts } = await supabase.from('network_contacts').select('*').eq('user_id', userId);

    const { data: activities } = await supabase
      .from('networking_activities')
      .select('*')
      .eq('user_id', userId)
      .gte('activity_date', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString());

    // Use industry from contacts if not provided
    const user_industry = industry || contacts?.[0]?.industry || 'Technology';

    // Industry benchmarks (these would ideally come from aggregated data)
    const industryBenchmarks: { [key: string]: any } = {
      Technology: { avg_network_size: 150, avg_activities_per_month: 20, avg_referral_rate: 15 },
      Finance: { avg_network_size: 120, avg_activities_per_month: 18, avg_referral_rate: 12 },
      Healthcare: { avg_network_size: 100, avg_activities_per_month: 15, avg_referral_rate: 10 },
      Marketing: { avg_network_size: 180, avg_activities_per_month: 25, avg_referral_rate: 18 },
      Engineering: { avg_network_size: 130, avg_activities_per_month: 16, avg_referral_rate: 13 },
      Default: { avg_network_size: 140, avg_activities_per_month: 18, avg_referral_rate: 14 },
    };

    const benchmark = industryBenchmarks[user_industry] || industryBenchmarks.Default;

    const user_network_size = contacts?.length || 0;
    const user_activities_per_month = activities?.length || 0;
    const total_referrals = contacts?.reduce((sum, c) => sum + (c.referrals_received || 0), 0) || 0;
    const user_referral_rate = user_network_size > 0 ? (total_referrals / user_network_size) * 100 : 0;

    const best_practices = [
      'Follow up within 24 hours after meeting new contacts',
      'Aim for quality interactions over quantity',
      'Provide value before asking for favors',
      'Attend 2-3 industry events per month',
      'Schedule monthly check-ins with key contacts',
      'Track all networking activities for better ROI analysis',
    ];

    const industry_insights = [
      `${user_industry} professionals average ${benchmark.avg_network_size} connections`,
      `Top performers maintain ${benchmark.avg_activities_per_month} networking touchpoints monthly`,
      'Referrals account for 40% of successful job placements',
      'Strong relationships (4-5 rating) are 5x more likely to provide opportunities',
    ];

    return {
      user_industry,
      avg_network_size: benchmark.avg_network_size,
      user_network_size,
      avg_activities_per_month: benchmark.avg_activities_per_month,
      user_activities_per_month,
      avg_referral_rate: benchmark.avg_referral_rate,
      user_referral_rate: Math.round(user_referral_rate),
      best_practices,
      industry_insights,
    };
  }

  // Get complete dashboard
  async getDashboard(userId: string, industry?: string): Promise<NetworkingDashboard> {
    const [activity_volume, referral_metrics, relationship_analysis, event_roi, value_exchange, insights, benchmarks] =
      await Promise.all([
        this.getActivityVolume(userId),
        this.getReferralMetrics(userId),
        this.getRelationshipAnalysis(userId),
        this.getEventROI(userId),
        this.getValueExchangeMetrics(userId),
        this.getNetworkingInsights(userId),
        this.getIndustryBenchmarks(userId, industry),
      ]);

    return {
      activity_volume,
      referral_metrics,
      relationship_analysis,
      event_roi,
      value_exchange,
      insights,
      benchmarks,
    };
  }

  // Helper method
  private getStartDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case '1month':
        return new Date(now.setMonth(now.getMonth() - 1));
      case '3months':
        return new Date(now.setMonth(now.getMonth() - 3));
      case '6months':
        return new Date(now.setMonth(now.getMonth() - 6));
      case '1year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(now.setMonth(now.getMonth() - 6));
    }
  }
}
