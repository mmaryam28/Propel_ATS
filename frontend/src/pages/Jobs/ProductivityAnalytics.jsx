import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE;

const ACTIVITY_COLORS = {
  application: '#3b82f6',
  interview_prep: '#10b981',
  networking: '#f59e0b',
  skill_development: '#8b5cf6',
  research: '#ec4899',
  follow_up: '#14b8a6',
  resume_writing: '#f97316',
  cover_letter: '#06b6d4',
};

const ACTIVITY_LABELS = {
  application: 'Applications',
  interview_prep: 'Interview Prep',
  networking: 'Networking',
  skill_development: 'Skill Development',
  research: 'Research',
  follow_up: 'Follow-ups',
  resume_writing: 'Resume Writing',
  cover_letter: 'Cover Letters',
};

export default function ProductivityAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTimer, setShowTimer] = useState(false);
  const [activeTimer, setActiveTimer] = useState(() => {
    return localStorage.getItem('activeTimer');
  });
  const [timerStart, setTimerStart] = useState(() => {
    const stored = localStorage.getItem('timerStart');
    return stored ? new Date(stored) : null;
  });
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  // Update elapsed time every minute
  useEffect(() => {
    if (!timerStart) return;

    const updateElapsed = () => {
      const now = new Date();
      const minutes = Math.round((now - timerStart) / 60000);
      setElapsedMinutes(minutes);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timerStart]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [dashboardRes, entriesRes] = await Promise.all([
        axios.get(`${API_BASE}/productivity/analytics/overview`, { headers }),
        axios.get(`${API_BASE}/productivity/entries`, { headers }),
      ]);

      setDashboard(dashboardRes.data);
      setTimeEntries(entriesRes.data);
    } catch (error) {
      console.error('Error fetching productivity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (activity_type) => {
    const start = new Date();
    setActiveTimer(activity_type);
    setTimerStart(start);
    localStorage.setItem('activeTimer', activity_type);
    localStorage.setItem('timerStart', start.toISOString());
  };

  const stopTimer = async (energy_level, productivity_rating) => {
    if (!activeTimer || !timerStart) return;

    const end = new Date();
    const duration_minutes = Math.round((end - timerStart) / 60000);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/productivity/entries`,
        {
          activity_type: activeTimer,
          duration_minutes,
          start_time: timerStart.toISOString(),
          end_time: end.toISOString(),
          energy_level,
          productivity_rating,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setActiveTimer(null);
      setTimerStart(null);
      setElapsedMinutes(0);
      localStorage.removeItem('activeTimer');
      localStorage.removeItem('timerStart');
      fetchData();
    } catch (error) {
      console.error('Error saving time entry:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-900">Loading productivity data...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'breakdown', label: 'Time Breakdown', icon: 'BarChart' },
    { id: 'patterns', label: 'Productivity Patterns', icon: 'TrendingUp' },
    { id: 'efficiency', label: 'Efficiency Metrics', icon: 'Target' },
    { id: 'burnout', label: 'Burnout Monitor', icon: 'AlertTriangle' },
    { id: 'recommendations', label: 'Recommendations', icon: 'Lightbulb' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Time Investment & Productivity Analysis
        </h1>
        <p className="text-gray-600">
          Track time, optimize productivity, and prevent burnout
        </p>
      </div>

      {/* Quick Timer Widget */}
      <Card className="mb-6 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon name="clock" size="lg" className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Quick Timer</h3>
              <p className="text-sm text-gray-600">
                {activeTimer
                  ? `Tracking: ${ACTIVITY_LABELS[activeTimer]}`
                  : 'Start tracking your activity'}
              </p>
            </div>
          </div>

          {activeTimer ? (
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono font-semibold text-blue-600">
                {elapsedMinutes} min
              </span>
              <button
                onClick={() => setShowTimer(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Stop & Log
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowTimer(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Start Timer
            </button>
          )}
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon name={tab.icon} className="inline mr-2" size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && dashboard && (
        <OverviewTab dashboard={dashboard} />
      )}

      {activeTab === 'breakdown' && dashboard && (
        <TimeBreakdownTab dashboard={dashboard} timeEntries={timeEntries} />
      )}

      {activeTab === 'patterns' && dashboard && (
        <PatternsTab dashboard={dashboard} />
      )}

      {activeTab === 'efficiency' && dashboard && (
        <EfficiencyTab dashboard={dashboard} />
      )}

      {activeTab === 'burnout' && dashboard && (
        <BurnoutTab dashboard={dashboard} />
      )}

      {activeTab === 'recommendations' && dashboard && (
        <RecommendationsTab dashboard={dashboard} />
      )}

      {/* Timer Modal */}
      {showTimer && (
        <TimerModal
          activeTimer={activeTimer}
          onStart={startTimer}
          onStop={stopTimer}
          onClose={() => setShowTimer(false)}
        />
      )}
    </div>
  );
}

// Overview Tab
function OverviewTab({ dashboard }) {
  const { summary, time_breakdown } = dashboard;

  const riskColors = {
    low: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-3xl font-bold text-blue-600">
            {Math.round(summary.total_time_this_week / 60)}h
          </div>
          <div className="text-sm text-gray-600 mt-1">This Week</div>
          <div className="text-xs text-gray-500 mt-1">
            Last week: {Math.round(summary.total_time_last_week / 60)}h
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-3xl font-bold text-green-600">
            {summary.productivity_score}/100
          </div>
          <div className="text-sm text-gray-600 mt-1">Productivity Score</div>
          <div className="text-xs text-gray-500 mt-1">
            Based on ratings
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-3xl font-bold text-orange-600">
            {summary.activities_completed}
          </div>
          <div className="text-sm text-gray-600 mt-1">Activities Logged</div>
          <div className="text-xs text-gray-500 mt-1">
            Avg energy: {summary.avg_energy.toFixed(1)}/5
          </div>
        </Card>

        <Card className="p-6">
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${riskColors[summary.burnout_risk]}`}>
            {summary.burnout_risk.toUpperCase()}
          </div>
          <div className="text-sm text-gray-600 mt-2">Burnout Risk</div>
        </Card>
      </div>

      {/* Time Distribution */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Time Distribution This Week</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={time_breakdown.map(item => ({
                name: ACTIVITY_LABELS[item.activity_type] || item.activity_type,
                value: item.total_minutes,
                percentage: item.percentage,
              }))}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.percentage}%`}
              outerRadius={100}
              dataKey="value"
            >
              {time_breakdown.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={ACTIVITY_COLORS[entry.activity_type] || '#999'} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${Math.round(value / 60)} hours`} />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// Time Breakdown Tab
function TimeBreakdownTab({ dashboard, timeEntries }) {
  const { time_breakdown } = dashboard;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Breakdown</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={time_breakdown.map(item => ({
            activity: ACTIVITY_LABELS[item.activity_type] || item.activity_type,
            hours: Math.round(item.total_minutes / 60 * 10) / 10,
            entries: item.entry_count,
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="activity" angle={-45} textAnchor="end" height={100} />
            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="hours" fill="#3b82f6" name="Hours Spent" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity Log</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {timeEntries.slice(0, 20).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: ACTIVITY_COLORS[entry.activity_type] }}
                ></div>
                <div>
                  <div className="font-medium text-gray-900">
                    {ACTIVITY_LABELS[entry.activity_type]}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(entry.start_time).toLocaleDateString()} at{' '}
                    {new Date(entry.start_time).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{entry.duration_minutes} min</div>
                {entry.energy_level && (
                  <div className="text-xs text-gray-600">Energy: {entry.energy_level}/5</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Patterns Tab
function PatternsTab({ dashboard }) {
  const { productivity_patterns, energy_patterns } = dashboard;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Energy Levels Throughout the Day</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={energy_patterns}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Energy Level', angle: -90, position: 'insideLeft' }} domain={[0, 5]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avg_energy" stroke="#10b981" strokeWidth={2} name="Average Energy" />
            <Line type="monotone" dataKey="productivity_correlation" stroke="#3b82f6" strokeWidth={2} name="Productivity %" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Best Performance Times</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dashboard.optimal_schedule.best_hours.slice(0, 3).map((hour) => (
            <div key={hour} className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {hour}:00 {hour < 12 ? 'AM' : 'PM'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Peak Performance Hour</div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Recommended Schedule:</h3>
          <div className="space-y-2">
            {dashboard.optimal_schedule.recommended_schedule.map((rec, idx) => (
              <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-gray-900">
                  {ACTIVITY_LABELS[rec.activity_type]}: {rec.suggested_time}
                </div>
                <div className="text-sm text-gray-600">{rec.reason}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Efficiency Tab
function EfficiencyTab({ dashboard }) {
  const { efficiency_metrics, roi_analysis } = dashboard;

  const trendColors = {
    improving: 'text-green-600',
    stable: 'text-blue-600',
    declining: 'text-red-600',
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Efficiency Metrics</h2>
        <div className="space-y-4">
          {efficiency_metrics.map((metric) => (
            <div key={metric.activity_type} className="border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <div className="font-semibold text-gray-900">
                  {ACTIVITY_LABELS[metric.activity_type]}
                </div>
                <span className={`text-sm font-medium ${trendColors[metric.trend]}`}>
                  {metric.trend.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Avg Time/Task</div>
                  <div className="font-semibold text-gray-900">{metric.avg_time_per_task} min</div>
                </div>
                <div>
                  <div className="text-gray-600">Completion Rate</div>
                  <div className="font-semibold text-gray-900">{metric.completion_rate}%</div>
                </div>
                <div>
                  <div className="text-gray-600">Productivity</div>
                  <div className="font-semibold text-gray-900">{metric.productivity_score}/100</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">ROI Analysis</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={roi_analysis.map(item => ({
            activity: ACTIVITY_LABELS[item.activity_type],
            roi: item.roi_score,
            outcomes: item.outcomes_generated,
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="activity" angle={-45} textAnchor="end" height={100} />
            <YAxis label={{ value: 'ROI Score', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="roi" fill="#8b5cf6" name="ROI Score" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// Burnout Tab
function BurnoutTab({ dashboard }) {
  const { burnout_indicator } = dashboard;

  const riskColors = {
    low: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
    moderate: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
    high: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
    critical: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
  };

  const colors = riskColors[burnout_indicator.risk_level];

  return (
    <div className="space-y-6">
      <Card className={`p-6 border-2 ${colors.border} ${colors.bg}`}>
        <div className="text-center">
          <div className={`text-5xl font-bold ${colors.text} mb-2`}>
            {burnout_indicator.burnout_score.toFixed(1)}/10
          </div>
          <div className="text-xl font-semibold text-gray-900 mb-1">
            Burnout Risk: {burnout_indicator.risk_level.toUpperCase()}
          </div>
          <div className="text-sm text-gray-600">
            Work-Life Balance Score: {burnout_indicator.work_life_balance_score.toFixed(1)}/10
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Risk Factors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(burnout_indicator.factors).map(([factor, present]) => (
            <div
              key={factor}
              className={`p-4 rounded-lg border-2 ${present ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  name={present ? 'warning' : 'success'}
                  size="sm"
                  className={present ? 'text-red-600' : 'text-green-600'}
                />
                <span className={`font-medium ${present ? 'text-red-900' : 'text-green-900'}`}>
                  {factor.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recommendations</h2>
        <div className="space-y-3">
          {burnout_indicator.recommendations.map((rec, idx) => (
            <div key={idx} className="p-4 bg-blue-50 rounded-lg flex items-start gap-3">
              <Icon name="info" size="sm" className="text-blue-600 mt-1" />
              <div className="text-gray-900">{rec}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Recommendations Tab
function RecommendationsTab({ dashboard }) {
  const { recommendations } = dashboard;

  const priorityColors = {
    high: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
    medium: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
    low: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
  };

  return (
    <div className="space-y-4">
      {recommendations.length === 0 ? (
        <Card className="p-8 text-center">
          <Icon name="success" size={48} className="mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Great work! No critical recommendations at this time.</p>
        </Card>
      ) : (
        recommendations.map((rec, idx) => {
          const colors = priorityColors[rec.priority];
          return (
            <Card key={idx} className={`p-6 border-2 ${colors.border} ${colors.bg}`}>
              <div className="flex items-start gap-4">
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.text}`}>
                  {rec.priority.toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {rec.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </h3>
                  <p className="text-gray-700 mb-3">{rec.message}</p>
                  <div className="p-3 bg-white rounded-lg">
                    <div className="text-sm font-medium text-gray-900 mb-1">Action:</div>
                    <div className="text-sm text-gray-700">{rec.action}</div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Expected Impact:</strong> {rec.expected_impact}
                  </div>
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}

// Timer Modal
function TimerModal({ activeTimer, onStart, onStop, onClose }) {
  const [selectedActivity, setSelectedActivity] = useState(activeTimer || 'application');
  const [energy, setEnergy] = useState(3);
  const [productivity, setProductivity] = useState(3);

  const activities = Object.keys(ACTIVITY_LABELS);

  const handleSubmit = () => {
    if (activeTimer) {
      onStop(energy, productivity);
    } else {
      onStart(selectedActivity);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {activeTimer ? 'Stop Timer & Log Activity' : 'Start New Timer'}
        </h2>

        {!activeTimer && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {activities.map((activity) => (
                <option key={activity} value={activity}>
                  {ACTIVITY_LABELS[activity]}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTimer && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Energy Level: {energy}/5
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((energy - 1) / 4) * 100}%, #e5e7eb ${((energy - 1) / 4) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Productivity Rating: {productivity}/5
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={productivity}
                onChange={(e) => setProductivity(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${((productivity - 1) / 4) * 100}%, #e5e7eb ${((productivity - 1) / 4) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 text-white rounded-lg ${
              activeTimer ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {activeTimer ? 'Stop & Save' : 'Start Timer'}
          </button>
        </div>
      </Card>
    </div>
  );
}
