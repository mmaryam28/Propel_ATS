import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getStatisticsOverview, getMonthlyVolume, exportStatisticsCSV } from '../lib/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const STATUS_COLORS = {
  interested: '#94a3b8',
  applied: '#3b82f6',
  phoneScreen: '#10b981',
  interview: '#f59e0b',
  offer: '#8b5cf6',
  rejected: '#ef4444',
};

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState(null);
  const [monthlyVolume, setMonthlyVolume] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    loadStatistics();
  }, [dateRange, customStartDate, customEndDate]);

  const getDateRange = () => {
    const now = new Date();
    let startDate = null;
    let endDate = now.toISOString().split('T')[0];

    switch (dateRange) {
      case '7days':
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
        break;
      case '30days':
        startDate = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
        break;
      case '3months':
        startDate = new Date(now.setMonth(now.getMonth() - 3)).toISOString().split('T')[0];
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
        break;
      case 'custom':
        startDate = customStartDate;
        endDate = customEndDate;
        break;
      default:
        startDate = null;
        endDate = null;
    }

    return { startDate, endDate };
  };

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getDateRange();
      const [stats, monthly] = await Promise.all([
        getStatisticsOverview(startDate, endDate),
        getMonthlyVolume(12, startDate, endDate),
      ]);
      setStatistics(stats);
      setMonthlyVolume(monthly);
    } catch (err) {
      console.error('Failed to load statistics:', err);
      setError(err?.response?.data?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportStatisticsCSV();
    } catch (err) {
      console.error('Failed to export:', err);
      alert('Failed to export statistics');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Job Search Statistics</h1>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Job Search Statistics</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!statistics) return null;

  // Prepare data for pie chart
  const statusData = [
    { name: 'Interested', value: statistics.byStatus.interested, color: STATUS_COLORS.interested },
    { name: 'Applied', value: statistics.byStatus.applied, color: STATUS_COLORS.applied },
    { name: 'Phone Screen', value: statistics.byStatus.phoneScreen, color: STATUS_COLORS.phoneScreen },
    { name: 'Interview', value: statistics.byStatus.interview, color: STATUS_COLORS.interview },
    { name: 'Offer', value: statistics.byStatus.offer, color: STATUS_COLORS.offer },
    { name: 'Rejected', value: statistics.byStatus.rejected, color: STATUS_COLORS.rejected },
  ].filter(item => item.value > 0);

  // Prepare data for bar chart (average time in stages)
  const stageTimeData = [
    { stage: 'Interested', days: statistics.averageTimeInStages.interested || 0 },
    { stage: 'Applied', days: statistics.averageTimeInStages.applied || 0 },
    { stage: 'Phone Screen', days: statistics.averageTimeInStages.phoneScreen || 0 },
    { stage: 'Interview', days: statistics.averageTimeInStages.interview || 0 },
  ].filter(item => item.days > 0);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Job Search Statistics</h1>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn btn-primary"
          >
            {exporting ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>

        {/* Date Range Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Time Period:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input text-sm py-2"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="3months">Last 3 Months</option>
              <option value="year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {dateRange === 'custom' && (
              <>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="input text-sm py-2"
                  placeholder="Start Date"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="input text-sm py-2"
                  placeholder="End Date"
                />
              </>
            )}
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Total Jobs"
            value={statistics.totalJobs}
            icon="📊"
            color="bg-blue-50 text-blue-600"
          />
          <MetricCard
            title="Interview Success Rate"
            value={`${statistics.interviewSuccessRate}%`}
            subtitle="Reached interview stage"
            icon="🎯"
            color="bg-green-50 text-green-600"
          />
          <MetricCard
            title="Response Rate"
            value={`${statistics.responseRate}%`}
            subtitle="Got a response"
            icon="📧"
            color="bg-purple-50 text-purple-600"
          />
          <MetricCard
            title="Time to Response"
            value={statistics.timeToResponse ? `${statistics.timeToResponse} days` : 'N/A'}
            subtitle="Average"
            icon="📬"
            color="bg-teal-50 text-teal-600"
          />
          <MetricCard
            title="Time to Interview"
            value={statistics.timeToInterview ? `${statistics.timeToInterview} days` : 'N/A'}
            subtitle="Average"
            icon="📅"
            color="bg-indigo-50 text-indigo-600"
          />
          <MetricCard
            title="Time to Offer"
            value={statistics.timeToOffer ? `${statistics.timeToOffer} days` : 'N/A'}
            subtitle="Average"
            icon="⏱️"
            color="bg-orange-50 text-orange-600"
          />
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution Pie Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Jobs by Status</h2>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
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
            ) : (
              <p className="text-gray-500 text-center py-12">No data available</p>
            )}
          </div>

          {/* Status Breakdown List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Breakdown</h2>
            <div className="space-y-3">
              <StatusItem label="Interested" count={statistics.byStatus.interested} color={STATUS_COLORS.interested} />
              <StatusItem label="Applied" count={statistics.byStatus.applied} color={STATUS_COLORS.applied} />
              <StatusItem label="Phone Screen" count={statistics.byStatus.phoneScreen} color={STATUS_COLORS.phoneScreen} />
              <StatusItem label="Interview" count={statistics.byStatus.interview} color={STATUS_COLORS.interview} />
              <StatusItem label="Offer" count={statistics.byStatus.offer} color={STATUS_COLORS.offer} />
              <StatusItem label="Rejected" count={statistics.byStatus.rejected} color={STATUS_COLORS.rejected} />
            </div>
          </div>
        </div>

        {/* Average Time in Stages */}
        {stageTimeData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Average Time in Each Stage</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stageTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="days" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly Application Volume */}
        {monthlyVolume.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Application Volume</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyVolume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'Applications', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Deadline Adherence */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Deadline Adherence</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{statistics.deadlineAdherence.upcoming}</div>
              <div className="text-sm text-gray-600 mt-1">Upcoming Deadlines</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{statistics.deadlineAdherence.missed}</div>
              <div className="text-sm text-gray-600 mt-1">Missed Deadlines</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{statistics.deadlineAdherence.adherenceRate}%</div>
              <div className="text-sm text-gray-600 mt-1">Adherence Rate</div>
            </div>
          </div>
        </div>

        {/* Industry Benchmarks */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Industry Benchmarks</h2>
          <p className="text-sm text-gray-600 mb-4">Compare your metrics with industry averages</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BenchmarkItem 
              label="Interview Success Rate" 
              yourValue={statistics.interviewSuccessRate} 
              benchmark={25} 
              unit="%" 
            />
            <BenchmarkItem 
              label="Response Rate" 
              yourValue={statistics.responseRate} 
              benchmark={40} 
              unit="%" 
            />
            <BenchmarkItem 
              label="Time to Offer" 
              yourValue={statistics.timeToOffer || 0} 
              benchmark={21} 
              unit=" days"
              reverse={true}
            />
          </div>
        </div>

        {/* Goal Progress */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🎯 Goal Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GoalProgressItem 
              title="Weekly Application Goal"
              current={5}
              target={10}
              unit="applications"
            />
            <GoalProgressItem 
              title="Interview Conversion Goal"
              current={statistics.interviewSuccessRate}
              target={30}
              unit="%"
            />
          </div>
          <div className="mt-4 text-center">
            <a href="/goals" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All Goals →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Benchmark Comparison Component
function BenchmarkItem({ label, yourValue, benchmark, unit, reverse = false }) {
  const percentage = benchmark > 0 ? (yourValue / benchmark) * 100 : 0;
  const isGood = reverse ? yourValue < benchmark : yourValue > benchmark;
  const color = isGood ? 'text-green-600' : 'text-orange-600';
  const bgColor = isGood ? 'bg-green-50' : 'bg-orange-50';
  
  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <span className={`text-2xl font-bold ${color}`}>{yourValue}{unit}</span>
          <span className="text-sm text-gray-500 ml-2">vs {benchmark}{unit}</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${isGood ? 'bg-green-500' : 'bg-orange-500'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      <div className="text-xs text-gray-600 mt-1">
        {isGood ? '✓ Above average' : '⚠ Below average'}
      </div>
    </div>
  );
}

// Goal Progress Component
function GoalProgressItem({ title, current, target, unit }) {
  const percentage = (current / target) * 100;
  const isComplete = current >= target;
  
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-700">{title}</div>
        <div className="text-xs text-gray-500">{current} / {target} {unit}</div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className={`h-3 rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      <div className="text-xs text-gray-600 mt-2">
        {isComplete ? '🎉 Goal completed!' : `${Math.round(percentage)}% complete`}
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ title, value, subtitle, icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`text-4xl ${color} rounded-lg p-3`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, count, color }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
        <span className="text-gray-700">{label}</span>
      </div>
      <span className="text-gray-900 font-semibold">{count}</span>
    </div>
  );
}
