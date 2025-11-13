// ResumeDashboard.jsx  (merged dashboard)
// Michelle Zambrano – All resume features combined

import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

// Imported sub-tools
import TemplateManager from "./TemplateManager";
import SectionCustomizer from "./SectionCustomizer";
import VersionManager from "./VersionManager";
import FeedbackPanel from "./FeedbackPanel";
import ResumePreview from "./ResumePreview"; // optional if you want inline preview

export default function ResumeDashboard() {
  const [resumes, setResumes] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const fileInputRef = useRef(null);

  // Fetch resumes
  useEffect(() => {
    fetch("http://localhost:3000/resume?userId=1")
      .then((res) => res.json())
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

    const formData = new FormData();
    formData.append("resumeFile", file);
    formData.append("userId", "1");

    try {
      const uploadRes = await fetch("http://localhost:3000/resume/upload", {
        method: "POST",
        body: formData,
      });

      const data = await uploadRes.json();
      console.log("Uploaded:", data);

      setResumes((prev) => [...prev, data]);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  }

  //------------------------------------------------------
  // UI – Multi-panel navigation
  //------------------------------------------------------
  const navItems = [
    { id: "dashboard", label: "My Resumes" },
    { id: "templates", label: "Resume Templates" },
    { id: "sections", label: "Customize Sections" },
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
        <div className="border rounded-lg p-4">
          <TemplateManager />
        </div>
      )}

      {/* ===========================
          TAB: SECTION CUSTOMIZER
      ============================ */}
      {activeTab === "sections" && (
        <div className="border rounded-lg p-4">
          <SectionCustomizer />
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
