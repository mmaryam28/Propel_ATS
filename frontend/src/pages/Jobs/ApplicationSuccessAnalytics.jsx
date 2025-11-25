import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
} from 'recharts';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

const ApplicationSuccessAnalytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/application-analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Analytics data received:', response.data);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  const renderOverview = () => {
    const overall = data.successRates.overall;
    const score = data.recommendations.overallScore;

    return (
      <div className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-3xl font-bold text-purple-600">{overall.total}</p>
              </div>
              <Icon name="briefcase" className="text-purple-600" size="2xl" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Response Rate</p>
                <p className="text-3xl font-bold text-blue-600">{overall.responseRate}%</p>
              </div>
              <Icon name="mail" className="text-blue-600" size="2xl" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Interview Rate</p>
                <p className="text-3xl font-bold text-green-600">{overall.interviewRate}%</p>
              </div>
              <Icon name="video" className="text-green-600" size="2xl" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offer Rate</p>
                <p className="text-3xl font-bold text-yellow-600">{overall.offerRate}%</p>
              </div>
              <Icon name="trophy" className="text-yellow-600" size="2xl" />
            </div>
          </Card>
        </div>

        {/* Application Score */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Success Score</h3>
          <div className="flex items-center space-x-4">
            <div className="flex-grow">
              <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600">{score}/100</div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {score >= 75
              ? 'Excellent! Your application strategy is highly effective.'
              : score >= 50
              ? 'Good progress! Consider the recommendations below to improve.'
              : 'Room for improvement. Follow the recommendations to boost your success rate.'}
          </p>
        </Card>

        {/* Success by Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Success by Industry</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(data.successRates.byIndustry).map(([name, stats]) => ({
                name,
                responseRate: parseFloat(stats.responseRate),
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="responseRate" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Success by Company Size</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(data.successRates.byCompanySize).map(([name, stats]) => ({
                name,
                responseRate: parseFloat(stats.responseRate),
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="responseRate" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  };

  const renderMethodPerformance = () => {
    const methodData = Object.entries(data.methodPerformance.byMethod).map(([name, stats]) => ({
      name: name || 'Unknown',
      responseRate: parseFloat(stats.responseRate),
      interviewRate: parseFloat(stats.interviewRate),
      total: stats.total,
    }));

    const sourceData = Object.entries(data.methodPerformance.bySource).map(([name, stats]) => ({
      name: name || 'Unknown',
      responseRate: parseFloat(stats.responseRate),
      interviewRate: parseFloat(stats.interviewRate),
      total: stats.total,
    }));

    return (
      <div className="space-y-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Application Method</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={methodData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="responseRate" name="Response Rate %" fill="#8B5CF6" />
              <Bar dataKey="interviewRate" name="Interview Rate %" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Application Source</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={sourceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="responseRate" name="Response Rate %" fill="#10B981" />
              <Bar dataKey="interviewRate" name="Interview Rate %" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  const renderPatterns = () => {
    const { successful, rejected, comparison } = data.patterns;

    return (
      <div className="space-y-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pattern Insights</h3>
          {comparison.length > 0 ? (
            <div className="space-y-2">
              {comparison.map((item, idx) => (
                <div key={idx} className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-purple-900 font-medium">{item.insight}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Not enough data to identify patterns yet.</p>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Successful Applications Pattern</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Total Count</p>
                <p className="text-2xl font-bold text-green-600">{successful.totalCount}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Top Industries</p>
                {successful.topIndustries.length > 0 ? (
                  <ul className="space-y-1">
                    {successful.topIndustries.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-600">
                        {item.industry}: {item.count} applications
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No data</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Top Sources</p>
                {successful.topSources.length > 0 ? (
                  <ul className="space-y-1">
                    {successful.topSources.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-600">
                        {item.source}: {item.count} applications
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No data</p>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rejected Applications Pattern</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Total Count</p>
                <p className="text-2xl font-bold text-red-600">{rejected.totalCount}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Top Industries</p>
                {rejected.topIndustries.length > 0 ? (
                  <ul className="space-y-1">
                    {rejected.topIndustries.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-600">
                        {item.industry}: {item.count} applications
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No data</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Top Sources</p>
                {rejected.topSources.length > 0 ? (
                  <ul className="space-y-1">
                    {rejected.topSources.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-600">
                        {item.source}: {item.count} applications
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No data</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderCustomization = () => {
    const { summary, recommendation } = data.customizationImpact;
    const { statisticalSignificance } = data.materialImpact;

    return (
      <div className="space-y-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customization Impact Summary</h3>
          <p className="text-lg text-purple-900 mb-4 p-4 bg-purple-50 rounded-lg">{recommendation}</p>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Statistical Confidence</p>
            <p className="text-lg font-semibold text-gray-900">{statisticalSignificance.confidence}</p>
            {statisticalSignificance.p_value && (
              <p className="text-xs text-gray-600 mt-1">
                p-value: {statisticalSignificance.p_value} | z-score: {statisticalSignificance.z_score}
              </p>
            )}
            {statisticalSignificance.reason && (
              <p className="text-xs text-gray-600 mt-1">{statisticalSignificance.reason}</p>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume Customization</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Customized Resumes</p>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-2xl font-bold text-purple-600">
                    {summary.resumeCustomization.customized.responseRate}%
                  </p>
                  <p className="text-sm text-gray-600">
                    ({summary.resumeCustomization.customized.total} applications)
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Standard Resumes</p>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-2xl font-bold text-gray-600">
                    {summary.resumeCustomization.standard.responseRate}%
                  </p>
                  <p className="text-sm text-gray-600">
                    ({summary.resumeCustomization.standard.total} applications)
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-700">Impact</p>
                <p
                  className={`text-xl font-bold ${
                    summary.resumeCustomization.improvement.improvement === 'positive'
                      ? 'text-green-600'
                      : summary.resumeCustomization.improvement.improvement === 'negative'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {summary.resumeCustomization.improvement.responseRateDiff > 0 ? '+' : ''}
                  {summary.resumeCustomization.improvement.responseRateDiff}%
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cover Letter Customization</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Customized Cover Letters</p>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-2xl font-bold text-purple-600">
                    {summary.coverLetterCustomization.customized.responseRate}%
                  </p>
                  <p className="text-sm text-gray-600">
                    ({summary.coverLetterCustomization.customized.total} applications)
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Standard Cover Letters</p>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-2xl font-bold text-gray-600">
                    {summary.coverLetterCustomization.standard.responseRate}%
                  </p>
                  <p className="text-sm text-gray-600">
                    ({summary.coverLetterCustomization.standard.total} applications)
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-700">Impact</p>
                <p
                  className={`text-xl font-bold ${
                    summary.coverLetterCustomization.improvement.improvement === 'positive'
                      ? 'text-green-600'
                      : summary.coverLetterCustomization.improvement.improvement === 'negative'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {summary.coverLetterCustomization.improvement.responseRateDiff > 0 ? '+' : ''}
                  {summary.coverLetterCustomization.improvement.responseRateDiff}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fully Customized Applications</h3>
          <p className="text-sm text-gray-600 mb-4">
            Applications with both customized resume and cover letter
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Response Rate</p>
              <p className="text-2xl font-bold text-purple-600">{summary.bothCustomized.responseRate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Interview Rate</p>
              <p className="text-2xl font-bold text-blue-600">{summary.bothCustomized.interviewRate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Count</p>
              <p className="text-2xl font-bold text-gray-600">{summary.bothCustomized.total}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderTiming = () => {
    const dayData = Object.entries(data.timingPatterns.byDayOfWeek)
      .filter(([, stats]) => stats.total > 0)
      .map(([name, stats]) => ({
        name,
        responseRate: parseFloat(stats.responseRate),
        total: stats.total,
      }));

    const timeData = Object.entries(data.timingPatterns.byTimeOfDay)
      .filter(([, stats]) => stats.total > 0)
      .map(([name, stats]) => ({
        name,
        responseRate: parseFloat(stats.responseRate),
        total: stats.total,
      }));

    return (
      <div className="space-y-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimal Application Timing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.timingPatterns.optimalTiming.bestDay && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-1">Best Day to Apply</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.timingPatterns.optimalTiming.bestDay.day}
                </p>
                <p className="text-sm text-gray-600">
                  {data.timingPatterns.optimalTiming.bestDay.responseRate}% response rate
                </p>
              </div>
            )}
            {data.timingPatterns.optimalTiming.bestTimeSlot && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-1">Best Time to Apply</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.timingPatterns.optimalTiming.bestTimeSlot.slot}
                </p>
                <p className="text-sm text-gray-600">
                  {data.timingPatterns.optimalTiming.bestTimeSlot.responseRate}% response rate
                </p>
              </div>
            )}
          </div>
        </Card>

        {dayData.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Rate by Day of Week</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="responseRate" name="Response Rate %" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {timeData.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Rate by Time of Day</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="responseRate" name="Response Rate %" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    );
  };

  const renderRecommendations = () => {
    const { recommendations } = data.recommendations;
    const highPriority = recommendations.filter((r) => r.priority === 'high');
    const mediumPriority = recommendations.filter((r) => r.priority === 'medium');
    const lowPriority = recommendations.filter((r) => r.priority === 'low');

    const renderRecommendationCard = (rec) => (
      <Card key={rec.category}>
        <div className="flex items-start space-x-3">
          <div
            className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
              rec.priority === 'high'
                ? 'bg-red-500'
                : rec.priority === 'medium'
                ? 'bg-yellow-500'
                : 'bg-blue-500'
            }`}
          />
          <div className="flex-grow">
            <h4 className="font-semibold text-gray-900">{rec.category}</h4>
            <p className="text-gray-700 mt-1">{rec.recommendation}</p>
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Action Items:</p>
              <ul className="list-disc list-inside space-y-1">
                {rec.actionItems.map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-600">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>
    );

    return (
      <div className="space-y-6">
        {highPriority.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              High Priority Recommendations
            </h3>
            <div className="space-y-4">{highPriority.map(renderRecommendationCard)}</div>
          </div>
        )}

        {mediumPriority.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
              Medium Priority Recommendations
            </h3>
            <div className="space-y-4">{mediumPriority.map(renderRecommendationCard)}</div>
          </div>
        )}

        {lowPriority.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              Low Priority Recommendations
            </h3>
            <div className="space-y-4">{lowPriority.map(renderRecommendationCard)}</div>
          </div>
        )}

        {recommendations.length === 0 && (
          <Card>
            <p className="text-gray-600">
              Not enough data yet to generate recommendations. Keep tracking your applications!
            </p>
          </Card>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'chart-bar' },
    { id: 'methods', label: 'Application Methods', icon: 'paper-plane' },
    { id: 'patterns', label: 'Success Patterns', icon: 'lightbulb' },
    { id: 'customization', label: 'Material Impact', icon: 'file-text' },
    { id: 'timing', label: 'Timing Analysis', icon: 'clock' },
    { id: 'recommendations', label: 'Recommendations', icon: 'star' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Application Success Analytics</h1>
        <p className="text-gray-600 mt-2">
          Analyze your application patterns and identify strategies for improvement
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon name={tab.icon} size="sm" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'methods' && renderMethodPerformance()}
        {activeTab === 'patterns' && renderPatterns()}
        {activeTab === 'customization' && renderCustomization()}
        {activeTab === 'timing' && renderTiming()}
        {activeTab === 'recommendations' && renderRecommendations()}
      </div>
    </div>
  );
};

export default ApplicationSuccessAnalytics;
