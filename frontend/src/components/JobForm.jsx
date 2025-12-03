import React from "react";
import { importJobFromUrl } from "../lib/api";

const INDUSTRIES = ["Software", "Finance", "Healthcare", "Education", "Other"];
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Temporary"];
const JOB_SOURCES = [
  "LinkedIn",
  "Company Website",
  "Referral",
  "Recruiter Contact",
  "Indeed",
  "Glassdoor",
  "AngelList",
  "Networking Event",
  "Cold Application",
  "Other"
];

export default function JobForm({ initial = {}, onCancel, onSaved }) {
  const [form, setForm] = React.useState({
    title: "",
    company: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
    postingUrl: "",
    deadline: "",
    description: "",
    industry: "",
    jobType: "",
    source: "Direct Application",
    ...initial
  });
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  
  // URL Import state
  const [importUrl, setImportUrl] = React.useState("");
  const [importing, setImporting] = React.useState(false);
  const [importStatus, setImportStatus] = React.useState(null); // { status: 'success'|'partial'|'failed', message: string }

  // ✅ renamed from "set" to "setValue" (avoids reserved conflicts)
  function setValue(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleImport() {
    if (!importUrl.trim()) {
      setImportStatus({ status: 'failed', message: 'Please enter a URL' });
      return;
    }

    setImporting(true);
    setImportStatus(null);
    
    try {
      const result = await importJobFromUrl(importUrl);
      
      setImportStatus({
        status: result.status,
        message: result.message
      });

      if (result.success) {
        // Auto-populate form fields with imported data
        // Note: We preserve the source field from the form state
        setForm(f => ({
          ...f,
          title: result.data.title || f.title,
          company: result.data.company || f.company,
          location: result.data.location || f.location,
          description: result.data.description || f.description,
          postingUrl: result.data.postingUrl || f.postingUrl,
          // source is preserved from f.source (defaults to "Direct Application")
        }));
      }
    } catch (error) {
      setImportStatus({
        status: 'failed',
        message: error?.response?.data?.message || error?.message || 'Failed to import job details'
      });
    } finally {
      setImporting(false);
    }
  }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = "Job title is required";
    if (!form.company.trim()) e.company = "Company is required";
    // Optional but sensible validations
    const min = form.salaryMin === "" ? null : Number(form.salaryMin);
    const max = form.salaryMax === "" ? null : Number(form.salaryMax);
    if (min !== null && !Number.isFinite(min)) e.salaryMin = "Enter a valid number";
    if (max !== null && !Number.isFinite(max)) e.salaryMax = "Enter a valid number";
    if (min !== null && max !== null && max < min) e.salaryMax = "Max must be >= Min";
    if (form.postingUrl && form.postingUrl.trim()) {
      try {
        // Allow relative omissions like missing protocol by prepending http
        const candidate = /^(https?:)?\/\//i.test(form.postingUrl) ? form.postingUrl : `https://${form.postingUrl}`;
        new URL(candidate);
      } catch {
        e.postingUrl = "Enter a valid URL";
      }
    }
    if (form.description && form.description.length > 2000)
      e.description = "Max 2000 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // Convert salary values to integers before sending
      const payload = {
        ...form,
        salaryMin: form.salaryMin === "" ? null : parseInt(form.salaryMin, 10),
        salaryMax: form.salaryMax === "" ? null : parseInt(form.salaryMax, 10),
      };
      console.log('JobForm payload being sent:', payload);
      console.log('JobForm source value:', form.source);
      await onSaved?.(payload);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* URL Import Section */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Import from URL</h3>
        <p className="text-xs text-gray-600 mb-3">
          Paste a job posting URL from LinkedIn, Indeed, or Glassdoor to auto-fill job details
        </p>
        <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
          <input
            type="text"
            className="input w-full text-sm border-2 border-gray-300"
            placeholder="https://www.linkedin.com/jobs/view/..."
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            disabled={importing}
          />
          <button
            type="button"
            className="btn btn-primary whitespace-nowrap text-sm px-6 py-2.5"
            onClick={handleImport}
            disabled={importing}
          >
            {importing ? "Importing..." : "Import"}
          </button>
        </div>
        
        {/* Import Status Messages */}
        {importStatus && (
          <div className={`mt-3 rounded-md p-3 text-sm ${
            importStatus.status === 'success' ? 'bg-green-50 text-green-700' :
            importStatus.status === 'partial' ? 'bg-yellow-50 text-yellow-700' :
            'bg-red-50 text-red-700'
          }`}>
            {importStatus.message}
          </div>
        )}
      </div>

      {/* Required */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="form-label">Job Title *</label>
          <input
            className={`input ${errors.title ? "input-error" : ""}`}
            value={form.title}
            onChange={(e) => setValue("title", e.target.value)}
          />
          {errors.title && <p className="form-error">{errors.title}</p>}
        </div>
        <div>
          <label className="form-label">Company *</label>
          <input
            className={`input ${errors.company ? "input-error" : ""}`}
            value={form.company}
            onChange={(e) => setValue("company", e.target.value)}
          />
          {errors.company && <p className="form-error">{errors.company}</p>}
        </div>
      </div>

      {/* Nice-to-have */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="form-label">Location</label>
          <input
            className="input"
            value={form.location}
            onChange={(e) => setValue("location", e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Posting URL</label>
          <input
            className={`input ${errors.postingUrl ? "input-error" : ""}`}
            value={form.postingUrl}
            onChange={(e) => setValue("postingUrl", e.target.value)}
          />
          {errors.postingUrl && <p className="form-error">{errors.postingUrl}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="form-label">Deadline</label>
          <input
            type="date"
            className="input"
            value={form.deadline}
            onChange={(e) => setValue("deadline", e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Salary Min</label>
          <input
            type="number"
            className={`input ${errors.salaryMin ? "input-error" : ""}`}
            value={form.salaryMin}
            onChange={(e) => setValue("salaryMin", e.target.value)}
          />
          {errors.salaryMin && <p className="form-error">{errors.salaryMin}</p>}
        </div>
        <div>
          <label className="form-label">Salary Max</label>
          <input
            type="number"
            className={`input ${errors.salaryMax ? "input-error" : ""}`}
            value={form.salaryMax}
            onChange={(e) => setValue("salaryMax", e.target.value)}
          />
          {errors.salaryMax && <p className="form-error">{errors.salaryMax}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="form-label">Industry</label>
          <select
            className="input"
            value={form.industry}
            onChange={(e) => setValue("industry", e.target.value)}
          >
            <option value="">Select…</option>
            {INDUSTRIES.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Job Type</label>
          <select
            className="input"
            value={form.jobType}
            onChange={(e) => setValue("jobType", e.target.value)}
          >
            <option value="">Select…</option>
            {JOB_TYPES.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Source</label>
          <select
            className="input"
            value={form.source}
            onChange={(e) => setValue("source", e.target.value)}
          >
            {JOB_SOURCES.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="form-label">Job Description (max 2000 chars)</label>
        <textarea
          className={`input h-32 ${errors.description ? "input-error" : ""}`}
          value={form.description}
          onChange={(e) => setValue("description", e.target.value)}
        />
        <div className="mt-1 text-xs text-gray-500">
          {(form.description || "").length}/2000
        </div>
        {errors.description && (
          <p className="form-error">{errors.description}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
