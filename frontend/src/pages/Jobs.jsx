// frontend/src/pages/Jobs.jsx
import React from "react";
import { Link } from "react-router-dom";
import JobForm from "../components/JobForm";
import { listJobs, createJob } from "../lib/api";

export default function Jobs() {
  // Load saved preferences from localStorage
  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem('jobSearchPreferences');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const prefs = loadPreferences();
  const [jobs, setJobs] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [createError, setCreateError] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState(prefs.statusFilter || "");
  const [searchTerm, setSearchTerm] = React.useState(prefs.searchTerm || "");
  const [industryFilter, setIndustryFilter] = React.useState(prefs.industryFilter || "");
  const [locationFilter, setLocationFilter] = React.useState(prefs.locationFilter || "");
  const [salaryMinFilter, setSalaryMinFilter] = React.useState(prefs.salaryMinFilter || "");
  const [salaryMaxFilter, setSalaryMaxFilter] = React.useState(prefs.salaryMaxFilter || "");
  const [deadlineFromFilter, setDeadlineFromFilter] = React.useState(prefs.deadlineFromFilter || "");
  const [deadlineToFilter, setDeadlineToFilter] = React.useState(prefs.deadlineToFilter || "");
  const [sortBy, setSortBy] = React.useState(prefs.sortBy || "createdAt");
  const [sortOrder, setSortOrder] = React.useState(prefs.sortOrder || "desc");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listJobs(
        statusFilter || undefined,
        searchTerm || undefined,
        industryFilter || undefined,
        locationFilter || undefined,
        salaryMinFilter ? Number(salaryMinFilter) : undefined,
        salaryMaxFilter ? Number(salaryMaxFilter) : undefined,
        deadlineFromFilter || undefined,
        deadlineToFilter || undefined,
        sortBy || undefined,
        sortOrder || undefined
      );
      setJobs(data);
    } catch (e) {
      setError("Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, [statusFilter, searchTerm, industryFilter, locationFilter, salaryMinFilter, salaryMaxFilter, deadlineFromFilter, deadlineToFilter, sortBy, sortOrder]);

  // Save preferences to localStorage whenever they change
  React.useEffect(() => {
    try {
      const preferences = {
        statusFilter,
        searchTerm,
        industryFilter,
        locationFilter,
        salaryMinFilter,
        salaryMaxFilter,
        deadlineFromFilter,
        deadlineToFilter,
        sortBy,
        sortOrder
      };
      localStorage.setItem('jobSearchPreferences', JSON.stringify(preferences));
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [statusFilter, searchTerm, industryFilter, locationFilter, salaryMinFilter, salaryMaxFilter, deadlineFromFilter, deadlineToFilter, sortBy, sortOrder]);

  function clearAllFilters() {
    setStatusFilter("");
    setSearchTerm("");
    setIndustryFilter("");
    setLocationFilter("");
    setSalaryMinFilter("");
    setSalaryMaxFilter("");
    setDeadlineFromFilter("");
    setDeadlineToFilter("");
    setSortBy("createdAt");
    setSortOrder("desc");
  }

  function highlightText(text, query) {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200">{part}</mark>
        : part
    );
  }

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
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-600">Add job opportunities to track them in your pipeline.</p>
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700">Search:</label>
                <input
                  type="text"
                  placeholder="Title, company, keywords..."
                  className="input max-w-xs text-sm py-1"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700">Status:</label>
                <select
                  className="input max-w-xs text-sm py-1"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option>Interested</option>
                  <option>Applied</option>
                  <option>Phone Screen</option>
                  <option>Interview</option>
                  <option>Offer</option>
                  <option>Rejected</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700">Industry:</label>
                <select
                  className="input max-w-xs text-sm py-1"
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option>Technology</option>
                  <option>Finance</option>
                  <option>Healthcare</option>
                  <option>Education</option>
                  <option>Retail</option>
                  <option>Manufacturing</option>
                  <option>Consulting</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700">Location:</label>
                <input
                  type="text"
                  placeholder="City, state, remote..."
                  className="input max-w-xs text-sm py-1"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700">Salary:</label>
                <input
                  type="number"
                  placeholder="Min"
                  className="input w-24 text-sm py-1"
                  value={salaryMinFilter}
                  onChange={(e) => setSalaryMinFilter(e.target.value)}
                />
                <span className="text-xs text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="input w-24 text-sm py-1"
                  value={salaryMaxFilter}
                  onChange={(e) => setSalaryMaxFilter(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700">Deadline:</label>
                <input
                  type="date"
                  className="input w-36 text-sm py-1"
                  value={deadlineFromFilter}
                  onChange={(e) => setDeadlineFromFilter(e.target.value)}
                />
                <span className="text-xs text-gray-500">to</span>
                <input
                  type="date"
                  className="input w-36 text-sm py-1"
                  value={deadlineToFilter}
                  onChange={(e) => setDeadlineToFilter(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <label className="text-xs font-medium text-gray-700">Sort by:</label>
              <select
                className="input max-w-xs text-sm py-1"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="createdAt">Date Added</option>
                <option value="deadline">Deadline</option>
                <option value="salary">Salary</option>
                <option value="company">Company Name</option>
              </select>
              <select
                className="input w-24 text-sm py-1"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">↓</option>
                <option value="asc">↑</option>
              </select>
              <button
                className="btn btn-secondary text-sm py-1 px-3"
                onClick={clearAllFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link className="btn btn-secondary" to="/jobs/pipeline">Pipeline View</Link>
          <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Add Job</button>
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? (
        <div className="text-sm text-gray-600">Loading…</div>
      ) : (
        <>
          <div className="text-sm text-gray-600">{jobs.length} job{jobs.length !== 1 ? "s" : ""}{statusFilter ? ` in '${statusFilter}'` : ''}</div>
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map(j => (
              <div key={j.id} className="page-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link to={`/jobs/${j.id}`} className="text-base font-semibold text-[var(--primary-color)] hover:underline">
                      {highlightText(j.title, searchTerm)}
                    </Link>
                    <div className="text-sm text-gray-600">{highlightText(j.company, searchTerm)}</div>
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between sticky top-0 bg-white pb-3 mb-1">
              <h2 className="text-lg font-semibold text-gray-900">Add Job</h2>
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
