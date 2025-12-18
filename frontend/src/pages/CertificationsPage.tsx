import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ExternalCertificationsTab from '../components/ExternalCertificationsTab';

// Helper to get JWT token from localStorage
function getToken() {
  return window.localStorage.getItem('token');
}

const API = (import.meta as any).env?.VITE_API_URL || 'https://cs490-backend.onrender.com';

type Props = { userId?: string };

export default function CertificationsPage({ userId }: Props) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [debugToken, setDebugToken] = useState<string | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);

  // Use userId from props, or fallback to localStorage
  const currentUserId = userId || window.localStorage.getItem('userId');

  // Fetch current user info from backend
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
        if (r.data?.user) {
          setCurrentUser({ id: r.data.user.id, email: r.data.user.email });
          setDebugError(null);
        } else {
          setCurrentUser(null);
          setDebugError('No user object in response.');
        }
      })
      .catch((err) => {
        setCurrentUser(null);
        setDebugError(
          err?.response?.data?.error || err?.message || 'Unknown error fetching user info.'
        );
      });
  }, []);

  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    userId: currentUserId,
    name: '',
    issuingOrganization: '',
    dateEarned: '',
    expirationDate: '',
    doesNotExpire: false,
    certificationNumber: '',
    documentUrl: '',
    category: '',
    renewalReminderDays: 30,
  });
  const [orgQuery, setOrgQuery] = useState('');
  const [orgOptions, setOrgOptions] = useState<string[]>([]);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'traditional' | 'external'>('traditional');

  useEffect(() => {
    if (!currentUserId) return;
    axios
      .get(`${API}/certifications/user/${currentUserId}`)
      .then((r) => setItems(r.data))
      .catch(() => {});
  }, [currentUserId]);

  useEffect(() => {
    if (!orgQuery) {
      setOrgOptions([]);
      return;
    }
    const id = setTimeout(() => {
      axios
        .get(`${API}/certifications/search/organizations?q=${encodeURIComponent(orgQuery)}`)
        .then((r) => {
          const opts = (r.data || []).map((x: any) => x.issuingOrganization).filter(Boolean);
          setOrgOptions(Array.from(new Set(opts)));
        })
        .catch(() => setOrgOptions([]));
    }, 250);
    return () => clearTimeout(id);
  }, [orgQuery]);

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) => new Date(b.dateEarned || 0).getTime() - new Date(a.dateEarned || 0).getTime()
      ),
    [items]
  );

  function handleFileInput(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setForm((f: any) => ({ ...f, documentUrl: url }));
      setUploadPreview(url);
    };
    reader.readAsDataURL(file);
  }

  function resetForm() {
    setForm({
      userId: currentUserId,
      name: '',
      issuingOrganization: '',
      dateEarned: '',
      expirationDate: '',
      doesNotExpire: false,
      certificationNumber: '',
      documentUrl: '',
      category: '',
      renewalReminderDays: 30,
    });
    setUploadPreview(null);
  }

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
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Certifications</h2>
        <p className="text-sm text-gray-600">
          Track your professional certifications and external platform achievements.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('traditional')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition ${
              activeTab === 'traditional'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            Traditional Certifications
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition ${
              activeTab === 'external'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            External Platforms
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'external' ? (
        <ExternalCertificationsTab userId={currentUserId || ''} />
      ) : (
        <>
          {/* Traditional Certifications Content */}

      {/* Add certification form */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-4 sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Add certification</h3>

        {errorMsg && <div className="text-red-600 mb-2 text-sm">{errorMsg}</div>}

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Certification Name</label>
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Issuing Organization</label>
            <input
              placeholder="Organization"
              value={form.issuingOrganization}
              onChange={(e) => setForm({ ...form, issuingOrganization: e.target.value })}
              onInput={(e) => setOrgQuery((e.target as HTMLInputElement).value)}
              list="orgOptions"
              className="input"
            />
            <datalist id="orgOptions">
              {orgOptions.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input"
            >
              <option value="">Select category</option>
              <option>Cloud</option>
              <option>Security</option>
              <option>Data</option>
              <option>Project Management</option>
              <option>Other</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Date Earned</label>
            <input
              type="date"
              value={form.dateEarned}
              onChange={(e) => setForm({ ...form, dateEarned: e.target.value })}
              className="input"
            />
          </div>

          {!form.doesNotExpire && (
            <div className="grid gap-2">
              <label className="text-sm text-gray-600">Expiration Date</label>
              <input
                type="date"
                value={form.expirationDate}
                onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                className="input"
              />
            </div>
          )}

          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Certification ID</label>
            <input
              placeholder="Certification ID"
              value={form.certificationNumber}
              onChange={(e) => setForm({ ...form, certificationNumber: e.target.value })}
              className="input"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Renewal Reminder (days)</label>
            <input
              type="number"
              min={0}
              value={form.renewalReminderDays}
              onChange={(e) => setForm({ ...form, renewalReminderDays: Number(e.target.value) })}
              placeholder="Reminder (days)"
              className="input"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Document</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileInput(e.target.files?.[0] || null)}
              className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-gray-700 hover:file:bg-gray-200"
            />
            {uploadPreview && (
              <a
                href={uploadPreview}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-[var(--primary-color)] hover:underline"
              >
                Preview document
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.doesNotExpire}
              onChange={(e) =>
                setForm({ ...form, doesNotExpire: e.target.checked, expirationDate: '' })
              }
              className="h-4 w-4 rounded border-[var(--border-color)] text-indigo-600"
            />
            Does not expire
          </label>
        </div>

        <div className="mt-4">
          <button
            onClick={() => {
              setErrorMsg(null);
              if (!currentUserId) {
                setErrorMsg('No userId found. Please log in again.');
                return;
              }
              if (!form.name || !form.issuingOrganization || !form.dateEarned) {
                setErrorMsg('Please fill in all required fields (Name, Organization, Date Earned).');
                return;
              }
              axios
                .post(`${API}/certifications`, { ...form, userId: currentUserId })
                .then(() =>
                  axios
                    .get(`${API}/certifications/user/${currentUserId}`)
                    .then((r) => {
                      setItems(r.data);
                      resetForm();
                    })
                )
                .catch((err) => {
                  setErrorMsg(
                    err?.response?.data?.message ||
                      'Failed to add certification. Please check your input and try again.'
                  );
                });
            }}
            className="btn btn-primary"
          >
            Add
          </button>
        </div>
      </div>

      {/* Certifications list */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Your Certifications</h3>
        {sorted.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-6 text-center text-gray-600">
            No certifications yet. Add your first one above!
          </div>
        ) : (
          <ul className="space-y-3">
            {sorted.map((c) => {
              const daysLeft =
                c.doesNotExpire || !c.expirationDate
                  ? null
                  : Math.ceil(
                      (new Date(c.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
              const statusColor = c.doesNotExpire
                ? 'bg-green-500'
                : daysLeft !== null && daysLeft <= 30
                ? 'bg-yellow-500'
                : 'bg-blue-500';

              return (
                <li
                  key={c.id}
                  className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-4"
                >
                  {editingId === c.id ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="grid gap-2">
                          <label className="text-sm text-gray-600">Name</label>
                          <input
                            placeholder="Name"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="input"
                          />
                        </div>

                        <div className="grid gap-2">
                          <label className="text-sm text-gray-600">Organization</label>
                          <input
                            placeholder="Organization"
                            value={editForm.issuingOrganization}
                            onChange={(e) =>
                              setEditForm({ ...editForm, issuingOrganization: e.target.value })
                            }
                            className="input"
                          />
                        </div>

                        <div className="grid gap-2">
                          <label className="text-sm text-gray-600">Date Earned</label>
                          <input
                            type="date"
                            value={editForm.dateEarned?.slice(0, 10) ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, dateEarned: e.target.value })}
                            className="input"
                          />
                        </div>

                        {!editForm.doesNotExpire && (
                          <div className="grid gap-2">
                            <label className="text-sm text-gray-600">Expiration Date</label>
                            <input
                              type="date"
                              value={editForm.expirationDate?.slice(0, 10) ?? ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, expirationDate: e.target.value })
                              }
                              className="input"
                            />
                          </div>
                        )}

                        <div className="grid gap-2">
                          <label className="text-sm text-gray-600">Certification ID</label>
                          <input
                            placeholder="Certification ID"
                            value={editForm.certificationNumber ?? ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, certificationNumber: e.target.value })
                            }
                            className="input"
                          />
                        </div>

                        <div className="grid gap-2">
                          <label className="text-sm text-gray-600">Category</label>
                          <select
                            value={editForm.category ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className="input"
                          >
                            <option value="">Select category</option>
                            <option>Cloud</option>
                            <option>Security</option>
                            <option>Data</option>
                            <option>Project Management</option>
                            <option>Other</option>
                          </select>
                        </div>
                      </div>

                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={!!editForm.doesNotExpire}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              doesNotExpire: e.target.checked,
                              expirationDate: null,
                            })
                          }
                          className="h-4 w-4 rounded border-[var(--border-color)] text-indigo-600"
                        />
                        Does not expire
                      </label>

                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={() => {
                            axios.put(`${API}/certifications/${c.id}`, editForm).then(() => {
                              setEditingId(null);
                              setEditForm(null);
                              axios
                                .get(`${API}/certifications/user/${currentUserId}`)
                                .then((r) => setItems(r.data));
                            });
                          }}
                          className="btn btn-primary"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditForm(null);
                          }}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {c.name}{' '}
                            <span className="font-normal text-gray-600">
                              — {c.issuingOrganization}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Earned: {c.dateEarned?.slice(0, 10)}{' '}
                            {c.doesNotExpire
                              ? '(Does not expire)'
                              : c.expirationDate
                              ? `• Expires: ${c.expirationDate?.slice(0, 10)}`
                              : ''}
                          </div>
                          {c.certificationNumber && (
                            <div className="text-sm text-gray-700 mt-1">
                              <strong>ID:</strong> {c.certificationNumber}
                            </div>
                          )}
                          {c.category && (
                            <div className="text-sm text-gray-700">
                              <strong>Category:</strong> {c.category}
                            </div>
                          )}
                          {c.documentUrl && (
                            <div className="mt-2">
                              <a
                                href={c.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium text-[var(--primary-color)] hover:underline"
                              >
                                View document
                              </a>
                            </div>
                          )}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span
                              className={`inline-block ${statusColor} text-white px-3 py-1 rounded-full text-xs font-medium`}
                            >
                              {c.doesNotExpire
                                ? 'Permanent'
                                : daysLeft !== null
                                ? `${daysLeft} days left`
                                : 'No expiration set'}
                            </span>
                            <span className="inline-block bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-medium">
                              Verification: {c.verificationStatus ?? 'Unverified'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setEditingId(c.id);
                            setEditForm({ ...c });
                          }}
                          className="btn btn-secondary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm('Delete this certification?')) return;
                            if (!currentUserId) return;
                            axios
                              .delete(`${API}/certifications/${c.id}`)
                              .then(() =>
                                axios
                                  .get(`${API}/certifications/user/${currentUserId}`)
                                  .then((r) => setItems(r.data))
                              );
                          }}
                          className="btn btn-secondary"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
        </>
      )}
    </div>
  );
}
