import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Helper: get token
function getToken() {
  return window.localStorage.getItem('token');
}

const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

export function getEducationCompleteness(entries: any[]): number {
  return entries.length > 0 ? 20 : 0;
}

export default function EducationPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [debugToken, setDebugToken] = useState<string | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);

  // Redirect to login if no token
  useEffect(() => {
    const token = getToken();
    setDebugToken(token || null);
    if (!token) {
      navigate('/login');
      return;
    }
    axios
      .get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.data?.user) setCurrentUser({ id: r.data.user.id, email: r.data.user.email });
        else setDebugError('No user object in response.');
      })
      .catch((err) =>
        setDebugError(err?.response?.data?.error || err?.message || 'Unknown error fetching user info.')
      );
  }, []);

  const [formError, setFormError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const currentUserId = window.localStorage.getItem('userId') || 'demo-user-uuid';

  const [form, setForm] = useState<any>({
    userId: currentUserId,
    degree: '',
    institution: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    ongoing: false,
    gpa: '',
    showGpa: true,
    honors: '',
    educationLevel: 'Bachelor',
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any | null>(null);

  function resetForm() {
    setForm({
      userId: currentUserId,
      degree: '',
      institution: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      ongoing: false,
      gpa: '',
      showGpa: true,
      honors: '',
      educationLevel: 'Bachelor',
    });
  }

  useEffect(() => {
    axios
      .get(`${API}/education/user/${currentUserId}`)
      .then((r) => setItems(r.data))
      .catch(() => {});
  }, [currentUserId]);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ax = new Date(a.endDate || a.startDate || 0).getTime();
      const bx = new Date(b.endDate || b.startDate || 0).getTime();
      return bx - ax;
    });
  }, [items]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Debug info */}
      {!currentUser ? (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          <strong>No user info found.</strong> Check your login session.
          <div className="mt-2">
            <strong>Token:</strong>{' '}
            {debugToken ? (
              <span className="break-all">{debugToken}</span>
            ) : (
              <span className="text-red-800 font-medium">None</span>
            )}
            <br />
            <strong>Error:</strong> {debugError}
          </div>
        </div>
      ) : (
        <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
          <strong>Logged in as:</strong> {currentUser.email}
          <br />
          <strong>User ID:</strong> {currentUser.id}
        </div>
      )}

      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Education</h2>
        <p className="text-sm text-gray-600">Add entries and keep your timeline up to date.</p>
      </div>

      {/* Add education form */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-4 sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Add education</h3>

        {formError && <div className="text-red-600 mb-2 text-sm">{formError}</div>}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Education Level</label>
            <select
              value={form.educationLevel}
              onChange={(e) => setForm({ ...form, educationLevel: e.target.value })}
              className="w-full rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="High School">High School</option>
              <option value="Associate">Associate</option>
              <option value="Bachelor">Bachelor</option>
              <option value="Master">Master</option>
              <option value="PhD">PhD</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Degree</label>
            <input
              placeholder="Degree"
              value={form.degree}
              onChange={(e) => setForm({ ...form, degree: e.target.value })}
              className="w-full rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Institution</label>
            <input
              placeholder="Institution"
              value={form.institution}
              onChange={(e) => setForm({ ...form, institution: e.target.value })}
              className="w-full rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Field of Study</label>
            <input
              placeholder="Field of Study"
              value={form.fieldOfStudy}
              onChange={(e) => setForm({ ...form, fieldOfStudy: e.target.value })}
              className="w-full rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Start date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {!form.ongoing && (
            <div className="grid gap-2">
              <label className="text-sm text-gray-600">End date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.ongoing}
              onChange={(e) => setForm({ ...form, ongoing: e.target.checked, endDate: '' })}
              className="h-4 w-4 rounded border-[var(--border-color)] text-indigo-600"
            />
            Ongoing
          </label>

          <div className="grid grid-cols-[auto_1fr] items-center gap-2">
            <span className="text-sm text-gray-600">GPA</span>
            <input
              placeholder="GPA"
              value={form.gpa}
              onChange={(e) => setForm({ ...form, gpa: e.target.value })}
              className="w-24 rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.showGpa}
              onChange={(e) => setForm({ ...form, showGpa: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--border-color)] text-indigo-600"
            />
            Show GPA
          </label>

          <input
            placeholder="Honors (comma separated)"
            value={form.honors}
            onChange={(e) => setForm({ ...form, honors: e.target.value })}
            className="flex-1 rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div className="mt-4">
          <button
            onClick={() => {
              if (!form.degree || !form.institution || !form.startDate || !form.educationLevel) {
                setFormError('Please fill all required fields.');
                return;
              }
              setFormError(null);
              const payload = {
                ...form,
                honors: form.honors
                  ? form.honors.split(',').map((h: string) => h.trim()).filter(Boolean)
                  : [],
                gpa: form.gpa === '' ? null : Number(form.gpa),
              };
              axios.post(`${API}/education`, payload).then(() => {
                axios.get(`${API}/education/user/${currentUserId}`).then((r) => setItems(r.data));
                resetForm();
              });
            }}
            className="inline-flex items-center rounded-md bg-[var(--primary-color)] px-4 py-2 text-sm font-medium text-white hover:brightness-90"
          >
            Add
          </button>
        </div>
      </div>

      {/* Entries & Timeline */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Entries list */}
        <div>
          <h3 className="mb-3 text-lg font-semibold">Entries</h3>
          <ul className="space-y-3">
            {sorted.map((e) => (
              <li
                key={e.id}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {e.degree}{' '}
                      <span className="font-normal text-gray-600">— {e.institution}</span>
                    </div>
                    <div className="text-sm text-gray-600">{e.fieldOfStudy}</div>
                    <div className="text-sm">
                      {e.startDate?.slice(0, 10)} –{' '}
                      {e.endDate ? e.endDate.slice(0, 10) : 'Ongoing'}
                      {e.ongoing && (
                        <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                          In progress
                        </span>
                      )}
                    </div>
                    {e.showGpa && e.gpa && (
                      <div className="text-sm">
                        <strong>GPA:</strong> {e.gpa}
                      </div>
                    )}
                    {e.honors?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {e.honors.map((h: string, i: number) => (
                          <span
                            key={i}
                            className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-900"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    <button
                      onClick={() => {
                        if (!confirm('Delete this education entry?')) return;
                        axios
                          .delete(`${API}/education/${e.id}`)
                          .then(() =>
                            axios
                              .get(`${API}/education/user/${currentUserId}`)
                              .then((r) => setItems(r.data))
                          );
                      }}
                      className="inline-flex items-center rounded-md border border-[var(--border-color)] bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="mb-3 text-lg font-semibold">Timeline</h3>
          <div className="relative pl-6">
            <div className="absolute left-2 top-0 h-full w-[2px] bg-[var(--border-color)]" />
            {sorted.map((e) => (
              <div key={e.id} className="relative mb-4">
                <div
                  className={`absolute left-0 top-1 h-2.5 w-2.5 rounded-full ${
                    e.endDate ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                />
                <div className="ml-4">
                  <div className="font-medium">
                    {e.degree}{' '}
                    <span className="text-gray-600">@ {e.institution}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {e.startDate?.slice(0, 10)} –{' '}
                    {e.endDate ? e.endDate.slice(0, 10) : 'Present'}
                  </div>
                  <div className="text-xs text-gray-700">
                    <strong>Level:</strong> {e.educationLevel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
