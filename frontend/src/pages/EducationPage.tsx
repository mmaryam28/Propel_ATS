import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Helper: get token
function getToken() {
  return window.localStorage.getItem('token');
}

const API = (import.meta as any).env?.VITE_API_URL || 'https://cs490-backend.onrender.com';

export function getEducationCompleteness(entries: any[]): number {
  return entries.length > 0 ? 20 : 0;
}

export default function EducationPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [debugToken, setDebugToken] = useState<string | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Extract userId from JWT token and fetch user data
  useEffect(() => {
    const token = getToken();
    setDebugToken(token || null);
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Decode JWT to get userId as fallback
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub || payload.userId || payload.id;
      if (userId) {
        setCurrentUserId(userId);
      }
    } catch (err) {
      console.error('Failed to parse JWT token:', err);
    }
    
    axios
      .get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.data?.user) {
          setCurrentUser({ id: r.data.user.id, email: r.data.user.email });
          // Use the user ID from the API response as the authoritative source
          setCurrentUserId(r.data.user.id);
        } else {
          setDebugError('No user object in response.');
        }
      })
      .catch((err) =>
        setDebugError(err?.response?.data?.error || err?.message || 'Unknown error fetching user info.')
      )
      .finally(() => setHasAttemptedLoad(true));
  }, []);

  const [formError, setFormError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<any>({
    degree: 'High School Diploma',
    institution: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    ongoing: false,
    gpa: '',
    showGpa: true,
    honors: '',
  });

  function resetForm() {
    setForm({
      degree: 'High School Diploma',
      institution: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      ongoing: false,
      gpa: '',
      showGpa: true,
      honors: '',
    });
  }

  useEffect(() => {
    if (!currentUserId) return;
    axios
      .get(`${API}/education/user/${currentUserId}`)
      .then((r) => {
        console.log('Education items:', r.data);
        if (r.data.length > 0) {
          console.log('First item id type:', typeof r.data[0].id, 'value:', r.data[0].id);
        }
        setItems(r.data);
      })
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
      {hasAttemptedLoad && !currentUser ? (
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
      ) : null}

      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Education</h2>
        <p className="text-sm text-gray-600">Add entries and keep your timeline up to date.</p>
      </div>

      {/* Add education form */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-4 sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {editingId ? 'Edit Education' : 'Add Education'}
        </h3>

        {formError && <div className="text-red-600 mb-2 text-sm">{formError}</div>}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Degree</label>
            <select
              value={form.degree}
              onChange={(e) => setForm({ ...form, degree: e.target.value })}
              className="w-full rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="High School Diploma">High School Diploma</option>
              <option value="GED">GED</option>
              <option value="Associate of Arts (AA)">Associate of Arts (AA)</option>
              <option value="Associate of Science (AS)">Associate of Science (AS)</option>
              <option value="Associate of Applied Science (AAS)">Associate of Applied Science (AAS)</option>
              <option value="Bachelor of Arts (BA)">Bachelor of Arts (BA)</option>
              <option value="Bachelor of Science (BS)">Bachelor of Science (BS)</option>
              <option value="Bachelor of Fine Arts (BFA)">Bachelor of Fine Arts (BFA)</option>
              <option value="Bachelor of Business Administration (BBA)">Bachelor of Business Administration (BBA)</option>
              <option value="Bachelor of Engineering (BEng)">Bachelor of Engineering (BEng)</option>
              <option value="Master of Arts (MA)">Master of Arts (MA)</option>
              <option value="Master of Science (MS)">Master of Science (MS)</option>
              <option value="Master of Business Administration (MBA)">Master of Business Administration (MBA)</option>
              <option value="Master of Engineering (MEng)">Master of Engineering (MEng)</option>
              <option value="Master of Education (MEd)">Master of Education (MEd)</option>
              <option value="Doctor of Philosophy (PhD)">Doctor of Philosophy (PhD)</option>
              <option value="Doctor of Education (EdD)">Doctor of Education (EdD)</option>
              <option value="Juris Doctor (JD)">Juris Doctor (JD)</option>
              <option value="Doctor of Medicine (MD)">Doctor of Medicine (MD)</option>
              <option value="Professional Certificate">Professional Certificate</option>
              <option value="Bootcamp Certificate">Bootcamp Certificate</option>
              <option value="Other">Other</option>
            </select>
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
              type="month"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {!form.ongoing && (
            <div className="grid gap-2">
              <label className="text-sm text-gray-600">End date</label>
              <input
                type="month"
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
            type="button"
            onClick={() => {
              console.log('Current User ID:', currentUserId);
              console.log('Current User:', currentUser);
              
              if (!form.degree || !form.institution || !form.startDate) {
                setFormError('Please fill all required fields.');
                return;
              }
              if (!currentUserId || currentUserId === 'NaN' || currentUserId === 'undefined') {
                setFormError('User ID not available. Please refresh the page and try again.');
                console.error('Invalid currentUserId:', currentUserId);
                return;
              }
              setFormError(null);
              const payload = {
                ...form,
                userId: currentUserId,
                honors: form.honors
                  ? form.honors.split(',').map((h: string) => h.trim()).filter(Boolean)
                  : [],
                gpa: form.gpa === '' ? null : Number(form.gpa),
              };
              console.log('Sending payload:', payload);
              
              if (editingId) {
                // Update existing education (exclude userId from update payload)
                const { userId, ...updatePayload } = payload;
                axios.put(`${API}/education/${editingId}`, updatePayload).then(() => {
                  axios.get(`${API}/education/user/${currentUserId}`).then((r) => setItems(r.data));
                  resetForm();
                  setEditingId(null);
                }).catch((err) => {
                  console.error('Error updating education:', err);
                  setFormError(err.response?.data?.message || 'Failed to update education entry');
                });
              } else {
                // Add new education
                axios.post(`${API}/education`, payload).then(() => {
                  axios.get(`${API}/education/user/${currentUserId}`).then((r) => setItems(r.data));
                  resetForm();
                }).catch((err) => {
                  console.error('Error adding education:', err);
                  setFormError(err.response?.data?.message || 'Failed to add education entry');
                });
              }
            }}
            className="inline-flex items-center rounded-md bg-[var(--primary-color)] px-4 py-2 text-sm font-medium text-white hover:brightness-90"
          >
            {editingId ? 'Update' : 'Add'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setEditingId(null);
              }}
              className="ml-2 inline-flex items-center rounded-md border border-[var(--border-color)] bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-blue-700">Timeline</h3>
        <div className="relative pl-6">
          <div className="absolute left-2 top-0 h-full w-[2px] bg-[var(--border-color)]" />
          {sorted.map((e) => {
            const formatDate = (dateStr: string) => {
              if (!dateStr) return '';
              const date = new Date(dateStr);
              return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            };

            return (
              <div key={e.id} className="relative mb-4">
                <div
                  className={`absolute left-0 top-1 h-2.5 w-2.5 rounded-full ${
                    e.ongoing || !e.endDate ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                />
                <div className="ml-4">
                  <div className="font-medium">
                    {e.degree}{' '}
                    <span className="text-gray-600">@ {e.institution}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {formatDate(e.startDate)} –{' '}
                    {e.ongoing || !e.endDate ? 'Present' : formatDate(e.endDate)}
                  </div>
                  {e.showGpa && e.gpa && (
                    <div className="text-xs text-gray-700">
                      <strong>GPA:</strong> {e.gpa}
                    </div>
                  )}
                  {e.honors?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {e.honors.map((h: string, i: number) => (
                        <span
                          key={i}
                          className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => {
                        console.log('Editing education id:', e.id, 'type:', typeof e.id);
                        setEditingId(e.id);
                        setForm({
                          degree: e.degree || 'High School Diploma',
                          institution: e.institution || '',
                          fieldOfStudy: e.fieldOfStudy || '',
                          startDate: e.startDate?.slice(0, 7) || '',
                          endDate: e.endDate?.slice(0, 7) || '',
                          ongoing: e.ongoing || false,
                          gpa: e.gpa || '',
                          showGpa: e.showGpa ?? true,
                          honors: e.honors?.join(', ') || '',
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center rounded-md border border-[var(--border-color)] bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
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
                      className="inline-flex items-center rounded-md border border-[var(--border-color)] bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
