import { useState, useEffect } from 'react';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
} from 'recharts';
import * as api from '../../lib/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function SuccessPatterns() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predictionInput, setPredictionInput] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [jobsList, setJobsList] = useState([]);
  
  // A/B Testing state
  const [abExperiments, setAbExperiments] = useState([]);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [abDashboardData, setAbDashboardData] = useState(null);
  const [abLoading, setAbLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  
  // Version selection state for Add Variant modal
  const [resumeVersions, setResumeVersions] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: 'ChartBarIcon' },
    { id: 'applications', name: 'Applications', icon: 'DocumentTextIcon' },
    { id: 'preparation', name: 'Preparation', icon: 'AcademicCapIcon' },
    { id: 'timing', name: 'Timing', icon: 'ClockIcon' },
    { id: 'strategies', name: 'Strategies', icon: 'LightBulbIcon' },
    { id: 'factors', name: 'Success Factors', icon: 'StarIcon' },
    { id: 'predictions', name: 'Predictions', icon: 'SparklesIcon' },
    { id: 'evolution', name: 'Evolution', icon: 'TrendingUpIcon' },
    { id: 'abtesting', name: 'A/B Testing', icon: 'BeakerIcon' },
  ];

  useEffect(() => {
    fetchDashboard();
    fetchJobs();
  }, []);

  useEffect(() => {
    if (activeTab === 'abtesting') {
      fetchAbExperiments();
    }
  }, [activeTab]);

  // Fetch resume versions and cover letters when Add Variant modal opens
  useEffect(() => {
    if (showAddVariantModal) {
      fetchVersionsData();
    }
  }, [showAddVariantModal]);

  const fetchVersionsData = async () => {
    setVersionsLoading(true);
    try {
      const [resumes, letters] = await Promise.all([
        api.getResumeVersions(),
        api.getCoverLetters()
      ]);
      setResumeVersions(resumes);
      setCoverLetters(letters);
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setVersionsLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/patterns/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setDashboardData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patterns:', error);
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/jobs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
      const data = await response.json();
      setJobsList(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const getPrediction = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/patterns/predictive-model${
          predictionInput ? `?opportunityId=${predictionInput}` : ''
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setPrediction(data);
    } catch (error) {
      console.error('Error getting prediction:', error);
    }
  };

  // A/B Testing functions
  const fetchAbExperiments = async () => {
    try {
      setAbLoading(true);
      const data = await api.getExperiments();
      setAbExperiments(data);
      if (data.length > 0 && !selectedExperiment) {
        setSelectedExperiment(data[0]);
        fetchAbDashboard(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching experiments:', error);
    } finally {
      setAbLoading(false);
    }
  };

  const fetchAbDashboard = async (experimentId) => {
    try {
      const data = await api.getExperimentDashboard(experimentId);
      setAbDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const handleCreateExperiment = async (experimentData) => {
    try {
      await api.createExperiment(experimentData);
      setShowCreateModal(false);
      fetchAbExperiments();
    } catch (error) {
      console.error('Error creating experiment:', error);
    }
  };

  const handleAddVariant = async (variantData) => {
    try {
      await api.addVariant(selectedExperiment.id, variantData);
      setShowAddVariantModal(false);
      fetchAbDashboard(selectedExperiment.id);
    } catch (error) {
      console.error('Error adding variant:', error);
    }
  };

  const handleArchiveVariant = async (variantId) => {
    if (window.confirm('Are you sure you want to archive this variant?')) {
      try {
        await api.archiveVariant(variantId);
        fetchAbDashboard(selectedExperiment.id);
      } catch (error) {
        console.error('Error archiving variant:', error);
      }
    }
  };

  const handleUpdateStatus = async (experimentId, status) => {
    try {
      await api.updateExperimentStatus(experimentId, status);
      fetchAbExperiments();
      if (selectedExperiment?.id === experimentId) {
        fetchAbDashboard(experimentId);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCalculateResults = async (experimentId) => {
    try {
      await api.calculateResults(experimentId);
      fetchAbDashboard(experimentId);
    } catch (error) {
      console.error('Error calculating results:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if we have any data at all
  const hasData =
    dashboardData &&
    dashboardData.application_patterns &&
    dashboardData.application_patterns.total_applications > 0;

  if (!hasData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Success Pattern Recognition</h1>
          <p className="text-gray-600 mt-2">
            Understand what strategies lead to your best outcomes
          </p>
        </div>

        <Card>
          <Card.Body>
            <div className="text-center py-12">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No Application Data Yet
              </h3>
              <p className="mt-2 text-gray-600 max-w-md mx-auto">
                Start tracking your job applications to see success patterns and insights. Add jobs
                with statuses like &quot;Applied&quot;, &quot;Interview&quot;, or &quot;Offer&quot;
                to begin analyzing your job search performance.
              </p>
              <div className="mt-6">
                <a
                  href="/jobs"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Go to Jobs Page
                </a>
              </div>
              <div className="mt-8 text-left max-w-lg mx-auto">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  To see data here, you need to:
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Add jobs from the Jobs page
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Update job statuses (Applied, Interview, Offer, Rejected)
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Track multiple applications to see patterns emerge
                  </li>
                </ul>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Success Pattern Recognition</h1>
        <p className="text-gray-600 mt-2">
          Understand what strategies lead to your best outcomes
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Success Rate</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-3xl font-bold text-blue-600">
                  {dashboardData?.application_patterns?.overall_success_rate?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-gray-500 mt-1">Applications to offers</p>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Total Applications</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-3xl font-bold">
                  {dashboardData?.application_patterns?.total_applications || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Tracked applications</p>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Total Offers</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-3xl font-bold text-green-600">
                  {dashboardData?.application_patterns?.total_offers || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Job offers received</p>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Prep Impact</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-3xl font-bold capitalize">
                  {dashboardData?.preparation_correlation?.prep_impact_level || 'low'}
                </div>
                <p className="text-xs text-gray-500 mt-1">Preparation effectiveness</p>
              </Card.Body>
            </Card>
          </div>

          {/* Key Insights */}
          <Card>
            <Card.Header>
              <Card.Title>Key Success Factors</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                {dashboardData?.success_factors?.your_competitive_advantage?.map(
                  (advantage, idx) => (
                    <div key={idx} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-600"></div>
                      </div>
                      <p className="ml-3 text-gray-700">{advantage}</p>
                    </div>
                  )
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Top Recommendations */}
          <Card>
            <Card.Header>
              <Card.Title>Priority Actions</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                {dashboardData?.recommendations?.priority_actions
                  ?.slice(0, 3)
                  .map((action, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{action.action}</h4>
                          <div className="flex gap-3 mt-2 text-sm">
                            <span
                              className={`px-2 py-1 rounded ${
                                action.impact === 'high'
                                  ? 'bg-red-100 text-red-800'
                                  : action.impact === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {action.impact} impact
                            </span>
                            <span
                              className={`px-2 py-1 rounded ${
                                action.effort === 'high'
                                  ? 'bg-red-100 text-red-800'
                                  : action.effort === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {action.effort} effort
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>Successful Job Types</Card.Title>
            </Card.Header>
            <Card.Body>
              {dashboardData?.application_patterns?.successful_job_types?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={dashboardData.application_patterns.successful_job_types.slice(0, 10)}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="job_type" angle={-45} textAnchor="end" height={100} />
                    <YAxis
                      label={{
                        value: 'Success Rate (%)',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                    />
                    <Tooltip />
                    <Bar dataKey="success_rate" fill="#3b82f6" name="Success Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Not enough data yet. Keep tracking applications!
                </div>
              )}
            </Card.Body>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <Card.Title>Top Companies</Card.Title>
              </Card.Header>
              <Card.Body>
                {dashboardData?.application_patterns?.top_companies?.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.application_patterns.top_companies
                      .slice(0, 5)
                      .map((company, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded"
                        >
                          <div>
                            <div className="font-medium">{company.company}</div>
                            <div className="text-sm text-gray-600">
                              {company.applications} applications
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-blue-600">
                              {company.success_rate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">success</div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">No company data yet</div>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Winning Industries</Card.Title>
              </Card.Header>
              <Card.Body>
                {dashboardData?.application_patterns?.winning_industries?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={dashboardData.application_patterns.winning_industries}
                        dataKey="offer_rate"
                        nameKey="industry"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {dashboardData.application_patterns.winning_industries.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          )
                        )}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">No industry data yet</div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      {/* Preparation Tab */}
      {activeTab === 'preparation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <Card.Header>
                <Card.Title className="text-sm">Avg Prep (Successful)</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData?.preparation_correlation?.avg_prep_hours_successful?.toFixed(1) ||
                    0}
                  h
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title className="text-sm">Avg Prep (Unsuccessful)</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold text-red-600">
                  {dashboardData?.preparation_correlation?.avg_prep_hours_unsuccessful?.toFixed(
                    1
                  ) || 0}
                  h
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title className="text-sm">Correlation Score</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">
                  {dashboardData?.preparation_correlation?.correlation_score?.toFixed(2) || 0}
                </div>
                <p className="text-xs text-gray-500">-1 to 1 scale</p>
              </Card.Body>
            </Card>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Most Effective Activities</Card.Title>
            </Card.Header>
            <Card.Body>
              {dashboardData?.preparation_correlation?.most_effective_activities?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={dashboardData.preparation_correlation.most_effective_activities}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="activity" />
                    <YAxis
                      label={{
                        value: 'Success Rate (%)',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="success_rate" fill="#10b981" name="Success Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No preparation data yet. Track your prep activities!
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Optimal Preparation Time</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="text-center py-8">
                <p className="text-4xl font-bold text-blue-600">
                  {dashboardData?.preparation_correlation?.optimal_prep_time_range?.min || 0} -
                  {dashboardData?.preparation_correlation?.optimal_prep_time_range?.max || 0}{' '}
                  hours
                </p>
                <p className="text-gray-600 mt-2">
                  Recommended preparation time per application
                </p>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Timing Tab */}
      {activeTab === 'timing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <Card.Title>Best Days to Apply</Card.Title>
              </Card.Header>
              <Card.Body>
                {dashboardData?.timing_patterns?.best_application_days?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardData.timing_patterns.best_application_days}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="success_rate"
                        fill="#f59e0b"
                        name="Success Rate %"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>Track more applications over different days to see patterns</p>
                    <p className="text-sm mt-2">
                      Currently analyzing{' '}
                      {dashboardData?.application_patterns?.total_applications || 0}{' '}
                      applications
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Best Months</Card.Title>
              </Card.Header>
              <Card.Body>
                {dashboardData?.timing_patterns?.best_months?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardData.timing_patterns.best_months}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="response_rate"
                        fill="#8b5cf6"
                        name="Response Rate %"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>Apply over multiple months to identify seasonal patterns</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <Card.Header>
                <Card.Title className="text-sm">Avg Time to Response</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-3xl font-bold">
                  {dashboardData?.timing_patterns?.avg_time_to_response?.toFixed(1) || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">days</p>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title className="text-sm">Avg Time to Offer</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-3xl font-bold text-green-600">
                  {dashboardData?.timing_patterns?.avg_time_to_offer?.toFixed(1) || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">days</p>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title className="text-sm">Optimal Follow-up</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-3xl font-bold text-blue-600">
                  {dashboardData?.timing_patterns?.optimal_followup_timing?.days || 7}
                </div>
                <p className="text-xs text-gray-500 mt-1">days after applying</p>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Seasonal Trends</Card.Title>
              </Card.Header>
              <Card.Body>
                {dashboardData?.timing_patterns?.seasonal_trends?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={dashboardData.timing_patterns.seasonal_trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="success_rate"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Success Rate %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>Track applications across quarters to see seasonal trends</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      {/* Strategies Tab */}
      {activeTab === 'strategies' && (
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>Strategy Success Rates</Card.Title>
            </Card.Header>
            <Card.Body>
              {dashboardData?.strategy_effectiveness?.strategy_success_rates?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={dashboardData.strategy_effectiveness.strategy_success_rates}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="strategy" />
                    <YAxis
                      label={{
                        value: 'Success Rate (%)',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="success_rate" fill="#10b981" name="Success Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>
                    Currently tracking{' '}
                    {dashboardData?.application_patterns?.total_applications || 0}{' '}
                    applications
                  </p>
                  <p className="text-sm mt-2 text-gray-400">
                    Add more applications to see which strategies work best
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Recommended Strategy</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="text-center py-8">
                <p className="text-4xl font-bold text-blue-600 capitalize">
                  {dashboardData?.strategy_effectiveness?.recommended_strategy?.replace(
                    /_/g,
                    ' '
                  ) || 'Direct Application'}
                </p>
                <p className="text-gray-600 mt-2">
                  Based on your historical success patterns
                </p>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Market Condition Strategies</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                {dashboardData?.strategy_effectiveness?.market_condition_strategies?.map(
                  (item, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold capitalize text-gray-900">
                            {item.market_condition.replace(/_/g, ' ')}
                          </h4>
                          <p className="text-sm text-gray-600 capitalize mt-1">
                            Best: {item.best_strategy.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {item.success_rate}%
                          </div>
                          <div className="text-xs text-gray-500">success rate</div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Success Factors Tab */}
      {activeTab === 'factors' && (
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>Your Winning Skills</Card.Title>
            </Card.Header>
            <Card.Body>
              {dashboardData?.success_factors?.winning_skills?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {dashboardData.success_factors.winning_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium"
                    >
                      {skill.skill}{' '}
                      <span className="text-sm">
                        ({skill.appearance_in_offers})
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Add skills to see insights
                </div>
              )}
            </Card.Body>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <Card.Title>Salary Range (Successful)</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-center py-8">
                  <p className="text-3xl font-bold text-green-600">
                    $
                    {(
                      dashboardData?.success_factors?.successful_job_characteristics
                        ?.avg_salary_range?.min || 0
                    ).toLocaleString()}{' '}
                    - $
                    {(
                      dashboardData?.success_factors?.successful_job_characteristics
                        ?.avg_salary_range?.max || 0
                    ).toLocaleString()}
                  </p>
                  <p className="text-gray-600 mt-2">
                    Average successful salary range
                  </p>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                {dashboardData?.success_factors?.successful_job_characteristics
                  ?.remote_vs_onsite &&
                dashboardData.success_factors.successful_job_characteristics
                  .remote_vs_onsite.remote +
                  dashboardData.success_factors.successful_job_characteristics
                    .remote_vs_onsite.hybrid +
                  dashboardData.success_factors.successful_job_characteristics
                    .remote_vs_onsite.onsite >
                  0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: 'Remote',
                            value:
                              dashboardData.success_factors
                                .successful_job_characteristics.remote_vs_onsite
                                .remote,
                          },
                          {
                            name: 'Hybrid',
                            value:
                              dashboardData.success_factors
                                .successful_job_characteristics.remote_vs_onsite
                                .hybrid,
                          },
                          {
                            name: 'Onsite',
                            value:
                              dashboardData.success_factors
                                .successful_job_characteristics.remote_vs_onsite
                                .onsite,
                          },
                        ].filter((item) => item.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>Add location details to your successful applications</p>
                    <p className="text-sm mt-2 text-gray-400">
                      Include terms like &quot;Remote&quot;, &quot;Hybrid&quot;, or
                      city names
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Your Competitive Advantages</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                {dashboardData?.success_factors?.your_competitive_advantage?.map(
                  (advantage, idx) => (
                    <div
                      key={idx}
                      className="flex items-center p-4 bg-green-50 border border-green-200 rounded"
                    >
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                          {idx + 1}
                        </div>
                      </div>
                      <p className="text-gray-900">{advantage}</p>
                    </div>
                  )
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>Predict Opportunity Success</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select a Job (optional)
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="input flex-1"
                      value={predictionInput}
                      onChange={(e) => setPredictionInput(e.target.value)}
                    >
                      <option value="">-- General Prediction (No Specific Job) --</option>
                      {jobsList.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title} at {job.company} ({job.status})
                        </option>
                      ))}
                    </select>
                    <button onClick={getPrediction} className="btn btn-primary">
                      Predict Success
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Select a specific job to get a tailored prediction, or leave blank for general success probability based on your historical patterns.
                  </p>
                </div>

                {prediction && (
                  <div className="mt-6">
                    <div className="text-center p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <div className="text-6xl font-bold text-blue-600 mb-2">
                        {prediction.success_probability}%
                      </div>
                      <p className="text-xl text-gray-700 mb-4">
                        Predicted Success Probability
                      </p>
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          prediction.confidence_level === 'high'
                            ? 'bg-green-100 text-green-800'
                            : prediction.confidence_level === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {prediction.confidence_level} confidence
                      </span>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-semibold mb-3 text-gray-900">Key Factors</h4>
                      <div className="space-y-2">
                        {prediction.key_factors?.map((factor, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 border rounded"
                          >
                            <span className="text-gray-900">{factor.factor}</span>
                            <span
                              className={`px-3 py-1 rounded text-sm ${
                                factor.impact === 'positive'
                                  ? 'bg-green-100 text-green-800'
                                  : factor.impact === 'negative'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {factor.impact}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Recommendation
                      </h4>
                      <p className="text-blue-800">{prediction.recommendation}</p>
                    </div>

                    {prediction.similar_past_applications?.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-3 text-gray-900">
                          Similar Past Applications
                        </h4>
                        <div className="space-y-2">
                          {prediction.similar_past_applications.map((app, idx) => (
                            <div key={idx} className="p-3 border rounded">
                              <div className="flex justify-between">
                                <div>
                                  <p className="font-medium">{app.position}</p>
                                  <p className="text-sm text-gray-600">{app.company}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium capitalize">
                                    {app.outcome}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {app.similarity_score.toFixed(1)}% similar
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Evolution Tab */}
      {activeTab === 'evolution' && (
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>Success Rate Evolution</Card.Title>
            </Card.Header>
            <Card.Body>
              {dashboardData?.evolution?.success_rate_evolution?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.evolution.success_rate_evolution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis
                      label={{
                        value: 'Success Rate (%)',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="success_rate"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Success Rate %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Not enough historical data yet
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Pattern Changes</Card.Title>
            </Card.Header>
            <Card.Body>
              {dashboardData?.evolution?.pattern_changes?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.evolution.pattern_changes.map((change, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{change.pattern_type}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {change.previous_value} → {change.current_value}
                            <span
                              className={`ml-2 font-medium ${
                                change.trend === 'improving'
                                  ? 'text-green-600'
                                  : change.trend === 'declining'
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                              }`}
                            >
                              (
                              {change.change_percentage > 0 ? '+' : ''}
                              {change.change_percentage}%)
                            </span>
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            change.trend === 'improving'
                              ? 'bg-green-100 text-green-800'
                              : change.trend === 'declining'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {change.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No pattern changes detected yet
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Strategy Adaptations</Card.Title>
            </Card.Header>
            <Card.Body>
              {dashboardData?.evolution?.strategy_adaptations?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.evolution.strategy_adaptations.map(
                    (adaptation, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-blue-50 border border-blue-200 rounded"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-600"></div>
                          <div>
                            <p className="font-medium text-blue-900">
                              {adaptation.strategy_change}
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              {adaptation.result}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              {new Date(adaptation.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No strategy adaptations tracked yet
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      )}

      {/* A/B Testing Tab */}
      {activeTab === 'abtesting' && (
        <div className="space-y-6">
          {abLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : abExperiments.length === 0 ? (
            <Card>
              <Card.Body>
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No A/B Testing Experiments Yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Create your first experiment to start testing different resume and cover letter versions
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Experiment
                  </button>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Experiments Sidebar */}
              <div className="lg:col-span-3">
                <Card>
                  <Card.Header className="flex justify-between items-center">
                    <Card.Title>Experiments</Card.Title>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div className="divide-y">
                      {abExperiments.map((exp) => (
                        <button
                          key={exp.id}
                          onClick={() => {
                            setSelectedExperiment(exp);
                            fetchAbDashboard(exp.id);
                          }}
                          className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                            selectedExperiment?.id === exp.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                          }`}
                        >
                          <div className="font-semibold text-gray-900 mb-1">
                            {exp.experiment_name}
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            {exp.material_type}
                          </div>
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded ${
                              exp.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : exp.status === 'paused'
                                ? 'bg-yellow-100 text-yellow-800'
                                : exp.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {exp.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </div>

              {/* Main Dashboard */}
              <div className="lg:col-span-9">
                {selectedExperiment && abDashboardData && (
                  <>
                    {/* Experiment Header */}
                    <Card className="mb-6">
                      <Card.Body>
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                          <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                              {selectedExperiment.experiment_name}
                            </h2>
                            <p className="text-gray-600 mt-1">{selectedExperiment.notes}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleUpdateStatus(selectedExperiment.id, 'active')}
                              disabled={selectedExperiment.status === 'active'}
                              className="px-3 py-2 text-xs sm:text-sm border rounded hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                            >
                              Activate
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(selectedExperiment.id, 'paused')}
                              disabled={selectedExperiment.status === 'paused'}
                              className="px-3 py-2 text-xs sm:text-sm border rounded hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                            >
                              Pause
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(selectedExperiment.id, 'completed')}
                              className="px-3 py-2 text-xs sm:text-sm border rounded hover:bg-gray-50 whitespace-nowrap"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => setShowAddVariantModal(true)}
                              className="px-3 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                            >
                              Add Variant
                            </button>
                            <button
                              onClick={() => handleCalculateResults(selectedExperiment.id)}
                              className="px-3 py-2 text-xs sm:text-sm bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap"
                            >
                              Calculate
                            </button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                      <Card>
                        <Card.Body>
                          <div className="text-sm text-gray-600">Total Applications</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {abDashboardData.summary?.total_applications || 0}
                          </div>
                        </Card.Body>
                      </Card>
                      <Card>
                        <Card.Body>
                          <div className="text-sm text-gray-600">Responses</div>
                          <div className="text-2xl font-bold text-green-600">
                            {abDashboardData.summary?.total_responses || 0}
                          </div>
                        </Card.Body>
                      </Card>
                      <Card>
                        <Card.Body>
                          <div className="text-sm text-gray-600">Response Rate</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {abDashboardData.summary?.overall_response_rate?.toFixed(1) || 0}%
                          </div>
                        </Card.Body>
                      </Card>
                      <Card>
                        <Card.Body>
                          <div className="text-sm text-gray-600">Variants</div>
                          <div className="text-2xl font-bold text-purple-600">
                            {abDashboardData.summary?.total_variants || 0}
                          </div>
                        </Card.Body>
                      </Card>
                    </div>

                    {/* Key Insights */}
                    {abDashboardData.insights?.length > 0 && (
                      <Card className="mb-6">
                        <Card.Header>
                          <Card.Title>Key Insights</Card.Title>
                        </Card.Header>
                        <Card.Body>
                          <div className="space-y-3">
                            {abDashboardData.insights.map((insight, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded">
                                <svg
                                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                                </svg>
                                <p className="text-sm text-gray-700">{insight}</p>
                              </div>
                            ))}
                          </div>
                        </Card.Body>
                      </Card>
                    )}

                    {/* Winning Variant */}
                    {abDashboardData.winning_variant && (
                      <Card className="mb-6 border-green-500">
                        <Card.Header className="bg-green-50">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-6 h-6 text-green-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                            </svg>
                            <Card.Title className="text-green-900">Winning Variant</Card.Title>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                            <div>
                              <div className="text-sm text-gray-600">Variant</div>
                              <div className="font-semibold text-gray-900">
                                {abDashboardData.winning_variant.variant_name}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Response Rate</div>
                              <div className="font-semibold text-green-600">
                                {abDashboardData.winning_variant.response_rate?.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Interview Rate</div>
                              <div className="font-semibold text-blue-600">
                                {abDashboardData.winning_variant.interview_conversion_rate?.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Offer Rate</div>
                              <div className="font-semibold text-purple-600">
                                {abDashboardData.winning_variant.offer_rate?.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Significance</div>
                              <div className="font-semibold text-gray-900">
                                {abDashboardData.winning_variant.is_significant ? '✓ Significant' : '- Pending'}
                              </div>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    )}

                    {/* Performance Comparison Chart */}
                    <Card className="mb-6">
                      <Card.Header>
                        <Card.Title>Performance Comparison</Card.Title>
                      </Card.Header>
                      <Card.Body>
                        {abDashboardData.results?.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={abDashboardData.results}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="variant_name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="response_rate" fill="#3b82f6" name="Response Rate %" />
                              <Bar dataKey="interview_conversion_rate" fill="#10b981" name="Interview Rate %" />
                              <Bar dataKey="offer_rate" fill="#8b5cf6" name="Offer Rate %" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            No data available yet. Add variants and track applications.
                          </div>
                        )}
                      </Card.Body>
                    </Card>

                    {/* Detailed Results Table */}
                    <Card>
                      <Card.Header>
                        <Card.Title>Detailed Results</Card.Title>
                      </Card.Header>
                      <Card.Body className="p-0">
                        {abDashboardData.results?.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Variant
                                  </th>
                                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Applications
                                  </th>
                                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Response Rate
                                  </th>
                                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Avg Time to Response
                                  </th>
                                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Interview Rate
                                  </th>
                                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Offer Rate
                                  </th>
                                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Significance
                                  </th>
                                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {abDashboardData.results.map((result) => (
                                  <tr key={result.variant_id}>
                                    <td className="px-2 sm:px-4 py-3 text-sm font-medium text-gray-900">
                                      {result.variant_name}
                                    </td>
                                    <td className="px-2 sm:px-4 py-3 text-sm text-gray-700">
                                      {result.total_applications}
                                    </td>
                                    <td className="px-2 sm:px-4 py-3 text-sm text-gray-700">
                                      {result.response_rate?.toFixed(1)}%
                                    </td>
                                    <td className="px-2 sm:px-4 py-3 text-sm text-gray-700">
                                      {result.avg_time_to_response
                                        ? `${result.avg_time_to_response.toFixed(1)}h`
                                        : '-'}
                                    </td>
                                    <td className="px-2 sm:px-4 py-3 text-sm text-gray-700">
                                      {result.interview_conversion_rate?.toFixed(1)}%
                                    </td>
                                    <td className="px-2 sm:px-4 py-3 text-sm text-gray-700">
                                      {result.offer_rate?.toFixed(1)}%
                                    </td>
                                    <td className="px-2 sm:px-4 py-3 text-sm">
                                      {result.is_significant ? (
                                        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 whitespace-nowrap">
                                          Significant (p={result.p_value?.toFixed(4)})
                                        </span>
                                      ) : result.total_applications < 10 ? (
                                        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 whitespace-nowrap">
                                          Need more data
                                        </span>
                                      ) : (
                                        <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 whitespace-nowrap">
                                          Not significant
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-2 sm:px-4 py-3 text-sm">
                                      <button
                                        onClick={() => handleArchiveVariant(result.variant_id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        Archive
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            No results available yet
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Create Experiment Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Create New Experiment</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    handleCreateExperiment({
                      experiment_name: formData.get('experiment_name'),
                      material_type: formData.get('material_type'),
                      minimum_sample_size: parseInt(formData.get('minimum_sample_size')),
                      notes: formData.get('notes'),
                    });
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Experiment Name
                      </label>
                      <input
                        type="text"
                        name="experiment_name"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Material Type
                      </label>
                      <select
                        name="material_type"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="resume">Resume</option>
                        <option value="cover_letter">Cover Letter</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Sample Size
                      </label>
                      <input
                        type="number"
                        name="minimum_sample_size"
                        defaultValue="10"
                        min="1"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        rows="3"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Variant Modal */}
          {showAddVariantModal && selectedExperiment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Variant</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    handleAddVariant({
                      variant_name: formData.get('variant_name'),
                      resume_version_id: formData.get('resume_version_id') || null,
                      cover_letter_version_id: formData.get('cover_letter_version_id') || null,
                      description: formData.get('description'),
                      format_type: formData.get('format_type'),
                      design_style: formData.get('design_style'),
                      length_pages: parseInt(formData.get('length_pages')) || null,
                      word_count: parseInt(formData.get('word_count')) || null,
                      has_photo: formData.get('has_photo') === 'true',
                      has_color: formData.get('has_color') === 'true',
                    });
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Variant Name
                      </label>
                      <input
                        type="text"
                        name="variant_name"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {(selectedExperiment.material_type === 'resume' || selectedExperiment.material_type === 'both') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Resume Version
                          </label>
                          {versionsLoading ? (
                            <div className="flex items-center justify-center py-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            </div>
                          ) : (
                            <select
                              name="resume_version_id"
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select resume version...</option>
                              {resumeVersions.map((resume) => (
                                <option key={resume.id} value={resume.id}>
                                  {resume.title} - {new Date(resume.updatedAt).toLocaleDateString()}
                                </option>
                              ))}
                            </select>
                          )}
                          {!versionsLoading && resumeVersions.length === 0 && (
                            <p className="text-sm text-gray-500 mt-1">No resume versions found. Create a resume first.</p>
                          )}
                        </div>
                      )}
                      {(selectedExperiment.material_type === 'cover_letter' || selectedExperiment.material_type === 'both') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cover Letter
                          </label>
                          {versionsLoading ? (
                            <div className="flex items-center justify-center py-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            </div>
                          ) : (
                            <select
                              name="cover_letter_version_id"
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select cover letter...</option>
                              {coverLetters.map((letter) => (
                                <option key={letter.id} value={letter.id}>
                                  {letter.title} - {new Date(letter.created_at).toLocaleDateString()}
                                </option>
                              ))}
                            </select>
                          )}
                          {!versionsLoading && coverLetters.length === 0 && (
                            <p className="text-sm text-gray-500 mt-1">No cover letters found. Create a cover letter first.</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        rows="2"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Format Type
                        </label>
                        <input
                          type="text"
                          name="format_type"
                          placeholder="e.g., Traditional, Modern, Creative"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Design Style
                        </label>
                        <input
                          type="text"
                          name="design_style"
                          placeholder="e.g., Minimalist, Professional"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Length (pages)
                        </label>
                        <input
                          type="number"
                          name="length_pages"
                          min="1"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Word Count
                        </label>
                        <input
                          type="number"
                          name="word_count"
                          min="1"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Has Photo
                        </label>
                        <select
                          name="has_photo"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Has Color
                        </label>
                        <select
                          name="has_color"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAddVariantModal(false)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Variant
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SuccessPatterns;
