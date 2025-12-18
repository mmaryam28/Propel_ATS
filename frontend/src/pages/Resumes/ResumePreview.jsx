import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ResumeTemplatePreview from './ResumeTemplatePreview';

export default function ResumePreview() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch resume by ID
  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com';
    fetch(`${base}/resume/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setResume(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load resume:", err);
        setLoading(false);
      });
  }, [id]);


  if (loading) return <p className="p-6">Loading resume...</p>;

  if (!resume)
    return <p className="p-6 text-red-500">Resume not found.</p>;

  return (
    <div className="p-6 space-y-5">
      {/* HEADER */}
      <h1 className="text-2xl font-semibold text-[#1e88e5]">
        Resume Preview
      </h1>

      {/* TITLE */}
      <p className="text-lg font-medium ">
        {resume.title || "Untitled Resume"}
      </p>

      {/* PROFESSIONAL RESUME PREVIEW */}
      <div className="border rounded-lg p-6 bg-white overflow-auto max-h-[900px]">
        <ResumeTemplatePreview
          data={resume.aiContent || resume}
          templateType="chronological"
        />
      </div>
    </div>
  );
}
