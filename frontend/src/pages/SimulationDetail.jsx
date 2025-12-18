import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { simulationApi } from '../api/simulation';
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
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, ArrowLeft, Target, Lightbulb, AlertCircle, Edit, RefreshCw } from 'lucide-react';

export default function SimulationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, trajectories, decisions, recommendations

  useEffect(() => {
    loadSimulation();
  }, [id]);

  async function loadSimulation() {
    try {
      const { data } = await simulationApi.getSimulation(id);
      setSimulation(data);
    } catch (err) {
      console.error('Failed to load simulation:', err);
      alert('Simulation not found');
      navigate('/simulation');
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading simulation...</div>
      </div>
    );
  }

  if (!simulation) {
    return null;
  }

  // Prepare chart data
  const salaryChartData = simulation.averageCaseTrajectory.map((snapshot, idx) => ({
    year: snapshot.year,
    best: simulation.bestCaseTrajectory[idx]?.salary || 0,
    average: snapshot.salary,
    worst: simulation.worstCaseTrajectory[idx]?.salary || 0,
  }));

  const roleProgressionData = simulation.averageCaseTrajectory.map(snapshot => ({
    year: snapshot.year,
    role: snapshot.roleTitle,
    salary: snapshot.salary,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/simulation"
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Simulations
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{simulation.simulationName}</h1>
            <div className="text-sm text-gray-600 mt-1">
              {simulation.startingRole} • {simulation.industry} • {simulation.simulationYears} years
            </div>
          </div>
          <button
            className="btn btn-secondary text-sm"
            onClick={() => navigate(`/simulation/${id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Adjust Preferences
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="page-card p-4">
          <div className="text-xs text-gray-500 mb-1">Starting Salary</div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(simulation.startingSalary)}
          </div>
        </div>
        <div className="page-card p-4 bg-green-50 border-green-200">
          <div className="text-xs text-green-600 mb-1">Best Case Lifetime</div>
          <div className="text-xl font-bold text-green-700">
            {formatCurrency(simulation.lifetimeEarningsBest)}
          </div>
        </div>
        <div className="page-card p-4 bg-blue-50 border-blue-200">
          <div className="text-xs text-blue-600 mb-1">Average Case Lifetime</div>
          <div className="text-xl font-bold text-blue-700">
            {formatCurrency(simulation.lifetimeEarningsAvg)}
          </div>
        </div>
        <div className="page-card p-4 bg-orange-50 border-orange-200">
          <div className="text-xs text-orange-600 mb-1">Worst Case Lifetime</div>
          <div className="text-xl font-bold text-orange-700">
            {formatCurrency(simulation.lifetimeEarningsWorst)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'trajectories', label: 'Career Paths', icon: Target },
            { id: 'decisions', label: 'Decision Points', icon: AlertCircle },
            { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Salary Projection Chart */}
          <div className="page-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Salary Projection (All Scenarios)
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={salaryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" label={{ value: 'Years', position: 'insideBottom', offset: -5 }} />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  label={{ value: 'Salary', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(year) => `Year ${year}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="best"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.1}
                  name="Best Case"
                />
                <Area
                  type="monotone"
                  dataKey="average"
                  stackId="2"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="Average Case"
                />
                <Area
                  type="monotone"
                  dataKey="worst"
                  stackId="3"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.1}
                  name="Worst Case"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Your Priorities */}
          <div className="page-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Priorities</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Work-Life Balance</span>
                  <span className="font-medium">{(simulation.workLifeBalanceWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${simulation.workLifeBalanceWeight * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Salary Growth</span>
                  <span className="font-medium">{(simulation.salaryWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${simulation.salaryWeight * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Learning & Growth</span>
                  <span className="font-medium">{(simulation.learningWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${simulation.learningWeight * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Risk Tolerance: <span className="font-medium capitalize">{simulation.riskTolerance}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trajectories' && (
        <div className="space-y-6">
          {/* Role Progression Timeline */}
          <div className="page-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Career Progression (Average Case)
            </h3>
            <div className="space-y-4">
              {simulation.averageCaseTrajectory.map((snapshot, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                      Y{snapshot.year}
                    </div>
                    {idx < simulation.averageCaseTrajectory.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="font-medium text-gray-900">{snapshot.roleTitle}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {formatCurrency(snapshot.salary)} • {snapshot.companyType}
                    </div>
                    {snapshot.skillsAcquired && snapshot.skillsAcquired.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {snapshot.skillsAcquired.map((skill, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Probability</div>
                    <div className="text-sm font-medium text-gray-900">
                      {snapshot.probabilityScore.toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="page-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scenario Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Year</th>
                    <th className="text-left py-2 px-3 font-medium text-green-700">Best Case</th>
                    <th className="text-left py-2 px-3 font-medium text-blue-700">Average Case</th>
                    <th className="text-left py-2 px-3 font-medium text-orange-700">Worst Case</th>
                  </tr>
                </thead>
                <tbody>
                  {simulation.averageCaseTrajectory.map((snapshot, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{snapshot.year}</td>
                      <td className="py-2 px-3">
                        <div>{simulation.bestCaseTrajectory[idx]?.roleTitle}</div>
                        <div className="text-xs text-gray-600">
                          {formatCurrency(simulation.bestCaseTrajectory[idx]?.salary || 0)}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div>{snapshot.roleTitle}</div>
                        <div className="text-xs text-gray-600">
                          {formatCurrency(snapshot.salary)}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div>{simulation.worstCaseTrajectory[idx]?.roleTitle}</div>
                        <div className="text-xs text-gray-600">
                          {formatCurrency(simulation.worstCaseTrajectory[idx]?.salary || 0)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'decisions' && (
        <div className="space-y-4">
          {simulation.decisionPoints && simulation.decisionPoints.length > 0 ? (
            simulation.decisionPoints.map((point, idx) => (
              <div key={idx} className="page-card p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                    Y{point.year}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{point.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{point.description}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {point.options.map((option, optIdx) => (
                    <div
                      key={optIdx}
                      className="border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900 mb-2">{option.choice}</h4>
                      <p className="text-sm text-gray-600 mb-3">{option.impact}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-gray-500">Salary: </span>
                          <span className={`font-medium ${option.salaryDelta > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                            {option.salaryDelta > 0 ? '+' : ''}{option.salaryDelta}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Satisfaction: </span>
                          <span className={`font-medium ${option.satisfactionDelta > 0 ? 'text-green-600' : option.satisfactionDelta < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {option.satisfactionDelta > 0 ? '+' : ''}{option.satisfactionDelta}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="page-card p-12 text-center text-gray-500">
              No decision points identified
            </div>
          )}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {simulation.recommendations && simulation.recommendations.length > 0 ? (
            simulation.recommendations.map((rec, idx) => (
              <div key={idx} className="page-card p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      rec.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : rec.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          rec.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : rec.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {rec.priority} priority
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded capitalize">
                        {rec.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-gray-500">Timeframe:</span>
                        <span className="ml-2 font-medium text-gray-900">{rec.timeframe}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Expected Impact:</span>
                        <span className="ml-2 font-medium text-gray-900">{rec.expectedImpact}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="page-card p-12 text-center text-gray-500">
              No recommendations available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
