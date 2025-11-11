// src/lib/api.ts
import axios from 'axios';

console.log('API base:', import.meta.env.VITE_API_URL);

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
  
});

// Attach Authorization header from localStorage, if present
api.interceptors.request.use((config) => {
  try {
    const token = window.localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      // Preserve any existing Authorization header but prefer token from storage
      if (!('Authorization' in config.headers)) {
        (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch {
    // no-op if localStorage is unavailable
  }
  return config;
});

export type Job = {
  id: string;
  title: string;
  company: string;
  location?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  postingUrl?: string | null;
  deadline?: string | null;          // ISO date
  description?: string | null;       // <= 2000
  industry?: string | null;
  jobType?: string | null;
  status?: string;                   // pipeline stage
  statusUpdatedAt?: string | null;   // ISO timestamp
  notes?: string | null;
  negotiationNotes?: string | null;
  interviewNotes?: string | null;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  recruiterPhone?: string | null;
  hiringManagerName?: string | null;
  hiringManagerEmail?: string | null;
  hiringManagerPhone?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type NewJobPayload = Omit<Job, 'id'|'createdAt'|'updatedAt'>;

/* ---------- Endpoints ---------- */
export async function listJobs(status?: string): Promise<Job[]> {
  const params = status ? { status } : undefined;
  const { data } = await api.get('/jobs', { withCredentials: true, params });
  return data;
}

export async function createJob(payload: NewJobPayload): Promise<Job> {
  // enforce client-side max length just in case
  const toNum = (v: unknown) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const toStrOrNull = (v: unknown) => {
    const s = (v ?? '').toString().trim();
    return s.length ? s : null;
  };
  const toDateOrNull = (v: unknown) => {
    const s = (v ?? '').toString().trim();
    if (!s) return null;
    // Accept YYYY-MM-DD as-is or any parseable date string
    // Avoid timezone shifts by not forcing toISOString here
    return s;
  };

  const body = {
    title: toStrOrNull(payload.title)!,
    company: toStrOrNull(payload.company)!,
    location: toStrOrNull(payload.location),
    postingUrl: toStrOrNull(payload.postingUrl),
    deadline: toDateOrNull(payload.deadline),
    description: toStrOrNull((payload.description ?? '').slice(0, 2000)),
    industry: toStrOrNull(payload.industry),
    jobType: toStrOrNull(payload.jobType),
    salaryMin: toNum(payload.salaryMin),
    salaryMax: toNum(payload.salaryMax),
    // status intentionally omitted so backend default 'Interested' is used
  } as const;
  const { data } = await api.post('/jobs', body, { withCredentials: true });
  return data;
}

export async function updateJobStatus(id: string, status: string): Promise<Job> {
  const { data } = await api.patch(`/jobs/${id}/status`, { status }, { withCredentials: true });
  return data;
}

export async function bulkUpdateJobStatus(ids: string[], status: string): Promise<Job[]> {
  const { data } = await api.post('/jobs/bulk-status', { ids, status }, { withCredentials: true });
  return data;
}

export function daysInStage(job: Job): number | null {
  if (!job.statusUpdatedAt) return null;
  const start = new Date(job.statusUpdatedAt).getTime();
  if (isNaN(start)) return null;
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
}

export async function getJob(id: string): Promise<Job> {
  const { data } = await api.get(`/jobs/${id}`, { withCredentials: true });
  return data;
}

export type UpdateJobPayload = Partial<Omit<Job, 'id'|'createdAt'|'updatedAt'>>;

export async function updateJob(id: string, payload: UpdateJobPayload): Promise<Job> {
  const { data } = await api.patch(`/jobs/${id}`, payload, { withCredentials: true });
  return data;
}

export type JobHistoryItem = { id: string; status: string; note?: string | null; createdAt: string };
export async function listJobHistory(id: string): Promise<JobHistoryItem[]> {
  const { data } = await api.get(`/jobs/${id}/history`, { withCredentials: true });
  return data;
}