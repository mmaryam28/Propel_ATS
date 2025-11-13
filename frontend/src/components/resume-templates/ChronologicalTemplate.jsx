import React from "react";

export default function ChronologicalTemplate({ user, style }) {
  const textStyle = {
    fontFamily: style.font || "Inter",
    color: style.color || "#000",
  };

  return (
    <div className="p-6 w-full" style={textStyle}>
      {/* Header */}
      <h1 className="text-3xl font-bold">{user.name}</h1>

      {/* Experience */}
      <h2 className="mt-6 text-xl font-semibold">Work Experience</h2>
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

      {/* Skills */}
      <h2 className="mt-6 text-xl font-semibold">Skills</h2>
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

      {/* Education */}
      <h2 className="mt-6 text-xl font-semibold">Education</h2>
      <div className="space-y-3 mt-2">
        {user.education?.map((e) => (
          <div key={e.id}>
            <p className="font-bold">{e.school}</p>
            <p className="text-gray-600">{e.degree}</p>
          </div>
        ))}
      </div>

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
