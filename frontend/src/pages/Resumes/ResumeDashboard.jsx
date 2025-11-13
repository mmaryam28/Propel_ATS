import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

export default function ResumeDashboard() {
  const [resumes, setResumes] = useState([]);
  const fileInputRef = useRef(null);

  // Fetch resumes
  useEffect(() => {
    fetch("http://localhost:3000/resume?userId=1")
      .then(res => res.json())
      .then(data => {
        setResumes(Array.isArray(data) ? data : data.resumes || []);
      })
      .catch(err => {
        console.error("Failed to fetch resumes:", err);
        setResumes([]);
      });
  }, []);

  // Handle file upload
  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("resumeFile", file);
    formData.append("userId", "1"); // Replace with actual auth user ID

    try {
      const uploadRes = await fetch("http://localhost:3000/resume/upload", {
        method: "POST",
        body: formData
      });

      const data = await uploadRes.json();
      console.log("Uploaded:", data);

      // Refresh dashboard
      setResumes(prev => [...prev, data]);

    } catch (err) {
      console.error("Upload failed:", err);
    }
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-[#1e88e5]">My Resumes</h1>

        <div className="flex gap-3">
          {/* Upload Existing Resume */}
          <button
            className="border border-[#1e88e5] text-[#1e88e5] px-3 py-1 rounded-lg hover:bg-blue-50 transition"
            onClick={() => fileInputRef.current.click()}
          >
            Upload Resume
          </button>

          {/* Hidden file input */}
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* AI Resume Button */}
          <Link
            to="/resumes/ai"
            className="px-3 py-1 rounded-lg text-[#1e88e5] border border-[#1e88e5] hover:bg-blue-50 transition"
          >
            + New AI Resume
          </Link>
        </div>
      </div>

      {/* Resumes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resumes.length > 0 ? (
          resumes.map(r => (
            <div
              key={r.id}
              className="border rounded-xl p-4 hover:shadow-md transition"
            >
              <h2 className="font-bold text-lg text-[#1e88e5]">{r.title || "Imported Resume"}</h2>

              <p className="text-sm text-gray-500 mb-2">
                Updated {new Date(r.updatedAt).toLocaleDateString()}
              </p>

              <div className="flex gap-2">
                <Link
                  to={`/resumes/preview/${r.id}`}
                  className="px-3 py-1 text-white bg-[#1e88e5] rounded hover:bg-blue-600 transition"
                >
                  Preview
                </Link>

                <Link
                  to={`/resumes/ai?id=${r.id}`}
                  className="px-3 py-1 border border-[#1e88e5] text-[#1e88e5] rounded hover:bg-blue-50 transition"
                >
                  Edit
                </Link>
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
