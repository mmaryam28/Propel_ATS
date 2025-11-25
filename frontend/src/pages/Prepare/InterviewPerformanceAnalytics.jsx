import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const InterviewPerformanceAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const userId = localStorage.getItem('userId') || 'demo-user';

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:3000/interview/analytics/dashboard`, {
        params: { userId },
      });
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please ensure you have logged interview data.');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'trends', label: 'Performance Trends', icon: 'trending-up' },
    { id: 'formats', label: 'Format Analysis', icon: 'list' },
    { id: 'companies', label: 'Company Types', icon: 'building' },
    { id: 'skills', label: 'Skills Analysis', icon: 'star' },
    { id: 'recommendations', label: 'Recommendations', icon: 'lightbulb' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Card.Body>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {analytics.conversionRates.totalInterviews}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Interviews</div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {analytics.conversionRates.conversionRate}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Conversion Rate</div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {analytics.conversionRates.offersReceived}
              </div>
              <div className="text-sm text-gray-600 mt-1">Offers Received</div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {analytics.recommendations.overallScore}
              </div>
              <div className="text-sm text-gray-600 mt-1">Performance Score</div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Industry Benchmark Comparison */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Icon name="trending-up" size="sm" />
            Industry Benchmark Comparison
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-2">Conversion Rate</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full"
                    style={{
                      width: `${Math.min(
                        (analytics.industryBenchmarks.userStats.conversionRate / 30) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">
                  {analytics.industryBenchmarks.userStats.conversionRate}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Industry avg: {analytics.industryBenchmarks.industryBenchmarks.avgConversionRate}% 
                ({analytics.industryBenchmarks.comparison.conversionRate})
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Acceptance Rate</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-600 h-4 rounded-full"
                    style={{
                      width: `${analytics.industryBenchmarks.userStats.acceptanceRate}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">
                  {analytics.industryBenchmarks.userStats.acceptanceRate}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Industry avg: {analytics.industryBenchmarks.industryBenchmarks.avgAcceptanceRate}% 
                ({analytics.industryBenchmarks.comparison.acceptanceRate})
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Avg Prep Time</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-purple-600 h-4 rounded-full"
                    style={{
                      width: `${Math.min(
                        (analytics.industryBenchmarks.userStats.avgPrepTime / 20) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">
                  {analytics.industryBenchmarks.userStats.avgPrepTime}h
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Industry avg: {analytics.industryBenchmarks.industryBenchmarks.avgPrepTime}h 
                ({analytics.industryBenchmarks.comparison.prepTime})
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Quick Insights */}
      <Card>
        <Card.Header>
          <Card.Title>Quick Insights</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-900">Optimal Prep Time</div>
              <div className="text-2xl font-bold text-blue-700 mt-1">
                {analytics.optimalStrategies.optimalPrepTime}h
              </div>
              <div className="text-sm text-blue-600 mt-1">
                Average for successful interviews
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="font-medium text-green-900">Practice Impact</div>
              <div className="text-2xl font-bold text-green-700 mt-1">
                {analytics.optimalStrategies.practiceSessionImpact}%
              </div>
              <div className="text-sm text-green-600 mt-1">
                Success rate with practice sessions
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-6">
      <Card>
        <Card.Header>
          <Card.Title>Performance Over Time</Card.Title>
        </Card.Header>
        <Card.Body>
          {analytics.improvementTrends.monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.improvementTrends.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="successRate"
                  stroke="#3B82F6"
                  name="Success Rate (%)"
                />
                <Line
                  type="monotone"
                  dataKey="avgRating"
                  stroke="#10B981"
                  name="Avg Rating"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No trend data available yet. Log more interviews to see trends.
            </div>
          )}
        </Card.Body>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Monthly Interview Count</Card.Title>
          </Card.Header>
          <Card.Body>
            {analytics.improvementTrends.monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.improvementTrends.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="interviews" fill="#3B82F6" name="Interviews" />
                  <Bar dataKey="offers" fill="#10B981" name="Offers" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 py-8">No data available</div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Practice Session Impact</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">
                  {analytics.improvementTrends.totalPracticeSessions}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Practice Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">
                  {analytics.improvementTrends.avgPracticeScore}
                </div>
                <div className="text-sm text-gray-600 mt-1">Average Practice Score</div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );

  const renderFormats = () => {
    const formatData = Object.entries(analytics.formatPerformance).map(([format, data]) => ({
      format,
      ...data,
    }));

    return (
      <div className="space-y-6">
        <Card>
          <Card.Header>
            <Card.Title>Performance by Interview Format</Card.Title>
          </Card.Header>
          <Card.Body>
            {formatData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="format" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#3B82F6" name="Total" />
                  <Bar dataKey="passed" fill="#10B981" name="Passed" />
                  <Bar dataKey="offers" fill="#F59E0B" name="Offers" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No interview data available. Start logging your interviews!
              </div>
            )}
          </Card.Body>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {formatData.map((format, index) => (
            <Card key={format.format}>
              <Card.Body>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <h3 className="font-semibold text-gray-900">{format.format}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Interviews:</span>
                    <span className="font-medium">{format.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-medium text-green-600">{format.successRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Offer Rate:</span>
                    <span className="font-medium text-blue-600">{format.offerRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Rating:</span>
                    <span className="font-medium text-orange-600">{format.avgRating}/5</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderCompanies = () => {
    const companyData = Object.entries(analytics.companyTypePerformance).map(([type, data]) => ({
      type,
      ...data,
    }));

    return (
      <div className="space-y-6">
        <Card>
          <Card.Header>
            <Card.Title>Performance by Company Type</Card.Title>
          </Card.Header>
          <Card.Body>
            {companyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={companyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#3B82F6" name="Total Interviews" />
                  <Bar dataKey="offers" fill="#10B981" name="Offers" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No company type data available
              </div>
            )}
          </Card.Body>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companyData.map((company, index) => (
            <Card key={company.type}>
              <Card.Body>
                <div className="flex items-center gap-3 mb-3">
                  <Icon name="building" size="sm" />
                  <h3 className="font-semibold text-gray-900">{company.type}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Interviews:</span>
                    <span className="font-medium">{company.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-medium text-green-600">{company.successRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Rating:</span>
                    <span className="font-medium text-orange-600">{company.avgRating}/5</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderSkills = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2 text-green-700">
              <Icon name="check-circle" size="sm" />
              Top Strengths
            </Card.Title>
          </Card.Header>
          <Card.Body>
            {analytics.strengthsWeaknesses.strengths.length > 0 ? (
              <div className="space-y-3">
                {analytics.strengthsWeaknesses.strengths.map((strength, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="text-gray-800">{strength.area}</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {strength.count}x
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No strengths data available. Rate your interviews to track strengths.
              </div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2 text-red-700">
              <Icon name="alert-circle" size="sm" />
              Areas for Improvement
            </Card.Title>
          </Card.Header>
          <Card.Body>
            {analytics.strengthsWeaknesses.weaknesses.length > 0 ? (
              <div className="space-y-3">
                {analytics.strengthsWeaknesses.weaknesses.map((weakness, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="text-gray-800">{weakness.area}</span>
                    </div>
                    <span className="text-sm font-medium text-red-600">{weakness.count}x</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No weaknesses data available. Rate your interviews to track areas for improvement.
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-6">
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Icon name="lightbulb" size="sm" />
            Personalized Recommendations
          </Card.Title>
        </Card.Header>
        <Card.Body>
          {analytics.recommendations.recommendations.length > 0 ? (
            <div className="space-y-4">
              {analytics.recommendations.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    rec.priority === 'high'
                      ? 'bg-red-50 border-red-500'
                      : rec.priority === 'medium'
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 px-2 py-1 text-xs font-bold rounded ${
                        rec.priority === 'high'
                          ? 'bg-red-200 text-red-800'
                          : rec.priority === 'medium'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-blue-200 text-blue-800'
                      }`}
                    >
                      {rec.priority.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{rec.category}</h4>
                      <p className="text-gray-700 text-sm mb-2">{rec.recommendation}</p>
                      <div className="mt-3">
                        <div className="text-xs font-semibold text-gray-600 mb-1">
                          Action Items:
                        </div>
                        <ul className="space-y-1">
                          {rec.actionItems.map((action, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                              <span className="text-green-600 mt-0.5">✓</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Log more interview data to receive personalized recommendations
            </div>
          )}
        </Card.Body>
      </Card>

      {analytics.recommendations.nextSteps.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>Next Steps</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="space-y-2">
              {analytics.recommendations.nextSteps.map((step, index) => (
                <label key={index} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-sm text-gray-700">{step}</span>
                </label>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interview Performance Analytics</h1>
          <p className="text-gray-600 mt-1">
            Track your progress and optimize your interview strategy
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Icon name="refresh" size="sm" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon name={tab.icon} size="sm" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'trends' && renderTrends()}
        {activeTab === 'formats' && renderFormats()}
        {activeTab === 'companies' && renderCompanies()}
        {activeTab === 'skills' && renderSkills()}
        {activeTab === 'recommendations' && renderRecommendations()}
      </div>
    </div>
  );
};

export default InterviewPerformanceAnalytics;
