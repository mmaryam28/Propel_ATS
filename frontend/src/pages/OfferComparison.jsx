import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com';

export default function OfferComparison() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScenario, setShowScenario] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [scenarioData, setScenarioData] = useState({});
  const [scenarioResult, setScenarioResult] = useState(null);

  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) {
      loadComparison(ids);
    }
  }, [searchParams]);

  const loadComparison = async (ids) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/offers/compare?ids=${ids}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComparison(response.data);
    } catch (error) {
      console.error('Error loading comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  const runScenario = async () => {
    if (!selectedOfferId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/offers/${selectedOfferId}/scenario`,
        scenarioData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setScenarioResult(response.data);
    } catch (error) {
      console.error('Error running scenario:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading comparison...</div>;
  }

  if (!comparison || !comparison.offers || comparison.offers.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">No offers to compare</p>
        <button
          onClick={() => navigate('/offers')}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          Back to Offers
        </button>
      </div>
    );
  }

  const { offers, bestOverall, highestComp, bestValue } = comparison;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Offer Comparison</h1>
        <button
          onClick={() => navigate('/offers')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          ← Back to Offers
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
          <div className="text-sm text-green-600 font-semibold mb-1">🏆 Best Overall</div>
          <div className="text-xl font-bold">{bestOverall?.company}</div>
          <div className="text-sm text-gray-600">{bestOverall?.position}</div>
          <div className="text-lg font-semibold text-green-600 mt-2">
            Score: {bestOverall?.weighted_score?.toFixed(1)}/10
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-semibold mb-1">💰 Highest Compensation</div>
          <div className="text-xl font-bold">{highestComp?.company}</div>
          <div className="text-sm text-gray-600">{highestComp?.position}</div>
          <div className="text-lg font-semibold text-blue-600 mt-2">
            {formatCurrency(highestComp?.total_compensation)}
          </div>
        </div>

        <div className="bg-purple-50 border-2 border-purple-500 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-semibold mb-1">📊 Best Value (COL Adjusted)</div>
          <div className="text-xl font-bold">{bestValue?.company}</div>
          <div className="text-sm text-gray-600">{bestValue?.position}</div>
          <div className="text-lg font-semibold text-purple-600 mt-2">
            {formatCurrency(bestValue?.col_adjusted_salary)}
          </div>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold sticky left-0 bg-gray-100">
                  Metric
                </th>
                {offers.map(offer => (
                  <th key={offer.id} className="px-4 py-3 text-center text-sm font-semibold">
                    {offer.company}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {/* Position */}
              <tr>
                <td className="px-4 py-3 font-medium sticky left-0 bg-white">Position</td>
                {offers.map(offer => (
                  <td key={offer.id} className="px-4 py-3 text-center">{offer.position}</td>
                ))}
              </tr>

              {/* Location */}
              <tr>
                <td className="px-4 py-3 font-medium sticky left-0 bg-white">Location</td>
                {offers.map(offer => (
                  <td key={offer.id} className="px-4 py-3 text-center">
                    {offer.location}
                    <div className="text-xs text-gray-500">{offer.remote_policy}</div>
                  </td>
                ))}
              </tr>

              {/* Compensation */}
              <tr className="bg-gray-50">
                <td colSpan={offers.length + 1} className="px-4 py-2 font-bold text-sm">
                  💰 Compensation
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 font-medium sticky left-0 bg-white">Base Salary</td>
                {offers.map(offer => (
                  <td key={offer.id} className="px-4 py-3 text-center font-semibold">
                    {formatCurrency(offer.base_salary)}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="px-4 py-3 font-medium sticky left-0 bg-white">Annual Bonus</td>
                {offers.map(offer => (
                  <td key={offer.id} className="px-4 py-3 text-center">
                    {formatCurrency(offer.bonus)}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="px-4 py-3 font-medium sticky left-0 bg-white">Equity Value</td>
                {offers.map(offer => (
                  <td key={offer.id} className="px-4 py-3 text-center">
                    {formatCurrency(offer.equity_value)}
                  </td>
                ))}
              </tr>

              <tr className="bg-green-50">
                <td className="px-4 py-3 font-bold sticky left-0 bg-green-50">Total Compensation</td>
                {offers.map(offer => (
                  <td key={offer.id} className="px-4 py-3 text-center font-bold text-green-600">
                    {formatCurrency(offer.total_compensation)}
                  </td>
                ))}
              </tr>

              <tr className="bg-purple-50">
                <td className="px-4 py-3 font-bold sticky left-0 bg-purple-50">
                  COL Adjusted
                  <div className="text-xs font-normal text-gray-500">
                    (Purchasing Power)
                  </div>
                </td>
                {offers.map(offer => (
                  <td key={offer.id} className="px-4 py-3 text-center">
                    <div className="font-bold text-purple-600">
                      {formatCurrency(offer.col_adjusted_salary)}
                    </div>
                    <div className="text-xs text-gray-500">
                      COL Index: {offer.col_index}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Benefits */}
              <tr className="bg-gray-50">
                <td colSpan={offers.length + 1} className="px-4 py-2 font-bold text-sm">
                  🎁 Benefits
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 font-medium sticky left-0 bg-white">PTO Days</td>
                {offers.map(offer => (
                  <td key={offer.id} className="px-4 py-3 text-center">
                    {offer.pto_days || 'N/A'}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="px-4 py-3 font-medium sticky left-0 bg-white">401k Match</td>
                {offers.map(offer => (
                  <td key={offer.id} className="px-4 py-3 text-center">
                    {offer.retirement_match_percent ? `${offer.retirement_match_percent}%` : 'N/A'}
                  </td>
                ))}
              </tr>

              {/* Scores */}
              <tr className="bg-gray-50">
                <td colSpan={offers.length + 1} className="px-4 py-2 font-bold text-sm">
                  ⭐ Evaluation Scores
                </td>
              </tr>

              {[
                { key: 'culture_fit_score', label: 'Culture Fit' },
                { key: 'growth_opportunities_score', label: 'Growth' },
                { key: 'work_life_balance_score', label: 'Work-Life Balance' },
                { key: 'team_quality_score', label: 'Team Quality' },
                { key: 'mission_alignment_score', label: 'Mission' },
              ].map(({ key, label }) => (
                <tr key={key}>
                  <td className="px-4 py-3 font-medium sticky left-0 bg-white">{label}</td>
                  {offers.map(offer => (
                    <td key={offer.id} className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>{offer[key] || 0}</span>
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${((offer[key] || 0) / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}

              <tr className="bg-blue-50">
                <td className="px-4 py-3 font-bold sticky left-0 bg-blue-50">
                  Weighted Score
                </td>
                {offers.map(offer => (
                  <td key={offer.id} className="px-4 py-3 text-center font-bold text-blue-600 text-lg">
                    {offer.weighted_score?.toFixed(1)}/10
                  </td>
                ))}
              </tr>

              {/* Rankings */}
              <tr className="bg-gray-50">
                <td colSpan={offers.length + 1} className="px-4 py-2 font-bold text-sm">
                  🏅 Rankings
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 font-medium sticky left-0 bg-white">Overall Rank</td>
                {offers.map(offer => (
                  <td key={offer.id} className="px-4 py-3 text-center">
                    #{offer.rank_by_weighted_score}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="px-4 py-3 font-medium sticky left-0 bg-white">Comp Rank</td>
                {offers.map(offer => (
                  <td key={offer.id} className="px-4 py-3 text-center">
                    #{offer.rank_by_total_comp}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="px-4 py-3 font-medium sticky left-0 bg-white">Value Rank</td>
                {offers.map(offer => (
                  <td key={offer.id} className="px-4 py-3 text-center">
                    #{offer.rank_by_col_adjusted}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenario Analysis */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">💡 Scenario Analysis</h2>
        <p className="text-gray-600 mb-4">
          What if you could negotiate different terms? Test scenarios to see how they affect the total value.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Offer</label>
            <select
              value={selectedOfferId || ''}
              onChange={(e) => setSelectedOfferId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Choose an offer...</option>
              {offers.map(offer => (
                <option key={offer.id} value={offer.id}>
                  {offer.company} - {offer.position}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedOfferId && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Adjust Values:</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">New Base Salary</label>
                <input
                  type="number"
                  placeholder="Leave blank for no change"
                  onChange={(e) => setScenarioData({...scenarioData, base_salary: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Bonus</label>
                <input
                  type="number"
                  placeholder="Leave blank for no change"
                  onChange={(e) => setScenarioData({...scenarioData, bonus: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Equity Value</label>
                <input
                  type="number"
                  placeholder="Leave blank for no change"
                  onChange={(e) => setScenarioData({...scenarioData, equity_value: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <button
              onClick={runScenario}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Calculate Scenario
            </button>

            {scenarioResult && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-3">Scenario Results:</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Compensation</div>
                    <div className="font-semibold">
                      {formatCurrency(scenarioResult.modified.total_compensation)}
                    </div>
                    <div className="text-sm text-green-600">
                      +{formatCurrency(scenarioResult.difference.total_compensation)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">COL Adjusted</div>
                    <div className="font-semibold">
                      {formatCurrency(scenarioResult.modified.col_adjusted_salary)}
                    </div>
                    <div className="text-sm text-green-600">
                      +{formatCurrency(scenarioResult.difference.col_adjusted_salary)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Weighted Score</div>
                    <div className="font-semibold">
                      {scenarioResult.modified.weighted_score?.toFixed(1)}/10
                    </div>
                    <div className="text-sm text-green-600">
                      +{scenarioResult.difference.weighted_score?.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
