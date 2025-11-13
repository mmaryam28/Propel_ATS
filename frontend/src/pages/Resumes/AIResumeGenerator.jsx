import React, { useState, useEffect } from "react";
const API = "http://localhost:3000/resume";

export default function AIResumeGenerator() {
  const [jobDesc, setJobDesc] = useState("");
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

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [editableJSON, setEditableJSON] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [jsonError, setJsonError] = useState(null);

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

  // Update editable JSON when result changes
  useEffect(() => {
    if (result) {
      setEditableJSON(JSON.stringify(result, null, 2));
      setIsEditing(false);
      setJsonError(null);
    }
  }, [result]);

  async function callAPI(route) {
    setLoading(true);
    const res = await fetch(`${API}/${route}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription: jobDesc, userProfile: profile }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  async function downloadPDF() {
    if (!result) return;

    setDownloadingPDF(true);
    try {
      // Use edited JSON if available, otherwise use original result
      let dataToSend = result;
      if (isEditing && editableJSON) {
        try {
          dataToSend = JSON.parse(editableJSON);
        } catch (e) {
          alert('Invalid JSON. Please fix the errors before downloading PDF.');
          setDownloadingPDF(false);
          return;
        }
      }

      const response = await fetch(`${API}/generate-ai?format=pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          jobDescription: jobDesc, 
          userProfile: profile,
          // Override with edited content if available
          ...(isEditing && dataToSend.aiContent ? { aiContentOverride: dataToSend.aiContent } : {})
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to generate PDF. Please try again.');
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
      <textarea
        placeholder="Paste job description here..."
        value={jobDesc}
        onChange={(e) => setJobDesc(e.target.value)}
        className="border rounded-lg p-3 w-full min-h-[140px]"
      />

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
          {/* Download PDF Button */}
          <div className="flex justify-end">
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
          </div>

          {/* Editable JSON Section */}
          <div className="bg-white p-4 rounded border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">
                {isEditing ? '✏️ Edit Resume JSON' : '📄 Resume Data'}
              </h3>
              <div className="flex gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Edit JSON
                  </button>
                ) : (
                  <>
                    <button
                      onClick={applyEditedJSON}
                      disabled={!!jsonError}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                    >
                      Apply Changes
                    </button>
                    <button
                      onClick={resetJSON}
                      className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {jsonError && (
              <div className="mb-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                ⚠️ JSON Error: {jsonError}
              </div>
            )}

            {isEditing ? (
              <textarea
                value={editableJSON}
                onChange={(e) => handleJSONEdit(e.target.value)}
                className="w-full h-96 font-mono text-xs p-3 border rounded focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            ) : (
              <pre className="text-xs overflow-auto max-h-96 bg-gray-50 p-3 rounded">
                {editableJSON}
              </pre>
            )}

            <p className="text-xs text-gray-500 mt-2">
              {isEditing 
                ? '💡 Tip: Edit the JSON to customize your resume content. Click "Apply Changes" to update the preview and PDF export.'
                : '💡 Click "Edit JSON" to customize sections, skills, experience, projects, etc. before downloading the PDF.'
              }
            </p>
          </div>

          {/* Tailored Resume Bullets */}
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

          {/* Skill Optimization */}
          {result.optimizedSkills && (
            <div>
              <h2 className="text-lg font-semibold text-green-700">Optimized Skills</h2>

              <p className="text-sm text-gray-600">
                Match Score: <strong>{result.matchScore}%</strong>
              </p>

              <h3 className="font-semibold mt-2">Recommended Skills to Emphasize:</h3>
              <ul className="list-disc ml-6">
                {result.optimizedSkills.emphasize.map((skill, i) => (
                  <li key={i}>{skill}</li>
                ))}
              </ul>

              <h3 className="font-semibold mt-2">Suggested Skills to Add:</h3>
              <ul className="list-disc ml-6">
                {result.optimizedSkills.add.map((skill, i) => (
                  <li key={i}>{skill}</li>
                ))}
              </ul>

              <h3 className="font-semibold mt-2">Technical Skills:</h3>
              <div className="flex flex-wrap gap-2">
                {result.optimizedSkills.technical.map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-green-200 rounded text-sm">{s}</span>
                ))}
              </div>

              <h3 className="font-semibold mt-2">Soft Skills:</h3>
              <div className="flex flex-wrap gap-2">
                {result.optimizedSkills.soft.map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-yellow-200 rounded text-sm">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
