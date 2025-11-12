import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listJobs } from '../lib/api';

export default function JobCalendar() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      setLoading(true);
      const data = await listJobs();
      // Filter jobs with deadlines
      const jobsWithDeadlines = data.filter(j => j.deadline);
      setJobs(jobsWithDeadlines);
    } catch (e) {
      console.error('Failed to load jobs', e);
    } finally {
      setLoading(false);
    }
  }

  function getDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  }

  function getJobsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return jobs.filter(job => {
      const jobDate = new Date(job.deadline).toISOString().split('T')[0];
      return jobDate === dateStr;
    });
  }

  function getDeadlineUrgency(deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 2) return 'critical';
    if (diffDays <= 7) return 'warning';
    return 'safe';
  }

  function previousMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build calendar grid
  const calendarDays = [];
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Job Deadlines Calendar</h1>
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const selectedDateJobs = selectedDate ? getJobsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Job Deadlines Calendar</h1>
        <p className="text-gray-600">View all your job application deadlines in calendar format</p>
      </div>

      <div className="page-card p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[month]} {year}
          </h2>
          <div className="flex gap-2">
            <button onClick={goToToday} className="btn btn-secondary text-sm">
              Today
            </button>
            <button onClick={previousMonth} className="btn btn-secondary">
              ←
            </button>
            <button onClick={nextMonth} className="btn btn-secondary">
              →
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-200"></div>
            <span>Overdue / Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-200"></div>
            <span>Warning (3-7 days)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-200"></div>
            <span>Safe (&gt;7 days)</span>
          </div>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square"></div>;
            }

            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);
            const dateJobs = getJobsForDate(date);
            const isToday = date.getTime() === today.getTime();
            const isSelected = selectedDate && date.getTime() === selectedDate.getTime();

            // Get most urgent job for this date
            let urgencyClass = '';
            if (dateJobs.length > 0) {
              const urgencies = dateJobs.map(j => getDeadlineUrgency(j.deadline));
              if (urgencies.includes('overdue') || urgencies.includes('critical')) {
                urgencyClass = 'bg-red-200 border-red-400';
              } else if (urgencies.includes('warning')) {
                urgencyClass = 'bg-yellow-200 border-yellow-400';
              } else {
                urgencyClass = 'bg-green-200 border-green-400';
              }
            }

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(date)}
                className={`
                  aspect-square p-2 rounded-lg border-2 transition-all
                  ${urgencyClass || 'border-gray-200 hover:border-gray-300'}
                  ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                  ${isSelected ? 'ring-2 ring-[var(--primary-color)] ring-offset-2' : ''}
                  ${dateJobs.length > 0 ? 'cursor-pointer' : 'cursor-default'}
                  relative
                `}
              >
                <div className="flex flex-col h-full">
                  <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {day}
                  </span>
                  {dateJobs.length > 0 && (
                    <span className="text-xs font-bold mt-auto">
                      {dateJobs.length}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && selectedDateJobs.length > 0 && (
        <div className="page-card p-6">
          <h3 className="text-lg font-semibold mb-4">
            Deadlines on {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h3>
          <div className="space-y-3">
            {selectedDateJobs.map(job => {
              const urgency = getDeadlineUrgency(job.deadline);
              let urgencyBadge = '';
              if (urgency === 'overdue') urgencyBadge = 'bg-red-100 text-red-800 border-red-300';
              else if (urgency === 'critical') urgencyBadge = 'bg-red-100 text-red-800 border-red-300';
              else if (urgency === 'warning') urgencyBadge = 'bg-yellow-100 text-yellow-800 border-yellow-300';
              else urgencyBadge = 'bg-green-100 text-green-800 border-green-300';

              return (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-[var(--primary-color)] hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-600">{job.company}</div>
                      {job.status && (
                        <div className="text-xs text-gray-500 mt-1">Status: {job.status}</div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded border font-medium ${urgencyBadge}`}>
                      {urgency === 'overdue' ? 'Overdue' : urgency === 'critical' ? 'Critical' : urgency === 'warning' ? 'Soon' : 'Upcoming'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {selectedDate && selectedDateJobs.length === 0 && (
        <div className="page-card p-6">
          <p className="text-gray-600">No deadlines on {selectedDate.toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}
