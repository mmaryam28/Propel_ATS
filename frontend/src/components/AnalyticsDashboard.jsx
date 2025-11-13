import React, { useEffect, useState } from 'react';
import { getAnalytics } from '../lib/api';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-center py-8 text-gray-600">Loading analytics...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;
  if (!analytics) return null;

  const statusColors = {
    'Interested': 'bg-blue-500',
    'Applied': 'bg-indigo-500',
    'Phone Screen': 'bg-yellow-500',
    'Interview': 'bg-orange-500',
    'Offer': 'bg-green-500',
    'Rejected': 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="page-card p-4">
          <div className="text-sm text-gray-600 mb-1">Total Applications</div>
          <div className="text-3xl font-bold text-[var(--primary-color)]">{analytics.totalApplications}</div>
        </div>

        <div className="page-card p-4">
          <div className="text-sm text-gray-600 mb-1">Response Rate</div>
          <div className="text-3xl font-bold text-green-600">{analytics.responseRate}%</div>
        </div>

        <div className="page-card p-4">
          <div className="text-sm text-gray-600 mb-1">Avg. Time to Offer</div>
          <div className="text-3xl font-bold text-orange-600">{analytics.avgTimeToOffer} days</div>
        </div>

        <div className="page-card p-4">
          <div className="text-sm text-gray-600 mb-1">Upcoming Interviews</div>
          <div className="text-3xl font-bold text-purple-600">{analytics.upcomingInterviews.length}</div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="page-card p-6">
        <h3 className="text-lg font-semibold mb-4">Applications by Status</h3>
        <div className="space-y-3">
          {Object.entries(analytics.byStatus).map(([status, count]) => (
            <div key={status} className="flex items-center gap-3">
              <div className="w-32 text-sm font-medium">{status}</div>
              <div className="flex-1">
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${statusColors[status] || 'bg-gray-500'} flex items-center justify-end px-3`}
                    style={{ width: `${(count / analytics.totalApplications) * 100}%` }}
                  >
                    <span className="text-xs font-medium text-white">{count}</span>
                  </div>
                </div>
              </div>
              <div className="w-16 text-sm text-gray-600 text-right">
                {((count / analytics.totalApplications) * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Interviews */}
      {analytics.upcomingInterviews.length > 0 && (
        <div className="page-card p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Interviews</h3>
          <div className="space-y-3">
            {analytics.upcomingInterviews.map(interview => (
              <div key={interview.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{interview.title}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(interview.scheduled_at).toLocaleString()}
                  </div>
                </div>
                {interview.location && (
                  <div className="text-xs text-gray-500">{interview.location}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Timeline (Last 30 Days) */}
      <div className="page-card p-6">
        <h3 className="text-lg font-semibold mb-4">Application Activity (Last 30 Days)</h3>
        <div className="h-64 flex items-end gap-1">
          {Object.entries(analytics.applicationsByDay).length > 0 ? (
            Object.entries(analytics.applicationsByDay).map(([date, count]) => {
              const maxCount = Math.max(...Object.values(analytics.applicationsByDay));
              const height = (count / maxCount) * 100;
              return (
                <div key={date} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-[var(--primary-color)] rounded-t"
                    style={{ height: `${height}%` }}
                    title={`${date}: ${count} applications`}
                  />
                  <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="w-full text-center text-gray-500">No data for the last 30 days</div>
          )}
        </div>
      </div>
    </div>
  );
}
