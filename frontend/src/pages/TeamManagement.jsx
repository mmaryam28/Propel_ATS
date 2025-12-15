import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function TeamManagement() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subscriptionType: 'free',
    billingEmail: '',
  });

  useEffect(() => {
    fetchTeams();
    fetchPendingInvitations();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeams(response.data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/teams/invitations/my-invitations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingInvitations(response.data.filter(inv => inv.status === 'pending') || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    }
  };

  const handleAcceptInvitation = async (invitationToken) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/teams/invitations/accept`, 
        { token: invitationToken },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Invitation accepted! Refreshing teams...');
      fetchTeams();
      fetchPendingInvitations();
    } catch (err) {
      console.error('Error accepting invitation:', err);
      alert(err.response?.data?.message || 'Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (invitationToken) => {
    if (!confirm('Are you sure you want to decline this invitation?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/teams/invitations/${invitationToken}/decline`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Invitation declined');
      fetchPendingInvitations();
    } catch (err) {
      console.error('Error declining invitation:', err);
      alert('Failed to decline invitation');
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      console.log('Sending team data:', formData);
      const token = localStorage.getItem('token');
      await axios.post(`${API}/teams`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowCreateModal(false);
      setFormData({ name: '', description: '', subscriptionType: 'free', billingEmail: '' });
      fetchTeams();
    } catch (err) {
      console.error('Error creating team:', err);
      alert('Failed to create team');
    }
  };

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/teams/${selectedTeam.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowEditModal(false);
      setSelectedTeam(null);
      setFormData({ name: '', description: '', subscriptionType: 'free', billingEmail: '' });
      fetchTeams();
    } catch (err) {
      console.error('Error updating team:', err);
      alert('Failed to update team');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTeams();
    } catch (err) {
      console.error('Error deleting team:', err);
      alert('Failed to delete team');
    }
  };

  const openEditModal = (team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      description: team.description || '',
      subscriptionType: team.subscription_type,
      billingEmail: team.billing_email || '',
    });
    setShowEditModal(true);
  };

  const getSubscriptionBadge = (type) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type] || colors.free;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-black">Team Management</h1>
          <p className="text-gray-600">Create and manage team accounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span>
          Create Team
        </button>
      </div>

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Pending Team Invitations ({pendingInvitations.length})
          </h2>
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="bg-white rounded-lg p-4 flex items-center justify-between shadow">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{invitation.teams?.name}</h3>
                  <p className="text-sm text-gray-600">
                    Role: <span className="font-medium capitalize">{invitation.role}</span>
                  </p>
                  {invitation.teams?.description && (
                    <p className="text-sm text-gray-500 mt-1">{invitation.teams.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Invited {new Date(invitation.created_at).toLocaleDateString()} • 
                    Expires {new Date(invitation.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleAcceptInvitation(invitation.token)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDeclineInvitation(invitation.token)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {teams.length === 0 && pendingInvitations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">You haven't created any teams yet and have no pending invitations</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Your First Team
          </button>
        </div>
      ) : teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div key={team.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-black">{team.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getSubscriptionBadge(team.subscription_type)}`}>
                  {team.subscription_type}
                </span>
              </div>
              
              {team.description && (
                <p className="text-gray-600 mb-4 text-sm">{team.description}</p>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <span>👥 {team.member_count} members</span>
                <span>•</span>
                <span className={`${team.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {team.subscription_status}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/teams/${team.id}/dashboard`)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate(`/teams/${team.id}/members`)}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                >
                  Members
                </button>
              </div>

              {team.user_role === 'admin' && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => openEditModal(team)}
                    className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Create New Team</h2>
            <form onSubmit={handleCreateTeam}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Team Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Subscription Type</label>
                <select
                  value={formData.subscriptionType}
                  onChange={(e) => setFormData({ ...formData, subscriptionType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free">Free (5 members)</option>
                  <option value="basic">Basic (10 members)</option>
                  <option value="premium">Premium (50 members)</option>
                  <option value="enterprise">Enterprise (100 members)</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Billing Email</label>
                <input
                  type="email"
                  value={formData.billingEmail}
                  onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', description: '', subscriptionType: 'free', billingEmail: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Edit Team</h2>
            <form onSubmit={handleUpdateTeam}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Team Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Subscription Type</label>
                <select
                  value={formData.subscriptionType}
                  onChange={(e) => setFormData({ ...formData, subscriptionType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free">Free (5 members)</option>
                  <option value="basic">Basic (10 members)</option>
                  <option value="premium">Premium (50 members)</option>
                  <option value="enterprise">Enterprise (100 members)</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Billing Email</label>
                <input
                  type="email"
                  value={formData.billingEmail}
                  onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTeam(null);
                    setFormData({ name: '', description: '', subscriptionType: 'free', billingEmail: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
