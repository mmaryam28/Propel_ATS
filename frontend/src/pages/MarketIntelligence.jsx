import React, { useState, useEffect } from 'react';
import { getMarketIntelligence } from '../lib/api';
import {
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaChartLine,
  FaBullseye,
  FaClock,
  FaUsers,
  FaAward,
  FaBriefcase,
  FaDollarSign,
  FaLightbulb,
  FaCalendar,
} from 'react-icons/fa';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const MarketIntelligence = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      const result = await getMarketIntelligence();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <FaArrowUp className="w-5 h-5 text-green-600" />;
    if (trend === 'down') return <FaArrowDown className="w-5 h-5 text-red-600" />;
    return <FaMinus className="w-5 h-5 text-gray-600" />;
  };

  const getTrendColor = (trend) => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getDemandColor = (demand) => {
    if (demand === 'High') return 'bg-green-100 text-green-800';
    if (demand === 'Emerging') return 'bg-blue-100 text-blue-800';
    if (demand === 'Medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'High') return 'bg-red-100 text-red-800';
    if (priority === 'Medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading market intelligence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading market data: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Market Intelligence</h1>
        <p className="mt-2 text-gray-600">
          Real-time insights on industry trends, skills demand, and competitive landscape
        </p>
      </div>

      {/* Industry Trends */}
      <section className="mb-8">
        <div className="flex items-center mb-4">
          <FaChartLine className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Industry Trends</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {data?.industryTrends?.map((trend) => (
            <div key={trend.industry} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{trend.industry}</h3>
                {getTrendIcon(trend.trend)}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Job Openings:</span>
                  <span className="font-semibold">{trend.jobCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Growth:</span>
                  <span className={`font-semibold ${getTrendColor(trend.trend)}`}>
                    {trend.growth > 0 ? '+' : ''}
                    {trend.growth}%
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={trend.monthlyData}>
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={trend.trend === 'up' ? '#10b981' : trend.trend === 'down' ? '#ef4444' : '#6b7280'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skill Demand Evolution */}
      <section className="mb-8">
        <div className="flex items-center mb-4">
          <FaAward className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Skill Demand Evolution</h2>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {data?.skillDemand?.map((skill) => (
              <div key={skill.skill} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{skill.skill}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDemandColor(skill.demand)}`}>
                    {skill.demand}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Demand Score</span>
                    <span className="font-semibold text-gray-900">{skill.trendScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${skill.trendScore}%` }}
                    />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={80}>
                  <LineChart data={skill.yearlyData}>
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Salary Trends */}
      <section className="mb-8">
        <div className="flex items-center mb-4">
          <FaDollarSign className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Salary Trends</h2>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.salaryTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="role" angle={-45} textAnchor="end" height={100} />
              <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="minSalary" name="Min Salary" fill="#93c5fd" />
              <Bar dataKey="avgSalary" name="Avg Salary" fill="#3b82f6" />
              <Bar dataKey="maxSalary" name="Max Salary" fill="#1e40af" />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {data?.salaryTrends?.map((salary) => (
              <div key={`${salary.role}-${salary.location}`} className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{salary.role}</h3>
                <div className="text-sm space-y-1">
                  <p className="text-gray-600">
                    Range: ${salary.minSalary.toLocaleString()} - ${salary.maxSalary.toLocaleString()}
                  </p>
                  <p className="text-gray-900 font-semibold">
                    Avg: ${salary.avgSalary.toLocaleString()}
                  </p>
                  <div className="flex items-center">
                    {getTrendIcon(salary.trend)}
                    <span className={`ml-1 ${getTrendColor(salary.trend)}`}>
                      {salary.trend === 'up' ? 'Growing' : salary.trend === 'down' ? 'Declining' : 'Stable'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Growth Patterns */}
      <section className="mb-8">
        <div className="flex items-center mb-4">
          <FaBriefcase className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Company Growth Patterns</h2>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Open Positions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hiring Level
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.companyGrowth?.map((company) => (
                <tr key={company.company} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {company.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {company.openings.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        company.growth === 'Growing'
                          ? 'bg-green-100 text-green-800'
                          : company.growth === 'Declining'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {company.growth}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        company.hiringLevel === 'High'
                          ? 'bg-blue-100 text-blue-800'
                          : company.hiringLevel === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {company.hiringLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Industry Insights */}
      <section className="mb-8">
        <div className="flex items-center mb-4">
          <FaLightbulb className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Industry Insights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data?.insights?.map((insight) => (
            <div key={insight.industry} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{insight.industry}</h3>
              <ul className="space-y-2">
                {insight.insights.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Skill Recommendations */}
      <section className="mb-8">
        <div className="flex items-center mb-4">
          <FaBullseye className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Personalized Skill Recommendations</h2>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            {data?.recommendations?.map((rec) => (
              <div key={rec.skill} className="border-l-4 border-blue-600 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{rec.skill}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(rec.priority)}`}>
                    {rec.priority} Priority
                  </span>
                </div>
                <p className="text-gray-700">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Optimal Timing */}
      <section className="mb-8">
        <div className="flex items-center mb-4">
          <FaCalendar className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Optimal Job Search Timing</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.timing?.map((time) => (
            <div key={time.role} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{time.role}</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Best Months:</p>
                  <div className="flex flex-wrap gap-2">
                    {time.bestMonths.map((month) => (
                      <span key={month} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {month}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Peak Quarters:</p>
                  <div className="flex flex-wrap gap-2">
                    {time.peakQuarters.map((quarter) => (
                      <span key={quarter} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        {quarter}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-3 pt-3 border-t">{time.reasoning}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Competitive Landscape */}
      <section className="mb-8">
        <div className="flex items-center mb-4">
          <FaUsers className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Competitive Landscape Analysis</h2>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Market Stats */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Target Role:</span>
                  <span className="font-semibold text-gray-900">{data?.landscape?.role}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Avg Candidates/Role:</span>
                  <span className="font-semibold text-gray-900">{data?.landscape?.avgCandidatesPerRole}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Avg Experience:</span>
                  <span className="font-semibold text-gray-900">{data?.landscape?.avgYearsExperience}</span>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Top Required Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {data?.landscape?.topSkills?.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Your Position */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Competitive Position</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700">Skills Match:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {data?.landscape?.userMatch?.skillsMatchPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${data?.landscape?.userMatch?.skillsMatchPercent}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Experience Level:</span>
                  <span className="font-semibold text-green-700">{data?.landscape?.userMatch?.experienceMatch}</span>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Action Items to Stand Out:</h4>
                <ul className="space-y-2">
                  {data?.landscape?.userMatch?.recommendations?.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <FaClock className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MarketIntelligence;
