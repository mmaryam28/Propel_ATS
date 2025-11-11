import React from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";
import { getJob, updateJob, listJobHistory } from "../lib/api";

export default function JobDetails() {
  const { jobId } = useParams();
  const [job, setJob] = React.useState(null);
  const [edit, setEdit] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [history, setHistory] = React.useState([]);

  React.useEffect(() => { (async () => {
    try {
      const [j, h] = await Promise.all([
        getJob(jobId),
        listJobHistory(jobId).catch(() => []),
      ]);
      setJob(j); setHistory(h);
    } catch { setError("Failed to load job"); }
  })(); }, [jobId]);

  function setField(key, value) { setJob(j => ({ ...j, [key]: value })); }

  async function onSave() {
    if (!job) return;
    setSaving(true); setError("");
    try {
      const payload = {
        title: job.title,
        company: job.company,
        location: job.location ?? null,
        postingUrl: job.postingUrl ?? null,
        deadline: job.deadline ?? null,
        description: job.description ?? null,
        industry: job.industry ?? null,
        jobType: job.jobType ?? null,
        salaryMin: job.salaryMin ?? null,
        salaryMax: job.salaryMax ?? null,
        notes: job.notes ?? null,
        negotiationNotes: job.negotiationNotes ?? null,
        interviewNotes: job.interviewNotes ?? null,
        recruiterName: job.recruiterName ?? null,
        recruiterEmail: job.recruiterEmail ?? null,
        recruiterPhone: job.recruiterPhone ?? null,
        hiringManagerName: job.hiringManagerName ?? null,
        hiringManagerEmail: job.hiringManagerEmail ?? null,
        hiringManagerPhone: job.hiringManagerPhone ?? null,
      };
      const updated = await updateJob(jobId, payload);
      setJob(updated);
      setEdit(false);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to save";
      setError(Array.isArray(msg) ? msg.join("; ") : msg);
    } finally { setSaving(false); }
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
            <button className="btn btn-secondary" onClick={() => setEdit(true)}>Edit</button>
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

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Summary card */}
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
    </div>
  );
}
