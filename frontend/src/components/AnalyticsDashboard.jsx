import React, { useEffect, useState } from 'react';
import { getAnalytics } from '../lib/api';
import { useAnalytics } from '../contexts/AnalyticsContext';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { refreshTrigger } = useAnalytics();

  useEffect(() => {
    loadAnalytics();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

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
      {analytics.byStatus && Object.keys(analytics.byStatus).length > 0 && (
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
      )}

      {/* Upcoming Interviews */}
      {analytics.upcomingInterviews && analytics.upcomingInterviews.length > 0 && (
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
      {analytics.applicationsByDay && Object.keys(analytics.applicationsByDay).length > 0 ? (
        <div className="page-card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Applications Submitted</h3>
            <p className="text-sm text-gray-600">Number of applications submitted per day (last 30 days)</p>
          </div>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 bg-gray-50 rounded-lg p-4 pb-8 min-w-full relative h-48" style={{ minWidth: '800px' }}>
              {Object.entries(analytics.applicationsByDay)
                .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                .map(([date, count], index) => {
                  const allCounts = Object.values(analytics.applicationsByDay).filter(c => c > 0);
                  const maxCount = allCounts.length > 0 ? Math.max(...allCounts) : 1;
                  // Calculate height: 0 gets tiny bar, others scale proportionally
                  const height = count === 0 ? 3 : Math.max(15, (count / maxCount) * 85);
                  const isZero = count === 0;
                  const dateObj = new Date(date);
                  const dayOfMonth = dateObj.getDate();
                  // Show date label on Mondays or first day of month
                  const showDateLabel = dayOfMonth === 1 || dateObj.getDay() === 1 || index === 0;
                  
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center justify-end relative h-full" style={{ minWidth: '20px' }}>
                      <div className="flex-1 flex flex-col items-center justify-end w-full">
                        {!isZero && count > 0 && <div className="text-xs font-semibold text-gray-700 mb-1">{count}</div>}
                        <div
                          className={`w-full rounded-t transition-all ${isZero ? 'bg-gray-300 opacity-30' : 'bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/80 cursor-pointer'}`}
                          style={{ height: `${height}%` }}
                          title={`${dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}: ${count} application${count !== 1 ? 's' : ''} submitted`}
                        />
                      </div>
                      {showDateLabel && (
                        <div className="absolute -bottom-6 left-0 text-[10px] text-gray-600 font-medium whitespace-nowrap">
                          {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
