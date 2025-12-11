import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateJobDto, JOB_STATUSES, JobStatus } from './dto/create-job.dto';
import { ImportJobResponse } from './dto/import-job.dto';
import type { EnrichCompanyResponse } from './dto/enrich-company.dto';
import { UpdateJobDto } from './dto/update-job.dto';

// DB <-> API mapping helpers
// NOTE: Your Supabase table appears to have camelCase column names (userId, jobType, postingUrl, etc.)
// because querying snake_case produced 42703 errors. This mapping now targets camelCase columns.
function toDb(dto: CreateJobDto & { userId: string }) {
  const toNull = (v: any) => (v === undefined || v === '' ? null : v);
  const toInt = (v: any) => (v === undefined || v === '' || v === null ? null : Number(v));
  return {
    id: uuidv4(),
    userId: String(dto.userId),
    title: dto.title,
    company: dto.company,
    location: toNull(dto.location),
    postingUrl: toNull(dto.postingUrl),
    deadline: dto.deadline ? new Date(dto.deadline).toISOString() : null,
    description: toNull(dto.description),
    industry: toNull(dto.industry),
    jobType: toNull(dto.jobType),
    source: toNull((dto as any).source),
    salaryMin: toInt(dto.salaryMin),
    salaryMax: toInt(dto.salaryMax),
    // Company profile fields
    companySize: toNull((dto as any).companySize),
    companyWebsite: toNull((dto as any).companyWebsite),
    companyDescription: toNull((dto as any).companyDescription),
    companyMission: toNull((dto as any).companyMission),
    companyLogoUrl: toNull((dto as any).companyLogoUrl),
    companyContactEmail: toNull((dto as any).companyContactEmail),
    companyContactPhone: toNull((dto as any).companyContactPhone),
    glassdoorRating: (dto as any).glassdoorRating ?? null,
    glassdoorUrl: toNull((dto as any).glassdoorUrl),
  // UC-042 materials linkage
  resumeVersionId: toNull((dto as any).resumeVersionId),
  coverLetterVersionId: toNull((dto as any).coverLetterVersionId),
    // status fields
    status: (dto.status as JobStatus) ?? 'Interested',
    statusUpdatedAt: new Date().toISOString(),
    // ensure inserts succeed if createdAt/updatedAt are NOT NULL without defaults
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as const;
}

function toApi(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location ?? null,
    postingUrl: row.postingUrl ?? row.posting_url ?? null,
    deadline: row.deadline ?? null,
    description: row.description ?? null,
    industry: row.industry ?? null,
    jobType: row.jobType ?? row.job_type ?? null,
    source: row.source ?? null,
    salaryMin: row.salaryMin ?? row.salary_min ?? null,
    salaryMax: row.salaryMax ?? row.salary_max ?? null,
    // Company profile fields
    companySize: row.companySize ?? null,
    companyWebsite: row.companyWebsite ?? null,
    companyDescription: row.companyDescription ?? null,
    companyMission: row.companyMission ?? null,
    companyLogoUrl: row.companyLogoUrl ?? null,
    companyContactEmail: row.companyContactEmail ?? null,
    companyContactPhone: row.companyContactPhone ?? null,
    glassdoorRating: row.glassdoorRating ?? null,
    glassdoorUrl: row.glassdoorUrl ?? null,
  // UC-042 materials linkage
  resumeVersionId: row.resumeVersionId ?? null,
  coverLetterVersionId: row.coverLetterVersionId ?? null,
    notes: row.notes ?? null,
    negotiationNotes: row.negotiationNotes ?? row.negotiation_notes ?? null,
    interviewNotes: row.interviewNotes ?? row.interview_notes ?? null,
    recruiterName: row.recruiterName ?? row.recruiter_name ?? null,
    recruiterEmail: row.recruiterEmail ?? row.recruiter_email ?? null,
    recruiterPhone: row.recruiterPhone ?? row.recruiter_phone ?? null,
    hiringManagerName: row.hiringManagerName ?? row.hiring_manager_name ?? null,
    hiringManagerEmail: row.hiringManagerEmail ?? row.hiring_manager_email ?? null,
    hiringManagerPhone: row.hiringManagerPhone ?? row.hiring_manager_phone ?? null,
    status: row.status ?? null,
    statusUpdatedAt: row.statusUpdatedAt ?? row.status_updated_at ?? null,
    archivedAt: row.archivedAt ?? null,
    archiveReason: row.archiveReason ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
    userId: row.userId ?? row.user_id,
  };
}

@Injectable()
export class JobsService {
  constructor(private supabase: SupabaseService) {}

  async list(userId: string, status?: JobStatus, search?: string, industry?: string, location?: string, salaryMin?: string, salaryMax?: string, deadlineFrom?: string, deadlineTo?: string, sortBy?: string, sortOrder?: string, showArchived?: boolean) {
    const client = this.supabase.getClient();
    let query = client
      .from('jobs')
      .select('*')
      .eq('userId', String(userId));
    
    // Filter by archived status
    if (showArchived) {
      query = query.not('archivedAt', 'is', null);
    } else {
      query = query.is('archivedAt', null);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      // Search in title, company, and description fields (case-insensitive)
      query = query.or(`title.ilike.${searchTerm},company.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }
    if (industry && industry.trim()) {
      query = query.eq('industry', industry.trim());
    }
    if (location && location.trim()) {
      // Case-insensitive partial match for location
      query = query.ilike('location', `%${location.trim()}%`);
    }
    if (salaryMin) {
      const min = Number(salaryMin);
      if (!isNaN(min)) {
        // Job's max salary must be >= user's min (job can pay at least what user wants)
        query = query.gte('salaryMax', min);
      }
    }
    if (salaryMax) {
      const max = Number(salaryMax);
      if (!isNaN(max)) {
        // Job's min salary must be <= user's max (job doesn't require more than user's max)
        query = query.lte('salaryMin', max);
      }
    }
    if (deadlineFrom && deadlineFrom.trim()) {
      query = query.gte('deadline', deadlineFrom.trim());
    }
    if (deadlineTo && deadlineTo.trim()) {
      query = query.lte('deadline', deadlineTo.trim());
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    if (sortBy === 'deadline') {
      query = query.order('deadline', { ascending, nullsFirst: false });
    } else if (sortBy === 'company') {
      query = query.order('company', { ascending });
    } else if (sortBy === 'salary') {
      query = query.order('salaryMax', { ascending, nullsFirst: false });
    } else {
      // Default: sort by createdAt (newest first unless specified)
      query = query.order('createdAt', { ascending: sortOrder === 'asc' });
    }

    const { data, error } = await query;
    if (error) {
      // PGRST205 => table not found in schema cache
      if ((error as any).code === 'PGRST205') {
        return []; // surface empty list until table created
      }
      throw error;
    }
    return (data || []).map(toApi);
  }

  async create(userId: string, dto: CreateJobDto) {
    const client = this.supabase.getClient();
    
    console.log('DEBUG: Creating job with dto:', { 
      title: dto.title, 
      company: dto.company, 
      source: (dto as any).source 
    });
    
    // Try applying user defaults for materials if not provided
    let resumeVersionId: string | null | undefined = (dto as any).resumeVersionId;
    let coverLetterVersionId: string | null | undefined = (dto as any).coverLetterVersionId;
    try {
      if (resumeVersionId === undefined || coverLetterVersionId === undefined) {
        const { data: defaults, error: defErr } = await client
          .from('user_material_defaults')
          .select('*')
          .eq('userId', String(userId))
          .single();
        if (!defErr && defaults) {
          if (resumeVersionId === undefined) resumeVersionId = defaults.defaultResumeVersionId ?? null;
          if (coverLetterVersionId === undefined) coverLetterVersionId = defaults.defaultCoverLetterVersionId ?? null;
        }
      }
    } catch { /* ignore missing table */ }
    const payload = toDb({ ...dto, userId, ...(resumeVersionId !== undefined ? { resumeVersionId } : {}), ...(coverLetterVersionId !== undefined ? { coverLetterVersionId } : {} ) } as any);
    
    console.log('DEBUG: toDb payload:', { 
      title: payload.title, 
      source: payload.source 
    });
    
    const { data, error } = await client
      .from('jobs')
      .insert(payload)
      .select('*')
      .single();
    if (error) {
      if ((error as any).code === 'PGRST205') {
        throw new BadRequestException("'jobs' table does not exist yet. Create it in Supabase (or enable it) and retry.");
      }
      throw error;
    }
    // Best-effort: append an initial history record if table exists
    try {
      // Use lower-case column names to match unquoted SQL identifiers (jobid, userid, createdat)
      await client.from('job_history').insert({
        id: uuidv4(),
        jobid: data.id,
        userid: userId,
        status: data.status ?? 'Interested',
        note: 'Created',
        createdat: new Date().toISOString(),
      });
      // Also record initial materials linkage if present
      if ((payload as any).resumeVersionId || (payload as any).coverLetterVersionId) {
        try {
          await client.from('job_material_history').insert({
            id: uuidv4(),
            jobid: (data as any).id,
            userid: userId,
            resumeversionid: (payload as any).resumeVersionId ?? null,
            coverletterversionid: (payload as any).coverLetterVersionId ?? null,
            changedat: new Date().toISOString(),
          });
        } catch { /* ignore */ }
      }
    } catch (e) {
      // ignore missing table/permissions
    }
    return toApi(data);
  }

  async getById(userId: string, id: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('jobs')
      .select('*')
      .eq('id', id)
      .eq('userId', userId)
      .single();
    if (error) throw error;
    return toApi(data);
  }

  async update(userId: string, id: string, dto: UpdateJobDto) {
    const client = this.supabase.getClient();
    const toNull = (v: any) => (v === undefined || v === '' ? null : v);
    const toInt = (v: any) => (v === undefined || v === '' || v === null ? null : Number(v));
    const updatePayload: any = {
      title: dto.title,
      company: dto.company,
      location: dto.location ?? undefined,
      postingUrl: dto.postingUrl ?? undefined,
      deadline: dto.deadline ? new Date(dto.deadline).toISOString() : dto.deadline === null ? null : undefined,
      description: dto.description ?? undefined,
      industry: dto.industry ?? undefined,
      jobType: dto.jobType ?? undefined,
      salaryMin: dto.salaryMin !== undefined ? toInt(dto.salaryMin) : undefined,
      salaryMax: dto.salaryMax !== undefined ? toInt(dto.salaryMax) : undefined,
      // Company profile fields
      companySize: (dto as any).companySize ?? undefined,
      companyWebsite: (dto as any).companyWebsite ?? undefined,
      companyDescription: (dto as any).companyDescription ?? undefined,
      companyMission: (dto as any).companyMission ?? undefined,
      companyLogoUrl: (dto as any).companyLogoUrl ?? undefined,
      companyContactEmail: (dto as any).companyContactEmail ?? undefined,
      companyContactPhone: (dto as any).companyContactPhone ?? undefined,
      glassdoorRating: (dto as any).glassdoorRating !== undefined ? (dto as any).glassdoorRating : undefined,
      glassdoorUrl: (dto as any).glassdoorUrl ?? undefined,
  // UC-042 materials
  resumeVersionId: (dto as any).resumeVersionId !== undefined ? (dto as any).resumeVersionId : undefined,
  coverLetterVersionId: (dto as any).coverLetterVersionId !== undefined ? (dto as any).coverLetterVersionId : undefined,
      notes: dto.notes ?? undefined,
      negotiationNotes: dto.negotiationNotes ?? undefined,
      interviewNotes: dto.interviewNotes ?? undefined,
      recruiterName: dto.recruiterName ?? undefined,
      recruiterEmail: dto.recruiterEmail ?? undefined,
      recruiterPhone: dto.recruiterPhone ?? undefined,
      hiringManagerName: dto.hiringManagerName ?? undefined,
      hiringManagerEmail: dto.hiringManagerEmail ?? undefined,
      hiringManagerPhone: dto.hiringManagerPhone ?? undefined,
      updatedAt: new Date().toISOString(),
    };
    // Remove undefined so we only update provided fields
    Object.keys(updatePayload).forEach(k => updatePayload[k] === undefined && delete updatePayload[k]);

    const { data, error } = await client
      .from('jobs')
      .update(updatePayload)
      .eq('id', id)
      .eq('userId', userId)
      .select('*')
      .single();
    if (error) throw error;
    // Record materials history if materials were part of this update
    try {
      if ((dto as any).resumeVersionId !== undefined || (dto as any).coverLetterVersionId !== undefined) {
        await client.from('job_material_history').insert({
          id: uuidv4(),
          jobid: id,
          userid: userId,
          resumeversionid: (dto as any).resumeVersionId ?? null,
          coverletterversionid: (dto as any).coverLetterVersionId ?? null,
          changedat: new Date().toISOString(),
        });
      }
    } catch { /* ignore missing table */ }
    return toApi(data);
  }

  async updateStatus(userId: string, id: string, status: JobStatus) {
    if (!JOB_STATUSES.includes(status)) {
      throw new BadRequestException('Invalid status');
    }
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('jobs')
      .update({ status, statusUpdatedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .eq('id', id)
      .eq('userId', userId)
      .select('*')
      .single();
    if (error) throw error;
    // Best-effort: append history record if table exists
    try {
      await client.from('job_history')
        .insert({ id: uuidv4(), jobid: id, userid: userId, status, createdat: new Date().toISOString() });
    } catch (e: any) {
      // Ignore missing table (PGRST205) or permission errors to avoid breaking primary update
    }
    
    // UC-080: Sync interview records when job status changes to 'Offer' or 'Rejected'
    try {
      if (status === 'Offer') {
        // Update all interviews for this job to mark offer_received = true
        await client
          .from('interviews')
          .update({ 
            offer_received: true, 
            status: 'completed',
            updated_at: new Date().toISOString() 
          })
          .eq('job_id', id)
          .eq('user_id', userId);
      } else if (status === 'Rejected') {
        // Mark interviews as completed without offer
        await client
          .from('interviews')
          .update({ 
            offer_received: false,
            status: 'completed',
            outcome: 'Rejected',
            updated_at: new Date().toISOString()
          })
          .eq('job_id', id)
          .eq('user_id', userId);
      }
    } catch (e: any) {
      // Don't break status update if interview sync fails
      console.error('Failed to sync interview records:', e);
    }
    
    return toApi(data);
  }

  async bulkUpdateStatus(userId: string, ids: string[], status: JobStatus) {
    if (!ids?.length) throw new BadRequestException('No ids provided');
    if (!JOB_STATUSES.includes(status)) throw new BadRequestException('Invalid status');
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('jobs')
      .update({ status, statusUpdatedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .in('id', ids)
      .eq('userId', userId)
      .select('*');
    if (error) throw error;
    const updated = (data || []).map(toApi);
    // Best-effort: append history records for each updated job
    try {
      if (updated.length) {
        await client
          .from('job_history')
          .insert(
            updated.map((row: any) => ({
              id: uuidv4(),
              jobid: row.id,
              userid: userId,
              status,
              createdat: new Date().toISOString(),
            }))
          );
      }
    } catch (e) {
      // ignore missing table/permissions
    }
    return updated;
  }

  async getHistory(userId: string, jobId: string) {
    const client = this.supabase.getClient();
    // If job_history table does not exist, return empty list gracefully
    const { data, error } = await client
      .from('job_history')
      .select('*')
      .eq('jobid', jobId)
      .eq('userid', userId)
      .order('createdat', { ascending: false });
    if (error) {
      if ((error as any).code === 'PGRST205') return []; // table missing
      throw error;
    }
    return (data || []).map(row => ({
      id: row.id,
      status: row.status,
      note: row.note ?? null,
      createdAt: row.createdat ?? row.createdAt ?? row.created_at ?? null,
    }));
  }

  // UC-042: Materials history per job
  async getMaterialsHistory(userId: string, jobId: string) {
    const client = this.supabase.getClient();
    try {
      const { data, error } = await client
        .from('job_material_history')
        .select('*')
        .eq('jobid', jobId)
        .eq('userid', userId)
        .order('changedat', { ascending: false });
      if (error) {
        if ((error as any).code === 'PGRST205') return [];
        throw error;
      }
      return (data || []).map((row: any) => ({
        id: row.id,
        resumeVersionId: row.resumeversionid ?? null,
        coverLetterVersionId: row.coverletterversionid ?? null,
        changedAt: row.changedat ?? row.changedAt ?? row.changed_at ?? null,
      }));
    } catch (e: any) {
      if ((e as any).code === 'PGRST205') return [];
      throw e;
    }
  }

  // UC-042: Materials usage analytics
  async getMaterialsUsage(userId: string) {
    const client = this.supabase.getClient();
    try {
      const { data, error } = await client
        .from('jobs')
        .select('resumeVersionId, coverLetterVersionId')
        .eq('userId', String(userId));
      if (error) {
        if ((error as any).code === 'PGRST205' || (error as any).code === 'PGRST204') return { resume: [], coverLetter: [] };
        throw error;
      }
      const resumeCounts = new Map<string, number>();
      const coverCounts = new Map<string, number>();
      for (const row of data || []) {
        const r = (row as any).resumeVersionId as string | null;
        const c = (row as any).coverLetterVersionId as string | null;
        if (r) resumeCounts.set(r, (resumeCounts.get(r) || 0) + 1);
        if (c) coverCounts.set(c, (coverCounts.get(c) || 0) + 1);
      }
      return {
        resume: Array.from(resumeCounts.entries()).map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count),
        coverLetter: Array.from(coverCounts.entries()).map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count),
      };
    } catch {
      return { resume: [], coverLetter: [] };
    }
  }

  // UC-042: User material defaults
  async getUserMaterialDefaults(userId: string) {
    const client = this.supabase.getClient();
    try {
      const { data, error } = await client
        .from('user_material_defaults')
        .select('*')
        .eq('userId', String(userId))
        .single();
      if (error) {
        if ((error as any).code === 'PGRST205' || (error as any).code === 'PGRST116') return { defaultResumeVersionId: null, defaultCoverLetterVersionId: null };
        throw error;
      }
      return {
        defaultResumeVersionId: data?.defaultResumeVersionId ?? null,
        defaultCoverLetterVersionId: data?.defaultCoverLetterVersionId ?? null,
      };
    } catch {
      return { defaultResumeVersionId: null, defaultCoverLetterVersionId: null };
    }
  }

  async setUserMaterialDefaults(userId: string, defaults: { defaultResumeVersionId?: string | null; defaultCoverLetterVersionId?: string | null }) {
    const client = this.supabase.getClient();
    try {
      const payload: any = {
        userId: String(userId),
        defaultResumeVersionId: defaults.defaultResumeVersionId ?? null,
        defaultCoverLetterVersionId: defaults.defaultCoverLetterVersionId ?? null,
        updatedAt: new Date().toISOString(),
      };
      const { data, error } = await client
        .from('user_material_defaults')
        .upsert(payload, { onConflict: 'userId' })
        .select('*')
        .single();
      if (error) throw error;
      return {
        defaultResumeVersionId: data?.defaultResumeVersionId ?? null,
        defaultCoverLetterVersionId: data?.defaultCoverLetterVersionId ?? null,
      };
    } catch (e) {
      // Missing table or permissions: return what was requested so UI can reflect the intent even if persistence failed
      return {
        defaultResumeVersionId: defaults.defaultResumeVersionId ?? null,
        defaultCoverLetterVersionId: defaults.defaultCoverLetterVersionId ?? null,
      };
    }
  }

  async getCompanyNews(userId: string, jobId: string) {
    const client = this.supabase.getClient();
    // Fetch job to get company name
    const { data: job, error: jobErr } = await client
      .from('jobs')
      .select('company')
      .eq('id', jobId)
      .eq('userId', userId)
      .single();
    if (jobErr) throw jobErr;
    const company = job?.company;
    if (!company) return { company, articles: [] };

    const apiKey = process.env.NEWS_API_KEY;
    // Primary: NewsAPI.org when key available
    if (apiKey) {
      try {
        const url = new URL('https://newsapi.org/v2/everything');
        url.searchParams.set('q', `"${company}"`);
        url.searchParams.set('language', 'en');
        url.searchParams.set('sortBy', 'publishedAt');
        url.searchParams.set('pageSize', '5');
        const res = await fetch(url.toString(), { headers: { 'X-Api-Key': apiKey } });
        const json = await res.json();
        if (res.ok && Array.isArray(json.articles) && json.articles.length) {
          const articles = json.articles.map((a: any) => ({
            title: a.title,
            url: a.url,
            source: a.source?.name,
            publishedAt: a.publishedAt,
            description: a.description,
          }));
          return { company, articles };
        }
      } catch {/* fall through to RSS */}
    }

    // Fallback: Google News RSS (no key required)
    try {
      const rssUrl = new URL('https://news.google.com/rss/search');
      rssUrl.searchParams.set('q', `"${company}"`);
      rssUrl.searchParams.set('hl', 'en-US');
      rssUrl.searchParams.set('gl', 'US');
      rssUrl.searchParams.set('ceid', 'US:en');
      const res = await fetch(rssUrl.toString());
      if (!res.ok) return { company, articles: [] };
      const xml = await res.text();
      const items = this.parseGoogleNewsRss(xml).slice(0, 5);
      return { company, articles: items };
    } catch {
      return { company, articles: [] };
    }
  }

  async importFromUrl(url: string): Promise<ImportJobResponse> {
    try {
      // Validate URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return {
          success: false,
          status: 'failed',
          data: { postingUrl: url },
          message: 'Invalid URL format',
        };
      }

      // Check if URL is from supported job boards
      const hostname = parsedUrl.hostname.toLowerCase();
      const supportedDomains = ['linkedin.com', 'indeed.com', 'glassdoor.com'];
      const isSupported = supportedDomains.some(domain => hostname.includes(domain));

      if (!isSupported) {
        return {
          success: false,
          status: 'failed',
          data: { postingUrl: url },
          message: 'URL is not from a supported job board (LinkedIn, Indeed, or Glassdoor). Please enter job details manually.',
        };
      }

      // Attempt to fetch and parse the URL
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
          },
        });

        if (!response.ok) {
          return {
            success: false,
            status: 'failed',
            data: { postingUrl: url },
            message: `Failed to fetch URL: ${response.status} ${response.statusText}. This job board may block automated requests. Please enter job details manually.`,
          };
        }

        const html = await response.text();
        
        // Extract job details using simple patterns
        const extractedData = this.parseJobHtml(html, hostname);
        // Also try to enrich company info from the same URL/page
        const companyEnrichment = this.extractCompanyFromHtml(html, url);
        
        if (!extractedData.title && !extractedData.company) {
          return {
            success: false,
            status: 'failed',
            data: { postingUrl: url },
            message: 'Could not extract job details from URL. Please enter details manually.',
          };
        }

        const hasAllFields = extractedData.title && extractedData.company && extractedData.description;
        
        // Resolve Glassdoor profile link if we can
        let gdUrl: string | null = null;
        if (!companyEnrichment.glassdoorUrl && extractedData.company) {
          gdUrl = await this.resolveGlassdoorProfileUrl(extractedData.company);
        }

        return {
          success: true,
          status: hasAllFields ? 'success' : 'partial',
          data: {
            ...extractedData,
            ...companyEnrichment,
            glassdoorUrl: companyEnrichment.glassdoorUrl || gdUrl || this.buildGlassdoorSearchUrl(extractedData.company || hostname),
            postingUrl: url,
          },
          message: hasAllFields 
            ? 'Successfully imported job details'
            : 'Partially imported job details. Please review and complete missing fields.',
        };
      } catch (fetchError: any) {
        return {
          success: false,
          status: 'failed',
          data: { postingUrl: url },
          message: `Failed to fetch job details: ${fetchError.message || 'Network error'}`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        status: 'failed',
        data: { postingUrl: url },
        message: `Error importing job: ${error.message || 'Unknown error'}`,
      };
    }
  }

  private parseJobHtml(html: string, hostname: string): Partial<{ title: string; company: string; location: string; description: string }> {
    const result: Partial<{ title: string; company: string; location: string; description: string }> = {};

    try {
      // LinkedIn patterns
      if (hostname.includes('linkedin.com')) {
        // Job title - multiple patterns
        const titleMatch = html.match(/<h1[^>]*class="[^"]*top-card-layout__title[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                          html.match(/<h1[^>]*class="[^"]*job[^"]*title[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                          html.match(/<h1[^>]*>([^<]*(?:Engineer|Developer|Manager|Analyst|Designer|Architect|Specialist|Coordinator)[^<]*)<\/h1>/i);
        if (titleMatch) result.title = this.cleanText(titleMatch[1]);

        // Company name - improved patterns for LinkedIn
        const companyMatch = html.match(/<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>([^<]+)<\/a>/i) ||
                            html.match(/<a[^>]*class="[^"]*sub-nav-cta__optional-url[^"]*"[^>]*>([^<]+)<\/a>/i) ||
                            html.match(/<span[^>]*class="[^"]*topcard__flavor[^"]*"[^>]*>([^<]+)<\/span>/i) ||
                            html.match(/<a[^>]*class="[^"]*ember-view[^"]*"[^>]*href="\/company\/[^"]*"[^>]*>([^<]+)<\/a>/i) ||
                            html.match(/<div[^>]*class="[^"]*job-details-jobs-unified-top-card__company-name[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i) ||
                            html.match(/<a[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/a>/i) ||
                            html.match(/<span[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/span>/i);
        if (companyMatch) result.company = this.cleanText(companyMatch[1]);

        // Location - improved patterns
        const locationMatch = html.match(/<span[^>]*class="[^"]*topcard__flavor[^"]*location[^"]*"[^>]*>([^<]+)<\/span>/i) ||
                             html.match(/<span[^>]*class="[^"]*job-details-jobs-unified-top-card__bullet[^"]*"[^>]*>([^<]+)<\/span>/i) ||
                             html.match(/<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/span>/i);
        if (locationMatch) result.location = this.cleanText(locationMatch[1]);

        // Description
        const descMatch = html.match(/<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>([\s\S]{50,2000}?)<\/div>/i) ||
                         html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]{50,2000}?)<\/div>/i);
        if (descMatch) result.description = this.cleanText(descMatch[1]).substring(0, 2000);
      }
      
      // Indeed patterns
      else if (hostname.includes('indeed.com')) {
        const titleMatch = html.match(/<h1[^>]*class="[^"]*jobsearch[^"]*JobInfoHeader[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                          html.match(/<h1[^>]*>([^<]*(?:Engineer|Developer|Manager|Analyst|Designer)[^<]*)<\/h1>/i);
        if (titleMatch) result.title = this.cleanText(titleMatch[1]);

        const companyMatch = html.match(/<div[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/div>/i);
        if (companyMatch) result.company = this.cleanText(companyMatch[1]);

        const locationMatch = html.match(/<div[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/div>/i);
        if (locationMatch) result.location = this.cleanText(locationMatch[1]);

        const descMatch = html.match(/<div[^>]*id="jobDescriptionText"[^>]*>([\s\S]{50,2000}?)<\/div>/i);
        if (descMatch) result.description = this.cleanText(descMatch[1]).substring(0, 2000);
      }
      
      // Glassdoor patterns
      else if (hostname.includes('glassdoor.com')) {
        const titleMatch = html.match(/<h1[^>]*>([^<]*(?:Engineer|Developer|Manager|Analyst|Designer)[^<]*)<\/h1>/i);
        if (titleMatch) result.title = this.cleanText(titleMatch[1]);

        const companyMatch = html.match(/<div[^>]*class="[^"]*employer[^"]*"[^>]*>([^<]+)<\/div>/i);
        if (companyMatch) result.company = this.cleanText(companyMatch[1]);
      }

      // Fallback: Look for common patterns in meta tags
      if (!result.title) {
        const metaTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
        if (metaTitleMatch) result.title = this.cleanText(metaTitleMatch[1]);
      }

      if (!result.description) {
        const metaDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i) ||
                              html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
        if (metaDescMatch) result.description = this.cleanText(metaDescMatch[1]).substring(0, 2000);
      }
    } catch (error) {
      // If parsing fails, return what we have
    }

    return result;
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // New: Public service to enrich company profile from a URL
  async enrichCompanyFromUrl(url: string): Promise<EnrichCompanyResponse> {
    // Validate URL
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return { success: false, message: 'Invalid URL', data: { companyWebsite: null } };
    }

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
      });
      if (!res.ok) {
        // Fall back to only domain-derived fields
        const base = parsed.origin;
        const host = parsed.hostname;
        return {
          success: true,
          message: `Fetched with status ${res.status}. Returned minimal data from domain.`,
          data: {
            company: this.deriveCompanyNameFromHost(host),
            companyWebsite: base,
            companyLogoUrl: `https://logo.clearbit.com/${host}`,
            glassdoorUrl: this.buildGlassdoorSearchUrl(this.deriveCompanyNameFromHost(host) || host),
          },
        };
      }
      const html = await res.text();
      const enriched = this.extractCompanyFromHtml(html, url);
      // Ensure website/logo defaults from domain
      const host = parsed.hostname;
      const base = parsed.origin;
      const data = {
        company: enriched.company ?? this.deriveCompanyNameFromHost(host),
        companyWebsite: enriched.companyWebsite ?? base,
        companyDescription: enriched.companyDescription ?? null,
        companyMission: enriched.companyMission ?? null,
        companyLogoUrl: enriched.companyLogoUrl ?? `https://logo.clearbit.com/${host}`,
        companyContactEmail: enriched.companyContactEmail ?? null,
        companyContactPhone: enriched.companyContactPhone ?? null,
        companySize: enriched.companySize ?? null,
        glassdoorUrl: enriched.glassdoorUrl ?? null,
      } as EnrichCompanyResponse['data'];

      // Try to resolve a direct Glassdoor profile URL if possible (optional Bing Search API)
      if (!data.glassdoorUrl && data.company) {
        const gd = await this.resolveGlassdoorProfileUrl(data.company);
        data.glassdoorUrl = gd ?? this.buildGlassdoorSearchUrl(data.company);
      } else if (!data.glassdoorUrl) {
        data.glassdoorUrl = this.buildGlassdoorSearchUrl(this.deriveCompanyNameFromHost(host) || host);
      }

      // If key fields missing, probe a couple of common pages (about/contact/mission)
      const needContact = !data.companyContactEmail || !data.companyContactPhone;
      const needMission = !data.companyMission;
      const needSize = !data.companySize;
      if (needContact || needMission || needSize) {
        const candidates = ['/about', '/about-us', '/company', '/who-we-are', '/mission', '/our-mission', '/contact', '/contact-us'];
        for (const p of candidates) {
          try {
            const u = new URL(p, base).toString();
            const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html,application/xhtml+xml' } });
            if (!r.ok) continue;
            const h = await r.text();
            const extra = this.extractContactsAndMission(h, base);
            if (!data.companyContactEmail && extra.companyContactEmail) data.companyContactEmail = extra.companyContactEmail;
            if (!data.companyContactPhone && extra.companyContactPhone) data.companyContactPhone = extra.companyContactPhone;
            if (!data.companyMission && extra.companyMission) data.companyMission = extra.companyMission;
            if (!data.companySize && extra.companySize) data.companySize = extra.companySize;
            if (!data.companyDescription && extra.companyDescription) data.companyDescription = extra.companyDescription;
            // Stop early if we have enough
            if ((!needContact || (data.companyContactEmail || data.companyContactPhone)) && (!needMission || data.companyMission) && (!needSize || data.companySize)) {
              break;
            }
          } catch { /* ignore */ }
        }
      }

      // Optional: attempt Clearbit enrichment for company size if available
      const clearbitKey = process.env.CLEARBIT_API_KEY;
      if (clearbitKey) {
        try {
          const resp = await fetch(`https://company.clearbit.com/v2/companies/find?domain=${encodeURIComponent(host)}`, {
            headers: { Authorization: `Bearer ${clearbitKey}` },
          });
          if (resp.ok) {
            const json: any = await resp.json();
            // Map selected fields if present
            if (json?.metrics?.employeesRange) {
              data.companySize = json.metrics.employeesRange as string;
            } else if (typeof json?.metrics?.employees === 'number') {
              data.companySize = `${json.metrics.employees}`;
            }
            if (!data.companyDescription && json?.description) data.companyDescription = json.description;
            if (!data.company && json?.name) data.company = json.name;
            if (!data.companyLogoUrl && json?.logo) data.companyLogoUrl = json.logo;
          }
        } catch {
          // ignore API issues; we already have best-effort data
        }
      }

      return { success: true, message: 'Enriched company info', data };
    } catch (e: any) {
      const host = parsed.hostname;
      return {
        success: true,
        message: 'Network error fetching page. Returned minimal data from domain.',
        data: {
          company: this.deriveCompanyNameFromHost(host),
          companyWebsite: parsed.origin,
          companyLogoUrl: `https://logo.clearbit.com/${host}`,
          glassdoorUrl: this.buildGlassdoorSearchUrl(this.deriveCompanyNameFromHost(host) || host),
        },
      };
    }
  }

  private extractCompanyFromHtml(html: string, sourceUrl: string): Partial<{
    company: string;
    companyWebsite: string | null;
    companyDescription: string | null;
    companyMission: string | null;
    companyLogoUrl: string | null;
    companyContactEmail: string | null;
    companyContactPhone: string | null;
    companySize: string | null;
    glassdoorUrl: string | null;
  }> {
    const out: any = {};
    const url = new URL(sourceUrl);
    const origin = url.origin;
    const host = url.hostname;

    // Try JSON-LD first (Organization schema)
    try {
      const jsonld = this.parseJsonLd(html);
      const org = jsonld.find(o => {
        const t = Array.isArray(o['@type']) ? o['@type'] : [o['@type']];
        return t.some((v: any) => typeof v === 'string' && /Organization|LocalBusiness|Corporation/i.test(v));
      }) as any;
      if (org) {
        if (org.name && !out.company) out.company = this.cleanText(String(org.name));
        if (org.description && !out.companyDescription) out.companyDescription = this.cleanText(String(org.description)).slice(0, 2000);
        if (org.logo && !out.companyLogoUrl) out.companyLogoUrl = this.toAbsoluteUrl(String(org.logo), origin);
        // numberOfEmployees could be a QuantitativeValue { value, minValue, maxValue }
        const nEmp = org.numberOfEmployees || org.employees || org.employee || org.staff;
        if (nEmp) {
          if (typeof nEmp === 'number') out.companySize = String(nEmp);
          else if (typeof nEmp === 'string') out.companySize = nEmp;
          else if (typeof nEmp?.value === 'number') out.companySize = String(nEmp.value);
          else if (typeof nEmp?.minValue === 'number' && typeof nEmp?.maxValue === 'number') out.companySize = `${nEmp.minValue}-${nEmp.maxValue}`;
        }
        // contactPoint array or direct fields
        const contactPoints = ([] as any[]).concat(org.contactPoint || []);
        for (const cp of contactPoints) {
          if (!out.companyContactEmail && typeof cp?.email === 'string') out.companyContactEmail = cp.email.toLowerCase();
          if (!out.companyContactPhone && typeof cp?.telephone === 'string') out.companyContactPhone = cp.telephone;
        }
        if (!out.companyContactEmail && typeof org.email === 'string') out.companyContactEmail = org.email.toLowerCase();
        if (!out.companyContactPhone && typeof org.telephone === 'string') out.companyContactPhone = org.telephone;
      }
    } catch { /* ignore JSON-LD parsing errors */ }

    // Site name or company name
    const siteName = this.matchFirst(html, [
      /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*name=["']application-name["'][^>]*content=["']([^"']+)["']/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    ]);
    if (siteName) out.company = this.cleanText(siteName);

    // Description
    const desc = this.matchFirst(html, [
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
    ]);
    if (desc) out.companyDescription = this.cleanText(desc).slice(0, 2000);

    // Logo/icon
    const logo = this.matchFirst(html, [
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /<link[^>]*rel=["']apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["']/i,
      /<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i,
    ]);
    if (logo) out.companyLogoUrl = this.toAbsoluteUrl(logo, origin);

    // Contact email/phone
    const email = this.matchFirst(html, [
      /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,})/i,
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,})/i,
    ]);
    if (email) out.companyContactEmail = email.toLowerCase();
    const phone = this.matchFirst(html, [
      /tel:([+()\d\s-]{7,})/i,
      /(?:\+?\d[\d\s-().]{7,}\d)/,
    ]);
    if (phone) out.companyContactPhone = phone.trim();

    // Website
    out.companyWebsite = origin;

    // Glassdoor URL (search fallback)
    const nameForSearch = out.company || this.deriveCompanyNameFromHost(host) || host;
    out.glassdoorUrl = this.buildGlassdoorSearchUrl(nameForSearch);

    return out;
  }

  private extractContactsAndMission(html: string, origin: string): Partial<{
    companyDescription: string | null;
    companyMission: string | null;
    companyContactEmail: string | null;
    companyContactPhone: string | null;
    companySize: string | null;
  }> {
    const out: any = {};
    // reuse email/phone regexes
    const email = this.matchFirst(html, [
      /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,})/i,
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,})/i,
    ]);
    if (email) out.companyContactEmail = email.toLowerCase();
    const phone = this.matchFirst(html, [
      /tel:([+()\d\s-]{7,})/i,
      /(?:\+?\d[\d\s-().]{7,}\d)/,
    ]);
    if (phone) out.companyContactPhone = phone.trim();

    // Mission: find heading containing Mission and the following paragraph text
    const missionBlock = this.matchFirst(html, [
      /<h[12][^>]*>\s*[^<]*mission[^<]*<\/h[12]>[\s\S]{0,400}<p[^>]*>([\s\S]{40,600}?)<\/p>/i,
      /mission[^<]{0,50}:\s*<\/?(?:strong|b)>?\s*<p[^>]*>([\s\S]{40,600}?)<\/p>/i,
    ]);
    if (missionBlock) out.companyMission = this.cleanText(missionBlock).slice(0, 600);

    // If description not present, grab a long paragraph from the page as fallback
    if (!out.companyDescription) {
      const desc = this.matchFirst(html, [
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']{50,2000})["']/i,
        /<p[^>]*>([\s\S]{120,600}?)<\/p>/i,
      ]);
      if (desc) out.companyDescription = this.cleanText(desc).slice(0, 2000);
    }

    // Size heuristics: "10,000+ employees", "over 500 employees"
    const sizeText = this.matchFirst(html, [
      /([0-9][0-9.,]{2,})\+?\s*(?:employees|staff)\b/i,
      /over\s+([0-9][0-9.,]{2,})\s*(?:employees|staff)\b/i,
    ]);
    if (sizeText) out.companySize = sizeText.replace(/[,\.]/g, '') + '+';

    // JSON-LD might also be present on inner pages
    try {
      const jsonld = this.parseJsonLd(html);
      const org = jsonld.find(o => {
        const t = Array.isArray(o['@type']) ? o['@type'] : [o['@type']];
        return t.some((v: any) => typeof v === 'string' && /Organization|LocalBusiness|Corporation/i.test(v));
      }) as any;
      if (org) {
        if (!out.companyMission && typeof org?.slogan === 'string') out.companyMission = this.cleanText(org.slogan).slice(0, 600);
        if (!out.companyContactEmail && typeof org?.email === 'string') out.companyContactEmail = org.email.toLowerCase();
        if (!out.companyContactPhone && typeof org?.telephone === 'string') out.companyContactPhone = org.telephone;
        const nEmp = org.numberOfEmployees || org.employees || org.employee || org.staff;
        if (!out.companySize && nEmp) {
          if (typeof nEmp === 'number') out.companySize = String(nEmp);
          else if (typeof nEmp === 'string') out.companySize = nEmp;
          else if (typeof nEmp?.value === 'number') out.companySize = String(nEmp.value);
          else if (typeof nEmp?.minValue === 'number' && typeof nEmp?.maxValue === 'number') out.companySize = `${nEmp.minValue}-${nEmp.maxValue}`;
        }
      }
    } catch { /* ignore */ }

    return out;
  }

  private parseJsonLd(html: string): any[] {
    const out: any[] = [];
    const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m: RegExpExecArray | null;
    while ((m = scriptRegex.exec(html))) {
      const raw = m[1];
      try {
        const json = JSON.parse(raw.trim());
        if (Array.isArray(json)) out.push(...json);
        else out.push(json);
      } catch { /* skip invalid JSON-LD */ }
    }
    return out;
  }

  private toAbsoluteUrl(possibleUrl: string, origin: string): string {
    try {
      const u = new URL(possibleUrl, origin);
      return u.toString();
    } catch {
      return possibleUrl;
    }
  }

  private matchFirst(html: string, patterns: RegExp[]): string | null {
    for (const re of patterns) {
      const m = html.match(re);
      if (m && m[1]) return m[1];
    }
    return null;
  }

  private deriveCompanyNameFromHost(host: string): string | null {
    // Strip common subdomains
    const parts = host.split('.');
    if (parts.length <= 2) return parts[0] ? this.capitalize(parts[0]) : null;
    const core = parts.slice(-2)[0];
    return this.capitalize(core);
  }

  private capitalize(s: string): string { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  private buildGlassdoorSearchUrl(query: string): string {
    // User prefers direct Glassdoor search page rather than Google site query.
    return `https://www.glassdoor.com/Reviews/index.htm?keyword=${encodeURIComponent(query)}`;
  }

  // Attempt to resolve a direct Glassdoor company profile URL using Bing Web Search (optional)
  private async resolveGlassdoorProfileUrl(company: string): Promise<string | null> {
    const key = process.env.BING_SEARCH_API_KEY || process.env.AZURE_BING_SEARCH_KEY;
    if (!key || !company) return null;
    try {
      const q = `site:glassdoor.com "${company}" Reviews`;
      const url = new URL('https://api.bing.microsoft.com/v7.0/search');
      url.searchParams.set('q', q);
      url.searchParams.set('count', '5');
      url.searchParams.set('mkt', 'en-US');
      const res = await fetch(url.toString(), { headers: { 'Ocp-Apim-Subscription-Key': key } });
      if (!res.ok) return null;
      const json: any = await res.json();
      const items: any[] = json?.webPages?.value || [];
      const pick = items.find(i => typeof i?.url === 'string' && /glassdoor\.com\//i.test(i.url) && /(\/Reviews\/|\/Overview\/)/i.test(i.url));
      return pick?.url || null;
    } catch {
      return null;
    }
  }

  // Parse a subset of Google News RSS to article list
  private parseGoogleNewsRss(xml: string): Array<{ title: string; url: string; source?: string; publishedAt?: string; description?: string }> {
    const items: Array<{ title: string; url: string; source?: string; publishedAt?: string; description?: string }> = [];
    const itemRe = /<item>([\s\S]*?)<\/item>/gi;
    let m: RegExpExecArray | null;
    while ((m = itemRe.exec(xml))) {
      const block = m[1];
      const title = this.cleanText(this.capture(block, /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/i));
      const link = this.capture(block, /<link>([^<]+)<\/link>/i);
      const pub = this.capture(block, /<pubDate>([^<]+)<\/pubDate>/i);
      const source = this.cleanText(this.capture(block, /<source[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/source>|<source[^>]*>([\s\S]*?)<\/source>/i));
      if (link && title) {
        items.push({ title, url: link, source: source || undefined, publishedAt: pub || undefined });
      }
    }
    return items;
  }

  private capture(text: string, re: RegExp): string {
    const m = text.match(re);
    if (!m) return '';
    return (m[1] || m[2] || '').trim();
  }

  // Archive a job
  async archive(userId: string, jobId: string, reason?: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('jobs')
      .update({
        archivedAt: new Date().toISOString(),
        archiveReason: reason || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('userId', userId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return toApi(data);
  }

  // Restore an archived job
  async restore(userId: string, jobId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('jobs')
      .update({
        archivedAt: null,
        archiveReason: null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('userId', userId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return toApi(data);
  }

  // Permanently delete a job
  async delete(userId: string, jobId: string) {
    const client = this.supabase.getClient();
    const { error } = await client
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('userId', userId);

    if (error) throw new BadRequestException(error.message);
    return { success: true, message: 'Job deleted successfully' };
  }

  // Bulk archive multiple jobs
  async bulkArchive(userId: string, jobIds: string[], reason?: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('jobs')
      .update({
        archivedAt: new Date().toISOString(),
        archiveReason: reason || null,
        updatedAt: new Date().toISOString(),
      })
      .in('id', jobIds)
      .eq('userId', userId)
      .select();

    if (error) throw new BadRequestException(error.message);
    return { 
      success: true, 
      message: `${data.length} job(s) archived successfully`,
      count: data.length 
    };
  }

  // Interview Scheduling
  async scheduleInterview(userId: string, dto: any) {
    const client = this.supabase.getClient();
    
    // Verify job belongs to user
    const { data: job } = await client
      .from('jobs')
      .select('id')
      .eq('id', dto.jobId)
      .eq('userId', userId)
      .single();
    
    if (!job) throw new NotFoundException('Job not found');

    // Create interview record using job_id (UUID) instead of job_application_id (integer)
    const { data: interview, error } = await client
      .from('interviews')
      .insert({
        job_id: dto.jobId,  // ✅ Use UUID directly, not parseInt()
        user_id: userId,
        interview_type: dto.title || 'General Interview',
        title: dto.title,
        scheduled_at: dto.scheduledAt,
        duration: dto.duration || '60',
        location: dto.location,
        interviewer_name: dto.interviewerName,
        interviewer_email: dto.interviewerEmail,
        notes: dto.notes,
        details: dto.notes,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;

    // Create timeline event (only if you have a related job_application)
    // Since interviews now reference jobs table, skip this or create a matching job_application first
    try {
      // Optional: Create timeline event if you have a job_application_id mapping
      // For now, we'll skip it since we're using job_id
    } catch {
      // Ignore timeline errors
    }

    // Create reminder if requested
    if (dto.setReminder) {
      const reminderTime = this.calculateReminderTime(dto.scheduledAt, dto.reminderBefore || '1h');
      await client.from('reminders').insert({
        user_id: userId,
        related_id: interview.id,
        related_type: 'interview',
        type: 'interview',
        message: `Interview: ${dto.title}`,
        reminder_time: reminderTime,
        due_date: reminderTime,
      });
    }

    return interview;
  }

  async getInterviews(userId: string, jobId?: string) {
    const client = this.supabase.getClient();
    
    console.log('📅 [getInterviews] Called with:', { userId, jobId });
    
    try {
      // Try to select interviews with a proper join
      // If the foreign key name is different, Supabase might fail
      let query = client
        .from('interviews')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_at', { ascending: true });

      if (jobId) {
        query = query.eq('job_id', jobId);
        console.log('📅 [getInterviews] Filtering by jobId:', jobId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('❌ [getInterviews] Supabase error:', error);
        throw error;
      }
      
      console.log('✅ [getInterviews] Raw data from database:', data);
      
      // If we got data, try to fetch job details separately
      if (data && data.length > 0) {
        const interviewsWithJobs = await Promise.all(
          data.map(async (interview) => {
            if (interview.job_id) {
              const { data: job } = await client
                .from('jobs')
                .select('id, title, company')
                .eq('id', interview.job_id)
                .single();
              
              return { ...interview, job };
            }
            return interview;
          })
        );
        
        console.log('✅ [getInterviews] Enriched with job data:', interviewsWithJobs.length);
        return interviewsWithJobs;
      }
      
      console.log('✅ [getInterviews] Found interviews:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ [getInterviews] Unexpected error:', error);
      // Return empty array instead of throwing to prevent 500 errors
      return [];
    }
  }

  async updateInterview(userId: string, interviewId: string, dto: any) {
    const client = this.supabase.getClient();
    
    const updateData: any = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.scheduledAt) updateData.scheduled_at = dto.scheduledAt;
    if (dto.duration) updateData.duration = dto.duration;
    if (dto.location) updateData.location = dto.location;
    if (dto.interviewerName) updateData.interviewer_name = dto.interviewerName;
    if (dto.interviewerEmail) updateData.interviewer_email = dto.interviewerEmail;
    if (dto.notes) {
      updateData.notes = dto.notes;
      updateData.details = dto.notes;
    }
    if (dto.status) updateData.status = dto.status;

    // Outcome tracking fields
    if (dto.offerReceived !== undefined) updateData.offer_received = dto.offerReceived;
    if (dto.offerAccepted !== undefined) updateData.offer_accepted = dto.offerAccepted;
    if (dto.performanceRating !== undefined) updateData.performance_rating = dto.performanceRating;
    if (dto.prepTimeHours !== undefined) updateData.prep_time_hours = dto.prepTimeHours;
    if (dto.practiceSessionsUsed !== undefined) updateData.practice_sessions_used = dto.practiceSessionsUsed;
    
    // Convert strengths/weaknesses text to arrays for PostgreSQL
    if (dto.strengths) {
      const strengthsArray = dto.strengths
        .split(/[,\n•\-\*]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      updateData.strengths = strengthsArray;
    }
    if (dto.weaknesses) {
      const weaknessesArray = dto.weaknesses
        .split(/[,\n•\-\*]/)
        .map(w => w.trim())
        .filter(w => w.length > 0);
      updateData.weaknesses = weaknessesArray;
    }
    
    if (dto.feedback) updateData.feedback = dto.feedback;
    if (dto.interviewStage) updateData.interview_stage = dto.interviewStage;
    if (dto.interviewFormat) updateData.interview_format = dto.interviewFormat;
    if (dto.interviewDate) updateData.interview_date = dto.interviewDate;
    if (dto.companyName) updateData.company_name = dto.companyName;
    if (dto.companyType) updateData.company_type = dto.companyType;
    if (dto.companyIndustry) updateData.company_industry = dto.companyIndustry;
    if (dto.jobTitle) updateData.job_title = dto.jobTitle;

    const { data: interview, error } = await client
      .from('interviews')
      .update(updateData)
      .eq('id', interviewId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Skip timeline event since we don't have job_application_id anymore
    return interview;
  }

  // Analytics
  async getAnalytics(userId: string) {
    const client = this.supabase.getClient();

    // Total applications - using 'jobs' table (active jobs only)
    const { count: totalApps } = await client
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId)
      .is('archivedAt', null);

    // Applications by status
    const { data: statusData } = await client
      .from('jobs')
      .select('status')
      .eq('userId', userId)
      .is('archivedAt', null);

    const byStatus = (statusData || []).reduce((acc, job) => {
      const status = job.status || 'Interested';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Response rate calculation (percentage of total jobs that got a response)
    const totalJobs = totalApps || 0;
    const interested = byStatus['Interested'] || 0;
    const applied = byStatus['Applied'] || 0;
    const phoneScreen = byStatus['Phone Screen'] || 0;
    const interview = byStatus['Interview'] || 0;
    const offer = byStatus['Offer'] || 0;
    const rejected = byStatus['Rejected'] || 0;
    
    // Jobs that got a response (moved beyond Interested/Applied)
    const responded = phoneScreen + interview + offer + rejected;
    const responseRate = totalJobs > 0 ? ((responded / totalJobs) * 100).toFixed(1) : '0';

    // Time to offer (calculate from statusUpdatedAt for jobs with Offer status)
    const { data: offers } = await client
      .from('jobs')
      .select('createdAt, statusUpdatedAt')
      .eq('userId', userId)
      .eq('status', 'Offer')
      .is('archivedAt', null);

    let avgTimeToOffer = 0;
    if (offers && offers.length > 0) {
      const totalDays = offers.reduce((sum, job) => {
        if (!job.createdAt || !job.statusUpdatedAt) return sum;
        const start = new Date(job.createdAt).getTime();
        const end = new Date(job.statusUpdatedAt).getTime();
        const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgTimeToOffer = Math.round(totalDays / offers.length);
    }

    // Applications submitted over time (last 30 days)
    // Track when jobs moved to "Applied" status using job_history table
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: appliedHistory } = await client
      .from('job_history')
      .select('createdat')
      .eq('userid', userId)
      .eq('status', 'Applied')
      .gte('createdat', thirtyDaysAgo.toISOString());

    // Initialize all 30 days with zero counts
    const appsByDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      appsByDay[dateStr] = 0;
    }

    // Fill in actual counts from history
    (appliedHistory || []).forEach((record) => {
      if (record.createdat) {
        const day = new Date(record.createdat).toISOString().split('T')[0];
        if (appsByDay.hasOwnProperty(day)) {
          appsByDay[day]++;
        }
      }
    });

    // Upcoming interviews
    const { data: upcomingInterviews } = await client
      .from('interviews')
      .select('*')
      .eq('user_id', userId)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5);

    return {
      totalApplications: totalApps || 0,
      byStatus,
      responseRate: parseFloat(responseRate),
      avgTimeToOffer,
      applicationsByDay: appsByDay,
      upcomingInterviews: upcomingInterviews || [],
    };
  }

  // Automation Rules - no changes needed, uses your existing table structure
  async createAutomationRule(userId: string, dto: any) {
    const client = this.supabase.getClient();
    
    const { data, error } = await client
      .from('application_automation_rules')
      .insert({
        user_id: userId,
        rule_name: dto.ruleName,
        trigger_event: dto.triggerEvent,
        condition: dto.condition || {},
        action: dto.action,
        action_params: dto.actionParams || {},
        active: dto.active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAutomationRules(userId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('application_automation_rules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateAutomationRule(userId: string, ruleId: string, dto: any) {
    const client = this.supabase.getClient();
    
    const { data, error } = await client
      .from('application_automation_rules')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', ruleId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAutomationRule(userId: string, ruleId: string) {
    const client = this.supabase.getClient();
    
    const { error } = await client
      .from('application_automation_rules')
      .delete()
      .eq('id', ruleId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true, message: 'Rule deleted' };
  }

  // Helper methods
  private calculateReminderTime(scheduledAt: string, reminderBefore: string): string {
    const scheduled = new Date(scheduledAt);
    const match = reminderBefore.match(/^(\d+)(h|d|m)$/);
    
    if (!match) return new Date(scheduled.getTime() - 60 * 60 * 1000).toISOString();
    
    const [, amount, unit] = match;
    const num = parseInt(amount);
    
    switch (unit) {
      case 'm': return new Date(scheduled.getTime() - num * 60 * 1000).toISOString();
      case 'h': return new Date(scheduled.getTime() - num * 60 * 60 * 1000).toISOString();
      case 'd': return new Date(scheduled.getTime() - num * 24 * 60 * 60 * 1000).toISOString();
      default: return new Date(scheduled.getTime() - 60 * 60 * 1000).toISOString();
    }
  }

  async deleteInterview(userId: string, interviewId: string) {
    const client = this.supabase.getClient();
    
    const { error } = await client
      .from('interviews')
      .delete()
      .eq('id', interviewId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true, message: 'Interview deleted' };
  }

  // Job Skills Management
  async getJobSkills(userId: string, jobId: string) {
    const client = this.supabase.getClient();
    
    // Verify job ownership
    await this.verifyJobOwnership(userId, jobId);
    
    // Get skills directly from job_skills table (denormalized)
    const { data, error } = await client
      .from('job_skills')
      .select('skill_name, skill_category, req_level, weight')
      .eq('job_id', jobId);
    
    if (error) throw error;
    
    return (data || []).map((item: any) => ({
      skillName: item.skill_name,
      name: item.skill_name,
      category: item.skill_category,
      reqLevel: item.req_level,
      weight: item.weight
    }));
  }

  async addJobSkill(
    userId: string,
    jobId: string,
    skillId: string,
    reqLevel?: number,
    weight?: number
  ) {
    const client = this.supabase.getClient();
    
    // Verify job ownership
    await this.verifyJobOwnership(userId, jobId);
    
    // Get skill details from skills table
    const { data: skill } = await client
      .from('skills')
      .select('id, name, category')
      .eq('id', skillId)
      .single();
    
    if (!skill) {
      throw new BadRequestException('Skill not found');
    }
    
    // Add skill to job with denormalized data
    const { data, error } = await client
      .from('job_skills')
      .insert({
        job_id: jobId,
        skill_name: skill.name,
        skill_category: skill.category,
        req_level: reqLevel ?? null,
        weight: weight ?? 1.0
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') { // Duplicate key
        throw new BadRequestException('This skill is already added to the job');
      }
      throw error;
    }
    
    return { success: true, message: `Added skill: ${skill.name}`, data };
  }

  async removeJobSkill(userId: string, jobId: string, skillName: string) {
    const client = this.supabase.getClient();
    
    // Verify job ownership
    await this.verifyJobOwnership(userId, jobId);
    
    const { error } = await client
      .from('job_skills')
      .delete()
      .eq('job_id', jobId)
      .eq('skill_name', skillName);
    
    if (error) throw error;
    
    return { success: true, message: 'Skill removed from job' };
  }

  async updateJobSkill(
    userId: string,
    jobId: string,
    skillName: string,
    reqLevel?: number,
    weight?: number
  ) {
    const client = this.supabase.getClient();
    
    // Verify job ownership
    await this.verifyJobOwnership(userId, jobId);
    
    const updates: any = {};
    if (reqLevel !== undefined) updates.req_level = reqLevel;
    if (weight !== undefined) updates.weight = weight;
    
    const { data, error } = await client
      .from('job_skills')
      .update(updates)
      .eq('job_id', jobId)
      .eq('skill_name', skillName)
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, message: 'Skill updated', data };
  }

  private async verifyJobOwnership(userId: string, jobId: string) {
    const client = this.supabase.getClient();
    const { data: job } = await client
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('userId', userId)
      .single();
    
    if (!job) {
      throw new NotFoundException('Job not found or access denied');
    }
  }
}
