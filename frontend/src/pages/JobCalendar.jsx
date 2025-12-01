import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listJobs, getInterviews, getInterviewPrep } from '../lib/api';
import InterviewPrepPanel from '../components/interview/InterviewPrepPanel';

export default function JobCalendar() {
  const [jobs, setJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // AI Prep panel state
  const [activeInterview, setActiveInterview] = useState(null);
  const [prepData, setPrepData] = useState(null);
  const [prepLoading, setPrepLoading] = useState(false);
  const [prepError, setPrepError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [jobsData, interviewsData] = await Promise.all([
        listJobs(),
        getInterviews(),
      ]);

      const jobsWithDeadlines = jobsData.filter(j => j.deadline);
      setJobs(jobsWithDeadlines);
      setInterviews(interviewsData);
    } catch (e) {
      console.error('❌ [JobCalendar] Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------
  // OPEN AI PREP PANEL
  // -------------------------------
  async function openInterviewPrep(interview) {
  setActiveInterview(interview);
  setPrepLoading(true);
  setPrepError(null);
  setPrepData(null);

  try {
    console.log("🔥 OPENING PREP FOR INTERVIEW:", interview.id);
    const data = await getInterviewPrep(interview.id);
    setPrepData(data);
  } catch (e) {
    console.error("❌ Failed to load prep:", e);
    setPrepError("Failed to load interview preparation data.");
  } finally {
    setPrepLoading(false);
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

  function getEventsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];

    const deadlines = jobs.filter(job => {
      const jobDate = new Date(job.deadline).toISOString().split('T')[0];
      return jobDate === dateStr;
    });

    const interviewsOnDate = interviews.filter(interview => {
      const intDate = new Date(interview.scheduled_at).toISOString().split('T')[0];
      return intDate === dateStr;
    });

    return { deadlines, interviews: interviewsOnDate };
  }

  function getDeadlineUrgency(deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

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

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Job Deadlines Calendar</h1>
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Job Deadlines Calendar</h1>
        <p className="text-gray-600">View all your job deadlines and interview schedule</p>
      </div>

      <div className="page-card p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[month]} {year}
          </h2>
          <div className="flex gap-2">
            <button onClick={goToToday} className="btn btn-secondary text-sm">Today</button>
            <button onClick={previousMonth} className="btn btn-secondary">←</button>
            <button onClick={nextMonth} className="btn btn-secondary">→</button>
          </div>
        </div>

        {/* Day Labels */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (day === null) return <div key={index} className="aspect-square"></div>;

            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);
            const dateEvents = getEventsForDate(date);
            const isToday = today.getTime() === date.getTime();
            const isSelected = selectedDate && selectedDate.getTime() === date.getTime();

            let urgencyClass = '';
            if (dateEvents.deadlines.length > 0) {
              const urgencies = dateEvents.deadlines.map(j => getDeadlineUrgency(j.deadline));
              if (urgencies.includes('overdue') || urgencies.includes('critical')) urgencyClass = 'bg-red-200';
              else if (urgencies.includes('warning')) urgencyClass = 'bg-yellow-200';
              else urgencyClass = 'bg-green-200';
            }

            if (dateEvents.interviews.length > 0 && !urgencyClass) {
              urgencyClass = 'bg-purple-100 border-purple-300';
            }

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(date)}
                className={`
                  aspect-square p-2 rounded-lg border-2 transition-all
                  ${urgencyClass || 'border-gray-200'}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                  ${isSelected ? 'ring-2 ring-[var(--primary-color)]' : ''}
                `}
              >
                <div className="flex flex-col h-full">
                  <span className="text-sm font-medium">{day}</span>

                  {(dateEvents.deadlines.length > 0 || dateEvents.interviews.length > 0) && (
                    <div className="text-xs font-bold mt-auto flex flex-col gap-0.5">
                      {dateEvents.deadlines.length > 0 && <span>📄 {dateEvents.deadlines.length}</span>}
                      {dateEvents.interviews.length > 0 && <span>📅 {dateEvents.interviews.length}</span>}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Details */}
      {selectedDate && (
        (() => {
          const events = selectedDateEvents;
          return (events.deadlines.length || events.interviews.length) ? (
            <div className="page-card p-6">
              <h3 className="text-lg font-semibold mb-4">
                Events on {selectedDate.toLocaleDateString()}
              </h3>

              {/* Interviews */}
              {events.interviews.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-medium mb-2 text-purple-700">Interviews</h4>
                  <div className="space-y-2">
                    {events.interviews.map(interview => (
                      <button
                        key={interview.id}
                        className="w-full text-left p-3 border border-purple-200 rounded-lg bg-purple-50 hover:bg-purple-100 transition"
                        onClick={() => openInterviewPrep(interview)}
                        
                      >
                        <div className="font-medium text-gray-900">{interview.title}</div>

                        {interview.job && (
                          <div className="text-xs text-gray-500">
                            {interview.job.title} at {interview.job.company}
                          </div>
                        )}

                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(interview.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {interview.location && ` • ${interview.location}`}
                        </div>

                        <div className="text-xs text-purple-700 mt-2">
                          Click to open interview prep →
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Deadlines */}
              {events.deadlines.length > 0 && (
                <div>
                  <h4 className="text-md font-medium mb-2">Application Deadlines</h4>
                  <div className="space-y-2">
                    {events.deadlines.map(job => (
                      <Link
                        key={job.id}
                        to={`/jobs/${job.id}`}
                        className="block p-3 rounded bg-gray-50 hover:bg-gray-100 border transition"
                      >
                        <div className="font-medium">{job.title}</div>
                        <div className="text-sm text-gray-600">{job.company}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null;
        })()
      )}

      {/* AI PREP PANEL */}
      <InterviewPrepPanel
        open={!!activeInterview}
        onClose={() => {
          setActiveInterview(null);
          setPrepData(null);
          setPrepError(null);
        }}
        interview={activeInterview}
        prep={prepData}
        loading={prepLoading}
        error={prepError}
      />
    </div>
  );
}