import React from "react";

export default function FunctionalTemplate({ user, style }) {
  const textStyle = {
    fontFamily: style.font || "Inter",
    color: style.color || "#000",
  };

  return (
    <div className="p-6 w-full" style={textStyle}>
      {/* Header */}
      <h1 className="text-3xl font-bold">{user.name}</h1>

      {/* Skills */}
      <h2 className="mt-6 text-xl font-semibold">Key Skills</h2>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {user.skills?.map((skill) => (
          <div key={skill.id} className="text-sm bg-gray-100 p-2 rounded">
            {skill.name}
          </div>
        ))}
      </div>

      {/* Experience Highlights */}
      <h2 className="mt-6 text-xl font-semibold">Experience Highlights</h2>
      <ul className="list-disc ml-6 mt-2 space-y-2 text-sm">
        {user.experience?.flatMap((job) =>
          job.bullets?.map((b, i) => <li key={`${job.id}-${i}`}>{b}</li>)
        )}
      </ul>

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
