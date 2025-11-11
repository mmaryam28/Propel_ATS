import { BadRequestException, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateJobDto, JOB_STATUSES, JobStatus } from './dto/create-job.dto';
import { ImportJobResponse } from './dto/import-job.dto';

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
    salaryMin: toInt(dto.salaryMin),
    salaryMax: toInt(dto.salaryMax),
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
    salaryMin: row.salaryMin ?? row.salary_min ?? null,
    salaryMax: row.salaryMax ?? row.salary_max ?? null,
    status: row.status ?? null,
    statusUpdatedAt: row.statusUpdatedAt ?? row.status_updated_at ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
    userId: row.userId ?? row.user_id,
  };
}

@Injectable()
export class JobsService {
  constructor(private supabase: SupabaseService) {}

  async list(userId: string, status?: JobStatus) {
    const client = this.supabase.getClient();
    let query = client
      .from('jobs')
      .select('*')
      .eq('userId', String(userId))
      .order('createdAt', { ascending: false });
    if (status) {
      query = query.eq('status', status);
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
    const payload = toDb({ ...dto, userId });
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
    return (data || []).map(toApi);
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
        
        if (!extractedData.title && !extractedData.company) {
          return {
            success: false,
            status: 'failed',
            data: { postingUrl: url },
            message: 'Could not extract job details from URL. Please enter details manually.',
          };
        }

        const hasAllFields = extractedData.title && extractedData.company && extractedData.description;
        
        return {
          success: true,
          status: hasAllFields ? 'success' : 'partial',
          data: {
            ...extractedData,
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
}
