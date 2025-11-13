import React, { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ResumeTemplatePreview from "./ResumeTemplatePreview";
const API = "http://localhost:3000/resume";

export default function AIResumeGenerator() {
  const [jobDesc, setJobDesc] = useState("");
  const [profile, setProfile] = useState({
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

          {/* Raw JSON (fallback) */}
          <details className="bg-white p-4 rounded border">
            <summary className="cursor-pointer font-medium">Raw JSON Result</summary>
            <pre className="text-xs mt-2 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
