import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import UpcomingDeadlinesWidget from '../components/UpcomingDeadlinesWidget';

const API = import.meta.env?.VITE_API_URL || 'http://localhost:3000';

export default function Dashboard() {
  const [education, setEducation] = useState([]);
  useEffect(() => {
    axios.get(`${API}/education/user/1`).then(r => setEducation(r.data)).catch(() => {});
  }, []);

  const completeness = useMemo(() => {
    // Example: 20% for education if at least one entry
    return education.length > 0 ? 20 : 0;
  }, [education]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-gray-600">Welcome! Use the nav to explore the app.</p>
      </div>
      
      <UpcomingDeadlinesWidget />
      
      <div className="page-card p-4">
        <h2 className="text-lg font-semibold mb-3">Education Summary</h2>
        {education.length === 0 ? (
          <div className="text-sm text-gray-600">No education entries yet.</div>
        ) : (
          <ul className="space-y-2">
            {education.map(e => (
              <li key={e.id} className="text-sm">
                <strong>{e.degree}</strong> — {e.institution} ({e.educationLevel})
                <span className="text-gray-600 ml-2">{e.startDate?.slice(0,10)} - {e.endDate ? e.endDate.slice(0,10) : 'Ongoing'}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <strong>Profile Completeness:</strong> {completeness}%
        </div>
      </div>
    </div>
  );
}
