import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';

// Dummy data for timeline forecast
const timelineData = [
  { week: 'Week 1', lower: 2, expected: 4, upper: 6 },
  { week: 'Week 2', lower: 3, expected: 5, upper: 8 },
  { week: 'Week 3', lower: 4, expected: 7, upper: 10 },
  { week: 'Week 4', lower: 5, expected: 8, upper: 12 },
  { week: 'Week 5', lower: 6, expected: 10, upper: 14 },
  { week: 'Week 6', lower: 7, expected: 12, upper: 16 },
];

// Dummy data for accuracy tracking
const accuracyData = [
  { month: 'Jan', accuracy: 65 },
  { month: 'Feb', accuracy: 70 },
  { month: 'Mar', accuracy: 73 },
  { month: 'Apr', accuracy: 78 },
  { month: 'May', accuracy: 82 },
  { month: 'Jun', accuracy: 85 },
];

// Dummy historical predictions
const historicalPredictions = [
  { date: '2024-10-15', prediction: 'Offer in 6 weeks', actual: 'Offer in 7 weeks', accuracy: '85%' },
  { date: '2024-09-20', prediction: '70% interview success', actual: '75% success rate', accuracy: '93%' },
  { date: '2024-08-10', prediction: '$95K-$105K salary', actual: '$102K offered', accuracy: '97%' },
  { date: '2024-07-05', prediction: '12 applications/week optimal', actual: '10 apps yielded best results', accuracy: '83%' },
];

export default function Forecasting() {
  // Scenario planner state
  const [scenarioInputs, setScenarioInputs] = useState({
    applicationsPerWeek: 10,
    prepHoursPerWeek: 5,
    targetRoles: 3,
    networkingEvents: 2,
  });

  const [scenarioResult, setScenarioResult] = useState(null);

  const handleScenarioChange = (field, value) => {
    setScenarioInputs({ ...scenarioInputs, [field]: value });
  };

  const runScenario = () => {
    // Dummy calculation - in real app, this would call backend
    const timeToOffer = Math.max(4, 12 - scenarioInputs.applicationsPerWeek * 0.3);
    const interviewChance = Math.min(95, 40 + scenarioInputs.prepHoursPerWeek * 8);
    const offerChance = Math.min(85, 20 + scenarioInputs.applicationsPerWeek * 2);
    
    setScenarioResult({
      timeToOffer: timeToOffer.toFixed(1),
      interviewChance: interviewChance.toFixed(0),
      offerChance: offerChance.toFixed(0),
      confidence: 78,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Forecasting & Performance Prediction
          </h1>
          <p className="text-gray-600">
            Predict future outcomes and plan your job search strategy with AI-powered forecasting
          </p>
        </div>

        {/* Top Row - Key Predictions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Interview Success Probability */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Interview Success</h3>
              <Icon name="target" size="sm" className="text-blue-600" />
            </div>
            <div className="mb-3">
              <div className="text-4xl font-bold text-blue-600">72%</div>
              <div className="text-xs text-gray-500 mt-1">Confidence: 85%</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-blue-600 h-3 rounded-full" style={{ width: '72%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Based on your preparation and historical performance
            </p>
          </Card>

          {/* Time to Offer */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Time to Offer</h3>
              <Icon name="clock" size="sm" className="text-purple-600" />
            </div>
            <div className="mb-3">
              <div className="text-4xl font-bold text-purple-600">6-8</div>
              <div className="text-xs text-gray-500 mt-1">weeks (Confidence: 80%)</div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1">
                <div className="text-xs text-gray-500">Optimistic</div>
                <div className="text-sm font-semibold">5 weeks</div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Pessimistic</div>
                <div className="text-sm font-semibold">10 weeks</div>
              </div>
            </div>
          </Card>

          {/* Salary Prediction */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Salary Forecast</h3>
              <Icon name="dollar-sign" size="sm" className="text-green-600" />
            </div>
            <div className="mb-3">
              <div className="text-2xl font-bold text-green-600">$95K-$110K</div>
              <div className="text-xs text-gray-500 mt-1">Confidence: 82%</div>
            </div>
            <div className="mt-3">
              <div className="text-xs text-gray-500">Most Likely</div>
              <div className="text-lg font-semibold text-gray-900">$102,500</div>
            </div>
          </Card>

          {/* Optimal Timing */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Best Time to Move</h3>
              <Icon name="calendar" size="sm" className="text-orange-600" />
            </div>
            <div className="mb-3">
              <div className="text-2xl font-bold text-orange-600">Q1 2025</div>
              <div className="text-xs text-gray-500 mt-1">Jan - Mar</div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-2">
                <Icon name="check-circle" size="xs" className="text-green-600" />
                <span className="text-xs text-gray-600">High hiring season</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="check-circle" size="xs" className="text-green-600" />
                <span className="text-xs text-gray-600">Budget refresh</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Timeline Forecast Chart */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-700">
            <Icon name="trending-up" size="sm" />
            Job Search Timeline Forecast
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Expected number of applications, interviews, and offers over the next 6 weeks
          </p>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="lower"
                stackId="1"
                stroke="#D1D5DB"
                fill="#F3F4F6"
                name="Lower Bound"
              />
              <Area
                type="monotone"
                dataKey="expected"
                stackId="2"
                stroke="#3B82F6"
                fill="#BFDBFE"
                name="Expected"
              />
              <Area
                type="monotone"
                dataKey="upper"
                stackId="3"
                stroke="#9CA3AF"
                fill="#E5E7EB"
                name="Upper Bound"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              💡 <strong>Forecast:</strong> Based on your current activity level, you're likely to receive
              your first offer in 6-8 weeks with 80% confidence.
            </p>
          </div>
        </Card>

        {/* Scenario Planner */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-purple-700">
            <Icon name="sliders" size="sm" />
            Scenario Planner
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Adjust your job search strategy and see predicted outcomes
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Input Controls */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applications per Week: {scenarioInputs.applicationsPerWeek}
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={scenarioInputs.applicationsPerWeek}
                  onChange={(e) => handleScenarioChange('applicationsPerWeek', parseInt(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>30</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prep Hours per Week: {scenarioInputs.prepHoursPerWeek}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={scenarioInputs.prepHoursPerWeek}
                  onChange={(e) => handleScenarioChange('prepHoursPerWeek', parseInt(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Roles: {scenarioInputs.targetRoles}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={scenarioInputs.targetRoles}
                  onChange={(e) => handleScenarioChange('targetRoles', parseInt(e.target.value))}
                  className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Networking Events per Month: {scenarioInputs.networkingEvents}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={scenarioInputs.networkingEvents}
                  onChange={(e) => handleScenarioChange('networkingEvents', parseInt(e.target.value))}
                  className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>

              <button
                onClick={runScenario}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="play" size="sm" />
                Run Scenario
              </button>
            </div>

            {/* Results */}
            <div>
              {scenarioResult ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold mb-4">Predicted Outcomes</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Time to Offer</div>
                        <div className="text-3xl font-bold text-blue-600">
                          {scenarioResult.timeToOffer} weeks
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 mb-1">Interview Success Rate</div>
                        <div className="text-3xl font-bold text-purple-600">
                          {scenarioResult.interviewChance}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${scenarioResult.interviewChance}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 mb-1">Offer Probability</div>
                        <div className="text-3xl font-bold text-green-600">
                          {scenarioResult.offerChance}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${scenarioResult.offerChance}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-blue-300">
                        <div className="text-sm text-gray-600">Model Confidence</div>
                        <div className="text-xl font-semibold text-gray-900">
                          {scenarioResult.confidence}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center p-6">
                    <Icon name="bar-chart-2" size="lg" className="text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Adjust parameters and click "Run Scenario" to see predictions</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Recommendations */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-700">
            <Icon name="lightbulb" size="sm" />
            Recommendations for Improving Outcomes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <Icon name="check-circle" size="sm" className="text-green-600 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Increase Application Quality</h4>
                <p className="text-sm text-gray-600">
                  Focus on 8-12 high-quality applications per week rather than mass applying. 
                  This could improve your offer rate by 23%.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Icon name="trending-up" size="sm" className="text-blue-600 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Boost Interview Prep</h4>
                <p className="text-sm text-gray-600">
                  Adding 3 more hours of interview preparation weekly could increase your 
                  success rate from 72% to 85%.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Icon name="users" size="sm" className="text-purple-600 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Expand Network</h4>
                <p className="text-sm text-gray-600">
                  Attending 2-3 networking events per month could reduce your time to offer 
                  by 2-3 weeks based on similar candidates.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <Icon name="target" size="sm" className="text-orange-600 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Optimize Timing</h4>
                <p className="text-sm text-gray-600">
                  Starting your intensive search in January could increase your offer 
                  probability by 15% due to Q1 hiring trends.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs text-gray-500 italic">
              💡 Advanced recommendations powered by UC-099 and UC-105 analytics will provide 
              personalized insights once backend integration is complete.
            </p>
          </div>
        </Card>

        {/* Model Accuracy Tracking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accuracy Over Time Chart */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-purple-700">
              <Icon name="activity" size="sm" />
              Model Accuracy Over Time
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  name="Accuracy %"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">85%</div>
                <div className="text-xs text-gray-500">Current Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">+20%</div>
                <div className="text-xs text-gray-500">6-Month Improvement</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">127</div>
                <div className="text-xs text-gray-500">Predictions Made</div>
              </div>
            </div>
          </Card>

          {/* Historical Predictions Table */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-purple-700">
              <Icon name="file-text" size="sm" />
              Prediction History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-gray-600 font-medium">Date</th>
                    <th className="text-left py-2 px-2 text-gray-600 font-medium">Prediction</th>
                    <th className="text-left py-2 px-2 text-gray-600 font-medium">Actual</th>
                    <th className="text-right py-2 px-2 text-gray-600 font-medium">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalPredictions.map((pred, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-500 text-xs">{pred.date}</td>
                      <td className="py-3 px-2 text-gray-900">{pred.prediction}</td>
                      <td className="py-3 px-2 text-gray-700">{pred.actual}</td>
                      <td className="py-3 px-2 text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {pred.accuracy}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-gray-600">
                📊 As more predictions are made and validated, model accuracy continues to improve.
              </p>
            </div>
          </Card>
        </div>

        {/* Bottom Info Banner */}
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Icon name="info" size="sm" className="text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">About These Predictions</h3>
              <p className="text-sm text-gray-700 mb-2">
                All forecasts are currently using placeholder data and simplified models. 
                Once UC-099 (Network ROI) and UC-105 (Pattern Recognition) analytics are integrated, 
                predictions will be powered by:
              </p>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• Machine learning models trained on historical job search data</li>
                <li>• Real-time market conditions and industry trends</li>
                <li>• Your personal performance metrics and preparation levels</li>
                <li>• Comparative analysis with similar successful candidates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
