// frontend/src/pages/Jobs.jsx
import React from "react";
import { Link } from "react-router-dom";
import JobForm from "../components/JobForm";
import { Toast } from "../components/Toast";
import { listJobs, createJob, bulkArchiveJobs, restoreJob } from "../lib/api";

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
  const [selectedJobs, setSelectedJobs] = React.useState([]);
  const [bulkArchiving, setBulkArchiving] = React.useState(false);
  const [showBulkArchiveModal, setShowBulkArchiveModal] = React.useState(false);
  const [bulkArchiveReason, setBulkArchiveReason] = React.useState("");
  const [showToast, setShowToast] = React.useState(false);
  const [archivedJobIds, setArchivedJobIds] = React.useState([]);

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

  function getDeadlineInfo(deadline) {
    if (!deadline) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let urgencyClass = '';
    let text = '';
    
    if (diffDays < 0) {
      // Overdue
      urgencyClass = 'bg-red-100 text-red-800 border border-red-300';
      text = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      // Due today
      urgencyClass = 'bg-red-100 text-red-800 border border-red-300';
      text = 'Due today!';
    } else if (diffDays <= 2) {
      // Critical (1-2 days)
      urgencyClass = 'bg-red-100 text-red-800 border border-red-300';
      text = `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
    } else if (diffDays <= 7) {
      // Warning (3-7 days)
      urgencyClass = 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      text = `${diffDays} days left`;
    } else {
      // Safe (>7 days)
      urgencyClass = 'bg-green-100 text-green-800 border border-green-300';
      text = `${diffDays} days left`;
    }
    
    return { text, urgencyClass, diffDays };
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

  function toggleSelectJob(jobId) {
    setSelectedJobs(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  }

  function toggleSelectAll() {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map(j => j.id));
    }
  }

  async function handleBulkArchive() {
    if (selectedJobs.length === 0) return;
    setBulkArchiving(true);
    setError("");
    try {
      const result = await bulkArchiveJobs(selectedJobs, bulkArchiveReason || undefined);
      setShowBulkArchiveModal(false);
      setBulkArchiveReason("");
      setArchivedJobIds([...selectedJobs]);
      setSelectedJobs([]);
      setShowToast(true);
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to archive jobs";
      setError(Array.isArray(msg) ? msg.join("; ") : msg);
    } finally {
      setBulkArchiving(false);
    }
  }

  async function handleUndoBulkArchive() {
    if (archivedJobIds.length === 0) return;
    try {
      // Restore all archived jobs
      await Promise.all(archivedJobIds.map(id => restoreJob(id)));
      setShowToast(false);
      setArchivedJobIds([]);
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to undo archive";
      setError(Array.isArray(msg) ? msg.join("; ") : msg);
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
          <Link className="btn btn-secondary" to="/jobs/calendar">📅 Calendar</Link>
          <Link className="btn btn-secondary" to="/jobs/archived">📦 Archived</Link>
          <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Add Job</button>
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      
      {/* Bulk Actions Bar */}
      {selectedJobs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            <strong>{selectedJobs.length}</strong> job{selectedJobs.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary text-sm"
              onClick={() => setSelectedJobs([])}
            >
              Clear Selection
            </button>
            <button
              className="btn btn-primary text-sm"
              onClick={() => setShowBulkArchiveModal(true)}
            >
              Archive Selected
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="text-sm text-gray-600">Loading…</div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <div>
              {jobs.length} job{jobs.length !== 1 ? "s" : ""}{statusFilter ? ` in '${statusFilter}'` : ''}
            </div>
            {jobs.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedJobs.length === jobs.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4"
                />
                <span className="text-xs">Select All</span>
              </label>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map(j => {
              const deadlineInfo = getDeadlineInfo(j.deadline);
              const isSelected = selectedJobs.includes(j.id);
              return (
              <div key={j.id} className={`page-card p-4 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectJob(j.id)}
                      className="mt-1 w-4 h-4"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <Link to={`/jobs/${j.id}`} className="text-base font-semibold text-[var(--primary-color)] hover:underline">
                        {highlightText(j.title, searchTerm)}
                      </Link>
                      <div className="text-sm text-gray-600">{highlightText(j.company, searchTerm)}</div>
                    </div>
                  </div>
                  {deadlineInfo && (
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs rounded-md px-2 py-1 font-medium ${deadlineInfo.urgencyClass}`}>
                        {deadlineInfo.text}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(j.deadline).toLocaleDateString()}
                      </span>
                    </div>
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
            );
            })}
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

      {/* Bulk Archive Modal */}
      {showBulkArchiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Archive {selectedJobs.length} Job{selectedJobs.length !== 1 ? 's' : ''}</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to archive {selectedJobs.length} selected job{selectedJobs.length !== 1 ? 's' : ''}? You can restore them later from the archived jobs page.
            </p>
            <div className="mb-4">
              <label className="form-label">Reason (optional)</label>
              <input
                className="input w-full"
                placeholder="e.g., Position filled, Not interested..."
                value={bulkArchiveReason}
                onChange={(e) => setBulkArchiveReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowBulkArchiveModal(false);
                  setBulkArchiveReason("");
                }}
                disabled={bulkArchiving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleBulkArchive}
                disabled={bulkArchiving}
              >
                {bulkArchiving ? "Archiving..." : "Archive All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification for Bulk Archive */}
      <Toast
        message={`${archivedJobIds.length} job${archivedJobIds.length !== 1 ? 's' : ''} archived successfully`}
        show={showToast}
        onUndo={handleUndoBulkArchive}
        onClose={() => {
          setShowToast(false);
          setArchivedJobIds([]);
        }}
      />
    </div>
  );
}
