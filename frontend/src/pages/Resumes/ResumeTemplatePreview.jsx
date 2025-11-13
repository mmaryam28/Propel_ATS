import React from "react";

export default function ResumeTemplatePreview({ data, templateType }) {
  if (!data) return null;

  return (
    <div className="border rounded-lg p-6 bg-white shadow space-y-4">
      <h2 className="text-xl font-bold text-[#1e88e5]">
        {templateType.charAt(0).toUpperCase() + templateType.slice(1)} Resume Preview
      </h2>

      {/* HEADER */}
      {data.header && (
        <div className="space-y-1">
          <h3 className="font-bold text-lg">{data.header.name}</h3>
          <p className="text-gray-600">{data.header.email}</p>
          <p className="text-gray-600">{data.header.location}</p>
        </div>
      )}

      {/* SUMMARY */}
      {data.summary && (
        <div>
          <h3 className="font-semibold text-blue-800">Summary</h3>
          <p className="text-gray-700">{data.summary}</p>
        </div>
      )}

      {/* CHRONOLOGICAL EXPERIENCE */}
      {templateType === "chronological" && data.experience && (
        <div>
          <h3 className="font-semibold text-blue-800">Experience</h3>
          {data.experience.map((exp, idx) => (
            <div key={idx} className="mt-2">
              <p className="font-bold">{exp.title} — {exp.company}</p>
              <p className="text-sm text-gray-500">
                {exp.startDate} – {exp.endDate}
              </p>
              <ul className="list-disc ml-6 text-gray-700">
                {exp.bullets?.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* FUNCTIONAL SKILLS SUMMARY */}
      {templateType === "functional" && data.skillsSummary && (
        <div>
          <h3 className="font-semibold text-blue-800">Skills Summary</h3>
          {data.skillsSummary.map((group, idx) => (
            <div key={idx}>
              <p className="font-bold">{group.category}</p>
              <ul className="ml-6 list-disc">
                {group.details.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* HYBRID PREVIEW */}
      {templateType === "hybrid" && (
        <>
          {/* Skills Summary */}
          {data.skillsSummary && (
            <div>
              <h3 className="font-semibold text-blue-800">Skills Summary</h3>
              {data.skillsSummary.map((group, idx) => (
                <div key={idx}>
                  <p className="font-bold">{group.category}</p>
                  <ul className="ml-6 list-disc">
                    {group.details.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Experience */}
          {data.experience && (
            <div>
              <h3 className="font-semibold text-blue-800">Experience</h3>
              {data.experience.map((exp, idx) => (
                <div key={idx} className="mt-2">
                  <p className="font-bold">{exp.title} — {exp.company}</p>
                  <p className="text-sm text-gray-500">
                    {exp.startDate} – {exp.endDate}
                  </p>
                  <ul className="list-disc ml-6 text-gray-700">
                    {exp.bullets?.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* RAW JSON TOGGLE */}
      <details className="bg-gray-50 rounded border p-3 mt-4">
        <summary className="cursor-pointer text-sm font-medium">Raw JSON</summary>
        <pre className="text-xs mt-2 overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
