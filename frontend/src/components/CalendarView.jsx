import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import './CalendarView.css';

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const month = currentMonth.getMonth();
      const year = currentMonth.getFullYear();
      const API_URL = (import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com').replace(/\/$/, '');
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/timing-optimizer/calendar?month=${month}&year=${year}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch calendar data');

      const data = await response.json();
      setCalendarData(data.calendar);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Calendar fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthName = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading && !calendarData) {
    return (
      <div className="calendar-loading">
        <div className="spinner"></div>
        <p>Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="calendar-view">
      <div className="calendar-container">
        <div className="calendar-header">
          <h2>📆 Submission Schedule Calendar</h2>
          <p className="calendar-description">
            Track your scheduled application submissions throughout the month
          </p>
        </div>

        {/* Calendar Navigation */}
        <div className="calendar-nav">
          <button className="nav-button" onClick={handlePreviousMonth}>
            <ChevronLeft size={20} />
          </button>

          <div className="month-year">
            <h3>{monthName}</h3>
            <button className="btn-today" onClick={handleToday}>
              Today
            </button>
          </div>

          <button className="nav-button" onClick={handleNextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {/* Week Days Header */}
          <div className="calendar-week-header">
            {weekDays.map(day => (
              <div key={day} className="week-day">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="calendar-days">
            {/* Empty cells for days before the first day of the month */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="calendar-day empty"></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const submissions = calendarData?.calendar?.[day] || [];
              const isToday =
                day === new Date().getDate() &&
                currentMonth.getMonth() === new Date().getMonth() &&
                currentMonth.getFullYear() === new Date().getFullYear();
              const hasSubmissions = submissions.length > 0;

              return (
                <div
                  key={day}
                  className={`calendar-day ${isToday ? 'today' : ''} ${hasSubmissions ? 'has-submissions' : ''}`}
                  onClick={() => hasSubmissions && setSelectedDay(day)}
                >
                  <div className="day-number">{day}</div>

                  {hasSubmissions && (
                    <div className="submissions-preview">
                      <div className="submission-count">{submissions.length}</div>
                      <div className="submission-dots">
                        {submissions.slice(0, 3).map((_, idx) => (
                          <div key={idx} className="dot"></div>
                        ))}
                        {submissions.length > 3 && <span className="more">+{submissions.length - 3}</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-color today"></div>
            <span>Today</span>
          </div>
          <div className="legend-item">
            <div className="legend-color has-submissions"></div>
            <span>Has scheduled submission</span>
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDay && calendarData?.calendar?.[selectedDay] && (
          <SelectedDayDetails
            day={selectedDay}
            month={monthName.split(' ')[0]}
            submissions={calendarData.calendar[selectedDay]}
            onClose={() => setSelectedDay(null)}
          />
        )}

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <p>{error}</p>
            <button onClick={fetchCalendarData}>Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}

function SelectedDayDetails({ day, month, submissions, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            📅 {month} {day} Submissions
          </h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {submissions.length > 0 ? (
            <div className="submissions-list">
              {submissions.map((submission, idx) => (
                <div key={idx} className="submission-item">
                  <div className="submission-time">
                    <div className="time-icon">🕐</div>
                    <div className="time-details">
                      <div className="time">{submission.time}</div>
                      <div className="app-id">Application #{submission.applicationId}</div>
                    </div>
                  </div>
                  <div className="submission-status">
                    <span className={`status-badge ${submission.status}`}>
                      {submission.status === 'scheduled' && '⏳ Scheduled'}
                      {submission.status === 'submitted' && '✓ Submitted'}
                      {submission.status === 'cancelled' && '✕ Cancelled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-submissions">No submissions scheduled for this day</p>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
