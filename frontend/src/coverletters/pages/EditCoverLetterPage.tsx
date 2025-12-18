import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getSavedCoverLetter, updateCoverLetter, exportCoverLetter } from '../api/client';
import type { SavedCoverLetter } from '../api/client';

//test commit

export default function EditCoverLetterPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [coverLetter, setCoverLetter] = useState<SavedCoverLetter | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    if (id) {
      loadCoverLetter();
    }
  }, [id]);

  async function loadCoverLetter() {
    if (!id) return;
    
    setLoading(true);
    setError('');
    try {
      const data = await getSavedCoverLetter(id);
      setCoverLetter(data);
      setTitle(data.title);
      setContent(data.content);
    } catch (e: any) {
      setError(e?.message || 'Failed to load cover letter');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!id) return;
    
    setSaving(true);
    setSaveSuccess('');
    setError('');
    try {
      await updateCoverLetter(id, { title, content });
      setSaveSuccess('Changes saved successfully!');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function handleExport(format: string) {
    if (!content) return;
    try {
      await exportCoverLetter(content, format);
    } catch (e: any) {
      alert(e?.message || `Failed to export as ${format}`);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12 text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error && !coverLetter) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
        <div className="mt-4">
          <Link to="/coverletters/saved" className="btn btn-secondary">
            ← Back to Saved Cover Letters
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Cover Letter</h1>
          {coverLetter && (
            <p className="text-sm text-gray-600 mt-1">
              {coverLetter.company && `${coverLetter.company} • `}
              Created {new Date(coverLetter.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <Link to="/coverletters/saved" className="btn btn-secondary">
          ← Back
        </Link>
      </div>

      {saveSuccess && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700 mb-4">
          {saveSuccess}
        </div>
      )}

      {error && coverLetter && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="form-label">Title</label>
          <input
            type="text"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Cover Letter Title"
          />
        </div>

        <div>
          <label className="form-label">Content</label>
          <textarea
            className="input font-mono text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            placeholder="Cover letter content..."
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('pdf')}
              className="btn btn-secondary text-sm"
            >
              📄 Export PDF
            </button>
            <button
              onClick={() => handleExport('docx')}
              className="btn btn-secondary text-sm"
            >
              📝 Export DOCX
            </button>
            <button
              onClick={() => handleExport('txt')}
              className="btn btn-secondary text-sm"
            >
              📋 Export TXT
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !content.trim()}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
