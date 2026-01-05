import React, { useEffect, useState } from 'react';
import axios from 'axios';
import UpcomingDeadlinesWidget from '../components/UpcomingDeadlinesWidget';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

const API = import.meta.env.VITE_API_URL;

export default function Dashboard() {
  const [education, setEducation] = useState([]);
  const [completeness, setCompleteness] = useState(0);
  
  useEffect(() => {
    axios.get(`${API}/education/user/1`).then(r => setEducation(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    // Fetch profile completeness from backend
    const fetchCompleteness = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/profile/completeness`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCompleteness(response.data.overallPercentage || 0);
      } catch (err) {
        console.error('Error fetching profile completeness:', err);
      }
    };
    fetchCompleteness();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Track your application progress and analytics</p>
      </div>
      
      <UpcomingDeadlinesWidget />
      <AnalyticsDashboard />
      
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
