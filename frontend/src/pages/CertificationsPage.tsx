import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useEffect as useReactEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Helper to get JWT token from localStorage
function getToken() {
  return window.localStorage.getItem('token');
}

const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

type Props = { userId?: string };
export default function CertificationsPage({ userId }: Props) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [debugToken, setDebugToken] = useState<string | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);
  // Fetch current user info from backend
  useEffect(() => {
    // Redirect to login if no token
    if (!window.localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    const token = getToken();
    setDebugToken(token || null);
    if (!token) {
      setDebugError('No token found in localStorage.');
      return;
    }
    axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
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
        setDebugError(err?.response?.data?.error || err?.message || 'Unknown error fetching user info.');
      });
  }, []);
  const [items, setItems] = useState<any[]>([]);
  // Use userId from props, or fallback to localStorage
  const currentUserId = userId || window.localStorage.getItem('userId');
  const [form, setForm] = useState<any>({ userId: currentUserId, name: '', issuingOrganization: '', dateEarned: '', expirationDate: '', doesNotExpire: false, certificationNumber: '', documentUrl: '', category: '', renewalReminderDays: 30 });
  const [orgQuery, setOrgQuery] = useState('');
  const [orgOptions, setOrgOptions] = useState<string[]>([]);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
  if (!currentUserId) return;
  axios.get(`${API}/certifications/user/${currentUserId}`).then((r) => setItems(r.data)).catch(() => {});
  }, [currentUserId]);

  useEffect(() => {
    if (!orgQuery) { setOrgOptions([]); return; }
    const id = setTimeout(() => {
      axios.get(`${API}/certifications/search/organizations?q=${encodeURIComponent(orgQuery)}`).then(r => {
        const opts = (r.data || []).map((x: any) => x.issuingOrganization).filter(Boolean);
        setOrgOptions(Array.from(new Set(opts)));
      }).catch(() => setOrgOptions([]));
    }, 250);
    return () => clearTimeout(id);
  }, [orgQuery]);

  const sorted = useMemo(() => [...items].sort((a, b) => new Date(b.dateEarned || 0).getTime() - new Date(a.dateEarned || 0).getTime()), [items]);

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

  return (
    <div style={{ padding: 20 }}>
      {currentUser ? (
        <div style={{ marginBottom: 16, background: '#f3f4f6', padding: 10, borderRadius: 6 }}>
          <strong>Logged in as:</strong> {currentUser.email}<br />
          <strong>User ID:</strong> {currentUser.id}
        </div>
      ) : (
        <div style={{ marginBottom: 16, background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 6 }}>
          <strong>No user info found.</strong> You may not be logged in, or there was an error fetching your user ID.<br />
          <div style={{ marginTop: 8, fontSize: 13 }}>
            <strong>Token:</strong> {debugToken ? debugToken : <span style={{ color: '#991b1b' }}>None</span>}<br />
            <strong>Backend error:</strong> {debugError}
          </div>
        </div>
      )}
      {errorMsg && (
        <div style={{ color: 'red', marginBottom: 10 }}>{errorMsg}</div>
      )}
      <h2>Certifications</h2>
      <div style={{ marginBottom: 20 }}>
        <h3>Add certification</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Organization" value={form.issuingOrganization} onChange={(e) => setForm({ ...form, issuingOrganization: e.target.value })} onInput={(e) => setOrgQuery((e.target as HTMLInputElement).value)} list="orgOptions" />
          <datalist id="orgOptions">
            {orgOptions.map((o) => (<option key={o} value={o} />))}
          </datalist>
          <input type="date" value={form.dateEarned} onChange={(e) => setForm({ ...form, dateEarned: e.target.value })} />
          {!form.doesNotExpire && (
            <input type="date" value={form.expirationDate} onChange={(e) => setForm({ ...form, expirationDate: e.target.value })} />
          )}
          <label style={{ marginRight: 8 }}>
            <input type="checkbox" checked={form.doesNotExpire} onChange={(e) => setForm({ ...form, doesNotExpire: e.target.checked, expirationDate: '' })} /> Does not expire
          </label>
          <input placeholder="Certification ID" value={form.certificationNumber} onChange={(e) => setForm({ ...form, certificationNumber: e.target.value })} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Category</option>
            <option>Cloud</option>
            <option>Security</option>
            <option>Data</option>
            <option>Project Management</option>
            <option>Other</option>
          </select>
          <input type="number" min={0} style={{ width: 120 }} value={form.renewalReminderDays} onChange={(e) => setForm({ ...form, renewalReminderDays: Number(e.target.value) })} placeholder="Reminder (days)" />
          <label style={{ display: 'inline-block' }}>
            <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileInput(e.target.files?.[0] || null)} />
          </label>
          {uploadPreview && (
            <a href={uploadPreview} target="_blank" rel="noreferrer">Preview</a>
          )}
          <button onClick={() => {
            setErrorMsg(null);
            if (!currentUserId) {
              setErrorMsg('No userId found. Please log in again.');
              return;
            }
            axios.post(`${API}/certifications`, { ...form, userId: currentUserId })
              .then(() => axios.get(`${API}/certifications/user/${currentUserId}`).then((r) => setItems(r.data)))
              .catch((err) => {
                setErrorMsg(err?.response?.data?.message || 'Failed to add certification. Please check your input and try again.');
              });
          }}>Add</button>
        </div>
      </div>
      <ul>
        {sorted.map((c) => {
          const daysLeft = c.doesNotExpire || !c.expirationDate ? null : Math.ceil((new Date(c.expirationDate).getTime() - Date.now()) / (1000*60*60*24));
          const statusColor = c.doesNotExpire ? '#10b981' : daysLeft !== null && daysLeft <= 30 ? '#f59e0b' : '#3b82f6';
          return (
            <li key={c.id} style={{ marginBottom: 8, border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
              {editingId === c.id ? (
                <div>
                  <input placeholder="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />{' '}
                  <input placeholder="Organization" value={editForm.issuingOrganization} onChange={(e) => setEditForm({ ...editForm, issuingOrganization: e.target.value })} />{' '}
                  <input type="date" value={editForm.dateEarned?.slice(0,10) ?? ''} onChange={(e) => setEditForm({ ...editForm, dateEarned: e.target.value })} />{' '}
                  {!editForm.doesNotExpire && (
                    <input type="date" value={editForm.expirationDate?.slice(0,10) ?? ''} onChange={(e) => setEditForm({ ...editForm, expirationDate: e.target.value })} />
                  )}{' '}
                  <label>
                    <input type="checkbox" checked={!!editForm.doesNotExpire} onChange={(e) => setEditForm({ ...editForm, doesNotExpire: e.target.checked, expirationDate: null })} /> Does not expire
                  </label>
                  <input placeholder="Certification ID" value={editForm.certificationNumber ?? ''} onChange={(e) => setEditForm({ ...editForm, certificationNumber: e.target.value })} />
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => { axios.put(`${API}/certifications/${c.id}`, editForm).then(() => { setEditingId(null); setEditForm(null); axios.get(`${API}/certifications/user/1`).then((r) => setItems(r.data)); }); }}>Save</button>{' '}
                    <button onClick={() => { setEditingId(null); setEditForm(null); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div>
                      <strong>{c.name}</strong> — {c.issuingOrganization}
                      <div style={{ color: '#6b7280' }}>Earned: {c.dateEarned?.slice(0,10)} {c.doesNotExpire ? '(Does not expire)' : c.expirationDate ? `- Expires ${c.expirationDate?.slice(0,10)}` : ''}</div>
                      {c.certificationNumber && <div>ID: {c.certificationNumber}</div>}
                      {c.category && <div>Category: {c.category}</div>}
                      {c.documentUrl && <div><a href={c.documentUrl} target="_blank">View document</a></div>}
                      <div style={{ marginTop: 6 }}>
                        <span style={{ background: statusColor, color: '#fff', padding: '2px 8px', borderRadius: 999 }}>{c.doesNotExpire ? 'Permanent' : daysLeft !== null ? `${daysLeft} days left` : 'No expiration set'}</span>
                        <span style={{ marginLeft: 8, background: '#111827', color: '#fff', padding: '2px 8px', borderRadius: 999 }}>Verification: {c.verificationStatus ?? 'Unverified'}</span>
                      </div>
                    </div>
                    <div>
                      <button onClick={() => { setEditingId(c.id); setEditForm({ ...c }); }}>Edit</button>
                    </div>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <button onClick={() => {
                      if (!confirm('Delete this certification?')) return;
                      if (!currentUserId) return;
                      axios.delete(`${API}/certifications/${c.id}`).then(() => axios.get(`${API}/certifications/user/${currentUserId}`).then((r) => setItems(r.data)));
                    }}>Delete</button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
