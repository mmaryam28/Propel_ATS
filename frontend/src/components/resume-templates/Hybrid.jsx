import React from "react";

export default function HybridTemplate({ user, style }) {
  const textStyle = {
    fontFamily: style.font || "Inter",
    color: style.color || "#000",
  };

  return (
    <div className="p-6 w-full" style={textStyle}>
      {/* Header */}
      <h1 className="text-3xl font-bold">{user.name}</h1>

      {/* Two-column Skills + Summary */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <div>
          <h2 className="text-xl font-semibold">Skills</h2>
          <ul className="flex flex-wrap gap-2 mt-2">
            {user.skills?.map((skill) => (
              <li
                key={skill.id}
                className="px-2 py-1 bg-gray-200 text-sm rounded"
              >
                {skill.name}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Summary</h2>
          <p className="text-gray-700 text-sm mt-2">
            {/* AI-generated or user-provided summary (optional) */}
            {user.summary || "Motivated candidate with strong skills and experience."}
          </p>
        </div>
      </div>

      {/* Experience */}
      <h2 className="mt-8 text-xl font-semibold">Experience</h2>
      <div className="space-y-4 mt-2">
        {user.experience?.map((job) => (
          <div key={job.id}>
            <p className="font-bold">{job.title}</p>
            <p className="text-gray-600">{job.company}</p>
            <p className="text-gray-500 text-sm">
              {job.startDate} – {job.endDate || "Present"}
            </p>
            <ul className="list-disc ml-6 mt-1 text-sm">
              {job.bullets?.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Education */}
      <h2 className="mt-6 text-xl font-semibold">Education</h2>
      {user.education?.map((e) => (
        <div key={e.id} className="mt-2">
          <p className="font-bold">{e.school}</p>
          <p className="text-gray-600">{e.degree}</p>
        </div>
      ))}

      {/* Certifications */}
      <h2 className="mt-6 text-xl font-semibold">Certifications</h2>
      <ul className="list-disc ml-6 mt-2">
        {user.certs?.map((c) => (
          <li key={c.id}>{c.title}</li>
        ))}
      </ul>
    </div>
  );
}
