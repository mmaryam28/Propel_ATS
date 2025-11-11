import { BadRequestException, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateJobDto, JOB_STATUSES, JobStatus } from './dto/create-job.dto';
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
}
