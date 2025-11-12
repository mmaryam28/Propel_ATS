import React, { useState } from "react";
const API = "http://localhost:3000/resume";

export default function AIResumeGenerator() {
  const [jobDesc, setJobDesc] = useState("");
  const [profile, setProfile] = useState({ skills: [], experience: [] });
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
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold" style={{ color: "#1e88e5" }}>AI Resume Tools</h1>
      <textarea placeholder="Paste job description..." value={jobDesc} onChange={e => setJobDesc(e.target.value)} className="border rounded p-2 w-full" />
      <div className="flex gap-2">
        <button onClick={() => callAPI("generate-ai")} disabled={loading}>Generate Resume</button>
        <button onClick={() => callAPI("optimize-skills")} variant="outline" disabled={loading}>Optimize Skills</button>
        <button onClick={() => callAPI("tailor-experience")} variant="secondary" disabled={loading}>Tailor Experience</button>
      </div>
      {loading && <p> AI is thinking...</p>}
      {result && <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
