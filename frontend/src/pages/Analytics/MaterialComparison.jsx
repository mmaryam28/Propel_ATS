import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import * as api from '../../lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function MaterialComparison() {
  const [jobsList, setJobsList] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [assignJobLoading, setAssignJobLoading] = useState(false);
  const [assignJobError, setAssignJobError] = useState('');
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [abExperiments, setAbExperiments] = useState([]);
  const [abDashboardData, setAbDashboardData] = useState(null);
  const [abLoading, setAbLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [resumeVersions, setResumeVersions] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [showAssignJobModal, setShowAssignJobModal] = useState(false);
  const [showTrackResponseModal, setShowTrackResponseModal] = useState(false);
  const [trackResponseLoading, setTrackResponseLoading] = useState(false);
  const [selectedResponseJobId, setSelectedResponseJobId] = useState('');
  const [responseType, setResponseType] = useState('interview_invite');
  const [responseDate, setResponseDate] = useState('');
  const [trackResponseError, setTrackResponseError] = useState('');
  const [versionsLoading, setVersionsLoading] = useState(false);

  useEffect(() => {
    fetchAbExperiments();
    fetchJobs();
    fetchResumeAndCoverLetterVersions();
  }, []);

  const fetchResumeAndCoverLetterVersions = async () => {
    try {
      const [resumes, letters] = await Promise.all([
        api.getResumeVersions(),
        api.getCoverLetters()
      ]);
      setResumeVersions(resumes);
      setCoverLetters(letters);
    } catch (error) {
      console.error('Error fetching material versions:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch((import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + '/jobs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setJobsList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobsList([]);
    }
  };

  const fetchAbExperiments = async () => {
    try {
      setAbLoading(true);
      const experiments = await api.getExperiments();
      setAbExperiments(experiments);
      if (experiments.length > 0 && !selectedExperiment) {
        setSelectedExperiment(experiments[0]);
        fetchAbDashboard(experiments[0].id);
      }
    } catch (error) {
      console.error('Error fetching experiments:', error);
    } finally {
      setAbLoading(false);
    }
  };

  const fetchAbDashboard = async (experimentId) => {
    try {
      const dashboard = await api.getExperimentDashboard(experimentId);
      
      // Transform results to include variant_name for the chart
      if (dashboard.results) {
        dashboard.results = dashboard.results.map(result => ({
          ...result,
          variant_name: result.variant?.name || result.variant?.id || 'Unknown'
        }));
      }
      
      console.log('Dashboard data with transformed results:', dashboard);
      setAbDashboardData(dashboard);
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
        setSelectedExperiment({ ...selectedExperiment, status });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAssignJob = async () => {
    if (!selectedJobId) return;
    try {
      setAssignJobLoading(true);
      setAssignJobError('');
      await api.assignVariantToJob(selectedExperiment.id, selectedJobId, selectedVariantId);
      setShowAssignJobModal(false);
      setSelectedJobId('');
      setSelectedVariantId(null);
      fetchAbDashboard(selectedExperiment.id);
    } catch (error) {
      console.error('Error assigning job:', error);
      setAssignJobError(error.message || 'Failed to assign job');
    } finally {
      setAssignJobLoading(false);
    }
  };

  const handleTrackResponse = async () => {
    try {
      setTrackResponseLoading(true);
      setTrackResponseError('');
      
      console.log('Tracking response for job:', selectedResponseJobId, 'with type:', responseType);
      
      // Map frontend response types to backend format
      const isOffer = responseType === 'offer';
      const actualResponseType = isOffer ? 'interview_invite' : responseType;
      
      const responsePayload = {
        response_type: actualResponseType,
        response_received_at: responseDate ? new Date(responseDate) : new Date(),
        reached_interview: responseType === 'interview_invite' || isOffer,
        interview_date: (responseType === 'interview_invite' || isOffer) && responseDate ? new Date(responseDate) : undefined,
        reached_offer: isOffer,
        offer_date: isOffer && responseDate ? new Date(responseDate) : undefined,
      };
      
      console.log('Response payload:', responsePayload);
      
      const result = await api.trackResponse(selectedResponseJobId, responsePayload);
      console.log('Track response result:', result);
      
      setShowTrackResponseModal(false);
      setSelectedResponseJobId('');
      setResponseType('interview_invite');
      setResponseDate('');
      setSelectedVariantId(null);
      
      // Refresh dashboard to show updated counts
      await fetchAbDashboard(selectedExperiment.id);
      console.log('Dashboard refreshed');
    } catch (error) {
      console.error('Error tracking response:', error);
      console.error('Error details:', error.response?.data || error.message);
      setTrackResponseError(error.response?.data?.message || error.message || 'Failed to track response');
    } finally {
      setTrackResponseLoading(false);
    }
  };

  const handleCalculateResults = async (experimentId) => {
    try {
      console.log('Calculating results for experiment:', experimentId);
      const result = await api.calculateResults(experimentId);
      console.log('Calculate results response:', result);
      await fetchAbDashboard(experimentId);
      console.log('Dashboard refreshed after calculation');
    } catch (error) {
      console.error('Error calculating results:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <Card.Body>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Application Material Comparison</h2>
              <p className="text-gray-600 mt-1">Compare different versions of your resume and cover letter</p>
              <p className="text-sm text-blue-600 mt-2">
                💡 Note: Meaningful comparisons require 10+ applications per version
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
            >
              + Create New Version
            </button>
          </div>
        </Card.Body>
      </Card>

      {abLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : abExperiments.length === 0 ? (
        <Card>
          <Card.Body>
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Material Versions Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first resume or cover letter version to start tracking performance
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create First Version
              </button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Material Versions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {abExperiments.map((version) => (
              <Card 
                key={version.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedExperiment(version);
                  fetchAbDashboard(version.id);
                }}
              >
                <Card.Body>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{version.experiment_name}</h3>
                      <span className="inline-block mt-1 px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 capitalize">
                        {version.material_type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      version.status === 'active' ? 'bg-green-100 text-green-800' :
                      version.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {version.status}
                    </span>
                  </div>
                  {version.notes && (
                    <p className="text-sm text-gray-600 mb-3">{version.notes}</p>
                  )}
                  <div className="text-sm text-gray-500">
                    Click to view performance details
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>

          {/* Selected Version Details */}
          {selectedExperiment && abDashboardData && (
            <div className="space-y-6 mt-6">
              {/* Version Header */}
              <Card>
                <Card.Body>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedExperiment.experiment_name}
                      </h2>
                      <span className="inline-block mt-2 px-3 py-1 text-sm rounded bg-blue-100 text-blue-800 capitalize">
                        {selectedExperiment.material_type.replace('_', ' ')}
                      </span>
                      {selectedExperiment.notes && (
                        <p className="text-gray-600 mt-2">{selectedExperiment.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCalculateResults(selectedExperiment.id)}
                        className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Calculate Results
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedExperiment.id, 
                          selectedExperiment.status === 'active' ? 'completed' : 'active')}
                        className={`px-4 py-2 text-sm rounded-lg ${
                          selectedExperiment.status === 'active'
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {selectedExperiment.status === 'active' ? 'Mark Inactive' : 'Mark Active'}
                      </button>
                      <button
                        onClick={() => setShowAddVariantModal(true)}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        + Add Sub-Version
                      </button>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <Card>
                  <Card.Body>
                    <div className="text-sm text-gray-600">Total Applications</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {abDashboardData.summary?.total_applications || 0}
                    </div>
                  </Card.Body>
                </Card>
                <Card>
                  <Card.Body>
                    <div className="text-sm text-gray-600">Responses</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                      {abDashboardData.summary?.total_responses || 0}
                    </div>
                  </Card.Body>
                </Card>
                <Card>
                  <Card.Body>
                    <div className="text-sm text-gray-600">Response Rate</div>
                    <div className="text-2xl font-bold text-blue-600 mt-1">
                      {abDashboardData.summary?.response_rate?.toFixed(1) || 0.0}%
                    </div>
                  </Card.Body>
                </Card>
                <Card>
                  <Card.Body>
                    <div className="text-sm text-gray-600">Variants</div>
                    <div className="text-2xl font-bold text-purple-600 mt-1">
                      {abDashboardData.summary?.total_variants || 0}
                    </div>
                  </Card.Body>
                </Card>
              </div>

              {/* Variants List */}
              {abDashboardData.experiment?.variants && abDashboardData.experiment.variants.length > 0 && (
                <Card>
                  <Card.Header>
                    <Card.Title>Variants ({abDashboardData.experiment.variants.length})</Card.Title>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Variant Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Description
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Applications
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {abDashboardData.experiment.variants.map((variant) => {
                            const variantApps = abDashboardData.applications?.filter(app => app.variant_id === variant.id) || [];
                            return (
                              <tr key={variant.id}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {variant.variant_name}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  {variant.format_type || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  {variant.description || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  {variantApps.length} job{variantApps.length !== 1 ? 's' : ''}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedExperiment(abDashboardData.experiment);
                                        setSelectedVariantId(variant.id);
                                        setShowAssignJobModal(true);
                                      }}
                                      className="text-yellow-600 hover:text-yellow-700 font-medium"
                                    >
                                      Assign Job
                                    </button>
                                    {variantApps.length > 0 && (
                                      <button
                                        onClick={() => {
                                          setSelectedExperiment(abDashboardData.experiment);
                                          setSelectedVariantId(variant.id);
                                          setShowTrackResponseModal(true);
                                        }}
                                        className="text-pink-600 hover:text-pink-700 font-medium"
                                      >
                                        Track Response
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleArchiveVariant(variant.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      Archive
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* Performance Chart */}
              <Card>
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
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Material Version</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleCreateExperiment({
                  experiment_name: formData.get('experiment_name'),
                  material_type: formData.get('material_type'),
                  minimum_sample_size: 10,
                  notes: formData.get('notes'),
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Version Name (e.g., "Version A", "Resume Modern")
                  </label>
                  <input
                    type="text"
                    name="experiment_name"
                    required
                    placeholder="Version A"
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
                    Description (optional)
                  </label>
                  <textarea
                    name="notes"
                    rows="3"
                    placeholder="e.g., Modern design with skills section highlighted"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Track at least 10 applications per version for meaningful comparison
                  </p>
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
                  Create Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Track Response Modal */}
      {showTrackResponseModal && selectedExperiment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Track Response for Assigned Job</h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleTrackResponse();
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Assigned Job</label>
                  <select
                    value={selectedResponseJobId}
                    onChange={e => setSelectedResponseJobId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a job...</option>
                    {abDashboardData?.applications
                      ?.filter(app => app.variant_id === selectedVariantId)
                      ?.map(app => (
                        <option key={app.job_id} value={app.job_id}>
                          {jobsList.find(j => j.id === app.job_id)?.title || `Job ${app.job_id}`}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Response Type</label>
                  <select
                    value={responseType}
                    onChange={e => setResponseType(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="interview_invite">Interview Invite</option>
                    <option value="offer">Offer</option>
                    <option value="rejection">Rejection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Response Date</label>
                  <input
                    type="date"
                    value={responseDate}
                    onChange={e => setResponseDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                {trackResponseError && (
                  <div className="text-red-600 text-sm">{trackResponseError}</div>
                )}
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowTrackResponseModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={trackResponseLoading}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  {trackResponseLoading ? 'Tracking...' : 'Track Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Job Modal */}
      {showAssignJobModal && selectedExperiment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Assign Job to Experiment</h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAssignJob();
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Job</label>
                  <select
                    value={selectedJobId}
                    onChange={e => setSelectedJobId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a job...</option>
                    {jobsList.map(job => (
                      <option key={job.id} value={job.id}>
                        {job.title} @ {job.company}
                      </option>
                    ))}
                  </select>
                </div>
                {assignJobError && (
                  <div className="text-red-600 text-sm">{assignJobError}</div>
                )}
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAssignJobModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignJobLoading}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                >
                  {assignJobLoading ? 'Assigning...' : 'Assign Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Sub-Version Modal */}
      {showAddVariantModal && selectedExperiment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Sub-Version</h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleAddVariant({
                  variant_name: formData.get('variant_name'),
                  resume_version_id: formData.get('resume_version_id') || undefined,
                  cover_letter_version_id: formData.get('cover_letter_version_id') || undefined,
                  description: formData.get('description'),
                  design_style: formData.get('design_style'),
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variant Name *
                  </label>
                  <input
                    type="text"
                    name="variant_name"
                    required
                    placeholder="e.g., Variant A - Blue Theme"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {(selectedExperiment.material_type === 'resume' || selectedExperiment.material_type === 'both') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resume Version {selectedExperiment.material_type !== 'both' && '*'}
                    </label>
                    <select
                      name="resume_version_id"
                      required={selectedExperiment.material_type === 'resume'}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select resume...</option>
                      {resumeVersions.map(resume => (
                        <option key={resume.id} value={resume.id}>
                          {resume.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {(selectedExperiment.material_type === 'cover_letter' || selectedExperiment.material_type === 'both') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cover Letter Version {selectedExperiment.material_type !== 'both' && '*'}
                    </label>
                    <select
                      name="cover_letter_version_id"
                      required={selectedExperiment.material_type === 'cover_letter'}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select cover letter...</option>
                      {coverLetters.map(letter => (
                        <option key={letter.id} value={letter.id}>
                          {letter.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Describe what makes this variant unique..."
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
                    placeholder="e.g., Modern, Classic, Creative"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
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
                  Add Sub-Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaterialComparison;
