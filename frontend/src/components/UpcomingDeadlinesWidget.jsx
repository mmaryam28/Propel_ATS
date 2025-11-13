import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listJobs } from '../lib/api';

export default function UpcomingDeadlinesWidget() {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeadlines();
  }, []);

  async function loadDeadlines() {
    try {
      setLoading(true);
      // Get all jobs and filter/sort on frontend
      const jobs = await listJobs();
      
      // Filter jobs with deadlines and not rejected
      const jobsWithDeadlines = jobs.filter(j => 
        j.deadline && j.status !== 'Rejected'
      );
      
      // Sort by deadline (ascending)
      jobsWithDeadlines.sort((a, b) => 
        new Date(a.deadline) - new Date(b.deadline)
      );
      
      // Take top 5
      setDeadlines(jobsWithDeadlines.slice(0, 5));
    } catch (e) {
      console.error('Failed to load deadlines', e);
    } finally {
      setLoading(false);
    }
  }

  function getDeadlineInfo(deadline) {
    if (!deadline) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let urgencyClass = '';
    let text = '';
    
    if (diffDays < 0) {
      urgencyClass = 'bg-red-100 text-red-800 border border-red-300';
      text = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      urgencyClass = 'bg-red-100 text-red-800 border border-red-300';
      text = 'Due today!';
    } else if (diffDays <= 2) {
      urgencyClass = 'bg-red-100 text-red-800 border border-red-300';
      text = `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
    } else if (diffDays <= 7) {
      urgencyClass = 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      text = `${diffDays} days left`;
    } else {
      urgencyClass = 'bg-green-100 text-green-800 border border-green-300';
      text = `${diffDays} days left`;
    }
    
    return { text, urgencyClass, diffDays };
  }

  if (loading) {
    return (
      <div className="page-card p-4">
        <h3 className="text-lg font-semibold mb-3">Upcoming Deadlines</h3>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  if (deadlines.length === 0) {
    return (
      <div className="page-card p-4">
        <h3 className="text-lg font-semibold mb-3">Upcoming Deadlines</h3>
        <p className="text-sm text-gray-600">No upcoming deadlines</p>
      </div>
    );
  }

  return (
    <div className="page-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Upcoming Deadlines</h3>
        <Link to="/jobs" className="text-sm text-[var(--primary-color)] hover:underline font-medium">
          View all →
        </Link>
      </div>
      <div className="space-y-2">
        {deadlines.map(job => {
          const deadlineInfo = getDeadlineInfo(job.deadline);
          return (
            <Link 
              key={job.id} 
              to={`/jobs/${job.id}`}
              className="block p-3 rounded-lg border border-gray-200 hover:border-[var(--primary-color)] hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {job.title}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {job.company}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs rounded px-2 py-0.5 font-medium whitespace-nowrap ${deadlineInfo.urgencyClass}`}>
                    {deadlineInfo.text}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(job.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
