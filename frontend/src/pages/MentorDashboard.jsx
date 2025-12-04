import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { useParams, useNavigate } from 'react-router-dom';

const API = import.meta?.env?.VITE_API_URL || 'http://localhost:3000';

export default function MentorDashboard() {
  const { menteeId } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'applications', 'progress', 'feedback'
  const [mentees, setMentees] = useState([]);
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [menteeProfile, setMenteeProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [progressReports, setProgressReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Feedback form state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    feedbackType: 'general',
    subject: '',
    content: '',
    referenceType: '',
    referenceId: ''
  });

  useEffect(() => {
    // Check if there's an invitation token in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const relationshipId = urlParams.get('relationshipId');
    
    if (token && relationshipId) {
      acceptInvitation(relationshipId);
    } else {
      fetchMyMentees();
    }
  }, []);

  useEffect(() => {
    if (menteeId) {
      const mentee = mentees.find(m => m.mentee?.id === menteeId);
      if (mentee) {
        setSelectedMentee(mentee);
        fetchMenteeData(menteeId);
      }
    } else if (mentees.length > 0) {
      // Auto-select first mentee if none selected
      const firstMentee = mentees[0];
      navigate(`/mentor-dashboard/${firstMentee.mentee?.id}`);
    }
  }, [menteeId, mentees]);

  const acceptInvitation = async (relationshipId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/mentors/accept/${relationshipId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('Invitation accepted successfully!', 'success');
      // Clear URL parameters
      window.history.replaceState({}, document.title, '/mentor-dashboard');
      // Fetch mentees after accepting
      fetchMyMentees();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      showMessage(error.response?.data?.message || 'Failed to accept invitation', 'error');
      setLoading(false);
    }
  };

  const fetchMyMentees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/mentors/my-mentees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMentees(response.data.mentees || []);
    } catch (error) {
      console.error('Error fetching mentees:', error);
      showMessage('Failed to load mentees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenteeData = async (menteeUserId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Fetch profile
      const profileRes = await axios.get(`${API}/mentors/mentee/${menteeUserId}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenteeProfile(profileRes.data.profile);

      // Fetch applications if permitted
      if (selectedMentee?.can_view_applications) {
        const appsRes = await axios.get(`${API}/mentors/mentee/${menteeUserId}/applications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setApplications(appsRes.data.applications || []);
      }

      // Fetch progress reports
      const reportsRes = await axios.get(`${API}/mentors/mentee/${menteeUserId}/progress-reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProgressReports(reportsRes.data.reports || []);

    } catch (error) {
      console.error('Error fetching mentee data:', error);
      showMessage('Failed to load mentee data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleProvideFeedback = async () => {
    if (!feedbackForm.content) {
      showMessage('Please enter feedback content', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/mentors/mentee/${menteeId}/feedback`,
        feedbackForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showMessage('Feedback sent successfully', 'success');
        setShowFeedbackModal(false);
        setFeedbackForm({
          feedbackType: 'general',
          subject: '',
          content: '',
          referenceType: '',
          referenceId: ''
        });
      } else {
        showMessage(response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error providing feedback:', error);
      showMessage('Failed to send feedback', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      applied: 'bg-blue-100 text-blue-800',
      interview_scheduled: 'bg-purple-100 text-purple-800',
      interviewed: 'bg-yellow-100 text-yellow-800',
      offer: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      accepted: 'bg-green-600 text-white',
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.applied}`}>
        {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
      </span>
    );
  };

  const getApplicationStats = () => {
    if (!applications.length) return { total: 0, interviews: 0, offers: 0, pending: 0 };
    
    return {
      total: applications.length,
      interviews: applications.filter(a => ['interview_scheduled', 'interviewed'].includes(a.status)).length,
      offers: applications.filter(a => a.status === 'offer').length,
      pending: applications.filter(a => a.status === 'applied').length,
    };
  };

  if (loading && mentees.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Icon name="loading" className="animate-spin mx-auto mb-2" size="xl" />
          <p className="text-gray-600">Loading your mentees...</p>
        </div>
      </div>
    );
  }

  if (mentees.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <Icon name="user" size="xl" className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Mentees Yet</h3>
          <p className="text-gray-600">You haven't been invited to mentor anyone yet.</p>
        </Card>
      </div>
    );
  }

  const stats = getApplicationStats();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Toast notification */}
      {message && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
            message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mentor Dashboard</h1>
        <p className="text-gray-600 mt-1">Guide and support your mentees in their job search journey</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Mentee List */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Your Mentees</h3>
            <div className="space-y-2">
              {mentees.map((mentee) => (
                <button
                  key={mentee.id}
                  onClick={() => navigate(`/mentor-dashboard/${mentee.mentee?.id}`)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedMentee?.id === mentee.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {mentee.mentee?.profile_picture ? (
                      <img
                        src={mentee.mentee.profile_picture}
                        alt={`${mentee.mentee.firstname} ${mentee.mentee.lastname}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Icon name="user" className="text-blue-600" size="sm" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {mentee.mentee?.firstname} {mentee.mentee?.lastname}
                      </p>
                      <p className="text-xs text-gray-600 truncate">{mentee.mentee?.title || 'Job Seeker'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {!selectedMentee ? (
            <Card className="text-center py-12">
              <p className="text-gray-600">Select a mentee to view their progress</p>
            </Card>
          ) : (
            <>
              {/* Mentee Header */}
              <Card className="mb-6 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {menteeProfile?.profile_picture ? (
                      <img
                        src={menteeProfile.profile_picture}
                        alt={`${menteeProfile.firstname} ${menteeProfile.lastname}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                        <Icon name="user" className="text-blue-600" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {menteeProfile?.firstname} {menteeProfile?.lastname}
                      </h2>
                      <p className="text-gray-600">{menteeProfile?.title}</p>
                      <p className="text-sm text-gray-500">{menteeProfile?.location}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    disabled={!selectedMentee.can_provide_feedback}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Icon name="mail" />
                    Provide Feedback
                  </button>
                </div>

                {menteeProfile?.bio && (
                  <p className="text-gray-700 mt-4">{menteeProfile.bio}</p>
                )}
              </Card>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 font-medium transition ${
                    activeTab === 'overview'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon name="home" className="inline mr-2" size="sm" />
                  Overview
                </button>
                {selectedMentee.can_view_applications && (
                  <button
                    onClick={() => setActiveTab('applications')}
                    className={`px-4 py-2 font-medium transition ${
                      activeTab === 'applications'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon name="job" className="inline mr-2" size="sm" />
                    Applications ({applications.length})
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('progress')}
                  className={`px-4 py-2 font-medium transition ${
                    activeTab === 'progress'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon name="chart" className="inline mr-2" size="sm" />
                  Progress Reports
                </button>
              </div>

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                      <p className="text-sm text-gray-600">Total Applications</p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-3xl font-bold text-purple-600">{stats.interviews}</p>
                      <p className="text-sm text-gray-600">Interviews</p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-3xl font-bold text-green-600">{stats.offers}</p>
                      <p className="text-sm text-gray-600">Offers</p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                      <p className="text-sm text-gray-600">Pending</p>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Recent Applications</h3>
                    {applications.length === 0 ? (
                      <p className="text-gray-600 text-center py-8">No applications yet</p>
                    ) : (
                      <div className="space-y-3">
                        {applications.slice(0, 5).map((app) => (
                          <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{app.job_title}</p>
                              <p className="text-sm text-gray-600">{app.company_name}</p>
                              <p className="text-xs text-gray-500">
                                Applied: {new Date(app.applied_at).toLocaleDateString()}
                              </p>
                            </div>
                            {getStatusBadge(app.status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Latest Progress Report */}
                  {progressReports.length > 0 && (
                    <Card className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Latest Progress Report</h3>
                      {(() => {
                        const latest = progressReports[0];
                        return (
                          <div>
                            <p className="text-sm text-gray-600 mb-3">
                              Period: {new Date(latest.report_period_start).toLocaleDateString()} - {new Date(latest.report_period_end).toLocaleDateString()}
                            </p>
                            <div className="grid grid-cols-4 gap-3 mb-4">
                              <div className="bg-blue-50 p-3 rounded">
                                <p className="text-xl font-bold text-blue-600">{latest.applications_submitted}</p>
                                <p className="text-xs text-gray-600">Applications</p>
                              </div>
                              <div className="bg-purple-50 p-3 rounded">
                                <p className="text-xl font-bold text-purple-600">{latest.interviews_scheduled}</p>
                                <p className="text-xs text-gray-600">Interviews</p>
                              </div>
                              <div className="bg-yellow-50 p-3 rounded">
                                <p className="text-xl font-bold text-yellow-600">{latest.interviews_completed}</p>
                                <p className="text-xs text-gray-600">Completed</p>
                              </div>
                              <div className="bg-green-50 p-3 rounded">
                                <p className="text-xl font-bold text-green-600">{latest.offers_received}</p>
                                <p className="text-xs text-gray-600">Offers</p>
                              </div>
                            </div>
                            {latest.goals_achieved && (
                              <div className="mb-2">
                                <p className="text-sm font-medium text-gray-700">Goals Achieved:</p>
                                <p className="text-sm text-gray-600">{latest.goals_achieved}</p>
                              </div>
                            )}
                            {latest.challenges_faced && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Challenges:</p>
                                <p className="text-sm text-gray-600">{latest.challenges_faced}</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </Card>
                  )}
                </div>
              )}

              {/* Applications Tab */}
              {activeTab === 'applications' && selectedMentee.can_view_applications && (
                <div className="space-y-4">
                  {applications.length === 0 ? (
                    <Card className="text-center py-12">
                      <Icon name="job" size="xl" className="mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">No applications yet</p>
                    </Card>
                  ) : (
                    applications.map((app) => (
                      <Card key={app.id} className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg">{app.job_title}</h3>
                            <p className="text-gray-600">{app.company_name}</p>
                            <p className="text-sm text-gray-500 mt-1">{app.location}</p>
                          </div>
                          {getStatusBadge(app.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Applied:</span> {new Date(app.applied_at).toLocaleDateString()}
                          </div>
                          {app.salary_range && (
                            <div>
                              <span className="font-medium">Salary:</span> {app.salary_range}
                            </div>
                          )}
                        </div>
                        {app.notes && (
                          <p className="text-sm text-gray-700 mt-3 p-3 bg-gray-50 rounded">{app.notes}</p>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* Progress Reports Tab */}
              {activeTab === 'progress' && (
                <div className="space-y-4">
                  {progressReports.length === 0 ? (
                    <Card className="text-center py-12">
                      <Icon name="chart" size="xl" className="mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">No progress reports yet</p>
                    </Card>
                  ) : (
                    progressReports.map((report) => (
                      <Card key={report.id} className="p-6">
                        <div className="mb-4">
                          <h3 className="font-semibold text-gray-900">
                            {new Date(report.report_period_start).toLocaleDateString()} - {new Date(report.report_period_end).toLocaleDateString()}
                          </h3>
                          <p className="text-xs text-gray-500">
                            Created: {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-2xl font-bold text-blue-600">{report.applications_submitted}</p>
                            <p className="text-xs text-gray-600">Applications</p>
                          </div>
                          <div className="bg-purple-50 p-3 rounded">
                            <p className="text-2xl font-bold text-purple-600">{report.interviews_scheduled}</p>
                            <p className="text-xs text-gray-600">Scheduled</p>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded">
                            <p className="text-2xl font-bold text-yellow-600">{report.interviews_completed}</p>
                            <p className="text-xs text-gray-600">Completed</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-2xl font-bold text-green-600">{report.offers_received}</p>
                            <p className="text-xs text-gray-600">Offers</p>
                          </div>
                        </div>

                        {report.goals_achieved && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Goals Achieved:</p>
                            <p className="text-sm text-gray-600">{report.goals_achieved}</p>
                          </div>
                        )}

                        {report.challenges_faced && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Challenges Faced:</p>
                            <p className="text-sm text-gray-600">{report.challenges_faced}</p>
                          </div>
                        )}

                        {report.next_steps && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Next Steps:</p>
                            <p className="text-sm text-gray-600">{report.next_steps}</p>
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Provide Feedback</h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={feedbackForm.feedbackType}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, feedbackType: e.target.value })}
                >
                  <option value="general">General Guidance</option>
                  <option value="resume">Resume Feedback</option>
                  <option value="cover_letter">Cover Letter Feedback</option>
                  <option value="application">Application Strategy</option>
                  <option value="interview">Interview Preparation</option>
                  <option value="strategy">Job Search Strategy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject (optional)
                </label>
                <input
                  type="text"
                  placeholder="Brief summary of your feedback"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={feedbackForm.subject}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback Content *
                </label>
                <textarea
                  rows={8}
                  placeholder="Share your guidance, suggestions, or feedback..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={feedbackForm.content}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, content: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleProvideFeedback}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                Send Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
