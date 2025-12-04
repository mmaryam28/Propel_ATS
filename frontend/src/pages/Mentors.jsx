import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';

const API = import.meta?.env?.VITE_API_URL || 'http://localhost:3000';

export default function Mentors() {
  const [activeTab, setActiveTab] = useState('mentors'); // 'mentors', 'feedback', 'progress'
  const [relationships, setRelationships] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [progressReports, setProgressReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Invite mentor modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    mentorEmail: '',
    relationshipType: 'mentor',
    canViewProfile: true,
    canViewApplications: true,
    canViewResumes: true,
    canViewCoverLetters: true,
    canProvideFeedback: true,
    notes: ''
  });

  // Progress report modal state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressForm, setProgressForm] = useState({
    relationshipId: '',
    periodStart: '',
    periodEnd: '',
    goalsAchieved: '',
    challengesFaced: '',
    nextSteps: '',
    menteeNotes: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (activeTab === 'mentors') {
        const response = await axios.get(`${API}/mentors`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRelationships(response.data.relationships || []);
      } else if (activeTab === 'feedback') {
        const response = await axios.get(`${API}/mentors/feedback`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFeedback(response.data.feedback || []);
      } else if (activeTab === 'progress') {
        const response = await axios.get(`${API}/mentors/progress-reports`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProgressReports(response.data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleInviteMentor = async () => {
    if (!inviteForm.mentorEmail) {
      showMessage('Please enter mentor email', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/mentors/invite`, inviteForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Show success message with invite link
        const inviteLink = response.data.inviteLink || `${window.location.origin}/mentor-dashboard`;
        
        // Copy link to clipboard if available
        if (navigator.clipboard) {
          navigator.clipboard.writeText(inviteLink);
        }
        
        showMessage('Invitation sent! Invite link copied to clipboard.', 'success');
        setShowInviteModal(false);
        setInviteForm({
          mentorEmail: '',
          relationshipType: 'mentor',
          canViewProfile: true,
          canViewApplications: true,
          canViewResumes: true,
          canViewCoverLetters: true,
          canProvideFeedback: true,
          notes: ''
        });
        
        // Show an alert with the invite link
        setTimeout(() => {
          alert(`Share this link with your mentor:\n\n${inviteLink}\n\nThey should:\n1. Create an account or log in\n2. Visit the link above\n3. Accept your invitation`);
        }, 500);
        
        fetchData();
      } else {
        showMessage(response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error inviting mentor:', error);
      showMessage('Failed to send invitation', 'error');
    }
  };

  const handleRemoveMentor = async (relationshipId) => {
    if (!confirm('Are you sure you want to remove this relationship?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/mentors/${relationshipId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('Mentor relationship removed', 'success');
      fetchData();
    } catch (error) {
      console.error('Error removing mentor:', error);
      showMessage('Failed to remove mentor', 'error');
    }
  };

  const handleCreateProgressReport = async () => {
    if (!progressForm.periodStart || !progressForm.periodEnd) {
      showMessage('Please select report period', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/mentors/progress-report`, progressForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showMessage('Progress report created successfully', 'success');
        setShowProgressModal(false);
        setProgressForm({
          relationshipId: '',
          periodStart: '',
          periodEnd: '',
          goalsAchieved: '',
          challengesFaced: '',
          nextSteps: '',
          menteeNotes: ''
        });
        if (activeTab === 'progress') fetchData();
      } else {
        showMessage(response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error creating progress report:', error);
      showMessage('Failed to create progress report', 'error');
    }
  };

  const handleMarkFeedbackAsRead = async (feedbackId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/mentors/feedback/${feedbackId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Error marking feedback as read:', error);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      ended: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
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
        <h1 className="text-3xl font-bold text-gray-900">Mentors & Career Coaches</h1>
        <p className="text-gray-600 mt-1">
          Collaborate with mentors to receive guided support throughout your job search
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('mentors')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'mentors'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Icon name="user" className="inline mr-2" size="sm" />
          My Mentors
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'feedback'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Icon name="mail" className="inline mr-2" size="sm" />
          Feedback
          {feedback.filter(f => !f.is_read).length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {feedback.filter(f => !f.is_read).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'progress'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Icon name="bar-chart-2" className="inline mr-2" size="sm" />
          Progress Reports
        </button>
      </div>

      {/* Mentors Tab */}
      {activeTab === 'mentors' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Icon name="plus" />
              Invite Mentor/Coach
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Icon name="loading" className="animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : relationships.length === 0 ? (
            <Card className="text-center py-12">
              <Icon name="user" size="xl" className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No mentors yet</h3>
              <p className="text-gray-600 mb-4">Invite a mentor or career coach to help guide your job search</p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                Invite Your First Mentor
              </button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {relationships.map((relationship) => (
                <Card key={relationship.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Icon name="user" className="text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{relationship.mentor_email}</h3>
                          <p className="text-sm text-gray-600">
                            {relationship.relationship_type === 'mentor' ? 'Mentor' : 'Career Coach'}
                          </p>
                        </div>
                        {getStatusBadge(relationship.status)}
                      </div>

                      {relationship.notes && (
                        <p className="text-sm text-gray-600 mt-3 mb-3">{relationship.notes}</p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        {relationship.can_view_profile && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">Profile Access</span>
                        )}
                        {relationship.can_view_applications && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">Applications</span>
                        )}
                        {relationship.can_view_resumes && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">Resumes</span>
                        )}
                        {relationship.can_view_cover_letters && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">Cover Letters</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveMentor(relationship.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="Remove mentor"
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <Icon name="loading" className="animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : feedback.length === 0 ? (
            <Card className="text-center py-12">
              <Icon name="mail" size="xl" className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback yet</h3>
              <p className="text-gray-600">Your mentors will provide feedback and guidance here</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {feedback.map((item) => (
                <Card
                  key={item.id}
                  className={`p-6 ${!item.is_read ? 'border-l-4 border-blue-500' : ''}`}
                  onClick={() => !item.is_read && handleMarkFeedbackAsRead(item.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.subject || `${item.feedback_type} Feedback`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        From: {item.mentor?.firstname} {item.mentor?.lastname} ({item.mentor?.email})
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {!item.is_read && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{item.content}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Progress Reports Tab */}
      {activeTab === 'progress' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowProgressModal(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Icon name="plus" />
              Create Progress Report
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Icon name="loading" className="animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : progressReports.length === 0 ? (
            <Card className="text-center py-12">
              <Icon name="bar-chart-2" size="xl" className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No progress reports yet</h3>
              <p className="text-gray-600 mb-4">Create regular progress reports to share with your mentors</p>
              <button
                onClick={() => setShowProgressModal(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                Create First Report
              </button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {progressReports.map((report) => (
                <Card key={report.id} className="p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Progress Report: {new Date(report.report_period_start).toLocaleDateString()} - {new Date(report.report_period_end).toLocaleDateString()}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{report.applications_submitted}</p>
                      <p className="text-xs text-gray-600">Applications</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{report.interviews_scheduled}</p>
                      <p className="text-xs text-gray-600">Interviews</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{report.interviews_completed}</p>
                      <p className="text-xs text-gray-600">Completed</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{report.offers_received}</p>
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
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Next Steps:</p>
                      <p className="text-sm text-gray-600">{report.next_steps}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Mentor Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Invite Mentor or Coach</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="mentor@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={inviteForm.mentorEmail}
                  onChange={(e) => setInviteForm({ ...inviteForm, mentorEmail: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship Type *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={inviteForm.relationshipType}
                  onChange={(e) => setInviteForm({ ...inviteForm, relationshipType: e.target.value })}
                >
                  <option value="mentor">Mentor</option>
                  <option value="coach">Career Coach</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What can they access?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={inviteForm.canViewProfile}
                      onChange={(e) => setInviteForm({ ...inviteForm, canViewProfile: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">View my profile</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={inviteForm.canViewApplications}
                      onChange={(e) => setInviteForm({ ...inviteForm, canViewApplications: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">View my job applications</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={inviteForm.canViewResumes}
                      onChange={(e) => setInviteForm({ ...inviteForm, canViewResumes: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">View my resumes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={inviteForm.canViewCoverLetters}
                      onChange={(e) => setInviteForm({ ...inviteForm, canViewCoverLetters: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">View my cover letters</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={inviteForm.canProvideFeedback}
                      onChange={(e) => setInviteForm({ ...inviteForm, canProvideFeedback: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Provide feedback and guidance</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Add a personal message or context about this mentoring relationship..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={inviteForm.notes}
                  onChange={(e) => setInviteForm({ ...inviteForm, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteMentor}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Report Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Create Progress Report</h3>
              <button
                onClick={() => setShowProgressModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period Start *
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={progressForm.periodStart}
                    onChange={(e) => setProgressForm({ ...progressForm, periodStart: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period End *
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={progressForm.periodEnd}
                    onChange={(e) => setProgressForm({ ...progressForm, periodEnd: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share with Mentor (optional)
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={progressForm.relationshipId}
                  onChange={(e) => setProgressForm({ ...progressForm, relationshipId: e.target.value })}
                >
                  <option value="">General report (not shared)</option>
                  {relationships.filter(r => r.status === 'active').map(r => (
                    <option key={r.id} value={r.id}>{r.mentor_email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goals Achieved
                </label>
                <textarea
                  rows={3}
                  placeholder="What goals did you accomplish during this period?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={progressForm.goalsAchieved}
                  onChange={(e) => setProgressForm({ ...progressForm, goalsAchieved: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Challenges Faced
                </label>
                <textarea
                  rows={3}
                  placeholder="What obstacles or challenges did you encounter?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={progressForm.challengesFaced}
                  onChange={(e) => setProgressForm({ ...progressForm, challengesFaced: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Steps
                </label>
                <textarea
                  rows={3}
                  placeholder="What are your plans for the next period?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={progressForm.nextSteps}
                  onChange={(e) => setProgressForm({ ...progressForm, nextSteps: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Any other notes or context..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={progressForm.menteeNotes}
                  onChange={(e) => setProgressForm({ ...progressForm, menteeNotes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowProgressModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProgressReport}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                Create Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
