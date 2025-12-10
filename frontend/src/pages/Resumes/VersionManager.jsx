import React, { useState, useEffect } from "react";
import { getResumeVersions } from '../../lib/api';

export default function VersionManager() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVersions() {
      setLoading(true);
      try {
        const data = await getResumeVersions();
        setVersions(data);
      } catch (err) {
        setVersions([]);
      } finally {
        setLoading(false);
      }
    }
    fetchVersions();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold" style={{ color: "#1e88e5" }}>Resume Versions</h1>
      {loading ? (
        <div className="text-gray-500">Loading versions...</div>
      ) : versions.length === 0 ? (
        <div className="text-gray-500">No resume versions found.</div>
      ) : (
        <ul className="divide-y">
          {versions.map((v, i) => (
            <li key={v.id || i} className="py-2 flex justify-between">
              <span>{v.title || 'Untitled Resume'}</span>
              <span className="text-sm text-gray-500">{v.updatedAt ? new Date(v.updatedAt).toLocaleDateString() : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
