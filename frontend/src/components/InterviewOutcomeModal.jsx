import React, { useState } from 'react';
import { updateInterviewOutcome } from '../lib/api.ts';

export default function InterviewOutcomeModal({ interview, onClose, onUpdated }) {
  const [form, setForm] = useState({
    offerReceived: interview.offer_received || false,
    offerAccepted: interview.offer_accepted || false,
    performanceRating: interview.performance_rating || 3,
    prepTimeHours: interview.prep_time_hours || '',
    practiceSessionsUsed: interview.practice_sessions_used || 0,
    strengths: interview.strengths || '',
    weaknesses: interview.weaknesses || '',
    feedback: interview.feedback || '',
    interviewStage: interview.interview_stage || 'screening',
    interviewFormat: interview.interview_format || 'video',
    interviewDate: interview.interview_date 
      ? new Date(interview.interview_date).toISOString().slice(0, 16) 
      : new Date(interview.scheduled_at).toISOString().slice(0, 16),
    companyName: interview.company_name || '',
    companyType: interview.company_type || '',
    companyIndustry: interview.company_industry || '',
    jobTitle: interview.job_title || interview.title || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const updated = await updateInterviewOutcome(interview.id, {
        offerReceived: form.offerReceived,
        offerAccepted: form.offerAccepted,
        performanceRating: parseInt(form.performanceRating),
        prepTimeHours: form.prepTimeHours ? parseFloat(form.prepTimeHours) : null,
        practiceSessionsUsed: parseInt(form.practiceSessionsUsed),
        strengths: form.strengths,
        weaknesses: form.weaknesses,
        feedback: form.feedback,
        interviewStage: form.interviewStage,
        interviewFormat: form.interviewFormat,
        interviewDate: form.interviewDate,
        companyName: form.companyName,
        companyType: form.companyType,
        companyIndustry: form.companyIndustry,
        jobTitle: form.jobTitle,
        status: 'completed',
      });
      onUpdated?.(updated);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save interview outcome');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Record Interview Outcome</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Show interview info (read-only) */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Interview</h3>
            <p className="text-sm text-gray-700">{interview.title}</p>
            <p className="text-xs text-gray-600">{new Date(interview.scheduled_at).toLocaleString()}</p>
          </div>

          {/* Company Information */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-900">Company Details</h3>
            
            <div>
              <label className="form-label">Company Type <span className="text-red-500">*</span></label>
              <select
                className="input w-full"
                value={form.companyType}
                onChange={e => setForm({ ...form, companyType: e.target.value })}
                required
              >
                <option value="">Select type...</option>
                <option value="startup">Startup</option>
                <option value="mid-size">Mid-Size Company</option>
                <option value="enterprise">Enterprise</option>
                <option value="government">Government</option>
                <option value="non-profit">Non-Profit</option>
              </select>
            </div>
          </div>

          {/* Preparation */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-900">Preparation</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Prep Time (hours)</label>
                <input
                  type="number"
                  step="0.5"
                  className="input w-full"
                  value={form.prepTimeHours}
                  onChange={e => setForm({ ...form, prepTimeHours: e.target.value })}
                  placeholder="e.g., 5.5"
                />
              </div>
              <div>
                <label className="form-label">Practice Sessions Used</label>
                <input
                  type="number"
                  className="input w-full"
                  value={form.practiceSessionsUsed}
                  onChange={e => setForm({ ...form, practiceSessionsUsed: e.target.value })}
                  min="0"
                  placeholder="e.g., 3"
                />
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="bg-green-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-900">Performance & Outcome</h3>
            
            <div>
              <label className="form-label">Overall Performance Rating</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="5"
                  className="flex-1"
                  value={form.performanceRating}
                  onChange={e => setForm({ ...form, performanceRating: e.target.value })}
                />
                <span className="text-2xl font-bold text-gray-900 w-12 text-center">
                  {form.performanceRating}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Poor</span>
                <span>Below Average</span>
                <span>Average</span>
                <span>Good</span>
                <span>Excellent</span>
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-white">
                <input
                  type="checkbox"
                  checked={form.offerReceived}
                  onChange={e => setForm({ ...form, offerReceived: e.target.checked })}
                />
                <span className="text-sm font-medium">Received Offer</span>
              </label>

              {form.offerReceived && (
                <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-white">
                  <input
                    type="checkbox"
                    checked={form.offerAccepted}
                    onChange={e => setForm({ ...form, offerAccepted: e.target.checked })}
                  />
                  <span className="text-sm font-medium">Accepted Offer</span>
                </label>
              )}
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-4">
            <div>
              <label className="form-label">Strengths (What went well?)</label>
              <textarea
                className="input w-full h-20"
                value={form.strengths}
                onChange={e => setForm({ ...form, strengths: e.target.value })}
                placeholder="e.g., Answered technical questions confidently, good rapport with interviewer..."
              />
            </div>

            <div>
              <label className="form-label">Weaknesses (What could be improved?)</label>
              <textarea
                className="input w-full h-20"
                value={form.weaknesses}
                onChange={e => setForm({ ...form, weaknesses: e.target.value })}
                placeholder="e.g., Struggled with system design question, need to work on behavioral examples..."
              />
            </div>

            <div>
              <label className="form-label">Additional Feedback & Notes</label>
              <textarea
                className="input w-full h-24"
                value={form.feedback}
                onChange={e => setForm({ ...form, feedback: e.target.value })}
                placeholder="Any other observations, interviewer feedback, or lessons learned..."
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <button type="button" onClick={onClose} className="btn btn-ghost" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Outcome'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
