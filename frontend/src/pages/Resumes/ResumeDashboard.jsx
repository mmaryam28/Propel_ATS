import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function ResumeDashboard() {
  const [resumes, setResumes] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/resume?userId=1")
      .then(res => res.json())
      .then(data => {
        console.log("Fetched resumes:", data);
        // Handle both array or object-wrapped responses
        setResumes(Array.isArray(data) ? data : data.resumes || []);
      })
      .catch(err => {
        console.error("Failed to fetch resumes:", err);
        setResumes([]);
      });
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold" style={{ color: "#1e88e5" }}>My Resumes</h1>
        <Link to="/resumes/ai" className="btn" style={{ color: "#1e88e5" }}>+ New AI Resume</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resumes.length > 0 ? (
          resumes.map(r => (
            <div key={r.id} className="border rounded-xl p-4 hover:shadow-md transition">
              <h2 className="font-bold text-lg">{r.title}</h2>
              <p className="text-sm text-gray-500 mb-2">
                Updated {new Date(r.updatedAt).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                <Link to={`/resumes/preview/${r.id}`} className="btn btn-sm">Preview</Link>
                <Link to={`/resumes/ai?id=${r.id}`} className="btn btn-outline btn-sm">Edit</Link>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No resumes found.</p>
        )}
      </div>
    </div>
  );
}
