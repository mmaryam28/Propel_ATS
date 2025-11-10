// frontend/src/pages/Jobs.jsx
import React from "react";
import JobForm from "../components/JobForm";
import { listJobs, createJob } from "../lib/api";

export default function Jobs() {
  const [jobs, setJobs] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [createError, setCreateError] = React.useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listJobs();
      setJobs(data);
    } catch (e) {
      setError("Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  async function handleCreate(payload) {
    try {
      setCreateError("");
      await createJob(payload);
      setOpen(false);
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to create job";
      setCreateError(Array.isArray(msg) ? msg.join("; ") : msg);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-600">Add job opportunities to track them in your pipeline.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Add Job</button>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? (
        <div className="text-sm text-gray-600">Loading…</div>
      ) : (
        <>
          <div className="text-sm text-gray-600">{jobs.length} job{jobs.length !== 1 ? "s" : ""}</div>
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map(j => (
              <div key={j.id} className="page-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold">{j.title}</div>
                    <div className="text-sm text-gray-600">{j.company}</div>
                  </div>
                  {j.deadline && (
                    <span className="text-xs rounded-md bg-gray-100 px-2 py-1">
                      Deadline: {new Date(j.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  {j.location && <span className="rounded-md bg-gray-100 px-2 py-1">{j.location}</span>}
                  {j.jobType && <span className="rounded-md bg-gray-100 px-2 py-1">{j.jobType}</span>}
                  {j.industry && <span className="rounded-md bg-gray-100 px-2 py-1">{j.industry}</span>}
                </div>
                {j.postingUrl && (
                  <a className="mt-3 inline-block text-sm font-medium text-[var(--primary-color)]"
                     href={j.postingUrl} target="_blank" rel="noreferrer">
                    View posting →
                  </a>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Job</h2>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="mt-4">
              {createError && (
                <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {createError}
                </div>
              )}
              <JobForm onCancel={() => setOpen(false)} onSaved={handleCreate} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
