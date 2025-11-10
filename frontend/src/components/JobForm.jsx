import React from "react";

const INDUSTRIES = ["Software", "Finance", "Healthcare", "Education", "Other"];
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Temporary"];

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
    ...initial
  });
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  // ✅ renamed from "set" to "setValue" (avoids reserved conflicts)
  function setValue(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
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
      await onSaved?.(form);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="grid gap-4 sm:grid-cols-2">
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
