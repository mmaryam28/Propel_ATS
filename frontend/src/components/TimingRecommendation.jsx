import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Calendar } from 'lucide-react';
import './TimingRecommendation.css';

export default function TimingRecommendation({ applicationId, industry, companySize, applicationQualityScore }) {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    if (applicationId && industry && companySize) {
      fetchRecommendation();
    }
  }, [applicationId, industry, companySize, applicationQualityScore]);

  const fetchRecommendation = async () => {
    try {
      setLoading(true);
      const API_URL = (import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com').replace(/\/$/, '');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/timing-optimizer/recommendation`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          industry,
          companySize,
          applicationQualityScore,
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (!response.ok) throw new Error('Failed to get recommendation');
      const data = await response.json();
      setRecommendation(data.recommendation);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Recommendation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="timing-recommendation-card loading">
        <div className="loading-spinner"></div>
        <p>Analyzing optimal submission timing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="timing-recommendation-card error">
        <AlertCircle size={20} />
        <p>{error}</p>
        <button onClick={fetchRecommendation}>Retry</button>
      </div>
    );
  }

  if (!recommendation) {
    return null;
  }

  const isOptimalNow = recommendation.currentRecommendation.includes('Submit now');
  const hoursUntilOptimal = Math.ceil(recommendation.timeUntilOptimal / 60);

  return (
    <div className={`timing-recommendation-card ${isOptimalNow ? 'optimal' : 'upcoming'}`}>
      <div className="recommendation-header">
        <h3>⏰ Submission Timing Optimizer</h3>
        <span className={`confidence-badge ${recommendation.confidenceLevel > 0.7 ? 'high' : 'medium'}`}>
          {(recommendation.confidenceLevel * 100).toFixed(0)}% Confidence
        </span>
      </div>

      <div className="recommendation-content">
        {/* Current Recommendation */}
        <div className={`current-recommendation ${isOptimalNow ? 'submit-now' : ''}`}>
          {isOptimalNow ? (
            <CheckCircle size={24} className="icon-success" />
          ) : (
            <Clock size={24} className="icon-wait" />
          )}
          <div className="recommendation-text">
            <p className="main-recommendation">{recommendation.currentRecommendation}</p>
            {!isOptimalNow && (
              <p className="time-until-optimal">
                Optimal window in {hoursUntilOptimal} hours
              </p>
            )}
          </div>
        </div>

        {/* Recommended Timing Details */}
        <div className="timing-details">
          <div className="detail-item">
            <strong>Best Day:</strong>
            <span>{recommendation.recommendedDay}</span>
          </div>
          <div className="detail-item">
            <strong>Best Time:</strong>
            <span>{recommendation.recommendedTimeRange}</span>
          </div>
          <div className="detail-item">
            <strong>Expected Impact:</strong>
            <span className="impact-positive">
              +{recommendation.estimatedImprovementRate.toFixed(0)}% response rate
            </span>
          </div>
          <div className="detail-item">
            <strong>Your Success Rate:</strong>
            <span>{recommendation.historicalSuccessRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* Reasoning */}
        <div className="reasoning-section">
          <h4>💡 Why This Timing?</h4>
          <p>{recommendation.reasoning}</p>
        </div>

        {/* Warnings */}
        {recommendation.warnings && recommendation.warnings.length > 0 && (
          <div className="warnings-section">
            <h4>⚠️ Warnings to Consider</h4>
            <ul className="warnings-list">
              {recommendation.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="recommendation-actions">
          {isOptimalNow && (
            <button className="btn-submit-now">
              ✓ Submit Now
            </button>
          )}
          {!isOptimalNow && (
            <button
              className="btn-schedule"
              onClick={() => setShowScheduleModal(true)}
            >
              📅 Schedule for {recommendation.recommendedDay}
            </button>
          )}
          <button className="btn-dismiss">Dismiss</button>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleSubmissionModal
          applicationId={applicationId}
          recommendedDay={recommendation.recommendedDay}
          recommendedTime={recommendation.recommendedTimeRange}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
}

function ScheduleSubmissionModal({ applicationId, recommendedDay, recommendedTime, onClose }) {
  const [submitting, setSubmitting] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [sendReminder, setSendReminder] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState(30);

  const handleSchedule = async () => {
    try {
      setSubmitting(true);
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const API_URL = (import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com').replace(/\/$/, '');
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/timing-optimizer/schedule`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          applicationId,
          scheduledSubmitTime: scheduledDateTime.toISOString(),
          sendReminder,
          reminderMinutesBefore: reminderMinutes,
          schedulingReason: `Scheduled for optimal timing: ${recommendedDay} ${recommendedTime}`,
        }),
      });

      if (!response.ok) throw new Error('Failed to schedule submission');

      const data = await response.json();
      alert(`✓ Application scheduled for ${scheduledDate} at ${scheduledTime}`);
      onClose();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Schedule Application Submission</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Select Date</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              required
            />
            <small>Recommended: {recommendedDay}</small>
          </div>

          <div className="form-group">
            <label>Select Time</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
              required
            />
            <small>Recommended: {recommendedTime}</small>
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="sendReminder"
              checked={sendReminder}
              onChange={e => setSendReminder(e.target.checked)}
            />
            <label htmlFor="sendReminder">Send reminder before submission</label>
          </div>

          {sendReminder && (
            <div className="form-group">
              <label>Remind me</label>
              <select value={reminderMinutes} onChange={e => setReminderMinutes(Number(e.target.value))}>
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
                <option value={1440}>1 day before</option>
              </select>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSchedule}
            disabled={submitting || !scheduledDate}
          >
            {submitting ? 'Scheduling...' : 'Schedule Submission'}
          </button>
        </div>
      </div>
    </div>
  );
}
