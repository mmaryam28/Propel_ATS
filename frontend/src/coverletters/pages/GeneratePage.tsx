import { useState, useEffect } from 'react';
import { generateCoverLetter, listTemplates, saveCoverLetter, exportCoverLetter } from '../api/client';

export default function GeneratePage() {
  const [templateSlug, setTemplateSlug] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState('formal');
  const [company, setCompany] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [coverLetterTitle, setCoverLetterTitle] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/jobs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data || []);
      }
    } catch (e) {
      console.error('Failed to load jobs:', e);
    }
  }

  async function loadTemplates() {
    try {
      const t = await listTemplates('');
      setTemplates(t || []);
    } catch (e) {
      console.error(e);
    }
  }

  function onJobSelect(jobId: string) {
    setSelectedJobId(jobId);
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setJobDescription(job.description || '');
      setCompany(job.company || '');
    }
  }

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOutput('');
    setSaveSuccess('');
    try {
      const res = await generateCoverLetter({ 
        templateSlug, 
        jobDescription, 
        profileSummary: '', // Will be handled by backend based on job
        tone, 
        company 
      });
      setOutput(res.generated || '');
    } catch (e: any) {
      alert(e?.message || 'Failed to generate');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedJobId) {
      alert('Please select a job before saving');
      return;
    }
    if (!coverLetterTitle.trim()) {
      alert('Please enter a title for this cover letter');
      return;
    }

    try {
      await saveCoverLetter({
        jobId: selectedJobId,
        title: coverLetterTitle,
        content: output,
        templateSlug,
        tone,
        company,
        jobDescription,
        profileSummary: '',
      });
      setSaveSuccess('Cover letter saved successfully!');
      setShowSaveModal(false);
      setCoverLetterTitle('');
    } catch (e: any) {
      alert(e?.message || 'Failed to save cover letter');
    }
  }

  async function handleExport(format: string) {
    if (!output) return;
    try {
      await exportCoverLetter(output, format);
    } catch (e: any) {
      alert(e?.message || `Failed to export as ${format}`);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Generate Cover Letter</h1>
        <button className="btn btn-secondary" onClick={loadTemplates}>Load Templates</button>
      </div>

      <form onSubmit={onGenerate} className="space-y-4">
        {/* Job Selection Dropdown */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="form-label">Select Job from Your Job Board *</label>
          <select 
            className="input" 
            value={selectedJobId} 
            onChange={(e) => onJobSelect(e.target.value)}
            required
          >
            <option value="">-- Select a Job --</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} at {job.company}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-600 mt-2">
            Selecting a job will auto-fill the company and job description fields
          </p>
        </div>

        <div>
          <label className="form-label">Template</label>
          <select className="input" value={templateSlug} onChange={(e) => setTemplateSlug(e.target.value)}>
            <option value="">Select a template...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.slug}>{t.title || t.slug}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="form-label">Company</label>
          <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="ACME Corp" />
        </div>
        
        <div>
          <label className="form-label">Tone</label>
          <select className="input" value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="formal">Formal</option>
            <option value="friendly">Friendly</option>
            <option value="concise">Concise</option>
          </select>
        </div>
        
        <div>
          <label className="form-label">Job Description</label>
          <textarea className="input" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={6} />
        </div>
        
        <div className="flex gap-3">
          <button className="btn btn-primary" type="submit" disabled={loading || !templateSlug || !jobDescription || !selectedJobId}>
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </form>

      {saveSuccess && (
        <div className="mt-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {saveSuccess}
        </div>
      )}

      {output && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Generated Cover Letter</h2>
            <div className="flex gap-2">
              <button
                className="btn btn-secondary text-sm"
                onClick={() => setShowSaveModal(true)}
              >
                💾 Save
              </button>
              <button
                className="btn btn-secondary text-sm"
                onClick={() => handleExport('pdf')}
              >
                📄 PDF
              </button>
              <button
                className="btn btn-secondary text-sm"
                onClick={() => handleExport('docx')}
              >
                📝 DOCX
              </button>
              <button
                className="btn btn-secondary text-sm"
                onClick={() => handleExport('txt')}
              >
                📋 TXT
              </button>
            </div>
          </div>
          
          <textarea 
            className="w-full whitespace-pre-wrap bg-white rounded-md border p-4 font-mono text-sm min-h-[400px]"
            value={output}
            onChange={(e) => setOutput(e.target.value)}
          />
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Cover Letter</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="input"
                  value={coverLetterTitle}
                  onChange={(e) => setCoverLetterTitle(e.target.value)}
                  placeholder="e.g., Software Engineer - Google"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowSaveModal(false);
                    setCoverLetterTitle('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={!coverLetterTitle.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
