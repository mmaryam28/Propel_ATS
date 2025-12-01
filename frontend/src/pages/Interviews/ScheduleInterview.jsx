import { useState } from "react";
import api from "../../api/axiosConfig"; // your configured axios instance
import { useNavigate } from "react-router-dom";

export default function ScheduleInterview() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    company_name: "",
    interview_date: "",
    interview_type: "",
    interview_format: "",
    interviewer_name: "",
    interviewer_email: "",
    location: "",
    details: "",
    interview_stage: "",
    prep_time_hours: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Build backend-friendly payload
    const payload = {
      company_name: form.company_name,
      interview_date: form.interview_date,
      interview_type: form.interview_type,
      interview_format: form.interview_format,

      interviewer_name: form.interviewer_name || null,
      interviewer_email: form.interviewer_email || null,
      location: form.location || null,
      details: form.details || null,
      interview_stage: form.interview_stage || null,

      prep_time_hours:
        form.prep_time_hours === "" ? null : Number(form.prep_time_hours),
    };

    try {
      const res = await api.post("/interview/schedule", payload);

      console.log("Interview Scheduled:", res.data);

      navigate("/interviews"); // redirect back to list
    } catch (err) {
      console.error("Axios error:", err);
      console.error("Backend response:", err?.response?.data);

      setError(
        err?.response?.data?.message ||
          "Failed to schedule interview. Check your inputs."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Schedule Interview</h1>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Name */}
        <div>
          <label className="block mb-1 font-medium">Company Name</label>
          <input
            type="text"
            value={form.company_name}
            onChange={(e) => updateField("company_name", e.target.value)}
            className="input input-bordered w-full"
            required
          />
        </div>

        {/* Interview Date */}
        <div>
          <label className="block mb-1 font-medium">Interview Date</label>
          <input
            type="datetime-local"
            value={form.interview_date}
            onChange={(e) => updateField("interview_date", e.target.value)}
            className="input input-bordered w-full"
            required
          />
        </div>

        {/* Interview Type */}
        <div>
          <label className="block mb-1 font-medium">Interview Type</label>
          <input
            type="text"
            value={form.interview_type}
            onChange={(e) => updateField("interview_type", e.target.value)}
            className="input input-bordered w-full"
            required
          />
        </div>

        {/* Interview Format */}
        <div>
          <label className="block mb-1 font-medium">Format</label>
          <input
            type="text"
            value={form.interview_format}
            onChange={(e) => updateField("interview_format", e.target.value)}
            className="input input-bordered w-full"
            required
          />
        </div>

        {/* Optional Fields */}
        <div>
          <label className="block mb-1 font-medium">Interviewer Name</label>
          <input
            type="text"
            value={form.interviewer_name}
            onChange={(e) => updateField("interviewer_name", e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Interviewer Email</label>
          <input
            type="email"
            value={form.interviewer_email}
            onChange={(e) => updateField("interviewer_email", e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Location</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Details</label>
          <textarea
            value={form.details}
            onChange={(e) => updateField("details", e.target.value)}
            className="textarea textarea-bordered w-full"
          ></textarea>
        </div>

        <div>
          <label className="block mb-1 font-medium">Interview Stage</label>
          <input
            type="text"
            value={form.interview_stage}
            onChange={(e) => updateField("interview_stage", e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Prep Time (hours, optional)
          </label>
          <input
            type="number"
            value={form.prep_time_hours}
            onChange={(e) => updateField("prep_time_hours", e.target.value)}
            className="input input-bordered w-full"
            min="0"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`btn btn-primary w-full ${loading ? "loading" : ""}`}
          disabled={loading}
        >
          {loading ? "Scheduling..." : "Schedule Interview"}
        </button>
      </form>
    </div>
  );
}
