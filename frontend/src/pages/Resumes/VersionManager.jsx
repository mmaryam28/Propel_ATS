import React, { useState, useEffect } from "react";
import { getResumeVersions } from '../../lib/api';
import ResumeTemplatePreview from './ResumeTemplatePreview';

export default function VersionManager() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedResume, setSelectedResume] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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

  // Load full resume data when a version is selected
  useEffect(() => {
    if (!selectedId) {
      setSelectedResume(null);
      return;
    }

    async function loadResume() {
      setPreviewLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/resume/${selectedId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error('Failed to load resume');
        const data = await response.json();
        setSelectedResume(data);
      } catch (err) {
        console.error('Failed to load resume:', err);
        setSelectedResume(null);
      } finally {
        setPreviewLoading(false);
      }
    }

    loadResume();
  }, [selectedId]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold" style={{ color: "#1e88e5" }}>Resume Versions</h1>
      {loading ? (
        <div className="text-gray-500">Loading versions...</div>
      ) : versions.length === 0 ? (
        <div className="text-gray-500">No resume versions found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: List of Versions */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h2 className="font-semibold text-[#1e88e5] mb-3">Your Resumes</h2>
            <ul className="divide-y">
              {versions.map((v, i) => (
                <li
                  key={v.id || i}
                  onClick={() => setSelectedId(v.id)}
                  className={`py-3 px-2 rounded cursor-pointer transition ${
                    selectedId === v.id
                      ? 'bg-[#1e88e5] text-white'
                      : 'hover:bg-blue-100'
                  }`}
                >
                  <div>
                    <div className="font-medium">{v.title || 'Untitled Resume'}</div>
                    <div className={`text-xs ${selectedId === v.id ? 'text-blue-100' : 'text-gray-500'}`}>
                      {v.updatedAt ? new Date(v.updatedAt).toLocaleDateString() : 'No date'}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-2">
            {!selectedId ? (
              <div className="border rounded-lg p-8 bg-gray-50 text-center text-gray-500">
                <p>Select a resume to preview</p>
              </div>
            ) : previewLoading ? (
              <div className="border rounded-lg p-8 bg-gray-50 text-center text-gray-500">
                <p>Loading resume...</p>
              </div>
            ) : selectedResume ? (
              <div className="border rounded-lg p-4 overflow-auto max-h-[800px]">
                <ResumeTemplatePreview
                  data={selectedResume.aiContent || selectedResume}
                  templateType="chronological"
                />
              </div>
            ) : (
              <div className="border rounded-lg p-8 bg-gray-50 text-center text-red-500">
                <p>Failed to load resume</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
