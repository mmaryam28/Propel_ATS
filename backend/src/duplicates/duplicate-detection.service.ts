import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { MergeDuplicatesDto } from './dto/merge-duplicates.dto';

interface SimilarityScore {
  jobId: string;
  similarity: number;
  companyMatch: number;
  titleMatch: number;
  locationMatch: number;
  dateMatch: number;
}

@Injectable()
export class DuplicateDetectionService {
  constructor(private supabase: SupabaseService) {}

  // Find potential duplicates for a job
  async findPotentialDuplicates(userId: string, jobId: string) {
    const client = this.supabase.getClient();

    console.log('Finding duplicates for job:', jobId);

    // Get the target job
    const { data: targetJob, error: jobError } = await client
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('userId', userId)
      .single();

    if (jobError || !targetJob) {
      throw new BadRequestException('Job not found');
    }

    // Get all other jobs for this user (excluding duplicates)
    const { data: allJobs, error: allJobsError } = await client
      .from('jobs')
      .select('*')
      .eq('userId', userId)
      .eq('is_duplicate', false)
      .neq('id', jobId);

    if (allJobsError) {
      throw new BadRequestException(allJobsError.message);
    }

    if (!allJobs || allJobs.length === 0) {
      return [];
    }

    // Calculate similarity scores
    const similarityScores: SimilarityScore[] = allJobs.map((job) => {
      const similarity = this.calculateSimilarity(targetJob, job);
      return {
        jobId: job.id,
        ...similarity,
      };
    });

    // Filter jobs with similarity > 70%
    const potentialDuplicates = similarityScores
      .filter((score) => score.similarity >= 0.7)
      .sort((a, b) => b.similarity - a.similarity);

    // Check existing duplicate records
    const { data: existingDuplicates } = await client
      .from('job_duplicates')
      .select('*')
      .eq('job_id_1', jobId)
      .in(
        'job_id_2',
        potentialDuplicates.map((d) => d.jobId),
      );

    const existingSet = new Set(
      existingDuplicates?.map((d) => d.job_id_2) || [],
    );

    // Insert new duplicate records
    const newDuplicates = potentialDuplicates.filter(
      (d) => !existingSet.has(d.jobId),
    );

    if (newDuplicates.length > 0) {
      const duplicateRecords = newDuplicates.map((duplicate) => ({
        job_id_1: jobId,
        job_id_2: duplicate.jobId,
        similarity_score: duplicate.similarity,
        company_match: duplicate.companyMatch,
        title_match: duplicate.titleMatch,
        location_match: duplicate.locationMatch,
        date_match: duplicate.dateMatch,
      }));

      await client.from('job_duplicates').insert(duplicateRecords);
    }

    // Return full job details with scores
    const duplicateJobIds = potentialDuplicates.map((d) => d.jobId);
    const { data: duplicateJobs } = await client
      .from('jobs')
      .select('*')
      .in('id', duplicateJobIds);

    return (
      duplicateJobs?.map((job) => {
        const score = potentialDuplicates.find((s) => s.jobId === job.id);
        return {
          ...job,
          similarity_score: score?.similarity || 0,
          company_match: score?.companyMatch || 0,
          title_match: score?.titleMatch || 0,
          location_match: score?.locationMatch || 0,
          date_match: score?.dateMatch || 0,
        };
      }) || []
    );
  }

  // Calculate similarity between two jobs
  private calculateSimilarity(job1: any, job2: any): Omit<SimilarityScore, 'jobId'> {
    // Company match (40% weight)
    const companyMatch = this.stringSimilarity(
      this.normalize(job1.company_name || ''),
      this.normalize(job2.company_name || ''),
    );

    // Title match (35% weight)
    const titleMatch = this.stringSimilarity(
      this.normalize(job1.job_title || ''),
      this.normalize(job2.job_title || ''),
    );

    // Location match (15% weight)
    const locationMatch = this.locationSimilarity(job1, job2);

    // Date match (10% weight) - jobs posted within 30 days
    const dateMatch = this.dateSimilarity(job1.applied_at, job2.applied_at);

    // Weighted average
    const similarity =
      companyMatch * 0.4 +
      titleMatch * 0.35 +
      locationMatch * 0.15 +
      dateMatch * 0.1;

    return {
      similarity,
      companyMatch,
      titleMatch,
      locationMatch,
      dateMatch,
    };
  }

  // Normalize string for comparison
  private normalize(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  // Calculate string similarity using Levenshtein distance
  private stringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    // Use Dice coefficient for better fuzzy matching
    const bigrams1 = this.getBigrams(str1);
    const bigrams2 = this.getBigrams(str2);

    const intersection = bigrams1.filter((b) => bigrams2.includes(b)).length;
    const union = bigrams1.length + bigrams2.length;

    return union === 0 ? 0 : (2 * intersection) / union;
  }

  // Get bigrams from string
  private getBigrams(str: string): string[] {
    const bigrams: string[] = [];
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.push(str.substring(i, i + 2));
    }
    return bigrams;
  }

  // Calculate location similarity
  private locationSimilarity(job1: any, job2: any): number {
    const loc1 = this.normalize(
      `${job1.city || ''} ${job1.state || ''} ${job1.country || ''}`,
    );
    const loc2 = this.normalize(
      `${job2.city || ''} ${job2.state || ''} ${job2.country || ''}`,
    );

    if (loc1 === '' && loc2 === '') return 0.5;

    return this.stringSimilarity(loc1, loc2);
  }

  // Calculate date similarity
  private dateSimilarity(date1: string, date2: string): number {
    if (!date1 || !date2) return 0;

    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffDays = Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));

    // Linear decay over 30 days
    return Math.max(0, 1 - diffDays / 30);
  }

  // Get all pending duplicates for user
  async getPendingDuplicates(userId: string) {
    const client = this.supabase.getClient();

    const { data: duplicates, error } = await client
      .from('job_duplicates')
      .select(
        `
        *,
        job1:jobs!job_duplicates_job_id_1_fkey(*),
        job2:jobs!job_duplicates_job_id_2_fkey(*)
      `,
      )
      .eq('status', 'pending')
      .eq('job1.userId', userId)
      .order('similarity_score', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return duplicates || [];
  }

  // Merge duplicate jobs
  async mergeDuplicates(userId: string, mergeData: MergeDuplicatesDto) {
    const client = this.supabase.getClient();

    console.log('Merging duplicates:', mergeData);

    // Verify master job ownership
    const { data: masterJob } = await client
      .from('jobs')
      .select('*')
      .eq('id', mergeData.masterJobId)
      .eq('userId', userId)
      .single();

    if (!masterJob) {
      throw new BadRequestException('Master job not found');
    }

    // Verify all duplicate jobs
    const { data: duplicateJobs } = await client
      .from('jobs')
      .select('*')
      .in('id', mergeData.duplicateJobIds)
      .eq('userId', userId);

    if (!duplicateJobs || duplicateJobs.length !== mergeData.duplicateJobIds.length) {
      throw new BadRequestException('One or more duplicate jobs not found');
    }

    // Move platforms from duplicates to master
    for (const dupId of mergeData.duplicateJobIds) {
      // Get platforms
      const { data: platforms } = await client
        .from('application_platforms')
        .select('*')
        .eq('job_id', dupId);

      if (platforms) {
        for (const platform of platforms) {
          // Check if platform already exists on master
          const { data: existing } = await client
            .from('application_platforms')
            .select('*')
            .eq('job_id', mergeData.masterJobId)
            .eq('platform', platform.platform)
            .single();

          if (!existing) {
            // Move to master
            await client
              .from('application_platforms')
              .insert({
                job_id: mergeData.masterJobId,
                platform: platform.platform,
                application_url: platform.application_url,
                platform_job_id: platform.platform_job_id,
                applied_at: platform.applied_at,
                notes: platform.notes,
              });
          }

          // Delete from duplicate
          await client
            .from('application_platforms')
            .delete()
            .eq('id', platform.id);
        }
      }

      // Mark job as duplicate
      await client
        .from('jobs')
        .update({
          is_duplicate: true,
          merged_into_job_id: mergeData.masterJobId,
        })
        .eq('id', dupId);

      // Mark duplicate records as merged
      await client
        .from('job_duplicates')
        .update({ status: 'merged', resolved_at: new Date().toISOString() })
        .or(`job_id_1.eq.${dupId},job_id_2.eq.${dupId}`);
    }

    // Update platform count on master job
    const { count } = await client
      .from('application_platforms')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', mergeData.masterJobId);

    await client
      .from('jobs')
      .update({ platform_count: count || 0 })
      .eq('id', mergeData.masterJobId);

    return { message: 'Jobs merged successfully', masterJobId: mergeData.masterJobId };
  }

  // Dismiss duplicate suggestion
  async dismissDuplicate(userId: string, duplicateId: string) {
    const client = this.supabase.getClient();

    // Verify ownership through job
    const { data: duplicate } = await client
      .from('job_duplicates')
      .select('*, jobs!job_duplicates_job_id_1_fkey("userId")')
      .eq('id', duplicateId)
      .single();

    if (!duplicate || (duplicate.jobs as any).userId !== userId) {
      throw new BadRequestException('Duplicate record not found');
    }

    const { error } = await client
      .from('job_duplicates')
      .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
      .eq('id', duplicateId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'Duplicate dismissed' };
  }
}
