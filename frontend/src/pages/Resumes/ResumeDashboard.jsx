// ResumeDashboard.jsx  (merged dashboard)
// Michelle Zambrano – All resume features combined

import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

// Imported sub-tools
import TemplateManager from "./TemplateManager";
import ResumeTemplatePreview from "./ResumeTemplatePreview";
import VersionManager from "./VersionManager";
import FeedbackPanel from "./FeedbackPanel";

export default function ResumeDashboard() {
  const [resumes, setResumes] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const fileInputRef = useRef(null);

  // Fetch resumes
  useEffect(() => {
    const userId = localStorage.getItem('userId') || '1';
    const token = localStorage.getItem('token');
    
    fetch(`/resume?userId=${userId}`, {
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : {}
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch resumes');
        return res.json();
      })
      .then((data) => {
        setResumes(Array.isArray(data) ? data : data.resumes || []);
      })
      .catch((err) => {
        console.error("Failed to fetch resumes:", err);
        setResumes([]);
      });
  }, []);

  // Upload resume
  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, DOCX, or TXT file');
      return;
    }

    const userId = localStorage.getItem('userId') || '1';
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append("resumeFile", file);
    formData.append("userId", userId);

    try {
      const uploadRes = await fetch("/resume/upload", {
        method: "POST",
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {},
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.statusText}`);
      }

      const data = await uploadRes.json();
      console.log("Uploaded:", data);

      // Add to resumes list
      setResumes((prev) => [...prev, data]);
      
      // Show success message
      alert('Resume uploaded successfully!');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert(`Upload failed: ${err.message}. Please make sure the backend is running.`);
    }
  }

  //------------------------------------------------------
  // UI – Multi-panel navigation
  //------------------------------------------------------
  const navItems = [
    { id: "dashboard", label: "My Resumes" },
    { id: "templates", label: "Resume Templates" },
    { id: "versions", label: "Resume Versions" },
    { id: "feedback", label: "Feedback Panel" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* PAGE TITLE */}
      <h1 className="text-3xl font-bold text-[#1e88e5]">Resume Workspace</h1>

      {/* NAVIGATION TABS */}
      <div className="flex gap-3 border-b pb-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1 rounded-md ${
              activeTab === item.id
                ? "bg-[#1e88e5] text-white"
                : "border border-[#1e88e5] text-[#1e88e5] hover:bg-blue-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ===========================
          TAB: DASHBOARD
      ============================ */}
      {activeTab === "dashboard" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#1e88e5]">
              My Resumes
            </h2>

            <div className="flex gap-3">
              {/* Upload Button */}
              <button
                className="border border-[#1e88e5] text-[#1e88e5] px-3 py-1 rounded-lg hover:bg-blue-50 transition"
                onClick={() => fileInputRef.current.click()}
              >
                Upload Resume
              </button>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
              />

              {/* AI Resume */}
              <Link
                to="/resumes/ai"
                className="px-3 py-1 rounded-lg text-[#1e88e5] border border-[#1e88e5] hover:bg-blue-50 transition"
              >
                + New AI Resume
              </Link>
            </div>
          </div>

          {/* Resume Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.length > 0 ? (
              resumes.map((r) => (
                <div
                  key={r.id}
                  className="border rounded-xl p-4 hover:shadow-md transition"
                >
                  <h2 className="font-bold text-lg text-[#1e88e5]">
                    {r.title || "Imported Resume"}
                  </h2>
                  <p className="text-sm text-gray-500 mb-2">
                    Updated {new Date(r.updatedAt).toLocaleDateString()}
                  </p>

                  <div className="flex gap-2">
                    <Link
                      to={`/resumes/preview/${r.id}`}
                      className="px-3 py-1 text-white bg-[#1e88e5] rounded hover:bg-blue-600"
                    >
                      Preview
                    </Link>

                    <Link
                      to={`/resumes/ai?id=${r.id}`}
                      className="px-3 py-1 border border-[#1e88e5] text-[#1e88e5] rounded hover:bg-blue-50"
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
      )}

      {/* ===========================
          TAB: TEMPLATE MANAGER
      ============================ */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-3 gap-4">

          {/* ============================
                CHRONOLOGICAL PREVIEW
          ============================== */}
          <div className="border rounded-lg p-4 bg-gray-50 shadow overflow-auto">
            <h2 className="text-lg font-bold text-[#1e88e5] mb-2">Chronological Template</h2>
            <ResumeTemplatePreview
              templateType="chronological"
              data={{
                header: { name: "John Doe", email: "john@example.com", location: "NYC" },
                summary: "A driven software developer with 3+ years of experience building scalable web applications.",
                experience: [
                  {
                    title: "Frontend Developer",
                    company: "Example Inc.",
                    startDate: "2022-01",
                    endDate: "Present",
                    bullets: [
                      "Implemented new UI features using React and TypeScript",
                      "Reduced load time by 30% through performance optimizations"
                    ]
                  }
                ]
              }}
            />
          </div>

          {/* ============================
                FUNCTIONAL PREVIEW
          ============================== */}
          <div className="border rounded-lg p-4 bg-gray-50 shadow overflow-auto">
            <h2 className="text-lg font-bold text-[#1e88e5] mb-2">Functional Template</h2>
            <ResumeTemplatePreview
              templateType="functional"
              data={{
                header: { name: "John Doe", email: "john@example.com", location: "NYC" },
                summary: "Skill-driven technologist specializing in front-end development and UI/UX engineering.",
                skillsSummary: [
                  {
                    category: "Frontend Engineering",
                    details: ["React", "Next.js", "Tailwind CSS", "Responsive Layouts"]
                  },
                  {
                    category: "Backend & DevOps",
                    details: ["Node.js", "Docker", "REST APIs"]
                  }
                ],
                achievements: [
                  "Optimized UI workflows increasing user engagement by 22%",
                  "Built internal tooling that saved the company 10+ hours per week"
                ],
                experience: [
                  {
                    company: "Tech Solutions LLC",
                    role: "Developer",
                    notes: ["Contributed to UI tasks", "Supported API maintenance"]
                  }
                ],
                education: [
                  { school: "NJIT", degree: "B.S. Computer Science", gradYear: "2026" }
                ]
              }}
            />
          </div>

          {/* ============================
                HYBRID PREVIEW
          ============================== */}
          <div className="border rounded-lg p-4 bg-gray-50 shadow overflow-auto">
            <h2 className="text-lg font-bold text-[#1e88e5] mb-2">Hybrid Template</h2>
            <ResumeTemplatePreview
              templateType="hybrid"
              data={{
                header: { name: "John Doe", email: "john@example.com", location: "NYC" },
                summary: "Full-stack developer blending technical skills with proven project execution.",
                skillsSummary: [
                  {
                    category: "Languages",
                    details: ["JavaScript", "Python", "SQL"]
                  },
                  {
                    category: "Frameworks",
                    details: ["React", "Node.js", "Express"]
                  }
                ],
                experience: [
                  {
                    title: "Full-Stack Developer",
                    company: "InnovateX",
                    startDate: "2021-02",
                    endDate: "2023-10",
                    bullets: [
                      "Built end-to-end features with React + Node.js",
                      "Designed REST APIs serving 50K+ monthly users"
                    ]
                  }
                ],
                projects: [
                  {
                    name: "Portfolio Builder",
                    description: "A no-code portfolio generator for students.",
                    tech: ["React", "Firebase", "Tailwind"]
                  }
                ],
                education: [
                  { school: "NJIT", degree: "B.S. Computer Science", gradYear: "2026" }
                ]
              }}
            />
          </div>

        </div>
      )}


      {/* ===========================
          TAB: VERSION MANAGER
      ============================ */}
      {activeTab === "versions" && (
        <div className="border rounded-lg p-4">
          <VersionManager />
        </div>
      )}

      {/* ===========================
          TAB: FEEDBACK PANEL
      ============================ */}
      {activeTab === "feedback" && (
        <div className="border rounded-lg p-4">
          <FeedbackPanel />
        </div>
      )}
    </div>
  );
}
