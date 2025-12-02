import React, { useState } from 'react';
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

// Dummy data for charts
const dummyData = [
  { name: 'Week 1', applications: 12, interviews: 3, offers: 1 },
  { name: 'Week 2', applications: 15, interviews: 5, offers: 0 },
  { name: 'Week 3', applications: 18, interviews: 4, offers: 2 },
  { name: 'Week 4', applications: 20, interviews: 6, offers: 1 },
];

const pieData = [
  { name: 'Applied', value: 65, color: '#3B82F6' },
  { name: 'Screening', value: 45, color: '#8B5CF6' },
  { name: 'Interview', value: 18, color: '#10B981' },
  { name: 'Offer', value: 4, color: '#F59E0B' },
];

// Report templates
const reportTemplates = [
  {
    id: 'interview-performance',
    name: 'Interview Performance Summary',
    icon: 'users',
    metrics: ['interviews', 'offers', 'conversionRate'],
    description: 'Analyze your interview success rate and performance trends'
  },
  {
    id: 'application-funnel',
    name: 'Application Funnel',
    icon: 'briefcase',
    metrics: ['applications', 'screening', 'interviews', 'offers'],
    description: 'Track candidates through each stage of the application process'
  },
  {
    id: 'salary-progression',
    name: 'Salary Progression',
    icon: 'dollar-sign',
    metrics: ['salaryOffers', 'averageSalary', 'salaryTrend'],
    description: 'Monitor salary offers and compensation trends'
  },
  {
    id: 'company-insights',
    name: 'Company Insights',
    icon: 'building',
    metrics: ['companiesApplied', 'responseRate', 'topCompanies'],
    description: 'View application metrics by company'
  },
  {
    id: 'time-analysis',
    name: 'Time Analysis',
    icon: 'clock',
    metrics: ['timeToInterview', 'timeToOffer', 'applicationVelocity'],
    description: 'Understand time metrics in your job search'
  },
];

// Available metrics
const availableMetrics = [
  { id: 'applications', label: 'Applications Submitted', category: 'Activity' },
  { id: 'interviews', label: 'Interviews Conducted', category: 'Activity' },
  { id: 'offers', label: 'Offers Received', category: 'Results' },
  { id: 'screening', label: 'Screening Calls', category: 'Activity' },
  { id: 'rejections', label: 'Rejections', category: 'Results' },
  { id: 'responseRate', label: 'Response Rate', category: 'Metrics' },
  { id: 'conversionRate', label: 'Interview Conversion Rate', category: 'Metrics' },
  { id: 'avgSalary', label: 'Average Salary Offer', category: 'Compensation' },
  { id: 'timeToResponse', label: 'Time to Response', category: 'Timing' },
  { id: 'timeToInterview', label: 'Time to Interview', category: 'Timing' },
];

const chartColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function CustomReports() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState(['applications', 'interviews', 'offers']);
  const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2024-12-31' });
  const [filters, setFilters] = useState({ company: '', role: '', industry: '' });
  const [chartType, setChartType] = useState('line'); // 'line', 'bar', 'pie'
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setSelectedMetrics(template.metrics);
  };

  const toggleMetric = (metricId) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(m => m !== metricId)
        : [...prev, metricId]
    );
  };

  const handleGenerate = () => {
    // In real implementation, this would call the backend API
    console.log('Generating report with:', {
      template: selectedTemplate?.id,
      metrics: selectedMetrics,
      dateRange,
      filters,
    });
  };

  const handleExport = (format) => {
    // Placeholder for export functionality
    console.log(`Exporting report as ${format}`);
    alert(`Export as ${format} - Feature coming soon when backend is ready!`);
    setShowExportDialog(false);
  };

  const handleShare = () => {
    // Placeholder for share functionality
    console.log('Sharing report');
    alert('Share functionality coming soon!');
    setShowShareDialog(false);
  };

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dummyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedMetrics.map((metric, idx) => (
                <Bar 
                  key={metric} 
                  dataKey={metric} 
                  fill={chartColors[idx % chartColors.length]} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'line':
      default:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={dummyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedMetrics.map((metric, idx) => (
                <Line 
                  key={metric}
                  type="monotone" 
                  dataKey={metric} 
                  stroke={chartColors[idx % chartColors.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Custom Report Builder</h1>
          <p className="text-gray-600">
            Generate custom reports to analyze your job search performance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Templates */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700">
                <Icon name="file-text" size="sm" />
                Report Templates
              </h2>
              <div className="space-y-2">
                {reportTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon name={template.icon} size="sm" className="mt-1 text-gray-600" />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{template.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Configuration Panel */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-blue-700">Report Configuration</h2>
              
              {/* Metrics Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Metrics
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableMetrics.map((metric) => (
                    <button
                      key={metric.id}
                      onClick={() => toggleMetric(metric.id)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                        selectedMetrics.includes(metric.id)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {metric.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filters
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={filters.company}
                    onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Companies</option>
                    <option value="google">Google</option>
                    <option value="microsoft">Microsoft</option>
                    <option value="amazon">Amazon</option>
                  </select>
                  <select
                    value={filters.role}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Roles</option>
                    <option value="engineer">Software Engineer</option>
                    <option value="designer">Designer</option>
                    <option value="manager">Product Manager</option>
                  </select>
                  <select
                    value={filters.industry}
                    onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Industries</option>
                    <option value="tech">Technology</option>
                    <option value="finance">Finance</option>
                    <option value="healthcare">Healthcare</option>
                  </select>
                </div>
              </div>

              {/* Chart Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chart Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      chartType === 'line'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Icon name="trending-up" size="sm" className="inline mr-2" />
                    Line Chart
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      chartType === 'bar'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Icon name="bar-chart-2" size="sm" className="inline mr-2" />
                    Bar Chart
                  </button>
                  <button
                    onClick={() => setChartType('pie')}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      chartType === 'pie'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Icon name="pie-chart" size="sm" className="inline mr-2" />
                    Pie Chart
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="play" size="sm" />
                Generate Report
              </button>
            </Card>

            {/* Report Preview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-blue-700">Report Preview</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowShareDialog(true)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Icon name="share-2" size="sm" />
                    Share
                  </button>
                  <button
                    onClick={() => setShowExportDialog(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <Icon name="download" size="sm" />
                    Export
                  </button>
                </div>
              </div>

              {/* Chart */}
              <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                {renderChart()}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Applications</div>
                  <div className="text-2xl font-bold text-blue-600">65</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Interviews</div>
                  <div className="text-2xl font-bold text-purple-600">18</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Offers</div>
                  <div className="text-2xl font-bold text-green-600">4</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Success Rate</div>
                  <div className="text-2xl font-bold text-orange-600">6.2%</div>
                </div>
              </div>

              {/* Insights Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-700">
                  <Icon name="lightbulb" size="sm" className="text-blue-600" />
                  Insights & Recommendations
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Icon name="check-circle" size="sm" className="text-green-600 mt-1" />
                    <p className="text-sm text-gray-700">
                      <strong>Strong Performance:</strong> Your interview conversion rate is above average at 27.7%.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon name="trending-up" size="sm" className="text-blue-600 mt-1" />
                    <p className="text-sm text-gray-700">
                      <strong>Positive Trend:</strong> Application volume has increased 67% over the past month.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon name="alert-circle" size="sm" className="text-orange-600 mt-1" />
                    <p className="text-sm text-gray-700">
                      <strong>Recommendation:</strong> Consider focusing on quality over quantity - your success rate suggests targeted applications work well.
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                    <p className="text-xs text-gray-500 italic">
                      💡 Advanced insights powered by UC-099 and UC-105 analytics will appear here once backend integration is complete.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Export Report</h3>
            <p className="text-gray-600 mb-4">Choose your preferred export format:</p>
            <div className="space-y-2 mb-6">
              <button
                onClick={() => handleExport('PDF')}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center gap-3 transition-all"
              >
                <Icon name="file-text" size="sm" className="text-red-600" />
                <div className="text-left">
                  <div className="font-medium">Export as PDF</div>
                  <div className="text-sm text-gray-500">Best for sharing and printing</div>
                </div>
              </button>
              <button
                onClick={() => handleExport('Excel')}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center gap-3 transition-all"
              >
                <Icon name="file" size="sm" className="text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Export as Excel</div>
                  <div className="text-sm text-gray-500">Best for data analysis</div>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowExportDialog(false)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Share Report</h3>
            <p className="text-gray-600 mb-4">Share this report with mentors, coaches, or accountability partners:</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="mentor@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (Optional)
              </label>
              <textarea
                rows="3"
                placeholder="Add a personal message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Send Report
              </button>
              <button
                onClick={() => setShowShareDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs text-gray-500">
                💡 Share link feature coming soon! Backend integration required.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
