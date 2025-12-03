import { useState, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, ClockIcon, PlusIcon } from '@heroicons/react/24/outline';
import { informationalInterviewsAPI } from '../../api/networking-events';
import InformationalInterviewModal from '../../components/networking/InformationalInterviewModal';

export default function InformationalInterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [filter, setFilter] = useState('all'); // all, requested, scheduled, completed, declined

  useEffect(() => {
    fetchInterviews();
    fetchStats();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await informationalInterviewsAPI.getAllInterviews();
      setInterviews(response.data || []);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      setError('Failed to load interviews. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await informationalInterviewsAPI.getInterviewStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Don't set error for stats, just log it
    }
  };

  const handleModalClose = (shouldRefresh) => {
    setShowModal(false);
    setSelectedInterview(null);
    if (shouldRefresh) {
      fetchInterviews();
      fetchStats();
    }
  };

  const handleEditInterview = (interview) => {
    setSelectedInterview(interview);
    setShowModal(true);
  };

  const handleDeleteInterview = async (interviewId) => {
    if (!window.confirm('Are you sure you want to delete this interview request?')) return;
    
    try {
      await informationalInterviewsAPI.deleteInterview(interviewId);
      fetchInterviews();
      fetchStats();
    } catch (error) {
      console.error('Error deleting interview:', error);
    }
  };

  const filteredInterviews = interviews.filter(interview => {
    if (filter === 'all') return true;
    return interview.request_status === filter;
  });

  const getStatusBadge = (status) => {
    const badges = {
      requested: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Requested', icon: ClockIcon },
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Scheduled', icon: CalendarIcon },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed', icon: CheckCircleIcon },
      declined: { bg: 'bg-red-100', text: 'text-red-800', label: 'Declined', icon: XCircleIcon },
    };
    const badge = badges[status] || badges.requested;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Informational Interviews</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Request Interview
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button
            onClick={() => { setError(null); fetchInterviews(); fetchStats(); }}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600 mr-3" />
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
                <p className="text-sm text-gray-600">Requested</p>
                <p className="text-2xl font-bold text-gray-900">{stats.requested}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Declined</p>
                <p className="text-2xl font-bold text-gray-900">{stats.declined}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Acceptance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.acceptanceRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'requested', 'scheduled', 'completed', 'declined'].map(filterOption => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-4 py-2 rounded-md capitalize ${
              filter === filterOption
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {filterOption}
          </button>
        ))}
      </div>

      {/* Interviews List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No interviews found. Request your first informational interview!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map(interview => (
            <div
              key={interview.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {interview.professional_contacts?.full_name}
                    </h3>
                    {getStatusBadge(interview.request_status)}
                  </div>
                  <p className="text-gray-600">
                    {interview.professional_contacts?.role}
                    {interview.professional_contacts?.company &&
                      ` at ${interview.professional_contacts.company}`}
                  </p>
                  {interview.professional_contacts?.industry && (
                    <p className="text-sm text-gray-500">
                      Industry: {interview.professional_contacts.industry}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditInterview(interview)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDeleteInterview(interview.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {interview.scheduled_time && (
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span>
                    Scheduled: {new Date(interview.scheduled_time).toLocaleString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}

              {interview.prep_notes && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Preparation Notes:</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{interview.prep_notes}</p>
                </div>
              )}

              {interview.outcome_notes && (
                <div className="mt-4 p-3 bg-green-50 rounded">
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Outcome Notes:</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{interview.outcome_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <InformationalInterviewModal
          interview={selectedInterview}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
