import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";
import { Toast } from "../components/Toast";
import JobRequirementsMatch from "../components/JobRequirementsMatch";
import { getJob, updateJob, listJobHistory, getCompanyNews, enrichCompanyFromUrl, archiveJob, deleteJob, restoreJob, listJobMaterialsHistory, getUserMaterialDefaults, setUserMaterialDefaults, getResumeVersions, getCoverLetters, downloadResumePDF, getResumeDetails, getCoverLetterDetails, downloadCoverLetterPDF } from "../lib/api";
import ScheduleInterviewModal from "../components/ScheduleInterviewModal";
import InterviewOutcomeModal from "../components/InterviewOutcomeModal";
import EmailIntegration from "../components/EmailIntegration";
import { useAnalytics } from "../contexts/AnalyticsContext";
import SalaryBenchmarks from "../components/SalaryBenchmarks";

export default function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { triggerRefresh } = useAnalytics();
  const [job, setJob] = React.useState(null);
  const [userId, setUserId] = React.useState(null);
  const [edit, setEdit] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [history, setHistory] = React.useState([]);
  const [news, setNews] = React.useState({ company: '', articles: [] });
  const [importUrl, setImportUrl] = React.useState("");
  const [importing, setImporting] = React.useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [archiveReason, setArchiveReason] = React.useState("");
  const [archiving, setArchiving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [archivedJobId, setArchivedJobId] = React.useState(null);
  const [materialsHistory, setMaterialsHistory] = React.useState([]);
  const [defaults, setDefaults] = React.useState({ defaultResumeVersionId: null, defaultCoverLetterVersionId: null });
  const [showScheduleInterview, setShowScheduleInterview] = React.useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = React.useState(false);
  const [selectedInterview, setSelectedInterview] = React.useState(null);
  const [interviews, setInterviews] = React.useState([]);
  const [resumeVersions, setResumeVersions] = React.useState([]);
  const [coverLetters, setCoverLetters] = React.useState([]);
  const [showDocumentModal, setShowDocumentModal] = React.useState(false);
  const [documentModalContent, setDocumentModalContent] = React.useState(null);
  const [loadingDocument, setLoadingDocument] = React.useState(false);

  React.useEffect(() => { 
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  React.useEffect(() => { (async () => {
    try {
      const [j, h, n, mh, defs, ints, resumes, letters] = await Promise.all([
        getJob(jobId),
        listJobHistory(jobId).catch(() => []),
        getCompanyNews(jobId).catch(() => ({ company: '', articles: [] })),
        listJobMaterialsHistory(jobId).catch(() => []),
        getUserMaterialDefaults().catch(() => ({ defaultResumeVersionId: null, defaultCoverLetterVersionId: null })),
        (async () => { const { getInterviews } = await import('../lib/api'); return getInterviews(jobId); })().catch(() => []),
        getResumeVersions().catch(() => []),
        getCoverLetters().catch(() => []),
      ]);
      setJob(j); setHistory(h); setNews(n); setMaterialsHistory(mh); setDefaults(defs); setInterviews(ints);
      setResumeVersions(resumes); setCoverLetters(letters);
    } catch { setError("Failed to load job"); }
  })(); }, [jobId]);

  function setField(key, value) { 
    console.log('setField called:', key, value);
    setJob(j => ({ ...j, [key]: value })); 
  }

  async function onImport() {
    if (!importUrl) return;
    setImporting(true);
    setError("");
    try {
      const res = await enrichCompanyFromUrl(importUrl);
      if (res?.data) {
        setJob(j => ({
          ...j,
          company: res.data.company || j.company,
          companyWebsite: res.data.companyWebsite ?? j.companyWebsite,
          companyDescription: res.data.companyDescription ?? j.companyDescription,
          companyLogoUrl: res.data.companyLogoUrl ?? j.companyLogoUrl,
          companyContactEmail: res.data.companyContactEmail ?? j.companyContactEmail,
          companyContactPhone: res.data.companyContactPhone ?? j.companyContactPhone,
          companySize: res.data.companySize ?? j.companySize,
          glassdoorUrl: res.data.glassdoorUrl ?? j.glassdoorUrl,
        }));
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Import failed";
      setError(Array.isArray(msg) ? msg.join("; ") : msg);
    } finally {
      setImporting(false);
    }
  }

  async function onSave() {
    if (!job) return;
    setSaving(true); setError("");
    try {
      // Format deadline to avoid timezone issues
      let deadlineValue = job.deadline ?? null;
      if (deadlineValue && !deadlineValue.includes('T')) {
        // If it's just a date (YYYY-MM-DD), add time at noon UTC
        deadlineValue = deadlineValue + 'T12:00:00.000Z';
      }
      
      console.log('JobDetails - Saving with source:', job.source);
      console.log('JobDetails - resumeVersionId before payload:', job.resumeVersionId, typeof job.resumeVersionId);
      console.log('JobDetails - coverLetterVersionId before payload:', job.coverLetterVersionId, typeof job.coverLetterVersionId);
      
      const payload = {
        title: job.title,
        company: job.company,
        location: job.location ?? null,
        postingUrl: job.postingUrl ?? null,
        deadline: deadlineValue,
        description: job.description ?? null,
        industry: job.industry ?? null,
        jobType: job.jobType ?? null,
        source: job.source ?? null,
        salaryMin: job.salaryMin ?? null,
        salaryMax: job.salaryMax ?? null,
        // Company profile
        companySize: job.companySize ?? null,
        companyWebsite: job.companyWebsite ?? null,
  companyDescription: job.companyDescription ?? null,
        companyLogoUrl: job.companyLogoUrl ?? null,
        companyContactEmail: job.companyContactEmail ?? null,
        companyContactPhone: job.companyContactPhone ?? null,
        glassdoorRating: job.glassdoorRating ?? null,
        glassdoorUrl: job.glassdoorUrl ?? null,
        notes: job.notes ?? null,
        negotiationNotes: job.negotiationNotes ?? null,
        interviewNotes: job.interviewNotes ?? null,
        recruiterName: job.recruiterName ?? null,
        recruiterEmail: job.recruiterEmail ?? null,
        recruiterPhone: job.recruiterPhone ?? null,
        hiringManagerName: job.hiringManagerName ?? null,
        hiringManagerEmail: job.hiringManagerEmail ?? null,
        hiringManagerPhone: job.hiringManagerPhone ?? null,
        // UC-042 materials linkage
        resumeVersionId: job.resumeVersionId ?? null,
        coverLetterVersionId: job.coverLetterVersionId ?? null,
      };
      console.log('JobDetails - Final payload:', payload);
      const updated = await updateJob(jobId, payload);
      setJob(updated);
      setEdit(false);
  // refresh materials history after save
  try { setMaterialsHistory(await listJobMaterialsHistory(jobId)); } catch {}
      // Trigger analytics refresh if status changed
      if (payload.status !== job.status) {
        triggerRefresh();
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to save";
      setError(Array.isArray(msg) ? msg.join("; ") : msg);
    } finally { setSaving(false); }
  }

  async function viewResumeDetails(resumeId) {
    setLoadingDocument(true);
    setShowDocumentModal(true);
    try {
      const details = await getResumeDetails(resumeId);
      setDocumentModalContent({ type: 'resume', data: details });
    } catch (e) {
      setDocumentModalContent({ type: 'error', message: 'Failed to load resume details' });
    } finally {
      setLoadingDocument(false);
    }
  }

  async function viewCoverLetterDetails(coverLetterId) {
    setLoadingDocument(true);
    setShowDocumentModal(true);
    try {
      const details = await getCoverLetterDetails(coverLetterId);
      setDocumentModalContent({ type: 'coverletter', data: details });
    } catch (e) {
      setDocumentModalContent({ type: 'error', message: 'Failed to load cover letter details' });
    } finally {
      setLoadingDocument(false);
    }
  }

  async function onArchive() {
    if (!job) return;
    setArchiving(true);
    setError("");
    try {
      await archiveJob(jobId, archiveReason || undefined);
      setArchivedJobId(jobId);
      setShowToast(true);
      setShowArchiveConfirm(false);
      // Trigger analytics refresh
      triggerRefresh();
      // Delay navigation to allow undo
      setTimeout(() => {
        if (archivedJobId) navigate('/jobs');
      }, 5000);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to archive";
      setError(Array.isArray(msg) ? msg.join("; ") : msg);
    } finally {
      setArchiving(false);
    }
  }

  async function handleUndo() {
    if (!archivedJobId) return;
    try {
      await restoreJob(archivedJobId);
      setShowToast(false);
      setArchivedJobId(null);
      // Reload the job data
      const j = await getJob(jobId);
      setJob(j);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to undo";
      setError(Array.isArray(msg) ? msg.join("; ") : msg);
    }
  }

  async function onDelete() {
    if (!job) return;
    setDeleting(true);
    setError("");
    try {
      await deleteJob(jobId);
      navigate('/jobs');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to delete";
      setError(Array.isArray(msg) ? msg.join("; ") : msg);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleInterviewScheduled(interview) {
    setInterviews(prev => [...prev, interview]);
  }

  if (!job) return <div className="text-sm text-gray-600">Loading…</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{job.title}</h1>
          <p className="text-sm text-gray-600">{job.company}</p>
        </div>
        <div className="flex gap-2">
          {!edit && (
            <>
              <Link to="/jobs/calendar" className="btn btn-secondary">
                📅 View Calendar
              </Link>
              <button className="btn btn-secondary" onClick={() => setShowScheduleInterview(true)}>
                Schedule Interview
              </button>
              <button className="btn btn-secondary" onClick={() => setEdit(true)}>Edit</button>
              <button className="btn btn-ghost" onClick={() => setShowArchiveConfirm(true)}>Archive</button>
              <button className="btn btn-ghost text-red-600 hover:bg-red-50" onClick={() => setShowDeleteConfirm(true)}>Delete</button>
            </>
          )}
          {edit && (
            <>
              <button className="btn btn-ghost" onClick={() => setEdit(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={onSave} disabled={saving}>{saving?"Saving…":"Save"}</button>
            </>
          )}
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white bg-[var(--primary-color)] hover:brightness-90"
          >
            <Icon name="chevronLeft" variant="white" />
            Back
          </Link>
        </div>
      </div>
      {/* Application Materials */}
      <Card variant="default" size="large">
        <Card.Header>
          <div className="flex items-center justify-between w-full">
            <Card.Title>Application Materials</Card.Title>
            {!edit && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                Defaults: Resume {defaults.defaultResumeVersionId ? <span className="font-mono">{defaults.defaultResumeVersionId}</span> : '—'} • Cover Letter {defaults.defaultCoverLetterVersionId ? <span className="font-mono">{defaults.defaultCoverLetterVersionId}</span> : '—'}
              </div>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="form-label">Resume Version</div>
              {edit ? (
                <select 
                  className="input w-full" 
                  value={job.resumeVersionId || ""} 
                  onChange={e=>setField('resumeVersionId', e.target.value || null)}
                >
                  <option value="">Select a resume...</option>
                  {resumeVersions.map(resume => (
                    <option key={resume.id} value={resume.id}>
                      {resume.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm">
                  {resumeVersions.find(r => r.id === job.resumeVersionId)?.title || job.resumeVersionId || '—'}
                </div>
              )}
              {job.resumeVersionId && !edit && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => viewResumeDetails(job.resumeVersionId)}
                    className="text-xs text-[var(--primary-color)] hover:underline flex items-center gap-1"
                  >
                    <Icon name="eye" size={14} />
                    View Details
                  </button>
                </div>
              )}
            </div>
            <div>
              <div className="form-label">Cover Letter Version</div>
              {edit ? (
                <select 
                  className="input w-full" 
                  value={job.coverLetterVersionId || ""} 
                  onChange={e=>setField('coverLetterVersionId', e.target.value || null)}
                >
                  <option value="">Select a cover letter...</option>
                  {coverLetters.map(letter => (
                    <option key={letter.id} value={letter.id}>
                      {letter.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm">
                  {coverLetters.find(c => c.id === job.coverLetterVersionId)?.title || job.coverLetterVersionId || '—'}
                </div>
              )}
              {job.coverLetterVersionId && !edit && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => viewCoverLetterDetails(job.coverLetterVersionId)}
                    className="text-xs text-[var(--primary-color)] hover:underline flex items-center gap-1"
                  >
                    <Icon name="eye" size={14} />
                    View Details
                  </button>
                </div>
              )}
            </div>
          </div>
          {!edit && (
            <div className="mt-4 flex gap-2">
              <button
                className="btn btn-secondary"
                onClick={async ()=>{
                  try {
                    const next = await setUserMaterialDefaults({ defaultResumeVersionId: job.resumeVersionId ?? null, defaultCoverLetterVersionId: job.coverLetterVersionId ?? null });
                    setDefaults(next);
                  } catch {}
                }}
                disabled={!job.resumeVersionId && !job.coverLetterVersionId}
              >
                Set these as my defaults
              </button>
            </div>
          )}
        </Card.Body>
      </Card>


      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

  {/* Company Profile card */}
  <Card variant="default" size="large">
        <Card.Header>
          <div className="flex items-center justify-between gap-2 w-full">
            <Card.Title>Company Profile</Card.Title>
            {edit && (
              <div className="flex items-center gap-2 max-w-[480px] w-full">
                <input
                  className="input flex-1"
                  placeholder="Paste company or job URL to import"
                  value={importUrl}
                  onChange={e=>setImportUrl(e.target.value)}
                />
                <button className="btn btn-secondary whitespace-nowrap" onClick={onImport} disabled={importing || !importUrl}>
                  {importing ? 'Importing…' : 'Import'}
                </button>
              </div>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex items-center gap-4">
              {job.companyLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={job.companyLogoUrl} alt={`${job.company} logo`} className="h-12 w-12 rounded object-contain bg-white border" />
              ) : (
                <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">Logo</div>
              )}
              <div>
                <div className="form-label">Website</div>
                {edit ? (
                  <input className="input" value={job.companyWebsite||""} onChange={e=>setField('companyWebsite', e.target.value)} />
                ) : job.companyWebsite ? (
                  <a className="text-sm text-[var(--primary-color)]" href={job.companyWebsite} target="_blank" rel="noreferrer">{job.companyWebsite}</a>
                ) : (
                  <div className="text-sm">—</div>
                )}
              </div>
            </div>
            <div>
              <div className="form-label">Company Size</div>
              {edit ? (
                <input className="input" value={job.companySize||""} onChange={e=>setField('companySize', e.target.value)} />
              ) : (
                <div className="text-sm">{job.companySize || "—"}</div>
              )}
            </div>
            <div>
              <div className="form-label">Company Contact Email</div>
              {edit ? (
                <input className="input" value={job.companyContactEmail||""} onChange={e=>setField('companyContactEmail', e.target.value)} />
              ) : (
                <div className="text-sm">{job.companyContactEmail || "—"}</div>
              )}
            </div>
            <div>
              <div className="form-label">Company Contact Phone</div>
              {edit ? (
                <input className="input" value={job.companyContactPhone||""} onChange={e=>setField('companyContactPhone', e.target.value)} />
              ) : (
                <div className="text-sm">{job.companyContactPhone || "—"}</div>
              )}
            </div>
            <div className="sm:col-span-2">
              <div className="form-label">Company Description</div>
              {edit ? (
                <textarea className="input h-24" value={job.companyDescription||""} onChange={e=>setField('companyDescription', e.target.value)} />
              ) : (
                <div className="text-sm whitespace-pre-wrap">{job.companyDescription || "—"}</div>
              )}
            </div>
            {/* Mission Statement removed as requested */}
            <div>
              <div className="form-label">Glassdoor Rating</div>
              {edit ? (
                <input type="number" step="0.1" min="0" max="5" className="input" value={job.glassdoorRating ?? ''} onChange={e=>setField('glassdoorRating', e.target.value)} />
              ) : (
                <div className="text-sm">{job.glassdoorRating ?? "—"}</div>
              )}
            </div>
            <div>
              <div className="form-label">Glassdoor URL</div>
              {edit ? (
                <input className="input" value={job.glassdoorUrl||""} onChange={e=>setField('glassdoorUrl', e.target.value)} />
              ) : job.glassdoorUrl ? (
                <a className="text-sm text-[var(--primary-color)]" href={job.glassdoorUrl} target="_blank" rel="noreferrer">View on Glassdoor</a>
              ) : (
                <div className="text-sm">—</div>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Core Job Summary card */}
      <Card variant="default" size="large">
        <Card.Body className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="form-label">Location</div>
            {edit ? (
              <input className="input" value={job.location||""} onChange={e=>setField('location', e.target.value)} />
            ) : (<div className="text-sm">{job.location || "—"}</div>)}
          </div>
          <div>
            <div className="form-label">Job Type</div>
            {edit ? (
              <input className="input" value={job.jobType||""} onChange={e=>setField('jobType', e.target.value)} />
            ) : (<div className="text-sm">{job.jobType || "—"}</div>)}
          </div>
          <div>
            <div className="form-label">Industry</div>
            {edit ? (
              <input className="input" value={job.industry||""} onChange={e=>setField('industry', e.target.value)} />
            ) : (<div className="text-sm">{job.industry || "—"}</div>)}
          </div>
          <div>
            <div className="form-label">Source</div>
            {edit ? (
              <select className="input" value={job.source || "Direct Application"} onChange={e=>setField('source', e.target.value)}>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Company Website">Company Website</option>
                <option value="Referral">Referral</option>
                <option value="Recruiter Contact">Recruiter Contact</option>
                <option value="Indeed">Indeed</option>
                <option value="Glassdoor">Glassdoor</option>
                <option value="AngelList">AngelList</option>
                <option value="Networking Event">Networking Event</option>
                <option value="Cold Application">Cold Application</option>
                <option value="Other">Other</option>
              </select>
            ) : (<div className="text-sm">{job.source || "Direct Application"}</div>)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="form-label">Salary Min</div>
              {edit ? (
                <input type="number" className="input" value={job.salaryMin ?? ''} onChange={e=>setField('salaryMin', e.target.value)} />
              ) : (<div className="text-sm">{job.salaryMin ?? "—"}</div>)}
            </div>
            <div>
              <div className="form-label">Salary Max</div>
              {edit ? (
                <input type="number" className="input" value={job.salaryMax ?? ''} onChange={e=>setField('salaryMax', e.target.value)} />
              ) : (<div className="text-sm">{job.salaryMax ?? "—"}</div>)}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="form-label">Posting URL</div>
            {edit ? (
              <input className="input" value={job.postingUrl||""} onChange={e=>setField('postingUrl', e.target.value)} />
            ) : job.postingUrl ? (
              <a className="text-sm text-[var(--primary-color)]" href={job.postingUrl} target="_blank" rel="noreferrer">Open posting</a>
            ) : (<div className="text-sm">—</div>)}
          </div>
          <div>
            <div className="form-label">Deadline</div>
            {edit ? (
              <input type="date" className="input" value={job.deadline?.split('T')[0] || ""} onChange={e=>setField('deadline', e.target.value)} />
            ) : job.deadline ? (
              <div className="text-sm">{new Date(job.deadline).toLocaleDateString()}</div>
            ) : (<div className="text-sm">—</div>)}
          </div>
        </Card.Body>
      </Card>

      {/* Description */}
      <Card variant="default" size="large">
        <Card.Header>
          <Card.Title>Description</Card.Title>
        </Card.Header>
        <Card.Body>
          {edit ? (
            <textarea className="input h-40" value={job.description||""} onChange={e=>setField('description', e.target.value)} />
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">{job.description || "—"}</p>
          )}
        </Card.Body>
      </Card>

      {/* UC-112: Salary Benchmarks */}
      <SalaryBenchmarks 
        jobTitle={job.title} 
        location={job.location || 'Unknown'} 
        jobSalary={{ min: job.salaryMin, max: job.salaryMax }}
      />

      {/* UC-123: Job Requirements Match Analysis */}
      {userId && (
        <Card variant="default" size="large">
          <Card.Header>
            <Card.Title>Job Requirements Match Analysis</Card.Title>
          </Card.Header>
          <Card.Body>
            <JobRequirementsMatch jobId={jobId} userId={userId} />
          </Card.Body>
        </Card>
      )}

      {/* Notes and Contacts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="default" size="large">
          <Card.Header><Card.Title>General Notes</Card.Title></Card.Header>
          <Card.Body>
            {edit ? (
              <textarea className="input h-40" value={job.notes||""} onChange={e=>setField('notes', e.target.value)} />
            ) : (
              <div className="text-sm whitespace-pre-wrap">{job.notes || "—"}</div>
            )}
          </Card.Body>
        </Card>
        <Card variant="default" size="large">
          <Card.Header><Card.Title>Salary Negotiation</Card.Title></Card.Header>
          <Card.Body>
            {edit ? (
              <textarea className="input h-40" value={job.negotiationNotes||""} onChange={e=>setField('negotiationNotes', e.target.value)} />
            ) : (
              <div className="text-sm whitespace-pre-wrap">{job.negotiationNotes || "—"}</div>
            )}
          </Card.Body>
        </Card>
        <Card variant="default" size="large">
          <Card.Header><Card.Title>Interview Notes</Card.Title></Card.Header>
          <Card.Body>
            {edit ? (
              <textarea className="input h-40" value={job.interviewNotes||""} onChange={e=>setField('interviewNotes', e.target.value)} />
            ) : (
              <div className="text-sm whitespace-pre-wrap">{job.interviewNotes || "—"}</div>
            )}
          </Card.Body>
        </Card>
        <Card variant="default" size="large">
          <Card.Header><Card.Title>Application History</Card.Title></Card.Header>
          <Card.Body>
            {history && history.length > 0 ? (
              <ul className="space-y-2">
                {history.map(item => (
                  <li key={item.id} className="text-sm flex items-center justify-between">
                    <div className="flex-1">
                      <span className="font-medium">{item.status}</span>
                      {item.note && <span className="text-gray-600"> — {item.note}</span>}
                    </div>
                    <span className="text-gray-500 text-xs">{new Date(item.createdAt).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-600">No history yet.</div>
            )}
          </Card.Body>
        </Card>

        {/* Materials History */}
        <Card variant="default" size="large">
          <Card.Header><Card.Title>Materials History</Card.Title></Card.Header>
          <Card.Body>
            {materialsHistory && materialsHistory.length > 0 ? (
              <ul className="space-y-2">
                {materialsHistory.map(item => (
                  <li key={item.id} className="text-sm flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-xs text-gray-600">Resume: <span className="font-mono">{item.resumeVersionId || '—'}</span></div>
                      <div className="text-xs text-gray-600">Cover Letter: <span className="font-mono">{item.coverLetterVersionId || '—'}</span></div>
                    </div>
                    <span className="text-gray-500 text-xs">{item.changedAt ? new Date(item.changedAt).toLocaleString() : ''}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-600">No materials changes recorded.</div>
            )}
          </Card.Body>
        </Card>

        <Card variant="default" size="large">
          <Card.Header><Card.Title>Recent News</Card.Title></Card.Header>
          <Card.Body>
            {news.articles && news.articles.length > 0 ? (
              <ul className="space-y-3">
                {news.articles.map((a, idx) => (
                  <li key={idx} className="text-sm">
                    <a className="text-[var(--primary-color)] font-medium" href={a.url} target="_blank" rel="noreferrer">{a.title}</a>
                    <div className="text-xs text-gray-500">
                      {a.source ? `${a.source} • ` : ''}{a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : ''}
                    </div>
                    {a.description && <div className="text-xs text-gray-600 line-clamp-3">{a.description}</div>}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-600">No recent news available.</div>
            )}
          </Card.Body>
        </Card>

        {/* Email Integration - UC-113 */}
        <EmailIntegration 
          jobId={jobId} 
          companyName={job.company} 
          jobTitle={job.title} 
        />

        <Card variant="default" size="large">
          <Card.Header><Card.Title>Contacts</Card.Title></Card.Header>
          <Card.Body className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="form-label">Recruiter Name</div>
              {edit ? (
                <input className="input" value={job.recruiterName||""} onChange={e=>setField('recruiterName', e.target.value)} />
              ) : (<div className="text-sm">{job.recruiterName||"—"}</div>)}
            </div>
            <div>
              <div className="form-label">Recruiter Email</div>
              {edit ? (
                <input className="input" value={job.recruiterEmail||""} onChange={e=>setField('recruiterEmail', e.target.value)} />
              ) : (<div className="text-sm">{job.recruiterEmail||"—"}</div>)}
            </div>
            <div>
              <div className="form-label">Recruiter Phone</div>
              {edit ? (
                <input className="input" value={job.recruiterPhone||""} onChange={e=>setField('recruiterPhone', e.target.value)} />
              ) : (<div className="text-sm">{job.recruiterPhone||"—"}</div>)}
            </div>
            <div>
              <div className="form-label">Hiring Manager Name</div>
              {edit ? (
                <input className="input" value={job.hiringManagerName||""} onChange={e=>setField('hiringManagerName', e.target.value)} />
              ) : (<div className="text-sm">{job.hiringManagerName||"—"}</div>)}
            </div>
            <div>
              <div className="form-label">Hiring Manager Email</div>
              {edit ? (
                <input className="input" value={job.hiringManagerEmail||""} onChange={e=>setField('hiringManagerEmail', e.target.value)} />
              ) : (<div className="text-sm">{job.hiringManagerEmail||"—"}</div>)}
            </div>
            <div>
              <div className="form-label">Hiring Manager Phone</div>
              {edit ? (
                <input className="input" value={job.hiringManagerPhone||""} onChange={e=>setField('hiringManagerPhone', e.target.value)} />
              ) : (<div className="text-sm">{job.hiringManagerPhone||"—"}</div>)}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Scheduled Interviews */}
      {interviews.length > 0 && (
        <Card variant="default" size="large">
          <Card.Header><Card.Title>Scheduled Interviews</Card.Title></Card.Header>
          <Card.Body>
            <div className="space-y-3">
              {interviews.map(interview => (
                <div key={interview.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{interview.title}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(interview.scheduled_at).toLocaleString()}
                      {interview.location && ` • ${interview.location}`}
                    </div>
                    {interview.interviewer_name && (
                      <div className="text-xs text-gray-500">with {interview.interviewer_name}</div>
                    )}
                    {interview.offer_received && (
                      <div className="text-xs text-green-600 font-medium mt-1">✓ Offer Received</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedInterview(interview);
                        setShowOutcomeModal(true);
                      }}
                      className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Record Outcome
                    </button>
                    <span className={`text-xs px-2 py-1 rounded ${
                      interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                      interview.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {interview.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Archive Job</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to archive this job? You can restore it later from the archived jobs page.
            </p>
            <div className="mb-4">
              <label className="form-label">Reason (optional)</label>
              <input
                className="input w-full"
                placeholder="e.g., Position filled, Not interested..."
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowArchiveConfirm(false);
                  setArchiveReason("");
                }}
                disabled={archiving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={onArchive}
                disabled={archiving}
              >
                {archiving ? "Archiving..." : "Archive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-red-600">Delete Job</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to permanently delete this job? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                className="btn btn-ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn bg-red-600 text-white hover:bg-red-700"
                onClick={onDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        message="Job archived successfully"
        show={showToast}
        onUndo={handleUndo}
        onClose={() => {
          setShowToast(false);
          if (archivedJobId) navigate('/jobs');
        }}
      />

      {/* Schedule Interview Modal */}
      {showScheduleInterview && (
        <ScheduleInterviewModal
          jobId={jobId}  // This is a UUID string from useParams
          jobTitle={job.title}
          onClose={() => setShowScheduleInterview(false)}
          onScheduled={handleInterviewScheduled}
        />
      )}

      {/* Interview Outcome Modal */}
      {showOutcomeModal && selectedInterview && (
        <InterviewOutcomeModal
          interview={selectedInterview}
          onClose={() => {
            setShowOutcomeModal(false);
            setSelectedInterview(null);
          }}
          onUpdated={(updated) => {
            setShowOutcomeModal(false);
            setSelectedInterview(null);
            fetchInterviews();
            triggerRefresh();
          }}
        />
      )}

      {/* Document Details Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDocumentModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">
                {documentModalContent?.type === 'resume' ? 'Resume Details' : 
                 documentModalContent?.type === 'coverletter' ? 'Cover Letter Details' : 
                 'Document Details'}
              </h2>
              <button onClick={() => setShowDocumentModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <Icon name="x" size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {loadingDocument ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)]"></div>
                </div>
              ) : documentModalContent?.type === 'error' ? (
                <div className="text-center py-12 text-red-600">
                  {documentModalContent.message}
                </div>
              ) : documentModalContent?.type === 'resume' ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{documentModalContent.data?.title || 'Untitled Resume'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Last updated: {documentModalContent.data?.updatedAt ? new Date(documentModalContent.data.updatedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  
                  {documentModalContent.data?.summary && (
                    <div>
                      <h4 className="font-semibold mb-2">Professional Summary</h4>
                      <p className="text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-3 rounded">{documentModalContent.data.summary}</p>
                    </div>
                  )}
                  
                  {documentModalContent.data?.skills && documentModalContent.data.skills.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {documentModalContent.data.skills.map((skill, i) => (
                          <span key={i} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm">
                            {skill.name || skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {documentModalContent.data?.experience && documentModalContent.data.experience.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Experience</h4>
                      <div className="space-y-3">
                        {documentModalContent.data.experience.map((exp, i) => (
                          <div key={i} className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                            <div className="font-medium">{exp.title || exp.position}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{exp.company}</div>
                            {exp.description && <p className="text-sm mt-1">{exp.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {documentModalContent.data?.education && documentModalContent.data.education.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Education</h4>
                      <div className="space-y-2">
                        {documentModalContent.data.education.map((edu, i) => (
                          <div key={i} className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                            <div className="font-medium">{edu.degree}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{edu.institution}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => downloadResumePDF(documentModalContent.data.id)}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <Icon name="download" size={16} />
                      Download PDF
                    </button>
                  </div>
                </div>
              ) : documentModalContent?.type === 'coverletter' ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{documentModalContent.data?.title || 'Untitled Cover Letter'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Created: {documentModalContent.data?.created_at ? new Date(documentModalContent.data.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  
                  {documentModalContent.data?.content && (
                    <div>
                      <div className="text-sm whitespace-pre-wrap bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 rounded leading-relaxed max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700">
                        {typeof documentModalContent.data.content === 'string' 
                          ? documentModalContent.data.content 
                          : documentModalContent.data.content.text || JSON.stringify(documentModalContent.data.content)}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => downloadCoverLetterPDF(documentModalContent.data.id, documentModalContent.data.title)}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <Icon name="download" size={16} />
                      Download PDF
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No document data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
