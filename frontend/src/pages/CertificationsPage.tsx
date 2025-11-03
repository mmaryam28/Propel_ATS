import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function getToken() {
  return window.localStorage.getItem('token');
}

const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

type Props = { userId?: string };

export default function CertificationsPage({ userId }: Props) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [debugToken, setDebugToken] = useState<string | null>(null);

  // --- Auth check & fetch current user ---
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setDebugToken(token);
    axios
      .get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.data?.user) setCurrentUser({ id: r.data.user.id, email: r.data.user.email });
        else setDebugError('No user object in response.');
      })
      .catch((err) => {
        setDebugError(err?.response?.data?.error || err?.message || 'Error fetching user info.');
      });
  }, []);

  // --- State ---
  const currentUserId = userId || window.localStorage.getItem('userId');
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

  // --- Fetch user certifications ---
  useEffect(() => {
    if (!currentUserId) return;
    axios
      .get(`${API}/certifications/user/${currentUserId}`)
      .then((r) => setItems(r.data))
      .catch(() => {});
  }, [currentUserId]);

  // --- Autocomplete organization ---
  useEffect(() => {
    if (!orgQuery) {
      setOrgOptions([]);
      return;
    }
    const id = setTimeout(() => {
      axios
        .get(`${API}/certifications/search/organizations?q=${encodeURIComponent(orgQuery)}`)
        .then((r) => {
          const opts = (r.data || [])
            .map((x: any) => x.issuingOrganization)
            .filter(Boolean);
          setOrgOptions(Array.from(new Set(opts)));
        })
        .catch(() => setOrgOptions([]));
    }, 250);
    return () => clearTimeout(id);
  }, [orgQuery]);

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.dateEarned || 0).getTime() -
          new Date(a.dateEarned || 0).getTime()
      ),
    [items]
  );

  // --- File upload preview ---
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

  // --- Add new certification ---
  function handleAdd() {
    setErrorMsg(null);
    if (!currentUserId) {
      setErrorMsg('No userId found. Please log in again.');
      return;
    }
    axios
      .post(`${API}/certifications`, { ...form, userId: currentUserId })
      .then(() =>
        axios
          .get(`${API}/certifications/user/${currentUserId}`)
          .then((r) => setItems(r.data))
      )
      .catch((err) =>
        setErrorMsg(
          err?.response?.data?.message ||
            'Failed to add certification. Please check your input and try again.'
        )
      );
  }

  return (
    <div className="space-y-6">
      {/* Debug Panel */}
      {!currentUser ? (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          <strong>No user info found.</strong> Check your login session.<br />
          <strong>Token:</strong>{' '}
          {debugToken ? (
            <span className="break-all">{debugToken}</span>
          ) : (
            <span className="font-medium text-red-800">None</span>
          )}
          <br />
          <strong>Error:</strong> {debugError}
        </div>
      ) : (
        <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
          <strong>Logged in as:</strong> {currentUser.email}
          <br />
          <strong>User ID:</strong> {currentUser.id}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-md bg-red-100 p-3 text-sm text-red-700">{errorMsg}</div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Certifications</h2>
        <p className="text-sm text-gray-600">Keep your certs current and verified.</p>
      </div>

      {/* Add Form */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-4 sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Add certification</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary-color)/0.25]"
          />
          <input
            placeholder="Organization"
            value={form.issuingOrganization}
            onChange={(e) => setForm({ ...form, issuingOrganization: e.target.value })}
            onInput={(e) => setOrgQuery((e.target as HTMLInputElement).value)}
            list="orgOptions"
            className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary-color)/0.25]"
          />
          <datalist id="orgOptions">
            {orgOptions.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
          <input
            type="date"
            value={form.dateEarned}
            onChange={(e) => setForm({ ...form, dateEarned: e.target.value })}
            className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary-color)/0.25]"
          />
          {!form.doesNotExpire && (
            <input
              type="date"
              value={form.expirationDate}
              onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
              className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary-color)/0.25]"
            />
          )}
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.doesNotExpire}
              onChange={(e) =>
                setForm({ ...form, doesNotExpire: e.target.checked, expirationDate: '' })
              }
              className="h-4 w-4 rounded border-[var(--border-color)] text-[var(--primary-color)]"
            />
            Does not expire
          </label>
          <input
            placeholder="Certification ID"
            value={form.certificationNumber}
            onChange={(e) =>
              setForm({ ...form, certificationNumber: e.target.value })
            }
            className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary-color)/0.25]"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary-color)/0.25]"
          >
            <option value="">Category</option>
            <option>Cloud</option>
            <option>Security</option>
            <option>Data</option>
            <option>Project Management</option>
            <option>Other</option>
          </select>
          <input
            type="number"
            min={0}
            value={form.renewalReminderDays}
            onChange={(e) =>
              setForm({ ...form, renewalReminderDays: Number(e.target.value) })
            }
            className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary-color)/0.25]"
            placeholder="Reminder (days)"
          />
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => handleFileInput(e.target.files?.[0] || null)}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-gray-700 hover:file:bg-gray-200"
          />
          {uploadPreview && (
            <a
              href={uploadPreview}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-[var(--primary-color)] hover:underline"
            >
              Preview
            </a>
          )}
        </div>
        <button
          onClick={handleAdd}
          className="mt-4 inline-flex items-center rounded-md bg-[var(--primary-color)] px-4 py-2 text-sm font-medium text-white hover:brightness-90"
        >
          Add
        </button>
      </div>

      {/* List */}
      <ul className="space-y-3">
        {sorted.map((c) => {
          const daysLeft =
            c.doesNotExpire || !c.expirationDate
              ? null
              : Math.ceil(
                  (new Date(c.expirationDate).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                );
          const statusColor = c.doesNotExpire
            ? 'var(--success-color)'
            : daysLeft !== null && daysLeft <= 30
            ? 'var(--warning-color)'
            : 'var(--accent-color)';

          return (
            <li
              key={c.id}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-gray-900">
                    {c.name}{' '}
                    <span className="font-normal text-gray-600">
                      — {c.issuingOrganization}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Earned: {c.dateEarned?.slice(0, 10)}{' '}
                    {c.doesNotExpire
                      ? '(Does not expire)'
                      : c.expirationDate
                      ? `- Expires ${c.expirationDate?.slice(0, 10)}`
                      : ''}
                  </div>
                  {c.certificationNumber && (
                    <div className="text-sm">ID: {c.certificationNumber}</div>
                  )}
                  {c.category && <div className="text-sm">Category: {c.category}</div>}
                  {c.documentUrl && (
                    <a
                      href={c.documentUrl}
                      target="_blank"
                      className="text-sm font-medium text-[var(--primary-color)] hover:underline"
                    >
                      View document
                    </a>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ background: statusColor }}
                    >
                      {c.doesNotExpire
                        ? 'Permanent'
                        : daysLeft !== null
                        ? `${daysLeft} days left`
                        : 'No expiration set'}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-gray-900 px-2 py-0.5 text-xs font-medium text-white">
                      Verification: {c.verificationStatus ?? 'Unverified'}
                    </span>
                  </div>
                </div>
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
                  className="inline-flex items-center rounded-md border border-[var(--border-color)] bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
