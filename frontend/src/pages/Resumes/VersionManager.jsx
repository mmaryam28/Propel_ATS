import React, { useState } from "react";

export default function VersionManager() {
  const [versions, setVersions] = useState([
    { name: "Test Resume", date: "2025-11-12" },
  ]);
  const [newVersion, setNewVersion] = useState("");

  const addVersion = () => {
    if (!newVersion) return;
    setVersions([...versions, { name: newVersion, date: new Date().toISOString() }]);
    setNewVersion("");
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold" style={{ color: "#1e88e5" }}>Resume Versions</h1>
      <div className="flex gap-2">
        <input placeholder="New version name..." value={newVersion} onChange={e => setNewVersion(e.target.value)} className="border rounded p-2" />
        <button onClick={addVersion}>Add</button>
      </div>
      <ul className="divide-y">
        {versions.map((v, i) => (
          <li key={i} className="py-2 flex justify-between">
            <span>{v.name}</span>
            <span className="text-sm text-gray-500">{new Date(v.date).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
