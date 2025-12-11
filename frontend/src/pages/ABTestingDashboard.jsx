import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
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
import * as api from '../lib/api';

export default function ABTestingDashboard() {
  const [experiments, setExperiments] = useState([]);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);

  useEffect(() => {
    loadExperiments();
  }, []);

  useEffect(() => {
    if (selectedExperiment) {
      loadDashboard(selectedExperiment.id);
    }
  }, [selectedExperiment]);

  const loadExperiments = async () => {
    try {
      const data = await api.getExperiments();
      setExperiments(data);
      if (data.length > 0 && !selectedExperiment) {
        setSelectedExperiment(data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading experiments:', error);
      setLoading(false);
    }
  };

  const loadDashboard = async (experimentId) => {
    try {
      const data = await api.getExperimentDashboard(experimentId);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const handleCreateExperiment = async (formData) => {
    try {
      await api.createExperiment(formData);
      await loadExperiments();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating experiment:', error);
      alert('Failed to create experiment');
    }
  };

  const handleAddVariant = async (formData) => {
    try {
      await api.addVariant(selectedExperiment.id, formData);
      await loadDashboard(selectedExperiment.id);
      setShowAddVariantModal(false);
    } catch (error) {
      console.error('Error adding variant:', error);
      alert('Failed to add variant');
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await api.updateExperimentStatus(selectedExperiment.id, status);
      await loadExperiments();
      await loadDashboard(selectedExperiment.id);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleArchiveVariant = async (variantId) => {
    if (!confirm('Are you sure you want to archive this variant?')) return;
    
    try {
      await api.archiveVariant(variantId);
      await loadDashboard(selectedExperiment.id);
    } catch (error) {
      console.error('Error archiving variant:', error);
      alert('Failed to archive variant');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading A/B Tests...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">A/B Testing Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Test different resume and cover letter versions to optimize your application success rate
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Icon name="PlusIcon" className="w-5 h-5" />
          New Experiment
        </button>
      </div>

      {experiments.length === 0 ? (
        <Card>
          <Card.Body>
            <div className="text-center py-12">
              <Icon name="BeakerIcon" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Experiments Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first A/B test to compare different versions of your application materials
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create First Experiment
              </button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Experiments List Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <Card.Header>
                <Card.Title>Experiments</Card.Title>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="divide-y">
                  {experiments.map((exp) => (
                    <button
                      key={exp.id}
                      onClick={() => setSelectedExperiment(exp)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selectedExperiment?.id === exp.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="font-semibold text-gray-900 truncate">{exp.experiment_name}</div>
                      <div className="text-sm text-gray-600 mt-1 capitalize">{exp.material_type}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          exp.status === 'active' ? 'bg-green-100 text-green-800' :
                          exp.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          exp.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {exp.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {exp.variants?.length || 0} variants
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Main Dashboard Area */}
          <div className="lg:col-span-3 space-y-6">
            {selectedExperiment && dashboardData && (
              <>
                {/* Experiment Controls */}
                <Card>
                  <Card.Body>
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedExperiment.experiment_name}</h2>
                        <p className="text-gray-600 mt-1">{dashboardData.experiment.notes}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowAddVariantModal(true)}
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Add Variant
                        </button>
                        {selectedExperiment.status === 'active' && (
                          <button
                            onClick={() => handleUpdateStatus('paused')}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                          >
                            Pause
                          </button>
                        )}
                        {selectedExperiment.status === 'paused' && (
                          <button
                            onClick={() => handleUpdateStatus('active')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Resume
                          </button>
                        )}
                        {selectedExperiment.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateStatus('completed')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <Card.Body>
                      <div className="text-sm font-medium text-gray-600">Total Applications</div>
                      <div className="text-3xl font-bold text-blue-600 mt-2">
                        {dashboardData.summary.total_applications}
                      </div>
                    </Card.Body>
                  </Card>
                  <Card>
                    <Card.Body>
                      <div className="text-sm font-medium text-gray-600">Responses</div>
                      <div className="text-3xl font-bold text-green-600 mt-2">
                        {dashboardData.summary.total_responses}
                      </div>
                    </Card.Body>
                  </Card>
                  <Card>
                    <Card.Body>
                      <div className="text-sm font-medium text-gray-600">Response Rate</div>
                      <div className="text-3xl font-bold text-purple-600 mt-2">
                        {dashboardData.summary.overall_response_rate.toFixed(1)}%
                      </div>
                    </Card.Body>
                  </Card>
                  <Card>
                    <Card.Body>
                      <div className="text-sm font-medium text-gray-600">Variants</div>
                      <div className="text-3xl font-bold text-gray-900 mt-2">
                        {dashboardData.results.length}
                      </div>
                    </Card.Body>
                  </Card>
                </div>

                {/* Insights */}
                {dashboardData.insights && dashboardData.insights.length > 0 && (
                  <Card>
                    <Card.Header>
                      <Card.Title>Key Insights</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <div className="space-y-3">
                        {dashboardData.insights.map((insight, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                            <Icon name="LightBulbIcon" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-gray-900">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                )}

                {/* Winning Variant */}
                {dashboardData.winningVariant && (
                  <Card className="border-2 border-green-500">
                    <Card.Header className="bg-green-50">
                      <div className="flex items-center gap-2">
                        <Icon name="TrophyIcon" className="w-6 h-6 text-green-600" />
                        <Card.Title className="text-green-900">Winning Variant</Card.Title>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {dashboardData.winningVariant.variant.variant_name}
                          </h3>
                          <p className="text-gray-600">{dashboardData.winningVariant.variant.description}</p>
                          <div className="mt-4 space-y-2">
                            {dashboardData.winningVariant.variant.format_type && (
                              <div className="text-sm">
                                <span className="font-medium">Format:</span> {dashboardData.winningVariant.variant.format_type}
                              </div>
                            )}
                            {dashboardData.winningVariant.variant.design_style && (
                              <div className="text-sm">
                                <span className="font-medium">Style:</span> {dashboardData.winningVariant.variant.design_style}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-lg border">
                            <div className="text-sm text-gray-600">Response Rate</div>
                            <div className="text-2xl font-bold text-green-600 mt-1">
                              {dashboardData.winningVariant.response_rate}%
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-lg border">
                            <div className="text-sm text-gray-600">Interview Rate</div>
                            <div className="text-2xl font-bold text-blue-600 mt-1">
                              {dashboardData.winningVariant.interview_conversion_rate}%
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-lg border">
                            <div className="text-sm text-gray-600">Offer Rate</div>
                            <div className="text-2xl font-bold text-purple-600 mt-1">
                              {dashboardData.winningVariant.offer_rate}%
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-lg border">
                            <div className="text-sm text-gray-600">Sample Size</div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">
                              {dashboardData.winningVariant.total_applications}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                )}

                {/* Variants Comparison Chart */}
                <Card>
                  <Card.Header>
                    <Card.Title>Variant Performance Comparison</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    {dashboardData.results.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={dashboardData.results.map(r => ({
                          name: r.variant.variant_name,
                          'Response Rate': r.response_rate,
                          'Interview Rate': r.interview_conversion_rate,
                          'Offer Rate': r.offer_rate,
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Response Rate" fill="#3b82f6" />
                          <Bar dataKey="Interview Rate" fill="#10b981" />
                          <Bar dataKey="Offer Rate" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        Add variants to see performance comparison
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
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variant</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Applications</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Response Rate</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Response Time</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Interview Rate</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Offer Rate</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Significant</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {dashboardData.results.map((result) => (
                            <tr key={result.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">{result.variant.variant_name}</div>
                                <div className="text-sm text-gray-500">{result.variant.description}</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="font-semibold">{result.total_applications}</span>
                                <div className="text-xs text-gray-500">
                                  {result.total_applications < selectedExperiment.minimum_sample_size && (
                                    <span className="text-amber-600">
                                      Need {selectedExperiment.minimum_sample_size - result.total_applications} more
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="font-semibold text-blue-600">{result.response_rate}%</span>
                                <div className="text-xs text-gray-500">{result.total_responses} responses</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {result.avg_time_to_response_hours ? (
                                  <>
                                    <span className="font-semibold">{Math.round(result.avg_time_to_response_hours / 24)}</span>
                                    <span className="text-sm text-gray-500"> days</span>
                                  </>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="font-semibold text-green-600">{result.interview_conversion_rate}%</span>
                                <div className="text-xs text-gray-500">{result.total_interviews} interviews</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="font-semibold text-purple-600">{result.offer_rate}%</span>
                                <div className="text-xs text-gray-500">{result.total_offers} offers</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {result.is_statistically_significant ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                    <Icon name="CheckCircleIcon" className="w-4 h-4 mr-1" />
                                    Yes
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                    No
                                  </span>
                                )}
                                {result.p_value && (
                                  <div className="text-xs text-gray-500 mt-1">p={result.p_value}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleArchiveVariant(result.variant.id)}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Archive
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card.Body>
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Experiment Modal */}
      {showCreateModal && (
        <CreateExperimentModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateExperiment}
        />
      )}

      {/* Add Variant Modal */}
      {showAddVariantModal && selectedExperiment && (
        <AddVariantModal
          experimentId={selectedExperiment.id}
          materialType={selectedExperiment.material_type}
          onClose={() => setShowAddVariantModal(false)}
          onAdd={handleAddVariant}
        />
      )}
    </div>
  );
}

// Create Experiment Modal Component
function CreateExperimentModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    experiment_name: '',
    material_type: 'resume',
    minimum_sample_size: 10,
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Experiment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experiment Name</label>
            <input
              type="text"
              value={formData.experiment_name}
              onChange={(e) => setFormData({ ...formData, experiment_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Resume Format Test Q1 2024"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
            <select
              value={formData.material_type}
              onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="resume">Resume Only</option>
              <option value="cover_letter">Cover Letter Only</option>
              <option value="both">Both Resume & Cover Letter</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Sample Size per Variant</label>
            <input
              type="number"
              value={formData.minimum_sample_size}
              onChange={(e) => setFormData({ ...formData, minimum_sample_size: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="5"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Recommended: 10+ applications per variant for statistical significance</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="What are you testing? What do you hope to learn?"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Experiment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Variant Modal Component
function AddVariantModal({ experimentId, materialType, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    variant_name: '',
    resume_version_id: '',
    cover_letter_version_id: '',
    description: '',
    format_type: '',
    length_pages: '',
    word_count: '',
    design_style: '',
    has_photo: false,
    has_color: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...formData,
      length_pages: formData.length_pages ? parseFloat(formData.length_pages) : undefined,
      word_count: formData.word_count ? parseInt(formData.word_count) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Variant</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name *</label>
            <input
              type="text"
              value={formData.variant_name}
              onChange={(e) => setFormData({ ...formData, variant_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Version A - Minimal Design"
              required
            />
          </div>

          {(materialType === 'resume' || materialType === 'both') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resume Version ID</label>
              <input
                type="text"
                value={formData.resume_version_id}
                onChange={(e) => setFormData({ ...formData, resume_version_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="UUID from your resume versions"
              />
            </div>
          )}

          {(materialType === 'cover_letter' || materialType === 'both') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter Version ID</label>
              <input
                type="text"
                value={formData.cover_letter_version_id}
                onChange={(e) => setFormData({ ...formData, cover_letter_version_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="UUID from your cover letter versions"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="2"
              placeholder="What makes this variant unique?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format Type</label>
              <select
                value={formData.format_type}
                onChange={(e) => setFormData({ ...formData, format_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select...</option>
                <option value="chronological">Chronological</option>
                <option value="functional">Functional</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Design Style</label>
              <select
                value={formData.design_style}
                onChange={(e) => setFormData({ ...formData, design_style: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select...</option>
                <option value="minimal">Minimal</option>
                <option value="modern">Modern</option>
                <option value="creative">Creative</option>
                <option value="professional">Professional</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Length (pages)</label>
              <input
                type="number"
                step="0.5"
                value={formData.length_pages}
                onChange={(e) => setFormData({ ...formData, length_pages: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 1.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Word Count</label>
              <input
                type="number"
                value={formData.word_count}
                onChange={(e) => setFormData({ ...formData, word_count: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 450"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.has_photo}
                onChange={(e) => setFormData({ ...formData, has_photo: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Has Photo</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.has_color}
                onChange={(e) => setFormData({ ...formData, has_color: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Has Color</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Variant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
