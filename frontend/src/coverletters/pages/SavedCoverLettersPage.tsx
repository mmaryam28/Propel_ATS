import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listSavedCoverLetters, deleteCoverLetter, exportCoverLetter } from '../api/client';
import type { SavedCoverLetter } from '../api/client';

export default function SavedCoverLettersPage() {
  const [coverLetters, setCoverLetters] = useState<SavedCoverLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<SavedCoverLetter | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    loadCoverLetters();
  }, []);

  async function loadCoverLetters() {
    setLoading(true);
    setError('');
    try {
      const data = await listSavedCoverLetters();
      setCoverLetters(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load cover letters');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this cover letter?')) return;
    
    try {
      await deleteCoverLetter(id);
      setCoverLetters(prev => prev.filter(cl => cl.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Failed to delete cover letter');
    }
  }

  function handlePreview(letter: SavedCoverLetter) {
    setSelectedLetter(letter);
    setShowPreviewModal(true);
  }

  async function handleExport(format: string) {
    if (!selectedLetter) return;
    try {
      await exportCoverLetter(selectedLetter.content, format);
    } catch (e: any) {
      alert(e?.message || `Failed to export as ${format}`);
    }
  }

  // Group cover letters by job
  const groupedByJob = coverLetters.reduce((acc, cl) => {
    if (!acc[cl.jobId]) {
      acc[cl.jobId] = [];
    }
    acc[cl.jobId].push(cl);
    return acc;
  }, {} as Record<string, SavedCoverLetter[]>);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Saved Cover Letters</h1>
          <p className="text-sm text-gray-600 mt-1">View and manage your generated cover letters</p>
        </div>
        <Link to="/coverletters/generate" className="btn btn-primary">
          + Generate New
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      ) : coverLetters.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You haven't saved any cover letters yet</p>
          <Link to="/coverletters/generate" className="btn btn-primary">
            Generate Your First Cover Letter
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByJob).map(([jobId, letters]) => (
            <div key={jobId} className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold text-lg mb-3">
                Job ID: {jobId}
              </h3>
              <div className="space-y-2">
                {letters.map((letter) => (
                  <div
                    key={letter.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{letter.title}</h4>
                      <div className="flex gap-3 text-xs text-gray-500 mt-1">
                        {letter.company && <span>Company: {letter.company}</span>}
                        {letter.tone && <span>Tone: {letter.tone}</span>}
                        <span>Created: {new Date(letter.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePreview(letter)}
                        className="btn btn-secondary text-sm py-1 px-3"
                      >
                        👁️ View
                      </button>
                      <Link
                        to={`/coverletters/edit/${letter.id}`}
                        className="btn btn-secondary text-sm py-1 px-3"
                      >
                        ✏️ Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(letter.id)}
                        className="btn btn-secondary text-sm py-1 px-3 text-red-600 hover:bg-red-50"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedLetter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{selectedLetter.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedLetter.company && `${selectedLetter.company} • `}
                    Created {new Date(selectedLetter.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {selectedLetter.content}
              </pre>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-2 justify-end">
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
              <Link
                to={`/coverletters/edit/${selectedLetter.id}`}
                className="btn btn-primary text-sm"
              >
                ✏️ Edit
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
