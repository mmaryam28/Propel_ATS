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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
const STATUS_COLORS = {
  not_started: '#9ca3af',
  in_progress: '#3b82f6',
  completed: '#10b981',
  abandoned: '#ef4444',
};

export default function GoalsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [goals, setGoals] = useState([]);
  const [achievementData, setAchievementData] = useState(null);
  const [impactData, setImpactData] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTimeframe, setFilterTimeframe] = useState('all');

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterCategory, filterTimeframe]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterCategory !== 'all') params.category = filterCategory;
      if (filterTimeframe !== 'all') params.timeframe = filterTimeframe;

      const [goalsRes, achievementRes, impactRes, insightsRes] = await Promise.all([
        axios.get(`${API_BASE}/goals`, { headers, params }),
        axios.get(`${API_BASE}/goals/analytics/achievement`, { headers }),
        axios.get(`${API_BASE}/goals/analytics/impact`, { headers }),
        axios.get(`${API_BASE}/goals/analytics/insights`, { headers }),
      ]);

      setGoals(goalsRes.data);
      setAchievementData(achievementRes.data);
      setImpactData(impactRes.data);
      setInsightsData(insightsRes.data);
    } catch (error) {
      console.error('Error fetching goals data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (goalId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE}/goals/${goalId}/recommendations`, { headers });
      setRecommendations(res.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleUpdateProgress = async (goalId, newProgress) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API_BASE}/goals/${goalId}`, { progress: newProgress }, { headers });
      fetchData();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleCompleteMilestone = async (goalId, milestoneId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.put(
        `${API_BASE}/goals/${goalId}/milestones/${milestoneId}/complete`,
        {},
        { headers }
      );
      alert(res.data.celebration.message);
      fetchData();
    } catch (error) {
      console.error('Error completing milestone:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-900">Loading goals data...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'BarChart' },
    { id: 'active', label: 'Active Goals', icon: 'Target' },
    { id: 'achievement', label: 'Achievement Analytics', icon: 'TrendingUp' },
    { id: 'impact', label: 'Job Search Impact', icon: 'Briefcase' },
    { id: 'insights', label: 'Insights & Tips', icon: 'Lightbulb' },
    { id: 'recommendations', label: 'Recommendations', icon: 'MessageSquare' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Goal Setting & Achievement Tracking</h1>
        <p className="text-gray-600">
          Set SMART goals, track progress, and optimize your job search strategy
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          <Icon name="Plus" className="inline mr-2" size={20} />
          Create New Goal
        </button>
        <button
          onClick={fetchData}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
        >
          <Icon name="RefreshCw" className="inline mr-2" size={20} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All</option>
              <option value="job_search">Job Search</option>
              <option value="skill_development">Skill Development</option>
              <option value="networking">Networking</option>
              <option value="career_advancement">Career Advancement</option>
              <option value="interview_preparation">Interview Preparation</option>
              <option value="salary_negotiation">Salary Negotiation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
            <select
              value={filterTimeframe}
              onChange={(e) => setFilterTimeframe(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All</option>
              <option value="short_term">Short-term (&lt;3 months)</option>
              <option value="long_term">Long-term (&gt;3 months)</option>
            </select>
          </div>
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
      {activeTab === 'overview' && achievementData && (
        <OverviewTab goals={goals} achievementData={achievementData} />
      )}

      {activeTab === 'active' && (
        <ActiveGoalsTab
          goals={goals.filter((g) => g.status === 'in_progress' || g.status === 'not_started')}
          onUpdateProgress={handleUpdateProgress}
          onCompleteMilestone={handleCompleteMilestone}
          onSelectGoal={(goal) => {
            setSelectedGoal(goal);
            fetchRecommendations(goal.id);
            setActiveTab('recommendations');
          }}
        />
      )}

      {activeTab === 'achievement' && achievementData && (
        <AchievementTab achievementData={achievementData} />
      )}

      {activeTab === 'impact' && impactData && <ImpactTab impactData={impactData} />}

      {activeTab === 'insights' && insightsData && <InsightsTab insightsData={insightsData} />}

      {activeTab === 'recommendations' && selectedGoal && recommendations && (
        <RecommendationsTab goal={selectedGoal} recommendations={recommendations} />
      )}

      {activeTab === 'recommendations' && !selectedGoal && (
        <Card className="p-8 text-center">
          <Icon name="MessageSquare" size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Select a goal from the Active Goals tab to see recommendations</p>
        </Card>
      )}

      {/* Create Goal Modal would go here */}
      {showCreateModal && (
        <CreateGoalModal onClose={() => setShowCreateModal(false)} onSuccess={fetchData} />
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ goals, achievementData }) {
  const statusData = [
    { name: 'Completed', value: achievementData.summary.completedGoals, color: STATUS_COLORS.completed },
    { name: 'In Progress', value: achievementData.summary.inProgressGoals, color: STATUS_COLORS.in_progress },
    { name: 'Not Started', value: achievementData.summary.notStartedGoals, color: STATUS_COLORS.not_started },
    { name: 'Abandoned', value: achievementData.summary.abandonedGoals, color: STATUS_COLORS.abandoned },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-3xl font-bold text-blue-600">{achievementData.summary.totalGoals}</div>
          <div className="text-sm text-gray-600 mt-1">Total Goals</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold text-green-600">
            {achievementData.summary.overallAchievementRate}%
          </div>
          <div className="text-sm text-gray-600 mt-1">Achievement Rate</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold text-orange-600">
            {achievementData.summary.inProgressGoals}
          </div>
          <div className="text-sm text-gray-600 mt-1">Active Goals</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold text-purple-600">
            {achievementData.summary.avgDaysToCompletion}
          </div>
          <div className="text-sm text-gray-600 mt-1">Avg Days to Complete</div>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Goal Status Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Category Performance */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Achievement Rate by Category</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={achievementData.categoryAnalysis}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
            <YAxis label={{ value: 'Achievement Rate (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="achievementRate" fill="#3b82f6" name="Achievement Rate (%)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// Active Goals Tab Component
function ActiveGoalsTab({ goals, onUpdateProgress, onCompleteMilestone, onSelectGoal }) {
  return (
    <div className="space-y-4">
      {goals.length === 0 && (
        <Card className="p-8 text-center">
          <Icon name="Target" size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No active goals. Create your first goal to get started!</p>
        </Card>
      )}

      {goals.map((goal) => (
        <Card key={goal.id} className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-gray-900">{goal.title}</h3>
                <span
                  className="px-2 py-1 text-xs font-semibold rounded"
                  style={{
                    backgroundColor: `${PRIORITY_COLORS[goal.priority]}20`,
                    color: PRIORITY_COLORS[goal.priority],
                  }}
                >
                  {goal.priority}
                </span>
                <span
                  className="px-2 py-1 text-xs font-semibold rounded"
                  style={{
                    backgroundColor: `${STATUS_COLORS[goal.status]}20`,
                    color: STATUS_COLORS[goal.status],
                  }}
                >
                  {goal.status.replace('_', ' ')}
                </span>
              </div>
              {goal.description && <p className="text-gray-600 mb-2">{goal.description}</p>}
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Category: {goal.category.replace('_', ' ')}</span>
                <span>
                  Target: {goal.target} {goal.unit}
                </span>
                <span>Due: {new Date(goal.target_date).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              onClick={() => onSelectGoal(goal)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              View Details
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">
                Progress: {goal.progress} / {goal.target} {goal.unit}
              </span>
              <span className="font-semibold text-gray-900">{goal.progress_percentage?.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(goal.progress_percentage || 0, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Milestones */}
          {goal.goal_milestones && goal.goal_milestones.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Milestones:</h4>
              <div className="space-y-2">
                {goal.goal_milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={milestone.completed}
                      onChange={() => !milestone.completed && onCompleteMilestone(goal.id, milestone.id)}
                      className="w-4 h-4"
                    />
                    <span className={milestone.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                      {milestone.title} ({milestone.target_value} {goal.unit} by{' '}
                      {new Date(milestone.target_date).toLocaleDateString()})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Progress Update */}
          <div className="mt-4 flex gap-2">
            <input
              type="number"
              placeholder="Update progress"
              className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onUpdateProgress(goal.id, parseFloat(e.target.value));
                  e.target.value = '';
                }
              }}
            />
            <button
              onClick={(e) => {
                const input = e.target.previousSibling;
                onUpdateProgress(goal.id, parseFloat(input.value));
                input.value = '';
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Update
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Achievement Tab Component
function AchievementTab({ achievementData }) {
  const priorityData = Object.entries(achievementData.priorityBreakdown).map(([priority, data]) => ({
    priority: priority.charAt(0).toUpperCase() + priority.slice(1),
    completed: data.completed,
    total: data.total,
    avgProgress: data.avgProgress.toFixed(1),
  }));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Priority Breakdown</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={priorityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="priority" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" fill="#10b981" name="Completed" />
            <Bar dataKey="total" fill="#3b82f6" name="Total" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Category Performance</h2>
        <div className="space-y-4">
          {achievementData.categoryAnalysis.map((cat) => (
            <div key={cat.category} className="border-b pb-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-900">{cat.category.replace('_', ' ')}</span>
                <span className="text-gray-600">
                  {cat.completed} / {cat.total} ({cat.achievementRate.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${cat.achievementRate}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Impact Tab Component
function ImpactTab({ impactData }) {
  const summary = impactData?.summary || { avgApplications: 0, avgInterviews: 0, highImpactCategories: [] };
  const correlations = impactData?.correlations || [];
  const impact = impactData?.impact || [];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Goal Impact Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.avgApplications}</div>
            <div className="text-sm text-gray-600">Avg Applications per Goal Period</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.avgInterviews}</div>
            <div className="text-sm text-gray-600">Avg Interviews per Goal Period</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {summary.highImpactCategories.length}
            </div>
            <div className="text-sm text-gray-600">High-Impact Categories</div>
          </div>
        </div>
      </Card>

      {correlations.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Positive Correlations</h2>
          <div className="space-y-3">
            {correlations.map((corr, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Icon name="TrendingUp" size={20} className="text-green-600 mt-1" />
                <div>
                  <div className="font-semibold text-gray-900">{corr.goal_title}</div>
                  <div className="text-sm text-gray-600">{corr.insight}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Detailed Impact by Goal</h2>
        {impact.length === 0 ? (
          <p className="text-gray-600">No impact data available yet. Create goals and track job applications to see correlations.</p>
        ) : (
          <div className="space-y-4">
            {impact.map((item) => (
            <div key={item.goal_id} className="border-b pb-4">
              <h3 className="font-semibold text-gray-900 mb-2">{item.goal_title}</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Applications</div>
                  <div className="text-lg font-bold text-blue-600">{item.impact_metrics.applications}</div>
                </div>
                <div>
                  <div className="text-gray-600">Interviews</div>
                  <div className="text-lg font-bold text-green-600">{item.impact_metrics.interviews}</div>
                </div>
                <div>
                  <div className="text-gray-600">Response Rate</div>
                  <div className="text-lg font-bold text-orange-600">
                    {item.impact_metrics.response_rate.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Offers</div>
                  <div className="text-lg font-bold text-purple-600">{item.impact_metrics.offers}</div>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// Insights Tab Component
function InsightsTab({ insightsData }) {
  const statistics = insightsData?.statistics || { totalGoals: 0, completionRate: 0, avgGoalDuration: 0, activeGoals: 0 };
  const insights = insightsData?.insights || [];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{statistics.totalGoals}</div>
            <div className="text-sm text-gray-600">Total Goals</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {statistics.completionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{statistics.avgGoalDuration}</div>
            <div className="text-sm text-gray-600">Avg Days to Complete</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{statistics.activeGoals}</div>
            <div className="text-sm text-gray-600">Active Goals</div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Personalized Insights</h2>
        {insights.length === 0 ? (
          <p className="text-gray-600">Create and complete more goals to receive personalized insights and recommendations.</p>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Icon name="Lightbulb" size={24} className="text-blue-600 mt-1" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      {insight.type.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="text-gray-700 mb-2">{insight.message}</div>
                    <div className="text-sm text-gray-600 bg-white p-2 rounded">
                      <strong>Recommendation:</strong> {insight.recommendation}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// Recommendations Tab Component
function RecommendationsTab({ goal, recommendations }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{goal.title}</h2>
        <div className="flex gap-4 text-sm text-gray-600 mb-4">
          <span>Status: {recommendations.current_status.replace('_', ' ')}</span>
          <span>Progress: {recommendations.progress_percentage.toFixed(1)}%</span>
          <span>Time Elapsed: {recommendations.time_elapsed_percentage.toFixed(1)}%</span>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recommendations</h2>
        {recommendations.recommendations.length === 0 && (
          <p className="text-gray-600">You're on track! No recommendations at this time.</p>
        )}
        <div className="space-y-4">
          {recommendations.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg ${
                rec.type === 'urgent_action'
                  ? 'bg-red-50 border border-red-200'
                  : rec.type === 'excellent_momentum'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon
                  name={
                    rec.type === 'urgent_action'
                      ? 'AlertTriangle'
                      : rec.type === 'excellent_momentum'
                      ? 'TrendingUp'
                      : 'Info'
                  }
                  size={24}
                  className={
                    rec.type === 'urgent_action'
                      ? 'text-red-600'
                      : rec.type === 'excellent_momentum'
                      ? 'text-green-600'
                      : 'text-yellow-600'
                  }
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">
                    {rec.type.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className="text-gray-700 mb-2">{rec.message}</div>
                  {rec.action && (
                    <div className="text-sm text-gray-600">
                      <strong>Suggested Action:</strong> {rec.action.replace('_', ' ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Create Goal Modal Component (simplified)
function CreateGoalModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'job_search',
    goal_type: 'applications',
    metric_type: 'count',
    target: '',
    unit: 'applications',
    priority: 'medium',
    start_date: new Date().toISOString().split('T')[0],
    target_date: '',
    why_important: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/goals`, { ...formData, target: parseFloat(formData.target) }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating goal:', error);
      alert(error.response?.data?.message || 'Failed to create goal');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New SMART Goal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="e.g., Submit 50 job applications"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={3}
              placeholder="Describe your goal in detail..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="job_search">Job Search</option>
                <option value="skill_development">Skill Development</option>
                <option value="networking">Networking</option>
                <option value="career_advancement">Career Advancement</option>
                <option value="interview_preparation">Interview Preparation</option>
                <option value="salary_negotiation">Salary Negotiation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Value *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="e.g., 50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="e.g., applications, skills, connections"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Date *</label>
              <input
                type="date"
                required
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Why is this important?</label>
            <textarea
              value={formData.why_important}
              onChange={(e) => setFormData({ ...formData, why_important: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={2}
              placeholder="Your motivation will help you stay focused..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Goal
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
