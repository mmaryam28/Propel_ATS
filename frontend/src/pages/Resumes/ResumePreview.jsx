import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ResumePreview() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch resume by ID
  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:3000/resume/${id}`)
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

  // Validate Resume w/ AI
  async function validate() {
    const res = await fetch("http://localhost:3000/resume/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userProfile: resume }),
    });

    const data = await res.json();
    setValidation(data.validation || data);
  }

  if (loading) return <p className="p-6">Loading resume...</p>;

  if (!resume)
    return <p className="p-6 text-red-500">Resume not found.</p>;

  const extractedText = resume?.aiContent?.extractedText || "";
  const experience = resume?.experience || {};
  const skills = resume?.skills || {};
  const sections = resume?.sections || {};

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

      {/* EXTRACTED TEXT */}
      <div>
        <h2 className="text-lg font-semibold mt-4 text-[#1e88e5]">Extracted Text</h2>
        <div className="border rounded-lg bg-gray-50 p-4 whitespace-pre-wrap">
          {extractedText.length > 0 ? extractedText : "No text extracted."}
        </div>
      </div>

      {/* EXPERIENCE */}
      {experience && Object.keys(experience).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mt-4">Experience</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(experience, null, 2)}
          </pre>
        </div>
      )}

      {/* SKILLS */}
      {skills && Object.keys(skills).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mt-4">Skills</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(skills, null, 2)}
          </pre>
        </div>
      )}

      {/* SECTIONS */}
      {sections && Object.keys(sections).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mt-4">Sections</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(sections, null, 2)}
          </pre>
        </div>
      )}

      {/* VALIDATION BUTTON */}
      <button
        onClick={validate}
        className="px-4 py-2 bg-[#1e88e5] text-white rounded hover:bg-blue-600"
      >
        Validate Resume
      </button>

      {/* VALIDATION OUTPUT */}
      {validation && (
        <div className="bg-gray-100 p-4 rounded-lg mt-4">
          <h3 className="text-lg font-semibold">Validation Results</h3>
          <pre className="text-sm">
            {JSON.stringify(validation, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
