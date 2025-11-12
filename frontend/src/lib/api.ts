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
  // Company profile (UC-043)
  companySize?: string | null;
  companyWebsite?: string | null;
  companyDescription?: string | null;
  companyMission?: string | null;
  companyLogoUrl?: string | null;
  companyContactEmail?: string | null;
  companyContactPhone?: string | null;
  glassdoorRating?: number | null;
  glassdoorUrl?: string | null;
  // UC-042: Materials linkage
  resumeVersionId?: string | null;
  coverLetterVersionId?: string | null;
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
export async function listJobs(
  status?: string,
  search?: string,
  industry?: string,
  location?: string,
  salaryMin?: number,
  salaryMax?: number,
  deadlineFrom?: string,
  deadlineTo?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<Job[]> {
  const params: any = {};
  if (status) params.status = status;
  if (search) params.search = search;
  if (industry) params.industry = industry;
  if (location) params.location = location;
  if (salaryMin) params.salaryMin = salaryMin.toString();
  if (salaryMax) params.salaryMax = salaryMax.toString();
  if (deadlineFrom) params.deadlineFrom = deadlineFrom;
  if (deadlineTo) params.deadlineTo = deadlineTo;
  if (sortBy) params.sortBy = sortBy;
  if (sortOrder) params.sortOrder = sortOrder;
  const { data } = await api.get('/jobs', { withCredentials: true, params: Object.keys(params).length ? params : undefined });
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
    // Optional company profile fields at creation time
    companySize: toStrOrNull((payload as any).companySize),
    companyWebsite: toStrOrNull((payload as any).companyWebsite),
    companyDescription: toStrOrNull((payload as any).companyDescription),
    companyMission: toStrOrNull((payload as any).companyMission),
    companyLogoUrl: toStrOrNull((payload as any).companyLogoUrl),
    companyContactEmail: toStrOrNull((payload as any).companyContactEmail),
    companyContactPhone: toStrOrNull((payload as any).companyContactPhone),
    glassdoorRating: (payload as any).glassdoorRating ?? null,
    glassdoorUrl: toStrOrNull((payload as any).glassdoorUrl),
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


export type JobMaterialsHistoryItem = { id: string; resumeVersionId?: string | null; coverLetterVersionId?: string | null; changedAt?: string | null };
export async function listJobMaterialsHistory(id: string): Promise<JobMaterialsHistoryItem[]> {
  const { data } = await api.get(`/jobs/${id}/materials-history`, { withCredentials: true });
  return data;
}

export type CompanyNews = { company: string; articles: { title: string; url: string; source?: string; publishedAt?: string; description?: string }[] };
export async function getCompanyNews(id: string): Promise<CompanyNews> {
  const { data } = await api.get(`/jobs/${id}/company-news`, { withCredentials: true });
  return data;
}

export type ImportJobResponse = {
  success: boolean;
  status: 'success' | 'partial' | 'failed';
  data: {
    title?: string;
    company?: string;
    location?: string;
    description?: string;
    postingUrl: string;
  };
  message: string;
};

export async function importJobFromUrl(url: string): Promise<ImportJobResponse> {
  const { data } = await api.post('/jobs/import-from-url', { url }, { withCredentials: true });
  return data;
}

// Company enrichment (auto-populate profile fields from a company or job URL)
export type EnrichCompanyResponse = {
  success: boolean;
  message: string;
  data: {
    company?: string | null;
    companyWebsite?: string | null;
    companyDescription?: string | null;
    companyMission?: string | null;
    companyLogoUrl?: string | null;
    companyContactEmail?: string | null;
    companyContactPhone?: string | null;
    companySize?: string | null;
    glassdoorUrl?: string | null;
  };
};

export async function enrichCompanyFromUrl(url: string): Promise<EnrichCompanyResponse> {
  const { data } = await api.post('/jobs/enrich-company', { url }, { withCredentials: true });
  return data;
}


export async function getMaterialsUsage(): Promise<{ resume: { id: string; count: number }[]; coverLetter: { id: string; count: number }[] }> {
  const { data } = await api.get('/jobs/materials/usage', { withCredentials: true });
  return data;
}


export async function getUserMaterialDefaults(): Promise<{ defaultResumeVersionId: string | null; defaultCoverLetterVersionId: string | null }> {
  const { data } = await api.get('/jobs/materials/defaults', { withCredentials: true });
  return data;
}

export async function setUserMaterialDefaults(payload: { defaultResumeVersionId?: string | null; defaultCoverLetterVersionId?: string | null }) {
  const { data } = await api.post('/jobs/materials/defaults', payload, { withCredentials: true });
  return data as { defaultResumeVersionId: string | null; defaultCoverLetterVersionId: string | null };
}