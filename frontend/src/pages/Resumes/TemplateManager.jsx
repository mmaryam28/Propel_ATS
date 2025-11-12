import React, { useEffect, useState } from "react";

export default function TemplateManager() {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/resume/templates")
      .then(res => res.json())
      .then(data => {
        console.log("Fetched templates:", data);
        setTemplates(data.templates || []); // ✅ use data.templates if the API wraps it
      })
      .catch(() => {
        setTemplates([
          { id: 1, name: "Chronological" },
          { id: 2, name: "Functional" },
          { id: 3, name: "Hybrid" },
        ]);
      });
  }, []);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.isArray(templates) &&
        templates.map(t => (
          <div key={t.id} className="border rounded-xl p-4 flex flex-col items-center">
            <div className="h-40 w-full bg-gray-100 rounded mb-3"></div>
            <h3 className="font-semibold mb-2">{t.name}</h3>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Select
            </button>
          </div>
        ))}
    </div>
  );
}
