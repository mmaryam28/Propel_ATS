import React, { useState } from 'react';
import { scheduleInterview } from '../lib/api';

export default function ScheduleInterviewModal({ jobId, jobTitle, onClose, onScheduled }) {
  const [form, setForm] = useState({
    title: `Interview for ${jobTitle}`,
    scheduledAt: '',
    duration: '60',
    location: '',
    interviewerName: '',
    interviewerEmail: '',
    notes: '',
    setReminder: true,
    reminderBefore: '1h',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const interview = await scheduleInterview({
        jobId, // ✅ UUID string passed directly
        ...form,
      });
      onScheduled?.(interview);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to schedule interview');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Schedule Interview</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Interview Title</label>
            <input
              className="input w-full"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Date & Time</label>
              <input
                type="datetime-local"
                className="input w-full"
                value={form.scheduledAt}
                onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="form-label">Duration (minutes)</label>
              <input
                type="number"
                className="input w-full"
                value={form.duration}
                onChange={e => setForm({ ...form, duration: e.target.value })}
                min="15"
                step="15"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Location / Meeting Link</label>
            <input
              className="input w-full"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder="e.g., Zoom link, office address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Interviewer Name</label>
              <input
                className="input w-full"
                value={form.interviewerName}
                onChange={e => setForm({ ...form, interviewerName: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Interviewer Email</label>
              <input
                type="email"
                className="input w-full"
                value={form.interviewerEmail}
                onChange={e => setForm({ ...form, interviewerEmail: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea
              className="input w-full h-24"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Preparation notes, topics to discuss, etc."
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.setReminder}
                onChange={e => setForm({ ...form, setReminder: e.target.checked })}
              />
              <span className="text-sm">Set reminder</span>
            </label>

            {form.setReminder && (
              <select
                className="input"
                value={form.reminderBefore}
                onChange={e => setForm({ ...form, reminderBefore: e.target.value })}
              >
                <option value="15m">15 minutes before</option>
                <option value="30m">30 minutes before</option>
                <option value="1h">1 hour before</option>
                <option value="2h">2 hours before</option>
                <option value="1d">1 day before</option>
              </select>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button type="button" onClick={onClose} className="btn btn-ghost" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
