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
  archivedAt?: string | null;        // ISO timestamp when archived
  archiveReason?: string | null;     // reason for archiving
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
    source: toStrOrNull((payload as any).source),
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

// Archive a job
export async function archiveJob(id: string, reason?: string): Promise<Job> {
  const { data } = await api.patch(`/jobs/${id}/archive`, { reason }, { withCredentials: true });
  return data;
}

// Restore an archived job
export async function restoreJob(id: string): Promise<Job> {
  const { data } = await api.patch(`/jobs/${id}/restore`, {}, { withCredentials: true });
  return data;
}

// Delete a job permanently
export async function deleteJob(id: string): Promise<{ success: boolean; message: string }> {
  const { data } = await api.delete(`/jobs/${id}`, { withCredentials: true });
  return data;
}

// List archived jobs
export async function listArchivedJobs(): Promise<Job[]> {
  const { data } = await api.get('/jobs', { withCredentials: true, params: { archived: 'true' } });
  return data;
}

// Bulk archive multiple jobs
export async function bulkArchiveJobs(ids: string[], reason?: string): Promise<{ success: boolean; message: string; count: number }> {
  const { data } = await api.post('/jobs/bulk-archive', { ids, reason }, { withCredentials: true });
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

// ========== Statistics API ==========

export interface JobStatistics {
  totalJobs: number;
  byStatus: {
    interested: number;
    applied: number;
    phoneScreen: number;
    interview: number;
    offer: number;
    rejected: number;
  };
  interviewSuccessRate: number;
  responseRate: number;
  averageTimeInStages: {
    interested: number | null;
    applied: number | null;
    phoneScreen: number | null;
    interview: number | null;
  };
  deadlineAdherence: {
    upcoming: number;
    missed: number;
    adherenceRate: number;
  };
  timeToOffer: number | null;
}

export interface MonthlyVolume {
  month: string;
  count: number;
}

export async function getStatisticsOverview(startDate?: string, endDate?: string): Promise<JobStatistics> {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const { data } = await api.get('/statistics/overview', { 
    params,
    withCredentials: true 
  });
  return data;
}

export async function getMonthlyVolume(months: number = 12, startDate?: string, endDate?: string): Promise<MonthlyVolume[]> {
  const params: any = { months };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const { data } = await api.get('/statistics/monthly-volume', {
    params,
    withCredentials: true,
  });
  return data;
}

export async function exportStatisticsCSV(): Promise<void> {
  const response = await api.get('/statistics/export-csv', {
    withCredentials: true,
    responseType: 'blob',
  });
  
  // Create download link
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `job-statistics-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Interview Scheduling
export type Interview = {
  id: string;
  job_id?: string; // ✅ Now references jobs table (UUID)
  job_application_id?: number; // ✅ Legacy field (integer)
  user_id: string;
  interview_type?: string;
  title?: string;
  scheduled_at: string;
  duration?: string;
  location?: string;
  interviewer_name?: string;
  interviewer_email?: string;
  notes?: string;
  details?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  // Joined job data (if using .select('*, job:jobs(...)'))
  job?: {
    title: string;
    company: string;
  };
};

export async function scheduleInterview(data: {
  jobId: string; // ✅ This is a UUID, not an integer
  title: string;
  scheduledAt: string;
  duration?: string;
  location?: string;
  interviewerName?: string;
  interviewerEmail?: string;
  notes?: string;
  setReminder?: boolean;
  reminderBefore?: string;
}): Promise<Interview> {
  const { data: interview } = await api.post('/jobs/interviews', data, { withCredentials: true });
  return interview;
}

export async function getInterviews(jobId?: string) {
  const params = jobId ? { jobId } : {};
  console.log('📅 [API] Fetching interviews with params:', params);
  
  const { data } = await api.get('/jobs/interviews', { withCredentials: true, params });
  
  console.log('✅ [API] Interviews response:', data);
  console.log('📊 [API] Interview count:', data?.length || 0);
  
  return data;
}

export type InterviewPrep = {
  companyResearch: string;
  questionBank: {
    behavioral: string[];
    technical: string[];
    situational: string[];
    companySpecific: string[];
  };
  mockInterview: {
    intro: string;
    questions: { id: string; type: string; text: string }[];
    summary: string;
  };
  technicalPrep: {
    overview: string;
    codingChallenge: { prompt: string; hint: string; solutionOutline: string };
    systemDesign: { prompt: string; keyPoints: string[] };
  };
  checklist: {
    items: { id: string; label: string; category: string; suggestedTime?: string }[];
  };
};

export async function getInterviewPrep(interviewId: string): Promise<InterviewPrep> {
  const { data } = await api.get(`/interview/${interviewId}/prep`, { withCredentials: true });
  return data;
}

export async function generateInterviewSection(interviewId: string, section: string) {
  const { data } = await api.post(
    `/interview/${interviewId}/generate-section`,
    {},
    { withCredentials: true, params: { section } }
  );
  return data;
}

export async function generateInterviewAll(interviewId: string) {
  const { data } = await api.post(
    `/interview/${interviewId}/generate-all`,
    {},
    { withCredentials: true }
  );
  return data;
}



export async function updateInterview(id: string, data: Partial<Interview>): Promise<Interview> {
  const { data: interview } = await api.patch(`/jobs/interviews/${id}`, data, { withCredentials: true });
  return interview;
}

export async function deleteInterview(id: string) {
  const { data } = await api.delete(`/jobs/interviews/${id}`, { withCredentials: true });
  return data;
}

// Analytics
export async function getAnalytics() {
  const { data } = await api.get('/jobs/analytics', { withCredentials: true });
  return data;
}

// Automation Rules
export async function createAutomationRule(data: any) {
  const { data: rule } = await api.post('/jobs/automation-rules', data, { withCredentials: true });
  return rule;
}

export async function getAutomationRules() {
  const { data } = await api.get('/jobs/automation-rules', { withCredentials: true });
  return data;
}

export async function updateAutomationRule(id: string, data: any) {
  const { data: rule } = await api.patch(`/jobs/automation-rules/${id}`, data, { withCredentials: true });
  return rule;
}

export async function deleteAutomationRule(id: string) {
  const { data } = await api.delete(`/jobs/automation-rules/${id}`, { withCredentials: true });
  return data;
}

// Market Intelligence
export async function getMarketIntelligence() {
  const { data } = await api.get('/market/intelligence', { withCredentials: true });
  return data;
}

// UC-100: Salary Analytics
export async function generateSalaryAnalytics(payload: {
  userId?: string;
  title?: string;
  location?: string;
  experienceLevel?: string;
  currentSalary?: number;
}) {
  const { data } = await api.post('/salary/analysis', payload, { withCredentials: true });
  return data;
}

// UC-106: Custom Report Generation
export async function getCustomReportData(
  metrics: string[],
  dateRange: { start: string; end: string },
  filters: { company?: string; role?: string; industry?: string }
) {
  const params: any = {
    metrics: metrics.join(','),
    ...filters,
  };
  if (dateRange.start) params.startDate = dateRange.start;
  if (dateRange.end) params.endDate = dateRange.end;

  // Fetch data from multiple endpoints
  const promises = [];
  
  // Always fetch basic statistics with date range
  promises.push(api.get('/statistics/overview', { withCredentials: true, params }));
  
  // Always try to fetch networking and application analytics (they'll handle date filtering on backend)
  promises.push(api.get('/networking/analytics/overview', { withCredentials: true, params }).catch(() => ({ data: {} })));
  promises.push(api.get('/networking/analytics/roi', { withCredentials: true, params }).catch(() => ({ data: {} })));
  promises.push(api.get('/application-analytics/dashboard', { withCredentials: true, params }).catch(() => ({ data: {} })));
  promises.push(api.get('/application-analytics/success-rates', { withCredentials: true, params }).catch(() => ({ data: {} })));

  const results = await Promise.all(promises);
  
  return {
    statistics: results[0]?.data || {},
    networking: results[1]?.data || {},
    networkingROI: results[2]?.data || {},
    applicationAnalytics: results[3]?.data || {},
    successRates: results[4]?.data || {},
  };
}

export async function shareReport(email: string, reportData: any, message?: string) {
  const { data } = await api.post('/reports/share', {
    email,
    reportData,
    message,
  }, { withCredentials: true });
  return data;
}