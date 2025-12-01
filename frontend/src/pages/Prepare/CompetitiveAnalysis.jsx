import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

export default function CompetitiveAnalysis() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [benchmarks, setBenchmarks] = useState(null);
  const [positioning, setPositioning] = useState(null);
  const [careerPatterns, setCareerPatterns] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [benchmarksRes, positioningRes, patternsRes, recommendationsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/competitive/benchmarks`, { headers }),
        axios.get(`${API_BASE_URL}/competitive/positioning`, { headers }),
        axios.get(`${API_BASE_URL}/competitive/career-patterns`, { headers }),
        axios.get(`${API_BASE_URL}/competitive/recommendations`, { headers }),
      ]);

      setBenchmarks(benchmarksRes.data);
      setPositioning(positioningRes.data);
      setCareerPatterns(patternsRes.data);
      setRecommendations(recommendationsRes.data);
    } catch (err) {
      console.error('Failed to load competitive analysis:', err);
      setError(err?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading competitive analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Icon name="alert" size="2xl" className="text-red-600 mx-auto mb-4" />
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const benchmarkChartData = [
    {
      metric: 'Apps/Month',
      You: benchmarks.applicationsPerMonth.user,
      Peers: benchmarks.applicationsPerMonth.peer,
      Industry: benchmarks.applicationsPerMonth.industry,
    },
    {
      metric: 'Response %',
      You: benchmarks.responseRate.user,
      Peers: benchmarks.responseRate.peer,
      Industry: benchmarks.responseRate.industry,
    },
    {
      metric: 'Interview %',
      You: benchmarks.interviewRate.user,
      Peers: benchmarks.interviewRate.peer,
      Industry: benchmarks.interviewRate.industry,
    },
    {
      metric: 'Offer %',
      You: benchmarks.offerRate.user,
      Peers: benchmarks.offerRate.peer,
      Industry: benchmarks.offerRate.industry,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Competitive Benchmarking & Market Positioning
          </h1>
          <p className="text-gray-600">
            Compare your job search performance against peers and industry standards
          </p>
        </div>

        {/* Section A: You vs Peers */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Your Performance vs Peers
          </h2>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Applications/Month</h3>
                  <Icon name="briefcase" size="lg" className="text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {benchmarks.applicationsPerMonth.user}
                    </span>
                    <span className="text-sm text-gray-500">You</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {benchmarks.applicationsPerMonth.peer} (Peers)
                    </span>
                    <span className="text-gray-600">
                      {benchmarks.applicationsPerMonth.industry} (Industry)
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Response Rate</h3>
                  <Icon name="mail" size="lg" className="text-green-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-600">
                      {benchmarks.responseRate.user}%
                    </span>
                    <span className="text-sm text-gray-500">You</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {benchmarks.responseRate.peer}% (Peers)
                    </span>
                    <span className="text-gray-600">
                      {benchmarks.responseRate.industry}% (Industry)
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Interview Rate</h3>
                  <Icon name="video" size="lg" className="text-purple-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-purple-600">
                      {benchmarks.interviewRate.user}%
                    </span>
                    <span className="text-sm text-gray-500">You</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {benchmarks.interviewRate.peer}% (Peers)
                    </span>
                    <span className="text-gray-600">
                      {benchmarks.interviewRate.industry}% (Industry)
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Offer Rate</h3>
                  <Icon name="trophy" size="lg" className="text-yellow-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-yellow-600">
                      {benchmarks.offerRate.user}%
                    </span>
                    <span className="text-sm text-gray-500">You</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {benchmarks.offerRate.peer}% (Peers)
                    </span>
                    <span className="text-gray-600">
                      {benchmarks.offerRate.industry}% (Industry)
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Comparison Chart */}
          <Card className="bg-white shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Performance Comparison
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={benchmarkChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="You" fill="#3b82f6" />
                  <Bar dataKey="Peers" fill="#10b981" />
                  <Bar dataKey="Industry" fill="#6b7280" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>

        {/* Section B: Skills & Experience Positioning */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Skills & Experience Positioning
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall Profile Rating */}
            <Card className="bg-white shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Profile</h3>
                <div className="text-center py-6">
                  <div
                    className={`inline-block px-6 py-3 rounded-lg text-2xl font-bold ${
                      positioning.overallRating === 'Above Market'
                        ? 'bg-green-100 text-green-800'
                        : positioning.overallRating === 'At Market'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {positioning.overallRating}
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Average:</span>
                    <span className="font-semibold">
                      {(positioning.userSkills.reduce((sum, s) => sum + s.level, 0) / 
                        positioning.userSkills.length).toFixed(1)} / 4.0
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peer Average:</span>
                    <span className="font-semibold">{positioning.peerAverage.toFixed(1)} / 4.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Top Performers:</span>
                    <span className="font-semibold">{positioning.topPerformerAverage.toFixed(1)} / 4.0</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Skills Bar Chart */}
            <Card className="bg-white shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Skills vs Market</h3>
                <div className="space-y-4">
                  {positioning.userSkills.map((skill, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{skill.name}</span>
                        <span className="text-gray-600">{skill.proficiency}</span>
                      </div>
                      <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                        {/* Your level */}
                        <div
                          className="absolute top-0 left-0 h-full bg-blue-600 rounded-lg transition-all"
                          style={{ width: `${(skill.level / 4) * 100}%` }}
                        />
                        {/* Peer average marker */}
                        <div
                          className="absolute top-0 h-full w-0.5 bg-green-600"
                          style={{ left: `${(positioning.peerAverage / 4) * 100}%` }}
                          title="Peer Average"
                        />
                        {/* Top performer marker */}
                        <div
                          className="absolute top-0 h-full w-0.5 bg-purple-600"
                          style={{ left: `${(positioning.topPerformerAverage / 4) * 100}%` }}
                          title="Top Performers"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-blue-600 rounded"></div>
                    <span>Your Level</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-0.5 h-4 bg-green-600"></div>
                    <span>Peer Avg ({positioning.peerAverage.toFixed(1)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-0.5 h-4 bg-purple-600"></div>
                    <span>Top Performers ({positioning.topPerformerAverage.toFixed(1)})</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Skill Gaps */}
            {positioning.skillGaps.length > 0 && (
              <Card className="bg-white shadow-sm lg:col-span-2">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <Icon name="alert" size="sm" className="inline mr-2 text-yellow-600" />
                    Skill Gaps (vs Top Performers)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {positioning.skillGaps.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-yellow-50 text-yellow-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-gray-600">
                    Consider developing these skills to match top performers in your field
                  </p>
                </div>
              </Card>
            )}
          </div>
        </section>

        {/* Section C: Career Patterns & Progress */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Career Patterns & Progress
          </h2>

          <Card className="bg-white shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your Journey vs Successful Patterns
              </h3>
              <div className="mb-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-blue-600"></span>
                  <span>Your Journey</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-green-600"></span>
                  <span>Typical Success Pattern</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="week" 
                    type="number"
                    domain={[0, Math.max(careerPatterns.currentWeek, careerPatterns.expectedWeek)]}
                    label={{ value: 'Weeks', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    data={careerPatterns.successfulPattern}
                    dataKey="week"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Typical Pattern"
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-800 font-semibold">Current Week:</span>
                  <span className="ml-2 text-blue-600">{careerPatterns.currentWeek}</span>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <span className="text-green-800 font-semibold">Expected Timeline to Offers:</span>
                  <span className="ml-2 text-green-600">{careerPatterns.expectedWeek} weeks</span>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Section D: Recommendations & Differentiation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Recommendations & Market Positioning
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Action Plan */}
            <Card className="bg-white shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <Icon name="target" size="sm" className="inline mr-2 text-blue-600" />
                  Action Plan
                </h3>
                <ul className="space-y-3">
                  {recommendations.actionPlan.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Differentiation Strategy */}
            <Card className="bg-white shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <Icon name="star" size="sm" className="inline mr-2 text-purple-600" />
                  How to Stand Out
                </h3>
                <ul className="space-y-3">
                  {recommendations.differentiationStrategy.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Icon name="check" size="sm" className="flex-shrink-0 text-purple-600 mt-1" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Market Positioning */}
            <Card className="bg-white shadow-sm lg:col-span-2">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <Icon name="map" size="sm" className="inline mr-2 text-green-600" />
                  Best Market Fit
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Target Companies</p>
                    <p className="font-semibold text-gray-900">
                      {recommendations.marketPositioning.targetCompanies}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Target Roles</p>
                    <p className="font-semibold text-gray-900">
                      {recommendations.marketPositioning.targetRoles}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Target Locations</p>
                    <p className="font-semibold text-gray-900">
                      {recommendations.marketPositioning.targetLocations}
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                  <Icon name="info" size="sm" className="text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Competition Level: {recommendations.marketPositioning.competitionLevel}</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {recommendations.marketPositioning.competitionLevel === 'Medium' 
                        ? 'Balanced opportunity with manageable competition'
                        : recommendations.marketPositioning.competitionLevel === 'Low'
                        ? 'Great opportunity with lower competition'
                        : 'High competition - focus on differentiation strategies'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
