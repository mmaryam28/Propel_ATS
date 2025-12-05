import { useState, useEffect } from 'react';
import { UserGroupIcon, DocumentTextIcon, CheckCircleIcon, ClockIcon, PlusIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { referencesAPI } from '../../api/references';
import ReferenceCard from '../../components/references/ReferenceCard';
import ReferenceModal from '../../components/references/ReferenceModal';
import ReferenceRequestModal from '../../components/references/ReferenceRequestModal';
import ImpactDashboard from '../../components/references/ImpactDashboard';

export default function ReferencesPage() {
  const [references, setReferences] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showImpactDashboard, setShowImpactDashboard] = useState(false);
  const [selectedReference, setSelectedReference] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('references'); // references, requests, impact
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [refsResponse, reqsResponse, statsResponse] = await Promise.all([
        referencesAPI.getAllReferences(),
        referencesAPI.getAllRequests(),
        referencesAPI.getStats(),
      ]);
      setReferences(refsResponse.data || []);
      setRequests(reqsResponse.data || []);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching references:', error);
      setError('Failed to load references. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleReferenceModalClose = (shouldRefresh) => {
    setShowReferenceModal(false);
    const wasEditing = selectedReference !== null;
    setSelectedReference(null);
    if (shouldRefresh) {
      setSuccessMessage(wasEditing ? 'Reference updated successfully!' : 'Reference added successfully!');
      fetchData();
    }
  };

  const handleRequestModalClose = (shouldRefresh) => {
    setShowRequestModal(false);
    setSelectedReference(null);
    setSelectedRequest(null);
    if (shouldRefresh) {
      setSuccessMessage(selectedRequest ? 'Reference request updated successfully!' : 'Reference request created successfully!');
      setActiveTab('requests'); // Switch to requests tab to see the new/updated request
      fetchData();
    }
  };

  const handleEditReference = (reference) => {
    setSelectedReference(reference);
    setShowReferenceModal(true);
  };

  const handleDeleteReference = async (referenceId) => {
    if (!window.confirm('Are you sure you want to delete this reference?')) return;
    
    try {
      await referencesAPI.deleteReference(referenceId);
      fetchData();
    } catch (error) {
      console.error('Error deleting reference:', error);
      alert('Failed to delete reference');
    }
  };

  const handleRequestReference = (reference) => {
    setSelectedReference(reference);
    setSelectedRequest(null); // Clear any selected request
    setShowRequestModal(true);
  };

  const handleEditRequest = (request) => {
    setSelectedReference(request.professional_references);
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Professional References</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImpactDashboard(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            View Impact
          </button>
          <button
            onClick={() => {
              setSelectedReference(null);
              setShowReferenceModal(true);
            }}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Reference
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex justify-between items-center">
          <p>{successMessage}</p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-700 hover:text-green-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total References</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReferences}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedRequests}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('references')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'references'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            References ({references.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Requests ({requests.length})
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      ) : (
        <>
          {/* References Tab */}
          {activeTab === 'references' && (
            <div>
              {references.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No references</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding a professional reference.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowReferenceModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Add Reference
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {references.map((reference) => (
                    <ReferenceCard
                      key={reference.id}
                      reference={reference}
                      onEdit={handleEditReference}
                      onDelete={handleDeleteReference}
                      onRequestReference={handleRequestReference}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div>
              {requests.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Request a reference for a job application.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {request.professional_references?.professional_contacts?.full_name}
                            </h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                request.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : request.status === 'accepted'
                                  ? 'bg-blue-100 text-blue-800'
                                  : request.status === 'declined'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {request.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {request.professional_references?.professional_contacts?.role}
                            {request.professional_references?.professional_contacts?.company &&
                              ` at ${request.professional_references.professional_contacts.company}`}
                          </p>
                          {(() => {
                            // Parse job info from talking_points metadata [JOB:id|title|company]
                            const match = request.talking_points?.match(/\[JOB:([^|]+)\|([^|]+)\|([^\]]+)\]/);
                            if (match) {
                              const [, , jobTitle, jobCompany] = match;
                              return (
                                <p className="text-sm text-gray-700 mt-2">
                                  <span className="font-medium">For:</span>{' '}
                                  <span className="text-blue-600">{jobTitle} at {jobCompany}</span>
                                </p>
                              );
                            }
                            return null;
                          })()}
                          {request.job_applications && (
                            <p className="text-sm text-gray-700 mt-2">
                              <span className="font-medium">For (Legacy):</span>{' '}
                              {request.job_applications.position_title} at{' '}
                              {request.job_applications.company_name}
                            </p>
                          )}
                          {request.due_date && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Due:</span>{' '}
                              {new Date(request.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditRequest(request)}
                            className="text-sm px-3 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              const newStatus = window.prompt(
                                'Enter new status (requested, accepted, declined, completed):',
                                request.status
                              );
                              if (newStatus && ['requested', 'accepted', 'declined', 'completed'].includes(newStatus)) {
                                try {
                                  await referencesAPI.updateRequest(request.id, { status: newStatus });
                                  setSuccessMessage('Status updated successfully!');
                                  fetchData();
                                } catch (err) {
                                  alert('Failed to update status');
                                }
                              }
                            }}
                            className="text-sm px-3 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                          >
                            Status
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Delete this request?')) {
                                try {
                                  await referencesAPI.deleteRequest(request.id);
                                  fetchData();
                                } catch (err) {
                                  alert('Failed to delete request');
                                }
                              }
                            }}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showReferenceModal && (
        <ReferenceModal
          reference={selectedReference}
          onClose={handleReferenceModalClose}
        />
      )}

      {showRequestModal && selectedReference && (
        <ReferenceRequestModal
          reference={selectedReference}
          request={selectedRequest}
          onClose={handleRequestModalClose}
        />
      )}

      {showImpactDashboard && (
        <ImpactDashboard onClose={() => setShowImpactDashboard(false)} />
      )}
    </div>
  );
}
