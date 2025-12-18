import { useState, useEffect } from 'react';
import { Clock, Edit2, X, CheckCircle, AlertCircle } from 'lucide-react';
import './ApplicationScheduler.css';

export default function ApplicationScheduler() {
  const [schedules, setSchedules] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const API_URL = (import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com').replace(/\/$/, '');
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      const [schedulesRes, upcomingRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/timing-optimizer/schedules`, { headers }),
        fetch(`${API_URL}/timing-optimizer/upcoming`, { headers }),
        fetch(`${API_URL}/timing-optimizer/stats`, { headers }),
      ]);

      if (!schedulesRes.ok || !upcomingRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch schedule data');
      }

      const schedulesData = await schedulesRes.json();
      const upcomingData = await upcomingRes.json();
      const statsData = await statsRes.json();

      setSchedules(schedulesData.schedules || []);
      setUpcoming(upcomingData.upcoming || []);
      setStats(statsData.stats);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Schedule fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (scheduleId) => {
    if (!newTime) return;

    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com').replace(/\/$/, '');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/timing-optimizer/schedule/${scheduleId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newSubmitTime: new Date(newTime).toISOString() }),
      });

      if (!response.ok) throw new Error('Failed to reschedule');

      alert('✓ Submission rescheduled successfully');
      setEditingId(null);
      setNewTime('');
      fetchSchedules();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCancel = async (scheduleId) => {
    if (!confirm('Are you sure you want to cancel this scheduled submission?')) return;

    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com').replace(/\/$/, '');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/timing-optimizer/schedule/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to cancel schedule');

      alert('✓ Scheduled submission cancelled');
      fetchSchedules();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="scheduler-loading">
        <div className="spinner"></div>
        <p>Loading your scheduled submissions...</p>
      </div>
    );
  }

  return (
    <div className="application-scheduler">
      <h2>📅 Application Submission Scheduler</h2>

      {/* Stats Overview */}
      {stats && (
        <div className="scheduler-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.totalScheduled}</div>
            <div className="stat-label">Total Scheduled</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.upcoming}</div>
            <div className="stat-label">Upcoming (7 days)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalSubmitted}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.conversionRate.toFixed(1)}%</div>
            <div className="stat-label">Submission Rate</div>
          </div>
        </div>
      )}

      {/* Upcoming Submissions */}
      <div className="scheduler-section">
        <h3>🔔 Upcoming Submissions (Next 7 Days)</h3>
        {upcoming.length > 0 ? (
          <div className="upcoming-list">
            {upcoming.map(submission => (
              <div key={submission.id} className="upcoming-item">
                <div className="upcoming-time">
                  <Clock size={20} />
                  <div>
                    <div className="time-label">
                      {new Date(submission.scheduledSubmitTime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="time-value">
                      {new Date(submission.scheduledSubmitTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                <div className="upcoming-app-id">Application #{submission.applicationId}</div>
                <div className="upcoming-actions">
                  <button
                    className="btn-edit"
                    onClick={() => {
                      setEditingId(submission.id);
                      setNewTime(new Date(submission.scheduledSubmitTime).toISOString().slice(0, 16));
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancel(submission.id)}
                  >
                    Cancel
                  </button>
                </div>

                {editingId === submission.id && (
                  <div className="edit-form">
                    <input
                      type="datetime-local"
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                    />
                    <button
                      className="btn-save"
                      onClick={() => handleReschedule(submission.id)}
                    >
                      Save
                    </button>
                    <button
                      className="btn-cancel-edit"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No scheduled submissions in the next 7 days</p>
            <p className="hint">Schedule your next application for optimal timing</p>
          </div>
        )}
      </div>

      {/* All Scheduled Submissions */}
      <div className="scheduler-section">
        <h3>📋 All Scheduled Submissions</h3>
        {schedules.length > 0 ? (
          <div className="schedules-table">
            <div className="table-header">
              <div className="col-date">Date & Time</div>
              <div className="col-app">Application</div>
              <div className="col-status">Status</div>
              <div className="col-actions">Actions</div>
            </div>
            {schedules.map(schedule => (
              <div key={schedule.id} className="table-row">
                <div className="col-date">
                  <div className="date-value">
                    {new Date(schedule.scheduledSubmitTime).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: '2-digit',
                    })}
                  </div>
                  <div className="time-value">
                    {new Date(schedule.scheduledSubmitTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div className="col-app">#{schedule.applicationId}</div>
                <div className="col-status">
                  <span className={`status-badge ${schedule.status}`}>
                    {schedule.status === 'scheduled' && '⏳ Scheduled'}
                    {schedule.status === 'submitted' && '✓ Submitted'}
                    {schedule.status === 'cancelled' && '✕ Cancelled'}
                  </span>
                </div>
                <div className="col-actions">
                  {schedule.status === 'scheduled' && (
                    <>
                      <button
                        className="btn-small-edit"
                        onClick={() => {
                          setEditingId(schedule.id);
                          setNewTime(new Date(schedule.scheduledSubmitTime).toISOString().slice(0, 16));
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-small-cancel"
                        onClick={() => handleCancel(schedule.id)}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {schedule.status !== 'scheduled' && (
                    <span className="no-actions">—</span>
                  )}
                </div>

                {editingId === schedule.id && (
                  <div className="table-row-edit">
                    <input
                      type="datetime-local"
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                    />
                    <button
                      className="btn-save"
                      onClick={() => handleReschedule(schedule.id)}
                    >
                      Save
                    </button>
                    <button
                      className="btn-cancel-edit"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No scheduled submissions yet</p>
            <p className="hint">Use the timing recommendation feature to schedule your applications</p>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <p>{error}</p>
          <button onClick={fetchSchedules}>Retry</button>
        </div>
      )}
    </div>
  );
}
