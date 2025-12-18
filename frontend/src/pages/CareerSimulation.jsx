import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { simulationApi } from '../api/simulation';
import { TrendingUp, Target, Zap, Plus, Trash2, RefreshCw } from 'lucide-react';

export default function CareerSimulation() {
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadSimulations();
  }, []);

  async function loadSimulations() {
    try {
      const { data } = await simulationApi.listSimulations();
      setSimulations(data);
    } catch (err) {
      console.error('Failed to load simulations:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this simulation? This cannot be undone.')) return;

    try {
      await simulationApi.deleteSimulation(id);
      setSimulations(simulations.filter(s => s.id !== id));
    } catch (err) {
      alert('Failed to delete simulation');
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
        <div className="text-gray-600">Loading simulations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Career Path Simulation</h1>
          <p className="text-sm text-gray-600 mt-1">
            Model different career trajectories and make strategic decisions
          </p>
        </div>
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4" />
          New Simulation
        </button>
      </div>

      {/* Empty State */}
      {simulations.length === 0 ? (
        <div className="page-card p-12 text-center">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Simulations Yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first career path simulation to explore different job trajectories,
            salary projections, and make data-driven decisions.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Your First Simulation
          </button>
        </div>
      ) : (
        /* Simulation Cards Grid */
        <div className="grid gap-6 md:grid-cols-2">
          {simulations.map(sim => (
            <div key={sim.id} className="page-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Link
                    to={`/simulation/${sim.id}`}
                    className="text-lg font-semibold text-[var(--primary-color)] hover:underline"
                  >
                    {sim.simulationName}
                  </Link>
                  <div className="text-sm text-gray-600 mt-1">
                    {sim.startingRole} • {sim.industry}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(sim.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete simulation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500">Starting</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(sim.startingSalary)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Years</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {sim.simulationYears}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Avg Lifetime</div>
                  <div className="text-sm font-semibold text-green-600">
                    {formatCurrency(sim.lifetimeEarningsAvg)}
                  </div>
                </div>
              </div>

              {/* Scenario Comparison */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    <Zap className="w-3 h-3 inline mr-1 text-green-500" />
                    Best Case
                  </span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(sim.lifetimeEarningsBest)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    <Target className="w-3 h-3 inline mr-1 text-blue-500" />
                    Average Case
                  </span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(sim.lifetimeEarningsAvg)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    <TrendingUp className="w-3 h-3 inline mr-1 text-orange-500" />
                    Worst Case
                  </span>
                  <span className="font-medium text-orange-600">
                    {formatCurrency(sim.lifetimeEarningsWorst)}
                  </span>
                </div>
              </div>

              {/* Recommendations Preview */}
              {sim.recommendations && sim.recommendations.length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-xs font-medium text-gray-700 mb-2">
                    Top Recommendation:
                  </div>
                  <div className="text-sm text-gray-600">
                    {sim.recommendations[0].title}
                  </div>
                </div>
              )}

              {/* View Details Button */}
              <div className="mt-4 pt-4 border-t">
                <Link
                  to={`/simulation/${sim.id}`}
                  className="text-sm text-[var(--primary-color)] hover:underline flex items-center gap-1"
                >
                  View Full Simulation
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="text-xs text-gray-400 mt-2">
                Created {new Date(sim.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Simulation Modal */}
      {showCreateModal && (
        <CreateSimulationModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newSim) => {
            setSimulations([newSim, ...simulations]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function CreateSimulationModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    simulationName: '',
    startingRole: '',
    startingSalary: '',
    industry: 'Technology',
    companySize: 'medium',
    simulationYears: 10,
    workLifeBalanceWeight: 0.33,
    salaryWeight: 0.33,
    learningWeight: 0.34,
    riskTolerance: 'moderate',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate weights sum to ~1
    const totalWeight = formData.workLifeBalanceWeight + formData.salaryWeight + formData.learningWeight;
    if (Math.abs(totalWeight - 1) > 0.01) {
      setError('Weights must sum to 1.0');
      setLoading(false);
      return;
    }

    try {
      const { data } = await simulationApi.createSimulation({
        ...formData,
        startingSalary: parseInt(formData.startingSalary),
      });
      onCreated(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create simulation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create Career Simulation</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Simulation Name *
              </label>
              <input
                type="text"
                name="simulationName"
                value={formData.simulationName}
                onChange={handleChange}
                className="input w-full"
                placeholder="e.g., Tech Career Path 2025"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Starting Role *
                </label>
                <input
                  type="text"
                  name="startingRole"
                  value={formData.startingRole}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Software Engineer"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Starting Salary *
                </label>
                <input
                  type="number"
                  name="startingSalary"
                  value={formData.startingSalary}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="100000"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="input w-full"
                >
                  <option>Technology</option>
                  <option>Finance</option>
                  <option>Healthcare</option>
                  <option>Consulting</option>
                  <option>Education</option>
                  <option>Manufacturing</option>
                  <option>Retail</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Size
                </label>
                <select
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleChange}
                  className="input w-full"
                >
                  <option value="startup">Startup (&lt;50)</option>
                  <option value="small">Small (50-200)</option>
                  <option value="medium">Medium (200-1000)</option>
                  <option value="large">Large (1000-10000)</option>
                  <option value="enterprise">Enterprise (10000+)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Simulation Length: {formData.simulationYears} years
              </label>
              <input
                type="range"
                name="simulationYears"
                value={formData.simulationYears}
                onChange={handleChange}
                className="w-full"
                min="5"
                max="20"
                step="1"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>5 years</span>
                <span>20 years</span>
              </div>
            </div>

            {/* Preferences */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Your Priorities (must sum to 1.0)
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Work-Life Balance: {formData.workLifeBalanceWeight.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    name="workLifeBalanceWeight"
                    value={formData.workLifeBalanceWeight}
                    onChange={handleChange}
                    className="w-full"
                    min="0"
                    max="1"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Salary Growth: {formData.salaryWeight.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    name="salaryWeight"
                    value={formData.salaryWeight}
                    onChange={handleChange}
                    className="w-full"
                    min="0"
                    max="1"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Learning & Growth: {formData.learningWeight.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    name="learningWeight"
                    value={formData.learningWeight}
                    onChange={handleChange}
                    className="w-full"
                    min="0"
                    max="1"
                    step="0.01"
                  />
                </div>

                <div className="text-xs text-gray-600">
                  Total: {(formData.workLifeBalanceWeight + formData.salaryWeight + formData.learningWeight).toFixed(2)}
                  {Math.abs((formData.workLifeBalanceWeight + formData.salaryWeight + formData.learningWeight) - 1) > 0.01 && (
                    <span className="text-red-600 ml-2">⚠️ Must equal 1.0</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Risk Tolerance
              </label>
              <select
                name="riskTolerance"
                value={formData.riskTolerance}
                onChange={handleChange}
                className="input w-full"
              >
                <option value="low">Low - Prefer stability</option>
                <option value="moderate">Moderate - Balanced approach</option>
                <option value="high">High - Willing to take risks</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Run Simulation
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
