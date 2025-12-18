import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ResumeTemplatePreview from "./ResumeTemplatePreview";

const BACKEND = import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com';
const API = `${BACKEND}/resume`;

function getToken() {
  return window.localStorage.getItem('token');
}

export default function AIResumeGenerator() {
  const [jobDesc, setJobDesc] = useState("");
  const [templateType, setTemplateType] = useState("chronological");
    const [profile, setProfile] = useState({
      userId: null, // Will be set from localStorage
      email: "user@example.com",
      phone: "(555) 123-4567",
      location: "Newark, NJ",
      skills: ["JavaScript", "React", "Node.js", "SQL"],
      experience: [
        {
          role: "Software Developer Intern",
          bullets: [
            "Developed responsive UI components using React",
            "Improved API response time by 20% through caching"
          ]
        }
      ]
    });
    const [resumeTitle, setResumeTitle] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [savingResume, setSavingResume] = useState(false);
    // Save AI-generated resume to backend
    async function saveResume() {
      if (!result || !profile.userId) {
        alert('No resume to save or missing user ID.');
        return;
      }
      if (!resumeTitle.trim()) {
        alert('Please enter a title for your resume.');
        return;
      }
      setSavingResume(true);
      try {
        // Prepare payload for backend
        const payload = {
          userId: profile.userId,
          title: resumeTitle,
          aiContent: result.aiContent || result,
          experience: result.experience ?? {},
          skills: result.skills ?? {},
          sections: result.sections ?? {},
        };
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error('Failed to save resume');
        }
        alert('✅ Resume saved successfully!');
      } catch (error) {
        console.error('Error saving resume:', error);
        alert('Failed to save resume. Please try again.');
      } finally {
        setSavingResume(false);
      }
    }
  const [editableJSON, setEditableJSON] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [jsonError, setJsonError] = useState(null);
  // Human-friendly editable data (derived from result.aiContent or result)
  const [editableData, setEditableData] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);


  // Get userId from localStorage on component mount
  useEffect(() => {
    const userId = window.localStorage.getItem('userId');
    if (userId) {
      console.log('📌 Setting userId from localStorage:', userId);
      setProfile(prev => ({ ...prev, userId }));
    } else {
      console.warn('⚠️  No userId found in localStorage');
    }
  }, []);

  useEffect(() => {
    async function loadJobs() {
      if (!profile.userId) return;

      try {
        const token = getToken();
        const res = await fetch(`${BACKEND}/jobs?userId=${profile.userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) {
          console.error('Failed to fetch jobs', res.status, await res.text());
          setSavedJobs([]);
          return;
        }

        const data = await res.json();

        // Ensure we always store an array (backend may return an object or null on error)
        const jobs = Array.isArray(data) ? data : [];
        setSavedJobs(jobs);
        if (jobs.length > 0) setSelectedJobId(jobs[0].id);
      } catch (err) {
        console.error("Failed to load jobs:", err);
        setSavedJobs([]);
      }
      // Also fetch education and employment to enrich the profile used by AI
      try {
        const [eduRes, empRes] = await Promise.all([
          fetch(`${BACKEND}/education/user/${profile.userId}`),
          fetch(`${BACKEND}/employment/${profile.userId}`),
        ]);

        const eduData = eduRes && eduRes.ok ? await eduRes.json() : [];
        const empData = empRes && empRes.ok ? await empRes.json() : [];

        setProfile((p) => ({
          ...p,
          education: Array.isArray(eduData) ? eduData : [],
          experience: Array.isArray(empData) ? empData : (p.experience || []),
        }));
      } catch (err) {
        console.warn('Failed to load education or employment for profile:', err);
      }
    }

    loadJobs();
  }, [profile.userId]);


  // Update editable JSON when result changes
  useEffect(() => {
    // Only initialize editable view when not actively editing
    if (result && !isEditing) {
      setEditableJSON(JSON.stringify(result, null, 2));
      setIsEditing(false);
      setJsonError(null);
      // Initialize friendly editable view
      const source = result.aiContent && typeof result.aiContent === 'object' ? result.aiContent : result;
      // Normalize editableData shape
      setEditableData({
        summary: source.sections?.summary || source.summary || '',
        skills: Array.isArray(source.skills) ? source.skills : (typeof source.skills === 'object' ? Object.values(source.skills).flat() : (source.sections?.skills ?? [])),
        experience: Array.isArray(source.experience) ? source.experience : (source.sections?.experience ?? []),
      });
    }
  }, [result]);

  // Sync helper: merge editableData into result.aiContent.sections
  function syncEditableToResult(nextEditable) {
    if (!result) return;
    const next = {
      ...result,
      aiContent: {
        ...(result.aiContent || {}),
        sections: {
          ...(result.aiContent?.sections || {}),
          summary: nextEditable.summary,
          skills: Array.isArray(nextEditable.skills) ? nextEditable.skills : [],
          experience: Array.isArray(nextEditable.experience) ? nextEditable.experience : [],
        },
      },
    };
    setResult(next);
  }

  async function callAPI(route) {
    setLoading(true);

    // Get the job selected by the user
    const selectedJob = savedJobs.find(job => String(job.id) === String(selectedJobId));

    const payload = {
      jobDescription: selectedJob?.description || "",
      jobTitle: selectedJob?.title || "",
      company: selectedJob?.company || "",
      userProfile: profile
    };

    const token = getToken();
    const res = await fetch(`${API}/${route}`, {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, token ? { Authorization: `Bearer ${token}` } : {}),
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  }


  async function downloadPDF() {
    if (!result) return;

    setDownloadingPDF(true);

    try {
      // Get the current resume data (either edited or original)
      let resumeData = result.aiContent || result;

      // Select the job from the saved job list
      const selectedJob = savedJobs.find(job => job.id === selectedJobId);
      const token = getToken();

      console.log('📄 Sending to PDF generation:', {
        hasAiContent: !!result.aiContent,
        resumeDataKeys: Object.keys(resumeData),
        templateType,
      });

      const response = await fetch(`${API}/generate-ai?format=pdf`, {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, token ? { Authorization: `Bearer ${token}` } : {}),
        body: JSON.stringify({
          jobDescription: selectedJob?.description || "",
          jobTitle: selectedJob?.title || "",
          company: selectedJob?.company || "",
          userProfile: profile,
          templateType: templateType,
          // Always send the complete resume data so PDF has all fields
          aiContent: resumeData,
          // Send the full result object as backup
          resumeData: result,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF generation error:', errorText);
        throw new Error(`Failed to generate PDF: ${response.status}`);
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-${resumeTitle || 'export'}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF downloaded successfully');

    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert(`Failed to generate PDF: ${error.message}`);
    } finally {
      setDownloadingPDF(false);
    }
  }


  function handleJSONEdit(value) {
    setEditableJSON(value);
    // Validate JSON in real-time
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (e) {
      setJsonError(e.message);
    }
  }

  function applyEditedJSON() {
    try {
      const parsed = JSON.parse(editableJSON);
      setResult(parsed);
      setIsEditing(false);
      setJsonError(null);
      alert('✅ Changes applied successfully!');
    } catch (e) {
      alert(`Invalid JSON: ${e.message}`);
    }
  }

  function resetJSON() {
    if (result) {
      setEditableJSON(JSON.stringify(result, null, 2));
      setJsonError(null);
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* HEADER */}
      <h1 className="text-2xl font-bold text-blue-600" style={{ color: "#1e88e5" }}>AI Resume Generator</h1>
      <p className="text-gray-600">Paste a job description and pick what you want AI to generate.</p>

      {/* JOB DESCRIPTION BOX */}
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select a Job From Your Job Board
      </label>

      <select
        className="border p-2 rounded w-full"
        value={selectedJobId ? String(selectedJobId) : ""}
        onChange={(e) => setSelectedJobId(e.target.value)}
      >
        {Array.isArray(savedJobs) && savedJobs.map(job => (
          <option key={job.id} value={String(job.id)}>
            {job.title} @ {job.company}
          </option>
        ))}
      </select>

      {savedJobs.length === 0 && (
        <p className="text-gray-500 text-sm mt-1">
          No saved jobs found — add jobs to your board to generate a targeted resume.
        </p>
      )}

      {/* TEMPLATE SELECTOR */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Choose Resume Template Style
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setTemplateType("chronological")}
            className={`px-4 py-2 rounded font-medium transition-all ${
              templateType === "chronological"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:border-blue-400"
            }`}
          >
            📅 Chronological
          </button>
          <button
            onClick={() => setTemplateType("functional")}
            className={`px-4 py-2 rounded font-medium transition-all ${
              templateType === "functional"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:border-blue-400"
            }`}
          >
            ⚙️ Functional
          </button>
          <button
            onClick={() => setTemplateType("hybrid")}
            className={`px-4 py-2 rounded font-medium transition-all ${
              templateType === "hybrid"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:border-blue-400"
            }`}
          >
            🔀 Hybrid
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {templateType === "chronological" && "Shows work history in reverse chronological order with dates and achievements."}
          {templateType === "functional" && "Focuses on skills and competencies organized by category."}
          {templateType === "hybrid" && "Combines skills emphasis with chronological work history."}
        </p>
      </div>

      {/* BUTTON GROUP */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => callAPI("generate-ai")}
          className="px-4 py-2 bg-blue-600 text-white rounded "
          disabled={loading}
          
        >
          Generate Resume Content
        </button>

        <button
          onClick={() => callAPI("optimize-skills")}
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded"
          disabled={loading}
        >
          Optimize Skills
        </button>

        <button
          onClick={() => callAPI("tailor-experience")}
          className="px-4 py-2 bg-gray-200 rounded"
          disabled={loading}
        >
          Tailor Experience
        </button>
      </div>

      {/* Loading */}
      {loading && <p className="text-gray-500">AI is thinking...</p>}

      {/* RESULT DISPLAY */}
      {result && (
        <div className="p-4 bg-gray-100 rounded-lg space-y-4">
          {/* Custom Title Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Resume Title</label>
            <input
              type="text"
              value={resumeTitle}
              onChange={e => setResumeTitle(e.target.value)}
              className="border rounded-lg p-2 w-full"
              placeholder="Enter a custom title for your resume"
              maxLength={100}
            />
          </div>
          {/* Download PDF & Save Resume Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={downloadPDF}
              disabled={downloadingPDF}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {downloadingPDF ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download as PDF
                </>
              )}
            </button>
            <button
              onClick={saveResume}
              disabled={savingResume}
              className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {savingResume ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Resume
                </>
              )}
            </button>
          </div>

          {/* Editable JSON Section */}
          <div className="bg-white p-4 rounded border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-blue-500">Resume Data (editable)</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Stop editing (edits already live-synced)
                    setIsEditing(false);
                    alert('✅ Live edits applied to preview');
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Apply Changes
                </button>

                <button
                  onClick={() => {
                    // Reset editableData from current result and stop editing
                    const source = result.aiContent && typeof result.aiContent === 'object' ? result.aiContent : result;
                    const resetData = {
                      summary: source.sections?.summary || source.summary || '',
                      skills: Array.isArray(source.skills) ? source.skills : (source.sections?.skills ?? []),
                      experience: Array.isArray(source.experience) ? source.experience : (source.sections?.experience ?? []),
                    };
                    setEditableData(resetData);
                    syncEditableToResult(resetData);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm"
                >
                  Reset
                </button>
              </div>
            </div>

            {!editableData ? (
              <div className="text-sm text-gray-500">No editable data available.</div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Summary</label>
                  <textarea
                    value={editableData.summary || ''}
                    onChange={(e) => {
                      setIsEditing(true);
                      setEditableData(d => {
                        const next = { ...d, summary: e.target.value };
                        syncEditableToResult(next);
                        return next;
                      });
                    }}
                    className="w-full p-2 border rounded h-24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
                  <input
                    value={Array.isArray(editableData.skills) ? editableData.skills.join(', ') : ''}
                    onChange={(e) => {
                      setIsEditing(true);
                      const nextSkills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      setEditableData(d => {
                        const next = { ...d, skills: nextSkills };
                        syncEditableToResult(next);
                        return next;
                      });
                    }}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Experience (one item per line, optional: JSON object per line)</label>
                  <textarea
                    value={Array.isArray(editableData.experience) ? editableData.experience.map(it => (typeof it === 'string' ? it : (it.title || JSON.stringify(it)))).join('\n') : ''}
                    onChange={(e) => {
                      setIsEditing(true);
                      const lines = e.target.value.split('\n').map(l => l.trim()).filter(Boolean);
                      // Try to keep simple strings; if line is JSON parse it
                      const parsed = lines.map(l => {
                        try { return JSON.parse(l); } catch { return l; }
                      });
                      setEditableData(d => {
                        const next = { ...d, experience: parsed };
                        syncEditableToResult(next);
                        return next;
                      });
                    }}
                    className="w-full p-2 border rounded h-36 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tip: each line becomes one experience item. Use JSON object per line for structured entries.</p>
                </div>
              </div>
            )}
          </div>

          {/* Tailored Resume Bullets */}
          {result.aiContent && (
            <ResumeTemplatePreview
              data={result.aiContent}
              templateType={templateType}
            />
          )}

          {result.experience && (
            <div>
              <h2 className="text-lg font-semibold text-blue-700">Tailored Experience Bullets</h2>
              <ul className="list-disc ml-6 space-y-1">
                {result.experience.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Skill Optimization - UC-049 Compliant */}
          {result.optimization && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-green-700">🎯 Skills Optimization Analysis</h2>
                {result.optimization.matchScore && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Match Score</p>
                    <p className="text-4xl font-bold text-green-600">{result.optimization.matchScore}%</p>
                  </div>
                )}
              </div>

              {/* Summary */}
              {result.optimization.summary && (
                <div className="bg-white p-3 rounded border-l-4 border-green-500">
                  <p className="text-gray-700">{result.optimization.summary}</p>
                </div>
              )}

              {/* Matched Skills */}
              {result.optimization.matched && (
                <div className="bg-white p-4 rounded border-l-4 border-blue-500">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-blue-700">✅ Matched Skills ({result.optimization.matched.count})</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Direct match with job</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{result.optimization.matched.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {result.optimization.matched.skills?.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Transferable Skills */}
              {result.optimization.transferable && result.optimization.transferable.skills?.length > 0 && (
                <div className="bg-white p-4 rounded border-l-4 border-purple-500">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-purple-700">🔄 Transferable Skills ({result.optimization.transferable.count})</h3>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Applicable to role</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{result.optimization.transferable.description}</p>
                  <p className="text-xs italic text-gray-700 mb-2">{result.optimization.transferable.relevance}</p>
                  <div className="flex flex-wrap gap-2">
                    {result.optimization.transferable.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills to Prioritize */}
              {result.optimization.prioritize && result.optimization.prioritize.skills?.length > 0 && (
                <div className="bg-white p-4 rounded border-l-4 border-amber-500">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-amber-700">📌 Skills to Emphasize</h3>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Highlight on resume</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{result.optimization.prioritize.description}</p>
                  <p className="text-xs font-semibold text-amber-700 mb-2">Why: {result.optimization.prioritize.reason}</p>
                  <div className="flex flex-wrap gap-2">
                    {result.optimization.prioritize.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-sm font-bold">
                        ⭐ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Skills to Add */}
              {result.optimization.recommended && result.optimization.recommended.skills?.length > 0 && (
                <div className="bg-white p-4 rounded border-l-4 border-red-500">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-red-700">📚 Recommended Skills to Develop</h3>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">High-impact additions</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{result.optimization.recommended.description}</p>
                  <div className="space-y-2">
                    {result.optimization.recommended.skills.map((item, i) => (
                      <div key={i} className="bg-red-50 p-2 rounded border border-red-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-red-900">{item.skill}</span>
                          <span className={`text-xs px-2 py-1 rounded font-bold ${
                            item.importance === 'critical' ? 'bg-red-600 text-white' :
                            item.importance === 'high' ? 'bg-orange-500 text-white' :
                            'bg-yellow-400 text-gray-900'
                          }`}>
                            {item.importance?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 mb-1">{item.reason}</p>
                        {item.timeToLearn && (
                          <p className="text-xs text-gray-600">⏱️ Time to learn: {item.timeToLearn}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill Gaps */}
              {result.optimization.skillGaps && (
                <div className="bg-white p-4 rounded border-l-4 border-orange-500">
                  <h3 className="font-bold text-orange-700 mb-2">⚠️ Skill Gaps</h3>
                  {result.optimization.skillGaps.critical?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-red-700 mb-1">Critical Gaps:</p>
                      <div className="flex flex-wrap gap-2">
                        {result.optimization.skillGaps.critical.map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-red-200 text-red-900 rounded text-xs font-bold">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.optimization.skillGaps.desirable?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-amber-700 mb-1">Desirable Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {result.optimization.skillGaps.desirable.map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-amber-200 text-amber-900 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Categorized Skills */}
              {result.optimization.categorized && (
                <div className="bg-white p-4 rounded border-l-4 border-indigo-500">
                  <h3 className="font-bold text-indigo-700 mb-3">📊 Skills by Category</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.optimization.categorized.technical?.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-700 text-sm mb-2">Technical Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {result.optimization.categorized.technical.map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.optimization.categorized.languages?.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-700 text-sm mb-2">Languages</p>
                        <div className="flex flex-wrap gap-1">
                          {result.optimization.categorized.languages.map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.optimization.categorized.frameworks?.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-700 text-sm mb-2">Frameworks</p>
                        <div className="flex flex-wrap gap-1">
                          {result.optimization.categorized.frameworks.map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.optimization.categorized.tools?.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-700 text-sm mb-2">Tools</p>
                        <div className="flex flex-wrap gap-1">
                          {result.optimization.categorized.tools.map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.optimization.categorized.soft?.length > 0 && (
                      <div className="md:col-span-2">
                        <p className="font-semibold text-gray-700 text-sm mb-2">Soft Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {result.optimization.categorized.soft.map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-yellow-100 text-yellow-900 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Industry-Specific Recommendations */}
              {result.optimization.industrySpecific && (
                <div className="bg-white p-4 rounded border-l-4 border-teal-500">
                  <h3 className="font-bold text-teal-700 mb-2">🏢 Industry-Specific Insights</h3>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Industry: <span className="text-teal-700">{result.optimization.industrySpecific.industry}</span>
                  </p>
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Top Skills for This Industry:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.optimization.industrySpecific.topSkills?.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  {result.optimization.industrySpecific.recommendations && (
                    <p className="text-sm text-gray-700 italic">{result.optimization.industrySpecific.recommendations}</p>
                  )}
                </div>
              )}

              {/* Reordered Skills */}
              {result.optimization.reorderedSkills && result.optimization.reorderedSkills.length > 0 && (
                <div className="bg-white p-4 rounded border-l-4 border-pink-500">
                  <h3 className="font-bold text-pink-700 mb-2">🔀 Recommended Skill Order (by Job Relevance)</h3>
                  {result.optimization.reorderReason && (
                    <p className="text-sm text-gray-700 mb-3">{result.optimization.reorderReason}</p>
                  )}
                  <ol className="space-y-2">
                    {result.optimization.reorderedSkills.map((skill, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {i + 1}
                        </span>
                        <span className="text-gray-700 font-medium">{skill}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    if (result.optimization.categorized?.technical) {
                      setEditableData(prev => ({
                        ...prev,
                        skills: result.optimization.reorderedSkills || result.optimization.categorized.technical || []
                      }));
                      syncEditableToResult({
                        ...editableData,
                        skills: result.optimization.reorderedSkills || result.optimization.categorized.technical || []
                      });
                      alert('✅ Optimized skills applied to your resume!');
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  Apply Optimized Skills
                </button>
                <button
                  onClick={() => setResult(prev => ({ ...prev, optimization: null }))}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
