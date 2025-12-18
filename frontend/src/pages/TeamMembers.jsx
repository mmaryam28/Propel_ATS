import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com';

export default function TeamMembers() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'candidate',
  });

  useEffect(() => {
    if (teamId) {
      fetchTeamData();
      fetchMembers();
      fetchInvitations();
    }
  }, [teamId]);

  const fetchTeamData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeam(response.data);
    } catch (err) {
      console.error('Error fetching team:', err);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/teams/${teamId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(response.data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/teams/${teamId}/invitations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvitations(response.data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/teams/${teamId}/invitations`, inviteForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'candidate' });
      fetchInvitations();
      alert('Invitation sent successfully!');
    } catch (err) {
      console.error('Error inviting member:', err);
      alert(err.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/teams/${teamId}/members/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMembers();
    } catch (err) {
      console.error('Error removing member:', err);
      alert('Failed to remove member');
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Changing role for member:', memberId, 'to:', newRole);
      const response = await axios.put(`${API}/teams/${teamId}/members/${memberId}`, 
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Role change response:', response.data);
      alert('Member role updated successfully!');
      fetchMembers();
    } catch (err) {
      console.error('Error changing role:', err);
      console.error('Error details:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to change member role');
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/teams/invitations/${invitationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Invitation cancelled successfully!');
      fetchInvitations();
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      alert(err.response?.data?.message || 'Failed to cancel invitation');
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      mentor: 'bg-blue-100 text-blue-800',
      candidate: 'bg-green-100 text-green-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  const canManageMembers = team?.user_role === 'admin' || team?.user_permissions?.invite_members;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/teams')}
          className="text-blue-600 hover:text-blue-700 mb-4"
        >
          ← Back to Teams
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-black">{team?.name} - Members</h1>
            <p className="text-gray-600">Manage team members and invitations</p>
          </div>
          {canManageMembers && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <span>+</span>
              Invite Member
            </button>
          )}
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Team Members ({members.length})</h2>
        </div>
        <div className="divide-y">
          {members.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No members yet
            </div>
          ) : (
            members.map((member) => {
              const firstName = member.users?.firstname || '';
              const lastName = member.users?.lastname || '';
              const fullName = `${firstName} ${lastName}`.trim() || 'User';
              const initial = firstName?.[0] || lastName?.[0] || member.users?.email?.[0] || '?';
              
              return (
                <div key={member.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      {initial.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {fullName}
                      </div>
                      <div className="text-sm text-gray-700">{member.users?.email}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                <div className="flex items-center gap-4">
                  {canManageMembers ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.id, e.target.value)}
                      className="px-3 py-1 border rounded text-sm"
                    >
                      <option value="admin">Admin</option>
                      <option value="mentor">Mentor</option>
                      <option value="candidate">Candidate</option>
                    </select>
                  ) : (
                    <span className={`px-3 py-1 rounded text-xs font-medium ${getRoleBadge(member.role)}`}>
                      {member.role}
                    </span>
                  )}
                  {canManageMembers && member.role !== 'admin' && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      {canManageMembers && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Pending Invitations</h2>
          </div>
          <div className="divide-y">
            {invitations.filter(inv => inv.status === 'pending').length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No pending invitations
              </div>
            ) : (
              invitations
                .filter(inv => inv.status === 'pending')
                .map((invitation) => (
                  <div key={invitation.id} className="p-6 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{invitation.invitee_email}</div>
                      <div className="text-sm text-gray-500">
                        Invited {new Date(invitation.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Expires {new Date(invitation.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${getRoleBadge(invitation.role)}`}>
                        {invitation.role}
                      </span>
                      <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusBadge(invitation.status)}`}>
                        {invitation.status}
                      </span>
                      <button
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm"
                        title="Cancel invitation"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Invite Team Member</h2>
            <form onSubmit={handleInviteMember}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Email Address *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="colleague@example.com"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Role *</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="candidate">Candidate - Job seeker with limited access</option>
                  <option value="mentor">Mentor - Can view all candidates and analytics</option>
                  <option value="admin">Admin - Full team management access</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-6 text-sm text-blue-800">
                An invitation email will be sent to this address with a link to join the team.
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteForm({ email: '', role: 'candidate' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
