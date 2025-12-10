import React, { useState } from 'react';
import { getApplicationQualityScore } from '../../lib/applicationQualityApi';

export default function ApplicationQualityScoring() {
  const [resume, setResume] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [userId, setUserId] = useState('');
  const [jobId, setJobId] = useState('');
  const [score, setScore] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await getApplicationQualityScore({ resume, coverLetter, linkedIn, jobDescription, userId, jobId });
      setScore(result.score);
      setSuggestions(result.suggestions || []);
    } catch (err) {
      setError('Failed to fetch score.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Application Package Quality Scoring</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="User ID" value={userId} onChange={e => setUserId(e.target.value)} className="w-full p-2 border rounded" />
        <input type="text" placeholder="Job ID" value={jobId} onChange={e => setJobId(e.target.value)} className="w-full p-2 border rounded" />
        <textarea placeholder="Resume" value={resume} onChange={e => setResume(e.target.value)} className="w-full p-2 border rounded" rows={3} />
        <textarea placeholder="Cover Letter" value={coverLetter} onChange={e => setCoverLetter(e.target.value)} className="w-full p-2 border rounded" rows={3} />
        <textarea placeholder="LinkedIn Profile" value={linkedIn} onChange={e => setLinkedIn(e.target.value)} className="w-full p-2 border rounded" rows={2} />
        <textarea placeholder="Job Description" value={jobDescription} onChange={e => setJobDescription(e.target.value)} className="w-full p-2 border rounded" rows={3} />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Scoring...' : 'Get Score'}</button>
      </form>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {score !== null && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold">Score: {score}</h3>
          {suggestions.length > 0 && (
            <div className="mt-2">
              <h4 className="font-semibold">Suggestions:</h4>
              <ul className="list-disc ml-6">
                {suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
