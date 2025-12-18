import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AddPlatformDto } from './dto/add-platform.dto';

@Injectable()
export class PlatformsService {
  constructor(private supabase: SupabaseService) {}

  // Add platform to existing job
  async addPlatformToJob(
    userId: string,
    jobId: string,
    platformData: AddPlatformDto,
  ) {
    const client = this.supabase.getClient();

    console.log('Adding platform to job:', { userId, jobId, platformData });

    // Verify job ownership
    const { data: job, error: jobError } = await client
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('userId', userId)
      .single();

    if (jobError || !job) {
      throw new BadRequestException('Job not found');
    }

    // Check if platform already exists for this job
    const { data: existing } = await client
      .from('application_platforms')
      .select('*')
      .eq('job_id', jobId)
      .eq('platform', platformData.platform)
      .single();

    if (existing) {
      throw new BadRequestException(
        'Platform already added to this job. Use update instead.',
      );
    }

    // Add platform
    const { data, error } = await client
      .from('application_platforms')
      .insert({
        job_id: jobId,
        platform: platformData.platform,
        application_url: platformData.application_url,
        platform_job_id: platformData.platform_job_id,
        notes: platformData.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding platform:', error);
      throw new BadRequestException(error.message);
    }

    // Update job platform count
    await this.updateJobPlatformCount(jobId);

    return data;
  }

  // Get all platforms for a job
  async getJobPlatforms(userId: string, jobId: string) {
    const client = this.supabase.getClient();

    // Verify job ownership
    const { data: job } = await client
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('userId', userId)
      .single();

    if (!job) {
      throw new BadRequestException('Job not found');
    }

    const { data, error } = await client
      .from('application_platforms')
      .select('*')
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data || [];
  }

  // Get all jobs with their platforms
  async getAllJobsWithPlatforms(userId: string) {
    const client = this.supabase.getClient();

    const { data: jobs, error } = await client
      .from('jobs')
      .select(
        `
        *,
        application_platforms(*)
      `,
      )
      .eq('userId', userId)
      .eq('is_duplicate', false)
      .order('appliedAt', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return jobs || [];
  }

  // Update platform count on job
  private async updateJobPlatformCount(jobId: string) {
    const client = this.supabase.getClient();

    const { count } = await client
      .from('application_platforms')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', jobId);

    await client
      .from('jobs')
      .update({ platform_count: count || 0 })
      .eq('id', jobId);
  }

  // Remove platform from job
  async removePlatform(userId: string, platformId: string) {
    const client = this.supabase.getClient();

    // Get platform and check job ownership
    const { data: platform, error: fetchError } = await client
      .from('application_platforms')
      .select('job_id, jobs!inner("userId")')
      .eq('id', platformId)
      .single();

    if (fetchError || !platform) {
      throw new BadRequestException('Platform not found');
    }

    // Verify ownership
    if ((platform.jobs as any).userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    const { error } = await client
      .from('application_platforms')
      .delete()
      .eq('id', platformId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    await this.updateJobPlatformCount(platform.job_id);

    return { message: 'Platform removed successfully' };
  }

  // Update platform details
  async updatePlatform(
    userId: string,
    platformId: string,
    updates: Partial<AddPlatformDto>,
  ) {
    const client = this.supabase.getClient();

    // Get platform and check ownership
    const { data: platform } = await client
      .from('application_platforms')
      .select('job_id, jobs!inner("userId")')
      .eq('id', platformId)
      .single();

    if (!platform || (platform.jobs as any).userId !== userId) {
      throw new BadRequestException('Platform not found');
    }

    const { data, error } = await client
      .from('application_platforms')
      .update(updates)
      .eq('id', platformId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }
}
