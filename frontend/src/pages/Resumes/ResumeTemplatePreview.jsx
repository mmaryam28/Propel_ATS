import React, { useEffect } from "react";

export default function ResumeTemplatePreview({ data, templateType }) {
  // Debug: log the incoming data structure
  useEffect(() => {
    console.log("ResumeTemplatePreview received data:", data);
    console.log("Data type:", typeof data);
    console.log("Data keys:", data ? Object.keys(data) : "null");
  }, [data]);

  if (!data) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        ⚠️ No resume data available. Generate a resume first using "Generate Resume Content" button.
      </div>
    );
  }

  // Handle different possible data structures
  // The data might be: { header, summary, skills, experience, ... } or { sections: { ... }, ... } or other formats
  const normalizeData = () => {
    // If data already has the expected fields at top level
    if (data.header || data.summary) {
      return data;
    }

    // If data has a sections object, use that
    if (data.sections && typeof data.sections === "object") {
      return data.sections;
    }

    // If data is the entire aiContent object, extract fields
    const normalized = {
      header: data.header || {
        name: data.name || "Your Name",
        email: data.email || "",
        phone: data.phone || "",
        location: data.location || "",
      },
      summary: data.summary || data.professionalSummary || "",
      skills: Array.isArray(data.skills)
        ? data.skills
        : data.skills?.map ? Object.values(data.skills).flat() : [],
      experience: Array.isArray(data.experience) ? data.experience : [],
      skillsSummary: data.skillsSummary || [],
    };

    return normalized;
  };

  const normalizedData = normalizeData();

  // Get all available data - include sections and top-level fields
  const getAllData = () => {
    const all = { ...normalizedData };
    
    // If data has sections, merge them in
    if (data.sections) {
      Object.assign(all, data.sections);
    }
    
    // Include any top-level fields not already in normalized
    if (data.projects) all.projects = data.projects;
    if (data.education && !all.education) all.education = data.education;
    if (data.certifications) all.certifications = data.certifications;
    if (data.languages) all.languages = data.languages;
    if (data.awards) all.awards = data.awards;
    if (data.volunteer) all.volunteer = data.volunteer;
    
    return all;
  };

  const allData = getAllData();

  // Check if we have any meaningful data to display
  const hasContent =
    allData.header?.name ||
    allData.summary ||
    (allData.skills && allData.skills.length > 0) ||
    (allData.experience && allData.experience.length > 0) ||
    (allData.education && allData.education.length > 0) ||
    (allData.projects && allData.projects.length > 0);

  if (!hasContent) {
    return (
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 text-center">
        <p className="text-blue-900 font-semibold mb-2">📄 Resume Preview</p>
        <p className="text-blue-700 text-sm">
          Generate a resume using the buttons above to see a live preview here.
        </p>
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-xs font-mono text-gray-600 hover:text-gray-900">
            Debug: Show received data
          </summary>
          <pre className="text-xs mt-2 bg-gray-900 text-green-400 p-3 rounded overflow-auto max-h-48">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* PDF-LIKE RESUME VIEWER */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#1e88e5] to-[#1565c0] text-white px-8 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {templateType.charAt(0).toUpperCase() + templateType.slice(1)} Resume
          </h2>
          <span className="text-sm opacity-75">Live Preview</span>
        </div>

        {/* Resume Content - PDF Style */}
        <div className="p-8 bg-white text-gray-900 max-w-4xl mx-auto" style={{ minHeight: "600px" }}>
          {/* HEADER */}
          {allData.header && (
            <div className="mb-6 border-b-2 border-gray-300 pb-4">
              <h1 className="text-3xl font-bold text-gray-900">{allData.header.name}</h1>
              <div className="flex gap-4 text-sm text-gray-700 mt-2">
                {allData.header.email && <span>{allData.header.email}</span>}
                {allData.header.phone && <span>•</span>}
                {allData.header.phone && <span>{allData.header.phone}</span>}
                {allData.header.location && <span>•</span>}
                {allData.header.location && <span>{allData.header.location}</span>}
              </div>
            </div>
          )}

          {/* SUMMARY */}
          {allData.summary && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#1e88e5] uppercase tracking-wide mb-2">
                Professional Summary
              </h2>
              <p className="text-gray-700 leading-relaxed text-justify">{allData.summary}</p>
            </div>
          )}

          {/* SKILLS */}
          {allData.skills && Array.isArray(allData.skills) && allData.skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#1e88e5] uppercase tracking-wide mb-2">
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {allData.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm font-medium"
                  >
                    {typeof skill === "string" ? skill : JSON.stringify(skill)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CHRONOLOGICAL EXPERIENCE */}
          {templateType === "chronological" && allData.experience && allData.experience.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#1e88e5] uppercase tracking-wide mb-3">
                Professional Experience
              </h2>
              <div className="space-y-4">
                {allData.experience.map((exp, idx) => (
                  <div key={idx} className="border-l-4 border-[#1e88e5] pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900 text-base">
                          {exp.title || exp.position || "Position"}
                        </p>
                        <p className="text-[#1e88e5] font-semibold">
                          {exp.company || exp.employer || "Company"}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-nowrap ml-4">
                        {exp.startDate || exp.start} – {exp.endDate || exp.end || "Present"}
                      </p>
                    </div>
                    {(exp.bullets || exp.achievements) && Array.isArray(exp.bullets || exp.achievements) && (exp.bullets || exp.achievements).length > 0 && (
                      <ul className="list-disc ml-6 text-gray-700 mt-2 text-sm space-y-1">
                        {(exp.bullets || exp.achievements).map((b, i) => (
                          <li key={i}>{typeof b === "string" ? b : JSON.stringify(b)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EDUCATION */}
          {allData.education && Array.isArray(allData.education) && allData.education.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#1e88e5] uppercase tracking-wide mb-3">
                Education
              </h2>
              <div className="space-y-3">
                {allData.education.map((edu, idx) => (
                  <div key={idx} className="border-l-4 border-[#1e88e5] pl-4">
                    <p className="font-bold text-gray-900">{edu.degree || edu.name || "Degree"}</p>
                    <p className="text-[#1e88e5] font-semibold">{edu.institution || edu.school || "Institution"}</p>
                    <p className="text-sm text-gray-600">
                      {edu.location && `${edu.location} • `}
                      {edu.graduationDate || edu.endDate || ""}
                    </p>
                    {edu.gpa && <p className="text-sm text-gray-700">GPA: {edu.gpa}</p>}
                    {edu.relevantCourses && Array.isArray(edu.relevantCourses) && edu.relevantCourses.length > 0 && (
                      <p className="text-sm text-gray-700">Courses: {edu.relevantCourses.join(", ")}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROJECTS */}
          {allData.projects && Array.isArray(allData.projects) && allData.projects.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#1e88e5] uppercase tracking-wide mb-3">
                Projects
              </h2>
              <div className="space-y-4">
                {allData.projects.map((proj, idx) => (
                  <div key={idx} className="border-l-4 border-[#1e88e5] pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900 text-base">{proj.name || proj.title || "Project"}</p>
                        {proj.description && <p className="text-gray-700 text-sm mt-1">{proj.description}</p>}
                      </div>
                    </div>
                    {proj.technologies && Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {proj.technologies.map((tech, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    {(proj.achievements || proj.bullets) && Array.isArray(proj.achievements || proj.bullets) && (proj.achievements || proj.bullets).length > 0 && (
                      <ul className="list-disc ml-6 text-gray-700 mt-2 text-sm space-y-1">
                        {(proj.achievements || proj.bullets).map((item, i) => (
                          <li key={i}>{typeof item === "string" ? item : JSON.stringify(item)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CERTIFICATIONS */}
          {allData.certifications && Array.isArray(allData.certifications) && allData.certifications.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#1e88e5] uppercase tracking-wide mb-3">
                Certifications
              </h2>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                {allData.certifications.map((cert, idx) => (
                  <li key={idx}>
                    {cert.name || cert.title || cert}{cert.issuer ? ` - ${cert.issuer}` : ""}{cert.date ? ` (${cert.date})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* FUNCTIONAL SKILLS SUMMARY */}
          {templateType === "functional" && allData.skillsSummary && allData.skillsSummary.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#1e88e5] uppercase tracking-wide mb-3">
                Core Competencies
              </h2>
              <div className="space-y-3">
                {allData.skillsSummary.map((group, idx) => (
                  <div key={idx}>
                    <p className="font-bold text-gray-900">{group.category}</p>
                    <p className="text-gray-700 text-sm">
                      {Array.isArray(group.details) ? group.details.join(" • ") : group.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HYBRID PREVIEW */}
          {templateType === "hybrid" && (
            <>
              {/* Skills Summary */}
              {allData.skillsSummary && allData.skillsSummary.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-[#1e88e5] uppercase tracking-wide mb-3">
                    Core Competencies
                  </h2>
                  <div className="space-y-3">
                    {allData.skillsSummary.map((group, idx) => (
                      <div key={idx}>
                        <p className="font-bold text-gray-900">{group.category}</p>
                        <p className="text-gray-700 text-sm">
                          {Array.isArray(group.details) ? group.details.join(" • ") : group.details}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {allData.experience && allData.experience.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-[#1e88e5] uppercase tracking-wide mb-3">
                    Professional Experience
                  </h2>
                  <div className="space-y-4">
                    {allData.experience.map((exp, idx) => (
                      <div key={idx} className="border-l-4 border-[#1e88e5] pl-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-900 text-base">
                              {exp.title || exp.position || "Position"}
                            </p>
                            <p className="text-[#1e88e5] font-semibold">
                              {exp.company || exp.employer || "Company"}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 whitespace-nowrap ml-4">
                            {exp.startDate || exp.start} – {exp.endDate || exp.end || "Present"}
                          </p>
                        </div>
                        {(exp.bullets || exp.achievements) && Array.isArray(exp.bullets || exp.achievements) && (exp.bullets || exp.achievements).length > 0 && (
                          <ul className="list-disc ml-6 text-gray-700 mt-2 text-sm space-y-1">
                            {(exp.bullets || exp.achievements).map((b, i) => (
                              <li key={i}>{typeof b === "string" ? b : JSON.stringify(b)}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* RAW JSON TOGGLE - OPTIONAL */}
      <details className="bg-gray-50 rounded border border-gray-300 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
          📋 View Raw JSON (Advanced)
        </summary>
        <pre className="text-xs mt-3 overflow-auto bg-gray-900 text-green-400 p-4 rounded max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
