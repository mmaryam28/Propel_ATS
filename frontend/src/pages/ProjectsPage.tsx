import { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import ConfirmDialog from '../components/ConfirmDialog';

const API = (import.meta as any).env?.VITE_API_URL || 'https://cs490-backend.onrender.com';

export default function ProjectsPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({
    userId: '',
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    technologies: '',
    url: '',
    outcomes: '',
    industry: '',
    status: 'Planned',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [error, setError] = useState<string>('');

  // Get userId from JWT and API
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          setLoading(false);
          setHasAttemptedLoad(true);
          return;
        }

        const decoded: any = jwtDecode(token);
        const potentialId = decoded?.sub || decoded?.id || decoded?.userId;

        const res = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const validId = res.data?.id || res.data?.userId || potentialId;
        
        if (validId) {
          setCurrentUserId(String(validId));
          setForm((prev) => ({ ...prev, userId: String(validId) }));
        }
      } catch (err) {
        console.error('Error fetching user ID:', err);
      } finally {
        setLoading(false);
        setHasAttemptedLoad(true);
      }
    };

    fetchUserId();
  }, []);

  // Transform snake_case to camelCase
  const transformProject = (project: any) => {
    // Capitalize status (COMPLETED -> Completed)
    const capitalizeStatus = (status: string) => {
      if (!status) return status;
      const lower = status.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    };
    
    return {
      ...project,
      userId: project.user_id,
      startDate: project.start_date,
      endDate: project.end_date,
      status: capitalizeStatus(project.status),
    };
  };

  // Load projects
  useEffect(() => {
    if (!currentUserId) return;
    axios.get(`${API}/projects/user/${currentUserId}`).then((r) => {
      const transformed = r.data.map(transformProject);
      setItems(transformed);
    });
  }, [currentUserId]);

  // Sort projects by start date (newest first)
  const sortedItems = [...items].sort((a, b) => {
    const dateA = new Date(a.startDate || 0).getTime();
    const dateB = new Date(b.startDate || 0).getTime();
    return dateB - dateA;
  });

  if (loading) {
    return (
      <div className="container mx-auto space-y-6 p-4 sm:p-6">
        <div className="text-center py-8 text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!currentUserId && hasAttemptedLoad) {
    return (
      <div className="container mx-auto space-y-6 p-4 sm:p-6">
        <div className="text-center py-8 text-red-600">Unable to load user information. Please log in again.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
      </div>

      {/* Add Form */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-4 sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Add Project</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Project Name */}
          <div className="grid gap-2 sm:col-span-2">
            <label className="text-sm text-gray-600">Project name <span className="text-red-500">*</span></label>
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              required
            />
          </div>

          {/* Description */}
          <div className="grid gap-2 sm:col-span-2">
            <label className="text-sm text-gray-600">Description</label>
            <textarea
              placeholder="Brief project description..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input min-h-[80px] resize-y"
              rows={3}
            />
          </div>

          {/* Start Date */}
          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Start date <span className="text-red-500">*</span></label>
            <input
              type="month"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="input"
              required
            />
          </div>

          {/* End Date */}
          <div className="grid gap-2">
            <label className="text-sm text-gray-600">End date</label>
            <input
              type="month"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="input"
            />
          </div>

          {/* Technologies */}
          <div className="grid gap-2 sm:col-span-2">
            <label className="text-sm text-gray-600">Technologies (comma separated)</label>
            <input
              placeholder="React, Node, PostgreSQL…"
              value={form.technologies}
              onChange={(e) => setForm({ ...form, technologies: e.target.value })}
              className="input"
            />
          </div>

          {/* Project URL */}
          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Project URL</label>
            <input
              placeholder="https://…"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="input"
            />
          </div>

          {/* Industry */}
          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Industry</label>
            <select
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className="input"
            >
              <option value="">Select Industry</option>
              <option value="Fintech">Fintech</option>
              <option value="Healthcare">Healthcare</option>
              <option value="E-commerce">E-commerce</option>
              <option value="SaaS">SaaS</option>
              <option value="Education">Education</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Social Media">Social Media</option>
              <option value="Gaming">Gaming</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Mobile Apps">Mobile Apps</option>
              <option value="Web Development">Web Development</option>
              <option value="AI/ML">AI/ML</option>
              <option value="IoT">IoT</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Outcomes */}
          <div className="grid gap-2 sm:col-span-2">
            <label className="text-sm text-gray-600">Outcomes & achievements</label>
            <textarea
              placeholder="Impact, metrics, results…"
              value={form.outcomes}
              onChange={(e) => setForm({ ...form, outcomes: e.target.value })}
              className="input min-h-[60px] resize-y"
              rows={2}
            />
          </div>

          {/* Status */}
          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="input"
            >
              <option>Planned</option>
              <option>Ongoing</option>
              <option>Completed</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={async () => {
              if (!form.name || form.name.trim().length === 0) {
                setError('Project name is required');
                return;
              }
              if (!form.startDate) {
                setError('Start date is required');
                return;
              }
              
              setError('');
              // Convert YYYY-MM to YYYY-MM-01 for backend
              const startDateISO = form.startDate ? `${form.startDate}-01` : '';
              const endDateISO = form.endDate ? `${form.endDate}-01` : '';
              
              // Add https:// if URL doesn't have protocol
              let projectUrl = form.url;
              if (projectUrl && !projectUrl.startsWith('http')) {
                projectUrl = `https://${projectUrl}`;
              }
              
              const payload = {
                ...form,
                startDate: startDateISO,
                endDate: endDateISO || null,
                url: projectUrl,
                technologies: form.technologies
                  ? form.technologies.split(',').map((t: string) => t.trim()).filter(Boolean)
                  : [],
              };
              const res = await axios.post(`${API}/projects`, payload);
              const proj = transformProject(res.data);
              setForm({
                userId: currentUserId || '',
                name: '',
                description: '',
                startDate: '',
                endDate: '',
                technologies: '',
                url: '',
                outcomes: '',
                industry: '',
                status: 'Planned',
              });
              axios.get(`${API}/projects/user/${currentUserId}`).then((r) => {
                const transformed = r.data.map(transformProject);
                setItems(transformed);
              });
            }}
            className="btn btn-primary"
          >
            Add
          </button>
        </div>
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedItems.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-4"
          >
            {editingId === p.id ? (
              <div className="space-y-3">
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input"
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="input min-h-[60px] resize-y"
                  rows={2}
                />
                <select
                  value={editForm.status || 'Planned'}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="input"
                >
                  <option>Planned</option>
                  <option>Ongoing</option>
                  <option>Completed</option>
                </select>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Convert month inputs to ISO dates if needed
                      const payload = { ...editForm };
                      if (editForm.startDate && editForm.startDate.length === 7) {
                        payload.startDate = `${editForm.startDate}-01`;
                      }
                      if (editForm.endDate && editForm.endDate.length === 7) {
                        payload.endDate = `${editForm.endDate}-01`;
                      }
                      
                      axios.put(`${API}/projects/${p.id}`, payload).then(() => {
                        setEditingId(null);
                        setEditForm(null);
                        axios.get(`${API}/projects/user/${currentUserId}`).then((r) => {
                          const transformed = r.data.map(transformProject);
                          setItems(transformed);
                        });
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
                <h3 className="mb-1 text-lg font-semibold text-gray-900">{p.name}</h3>
                {p.description && <div className="mt-2 text-sm text-gray-800">{p.description}</div>}

                {Array.isArray(p.technologies) && p.technologies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.technologies.map((t: string, i: number) => (
                      <span
                        key={i}
                        className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-900"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {p.industry && (
                  <div className="mt-3 text-sm">
                    <strong>Industry:</strong> {p.industry}
                  </div>
                )}

                <div className="mt-3 text-sm">
                  <strong>Status:</strong> {p.status}
                </div>

                {p.url && (
                  <div className="mt-1">
                    <a
                      href={p.url.startsWith('http') ? p.url : `https://${p.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[var(--primary-color)] hover:underline"
                    >
                      Visit Project
                    </a>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setEditingId(p.id);
                      const editData = { ...p };
                      // Convert ISO dates to YYYY-MM for month inputs
                      if (editData.startDate) {
                        editData.startDate = editData.startDate.slice(0, 7);
                      }
                      if (editData.endDate) {
                        editData.endDate = editData.endDate.slice(0, 7);
                      }
                      setEditForm(editData);
                    }}
                    className="btn btn-secondary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(p)}
                    className="btn btn-secondary"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (confirmDelete) {
            axios
              .delete(`${API}/projects/${confirmDelete.id}`)
              .then(() => {
                axios.get(`${API}/projects/user/${currentUserId}`).then((r) => {
                  const transformed = r.data.map(transformProject);
                  setItems(transformed);
                });
                setConfirmDelete(null);
              });
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
