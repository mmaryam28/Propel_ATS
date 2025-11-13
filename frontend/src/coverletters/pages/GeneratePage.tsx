import { useState } from 'react';
import { generateCoverLetter, listTemplates } from '../api/client';

export default function GeneratePage() {
  const [templateSlug, setTemplateSlug] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [profileSummary, setProfileSummary] = useState('');
  const [tone, setTone] = useState('formal');
  const [company, setCompany] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  async function loadTemplates() {
    try {
      const t = await listTemplates('');
      setTemplates(t || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOutput('');
    try {
      const res = await generateCoverLetter({ templateSlug, jobDescription, profileSummary, tone, company });
      setOutput(res.generated || '');
    } catch (e: any) {
      alert(e?.message || 'Failed to generate');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Generate Cover Letter</h1>
        <button className="btn btn-secondary" onClick={loadTemplates}>Load Templates</button>
      </div>

      <form onSubmit={onGenerate} className="space-y-4">
        <div>
          <label className="form-label">Template</label>
          <select className="input" value={templateSlug} onChange={(e) => setTemplateSlug(e.target.value)}>
            <option value="">Select a template...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.slug}>{t.name || t.slug}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Company (optional)</label>
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
        <div>
          <label className="form-label">Profile Summary</label>
          <textarea className="input" value={profileSummary} onChange={(e) => setProfileSummary(e.target.value)} rows={4} />
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary" type="submit" disabled={loading || !templateSlug || !jobDescription || !profileSummary}>
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </form>

      {output && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Result</h2>
          <pre className="whitespace-pre-wrap bg-white rounded-md border p-4">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
