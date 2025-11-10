import { BadRequestException, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateJobDto } from './dto/create-job.dto';

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
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
    userId: row.userId ?? row.user_id,
  };
}

@Injectable()
export class JobsService {
  constructor(private supabase: SupabaseService) {}

  async list(userId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('jobs')
      .select('*')
      .eq('userId', String(userId))
      .order('createdAt', { ascending: false });
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
}
