import React, { useState } from "react";

export default function SectionCustomizer() {
  const [sections, setSections] = useState([
    { name: "Education", visible: true },
    { name: "Skills", visible: true },
    { name: "Projects", visible: true },
    { name: "Experience", visible: true },
  ]);

  function toggleSection(name) {
    setSections(s => s.map(sec => sec.name === name ? { ...sec, visible: !sec.visible } : sec));
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold" style={{ color: "#1e88e5" }}>Customize Resume Sections</h1>
      {sections.map(sec => (
        <div key={sec.name} className="flex justify-between items-center border-b py-2">
          <span>{sec.name}</span>
          <button size="sm" variant={sec.visible ? "default" : "outline"} onClick={() => toggleSection(sec.name)}>
            {sec.visible ? "Hide" : "Show"}
          </button>
        </div>
      ))}
    </div>
  );
}
