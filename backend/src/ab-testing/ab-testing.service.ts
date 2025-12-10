import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AbTestingService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // ==================== Experiments Management ====================

  /**
   * UC-120 AC1: Create a new A/B test experiment
   */
  async createExperiment(userId: string, data: {
    experiment_name: string;
    material_type: 'resume' | 'cover_letter' | 'both';
    minimum_sample_size?: number;
    notes?: string;
  }) {
    const supabase = this.supabaseService.getClient();

    const { data: experiment, error } = await supabase
      .from('ab_test_experiments')
      .insert({
        user_id: userId,
        experiment_name: data.experiment_name,
        material_type: data.material_type,
        minimum_sample_size: data.minimum_sample_size || 10,
        notes: data.notes,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return experiment;
  }

  /**
   * Get all experiments for a user
   */
  async getExperiments(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('ab_test_experiments')
      .select(`
        *,
        variants:ab_test_variants(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get single experiment with full details
   */
  async getExperiment(userId: string, experimentId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('ab_test_experiments')
      .select(`
        *,
        variants:ab_test_variants(*),
        applications:ab_test_applications(*),
        results:ab_test_results(*)
      `)
      .eq('id', experimentId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update experiment status
   */
  async updateExperimentStatus(userId: string, experimentId: string, status: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('ab_test_experiments')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'completed' ? { end_date: new Date().toISOString() } : {})
      })
      .eq('id', experimentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== Variants Management ====================

  /**
   * UC-120 AC1: Add a variant to an experiment
   */
  async addVariant(userId: string, experimentId: string, data: {
    variant_name: string;
    resume_version_id?: string;
    cover_letter_version_id?: string;
    description?: string;
    format_type?: string;
    length_pages?: number;
    word_count?: number;
    design_style?: string;
    has_photo?: boolean;
    has_color?: boolean;
  }) {
    const supabase = this.supabaseService.getClient();

    // Verify experiment belongs to user
    const { data: experiment } = await supabase
      .from('ab_test_experiments')
      .select('id')
      .eq('id', experimentId)
      .eq('user_id', userId)
      .single();

    if (!experiment) {
      throw new Error('Experiment not found or access denied');
    }

    const { data: variant, error } = await supabase
      .from('ab_test_variants')
      .insert({
        experiment_id: experimentId,
        variant_name: data.variant_name,
        resume_version_id: data.resume_version_id,
        cover_letter_version_id: data.cover_letter_version_id,
        description: data.description,
        format_type: data.format_type,
        length_pages: data.length_pages,
        word_count: data.word_count,
        design_style: data.design_style,
        has_photo: data.has_photo || false,
        has_color: data.has_color || false,
      })
      .select()
      .single();

    if (error) throw error;
    return variant;
  }

  /**
   * Get variants for an experiment
   */
  async getVariants(experimentId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('ab_test_variants')
      .select('*')
      .eq('experiment_id', experimentId);

    if (error) throw error;
    return data || [];
  }

  /**
   * UC-120 AC8: Archive a variant
   */
  async archiveVariant(userId: string, variantId: string) {
    const supabase = this.supabaseService.getClient();

    // Verify ownership through experiment
    const { data: variant } = await supabase
      .from('ab_test_variants')
      .select('experiment_id')
      .eq('id', variantId)
      .single();

    if (!variant) throw new Error('Variant not found');

    const { data: experiment } = await supabase
      .from('ab_test_experiments')
      .select('id')
      .eq('id', variant.experiment_id)
      .eq('user_id', userId)
      .single();

    if (!experiment) throw new Error('Access denied');

    // Delete variant (cascade will handle related records)
    const { error } = await supabase
      .from('ab_test_variants')
      .delete()
      .eq('id', variantId);

    if (error) throw error;
    return { success: true };
  }

  // ==================== Application Tracking ====================

  /**
   * UC-120 AC2: Randomly assign a variant to a job application
   */
  async assignVariantToJob(userId: string, experimentId: string, jobId: number, jobDetails?: {
    industry?: string;
    level?: string;
    company_size?: string;
  }) {
    const supabase = this.supabaseService.getClient();

    // Get all active variants for this experiment
    const variants = await this.getVariants(experimentId);
    
    if (variants.length === 0) {
      throw new Error('No variants available for this experiment');
    }

    // Random assignment
    const randomIndex = Math.floor(Math.random() * variants.length);
    const selectedVariant = variants[randomIndex];

    // Record the assignment
    const { data, error } = await supabase
      .from('ab_test_applications')
      .insert({
        experiment_id: experimentId,
        variant_id: selectedVariant.id,
        job_id: jobId,
        user_id: userId,
        job_industry: jobDetails?.industry,
        job_level: jobDetails?.level,
        company_size: jobDetails?.company_size,
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, variant: selectedVariant };
  }

  /**
   * UC-120 AC3: Track response for an application
   */
  async trackResponse(userId: string, jobId: number, responseData: {
    response_type: 'interview_invite' | 'rejection' | 'phone_screen' | 'no_response';
    response_received_at?: Date;
    reached_interview?: boolean;
    interview_date?: Date;
    reached_offer?: boolean;
    offer_date?: Date;
  }) {
    const supabase = this.supabaseService.getClient();

    // Find the test application record
    const { data: testApp } = await supabase
      .from('ab_test_applications')
      .select('*')
      .eq('job_id', jobId)
      .eq('user_id', userId)
      .single();

    if (!testApp) {
      return null; // Not part of an A/B test
    }

    // Calculate time to response
    let timeToResponseHours: number | null = null;
    if (responseData.response_received_at) {
      const appliedAt = new Date(testApp.applied_at);
      const respondedAt = new Date(responseData.response_received_at);
      timeToResponseHours = Math.round((respondedAt.getTime() - appliedAt.getTime()) / (1000 * 60 * 60));
    }

    // Update the test application
    const { data, error } = await supabase
      .from('ab_test_applications')
      .update({
        response_received: responseData.response_type !== 'no_response',
        response_type: responseData.response_type,
        response_received_at: responseData.response_received_at,
        time_to_response_hours: timeToResponseHours,
        reached_interview: responseData.reached_interview || false,
        interview_date: responseData.interview_date,
        reached_offer: responseData.reached_offer || false,
        offer_date: responseData.offer_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', testApp.id)
      .select()
      .single();

    if (error) throw error;

    // Recalculate results for this experiment
    await this.calculateResults(testApp.experiment_id);

    return data;
  }

  // ==================== Results & Analytics ====================

  /**
   * UC-120 AC4 & AC5: Calculate results and statistical significance
   */
  async calculateResults(experimentId: string) {
    const supabase = this.supabaseService.getClient();

    // Get all variants
    const variants = await this.getVariants(experimentId);

    for (const variant of variants) {
      // Get all applications for this variant
      const { data: applications } = await supabase
        .from('ab_test_applications')
        .select('*')
        .eq('variant_id', variant.id);

      if (!applications || applications.length === 0) {
        continue;
      }

      const totalApps = applications.length;
      const totalResponses = applications.filter(a => a.response_received).length;
      const totalInterviews = applications.filter(a => a.reached_interview).length;
      const totalOffers = applications.filter(a => a.reached_offer).length;

      const responseRate = totalApps > 0 ? (totalResponses / totalApps) * 100 : 0;
      const interviewRate = totalApps > 0 ? (totalInterviews / totalApps) * 100 : 0;
      const offerRate = totalApps > 0 ? (totalOffers / totalApps) * 100 : 0;

      // Calculate average time to response
      const responseTimes = applications
        .filter(a => a.time_to_response_hours != null)
        .map(a => a.time_to_response_hours);
      
      const avgTimeToResponse = responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : null;

      // Statistical significance (simplified chi-square test)
      const { isSignificant, pValue } = this.calculateSignificance(
        totalApps,
        totalResponses,
        variants.length
      );

      // Upsert results
      const { error } = await supabase
        .from('ab_test_results')
        .upsert({
          experiment_id: experimentId,
          variant_id: variant.id,
          total_applications: totalApps,
          total_responses: totalResponses,
          response_rate: Math.round(responseRate * 100) / 100,
          avg_time_to_response_hours: avgTimeToResponse ? Math.round(avgTimeToResponse * 100) / 100 : null,
          total_interviews: totalInterviews,
          interview_conversion_rate: Math.round(interviewRate * 100) / 100,
          total_offers: totalOffers,
          offer_rate: Math.round(offerRate * 100) / 100,
          is_statistically_significant: isSignificant,
          p_value: pValue,
          confidence_level: isSignificant ? 95 : null,
          last_calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'experiment_id,variant_id'
        });

      if (error) throw error;
    }
  }

  /**
   * Simplified statistical significance calculation
   * UC-120 AC4: Calculate if results are statistically significant (p < 0.05)
   */
  private calculateSignificance(sampleSize: number, successes: number, numVariants: number) {
    // Minimum sample size check
    if (sampleSize < 10) {
      return { isSignificant: false, pValue: 1.0 };
    }

    // Simplified z-test for proportion
    // For a proper implementation, use a library like jStat or simple-statistics
    const p = successes / sampleSize;
    const expectedP = 0.5; // null hypothesis: 50% response rate
    const se = Math.sqrt((expectedP * (1 - expectedP)) / sampleSize);
    const z = (p - expectedP) / se;
    
    // Approximate p-value from z-score
    const pValue = this.normalCDF(-Math.abs(z)) * 2;
    
    return {
      isSignificant: pValue < 0.05 && sampleSize >= 10,
      pValue: Math.round(pValue * 10000) / 10000,
    };
  }

  // Standard normal CDF approximation
  private normalCDF(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp((-z * z) / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }

  /**
   * UC-120 AC5: Get experiment dashboard with comparison metrics
   */
  async getExperimentDashboard(userId: string, experimentId: string) {
    const supabase = this.supabaseService.getClient();

    // Get experiment details
    const experiment = await this.getExperiment(userId, experimentId);

    // Get results for all variants
    const { data: results } = await supabase
      .from('ab_test_results')
      .select(`
        *,
        variant:ab_test_variants(*)
      `)
      .eq('experiment_id', experimentId)
      .order('response_rate', { ascending: false });

    // Get all applications for detailed analysis
    const { data: applications } = await supabase
      .from('ab_test_applications')
      .select('*')
      .eq('experiment_id', experimentId);

    // UC-120 AC6: Identify winning version
    const winningVariant = results && results.length > 0
      ? results.reduce((best, current) => {
          // Winner based on: response rate > interview rate > offer rate
          if (current.response_rate > best.response_rate) return current;
          if (current.response_rate === best.response_rate && 
              current.interview_conversion_rate > best.interview_conversion_rate) return current;
          return best;
        }, results[0])
      : null;

    // UC-120 AC7: Insights on what drives success
    const insights = this.generateInsights(results || [], applications || []);

    return {
      experiment,
      results: results || [],
      applications: applications || [],
      winningVariant,
      insights,
      summary: {
        total_applications: applications?.length || 0,
        total_responses: applications?.filter(a => a.response_received).length || 0,
        overall_response_rate: applications && applications.length > 0
          ? (applications.filter(a => a.response_received).length / applications.length) * 100
          : 0,
      },
    };
  }

  /**
   * UC-120 AC7: Generate insights from test results
   */
  private generateInsights(results: any[], applications: any[]) {
    const insights: string[] = [];

    if (results.length < 2) {
      insights.push('Add at least 2 variants to start comparing performance.');
      return insights;
    }

    // Find best performers by metric
    const bestResponseRate = results.reduce((max, r) => r.response_rate > max.response_rate ? r : max, results[0]);
    const bestInterviewRate = results.reduce((max, r) => r.interview_conversion_rate > max.interview_conversion_rate ? r : max, results[0]);
    
    insights.push(`"${bestResponseRate.variant.variant_name}" has the highest response rate at ${bestResponseRate.response_rate}%.`);
    
    if (bestInterviewRate.interview_conversion_rate > 0) {
      insights.push(`"${bestInterviewRate.variant.variant_name}" converts best to interviews at ${bestInterviewRate.interview_conversion_rate}%.`);
    }

    // Time to response insights
    const fastestResponse = results
      .filter(r => r.avg_time_to_response_hours != null)
      .reduce((min, r) => r.avg_time_to_response_hours < min.avg_time_to_response_hours ? r : min, results[0]);
    
    if (fastestResponse && fastestResponse.avg_time_to_response_hours) {
      insights.push(`"${fastestResponse.variant.variant_name}" gets responses ${Math.round(fastestResponse.avg_time_to_response_hours / 24)} days faster on average.`);
    }

    // Format/style insights
    const variantsWithFormat = results.filter(r => r.variant.format_type);
    if (variantsWithFormat.length > 1) {
      const formatPerformance = variantsWithFormat.reduce((acc, r) => {
        const format = r.variant.format_type;
        if (!acc[format]) acc[format] = { total: 0, avgRate: 0 };
        acc[format].total++;
        acc[format].avgRate += r.response_rate;
        return acc;
      }, {} as any);

      const bestFormat = Object.entries(formatPerformance)
        .map(([format, data]: [string, any]) => ({ format, avgRate: data.avgRate / data.total }))
        .reduce((max, curr) => curr.avgRate > max.avgRate ? curr : max, { format: '', avgRate: 0 });

      insights.push(`${bestFormat.format} format resumes perform ${Math.round(bestFormat.avgRate)}% better on average.`);
    }

    // Statistical significance warning
    const hasSignificantResults = results.some(r => r.is_statistically_significant);
    if (!hasSignificantResults) {
      insights.push('⚠️ Results not yet statistically significant. Continue testing for more reliable insights.');
    }

    return insights;
  }
}
